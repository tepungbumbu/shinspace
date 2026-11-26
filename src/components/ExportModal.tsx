'use client'
import { useEffect, useState } from 'react'
import { bytes, buildSite, readme, slug, tree, type Site, type SitePage } from '@/lib/exporter'
import { zip } from '@/lib/zip'
import { Ic } from './Ic'

type Built = { others: boolean; site: Site } | { others: boolean; error: string }

export default function ExportModal({ pages, onClose }: { pages: SitePage[]; onClose: () => void }) {
  const [name, setName] = useState('my-site')
  const [others, setOthers] = useState(true)
  const [built, setBuilt] = useState<Built | null>(null)
  const root = slug(name) || 'my-site'

  useEffect(() => {
    let live = true
    buildSite(others ? pages : pages.slice(0, 1))
      .then((site) => live && setBuilt({ others, site }))
      .catch((e) => live && setBuilt({ others, error: String(e) }))
    return () => { live = false }
  }, [others, pages])

  const ready = built && built.others === others ? built : null
  const site = ready && 'site' in ready ? ready.site : null

  const download = () => {
    if (!site) return
    const all = [...site.files, { path: 'README.md', data: readme(name.trim() || root, root, site) }]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zip(all.map((f) => ({ path: `${root}/${f.path}`, data: bytes(f) }))))
    a.download = `${root}.zip`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-4">
          <h2 className="mr-auto text-base font-semibold">Export site</h2>
          <button onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><Ic n="close" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white" />
          </label>

          {pages.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={others} onChange={(e) => setOthers(e.target.checked)} className="size-4 accent-indigo-500" />
              Include the site’s other {pages.length - 1} {pages.length === 2 ? 'page' : 'pages'} in <code className="rounded bg-slate-100 px-1 text-xs">pages/</code>
            </label>
          )}

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500">What you will get</div>
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-200">
              {site ? tree(root, [...site.files.map((f) => f.path), 'README.md']) : ready ? 'Something went wrong while building the site.' : 'Building…'}
            </pre>
            <p className="mt-2 text-xs text-slate-400">
              <code>index.html</code> is the site’s home page. Folders with nothing in them (fonts, icons, scripts) are left out.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          <button
            onClick={download}
            disabled={!site}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
          >
            <Ic n="download" /> Download .zip
          </button>
        </div>
      </div>
    </div>
  )
}
