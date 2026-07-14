import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Plus,
  FileText,
  Video,
  Presentation,
  Pencil,
  Eye,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Link2,
  Upload,
  Paperclip,
} from 'lucide-react'
import {
  api,
  fileUrl,
  loadAuth,
  type ContenidoCursoDTO,
  type ContenidoItem,
  type ContenidoTipo,
  type MiCurso,
  type UnidadDTO,
} from '../lib/api'

const tipoLabels: Record<ContenidoTipo, string> = {
  texto: 'Texto',
  video: 'Video',
  presentacion: 'Presentación',
  ejercicio: 'Ejercicio',
  pdf: 'PDF',
  cuestionario: 'Cuestionario',
  enlace: 'Enlace',
}

const tipoColor: Record<ContenidoTipo, { bg: string; text: string }> = {
  texto: { bg: '#DBEAFE', text: '#1E40AF' },
  video: { bg: '#DBEAFE', text: '#1E40AF' },
  presentacion: { bg: '#E9D5FF', text: '#6B21A8' },
  ejercicio: { bg: '#FEF3C7', text: '#92400E' },
  pdf: { bg: '#FEE2E2', text: '#991B1B' },
  cuestionario: { bg: '#DCFCE7', text: '#15803D' },
  enlace: { bg: '#F3F4F6', text: '#374151' },
}

const tipoIcon: Record<ContenidoTipo, typeof FileText> = {
  texto: FileText,
  video: Video,
  presentacion: Presentation,
  ejercicio: Pencil,
  pdf: FileText,
  cuestionario: FileText,
  enlace: Link2,
}

export default function DocenteContenido() {
  const auth = loadAuth()
  const [cursos, setCursos] = useState<MiCurso[]>([])
  const [cursoId, setCursoId] = useState<number | null>(null)
  const [data, setData] = useState<ContenidoCursoDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())
  const [modalUnidad, setModalUnidad] = useState(false)
  const [editandoUnidad, setEditandoUnidad] = useState<UnidadDTO | null>(null)
  const [modalContenido, setModalContenido] = useState<UnidadDTO | null>(null)
  const [editandoContenido, setEditandoContenido] = useState<{ unidad: UnidadDTO; contenido: ContenidoItem } | null>(null)

  useEffect(() => {
    if (!auth) return
    api.miCursos(auth.id).then((r) => {
      setCursos(r.cursos)
      if (r.cursos[0]) setCursoId(r.cursos[0].id)
    })
  }, [auth?.id])

  const recargar = () => {
    if (!cursoId) return
    setLoading(true)
    api.contenidoDeCurso(cursoId)
      .then((d) => {
        setData(d)
        setExpandidas(new Set(d.unidades.map((u) => u.id)))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar contenido'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { recargar() }, [cursoId])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const toggleUnidad = (id: number) => {
    setExpandidas((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Contenido educativo</h1>
          <p className="text-sm text-gray-600">Administración de recursos y unidades académicas</p>
        </div>
        <button
          onClick={() => setModalUnidad(true)}
          disabled={!cursoId}
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nueva unidad
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Curso</label>
          <select
            className="input"
            value={cursoId ?? ''}
            onChange={(e) => setCursoId(Number(e.target.value))}
          >
            {cursos.length === 0 && <option value="">No tienes cursos asignados</option>}
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.nombre} ({c.grado}-{c.seccion})
              </option>
            ))}
          </select>
        </div>
        {data && (
          <div className="flex items-center gap-6 sm:px-6">
            <Stat label="Unidades" value={String(data.unidades.length)} />
            <Stat label="Temas" value={String(data.unidades.reduce((a, u) => a + u.temas, 0))} />
            <Stat label="Recursos" value={String(data.unidades.reduce((a, u) => a + u.contenidos.reduce((b, c) => b + c.recursos, 0), 0))} />
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando contenido...</div>
      )}

      {!loading && data && data.unidades.length === 0 && (
        <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
          <BookOpen size={36} className="text-gray-300" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Sin unidades registradas</h3>
            <p className="text-xs text-gray-500">Crea tu primera unidad para empezar a subir contenido educativo.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.unidades.map((u) => {
          const expanded = expandidas.has(u.id)
          return (
            <div key={u.id} className="bg-white rounded-2xl overflow-hidden">
              <div className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-muted/50 transition">
                <button onClick={() => toggleUnidad(u.id)} className="flex items-center gap-3 flex-1 text-left">
                  <span className="h-8 w-8 rounded-lg bg-inei-100 text-inei-600 text-sm font-bold grid place-items-center">
                    {u.numero}
                  </span>
                  <div className="flex flex-col leading-tight items-start">
                    <h3 className="text-base font-bold text-[#1A1A1A]">
                      Unidad {u.numero}: {u.titulo}
                    </h3>
                    {u.descripcion && <span className="text-[11px] text-gray-400">{u.descripcion}</span>}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="h-6 px-2.5 rounded-full bg-inei-100 text-inei-600 text-[10px] font-bold inline-flex items-center">
                    {u.temas} {u.temas === 1 ? 'Tema' : 'Temas'}
                  </span>
                  <button onClick={() => setEditandoUnidad(u)} className="text-gray-400 hover:text-[#1A1A1A]" title="Editar unidad"><Pencil size={14} /></button>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar la unidad "${u.titulo}" y todos sus temas?`)) return
                      await api.eliminarUnidad(u.id)
                      recargar()
                    }}
                    className="text-gray-400 hover:text-inei-600"
                    title="Eliminar unidad"
                  ><Trash2 size={14} /></button>
                  <button onClick={() => toggleUnidad(u.id)} className="text-gray-400">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border-softer px-5 py-4">
                  <div className="overflow-x-auto">
                  <div className="min-w-[600px] flex flex-col gap-1">
                  <div className="grid grid-cols-[1fr_140px_100px_100px] gap-3 h-9 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
                    <span>Tema</span>
                    <span>Tipo</span>
                    <span>Recursos</span>
                    <span>Acciones</span>
                  </div>

                  {u.contenidos.length === 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">
                      Sin temas en esta unidad.
                    </div>
                  )}

                  {u.contenidos.map((c, i) => {
                    const Icon = tipoIcon[c.tipo]
                    const color = tipoColor[c.tipo]
                    return (
                      <div key={c.id}>
                        <div className="grid grid-cols-[1fr_140px_100px_100px] gap-3 min-h-12 px-3 items-center">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-gray-400" />
                            <span className="text-[13px] text-[#1A1A1A]">{c.titulo}</span>
                          </div>
                          <span
                            className="h-6 px-2.5 rounded-full text-[10px] font-bold inline-flex items-center w-fit"
                            style={{ background: color.bg, color: color.text }}
                          >
                            {tipoLabels[c.tipo]}
                          </span>
                          <span className="text-xs text-gray-600">{c.recursos}</span>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            {c.url && (
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1A1A1A]" title="Ver recurso"><Eye size={14} /></a>
                            )}
                            <button onClick={() => setEditandoContenido({ unidad: u, contenido: c })} className="hover:text-[#1A1A1A]" title="Editar tema"><Pencil size={14} /></button>
                            <button
                              onClick={async () => {
                                if (!confirm(`¿Eliminar el tema "${c.titulo}"?`)) return
                                await api.eliminarContenido(c.id)
                                recargar()
                              }}
                              className="hover:text-inei-600"
                              title="Eliminar tema"
                            ><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {i < u.contenidos.length - 1 && <div className="h-px bg-border-softer" />}
                      </div>
                    )
                  })}

                  <button
                    onClick={() => setModalContenido(u)}
                    className="self-start text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1 mt-2"
                  >
                    <Plus size={12} /> Agregar tema
                  </button>
                  </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data && data.recientes.length > 0 && (
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Recursos recientes</h2>
              <p className="text-[11px] text-gray-400">Últimos archivos y materiales subidos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.recientes.slice(0, 6).map((r) => {
              const Icon = tipoIcon[r.tipo]
              const color = tipoColor[r.tipo]
              return (
                <div key={r.id} className="bg-surface-muted rounded-xl overflow-hidden">
                  <div className="h-24 grid place-items-center" style={{ background: color.bg }}>
                    <Icon size={32} style={{ color: color.text }} />
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">{r.titulo}</span>
                    <span className="text-[10px] text-gray-400">{r.unidad}</span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.fecha).toLocaleDateString('es-PE')}
                      </span>
                      <span
                        className="h-5 px-2 rounded-full text-[9px] font-bold inline-flex items-center"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {tipoLabels[r.tipo].toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalUnidad && cursoId && (
        <UnidadModal cursoId={cursoId} onClose={() => setModalUnidad(false)} onCreated={() => { setModalUnidad(false); recargar() }} siguienteNumero={(data?.unidades.length ?? 0) + 1} />
      )}
      {editandoUnidad && (
        <UnidadEditModal
          unidad={editandoUnidad}
          onClose={() => setEditandoUnidad(null)}
          onSaved={() => { setEditandoUnidad(null); recargar() }}
        />
      )}
      {modalContenido && (
        <ContenidoModal
          unidad={modalContenido}
          onClose={() => setModalContenido(null)}
          onCreated={() => { setModalContenido(null); recargar() }}
          docenteId={auth.id}
        />
      )}
      {editandoContenido && (
        <ContenidoEditModal
          unidad={editandoContenido.unidad}
          contenido={editandoContenido.contenido}
          onClose={() => setEditandoContenido(null)}
          onSaved={() => { setEditandoContenido(null); recargar() }}
        />
      )}
    </div>
  )
}

function UnidadModal({
  cursoId,
  siguienteNumero,
  onClose,
  onCreated,
}: {
  cursoId: number
  siguienteNumero: number
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ numero: siguienteNumero, titulo: '', descripcion: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setErr(null)
          try {
            await api.crearUnidad({
              curso_id: cursoId,
              numero: form.numero,
              titulo: form.titulo,
              descripcion: form.descripcion || undefined,
            })
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al crear unidad')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Nueva unidad</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Número</label>
            <input type="number" min={1} max={50} required className="input" value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Título</label>
            <input required className="input" placeholder="Fracciones" maxLength={120} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Descripción (opcional)</label>
          <textarea className="input h-20 py-2" maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : 'Crear unidad'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ContenidoModal({
  unidad,
  docenteId,
  onClose,
  onCreated,
}: {
  unidad: UnidadDTO
  docenteId: number
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'texto' as ContenidoTipo,
    descripcion: '',
    url: '',
    recursos: 1,
  })
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
          if (!form.titulo.trim()) {
            setErr('El título es obligatorio')
            return
          }
          setSaving(true)
          setErr(null)
          try {
            if (archivo) {
              // Subida con archivo físico via multipart
              const fd = new FormData()
              fd.append('unidad_id', String(unidad.id))
              fd.append('titulo', form.titulo)
              fd.append('tipo', form.tipo)
              if (form.descripcion) fd.append('descripcion', form.descripcion)
              fd.append('recursos', String(form.recursos))
              fd.append('subido_por', String(docenteId))
              fd.append('archivo', archivo)
              await api.subirContenido(fd)
            } else {
              await api.crearContenido({
                unidad_id: unidad.id,
                titulo: form.titulo,
                tipo: form.tipo,
                descripcion: form.descripcion || undefined,
                url: form.url || undefined,
                recursos: form.recursos,
                subido_por: docenteId,
              })
            }
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al crear contenido')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Nuevo tema</h2>
            <span className="text-[11px] text-gray-400">Unidad {unidad.numero}: {unidad.titulo}</span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Título</label>
          <input required className="input" placeholder="3.1 Concepto de fracción" maxLength={160} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Tipo</label>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as ContenidoTipo })}>
              {(Object.keys(tipoLabels) as ContenidoTipo[]).map((t) => (
                <option key={t} value={t}>{tipoLabels[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Cantidad de recursos</label>
            <input type="number" min={1} max={99} className="input" value={form.recursos} onChange={(e) => setForm({ ...form, recursos: Number(e.target.value) })} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Archivo (PDF, Word, video, imagen, ZIP — máx 20 MB)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
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
              className="h-24 rounded-lg border-2 border-dashed border-border-soft hover:border-inei-600 hover:bg-inei-50 flex flex-col items-center justify-center gap-1 text-xs text-gray-500 hover:text-inei-600 transition"
            >
              <Upload size={22} />
              <span>Haz click para seleccionar un archivo</span>
              <span className="text-[10px] text-gray-400">PDF, Word, PPT, video, imagen o ZIP — máx 20 MB</span>
            </button>
          )}
          {archivo && (
            <div className="rounded-lg border border-border-soft bg-surface-muted px-3 py-2 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-inei-100 grid place-items-center">
                <Paperclip size={15} className="text-inei-600" />
              </div>
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-xs font-semibold text-[#1A1A1A] truncate">{archivo.name}</span>
                <span className="text-[10px] text-gray-400">{tamanoMb} MB · {archivo.type || 'archivo'}</span>
              </div>
              <button
                type="button"
                onClick={() => { setArchivo(null); if (fileRef.current) fileRef.current.value = '' }}
                className="text-gray-400 hover:text-inei-600"
                title="Quitar archivo"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            …o pegar URL externa {archivo && <span className="text-gray-400">(deshabilitado — ya hay archivo)</span>}
          </label>
          <input
            className="input"
            placeholder="https://drive.google.com/..."
            disabled={!!archivo}
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Descripción (opcional)</label>
          <textarea className="input h-20 py-2" maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : 'Agregar tema'}
          </button>
        </div>
      </form>
    </div>
  )
}

function UnidadEditModal({
  unidad,
  onClose,
  onSaved,
}: {
  unidad: UnidadDTO
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ numero: unidad.numero, titulo: unidad.titulo, descripcion: unidad.descripcion ?? '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setErr(null)
          try {
            await api.actualizarUnidad(unidad.id, {
              numero: form.numero,
              titulo: form.titulo,
              descripcion: form.descripcion || undefined,
            })
            onSaved()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al editar unidad')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Editar unidad</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Número</label>
            <input type="number" min={1} max={50} required className="input" value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Título</label>
            <input required className="input" maxLength={120} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Descripción</label>
          <textarea className="input h-20 py-2" maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ContenidoEditModal({
  unidad,
  contenido,
  onClose,
  onSaved,
}: {
  unidad: UnidadDTO
  contenido: ContenidoItem
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    titulo: contenido.titulo,
    tipo: contenido.tipo,
    descripcion: contenido.descripcion ?? '',
    url: contenido.url ?? '',
    recursos: contenido.recursos,
  })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const tamanoMb = archivo ? (archivo.size / (1024 * 1024)).toFixed(2) : null
  const archivoActual = contenido.url && contenido.url.startsWith('/storage/')

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setErr(null)
          try {
            if (archivo) {
              // Reemplazar archivo via multipart con _method=PUT
              const fd = new FormData()
              fd.append('titulo', form.titulo)
              fd.append('tipo', form.tipo)
              if (form.descripcion) fd.append('descripcion', form.descripcion)
              fd.append('recursos', String(form.recursos))
              fd.append('archivo', archivo)
              await api.actualizarContenidoConArchivo(contenido.id, fd)
            } else {
              await api.actualizarContenido(contenido.id, {
                titulo: form.titulo,
                tipo: form.tipo,
                descripcion: form.descripcion || undefined,
                url: form.url || undefined,
                recursos: form.recursos,
              })
            }
            onSaved()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al editar contenido')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Editar tema</h2>
            <span className="text-[11px] text-gray-400">Unidad {unidad.numero}: {unidad.titulo}</span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Título</label>
          <input required className="input" maxLength={160} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Tipo</label>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as ContenidoTipo })}>
              {(Object.keys(tipoLabels) as ContenidoTipo[]).map((t) => (
                <option key={t} value={t}>{tipoLabels[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Cantidad de recursos</label>
            <input type="number" min={1} max={99} className="input" value={form.recursos} onChange={(e) => setForm({ ...form, recursos: Number(e.target.value) })} />
          </div>
        </div>

        {archivoActual && !archivo && (
          <div className="rounded-lg border border-border-soft bg-[#DCFCE7] px-3 py-2 flex items-center gap-2.5">
            <Paperclip size={14} className="text-[#15803D]" />
            <div className="flex flex-col leading-tight flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-[#15803D]">Archivo subido actualmente</span>
              <a href={fileUrl(contenido.url ?? '')} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#15803D] underline truncate">
                {contenido.url}
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            {archivoActual ? 'Reemplazar archivo' : 'Subir archivo'} (PDF, Word, video, imagen — máx 20 MB)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
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
              <Upload size={18} />
              <span>Seleccionar archivo nuevo</span>
            </button>
          )}
          {archivo && (
            <div className="rounded-lg border border-border-soft bg-surface-muted px-3 py-2 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-inei-100 grid place-items-center">
                <Paperclip size={15} className="text-inei-600" />
              </div>
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-xs font-semibold text-[#1A1A1A] truncate">{archivo.name}</span>
                <span className="text-[10px] text-gray-400">{tamanoMb} MB · reemplazará al archivo anterior</span>
              </div>
              <button
                type="button"
                onClick={() => { setArchivo(null); if (fileRef.current) fileRef.current.value = '' }}
                className="text-gray-400 hover:text-inei-600"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            URL del recurso {archivo && <span className="text-gray-400">(deshabilitado — hay archivo nuevo)</span>}
          </label>
          <input
            className="input"
            placeholder="https://..."
            disabled={!!archivo}
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Descripción</label>
          <textarea className="input h-20 py-2" maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-none gap-1">
      <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
      <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
    </div>
  )
}
