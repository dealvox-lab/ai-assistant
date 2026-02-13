/**
 * Cloudflare Worker — SSE Server
 * Single table: interview_events
 * Fields: id, request_id, session_id, transcript, confidence, raw_llm, timestamp, created_at
 *
 * Each row can have BOTH transcript + raw_llm (same request_id = same chunk)
 * Worker emits two events per row when both are present.
 */

export interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

// ── CORS ──────────────────────────────────────────────────
const cors: HeadersInit = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── SSE helpers ───────────────────────────────────────────
const enc  = new TextEncoder()
const sse  = (event: string, data: unknown) =>
  enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
const ping = () => enc.encode(`: ping\n\n`)

// ── Supabase query ────────────────────────────────────────
async function query(env: Env, params: string): Promise<any[]> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/interview_events?${params}`,
    {
      headers: {
        apikey:        env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    }
  )
  if (!res.ok) return []
  return res.json()
}

// ── Emit row as SSE events ────────────────────────────────
async function emitRow(writer: WritableStreamDefaultWriter, row: any, isHistory = false) {
  if (row.transcript) {
    await writer.write(sse('transcript', {
      id:         row.id,
      requestId:  row.request_id,
      sessionId:  row.session_id,
      transcript: row.transcript,
      confidence: row.confidence,
      timestamp:  row.timestamp,
      isHistory,
    }))
  }

  if (row.raw_llm) {
    await writer.write(sse('answer', {
      id:        row.id,
      requestId: row.request_id,
      sessionId: row.session_id,
      question:  row.transcript,   // the transcript is the question context
      raw_llm:   row.raw_llm,
      timestamp: row.timestamp,
      isHistory,
    }))
  }
}

// ── Main ──────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // SSE stream: GET /stream?session=SESSION_ID
    if (url.pathname === '/stream') {
      const sessionId = url.searchParams.get('session')
      if (!sessionId) {
        return new Response('Missing ?session=', { status: 400, headers: cors })
      }

      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()

      ;(async () => {
        try {
          // 1. Announce connection
          await writer.write(sse('connected', { sessionId, ts: Date.now() }))

          // 2. Load full history
          const history: any[] = await query(
            env,
            `session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc`
          )

          for (const row of history) {
            await emitRow(writer, row, true)
          }

          if (history.length > 0) {
            await writer.write(sse('history_done', { count: history.length }))
          }

          // 3. Poll for new rows using created_at cursor
          let cursor = history.length > 0
            ? history[history.length - 1].created_at
            : new Date().toISOString()

          const timer = setInterval(async () => {
            try {
              const rows: any[] = await query(
                env,
                `session_id=eq.${encodeURIComponent(sessionId)}&created_at=gt.${encodeURIComponent(cursor)}&order=created_at.asc`
              )

              for (const row of rows) {
                await emitRow(writer, row, false)
                cursor = row.created_at
              }

              await writer.write(ping())
            } catch (_) { /* swallow poll errors */ }
          }, 2000)

          // Auto-close after 4 hours
          setTimeout(async () => {
            clearInterval(timer)
            await writer.write(sse('closed', { reason: 'timeout' }))
            writer.close()
          }, 4 * 60 * 60 * 1000)

        } catch (err) {
          await writer.write(sse('error', { message: String(err) }))
          writer.close()
        }
      })()

      return new Response(readable, {
        headers: {
          ...cors,
          'Content-Type':      'text/event-stream',
          'Cache-Control':     'no-cache',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    return new Response('Not found', { status: 404, headers: cors })
  },
}
