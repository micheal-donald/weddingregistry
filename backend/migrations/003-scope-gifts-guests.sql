-- Migration 003: Add registry_id FK to gifts and guests tables

-- Add nullable first (so existing rows don't fail)
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS registry_id UUID REFERENCES registries(id) ON DELETE CASCADE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS registry_id UUID REFERENCES registries(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gifts_registry ON gifts(registry_id);
CREATE INDEX IF NOT EXISTS idx_guests_registry ON guests(registry_id);
CREATE INDEX IF NOT EXISTS idx_partial_reservations_gift ON partial_reservations(gift_id);
