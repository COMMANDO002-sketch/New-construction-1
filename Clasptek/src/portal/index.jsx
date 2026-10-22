import { Navigate, Route, Routes } from 'react-router-dom'
import PortalLayout from './PortalLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Pay from './pages/Pay.jsx'
import Callback from './pages/Callback.jsx'
import Notices from './pages/Notices.jsx'
import History from './pages/History.jsx'
import Complaints from './pages/Complaints.jsx'
import Admin from './admin/Admin.jsx'

/** All /portal routes. Login sits outside the layout; everything else is
 *  behind PortalLayout, which redirects signed-out visitors to /portal/login. */
export default function PortalRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<PortalLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="pay" element={<Pay />} />
        <Route path="payments/callback" element={<Callback />} />
        <Route path="notices" element={<Notices />} />
        <Route path="history" element={<History />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  )
}
