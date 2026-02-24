-- Migration 001: Add M-Pesa payments table
-- Run this against existing databases that were created before M-Pesa support.
-- Safe to run multiple times (uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS mpesa_payments (
    id SERIAL PRIMARY KEY,
    registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    reservation_id INTEGER REFERENCES partial_reservations(id) ON DELETE SET NULL,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,

    checkout_request_id VARCHAR(100) UNIQUE,
    merchant_request_id VARCHAR(100),
    account_reference VARCHAR(12) NOT NULL,

    amount DECIMAL(10, 2) NOT NULL,
    percentage_reserved DECIMAL(5, 2) NOT NULL DEFAULT 0,
    phone_number VARCHAR(20) NOT NULL,
    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    mpesa_receipt_number VARCHAR(50),
    mpesa_transaction_date BIGINT,
    result_code INTEGER,
    result_desc TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mpesa_payments_checkout ON mpesa_payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_gift ON mpesa_payments(gift_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_registry ON mpesa_payments(registry_id);
