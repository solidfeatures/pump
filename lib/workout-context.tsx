'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import {
  WorkoutSession,
  WorkoutSet,
  WorkoutExercise,
  TrainingPhase,
  PlannedSession,
  PlannedExercise,
  Exercise,
  ExerciseMuscle,
  ProgressionData,
  PRRecord,
  MuscleGroup,
  ProgressionStatus,
} from './types'
import { calculateWeeklyVolumeByMuscle, getProgressionStatus } from './periodization'
import { saveSetAction, createSessionAction } from '@/app/actions'

// ─── helpers ─────────────────────────────────────────────────────────────────

function isoWeekMonday(baseDate: Date): Date {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function createSessionFromTemplate(
  plannedSession: PlannedSession,
  date: string,
  plannedExercises: PlannedExercise[],
  exercises: Exercise[],
): WorkoutSession {
  const sessionExercises = plannedExercises.filter(pe => pe.plannedSessionId === plannedSession.id)
  const workoutExercises: WorkoutExercise[] = sessionExercises.map(pe => {
    const exercise = exercises.find(e => e.id === pe.exerciseId)!
    return {
      id: `we-${pe.id}-${date}`,
      exerciseId: pe.exerciseId,
      exercise,
      sets: Array.from({ length: pe.setsCount }, (_, i) => ({
        id: `set-${pe.id}-${i}-${date}`,
        sessionId: `ws-${plannedSession.id}-${date}`,
        exerciseId: pe.exerciseId,
        setNumber: i + 1,
        setType: 'Working Set' as const,
        setTechnique: 'Normal' as const,
        loadKg: pe.suggestedLoadKg ?? 0,
        reps: 0,
        rpe: null,
        rir: null,
        notes: null,
        tonnage: null,
        oneRmEpley: null,
        createdAt: new Date(),
        completed: false,
      })),
    }
  })

  return {
    id: `ws-${plannedSession.id}-${date}`,
    date,
    notes: null,
    createdAt: new Date(),
    name: plannedSession.name ?? `Sessão ${plannedSession.sessionNumber}`,
    status: 'pending',
    exercises: workoutExercises,
    plannedSessionId: plannedSession.id,
  }
}

function generateUpcomingSessions(
  plannedSessions: PlannedSession[],
  plannedExercises: PlannedExercise[],
  exercises: Exercise[],
): WorkoutSession[] {
  if (!plannedSessions.length) return []
  const today = new Date()
  const sessions: WorkoutSession[] = []

  for (let weekOffset = 0; weekOffset <= 2; weekOffset++) {
    const base = new Date(today)
    base.setDate(today.getDate() + weekOffset * 7)
    const monday = isoWeekMonday(base)

    for (const session of plannedSessions) {
      const dow = session.dayOfWeek
      if (!dow) continue
      const d = new Date(monday)
      d.setDate(monday.getDate() + (dow - 1))
      const ds = dateStr(d)
      if (ds >= dateStr(today)) {
        sessions.push(createSessionFromTemplate(session, ds, plannedExercises, exercises))
      }
    }
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

// ─── context types ────────────────────────────────────────────────────────────

interface WorkoutContextType {
  sessions: WorkoutSession[]
  currentPhase: TrainingPhase | null
  plannedSessions: PlannedSession[]
  plannedExercises: PlannedExercise[]
  exercises: Exercise[]
  updateSet: (sessionId: string, exerciseId: string, setNumber: number, updates: Partial<WorkoutSet>) => void
  addSet: (sessionId: string, exerciseId: string) => void
  removeSet: (sessionId: string, exerciseId: string, setNumber: number) => void
  addExerciseToSession: (sessionId: string, exercise: Exercise, sets: number) => void
  removeExerciseFromSession: (sessionId: string, exerciseId: string) => void
  startWorkout: (sessionId: string) => void
  pauseWorkout: (sessionId: string) => void
  resumeWorkout: (sessionId: string) => void
  completeWorkout: (sessionId: string) => void
  getTodaysWorkout: () => WorkoutSession | undefined
  getSessionById: (id: string) => WorkoutSession | undefined
  getSessionByDate: (date: string) => WorkoutSession | undefined
  getSessionsInRange: (startDate: string, endDate: string) => WorkoutSession[]
  getProgressionData: (exerciseId: string) => ProgressionData[]
  getPRRecords: () => PRRecord[]
  getSessionName: (sessionId: string) => string
  getPlannedExercise: (plannedSessionId: string, exerciseId: string) => PlannedExercise | undefined
  getWeeklyVolumeByMuscle: () => Record<MuscleGroup, number>
  getPlannedVolumeByMuscle: () => Record<MuscleGroup, number>
  getExerciseProgressionStatus: (exerciseId: string) => ProgressionStatus
  mergeDbSession: (dbSession: WorkoutSession) => void
}

const WorkoutContext = createContext<WorkoutContextType | null>(null)

// ─── provider ────────────────────────────────────────────────────────────────

interface WorkoutProviderProps {
  children: ReactNode
  initialPhase?: TrainingPhase | null
  initialExercises?: Exercise[]
  initialPlannedSessions?: PlannedSession[]
  initialPlannedExercises?: PlannedExercise[]
  initialDbSessions?: WorkoutSession[]
}

export function WorkoutProvider({
  children,
  initialPhase,
  initialExercises,
  initialPlannedSessions,
  initialPlannedExercises,
  initialDbSessions,
}: WorkoutProviderProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const currentPhase      = initialPhase          ?? null
  const activeExercises   = initialExercises       ?? []
  const activePlanned     = initialPlannedSessions ?? []
  const activePlannedEx   = initialPlannedExercises ?? []

  useEffect(() => {
    // Start from real DB completed sessions only — no mock or localStorage data
    const base: WorkoutSession[] = initialDbSessions ? [...initialDbSessions] : []
    const completedDates = new Set(base.map(s => s.date))

    // Append upcoming sessions from real DB planned templates (no fake past data)
    const upcoming = generateUpcomingSessions(activePlanned, activePlannedEx, activeExercises)
    for (const s of upcoming) {
      if (!completedDates.has(s.date)) base.push(s)
    }

    setSessions(base.sort((a, b) => a.date.localeCompare(b.date)))
    setIsLoaded(true)
  }, [activePlanned, activePlannedEx, activeExercises, initialDbSessions]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── mutations ───────────────────────────────────────────────────────────────

  const updateSet = useCallback((
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    updates: Partial<WorkoutSet>,
  ) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map(set => {
                if (set.setNumber !== setNumber) return set
                const newRpe = updates.rpe ?? set.rpe
                const newRir = newRpe !== null ? 10 - newRpe : set.rir
                const loadKg = updates.loadKg ?? set.loadKg
                const reps = updates.reps ?? set.reps
                const tonnage = loadKg && reps ? loadKg * reps : null
                const oneRmEpley = loadKg && reps ? loadKg * (1 + reps / 30) : null
                return { ...set, ...updates, rir: newRir, tonnage, oneRmEpley, savedAt: new Date().toISOString() }
              }),
            }
          }),
        }
      })
    )

    const existing = sessions
      .find(s => s.id === sessionId)
      ?.exercises?.find(ex => ex.exerciseId === exerciseId)
      ?.sets.find(s => s.setNumber === setNumber)

    if (existing) {
      const finalLoadKg = updates.loadKg ?? existing.loadKg
      const finalReps = updates.reps ?? existing.reps
      if (finalLoadKg && finalReps) {
        saveSetAction({
          sessionId,
          exerciseId,
          setNumber,
          setType: (updates.setType ?? existing.setType) as string,
          setTechnique: (updates.setTechnique ?? existing.setTechnique) as string,
          loadKg: finalLoadKg,
          reps: finalReps,
          rpe: updates.rpe !== undefined ? updates.rpe : existing.rpe,
          notes: updates.notes !== undefined ? updates.notes : existing.notes,
        })
      }
    }
  }, [sessions])

  const addExerciseToSession = useCallback((sessionId: string, exercise: Exercise, sets: number) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session
        const newExercise: WorkoutExercise = {
          id: `we-new-${Date.now()}`,
          exerciseId: exercise.id,
          exercise,
          sets: Array.from({ length: sets }, (_, i) => ({
            id: `set-new-${Date.now()}-${i}`,
            sessionId,
            exerciseId: exercise.id,
            setNumber: i + 1,
            setType: 'Working Set' as const,
            setTechnique: 'Normal' as const,
            loadKg: 0,
            reps: 0,
            rpe: null,
            rir: null,
            notes: null,
            tonnage: null,
            oneRmEpley: null,
            createdAt: new Date(),
            completed: false,
          })),
        }
        return { ...session, exercises: [...(session.exercises || []), newExercise] }
      })
    )
  }, [])

  const startWorkout = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => s.id !== sessionId ? s : { ...s, status: 'in-progress' }))
    const session = sessions.find(s => s.id === sessionId)
    if (session) createSessionAction(session.date)
  }, [sessions])

  const addSet = useCallback((sessionId: string, exerciseId: string) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex
            const nextNum = ex.sets.length + 1
            const last = ex.sets[ex.sets.length - 1]
            const newSet: WorkoutSet = {
              id: `set-new-${Date.now()}-${nextNum}`,
              sessionId,
              exerciseId,
              setNumber: nextNum,
              setType: 'Working Set',
              setTechnique: 'Normal',
              loadKg: last?.loadKg ?? 0,
              reps: last?.reps ?? 0,
              rpe: null,
              rir: null,
              notes: null,
              tonnage: null,
              oneRmEpley: null,
              createdAt: new Date(),
              completed: false,
            }
            return { ...ex, sets: [...ex.sets, newSet] }
          }),
        }
      })
    )
  }, [])

  const removeSet = useCallback((sessionId: string, exerciseId: string, setNumber: number) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex
            const filtered = ex.sets.filter(s => s.setNumber !== setNumber)
            return { ...ex, sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })) }
          }),
        }
      })
    )
  }, [])

  const removeExerciseFromSession = useCallback((sessionId: string, exerciseId: string) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session
        return { ...session, exercises: (session.exercises ?? []).filter(ex => ex.exerciseId !== exerciseId) }
      })
    )
  }, [])

  const pauseWorkout = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => s.id !== sessionId ? s : { ...s, status: 'paused' as const }))
  }, [])

  const resumeWorkout = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => s.id !== sessionId ? s : { ...s, status: 'in-progress' as const }))
  }, [])

  const completeWorkout = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          status: 'completed',
          exercises: s.exercises?.map(ex => ({
            ...ex,
            sets: ex.sets.map(set => ({ ...set, completed: true })),
          })),
        }
      })
    )
  }, [])

  // ── queries ─────────────────────────────────────────────────────────────────

  const getTodaysWorkout  = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return sessions.find(s => s.date === today)
  }, [sessions])

  const getSessionById    = useCallback((id: string) => sessions.find(s => s.id === id), [sessions])
  const getSessionByDate  = useCallback((date: string) => sessions.find(s => s.date === date), [sessions])
  const getSessionsInRange = useCallback(
    (startDate: string, endDate: string) => sessions.filter(s => s.date >= startDate && s.date <= endDate),
    [sessions],
  )

  const getProgressionData = useCallback((exerciseId: string): ProgressionData[] => {
    const exercise = activeExercises.find(e => e.id === exerciseId)
    if (!exercise) return []

    return sessions
      .filter(s => s.status === 'completed' && s.exercises?.some(ex => ex.exerciseId === exerciseId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => {
        const ex = s.exercises?.find(e => e.exerciseId === exerciseId)
        const completedSets = ex?.sets.filter(set => set.completed && set.loadKg && set.reps) ?? []
        if (!completedSets.length) return null
        const best = completedSets.reduce((max, set) => (set.oneRmEpley ?? 0) > (max.oneRmEpley ?? 0) ? set : max, completedSets[0])
        return {
          date: s.date,
          weight: best.loadKg ?? 0,
          reps: best.reps ?? 0,
          volume: completedSets.reduce((sum, set) => sum + (set.loadKg ?? 0) * (set.reps ?? 0), 0),
          oneRm: best.oneRmEpley ?? 0,
          exerciseId,
          exerciseName: exercise.name,
        } satisfies ProgressionData
      })
      .filter((d): d is ProgressionData => d !== null)
  }, [sessions, activeExercises])

  const getPRRecords = useCallback((): PRRecord[] => {
    const bestByExercise = new Map<string, { loadKg: number; reps: number; oneRm: number; date: string }>()
    for (const session of sessions.filter(s => s.status === 'completed')) {
      for (const ex of session.exercises ?? []) {
        for (const set of ex.sets) {
          if (!set.completed || !set.loadKg || !set.reps || !set.oneRmEpley) continue
          const existing = bestByExercise.get(ex.exerciseId)
          if (!existing || (set.oneRmEpley ?? 0) > existing.oneRm) {
            bestByExercise.set(ex.exerciseId, { loadKg: set.loadKg, reps: set.reps, oneRm: set.oneRmEpley ?? 0, date: session.date })
          }
        }
      }
    }
    return Array.from(bestByExercise.entries())
      .map(([exerciseId, best]) => {
        const exercise = activeExercises.find(e => e.id === exerciseId)
        if (!exercise) return null
        return { exerciseId, exerciseName: exercise.name, weight: best.loadKg, reps: best.reps, oneRm: best.oneRm, date: best.date }
      })
      .filter((r): r is PRRecord => r !== null)
      .sort((a, b) => b.oneRm - a.oneRm)
      .slice(0, 10)
  }, [sessions, activeExercises])

  const getSessionName = useCallback((_sessionId: string) => 'Treino', [])

  const getPlannedExercise = useCallback(
    (plannedSessionId: string, exerciseId: string) =>
      activePlannedEx.find(pe => pe.plannedSessionId === plannedSessionId && pe.exerciseId === exerciseId),
    [activePlannedEx],
  )

  const getWeeklyVolumeByMuscle = useCallback((): Record<MuscleGroup, number> => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const startDate = weekAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    const weeklySets = sessions
      .filter(s => s.date >= startDate && s.date <= endDate && s.status === 'completed')
      .flatMap(s => s.exercises?.flatMap(ex => ex.sets) ?? [])

    const muscleMap: Record<string, ExerciseMuscle[]> = {}
    for (const e of activeExercises) {
      if (e.muscles?.length) muscleMap[e.id] = e.muscles
    }

    return calculateWeeklyVolumeByMuscle(weeklySets, muscleMap)
  }, [sessions, activeExercises])

  const getPlannedVolumeByMuscle = useCallback((): Record<MuscleGroup, number> => {
    const result: Partial<Record<MuscleGroup, number>> = {}
    for (const pe of activePlannedEx) {
      const exercise = activeExercises.find(e => e.id === pe.exerciseId)
      if (!exercise?.muscles) continue
      for (const m of exercise.muscles) {
        const g = m.muscleGroup as MuscleGroup
        result[g] = (result[g] ?? 0) + pe.setsCount * m.seriesFactor
      }
    }
    return result as Record<MuscleGroup, number>
  }, [activePlannedEx, activeExercises])

  const mergeDbSession = useCallback((dbSession: WorkoutSession) => {
    setSessions(prev => prev.map(s => {
      if (s.date !== dbSession.date) return s
      const countCompleted = (ws: WorkoutSession) =>
        ws.exercises?.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0) ?? 0
      if (countCompleted(dbSession) > countCompleted(s)) {
        const status = (s.status === 'in-progress' || s.status === 'paused') ? s.status : dbSession.status
        return { ...dbSession, id: s.id, plannedSessionId: s.plannedSessionId, name: s.name, status }
      }
      return s
    }))
  }, [])

  const getExerciseProgressionStatus = useCallback((exerciseId: string): ProgressionStatus => {
    const relevant = sessions
      .filter(s => s.status === 'completed' && s.exercises?.some(ex => ex.exerciseId === exerciseId))
      .sort((a, b) => a.date.localeCompare(b.date))

    if (relevant.length < 2) return 'Primeira Sessão'

    const getTonnage = (s: WorkoutSession) =>
      s.exercises?.find(e => e.exerciseId === exerciseId)
        ?.sets.reduce((sum, set) => sum + (set.loadKg ?? 0) * (set.reps ?? 0), 0) ?? 0

    return getProgressionStatus(
      getTonnage(relevant[relevant.length - 1]),
      getTonnage(relevant[relevant.length - 2]),
    )
  }, [sessions])

  if (!isLoaded) return null

  return (
    <WorkoutContext.Provider
      value={{
        sessions,
        currentPhase,
        plannedSessions: activePlanned,
        plannedExercises: activePlannedEx,
        exercises: activeExercises,
        updateSet, addSet, removeSet,
        addExerciseToSession, removeExerciseFromSession,
        startWorkout, pauseWorkout, resumeWorkout, completeWorkout,
        getTodaysWorkout, getSessionById, getSessionByDate, getSessionsInRange,
        getProgressionData, getPRRecords,
        getSessionName, getPlannedExercise,
        getWeeklyVolumeByMuscle, getPlannedVolumeByMuscle,
        getExerciseProgressionStatus, mergeDbSession,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider')
  return context
}
