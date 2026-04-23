import { prisma } from '@/lib/prisma'

export interface NutritionPlan {
  id?: string
  date: string
  goal: string
  calories_target?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  meals?: any              // JSON (meals field in DB)
  ai_logic?: string
  observations?: string
  recommendations?: string[]
  meal_plan?: any          // JSON (meal_plan field in DB)
  weight_at_generation?: number
  phase_id?: string
  model_used?: string
  created_at?: string
}

function mapPlan(raw: {
  id: string
  date: Date
  goal: string
  calories_target: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  meals: any
  ai_logic: string
  observations: string | null
  recommendations: string[]
  meal_plan: any
  weight_at_generation: any
  phase_id: string | null
  model_used: string | null
  created_at: Date | null
}): NutritionPlan {
  return {
    id: raw.id,
    date: raw.date.toISOString().split('T')[0],
    goal: raw.goal,
    calories_target: raw.calories_target ?? undefined,
    protein_g: raw.protein_g ?? undefined,
    carbs_g: raw.carbs_g ?? undefined,
    fat_g: raw.fat_g ?? undefined,
    meals: raw.meals,
    ai_logic: raw.ai_logic,
    observations: raw.observations ?? undefined,
    recommendations: raw.recommendations,
    meal_plan: raw.meal_plan,
    weight_at_generation: raw.weight_at_generation != null ? Number(raw.weight_at_generation) : undefined,
    phase_id: raw.phase_id ?? undefined,
    model_used: raw.model_used ?? undefined,
    created_at: raw.created_at?.toISOString(),
  }
}

export async function getLatestNutritionPlan(): Promise<NutritionPlan | null> {
  const row = await prisma.nutritionPlan.findFirst({
    orderBy: { date: 'desc' },
  })
  return row ? mapPlan(row) : null
}

export async function saveNutritionPlan(plan: Partial<NutritionPlan>): Promise<NutritionPlan> {
  if (!plan.date) throw new Error('date is required')

  const dateObj = new Date(plan.date)

  const payload = {
    goal: plan.goal ?? '',
    calories_target: plan.calories_target,
    protein_g: plan.protein_g,
    carbs_g: plan.carbs_g,
    fat_g: plan.fat_g,
    meals: plan.meals ?? [],
    ai_logic: plan.ai_logic ?? '',
    observations: plan.observations,
    recommendations: plan.recommendations ?? [],
    meal_plan: plan.meal_plan,
    weight_at_generation: plan.weight_at_generation,
    phase_id: plan.phase_id,
    model_used: plan.model_used,
  }

  const row = await prisma.nutritionPlan.upsert({
    where: { date: dateObj },
    create: { date: dateObj, ...payload },
    update: payload,
  })

  return mapPlan(row)
}

export async function getNutritionHistory(limit = 10): Promise<NutritionPlan[]> {
  const rows = await prisma.nutritionPlan.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  })
  return rows.map(mapPlan)
}
