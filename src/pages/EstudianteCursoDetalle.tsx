import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Link2,
  Presentation,
  Video,
  Pencil,
} from 'lucide-react'
import { api, type ContenidoCursoDTO, type ContenidoTipo } from '../lib/api'

const tipoLabels: Record<ContenidoTipo, string> = {
  texto: 'Texto',
  video: 'Video',
  presentacion: 'Presentación',
  ejercicio: 'Ejercicio',
  pdf: 'PDF',
  cuestionario: 'Cuestionario',
  enlace: 'Enlace',
}

const tipoColor: Record<ContenidoTipo, { bg: string; text: string }> = {
  texto: { bg: '#DBEAFE', text: '#1E40AF' },
  video: { bg: '#DBEAFE', text: '#1E40AF' },
  presentacion: { bg: '#E9D5FF', text: '#6B21A8' },
  ejercicio: { bg: '#FEF3C7', text: '#92400E' },
  pdf: { bg: '#FEE2E2', text: '#991B1B' },
  cuestionario: { bg: '#DCFCE7', text: '#15803D' },
  enlace: { bg: '#F3F4F6', text: '#374151' },
}

const tipoIcon: Record<ContenidoTipo, typeof FileText> = {
  texto: FileText,
  video: Video,
  presentacion: Presentation,
  ejercicio: Pencil,
  pdf: FileText,
  cuestionario: FileText,
  enlace: Link2,
}

export default function EstudianteCursoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ContenidoCursoDTO | null>(null)
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.contenidoDeCurso(Number(id))
      .then((d) => {
        setData(d)
        setExpandidas(new Set(d.unidades.map((u) => u.id)))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar material'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleUnidad = (uid: number) => {
    setExpandidas((s) => {
      const n = new Set(s)
      if (n.has(uid)) n.delete(uid)
      else n.add(uid)
      return n
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => navigate('/estudiante/cursos')}
        className="self-start text-xs text-gray-600 hover:text-[#1A1A1A] inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Volver a mis cursos
      </button>

      {loading && (
        <div className="bg-white rounded-2xl py-12 text-center text-xs text-gray-400">
          Cargando material del curso...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>
      )}

      {!loading && data && (
        <>
          <div className="bg-gradient-to-r from-inei-600 to-inei-700 rounded-2xl p-6 text-white flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-white/20 grid place-items-center text-3xl font-bold">
              {data.curso.nombre.charAt(0)}
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[11px] uppercase font-bold opacity-80">{data.curso.codigo}</span>
              <h1 className="text-2xl font-bold">{data.curso.nombre}</h1>
              <span className="text-xs opacity-90">
                {data.curso.docente} · {data.curso.grado}-{data.curso.seccion}
              </span>
            </div>
            <div className="flex items-center gap-6 text-right">
              <Stat label="Unidades" value={String(data.unidades.length)} />
              <Stat label="Temas" value={String(data.unidades.reduce((a, u) => a + u.temas, 0))} />
              <Stat label="Recursos" value={String(data.unidades.reduce((a, u) => a + u.contenidos.reduce((b, c) => b + c.recursos, 0), 0))} />
            </div>
          </div>

          {data.unidades.length === 0 && (
            <div className="bg-white rounded-2xl py-12 text-center flex flex-col items-center gap-3">
              <BookOpen size={36} className="text-gray-300" />
              <p className="text-sm text-gray-500">El docente aún no ha publicado material para este curso.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {data.unidades.map((u) => {
              const expanded = expandidas.has(u.id)
              return (
                <div key={u.id} className="bg-white rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleUnidad(u.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-muted/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-xl bg-inei-100 text-inei-600 text-sm font-bold grid place-items-center">
                        {u.numero}
                      </span>
                      <div className="flex flex-col leading-tight items-start">
                        <h3 className="text-base font-bold text-[#1A1A1A]">
                          Unidad {u.numero}: {u.titulo}
                        </h3>
                        {u.descripcion && (
                          <span className="text-[11px] text-gray-400">{u.descripcion}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-6 px-2.5 rounded-full bg-inei-100 text-inei-600 text-[10px] font-bold inline-flex items-center">
                        {u.temas} {u.temas === 1 ? 'Tema' : 'Temas'}
                      </span>
                      {expanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border-softer px-5 py-4 flex flex-col gap-2">
                      {u.contenidos.length === 0 && (
                        <div className="py-4 text-center text-xs text-gray-400">
                          Sin temas en esta unidad todavía.
                        </div>
                      )}
                      {u.contenidos.map((c) => {
                        const Icon = tipoIcon[c.tipo]
                        const color = tipoColor[c.tipo]
                        const Wrapper: React.ElementType = c.url ? 'a' : 'div'
                        const props = c.url
                          ? { href: c.url, target: '_blank', rel: 'noopener noreferrer' }
                          : {}
                        return (
                          <Wrapper
                            key={c.id}
                            {...props}
                            className={`flex items-center gap-3 p-3 rounded-xl border border-border-softer transition ${
                              c.url ? 'hover:border-inei-600 hover:bg-inei-50 cursor-pointer' : ''
                            }`}
                          >
                            <div
                              className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
                              style={{ background: color.bg }}
                            >
                              <Icon size={18} style={{ color: color.text }} />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-[#1A1A1A] truncate">{c.titulo}</span>
                                <span
                                  className="h-5 px-2 rounded-full text-[9px] font-bold inline-flex items-center shrink-0"
                                  style={{ background: color.bg, color: color.text }}
                                >
                                  {tipoLabels[c.tipo].toUpperCase()}
                                </span>
                              </div>
                              {c.descripcion && (
                                <span className="text-[11px] text-gray-500 truncate">{c.descripcion}</span>
                              )}
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span>{c.recursos} {c.recursos === 1 ? 'recurso' : 'recursos'}</span>
                                {c.fecha && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                                    <span>Publicado el {new Date(c.fecha).toLocaleDateString('es-PE')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {c.url && (
                              <ExternalLink size={14} className="text-gray-400 shrink-0" />
                            )}
                          </Wrapper>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {data.recientes && data.recientes.length > 0 && (
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Material reciente</h2>
              <div className="grid grid-cols-3 gap-3">
                {data.recientes.slice(0, 6).map((r) => {
                  const Icon = tipoIcon[r.tipo]
                  const color = tipoColor[r.tipo]
                  return (
                    <div key={r.id} className="bg-surface-muted rounded-xl overflow-hidden">
                      <div className="h-24 grid place-items-center" style={{ background: color.bg }}>
                        <Icon size={32} style={{ color: color.text }} />
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">{r.titulo}</span>
                        <span className="text-[10px] text-gray-400">{r.unidad}</span>
                        <span className="text-[10px] text-gray-400">{new Date(r.fecha).toLocaleDateString('es-PE')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-none gap-1">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
    </div>
  )
}
