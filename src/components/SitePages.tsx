'use client'
// The page switcher of a site, in the editor header: a drop-down of the site's pages, add (+), duplicate, rename and delete.
// The first page is the site's home (index.html); deleting the whole site is done from the dashboard.
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createPage, deletePage, renamePage } from '@/lib/pages'
import { slug } from '@/lib/exporter'
import type { Node } from '@/lib/tree'
import { Ic } from './Ic'

export type SiteEntry = { id: string; name: string }
const icon = 'grid size-9 shrink-0 md:size-8 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent'
const PLUS = <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>

export default function SitePages({ current, name, pages, root, onRename, className = '' }: { current: string; name: string; pages: SiteEntry[]; root: Node; onRename: (n: string) => void; className?: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null) // the name being typed, while renaming
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const home = pages[0].id
  const isHome = current === home
  const shown = pages.map((p) => (p.id === current ? { ...p, name } : p)) // the open page may have been renamed here
  const go = (id: string) => router.push(`/?page=${id}`) // leaving saves the open page first
  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } setBusy(false) }

  const add = () => run(async () => go((await createPage(`Page ${pages.length + 1}`, undefined, home)).id))
  const duplicate = () => run(async () => go((await createPage(`${name} (copy)`.slice(0, 120), root, home)).id)) // copies what is on screen, saved or not
  const remove = () => {
    if (isHome || !confirm(`Delete “${name}”? This cannot be undone.`)) return
    const next = pages[pages.findIndex((p) => p.id === current) - 1]?.id ?? home
    run(async () => { await deletePage(current); go(next) })
  }
  const rename = () => {
    const n = (editing ?? '').trim()
    setEditing(null)
    if (n && n !== name) run(async () => { await renamePage(current, n); onRename(n); router.refresh() })
  }
  const path = (i: number) => (i === 0 ? 'index.html' : `pages/${slug(shown[i].name) || 'page'}.html`)

  return (
    <div className={'relative ' + className}>
      <div className="flex w-full items-center overflow-hidden md:w-auto rounded-lg border border-white/15 bg-white/5 focus-within:border-indigo-400">
        {editing !== null ? (
          <input autoFocus value={editing} maxLength={80} onChange={(e) => setEditing(e.target.value)} onBlur={rename} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null) }} aria-label="Page name" className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none md:h-8 md:w-52 md:flex-none" />
        ) : (
          <div className="relative min-w-0 flex-1 md:flex-none">
            <select value={current} onChange={(e) => go(e.target.value)} aria-label="Page" title={path(pages.findIndex((p) => p.id === current))} className="h-9 w-full cursor-pointer appearance-none truncate md:h-8 md:w-52 bg-transparent pl-3 pr-8 text-sm text-slate-100 outline-none">
              {shown.map((p, i) => <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}{i === 0 ? ' (Home)' : ''}</option>)}
            </select>
            <Ic n="down" className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        )}
        <span className="h-5 w-px bg-white/15" aria-hidden />
        <button onClick={add} disabled={busy} title="Add a page" aria-label="Add a page" className={icon}>{PLUS}</button>
        <button onClick={duplicate} disabled={busy} title="Duplicate this page" aria-label="Duplicate this page" className={icon}><Ic n="dup" className="size-4" /></button>
        <button onClick={() => setEditing(name)} disabled={busy} title="Rename this page" aria-label="Rename this page" className={icon}><Ic n="text" className="size-4" /></button>
        <button onClick={remove} disabled={busy || isHome} title={isHome ? 'The home page cannot be deleted here. Delete the whole site from the dashboard.' : 'Delete this page'} aria-label="Delete this page" className={icon + ' hover:!bg-rose-500/20 hover:!text-rose-300'}><Ic n="del" className="size-4" /></button>
      </div>
      {error && <span role="alert" className="absolute left-0 top-full z-40 mt-1 w-72 rounded-md bg-rose-600 px-3 py-2 text-xs text-white shadow-lg">{error}</span>}
    </div>
  )
}
