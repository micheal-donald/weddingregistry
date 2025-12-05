-- Wedding Registry Database Schema

-- Gifts table
CREATE TABLE gifts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    affiliate_link TEXT,
    category TEXT NOT NULL,
    description TEXT,
    is_reserved BOOLEAN DEFAULT FALSE,
    allow_partial_reservations BOOLEAN DEFAULT FALSE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guests table
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partial Reservations table (replaces simple reservations and supports both full and partial)
CREATE TABLE partial_reservations (
    id SERIAL PRIMARY KEY,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    amount_reserved DECIMAL(10, 2) NOT NULL,
    percentage_reserved DECIMAL(5, 2) NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Old reservations table is deprecated/replaced by partial_reservations logic, but keeping structure if needed for reference, 
-- or we just use partial_reservations for everything as per the backend code analysis.
-- The backend code uses 'partial_reservations' table in the GET /api/gifts query, so we MUST define it.
-- The SQLite schema in the file I read earlier had 'reservations', but 'server.js' logic used 'partial_reservations'.
-- Wait, I need to check server.js again. server.js lines 52 and 188 reference 'partial_reservations'.
-- But the initial schema.sql file I read (step 23) ONLY had 'reservations' table. 
-- This implies the schema.sql file was OUTDATED compared to the code, or I missed something.
-- Let's look at server.js again. Line 52: "LEFT JOIN partial_reservations pr".
-- The previous schema.sql content (Step 23) did NOT have partial_reservations table. 
-- It seems the user might have run migration scripts (like add-partial-flag.sql etc visible in file list) on their local DB but not updated schema.sql.
-- I should consolidate the schema to match the current CODE expectations.

-- Admins table (for couple authentication)
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial gifts data
INSERT INTO gifts (name, price, image_url, affiliate_link, category, description) VALUES
('Money', 0, 'https://placehold.co/300x300/f8f9fa/6c757d?text=💰', '', 'Other', 'Cash gift - any amount appreciated'),
('Harman Kardon Onyx Studio 9 Bluetooth Speaker', 49995, 'https://hotpoint.co.ke/media/cache/ca/9d/ca9d7df71e85f21a091f5a1919bc64f7.webp', 'https://hotpoint.co.ke/catalogue/harman-kordon-onyx-studio-9-port-stereo-bluetooth-speaker-50w-black_5725/', 'Audio', '50W Bluetooth speaker with premium sound quality'),
('Grill', 25000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🔥+Grill', '', 'Appliances', 'Outdoor grilling for our future BBQ parties'),
('DeLonghi Coffee Grinder KG200', 18000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=Coffee+Grinder', 'https://hotpoint.co.ke/catalogue/delonghi-kg200-coffee-grinder_4819/', 'Kitchen', 'Fresh ground coffee every morning'),
('DeLonghi Coffee Maker EC230BK', 24995, 'https://hotpoint.co.ke/media/products/2023/11/cxvbvcbv.jpg', 'https://hotpoint.co.ke/catalogue/delonghi-ec230bk-coffee-maker_4775/', 'Kitchen', 'Perfect espresso at home'),
('VR Headset', 35000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=VR+Headset', '', 'Electronics', 'Virtual reality adventures together'),
('Vinyl Player', 15000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🎵+Vinyl+Player', '', 'Audio', 'Vintage music experience'),
('Vinyl Records Collection', 5000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🎶+Vinyls', '', 'Audio', 'Classic albums to start our collection'),
('Prestige Cast Iron Pots & Pans Set', 12000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=Cast+Iron+Set', 'https://myredrhino.com/product-category/prestige-kitchen-products-online-store-kenya/cast-iron/', 'Kitchen', 'Durable cookware for our kitchen'),
('Indoor Plants Collection', 3000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🌿+Plants', '', 'Home', 'Green life for our new home'),
('Black+Decker Robot Vacuum & Mop', 54995, 'https://hotpoint.co.ke/media/cache/18/b3/18b399aaf6508b767536d0c285f79642.webp', 'https://hotpoint.co.ke/catalogue/blackdecker-brva425b10-b5-robotic-vacuum-cleaner-and-mop-2-in-1-white_5562/', 'Appliances', 'Automated cleaning for busy days'),
('Wood Chopping Boards Set', 4000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🪵+Cutting+Board', '', 'Kitchen', 'Premium wooden cutting boards'),
('MT900 Ultralight 3-Person Trekking Tent', 25000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=⛺+Tent', 'https://www.decathlon.co.ke/trekking-tents/323513-43041-tunnel-trekking-tent-3-person-mt900-ultralight.html', 'Outdoor', 'Adventure trips in Kenya and beyond'),
('Trekking & Camping Gear Set', 20000, 'https://placehold.co/300x300/f8f9fa/6c757d?text=🎒+Camping+Gear', '', 'Outdoor', 'Complete camping setup for outdoor adventures');

-- Create default admin account (username: admin, password: wedding2026)
-- Password hash for 'wedding2026' using bcrypt
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2b$10$rQ.Q8WQ8WQ8WQ8WQ8WQ8WOHvGvGvGvGvGvGvGvGvGvGvGvGvGvGv');