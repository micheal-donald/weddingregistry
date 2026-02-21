-- Migration 004: Backfill existing data as tenant #1
-- This script inserts the existing Laerke & Micheal wedding as the first registry
-- and links all existing gifts/guests to it.
--
-- IMPORTANT: Run this AFTER 001, 002, and 003 migrations.
-- The admin password hash must be replaced with the real hash from the admins table.

-- Step 1: Create the registry for the existing couple
INSERT INTO registries (
    slug, partner1_name, partner2_name,
    event_date, event_location,
    primary_currency, secondary_currency, exchange_rate,
    hero_subheading,
    thank_you_message,
    categories,
    is_published
) VALUES (
    'laerke-and-micheal',
    'Laerke', 'Micheal',
    '2026-02-14', 'Limuru, Kenya',
    'KES', 'DKK', 0.05,
    'Help us fill our first home with love, laughter, and all the lovely things',
    'Your love and support mean the world to us. We can''t wait to celebrate with you - and maybe even use that fancy kitchen gear!',
    '["Kitchen","Electronics","Audio","Outdoor","Home","Appliances","Other"]'::jsonb,
    TRUE
);

-- Step 2: Create a user from the existing admin account
-- Copy the password hash from the admins table
INSERT INTO users (email, password_hash, display_name)
SELECT
    'admin@laerke-micheal.com',
    a.password_hash,
    'Laerke & Micheal'
FROM admins a
WHERE a.username = 'admin'
LIMIT 1;

-- Step 3: Link user to registry
INSERT INTO registry_members (registry_id, user_id, role)
SELECT r.id, u.id, 'owner'
FROM registries r, users u
WHERE r.slug = 'laerke-and-micheal'
AND u.email = 'admin@laerke-micheal.com';

-- Step 4: Backfill registry_id on existing gifts and guests
UPDATE gifts SET registry_id = (SELECT id FROM registries WHERE slug = 'laerke-and-micheal')
WHERE registry_id IS NULL;

UPDATE guests SET registry_id = (SELECT id FROM registries WHERE slug = 'laerke-and-micheal')
WHERE registry_id IS NULL;

-- Step 5: Make registry_id NOT NULL after backfill
ALTER TABLE gifts ALTER COLUMN registry_id SET NOT NULL;
ALTER TABLE guests ALTER COLUMN registry_id SET NOT NULL;
