// Every style choice maps to a literal Tailwind class string, so the compiler sees them all.
// (The canvas compiles Tailwind in the browser, so the per-side spacing classes built from a list work too.)
type Style = { label: string; o: Record<string, string>; names?: Record<string, string>; sw?: Record<string, string> }

export const SPACE = ['0', '1', '2', '4', '6', '8', '12', '16', '24']
const side = (pre: string) => Object.fromEntries(SPACE.map((v) => [v, `${pre}-${v}`]))
const SIDES = { t: 'top', b: 'bottom', l: 'left', r: 'right' }

export const STYLE: Record<string, Style> = {
  align: { label: 'Text alignment', o: { left: 'text-left', center: 'text-center', right: 'text-right' } },
  size: {
    label: 'Text size',
    o: { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '3xl': 'text-2xl md:text-3xl', '4xl': 'text-3xl md:text-4xl', '5xl': 'text-4xl md:text-6xl' },
  },
  color: {
    label: 'Text color',
    o: { dark: 'text-slate-900', slate: 'text-slate-600', soft: 'text-slate-300', white: 'text-white', indigo: 'text-indigo-600', rose: 'text-rose-600', emerald: 'text-emerald-600', amber: 'text-amber-500', sky: 'text-sky-500' },
    sw: { dark: '#0f172a', slate: '#475569', soft: '#cbd5e1', white: '#ffffff', indigo: '#4f46e5', rose: '#e11d48', emerald: '#059669', amber: '#f59e0b', sky: '#0ea5e9' },
  },
  bg: {
    label: 'Background',
    o: { white: 'bg-white', soft: 'bg-slate-50', gray: 'bg-slate-200', dark: 'bg-slate-900', indigo: 'bg-indigo-600', tint: 'bg-indigo-50', rose: 'bg-rose-50', emerald: 'bg-emerald-50', amber: 'bg-amber-400', sky: 'bg-sky-400' },
    sw: { white: '#ffffff', soft: '#f8fafc', gray: '#e2e8f0', dark: '#0f172a', indigo: '#4f46e5', tint: '#eef2ff', rose: '#fff1f2', emerald: '#ecfdf5', amber: '#fbbf24', sky: '#38bdf8' },
  },
  py: { label: 'Vertical space', o: { none: 'py-0', sm: 'py-6', md: 'py-12', lg: 'py-20', xl: 'py-28' } },
  pad: { label: 'Padding', o: { none: 'p-0', sm: 'p-3', md: 'p-6', lg: 'p-10', xl: 'p-16' } },
  rounded: { label: 'Corners', o: { none: 'rounded-none', md: 'rounded-lg', lg: 'rounded-2xl', full: 'rounded-full' }, names: { none: 'Square', md: 'Small', lg: 'Large', full: 'Pill' } },
  shadow: { label: 'Shadow', o: { none: 'shadow-none', md: 'shadow-md', lg: 'shadow-xl' }, names: { none: 'None', md: 'Medium', lg: 'Large' } },
  border: { label: 'Border', o: { on: 'border border-slate-300' } },
  gap: { label: 'Gap', o: { sm: 'gap-4', md: 'gap-8', lg: 'gap-12' }, names: { sm: 'Small', md: 'Medium', lg: 'Large' } },
  items: { label: 'Vertical align', o: { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' } },
  h: { label: 'Height', o: { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' }, names: { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' } },
  isize: { label: 'Icon size', o: { sm: 'size-6', md: 'size-10', lg: 'size-14', xl: 'size-20' }, names: { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' } },
  ...Object.fromEntries(Object.entries(SIDES).map(([k, n]) => [`m${k}`, { label: `Margin ${n}`, o: side(`m${k}`) }])),
  ...Object.fromEntries(Object.entries(SIDES).map(([k, n]) => [`p${k}`, { label: `Padding ${n}`, o: side(`p${k}`) }])),
}

export const sc = (s: Record<string, string>) =>
  Object.entries(s).map(([k, v]) => STYLE[k]?.o[v]).filter(Boolean).join(' ')

// "Show on" breakpoints: the block is hidden only inside the ticked-off range.
export const HIDE: Record<string, string> = {
  xs: 'max-sm:hidden',
  sm: 'sm:max-md:hidden',
  md: 'md:max-lg:hidden',
  lg: 'lg:max-xl:hidden',
  xl: 'xl:max-2xl:hidden',
  xxl: '2xl:hidden',
}
