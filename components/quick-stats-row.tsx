'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface QuickStat {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  delta?: { value: number; label?: string } | null
  tone?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}

interface QuickStatsRowProps {
  stats: QuickStat[]
  className?: string
  /** Grid columns — defaults to `grid-cols-2 md:grid-cols-4` */
  columns?: string
}

const TONE_STYLES = {
  default: 'text-foreground',
  success: 'text-green-400',
  warning: 'text-amber-400',
  danger:  'text-red-400',
} as const

const TONE_ICON_BG = {
  default: 'bg-white/5 text-muted-foreground',
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger:  'bg-red-500/15 text-red-400',
} as const

export function QuickStatsRow({ stats, className, columns = 'grid-cols-2 md:grid-cols-4' }: QuickStatsRowProps) {
  return (
    <div className={cn('grid gap-3', columns, className)}>
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const tone = stat.tone ?? 'default'
        const hasDelta = stat.delta != null
        const deltaUp = hasDelta && stat.delta!.value > 0
        const deltaDown = hasDelta && stat.delta!.value < 0
        const deltaFlat = hasDelta && stat.delta!.value === 0

        return (
          <motion.button
            key={`${stat.label}-${i}`}
            type="button"
            onClick={stat.onClick}
            disabled={!stat.onClick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn(
              'glass-subtle rounded-2xl p-4 text-left relative overflow-hidden group',
              'border border-white/5 transition-all',
              stat.onClick && 'cursor-pointer hover:border-white/15 hover:bg-white/5',
            )}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn('p-1.5 rounded-lg', TONE_ICON_BG[tone])}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {hasDelta && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  deltaUp && 'text-green-400',
                  deltaDown && 'text-red-400',
                  deltaFlat && 'text-muted-foreground',
                )}>
                  {deltaUp && <ArrowUp className="w-3 h-3" />}
                  {deltaDown && <ArrowDown className="w-3 h-3" />}
                  {deltaFlat && <Minus className="w-3 h-3" />}
                  <span>{Math.abs(stat.delta!.value)}{stat.delta?.label ?? '%'}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              {stat.label}
            </p>

            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl md:text-3xl font-black tracking-tighter leading-none', TONE_STYLES[tone])}>
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-xs font-medium text-muted-foreground">{stat.unit}</span>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
