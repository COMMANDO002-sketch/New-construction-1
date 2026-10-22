import { useEffect } from 'react'

export function Spinner() {
  return <div className="p-spinner" aria-label="Loading" />
}

export function ErrorBox({ children }) {
  if (!children) return null
  return <div className="p-error" role="alert">{children}</div>
}

export function SuccessBox({ children }) {
  if (!children) return null
  return <div className="p-success-box">{children}</div>
}

/** status → pill class used across payments and complaints. */
export function StatusPill({ status }) {
  const map = {
    success: 'success',
    paid: 'success',
    resolved: 'success',
    closed: 'neutral',
    pending: 'pending',
    open: 'pending',
    abandoned: 'failed',
    failed: 'failed',
    in_progress: 'pending',
    general: 'neutral',
    meeting: 'gold',
    dues: 'pending',
    event: 'success',
    alert: 'failed',
  }
  const label = String(status || '').replace(/_/g, ' ')
  return <span className={`pill ${map[status] || 'neutral'}`}>{label}</span>
}

export function Field({ label, children }) {
  return (
    <div className="p-field">
      <label className="p-label">{label}</label>
      {children}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="p-modal-backdrop" onClick={onClose}>
      <div className="p-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="p-row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--serif)', margin: 0 }}>{title}</h3>
          <button className="p-btn ghost small p-no-print" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Printable receipt used by the callback page and payment history. */
export function Receipt({ payment }) {
  if (!payment) return null
  const lines = [
    ['Receipt No', payment.receipt_no || '—'],
    ['Description', payment.description],
    ['Period', payment.period || '—'],
    ['Amount', `₦${Number(payment.amount).toLocaleString('en-NG')}`],
    ['Channel', (payment.channel || '—').replace(/_/g, ' ')],
    ['Status', payment.status],
    ['Paid At', payment.paid_at ? new Date(payment.paid_at).toLocaleString('en-NG') : '—'],
    ['Reference', payment.paystack_reference || 'manual'],
    ['House', payment.block ? `Block ${payment.block} — ${payment.house_no}` : '—'],
    ['Payer', payment.payer_name || '—'],
  ]

  return (
    <div className="p-card gold" data-receipt>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem' }}>
          CLASPCONSTRUCTION <span style={{ color: 'var(--gold)'}}>·</span> BLUE STONE ESTATE
        </div>
        <div className="p-muted">Payment Receipt</div>
      </div>
      {lines.map(([label, value]) => (
        <div className="p-receipt-line" key={label}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
      ))}
      <div className="p-row p-no-print" style={{ marginTop: '1.1rem', justifyContent: 'flex-end' }}>
        <button className="p-btn ghost small" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>
    </div>
  )
}
