import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { ErrorBox, Receipt, Spinner } from '../ui.jsx'

/**
 * Paystack redirects here after checkout: /portal/payments/callback?reference=...
 * The reference is verified against Paystack's API on the server — the URL
 * itself proves nothing.
 */
export default function Callback() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  // Missing reference is a render-time condition, not something to sync in
  // an effect — initialise the state from it directly.
  const [state, setState] = useState(() => (reference ? { phase: 'checking' } : { phase: 'missing' }))
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!reference) return
    api(`/payments/verify?reference=${encodeURIComponent(reference)}`)
      .then((data) => {
        setPayment(data.payment)
        setState({ phase: data.status === 'success' ? 'success' : 'not-success', status: data.status })
      })
      .catch((requestError) => {
        setError(requestError.message)
        setState({ phase: 'error' })
      })
  }, [reference])

  if (state.phase === 'checking') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 className="portal-h1">Confirming your payment…</h1>
        <p className="portal-sub">Please wait while we verify with Paystack.</p>
        <Spinner />
      </div>
    )
  }

  if (state.phase === 'missing' || state.phase === 'error') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 className="portal-h1">Payment confirmation</h1>
        <ErrorBox>
          {error || 'No payment reference was returned from Paystack. If you were debited, the CDA office can confirm it manually.'}
        </ErrorBox>
        <div className="p-row">
          <Link className="p-btn" to="/portal/pay">
            Try again
          </Link>
          <Link className="p-btn ghost" to="/portal/history">
            View payment history
          </Link>
        </div>
      </div>
    )
  }

  if (state.phase === 'success') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 className="portal-h1">Payment successful ✅</h1>
        <p className="portal-sub">Your receipt has been issued and an SMS confirmation sent.</p>
        <Receipt payment={payment} />
        <div className="p-row p-no-print" style={{ marginTop: '1.25rem' }}>
          <Link className="p-btn" to="/portal">
            Back to dashboard
          </Link>
          <Link className="p-btn ghost" to="/portal/history">
            Payment history
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="portal-h1">Payment not completed</h1>
      <ErrorBox>
        Paystack reported status “{state.status}”. You have not been charged, or the payment did
        not complete. You can try again.
      </ErrorBox>
      <div className="p-row">
        <Link className="p-btn" to="/portal/pay">
          Try again
        </Link>
        <Link className="p-btn ghost" to="/portal/history">
          View payment history
        </Link>
      </div>
    </div>
  )
}
