import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import Logo from '../components/Logo'
import { loadAuth, homeForRole } from '../lib/api'

export default function NotFound() {
  const navigate = useNavigate()
  const auth = loadAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-[440px] bg-white rounded-2xl p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center gap-6 text-center">
        <Logo size="md" />
        <div className="h-14 w-14 rounded-2xl bg-inei-100 grid place-items-center">
          <Compass size={28} className="text-inei-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[42px] font-bold text-[#1A1A1A] leading-none">404</h1>
          <p className="text-sm font-semibold text-[#1A1A1A]">Página no encontrada</p>
          <p className="text-xs text-gray-600">
            La página que buscas no existe o fue movida.
          </p>
        </div>
        <button
          onClick={() => navigate(auth ? homeForRole(auth.rol) : '/login')}
          className="h-11 px-5 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition active:scale-[0.99]"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </button>
      </div>
    </div>
  )
}
