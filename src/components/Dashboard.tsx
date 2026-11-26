'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { clearLegacy, readLegacy } from '@/lib/legacy'
import { copyPage, createPage, deletePage, renamePage, type PageFull, type User } from '@/lib/pages'
import { starter } from '@/lib/sections'
import { STYLE } from '@/lib/styles'
import type { Node } from '@/lib/tree'
import { Ic } from './Ic'

type Item = PageFull
const count = (n: Node): number => 1 + (n.c?.reduce((s, k) => s + count(k), 0) ?? 0)

const ago = (t: number, now: number) => {
  const s = Math.round((t - now) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [u, n] of units) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u)
  return 'just now'
}

// A tiny wireframe of the page: one bar per top-level section, tinted with its background.
function Thumb({ root }: { root: Node }) {
  const kids = root.c ?? []
  if (!kids.length) return <div className="flex h-36 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">Empty page</div>
  return (
    <div className="flex h-36 flex-col gap-1 overflow-hidden rounded-lg bg-slate-50 p-1.5 ring-1 ring-slate-200">
      {kids.slice(0, 5).map((k) => {
        const bg = STYLE.bg.sw![k.s.bg] ?? '#f1f5f9'
        const dark = ['dark', 'indigo', 'sky', 'amber'].includes(k.s.bg)
        const line = dark ? 'bg-white/50' : 'bg-slate-300'
        return (
          <div key={k.id} style={{ background: bg }} className="flex min-h-3 flex-1 flex-col justify-center gap-1 rounded px-2">
            <span className={'h-1 w-2/5 rounded-full ' + line} />
            <span className={'h-1 w-3/5 rounded-full opacity-60 ' + line} />
          </div>
        )
      })}
    </div>
  )
}

const card = 'rounded-xl border border-slate-200 bg-white shadow-sm'

function DashboardInner({ user, initial }: { user: User; initial: Item[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(initial)
  const [legacy, setLegacy] = useState(readLegacy)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [now, setNow] = useState(Date.now)
  // run an API call; show its error instead of failing silently
  const run = async (fn: () => Promise<void>) => { setError(''); try { await fn(); setNow(Date.now()) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } }
  const open = (id: string) => router.push(`/?page=${id}`)
  const create = (root?: Node) => run(async () => open((await createPage('Untitled page', root)).id))
  const importLegacy = () => run(async () => {
    const made: Item[] = []
    for (const p of legacy.pages) made.push(await createPage(p.name, p.root))
    clearLegacy(legacy.keys) // only after every page was saved
    setItems([...made, ...items])
    setLegacy({ pages: [], keys: [] })
  })

  const shown = items.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
  const week = items.filter((p) => now - p.updated < 7 * 86400_000).length
  const blocks = items.reduce((s, p) => s + Math.max(0, count(p.root) - 1), 0)
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login') }
  const first = user.name.split(' ')[0]

  return (
    <div className="flex min-h-screen bg-[#f5f4fa] text-slate-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-5 md:flex">
        <span className="text-xl font-semibold tracking-[0.18em]">SHINSPACE</span>
        <nav className="mt-10 space-y-1 text-sm">
          <span className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 font-medium text-violet-700"><Ic n="container" /> Pages</span>
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6d54b5] text-sm font-semibold text-white">{user.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 text-sm">
              <div className="truncate font-medium">{user.name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Log out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <div className="mb-6 flex items-center justify-between md:hidden">
          <span className="text-lg font-semibold tracking-[0.18em]">SHINSPACE</span>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700">Log out</button>
        </div>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Welcome back, {first}</h1>
            <p className="mt-2 text-sm text-slate-500">Build, edit and export your pages.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => create()} className="rounded-lg bg-[#6d54b5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#7c63c6]">+ New page</button>
          </div>
        </header>

        {error && <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}
        {legacy.pages.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
            <span>Found {legacy.pages.length} {legacy.pages.length === 1 ? 'page' : 'pages'} saved in this browser before accounts existed.</span>
            <button onClick={importLegacy} className="rounded-md bg-[#6d54b5] px-4 py-1.5 font-medium text-white hover:bg-[#7c63c6]">Import to my account</button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[['Pages', items.length], ['Edited this week', week], ['Blocks used', blocks]].map(([label, n]) => (
            <div key={label} className={card + ' p-5'}>
              <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-medium">{n}</div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Your pages</h2>
            {items.length > 0 && (
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages..." className="w-full rounded-md border border-transparent border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 sm:w-64" />
            )}
          </div>

          {items.length === 0 ? (
            <div className={card + ' flex flex-col items-center px-6 py-16 text-center'}>
              <p className="text-lg font-medium">No pages yet</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">Start with a ready-made sample, or open a blank page and drop in blocks.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => create(starter())} className="rounded-lg bg-[#6d54b5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7c63c6]">Use the sample page</button>
                <button onClick={() => create()} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Blank page</button>
              </div>
            </div>
          ) : shown.length === 0 ? (
            <p className="text-sm text-slate-500">No page matches “{q}”.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => (
                <article key={p.id} className={card + ' group overflow-hidden p-3 transition hover:border-violet-300'}>
                  <button onClick={() => open(p.id)} className="block w-full text-left" aria-label={`Open ${p.name}`}>
                    <Thumb root={p.root} />
                  </button>
                  <div className="flex items-center gap-2 px-1 pb-1 pt-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/?page=${p.id}`} className="block truncate text-sm font-medium hover:text-violet-600">{p.name}</Link>
                      <div className="text-xs text-slate-500">Edited {ago(p.updated, now)} · {Math.max(0, count(p.root) - 1)} blocks</div>
                    </div>
                    <button title="Rename" onClick={() => { const n = prompt('Page name', p.name)?.trim(); if (n) run(async () => { await renamePage(p.id, n); setItems(items.map((x) => (x.id === p.id ? { ...x, name: n, updated: Date.now() } : x))) }) }} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Ic n="text" /></button>
                    <button title="Duplicate" onClick={() => run(async () => setItems([await copyPage(p.id), ...items]))} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Ic n="dup" /></button>
                    <button title="Delete" onClick={() => { if (confirm(`Delete “${p.name}”? This cannot be undone.`)) run(async () => { await deletePage(p.id); setItems(items.filter((x) => x.id !== p.id)) }) }} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Ic n="del" /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// Wait for the browser before rendering (relative times and the old browser-saved pages differ from the server's view).
export default function Dashboard({ user, initial }: { user: User; initial: PageFull[] }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  return mounted ? <DashboardInner user={user} initial={initial} /> : null
}
