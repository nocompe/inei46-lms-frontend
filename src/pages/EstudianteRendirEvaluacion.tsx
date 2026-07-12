import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardList } from 'lucide-react'
import { api, loadAuth, type RendirEvaluacionDTO } from '../lib/api'

export default function EstudianteRendirEvaluacion() {
  const auth = loadAuth()
  const { id } = useParams<{ id: string }>()
  const tareaId = Number(id)
  const [data, setData] = useState<RendirEvaluacionDTO | null>(null)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ puntaje_obtenido: number; puntaje_maximo: number; correctas: number; total_preguntas: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth || !tareaId) return
    api.rendirEvaluacion(tareaId, auth.id)
      .then((d) => {
        setData(d)
        const r: Record<number, string> = {}
        d.preguntas.forEach((p) => { if (p.respuesta_previa) r[p.id] = p.respuesta_previa })
        setRespuestas(r)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [tareaId, auth?.id])

  if (!auth) return <div className="p-8 text-sm text-gray-600">Sesión no encontrada.</div>

  // Si la carga falló (p. ej. 403 por no estar matriculado), muestra el error en vez de un spinner infinito.
  if (!data && error) {
    return (
      <div className="max-w-xl mx-auto pt-10 flex flex-col gap-4">
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-4 py-3 text-sm text-inei-700">
          {error}
        </div>
        <Link to="/estudiante/tareas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-inei-600 hover:text-inei-700">
          <ArrowLeft size={15} /> Volver a mis tareas
        </Link>
      </div>
    )
  }
  if (!data) return <div className="p-8 text-sm text-gray-400">Cargando evaluación...</div>

  const submit = async () => {
    setEnviando(true)
    setError(null)
    try {
      const r = await api.entregarEvaluacion(tareaId, {
        estudiante_id: auth.id,
        respuestas: data.preguntas.map((p) => ({ pregunta_id: p.id, respuesta: respuestas[p.id] ?? '' })),
      })
      setResultado(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl mx-auto pt-8">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#DCFCE7] grid place-items-center">
            <CheckCircle2 size={32} className="text-[#15803D]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">¡Evaluación enviada!</h1>
          <p className="text-sm text-gray-600">Tu respuesta fue guardada correctamente.</p>
          <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-border-softer">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-400 uppercase">Puntaje</span>
              <span className="text-3xl font-bold text-inei-600">{resultado.puntaje_obtenido} / {resultado.puntaje_maximo}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-400 uppercase">Correctas</span>
              <span className="text-3xl font-bold text-[#15803D]">{resultado.correctas} / {resultado.total_preguntas}</span>
            </div>
          </div>
          <button onClick={() => navigate('/estudiante/tareas')} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold">
            Volver a mis tareas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/estudiante/tareas" className="text-xs text-gray-500 hover:text-[#1A1A1A] inline-flex items-center gap-1"><ArrowLeft size={12} /> Volver</Link>

      <div className="bg-inei-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
          <ClipboardList size={12} />
          <span>{data.tarea.curso} · {data.tarea.tipo.toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-bold mt-1">{data.tarea.titulo}</h1>
        {data.tarea.descripcion && <p className="text-xs text-white/80 mt-1">{data.tarea.descripcion}</p>}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span><strong>{data.preguntas.length}</strong> preguntas</span>
          <span><strong>{data.tarea.puntaje_maximo}</strong> pts máx</span>
          {data.tarea.ya_respondida && <span className="px-2 py-0.5 bg-white/20 rounded">Ya rendiste antes ({data.tarea.puntaje_obtenido} pts)</span>}
        </div>
      </div>

      {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}

      <div className="flex flex-col gap-3">
        {data.preguntas.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Pregunta {p.numero}</span>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">{p.enunciado}</h3>
              </div>
              <span className="h-6 px-2 inline-flex items-center rounded-full text-[10px] font-bold bg-inei-100 text-inei-700">{p.puntaje} pts</span>
            </div>
            {p.tipo === 'opcion_multiple' && p.opciones && (
              <div className="flex flex-col gap-1.5">
                {p.opciones.map((op, i) => (
                  <label key={i} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border ${respuestas[p.id] === op ? 'bg-inei-50 border-inei-200' : 'bg-surface-muted border-transparent'}`}>
                    <input type="radio" name={`p-${p.id}`} checked={respuestas[p.id] === op} onChange={() => setRespuestas({ ...respuestas, [p.id]: op })} className="text-inei-600" />
                    <span className="text-xs text-[#1A1A1A]">{String.fromCharCode(65 + i)}. {op}</span>
                  </label>
                ))}
              </div>
            )}
            {p.tipo === 'respuesta_corta' && (
              <input className="input" placeholder="Tu respuesta..." value={respuestas[p.id] ?? ''} onChange={(e) => setRespuestas({ ...respuestas, [p.id]: e.target.value })} />
            )}
            {p.tipo === 'desarrollo' && (
              <textarea className="input h-28 py-2" placeholder="Desarrolla tu respuesta..." value={respuestas[p.id] ?? ''} onChange={(e) => setRespuestas({ ...respuestas, [p.id]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center gap-3 sticky bottom-0 bg-surface-muted py-3 -mx-8 px-8 border-t border-border-soft">
        {data.tarea.ya_respondida ? (
          /* Un solo intento: si ya rindió, solo puede revisar sus respuestas. */
          <>
            <span className="text-xs text-gray-500">
              Ya rendiste esta evaluación (un solo intento). Puntaje: <strong>{data.tarea.puntaje_obtenido} / {data.tarea.puntaje_maximo}</strong>
            </span>
            <Link to="/estudiante/tareas" className="h-11 px-5 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center">
              Volver a mis tareas
            </Link>
          </>
        ) : (
          <button onClick={submit} disabled={enviando} className="h-11 px-5 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold">
            {enviando ? 'Enviando...' : 'Enviar evaluación'}
          </button>
        )}
      </div>
    </div>
  )
}
