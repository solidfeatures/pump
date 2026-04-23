import { supabase } from '../supabase'

export interface AthleteProfile {
  id: string
  name: string
  experience_level: string
  injuries: string[]
  training_days: number
  created_at?: string
  updated_at?: string
}

export async function getAthleteProfile(): Promise<AthleteProfile | null> {
  const { data, error } = await supabase
    .from('athlete_profile')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function updateAthleteProfile(profile: Partial<AthleteProfile>) {
  const { data, error } = await supabase
    .from('athlete_profile')
    .update(profile)
    .match({ id: profile.id })
    .select()
    .single()

  if (error) throw error
  return data
}
