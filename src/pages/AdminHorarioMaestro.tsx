import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, BookOpen, MapPin, Users as UsersIcon, AlertCircle,
  Clock, GraduationCap, ArrowRight, Sparkles, CheckCircle2,
} from 'lucide-react'
import { api, type HorarioMaestroCurso, type HorarioMaestroDTO } from '../lib/api'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const
const DIA_LABEL: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
}

// Paleta de colores para cursos (rotando)
const CURSO_COLORS = [
  { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  { bg: '#E9D5FF', text: '#6B21A8', border: '#D8B4FE' },
  { bg: '#FCE7F3', text: '#9F1239', border: '#F9A8D4' },
  { bg: '#CFFAFE', text: '#155E75', border: '#67E8F9' },
]

const GRADOS = ['1ro', '2do', '3ro', '4to', '5to']
const SECCIONES = ['A', 'B', 'C', 'D']

export default function AdminHorarioMaestro() {
  const [grado, setGrado] = useState('3ro')
  const [seccion, setSeccion] = useState('A')
  const [data, setData] = useState<HorarioMaestroDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [resultadoSync, setResultadoSync] = useState<string | null>(null)

  const sincronizarMatriculas = async () => {
    if (!confirm('Se inscribirá a todos los estudiantes existentes en los cursos de su grado-sección que aún no tengan matrícula. ¿Continuar?')) return
    setSincronizando(true)
    setResultadoSync(null)
    setError(null)
    try {
      const r = await api.autoMatricularTodos()
      setResultadoSync(r.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.horarioMaestro(grado, seccion)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [grado, seccion])

  // Asignar color fijo por curso
  const cursoColor = useMemo(() => {
    if (!data) return new Map<number, typeof CURSO_COLORS[number]>()
    const m = new Map<number, typeof CURSO_COLORS[number]>()
    data.cursos.forEach((c, i) => m.set(c.id, CURSO_COLORS[i % CURSO_COLORS.length]))
    return m
  }, [data])

  // Construir grid: por día → bloques ordenados por hora_inicio
  const grid = useMemo(() => {
    const out: Record<string, { curso: HorarioMaestroCurso; hora_inicio: string; hora_fin: string; aula: string | null }[]> = {}
    DIAS.forEach((d) => (out[d] = []))
    if (!data) return out
    data.cursos.forEach((c) => {
      c.horarios.forEach((h) => {
        const dia = h.dia_semana.toLowerCase()
        if (!out[dia]) out[dia] = []
        out[dia].push({ curso: c, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, aula: h.aula })
      })
    })
    Object.keys(out).forEach((d) => out[d].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))
    return out
  }, [data])

  const totalBloques = Object.values(grid).reduce((a, b) => a + b.length, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Horario maestro por grado-sección</h1>
          <p className="text-sm text-gray-600">
            Vista semanal de los cursos asignados a cada sección. Los estudiantes nuevos del grado quedan inscritos automáticamente en estos cursos.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sincronizarMatriculas}
            disabled={sincronizando}
            className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-1.5"
            title="Inscribir a todos los estudiantes existentes en los cursos de su grado-sección"
          >
            <Sparkles size={14} /> {sincronizando ? 'Sincronizando...' : 'Sincronizar matrículas'}
          </button>
          <Link
            to="/asignaciones"
            className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-700 hover:text-[#1A1A1A] inline-flex items-center gap-1.5"
          >
            Editar asignaciones <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}
      {resultadoSync && (
        <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D] inline-flex items-center gap-2">
          <CheckCircle2 size={14} /> {resultadoSync}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 flex items-center gap-5">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Grado</label>
          <div className="flex gap-1.5">
            {GRADOS.map((g) => (
              <button
                key={g}
                onClick={() => setGrado(g)}
                className={`h-9 px-4 rounded-lg text-xs font-bold transition ${
                  g === grado ? 'bg-inei-600 text-white' : 'bg-surface-muted text-gray-600 hover:bg-border-softer'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Sección</label>
          <div className="flex gap-1.5">
            {SECCIONES.map((s) => (
              <button
                key={s}
                onClick={() => setSeccion(s)}
                className={`h-9 w-9 rounded-lg text-xs font-bold transition ${
                  s === seccion ? 'bg-inei-600 text-white' : 'bg-surface-muted text-gray-600 hover:bg-border-softer'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-6 px-5 border-l border-border-soft">
            <Mini label="Cursos" value={data.cursos.length} icon={BookOpen} />
            <Mini label="Bloques/sem" value={totalBloques} icon={Clock} />
            <Mini label="Estudiantes" value={data.estudiantes} icon={GraduationCap} />
          </div>
        )}
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando horario...</div>}

      {!loading && data && data.cursos.length === 0 && (
        <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
          <CalendarDays size={36} className="text-gray-300" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-[#1A1A1A]">No hay cursos para {grado}-{seccion}</h3>
            <p className="text-xs text-gray-500">
              Primero crea los cursos del grado-sección desde la sección <Link to="/cursos" className="text-inei-600 font-semibold">Cursos</Link>.
            </p>
          </div>
        </div>
      )}

      {!loading && data && data.cursos.length > 0 && totalBloques === 0 && (
        <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] px-4 py-3 text-xs text-[#92400E] flex items-center gap-2">
          <AlertCircle size={16} />
          <span>
            Los cursos existen pero no tienen horarios asignados. Asígnalos desde <Link to="/asignaciones" className="font-bold underline">Asignaciones</Link>.
          </span>
        </div>
      )}

      {!loading && data && data.cursos.length > 0 && (
        <>
          <div className="grid grid-cols-5 gap-3">
            {DIAS.map((dia) => (
              <div key={dia} className="bg-white rounded-2xl overflow-hidden flex flex-col">
                <div className="bg-[#1A1A1A] text-white px-4 py-2.5 text-xs font-bold uppercase text-center">
                  {DIA_LABEL[dia]}
                </div>
                <div className="p-2 flex flex-col gap-1.5 min-h-[300px]">
                  {grid[dia].length === 0 && (
                    <div className="py-8 text-center text-[10px] text-gray-300">Sin clases</div>
                  )}
                  {grid[dia].map((b, i) => {
                    const c = cursoColor.get(b.curso.id) ?? CURSO_COLORS[0]
                    return (
                      <div
                        key={i}
                        className="rounded-lg p-2.5 flex flex-col gap-1 border-l-4"
                        style={{ background: c.bg, borderColor: c.border }}
                      >
                        <span className="text-[10px] font-bold inline-flex items-center gap-1" style={{ color: c.text }}>
                          <Clock size={10} /> {b.hora_inicio.slice(0, 5)} - {b.hora_fin.slice(0, 5)}
                        </span>
                        <span className="text-[12px] font-bold leading-tight" style={{ color: c.text }}>
                          {b.curso.nombre}
                        </span>
                        <span className="text-[10px]" style={{ color: c.text }}>
                          {b.curso.codigo}
                        </span>
                        {b.aula && (
                          <span className="text-[10px] inline-flex items-center gap-1" style={{ color: c.text }}>
                            <MapPin size={10} /> {b.aula}
                          </span>
                        )}
                        {b.curso.docente && (
                          <span className="text-[10px] truncate opacity-75" style={{ color: c.text }}>
                            {b.curso.docente}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Lista de cursos de {grado}-{seccion}</h2>
            <p className="text-[11px] text-gray-500">
              Estos son los cursos en los que se inscribe automáticamente cualquier estudiante asignado al {grado}-{seccion}.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {data.cursos.map((c) => {
                const color = cursoColor.get(c.id) ?? CURSO_COLORS[0]
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-softer">
                    <div
                      className="h-10 w-10 rounded-lg grid place-items-center font-bold text-sm"
                      style={{ background: color.bg, color: color.text }}
                    >
                      {c.nombre.charAt(0)}
                    </div>
                    <div className="flex flex-col leading-tight flex-1 min-w-0">
                      <span className="text-xs font-bold text-[#1A1A1A] truncate">{c.nombre}</span>
                      <span className="text-[10px] text-gray-400">{c.codigo} · {c.docente ?? 'Sin docente'}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {c.horarios.length} {c.horarios.length === 1 ? 'bloque' : 'bloques'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-inei-50 border border-inei-200 rounded-xl p-4 flex items-start gap-3">
            <UsersIcon size={18} className="text-inei-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-inei-700">Inscripción automática</span>
              <span className="text-[11px] text-inei-700/80">
                Cuando un estudiante se asigna al {grado}-{seccion} (desde una solicitud aprobada o desde Usuarios),
                se le inscribe automáticamente en estos {data.cursos.length} cursos. Los horarios y aulas se muestran en su vista de horario semanal.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Mini({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Clock }) {
  return (
    <div className="flex flex-col leading-none gap-1">
      <span className="text-[10px] uppercase font-bold text-gray-400 inline-flex items-center gap-1">
        <Icon size={11} /> {label}
      </span>
      <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
    </div>
  )
}
