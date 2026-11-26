'use client'
import { useMemo, useState } from 'react'
import type { AdminUser } from '@/lib/admin-db'
import { call } from '@/lib/admin-api'
import { Ic } from '../Ic'

type Filter = 'all' | 'admin' | 'user' | 'suspended'
const FILTERS: [Filter, string][] = [['all', 'All'], ['admin', 'Admins'], ['user', 'Users'], ['suspended', 'Suspended']]
const field = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#f26522] focus:bg-white'
const when = (t: number) => new Date(t).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

function Segmented({ value, onChange, disabled }: { value: 'admin' | 'user'; onChange: (v: 'admin' | 'user') => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Role" className={'inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium ' + (disabled ? 'opacity-50' : '')}>
      {(['admin', 'user'] as const).map((r) => (
        <button key={r} role="radio" aria-checked={value === r} disabled={disabled} onClick={() => value !== r && onChange(r)} className={'rounded-md px-3 py-1.5 capitalize transition ' + (value === r ? (r === 'admin' ? 'bg-[#f26522] text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-800')}>{r}</button>
      ))}
    </div>
  )
}

function AddUser({ onClose, onCreated }: { onClose: () => void; onCreated: (u: AdminUser) => void }) {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { onCreated(await call<AdminUser>('/api/admin/users', 'POST', f)); onClose() } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.') }
    setBusy(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add user</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Ic n="close" /></button>
        </div>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Name</span><input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Email</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Password (8+ characters)</span><input type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={field} /></label>
        <div><span className="mb-1.5 block text-xs font-medium text-slate-500">Role</span><Segmented value={f.role} onChange={(role) => setF({ ...f, role })} /></div>
        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-[#f26522] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d9561a] disabled:opacity-60">{busy ? 'Adding…' : 'Add user'}</button>
        </div>
      </form>
    </div>
  )
}

export default function UsersManager({ initial, meId }: { initial: AdminUser[]; meId: number }) {
  const [users, setUsers] = useState(initial)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase()
    return users.filter((u) => (filter === 'all' || (filter === 'suspended' ? u.status === 'suspended' : u.role === filter)) && (!n || (u.name + ' ' + u.email).toLowerCase().includes(n)))
  }, [users, q, filter])
  const count = (f: Filter) => users.filter((u) => (f === 'all' ? true : f === 'suspended' ? u.status === 'suspended' : u.role === f)).length

  const change = async (u: AdminUser, body: { role?: string; status?: string }) => {
    setBusyId(u.id); setError('')
    try { const next = await call<AdminUser>(`/api/admin/users/${u.id}`, 'PATCH', body); setUsers((all) => all.map((x) => (x.id === u.id ? next : x))) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    setBusyId(null)
  }
  const remove = async (u: AdminUser) => {
    if (!confirm(`Delete ${u.name}? Their ${u.pages} ${u.pages === 1 ? 'page' : 'pages'} will be deleted too. This cannot be undone.`)) return
    setBusyId(u.id); setError('')
    try { await call(`/api/admin/users/${u.id}`, 'DELETE'); setUsers((all) => all.filter((x) => x.id !== u.id)) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    setBusyId(null)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={'rounded-full px-3.5 py-1.5 text-sm transition ' + (filter === k ? 'bg-[#0e4f5c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
              {label} <span className="opacity-70">{count(k)}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email..." className={field + ' min-w-0 flex-1 sm:!w-56 sm:flex-none'} />
          <button onClick={() => setAdding(true)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#f26522] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d9561a]"><Ic n="user" className="size-4" /> Add user</button>
        </div>
      </div>

      {error && <p role="alert" className="m-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#fafafa] text-xs uppercase tracking-wider text-slate-400">
            <tr><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Pages</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((u) => {
              const me = u.id === meId
              const busy = busyId === u.id
              return (
                <tr key={u.id} className={busy ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{u.name[0]?.toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">{u.name}{me && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">You</span>}</div>
                        <div className="truncate text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Segmented value={u.role} disabled={me || busy} onChange={(role) => change(u, { role })} /></td>
                  <td className="px-4 py-3">
                    <button
                      disabled={me || busy}
                      onClick={() => change(u, { status: u.status === 'active' ? 'suspended' : 'active' })}
                      title={me ? 'You cannot suspend yourself' : u.status === 'active' ? 'Click to suspend' : 'Click to reactivate'}
                      className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ' + (u.status === 'active' ? 'bg-emerald-50 text-emerald-700 enabled:hover:bg-emerald-100' : 'bg-red-50 text-red-700 enabled:hover:bg-red-100')}
                    >
                      <i className={'size-1.5 rounded-full ' + (u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500')} />{u.status === 'active' ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.pages}</td>
                  <td className="px-4 py-3 text-slate-500">{when(u.created)}</td>
                  <td className="px-4 py-3 text-right">
                    <button disabled={me || busy} onClick={() => remove(u)} title={me ? 'You cannot delete yourself' : 'Delete user'} aria-label={`Delete ${u.name}`} className="rounded p-2 text-slate-400 transition enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:opacity-30"><Ic n="del" /></button>
                  </td>
                </tr>
              )
            })}
            {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No user matches your filter.</td></tr>}
          </tbody>
        </table>
      </div>
      {adding && <AddUser onClose={() => setAdding(false)} onCreated={(u) => setUsers((all) => [u, ...all])} />}
    </section>
  )
}
