# Adaptive Training Engine — Functional Requirements (v1)

## 1. Overview

The Adaptive Training Engine replaces the static weekly calendar with a **three-tier AI coaching loop** that mimics a dedicated personal trainer operating at three different time horizons:

| Tier | Name | Trigger | Context window |
|---|---|---|---|
| 1 | **Global Plan** | Profile complete OR end of phase | Full macrocycle + biometric history |
| 2 | **Weekly Plan** | Start of each training week | Current phase + last 7 days |
| 3 | **Contingency Replan** | After each workout executed | Last workout + remaining week |

All three tiers share a single compact context format (the same token-efficient structure already used in `generate-plan`) and write their output to the same `planned_sessions` / `planned_exercises` tables.

---

## 2. Weekly Day Selector (UI Redesign)

### 2.1 Current behavior (to be replaced)
The weekly calendar displays individual planned session cards per day, draggable between columns.

### 2.2 New behavior
The weekly grid becomes a **conceptual day-selector**: the athlete chooses which days of the week are training days. The AI uses these preferred days as anchors when generating weekly sessions.

**UI rules:**
- Seven day columns (Mon–Sun), each toggleable ON/OFF
- Active days highlighted; inactive days greyed out
- The selected set of days is stored on `AthleteProfile.training_day_mask` (bitmask `[1,3,5]` = Mon/Wed/Fri)
- Below the selector: the AI-generated plan for the **current week** is displayed, one card per active day
- Each card shows: session name, top exercises, sets×reps targets, RPE, load suggestions from progression history
- Drag-and-drop between active days is still supported (swaps the sessions for those days within the current week plan)

### 2.3 State transitions
```
Day selector → saves training_day_mask
             → triggers Tier 2 (Weekly Plan) if current week has no plan yet
```

---

## 3. Tier 1 — Global Plan

### 3.1 Trigger conditions
- User completes minimum required data:
  - At least one `BodyMetric` record with `weight_kg` and `height_cm`
  - `AthleteProfile.goal` set
  - `AthleteProfile.training_day_mask` set (≥ 2 days)
- OR: current phase reaches its `duration_weeks` limit (phase transition)
- OR: user manually requests via "Gerar Plano com IA"

### 3.2 Inputs (compact context)
```
ATLETA, HIST (12 weeks exercise history + 1RM estimates), VOL_SEM,
REGRAS (active coaching rules), ALERTAS_CLINICOS, PLANO_EXERC,
SPLIT, MEDIDAS (weight/BF/height), FASES_ANTERIORES
```

### 3.3 Outputs (writes to DB)
- All `TrainingPhase` records for the macrocycle (Etapa 1 + Etapa 2)
- For **each phase**: one `PlannedSession` per training day (template, `week_number = 0`)
  - Template sessions have `is_template = true` (new column)
  - They define the canonical exercise selection per session type
- A new `NutritionPlan` for the first phase

### 3.4 Existing implementation
Already implemented in `app/api/ai/generate-plan/route.ts`. Needs only the `is_template` flag addition and the `training_day_mask` read.

---

## 4. Tier 2 — Weekly Plan

### 4.1 Trigger conditions
- Monday of each training week (or first active day of week if Monday is off)
- Triggered automatically when user opens the app on a new week with no current-week plan
- Manually triggerable via "Planejar Semana" button

### 4.2 Inputs (compact context — 7-day window)
```
ATLETA, OBJETIVO, FASE_ATUAL (name/RIR/RPE/progression_rule)
SEMANA_PASSADA: [
  { session, date, exercises: [{ name, sets_done, loads, reps, rpe, 1rm_estimado }] }
]
VOL_SEMANA_PASSADA: { muscle: sets_completed }
PROGRESSAO: [{ exercise, trend: +/-/= , last_1rm, delta_pct }]
MEDIDAS: { weight, bf_pct, energy_level, sleep_hours }
NUTRICAO: { calories, protein, goal }
DIAS_DISPONIVEIS: [1,3,5]  // training_day_mask
```

### 4.3 AI task
Given last week's performance, generate for each training day this week:
- Which exercises to do (same template base, adjusted by progression)
- Exact sets × reps × load suggestion per exercise
- RPE/RIR targets
- Short coaching note per session

### 4.4 Outputs (writes to DB)
- One `PlannedSession` per active day, with `week_number = current_week`, `is_template = false`
- Each session has `PlannedExercise` rows with `suggested_load_kg` pre-filled from progression
- `NutritionPlan` updated if weight trend changed more than ±1% from last week
- `WeeklyPlanLog` record (new table — see §7)

### 4.5 Load suggestion algorithm
```
IF exercise.status = 'progressing':
    suggested_load = last_load + progression_increment (2.5kg compounds / 1kg isolators)
IF exercise.status = 'stagnant':
    suggested_load = last_load
    suggested_reps = last_reps + 1  // try to break rep ceiling first
IF exercise.status = 'regressing':
    suggested_load = last_load * 0.95  // deload the exercise
```

### 4.6 Progress checks before generation
- If current phase `week_number >= duration_weeks` → flag phase transition, prompt Tier 1
- If any muscle group `completed_sets >= MRV (20)` last week → flag overreaching, reduce volume in next week plan

---

## 5. Tier 3 — Contingency Replan

### 5.1 Trigger conditions
- A `WorkoutSession` is marked complete (new sets saved with `set_type` in [Working Set, Top Set, Back Off Set])
- Specifically: when a session is completed that corresponds to a `PlannedSession` for the current week

### 5.2 What it detects (contingency check)
Following `docs/contingencia.md`:

| Event | Detection |
|---|---|
| **Missed exercise** | `PlannedExercise` has no corresponding `WorkoutSet` in the linked session |
| **Partial sets** | `sets_done < planned_sets_count` for an exercise |
| **Missed session** | A `PlannedSession` for a past day this week has no linked `actual_session_id` |
| **Extra exercise** | `WorkoutSet` exists for an exercise not in the `PlannedExercise` list |
| **Multi-day absence** | 3+ consecutive planned sessions without completion |

### 5.3 Inputs (compact context — single workout)
```
ATLETA_BASICO: { level, goal, phase }
SESSAO_EXECUTADA: {
  date, name,
  executado: [{ exercise, sets_done, loads, reps, rpe }],
  planejado:  [{ exercise, sets_planned, target_load, target_rpe }]
}
VOLUME_SEMANA_ATÉ_AGORA: { muscle: sets_completed }
SESSOES_RESTANTES_SEMANA: [{ date, day, planned_exercises }]
CONTINGENCIAS: [{ type: 'missed_exercise'|'missed_session'|'partial_sets', muscle, sets_missed }]
```

### 5.4 AI task
- Assess what muscles were under-stimulated
- Redistribute missing volume across remaining sessions this week
- Follow fatigue constraints: max 8 sets per muscle per session
- If 3+ missed days: discard remainder, resume template next week
- Output per remaining session: exercises to add/adjust + loads + coaching note

### 5.5 Outputs (writes to DB)
- Updates `PlannedExercise` rows for remaining sessions this week (adds sets or adjusts loads)
- Creates a `ContingencyEvent` record (new table — see §7)
- Sends a push notification / toast: "2 sets de Peito redistribuídos para Sex"

### 5.6 Hard rules (from contingencia.md)
```
max_sets_per_muscle_per_session = 8
IF muscle already trained in remaining session → DO NOT add
IF 3+ days absent → discard_remaining, resume_template
remaining_sets MUST NOT go below 0
IF completed_sets > target_sets → mark overreached, reduce next_week volume
```

---

## 6. Readiness Gate (Minimum Data Check)

Before triggering any AI tier, the system checks:

| Field | Required for Tier 1 | Required for Tier 2 | Required for Tier 3 |
|---|---|---|---|
| `AthleteProfile.goal` | ✅ | ✅ | — |
| `AthleteProfile.training_days` or `training_day_mask` | ✅ | ✅ | — |
| `BodyMetric.weight_kg` | ✅ | ✅ | — |
| `BodyMetric.height_cm` | ✅ | — | — |
| At least 1 `WorkoutSession` with sets | — | ✅ | ✅ |
| `TrainingPhase` (is_current = true) | — | ✅ | ✅ |
| `PlannedSession` for current week | — | — | ✅ |

If any required field is missing, the system shows a **readiness checklist** in the UI instead of attempting generation.

---

## 7. New DB Structures Required

### 7.1 `AthleteProfile` additions
```sql
ALTER TABLE athlete_profile ADD COLUMN training_day_mask INT[] DEFAULT '{1,3,5}';
-- e.g. {1,3,5} = Mon/Wed/Fri

ALTER TABLE athlete_profile ADD COLUMN auto_weekly_plan      BOOLEAN DEFAULT true;
-- User can disable: AI will NOT auto-generate sessions each Monday

ALTER TABLE athlete_profile ADD COLUMN auto_contingency_plan BOOLEAN DEFAULT true;
-- User can disable: Tier 3 will NOT run after completed workouts

ALTER TABLE athlete_profile ADD COLUMN auto_phase_alert      BOOLEAN DEFAULT true;
-- User can disable: phase transition suggestions will NOT be triggered automatically
```

### 7.2 `PlannedSession` additions
```sql
ALTER TABLE planned_sessions ADD COLUMN is_template   BOOLEAN DEFAULT false;
ALTER TABLE planned_sessions ADD COLUMN iso_week      INT;     -- ISO week number
ALTER TABLE planned_sessions ADD COLUMN iso_year      INT;     -- year
ALTER TABLE planned_sessions ADD COLUMN tier          INT DEFAULT 1;
-- tier: 1 = global template, 2 = weekly plan, 3 = contingency adjustment
```

### 7.3 `PlannedExercise` additions
```sql
ALTER TABLE planned_exercises ADD COLUMN actual_sets_done  INT;
ALTER TABLE planned_exercises ADD COLUMN actual_load_kg    DECIMAL(6,2);
ALTER TABLE planned_exercises ADD COLUMN contingency_added BOOLEAN DEFAULT false;
-- marks sets redistributed by Tier 3
```

### 7.4 New table: `weekly_plan_logs`
```sql
CREATE TABLE weekly_plan_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_week     INT NOT NULL,
  iso_year     INT NOT NULL,
  phase_id     UUID REFERENCES training_phases(id),
  tier         INT NOT NULL,                    -- 2 = weekly, 3 = contingency
  trigger_type VARCHAR(50),                     -- 'auto_monday'|'post_workout'|'manual'
  context_sent TEXT,                            -- compact context string sent to AI
  ai_response  TEXT,                            -- raw AI JSON response
  sessions_updated INT DEFAULT 0,
  contingencies_detected JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### 7.5 New table: `contingency_events`
```sql
CREATE TABLE contingency_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  week_log_id     UUID REFERENCES weekly_plan_logs(id),
  event_type      VARCHAR(50) NOT NULL,
  -- 'missed_exercise'|'missed_session'|'partial_sets'|'extra_exercise'|'multi_day_absence'
  muscle_affected VARCHAR(100),
  sets_missed     DECIMAL(4,1),
  sets_redistributed DECIMAL(4,1),
  resolution      VARCHAR(50),
  -- 'redistributed'|'discarded'|'absorbed'|'none'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. API Routes Required

| Route | Method | Tier | Description |
|---|---|---|---|
| `/api/ai/generate-plan` | POST | 1 | Already exists. Add `is_template`, `training_day_mask` read |
| `/api/ai/weekly-plan` | POST | 2 | New. Generates this week's sessions from last week's data |
| `/api/ai/contingency` | POST | 3 | New. Post-workout replan following contingencia.md rules |
| `/api/plan/training-days` | PATCH | — | Saves `training_day_mask` to AthleteProfile |
| `/api/plan/week-status` | GET | — | Returns current week's plan status (sessions done/remaining, volume per muscle) |

---

## 9. UI Components Required

### 9.1 `WeeklyDaySelector` (replaces calendar grid)
- 7 toggle buttons Mon–Sun
- Saves `training_day_mask` on change
- Triggers Tier 2 if current week has no plan

### 9.2 `WeeklySessionCard` (replaces `DraggableSession`)
- Shows: session name, AI coaching note, exercise list with load targets
- Status indicator: Pendente / Em Andamento / Concluída / Parcial
- Tap to open session detail / start workout
- Drag between active days still supported

### 9.3 `ReadinessGate`
- Shown instead of plan when minimum data is missing
- Checklist: profile ✅, peso ✅, dias de treino ✅, fase ativa ✅
- Each item links to the relevant page to fill the data

### 9.4 `ContingencyBadge`
- Appears on the weekly view when Tier 3 has redistributed volume
- Shows: "2 séries de Peito redistribuídas para Sex" with expand detail
- Dismissable

### 9.5 `WeekPlanStatus` bar (top of Sessions tab)
- Compact horizontal bar: `Semana 3 de 4 · Fase: Acumulação`
- Volume per muscle group: mini progress bars (completed/target)
- "Planejar Semana" manual trigger button

---

## 10. Data Flow Diagram

```
WorkoutSession saved
        │
        ▼
 Tier 3: Contingency Check
        │
   missed sets?  ─────────── NO ──► update completed_sets, done
        │ YES
        ▼
 calculate remaining_sets per muscle
        │
 sessions_left this week?
        │ YES                         NO
        ▼                             ▼
 redistribute (max 8/session)    discard remainder
 update PlannedExercise rows     resume_template next week
        │
        ▼
 log ContingencyEvent
 notify user


Monday / new week
        │
        ▼
 Tier 2: Weekly Plan
        │
 fetch last week sessions + progression
        │
 build compact context (token-efficient)
        │
 call OpenAI (AI_MODEL from env)
        │
 parse JSON → PlannedSession + PlannedExercise rows
        │
 update NutritionPlan if weight trend changed
        │
 log WeeklyPlanLog


Profile complete / phase ends
        │
        ▼
 Tier 1: Global Plan (existing generate-plan route)
```

---

## 11. Compact Context Format for Tier 2 and Tier 3

Both weekly and contingency calls use the same token-efficient format established in `generate-plan`:

### Tier 2 context (~400–600 tokens)
```
ATLETA:{nm:"João",lvl:"Int",obj:"Crescer Seco",dias:[1,3,5],gen:M,age:25,pc:82}
FASE:{nome:"Acumulação E1",rir:"2-3",rpe:7,semana:3/4,prog:"linear +2.5kg"}
SEMANA_ANT:[
  {dia:1,nome:"Upper A",exec:[{ex:"Supino",s:4,kg:85,r:10,rpe:8,1rm:113},{ex:"Remada",s:4,kg:80,r:10,rpe:7,1rm:107}]}
  {dia:3,nome:"Lower A",exec:[{ex:"Agachamento",s:4,kg:100,r:8,rpe:8,1rm:127}]}
]
VOL_ANT:{Peito:12,Costas:10,Quad:10,Isquio:6,Ombro:6}
PROG:[{ex:"Supino",trend:+,delta:+3%},{ex:"Agachamento",trend:+,delta:+5%}]
MEDIDAS:{pc:82,sono:7,energia:8}
DIAS_SEMANA:[1,3,5]
```

### Tier 3 context (~300–500 tokens)
```
FASE:{nome:"Acumulação E1",rir:"2-3"}
SESSAO_HOJE:{nome:"Upper A",data:"2026-04-28",
  exec:[{ex:"Supino",s:3/4,kg:85,r:10}],
  faltou:[{ex:"Remada",s:4,motivo:"skipped"}]
}
VOL_HOJE:{Peito:12,Costas:0}
SESS_RESTANTES:[
  {dia:5,nome:"Lower A",exerc:["Agachamento","RDL","Leg Press"]},
]
CONTINGENCIAS:[{tipo:"missed_exercise",musculo:"Costas",series:4}]
```

---

## 12. Implementation Priority

| # | Component | Complexity | Depends on |
|---|---|---|---|
| 1 | DB migrations (§7) | Low | — |
| 2 | `training_day_mask` save + `WeeklyDaySelector` UI | Low | Migration 1 |
| 3 | `ReadinessGate` component | Low | — |
| 4 | `/api/plan/week-status` (volume progress per muscle) | Medium | Migration 1 |
| 5 | `/api/ai/weekly-plan` (Tier 2) | High | Migrations 1–2, week-status |
| 6 | `WeeklySessionCard` + `WeekPlanStatus` bar | Medium | Tier 2 route |
| 7 | `/api/ai/contingency` (Tier 3) | High | Tier 2, contingencia.md rules |
| 8 | `ContingencyBadge` + notification | Low | Tier 3 route |

---

## 13. Auto-Plan Settings

The athlete can individually enable/disable each AI automation tier via an **AI Settings** panel in the Profile page.

### 13.1 Toggles

| Toggle | DB field | Default | Effect when OFF |
|---|---|---|---|
| **Replanejamento Semanal Automático** | `auto_weekly_plan` | ON | Tier 2 does NOT run on Monday; user must click "Planejar Semana" manually |
| **Replanejamento por Contingência** | `auto_contingency_plan` | ON | Tier 3 does NOT run after a completed workout; volume redistribution never happens |
| **Alertas de Transição de Fase** | `auto_phase_alert` | ON | Phase transition threshold warnings are suppressed; user must check manually |

### 13.2 UI
- Section in Profile page titled "Automação de IA"
- Each toggle: label + short description + on/off switch
- Saves immediately on toggle change (PATCH `/api/plan/training-days` handles mask + `PATCH /api/profile` handles booleans)

### 13.3 Gate behaviour
All three Tier routes (`/api/ai/weekly-plan`, `/api/ai/contingency`) check the corresponding flag before calling OpenAI. If the flag is false and the trigger is automatic (not a manual button press), the route returns early with `{ skipped: true, reason: 'auto_plan_disabled' }`.

---

## 14. Out of Scope (v1)

- Push notifications (browser/mobile) — deferred to v2
- Automatic phase transition execution (flagged but not auto-applied)
- Multi-athlete / coach dashboard
- Long-term periodization auto-adjustment beyond one macrocycle
