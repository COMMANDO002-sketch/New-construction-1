import { useEffect, useState } from 'react'
import { api, naira } from '../api.js'
import { useAuth } from '../auth-context.js'
import { ErrorBox, Spinner } from '../ui.jsx'
import NoticesTab from './NoticesTab.jsx'
import PaymentsTab from './PaymentsTab.jsx'
import DefaultersTab from './DefaultersTab.jsx'
import ManageTab from './ManageTab.jsx'
import BillsTab from './BillsTab.jsx'
import ComplaintsTab from './ComplaintsTab.jsx'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'notices', label: 'CDA Notices' },
  { id: 'payments', label: 'Payments' },
  { id: 'defaulters', label: 'Defaulters & Reports' },
  { id: 'manage', label: 'Houses & Tenants' },
  { id: 'bills', label: 'Bill Pricing' },
  { id: 'complaints', label: 'Complaints' },
]

function Overview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/stats')
      .then((data) => setStats(data))
      .catch((requestError) => setError(requestError.message))
  }, [])

  if (!stats && !error) return <Spinner />
  if (error) return <ErrorBox>{error}</ErrorBox>

  const cards = [
    { label: 'Collected this month', value: naira(stats.money.collected_this_month) },
    { label: 'Collected this year', value: naira(stats.money.collected_this_year) },
    { label: 'Occupied houses', value: `${stats.houses.occupied} / ${stats.houses.total}` },
    { label: 'Tenanted houses', value: String(stats.houses.tenanted) },
    { label: 'Pending payments', value: String(stats.money.pending) },
    { label: 'Published notices', value: String(stats.notices.published) },
    { label: 'Open complaints', value: String(stats.complaints.open) },
    { label: 'In progress', value: String(stats.complaints.in_progress) },
  ]

  return (
    <div className="p-grid cols-3">
      {cards.map((card) => (
        <div className="p-card" key={card.label}>
          <p className="p-label">{card.label}</p>
          <div className="p-stat">{card.value}</div>
        </div>
      ))}
    </div>
  )
}

/** CDA / landlord admin console. */
export default function Admin() {
  const { isAdmin, user } = useAuth()
  const [tab, setTab] = useState('overview')

  if (!isAdmin) {
    return (
      <div className="p-card gold">
        <h3>Admin access only</h3>
        <p className="p-muted" style={{ marginBottom: 0 }}>
          Signed in as {user?.full_name} ({user?.role?.replace('_', ' ')}). This console is
          available to CDA administrators. Contact the CDA office if you need access.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="portal-h1">CDA Admin Console</h1>
      <p className="portal-sub">Notices, payments, occupancy, defaulters and reports.</p>

      <div className="p-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`p-tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'notices' && <NoticesTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'defaulters' && <DefaultersTab />}
      {tab === 'manage' && <ManageTab />}
      {tab === 'bills' && <BillsTab />}
      {tab === 'complaints' && <ComplaintsTab />}
    </div>
  )
}
