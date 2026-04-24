'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  icon?: LucideIcon
}

interface EmptyStateGuideProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
  /** Compact = uses less vertical space */
  compact?: boolean
}

export function EmptyStateGuide({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'py-6 gap-2' : 'py-10 gap-3',
        className,
      )}
    >
      <div className={cn(
        'rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center',
        compact ? 'w-12 h-12' : 'w-16 h-16 mb-1',
      )}>
        <Icon className={cn('text-muted-foreground', compact ? 'w-5 h-5' : 'w-7 h-7')} />
      </div>

      <h3 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>

      <p className={cn(
        'text-muted-foreground max-w-sm leading-relaxed',
        compact ? 'text-xs' : 'text-sm',
      )}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className={cn('flex items-center gap-2 flex-wrap justify-center', compact ? 'mt-1' : 'mt-3')}>
          {action && <ActionButton action={action} primary />}
          {secondaryAction && <ActionButton action={secondaryAction} primary={false} />}
        </div>
      )}
    </motion.div>
  )
}

function ActionButton({ action, primary }: { action: EmptyStateAction; primary: boolean }) {
  const Icon = action.icon
  const body = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {action.label}
    </>
  )

  const btnClass = cn('gap-2', !primary && 'border-white/10 bg-white/5')

  if (action.href) {
    return (
      <Link href={action.href}>
        <Button size="sm" variant={primary ? 'default' : 'outline'} className={btnClass}>
          {body}
        </Button>
      </Link>
    )
  }
  return (
    <Button size="sm" variant={primary ? 'default' : 'outline'} onClick={action.onClick} className={btnClass}>
      {body}
    </Button>
  )
}
