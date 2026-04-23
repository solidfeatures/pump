-- Migration: Add missing fields for planned sessions and exercises
-- Date: 2026-04-22

ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
