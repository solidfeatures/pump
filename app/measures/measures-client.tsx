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
  Legend
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
  Activity
} from 'lucide-react'
import { calcIdealProportions, calcNaturalLBMLimit } from '@/lib/body-proportions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"

interface MeasuresClientProps {
  initialHistory: BodyMetric[]
  latestMetrics: BodyMetric | null
}

export function MeasuresClient({ initialHistory, latestMetrics: initialLatest }: MeasuresClientProps) {
  const [history, setHistory] = useState<BodyMetric[]>(initialHistory)
  const [latestMetrics, setLatestMetrics] = useState<BodyMetric | null>(initialLatest)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<keyof BodyMetric>('weight_kg')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Helper to get initial form state based on latest metrics
  const getInitialFormData = (metrics: BodyMetric | null): Partial<BodyMetric> => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    if (!metrics) {
      return {
        date: today,
        sleep_hours: 8,
        energy_level: 7,
        pain_notes: ''
      }
    }

    // Clone all values from the latest record, but set today's date and remove ID
    // We specifically want to carry over ALL measurements to facilitate updates
    const { id, created_at, date, ...rest } = metrics
    return {
      ...rest,
      date: today,
      // We keep the pain notes as well because the user might be monitoring a persistent issue
      pain_notes: rest.pain_notes || '',
      // Ensure we have defaults for these if they weren't in the last record
      sleep_hours: rest.sleep_hours ?? 8,
      energy_level: rest.energy_level ?? 7,
    }
  }

  const [formData, setFormData] = useState<Partial<BodyMetric>>(() => getInitialFormData(initialLatest))

  // Proporções
  const idealProportions = useMemo(() => {
    if (!latestMetrics?.wrist_cm) return null
    return calcIdealProportions(Number(latestMetrics.wrist_cm))
  }, [latestMetrics])

  const naturalLimit = useMemo(() => {
    if (!latestMetrics?.wrist_cm || !latestMetrics?.ankle_cm || !latestMetrics?.height_cm) return null
    return calcNaturalLBMLimit(
      Number(latestMetrics.wrist_cm), 
      Number(latestMetrics.ankle_cm), 
      Number(latestMetrics.height_cm)
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
      
      if (index >= 0) {
        updatedHistory[index] = result.data
      } else {
        updatedHistory.unshift(result.data)
      }
      
      const sortedHistory = updatedHistory.sort((a, b) => b.date.localeCompare(a.date))
      setHistory(sortedHistory)
      setLatestMetrics(sortedHistory[0])
      setIsDialogOpen(false)
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Erro ao salvar')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    const result = await deleteMeasureAction(id)
    if (result.success) {
      toast.success('Medida excluída')
      const newHistory = history.filter(m => m.id !== id)
      setHistory(newHistory)
      if (latestMetrics?.id === id) {
        setLatestMetrics(newHistory[0] || null)
      }
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

  const chartData = useMemo(() => {
    return [...history].reverse().map(m => ({
      date: format(new Date(m.date), 'dd/MM', { locale: ptBR }),
      value: Number(m[selectedMetric]) || 0,
      originalDate: m.date
    }))
  }, [history, selectedMetric])

  const metricsOptions = [
    { label: 'Peso', value: 'weight_kg', unit: 'kg' },
    { label: 'BF%', value: 'bf_pct', unit: '%' },
    { label: 'Cintura', value: 'waist_cm', unit: 'cm' },
    { label: 'Peito', value: 'chest_cm', unit: 'cm' },
    { label: 'Ombros', value: 'shoulders_cm', unit: 'cm' },
    { label: 'Quadril', value: 'hips_cm', unit: 'cm' },
    { label: 'Braços', value: 'arms_cm', unit: 'cm' },
    { label: 'Coxas', value: 'thighs_cm', unit: 'cm' },
    { label: 'Sono', value: 'sleep_hours', unit: 'h' },
    { label: 'Energia', value: 'energy_level', unit: '/10' },
  ]

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
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="proportions">Proporções</TabsTrigger>
        </TabsList>

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
                      ? (latestMetrics.weight_kg / Math.pow(latestMetrics.height_cm / 100, 2)).toFixed(1) 
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
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    "{latestMetrics.pain_notes}"
                  </p>
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
                    <XAxis 
                      dataKey="date" 
                      stroke="#888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

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
                  {history.length > 0 ? history.map((m) => (
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
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados desta data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => m.id && handleDelete(m.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="proportions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <GlassCardTitle className="mb-2">Análise de Proporções Naturais</GlassCardTitle>
              <GlassCardDescription className="mb-6">
                Referência: Steve Reeves. Calculado com base no seu pulso ({latestMetrics?.wrist_cm || '?'} cm).
              </GlassCardDescription>
              
              {idealProportions ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(idealProportions).map(([key, ideal]) => {
                      const currentKey = `${key}_cm` as keyof BodyMetric
                      const current = Number(latestMetrics?.[currentKey]) || 0
                      const diff = current - ideal
                      const pct = ideal > 0 ? (current / ideal) * 100 : 0

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{
                              key === 'arms' ? 'Braços' : 
                              key === 'calves' ? 'Panturrilhas' : 
                              key === 'thighs' ? 'Coxas' :
                              key === 'chest' ? 'Peito' :
                              key === 'waist' ? 'Cintura' :
                              key === 'forearms' ? 'Antebraços' :
                              key === 'hips' ? 'Quadril' :
                              key === 'neck' ? 'Pescoço' : key
                            }</span>
                            <span className="font-mono text-xs">
                              {current > 0 ? `${current.toFixed(1)} cm` : '--'} 
                              <span className="text-muted-foreground mx-1">/</span> 
                              <span className="text-emerald-500">{ideal.toFixed(1)} cm</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-emerald-500/40'}`} 
                              style={{ width: `${Math.min(pct, 100)}%` }} 
                            />
                            {pct > 100 && (
                              <div 
                                className="h-full bg-emerald-300" 
                                style={{ width: `${Math.min(pct - 100, 20)}%` }} 
                              />
                            )}
                          </div>
                          {current > 0 && (
                            <div className={`text-[10px] text-right uppercase ${Math.abs(diff) > ideal * 0.1 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {diff > 0 ? `+${diff.toFixed(1)} cm acima da meta` : `${Math.abs(diff).toFixed(1)} cm para a meta`}
                              {Math.abs(diff) > ideal * 0.1 && diff < 0 && ' ⚠️'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Alertas de Simetria */}
                  {(Number(latestMetrics?.waist_cm) > (Number(latestMetrics?.chest_cm) * 0.8)) && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <div>
                        <strong>Alerta Metabólico:</strong> Sua cintura está acima de 80% da medida do peito. 
                        Indica possível excesso de gordura visceral.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Ruler className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Registre a medida do seu pulso para ver sua análise de proporções.</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="flex flex-col justify-between">
              <div>
                <GlassCardTitle className="mb-4">Potencial de Massa Magra</GlassCardTitle>
                <div className="space-y-6">
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Activity className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-1">LBM Máximo Estimado (Natural)</div>
                    <div className="text-4xl font-black text-emerald-400">
                      {naturalLimit ? `${naturalLimit.toFixed(1)}` : '--'} <small className="text-lg font-normal">kg</small>
                    </div>
                    
                    {naturalLimit && latestMetrics?.weight_kg && latestMetrics?.bf_pct && (
                      <div className="mt-6 pt-6 border-t border-emerald-500/20">
                        {(() => {
                          const currentLBM = latestMetrics.weight_kg * (1 - (latestMetrics.bf_pct / 100))
                          const potentialPct = (currentLBM / naturalLimit) * 100
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">LBM Atual: <span className="text-white font-medium">{currentLBM.toFixed(1)}kg</span></span>
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
                    )}
                  </div>
                    <p className="text-xs text-muted-foreground italic">
                      Fórmula de Casey Butt baseada em altura, pulso e tornozelo.
                    </p>

                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-500" />
                      Interpretação
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Estas métricas foram derivadas de atletas naturais de elite da era pré-esteroides. 
                      Elas representam o que é fisiologicamente possível para a sua estrutura óssea mantendo simetria estética.
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Simetria Ideal: Braço ≈ Panturrilha ≈ Pescoço</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* REGISTRY DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Editar Medidas' : 'Novo Registro de Medidas'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Fundamentais</h3>
                <div className="space-y-2">
                  <Label htmlFor="date">Data do Registro</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      step="0.01" 
                      value={formData.weight_kg || ''} 
                      onChange={e => setFormData({...formData, weight_kg: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="80.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      step="0.1" 
                      value={formData.height_cm || ''} 
                      onChange={e => setFormData({...formData, height_cm: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="180"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bf">Gordura Corporal (%)</Label>
                    <Input 
                      id="bf" 
                      type="number" 
                      step="0.1" 
                      value={formData.bf_pct || ''} 
                      onChange={e => setFormData({...formData, bf_pct: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="12.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sleep">Horas de Sono</Label>
                    <Input 
                      id="sleep" 
                      type="number" 
                      step="0.5" 
                      value={formData.sleep_hours || ''} 
                      onChange={e => setFormData({...formData, sleep_hours: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energy">Nível de Energia (1-10)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({...formData, energy_level: val})}
                        className={`flex-1 h-8 rounded-md text-xs transition-colors ${formData.energy_level === val ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body Measurements Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Circunferências (cm)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cintura</Label>
                    <Input type="number" step="0.1" value={formData.waist_cm || ''} onChange={e => setFormData({...formData, waist_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="80" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Peito</Label>
                    <Input type="number" step="0.1" value={formData.chest_cm || ''} onChange={e => setFormData({...formData, chest_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="105" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ombros</Label>
                    <Input type="number" step="0.1" value={formData.shoulders_cm || ''} onChange={e => setFormData({...formData, shoulders_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="120" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quadril</Label>
                    <Input type="number" step="0.1" value={formData.hips_cm || ''} onChange={e => setFormData({...formData, hips_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="100" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Braços (Média)</Label>
                    <Input type="number" step="0.1" value={formData.arms_cm || ''} onChange={e => setFormData({...formData, arms_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Antebraços</Label>
                    <Input type="number" step="0.1" value={formData.forearms_cm || ''} onChange={e => setFormData({...formData, forearms_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="32" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Coxas (Média)</Label>
                    <Input type="number" step="0.1" value={formData.thighs_cm || ''} onChange={e => setFormData({...formData, thighs_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Panturrilhas</Label>
                    <Input type="number" step="0.1" value={formData.calves_cm || ''} onChange={e => setFormData({...formData, calves_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="38" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pescoço</Label>
                    <Input type="number" step="0.1" value={formData.neck_cm || ''} onChange={e => setFormData({...formData, neck_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="40" />
                  </div>
                  <div className="space-y-1.5 opacity-60">
                    <Label className="text-xs">Pulso (Ref)</Label>
                    <Input type="number" step="0.1" value={formData.wrist_cm || ''} onChange={e => setFormData({...formData, wrist_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="17.5" />
                  </div>
                  <div className="space-y-1.5 opacity-60">
                    <Label className="text-xs">Tornozelo (Ref)</Label>
                    <Input type="number" step="0.1" value={formData.ankle_cm || ''} onChange={e => setFormData({...formData, ankle_cm: e.target.value ? Number(e.target.value) : undefined})} placeholder="22.5" />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="notes">Notas de Recuperação / Dor</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.pain_notes || ''} 
                    onChange={e => setFormData({...formData, pain_notes: e.target.value})}
                    placeholder="Ex: Leve desconforto no ombro direito..."
                    className="h-24 resize-none"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Confirmar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
