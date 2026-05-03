import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [users, courses, enrollments, submissions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: users.count,
        courses: courses.count,
        enrollments: enrollments.count,
        submissions: submissions.count,
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme</p>
        </div>
        <Link
          to="/admin/users"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Gérer les utilisateurs
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Utilisateurs" value={stats.users} color="text-purple-600" />
          <StatCard label="Cours" value={stats.courses} color="text-blue-600" />
          <StatCard label="Inscriptions" value={stats.enrollments} color="text-green-600" />
          <StatCard label="Rendus" value={stats.submissions} color="text-orange-600" />
        </div>
      )}
    </div>
  )
}
