import { createContext, useContext } from 'react'

/** Kept separate from auth.jsx so that file only exports a component
 *  (React Fast Refresh requirement). */
export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}
