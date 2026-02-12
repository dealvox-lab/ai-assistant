import { io, Socket } from 'socket.io-client'
import { useSessionStore, TranscriptSegment, CoachSuggestion } from '@/store/session'

class RealtimeClient {
  private socket: Socket | null = null
  private apiUrl: string

  constructor(apiUrl: string = 'http://localhost:3001') {
    this.apiUrl = apiUrl
  }

  connect(sessionId: string, token: string) {
    if (this.socket?.connected) {
      this.disconnect()
    }

    this.socket = io(`${this.apiUrl}/events/${sessionId}`, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Connected to realtime API')
    })

    this.socket.on('transcript.partial', (data: TranscriptSegment) => {
      useSessionStore.getState().addTranscript({
        ...data,
        isFinal: false,
      })
    })

    this.socket.on('transcript.final', (data: TranscriptSegment) => {
      const { updateTranscript, addTranscript, transcript } = useSessionStore.getState()
      
      // Try to update existing partial, otherwise add new
      const existing = transcript.find(t => t.id === data.id)
      if (existing) {
        updateTranscript(data.id, { ...data, isFinal: true })
      } else {
        addTranscript({ ...data, isFinal: true })
      }
    })

    this.socket.on('coach.question_detected', (data: { text: string }) => {
      console.log('Question detected:', data.text)
    })

    this.socket.on('coach.suggestion', (data: CoachSuggestion) => {
      useSessionStore.getState().addSuggestion(data)
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from realtime API')
    })

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const realtimeClient = new RealtimeClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
)
