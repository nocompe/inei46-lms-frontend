import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './layouts/DashboardLayout'
import TeacherLayout from './layouts/TeacherLayout'
import StudentLayout from './layouts/StudentLayout'
import ParentLayout from './layouts/ParentLayout'

// Admin
import AdminDashboard from './pages/AdminDashboard'
import Cursos from './pages/Cursos'
import AdminEstudiantes from './pages/AdminEstudiantes'
import AdminDocentes from './pages/AdminDocentes'
import Matricula from './pages/Matricula'
import AdminEvaluaciones from './pages/AdminEvaluaciones'
import AdminReportes from './pages/AdminReportes'
import AdminAsignaciones from './pages/AdminAsignaciones'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminVinculos from './pages/AdminVinculos'
import AdminSolicitudesMatricula from './pages/AdminSolicitudesMatricula'
import AdminHorarioMaestro from './pages/AdminHorarioMaestro'

// Docente
import VistaProfesor from './pages/VistaProfesor'
import DocenteEstudiantes from './pages/DocenteEstudiantes'
import DocenteContenido from './pages/DocenteContenido'
import Tareas from './pages/Tareas'
import Calificaciones from './pages/Calificaciones'
import Asistencia from './pages/Asistencia'
import DocenteComunicados from './pages/DocenteComunicados'

// Estudiante
import VistaEstudiante from './pages/VistaEstudiante'
import EstudianteMisCursos from './pages/EstudianteMisCursos'
import EstudianteCursoDetalle from './pages/EstudianteCursoDetalle'
import EstudianteTareas from './pages/EstudianteTareas'
import EstudianteCalificaciones from './pages/EstudianteCalificaciones'
import EstudianteHorario from './pages/EstudianteHorario'
import EstudianteNotificaciones from './pages/EstudianteNotificaciones'
import EstudianteRendirEvaluacion from './pages/EstudianteRendirEvaluacion'

// Padre
import VistaPadre from './pages/VistaPadre'
import PadreCalificaciones from './pages/PadreCalificaciones'
import PadreAsistencia from './pages/PadreAsistencia'
import PadreObservaciones from './pages/PadreObservaciones'
import PadreComunicados from './pages/PadreComunicados'
import PadrePagos from './pages/PadrePagos'
import PadreSolicitudesMatricula from './pages/PadreSolicitudesMatricula'

// Perfil (compartido)
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* Admin */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/estudiantes" element={<AdminEstudiantes />} />
          <Route path="/docentes" element={<AdminDocentes />} />
          <Route path="/matricula" element={<Matricula />} />
          <Route path="/evaluaciones" element={<AdminEvaluaciones />} />
          <Route path="/asignaciones" element={<AdminAsignaciones />} />
          <Route path="/usuarios" element={<AdminUsuarios />} />
          <Route path="/vinculos" element={<AdminVinculos />} />
          <Route path="/solicitudes-matricula" element={<AdminSolicitudesMatricula />} />
          <Route path="/horario-maestro" element={<AdminHorarioMaestro />} />
          <Route path="/reportes" element={<AdminReportes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        {/* Docente */}
        <Route element={<TeacherLayout />}>
          <Route path="/docente" element={<VistaProfesor />} />
          <Route path="/docente/estudiantes" element={<DocenteEstudiantes />} />
          <Route path="/docente/contenido" element={<DocenteContenido />} />
          <Route path="/docente/tareas" element={<Tareas />} />
          <Route path="/docente/calificaciones" element={<Calificaciones />} />
          <Route path="/docente/asistencia" element={<Asistencia />} />
          <Route path="/docente/comunicados" element={<DocenteComunicados />} />
          <Route path="/docente/perfil" element={<Perfil />} />
        </Route>

        {/* Estudiante */}
        <Route element={<StudentLayout />}>
          <Route path="/estudiante" element={<VistaEstudiante />} />
          <Route path="/estudiante/cursos" element={<EstudianteMisCursos />} />
          <Route path="/estudiante/cursos/:id" element={<EstudianteCursoDetalle />} />
          <Route path="/estudiante/tareas" element={<EstudianteTareas />} />
          <Route path="/estudiante/calificaciones" element={<EstudianteCalificaciones />} />
          <Route path="/estudiante/horario" element={<EstudianteHorario />} />
          <Route path="/estudiante/notificaciones" element={<EstudianteNotificaciones />} />
          <Route path="/estudiante/evaluaciones/:id/rendir" element={<EstudianteRendirEvaluacion />} />
          <Route path="/estudiante/perfil" element={<Perfil />} />
        </Route>

        {/* Padre */}
        <Route element={<ParentLayout />}>
          <Route path="/padre" element={<VistaPadre />} />
          <Route path="/padre/calificaciones" element={<PadreCalificaciones />} />
          <Route path="/padre/asistencia" element={<PadreAsistencia />} />
          <Route path="/padre/observaciones" element={<PadreObservaciones />} />
          <Route path="/padre/comunicados" element={<PadreComunicados />} />
          <Route path="/padre/pagos" element={<PadrePagos />} />
          <Route path="/padre/solicitudes-matricula" element={<PadreSolicitudesMatricula />} />
          <Route path="/padre/perfil" element={<Perfil />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
