import { useEffect, useState } from 'react'
import { Plus, X, FileText, Calendar, Trophy, Trash2, ListChecks, Pencil } from 'lucide-react'
import Pill from '../components/Pill'
import { api, type CursoDTO, type PreguntaInput, type TareaDTO, type TipoTarea } from '../lib/api'

type PreguntaTipo = PreguntaInput['tipo']
const tipoPreguntaLabel: Record<PreguntaTipo, string> = {
  opcion_multiple: 'Opción múltiple',
  respuesta_corta: 'Respuesta corta',
  desarrollo: 'Desarrollo',
}

const tipoLabel: Record<TipoTarea, string> = {
  tarea: 'Tarea',
  evaluacion: 'Evaluación',
  examen: 'Examen',
}

const tipoVariant: Record<TipoTarea, 'success' | 'warning' | 'danger'> = {
  tarea: 'success',
  evaluacion: 'warning',
  examen: 'danger',
}

export default function Tareas() {
  const [tareas, setTareas] = useState<TareaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TareaDTO | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.tareas()
      .then((r) => setTareas(r.tareas))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar tareas'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Tareas y evaluaciones</h1>
          <p className="text-sm text-gray-600">
            Crea y administra tareas, evaluaciones y exámenes para tus cursos
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nueva tarea
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="grid grid-cols-[100px_1fr_1.2fr_140px_90px_90px_70px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Tipo</span>
          <span>Título</span>
          <span>Curso</span>
          <span>Fecha límite</span>
          <span>Puntaje</span>
          <span>Estado</span>
          <span></span>
        </div>

        {loading && (
          <div className="py-10 text-center text-xs text-gray-400">Cargando tareas...</div>
        )}
        {!loading && tareas.length === 0 && (
          <div className="py-10 text-center text-xs text-gray-400">
            Aún no hay tareas creadas. Pulsa "Nueva tarea" para registrar la primera.
          </div>
        )}

        {tareas.map((t, i) => (
          <div key={t.id}>
            <div className="grid grid-cols-[100px_1fr_1.2fr_140px_90px_90px_70px] gap-3 min-h-14 px-3.5 items-center py-2">
              <Pill variant={tipoVariant[t.tipo]} showDot={false}>
                {tipoLabel[t.tipo]}
              </Pill>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.titulo}</span>
                {t.descripcion && (
                  <span className="text-[10px] text-gray-400 line-clamp-1">{t.descripcion}</span>
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  {t.curso.codigo} · {t.curso.nombre}
                </span>
                <span className="text-[10px] text-gray-400">{t.curso.docente}</span>
              </div>
              <span className="text-xs text-gray-600">{formatFecha(t.fecha_limite)}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#1A1A1A]">{t.puntaje_maximo} pts</span>
                {t.preguntas_count != null && t.preguntas_count > 0 && (
                  <span className="h-5 px-1.5 inline-flex items-center gap-1 rounded text-[10px] font-bold bg-inei-100 text-inei-600">
                    <ListChecks size={10} /> {t.preguntas_count}
                  </span>
                )}
              </div>
              <Pill variant={t.publicada ? 'success' : 'muted'}>
                {t.publicada ? 'Publicada' : 'Borrador'}
              </Pill>
              <div className="flex items-center gap-2 text-gray-400">
                <button onClick={() => { setEditing(t); setModalOpen(true) }} className="hover:text-[#1A1A1A]"><Pencil size={14} /></button>
                <button onClick={async () => {
                  if (!confirm(`¿Eliminar la tarea "${t.titulo}"?`)) return
                  try { await api.eliminarTarea(t.id); load() } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
                }} className="hover:text-inei-600"><Trash2 size={14} /></button>
              </div>
            </div>
            {i < tareas.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>

      {modalOpen && (
        <NuevaTareaModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onCreated={() => { setModalOpen(false); setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function NuevaTareaModal({ editing, onClose, onCreated }: { editing: TareaDTO | null; onClose: () => void; onCreated: () => void }) {
  const isEdit = !!editing
  const [cursos, setCursos] = useState<CursoDTO[]>([])
  const [form, setForm] = useState({
    curso_id: editing?.curso.id ?? 0,
    tipo: (editing?.tipo ?? 'tarea') as TipoTarea,
    titulo: editing?.titulo ?? '',
    descripcion: editing?.descripcion ?? '',
    fecha_limite: editing?.fecha_limite ?? '',
    puntaje_maximo: editing?.puntaje_maximo ?? 20,
    publicada: editing?.publicada ?? true,
  })
  const [preguntas, setPreguntas] = useState<PreguntaInput[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const addPregunta = () => {
    setPreguntas((s) => [...s, { enunciado: '', tipo: 'opcion_multiple', puntaje: 1, opciones: ['', '', '', ''] }])
  }
  const removePregunta = (idx: number) => {
    setPreguntas((s) => s.filter((_, i) => i !== idx))
  }
  const updatePregunta = (idx: number, patch: Partial<PreguntaInput>) => {
    setPreguntas((s) => s.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  useEffect(() => {
    api.cursos().then((r) => {
      const activos = r.cursos.filter((c) => c.estado)
      setCursos(activos)
      if (!isEdit && activos[0]) setForm((f) => ({ ...f, curso_id: activos[0].id }))
    })
    if (!isEdit && !form.fecha_limite) {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      d.setHours(8, 0, 0, 0)
      const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      setForm((f) => ({ ...f, fecha_limite: iso }))
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setErr(null)
          if (!form.curso_id) {
            setErr('Selecciona un curso')
            return
          }
          setSaving(true)
          try {
            if (isEdit && editing) {
              await api.actualizarTarea(editing.id, {
                titulo: form.titulo,
                descripcion: form.descripcion || undefined,
                fecha_limite: form.fecha_limite,
                puntaje_maximo: form.puntaje_maximo,
                publicada: form.publicada,
              })
            } else {
              await api.crearTarea({
                curso_id: form.curso_id,
                tipo: form.tipo,
                titulo: form.titulo,
                descripcion: form.descripcion || undefined,
                fecha_limite: form.fecha_limite,
                puntaje_maximo: form.puntaje_maximo,
                publicada: form.publicada,
                preguntas: preguntas.length > 0 ? preguntas.filter((p) => p.enunciado.trim()) : undefined,
              })
            }
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'No se pudo crear la tarea')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-inei-100 grid place-items-center">
              <FileText size={18} className="text-inei-600" />
            </div>
            <div className="flex flex-col leading-tight">
              <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? 'Editar tarea' : 'Nueva tarea'}</h2>
              <span className="text-[11px] text-gray-400">
                {isEdit ? 'Actualiza título, plazo y puntaje (preguntas no editables aquí)' : 'Define la actividad, plazo y puntaje'}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
            {err}
          </div>
        )}

        <Field label="Curso">
          <select
            required
            className="input"
            value={form.curso_id}
            onChange={(e) => setForm({ ...form, curso_id: Number(e.target.value) })}
          >
            {cursos.length === 0 && <option value="0">Cargando cursos...</option>}
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.nombre} ({c.grado}-{c.seccion})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo">
            <select
              className="input"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoTarea })}
            >
              <option value="tarea">Tarea</option>
              <option value="evaluacion">Evaluación</option>
              <option value="examen">Examen</option>
            </select>
          </Field>
          <Field label="Puntaje máximo">
            <div className="input flex items-center gap-2">
              <Trophy size={14} className="text-gray-400" />
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                required
                className="flex-1 bg-transparent focus:outline-none text-sm"
                value={form.puntaje_maximo}
                onChange={(e) => setForm({ ...form, puntaje_maximo: Number(e.target.value) })}
              />
            </div>
          </Field>
          <Field label="Estado">
            <select
              className="input"
              value={form.publicada ? '1' : '0'}
              onChange={(e) => setForm({ ...form, publicada: e.target.value === '1' })}
            >
              <option value="1">Publicada</option>
              <option value="0">Borrador</option>
            </select>
          </Field>
        </div>

        <Field label="Título">
          <input
            required
            className="input"
            maxLength={120}
            placeholder="Práctica calificada 03 · Ecuaciones lineales"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </Field>

        <Field label="Descripción">
          <textarea
            className="input h-24 py-2"
            maxLength={500}
            placeholder="Resuelve los problemas del capítulo 4, ejercicios 1 al 10."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Field>

        <Field label="Fecha y hora límite">
          <div className="input flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="datetime-local"
              required
              className="flex-1 bg-transparent focus:outline-none text-sm"
              value={form.fecha_limite}
              onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
            />
          </div>
        </Field>

        <div className="flex flex-col gap-3 pt-3 border-t border-border-softer">
          <div className="flex items-center justify-between">
            <div className="flex flex-col leading-tight">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ListChecks size={14} className="text-inei-600" />
                Preguntas de la evaluación
              </h3>
              <span className="text-[10px] text-gray-400">
                Opcional · {preguntas.length} preguntas · Puntaje total: {preguntas.reduce((a, p) => a + (Number(p.puntaje) || 0), 0)} pts
              </span>
            </div>
            <button type="button" onClick={addPregunta} className="text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1">
              <Plus size={12} /> Agregar pregunta
            </button>
          </div>

          {preguntas.map((p, idx) => (
            <div key={idx} className="bg-surface-muted rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400">PREGUNTA {idx + 1}</span>
                <button type="button" onClick={() => removePregunta(idx)} className="text-gray-400 hover:text-inei-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className="input bg-white"
                placeholder="Enunciado de la pregunta"
                maxLength={500}
                value={p.enunciado}
                onChange={(e) => updatePregunta(idx, { enunciado: e.target.value })}
              />
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <select
                  className="input bg-white"
                  value={p.tipo}
                  onChange={(e) => updatePregunta(idx, { tipo: e.target.value as PreguntaTipo })}
                >
                  <option value="opcion_multiple">{tipoPreguntaLabel.opcion_multiple}</option>
                  <option value="respuesta_corta">{tipoPreguntaLabel.respuesta_corta}</option>
                  <option value="desarrollo">{tipoPreguntaLabel.desarrollo}</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="input bg-white"
                  placeholder="Puntaje"
                  value={p.puntaje ?? 1}
                  onChange={(e) => updatePregunta(idx, { puntaje: Number(e.target.value) })}
                />
              </div>
              {p.tipo === 'opcion_multiple' && (
                <div className="grid grid-cols-2 gap-1.5 pl-3">
                  {(p.opciones ?? ['', '', '', '']).map((op, oi) => (
                    <input
                      key={oi}
                      className="h-8 px-2 text-xs rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-inei-600"
                      placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                      value={op}
                      onChange={(e) => {
                        const ops = [...(p.opciones ?? ['', '', '', ''])]
                        ops[oi] = e.target.value
                        updatePregunta(idx, { opciones: ops })
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 hover:text-[#1A1A1A]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </form>
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

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yy = d.getFullYear().toString().slice(-2)
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${dd}/${mm}/${yy} · ${hh}:${mi}`
}
