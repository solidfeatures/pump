'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { useWorkout } from '@/lib/workout-context'
import { muscleGroupLabels } from '@/lib/mock-data'
import { MRV_THRESHOLD, MEV_THRESHOLD } from '@/lib/periodization'
import type { MuscleGroup } from '@/lib/types'
import { AlertTriangle, TrendingUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'quadriceps', 'hamstrings',
  'glutes', 'biceps', 'triceps', 'calves', 'core', 'forearms',
]

export function MuscleVolumePanel() {
  const { getWeeklyVolumeByMuscle } = useWorkout()

  const volumeData = useMemo(() => getWeeklyVolumeByMuscle(), [getWeeklyVolumeByMuscle])

  const rows = MUSCLE_ORDER.map((muscle) => {
    const sets = volumeData[muscle] ?? 0
    const pct = Math.min((sets / MRV_THRESHOLD) * 100, 100)
    const isAboveMrv = sets >= MRV_THRESHOLD
    const isBelowMev = sets < MEV_THRESHOLD && sets > 0
    const isEmpty = sets === 0
    return { muscle, sets, pct, isAboveMrv, isBelowMev, isEmpty }
  }).filter((r) => !r.isEmpty)

  const mrvWarnings = rows.filter((r) => r.isAboveMrv)

  return (
    <GlassCard delay={0.25}>
      <div className="flex items-center justify-between mb-4">
        <GlassCardTitle>Volume por Músculo</GlassCardTitle>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>MEV 10 · MRV 20 séries/sem</span>
        </div>
      </div>

      {mrvWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            MRV atingido: {mrvWarnings.map((r) => muscleGroupLabels[r.muscle]).join(', ')}.
            Considere Deload ou reduzir volume.
          </p>
        </motion.div>
      )}

      {rows.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <p className="text-sm">Nenhuma série efetiva registrada esta semana.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ muscle, sets, pct, isAboveMrv, isBelowMev }, i) => (
            <motion.div
              key={muscle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{muscleGroupLabels[muscle]}</span>
                <div className="flex items-center gap-2">
                  {isBelowMev && (
                    <span className="text-xs text-amber-400/70">abaixo MEV</span>
                  )}
                  {isAboveMrv && (
                    <span className="text-xs text-red-400 font-medium">MRV!</span>
                  )}
                  <span className={cn(
                    'text-xs font-semibold tabular-nums',
                    isAboveMrv ? 'text-red-400' : sets >= 10 ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {sets.toFixed(1)} séries
                  </span>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isAboveMrv
                      ? 'bg-red-400'
                      : sets >= MEV_THRESHOLD
                      ? 'bg-gradient-to-r from-primary to-emerald-400'
                      : 'bg-white/30'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.04 }}
                />
              </div>
            </motion.div>
          ))}

          {/* MEV / MRV legend */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-white/30" /> Abaixo MEV
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" /> Ótimo (10–20)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> MRV ≥ 20
              </span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
