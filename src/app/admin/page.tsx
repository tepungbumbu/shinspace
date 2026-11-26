import Link from 'next/link'
import { Area, Bars, Card, Dots, Spark, Stacked, Stat } from '@/components/admin/Charts'
import { Ic } from '@/components/Ic'
import { overview } from '@/lib/admin-db'

const when = (t: number) => new Date(t).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
const short = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })

const ACTIONS = [
  { href: '/admin/components', label: 'Add component', icon: 'layers' },
  { href: '/admin/users', label: 'Add user', icon: 'user' },
  { href: '/admin/users', label: 'Manage roles', icon: 'shield' },
  { href: '/dashboard', label: 'My pages', icon: 'container' },
]

export default function Overview() {
  const o = overview(14)
  const active = o.users - o.suspended
  const labels = o.signups.map((d) => short(d.day))
  const drafts = o.components - o.published

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total users" value={o.users} caption={`${o.admins} admin${o.admins === 1 ? '' : 's'}`} icon={<Ic n="users" className="size-4" />} spark={<Spark values={o.signups.map((d) => d.n)} kind="bars" />} />
        <Stat label="Pages" value={o.pages} caption={`${o.pagesWeek} edited this week`} icon={<Ic n="container" className="size-4" />} spark={<Spark values={o.edits.map((d) => d.n)} />} />
        <Stat label="Components" value={o.components} caption={`${o.published} published · ${drafts} draft`} icon={<Ic n="layers" className="size-4" />} />
        <Stat label="Active sessions" value={o.sessions} caption="signed in right now" icon={<Ic n="bolt" className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <Card title="Most used blocks" icon={<Ic n="tBlocks" className="size-[18px] text-[#f26522]" />} right={<span className="text-xs text-slate-400">across {o.scanned} {o.scanned === 1 ? 'page' : 'pages'}</span>}>
          {o.blocks.length ? <Bars items={o.blocks.map((b) => ({ label: b.label, value: b.n }))} /> : <p className="py-16 text-center text-sm text-slate-400">No pages yet. Block usage appears here once people start building.</p>}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ['Admins', o.admins, 'ok'],
              ['Suspended', o.suspended, o.suspended ? 'bad' : 'ok'],
              ['Pages this week', o.pagesWeek, 'ok'],
              ['Published', o.published, 'ok'],
              ['Drafts', drafts, drafts ? 'warn' : 'ok'],
              ['Pages per user', o.users ? (o.pages / o.users).toFixed(1) : '0', 'ok'],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#fafafa] px-4 py-3">
                <div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-0.5 text-sm font-semibold">{value}</div>
                </div>
                <i className={'size-2.5 rounded-full ' + (tone === 'bad' ? 'bg-red-500' : tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-500')} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Active accounts" icon={<Ic n="shield" className="size-[18px] text-[#f26522]" />}>
            <div className="mb-3 flex items-baseline justify-between text-sm">
              <span className="text-slate-500">{active} of {o.users} users</span>
              <b>{o.users ? Math.round((active / o.users) * 100) : 0}%</b>
            </div>
            <Dots on={active} total={o.users} />
          </Card>
          <Card title="Quick actions" icon={<Ic n="bolt" className="size-[18px] text-[#f26522]" />}>
            <div className="grid grid-cols-2 gap-4">
              {ACTIONS.map((a) => (
                <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-2 text-center text-xs text-slate-600">
                  <span className="flex size-14 items-center justify-center rounded-full bg-[#0e4f5c] text-white transition group-hover:bg-[#f26522]"><Ic n={a.icon} className="size-6" /></span>
                  {a.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Sign-ups and page activity" icon={<Ic n="trend" className="size-[18px] text-[#f26522]" />} right={<span className="text-xs text-slate-400">last 14 days</span>}>
        <Area labels={labels} series={[{ name: 'New users', color: '#0e4f5c', values: o.signups.map((d) => d.n) }, { name: 'Pages edited', color: '#f26522', values: o.edits.map((d) => d.n) }]} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Role distribution" icon={<Ic n="users" className="size-[18px] text-[#f26522]" />}>
          <Stacked parts={[{ label: 'Admins', value: o.admins, color: '#f26522' }, { label: 'Users', value: o.users - o.admins - o.suspended, color: '#0e4f5c' }, { label: 'Suspended', value: o.suspended, color: '#fbbf24' }]} />
        </Card>
        <Card title="Newest users" icon={<Ic n="user" className="size-[18px] text-[#f26522]" />} right={<Link href="/admin/users" className="text-xs font-medium text-[#f26522] hover:underline">View all</Link>}>
          <ul className="divide-y divide-slate-100">
            {o.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{u.name[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{u.name}</div>
                  <div className="truncate text-xs text-slate-400">{u.email}</div>
                </div>
                <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (u.role === 'admin' ? 'bg-[#f26522]/10 text-[#f26522]' : 'bg-slate-100 text-slate-500')}>{u.role}</span>
                <span className="hidden text-xs text-slate-400 sm:block">{when(u.created)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
