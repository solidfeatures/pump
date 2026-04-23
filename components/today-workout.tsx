'use client'

import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle2, Dumbbell, Clock } from 'lucide-react'
import Link from 'next/link'

export function TodayWorkout() {
  const { getTodaysWorkout } = useWorkout()
  const todayWorkout = getTodaysWorkout()
  
  if (!todayWorkout) {
    return (
      <GlassCard className="border-dashed border-white/10">
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Dia de Descanso</p>
            <p className="text-sm mt-1">Nenhum treino programado para hoje</p>
          </div>
        </div>
      </GlassCard>
    )
  }
  
  const isCompleted = todayWorkout.status === 'completed'
  const isInProgress = todayWorkout.status === 'in-progress'
  const exerciseCount = todayWorkout.exercises?.length || 0
  const totalSets = todayWorkout.exercises?.reduce((acc, ex) => acc + ex.sets.length, 0) || 0
  const completedSets = todayWorkout.exercises?.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 
    0
  ) || 0
  
  return (
    <GlassCard glow={!isCompleted} className="relative overflow-hidden">
      {/* Background gradient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {isCompleted ? 'Concluído' : isInProgress ? 'Em Progresso' : 'Treino de Hoje'}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">{todayWorkout.name}</h2>
          </div>
          
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~45 min</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-6 mb-6">
          <div>
            <p className="text-2xl font-bold">{exerciseCount}</p>
            <p className="text-xs text-muted-foreground">Exercícios</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-2xl font-bold">{totalSets}</p>
            <p className="text-xs text-muted-foreground">Séries</p>
          </div>
          {(isInProgress || isCompleted) && totalSets > 0 && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold">{completedSets}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </>
          )}
        </div>
        
        {/* Progress bar */}
        {(isInProgress || isCompleted) && totalSets > 0 && (
          <div className="mb-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedSets / totalSets) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((completedSets / totalSets) * 100)}% completo
            </p>
          </div>
        )}
        
        <Link href={`/workout/${todayWorkout.id}`}>
          <Button 
            className="w-full h-12 text-base font-semibold gap-2"
            variant={isCompleted ? "secondary" : "default"}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Ver Treino
              </>
            ) : isInProgress ? (
              <>
                <PlayCircle className="w-5 h-5" />
                Continuar Treino
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Iniciar Treino
              </>
            )}
          </Button>
        </Link>
      </div>
    </GlassCard>
  )
}
