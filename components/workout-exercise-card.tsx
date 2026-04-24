'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/glass-card'
import { SetInput } from '@/components/set-input'
import { WorkoutExercise } from '@/lib/types'
import { muscleGroupLabels, muscleGroupColors } from '@/lib/mock-data'
import type { MuscleGroup } from '@/lib/types'
import { ChevronDown, ChevronUp, Info, Sparkles, Clock, Plus, Trash2, Youtube, ExternalLink, TrendingUp, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { cn, extractYouTubeId } from '@/lib/utils'
import { useWorkout } from '@/lib/workout-context'
import { TermTooltip } from '@/components/term-tooltip'
import { formatRestTime, getRestTimeRange } from '@/lib/periodization'
import { Button } from '@/components/ui/button'
import { getLastPerformanceAction } from '@/app/actions'
import { useEffect } from 'react'

interface WorkoutExerciseCardProps {
  sessionId: string
  exercise: WorkoutExercise
  plannedSessionId?: string
  isActive: boolean
}


export function WorkoutExerciseCard({
  sessionId,
  exercise,
  plannedSessionId,
  isActive,
}: WorkoutExerciseCardProps) {
  const { getPlannedExercise, addSet, removeExerciseFromSession } = useWorkout()
  const [isExpanded, setIsExpanded] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [previousPerformance, setPreviousPerformance] = useState<{ weight: number, reps: number, date: string } | null>(null)

  useEffect(() => {
    getLastPerformanceAction(exercise.exerciseId).then((data) => {
      if (data) setPreviousPerformance(data)
    })
  }, [exercise.exerciseId])

  const planned = plannedSessionId
    ? getPlannedExercise(plannedSessionId, exercise.exerciseId)
    : undefined

  const completedSets = exercise.sets.filter((s) => s.completed).length
  const totalSets     = exercise.sets.length
  const isComplete    = completedSets === totalSets && totalSets > 0

  const muscleGroup = (exercise.exercise?.muscles?.find(m => m.seriesFactor >= 1.0)?.muscleGroup ?? 'chest') as MuscleGroup

  const targetRepsMax   = planned?.repsMax ?? planned?.repsMin ?? undefined
  const targetRestRange = targetRepsMax ? getRestTimeRange(targetRepsMax) : undefined

  const videoUrl  = exercise.exercise.videoUrl
  const videoId   = extractYouTubeId(videoUrl)
  const hasVideo  = !!videoId

  const currentTonnage = exercise.sets.reduce((sum, s) => sum + ((s.loadKg || 0) * (s.reps || 0)), 0)

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-4 text-left"
        >
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0',
              isComplete ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
            )}
          >
            {completedSets}/{totalSets}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight truncate">{exercise.exercise.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full text-white/90',
                  muscleGroupColors[muscleGroup]
                )}
              >
                {muscleGroupLabels[muscleGroup]}
              </span>
              <span className="text-xs text-muted-foreground">
                {exercise.exercise.classification || 'Compound'}
              </span>
              {planned && (
                <span className="text-xs text-muted-foreground">
                  {planned.repsMin}–{planned.repsMax} reps · RIR {planned.targetRir}
                </span>
              )}
              {targetRestRange && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatRestTime(targetRestRange)}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}

          {/* YouTube video toggle */}
          {hasVideo && (
            <button
              onClick={() => setShowVideo((v) => !v)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                showVideo
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-400/10'
              )}
              title={showVideo ? 'Ocultar vídeo' : 'Ver vídeo do exercício'}
            >
              <Youtube className="w-4 h-4" />
            </button>
          )}

          {/* Remove exercise */}
          {isActive && !isComplete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => removeExerciseFromSession(sessionId, exercise.exerciseId)}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-400/10 hover:bg-rose-400/20 transition-colors"
                >
                  Remover
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                title="Remover exercício"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* YouTube video embed */}
      <AnimatePresence>
        {showVideo && videoId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title={`Vídeo: ${exercise.exercise.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-xl"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
                <span className="text-xs text-muted-foreground truncate">{exercise.exercise.name}</span>
                <a
                  href={videoUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir no YouTube
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary (Tonnage & Previous) */}
      <div className="flex items-center gap-3 mt-3 px-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tonelagem:</span>
          <span className="text-xs font-black text-white">{currentTonnage.toLocaleString()} kg</span>
        </div>

        {previousPerformance && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <RotateCcw className="w-3 h-3 text-[#00F0FF]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Anterior:</span>
            <span className="text-xs font-black text-white">{previousPerformance.weight}kg x {previousPerformance.reps}</span>
          </div>
        )}
      </div>

      {/* AI Feedback hint */}
      {planned?.aiFeedback && (
        <div className="flex items-start gap-2 mt-3 px-2 py-2 rounded-xl bg-primary/5 border border-primary/10">
          <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-primary/80 leading-relaxed">{planned.aiFeedback}</p>
        </div>
      )}

      {/* Technique cue */}
      {planned?.technique && (
        <div className="flex items-start gap-2 mt-2 px-2">
          <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{planned.technique}</p>
        </div>
      )}

      {/* Sets */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-4 pt-4 border-t border-white/5">
              {/* Column headers — 8 cols matching SetInput */}
              <div className="grid grid-cols-[auto_auto_1fr_1fr_1fr_1fr_auto_auto] gap-1.5 mb-2 px-2 text-[10px] text-muted-foreground">
                <div className="w-8 text-center">#</div>
                <div className="w-7 text-center" title="Categoria da série">Cat</div>
                <div className="text-center">Carga</div>
                <div className="text-center">Reps</div>
                <div className="text-center text-amber-400/70"><TermTooltip term="RPE" className="text-[10px] text-amber-400/70" /></div>
                <div className="text-center text-sky-400/70"><TermTooltip term="RIR" className="text-[10px] text-sky-400/70" /></div>
                <div className="w-7" />
                <div className="w-7" />
              </div>

              <div className="space-y-1">
                {exercise.sets.map((set) => (
                  <SetInput
                    key={set.id}
                    sessionId={sessionId}
                    exerciseId={exercise.exerciseId}
                    set={set}
                    isActive={isActive}
                    targetRepsMax={targetRepsMax}
                    canRemove={exercise.sets.length > 1 && isActive}
                  />
                ))}
              </div>

              {/* Add Set */}
              {isActive && !isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(sessionId, exercise.exerciseId)}
                  className="w-full mt-2 h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar série
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
