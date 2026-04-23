'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Trophy, Target } from 'lucide-react'
import { format, parseISO, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type ChartType = 'weight' | 'volume' | 'oneRm' | 'comparison'

export function ProgressionCharts() {
  const { exercises, getProgressionData, getPRRecords } = useWorkout()
  const [selectedExercise, setSelectedExercise] = useState<string>('1')
  const [chartType, setChartType] = useState<ChartType>('weight')
  
  const progressionData = useMemo(() => {
    return getProgressionData(selectedExercise)
  }, [selectedExercise, getProgressionData])
  
  const prRecords = useMemo(() => getPRRecords(), [getPRRecords])
  
  // Calculate trend
  const trend = useMemo(() => {
    if (progressionData.length < 2) return { direction: 'neutral', percentage: 0 }
    
    const recent = progressionData.slice(-3)
    const older = progressionData.slice(0, 3)
    
    const recentAvg = recent.reduce((sum, d) => sum + d.weight, 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + d.weight, 0) / older.length
    
    const percentage = ((recentAvg - olderAvg) / olderAvg) * 100
    
    return {
      direction: percentage > 2 ? 'up' : percentage < -2 ? 'down' : 'neutral',
      percentage: Math.abs(percentage).toFixed(1)
    }
  }, [progressionData])
  
  // Comparison data (recent vs past)
  const comparisonData = useMemo(() => {
    const midpoint = Math.floor(progressionData.length / 2)
    const pastData = progressionData.slice(0, midpoint)
    const recentData = progressionData.slice(midpoint)
    
    return {
      past: {
        avgWeight: pastData.length > 0 ? pastData.reduce((s, d) => s + d.weight, 0) / pastData.length : 0,
        avgVolume: pastData.length > 0 ? pastData.reduce((s, d) => s + d.volume, 0) / pastData.length : 0,
        avgOneRm: pastData.length > 0 ? pastData.reduce((s, d) => s + d.oneRm, 0) / pastData.length : 0,
      },
      recent: {
        avgWeight: recentData.length > 0 ? recentData.reduce((s, d) => s + d.weight, 0) / recentData.length : 0,
        avgVolume: recentData.length > 0 ? recentData.reduce((s, d) => s + d.volume, 0) / recentData.length : 0,
        avgOneRm: recentData.length > 0 ? recentData.reduce((s, d) => s + d.oneRm, 0) / recentData.length : 0,
      }
    }
  }, [progressionData])
  
  const exerciseName = exercises.find(e => e.id === selectedExercise)?.name || 'Exercício'
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-56 bg-white/5 border-white/10">
            <SelectValue placeholder="Selecione o exercício" />
          </SelectTrigger>
          <SelectContent className="glass border-white/10">
            {exercises.map(ex => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center bg-white/5 rounded-lg p-1">
          {([
            { key: 'weight', label: 'Carga' },
            { key: 'volume', label: 'Volume' },
            { key: 'oneRm', label: '1RM Est.' },
            { key: 'comparison', label: 'Comparação' },
          ] as { key: ChartType; label: string }[]).map(({ key, label }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setChartType(key)}
              className={cn(
                "text-xs px-3",
                chartType === key && "bg-primary/20 text-primary"
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Trend indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {trend.direction === 'up' && <TrendingUp className="w-5 h-5 text-primary" />}
          {trend.direction === 'down' && <TrendingDown className="w-5 h-5 text-red-400" />}
          {trend.direction === 'neutral' && <Minus className="w-5 h-5 text-muted-foreground" />}
          <span className="text-sm">
            {trend.direction === 'up' && `+${trend.percentage}% de progresso`}
            {trend.direction === 'down' && `-${trend.percentage}% de redução`}
            {trend.direction === 'neutral' && 'Estável'}
          </span>
        </div>
        
        <span className="text-sm text-muted-foreground">
          Últimas 8 semanas - {exerciseName}
        </span>
      </div>
      
      {/* Main Chart */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <GlassCardTitle>
            {chartType === 'weight' && 'Progressão de Carga'}
            {chartType === 'volume' && 'Volume Total'}
            {chartType === 'oneRm' && '1RM Estimado (Epley)'}
            {chartType === 'comparison' && 'Comparação: Passado vs Recente'}
          </GlassCardTitle>
        </div>
        
        <div className="h-80 p-4">
          {chartType !== 'comparison' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.72 0.17 162)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="oklch(0.72 0.17 162)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 12 }}
                  tickFormatter={(value) => format(parseISO(value), 'd MMM', { locale: ptBR })}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 12 }}
                  width={50}
                  tickFormatter={(value) => `${value}${chartType === 'weight' || chartType === 'oneRm' ? 'kg' : ''}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.16 0.005 285 / 0.95)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                  }}
                  labelStyle={{ color: 'oklch(0.98 0 0)' }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}${chartType === 'weight' || chartType === 'oneRm' ? 'kg' : ''}`,
                    chartType === 'weight' ? 'Carga' : chartType === 'volume' ? 'Volume' : '1RM'
                  ]}
                  labelFormatter={(value) => format(parseISO(value as string), "d 'de' MMMM", { locale: ptBR })}
                />
                <Area 
                  type="monotone" 
                  dataKey={chartType} 
                  stroke="oklch(0.72 0.17 162)"
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                  dot={{ fill: 'oklch(0.72 0.17 162)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Carga (kg)', passado: comparisonData.past.avgWeight, recente: comparisonData.recent.avgWeight },
                  { name: 'Volume', passado: comparisonData.past.avgVolume / 10, recente: comparisonData.recent.avgVolume / 10 },
                  { name: '1RM Est.', passado: comparisonData.past.avgOneRm, recente: comparisonData.recent.avgOneRm },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis type="number" tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.16 0.005 285 / 0.95)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="passado" name="4 sem. atrás" fill="oklch(0.5 0.1 285)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="recente" name="Últimas 4 sem." fill="oklch(0.72 0.17 162)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Melhor Carga"
          value={`${Math.max(...progressionData.map(d => d.weight)).toFixed(1)}kg`}
          icon={<Trophy className="w-5 h-5" />}
          trend={trend.direction === 'up' ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Maior Volume"
          value={Math.max(...progressionData.map(d => d.volume)).toFixed(0)}
          icon={<Target className="w-5 h-5" />}
          trend="neutral"
        />
        <StatsCard
          title="1RM Estimado"
          value={`${Math.max(...progressionData.map(d => d.oneRm)).toFixed(1)}kg`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={trend.direction as 'up' | 'down' | 'neutral'}
        />
        <StatsCard
          title="Treinos"
          value={progressionData.length.toString()}
          icon={<Target className="w-5 h-5" />}
          trend="neutral"
        />
      </div>
      
      {/* PR Records */}
      <GlassCard>
        <GlassCardTitle className="mb-4">Recordes Pessoais (PRs)</GlassCardTitle>
        <div className="space-y-3">
          {prRecords.map((pr, index) => (
            <motion.div
              key={pr.exerciseId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  index === 0 ? "bg-amber-500/20 text-amber-400" :
                  index === 1 ? "bg-slate-400/20 text-slate-300" :
                  index === 2 ? "bg-orange-600/20 text-orange-400" :
                  "bg-white/10 text-muted-foreground"
                )}>
                  {index < 3 ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold">{pr.exerciseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(pr.date), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{pr.weight}kg</p>
                <p className="text-sm text-muted-foreground">x{pr.reps} reps</p>
                <p className="text-xs text-muted-foreground">1RM: {pr.oneRm.toFixed(1)}kg</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className="text-center">
        <div className={cn(
          "w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center",
          trend === 'up' ? "bg-primary/20 text-primary" :
          trend === 'down' ? "bg-red-400/20 text-red-400" :
          "bg-white/10 text-muted-foreground"
        )}>
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </GlassCard>
    </motion.div>
  )
}
