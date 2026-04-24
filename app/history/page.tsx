'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { QuickStatsRow } from '@/components/quick-stats-row'
import { EmptyStateGuide } from '@/components/empty-state-guide'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar, TrendingUp, Dumbbell, CheckCircle2, ChevronRight, ChevronLeft,
  Activity, Award, Flame, Trophy, Scale, Target, ArrowUp, ArrowDown, Minus,
  BarChart3, Sparkles,
} from 'lucide-react'
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { muscleGroupLabels, muscleGroupColors } from '@/lib/mock-data'
import type { MuscleGroup } from '@/lib/types'
import { PhotoTimeline } from '@/components/photo-timeline'
import { cn } from '@/lib/utils'
import { BodyMetric } from '@/lib/db/measures'
import { ExerciseMuscle } from '@/lib/types'
import { getLatestMetricsAction } from '@/app/actions'
import { calculateWeeklyVolumeByMuscle, MRV_THRESHOLD, MEV_THRESHOLD } from '@/lib/periodization'

export default function HistoryPage() {
  const { sessions, getPRRecords, exercises } = useWorkout()
  const [activeTab, setActiveTab] = useState('achievements')
  const currentMonday = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0],
    []
  )
  const [selectedMonday, setSelectedMonday] = useState<string>(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
  )
  const [latestMetrics, setLatestMetrics] = useState<BodyMetric | null>(null)
  const [metrics30d, setMetrics30d] = useState<BodyMetric[]>([])

  useEffect(() => {
    (async () => {
      try {
        const m = await getLatestMetricsAction()
        setLatestMetrics(m)
        // Could fetch last 30d metrics here if endpoint exists — skipping for v1
        setMetrics30d([])
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === 'completed')
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    [sessions]
  )

  const weeksWithData = useMemo(() => {
    const weekSet = new Set<string>()
    completedSessions.forEach(s => {
      const monday = startOfWeek(parseISO(s.date), { weekStartsOn: 1 })
      weekSet.add(monday.toISOString().split('T')[0])
    })
    weekSet.add(currentMonday)
    return Array.from(weekSet).sort()
  }, [completedSessions, currentMonday])

  const prRecords = useMemo(() => getPRRecords(), [getPRRecords])

  // ── Streak: consecutive days back from today with a completed session ──
  const streakDays = useMemo(() => {
    if (!completedSessions.length) return 0
    const dates = new Set(completedSessions.map(s => s.date))
    let streak = 0
    const cursor = new Date()
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().split('T')[0]
      if (dates.has(key)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else if (i === 0) {
        // Today might not have a workout yet — check yesterday
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [completedSessions])

  // ── Consistency: % of last 14 days that had a workout ──
  const consistency14d = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 14)
    const recent = completedSessions.filter(s => parseISO(s.date) >= cutoff)
    const uniqueDays = new Set(recent.map(s => s.date)).size
    return Math.round((uniqueDays / 14) * 100)
  }, [completedSessions])

  // ── Last PR ──
  const latestPR = useMemo(() => {
    if (!prRecords.length) return null
    return prRecords.reduce((latest, pr) =>
      parseISO(pr.date) > parseISO(latest.date) ? pr : latest
    , prRecords[0])
  }, [prRecords])

  // ── Overall stats ──
  const overallStats = useMemo(() => {
    let totalSets = 0
    let totalVolume = 0
    completedSessions.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.completed) {
            totalSets++
            totalVolume += (set.loadKg || 0) * (set.reps || 0)
          }
        })
      })
    })
    return { totalWorkouts: completedSessions.length, totalSets, totalVolume }
  }, [completedSessions])

  // ── Weekly analysis ──
  const selectedWeek = useMemo(() => {
    const start = parseISO(selectedMonday)
    return { start, end: endOfWeek(start, { weekStartsOn: 1 }) }
  }, [selectedMonday])

  const weekIdx = weeksWithData.indexOf(selectedMonday)
  const safeIdx = weekIdx === -1 ? weeksWithData.length - 1 : weekIdx
  const canGoPrev = safeIdx > 0
  const canGoNext = safeIdx < weeksWithData.length - 1
  const weeksAgo = Math.round(
    (parseISO(currentMonday).getTime() - parseISO(selectedMonday).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  )

  const prevWeek = useMemo(() => ({
    start: subWeeks(selectedWeek.start, 1),
    end: subWeeks(selectedWeek.end, 1),
  }), [selectedWeek])

  const weekSessions = useMemo(() => {
    const s = selectedWeek.start.toISOString().split('T')[0]
    const e = selectedWeek.end.toISOString().split('T')[0]
    return completedSessions.filter(sess => sess.date >= s && sess.date <= e)
  }, [completedSessions, selectedWeek])

  const prevWeekSessions = useMemo(() => {
    const s = prevWeek.start.toISOString().split('T')[0]
    const e = prevWeek.end.toISOString().split('T')[0]
    return completedSessions.filter(sess => sess.date >= s && sess.date <= e)
  }, [completedSessions, prevWeek])

  const weekVolumeByMuscle = useMemo(() => {
    const sets = weekSessions.flatMap(s => s.exercises?.flatMap(ex => ex.sets) ?? [])
    const muscleMap: Record<string, ExerciseMuscle[]> = {}
    for (const e of exercises) {
      if (e.muscles?.length) muscleMap[e.id] = e.muscles
    }
    return calculateWeeklyVolumeByMuscle(sets, muscleMap)
  }, [weekSessions, exercises])

  const exerciseComparison = useMemo(() => {
    const allIds = new Set([
      ...weekSessions.flatMap(s => (s.exercises ?? []).map(ex => ex.exerciseId)),
    ])
    const getTonnage = (sessArr: typeof weekSessions, exerciseId: string) =>
      sessArr.reduce((sum, s) => {
        const ex = s.exercises?.find(e => e.exerciseId === exerciseId)
        return sum + (ex?.sets.reduce((t, set) => t + (set.loadKg || 0) * (set.reps || 0), 0) ?? 0)
      }, 0)

    return Array.from(allIds)
      .map(exerciseId => {
        const exercise = exercises.find(e => e.id === exerciseId)
        if (!exercise) return null
        const current = getTonnage(weekSessions, exerciseId)
        const previous = getTonnage(prevWeekSessions, exerciseId)
        const delta = previous > 0 ? ((current - previous) / previous) * 100 : null
        return { exerciseId, name: exercise.name, current, previous, delta }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null && e.current > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 8)
  }, [weekSessions, prevWeekSessions, exercises])

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Histórico</h1>
        <p className="text-muted-foreground">
          Suas conquistas, sessões e análise detalhada ao longo do tempo.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="w-4 h-4" />Conquistas
          </TabsTrigger>
          <TabsTrigger value="workouts" className="gap-2">
            <Dumbbell className="w-4 h-4" />Treinos
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <Activity className="w-4 h-4" />Análise
          </TabsTrigger>
        </TabsList>

        {/* ────────── TAB 1: CONQUISTAS ────────── */}
        <TabsContent value="achievements" className="space-y-6">
          <QuickStatsRow
            stats={[
              {
                icon: Flame,
                label: 'Streak',
                value: streakDays,
                unit: 'dias',
                tone: streakDays >= 7 ? 'success' : streakDays >= 3 ? 'warning' : 'default',
              },
              {
                icon: Target,
                label: 'Consistência (14d)',
                value: `${consistency14d}%`,
                tone: consistency14d >= 70 ? 'success' : consistency14d >= 40 ? 'warning' : 'danger',
              },
              {
                icon: Dumbbell,
                label: 'Treinos Totais',
                value: overallStats.totalWorkouts,
              },
              {
                icon: TrendingUp,
                label: 'Volume Total',
                value: overallStats.totalVolume >= 1000
                  ? `${(overallStats.totalVolume / 1000).toFixed(1)}k`
                  : overallStats.totalVolume,
                unit: 'kg',
              },
            ]}
          />

          {/* Hero Last PR */}
          {latestPR && (
            <GlassCard className="p-6 border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                    Último Recorde Pessoal
                  </p>
                  <h3 className="text-xl font-bold mb-2">{latestPR.exerciseName}</h3>
                  <div className="flex items-end gap-6 flex-wrap">
                    <div>
                      <p className="text-3xl font-black text-primary">
                        {latestPR.weight}
                        <span className="text-base font-normal text-muted-foreground ml-0.5">kg × {latestPR.reps}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-widest">1RM estimado</p>
                      <p className="text-lg font-bold text-amber-400">{latestPR.oneRm.toFixed(1)} kg</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-auto">
                      {format(parseISO(latestPR.date), "d 'de' MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Body stats summary */}
          {latestMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-widest">Peso atual</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {latestMetrics.weight_kg}<span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                  </p>
                </div>
                <Link href="/measures" className="text-xs text-primary hover:underline">Ver →</Link>
              </GlassCard>
              <GlassCard className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-widest">Body Fat</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {latestMetrics.bf_pct ?? '--'}<span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                  </p>
                </div>
                <Link href="/measures" className="text-xs text-primary hover:underline">Ver →</Link>
              </GlassCard>
            </div>
          )}

          {/* Photo timeline */}
          <PhotoTimeline />

          {completedSessions.length === 0 && (
            <GlassCard className="p-8">
              <EmptyStateGuide
                icon={Trophy}
                title="Suas conquistas aparecerão aqui"
                description="Complete seu primeiro treino para começar a ver seu progresso, streaks e recordes pessoais."
                action={{ label: 'Iniciar treino', href: '/workout', icon: Dumbbell }}
              />
            </GlassCard>
          )}
        </TabsContent>

        {/* ────────── TAB 2: TREINOS ────────── */}
        <TabsContent value="workouts" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Histórico de Treinos
            </h2>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
              {completedSessions.length} concluídos
            </span>
          </div>

          {completedSessions.length === 0 ? (
            <GlassCard className="p-8">
              <EmptyStateGuide
                icon={Dumbbell}
                title="Nenhum treino concluído"
                description="Sessões que você completar aparecerão aqui ordenadas cronologicamente."
                action={{ label: 'Iniciar treino', href: '/workout', icon: Dumbbell }}
                compact
              />
            </GlassCard>
          ) : (
            completedSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
              >
                <Link href={`/workout/${session.id}`}>
                  <GlassCard hover className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{session.name || 'Treino'}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(session.date), "EEE, d 'de' MMM", { locale: ptBR })}
                          </div>
                          <span>{session.exercises?.length ?? 0} exercícios</span>
                          {(() => {
                            const tonnage = (session.exercises ?? []).reduce((sum, ex) =>
                              sum + ex.sets.reduce((s, set) => s + (set.loadKg || 0) * (set.reps || 0), 0), 0)
                            return tonnage > 0 ? (
                              <span className="text-primary font-medium">
                                {tonnage >= 1000 ? `${(tonnage / 1000).toFixed(1)}k` : tonnage} kg
                              </span>
                            ) : null
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex gap-1">
                        {session.exercises && [...new Set(session.exercises.map(e => (e.exercise?.muscles?.find((m: { seriesFactor: number; muscleGroup: string }) => m.seriesFactor >= 1.0)?.muscleGroup ?? 'chest') as MuscleGroup))]
                          .slice(0, 3)
                          .map(muscle => (
                            <span key={muscle} className={cn('text-xs px-2 py-0.5 rounded-full text-white/90', muscleGroupColors[muscle])}>
                              {muscleGroupLabels[muscle]}
                            </span>
                          ))
                        }
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* ────────── TAB 3: ANÁLISE ────────── */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Week picker */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedMonday(weeksWithData[safeIdx - 1])}
              disabled={!canGoPrev}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {format(selectedWeek.start, "d 'de' MMM", { locale: ptBR })}
                {' – '}
                {format(selectedWeek.end, "d 'de' MMM yyyy", { locale: ptBR })}
              </p>
              {weeksAgo === 0 && <p className="text-xs text-primary">Esta semana</p>}
              {weeksAgo > 0 && (
                <p className="text-xs text-muted-foreground">
                  {weeksAgo} semana{weeksAgo > 1 ? 's' : ''} atrás
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedMonday(weeksWithData[safeIdx + 1])}
              disabled={!canGoNext}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="text-center p-4">
              <p className="text-3xl font-black text-primary">{weekSessions.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Treinos</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              {(() => {
                const tonnage = weekSessions.reduce((sum, s) =>
                  sum + (s.exercises ?? []).reduce((es, ex) =>
                    es + ex.sets.reduce((ss, set) => ss + (set.loadKg || 0) * (set.reps || 0), 0), 0), 0)
                return <>
                  <p className="text-3xl font-black text-primary">
                    {tonnage >= 1000 ? `${(tonnage / 1000).toFixed(1)}k` : tonnage}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Volume (kg)</p>
                </>
              })()}
            </GlassCard>
          </div>

          {/* Volume por músculo */}
          {Object.keys(weekVolumeByMuscle).length > 0 ? (
            <GlassCard className="space-y-3 p-5">
              <GlassCardTitle>Volume por Músculo</GlassCardTitle>
              {(Object.entries(weekVolumeByMuscle) as [keyof typeof muscleGroupLabels, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([muscle, sets]) => {
                  const pct = Math.min((sets / MRV_THRESHOLD) * 100, 100)
                  const isAboveMrv = sets >= MRV_THRESHOLD
                  const isBelowMev = sets < MEV_THRESHOLD && sets > 0
                  return (
                    <div key={muscle}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{muscleGroupLabels[muscle] ?? muscle}</span>
                        <span className={cn(
                          'font-semibold tabular-nums',
                          isAboveMrv ? 'text-red-400' : isBelowMev ? 'text-amber-400' : 'text-primary'
                        )}>
                          {sets.toFixed(1)} séries
                          {isAboveMrv && ' ⚠️'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isAboveMrv ? 'bg-red-400' : 'bg-gradient-to-r from-primary to-emerald-400'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              <p className="text-[10px] text-muted-foreground/60 pt-1">MEV: 10 séries · MRV: 20 séries</p>
            </GlassCard>
          ) : (
            weekSessions.length === 0 && (
              <GlassCard className="p-8">
                <EmptyStateGuide
                  icon={Activity}
                  title="Sem dados nesta semana"
                  description="Nenhum treino registrado no período selecionado. Use as setas para navegar."
                  compact
                />
              </GlassCard>
            )
          )}

          {/* Tonelagem vs Semana Anterior */}
          {exerciseComparison.length > 0 && (
            <GlassCard className="space-y-3 p-5">
              <GlassCardTitle>Tonelagem vs Semana Anterior</GlassCardTitle>
              <div className="space-y-2">
                {exerciseComparison.map(ex => (
                  <div key={ex.exerciseId} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                    <p className="text-sm truncate max-w-[55%]">{ex.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {ex.current >= 1000 ? `${(ex.current / 1000).toFixed(1)}k` : ex.current.toFixed(0)} kg
                      </span>
                      {ex.delta !== null ? (
                        <span className={cn(
                          'flex items-center gap-0.5 text-xs font-semibold tabular-nums',
                          ex.delta > 0 ? 'text-emerald-400' : ex.delta < 0 ? 'text-red-400' : 'text-muted-foreground'
                        )}>
                          {ex.delta > 0 ? <ArrowUp className="w-3 h-3" /> : ex.delta < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {Math.abs(ex.delta).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">novo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* PRs grid */}
          {prRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4" />
                Recordes Pessoais ({prRecords.length})
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {prRecords.slice(0, 12).map((pr, index) => (
                  <motion.div
                    key={pr.exerciseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <GlassCard className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{pr.exerciseName}</p>
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                      <div className="flex items-end gap-3">
                        <div>
                          <p className="text-2xl font-black text-primary">{pr.weight}<span className="text-sm font-normal text-muted-foreground ml-0.5">kg</span></p>
                          <p className="text-xs text-muted-foreground">× {pr.reps} reps</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-muted-foreground">1RM estimado</p>
                          <p className="text-sm font-bold text-amber-400">{pr.oneRm.toFixed(1)} kg</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        {format(parseISO(pr.date), "d 'de' MMM yyyy", { locale: ptBR })}
                      </p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
