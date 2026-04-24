'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Button } from '@/components/ui/button'
import { confirmProtocolSwitchAction, updateProtocolAction } from './actions'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { NutritionProtocol } from '@/lib/db/nutrition'
import { toast } from 'sonner'

// ─────────────────────────── helpers ────────────────────────────────────────

const GOAL_COLORS: Record<string, string> = {
  'Crescer Seco': '#E9FF60',
  'Ganho de Peso': '#00F0FF',
  'Emagrecer': '#FF6B6B',
  'Manutenção': '#A78BFA',
}
const GOAL_BG: Record<string, string> = {
  'Crescer Seco': 'rgba(233,255,96,0.08)',
  'Ganho de Peso': 'rgba(0,240,255,0.08)',
  'Emagrecer': 'rgba(255,107,107,0.08)',
  'Manutenção': 'rgba(167,139,250,0.08)',
}
const goalColor = (g: string) => GOAL_COLORS[g] ?? '#E9FF60'
const goalBg = (g: string) => GOAL_BG[g] ?? 'rgba(233,255,96,0.08)'

function durationLabel(start: string, end: string | null | undefined): string {
  if (!end) return `desde ${format(parseISO(start), "d MMM yyyy", { locale: ptBR })}`
  const days = differenceInDays(parseISO(end), parseISO(start))
  return `${days} dias · ${format(parseISO(start), "d MMM", { locale: ptBR })} → ${format(parseISO(end), "d MMM yy", { locale: ptBR })}`
}

// ─────────────────────────── MacroTile ──────────────────────────────────────

function MacroTile({ label, value, unit = 'g', color }: {
  label: string; value?: number; unit?: string; color: string
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tighter" style={{ color }}>
        {value ?? '—'}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

// ─────────────────────────── ProtocolCard (history) ─────────────────────────

function ProtocolCard({ p, isActive, onClick }: {
  p: NutritionProtocol; isActive?: boolean; onClick?: () => void
}) {
  const color = goalColor(p.goal)
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
          ? 'border-[#E9FF60]/30 bg-[#E9FF60]/5'
          : 'border-white/5 bg-zinc-900/50 hover:border-white/20',
      )}
      style={isActive ? { borderColor: `${color}40`, background: goalBg(p.goal) } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${color}25`, color }}>
                Ativo
              </span>
            )}
            <h3 className="font-black text-white truncate" style={{ color: isActive ? color : undefined }}>
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
          <p className="text-lg font-black" style={{ color }}>{p.calories_training ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">kcal/treino</p>
          {p.calories_rest && p.calories_rest !== p.calories_training && (
            <p className="text-[10px] text-muted-foreground">{p.calories_rest} kcal/descanso</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
        {[
          { l: 'P', v: p.protein_g, c: '#E9FF60' },
          { l: 'C', v: p.carbs_g, c: '#00F0FF' },
          { l: 'G', v: p.fat_g, c: '#FF00E5' },
        ].map(({ l, v, c }) => (
          <span key={l} className="text-xs font-bold" style={{ color: c }}>
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
                <p className="font-bold text-sm" style={{ color: goalColor(previousGoal) }}>{previousGoal}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-center px-2">
                <p className="text-[10px] text-muted-foreground uppercase">Novo</p>
                <p className="font-bold text-sm" style={{ color: goalColor(newGoal) }}>{newGoal}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            O protocolo atual será encerrado com data de hoje e os novos alvos nutricionais entrarão em vigor imediatamente.
            {previousGoal && ' O histórico do protocolo anterior será preservado.'}
          </p>
          <div className="p-3 rounded-xl border border-[#E9FF60]/20 bg-[#E9FF60]/5 text-xs space-y-1">
            <p className="font-bold text-[#E9FF60] mb-1">Novos alvos</p>
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

  // Switch confirmation state
  const [pendingSwitch, setPendingSwitch] = useState<{
    previousGoal: string | null
    previousId: string | null
    newData: any
  } | null>(null)

  const color = protocol ? goalColor(protocol.goal) : '#E9FF60'
  const calories = protocol
    ? (isRestDay ? (protocol.calories_rest ?? protocol.calories_training) : protocol.calories_training)
    : undefined
  const carbs = protocol
    ? (isRestDay ? (protocol.carbs_rest_g ?? protocol.carbs_g) : protocol.carbs_g)
    : undefined

  const macroData = useMemo(() => {
    if (!protocol) return []
    return [
      { name: 'Proteínas', value: (protocol.protein_g ?? 0) * 4, color: '#E9FF60' },
      { name: 'Carbos', value: ((isRestDay ? protocol.carbs_rest_g : undefined) ?? protocol.carbs_g ?? 0) * 4, color: '#00F0FF' },
      { name: 'Gorduras', value: (protocol.fat_g ?? 0) * 9, color: '#FF00E5' },
    ]
  }, [protocol, isRestDay])

  const generateAIPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/nutrition', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.goal_changed) {
        // Goal changed — require confirmation before switching
        setPendingSwitch({
          previousGoal: data.previous_goal,
          previousId: data.active_protocol_id,
          newData: data,
        })
      } else {
        // Same goal — protocol already updated server-side, refresh local state
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
        weight_at_start: pendingSwitch.newData.weight_at_start,
        phase_id: pendingSwitch.newData.phase_id,
        model_used: pendingSwitch.newData.model_used,
      })

      if (res.success && res.data) {
        const newProtocol = res.data
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-white tracking-tighter flex items-center gap-3 uppercase">
            <Utensils className="w-10 h-10" style={{ color }} />
            Nutrição <span style={{ color: '#00F0FF' }}>Inteligente</span>
          </h1>
          {protocol ? (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                style={{ background: `${color}20`, color }}
              >
                {protocol.goal}
              </span>
              <span className="text-xs text-muted-foreground">
                {durationLabel(protocol.start_date, null)}
              </span>
            </div>
          ) : (
            <p className="text-zinc-400 mt-1">Nenhum protocolo ativo</p>
          )}
        </div>

        <button
          onClick={generateAIPlan}
          disabled={loading}
          className="flex items-center gap-2 bg-zinc-900 border border-[#00F0FF]/30 hover:border-[#00F0FF] text-white px-6 py-3 rounded-xl transition-all font-bold group disabled:opacity-50"
        >
          <Brain className={`w-5 h-5 text-[#00F0FF] ${loading ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
          {loading ? 'Calculando...' : 'IA Strategist'}
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-xl w-full max-w-lg">
          <TabsTrigger value="today" className="flex-1 data-[state=active]:bg-[#E9FF60] data-[state=active]:text-black">Hoje</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">Plano</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">Histórico</TabsTrigger>
        </TabsList>

        {/* ────────── TAB: HOJE ────────── */}
        <TabsContent value="today" className="space-y-6">
          {protocol ? (
            <>
              {/* Training / Rest day toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRestDay(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border',
                    !isRestDay
                      ? 'border-[#E9FF60]/50 bg-[#E9FF60]/10 text-[#E9FF60]'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20',
                  )}
                >
                  <Dumbbell className="w-4 h-4" />
                  Dia de Treino
                </button>
                <button
                  onClick={() => setIsRestDay(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border',
                    isRestDay
                      ? 'border-purple-400/50 bg-purple-400/10 text-purple-400'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20',
                  )}
                >
                  <BedDouble className="w-4 h-4" />
                  Dia de Descanso
                </button>
              </div>

              {/* Hero kcal */}
              <GlassCard className="p-8 text-center relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none transition-colors duration-500"
                  style={{ background: isRestDay ? 'rgba(167,139,250,0.12)' : `${color}18` }}
                />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: isRestDay ? '#A78BFA' : color }}>
                    Meta de hoje · {isRestDay ? 'Descanso' : 'Treino'}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${calories}-${isRestDay}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-baseline justify-center gap-2 mb-6"
                    >
                      <span
                        className="text-7xl md:text-8xl font-black tracking-tighter leading-none"
                        style={{ color: isRestDay ? '#A78BFA' : color }}
                      >
                        {calories ?? '—'}
                      </span>
                      <span className="text-lg font-medium text-muted-foreground">kcal</span>
                    </motion.div>
                  </AnimatePresence>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <MacroTile label="Proteína" value={protocol.protein_g} color="#E9FF60" />
                    <MacroTile label="Carbos" value={carbs} color="#00F0FF" />
                    <MacroTile label="Gorduras" value={protocol.fat_g} color="#FF00E5" />
                  </div>

                  {protocol.calories_rest && protocol.calories_rest !== protocol.calories_training && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {isRestDay
                        ? `Treino: ${protocol.calories_training} kcal · ${protocol.carbs_g}g carbs`
                        : `Descanso: ${protocol.calories_rest} kcal · ${protocol.carbs_rest_g ?? protocol.carbs_g}g carbs`}
                    </p>
                  )}

                  <button
                    onClick={generateAIPlan}
                    disabled={loading}
                    className="mt-6 inline-flex items-center gap-2 bg-zinc-900 border border-[#00F0FF]/30 hover:border-[#00F0FF] text-white px-5 py-2.5 rounded-xl transition-all font-semibold text-sm disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 text-[#00F0FF] ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Recalculando...' : 'Recalcular com peso atual'}
                  </button>
                </div>
              </GlassCard>

              {/* Next meal preview */}
              {protocol.meals && protocol.meals.length > 0 && (
                <GlassCard className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Próxima refeição</p>
                    <p className="font-bold text-base">{protocol.meals[0].name}</p>
                    <p className="text-xs text-muted-foreground">{protocol.meals[0].time} · {protocol.meals[0].items?.length ?? 0} itens</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#00F0FF] hover:underline"
                  >
                    Ver plano completo
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </GlassCard>
              )}

              {/* AI rationale */}
              {protocol.recommendations?.[0] && (
                <GlassCard className="p-4 border-[#00F0FF]/20 flex items-start gap-3">
                  <Brain className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
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
              <button
                onClick={generateAIPlan}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#E9FF60] hover:bg-[#d4e94d] text-black px-5 py-2.5 rounded-xl transition-all font-bold text-sm disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                {loading ? 'Gerando...' : 'Gerar protocolo com IA'}
              </button>
            </GlassCard>
          )}
        </TabsContent>

        {/* ────────── TAB: PLANO ────────── */}
        <TabsContent value="plan" className="space-y-8">
          {protocol ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Macro distribution */}
              <GlassCard className="lg:col-span-1 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 transition-all pointer-events-none"
                  style={{ background: `${color}18` }} />
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color }} />
                  Metas Diárias
                </h2>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                        {macroData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Treino</span>
                    <span className="text-xl font-black" style={{ color }}>{protocol.calories_training} kcal</span>
                  </div>
                  {protocol.calories_rest && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Descanso</span>
                      <span className="text-xl font-black text-purple-400">{protocol.calories_rest} kcal</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Prot', val: protocol.protein_g, color: '#E9FF60' },
                      { label: 'Carb', val: protocol.carbs_g, color: '#00F0FF' },
                      { label: 'Gord', val: protocol.fat_g, color: '#FF00E5' },
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">{m.label}</div>
                        <div className="text-lg font-bold" style={{ color: m.color }}>{m.val}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Meal plan */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#00F0FF]" />
                  Cronograma de Refeições
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(protocol.meals ?? []).map((meal: any, idx: number) => (
                    <GlassCard key={idx} className="p-5 hover:border-[#00F0FF]/50 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest">{meal.time}</span>
                          <h3 className="text-lg font-bold text-white group-hover:text-[#00F0FF] transition-colors">{meal.name}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF]">
                          <Utensils className="w-4 h-4" />
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {(meal.items ?? []).map((item: string, i: number) => (
                          <li key={i} className="text-zinc-400 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  ))}
                </div>

                {protocol.ai_logic && (
                  <GlassCard className="p-6 border-[#FF00E5]/20">
                    <h3 className="text-sm font-bold text-[#FF00E5] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Raciocínio da IA
                    </h3>
                    <p className="text-zinc-300 italic text-sm leading-relaxed mb-4">
                      "{protocol.ai_logic}"
                    </p>
                    {protocol.recommendations && protocol.recommendations.length > 0 && (
                      <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {protocol.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#E9FF60] flex-shrink-0 mt-0.5" />
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
              <Brain className="w-16 h-16 text-[#00F0FF] mb-6 opacity-50" />
              <h2 className="text-2xl font-bold text-white mb-2">Sem protocolo ativo</h2>
              <p className="text-zinc-500 max-w-md mb-8">
                Gere um protocolo nutricional com IA para ver o cronograma de refeições.
              </p>
              <button
                onClick={generateAIPlan}
                disabled={loading}
                className="flex items-center gap-2 bg-[#00F0FF] hover:bg-[#00d8e6] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all disabled:opacity-50"
              >
                {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                {loading ? 'Gerando...' : 'Gerar Protocolo'}
              </button>
            </div>
          )}
        </TabsContent>

        {/* ────────── TAB: HISTÓRICO ────────── */}
        <TabsContent value="history" className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <GlassCardTitle className="flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-[#00F0FF]" />
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
                  className="mt-4 text-sm text-[#00F0FF] hover:underline"
                >
                  Gerar primeiro protocolo
                </button>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* ── Protocol switch confirmation dialog ── */}
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
