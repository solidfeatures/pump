import { prisma } from '@/lib/prisma'
import type { TrainingPhase, PlannedSession, PlannedExercise, PhaseType, TechniqueFocus } from '@/lib/types'

function mapPhase(raw: {
  id: string
  name: string
  etapa: number
  phase_type: string | null
  meso_number: number | null
  technique_focus: string | null
  phase_order: number | null
  duration_weeks: number | null
  target_rir_min: number | null
  target_rir_max: number | null
  volume_pct_tension: number | null
  volume_pct_metabolic: number | null
  progression_rule: string | null
  is_current: boolean
  created_at: Date
}): TrainingPhase {
  return {
    id: raw.id,
    name: raw.name,
    etapa: raw.etapa as 1 | 2,
    phaseType: raw.phase_type as PhaseType | null,
    mesoNumber: raw.meso_number,
    techniqueFocus: raw.technique_focus as TechniqueFocus,
    phaseOrder: raw.phase_order,
    durationWeeks: raw.duration_weeks,
    targetRirMin: raw.target_rir_min,
    targetRirMax: raw.target_rir_max,
    volumePctTension: raw.volume_pct_tension,
    volumePctMetabolic: raw.volume_pct_metabolic,
    progressionRule: raw.progression_rule,
    isCurrent: raw.is_current,
    createdAt: raw.created_at,
  }
}

function mapPlannedSession(raw: {
  id: string
  phase_id: string | null
  name: string | null
  day_of_week: number | null
  week_number: number | null
  meso_week: number | null
  session_number: number | null
  planned_date: Date | null
  status: string
  actual_session_id: string | null
  ai_notes: string | null
  created_at: Date
  exercises?: {
    id: string
    planned_session_id: string
    exercise_id: string
    sets_count: number
    reps_min: number | null
    reps_max: number | null
    suggested_load_kg: number | null
    target_rpe: number | null
    target_rir: number | null
    technique: string | null
    ai_feedback: string | null
    sort_order: number
    created_at: Date
  }[]
}): PlannedSession {
  return {
    id: raw.id,
    phaseId: raw.phase_id,
    name: raw.name ?? '',
    dayOfWeek: raw.day_of_week,
    weekNumber: raw.week_number,
    mesoWeek: raw.meso_week,
    sessionNumber: raw.session_number,
    plannedDate: raw.planned_date ? raw.planned_date.toISOString().split('T')[0] : null,
    status: raw.status as PlannedSession['status'],
    actualSessionId: raw.actual_session_id,
    aiNotes: raw.ai_notes,
    createdAt: raw.created_at,
    exercises: raw.exercises?.map(
      (e): PlannedExercise => ({
        id: e.id,
        plannedSessionId: e.planned_session_id,
        exerciseId: e.exercise_id,
        setsCount: e.sets_count,
        repsMin: e.reps_min,
        repsMax: e.reps_max,
        suggestedLoadKg: e.suggested_load_kg,
        targetRpe: e.target_rpe,
        targetRir: e.target_rir,
        technique: e.technique,
        aiFeedback: e.ai_feedback,
        sortOrder: e.sort_order,
        createdAt: e.created_at,
      })
    ),
  }
}

export async function getCurrentPhase(): Promise<TrainingPhase | null> {
  const row = await prisma.trainingPhase.findFirst({ where: { is_current: true } })
  return row ? mapPhase(row) : null
}

export async function getAllPhases(): Promise<TrainingPhase[]> {
  const rows = await prisma.trainingPhase.findMany({ orderBy: { phase_order: 'asc' } })
  return rows.map(mapPhase)
}

export async function createTrainingPhase(data: Partial<TrainingPhase>) {
  if (data.isCurrent) {
    await prisma.trainingPhase.updateMany({
      where: { is_current: true },
      data: { is_current: false }
    })
  }
  
  return await prisma.trainingPhase.create({
    data: {
      name: data.name || 'Nova Fase',
      etapa: data.etapa || 1,
      phase_type: data.phaseType,
      meso_number: data.mesoNumber,
      technique_focus: data.techniqueFocus,
      phase_order: data.phaseOrder || 0,
      duration_weeks: data.durationWeeks,
      target_rir_min: data.targetRirMin,
      target_rir_max: data.targetRirMax,
      volume_pct_tension: data.volumePctTension,
      volume_pct_metabolic: data.volumePctMetabolic,
      progression_rule: data.progressionRule,
      is_current: data.isCurrent || false,
    }
  })
}

export async function updateTrainingPhase(id: string, data: Partial<TrainingPhase>) {
  if (data.isCurrent) {
    await prisma.trainingPhase.updateMany({
      where: { 
        is_current: true,
        NOT: { id }
      },
      data: { is_current: false }
    })
  }

  return await prisma.trainingPhase.update({
    where: { id },
    data: {
      name: data.name,
      etapa: data.etapa,
      phase_type: data.phaseType,
      meso_number: data.mesoNumber,
      technique_focus: data.techniqueFocus,
      phase_order: data.phaseOrder,
      duration_weeks: data.durationWeeks,
      target_rir_min: data.targetRirMin,
      target_rir_max: data.targetRirMax,
      volume_pct_tension: data.volumePctTension,
      volume_pct_metabolic: data.volumePctMetabolic,
      progression_rule: data.progressionRule,
      is_current: data.isCurrent,
    }
  })
}

export async function deleteTrainingPhase(id: string) {
  return await prisma.trainingPhase.delete({
    where: { id }
  })
}
