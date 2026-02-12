const HELPER_URL = 'http://127.0.0.1:17777'

export interface HelperStatus {
  healthy: boolean
  version: string
  isStreaming: boolean
}

export interface AudioDevice {
  id: string
  name: string
  type: 'input' | 'output'
}

class HelperClient {
  async checkHealth(): Promise<HelperStatus | null> {
    try {
      const response = await fetch(`${HELPER_URL}/health`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Helper not available:', error)
      return null
    }
  }

  async getDevices(): Promise<AudioDevice[]> {
    try {
      const response = await fetch(`${HELPER_URL}/devices`)
      if (!response.ok) throw new Error('Failed to get devices')
      return await response.json()
    } catch (error) {
      console.error('Failed to get devices:', error)
      return []
    }
  }

  async startStreaming(sessionId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${HELPER_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, token }),
      })
      return response.ok
    } catch (error) {
      console.error('Failed to start streaming:', error)
      return false
    }
  }

  async stopStreaming(): Promise<boolean> {
    try {
      const response = await fetch(`${HELPER_URL}/stop`, {
        method: 'POST',
      })
      return response.ok
    } catch (error) {
      console.error('Failed to stop streaming:', error)
      return false
    }
  }
}

export const helperClient = new HelperClient()
