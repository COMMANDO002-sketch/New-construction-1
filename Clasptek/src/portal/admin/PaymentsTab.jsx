import { useEffect, useState } from 'react'
import { api, downloadFile, formatDate, naira } from '../api.js'
import { ErrorBox, Field, Spinner, StatusPill } from '../ui.jsx'

const CHANNELS = ['bank_transfer', 'cash', 'pos', 'other']

/** Payment ledger: online + offline payments, manual confirmation, receipts. */
export default function PaymentsTab() {
  const [payments, setPayments] = useState(null)
  const [users, setUsers] = useState([])
  const [bills, setBills] = useState([])
  const [filters, setFilters] = useState({ status: '', category: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    userId: '',
    category: 'bill',
    billTypeId: '',
    amount: '',
    period: '',
    channel: 'cash',
  })

  const load = (nextFilters = filters) => {
    const params = new URLSearchParams(
      Object.entries(nextFilters).filter(([, value]) => value),
    ).toString()
    return api(`/admin/payments${params ? `?${params}` : ''}`)
      .then((data) => setPayments(data.payments))
      .catch((requestError) => setError(requestError.message))
  }

  useEffect(() => {
    load()
    api('/admin/users?role=tenant')
      .then((data) => setUsers(data.users))
      .catch(() => {})
    api('/bills?all=true')
      .then((data) => setBills(data.bills))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFilter = (key) => (event) => {
    const next = { ...filters, [key]: event.target.value }
    setFilters(next)
    load(next)
  }

  const confirmPayment = async (id, channel) => {
    setError('')
    setNotice('')
    try {
      await api(`/admin/payments/${id}/confirm`, { method: 'POST', body: { channel } })
      setNotice('Payment confirmed and receipt issued.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const recordOffline = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      const created = await api('/admin/payments', {
        method: 'POST',
        body: {
          userId: Number(form.userId),
          category: form.category,
          billTypeId: form.category === 'bill' ? Number(form.billTypeId) : undefined,
          amount: Number(form.amount),
          period: form.period || undefined,
          channel: form.channel,
        },
      })
      setNotice(`Payment recorded — receipt ${created.payment.receipt_no}.`)
      setForm({ userId: '', category: 'bill', billTypeId: '', amount: '', period: '', channel: 'cash' })
      setShowForm(false)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const download = async (which) => {
    setError('')
    try {
      const year = new Date().getFullYear()
      if (which === 'payments') {
        await downloadFile('/reports/payments.xlsx', `claspconstruction-payments-${year}.xlsx`)
      } else {
        await downloadFile('/reports/defaulters.xlsx', `claspconstruction-defaulters-${year}.xlsx`)
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!payments && !error) return <Spinner />

  return (
    <div>
      <ErrorBox>{error}</ErrorBox>
      {notice && <div className="p-success-box">{notice}</div>}

      <div className="p-row" style={{ marginBottom: '1rem' }}>
        <select className="p-select" style={{ width: 'auto' }} value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="abandoned">Abandoned</option>
        </select>
        <select className="p-select" style={{ width: 'auto' }} value={filters.category} onChange={setFilter('category')}>
          <option value="">All categories</option>
          <option value="rent">Rent</option>
          <option value="bill">Bills</option>
        </select>
        <button className="p-btn small" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close form' : 'Record offline payment'}
        </button>
        <button className="p-btn ghost small" onClick={() => download('payments')}>
          ⬇ Payments Excel
        </button>
        <button className="p-btn ghost small" onClick={() => download('defaulters')}>
          ⬇ Defaulters Excel
        </button>
      </div>

      {showForm && (
        <form className="p-card gold" onSubmit={recordOffline} style={{ marginBottom: '1rem' }}>
          <h3>Record cash / direct transfer</h3>
          <div className="p-grid cols-2" style={{ gap: '0.75rem' }}>
            <Field label="Tenant">
              <select
                className="p-select"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                required
              >
                <option value="">Select tenant…</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} {user.house_no ? `— Block ${user.block} ${user.house_no}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className="p-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="rent">Rent</option>
                <option value="bill">Bill</option>
              </select>
            </Field>
            {form.category === 'bill' && (
              <Field label="Bill type">
                <select
                  className="p-select"
                  value={form.billTypeId}
                  onChange={(e) => setForm({ ...form, billTypeId: e.target.value })}
                  required
                >
                  <option value="">Select bill…</option>
                  {bills.filter((bill) => bill.is_active).map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {bill.name} — {naira(bill.amount)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Amount (₦)">
              <input
                className="p-input"
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </Field>
            <Field label="Period (optional — 2026 or 2026-10)">
              <input
                className="p-input"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="defaults to now"
              />
            </Field>
            <Field label="Channel">
              <select
                className="p-select"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button className="p-btn">Record payment & issue receipt</button>
        </form>
      )}

      <div className="p-table-wrap">
        <table className="p-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Tenant / House</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Receipt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDate(payment.paid_at || payment.created_at)}</td>
                <td>
                  {payment.tenant_name}
                  <div className="p-muted" style={{ fontSize: '0.78rem' }}>
                    {payment.block ? `Block ${payment.block} — ${payment.house_no}` : 'no house'}
                  </div>
                </td>
                <td>
                  {payment.description}
                  <div className="p-muted" style={{ fontSize: '0.78rem' }}>
                    {(payment.channel || '—').replace(/_/g, ' ')}
                  </div>
                </td>
                <td>{naira(payment.amount)}</td>
                <td>
                  <StatusPill status={payment.status} />
                </td>
                <td>{payment.receipt_no || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {payment.status === 'pending' && (
                    <select
                      className="p-select"
                      style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                      defaultValue="bank_transfer"
                      onChange={(e) => confirmPayment(payment.id, e.target.value)}
                    >
                      {CHANNELS.map((channel) => (
                        <option key={channel} value={channel}>
                          confirm · {channel.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
