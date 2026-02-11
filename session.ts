import { create } from 'zustand'

export interface TranscriptSegment {
  id: string
  text: string
  speaker?: 'A' | 'B'
  timestamp: number
  isFinal: boolean
}

export interface CoachSuggestion {
  id: string
  question: string
  suggestedAnswer: {
    bullets: string[]
    spokenVersion: string
  }
  followUps: string[]
  risks: string[]
  starFraming?: {
    situation: string
    task: string
    action: string
    result: string
  }
  timestamp: number
}

interface SessionState {
  sessionId: string | null
  isStreaming: boolean
  transcript: TranscriptSegment[]
  suggestions: CoachSuggestion[]
  currentSuggestion: CoachSuggestion | null
  
  setSessionId: (id: string | null) => void
  setStreaming: (streaming: boolean) => void
  addTranscript: (segment: TranscriptSegment) => void
  updateTranscript: (id: string, updates: Partial<TranscriptSegment>) => void
  addSuggestion: (suggestion: CoachSuggestion) => void
  setCurrentSuggestion: (suggestion: CoachSuggestion | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  isStreaming: false,
  transcript: [],
  suggestions: [],
  currentSuggestion: null,

  setSessionId: (id) => set({ sessionId: id }),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  addTranscript: (segment) => 
    set((state) => ({ 
      transcript: [...state.transcript, segment] 
    })),
  
  updateTranscript: (id, updates) =>
    set((state) => ({
      transcript: state.transcript.map((seg) =>
        seg.id === id ? { ...seg, ...updates } : seg
      ),
    })),
  
  addSuggestion: (suggestion) =>
    set((state) => ({
      suggestions: [...state.suggestions, suggestion],
      currentSuggestion: suggestion,
    })),
  
  setCurrentSuggestion: (suggestion) => 
    set({ currentSuggestion: suggestion }),
  
  clearSession: () => 
    set({
      sessionId: null,
      isStreaming: false,
      transcript: [],
      suggestions: [],
      currentSuggestion: null,
    }),
}))
