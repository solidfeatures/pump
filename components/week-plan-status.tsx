'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, Sparkles, ChevronDown, CheckCircle2, Clock,
  Dumbbell, RefreshCw, X, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── localStorage generation lock ────────────────────────────────────────────
const LOCK_KEY = 'pump-weekly-plan-lock'
const LOCK_TTL_MS = 4 * 60 * 1000

interface Lock { startedAt: number; week: number; year: number }

function readLock(): Lock | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCK_KEY) : null
    if (!raw) return null
    const lock: Lock = JSON.parse(raw)
    if (Date.now() - lock.startedAt > LOCK_TTL_MS) { localStorage.removeItem(LOCK_KEY); return null }
    return lock
  } catch { return null }
}
function writeLock(week: number, year: number) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify({ startedAt: Date.now(), week, year })) } catch {}
}
function clearLock() {
  try { localStorage.removeItem(LOCK_KEY) } catch {}
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isoWeekMonday(isoWeek: number, isoYear: number): Date {
  // ISO week 1 contains Jan 4
  const jan4 = new Date(isoYear, 0, 4)
  const dow = jan4.getDay() || 7 // Mon=1..Sun=7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - (dow - 1) + (isoWeek - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── types ────────────────────────────────────────────────────────────────────

interface WeekSession {
  id: string
  name: string | null
  day_of_week: number | null
  status: string
  ai_notes: string | null
  tier: number
  exercises: {
    id: string
    exercise_name: string
    sets_count: number
    reps_min: number | null
    reps_max: number | null
    suggested_load_kg: number | null
    target_rpe: number | null
    target_rir: number | null
    actual_sets_done: number | null
    contingency_added: boolean
  }[]
}

interface WeekStatus {
  iso_week: number
  iso_year: number
  phase: { name: string; phase_order: number | null; duration_weeks: number | null; progression_rule: string | null } | null
  sessions: WeekSession[]
  has_current_week_plan: boolean
  is_generating: boolean
  volume_by_muscle: Record<string, number>
}

const DAY_ABBR = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const STATUS_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'Concluída':    { color: 'text-green-400',  bg: 'bg-green-400/15 border-green-400/20',   icon: <CheckCircle2 className="w-3 h-3" /> },
  'Em Andamento': { color: 'text-yellow-400', bg: 'bg-yellow-400/15 border-yellow-400/20', icon: <Clock        className="w-3 h-3" /> },
  'Parcial':      { color: 'text-orange-400', bg: 'bg-orange-400/15 border-orange-400/20', icon: <Clock        className="w-3 h-3" /> },
  'Pendente':     { color: 'text-white/60',   bg: 'bg-white/8 border-white/10',             icon: <Dumbbell     className="w-3 h-3" /> },
}
function statusMeta(s: string) { return STATUS_META[s] ?? STATUS_META['Pendente'] }

// ─── component ───────────────────────────────────────────────────────────────

interface WeekPlanStatusProps {
  trainingDayMask: number[]
  autoWeeklyPlan: boolean
}

export function WeekPlanStatus({ trainingDayMask, autoWeeklyPlan }: WeekPlanStatusProps) {
  const [status, setStatus]       = useState<WeekStatus | null>(null)
  const [loading, setLoading]     = useState(true)
  const [planning, setPlanning]   = useState(false)
  const [expanded, setExpanded]   = useState(true)
  const [activeDay, setActiveDay] = useState<number | null>(null) // day_of_week 1-7
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/plan/week-status')
      if (res.ok) {
        const data: WeekStatus = await res.json()
        setStatus(data)
        return data
      }
    } catch {}
    return null
  }, [])

  const startPolling = useCallback((expectedWeek: number, expectedYear: number) => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      const data = await fetchStatus()
      if (data?.iso_week === expectedWeek && data?.iso_year === expectedYear && data.has_current_week_plan) {
        stopPolling()
        setPlanning(false)
        clearLock()
        toast.success(`Plano gerado: ${data.sessions.length} sessões criadas!`)
      }
    }, 4000)
  }, [fetchStatus, stopPolling])

  useEffect(() => {
    fetchStatus().then(data => {
      setLoading(false)
      if (!data) return
      const lock = readLock()
      const serverGenerating = data.is_generating && !data.has_current_week_plan
      const clientLock = !!(lock && lock.week === data.iso_week && lock.year === data.iso_year && !data.has_current_week_plan)
      if (serverGenerating || clientLock) {
        setPlanning(true)
        startPolling(data.iso_week, data.iso_year)
      }
    })
    return () => stopPolling()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerPlan = async (overwrite = false) => {
    if (planning) return
    const currentWeek = status?.iso_week ?? 0
    const currentYear = status?.iso_year ?? 0

    if (!overwrite) {
      const existingLock = readLock()
      if (existingLock && existingLock.week === currentWeek && existingLock.year === currentYear) {
        toast.info('Geração em andamento — aguarde...')
        setPlanning(true)
        startPolling(currentWeek, currentYear)
        return
      }
    }

    writeLock(currentWeek, currentYear)
    setPlanning(true)

    try {
      const res = await fetch('/api/ai/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true, overwrite }),
      })
      const data = await res.json()

      if (data.pending) {
        toast.info('Geração já em andamento em outro dispositivo ou aba.')
        startPolling(currentWeek, currentYear)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar plano')

      if (data.skipped) {
        toast.info('Semana já planejada. Use "Forçar" para replanejar.')
        clearLock()
        setPlanning(false)
        await fetchStatus()
      } else {
        startPolling(currentWeek, currentYear)
        toast.success(`IA processando: ${data.sessions_created} sessões criadas`, { duration: 3000 })
        await fetchStatus()
        clearLock()
        setPlanning(false)
        stopPolling()
      }
    } catch (e: unknown) {
      clearLock()
      setPlanning(false)
      stopPolling()
      toast.error(e instanceof Error ? e.message : 'Erro ao planejar semana')
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando status da semana...</span>
      </GlassCard>
    )
  }

  const hasPlan   = status?.has_current_week_plan
  const sessions  = status?.sessions ?? []
  const done      = sessions.filter(s => s.status === 'Concluída').length
  const total     = sessions.length
  const phase     = status?.phase
  const today     = todayStr()

  // Build 7-column day array
  const monday = status ? isoWeekMonday(status.iso_week, status.iso_year) : null
  const weekDays = monday
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return { dow: i + 1, date: d, ds: dateStr(d) }
      })
    : []

  const sessionByDow = new Map(sessions.map(s => [s.day_of_week ?? 0, s]))
  const activeSession = activeDay !== null ? sessionByDow.get(activeDay) ?? null : null

  return (
    <GlassCard className="overflow-hidden">
      {/* ── Header ── */}
      <div
        className="p-4 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Semana {status?.iso_week ?? '—'}</span>
            {phase && <span className="text-xs text-muted-foreground">· {phase.name}</span>}
            {hasPlan && <span className="text-xs text-muted-foreground">· {done}/{total} concluídas</span>}
            {!hasPlan && !planning && (
              <span className="text-xs text-amber-400">· Sem plano para esta semana</span>
            )}
            {planning && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Gerando plano...
              </span>
            )}
          </div>
          {hasPlan && total > 0 && (
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={cn('h-1 rounded-full flex-1 transition-colors', i < done ? 'bg-green-400' : 'bg-white/15')} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {hasPlan && !planning && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => triggerPlan(true)}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-white"
              title="Forçar replanejamento da semana"
            >
              <RotateCcw className="w-3 h-3" />
              Forçar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerPlan(false)}
            disabled={planning}
            className="h-7 px-2.5 text-xs gap-1.5 border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            title={planning ? 'Geração em andamento...' : 'Gerar plano com IA'}
          >
            {planning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {planning ? 'Gerando...' : 'Planejar Semana'}
          </Button>
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')} />
        </div>
      </div>

      {/* ── Expanded: 7-day grid ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {hasPlan && sessions.length > 0 ? (
              <div className="border-t border-white/10 p-4 space-y-3">
                {/* Day columns */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map(({ dow, date, ds }) => {
                    const session = sessionByDow.get(dow)
                    const isToday = ds === today
                    const isActive = activeDay === dow
                    const meta = session ? statusMeta(session.status) : null

                    return (
                      <motion.div
                        key={dow}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dow * 0.04 }}
                        onClick={() => {
                          if (!session) return
                          setActiveDay(prev => prev === dow ? null : dow)
                        }}
                        className={cn(
                          'rounded-xl p-2.5 flex flex-col gap-2 min-h-[90px] transition-all duration-150',
                          isToday ? 'ring-2 ring-primary/60 bg-white/8' : 'bg-white/5',
                          session && !isActive && 'hover:bg-white/10 cursor-pointer',
                          isActive && 'ring-2 ring-white/20 bg-white/10',
                        )}
                      >
                        {/* Day header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">{DAY_ABBR[dow]}</span>
                          <span className={cn('text-sm font-bold tabular-nums', isToday ? 'text-primary' : 'text-white/80')}>
                            {date.getDate()}
                          </span>
                        </div>

                        {/* Session card or rest */}
                        {session ? (
                          <div className={cn('flex-1 rounded-lg border px-2 py-1.5 text-xs flex flex-col gap-1', meta!.bg)}>
                            <div className={cn('flex items-center gap-1', meta!.color)}>
                              {meta!.icon}
                              <span className="font-semibold leading-tight line-clamp-2">{session.name}</span>
                            </div>
                            <span className="text-muted-foreground text-[10px]">
                              {session.exercises.length} exercícios
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1 rounded-lg bg-white/5 border border-white/8 px-2 py-1.5 text-[10px] text-muted-foreground/60 flex items-center justify-center">
                            Descanso
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Inline session detail */}
                <AnimatePresence>
                  {activeSession && (
                    <motion.div
                      key={activeSession.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                      {/* Detail header */}
                      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/8">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{DAY_ABBR[activeDay!]}</span>
                            <span className={cn('text-xs font-medium', statusMeta(activeSession.status).color)}>
                              {activeSession.status}
                            </span>
                          </div>
                          <p className="font-semibold text-sm mt-0.5">{activeSession.name}</p>
                          {activeSession.ai_notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{activeSession.ai_notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveDay(null)}
                          className="text-muted-foreground hover:text-white transition-colors shrink-0 mt-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Exercise table */}
                      <div className="divide-y divide-white/5">
                        {activeSession.exercises.map((ex, i) => (
                          <div
                            key={ex.id}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 text-sm',
                              ex.contingency_added && 'bg-amber-500/5',
                            )}
                          >
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                              {i + 1}
                            </span>
                            <span className={cn('flex-1 font-medium', ex.contingency_added && 'text-amber-300')}>
                              {ex.exercise_name}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="tabular-nums">
                                {ex.sets_count}×
                                {ex.reps_min != null && ex.reps_max != null
                                  ? ex.reps_min === ex.reps_max
                                    ? ex.reps_min
                                    : `${ex.reps_min}–${ex.reps_max}`
                                  : '—'}
                              </span>
                              {ex.suggested_load_kg != null && (
                                <span className="tabular-nums text-white/70 font-medium">
                                  {ex.suggested_load_kg}kg
                                </span>
                              )}
                              {ex.target_rir != null && (
                                <span className="hidden sm:inline">RIR {ex.target_rir}</span>
                              )}
                              {ex.target_rpe != null && ex.target_rir == null && (
                                <span className="hidden sm:inline">RPE {ex.target_rpe}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* No plan empty state */
              <div className="border-t border-white/10 p-6 text-center">
                {planning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                    <p className="text-sm text-muted-foreground">
                      A IA está montando seu plano semanal — pode levar até 30 segundos.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {autoWeeklyPlan
                        ? 'Nenhum plano gerado. A IA gerará automaticamente na segunda-feira.'
                        : 'Nenhum plano gerado. O replanejamento automático está desativado.'}
                    </p>
                    <Button size="sm" onClick={() => triggerPlan(false)} className="gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Gerar Agora
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
