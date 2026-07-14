import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, X, Send, Calendar, Trophy, Upload, Paperclip, ListChecks } from 'lucide-react'
import Pill from '../components/Pill'
import { api, loadAuth, type MiTareaDTO, type TipoTarea } from '../lib/api'

const tipoLabel: Record<TipoTarea, string> = {
  tarea: 'Tarea',
  evaluacion: 'Evaluación',
  examen: 'Examen',
}

export default function EstudianteTareas() {
  const auth = loadAuth()
  const [tareas, setTareas] = useState<MiTareaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [entregando, setEntregando] = useState<MiTareaDTO | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = () => {
    if (!auth) return
    setLoading(true)
    api.miTareas(auth.id)
      .then((r) => setTareas(r.tareas))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const pendientes = tareas.filter((t) => !t.mi_entrega)
  const entregadas = tareas.filter((t) => t.mi_entrega)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Tareas y evaluaciones</h1>
        <p className="text-sm text-gray-600">
          {pendientes.length} pendiente(s) · {entregadas.length} entregada(s)
        </p>
      </div>

      {success && (
        <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D]">
          {success}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl py-8 text-center text-xs text-gray-400">
          Cargando tareas...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Column titulo="Por entregar" color="#C8102E" count={pendientes.length}>
            {pendientes.length === 0 && (
              <Empty>No tienes tareas pendientes. ¡Buen trabajo!</Empty>
            )}
            {pendientes.map((t) => (
              <TareaCard
                key={t.id}
                tarea={t}
                onEntregar={() => { setEntregando(t); setSuccess(null) }}
              />
            ))}
          </Column>

          <Column titulo="Entregadas" color="#15803D" count={entregadas.length}>
            {entregadas.length === 0 && <Empty>Aún no entregaste nada.</Empty>}
            {entregadas.map((t) => (
              <TareaCard key={t.id} tarea={t} />
            ))}
          </Column>
        </div>
      )}

      {entregando && (
        <EntregaModal
          tarea={entregando}
          onClose={() => setEntregando(null)}
          onSubmitted={() => {
            setEntregando(null)
            setSuccess(`Entrega registrada para "${entregando.titulo}"`)
            load()
          }}
        />
      )}
    </div>
  )
}

function Column({ titulo, color, count, children }: { titulo: string; color: string; count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <h2 className="text-sm font-bold text-[#1A1A1A]">{titulo}</h2>
        <span className="text-[11px] text-gray-400">({count})</span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl p-8 text-center text-xs text-gray-400">{children}</div>
}

function TareaCard({ tarea, onEntregar }: { tarea: MiTareaDTO; onEntregar?: () => void }) {
  const entrega = tarea.mi_entrega
  const calificacion = entrega?.calificacion
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-gray-400">{tipoLabel[tarea.tipo]}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span className="text-[10px] text-gray-400">{tarea.curso.codigo}</span>
          </div>
          <h3 className="text-[13px] font-bold text-[#1A1A1A] leading-tight">{tarea.titulo}</h3>
          <span className="text-[11px] text-gray-600">{tarea.curso.nombre} · {tarea.curso.docente}</span>
        </div>
        {calificacion ? (
          <div className="flex flex-col items-end leading-none">
            <span className="text-2xl font-bold text-inei-600">{Number(calificacion.puntaje).toFixed(0)}</span>
            <span className="text-[10px] text-gray-400">/ {tarea.puntaje_maximo}</span>
          </div>
        ) : entrega ? (
          <Pill variant="success" showDot={false}>Entregada</Pill>
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-2 border-t border-border-softer">
        <Calendar size={12} />
        <span>{formatFecha(tarea.fecha_limite)}</span>
        <span className="h-1 w-1 rounded-full bg-gray-300" />
        <Trophy size={12} />
        <span>{tarea.puntaje_maximo} pts</span>
      </div>

      {entrega && calificacion?.observacion && (
        <div className="text-[11px] text-gray-600 bg-surface-muted rounded-md px-3 py-2 italic">
          "{calificacion.observacion}"
        </div>
      )}

      {!entrega && tarea.tipo !== 'tarea' && (
        /* Evaluaciones y exámenes se rinden con preguntas y autocalificación. */
        <Link
          to={`/estudiante/evaluaciones/${tarea.id}/rendir`}
          className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <ListChecks size={13} /> Rendir {tipoLabel[tarea.tipo].toLowerCase()}
        </Link>
      )}
      {!entrega && tarea.tipo === 'tarea' && onEntregar && (
        <button
          onClick={onEntregar}
          className="h-9 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <Send size={13} /> Entregar tarea
        </button>
      )}
    </div>
  )
}

function EntregaModal({ tarea, onClose, onSubmitted }: { tarea: MiTareaDTO; onClose: () => void; onSubmitted: () => void }) {
  const auth = loadAuth()
  const [contenido, setContenido] = useState('')
  const [archivoUrl, setArchivoUrl] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const tamanoMb = archivo ? (archivo.size / (1024 * 1024)).toFixed(2) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!auth) return
          if (!contenido.trim() && !archivoUrl.trim() && !archivo) {
            setErr('Escribe contenido, adjunta un archivo o pega un enlace antes de entregar')
            return
          }
          setSaving(true)
          setErr(null)
          try {
            if (archivo) {
              const fd = new FormData()
              fd.append('tarea_id', String(tarea.id))
              fd.append('estudiante_id', String(auth.id))
              if (contenido.trim()) fd.append('contenido', contenido.trim())
              if (archivoUrl.trim()) fd.append('archivo_url', archivoUrl.trim())
              fd.append('archivo', archivo)
              await api.entregarConArchivo(fd)
            } else {
              await api.entregar({
                tarea_id: tarea.id,
                estudiante_id: auth.id,
                contenido: contenido.trim() || undefined,
                archivo_url: archivoUrl.trim() || undefined,
              })
            }
            onSubmitted()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'No se pudo entregar')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-inei-100 grid place-items-center">
              <FileText size={18} className="text-inei-600" />
            </div>
            <div className="flex flex-col leading-tight">
              <h2 className="text-base font-bold text-[#1A1A1A]">Entregar tarea</h2>
              <span className="text-[11px] text-gray-400">{tarea.curso.nombre}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="bg-surface-muted rounded-lg px-3 py-2 flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[#1A1A1A]">{tarea.titulo}</span>
          <span className="text-[11px] text-gray-600">
            Vence: {formatFecha(tarea.fecha_limite)} · {tarea.puntaje_maximo} pts
          </span>
        </div>

        {err && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Contenido / respuesta</label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribe tu respuesta o describe el archivo adjunto..."
            className="h-28 px-3 py-2 rounded-lg bg-surface-muted border border-border-soft text-sm focus:outline-none focus:bg-white focus:border-inei-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Adjuntar archivo (PDF, Word, imagen, ZIP — máx 20 MB)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f && f.size > 20 * 1024 * 1024) {
                setErr('El archivo supera los 20 MB')
                return
              }
              setErr(null)
              setArchivo(f)
            }}
          />
          {!archivo && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-20 rounded-lg border-2 border-dashed border-border-soft hover:border-inei-600 hover:bg-inei-50 flex flex-col items-center justify-center gap-1 text-xs text-gray-500 hover:text-inei-600 transition"
            >
              <Upload size={20} />
              <span>Haz click para seleccionar un archivo</span>
              <span className="text-[10px] text-gray-400">PDF, Word, JPG, PNG, ZIP</span>
            </button>
          )}
          {archivo && (
            <div className="rounded-lg border border-border-soft bg-surface-muted px-3 py-2 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-inei-100 grid place-items-center">
                <Paperclip size={14} className="text-inei-600" />
              </div>
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-xs font-semibold text-[#1A1A1A] truncate">{archivo.name}</span>
                <span className="text-[10px] text-gray-400">{tamanoMb} MB · {archivo.type || 'archivo'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setArchivo(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="text-gray-400 hover:text-inei-600"
                title="Quitar archivo"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">…o pega una URL externa (opcional)</label>
          <input
            value={archivoUrl}
            onChange={(e) => setArchivoUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 hover:text-[#1A1A1A]">Cancelar</button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Send size={14} /> {saving ? 'Enviando...' : 'Entregar'}
          </button>
        </div>
      </form>
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
