'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/store/session'
import { Minimize2, X, Volume2, VolumeX } from 'lucide-react'

export default function OverlayPage() {
  const { currentSuggestion, isStreaming } = useSessionStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Request picture-in-picture on mount for always-on-top behavior
  useEffect(() => {
    const enablePiP = async () => {
      try {
        const video = document.createElement('video')
        video.muted = true
        video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true })
        await video.play()
        
        if (document.pictureInPictureEnabled) {
          await video.requestPictureInPicture()
        }
      } catch (err) {
        console.log('PiP not available, using regular window')
      }
    }
    
    // enablePiP() // Uncomment to enable PiP mode
  }, [])

  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Assistant</h1>
          <p className="text-gray-400">Start a session to begin coaching</p>
        </div>
      </div>
    )
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-4 py-2 text-white hover:bg-gray-800 rounded-lg flex items-center gap-2"
        >
          <Volume2 size={16} />
          <span className="text-sm">Buy a ticket</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Live Coaching</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-gray-800 rounded"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-gray-800 rounded"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {currentSuggestion ? (
          <div className="space-y-4">
            {/* Question */}
            <div>
              <div className="text-xs text-gray-400 mb-1">Question Detected</div>
              <div className="text-sm font-medium text-blue-300">
                {currentSuggestion.question}
              </div>
            </div>

            {/* Suggested Answer */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Suggested Response</div>
              <ul className="space-y-1.5 text-sm">
                {currentSuggestion.suggestedAnswer.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* STAR Framework (if behavioral) */}
            {currentSuggestion.starFraming && (
              <div>
                <div className="text-xs text-gray-400 mb-2">STAR Framework</div>
                <div className="space-y-1 text-xs">
                  <div><span className="text-yellow-400">S:</span> {currentSuggestion.starFraming.situation}</div>
                  <div><span className="text-yellow-400">T:</span> {currentSuggestion.starFraming.task}</div>
                  <div><span className="text-yellow-400">A:</span> {currentSuggestion.starFraming.action}</div>
                  <div><span className="text-yellow-400">R:</span> {currentSuggestion.starFraming.result}</div>
                </div>
              </div>
            )}

            {/* Follow-ups */}
            {currentSuggestion.followUps.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Potential Follow-ups</div>
                <ul className="space-y-1 text-xs">
                  {currentSuggestion.followUps.map((q, idx) => (
                    <li key={idx} className="text-gray-300">→ {q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {currentSuggestion.risks.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Avoid Mentioning</div>
                <ul className="space-y-1 text-xs text-red-300">
                  {currentSuggestion.risks.map((risk, idx) => (
                    <li key={idx}>⚠ {risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            Listening for questions...
          </div>
        )}
      </div>
    </div>
  )
}
