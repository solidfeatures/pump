import { getAthleteProfile } from '@/lib/db/athlete'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const profile = await getAthleteProfile()
  return <ProfileForm initialProfile={profile} />
}
