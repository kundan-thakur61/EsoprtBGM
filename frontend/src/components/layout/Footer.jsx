/* src/components/layout/Footer.jsx */
import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-gray-600">
            © {year} EsportBGM. All rights reserved.
          </p>

          <nav className="flex items-center space-x-6 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
            <Link to="/support" className="text-gray-600 hover:text-gray-900">
              Support
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer          /* ←  default export */
