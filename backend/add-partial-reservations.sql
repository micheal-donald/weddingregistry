-- Add partial reservation support to existing schema

-- Add columns to reservations table for partial amounts
ALTER TABLE reservations ADD COLUMN amount_reserved REAL DEFAULT 0;
ALTER TABLE reservations ADD COLUMN percentage_reserved REAL DEFAULT 100;

-- Add a table to track multiple partial reservations per gift
CREATE TABLE partial_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    amount_reserved REAL NOT NULL,
    percentage_reserved REAL NOT NULL,
    reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- Update existing reservations to have 100% amounts
UPDATE reservations SET
    amount_reserved = (
        SELECT price FROM gifts WHERE gifts.id = reservations.gift_id
    ),
    percentage_reserved = 100
WHERE amount_reserved = 0;