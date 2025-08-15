import { io } from 'socket.io-client'
import { toast } from 'react-toastify'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(token) {
    if (this.socket?.connected) return

    this.socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      console.log('Socket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error('Connection error')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  joinTournament(tournamentId) {
    if (this.socket) {
      this.socket.emit('join-tournament', tournamentId)
    }
  }

  leaveTournament(tournamentId) {
    if (this.socket) {
      this.socket.emit('leave-tournament', tournamentId)
    }
  }

  onMatchUpdate(callback) {
    if (this.socket) {
      this.socket.on('match-updated', callback)
    }
  }

  onTournamentUpdate(callback) {
    if (this.socket) {
      this.socket.on('tournament-updated', callback)
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback)
    }
  }

  sendChatMessage(tournamentId, message) {
    if (this.socket) {
      this.socket.emit('chat-message', { tournamentId, message })
    }
  }

  onChatMessage(callback) {
    if (this.socket) {
      this.socket.on('chat-message', callback)
    }
  }
}

export default new SocketService()
