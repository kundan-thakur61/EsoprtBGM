import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default MainLayout
