import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchTournaments } from './tournamentsSlice'
import { Calendar, Users, Trophy, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

const TournamentList = () => {
  const dispatch = useDispatch()
  const { tournaments, isLoading, pagination } = useSelector((state) => state.tournaments)
  
  const [filters, setFilters] = useState({
    search: '',
    game: '',
    status: '',
    page: 1,
  })

  useEffect(() => {
    dispatch(fetchTournaments(filters))
  }, [dispatch, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      upcoming: 'badge-info',
      ongoing: 'badge-success',
      completed: 'badge-warning',
      cancelled: 'badge-danger',
    }
    
    return (
      <span className={`badge ${statusClasses[status] || 'badge-info'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading && tournaments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
        <p className="mt-2 text-gray-600">
          Discover and join exciting esports tournaments
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tournaments..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <select
            className="input"
            value={filters.game}
            onChange={(e) => handleFilterChange('game', e.target.value)}
          >
            <option value="">All Games</option>
            <option value="valorant">Valorant</option>
            <option value="csgo">CS:GO</option>
            <option value="lol">League of Legends</option>
            <option value="dota2">Dota 2</option>
            <option value="pubg">PUBG</option>
          </select>
          
          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          
          <Link
            to="/tournaments/create"
            className="btn btn-primary flex items-center justify-center"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Create Tournament
          </Link>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div key={tournament._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {tournament.name}
              </h3>
              {getStatusBadge(tournament.status)}
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-3">
              {tournament.description}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(tournament.startDate), 'MMM dd, yyyy HH:mm')}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                {tournament.participants?.length || 0} / {tournament.maxParticipants} participants
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Trophy className="w-4 h-4 mr-2" />
                Prize Pool: ${tournament.prizePool}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-primary-600">
                {tournament.game.toUpperCase()}
              </span>
              
              <Link
                to={`/tournaments/${tournament._id}`}
                className="btn btn-primary"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-md ${
                  page === pagination.page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TournamentList
