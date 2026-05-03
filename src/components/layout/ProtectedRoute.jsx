import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from './Layout'

const roleHome = {
  admin: '/admin',
  professeur: '/professor',
  etudiant: '/student',
}

export default function ProtectedRoute({ role }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role && profile?.role !== role) {
    return <Navigate to={roleHome[profile?.role] ?? '/login'} replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
