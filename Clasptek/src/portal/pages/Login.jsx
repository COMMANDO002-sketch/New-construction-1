import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { ErrorBox, Field } from '../ui.jsx'

export default function Login() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/portal" replace />
  }

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.identifier, form.password)
      } else {
        await register({ fullName: form.fullName, phone: form.identifier, password: form.password })
      }
      navigate('/portal', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <h1 className="portal-h1">Blue Stone Estate</h1>
      <p className="portal-sub">Tenant & CDA portal — pay rent, bills and stay updated.</p>

      <div className="p-tabs">
        <button
          type="button"
          className={`p-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`p-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          Create account
        </button>
      </div>

      <form className="p-card" onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>

        {mode === 'register' && (
          <Field label="Full name">
            <input
              className="p-input"
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="e.g. Chinedu Okafor"
              required
              minLength={2}
            />
          </Field>
        )}

        <Field label={mode === 'login' ? 'Phone number or email' : 'Phone number'}>
          <input
            className="p-input"
            value={form.identifier}
            onChange={update('identifier')}
            placeholder="0803 123 4567"
            required
            autoComplete="username"
          />
        </Field>

        <Field label="Password">
          <input
            className="p-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Field>

        <button className="p-btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="p-muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
          {mode === 'register'
            ? 'After registering, the CDA office links your block & house number to your account.'
            : 'Your phone number is your username. Trouble signing in? Call the CDA office.'}
        </p>
      </form>

      <p className="p-muted" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Link to="/" style={{ color: 'var(--gold-light)' }}>
          ← Back to website
        </Link>
      </p>
    </div>
  )
}
