'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { useWorkout } from '@/lib/workout-context'
import { muscleGroupLabels, muscleGroupColors } from '@/lib/mock-data'
import { getNutritionAction } from '@/app/nutrition/actions'
import { getAthleteProfileAction } from '@/app/profile/actions'
import type { MuscleGroup } from '@/lib/types'
import type { NutritionPlan } from '@/lib/db/nutrition'
import type { AthleteProfile } from '@/lib/db/athlete'
import { cn } from '@/lib/utils'
import { Target, Dumbbell, Flame, Zap, ChevronRight, User, Apple } from 'lucide-react'

const COLOR_TO_HEX: Record<string, string> = {
  'bg-rose-500': '#f43f5e',
  'bg-orange-500': '#f97316',
  'bg-amber-600': '#d97706',
  'bg-blue-600': '#2563eb',
  'bg-sky-500': '#0ea5e9',
  'bg-indigo-500': '#6366f1',
  'bg-violet-500': '#8b5cf6',
  'bg-purple-600': '#9333ea',
  'bg-emerald-600': '#059669',
  'bg-teal-500': '#14b8a6',
  'bg-lime-600': '#65a30d',
}

const PHASE_TYPE_LABEL: Record<string, string> = {
  'Acumulação': 'Acumulação',
  'Transição': 'Transição',
  'Intensificação': 'Intensificação',
  'Teste': 'Semana de Teste',
  'Hipertrofia_Resistência': 'Hipertrofia Resistência',
  'Hipertrofia_Pico': 'Hipertrofia Pico',
}

export function TrainingConfigPanel() {
  const { currentPhase, plannedSessions, getPlannedVolumeByMuscle } = useWorkout()
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null)
  const [profile, setProfile] = useState<AthleteProfile | null>(null)

  useEffect(() => {
    getNutritionAction().then(r => { if (r.success && r.data) setNutrition(r.data) })
    getAthleteProfileAction().then(r => { if (r.success && r.data) setProfile(r.data) })
  }, [])

  const { muscleRows, totalSets } = useMemo(() => {
    const planned = getPlannedVolumeByMuscle()
    const total = Object.values(planned).reduce((s, v) => s + v, 0)
    const rows = Object.entries(planned)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([muscle, sets]) => ({
        muscle: muscle as MuscleGroup,
        sets,
        pct: total > 0 ? Math.round((sets / total) * 100) : 0,
      }))
    return { muscleRows: rows, totalSets: total }
  }, [getPlannedVolumeByMuscle])

  const trainingDaysPerWeek = useMemo(() => {
    const days = new Set(plannedSessions.map(s => s.dayOfWeek).filter(Boolean))
    return days.size
  }, [plannedSessions])

  if (!currentPhase) return null

  const phaseTypeLabel = currentPhase.phaseType
    ? PHASE_TYPE_LABEL[currentPhase.phaseType] ?? currentPhase.phaseType
    : null

  return (
    <GlassCard delay={0.05}>
      <GlassCardTitle className="mb-5">Configuração do Treino Atual</GlassCardTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Phase info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/8"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Fase Atual
          </div>

          <div>
            <p className="font-semibold text-sm leading-tight">{currentPhase.name}</p>
            {phaseTypeLabel && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                {phaseTypeLabel}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {currentPhase.durationWeeks && (
              <Row label="Duração" value={`${currentPhase.durationWeeks} semanas`} />
            )}
            {currentPhase.targetRirMin !== null && currentPhase.targetRirMax !== null && (
              <Row label="RIR alvo" value={`${currentPhase.targetRirMin}–${currentPhase.targetRirMax}`} />
            )}
            {currentPhase.etapa && (
              <Row label="Etapa" value={`Etapa ${currentPhase.etapa}`} />
            )}
            {currentPhase.techniqueFocus && (
              <Row label="Técnica" value={currentPhase.techniqueFocus} highlight />
            )}
            {currentPhase.volumePctTension !== null && currentPhase.volumePctMetabolic !== null && (
              <Row
                label="Split"
                value={`${Math.round((currentPhase.volumePctTension ?? 0) * 100)}% tensão / ${Math.round((currentPhase.volumePctMetabolic ?? 0) * 100)}% metabólico`}
              />
            )}
          </div>

          {currentPhase.progressionRule && (
            <p className="text-[11px] text-muted-foreground/70 italic leading-relaxed border-t border-white/8 pt-2">
              {currentPhase.progressionRule}
            </p>
          )}
        </motion.div>

        {/* Volume distribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5" />
              Distribuição de Volume
            </div>
            {totalSets > 0 && (
              <span className="text-[10px] text-muted-foreground">{totalSets.toFixed(0)} séries/sem</span>
            )}
          </div>

          {muscleRows.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum plano configurado.</p>
          ) : (
            <div className="space-y-2">
              {muscleRows.map(({ muscle, sets, pct }) => {
                const colorClass = muscleGroupColors[muscle]
                const colorHex = COLOR_TO_HEX[colorClass] ?? '#8b5cf6'
                return (
                  <div key={muscle}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorHex }} />
                        <span className="text-xs text-muted-foreground">{muscleGroupLabels[muscle]}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">
                        {sets.toFixed(0)}
                        <span className="text-muted-foreground font-normal"> séries</span>
                        <span className="text-muted-foreground font-normal ml-1">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: colorHex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Athlete + Nutrition */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/8"
        >
          {/* Athlete */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <User className="w-3.5 h-3.5" />
            Atleta
          </div>
          <div className="space-y-1.5 text-xs">
            <Row label="Dias de treino" value={`${trainingDaysPerWeek}×/semana`} />
            {profile?.goal && <Row label="Objetivo" value={profile.goal} highlight />}
            {profile?.experience_level && <Row label="Nível" value={profile.experience_level} />}
          </div>

          {/* Nutrition */}
          {nutrition && (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-white/8 pt-3 mt-1">
                <Apple className="w-3.5 h-3.5" />
                Dieta
              </div>
              <div className="space-y-1.5 text-xs">
                {nutrition.goal && <Row label="Meta" value={nutrition.goal} />}
                {nutrition.calories_target && (
                  <Row label="Calorias" value={`${nutrition.calories_target} kcal`} />
                )}
                {(nutrition.protein_g || nutrition.carbs_g || nutrition.fat_g) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Macros</span>
                    <div className="flex items-center gap-2 font-medium">
                      {nutrition.protein_g && (
                        <span className="text-rose-400">{nutrition.protein_g}g P</span>
                      )}
                      {nutrition.carbs_g && (
                        <span className="text-amber-400">{nutrition.carbs_g}g C</span>
                      )}
                      {nutrition.fat_g && (
                        <span className="text-sky-400">{nutrition.fat_g}g G</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </GlassCard>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('font-medium text-right', highlight && 'text-primary')}>{value}</span>
    </div>
  )
}
