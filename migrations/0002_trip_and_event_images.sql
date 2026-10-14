-- Migration: 0002_trip_and_event_images.sql
-- Add cover_image_key to trips for trip customization banner
ALTER TABLE trips ADD COLUMN cover_image_key TEXT;

-- Add image_key to timeline_items for event photos
ALTER TABLE timeline_items ADD COLUMN image_key TEXT;
