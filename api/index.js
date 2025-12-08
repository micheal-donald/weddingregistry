const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wedding-registry-secret-2026';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: false
    } : false
});

// Test connection and log errors
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Helper to query db
const query = (text, params) => pool.query(text, params);

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// === PUBLIC ROUTES ===

// Get all gifts with partial reservation info
app.get('/api/gifts', async (req, res) => {
    try {
        const q = `
            SELECT
                g.*,
                COALESCE(SUM(pr.amount_reserved), 0) as total_reserved_amount,
                COALESCE(SUM(pr.percentage_reserved), 0) as total_reserved_percentage,
                CASE WHEN SUM(pr.percentage_reserved) >= 100 THEN 1 ELSE 0 END as is_fully_reserved,
                COUNT(pr.id) as reserved_count
            FROM gifts g
            LEFT JOIN partial_reservations pr ON g.id = pr.gift_id
            GROUP BY g.id
            ORDER BY g.id
        `;

        const { rows: gifts } = await query(q);

        // Get reservation details for each gift
        // In PG we can probably do this in one query with array_agg but keeping logic similar to original for safety
        const giftsWithReservations = await Promise.all(gifts.map(async (gift) => {
            const resQuery = `
                SELECT pr.*, gu.name as guest_name, gu.email as guest_email
                FROM partial_reservations pr
                JOIN guests gu ON pr.guest_id = gu.id
                WHERE pr.gift_id = $1
                ORDER BY pr.reserved_at
            `;
            const { rows: reservations } = await query(resQuery, [gift.id]);

            // Convert numeric/decimal strings to numbers for consistency with frontend expectations
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

        res.json(giftsWithReservations);
    } catch (err) {
        console.error('Error fetching gifts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reserve a gift (partial or full or quantity-based)
app.post('/api/gifts/:id/reserve', async (req, res) => {
    const giftId = req.params.id;
    const { guestName, guestEmail, guestPhone, amount, percentage, notes } = req.body;

    if (!guestName) {
        return res.status(400).json({ error: 'Guest name is required' });
    }

    try {
        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: [gift] } = await client.query('SELECT * FROM gifts WHERE id = $1', [giftId]);

            if (!gift) {
                throw new Error('Gift not found');
            }

            const giftQuantity = gift.quantity || 1;
            const giftPrice = parseFloat(gift.price);

            let reservedAmount, reservedPercentage;

            if (gift.allow_partial_reservations) {
                if (!amount && !percentage) {
                    throw new Error('Either amount or percentage must be specified');
                }
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
            const checkQuery = `
                SELECT
                    COALESCE(SUM(percentage_reserved), 0) as total_reserved,
                    COUNT(*) as count
                FROM partial_reservations
                WHERE gift_id = $1
            `;
            const { rows: [result] } = await client.query(checkQuery, [giftId]);
            const totalReserved = parseFloat(result.total_reserved);
            const count = parseInt(result.count);

            if (gift.allow_partial_reservations) {
                if (totalReserved + reservedPercentage > 100.01) { // .01 for float tolerance
                    const remaining = 100 - totalReserved;
                    throw new Error(`Only ${remaining.toFixed(1)}% of this gift is available for reservation`);
                }
            } else if (giftQuantity > 1) {
                if (count >= giftQuantity) {
                    throw new Error(`All ${giftQuantity} units of this gift have been reserved`);
                }
            } else {
                if (totalReserved >= 99.9) {
                    throw new Error('This gift has already been reserved');
                }
            }

            // Upsert guest
            let guestId;
            const checkGuest = await client.query('SELECT id FROM guests WHERE name = $1', [guestName]);
            if (checkGuest.rows.length > 0) {
                guestId = checkGuest.rows[0].id;
                // Update email/phone if provided
                if (guestEmail || guestPhone) {
                    await client.query('UPDATE guests SET email = COALESCE($1, email), phone = COALESCE($2, phone) WHERE id = $3', [guestEmail, guestPhone, guestId]);
                }
            } else {
                const newGuest = await client.query(
                    'INSERT INTO guests (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
                    [guestName, guestEmail, guestPhone]
                );
                guestId = newGuest.rows[0].id;
            }

            // Create reservation
            const insertRes = await client.query(`
                INSERT INTO partial_reservations
                (gift_id, guest_id, amount_reserved, percentage_reserved, notes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
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
        // Handle specific errors with 400 status if client error, else 500
        const isClientError = err.message.includes('required') || err.message.includes('available') || err.message.includes('found');
        res.status(isClientError ? 400 : 500).json({ error: err.message });
    }
});

// Unreserve a gift
app.delete('/api/gifts/:id/reserve', async (req, res) => {
    const giftId = req.params.id;
    try {
        const result = await query('DELETE FROM partial_reservations WHERE gift_id = $1', [giftId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No reservations found for this gift' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ADMIN ROUTES ===

// Admin login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const { rows } = await query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = rows[0];

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Get all reservations (admin)
app.get('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
        const q = `
            SELECT
                r.*,
                g.name as gift_name,
                g.price as gift_price,
                g.category as gift_category,
                gu.name as guest_name,
                gu.email as guest_email,
                gu.phone as guest_phone
            FROM partial_reservations r
            JOIN gifts g ON r.gift_id = g.id
            JOIN guests gu ON r.guest_id = gu.id
            ORDER BY r.reserved_at DESC
        `;
        const { rows } = await query(q);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add gift
app.post('/api/admin/gifts', authenticateToken, async (req, res) => {
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const shouldAllowPartial = allow_partial_reservations !== undefined
        ? allow_partial_reservations
        : price >= 20000;

    const giftQuantity = quantity || 1;

    try {
        const { rows } = await query(
            'INSERT INTO gifts (name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [name, price, image_url, affiliate_link, category, description, shouldAllowPartial, giftQuantity]
        );
        res.json({ success: true, giftId: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update gift
app.put('/api/admin/gifts/:id', authenticateToken, async (req, res) => {
    const giftId = req.params.id;
    const { name, price, image_url, affiliate_link, category, description, allow_partial_reservations, quantity } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const giftQuantity = quantity || 1;

    try {
        const result = await query(
            'UPDATE gifts SET name = $1, price = $2, image_url = $3, affiliate_link = $4, category = $5, description = $6, allow_partial_reservations = $7, quantity = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9',
            [name, price, image_url, affiliate_link, category, description, allow_partial_reservations, giftQuantity, giftId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Gift not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete gift
app.delete('/api/admin/gifts/:id', authenticateToken, async (req, res) => {
    const giftId = req.params.id;
    try {
        const result = await query('DELETE FROM gifts WHERE id = $1', [giftId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Gift not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export for Vercel serverless
module.exports = app;

// Start server only if running locally (not in Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🎉 Wedding Registry Server running on port ${PORT}`);
    });
}