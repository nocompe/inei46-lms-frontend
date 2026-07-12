import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Save, FileText, ListChecks, X, CheckCircle2, XCircle } from 'lucide-react'
import Pill from '../components/Pill'
import {
  api, fileUrl, loadAuth,
  type EntregaItem, type EntregasTareaDTO, type MiTareaDTO, type RespuestasEvaluacionDocenteDTO,
} from '../lib/api'

type RowState = { puntaje: string; observacion: string; saving: boolean; saved: boolean }

export default function Calificaciones() {
  const auth = loadAuth()
  const [params, setParams] = useSearchParams()
  const [tareas, setTareas] = useState<MiTareaDTO[]>([])
  const [tareaSeleccionada, setTareaSeleccionada] = useState<number | null>(
    params.get('tarea_id') ? Number(params.get('tarea_id')) : null
  )
  const [data, setData] = useState<EntregasTareaDTO | null>(null)
  const [rows, setRows] = useState<Record<number, RowState>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revisando, setRevisando] = useState<{ tareaId: number; estudiante: EntregaItem['estudiante'] } | null>(null)

  useEffect(() => {
    if (!auth) return
    api.miTareas(auth.id).then((r) => {
      setTareas(r.tareas)
      if (!tareaSeleccionada && r.tareas[0]) {
        setTareaSeleccionada(r.tareas[0].id)
      }
    })
  }, [auth?.id])

  useEffect(() => {
    if (!tareaSeleccionada) return
    setLoading(true)
    setError(null)
    api.entregasPorTarea(tareaSeleccionada)
      .then((d) => {
        setData(d)
        const r: Record<number, RowState> = {}
        d.entregas.forEach((e) => {
          r[e.id] = {
            puntaje: e.calificacion?.puntaje.toString() ?? '',
            observacion: e.calificacion?.observacion ?? '',
            saving: false,
            saved: false,
          }
        })
        setRows(r)
        setParams({ tarea_id: String(tareaSeleccionada) })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar entregas'))
      .finally(() => setLoading(false))
  }, [tareaSeleccionada])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const guardarFila = async (entrega: EntregaItem) => {
    const row = rows[entrega.id]
    if (!row || !data) return
    const num = Number(row.puntaje)
    if (Number.isNaN(num) || num < 0 || num > data.tarea.puntaje_maximo) {
      setError(`El puntaje debe estar entre 0 y ${data.tarea.puntaje_maximo}`)
      return
    }
    setError(null)
    setRows((s) => ({ ...s, [entrega.id]: { ...s[entrega.id], saving: true, saved: false } }))
    try {
      await api.calificar({
        entrega_id: entrega.id,
        puntaje: num,
        observacion: row.observacion || undefined,
        docente_id: auth.id,
      })
      setRows((s) => ({ ...s, [entrega.id]: { ...s[entrega.id], saving: false, saved: true } }))
      const refreshed = await api.entregasPorTarea(tareaSeleccionada!)
      setData(refreshed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la calificación')
      setRows((s) => ({ ...s, [entrega.id]: { ...s[entrega.id], saving: false } }))
    }
  }

  const tareaActual = data?.tarea

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Calificaciones</h1>
          <p className="text-sm text-gray-600">
            Selecciona una tarea o evaluación y registra la nota de cada estudiante.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Tarea o evaluación</label>
            <select
              className="input"
              value={tareaSeleccionada ?? ''}
              onChange={(e) => setTareaSeleccionada(Number(e.target.value))}
            >
              {tareas.length === 0 && <option value="">No tienes tareas creadas</option>}
              {tareas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.curso.codigo} · {t.titulo} ({t.tipo}, máx {t.puntaje_maximo})
                </option>
              ))}
            </select>
          </div>
          {tareaActual && (
            <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface-muted">
              <FileText size={16} className="text-inei-600" />
              <span className="text-xs font-semibold text-[#1A1A1A]">
                Máx: {tareaActual.puntaje_maximo} pts
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-[1.4fr_140px_1fr_120px_1.4fr_120px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>Estudiante</span>
            <span>Entrega</span>
            <span>Contenido</span>
            <span>Puntaje</span>
            <span>Observación</span>
            <span>Acción</span>
          </div>

          {loading && (
            <div className="py-8 text-center text-xs text-gray-400">Cargando entregas...</div>
          )}
          {!loading && data && data.entregas.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">
              Aún no hay entregas para esta tarea.
            </div>
          )}

          {data?.entregas.map((e, idx) => {
            const row = rows[e.id]
            return (
              <div key={e.id}>
                <div className="grid grid-cols-[1.4fr_140px_1fr_120px_1.4fr_120px] gap-3 min-h-16 px-3.5 items-center py-2">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-[#1A1A1A]">
                      {e.estudiante.nombres} {e.estudiante.apellidos}
                    </span>
                    <span className="text-[10px] text-gray-400">DNI {e.estudiante.dni}</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-600">{formatFecha(e.fecha_entrega)}</span>
                    <Pill variant={e.estado === 'atrasada' ? 'warning' : 'success'} showDot={false}>
                      {e.estado}
                    </Pill>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-600 line-clamp-2">
                      {e.contenido ?? <em className="text-gray-400">Sin contenido</em>}
                    </span>
                    {e.archivo_url && (
                      <a
                        href={fileUrl(e.archivo_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1 w-fit"
                      >
                        📎 Ver archivo adjunto
                      </a>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={tareaActual?.puntaje_maximo ?? 20}
                    step={0.5}
                    placeholder="—"
                    value={row?.puntaje ?? ''}
                    onChange={(ev) =>
                      setRows((s) => ({
                        ...s,
                        [e.id]: { ...s[e.id], puntaje: ev.target.value, saved: false },
                      }))
                    }
                    className="h-9 px-3 rounded-md bg-surface-muted text-sm font-bold text-[#1A1A1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-inei-600"
                  />
                  <input
                    type="text"
                    placeholder="Observación (opcional)"
                    value={row?.observacion ?? ''}
                    onChange={(ev) =>
                      setRows((s) => ({
                        ...s,
                        [e.id]: { ...s[e.id], observacion: ev.target.value, saved: false },
                      }))
                    }
                    className="h-9 px-3 rounded-md bg-surface-muted text-xs placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-inei-600"
                  />
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => guardarFila(e)}
                      disabled={row?.saving}
                      className={`h-9 px-3 rounded-md text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 ${
                        row?.saved
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-inei-600 hover:bg-inei-700 text-white'
                      }`}
                    >
                      <Save size={14} />
                      {row?.saving ? '...' : row?.saved ? 'Guardado' : 'Guardar'}
                    </button>
                    {tareaActual && tareaActual.tipo !== 'tarea' && (
                      <button
                        onClick={() => setRevisando({ tareaId: tareaActual.id, estudiante: e.estudiante })}
                        className="h-8 px-3 rounded-md border border-inei-600 text-inei-600 hover:bg-inei-50 text-[11px] font-semibold inline-flex items-center justify-center gap-1.5"
                        title="Revisar respuestas y calificar preguntas de desarrollo"
                      >
                        <ListChecks size={13} /> Respuestas
                      </button>
                    )}
                  </div>
                </div>
                {idx < data.entregas.length - 1 && <div className="h-px bg-border-softer" />}
              </div>
            )
          })}
        </div>

        {data && data.entregas.length > 0 && (
          <div className="flex items-center justify-end gap-4 pt-2 border-t border-border-softer">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ClipboardCheck size={14} className="text-gray-400" />
              {data.entregas.filter((e) => e.calificacion).length} de {data.entregas.length} calificadas
            </div>
          </div>
        )}
      </div>

      {revisando && (
        <RespuestasModal
          tareaId={revisando.tareaId}
          estudiante={revisando.estudiante}
          onClose={() => setRevisando(null)}
        />
      )}
    </div>
  )
}

/** Modal del docente: respuestas del estudiante, con calificación manual de las de desarrollo. */
function RespuestasModal({
  tareaId,
  estudiante,
  onClose,
}: {
  tareaId: number
  estudiante: EntregaItem['estudiante']
  onClose: () => void
}) {
  const [data, setData] = useState<RespuestasEvaluacionDocenteDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [puntajes, setPuntajes] = useState<Record<number, string>>({})
  const [guardando, setGuardando] = useState<number | null>(null)

  const cargar = () => {
    api.respuestasEvaluacion(tareaId, estudiante.id)
      .then((d) => {
        setData(d)
        const p: Record<number, string> = {}
        d.respuestas.forEach((r) => {
          if (r.respuesta_id && r.tipo === 'desarrollo') p[r.respuesta_id] = r.puntaje_obtenido?.toString() ?? ''
        })
        setPuntajes(p)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar respuestas'))
  }

  useEffect(() => { cargar() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tareaId, estudiante.id])

  const calificar = async (respuestaId: number, max: number) => {
    const num = Number(puntajes[respuestaId])
    if (Number.isNaN(num) || num < 0 || num > max) {
      setError(`El puntaje debe estar entre 0 y ${max}`)
      return
    }
    setError(null)
    setGuardando(respuestaId)
    try {
      await api.calificarRespuesta(respuestaId, num)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo calificar')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Respuestas de la evaluación</h2>
            <span className="text-[11px] text-gray-400">
              {estudiante.nombres} {estudiante.apellidos} · DNI {estudiante.dni}
            </span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}
        {!data && !error && <div className="py-8 text-center text-xs text-gray-400">Cargando respuestas...</div>}

        {data && data.respuestas.every((r) => !r.respuesta_id) && (
          <div className="py-8 text-center text-xs text-gray-400">El estudiante aún no rinde esta evaluación.</div>
        )}

        {data?.respuestas.filter((r) => r.respuesta_id).map((r) => (
          <div key={r.respuesta_id} className="border border-border-soft rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-semibold text-[#1A1A1A]">
                {r.numero}. {r.enunciado}
              </span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{r.puntaje_maximo} pts</span>
            </div>
            <div className="bg-surface-muted rounded-lg px-3 py-2 text-xs text-gray-700">
              {r.respuesta || <em className="text-gray-400">Sin respuesta</em>}
            </div>

            {r.tipo !== 'desarrollo' ? (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                {r.correcta
                  ? <><CheckCircle2 size={14} className="text-[#15803D]" /><span className="text-[#15803D]">Correcta · {r.puntaje_obtenido} pts (autocalificada)</span></>
                  : <><XCircle size={14} className="text-inei-600" /><span className="text-inei-600">Incorrecta · 0 pts (autocalificada)</span></>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-600">Puntaje:</span>
                <input
                  type="number"
                  min={0}
                  max={r.puntaje_maximo}
                  step={0.5}
                  value={puntajes[r.respuesta_id!] ?? ''}
                  onChange={(ev) => setPuntajes((s) => ({ ...s, [r.respuesta_id!]: ev.target.value }))}
                  className="h-8 w-20 px-2 rounded-md bg-surface-muted text-sm font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-inei-600"
                />
                <span className="text-[11px] text-gray-400">/ {r.puntaje_maximo}</span>
                <button
                  onClick={() => calificar(r.respuesta_id!, r.puntaje_maximo)}
                  disabled={guardando === r.respuesta_id}
                  className="h-8 px-3 rounded-md bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-[11px] font-semibold"
                >
                  {guardando === r.respuesta_id ? '...' : 'Calificar'}
                </button>
              </div>
            )}
          </div>
        ))}

        {data && (
          <div className="flex items-center justify-between pt-2 border-t border-border-softer">
            <span className="text-xs text-gray-500">
              Usa este total como referencia para la nota de la entrega.
            </span>
            <span className="text-sm font-bold text-[#1A1A1A]">
              Total: <span className="text-inei-600">{data.total_obtenido}</span> / {data.tarea.puntaje_maximo}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const yy = d.getFullYear().toString().slice(-2)
  const hh = d.getHours().toString().padStart(2, '0')
  const mi = d.getMinutes().toString().padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}
