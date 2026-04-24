'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type HeroCardVariant = 'primary' | 'muted' | 'warning'

interface HeroCardCTA {
  label: string
  onClick?: () => void
  href?: string
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
}

interface HeroCardProps {
  eyebrow?: string
  title: string
  subtitle?: string
  insight?: string
  cta?: HeroCardCTA
  secondaryCta?: HeroCardCTA
  variant?: HeroCardVariant
  icon?: LucideIcon
  chips?: string[]
  children?: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<HeroCardVariant, string> = {
  primary: 'border-primary/20',
  muted: 'border-white/10',
  warning: 'border-amber-500/30',
}

const VARIANT_GLOW: Record<HeroCardVariant, string> = {
  primary: 'bg-primary/10',
  muted: 'bg-white/5',
  warning: 'bg-amber-500/10',
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  insight,
  cta,
  secondaryCta,
  variant = 'primary',
  icon: Icon,
  chips,
  children,
  className,
}: HeroCardProps) {
  return (
    <GlassCard
      className={cn(
        'relative overflow-hidden p-6 md:p-8',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {/* Ambient glow */}
      <div
        className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none',
          VARIANT_GLOW[variant],
        )}
      />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className={cn(
              'text-xs font-semibold uppercase tracking-wider mb-1.5',
              variant === 'primary' && 'text-primary',
              variant === 'warning' && 'text-amber-400',
              variant === 'muted' && 'text-muted-foreground',
            )}>
              {eyebrow}
            </p>
          )}

          <div className="flex items-start gap-3">
            {Icon && (
              <div className={cn(
                'p-2 rounded-xl shrink-0 hidden sm:block',
                variant === 'primary' && 'bg-primary/15 text-primary',
                variant === 'warning' && 'bg-amber-500/15 text-amber-400',
                variant === 'muted' && 'bg-white/5 text-muted-foreground',
              )}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1.5">
                  {subtitle}
                </p>
              )}

              {chips && chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {chips.map((chip, i) => (
                    <motion.span
                      key={chip}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/80"
                    >
                      {chip}
                    </motion.span>
                  ))}
                </div>
              )}

              {insight && (
                <p className="text-sm text-muted-foreground italic mt-3 leading-relaxed">
                  {insight}
                </p>
              )}

              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>
        </div>

        {(cta || secondaryCta) && (
          <div className="flex items-center gap-2 md:shrink-0">
            {secondaryCta && (
              <CtaButton cta={secondaryCta} variant="ghost" />
            )}
            {cta && (
              <CtaButton cta={cta} variant={variant} />
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function CtaButton({ cta, variant }: { cta: HeroCardCTA; variant: 'primary' | 'muted' | 'warning' | 'ghost' }) {
  const Icon = cta.icon
  const content = (
    <>
      {Icon && <Icon className="w-5 h-5" />}
      {cta.label}
    </>
  )

  const className = cn(
    'gap-2 font-semibold',
    variant === 'ghost' ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'min-w-[140px]',
    variant === 'warning' && 'bg-amber-500 hover:bg-amber-600 text-amber-950',
    variant === 'muted' && variant !== ('ghost' as string) && 'bg-white/10 hover:bg-white/15',
  )

  if (cta.href) {
    return (
      <a href={cta.href}>
        <Button disabled={cta.disabled || cta.loading} size="lg" variant={variant === 'ghost' ? 'outline' : 'default'} className={className}>
          {content}
        </Button>
      </a>
    )
  }

  return (
    <Button
      onClick={cta.onClick}
      disabled={cta.disabled || cta.loading}
      size="lg"
      variant={variant === 'ghost' ? 'outline' : 'default'}
      className={className}
    >
      {content}
    </Button>
  )
}
