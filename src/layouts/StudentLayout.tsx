import { Outlet } from 'react-router-dom'
import {
  House,
  BookOpen,
  FileText,
  Trophy,
  Calendar,
  Bell,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'

const studentNav: NavItem[] = [
  { to: '/estudiante', icon: House, label: 'Inicio' },
  { to: '/estudiante/cursos', icon: BookOpen, label: 'Mis cursos' },
  { to: '/estudiante/tareas', icon: FileText, label: 'Tareas' },
  { to: '/estudiante/calificaciones', icon: Trophy, label: 'Calificaciones' },
  { to: '/estudiante/horario', icon: Calendar, label: 'Horario' },
  { to: '/estudiante/notificaciones', icon: Bell, label: 'Notificaciones' },
]

export default function StudentLayout() {
  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="Aula Virtual"
        sectionLabel="ESTUDIANTE"
        items={studentNav}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
