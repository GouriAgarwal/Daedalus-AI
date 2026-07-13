/**
 * AgentCard — Displays one AI agent's output with glass effect,
 * animated border glow, streaming text, status indicator, and expand/collapse.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Palette, Server, TrendingUp,
  DollarSign, AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Clock
} from 'lucide-react'

const ICON_MAP = {
  LayoutDashboard, Palette, Server, TrendingUp, DollarSign, AlertTriangle,
}

/** Status → display config */
const STATUS_CONFIG = {
  idle:      { label: 'Waiting',   dotClass: 'idle',     Icon: Clock },
  thinking:  { label: 'Thinking',  dotClass: 'thinking', Icon: Loader2 },
  streaming: { label: 'Writing',   dotClass: 'thinking', Icon: Loader2 },
  done:      { label: 'Done',      dotClass: 'done',     Icon: CheckCircle2 },
}

/**
 * @param {Object}  props
 * @param {Object}  props.agent     - Agent definition from AGENTS constant
 * @param {Object}  props.data      - Agent output data (null if not started)
 * @param {'idle'|'thinking'|'done'} props.status
 * @param {number}  props.index     - Card index for staggered animation
 */
export default function AgentCard({ agent, data, status = 'idle', index = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICON_MAP[agent.icon] || LayoutDashboard
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const StatusIcon = cfg.Icon

  const isStreaming = status === 'streaming' || status === 'thinking'
  const isDone      = status === 'done'
  const hasData     = data && !data._streaming

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative group h-full"
    >
      {/* Animated glow border */}
      {isDone && (
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${agent.color}44, transparent, ${agent.color}22)`,
            borderRadius: '1rem',
          }}
        />
      )}

      {/* Card */}
      <div
        className={`relative h-full glass rounded-2xl p-5
                   transition-all duration-300 flex flex-col gap-4
                   hover:translate-y-[-2px]
                   ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          borderColor: isDone ? agent.colorBorder : 'rgba(255,255,255,0.07)',
          border: `1px solid ${isDone ? agent.colorBorder : 'rgba(255,255,255,0.07)'}`,
          boxShadow: isDone
            ? `0 0 30px ${agent.color}18, inset 0 1px 0 rgba(255,255,255,0.05)`
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onClick={() => hasData && setExpanded((v) => !v)}
        role={hasData ? 'button' : undefined}
        aria-expanded={hasData ? expanded : undefined}
        tabIndex={hasData ? 0 : undefined}
        onKeyDown={(e) => e.key === 'Enter' && hasData && setExpanded((v) => !v)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: agent.colorLight }}
            >
              <Icon size={18} style={{ color: agent.color }} />
              {isStreaming && (
                <div
                  className="absolute -inset-1 rounded-xl opacity-60 animate-pulse"
                  style={{ border: `1px solid ${agent.color}66`, background: 'transparent' }}
                />
              )}
            </div>

            {/* Name + role */}
            <div>
              <div className="text-white font-semibold text-sm leading-tight">{agent.name}</div>
              <div className="text-white/40 text-xs mt-0.5">{agent.role}</div>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`status-dot ${cfg.dotClass}`} />
            <span className="text-xs text-white/40">{cfg.label}</span>
            {hasData && (
              expanded
                ? <ChevronUp size={13} className="text-white/30 ml-1" />
                : <ChevronDown size={13} className="text-white/30 ml-1" />
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0">
          {/* Skeleton loader */}
          {isStreaming && !hasData && (
            <div className="space-y-2">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-3 w-3/5" />
              <div className="skeleton h-3 w-full mt-3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          )}

          {/* Idle placeholder */}
          {status === 'idle' && (
            <p className="text-white/20 text-sm leading-relaxed">{agent.description}</p>
          )}

          {/* Done — show preview */}
          {hasData && (
            <div className="space-y-2">
              <AgentPreview data={data} agentId={agent.id} color={agent.color} expanded={expanded} />
            </div>
          )}
        </div>

        {/* Thinking dots animation */}
        {isStreaming && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: agent.color }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
            <span className="text-white/30 text-xs ml-1">Analyzing...</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Agent-specific content renderer ──────────────────────────────── */

function AgentPreview({ data, agentId, color, expanded }) {
  if (!data) return null

  const renderList = (items, key) => {
    if (!items || !Array.isArray(items)) return null
    const displayItems = expanded ? items : items.slice(0, 3)
    return (
      <ul className="space-y-1.5">
        {displayItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </li>
        ))}
        {!expanded && items.length > 3 && (
          <li className="text-xs text-white/30 pl-3.5">+{items.length - 3} more…</li>
        )}
      </ul>
    )
  }

  const formatValue = (val) => {
    if (val == null) return ''
    if (typeof val === 'string') return val
    if (Array.isArray(val)) return val.map(formatValue).join(', ')
    if (typeof val === 'object') {
      if (val.tagline && val.elevator_pitch) return `${val.tagline} — ${val.elevator_pitch}`
      if (val.issue) return val.issue
      if (val.name) return val.name
      return Object.entries(val).map(([k, v]) => `${k}: ${formatValue(v)}`).join(' · ')
    }
    return String(val)
  }

  const renderText = (label, val) => {
    if (!val) return null
    const text = formatValue(val)
    const displayVal = expanded || text.length <= 120
      ? text
      : text.slice(0, 120) + '…'
    return (
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</div>
        <p className="text-white/75 text-xs leading-relaxed">{displayVal}</p>
      </div>
    )
  }

  // PM agent
  if (agentId === 'pm') {
    const features = data.core_features || data.mvp_features
    const roadmap = data.roadmap || data.user_journey
    const mvpScope = data.mvp_scope || data.go_to_market || (data.timeline_months ? `${data.timeline_months}-month timeline` : null)
    return (
      <div className="space-y-3">
        {renderText('Problem', data.problem)}
        {renderText('Solution', data.solution)}
        {!expanded && features && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Core Features</div>
            {renderList(features)}
          </div>
        )}
        {expanded && (
          <>
            {renderText('Target Users', data.target_users)}
            {features && (
              <div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Core Features</div>
                {renderList(features)}
              </div>
            )}
            {roadmap && (
              <div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Roadmap</div>
                {renderList(roadmap)}
              </div>
            )}
            {renderText('MVP Scope', mvpScope)}
          </>
        )}
      </div>
    )
  }

  // UI agent
  if (agentId === 'ui') {
    // screens can be strings OR objects { name, components }
    const screenLabel = (s) => typeof s === 'string' ? s : (s?.name ?? JSON.stringify(s))
    return (
      <div className="space-y-3">
        {data.screens && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Screens</div>
            <div className="flex flex-wrap gap-1.5">
              {(expanded ? data.screens : data.screens.slice(0, 4)).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] border"
                  style={{ borderColor: `${color}44`, color: color, background: `${color}10` }}>
                  {screenLabel(s)}
                </span>
              ))}
              {!expanded && data.screens.length > 4 && (
                <span className="text-xs text-white/30">+{data.screens.length - 4}</span>
              )}
            </div>
            {/* Show components list for each screen when expanded */}
            {expanded && data.screens.map((s, i) => {
              const components = s?.components || s?.key_components
              return components ? (
                <div key={i} className="mt-2">
                  <div className="text-white/30 text-[10px] mb-1">{screenLabel(s)}</div>
                  {renderList(components)}
                </div>
              ) : null
            })}
          </div>
        )}
        {(data.key_user_flows || data.wireframe_notes) && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">User Flows</div>
            {renderList(data.key_user_flows || data.wireframe_notes)}
          </div>
        )}
        {expanded && (data.key_interactions || data.information_architecture) && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Key Interactions</div>
            {renderList(data.key_interactions || data.information_architecture)}
          </div>
        )}
        {expanded && (data.component_library || data.visual_style) &&
          renderText('Component Library', data.component_library || data.visual_style)}
      </div>
    )
  }

  // Backend agent
  if (agentId === 'backend') {
    // api_endpoints can be strings OR objects { method, path, purpose } from Gemini
    const epLabel = (ep) => {
      if (typeof ep === 'string') return ep
      if (ep?.method && ep?.path) return `${ep.method} ${ep.path}`
      return JSON.stringify(ep)
    }
    // key_endpoints from fallback_data is an array of strings
    const endpoints = data.api_endpoints || data.key_endpoints || []
    // tech_choices can be a dict or array
    const techItems = Array.isArray(data.tech_stack)
      ? data.tech_stack
      : data.tech_choices
        ? Object.entries(data.tech_choices).map(([k, v]) => `${k}: ${v}`)
        : []
    return (
      <div className="space-y-3">
        {renderText('Architecture', data.architecture)}
        {endpoints.length > 0 && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">API Endpoints</div>
            <div className="space-y-1">
              {(expanded ? endpoints : endpoints.slice(0, 3)).map((ep, i) => (
                <div key={i} className="font-mono text-[10px] text-white/60 bg-white/[0.04] px-2 py-1 rounded-md">
                  {epLabel(ep)}
                </div>
              ))}
              {!expanded && endpoints.length > 3 && (
                <div className="font-mono text-[10px] text-white/30 px-2">+{endpoints.length - 3} more</div>
              )}
            </div>
          </div>
        )}
        {data.services && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Services</div>
            {renderList(data.services)}
          </div>
        )}
        {expanded && techItems.length > 0 && (
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Tech Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {techItems.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-white/[0.06] text-white/60">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Marketing agent
  if (agentId === 'marketing') {
    const gtm = data.gtm_strategy || data.positioning
    const positioning = data.competitive_positioning || data.value_props || data.competitors
    return (
      <div className="space-y-3">
        {renderText('GTM Strategy', gtm)}
        {!expanded && renderText('Positioning', positioning)}
        {expanded && (
          <>
            {data.channels && (
              <div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Channels</div>
                {renderList(data.channels)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {data.target_cac && (
                <div className="bg-white/[0.04] rounded-lg p-2">
                  <div className="text-[10px] text-white/40">Target CAC</div>
                  <div className="text-sm font-semibold" style={{ color }}>{data.target_cac}</div>
                </div>
              )}
              {data.target_ltv && (
                <div className="bg-white/[0.04] rounded-lg p-2">
                  <div className="text-[10px] text-white/40">Target LTV</div>
                  <div className="text-sm font-semibold" style={{ color }}>{data.target_ltv}</div>
                </div>
              )}
            </div>
            {renderText('Messaging', data.messaging)}
          </>
        )}
      </div>
    )
  }

  // Investor agent — concerns can be strings OR objects { severity, issue, agent, recommended_revision }
  if (agentId === 'investor') {
    const items = data.concerns || []
    const concernText = (c) => typeof c === 'string' ? c : (c?.issue ?? JSON.stringify(c))
    return (
      <div className="space-y-3">
        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Due-Diligence Concerns</div>
        {items.length === 0 ? (
          <p className="text-white/30 text-xs italic">No concerns raised.</p>
        ) : (
          <ul className="space-y-2">
            {(expanded ? items : items.slice(0, 2)).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/75 leading-relaxed
                                    bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-400" />
                <span>{concernText(item)}</span>
              </li>
            ))}
            {!expanded && items.length > 2 && (
              <li className="text-xs text-white/30 pl-3">+{items.length - 2} more concerns…</li>
            )}
          </ul>
        )}
      </div>
    )
  }

  // Skeptic agent — flags can be strings OR objects { severity, issue }
  if (agentId === 'skeptic') {
    const items = data.flags || []
    const flagText = (f) => typeof f === 'string' ? f : (f?.issue ?? JSON.stringify(f))
    return (
      <div className="space-y-3">
        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Red Flags</div>
        {items.length === 0 ? (
          <p className="text-white/30 text-xs italic">No flags raised.</p>
        ) : (
          <ul className="space-y-2">
            {(expanded ? items : items.slice(0, 2)).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/75 leading-relaxed
                                    bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                <span>{flagText(item)}</span>
              </li>
            ))}
            {!expanded && items.length > 2 && (
              <li className="text-xs text-white/30 pl-3">+{items.length - 2} more flags…</li>
            )}
          </ul>
        )}
      </div>
    )
  }

  // Generic fallback
  return (
    <div className="space-y-2">
      {Object.entries(data)
        .filter(([k]) => k !== '_streaming' && k !== '_type')
        .slice(0, expanded ? 10 : 3)
        .map(([k, v]) => (
          <div key={k}>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">
              {k.replace(/_/g, ' ')}
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              {Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </p>
          </div>
        ))}
    </div>
  )
}
