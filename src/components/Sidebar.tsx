import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { UserCircle, LogOut, MoreVertical } from 'lucide-react'
import Logo from './Logo'
import { clearAuth, loadAuth } from '../lib/api'

export type NavItem = {
  to: string
  icon: LucideIcon
  label: string
}

type SidebarProps = {
  brandSubtitle: string
  sectionLabel: string
  items: NavItem[]
  fallbackRole?: string
  userColor?: string
}

export default function Sidebar({ brandSubtitle, sectionLabel, items, fallbackRole, userColor }: SidebarProps) {
  const auth = loadAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const perfilPath = (() => {
    if (!auth) return '/perfil'
    switch (auth.rol) {
      case 'docente': return '/docente/perfil'
      case 'estudiante': return '/estudiante/perfil'
      case 'padre': return '/padre/perfil'
      default: return '/perfil'
    }
  })()

  const displayName = auth ? `${auth.nombres.split(' ')[0]} ${auth.apellidos.split(' ')[0]}` : 'Invitado'
  const displayRole = auth
    ? rolLabel(auth.rol, auth.grado, auth.seccion, fallbackRole)
    : fallbackRole ?? 'Sin sesión'
  const initials = auth ? (auth.nombres.charAt(0) + auth.apellidos.charAt(0)).toUpperCase() : '·'

  return (
    <aside className="w-60 shrink-0 bg-white flex flex-col p-6 gap-7">
      <Logo size="sm" subtitle={brandSubtitle} />

      <nav className="flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-semibold text-gray-400 px-3 pb-1">{sectionLabel}</span>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `h-10 px-3 rounded-lg flex items-center gap-3 text-[13px] transition ${
                isActive
                  ? 'bg-inei-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-surface-muted'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 p-3 bg-surface-muted rounded-xl hover:bg-border-softer transition text-left"
        >
          <div
            className="h-8 w-8 rounded-full text-white text-[11px] font-bold grid place-items-center shrink-0"
            style={{ background: userColor ?? '#C8102E' }}
          >
            {initials}
          </div>
          <div className="flex flex-col leading-tight flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">{displayName}</span>
            <span className="text-[10px] text-gray-400 truncate">{displayRole}</span>
          </div>
          <MoreVertical size={14} className="text-gray-400 shrink-0" />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-border-soft py-1 z-30 overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); navigate(perfilPath) }}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-surface-muted flex items-center gap-2"
            >
              <UserCircle size={14} className="text-gray-400" />
              Mi perfil
            </button>
            <div className="h-px bg-border-softer" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs text-inei-600 hover:bg-inei-50 flex items-center gap-2 font-semibold"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function rolLabel(rol: string, grado: string | null, seccion: string | null, fallback?: string): string {
  if (rol === 'admin') return 'Administrador'
  if (rol === 'docente') return 'Docente'
  if (rol === 'estudiante') {
    const extra = grado && seccion ? ` · ${grado} ${seccion}` : ''
    return `Estudiante${extra}`
  }
  if (rol === 'padre') return 'Padre de familia'
  return fallback ?? rol
}
