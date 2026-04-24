'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { PhaseCard } from '@/components/phase-card'
import { SessionPlanCard } from '@/components/session-plan-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Layers, Target, PlayCircle, X, Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight, Wand2, Trash2 } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { DroppableDay, DraggableSession, SessionDetailDialog, PhaseDialog, AddPlannedSessionDialog } from './components'
import { TrainingConfigPanel } from '@/components/training-config-panel'
import { WeeklyDaySelector } from '@/components/weekly-day-selector'
import { WeekPlanStatus } from '@/components/week-plan-status'
import { moveSessionAction, deletePlannedSessionAction, deleteTrainingPhaseAction, getAllPlannedSessionsAction } from './actions'
import { getAllPhasesAction, getProfileAction } from '@/app/actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlannedSession, PlannedExercise, TrainingPhase } from '@/lib/types'
import { extractYouTubeId } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ReplanResult {
  analysis: string[]
  recommendations: string[]
  phaseSuggestions: {
    phaseId: string
    label: string
    current: string | number | null
    suggested: string | number
    reason: string
  }[]
  context: Record<string, unknown>
}

interface GeneratePlanResult {
  success: boolean
  summary: {
    level: string
    split: string
    phasesCreated: number
    sessionsCreated: number
    exercisesAssigned: number
    totalWeeks: number
    phases: { name: string; durationWeeks: number; sessions: number }[]
  }
}

export default function PlanPage() {
  const { plannedExercises, exercises } = useWorkout()
  const [phases, setPhases] = useState<TrainingPhase[]>([])
  const [dbSessions, setDbSessions] = useState<PlannedSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [phasesLoading, setPhasesLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sessions')
  const [trainingDayMask, setTrainingDayMask] = useState<number[]>([1, 3, 5])
  const [autoWeeklyPlan, setAutoWeeklyPlan] = useState(true)
  // AI Replan state
  const [replanOpen, setReplanOpen] = useState(false)
  const [replanLoading, setReplanLoading] = useState(false)
  const [replanResult, setReplanResult] = useState<ReplanResult | null>(null)
  const [replanError, setReplanError] = useState<string | null>(null)
  // AI Generate Plan state
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateResult, setGenerateResult] = useState<GeneratePlanResult | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateOverwrite, setGenerateOverwrite] = useState(false)
  const [generateNutrition, setGenerateNutrition] = useState(true)

  const loadPhases = useCallback(async () => {
    setPhasesLoading(true)
    setSessionsLoading(true)
    try {
      const [phasesData, sessionsData, profileData] = await Promise.all([
        getAllPhasesAction(),
        getAllPlannedSessionsAction(),
        getProfileAction(),
      ])
      setPhases(phasesData)
      setDbSessions(sessionsData)
      if (profileData) {
        setTrainingDayMask(profileData.training_day_mask ?? [1, 3, 5])
        setAutoWeeklyPlan(profileData.auto_weekly_plan ?? true)
      }
    } catch {
      toast.error('Erro ao carregar fases')
    } finally {
      setPhasesLoading(false)
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => { loadPhases() }, [loadPhases])

  const handleReplan = async () => {
    setReplanLoading(true)
    setReplanError(null)
    setReplanResult(null)
    setReplanOpen(true)
    try {
      const res = await fetch('/api/ai/replan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na análise')
      setReplanResult(data)
    } catch (e: any) {
      setReplanError(e.message || 'Erro ao conectar com o servidor')
    } finally {
      setReplanLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerateLoading(true)
    setGenerateError(null)
    setGenerateResult(null)
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: generateOverwrite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar plano')
      setGenerateResult(data)
      if (generateNutrition) {
        // Fire nutrition generation in background — ignore errors
        fetch('/api/ai/nutrition', { method: 'POST' }).catch(() => {})
      }
    } catch (e: any) {
      setGenerateError(e.message || 'Erro ao conectar com o servidor')
    } finally {
      setGenerateLoading(false)
    }
  }

  const [selectedSession, setSelectedSession] = useState<PlannedSession | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Dialog states
  const [isAddingPhase, setIsAddingPhase] = useState(false)
  const [editingPhase, setEditingPhase] = useState<TrainingPhase | null>(null)
  const [isAddingSession, setIsAddingSession] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const sessionId = active.id as string
      let newDayOfWeek: number | undefined

      if (over.data.current?.type === 'Day') {
        newDayOfWeek = over.data.current.dayOfWeek
      } else if (over.data.current?.type === 'Session') {
        newDayOfWeek = over.data.current.dayOfWeek
      } else {
        newDayOfWeek = parseInt(over.id as string)
      }
      
      const activeDayOfWeek = active.data.current?.dayOfWeek

      if (newDayOfWeek && !isNaN(newDayOfWeek) && activeDayOfWeek !== newDayOfWeek) {
        // Optimistic update
        setDbSessions(prev => prev.map(s =>
          s.id === sessionId ? { ...s, dayOfWeek: newDayOfWeek! } : s
        ))
        const result = await moveSessionAction(sessionId, newDayOfWeek)
        if (result.success) {
          toast.success('Sessão movida com sucesso')
        } else {
          toast.error('Erro ao mover sessão')
          // Revert on failure
          const fresh = await getAllPlannedSessionsAction()
          setDbSessions(fresh)
        }
      }
    }
  }
  
  const handleDeletePhase = async (phaseId: string) => {
    if (confirm('Tem certeza que deseja excluir esta fase? Todas as sessões planejadas vinculadas a ela também serão removidas.')) {
      const result = await deleteTrainingPhaseAction(phaseId)
      if (result?.success) {
        toast.success('Fase excluída')
        loadPhases()
      } else {
        toast.error('Erro ao excluir fase')
      }
    }
  }

  const days = [
    { name: 'Seg', value: 1 },
    { name: 'Ter', value: 2 },
    { name: 'Qua', value: 3 },
    { name: 'Qui', value: 4 },
    { name: 'Sex', value: 5 },
    { name: 'Sáb', value: 6 },
    { name: 'Dom', value: 7 },
  ]
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Plano de Treino</h1>
            <p className="text-muted-foreground">
              Gerencie suas fases de treino e templates de sessão.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 cursor-pointer border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
              onClick={() => {
                setGenerateOpen(true)
                setGenerateResult(null)
                setGenerateError(null)
                setGenerateOverwrite(phases.length > 0)
              }}
            >
              <Wand2 className="w-4 h-4" />
              Gerar Plano com IA
            </Button>
            <Button className="gap-2 cursor-pointer" onClick={() => setIsAddingPhase(true)}>
              <Plus className="w-4 h-4" />
              Nova Fase
            </Button>
          </div>
        </div>
      </motion.div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="w-4 h-4" />
            Sessões
          </TabsTrigger>
          <TabsTrigger value="phases" className="gap-2">
            <Layers className="w-4 h-4" />
            Fases
          </TabsTrigger>
          <TabsTrigger value="exercises" className="gap-2">
            <Target className="w-4 h-4" />
            Exercícios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions" className="space-y-6">
          <TrainingConfigPanel />

          <GlassCard className="p-5 space-y-4">
            <div>
              <GlassCardTitle className="mb-1">Dias de Treino</GlassCardTitle>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione os dias em que você treina. A IA usará estes dias ao gerar o plano semanal.
              </p>
              {sessionsLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <WeeklyDaySelector
                  value={trainingDayMask}
                  onChange={setTrainingDayMask}
                />
              )}
            </div>
          </GlassCard>

          <WeekPlanStatus
            trainingDayMask={trainingDayMask}
            autoWeeklyPlan={autoWeeklyPlan}
          />

          {selectedSession && (
            <SessionDetailDialog 
              session={selectedSession} 
              onClose={() => setSelectedSession(null)}
              plannedExercises={plannedExercises}
              exercises={exercises}
            />
          )}

          <GlassCard delay={0.1}>
            <div className="flex items-center justify-between mb-4">
              <GlassCardTitle>Templates de Sessão</GlassCardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-white/10 cursor-pointer"
                onClick={() => setIsAddingSession(true)}
              >
                <Plus className="w-4 h-4" />
                Adicionar Sessão
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Defina suas sessões de treino recorrentes para a fase atual.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dbSessions.length === 0 && !sessionsLoading && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-6">
                  Nenhuma sessão encontrada. Gere um plano com IA ou adicione sessões manualmente.
                </p>
              )}
              {dbSessions.map((session, index) => {
                const sessionExercises = session.exercises ?? []

                const handleDelete = async () => {
                  if (confirm('Tem certeza que deseja excluir este template de sessão?')) {
                    const result = await deletePlannedSessionAction(session.id)
                    if (result.success) {
                      toast.success('Template excluído')
                      setDbSessions(prev => prev.filter(s => s.id !== session.id))
                    } else {
                      toast.error('Erro ao excluir template')
                    }
                  }
                }

                return (
                  <SessionPlanCard
                    key={session.id}
                    session={session}
                    sessionName={session.name || `Sessão ${session.sessionNumber}`}
                    exercises={sessionExercises}
                    delay={index * 0.1}
                    onEdit={() => setSelectedSession(session)}
                    onDelete={handleDelete}
                  />
                )
              })}
            </div>
          </GlassCard>
        </TabsContent>
        
        <TabsContent value="phases" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <GlassCardTitle>Fases de Treino</GlassCardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 cursor-pointer"
                  onClick={handleReplan}
                  disabled={replanLoading}
                >
                  {replanLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4 text-amber-400" />
                  }
                  Replanejar com IA
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 cursor-pointer"
                  onClick={() => setIsAddingPhase(true)}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Fase
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Planeje seus mesociclos com fases de acumulação, deload e pico.
            </p>

            {phasesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : phases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma fase criada ainda.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setIsAddingPhase(true)}>
                  <Plus className="w-4 h-4" /> Criar Primeira Fase
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {phases.map((phase: TrainingPhase, index: number) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    delay={index * 0.1}
                    onEdit={() => setEditingPhase(phase)}
                    onDelete={() => handleDeletePhase(phase.id)}
                  />
                ))}
              </div>
            )}
          </GlassCard>

          {/* Timeline */}
          {phases.length > 0 && (
            <GlassCard delay={0.2}>
              <GlassCardTitle className="mb-4">Linha do Tempo</GlassCardTitle>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                {phases.map((phase: TrainingPhase, index: number) => (
                  <div key={phase.id} className="relative pl-10 pb-6 last:pb-0">
                    <div className={cn(
                      'absolute left-2.5 w-3 h-3 rounded-full',
                      phase.isCurrent
                        ? 'bg-primary ring-4 ring-primary/20'
                        : phase.name.toLowerCase().includes('deload')
                          ? 'bg-cyan-400'
                          : phase.name.toLowerCase().includes('peak')
                            ? 'bg-amber-400'
                            : 'bg-white/30'
                    )} />
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <p className="font-medium">{phase.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {phase.durationWeeks} semanas · RIR alvo: {phase.targetRirMin}–{phase.targetRirMax}
                      </p>
                    </motion.div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </TabsContent>
        
        <TabsContent value="exercises" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <GlassCardTitle>Biblioteca de Exercícios</GlassCardTitle>
              <Button variant="outline" size="sm" className="gap-2 border-white/10">
                <Plus className="w-4 h-4" />
                Adicionar Exercício
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Navegue e gerencie seu banco de exercícios.
            </p>
            
            <ExerciseLibrary />
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Global Dialogs */}
      <PhaseDialog
        open={isAddingPhase || !!editingPhase}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingPhase(false)
            setEditingPhase(null)
            loadPhases()
          }
        }}
        phase={editingPhase}
      />

      <AddPlannedSessionDialog
        open={isAddingSession}
        onOpenChange={setIsAddingSession}
        phaseId={phases.find((p: TrainingPhase) => p.isCurrent)?.id}
      />

      {/* AI Replan Dialog */}
      <Dialog open={replanOpen} onOpenChange={setReplanOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Análise de Replaneamento — Pump AI
            </DialogTitle>
            <DialogDescription>
              Análise baseada na metodologia Jayme de Lamadrid e nos seus dados de treino.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            {replanLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <p className="text-sm text-muted-foreground">Analisando seus dados de treino...</p>
              </div>
            )}

            {replanError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-400">Erro na análise</p>
                  <p className="text-xs text-rose-400/80 mt-1">{replanError}</p>
                </div>
              </div>
            )}

            {replanResult && !replanLoading && (
              <div className="space-y-6 py-2">
                {/* Analysis */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Análise Atual</h3>
                  <div className="space-y-2">
                    {replanResult.analysis.map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-white/5">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recomendações</h3>
                  <div className="space-y-2">
                    {replanResult.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-amber-100/90">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase suggestions */}
                {replanResult.phaseSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ajustes Sugeridos para a Fase</h3>
                    <div className="space-y-2">
                      {replanResult.phaseSuggestions.map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{s.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {s.current} → <span className="text-primary font-bold">{s.suggested}</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context */}
                {replanResult.context && Object.keys(replanResult.context).length > 0 && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Contexto da análise</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(replanResult.context).map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                          <span className="text-white">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {replanResult && !replanLoading && (
            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setReplanOpen(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  toast.success('Recomendações registradas. Aplique os ajustes manualmente nas fases.')
                  setReplanOpen(false)
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Entendido
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generate Plan Dialog */}
      <Dialog open={generateOpen} onOpenChange={(open) => {
        setGenerateOpen(open)
        if (!open && generateResult) loadPhases()
      }}>
        <DialogContent className="bg-zinc-950 border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-400" />
              Gerar Plano Completo com IA
            </DialogTitle>
            <DialogDescription>
              Gera um macrociclo Lamadrid completo: fases, sessões e exercícios baseado no seu perfil e regras ativas.
            </DialogDescription>
          </DialogHeader>

          {!generateResult && !generateLoading && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-sm text-violet-200/80 space-y-1">
                <p className="font-semibold text-violet-300">O que será gerado:</p>
                <ul className="text-xs space-y-0.5 text-muted-foreground list-disc list-inside">
                  <li>Etapa 1: Acumulação → Transição → Intensificação → Teste → Deload</li>
                  <li>Etapa 2: mesos de Hipertrofia Resistência + Pico (por nível)</li>
                  <li>Sessões semanais com exercícios, séries, repetições e RPE alvo</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-violet-500"
                    checked={generateOverwrite}
                    onChange={e => setGenerateOverwrite(e.target.checked)}
                  />
                  <div>
                    <p className="text-sm font-medium group-hover:text-white transition-colors">Substituir plano existente</p>
                    <p className="text-xs text-muted-foreground">Apaga todas as fases e sessões atuais antes de criar o novo plano</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-violet-500"
                    checked={generateNutrition}
                    onChange={e => setGenerateNutrition(e.target.checked)}
                  />
                  <div>
                    <p className="text-sm font-medium group-hover:text-white transition-colors">Gerar plano nutricional</p>
                    <p className="text-xs text-muted-foreground">Calcula calorias e macros baseado no seu perfil e objetivo atual</p>
                  </div>
                </label>
              </div>

              {generateOverwrite && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <Trash2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80">Atenção: as fases e sessões existentes serão permanentemente excluídas.</p>
                </div>
              )}

              {generateError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">{generateError}</p>
                </div>
              )}
            </div>
          )}

          {generateLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm text-muted-foreground">Gerando macrociclo...</p>
            </div>
          )}

          {generateResult && !generateLoading && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-semibold">Plano gerado com sucesso!</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xl font-bold text-violet-400">{generateResult.summary.phasesCreated}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fases</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xl font-bold text-violet-400">{generateResult.summary.sessionsCreated}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessões</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xl font-bold text-violet-400">{generateResult.summary.totalWeeks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Semanas</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Nível: <span className="text-white">{generateResult.summary.level}</span></p>
                <p>Split: <span className="text-white">{generateResult.summary.split}</span></p>
                <p>Exercícios atribuídos: <span className="text-white">{generateResult.summary.exercisesAssigned}</span></p>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {generateResult.summary.phases.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/5">
                    <span className="text-white/80">{p.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{p.durationWeeks}sem · {p.sessions} sessões</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setGenerateOpen(false)
                if (generateResult) loadPhases()
              }}
            >
              {generateResult ? 'Fechar' : 'Cancelar'}
            </Button>
            {!generateResult && (
              <Button
                size="sm"
                className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
                onClick={handleGenerate}
                disabled={generateLoading}
              >
                {generateLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Wand2 className="w-4 h-4" />
                }
                Gerar Macrociclo
              </Button>
            )}
            {generateResult && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setGenerateOpen(false)
                  loadPhases()
                  setActiveTab('phases')
                }}
              >
                <Layers className="w-4 h-4" />
                Ver Fases
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Muscle group icon mapping
const MUSCLE_ICONS: Record<string, string> = {
  'Peitoral': '🫁',
  'Costas': '🔙',
  'Ombros': '💪',
  'Bráquio Anterior': '💪',
  'Bráquio Posterior': '💪',
  'Braços': '💪',
  'Membros Inferiores': '🦵',
  'Quadríceps': '🦵',
  'Isquiotibiais': '🦵',
  'Glúteos': '🍑',
  'Panturrilhas': '🦶',
  'Core': '⭕',
  'Abdominais': '⭕',
  'Costas/Core': '🔄',
  'Trapézio': '🔝',
}

function getMuscleIcon(muscleGroup: string | null | undefined): string {
  if (!muscleGroup) return '🏋️'
  for (const [key, icon] of Object.entries(MUSCLE_ICONS)) {
    if (muscleGroup.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '🏋️'
}


function VideoDialog({ videoUrl, exerciseName, onClose }: { videoUrl: string; exerciseName: string; onClose: () => void }) {
  const videoId = extractYouTubeId(videoUrl)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 glass border border-white/10 rounded-2xl p-4 w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold truncate">{exerciseName}</p>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video rounded-xl border border-white/10"
          />
        ) : (
          <div className="aspect-video flex items-center justify-center rounded-xl bg-white/5">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Abrir vídeo no YouTube</a>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ExerciseLibrary() {
  const { exercises } = useWorkout()
  const [search, setSearch] = useState('')
  const [videoExercise, setVideoExercise] = useState<{ url: string; name: string } | null>(null)
  
  const movementPatterns = [...new Set(exercises.map(e => e.movementPattern).filter(Boolean))]
  
  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.movementPattern?.toLowerCase().includes(search.toLowerCase()) ||
    ex.classification?.toLowerCase().includes(search.toLowerCase())
  )
  
  const groupedExercises = movementPatterns.reduce((acc, pattern) => {
    if (!pattern) return acc
    acc[pattern] = filteredExercises.filter(ex => ex.movementPattern === pattern)
    return acc
  }, {} as Record<string, typeof exercises>)
  
  return (
    <div className="space-y-6">
      <Input
        type="text"
        placeholder="Buscar exercícios..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border-white/10"
      />
      
      {Object.entries(groupedExercises).map(([pattern, exs]) => {
        if (exs.length === 0) return null
        return (
          <div key={pattern}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {pattern}
            </h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {exs.map(exercise => {
                // Get primary muscle from exercise muscles if available, fallback to movement pattern
                const primaryMuscle = (exercise as any).muscles?.[0]?.muscleGroup || exercise.movementPattern
                const muscleIcon = getMuscleIcon(primaryMuscle)
                
                return (
                  <div
                    key={exercise.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xl shrink-0 mt-0.5" title={primaryMuscle || ''}>
                          {muscleIcon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">{exercise.name}</p>
                          {exercise.nameEn && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{exercise.nameEn}</p>
                          )}
                        </div>
                      </div>
                      {exercise.videoUrl && (
                        <button
                          className="shrink-0 text-primary/50 hover:text-primary transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setVideoExercise({ url: exercise.videoUrl!, name: exercise.name })
                          }}
                          title="Ver vídeo"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pl-7">
                      <span className="text-[10px] text-muted-foreground border border-white/10 px-1.5 py-0.5 rounded">
                        {exercise.classification}
                      </span>
                      {exercise.neuralDemand && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                          ND: {exercise.neuralDemand}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Video Dialog */}
      <AnimatePresence>
        {videoExercise && (
          <VideoDialog
            videoUrl={videoExercise.url}
            exerciseName={videoExercise.name}
            onClose={() => setVideoExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
