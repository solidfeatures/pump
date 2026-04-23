'use server'

import { BodyMetric, upsertBodyMetrics, getBodyMetricsHistory, deleteBodyMetric } from '@/lib/db/measures'
import { createProgressPhoto, deleteProgressPhoto, getProgressPhotos } from '@/lib/db/photos'
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

export async function getProgressPhotosAction(limit = 50) {
  try {
    const photos = await getProgressPhotos(limit)
    return { success: true, data: photos }
  } catch (error) {
    console.error('[getProgressPhotosAction]', error)
    return { success: false, data: [] as never[], error: 'Falha ao buscar fotos' }
  }
}

export async function saveProgressPhotoAction(data: {
  date: string
  storage_path: string
  angle: string
  notes?: string
}) {
  try {
    const photo = await createProgressPhoto(data)
    revalidatePath('/measures')
    revalidatePath('/history')
    return { success: true, data: photo }
  } catch (error) {
    console.error('[saveProgressPhotoAction]', error)
    return { success: false, error: 'Falha ao salvar foto' }
  }
}

export async function deleteProgressPhotoAction(id: string, storagePath: string) {
  try {
    await deleteProgressPhoto(id)
    revalidatePath('/measures')
    revalidatePath('/history')
    return { success: true, storagePath }
  } catch (error) {
    console.error('[deleteProgressPhotoAction]', error)
    return { success: false, error: 'Falha ao excluir foto' }
  }
}
