/* src/components/layout/AuthLayout.jsx */
import React from 'react'

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50">
    {children}
  </div>
)

export default AuthLayout          // ← default export required
