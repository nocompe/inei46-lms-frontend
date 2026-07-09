import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, GraduationCap, ClipboardList, FileText, School } from 'lucide-react'
import { api, type CursoDTO, type TareaDTO, type UsuarioBreve, type ObservacionDTO, type CitacionDTO, type PagoDTO } from '../lib/api'

export default function AdminReportes() {
  const [cursos, setCursos] = useState<CursoDTO[]>([])
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [padres, setPadres] = useState<UsuarioBreve[]>([])
  const [tareas, setTareas] = useState<TareaDTO[]>([])
  const [observaciones, setObservaciones] = useState<ObservacionDTO[]>([])
  const [citaciones, setCitaciones] = useState<CitacionDTO[]>([])
  const [pagos, setPagos] = useState<PagoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [obsLoading, setObsLoading] = useState(false)
  const [citLoading, setCitLoading] = useState(false)
  const [pagosLoading, setPagosLoading] = useState(false)
  const [boletaEst, setBoletaEst] = useState('')
  const [repGrado, setRepGrado] = useState('')
  const [repSeccion, setRepSeccion] = useState('')
  const [generando, setGenerando] = useState<string | null>(null)
  const [obsFilter, setObsFilter] = useState({ estudianteId: '', docenteId: '', tipo: '', prioridad: '' })
  const [citFilter, setCitFilter] = useState({ padreId: '', docenteId: '', estado: '', motivo: '' })
  const [pagosFilter, setPagosFilter] = useState({ estudianteId: '', estado: '', concepto: '' })

  const generarBoleta = async () => {
    if (!boletaEst) return
    setGenerando('boleta')
    try { await api.descargarBoleta(Number(boletaEst)) }
    catch (e) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setGenerando(null) }
  }

  const generarMatriculados = async () => {
    if (!repGrado || !repSeccion) return
    setGenerando('matriculados')
    try { await api.descargarReporteMatriculados(repGrado, repSeccion) }
    catch (e) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setGenerando(null) }
  }

  const loadObservaciones = async () => {
    setObsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (obsFilter.estudianteId) params.estudiante_id = obsFilter.estudianteId
      if (obsFilter.docenteId) params.docente_id = obsFilter.docenteId
      if (obsFilter.tipo) params.tipo = obsFilter.tipo
      if (obsFilter.prioridad) params.prioridad = obsFilter.prioridad
      const result = await api.observaciones(params)
      setObservaciones(result.observaciones)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error cargando observaciones')
    } finally {
      setObsLoading(false)
    }
  }

  const loadCitaciones = async () => {
    setCitLoading(true)
    try {
      const params: Record<string, string> = {}
      if (citFilter.padreId) params.padre_id = citFilter.padreId
      if (citFilter.docenteId) params.docente_id = citFilter.docenteId
      if (citFilter.estado) params.estado = citFilter.estado
      if (citFilter.motivo) params.motivo = citFilter.motivo
      const result = await api.citaciones(params)
      setCitaciones(result.citaciones)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error cargando citaciones')
    } finally {
      setCitLoading(false)
    }
  }

  const loadPagos = async () => {
    setPagosLoading(true)
    try {
      const params: Record<string, string> = {}
      if (pagosFilter.estudianteId) params.estudiante_id = pagosFilter.estudianteId
      if (pagosFilter.estado) params.estado = pagosFilter.estado
      if (pagosFilter.concepto) params.concepto = pagosFilter.concepto
      const result = await api.pagos(params)
      setPagos(result.pagos)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error cargando pagos')
    } finally {
      setPagosLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([
      api.cursos(),
      api.usuariosPorRol('docente'),
      api.usuariosPorRol('estudiante'),
      api.usuariosPorRol('padre'),
      api.tareas(),
    ]).then(([c, d, e, p, t]) => {
      setCursos(c.cursos)
      setDocentes(d.users)
      setEstudiantes(e.users)
      setPadres(p.users)
      setTareas(t.tareas)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) {
      loadObservaciones()
      loadCitaciones()
      loadPagos()
    }
  }, [loading])

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

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1A1A1A]">Observaciones</h2>
                  <p className="text-[11px] text-gray-400">Filtra por estudiante, docente, tipo o prioridad</p>
                </div>
                <button
                  type="button"
                  onClick={loadObservaciones}
                  disabled={obsLoading}
                  className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-xs font-semibold px-3"
                >
                  {obsLoading ? 'Cargando…' : 'Aplicar filtro'}
                </button>
              </div>
              <div className="grid gap-2">
                <select className="input text-sm" value={obsFilter.estudianteId} onChange={(e) => setObsFilter((p) => ({ ...p, estudianteId: e.target.value }))}>
                  <option value="">Todos los estudiantes</option>
                  {estudiantes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
                <select className="input text-sm" value={obsFilter.docenteId} onChange={(e) => setObsFilter((p) => ({ ...p, docenteId: e.target.value }))}>
                  <option value="">Todos los docentes</option>
                  {docentes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input text-sm" value={obsFilter.tipo} onChange={(e) => setObsFilter((p) => ({ ...p, tipo: e.target.value }))}>
                    <option value="">Todos los tipos</option>
                    <option value="academica">Académica</option>
                    <option value="conducta">Conducta</option>
                    <option value="asistencia">Asistencia</option>
                    <option value="otra">Otra</option>
                  </select>
                  <select className="input text-sm" value={obsFilter.prioridad} onChange={(e) => setObsFilter((p) => ({ ...p, prioridad: e.target.value }))}>
                    <option value="">Todas las prioridades</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-gray-600">
                  <thead className="text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="pb-2 pr-3">Estudiante</th>
                      <th className="pb-2 pr-3">Docente</th>
                      <th className="pb-2 pr-3">Tipo</th>
                      <th className="pb-2 pr-3">Prioridad</th>
                      <th className="pb-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observaciones.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-400">No hay observaciones</td></tr>
                    ) : observaciones.slice(0, 10).map((o) => (
                      <tr key={o.id} className="border-t border-border-softer last:border-b">
                        <td className="py-2 pr-3">{o.estudiante?.nombre ?? '—'}</td>
                        <td className="py-2 pr-3">{o.docente ?? '—'}</td>
                        <td className="py-2 pr-3 capitalize">{o.tipo}</td>
                        <td className="py-2 pr-3 capitalize">{o.prioridad}</td>
                        <td className="py-2">{o.fecha ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1A1A1A]">Citaciones</h2>
                  <p className="text-[11px] text-gray-400">Filtra por padre, docente, estado o motivo</p>
                </div>
                <button
                  type="button"
                  onClick={loadCitaciones}
                  disabled={citLoading}
                  className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-xs font-semibold px-3"
                >
                  {citLoading ? 'Cargando…' : 'Aplicar filtro'}
                </button>
              </div>
              <div className="grid gap-2">
                <select className="input text-sm" value={citFilter.padreId} onChange={(e) => setCitFilter((p) => ({ ...p, padreId: e.target.value }))}>
                  <option value="">Todos los padres</option>
                  {padres.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
                <select className="input text-sm" value={citFilter.docenteId} onChange={(e) => setCitFilter((p) => ({ ...p, docenteId: e.target.value }))}>
                  <option value="">Todos los docentes</option>
                  {docentes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input text-sm" value={citFilter.estado} onChange={(e) => setCitFilter((p) => ({ ...p, estado: e.target.value }))}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="completada">Completada</option>
                  </select>
                  <input className="input text-sm" placeholder="Texto en motivo" value={citFilter.motivo} onChange={(e) => setCitFilter((p) => ({ ...p, motivo: e.target.value }))} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-gray-600">
                  <thead className="text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="pb-2 pr-3">Padre</th>
                      <th className="pb-2 pr-3">Estudiante</th>
                      <th className="pb-2 pr-3">Docente</th>
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citaciones.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-400">No hay citaciones</td></tr>
                    ) : citaciones.slice(0, 10).map((c) => (
                      <tr key={c.id} className="border-t border-border-softer last:border-b">
                        <td className="py-2 pr-3">{c.padre ?? '—'}</td>
                        <td className="py-2 pr-3">{c.estudiante ?? '—'}</td>
                        <td className="py-2 pr-3">{c.docente ?? '—'}</td>
                        <td className="py-2 pr-3">{c.fecha ?? '—'}</td>
                        <td className="py-2 capitalize">{c.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1A1A1A]">Pagos</h2>
                  <p className="text-[11px] text-gray-400">Filtra por estudiante, estado o concepto</p>
                </div>
                <button
                  type="button"
                  onClick={loadPagos}
                  disabled={pagosLoading}
                  className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-xs font-semibold px-3"
                >
                  {pagosLoading ? 'Cargando…' : 'Aplicar filtro'}
                </button>
              </div>
              <div className="grid gap-2">
                <select className="input text-sm" value={pagosFilter.estudianteId} onChange={(e) => setPagosFilter((p) => ({ ...p, estudianteId: e.target.value }))}>
                  <option value="">Todos los estudiantes</option>
                  {estudiantes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
                <select className="input text-sm" value={pagosFilter.estado} onChange={(e) => setPagosFilter((p) => ({ ...p, estado: e.target.value }))}>
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                  <option value="anulado">Anulado</option>
                </select>
                <input className="input text-sm" placeholder="Concepto" value={pagosFilter.concepto} onChange={(e) => setPagosFilter((p) => ({ ...p, concepto: e.target.value }))} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-gray-600">
                  <thead className="text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="pb-2 pr-3">Estudiante</th>
                      <th className="pb-2 pr-3">Concepto</th>
                      <th className="pb-2 pr-3">Monto</th>
                      <th className="pb-2 pr-3">Vencimiento</th>
                      <th className="pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-400">No hay pagos</td></tr>
                    ) : pagos.slice(0, 10).map((p) => (
                      <tr key={p.id} className="border-t border-border-softer last:border-b">
                        <td className="py-2 pr-3">{estudiantes.find((e) => e.id === p.id_estudiante)?.nombres ?? 'Estudiante'} {estudiantes.find((e) => e.id === p.id_estudiante)?.apellidos ?? ''}</td>
                        <td className="py-2 pr-3">{p.concepto}</td>
                        <td className="py-2 pr-3">S/ {p.monto.toFixed(2)}</td>
                        <td className="py-2 pr-3">{p.fecha_vencimiento ?? '—'}</td>
                        <td className="py-2 capitalize">{p.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <School size={18} className="text-inei-600" />
              <h2 className="text-sm font-bold text-[#1A1A1A]">Generar reportes en PDF</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Reporte 02 — Boleta de notas */}
              <div className="border border-border-soft rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Boleta de notas</h3>
                  <p className="text-[11px] text-gray-400">Calificaciones del estudiante por curso</p>
                </div>
                <select className="input text-sm" value={boletaEst} onChange={(e) => setBoletaEst(e.target.value)}>
                  <option value="">Selecciona un estudiante…</option>
                  {estudiantes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} — {e.grado ?? '—'} {e.seccion ?? ''}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={generarBoleta}
                  disabled={!boletaEst || generando === 'boleta'}
                  className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <FileText size={15} /> {generando === 'boleta' ? 'Generando…' : 'Descargar boleta PDF'}
                </button>
              </div>

              {/* Reporte 03 — Matriculados por grado */}
              <div className="border border-border-soft rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1A1A1A]">Nómina de matriculados</h3>
                  <p className="text-[11px] text-gray-400">Estudiantes matriculados por grado y sección</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input text-sm" placeholder="Grado (ej. 3ro)" value={repGrado} onChange={(e) => setRepGrado(e.target.value)} />
                  <input className="input text-sm" placeholder="Sección (ej. A)" value={repSeccion} onChange={(e) => setRepSeccion(e.target.value)} />
                </div>
                <button
                  type="button"
                  onClick={generarMatriculados}
                  disabled={!repGrado || !repSeccion || generando === 'matriculados'}
                  className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <FileText size={15} /> {generando === 'matriculados' ? 'Generando…' : 'Descargar nómina PDF'}
                </button>
              </div>
            </div>
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
