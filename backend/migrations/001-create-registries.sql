-- Migration 001: Create registries table (central tenant table)

CREATE TABLE IF NOT EXISTS registries (
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

    -- Categories (JSON array, customizable per registry)
    categories JSONB DEFAULT '["Kitchen","Electronics","Home","Bedroom","Bathroom","Other"]'::jsonb,

    -- Settings
    is_published BOOLEAN DEFAULT FALSE,
    show_price_to_guests BOOLEAN DEFAULT TRUE,
    plan_id VARCHAR(20) DEFAULT 'free',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registries_slug ON registries(slug);
