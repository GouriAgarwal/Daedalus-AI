/**
 * Footer — Minimal glassmorphic footer with tagline and links.
 */
import { motion } from 'framer-motion'
import { Heart, Github, ExternalLink, Zap } from 'lucide-react'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative mt-24 border-t border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #38BDF8)' }}>
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <span className="text-white font-semibold text-sm">AI Co-Founder Team</span>
            </div>
            <p className="text-white/30 text-xs max-w-xs text-center md:text-left leading-relaxed">
              Multi-agent AI startup validator. Built for hackathons, designed for founders.
            </p>
          </div>

          {/* Center — Made with love */}
          <div className="flex items-center gap-1.5 text-white/25 text-xs">
            Built with
            <Heart size={11} className="text-pink-500 fill-pink-500 mx-0.5" />
            by a team of 3
          </div>

          {/* Links */}
          <div className="flex items-center gap-3">
            <FooterLink href="https://github.com" icon={<Github size={13} />} label="GitHub" />
            <FooterLink href="#" icon={<ExternalLink size={13} />} label="Docs" />
          </div>
        </div>

        {/* Bottom divider */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center">
          <p className="text-white/15 text-[11px] text-center">
            © 2026 AI Co-Founder Team · Powered by Claude Sonnet · Built on LangGraph
          </p>
        </div>
      </div>
    </motion.footer>
  )
}

function FooterLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs
                 transition-colors duration-200"
    >
      {icon}
      {label}
    </a>
  )
}
