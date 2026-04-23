'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, Flag, Clock, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WorkoutControlsProps {
  status: 'pending' | 'in-progress' | 'paused' | 'completed'
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  elapsed: number
}

export function WorkoutControls({
  status,
  onStart,
  onPause,
  onResume,
  onComplete,
  elapsed
}: WorkoutControlsProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isPaused = status === 'paused'
  const isInProgress = status === 'in-progress'
  const isPending = status === 'pending'
  const isCompleted = status === 'completed'

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {(isInProgress || isPaused || isCompleted) && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm"
          >
            <Clock className={cn("w-4 h-4", isPaused ? 'text-muted-foreground' : 'text-primary')} />
            <span className={cn("font-mono tabular-nums font-bold", isPaused ? 'text-muted-foreground' : 'text-white')}>
              {formatTime(elapsed)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {isPending && (
          <Button 
            onClick={onStart} 
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 rounded-full cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Iniciar Treino
          </Button>
        )}

        {isInProgress && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={onPause}
              title="Pausar treino"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </Button>
            <Button
              onClick={onComplete}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 rounded-full cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Flag className="w-4 h-4" />
              Encerrar
            </Button>
          </>
        )}

        {isPaused && (
          <>
            <Button
              variant="default"
              size="icon"
              onClick={onResume}
              title="Retomar treino"
              className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
            </Button>
            <Button
              onClick={onComplete}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 rounded-full cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Flag className="w-4 h-4" />
              Encerrar
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-bold border border-primary/20">
            <Flag className="w-4 h-4" />
            <span>Treino Concluído</span>
          </div>
        )}
      </div>
    </div>
  )
}
