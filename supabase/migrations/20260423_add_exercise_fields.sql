-- Add name_en and video_url to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_en TEXT UNIQUE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
