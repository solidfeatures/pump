'use client'

import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { useWorkout } from '@/lib/workout-context'
import { Target, TrendingUp, Gauge, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PhaseType } from '@/lib/types'

const PHASE_META: Record<PhaseType, { label: string; color: string; desc: string }> = {
  'Acumulação':              { label: 'Acumulação',        color: 'text-primary',    desc: '40% tensão · 60% metabólico' },
  'Transição':               { label: 'Transição',         color: 'text-sky-400',    desc: '60% tensão · 40% metabólico' },
  'Intensificação':          { label: 'Intensificação',    color: 'text-amber-400',  desc: '70% tensão · 30% metabólico' },
  'Teste':                   { label: 'Semana de Teste',   color: 'text-red-400',    desc: 'Testar 1RM / AMRAP' },
  'Hipertrofia_Resistência': { label: 'Hipertrofia',       color: 'text-emerald-400',desc: '40% tensão · 60% metabólico' },
  'Hipertrofia_Pico':        { label: 'Pico',              color: 'text-rose-400',   desc: '30% tensão · 70% metabólico' },
}

export function PhaseProgress() {
  const { currentPhase } = useWorkout()

  const currentWeek = 1
  const totalWeeks = currentPhase.durationWeeks || 4
  const progress = Math.min((currentWeek / totalWeeks) * 100, 100)
  const weeksRemaining = Math.max(totalWeeks - currentWeek, 0)

  const meta = currentPhase.phaseType ? PHASE_META[currentPhase.phaseType] : null
  const phaseColor = meta?.color ?? 'text-primary'
  const phaseLabel = meta?.label ?? currentPhase.name
  const phaseDesc = meta?.desc ?? currentPhase.progressionRule ?? '—'

  return (
    <GlassCard delay={0.3}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {/* Etapa badge */}
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground font-mono">
              E{currentPhase.etapa}
            </span>
            <GlassCardTitle className="truncate">{currentPhase.name}</GlassCardTitle>
          </div>
          <p className={cn('text-xs mt-0.5', phaseColor)}>{phaseLabel}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso do Meso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-r', phaseColor.includes('amber') ? 'from-amber-400 to-orange-400' : phaseColor.includes('rose') ? 'from-rose-400 to-red-400' : 'from-primary to-emerald-400')}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-subtle rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Semana</span>
            </div>
            <p className="text-xl font-bold">{currentWeek}</p>
            <p className="text-xs text-muted-foreground">de {totalWeeks}</p>
          </div>

          <div className="glass-subtle rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="w-4 h-4" />
              <span className="text-xs">RIR Alvo</span>
            </div>
            <p className="text-xl font-bold">
              {currentPhase.targetRirMin ?? '?'}–{currentPhase.targetRirMax ?? '?'}
            </p>
            <p className="text-xs text-muted-foreground">reps em reserva</p>
          </div>
        </div>

        {/* Technique focus badge */}
        {currentPhase.techniqueFocus && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-amber-300 font-medium">
              Técnica foco: {currentPhase.techniqueFocus}
            </span>
          </div>
        )}

        {/* Distribution */}
        {currentPhase.volumePctTension !== null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{Math.round((currentPhase.volumePctTension ?? 0) * 100)}% tensão</span>
            <span>·</span>
            <span>{Math.round((currentPhase.volumePctMetabolic ?? 0) * 100)}% metabólico</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-start gap-1 pt-2 border-t border-white/5 text-xs text-muted-foreground">
          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{currentPhase.progressionRule || phaseDesc}</span>
        </div>
        <p className="text-xs text-muted-foreground">{weeksRemaining} semanas restantes</p>
      </div>
    </GlassCard>
  )
}
