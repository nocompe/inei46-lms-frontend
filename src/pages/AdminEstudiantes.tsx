import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type UsuarioBreve } from '../lib/api'

export default function AdminEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    api.usuariosPorRol('estudiante')
      .then((r) => setEstudiantes(r.users))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    if (!term) return estudiantes
    return estudiantes.filter((e) =>
      `${e.nombres} ${e.apellidos} ${e.dni}`.toLowerCase().includes(term)
    )
  }, [q, estudiantes])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Estudiantes</h1>
          <p className="text-sm text-gray-600">
            {estudiantes.length} estudiantes registrados en el periodo 2026 - I
          </p>
        </div>
        <Link
          to="/registro"
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo estudiante
        </Link>
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
          <span className="text-[11px] text-gray-400">
            {filtered.length} resultado(s)
          </span>
        </div>

        <div className="grid grid-cols-[60px_140px_1fr_120px_120px_120px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Foto</span>
          <span>DNI</span>
          <span>Nombres y apellidos</span>
          <span>Grado</span>
          <span>Sección</span>
          <span>Acciones</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-gray-400">Cargando estudiantes...</div>
        )}

        {filtered.map((e, i) => (
          <div key={e.id}>
            <div className="grid grid-cols-[60px_140px_1fr_120px_120px_120px] gap-3 min-h-14 px-3.5 items-center py-2">
              <div className="h-9 w-9 rounded-full bg-inei-600 grid place-items-center text-white text-xs font-bold">
                {e.nombres.charAt(0)}{e.apellidos.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A]">{e.dni}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{e.nombres} {e.apellidos}</span>
                <span className="text-[10px] text-gray-400">{e.rol}</span>
              </div>
              <span className="text-xs text-gray-600">{e.grado ?? '—'}</span>
              <span className="text-xs text-gray-600">{e.seccion ?? '—'}</span>
              <Link
                to={`/matricula?dni=${e.dni}`}
                className="text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1"
              >
                <GraduationCap size={12} /> Matricular
              </Link>
            </div>
            {i < filtered.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>
    </div>
  )
}
