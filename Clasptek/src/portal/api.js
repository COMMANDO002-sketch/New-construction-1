const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '')
const TOKEN_KEY = 'clasptek_portal_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** JSON request wrapper. Throws an Error with a human message + status. */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeaders() : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status})`)
    error.status = response.status
    if (response.status === 401 && auth) setToken(null)
    throw error
  }
  return data
}

/** Download an authenticated .xlsx (reports) via blob so the JWT is sent. */
export async function downloadFile(path, filename) {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || `Download failed (${response.status})`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Redirect the browser to Paystack's hosted checkout. */
export function goToCheckout(authorizationUrl) {
  window.location.assign(authorizationUrl)
}

export const naira = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export const formatDate = (value, options = {}) =>
  value
    ? new Date(value).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Lagos',
        ...options,
      })
    : '—'
