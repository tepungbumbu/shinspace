'use client'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { GROUP_INFO, GROUPS, SECTIONS, type Section } from '@/lib/sections'
import { drag, type Node } from '@/lib/tree'
import { Ic } from './Ic'
import Wire from './Wire'

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
  pushRecent(s.title)
}

// The wireframe is laid out at a fixed logical width and scaled down, so every thumbnail keeps its real proportions.
const LOGICAL = 300
const Thumb = ({ node, scale, h }: { node: Node; scale: number; h: number }) => (
  <div className="relative overflow-hidden bg-slate-50" style={{ height: h }}>
    <div style={{ width: LOGICAL, transform: `scale(${scale})`, transformOrigin: '0 0' }} className="p-2">
      <Wire node={node} />
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-50 to-transparent" />
  </div>
)

type Peek = { s: Section; top: number }

export default function SectionsTab({ onAdd }: { onAdd: (n: Node) => void }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [peek, setPeek] = useState<Peek | null>(null)
  const [, bump] = useState(0) // re-render after an add so "recent" is read again
  const recent = useSyncExternalStore(() => () => {}, () => localStorage.getItem(RECENT) ?? '[]', () => '[]')
  const roots = useMemo(() => new Map(SECTIONS.map((s) => [s.title, s.make()])), [])
  const needle = q.trim().toLowerCase()
  const recentSections = useMemo(() => (JSON.parse(recent) as string[]).map((t) => SECTIONS.find((s) => s.title === t)).filter((s): s is Section => !!s), [recent])

  const add = (s: Section) => { onAdd(s.make()); pushRecent(s.title); bump((n) => n + 1); setPeek(null) }

  const card = (s: Section, showGroup = false) => (
    <button
      key={s.title}
      draggable
      onDragStart={(e) => { setPeek(null); startDrag(s)(e) }}
      onDragEnd={() => { drag.cur = null }}
      onClick={() => add(s)}
      onMouseEnter={(e) => setPeek({ s, top: Math.min(Math.max(e.currentTarget.getBoundingClientRect().top - 40, 72), window.innerHeight - 330) })}
      onMouseLeave={() => setPeek(null)}
      title={s.desc}
      className="group flex cursor-grab flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-indigo-400 hover:shadow-md"
    >
      <Thumb node={roots.get(s.title)!} scale={0.54} h={96} />
      <div className="border-t border-slate-100 px-2 py-1.5">
        <div className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800 group-hover:text-indigo-700">{s.title}</div>
        {showGroup && <div className="mt-0.5 text-[10px] text-slate-400">{s.group}</div>}
      </div>
    </button>
  )
  const grid = (list: Section[], showGroup = false) => <div className="grid grid-cols-2 gap-2">{list.map((s) => card(s, showGroup))}</div>

  const results = needle ? SECTIONS.filter((s) => (s.title + ' ' + s.desc + ' ' + s.group + ' ' + (s.sub ?? '')).toLowerCase().includes(needle)) : []
  const inCat = cat ? SECTIONS.filter((s) => s.group === cat) : []
  const subs = [...new Set(inCat.map((s) => s.sub ?? ''))]

  return (
    <div className="p-3">
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${SECTIONS.length} sections...`} className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-indigo-400" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><Ic n="close" className="size-3.5" /></button>}
      </div>

      {needle ? (
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
              {GROUPS.map((g) => {
                const list = SECTIONS.filter((s) => s.group === g)
                return (
                  <button key={g} onClick={() => setCat(g)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
                    <span className="flex w-[84px] shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                      <Thumb node={roots.get(list[0].title)!} scale={0.28} h={50} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{g} <span className="font-normal text-slate-400">· {list.length}</span></span>
                      <span className="block truncate text-xs text-slate-500">{GROUP_INFO[g]}</span>
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
          <Thumb node={roots.get(peek.s.title)!} scale={1.2} h={236} />
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
