import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'
import { api, homeForRole, saveAuth } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('admin@inei46.edu.pe')
  const [password, setPassword] = useState('admin1234')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoPassword, setInfoPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          setError(null)
          try {
            const { user, token } = await api.login(email, password)
            saveAuth(user, token, remember)
            navigate(homeForRole(user.rol))
          } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
          } finally {
            setLoading(false)
          }
        }}
        className="w-full max-w-[440px] bg-white rounded-2xl p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col gap-6"
      >
        <Logo size="md" />

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight">Iniciar Sesión</h1>
          <p className="text-sm text-gray-600">Ingresa tus credenciales para acceder al LMS</p>
        </div>

        {error && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-gray-600">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="docente@inei46.edu.pe"
            className="input"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-gray-600">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-inei-600 focus:ring-inei-600"
            />
            Recordarme
          </label>
          <button
            type="button"
            onClick={() => setInfoPassword((v) => !v)}
            className="text-xs font-semibold text-inei-600 hover:text-inei-700"
          >
            Olvidé mi contraseña
          </button>
        </div>

        {infoPassword && (
          <div className="rounded-lg bg-[#DBEAFE] border border-[#93C5FD] px-3 py-2 text-xs text-[#1E40AF]">
            Contacta al administrador del colegio para restablecer tu contraseña.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold transition active:scale-[0.99]"
        >
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </button>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-border-soft" />
          <span className="text-[11px] text-gray-400">o</span>
          <span className="flex-1 h-px bg-border-soft" />
        </div>

        <p className="text-xs text-center text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-inei-600 hover:text-inei-700">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  )
}
