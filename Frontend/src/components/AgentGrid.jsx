/**
 * AgentGrid — 3×2 responsive grid of AgentCards with staggered reveal.
 * Shows section header and domain badge when data is available.
 */
import { motion } from 'framer-motion'
import { Brain, Users } from 'lucide-react'
import AgentCard from './AgentCard'
import { AGENTS } from '../utils/constants'

/**
 * @param {Object}   props
 * @param {Object}   props.data       - Full pipeline data from SSE
 * @param {string[]} props.agentOrder - Order agents completed in
 * @param {string}   props.status     - 'idle'|'streaming'|'done'
 */
export default function AgentGrid({ data, agentOrder, status }) {
  const isActive = status !== 'idle'

  const getAgentStatus = (agentId) => {
    if (status === 'idle') return 'idle'
    const round1 = data?.round1 || {}
    if (round1[agentId]) {
      if (round1[agentId]._streaming) return 'thinking'
      return 'done'
    }
    // Check if this agent should be active (it's next in queue)
    const activeIndex = AGENTS.findIndex((a) => !round1[a.id] && a.id !== 'investor' && a.id !== 'skeptic')
    const thisIndex   = AGENTS.findIndex((a) => a.id === agentId)
    if (thisIndex === activeIndex && status === 'streaming') return 'thinking'
    return 'idle'
  }

  if (!isActive) return null

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-6xl mx-auto px-4"
      aria-label="AI Agent outputs"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Brain size={15} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">AI Founding Team</h2>
            <p className="text-white/40 text-xs">6 specialized agents analyzing your idea</p>
          </div>
        </div>

        {/* Domain badge */}
        {data?.domain && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs"
          >
            <Users size={11} className="text-purple-400" />
            <span className="text-white/60">Domain:</span>
            <span className="text-white font-semibold">{data.domain}</span>
          </motion.div>
        )}
      </div>

      {/* Round 1 agents — 3 col grid (2 col on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {AGENTS.slice(0, 4).map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            data={data?.round1?.[agent.id]}
            status={getAgentStatus(agent.id)}
            index={i}
          />
        ))}
      </div>

      {/* Round 2 agents — Investor + Skeptic (full row, side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AGENTS.slice(4).map((agent, i) => {
          // Investor/Skeptic become active only after round1 is done
          const r1Done = ['pm', 'ui', 'backend', 'marketing'].every(
            (k) => data?.round1?.[k] && !data.round1[k]._streaming
          )
          let agentStatus = 'idle'
          if (r1Done && status === 'streaming') agentStatus = 'thinking'
          if (data?.round2_critique) agentStatus = 'done'

          // Investor data from round2_critique
          const agentData = agent.id === 'investor'
            ? data?.round2_critique
              ? { concerns: data.round2_critique.investor_concerns }
              : null
            : data?.round2_critique
              ? { flags: data.round2_critique.skeptic_flags }
              : null

          return (
            <AgentCard
              key={agent.id}
              agent={agent}
              data={agentData ? { ...agentData, _type: agent.id } : null}
              status={agentStatus}
              index={4 + i}
            />
          )
        })}
      </div>
    </motion.section>
  )
}
