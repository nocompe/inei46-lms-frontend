import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  ChartColumn,
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
        <div className="px-4 md:px-8 py-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pl-12 lg:pl-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Inicio</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-[#1A1A1A]">{breadcrumb}</span>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
