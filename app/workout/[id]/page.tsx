'use client'

import { use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { WorkoutExerciseCard } from '@/components/workout-exercise-card'
import { AddExerciseModal } from '@/components/add-exercise-modal'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Dumbbell, Flag, Pause, Play, Plus, Square } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { notFound } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
    <div className="min-h-screen">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 glass border-b border-white/5"
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
            <div className="flex items-center gap-2">
              {(isInProgress || isPaused) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-sm">
                  <Clock className={`w-4 h-4 ${isPaused ? 'text-muted-foreground' : 'text-primary'}`} />
                  <span className={`font-mono tabular-nums ${isPaused ? 'text-muted-foreground' : ''}`}>
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              )}

              {isInProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePause}
                  title="Pausar treino"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              )}

              {isPaused && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResume}
                  title="Retomar treino"
                  className="w-9 h-9 rounded-full bg-primary/20 hover:bg-primary/30 text-primary"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluído · {formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedSets} de {totalSets} séries</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Start CTA */}
      {!isInProgress && !isPaused && !isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-6"
        >
          <div className="glass rounded-2xl p-6 text-center glow-emerald">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Pronto para treinar?</h2>
            <p className="text-muted-foreground mb-6">
              Inicie o treino para começar a registrar suas séries e progressão.
            </p>
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Clock className="w-5 h-5" />
              Iniciar Treino
            </Button>
          </div>
        </motion.div>
      )}

      {/* Exercise List */}
      <div className="p-4 md:p-6 space-y-4">
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
                isActive={isInProgress || isPaused || isCompleted}
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
              className="w-full h-14 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Exercício
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── Finish button — always shown when session active ── */}
      {(isInProgress || isPaused) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-20 md:bottom-6 px-4 md:px-6 pb-4"
        >
          <button
            onClick={handleComplete}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base font-semibold
              bg-gradient-to-r from-emerald-500 to-green-400 text-black
              hover:from-emerald-400 hover:to-green-300
              active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25"
          >
            <Flag className="w-5 h-5" />
            Finalizar Treino
            {progress > 0 && (
              <span className="ml-1 text-sm font-normal opacity-70">
                · {completedSets}/{totalSets} séries
              </span>
            )}
          </button>
        </motion.div>
      )}

      <AddExerciseModal
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        sessionId={session.id}
      />
    </div>
  )
}
