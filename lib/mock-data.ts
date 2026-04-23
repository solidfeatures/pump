/**
 * Mock data reflecting the full Jayme de Lamadrid macrocycle.
 *
 * Macrocycle structure:
 * ETAPA 1 — Força e Potência (preparação)
 *   • Acumulação 1 & 2 (2×4 weeks): linear inverse, RIR 2, 40% tensão / 60% metabólico
 *   • Transição (4 weeks): 60% tensão / 40% metabólico, density progression
 *   • Intensificação 1 & 2 (2×4 weeks): RIR 1, 70% tensão, heavy compounds
 *   • Teste (1 week): 1RM / AMRAP
 *
 * ETAPA 2 — Hipertrofia e Resistência
 *   • HR Meso 1 (4 weeks): 80% 1RM, 8×2→6×3→5×4→4×5 scheme
 *   • HR Meso 2 (4 weeks): increase reps on working sets each week
 *   • HR Meso 3 (4 weeks): Drop Sets
 *   • HR Meso 4 (4 weeks): daily undulating + Super Sets
 *   • Pico Meso 1 (4 weeks): Falsa Pirâmide, high volume, brutal RPE
 *   • Pico Meso 2 (4 weeks): MRV, RPE 10, +1 day frequency
 */

import {
  Exercise,
  ExerciseMuscle,
  TrainingPhase,
  PlannedSession,
  PlannedExercise,
  MuscleGroup,
  ProgressionData,
  PRRecord,
} from './types'

// ─── EXERCISES ───────────────────────────────────────────────────────────────

export const exercises: Exercise[] = [
  { id: '1',  name: 'Supino Reto (Barra)',         nameEn: 'Barbell Bench Press',    videoUrl: null, movementPattern: 'Horizontal Push',       classification: 'Compound',  neuralDemand: 8,  createdAt: new Date() },
  { id: '2',  name: 'Supino Inclinado (Halteres)', nameEn: 'Incline Dumbbell Press', videoUrl: null, movementPattern: 'Incline Push',           classification: 'Compound',  neuralDemand: 7,  createdAt: new Date() },
  { id: '3',  name: 'Crossover (Cabo)',             nameEn: 'Cable Crossover',        videoUrl: null, movementPattern: 'Horizontal Adduction',   classification: 'Isolation', neuralDemand: 4,  createdAt: new Date() },
  { id: '4',  name: 'Remada Curvada (Barra)',       nameEn: 'Barbell Row',            videoUrl: null, movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 8,  createdAt: new Date() },
  { id: '5',  name: 'Pulldown (Polia)',             nameEn: 'Lat Pulldown',           videoUrl: null, movementPattern: 'Vertical Pull',          classification: 'Compound',  neuralDemand: 6,  createdAt: new Date() },
  { id: '6',  name: 'Remada Sentada (Cabo)',        nameEn: 'Seated Cable Row',       videoUrl: null, movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 6,  createdAt: new Date() },
  { id: '7',  name: 'Desenvolvimento (Barra)',      nameEn: 'Overhead Press',         videoUrl: null, movementPattern: 'Vertical Push',          classification: 'Compound',  neuralDemand: 8,  createdAt: new Date() },
  { id: '8',  name: 'Elevação Lateral',             nameEn: 'Lateral Raise',          videoUrl: null, movementPattern: 'Shoulder Abduction',     classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '9',  name: 'Face Pull (Cabo)',             nameEn: 'Face Pull',              videoUrl: null, movementPattern: 'External Rotation',      classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '10', name: 'Rosca Direta (Barra)',         nameEn: 'Barbell Curl',           videoUrl: null, movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 4,  createdAt: new Date() },
  { id: '11', name: 'Rosca Martelo',                nameEn: 'Hammer Curl',            videoUrl: null, movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '12', name: 'Tríceps Corda (Polia)',        nameEn: 'Rope Tricep Pushdown',   videoUrl: null, movementPattern: 'Elbow Extension',        classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '13', name: 'Tríceps Francês',              nameEn: 'French Press',           videoUrl: null, movementPattern: 'Elbow Extension',        classification: 'Isolation', neuralDemand: 5,  createdAt: new Date() },
  { id: '14', name: 'Agachamento Livre',            nameEn: 'Barbell Squat',          videoUrl: null, movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 10, createdAt: new Date() },
  { id: '15', name: 'Levantamento Terra',           nameEn: 'Deadlift',               videoUrl: null, movementPattern: 'Hip Hinge',              classification: 'Compound',  neuralDemand: 10, createdAt: new Date() },
  { id: '16', name: 'Leg Press',                    nameEn: 'Leg Press',              videoUrl: null, movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 6,  createdAt: new Date() },
  { id: '17', name: 'Cadeira Extensora',            nameEn: 'Leg Extension',          videoUrl: null, movementPattern: 'Knee Extension',         classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '18', name: 'Cadeira Flexora',              nameEn: 'Leg Curl',               videoUrl: null, movementPattern: 'Knee Flexion',           classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '19', name: 'Agachamento Búlgaro',          nameEn: 'Bulgarian Split Squat',  videoUrl: null, movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 7,  createdAt: new Date() },
  { id: '20', name: 'Hip Thrust',                   nameEn: 'Hip Thrust',             videoUrl: null, movementPattern: 'Hip Extension',          classification: 'Compound',  neuralDemand: 6,  createdAt: new Date() },
  { id: '21', name: 'Panturrilha em Pé',            nameEn: 'Standing Calf Raise',    videoUrl: null, movementPattern: 'Ankle Plantar Flexion',  classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '22', name: 'Rosca Concentrada',            nameEn: 'Concentration Curl',     videoUrl: null, movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 4,  createdAt: new Date() },
  { id: '23', name: 'Paralela',                     nameEn: 'Dips',                   videoUrl: null, movementPattern: 'Vertical Push',          classification: 'Compound',  neuralDemand: 7,  createdAt: new Date() },
  { id: '24', name: 'Barra Fixa',                   nameEn: 'Pull-up',                videoUrl: null, movementPattern: 'Vertical Pull',          classification: 'Compound',  neuralDemand: 7,  createdAt: new Date() },
  { id: '25', name: 'Peck Deck',                    nameEn: 'Pec Deck',               videoUrl: null, movementPattern: 'Horizontal Adduction',   classification: 'Isolation', neuralDemand: 3,  createdAt: new Date() },
  { id: '26', name: 'Remada Unilateral (Halter)',   nameEn: 'Dumbbell Row',           videoUrl: null, movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 6,  createdAt: new Date() },
]

// ─── MUSCLE MAPPINGS ─────────────────────────────────────────────────────────
// series_factor: 1.0 = primary (100% volume), 0.5 = secondary (50% volume)
// Push exercises: secondary shoulder volume → anterior deltoid
// Pull exercises: secondary shoulder volume → posterior deltoid

export const exerciseMuscles: ExerciseMuscle[] = [
  // Supino Reto — compound push
  { id: 'em-1',  exerciseId: '1',  muscleGroup: 'chest',     muscle: 'Peitoral Maior',           seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-2',  exerciseId: '1',  muscleGroup: 'triceps',   muscle: 'Tríceps',                  seriesFactor: 0.5, createdAt: new Date() },
  { id: 'em-3',  exerciseId: '1',  muscleGroup: 'shoulders', muscle: 'Deltóide Anterior',        seriesFactor: 0.5, createdAt: new Date() },
  // Supino Inclinado — compound push
  { id: 'em-4',  exerciseId: '2',  muscleGroup: 'chest',     muscle: 'Peitoral Superior',        seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-5',  exerciseId: '2',  muscleGroup: 'triceps',   muscle: 'Tríceps',                  seriesFactor: 0.5, createdAt: new Date() },
  { id: 'em-6',  exerciseId: '2',  muscleGroup: 'shoulders', muscle: 'Deltóide Anterior',        seriesFactor: 0.5, createdAt: new Date() },
  // Crossover — isolation
  { id: 'em-7',  exerciseId: '3',  muscleGroup: 'chest',     muscle: 'Peitoral Maior',           seriesFactor: 1.0, createdAt: new Date() },
  // Remada Curvada — compound pull
  { id: 'em-8',  exerciseId: '4',  muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',       seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-9',  exerciseId: '4',  muscleGroup: 'biceps',    muscle: 'Bíceps',                   seriesFactor: 0.5, createdAt: new Date() },
  { id: 'em-10', exerciseId: '4',  muscleGroup: 'shoulders', muscle: 'Deltóide Posterior',       seriesFactor: 0.5, createdAt: new Date() },
  // Pulldown — compound pull
  { id: 'em-11', exerciseId: '5',  muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',       seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-12', exerciseId: '5',  muscleGroup: 'biceps',    muscle: 'Bíceps',                   seriesFactor: 0.5, createdAt: new Date() },
  // Remada Sentada — compound pull
  { id: 'em-13', exerciseId: '6',  muscleGroup: 'back',      muscle: 'Rombóides / Trapézio Médio', seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-14', exerciseId: '6',  muscleGroup: 'biceps',    muscle: 'Bíceps',                   seriesFactor: 0.5, createdAt: new Date() },
  // Desenvolvimento (Barra) — compound push
  { id: 'em-15', exerciseId: '7',  muscleGroup: 'shoulders', muscle: 'Deltóide Anterior/Médio',  seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-16', exerciseId: '7',  muscleGroup: 'triceps',   muscle: 'Tríceps',                  seriesFactor: 0.5, createdAt: new Date() },
  // Elevação Lateral — isolation
  { id: 'em-17', exerciseId: '8',  muscleGroup: 'shoulders', muscle: 'Deltóide Médio',           seriesFactor: 1.0, createdAt: new Date() },
  // Face Pull — isolation
  { id: 'em-18', exerciseId: '9',  muscleGroup: 'shoulders', muscle: 'Deltóide Posterior',       seriesFactor: 1.0, createdAt: new Date() },
  // Rosca Direta — isolation
  { id: 'em-19', exerciseId: '10', muscleGroup: 'biceps',    muscle: 'Bíceps Braquial',          seriesFactor: 1.0, createdAt: new Date() },
  // Rosca Martelo — isolation
  { id: 'em-20', exerciseId: '11', muscleGroup: 'biceps',    muscle: 'Braquial',                 seriesFactor: 1.0, createdAt: new Date() },
  // Tríceps Corda — isolation
  { id: 'em-21', exerciseId: '12', muscleGroup: 'triceps',   muscle: 'Tríceps (porção lateral)', seriesFactor: 1.0, createdAt: new Date() },
  // Tríceps Francês — isolation
  { id: 'em-22', exerciseId: '13', muscleGroup: 'triceps',   muscle: 'Tríceps (porção longa)',   seriesFactor: 1.0, createdAt: new Date() },
  // Agachamento Livre — compound
  { id: 'em-23', exerciseId: '14', muscleGroup: 'quadriceps', muscle: 'Quadríceps',              seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-24', exerciseId: '14', muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5, createdAt: new Date() },
  { id: 'em-25', exerciseId: '14', muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 0.5, createdAt: new Date() },
  // Levantamento Terra — compound
  { id: 'em-26', exerciseId: '15', muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-27', exerciseId: '15', muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-28', exerciseId: '15', muscleGroup: 'back',      muscle: 'Eretores da Espinha',      seriesFactor: 0.5, createdAt: new Date() },
  // Leg Press — compound
  { id: 'em-29', exerciseId: '16', muscleGroup: 'quadriceps', muscle: 'Quadríceps',              seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-30', exerciseId: '16', muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5, createdAt: new Date() },
  // Cadeira Extensora — isolation
  { id: 'em-31', exerciseId: '17', muscleGroup: 'quadriceps', muscle: 'Quadríceps',              seriesFactor: 1.0, createdAt: new Date() },
  // Cadeira Flexora — isolation
  { id: 'em-32', exerciseId: '18', muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 1.0, createdAt: new Date() },
  // Agachamento Búlgaro — compound
  { id: 'em-33', exerciseId: '19', muscleGroup: 'quadriceps', muscle: 'Quadríceps',              seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-34', exerciseId: '19', muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5, createdAt: new Date() },
  // Hip Thrust — compound
  { id: 'em-35', exerciseId: '20', muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-36', exerciseId: '20', muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 0.5, createdAt: new Date() },
  // Panturrilha em Pé — isolation
  { id: 'em-37', exerciseId: '21', muscleGroup: 'calves',    muscle: 'Gastrocnêmio',             seriesFactor: 1.0, createdAt: new Date() },
  // Rosca Concentrada — isolation
  { id: 'em-38', exerciseId: '22', muscleGroup: 'biceps',    muscle: 'Bíceps (pico)',            seriesFactor: 1.0, createdAt: new Date() },
  // Paralela — compound push
  { id: 'em-39', exerciseId: '23', muscleGroup: 'chest',     muscle: 'Peitoral Inferior',        seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-40', exerciseId: '23', muscleGroup: 'triceps',   muscle: 'Tríceps',                  seriesFactor: 0.5, createdAt: new Date() },
  // Barra Fixa — compound pull
  { id: 'em-41', exerciseId: '24', muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',       seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-42', exerciseId: '24', muscleGroup: 'biceps',    muscle: 'Bíceps',                   seriesFactor: 0.5, createdAt: new Date() },
  // Peck Deck — isolation
  { id: 'em-43', exerciseId: '25', muscleGroup: 'chest',     muscle: 'Peitoral (contração)',     seriesFactor: 1.0, createdAt: new Date() },
  // Remada Unilateral — compound pull
  { id: 'em-44', exerciseId: '26', muscleGroup: 'back',      muscle: 'Latíssimo / Rombóides',    seriesFactor: 1.0, createdAt: new Date() },
  { id: 'em-45', exerciseId: '26', muscleGroup: 'biceps',    muscle: 'Bíceps',                   seriesFactor: 0.5, createdAt: new Date() },
]

// ─── FULL MACROCYCLE — TRAINING PHASES ───────────────────────────────────────

export const trainingPhases: TrainingPhase[] = [
  // ── ETAPA 1: Força e Potência ─────────────────────────────────────────────
  {
    id: 'phase-acc1',
    name: 'Acumulação 1',
    etapa: 1,
    phaseType: 'Acumulação',
    mesoNumber: 1,
    techniqueFocus: null,
    phaseOrder: 1,
    durationWeeks: 4,
    targetRirMin: 2,
    targetRirMax: 3,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Progressão dupla: aumente repetições primeiro. Ao atingir o teto de reps, aumente 2,5 kg.',
    isCurrent: true,
    createdAt: new Date(),
  },
  {
    id: 'phase-acc2',
    name: 'Acumulação 2',
    etapa: 1,
    phaseType: 'Acumulação',
    mesoNumber: 2,
    techniqueFocus: null,
    phaseOrder: 2,
    durationWeeks: 4,
    targetRirMin: 2,
    targetRirMax: 3,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Aumentar volume em 2 séries semanais por músculo. Manter RIR 2.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-tran',
    name: 'Transição',
    etapa: 1,
    phaseType: 'Transição',
    mesoNumber: null,
    techniqueFocus: null,
    phaseOrder: 3,
    durationWeeks: 4,
    targetRirMin: 2,
    targetRirMax: 2,
    volumePctTension: 0.60,
    volumePctMetabolic: 0.40,
    progressionRule: 'Manter volume total. Progredir via densidade: reduzir descanso progressivamente.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-int1',
    name: 'Intensificação 1',
    etapa: 1,
    phaseType: 'Intensificação',
    mesoNumber: 1,
    techniqueFocus: null,
    phaseOrder: 4,
    durationWeeks: 4,
    targetRirMin: 1,
    targetRirMax: 1,
    volumePctTension: 0.70,
    volumePctMetabolic: 0.30,
    progressionRule: 'Reduzir volume. Foco em progressão de carga nos compostos. RIR 1.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-int2',
    name: 'Intensificação 2',
    etapa: 1,
    phaseType: 'Intensificação',
    mesoNumber: 2,
    techniqueFocus: null,
    phaseOrder: 5,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 1,
    volumePctTension: 0.70,
    volumePctMetabolic: 0.30,
    progressionRule: 'Volume mínimo. Maximizar carga nos exercícios principais. Chegar ao limite.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-test',
    name: 'Semana de Teste',
    etapa: 1,
    phaseType: 'Teste',
    mesoNumber: null,
    techniqueFocus: null,
    phaseOrder: 6,
    durationWeeks: 1,
    targetRirMin: 0,
    targetRirMax: 0,
    volumePctTension: 1.0,
    volumePctMetabolic: 0,
    progressionRule: 'Testar 1RM ou AMRAP nos exercícios principais. Registrar novos recordes.',
    isCurrent: false,
    createdAt: new Date(),
  },
  // ── ETAPA 2: Hipertrofia e Resistência ────────────────────────────────────
  {
    id: 'phase-hr1',
    name: 'Hipertrofia e Resistência — Meso 1',
    etapa: 2,
    phaseType: 'Hipertrofia_Resistência',
    mesoNumber: 1,
    techniqueFocus: null,
    phaseOrder: 7,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 1,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Usar 80% do 1RM. Esquema semanal: Semana 1 → 8×2 | Semana 2 → 6×3 | Semana 3 → 5×4 | Semana 4 → 4×5.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-hr2',
    name: 'Hipertrofia e Resistência — Meso 2',
    etapa: 2,
    phaseType: 'Hipertrofia_Resistência',
    mesoNumber: 2,
    techniqueFocus: null,
    phaseOrder: 8,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 1,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Progressão estritamente em repetições nas Working Sets: +1 rep por semana na mesma carga.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-hr3',
    name: 'Hipertrofia e Resistência — Meso 3',
    etapa: 2,
    phaseType: 'Hipertrofia_Resistência',
    mesoNumber: 3,
    techniqueFocus: 'Drop Set',
    phaseOrder: 9,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 0,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Introduzir Drop Sets nas Working Sets principais. Objetivo: aumentar volume total por semana.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-hr4',
    name: 'Hipertrofia e Resistência — Meso 4',
    etapa: 2,
    phaseType: 'Hipertrofia_Resistência',
    mesoNumber: 4,
    techniqueFocus: 'Super Set',
    phaseOrder: 10,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 0,
    volumePctTension: 0.40,
    volumePctMetabolic: 0.60,
    progressionRule: 'Periodização ondulante diária (alternar foco de intensidade na mesma sessão) + Super Sets.',
    isCurrent: false,
    createdAt: new Date(),
  },
  // ── ETAPA 2: Hipertrofia Pico ─────────────────────────────────────────────
  {
    id: 'phase-hp1',
    name: 'Hipertrofia Pico — Meso 1',
    etapa: 2,
    phaseType: 'Hipertrofia_Pico',
    mesoNumber: 1,
    techniqueFocus: 'Falsa Pirâmide',
    phaseOrder: 11,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 0,
    volumePctTension: 0.30,
    volumePctMetabolic: 0.70,
    progressionRule: 'Usar Falsa Pirâmide. Altos volumes, intensidade brutal. 30% tensão / 70% metabólico.',
    isCurrent: false,
    createdAt: new Date(),
  },
  {
    id: 'phase-hp2',
    name: 'Hipertrofia Pico — Meso 2 (MRV)',
    etapa: 2,
    phaseType: 'Hipertrofia_Pico',
    mesoNumber: 2,
    techniqueFocus: 'Falsa Pirâmide',
    phaseOrder: 12,
    durationWeeks: 4,
    targetRirMin: 0,
    targetRirMax: 0,
    volumePctTension: 0.30,
    volumePctMetabolic: 0.70,
    progressionRule: 'Ápice do MRV. RPE 10. Adicionar +1 dia de frequência (Full Body) para suportar volume máximo.',
    isCurrent: false,
    createdAt: new Date(),
  },
]

export const currentPhase = trainingPhases.find((p) => p.isCurrent)!

// ─── PLANNED SESSIONS (Acumulação 1 — 4 dias/semana) ─────────────────────────
// Schedule: Monday / Wednesday / Friday / Saturday
// Acumulação 1: 40% tensão (compostos) / 60% metabólico (isoladores)
// RIR 2–3 throughout, targeting 10–20 working sets/week/muscle

export const plannedSessions: PlannedSession[] = [
  {
    id: 'session-upper-a',
    phaseId: 'phase-acc1',
    name: 'Superior A',
    dayOfWeek: 1,
    weekNumber: 1,
    mesoWeek: 1,
    sessionNumber: 1,
    plannedDate: null,
    status: 'Pendente',
    actualSessionId: null,
    aiNotes: 'Superior A — Peito/Tríceps primário. Iniciar com compostos antes dos isoladores.',
    createdAt: new Date(),
  },
  {
    id: 'session-lower-a',
    phaseId: 'phase-acc1',
    name: 'Inferior A',
    dayOfWeek: 3,
    weekNumber: 1,
    mesoWeek: 1,
    sessionNumber: 2,
    plannedDate: null,
    status: 'Pendente',
    actualSessionId: null,
    aiNotes: 'Inferior A — Quadríceps/Glúteo primário. Aquecimento de quadril obrigatório.',
    createdAt: new Date(),
  },
  {
    id: 'session-upper-b',
    phaseId: 'phase-acc1',
    name: 'Superior B',
    dayOfWeek: 5,
    weekNumber: 1,
    mesoWeek: 1,
    sessionNumber: 3,
    plannedDate: null,
    status: 'Pendente',
    actualSessionId: null,
    aiNotes: 'Superior B — Costas/Bíceps primário. Focar na retração escapular nas remadas.',
    createdAt: new Date(),
  },
  {
    id: 'session-lower-b',
    phaseId: 'phase-acc1',
    name: 'Inferior B',
    dayOfWeek: 6,
    weekNumber: 1,
    mesoWeek: 1,
    sessionNumber: 4,
    plannedDate: null,
    status: 'Pendente',
    actualSessionId: null,
    aiNotes: 'Inferior B — Posterior de coxa/Glúteo primário.',
    createdAt: new Date(),
  },
]

export const sessionNames: Record<string, string> = {
  'session-upper-a': 'Superior A',
  'session-lower-a': 'Inferior A',
  'session-upper-b': 'Superior B',
  'session-lower-b': 'Inferior B',
}

// Monday=1, Wednesday=3, Friday=5, Saturday=6
export const sessionDayMapping: Record<string, number> = {
  'session-upper-a': 1,
  'session-lower-a': 3,
  'session-upper-b': 5,
  'session-lower-b': 6,
}

// ─── PLANNED EXERCISES ────────────────────────────────────────────────────────
// Acumulação 1 targets: RIR 2–3, RPE 7–8
// Upper sessions: 2 compostos (tensão) + 3–4 isoladores (metabólico) = ~40/60 split
// Lower sessions: 2 compostos (tensão) + 3 isoladores (metabólico)

export const plannedExercises: PlannedExercise[] = [
  // ── Superior A (Segunda) — Peito / Ombros / Tríceps ──────────────────────
  // Compound (tensão)
  { id: 'pe-1',  plannedSessionId: 'session-upper-a', exerciseId: '1',  setsCount: 4, repsMin: 6,  repsMax: 8,  suggestedLoadKg: 80,  targetRpe: 8, targetRir: 2, technique: 'Excêntrica controlada 2s', aiFeedback: 'Fase de Acumulação 1: priorize a conexão mente-músculo no peito. Se atingir 8 reps com RIR 2 por 2 sessões consecutivas, aumente 2,5 kg na próxima.', sortOrder: 1, createdAt: new Date() },
  { id: 'pe-2',  plannedSessionId: 'session-upper-a', exerciseId: '7',  setsCount: 4, repsMin: 6,  repsMax: 8,  suggestedLoadKg: 50,  targetRpe: 8, targetRir: 2, technique: 'Escápulas retraídas e deprimidas durante todo o movimento', aiFeedback: 'Desenvolvimento é o motor de ombros desta fase. Mantenha a carga estável até dominar a técnica — progrida em reps antes de adicionar peso.', sortOrder: 2, createdAt: new Date() },
  // Isolation (metabólico)
  { id: 'pe-3',  plannedSessionId: 'session-upper-a', exerciseId: '25', setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 50,  targetRpe: 7, targetRir: 3, technique: 'Pausa na contração máxima', aiFeedback: null, sortOrder: 3, createdAt: new Date() },
  { id: 'pe-4',  plannedSessionId: 'session-upper-a', exerciseId: '8',  setsCount: 3, repsMin: 15, repsMax: 20, suggestedLoadKg: 10,  targetRpe: 7, targetRir: 3, technique: 'Cotovelo levemente flexionado, não balançar o tronco', aiFeedback: null, sortOrder: 4, createdAt: new Date() },
  { id: 'pe-5',  plannedSessionId: 'session-upper-a', exerciseId: '12', setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 25,  targetRpe: 7, targetRir: 3, technique: null, aiFeedback: null, sortOrder: 5, createdAt: new Date() },

  // ── Inferior A (Quarta) — Quadríceps / Glúteo / Panturrilha ──────────────
  // Compound (tensão)
  { id: 'pe-6',  plannedSessionId: 'session-lower-a', exerciseId: '14', setsCount: 4, repsMin: 5,  repsMax: 6,  suggestedLoadKg: 100, targetRpe: 8, targetRir: 2, technique: 'Profundidade total, joelhos alinhados com os pés', aiFeedback: 'Agachamento é o maior gerador neural desta fase. RIR 2 é obrigatório — não chegue à falha. Aquecimento de no mínimo 3 séries progressivas antes das Working Sets.', sortOrder: 1, createdAt: new Date() },
  { id: 'pe-7',  plannedSessionId: 'session-lower-a', exerciseId: '16', setsCount: 3, repsMin: 8,  repsMax: 10, suggestedLoadKg: 180, targetRpe: 8, targetRir: 2, technique: 'Pés afastados na largura dos ombros, descer até 90°', aiFeedback: 'Leg Press é o volume metabólico do quadríceps. Progrida em reps primeiro — quando atingir 10 com boa forma, adicione 10 kg.', sortOrder: 2, createdAt: new Date() },
  // Isolation (metabólico)
  { id: 'pe-8',  plannedSessionId: 'session-lower-a', exerciseId: '17', setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 40,  targetRpe: 7, targetRir: 3, technique: 'Pausa 1s na extensão completa', aiFeedback: null, sortOrder: 3, createdAt: new Date() },
  { id: 'pe-9',  plannedSessionId: 'session-lower-a', exerciseId: '20', setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 100, targetRpe: 7, targetRir: 3, technique: 'Extensão de quadril completa, apertar glúteo no topo', aiFeedback: null, sortOrder: 4, createdAt: new Date() },
  { id: 'pe-10', plannedSessionId: 'session-lower-a', exerciseId: '21', setsCount: 4, repsMin: 15, repsMax: 20, suggestedLoadKg: 80,  targetRpe: 7, targetRir: 3, technique: null, aiFeedback: null, sortOrder: 5, createdAt: new Date() },

  // ── Superior B (Sexta) — Costas / Bíceps / Ombro Posterior ───────────────
  // Compound (tensão)
  { id: 'pe-11', plannedSessionId: 'session-upper-b', exerciseId: '4',  setsCount: 4, repsMin: 6,  repsMax: 8,  suggestedLoadKg: 80,  targetRpe: 8, targetRir: 2, technique: 'Retração escapular antes de puxar, ROM completo', aiFeedback: 'Remada Curvada é o composto principal de costas nesta fase. Foco: iniciar o movimento com a escápula, não com os braços. Se a técnica degradar, reduza a carga 5 kg.', sortOrder: 1, createdAt: new Date() },
  { id: 'pe-12', plannedSessionId: 'session-upper-b', exerciseId: '24', setsCount: 3, repsMin: 6,  repsMax: 10, suggestedLoadKg: null, targetRpe: 8, targetRir: 2, technique: 'Adicionar carga assim que atingir 10 reps com RIR 2', aiFeedback: 'Barra Fixa: use apenas peso corporal agora. Quando dominar 10 reps perfeitas, adicione carga com cinto. É um marco para progressão desta fase.', sortOrder: 2, createdAt: new Date() },
  // Isolation (metabólico)
  { id: 'pe-13', plannedSessionId: 'session-upper-b', exerciseId: '5',  setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 55,  targetRpe: 7, targetRir: 3, technique: null, aiFeedback: null, sortOrder: 3, createdAt: new Date() },
  { id: 'pe-14', plannedSessionId: 'session-upper-b', exerciseId: '9',  setsCount: 3, repsMin: 15, repsMax: 20, suggestedLoadKg: 20,  targetRpe: 7, targetRir: 3, technique: 'Puxar até a altura dos olhos, abrindo os cotovelos para os lados', aiFeedback: null, sortOrder: 4, createdAt: new Date() },
  { id: 'pe-15', plannedSessionId: 'session-upper-b', exerciseId: '10', setsCount: 3, repsMin: 10, repsMax: 12, suggestedLoadKg: 30,  targetRpe: 8, targetRir: 2, technique: null, aiFeedback: null, sortOrder: 5, createdAt: new Date() },

  // ── Inferior B (Sábado) — Posterior de coxa / Glúteo ─────────────────────
  // Compound (tensão)
  { id: 'pe-16', plannedSessionId: 'session-lower-b', exerciseId: '19', setsCount: 4, repsMin: 8,  repsMax: 10, suggestedLoadKg: 20,  targetRpe: 8, targetRir: 2, technique: 'Tronco ereto, joelho da frente não ultrapassa o pé', aiFeedback: 'Agachamento Búlgaro: é o exercício unilateral mais efetivo para equilibrar assimetrias. Se houver diferença de força entre os lados, foque no lado mais fraco primeiro.', sortOrder: 1, createdAt: new Date() },
  { id: 'pe-17', plannedSessionId: 'session-lower-b', exerciseId: '15', setsCount: 3, repsMin: 5,  repsMax: 6,  suggestedLoadKg: 100, targetRpe: 8, targetRir: 2, technique: 'Variante Romeno: joelhos semiflexionados, descida ao longo das pernas', aiFeedback: 'Terra Romeno é o principal construtor de posterior de coxa. Sinta o alongamento dos isquiotibiais — se não sentir, ajuste a postura antes de aumentar carga.', sortOrder: 2, createdAt: new Date() },
  // Isolation (metabólico)
  { id: 'pe-18', plannedSessionId: 'session-lower-b', exerciseId: '18', setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 35,  targetRpe: 7, targetRir: 3, technique: null, aiFeedback: null, sortOrder: 3, createdAt: new Date() },
  { id: 'pe-19', plannedSessionId: 'session-lower-b', exerciseId: '3',  setsCount: 3, repsMin: 12, repsMax: 15, suggestedLoadKg: 15,  targetRpe: 7, targetRir: 3, technique: 'Peito identificado como ponto fraco — volume adicional ao final da semana', aiFeedback: null, sortOrder: 4, createdAt: new Date() },
  { id: 'pe-20', plannedSessionId: 'session-lower-b', exerciseId: '21', setsCount: 3, repsMin: 15, repsMax: 20, suggestedLoadKg: 80,  targetRpe: 7, targetRir: 3, technique: null, aiFeedback: null, sortOrder: 5, createdAt: new Date() },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const getWeekDates = (baseDate: Date = new Date()): string[] => {
  const day = baseDate.getDay()
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(baseDate)
  monday.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export function getExercisePrimaryMuscle(exerciseId: string): MuscleGroup {
  const primary = exerciseMuscles.find(
    (em) => em.exerciseId === exerciseId && em.seriesFactor === 1.0
  )
  return (primary?.muscleGroup as MuscleGroup) ?? 'chest'
}

// Build exerciseId → ExerciseMuscle[] map for volume calculations
export function buildExerciseMuscleMap(): Record<string, ExerciseMuscle[]> {
  const map: Record<string, ExerciseMuscle[]> = {}
  for (const em of exerciseMuscles) {
    if (!map[em.exerciseId]) map[em.exerciseId] = []
    map[em.exerciseId].push(em)
  }
  return map
}

// ─── MOCK PROGRESSION DATA (used before DB is wired) ─────────────────────────

export function generateProgressionData(exerciseId: string, weeks = 8): ProgressionData[] {
  const exercise = exercises.find((e) => e.id === exerciseId)
  if (!exercise) return []

  const baseWeights: Record<string, number> = {
    '1': 80, '4': 75, '7': 50, '14': 100, '15': 120,
  }
  const baseWeight = baseWeights[exerciseId] ?? 40
  const data: ProgressionData[] = []

  for (let i = weeks; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i * 7)
    const weight = baseWeight + (weeks - i) * 2.5 + (Math.random() * 5 - 2.5)
    const reps = Math.floor(Math.random() * 4) + 5
    const rounded = Math.round(weight * 2) / 2
    data.push({
      date: date.toISOString().split('T')[0],
      weight: rounded,
      reps,
      volume: rounded * reps,
      oneRm: Math.round(rounded * (1 + reps / 30) * 10) / 10,
      exerciseId,
      exerciseName: exercise.name,
    })
  }
  return data
}

export function generatePRRecords(): PRRecord[] {
  return ['1', '4', '7', '14', '15'].map((id) => {
    const exercise = exercises.find((e) => e.id === id)!
    const data = generateProgressionData(id, 4)
    const best = data.reduce((max, cur) => (cur.oneRm > max.oneRm ? cur : max), data[0])
    return { exerciseId: id, exerciseName: exercise.name, weight: best.weight, reps: best.reps, oneRm: best.oneRm, date: best.date }
  })
}

// ─── UI LABELS ────────────────────────────────────────────────────────────────

export const muscleGroupColors: Record<MuscleGroup, string> = {
  chest: 'bg-emerald-500', back: 'bg-emerald-400', shoulders: 'bg-emerald-600',
  biceps: 'bg-teal-500', triceps: 'bg-teal-400',
  quadriceps: 'bg-cyan-500', hamstrings: 'bg-cyan-400', glutes: 'bg-cyan-600',
  calves: 'bg-sky-500', core: 'bg-sky-400', forearms: 'bg-sky-600',
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Peitoral', back: 'Costas', shoulders: 'Ombros',
  biceps: 'Bíceps', triceps: 'Tríceps',
  quadriceps: 'Quadríceps', hamstrings: 'Posteriores', glutes: 'Glúteo',
  calves: 'Panturrilha', core: 'Core', forearms: 'Antebraço',
}
