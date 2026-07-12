import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, BookOpen, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type UsuarioBreve } from '../lib/api'

export default function AdminDocentes() {
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const cargar = () => {
    api.usuariosPorRol('docente')
      .then((r) => setDocentes(r.users))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    if (!term) return docentes
    return docentes.filter((d) =>
      `${d.nombres} ${d.apellidos} ${d.dni}`.toLowerCase().includes(term)
    )
  }, [q, docentes])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Docentes</h1>
          <p className="text-sm text-gray-600">
            {docentes.length} docentes asignados a cursos del periodo 2026 - I
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo docente
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-surface-muted">
            <Search size={14} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="flex-1 text-xs bg-transparent focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-gray-400">{filtered.length} resultado(s)</span>
        </div>

        <div className="grid grid-cols-[60px_140px_1fr_140px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Foto</span>
          <span>DNI</span>
          <span>Nombres y apellidos</span>
          <span>Acciones</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-gray-400">Cargando docentes...</div>
        )}

        {filtered.map((d, i) => (
          <div key={d.id}>
            <div className="grid grid-cols-[60px_140px_1fr_140px] gap-3 min-h-14 px-3.5 items-center py-2">
              <div className="h-9 w-9 rounded-full bg-[#1A1A1A] grid place-items-center text-white text-xs font-bold">
                {d.nombres.charAt(0)}{d.apellidos.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A]">{d.dni}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{d.nombres} {d.apellidos}</span>
                <span className="text-[10px] text-gray-400">Docente</span>
              </div>
              <Link
                to={`/cursos?docente=${encodeURIComponent(`${d.nombres} ${d.apellidos}`)}`}
                className="text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1"
              >
                <BookOpen size={12} /> Ver cursos
              </Link>
            </div>
            {i < filtered.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>

      {modalOpen && (
        <NuevoDocenteModal
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); cargar() }}
        />
      )}
    </div>
  )
}

/** Alta de docente: crea el usuario + su perfil (código y especialidad); el email institucional se genera solo. */
function NuevoDocenteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ dni: '', nombres: '', apellidos: '', telefono: '', especialidad: '', password: '', confirmar: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          if (form.password !== form.confirmar) { setErr('Las contraseñas no coinciden'); return }
          setSaving(true)
          setErr(null)
          try {
            const r = await api.crearUsuario({
              dni: form.dni,
              nombres: form.nombres,
              apellidos: form.apellidos,
              telefono: form.telefono || undefined,
              password: form.password,
              password_confirmation: form.confirmar,
              rol: 'docente',
              especialidad: form.especialidad || undefined,
            })
            alert(`Docente creado.\nEmail institucional: ${(r.user as { email?: string }).email ?? '—'}\nYa puede asignarle cursos desde Asignaciones.`)
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error al crear el docente')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Nuevo docente</h2>
            <span className="text-[11px] text-gray-400">El email institucional (nombre.apellido@inei46.edu.pe) se genera automáticamente</span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        <div className="grid grid-cols-[120px_1fr] gap-3">
          <CampoDocente label="DNI">
            <input required className="input" maxLength={8} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
          </CampoDocente>
          <CampoDocente label="Especialidad">
            <input className="input" maxLength={120} placeholder="Ej. Matemáticas" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />
          </CampoDocente>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoDocente label="Nombres">
            <input required className="input" maxLength={80} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
          </CampoDocente>
          <CampoDocente label="Apellidos">
            <input required className="input" maxLength={80} value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </CampoDocente>
        </div>

        <CampoDocente label="Teléfono (opcional)">
          <input className="input" maxLength={20} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </CampoDocente>

        <div className="grid grid-cols-2 gap-3">
          <CampoDocente label="Contraseña">
            <input required type="password" minLength={8} className="input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </CampoDocente>
          <CampoDocente label="Confirmar contraseña">
            <input required type="password" minLength={8} className="input" placeholder="Repite la contraseña" value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} />
          </CampoDocente>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Creando...' : 'Crear docente'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CampoDocente({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
