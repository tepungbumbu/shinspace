// Small hand-drawn SVG/HTML charts for the admin overview (no chart library). All are server-renderable.
const ORANGE = '#f26522'
const TEAL = '#0e4f5c'

export const Card = ({ title, icon, right, children, className = '' }: { title?: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={'rounded-xl border border-slate-200 bg-white p-5 ' + className}>
    {title && (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">{icon}{title}</h2>
        {right}
      </div>
    )}
    {children}
  </section>
)

// the little trend line inside a stat card
export function Spark({ values, color = ORANGE, kind = 'area' }: { values: number[]; color?: string; kind?: 'area' | 'bars' }) {
  const w = 120, h = 44
  const max = Math.max(1, ...values)
  const step = w / Math.max(1, values.length - (kind === 'bars' ? 0 : 1))
  if (kind === 'bars') {
    const bw = Math.max(2, step * 0.55)
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-28" aria-hidden>
        {values.map((v, i) => <rect key={i} x={i * step} y={h - Math.max(2, (v / max) * h)} width={bw} height={Math.max(2, (v / max) * h)} rx="1" fill={color} opacity={v ? 0.9 : 0.25} />)}
      </svg>
    )
  }
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 8)).toFixed(1)}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-28" aria-hidden>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={color} opacity="0.18" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Stat({ label, value, caption, icon, spark }: { label: string; value: number | string; caption: string; icon: React.ReactNode; spark?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between text-sm text-slate-500">
        {label}
        <span className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-slate-500">{icon}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <div className="text-3xl font-semibold leading-none">{value}</div>
          <div className="mt-2 text-xs text-slate-400">{caption}</div>
        </div>
        {spark}
      </div>
    </section>
  )
}

// vertical bars on a pale track; the biggest one is dark, the smallest highlighted, like the reference
export function Bars({ items, unit = '' }: { items: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const min = Math.min(...items.map((i) => i.value))
  return (
    <div className="flex items-end gap-3" role="img" aria-label="Bar chart">
      {items.map((it, i) => {
        const pct = Math.max(12, (it.value / max) * 100)
        const low = items.length > 2 && it.value === min && i === items.map((x) => x.value).lastIndexOf(min)
        return (
          <div key={it.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-slate-100">
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-center rounded-2xl pb-2 text-xs font-semibold text-white" style={{ height: `${pct}%`, background: low ? ORANGE : TEAL }}>
                {it.value}{unit}
              </div>
            </div>
            <div className="w-full truncate text-center text-xs text-slate-500" title={it.label}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// two or more series over the same labels, with hover tooltips (native <title>)
export function Area({ labels, series }: { labels: string[]; series: { name: string; color: string; values: number[] }[] }) {
  const W = 760, H = 240, L = 34, R = 26, T = 12, B = 28
  const max = Math.max(4, ...series.flatMap((s) => s.values))
  const top = Math.ceil(max / 4) * 4
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, labels.length - 1)
  const y = (v: number) => T + (1 - v / top) * (H - T - B)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Activity over the last days">
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y((top * k) / 4)} y2={y((top * k) / 4)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={L - 8} y={y((top * k) / 4) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{Math.round((top * k) / 4)}</text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
          return (
            <g key={s.name}>
              <polygon points={`${x(0)},${y(0)} ${pts.join(' ')} ${x(s.values.length - 1)},${y(0)}`} fill={s.color} opacity="0.14" />
              <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="#fff" stroke={s.color} strokeWidth="2"><title>{`${s.name}: ${v} · ${labels[i]}`}</title></circle>
              ))}
            </g>
          )
        })}
        {labels.map((l, i) => (i % 2 === 0 || i === labels.length - 1) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">{l}</text>)}
      </svg>
      <div className="mt-2 flex gap-5 text-xs text-slate-500">
        {series.map((s) => <span key={s.name} className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
      </div>
    </div>
  )
}

export function Stacked({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0))
  return (
    <div>
      <div className="flex h-6 w-full gap-1" role="img" aria-label="Role distribution">
        {parts.filter((p) => p.value > 0).map((p) => <div key={p.label} className="h-full rounded-full" style={{ width: `${(p.value / total) * 100}%`, background: p.color, minWidth: 10 }} title={`${p.label}: ${p.value}`} />)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        {parts.map((p) => (
          <div key={p.label}>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><i className="size-2.5 rounded-sm" style={{ background: p.color }} />{p.label}</div>
            <div className="mt-0.5 text-lg font-semibold">{p.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// always 12 dots, lit in proportion to on/total
export function Dots({ on, total }: { on: number; total: number }) {
  const lit = Math.round((on / Math.max(1, total)) * 12)
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => <i key={i} className="size-4 rounded-full" style={{ background: i < lit ? ORANGE : '#e2e8f0' }} />)}
    </div>
  )
}
