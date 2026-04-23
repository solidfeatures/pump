'use server'

import { upsertWorkoutSet, createWorkoutSession } from '@/lib/db'

export async function saveSetAction(data: {
  sessionId: string
  exerciseId: string
  setNumber: number
  setCategory?: string
  setTechnique?: string
  loadKg: number
  reps: number
  rpe?: number | null
  notes?: string | null
}) {
  try {
    return await upsertWorkoutSet(data)
  } catch (e) {
    // DB may not be configured yet — fail silently, localStorage is the fallback
    console.error('[saveSetAction]', e)
    return null
  }
}

export async function createSessionAction(date: string) {
  try {
    return await createWorkoutSession(date)
  } catch (e) {
    console.error('[createSessionAction]', e)
    return null
  }
}

export async function getLastPerformanceAction(exerciseId: string) {
  try {
    const progression = await getProgressionForExercise(exerciseId, 1)
    return progression[0] || null
  } catch (e) {
    console.error('[getLastPerformanceAction]', e)
    return null
  }
}
