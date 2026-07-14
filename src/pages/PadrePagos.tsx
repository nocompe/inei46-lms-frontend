import { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, AlertCircle, Plus, X, ExternalLink } from 'lucide-react'
import { api, loadAuth, type Gateway, type HijoResumen, type PagoDTO, type TransaccionPago } from '../lib/api'
import Pill from '../components/Pill'

const gatewayLabel: Record<Gateway, string> = {
  culqi: 'Culqi (tarjeta)',
  mercadopago: 'Mercado Pago',
  niubiz: 'Niubiz',
  izipay: 'Izipay',
  manual: 'Transferencia / Manual',
}

export default function PadrePagos() {
  const auth = loadAuth()
  const [hijos, setHijos] = useState<HijoResumen[]>([])
  const [hijoSel, setHijoSel] = useState<HijoResumen | null>(null)
  const [pagos, setPagos] = useState<PagoDTO[]>([])
  const [resumen, setResumen] = useState<{ total_pagado: number; total_pendiente: number; siguiente_vencimiento: string | null }>({ total_pagado: 0, total_pendiente: 0, siguiente_vencimiento: null })
  const [loadingHijos, setLoadingHijos] = useState(true)
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pagandoGateway, setPagandoGateway] = useState<PagoDTO | null>(null)

  useEffect(() => {
    if (!auth) return
    setLoadingHijos(true)
    setError(null)
    api.hijosDePadre(auth.id)
      .then((r) => {
        setHijos(r.hijos)
        setHijoSel(r.hijos[0] ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la lista de hijos'))
      .finally(() => setLoadingHijos(false))
  }, [auth?.id])

  const cargar = () => {
    if (!hijoSel) {
      setPagos([])
      setResumen({ total_pagado: 0, total_pendiente: 0, siguiente_vencimiento: null })
      return
    }
    setLoadingPagos(true)
    setError(null)
    api.pagosEstudiante(hijoSel.id)
      .then((r) => {
        setPagos(r.pagos)
        setResumen({
          total_pagado: Number(r.resumen?.total_pagado ?? 0),
          total_pendiente: Number(r.resumen?.total_pendiente ?? 0),
          siguiente_vencimiento: r.resumen?.siguiente_vencimiento ?? null,
        })
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los pagos')
        setPagos([])
      })
      .finally(() => setLoadingPagos(false))
  }
  useEffect(() => { cargar() }, [hijoSel?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const pagar = async (id: number) => {
    try {
      await api.marcarPagoPagado(id)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar el pago')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Pagos y pensiones</h1>
          <p className="text-sm text-gray-600">
            {hijoSel ? `Estado de cuenta de ${hijoSel.nombres} ${hijoSel.apellidos}` : 'Estado de cuenta del estudiante'}
          </p>
        </div>
        {hijos.length > 1 && hijoSel && (
          <select className="h-10 px-3.5 rounded-lg bg-white border border-border-soft text-xs font-semibold" value={hijoSel.id} onChange={(e) => setHijoSel(hijos.find((h) => h.id === Number(e.target.value)) ?? null)}>
            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombres} {h.apellidos}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
          {error}
        </div>
      )}

      {loadingHijos && (
        <div className="bg-white rounded-2xl py-10 text-center text-xs text-gray-400">Cargando información del padre...</div>
      )}

      {!loadingHijos && hijos.length === 0 && (
        <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
          <AlertCircle size={36} className="text-gray-300" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-[#1A1A1A]">No tienes hijos vinculados</h3>
            <p className="text-xs text-gray-500">Pídele al administrador del colegio que vincule a tu(s) hijo(s) desde el panel de Vínculos padre-hijo.</p>
          </div>
        </div>
      )}

      {!loadingHijos && hijoSel && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ResumenCard icon={CheckCircle2} bg="#DCFCE7" iconColor="#15803D" label="Total pagado" value={`S/. ${Number(resumen.total_pagado).toFixed(2)}`} />
            <ResumenCard icon={AlertCircle} bg="#FEF3C7" iconColor="#92400E" label="Pendiente" value={`S/. ${Number(resumen.total_pendiente).toFixed(2)}`} />
            <ResumenCard icon={CreditCard} bg="#FEE2E2" iconColor="#C8102E" label="Próximo vencimiento" value={resumen.siguiente_vencimiento ? new Date(resumen.siguiente_vencimiento).toLocaleDateString('es-PE') : '—'} />
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Historial de pagos</h2>
              <button onClick={() => setModalOpen(true)} className="text-[11px] font-semibold text-inei-600 inline-flex items-center gap-1"><Plus size={12} /> Registrar pago</button>
            </div>
            <div className="overflow-x-auto">
            <div className="min-w-[800px] flex flex-col gap-3">
            <div className="grid grid-cols-[1.5fr_120px_120px_120px_100px_140px] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
              <span>Concepto</span><span>Monto</span><span>Vencimiento</span><span>Fecha pago</span><span>Estado</span><span>Acciones</span>
            </div>
            {loadingPagos && <div className="py-6 text-center text-xs text-gray-400">Cargando pagos...</div>}
            {!loadingPagos && pagos.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <CreditCard size={28} className="text-gray-300" />
                <span>No hay pagos registrados para {hijoSel.nombres.split(' ')[0]}.</span>
                <button onClick={() => setModalOpen(true)} className="mt-2 h-8 px-3 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <Plus size={12} /> Registrar primer pago
                </button>
              </div>
            )}
            {pagos.map((p, i) => (
              <div key={p.id}>
                <div className="grid grid-cols-[1.5fr_120px_120px_120px_100px_140px] gap-3 min-h-12 px-3 items-center">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{p.concepto}</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">S/. {Number(p.monto).toFixed(2)}</span>
                  <span className="text-[11px] text-gray-400">{p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') : '—'}</span>
                  <span className="text-[11px] text-gray-400">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-PE') : '—'}</span>
                  <Pill variant={p.estado === 'pagado' ? 'success' : p.estado === 'vencido' ? 'danger' : 'warning'} showDot={false}>{p.estado}</Pill>
                  {p.estado === 'pendiente' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPagandoGateway(p)} className="h-7 px-2 rounded-md bg-inei-600 hover:bg-inei-700 text-white text-[10px] font-bold inline-flex items-center gap-1" title="Pagar con pasarela">
                        <CreditCard size={11} /> Pagar
                      </button>
                      <button onClick={() => pagar(p.id)} className="h-7 px-2 rounded-md bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A] text-[10px] font-bold" title="Marcar como pagado (manual)">
                        Manual
                      </button>
                    </div>
                  )}
                </div>
                {i < pagos.length - 1 && <div className="h-px bg-border-softer" />}
              </div>
            ))}
            </div>
            </div>
          </div>
        </>
      )}

      {modalOpen && hijoSel && (
        <PagoModal estudianteId={hijoSel.id} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); cargar() }} />
      )}

      {pagandoGateway && (
        <CheckoutModal pago={pagandoGateway} onClose={() => setPagandoGateway(null)} onCompleted={() => { setPagandoGateway(null); cargar() }} />
      )}
    </div>
  )
}

function ResumenCard({ icon: Icon, bg, iconColor, label, value }: { icon: typeof CreditCard; bg: string; iconColor: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: bg }}><Icon size={18} style={{ color: iconColor }} /></div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-xl font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </div>
  )
}

function CheckoutModal({ pago, onClose, onCompleted }: { pago: PagoDTO; onClose: () => void; onCompleted: () => void }) {
  const [gateway, setGateway] = useState<Gateway>('culqi')
  const [transaccion, setTransaccion] = useState<TransaccionPago | null>(null)
  const [firma, setFirma] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [simulando, setSimulando] = useState(false)

  const iniciar = async () => {
    setLoading(true)
    setErr(null)
    try {
      const { transaction, firma: firmaTx } = await api.iniciarTransaccionPago(pago.id, { gateway })
      setTransaccion(transaction)
      setFirma(firmaTx)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo iniciar la transacción')
    } finally {
      setLoading(false)
    }
  }

  // En producción este paso lo dispara el webhook real de la pasarela.
  // Aquí lo simulamos manualmente para que el flujo se pueda demostrar end-to-end.
  const simularConfirmacion = async (status: 'approved' | 'rejected') => {
    if (!transaccion || !firma) return
    setSimulando(true)
    try {
      await api.confirmarWebhookPago({
        transaction_id: transaccion.id,
        gateway: transaccion.gateway,
        status,
        firma,
        gateway_payload: { simulated: true, timestamp: new Date().toISOString() },
      })
      onCompleted()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error en el webhook')
    } finally {
      setSimulando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Pasarela de pago</h2>
            <span className="text-[11px] text-gray-400">{pago.concepto} · S/. {Number(pago.monto).toFixed(2)}</span>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        {!transaccion && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Selecciona la pasarela</label>
              <select className="input" value={gateway} onChange={(e) => setGateway(e.target.value as Gateway)}>
                {(Object.keys(gatewayLabel) as Gateway[]).map((g) => (
                  <option key={g} value={g}>{gatewayLabel[g]}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Se generará una transacción y se devolverá la URL de checkout. En producción aquí redirigimos al gateway.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
              <button onClick={iniciar} disabled={loading} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2">
                <CreditCard size={14} /> {loading ? 'Iniciando...' : 'Iniciar pago'}
              </button>
            </div>
          </>
        )}

        {transaccion && (
          <>
            <div className="bg-surface-muted rounded-xl p-4 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Referencia</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">{transaccion.referencia}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Transacción</span>
                <span className="font-mono text-[10px] text-[#1A1A1A]">{transaccion.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pasarela</span>
                <span className="font-semibold text-[#1A1A1A]">{gatewayLabel[transaccion.gateway]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Monto</span>
                <span className="font-bold text-[#1A1A1A]">{transaccion.currency} {transaccion.amount.toFixed(2)}</span>
              </div>
              {transaccion.checkout_url && (
                <a
                  href={transaccion.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-inei-600 hover:text-inei-700"
                >
                  Abrir checkout externo <ExternalLink size={12} />
                </a>
              )}
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed">
              <strong>Simulación de webhook:</strong> en producción la pasarela notificará a nuestro endpoint <code>/api/pagos/webhook</code>.
              Aquí puedes simular el resultado para probar el flujo end-to-end.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => simularConfirmacion('rejected')}
                disabled={simulando}
                className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 hover:text-inei-600"
              >
                Simular rechazo
              </button>
              <button
                onClick={() => simularConfirmacion('approved')}
                disabled={simulando}
                className="h-10 px-4 rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <CheckCircle2 size={14} /> {simulando ? 'Procesando...' : 'Simular aprobación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PagoModal({ estudianteId, onClose, onCreated }: { estudianteId: number; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ concepto: 'Pensión escolar', monto: 350, fecha_vencimiento: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={async (e) => { e.preventDefault(); setSaving(true); await api.crearPago({ id_estudiante: estudianteId, ...form }); onCreated() }} className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Registrar pago</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <input className="input" placeholder="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
        <input type="number" className="input" placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })} />
        <input type="date" className="input" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
        <button type="submit" disabled={saving} className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">{saving ? '...' : 'Registrar'}</button>
      </form>
    </div>
  )
}
