# Interview Assistant - Local Helper

Cross-platform audio capture helper that runs locally and streams audio to the backend.

## Features

- Captures microphone input
- Captures system audio (loopback)
- Runs in system tray (no UI needed)
- HTTP control API on localhost:17777
- WebSocket streaming to backend

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Building

```bash
# Build TypeScript
npm run build

# Package for your platform
npm run package:mac   # macOS
npm run package:win   # Windows
npm run package:linux # Linux
```

## Platform-Specific Requirements

### macOS
- Install SoX: `brew install sox`
- Grant microphone permissions when prompted
- For system audio capture, install BlackHole: `brew install blackhole-2ch`

### Windows
- Install FFmpeg: Download from ffmpeg.org
- Grant microphone permissions in Windows Settings

### Linux
- Install PulseAudio: `sudo apt-get install pulseaudio-utils`
- Or PipeWire for newer distributions

## API Endpoints

All endpoints run on `http://127.0.0.1:17777`

- `GET /health` - Health check
- `GET /devices` - List audio devices
- `POST /start` - Start audio streaming
- `POST /stop` - Stop audio streaming

## Environment Variables

- `API_URL` - Backend WebSocket URL (default: `ws://localhost:3001`)
