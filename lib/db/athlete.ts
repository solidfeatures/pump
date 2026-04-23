import { prisma } from '@/lib/prisma'

export interface AthleteProfile {
  id: string
  name: string
  experience_level: string
  injuries: string[]
  training_days: number
  goal?: string
  gender?: string
  birth_date?: string
  created_at?: string
  updated_at?: string
}

function mapProfile(raw: {
  id: string
  name: string
  experience_level: string
  injuries: string[]
  training_days: number
  goal: string
  gender: string
  birth_date: Date
  created_at: Date
  updated_at: Date
}): AthleteProfile {
  return {
    id: raw.id,
    name: raw.name,
    experience_level: raw.experience_level,
    injuries: raw.injuries,
    training_days: raw.training_days,
    goal: raw.goal,
    gender: raw.gender,
    birth_date: raw.birth_date.toISOString().split('T')[0],
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
  }
}

export async function getAthleteProfile(): Promise<AthleteProfile | null> {
  let row = await prisma.athleteProfile.findFirst()
  if (!row) {
    row = await prisma.athleteProfile.create({
      data: {
        name: 'Atleta',
        experience_level: 'Intermediário',
        training_days: 4,
        injuries: [],
        goal: 'Crescer Seco',
        gender: 'Masculino',
        birth_date: new Date('2000-01-01'),
      },
    })
  }
  return mapProfile(row)
}

export async function updateAthleteProfile(profile: Partial<AthleteProfile>): Promise<AthleteProfile> {
  if (!profile.id) throw new Error('id is required')
  const row = await prisma.athleteProfile.update({
    where: { id: profile.id },
    data: {
      name: profile.name,
      experience_level: profile.experience_level,
      injuries: profile.injuries,
      training_days: profile.training_days,
      goal: profile.goal,
      gender: profile.gender,
      birth_date: profile.birth_date ? new Date(profile.birth_date) : undefined,
    },
  })
  return mapProfile(row)
}
