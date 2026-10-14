-- Migration: 0003_group_bill_splitting.sql
-- Create trip_members table for managing trip participants
CREATE TABLE IF NOT EXISTS trip_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- Add paid_by and split_among columns to expenses
ALTER TABLE expenses ADD COLUMN paid_by TEXT;
ALTER TABLE expenses ADD COLUMN split_among TEXT;
