import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ProfileView from '@/components/ProfileView'
import { getSessionUser, otherSessions } from '@/lib/auth'
import { listActivity } from '@/lib/activity'
import { getProfile } from '@/lib/profile-db'

export const metadata: Metadata = { title: 'Profile — ShinSpace' }

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return <ProfileView profile={getProfile(user.id)} others={await otherSessions(user.id)} activity={listActivity({ userId: user.id, limit: 30 })} />
}
