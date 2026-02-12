import express, { Express, Request, Response } from 'express'
import { Server } from 'http'
import { AudioCapture } from './audio-capture'

export class ControlServer {
  private app: Express
  private server: Server | null = null
  private port: number
  private audioCapture: AudioCapture
  private updateStatus: (status: string) => void

  constructor(port: number, audioCapture: AudioCapture, updateStatus: (status: string) => void) {
    this.port = port
    this.audioCapture = audioCapture
    this.updateStatus = updateStatus
    this.app = express()
    this.setupRoutes()
  }

  private setupRoutes() {
    this.app.use(express.json())
    
    // Enable CORS for localhost web app
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
      }
      next()
    })

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        healthy: true,
        version: '1.0.0',
        isStreaming: this.audioCapture.isStreaming()
      })
    })

    // Get available audio devices
    this.app.get('/devices', async (req: Request, res: Response) => {
      try {
        const devices = await this.audioCapture.getDevices()
        res.json(devices)
      } catch (error) {
        res.status(500).json({ error: 'Failed to get devices' })
      }
    })

    // Start streaming
    this.app.post('/start', async (req: Request, res: Response) => {
      try {
        const { sessionId, token } = req.body
        
        if (!sessionId || !token) {
          return res.status(400).json({ error: 'Missing sessionId or token' })
        }

        await this.audioCapture.start(sessionId, token)
        this.updateStatus('Streaming')
        
        res.json({ success: true })
      } catch (error) {
        console.error('Failed to start streaming:', error)
        res.status(500).json({ error: 'Failed to start streaming' })
      }
    })

    // Stop streaming
    this.app.post('/stop', async (req: Request, res: Response) => {
      try {
        await this.audioCapture.stop()
        this.updateStatus('Ready')
        
        res.json({ success: true })
      } catch (error) {
        console.error('Failed to stop streaming:', error)
        res.status(500).json({ error: 'Failed to stop streaming' })
      }
    })
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '127.0.0.1', () => {
        console.log(`Control server listening on http://127.0.0.1:${this.port}`)
        resolve()
      })
    })
  }

  stop(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}
