import { useEffect, useState } from 'react'
import {
  ClipboardCheck, X, Check, FileWarning, AlertCircle, CheckCircle2, Clock,
  Search, Paperclip, FileText,
} from 'lucide-react'
import Pill from '../components/Pill'
import {
  api, loadAuth,
  type DocumentoTipo, type SolicitudEstado, type SolicitudMatriculaDTO,
} from '../lib/api'

const docTipoLabel: Record<DocumentoTipo, string> = {
  dni_estudiante: 'DNI del estudiante',
  dni_padre: 'DNI del padre/madre',
  acta_estudios: 'Acta de estudios',
  partida_nacimiento: 'Partida de nacimiento',
  foto_estudiante: 'Foto del estudiante',
  constancia_domicilio: 'Constancia de domicilio',
  otros: 'Otros',
}

const estadoVariant: Record<SolicitudEstado, 'success' | 'warning' | 'danger' | 'muted'> = {
  aprobada: 'success', pendiente: 'warning', observada: 'warning', rechazada: 'danger',
}

export default function AdminSolicitudesMatricula() {
  const auth = loadAuth()
  const [tab, setTab] = useState<SolicitudEstado>('pendiente')
  const [solicitudes, setSolicitudes] = useState<SolicitudMatriculaDTO[]>([])
  const [contadores, setContadores] = useState<Record<SolicitudEstado, number>>({ pendiente: 0, observada: 0, aprobada: 0, rechazada: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detalle, setDetalle] = useState<SolicitudMatriculaDTO | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.solicitudesMatricula({ estado: tab })
      .then((r) => { setSolicitudes(r.solicitudes); setContadores(r.contadores) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [tab])

  if (!auth || auth.rol !== 'admin') {
    return <div className="p-8 text-sm text-gray-600">Solo accesible para administradores.</div>
  }

  const filtradas = solicitudes.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [
      s.estudiante.nombres, s.estudiante.apellidos, s.estudiante.dni,
      s.padre?.nombres, s.padre?.apellidos, s.padre?.dni,
    ].some((v) => v?.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Solicitudes de matrícula</h1>
          <p className="text-sm text-gray-600">Revisa y aprueba las solicitudes enviadas por los padres de familia</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}

      <div className="grid grid-cols-4 gap-4">
        <Stat icon={Clock} label="Pendientes" value={contadores.pendiente} color="#92400E" active={tab === 'pendiente'} onClick={() => setTab('pendiente')} />
        <Stat icon={FileWarning} label="Observadas" value={contadores.observada} color="#C8102E" active={tab === 'observada'} onClick={() => setTab('observada')} />
        <Stat icon={CheckCircle2} label="Aprobadas" value={contadores.aprobada} color="#15803D" active={tab === 'aprobada'} onClick={() => setTab('aprobada')} />
        <Stat icon={AlertCircle} label="Rechazadas" value={contadores.rechazada} color="#991B1B" active={tab === 'rechazada'} onClick={() => setTab('rechazada')} />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-surface-muted">
            <Search size={14} className="text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="flex-1 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-gray-400">{filtradas.length} solicitud(es) {tab}</span>
        </div>

        <div className="grid grid-cols-[2fr_2fr_120px_120px_120px_100px_120px] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Estudiante</span><span>Padre/madre</span><span>Grado</span><span>Documentos</span><span>Fecha</span><span>Estado</span><span>Acción</span>
        </div>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && filtradas.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <ClipboardCheck size={36} className="text-gray-300" />
            <p className="text-sm text-gray-500">No hay solicitudes {tab}.</p>
          </div>
        )}

        {!loading && filtradas.map((s, i) => (
          <div key={s.id}>
            <div className="grid grid-cols-[2fr_2fr_120px_120px_120px_100px_120px] gap-3 min-h-12 px-3 items-center">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                  {s.estudiante.nombres.charAt(0)}{s.estudiante.apellidos.charAt(0)}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{s.estudiante.nombres} {s.estudiante.apellidos}</span>
                  <span className="text-[10px] text-gray-400">DNI {s.estudiante.dni}</span>
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-[#1A1A1A]">{s.padre?.nombres} {s.padre?.apellidos}</span>
                <span className="text-[10px] text-gray-400 capitalize">{s.parentesco} · DNI {s.padre?.dni}</span>
              </div>
              <span className="text-xs font-bold text-[#1A1A1A]">{s.grado_solicitado}</span>
              <span className="text-[11px] text-gray-600 inline-flex items-center gap-1"><Paperclip size={11} /> {s.documentos_count}</span>
              <span className="text-[11px] text-gray-500">{s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString('es-PE') : '—'}</span>
              <Pill variant={estadoVariant[s.estado]} showDot={false}>{s.estado}</Pill>
              <button
                onClick={() => setDetalle(s)}
                className="h-8 px-3 rounded-md bg-inei-600 hover:bg-inei-700 text-white text-[11px] font-bold"
              >
                Revisar
              </button>
            </div>
            {i < filtradas.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>

      {detalle && (
        <RevisionModal
          solicitud={detalle}
          revisorId={auth.id}
          onClose={() => setDetalle(null)}
          onResolved={() => { setDetalle(null); load() }}
        />
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color, active, onClick }: { icon: typeof Clock; label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 flex items-center gap-3 text-left transition border-2 ${
        active ? 'border-inei-600 shadow-sm' : 'border-transparent hover:border-border-soft'
      }`}
    >
      <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </button>
  )
}

// ----------------- Revisión modal -------------------------------------------

function RevisionModal({ solicitud, revisorId, onClose, onResolved }: { solicitud: SolicitudMatriculaDTO; revisorId: number; onClose: () => void; onResolved: () => void }) {
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'observar' | null>(null)
  const [grado, setGrado] = useState(solicitud.grado_solicitado || '1ro')
  const [seccion, setSeccion] = useState(solicitud.seccion_solicitada || 'A')
  const [motivo, setMotivo] = useState('')
  const [resultado, setResultado] = useState<{ password_temporal: string | null; email: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const ejecutar = async () => {
    setSaving(true)
    setErr(null)
    try {
      if (accion === 'aprobar') {
        const r = await api.aprobarSolicitud(solicitud.id, { revisor_id: revisorId, grado, seccion })
        setResultado({ password_temporal: r.password_temporal, email: r.estudiante.email })
      } else if (accion === 'rechazar') {
        if (motivo.trim().length < 5) { setErr('El motivo es obligatorio (mínimo 5 caracteres)'); setSaving(false); return }
        await api.rechazarSolicitud(solicitud.id, { revisor_id: revisorId, motivo: motivo.trim() })
        onResolved()
      } else if (accion === 'observar') {
        if (motivo.trim().length < 5) { setErr('La observación es obligatoria (mínimo 5 caracteres)'); setSaving(false); return }
        await api.observarSolicitud(solicitud.id, { revisor_id: revisorId, observaciones: motivo.trim() })
        onResolved()
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo procesar')
    } finally {
      setSaving(false)
    }
  }

  if (resultado) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-16 w-16 rounded-full bg-[#DCFCE7] grid place-items-center">
              <CheckCircle2 size={32} className="text-[#15803D]" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">¡Solicitud aprobada!</h2>
            <p className="text-xs text-gray-600 text-center">
              El estudiante fue creado y vinculado al padre. Comparte estas credenciales con la familia:
            </p>
          </div>
          <div className="bg-surface-muted rounded-xl p-4 flex flex-col gap-2 text-xs">
            <Resumen label="Email" value={resultado.email} />
            {resultado.password_temporal && (
              <Resumen label="Contraseña temporal" value={resultado.password_temporal} mono />
            )}
            {!resultado.password_temporal && (
              <span className="text-[11px] text-gray-500 italic">
                El usuario ya existía en el sistema. Solo se actualizó grado/sección y se creó el vínculo padre↔hijo.
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-500">
            Recuerda matricular al estudiante en los cursos del periodo desde la sección Matrícula.
          </p>
          <button onClick={onResolved} className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold">
            Listo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Revisar solicitud · #{solicitud.id}</h2>
            <span className="text-[11px] text-gray-400">
              Enviada por {solicitud.padre?.nombres} {solicitud.padre?.apellidos}
            </span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        {solicitud.codigo_matricula && (
          <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D] inline-flex items-center gap-2 w-fit">
            <strong>Código de matrícula:</strong> <span className="font-mono">{solicitud.codigo_matricula}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-muted rounded-xl p-4 flex flex-col gap-2 text-[12px]">
            <span className="text-[10px] font-bold uppercase text-gray-400">Estudiante propuesto</span>
            <Resumen label="DNI" value={solicitud.estudiante.dni} />
            <Resumen label="Nombres" value={solicitud.estudiante.nombres} />
            <Resumen label="Apellidos" value={solicitud.estudiante.apellidos} />
            <Resumen label="Fecha nac." value={solicitud.estudiante.fecha_nacimiento ?? '—'} />
            <Resumen label="Género" value={solicitud.estudiante.genero === 'M' ? 'Masculino' : solicitud.estudiante.genero === 'F' ? 'Femenino' : '—'} />
            {solicitud.estudiante.direccion && <Resumen label="Dirección" value={solicitud.estudiante.direccion} />}
            <Resumen label="Nivel" value={solicitud.nivel_educativo ? solicitud.nivel_educativo : '—'} />
            <Resumen label="Grado solicitado" value={solicitud.grado_solicitado} />
            <Resumen label="Condición" value={solicitud.condicion ? solicitud.condicion.replace('_', ' ') : '—'} />
          </div>
          <div className="bg-surface-muted rounded-xl p-4 flex flex-col gap-2 text-[12px]">
            <span className="text-[10px] font-bold uppercase text-gray-400">Padre / tutor</span>
            <Resumen label="DNI" value={solicitud.padre?.dni ?? '—'} />
            <Resumen label="Nombre" value={`${solicitud.padre?.nombres ?? ''} ${solicitud.padre?.apellidos ?? ''}`} />
            <Resumen label="Email" value={solicitud.padre?.email ?? '—'} />
            <Resumen label="Teléfono" value={solicitud.telefono_contacto ?? '—'} />
            <Resumen label="Parentesco" value={solicitud.parentesco} />
            <Resumen label="Año lectivo" value={solicitud.anio_lectivo} />
          </div>
        </div>

        {solicitud.observaciones_padre && (
          <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] px-3 py-2">
            <span className="text-[10px] font-bold uppercase text-[#92400E]">Observaciones del padre</span>
            <p className="text-xs text-[#1A1A1A] mt-1">{solicitud.observaciones_padre}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-[#1A1A1A]">Documentos adjuntos ({solicitud.documentos.length})</h3>
          {solicitud.documentos.length === 0 && <p className="text-xs text-gray-400">Sin documentos.</p>}
          <div className="grid grid-cols-2 gap-2">
            {solicitud.documentos.map((d) => (
              <a
                key={d.id}
                href={d.archivo_url.startsWith('http') ? d.archivo_url : `http://localhost:8000${d.archivo_url}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-md border border-border-softer hover:border-inei-600 hover:bg-inei-50"
              >
                <FileText size={14} className="text-inei-600" />
                <div className="flex flex-col leading-tight flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#1A1A1A] truncate">{docTipoLabel[d.tipo]}</span>
                  <span className="text-[10px] text-gray-400">{d.tamano_kb} KB</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {solicitud.estado !== 'aprobada' && solicitud.estado !== 'rechazada' && !accion && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-softer">
            <button onClick={() => setAccion('aprobar')} className="h-11 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5">
              <Check size={14} /> Aprobar
            </button>
            <button onClick={() => setAccion('observar')} className="h-11 rounded-lg bg-[#92400E] hover:bg-[#78350F] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5">
              <FileWarning size={14} /> Pedir más documentos
            </button>
            <button onClick={() => setAccion('rechazar')} className="h-11 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> Rechazar
            </button>
          </div>
        )}

        {accion === 'aprobar' && (
          <div className="flex flex-col gap-3 pt-3 border-t border-border-softer">
            <h3 className="text-sm font-bold text-[#15803D]">Aprobar matrícula</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Grado asignado">
                <select className="input" value={grado} onChange={(e) => setGrado(e.target.value)}>
                  {['1ro', '2do', '3ro', '4to', '5to'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Sección asignada">
                <select className="input" value={seccion} onChange={(e) => setSeccion(e.target.value)}>
                  {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-[10px] text-gray-500">
              Al aprobar se creará el usuario estudiante (si no existe) y se vinculará al padre. La matrícula en cursos se hace después desde la sección Matrícula.
            </p>
            <Acciones onAtras={() => setAccion(null)} onConfirmar={ejecutar} saving={saving} confirmar="Aprobar y crear estudiante" color="#15803D" />
          </div>
        )}

        {(accion === 'rechazar' || accion === 'observar') && (
          <div className="flex flex-col gap-3 pt-3 border-t border-border-softer">
            <h3 className="text-sm font-bold" style={{ color: accion === 'rechazar' ? '#991B1B' : '#92400E' }}>
              {accion === 'rechazar' ? 'Rechazar solicitud' : 'Pedir documentos adicionales'}
            </h3>
            <Field label={accion === 'rechazar' ? 'Motivo del rechazo' : 'Qué falta o qué corregir'}>
              <textarea
                value={motivo} onChange={(e) => setMotivo(e.target.value)}
                className="input h-24 py-2"
                placeholder={accion === 'rechazar'
                  ? 'Ej. Documentos ilegibles, datos no coinciden, grado no disponible…'
                  : 'Ej. La partida de nacimiento no se ve nítida. Por favor sube una imagen mejor.'}
              />
            </Field>
            <Acciones
              onAtras={() => setAccion(null)}
              onConfirmar={ejecutar}
              saving={saving}
              confirmar={accion === 'rechazar' ? 'Rechazar' : 'Enviar observación'}
              color={accion === 'rechazar' ? '#991B1B' : '#92400E'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Acciones({ onAtras, onConfirmar, saving, confirmar, color }: { onAtras: () => void; onConfirmar: () => void; saving: boolean; confirmar: string; color: string }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onAtras} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Atrás</button>
      <button
        onClick={onConfirmar}
        disabled={saving}
        className="h-10 px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
        style={{ background: color }}
      >
        {saving ? 'Procesando...' : confirmar}
      </button>
    </div>
  )
}

function Resumen({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold text-[#1A1A1A] truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
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
