import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentCourses() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  async function loadData() {
    const [coursesRes, enrollRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', profile.id),
    ])
    setCourses(coursesRes.data ?? [])
    setEnrolledIds(new Set((enrollRes.data ?? []).map(e => e.course_id)))
    setLoading(false)
  }

  async function toggleEnroll(courseId) {
    setEnrolling(courseId)
    if (enrolledIds.has(courseId)) {
      await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', profile.id)
        .eq('course_id', courseId)
      setEnrolledIds(prev => { const s = new Set(prev); s.delete(courseId); return s })
    } else {
      await supabase.from('enrollments').insert({ student_id: profile.id, course_id: courseId })
      setEnrolledIds(prev => new Set([...prev, courseId]))
    }
    setEnrolling(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cours disponibles</h1>
        <p className="text-gray-500 text-sm mt-1">{courses.length} cours sur la plateforme</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucun cours disponible</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const enrolled = enrolledIds.has(course.id)
            return (
              <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
                {enrolled && (
                  <span className="self-start text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium mb-3">
                    Inscrit
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  par {course.profiles?.full_name ?? 'Professeur'}
                </p>
                {course.description && (
                  <p className="text-sm text-gray-500 flex-1 line-clamp-2 mb-4">{course.description}</p>
                )}
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                  {enrolled && (
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="flex-1 text-center text-sm bg-blue-50 text-blue-700 py-1.5 rounded-lg hover:bg-blue-100 font-medium"
                    >
                      Accéder
                    </Link>
                  )}
                  <button
                    onClick={() => toggleEnroll(course.id)}
                    disabled={enrolling === course.id}
                    className={`${enrolled ? '' : 'flex-1'} text-sm py-1.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      enrolled
                        ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {enrolling === course.id ? '...' : enrolled ? "Se désinscrire" : "S'inscrire"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
