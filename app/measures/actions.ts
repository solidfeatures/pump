'use server'

import { BodyMetric, upsertBodyMetrics, getBodyMetricsHistory, deleteBodyMetric } from '@/lib/db/measures'
import { revalidatePath } from 'next/cache'

export async function saveMeasuresAction(metrics: Partial<BodyMetric>) {
  try {
    const result = await upsertBodyMetrics(metrics)
    revalidatePath('/measures')
    revalidatePath('/')
    return { success: true, data: result }
  } catch (error) {
    console.error('[saveMeasuresAction]', error)
    return { success: false, error: 'Falha ao salvar medidas' }
  }
}

export async function getMeasuresHistoryAction(limit = 30) {
  try {
    const history = await getBodyMetricsHistory(limit)
    return { success: true, data: history }
  } catch (error) {
    console.error('[getMeasuresHistoryAction]', error)
    return { success: false, error: 'Falha ao buscar histórico' }
  }
}

export async function deleteMeasureAction(id: string) {
  try {
    const success = await deleteBodyMetric(id)
    if (success) {
      revalidatePath('/measures')
      revalidatePath('/')
      return { success: true }
    }
    return { success: false, error: 'Erro ao excluir registro' }
  } catch (error) {
    console.error('[deleteMeasureAction]', error)
    return { success: false, error: 'Falha ao excluir medida' }
  }
}
