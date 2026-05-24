import { useEffect, useState } from 'react'
import { Save, UserCircle, Mail, Phone, BadgeCheck, KeyRound, GraduationCap } from 'lucide-react'
import { api, loadAuth, saveAuth, type AuthUser, type PerfilUser } from '../lib/api'

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  padre: 'Padre de familia',
}

export default function Perfil() {
  const auth = loadAuth()
  const [perfil, setPerfil] = useState<PerfilUser | null>(null)
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    grado: '',
    seccion: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPwdSection, setShowPwdSection] = useState(false)

  useEffect(() => {
    if (!auth) return
    api.miPerfil(auth.id)
      .then((r) => {
        setPerfil(r.user)
        setForm({
          nombres: r.user.nombres,
          apellidos: r.user.apellidos,
          email: r.user.email,
          telefono: r.user.telefono ?? '',
          grado: r.user.grado ?? '',
          seccion: r.user.seccion ?? '',
          password: '',
          password_confirmation: '',
        })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil'))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (showPwdSection && form.password) {
      if (form.password !== form.password_confirmation) {
        setError('Las contraseñas no coinciden')
        return
      }
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres')
        return
      }
    }
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
      }
      if (form.telefono) payload.telefono = form.telefono
      if (form.grado) payload.grado = form.grado
      if (form.seccion) payload.seccion = form.seccion
      if (showPwdSection && form.password) {
        payload.password = form.password
        payload.password_confirmation = form.password_confirmation
      }
      const r = await api.actualizarPerfil(auth.id, payload as any)
      setPerfil(r.user)
      // Refrescar localStorage con los datos nuevos
      const updatedAuth: AuthUser = {
        id: r.user.id,
        dni: r.user.dni,
        nombres: r.user.nombres,
        apellidos: r.user.apellidos,
        email: r.user.email,
        rol: r.user.rol,
        grado: r.user.grado,
        seccion: r.user.seccion,
      }
      saveAuth(updatedAuth)
      setSuccess(r.message)
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }))
      setShowPwdSection(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mi perfil</h1>
        <p className="text-sm text-gray-600">
          Personaliza tus datos personales y configura tu cuenta
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-[#DCFCE7] border border-[#86EFAC] px-3 py-2 text-xs text-[#15803D]">{success}</div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl py-12 text-center text-xs text-gray-400">Cargando perfil...</div>
      )}

      {!loading && perfil && (
        <div className="grid grid-cols-[320px_1fr] gap-4">
          {/* Card de identidad (no editable) */}
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 h-fit">
            <div className="h-24 w-24 rounded-full bg-inei-600 grid place-items-center text-white text-3xl font-bold">
              {perfil.nombres.charAt(0)}{perfil.apellidos.charAt(0)}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-base font-bold text-[#1A1A1A]">
                {perfil.nombres} {perfil.apellidos}
              </span>
              <span className="text-[11px] text-gray-400">DNI {perfil.dni}</span>
            </div>
            <div className="w-full flex flex-col gap-2 pt-4 border-t border-border-softer">
              <Info icon={BadgeCheck} label="Rol" value={rolLabels[perfil.rol] ?? perfil.rol} />
              <Info icon={Mail} label="Correo" value={perfil.email} />
              <Info icon={Phone} label="Teléfono" value={perfil.telefono ?? 'Sin registrar'} />
              {perfil.rol === 'estudiante' && (
                <Info icon={GraduationCap} label="Grado · Sección" value={`${perfil.grado ?? '—'} - ${perfil.seccion ?? '—'}`} />
              )}
              {perfil.fecha_registro && (
                <Info
                  icon={UserCircle}
                  label="Miembro desde"
                  value={new Date(perfil.fecha_registro).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}
                />
              )}
            </div>
          </div>

          {/* Form de edición */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-5">
            <Section title="Datos personales" subtitle="Información visible para docentes y otros usuarios">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombres">
                  <input
                    required
                    className="input"
                    value={form.nombres}
                    onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  />
                </Field>
                <Field label="Apellidos">
                  <input
                    required
                    className="input"
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="DNI (no editable)">
                <input className="input bg-border-softer cursor-not-allowed" value={perfil.dni} readOnly />
              </Field>
            </Section>

            <Section title="Contacto" subtitle="Cómo el colegio puede comunicarse contigo">
              <Field label="Correo electrónico">
                <input
                  required
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  className="input"
                  placeholder="987654321"
                  maxLength={20}
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </Field>
            </Section>

            {perfil.rol === 'estudiante' && (
              <Section title="Información académica" subtitle="Grado y sección actuales">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Grado">
                    <select
                      className="input"
                      value={form.grado}
                      onChange={(e) => setForm({ ...form, grado: e.target.value })}
                    >
                      <option value="">—</option>
                      {['1ro', '2do', '3ro', '4to', '5to'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sección">
                    <select
                      className="input"
                      value={form.seccion}
                      onChange={(e) => setForm({ ...form, seccion: e.target.value })}
                    >
                      <option value="">—</option>
                      {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </Section>
            )}

            <Section
              title="Seguridad"
              subtitle="Cambiar contraseña (opcional)"
              action={
                <button
                  type="button"
                  onClick={() => setShowPwdSection((v) => !v)}
                  className="text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1"
                >
                  <KeyRound size={12} />
                  {showPwdSection ? 'Cancelar cambio' : 'Cambiar contraseña'}
                </button>
              }
            >
              {showPwdSection && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nueva contraseña">
                    <input
                      type="password"
                      className="input"
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </Field>
                  <Field label="Confirmar nueva contraseña">
                    <input
                      type="password"
                      className="input"
                      placeholder="Repite la contraseña"
                      value={form.password_confirmation}
                      onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            </Section>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-softer">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <h3 className="text-sm font-bold text-[#1A1A1A]">{title}</h3>
          {subtitle && <span className="text-[11px] text-gray-400">{subtitle}</span>}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-[#1A1A1A] truncate">{value}</span>
      </div>
    </div>
  )
}
