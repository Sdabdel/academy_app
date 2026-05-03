import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function ProfessorDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({})
  const [recentCourses, setRecentCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, created_at')
        .eq('professor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const courseIds = (courses ?? []).map(c => c.id)

      const [enrollRes, submRes] = await Promise.all([
        courseIds.length
          ? supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
          : { count: 0 },
        courseIds.length
          ? supabase
              .from('submissions')
              .select('id', { count: 'exact', head: true })
              .is('grade', null)
              .in(
                'assignment_id',
                (
                  await supabase
                    .from('assignments')
                    .select('id')
                    .in('course_id', courseIds)
                ).data?.map(a => a.id) ?? []
              )
          : { count: 0 },
      ])

      setStats({
        courses: courses?.length ?? 0,
        students: enrollRes.count ?? 0,
        pending: submRes.count ?? 0,
      })
      setRecentCourses(courses ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile?.full_name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Voici un aperçu de vos cours</p>
        </div>
        <Link
          to="/professor/courses"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Gérer mes cours
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard label="Mes cours" value={stats.courses} color="text-blue-600" />
            <StatCard label="Étudiants inscrits" value={stats.students} color="text-green-600" />
            <StatCard label="Rendus à noter" value={stats.pending} color="text-orange-600" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Cours récents</h2>
            {recentCourses.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun cours pour l'instant.</p>
            ) : (
              <div className="space-y-2">
                {recentCourses.map(c => (
                  <Link
                    key={c.id}
                    to={`/professor/courses/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">{c.title}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
