import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LoginCard from '@/components/LoginCard'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Log in — ShinSpace' }

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/dashboard')
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e9e6f5] p-4 sm:p-8">
      <LoginCard />
    </main>
  )
}
