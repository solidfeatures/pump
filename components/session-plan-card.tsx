'use client'

import { motion } from 'framer-motion'
import { PlannedSession, PlannedExercise, Exercise } from '@/lib/types'
import { muscleGroupLabels, muscleGroupColors } from '@/lib/mock-data'
import type { MuscleGroup } from '@/lib/types'
import { Dumbbell, Edit2, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SessionPlanCardProps {
  session: PlannedSession
  sessionName: string
  exercises: (PlannedExercise & { exercise: Exercise })[]
  delay?: number
  onEdit?: () => void
  onDelete?: () => void
}

export function SessionPlanCard({ 
  session, 
  sessionName, 
  exercises, 
  delay = 0,
  onEdit,
  onDelete
}: SessionPlanCardProps) {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.setsCount, 0)
  
  const muscleGroups = [...new Set(
    exercises.map(e => (e.exercise?.muscles?.find(m => m.seriesFactor >= 1.0)?.muscleGroup ?? 'chest') as MuscleGroup)
  )]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-subtle rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer relative"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{sessionName}</h3>
            <p className="text-xs text-muted-foreground">
              {exercises.length} exercícios - {totalSets} séries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Muscle group tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {muscleGroups.slice(0, 4).map(muscle => (
          <span
            key={muscle}
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              muscleGroupColors[muscle] || "bg-zinc-800",
              "text-white/90"
            )}
          >
            {muscleGroupLabels[muscle] || muscle}
          </span>
        ))}
      </div>
      
      {/* Exercise list preview */}
      <div className="space-y-2 mb-4">
        {exercises.slice(0, 3).map(ex => (
          <div key={ex.id} className="flex items-center gap-2 text-sm">
            <Dumbbell className="w-3 h-3 text-muted-foreground" />
            <span className="truncate">{ex.exercise?.name || 'Exercício'}</span>
            <span className="text-muted-foreground ml-auto text-xs">
              {ex.setsCount} x {ex.repsMin}-{ex.repsMax}
            </span>
          </div>
        ))}
        {exercises.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{exercises.length - 3} mais exercícios
          </p>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">{exercises.length}</span> exercícios
        </div>
        <div>
          <span className="font-medium text-foreground">{totalSets}</span> séries
        </div>
        {exercises[0]?.targetRir !== undefined && (
          <div>
            RIR <span className="font-medium text-foreground">{exercises[0].targetRir}</span>
          </div>
        )}
      </div>
      
      {session.aiNotes && (
        <p className="mt-3 text-xs text-muted-foreground border-t border-white/5 pt-3 line-clamp-2">
          {session.aiNotes}
        </p>
      )}
    </motion.div>
  )
}
