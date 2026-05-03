import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { assignmentSchema, gradeSchema } from '../../lib/validations'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function ProfessorCourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [activeTab, setActiveTab] = useState('assignments')
  const [expandedAssignment, setExpandedAssignment] = useState(null)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [gradingSubmission, setGradingSubmission] = useState(null)

  const assignmentForm = useForm({ resolver: zodResolver(assignmentSchema) })
  const gradeForm = useForm({ resolver: zodResolver(gradeSchema) })

  useEffect(() => {
    loadCourse()
    loadStudents()
    loadAssignments()
  }, [id])

  useEffect(() => {
    if (expandedAssignment) loadSubmissions(expandedAssignment)
  }, [expandedAssignment])

  async function loadCourse() {
    const { data } = await supabase.from('courses').select('*').eq('id', id).single()
    setCourse(data)
  }

  async function loadStudents() {
    const { data } = await supabase
      .from('enrollments')
      .select('enrolled_at, profiles(id, full_name, email)')
      .eq('course_id', id)
    setStudents(data ?? [])
  }

  async function loadAssignments() {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false })
    setAssignments(data ?? [])
  }

  async function loadSubmissions(assignmentId) {
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles(full_name, email)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
    setSubmissions(prev => ({ ...prev, [assignmentId]: data ?? [] }))
  }

  async function createAssignment(data) {
    await supabase.from('assignments').insert({ ...data, course_id: id })
    setShowCreateAssignment(false)
    assignmentForm.reset()
    loadAssignments()
  }

  async function deleteAssignment(assignmentId) {
    if (!window.confirm('Supprimer ce devoir ?')) return
    await supabase.from('assignments').delete().eq('id', assignmentId)
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    if (expandedAssignment === assignmentId) setExpandedAssignment(null)
  }

  async function submitGrade(data) {
    await supabase
      .from('submissions')
      .update({ grade: data.grade, feedback: data.feedback, graded_at: new Date().toISOString() })
      .eq('id', gradingSubmission.id)
    setGradingSubmission(null)
    gradeForm.reset()
    loadSubmissions(expandedAssignment)
  }

  async function viewFile(fileUrl) {
    const { data } = await supabase.storage.from('submissions').createSignedUrl(fileUrl, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
        <Link to="/professor/courses" className="text-sm text-blue-600 hover:underline">
          ← Mes cours
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{course.title}</h1>
        {course.description && <p className="text-gray-500 mt-1">{course.description}</p>}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['assignments', 'students'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'assignments' ? `Devoirs (${assignments.length})` : `Étudiants (${students.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun étudiant inscrit</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Nom</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{e.profiles?.full_name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{e.profiles?.email}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(e.enrolled_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateAssignment(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Nouveau devoir
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun devoir créé</div>
          ) : (
            assignments.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-xl"
                  onClick={() => setExpandedAssignment(
                    expandedAssignment === assignment.id ? null : assignment.id
                  )}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <p className="text-xs text-orange-600 mt-1">
                        Rendu le {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={e => { e.stopPropagation(); deleteAssignment(assignment.id) }}
                      className="text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                    <span className="text-gray-400 text-lg">{expandedAssignment === assignment.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedAssignment === assignment.id && (
                  <div className="border-t border-gray-100 p-5">
                    <h4 className="font-medium text-gray-700 mb-3 text-sm">Rendus des étudiants</h4>
                    {!submissions[assignment.id] ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      </div>
                    ) : submissions[assignment.id].length === 0 ? (
                      <p className="text-sm text-gray-400">Aucun rendu pour l'instant</p>
                    ) : (
                      <div className="space-y-2">
                        {submissions[assignment.id].map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{sub.profiles?.full_name}</p>
                              <p className="text-xs text-gray-500">
                                Rendu le {new Date(sub.submitted_at).toLocaleDateString('fr-FR')}
                              </p>
                              {sub.grade != null && (
                                <p className="text-xs text-green-600 font-medium mt-0.5">
                                  Note: {sub.grade}/20 {sub.feedback && `— ${sub.feedback}`}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewFile(sub.file_url)}
                                className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100"
                              >
                                Voir le fichier
                              </button>
                              <button
                                onClick={() => {
                                  setGradingSubmission(sub)
                                  gradeForm.reset({ grade: sub.grade ?? '', feedback: sub.feedback ?? '' })
                                }}
                                className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                              >
                                {sub.grade != null ? 'Modifier note' : 'Noter'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showCreateAssignment && (
        <Modal title="Nouveau devoir" onClose={() => setShowCreateAssignment(false)}>
          <form onSubmit={assignmentForm.handleSubmit(createAssignment)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                {...assignmentForm.register('title')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {assignmentForm.formState.errors.title && (
                <p className="text-red-500 text-xs mt-1">{assignmentForm.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...assignmentForm.register('description')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
              <input
                type="datetime-local"
                {...assignmentForm.register('due_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateAssignment(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={assignmentForm.formState.isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {gradingSubmission && (
        <Modal title="Noter le rendu" onClose={() => setGradingSubmission(null)}>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{gradingSubmission.profiles?.full_name}</p>
          </div>
          <form onSubmit={gradeForm.handleSubmit(submitGrade)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (sur 20)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                {...gradeForm.register('grade')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {gradeForm.formState.errors.grade && (
                <p className="text-red-500 text-xs mt-1">{gradeForm.formState.errors.grade.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea
                {...gradeForm.register('feedback')}
                rows={3}
                placeholder="Optionnel..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={gradeForm.formState.isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
