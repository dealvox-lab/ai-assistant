const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface CreateSessionResponse {
  sessionId: string
  audioWsUrl: string
  eventsWsUrl: string
  token: string
}

export interface Session {
  id: string
  createdAt: string
  transcript: any[]
  suggestions: any[]
}

class APIClient {
  private token: string = ''

  setToken(token: string) {
    this.token = token
  }

  private async fetch(path: string, options?: RequestInit) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options?.headers,
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  async createSession(): Promise<CreateSessionResponse> {
    return this.fetch('/v1/sessions', {
      method: 'POST',
    })
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.fetch(`/v1/sessions/${sessionId}`)
  }

  async uploadDocument(file: File): Promise<{ success: boolean; documentId: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/v1/kb/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload document')
    }

    return response.json()
  }
}

export const apiClient = new APIClient()
