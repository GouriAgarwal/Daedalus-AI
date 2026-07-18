/**
 * StreamProgressBar — Thin Linear-style progress bar fixed at the very top
 * of the viewport. Visible only while the SSE stream is active.
 */
import { motion, AnimatePresence } from 'framer-motion'

/**
 * @param {Object}  props
 * @param {boolean} props.visible  - Show the bar
 * @param {number}  props.progress - 0–100
 */
export default function StreamProgressBar({ visible, progress }) {
  const clampedPct = Math.min(Math.max(progress, 0), 100)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.5, duration: 0.4 } }}
          className="fixed top-0 left-0 right-0 z-[999] h-[2px] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          aria-hidden="true"
        >
          {/* Filled bar */}
          <motion.div
            className="absolute top-0 left-0 h-full"
            style={{
              background: 'linear-gradient(90deg, #39FF14, #00F5D4, #10B981)',
              boxShadow: '0 0 8px rgba(57,255,20,0.9), 0 0 16px rgba(0,245,212,0.5)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${clampedPct}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />

          {/* Leading glow dot — only shown when progress < 100 */}
          {clampedPct > 0 && clampedPct < 100 && (
            <motion.div
              className="absolute top-1/2 w-2 h-2 rounded-full"
              style={{
                background: '#00F5D4',
                boxShadow: '0 0 8px #00F5D4, 0 0 16px rgba(0,245,212,0.7)',
                left: `${clampedPct}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{ left: `${clampedPct}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
