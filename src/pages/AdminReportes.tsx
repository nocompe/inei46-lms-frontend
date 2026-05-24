import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, GraduationCap, ClipboardList } from 'lucide-react'
import { api, type CursoDTO, type TareaDTO, type UsuarioBreve } from '../lib/api'

export default function AdminReportes() {
  const [cursos, setCursos] = useState<CursoDTO[]>([])
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [tareas, setTareas] = useState<TareaDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.cursos(),
      api.usuariosPorRol('docente'),
      api.usuariosPorRol('estudiante'),
      api.tareas(),
    ]).then(([c, d, e, t]) => {
      setCursos(c.cursos)
      setDocentes(d.users)
      setEstudiantes(e.users)
      setTareas(t.tareas)
    }).finally(() => setLoading(false))
  }, [])

  const cursosActivos = cursos.filter((c) => c.estado).length
  const tareasPublicadas = tareas.filter((t) => t.publicada).length

  const porGrado = estudiantes.reduce((acc: Record<string, number>, e) => {
    const g = e.grado ?? 'Sin grado'
    acc[g] = (acc[g] ?? 0) + 1
    return acc
  }, {})
  const maxGrado = Math.max(...Object.values(porGrado), 1)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Reportes</h1>
        <p className="text-sm text-gray-600">Métricas y estadísticas generales del sistema</p>
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando reportes...</div>}

      {!loading && (
        <>
          <div className="grid grid-cols-4 gap-3.5">
            <KPI icon={BookOpen} label="Cursos activos" value={`${cursosActivos} / ${cursos.length}`} />
            <KPI icon={GraduationCap} label="Docentes" value={String(docentes.length)} />
            <KPI icon={GraduationCap} label="Estudiantes" value={String(estudiantes.length)} />
            <KPI icon={ClipboardList} label="Tareas publicadas" value={`${tareasPublicadas} / ${tareas.length}`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Top cursos por estudiantes</h2>
              {cursos.slice().sort((a, b) => (b.estudiantes ?? 0) - (a.estudiantes ?? 0)).slice(0, 5).map((c) => {
                const max = Math.max(...cursos.map((x) => x.estudiantes ?? 0), 1)
                const pct = Math.round(((c.estudiantes ?? 0) / max) * 100)
                return (
                  <div key={c.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1A1A1A]">{c.nombre}</span>
                      <span className="text-gray-500">{c.estudiantes ?? 0}</span>
                    </div>
                    <div className="h-1.5 bg-border-softer rounded-full overflow-hidden">
                      <div className="h-1.5 bg-inei-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Distribución por grado</h2>
              {Object.entries(porGrado).sort().map(([g, n]) => (
                <div key={g} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1A1A1A]">{g}</span>
                    <span className="text-gray-500">{n}</span>
                  </div>
                  <div className="h-1.5 bg-border-softer rounded-full overflow-hidden">
                    <div className="h-1.5 bg-[#1A1A1A]" style={{ width: `${(n / maxGrado) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Tareas recientes</h2>
            <div className="grid grid-cols-[1.5fr_1fr_100px_100px] gap-3 h-9 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
              <span>Título</span><span>Curso</span><span>Puntaje</span><span>Estado</span>
            </div>
            {tareas.slice(0, 8).map((t, i) => (
              <div key={t.id}>
                <div className="grid grid-cols-[1.5fr_1fr_100px_100px] gap-3 h-10 px-3 items-center text-xs">
                  <span className="font-semibold text-[#1A1A1A]">{t.titulo}</span>
                  <span className="text-gray-600">{t.curso.codigo} · {t.curso.nombre}</span>
                  <span className="font-bold text-[#1A1A1A]">{t.puntaje_maximo} pts</span>
                  <span className={t.publicada ? 'text-[#15803D]' : 'text-gray-400'}>{t.publicada ? 'Publicada' : 'Borrador'}</span>
                </div>
                {i < Math.min(tareas.length, 8) - 1 && <div className="h-px bg-border-softer" />}
              </div>
            ))}
            {tareas.length === 0 && <div className="py-6 text-center text-xs text-gray-400"><BarChart3 size={28} className="mx-auto mb-2 text-gray-300" />Sin tareas registradas.</div>}
          </div>
        </>
      )}
    </div>
  )
}

function KPI({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-inei-100 grid place-items-center"><Icon size={18} className="text-inei-600" /></div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </div>
  )
}
