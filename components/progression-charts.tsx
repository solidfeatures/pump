'use client'

import { useState, useMemo, useEffect } from 'react'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, parseISO, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type ChartType = 'weight' | 'volume' | 'oneRm'

export function ProgressionCharts() {
  const { exercises, sessions, getProgressionData } = useWorkout()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [chartType, setChartType] = useState<ChartType>('weight')

  // Exercises that are both in the current plan AND recently executed (last 8 weeks)
  const relevantExercises = useMemo(() => {
    const now = new Date()
    const eightWeeksAgoStr = subWeeks(now, 8).toISOString().split('T')[0]
    const todayStr = now.toISOString().split('T')[0]
    const fourWeeksAheadStr = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const recentlyExecuted = new Set<string>()
    sessions
      .filter(s => s.status === 'completed' && s.date >= eightWeeksAgoStr)
      .forEach(s => s.exercises?.forEach(ex => recentlyExecuted.add(ex.exerciseId)))

    const inCurrentPlan = new Set<string>()
    sessions
      .filter(s => s.status !== 'completed' && s.date >= todayStr && s.date <= fourWeeksAheadStr)
      .forEach(s => s.exercises?.forEach(ex => inCurrentPlan.add(ex.exerciseId)))

    // Prefer intersection; fall back to all recently executed
    const intersection = [...recentlyExecuted].filter(id => inCurrentPlan.has(id))
    const candidateIds = intersection.length > 0 ? intersection : [...recentlyExecuted]

    return candidateIds
      .map(id => exercises.find(e => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .slice(0, 10)
  }, [exercises, sessions])

  useEffect(() => {
    if (!selectedExercise && relevantExercises.length > 0) {
      setSelectedExercise(relevantExercises[0].id)
    }
  }, [relevantExercises, selectedExercise])

  const progressionData = useMemo(
    () => (selectedExercise ? getProgressionData(selectedExercise) : []),
    [selectedExercise, getProgressionData]
  )

  const trend = useMemo(() => {
    if (progressionData.length < 2) return { direction: 'neutral' as const, percentage: '0' }
    const recent = progressionData.slice(-3)
    const older = progressionData.slice(0, 3)
    const recentAvg = recent.reduce((s, d) => s + d.weight, 0) / recent.length
    const olderAvg = older.reduce((s, d) => s + d.weight, 0) / older.length
    if (olderAvg === 0) return { direction: 'neutral' as const, percentage: '0' }
    const pct = ((recentAvg - olderAvg) / olderAvg) * 100
    return {
      direction: (pct > 2 ? 'up' : pct < -2 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
      percentage: Math.abs(pct).toFixed(1),
    }
  }, [progressionData])

  const exerciseName = exercises.find(e => e.id === selectedExercise)?.name ?? ''

  if (relevantExercises.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Complete alguns treinos para visualizar sua progressão.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Exercise tags */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
          Exercícios do plano atual
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {relevantExercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex.id)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                selectedExercise === ex.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart card */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <GlassCardTitle>
              {chartType === 'weight' && 'Progressão de Carga'}
              {chartType === 'volume' && 'Volume Total'}
              {chartType === 'oneRm' && '1RM Estimado (Epley)'}
            </GlassCardTitle>
            <div className="flex items-center gap-1.5 mt-1">
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5 text-primary" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {trend.direction === 'up' && `+${trend.percentage}% progresso`}
                {trend.direction === 'down' && `-${trend.percentage}% redução`}
                {trend.direction === 'neutral' && 'Estável'}
                {' · '}últimas 8 semanas
              </span>
            </div>
          </div>
          <div className="flex items-center bg-white/5 rounded-lg p-1 shrink-0">
            {([
              { key: 'weight' as ChartType, label: 'Carga' },
              { key: 'volume' as ChartType, label: 'Volume' },
              { key: 'oneRm' as ChartType, label: '1RM' },
            ]).map(({ key, label }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => setChartType(key)}
                className={cn('text-xs px-3', chartType === key && 'bg-primary/20 text-primary')}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {progressionData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados para {exerciseName}</p>
          </div>
        ) : (
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData}>
                <defs>
                  <linearGradient id="progGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.72 0.17 162)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.72 0.17 162)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 11 }}
                  tickFormatter={(v) => format(parseISO(v), 'd MMM', { locale: ptBR })}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 11 }}
                  width={48}
                  tickFormatter={(v) => `${v}${chartType !== 'volume' ? 'kg' : ''}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.16 0.005 285 / 0.95)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                  }}
                  labelStyle={{ color: 'oklch(0.98 0 0)' }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}${chartType !== 'volume' ? 'kg' : ''}`,
                    chartType === 'weight' ? 'Carga' : chartType === 'volume' ? 'Volume' : '1RM',
                  ]}
                  labelFormatter={(value) =>
                    format(parseISO(value as string), "d 'de' MMMM", { locale: ptBR })
                  }
                />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  stroke="oklch(0.72 0.17 162)"
                  strokeWidth={2.5}
                  fill="url(#progGradient)"
                  dot={{ fill: 'oklch(0.72 0.17 162)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      {/* Mini stats */}
      {progressionData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="text-center p-3">
            <p className="text-lg font-black text-primary">
              {Math.max(...progressionData.map(d => d.weight)).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Melhor carga
            </p>
          </GlassCard>
          <GlassCard className="text-center p-3">
            <p className="text-lg font-black text-primary">
              {Math.max(...progressionData.map(d => d.oneRm)).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              1RM estimado
            </p>
          </GlassCard>
          <GlassCard className="text-center p-3">
            <p className="text-lg font-black text-primary">{progressionData.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Sessões
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
