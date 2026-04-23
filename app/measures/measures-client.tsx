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
import { saveMeasuresAction } from './actions'
import { toast } from 'sonner'
import { Ruler, History, BarChart3, Plus, Scale, Calculator } from 'lucide-react'
import { calcIdealProportions, calcNaturalLBMLimit } from '@/lib/body-proportions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MeasuresClientProps {
  initialHistory: BodyMetric[]
  latestMetrics: BodyMetric | null
}

export function MeasuresClient({ initialHistory, latestMetrics }: MeasuresClientProps) {
  const [history, setHistory] = useState<BodyMetric[]>(initialHistory)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<keyof BodyMetric>('weight_kg')

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

  // Form State
  const [formData, setFormData] = useState<Partial<BodyMetric>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight_kg: latestMetrics?.weight_kg || 0,
    height_cm: latestMetrics?.height_cm || 0,
    bf_pct: latestMetrics?.bf_pct || 0,
    sleep_hours: latestMetrics?.sleep_hours || 8,
    waist_cm: latestMetrics?.waist_cm || 0,
    chest_cm: latestMetrics?.chest_cm || 0,
    arms_cm: latestMetrics?.arms_cm || 0,
    forearms_cm: latestMetrics?.forearms_cm || 0,
    thighs_cm: latestMetrics?.thighs_cm || 0,
    calves_cm: latestMetrics?.calves_cm || 0,
    wrist_cm: latestMetrics?.wrist_cm || 0,
    ankle_cm: latestMetrics?.ankle_cm || 0,
    energy_level: latestMetrics?.energy_level || 7,
    pain_notes: latestMetrics?.pain_notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const result = await saveMeasuresAction(formData)
    
    if (result.success) {
      toast.success('Medidas salvas com sucesso!')
      // Atualizar histórico local (simplificado, ideal seria re-fetch ou o action retornar a lista)
      setHistory(prev => {
        const index = prev.findIndex(m => m.date === result.data.date)
        if (index >= 0) {
          const newHistory = [...prev]
          newHistory[index] = result.data
          return newHistory.sort((a, b) => b.date.localeCompare(a.date))
        }
        return [result.data, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      })
    } else {
      toast.error(result.error || 'Erro ao salvar')
    }
    setIsSubmitting(false)
  }

  const chartData = useMemo(() => {
    return [...history].reverse().map(m => ({
      date: format(new Date(m.date), 'dd/MM', { locale: ptBR }),
      value: Number(m[selectedMetric]) || 0,
      originalDate: m.date
    }))
  }, [history, selectedMetric])

  const metricsOptions = [
    { label: 'Peso (kg)', value: 'weight_kg' },
    { label: 'BF (%)', value: 'bf_pct' },
    { label: 'Cintura (cm)', value: 'waist_cm' },
    { label: 'Braços (cm)', value: 'arms_cm' },
    { label: 'Coxas (cm)', value: 'thighs_cm' },
  ]

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
        <TabsTrigger value="overview">Resumo</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
        <TabsTrigger value="proportions">Proporções</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="md:col-span-1">
            <GlassCardTitle className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-500" />
              Novo Registro
            </GlassCardTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
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
                    step="0.1" 
                    value={formData.weight_kg} 
                    onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    step="0.1" 
                    value={formData.height_cm} 
                    onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bf">BF (%)</Label>
                  <Input 
                    id="bf" 
                    type="number" 
                    step="0.1" 
                    value={formData.bf_pct} 
                    onChange={e => setFormData({...formData, bf_pct: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Cintura (cm)</Label>
                  <Input 
                    id="waist" 
                    type="number" 
                    step="0.1" 
                    value={formData.waist_cm} 
                    onChange={e => setFormData({...formData, waist_cm: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer hover:text-emerald-500 transition-colors py-2">
                  Ver mais medidas...
                </summary>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Braços</Label>
                    <Input type="number" step="0.1" value={formData.arms_cm} onChange={e => setFormData({...formData, arms_cm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Coxas</Label>
                    <Input type="number" step="0.1" value={formData.thighs_cm} onChange={e => setFormData({...formData, thighs_cm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Panturrilhas</Label>
                    <Input type="number" step="0.1" value={formData.calves_cm} onChange={e => setFormData({...formData, calves_cm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pulso</Label>
                    <Input type="number" step="0.1" value={formData.wrist_cm} onChange={e => setFormData({...formData, wrist_cm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tornozelo</Label>
                    <Input type="number" step="0.1" value={formData.ankle_cm} onChange={e => setFormData({...formData, ankle_cm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Peito</Label>
                    <Input type="number" step="0.1" value={formData.chest_cm} onChange={e => setFormData({...formData, chest_cm: Number(e.target.value)})} />
                  </div>
                </div>
              </details>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Medidas'}
              </Button>
            </form>
          </GlassCard>

          <div className="md:col-span-2 space-y-6">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <GlassCardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Evolução
                </GlassCardTitle>
                <div className="flex gap-2">
                  {metricsOptions.map(opt => (
                    <Button 
                      key={opt.value}
                      variant={selectedMetric === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(opt.value as keyof BodyMetric)}
                      className="h-8 text-xs"
                    >
                      {opt.label.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
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
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <GlassCard>
          <GlassCardTitle className="mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Histórico Completo
          </GlassCardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 px-4 font-medium">Data</th>
                  <th className="py-3 px-4 font-medium">Peso</th>
                  <th className="py-3 px-4 font-medium">BF%</th>
                  <th className="py-3 px-4 font-medium">Cintura</th>
                  <th className="py-3 px-4 font-medium">Braço</th>
                  <th className="py-3 px-4 font-medium">Coxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((m) => (
                  <tr key={m.id || m.date} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">{format(new Date(m.date), 'dd MMM yyyy', { locale: ptBR })}</td>
                    <td className="py-3 px-4">{m.weight_kg}kg</td>
                    <td className="py-3 px-4">{m.bf_pct}%</td>
                    <td className="py-3 px-4">{m.waist_cm}cm</td>
                    <td className="py-3 px-4">{m.arms_cm}cm</td>
                    <td className="py-3 px-4">{m.thighs_cm}cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </TabsContent>

      <TabsContent value="proportions" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <GlassCardTitle className="mb-2">Análise de Steve Reeves</GlassCardTitle>
            <GlassCardDescription className="mb-6">
              Baseado na estrutura óssea do seu pulso ({latestMetrics?.wrist_cm || '?'} cm).
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
                          <span className="capitalize">{
                            key === 'arms' ? 'Braços' : 
                            key === 'calves' ? 'Panturrilhas' : 
                            key === 'thighs' ? 'Coxas' :
                            key === 'chest' ? 'Peito' :
                            key === 'waist' ? 'Cintura' :
                            key === 'forearms' ? 'Antebraços' :
                            key === 'hips' ? 'Quadril' :
                            key === 'neck' ? 'Pescoço' : key
                          }</span>
                          <span className="font-mono">{current > 0 ? `${current} / ${ideal.toFixed(1)} cm` : `Meta: ${ideal.toFixed(1)} cm`}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
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
                          <div className={`text-[10px] text-right uppercase ${pct < 90 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {diff > 0 ? `+${diff.toFixed(1)} cm acima da meta` : `${Math.abs(diff).toFixed(1)} cm para a meta`}
                            {pct < 90 && ' ⚠️'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Alertas de Simetria */}
                {(Number(latestMetrics?.waist_cm) > (Number(latestMetrics?.chest_cm) * 0.8)) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
                    ⚠️ <strong>Alerta Metabólico:</strong> Sua cintura está acima de 80% da medida do peito. 
                    Isso pode indicar excesso de gordura visceral.
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
              <GlassCardTitle className="mb-4">Potencial Genético</GlassCardTitle>
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-1">Massa Magra Máxima (Natural)</div>
                  <div className="text-4xl font-black text-emerald-400">
                    {naturalLimit ? `${naturalLimit.toFixed(1)}` : '--'} <small className="text-lg font-normal">kg</small>
                  </div>
                  
                  {naturalLimit && latestMetrics?.weight_kg && latestMetrics?.bf_pct && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      {(() => {
                        const currentLBM = latestMetrics.weight_kg * (1 - (latestMetrics.bf_pct / 100))
                        const potentialPct = (currentLBM / naturalLimit) * 100
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>LBM Atual: {currentLBM.toFixed(1)}kg</span>
                              <span>{potentialPct.toFixed(1)}% do potencial</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(potentialPct, 100)}%` }} />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Limite teórico de massa livre de gordura para sua estrutura (Casey Butt).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">O que isso significa?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Estas métricas são baseadas em estudos de atletas da "Era de Ouro" que atingiram o auge físico de forma natural. 
                    O objetivo não é ser uma regra absoluta, mas um guia para identificar pontos fracos e manter simetria.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Simetria: Braço = Panturrilha = Pescoço</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </TabsContent>
    </Tabs>
  )
}
