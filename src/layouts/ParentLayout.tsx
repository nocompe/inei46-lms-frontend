import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Trophy,
  CalendarCheck,
  CircleAlert,
  MessageSquare,
  CreditCard,
  ClipboardList,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'

const parentNav: NavItem[] = [
  { to: '/padre', icon: LayoutDashboard, label: 'Resumen' },
  { to: '/padre/solicitudes-matricula', icon: ClipboardList, label: 'Solicitudes de matrícula' },
  { to: '/padre/calificaciones', icon: Trophy, label: 'Calificaciones' },
  { to: '/padre/asistencia', icon: CalendarCheck, label: 'Asistencia' },
  { to: '/padre/observaciones', icon: CircleAlert, label: 'Observaciones' },
  { to: '/padre/comunicados', icon: MessageSquare, label: 'Comunicados' },
  { to: '/padre/pagos', icon: CreditCard, label: 'Pagos y pensiones' },
]

export default function ParentLayout() {
  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="Portal Familia"
        sectionLabel="PADRE DE FAMILIA"
        items={parentNav}
        userColor="#1A1A1A"
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
