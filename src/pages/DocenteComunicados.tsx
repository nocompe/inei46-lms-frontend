import { useEffect, useState } from 'react'
import { Send, X, Inbox, MailOpen, Plus } from 'lucide-react'
import { api, loadAuth, type MensajeDTO, type MensajeEnviadoDTO, type UsuarioBreve } from '../lib/api'

type Tab = 'bandeja' | 'enviados'

export default function DocenteComunicados() {
  const auth = loadAuth()
  const [tab, setTab] = useState<Tab>('bandeja')
  const [bandeja, setBandeja] = useState<MensajeDTO[]>([])
  const [enviados, setEnviados] = useState<MensajeEnviadoDTO[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!auth) return
    setLoading(true)
    Promise.all([
      api.bandejaMensajes(auth.id).then((r) => setBandeja(r.mensajes)),
      api.enviadosMensajes(auth.id).then((r) => setEnviados(r.mensajes)),
    ]).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Comunicados</h1>
          <p className="text-sm text-gray-600">Envía y recibe mensajes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"><Plus size={16} /> Nuevo comunicado</button>
      </div>

      <div className="flex gap-2 border-b border-border-soft">
        <TabBtn active={tab === 'bandeja'} onClick={() => setTab('bandeja')} icon={Inbox} label={`Bandeja (${bandeja.length})`} />
        <TabBtn active={tab === 'enviados'} onClick={() => setTab('enviados')} icon={Send} label={`Enviados (${enviados.length})`} />
      </div>

      {loading && <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando...</div>}

      {!loading && tab === 'bandeja' && (
        <div className="bg-white rounded-2xl p-3 flex flex-col gap-1.5">
          {bandeja.length === 0 && <div className="py-8 text-center text-xs text-gray-400">Sin mensajes recibidos.</div>}
          {bandeja.map((m) => (
            <div key={m.id} className={`p-3 rounded-lg flex gap-3 ${m.leido ? '' : 'bg-inei-50'}`}>
              <MailOpen size={14} className="text-gray-400 mt-1" />
              <div className="flex-1 flex flex-col leading-tight gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{m.emisor}</span>
                  <span className="text-[10px] text-gray-400">{new Date(m.fecha_envio).toLocaleString('es-PE')}</span>
                </div>
                <span className="text-[12px] font-bold text-[#1A1A1A]">{m.asunto}</span>
                <span className="text-[11px] text-gray-500">{m.contenido}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'enviados' && (
        <div className="bg-white rounded-2xl p-3 flex flex-col gap-1.5">
          {enviados.length === 0 && <div className="py-8 text-center text-xs text-gray-400">No has enviado mensajes aún.</div>}
          {enviados.map((m) => (
            <div key={m.id} className="p-3 rounded-lg bg-surface-muted/40 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">{m.asunto}</span>
                <span className="text-[10px] text-gray-400">{new Date(m.fecha_envio).toLocaleString('es-PE')}</span>
              </div>
              <span className="text-[11px] text-gray-500">{m.contenido}</span>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-gray-400">A:</span>
                {m.destinatarios.slice(0, 5).map((d, i) => (
                  <span key={i} className="text-[10px] text-gray-600">{d.nombre}{d.leido ? ' ✓' : ''}</span>
                ))}
                {m.destinatarios.length > 5 && <span className="text-[10px] text-gray-400">+{m.destinatarios.length - 5}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <NuevoMensajeModal emisorId={auth.id} onClose={() => setModalOpen(false)} onSent={() => { setModalOpen(false); load() }} />}
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Inbox; label: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 text-[13px] inline-flex items-center gap-2 ${active ? 'font-bold text-inei-600 border-b-2 border-inei-600' : 'text-gray-600 hover:text-[#1A1A1A]'}`}>
      <Icon size={14} /> {label}
    </button>
  )
}

function NuevoMensajeModal({ emisorId, onClose, onSent }: { emisorId: number; onClose: () => void; onSent: () => void }) {
  const [destinatarios, setDestinatarios] = useState<UsuarioBreve[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [rol, setRol] = useState<'estudiante' | 'padre'>('padre')
  const [form, setForm] = useState({ asunto: '', contenido: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.usuariosPorRol(rol).then((r) => setDestinatarios(r.users))
    setSeleccionados(new Set())
  }, [rol])

  const toggle = (id: number) => {
    const n = new Set(seleccionados)
    if (n.has(id)) n.delete(id); else n.add(id)
    setSeleccionados(n)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
        e.preventDefault()
        if (seleccionados.size === 0) return alert('Selecciona al menos un destinatario')
        setSending(true)
        try {
          await api.enviarMensaje({ id_usuario_emisor: emisorId, asunto: form.asunto, contenido: form.contenido, destinatarios: Array.from(seleccionados) })
          onSent()
        } catch (err) {
          alert(err instanceof Error ? err.message : 'No se pudo enviar el comunicado')
        } finally {
          setSending(false)
        }
      }} className="bg-white rounded-2xl w-full max-w-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Nuevo comunicado</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <select className="input" value={rol} onChange={(e) => setRol(e.target.value as 'estudiante' | 'padre')}>
          <option value="padre">A padres de familia</option>
          <option value="estudiante">A estudiantes</option>
        </select>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Destinatarios ({seleccionados.size})</span>
          <div className="max-h-32 overflow-auto border border-border-soft rounded-lg p-2 flex flex-col gap-1">
            {destinatarios.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-xs p-1 hover:bg-surface-muted rounded cursor-pointer">
                <input type="checkbox" checked={seleccionados.has(d.id)} onChange={() => toggle(d.id)} />
                {d.nombres} {d.apellidos} <span className="text-gray-400">DNI {d.dni}</span>
              </label>
            ))}
          </div>
        </div>

        <input required className="input" placeholder="Asunto" maxLength={150} value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} />
        <textarea required className="input h-32 py-2" placeholder="Mensaje" value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={sending} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"><Send size={14} /> {sending ? 'Enviando...' : 'Enviar'}</button>
        </div>
      </form>
    </div>
  )
}
