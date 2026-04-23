import { prisma } from '@/lib/prisma'
import { PlannedSession, PlannedExercise } from '@/lib/types'
import fs from 'fs'

export async function getPlannedSessionsByPhase(phaseId: string): Promise<PlannedSession[]> {
  const allSessionsCount = await prisma.plannedSession.count()
  const rows = await prisma.plannedSession.findMany({
    where: { phase_id: phaseId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  })

  fs.appendFileSync('debug_db.log', `[${new Date().toISOString()}] phaseId: ${phaseId}, rows count: ${rows.length}, total sessions in db: ${allSessionsCount}\n`)
  if (rows.length > 0) {
    fs.appendFileSync('debug_db.log', `  - First row keys: ${Object.keys(rows[0]).join(', ')}\n`)
    fs.appendFileSync('debug_db.log', `  - First row raw: ${JSON.stringify(rows[0])}\n`)
  }


  return rows.map(row => ({
    id: row.id,
    phaseId: row.phase_id,
    name: row.name,
    weekNumber: row.week_number,
    mesoWeek: row.meso_week,
    sessionNumber: row.session_number,
    dayOfWeek: row.day_of_week,
    plannedDate: row.planned_date?.toISOString().split('T')[0] || null,
    status: row.status as PlannedSession['status'],
    actualSessionId: row.actual_session_id,
    aiNotes: row.ai_notes,
    createdAt: row.created_at,
    exercises: row.exercises.map(pe => ({
      id: pe.id,
      plannedSessionId: pe.planned_session_id,
      exerciseId: pe.exercise_id,
      setsCount: pe.sets_count,
      repsMin: pe.reps_min,
      repsMax: pe.reps_max,
      suggestedLoadKg: pe.suggested_load_kg,
      targetRpe: pe.target_rpe,
      targetRir: pe.target_rir,
      technique: pe.technique,
      aiFeedback: pe.ai_feedback,
      sortOrder: pe.sort_order,
      createdAt: pe.created_at,
      exercise: pe.exercise ? {
        id: pe.exercise.id,
        name: pe.exercise.name,
        nameEn: pe.exercise.name_en ?? null,
        videoUrl: pe.exercise.video_url ?? null,
        movementPattern: pe.exercise.movement_pattern,
        classification: pe.exercise.classification as any,
        neuralDemand: pe.exercise.neural_demand,
        createdAt: pe.exercise.created_at
      } : undefined
    }))
  }))
}

export async function updatePlannedSession(id: string, data: Partial<PlannedSession>) {
  return await prisma.plannedSession.update({
    where: { id },
    data: {
      name: data.name,
      day_of_week: data.dayOfWeek,
      planned_date: data.plannedDate ? new Date(data.plannedDate) : undefined,
      status: data.status,
    }
  })
}

export async function deletePlannedSession(id: string) {
  return await prisma.plannedSession.delete({
    where: { id }
  })
}

export async function movePlannedSession(id: string, newDayOfWeek: number) {
  return await prisma.plannedSession.update({
    where: { id },
    data: { day_of_week: newDayOfWeek }
  })
}

export async function upsertPlannedExercise(data: Partial<PlannedExercise> & { plannedSessionId: string, exerciseId: string }) {
  if (data.id) {
    return await prisma.plannedExercise.update({
      where: { id: data.id },
      data: {
        sets_count: data.setsCount,
        reps_min: data.repsMin,
        reps_max: data.repsMax,
        suggested_load_kg: data.suggestedLoadKg,
        target_rpe: data.targetRpe,
        target_rir: data.targetRir,
        technique: data.technique,
        sort_order: data.sortOrder,
      }
    })
  } else {
    return await prisma.plannedExercise.create({
      data: {
        planned_session_id: data.plannedSessionId,
        exercise_id: data.exerciseId,
        sets_count: data.setsCount || 3,
        reps_min: data.repsMin,
        reps_max: data.repsMax,
        suggested_load_kg: data.suggestedLoadKg,
        target_rpe: data.targetRpe,
        target_rir: data.targetRir,
        technique: data.technique,
        sort_order: data.sortOrder || 0,
      }
    })
  }
}

export async function deletePlannedExercise(id: string) {
  return await prisma.plannedExercise.delete({
    where: { id }
  })
}
export async function createPlannedSession(data: Partial<PlannedSession> & { phaseId: string }) {
  return await prisma.plannedSession.create({
    data: {
      phase_id: data.phaseId,
      name: data.name,
      week_number: data.weekNumber || 1,
      meso_week: data.mesoWeek || 1,
      session_number: data.sessionNumber || 1,
      day_of_week: data.dayOfWeek || 1,
      status: data.status || 'Pendente',
      ai_notes: data.aiNotes,
    }
  })
}

export async function reorderPlannedExercises(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => 
    prisma.plannedExercise.update({
      where: { id },
      data: { sort_order: index }
    })
  )
  return await prisma.$transaction(updates)
}
