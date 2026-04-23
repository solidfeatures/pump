'use client'

import { use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { WorkoutExerciseCard } from '@/components/workout-exercise-card'
import { AddExerciseModal } from '@/components/add-exercise-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { notFound } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { WorkoutControls } from '@/components/workout-controls'

const TIMER_KEY = (id: string) => `antigravity-timer-${id}`

function getStoredTimer(id: string): { startedAt: number; accumulated: number; paused: boolean } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TIMER_KEY(id))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveTimer(id: string, data: { startedAt: number; accumulated: number; paused: boolean }) {
  localStorage.setItem(TIMER_KEY(id), JSON.stringify(data))
}

function clearTimer(id: string) {
  localStorage.removeItem(TIMER_KEY(id))
}

export default function WorkoutPlayerPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const { getSessionById, startWorkout, pauseWorkout, resumeWorkout, completeWorkout } = useWorkout()
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const accumulatedRef = useRef(0)
  const startedAtRef = useRef<number | null>(null)

  const session = getSessionById(id)

  // Restore timer from localStorage on mount
  useEffect(() => {
    if (!session) return
    const stored = getStoredTimer(id)
    if (stored) {
      accumulatedRef.current = stored.accumulated
      if (!stored.paused && stored.startedAt) {
        const elapsed = Math.floor((Date.now() - stored.startedAt) / 1000)
        setElapsedTime(stored.accumulated + elapsed)
        startedAtRef.current = stored.startedAt
      } else {
        setElapsedTime(stored.accumulated)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const isCompleted = session?.status === 'completed'
  const isInProgress = session?.status === 'in-progress'
  const isPaused = session?.status === 'paused'

  // Run timer tick when in-progress
  useEffect(() => {
    if (isInProgress) {
      if (!startedAtRef.current) {
        startedAtRef.current = Date.now()
        saveTimer(id, { startedAt: startedAtRef.current, accumulated: accumulatedRef.current, paused: false })
      }
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000)
        setElapsedTime(accumulatedRef.current + elapsed)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isInProgress, id])

  if (!session) notFound()

  const totalSets = (session.exercises ?? []).reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = (session.exercises ?? []).reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
  )
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  const handleStart = () => {
    startWorkout(session.id)
    accumulatedRef.current = 0
    startedAtRef.current = Date.now()
    setElapsedTime(0)
    saveTimer(id, { startedAt: startedAtRef.current, accumulated: 0, paused: false })
  }

  const handlePause = () => {
    // Snapshot accumulated time
    if (startedAtRef.current) {
      accumulatedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
      startedAtRef.current = null
    }
    saveTimer(id, { startedAt: 0, accumulated: accumulatedRef.current, paused: true })
    setElapsedTime(accumulatedRef.current)
    pauseWorkout(session.id)
  }

  const handleResume = () => {
    startedAtRef.current = Date.now()
    saveTimer(id, { startedAt: startedAtRef.current, accumulated: accumulatedRef.current, paused: false })
    resumeWorkout(session.id)
  }

  const handleComplete = () => {
    if (startedAtRef.current) {
      accumulatedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
    }
    clearTimer(id)
    completeWorkout(session.id)
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 glass border-b border-white/5 shadow-2xl"
      >
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <BackButton fallback="/workout" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">{session.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {(session.exercises ?? []).length} exercícios · {totalSets} séries
                </p>
              </div>
            </div>

            {/* Timer + Controls */}
            <WorkoutControls
              status={session.status as any}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onComplete={handleComplete}
              elapsed={elapsedTime}
            />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
            <span>{completedSets} de {totalSets} séries concluídas</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Exercise List */}
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <AnimatePresence mode="popLayout">
          {(session.exercises ?? []).map((exercise, index) => (
            <motion.div
              key={exercise.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: index * 0.04 }}
            >
              <WorkoutExerciseCard
                sessionId={session.id}
                exercise={exercise}
                plannedSessionId={session.plannedSessionId ?? undefined}
                isActive={isInProgress || isPaused}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Exercise */}
        {!isCompleted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              variant="outline"
              onClick={() => setShowAddExercise(true)}
              className="w-full h-16 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 gap-2 rounded-2xl cursor-pointer"
            >
              <Plus className="w-5 h-5 text-primary" />
              <span className="font-semibold text-muted-foreground hover:text-foreground">Adicionar Exercício</span>
            </Button>
          </motion.div>
        )}
      </div>

      <AddExerciseModal
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        sessionId={session.id}
      />
    </div>
  )
}
