import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, naira } from '../api.js'
import { ErrorBox, Modal, Receipt, Spinner, StatusPill } from '../ui.jsx'

/** Payment history with printable receipts. */
export default function History() {
  const [payments, setPayments] = useState(null)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    api('/me/payments')
      .then((data) => setPayments(data.payments))
      .catch((requestError) => setError(requestError.message))
  }, [])

  const openReceipt = async (payment) => {
    try {
      const data = await api(`/me/payments/${payment.id}`)
      setReceipt(data.payment)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!payments && !error) return <Spinner />

  return (
    <div>
      <h1 className="portal-h1">Payment history</h1>
      <p className="portal-sub">Every rent and bill payment on your account, with receipts.</p>

      <ErrorBox>{error}</ErrorBox>

      {payments?.length === 0 && (
        <div className="p-card">
          <p className="p-muted" style={{ margin: 0 }}>
            No payments yet.{' '}
            <Link to="/portal/pay" style={{ color: 'var(--gold-light)' }}>
              Make your first payment →
            </Link>
          </p>
        </div>
      )}

      {payments?.length > 0 && (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead>
              <tr>
                <th>Date</th>
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
                    {payment.description}
                    <div className="p-muted" style={{ fontSize: '14px' }}>
                      {(payment.channel || payment.category).replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td>{naira(payment.amount)}</td>
                  <td>
                    <StatusPill status={payment.status} />
                  </td>
                  <td>{payment.receipt_no || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {payment.status === 'success' && (
                      <button className="p-btn ghost small" onClick={() => openReceipt(payment)}>
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title="Receipt">
        <Receipt payment={receipt} />
      </Modal>
    </div>
  )
}
