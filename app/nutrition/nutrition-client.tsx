'use client'

import { useState, useMemo } from 'react'
import { GlassCard, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Utensils, 
  Zap, 
  Brain, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Ruler,
  History as HistoryIcon,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts'
import { saveNutritionAction } from './actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Meal {
  name: string
  time: string
  items: string[]
}

interface NutritionPlan {
  id?: string
  date: string
  goal: string
  calories_target: number
  protein_g: number
  carbs_g: number
  fat_g: number
  meals: Meal[]
  ai_logic?: string
  recommendations?: string[]
}

export default function NutritionClient({ 
  initialPlan,
  initialHistory 
}: { 
  initialPlan: NutritionPlan | null,
  initialHistory: NutritionPlan[]
}) {
  const [plan, setPlan] = useState<NutritionPlan | null>(initialPlan)
  const [history, setHistory] = useState<NutritionPlan[]>(initialHistory)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('today')

  const generateAIPlan = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/nutrition', { method: 'POST' })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      const newPlan: NutritionPlan = {
        date: data.date,
        goal: data.goal,
        calories_target: data.calories_target,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        meals: data.meals,
        ai_logic: data.ai_logic,
        recommendations: data.recommendations
      }
      
      setPlan(newPlan)
      setActiveTab('plan')
      setMessage({ type: 'success', text: 'Novo plano gerado pela IA!' })
    } catch (err: any) {
      console.error('Error generating plan:', err)
      const errorText = err.message || 'Erro ao gerar plano'
      setMessage({ 
        type: 'error', 
        text: errorText
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    try {
      const res = await saveNutritionAction({
        date: plan.date,
        goal: plan.goal,
        calories_target: plan.calories_target,
        protein_g: plan.protein_g,
        carbs_g: plan.carbs_g,
        fat_g: plan.fat_g,
        meals: plan.meals,
        ai_logic: plan.ai_logic,
        recommendations: plan.recommendations
      })
      
      if (res.success) {
        setMessage({ type: 'success', text: 'Plano salvo com sucesso!' })
        // Update history if it's a new or updated plan for that date
        setHistory(prev => {
          const index = prev.findIndex(p => p.date === plan.date)
          if (index >= 0) {
            const newHistory = [...prev]
            newHistory[index] = plan
            return newHistory
          }
          return [plan, ...prev].sort((a, b) => b.date.localeCompare(a.date))
        })
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  const viewHistoricalPlan = (historicalPlan: NutritionPlan) => {
    setPlan(historicalPlan)
    setActiveTab('plan')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const macroData = useMemo(() => {
    if (!plan) return []
    return [
      { name: 'Proteínas', value: (plan.protein_g || 0) * 4, color: '#E9FF60' },
      { name: 'Carbos', value: (plan.carbs_g || 0) * 4, color: '#00F0FF' },
      { name: 'Gorduras', value: (plan.fat_g || 0) * 9, color: '#FF00E5' },
    ]
  }, [plan])

  const isHistorical = useMemo(() => {
    if (!plan) return false
    const today = format(new Date(), 'yyyy-MM-dd')
    return plan.date !== today
  }, [plan])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-white tracking-tighter flex items-center gap-3 uppercase">
            <Utensils className="w-10 h-10 text-[#E9FF60]" />
            Nutrição <span className="text-[#00F0FF]">Inteligente</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            {plan ? (
              <span className="flex items-center gap-2">
                {isHistorical && <Clock className="w-4 h-4 text-amber-500" />}
                {isHistorical ? 'Visualizando histórico de' : 'Plano atualizado em'} {format(new Date(plan.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            ) : 'Nenhum plano ativo para hoje'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={generateAIPlan}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 border border-[#00F0FF]/30 hover:border-[#00F0FF] text-white px-6 py-3 rounded-xl transition-all font-bold group disabled:opacity-50"
          >
            <Brain className={`w-5 h-5 text-[#00F0FF] ${loading ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            {loading ? 'Gerando...' : 'IA Strategist'}
          </button>
          
          {plan && !isHistorical && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#E9FF60] hover:bg-[#d4e94d] text-black px-6 py-3 rounded-xl transition-all font-bold disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-xl w-full max-w-lg">
          <TabsTrigger value="today" className="flex-1 data-[state=active]:bg-[#E9FF60] data-[state=active]:text-black">Hoje</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">Plano</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">Histórico</TabsTrigger>
        </TabsList>

        {/* ────────── TAB 1: HOJE ────────── */}
        <TabsContent value="today" className="space-y-6">
          {plan ? (
            <>
              {/* Hero: kcal gigante */}
              <GlassCard className="p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E9FF60]/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E9FF60] mb-2">Meta de hoje</p>
                  <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-7xl md:text-8xl font-black text-[#E9FF60] tracking-tighter leading-none">
                      {plan.calories_target}
                    </span>
                    <span className="text-lg font-medium text-muted-foreground">kcal</span>
                  </div>

                  {/* Macros row */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Proteína</p>
                      <p className="text-3xl font-black text-[#E9FF60] tracking-tighter">{plan.protein_g}<span className="text-sm font-normal text-muted-foreground ml-0.5">g</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Carbos</p>
                      <p className="text-3xl font-black text-[#00F0FF] tracking-tighter">{plan.carbs_g}<span className="text-sm font-normal text-muted-foreground ml-0.5">g</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Gorduras</p>
                      <p className="text-3xl font-black text-[#FF00E5] tracking-tighter">{plan.fat_g}<span className="text-sm font-normal text-muted-foreground ml-0.5">g</span></p>
                    </div>
                  </div>

                  <button
                    onClick={generateAIPlan}
                    disabled={loading}
                    className="mt-6 inline-flex items-center gap-2 bg-zinc-900 border border-[#00F0FF]/30 hover:border-[#00F0FF] text-white px-5 py-2.5 rounded-xl transition-all font-semibold text-sm disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 text-[#00F0FF] ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Atualizando...' : 'Atualizar plano baseado no peso atual'}
                  </button>
                </div>
              </GlassCard>

              {/* Next meal */}
              {plan.meals && plan.meals.length > 0 && (
                <GlassCard className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Próxima refeição</p>
                    <p className="font-bold text-base">{plan.meals[0].name}</p>
                    <p className="text-xs text-muted-foreground">{plan.meals[0].time} · {plan.meals[0].items.length} itens</p>
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

              {/* AI rationale short */}
              {plan.recommendations && plan.recommendations[0] && (
                <GlassCard className="p-4 border-[#00F0FF]/20 flex items-start gap-3">
                  <Brain className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {plan.recommendations[0]}
                  </p>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard className="p-8 text-center">
              <Utensils className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold text-base mb-1">Nenhum plano ativo</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Gere seu primeiro plano nutricional com IA baseado no seu objetivo e medidas.
              </p>
              <button
                onClick={generateAIPlan}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#E9FF60] hover:bg-[#d4e94d] text-black px-5 py-2.5 rounded-xl transition-all font-bold text-sm disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                {loading ? 'Gerando...' : 'Gerar plano com IA'}
              </button>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-8">


      {message && (
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
            <span className="font-medium">{message.text}</span>
          </div>
          
          {message.type === 'error' && message.text.includes('Medidas') && (
            <a 
              href="/measures" 
              className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/30 font-bold text-sm"
            >
              <Ruler className="w-4 h-4" />
              Ir para Medidas
            </a>
          )}
        </div>
      )}

      {plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Macro Distribution */}
          <GlassCard className="lg:col-span-1 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E9FF60]/10 blur-3xl -mr-16 -mt-16 group-hover:bg-[#E9FF60]/20 transition-all" />
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#E9FF60]" />
              Metas Diárias
            </h2>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-zinc-400">Calorias</span>
                <span className="text-2xl font-black text-[#E9FF60]">{plan.calories_target} kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Prot', val: plan.protein_g, color: 'text-[#E9FF60]' },
                  { label: 'Carb', val: plan.carbs_g, color: 'text-[#00F0FF]' },
                  { label: 'Gord', val: plan.fat_g, color: 'text-[#FF00E5]' },
                ].map(macro => (
                  <div key={macro.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">{macro.label}</div>
                    <div className={`text-lg font-bold ${macro.color}`}>{macro.val}g</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Meal Plan */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00F0FF]" />
              Cronograma de Refeições
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.meals?.map((meal, idx) => (
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
                    {meal.items.map((item, i) => (
                      <li key={i} className="text-zinc-400 text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ))}
            </div>

            {plan.ai_logic && (
              <GlassCard className="p-6 border-[#FF00E5]/20">
                <h3 className="text-sm font-bold text-[#FF00E5] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Observações da IA
                </h3>
                <div className="space-y-4">
                  <p className="text-zinc-300 italic text-sm leading-relaxed">
                    "{plan.ai_logic}"
                  </p>
                  {plan.recommendations && plan.recommendations.length > 0 && (
                     <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plan.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#E9FF60] flex-shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                     </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
            <Brain className="w-10 h-10 text-[#00F0FF]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sem Plano de Dieta</h2>
          <p className="text-zinc-500 max-w-md mb-8">
            Você ainda não gerou um plano nutricional. Use o Strategist IA para criar um plano personalizado baseado no seu peso, altura e fase de treino atual.
          </p>
          <button
            onClick={generateAIPlan}
            disabled={loading}
            className="flex items-center gap-2 bg-[#00F0FF] hover:bg-[#00d8e6] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all disabled:opacity-50 shadow-lg shadow-[#00F0FF]/20"
          >
            {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
            {loading ? 'Gerando seu Plano...' : 'Gerar Plano agora'}
          </button>
        </div>
      )}
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <HistoryIcon className="w-6 h-6 text-[#00F0FF]" />
                Histórico Nutricional
              </h2>
              <p className="text-zinc-400 text-sm">Acompanhe a evolução das suas metas e macros.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {history.length > 0 ? history.map((hPlan, idx) => (
              <div 
                key={idx} 
                onClick={() => viewHistoricalPlan(hPlan)}
                className="group p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-[#00F0FF]/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-[#E9FF60] group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-[#00F0FF] transition-colors uppercase tracking-tight">
                      {format(new Date(hPlan.date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{hPlan.goal}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-[#E9FF60]/10 border border-[#E9FF60]/20 text-[#E9FF60] text-xs font-bold">
                    {hPlan.calories_target} kcal
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="text-zinc-400">P: {hPlan.protein_g}g</span>
                    <span className="text-zinc-400">C: {hPlan.carbs_g}g</span>
                    <span className="text-zinc-400">G: {hPlan.fat_g}g</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#00F0FF] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            )) : (
              <div className="text-center py-20 text-zinc-500 italic">
                Nenhum plano anterior encontrado.
              </div>
            )}
          </div>
        </GlassCard>
      </TabsContent>
    </Tabs>
  </div>
  )
}

