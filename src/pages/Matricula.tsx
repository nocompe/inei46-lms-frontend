import { useEffect, useState } from 'react'
import {
  User,
  ClipboardList,
  Search,
  Calendar,
  Check,
  X,
  Eye,
  Pencil,
  Trash2,
  Users as UsersIcon,
  CircleCheck,
  Plus,
  CircleSlash,
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import Pill from '../components/Pill'
import {
  api,
  type AuthUser, type AutoMatriculaResultado, type HorarioMaestroDTO,
  type MatriculaEstado, type MatriculaListItem,
} from '../lib/api'

type Estudiante = AuthUser & { id: number }

export default function Matricula() {
  const [dni, setDni] = useState('')
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null)
  const [horarioGrado, setHorarioGrado] = useState<HorarioMaestroDTO | null>(null)
  const [resultado, setResultado] = useState<AutoMatriculaResultado | null>(null)
  const [periodo] = useState('2026-I')
  const [searchingDni, setSearchingDni] = useState(false)
  const [matriculando, setMatriculando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [recientes, setRecientes] = useState<MatriculaListItem[]>([])
  const [editandoMatricula, setEditandoMatricula] = useState<MatriculaListItem | null>(null)

  const cargarRecientes = () => {
    api.matriculas().then((r) => setRecientes(r.matriculas)).catch(() => setRecientes([]))
  }

  useEffect(() => {
    cargarRecientes()
  }, [])

  const total = recientes.length
  const activas = recientes.filter((m) => m.estado === 'activa').length
  const inactivas = total - activas
  const esteMes = recientes.filter((m) => {
    const d = new Date(m.fecha_matricula)
    const ahora = new Date()
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear()
  }).length

  const buscarEstudiante = async () => {
    setError(null)
    setSuccess(null)
    setResultado(null)
    setHorarioGrado(null)
    setSearchingDni(true)
    try {
      const { user } = await api.buscarPorDni(dni)
      if (user.rol !== 'estudiante') {
        setError(`El DNI ${dni} pertenece a un ${user.rol}, no a un estudiante.`)
        setEstudiante(null)
        return
      }
      const est = user as Estudiante
      setEstudiante(est)
      if (est.grado && est.seccion) {
        const h = await api.horarioMaestro(est.grado, est.seccion)
        setHorarioGrado(h)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar')
      setEstudiante(null)
    } finally {
      setSearchingDni(false)
    }
  }

  const autoMatricular = async () => {
    if (!estudiante) return
    setMatriculando(true)
    setError(null)
    setSuccess(null)
    try {
      const r = await api.autoMatricularEstudiante(estudiante.id)
      setResultado(r)
      setSuccess(r.message)
      cargarRecientes()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo matricular')
    } finally {
      setMatriculando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Matrículas</h1>
        <p className="text-sm text-gray-600">
          Gestión y administración de matrículas estudiantiles del periodo {periodo}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat icon={ClipboardList} label="Total Matrículas" value={String(total)} footer="Registradas este año" color="#1A1A1A" />
        <Stat icon={CircleCheck} label="Matrículas Activas" value={String(activas)} footer={`${total > 0 ? Math.round((activas / total) * 100) : 0}% del total`} color="#15803D" />
        <Stat icon={Plus} label="Nuevas este mes" value={String(esteMes)} footer="Este mes" color="#C8102E" />
        <Stat icon={CircleSlash} label="Inactivas" value={String(inactivas)} footer={`${total > 0 ? Math.round((inactivas / total) * 100) : 0}% del total`} color="#92400E" />
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D]">
          {success}
        </div>
      )}

      <div className="rounded-xl bg-[#DBEAFE] border border-[#93C5FD] px-4 py-3 flex items-start gap-3">
        <Sparkles size={18} className="text-[#1E40AF] mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-[#1E40AF]">Matrícula automática por grado-sección</span>
          <span className="text-[11px] text-[#1E40AF]/80">
            Los cursos se asignan automáticamente según el grado y sección del estudiante. Solo busca el DNI y confirma. La lista de cursos se administra desde <strong>Horario maestro</strong> y <strong>Asignaciones</strong>.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormCard icon={User} title="Buscar estudiante" subtitle="Ingresa el DNI del estudiante a matricular">
          <Field label="DNI del estudiante">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 input">
                <Search size={14} className="text-gray-400" />
                <input
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  maxLength={8}
                  placeholder="71283945"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarEstudiante() } }}
                />
              </div>
              <button
                type="button"
                onClick={buscarEstudiante}
                disabled={searchingDni || !dni}
                className="h-11 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Search size={14} /> Buscar
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombres">
              <input className="input bg-white" readOnly value={estudiante?.nombres ?? ''} placeholder="—" />
            </Field>
            <Field label="Apellidos">
              <input className="input bg-white" readOnly value={estudiante?.apellidos ?? ''} placeholder="—" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Grado">
              <input className="input bg-white" readOnly value={estudiante?.grado ?? ''} placeholder="—" />
            </Field>
            <Field label="Sección">
              <input className="input bg-white" readOnly value={estudiante?.seccion ?? ''} placeholder="—" />
            </Field>
          </div>

          <Field label="Correo del estudiante">
            <input className="input bg-white" readOnly value={estudiante?.email ?? ''} placeholder="—" />
          </Field>
        </FormCard>

        <FormCard icon={ClipboardList} title="Cursos a inscribir" subtitle={estudiante ? `Plan de estudios del ${estudiante.grado}-${estudiante.seccion}` : 'Selecciona un estudiante primero'}>
          {!estudiante && (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <BookOpen size={36} className="text-gray-300" />
              <p className="text-xs text-gray-400">Busca un estudiante por DNI para ver los cursos de su grado-sección.</p>
            </div>
          )}

          {estudiante && (!estudiante.grado || !estudiante.seccion) && (
            <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-3 text-xs text-inei-700 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5" />
              <span>Este estudiante no tiene grado y sección asignados. Asígnaselos primero desde <strong>Usuarios</strong>.</span>
            </div>
          )}

          {estudiante && estudiante.grado && estudiante.seccion && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Cursos del {estudiante.grado}-{estudiante.seccion}</span>
                <span className="text-[11px] text-gray-400">{horarioGrado?.cursos.length ?? 0} cursos</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[260px] overflow-auto">
                {!horarioGrado && <div className="text-[11px] text-gray-400 py-2">Cargando cursos del grado...</div>}
                {horarioGrado && horarioGrado.cursos.length === 0 && (
                  <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] px-3 py-2 text-xs text-[#92400E]">
                    No hay cursos definidos para el {estudiante.grado}-{estudiante.seccion}. Crea los cursos desde la sección <strong>Cursos</strong> primero.
                  </div>
                )}
                {horarioGrado?.cursos.map((c) => {
                  const yaInscrito = resultado?.cursos.find((x) => x.id === c.id && !x.nuevo)
                  return (
                    <div key={c.id} className="h-11 px-3 bg-surface-muted rounded-lg flex items-center gap-2.5">
                      <div className="w-8 h-7 rounded-md bg-inei-600 text-white text-xs font-bold grid place-items-center">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 flex flex-col leading-tight min-w-0">
                        <span className="text-xs font-semibold text-[#1A1A1A] truncate">{c.nombre}</span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {c.codigo} · {c.docente ?? 'Sin docente'}
                        </span>
                      </div>
                      {yaInscrito && <Pill variant="muted" showDot={false}>Ya inscrito</Pill>}
                    </div>
                  )
                })}
              </div>

              {resultado && (
                <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D] flex items-start gap-2">
                  <Check size={14} className="mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{resultado.message}</span>
                    {resultado.cursos.filter((c) => c.nuevo).length > 0 && (
                      <span>Nuevos: {resultado.cursos.filter((c) => c.nuevo).map((c) => c.codigo).join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </FormCard>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">Matrículas recientes</h2>
            <p className="text-[11px] text-gray-400">Últimos estudiantes matriculados</p>
          </div>
          <button className="h-8 px-3 rounded-lg bg-surface-muted text-[11px] text-gray-600 hover:bg-border-softer">
            Ver todas
          </button>
        </div>
        <div>
          <div className="grid grid-cols-[2fr_1fr_1fr_120px_100px_100px] gap-3 h-9 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>Estudiante</span>
            <span>Curso</span>
            <span>Grado · Sección</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {recientes.length === 0 && (
            <div className="py-6 text-center text-xs text-gray-400">
              <UsersIcon size={28} className="mx-auto mb-2 text-gray-300" />
              Sin matrículas registradas todavía.
            </div>
          )}
          {recientes.slice(0, 6).map((m, i) => (
            <div key={m.id}>
              <div className="grid grid-cols-[2fr_1fr_1fr_120px_100px_100px] gap-3 min-h-12 px-3 items-center">
                <div className="flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-full bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                    {m.estudiante.nombres.charAt(0)}{m.estudiante.apellidos.charAt(0)}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">
                      {m.estudiante.nombres} {m.estudiante.apellidos}
                    </span>
                    <span className="text-[10px] text-gray-400">DNI {m.estudiante.dni}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#1A1A1A]">{m.curso.codigo}</span>
                <span className="text-[11px] text-gray-600">
                  {m.estudiante.grado ?? '—'} {m.estudiante.seccion ?? ''}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(m.fecha_matricula).toLocaleDateString('es-PE')}
                </span>
                <Pill variant={m.estado === 'activa' ? 'success' : 'muted'}>
                  {m.estado === 'activa' ? 'Activa' : m.estado}
                </Pill>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <button className="hover:text-[#1A1A1A]" title="Ver"><Eye size={14} /></button>
                  <button onClick={() => setEditandoMatricula(m)} className="hover:text-[#1A1A1A]" title="Editar"><Pencil size={14} /></button>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar la matrícula de ${m.estudiante.nombres} ${m.estudiante.apellidos} en ${m.curso.codigo}?`)) return
                      try {
                        await api.eliminarMatricula(m.id)
                        cargarRecientes()
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'No se pudo eliminar')
                      }
                    }}
                    className="hover:text-inei-600"
                    title="Eliminar"
                  ><Trash2 size={14} /></button>
                </div>
              </div>
              {i < Math.min(recientes.length, 6) - 1 && <div className="h-px bg-border-softer" />}
            </div>
          ))}
        </div>
      </div>

      {editandoMatricula && (
        <EditarMatriculaModal
          matricula={editandoMatricula}
          onClose={() => setEditandoMatricula(null)}
          onSaved={() => { setEditandoMatricula(null); cargarRecientes() }}
        />
      )}

      <div className="bg-white rounded-2xl py-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Summary label="Estudiante" value={estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : '—'} />
          <span className="h-8 w-px bg-border-soft" />
          <Summary label="Grado y sección" value={estudiante ? `${estudiante.grado ?? '?'} - ${estudiante.seccion ?? '?'}` : '—'} />
          <span className="h-8 w-px bg-border-soft" />
          <Summary label="Cursos a inscribir" value={`${horarioGrado?.cursos.length ?? 0} cursos`} />
          <span className="h-8 w-px bg-border-soft" />
          <Summary label="Costo de matrícula" value="S/. 250.00" highlight />
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { setDni(''); setEstudiante(null); setHorarioGrado(null); setResultado(null); setSuccess(null); setError(null) }}
            className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 hover:text-[#1A1A1A]"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={autoMatricular}
            disabled={matriculando || !estudiante || !horarioGrado || horarioGrado.cursos.length === 0}
            className="h-10 px-5 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> {matriculando ? 'Matriculando...' : 'Matricular automáticamente'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof User
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-surface-muted grid place-items-center">
          <Icon size={18} className="text-inei-600" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-[#1A1A1A]">{title}</span>
          <span className="text-[11px] text-gray-400">{subtitle}</span>
        </div>
      </div>
      {children}
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

function Summary({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col leading-tight gap-0.5">
      <span className="text-[11px] text-gray-400">{label}</span>
      <span className={`text-[13px] font-semibold ${highlight ? 'text-inei-600' : 'text-[#1A1A1A]'}`}>
        {value}
      </span>
    </div>
  )
}

function EditarMatriculaModal({
  matricula,
  onClose,
  onSaved,
}: {
  matricula: MatriculaListItem
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    estado: (matricula.estado as MatriculaEstado) ?? 'activa',
    fecha_matricula: matricula.fecha_matricula?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  })
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
            await api.actualizarMatricula(matricula.id, {
              estado: form.estado,
              fecha_matricula: form.fecha_matricula,
            })
            onSaved()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al editar')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Editar matrícula</h2>
            <span className="text-[11px] text-gray-400">
              {matricula.estudiante.nombres} {matricula.estudiante.apellidos} · {matricula.curso.codigo}
            </span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        <Field label="Estado">
          <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as MatriculaEstado })}>
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida</option>
            <option value="retirada">Retirada</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </Field>

        <Field label="Fecha de matrícula">
          <div className="input flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              className="flex-1 bg-transparent focus:outline-none text-sm"
              value={form.fecha_matricula}
              onChange={(e) => setForm({ ...form, fecha_matricula: e.target.value })}
            />
          </div>
        </Field>

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

function Stat({
  icon: Icon,
  label,
  value,
  footer,
  color,
}: {
  icon: typeof UsersIcon
  label: string
  value: string
  footer: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{label}</span>
        <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <span className="text-3xl font-bold text-[#1A1A1A]">{value}</span>
      <span className="text-[11px]" style={{ color }}>{footer}</span>
    </div>
  )
}
