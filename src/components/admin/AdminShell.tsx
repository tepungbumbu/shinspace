'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Ic } from '../Ic'

const NAV = [
  { href: '/admin', label: 'Overview', icon: 'chart', title: 'Admin Dashboard' },
  { href: '/admin/users', label: 'Users & roles', icon: 'users', title: 'Users & Roles' },
  { href: '/admin/components', label: 'Components', icon: 'layers', title: 'Component Library' },
  { href: '/admin/activity', label: 'Activity log', icon: 'clock', title: 'Activity Log' },
]
const item = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition'

export default function AdminShell({ user, sessions, suspended, children }: { user: { name: string; email: string }; sessions: number; suspended: number; children: ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const current = NAV.find((n) => (n.href === '/admin' ? path === '/admin' : path.startsWith(n.href))) ?? NAV[0]
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login') }

  return (
    <div className="flex min-h-screen bg-[#f8f8f8] text-[#232323]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5 text-xl font-semibold tracking-[0.18em]">SHINSPACE</div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Main menu</div>
            {NAV.map((n) => {
              const on = n === current
              return (
                <Link key={n.href} href={n.href} className={item + (on ? ' bg-[#f26522]/10 font-semibold text-[#f26522]' : ' text-slate-600 hover:bg-slate-50')}>
                  <Ic n={n.icon} className="size-[18px]" /> {n.label}
                </Link>
              )
            })}
          </div>
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</div>
            <Link href="/dashboard" className={item + ' text-slate-600 hover:bg-slate-50'}><Ic n="container" className="size-[18px]" /> My pages</Link>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 pb-2 pt-6 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{current.title}</h1>
            <nav aria-label="Breadcrumb" className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
              <Ic n="home" className="size-4" /> <span>›</span> <span>Admin</span> <span>›</span> <span className="text-slate-700">{current.label}</span>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="flex size-7 items-center justify-center rounded bg-emerald-500 text-white"><Ic n="bolt" className="size-4" /></span>
              <span className="text-slate-500">Active sessions</span> <b>{sessions}</b>
            </span>
            <span className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="flex size-7 items-center justify-center rounded bg-red-500 text-white"><Ic n="lock" className="size-4" /></span>
              <span className="text-slate-500">Suspended</span> <b>{suspended}</b>
            </span>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-1.5">
              <Link href="/profile" title="Your profile" className="-my-1 -ml-1 flex items-center gap-3 rounded-md p-1 transition hover:bg-slate-50">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0e4f5c] text-sm font-semibold text-white">{user.name[0]?.toUpperCase()}</span>
                <div className="min-w-0 max-w-40 text-sm leading-tight">
                  <div className="truncate font-medium">{user.name}</div>
                  <div className="truncate text-xs text-slate-500">Administrator</div>
                </div>
              </Link>
              <button onClick={logout} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50">Log out</button>
            </div>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto px-5 pb-2 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={'shrink-0 rounded-full px-4 py-1.5 text-sm ' + (n === current ? 'bg-[#f26522] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>{n.label}</Link>
          ))}
          <Link href="/dashboard" className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200">My pages</Link>
        </nav>
        <main className="space-y-5 px-5 pb-10 pt-4 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
