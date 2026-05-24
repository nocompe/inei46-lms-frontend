import logo from '../assets/logocolegio.png'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}

const sizes = {
  sm: { img: 'h-9 w-auto', title: 'text-[13px]', sub: 'text-[10px]' },
  md: { img: 'h-12 w-auto', title: 'text-sm', sub: 'text-[11px]' },
  lg: { img: 'h-14 w-auto', title: 'text-base', sub: 'text-xs' },
}

export default function Logo({ size = 'md', subtitle = 'Sistema de Gestión Educativa' }: LogoProps) {
  const s = sizes[size]
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="INEI 46" className={s.img} />
      <div className="flex flex-col leading-tight">
        <span className={`${s.title} font-bold text-[#1A1A1A]`}>Colegio INEI 46</span>
        <span className={`${s.sub} text-gray-400`}>{subtitle}</span>
      </div>
    </div>
  )
}
