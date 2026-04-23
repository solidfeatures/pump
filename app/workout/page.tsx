'use client'

import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

export default function WorkoutListPage() {
  const { sessions, getTodaysWorkout } = useWorkout()
  const todayWorkout = getTodaysWorkout()
  
  const upcomingWorkouts = sessions.filter(s => {
    const sessionDate = parseISO(s.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate >= today && s.status !== 'completed'
  }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
  
  const completedWorkouts = sessions.filter(s => s.status === 'completed')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Treinos</h1>
        <p className="text-muted-foreground">
          Veja e inicie suas sessões de treino.
        </p>
      </motion.div>
      
      {/* Today's Workout Highlight */}
      {todayWorkout && todayWorkout.status !== 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard glow className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-primary mb-1">Hoje</p>
                <h2 className="text-2xl font-bold tracking-tight">{todayWorkout.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {(todayWorkout.exercises ?? []).length} exercises - {(todayWorkout.exercises ?? []).reduce((acc, ex) => acc + ex.sets.length, 0)} sets
                </p>
              </div>
              
              <Link href={`/workout/${todayWorkout.id}`}>
                <Button className="gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Iniciar
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      )}
      
      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingWorkouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/workout/${workout.id}`}>
                  <GlassCard hover className="h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(workout.date), 'EEE, MMM d')}
                        </p>
                        <GlassCardTitle className="mt-1">{workout.name}</GlassCardTitle>
                      </div>
                      <PlayCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(workout.exercises ?? []).length} exercícios
                    </p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Workouts */}
      {completedWorkouts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Concluídos Recentemente
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedWorkouts.slice(0, 6).map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/workout/${workout.id}`}>
                  <GlassCard hover className="h-full opacity-80">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(workout.date), 'EEE, MMM d')}
                        </p>
                        <GlassCardTitle className="mt-1">{workout.name}</GlassCardTitle>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(workout.exercises ?? []).reduce(
                        (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
                        0
                      )} séries completadas
                    </p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
