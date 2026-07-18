/**
 * Navbar — Top navigation bar with logo, project name, GitHub link, and docs.
 * Glassmorphic, with scroll-based opacity enhancement.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, BookOpen, Zap, ExternalLink } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass border-b border-white/[0.06] shadow-[0_1px_40px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #38BDF8)' }}>
                <Zap size={18} className="text-white" fill="white" />
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-xl blur-md opacity-60"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #38BDF8)' }} />
            </div>

            <div className="flex flex-col leading-none">
              <span className="text-white font-semibold text-sm tracking-tight">
                Daedalus-AI
              </span>
              <span className="text-white/40 text-[10px] tracking-widest uppercase">
                Startup Validator
              </span>
            </div>
          </div>

          {/* Center badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-white/10 text-xs text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            6 AI Agents Active
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <NavLink
              href="https://github.com/GouriAgarwal/Daedalus-AI"
              icon={<Github size={14} />}
              label="GitHub"
              external
            />
            <NavLink
              href="#"
              icon={<BookOpen size={14} />}
              label="Docs"
            />
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

function NavLink({ href, icon, label, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white text-xs font-medium
                 hover:bg-white/[0.06] transition-all duration-200 group"
    >
      {icon}
      <span>{label}</span>
      {external && (
        <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </a>
  )
}
