/**
 * ExportButtons — Download section with animated cards for pitch deck,
 * wireframe, and code skeleton. Handles download animation and success toast.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Layout, Code2, Download, CheckCircle2, Loader2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_BASE } from '../utils/constants'

const EXPORT_CARDS = [
  {
    id:          'pitch-deck',
    title:       'Pitch Deck',
    subtitle:    '8-slide investor presentation',
    description: 'Problem · Solution · Market · Traction · Team · Tech · Roadmap · Ask',
    icon:        FileText,
    color:       '#7C3AED',
    colorLight:  'rgba(124,58,237,0.15)',
    colorBorder: 'rgba(124,58,237,0.3)',
    ext:         '.pptx',
    endpoint:    'pitch-deck',
  },
  {
    id:          'wireframe',
    title:       'Wireframe',
    subtitle:    'Interactive HTML prototype',
    description: 'AI-generated Tailwind HTML based on UI Designer agent specs',
    icon:        Layout,
    color:       '#38BDF8',
    colorLight:  'rgba(56,189,248,0.15)',
    colorBorder: 'rgba(56,189,248,0.3)',
    ext:         '.html',
    endpoint:    'wireframe',
  },
  {
    id:          'code-skeleton',
    title:       'Code Skeleton',
    subtitle:    'Starter backend codebase',
    description: 'models.py · routes.py · main.py · requirements.txt — ready to deploy',
    icon:        Code2,
    color:       '#22C55E',
    colorLight:  'rgba(34,197,94,0.15)',
    colorBorder: 'rgba(34,197,94,0.3)',
    ext:         '.zip',
    endpoint:    'code-skeleton',
  },
]

/**
 * @param {Object}  props
 * @param {string}  props.sessionId - Session ID for download queries
 * @param {boolean} props.visible   - Whether to show this section
 */
export default function ExportButtons({ sessionId, visible }) {
  const [downloadStates, setDownloadStates] = useState({})

  if (!visible) return null

  const handleDownload = async (card) => {
    if (downloadStates[card.id] === 'loading') return

    setDownloadStates((s) => ({ ...s, [card.id]: 'loading' }))

    // A real session ID is present when the backend issued one (no 'demo:' prefix).
    const isLiveSession = sessionId && !sessionId.startsWith('demo:')

    try {
      if (isLiveSession) {
        // ── Live backend download ──────────────────────────────────────
        // Session ID comes from the completed SSE stream and is used
        // as the ?id= query parameter so the backend can locate the
        // generated artifacts for this specific run.
        const url = `${API_BASE}/export/${card.endpoint}?id=${sessionId}`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const blob = await response.blob()
        const href = URL.createObjectURL(blob)
        triggerDownload(href, `ai-cofounder-${card.endpoint}${card.ext}`)
        URL.revokeObjectURL(href)
      } else {
        // ── Demo / no-backend mode ─────────────────────────────────────
        await new Promise((r) => setTimeout(r, 1400))
        toast('Demo mode — connect your backend to download real files', {
          icon: '📦',
          style: {
            background: 'rgba(5,8,22,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '12px',
          },
        })
      }

      setDownloadStates((s) => ({ ...s, [card.id]: 'done' }))
      toast.success(`${card.title} ready!`, {
        style: {
          background: 'rgba(5,8,22,0.95)',
          border: `1px solid ${card.colorBorder}`,
          color: '#fff',
          fontSize: '13px',
          borderRadius: '12px',
        },
        iconTheme: { primary: card.color, secondary: '#fff' },
      })

      // Reset after 3 seconds
      setTimeout(() => setDownloadStates((s) => ({ ...s, [card.id]: null })), 3000)
    } catch (err) {
      setDownloadStates((s) => ({ ...s, [card.id]: null }))
      toast.error(`Failed to download ${card.title}: ${err.message}`, {
        style: {
          background: 'rgba(5,8,22,0.95)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fff',
          fontSize: '13px',
          borderRadius: '12px',
        },
      })
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto px-4"
      aria-label="Export artifacts"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)' }}>
          <Package size={15} style={{ color: '#EC4899' }} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-base">Export Artifacts</h2>
          <p className="text-white/40 text-xs">Download your complete startup package</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {EXPORT_CARDS.map((card, i) => (
          <ExportCard
            key={card.id}
            card={card}
            index={i}
            dlState={downloadStates[card.id]}
            onDownload={() => handleDownload(card)}
          />
        ))}
      </div>

      {/* Closing tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-white/25 text-sm italic leading-relaxed max-w-2xl mx-auto">
          "Cursor builds your app in minutes.{' '}
          <span className="text-white/50 not-italic font-medium">We tell you whether you should build it at all</span>
          {' '}— and how, using a debating AI founding team."
        </p>
      </motion.div>
    </motion.section>
  )
}

/* ── Individual export card ─────────────────────────────────────── */

function ExportCard({ card, index, dlState, onDownload }) {
  const Icon = card.icon
  const isLoading = dlState === 'loading'
  const isDone    = dlState === 'done'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative"
    >
      {/* Hover glow */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${card.color}30, transparent 70%)`,
        }}
      />

      <div
        className="relative glass rounded-2xl p-5 flex flex-col gap-4 h-full cursor-pointer
                   transition-all duration-300"
        style={{ border: `1px solid ${isDone ? card.colorBorder : 'rgba(255,255,255,0.07)'}` }}
        onClick={onDownload}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onDownload()}
        aria-label={`Download ${card.title}`}
      >
        {/* Icon + ext badge */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: card.colorLight, border: `1px solid ${card.colorBorder}` }}>
            <Icon size={18} style={{ color: card.color }} />
          </div>
          <span className="text-[10px] font-mono text-white/30 bg-white/[0.05] px-2 py-1 rounded-md border border-white/[0.06]">
            {card.ext}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="text-white font-semibold text-sm mb-1">{card.title}</div>
          <div className="text-white/40 text-xs mb-2">{card.subtitle}</div>
          <div className="text-white/25 text-[11px] leading-relaxed">{card.description}</div>
        </div>

        {/* Download button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                     text-sm font-semibold transition-all duration-200"
          style={{
            background: isDone
              ? `rgba(34,197,94,0.15)`
              : isLoading
              ? `${card.colorLight}`
              : `${card.colorLight}`,
            color: isDone ? '#22C55E' : card.color,
            border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : card.colorBorder}`,
          }}
          tabIndex={-1}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Preparing...
            </>
          ) : isDone ? (
            <>
              <CheckCircle2 size={14} />
              Downloaded!
            </>
          ) : (
            <>
              <Download size={14} />
              Download
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

/* ── Utility ────────────────────────────────────────────────────── */
function triggerDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
