'use client'
// Is the window phone-sized (below Tailwind's md)? The editors switch panels into drawers and sheets there.
import { useSyncExternalStore } from 'react'

export const MOBILE_QUERY = '(max-width: 767px)'
export const isMobileNow = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(MOBILE_QUERY)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
export const useMobile = () => useSyncExternalStore(subscribe, isMobileNow, () => false)
