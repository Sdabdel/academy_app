import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const roleLabels = { admin: 'Admin', professeur: 'Professeur', etudiant: 'Étudiant' }
const roleBadge = {
  admin: 'bg-purple-100 text-purple-700',
  professeur: 'bg-green-100 text-green-700',
  etudiant: 'bg-blue-100 text-blue-700',
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'etudiant' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create', ...form },
    })
    if (error || data?.error) {
      setError(error?.message || data?.error)
      setLoading(false)
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer un utilisateur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              required
              minLength={2}
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 6 caractères"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="etudiant">Étudiant</option>
              <option value="professeur">Professeur</option>
            </select>
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChangePasswordModal({ user, onClose }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'update-password', user_id: user.id, password },
    })
    if (error || data?.error) {
      setError(error?.message || data?.error)
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Changer le mot de passe</h2>
        <p className="text-sm text-gray-500 mb-4">{user.full_name ?? user.email}</p>
        {success ? (
          <p className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg text-center">
            Mot de passe mis à jour !
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => { loadUsers() }, [])

  function flash(type, message) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3000)
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  async function changeRole(userId, newRole) {
    setActioningId(userId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setActioningId(null)
  }

  async function signOutUser(user) {
    if (!window.confirm(`Déconnecter ${user.full_name ?? user.email} ?`)) return
    setActioningId(user.id)
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'signout', user_id: user.id },
    })
    if (error || data?.error) flash('error', 'Erreur lors de la déconnexion')
    else flash('success', `${user.full_name ?? user.email} a été déconnecté`)
    setActioningId(null)
  }

  async function deleteUser(user) {
    if (!window.confirm(`Supprimer définitivement ${user.full_name ?? user.email} et toutes ses données ?`)) return
    setActioningId(user.id)
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', user_id: user.id },
    })
    if (error || data?.error) flash('error', 'Erreur lors de la suppression')
    else {
      setUsers(prev => prev.filter(u => u.id !== user.id))
      flash('success', 'Utilisateur supprimé')
    }
    setActioningId(null)
  }

  return (
    <div>
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { loadUsers(); flash('success', 'Utilisateur créé avec succès') }}
        />
      )}
      {passwordModal && (
        <ChangePasswordModal user={passwordModal} onClose={() => setPasswordModal(null)} />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} utilisateur(s)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Créer un utilisateur
        </button>
      </div>

      {feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Nom</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Rôle</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Inscrit le</th>
                <th className="text-right px-6 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.full_name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadge[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={user.role}
                        disabled={actioningId === user.id}
                        onChange={e => changeRole(user.id, e.target.value)}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="etudiant">Étudiant</option>
                        <option value="professeur">Professeur</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => setPasswordModal(user)}
                        disabled={actioningId === user.id}
                        className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        Mot de passe
                      </button>
                      <button
                        onClick={() => signOutUser(user)}
                        disabled={actioningId === user.id}
                        className="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        Déconnecter
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={actioningId === user.id}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucun utilisateur</div>
          )}
        </div>
      )}
    </div>
  )
}
