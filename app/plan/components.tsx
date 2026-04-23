'use client'

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { PlannedSession, PlannedExercise, Exercise } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, GripVertical, Plus, AlertCircle, Save, X, Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  deletePlannedSessionAction, 
  deletePlannedExerciseAction,
  updatePlannedSessionAction,
  upsertPlannedExerciseAction,
  reorderPlannedExercisesAction,
  createTrainingPhaseAction,
  updateTrainingPhaseAction,
  deleteTrainingPhaseAction,
  createPlannedSessionAction
} from './actions'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { TrainingPhase, PhaseType, TechniqueFocus } from '@/lib/types'

interface DroppableDayProps {
  day: { name: string; value: number }
  children: React.ReactNode
}

export function DroppableDay({ day, children }: DroppableDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: day.value.toString(),
    data: {
      type: 'Day',
      dayOfWeek: day.value
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[120px] rounded-xl border border-white/5 transition-colors",
        isOver ? "bg-primary/20 border-primary/50" : "bg-white/5 hover:bg-white/10"
      )}
    >
      <div className="p-2 border-b border-white/5 bg-white/5 rounded-t-xl">
        <p className="text-xs font-semibold text-center uppercase tracking-wider text-muted-foreground">
          {day.name}
        </p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[200px] scrollbar-none">
        {children}
      </div>
    </div>
  )
}

interface DraggableSessionProps {
  session: PlannedSession
  onClick: () => void
  plannedExercises: PlannedExercise[]
}

export function DraggableSession({ session, onClick, plannedExercises }: DraggableSessionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: {
      type: 'Session',
      dayOfWeek: session.dayOfWeek
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const exerciseCount = plannedExercises.filter(pe => pe.plannedSessionId === session.id).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative p-2 rounded-lg bg-white/10 border border-white/10 cursor-pointer hover:border-primary/50 transition-all",
        isDragging && "opacity-50 grayscale scale-95 z-50",
      )}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!transform) onClick()
      }}
    >
      <p className="text-xs font-medium truncate pr-4">
        {session.name || session.id.split('-').pop()?.toUpperCase() || 'Sessão'}
      </p>
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-white/10 bg-white/5">
          {exerciseCount} exs
        </Badge>
      </div>
    </div>
  )
}

interface SessionDetailDialogProps {
  session: PlannedSession | null
  onClose: () => void
  plannedExercises: PlannedExercise[]
  exercises: Exercise[]
}

interface SortableExerciseItemProps {
  pe: any
  idx: number
  onEdit: () => void
  onDelete: () => void
}

function SortableExerciseItem({ pe, idx, onEdit, onDelete }: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: pe.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors",
        isDragging && "bg-white/20 border-primary/50 shadow-xl opacity-80"
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-white/10"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {idx + 1}
        </div>
        <div>
          <p className="font-medium text-lg">{pe.exercise?.name || 'Exercício não encontrado'}</p>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {pe.exercise?.movementPattern}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {pe.setsCount} séries × {pe.repsMin}-{pe.repsMax} reps
            </span>
            <span className="text-sm text-muted-foreground">
              RIR {pe.targetRir}
            </span>
          </div>
          {pe.technique && pe.technique !== 'Normal' && (
            <Badge variant="outline" className="mt-2 border-primary/30 text-primary bg-primary/5">
              {pe.technique}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onEdit}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:text-destructive/80"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function SessionDetailDialog({ session, onClose, plannedExercises, exercises }: SessionDetailDialogProps) {
  const [isEditingSession, setIsEditingSession] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [isAddingExercise, setIsAddingExercise] = useState(false)

  // All hooks MUST be called before any early return (Rules of Hooks)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const sessionExercises = useMemo(() => {
    if (!session) return []
    return plannedExercises
      .filter(pe => pe.plannedSessionId === session.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(pe => ({
        ...pe,
        exercise: exercises.find(e => e.id === pe.exerciseId)
      }))
  }, [session, plannedExercises, exercises])

  // Removed early return from here to follow Rules of Hooks
  // We handle the null case inside the JSX or assume it's handled by the parent


  const handleDeleteSession = async () => {
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      const result = await deletePlannedSessionAction(session.id)
      if (result.success) {
        toast.success('Sessão excluída')
        onClose()
      } else {
        toast.error('Erro ao excluir sessão')
      }
    }
  }

  const handleDeleteExercise = async (id: string) => {
    if (confirm('Remover este exercício da sessão?')) {
      const result = await deletePlannedExerciseAction(id)
      if (result.success) {
        toast.success('Exercício removido')
      } else {
        toast.error('Erro ao remover exercício')
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sessionExercises.findIndex((item) => item.id === active.id)
      const newIndex = sessionExercises.findIndex((item) => item.id === over.id)
      
      const newOrder = arrayMove(sessionExercises, oldIndex, newIndex)
      const orderedIds = newOrder.map(item => item.id)
      
      const result = await reorderPlannedExercisesAction(orderedIds)
      if (!result.success) {
        toast.error('Erro ao reordenar exercícios')
      }
    }
  }

  return (
    <>
      <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-zinc-950 border-white/10 max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl">
                  Detalhes da Sessão: {session.id.split('-').pop()?.toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  Visualize e gerencie os exercícios planejados para esta sessão.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-white/10"
                  onClick={() => setIsEditingSession(true)}
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleDeleteSession}
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4 -mr-2 pr-4">
            <div className="space-y-4">
              {sessionExercises.length > 0 ? (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={sessionExercises.map(pe => pe.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sessionExercises.map((pe, idx) => (
                        <SortableExerciseItem
                          key={pe.id}
                          pe={pe}
                          idx={idx}
                          onEdit={() => setEditingExerciseId(pe.id)}
                          onDelete={() => handleDeleteExercise(pe.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-muted-foreground">Nenhum exercício planejado para esta sessão.</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-primary"
                    onClick={() => setIsAddingExercise(true)}
                  >
                    Adicionar primeiro exercício
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6">
            <Button onClick={onClose} variant="secondary" className="w-full md:w-auto border-white/10">
              Fechar
            </Button>
            <Button 
              className="w-full md:w-auto gap-2"
              onClick={() => setIsAddingExercise(true)}
            >
              <Plus className="w-4 h-4" />
              Adicionar Exercício
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <EditSessionDialog 
        open={isEditingSession} 
        onOpenChange={setIsEditingSession} 
        session={session} 
      />
      
      <EditPlannedExerciseDialog
        open={!!editingExerciseId}
        onOpenChange={(open) => !open && setEditingExerciseId(null)}
        plannedExercise={sessionExercises.find(pe => pe.id === editingExerciseId)}
        exercises={exercises}
      />

      <AddExerciseDialog
        open={isAddingExercise}
        onOpenChange={setIsAddingExercise}
        sessionId={session.id}
        exercises={exercises}
      />
    </>
  )
}

function EditSessionDialog({ open, onOpenChange, session }: { open: boolean, onOpenChange: (open: boolean) => void, session: PlannedSession }) {
  const [name, setName] = useState(session.name || '')
  const [dayOfWeek, setDayOfWeek] = useState((session.dayOfWeek ?? 1).toString())
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updatePlannedSessionAction(session.id, { 
      name,
      dayOfWeek: parseInt(dayOfWeek) 
    })
    if (result.success) {
      toast.success('Sessão atualizada')
      onOpenChange(false)
    } else {
      toast.error('Erro ao atualizar sessão')
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Sessão</DialogTitle>
          <DialogDescription>Altere o nome e o dia da semana desta sessão.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Nome da Sessão</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Dia da Semana</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Segunda-feira</SelectItem>
                <SelectItem value="2">Terça-feira</SelectItem>
                <SelectItem value="3">Quarta-feira</SelectItem>
                <SelectItem value="4">Quinta-feira</SelectItem>
                <SelectItem value="5">Sexta-feira</SelectItem>
                <SelectItem value="6">Sábado</SelectItem>
                <SelectItem value="7">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="border-white/10">Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditPlannedExerciseDialog({ open, onOpenChange, plannedExercise, exercises }: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  plannedExercise: any,
  exercises: Exercise[]
}) {
  const [formData, setFormData] = useState({
    setsCount: 3,
    repsMin: 8,
    repsMax: 12,
    targetRir: 2,
    technique: 'Normal'
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (plannedExercise) {
      setFormData({
        setsCount: plannedExercise.setsCount,
        repsMin: plannedExercise.repsMin || 8,
        repsMax: plannedExercise.repsMax || 12,
        targetRir: plannedExercise.targetRir || 2,
        technique: plannedExercise.technique || 'Normal'
      })
    }
  }, [plannedExercise])

  const handleSave = async () => {
    setIsSaving(true)
    const result = await upsertPlannedExerciseAction({
      id: plannedExercise.id,
      ...formData
    })
    if (result.success) {
      toast.success('Exercício atualizado')
      onOpenChange(false)
    } else {
      toast.error('Erro ao atualizar exercício')
    }
    setIsSaving(false)
  }

  if (!plannedExercise) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Parâmetros</DialogTitle>
          <DialogDescription>{plannedExercise.exercise?.name}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Séries</Label>
            <Input 
              type="number" 
              value={formData.setsCount} 
              onChange={(e) => setFormData({...formData, setsCount: parseInt(e.target.value)})}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>RIR Alvo</Label>
            <Input 
              type="number" 
              value={formData.targetRir} 
              onChange={(e) => setFormData({...formData, targetRir: parseInt(e.target.value)})}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Reps Min</Label>
            <Input 
              type="number" 
              value={formData.repsMin} 
              onChange={(e) => setFormData({...formData, repsMin: parseInt(e.target.value)})}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Reps Max</Label>
            <Input 
              type="number" 
              value={formData.repsMax} 
              onChange={(e) => setFormData({...formData, repsMax: parseInt(e.target.value)})}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Técnica Especial</Label>
            <Select value={formData.technique} onValueChange={(v) => setFormData({...formData, technique: v})}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione a técnica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Drop Set">Drop Set</SelectItem>
                <SelectItem value="Rest-Pause">Rest-Pause</SelectItem>
                <SelectItem value="Myo-Reps">Myo-Reps</SelectItem>
                <SelectItem value="Cluster Set">Cluster Set</SelectItem>
                <SelectItem value="Top Set">Top Set</SelectItem>
                <SelectItem value="Back-off Set">Back-off Set</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="border-white/10">Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddExerciseDialog({ open, onOpenChange, sessionId, exercises }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  sessionId: string,
  exercises: Exercise[]
}) {
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.movementPattern?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10)

  const handleAdd = async (exerciseId: string) => {
    setIsSaving(true)
    const result = await upsertPlannedExerciseAction({
      plannedSessionId: sessionId,
      exerciseId,
      setsCount: 3,
      repsMin: 8,
      repsMax: 12,
      targetRir: 2,
      technique: 'Normal'
    })
    if (result.success) {
      toast.success('Exercício adicionado')
      onOpenChange(false)
    } else {
      toast.error('Erro ao adicionar exercício')
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Exercício</DialogTitle>
          <DialogDescription>Escolha um exercício da biblioteca.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input 
            placeholder="Buscar..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10"
          />
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredExercises.map(ex => (
                <div 
                  key={ex.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                  onClick={() => handleAdd(ex.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.movementPattern}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PhaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: TrainingPhase | null
}

export function PhaseDialog({ open, onOpenChange, phase }: PhaseDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<TrainingPhase>>({
    name: '',
    etapa: 1,
    phaseType: 'Acumulação',
    mesoNumber: 1,
    durationWeeks: 4,
    targetRirMin: 2,
    targetRirMax: 4,
    volumePctTension: 0.4,
    volumePctMetabolic: 0.6,
    techniqueFocus: null,
    progressionRule: '',
    isCurrent: false,
  })

  useEffect(() => {
    if (phase) {
      setFormData(phase)
    } else {
      setFormData({
        name: '',
        etapa: 1,
        phaseType: 'Acumulação',
        mesoNumber: 1,
        durationWeeks: 4,
        targetRirMin: 2,
        targetRirMax: 4,
        volumePctTension: 0.4,
        volumePctMetabolic: 0.6,
        techniqueFocus: null,
        progressionRule: '',
        isCurrent: false,
      })
    }
  }, [phase, open])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (phase) {
        const result = await updateTrainingPhaseAction(phase.id, formData)
        if (result?.success) {
          toast.success('Fase atualizada com sucesso')
          onOpenChange(false)
        } else {
          toast.error(result?.error || 'Erro ao atualizar fase')
        }
      } else {
        const result = await createTrainingPhaseAction(formData)
        if (result.success) {
          toast.success('Fase criada com sucesso')
          onOpenChange(false)
        } else {
          toast.error(result.error || 'Erro ao criar fase')
        }
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase ? 'Editar Fase' : 'Nova Fase de Treino'}</DialogTitle>
          <DialogDescription>
            Configure os parâmetros do seu mesociclo de treinamento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase-name">Nome da Fase</Label>
              <Input
                id="phase-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Acumulação 1 - Hipertrofia"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select
                  value={formData.etapa?.toString()}
                  onValueChange={(v) => setFormData({ ...formData, etapa: parseInt(v) as 1 | 2 })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Etapa 1</SelectItem>
                    <SelectItem value="2">Etapa 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meso #</Label>
                <Input
                  type="number"
                  value={formData.mesoNumber || 1}
                  onChange={(e) => setFormData({ ...formData, mesoNumber: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Fase</Label>
              <Select
                value={formData.phaseType || 'Acumulação'}
                onValueChange={(v) => setFormData({ ...formData, phaseType: v as PhaseType })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acumulação">Acumulação</SelectItem>
                  <SelectItem value="Transição">Transição</SelectItem>
                  <SelectItem value="Intensificação">Intensificação</SelectItem>
                  <SelectItem value="Teste">Teste (1RM)</SelectItem>
                  <SelectItem value="Hipertrofia_Resistência">Hipertrofia & Resistência</SelectItem>
                  <SelectItem value="Hipertrofia_Pico">Pico de Hipertrofia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foco em Técnica (Etapa 2)</Label>
              <Select
                value={formData.techniqueFocus || 'none'}
                onValueChange={(v) => setFormData({ ...formData, techniqueFocus: v === 'none' ? null : v as TechniqueFocus })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="Drop Set">Drop Set</SelectItem>
                  <SelectItem value="Super Set">Super Set</SelectItem>
                  <SelectItem value="Falsa Pirâmide">Falsa Pirâmide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label>Fase Ativa</Label>
                <p className="text-xs text-muted-foreground">Marcar como fase atual de treino</p>
              </div>
              <Switch
                checked={formData.isCurrent}
                onCheckedChange={(checked) => setFormData({ ...formData, isCurrent: checked })}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Duração: {formData.durationWeeks} semanas</Label>
              </div>
              <Slider
                value={[formData.durationWeeks || 4]}
                min={1}
                max={12}
                step={1}
                onValueChange={([v]) => setFormData({ ...formData, durationWeeks: v })}
                className="py-4"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>RIR Alvo: {formData.targetRirMin}–{formData.targetRirMax}</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.targetRirMin || 0}
                  onChange={(e) => setFormData({ ...formData, targetRirMin: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.targetRirMax || 0}
                  onChange={(e) => setFormData({ ...formData, targetRirMax: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Distribuição de Volume</Label>
                <span className="text-xs text-muted-foreground">Tensão vs Metabólico</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Tensão: {Math.round((formData.volumePctTension || 0) * 100)}%</span>
                  <span>Metabólico: {Math.round((formData.volumePctMetabolic || 0) * 100)}%</span>
                </div>
                <Slider
                  value={[(formData.volumePctTension || 0) * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setFormData({
                    ...formData,
                    volumePctTension: v / 100,
                    volumePctMetabolic: (100 - v) / 100
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Regra de Progressão</Label>
              <Textarea
                value={formData.progressionRule || ''}
                onChange={(e) => setFormData({ ...formData, progressionRule: e.target.value })}
                placeholder="Ex: Aumentar 2kg se RPE < 8 em todas as séries"
                className="bg-white/5 border-white/10 min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-white/5 pt-6">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="border-white/10">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {phase ? 'Atualizar Fase' : 'Criar Fase'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddPlannedSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseId?: string
}

export function AddPlannedSessionDialog({ open, onOpenChange, phaseId }: AddPlannedSessionDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [sessionNumber, setSessionNumber] = useState('1')

  const handleSave = async () => {
    setIsSaving(true)
    const result = await createPlannedSessionAction({
      phaseId: phaseId || null,
      name,
      dayOfWeek: parseInt(dayOfWeek),
      sessionNumber: parseInt(sessionNumber),
      status: 'Pendente'
    })
    
    if (result.success) {
      toast.success('Sessão criada com sucesso')
      onOpenChange(false)
    } else {
      toast.error('Erro ao criar sessão')
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Sessão</DialogTitle>
          <DialogDescription>
            Configure o nome, dia e a ordem da sessão no planejamento semanal.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Nome da Sessão</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Dia da Semana</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Segunda-feira</SelectItem>
                <SelectItem value="2">Terça-feira</SelectItem>
                <SelectItem value="3">Quarta-feira</SelectItem>
                <SelectItem value="4">Quinta-feira</SelectItem>
                <SelectItem value="5">Sexta-feira</SelectItem>
                <SelectItem value="6">Sábado</SelectItem>
                <SelectItem value="7">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número da Sessão (Ordem)</Label>
            <Input
              type="number"
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="border-white/10">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Criando...' : 'Criar Sessão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
