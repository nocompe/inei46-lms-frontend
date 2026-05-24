import { Outlet } from 'react-router-dom'
import {
  BookOpen,
  GraduationCap,
  FileText,
  ClipboardCheck,
  CalendarCheck,
  MessageSquare,
  Bell,
  Search,
  Library,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'

const teacherNav: NavItem[] = [
  { to: '/docente', icon: BookOpen, label: 'Mis cursos' },
  { to: '/docente/estudiantes', icon: GraduationCap, label: 'Estudiantes' },
  { to: '/docente/contenido', icon: Library, label: 'Contenido' },
  { to: '/docente/tareas', icon: FileText, label: 'Tareas y evaluaciones' },
  { to: '/docente/calificaciones', icon: ClipboardCheck, label: 'Calificaciones' },
  { to: '/docente/asistencia', icon: CalendarCheck, label: 'Asistencia' },
  { to: '/docente/comunicados', icon: MessageSquare, label: 'Comunicados' },
]

export default function TeacherLayout() {
  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="Portal Docente"
        sectionLabel="DOCENTE"
        items={teacherNav}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Portal docente</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">Mis cursos</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-[#1A1A1A]">Matemáticas I · 3ro A</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 h-9 w-60 px-3 rounded-lg bg-white border border-border-soft">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiante o tarea..."
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
