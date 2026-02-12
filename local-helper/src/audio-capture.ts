import { spawn, ChildProcess } from 'child_process'
import WebSocket from 'ws'
import os from 'os'

export interface AudioDevice {
  id: string
  name: string
  type: 'input' | 'output'
}

export class AudioCapture {
  private ws: WebSocket | null = null
  private recordProcess: ChildProcess | null = null
  private streaming: boolean = false
  private sessionId: string | null = null
  private apiUrl: string = process.env.API_URL || 'ws://localhost:3001'

  isStreaming(): boolean {
    return this.streaming
  }

  async getDevices(): Promise<AudioDevice[]> {
    const platform = os.platform()
    
    // Placeholder - in production, use platform-specific APIs
    // For macOS: use `system_profiler SPAudioDataType` or native bindings
    // For Windows: use PowerShell or native bindings
    // For Linux: use `pactl list` or native bindings
    
    return [
      { id: 'default', name: 'Default Microphone', type: 'input' },
      { id: 'system', name: 'System Audio', type: 'output' }
    ]
  }

  async start(sessionId: string, token: string): Promise<void> {
    if (this.streaming) {
      throw new Error('Already streaming')
    }

    this.sessionId = sessionId
    
    // Connect to backend WebSocket
    const wsUrl = `${this.apiUrl}/v1/audio/${sessionId}?token=${token}`
    this.ws = new WebSocket(wsUrl)

    await new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket not created'))

      this.ws.on('open', () => {
        console.log('Connected to audio WebSocket')
        resolve()
      })

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })

      this.ws.on('close', () => {
        console.log('WebSocket closed')
        this.stop()
      })
    })

    // Start audio capture based on platform
    await this.startPlatformCapture()
    
    this.streaming = true
  }

  private async startPlatformCapture(): Promise<void> {
    const platform = os.platform()

    if (platform === 'darwin') {
      await this.startMacOSCapture()
    } else if (platform === 'win32') {
      await this.startWindowsCapture()
    } else if (platform === 'linux') {
      await this.startLinuxCapture()
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  private async startMacOSCapture(): Promise<void> {
    // Using SoX for simplicity - in production use ScreenCaptureKit + CoreAudio
    // Install: brew install sox
    
    this.recordProcess = spawn('rec', [
      '-t', 'raw',           // Raw format
      '-e', 'signed-integer', // Encoding
      '-b', '16',            // 16-bit
      '-c', '1',             // Mono
      '-r', '16000',         // 16kHz sample rate
      '-'                    // Output to stdout
    ])

    this.recordProcess.stdout?.on('data', (chunk: Buffer) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(chunk)
      }
    })

    this.recordProcess.stderr?.on('data', (data) => {
      console.error('Recording error:', data.toString())
    })

    this.recordProcess.on('close', (code) => {
      console.log(`Recording process exited with code ${code}`)
    })
  }

  private async startWindowsCapture(): Promise<void> {
    // For Windows, use WASAPI loopback
    // In production: use node-addon-api with WASAPI or external tool like ffmpeg
    
    // Placeholder using ffmpeg (needs to be installed)
    this.recordProcess = spawn('ffmpeg', [
      '-f', 'dshow',
      '-i', 'audio=Microphone',  // Adjust device name
      '-f', 's16le',
      '-ar', '16000',
      '-ac', '1',
      'pipe:1'
    ])

    this.recordProcess.stdout?.on('data', (chunk: Buffer) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(chunk)
      }
    })

    this.recordProcess.stderr?.on('data', (data) => {
      // ffmpeg logs to stderr
      console.log('FFmpeg:', data.toString())
    })
  }

  private async startLinuxCapture(): Promise<void> {
    // For Linux, use PulseAudio/PipeWire
    // Using parec (PulseAudio) for simplicity
    
    this.recordProcess = spawn('parec', [
      '--format=s16le',
      '--rate=16000',
      '--channels=1'
    ])

    this.recordProcess.stdout?.on('data', (chunk: Buffer) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(chunk)
      }
    })

    this.recordProcess.stderr?.on('data', (data) => {
      console.error('Recording error:', data.toString())
    })
  }

  async stop(): Promise<void> {
    this.streaming = false

    // Kill recording process
    if (this.recordProcess) {
      this.recordProcess.kill('SIGTERM')
      this.recordProcess = null
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.sessionId = null
  }
}
