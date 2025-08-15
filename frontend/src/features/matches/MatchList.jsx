import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchMatches } from './matchesSlice'
import { Calendar, Clock, Users, Trophy } from 'lucide-react'
import { format } from 'date-fns'

const MatchList = () => {
  const dispatch = useDispatch()
  const { matches, isLoading, pagination } = useSelector((state) => state.matches)
  
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
  })

  useEffect(() => {
    dispatch(fetchMatches(filters))
  }, [dispatch, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'badge-info',
      live: 'badge-success',
      completed: 'badge-warning',
      cancelled: 'badge-danger',
    }
    
    return (
      <span className={`badge ${statusClasses[status] || 'badge-info'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading && matches.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
        <p className="mt-2 text-gray-600">
          Follow live matches and view results
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-6">
        {matches.map((match) => (
          <div key={match._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">
                    {format(new Date(match.scheduledTime), 'MMM dd')}
                  </div>
                  <div className="font-medium">
                    {format(new Date(match.scheduledTime), 'HH:mm')}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{match.team1?.name || 'TBD'}</div>
                        <div className="text-sm text-gray-500">
                          {match.team1?.members?.length || 0} players
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {match.score?.team1 || 0} - {match.score?.team2 || 0}
                        </div>
                        {match.status === 'live' && (
                          <div className="text-sm text-red-500 animate-pulse">LIVE</div>
                        )}
                      </div>
                      
                      <div className="text-left">
                        <div className="font-medium">{match.team2?.name || 'TBD'}</div>
                        <div className="text-sm text-gray-500">
                          {match.team2?.members?.length || 0} players
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      {match.tournament?.name}
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Round {match.round}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {getStatusBadge(match.status)}
                
                <Link
                  to={`/matches/${match._id}`}
                  className="btn btn-primary"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && !isLoading && (
        <div className="card text-center py-12">
          <div className="text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p>Check back later for upcoming matches.</p>
          </div>
        </div>
      )}

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

export default MatchList
