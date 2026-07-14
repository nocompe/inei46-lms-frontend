import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { api, loadAuth, type HorarioItem } from '../lib/api'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']

export default function EstudianteHorario() {
  const auth = loadAuth()
  const [horarios, setHorarios] = useState<HorarioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.miHorario(auth.id).then((r) => setHorarios(r.horarios)).finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const porDia = (dia: string) => horarios.filter((h) => h.dia_semana === dia)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mi horario semanal</h1>
        <p className="text-sm text-gray-600">Bloques de clase por curso · Periodo 2026 - I</p>
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando horario...</div>}
      {!loading && horarios.length === 0 && (
        <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
          <Calendar size={36} className="text-gray-300" />
          <p className="text-sm text-gray-500">Aún no se han asignado horarios para tus cursos.</p>
        </div>
      )}

      {!loading && horarios.length > 0 && (
        <div className="overflow-x-auto">
        <div className="min-w-[900px] grid grid-cols-5 gap-3">
          {DIAS.map((d) => (
            <div key={d} className="bg-white rounded-2xl p-3 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-center uppercase text-gray-400 pb-2 border-b border-border-softer">{d}</h3>
              <div className="flex flex-col gap-2">
                {porDia(d).length === 0 && <span className="text-[10px] text-gray-300 text-center py-4">Sin clases</span>}
                {porDia(d).map((h, i) => (
                  <div key={i} className="bg-inei-50 border-l-2 border-inei-600 rounded-md p-2 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-inei-700 inline-flex items-center gap-1"><Clock size={10} /> {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}</span>
                    <span className="text-[12px] font-bold text-[#1A1A1A] leading-tight">{h.curso}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{h.codigo}</span>
                    {h.aula && <span className="text-[10px] text-gray-500 inline-flex items-center gap-1"><MapPin size={10} /> {h.aula}</span>}
                    <span className="text-[10px] text-gray-400 leading-tight">{h.docente}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}
