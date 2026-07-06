/**
 * App.jsx — Root component for AI Co-Founder Team frontend.
 *
 * Layout:
 *  AnimatedBackground (fixed)
 *  Navbar (fixed top)
 *  Main scroll area:
 *    Hero / InputBar
 *    AgentGrid        (visible when streaming/done)
 *    CritiqueThread   (visible when round2 data exists)
 *    ScoreRadar       (visible when score exists)
 *    WireframePreview (visible when done)
 *    ExportButtons    (visible when done)
 *    Footer
 *  LoadingOverlay (portal-like fixed overlay)
 *  Toaster
 */

import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

import AnimatedBackground  from './components/AnimatedBackground'
import Navbar              from './components/Navbar'
import InputBar            from './components/InputBar'
import AgentGrid           from './components/AgentGrid'
import CritiqueThread      from './components/CritiqueThread'
import ScoreRadar          from './components/ScoreRadar'
import WireframePreview    from './components/WireframePreview'
import ExportButtons       from './components/ExportButtons'
import LoadingOverlay      from './components/LoadingOverlay'
import StreamProgressBar   from './components/StreamProgressBar'
import Footer              from './components/Footer'
import { useSSE }          from './hooks/useSSE'

/** Section wrapper with scroll-triggered fade-in */
function Section({ children, id, className = '' }) {
  return (
    <section
      id={id}
      className={`w-full ${className}`}
    >
      {children}
    </section>
  )
}

export default function App() {
  const { state, startStream, reset } = useSSE()
  const resultsRef = useRef(null)
  const scoreRef   = useRef(null)

  const { status, data, progress, agentOrder, sessionId } = state

  const isStreaming = status === 'streaming'
  const isDone      = status === 'done'
  const isActive    = isStreaming || isDone

  // Auto-scroll to results when agents start appearing
  useEffect(() => {
    if (isActive && resultsRef.current) {
      const delay = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 400)
      return () => clearTimeout(delay)
    }
  }, [isActive])

  // Auto-scroll to score when it appears
  useEffect(() => {
    if (data?.startup_score && scoreRef.current) {
      const delay = setTimeout(() => {
        scoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(delay)
    }
  }, [data?.startup_score])

  const handleSubmit = useCallback((idea) => {
    // Try live backend first; falls back to demo if unavailable
    startStream(idea, false)
  }, [startStream])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  // Compute done agents for loading overlay
  const doneAgents = agentOrder.filter((id) => {
    return data?.round1?.[id] && !data.round1[id]._streaming
  })

  return (
    <>
      {/* ── Top stream progress bar (Linear-style) ─────────────────── */}
      <StreamProgressBar visible={isStreaming} progress={progress} />

      {/* ── Fixed background ───────────────────────────────────────── */}
      <AnimatedBackground />

      {/* ── Toaster notifications ───────────────────────────────────── */}
      <Toaster
        position="bottom-right"
        gutter={12}
        containerStyle={{ bottom: 24, right: 24 }}
        toastOptions={{ duration: 4000 }}
      />

      {/* ── Loading overlay ─────────────────────────────────────────── */}
      <LoadingOverlay
        visible={isStreaming}
        progress={progress}
        doneAgents={doneAgents}
      />

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="relative z-10 min-h-screen">

        {/* Hero section */}
        <Section id="hero" className="pt-32 pb-16 flex flex-col items-center gap-8">
          <InputBar
            onSubmit={handleSubmit}
            isLoading={isStreaming}
            onReset={handleReset}
          />

          {/* Scroll cue arrow — only when idle */}
          <AnimatePresence>
            {!isActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col items-center gap-2 mt-8"
              >
                <HeroStats />
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Results sections — revealed progressively */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-16 pb-8"
            >
              {/* Agent grid */}
              <Section id="agents">
                <AgentGrid
                  data={data}
                  agentOrder={agentOrder}
                  status={status}
                />
              </Section>

              {/* Critique thread */}
              {data?.round2_critique && (
                <Section id="critique">
                  <CritiqueThread critique={data.round2_critique} />
                </Section>
              )}

              {/* Score radar */}
              {data?.startup_score && (
                <Section id="score" className="scroll-mt-8">
                  <div ref={scoreRef}>
                    <ScoreRadar scores={data.startup_score} />
                  </div>
                </Section>
              )}

              {/* Wireframe preview */}
              <Section id="wireframe">
                <WireframePreview
                  sessionId={sessionId}
                  visible={isDone}
                />
              </Section>

              {/* Export buttons */}
              <Section id="export">
                <ExportButtons
                  sessionId={sessionId}
                  visible={isDone}
                />
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <Footer />
      </main>
    </>
  )
}

/* ── Hero stats bar — shown on idle ─────────────────────────────── */
function HeroStats() {
  const stats = [
    { label: 'AI Agents',       value: '6' },
    { label: 'Debate Rounds',   value: '3' },
    { label: 'Artifacts',       value: '3' },
    { label: 'Score Dimensions',value: '6' },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 + i * 0.08 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/[0.07]"
        >
          <span className="text-white font-bold text-sm">{s.value}</span>
          <span className="text-white/35 text-xs">{s.label}</span>
        </motion.div>
      ))}
    </div>
  )
}
