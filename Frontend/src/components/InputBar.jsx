/**
 * InputBar — Hero input section with glowing textarea, animated generate
 * button, example idea chips, and subtle badge stats.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Lightbulb, Command } from 'lucide-react'
import { TypeAnimation } from 'react-type-animation'
import { EXAMPLE_IDEAS } from '../utils/constants'

const PLACEHOLDERS = [
  'AI-powered hiring platform for Web3 companies...',
  'Carbon credit marketplace for small businesses...',
  'Peer-to-peer electric vehicle charging network...',
  'Real-time language learning with AI tutors...',
  'Supply chain visibility SaaS for D2C brands...',
]

/**
 * @param {Object}   props
 * @param {function} props.onSubmit  - Called with the idea string
 * @param {boolean}  props.isLoading - Whether generation is in progress
 * @param {function} props.onReset   - Called when user wants to reset
 */
export default function InputBar({ onSubmit, isLoading, onReset }) {
  const [idea, setIdea] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)
  const charLimit = 500

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (idea.trim() && !isLoading) handleSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idea, isLoading])

  const handleSubmit = () => {
    const trimmed = idea.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  const handleChip = (chip) => {
    // Strip emoji prefix
    const text = chip.replace(/^[\p{Emoji}\s]+/u, '').trim()
    setIdea(text)
    textareaRef.current?.focus()
  }

  const handleReset = () => {
    setIdea('')
    onReset()
    textareaRef.current?.focus()
  }

  const pct = (idea.length / charLimit) * 100
  const overLimit = idea.length > charLimit

  return (
    <section className="w-full max-w-3xl mx-auto px-4">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <span className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30 bg-purple-500/10 text-purple-300 flex items-center gap-1.5">
          <Lightbulb size={11} />
          Describe your startup idea
        </span>
      </motion.div>

      {/* Hero headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
          <span className="text-white">Your Idea,</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 50%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Stress-Tested
          </span>
        </h1>
        <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
          6 AI agents debate your startup in real-time.{' '}
          <span className="text-white/70">Get a score, pitch deck, wireframe, and code.</span>
        </p>
      </motion.div>

      {/* Textarea container */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="relative"
      >
        <div className={`relative rounded-2xl transition-all duration-300 ${
          focused ? 'shadow-[0_0_0_1px_rgba(124,58,237,0.5),0_0_40px_rgba(124,58,237,0.12)]' : ''
        }`}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Typing animation placeholder */}
          {!idea && !focused && (
            <div className="absolute top-5 left-5 pointer-events-none text-white/30 text-base font-normal">
              <TypeAnimation
                sequence={PLACEHOLDERS.flatMap((p) => [p, 2200])}
                wrapper="span"
                speed={60}
                deletionSpeed={80}
                repeat={Infinity}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isLoading}
            placeholder=""
            aria-label="Startup idea input"
            className="idea-textarea w-full bg-transparent resize-none text-white text-base
                       leading-relaxed p-5 pb-16 rounded-2xl placeholder-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 160, maxHeight: 300, outline: 'none' }}
          />

          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3
                          border-t border-white/[0.05] rounded-b-2xl">
            {/* Char counter */}
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <circle
                    cx="12" cy="12" r="9"
                    fill="none"
                    stroke={overLimit ? '#EF4444' : pct > 80 ? '#F59E0B' : '#7C3AED'}
                    strokeWidth="2"
                    strokeDasharray={`${56.5 * pct / 100} 56.5`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                </svg>
              </div>
              <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-white/30'}`}>
                {idea.length}/{charLimit}
              </span>
            </div>

            {/* Shortcut hint + submit button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-white/20 text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] flex items-center gap-0.5">
                  <Command size={9} /> Enter
                </kbd>
                <span>to generate</span>
              </div>

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.button
                    key="stop"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                               bg-red-500/10 border border-red-500/30 text-red-400
                               hover:bg-red-500/20 transition-all"
                  >
                    <span className="w-2 h-2 rounded-sm bg-red-400" />
                    Stop
                  </motion.button>
                ) : (
                  <motion.button
                    key="generate"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={handleSubmit}
                    disabled={!idea.trim() || overLimit}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="btn-ripple flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
                               text-white disabled:opacity-40 disabled:cursor-not-allowed
                               transition-all duration-200"
                    style={{
                      background: idea.trim() && !overLimit
                        ? 'linear-gradient(135deg, #7C3AED, #38BDF8)'
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: idea.trim() && !overLimit
                        ? '0 0 20px rgba(124,58,237,0.4)'
                        : 'none',
                    }}
                    aria-label="Generate startup analysis"
                  >
                    <Sparkles size={15} />
                    Generate
                    <ArrowRight size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Example chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-5 flex flex-wrap gap-2 justify-center"
      >
        <span className="text-white/25 text-xs mt-0.5 self-center whitespace-nowrap">Try:</span>
        {EXAMPLE_IDEAS.slice(0, 5).map((chip, i) => (
          <motion.button
            key={i}
            onClick={() => handleChip(chip)}
            disabled={isLoading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-1 rounded-full text-xs font-medium
                       bg-white/[0.05] border border-white/[0.08] text-white/50
                       hover:text-white hover:bg-white/[0.09] hover:border-purple-500/40
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            {chip}
          </motion.button>
        ))}
      </motion.div>
    </section>
  )
}
