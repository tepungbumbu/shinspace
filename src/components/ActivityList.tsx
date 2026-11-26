// A list of activity entries, shared by the profile page (own history) and the admin page (everyone). Server component.
import { ACTIONS, WARN, type Action } from '@/lib/activity-types'
import type { Entry } from '@/lib/activity'
import LocalTime from './LocalTime'

export default function ActivityList({ rows, showWho = false }: { rows: Entry[]; showWho?: boolean }) {
  if (!rows.length) return <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing here yet.</p>
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3 text-sm">
          <span className={'mt-1.5 size-2 shrink-0 rounded-full ' + (WARN.has(r.action) ? 'bg-rose-500' : 'bg-emerald-500')} aria-hidden />
          <div className="min-w-0 flex-1">
            <p>
              {showWho && <span className="font-medium">{r.who} </span>}
              <span className={showWho ? 'text-slate-600' : 'font-medium'}>{showWho ? (ACTIONS[r.action as Action] ?? r.action).toLowerCase() : (ACTIONS[r.action as Action] ?? r.action)}</span>
            </p>
            {r.detail && <p className="mt-0.5 break-words text-slate-500">{r.detail}</p>}
          </div>
          <div className="text-right text-xs text-slate-500">
            <LocalTime at={r.at} />
            <div>{[r.device, r.ip].filter(Boolean).join(' · ')}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
