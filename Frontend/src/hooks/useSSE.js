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
import { API_BASE } from '../utils/constants'
import { tailorFallbackForIdea } from '../utils/tailorFallback'
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
  sessionId: null,
}

export function useSSE() {
  const [state, setState] = useState(INITIAL_STATE)
  const abortControllerRef = useRef(null)
  // Track whether the current stream was aborted so simulateFallback can bail early
  const abortedRef = useRef(false)

  /** Reset everything back to idle */
  const reset = useCallback(() => {
    abortedRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState(INITIAL_STATE)
  }, [])

  /**
   * Start streaming a startup idea analysis.
   * Falls back to FALLBACK_DATA if the backend is unreachable.
   * @param {string} idea - The startup idea text
   */
  const startStream = useCallback(async (idea) => {
    // Cancel any in-flight request before starting a new one
    abortedRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Reset abort flag for new run
    abortedRef.current = false

    setState({ ...INITIAL_STATE, status: 'streaming', progress: 5 })

    // ── LIVE MODE: connect to real SSE endpoint ───────────────────────
    try {
      const controller = new AbortController()
      abortControllerRef.current = controller

      const response = await fetch(`${API_BASE}/build-startup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ idea }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedData = { idea }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (abortedRef.current) return

        buffer += decoder.decode(value, { stream: true })

        // Split on SSE event boundary (double newline), keep incomplete last chunk
        const events = buffer.split('\n\n')
        buffer = events.pop() // last element is always incomplete or empty

        for (const event of events) {
          // Find the data: line within the event (ignores event:, id:, retry: lines)
          const dataLine = event.split('\n').find((l) => l.startsWith('data: '))
          if (!dataLine) continue
          const raw = dataLine.slice(6).trim()

          if (raw === '[DONE]') {
            // Stream complete — sessionId already captured from last chunk
            setState((s) => ({ ...s, status: 'done', progress: 100 }))
            return
          }

          try {
            const chunk = JSON.parse(raw)
            accumulatedData = mergeChunk(accumulatedData, chunk)

            // Extract session_id whenever it appears in any chunk.
            // Backend may send it in the final summary chunk or as a
            // dedicated chunk: { "session_id": "abc-123" } before [DONE].
            const incomingSessionId = chunk.session_id ?? null

            setState((s) => ({
              ...s,
              data: { ...accumulatedData },
              agentOrder: updateAgentOrder(s.agentOrder, chunk),
              progress: estimateProgress(accumulatedData),
              sessionId: incomingSessionId ?? s.sessionId,
            }))
          } catch {
            // Non-JSON SSE comment line — skip silently
          }
        }
      }

      setState((s) => ({ ...s, status: 'done', progress: 100 }))
    } catch (err) {
      if (err.name === 'AbortError' || abortedRef.current) return

      console.warn('SSE failed — switching to demo fallback:', err.message)
      // Auto-fallback when backend is unreachable
      await runFallback(abortedRef, setState, idea)
    }
  }, []) // no dep on `reset` — we inline the abort logic above

  return { state, startStream, reset }
}

// ── Fallback Simulator ────────────────────────────────────────────────────────
/**
 * Simulates the SSE stream with FALLBACK_DATA and realistic per-agent delays
 * so the demo works perfectly without a live backend.
 *
 * Accepts abortedRef so it can bail out early if reset() is called mid-stream.
 */
async function runFallback(abortedRef, setState, idea) {
  const data = tailorFallbackForIdea(idea)
  const agentOrder = []

  const emit = (partial, progress) => {
    if (abortedRef.current) return
    setState((s) => ({
      ...s,
      data: { ...partial },
      agentOrder: [...agentOrder],
      progress,
    }))
  }

  // Round 1 — agents stream one by one
  const round1Agents = ['pm', 'ui', 'backend', 'marketing']
  const partial = { idea, domain: data.domain, round1: {} }

  for (let i = 0; i < round1Agents.length; i++) {
    if (abortedRef.current) return
    const key = round1Agents[i]

    await sleep(700 + Math.random() * 300)
    if (abortedRef.current) return

    partial.round1 = { ...partial.round1, [key]: { _streaming: true } }
    agentOrder.push(key)
    emit({ ...partial, round1: { ...partial.round1 } }, 10 + i * 12)

    await sleep(1000 + Math.random() * 500)
    if (abortedRef.current) return

    partial.round1 = { ...partial.round1, [key]: data.round1[key] }
    emit({ ...partial, round1: { ...partial.round1 } }, 22 + i * 12)
  }

  // Round 2 — Investor + Skeptic critique
  await sleep(600)
  if (abortedRef.current) return
  emit({ ...partial, round2_critique: { investor_concerns: [], skeptic_flags: [], revisions: {} } }, 74)

  await sleep(900)
  if (abortedRef.current) return
  emit({ ...partial, round2_critique: data.round2_critique }, 86)

  // Startup score
  await sleep(500)
  if (abortedRef.current) return
  emit({ ...partial, round2_critique: data.round2_critique, startup_score: data.startup_score }, 96)

  await sleep(300)
  if (abortedRef.current) return

  // The "demo:" prefix lets ExportButtons / WireframePreview know this is
  // a local placeholder (not a real backend-issued session UUID).
  const demoSessionId = 'demo:' + Date.now()

  setState((s) => ({
    ...s,
    data: {
      ...partial,
      idea,
      round2_critique: data.round2_critique,
      startup_score: data.startup_score,
    },
    status: 'done',
    progress: 100,
    sessionId: demoSessionId,
  }))
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Deep-merge an SSE chunk into the accumulated data object. */
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

/** Update the ordered list of agents that have produced output. */
function updateAgentOrder(existing, chunk) {
  const order = [...existing]
  for (const key of Object.keys(chunk?.round1 || {})) {
    if (!order.includes(key)) order.push(key)
  }
  return order
}

/** Estimate 0–100 progress from how much data has arrived. */
function estimateProgress(data) {
  let score = 5
  const r1 = data?.round1 || {}
  for (const a of ['pm', 'ui', 'backend', 'marketing']) {
    if (r1[a] && !r1[a]._streaming) score += 16
    else if (r1[a]?._streaming) score += 8
  }
  if (data?.round2_critique) score += 10
  if (data?.startup_score) score += 5
  return Math.min(score, 98)
}
