import { prisma } from '@/lib/prisma'
import type { Exercise, ExerciseMuscle } from '@/lib/types'

function mapExercise(raw: {
  id: string
  name: string
  name_en: string | null
  video_url: string | null
  movement_pattern: string | null
  classification: string | null
  neural_demand: number | null
  created_at: Date
  muscles?: {
    exercise_id: string
    muscle_group: string
    muscle: string
    series_factor: number
    created_at: Date
  }[]
}): Exercise {
  return {
    id: raw.id,
    name: raw.name,
    nameEn: raw.name_en,
    videoUrl: raw.video_url,
    movementPattern: raw.movement_pattern,
    classification: raw.classification as 'Compound' | 'Isolation' | null,
    neuralDemand: raw.neural_demand,
    createdAt: raw.created_at,
    muscles: raw.muscles?.map((m) => ({
      id: `${m.exercise_id}-${m.muscle}`,
      exerciseId: m.exercise_id,
      muscleGroup: m.muscle_group as ExerciseMuscle['muscleGroup'],
      muscle: m.muscle,
      seriesFactor: Number(m.series_factor),
      createdAt: m.created_at,
    })),
  }
}

export async function getExercises(): Promise<Exercise[]> {
  const rows = await prisma.exercise.findMany({
    include: { muscles: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(mapExercise)
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const row = await prisma.exercise.findUnique({
    where: { id },
    include: { muscles: true },
  })
  return row ? mapExercise(row) : null
}
