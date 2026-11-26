import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Admin — ShinSpace' }

// Every page under /admin is checked here, on the server, before anything renders.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const n = (sql: string, ...a: number[]) => (db().prepare(sql).get(...a) as { n: number }).n
  return (
    <AdminShell user={{ name: user.name, email: user.email }} sessions={n('SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?', Date.now())} suspended={n("SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'")}>
      {children}
    </AdminShell>
  )
}
