'use client'
// The time in the viewer's own time zone. The server renders it in its zone, so the browser's text replaces it without a warning.
export default function LocalTime({ at }: { at: number }) {
  return <time dateTime={new Date(at).toISOString()} suppressHydrationWarning>{new Date(at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
}
