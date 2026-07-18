import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AGENTS } from '../utils/constants'

const TECH_LOGS = [
  "[system] Initializing multi-agent workspace...",
  "[pm] Evaluating startup idea market viability...",
  "[pm] Mapping target demographics & user segments...",
  "[pm] Scoping minimum viable product features...",
  "[ui] Choosing responsive visual brand themes...",
  "[ui] Drawing glassmorphic layout components...",
  "[ui] Mapping customer journey screen flows...",
  "[backend] Designing database schema entities...",
  "[backend] Drafting REST API endpoint signatures...",
  "[backend] Deciding deployment cloud tech stack...",
  "[marketing] Formulating TAM, SAM, SOM estimates...",
  "[marketing] Building target GTM acquisition channel map...",
  "[critique] Invoking investor risk critique review...",
  "[critique] Analyzing security and skeptic flags...",
  "[critique] Revising roadmap based on seed critique...",
  "[system] Compiling high-contrast presentation deck...",
  "[system] Generating custom HTML wireframe assets...",
  "[system] Zipping boilerplate source code skeleton...",
  "[system] Structuring seed consensus JSON stream..."
]

/**
 * @param {Object}  props
 * @param {boolean} props.visible   - Whether overlay is shown
 * @param {number}  props.progress  - 0–100 progress value
 * @param {string[]} props.doneAgents - Agent IDs that completed
 */
export default function LoadingOverlay({ visible, progress, doneAgents = [] }) {
  const [logIndex, setLogIndex] = useState(0)

  // Rotate through tech logs automatically every 1.8 seconds while loading
  useEffect(() => {
    if (!visible) {
      setLogIndex(0)
      return
    }
    const timer = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % TECH_LOGS.length)
    }, 1800)
    return () => clearInterval(timer)
  }, [visible])

  // Get active logs window to display (current and previous two logs)
  const activeLogs = [
    TECH_LOGS[(logIndex - 2 + TECH_LOGS.length) % TECH_LOGS.length],
    TECH_LOGS[(logIndex - 1 + TECH_LOGS.length) % TECH_LOGS.length],
    TECH_LOGS[logIndex]
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none relative overflow-hidden"
          style={{ background: 'rgba(5,8,22,0.88)', backdropFilter: 'blur(20px)' }}
          aria-live="polite"
          aria-label="AI co-founders compiling your startup model"
        >
          {/* Background Technical Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

          {/* Drifting Cyber Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#00f5d4]/40"
                style={{
                  left: `${(i * 5.9) % 100}%`,
                  top: `${(i * 11.3) % 100}%`,
                }}
                animate={{
                  y: [0, -200, 0],
                  opacity: [0.1, 0.8, 0.1],
                  scale: [0.8, 1.5, 0.8],
                }}
                transition={{
                  duration: 6 + (i % 4) * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Core Spinner Panel */}
          <div className="relative z-10 pointer-events-auto flex flex-col items-center gap-6 px-8 py-8 rounded-3xl max-w-lg w-full bg-[#0a0f24]/90 border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.25)]">
            
            {/* Header Title */}
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg tracking-wider">
                Daedalus Engine Compiling...
              </h3>
              <p className="text-white/40 text-xs mt-1 italic min-h-[16px]">
                {progress < 35  ? 'Mapping product strategy algorithms'
                 : progress < 55 ? 'Generating dynamic wireframe screens'
                 : progress < 75 ? 'Running security and critique solvers'
                 : progress < 90 ? 'Drawing vector presentation graphics'
                 : 'Packaging boilerplate workspace'}
              </p>
            </div>

            {/* Premium Fluid Lava-Lamp SVG Orb */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(0,245,212,0.4)]">
                <defs>
                  <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#00f5d4" />
                  </linearGradient>
                </defs>
                <motion.path
                  fill="url(#orbGrad)"
                  animate={{
                    d: [
                      "M25 50 C25 25, 50 25, 50 50 C50 75, 75 75, 75 50 C75 25, 25 25, 25 50 Z",
                      "M30 45 C15 25, 65 15, 70 45 C75 75, 40 85, 30 45 Z",
                      "M40 50 C20 30, 80 20, 75 50 C70 80, 30 75, 40 50 Z",
                      "M25 50 C25 25, 50 25, 50 50 C50 75, 75 75, 75 50 Z"
                    ]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
              </svg>
              {/* Central Lightning Bolt Badge */}
              <motion.div
                className="absolute w-12 h-12 rounded-full bg-[#0a0f24] border border-white/10 flex items-center justify-center text-xl shadow-lg z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚡
              </motion.div>
            </div>

            {/* Simulated Sketching Dashboard Blueprint (Highly engaging visual!) */}
            <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden shadow-inner">
              <div className="text-[9px] uppercase tracking-wider text-white/30 font-mono border-b border-white/5 pb-2 flex justify-between items-center">
                <span>Workspace Blueprint Solver</span>
                <span className="text-[#00f5d4] animate-pulse">Drawing UI...</span>
              </div>
              
              <div className="flex justify-around items-center h-20">
                {/* 1. Bar Chart Drawing Animation */}
                <div className="flex gap-1.5 items-end h-16 w-24 border-b border-l border-white/10 p-1 relative">
                  {[0.4, 0.85, 0.55, 0.95].map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-3 bg-gradient-to-t from-[#6366f1] to-[#00f5d4] rounded-t-sm"
                      initial={{ height: 0 }}
                      animate={{ height: [`${height * 20}%`, `${height * 100}%`, `${height * 20}%`] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.25
                      }}
                    />
                  ))}
                </div>

                {/* 2. Spinning Database HUD Ring */}
                <div className="flex flex-col items-center justify-center w-20">
                  <motion.div
                    className="w-12 h-12 rounded-full border-2 border-dashed border-[#00f5d4] flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-6 h-6 rounded-full border border-[#6366f1]/30 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]/50" />
                    </div>
                  </motion.div>
                  <span className="text-[8px] font-mono text-white/20 mt-2">DB SCHEMAS</span>
                </div>

                {/* 3. Pulsing Flowchart Connectors */}
                <div className="flex flex-col justify-between items-center w-24 h-16 relative">
                  <motion.div
                    className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#6366f1] to-[#00f5d4]" />
                  <motion.div
                    className="w-3.5 h-3.5 rounded-full bg-[#00f5d4] shadow-[0_0_8px_#00f5d4]"
                    animate={{ scale: [1.25, 1, 1.25], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>

            {/* Real-time System Console Logger */}
            <div className="w-full bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-white/50 leading-relaxed shadow-inner">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-1.5 text-white/20 text-[9px] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span>Compiler Status Console</span>
              </div>
              <div className="flex flex-col gap-1 min-h-[46px] overflow-hidden">
                {activeLogs.map((log, index) => {
                  const isActive = index === 2
                  return (
                    <motion.div
                      key={`${logIndex}-${index}`}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
                      className={isActive ? "text-[#00f5d4]" : "text-white/40"}
                    >
                      {log}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Progress bar with dynamic shimmer sheen */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>Build Progress</span>
                <span className="font-semibold text-white/60">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#00f5d4]"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
                {/* sweeping glowing sheen line */}
                <motion.div
                  className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/25 to-transparent z-10"
                  animate={{ x: ["-120px", "600px"] }}
                  transition={{ duration: 2.0, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>

            {/* Agent status grid (with active pulsing border glow states!) */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {AGENTS.map((agent) => {
                const done = doneAgents.includes(agent.id)
                // Identify the co-founder currently working
                const isActiveWorker = !done && (
                  (agent.id === 'pm' && progress < 35) ||
                  (agent.id === 'ui' && progress >= 35 && progress < 55) ||
                  (agent.id === 'backend' && progress >= 55 && progress < 75) ||
                  (agent.id === 'marketing' && progress >= 75 && progress < 90)
                )

                return (
                  <motion.div
                    key={agent.id}
                    className="flex flex-col items-center gap-1.5 py-2 px-2 rounded-xl border"
                    style={{
                      background: done ? `${agent.color}08` : 'rgba(255,255,255,0.02)',
                      borderColor: done ? agent.colorBorder : 'rgba(255,255,255,0.04)',
                    }}
                    animate={isActiveWorker ? {
                      borderColor: [agent.colorBorder, 'rgba(255,255,255,0.04)', agent.colorBorder],
                      scale: [1, 1.05, 1],
                      boxShadow: [`0 0 12px ${agent.color}25`, '0 0 0px rgba(0,0,0,0)', `0 0 12px ${agent.color}25`]
                    } : {}}
                    transition={isActiveWorker ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
                  >
                    <span className={`status-dot ${done ? 'done' : 'thinking'}`}
                      style={done ? { background: agent.color, boxShadow: `0 0 6px ${agent.color}` } : {}}
                    />
                    <span className="text-white/40 text-[9px] text-center leading-tight">
                      {agent.shortName}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            {/* Stop button hint */}
            <p className="text-white/20 text-[10px] text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono">Stop</kbd> in the input box to cancel
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
