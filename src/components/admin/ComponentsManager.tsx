'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { call } from '@/lib/admin-api'
import type { Component } from '@/lib/components-db'
import { GROUPS } from '@/lib/sections'
import { Ic } from '../Ic'
import { WireThumb } from '../Wire'

type Filter = 'all' | 'published' | 'draft'
const field = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#f26522] focus:bg-white'
const ago = (t: number) => new Date(t).toLocaleDateString('en', { day: 'numeric', month: 'short' })

// The details of an existing component (everything except its content, which has its own editors).
function Form({ initial, categories, onClose, onSaved }: { initial: Component; categories: string[]; onClose: () => void; onSaved: (c: Component) => void }) {
  const [resetting, setResetting] = useState(false)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [category, setCategory] = useState(initial.category)
  const [sub, setSub] = useState(initial.sub)
  const [fresh, setFresh] = useState('')
  const [published, setPublished] = useState(initial.published)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const all = [...new Set([...categories, category])]
  const chosen = fresh.trim() || category

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      onSaved(await call<Component>(`/api/admin/components/${initial.id}`, 'PATCH', { name, description, category: chosen, sub, published }))
      onClose()
    } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.') }
    setBusy(false)
  }

  const reset = async () => {
    if (!confirm(`Reset “${initial.name}” to the way it shipped? Your edits to its name, text and content are lost.`)) return
    setResetting(true); setErr('')
    try { onSaved(await call<Component>(`/api/admin/components/${initial.id}/reset`, 'POST')); onClose() } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.') }
    setResetting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Component details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Ic n="close" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={field} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Short description (shown in the Sections list)</span><input value={description} onChange={(e) => setDescription(e.target.value)} className={field} /></label>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Category</span>
            <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
              {all.map((c) => (
                <button type="button" key={c} role="radio" aria-checked={!fresh.trim() && category === c} onClick={() => { setCategory(c); setFresh('') }} className={'rounded-full px-3 py-1 text-sm transition ' + (!fresh.trim() && category === c ? 'bg-[#0e4f5c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{c}</button>
              ))}
            </div>
            <input value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder="…or type a new category" maxLength={30} className={field + ' mt-2'} />
          </div>
          <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Sub-heading inside the category (optional, e.g. “Slider”)</span><input value={sub} onChange={(e) => setSub(e.target.value)} maxLength={30} className={field} /></label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" role="switch" checked={published} onChange={(e) => setPublished(e.target.checked)} className="peer sr-only" />
            <span className="relative h-6 w-10 shrink-0 rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-[#f26522] peer-checked:after:translate-x-4" />
            Published <span className="font-normal text-slate-400">(visible to everyone in the Sections tab)</span>
          </label>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">To change what it looks like, use <b>Edit content</b> on its card: the visual editor for blocks, or the code editor.</p>
        </div>
        {err && <p role="alert" className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          {initial.builtin && <button type="button" onClick={reset} disabled={resetting} className="mr-auto rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60">{resetting ? 'Resetting…' : 'Reset to original'}</button>}
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-[#f26522] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d9561a] disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}

// "Edit content" asks how: the visual editor (blocks) or the code editor (HTML, CSS, JS with a live preview).
function EditChoice({ c, onClose }: { c: Component; onClose: () => void }) {
  const isCode = c.html !== null
  const tile = 'group flex flex-col gap-2 rounded-xl border p-4 text-left transition'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div role="dialog" aria-label={`Edit ${c.name}`} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit “{c.name}”</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Ic n="close" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500">How do you want to edit its content?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {isCode ? (
            <div className={tile + ' cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'}>
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500"><Ic n="tBlocks" className="size-5" /></span>
              <span className="font-semibold">Visual editor</span>
              <span className="text-sm text-slate-500">Not available: this component is written as code.</span>
            </div>
          ) : (
            <Link href={`/component-editor/${c.id}`} className={tile + ' border-slate-200 hover:border-[#f26522] hover:bg-orange-50/50'}>
              <span className="flex size-10 items-center justify-center rounded-lg bg-[#f26522]/10 text-[#f26522]"><Ic n="tBlocks" className="size-5" /></span>
              <span className="font-semibold">Visual editor</span>
              <span className="text-sm text-slate-500">Drag and drop blocks, like building a page. Best for layout and text.</span>
            </Link>
          )}
          <Link href={`/component-code/${c.id}`} className={tile + ' border-slate-200 hover:border-[#0e4f5c] hover:bg-teal-50/50'}>
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#0e4f5c]/10 text-[#0e4f5c]"><Ic n="html" className="size-5" /></span>
            <span className="font-semibold">Code editor</span>
            <span className="text-sm text-slate-500">Write HTML, CSS and JavaScript with a live preview, like CodePen.</span>
            {!isCode && <span className="text-xs text-amber-700">Saving there converts this block component to code. “Reset to original” brings the blocks back.</span>}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ComponentsManager({ initial }: { initial: Component[] }) {
  const [items, setItems] = useState(initial)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [cat, setCat] = useState('All')
  const [editing, setEditing] = useState<Component | null>(null)
  const [choosing, setChoosing] = useState<Component | null>(null)
  const [error, setError] = useState('')
  const categories = useMemo(() => [...new Set([...GROUPS, 'Custom', ...items.map((c) => c.category)])], [items])

  const shown = items.filter((c) => (cat === 'All' || c.category === cat) && (filter === 'all' || (filter === 'published' ? c.published : !c.published)) && (c.name + ' ' + c.category + ' ' + c.description).toLowerCase().includes(q.trim().toLowerCase()))
  const inCat = (c: Component) => cat === 'All' || c.category === cat
  const count = (f: Filter) => items.filter((c) => inCat(c) && (f === 'all' ? true : f === 'published' ? c.published : !c.published)).length
  const cats = useMemo(() => [...new Set(items.map((c) => c.category))].sort((a, b) => (categories.indexOf(a) - categories.indexOf(b))), [items, categories])

  const save = (c: Component) => setItems((all) => (all.some((x) => x.id === c.id) ? all.map((x) => (x.id === c.id ? c : x)) : [c, ...all]))
  const toggle = async (c: Component) => {
    setError('')
    try { save(await call<Component>(`/api/admin/components/${c.id}`, 'PATCH', { published: !c.published })) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
  }
  const remove = async (c: Component) => {
    if (!confirm(`Delete “${c.name}”? It disappears from everyone's Sections tab. Pages that already use it keep their copy.`)) return
    setError('')
    try { await call(`/api/admin/components/${c.id}`, 'DELETE'); setItems((all) => all.filter((x) => x.id !== c.id)) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="flex flex-wrap gap-1.5">
          {([['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']] as [Filter, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={'rounded-full px-3.5 py-1.5 text-sm transition ' + (filter === k ? 'bg-[#0e4f5c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{label} <span className="opacity-70">{count(k)}</span></button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search components..." className={field + ' min-w-0 flex-1 sm:!w-56 sm:flex-none'} />
          <Link href="/component-code/new" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#f26522] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d9561a]"><Ic n="layers" className="size-4" /> New component</Link>
        </div>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-3" role="radiogroup" aria-label="Category">
          {['All', ...cats].map((k) => (
            <button key={k} role="radio" aria-checked={cat === k} onClick={() => setCat(k)} className={'rounded-md px-3 py-1 text-sm transition ' + (cat === k ? 'bg-[#f26522]/10 font-semibold text-[#f26522]' : 'text-slate-500 hover:bg-slate-100')}>
              {k} <span className="opacity-60">{k === 'All' ? items.length : items.filter((c) => c.category === k).length}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="m-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-medium">No custom components yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Add a section written in HTML, or open any page in the editor, select a section and use “Save as component”. Published components show up in everyone&apos;s Sections tab.</p>
          <Link href="/component-code/new" className="mt-5 inline-block rounded-lg bg-[#f26522] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d9561a]">Create the first one</Link>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((c) => (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200">
              <button onClick={() => setChoosing(c)} aria-label={`Edit the content of ${c.name}`} className="block border-b border-slate-100 text-left"><WireThumb node={c.node} scale={0.8} h={130} /></button>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{c.name}</h3>
                  <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + (c.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{c.published ? 'Published' : 'Draft'}</span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-500">{c.description || 'No description'}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-400">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{c.category}{c.sub ? ` · ${c.sub}` : ''}</span>
                  <span>{c.builtin ? 'Built-in' : c.html !== null ? 'HTML' : 'Custom'}</span>
                  <span>{ago(c.updated)}{c.author ? ` · ${c.author}` : ''}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                <button onClick={() => toggle(c)} className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">{c.published ? 'Unpublish' : 'Publish'}</button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setChoosing(c)} className="rounded bg-[#f26522]/10 px-2.5 py-1 text-xs font-semibold text-[#f26522] hover:bg-[#f26522]/20">Edit content</button>
                  <button onClick={() => setEditing(c)} className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">Details</button>
                  <button onClick={() => remove(c)} aria-label={`Delete ${c.name}`} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Ic n="del" className="size-4" /></button>
                </div>
              </div>
            </article>
          ))}
          {shown.length === 0 && <p className="col-span-full py-12 text-center text-slate-400">No component matches your filter.</p>}
        </div>
      )}
      {choosing && <EditChoice c={choosing} onClose={() => setChoosing(null)} />}
      {editing && <Form key={editing.id} initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={save} />}
    </section>
  )
}
