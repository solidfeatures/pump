'use server'

import { NutritionPlan, saveNutritionPlan, getLatestNutritionPlan } from '@/lib/db/nutrition'
import { revalidatePath } from 'next/cache'

export async function getNutritionAction() {
  try {
    const plan = await getLatestNutritionPlan()
    return { success: true, data: plan }
  } catch (error) {
    console.error('[getNutritionAction]', error)
    return { success: false, error: 'Falha ao buscar plano nutricional' }
  }
}

export async function saveNutritionAction(plan: Partial<NutritionPlan>) {
  try {
    const result = await saveNutritionPlan(plan)
    revalidatePath('/nutrition')
    return { success: true, data: result }
  } catch (error) {
    console.error('[saveNutritionAction]', error)
    return { success: false, error: 'Falha ao salvar plano nutricional' }
  }
}
