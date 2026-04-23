'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { Exercise, MuscleGroup } from '@/lib/types'
import { muscleGroupLabels, muscleGroupColors, getExercisePrimaryMuscle } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Minus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddExerciseModalProps {
  open: boolean
  onClose: () => void
  sessionId: string
}

export function AddExerciseModal({ open, onClose, sessionId }: AddExerciseModalProps) {
  const { exercises, addExerciseToSession } = useWorkout()
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState(3)
  
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.movementPattern?.toLowerCase().includes(search.toLowerCase()) ||
        ex.classification?.toLowerCase().includes(search.toLowerCase())
      const exerciseMuscle = getExercisePrimaryMuscle(ex.id)
      const matchesMuscle = !selectedMuscle || exerciseMuscle === selectedMuscle
      return matchesSearch && matchesMuscle
    })
  }, [exercises, search, selectedMuscle])
  
  const muscleGroups = Object.keys(muscleGroupLabels) as MuscleGroup[]
  
  const handleAdd = () => {
    if (selectedExercise) {
      addExerciseToSession(sessionId, selectedExercise, sets)
      onClose()
      setSelectedExercise(null)
      setSearch('')
      setSets(3)
    }
  }
  
  const handleClose = () => {
    onClose()
    setSelectedExercise(null)
    setSearch('')
    setSelectedMuscle(null)
    setSets(3)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/10 max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Exercício</DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercícios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        
        {/* Muscle Group Filter */}
        <div className="flex gap-2 flex-wrap">
          {muscleGroups.slice(0, 6).map(muscle => (
            <Button
              key={muscle}
              variant={selectedMuscle === muscle ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMuscle(
                selectedMuscle === muscle ? null : muscle
              )}
              className={cn(
                "text-xs",
                selectedMuscle !== muscle && "border-white/10"
              )}
            >
              {muscleGroupLabels[muscle]}
            </Button>
          ))}
        </div>
        
        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <AnimatePresence mode="popLayout">
            {filteredExercises.map((exercise, index) => {
              const muscleGroup = getExercisePrimaryMuscle(exercise.id)
              return (
                <motion.button
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => setSelectedExercise(
                    selectedExercise?.id === exercise.id ? null : exercise
                  )}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all mb-2",
                    selectedExercise?.id === exercise.id
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            muscleGroupColors[muscleGroup],
                            "text-white/90"
                          )}
                        >
                          {muscleGroupLabels[muscleGroup]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {exercise.classification || 'Compound'}
                        </span>
                      </div>
                    </div>
                    {selectedExercise?.id === exercise.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
        
        {/* Selected Exercise Actions */}
        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Número de séries:</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSets(Math.max(1, sets - 1))}
                  className="h-8 w-8 rounded-full border-white/10"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{sets}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSets(Math.min(10, sets + 1))}
                  className="h-8 w-8 rounded-full border-white/10"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <Button onClick={handleAdd} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Adicionar {selectedExercise.name}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
