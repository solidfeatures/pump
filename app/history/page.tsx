'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  TrendingUp,
  Dumbbell, 
  CheckCircle2,
  ChevronRight,
  BarChart3,
  User,
  Loader2,
  Target,
  Edit2,
  Check,
  Apple,
  Zap,
  Flame,
  Clock
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { muscleGroupLabels, muscleGroupColors, getExercisePrimaryMuscle } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { AthleteProfile, updateAthleteProfile } from '@/lib/db/athlete'
import { BodyMetric } from '@/lib/db/measures'
import { AthleteGoal } from '@/lib/types'
import { 
  updateProfileAction, 
  getProfileAction, 
  getLatestMetricsAction,
  getLatestNutritionPlanAction,
  getAllPhasesAction
} from '@/app/actions'
import { useEffect } from 'react'
import { NutritionPlan } from '@/lib/db/nutrition'

export default function HistoryPage() {
  const { sessions, getPRRecords, currentPhase } = useWorkout()
  const [activeTab, setActiveTab] = useState('list')
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null)
  const [latestMetrics, setLatestMetrics] = useState<BodyMetric | null>(null)
  const [latestNutrition, setLatestNutrition] = useState<NutritionPlan | null>(null)
  const [allPhases, setAllPhases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [updatingGoal, setUpdatingGoal] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [p, m, n, phases] = await Promise.all([
          getProfileAction(),
          getLatestMetricsAction(),
          getLatestNutritionPlanAction(),
          getAllPhasesAction()
        ])
        setAthleteProfile(p)
        setLatestMetrics(m)
        setLatestNutrition(n)
        setAllPhases(phases)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleUpdateGoal = async (newGoal: AthleteGoal) => {
    if (!athleteProfile) return
    setUpdatingGoal(true)
    try {
      const updated = await updateProfileAction({ id: athleteProfile.id, goal: newGoal })
      setAthleteProfile(updated)
      setIsEditingGoal(false)
      // Refresh nutrition plan if goal changes
      const n = await getLatestNutritionPlanAction()
      setLatestNutrition(n)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingGoal(false)
    }
  }

  const goalOptions: AthleteGoal[] = [
    'Crescer Seco',
    'Emagrecer',
    'Ganho de Peso',
    'Manutenção'
  ]
  
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

      {/* Resumo do Atleta e Nutrição */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-3"
        >
          <GlassCard className="overflow-hidden p-0 border-primary/20 h-full">
            <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Perfil do Atleta & Metas</h2>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    SÓCIO PUMP
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                    {currentPhase?.name || 'Sem Fase Ativa'}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Section 1: Objective & Phase */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Target className="w-3 h-3 text-primary" />
                      Objetivo Principal
                    </p>
                    {isEditingGoal ? (
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          className="w-full bg-black/60 border border-primary/30 rounded-xl text-sm p-2 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                          value={athleteProfile?.goal}
                          onChange={(e) => handleUpdateGoal(e.target.value as AthleteGoal)}
                          disabled={updatingGoal}
                        >
                          {goalOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {updatingGoal && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                        <p className="text-xl font-black text-primary tracking-tight">
                          {loading ? '...' : (athleteProfile?.goal || 'Crescer Seco')}
                        </p>
                        <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all ml-1" />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3 text-amber-500" />
                      Status do Macrociclo
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fase Atual</span>
                        <span className="font-bold text-white">{currentPhase?.name || '--'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Metodologia</span>
                        <span className="text-white/80">Jayme de Lamadrid</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Body Metrics */}
                <div className="space-y-4 md:border-l md:border-r border-white/5 md:px-8">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-blue-500" />
                    Medidas Atuais
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Peso</p>
                      <p className="text-2xl font-black tracking-tighter">
                        {loading ? '...' : (latestMetrics?.weight_kg ? `${latestMetrics.weight_kg}` : '--')}
                        <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">BF</p>
                      <p className="text-2xl font-black tracking-tighter">
                        {loading ? '...' : (latestMetrics?.bf_pct ? `${latestMetrics.bf_pct}` : '--')}
                        <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Consistência</span>
                      <span>85%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%]" />
                    </div>
                  </div>
                </div>

                {/* Section 3: AI Intelligence Nutrition */}
                <div className="space-y-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Apple className="w-3 h-3 text-emerald-500" />
                    Estratégia Nutricional
                  </p>
                  
                  {latestNutrition ? (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-emerald-500 tracking-tighter">{latestNutrition.calories_target}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">kcal/dia</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs font-bold text-emerald-400">{latestNutrition.protein_g}g</p>
                          <p className="text-[8px] text-muted-foreground uppercase">Prot</p>
                        </div>
                        <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs font-bold text-emerald-400">{latestNutrition.carbs_g}g</p>
                          <p className="text-[8px] text-muted-foreground uppercase">Carb</p>
                        </div>
                        <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs font-bold text-emerald-400">{latestNutrition.fat_g}g</p>
                          <p className="text-[8px] text-muted-foreground uppercase">Gord</p>
                        </div>
                      </div>
                      
                      <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-2 items-start">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-tight italic">
                          {latestNutrition.recommendations?.[0] || 'Plano otimizado para sua fase atual.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-4 text-center">
                      <Flame className="w-6 h-6 text-muted-foreground/30 mb-2" />
                      <p className="text-[10px] text-muted-foreground mb-2">Gere seu plano nutricional adaptativo</p>
                      <Link href="/nutrition">
                        <Button size="sm" className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-500">Configurar</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Training Phase Details - Bottom Row */}
              {currentPhase && (
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">RIR Alvo</p>
                      <p className="text-sm font-bold">{currentPhase.targetRirMin}-{currentPhase.targetRirMax}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tensão</p>
                      <p className="text-sm font-bold">{(Number(currentPhase.volumePctTension) * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Zap className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Metabólico</p>
                      <p className="text-sm font-bold">{(Number(currentPhase.volumePctMetabolic) * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="ml-auto hidden md:block">
                    <p className="text-[10px] text-muted-foreground leading-tight max-w-[300px] italic">
                      "A consistência é o que separa os amadores dos atletas. Siga o plano."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlassCard className="h-full flex flex-col justify-between border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500">
              <Dumbbell className="w-32 h-32 text-primary rotate-12" />
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Resumo Geral</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-black tracking-tighter">{overallStats.totalWorkouts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Treinos Concluídos</p>
                </div>
                
                <div>
                  <p className="text-3xl font-black tracking-tighter">{overallStats.totalSets}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Séries Totais</p>
                </div>
                
                <div>
                  <p className="text-3xl font-black tracking-tighter">
                    {overallStats.totalVolume >= 1000 
                      ? `${(overallStats.totalVolume / 1000).toFixed(1)}k` 
                      : overallStats.totalVolume}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Volume Total (kg)</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Button asChild variant="outline" className="w-full border-primary/20 hover:bg-primary/10 text-xs h-9">
                <Link href="/measures">Atualizar Medidas</Link>
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      
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
      
      <div className="space-y-8 mt-12">
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
            {prRecords.length === 0 && (
              <div className="col-span-3 text-center py-4 text-muted-foreground text-sm italic">
                Nenhum recorde pessoal registrado ainda.
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Workout History List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Histórico de Treinos</h2>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
              {completedSessions.length} treinos concluídos
            </span>
          </div>
          
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
      </div>
    </div>
  )
}
