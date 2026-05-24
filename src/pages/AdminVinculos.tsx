import { useEffect, useState } from 'react'
import { HeartHandshake, Link2, Plus, Search, Trash2, Users as UsersIcon, X } from 'lucide-react'
import { api, type Parentesco, type UsuarioBreve, type VinculoPadreEstudiante } from '../lib/api'

const parentescoLabel: Record<Parentesco, string> = {
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor',
  apoderado: 'Apoderado',
}

export default function AdminVinculos() {
  const [vinculos, setVinculos] = useState<VinculoPadreEstudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.vinculosPadreEstudiante()
      .then((r) => setVinculos(r.vinculos))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const desvincular = async (padreId: number, estudianteId: number, padreNombre: string, estNombre: string) => {
    if (!confirm(`¿Eliminar el vínculo entre ${padreNombre} y ${estNombre}?`)) return
    try {
      await api.desvincularPadreEstudiante(padreId, estudianteId)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo eliminar')
    }
  }

  const filtrados = vinculos.filter((v) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [
      v.padre.nombres, v.padre.apellidos, v.padre.dni,
      v.estudiante.nombres, v.estudiante.apellidos, v.estudiante.dni,
    ].some((x) => x?.toLowerCase().includes(q))
  })

  const padresUnicos = new Set(vinculos.map((v) => v.padre.id)).size
  const estudiantesUnicos = new Set(vinculos.map((v) => v.estudiante.id)).size

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Vínculos padre-estudiante</h1>
          <p className="text-sm text-gray-600">Gestiona qué padres tienen acceso a qué estudiantes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus size={16} /> Nuevo vínculo
        </button>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <StatBox icon={Link2} label="Vínculos activos" value={String(vinculos.length)} color="#C8102E" />
        <StatBox icon={UsersIcon} label="Padres con hijos" value={String(padresUnicos)} color="#1E40AF" />
        <StatBox icon={HeartHandshake} label="Estudiantes con padre" value={String(estudiantesUnicos)} color="#15803D" />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-surface-muted">
            <Search size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="flex-1 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-gray-400">{filtrados.length} vínculo(s)</span>
        </div>

        <div className="grid grid-cols-[2fr_2fr_120px_120px_80px] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Padre / madre / tutor</span>
          <span>Estudiante</span>
          <span>Parentesco</span>
          <span>Fecha vínculo</span>
          <span></span>
        </div>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && filtrados.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Link2 size={36} className="text-gray-300" />
            <p className="text-sm text-gray-500">No hay vínculos registrados.</p>
          </div>
        )}

        {filtrados.map((v, i) => (
          <div key={`${v.padre.id}-${v.estudiante.id}`}>
            <div className="grid grid-cols-[2fr_2fr_120px_120px_80px] gap-3 min-h-12 px-3 items-center">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-[#1E40AF] text-white text-[10px] font-bold grid place-items-center">
                  {v.padre.nombres.charAt(0)}{v.padre.apellidos.charAt(0)}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{v.padre.nombres} {v.padre.apellidos}</span>
                  <span className="text-[10px] text-gray-400">DNI {v.padre.dni} · {v.padre.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                  {v.estudiante.nombres.charAt(0)}{v.estudiante.apellidos.charAt(0)}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{v.estudiante.nombres} {v.estudiante.apellidos}</span>
                  <span className="text-[10px] text-gray-400">DNI {v.estudiante.dni} · {v.estudiante.grado ?? '—'} {v.estudiante.seccion ?? ''}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#1A1A1A] capitalize">{parentescoLabel[v.parentesco] ?? v.parentesco}</span>
              <span className="text-[11px] text-gray-500">{v.fecha ? new Date(v.fecha).toLocaleDateString('es-PE') : '—'}</span>
              <button
                onClick={() => desvincular(v.padre.id, v.estudiante.id, `${v.padre.nombres} ${v.padre.apellidos}`, `${v.estudiante.nombres} ${v.estudiante.apellidos}`)}
                className="text-gray-400 hover:text-inei-600 justify-self-end"
                title="Eliminar vínculo"
              ><Trash2 size={14} /></button>
            </div>
            {i < filtrados.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>

      {modalOpen && (
        <NuevoVinculoModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}

function NuevoVinculoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [padres, setPadres] = useState<UsuarioBreve[]>([])
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [form, setForm] = useState<{ padre_id: number | null; estudiante_id: number | null; parentesco: Parentesco }>({
    padre_id: null,
    estudiante_id: null,
    parentesco: 'padre',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.usuariosPorRol('padre').then((r) => setPadres(r.users)),
      api.usuariosPorRol('estudiante').then((r) => setEstudiantes(r.users)),
    ])
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!form.padre_id || !form.estudiante_id) {
            setErr('Selecciona un padre y un estudiante')
            return
          }
          setSaving(true)
          setErr(null)
          try {
            await api.vincularPadreEstudiante({
              padre_id: form.padre_id,
              estudiante_id: form.estudiante_id,
              parentesco: form.parentesco,
            })
            onSaved()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'No se pudo crear el vínculo')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Nuevo vínculo padre-estudiante</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Padre / madre / tutor</label>
          <select
            required
            className="input"
            value={form.padre_id ?? ''}
            onChange={(e) => setForm({ ...form, padre_id: Number(e.target.value) })}
          >
            <option value="">Selecciona un padre...</option>
            {padres.map((p) => (
              <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} · DNI {p.dni}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Estudiante</label>
          <select
            required
            className="input"
            value={form.estudiante_id ?? ''}
            onChange={(e) => setForm({ ...form, estudiante_id: Number(e.target.value) })}
          >
            <option value="">Selecciona un estudiante...</option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} · DNI {e.dni} · {e.grado ?? '?'} {e.seccion ?? ''}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Parentesco</label>
          <select
            className="input"
            value={form.parentesco}
            onChange={(e) => setForm({ ...form, parentesco: e.target.value as Parentesco })}
          >
            {(['padre', 'madre', 'tutor', 'apoderado'] as Parentesco[]).map((p) => (
              <option key={p} value={p}>{parentescoLabel[p]}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Guardando...' : 'Crear vínculo'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Link2; label: string; value: string; color: string }) {
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
