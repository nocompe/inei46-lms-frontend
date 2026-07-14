import { useEffect, useState } from 'react'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, loadAuth, type MiCurso } from '../lib/api'

export default function EstudianteMisCursos() {
  const auth = loadAuth()
  const [cursos, setCursos] = useState<MiCurso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.miCursos(auth.id)
      .then((r) => setCursos(r.cursos))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis cursos</h1>
        <p className="text-sm text-gray-600">
          Cursos en los que estás matriculado este periodo
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl py-12 text-center text-xs text-gray-400">
          Cargando cursos...
        </div>
      )}

      {!loading && cursos.length === 0 && (
        <div className="bg-white rounded-2xl py-12 text-center text-xs text-gray-400">
          <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
          Aún no estás matriculado en ningún curso.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cursos.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-inei-100 grid place-items-center text-inei-600 text-lg font-bold">
                {c.nombre.charAt(0)}
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400">{c.codigo}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#1A1A1A]">{c.nombre}</h3>
              <p className="text-xs text-gray-600">{c.descripcion ?? 'Sin descripción'}</p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border-softer">
              <Row label="Docente" value={c.docente ?? '—'} />
              <Row label="Grado · Sección" value={`${c.grado}-${c.seccion}`} />
              <Row label="Periodo" value={c.periodo} />
            </div>
            <Link
              to={`/estudiante/cursos/${c.id}`}
              className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              Ver material del curso <ArrowRight size={13} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-[#1A1A1A]">{value}</span>
    </div>
  )
}
