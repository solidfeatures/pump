'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const TERMS: Record<string, { label: string; definition: string }> = {
  MEV: {
    label: 'MEV',
    definition: 'Volume Mínimo Efetivo — mínimo de séries semanais para estimular hipertrofia (~10 séries/semana por músculo)',
  },
  MRV: {
    label: 'MRV',
    definition: 'Volume Máximo Recuperável — limite antes do overtraining (~20 séries/semana por músculo)',
  },
  RIR: {
    label: 'RIR',
    definition: 'Repetições de Reserva — quantas repetições faltam para a falha muscular. RIR 2 = parou 2 reps antes da falha',
  },
  RPE: {
    label: 'RPE',
    definition: 'Percepção de Esforço (1–10). RPE 8 = esforço intenso, ficando 2 reps antes da falha',
  },
  mesociclo: {
    label: 'Mesociclo',
    definition: 'Bloco de treinamento de 3–6 semanas com carga e volume progressivos antes de um período de deload',
  },
}

interface TermTooltipProps {
  term: keyof typeof TERMS
  className?: string
}

export function TermTooltip({ term, className }: TermTooltipProps) {
  const entry = TERMS[term]
  if (!entry) return <span className={className}>{term}</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2',
            className
          )}
        >
          {entry.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-center leading-snug bg-popover text-popover-foreground border border-white/10 shadow-xl">
        <span className="font-semibold">{entry.label}</span>
        {' — '}
        {entry.definition}
      </TooltipContent>
    </Tooltip>
  )
}
