import { prisma } from '@/lib/prisma'
import { AthleteGoal } from '../types'

export interface AthleteProfile {
  id: string
  name: string
  experience_level: string
  goal: AthleteGoal
  injuries: string[]
  training_days: number
  gender: string
  birth_date: string
  created_at?: string
  updated_at?: string
}

function mapProfile(raw: any): AthleteProfile {
  if (!raw) {
    return {
      id: 'temp-id',
      name: 'Atleta',
      experience_level: 'Intermediário',
      goal: 'Crescer Seco',
      injuries: [],
      training_days: 4,
      gender: 'Masculino',
      birth_date: '2000-01-01'
    }
  }

  // Map legacy or unsupported goals to standard ones
  const validGoals: AthleteGoal[] = ['Crescer Seco', 'Emagrecer', 'Ganho de Peso', 'Manutenção']
  let goal = raw.goal as any
  if (!validGoals.includes(goal)) {
    goal = 'Crescer Seco'
  }

  let birthDate = '2000-01-01'
  try {
    if (raw.birth_date instanceof Date) {
      birthDate = raw.birth_date.toISOString().split('T')[0]
    } else if (typeof raw.birth_date === 'string') {
      birthDate = raw.birth_date.split('T')[0]
    }
  } catch (e) {
    console.error('[mapProfile] Error parsing birth_date:', e)
  }

  return {
    id: String(raw.id || 'temp-id'),
    name: String(raw.name || 'Atleta'),
    experience_level: String(raw.experience_level || 'Intermediário'),
    goal: goal as AthleteGoal,
    injuries: Array.isArray(raw.injuries) ? raw.injuries : [],
    training_days: Number(raw.training_days || 4),
    gender: String(raw.gender || 'Masculino'),
    birth_date: birthDate,
    created_at: raw.created_at instanceof Date ? raw.created_at.toISOString() : undefined,
    updated_at: raw.updated_at instanceof Date ? raw.updated_at.toISOString() : undefined,
  }
}

export async function getAthleteProfile(): Promise<AthleteProfile | null> {
  try {
    let row = null;
    try {
      row = await prisma.athleteProfile.findFirst();
      console.log('[getAthleteProfile] DB result:', row ? 'Profile found' : 'No profile found');
    } catch (dbError) {
      console.error('[getAthleteProfile] DB findFirst failed:', dbError);
    }
    
    if (!row) {
      console.log('[getAthleteProfile] Attempting to create default athlete profile...');
      try {
        row = await prisma.athleteProfile.create({
          data: {
            name: 'Atleta',
            goal: 'Crescer Seco',
            experience_level: 'Intermediário',
            training_days: 4,
            gender: 'Masculino',
            birth_date: new Date('2000-01-01')
          }
        })
        console.log('[getAthleteProfile] Default profile created successfully:', row.id);
      } catch (createError) {
        console.error('[getAthleteProfile] Creation failed:', createError);
        return {
          id: 'temp-id',
          name: 'Atleta (Fallback)',
          goal: 'Crescer Seco' as AthleteGoal,
          experience_level: 'Intermediário',
          training_days: 4,
          gender: 'Masculino',
          birth_date: '2000-01-01',
          injuries: []
        };
      }
    }
    
    return mapProfile(row)
  } catch (error) {
    console.error('[getAthleteProfile] Critical error:', error)
    return {
      id: 'temp-id-error',
      name: 'Atleta',
      goal: 'Crescer Seco',
      experience_level: 'Intermediário',
      training_days: 4,
      gender: 'Masculino',
      birth_date: '2000-01-01',
      injuries: []
    }
  }
}

export async function updateAthleteProfile(profile: Partial<AthleteProfile>): Promise<AthleteProfile> {
  if (!profile.id) throw new Error('id is required')
  const row = await prisma.athleteProfile.update({
    where: { id: profile.id },
    data: {
      name: profile.name,
      experience_level: profile.experience_level,
      goal: profile.goal,
      injuries: profile.injuries,
      training_days: profile.training_days,
      gender: profile.gender,
      birth_date: profile.birth_date ? new Date(profile.birth_date) : undefined,
    },
  })
  return mapProfile(row)
}
