import { useEffect, useState } from 'react'
import { api, formatDate } from '../api.js'
import { ErrorBox, Spinner, StatusPill } from '../ui.jsx'

/** CDA Notice Board feed — unread notices float to the top (server-sorted). */
export default function Notices() {
  const [notices, setNotices] = useState(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const load = () =>
    api('/notices')
      .then((data) => setNotices(data.notices))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    load()
  }, [])

  const open = async (notice) => {
    setOpenId(notice.id === openId ? null : notice.id)
    if (!notice.read) {
      try {
        await api(`/notices/${notice.id}/read`, { method: 'POST' })
        setNotices((current) =>
          current.map((entry) => (entry.id === notice.id ? { ...entry, read: true } : entry)),
        )
      } catch {
        /* read receipt is best-effort */
      }
    }
  }

  if (!notices && !error) return <Spinner />

  const agendaItems = (agenda) =>
    String(agenda || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  return (
    <div>
      <h1 className="portal-h1">CDA Notice Board</h1>
      <p className="portal-sub">
        Meetings, dues and events from the Blue Stone Estate CDA — tap a notice to open it.
      </p>

      <ErrorBox>{error}</ErrorBox>

      {notices?.length === 0 && (
        <div className="p-card">
          <p className="p-muted" style={{ margin: 0 }}>
            No notices published yet. Important CDA announcements will appear here and be pushed by
            SMS.
          </p>
        </div>
      )}

      {notices?.map((notice) => {
        const isOpen = openId === notice.id
        const agenda = agendaItems(notice.agenda)
        return (
          <div className={`p-notice ${notice.read ? '' : 'unread'}`} key={notice.id}>
            <div className="p-row" style={{ justifyContent: 'space-between' }}>
              <div className="p-row">
                <StatusPill status={notice.type} />
                {!notice.read && <span className="pill gold">New</span>}
              </div>
              <span className="p-muted" style={{ fontSize: '0.8rem' }}>
                {formatDate(notice.publish_at)}
              </span>
            </div>

            <button
              onClick={() => open(notice)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                textAlign: 'left',
                padding: '0.5rem 0 0',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>{notice.title}</strong>
            </button>

            {notice.event_at && (
              <p className="p-muted" style={{ margin: '0.3rem 0 0' }}>
                📅 {formatDate(notice.event_at)}
                {notice.venue ? ` · 📍 ${notice.venue}` : ''}
              </p>
            )}

            {isOpen && (
              <div style={{ marginTop: '0.6rem' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {notice.body}
                </p>
                {agenda.length > 0 && (
                  <>
                    <p className="p-label" style={{ marginTop: '0.8rem' }}>
                      Agenda
                    </p>
                    <ul className="p-agenda">
                      {agenda.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
