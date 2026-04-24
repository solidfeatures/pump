'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import {
  User, Target, Clock, BarChart3, Apple, Zap, Flame,
  Loader2, Edit2, TrendingUp, CheckCircle2,
} from 'lucide-react'
import { useWorkout } from '@/lib/workout-context'
import {
  getProfileAction,
  getLatestMetricsAction,
  getLatestNutritionPlanAction,
  updateProfileAction,
} from '@/app/actions'
import type { AthleteProfile } from '@/lib/db/athlete'
import type { BodyMetric } from '@/lib/db/measures'
import type { NutritionPlan } from '@/lib/db/nutrition'
import type { AthleteGoal } from '@/lib/types'

const goalOptions: AthleteGoal[] = ['Crescer Seco', 'Emagrecer', 'Ganho de Peso', 'Manutenção']

export function AthleteSummaryCard() {
  const { currentPhase } = useWorkout()
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [metrics, setMetrics] = useState<BodyMetric | null>(null)
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [updatingGoal, setUpdatingGoal] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [p, m, n] = await Promise.all([
          getProfileAction(),
          getLatestMetricsAction(),
          getLatestNutritionPlanAction(),
        ])
        setProfile(p)
        setMetrics(m)
        setNutrition(n)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleUpdateGoal = async (goal: AthleteGoal) => {
    if (!profile) return
    setUpdatingGoal(true)
    try {
      const updated = await updateProfileAction({ id: profile.id, goal })
      setProfile(updated)
      setIsEditingGoal(false)
      const n = await getLatestNutritionPlanAction()
      setNutrition(n)
    } finally {
      setUpdatingGoal(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <GlassCard className="overflow-hidden p-0 border-primary/20">
        {/* Header strip */}
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
            {/* Section 1 — Objetivo & Fase */}
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3 text-primary" />
                  Objetivo Principal
                </p>
                {isEditingGoal ? (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      className="w-full bg-black/60 border border-primary/30 rounded-xl text-sm p-2 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                      value={profile?.goal}
                      onChange={(e) => handleUpdateGoal(e.target.value as AthleteGoal)}
                      disabled={updatingGoal}
                    >
                      {goalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {updatingGoal && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                    <p className="text-xl font-black text-primary tracking-tight">
                      {loading ? '...' : (profile?.goal || 'Crescer Seco')}
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
                    <span className="font-bold text-foreground">{currentPhase?.name || '--'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Metodologia</span>
                    <span className="text-foreground/80">Jayme de Lamadrid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Medidas */}
            <div className="space-y-4 md:border-l md:border-r border-white/5 md:px-8">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-blue-500" />
                Medidas Atuais
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Peso</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {loading ? '...' : (metrics?.weight_kg ? `${metrics.weight_kg}` : '--')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">BF</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {loading ? '...' : (metrics?.bf_pct ? `${metrics.bf_pct}` : '--')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                  </p>
                </div>
              </div>

              <Link href="/measures">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs border-white/10 bg-white/5">
                  Atualizar medidas
                </Button>
              </Link>
            </div>

            {/* Section 3 — Nutrição */}
            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                <Apple className="w-3 h-3 text-emerald-500" />
                Estratégia Nutricional
              </p>

              {nutrition ? (
                <div className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-emerald-500 tracking-tighter">{nutrition.calories_target}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">kcal/dia</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400">{nutrition.protein_g}g</p>
                      <p className="text-[8px] text-muted-foreground uppercase">Prot</p>
                    </div>
                    <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400">{nutrition.carbs_g}g</p>
                      <p className="text-[8px] text-muted-foreground uppercase">Carb</p>
                    </div>
                    <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400">{nutrition.fat_g}g</p>
                      <p className="text-[8px] text-muted-foreground uppercase">Gord</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-2 items-start">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      {nutrition.recommendations?.[0] || 'Plano otimizado para sua fase atual.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-4 text-center">
                  <Flame className="w-6 h-6 text-muted-foreground/30 mb-2" />
                  <p className="text-[10px] text-muted-foreground mb-2">Gere seu plano nutricional</p>
                  <Link href="/nutrition">
                    <Button size="sm" className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-500">Configurar</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Phase details row */}
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
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
