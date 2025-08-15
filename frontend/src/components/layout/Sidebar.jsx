/* src/components/layout/Sidebar.jsx */
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const nav = [
  { name: 'Dashboard',    href: '/dashboard'   },
  { name: 'Tournaments',  href: '/tournaments' },
  { name: 'Matches',      href: '/matches'     },
  { name: 'Teams',        href: '/teams'       },
  { name: 'Leaderboard',  href: '/leaderboard' },
]

const Sidebar = () => {
  const { pathname } = useLocation()

  return (
    <aside className="hidden lg:block lg:w-64 bg-white border-r border-gray-200">
      <nav className="p-4 space-y-1">
        {nav.map(item => (
          <Link
            key={item.name}
            to={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium
              ${pathname.startsWith(item.href)
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar      /* ← default export required */
