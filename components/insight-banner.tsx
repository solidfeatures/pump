'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type InsightTone = 'info' | 'success' | 'warning' | 'ai'

interface InsightBannerProps {
  text: string
  tone?: InsightTone
  icon?: LucideIcon
  cta?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

const TONE_STYLES: Record<InsightTone, string> = {
  info:    'border-blue-500/25 bg-blue-500/5 text-blue-300',
  success: 'border-green-500/25 bg-green-500/5 text-green-300',
  warning: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
  ai:      'border-primary/25 bg-primary/5 text-primary',
}

export function InsightBanner({ text, tone = 'ai', icon: Icon, cta, className }: InsightBannerProps) {
  const DefaultIcon = Icon ?? Sparkles

  const ctaEl = cta && (cta.href ? (
    <Link
      href={cta.href}
      className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
    >
      {cta.label}
      <ArrowRight className="w-3 h-3" />
    </Link>
  ) : (
    <button
      onClick={cta.onClick}
      className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
    >
      {cta.label}
      <ArrowRight className="w-3 h-3" />
    </button>
  ))

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border',
        TONE_STYLES[tone],
        className,
      )}
    >
      <div className="p-1 rounded-md bg-current/10 shrink-0">
        <DefaultIcon className="w-3.5 h-3.5" />
      </div>
      <p className="text-sm leading-snug flex-1 text-foreground/90">
        {text}
      </p>
      {ctaEl}
    </motion.div>
  )
}
