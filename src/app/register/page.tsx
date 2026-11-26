import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import RegisterCard from '@/components/RegisterCard'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Create an account — ShinSpace' }

export default async function RegisterPage() {
  if (await getSessionUser()) redirect('/dashboard')
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e9e6f5] p-4 sm:p-8">
      <RegisterCard />
    </main>
  )
}
