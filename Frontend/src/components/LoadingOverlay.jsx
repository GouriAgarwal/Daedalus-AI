/**
 * LoadingOverlay — Full-screen animated loading screen shown
 * while the AI agents are processing, with live progress bar
 * and agent status indicators.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { AGENTS } from '../utils/constants'

/**
 * @param {Object}  props
 * @param {boolean} props.visible   - Whether overlay is shown
 * @param {number}  props.progress  - 0–100 progress value
 * @param {string[]} props.doneAgents - Agent IDs that completed
 */
export default function LoadingOverlay({ visible, progress, doneAgents = [] }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(16px)' }}
          aria-live="polite"
          aria-label="AI agents processing"
        >
          <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
            {/* Logo spinner */}
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #38BDF8)' }}
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 0.98, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                ⚡
              </motion.div>
              {/* Ring */}
              <svg className="absolute -inset-3 w-[88px] h-[88px] -rotate-90" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="40"
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
                />
                <motion.circle
                  cx="44" cy="44" r="40"
                  fill="none"
                  stroke="url(#spinGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${251 * progress / 100} 251`}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <div className="text-white font-semibold text-lg">
                AI Team Analyzing...
              </div>
              <div className="text-white/40 text-sm mt-1">
                {progress < 30  ? 'PM is defining product strategy'
                 : progress < 50 ? 'UI & Backend agents joining'
                 : progress < 70 ? 'Marketing agent crafting GTM'
                 : progress < 85 ? 'Investor & Skeptic reviewing'
                 : 'Computing startup score'}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="progress-bar h-full rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Agent status grid */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {AGENTS.map((agent) => {
                const done = doneAgents.includes(agent.id)
                return (
                  <div
                    key={agent.id}
                    className="flex flex-col items-center gap-1.5 py-2 px-2 rounded-xl"
                    style={{
                      background: done ? `${agent.color}10` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${done ? agent.colorBorder : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span className={`status-dot ${done ? 'done' : 'thinking'}`}
                      style={done ? { background: agent.color, boxShadow: `0 0 6px ${agent.color}` } : {}}
                    />
                    <span className="text-white/50 text-[10px] text-center leading-tight">
                      {agent.shortName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
