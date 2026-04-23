-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indices for fuzzy search on exercises
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin (name gin_trgm_ops);

-- Add wrist_cm and ankle_cm to body_metrics
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS wrist_cm DECIMAL(5, 1);
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS ankle_cm DECIMAL(5, 1);

-- Create nutrition_plans table
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES athlete_profile(id),
    date DATE UNIQUE DEFAULT CURRENT_DATE,
    goal TEXT NOT NULL, -- e.g., "Bulking", "Cutting", "Maintenance"
    calories_target INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fats_g INTEGER NOT NULL,
    meals JSONB, -- Array of meals: { name: string, time: string, items: string[] }
    ai_logic TEXT, -- AI's reasoning for this plan
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to nutrition_plans (basic)
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to nutrition_plans" ON nutrition_plans FOR ALL USING (true);
