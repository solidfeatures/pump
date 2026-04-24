'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DAYS = [
  { value: 1, label: 'Seg', full: 'Segunda' },
  { value: 2, label: 'Ter', full: 'Terça' },
  { value: 3, label: 'Qua', full: 'Quarta' },
  { value: 4, label: 'Qui', full: 'Quinta' },
  { value: 5, label: 'Sex', full: 'Sexta' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
  { value: 7, label: 'Dom', full: 'Domingo' },
]

interface WeeklyDaySelectorProps {
  value: number[]
  onChange?: (days: number[]) => void
  disabled?: boolean
}

export function WeeklyDaySelector({ value, onChange, disabled }: WeeklyDaySelectorProps) {
  const [saving, setSaving] = useState(false)

  const toggle = async (day: number) => {
    if (saving || disabled) return

    const newDays = value.includes(day)
      ? value.filter(d => d !== day)
      : [...value, day].sort((a, b) => a - b)

    if (newDays.length < 2) {
      toast.error('Selecione pelo menos 2 dias de treino')
      return
    }

    onChange?.(newDays)
    setSaving(true)
    try {
      const res = await fetch('/api/plan/training-days', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_day_mask: newDays }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
    } catch {
      toast.error('Erro ao salvar dias de treino')
      onChange?.(value)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map(day => {
        const active = value.includes(day.value)
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            disabled={disabled || saving}
            title={day.full}
            className={cn(
              'w-10 h-10 rounded-lg text-sm font-medium transition-all select-none',
              'border focus:outline-none focus:ring-1 focus:ring-primary',
              active
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 hover:text-foreground',
              (disabled || saving) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
