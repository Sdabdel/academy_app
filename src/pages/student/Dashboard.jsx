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

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({})
  const [upcomingAssignments, setUpcomingAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', profile.id)

      const courseIds = (enrollments ?? []).map(e => e.course_id)

      const { data: submissions } = await supabase
        .from('submissions')
        .select('grade')
        .eq('student_id', profile.id)
        .not('grade', 'is', null)

      const avgGrade =
        submissions && submissions.length > 0
          ? (submissions.reduce((acc, s) => acc + s.grade, 0) / submissions.length).toFixed(1)
          : null

      let upcoming = []
      if (courseIds.length > 0) {
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('id, title, due_date, courses(title)')
          .in('course_id', courseIds)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5)
        upcoming = assignmentsData ?? []
      }

      setStats({
        enrolled: courseIds.length,
        submitted: submissions?.length ?? 0,
        avgGrade,
      })
      setUpcomingAssignments(upcoming)
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile?.full_name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Voici votre tableau de bord</p>
        </div>
        <Link
          to="/student/courses"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Parcourir les cours
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard label="Cours suivis" value={stats.enrolled} color="text-blue-600" />
            <StatCard label="Travaux rendus" value={stats.submitted} color="text-green-600" />
            <StatCard
              label="Moyenne générale"
              value={stats.avgGrade ? `${stats.avgGrade}/20` : '—'}
              color="text-purple-600"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Prochains rendus</h2>
            {upcomingAssignments.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun devoir à rendre prochainement</p>
            ) : (
              <div className="space-y-2">
                {upcomingAssignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.courses?.title}</p>
                    </div>
                    {a.due_date && (
                      <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                        {new Date(a.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
