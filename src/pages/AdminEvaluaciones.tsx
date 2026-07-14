import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import Pill from '../components/Pill'
import { api, type TareaDTO, type TipoTarea } from '../lib/api'

const tipoLabel: Record<TipoTarea, string> = { tarea: 'Tarea', evaluacion: 'Evaluación', examen: 'Examen' }
const tipoVariant: Record<TipoTarea, 'success' | 'warning' | 'danger'> = {
  tarea: 'success', evaluacion: 'warning', examen: 'danger',
}

export default function AdminEvaluaciones() {
  const [tareas, setTareas] = useState<TareaDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.tareas()
      .then((r) => setTareas(r.tareas))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Evaluaciones</h1>
        <p className="text-sm text-gray-600">
          Vista general de tareas, evaluaciones y exámenes registrados en el sistema
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="overflow-x-auto">
        <div className="min-w-[760px] flex flex-col gap-3">
        <div className="grid grid-cols-[100px_1fr_1.2fr_140px_90px_90px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Tipo</span>
          <span>Título</span>
          <span>Curso</span>
          <span>Fecha límite</span>
          <span>Puntaje</span>
          <span>Estado</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-gray-400">Cargando evaluaciones...</div>
        )}
        {!loading && tareas.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-400">
            <FileText size={32} className="mx-auto mb-2 text-gray-300" />
            Aún no hay evaluaciones registradas.
          </div>
        )}

        {tareas.map((t, i) => (
          <div key={t.id}>
            <div className="grid grid-cols-[100px_1fr_1.2fr_140px_90px_90px] gap-3 min-h-14 px-3.5 items-center py-2">
              <Pill variant={tipoVariant[t.tipo]} showDot={false}>{tipoLabel[t.tipo]}</Pill>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.titulo}</span>
                {t.descripcion && <span className="text-[10px] text-gray-400 line-clamp-1">{t.descripcion}</span>}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-[#1A1A1A]">{t.curso.codigo} · {t.curso.nombre}</span>
                <span className="text-[10px] text-gray-400">{t.curso.docente}</span>
              </div>
              <span className="text-xs text-gray-600">{new Date(t.fecha_limite).toLocaleDateString('es-PE')}</span>
              <span className="text-xs font-semibold text-[#1A1A1A]">{t.puntaje_maximo} pts</span>
              <Pill variant={t.publicada ? 'success' : 'muted'}>
                {t.publicada ? 'Publicada' : 'Borrador'}
              </Pill>
            </div>
            {i < tareas.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
        </div>
        </div>
      </div>
    </div>
  )
}
