import type { Metadata } from 'next'
import { getAthleteProfile } from '@/lib/db/athlete'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = {
  title: 'Perfil | Antigravity Fitness',
}

export default async function ProfilePage() {
  const profile = await getAthleteProfile()
  return <ProfileForm initialProfile={profile} />
}
