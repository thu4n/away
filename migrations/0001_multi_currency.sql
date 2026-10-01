-- Migration: 0001_multi_currency.sql
-- Add base_currency to trips
ALTER TABLE trips ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'VND';

-- Add currency, exchange_rate, and base_amount to expenses
ALTER TABLE expenses ADD COLUMN currency TEXT NOT NULL DEFAULT 'VND';
ALTER TABLE expenses ADD COLUMN exchange_rate REAL NOT NULL DEFAULT 1.0;
ALTER TABLE expenses ADD COLUMN base_amount REAL;

-- Populate base_amount for existing records
UPDATE expenses SET base_amount = amount WHERE base_amount IS NULL;
