'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthShell, { authButton, authField, authLink, Check, PasswordField } from './AuthShell'

export default function RegisterCard() {
  const router = useRouter()
  const [agree, setAgree] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = [f.get('first'), f.get('last')].map((x) => String(x ?? '').trim()).filter(Boolean).join(' ')
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    if (!name) return setMsg('Enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('Enter a valid email address.')
    if (password.length < 8) return setMsg('Your password needs at least 8 characters.')
    if (!agree) return setMsg('Please accept the Terms & Conditions.')
    setBusy(true)
    setMsg('')
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      if (r.ok) return router.push('/dashboard')
      setMsg((await r.json().catch(() => null))?.error ?? 'Something went wrong. Try again.')
    } catch {
      setMsg('Could not reach the server. Try again.')
    }
    setBusy(false)
  }

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate className="mx-auto w-full max-w-sm text-slate-900">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">Create an account</h1>
        <p className="mt-5 text-sm text-slate-500">
          Already have an account? <Link href="/login" className={authLink}>Log in</Link>
        </p>

        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="first" autoComplete="given-name" placeholder="First name" className={authField} />
            <input name="last" autoComplete="family-name" placeholder="Last name" className={authField} />
          </div>
          <input name="email" type="email" autoComplete="email" placeholder="Email" className={authField} />
          <PasswordField name="password" autoComplete="new-password" placeholder="Choose a password (8+ characters)" />
        </div>

        <div className="mt-4 text-xs text-slate-600">
          <Check name="agree" checked={agree} onChange={setAgree}>
            <span>I agree to the <Link href="#" className={authLink}>Terms &amp; Conditions</Link></span>
          </Check>
        </div>

        {msg && <p role="alert" className="mt-5 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{msg}</p>}

        <button type="submit" disabled={busy} className={authButton + ' mt-8'}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  )
}
