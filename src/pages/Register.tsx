import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Info } from 'lucide-react'
import Logo from '../components/Logo'
import { api } from '../lib/api'

export default function Register() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    passwordConfirm: '',
    terms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-6 py-10">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          if (form.password !== form.passwordConfirm) {
            setError('Las contraseñas no coinciden')
            return
          }
          setLoading(true)
          try {
            await api.register({
              rol: 'padre',
              dni: form.dni,
              nombres: form.nombres,
              apellidos: form.apellidos,
              email: form.email,
              password: form.password,
              password_confirmation: form.passwordConfirm,
            })
            navigate('/login')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo registrar')
          } finally {
            setLoading(false)
          }
        }}
        className="w-full max-w-[480px] bg-white rounded-2xl p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col gap-5"
      >
        <Logo size="md" />

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight">Crear cuenta de padre</h1>
          <p className="text-sm text-gray-600">Regístrate para poder solicitar la matrícula de tu hijo(a)</p>
        </div>

        <div className="rounded-lg bg-[#DBEAFE] border border-[#93C5FD] px-3 py-2.5 text-xs text-[#1E40AF] flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Solo padres de familia pueden registrarse aquí</span>
            <span className="text-[11px]">
              Los <strong>estudiantes</strong> reciben sus credenciales después de que la matrícula es aprobada por la dirección.
              Los <strong>docentes</strong> son creados por el administrador del colegio.
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2.5 h-10 px-3 rounded-lg bg-inei-50 border border-inei-200">
          <Users size={16} className="text-inei-600" />
          <span className="text-sm font-bold text-inei-700">Padre de familia</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombres">
            <input
              required
              value={form.nombres}
              onChange={(e) => update('nombres', e.target.value)}
              placeholder="Roberto"
              className="input"
            />
          </Field>
          <Field label="Apellidos">
            <input
              required
              value={form.apellidos}
              onChange={(e) => update('apellidos', e.target.value)}
              placeholder="Rivera Castro"
              className="input"
            />
          </Field>
        </div>

        <Field label="DNI">
          <input
            required
            value={form.dni}
            onChange={(e) => update('dni', e.target.value.replace(/\D/g, ''))}
            placeholder="32445566"
            maxLength={8}
            className="input"
          />
        </Field>

        <Field label="Correo electrónico">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="roberto.rivera@gmail.com"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Contraseña">
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>
          <Field label="Confirmar contraseña">
            <input
              required
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => update('passwordConfirm', e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={form.terms}
            onChange={(e) => update('terms', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-inei-600 focus:ring-inei-600"
          />
          <span>
            Acepto los{' '}
            <a href="#" className="font-semibold text-inei-600">
              términos y política de privacidad
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold transition active:scale-[0.99]"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <p className="text-xs text-center text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-inei-600 hover:text-inei-700">
            Inicia sesión
          </Link>
        </p>
      </form>
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
