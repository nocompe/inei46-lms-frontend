const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// Convierte una ruta relativa del backend (p. ej. /storage/archivo.pdf) en URL absoluta.
export const fileUrl = (path: string) =>
  path.startsWith('http') ? path : new URL(BASE).origin + path

type ApiError = { message: string; errors?: Record<string, string[]> }

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized(): never {
  clearAuth()
  window.location.href = '/login'
  throw new Error('Sesión expirada. Inicia sesión nuevamente.')
}

// fetch con Authorization Bearer y manejo centralizado de 401.
async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  })
  if (res.status === 401) handleUnauthorized()
  return res
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : null

  if (!res.ok) {
    const err = (body as ApiError) ?? { message: `HTTP ${res.status}` }
    const validation = err.errors ? Object.values(err.errors).flat().join(' · ') : null
    throw new Error(validation ?? err.message ?? 'Error desconocido')
  }

  return body as T
}

export type AuthUser = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  email: string
  rol: 'admin' | 'docente' | 'estudiante' | 'padre'
  grado: string | null
  seccion: string | null
}

export type CursoDTO = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  grado: string
  seccion: string
  docente: string
  estudiantes: number
  periodo: string
  estado: boolean
}

export type CursosResponse = {
  cursos: CursoDTO[]
  totales: { cursos: number; activos: number; estudiantes_matriculados: number }
}

export type UsuarioBreve = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  rol: string
  grado: string | null
  seccion: string | null
}

export type NuevoCurso = {
  codigo: string
  nombre: string
  descripcion?: string
  grado: string
  seccion: string
  docente_id: number
  periodo?: string
}

export type TipoTarea = 'tarea' | 'evaluacion' | 'examen'

export type TareaDTO = {
  id: number
  tipo: TipoTarea
  titulo: string
  descripcion: string | null
  fecha_limite: string
  puntaje_maximo: number
  publicada: boolean
  preguntas_count?: number
  curso: { id: number; codigo: string; nombre: string; docente: string | null }
}

export type NuevaTarea = {
  curso_id: number
  tipo: TipoTarea
  titulo: string
  descripcion?: string
  fecha_limite: string
  puntaje_maximo: number
  publicada?: boolean
  preguntas?: PreguntaInput[]
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    rol: 'estudiante' | 'docente' | 'padre'
    dni: string
    nombres: string
    apellidos: string
    email: string
    password: string
    password_confirmation: string
  }) =>
    request<{ user: AuthUser }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cursos: () => request<CursosResponse>('/cursos'),

  crearCurso: (data: NuevoCurso) =>
    request<{ curso: { id: number } }>('/cursos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  usuariosPorRol: (rol: 'estudiante' | 'docente' | 'padre' | 'admin') =>
    request<{ users: UsuarioBreve[] }>(`/usuarios?rol=${rol}`),

  buscarPorDni: (dni: string) =>
    request<{ user: AuthUser }>(`/usuarios/dni/${dni}`),

  matricular: (estudianteId: number, cursoIds: number[], fecha?: string) =>
    request<{ message: string }>('/matriculas', {
      method: 'POST',
      body: JSON.stringify({
        estudiante_id: estudianteId,
        cursos: cursoIds,
        fecha_matricula: fecha,
      }),
    }),

  tareas: () => request<{ tareas: TareaDTO[] }>('/tareas'),

  crearTarea: (data: NuevaTarea) =>
    request<{ tarea: TareaDTO }>('/tareas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  miCursos: (userId: number) =>
    request<{ cursos: MiCurso[] }>(`/me/cursos?user_id=${userId}`),

  miTareas: (userId: number) =>
    request<{ tareas: MiTareaDTO[] }>(`/me/tareas?user_id=${userId}`),

  miResumen: (userId: number) =>
    request<MiResumen>(`/me/resumen?user_id=${userId}`),

  asistenciaPorCursoFecha: (cursoId: number, fecha: string) =>
    request<AsistenciaListadoDTO>(`/asistencias?curso_id=${cursoId}&fecha=${fecha}`),

  guardarAsistencia: (data: GuardarAsistenciaPayload) =>
    request<{ message: string; registros: number }>('/asistencias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  entregasPorTarea: (tareaId: number) =>
    request<EntregasTareaDTO>(`/tareas/${tareaId}/entregas`),

  entregar: (data: { tarea_id: number; estudiante_id: number; contenido?: string; archivo_url?: string }) =>
    request<{ entrega: { id: number } }>('/entregas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  entregarConArchivo: async (formData: FormData) => {
    const res = await authFetch(`${BASE}/entregas`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json() : { message: `Respuesta inesperada del servidor (HTTP ${res.status})` }
    if (!res.ok) {
      const err = body as { message?: string; errors?: Record<string, string[]> }
      const v = err.errors ? Object.values(err.errors).flat().join(' · ') : null
      throw new Error(v ?? err.message ?? 'Error al entregar')
    }
    return body as { entrega: { id: number; archivo_url: string | null } }
  },

  calificar: (data: { entrega_id: number; puntaje: number; observacion?: string; docente_id: number }) =>
    request<{ calificacion: { id: number; puntaje: string } }>('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  calificacionesPorEstudiante: (estudianteId: number) =>
    request<{ calificaciones: CalificacionDTO[] }>(`/estudiantes/${estudianteId}/calificaciones`),

  hijosDePadre: (padreId: number) =>
    request<HijosResponse>(`/padre/hijos?padre_id=${padreId}`),

  miEstudiantes: (docenteId: number) =>
    request<{ estudiantes: EstudianteDocenteDTO[] }>(`/me/estudiantes?user_id=${docenteId}`),

  miPerfil: (userId: number) =>
    request<{ user: PerfilUser }>(`/me/perfil?user_id=${userId}`),

  actualizarPerfil: (userId: number, data: ActualizarPerfilPayload) =>
    request<{ message: string; user: PerfilUser }>(`/me/perfil?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  contenidoDeCurso: (cursoId: number) =>
    request<ContenidoCursoDTO>(`/cursos/${cursoId}/contenido`),

  crearUnidad: (data: { curso_id: number; numero: number; titulo: string; descripcion?: string }) =>
    request<{ unidad: { id: number } }>('/unidades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  crearContenido: (data: {
    unidad_id: number
    titulo: string
    tipo: ContenidoTipo
    descripcion?: string
    url?: string
    recursos?: number
    subido_por?: number
  }) =>
    request<{ contenido: { id: number } }>('/contenidos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  matriculas: () => request<{ matriculas: MatriculaListItem[] }>('/matriculas'),

  // Descarga la constancia de matrícula en PDF (generada en el backend vía Browserless).
  descargarConstancia: async (id: number) => {
    const res = await authFetch(`${BASE}/matriculas/${id}/constancia`, {
      headers: { Accept: 'application/pdf' },
    })
    if (!res.ok) throw new Error(`No se pudo generar la constancia (HTTP ${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `constancia-matricula-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  // Reporte 02 — Boleta de notas del estudiante en PDF.
  descargarBoleta: async (estudianteId: number) => {
    const res = await authFetch(`${BASE}/estudiantes/${estudianteId}/boleta`, {
      headers: { Accept: 'application/pdf' },
    })
    if (!res.ok) throw new Error(`No se pudo generar la boleta (HTTP ${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boleta-notas-${estudianteId}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  // Reporte 03 — Nómina de estudiantes matriculados por grado y sección en PDF.
  descargarReporteMatriculados: async (grado: string, seccion: string) => {
    const qs = new URLSearchParams({ grado, seccion }).toString()
    const res = await authFetch(`${BASE}/reportes/matriculados?${qs}`, {
      headers: { Accept: 'application/pdf' },
    })
    if (!res.ok) throw new Error(`No se pudo generar el reporte (HTTP ${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matriculados-${grado}-${seccion}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  // Exportar listados filtrados a PDF (Observaciones, Citaciones, Pagos).
  exportarListadoPdf: async (recurso: 'observaciones' | 'citaciones' | 'pagos', filtros: Record<string, string>) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))).toString()
    const res = await authFetch(`${BASE}/${recurso}/pdf${qs ? '?' + qs : ''}`, {
      headers: { Accept: 'application/pdf' },
    })
    if (!res.ok) throw new Error(`No se pudo exportar el PDF (HTTP ${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recurso}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  // CRUD extensions
  actualizarCurso: (id: number, data: Partial<NuevoCurso & { estado: boolean }>) =>
    request<{ curso: unknown }>(`/cursos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarCurso: (id: number) => request<{ message: string }>(`/cursos/${id}`, { method: 'DELETE' }),
  eliminarTarea: (id: number) => request<{ message: string }>(`/tareas/${id}`, { method: 'DELETE' }),
  eliminarMatricula: (id: number) => request<{ message: string }>(`/matriculas/${id}`, { method: 'DELETE' }),
  actualizarMatricula: (id: number, data: { estado?: MatriculaEstado; fecha_matricula?: string }) =>
    request<{ matricula: unknown }>(`/matriculas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarUnidad: (id: number) => request<{ message: string }>(`/unidades/${id}`, { method: 'DELETE' }),
  actualizarUnidad: (id: number, data: { numero?: number; titulo?: string; descripcion?: string }) =>
    request<{ unidad: unknown }>(`/unidades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarContenido: (id: number) => request<{ message: string }>(`/contenidos/${id}`, { method: 'DELETE' }),
  mostrarContenido: (id: number) =>
    request<{ contenido: { id: number; unidad_id: number; titulo: string; tipo: ContenidoTipo; descripcion: string | null; url: string | null; recursos: number } }>(`/contenidos/${id}`),
  actualizarContenido: (id: number, data: { titulo?: string; tipo?: ContenidoTipo; descripcion?: string; url?: string; recursos?: number }) =>
    request<{ contenido: unknown }>(`/contenidos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  actualizarContenidoConArchivo: async (id: number, fd: FormData) => {
    // Laravel acepta multipart con _method=PUT en una request POST
    fd.append('_method', 'PUT')
    const res = await authFetch(`${BASE}/contenidos/${id}`, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json() : { message: `Respuesta inesperada (HTTP ${res.status})` }
    if (!res.ok) {
      const err = body as { message?: string; errors?: Record<string, string[]> }
      const v = err.errors ? Object.values(err.errors).flat().join(' · ') : null
      throw new Error(v ?? err.message ?? 'Error al actualizar contenido')
    }
    return body as { contenido: unknown }
  },

  // Asignaciones
  asignaciones: () => request<{ asignaciones: AsignacionDTO[] }>('/asignaciones'),
  crearAsignacion: (data: {
    id_docente: number
    id_curso: number
    aula?: string
    periodo?: string
    horarios?: { dia_semana: string; hora_inicio: string; hora_fin: string; aula?: string }[]
  }) =>
    request<{ asignacion: { id_asignacion: number } }>('/asignaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  eliminarAsignacion: (id: number) => request<{ message: string }>(`/asignaciones/${id}`, { method: 'DELETE' }),

  // Mi horario
  miHorario: (userId: number) =>
    request<{ horarios: HorarioItem[] }>(`/me/horario?user_id=${userId}`),

  // Observaciones
  observaciones: (params?: { estudiante_id?: number; docente_id?: number; tipo?: string; prioridad?: string }) => {
    const qs = new URLSearchParams()
    if (params?.estudiante_id) qs.set('estudiante_id', String(params.estudiante_id))
    if (params?.docente_id) qs.set('docente_id', String(params.docente_id))
    if (params?.tipo) qs.set('tipo', params.tipo)
    if (params?.prioridad) qs.set('prioridad', params.prioridad)
    const q = qs.toString()
    return request<{ observaciones: ObservacionDTO[] }>(`/observaciones${q ? '?' + q : ''}`)
  },
  crearObservacion: (data: {
    id_estudiante: number
    id_docente: number
    descripcion: string
    tipo: string
    prioridad: string
    fecha?: string
  }) =>
    request<{ observacion: unknown }>('/observaciones', { method: 'POST', body: JSON.stringify(data) }),

  // Citaciones
  citaciones: (params?: { padre_id?: number; docente_id?: number; estado?: string; motivo?: string }) => {
    const qs = new URLSearchParams()
    if (params?.padre_id) qs.set('padre_id', String(params.padre_id))
    if (params?.docente_id) qs.set('docente_id', String(params.docente_id))
    if (params?.estado) qs.set('estado', params.estado)
    if (params?.motivo) qs.set('motivo', params.motivo)
    const q = qs.toString()
    return request<{ citaciones: CitacionDTO[] }>(`/citaciones${q ? '?' + q : ''}`)
  },
  crearCitacion: (data: {
    id_padre: number
    id_docente: number
    id_estudiante?: number
    motivo: string
    fecha: string
    hora: string
  }) => request<{ citacion: unknown }>('/citaciones', { method: 'POST', body: JSON.stringify(data) }),

  // Pagos
  pagos: (params?: { estudiante_id?: number; estado?: string; concepto?: string }) => {
    const qs = new URLSearchParams()
    if (params?.estudiante_id) qs.set('estudiante_id', String(params.estudiante_id))
    if (params?.estado) qs.set('estado', params.estado)
    if (params?.concepto) qs.set('concepto', params.concepto)
    const q = qs.toString()
    return request<{ pagos: PagoDTO[] }>(`/pagos${q ? '?' + q : ''}`)
  },

  // Mensajes
  bandejaMensajes: (userId: number) =>
    request<{ mensajes: MensajeDTO[] }>(`/mensajes/bandeja?user_id=${userId}`),
  enviadosMensajes: (userId: number) =>
    request<{ mensajes: MensajeEnviadoDTO[] }>(`/mensajes/enviados?user_id=${userId}`),
  enviarMensaje: (data: {
    id_usuario_emisor: number
    asunto: string
    contenido: string
    destinatarios: number[]
  }) => request<{ mensaje: unknown }>('/mensajes', { method: 'POST', body: JSON.stringify(data) }),
  marcarMensajeLeido: (id: number) =>
    request<{ message: string }>(`/mensajes/${id}/leido`, { method: 'PATCH' }),

  // Notificaciones
  notificaciones: (userId: number) =>
    request<{ notificaciones: NotificacionDTO[]; no_leidas: number }>(`/notificaciones?user_id=${userId}`),
  marcarNotificacionLeida: (id: number) =>
    request<{ message: string }>(`/notificaciones/${id}/leida`, { method: 'PATCH' }),

  // Pagos
  pagosEstudiante: (estudianteId: number) =>
    request<{ pagos: PagoDTO[]; resumen: { total_pagado: number; total_pendiente: number; siguiente_vencimiento: string | null } }>(
      `/pagos?estudiante_id=${estudianteId}`
    ),
  crearPago: (data: {
    id_estudiante: number
    id_matricula?: number
    concepto: string
    monto: number
    fecha_vencimiento: string
  }) => request<{ pago: unknown }>('/pagos', { method: 'POST', body: JSON.stringify(data) }),
  marcarPagoPagado: (id: number, metodo: string = 'transferencia') =>
    request<{ pago: unknown }>(`/pagos/${id}/pagar`, { method: 'PATCH', body: JSON.stringify({ metodo_pago: metodo }) }),
  anularPago: (id: number) =>
    request<{ pago: unknown }>(`/pagos/${id}/anular`, { method: 'PATCH' }),
  iniciarTransaccionPago: (id: number, data: { gateway: Gateway; return_url?: string }) =>
    request<{ transaction: TransaccionPago; firma: string }>(`/pagos/${id}/iniciar-transaccion`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  consultarTransaccion: (transactionId: string) =>
    request<{ transaction: TransaccionPago }>(`/pagos/transaccion/${transactionId}`),
  confirmarWebhookPago: (data: { transaction_id: string; gateway: Gateway; status: 'approved' | 'rejected' | 'pending'; firma: string; gateway_payload?: Record<string, unknown> }) =>
    request<{ message: string; pago: unknown }>('/pagos/webhook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Solicitudes de matrícula
  solicitudesMatricula: (params?: { padre_id?: number; estado?: SolicitudEstado }) => {
    const qs = new URLSearchParams()
    if (params?.padre_id) qs.set('padre_id', String(params.padre_id))
    if (params?.estado) qs.set('estado', params.estado)
    const q = qs.toString()
    return request<{ solicitudes: SolicitudMatriculaDTO[]; contadores: Record<SolicitudEstado, number> }>(
      `/solicitudes-matricula${q ? '?' + q : ''}`
    )
  },
  verSolicitudMatricula: (id: number) =>
    request<{ solicitud: SolicitudMatriculaDTO }>(`/solicitudes-matricula/${id}`),
  crearSolicitudMatricula: async (fd: FormData) => {
    const res = await authFetch(`${BASE}/solicitudes-matricula`, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json() : { message: `Respuesta inesperada del servidor (HTTP ${res.status})` }
    if (!res.ok) {
      const err = body as { message?: string; errors?: Record<string, string[]> }
      const v = err.errors ? Object.values(err.errors).flat().join(' · ') : null
      throw new Error(v ?? err.message ?? 'Error al crear solicitud')
    }
    return body as { solicitud: SolicitudMatriculaDTO }
  },
  agregarDocumentosSolicitud: async (id: number, fd: FormData) => {
    const res = await authFetch(`${BASE}/solicitudes-matricula/${id}/documentos`, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json() : { message: `Respuesta inesperada del servidor (HTTP ${res.status})` }
    if (!res.ok) {
      const err = body as { message?: string; errors?: Record<string, string[]> }
      const v = err.errors ? Object.values(err.errors).flat().join(' · ') : null
      throw new Error(v ?? err.message ?? 'Error al subir documentos')
    }
    return body as { solicitud: SolicitudMatriculaDTO; message: string }
  },
  aprobarSolicitud: (id: number, data: { revisor_id: number; grado: string; seccion: string }) =>
    request<{ solicitud: SolicitudMatriculaDTO; estudiante: { id: number; email: string }; password_temporal: string | null }>(
      `/solicitudes-matricula/${id}/aprobar`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  rechazarSolicitud: (id: number, data: { revisor_id: number; motivo: string }) =>
    request<{ solicitud: SolicitudMatriculaDTO }>(`/solicitudes-matricula/${id}/rechazar`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  observarSolicitud: (id: number, data: { revisor_id: number; observaciones: string }) =>
    request<{ solicitud: SolicitudMatriculaDTO }>(`/solicitudes-matricula/${id}/observar`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),

  // Horario maestro y auto-matrícula
  horarioMaestro: (grado: string, seccion: string) =>
    request<HorarioMaestroDTO>(`/horarios/grado-seccion?grado=${encodeURIComponent(grado)}&seccion=${encodeURIComponent(seccion)}`),
  autoMatricularEstudiante: (id: number) =>
    request<AutoMatriculaResultado>(`/estudiantes/${id}/auto-matricular`, { method: 'POST' }),
  autoMatricularTodos: () =>
    request<{
      message: string
      estudiantes_actualizados: number
      total_matriculas_creadas: number
      detalle: { estudiante_id: number; estudiante: string; grado_seccion: string; creadas: number }[]
    }>('/estudiantes/auto-matricular-todos', { method: 'POST' }),

  // Vínculos padre-estudiante (admin)
  vinculosPadreEstudiante: () =>
    request<{ vinculos: VinculoPadreEstudiante[] }>('/padre-estudiante'),
  vincularPadreEstudiante: (data: { padre_id: number; estudiante_id: number; parentesco: Parentesco }) =>
    request<{ message: string }>('/padre-estudiante', { method: 'POST', body: JSON.stringify(data) }),
  desvincularPadreEstudiante: (padreId: number, estudianteId: number) =>
    request<{ message: string }>(`/padre-estudiante/${padreId}/${estudianteId}`, { method: 'DELETE' }),

  // Asistencias del estudiante
  asistenciasEstudiante: (estudianteId: number) =>
    request<{ items: AsistenciaItemDTO[]; resumen: AsistenciaResumen }>(`/estudiantes/${estudianteId}/asistencias`),

  // Evaluación
  rendirEvaluacion: (tareaId: number, userId: number) =>
    request<RendirEvaluacionDTO>(`/evaluaciones/${tareaId}/rendir?user_id=${userId}`),
  entregarEvaluacion: (tareaId: number, data: {
    estudiante_id: number
    respuestas: { pregunta_id: number; respuesta: string }[]
  }) => request<{
    message: string
    puntaje_obtenido: number
    puntaje_maximo: number
    correctas: number
    total_preguntas: number
  }>(`/evaluaciones/${tareaId}/entregar`, { method: 'POST', body: JSON.stringify(data) }),

  // Docente: revisar respuestas de una evaluación y calificar preguntas de desarrollo.
  respuestasEvaluacion: (tareaId: number, estudianteId: number) =>
    request<RespuestasEvaluacionDocenteDTO>(`/evaluaciones/${tareaId}/respuestas/${estudianteId}`),
  calificarRespuesta: (respuestaId: number, puntajeObtenido: number) =>
    request<{ message: string }>(`/evaluaciones/respuestas/${respuestaId}/calificar`, {
      method: 'POST',
      body: JSON.stringify({ puntaje_obtenido: puntajeObtenido }),
    }),

  // Admin CRUD usuarios
  verUsuario: (id: number) => request<{ user: UsuarioAdminDTO }>(`/usuarios/${id}`),
  crearUsuario: (data: NuevoUsuario) =>
    request<{ user: UsuarioAdminDTO }>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  actualizarUsuario: (id: number, data: Partial<NuevoUsuario> & { estado?: boolean }) =>
    request<{ user: UsuarioAdminDTO }>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarUsuario: (id: number) =>
    request<{ message: string }>(`/usuarios/${id}`, { method: 'DELETE' }),

  // Edit tareas
  actualizarTarea: (id: number, data: Partial<NuevaTarea>) =>
    request<{ tarea: TareaDTO }>(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Upload de contenido (multipart)
  subirContenido: async (formData: FormData) => {
    const res = await authFetch(`${BASE}/contenidos`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json() : { message: `Respuesta inesperada del servidor (HTTP ${res.status})` }
    if (!res.ok) {
      const err = body as { message?: string; errors?: Record<string, string[]> }
      const v = err.errors ? Object.values(err.errors).flat().join(' · ') : null
      throw new Error(v ?? err.message ?? 'Error')
    }
    return body as { contenido: { id: number } }
  },
}

export type AsignacionDTO = {
  id: number
  docente: { id: number; nombre: string }
  curso: { id: number; codigo: string; nombre: string; grado: string; seccion: string }
  aula: string | null
  periodo: string
  fecha_asignacion: string | null
  estado: string
  horarios: { id: number; dia_semana: string; hora_inicio: string; hora_fin: string; aula: string | null }[]
}

export type HorarioItem = {
  dia_semana: string
  hora_inicio: string
  hora_fin: string
  aula: string | null
  curso: string
  codigo: string
  docente: string
}

export type ObservacionDTO = {
  id: number
  estudiante: { id: number; dni: string; nombre: string } | null
  docente: string | null
  descripcion: string
  tipo: string
  prioridad: string
  fecha: string | null
}

export type CitacionDTO = {
  id: number
  padre: string | null
  docente: string | null
  estudiante: string | null
  motivo: string
  fecha: string | null
  hora: string
  estado: string
}

export type MensajeDTO = {
  id: number
  mensaje_id: number
  leido: boolean
  fecha_lectura: string | null
  asunto: string
  contenido: string
  fecha_envio: string
  emisor: string
}

export type MensajeEnviadoDTO = {
  id: number
  asunto: string
  contenido: string
  fecha_envio: string
  destinatarios: { nombre: string; leido: boolean }[]
}

export type NotificacionDTO = {
  id: number
  titulo: string
  mensaje: string
  tipo: string
  fecha_envio: string
  leido: boolean
}

export type PagoDTO = {
  id: number
  id_estudiante: number
  concepto: string
  monto: number
  moneda?: string
  fecha_pago: string | null
  fecha_vencimiento: string | null
  metodo_pago: string | null
  estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado'
  referencia?: string | null
  gateway?: string | null
  transaction_id?: string | null
}

export type Gateway = 'culqi' | 'mercadopago' | 'niubiz' | 'izipay' | 'manual'

export type TransaccionPago = {
  id: string
  referencia: string
  gateway: Gateway
  pago_id: number
  amount: number
  currency: string
  concepto?: string
  checkout_url?: string
  public_key?: string
  estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado'
  fecha_pago?: string | null
}

export type Parentesco = 'padre' | 'madre' | 'tutor' | 'apoderado'

export type VinculoPadreEstudiante = {
  padre: { id: number; dni: string; nombres: string; apellidos: string; email: string }
  estudiante: { id: number; dni: string; nombres: string; apellidos: string; grado: string | null; seccion: string | null }
  parentesco: Parentesco
  fecha: string | null
}

export type MatriculaEstado = 'activa' | 'suspendida' | 'retirada' | 'finalizada'

export type HorarioMaestroCurso = {
  id: number
  codigo: string
  nombre: string
  docente: string | null
  horarios: {
    dia_semana: string
    hora_inicio: string
    hora_fin: string
    aula: string | null
  }[]
}

export type HorarioMaestroDTO = {
  grado: string
  seccion: string
  cursos: HorarioMaestroCurso[]
  estudiantes: number
}

export type AutoMatriculaResultado = {
  message: string
  creadas: number
  ya_existian: number
  cursos: { id: number; codigo: string; nombre: string; nuevo: boolean }[]
}

export type SolicitudEstado = 'pendiente' | 'observada' | 'aprobada' | 'rechazada'

export type DocumentoTipo =
  | 'dni_estudiante'
  | 'dni_padre'
  | 'acta_estudios'
  | 'partida_nacimiento'
  | 'foto_estudiante'
  | 'constancia_domicilio'
  | 'otros'

export type DocumentoMatriculaDTO = {
  id: number
  tipo: DocumentoTipo
  nombre_original: string
  archivo_url: string
  tamano_kb: number
  fecha_subida: string | null
}

export type NivelEducativo = 'inicial' | 'primaria' | 'secundaria'
export type CondicionMatricula = 'nuevo_ingreso' | 'traslado' | 'reincorporacion'

export type SolicitudMatriculaDTO = {
  id: number
  estado: SolicitudEstado
  padre: { id: number; dni: string; nombres: string; apellidos: string; email: string } | null
  estudiante_id: number | null
  estudiante: {
    dni: string
    nombres: string
    apellidos: string
    fecha_nacimiento: string | null
    genero: 'M' | 'F' | null
    direccion?: string | null
    email_acceso?: string | null // usuario del aula virtual (solo tras aprobación)
  }
  nivel_educativo?: NivelEducativo
  telefono_contacto?: string | null
  condicion?: CondicionMatricula
  observaciones_padre?: string | null
  codigo_matricula?: string | null
  grado_solicitado: string
  seccion_solicitada: string | null
  parentesco: Parentesco
  anio_lectivo: string
  motivo_rechazo: string | null
  observaciones_admin: string | null
  fecha_solicitud: string | null
  fecha_revision: string | null
  revisado_por: { id: number; nombres: string; apellidos: string } | null
  documentos: DocumentoMatriculaDTO[]
  documentos_count: number
}

export type AsistenciaItemDTO = {
  fecha: string
  curso: string
  estado: 'presente' | 'ausente' | 'tarde' | 'justificado'
  observacion: string | null
}

export type AsistenciaResumen = {
  total: number
  presentes: number
  tardes: number
  ausentes: number
  justificadas: number
  porcentaje: number | null
}

export type RendirPreguntaDTO = {
  id: number
  numero: number
  enunciado: string
  tipo: 'opcion_multiple' | 'respuesta_corta' | 'desarrollo'
  opciones: string[] | null
  puntaje: number
  respuesta_previa: string | null
  correcta_previa: boolean | null
}

export type UsuarioAdminDTO = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  rol: 'admin' | 'docente' | 'estudiante' | 'padre'
  rol_id?: number
  grado: string | null
  seccion: string | null
  estado: boolean
}

export type NuevoUsuario = {
  dni: string
  nombres: string
  apellidos: string
  email?: string // si se omite, el backend genera nombre.apellido@inei46.edu.pe
  telefono?: string
  password: string
  password_confirmation?: string
  rol: 'admin' | 'docente' | 'estudiante' | 'padre'
  grado?: string
  seccion?: string
  especialidad?: string // solo docentes: se guarda en su perfil (tabla docentes)
}

export type RendirEvaluacionDTO = {
  tarea: {
    id: number
    titulo: string
    descripcion: string | null
    tipo: string
    puntaje_maximo: number
    curso: string
    ya_respondida: boolean
    puntaje_obtenido: number
  }
  preguntas: RendirPreguntaDTO[]
}

export type RespuestaEvaluacionDocenteItem = {
  respuesta_id: number | null
  numero: number
  enunciado: string
  tipo: 'opcion_multiple' | 'respuesta_corta' | 'desarrollo'
  puntaje_maximo: number
  respuesta: string | null
  correcta: boolean | null
  puntaje_obtenido: number | null
}

export type RespuestasEvaluacionDocenteDTO = {
  tarea: { id: number; titulo: string; puntaje_maximo: number }
  respuestas: RespuestaEvaluacionDocenteItem[]
  total_obtenido: number
}

export type ContenidoTipo = 'texto' | 'video' | 'presentacion' | 'ejercicio' | 'pdf' | 'cuestionario' | 'enlace'

export type ContenidoItem = {
  id: number
  titulo: string
  tipo: ContenidoTipo
  descripcion: string | null
  url: string | null
  recursos: number
  fecha: string | null
}

export type UnidadDTO = {
  id: number
  numero: number
  titulo: string
  descripcion: string | null
  temas: number
  contenidos: ContenidoItem[]
}

export type ContenidoCursoDTO = {
  curso: { id: number; codigo: string; nombre: string; grado: string; seccion: string; docente: string }
  unidades: UnidadDTO[]
  recientes: { id: number; titulo: string; tipo: ContenidoTipo; unidad: string; fecha: string }[]
}

export type MatriculaListItem = {
  id: number
  estudiante: { id: number; dni: string; nombres: string; apellidos: string; grado: string | null; seccion: string | null }
  curso: { id: number; codigo: string; nombre: string }
  fecha_matricula: string
  estado: string
}

export type PreguntaInput = {
  enunciado: string
  tipo: 'opcion_multiple' | 'respuesta_corta' | 'desarrollo'
  puntaje?: number
  opciones?: string[]
  respuesta_correcta?: string | null
}

export type PerfilUser = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  rol: 'admin' | 'docente' | 'estudiante' | 'padre'
  grado: string | null
  seccion: string | null
  fecha_registro?: string
}

export type ActualizarPerfilPayload = {
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  grado?: string
  seccion?: string
  password?: string
  password_confirmation?: string
}

export type EstudianteDocenteDTO = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  email: string
  grado: string | null
  seccion: string | null
  cursos: number
}

export type EntregaItem = {
  id: number
  estudiante: { id: number; dni: string; nombres: string; apellidos: string }
  contenido: string | null
  archivo_url: string | null
  fecha_entrega: string
  estado: 'entregada' | 'atrasada'
  calificacion: { puntaje: number; observacion: string | null; fecha_registro: string } | null
}

export type EntregasTareaDTO = {
  tarea: {
    id: number
    tipo: TipoTarea
    titulo: string
    puntaje_maximo: number
    curso: { codigo: string; nombre: string; docente: string }
  }
  entregas: EntregaItem[]
}

export type CalificacionDTO = {
  curso: string
  curso_codigo: string
  tarea: string
  tipo: TipoTarea
  fecha_entrega: string
  puntaje: number | null
  puntaje_maximo: number
  observacion: string | null
}

export type HijoResumen = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  grado: string | null
  seccion: string | null
  cursos: number
  promedio: number | null
  asistencia_pct: number | null
  observaciones: number
  parentesco: string
}

export type HijosResponse = {
  padre: { id: number; nombres: string; apellidos: string }
  hijos: HijoResumen[]
}

export type MiCurso = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  grado: string
  seccion: string
  periodo: string
  estado: boolean
  docente?: string
  estudiantes?: number
}

export type MiTareaDTO = {
  id: number
  tipo: TipoTarea
  titulo: string
  descripcion: string | null
  fecha_limite: string
  puntaje_maximo: number
  entregas?: number
  entregas_pendientes?: number
  curso: { id?: number; codigo: string; nombre: string; docente: string }
  mi_entrega?: {
    id: number
    estado: string
    fecha_entrega: string
    puntaje?: number | null
    calificacion?: { puntaje: number; observacion?: string | null } | null
  } | null
}

export type MiResumen = {
  cursos: number
  tareas_pendientes?: number
  asistencia_pct?: number | null
  estudiantes?: number
  tareas?: number
  entregas_pendientes?: number
}

export type AsistenciaEstado = 'presente' | 'ausente' | 'tarde' | 'justificado'

export type AsistenciaItem = {
  estudiante: {
    id: number
    dni: string
    nombres: string
    apellidos: string
    grado: string | null
    seccion: string | null
  }
  estado: AsistenciaEstado | null
  observacion: string | null
}

export type AsistenciaListadoDTO = {
  curso_id: number
  fecha: string
  items: AsistenciaItem[]
}

export type GuardarAsistenciaPayload = {
  curso_id: number
  fecha: string
  registrado_por?: number
  items: {
    estudiante_id: number
    estado: AsistenciaEstado
    observacion?: string
  }[]
}

const STORAGE_KEY = 'inei46.auth'

type StoredAuth = { user: AuthUser; token: string | null }

function readStored(): { data: StoredAuth; storage: Storage } | null {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object') {
        if ('user' in parsed) {
          const p = parsed as { user: AuthUser; token?: string | null }
          return { data: { user: p.user, token: p.token ?? null }, storage }
        }
        // Shape legado: se guardaba el usuario directamente (sin token).
        return { data: { user: parsed as AuthUser, token: null }, storage }
      }
      storage.removeItem(STORAGE_KEY)
    } catch {
      storage.removeItem(STORAGE_KEY)
    }
  }
  return null
}

/**
 * Guarda la sesión. Si `remember` es true usa localStorage; si es false, sessionStorage.
 * Si se omiten `token`/`remember` se conservan los valores actuales (útil al actualizar el perfil).
 */
export function saveAuth(user: AuthUser, token?: string, remember?: boolean) {
  const prev = readStored()
  const finalToken = token ?? prev?.data.token ?? null
  const useLocal = remember ?? (prev ? prev.storage === localStorage : true)
  clearAuth()
  const target = useLocal ? localStorage : sessionStorage
  target.setItem(STORAGE_KEY, JSON.stringify({ user, token: finalToken }))
}

export function loadAuth(): AuthUser | null {
  return readStored()?.data.user ?? null
}

export function getToken(): string | null {
  return readStored()?.data.token ?? null
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

export function homeForRole(rol: AuthUser['rol']): string {
  switch (rol) {
    case 'docente': return '/docente'
    case 'estudiante': return '/estudiante'
    case 'padre': return '/padre'
    case 'admin':
    default: return '/dashboard'
  }
}
