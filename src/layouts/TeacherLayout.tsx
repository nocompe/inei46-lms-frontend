import { Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  GraduationCap,
  FileText,
  ClipboardCheck,
  CalendarCheck,
  MessageSquare,
  Bell,
  Library,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'
import { loadAuth } from '../lib/api'

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
  const navigate = useNavigate()
  const auth = loadAuth()

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
              {auth && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {auth.nombres} {auth.apellidos}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/docente/comunicados')}
              title="Ver comunicados"
              className="h-9 w-9 grid place-items-center rounded-lg bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A]"
            >
              <Bell size={16} />
            </button>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
