// Pages built before accounts existed lived in this browser's localStorage. Read them so they can be imported.
import type { Node } from './tree'

export type LegacyPage = { name: string; root: Node }

const read = <T>(k: string): T | null => {
  try {
    const s = localStorage.getItem(k)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export function readLegacy(): { pages: LegacyPage[]; keys: string[] } {
  const keys: string[] = []
  const pages: LegacyPage[] = []
  const index = read<{ id: string; name: string }[]>('detik:pages')
  if (index) keys.push('detik:pages')
  for (const m of index ?? []) {
    const root = read<Node>(`detik:page:${m.id}`)
    keys.push(`detik:page:${m.id}`)
    if (root?.c?.length) pages.push({ name: m.name, root }) // an empty page is not worth importing
  }
  const single = read<Node>('pageflow:v1')
  if (single) keys.push('pageflow:v1')
  if (single?.c?.length && !index) pages.push({ name: 'My first page', root: single })
  return { pages, keys }
}

export const clearLegacy = (keys: string[]) => keys.forEach((k) => { try { localStorage.removeItem(k) } catch {} })
