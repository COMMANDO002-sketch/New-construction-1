import jwt from 'jsonwebtoken'
import { env } from '../config.js'
import { httpError } from '../lib/validate.js'

/** Verify the Bearer token and attach { id, role, name } to req.user. */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(httpError(401, 'Authentication required'))

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    req.user = { id: Number(payload.sub), role: payload.role, name: payload.name }
    next()
  } catch {
    next(httpError(401, 'Session expired or invalid — please sign in again'))
  }
}

/** Restrict a route to specific roles. super_admin always passes. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(httpError(401, 'Authentication required'))
    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) return next()
    next(httpError(403, 'You do not have permission to perform this action'))
  }
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, name: user.full_name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}
