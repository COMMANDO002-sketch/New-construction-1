import { useEffect, useState } from 'react'
import { api, formatDate } from '../api.js'
import { ErrorBox, Spinner, StatusPill } from '../ui.jsx'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

/** Complaint triage: assign status, reply to tenants. */
export default function ComplaintsTab() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [replies, setReplies] = useState({})
  const [replyText, setReplyText] = useState('')

  const load = () =>
    api('/complaints')
      .then((data) => setItems(data.complaints))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    load()
  }, [])

  const changeStatus = async (id, status) => {
    setError('')
    try {
      await api(`/complaints/${id}`, { method: 'PATCH', body: { status } })
      await load()
    } catch (requestError) {
      setError(requestError.message)
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
      <ErrorBox>{error}</ErrorBox>

      {items?.length === 0 && <p className="p-muted">No complaints from tenants right now.</p>}

      {items?.map((complaint) => (
        <div className="p-card" key={complaint.id} style={{ marginBottom: '0.9rem' }}>
          <div className="p-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{complaint.subject}</strong>
              <div className="p-muted" style={{ fontSize: '14px' }}>
                {complaint.tenant_name} · {complaint.tenant_phone} ·{' '}
                {complaint.house_no ? `Block ${complaint.block} ${complaint.house_no}` : 'no house'} ·{' '}
                {complaint.category} · {formatDate(complaint.created_at)}
              </div>
            </div>
            <StatusPill status={complaint.status} />
          </div>

          <div className="p-row" style={{ marginTop: '0.7rem' }}>
            <select
              className="p-select"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '14px' }}
              value={complaint.status}
              onChange={(e) => changeStatus(complaint.id, e.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            <button className="p-btn ghost small" onClick={() => toggle(complaint)}>
              {expanded === complaint.id ? 'Hide thread' : 'Open thread'}
            </button>
          </div>

          {expanded === complaint.id && (
            <div style={{ marginTop: '0.8rem', borderTop: '1px solid #2b2b2b', paddingTop: '0.7rem' }}>
              <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{complaint.body}</p>
              {(replies[complaint.id] || []).map((reply) => (
                <div key={reply.id} style={{ marginBottom: '0.55rem' }}>
                  <div className="p-row" style={{ gap: '0.5rem' }}>
                    <strong style={{ fontSize: '14px' }}>{reply.full_name}</strong>
                    <span className="pill neutral">{reply.role.replace('_', ' ')}</span>
                    <span className="p-muted" style={{ fontSize: '14px' }}>
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '14px' }}>{reply.body}</p>
                </div>
              ))}
              <div className="p-row" style={{ marginTop: '0.6rem' }}>
                <input
                  className="p-input"
                  style={{ flex: 1, minWidth: 200 }}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to tenant…"
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
  )
}
