'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { 
  Utensils, 
  Zap, 
  Brain, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
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
  fats_g: number
  meals: Meal[]
  ai_logic?: string
  recommendations?: string[]
}

export default function NutritionClient({ initialPlan }: { initialPlan: NutritionPlan | null }) {
  const [plan, setPlan] = useState<NutritionPlan | null>(initialPlan)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const generateAIPlan = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/nutrition', { method: 'POST' })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      const newPlan: NutritionPlan = {
        date: format(new Date(), 'yyyy-MM-dd'),
        goal: data.observations,
        calories_target: data.target_calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fats_g: data.fats_g,
        meals: data.meal_plan,
        ai_logic: data.observations,
        recommendations: data.recommendations
      }
      
      setPlan(newPlan)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao gerar plano' })
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
        fats_g: plan.fats_g,
        meals: plan.meals,
        ai_logic: plan.ai_logic
      })
      
      if (res.success) {
        setMessage({ type: 'success', text: 'Plano salvo com sucesso!' })
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  const macroData = plan ? [
    { name: 'Proteínas', value: plan.protein_g * 4, color: '#E9FF60' },
    { name: 'Carbos', value: plan.carbs_g * 4, color: '#00F0FF' },
    { name: 'Gorduras', value: plan.fats_g * 9, color: '#FF00E5' },
  ] : []

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
            {plan ? `Plano atualizado em ${format(new Date(plan.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}` : 'Nenhum plano ativo para hoje'}
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
          
          {plan && (
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

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
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
                  { label: 'Gord', val: plan.fats_g, color: 'text-[#FF00E5]' },
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
                <p className="text-zinc-300 italic text-sm leading-relaxed">
                  "{plan.ai_logic}"
                </p>
                {plan.recommendations && (
                   <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E9FF60] mt-0.5" />
                          {rec}
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
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
            <Brain className="w-10 h-10 text-[#00F0FF]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sem Plano de Dieta</h2>
          <p className="text-zinc-500 max-w-md mb-8">
            Você ainda não gerou um plano nutricional. Use o Strategist IA para criar um plano personalizado baseado no seu peso, BF e volume de treino atual.
          </p>
          <button
            onClick={generateAIPlan}
            disabled={loading}
            className="flex items-center gap-2 bg-[#00F0FF] hover:bg-[#00d8e6] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all disabled:opacity-50"
          >
            {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
            {loading ? 'Gerando seu Plano...' : 'Gerar Plano agora'}
          </button>
        </div>
      )}
    </div>
  )
}
