// Browser-side helper for the /api/admin routes: returns the JSON body or throws the server's error message.
export async function call<T>(url: string, method: string, body?: unknown): Promise<T> {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await r.json().catch(() => null)
  if (!r.ok) throw new Error(data?.error ?? `Request failed (${r.status})`)
  return data as T
}
