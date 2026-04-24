'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { useWorkout } from '@/lib/workout-context'
import { usePreferences } from '@/lib/preferences-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { HeroCard } from '@/components/hero-card'
import { QuickStatsRow } from '@/components/quick-stats-row'
import { InsightBanner } from '@/components/insight-banner'
import { EmptyStateGuide } from '@/components/empty-state-guide'
import { WorkoutCalendar } from '@/components/workout-calendar'
import { VolumeChart } from '@/components/volume-chart'
import { PhaseProgress } from '@/components/phase-progress'
import { WeeklyStats } from '@/components/weekly-stats'
import { ProgressionCharts } from '@/components/progression-charts'
import { MuscleVolumePanel } from '@/components/muscle-volume-panel'
import { PhaseTransitionAlert } from '@/components/phase-transition-alert'
import { ExerciseProgressionTable } from '@/components/exercise-progression-table'
import { DayNav } from '@/components/day-nav'
import { MiniCalendar } from '@/components/mini-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar, TrendingUp, PieChart, Dumbbell, PlayCircle,
  Flame, Target, Award, Coffee, Sparkles, CheckCircle2, Sunrise,
} from 'lucide-react'
import { ptBR, enUS, es } from 'date-fns/locale'
import Link from 'next/link'

export default function Dashboard() {
  const { sessions, currentPhase, getTodaysWorkout, getPRRecords, exercises, getProgressionData } = useWorkout()
  const { locale } = usePreferences()
  const [activeTab, setActiveTab] = useState('today')
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const dfnsLocale = locale === 'pt' ? ptBR : locale === 'es' ? es : enUS

  const handlePrevDay = () => setViewDate(prev => format(subDays(parseISO(prev), 1), 'yyyy-MM-dd'))
  const handleNextDay = () => setViewDate(prev => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'))

  const todayWorkout = getTodaysWorkout()
  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions])

  // ── Streak ──
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
        cursor.setDate(cursor.getDate() - 1)
      } else break
    }
    return streak
  }, [completedSessions])

  // ── Consistency 14d ──
  const consistency14d = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 14)
    const recent = completedSessions.filter(s => parseISO(s.date) >= cutoff)
    const uniqueDays = new Set(recent.map(s => s.date)).size
    return Math.round((uniqueDays / 14) * 100)
  }, [completedSessions])

  // ── Week volume total ──
  const weekVolume = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const week = completedSessions.filter(s => parseISO(s.date) >= cutoff)
    return week.reduce((sum, s) =>
      sum + (s.exercises ?? []).reduce((e, ex) =>
        e + ex.sets.reduce((ss, st) => ss + (st.loadKg || 0) * (st.reps || 0), 0), 0), 0
    )
  }, [completedSessions])

  // ── Latest PR ──
  const prRecords = useMemo(() => getPRRecords(), [getPRRecords])
  const latestPR = useMemo(() =>
    prRecords.length
      ? prRecords.reduce((l, pr) => parseISO(pr.date) > parseISO(l.date) ? pr : l, prRecords[0])
      : null,
    [prRecords]
  )

  // ── AI insight text ──
  const aiInsight = useMemo(() => {
    if (streakDays >= 7) return `🔥 Você está há ${streakDays} dias treinando consistentemente. Continue assim!`
    if (consistency14d >= 70) return `💪 Consistência de ${consistency14d}% nas últimas 2 semanas — excelente aderência.`
    if (consistency14d < 30 && completedSessions.length > 0) return 'Você perdeu alguns treinos recentemente. Que tal retomar hoje?'
    if (completedSessions.length === 0) return 'Bem-vindo! Gere seu primeiro plano com IA para começar.'
    return `Fase atual: ${currentPhase?.name ?? 'N/A'}. Foque na progressão dos exercícios compostos.`
  }, [streakDays, consistency14d, completedSessions, currentPhase])

  const estimateDuration = (exerciseCount: number, setCount: number) =>
    Math.round(5 + setCount * 2.5 + exerciseCount * 1)

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Antigravity</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e alcance seus objetivos.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="today" className="gap-2">
            <Sunrise className="w-4 h-4" />Hoje
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <PieChart className="w-4 h-4" />Esta Semana
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="w-4 h-4" />Progressão
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />Calendário
          </TabsTrigger>
        </TabsList>

        {/* ────────── TAB 1: HOJE ────────── */}
        <TabsContent value="today" className="space-y-6">
          <PhaseTransitionAlert />

          {/* Hero */}
          {todayWorkout && todayWorkout.status !== 'completed' ? (
            <HeroCard
              variant="primary"
              icon={Dumbbell}
              eyebrow={`HOJE · ${format(new Date(), 'EEEE', { locale: dfnsLocale })}`}
              title={todayWorkout.name}
              subtitle={`${(todayWorkout.exercises ?? []).length} exercícios · ~${estimateDuration(
                (todayWorkout.exercises ?? []).length,
                (todayWorkout.exercises ?? []).reduce((a, e) => a + e.sets.length, 0)
              )} min`}
              chips={(todayWorkout.exercises ?? []).slice(0, 4).map(e =>
                exercises.find(ex => ex.id === e.exerciseId)?.name ?? 'Ex.'
              )}
              cta={{
                label: 'INICIAR TREINO',
                href: `/workout/${todayWorkout.id}`,
                icon: PlayCircle,
              }}
            />
          ) : todayWorkout ? (
            <HeroCard
              variant="primary"
              icon={CheckCircle2}
              eyebrow="Hoje"
              title={`${todayWorkout.name} concluído`}
              subtitle="Treino de hoje já está salvo. Volte amanhã para o próximo."
              cta={{ label: 'Ver detalhes', href: `/workout/${todayWorkout.id}` }}
            />
          ) : (
            <HeroCard
              variant="muted"
              icon={Coffee}
              eyebrow={format(new Date(), 'EEEE', { locale: dfnsLocale })}
              title="Hoje é dia de descanso"
              subtitle="Recuperação é onde o músculo cresce."
              cta={{ label: 'Ver plano semanal', href: '/plan', icon: Calendar }}
            />
          )}

          <InsightBanner text={aiInsight} tone="ai" />

          {/* Quick stats */}
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
                icon: TrendingUp,
                label: 'Volume (7d)',
                value: weekVolume >= 1000 ? `${(weekVolume / 1000).toFixed(1)}k` : weekVolume,
                unit: 'kg',
              },
              {
                icon: Award,
                label: 'Último PR',
                value: latestPR ? `${latestPR.weight}` : '—',
                unit: latestPR ? 'kg' : undefined,
                tone: latestPR ? 'warning' : 'default',
              },
            ]}
          />

          {/* Empty state if no data */}
          {completedSessions.length === 0 && !todayWorkout && (
            <GlassCard className="p-8">
              <EmptyStateGuide
                icon={Sparkles}
                title="Pronto para começar?"
                description="Gere seu primeiro plano de treino personalizado com a IA. Ele será baseado no seu objetivo, dias disponíveis e histórico."
                action={{ label: 'Gerar Plano com IA', href: '/plan', icon: Sparkles }}
                secondaryAction={{ label: 'Ir para perfil', href: '/profile' }}
              />
            </GlassCard>
          )}
        </TabsContent>

        {/* ────────── TAB 2: ESTA SEMANA ────────── */}
        <TabsContent value="week" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyStats />
            <PhaseProgress />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <GlassCard>
                <GlassCardTitle className="mb-4">Volume Semanal por Músculo</GlassCardTitle>
                <VolumeChart />
              </GlassCard>
            </div>
            <MuscleVolumePanel />
          </div>

          <GlassCard>
            <GlassCardTitle className="mb-4">Visualização Semanal</GlassCardTitle>
            <WorkoutCalendar
              initialView="week"
              onDateSelect={(d) => setViewDate(format(d, 'yyyy-MM-dd'))}
              selectedDate={parseISO(viewDate)}
            />
          </GlassCard>
        </TabsContent>

        {/* ────────── TAB 3: PROGRESSÃO ────────── */}
        <TabsContent value="progress" className="space-y-6">
          <ProgressionCharts />
          <ExerciseProgressionTable />
        </TabsContent>

        {/* ────────── TAB 4: CALENDÁRIO ────────── */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DayNav date={viewDate} onPrev={handlePrevDay} onNext={handleNextDay} className="h-[380px]" />
            </div>
            <div className="lg:col-span-1">
              <MiniCalendar
                selectedDate={viewDate}
                onDayClick={setViewDate}
                className="h-[380px]"
              />
            </div>
          </div>

          <GlassCard>
            <GlassCardTitle className="mb-4">Calendário de Treinos</GlassCardTitle>
            <WorkoutCalendar onDateSelect={(d) => setViewDate(format(d, 'yyyy-MM-dd'))} />
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
