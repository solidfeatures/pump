'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { PhaseCard } from '@/components/phase-card'
import { SessionPlanCard } from '@/components/session-plan-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Layers, Target, PlayCircle, X } from 'lucide-react'
import { trainingPhases, sessionNames, sessionDayMapping } from '@/lib/mock-data'
import { format, parseISO, addWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { moveSessionAction, deletePlannedSessionAction, deleteTrainingPhaseAction } from './actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PlannedSession, PlannedExercise, TrainingPhase } from '@/lib/types'
import { trainingPhases as mockPhases } from '@/lib/mock-data'
import { Sparkles } from 'lucide-react'

export default function PlanPage() {
  const { plannedSessions, plannedExercises, exercises } = useWorkout()
  const phases = mockPhases
  const [activeTab, setActiveTab] = useState('sessions')
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
        const result = await moveSessionAction(sessionId, newDayOfWeek)
        if (result.success) {
          toast.success('Sessão movida com sucesso')
        } else {
          toast.error('Erro ao mover sessão')
        }
      }
    }
  }
  
  const handleDeletePhase = async (phaseId: string) => {
    if (confirm('Tem certeza que deseja excluir esta fase? Todas as sessões planejadas vinculadas a ela também serão removidas.')) {
      const result = await deleteTrainingPhaseAction(phaseId)
      if (result?.success) {
        toast.success('Fase excluída')
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
          <Button className="gap-2 cursor-pointer" onClick={() => setIsAddingPhase(true)}>
            <Plus className="w-4 h-4" />
            Nova Fase
          </Button>
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
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
          >
            <GlassCard>
              <GlassCardTitle className="mb-4">Programação Semanal</GlassCardTitle>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <DroppableDay key={day.value} day={day}>
                    {plannedSessions
                      .filter(s => s.dayOfWeek === day.value)
                      .map(session => (
                        <DraggableSession 
                          key={session.id} 
                          session={session} 
                          onClick={() => setSelectedSession(session)}
                          plannedExercises={plannedExercises}
                        />
                      ))}
                  </DroppableDay>
                ))}
              </div>
            </GlassCard>

            <DragOverlay>
              {activeId ? (
                <div className="p-3 rounded-xl glass-subtle border border-primary/50 shadow-xl w-32">
                  <p className="text-sm font-medium truncate">
                    {plannedSessions.find(s => s.id === activeId)?.id || 'Sessão'}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

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
              {plannedSessions.map((session, index) => {
                const sessionExercises = plannedExercises.filter(
                  pe => pe.plannedSessionId === session.id
                ).map(pe => ({
                  ...pe,
                  exercise: exercises.find(e => e.id === pe.exerciseId)!
                }))
                
                const handleDelete = async () => {
                  if (confirm('Tem certeza que deseja excluir este template de sessão?')) {
                    const result = await deletePlannedSessionAction(session.id)
                    if (result.success) {
                      toast.success('Template excluído')
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
                <Button variant="outline" size="sm" className="gap-2 border-white/10 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-amber-400" />
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
            
            <div className="space-y-4">
              {phases?.map((phase: TrainingPhase, index: number) => (
                <PhaseCard 
                  key={phase.id} 
                  phase={phase} 
                  delay={index * 0.1} 
                  onEdit={() => setEditingPhase(phase)}
                  onDelete={() => handleDeletePhase(phase.id)}
                />
              ))}
            </div>
          </GlassCard>
          
          {/* Timeline */}
          <GlassCard delay={0.2}>
            <GlassCardTitle className="mb-4">Linha do Tempo</GlassCardTitle>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
              {phases?.map((phase: TrainingPhase, index: number) => (
                <div key={phase.id} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                    phase.isCurrent 
                      ? 'bg-primary ring-4 ring-primary/20' 
                      : phase.name.toLowerCase().includes('deload')
                        ? 'bg-cyan-400' 
                        : phase.name.toLowerCase().includes('peak')
                          ? 'bg-amber-400' 
                          : 'bg-white/30'
                  }`} />
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <p className="font-medium">{phase.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {phase.durationWeeks} semanas - RIR alvo: {phase.targetRirMin}-{phase.targetRirMax}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </GlassCard>
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
          }
        }}
        phase={editingPhase}
      />

      <AddPlannedSessionDialog 
        open={isAddingSession}
        onOpenChange={setIsAddingSession}
        phaseId={phases?.find((p: TrainingPhase) => p.isCurrent)?.id}
      />
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

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
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
