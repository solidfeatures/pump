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
import { revalidatePath } from 'next/cache'

export async function moveSessionAction(sessionId: string, newDayOfWeek: number) {
  try {
    await movePlannedSession(sessionId, newDayOfWeek)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[moveSessionAction]', e)
    return { success: false, error: 'Failed to move session' }
  }
}

export async function updatePlannedSessionAction(id: string, data: any) {
  try {
    await updatePlannedSession(id, data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[updatePlannedSessionAction]', e)
    return { success: false, error: 'Failed to update session' }
  }
}

export async function deletePlannedSessionAction(id: string) {
  try {
    await deletePlannedSession(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deletePlannedSessionAction]', e)
    return { success: false, error: 'Failed to delete session' }
  }
}

export async function upsertPlannedExerciseAction(data: any) {
  try {
    await upsertPlannedExercise(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[upsertPlannedExerciseAction]', e)
    return { success: false, error: 'Failed to save exercise' }
  }
}

export async function deletePlannedExerciseAction(id: string) {
  try {
    await deletePlannedExercise(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deletePlannedExerciseAction]', e)
    return { success: false, error: 'Failed to delete exercise' }
  }
}

export async function createPlannedSessionAction(data: any) {
  try {
    await createPlannedSession(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[createPlannedSessionAction]', e)
    return { success: false, error: 'Failed to create session' }
  }
}

export async function createTrainingPhaseAction(data: any) {
  try {
    await createTrainingPhase(data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[createTrainingPhaseAction]', e)
    return { success: false, error: 'Failed to create phase' }
  }
}

export async function updateTrainingPhaseAction(id: string, data: any) {
  try {
    await updateTrainingPhase(id, data)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[updateTrainingPhaseAction]', e)
    return { success: false, error: 'Failed to update phase' }
  }
}

export async function deleteTrainingPhaseAction(id: string) {
  try {
    await deleteTrainingPhase(id)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[deleteTrainingPhaseAction]', e)
  }
}

export async function reorderPlannedExercisesAction(orderedIds: string[]) {
  try {
    await reorderPlannedExercises(orderedIds)
    revalidatePath('/plan')
    return { success: true }
  } catch (e) {
    console.error('[reorderPlannedExercisesAction]', e)
    return { success: false, error: 'Failed to reorder exercises' }
  }
}
