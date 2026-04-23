// Types aligned with Prisma schema — Jayme de Lamadrid periodization methodology

// ─── ENUMS ──────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'forearms'

// Controls whether a set counts for weekly volume (only Working/Top/Back Off with RPE ≥ 7 count)
export type SetCategory =
  | 'Working Set'
  | 'Top Set'
  | 'Back Off Set'
  | 'Warming Set'
  | 'Feeder Set'

// Intensity technique applied to the set
export type SetTechnique =
  | 'Normal'
  | 'Drop Set'
  | 'Super Set'
  | 'Falsa Pirâmide'
  | 'Rest-Pause'
  | 'Cluster'

// Phases within the annual macrocycle (Jayme de Lamadrid block periodization)
export type PhaseType =
  | 'Acumulação'          // Etapa 1 — linear inverse, RIR 2, 40% tensão / 60% metabólico
  | 'Transição'           // Etapa 1 — 60% tensão / 40% metabólico, density progression
  | 'Intensificação'      // Etapa 1 — RIR 1, 70% tensão, heavy compounds
  | 'Teste'               // Etapa 1 — 1RM / AMRAP week
  | 'Hipertrofia_Resistência' // Etapa 2 — mesos 1-4, RIR 0-1, 40/60
  | 'Hipertrofia_Pico'    // Etapa 2 — mesos 1-2, 30% tensão / 70% metabólico, MRV

// Technique focus injected per meso in Etapa 2
export type TechniqueFocus = 'Drop Set' | 'Super Set' | 'Falsa Pirâmide' | null

// Result of comparing tonnage between sessions
export type ProgressionStatus = 'Progressão' | 'Regressão' | 'Estagnado' | 'Primeira Sessão'

// Phase transition trigger reasons
export type PhaseTransitionTrigger =
  | 'MRV_REACHED'        // Volume ≥ 20 sets/muscle/week + performance stagnating
  | 'NEURAL_PLATEAU'     // 2 consecutive weeks stagnated with good recovery
  | 'TEMPORAL'           // Max weeks for this phase reached
  | 'PEAK_FATIGUE'       // RPE 10 consistently at MRV → +1 freq day

// ─── ENTITIES ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string
  name: string
  nameEn: string | null
  videoUrl: string | null
  movementPattern: string | null
  classification: 'Compound' | 'Isolation' | null
  neuralDemand: number | null
  createdAt: Date
  muscles?: ExerciseMuscle[]
}

export interface ExerciseMuscle {
  id: string
  exerciseId: string
  muscleGroup: MuscleGroup
  muscle: string
  /** 1.0 = primary muscle (100% of sets counted for volume); 0.5 = secondary (50%) */
  seriesFactor: number
  createdAt: Date
}

export interface TrainingPhase {
  id: string
  name: string
  etapa: 1 | 2
  phaseType: PhaseType | null
  mesoNumber: number | null        // 1–4 within Hipertrofia_Resistência; 1–2 within Hipertrofia_Pico
  techniqueFocus: TechniqueFocus
  phaseOrder: number | null
  durationWeeks: number | null
  targetRirMin: number | null
  targetRirMax: number | null
  volumePctTension: number | null   // e.g. 0.4 (40%) compound exercises
  volumePctMetabolic: number | null // e.g. 0.6 (60%) isolation exercises
  progressionRule: string | null
  isCurrent: boolean
  createdAt: Date
  sessions?: PlannedSession[]
}

export interface PlannedSession {
  id: string
  phaseId: string | null
  name: string | null
  weekNumber: number | null
  mesoWeek: number | null
  sessionNumber: number | null
  dayOfWeek: number | null
  plannedDate: string | null       // ISO date string
  status: 'Pendente' | 'Concluido' | 'Em Progresso'
  actualSessionId: string | null
  aiNotes: string | null
  createdAt: Date
  exercises?: PlannedExercise[]
  phase?: TrainingPhase
}

export interface PlannedExercise {
  id: string
  plannedSessionId: string
  exerciseId: string
  setsCount: number
  repsMin: number | null
  repsMax: number | null
  suggestedLoadKg: number | null
  targetRpe: number | null
  targetRir: number | null
  technique: string | null
  aiFeedback: string | null
  sortOrder: number
  createdAt: Date
  exercise?: Exercise
}

export interface WorkoutSession {
  id: string
  date: string                     // ISO date string
  notes: string | null
  createdAt: Date
  sets?: WorkoutSet[]
  // UI computed fields
  name?: string
  status?: 'pending' | 'in-progress' | 'paused' | 'completed'
  exercises?: WorkoutExercise[]
  plannedSessionId?: string
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  exercise: Exercise
  sets: WorkoutSet[]
}

export interface WorkoutSet {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  setCategory: SetCategory
  setTechnique: SetTechnique
  loadKg: number
  reps: number
  rpe: number | null
  rir: number | null               // auto: 10 - rpe
  notes: string | null
  tonnage: number | null           // loadKg × reps
  oneRmEpley: number | null        // loadKg × (1 + reps / 30)
  createdAt: Date
  // UI-only
  completed?: boolean
  savedAt?: string
}

// ─── ANALYTICS ──────────────────────────────────────────────────────────────

export interface ProgressionData {
  date: string
  weight: number
  reps: number
  volume: number
  oneRm: number
  exerciseId: string
  exerciseName: string
}

export interface ExerciseProgressionSummary {
  exerciseId: string
  exerciseName: string
  lastTonnage: number
  prevTonnage: number
  status: ProgressionStatus
  rollingAvg4s: number            // 4-session rolling tonnage average
  lastRpe: number | null
  weeklyVolumeSets: number        // working sets in last 7 days
  bestOneRm: number
  lastOneRm: number
}

export interface PRRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  oneRm: number
  date: string
}

export interface WeeklyStats {
  totalSets: number
  completedWorkouts: number
  plannedWorkouts: number
  volumeByMuscle: Record<MuscleGroup, number>  // weighted sets (series_factor applied)
}

export interface RestTimeRange {
  minSeconds: number
  maxSeconds: number
}

export type CalendarView = 'month' | 'week' | 'day'
