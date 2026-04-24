'use client'

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReadinessItem {
  label: string
  done: boolean
  href?: string
  hint?: string
}

interface ReadinessGateProps {
  hasProfile: boolean
  hasGoal: boolean
  hasTrainingDays: boolean
  hasBodyMetric: boolean
  hasPhase: boolean
  hasWorkoutHistory: boolean
  onGeneratePlan?: () => void
  generating?: boolean
}

export function ReadinessGate({
  hasProfile,
  hasGoal,
  hasTrainingDays,
  hasBodyMetric,
  hasPhase,
  hasWorkoutHistory,
  onGeneratePlan,
  generating,
}: ReadinessGateProps) {
  const items: ReadinessItem[] = [
    { label: 'Perfil criado', done: hasProfile, href: '/profile', hint: 'Acesse Perfil para criar' },
    { label: 'Objetivo definido', done: hasGoal, href: '/profile', hint: 'Defina seu objetivo no perfil' },
    { label: 'Dias de treino configurados', done: hasTrainingDays, hint: 'Selecione os dias acima' },
    { label: 'Peso registrado', done: hasBodyMetric, href: '/history', hint: 'Registre uma medida corporal' },
    { label: 'Fase de treino ativa', done: hasPhase, hint: 'Gere um plano com a IA' },
  ]

  const tier2Items: ReadinessItem[] = [
    ...items,
    { label: 'Pelo menos 1 treino registrado', done: hasWorkoutHistory, href: '/workout', hint: 'Complete seu primeiro treino' },
  ]

  const tier1Ready = items.every(i => i.done)
  const tier2Ready = tier2Items.every(i => i.done)

  return (
    <GlassCard className="p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-base mb-1">Dados necessários para a IA</h3>
        <p className="text-sm text-muted-foreground">
          Complete os itens abaixo para ativar o planejamento automático
        </p>
      </div>

      <div className="space-y-3">
        {tier2Items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className={cn('text-sm flex-1', item.done ? 'text-foreground' : 'text-muted-foreground')}>
              {item.label}
            </span>
            {!item.done && item.href && (
              <Link href={item.href}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                  {item.hint} <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            )}
            {!item.done && !item.href && item.hint && (
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            )}
          </div>
        ))}
      </div>

      {tier1Ready && !tier2Ready && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-3">
            Pronto para gerar seu plano inicial. O replanejamento semanal ficará disponível após o primeiro treino.
          </p>
          {onGeneratePlan && (
            <Button
              size="sm"
              onClick={onGeneratePlan}
              disabled={generating}
              className="gap-2"
            >
              {generating ? 'Gerando...' : 'Gerar Plano com IA'}
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  )
}
