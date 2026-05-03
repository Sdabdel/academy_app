import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentCourseDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [expandedAssignment, setExpandedAssignment] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile) {
      loadCourse()
      loadAssignments()
    }
  }, [id, profile])

  async function loadCourse() {
    const { data } = await supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single()
    setCourse(data)
  }

  async function loadAssignments() {
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', id)
      .order('due_date', { ascending: true })

    setAssignments(assignmentsData ?? [])

    if (assignmentsData && assignmentsData.length > 0) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id)
        .in('assignment_id', assignmentsData.map(a => a.id))

      const subsMap = {}
      for (const sub of subs ?? []) {
        subsMap[sub.assignment_id] = sub
      }
      setSubmissions(subsMap)
    }
  }

  async function uploadSubmission(assignmentId, file) {
    setError(null)
    setUploading(assignmentId)

    const ext = file.name.split('.').pop()
    const path = `${assignmentId}/${profile.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Erreur lors du téléversement: ' + uploadError.message)
      setUploading(null)
      return
    }

    const existing = submissions[assignmentId]
    if (existing) {
      await supabase
        .from('submissions')
        .update({ file_url: path, submitted_at: new Date().toISOString(), grade: null, feedback: null, graded_at: null })
        .eq('id', existing.id)
    } else {
      await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        student_id: profile.id,
        file_url: path,
      })
    }

    await loadAssignments()
    setUploading(null)
  }

  async function viewFile(fileUrl) {
    const { data } = await supabase.storage.from('submissions').createSignedUrl(fileUrl, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function isPastDue(dueDate) {
    return dueDate && new Date(dueDate) < new Date()
  }

  if (!course) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/student/courses" className="text-sm text-blue-600 hover:underline">
          ← Cours disponibles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{course.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Professeur : {course.profiles?.full_name ?? '—'}
        </p>
        {course.description && <p className="text-gray-600 mt-2">{course.description}</p>}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <h2 className="font-semibold text-gray-900 mb-4">Devoirs ({assignments.length})</h2>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun devoir pour ce cours</div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            const submission = submissions[assignment.id]
            const pastDue = isPastDue(assignment.due_date)

            return (
              <div key={assignment.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-xl"
                  onClick={() => setExpandedAssignment(
                    expandedAssignment === assignment.id ? null : assignment.id
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      {submission ? (
                        submission.grade != null ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Noté : {submission.grade}/20
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Rendu
                          </span>
                        )
                      ) : pastDue ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          Délai dépassé
                        </span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          À rendre
                        </span>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <p className={`text-xs mt-1 ${pastDue ? 'text-red-500' : 'text-orange-600'}`}>
                        Date limite : {new Date(assignment.due_date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-lg ml-4">
                    {expandedAssignment === assignment.id ? '▲' : '▼'}
                  </span>
                </div>

                {expandedAssignment === assignment.id && (
                  <div className="border-t border-gray-100 p-5 space-y-4">
                    {submission ? (
                      <div>
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg mb-3">
                          <p className="text-sm text-green-800 font-medium">
                            Travail rendu le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                          </p>
                          {submission.grade != null && (
                            <div className="mt-2">
                              <p className="text-sm text-green-700">
                                <strong>Note :</strong> {submission.grade}/20
                              </p>
                              {submission.feedback && (
                                <p className="text-sm text-green-700 mt-1">
                                  <strong>Commentaire :</strong> {submission.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewFile(submission.file_url)}
                            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100"
                          >
                            Voir mon fichier
                          </button>
                          {!pastDue && (
                            <label className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer">
                              {uploading === assignment.id ? 'Envoi...' : 'Remplacer'}
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploading === assignment.id}
                                onChange={e => {
                                  if (e.target.files?.[0]) uploadSubmission(assignment.id, e.target.files[0])
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {pastDue ? (
                          <p className="text-sm text-red-600">Le délai de rendu est dépassé.</p>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600 mb-3">
                              Déposez votre travail ici (PDF, Word, image, etc.)
                            </p>
                            <label className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                              uploading === assignment.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}>
                              {uploading === assignment.id ? 'Envoi en cours...' : 'Choisir un fichier'}
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploading === assignment.id}
                                onChange={e => {
                                  if (e.target.files?.[0]) uploadSubmission(assignment.id, e.target.files[0])
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
