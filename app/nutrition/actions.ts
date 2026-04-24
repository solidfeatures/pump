'use server'

import {
  NutritionPlan, saveNutritionPlan, getLatestNutritionPlan,
  NutritionProtocol, getActiveProtocol, getAllProtocols,
  createProtocol, updateProtocol, closeProtocol, switchProtocol,
} from '@/lib/db/nutrition'
import { revalidatePath } from 'next/cache'

// ── Legacy plan actions (kept for backwards compat) ──────────────────────────

export async function getNutritionAction() {
  try {
    const plan = await getLatestNutritionPlan()
    return { success: true as const, data: plan }
  } catch (error) {
    console.error('[getNutritionAction]', error)
    return { success: false as const, error: 'Falha ao buscar plano nutricional' }
  }
}

export async function saveNutritionAction(plan: Partial<NutritionPlan>) {
  try {
    const result = await saveNutritionPlan(plan)
    revalidatePath('/nutrition')
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[saveNutritionAction]', error)
    return { success: false as const, error: 'Falha ao salvar plano nutricional' }
  }
}

export async function getNutritionHistoryAction(limit = 10) {
  try {
    const { getNutritionHistory } = await import('@/lib/db/nutrition')
    const history = await getNutritionHistory(limit)
    return { success: true as const, data: history }
  } catch (error) {
    console.error('[getNutritionHistoryAction]', error)
    return { success: false as const, error: 'Falha ao buscar histórico' }
  }
}

// ── Protocol actions ─────────────────────────────────────────────────────────

export async function getActiveProtocolAction() {
  try {
    const protocol = await getActiveProtocol()
    return { success: true as const, data: protocol }
  } catch (error) {
    console.error('[getActiveProtocolAction]', error)
    return { success: false as const, error: 'Falha ao buscar protocolo ativo' }
  }
}

export async function getAllProtocolsAction(limit = 20) {
  try {
    const protocols = await getAllProtocols(limit)
    return { success: true as const, data: protocols }
  } catch (error) {
    console.error('[getAllProtocolsAction]', error)
    return { success: false as const, error: 'Falha ao buscar histórico de protocolos' }
  }
}

export async function confirmProtocolSwitchAction(
  previousId: string | null,
  newProtocol: Omit<NutritionProtocol, 'id' | 'created_at'>,
) {
  try {
    const result = await switchProtocol(previousId ?? undefined, newProtocol)
    revalidatePath('/nutrition')
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[confirmProtocolSwitchAction]', error)
    return { success: false as const, error: 'Falha ao trocar protocolo' }
  }
}

export async function updateProtocolAction(id: string, data: Partial<NutritionProtocol>) {
  try {
    const result = await updateProtocol(id, data)
    revalidatePath('/nutrition')
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[updateProtocolAction]', error)
    return { success: false as const, error: 'Falha ao atualizar protocolo' }
  }
}

export async function closeProtocolAction(id: string) {
  try {
    await closeProtocol(id)
    revalidatePath('/nutrition')
    return { success: true as const }
  } catch (error) {
    console.error('[closeProtocolAction]', error)
    return { success: false as const, error: 'Falha ao encerrar protocolo' }
  }
}
