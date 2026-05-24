import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  ChartColumn,
  Bell,
  Search,
  HeartHandshake,
  ClipboardCheck,
  CalendarDays,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'

const adminNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cursos', icon: BookOpen, label: 'Cursos' },
  { to: '/estudiantes', icon: GraduationCap, label: 'Estudiantes' },
  { to: '/docentes', icon: Users, label: 'Docentes' },
  { to: '/matricula', icon: ClipboardList, label: 'Matrículas' },
  { to: '/asignaciones', icon: ClipboardList, label: 'Asignaciones' },
  { to: '/horario-maestro', icon: CalendarDays, label: 'Horario maestro' },
  { to: '/evaluaciones', icon: FileText, label: 'Evaluaciones' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/vinculos', icon: HeartHandshake, label: 'Vínculos padre-hijo' },
  { to: '/solicitudes-matricula', icon: ClipboardCheck, label: 'Solicitudes' },
  { to: '/reportes', icon: ChartColumn, label: 'Reportes' },
]

export default function DashboardLayout() {
  const location = useLocation()
  const breadcrumb = adminNav.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Inicio'

  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="LMS Académico"
        sectionLabel="MENÚ PRINCIPAL"
        items={adminNav}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Inicio</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-[#1A1A1A]">{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-white border border-border-soft">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar curso, docente, código..."
                  className="flex-1 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <button className="h-9 w-9 grid place-items-center rounded-lg bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A]">
                <Bell size={16} />
              </button>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
