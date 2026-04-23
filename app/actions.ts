'use server'

import { upsertWorkoutSet, createWorkoutSession, getProgressionForExercise } from '@/lib/db'
import { getLatestBodyMetrics } from '@/lib/db/measures'
import { getAthleteProfile, updateAthleteProfile, AthleteProfile } from '@/lib/db/athlete'

export async function saveSetAction(data: {
  sessionId: string
  exerciseId: string
  setNumber: number
  setType?: string
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

export async function getProfileAction() {
  try {
    const profile = await getAthleteProfile()
    console.log('[getProfileAction] Profile:', profile ? `Found (${profile.id})` : 'NULL')
    return profile
  } catch (e) {
    console.error('[getProfileAction] Error:', e)
    return null
  }
}

export async function updateProfileAction(profile: Partial<AthleteProfile>) {
  try {
    return await updateAthleteProfile(profile)
  } catch (e) {
    console.error('[updateProfileAction]', e)
    throw e
  }
}

export async function getLatestMetricsAction() {
  try {
    return await getLatestBodyMetrics()
  } catch (e) {
    console.error('[getLatestMetricsAction]', e)
    return null
  }
}

export async function getLatestNutritionPlanAction() {
  try {
    const { getLatestNutritionPlan } = await import('@/lib/db/nutrition')
    return await getLatestNutritionPlan()
  } catch (e) {
    console.error('[getLatestNutritionPlanAction]', e)
    return null
  }
}

export async function getAllPhasesAction() {
  try {
    const { getAllPhases } = await import('@/lib/db/phases')
    return await getAllPhases()
  } catch (e) {
    console.error('[getAllPhasesAction]', e)
    return []
  }
}
