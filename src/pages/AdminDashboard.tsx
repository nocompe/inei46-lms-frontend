import { useEffect, useState } from 'react'
import { BookOpen, CircleCheck, GraduationCap, Users, ClipboardList, MessageSquareText, ScrollText, Wallet } from 'lucide-react'
import { api, type CursosResponse, type UsuarioBreve } from '../lib/api'

export default function AdminDashboard() {
  const [data, setData] = useState<CursosResponse | null>(null)
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [padres, setPadres] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState<'observacion' | 'citacion' | 'pago' | null>(null)
  const [obsForm, setObsForm] = useState({ estudianteId: '', docenteId: '', tipo: 'academica', prioridad: 'media', descripcion: '' })
  const [citaForm, setCitaForm] = useState({ padreId: '', docenteId: '', estudianteId: '', motivo: '', fecha: new Date().toISOString().slice(0, 10), hora: '08:00' })
  const [pagoForm, setPagoForm] = useState({ estudianteId: '', concepto: '', monto: '0', fechaVencimiento: new Date().toISOString().slice(0, 10) })

  useEffect(() => {
    Promise.all([
      api.cursos(),
      api.usuariosPorRol('docente'),
      api.usuariosPorRol('estudiante'),
      api.usuariosPorRol('padre'),
    ])
      .then(([c, d, e, p]) => {
        setData(c)
        setDocentes(d.users)
        setEstudiantes(e.users)
        setPadres(p.users)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (estudiantes.length && !obsForm.estudianteId) {
      setObsForm((prev) => ({ ...prev, estudianteId: String(estudiantes[0].id) }))
    }
    if (docentes.length && !obsForm.docenteId) {
      setObsForm((prev) => ({ ...prev, docenteId: String(docentes[0].id) }))
    }
    if (padres.length && !citaForm.padreId) {
      setCitaForm((prev) => ({ ...prev, padreId: String(padres[0].id) }))
    }
    if (docentes.length && !citaForm.docenteId) {
      setCitaForm((prev) => ({ ...prev, docenteId: String(docentes[0].id) }))
    }
    if (estudiantes.length && !citaForm.estudianteId) {
      setCitaForm((prev) => ({ ...prev, estudianteId: String(estudiantes[0].id) }))
    }
    if (estudiantes.length && !pagoForm.estudianteId) {
      setPagoForm((prev) => ({ ...prev, estudianteId: String(estudiantes[0].id) }))
    }
  }, [estudiantes, docentes, padres, obsForm.estudianteId, obsForm.docenteId, citaForm.padreId, citaForm.docenteId, citaForm.estudianteId, pagoForm.estudianteId])

  const handleCreateObservacion = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting('observacion')
    setFeedback(null)
    try {
      await api.crearObservacion({
        id_estudiante: Number(obsForm.estudianteId),
        id_docente: Number(obsForm.docenteId),
        descripcion: obsForm.descripcion,
        tipo: obsForm.tipo,
        prioridad: obsForm.prioridad,
        fecha: new Date().toISOString(),
      })
      setFeedback({ type: 'success', message: 'Observación registrada correctamente.' })
      setObsForm((prev) => ({ ...prev, descripcion: '' }))
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar la observación.' })
    } finally {
      setSubmitting(null)
    }
  }

  const handleCreateCitacion = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting('citacion')
    setFeedback(null)
    try {
      await api.crearCitacion({
        id_padre: Number(citaForm.padreId),
        id_docente: Number(citaForm.docenteId),
        id_estudiante: Number(citaForm.estudianteId),
        motivo: citaForm.motivo,
        fecha: citaForm.fecha,
        hora: citaForm.hora,
      })
      setFeedback({ type: 'success', message: 'Citación registrada correctamente.' })
      setCitaForm((prev) => ({ ...prev, motivo: '' }))
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo registrar la citación.' })
    } finally {
      setSubmitting(null)
    }
  }

  const handleCreatePago = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting('pago')
    setFeedback(null)
    try {
      await api.crearPago({
        id_estudiante: Number(pagoForm.estudianteId),
        concepto: pagoForm.concepto,
        monto: Number(pagoForm.monto),
        fecha_vencimiento: pagoForm.fechaVencimiento,
      })
      setFeedback({ type: 'success', message: 'Pago registrado correctamente.' })
      setPagoForm((prev) => ({ ...prev, concepto: '', monto: '0' }))
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo crear el pago.' })
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Resumen general del periodo académico 2026 - I
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <Card icon={BookOpen} label="Cursos" value={loading ? '—' : String(data?.totales.cursos ?? 0)} />
        <Card icon={CircleCheck} label="Cursos activos" value={loading ? '—' : String(data?.totales.activos ?? 0)} />
        <Card icon={GraduationCap} label="Estudiantes" value={loading ? '—' : String(estudiantes.length)} />
        <Card icon={Users} label="Docentes" value={loading ? '—' : String(docentes.length)} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Cursos más activos</h2>
            <span className="text-[11px] text-gray-400">Top 5 por estudiantes</span>
          </div>
          {data?.cursos.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-inei-100 grid place-items-center text-inei-600 text-xs font-bold">
                {c.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">{c.nombre}</div>
                <div className="text-[10px] text-gray-400">{c.codigo} · {c.docente}</div>
              </div>
              <span className="text-xs font-semibold text-gray-600">{c.estudiantes} est.</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Actividad reciente</h2>
            <span className="text-[11px] text-gray-400">Últimos eventos</span>
          </div>
          <Activity icon={ClipboardList} text="Sistema operativo · 6 módulos académicos activos" />
          <Activity icon={GraduationCap} text={`${estudiantes.length} estudiantes registrados en el sistema`} />
          <Activity icon={Users} text={`${docentes.length} docentes asignados a cursos del periodo`} />
          <Activity icon={BookOpen} text={`${data?.cursos.length ?? 0} cursos creados en el periodo`} />
        </div>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${feedback.type === 'success' ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]' : 'bg-inei-50 border-inei-200 text-inei-700'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <form onSubmit={handleCreateObservacion} className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageSquareText size={18} className="text-inei-600" />
            <h2 className="text-sm font-bold text-[#1A1A1A]">Observacion</h2>
          </div>
          <Field label="Estudiante">
            <select className="input" value={obsForm.estudianteId} onChange={(e) => setObsForm((prev) => ({ ...prev, estudianteId: e.target.value }))}>
              {estudiantes.map((student) => (
                <option key={student.id} value={student.id}>{student.nombres} {student.apellidos}</option>
              ))}
            </select>
          </Field>
          <Field label="Docente">
            <select className="input" value={obsForm.docenteId} onChange={(e) => setObsForm((prev) => ({ ...prev, docenteId: e.target.value }))}>
              {docentes.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.nombres} {teacher.apellidos}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Tipo">
              <select className="input" value={obsForm.tipo} onChange={(e) => setObsForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                <option value="academica">Academica</option>
                <option value="conducta">Conducta</option>
                <option value="comportamiento">Comportamiento</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <select className="input" value={obsForm.prioridad} onChange={(e) => setObsForm((prev) => ({ ...prev, prioridad: e.target.value }))}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </Field>
          </div>
          <Field label="Descripcion">
            <textarea className="input h-24 py-2" placeholder="Describe la observacion" value={obsForm.descripcion} onChange={(e) => setObsForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
          </Field>
          <button type="submit" disabled={submitting === 'observacion'} className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting === 'observacion' ? 'Guardando...' : 'Guardar observacion'}
          </button>
        </form>

        <form onSubmit={handleCreateCitacion} className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-inei-600" />
            <h2 className="text-sm font-bold text-[#1A1A1A]">Citacion</h2>
          </div>
          <Field label="Padre de familia">
            <select className="input" value={citaForm.padreId} onChange={(e) => setCitaForm((prev) => ({ ...prev, padreId: e.target.value }))}>
              {padres.map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.nombres} {parent.apellidos}</option>
              ))}
            </select>
          </Field>
          <Field label="Docente">
            <select className="input" value={citaForm.docenteId} onChange={(e) => setCitaForm((prev) => ({ ...prev, docenteId: e.target.value }))}>
              {docentes.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.nombres} {teacher.apellidos}</option>
              ))}
            </select>
          </Field>
          <Field label="Estudiante">
            <select className="input" value={citaForm.estudianteId} onChange={(e) => setCitaForm((prev) => ({ ...prev, estudianteId: e.target.value }))}>
              {estudiantes.map((student) => (
                <option key={student.id} value={student.id}>{student.nombres} {student.apellidos}</option>
              ))}
            </select>
          </Field>
          <Field label="Motivo">
            <textarea className="input h-24 py-2" placeholder="Motivo de la citacion" value={citaForm.motivo} onChange={(e) => setCitaForm((prev) => ({ ...prev, motivo: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Fecha">
              <input type="date" className="input" value={citaForm.fecha} onChange={(e) => setCitaForm((prev) => ({ ...prev, fecha: e.target.value }))} />
            </Field>
            <Field label="Hora">
              <input type="time" className="input" value={citaForm.hora} onChange={(e) => setCitaForm((prev) => ({ ...prev, hora: e.target.value }))} />
            </Field>
          </div>
          <button type="submit" disabled={submitting === 'citacion'} className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting === 'citacion' ? 'Guardando...' : 'Guardar citacion'}
          </button>
        </form>

        <form onSubmit={handleCreatePago} className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-inei-600" />
            <h2 className="text-sm font-bold text-[#1A1A1A]">Pago</h2>
          </div>
          <Field label="Estudiante">
            <select className="input" value={pagoForm.estudianteId} onChange={(e) => setPagoForm((prev) => ({ ...prev, estudianteId: e.target.value }))}>
              {estudiantes.map((student) => (
                <option key={student.id} value={student.id}>{student.nombres} {student.apellidos}</option>
              ))}
            </select>
          </Field>
          <Field label="Concepto">
            <input className="input" placeholder="Mensualidad, matricula" value={pagoForm.concepto} onChange={(e) => setPagoForm((prev) => ({ ...prev, concepto: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Monto">
              <input type="number" min="0" step="0.01" className="input" value={pagoForm.monto} onChange={(e) => setPagoForm((prev) => ({ ...prev, monto: e.target.value }))} />
            </Field>
            <Field label="Vencimiento">
              <input type="date" className="input" value={pagoForm.fechaVencimiento} onChange={(e) => setPagoForm((prev) => ({ ...prev, fechaVencimiento: e.target.value }))} />
            </Field>
          </div>
          <button type="submit" disabled={submitting === 'pago'} className="h-10 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting === 'pago' ? 'Guardando...' : 'Guardar pago'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Card({ icon: Icon, label, value, highlight = false }: { icon: typeof BookOpen; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-2.5 ${highlight ? 'bg-inei-600 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${highlight ? 'bg-white/15' : 'bg-inei-100'}`}>
          <Icon size={16} className={highlight ? 'text-white' : 'text-inei-600'} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${highlight ? '' : 'text-[#1A1A1A]'}`}>{value}</div>
    </div>
  )
}

function Activity({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <div className="h-8 w-8 rounded-lg bg-surface-muted grid place-items-center">
        <Icon size={14} className="text-inei-600" />
      </div>
      <span>{text}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
