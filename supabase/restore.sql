-- ============================================================================
-- RESTORE — Antigravity Fitness
-- Schema original completo. Execute no SQL Editor do Supabase.
-- Dropa as tabelas existentes (criadas pelo Prisma com UUIDs) e recria
-- o schema original com SERIAL integer IDs.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop tables in reverse dependency order ──────────────────────────────────
DROP VIEW  IF EXISTS v_ai_context            CASCADE;
DROP VIEW  IF EXISTS v_current_week_volume   CASCADE;
DROP VIEW  IF EXISTS v_weekly_volume         CASCADE;
DROP VIEW  IF EXISTS v_exercise_progress     CASCADE;

DROP TABLE IF EXISTS clinical_alerts    CASCADE;
DROP TABLE IF EXISTS body_metrics       CASCADE;
DROP TABLE IF EXISTS planned_exercises  CASCADE;
DROP TABLE IF EXISTS planned_sessions   CASCADE;
DROP TABLE IF EXISTS training_phases    CASCADE;
DROP TABLE IF EXISTS workout_sets       CASCADE;
DROP TABLE IF EXISTS workout_sessions   CASCADE;
DROP TABLE IF EXISTS athlete_profile    CASCADE;
DROP TABLE IF EXISTS exercise_muscles   CASCADE;
DROP TABLE IF EXISTS exercises          CASCADE;

-- ============================================================================
-- 1. EXERCÍCIOS
-- ============================================================================
CREATE TABLE exercises (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL UNIQUE,
  movement_pattern TEXT,
  classification   TEXT,
  neural_demand    INTEGER CHECK (neural_demand BETWEEN 1 AND 10),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. DISTRIBUIÇÃO DE VOLUME — series_factor: 1.0 primário, 0.5 secundário
-- ============================================================================
CREATE TABLE exercise_muscles (
  exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group  TEXT NOT NULL,
  muscle        TEXT NOT NULL,
  series_factor DECIMAL(3,2) NOT NULL CHECK (series_factor IN (0.25, 0.5, 1.0)),
  PRIMARY KEY (exercise_id, muscle)
);

-- ============================================================================
-- 3. PERFIL DO ATLETA
-- ============================================================================
CREATE TABLE athlete_profile (
  id               SERIAL PRIMARY KEY,
  name             TEXT DEFAULT 'Atleta',
  experience_level TEXT DEFAULT 'Intermediário',
  injuries         TEXT[],
  training_days    INTEGER DEFAULT 4,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SESSÕES DE TREINO
-- ============================================================================
CREATE TABLE workout_sessions (
  id         SERIAL PRIMARY KEY,
  date       DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_date ON workout_sessions(date);

-- ============================================================================
-- 5. SÉRIES REALIZADAS
-- ============================================================================
CREATE TABLE workout_sets (
  id           SERIAL PRIMARY KEY,
  session_id   INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
  set_number   INTEGER NOT NULL,
  set_type     TEXT NOT NULL DEFAULT 'Working Set',  -- Working Set | Top Set | Back Off Set | Warming Set | Feeder Set
  set_technique TEXT DEFAULT 'Normal',               -- Normal | Drop Set | Super Set | Falsa Pirâmide | Rest-Pause | Cluster
  load_kg      DECIMAL(6,2),
  reps         INTEGER CHECK (reps > 0),
  rpe          DECIMAL(3,1) CHECK (rpe BETWEEN 1 AND 10),
  rir          INTEGER CHECK (rir BETWEEN 0 AND 10),
  notes        TEXT,
  tonnage      DECIMAL(8,2) GENERATED ALWAYS AS (
                 CASE WHEN load_kg IS NOT NULL AND reps IS NOT NULL
                 THEN load_kg * reps ELSE NULL END
               ) STORED,
  one_rm_epley DECIMAL(7,2) GENERATED ALWAYS AS (
                 CASE WHEN load_kg IS NOT NULL AND reps IS NOT NULL AND reps > 0
                 THEN ROUND((load_kg * (1 + reps / 30.0))::DECIMAL, 2)
                 ELSE NULL END
               ) STORED,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sets_session  ON workout_sets(session_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);

-- ============================================================================
-- 6. PLANEJAMENTO
-- ============================================================================
CREATE TABLE training_phases (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  etapa                INTEGER DEFAULT 1,            -- 1 = Força/Potência, 2 = Hipertrofia
  phase_type           TEXT,                         -- Acumulação | Transição | Intensificação | Teste | Hipertrofia_Resistência | Hipertrofia_Pico
  meso_number          INTEGER,
  technique_focus      TEXT,                         -- null | Drop Set | Super Set | Falsa Pirâmide
  phase_order          INTEGER NOT NULL,
  duration_weeks       INTEGER NOT NULL,
  target_rir_min       INTEGER,
  target_rir_max       INTEGER,
  volume_pct_tension   DECIMAL(4,2),
  volume_pct_metabolic DECIMAL(4,2),
  progression_rule     TEXT,
  is_current           BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE planned_sessions (
  id                SERIAL PRIMARY KEY,
  phase_id          INTEGER REFERENCES training_phases(id),
  name              TEXT,
  week_number       INTEGER NOT NULL,
  meso_week         INTEGER NOT NULL,
  session_number    INTEGER NOT NULL,
  day_of_week       INTEGER,
  planned_date      DATE,
  status            TEXT NOT NULL DEFAULT 'Pendente',
  actual_session_id INTEGER REFERENCES workout_sessions(id),
  ai_notes          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planned_sessions_date   ON planned_sessions(planned_date);
CREATE INDEX idx_planned_sessions_status ON planned_sessions(status);

CREATE TABLE planned_exercises (
  id                 SERIAL PRIMARY KEY,
  planned_session_id INTEGER NOT NULL REFERENCES planned_sessions(id) ON DELETE CASCADE,
  exercise_id        INTEGER NOT NULL REFERENCES exercises(id),
  sets_count         INTEGER NOT NULL,
  reps_min           INTEGER,
  reps_max           INTEGER,
  suggested_load_kg  DECIMAL(6,2),
  target_rpe         DECIMAL(3,1),
  target_rir         INTEGER,
  technique          TEXT,
  ai_feedback        TEXT,
  sort_order         INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. MÉTRICAS CORPORAIS
-- ============================================================================
CREATE TABLE body_metrics (
  id           SERIAL PRIMARY KEY,
  date         DATE NOT NULL UNIQUE,
  weight_kg    DECIMAL(5,2),
  height_cm    DECIMAL(5,1),
  bf_pct       DECIMAL(4,1),
  sleep_hours  DECIMAL(3,1),
  waist_cm     DECIMAL(5,1),
  chest_cm     DECIMAL(5,1),
  arms_cm      DECIMAL(5,1),
  forearms_cm  DECIMAL(5,1),
  thighs_cm    DECIMAL(5,1),
  calves_cm    DECIMAL(5,1),
  pain_notes   TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. ALERTAS CLÍNICOS
-- ============================================================================
CREATE TABLE clinical_alerts (
  id             SERIAL PRIMARY KEY,
  date           DATE NOT NULL,
  type           TEXT,
  body_region    TEXT,
  status_summary TEXT,
  recommendation TEXT,
  alert_flag     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_exercise_progress AS
WITH sessions_ranked AS (
  SELECT
    ws.exercise_id,
    s.date,
    SUM(ws.tonnage)      FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set') AND ws.rpe >= 7) AS tonnage_effective,
    MAX(ws.load_kg)                                                                                              AS max_load,
    SUM(ws.reps)         FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set'))                  AS total_reps,
    MAX(ws.one_rm_epley) FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set'))                  AS one_rm_epley,
    AVG(ws.rpe)          FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set'))                  AS avg_rpe,
    COUNT(*)             FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set'))                  AS working_sets_count,
    ARRAY_AGG(ws.reps ORDER BY ws.set_number) FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')) AS reps_array,
    ROW_NUMBER() OVER (PARTITION BY ws.exercise_id ORDER BY s.date DESC) AS rn
  FROM workout_sets ws
  JOIN workout_sessions s ON ws.session_id = s.id
  GROUP BY ws.exercise_id, s.date
),
pivoted AS (
  SELECT
    exercise_id,
    MAX(date)              FILTER (WHERE rn = 1) AS last_date,
    MAX(tonnage_effective) FILTER (WHERE rn = 1) AS last_tonnage,
    MAX(tonnage_effective) FILTER (WHERE rn = 2) AS prev_tonnage,
    MAX(max_load)          FILTER (WHERE rn = 1) AS last_load,
    MAX(one_rm_epley)      FILTER (WHERE rn = 1) AS last_1rm,
    MAX(total_reps)        FILTER (WHERE rn = 1) AS last_total_reps,
    MAX(avg_rpe)           FILTER (WHERE rn = 1) AS last_avg_rpe,
    MAX(working_sets_count)FILTER (WHERE rn = 1) AS last_sets_count,
    MAX(reps_array)        FILTER (WHERE rn = 1) AS last_reps_array
  FROM sessions_ranked WHERE rn <= 2 GROUP BY exercise_id
),
historical AS (
  SELECT exercise_id, MAX(max_load) AS record_load, MAX(one_rm_epley) AS best_1rm
  FROM sessions_ranked GROUP BY exercise_id
)
SELECT
  e.id AS exercise_id, e.name AS exercise,
  em.muscle_group AS grupo, em.muscle,
  p.last_date, p.last_load, h.record_load,
  p.last_1rm, h.best_1rm,
  p.last_tonnage, p.prev_tonnage,
  p.last_total_reps, p.last_avg_rpe, p.last_sets_count, p.last_reps_array,
  CASE
    WHEN p.prev_tonnage IS NULL OR p.prev_tonnage = 0 THEN '🆕'
    WHEN p.last_tonnage > p.prev_tonnage THEN '⬆️'
    WHEN p.last_tonnage < p.prev_tonnage THEN '⬇️'
    ELSE '↔️'
  END AS progress_icon,
  CASE
    WHEN p.prev_tonnage IS NULL OR p.prev_tonnage = 0 THEN 'Primeira Sessão'
    WHEN p.last_tonnage > p.prev_tonnage THEN '🚀 Progressão'
    WHEN p.last_tonnage < p.prev_tonnage THEN '⚠️ Regressão'
    ELSE '⚖️ Estagnado'
  END AS status
FROM exercises e
JOIN exercise_muscles em ON em.exercise_id = e.id AND em.series_factor = 1.0
JOIN pivoted p ON p.exercise_id = e.id
JOIN historical h ON h.exercise_id = e.id;

CREATE OR REPLACE VIEW v_weekly_volume AS
SELECT
  em.muscle_group,
  em.muscle,
  DATE_TRUNC('week', s.date)::DATE AS week_start,
  ROUND(SUM(em.series_factor) FILTER (
    WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')
      AND (ws.rpe IS NULL OR ws.rpe >= 7)
  )::DECIMAL, 2) AS effective_series,
  ROUND(SUM(em.series_factor) FILTER (
    WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')
  )::DECIMAL, 2) AS total_series,
  ROUND((SUM(em.series_factor) FILTER (
    WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')
      AND (ws.rpe IS NULL OR ws.rpe >= 7)
  ) / 20.0 * 100)::DECIMAL, 1) AS mrv_pct,
  AVG(ws.rpe) FILTER (
    WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')
  ) AS avg_rpe,
  COUNT(DISTINCT s.date) AS training_days
FROM workout_sets ws
JOIN workout_sessions s ON ws.session_id = s.id
JOIN exercise_muscles em ON em.exercise_id = ws.exercise_id
GROUP BY em.muscle_group, em.muscle, week_start;

CREATE OR REPLACE VIEW v_current_week_volume AS
SELECT * FROM v_weekly_volume
WHERE week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;

CREATE OR REPLACE VIEW v_ai_context AS
SELECT
  vw.muscle_group, vw.muscle,
  vw.effective_series AS current_week_series,
  vw.mrv_pct, vw.avg_rpe,
  CASE
    WHEN vw.effective_series >= 20 THEN 'MRV_ATINGIDO'
    WHEN vw.effective_series >= 15 THEN 'PROXIMO_MRV'
    WHEN vw.effective_series >= 10 THEN 'ZONA_OTIMA'
    WHEN vw.effective_series >= 5  THEN 'VOLUME_BAIXO'
    ELSE 'SEM_TREINO'
  END AS volume_status
FROM v_current_week_volume vw;

-- ============================================================================
-- RLS — desabilitar (acesso via service_role_key)
-- ============================================================================
ALTER TABLE exercises          DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscles   DISABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profile    DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets       DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_phases    DISABLE ROW LEVEL SECURITY;
ALTER TABLE planned_sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE planned_exercises  DISABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics       DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_alerts    DISABLE ROW LEVEL SECURITY;
