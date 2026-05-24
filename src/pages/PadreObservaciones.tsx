import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { api, loadAuth, type HijoResumen, type ObservacionDTO } from '../lib/api'

const tipoColor: Record<string, string> = {
  academica: '#1E40AF',
  conducta: '#991B1B',
  asistencia: '#92400E',
  otra: '#6B7280',
}

const prioridadColor: Record<string, string> = {
  baja: '#15803D',
  media: '#92400E',
  alta: '#991B1B',
}

export default function PadreObservaciones() {
  const auth = loadAuth()
  const [hijos, setHijos] = useState<HijoResumen[]>([])
  const [hijoSel, setHijoSel] = useState<HijoResumen | null>(null)
  const [obs, setObs] = useState<ObservacionDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.hijosDePadre(auth.id).then((r) => { setHijos(r.hijos); setHijoSel(r.hijos[0] ?? null) }).finally(() => setLoading(false))
  }, [auth?.id])
  useEffect(() => {
    if (!hijoSel) return
    api.observaciones({ estudiante_id: hijoSel.id }).then((r) => setObs(r.observaciones)).catch(() => setObs([]))
  }, [hijoSel?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Observaciones</h1>
          <p className="text-sm text-gray-600">Comentarios y llamados de atención registrados por los docentes</p>
        </div>
        {hijos.length > 1 && hijoSel && (
          <select className="h-10 px-3.5 rounded-lg bg-white border border-border-soft text-xs font-semibold" value={hijoSel.id} onChange={(e) => setHijoSel(hijos.find((h) => h.id === Number(e.target.value)) ?? null)}>
            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombres} {h.apellidos}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando...</div>}

      {hijoSel && (
        <div className="flex flex-col gap-3">
          {obs.length === 0 && (
            <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
              <CircleAlert size={36} className="text-gray-300" />
              <p className="text-sm text-gray-500">{hijoSel.nombres.split(' ')[0]} no tiene observaciones registradas.</p>
            </div>
          )}
          {obs.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl p-4 flex gap-3">
              <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: `${tipoColor[o.tipo] ?? '#6B7280'}20` }}>
                <CircleAlert size={18} style={{ color: tipoColor[o.tipo] ?? '#6B7280' }} />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: `${tipoColor[o.tipo] ?? '#6B7280'}20`, color: tipoColor[o.tipo] ?? '#6B7280' }}>{o.tipo}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: `${prioridadColor[o.prioridad] ?? '#6B7280'}20`, color: prioridadColor[o.prioridad] ?? '#6B7280' }}>{o.prioridad}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{o.fecha ? new Date(o.fecha).toLocaleDateString('es-PE') : '—'}</span>
                </div>
                <p className="text-xs text-[#1A1A1A]">{o.descripcion}</p>
                <span className="text-[10px] text-gray-400">Registrado por: {o.docente ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
