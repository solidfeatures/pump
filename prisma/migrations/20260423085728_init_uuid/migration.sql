-- CreateTable
CREATE TABLE "training_phases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "etapa" INTEGER NOT NULL DEFAULT 1,
    "phase_type" TEXT,
    "meso_number" INTEGER,
    "technique_focus" TEXT,
    "phase_order" INTEGER NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "target_rir_min" INTEGER,
    "target_rir_max" INTEGER,
    "volume_pct_tension" DECIMAL(4,2),
    "volume_pct_metabolic" DECIMAL(4,2),
    "progression_rule" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "movement_pattern" TEXT,
    "classification" TEXT,
    "neural_demand" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_muscles" (
    "exercise_id" UUID NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "muscle" TEXT NOT NULL,
    "series_factor" DECIMAL(3,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_muscles_pkey" PRIMARY KEY ("exercise_id","muscle")
);

-- CreateTable
CREATE TABLE "athlete_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'Atleta',
    "experience_level" TEXT NOT NULL DEFAULT 'Intermediário',
    "injuries" TEXT[],
    "training_days" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phase_id" UUID,
    "name" TEXT,
    "week_number" INTEGER NOT NULL,
    "meso_week" INTEGER NOT NULL,
    "session_number" INTEGER NOT NULL,
    "day_of_week" INTEGER,
    "planned_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "actual_session_id" INTEGER,
    "ai_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planned_session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "sets_count" INTEGER NOT NULL,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "suggested_load_kg" DECIMAL(6,2),
    "target_rpe" DECIMAL(3,1),
    "target_rir" INTEGER,
    "technique" TEXT,
    "ai_feedback" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "set_type" TEXT NOT NULL DEFAULT 'Working Set',
    "set_technique" TEXT NOT NULL DEFAULT 'Normal',
    "load_kg" DECIMAL(6,2),
    "reps" INTEGER NOT NULL,
    "rpe" DECIMAL(3,1),
    "rir" INTEGER,
    "notes" TEXT,
    "tonnage" DECIMAL(8,2),
    "one_rm_epley" DECIMAL(7,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "height_cm" DECIMAL(5,1),
    "bf_pct" DECIMAL(4,1),
    "sleep_hours" DECIMAL(3,1),
    "waist_cm" DECIMAL(5,1),
    "chest_cm" DECIMAL(5,1),
    "arms_cm" DECIMAL(5,1),
    "forearms_cm" DECIMAL(5,1),
    "thighs_cm" DECIMAL(5,1),
    "calves_cm" DECIMAL(5,1),
    "pain_notes" TEXT,
    "energy_level" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "type" TEXT,
    "body_region" TEXT,
    "status_summary" TEXT,
    "recommendation" TEXT,
    "alert_flag" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_coaching_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "source" TEXT DEFAULT 'Jayme de Lamadrid — Musculação para Naturais',
    "priority" INTEGER DEFAULT 5,
    "tags" TEXT[],
    "is_active" BOOLEAN DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_coaching_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sets_session_id_exercise_id_set_number_key" ON "workout_sets"("session_id", "exercise_id", "set_number");

-- CreateIndex
CREATE UNIQUE INDEX "body_metrics_date_key" ON "body_metrics"("date");

-- AddForeignKey
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "training_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_planned_session_id_fkey" FOREIGN KEY ("planned_session_id") REFERENCES "planned_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
