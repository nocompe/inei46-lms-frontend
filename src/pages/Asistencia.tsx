import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, Save, Search } from 'lucide-react'
import {
  api,
  loadAuth,
  type AsistenciaEstado,
  type AsistenciaItem,
  type CursoDTO,
} from '../lib/api'

const ESTADOS: { id: AsistenciaEstado; label: string; bg: string; text: string }[] = [
  { id: 'presente',    label: 'Presente',    bg: '#DCFCE7', text: '#15803D' },
  { id: 'tarde',       label: 'Tarde',       bg: '#FEF3C7', text: '#92400E' },
  { id: 'ausente',     label: 'Ausente',     bg: '#FEE2E2', text: '#991B1B' },
  { id: 'justificado', label: 'Justificado', bg: '#E0E7FF', text: '#3730A3' },
]

const hoyIso = () => new Date().toISOString().slice(0, 10)

export default function Asistencia() {
  const auth = loadAuth()
  const [cursos, setCursos] = useState<CursoDTO[]>([])
  const [cursoId, setCursoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(hoyIso())
  const [items, setItems] = useState<AsistenciaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    api.cursos().then((r) => {
      const activos = r.cursos.filter((c) => c.estado)
      setCursos(activos)
      if (activos[0]) setCursoId(activos[0].id)
    })
  }, [])

  const cargar = async () => {
    if (!cursoId) {
      setError('Selecciona un curso')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const data = await api.asistenciaPorCursoFecha(cursoId, fecha)
      setItems(
        data.items.map((it) => ({
          ...it,
          estado: it.estado ?? 'presente',
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el listado')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cursoId) cargar()
  }, [cursoId])

  const setEstado = (estudianteId: number, estado: AsistenciaEstado) => {
    setItems((prev) =>
      prev.map((it) =>
        it.estudiante.id === estudianteId ? { ...it, estado } : it
      )
    )
  }

  const setObs = (estudianteId: number, observacion: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.estudiante.id === estudianteId ? { ...it, observacion } : it
      )
    )
  }

  const marcarTodos = (estado: AsistenciaEstado) => {
    setItems((prev) => prev.map((it) => ({ ...it, estado })))
  }

  const guardar = async () => {
    if (!cursoId) return
    if (items.length === 0) {
      setError('No hay estudiantes matriculados en este curso.')
      return
    }
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const r = await api.guardarAsistencia({
        curso_id: cursoId,
        fecha,
        registrado_por: auth?.id,
        items: items.map((it) => ({
          estudiante_id: it.estudiante.id,
          estado: (it.estado ?? 'presente') as AsistenciaEstado,
          observacion: it.observacion ?? undefined,
        })),
      })
      setSuccess(r.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const conteos = items.reduce(
    (acc, it) => {
      const e = (it.estado ?? 'presente') as AsistenciaEstado
      acc[e] = (acc[e] ?? 0) + 1
      return acc
    },
    {} as Record<AsistenciaEstado, number>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Toma de asistencia</h1>
          <p className="text-sm text-gray-600">
            Selecciona el curso y la fecha. Marca a cada estudiante y guarda el registro.
          </p>
        </div>
        <button
          onClick={guardar}
          disabled={saving || items.length === 0}
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar asistencia'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D]">{success}</div>
      )}

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_220px_auto] gap-3 items-end">
          <Field label="Curso">
            <div className="relative">
              <select
                className="input"
                value={cursoId ?? ''}
                onChange={(e) => setCursoId(Number(e.target.value))}
              >
                {cursos.length === 0 && <option value="">Cargando cursos...</option>}
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} · {c.nombre} ({c.grado}-{c.seccion})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Fecha">
            <div className="input flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                className="flex-1 bg-transparent focus:outline-none text-sm"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </Field>
          <button
            onClick={cargar}
            disabled={loading}
            className="h-11 px-4 rounded-lg bg-[#1A1A1A] hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Search size={16} /> {loading ? 'Cargando...' : 'Cargar'}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border-softer pt-4">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span><strong className="text-[#1A1A1A]">{items.length}</strong> estudiantes</span>
            {ESTADOS.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: e.text }} />
                {e.label}: <strong className="text-[#1A1A1A]">{conteos[e.id] ?? 0}</strong>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Marcar todos:</span>
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                onClick={() => marcarTodos(e.id)}
                className="h-7 px-2.5 rounded-md text-[11px] font-semibold"
                style={{ background: e.bg, color: e.text }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-0">
          <div className="grid grid-cols-[80px_1fr_400px_1fr] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>DNI</span>
            <span>Estudiante</span>
            <span>Estado</span>
            <span>Observación</span>
          </div>

          {items.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-gray-400">
              Selecciona un curso para ver la lista de estudiantes matriculados.
            </div>
          )}

          {items.map((it, idx) => {
            const estado = (it.estado ?? 'presente') as AsistenciaEstado
            return (
              <div key={it.estudiante.id}>
                <div className="grid grid-cols-[80px_1fr_400px_1fr] gap-3 min-h-14 px-3.5 items-center py-2">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{it.estudiante.dni}</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-[#1A1A1A]">
                      {it.estudiante.nombres} {it.estudiante.apellidos}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {it.estudiante.grado ?? '—'} · {it.estudiante.seccion ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ESTADOS.map((e) => {
                      const active = e.id === estado
                      return (
                        <button
                          key={e.id}
                          onClick={() => setEstado(it.estudiante.id, e.id)}
                          className="h-8 px-3 rounded-md text-[11px] font-semibold transition border"
                          style={{
                            background: active ? e.bg : 'transparent',
                            color: active ? e.text : '#9CA3AF',
                            borderColor: active ? e.bg : '#E5E7EB',
                          }}
                        >
                          {e.label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    value={it.observacion ?? ''}
                    onChange={(e) => setObs(it.estudiante.id, e.target.value)}
                    placeholder="Observación (opcional)"
                    className="h-9 px-3 rounded-md bg-surface-muted text-xs placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border focus:border-inei-600"
                  />
                </div>
                {idx < items.length - 1 && <div className="h-px bg-border-softer" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
