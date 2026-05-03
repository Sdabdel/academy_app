import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { courseSchema } from '../../lib/validations'

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

export default function ProfessorCourses() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(courseSchema) })

  useEffect(() => {
    if (profile) loadCourses()
  }, [profile])

  async function loadCourses() {
    const { data } = await supabase
      .from('courses')
      .select('*, enrollments(count)')
      .eq('professor_id', profile.id)
      .order('created_at', { ascending: false })
    setCourses(data ?? [])
    setLoading(false)
  }

  function openCreate() {
    setEditCourse(null)
    reset({ title: '', description: '' })
    setShowModal(true)
  }

  function openEdit(course) {
    setEditCourse(course)
    reset({ title: course.title, description: course.description ?? '' })
    setShowModal(true)
  }

  async function onSubmit(data) {
    if (editCourse) {
      await supabase.from('courses').update(data).eq('id', editCourse.id)
    } else {
      await supabase.from('courses').insert({ ...data, professor_id: profile.id })
    }
    setShowModal(false)
    loadCourses()
  }

  async function deleteCourse(id) {
    if (!window.confirm('Supprimer ce cours et tout son contenu ?')) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
          <p className="text-gray-500 text-sm mt-1">{courses.length} cours</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nouveau cours
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucun cours pour l'instant</p>
          <p className="text-sm mt-1">Créez votre premier cours pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                <Link
                  to={`/professor/courses/${course.id}`}
                  className="flex-1 text-center text-sm bg-blue-50 text-blue-700 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Ouvrir
                </Link>
                <button
                  onClick={() => openEdit(course)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editCourse ? 'Modifier le cours' : 'Nouveau cours'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                {...register('title')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : editCourse ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
