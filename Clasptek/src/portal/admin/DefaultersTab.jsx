import { useEffect, useState } from 'react'
import { api, downloadFile, formatDate, naira } from '../api.js'
import { ErrorBox, Spinner } from '../ui.jsx'

/** Defaulters list + Excel report downloads. */
export default function DefaultersTab() {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = (targetYear = year) => {
    setData(null)
    api(`/admin/defaulters?year=${encodeURIComponent(targetYear)}`)
      .then((result) => setData(result))
      .catch((requestError) => setError(requestError.message))
  }

  useEffect(() => {
    load(year)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const download = async (which) => {
    setError('')
    setBusy(true)
    try {
      if (which === 'defaulters') {
        await downloadFile(`/reports/defaulters.xlsx?year=${year}`, `claspconstruction-defaulters-${year}.xlsx`)
      } else {
        await downloadFile(`/reports/payments.xlsx?year=${year}`, `claspconstruction-payments-${year}.xlsx`)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="p-row" style={{ marginBottom: '1rem' }}>
        <label className="p-label" style={{ margin: 0 }}>
          Rent year
        </label>
        <input
          className="p-input"
          style={{ width: 110 }}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="2026"
        />
        <button className="p-btn small" onClick={() => load(year)}>
          Refresh
        </button>
        <button className="p-btn ghost small" disabled={busy} onClick={() => download('defaulters')}>
          ⬇ Defaulters Excel
        </button>
        <button className="p-btn ghost small" disabled={busy} onClick={() => download('payments')}>
          ⬇ Payments Excel
        </button>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {!data && !error && <Spinner />}

      {data && (
        <>
          <p className="p-muted">
            {data.count === 0
              ? `Every tenanted house has paid rent for ${data.year}. 🎉`
              : `${data.count} house${data.count > 1 ? 's have' : ' has'} no successful rent payment recorded for ${data.year}.`}
          </p>

          {data.count > 0 && (
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>House</th>
                    <th>Tenant</th>
                    <th>Landlord</th>
                    <th>Rent owed</th>
                    <th>Last rent paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.defaulters.map((row) => (
                    <tr key={row.house_id}>
                      <td>
                        Block {row.block} — {row.house_no}
                      </td>
                      <td>
                        {row.tenant_name}
                        <div className="p-muted" style={{ fontSize: '0.78rem' }}>
                          {row.tenant_phone}
                        </div>
                      </td>
                      <td>
                        {row.landlord_name || '—'}
                        <div className="p-muted" style={{ fontSize: '0.78rem' }}>
                          {row.landlord_phone || ''}
                        </div>
                      </td>
                      <td>{naira(row.rent_amount)}</td>
                      <td>
                        {row.last_rent_paid_at ? formatDate(row.last_rent_paid_at) : 'never'}
                        {row.last_rent_period ? ` · ${row.last_rent_period}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
