'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { WorkoutCalendar } from '@/components/workout-calendar'
import { ProgressionCharts } from '@/components/progression-charts'
import { ExerciseProgressionTable } from '@/components/exercise-progression-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  TrendingUp, 
  Dumbbell, 
  CheckCircle2,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { muscleGroupLabels, muscleGroupColors, getExercisePrimaryMuscle } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function HistoryPage() {
  const { sessions, getPRRecords } = useWorkout()
  const [activeTab, setActiveTab] = useState('calendar')
  
  const completedSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
  }, [sessions])
  
  const prRecords = useMemo(() => getPRRecords(), [getPRRecords])
  
  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalSets = 0
    let totalVolume = 0
    const totalWorkouts = completedSessions.length
    
    completedSessions.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.completed) {
            totalSets++
            totalVolume += (set.loadKg || 0) * (set.reps || 0)
          }
        })
      })
    })
    
    return { totalWorkouts, totalSets, totalVolume }
  }, [completedSessions])
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Histórico</h1>
        <p className="text-muted-foreground">
          Revise seus treinos anteriores e acompanhe seu progresso.
        </p>
      </motion.div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Treinos', value: overallStats.totalWorkouts, icon: Dumbbell },
          { label: 'Séries Totais', value: overallStats.totalSets, icon: CheckCircle2 },
          { label: 'Volume (kg)', value: overallStats.totalVolume >= 1000 
            ? `${(overallStats.totalVolume / 1000).toFixed(1)}k` 
            : overallStats.totalVolume, 
            icon: TrendingUp 
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="text-center">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="progression" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Progressão
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-6">
          <GlassCard>
            <GlassCardTitle className="mb-4">Calendário de Treinos</GlassCardTitle>
            <WorkoutCalendar />
          </GlassCard>
        </TabsContent>
        
        <TabsContent value="progression" className="space-y-6">
          <ExerciseProgressionTable />
          <ProgressionCharts />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-6">
          {/* Recent PRs */}
          <GlassCard>
            <GlassCardTitle className="mb-4">Recordes Recentes</GlassCardTitle>
            <div className="grid md:grid-cols-3 gap-3">
              {prRecords.slice(0, 3).map((pr, index) => (
                <motion.div
                  key={pr.exerciseId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div>
                    <p className="font-medium text-sm">{pr.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(pr.date), "d 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{pr.weight}kg</p>
                    <p className="text-xs text-muted-foreground">x{pr.reps}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
          
          {/* Workout History List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Histórico de Treinos</h2>
            
            <div className="space-y-3">
              {completedSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/workout/${session.id}`}>
                    <GlassCard hover className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{session.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(session.date), "EEE, d 'de' MMM", { locale: ptBR })}
                            </div>
                            <span>
                              {session.exercises?.length || 0} exercícios
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Muscle groups worked */}
                        <div className="hidden md:flex gap-1">
                          {session.exercises && [...new Set(session.exercises.map(e => getExercisePrimaryMuscle(e.exerciseId)))]
                            .slice(0, 3)
                            .map(muscle => (
                              <span
                                key={muscle}
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  muscleGroupColors[muscle],
                                  "text-white/90"
                                )}
                              >
                                {muscleGroupLabels[muscle]}
                              </span>
                            ))
                          }
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
              
              {completedSessions.length === 0 && (
                <GlassCard className="text-center py-12">
                  <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhum treino concluído ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete seu primeiro treino para vê-lo aqui
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
