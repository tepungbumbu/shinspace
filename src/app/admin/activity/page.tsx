import Link from 'next/link'
import ActivityList from '@/components/ActivityList'
import { listUsers } from '@/lib/admin-db'
import { listActivity } from '@/lib/activity'
import { KIND_LABEL, KINDS, type Kind } from '@/lib/activity-types'

const PER = 25
const sel = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#f26522]'

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ user?: string; kind?: string; p?: string }> }) {
  const q = await searchParams
  const userId = q.user && /^\d+$/.test(q.user) ? Number(q.user) : undefined
  const kind = q.kind && q.kind in KINDS ? (q.kind as Kind) : undefined
  const page = Math.max(1, Math.floor(Number(q.p)) || 1)
  const { rows, total } = listActivity({ userId, kind, limit: PER, offset: (page - 1) * PER })
  const pages = Math.max(1, Math.ceil(total / PER))
  const href = (p: number) => `/admin/activity?${new URLSearchParams({ ...(q.user ? { user: q.user } : {}), ...(kind ? { kind } : {}), p: String(p) })}`

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <form className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
        <select name="user" defaultValue={userId ?? ''} aria-label="User" className={sel}>
          <option value="">All users</option>
          {listUsers().map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
        <select name="kind" defaultValue={kind ?? ''} aria-label="Type" className={sel}>
          <option value="">All activity</option>
          {(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <button className="rounded-lg bg-[#f26522] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d9561a]">Filter</button>
        {(userId !== undefined || kind) && <Link href="/admin/activity" className="text-sm text-slate-500 hover:text-slate-800">Clear</Link>}
        <span className="ml-auto text-sm text-slate-500">{total} entr{total === 1 ? 'y' : 'ies'} · kept for 90 days</span>
      </form>
      <ActivityList rows={rows} showWho />
      {pages > 1 && (
        <nav className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm" aria-label="Pages">
          {page > 1 ? <Link href={href(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">← Newer</Link> : <span />}
          <span className="text-slate-500">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
