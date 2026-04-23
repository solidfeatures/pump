'use client'

import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { useWorkout } from '@/lib/workout-context'
import { useMemo } from 'react'
import { isWorkingSet } from '@/lib/periodization'
import { Dumbbell, TrendingUp, Zap, BarChart2 } from 'lucide-react'

export function WeeklyStats() {
  const { sessions } = useWorkout()
  
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]

    const weeklySessions = sessions.filter(
      (s) => s.status === 'completed' && s.date >= weekAgo && s.date <= today
    )

    const allSets = weeklySessions.flatMap((s) => s.exercises?.flatMap((ex) => ex.sets) ?? [])
    const workingSets = allSets.filter((set) => isWorkingSet(set))

    const weeklyTonnage = workingSets.reduce(
      (acc, set) => acc + ((set.loadKg ?? 0) * (set.reps ?? 0)),
      0
    )
    const avgRpe = workingSets.filter((s) => s.rpe !== null).length > 0
      ? workingSets.filter((s) => s.rpe !== null).reduce((acc, s) => acc + (s.rpe ?? 0), 0) /
        workingSets.filter((s) => s.rpe !== null).length
      : null

    return {
      workouts: weeklySessions.length,
      workingSets: workingSets.length,
      weeklyTonnage,
      avgRpe,
    }
  }, [sessions])
  
  const statItems = [
    {
      label: 'Treinos',
      value: stats.workouts,
      icon: Dumbbell,
      suffix: '',
      color: 'text-primary',
    },
    {
      label: 'Séries Efetivas',
      value: stats.workingSets,
      icon: TrendingUp,
      suffix: '',
      color: 'text-emerald-400',
    },
    {
      label: 'Tonelagem',
      value: stats.weeklyTonnage >= 1000
        ? `${(stats.weeklyTonnage / 1000).toFixed(1)}k`
        : stats.weeklyTonnage,
      icon: Zap,
      suffix: ' kg',
      color: 'text-cyan-400',
    },
    {
      label: 'RPE Médio',
      value: stats.avgRpe !== null ? stats.avgRpe.toFixed(1) : '—',
      icon: BarChart2,
      suffix: '',
      color: 'text-amber-400',
    },
  ]
  
  return (
    <GlassCard delay={0.4}>
      <GlassCardTitle className="mb-4">Esta Semana</GlassCardTitle>
      
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="glass-subtle rounded-xl p-3"
          >
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-bold">
              {stat.value}{stat.suffix}
            </p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
