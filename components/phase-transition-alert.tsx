'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { evaluatePhaseTransition } from '@/lib/periodization'
import type { ProgressionStatus } from '@/lib/types'
import { AlertTriangle, Brain, Clock, Flame, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const TRIGGER_META = {
  MRV_REACHED: {
    icon: AlertTriangle,
    color: 'border-red-500/30 bg-red-500/10',
    textColor: 'text-red-300',
    iconColor: 'text-red-400',
    label: 'MRV Atingido',
  },
  NEURAL_PLATEAU: {
    icon: Brain,
    color: 'border-amber-400/30 bg-amber-400/10',
    textColor: 'text-amber-200',
    iconColor: 'text-amber-400',
    label: 'Plateau Neural',
  },
  TEMPORAL: {
    icon: Clock,
    color: 'border-sky-400/30 bg-sky-400/10',
    textColor: 'text-sky-200',
    iconColor: 'text-sky-400',
    label: 'Fase Completa',
  },
  PEAK_FATIGUE: {
    icon: Flame,
    color: 'border-orange-400/30 bg-orange-400/10',
    textColor: 'text-orange-200',
    iconColor: 'text-orange-400',
    label: 'Fadiga Máxima',
  },
}

export function PhaseTransitionAlert() {
  const { currentPhase, getWeeklyVolumeByMuscle, sessions, getExerciseProgressionStatus, exercises } = useWorkout()
  const [dismissed, setDismissed] = useState(false)

  const evaluation = useMemo(() => {
    const weeklyVolume = getWeeklyVolumeByMuscle()

    // Sample progression statuses from the first 3 exercises
    const recentStatuses: ProgressionStatus[] = exercises
      .slice(0, 3)
      .map((ex) => getExerciseProgressionStatus(ex.id))

    // Compute avg RPE from last 7 days of completed sets
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]
    const recentSets = sessions
      .filter((s) => s.date >= weekAgo && s.date <= today && s.status === 'completed')
      .flatMap((s) => s.exercises?.flatMap((ex) => ex.sets) ?? [])
      .filter((s) => s.rpe !== null)

    const avgRpe = recentSets.length
      ? recentSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / recentSets.length
      : 7

    const isHighFatigue = avgRpe >= 8.5

    return evaluatePhaseTransition({
      weeksInPhase: 1,
      maxWeeks: currentPhase.durationWeeks ?? 4,
      weeklyVolume,
      recentStatuses,
      avgRpe,
      isHighFatigue,
    })
  }, [currentPhase, getWeeklyVolumeByMuscle, sessions, getExerciseProgressionStatus, exercises])

  if (!evaluation.shouldTransition || !evaluation.trigger || dismissed) return null

  const meta = TRIGGER_META[evaluation.trigger]
  const Icon = meta.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className={cn('rounded-2xl border p-4', meta.color)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', meta.iconColor)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold mb-1', meta.textColor)}>
              {meta.label}
            </p>
            <p className={cn('text-xs leading-relaxed', meta.textColor, 'opacity-80')}>
              {evaluation.message}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
