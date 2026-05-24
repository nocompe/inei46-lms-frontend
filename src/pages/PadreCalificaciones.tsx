import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { api, loadAuth, type CalificacionDTO, type HijoResumen } from '../lib/api'

export default function PadreCalificaciones() {
  const auth = loadAuth()
  const [hijos, setHijos] = useState<HijoResumen[]>([])
  const [hijoSel, setHijoSel] = useState<HijoResumen | null>(null)
  const [cals, setCals] = useState<CalificacionDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.hijosDePadre(auth.id)
      .then((r) => {
        setHijos(r.hijos)
        setHijoSel(r.hijos[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [auth?.id])

  useEffect(() => {
    if (!hijoSel) return
    api.calificacionesPorEstudiante(hijoSel.id).then((r) => setCals(r.calificaciones)).catch(() => setCals([]))
  }, [hijoSel?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Calificaciones</h1>
          <p className="text-sm text-gray-600">Historial completo de notas de tus hijos</p>
        </div>
        {hijos.length > 1 && hijoSel && (
          <select
            className="h-10 px-3.5 rounded-lg bg-white border border-border-soft text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-inei-600"
            value={hijoSel.id}
            onChange={(e) => {
              const h = hijos.find((x) => x.id === Number(e.target.value))
              if (h) setHijoSel(h)
            }}
          >
            {hijos.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombres} {h.apellidos}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl py-12 text-center text-xs text-gray-400">Cargando...</div>
      )}

      {!loading && hijoSel && (
        <>
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-inei-600 grid place-items-center text-white font-bold">
              {hijoSel.nombres.charAt(0)}
            </div>
            <div className="flex flex-col leading-tight flex-1">
              <span className="text-base font-bold text-[#1A1A1A]">
                {hijoSel.nombres} {hijoSel.apellidos}
              </span>
              <span className="text-[11px] text-gray-400">
                DNI {hijoSel.dni} · {hijoSel.grado ?? '—'}-{hijoSel.seccion ?? '—'}
              </span>
            </div>
            {hijoSel.promedio != null && (
              <div className="flex items-center gap-3">
                <Trophy size={16} className="text-inei-600" />
                <div className="flex flex-col items-end leading-none">
                  <span className="text-2xl font-bold text-[#1A1A1A]">{hijoSel.promedio}</span>
                  <span className="text-[10px] text-gray-400">Promedio / 20</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Calificaciones registradas</h2>
            <div className="grid grid-cols-[1.2fr_1.5fr_120px_80px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
              <span>Curso</span>
              <span>Evaluación</span>
              <span>Fecha</span>
              <span>Nota</span>
            </div>
            {cals.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                Aún no hay calificaciones registradas para {hijoSel.nombres.split(' ')[0]}.
              </div>
            )}
            {cals.map((n, i) => {
              const aprobado = n.puntaje != null && n.puntaje >= 11
              return (
                <div key={`${n.tarea}-${i}`}>
                  <div className="grid grid-cols-[1.2fr_1.5fr_120px_80px] gap-3 min-h-12 px-3.5 items-center py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                        {n.curso.charAt(0)}
                      </span>
                      <span className="text-xs font-semibold text-[#1A1A1A]">{n.curso}</span>
                    </div>
                    <span className="text-xs text-gray-600 truncate">{n.tarea}</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(n.fecha_entrega).toLocaleDateString('es-PE')}
                    </span>
                    <span
                      className="h-6 px-2.5 rounded-full text-[12px] font-bold inline-flex items-center justify-center"
                      style={{
                        background: n.puntaje == null ? '#F3F4F6' : aprobado ? '#DCFCE7' : '#FEF3C7',
                        color: n.puntaje == null ? '#9CA3AF' : aprobado ? '#15803D' : '#92400E',
                      }}
                    >
                      {n.puntaje == null ? '—' : Number(n.puntaje).toFixed(0)}
                    </span>
                  </div>
                  {i < cals.length - 1 && <div className="h-px bg-border-softer" />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
