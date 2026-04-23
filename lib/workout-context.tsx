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
  ProgressionData,
  PRRecord,
  MuscleGroup,
  ProgressionStatus,
} from './types'
import {
  exercises as mockExercises,
  exerciseMuscles,
  currentPhase as mockCurrentPhase,
  plannedSessions,
  plannedExercises,
  sessionNames,
  sessionDayMapping,
  getWeekDates,
  generateProgressionData,
  generatePRRecords,
  getExercisePrimaryMuscle,
  buildExerciseMuscleMap,
} from './mock-data'
import {
  calculateWeeklyVolumeByMuscle,
  getProgressionStatus,
} from './periodization'
import { saveSetAction, createSessionAction } from '@/app/actions'

interface WorkoutContextType {
  sessions: WorkoutSession[]
  currentPhase: TrainingPhase
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
  getExerciseProgressionStatus: (exerciseId: string) => ProgressionStatus
}

const WorkoutContext = createContext<WorkoutContextType | null>(null)

function createWorkoutSessionFromPlan(
  plannedSession: PlannedSession,
  date: string,
  plannedExercises: PlannedExercise[],
  exercises: Exercise[],
  pastData = false
): WorkoutSession {
  const sessionExercises = plannedExercises.filter(
    (pe) => pe.plannedSessionId === plannedSession.id
  )

  const workoutExercises: WorkoutExercise[] = sessionExercises.map((pe) => {
    const exercise = exercises.find((e) => e.id === pe.exerciseId)!
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
        loadKg: pastData
          ? (pe.suggestedLoadKg || 50) + Math.round(Math.random() * 10 - 5)
          : (pe.suggestedLoadKg || 0),
        reps: pastData ? (pe.repsMin || 8) + Math.floor(Math.random() * 3) : 0,
        rpe: pastData ? (pe.targetRpe || 7) + Math.random() - 0.5 : null,
        rir: pastData ? (pe.targetRir || 3) : null,
        notes: null,
        tonnage: null,
        oneRmEpley: null,
        createdAt: new Date(),
        completed: pastData,
      })),
    }
  })

  const today = new Date().toISOString().split('T')[0]

  return {
    id: `ws-${plannedSession.id}-${date}`,
    date,
    notes: null,
    createdAt: new Date(),
    name: sessionNames[plannedSession.id] || `Sessão ${plannedSession.sessionNumber}`,
    status: pastData ? 'completed' : date <= today ? 'pending' : 'pending',
    exercises: workoutExercises,
    plannedSessionId: plannedSession.id,
  }
}

function generateInitialSessions(
  plannedSessions: PlannedSession[],
  plannedExercises: PlannedExercise[],
  exercises: Exercise[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = []
  const today = new Date()

  for (let weekOffset = -4; weekOffset <= 2; weekOffset++) {
    const base = new Date(today)
    base.setDate(today.getDate() + weekOffset * 7)
    const weekDates = getWeekDates(base)

    plannedSessions.forEach((session) => {
      // Find the day of week index (1-7)
      const dayOfWeek = session.dayOfWeek
      if (!dayOfWeek) return

      const dayIndex = dayOfWeek - 1
      if (dayIndex >= 0 && dayIndex < weekDates.length) {
        const date = weekDates[dayIndex]
        const isPast = date < today.toISOString().split('T')[0]
        sessions.push(createWorkoutSessionFromPlan(session, date, plannedExercises, exercises, isPast))
      }
    })
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

interface WorkoutProviderProps {
  children: ReactNode
  initialPhase?: TrainingPhase | null
  initialExercises?: Exercise[]
  initialPlannedSessions?: PlannedSession[]
  initialPlannedExercises?: PlannedExercise[]
}

export function WorkoutProvider({ 
  children, 
  initialPhase, 
  initialExercises,
  initialPlannedSessions,
  initialPlannedExercises
}: WorkoutProviderProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  console.log('[WorkoutProvider] Props:', { 
    initialPhase: initialPhase?.name,
    initialExercises: initialExercises?.length,
    initialPlannedSessions: initialPlannedSessions?.length,
    initialPlannedExercises: initialPlannedExercises?.length
  })

  const activePhase = initialPhase ?? mockCurrentPhase
  const activeExercises = initialExercises?.length ? initialExercises : mockExercises
  const activePlannedSessions = initialPlannedSessions?.length ? initialPlannedSessions : plannedSessions
  const activePlannedExercises = initialPlannedExercises?.length ? initialPlannedExercises : plannedExercises

  useEffect(() => {
    const stored = localStorage.getItem('antigravity-sessions-v2')
    if (stored) {
      try {
        setSessions(JSON.parse(stored))
      } catch {
        setSessions(generateInitialSessions(activePlannedSessions, activePlannedExercises, activeExercises))
      }
    } else {
      console.log('[WorkoutProvider] No localStorage data, generating initial sessions')
      const generated = generateInitialSessions(activePlannedSessions, activePlannedExercises, activeExercises)
      console.log(`[WorkoutProvider] Generated ${generated.length} sessions`)
      setSessions(generated)
    }
    setIsLoaded(true)
  }, [activePlannedSessions, activePlannedExercises, activeExercises])

  useEffect(() => {
    if (isLoaded && sessions.length > 0) {
      localStorage.setItem('antigravity-sessions-v2', JSON.stringify(sessions))
    }
  }, [sessions, isLoaded])

  const updateSet = useCallback((
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    updates: Partial<WorkoutSet>
  ) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((set) => {
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

    // Persist to Supabase (fire-and-forget — localStorage is the source of truth until DB is live)
    const existing = sessions
      .find((s) => s.id === sessionId)
      ?.exercises?.find((ex) => ex.exerciseId === exerciseId)
      ?.sets.find((s) => s.setNumber === setNumber)

    if (existing && updates.loadKg && updates.reps) {
      saveSetAction({
        sessionId,
        exerciseId,
        setNumber,
        setType: existing.setType,
        setTechnique: existing.setTechnique,
        loadKg: updates.loadKg,
        reps: updates.reps,
        rpe: updates.rpe ?? existing.rpe,
      })
    }
  }, [sessions])

  const addExerciseToSession = useCallback((sessionId: string, exercise: Exercise, sets: number) => {
    setSessions((prev) =>
      prev.map((session) => {
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
    setSessions((prev) =>
      prev.map((s) => (s.id !== sessionId ? s : { ...s, status: 'in-progress' }))
    )
    // Create a real session in DB
    const session = sessions.find((s) => s.id === sessionId)
    if (session) createSessionAction(session.date)
  }, [sessions])

  const addSet = useCallback((sessionId: string, exerciseId: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            const nextNum = ex.sets.length + 1
            const newSet: WorkoutSet = {
              id: `set-new-${Date.now()}-${nextNum}`,
              sessionId,
              exerciseId,
              setNumber: nextNum,
              setType: 'Working Set',
              setTechnique: 'Normal',
              loadKg: ex.sets[ex.sets.length - 1]?.loadKg ?? 0,
              reps: ex.sets[ex.sets.length - 1]?.reps ?? 0,
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
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: session.exercises?.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            const filtered = ex.sets.filter((s) => s.setNumber !== setNumber)
            // Renumber remaining sets
            const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }))
            return { ...ex, sets: renumbered }
          }),
        }
      })
    )
  }, [])

  const removeExerciseFromSession = useCallback((sessionId: string, exerciseId: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          exercises: (session.exercises ?? []).filter((ex) => ex.exerciseId !== exerciseId),
        }
      })
    )
  }, [])

  const pauseWorkout = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id !== sessionId ? s : { ...s, status: 'paused' as const }))
    )
  }, [])

  const resumeWorkout = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id !== sessionId ? s : { ...s, status: 'in-progress' as const }))
    )
  }, [])

  const completeWorkout = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          status: 'completed',
          exercises: s.exercises?.map((ex) => ({
            ...ex,
            sets: ex.sets.map((set) => ({ ...set, completed: true })),
          })),
        }
      })
    )
  }, [])

  const getTodaysWorkout = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return sessions.find((s) => s.date === today)
  }, [sessions])

  const getSessionById = useCallback((id: string) => sessions.find((s) => s.id === id), [sessions])
  const getSessionByDate = useCallback((date: string) => sessions.find((s) => s.date === date), [sessions])
  const getSessionsInRange = useCallback(
    (startDate: string, endDate: string) =>
      sessions.filter((s) => s.date >= startDate && s.date <= endDate),
    [sessions]
  )
  const getProgressionData = useCallback(
    (exerciseId: string): ProgressionData[] => {
      const exercise = activeExercises.find((e) => e.id === exerciseId)
      if (!exercise) return []

      const sessionData: ProgressionData[] = sessions
        .filter((s) => s.status === 'completed' && s.exercises?.some((ex) => ex.exerciseId === exerciseId))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => {
          const ex = s.exercises?.find((e) => e.exerciseId === exerciseId)
          const completedSets = ex?.sets.filter((set) => set.completed && set.loadKg && set.reps) ?? []
          if (completedSets.length === 0) return null
          const best = completedSets.reduce((max, set) =>
            (set.oneRmEpley ?? 0) > (max.oneRmEpley ?? 0) ? set : max
          , completedSets[0])
          const totalTonnage = completedSets.reduce((sum, set) => sum + ((set.loadKg ?? 0) * (set.reps ?? 0)), 0)
          return {
            date: s.date,
            weight: best.loadKg ?? 0,
            reps: best.reps ?? 0,
            volume: totalTonnage,
            oneRm: best.oneRmEpley ?? 0,
            exerciseId,
            exerciseName: exercise.name,
          } satisfies ProgressionData
        })
        .filter((d): d is ProgressionData => d !== null)

      // Fall back to mock data if no real sessions yet
      if (sessionData.length < 2) return generateProgressionData(exerciseId, 8)
      return sessionData
    },
    [sessions, activeExercises]
  )

  const getPRRecords = useCallback((): PRRecord[] => {
    const mainExerciseIds = ['1', '4', '7', '14', '15']
    return mainExerciseIds.flatMap((id) => {
      const exercise = activeExercises.find((e) => e.id === id)
      if (!exercise) return []
      const data = sessions
        .filter((s) => s.status === 'completed')
        .flatMap((s) =>
          (s.exercises?.find((ex) => ex.exerciseId === id)?.sets ?? [])
            .filter((set) => set.completed && set.loadKg && set.reps && set.oneRmEpley)
            .map((set) => ({ ...set, date: s.date }))
        )
      if (data.length === 0) {
        // Fall back to mock
        const mock = generateProgressionData(id, 4)
        if (!mock.length) return []
        const best = mock.reduce((max, cur) => cur.oneRm > max.oneRm ? cur : max, mock[0])
        return [{ exerciseId: id, exerciseName: exercise.name, weight: best.weight, reps: best.reps, oneRm: best.oneRm, date: best.date }]
      }
      const best = data.reduce((max, cur) => (cur.oneRmEpley ?? 0) > (max.oneRmEpley ?? 0) ? cur : max, data[0])
      return [{ exerciseId: id, exerciseName: exercise.name, weight: best.loadKg ?? 0, reps: best.reps ?? 0, oneRm: best.oneRmEpley ?? 0, date: best.date }]
    })
  }, [sessions, activeExercises])

  const getSessionName = useCallback((sessionId: string) => {
    const match = sessionId.match(/ws-(session-[a-z\-]+)-/)
    if (match) return sessionNames[match[1]] || 'Treino'
    return 'Treino'
  }, [])

  const getPlannedExercise = useCallback(
    (plannedSessionId: string, exerciseId: string) =>
      activePlannedExercises.find(
        (pe) => pe.plannedSessionId === plannedSessionId && pe.exerciseId === exerciseId
      ),
    [activePlannedExercises]
  )

  const getWeeklyVolumeByMuscle = useCallback((): Record<MuscleGroup, number> => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const startDate = weekAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    const weeklySets = sessions
      .filter((s) => s.date >= startDate && s.date <= endDate && s.status === 'completed')
      .flatMap((s) => s.exercises?.flatMap((ex) => ex.sets) ?? [])

    const muscleMap = buildExerciseMuscleMap()
    return calculateWeeklyVolumeByMuscle(weeklySets, muscleMap)
  }, [sessions])

  const getExerciseProgressionStatus = useCallback(
    (exerciseId: string): ProgressionStatus => {
      const data = generateProgressionData(exerciseId, 2)
      if (data.length < 2) return 'Primeira Sessão'
      return getProgressionStatus(data[data.length - 1].volume, data[data.length - 2].volume)
    },
    []
  )

  if (!isLoaded) return null

  return (
    <WorkoutContext.Provider
      value={{
        sessions,
        currentPhase: activePhase,
        plannedSessions: activePlannedSessions,
        plannedExercises: activePlannedExercises,
        exercises: activeExercises,
        updateSet,
        addSet,
        removeSet,
        addExerciseToSession,
        removeExerciseFromSession,
        startWorkout,
        pauseWorkout,
        resumeWorkout,
        completeWorkout,
        getTodaysWorkout,
        getSessionById,
        getSessionByDate,
        getSessionsInRange,
        getProgressionData,
        getPRRecords,
        getSessionName,
        getPlannedExercise,
        getWeeklyVolumeByMuscle,
        getExerciseProgressionStatus,
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
