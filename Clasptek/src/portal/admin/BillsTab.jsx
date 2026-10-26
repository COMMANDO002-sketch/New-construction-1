import { useEffect, useState } from 'react'
import { api, naira } from '../api.js'
import { ErrorBox, Field, Spinner } from '../ui.jsx'

/** Bill pricing management: edit amounts, add bills, archive old ones. */
export default function BillsTab() {
  const [bills, setBills] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', description: '', amount: '', frequency: 'monthly' })

  const load = () =>
    api('/bills?all=true')
      .then((data) => setBills(data.bills))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    load()
  }, [])

  const create = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api('/bills', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description,
          amount: Number(form.amount),
          frequency: form.frequency,
        },
      })
      setForm({ name: '', description: '', amount: '', frequency: 'monthly' })
      setNotice('Bill type created.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const saveAmount = async (bill, amount) => {
    setError('')
    try {
      await api(`/bills/${bill.id}`, { method: 'PATCH', body: { amount: Number(amount) } })
      setNotice(`${bill.name} pricing updated.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleActive = async (bill) => {
    setError('')
    try {
      await api(`/bills/${bill.id}`, { method: 'PATCH', body: { isActive: !bill.is_active } })
      setNotice(bill.is_active ? `${bill.name} archived.` : `${bill.name} restored.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!bills && !error) return <Spinner />

  return (
    <div className="p-grid cols-2" style={{ alignItems: 'start' }}>
      <form className="p-card gold" onSubmit={create}>
        <h3>Add a bill type</h3>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Name">
          <input
            className="p-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Street Light Levy"
            required
            minLength={2}
          />
        </Field>
        <Field label="Description">
          <input
            className="p-input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is it for?"
          />
        </Field>
        <div className="p-grid cols-2" style={{ gap: '0.75rem' }}>
          <Field label="Amount (₦)">
            <input
              className="p-input"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </Field>
          <Field label="Frequency">
            <select
              className="p-select"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              <option value="monthly">monthly</option>
              <option value="quarterly">quarterly</option>
              <option value="annual">annual</option>
              <option value="one_off">one off</option>
            </select>
          </Field>
        </div>
        <button className="p-btn">Create bill type</button>
      </form>

      <div>
        {notice && <div className="p-success-box">{notice}</div>}

        <h3 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>Current pricing</h3>
        {bills?.map((bill) => (
          <div className={`p-card ${bill.is_active ? '' : ''}`} key={bill.id} style={{ marginBottom: '0.8rem', opacity: bill.is_active ? 1 : 0.6 }}>
            <div className="p-row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{bill.name}</strong>
                <div className="p-muted" style={{ fontSize: '14px' }}>
                  {bill.description || '—'} · {bill.frequency.replace('_', ' ')}
                </div>
              </div>
              {bill.is_active ? <span className="pill success">active</span> : <span className="pill failed">archived</span>}
            </div>
            <div className="p-row" style={{ marginTop: '0.7rem' }}>
              <input
                className="p-input"
                style={{ width: 140, padding: '0.4rem 0.7rem' }}
                type="number"
                min="0"
                defaultValue={Number(bill.amount)}
                onBlur={(e) => {
                  if (Number(e.target.value) !== Number(bill.amount)) saveAmount(bill, e.target.value)
                }}
              />
              <span className="p-muted">₦ — type a new price and click away to save</span>
              <button className="p-btn ghost small" onClick={() => toggleActive(bill)}>
                {bill.is_active ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        ))}

        <p className="p-muted">
          Archived bills disappear from the tenant payment screen but past receipts keep their
          history. Totals: {naira(bills?.filter((bill) => bill.is_active).reduce((sum, bill) => sum + Number(bill.amount), 0))}/month
          in active bills.
        </p>
      </div>
    </div>
  )
}
