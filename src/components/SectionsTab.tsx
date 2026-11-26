'use client'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { customSection, GROUP_INFO, GROUPS, sectionKey, type CustomComp, type Section } from '@/lib/sections'
import { drag, type Node } from '@/lib/tree'
import { Ic } from './Ic'
import { WireThumb } from './Wire'

// ---- "recently used" lives in this browser only ----
const RECENT = 'shinspace:recent-sections'
const readRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT) ?? '[]') } catch { return [] }
}
const pushRecent = (title: string) => {
  try { localStorage.setItem(RECENT, JSON.stringify([title, ...readRecent().filter((t) => t !== title)].slice(0, 4))) } catch {}
}

const startDrag = (s: Section) => (e: React.DragEvent) => {
  drag.cur = { kind: 'new', node: s.make() }
  e.dataTransfer.setData('text/plain', 'pf')
  e.dataTransfer.effectAllowed = 'copy'
  pushRecent(sectionKey(s))
}

const Thumb = WireThumb

type Peek = { s: Section; top: number }

const NONE: CustomComp[] = [] // a stable empty list while the library is still loading
export default function SectionsTab({ onAdd, components, failed, onRetry }: { onAdd: (n: Node) => void; components: CustomComp[] | null; failed: boolean; onRetry: () => void }) {
  const custom = components ?? NONE
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [peek, setPeek] = useState<Peek | null>(null)
  const [, bump] = useState(0) // re-render after an add so "recent" is read again
  const recent = useSyncExternalStore(() => () => {}, () => localStorage.getItem(RECENT) ?? '[]', () => '[]')
  // every section comes from the database, in the order the admins left them
  const all = useMemo(() => custom.map(customSection), [custom])
  const groups = useMemo(() => [...GROUPS, ...new Set(custom.map((c) => c.category).filter((c) => !(GROUPS as readonly string[]).includes(c)))], [custom])
  const roots = useMemo(() => new Map(all.map((s) => [sectionKey(s), s.make()])), [all])
  const needle = q.trim().toLowerCase()
  const recentSections = useMemo(() => (JSON.parse(recent) as string[]).map((k) => all.find((s) => sectionKey(s) === k)).filter((s): s is Section => !!s), [recent, all])

  const add = (s: Section) => { onAdd(s.make()); pushRecent(sectionKey(s)); bump((n) => n + 1); setPeek(null) }

  const card = (s: Section, showGroup = false) => (
    <button
      key={sectionKey(s)}
      draggable
      onDragStart={(e) => { setPeek(null); startDrag(s)(e) }}
      onDragEnd={() => { drag.cur = null }}
      onClick={() => add(s)}
      onMouseEnter={(e) => setPeek({ s, top: Math.min(Math.max(e.currentTarget.getBoundingClientRect().top - 40, 72), window.innerHeight - 330) })}
      onMouseLeave={() => setPeek(null)}
      title={s.desc}
      className="group flex cursor-grab flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-indigo-400 hover:shadow-md"
    >
      <Thumb node={roots.get(sectionKey(s))!} scale={0.54} h={96} />
      <div className="border-t border-slate-100 px-2 py-1.5">
        <div className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800 group-hover:text-indigo-700">{s.title}</div>
        {(showGroup || s.custom) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
            {showGroup && <span>{s.group}</span>}
            {s.custom && <span className="rounded bg-[#f26522]/10 px-1 font-semibold text-[#f26522]">Custom</span>}
          </div>
        )}
      </div>
    </button>
  )
  const grid = (list: Section[], showGroup = false) => <div className="grid grid-cols-2 gap-2">{list.map((s) => card(s, showGroup))}</div>

  const results = needle ? all.filter((s) => (s.title + ' ' + s.desc + ' ' + s.group + ' ' + (s.sub ?? '')).toLowerCase().includes(needle)) : []
  const inCat = cat ? all.filter((s) => s.group === cat) : []
  const subs = [...new Set(inCat.map((s) => s.sub ?? ''))]

  return (
    <div className="p-3">
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${all.length} sections...`} className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-indigo-400" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><Ic n="close" className="size-3.5" /></button>}
      </div>

      {components === null ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {failed ? (<>Could not load the sections. <button onClick={onRetry} className="font-medium text-indigo-600 hover:underline">Try again</button></>) : 'Loading sections…'}
        </div>
      ) : needle ? (
        <div className="mt-3">
          <p className="mb-2 text-xs text-slate-400">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
          {results.length ? grid(results, true) : <p className="py-8 text-center text-sm text-slate-400">No section matches “{q}”.</p>}
        </div>
      ) : cat ? (
        <div className="mt-3">
          <button onClick={() => setCat(null)} className="-ml-1 mb-3 inline-flex items-center gap-1 rounded px-1 py-0.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <Ic n="down" className="size-4 rotate-90" /> {cat} <span className="font-normal text-slate-400">· {inCat.length}</span>
          </button>
          {subs.map((sub) => (
            <div key={sub} className="mb-4">
              {sub && <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{sub}</h4>}
              {grid(inCat.filter((s) => (s.sub ?? '') === sub))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {recentSections.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recently used</h4>
              {grid(recentSections.slice(0, 4))}
            </div>
          )}
          <div>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Browse by category</h4>
            <div className="space-y-1.5">
              {groups.map((g) => {
                const list = all.filter((s) => s.group === g)
                if (!list.length) return null
                return (
                  <button key={g} onClick={() => setCat(g)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
                    <span className="flex w-[84px] shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                      <Thumb node={roots.get(sectionKey(list[0]))!} scale={0.28} h={50} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{g} <span className="font-normal text-slate-400">· {list.length}</span></span>
                      <span className="block truncate text-xs text-slate-500">{GROUP_INFO[g as keyof typeof GROUP_INFO] ?? 'Added by your admins'}</span>
                    </span>
                    <Ic n="down" className="size-4 -rotate-90 text-slate-300" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* a larger look at the section under the pointer, with what it is for */}
      {peek && (
        <div className="pointer-events-none fixed z-40 w-[400px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" style={{ left: 372, top: peek.top }}>
          <Thumb node={roots.get(sectionKey(peek.s))!} scale={1.2} h={236} />
          <div className="border-t border-slate-100 p-3">
            <div className="text-sm font-semibold text-slate-900">{peek.s.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">{peek.s.desc}</div>
            <div className="mt-1.5 text-[11px] text-slate-400">Click to add · drag to place</div>
          </div>
        </div>
      )}
    </div>
  )
}
