'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { usePreferences } from '@/lib/preferences-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { HeroCard } from '@/components/hero-card'
import { EmptyStateGuide } from '@/components/empty-state-guide'
import { Button } from '@/components/ui/button'
import {
  PlayCircle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Coffee,
  Dumbbell,
  Clock,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'

function estimateDurationMin(exerciseCount: number, setCount: number) {
  const warmUp = 5
  const perSet = 2.5
  return Math.round(warmUp + setCount * perSet + exerciseCount * 1)
}

export default function WorkoutListPage() {
  const { sessions, getTodaysWorkout, getProgressionData, exercises } = useWorkout()
  const { locale } = usePreferences()
  const [historyOpen, setHistoryOpen] = useState(false)
  const historyRef = useRef<HTMLElement>(null)

  const toggleHistory = () => {
    setHistoryOpen(o => {
      if (!o) {
        setTimeout(() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
      return !o
    })
  }

  const dfnsLocale = locale === 'pt' ? ptBR : locale === 'es' ? es : enUS
  const todayWorkout = getTodaysWorkout()

  const upcomingWorkouts = sessions.filter(s => {
    const sessionDate = parseISO(s.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate > today && s.status !== 'completed'
  })
  .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
  .slice(0, 3)

  const completedWorkouts = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())

  // Build insight from last performance
  let lastPerformanceInsight = ''
  if (todayWorkout && todayWorkout.exercises?.length) {
    const firstEx = todayWorkout.exercises[0]
    const progData = getProgressionData(firstEx.exerciseId)
    if (progData.length >= 2) {
      const last = progData[progData.length - 1]
      const prev = progData[progData.length - 2]
      const delta = last.oneRm && prev.oneRm ? ((last.oneRm - prev.oneRm) / prev.oneRm) * 100 : 0
      const exName = exercises.find(e => e.id === firstEx.exerciseId)?.name
      if (exName) {
        const arrow = delta > 1 ? '↑' : delta < -1 ? '↓' : '='
        lastPerformanceInsight = `Última vez: ${exName} ${last.weight}kg×${last.reps} ${arrow}${delta > 0 ? '+' : ''}${delta.toFixed(0)}%`
      }
    }
  }

  const isRestDay = !todayWorkout

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* ────────── HERO ────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {isRestDay ? (
          <HeroCard
            variant="muted"
            icon={Coffee}
            eyebrow={format(new Date(), 'EEEE, d LLL', { locale: dfnsLocale })}
            title="Hoje é dia de descanso"
            subtitle="Recuperação é onde o músculo cresce — aproveite."
            insight="Nenhum treino planejado para hoje. Seu próximo treino aparecerá aqui quando chegar."
            cta={{
              label: 'Ver plano semanal',
              href: '/plan',
              icon: Calendar,
            }}
          />
        ) : todayWorkout!.status === 'completed' ? (
          <HeroCard
            variant="primary"
            icon={CheckCircle2}
            eyebrow={format(parseISO(todayWorkout!.date), 'EEEE, d LLL', { locale: dfnsLocale })}
            title={`${todayWorkout!.name} concluído`}
            subtitle="Excelente trabalho! Seus dados foram salvos."
            cta={{
              label: 'Ver detalhes',
              href: `/workout/${todayWorkout!.id}`,
              icon: ArrowRight,
            }}
          />
        ) : (
          <HeroCard
            variant="primary"
            icon={Dumbbell}
            eyebrow={`HOJE · ${format(parseISO(todayWorkout!.date), 'EEEE, d LLL', { locale: dfnsLocale })}`}
            title={todayWorkout!.name}
            subtitle={`${(todayWorkout!.exercises ?? []).length} exercícios · ${(todayWorkout!.exercises ?? []).reduce((a, e) => a + e.sets.length, 0)} séries · ~${estimateDurationMin(
              (todayWorkout!.exercises ?? []).length,
              (todayWorkout!.exercises ?? []).reduce((a, e) => a + e.sets.length, 0)
            )} min`}
            chips={(todayWorkout!.exercises ?? []).slice(0, 5).map(e =>
              exercises.find(ex => ex.id === e.exerciseId)?.name ?? 'Exercício'
            )}
            insight={lastPerformanceInsight || undefined}
            cta={{
              label: 'INICIAR TREINO',
              href: `/workout/${todayWorkout!.id}`,
              icon: PlayCircle,
            }}
          />
        )}
      </motion.div>

      {/* ────────── UPCOMING ────────── */}
      {upcomingWorkouts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              Próximos treinos
            </h2>
            <Link href="/plan" className="text-xs text-primary hover:underline">
              Ver plano →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingWorkouts.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/workout/${workout.id}`}>
                  <GlassCard hover className="p-4 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {format(parseISO(workout.date), 'EEE, d LLL', { locale: dfnsLocale })}
                      </p>
                      <PlayCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <GlassCardTitle className="text-base mb-1.5">{workout.name}</GlassCardTitle>
                    <p className="text-xs text-muted-foreground">
                      {(workout.exercises ?? []).length} exercícios
                    </p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ────────── COMPLETED (collapsible) ────────── */}
      {completedWorkouts.length > 0 ? (
        <section ref={historyRef}>
          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-between px-1 py-2 group mb-4"
          >
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
              <CheckCircle2 className="w-4 h-4" />
              Últimos treinos
              <span className="text-[10px] font-normal opacity-60 normal-case tracking-normal">
                ({completedWorkouts.length})
              </span>
            </h2>
            {historyOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
            }
          </button>

          <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 md:grid-cols-3 pb-2">
                  {completedWorkouts.slice(0, 9).map((workout, i) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link href={`/workout/${workout.id}`}>
                        <GlassCard hover className="p-4 h-full opacity-80">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {format(parseISO(workout.date), 'd LLL', { locale: dfnsLocale })}
                            </p>
                            <CheckCircle2 className="w-4 h-4 text-primary/60" />
                          </div>
                          <GlassCardTitle className="text-sm mb-1">{workout.name}</GlassCardTitle>
                          <p className="text-[11px] text-muted-foreground">
                            {(workout.exercises ?? []).reduce(
                              (a, e) => a + e.sets.filter(s => s.completed).length, 0
                            )} séries
                          </p>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                {completedWorkouts.length > 9 && (
                  <Link href="/history">
                    <Button variant="outline" size="sm" className="w-full gap-2 border-white/10 bg-white/5">
                      Ver histórico completo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : (
        !todayWorkout && upcomingWorkouts.length === 0 && (
          <GlassCard className="p-8">
            <EmptyStateGuide
              icon={Dumbbell}
              title="Nenhum treino ainda"
              description="Comece gerando seu primeiro plano de treino personalizado com a IA."
              action={{ label: 'Ir para Plano', href: '/plan', icon: Calendar }}
            />
          </GlassCard>
        )
      )}
    </div>
  )
}
