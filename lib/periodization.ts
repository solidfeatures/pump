/**
 * Business logic from Jayme de Lamadrid's "Musculação para Naturais" methodology.
 * All volume, progression, rest time, and phase transition rules live here.
 */

import type {
  WorkoutSet,
  ExerciseMuscle,
  MuscleGroup,
  RestTimeRange,
  ProgressionStatus,
  PhaseTransitionTrigger,
  SetCategory,
} from './types'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/** Maximum weekly working sets per muscle group before MRV danger zone */
export const MRV_THRESHOLD = 20

/** Minimum working set count before athlete is within safe volume range */
export const MEV_THRESHOLD = 10

/** Minimum RPE for a set to count as a Working Set */
export const MIN_WORKING_RPE = 7

/** Set categories that count towards weekly volume (when RPE ≥ MIN_WORKING_RPE) */
export const VOLUME_CATEGORIES: SetCategory[] = ['Working Set', 'Top Set', 'Back Off Set']

// ─── REST TIME ────────────────────────────────────────────────────────────────

/**
 * Returns the recommended rest range based on target reps.
 * Rule: rest is inversely proportional to reps (fewer reps = heavier load = more rest needed).
 *
 * Source: Jayme de Lamadrid rest time table.
 */
export function getRestTimeRange(targetReps: number): RestTimeRange {
  if (targetReps >= 10) return { minSeconds: 60, maxSeconds: 105 }   // 1:00 – 1:45
  if (targetReps >= 8)  return { minSeconds: 105, maxSeconds: 135 }  // 1:45 – 2:15
  if (targetReps >= 6)  return { minSeconds: 135, maxSeconds: 165 }  // 2:15 – 2:45
  if (targetReps === 5) return { minSeconds: 150, maxSeconds: 210 }  // 2:30 – 3:30 (escalates after set 3)
  return { minSeconds: 210, maxSeconds: 270 }                         // 3:30 – 4:30 (<5 reps)
}

/** Rest extension for strength sets (≤5 reps) after the 3rd set */
export function getStrengthRestExtension(setNumber: number): RestTimeRange {
  if (setNumber <= 3) return { minSeconds: 150, maxSeconds: 210 }
  return { minSeconds: 180, maxSeconds: 240 }
}

export function formatRestTime(range: RestTimeRange): string {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return `${fmt(range.minSeconds)} – ${fmt(range.maxSeconds)}`
}

// ─── VOLUME CALCULATION ───────────────────────────────────────────────────────

/**
 * Determines if a set counts for weekly volume.
 * Rules: must be a Working/Top/Back Off Set AND RPE ≥ 7 (or RPE not recorded).
 */
export function isWorkingSet(set: Pick<WorkoutSet, 'setCategory' | 'rpe'>): boolean {
  if (!VOLUME_CATEGORIES.includes(set.setCategory)) return false
  if (set.rpe !== null && set.rpe < MIN_WORKING_RPE) return false
  return true
}

/**
 * Calculates weekly volume per muscle group, applying series_factor weighting.
 *
 * Compound exercise: primary muscle gets 100% (seriesFactor=1.0), secondary gets 50% (seriesFactor=0.5).
 * Isolation exercise: primary muscle gets 100% (seriesFactor=1.0).
 *
 * Push movements: secondary shoulder volume → Deltóide Anterior
 * Pull movements: secondary shoulder volume → Deltóide Posterior
 */
export function calculateWeeklyVolumeByMuscle(
  sets: Pick<WorkoutSet, 'exerciseId' | 'setCategory' | 'rpe'>[],
  exerciseMuscleMap: Record<string, ExerciseMuscle[]>
): Record<MuscleGroup, number> {
  const volume = {} as Record<MuscleGroup, number>

  for (const set of sets) {
    if (!isWorkingSet(set)) continue
    const muscles = exerciseMuscleMap[set.exerciseId] ?? []
    for (const em of muscles) {
      volume[em.muscleGroup] = (volume[em.muscleGroup] ?? 0) + em.seriesFactor
    }
  }

  return volume
}

/** Returns true if any muscle group has reached or exceeded MRV */
export function isMrvReached(volumeByMuscle: Record<MuscleGroup, number>): boolean {
  return Object.values(volumeByMuscle).some((v) => v >= MRV_THRESHOLD)
}

// ─── PROGRESSION LOGIC ───────────────────────────────────────────────────────

/**
 * Progression priority (Jayme de Lamadrid):
 * 1. Reps  →  2. Weight  →  3. Volume
 *
 * Use double progression (reps + weight) until surpassing previous tonnage.
 * If stagnated 2 consecutive weeks → adjust volume.
 */
export function getProgressionStatus(
  currentTonnage: number,
  previousTonnage: number
): ProgressionStatus {
  if (previousTonnage === 0) return 'Primeira Sessão'
  if (currentTonnage > previousTonnage) return 'Progressão'
  if (currentTonnage < previousTonnage) return 'Regressão'
  return 'Estagnado'
}

/**
 * Determines the volume adjustment recommendation.
 *
 * if performance_down  → decrease_volume
 * elif performance_flat:
 *   if low_fatigue  → increase_volume (+2 sets/week)
 *   else            → decrease_volume (deload or reduce sets)
 */
export function getVolumeAdjustment(
  status: ProgressionStatus,
  isHighFatigue: boolean
): 'increase' | 'decrease' | 'maintain' {
  if (status === 'Regressão') return 'decrease'
  if (status === 'Estagnado') return isHighFatigue ? 'decrease' : 'increase'
  return 'maintain'
}

// ─── PHASE TRANSITIONS ────────────────────────────────────────────────────────

export interface PhaseTransitionEvaluation {
  shouldTransition: boolean
  trigger: PhaseTransitionTrigger | null
  message: string
}

/**
 * Evaluates whether the current training phase should transition.
 *
 * Four triggers (in priority order):
 * 1. MRV_REACHED — volume ≥ 20 sets + stagnation/regression
 * 2. NEURAL_PLATEAU — 2 consecutive flat/down weeks with good recovery & moderate volume
 * 3. TEMPORAL — max weeks for this phase reached
 * 4. PEAK_FATIGUE — RPE 10 at MRV → +1 frequency day
 */
export function evaluatePhaseTransition(params: {
  weeksInPhase: number
  maxWeeks: number
  weeklyVolume: Record<MuscleGroup, number>
  recentStatuses: ProgressionStatus[]  // last 2 sessions
  avgRpe: number
  isHighFatigue: boolean
}): PhaseTransitionEvaluation {
  const { weeksInPhase, maxWeeks, weeklyVolume, recentStatuses, avgRpe, isHighFatigue } = params
  const volumeAtMrv = isMrvReached(weeklyVolume)
  const lastTwo = recentStatuses.slice(-2)
  const stagnated = lastTwo.length === 2 && lastTwo.every((s) => s === 'Estagnado' || s === 'Regressão')

  // Trigger 1 — MRV + stagnation
  if (volumeAtMrv && stagnated) {
    return {
      shouldTransition: true,
      trigger: 'MRV_REACHED',
      message: 'Volume máximo recuperável atingido com desempenho estagnado. Indicado: Deload → Intensificação.',
    }
  }

  // Trigger 2 — Neural plateau (2 flat weeks, volume moderate, good recovery)
  const moderateVolume = !Object.values(weeklyVolume).some((v) => v >= 15)
  if (stagnated && !isHighFatigue && moderateVolume) {
    return {
      shouldTransition: true,
      trigger: 'NEURAL_PLATEAU',
      message: '2 semanas de estagnação com recuperação adequada. Indicado: Semana de Teste (1RM/AMRAP).',
    }
  }

  // Trigger 3 — Temporal
  if (weeksInPhase >= maxWeeks) {
    return {
      shouldTransition: true,
      trigger: 'TEMPORAL',
      message: `Duração máxima da fase (${maxWeeks} semanas) atingida. Avançar para próximo bloco.`,
    }
  }

  // Trigger 4 — Peak fatigue at MRV
  if (volumeAtMrv && avgRpe >= 9.5) {
    return {
      shouldTransition: true,
      trigger: 'PEAK_FATIGUE',
      message: 'MRV + RPE 10 atingidos. Adicionar +1 dia de frequência para suportar volume pico.',
    }
  }

  return { shouldTransition: false, trigger: null, message: 'Fase dentro dos parâmetros normais.' }
}

// ─── ETAPA 2 — MESO PROGRESSION RULES ────────────────────────────────────────

/**
 * Returns the sets × reps scheme for a given meso week in Hipertrofia_Resistência Meso 1.
 * Scheme: 8×2 → 6×3 → 5×4 → 4×5 (sets × reps blocks per week)
 */
export function getHRMeso1Scheme(mesoWeek: number): { sets: number; repsPerBlock: number } {
  const schemes: Record<number, { sets: number; repsPerBlock: number }> = {
    1: { sets: 8, repsPerBlock: 2 },
    2: { sets: 6, repsPerBlock: 3 },
    3: { sets: 5, repsPerBlock: 4 },
    4: { sets: 4, repsPerBlock: 5 },
  }
  return schemes[mesoWeek] ?? schemes[1]
}

// ─── TRAINING FREQUENCY ──────────────────────────────────────────────────────

/**
 * Returns recommended training days per week for a given phase.
 * Base: 3–4 days. +1 day only at peak (Hipertrofia_Pico Meso 2).
 */
export function getRecommendedFrequency(phaseType: string | null, mesoNumber: number | null): number {
  if (phaseType === 'Hipertrofia_Pico' && mesoNumber === 2) return 5
  return 4
}
