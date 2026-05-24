import { useEffect, useState } from 'react'
import { Search, Mail } from 'lucide-react'
import { api, loadAuth, type EstudianteDocenteDTO } from '../lib/api'

export default function DocenteEstudiantes() {
  const auth = loadAuth()
  const [estudiantes, setEstudiantes] = useState<EstudianteDocenteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!auth) return
    api.miEstudiantes(auth.id)
      .then((r) => setEstudiantes(r.estudiantes))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const term = q.toLowerCase().trim()
  const filtered = !term
    ? estudiantes
    : estudiantes.filter((e) =>
        `${e.nombres} ${e.apellidos} ${e.dni}`.toLowerCase().includes(term)
      )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis estudiantes</h1>
        <p className="text-sm text-gray-600">
          Estudiantes matriculados en los cursos que dictas ({estudiantes.length} en total)
        </p>
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

        <div className="grid grid-cols-[60px_130px_1fr_1.2fr_90px_70px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Foto</span>
          <span>DNI</span>
          <span>Nombres y apellidos</span>
          <span>Correo</span>
          <span>Grado/Sec</span>
          <span>Cursos</span>
        </div>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando estudiantes...</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-400">
            No tienes estudiantes matriculados en tus cursos todavía.
          </div>
        )}

        {filtered.map((e, i) => (
          <div key={e.id}>
            <div className="grid grid-cols-[60px_130px_1fr_1.2fr_90px_70px] gap-3 min-h-14 px-3.5 items-center py-2">
              <div className="h-9 w-9 rounded-full bg-inei-600 grid place-items-center text-white text-xs font-bold">
                {e.nombres.charAt(0)}{e.apellidos.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A]">{e.dni}</span>
              <span className="text-[13px] font-semibold text-[#1A1A1A]">{e.nombres} {e.apellidos}</span>
              <span className="text-xs text-gray-600 truncate inline-flex items-center gap-1.5">
                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                {e.email}
              </span>
              <span className="text-xs text-gray-600">{e.grado ?? '—'} {e.seccion ?? ''}</span>
              <span className="text-xs font-semibold text-[#1A1A1A]">{e.cursos}</span>
            </div>
            {i < filtered.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>
    </div>
  )
}
