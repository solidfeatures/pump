'use client'

import { useState, useMemo } from 'react'
import { BodyMetric } from '@/lib/db/measures'
import { GlassCard, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { saveMeasuresAction, deleteMeasureAction } from './actions'
import { toast } from 'sonner'
import {
  Ruler,
  History as HistoryIcon,
  BarChart3,
  Plus,
  Scale,
  Calculator,
  Pencil,
  Trash2,
  AlertCircle,
  Clock,
  Zap,
  Activity,
  Info,
} from 'lucide-react'
import {
  calcMcCallumProportions,
  calcReevesProportions,
  calcNaturalLBMLimit,
} from '@/lib/body-proportions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PhotoSection } from '@/components/photo-section'
import { BodyProgressTimeline } from '@/components/body-progress-timeline'

interface MeasuresClientProps {
  initialHistory: BodyMetric[]
  latestMetrics: BodyMetric | null
}

// Returns average of bilateral pair, falls back to aggregate field, then null
function effective(m: BodyMetric | null, left: keyof BodyMetric, right: keyof BodyMetric, agg: keyof BodyMetric): number | null {
  if (!m) return null
  const l = m[left] as number | undefined
  const r = m[right] as number | undefined
  if (l && r) return (l + r) / 2
  if (l) return l
  if (r) return r
  const a = m[agg] as number | undefined
  return a ?? null
}

function MeasurementGuideSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Ruler className="w-4 h-4 text-emerald-500" />
            Como Medir Corretamente
          </SheetTitle>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Convenção clássica do fisiculturismo — a mesma usada por Reeves, McCallum e Casey Butt ao derivar as fórmulas. Para que os cálculos façam sentido, as medidas precisam seguir este padrão.
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-6 py-4 space-y-6 text-sm">

            {/* Contracted */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                Contraído (flexionado)
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Braço',
                    text: 'Flexionado a 90°, no pico do bíceps contraído. Essa é a medida usada em todas as fórmulas clássicas. Medir relaxado dá um número bem menor e quebra a comparação.',
                  },
                  {
                    label: 'Panturrilha',
                    text: 'Contraída, em pé na ponta dos pés, na parte mais grossa.',
                  },
                  {
                    label: 'Antebraço',
                    text: 'Punho fechado com força, braço estendido, na parte mais grossa. O padrão antigo é contraído — o importante é ser consistente.',
                  },
                ].map(({ label, text }) => (
                  <div key={label} className="pl-4 border-l-2 border-amber-400/30">
                    <p className="font-semibold text-amber-300 text-xs mb-0.5">{label}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Relaxed */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-400" />
                Relaxado
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Pulso',
                    text: 'Sempre relaxado, logo abaixo do osso saliente (processo estiloide), no ponto mais fino.',
                  },
                  {
                    label: 'Tornozelo',
                    text: 'Relaxado, no ponto mais fino acima do osso.',
                  },
                  {
                    label: 'Joelho',
                    text: 'Perna reta e relaxada, passando por cima da patela.',
                  },
                  {
                    label: 'Pescoço',
                    text: 'Relaxado, logo abaixo do pomo de Adão, fita paralela ao chão (não inclinada).',
                  },
                  {
                    label: 'Peito',
                    text: 'Relaxado, braços ao lado do corpo, fita na linha dos mamilos, no final de uma expiração normal (nem inflado nem esvaziado ao máximo).',
                  },
                  {
                    label: 'Cintura',
                    text: 'No ponto mais estreito (geralmente logo acima do umbigo), sem contrair o abdômen para dentro e sem empurrar para fora. Respiração normal.',
                  },
                  {
                    label: 'Quadril / Pelve',
                    text: 'Relaxado, no ponto mais largo dos glúteos. Atenção: Reeves usava "pelve" no sentido dos ossos do quadril (crista ilíaca), que pode diferir da parte mais larga da bunda. Na prática, a maioria mede na parte mais larga dos glúteos.',
                  },
                  {
                    label: 'Coxa',
                    text: 'Em pé, peso distribuído nas duas pernas, na parte mais grossa logo abaixo da prega glútea. Relaxada.',
                  },
                ].map(({ label, text }) => (
                  <div key={label} className="pl-4 border-l-2 border-sky-400/30">
                    <p className="font-semibold text-sky-300 text-xs mb-0.5">{label}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                Dicas para não introduzir viés
              </h3>
              <ol className="space-y-3 list-none">
                {[
                  'Meça sempre no mesmo horário do dia, de preferência de manhã, em jejum. Inchaço, refeição e hidratação podem mexer 1–2 cm em cintura e coxa.',
                  'Fita métrica de costureira, não de obra. Apertada o suficiente para encostar na pele sem comprimir o tecido.',
                  'Fita paralela ao chão (perpendicular ao membro), nunca inclinada — inclinar sempre aumenta o número.',
                  'Peça para alguém medir pescoço, cintura e peito, ou use espelho. Sozinho você tende a apertar demais ou curvar a fita.',
                  'Meça três vezes e tire a média, especialmente braço e panturrilha contraídos.',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 leading-relaxed">
              <strong>Importante:</strong> Para comparar com os números do McCallum, o crucial é que <strong>braço, panturrilha e antebraço estejam contraídos</strong> — senão o déficit que aparece será artificialmente maior do que realmente é.
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function MeasuresClient({ initialHistory, latestMetrics: initialLatest }: MeasuresClientProps) {
  const [history, setHistory] = useState<BodyMetric[]>(initialHistory)
  const [latestMetrics, setLatestMetrics] = useState<BodyMetric | null>(initialLatest)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<keyof BodyMetric>('weight_kg')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const getInitialFormData = (metrics: BodyMetric | null): Partial<BodyMetric> => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (!metrics) return { date: today, sleep_hours: 8, energy_level: 7, pain_notes: '' }
    const { id, created_at, date, ...rest } = metrics
    return { ...rest, date: today, pain_notes: rest.pain_notes || '', sleep_hours: rest.sleep_hours ?? 8, energy_level: rest.energy_level ?? 7 }
  }

  const [formData, setFormData] = useState<Partial<BodyMetric>>(() => getInitialFormData(initialLatest))

  const mcCallum = useMemo(() => {
    if (!latestMetrics?.wrist_cm) return null
    return calcMcCallumProportions(Number(latestMetrics.wrist_cm))
  }, [latestMetrics])

  const reeves = useMemo(() => {
    return calcReevesProportions(
      latestMetrics?.wrist_cm ? Number(latestMetrics.wrist_cm) : null,
      latestMetrics?.ankle_cm ? Number(latestMetrics.ankle_cm) : null,
    )
  }, [latestMetrics])

  const naturalLimit = useMemo(() => {
    if (!latestMetrics?.wrist_cm || !latestMetrics?.ankle_cm || !latestMetrics?.height_cm) return null
    return calcNaturalLBMLimit(
      Number(latestMetrics.wrist_cm),
      Number(latestMetrics.ankle_cm),
      Number(latestMetrics.height_cm),
    )
  }, [latestMetrics])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await saveMeasuresAction(formData)
    if (result.success) {
      toast.success(isEditing ? 'Medidas atualizadas!' : 'Medidas salvas com sucesso!')
      const updatedHistory = [...history]
      const index = updatedHistory.findIndex(m => m.date === result.data.date)
      if (index >= 0) updatedHistory[index] = result.data
      else updatedHistory.unshift(result.data)
      const sorted = updatedHistory.sort((a, b) => b.date.localeCompare(a.date))
      setHistory(sorted)
      setLatestMetrics(sorted[0])
      setIsDialogOpen(false)
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Erro ao salvar')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteMeasureAction(id)
    if (result.success) {
      toast.success('Medida excluída')
      const newHistory = history.filter(m => m.id !== id)
      setHistory(newHistory)
      if (latestMetrics?.id === id) setLatestMetrics(newHistory[0] || null)
    } else {
      toast.error(result.error || 'Erro ao excluir')
    }
  }

  const handleEdit = (metric: BodyMetric) => {
    setFormData(metric)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const openNewRegistry = () => {
    setFormData(getInitialFormData(latestMetrics))
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const set = (field: keyof BodyMetric, raw: string) =>
    setFormData(prev => ({ ...prev, [field]: raw ? Number(raw) : undefined }))

  const chartData = useMemo(() => {
    return [...history].reverse().map(m => ({
      date: format(new Date(m.date), 'dd/MM', { locale: ptBR }),
      value: Number(m[selectedMetric]) || 0,
    }))
  }, [history, selectedMetric])

  const metricsOptions = [
    { label: 'Peso', value: 'weight_kg' },
    { label: 'BF%', value: 'bf_pct' },
    { label: 'Cintura', value: 'waist_cm' },
    { label: 'Peito', value: 'chest_cm' },
    { label: 'Ombros', value: 'shoulders_cm' },
    { label: 'Quadril', value: 'hips_cm' },
    { label: 'Braços', value: 'arms_cm' },
    { label: 'Coxas', value: 'thighs_cm' },
    { label: 'Sono', value: 'sleep_hours' },
    { label: 'Energia', value: 'energy_level' },
  ]

  // Current measurements for proportion comparisons
  const currentArms     = effective(latestMetrics, 'arm_left_cm', 'arm_right_cm', 'arms_cm')
  const currentCalves   = effective(latestMetrics, 'calf_left_cm', 'calf_right_cm', 'calves_cm')
  const currentThighs   = effective(latestMetrics, 'thigh_left_cm', 'thigh_right_cm', 'thighs_cm')
  const currentForearms = effective(latestMetrics, 'forearm_left_cm', 'forearm_right_cm', 'forearms_cm')

  // McCallum measurement map: formula key → current value
  const mcCallumCurrent: Record<string, number | null> = {
    chest:    latestMetrics?.chest_cm    ? Number(latestMetrics.chest_cm)    : null,
    waist:    latestMetrics?.waist_cm    ? Number(latestMetrics.waist_cm)    : null,
    hips:     latestMetrics?.hips_cm     ? Number(latestMetrics.hips_cm)     : null,
    thighs:   currentThighs,
    neck:     latestMetrics?.neck_cm     ? Number(latestMetrics.neck_cm)     : null,
    arms:     currentArms,
    calves:   currentCalves,
    forearms: currentForearms,
  }

  const mcCallumLabels: Record<string, string> = {
    chest: 'Peito', waist: 'Cintura', hips: 'Quadril', thighs: 'Coxas',
    neck: 'Pescoço', arms: 'Braços', calves: 'Panturrilhas', forearms: 'Antebraços',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Medidas</h1>
          <p className="text-muted-foreground">Monitore sua evolução física e proporções naturais.</p>
        </div>
        <Button onClick={openNewRegistry} className="gap-2 self-start md:self-center">
          <Plus className="w-4 h-4" />
          Registrar Medidas
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />Progresso
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <HistoryIcon className="w-4 h-4" />Registros
          </TabsTrigger>
          <TabsTrigger value="proportions" className="gap-2">
            <Ruler className="w-4 h-4" />Análise Corporal
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Scale className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Peso Atual</span>
                  <span className="text-2xl font-bold">{latestMetrics?.weight_kg || '--'} <small className="text-sm font-normal text-muted-foreground">kg</small></span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Calculator className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">BF Atual</span>
                  <span className="text-2xl font-bold">{latestMetrics?.bf_pct || '--'} <small className="text-sm font-normal text-muted-foreground">%</small></span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Activity className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">IMC</span>
                  <span className="text-2xl font-bold">
                    {latestMetrics?.weight_kg && latestMetrics?.height_cm
                      ? (Number(latestMetrics.weight_kg) / Math.pow(Number(latestMetrics.height_cm) / 100, 2)).toFixed(1)
                      : '--'}
                  </span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-blue-500 mb-2 opacity-50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Sono</span>
                  <span className="text-2xl font-bold">{latestMetrics?.sleep_hours || '--'} <small className="text-sm font-normal text-muted-foreground">h</small></span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Zap className="w-8 h-8 text-amber-500 mb-2 opacity-50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Energia</span>
                  <span className="text-2xl font-bold">{latestMetrics?.energy_level || '--'}<small className="text-sm font-normal text-muted-foreground">/10</small></span>
                </GlassCard>
              </div>
              {latestMetrics?.pain_notes && (
                <GlassCard className="border-amber-500/20 bg-amber-500/5">
                  <GlassCardTitle className="text-sm flex items-center gap-2 text-amber-500">
                    <AlertCircle className="w-4 h-4" />
                    Notas de Recuperação
                  </GlassCardTitle>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">"{latestMetrics.pain_notes}"</p>
                </GlassCard>
              )}
            </div>

            <GlassCard className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <GlassCardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Evolução Temporal
                </GlassCardTitle>
                <div className="flex flex-wrap gap-1">
                  {metricsOptions.map(opt => (
                    <Button
                      key={opt.value}
                      variant={selectedMetric === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(opt.value as keyof BodyMetric)}
                      className="h-7 text-[10px] px-2"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#10b981' }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Progress timeline */}
          <BodyProgressTimeline metrics={history} />

          {/* Photo management */}
          <PhotoSection />
        </TabsContent>

        {/* ── HISTORY ── */}
        <TabsContent value="history">
          <GlassCard>
            <GlassCardTitle className="mb-4 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-emerald-500" />
              Histórico de Registros
            </GlassCardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 px-4 font-medium">Data</th>
                    <th className="py-3 px-4 font-medium">Peso</th>
                    <th className="py-3 px-4 font-medium">BF%</th>
                    <th className="py-3 px-4 font-medium">Cintura</th>
                    <th className="py-3 px-4 font-medium">Quadril</th>
                    <th className="py-3 px-4 font-medium">Braço</th>
                    <th className="py-3 px-4 font-medium">Energia</th>
                    <th className="py-3 px-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.length > 0 ? history.map(m => (
                    <tr key={m.id || m.date} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4">{format(new Date(m.date), 'dd MMM yyyy', { locale: ptBR })}</td>
                      <td className="py-3 px-4 font-medium">{m.weight_kg}kg</td>
                      <td className="py-3 px-4 text-muted-foreground">{m.bf_pct || '--'}%</td>
                      <td className="py-3 px-4 text-muted-foreground">{m.waist_cm || '--'}cm</td>
                      <td className="py-3 px-4 text-muted-foreground">{m.hips_cm || '--'}cm</td>
                      <td className="py-3 px-4 text-muted-foreground">{m.arms_cm || '--'}cm</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Zap className={`w-3 h-3 ${Number(m.energy_level) >= 7 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                          {m.energy_level || '--'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(m)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados desta data.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => m.id && handleDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground italic">Nenhum registro encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ── PROPORTIONS ── */}
        <TabsContent value="proportions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* McCallum */}
            <GlassCard>
              <div className="flex items-center justify-between mb-1">
                <GlassCardTitle>Sistema McCallum</GlassCardTitle>
                <MeasurementGuideSheet>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Info className="w-3.5 h-3.5" />
                    Como medir?
                  </Button>
                </MeasurementGuideSheet>
              </div>
              <GlassCardDescription className="mb-5 text-xs leading-relaxed">
                Criado por John McCallum para atletas naturais. Usa apenas o pulso como âncora óssea — calcula o peito ideal (6,5 × pulso) e todas as demais medidas derivam em cascata a partir dele. Simples e eficaz para uma primeira avaliação.
              </GlassCardDescription>

              {mcCallum ? (
                <div className="space-y-3">
                  {(Object.keys(mcCallum) as (keyof typeof mcCallum)[]).map(key => {
                    const ideal = mcCallum[key]
                    const current = mcCallumCurrent[key]
                    const diff = current !== null ? current - ideal : null
                    const pct = current !== null && ideal > 0 ? (current / ideal) * 100 : 0

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{mcCallumLabels[key]}</span>
                          <span className="font-mono text-xs">
                            {current !== null ? `${current.toFixed(1)} cm` : <span className="text-muted-foreground/50 italic">—</span>}
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-emerald-500">{ideal.toFixed(1)} cm</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 95 ? 'bg-emerald-500' : pct >= 80 ? 'bg-emerald-500/50' : 'bg-white/20'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        {diff !== null && (
                          <p className={`text-[10px] text-right ${Math.abs(diff) <= ideal * 0.05 ? 'text-emerald-500' : diff < 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {Math.abs(diff) <= ideal * 0.05 ? '✓ Proporcional' : diff < 0 ? `${Math.abs(diff).toFixed(1)} cm para a meta` : `+${diff.toFixed(1)} cm acima`}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {latestMetrics?.waist_cm && latestMetrics?.chest_cm && Number(latestMetrics.waist_cm) > Number(latestMetrics.chest_cm) * 0.80 && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Alerta:</strong> Cintura acima de 80% do peito — pode indicar excesso de gordura visceral.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Ruler className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Registre a medida do <strong>pulso</strong> para ativar o sistema McCallum.</p>
                </div>
              )}
            </GlassCard>

            {/* Reeves */}
            <GlassCard>
              <GlassCardTitle className="mb-1">Sistema Steve Reeves</GlassCardTitle>
              <GlassCardDescription className="mb-5 text-xs leading-relaxed">
                Usado pelo campeão Mr. Universe 1950. Cada medida tem sua própria âncora óssea (pulso, tornozelo, joelho, cabeça, pelve), tornando-o mais preciso individualmente. A regra estética central: <strong>Braço ≈ Panturrilha ≈ Pescoço</strong>.
              </GlassCardDescription>

              <div className="space-y-4">
                {/* Computable measurements */}
                {[
                  { label: 'Braços', ideal: reeves.arms, current: currentArms, anchor: `pulso × 2,52 (${latestMetrics?.wrist_cm || '?'} cm)` },
                  { label: 'Panturrilhas', ideal: reeves.calves, current: currentCalves, anchor: `tornozelo × 1,92 (${latestMetrics?.ankle_cm || '?'} cm)` },
                ].map(({ label, ideal, current, anchor }) => {
                  if (!ideal) return (
                    <div key={label} className="flex items-center justify-between py-2 opacity-40 border-b border-white/5">
                      <span className="text-sm">{label}</span>
                      <span className="text-xs text-muted-foreground italic">Requer {anchor.split('(')[0].trim()}</span>
                    </div>
                  )
                  const diff = current !== null ? current - ideal : null
                  const pct = current !== null ? (current / ideal) * 100 : 0
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{label}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({anchor})</span>
                        </div>
                        <span className="font-mono text-xs">
                          {current !== null ? `${current.toFixed(1)} cm` : <span className="text-muted-foreground/50 italic">—</span>}
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-emerald-500">{ideal.toFixed(1)} cm</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 95 ? 'bg-emerald-500' : pct >= 80 ? 'bg-emerald-500/50' : 'bg-white/20'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      {diff !== null && (
                        <p className={`text-[10px] text-right ${Math.abs(diff) <= ideal * 0.05 ? 'text-emerald-500' : diff < 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {Math.abs(diff) <= ideal * 0.05 ? '✓ Proporcional' : diff < 0 ? `${Math.abs(diff).toFixed(1)} cm para a meta` : `+${diff.toFixed(1)} cm acima`}
                        </p>
                      )}
                    </div>
                  )
                })}

                {/* Unavailable measurements */}
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50 mb-2">Requerem medidas adicionais</p>
                  {[
                    { label: 'Coxas', formula: '1,75 × joelho', missing: 'joelho' },
                    { label: 'Pescoço', formula: '79% da cabeça', missing: 'circumferência da cabeça' },
                    { label: 'Peito', formula: '1,48 × pelve', missing: 'pelve' },
                    { label: 'Cintura', formula: '86% da pelve', missing: 'pelve' },
                  ].map(({ label, formula, missing }) => (
                    <div key={label} className="flex items-center justify-between text-xs text-muted-foreground/50 py-1">
                      <span>{label}</span>
                      <span className="font-mono">{formula}</span>
                    </div>
                  ))}
                </div>

                {/* Aesthetic rule: Braço ≈ Panturrilha ≈ Pescoço */}
                {(currentArms || currentCalves || latestMetrics?.neck_cm) && (
                  <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs font-bold text-emerald-500 mb-3 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Regra dos 3 Irmãos: Braço ≈ Panturrilha ≈ Pescoço
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Braço', value: currentArms },
                        { label: 'Panturrilha', value: currentCalves },
                        { label: 'Pescoço', value: latestMetrics?.neck_cm ? Number(latestMetrics.neck_cm) : null },
                      ].map(({ label, value }) => {
                        const values = [currentArms, currentCalves, latestMetrics?.neck_cm ? Number(latestMetrics.neck_cm) : null].filter(Boolean) as number[]
                        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
                        const isBalanced = value !== null && avg !== null && Math.abs(value - avg) / avg < 0.05
                        return (
                          <div key={label} className={`p-2 rounded-lg ${value ? (isBalanced ? 'bg-emerald-500/10' : 'bg-amber-500/10') : 'bg-white/5'}`}>
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <p className={`text-lg font-bold ${value ? (isBalanced ? 'text-emerald-400' : 'text-amber-400') : 'text-muted-foreground/30'}`}>
                              {value ? `${value.toFixed(1)}` : '—'}
                            </p>
                            <p className="text-[9px] text-muted-foreground">cm</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Casey Butt LBM */}
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <GlassCardTitle className="mb-1">Potencial de Massa Magra (Casey Butt)</GlassCardTitle>
                <GlassCardDescription className="mb-4 text-xs leading-relaxed">
                  Fórmula de Casey Butt estima o máximo de massa magra (LBM) atingível naturalmente com ~5% de gordura corporal, baseado na sua estrutura óssea (altura, pulso e tornozelo). Requer os três campos preenchidos.
                </GlassCardDescription>
                {naturalLimit ? (
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-1">LBM Máximo Estimado (Natural)</p>
                    <p className="text-4xl font-black text-emerald-400">{naturalLimit.toFixed(1)} <small className="text-lg font-normal">kg</small></p>
                    {latestMetrics?.weight_kg && latestMetrics?.bf_pct && (() => {
                      const currentLBM = Number(latestMetrics.weight_kg) * (1 - Number(latestMetrics.bf_pct) / 100)
                      const potentialPct = (currentLBM / naturalLimit) * 100
                      return (
                        <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">LBM Atual: <span className="text-white font-medium">{currentLBM.toFixed(1)} kg</span></span>
                            <span className="font-bold text-emerald-500">{potentialPct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${Math.min(potentialPct, 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase text-center tracking-tighter">
                            {potentialPct < 85 ? 'Grande margem de evolução' : potentialPct < 95 ? 'Nível avançado atingido' : 'Próximo ao limite genético'}
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Ruler className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Registre <strong>altura</strong>, <strong>pulso</strong> e <strong>tornozelo</strong> para calcular o LBM máximo natural.</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 justify-center">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fórmula</p>
                  <code className="text-xs text-emerald-400 leading-relaxed block">
                    LBM = H^1.5 × (√W/22.667 + √A/17.010) × 1.022<br />
                    <span className="text-muted-foreground">H, W, A em polegadas → resultado em kg</span>
                  </code>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Interpretação</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Métricas derivadas de atletas naturais de elite pré-esteroides. Representam o que é fisiologicamente alcançável para a sua estrutura óssea mantendo simetria estética.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* ── REGISTRY DIALOG ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {isEditing ? 'Editar Medidas' : 'Novo Registro de Medidas'}
              </DialogTitle>
              <MeasurementGuideSheet>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                  <Info className="w-3.5 h-3.5" />
                  Como medir?
                </Button>
              </MeasurementGuideSheet>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-2">

            {/* Row 1: Fundamentals + Circumferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fundamentals */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Fundamentais</h3>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input id="weight" type="number" step="0.01" value={formData.weight_kg ?? ''} onChange={e => set('weight_kg', e.target.value)} placeholder="80.5" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input id="height" type="number" step="0.1" value={formData.height_cm ?? ''} onChange={e => set('height_cm', e.target.value)} placeholder="180" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bf">Gordura (%)</Label>
                    <Input id="bf" type="number" step="0.1" value={formData.bf_pct ?? ''} onChange={e => set('bf_pct', e.target.value)} placeholder="12.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sleep">Sono (h)</Label>
                    <Input id="sleep" type="number" step="0.5" value={formData.sleep_hours ?? ''} onChange={e => set('sleep_hours', e.target.value)} placeholder="8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Energia (1–10)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, energy_level: val })}
                        className={`flex-1 h-8 rounded-md text-xs transition-colors cursor-pointer ${formData.energy_level === val ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Circumferences */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Circunferências (cm)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: 'Peito', field: 'chest_cm' as keyof BodyMetric, ph: '105' },
                    { label: 'Cintura', field: 'waist_cm' as keyof BodyMetric, ph: '80' },
                    { label: 'Ombros', field: 'shoulders_cm' as keyof BodyMetric, ph: '120' },
                    { label: 'Quadril', field: 'hips_cm' as keyof BodyMetric, ph: '100' },
                    { label: 'Neck / Pescoço', field: 'neck_cm' as keyof BodyMetric, ph: '40' },
                    { label: 'Braços (média)', field: 'arms_cm' as keyof BodyMetric, ph: '40' },
                    { label: 'Antebraços (média)', field: 'forearms_cm' as keyof BodyMetric, ph: '32' },
                    { label: 'Coxas (média)', field: 'thighs_cm' as keyof BodyMetric, ph: '60' },
                    { label: 'Panturrilhas (média)', field: 'calves_cm' as keyof BodyMetric, ph: '38' },
                    { label: 'Pulso ⚓', field: 'wrist_cm' as keyof BodyMetric, ph: '17.5' },
                    { label: 'Tornozelo ⚓', field: 'ankle_cm' as keyof BodyMetric, ph: '22.5' },
                  ].map(({ label, field, ph }) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input type="number" step="0.1" value={formData[field] as number ?? ''} onChange={e => set(field, e.target.value)} placeholder={ph} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Bilateral measurements */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Medidas Bilaterais (assimetrias)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Braço Esq.', field: 'arm_left_cm' as keyof BodyMetric },
                  { label: 'Braço Dir.', field: 'arm_right_cm' as keyof BodyMetric },
                  { label: 'Antebraço Esq.', field: 'forearm_left_cm' as keyof BodyMetric },
                  { label: 'Antebraço Dir.', field: 'forearm_right_cm' as keyof BodyMetric },
                  { label: 'Coxa Esq.', field: 'thigh_left_cm' as keyof BodyMetric },
                  { label: 'Coxa Dir.', field: 'thigh_right_cm' as keyof BodyMetric },
                  { label: 'Panturrilha Esq.', field: 'calf_left_cm' as keyof BodyMetric },
                  { label: 'Panturrilha Dir.', field: 'calf_right_cm' as keyof BodyMetric },
                ].map(({ label, field }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.1" value={formData[field] as number ?? ''} onChange={e => set(field, e.target.value)} placeholder="—" />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas de Recuperação / Dor</Label>
              <Textarea
                id="notes"
                value={formData.pain_notes || ''}
                onChange={e => setFormData({ ...formData, pain_notes: e.target.value })}
                placeholder="Ex: Leve desconforto no ombro direito..."
                className="h-20 resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="min-w-[140px]" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Confirmar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
