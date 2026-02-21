const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

// Bypass SSL certificate validation for Supabase in production
if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wedding-registry-secret-2026';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Database connection
const dbConfig = { connectionString: process.env.DATABASE_URL };
if (process.env.DATABASE_URL) {
    dbConfig.ssl = { rejectUnauthorized: false, checkServerIdentity: () => undefined };
}
const pool = new Pool(dbConfig);
pool.on('error', (err) => console.error('Unexpected database error:', err));

const query = (text, params) => pool.query(text, params);

// ============================================================
// MIDDLEWARE
// ============================================================

// Authenticate JWT token (uses new `users` table)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Resolve registry slug to registry object
const resolveRegistry = async (req, res, next) => {
    const { slug } = req.params;
    try {
        const { rows } = await query('SELECT * FROM registries WHERE slug = $1', [slug]);
        if (!rows[0]) return res.status(404).json({ error: 'Registry not found' });
        req.registry = rows[0];
        next();
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve registry' });
    }
};

// Verify authenticated user has access to this registry
const requireRegistryAccess = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const registryId = req.registry.id;
        const { rows } = await query(
            'SELECT role FROM registry_members WHERE user_id = $1 AND registry_id = $2',
            [userId, registryId]
        );
        if (!rows[0]) return res.status(403).json({ error: 'No access to this registry' });
        req.memberRole = rows[0].role;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Failed to check registry access' });
    }
};

// ============================================================
// HELPER: Fetch gifts with reservations for a registry
// ============================================================
const fetchGiftsForRegistry = async (registryId) => {
    const q = `
        SELECT
            g.*,
            COALESCE(SUM(pr.amount_reserved), 0) as total_reserved_amount,
            COALESCE(SUM(pr.percentage_reserved), 0) as total_reserved_percentage,
            CASE WHEN SUM(pr.percentage_reserved) >= 100 THEN 1 ELSE 0 END as is_fully_reserved,
            COUNT(pr.id) as reserved_count
        FROM gifts g
        LEFT JOIN partial_reservations pr ON g.id = pr.gift_id
        WHERE g.registry_id = $1
        GROUP BY g.id
        ORDER BY g.id
    `;
    const { rows: gifts } = await query(q, [registryId]);

    return Promise.all(gifts.map(async (gift) => {
        const { rows: reservations } = await query(`
            SELECT pr.*, gu.name as guest_name, gu.email as guest_email
            FROM partial_reservations pr
            JOIN guests gu ON pr.guest_id = gu.id
            WHERE pr.gift_id = $1
            ORDER BY pr.reserved_at
        `, [gift.id]);

        return {
            ...gift,
            price: parseFloat(gift.price),
            total_reserved_amount: parseFloat(gift.total_reserved_amount),
            total_reserved_percentage: parseFloat(gift.total_reserved_percentage),
            is_fully_reserved: parseInt(gift.is_fully_reserved),
            reserved_count: parseInt(gift.reserved_count),
            reservations: reservations.map(r => ({
                ...r,
                amount_reserved: parseFloat(r.amount_reserved),
                percentage_reserved: parseFloat(r.percentage_reserved)
            }))
        };
    }));
};

// ============================================================
// AUTH ROUTES
// ============================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const { rows } = await query(
            'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name',
            [email, passwordHash, displayName || null]
        );

        const user = rows[0];
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (email-based, uses users table)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
    } catch (err) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Legacy admin login (backward compatibility for existing admin.html)
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        // Try users table first (by email), then fall back to legacy admins table
        let user = null;
        const { rows: userRows } = await query('SELECT * FROM users WHERE email = $1', [username]);

        if (userRows[0]) {
            user = userRows[0];
            if (!(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ token, username: user.display_name || user.email });
        }

        // Legacy admins table fallback
        const { rows: adminRows } = await query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = adminRows[0];
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: admin.id, username: admin.username, legacy: true }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Get current user's registries
app.get('/api/my/registries', authenticateToken, async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT r.*, rm.role
            FROM registries r
            JOIN registry_members rm ON r.id = rm.registry_id
            WHERE rm.user_id = $1
            ORDER BY r.created_at DESC
        `, [req.user.userId]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// REGISTRY ROUTES
// ============================================================

// Create a new registry
app.post('/api/registries', authenticateToken, async (req, res) => {
    const {
        slug, partner1Name, partner2Name, coupleDisplayName,
        eventDate, eventLocation, eventVenue,
        heroHeading, heroSubheading, thankYouMessage,
        primaryCurrency, secondaryCurrency, exchangeRate,
        themePrimaryColor, themeSecondaryColor, themeFontFamily,
        categories
    } = req.body;

    if (!slug || !partner1Name || !partner2Name) {
        return res.status(400).json({ error: 'Slug, partner1Name, and partner2Name are required' });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }

    try {
        const existing = await query('SELECT id FROM registries WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'This registry URL is already taken' });
        }

        const { rows } = await query(`
            INSERT INTO registries (
                slug, partner1_name, partner2_name, couple_display_name,
                event_date, event_location, event_venue,
                hero_heading, hero_subheading, thank_you_message,
                primary_currency, secondary_currency, exchange_rate,
                theme_primary_color, theme_secondary_color, theme_font_family,
                categories, is_published
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, FALSE)
            RETURNING id, slug
        `, [
            slug, partner1Name, partner2Name, coupleDisplayName || null,
            eventDate || null, eventLocation || null, eventVenue || null,
            heroHeading || 'Our Wedding Registry',
            heroSubheading || 'Help us fill our first home with love',
            thankYouMessage || 'Your love and support mean the world to us.',
            primaryCurrency || 'USD', secondaryCurrency || null, exchangeRate || null,
            themePrimaryColor || '#ec4899', themeSecondaryColor || '#f43f5e',
            themeFontFamily || 'Great Vibes',
            JSON.stringify(categories || ['Kitchen', 'Electronics', 'Home', 'Bedroom', 'Bathroom', 'Other'])
        ]);

        // Link creator as owner
        await query(
            'INSERT INTO registry_members (registry_id, user_id, role) VALUES ($1, $2, $3)',
            [rows[0].id, req.user.userId, 'owner']
        );

        res.status(201).json({ success: true, registry: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get registry config (public)
app.get('/api/r/:slug', resolveRegistry, (req, res) => {
    const r = req.registry;
    res.json({
        slug: r.slug,
        partner1Name: r.partner1_name,
        partner2Name: r.partner2_name,
        coupleDisplayName: r.couple_display_name,
        eventDate: r.event_date,
        eventLocation: r.event_location,
        eventVenue: r.event_venue,
        heroHeading: r.hero_heading,
        heroSubheading: r.hero_subheading,
        thankYouMessage: r.thank_you_message,
        primaryCurrency: r.primary_currency,
        secondaryCurrency: r.secondary_currency,
        exchangeRate: r.exchange_rate ? parseFloat(r.exchange_rate) : null,
        themePrimaryColor: r.theme_primary_color,
        themeSecondaryColor: r.theme_secondary_color,
        themeFontFamily: r.theme_font_family,
        categories: r.categories,
        showPriceToGuests: r.show_price_to_guests,
        isPublished: r.is_published
    });
});

// Update registry settings
app.put('/api/r/:slug/settings', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    const registryId = req.registry.id;
    const {
        partner1Name, partner2Name, coupleDisplayName,
        eventDate, eventLocation, eventVenue,
        heroHeading, heroSubheading, thankYouMessage,
        primaryCurrency, secondaryCurrency, exchangeRate,
        themePrimaryColor, themeSecondaryColor, themeFontFamily,
        categories, isPublished, showPriceToGuests
    } = req.body;

    try {
        await query(`
            UPDATE registries SET
                partner1_name = COALESCE($1, partner1_name),
                partner2_name = COALESCE($2, partner2_name),
                couple_display_name = $3,
                event_date = $4,
                event_location = $5,
                event_venue = $6,
                hero_heading = COALESCE($7, hero_heading),
                hero_subheading = COALESCE($8, hero_subheading),
                thank_you_message = COALESCE($9, thank_you_message),
                primary_currency = COALESCE($10, primary_currency),
                secondary_currency = $11,
                exchange_rate = $12,
                theme_primary_color = COALESCE($13, theme_primary_color),
                theme_secondary_color = COALESCE($14, theme_secondary_color),
                theme_font_family = COALESCE($15, theme_font_family),
                categories = COALESCE($16, categories),
                is_published = COALESCE($17, is_published),
                show_price_to_guests = COALESCE($18, show_price_to_guests),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $19
        `, [
            partner1Name, partner2Name, coupleDisplayName,
            eventDate, eventLocation, eventVenue,
            heroHeading, heroSubheading, thankYouMessage,
            primaryCurrency, secondaryCurrency, exchangeRate,
            themePrimaryColor, themeSecondaryColor, themeFontFamily,
            categories ? JSON.stringify(categories) : null,
            isPublished, showPriceToGuests,
            registryId
        ]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// PUBLIC GIFT ROUTES (registry-scoped)
// ============================================================

// Get all gifts for a registry
app.get('/api/r/:slug/gifts', resolveRegistry, async (req, res) => {
    try {
        const gifts = await fetchGiftsForRegistry(req.registry.id);
        res.json(gifts);
    } catch (err) {
        console.error('Error fetching gifts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reserve a gift
app.post('/api/r/:slug/gifts/:id/reserve', resolveRegistry, async (req, res) => {
    const giftId = req.params.id;
    const registryId = req.registry.id;
    const { guestName, guestEmail, guestPhone, amount, percentage, notes } = req.body;

    if (!guestName) {
        return res.status(400).json({ error: 'Guest name is required' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Verify gift belongs to this registry
            const { rows: [gift] } = await client.query(
                'SELECT * FROM gifts WHERE id = $1 AND registry_id = $2', [giftId, registryId]
            );
            if (!gift) throw new Error('Gift not found');

            const giftQuantity = gift.quantity || 1;
            const giftPrice = parseFloat(gift.price);

            let reservedAmount, reservedPercentage;

            if (gift.allow_partial_reservations) {
                if (!amount && !percentage) throw new Error('Either amount or percentage must be specified');
                reservedAmount = amount ? parseFloat(amount) : (parseFloat(percentage) * giftPrice / 100);
                reservedPercentage = percentage ? parseFloat(percentage) : (parseFloat(amount) * 100 / giftPrice);
            } else if (giftQuantity > 1) {
                reservedAmount = giftPrice;
                reservedPercentage = 0;
            } else {
                reservedAmount = giftPrice;
                reservedPercentage = 100;
            }

            // Check limits
            const { rows: [result] } = await client.query(`
                SELECT COALESCE(SUM(percentage_reserved), 0) as total_reserved, COUNT(*) as count
                FROM partial_reservations WHERE gift_id = $1
            `, [giftId]);
            const totalReserved = parseFloat(result.total_reserved);
            const count = parseInt(result.count);

            if (gift.allow_partial_reservations) {
                if (totalReserved + reservedPercentage > 100.01) {
                    throw new Error(`Only ${(100 - totalReserved).toFixed(1)}% of this gift is available for reservation`);
                }
            } else if (giftQuantity > 1) {
                if (count >= giftQuantity) throw new Error(`All ${giftQuantity} units of this gift have been reserved`);
            } else {
                if (totalReserved >= 99.9) throw new Error('This gift has already been reserved');
            }

            // Upsert guest (scoped to registry)
            let guestId;
            const checkGuest = await client.query(
                'SELECT id FROM guests WHERE name = $1 AND registry_id = $2', [guestName, registryId]
            );
            if (checkGuest.rows.length > 0) {
                guestId = checkGuest.rows[0].id;
                if (guestEmail || guestPhone) {
                    await client.query(
                        'UPDATE guests SET email = COALESCE($1, email), phone = COALESCE($2, phone) WHERE id = $3',
                        [guestEmail, guestPhone, guestId]
                    );
                }
            } else {
                const newGuest = await client.query(
                    'INSERT INTO guests (registry_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
                    [registryId, guestName, guestEmail, guestPhone]
                );
                guestId = newGuest.rows[0].id;
            }

            const insertRes = await client.query(`
                INSERT INTO partial_reservations (gift_id, guest_id, amount_reserved, percentage_reserved, notes)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [giftId, guestId, reservedAmount, reservedPercentage, notes]);

            await client.query('COMMIT');

            res.json({
                success: true,
                reservationId: insertRes.rows[0].id,
                amountReserved: reservedAmount,
                percentageReserved: reservedPercentage
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        const isClientError = err.message.includes('required') || err.message.includes('available') || err.message.includes('found');
        res.status(isClientError ? 400 : 500).json({ error: err.message });
    }
});

// Unreserve a gift (admin only)
app.delete('/api/r/:slug/gifts/:id/reserve', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    const giftId = req.params.id;
    try {
        // Verify gift belongs to this registry
        const { rows: [gift] } = await query('SELECT id FROM gifts WHERE id = $1 AND registry_id = $2', [giftId, req.registry.id]);
        if (!gift) return res.status(404).json({ error: 'Gift not found in this registry' });

        const result = await query('DELETE FROM partial_reservations WHERE gift_id = $1', [giftId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'No reservations found for this gift' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ADMIN GIFT ROUTES (registry-scoped, authenticated)
// ============================================================

// Get all reservations for a registry
app.get('/api/r/:slug/admin/reservations', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT r.*, g.name as gift_name, g.price as gift_price, g.category as gift_category,
                   gu.name as guest_name, gu.email as guest_email, gu.phone as guest_phone
            FROM partial_reservations r
            JOIN gifts g ON r.gift_id = g.id
            JOIN guests gu ON r.guest_id = gu.id
            WHERE g.registry_id = $1
            ORDER BY r.reserved_at DESC
        `, [req.registry.id]);

        res.json(rows.map(r => ({ ...r, gift_price: parseFloat(r.gift_price) })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add gift to a registry
app.post('/api/r/:slug/admin/gifts', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const shouldAllowPartial = allow_partial_reservations !== undefined ? allow_partial_reservations : price >= 20000;
    const giftQuantity = quantity || 1;

    try {
        const { rows } = await query(
            'INSERT INTO gifts (registry_id, name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [req.registry.id, name, price, image_url, affiliate_link, category, description, shouldAllowPartial, giftQuantity]
        );
        res.json({ success: true, giftId: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update gift
app.put('/api/r/:slug/admin/gifts/:id', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    const giftId = req.params.id;
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    try {
        const result = await query(
            'UPDATE gifts SET name = $1, price = $2, image_url = $3, affiliate_link = $4, category = $5, description = $6, allow_partial_reservations = $7, quantity = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND registry_id = $10',
            [name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity || 1, giftId, req.registry.id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Gift not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete gift
app.delete('/api/r/:slug/admin/gifts/:id', authenticateToken, resolveRegistry, requireRegistryAccess, async (req, res) => {
    const giftId = req.params.id;
    try {
        const result = await query('DELETE FROM gifts WHERE id = $1 AND registry_id = $2', [giftId, req.registry.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Gift not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// BACKWARD COMPATIBILITY ALIASES
// These keep the existing Laerke & Micheal registry working
// at the old URLs during migration. Remove after wedding.
// ============================================================

const LEGACY_SLUG = 'laerke-and-micheal';

app.get('/api/gifts', async (req, res) => {
    try {
        const { rows } = await query('SELECT id FROM registries WHERE slug = $1', [LEGACY_SLUG]);
        if (!rows[0]) return res.status(404).json({ error: 'Legacy registry not found' });
        const gifts = await fetchGiftsForRegistry(rows[0].id);
        res.json(gifts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/gifts/:id/reserve', (req, res) => {
    req.params.slug = LEGACY_SLUG;
    app.handle({ ...req, url: `/api/r/${LEGACY_SLUG}/gifts/${req.params.id}/reserve`, params: { slug: LEGACY_SLUG, id: req.params.id } }, res);
});

app.delete('/api/gifts/:id/reserve', (req, res) => {
    req.params.slug = LEGACY_SLUG;
    app.handle({ ...req, url: `/api/r/${LEGACY_SLUG}/gifts/${req.params.id}/reserve`, params: { slug: LEGACY_SLUG, id: req.params.id } }, res);
});

// Legacy admin routes — forward to registry-scoped versions
app.get('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT r.*, g.name as gift_name, g.price as gift_price, g.category as gift_category,
                   gu.name as guest_name, gu.email as guest_email, gu.phone as guest_phone
            FROM partial_reservations r
            JOIN gifts g ON r.gift_id = g.id
            JOIN guests gu ON r.guest_id = gu.id
            JOIN registries reg ON g.registry_id = reg.id
            WHERE reg.slug = $1
            ORDER BY r.reserved_at DESC
        `, [LEGACY_SLUG]);
        res.json(rows.map(r => ({ ...r, gift_price: parseFloat(r.gift_price) })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/gifts', authenticateToken, async (req, res) => {
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;
    if (!name || price === undefined || !category) return res.status(400).json({ error: 'Name, price, and category are required' });

    const shouldAllowPartial = allow_partial_reservations !== undefined ? allow_partial_reservations : price >= 20000;
    try {
        const { rows: regRows } = await query('SELECT id FROM registries WHERE slug = $1', [LEGACY_SLUG]);
        if (!regRows[0]) return res.status(404).json({ error: 'Legacy registry not found' });

        const { rows } = await query(
            'INSERT INTO gifts (registry_id, name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [regRows[0].id, name, price, image_url, affiliate_link, category, description, shouldAllowPartial, quantity || 1]
        );
        res.json({ success: true, giftId: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/gifts/:id', authenticateToken, async (req, res) => {
    const giftId = req.params.id;
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;
    if (!name || price === undefined || !category) return res.status(400).json({ error: 'Name, price, and category are required' });

    try {
        const result = await query(
            'UPDATE gifts SET name = $1, price = $2, image_url = $3, affiliate_link = $4, category = $5, description = $6, allow_partial_reservations = $7, quantity = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9',
            [name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity || 1, giftId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Gift not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/gifts/:id', authenticateToken, async (req, res) => {
    const giftId = req.params.id;
    try {
        const result = await query('DELETE FROM gifts WHERE id = $1', [giftId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Gift not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// SPA FALLBACK — serve index.html for all non-API routes
// ============================================================
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
});

// Export for Vercel serverless
module.exports = app;

// Start server only if running locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Wedding Registry Server running on port ${PORT}`);
    });
}
