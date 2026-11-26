'use client'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'

const SLIDES = ['Capturing Moments,\nCreating Memories', 'Build pages\nthat feel effortless', 'Drag, drop,\nand ship']
export const authField = 'w-full rounded-md border border-transparent bg-slate-100 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white'
export const authLink = 'text-violet-600 underline underline-offset-2 hover:text-violet-500'
export const authButton = 'w-full rounded-md bg-[#6d54b5] py-3 text-[15px] font-medium text-white transition hover:bg-[#7c63c6] disabled:opacity-60'

// Decorative dune scene, drawn inline so the page needs no image file.
const Dunes = () => (
  <svg viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5b44b6" />
        <stop offset="0.5" stopColor="#7e69cf" />
      </linearGradient>
      <linearGradient id="lit" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#756c8a" />
        <stop offset="0.6" stopColor="#3b3254" />
        <stop offset="1" stopColor="#21193a" />
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2f2646" />
        <stop offset="1" stopColor="#191230" />
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.55" stopColor="#140e27" stopOpacity="0" />
        <stop offset="1" stopColor="#140e27" stopOpacity="0.9" />
      </linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
    <rect width="400" height="560" fill="url(#sky)" />
    <g fill="#3d2f8f" opacity="0.55" filter="url(#soft)">
      <ellipse cx="70" cy="190" rx="90" ry="9" />
      <ellipse cx="300" cy="150" rx="70" ry="7" />
      <ellipse cx="150" cy="235" rx="60" ry="6" />
    </g>
    <path d="M0 330 C90 255 170 240 245 232 C300 228 345 258 400 300 L400 560 L0 560Z" fill="url(#lit)" />
    <path d="M245 232 C300 228 345 258 400 300 L400 372 C350 335 310 322 284 335 C255 349 228 290 245 232Z" fill="url(#shade)" opacity="0.9" />
    <path d="M0 405 C110 360 230 365 300 425 C335 455 370 468 400 470 L400 560 L0 560Z" fill="#1b1432" />
    <rect width="400" height="560" fill="url(#fade)" />
  </svg>
)

export const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

export function PasswordField({ name, autoComplete, placeholder }: { name: string; autoComplete: string; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} className={authField + ' pr-12'} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
        <Eye off={show} />
      </button>
    </div>
  )
}

export function Check({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input name={name} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-slate-200 text-transparent transition peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400">
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
      </span>
      {children}
    </label>
  )
}

// The card shared by login and register: dune picture on the left, the form (children) on the right.
export default function AuthShell({ children }: { children: ReactNode }) {
  const [slide, setSlide] = useState(0)
  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl shadow-slate-400/30 ring-1 ring-slate-200 md:grid-cols-2 md:gap-4 md:p-4">
      <aside className="relative hidden min-h-[560px] overflow-hidden rounded-xl md:block">
        <Dunes />
        <div className="relative flex items-center justify-between p-6 text-white">
          <span className="text-2xl font-semibold tracking-[0.18em]">SHINSPACE</span>
          <Link href="/" className="rounded-full bg-white/15 px-4 py-1.5 text-sm backdrop-blur transition hover:bg-white/25">Back to website →</Link>
        </div>
        <div className="absolute inset-x-0 bottom-10 text-center text-white">
          <p className="whitespace-pre-line px-6 text-[26px] font-light leading-tight">{SLIDES[slide]}</p>
          <div className="mt-8 flex justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={'h-1 rounded-full transition-all ' + (i === slide ? 'w-10 bg-white' : 'w-7 bg-white/35 hover:bg-white/55')} />
            ))}
          </div>
        </div>
      </aside>
      <section className="flex items-center px-4 py-10 sm:px-10 md:px-8">{children}</section>
    </div>
  )
}
