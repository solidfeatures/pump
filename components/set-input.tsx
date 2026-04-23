'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { WorkoutSet, SetCategory } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Check, Loader2, Thermometer, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RestTimer } from '@/components/rest-timer'
import { getRestTimeRange } from '@/lib/periodization'

const CATEGORY_LABELS: Record<SetCategory, { label: string; color: string; description: string }> = {
  'Working Set': { label: 'W', color: 'bg-primary/20 text-primary border-primary/30',         description: 'Working Set — série de trabalho padrão' },
  'Top Set':     { label: 'T', color: 'bg-amber-400/20 text-amber-400 border-amber-400/30',   description: 'Top Set — série de carga máxima' },
  'Back Off Set':{ label: 'B', color: 'bg-sky-400/20 text-sky-400 border-sky-400/30',         description: 'Back Off Set — volume após Top Set' },
  'Warming Set': { label: '~', color: 'bg-white/10 text-muted-foreground border-white/10',    description: 'Aquecimento' },
  'Feeder Set':  { label: 'F', color: 'bg-white/5 text-muted-foreground/50 border-white/5',   description: 'Feeder — série leve de ativação' },
}

const CATEGORY_CYCLE: SetCategory[] = ['Working Set', 'Top Set', 'Back Off Set', 'Warming Set', 'Feeder Set']

/** Clamp RPE to [1, 10] with 0.5 steps */
function clampRpe(v: number) {
  return Math.min(10, Math.max(1, Math.round(v * 2) / 2))
}
/** Clamp RIR to [0, 9] integer */
function clampRir(v: number) {
  return Math.min(9, Math.max(0, Math.round(v)))
}

interface SetInputProps {
  sessionId: string
  exerciseId: string
  set: WorkoutSet
  isActive: boolean
  targetRepsMax?: number
  canRemove?: boolean
}

export function SetInput({ sessionId, exerciseId, set, isActive, targetRepsMax, canRemove = false }: SetInputProps) {
  const { updateSet, removeSet } = useWorkout()

  const [weight, setWeight]   = useState(set.loadKg?.toString() || '')
  const [reps, setReps]       = useState(set.reps?.toString() || '')
  /** Controlled RPE string — source of truth when user edits RPE */
  const [rpe, setRpe]         = useState(set.rpe?.toString() || '')
  /** Controlled RIR string — source of truth when user edits RIR */
  const [rir, setRir]         = useState(set.rpe != null ? clampRir(10 - set.rpe).toString() : '')

  const [setType, setSetType] = useState<SetCategory>(
    (CATEGORY_LABELS[set.setType] ? set.setType : 'Working Set') as SetCategory
  )
  const [isSaving, setIsSaving]             = useState(false)
  const [showSaved, setShowSaved]           = useState(false)
  const [showTimer, setShowTimer]           = useState(false)
  const [showCategoryTooltip, setShowCategoryTooltip] = useState(false)

  const saveTimeoutRef  = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track which field was last edited to break feedback loop
  const lastEditRef = useRef<'rpe' | 'rir' | null>(null)

  // ── Bidirectional RPE ↔ RIR sync ──────────────────────────────────────────
  const handleRpeChange = (val: string) => {
    lastEditRef.current = 'rpe'
    setRpe(val)
    const n = parseFloat(val)
    if (!isNaN(n)) {
      setRir(clampRir(10 - clampRpe(n)).toString())
    } else {
      setRir('')
    }
  }

  const handleRirChange = (val: string) => {
    lastEditRef.current = 'rir'
    setRir(val)
    const n = parseFloat(val)
    if (!isNaN(n)) {
      setRpe(clampRpe(10 - clampRir(n)).toString())
    } else {
      setRpe('')
    }
  }

  // ── Rest & set-type helpers ───────────────────────────────────────────────
  const repsForRest   = (reps ? parseInt(reps) : null) ?? targetRepsMax ?? 8
  const recommendedRest = getRestTimeRange(repsForRest)
  const isCountedSet  = setType === 'Working Set' || setType === 'Top Set' || setType === 'Back Off Set'

  // ── Autosave ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const weightNum = weight ? parseFloat(weight) : 0
    const repsNum   = reps   ? parseInt(reps)     : 0
    const rpeVal    = rpe    ? parseFloat(rpe)    : null

    if (weightNum > 0 || repsNum > 0 || rpeVal !== null) {
      setIsSaving(true)
      updateSet(sessionId, exerciseId, set.setNumber, {
        loadKg:      weightNum,
        reps:        repsNum,
        rpe:         rpeVal,
        setType: setType,
        completed:   weightNum > 0 && repsNum > 0,
      })

      setTimeout(() => {
        setIsSaving(false)
        setShowSaved(true)
        if (repsNum > 0 && !set.completed && isCountedSet) setShowTimer(true)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000)
      }, 300)
    }
  }, [sessionId, exerciseId, set.setNumber, set.completed, weight, reps, rpe, setType, isCountedSet, updateSet])

  useEffect(() => {
    if (!isActive) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(handleSave, 1000)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [weight, reps, rpe, isActive, handleSave])

  useEffect(() => {
    return () => { if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current) }
  }, [])

  // ── Category cycling ──────────────────────────────────────────────────────
  const cycleCategory = () => {
    const next = CATEGORY_CYCLE[(CATEGORY_CYCLE.indexOf(setType) + 1) % CATEGORY_CYCLE.length]
    setSetType(next)
    updateSet(sessionId, exerciseId, set.setNumber, { setType: next })
  }

  const catStyle = CATEGORY_LABELS[setType] || CATEGORY_LABELS['Working Set']

  const inputCls = "text-center bg-white/5 border-white/10 focus:border-primary h-10 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          // 8 columns: # | Cat | Carga | Reps | RPE | RIR | ✓ | 🗑
          'grid grid-cols-[auto_auto_1fr_1fr_1fr_1fr_auto_auto] gap-1.5 items-center p-2 rounded-xl transition-all',
          set.completed && isCountedSet ? 'bg-primary/10' : 'bg-white/5',
          !isActive && 'opacity-60'
        )}
      >
        {/* Set number */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0',
          set.completed ? 'bg-primary text-primary-foreground' : 'bg-white/10'
        )}>
          {set.setNumber}
        </div>

        {/* Category badge */}
        <div className="relative">
          <button
            onClick={cycleCategory}
            onMouseEnter={() => setShowCategoryTooltip(true)}
            onMouseLeave={() => setShowCategoryTooltip(false)}
            disabled={!isActive}
            className={cn(
              'w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all',
              catStyle?.color || 'bg-white/10 text-muted-foreground border-white/10',
              isActive ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
            )}
          >
            {catStyle?.label || '?'}
          </button>
          <AnimatePresence>
            {showCategoryTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 pointer-events-none"
              >
                <div className="glass px-2 py-1 rounded text-xs whitespace-nowrap border border-white/10 shadow-xl">
                  {catStyle?.description || 'Categoria desconhecida'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Weight */}
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={!isActive}
            className={inputCls}
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">kg</span>
        </div>

        {/* Reps */}
        <Input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          disabled={!isActive}
          className={inputCls}
        />

        {/* RPE — changing this auto-fills RIR */}
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="RPE"
            min="1"
            max="10"
            step="0.5"
            value={rpe}
            onChange={(e) => handleRpeChange(e.target.value)}
            disabled={!isActive}
            className={cn(inputCls, 'text-amber-400 placeholder:text-muted-foreground')}
          />
        </div>

        {/* RIR — changing this auto-fills RPE */}
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="RIR"
            min="0"
            max="9"
            step="1"
            value={rir}
            onChange={(e) => handleRirChange(e.target.value)}
            disabled={!isActive}
            className={cn(inputCls, 'text-sky-400 placeholder:text-muted-foreground')}
          />
        </div>

        {/* Save indicator */}
        <div className="w-7 h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div key="saving" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <svg className="w-4 h-4 text-muted-foreground animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </motion.div>
            ) : showSaved ? (
              <motion.div key="saved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <Check className="w-4 h-4 text-primary" />
              </motion.div>
            ) : !isCountedSet ? (
              <Thermometer className="w-4 h-4 text-muted-foreground/40" />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Remove set */}
        <div className="w-7 h-8 flex items-center justify-center">
          {canRemove && isActive && (
            <button
              onClick={() => removeSet(sessionId, exerciseId, set.setNumber)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
              title="Remover série"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Rest Timer */}
      <AnimatePresence>
        {showTimer && (
          <RestTimer
            recommendedRange={recommendedRest}
            onClose={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
