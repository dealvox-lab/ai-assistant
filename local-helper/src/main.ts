import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { ControlServer } from './control-server'
import { AudioCapture } from './audio-capture'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let controlServer: ControlServer
let audioCapture: AudioCapture

function createTray() {
  // Create a simple tray icon (you'll need to add an actual icon file)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Interview Assistant Helper',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Status: Ready',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Interview Assistant Helper')
}

function updateTrayStatus(status: string) {
  if (!tray) return
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Interview Assistant Helper',
      enabled: false
    },
    { type: 'separator' },
    {
      label: `Status: ${status}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
}

app.whenReady().then(async () => {
  // Create tray icon
  createTray()
  
  // Initialize audio capture
  audioCapture = new AudioCapture()
  
  // Start control server on localhost:17777
  controlServer = new ControlServer(17777, audioCapture, updateTrayStatus)
  await controlServer.start()
  
  console.log('Interview Assistant Helper running on http://127.0.0.1:17777')
  updateTrayStatus('Ready')
  
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})

app.on('window-all-closed', (e: Event) => {
  // Prevent app from quitting when windows are closed
  e.preventDefault()
})

app.on('before-quit', () => {
  controlServer?.stop()
  audioCapture?.stop()
})
