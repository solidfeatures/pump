-- ============================================================================
-- RECREATE VIEWS
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
