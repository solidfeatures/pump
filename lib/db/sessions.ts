import { prisma } from '@/lib/prisma'
import type { WorkoutSession, WorkoutSet } from '@/lib/types'

type WorkoutSessionRow = {
  id: string
  date: Date
  notes: string | null
  created_at: Date
  sets: WorkoutSetRow[]
}

type WorkoutSetRow = {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  set_category: string
  set_technique: string
  load_kg: number
  reps: number
  rpe: number | null
  rir: number | null
  notes: string | null
  tonnage: number | null
  one_rm_epley: number | null
  created_at: Date
}

function mapSet(raw: WorkoutSetRow): WorkoutSet {
  return {
    id: raw.id,
    sessionId: raw.session_id,
    exerciseId: raw.exercise_id,
    setNumber: raw.set_number,
    setCategory: raw.set_category as WorkoutSet['setCategory'],
    setTechnique: raw.set_technique as WorkoutSet['setTechnique'],
    loadKg: raw.load_kg,
    reps: raw.reps,
    rpe: raw.rpe,
    rir: raw.rir,
    notes: raw.notes,
    tonnage: raw.tonnage,
    oneRmEpley: raw.one_rm_epley,
    createdAt: raw.created_at,
    completed: true,
  }
}

function mapSession(raw: WorkoutSessionRow): WorkoutSession {
  return {
    id: raw.id,
    date: raw.date.toISOString().split('T')[0],
    notes: raw.notes,
    createdAt: raw.created_at,
    sets: raw.sets.map(mapSet),
    status: 'completed',
  }
}

export async function getWorkoutSessionsInRange(
  startDate: string,
  endDate: string
): Promise<WorkoutSession[]> {
  const rows = await prisma.workoutSession.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: { sets: { orderBy: [{ exercise_id: 'asc' }, { set_number: 'asc' }] } },
    orderBy: { date: 'asc' },
  })
  return rows.map(mapSession)
}

export async function getWorkoutSessionById(id: string): Promise<WorkoutSession | null> {
  const row = await prisma.workoutSession.findUnique({
    where: { id },
    include: { sets: { orderBy: [{ exercise_id: 'asc' }, { set_number: 'asc' }] } },
  })
  return row ? mapSession(row) : null
}

export async function createWorkoutSession(date: string, notes?: string): Promise<WorkoutSession> {
  const row = await prisma.workoutSession.create({
    data: { date: new Date(date), notes: notes ?? null },
    include: { sets: true },
  })
  return mapSession(row)
}

export async function upsertWorkoutSet(data: {
  sessionId: string
  exerciseId: string
  setNumber: number
  setCategory?: string
  setTechnique?: string
  loadKg: number
  reps: number
  rpe?: number | null
  notes?: string | null
}): Promise<WorkoutSet> {
  const rir = data.rpe != null ? 10 - data.rpe : null
  const tonnage = data.loadKg * data.reps
  const oneRmEpley = data.loadKg * (1 + data.reps / 30)

  const row = await prisma.workoutSet.upsert({
    where: {
      session_id_exercise_id_set_number: {
        session_id: data.sessionId,
        exercise_id: data.exerciseId,
        set_number: data.setNumber,
      },
    },
    create: {
      session_id: data.sessionId,
      exercise_id: data.exerciseId,
      set_number: data.setNumber,
      set_category: data.setCategory ?? 'Working Set',
      set_technique: data.setTechnique ?? 'Normal',
      load_kg: data.loadKg,
      reps: data.reps,
      rpe: data.rpe ?? null,
      rir,
      notes: data.notes ?? null,
      tonnage,
      one_rm_epley: oneRmEpley,
    },
    update: {
      set_category: data.setCategory ?? 'Working Set',
      set_technique: data.setTechnique ?? 'Normal',
      load_kg: data.loadKg,
      reps: data.reps,
      rpe: data.rpe ?? null,
      rir,
      notes: data.notes ?? null,
      tonnage,
      one_rm_epley: oneRmEpley,
    },
  })

  return mapSet(row)
}

/** Progression data for a single exercise with 4-session rolling average. */
export async function getProgressionForExercise(exerciseId: string, limit = 20) {
  const sets = await prisma.workoutSet.findMany({
    where: {
      exercise_id: exerciseId,
      set_category: { in: ['Working Set', 'Top Set', 'Back Off Set'] },
      rpe: { gte: 7 },
    },
    orderBy: { session: { date: 'desc' } },
    take: limit,
    select: {
      load_kg: true,
      reps: true,
      tonnage: true,
      one_rm_epley: true,
      session: { select: { date: true } },
    },
  })

  return sets
    .map((s) => ({
      date: s.session.date.toISOString().split('T')[0],
      weight: s.load_kg,
      reps: s.reps,
      volume: s.tonnage ?? 0,
      oneRm: s.one_rm_epley ?? 0,
      exerciseId,
    }))
    .reverse()
}
