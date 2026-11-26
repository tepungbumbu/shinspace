'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthShell, { authButton, authField, authLink, Check, PasswordField } from './AuthShell'

export default function LoginCard() {
  const router = useRouter()
  const [remember, setRemember] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('Enter a valid email address.')
    if (!password) return setMsg('Enter your password.')
    setBusy(true)
    setMsg('')
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, remember }) })
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
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">Welcome back</h1>
        <p className="mt-5 text-sm text-slate-500">
          New here? <Link href="/register" className={authLink}>Create an account</Link>
        </p>

        <div className="mt-9 space-y-4">
          <input name="email" type="email" autoComplete="email" placeholder="Email" className={authField} />
          <PasswordField name="password" autoComplete="current-password" placeholder="Enter your password" />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <Check name="remember" checked={remember} onChange={setRemember}>Remember me</Check>
          <Link href="#" className={authLink}>Forgot password?</Link>
        </div>

        {msg && <p role="alert" className="mt-5 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{msg}</p>}

        <button type="submit" disabled={busy} className={authButton + ' mt-8'}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  )
}
