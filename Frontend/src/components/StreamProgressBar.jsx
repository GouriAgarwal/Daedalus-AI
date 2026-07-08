/**
 * StreamProgressBar — Thin Linear-style progress bar fixed at the very top
 * of the viewport. Visible only while the SSE stream is active.
 * Provides instant visual feedback without blocking the full overlay.
 */
import { motion, AnimatePresence } from 'framer-motion'

/**
 * @param {Object}  props
 * @param {boolean} props.visible  - Show the bar
 * @param {number}  props.progress - 0–100
 */
export default function StreamProgressBar({ visible, progress }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4, duration: 0.3 } }}
          className="fixed top-0 left-0 right-0 z-[999] h-[2px]"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #7C3AED, #38BDF8, #EC4899)',
              backgroundSize: '200% 100%',
              animation: 'progressGlow 2s linear infinite',
              boxShadow: '0 0 8px rgba(124,58,237,0.8), 0 0 20px rgba(56,189,248,0.4)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          {/* Leading glow dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              background: '#38BDF8',
              boxShadow: '0 0 10px #38BDF8, 0 0 20px rgba(56,189,248,0.6)',
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
