/* src/features/matches/MatchDetail.jsx */
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import {
  fetchMatchById,
  updateMatchScore,
  clearError,
} from './matchesSlice'
import socketService from '@/services/socketService'
import {
  Users,
  Trophy,
  Clock,
  SendHorizonal,
} from 'lucide-react'

const MatchDetail = () => {
  const { id } = useParams()
  const dispatch          = useDispatch()
  const { currentMatch: match, isLoading, error } =
    useSelector((state) => state.matches)
  const { user }          = useSelector((state) => state.auth)

  /* -------------------  chat state  ------------------- */
  const [message, setMessage]   = useState('')
  const [chatLog, setChatLog]   = useState([])   // local chat buffer
  const chatEndRef              = useRef(null)
  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behaviour: 'smooth' })

  /* -------------------  load match + sockets  --------- */
  useEffect(() => {
    if (id) dispatch(fetchMatchById(id))

    /* join ws room */
    socketService.joinMatch(id)

    /* incoming live score update */
    socketService.onMatchUpdate((payload) => {
      if (payload.matchId === id) dispatch(updateMatchScore(payload.match))
    })

    /* incoming chat messages */
    socketService.onChatMessage((payload) => {
      setChatLog((prev) => [...prev, payload])
      scrollToBottom()
    })

    return () => {
      socketService.leaveMatch(id)
      socketService.offChatMessage()
      dispatch(clearError())
    }
  }, [dispatch, id])

  /* -------------------  send chat  -------------------- */
  const sendChat = () => {
    if (!message.trim()) return
    socketService.sendChatMessage(id, { sender: user?.username, message })
    setChatLog((prev) => [...prev, { sender: user?.username, message }])
    setMessage('')
    scrollToBottom()
  }

  if (isLoading || !match)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" />
      </div>
    )

  if (error)
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )

  const {
    team1,
    team2,
    score,
    status,
    round,
    scheduledTime,
    tournament,
    bestOf,
    game,
  } = match

  const statusBadge = {
    scheduled: 'badge-info',
    live: 'badge-success',
    completed: 'badge-warning',
    cancelled: 'badge-danger',
  }[status] || 'badge-info'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Match header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* teams + score */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 flex-1">
            {/* team 1 */}
            <div className="flex items-center space-x-3">
              <img
                src={team1.logo || '/team-placeholder.svg'}
                alt={team1.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{team1.name}</p>
                <p className="text-xs text-gray-500">
                  {team1.members.length} players
                </p>
              </div>
            </div>

            {/* score */}
            <div className="my-4 sm:my-0 text-center">
              <p className="text-4xl font-extrabold tracking-tight">
                {score.team1} - {score.team2}
              </p>
              <span className={`badge ${statusBadge} mt-1 capitalize`}>
                {status}
              </span>
            </div>

            {/* team 2 */}
            <div className="flex items-center space-x-3 sm:flex-row-reverse">
              <img
                src={team2.logo || '/team-placeholder.svg'}
                alt={team2.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="min-w-0 sm:text-right">
                <p className="font-semibold truncate">{team2.name}</p>
                <p className="text-xs text-gray-500">
                  {team2.members.length} players
                </p>
              </div>
            </div>
          </div>

          {/* meta */}
          <div className="grid grid-cols-2 gap-4 mt-6 lg:mt-0">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {format(new Date(scheduledTime), 'MMM dd, HH:mm')}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              Round {round} • Bo{bestOf}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Trophy className="w-4 h-4 mr-2" />
              {tournament.name}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <img src={`/games/${game}.svg`} alt={game} className="w-4 h-4 mr-2"/>
              {game.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Rosters & chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rosters */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Rosters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* team1 roster */}
            <div>
              <h4 className="font-medium mb-2">{team1.name}</h4>
              <ul className="space-y-1">
                {team1.members.map((p) => (
                  <li key={p._id} className="text-sm text-gray-700">
                    {p.username}
                  </li>
                ))}
              </ul>
            </div>
            {/* team2 roster */}
            <div>
              <h4 className="font-medium mb-2">{team2.name}</h4>
              <ul className="space-y-1">
                {team2.members.map((p) => (
                  <li key={p._id} className="text-sm text-gray-700">
                    {p.username}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Live chat */}
        <div className="card flex flex-col h-96">
          <h3 className="text-lg font-semibold mb-4">Match Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {chatLog.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium text-gray-800">{msg.sender}: </span>
                <span>{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex mt-3">
            <input
              type="text"
              placeholder="Send a message..."
              className="input flex-1 mr-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            />
            <button
              className="btn btn-primary"
              onClick={sendChat}
              disabled={!message.trim()}
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDetail
