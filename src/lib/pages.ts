// Shared page types plus the browser-side client for /api/pages. The server half is lib/pages-db.ts.
import type { Node } from './tree'

export type User = { name: string; email: string }
export type PageMeta = { id: string; name: string; updated: number }
export type PageFull = PageMeta & { root: Node }

async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  // a full page load on purpose: it drops all client state of a signed-out session
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (r.status === 401) { window.location.assign('/login'); throw new Error('Signed out') }
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `Request failed (${r.status})`)
  return r.json()
}

export const createPage = (name: string, root?: Node) => api<PageFull>('/api/pages', 'POST', { name, root })
export const copyPage = (id: string) => api<PageFull>('/api/pages', 'POST', { copyOf: id })
export const fetchPages = () => api<PageFull[]>('/api/pages')
export const renamePage = (id: string, name: string) => api<{ ok: true }>(`/api/pages/${id}`, 'PATCH', { name })
export const saveRoot = (id: string, root: Node) => api<{ ok: true }>(`/api/pages/${id}`, 'PATCH', { root })
export const deletePage = (id: string) => api<{ ok: true }>(`/api/pages/${id}`, 'DELETE')
