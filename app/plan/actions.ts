'use server'

import {
  movePlannedSession,
  updatePlannedSession,
  deletePlannedSession,
  createPlannedSession,
  upsertPlannedExercise,
  deletePlannedExercise,
  createTrainingPhase,
  updateTrainingPhase,
  deleteTrainingPhase,
  reorderPlannedExercises
} from '@/lib/db'
import type { PlannedSession, PlannedExercise, TrainingPhase } from '@/lib/types'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function moveSessionAction(sessionId: string, newDayOfWeek: number): Promise<ActionResult> {
  if (!sessionId || newDayOfWeek < 1 || newDayOfWeek > 7) {
    return { success: false, error: 'Parâmetros inválidos' }
  }
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: 'ID de sessão inválido — use sessões do banco de dados' }
  }
  try {
    await movePlannedSession(sessionId, newDayOfWeek)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[moveSessionAction]', e)
    return { success: false, error: 'Falha ao mover sessão' }
  }
}

export async function updatePlannedSessionAction(id: string, data: Partial<PlannedSession>): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID obrigatório' }
  try {
    await updatePlannedSession(id, data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[updatePlannedSessionAction]', e)
    return { success: false, error: 'Falha ao atualizar sessão' }
  }
}

export async function deletePlannedSessionAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID obrigatório' }
  try {
    await deletePlannedSession(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deletePlannedSessionAction]', e)
    return { success: false, error: 'Falha ao deletar sessão' }
  }
}

export async function upsertPlannedExerciseAction(
  data: Partial<PlannedExercise> & { plannedSessionId: string; exerciseId: string }
): Promise<ActionResult> {
  if (!data.plannedSessionId || !data.exerciseId) {
    return { success: false, error: 'plannedSessionId e exerciseId são obrigatórios' }
  }
  const setsCount = data.setsCount ?? 3
  if (setsCount < 1 || setsCount > 20) {
    return { success: false, error: 'setsCount deve estar entre 1 e 20' }
  }
  if (data.repsMin != null && data.repsMax != null && data.repsMin > data.repsMax) {
    return { success: false, error: 'repsMin não pode ser maior que repsMax' }
  }
  try {
    await upsertPlannedExercise(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[upsertPlannedExerciseAction]', e)
    return { success: false, error: 'Falha ao salvar exercício' }
  }
}

export async function deletePlannedExerciseAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID obrigatório' }
  try {
    await deletePlannedExercise(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deletePlannedExerciseAction]', e)
    return { success: false, error: 'Falha ao deletar exercício' }
  }
}

export async function createPlannedSessionAction(
  data: Partial<PlannedSession> & { phaseId: string }
): Promise<ActionResult> {
  if (!data.phaseId) return { success: false, error: 'phaseId obrigatório' }
  try {
    await createPlannedSession(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[createPlannedSessionAction]', e)
    return { success: false, error: 'Falha ao criar sessão' }
  }
}

export async function createTrainingPhaseAction(data: Partial<TrainingPhase>): Promise<ActionResult> {
  if (!data.name?.trim()) return { success: false, error: 'Nome da fase obrigatório' }
  try {
    await createTrainingPhase(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[createTrainingPhaseAction]', e)
    return { success: false, error: 'Falha ao criar fase' }
  }
}

export async function updateTrainingPhaseAction(id: string, data: Partial<TrainingPhase>): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID obrigatório' }
  try {
    await updateTrainingPhase(id, data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[updateTrainingPhaseAction]', e)
    return { success: false, error: 'Falha ao atualizar fase' }
  }
}

export async function deleteTrainingPhaseAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID obrigatório' }
  try {
    await deleteTrainingPhase(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deleteTrainingPhaseAction]', e)
    return { success: false, error: 'Falha ao deletar fase' }
  }
}

export async function getAllPlannedSessionsAction(): Promise<PlannedSession[]> {
  try {
    const { getPlannedSessionsByPhase } = await import('@/lib/db/planned')
    const { getAllPhases } = await import('@/lib/db/phases')
    const phases = await getAllPhases()
    const sessionArrays = await Promise.all(phases.map(p => getPlannedSessionsByPhase(p.id)))
    return sessionArrays.flat()
  } catch (e) {
    console.error('[getAllPlannedSessionsAction]', e)
    return []
  }
}

export async function reorderPlannedExercisesAction(orderedIds: string[]): Promise<ActionResult> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { success: false, error: 'Lista de IDs inválida' }
  }
  try {
    await reorderPlannedExercises(orderedIds)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[reorderPlannedExercisesAction]', e)
    return { success: false, error: 'Falha ao reordenar exercícios' }
  }
}
