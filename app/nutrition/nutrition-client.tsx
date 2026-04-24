'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Utensils, Zap, Brain, RotateCcw, CheckCircle2, Clock,
  AlertCircle, Ruler, History as HistoryIcon, ArrowRight,
  AlertTriangle, ChevronRight, CalendarDays, TrendingUp, TrendingDown,
  Scale, Dumbbell, BedDouble,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { confirmProtocolSwitchAction, updateProtocolAction } from './actions'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { NutritionProtocol } from '@/lib/db/nutrition'
import { toast } from 'sonner'

// ─────────────────────────── design-system colours ──────────────────────────

const GOAL_STYLE: Record<string, { text: string; bg: string; border: string; chart: string }> = {
  'Crescer Seco':  { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', chart: '#f59e0b' },
  'Ganho de Peso': { text: 'text-sky-400',   bg: 'bg-sky-400/10',   border: 'border-sky-400/30',   chart: '#38bdf8' },
  'Emagrecer':     { text: 'text-rose-400',  bg: 'bg-rose-400/10',  border: 'border-rose-400/30',  chart: '#fb7185' },
  'Manutenção':    { text: 'text-violet-400',bg: 'bg-violet-400/10',border: 'border-violet-400/30',chart: '#a78bfa' },
}
const DEFAULT_STYLE = { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', chart: 'var(--primary)' }
const gs = (goal: string) => GOAL_STYLE[goal] ?? DEFAULT_STYLE

const MACRO_COLORS = { protein: '#f59e0b', carbs: '#38bdf8', fat: '#fb7185' }

function durationLabel(start: string, end: string | null | undefined): string {
  if (!end) return `desde ${format(parseISO(start), "d MMM yyyy", { locale: ptBR })}`
  const days = differenceInDays(parseISO(end), parseISO(start))
  return `${days} dias · ${format(parseISO(start), "d MMM", { locale: ptBR })} → ${format(parseISO(end), "d MMM yy", { locale: ptBR })}`
}

// ─────────────────────────── MacroTile ──────────────────────────────────────

function MacroTile({ label, value, unit = 'g', colorClass }: {
  label: string; value?: number; unit?: string; colorClass: string
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-3xl font-black tracking-tighter', colorClass)}>
        {value ?? '—'}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

// ─────────────────────────── MacroSkeleton ──────────────────────────────────

function MacroSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── ProtocolCard (history) ─────────────────────────

function ProtocolCard({ p, isActive, onClick }: {
  p: NutritionProtocol; isActive?: boolean; onClick?: () => void
}) {
  const style = gs(p.goal)
  const days = p.end_date
    ? differenceInDays(parseISO(p.end_date), parseISO(p.start_date))
    : differenceInDays(new Date(), parseISO(p.start_date))

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group p-4 rounded-2xl border transition-all cursor-pointer',
        isActive
          ? cn(style.bg, style.border)
          : 'border-white/5 bg-white/5 hover:border-white/15',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className={cn('shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full', style.bg, style.text)}>
                Ativo
              </span>
            )}
            <h3 className={cn('font-bold truncate', isActive ? style.text : 'text-foreground')}>
              {p.goal}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {durationLabel(p.start_date, p.end_date)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {days} {!p.end_date ? 'dias e contando' : 'dias no total'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className={cn('text-lg font-black', style.text)}>{p.calories_training ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">kcal/treino</p>
          {p.calories_rest && p.calories_rest !== p.calories_training && (
            <p className="text-[10px] text-muted-foreground">{p.calories_rest} kcal/descanso</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
        {[
          { l: 'P', v: p.protein_g, cls: 'text-amber-400' },
          { l: 'C', v: p.carbs_g,   cls: 'text-sky-400' },
          { l: 'G', v: p.fat_g,     cls: 'text-rose-400' },
        ].map(({ l, v, cls }) => (
          <span key={l} className={cn('text-xs font-bold', cls)}>
            {l}: {v ?? '—'}g
          </span>
        ))}
        {p.weight_at_start && (
          <span className="text-xs text-muted-foreground ml-auto">
            {p.weight_at_start} kg início
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────── SwitchConfirmDialog ─────────────────────────────

function SwitchConfirmDialog({
  open, previousGoal, newGoal, newProtocolData,
  onConfirm, onCancel, saving,
}: {
  open: boolean
  previousGoal: string | null
  newGoal: string
  newProtocolData: any
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}) {
  const newStyle = gs(newGoal)
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            Trocar protocolo nutricional?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {previousGoal && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center px-2">
                <p className="text-[10px] text-muted-foreground uppercase">Atual</p>
                <p className={cn('font-bold text-sm', gs(previousGoal).text)}>{previousGoal}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-center px-2">
                <p className="text-[10px] text-muted-foreground uppercase">Novo</p>
                <p className={cn('font-bold text-sm', newStyle.text)}>{newGoal}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            O protocolo atual será encerrado com data de hoje e os novos alvos nutricionais entrarão em vigor imediatamente.
            {previousGoal && ' O histórico do protocolo anterior será preservado.'}
          </p>
          <div className={cn('p-3 rounded-xl border text-xs space-y-1', newStyle.bg, newStyle.border)}>
            <p className={cn('font-bold mb-1', newStyle.text)}>Novos alvos</p>
            <p className="text-muted-foreground">
              {newProtocolData?.calories_training} kcal treino · {newProtocolData?.calories_rest} kcal descanso
            </p>
            <p className="text-muted-foreground">
              P {newProtocolData?.protein_g}g · C {newProtocolData?.carbs_g}g · G {newProtocolData?.fat_g}g
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
          >
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Ativando...' : 'Confirmar troca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────── Main component ──────────────────────────────────

interface Props {
  initialProtocol: NutritionProtocol | null
  initialProtocols: NutritionProtocol[]
}

export default function NutritionClient({ initialProtocol, initialProtocols }: Props) {
  const [protocol, setProtocol] = useState<NutritionProtocol | null>(initialProtocol)
  const [protocols, setProtocols] = useState<NutritionProtocol[]>(initialProtocols)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [isRestDay, setIsRestDay] = useState(false)

  const [pendingSwitch, setPendingSwitch] = useState<{
    previousGoal: string | null
    previousId: string | null
    newData: any
  } | null>(null)

  const style = protocol ? gs(protocol.goal) : DEFAULT_STYLE
  const calories = protocol
    ? (isRestDay ? (protocol.calories_rest ?? protocol.calories_training) : protocol.calories_training)
    : undefined
  const carbs = protocol
    ? (isRestDay ? (protocol.carbs_rest_g ?? protocol.carbs_g) : protocol.carbs_g)
    : undefined

  const macroData = useMemo(() => {
    if (!protocol) return []
    return [
      { name: 'Proteínas', value: (protocol.protein_g ?? 0) * 4, color: MACRO_COLORS.protein },
      { name: 'Carbos', value: ((isRestDay ? protocol.carbs_rest_g : undefined) ?? protocol.carbs_g ?? 0) * 4, color: MACRO_COLORS.carbs },
      { name: 'Gorduras', value: (protocol.fat_g ?? 0) * 9, color: MACRO_COLORS.fat },
    ]
  }, [protocol, isRestDay])

  const generateAIPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/nutrition', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.goal_changed) {
        setPendingSwitch({
          previousGoal: data.previous_goal,
          previousId: data.active_protocol_id,
          newData: data,
        })
      } else {
        const updatedProtocol: NutritionProtocol = {
          ...protocol!,
          calories_training: data.calories_training,
          calories_rest: data.calories_rest,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          carbs_rest_g: data.carbs_rest_g,
          fat_g: data.fat_g,
          meals: data.meals,
          ai_logic: data.ai_logic,
          recommendations: data.recommendations,
        }
        setProtocol(updatedProtocol)
        setProtocols(prev => prev.map(p => p.is_active ? updatedProtocol : p))
        setActiveTab('today')
        toast.success('Protocolo atualizado com os alvos mais recentes!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar plano')
    } finally {
      setLoading(false)
    }
  }

  const confirmSwitch = async () => {
    if (!pendingSwitch) return
    setSaving(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const res = await confirmProtocolSwitchAction(pendingSwitch.previousId, {
        goal: pendingSwitch.newData.goal,
        start_date: today,
        end_date: null,
        is_active: true,
        calories_training: pendingSwitch.newData.calories_training,
        calories_rest: pendingSwitch.newData.calories_rest,
        protein_g: pendingSwitch.newData.protein_g,
        carbs_g: pendingSwitch.newData.carbs_g,
        carbs_rest_g: pendingSwitch.newData.carbs_rest_g,
        fat_g: pendingSwitch.newData.fat_g,
        meals: pendingSwitch.newData.meals,
        ai_logic: pendingSwitch.newData.ai_logic,
        recommendations: pendingSwitch.newData.recommendations,
      })
      if ('data' in (res as any) && (res as any).data) {
        const newProtocol = (res as any).data as NutritionProtocol
        setProtocol(newProtocol)
        setProtocols(prev => [newProtocol, ...prev.map(p => p.is_active ? { ...p, is_active: false } : p)])
        setActiveTab('today')
        toast.success(`Protocolo "${newProtocol.goal}" ativado!`)
      } else {
        toast.error((res as any).error || 'Erro ao trocar protocolo')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao trocar protocolo')
    } finally {
      setSaving(false)
      setPendingSwitch(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Nutrição</h1>
          {protocol ? (
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider', style.bg, style.text)}>
                {protocol.goal}
              </span>
              <span className="text-xs text-muted-foreground">
                {durationLabel(protocol.start_date, null)}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum protocolo ativo</p>
          )}
        </div>

        <Button
          onClick={generateAIPlan}
          disabled={loading}
          variant="outline"
          className="gap-2 border-white/10 glass-subtle"
        >
          <Brain className={cn('w-4 h-4 text-primary', loading && 'animate-pulse')} />
          {loading ? 'Calculando...' : 'IA Strategist'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* ────────── TAB: HOJE ────────── */}
        <TabsContent value="today" className="space-y-6">
          {protocol ? (
            <>
              {/* Training / Rest toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRestDay(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                    !isRestDay
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20',
                  )}
                >
                  <Dumbbell className="w-4 h-4" />
                  Dia de Treino
                </button>
                <button
                  onClick={() => setIsRestDay(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                    isRestDay
                      ? 'border-violet-400/50 bg-violet-400/10 text-violet-400'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20',
                  )}
                >
                  <BedDouble className="w-4 h-4" />
                  Dia de Descanso
                </button>
              </div>

              {/* Hero kcal */}
              <GlassCard className="p-8 text-center relative overflow-hidden">
                <div className={cn(
                  'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none transition-colors duration-500',
                  isRestDay ? 'bg-violet-400/8' : 'bg-primary/8'
                )} />
                <div className="relative">
                  <p className={cn('text-xs font-semibold uppercase tracking-widest mb-2', isRestDay ? 'text-violet-400' : style.text)}>
                    Meta de hoje · {isRestDay ? 'Descanso' : 'Treino'}
                  </p>

                  {loading ? (
                    <MacroSkeleton />
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${calories}-${isRestDay}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-baseline justify-center gap-2 mb-6"
                        >
                          <span className={cn('text-7xl md:text-8xl font-black tracking-tighter leading-none', isRestDay ? 'text-violet-400' : style.text)}>
                            {calories ?? '—'}
                          </span>
                          <span className="text-lg font-medium text-muted-foreground">kcal</span>
                        </motion.div>
                      </AnimatePresence>

                      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                        <MacroTile label="Proteína" value={protocol.protein_g} colorClass="text-amber-400" />
                        <MacroTile label="Carbos"   value={carbs}             colorClass="text-sky-400" />
                        <MacroTile label="Gorduras" value={protocol.fat_g}    colorClass="text-rose-400" />
                      </div>

                      {protocol.calories_rest && protocol.calories_rest !== protocol.calories_training && (
                        <p className="mt-4 text-xs text-muted-foreground">
                          {isRestDay
                            ? `Treino: ${protocol.calories_training} kcal · ${protocol.carbs_g}g carbs`
                            : `Descanso: ${protocol.calories_rest} kcal · ${protocol.carbs_rest_g ?? protocol.carbs_g}g carbs`}
                        </p>
                      )}

                      <Button
                        onClick={generateAIPlan}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="mt-6 gap-2 border-white/10 glass-subtle"
                      >
                        <RotateCcw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        {loading ? 'Recalculando...' : 'Recalcular com peso atual'}
                      </Button>
                    </>
                  )}
                </div>
              </GlassCard>

              {/* Next meal preview */}
              {protocol.meals && protocol.meals.length > 0 && (
                <GlassCard className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Próxima refeição</p>
                    <p className="font-bold text-base">{protocol.meals[0].name}</p>
                    <p className="text-xs text-muted-foreground">{protocol.meals[0].time} · {protocol.meals[0].items?.length ?? 0} itens</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver plano completo
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </GlassCard>
              )}

              {/* AI recommendation */}
              {protocol.recommendations?.[0] && (
                <GlassCard className="p-4 flex items-start gap-3">
                  <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {protocol.recommendations[0]}
                  </p>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard className="p-8 text-center">
              <Utensils className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold text-base mb-1">Nenhum protocolo ativo</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Gere seu primeiro protocolo nutricional com IA. Os alvos serão calculados com base no seu peso, objetivo e fase de treino.
              </p>
              <Button onClick={generateAIPlan} disabled={loading} className="gap-2">
                <Brain className="w-4 h-4" />
                {loading ? 'Gerando...' : 'Gerar protocolo com IA'}
              </Button>
            </GlassCard>
          )}
        </TabsContent>

        {/* ────────── TAB: PLANO ────────── */}
        <TabsContent value="plan" className="space-y-8">
          {protocol ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Macro distribution */}
              <GlassCard className={cn('lg:col-span-1 p-6', style.border)}>
                <GlassCardTitle className="flex items-center gap-2 mb-6">
                  <Zap className={cn('w-5 h-5', style.text)} />
                  Metas Diárias
                </GlassCardTitle>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                        {macroData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Treino</span>
                    <span className={cn('text-xl font-black', style.text)}>{protocol.calories_training} kcal</span>
                  </div>
                  {protocol.calories_rest && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Descanso</span>
                      <span className="text-xl font-black text-violet-400">{protocol.calories_rest} kcal</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Prot', val: protocol.protein_g, cls: 'text-amber-400' },
                      { label: 'Carb', val: protocol.carbs_g,   cls: 'text-sky-400' },
                      { label: 'Gord', val: protocol.fat_g,     cls: 'text-rose-400' },
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">{m.label}</div>
                        <div className={cn('text-lg font-bold', m.cls)}>{m.val}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Meal plan */}
              <div className="lg:col-span-2 space-y-6">
                <GlassCardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Cronograma de Refeições
                </GlassCardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(protocol.meals ?? []).map((meal: any, idx: number) => (
                    <GlassCard key={idx} hover className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{meal.time}</span>
                          <h3 className="text-lg font-bold">{meal.name}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Utensils className="w-4 h-4" />
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {(meal.items ?? []).map((item: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  ))}
                </div>

                {protocol.ai_logic && (
                  <GlassCard className="p-6">
                    <GlassCardTitle className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      Raciocínio da IA
                    </GlassCardTitle>
                    <p className="text-muted-foreground italic text-sm leading-relaxed mb-4">
                      "{protocol.ai_logic}"
                    </p>
                    {protocol.recommendations && protocol.recommendations.length > 0 && (
                      <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {protocol.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Brain className="w-16 h-16 text-muted-foreground/30 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Sem protocolo ativo</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Gere um protocolo nutricional com IA para ver o cronograma de refeições.
              </p>
              <Button onClick={generateAIPlan} disabled={loading} className="gap-2" size="lg">
                {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? 'Gerando...' : 'Gerar Protocolo'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ────────── TAB: HISTÓRICO ────────── */}
        <TabsContent value="history" className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <GlassCardTitle className="flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-primary" />
                  Histórico de Protocolos
                </GlassCardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada protocolo representa uma fase nutricional completa.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{protocols.length} fase{protocols.length !== 1 ? 's' : ''}</span>
            </div>

            {protocols.length > 0 ? (
              <div className="space-y-3">
                {protocols.map((p, i) => (
                  <ProtocolCard
                    key={p.id ?? i}
                    p={p}
                    isActive={p.is_active}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <HistoryIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum protocolo gerado ainda.</p>
                <button
                  onClick={() => { setActiveTab('today'); generateAIPlan() }}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Gerar primeiro protocolo
                </button>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>

      {pendingSwitch && (
        <SwitchConfirmDialog
          open={!!pendingSwitch}
          previousGoal={pendingSwitch.previousGoal}
          newGoal={pendingSwitch.newData.goal}
          newProtocolData={pendingSwitch.newData}
          onConfirm={confirmSwitch}
          onCancel={() => setPendingSwitch(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
