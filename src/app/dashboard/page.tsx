import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import { getSessionUser } from '@/lib/auth'
import { listPages } from '@/lib/pages-db'

export const metadata: Metadata = { title: 'Dashboard — ShinSpace' }

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return <Dashboard user={{ name: user.name, email: user.email }} initial={listPages(user.id)} isAdmin={user.role === 'admin'} />
}
