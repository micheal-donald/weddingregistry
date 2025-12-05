-- Add allow_partial_reservations column to gifts table
ALTER TABLE gifts ADD COLUMN allow_partial_reservations BOOLEAN DEFAULT FALSE;

-- Set smart defaults based on price
-- High-value items (>= KES 20,000) should allow partial reservations
UPDATE gifts SET allow_partial_reservations = TRUE WHERE price >= 20000;

-- Keep low-value items as simple reservations
-- (already FALSE by default)