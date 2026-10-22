// ============================================================================
// NEW — "Pay Rent / Pay Bills" section (frontend-only).
//
// Added to the existing CLASPCONSTRUCTION site. It does NOT touch your backend,
// database or API: the whole checkout runs in the browser through Paystack
// Inline (https://js.paystack.co/v1/inline.js) and the receipt is generated
// client-side after Paystack reports success.
//
// Styling reuses the site's existing classes (.section-pad, .eyebrow,
// .display-heading, .button, .button-gold) so it matches the current theme.
// ============================================================================

import { useRef, useState } from 'react'
import './PayRentPayBills.css'

// --- Paystack PUBLIC key (safe to show in the browser) --------------------
// TODO: replace 'pk_test_xxxxxxxx' with your real publishable test key.
// NEVER put a sk_test_/sk_live_ secret key here.
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxx'

// --- Paystack Inline script ------------------------------------------------
const PAYSTACK_SCRIPT = 'https://js.paystack.co/v1/inline.js'

// --- What the tenant can choose to pay for --------------------------------
const PAYMENT_TYPES = [
  { id: 'rent', label: 'House Rent' },
  { id: 'security', label: 'Security Fee' },
  { id: 'waste', label: 'Waste Bill' },
  { id: 'water', label: 'Water Bill' },
  { id: 'cda_levy', label: 'CDA Levy' },
]

/** Load Paystack Inline once and reuse it on later payments. */
function loadPaystackInline() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT}"]`)
    const fail = () => reject(new Error('Could not load Paystack. Check your internet connection.'))
    const done = () => (window.PaystackPop ? resolve(window.PaystackPop) : fail())

    if (existing) {
      existing.addEventListener('load', done)
      existing.addEventListener('error', fail)
      return
    }

    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT
    script.async = true
    script.onload = done
    script.onerror = fail
    document.head.appendChild(script)
  })
}

/** Client-side reference returned by Paystack. */
const newReceiptNo = () =>
  `BS/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 899999)}`

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export default function PayRentPayBills() {
  const [form, setForm] = useState({
    type: 'rent',
    amount: '',
    email: '',
    houseNo: '',
  })
  // idle | opening | success
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null) // { kind: 'error' | 'success' | 'info', text }
  const [receipt, setReceipt] = useState(null)

  // Paystack also fires onClose() after a successful charge, so we flag
  // success first and ignore that trailing close event.
  const paidRef = useRef(false)

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const reset = () => {
    setStatus('idle')
    setMessage(null)
    setReceipt(null)
    paidRef.current = false
  }

  const handlePay = async (event) => {
    event.preventDefault()
    setMessage(null)
    setReceipt(null)
    paidRef.current = false

    // --- basic client-side validation -----------------------------------
    const amount = Number(form.amount)
    if (!form.type) return setMessage({ kind: 'error', text: 'Select a payment type.' })
    if (!form.amount || !Number.isFinite(amount) || amount <= 0)
      return setMessage({ kind: 'error', text: 'Enter a valid amount.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setMessage({ kind: 'error', text: 'Enter a valid email address.' })
    if (!form.houseNo.trim())
      return setMessage({ kind: 'error', text: 'Enter your house / flat number.' })

    const typeLabel = PAYMENT_TYPES.find((item) => item.id === form.type)?.label || form.type

    setStatus('opening')
    try {
      const PaystackPop = await loadPaystackInline()

      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: form.email.trim(),
        amount: Math.round(amount * 100), // ₦ → kobo (Paystack expects kobo)
        currency: 'NGN',
        metadata: {
          paymentType: typeLabel,
          houseNo: form.houseNo.trim(),
          source: 'claspconstruction-website',
        },

        // --- Payment completed ------------------------------------------
        onSuccess: (transaction) => {
          paidRef.current = true
          const reference = transaction?.reference || '—'
          const receiptNo = newReceiptNo()

          setReceipt({
            receiptNo,
            reference,
            type: typeLabel,
            amount,
            email: form.email.trim(),
            houseNo: form.houseNo.trim(),
            paidAt: new Date(),
          })
          setStatus('success')
          setMessage({
            kind: 'success',
            text: `Payment of ${naira(amount)} successful. Reference: ${reference}.`,
          })
        },

        // --- Tenant closed the popup without paying ---------------------
        onClose: () => {
          if (paidRef.current) return
          setStatus('idle')
          setMessage({ kind: 'info', text: 'Payment cancelled.' })
        },
      })

      handler.openIframe()
    } catch (error) {
      setStatus('idle')
      setMessage({ kind: 'error', text: error?.message || 'Could not start the payment.' })
    }
  }

  const receiptRows = receipt
    ? [
        ['Receipt No', receipt.receiptNo],
        ['Payment for', receipt.type],
        ['Amount', naira(receipt.amount)],
        ['House / Flat', receipt.houseNo],
        ['Email', receipt.email],
        ['Paid on', receipt.paidAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })],
        ['Reference', receipt.reference],
        ['Status', 'PAID'],
      ]
    : []

  return (
    // NEW SECTION — sits between the quote and the contact section.
    <section className="section-pad pay-section" id="pay">
      <div className="pay-grid">
        {/* ---- Left: heading ------------------------------------------- */}
        <div className="pay-heading">
          <p className="eyebrow">
            <span className="eyebrow-mark" />
            TENANT PAYMENTS
          </p>
          <h2 className="display-heading">
            Pay rent
            <br />
            <em>and estate bills.</em>
          </h2>
          <p className="pay-intro">
            House rent, security, waste, water and the CDA levy — paid securely in Naira through
            Paystack. Choose how you want to pay on the next screen.
          </p>
          <ul className="pay-methods">
            <li>Debit / Credit Card</li>
            <li>Bank Transfer</li>
            <li>USSD</li>
            <li>Bank Deposit</li>
          </ul>
        </div>

        {/* ---- Right: payment form ------------------------------------- */}
        <form className="pay-card" onSubmit={handlePay} noValidate>
          <h3>Pay Rent / Pay Bills</h3>
          <p className="pay-card-sub">Secure checkout powered by Paystack.</p>

          {message && (
            <div className={`pay-alert ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
              {message.text}
            </div>
          )}

          {/* Payment type */}
          <div className="pay-field">
            <label className="pay-label" htmlFor="pay-type">
              Select payment type
            </label>
            <select
              id="pay-type"
              className="pay-select"
              value={form.type}
              onChange={update('type')}
            >
              {PAYMENT_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pay-row">
            {/* Amount */}
            <div className="pay-field">
              <label className="pay-label" htmlFor="pay-amount">
                Amount
              </label>
              <div className="pay-amount-wrap">
                <span className="pay-prefix" aria-hidden="true">₦</span>
                <input
                  id="pay-amount"
                  className="pay-input"
                  type="number"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={update('amount')}
                />
              </div>
            </div>

            {/* House number */}
            <div className="pay-field">
              <label className="pay-label" htmlFor="pay-house">
                House No / Flat
              </label>
              <input
                id="pay-house"
                className="pay-input"
                type="text"
                placeholder="e.g. 12 / B4"
                value={form.houseNo}
                onChange={update('houseNo')}
              />
            </div>
          </div>

          {/* Email (Paystack sends the confirmation here) */}
          <div className="pay-field">
            <label className="pay-label" htmlFor="pay-email">
              Email address
            </label>
            <input
              id="pay-email"
              className="pay-input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
            />
          </div>

          <button
            className="button button-gold pay-submit"
            type="submit"
            disabled={status === 'opening'}
          >
            {status === 'opening' ? 'Opening Paystack…' : 'Pay Now'}
          </button>

          <p className="pay-hint">
            You will choose Card, Transfer or USSD on Paystack&apos;s secure page. This form uses
            Paystack test keys.
          </p>
        </form>
      </div>

      {/* ---- Receipt shown after a successful payment ------------------- */}
      {receipt && (
        <div className="pay-receipt" data-receipt>
          <div className="pay-receipt-head">
            <div className="pay-receipt-brand">
              CLASPCONSTRUCTION <span>·</span> BLUE STONE ESTATE
            </div>
            <p className="pay-receipt-tag">Payment Receipt</p>
          </div>

          {receiptRows.map(([label, value]) => (
            <div className="pay-receipt-line" key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}

          <p className="pay-receipt-stamp">PAYMENT SUCCESSFUL</p>

          <div className="pay-receipt-actions">
            <button className="button button-outline pay-print" type="button" onClick={() => window.print()}>
              Print / Save PDF
            </button>
            <button className="button button-gold" type="button" onClick={reset}>
              Make another payment
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
