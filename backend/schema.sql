-- Wedding Registry SaaS — Multi-Tenant Database Schema
-- This is the canonical schema for fresh installations.
-- For migrating an existing single-tenant deployment, use the scripts in migrations/.

-- ============================================================
-- REGISTRIES: Central tenant table
-- ============================================================
CREATE TABLE registries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(80) UNIQUE NOT NULL,

    -- Couple info
    partner1_name VARCHAR(100) NOT NULL,
    partner2_name VARCHAR(100) NOT NULL,
    couple_display_name VARCHAR(200),

    -- Event details
    event_date DATE,
    event_location VARCHAR(200),
    event_venue VARCHAR(200),

    -- Customization
    hero_heading VARCHAR(200) DEFAULT 'Our Wedding Registry',
    hero_subheading TEXT DEFAULT 'Help us fill our first home with love',
    thank_you_message TEXT DEFAULT 'Your love and support mean the world to us.',

    -- Currency
    primary_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    secondary_currency VARCHAR(3),
    exchange_rate DECIMAL(12, 6),

    -- Theme
    theme_primary_color VARCHAR(7) DEFAULT '#ec4899',
    theme_secondary_color VARCHAR(7) DEFAULT '#f43f5e',
    theme_font_family VARCHAR(100) DEFAULT 'Great Vibes',

    -- Categories
    categories JSONB DEFAULT '["Kitchen","Electronics","Home","Bedroom","Bathroom","Other"]'::jsonb,

    -- Settings
    is_published BOOLEAN DEFAULT FALSE,
    show_price_to_guests BOOLEAN DEFAULT TRUE,
    plan_id VARCHAR(20) DEFAULT 'free',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registries_slug ON registries(slug);

-- ============================================================
-- USERS: Multi-user authentication
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REGISTRY_MEMBERS: Links users to registries (many-to-many)
-- ============================================================
CREATE TABLE registry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(registry_id, user_id)
);

CREATE INDEX idx_registry_members_user ON registry_members(user_id);
CREATE INDEX idx_registry_members_registry ON registry_members(registry_id);

-- ============================================================
-- GIFTS: Registry items
-- ============================================================
CREATE TABLE gifts (
    id SERIAL PRIMARY KEY,
    registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
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

CREATE INDEX idx_gifts_registry ON gifts(registry_id);

-- ============================================================
-- GUESTS: People who reserve gifts
-- ============================================================
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guests_registry ON guests(registry_id);

-- ============================================================
-- PARTIAL_RESERVATIONS: Supports full, partial, and quantity-based reservations
-- ============================================================
CREATE TABLE partial_reservations (
    id SERIAL PRIMARY KEY,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    amount_reserved DECIMAL(10, 2) NOT NULL,
    percentage_reserved DECIMAL(5, 2) NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_partial_reservations_gift ON partial_reservations(gift_id);

-- ============================================================
-- LEGACY: Admins table (kept for backward compatibility during migration)
-- New installations should use the users + registry_members tables instead.
-- ============================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
