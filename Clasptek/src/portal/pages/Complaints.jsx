import { useEffect, useState } from 'react'
import { api, formatDate } from '../api.js'
import { ErrorBox, Field, Spinner, StatusPill } from '../ui.jsx'

const CATEGORIES = ['plumbing', 'electrical', 'security', 'waste', 'structural', 'other']

/** Complaints & maintenance: file a ticket, follow the reply thread. */
export default function Complaints() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState({ category: 'other', subject: '', body: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [replies, setReplies] = useState({})
  const [replyText, setReplyText] = useState('')

  const load = () =>
    api('/complaints/mine')
      .then((data) => setItems(data.complaints))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await api('/complaints', { method: 'POST', body: form })
      setForm({ category: 'other', subject: '', body: '' })
      setNotice('Your complaint has been logged. The CDA team will respond here.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (complaint) => {
    const next = expanded === complaint.id ? null : complaint.id
    setExpanded(next)
    if (next && !replies[complaint.id]) {
      try {
        const data = await api(`/complaints/${complaint.id}/replies`)
        setReplies((current) => ({ ...current, [complaint.id]: data.replies }))
      } catch (requestError) {
        setError(requestError.message)
      }
    }
  }

  const sendReply = async (complaintId) => {
    if (!replyText.trim()) return
    setError('')
    try {
      await api(`/complaints/${complaintId}/replies`, { method: 'POST', body: { body: replyText } })
      setReplyText('')
      const data = await api(`/complaints/${complaintId}/replies`)
      setReplies((current) => ({ ...current, [complaintId]: data.replies }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!items && !error) return <Spinner />

  return (
    <div>
      <h1 className="portal-h1">Complaints & maintenance</h1>
      <p className="portal-sub">Report a problem in your house or the estate and follow the fix.</p>

      <ErrorBox>{error}</ErrorBox>
      {notice && <div className="p-success-box">{notice}</div>}

      <div className="p-grid cols-2">
        <form className="p-card" onSubmit={submit}>
          <h3>Log a complaint</h3>
          <Field label="Category">
            <select
              className="p-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <input
              className="p-input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Kitchen tap leaking"
              required
              minLength={3}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="p-textarea"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Describe the problem…"
              required
              minLength={5}
            />
          </Field>
          <button className="p-btn" disabled={busy}>
            {busy ? 'Sending…' : 'Submit complaint'}
          </button>
        </form>

        <div>
          <h3 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>Your tickets</h3>
          {items?.length === 0 && (
            <p className="p-muted">No complaints filed yet.</p>
          )}
          {items?.map((complaint) => (
            <div className={`p-card ${expanded === complaint.id ? 'gold' : ''}`} key={complaint.id} style={{ marginBottom: '0.9rem' }}>
              <div className="p-row" style={{ justifyContent: 'space-between' }}>
                <strong>{complaint.subject}</strong>
                <StatusPill status={complaint.status} />
              </div>
              <p className="p-muted" style={{ margin: '0.35rem 0' }}>
                {complaint.category} · {formatDate(complaint.created_at)}
                {complaint.house_no ? ` · Block ${complaint.block} ${complaint.house_no}` : ''}
              </p>

              <button className="p-btn ghost small" onClick={() => toggle(complaint)}>
                {expanded === complaint.id ? 'Hide thread' : 'View / reply'}
              </button>

              {expanded === complaint.id && (
                <div style={{ marginTop: '0.9rem' }}>
                  <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{complaint.body}</p>
                  <div style={{ borderTop: '1px solid #2b2b2b', paddingTop: '0.7rem' }}>
                    {(replies[complaint.id] || []).map((reply) => (
                      <div key={reply.id} style={{ marginBottom: '0.6rem' }}>
                        <div className="p-row" style={{ gap: '0.5rem' }}>
                          <strong style={{ fontSize: '14px' }}>{reply.full_name}</strong>
                          <span className="pill neutral">{reply.role.replace('_', ' ')}</span>
                          <span className="p-muted" style={{ fontSize: '14px' }}>
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '14px' }}>{reply.body}</p>
                      </div>
                    ))}
                    {(replies[complaint.id] || []).length === 0 && (
                      <p className="p-muted">No replies yet.</p>
                    )}
                  </div>
                  <div className="p-row" style={{ marginTop: '0.6rem' }}>
                    <input
                      className="p-input"
                      style={{ flex: 1, minWidth: 200 }}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply…"
                    />
                    <button className="p-btn small" onClick={() => sendReply(complaint.id)}>
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
