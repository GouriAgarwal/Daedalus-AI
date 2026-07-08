/**
 * useSSE — Custom hook to consume a Server-Sent Events (SSE) stream
 * from the /build-startup endpoint. Incrementally updates state
 * as JSON chunks arrive, matching the Output Contract.
 *
 * States:
 *  - idle:      No request started
 *  - streaming: SSE connection open, receiving events
 *  - done:      Stream completed successfully
 *  - error:     An error occurred
 */

import { useState, useRef, useCallback } from 'react'
import { API_BASE, FALLBACK_DATA } from '../utils/constants'
import { sleep } from '../utils/helpers'

/**
 * @typedef {Object} SSEState
 * @property {'idle'|'streaming'|'done'|'error'} status
 * @property {Object|null} data      - Accumulated pipeline data
 * @property {string|null} error     - Error message if status === 'error'
 * @property {number} progress       - 0–100 progress percentage
 * @property {string[]} agentOrder   - Order in which agents completed
 * @property {string|null} sessionId - Session ID from the completed SSE stream;
 *                                     used as ?id= for all /export/* calls
 */

const INITIAL_STATE = {
  status: 'idle',
  data: null,
  error: null,
  progress: 0,
  agentOrder: [],
  /** Session ID returned by the backend in the final SSE event */
  sessionId: null,
}

export function useSSE() {
  const [state, setState] = useState(INITIAL_STATE)
  const eventSourceRef = useRef(null)
  const abortControllerRef = useRef(null)

  /** Reset everything back to idle */
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState(INITIAL_STATE)
  }, [])

  /**
   * Start streaming a startup idea analysis.
   * Falls back to FALLBACK_DATA if the backend is unreachable.
   * @param {string} idea - The startup idea text
   * @param {boolean} [useFallback=false] - Force use of fallback data
   */
  const startStream = useCallback(async (idea, useFallback = false) => {
    reset()

    setState((s) => ({ ...s, status: 'streaming', progress: 5, data: null }))

    // ── FALLBACK MODE: simulate streaming with local data ─────────────
    if (useFallback) {
      await simulateFallback(idea)
      return
    }

    // ── LIVE MODE: connect to real SSE endpoint ───────────────────────
    try {
      abortControllerRef.current = new AbortController()

      // Use fetch with POST + ReadableStream to handle SSE over POST
      const response = await fetch(`${API_BASE}/build-startup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ idea }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedData = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete last line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') {
            // Stream complete — mark done (sessionId already set from last chunk)
            setState((s) => ({ ...s, status: 'done', progress: 100 }))
            return
          }

          try {
            const chunk = JSON.parse(raw)
            accumulatedData = mergeChunk(accumulatedData, chunk)

            // Extract session_id whenever it appears in any chunk.
            // The backend may send it in the final summary chunk or a dedicated
            // chunk e.g. { "session_id": "abc-123" } just before [DONE].
            const sessionId = chunk.session_id ?? null

            setState((s) => {
              const agentOrder = updateAgentOrder(s.agentOrder, chunk)
              const progress = estimateProgress(accumulatedData)
              return {
                ...s,
                data: { ...accumulatedData },
                agentOrder,
                progress,
                // Preserve existing sessionId if this chunk doesn't carry one
                sessionId: sessionId ?? s.sessionId,
              }
            })
          } catch {
            // Non-JSON line (e.g. comments) — skip
          }
        }
      }

      setState((s) => ({ ...s, status: 'done', progress: 100 }))
    } catch (err) {
      if (err.name === 'AbortError') return // User cancelled

      console.warn('SSE failed, switching to fallback:', err.message)
      // Auto-fallback if the backend is down
      await simulateFallback(idea)
    }
  }, [reset])

  // ── FALLBACK SIMULATOR ──────────────────────────────────────────────
  /**
   * Simulates the SSE stream using FALLBACK_DATA with realistic delays,
   * so the demo experience looks live even without a backend.
   */
  const simulateFallback = async (_idea) => {
    const data = FALLBACK_DATA
    const agentOrder = []

    const emit = (partial, progress) => {
      setState((s) => ({
        ...s,
        data: partial,
        agentOrder: [...agentOrder],
        progress,
      }))
    }

    // Round 1: agents stream one by one
    const round1Agents = ['pm', 'ui', 'backend', 'marketing']
    const partial = { domain: data.domain, round1: {} }

    for (let i = 0; i < round1Agents.length; i++) {
      const key = round1Agents[i]
      await sleep(800 + Math.random() * 400)
      partial.round1[key] = { _streaming: true }
      agentOrder.push(key)
      emit({ ...partial }, 10 + i * 12)

      // Simulate typing delay
      await sleep(1200 + Math.random() * 600)
      partial.round1[key] = data.round1[key]
      emit({ ...partial }, 20 + i * 12)
    }

    // Round 2: investor + skeptic critique
    await sleep(700)
    emit({ ...partial, round2_critique: { investor_concerns: [], skeptic_flags: [], revisions: {} } }, 72)
    await sleep(1000)
    emit({ ...partial, round2_critique: data.round2_critique }, 84)

    // Startup score
    await sleep(600)
    emit({ ...partial, round2_critique: data.round2_critique, startup_score: data.startup_score }, 96)

    await sleep(400)
    // In fallback/demo mode there is no real backend, so we generate a
    // deterministic placeholder session ID so the UI renders export buttons
    // without errors (downloads will show the "connect backend" toast).
    // The "demo:" prefix lets consumers (ExportButtons, WireframePreview)
    // distinguish this from a real backend-issued UUID.
    const demoSessionId = 'demo:' + Date.now()
    setState((s) => ({
      ...s,
      data: { ...partial, round2_critique: data.round2_critique, startup_score: data.startup_score },
      status: 'done',
      progress: 100,
      sessionId: demoSessionId,
    }))
  }

  return { state, startStream, reset }
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Deep-merge an SSE chunk into the accumulated data object.
 */
function mergeChunk(existing, chunk) {
  const result = { ...existing }
  for (const [key, value] of Object.entries(chunk)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { ...(result[key] || {}), ...value }
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Update the ordered list of agents that have produced output.
 */
function updateAgentOrder(existing, chunk) {
  const order = [...existing]
  const round1Keys = Object.keys(chunk?.round1 || {})
  for (const key of round1Keys) {
    if (!order.includes(key)) order.push(key)
  }
  return order
}

/**
 * Estimate progress 0–100 from what data has arrived.
 */
function estimateProgress(data) {
  let score = 5
  const r1 = data?.round1 || {}
  const agents = ['pm', 'ui', 'backend', 'marketing']
  for (const a of agents) {
    if (r1[a] && !r1[a]._streaming) score += 16
    else if (r1[a]?._streaming) score += 8
  }
  if (data?.round2_critique) score += 10
  if (data?.startup_score) score += 5
  return Math.min(score, 98)
}
