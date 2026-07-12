# INEI 46 LMS — Frontend (React + TypeScript + Vite)

Frontend del Sistema de Gestión Educativa Integral del **Colegio INEI 46** (Vitarte, Lima). Proyecto integrador — UTP, Escuela Profesional de Ingeniería de Sistemas, Sección 32470. Docente asesor: Dr. David Huber Lazo Neira.

> Backend correspondiente: **[inei46-lms-backend](https://github.com/<usuario>/inei46-lms-backend)** (PHP + Laravel 11 + MySQL).

## Stack

- React 19 + TypeScript
- Vite (dev server con HMR)
- Tailwind CSS v4
- React Router 6
- Lucide Icons

## Equipo

| Rol | Integrante |
|---|---|
| Project Manager | Gonzáles del Valle Vargas, Marco |
| Architecture DB | Huincho Villanueva, Fabrizio |
| Web Master | Venegas Pacheco, Dorcas Medalit |
| Programming · Backend | Gordillo Vallejos, Bernny |
| Programming · Frontend | Huillca Loco, Andre |
| Programming · QA | Quispe Barja, Davis |

## Requisitos previos

- Node.js ≥ 20
- npm ≥ 10 (o pnpm/yarn equivalente)
- Backend Laravel corriendo en `http://localhost:8000` (ver repo del backend)

## Setup desde cero

```bash
# 1. Clonar
git clone https://github.com/<usuario>/inei46-lms-frontend.git
cd inei46-lms-frontend

# 2. Dependencias
npm install

# 3. Levantar dev server
npm run dev
# → http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev       # servidor de desarrollo con HMR
npm run build     # build de producción → dist/
npm run preview   # servir el build local para verificar
npm run lint      # ESLint sobre src/
```

## Estructura

```
proyecto-integrador/
├── src/
│   ├── App.tsx                  ← router principal
│   ├── lib/api.ts               ← cliente HTTP del backend
│   ├── components/              ← componentes reutilizables
│   ├── layouts/                 ← layouts por rol (admin/docente/estudiante/padre)
│   └── pages/                   ← páginas (Login, Register, Cursos, Matrícula, etc.)
├── public/
├── index.html
├── vite.config.ts
└── tsconfig.json
```

## Roles cubiertos

- **Administrador** — gestión de usuarios y cursos
- **Docente** — administra sus cursos y evaluaciones
- **Estudiante** — ve cursos matriculados, tareas, calificaciones
- **Padre de familia** — consulta avance de su hijo

## Conexión con el backend

La URL de la API se configura en `src/lib/api.ts` (variable `VITE_API_URL`, por defecto `http://localhost:8000/api`). En producción cambiar al dominio donde esté desplegado el backend.

### Autenticación por token (Bearer)

- `POST /api/login` devuelve `{ user, token }`. El token se guarda junto al usuario bajo la clave `inei46.auth`:
  - **localStorage** si se marcó "Recordarme" en el login; **sessionStorage** si no.
- Todas las requests (JSON, multipart y descargas PDF) envían `Authorization: Bearer <token>` automáticamente.
- Si el backend responde **401**, el frontend limpia la sesión y redirige a `/login`.
- Rutas protegidas por rol con `src/components/ProtectedRoute.tsx`: sin sesión → `/login`; rol incorrecto → home de su rol. Ruta inexistente → página 404 (`src/pages/NotFound.tsx`).

### Pagos (webhook firmado)

`POST /api/pagos/{id}/iniciar-transaccion` devuelve además `firma`, que el frontend reenvía en el body de `POST /api/pagos/webhook` al simular la confirmación (ver `PadrePagos.tsx`).

## Avances recientes (jul 2026)

- Auth con token Bearer + manejo global de 401 + "Recordarme" (local vs session storage).
- Guard de rutas por rol (`ProtectedRoute`) y página 404.
- Botones conectados: descargar boletín (padre), subir contenido (docente), "Ver todas"/detalle de matrícula (admin), filtros funcionales de cursos (periodo/grado/estado).
- Dashboards con datos reales: promedio del estudiante, próxima clase derivada del horario, siguiente pago pendiente del hijo.
- Constructor de preguntas: captura de `respuesta_correcta` (opción múltiple y respuesta corta).
- URLs de archivos centralizadas con `fileUrl()` (sin `localhost:8000` hardcodeado en páginas).
