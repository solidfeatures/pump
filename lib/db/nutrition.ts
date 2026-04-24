import { prisma } from '@/lib/prisma'

// ─── Legacy NutritionPlan (kept for backwards-compat with existing AI route) ─

export interface NutritionPlan {
  id?: string
  date: string
  goal: string
  calories_target?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  meals?: any
  ai_logic?: string
  observations?: string
  recommendations?: string[]
  meal_plan?: any
  weight_at_generation?: number
  phase_id?: string
  model_used?: string
  created_at?: string
}

function mapPlan(raw: any): NutritionPlan {
  return {
    id: raw.id,
    date: raw.date instanceof Date ? raw.date.toISOString().split('T')[0] : String(raw.date),
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
    created_at: raw.created_at?.toISOString?.() ?? undefined,
  }
}

export async function getLatestNutritionPlan(): Promise<NutritionPlan | null> {
  const row = await prisma.nutritionPlan.findFirst({ orderBy: { date: 'desc' } })
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
  const rows = await prisma.nutritionPlan.findMany({ orderBy: { date: 'desc' }, take: limit })
  return rows.map(mapPlan)
}

// ─── NutritionProtocol ──────────────────────────────────────────────────────

export interface NutritionProtocol {
  id?: string
  goal: string
  start_date: string
  end_date?: string | null
  is_active: boolean
  calories_training?: number
  calories_rest?: number
  protein_g?: number
  carbs_g?: number
  carbs_rest_g?: number
  fat_g?: number
  meals?: any[]
  ai_logic?: string
  recommendations?: string[]
  weight_at_start?: number
  phase_id?: string
  model_used?: string
  created_at?: string
}

function mapProtocol(raw: any): NutritionProtocol {
  const toDateStr = (v: any) =>
    v instanceof Date ? v.toISOString().split('T')[0] : v ? String(v).split('T')[0] : null

  return {
    id: raw.id,
    goal: raw.goal,
    start_date: toDateStr(raw.start_date)!,
    end_date: toDateStr(raw.end_date),
    is_active: raw.is_active,
    calories_training: raw.calories_training ?? undefined,
    calories_rest: raw.calories_rest ?? undefined,
    protein_g: raw.protein_g ?? undefined,
    carbs_g: raw.carbs_g ?? undefined,
    carbs_rest_g: raw.carbs_rest_g ?? undefined,
    fat_g: raw.fat_g ?? undefined,
    meals: Array.isArray(raw.meals) ? raw.meals : [],
    ai_logic: raw.ai_logic ?? '',
    recommendations: raw.recommendations ?? [],
    weight_at_start: raw.weight_at_start != null ? Number(raw.weight_at_start) : undefined,
    phase_id: raw.phase_id ?? undefined,
    model_used: raw.model_used ?? undefined,
    created_at: raw.created_at?.toISOString?.() ?? undefined,
  }
}

export async function getActiveProtocol(): Promise<NutritionProtocol | null> {
  const row = await (prisma as any).nutritionProtocol.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  })
  return row ? mapProtocol(row) : null
}

export async function getAllProtocols(limit = 20): Promise<NutritionProtocol[]> {
  const rows = await (prisma as any).nutritionProtocol.findMany({
    orderBy: { start_date: 'desc' },
    take: limit,
  })
  return rows.map(mapProtocol)
}

export async function createProtocol(data: Omit<NutritionProtocol, 'id' | 'created_at'>): Promise<NutritionProtocol> {
  const row = await (prisma as any).nutritionProtocol.create({
    data: {
      goal: data.goal,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      is_active: data.is_active,
      calories_training: data.calories_training,
      calories_rest: data.calories_rest ?? null,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      carbs_rest_g: data.carbs_rest_g ?? null,
      fat_g: data.fat_g,
      meals: data.meals ?? [],
      ai_logic: data.ai_logic ?? '',
      recommendations: data.recommendations ?? [],
      weight_at_start: data.weight_at_start,
      phase_id: data.phase_id,
      model_used: data.model_used ?? 'Pump Adaptive Engine v2',
    },
  })
  return mapProtocol(row)
}

export async function updateProtocol(id: string, data: Partial<NutritionProtocol>): Promise<NutritionProtocol> {
  const row = await (prisma as any).nutritionProtocol.update({
    where: { id },
    data: {
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.end_date !== undefined && { end_date: data.end_date ? new Date(data.end_date) : null }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.calories_training !== undefined && { calories_training: data.calories_training }),
      ...(data.calories_rest !== undefined && { calories_rest: data.calories_rest }),
      ...(data.protein_g !== undefined && { protein_g: data.protein_g }),
      ...(data.carbs_g !== undefined && { carbs_g: data.carbs_g }),
      ...(data.carbs_rest_g !== undefined && { carbs_rest_g: data.carbs_rest_g }),
      ...(data.fat_g !== undefined && { fat_g: data.fat_g }),
      ...(data.meals !== undefined && { meals: data.meals }),
      ...(data.ai_logic !== undefined && { ai_logic: data.ai_logic }),
      ...(data.recommendations !== undefined && { recommendations: data.recommendations }),
      ...(data.phase_id !== undefined && { phase_id: data.phase_id }),
      ...(data.model_used !== undefined && { model_used: data.model_used }),
    },
  })
  return mapProtocol(row)
}

export async function closeProtocol(id: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await (prisma as any).nutritionProtocol.update({
    where: { id },
    data: { is_active: false, end_date: today },
  })
}

export async function switchProtocol(
  previousId: string | undefined,
  newData: Omit<NutritionProtocol, 'id' | 'created_at'>,
): Promise<NutritionProtocol> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (previousId) {
    await (prisma as any).nutritionProtocol.update({
      where: { id: previousId },
      data: { is_active: false, end_date: today },
    })
  }

  return createProtocol({ ...newData, is_active: true, start_date: today.toISOString().split('T')[0] })
}
