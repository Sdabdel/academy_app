import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navLinks = {
  admin: [
    { to: '/admin', label: 'Tableau de bord' },
    { to: '/admin/users', label: 'Utilisateurs' },
  ],
  professeur: [
    { to: '/professor', label: 'Tableau de bord' },
    { to: '/professor/courses', label: 'Mes cours' },
  ],
  etudiant: [
    { to: '/student', label: 'Tableau de bord' },
    { to: '/student/courses', label: 'Cours disponibles' },
  ],
}

const roleBadgeColors = {
  admin: 'bg-purple-100 text-purple-700',
  professeur: 'bg-green-100 text-green-700',
  etudiant: 'bg-blue-100 text-blue-700',
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const links = navLinks[profile?.role] ?? []

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-bold text-blue-600 text-xl">🎓 Academy</span>
        <div className="flex gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === link.to
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">{profile?.full_name}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleBadgeColors[profile?.role]}`}>
          {profile?.role}
        </span>
        <button
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors ml-2"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
