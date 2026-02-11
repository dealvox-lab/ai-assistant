'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session'
import { apiClient } from '@/lib/api-client'
import { helperClient } from '@/lib/helper-client'
import { realtimeClient } from '@/lib/realtime-client'
import { Play, Square, Upload, ExternalLink } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { sessionId, isStreaming, setSessionId, setStreaming, clearSession, transcript } = useSessionStore()
  const [helperStatus, setHelperStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check helper health on mount
  useEffect(() => {
    const checkHelper = async () => {
      const status = await helperClient.checkHealth()
      setHelperStatus(status)
    }
    checkHelper()
    const interval = setInterval(checkHelper, 5000)
    return () => clearInterval(interval)
  }, [])

  const startSession = async () => {
    setIsLoading(true)
    try {
      // Create session on backend
      const session = await apiClient.createSession()
      setSessionId(session.sessionId)
      apiClient.setToken(session.token)

      // Connect to realtime events
      realtimeClient.connect(session.sessionId, session.token)

      // Start audio streaming via helper
      const success = await helperClient.startStreaming(session.sessionId, session.token)
      
      if (success) {
        setStreaming(true)
        // Open overlay in new window
        window.open('/overlay', 'overlay', 'width=400,height=600,left=100,top=100')
      } else {
        throw new Error('Failed to start audio streaming')
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start session. Make sure the local helper is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopSession = async () => {
    setIsLoading(true)
    try {
      await helperClient.stopStreaming()
      realtimeClient.disconnect()
      setStreaming(false)
    } catch (error) {
      console.error('Failed to stop session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await apiClient.uploadDocument(file)
      alert('Document uploaded successfully')
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Interview Assistant</h1>
          <p className="text-gray-400">Real-time coaching for your interviews</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Helper Status */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Local Helper</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${helperStatus?.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {helperStatus?.healthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Session Status */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Session</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="font-medium">
                {isStreaming ? 'Live' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Transcript Count */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Transcript</div>
            <div className="font-medium">{transcript.length} segments</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Session Control</h2>
          
          <div className="flex gap-4 mb-6">
            {!isStreaming ? (
              <button
                onClick={startSession}
                disabled={isLoading || !helperStatus?.healthy}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition"
              >
                <Play size={20} />
                Start Interview Session
              </button>
            ) : (
              <button
                onClick={stopSession}
                disabled={isLoading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition"
              >
                <Square size={20} />
                Stop Session
              </button>
            )}

            {isStreaming && (
              <button
                onClick={() => window.open('/overlay', 'overlay', 'width=400,height=600,left=100,top=100')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
              >
                <ExternalLink size={20} />
                Open Overlay
              </button>
            )}
          </div>

          {/* Document Upload */}
          <div className="border-t border-gray-700 pt-4">
            <label className="block text-sm text-gray-400 mb-2">Upload Prep Materials (CV, JD, Notes)</label>
            <input
              type="file"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.txt"
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Live Transcript</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transcript.map((seg) => (
                <div key={seg.id} className={`p-3 rounded ${seg.isFinal ? 'bg-gray-700' : 'bg-gray-700/50'}`}>
                  <div className="flex items-start gap-3">
                    {seg.speaker && (
                      <span className="text-xs font-medium text-blue-400 mt-0.5">
                        {seg.speaker}:
                      </span>
                    )}
                    <span className={`text-sm ${seg.isFinal ? 'text-white' : 'text-gray-400 italic'}`}>
                      {seg.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
