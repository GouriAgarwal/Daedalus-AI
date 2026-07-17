/**
 * CritiqueThread — Chat-style timeline showing Investor/Skeptic concerns,
 * investment thesis, killer questions, overall risk and agent revisions.
 * Enhanced to display all rich fields from the upgraded agent prompts.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, AlertTriangle, RefreshCw, ChevronRight,
  ArrowDown, HelpCircle, TrendingUp, ShieldAlert, CheckCircle2
} from 'lucide-react'

/**
 * @param {Object} props
 * @param {Object} props.critique - round2_critique data object
 */
export default function CritiqueThread({ critique }) {
  if (!critique) return null

  const {
    investor_concerns = [],
    skeptic_flags = [],
    revisions = {},
    investment_thesis,
    ask_readiness,
    killer_questions = [],
    overall_risk,
  } = critique

  const hasContent = investor_concerns.length > 0 || skeptic_flags.length > 0

  if (!hasContent) return null

  const readinessColor = {
    low:    '#EF4444',
    medium: '#F59E0B',
    high:   '#22C55E',
  }[ask_readiness] || '#64748B'

  const riskColor = {
    low:    '#22C55E',
    medium: '#F59E0B',
    high:   '#EF4444',
  }[overall_risk] || '#64748B'

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto px-4"
      aria-label="Critique thread"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <RefreshCw size={15} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-base">Critique &amp; Revision</h2>
          <p className="text-white/40 text-xs">Investor &amp; Skeptic debate · PM responds</p>
        </div>
      </div>

      {/* Summary badges row */}
      {(investment_thesis || ask_readiness || overall_risk) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
        >
          {/* Investment Thesis */}
          {investment_thesis && (
            <div className="glass rounded-xl p-4 border border-white/[0.07] col-span-1 sm:col-span-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-white/40">Investment Thesis</span>
              </div>
              <p className="text-white/75 text-sm leading-relaxed">{investment_thesis}</p>
            </div>
          )}

          {/* Ask Readiness */}
          {ask_readiness && (
            <div className="glass rounded-xl p-4 border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={12} style={{ color: readinessColor }} />
                <span className="text-[10px] uppercase tracking-widest text-white/40">Ask Readiness</span>
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: readinessColor }}
              >
                {ask_readiness}
              </span>
            </div>
          )}

          {/* Overall Risk */}
          {overall_risk && (
            <div className="glass rounded-xl p-4 border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={12} style={{ color: riskColor }} />
                <span className="text-[10px] uppercase tracking-widest text-white/40">Overall Risk</span>
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: riskColor }}
              >
                {overall_risk}
              </span>
            </div>
          )}

          {/* Killer Questions */}
          {killer_questions.length > 0 && (
            <div className="glass rounded-xl p-4 border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={12} className="text-purple-400" />
                <span className="text-[10px] uppercase tracking-widest text-white/40">Killer Questions</span>
              </div>
              <ul className="space-y-1">
                {killer_questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-xs text-white/60 leading-relaxed flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="space-y-4 pl-16">
          {/* Investor concerns */}
          {investor_concerns.map((concern, i) => (
            <CritiqueBubble
              key={`inv-${i}`}
              type="investor"
              index={i}
              text={formatCritiqueText(concern)}
            />
          ))}

          {/* Skeptic flags */}
          {skeptic_flags.map((flag, i) => (
            <CritiqueBubble
              key={`sk-${i}`}
              type="skeptic"
              index={investor_concerns.length + i}
              text={formatCritiqueText(flag)}
            />
          ))}

          {/* Revisions */}
          {Object.entries(revisions).map(([agentKey, rev], i) => (
            <RevisionBlock
              key={agentKey}
              agentKey={agentKey}
              revision={rev}
              index={investor_concerns.length + skeptic_flags.length + i}
            />
          ))}
        </div>
      </div>
    </motion.section>
  )
}

const formatCritiqueText = (item) => {
  if (typeof item === 'string') return item
  if (item?.issue) return item.issue
  return JSON.stringify(item)
}

const formatRevisionItem = (item) => {
  if (typeof item === 'string') return item
  if (item?.issue) return item.issue
  if (item?.name) return item.name
  return JSON.stringify(item)
}

/* ── Critique bubble ────────────────────────────────────────────────────────── */

const BUBBLE_CONFIG = {
  investor: {
    icon:        DollarSign,
    label:       'Investor',
    bgColor:     'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
    iconBg:      'rgba(239,68,68,0.15)',
    iconColor:   '#EF4444',
    dotColor:    '#EF4444',
  },
  skeptic: {
    icon:        AlertTriangle,
    label:       'Skeptic',
    bgColor:     'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
    iconBg:      'rgba(245,158,11,0.15)',
    iconColor:   '#F59E0B',
    dotColor:    '#F59E0B',
  },
}

function CritiqueBubble({ type, text, index }) {
  const cfg = BUBBLE_CONFIG[type]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div
        className="absolute -left-[2.75rem] top-3 w-3 h-3 rounded-full border-2"
        style={{
          background:  cfg.dotColor,
          borderColor: '#050816',
          boxShadow:   `0 0 8px ${cfg.dotColor}88`,
        }}
      />

      <div
        className="rounded-xl p-4 transition-all duration-200 hover:translate-x-1"
        style={{
          background:   cfg.bgColor,
          border:       `1px solid ${cfg.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: cfg.iconBg }}
          >
            <Icon size={13} style={{ color: cfg.iconColor }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: cfg.iconColor }}>
            {cfg.label}
          </span>
          <ChevronRight size={11} className="text-white/20" />
          <span className="text-white/40 text-xs">Concern #{index + 1}</span>
        </div>
        <p className="text-white/75 text-sm leading-relaxed">{text}</p>
      </div>
    </motion.div>
  )
}

/* ── Revision block (before → after) ─────────────────────────────────────────  */

function RevisionBlock({ agentKey, revision, index }) {
  const [showBefore, setShowBefore] = useState(false)

  const agentColors = {
    pm:        { color: '#7C3AED', label: 'PM Agent' },
    ui:        { color: '#38BDF8', label: 'UI Designer' },
    backend:   { color: '#22C55E', label: 'Backend Architect' },
    marketing: { color: '#EC4899', label: 'Marketing' },
  }
  const cfg = agentColors[agentKey] || { color: '#7C3AED', label: agentKey }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12 + 0.1, duration: 0.4 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div
        className="absolute -left-[2.75rem] top-3 w-3 h-3 rounded-full border-2"
        style={{
          background:  cfg.color,
          borderColor: '#050816',
          boxShadow:   `0 0 8px ${cfg.color}88`,
        }}
      />

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${cfg.color}33` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: `${cfg.color}12` }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} style={{ color: cfg.color }} />
            <span className="text-xs font-semibold" style={{ color: cfg.color }}>
              {cfg.label} Revised
            </span>
          </div>
          <button
            onClick={() => setShowBefore((v) => !v)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            {showBefore ? 'Hide' : 'Show'} original
            <ChevronRight size={11} className={`transition-transform ${showBefore ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Before (collapsible) */}
        <AnimatePresence>
          {showBefore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-red-500/5 border-b border-red-500/10">
                <div className="text-[10px] text-red-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  Before
                </div>
                <RevisionContent data={revision} showBefore />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arrow */}
        {showBefore && (
          <div className="flex justify-center py-2">
            <ArrowDown size={14} className="text-white/20" />
          </div>
        )}

        {/* After */}
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: `${cfg.color}80` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
            After revision
          </div>
          <RevisionContent data={revision} color={cfg.color} />
        </div>
      </div>
    </motion.div>
  )
}

function RevisionContent({ data, color, showBefore }) {
  if (!data) return null

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
            {key.replace(/_/g, ' ')}
          </div>
          {Array.isArray(value) ? (
            <ul className="space-y-1">
              {value.map((item, i) => (
                <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: color || 'rgba(255,255,255,0.3)' }} />
                  {formatRevisionItem(item)}
                </li>
              ))}
            </ul>
          ) : typeof value === 'object' ? (
            <p className={`text-xs leading-relaxed ${showBefore ? 'text-white/40 line-through' : 'text-white/75'}`}>
              {formatRevisionItem(value)}
            </p>
          ) : (
            <p className={`text-xs leading-relaxed ${showBefore ? 'text-white/40 line-through' : 'text-white/75'}`}>
              {String(value)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
