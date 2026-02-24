const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const http = require('http');

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
// M-PESA SERVICE
// ============================================================

function mpesaHttpRequest(method, urlString, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(urlString);
        const lib = urlObj.protocol === 'https:' ? https : http;
        const body = data ? JSON.stringify(data) : null;
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
                ...headers
            },
            timeout: 15000
        };

        const req = lib.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ data: parsed, status: res.statusCode });
                    } else {
                        const err = new Error(parsed.errorMessage || parsed.ResponseDescription || `HTTP ${res.statusCode}`);
                        err.response = { data: parsed, status: res.statusCode };
                        reject(err);
                    }
                } catch (e) {
                    reject(new Error(`Invalid M-Pesa response: ${responseBody.substring(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            const err = new Error('M-Pesa request timed out after 15s');
            err.code = 'ECONNABORTED';
            reject(err);
        });

        if (body) req.write(body);
        req.end();
    });
}

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortcode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.callbackUrl = process.env.MPESA_CALLBACK_URL;
        this.timeoutUrl = process.env.MPESA_TIMEOUT_URL || process.env.MPESA_CALLBACK_URL;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
        this.baseUrl = this.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    isConfigured() {
        return !!(this.consumerKey && this.consumerSecret && this.shortcode && this.passkey && this.callbackUrl);
    }

    getMpesaTimestamp() {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0')
        ].join('');
    }

    generatePassword(timestamp) {
        return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    }

    formatPhone(phone) {
        let p = phone.toString().replace(/[\s\-\(\)]/g, '');
        if (p.startsWith('0')) p = '254' + p.substring(1);
        else if (p.startsWith('+254')) p = p.substring(1);
        else if (!p.startsWith('254')) throw new Error('Phone must start with 0, +254, or 254');
        if (!/^254\d{9}$/.test(p)) throw new Error('Invalid Kenyan phone number — must be 12 digits (e.g. 0712345678)');
        return p;
    }

    // Account reference: first 6 chars of slug (no hyphens) + gift ID, max 12 chars
    // e.g. slug="laerke-and-micheal", giftId=42 → "LAERKE42"
    createAccountRef(slug, giftId) {
        const prefix = slug.replace(/-/g, '').toUpperCase().substring(0, 6);
        return `${prefix}${giftId}`.substring(0, 12);
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        const { data } = await mpesaHttpRequest(
            'GET',
            `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
            null,
            { Authorization: `Basic ${auth}` }
        );
        if (!data.access_token) throw new Error('No access_token in M-Pesa response');
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + 55 * 60 * 1000; // 55-min buffer before 1-hr expiry
        return this.accessToken;
    }

    async initiateSTKPush({ amount, phoneNumber, slug, giftId, description }) {
        const token = await this.getAccessToken();
        const timestamp = this.getMpesaTimestamp();
        const password = this.generatePassword(timestamp);
        const formattedPhone = this.formatPhone(phoneNumber);
        const accountReference = this.createAccountRef(slug, giftId);
        const intAmount = Math.round(parseFloat(amount));
        if (intAmount < 1) throw new Error('Minimum payment amount is KES 1');

        const payload = {
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: intAmount,
            PartyA: formattedPhone,
            PartyB: this.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: this.callbackUrl,
            AccountReference: accountReference,
            TransactionDesc: (description || 'Wedding Gift').substring(0, 13)
        };

        const { data } = await mpesaHttpRequest(
            'POST',
            `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
            payload,
            { Authorization: `Bearer ${token}` }
        );

        if (data.ResponseCode !== '0') {
            throw new Error(data.ResponseDescription || 'STK Push initiation failed');
        }

        return {
            checkoutRequestId: data.CheckoutRequestID,
            merchantRequestId: data.MerchantRequestID,
            accountReference,
            customerMessage: data.CustomerMessage
        };
    }

    async querySTKStatus(checkoutRequestId) {
        const token = await this.getAccessToken();
        const timestamp = this.getMpesaTimestamp();
        const password = this.generatePassword(timestamp);
        const { data } = await mpesaHttpRequest(
            'POST',
            `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
            { BusinessShortCode: this.shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId },
            { Authorization: `Bearer ${token}` }
        );
        return data;
    }

    mapResultCode(code) {
        const map = { 0: 'completed', 1032: 'cancelled', 1037: 'timeout', 1: 'failed', 26: 'failed', 1019: 'failed', 1036: 'failed' };
        return map[parseInt(code)] || 'failed';
    }

    getUserMessage(code) {
        const map = {
            0: 'Payment confirmed! Thank you for your gift.',
            1032: 'Payment cancelled.',
            1037: 'Payment timed out — PIN was not entered in time.',
            1: 'Insufficient M-Pesa funds.',
            26: 'M-Pesa is busy. Please try again.',
            1019: 'Payment request expired.',
            1036: 'Payment failed. Please try again.'
        };
        return map[parseInt(code)] || 'Payment processing failed. Please try again.';
    }
}

const mpesa = new MpesaService();

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
// M-PESA PAYMENT ROUTES
// ============================================================

// Initiate M-Pesa STK Push payment for a gift
// Creates a pending mpesa_payment record, sends STK prompt to guest's phone.
// Reservation is only created after the callback confirms success.
app.post('/api/r/:slug/gifts/:id/mpesa', resolveRegistry, async (req, res) => {
    if (!mpesa.isConfigured()) {
        return res.status(503).json({ error: 'M-Pesa payments are not configured on this server' });
    }

    const giftId = req.params.id;
    const registryId = req.registry.id;
    const slug = req.params.slug;
    const { guestName, guestEmail, guestPhone, amount, percentage, notes } = req.body;

    if (!guestName) return res.status(400).json({ error: 'Guest name is required' });
    if (!guestPhone) return res.status(400).json({ error: 'Phone number is required for M-Pesa payment' });

    let formattedPhone;
    try {
        formattedPhone = mpesa.formatPhone(guestPhone);
    } catch (err) {
        return res.status(400).json({ error: err.message });
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
            let paymentAmount, reservedPercentage;

            if (gift.allow_partial_reservations) {
                if (!amount && !percentage) throw new Error('Either amount or percentage must be specified');
                paymentAmount = amount ? parseFloat(amount) : (parseFloat(percentage) * giftPrice / 100);
                reservedPercentage = percentage ? parseFloat(percentage) : (parseFloat(amount) * 100 / giftPrice);
            } else if (giftQuantity > 1) {
                paymentAmount = giftPrice;
                reservedPercentage = 0;
            } else {
                paymentAmount = giftPrice;
                reservedPercentage = 100;
            }

            // Check availability
            const { rows: [avail] } = await client.query(
                'SELECT COALESCE(SUM(percentage_reserved), 0) as total, COUNT(*) as count FROM partial_reservations WHERE gift_id = $1',
                [giftId]
            );
            const totalReserved = parseFloat(avail.total);
            const count = parseInt(avail.count);

            if (gift.allow_partial_reservations) {
                if (totalReserved + reservedPercentage > 100.01)
                    throw new Error(`Only ${(100 - totalReserved).toFixed(1)}% of this gift is still available`);
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
                await client.query(
                    'UPDATE guests SET email = COALESCE($1, email), phone = COALESCE($2, phone) WHERE id = $3',
                    [guestEmail || null, formattedPhone, guestId]
                );
            } else {
                const newGuest = await client.query(
                    'INSERT INTO guests (registry_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
                    [registryId, guestName, guestEmail || null, formattedPhone]
                );
                guestId = newGuest.rows[0].id;
            }

            // Create pending payment record
            const accountRef = mpesa.createAccountRef(slug, giftId);
            const { rows: [payment] } = await client.query(
                `INSERT INTO mpesa_payments
                    (registry_id, gift_id, guest_id, account_reference, amount, percentage_reserved, phone_number, notes, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                 RETURNING id`,
                [registryId, giftId, guestId, accountRef, paymentAmount, reservedPercentage, formattedPhone, notes || null]
            );

            await client.query('COMMIT');

            // Initiate STK Push outside the DB transaction
            let stkResult;
            try {
                stkResult = await mpesa.initiateSTKPush({
                    amount: paymentAmount,
                    phoneNumber: formattedPhone,
                    slug,
                    giftId,
                    description: `${gift.name.substring(0, 8)} Gift`
                });
            } catch (stkErr) {
                await query(
                    "UPDATE mpesa_payments SET status = 'failed', result_desc = $1, updated_at = NOW() WHERE id = $2",
                    [stkErr.message, payment.id]
                );
                throw stkErr;
            }

            // Link checkout request ID to payment record
            await query(
                'UPDATE mpesa_payments SET checkout_request_id = $1, merchant_request_id = $2, updated_at = NOW() WHERE id = $3',
                [stkResult.checkoutRequestId, stkResult.merchantRequestId, payment.id]
            );

            res.json({
                success: true,
                paymentId: payment.id,
                checkoutRequestId: stkResult.checkoutRequestId,
                accountReference: stkResult.accountReference,
                customerMessage: stkResult.customerMessage || 'Check your phone for an M-Pesa prompt',
                amount: paymentAmount
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        const isClientError = ['required', 'available', 'found', 'Phone', 'reserved', 'units', 'Minimum', 'Invalid']
            .some(s => err.message.includes(s));
        res.status(isClientError ? 400 : 500).json({ error: err.message });
    }
});

// Poll M-Pesa payment status (frontend polls this every 3 seconds)
app.get('/api/payments/:checkoutId/status', async (req, res) => {
    const { checkoutId } = req.params;
    try {
        const { rows: [payment] } = await query(
            `SELECT id, status, mpesa_receipt_number, result_code, result_desc, amount, updated_at
             FROM mpesa_payments WHERE checkout_request_id = $1`,
            [checkoutId]
        );
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.json({
            paymentId: payment.id,
            status: payment.status,
            receiptNumber: payment.mpesa_receipt_number,
            amount: payment.amount ? parseFloat(payment.amount) : null,
            message: payment.result_desc || null,
            updatedAt: payment.updated_at
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// M-PESA WEBHOOK ENDPOINTS
// Called directly by Safaricom — must always return 200 quickly.
// For local dev: expose with ngrok → set MPESA_CALLBACK_URL to ngrok URL.
// ============================================================

// Helper: process a confirmed/failed M-Pesa callback
async function processMpesaCallback(stkCallback) {
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    if (!CheckoutRequestID) return;

    const newStatus = mpesa.mapResultCode(ResultCode);

    // Extract metadata for successful payments
    let receiptNumber = null, transactionDate = null;
    if (ResultCode === 0 && CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
            if (item.Name === 'MpesaReceiptNumber') receiptNumber = String(item.Value);
            if (item.Name === 'TransactionDate') transactionDate = item.Value;
        }
    }

    const { rows: [payment] } = await query(
        'SELECT * FROM mpesa_payments WHERE checkout_request_id = $1', [CheckoutRequestID]
    );
    if (!payment) return;
    if (payment.status !== 'pending') return; // idempotency

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE mpesa_payments
             SET status = $1, result_code = $2, result_desc = $3,
                 mpesa_receipt_number = $4, mpesa_transaction_date = $5, updated_at = NOW()
             WHERE id = $6`,
            [newStatus, ResultCode, ResultDesc, receiptNumber, transactionDate, payment.id]
        );

        // On success: create the reservation
        if (newStatus === 'completed') {
            const { rows: [gift] } = await client.query(
                'SELECT id FROM gifts WHERE id = $1', [payment.gift_id]
            );
            if (gift) {
                const { rows: [res] } = await client.query(
                    `INSERT INTO partial_reservations (gift_id, guest_id, amount_reserved, percentage_reserved, notes)
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [payment.gift_id, payment.guest_id, payment.amount, payment.percentage_reserved, payment.notes]
                );
                await client.query(
                    'UPDATE mpesa_payments SET reservation_id = $1 WHERE id = $2',
                    [res.id, payment.id]
                );
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

// M-Pesa payment result callback
app.post('/api/webhooks/mpesa/callback', async (req, res) => {
    const stkCallback = req.body?.Body?.stkCallback;
    if (stkCallback) {
        try {
            await processMpesaCallback(stkCallback);
        } catch (e) {
            console.error('M-Pesa callback processing error:', e.message);
        }
    }
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// M-Pesa timeout callback (customer did not enter PIN within 5 minutes)
app.post('/api/webhooks/mpesa/timeout', async (req, res) => {
    const checkoutId = req.body?.Body?.stkCallback?.CheckoutRequestID;
    if (checkoutId) {
        try {
            await query(
                `UPDATE mpesa_payments
                 SET status = 'timeout', result_desc = 'STK Push timed out — no PIN entered', updated_at = NOW()
                 WHERE checkout_request_id = $1 AND status = 'pending'`,
                [checkoutId]
            );
        } catch (e) {
            console.error('M-Pesa timeout webhook error:', e.message);
        }
    }
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
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
