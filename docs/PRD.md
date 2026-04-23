# PRD — Antigravity Fitness

## Product Vision

Antigravity is a workout tracking and training management app for strength athletes following Jayme de Lamadrid's block periodization methodology (*Musculação para Naturais*). It replaces paper logs and spreadsheets with a clean interface that tracks sets, auto-calculates performance metrics, surfaces progression over time, and guides phase transitions based on real training data.

---

## Methodology: Block Periodization (Jayme de Lamadrid)

The macrocycle is divided into two strategic stages:

### Etapa 1 — Força e Potência

Builds work capacity and technique to tolerate larger volumes later.

| Phase | Mesos | Duration | RIR | Tension/Metabolic | Focus |
|-------|-------|----------|-----|-------------------|-------|
| Acumulação | 2 | ~4 weeks each | 2 | 40% / 60% | Linear inverse periodization, increasing sets each week |
| Transição | 1 | ~4 weeks | 2 | 60% / 40% | Shift to strength exercises; progress via rest reduction or isometric pauses |
| Intensificação | 1–2 | ~4 weeks each | 1 | 70% / 30% | Volume drops, load intensity rises sharply; free compound movements |
| Teste | — | 1 week | 0 | — | 1RM or AMRAP tests on all main exercises |

### Etapa 2 — Hipertrofia e Resistência

Uses the new strength ceiling to accumulate maximum hypertrophic volume.

**Fase de Hipertrofia e Resistência (4 Mesos)** — 40% tension / 60% metabolic, RIR 0–1:

| Meso | Progression Rule | Technique |
|------|-----------------|-----------|
| Meso 1 | 80% RM; weekly rep scheme changes: 8×2 → 6×3 → 5×4 → 4×5 | Normal |
| Meso 2 | Increase reps on Working Sets each week (8 → 9 → 10) | Normal |
| Meso 3 | Accumulate volume each microcycle | **Drop Set** |
| Meso 4 | Daily undulating periodization within sessions | **Super Set** |

**Fase de Hipertrofia Pico (2 Mesos)** — 30% tension / 70% metabolic, RPE 9–10:

| Meso | Rule |
|------|------|
| Meso 1 | High volume + **Falsa Pirâmide** technique; brutal effort intensity |
| Meso 2 | Peak volume at MRV with RPE 10; **+1 training day/week** (Full Body or Legs/Arms) |

After Meso 2, the macrocycle ends — competition, photo shoot, or structured rest.

---

## Phase Transition Triggers

The app monitors four triggers to determine when to advance a phase:

### 1. MRV_REACHED
- **Signal:** Weekly volume for any muscle group approaches or exceeds 20 sets AND tonnage trend shows stagnation (↔) or regression (↓)
- **Action:** Prescribe deload (−50% volume); transition from Accumulation → Intensification

### 2. NEURAL_PLATEAU
- **Signal:** 2 consecutive weeks of flat or declining performance when recovery data (sleep, energy) is good AND volume is moderate (<15 sets/week — not overtraining)
- **Action:** If during Intensification → trigger Semana de Teste immediately (prescribe 1RM/AMRAP); transition to Etapa 2

### 3. TEMPORAL
- **Signal:** Week count within current block reaches phase time limit
- **Action:**
  - After 2 Acumulação mesos (~8 weeks) → Transição
  - After 1 Transição meso (~4 weeks) → Intensificação
  - Meso 3 of Hipertrofia e Resistência → introduce Drop Set
  - Meso 4 → introduce Super Set

### 4. PEAK_FATIGUE
- **Signal:** Last phase (Hipertrofia Pico Meso 2) shows advanced technique use, volume near MRV, RPE consistently 9–10
- **Action:** Suggest +1 day frequency; after block ends → declare macrocycle complete

---

## Volume Calculation Rules

### Valid Sets (Working Sets)
Only count sets with `set_type IN ('Working Set', 'Top Set', 'Back Off Set')` AND `RPE ≥ 7`. Warming Sets and Feeder Sets contribute zero volume.

### Series Factor (series_factor)
Volume is distributed per muscle based on movement type:

| Exercise Type | Primary Muscle | Secondary Muscles |
|--------------|----------------|-------------------|
| Isolation (monoarticular) | 1.0 × sets | — |
| Compound (multiarticular) | 1.0 × sets | 0.5 × sets |

**Direction matters for shoulder subdvision:**
- Push movements (Supino, Press) → secondary shoulder volume → Deltóide Anterior
- Pull movements (Remada, Pulldown) → secondary shoulder volume → Deltóide Posterior

**Example:** 4 valid sets of Supino Reto = +4 Peitoral, +2 Deltóide Anterior, +2 Tríceps

### Volume Thresholds (per muscle group per week)
| Zone | Sets/week |
|------|-----------|
| MEV (Minimum Effective Volume) | 10 |
| Optimal Zone | 10–15 |
| Near MRV | 15–20 |
| MRV (Maximum Recoverable Volume) | 20 |

---

## Progression Priority

1. **Reps** — increase reps within the prescribed range
2. **Weight** — increase load when top of rep range is consistently hit
3. **Volume** — add sets only when reps and weight are stuck for 2 weeks

**Double progression rule:** Follow Reps → Weight cycle. If neither progresses for 2 weeks, adjust volume.

**Performance decision tree:**
```
if performance_down:
    decrease_volume  (fatigue / MRV overreach)

elif performance_flat:
    if low_fatigue:
        increase_volume (+2 sets/week)
    else:
        decrease_volume or deload
```

---

## Rest Time by Rep Range

| Reps | Rest Range |
|------|-----------|
| ≥10 (metabolic focus) | 1:00 – 1:45 |
| 8–9 | 1:45 – 2:15 |
| 6–7 | 2:15 – 2:45 |
| 5 (strength — first 3 sets) | 2:30 – 3:30 |
| 5 (strength — set 4+) | 3:00 – 4:00 |
| <5 (max tension) | 3:30 – 4:30 |

Rest is inversely proportional to reps. Exception: "density progression" microcycles where rest is intentionally shortened while keeping load constant.

---

## Training Frequency

- **Base:** 3–4 days/week. Enough to concentrate volume in productive sessions with adequate neural and articular recovery.
- **Frequency 2 (muscle twice/week):** Applied when a muscle group's weekly volume is too high for a single session (especially large groups like back or legs). Restructure to Upper/Lower or Full Body splits.
- **+1 Day exception:** Only at **Hipertrofia Pico Meso 2** — add one extra day (Full Body or Legs/Arms) solely to accommodate the final volume peak near MRV.

---

## Weak Point Correction Protocol

1. **Experience filter:** Beginners need general development, not isolation fixes. Weak-point targeting is for intermediate/advanced athletes only.
2. **Technical audit first:** Most "weak points" stem from flawed movement patterns or structural/genetic factors. Correct execution before adding volume.
3. **Repositioning:** Move weak-group exercises to the start of the session when performance capacity is highest.
4. **Frequency 2:** If volume increase is warranted, split across two days per week — never stack all extra sets into one session.

---

## Key Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| Tonnage | `load_kg × reps` | Raw work output per session |
| 1RM (Epley) | `load_kg × (1 + reps / 30)` | Normalizes progress across rep ranges |
| Progress status | `last_tonnage vs prev_tonnage` | 🆕 / ⬆️ / ↔️ / ⬇️ per exercise |
| RIR | `10 − RPE` | Reps In Reserve — auto-calculated |

---

## Data Model

```
TrainingPhase (etapa, phase_type, meso_number, technique_focus, is_current, target_rir_min/max)
  └─ PlannedSession (week_number, meso_week, day_of_week, planned_date, status)
       └─ PlannedExercise (sets_count, reps_min/max, suggested_load_kg, target_rpe/rir, technique, ai_feedback)
            └─ Exercise (name, movement_pattern, classification, neural_demand)
                 └─ ExerciseMuscle (muscle_group, muscle, series_factor ∈ {0.25, 0.5, 1.0})

WorkoutSession (date, notes)
  └─ WorkoutSet (exercise_id, set_number, set_type, set_technique, load_kg, reps, rpe, rir,
                 tonnage [GENERATED], one_rm_epley [GENERATED])

PlannedSession.actual_session_id → WorkoutSession (links template to real session after completion)

AthleteProfile (name, experience_level, injuries[], training_days)
BodyMetrics (date, weight_kg, height_cm, bf_pct, sleep_hours, body measurements, pain_notes, energy_level)
ClinicalAlerts (date, type, body_region, status_summary, recommendation, alert_flag)
```

### Views

| View | Purpose |
|------|---------|
| `v_exercise_progress` | Last vs prev session tonnage, 1RM, load, progress status per exercise |
| `v_weekly_volume` | Effective and total series per muscle per week (series_factor weighted) |
| `v_current_week_volume` | Current week slice of v_weekly_volume |
| `v_ai_context` | Volume status per muscle: `SEM_TREINO / VOLUME_BAIXO / ZONA_OTIMA / PROXIMO_MRV / MRV_ATINGIDO` |

### Set Types
`Working Set | Top Set | Back Off Set | Warming Set | Feeder Set`

### Set Techniques
`Normal | Drop Set | Super Set | Falsa Pirâmide | Rest-Pause | Cluster`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + CSS variables |
| Animations | Framer Motion |
| UI components | shadcn/ui (new-york, neutral) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| ORM | Prisma 7 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Features

### Done
- [x] Dashboard: weekly calendar, volume by muscle, progression charts
- [x] Workout player: set input (load, reps, RPE → RIR auto-calc), rest timer, exercise cards
- [x] Training plan view: phases, sessions, exercises with sets/reps/RIR targets
- [x] History view: completed sessions, PR records, per-exercise progression
- [x] Glassmorphism design system with Framer Motion animations
- [x] Mobile-first responsive layout (bottom nav mobile, sidebar desktop)
- [x] DB layer: `lib/db/` functions wired into WorkoutProvider via Server Component props

### Planned
- [ ] AI coaching notes via `PlannedExercise.ai_feedback` in workout player
- [ ] Phase management UI: create / edit phases and sessions
- [ ] Body metrics tracking (BodyMetrics + ClinicalAlerts tables)
- [ ] Phase transition trigger detection and alerts
- [ ] Multi-user / auth (Supabase Auth)
