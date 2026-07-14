import { useEffect, useState } from 'react'
import {
  Plus, X, Pencil, Trash2, GraduationCap, BookOpen, Users as UsersIcon, Search, ShieldCheck,
} from 'lucide-react'
import Pill from '../components/Pill'
import { api, type NuevoUsuario, type UsuarioBreve } from '../lib/api'

type Rol = 'admin' | 'docente' | 'estudiante' | 'padre'

const rolIcons: Record<Rol, typeof BookOpen> = {
  admin: ShieldCheck, docente: BookOpen, estudiante: GraduationCap, padre: UsersIcon,
}
const rolLabel: Record<Rol, string> = {
  admin: 'Administrador', docente: 'Docente', estudiante: 'Estudiante', padre: 'Padre de familia',
}

export default function AdminUsuarios() {
  const [tab, setTab] = useState<Rol>('docente')
  const [users, setUsers] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UsuarioBreve | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.usuariosPorRol(tab)
      .then((r) => setUsers(r.users))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [tab])

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    try {
      await api.eliminarUsuario(id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo eliminar')
    }
  }

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [u.nombres, u.apellidos, u.dni].some((v) => v?.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestión de usuarios</h1>
          <p className="text-sm text-gray-600">Crea, edita o desactiva usuarios del sistema</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}

      <div className="flex gap-1 border-b border-border-soft overflow-x-auto">
        {(['docente', 'estudiante', 'padre', 'admin'] as Rol[]).map((r) => {
          const Icon = rolIcons[r]
          return (
            <button key={r} onClick={() => setTab(r)} className={`px-4 py-2.5 text-[13px] inline-flex items-center gap-2 ${tab === r ? 'font-bold text-inei-600 border-b-2 border-inei-600' : 'text-gray-600 hover:text-[#1A1A1A]'}`}>
              <Icon size={14} /> {rolLabel[r]}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 h-9 w-full max-w-72 px-3 rounded-lg bg-surface-muted">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI..." className="flex-1 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none" />
          </div>
          <span className="text-[11px] text-gray-400">{filtered.length} {rolLabel[tab].toLowerCase()}(s)</span>
        </div>

        <div className="overflow-x-auto">
        <div className="min-w-[760px] flex flex-col gap-3">
        <div className="grid grid-cols-[100px_2fr_1fr_120px_100px_100px] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>DNI</span><span>Nombre</span><span>Email</span><span>Grado · Sección</span><span>Estado</span><span></span>
        </div>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && filtered.length === 0 && <div className="py-10 text-center text-xs text-gray-400">No hay usuarios.</div>}

        {filtered.map((u, i) => (
          <div key={u.id}>
            <div className="grid grid-cols-[100px_2fr_1fr_120px_100px_100px] gap-3 min-h-12 px-3 items-center">
              <span className="text-xs font-semibold text-[#1A1A1A]">{u.dni}</span>
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                  {u.nombres.charAt(0)}{u.apellidos.charAt(0)}
                </span>
                <span className="text-xs font-semibold text-[#1A1A1A]">{u.nombres} {u.apellidos}</span>
              </div>
              <span className="text-[11px] text-gray-500 truncate">{(u as any).email ?? '—'}</span>
              <span className="text-[11px] text-gray-600">{u.grado ?? '—'} {u.seccion ?? ''}</span>
              <Pill variant={(u as any).estado === false ? 'muted' : 'success'}>
                {(u as any).estado === false ? 'Inactivo' : 'Activo'}
              </Pill>
              <div className="flex items-center gap-2 text-gray-400">
                <button onClick={() => { setEditing(u); setModalOpen(true) }} className="hover:text-[#1A1A1A]"><Pencil size={14} /></button>
                <button onClick={() => eliminar(u.id)} className="hover:text-inei-600"><Trash2 size={14} /></button>
              </div>
            </div>
            {i < filtered.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
        </div>
        </div>
      </div>

      {modalOpen && (
        <UsuarioModal
          editing={editing}
          rolDefault={tab}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { setModalOpen(false); setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function UsuarioModal({
  editing,
  rolDefault,
  onClose,
  onSaved,
}: {
  editing: UsuarioBreve | null
  rolDefault: Rol
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!editing
  const [form, setForm] = useState<NuevoUsuario & { estado: boolean }>({
    dni: editing?.dni ?? '',
    nombres: editing?.nombres ?? '',
    apellidos: editing?.apellidos ?? '',
    email: (editing as any)?.email ?? '',
    telefono: (editing as any)?.telefono ?? '',
    password: '',
    rol: (editing?.rol as Rol) ?? rolDefault,
    grado: editing?.grado ?? '',
    seccion: editing?.seccion ?? '',
    estado: (editing as any)?.estado ?? true,
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setErr(null)
          try {
            if (isEdit && editing) {
              const payload: Partial<NuevoUsuario> & { estado?: boolean } = {
                nombres: form.nombres,
                apellidos: form.apellidos,
                email: form.email,
                telefono: form.telefono || undefined,
                rol: form.rol,
                grado: form.rol === 'estudiante' ? (form.grado || undefined) : undefined,
                seccion: form.rol === 'estudiante' ? (form.seccion || undefined) : undefined,
                estado: form.estado,
              }
              if (form.password) payload.password = form.password
              await api.actualizarUsuario(editing.id, payload)
            } else {
              if (form.password !== confirmPassword) {
                setErr('Las contraseñas no coinciden')
                setSaving(false)
                return
              }
              const r = await api.crearUsuario({
                dni: form.dni,
                nombres: form.nombres,
                apellidos: form.apellidos,
                email: form.email || undefined, // vacío → el backend genera el institucional
                telefono: form.telefono || undefined,
                password: form.password,
                password_confirmation: confirmPassword,
                rol: form.rol,
                grado: form.rol === 'estudiante' ? form.grado : undefined,
                seccion: form.rol === 'estudiante' ? form.seccion : undefined,
                especialidad: form.rol === 'docente' ? (especialidad || undefined) : undefined,
              })
              if (!form.email && (r.user as any)?.email) {
                alert(`Usuario creado. Email institucional generado: ${(r.user as any).email}`)
              }
            }
            onSaved()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
          <Field label="DNI">
            <input required disabled={isEdit} className={`input ${isEdit ? 'bg-border-softer cursor-not-allowed' : ''}`} maxLength={8} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
          </Field>
          <Field label="Rol">
            <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
              <option value="docente">Docente</option>
              <option value="estudiante">Estudiante</option>
              <option value="padre">Padre de familia</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombres"><input required className="input" maxLength={80} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} /></Field>
          <Field label="Apellidos"><input required className="input" maxLength={80} value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} /></Field>
        </div>

        <Field label={isEdit ? 'Email' : 'Email (vacío = se genera nombre.apellido@inei46.edu.pe)'}>
          <input required={isEdit} type="email" className="input" maxLength={120} placeholder={isEdit ? '' : 'Automático si lo dejas vacío'} value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Teléfono (opcional)"><input className="input" maxLength={20} value={form.telefono ?? ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>

        {!isEdit && form.rol === 'docente' && (
          <Field label="Especialidad (se guarda en el perfil del docente)">
            <input className="input" maxLength={120} placeholder="Ej. Matemáticas, Comunicación..." value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
          </Field>
        )}

        {form.rol === 'estudiante' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Grado">
              <select className="input" value={form.grado ?? ''} onChange={(e) => setForm({ ...form, grado: e.target.value })}>
                <option value="">—</option>
                {['1ro', '2do', '3ro', '4to', '5to'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Sección">
              <select className="input" value={form.seccion ?? ''} onChange={(e) => setForm({ ...form, seccion: e.target.value })}>
                <option value="">—</option>
                {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        )}

        <Field label={isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}>
          <input type="password" required={!isEdit} minLength={8} className="input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {!isEdit && (
          <Field label="Confirmar contraseña">
            <input type="password" required minLength={8} className="input" placeholder="Repite la contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
        )}

        {isEdit && (
          <Field label="Estado">
            <select className="input" value={form.estado ? '1' : '0'} onChange={(e) => setForm({ ...form, estado: e.target.value === '1' })}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
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
