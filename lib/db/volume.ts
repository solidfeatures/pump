/**
 * Weekly volume queries — Jayme de Lamadrid methodology.
 *
 * Rules:
 * - Only count Working Set / Top Set / Back Off Set with RPE ≥ 7
 * - Compound: primary muscle = 100% (series_factor 1.0), secondary = 50% (0.5)
 * - Isolation: primary muscle = 100% (series_factor 1.0)
 * - Push movements → secondary shoulder = Deltóide Anterior
 * - Pull movements → secondary shoulder = Deltóide Posterior
 * - MRV danger zone ≥ 20 sets/week per muscle group
 */

import { prisma } from '@/lib/prisma'
import type { MuscleGroup } from '@/lib/types'
import { MRV_THRESHOLD } from '@/lib/periodization'

const VOLUME_CATEGORIES = ['Working Set', 'Top Set', 'Back Off Set']

export interface MuscleVolumeReport {
  muscleGroup: MuscleGroup
  weeklySetCount: number        // weighted by series_factor
  isMrvReached: boolean
  isAboveMev: boolean           // MEV = 10 sets/week
}

/**
 * Calculates weighted weekly volume per muscle group for a date range.
 * Returns all muscle groups found in the dataset.
 */
export async function getWeeklyVolumeByMuscle(
  startDate: string,
  endDate: string
): Promise<MuscleVolumeReport[]> {
  // Fetch all working sets in range with their exercise muscle mappings
  const sets = await prisma.workoutSet.findMany({
    where: {
      set_type: { in: VOLUME_CATEGORIES },
      rpe: { gte: 7 },
      session: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    },
    select: {
      exercise: {
        select: {
          muscles: {
            select: { muscle_group: true, series_factor: true },
          },
        },
      },
    },
  })

  // Accumulate weighted sets per muscle group
  const volumeMap: Record<string, number> = {}

  for (const set of sets) {
    for (const em of set.exercise.muscles) {
      const key = em.muscle_group
      volumeMap[key] = (volumeMap[key] ?? 0) + em.series_factor
    }
  }

  return Object.entries(volumeMap).map(([muscleGroup, weeklySetCount]) => ({
    muscleGroup: muscleGroup as MuscleGroup,
    weeklySetCount: Math.round(weeklySetCount * 10) / 10,
    isMrvReached: weeklySetCount >= MRV_THRESHOLD,
    isAboveMev: weeklySetCount >= 10,
  }))
}

/**
 * Returns the per-session tonnage for an exercise (for rolling average calculation).
 * Limited to the last `sessionCount` distinct sessions.
 */
export async function getSessionTonnages(
  exerciseId: string,
  sessionCount = 4
): Promise<{ date: string; tonnage: number }[]> {
  // Get distinct session dates, ordered by most recent
  const sessions = await prisma.workoutSession.findMany({
    where: {
      sets: {
        some: {
          exercise_id: exerciseId,
          set_type: { in: VOLUME_CATEGORIES },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: sessionCount,
    select: {
      date: true,
      sets: {
        where: {
          exercise_id: exerciseId,
          set_type: { in: VOLUME_CATEGORIES },
          rpe: { gte: 7 },
        },
        select: { tonnage: true },
      },
    },
  })

  return sessions
    .map((s) => ({
      date: s.date.toISOString().split('T')[0],
      tonnage: s.sets.reduce((sum, set) => sum + (set.tonnage ?? 0), 0),
    }))
    .reverse()
}

/**
 * Returns the last two session tonnages for an exercise — used for progression status.
 */
export async function getLastTwoSessionTonnages(
  exerciseId: string
): Promise<{ current: number; previous: number }> {
  const last2 = await getSessionTonnages(exerciseId, 2)
  return {
    current: last2[1]?.tonnage ?? 0,
    previous: last2[0]?.tonnage ?? 0,
  }
}
