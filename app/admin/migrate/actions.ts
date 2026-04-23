'use server'

import { prisma } from '@/lib/prisma'

// Parsed from docs/treinos - Treinos.csv
// set_type normalisation: "Back-off Set" → "Back Off Set", "Warming Up" → "Warming Set"
function normaliseSetType(raw: string): string {
  const map: Record<string, string> = {
    'Back-off Set': 'Back Off Set',
    'Warming Up': 'Warming Set',
  }
  return map[raw] ?? raw
}

const CSV_SESSIONS = [
  {
    date: '2026-04-07',
    sets: [
      { exercise: 'Lying Leg Curl',    n: 1, type: 'Feeder Set',   load: 30,   reps: 12, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Lying Leg Curl',    n: 2, type: 'Working Set',  load: 40,   reps: 13, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Lying Leg Curl',    n: 3, type: 'Working Set',  load: 45,   reps: 12, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Extension',     n: 1, type: 'Feeder Set',   load: 40,   reps: 14, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Extension',     n: 2, type: 'Working Set',  load: 50,   reps: 12, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Extension',     n: 3, type: 'Working Set',  load: 50,   reps: 10, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Extension',     n: 4, type: 'Working Set',  load: 50,   reps: 10, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Press',         n: 1, type: 'Feeder Set',   load: 50,   reps: 15, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Press',         n: 2, type: 'Working Set',  load: 90,   reps: 14, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Press',         n: 3, type: 'Working Set',  load: 90,   reps: 13, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Seated Calf Raise', n: 1, type: 'Working Set',  load: 35,   reps: 15, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Seated Calf Raise', n: 2, type: 'Working Set',  load: 35,   reps: 14, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Seated Calf Raise', n: 3, type: 'Working Set',  load: 35,   reps: 13, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Adductor Machine',  n: 1, type: 'Feeder Set',   load: 35,   reps: 15, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Adductor Machine',  n: 2, type: 'Working Set',  load: 45,   reps: 12, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Adductor Machine',  n: 3, type: 'Working Set',  load: 45,   reps: 10, rir: 1, rpe: 9,  notes: null },
    ],
  },
  {
    date: '2026-04-10',
    sets: [
      { exercise: 'Lat Pulldown',               n: 1, type: 'Working Set', load: 50, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Lat Pulldown',               n: 2, type: 'Working Set', load: 50, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Lat Pulldown',               n: 3, type: 'Working Set', load: 50, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Neutral Grip Machine Row',   n: 1, type: 'Working Set', load: 30, reps:  8, rir: 1, rpe: 9, notes: null },
      { exercise: 'Neutral Grip Machine Row',   n: 2, type: 'Working Set', load: 30, reps:  9, rir: 1, rpe: 9, notes: null },
      { exercise: 'Neutral Grip Machine Row',   n: 3, type: 'Working Set', load: 30, reps:  9, rir: 1, rpe: 9, notes: null },
      { exercise: 'Seated Row',                 n: 1, type: 'Working Set', load: 45, reps: 11, rir: 1, rpe: 9, notes: null },
      { exercise: 'Seated Row',                 n: 2, type: 'Working Set', load: 50, reps:  9, rir: 1, rpe: 9, notes: null },
      { exercise: 'Seated Row',                 n: 3, type: 'Working Set', load: 50, reps:  7, rir: 1, rpe: 9, notes: null },
      { exercise: 'Hammer Curl',                n: 1, type: 'Working Set', load: 35, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Hammer Curl',                n: 2, type: 'Working Set', load: 35, reps:  8, rir: 1, rpe: 9, notes: null },
      { exercise: 'Hammer Curl',                n: 3, type: 'Working Set', load: 35, reps:  8, rir: 1, rpe: 9, notes: null },
      { exercise: 'Cable Curl',                 n: 1, type: 'Working Set', load: 30, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Cable Curl',                 n: 2, type: 'Working Set', load: 30, reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Cable Curl',                 n: 3, type: 'Working Set', load: 30, reps:  9, rir: 1, rpe: 9, notes: null },
    ],
  },
  {
    date: '2026-04-11',
    sets: [
      { exercise: 'Pec Fly',            n: 1, type: 'Working Set', load: 30,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Pec Fly',            n: 2, type: 'Working Set', load: 30,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Pec Fly',            n: 3, type: 'Working Set', load: 30,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Pec Fly',            n: 4, type: 'Working Set', load: 30,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Bench Press',        n: 1, type: 'Working Set', load: 50,   reps: 10, rir: 1, rpe: 9, notes: '2min rest' },
      { exercise: 'Bench Press',        n: 2, type: 'Working Set', load: 50,   reps: 10, rir: 1, rpe: 9, notes: '2min rest' },
      { exercise: 'Bench Press',        n: 3, type: 'Working Set', load: 50,   reps: 10, rir: 1, rpe: 9, notes: '2min rest' },
      { exercise: 'Low Cable Fly',      n: 1, type: 'Working Set', load: 14,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'Low Cable Fly',      n: 2, type: 'Working Set', load: 14,   reps:  7, rir: 1, rpe: 9, notes: null },
      { exercise: 'Low Cable Fly',      n: 3, type: 'Working Set', load: 14,   reps:  7, rir: 1, rpe: 9, notes: null },
      { exercise: 'Low Cable Fly',      n: 4, type: 'Working Set', load: 14,   reps:  6, rir: 1, rpe: 9, notes: null },
      { exercise: 'Triceps Pushdown',   n: 1, type: 'Working Set', load: 27,   reps: 13, rir: 1, rpe: 9, notes: null },
      { exercise: 'Triceps Pushdown',   n: 2, type: 'Working Set', load: 27,   reps: 12, rir: 1, rpe: 9, notes: null },
      { exercise: 'Triceps Pushdown',   n: 3, type: 'Working Set', load: 27,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'French Press',       n: 1, type: 'Working Set', load: 23,   reps: 10, rir: 1, rpe: 9, notes: null },
      { exercise: 'French Press',       n: 2, type: 'Working Set', load: 23,   reps:  8, rir: 1, rpe: 9, notes: null },
      { exercise: 'French Press',       n: 3, type: 'Working Set', load: 23,   reps:  8, rir: 1, rpe: 9, notes: null },
    ],
  },
  {
    date: '2026-04-13',
    sets: [
      { exercise: 'Hack Squat',        n: 1, type: 'Feeder Set',  load:  30, reps: 20, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Hack Squat',        n: 2, type: 'Working Set', load:  50, reps: 20, rir: 3, rpe: 7,  notes: null },
      { exercise: 'Hack Squat',        n: 3, type: 'Working Set', load:  70, reps: 20, rir: 2, rpe: 8,  notes: null },
      { exercise: 'Hack Squat',        n: 4, type: 'Working Set', load:  70, reps: 20, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Leg Press',         n: 1, type: 'Feeder Set',  load:  90, reps: 20, rir: 3, rpe: 7,  notes: '2min rest' },
      { exercise: 'Leg Press',         n: 2, type: 'Working Set', load: 120, reps: 15, rir: 2, rpe: 8,  notes: '2min rest' },
      { exercise: 'Leg Press',         n: 3, type: 'Working Set', load: 140, reps: 10, rir: 1, rpe: 9,  notes: '2min rest' },
      { exercise: 'Seated Calf Raise', n: 1, type: 'Working Set', load:  35, reps: 15, rir: 2, rpe: 8,  notes: null },
      { exercise: 'Seated Calf Raise', n: 2, type: 'Working Set', load:  45, reps: 13, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Seated Calf Raise', n: 3, type: 'Working Set', load:  40, reps: 14, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Adductor Machine',  n: 1, type: 'Working Set', load:  40, reps: 15, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Adductor Machine',  n: 2, type: 'Working Set', load:  40, reps: 12, rir: 0, rpe: 10, notes: null },
      { exercise: 'Adductor Machine',  n: 3, type: 'Working Set', load:  40, reps:  8, rir: 0, rpe: 10, notes: null },
      { exercise: 'Lat Pulldown',      n: 1, type: 'Feeder Set',  load:  35, reps: 20, rir: 1, rpe: 9,  notes: 'músculo ainda doendo do último treino, 3 dias antes' },
      { exercise: 'Lat Pulldown',      n: 2, type: 'Working Set', load:  52, reps: 12, rir: 3, rpe: 7,  notes: 'músculo ainda doendo do último treino, 3 dias antes' },
      { exercise: 'Lat Pulldown',      n: 3, type: 'Working Set', load:  59, reps:  8, rir: 1, rpe: 9,  notes: 'músculo ainda doendo do último treino, 3 dias antes' },
      { exercise: 'Face Pull',         n: 1, type: 'Working Set', load:  18, reps: 18, rir: 3, rpe: 7,  notes: null },
      { exercise: 'Face Pull',         n: 2, type: 'Working Set', load:  23, reps: 15, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Cable Curl',        n: 1, type: 'Working Set', load:  23, reps: 20, rir: 2, rpe: 8,  notes: null },
      { exercise: 'Cable Curl',        n: 2, type: 'Working Set', load:  32, reps: 12, rir: 1, rpe: 9,  notes: null },
      { exercise: 'Cable Curl',        n: 3, type: 'Working Set', load:  45, reps:  8, rir: 0, rpe: 10, notes: null },
    ],
  },
  {
    date: '2026-04-15',
    sets: [
      { exercise: 'Face Pull',           n: 1, type: 'Working Set', load: 18, reps: 12, rir: 0, rpe: 10, notes: null },
      { exercise: 'Face Pull',           n: 2, type: 'Working Set', load: 18, reps: 10, rir: 0, rpe: 10, notes: null },
      { exercise: 'Face Pull',           n: 3, type: 'Working Set', load: 18, reps: 10, rir: 0, rpe: 10, notes: null },
      { exercise: 'Dumbbell Floor Press',n: 1, type: 'Working Set', load: 40, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Dumbbell Floor Press',n: 2, type: 'Working Set', load: 40, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Dumbbell Floor Press',n: 3, type: 'Working Set', load: 40, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Seated Row',          n: 1, type: 'Feeder Set',  load: 50, reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Seated Row',          n: 2, type: 'Working Set', load: 70, reps: 13, rir: 2, rpe:  8, notes: null },
      { exercise: 'Seated Row',          n: 3, type: 'Working Set', load: 70, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Seated Row',          n: 4, type: 'Top Set',     load: 70, reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Triceps Pushdown',    n: 1, type: 'Feeder Set',  load: 25, reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Triceps Pushdown',    n: 2, type: 'Working Set', load: 30, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Triceps Pushdown',    n: 3, type: 'Top Set',     load: 30, reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Hammer Curl',         n: 1, type: 'Feeder Set',  load: 20, reps: 10, rir: 3, rpe:  7, notes: null },
      { exercise: 'Hammer Curl',         n: 2, type: 'Working Set', load: 25, reps: 11, rir: 1, rpe:  9, notes: null },
      { exercise: 'Hammer Curl',         n: 3, type: 'Top Set',     load: 25, reps: 12, rir: 0, rpe: 10, notes: null },
    ],
  },
  {
    date: '2026-04-16',
    sets: [
      { exercise: 'One-arm Row',    n: 1, type: 'Working Set', load: 25,   reps: 12, rir: 1, rpe:  9, notes: null },
      { exercise: 'One-arm Row',    n: 2, type: 'Working Set', load: 25,   reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'One-arm Row',    n: 3, type: 'Working Set', load: 25,   reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Seated Row',     n: 1, type: 'Working Set', load: 40,   reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Seated Row',     n: 2, type: 'Working Set', load: 60,   reps:  9, rir: 1, rpe:  9, notes: null },
      { exercise: 'Seated Row',     n: 3, type: 'Working Set', load: 60,   reps:  8, rir: 0, rpe: 10, notes: null },
      { exercise: 'Seated Row',     n: 4, type: 'Working Set', load: 60,   reps:  8, rir: 0, rpe: 10, notes: null },
      { exercise: 'Rear Delt Fly',  n: 1, type: 'Working Set', load: 15,   reps: 10, rir: 3, rpe:  7, notes: null },
      { exercise: 'Rear Delt Fly',  n: 2, type: 'Working Set', load: 17.5, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Rear Delt Fly',  n: 3, type: 'Working Set', load: 17.5, reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Cable Curl',     n: 1, type: 'Working Set', load: 27,   reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Cable Curl',     n: 2, type: 'Working Set', load: 32,   reps: 11, rir: 1, rpe:  9, notes: null },
      { exercise: 'Cable Curl',     n: 3, type: 'Working Set', load: 32,   reps:  8, rir: 1, rpe:  9, notes: null },
      { exercise: 'Cable Curl',     n: 4, type: 'Working Set', load: 32,   reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Pec Fly',        n: 1, type: 'Working Set', load: 17.5, reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Pec Fly',        n: 2, type: 'Working Set', load: 22.5, reps: 13, rir: 1, rpe:  9, notes: null },
      { exercise: 'Pec Fly',        n: 3, type: 'Working Set', load: 22.5, reps: 12, rir: 0, rpe: 10, notes: null },
      { exercise: 'Machine Crunch', n: 1, type: 'Working Set', load: 25,   reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Machine Crunch', n: 2, type: 'Working Set', load: 25,   reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Machine Crunch', n: 3, type: 'Working Set', load: 25,   reps:  8, rir: 0, rpe: 10, notes: null },
    ],
  },
  {
    date: '2026-04-18',
    sets: [
      { exercise: 'Seated Calf Raise', n: 1, type: 'Working Set', load:  40, reps: 13, rir: 3, rpe:  7, notes: null },
      { exercise: 'Seated Calf Raise', n: 2, type: 'Working Set', load:  50, reps: 12, rir: 2, rpe:  8, notes: null },
      { exercise: 'Seated Calf Raise', n: 3, type: 'Working Set', load:  50, reps: 15, rir: 1, rpe:  9, notes: null },
      { exercise: 'Hack Squat',        n: 1, type: 'Working Set', load:  50, reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Hack Squat',        n: 2, type: 'Working Set', load:  50, reps:  7, rir: 1, rpe:  9, notes: null },
      { exercise: 'Hack Squat',        n: 3, type: 'Working Set', load:  50, reps:  9, rir: 0, rpe: 10, notes: null },
      { exercise: 'Leg Press',         n: 1, type: 'Working Set', load: 100, reps:  7, rir: 4, rpe:  6, notes: null },
      { exercise: 'Leg Press',         n: 2, type: 'Working Set', load: 130, reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Leg Press',         n: 3, type: 'Working Set', load: 150, reps:  9, rir: 1, rpe:  9, notes: null },
      { exercise: 'Leg Press',         n: 4, type: 'Working Set', load: 150, reps:  8, rir: 0, rpe: 10, notes: null },
      { exercise: 'Leg Extension',     n: 1, type: 'Working Set', load:  50, reps: 15, rir: 2, rpe:  8, notes: null },
      { exercise: 'Leg Extension',     n: 2, type: 'Working Set', load:  50, reps: 15, rir: 1, rpe:  9, notes: null },
      { exercise: 'Leg Extension',     n: 3, type: 'Working Set', load:  50, reps: 13, rir: 1, rpe:  9, notes: null },
      { exercise: 'Lying Leg Curl',    n: 1, type: 'Working Set', load:  45, reps: 15, rir: 1, rpe:  9, notes: 'ainda estava sentindo dores na posterior do último treino' },
    ],
  },
  {
    date: '2026-04-20',
    sets: [
      { exercise: 'Bench Press',      n: 1, type: 'Warming Up',    load: 20,   reps: 15, rir: 3, rpe:  7, notes: null },
      { exercise: 'Bench Press',      n: 2, type: 'Feeder Set',    load: 40,   reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Bench Press',      n: 3, type: 'Top Set',       load: 50,   reps:  7, rir: 0, rpe: 10, notes: null },
      { exercise: 'Bench Press',      n: 4, type: 'Back-off Set',  load: 40,   reps: 10, rir: 0, rpe: 10, notes: null },
      { exercise: 'Seated Row',       n: 1, type: 'Warming Up',    load: 39,   reps: 10, rir: 3, rpe:  7, notes: null },
      { exercise: 'Seated Row',       n: 2, type: 'Feeder Set',    load: 59,   reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Seated Row',       n: 3, type: 'Working Set',   load: 59,   reps:  9, rir: 1, rpe:  9, notes: null },
      { exercise: 'Seated Row',       n: 4, type: 'Top Set',       load: 59,   reps:  8, rir: 0, rpe: 10, notes: null },
      { exercise: 'Triceps Pushdown', n: 1, type: 'Feeder Set',    load: 25,   reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Triceps Pushdown', n: 2, type: 'Working Set',   load: 25,   reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Triceps Pushdown', n: 3, type: 'Top Set',       load: 25,   reps: 10, rir: 0, rpe: 10, notes: null },
      { exercise: 'Face Pull',        n: 1, type: 'Feeder Set',    load: 22.5, reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Face Pull',        n: 2, type: 'Working Set',   load: 25,   reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Hammer Curl',      n: 1, type: 'Feeder Set',    load: 27.5, reps: 10, rir: 2, rpe:  8, notes: null },
      { exercise: 'Hammer Curl',      n: 2, type: 'Working Set',   load: 32.5, reps: 10, rir: 1, rpe:  9, notes: null },
      { exercise: 'Hammer Curl',      n: 3, type: 'Working Set',   load: 32.5, reps: 11, rir: 1, rpe:  9, notes: null },
      { exercise: 'Hammer Curl',      n: 4, type: 'Top Set',       load: 32.5, reps: 11, rir: 0, rpe: 10, notes: null },
    ],
  },
]

export interface MigrationResult {
  sessionsCreated: number
  sessionsSkipped: number
  setsCreated: number
  setsSkipped: number
  notFound: string[]
  errors: string[]
}

export async function migrateWorkoutCSVAction(): Promise<MigrationResult> {
  const result: MigrationResult = {
    sessionsCreated: 0,
    sessionsSkipped: 0,
    setsCreated: 0,
    setsSkipped: 0,
    notFound: [],
    errors: [],
  }

  // Build exercise name → id map (case-insensitive)
  const exercises = await prisma.exercise.findMany({ select: { id: true, name: true } })
  const exerciseMap = new Map<string, string>()
  for (const ex of exercises) exerciseMap.set(ex.name.toLowerCase(), ex.id)

  for (const session of CSV_SESSIONS) {
    const sessionDate = new Date(session.date)

    // Check if session for this date already exists
    const existing = await prisma.workoutSession.findFirst({ where: { date: sessionDate } })
    let sessionId: string

    if (existing) {
      result.sessionsSkipped++
      sessionId = existing.id
    } else {
      const created = await prisma.workoutSession.create({ data: { date: sessionDate } })
      result.sessionsCreated++
      sessionId = created.id
    }

    for (const set of session.sets) {
      const exerciseId = exerciseMap.get(set.exercise.toLowerCase())
      if (!exerciseId) {
        const key = `${set.exercise} (${session.date})`
        if (!result.notFound.includes(key)) result.notFound.push(key)
        continue
      }

      // Check if set already exists (unique: session_id + exercise_id + set_number)
      const existingSet = await prisma.workoutSet.findFirst({
        where: { session_id: sessionId, exercise_id: exerciseId, set_number: set.n },
      })
      if (existingSet) {
        result.setsSkipped++
        continue
      }

      try {
        await prisma.workoutSet.create({
          data: {
            session_id: sessionId,
            exercise_id: exerciseId,
            set_number: set.n,
            set_type: normaliseSetType(set.type),
            load_kg: set.load,
            reps: set.reps,
            rir: set.rir,
            rpe: set.rpe,
            notes: set.notes,
          },
        })
        result.setsCreated++
      } catch (e) {
        result.errors.push(`${session.date} / ${set.exercise} #${set.n}: ${e}`)
      }
    }
  }

  return result
}
