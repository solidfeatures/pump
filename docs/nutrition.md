# 🧠 AI Hypertrophy Nutrition Engine — Functional Specification (v2)

## 📌 Overview

This system calculates, stores, and adapts nutrition plans for hypertrophy using:

- User body metrics (daily tracking)
- Nutrition plans (daily generated)
- Adaptive feedback loop

Integrated with PostgreSQL (Supabase schema provided)

---

# 🗄️ DATABASE SCHEMA (SOURCE OF TRUTH)

## Table: `body_metrics`

Stores daily physiological and recovery data.

### Key fields used by engine:

```ts
date: date (UNIQUE)
weight_kg: number
height_cm: number
bf_pct: number (optional)
sleep_hours: number
energy_level: number (1–10)
````

---

## Table: `nutrition_plans`

Stores generated daily nutrition plan.

### Key fields:

```ts
date: date (UNIQUE)
goal: "bulking" | "cutting" | "maintenance"

calories_target: number
protein_g: number
carbs_g: number
fat_g: number

meals: jsonb
recommendations: text[]

ai_logic: text (EXPLANATION OF DECISION PROCESS)
```

---

# ⚙️ SYSTEM FLOW (END-TO-END)

```pseudo
1. Fetch latest body_metrics
2. Calculate TDEE
3. Apply goal adjustment
4. Calculate macros
5. Apply adaptive logic
6. Generate meal plan
7. Save to nutrition_plans
```

---

# 1️⃣ INPUT RESOLUTION

## Source Priority:

```pseudo
latest_metrics = SELECT * FROM body_metrics ORDER BY date DESC LIMIT 1
```

## Required fields:

```pseudo
IF weight_kg IS NULL:
    throw error "Weight required"

IF height_cm IS NULL:
    use last known OR fallback default
```

---

# 2️⃣ BMR CALCULATION

```pseudo
IF male:
    BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5

IF female:
    BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

---

# 3️⃣ TDEE CALCULATION

## Activity inference (IMPORTANT)

Instead of static input, infer from:

```pseudo
IF training_frequency >= 5:
    activity_factor = 1.725

ELSE IF training_frequency >= 3:
    activity_factor = 1.55

ELSE:
    activity_factor = 1.375
```

```pseudo
TDEE = BMR × activity_factor
```

---

# 4️⃣ GOAL-BASED CALORIC ADJUSTMENT

```pseudo
IF goal == "bulking":
    calories = TDEE + 250

IF goal == "cutting":
    calories = TDEE - 400

IF goal == "maintenance":
    calories = TDEE
```

---

# 5️⃣ MACRONUTRIENT CALCULATION

## Protein (priority variable)

```pseudo
IF bf_pct EXISTS:
    lean_mass = weight × (1 - bf_pct)
    protein = lean_mass × 2.2
ELSE:
    protein = weight × 2.0
```

---

## Fat

```pseudo
fat = weight × 0.8
```

---

## Carbs

```pseudo
protein_cal = protein × 4
fat_cal = fat × 9

remaining = calories - (protein_cal + fat_cal)

carbs = remaining / 4
```

---

# 6️⃣ ADAPTIVE ENGINE (CRITICAL)

## Fetch last 7 entries:

```pseudo
metrics_7d = SELECT * FROM body_metrics ORDER BY date DESC LIMIT 7
```

---

## Calculate weight trend:

```pseudo
weight_change = (latest - oldest) / oldest
```

---

## Decision logic:

```pseudo
IF goal == "bulking":

    IF weight_change > 0.005:
        calories -= 150

    IF weight_change < 0.0025:
        calories += 150
```

---

## Recovery adjustments:

```pseudo
IF sleep_hours < 6 OR energy_level < 4:
    reduce_training_stress_flag = TRUE
    increase_carbs += 10%
```

---

# 7️⃣ MEAL PLAN GENERATION

Stored in:

```ts
meals: jsonb
```

### Structure:

```json
[
  {
    "meal": "breakfast",
    "foods": [
      { "name": "eggs", "grams": 150 },
      { "name": "oats", "grams": 80 }
    ],
    "macros": {
      "protein": 30,
      "carbs": 40,
      "fat": 15
    }
  }
]
```

---

# 8️⃣ RECOMMENDATIONS ENGINE

Populate:

```ts
recommendations: text[]
```

Examples:

* "Increase carbs on training days"
* "Sleep below optimal — prioritize recovery"
* "Weight gain too fast — reduce calories"

---

# 9️⃣ AI EXPLANATION (MANDATORY)

Field:

```ts
ai_logic: text
```

Must include:

* Why calories were adjusted
* Why macros were chosen
* Observations from body_metrics

---

# 🔟 WRITE OPERATION

```sql
INSERT INTO nutrition_plans (...)
VALUES (...)
ON CONFLICT (date) DO UPDATE
```

---

# 1️⃣1️⃣ SYSTEM CONSTRAINTS

* One plan per day (`UNIQUE date`)
* Must always generate:

  * calories_target
  * protein_g
  * carbs_g
  * fat_g
* Protein ≥ 1.6g/kg ALWAYS
* Fat ≥ 0.6g/kg ALWAYS

---

# 1️⃣2️⃣ ERROR HANDLING

```pseudo
IF no body_metrics:
    throw "No data available"

IF macros < physiological limits:
    recalculate
```

---

# 1️⃣3️⃣ PERFORMANCE

* Query time < 100ms
* Calculation deterministic
* Idempotent daily generation

---

# 1️⃣4️⃣ FUTURE EXTENSIONS

* Integration with training volume
* Hormonal markers
* Bloodwork inputs
* AI adaptive coaching

---

# 🧠 FINAL SYSTEM LOGIC

```pseudo
FETCH metrics →
CALCULATE BMR →
CALCULATE TDEE →
APPLY GOAL →
CALCULATE MACROS →
APPLY ADAPTATION →
GENERATE MEALS →
STORE →
FEEDBACK LOOP
```

---

# 🧠 CORE PRINCIPLE

> The system does not aim to be perfect on day one.
> It aims to **converge to optimal through feedback.**