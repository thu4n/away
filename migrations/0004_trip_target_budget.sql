-- Migration: Add optional target_budget to trips table
ALTER TABLE trips ADD COLUMN target_budget REAL;
