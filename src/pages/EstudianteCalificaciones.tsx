import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { api, loadAuth, type CalificacionDTO } from '../lib/api'

export default function EstudianteCalificaciones() {
  const auth = loadAuth()
  const [calificaciones, setCalificaciones] = useState<CalificacionDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.calificacionesPorEstudiante(auth.id)
      .then((r) => setCalificaciones(r.calificaciones))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const conNota = calificaciones.filter((c) => c.puntaje != null)
  const promedio = conNota.length > 0
    ? conNota.reduce((a, b) => a + (b.puntaje ?? 0), 0) / conNota.length
    : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis calificaciones</h1>
        <p className="text-sm text-gray-600">
          Historial completo de evaluaciones y tareas calificadas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Promedio general" value={promedio != null ? `${promedio.toFixed(1)} / 20` : '—'} icon={Trophy} highlight />
        <Stat label="Evaluaciones calificadas" value={String(conNota.length)} icon={Trophy} />
        <Stat label="Pendientes de calificar" value={String(calificaciones.length - conNota.length)} icon={Trophy} />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1A1A1A]">Historial</h2>
        <div className="grid grid-cols-[1.2fr_1.5fr_120px_80px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Curso</span>
          <span>Evaluación</span>
          <span>Fecha</span>
          <span>Nota</span>
        </div>

        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && calificaciones.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-400">
            Aún no hay calificaciones registradas en tu historial.
          </div>
        )}

        {calificaciones.map((c, i) => {
          const aprobado = c.puntaje != null && c.puntaje >= 11
          return (
            <div key={`${c.tarea}-${i}`}>
              <div className="grid grid-cols-[1.2fr_1.5fr_120px_80px] gap-3 min-h-12 px-3.5 items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                    {c.curso.charAt(0)}
                  </span>
                  <span className="text-xs font-semibold text-[#1A1A1A]">{c.curso}</span>
                </div>
                <span className="text-xs text-gray-600 truncate">{c.tarea}</span>
                <span className="text-[11px] text-gray-400">{new Date(c.fecha_entrega).toLocaleDateString('es-PE')}</span>
                <span
                  className="h-6 px-2.5 rounded-full text-[12px] font-bold inline-flex items-center justify-center"
                  style={{
                    background: c.puntaje == null ? '#F3F4F6' : aprobado ? '#DCFCE7' : '#FEF3C7',
                    color: c.puntaje == null ? '#9CA3AF' : aprobado ? '#15803D' : '#92400E',
                  }}
                >
                  {c.puntaje == null ? '—' : Number(c.puntaje).toFixed(0)}
                </span>
              </div>
              {i < calificaciones.length - 1 && <div className="h-px bg-border-softer" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, highlight = false }: { label: string; value: string; icon: typeof Trophy; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 ${highlight ? 'bg-inei-600 text-white' : 'bg-white'}`}>
      <div className={`h-12 w-12 rounded-xl grid place-items-center ${highlight ? 'bg-white/15' : 'bg-inei-100'}`}>
        <Icon size={20} className={highlight ? 'text-white' : 'text-inei-600'} />
      </div>
      <div className="flex flex-col">
        <span className={`text-[11px] ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <span className={`text-2xl font-bold ${highlight ? '' : 'text-[#1A1A1A]'}`}>{value}</span>
      </div>
    </div>
  )
}
