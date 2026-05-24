import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { api, loadAuth, type NotificacionDTO } from '../lib/api'

export default function EstudianteNotificaciones() {
  const auth = loadAuth()
  const [notificaciones, setNotificaciones] = useState<NotificacionDTO[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!auth) return
    setLoading(true)
    api.notificaciones(auth.id)
      .then((r) => { setNotificaciones(r.notificaciones); setNoLeidas(r.no_leidas) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [auth?.id])

  const marcar = async (id: number) => {
    await api.marcarNotificacionLeida(id)
    load()
  }

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Notificaciones</h1>
          <p className="text-sm text-gray-600">{noLeidas > 0 ? `${noLeidas} sin leer` : 'Estás al día'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-2">
        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && notificaciones.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <BellOff size={36} className="text-gray-300" />
            <p className="text-sm text-gray-500">No tienes notificaciones todavía.</p>
          </div>
        )}
        {notificaciones.map((n) => (
          <div key={n.id} className={`px-4 py-3 rounded-xl flex items-start gap-3 ${n.leido ? 'bg-surface-muted/40' : 'bg-inei-50 border border-inei-200'}`}>
            <div className={`h-9 w-9 rounded-xl grid place-items-center ${n.leido ? 'bg-border-softer' : 'bg-inei-600'}`}>
              <Bell size={16} className={n.leido ? 'text-gray-400' : 'text-white'} />
            </div>
            <div className="flex-1 flex flex-col leading-tight gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#1A1A1A]">{n.titulo}</span>
                <span className="text-[10px] text-gray-400">{new Date(n.fecha_envio).toLocaleString('es-PE')}</span>
              </div>
              <p className="text-[11px] text-gray-600">{n.mensaje}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400">{n.tipo.toUpperCase()}</span>
                {!n.leido && <button onClick={() => marcar(n.id)} className="text-[11px] font-semibold text-inei-600 hover:text-inei-700">Marcar como leída</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
