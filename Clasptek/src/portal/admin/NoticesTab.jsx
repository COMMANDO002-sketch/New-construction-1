import { useEffect, useState } from 'react'
import { api, formatDate } from '../api.js'
import { ErrorBox, Field, Spinner, StatusPill } from '../ui.jsx'

const TYPES = ['meeting', 'dues', 'event', 'alert', 'general']

const BLANK = {
  type: 'meeting',
  title: '',
  body: '',
  agenda: '',
  eventAt: '',
  venue: '',
  notify: true,
}

/** Compose, publish and track CDA notices (push = SMS to every tenant). */
export default function NoticesTab() {
  const [form, setForm] = useState(BLANK)
  const [notices, setNotices] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    api('/notices/admin/all')
      .then((data) => setNotices(data.notices))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    load()
  }, [])

  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })

  const publishNow = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await api('/notices', {
        method: 'POST',
        body: {
          type: form.type,
          title: form.title,
          body: form.body,
          agenda: form.agenda,
          venue: form.venue,
          eventAt: form.eventAt ? new Date(form.eventAt).toISOString() : '',
          publish: true,
          notify: form.notify,
        },
      })
      setForm(BLANK)
      setNotice('Notice published and queued for SMS delivery to every active tenant.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const saveDraft = async () => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await api('/notices', {
        method: 'POST',
        body: {
          type: form.type,
          title: form.title,
          body: form.body,
          agenda: form.agenda,
          venue: form.venue,
          eventAt: form.eventAt ? new Date(form.eventAt).toISOString() : '',
          publish: false,
          notify: false,
        },
      })
      setForm(BLANK)
      setNotice('Draft saved — publish it when you are ready.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const publishExisting = async (id) => {
    setError('')
    try {
      await api(`/notices/${id}/publish`, { method: 'POST', body: { notify: true } })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return
    try {
      await api(`/notices/${id}`, { method: 'DELETE' })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!notices && !error) return <Spinner />

  return (
    <div className="p-grid cols-2" style={{ alignItems: 'start' }}>
      {/* Composer */}
      <form className="p-card gold" onSubmit={publishNow}>
        <h3>Post a CDA notice</h3>
        <ErrorBox>{error}</ErrorBox>

        <Field label="Type">
          <select className="p-select" value={form.type} onChange={update('type')}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title">
          <input
            className="p-input"
            value={form.title}
            onChange={update('title')}
            placeholder="e.g. Town Hall Meeting — October"
            required
            minLength={3}
          />
        </Field>

        <Field label="Message">
          <textarea
            className="p-textarea"
            value={form.body}
            onChange={update('body')}
            placeholder="What should every tenant know?"
            required
            minLength={3}
          />
        </Field>

        <div className="p-grid cols-2" style={{ gap: '0.75rem' }}>
          <Field label="Date & time (meeting/event)">
            <input className="p-input" type="datetime-local" value={form.eventAt} onChange={update('eventAt')} />
          </Field>
          <Field label="Venue">
            <input className="p-input" value={form.venue} onChange={update('venue')} placeholder="e.g. Estate Hall A" />
          </Field>
        </div>

        <Field label="Agenda (one item per line)">
          <textarea
            className="p-textarea"
            style={{ minHeight: 80 }}
            value={form.agenda}
            onChange={update('agenda')}
            placeholder={'Road repairs\nSecurity levies\nWater supply'}
          />
        </Field>

        <label className="p-row" style={{ marginBottom: '1rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.notify} onChange={update('notify')} />
          Send SMS push to all tenants on publish
        </label>

        <div className="p-row">
          <button className="p-btn" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish now'}
          </button>
          <button type="button" className="p-btn ghost" disabled={busy} onClick={saveDraft}>
            Save as draft
          </button>
        </div>
      </form>

      {/* Published + drafts */}
      <div>
        {notice && <div className="p-success-box">{notice}</div>}

        {notices?.length === 0 && <p className="p-muted">No notices yet — post your first one.</p>}

        {notices?.map((item) => (
          <div className="p-card" key={item.id} style={{ marginBottom: '0.9rem' }}>
            <div className="p-row" style={{ justifyContent: 'space-between' }}>
              <div className="p-row">
                <StatusPill status={item.type} />
                {item.is_published ? (
                  <span className="pill success">Published</span>
                ) : (
                  <span className="pill pending">Draft</span>
                )}
              </div>
              <span className="p-muted" style={{ fontSize: '0.78rem' }}>
                {formatDate(item.created_at)}
              </span>
            </div>

            <strong style={{ display: 'block', margin: '0.55rem 0 0.25rem' }}>{item.title}</strong>
            <p className="p-muted" style={{ margin: '0 0 0.6rem' }}>
              {item.body.slice(0, 130)}
              {item.body.length > 130 ? '…' : ''}
            </p>

            {item.is_published && (
              <div className="p-row" style={{ fontSize: '0.82rem', marginBottom: '0.6rem' }}>
                <span className="pill neutral">Read: {item.reads} / {item.audience}</span>
                {item.event_at && (
                  <span className="p-muted">📅 {formatDate(item.event_at)} {item.venue ? `· ${item.venue}` : ''}</span>
                )}
              </div>
            )}

            <div className="p-row">
              {!item.is_published && (
                <button className="p-btn small" onClick={() => publishExisting(item.id)}>
                  Publish + SMS
                </button>
              )}
              <button className="p-btn danger small" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
