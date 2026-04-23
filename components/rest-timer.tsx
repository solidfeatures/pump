'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, RotateCcw, Clock } from 'lucide-react'
import type { RestTimeRange } from '@/lib/types'
import { formatRestTime } from '@/lib/periodization'

interface RestTimerProps {
  recommendedRange?: RestTimeRange
  onClose: () => void
}

export function RestTimer({ recommendedRange, onClose }: RestTimerProps) {
  const defaultTime = recommendedRange
    ? Math.round((recommendedRange.minSeconds + recommendedRange.maxSeconds) / 2)
    : 120

  const [timeLeft, setTimeLeft] = useState(defaultTime)
  const [isRunning, setIsRunning] = useState(true)
  const [duration, setDuration] = useState(defaultTime)

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isUnderRange = recommendedRange && timeLeft < recommendedRange.minSeconds
  const isOverRange = recommendedRange && timeLeft > recommendedRange.maxSeconds

  const adjustTime = (delta: number) => {
    const newTime = Math.max(0, timeLeft + delta)
    setTimeLeft(newTime)
    if (newTime > duration) setDuration(newTime)
  }

  const reset = () => {
    setTimeLeft(defaultTime)
    setDuration(defaultTime)
    setIsRunning(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="glass-subtle rounded-xl p-4 my-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Descanso</span>
            {recommendedRange && (
              <span className="text-xs text-muted-foreground">
                rec: {formatRestTime(recommendedRange)}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => adjustTime(-15)} className="rounded-full">
            <Minus className="w-4 h-4" />
          </Button>

          <div
            className={`text-4xl font-mono font-bold cursor-pointer transition-colors ${
              timeLeft === 0
                ? 'text-primary animate-pulse'
                : isUnderRange
                ? 'text-amber-400'
                : isOverRange
                ? 'text-muted-foreground'
                : 'text-foreground'
            }`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>

          <Button variant="ghost" size="icon" onClick={() => adjustTime(15)} className="rounded-full">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              timeLeft === 0 ? 'bg-primary' : isUnderRange ? 'bg-amber-400' : 'bg-primary'
            }`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Range indicator ticks */}
        {recommendedRange && duration > 0 && (
          <div className="relative h-1 mb-3">
            <div
              className="absolute top-0 w-0.5 h-2 bg-emerald-400 rounded-full -translate-y-0.5"
              style={{ left: `${(recommendedRange.minSeconds / duration) * 100}%` }}
            />
            <div
              className="absolute top-0 w-0.5 h-2 bg-emerald-400 rounded-full -translate-y-0.5"
              style={{ left: `${Math.min((recommendedRange.maxSeconds / duration) * 100, 100)}%` }}
            />
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? 'Pausar' : 'Retomar'}
          </Button>
          <Button variant="default" size="sm" onClick={onClose}>
            Pular
          </Button>
        </div>

        {timeLeft === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-primary mt-2 font-medium"
          >
            Pronto para a próxima série!
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
