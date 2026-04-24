-- 006_adaptive_engine.sql
-- Adaptive Training Engine: DB additions for Tier 1/2/3 AI coaching loop

-- ─── AthleteProfile additions ────────────────────────────────────────────────
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS training_day_mask    INT[]   DEFAULT '{1,3,5}';
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS auto_weekly_plan      BOOLEAN DEFAULT true;
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS auto_contingency_plan BOOLEAN DEFAULT true;
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS auto_phase_alert      BOOLEAN DEFAULT true;

-- ─── PlannedSession additions ─────────────────────────────────────────────────
ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS iso_week    INT;
ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS iso_year    INT;
ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS tier        INT DEFAULT 1;

-- ─── PlannedExercise additions ────────────────────────────────────────────────
ALTER TABLE planned_exercises ADD COLUMN IF NOT EXISTS actual_sets_done  INT;
ALTER TABLE planned_exercises ADD COLUMN IF NOT EXISTS actual_load_kg    DECIMAL(6,2);
ALTER TABLE planned_exercises ADD COLUMN IF NOT EXISTS contingency_added BOOLEAN DEFAULT false;

-- ─── weekly_plan_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_plan_logs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_week                INT         NOT NULL,
  iso_year                INT         NOT NULL,
  phase_id                UUID        REFERENCES training_phases(id),
  tier                    INT         NOT NULL,
  trigger_type            VARCHAR(50),
  context_sent            TEXT,
  ai_response             TEXT,
  sessions_updated        INT         DEFAULT 0,
  contingencies_detected  JSONB,
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE weekly_plan_logs DISABLE ROW LEVEL SECURITY;

-- ─── contingency_events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contingency_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date                DATE        NOT NULL,
  week_log_id         UUID        REFERENCES weekly_plan_logs(id),
  event_type          VARCHAR(50) NOT NULL,
  muscle_affected     VARCHAR(100),
  sets_missed         DECIMAL(4,1),
  sets_redistributed  DECIMAL(4,1),
  resolution          VARCHAR(50),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contingency_events DISABLE ROW LEVEL SECURITY;
