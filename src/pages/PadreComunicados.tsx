import { useEffect, useState } from 'react'
import { MessageSquare, MailOpen, MailCheck } from 'lucide-react'
import { api, loadAuth, type MensajeDTO } from '../lib/api'

export default function PadreComunicados() {
  const auth = loadAuth()
  const [mensajes, setMensajes] = useState<MensajeDTO[]>([])
  const [seleccionado, setSeleccionado] = useState<MensajeDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!auth) return
    setLoading(true)
    api.bandejaMensajes(auth.id).then((r) => setMensajes(r.mensajes)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const abrir = async (m: MensajeDTO) => {
    setSeleccionado(m)
    if (!m.leido) {
      await api.marcarMensajeLeido(m.id)
      load()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Comunicados</h1>
        <p className="text-sm text-gray-600">Mensajes recibidos del colegio y docentes</p>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-3.5">
        <div className="bg-white rounded-2xl p-3 flex flex-col gap-1.5">
          {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
          {!loading && mensajes.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <MessageSquare size={36} className="text-gray-300" />
              <p className="text-sm text-gray-500">Tu bandeja está vacía.</p>
            </div>
          )}
          {mensajes.map((m) => (
            <button key={m.id} onClick={() => abrir(m)} className={`text-left p-3 rounded-lg flex gap-3 transition ${seleccionado?.id === m.id ? 'bg-inei-50 border border-inei-200' : m.leido ? 'hover:bg-surface-muted' : 'bg-inei-50/40 hover:bg-inei-50'}`}>
              <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${m.leido ? 'bg-border-softer text-gray-400' : 'bg-inei-600 text-white'}`}>
                {m.leido ? <MailOpen size={14} /> : <MailCheck size={14} />}
              </div>
              <div className="flex-1 flex flex-col leading-tight gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs truncate ${m.leido ? 'text-gray-600' : 'font-bold text-[#1A1A1A]'}`}>{m.emisor}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{new Date(m.fecha_envio).toLocaleDateString('es-PE')}</span>
                </div>
                <span className={`text-[12px] truncate ${m.leido ? 'text-gray-500' : 'font-semibold text-[#1A1A1A]'}`}>{m.asunto}</span>
                <span className="text-[10px] text-gray-400 truncate">{m.contenido}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3">
          {!seleccionado && <div className="text-xs text-gray-400 text-center py-12">Selecciona un mensaje para leerlo.</div>}
          {seleccionado && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1A1A1A]">{seleccionado.asunto}</h2>
                <span className="text-[10px] text-gray-400">{new Date(seleccionado.fecha_envio).toLocaleString('es-PE')}</span>
              </div>
              <span className="text-[11px] text-gray-500">De: <strong>{seleccionado.emisor}</strong></span>
              <div className="text-sm text-[#1A1A1A] leading-relaxed pt-3 border-t border-border-softer whitespace-pre-wrap">
                {seleccionado.contenido}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
