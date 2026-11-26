// The page is a tree of nodes. Every operation is immutable so undo is just "keep the old root".
export type Style = Record<string, string>
export type Node = { id: string; type: string; p: Record<string, string>; s: Style; t?: Record<string, string>; c?: Node[] } // t = Tailwind panel utilities
export type Drag = { kind: 'new'; node: Node } | { kind: 'move'; id: string }

// Shared between the palette (drag source) and the canvas (drop target); both live in one JS context.
export const drag: { cur: Drag | null } = { cur: null }

let seq = 0
export const uid = () => 'n' + Date.now().toString(36) + (seq++).toString(36)
export const N = (type: string, p: Record<string, string> = {}, s: Style = {}, c?: Node[]): Node => ({ id: uid(), type, p, s, ...(c ? { c } : {}) })

export const find = (n: Node, id: string): Node | undefined =>
  n.id === id ? n : n.c?.reduce<Node | undefined>((f, k) => f ?? find(k, id), undefined)
export const contains = (n: Node, id: string) => !!find(n, id)
export const parentOf = (n: Node, id: string): Node | undefined =>
  n.c?.some((k) => k.id === id) ? n : n.c?.reduce<Node | undefined>((f, k) => f ?? parentOf(k, id), undefined)

export const update = (n: Node, id: string, fn: (x: Node) => Node): Node =>
  n.id === id ? fn(n) : n.c ? { ...n, c: n.c.map((k) => update(k, id, fn)) } : n
export const remove = (n: Node, id: string): Node =>
  n.c ? { ...n, c: n.c.filter((k) => k.id !== id).map((k) => remove(k, id)) } : n
export const insert = (n: Node, pid: string, i: number, node: Node) =>
  update(n, pid, (p) => ({ ...p, c: [...(p.c ?? []).slice(0, i), node, ...(p.c ?? []).slice(i)] }))
export const clone = (n: Node): Node => ({ ...n, id: uid(), p: { ...n.p }, s: { ...n.s }, t: n.t && { ...n.t }, c: n.c?.map(clone) })

export const move = (root: Node, id: string, pid: string, i: number) => {
  const node = find(root, id)!
  const par = parentOf(root, id)!
  const old = par.c!.findIndex((k) => k.id === id)
  return insert(remove(root, id), pid, par.id === pid && old < i ? i - 1 : i, node)
}
