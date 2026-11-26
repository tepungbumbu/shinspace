'use client'
import { useState } from 'react'
import { BLOCKS, PALETTE, type Item } from '@/lib/blocks'
import { drag, type Node } from '@/lib/tree'
import { Ic } from './Ic'

const startDrag = (make: () => Node) => (e: React.DragEvent) => {
  drag.cur = { kind: 'new', node: make() }
  e.dataTransfer.setData('text/plain', 'pf')
  e.dataTransfer.effectAllowed = 'copy'
}
const endDrag = () => { drag.cur = null }

export function BlocksTab({ onAdd }: { onAdd: (n: Node) => void }) {
  const [q, setQ] = useState('')
  const items = PALETTE.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
  const groups = [...new Set(items.map((i) => i.group))]
  return (
    <div className="space-y-4 p-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocks..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
      {groups.map((g) => (
        <div key={g}>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g}</h4>
          <div className="grid grid-cols-3 gap-2">
            {items.filter((i: Item) => i.group === g).map((i) => (
              <button
                key={i.label}
                draggable
                onDragStart={startDrag(i.make)}
                onDragEnd={endDrag}
                onClick={() => onAdd(i.make())}
                className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1 py-3 text-[11px] text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Ic n={i.icon} className="size-5 text-indigo-500" />
                <span className="text-center leading-tight">{i.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function LayersTab({ root, sel, onSelect }: { root: Node; sel: string | null; onSelect: (id: string) => void }) {
  const row = (n: Node, depth: number): React.ReactNode => (
    <div key={n.id}>
      <button
        onClick={() => onSelect(n.id)}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={'flex w-full items-center gap-2 truncate py-1 pr-2 text-left text-xs ' + (sel === n.id ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600 hover:bg-slate-100')}
      >
        <Ic n={BLOCKS[n.type].icon} className="size-3.5 shrink-0 text-slate-400" />
        <span className="font-medium">{BLOCKS[n.type].label}</span>
        <span className="truncate text-slate-400">{n.p.text ?? ''}</span>
      </button>
      {n.c?.map((k) => row(k, depth + 1))}
    </div>
  )
  return <div className="py-2">{root.c?.length ? root.c.map((k) => row(k, 0)) : <p className="p-3 text-xs text-slate-400">The page is empty.</p>}</div>
}
