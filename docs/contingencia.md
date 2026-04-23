# 🧠 Adaptive Training Engine — Functional Specification (v1)

## 📌 Overview

This document defines the **functional requirements and system logic** for handling:

- Missed training sessions
- Missed exercises
- User-added exercises/sessions
- Dynamic redistribution of training volume

The system is built on top of an existing **template-based training structure**, and introduces an **adaptive layer** that ensures optimal hypertrophy stimulus continuity.

---

# 🧠 CORE PRINCIPLE

> The system must manage **weekly stimulus per muscle group**, not rigid adherence to scheduled workouts.

---

# 🗄️ REQUIRED CONCEPTUAL DATA MODEL

## 1. Training Template (EXISTS)

Defines:
- weekly schedule
- exercises per session
- sets per exercise

---

## 2. Derived Muscle Volume Model (NEW — REQUIRED)

System must dynamically derive:

```ts
{
  muscle: string,
  weekly_target_sets: number,
  completed_sets: number,
  remaining_sets: number
}
````

---

## 3. Exercise → Muscle Mapping (REQUIRED)

Each exercise must map to one or more muscles:

```ts
{
  exercise_id: string,
  muscles: [
    { name: "chest", ratio: 1.0 },
    { name: "triceps", ratio: 0.3 }
  ]
}
```

---

# ⚙️ SYSTEM FLOW (HIGH LEVEL)

```pseudo id="flow_main"
ON workout_execution OR modification:

    update_completed_sets()

    recalculate_remaining_sets()

    IF imbalance_detected:
        trigger_redistribution()
```

---

# 1️⃣ TRACKING EXECUTION (MANDATORY)

## On workout completion:

```pseudo id="track_sets"
FOR each exercise:

    FOR each muscle:

        completed_sets += sets * ratio
```

---

# 2️⃣ MISSED EXERCISE HANDLING

## Definition:

User skips an exercise within a completed session.

---

## Required behavior:

```pseudo id="missed_exercise"
DO NOT reschedule exercise directly

INSTEAD:

    FOR each muscle affected:
        remaining_sets += missed_sets
```

---

## Constraint:

```pseudo id="constraint_no_dup"
System MUST NOT duplicate exercises blindly
```

---

# 3️⃣ MISSED SESSION HANDLING

## Case: 1 missed session

```pseudo id="miss_1"
shift_all_future_sessions_forward()
```

---

## Case: 2+ missed sessions

```pseudo id="miss_multi"
remaining_sets = target - completed
sessions_left = remaining_days

sets_per_session = remaining_sets / sessions_left
```

---

## Constraint:

```pseudo id="max_sets"
max_sets_per_muscle_per_session = 8
```

---

## Redistribution:

```pseudo id="redistribute"
IF sets_per_session > max:

    cap_sets_per_session

    discard_excess_volume
```

---

# 4️⃣ MULTI-DAY ABSENCE (3+ DAYS)

```pseudo id="miss_long"
discard_remaining_weekly_volume()

resume_standard_template()
```

---

## Constraint:

```pseudo id="no_compensation"
System MUST NOT attempt full compensation of missed volume
```

---

# 5️⃣ USER-ADDED EXERCISES

## Trigger:

User manually adds exercise or session

---

## Required behavior:

```pseudo id="manual_input"
detect_muscles()

FOR each muscle:

    completed_sets += sets * ratio

    remaining_sets -= sets * ratio
```

---

## Constraint:

```pseudo id="prevent_overflow"
remaining_sets MUST NOT go below zero
```

---

# 6️⃣ REDISTRIBUTION ENGINE

## Trigger conditions:

```pseudo id="trigger_redistribution"
IF remaining_sets > 0 AND sessions_left > 0
```

---

## Logic:

```pseudo id="redistribution_logic"
FOR each muscle:

    distribute remaining_sets across future sessions

    PRIORITY:
        1. sessions where muscle not yet trained
        2. sessions with lower volume
```

---

## Constraint:

```pseudo id="fatigue_control"
DO NOT exceed per-session fatigue threshold
```

---

# 7️⃣ FATIGUE SAFETY RULES

```pseudo id="fatigue_rules"
max_sets_per_muscle_per_session = 8

IF muscle already trained in session:
    DO NOT add extra sets
```

---

# 8️⃣ SESSION PRIORITIZATION

## When redistributing:

```pseudo id="priority_logic"
PRIORITIZE:

1. primary muscle days (e.g. chest in push)
2. sessions with similar movement pattern
3. earliest available session
```

---

# 9️⃣ STATE RECONCILIATION

System must recompute state after every action:

```pseudo id="state_recalc"
remaining_sets = target - completed
```

---

# 🔟 DATA CONSISTENCY RULES

* All calculations must be deterministic
* Weekly state must be reconstructable from logs
* No hidden state allowed

---

# 1️⃣1️⃣ OPTIONAL: STIMULUS BUDGET MODEL (ADVANCED)

```ts
{
  muscle: "chest",
  stimulus_budget: 12,
  fatigue_per_set: 1.2
}
```

---

## Usage:

```pseudo id="stimulus_logic"
IF fatigue_exceeds_threshold:
    block_additional_sets
```

---

# 1️⃣2️⃣ EDGE CASES

## Case: User exceeds planned volume

```pseudo id="overtraining_case"
IF completed_sets > target_sets:

    mark_as_overreached

    reduce_next_week_volume
```

---

## Case: No remaining sessions

```pseudo id="no_sessions"
discard_remaining_sets
```

---

# 1️⃣3️⃣ SYSTEM OUTPUTS

System must be able to provide:

```ts
{
  muscle_status: [
    {
      muscle: "chest",
      target: 12,
      completed: 10,
      remaining: 2
    }
  ],
  recommendations: [
    "Add 2 sets of chest in next session"
  ]
}
```

---

# 🧠 FINAL SYSTEM LOGIC

```pseudo id="final_logic"
INPUT: workout_execution

UPDATE completed_sets

RECALCULATE remaining_sets

IF missed_exercise:
    add back to pool

IF missed_session:
    redistribute

IF manual_input:
    adjust state

APPLY fatigue constraints

OUTPUT updated plan
```

---

# 🧠 CORE DESIGN PRINCIPLE

> Templates define structure.
> The adaptive engine guarantees results.

---

# 🚀 FINAL NOTE

This system is designed to:

* Handle real-world inconsistency
* Preserve hypertrophy stimulus
* Avoid overtraining
* Enable AI-driven optimization

---

# 🧠 FINAL RULE

> The system must never optimize for schedule adherence.
> It must always optimize for stimulus consistency.