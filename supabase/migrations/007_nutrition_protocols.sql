-- 007_nutrition_protocols.sql
-- Replaces per-day nutrition_plans with phase-based nutrition_protocols.
-- nutrition_plans is kept intact (historical data); protocols become the source of truth.

-- ── 1. nutrition_protocols ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_protocols (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  goal              TEXT    NOT NULL,
  start_date        DATE    NOT NULL,
  end_date          DATE,                             -- NULL = currently active
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  calories_training INT,                             -- kcal target on training days
  calories_rest     INT,                             -- kcal target on rest days (NULL = same as training)
  protein_g         INT,
  carbs_g           INT,
  carbs_rest_g      INT,                             -- lower carbs on rest days (optional)
  fat_g             INT,
  meals             JSONB   NOT NULL DEFAULT '[]',
  ai_logic          TEXT    NOT NULL DEFAULT '',
  recommendations   TEXT[]  NOT NULL DEFAULT '{}',
  weight_at_start   DECIMAL(5,2),
  phase_id          UUID REFERENCES training_phases(id) ON DELETE SET NULL,
  model_used        TEXT    DEFAULT 'Pump Adaptive Engine v2',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. nutrition_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id      UUID NOT NULL REFERENCES nutrition_protocols(id) ON DELETE CASCADE,
  date             DATE NOT NULL UNIQUE,
  actual_calories  INT,
  actual_protein_g INT,
  actual_carbs_g   INT,
  actual_fat_g     INT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Migrate existing nutrition_plans → nutrition_protocols ────────────────
-- One protocol per distinct goal; most recent goal = active.
-- Uses the most recent row for each goal as the representative targets.
DO $$
DECLARE
  latest_goal TEXT;
BEGIN
  -- Only migrate if there is existing data
  IF EXISTS (SELECT 1 FROM nutrition_plans LIMIT 1) THEN

    -- Find the most recent goal to mark as active
    SELECT goal INTO latest_goal
    FROM nutrition_plans
    ORDER BY date DESC
    LIMIT 1;

    INSERT INTO nutrition_protocols (
      goal, start_date, end_date, is_active,
      calories_training, protein_g, carbs_g, fat_g,
      meals, ai_logic, recommendations,
      weight_at_start, phase_id, model_used, created_at
    )
    SELECT
      np.goal,
      MIN(np.date)::DATE          AS start_date,
      CASE
        WHEN np.goal = latest_goal THEN NULL
        ELSE MAX(np.date)::DATE
      END                         AS end_date,
      (np.goal = latest_goal)     AS is_active,
      -- Use targets from the most recent entry for this goal
      (SELECT n2.calories_target
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date DESC LIMIT 1)            AS calories_training,
      (SELECT n2.protein_g
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date DESC LIMIT 1)            AS protein_g,
      (SELECT n2.carbs_g
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date DESC LIMIT 1)            AS carbs_g,
      (SELECT n2.fat_g
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date DESC LIMIT 1)            AS fat_g,
      COALESCE(
        (SELECT n2.meals
           FROM nutrition_plans n2
          WHERE n2.goal = np.goal
          ORDER BY n2.date DESC LIMIT 1), '[]')   AS meals,
      COALESCE(
        (SELECT n2.ai_logic
           FROM nutrition_plans n2
          WHERE n2.goal = np.goal
          ORDER BY n2.date DESC LIMIT 1), '')      AS ai_logic,
      COALESCE(
        (SELECT n2.recommendations
           FROM nutrition_plans n2
          WHERE n2.goal = np.goal
          ORDER BY n2.date DESC LIMIT 1), '{}')   AS recommendations,
      (SELECT n2.weight_at_generation
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date ASC LIMIT 1)             AS weight_at_start,
      (SELECT n2.phase_id
         FROM nutrition_plans n2
        WHERE n2.goal = np.goal
        ORDER BY n2.date DESC LIMIT 1)            AS phase_id,
      COALESCE(
        (SELECT n2.model_used
           FROM nutrition_plans n2
          WHERE n2.goal = np.goal
          ORDER BY n2.date DESC LIMIT 1),
        'Pump Adaptive Engine v2')                AS model_used,
      NOW()                                       AS created_at
    FROM nutrition_plans np
    GROUP BY np.goal, latest_goal;

  END IF;
END
$$;
