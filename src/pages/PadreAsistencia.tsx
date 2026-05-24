import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import Pill from '../components/Pill'
import { api, loadAuth, type AsistenciaItemDTO, type AsistenciaResumen, type HijoResumen } from '../lib/api'

const estadoVariant = (e: string): 'success' | 'warning' | 'danger' | 'muted' => {
  if (e === 'presente') return 'success'
  if (e === 'tarde') return 'warning'
  if (e === 'ausente') return 'danger'
  return 'muted'
}

export default function PadreAsistencia() {
  const auth = loadAuth()
  const [hijos, setHijos] = useState<HijoResumen[]>([])
  const [hijoSel, setHijoSel] = useState<HijoResumen | null>(null)
  const [items, setItems] = useState<AsistenciaItemDTO[]>([])
  const [resumen, setResumen] = useState<AsistenciaResumen | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    api.hijosDePadre(auth.id).then((r) => { setHijos(r.hijos); setHijoSel(r.hijos[0] ?? null) }).finally(() => setLoading(false))
  }, [auth?.id])

  useEffect(() => {
    if (!hijoSel) return
    api.asistenciasEstudiante(hijoSel.id).then((r) => { setItems(r.items); setResumen(r.resumen) }).catch(() => { setItems([]); setResumen(null) })
  }, [hijoSel?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Asistencia</h1>
          <p className="text-sm text-gray-600">Registro completo de asistencia</p>
        </div>
        {hijos.length > 1 && hijoSel && (
          <select className="h-10 px-3.5 rounded-lg bg-white border border-border-soft text-xs font-semibold" value={hijoSel.id} onChange={(e) => setHijoSel(hijos.find((h) => h.id === Number(e.target.value)) ?? null)}>
            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombres} {h.apellidos}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando...</div>}

      {hijoSel && resumen && (
        <>
          <div className="grid grid-cols-4 gap-3.5">
            <Box label="Asistencia general" value={resumen.porcentaje != null ? `${resumen.porcentaje}%` : '—'} color="#15803D" />
            <Box label="Presentes" value={String(resumen.presentes)} color="#15803D" />
            <Box label="Tardes" value={String(resumen.tardes)} color="#92400E" />
            <Box label="Ausentes" value={String(resumen.ausentes)} color="#991B1B" />
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Historial</h2>
            <div className="grid grid-cols-[120px_1.5fr_120px_1fr] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
              <span>Fecha</span><span>Curso</span><span>Estado</span><span>Observación</span>
            </div>
            {items.length === 0 && <div className="py-8 text-center text-xs text-gray-400"><CalendarCheck size={28} className="mx-auto mb-2 text-gray-300" />Sin registros de asistencia aún.</div>}
            {items.map((it, i) => (
              <div key={i}>
                <div className="grid grid-cols-[120px_1.5fr_120px_1fr] gap-3 min-h-12 px-3 items-center">
                  <span className="text-xs text-gray-600">{new Date(it.fecha).toLocaleDateString('es-PE')}</span>
                  <span className="text-xs font-semibold text-[#1A1A1A]">{it.curso}</span>
                  <Pill variant={estadoVariant(it.estado)} showDot={false}>{it.estado}</Pill>
                  <span className="text-[11px] text-gray-500">{it.observacion ?? '—'}</span>
                </div>
                {i < items.length - 1 && <div className="h-px bg-border-softer" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Box({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1">
      <span className="text-[11px] text-gray-400">{label}</span>
      <span className="text-3xl font-bold" style={{ color }}>{value}</span>
    </div>
  )
}
