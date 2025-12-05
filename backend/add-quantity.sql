-- Add quantity support for multiple reservations
-- This allows items like plates or glasses where multiple people can reserve independent units

ALTER TABLE gifts ADD COLUMN quantity INTEGER DEFAULT 1;

-- Note: quantity and allow_partial_reservations are mutually exclusive
-- - quantity > 1: Multiple people can reserve independent units (e.g., 10 plates)
-- - allow_partial_reservations = 1: Multiple people contribute percentages to one item (e.g., expensive speaker)
