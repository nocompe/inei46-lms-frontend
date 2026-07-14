import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload,
  Plus,
  Users,
  FileText,
  TrendingUp,
  CalendarCheck,
  Calendar,
  CheckCheck,
} from 'lucide-react'
import Pill from '../components/Pill'
import { api, loadAuth, type MiCurso, type MiResumen, type MiTareaDTO } from '../lib/api'

export default function VistaProfesor() {
  const auth = loadAuth()
  const navigate = useNavigate()
  const [cursos, setCursos] = useState<MiCurso[]>([])
  const [tareas, setTareas] = useState<MiTareaDTO[]>([])
  const [resumen, setResumen] = useState<MiResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    setLoading(true)
    Promise.all([
      api.miCursos(auth.id),
      api.miTareas(auth.id),
      api.miResumen(auth.id),
    ])
      .then(([c, t, r]) => {
        setCursos(c.cursos)
        setTareas(t.tareas)
        setResumen(r)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) {
    return <div className="p-8 text-sm text-gray-600">Sesión no encontrada. Inicia sesión nuevamente.</div>
  }

  const cursoActivo = cursos[0]

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}

      {/* Banner del curso activo */}
      <div className="bg-inei-600 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold text-white/80 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/15">
              {cursoActivo ? `${cursoActivo.codigo} · Periodo ${cursoActivo.periodo}` : 'Sin curso activo'}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{cursoActivo?.nombre ?? 'Mis cursos'}</h1>
          <p className="text-xs text-white/80">
            {cursoActivo
              ? `${cursoActivo.grado} de secundaria - Sección ${cursoActivo.seccion} · ${cursoActivo.estudiantes ?? 0} estudiantes matriculados`
              : 'Aún no tienes cursos asignados'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate('/docente/contenido')}
            className="h-10 px-3.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload size={14} /> Subir contenido
          </button>
          <Link
            to="/docente/tareas"
            className="h-10 px-3.5 rounded-lg bg-white text-inei-600 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Nueva tarea
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard icon={FileText} label="Mis cursos" value={loading ? '—' : String(resumen?.cursos ?? cursos.length)} />
        <StatCard icon={Users} label="Estudiantes" value={loading ? '—' : String(resumen?.estudiantes ?? '0')} />
        <StatCard icon={TrendingUp} label="Tareas activas" value={loading ? '—' : String(resumen?.tareas ?? tareas.length)} />
        <StatCard
          icon={CheckCheck}
          label="Entregas por calificar"
          value={loading ? '—' : String(resumen?.entregas_pendientes ?? 0)}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        {/* Tareas por revisar */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Tareas y evaluaciones</h2>
              <p className="text-[11px] text-gray-400">
                {resumen?.entregas_pendientes ?? 0} entrega(s) pendientes de calificación
              </p>
            </div>
            <Link to="/docente/tareas" className="text-[11px] font-semibold text-inei-600">
              Ver todas
            </Link>
          </div>

          {loading && (
            <div className="py-6 text-center text-xs text-gray-400">Cargando tareas...</div>
          )}
          {!loading && tareas.length === 0 && (
            <div className="py-6 text-center text-xs text-gray-400">Aún no has creado tareas.</div>
          )}

          <div className="flex flex-col gap-2">
            {tareas.map((t) => (
              <div
                key={t.id}
                className="bg-surface-muted rounded-xl px-4 py-3.5 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-inei-100 grid place-items-center">
                  <FileText size={18} className="text-inei-600" />
                </div>
                <div className="flex-1 flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.titulo}</span>
                  <span className="text-[11px] text-gray-400">
                    {t.curso.nombre} · {t.tipo} · {t.puntaje_maximo} pts
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-400">{formatFecha(t.fecha_limite)}</span>
                  {(t.entregas_pendientes ?? 0) > 0 ? (
                    <Link
                      to={`/docente/calificaciones?tarea_id=${t.id}`}
                      className="px-2.5 h-6 inline-flex items-center rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
                    >
                      {t.entregas_pendientes} por calificar
                    </Link>
                  ) : (
                    <Pill variant="success" showDot={false}>
                      Al día
                    </Pill>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: cursos + acciones */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3.5">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Mis cursos</h2>
            {cursos.length === 0 && (
              <div className="text-[11px] text-gray-400">Sin cursos asignados.</div>
            )}
            {cursos.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-inei-100 grid place-items-center text-inei-600 text-xs font-bold">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{c.nombre}</span>
                  <span className="text-[10px] text-gray-400">
                    {c.codigo} · {c.grado}-{c.seccion} · {c.estudiantes ?? 0} est.
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-5 flex flex-col gap-3 text-white">
            <span className="text-[11px] font-semibold text-white/80">Acciones rápidas</span>
            <Link
              to="/docente/asistencia"
              className="h-9 rounded-lg bg-white/15 hover:bg-white/25 inline-flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <CalendarCheck size={14} /> Tomar asistencia hoy
            </Link>
            <Link
              to="/docente/tareas"
              className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 inline-flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <Plus size={14} /> Nueva tarea / evaluación
            </Link>
            <div className="flex items-center gap-2.5 text-[11px] text-white/80 pt-2">
              <Calendar size={14} />
              <span>Periodo {cursoActivo?.periodo ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Users
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl px-4 py-4 flex items-center gap-3.5 ${highlight ? 'bg-inei-600 text-white' : 'bg-white'}`}>
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${highlight ? 'bg-white/15' : 'bg-inei-100'}`}>
        <Icon size={18} className={highlight ? 'text-white' : 'text-inei-600'} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-[11px] ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <span className={`text-lg font-bold ${highlight ? '' : 'text-[#1A1A1A]'}`}>{value}</span>
      </div>
    </div>
  )
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const yy = d.getFullYear().toString().slice(-2)
  return `${dd}/${mm}/${yy}`
}
