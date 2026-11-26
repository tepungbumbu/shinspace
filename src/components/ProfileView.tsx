'use client'
// The signed-in user's own account page: details, password, devices and deleting the account.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import { call } from '@/lib/admin-api'
import type { Entry } from '@/lib/activity'
import type { Profile } from '@/lib/profile-db'
import ActivityList from './ActivityList'

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#6d54b5] focus:ring-2 focus:ring-[#6d54b5]/20 disabled:bg-slate-50 disabled:text-slate-500'
const primary = 'rounded-lg bg-[#6d54b5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7c63c6] disabled:opacity-50'

type Msg = { ok: boolean; text: string } | null

function Card({ title, hint, danger, children }: { title: string; hint?: string; danger?: boolean; children: ReactNode }) {
  return (
    <section className={'rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ' + (danger ? 'border-rose-200' : 'border-slate-200')}>
      <h2 className={'text-base font-semibold ' + (danger ? 'text-rose-700' : '')}>{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
const Field = ({ label, children, note }: { label: string; children: ReactNode; note?: string }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {note && <span className="mt-1 block text-xs text-slate-500">{note}</span>}
  </label>
)
const Status = ({ m }: { m: Msg }) => (m ? <p role={m.ok ? 'status' : 'alert'} className={'text-sm ' + (m.ok ? 'text-emerald-700' : 'text-rose-700')}>{m.text}</p> : null)

export default function ProfileView({ profile, others, activity }: { profile: Profile; others: number; activity: { rows: Entry[]; total: number } }) {
  const router = useRouter()
  const admin = profile.role === 'admin'
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [saved, setSaved] = useState({ name: profile.name, email: profile.email })
  const [confirm, setConfirm] = useState('') // current password, needed when the email changes
  const [busy, setBusy] = useState('')
  const [info, setInfo] = useState<Msg>(null)
  const [pw, setPw] = useState({ current: '', next: '', again: '' })
  const [pwMsg, setPwMsg] = useState<Msg>(null)
  const [devices, setDevices] = useState(others)
  const [devMsg, setDevMsg] = useState<Msg>(null)
  const [del, setDel] = useState<string | null>(null) // null = closed, otherwise the password typed so far
  const [delMsg, setDelMsg] = useState<Msg>(null)

  const emailChanged = email.trim().toLowerCase() !== saved.email.toLowerCase()
  const infoDirty = name.trim() !== saved.name || email.trim() !== saved.email

  // runs one request: shows its error, or hands the answer to `ok`
  const act = async <T,>(id: string, set: (m: Msg) => void, run: () => Promise<T>, ok: (r: T) => void) => {
    setBusy(id); set(null)
    try { ok(await run()) } catch (e) { set({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' }) }
    setBusy('')
  }

  const saveInfo = (e: FormEvent) => {
    e.preventDefault()
    return act('info', setInfo, () => call<{ name: string; email: string }>('/api/profile', 'PATCH', { name, email, password: confirm }), (r) => {
      setSaved({ name: r.name, email: r.email }); setName(r.name); setEmail(r.email); setConfirm('')
      setInfo({ ok: true, text: 'Saved.' })
      router.refresh()
    })
  }
  const savePassword = (e: FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.again) return setPwMsg({ ok: false, text: 'The two new passwords do not match.' })
    return act('pw', setPwMsg, () => call<{ signedOut: number }>('/api/profile/password', 'POST', { current: pw.current, next: pw.next }), (r) => {
      setPw({ current: '', next: '', again: '' }); setDevices(0)
      setPwMsg({ ok: true, text: r.signedOut ? `Password changed. ${r.signedOut} other device${r.signedOut > 1 ? 's were' : ' was'} signed out.` : 'Password changed.' })
    })
  }
  const signOutOthers = () =>
    act('dev', setDevMsg, () => call<{ signedOut: number }>('/api/profile/sessions', 'DELETE', {}), (r) => {
      setDevices(0); setDevMsg({ ok: true, text: r.signedOut ? 'Signed out everywhere else.' : 'No other devices were signed in.' })
    })
  const deleteAccount = (e: FormEvent) => {
    e.preventDefault()
    return act('del', setDelMsg, () => call('/api/profile', 'DELETE', { password: del }), () => router.replace('/login'))
  }

  return (
    <div className="min-h-screen bg-[#f5f4fa] text-slate-900">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
        <span className="text-lg font-semibold tracking-[0.18em]">SHINSPACE</span>
        <Link href={admin ? '/admin' : '/dashboard'} className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">← {admin ? 'Admin dashboard' : 'Dashboard'}</Link>
        {admin && <Link href="/dashboard" className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">My pages</Link>}
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-8 sm:py-10">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#6d54b5] text-2xl font-semibold text-white">{saved.name[0]?.toUpperCase()}</span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{saved.name}</h1>
            <p className="truncate text-sm text-slate-500">{saved.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className={'rounded-full px-2 py-0.5 font-medium ' + (admin ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700')}>{admin ? 'Administrator' : 'User'}</span>
              <span>Member since {new Date(profile.created).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>{profile.pages} page{profile.pages === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>

        <Card title="Your details" hint="Your name is shown in the dashboard. You log in with your email.">
          <form onSubmit={saveInfo} className="space-y-4">
            <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required className={field} /></Field>
            <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" required className={field} /></Field>
            {emailChanged && (
              <Field label="Current password" note="Needed to confirm the new email address."><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="current-password" required className={field} /></Field>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button disabled={!infoDirty || busy === 'info'} className={primary}>{busy === 'info' ? 'Saving…' : 'Save changes'}</button>
              <Status m={info} />
            </div>
          </form>
        </Card>

        <Card title="Password" hint="Changing it signs you out of your other devices.">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required className={field} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" note="At least 8 characters."><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} minLength={8} maxLength={200} autoComplete="new-password" required className={field} /></Field>
              <Field label="Repeat new password"><input type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} minLength={8} maxLength={200} autoComplete="new-password" required className={field} /></Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button disabled={busy === 'pw'} className={primary}>{busy === 'pw' ? 'Updating…' : 'Update password'}</button>
              <Status m={pwMsg} />
            </div>
          </form>
        </Card>

        <Card title="Devices" hint={devices ? `You are also signed in on ${devices} other device${devices > 1 ? 's' : ''} or browser${devices > 1 ? 's' : ''}.` : 'This is the only place you are signed in.'}>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={signOutOthers} disabled={!devices || busy === 'dev'} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Sign out other devices</button>
            <Status m={devMsg} />
          </div>
        </Card>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 pb-3 pt-5 sm:px-6">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Logins, changes to your account and your pages. If something here is not you, change your password. {activity.total > activity.rows.length && `Showing the latest ${activity.rows.length} of ${activity.total}.`}</p>
          </div>
          <ActivityList rows={activity.rows} />
        </section>

        <Card danger title="Delete account" hint="Removes your account and every page you made. This cannot be undone.">
          {del === null ? (
            <button onClick={() => setDel('')} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50">Delete my account…</button>
          ) : (
            <form onSubmit={deleteAccount} className="space-y-4">
              <Field label="Type your password to confirm"><input type="password" value={del} onChange={(e) => setDel(e.target.value)} autoComplete="current-password" required autoFocus className={field} /></Field>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={busy === 'del'} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50">{busy === 'del' ? 'Deleting…' : 'Delete everything'}</button>
                <button type="button" onClick={() => { setDel(null); setDelMsg(null) }} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
                <Status m={delMsg} />
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  )
}
