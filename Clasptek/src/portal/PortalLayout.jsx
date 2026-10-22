import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { api } from './api.js'
import { useAuth } from './auth-context.js'
import './portal.css'

export default function PortalLayout() {
  const { user, loading, logout, isAdmin } = useAuth()
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    api('/me')
      .then((data) => setUnread(data.unreadNotices || 0))
      .catch(() => {})
  }, [user])

  if (loading) {
    return (
      <div className="portal-shell">
        <div className="p-spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />
  }

  const firstName = (user.full_name || '').split(' ')[0]

  return (
    <div className="portal-shell">
      <nav className="portal-nav">
        <Link to="/portal" className="portal-brand">
          CLASP<span>TEK</span> · Tenant Portal
        </Link>

        <div className="portal-links">
          <NavLink to="/portal" end>
            Dashboard
          </NavLink>
          <NavLink to="/portal/pay">Pay</NavLink>
          <NavLink to="/portal/notices">
            Notices{unread > 0 ? ` (${unread})` : ''}
          </NavLink>
          <NavLink to="/portal/history">History</NavLink>
          <NavLink to="/portal/complaints">Complaints</NavLink>
          {isAdmin && <NavLink to="/portal/admin">CDA Admin</NavLink>}
        </div>

        <div className="portal-nav-right">
          <span className="p-muted p-no-print" style={{ fontSize: '0.82rem' }}>
            {firstName}
          </span>
          <button
            className="p-btn ghost small p-no-print"
            onClick={() => {
              logout()
              navigate('/portal/login')
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="portal-main">
        <Outlet context={{ refreshUnread: setUnread }} />
      </main>
    </div>
  )
}
