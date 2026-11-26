import { ICONS } from '@/lib/icons'

export const Ic = ({ n, className = 'size-4' }: { n: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={ICONS[n]} />
  </svg>
)
