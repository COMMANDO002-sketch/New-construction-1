import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, goToCheckout, naira } from '../api.js'
import { ErrorBox, Field, Spinner } from '../ui.jsx'

/**
 * Pay Rent / Pay Bills.
 * The amount is resolved SERVER-side from the house or bill type — the
 * browser only chooses WHAT to pay, never how much.
 */
export default function Pay() {
  const [searchParams] = useSearchParams()
  const [dues, setDues] = useState(null)
  const [methods, setMethods] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api('/me/dues'), api('/payments/methods')])
      .then(([dueItems, methodList]) => {
        setDues(dueItems.items)
        setMethods(methodList.methods)
        const type = searchParams.get('type')
        const billId = Number(searchParams.get('bill'))
        const preset =
          type === 'bill' && billId
            ? dueItems.items.find((item) => item.billTypeId === billId)
            : type === 'rent'
              ? dueItems.items.find((item) => item.kind === 'rent')
              : null
        const fallback = dueItems.items.find((item) => !item.paid) || dueItems.items[0]
        setSelected(preset || fallback || null)
      })
      .catch((requestError) => setError(requestError.message))
  }, [searchParams])

  const selectItem = (event) => {
    const key = event.target.value
    const item = dues.find((entry) =>
      entry.kind === 'rent' ? key === 'rent' : String(entry.billTypeId) === key,
    )
    setSelected(item)
  }

  const selectedKey = useMemo(
    () => (selected ? (selected.kind === 'rent' ? 'rent' : String(selected.billTypeId)) : ''),
    [selected],
  )

  const pay = async () => {
    if (!selected) return
    setError('')
    setBusy(true)
    try {
      const payload =
        selected.kind === 'rent'
          ? { category: 'rent' }
          : { category: 'bill', billTypeId: selected.billTypeId }
      const data = await api('/payments/initialize', { method: 'POST', body: payload })
      goToCheckout(data.authorizationUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  if (!dues && !error) return <Spinner />

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="portal-h1">Make a payment</h1>
      <p className="portal-sub">Rent and estate bills — card, bank transfer or USSD via Paystack.</p>

      <ErrorBox>{error}</ErrorBox>

      <div className="p-card">
        <Field label="What are you paying for?">
          <select className="p-select" value={selectedKey} onChange={selectItem}>
            <option value="" disabled>
              Select an item
            </option>
            {(dues || []).map((item) => (
              <option
                key={`${item.kind}-${item.billTypeId || 'rent'}`}
                value={item.kind === 'rent' ? 'rent' : String(item.billTypeId)}
              >
                {item.name} — {naira(item.amount)} {item.paid ? '(paid ✓)' : ''}
              </option>
            ))}
          </select>
        </Field>

        {selected && (
          <div className="p-card gold" style={{ marginBottom: '1rem' }}>
            <p className="p-muted" style={{ margin: 0 }}>
              {selected.name}
            </p>
            <div className="p-stat">{naira(selected.amount)}</div>
            <p className="p-muted" style={{ margin: '0.4rem 0 0' }}>
              {selected.paid
                ? 'Already paid for this period — you can still pay again if needed.'
                : 'You will be redirected to Paystack to choose how to pay.'}
            </p>
          </div>
        )}

        <button className="p-btn" style={{ width: '100%' }} disabled={!selected || busy} onClick={pay}>
          {busy ? 'Opening Paystack…' : `Pay ${selected ? naira(selected.amount) : ''} with Paystack`}
        </button>
      </div>

      <div className="p-card" style={{ marginTop: '1rem' }}>
        <h3>Payment options</h3>
        <div className="p-row">
          {methods.map((method) => (
            <span className="pill neutral" key={method.code}>
              {method.label}
            </span>
          ))}
        </div>
        <p className="p-muted" style={{ marginBottom: 0 }}>
          Payments are processed by Paystack. A receipt is issued automatically once your payment
          is confirmed. Paid cash or direct transfer instead? The CDA office records it for you.
        </p>
      </div>

      <p className="p-muted" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Link to="/portal" style={{ color: 'var(--gold-light)' }}>
          ← Back to dashboard
        </Link>
      </p>
    </div>
  )
}
