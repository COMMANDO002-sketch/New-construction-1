import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ErrorBox, Field, Spinner } from '../ui.jsx'

/** Houses (create, rent, link tenants) + tenant accounts (create, deactivate). */
export default function ManageTab() {
  const [houses, setHouses] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [houseForm, setHouseForm] = useState({ block: '', houseNo: '', houseType: '', rentAmount: '' })
  const [userForm, setUserForm] = useState({ fullName: '', phone: '', password: '', role: 'tenant' })

  const loadHouses = () =>
    api('/admin/houses')
      .then((data) => setHouses(data.houses))
      .catch((requestError) => setError(requestError.message))

  const loadUsers = () =>
    api('/admin/users')
      .then((data) => setUsers(data.users))
      .catch((requestError) => setError(requestError.message))

  useEffect(() => {
    loadHouses()
    loadUsers()
  }, [])

  const createHouse = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api('/admin/houses', {
        method: 'POST',
        body: {
          block: houseForm.block,
          houseNo: houseForm.houseNo,
          houseType: houseForm.houseType,
          rentAmount: Number(houseForm.rentAmount || 0),
        },
      })
      setHouseForm({ block: '', houseNo: '', houseType: '', rentAmount: '' })
      setNotice('House created.')
      await loadHouses()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const assignTenant = async (houseId, tenantId) => {
    setError('')
    try {
      await api(`/admin/houses/${houseId}`, {
        method: 'PATCH',
        body: { tenantId: tenantId ? Number(tenantId) : null, isOccupied: Boolean(tenantId) },
      })
      await loadHouses()
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const updateRent = async (houseId, rentAmount) => {
    setError('')
    try {
      await api(`/admin/houses/${houseId}`, { method: 'PATCH', body: { rentAmount: Number(rentAmount) } })
      await loadHouses()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const createUser = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api('/admin/users', { method: 'POST', body: userForm })
      setUserForm({ fullName: '', phone: '', password: '', role: 'tenant' })
      setNotice('Account created — give the tenant their phone number and password.')
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleActive = async (user) => {
    setError('')
    try {
      await api(`/admin/users/${user.id}`, { method: 'PATCH', body: { isActive: !user.is_active } })
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const tenantedIds = new Set(houses?.filter((house) => house.tenant_id).map((house) => house.tenant_id))

  if (!houses && !error) return <Spinner />

  const tenants = users.filter((user) => user.role === 'tenant')

  return (
    <div>
      <ErrorBox>{error}</ErrorBox>
      {notice && <div className="p-success-box">{notice}</div>}

      <div className="p-grid cols-2" style={{ alignItems: 'start', marginBottom: '1.5rem' }}>
        <form className="p-card" onSubmit={createHouse}>
          <h3>Add a house</h3>
          <div className="p-grid cols-2" style={{ gap: '0.75rem' }}>
            <Field label="Block">
              <input
                className="p-input"
                value={houseForm.block}
                onChange={(e) => setHouseForm({ ...houseForm, block: e.target.value })}
                placeholder="A"
                required
              />
            </Field>
            <Field label="House no.">
              <input
                className="p-input"
                value={houseForm.houseNo}
                onChange={(e) => setHouseForm({ ...houseForm, houseNo: e.target.value })}
                placeholder="12"
                required
              />
            </Field>
          </div>
          <Field label="House type (optional)">
            <input
              className="p-input"
              value={houseForm.houseType}
              onChange={(e) => setHouseForm({ ...houseForm, houseType: e.target.value })}
              placeholder="4 Bedroom Duplex"
            />
          </Field>
          <Field label="Yearly rent (₦)">
            <input
              className="p-input"
              type="number"
              min="0"
              value={houseForm.rentAmount}
              onChange={(e) => setHouseForm({ ...houseForm, rentAmount: e.target.value })}
              placeholder="1500000"
              required
            />
          </Field>
          <button className="p-btn">Create house</button>
        </form>

        <form className="p-card" onSubmit={createUser}>
          <h3>Create an account</h3>
          <Field label="Full name">
            <input
              className="p-input"
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              required
              minLength={2}
            />
          </Field>
          <div className="p-grid cols-2" style={{ gap: '0.75rem' }}>
            <Field label="Phone">
              <input
                className="p-input"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="0803…"
                required
              />
            </Field>
            <Field label="Role">
              <select
                className="p-select"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="tenant">tenant</option>
                <option value="landlord">landlord</option>
                <option value="cda_admin">cda admin</option>
              </select>
            </Field>
          </div>
          <Field label="Temporary password (min 8 chars)">
            <input
              className="p-input"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
              minLength={8}
            />
          </Field>
          <button className="p-btn">Create account</button>
        </form>
      </div>

      {/* Houses table */}
      <h3 style={{ fontFamily: 'var(--serif)' }}>Houses & occupancy</h3>
      <div className="p-table-wrap" style={{ marginBottom: '1.5rem' }}>
        <table className="p-table">
          <thead>
            <tr>
              <th>House</th>
              <th>Type</th>
              <th>Landlord</th>
              <th>Tenant</th>
              <th>Yearly rent</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((house) => (
              <tr key={house.id}>
                <td>
                  Block {house.block} — {house.house_no}
                </td>
                <td>{house.house_type || '—'}</td>
                <td>{house.landlord_name || '—'}</td>
                <td>
                  <select
                    className="p-select"
                    style={{ width: 'auto', minWidth: 170, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    value={house.tenant_id || ''}
                    onChange={(e) => assignTenant(house.id, e.target.value)}
                  >
                    <option value="">— vacant —</option>
                    <option value={house.tenant_id || ''} disabled={!house.tenant_id}>
                      {house.tenant_name || '—'}
                    </option>
                    {tenants
                      .filter((tenant) => !tenantedIds.has(tenant.id) || tenant.id === house.tenant_id)
                      .map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.full_name} ({tenant.phone})
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <input
                    className="p-input"
                    style={{ width: 130, padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                    type="number"
                    min="0"
                    defaultValue={Number(house.rent_amount)}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== Number(house.rent_amount)) {
                        updateRent(house.id, e.target.value)
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users table */}
      <h3 style={{ fontFamily: 'var(--serif)' }}>Accounts ({users.length})</h3>
      <div className="p-table-wrap">
        <table className="p-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>House</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.phone}</td>
                <td>{user.role.replace('_', ' ')}</td>
                <td>{user.house_no ? `Block ${user.block} — ${user.house_no}` : '—'}</td>
                <td>{user.is_active ? <span className="pill success">active</span> : <span className="pill failed">disabled</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={`p-btn small ${user.is_active ? 'danger' : 'ghost'}`}
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="p-muted" style={{ marginTop: '0.75rem' }}>
        Tip: yearly rent set here is what a tenant is charged when paying rent. Leave a house
        vacant by selecting “— vacant —”.
      </p>
    </div>
  )
}
