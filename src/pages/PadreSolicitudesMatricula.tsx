import { useEffect, useRef, useState } from 'react'
import {
  ClipboardList, Plus, X, Upload, FileText, Check, ArrowLeft, ArrowRight,
  ChevronRight, AlertCircle, CheckCircle2, Clock, FileWarning, Paperclip,
} from 'lucide-react'
import Pill from '../components/Pill'
import {
  api, fileUrl, loadAuth,
  type CondicionMatricula, type DocumentoTipo, type NivelEducativo,
  type Parentesco, type SolicitudEstado, type SolicitudMatriculaDTO,
} from '../lib/api'

const nivelLabel: Record<NivelEducativo, string> = {
  inicial: 'Inicial',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}
const condicionLabel: Record<CondicionMatricula, string> = {
  nuevo_ingreso: 'Nuevo ingreso',
  traslado: 'Traslado',
  reincorporacion: 'Reincorporación',
}

const docTipoLabel: Record<DocumentoTipo, string> = {
  dni_estudiante: 'DNI del estudiante',
  dni_padre: 'DNI del padre/madre/tutor',
  acta_estudios: 'Acta de estudios año anterior',
  partida_nacimiento: 'Partida de nacimiento',
  foto_estudiante: 'Foto del estudiante',
  constancia_domicilio: 'Constancia de domicilio',
  otros: 'Otros',
}

const estadoVariant: Record<SolicitudEstado, 'success' | 'warning' | 'danger' | 'muted'> = {
  aprobada: 'success',
  pendiente: 'warning',
  observada: 'warning',
  rechazada: 'danger',
}

const estadoIcon: Record<SolicitudEstado, typeof Clock> = {
  pendiente: Clock,
  observada: FileWarning,
  aprobada: CheckCircle2,
  rechazada: AlertCircle,
}

export default function PadreSolicitudesMatricula() {
  const auth = loadAuth()
  const [solicitudes, setSolicitudes] = useState<SolicitudMatriculaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detalle, setDetalle] = useState<SolicitudMatriculaDTO | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (!auth) return
    setLoading(true)
    setError(null)
    api.solicitudesMatricula({ padre_id: auth.id })
      .then((r) => setSolicitudes(r.solicitudes))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const stats = {
    pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
    observada: solicitudes.filter((s) => s.estado === 'observada').length,
    aprobada: solicitudes.filter((s) => s.estado === 'aprobada').length,
    rechazada: solicitudes.filter((s) => s.estado === 'rechazada').length,
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Solicitudes de matrícula</h1>
          <p className="text-sm text-gray-600">Solicita la matrícula de tu hijo y haz seguimiento del estado</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus size={16} /> Nueva solicitud
        </button>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}

      <div className="grid grid-cols-4 gap-4">
        <Stat icon={Clock} label="Pendientes" value={stats.pendiente} color="#92400E" />
        <Stat icon={FileWarning} label="Observadas" value={stats.observada} color="#C8102E" />
        <Stat icon={CheckCircle2} label="Aprobadas" value={stats.aprobada} color="#15803D" />
        <Stat icon={AlertCircle} label="Rechazadas" value={stats.rechazada} color="#991B1B" />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1A1A1A]">Mis solicitudes</h2>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}

        {!loading && solicitudes.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <ClipboardList size={36} className="text-gray-300" />
            <p className="text-sm text-gray-500">Aún no has presentado ninguna solicitud.</p>
            <button onClick={() => setModalOpen(true)} className="h-9 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-xs font-semibold inline-flex items-center gap-1.5">
              <Plus size={13} /> Crear primera solicitud
            </button>
          </div>
        )}

        {!loading && solicitudes.map((s) => {
          const Icon = estadoIcon[s.estado]
          return (
            <button
              key={s.id}
              onClick={() => setDetalle(s)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border-softer hover:border-inei-600 hover:bg-inei-50 transition text-left"
            >
              <div className="h-11 w-11 rounded-xl bg-inei-100 grid place-items-center text-inei-600">
                <Icon size={20} />
              </div>
              <div className="flex flex-col leading-tight flex-1 gap-1">
                <span className="text-sm font-bold text-[#1A1A1A]">
                  {s.estudiante.nombres} {s.estudiante.apellidos}
                </span>
                <span className="text-[11px] text-gray-500">
                  DNI {s.estudiante.dni} · Grado solicitado: {s.grado_solicitado} · {s.documentos_count} documentos
                </span>
                <span className="text-[10px] text-gray-400">
                  Solicitado el {s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString('es-PE') : '—'}
                </span>
              </div>
              <Pill variant={estadoVariant[s.estado]} showDot={false}>{s.estado}</Pill>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          )
        })}
      </div>

      {modalOpen && (
        <WizardModal
          padreId={auth.id}
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); load() }}
        />
      )}

      {detalle && (
        <DetalleModal
          solicitud={detalle}
          onClose={() => setDetalle(null)}
          onUpdated={() => { setDetalle(null); load() }}
        />
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </div>
  )
}

// ---------------- Wizard 3 pasos --------------------------------------------

type DocSlot = { tipo: DocumentoTipo; file: File | null }

function WizardModal({ padreId, onClose, onCreated }: { padreId: number; onClose: () => void; onCreated: () => void }) {
  const auth = loadAuth()
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState({
    estudiante_dni: '',
    estudiante_nombres: '',
    estudiante_apellidos: '',
    estudiante_fecha_nacimiento: '',
    estudiante_genero: 'M' as 'M' | 'F',
    direccion_estudiante: '',
    nivel_educativo: 'secundaria' as NivelEducativo,
    telefono_contacto: (auth as { telefono?: string })?.telefono ?? '',
    condicion: 'nuevo_ingreso' as CondicionMatricula,
    grado_solicitado: '1ro',
    parentesco: 'padre' as Parentesco,
    observaciones_padre: '',
  })
  const [docs, setDocs] = useState<DocSlot[]>([
    { tipo: 'dni_estudiante', file: null },
    { tipo: 'dni_padre', file: null },
    { tipo: 'acta_estudios', file: null },
    { tipo: 'partida_nacimiento', file: null },
  ])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const validarPaso1 = () => {
    if (!/^\d{8}$/.test(form.estudiante_dni)) return 'El DNI del estudiante debe tener 8 dígitos'
    if (!form.estudiante_nombres.trim()) return 'Los nombres son obligatorios'
    if (!form.estudiante_apellidos.trim()) return 'Los apellidos son obligatorios'
    return null
  }

  const enviar = async () => {
    setSaving(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('padre_id', String(padreId))
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, String(v)) })
      docs.forEach((d) => {
        if (d.file) {
          fd.append('documentos[]', d.file)
          fd.append('documentos_tipos[]', d.tipo)
        }
      })
      await api.crearSolicitudMatricula(fd)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo enviar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Nueva solicitud de matrícula</h2>
            <span className="text-[11px] text-gray-400">Paso {paso} de 3</span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <Stepper paso={paso} />

        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        {paso === 1 && (
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase text-gray-400 -mb-1">Identificación del estudiante</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="DNI del estudiante *">
                <input
                  required maxLength={8}
                  value={form.estudiante_dni}
                  onChange={(e) => setForm({ ...form, estudiante_dni: e.target.value.replace(/\D/g, '') })}
                  className="input" placeholder="71283945"
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  value={form.estudiante_fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, estudiante_fecha_nacimiento: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombres *">
                <input required maxLength={80} value={form.estudiante_nombres} onChange={(e) => setForm({ ...form, estudiante_nombres: e.target.value })} className="input" />
              </Field>
              <Field label="Apellidos *">
                <input required maxLength={80} value={form.estudiante_apellidos} onChange={(e) => setForm({ ...form, estudiante_apellidos: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Dirección del estudiante">
              <input
                maxLength={250}
                value={form.direccion_estudiante}
                onChange={(e) => setForm({ ...form, direccion_estudiante: e.target.value })}
                className="input" placeholder="Av. Vitarte 123, Vitarte, Lima"
              />
            </Field>

            <span className="text-[11px] font-bold uppercase text-gray-400 mt-2 -mb-1">Información académica</span>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Género">
                <select className="input" value={form.estudiante_genero} onChange={(e) => setForm({ ...form, estudiante_genero: e.target.value as 'M' | 'F' })}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </Field>
              <Field label="Nivel educativo">
                <select className="input" value={form.nivel_educativo} onChange={(e) => setForm({ ...form, nivel_educativo: e.target.value as NivelEducativo })}>
                  {(Object.keys(nivelLabel) as NivelEducativo[]).map((n) => (
                    <option key={n} value={n}>{nivelLabel[n]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Grado solicitado *">
                <select className="input" value={form.grado_solicitado} onChange={(e) => setForm({ ...form, grado_solicitado: e.target.value })}>
                  {['1ro', '2do', '3ro', '4to', '5to'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Condición de matrícula">
              <select className="input" value={form.condicion} onChange={(e) => setForm({ ...form, condicion: e.target.value as CondicionMatricula })}>
                {(Object.keys(condicionLabel) as CondicionMatricula[]).map((c) => (
                  <option key={c} value={c}>{condicionLabel[c]}</option>
                ))}
              </select>
            </Field>

            <span className="text-[11px] font-bold uppercase text-gray-400 mt-2 -mb-1">Contacto del responsable</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parentesco *">
                <select className="input" value={form.parentesco} onChange={(e) => setForm({ ...form, parentesco: e.target.value as Parentesco })}>
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="tutor">Tutor</option>
                  <option value="apoderado">Apoderado</option>
                </select>
              </Field>
              <Field label="Teléfono de contacto">
                <input
                  maxLength={20}
                  value={form.telefono_contacto}
                  onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
                  className="input" placeholder="987 654 321"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
              <button
                type="button"
                onClick={() => {
                  const v = validarPaso1()
                  if (v) { setErr(v); return }
                  setErr(null); setPaso(2)
                }}
                className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-1.5"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              Adjunta documentos en PDF o imagen (JPG/PNG). Máximo 10 MB por archivo. Los marcados con * son obligatorios.
            </p>
            <div className="flex flex-col gap-2">
              {docs.map((d, i) => (
                <DocInput
                  key={d.tipo}
                  slot={d}
                  obligatorio={['dni_estudiante', 'partida_nacimiento'].includes(d.tipo)}
                  onChange={(file) => {
                    const copy = [...docs]; copy[i] = { ...copy[i], file }; setDocs(copy)
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <button onClick={() => setPaso(1)} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 inline-flex items-center gap-1.5">
                <ArrowLeft size={14} /> Atrás
              </button>
              <button
                onClick={() => {
                  if (!docs.find((d) => d.tipo === 'dni_estudiante')?.file) {
                    setErr('Debes adjuntar el DNI del estudiante')
                    return
                  }
                  if (!docs.find((d) => d.tipo === 'partida_nacimiento')?.file) {
                    setErr('Debes adjuntar la partida de nacimiento')
                    return
                  }
                  setErr(null); setPaso(3)
                }}
                className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-1.5"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-muted rounded-xl p-4 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Resumen de la solicitud</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                <Resumen label="DNI" value={form.estudiante_dni} />
                <Resumen label="Nombres" value={form.estudiante_nombres} />
                <Resumen label="Apellidos" value={form.estudiante_apellidos} />
                <Resumen label="Fecha nac." value={form.estudiante_fecha_nacimiento || '—'} />
                <Resumen label="Género" value={form.estudiante_genero === 'M' ? 'Masculino' : 'Femenino'} />
                <Resumen label="Dirección" value={form.direccion_estudiante || '—'} />
                <Resumen label="Nivel" value={nivelLabel[form.nivel_educativo]} />
                <Resumen label="Grado" value={form.grado_solicitado} />
                <Resumen label="Condición" value={condicionLabel[form.condicion]} />
                <Resumen label="Parentesco" value={form.parentesco} />
                <Resumen label="Teléfono contacto" value={form.telefono_contacto || '—'} />
                <Resumen label="Documentos" value={`${docs.filter((d) => d.file).length} archivos`} />
              </div>
            </div>
            <Field label="Observaciones (opcional) — beca, alergias, necesidades especiales, etc.">
              <textarea
                value={form.observaciones_padre}
                onChange={(e) => setForm({ ...form, observaciones_padre: e.target.value })}
                maxLength={1000}
                className="input h-20 py-2"
                placeholder="Ej. Es becado por orfandad. Tiene alergia a la penicilina."
              />
            </Field>
            <p className="text-[11px] text-gray-500">
              Al enviar, la administración del colegio revisará tu solicitud y te notificaremos por la sección de notificaciones cuando haya respuesta.
            </p>
            <div className="flex justify-between gap-2">
              <button onClick={() => setPaso(2)} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 inline-flex items-center gap-1.5">
                <ArrowLeft size={14} /> Atrás
              </button>
              <button
                onClick={enviar}
                disabled={saving}
                className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Check size={14} /> {saving ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stepper({ paso }: { paso: 1 | 2 | 3 }) {
  const labels = ['Datos del estudiante', 'Documentos', 'Confirmar']
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const activo = n === paso
        const completado = n < paso
        return (
          <div key={l} className="flex items-center gap-2 flex-1">
            <div className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold ${
              activo ? 'bg-inei-600 text-white' : completado ? 'bg-[#15803D] text-white' : 'bg-border-softer text-gray-400'
            }`}>
              {completado ? <Check size={13} /> : n}
            </div>
            <span className={`text-[11px] font-semibold ${activo || completado ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>{l}</span>
            {i < 2 && <div className="flex-1 h-px bg-border-softer" />}
          </div>
        )
      })}
    </div>
  )
}

function DocInput({ slot, obligatorio, onChange }: { slot: DocSlot; obligatorio: boolean; onChange: (f: File | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const sizeMb = slot.file ? (slot.file.size / (1024 * 1024)).toFixed(2) : null
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border-soft bg-surface-muted/40">
      <div className="h-9 w-9 rounded-md bg-inei-100 grid place-items-center text-inei-600">
        <FileText size={16} />
      </div>
      <div className="flex flex-col leading-tight flex-1 min-w-0">
        <span className="text-xs font-semibold text-[#1A1A1A]">
          {docTipoLabel[slot.tipo]}{obligatorio && <span className="text-inei-600"> *</span>}
        </span>
        {slot.file ? (
          <span className="text-[10px] text-gray-500 truncate">
            <Paperclip size={9} className="inline" /> {slot.file.name} · {sizeMb} MB
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Sin archivo adjunto</span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          if (f && f.size > 10 * 1024 * 1024) {
            alert('El archivo supera los 10 MB')
            return
          }
          onChange(f)
        }}
      />
      {slot.file ? (
        <button type="button" onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = '' }} className="text-gray-400 hover:text-inei-600">
          <X size={14} />
        </button>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} className="h-8 px-3 rounded-md bg-white border border-border-soft text-[11px] font-semibold text-gray-700 hover:text-inei-600 inline-flex items-center gap-1">
          <Upload size={12} /> Subir
        </button>
      )}
    </div>
  )
}

function Resumen({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-[#1A1A1A] capitalize truncate ml-2">{value}</span>
    </div>
  )
}

// ---------------- Detalle modal ---------------------------------------------

function DetalleModal({ solicitud, onClose, onUpdated }: { solicitud: SolicitudMatriculaDTO; onClose: () => void; onUpdated: () => void }) {
  const [subiendoDocs, setSubiendoDocs] = useState<DocSlot[]>([{ tipo: 'otros', file: null }])
  const [subiendo, setSubiendo] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const puedeAgregar = solicitud.estado === 'observada' || solicitud.estado === 'pendiente'

  const subir = async () => {
    const conArchivo = subiendoDocs.filter((d) => d.file)
    if (conArchivo.length === 0) { setErr('Selecciona al menos un archivo'); return }
    setSubiendo(true)
    setErr(null)
    try {
      const fd = new FormData()
      conArchivo.forEach((d) => {
        if (d.file) {
          fd.append('documentos[]', d.file)
          fd.append('documentos_tipos[]', d.tipo)
        }
      })
      await api.agregarDocumentosSolicitud(solicitud.id, fd)
      onUpdated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo subir')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Detalle de solicitud · #{solicitud.id}</h2>
            <span className="text-[11px] text-gray-400">
              Solicitado el {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleString('es-PE') : '—'}
            </span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <Pill variant={estadoVariant[solicitud.estado]} showDot={false}>{solicitud.estado.toUpperCase()}</Pill>

        {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
            <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
          </div>
        )}

        {solicitud.estado === 'observada' && solicitud.observaciones_admin && (
          <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] px-3 py-2 text-xs text-[#92400E]">
            <strong>Observación del admin:</strong> {solicitud.observaciones_admin}
          </div>
        )}

        {solicitud.estado === 'aprobada' && solicitud.estudiante_id && (
          <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2.5 text-xs text-[#15803D] flex flex-col gap-1">
            <span>✓ Tu hijo(a) fue registrado(a) en el sistema. Te enviamos las credenciales a tu bandeja de <strong>Comunicados</strong>.</span>
            {solicitud.estudiante.email_acceso && (
              <span>
                <strong>Usuario del aula virtual:</strong> {solicitud.estudiante.email_acceso}
                {' · '}<strong>Contraseña temporal:</strong> el DNI del estudiante (debe cambiarla al primer ingreso).
              </span>
            )}
          </div>
        )}

        <div className="bg-surface-muted rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
          {solicitud.codigo_matricula && (
            <Resumen label="Código matrícula" value={solicitud.codigo_matricula} />
          )}
          <Resumen label="DNI" value={solicitud.estudiante.dni} />
          <Resumen label="Nombres" value={solicitud.estudiante.nombres} />
          <Resumen label="Apellidos" value={solicitud.estudiante.apellidos} />
          {solicitud.estudiante.direccion && (
            <Resumen label="Dirección" value={solicitud.estudiante.direccion} />
          )}
          {solicitud.nivel_educativo && (
            <Resumen label="Nivel" value={nivelLabel[solicitud.nivel_educativo]} />
          )}
          <Resumen label="Grado solicitado" value={solicitud.grado_solicitado} />
          {solicitud.condicion && (
            <Resumen label="Condición" value={condicionLabel[solicitud.condicion]} />
          )}
          <Resumen label="Parentesco" value={solicitud.parentesco} />
          {solicitud.telefono_contacto && (
            <Resumen label="Teléfono" value={solicitud.telefono_contacto} />
          )}
          <Resumen label="Año lectivo" value={solicitud.anio_lectivo} />
        </div>

        {solicitud.observaciones_padre && (
          <div className="rounded-lg bg-surface-muted/40 border border-border-softer px-3 py-2">
            <span className="text-[10px] font-bold uppercase text-gray-400">Tus observaciones</span>
            <p className="text-xs text-[#1A1A1A] mt-1">{solicitud.observaciones_padre}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-[#1A1A1A]">Documentos adjuntos ({solicitud.documentos.length})</h3>
          {solicitud.documentos.length === 0 && <p className="text-xs text-gray-400">Sin documentos.</p>}
          {solicitud.documentos.map((d) => (
            <a
              key={d.id}
              href={fileUrl(d.archivo_url)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-md border border-border-softer hover:border-inei-600 hover:bg-inei-50"
            >
              <Paperclip size={14} className="text-inei-600" />
              <span className="text-xs font-semibold text-[#1A1A1A] flex-1 truncate">{docTipoLabel[d.tipo]}</span>
              <span className="text-[10px] text-gray-400">{d.tamano_kb} KB</span>
            </a>
          ))}
        </div>

        {puedeAgregar && (
          <>
            <div className="h-px bg-border-softer" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">Agregar documentos adicionales</h3>
            {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}
            {subiendoDocs.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={d.tipo}
                  onChange={(e) => {
                    const copy = [...subiendoDocs]; copy[i] = { ...copy[i], tipo: e.target.value as DocumentoTipo }; setSubiendoDocs(copy)
                  }}
                  className="input flex-1"
                >
                  {(Object.keys(docTipoLabel) as DocumentoTipo[]).map((t) => (
                    <option key={t} value={t}>{docTipoLabel[t]}</option>
                  ))}
                </select>
                <DocInput
                  slot={d}
                  obligatorio={false}
                  onChange={(file) => {
                    const copy = [...subiendoDocs]; copy[i] = { ...copy[i], file }; setSubiendoDocs(copy)
                  }}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSubiendoDocs([...subiendoDocs, { tipo: 'otros', file: null }])}
                className="h-9 px-3 rounded-lg bg-white border border-border-soft text-xs font-semibold text-gray-700"
              >
                + Agregar más
              </button>
              <button
                onClick={subir}
                disabled={subiendo}
                className="h-9 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Upload size={12} /> {subiendo ? 'Subiendo...' : 'Subir documentos'}
              </button>
            </div>
          </>
        )}
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
