import { supabase } from '../supabase'

export interface BodyMetric {
  id?: string
  date: string
  weight_kg: number
  height_cm: number
  bf_pct?: number
  sleep_hours?: number
  waist_cm?: number
  chest_cm?: number
  arms_cm?: number
  forearms_cm?: number
  thighs_cm?: number
  calves_cm?: number
  wrist_cm?: number
  ankle_cm?: number
  pain_notes?: string
  energy_level?: number
  created_at?: string
}

export async function getLatestBodyMetrics(): Promise<BodyMetric | null> {
  const { data, error } = await supabase
    .from('body_metrics')
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

export async function getBodyMetricsHistory(limit = 12): Promise<BodyMetric[]> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function upsertBodyMetrics(metrics: Partial<BodyMetric>) {
  const { data, error } = await supabase
    .from('body_metrics')
    .upsert(metrics, { onConflict: 'date' })
    .select()
    .single()

  if (error) throw error
  return data
}
