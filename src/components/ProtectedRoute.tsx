import { Navigate } from 'react-router-dom'
import { loadAuth, homeForRole, type AuthUser } from '../lib/api'

/**
 * Protege un grupo de rutas por rol.
 * - Sin sesión → redirige a /login.
 * - Con sesión pero rol no permitido → redirige al home de su propio rol.
 */
export default function ProtectedRoute({
  roles,
  children,
}: {
  roles: AuthUser['rol'][]
  children: React.ReactNode
}) {
  const auth = loadAuth()

  if (!auth) return <Navigate to="/login" replace />

  if (!roles.includes(auth.rol)) {
    return <Navigate to={homeForRole(auth.rol)} replace />
  }

  return <>{children}</>
}
