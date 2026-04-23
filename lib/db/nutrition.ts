import { supabase } from '../supabase'

export interface NutritionPlan {
  id?: string
  athlete_id?: string
  date: string
  goal: string
  calories_target: number
  protein_g: number
  carbs_g: number
  fats_g: number
  meals: any
  ai_logic?: string
  created_at?: string
}

export async function getLatestNutritionPlan(): Promise<NutritionPlan | null> {
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

export async function saveNutritionPlan(plan: Partial<NutritionPlan>) {
  const { data, error } = await supabase
    .from('nutrition_plans')
    .upsert(plan, { onConflict: 'date' })
    .select()
    .single()

  if (error) throw error
  return data
}
