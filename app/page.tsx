'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { WorkoutCalendar } from '@/components/workout-calendar'
import { VolumeChart } from '@/components/volume-chart'
import { TodayWorkout } from '@/components/today-workout'
import { PhaseProgress } from '@/components/phase-progress'
import { WeeklyStats } from '@/components/weekly-stats'
import { ProgressionCharts } from '@/components/progression-charts'
import { MuscleVolumePanel } from '@/components/muscle-volume-panel'
import { PhaseTransitionAlert } from '@/components/phase-transition-alert'
import { ExerciseProgressionTable } from '@/components/exercise-progression-table'
import { DayNav } from '@/components/day-nav'
import { MiniCalendar } from '@/components/mini-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, TrendingUp, LayoutDashboard, PieChart } from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const handlePrevDay = () => {
    setViewDate(prev => format(subDays(parseISO(prev), 1), 'yyyy-MM-dd'))
  }
  
  const handleNextDay = () => {
    setViewDate(prev => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'))
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-balance">
          Antigravity
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e alcance seus objetivos.
        </p>
      </motion.div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <PieChart className="w-4 h-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Progressão
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <PhaseTransitionAlert />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top row */}
            <div className="lg:col-span-2">
              <DayNav date={viewDate} onPrev={handlePrevDay} onNext={handleNextDay} className="h-[380px]" />
            </div>
            
            <div className="lg:col-span-1">
              <MiniCalendar 
                selectedDate={viewDate} 
                onDayClick={setViewDate} 
                className="h-[380px]"
              />
            </div>

            {/* Bottom row */}
            <div className="lg:col-span-3">
              <GlassCard>
                <GlassCardTitle className="mb-4">Visualização Semanal</GlassCardTitle>
                <WorkoutCalendar 
                  initialView="week" 
                  onDateSelect={(d) => setViewDate(format(d, 'yyyy-MM-dd'))} 
                  selectedDate={parseISO(viewDate)} 
                />
              </GlassCard>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyStats />
            <PhaseProgress />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <GlassCard>
                <GlassCardTitle className="mb-4">Volume Semanal por Músculo</GlassCardTitle>
                <VolumeChart />
              </GlassCard>
            </div>
            <MuscleVolumePanel />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <GlassCard>
            <GlassCardTitle className="mb-4">Calendário de Treinos</GlassCardTitle>
            <WorkoutCalendar onDateSelect={(d) => {
              setViewDate(format(d, 'yyyy-MM-dd'))
              setActiveTab('overview')
            }} />
          </GlassCard>
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          <ExerciseProgressionTable />
          <ProgressionCharts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
