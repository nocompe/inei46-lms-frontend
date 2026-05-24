import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'

export default function Placeholder({
  title,
  description,
  icon: Icon = Construction,
  helper,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  helper?: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{title}</h1>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <div className="bg-white rounded-2xl py-16 px-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-inei-100 grid place-items-center">
          <Icon size={32} className="text-inei-600" />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Módulo en construcción</h2>
          <p className="text-sm text-gray-600">
            {helper ??
              'Esta sección está planificada en el cronograma. La base (modelos / endpoints / UI) se construirá en próximos sprints.'}
          </p>
        </div>
      </div>
    </div>
  )
}
