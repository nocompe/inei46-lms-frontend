import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Users,
  ChevronDown,
  Download,
  Trophy,
  CalendarCheck,
  CircleAlert,
  CreditCard,
  Calendar,
} from 'lucide-react'
import {
  api,
  loadAuth,
  type CalificacionDTO,
  type HijoResumen,
  type PagoDTO,
} from '../lib/api'

export default function VistaPadre() {
  const auth = loadAuth()
  const navigate = useNavigate()
  const [hijos, setHijos] = useState<HijoResumen[]>([])
  const [hijoSel, setHijoSel] = useState<HijoResumen | null>(null)
  const [calificaciones, setCalificaciones] = useState<CalificacionDTO[]>([])
  const [pagos, setPagos] = useState<PagoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [descargandoBoleta, setDescargandoBoleta] = useState(false)

  useEffect(() => {
    if (!auth) return
    setLoading(true)
    api.hijosDePadre(auth.id)
      .then((r) => {
        setHijos(r.hijos)
        setHijoSel(r.hijos[0] ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar hijos'))
      .finally(() => setLoading(false))
  }, [auth?.id])

  useEffect(() => {
    if (!hijoSel) return
    api.calificacionesPorEstudiante(hijoSel.id)
      .then((r) => setCalificaciones(r.calificaciones))
      .catch(() => setCalificaciones([]))
    api.pagos({ estudiante_id: hijoSel.id })
      .then((r) => setPagos(r.pagos))
      .catch(() => setPagos([]))
  }, [hijoSel?.id])

  const descargarBoletin = async () => {
    if (!hijoSel) return
    setDescargandoBoleta(true)
    try {
      await api.descargarBoleta(hijoSel.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo generar el boletín')
    } finally {
      setDescargandoBoleta(false)
    }
  }

  // Siguiente pago pendiente (o vencido) más próximo a vencer.
  const siguientePago = pagos
    .filter((p) => p.estado === 'pendiente' || p.estado === 'vencido')
    .sort((a, b) => (a.fecha_vencimiento ?? '').localeCompare(b.fecha_vencimiento ?? ''))[0] ?? null

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5 leading-tight">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">
            Buenas tardes, Sr. {auth.apellidos.split(' ')[0]}
          </h1>
          <p className="text-xs text-gray-600">
            Sigue el desempeño académico de tus hijos en tiempo real
          </p>
        </div>
        <button
          onClick={() => navigate('/padre/comunicados')}
          title="Ver comunicados"
          className="h-9 w-9 grid place-items-center rounded-lg bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A]"
        >
          <Bell size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          Cargando tus hijos...
        </div>
      )}

      {!loading && hijos.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          No tienes hijos vinculados a tu cuenta. Habla con la administración del colegio para
          completar el registro.
        </div>
      )}

      {hijoSel && (
        <>
          <div className="bg-white rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-inei-600 grid place-items-center text-white text-lg font-bold">
                {hijoSel.nombres.charAt(0)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1A1A1A]">
                    {hijoSel.nombres} {hijoSel.apellidos}
                  </span>
                  <span className="h-[22px] px-2.5 rounded-full bg-inei-100 text-inei-600 text-[10px] font-bold inline-flex items-center">
                    {hijoSel.grado ?? '—'} {hijoSel.seccion ?? ''} · Secundaria
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  DNI {hijoSel.dni} · {hijoSel.parentesco} · {hijoSel.cursos} curso(s) matriculado(s)
                </span>
              </div>
            </div>
            <div className="flex gap-2.5">
              {hijos.length > 1 && (
                <select
                  className="h-10 px-3.5 rounded-lg bg-surface-muted text-xs font-semibold text-gray-600 border-0 focus:outline-none focus:ring-2 focus:ring-inei-600"
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
              {hijos.length === 1 && (
                <button className="h-10 px-3.5 rounded-lg bg-surface-muted text-xs font-semibold text-gray-600 inline-flex items-center gap-2">
                  <Users size={14} /> 1 hijo registrado
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
              )}
              <button
                onClick={descargarBoletin}
                disabled={descargandoBoleta}
                className="h-10 px-3.5 rounded-lg bg-[#1A1A1A] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download size={14} /> {descargandoBoleta ? 'Generando…' : 'Descargar boletín'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3.5">
            <StatF icon={Trophy} bg="#FEE2E2" iconColor="#C8102E"
              label="Promedio general"
              value={hijoSel.promedio != null ? `${hijoSel.promedio} / 20` : '—'}
              footer={hijoSel.promedio != null ? `Basado en ${calificaciones.filter(c => c.puntaje != null).length} evaluación(es)` : 'Sin calificaciones registradas'}
            />
            <StatF icon={CalendarCheck} bg="#DCFCE7" iconColor="#15803D"
              label="Asistencia del mes"
              value={hijoSel.asistencia_pct != null ? `${hijoSel.asistencia_pct}%` : '—'}
              footer={hijoSel.asistencia_pct != null ? 'Calculada sobre las clases registradas' : 'Sin asistencias registradas'}
            />
            <StatF icon={CircleAlert} bg="#FEF3C7" iconColor="#92400E"
              label="Observaciones"
              value={String(hijoSel.observaciones)}
              footer={hijoSel.observaciones > 0 ? 'Llamado de atención pendiente' : 'Sin observaciones'}
              footerColor={hijoSel.observaciones > 0 ? '#92400E' : undefined}
            />
            <StatF icon={CreditCard} bg="rgba(255,255,255,0.15)" iconColor="#FFFFFF"
              label={siguientePago ? siguientePago.concepto : 'Pagos'}
              value={siguientePago ? `S/. ${Number(siguientePago.monto).toFixed(2)}` : 'Al día'}
              footer={
                siguientePago
                  ? `${siguientePago.estado === 'vencido' ? 'Vencido' : 'Pendiente'}${siguientePago.fecha_vencimiento ? ` · Vence: ${formatFecha(siguientePago.fecha_vencimiento)}` : ''}`
                  : 'Sin pagos pendientes'
              }
              inverse
            />
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-3.5">
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1A1A1A]">Calificaciones recientes</h2>
                  <p className="text-[11px] text-gray-400">
                    Últimas evaluaciones registradas para {hijoSel.nombres.split(' ')[0]}
                  </p>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[1.2fr_1.5fr_120px_60px] h-9 px-3 bg-surface-muted rounded-lg items-center text-[9px] font-bold text-gray-400 uppercase">
                  <span>Curso</span>
                  <span>Evaluación</span>
                  <span>Fecha</span>
                  <span>Nota</span>
                </div>
                {calificaciones.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400">
                    Aún no hay entregas calificadas.
                  </div>
                )}
                {calificaciones.map((n, i) => {
                  const aprobado = n.puntaje != null && n.puntaje >= 11
                  return (
                    <div key={`${n.tarea}-${i}`}>
                      <div className="grid grid-cols-[1.2fr_1.5fr_120px_60px] h-12 px-3 items-center">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-inei-600 text-white text-[10px] font-bold grid place-items-center">
                            {n.curso.charAt(0)}
                          </span>
                          <span className="text-xs font-semibold text-[#1A1A1A]">{n.curso}</span>
                        </div>
                        <span className="text-xs text-gray-600 truncate">{n.tarea}</span>
                        <span className="text-[11px] text-gray-400">{formatFecha(n.fecha_entrega)}</span>
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
                      {i < calificaciones.length - 1 && <div className="h-px bg-border-softer" />}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-[#1A1A1A]">Información del estudiante</h3>
                <InfoRow label="Código" value={`2026${hijoSel.id.toString().padStart(6, '0')}`} />
                <InfoRow label="DNI" value={hijoSel.dni} />
                <InfoRow label="Grado · Sección" value={`${hijoSel.grado ?? '—'} - ${hijoSel.seccion ?? '—'}`} />
                <InfoRow label="Cursos matriculados" value={`${hijoSel.cursos}`} />
                <InfoRow label="Vínculo" value={hijoSel.parentesco} />
              </div>

              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#92400E]">
                  <Calendar size={16} />
                  <span className="text-[13px] font-bold">Próxima citación</span>
                </div>
                <p className="text-[11px] text-[#92400E]">
                  Sin citaciones programadas. Las observaciones aparecerán aquí cuando el docente las
                  registre.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatF({
  icon: Icon,
  bg,
  iconColor,
  label,
  value,
  footer,
  footerColor,
  inverse = false,
}: {
  icon: typeof Trophy
  bg: string
  iconColor: string
  label: string
  value: string
  footer: string
  footerColor?: string
  inverse?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-2 ${inverse ? 'bg-inei-600 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${inverse ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <div className="h-7 w-7 rounded-lg grid place-items-center" style={{ background: bg }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
      </div>
      <span className={`text-[22px] font-bold ${inverse ? '' : 'text-[#1A1A1A]'}`}>{value}</span>
      <span
        className="text-[10px]"
        style={{ color: inverse ? 'rgba(255,255,255,0.85)' : footerColor ?? '#4B5563' }}
      >
        {footer}
      </span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-[#1A1A1A]">{value}</span>
    </div>
  )
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const yy = d.getFullYear().toString().slice(-2)
  return `${dd}/${mm}/${yy}`
}
