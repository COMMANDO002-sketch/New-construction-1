import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, naira } from '../api.js'
import { useAuth } from '../auth-context.js'
import { ErrorBox, Spinner, StatusPill } from '../ui.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [dues, setDues] = useState([])
  const [notices, setNotices] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/me'), api('/me/dues'), api('/notices')])
      .then(([profile, dueItems, noticeFeed]) => {
        setData(profile)
        setDues(dueItems.items)
        setNotices(noticeFeed.notices.slice(0, 3))
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  if (!data && !error) return <Spinner />

  const profile = data?.profile
  const outstanding = dues.filter((item) => !item.paid)

  return (
    <div>
      <h1 className="portal-h1">Welcome{user ? `, ${user.full_name.split(' ')[0]}` : ''}</h1>
      <p className="portal-sub">Your rent, bills and estate notices in one place.</p>

      <ErrorBox>{error}</ErrorBox>

      <div className="p-grid cols-2">
        {/* Profile card */}
        <div className="p-card">
          <h3>My House</h3>
          {profile?.house_id ? (
            <>
              <div className="p-stat">
                Block {profile.block} · House {profile.house_no}
              </div>
              <p className="p-muted" style={{ marginTop: '0.5rem' }}>
                {profile.house_type || 'Residential unit'}
              </p>
              <div className="p-receipt-line">
                <span>Landlord</span>
                <span>{profile.landlord_name || '—'}</span>
              </div>
              <div className="p-receipt-line">
                <span>Landlord phone</span>
                <span>{profile.landlord_phone || '—'}</span>
              </div>
              <div className="p-receipt-line">
                <span>My phone</span>
                <span>{profile.phone}</span>
              </div>
            </>
          ) : (
            <p className="p-muted">
              No house linked to your account yet. Visit or call the CDA office with your house
              number to be linked.
            </p>
          )}
        </div>

        {/* Dues card */}
        <div className="p-card gold">
          <h3>{outstanding.length > 0 ? 'Outstanding dues' : 'You are fully settled 🎉'}</h3>
          {dues.length === 0 ? (
            <p className="p-muted">No bills configured yet.</p>
          ) : outstanding.length === 0 ? (
            <p className="p-muted">Rent and all monthly bills are paid for this period.</p>
          ) : (
            <>
              <div className="p-stat">{naira(outstanding.reduce((sum, i) => sum + i.amount, 0))}</div>
              <p className="p-muted" style={{ marginBottom: '1rem' }}>
                due across {outstanding.length} item{outstanding.length > 1 ? 's' : ''}
              </p>
            </>
          )}
          <Link className="p-btn" to="/portal/pay">
            Pay now
          </Link>
        </div>
      </div>

      {/* Dues list */}
      <div className="p-card" style={{ marginTop: '1rem' }}>
        <h3>Rent & bills</h3>
        {dues.length === 0 ? (
          <p className="p-muted">Nothing to pay right now.</p>
        ) : (
          <div className="p-table-wrap" style={{ border: 'none' }}>
            <table className="p-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dues.map((item) => (
                  <tr key={`${item.kind}-${item.billTypeId || 'rent'}`}>
                    <td>{item.name}</td>
                    <td>{naira(item.amount)}</td>
                    <td>
                      {item.paid ? (
                        <span className="pill success">Paid {item.receiptNo ? `· ${item.receiptNo}` : ''}</span>
                      ) : (
                        <StatusPill status="pending" />
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!item.paid && (
                        <Link
                          className="p-btn small"
                          to={`/portal/pay?type=${item.kind}${item.billTypeId ? `&bill=${item.billTypeId}` : ''}`}
                        >
                          Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Latest notices */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="p-row" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--serif)', margin: 0 }}>CDA Notice Board</h3>
          <Link className="p-btn ghost small" to="/portal/notices">
            View all notices
          </Link>
        </div>
        {notices.map((notice) => (
          <div className={`p-notice ${notice.read ? '' : 'unread'}`} key={notice.id}>
            <div className="p-row" style={{ justifyContent: 'space-between' }}>
              <strong>{notice.title}</strong>
              <StatusPill status={notice.type} />
            </div>
            <p className="p-muted" style={{ margin: '0.35rem 0 0' }}>
              {formatDate(notice.event_at || notice.publish_at)}
              {notice.venue ? ` · ${notice.venue}` : ''}
            </p>
          </div>
        ))}
        {notices.length === 0 && <p className="p-muted">No notices published yet.</p>}
      </div>
    </div>
  )
}
