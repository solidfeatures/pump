'use client'

import { Bot, Calendar, AlertTriangle, RefreshCw } from 'lucide-react'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AiSettings {
  auto_weekly_plan: boolean
  auto_contingency_plan: boolean
  auto_phase_alert: boolean
}

interface AiSettingsPanelProps {
  settings: AiSettings
  onChange: (key: keyof AiSettings, value: boolean) => void
  disabled?: boolean
}

const SETTINGS = [
  {
    key: 'auto_weekly_plan' as keyof AiSettings,
    icon: Calendar,
    label: 'Replanejamento Semanal Automático',
    description: 'A IA gera automaticamente as sessões da semana toda segunda-feira com base no treino anterior',
  },
  {
    key: 'auto_contingency_plan' as keyof AiSettings,
    icon: RefreshCw,
    label: 'Replanejamento por Contingência',
    description: 'Após cada treino, a IA redistribui séries perdidas nas sessões restantes da semana',
  },
  {
    key: 'auto_phase_alert' as keyof AiSettings,
    icon: AlertTriangle,
    label: 'Alertas de Transição de Fase',
    description: 'Notifica quando uma fase atinge o limite de semanas e sugere iniciar a próxima',
  },
]

export function AiSettingsPanel({ settings, onChange, disabled }: AiSettingsPanelProps) {
  return (
    <GlassCard className="p-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-5 h-5 text-primary" />
        <GlassCardTitle>Automação de IA</GlassCardTitle>
      </div>

      <div className="space-y-4">
        {SETTINGS.map(({ key, icon: Icon, label, description }) => (
          <div
            key={key}
            className={cn(
              'flex items-start gap-4 p-3 rounded-lg transition-colors',
              settings[key] ? 'bg-white/5' : 'bg-white/[0.02]'
            )}
          >
            <div className={cn(
              'mt-0.5 p-1.5 rounded-md shrink-0',
              settings[key] ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={key}
                className="text-sm font-medium cursor-pointer"
              >
                {label}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={v => onChange(key, v)}
              disabled={disabled}
              className="shrink-0 mt-0.5"
            />
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
