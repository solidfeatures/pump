-- Drop existing table if exists (cleaning up from previous attempt)
DROP TABLE IF EXISTS nutrition_plans CASCADE;

-- Create nutrition_plans table with PRD schema (adapted for UUIDs)
CREATE TABLE nutrition_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at          TIMESTAMPTZ DEFAULT NOW(),
  phase_id              UUID REFERENCES training_phases(id),
  weight_at_generation  DECIMAL(5,2),
  target_calories       INTEGER,
  protein_g             INTEGER,
  carbs_g               INTEGER,
  fat_g                 INTEGER,
  observations          TEXT,
  recommendations       TEXT[],
  meal_plan             JSONB,
  model_used            TEXT DEFAULT 'claude-3-5-sonnet',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure body_metrics has all required columns (already there but good to be sure)
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS wrist_cm DECIMAL(5,1);
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS ankle_cm DECIMAL(5,1);

-- Disable RLS for nutrition_plans
ALTER TABLE nutrition_plans DISABLE ROW LEVEL SECURITY;

-- AI coaching rules view (v_ai_rules) — ensure it exists
-- This view should pull from ai_coaching_rules and filter active ones
CREATE OR REPLACE VIEW v_ai_rules AS
SELECT * FROM ai_coaching_rules WHERE is_active = true;
