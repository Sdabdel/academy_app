import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import ProfessorDashboard from './pages/professor/Dashboard'
import ProfessorCourses from './pages/professor/Courses'
import ProfessorCourseDetail from './pages/professor/CourseDetail'
import StudentDashboard from './pages/student/Dashboard'
import StudentCourses from './pages/student/Courses'
import StudentCourseDetail from './pages/student/CourseDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          <Route element={<ProtectedRoute role="professeur" />}>
            <Route path="/professor" element={<ProfessorDashboard />} />
            <Route path="/professor/courses" element={<ProfessorCourses />} />
            <Route path="/professor/courses/:id" element={<ProfessorCourseDetail />} />
          </Route>

          <Route element={<ProtectedRoute role="etudiant" />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<StudentCourses />} />
            <Route path="/student/courses/:id" element={<StudentCourseDetail />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
