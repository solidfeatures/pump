'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── localStorage generation lock ───────────────────────────────────────────
const LOCK_KEY = 'pump-weekly-plan-lock'
const LOCK_TTL_MS = 4 * 60 * 1000 // 4 minutes

interface Lock { startedAt: number; week: number; year: number }

function readLock(): Lock | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCK_KEY) : null
    if (!raw) return null
    const lock: Lock = JSON.parse(raw)
    if (Date.now() - lock.startedAt > LOCK_TTL_MS) {
      localStorage.removeItem(LOCK_KEY)
      return null
    }
    return lock
  } catch { return null }
}
function writeLock(week: number, year: number) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify({ startedAt: Date.now(), week, year })) } catch {}
}
function clearLock() {
  try { localStorage.removeItem(LOCK_KEY) } catch {}
}

// ─── types ───────────────────────────────────────────────────────────────────

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

const DAY_NAMES = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const STATUS_COLORS: Record<string, string> = {
  'Concluída': 'text-green-400',
  'Em Andamento': 'text-yellow-400',
  'Parcial': 'text-orange-400',
  'Pendente': 'text-muted-foreground',
}

// ─── component ───────────────────────────────────────────────────────────────

interface WeekPlanStatusProps {
  trainingDayMask: number[]
  autoWeeklyPlan: boolean
}

export function WeekPlanStatus({ trainingDayMask, autoWeeklyPlan }: WeekPlanStatusProps) {
  const [status, setStatus] = useState<WeekStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [expanded, setExpanded] = useState(false)
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

  // Poll while generating — stop when plan appears
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
      // Use DB-level pending sentinel as authoritative signal; localStorage lock as fallback
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

  const handlePlanWeek = async () => {
    if (planning) return

    const currentWeek = status?.iso_week ?? 0
    const currentYear = status?.iso_year ?? 0

    // Check for existing lock before even calling the server
    const existingLock = readLock()
    if (existingLock && existingLock.week === currentWeek && existingLock.year === currentYear) {
      toast.info('Geração em andamento — aguarde...')
      setPlanning(true)
      startPolling(currentWeek, currentYear)
      return
    }

    writeLock(currentWeek, currentYear)
    setPlanning(true)

    try {
      const res = await fetch('/api/ai/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      })
      const data = await res.json()

      if (data.pending) {
        // Another request is already in flight on the server
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
        // Success — poll will detect the plan and clear state
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

  // ── render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando status da semana...</span>
      </GlassCard>
    )
  }

  const hasPlan = status?.has_current_week_plan
  const sessions = status?.sessions ?? []
  const done = sessions.filter(s => s.status === 'Concluída').length
  const total = sessions.length
  const phase = status?.phase

  return (
    <GlassCard className="overflow-hidden">
      <div
        className="p-4 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Semana {status?.iso_week ?? '—'}</span>
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
                <div
                  key={i}
                  className={cn('h-1 rounded-full flex-1 transition-colors', i < done ? 'bg-green-400' : 'bg-white/15')}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={e => { e.stopPropagation(); handlePlanWeek() }}
            disabled={planning}
            className="h-7 px-2.5 text-xs gap-1.5 border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            title={planning ? 'Geração em andamento...' : 'Gerar plano com IA'}
          >
            {planning
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3" />}
            {planning ? 'Gerando...' : 'Planejar Semana'}
          </Button>
          <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {expanded && hasPlan && sessions.length > 0 && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {sessions.map(session => (
            <div key={session.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-muted-foreground">{DAY_NAMES[session.day_of_week ?? 0]}</span>
                  <p className="text-sm font-medium">{session.name}</p>
                  {session.ai_notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{session.ai_notes}</p>
                  )}
                </div>
                <span className={cn('text-xs shrink-0 mt-1', STATUS_COLORS[session.status] ?? 'text-muted-foreground')}>
                  {session.status}
                </span>
              </div>
              {session.exercises.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {session.exercises.slice(0, 4).map(ex => (
                    <span
                      key={ex.id}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10',
                        ex.contingency_added && 'border-amber-500/30 text-amber-400',
                      )}
                    >
                      {ex.exercise_name}
                      {ex.suggested_load_kg ? ` ${ex.suggested_load_kg}kg` : ''}
                    </span>
                  ))}
                  {session.exercises.length > 4 && (
                    <span className="text-xs text-muted-foreground px-1">+{session.exercises.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded && !hasPlan && (
        <div className="border-t border-white/10 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {planning
              ? 'A IA está montando seu plano semanal — pode levar até 30 segundos.'
              : autoWeeklyPlan
                ? 'Nenhum plano gerado. A IA gerará automaticamente na segunda-feira.'
                : 'Nenhum plano gerado. O replanejamento automático está desativado.'}
          </p>
          {!planning && (
            <Button size="sm" onClick={handlePlanWeek} disabled={planning} className="gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Agora
            </Button>
          )}
          {planning && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando com IA...
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
