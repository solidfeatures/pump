'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { isWorkingSet, getProgressionStatus } from '@/lib/periodization'
import type { ExerciseProgressionSummary, ProgressionStatus } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'status' | 'lastOneRm' | 'weeklyVolumeSets' | 'lastRpe'

const STATUS_META: Record<ProgressionStatus, { icon: typeof TrendingUp; color: string; label: string }> = {
  'Progressão':      { icon: TrendingUp,   color: 'text-primary',           label: '↑' },
  'Regressão':       { icon: TrendingDown, color: 'text-red-400',            label: '↓' },
  'Estagnado':       { icon: Minus,        color: 'text-amber-400',          label: '↔' },
  'Primeira Sessão': { icon: Minus,        color: 'text-muted-foreground',   label: '—' },
}

export function ExerciseProgressionTable() {
  const { sessions, exercises } = useWorkout()
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortAsc, setSortAsc] = useState(false)

  const summaries = useMemo((): ExerciseProgressionSummary[] => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]

    return exercises.flatMap((exercise) => {
      const exerciseSessions = sessions
        .filter((s) => s.status === 'completed' && s.exercises?.some((ex) => ex.exerciseId === exercise.id))
        .sort((a, b) => a.date.localeCompare(b.date))

      if (exerciseSessions.length === 0) return []

      const getTonnage = (s: typeof sessions[0]) => {
        const ex = s.exercises?.find((e) => e.exerciseId === exercise.id)
        return (ex?.sets ?? [])
          .filter((set) => set.completed && isWorkingSet(set))
          .reduce((sum, set) => sum + (set.loadKg ?? 0) * (set.reps ?? 0), 0)
      }

      const getBestOneRm = (s: typeof sessions[0]) => {
        const ex = s.exercises?.find((e) => e.exerciseId === exercise.id)
        const sets = (ex?.sets ?? []).filter((set) => set.completed && set.oneRmEpley)
        if (!sets.length) return 0
        return Math.max(...sets.map((set) => set.oneRmEpley ?? 0))
      }

      const last = exerciseSessions[exerciseSessions.length - 1]
      const prev = exerciseSessions.length >= 2 ? exerciseSessions[exerciseSessions.length - 2] : null

      const lastTonnage = getTonnage(last)
      const prevTonnage = prev ? getTonnage(prev) : 0

      // Rolling 4-session average
      const last4 = exerciseSessions.slice(-4)
      const rollingAvg4s = last4.reduce((sum, s) => sum + getTonnage(s), 0) / last4.length

      // Last RPE (avg of working sets in last session)
      const lastEx = last.exercises?.find((e) => e.exerciseId === exercise.id)
      const rpeValues = (lastEx?.sets ?? [])
        .filter((s) => s.completed && isWorkingSet(s) && s.rpe !== null)
        .map((s) => s.rpe as number)
      const lastRpe = rpeValues.length ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null

      // Weekly volume sets
      const weeklyVolumeSets = sessions
        .filter((s) => s.status === 'completed' && s.date >= weekAgo && s.date <= today)
        .flatMap((s) => (s.exercises?.find((e) => e.exerciseId === exercise.id)?.sets ?? []))
        .filter((set) => set.completed && isWorkingSet(set))
        .length

      const bestOneRm = Math.max(...exerciseSessions.map(getBestOneRm))
      const lastOneRm = getBestOneRm(last)
      const status = getProgressionStatus(lastTonnage, prevTonnage)

      return [{
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        lastTonnage,
        prevTonnage,
        status,
        rollingAvg4s,
        lastRpe,
        weeklyVolumeSets,
        bestOneRm,
        lastOneRm,
      }]
    })
  }, [sessions, exercises])

  const sorted = useMemo(() => {
    const STATUS_ORDER: Record<ProgressionStatus, number> = {
      'Regressão': 0, 'Estagnado': 1, 'Progressão': 2, 'Primeira Sessão': 3,
    }
    return [...summaries].sort((a, b) => {
      let diff = 0
      if (sortKey === 'name') diff = a.exerciseName.localeCompare(b.exerciseName)
      else if (sortKey === 'status') diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      else if (sortKey === 'lastOneRm') diff = a.lastOneRm - b.lastOneRm
      else if (sortKey === 'weeklyVolumeSets') diff = a.weeklyVolumeSets - b.weeklyVolumeSets
      else if (sortKey === 'lastRpe') diff = (a.lastRpe ?? 0) - (b.lastRpe ?? 0)
      return sortAsc ? diff : -diff
    })
  }, [summaries, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  if (summaries.length === 0) {
    return (
      <GlassCard>
        <GlassCardTitle className="mb-4">Progressão por Exercício</GlassCardTitle>
        <p className="text-sm text-muted-foreground py-4">Complete treinos para ver os indicadores.</p>
      </GlassCard>
    )
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : null

  return (
    <GlassCard>
      <GlassCardTitle className="mb-4">Progressão por Exercício</GlassCardTitle>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-white/5">
              {([
                ['name',             'Exercício'],
                ['status',           'Status'],
                ['lastOneRm',        '1RM Est.'],
                ['weeklyVolumeSets', 'Séries/sem'],
                ['lastRpe',          'RPE médio'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="py-2 pr-4 text-left font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon k={key} />
                  </span>
                </th>
              ))}
              <th className="py-2 text-right font-medium">Tonelagem</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const meta = STATUS_META[s.status]
              const Icon = meta.icon
              const tonnageDiff = s.prevTonnage > 0 ? s.lastTonnage - s.prevTonnage : null
              return (
                <motion.tr
                  key={s.exerciseId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium truncate max-w-[160px]">{s.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Média 4s: {s.rollingAvg4s > 0 ? `${s.rollingAvg4s.toFixed(0)} kg` : '—'}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn('flex items-center gap-1 font-semibold', meta.color)}>
                      <Icon className="w-3.5 h-3.5" />
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold">{s.lastOneRm > 0 ? `${s.lastOneRm.toFixed(1)} kg` : '—'}</p>
                    {s.bestOneRm > s.lastOneRm && s.bestOneRm > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Recorde: {s.bestOneRm.toFixed(1)} kg
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <p className={cn(
                      'font-semibold',
                      s.weeklyVolumeSets >= 10 && s.weeklyVolumeSets < 20 ? 'text-primary' :
                      s.weeklyVolumeSets >= 20 ? 'text-red-400' :
                      'text-muted-foreground'
                    )}>
                      {s.weeklyVolumeSets}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className={cn(
                      'font-semibold',
                      s.lastRpe !== null && s.lastRpe >= 9 ? 'text-amber-400' : ''
                    )}>
                      {s.lastRpe !== null ? s.lastRpe.toFixed(1) : '—'}
                    </p>
                  </td>
                  <td className="py-3 text-right">
                    <p className="font-semibold">
                      {s.lastTonnage > 0 ? `${s.lastTonnage.toFixed(0)} kg` : '—'}
                    </p>
                    {tonnageDiff !== null && (
                      <p className={cn(
                        'text-xs',
                        tonnageDiff > 0 ? 'text-primary' :
                        tonnageDiff < 0 ? 'text-red-400' :
                        'text-muted-foreground'
                      )}>
                        {tonnageDiff > 0 ? '+' : ''}{tonnageDiff.toFixed(0)} kg
                      </p>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
