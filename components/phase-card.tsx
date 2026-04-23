'use client'

import { motion } from 'framer-motion'
import { TrainingPhase, PhaseType } from '@/lib/types'
import { TrendingUp, Zap, Target, FlameKindling, TestTube, Layers, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhaseCardProps {
  phase: TrainingPhase
  delay?: number
  onEdit?: () => void
  onDelete?: () => void
}

const PHASE_CONFIG: Record<PhaseType, { icon: LucideIcon; color: string; bgColor: string; label: string }> = {
  'Acumulação':              { icon: TrendingUp,     color: 'text-primary',     bgColor: 'bg-primary/20',     label: 'Acumulação de Volume' },
  'Transição':               { icon: Layers,         color: 'text-sky-400',     bgColor: 'bg-sky-400/20',     label: 'Transição / Densidade' },
  'Intensificação':          { icon: Zap,            color: 'text-amber-400',   bgColor: 'bg-amber-400/20',   label: 'Intensificação de Carga' },
  'Teste':                   { icon: TestTube,       color: 'text-red-400',     bgColor: 'bg-red-400/20',     label: 'Semana de Teste (1RM)' },
  'Hipertrofia_Resistência': { icon: FlameKindling,  color: 'text-emerald-400', bgColor: 'bg-emerald-400/20', label: 'Hipertrofia e Resistência' },
  'Hipertrofia_Pico':        { icon: Target,         color: 'text-rose-400',    bgColor: 'bg-rose-400/20',    label: 'Pico de Hipertrofia' },
}

const FALLBACK_CONFIG = { icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/20', label: 'Fase de Treino' }

export function PhaseCard({ phase, delay = 0, onEdit, onDelete }: PhaseCardProps) {
  const config = phase.phaseType ? PHASE_CONFIG[phase.phaseType] : FALLBACK_CONFIG
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'p-4 rounded-xl transition-all group',
        phase.isCurrent
          ? 'glass border border-primary/30 glow-emerald'
          : 'glass-subtle hover:bg-white/10'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgColor)}>
            <Icon className={cn('w-5 h-5', config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground font-mono">
                E{phase.etapa}
              </span>
              <h3 className="font-semibold">{phase.name}</h3>
              {phase.isCurrent && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Ativa
                </span>
              )}
            </div>
            <p className={cn('text-sm mt-0.5', config.color)}>{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <span className="text-xs">Duração</span>
          <span className="font-medium text-foreground">{phase.durationWeeks} sem.</span>
        </div>
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <span className="text-xs">RIR Alvo</span>
          <span className="font-medium text-foreground">{phase.targetRirMin}–{phase.targetRirMax}</span>
        </div>
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <span className="text-xs">Tensão</span>
          <span className="font-medium text-foreground">{((phase.volumePctTension ?? 0) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {phase.techniqueFocus && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Técnica: {phase.techniqueFocus}</span>
        </div>
      )}

      {phase.progressionRule && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground line-clamp-2">
          {phase.progressionRule}
        </div>
      )}
    </motion.div>
  )
}
