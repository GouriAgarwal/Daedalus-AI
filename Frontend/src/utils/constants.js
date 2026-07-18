/**
 * Agent definitions: metadata for each of the 6 AI co-founder agents.
 * Used to render AgentCards and map API data to UI.
 */
export const AGENTS = [
  {
    id: 'pm',
    name: 'Product Manager',
    shortName: 'PM',
    role: 'Product Strategy',
    description: 'Defines product vision, roadmap, and core features.',
    color: '#7C3AED',
    colorLight: 'rgba(124,58,237,0.15)',
    colorBorder: 'rgba(124,58,237,0.3)',
    icon: 'LayoutDashboard',
    gradient: 'from-purple-600/20 to-purple-900/10',
  },
  {
    id: 'ui',
    name: 'UI Designer',
    shortName: 'UI/UX',
    role: 'Design & Experience',
    description: 'Creates wireframes, design systems, and user flows.',
    color: '#38BDF8',
    colorLight: 'rgba(56,189,248,0.15)',
    colorBorder: 'rgba(56,189,248,0.3)',
    icon: 'Palette',
    gradient: 'from-sky-500/20 to-sky-900/10',
  },
  {
    id: 'backend',
    name: 'Backend Architect',
    shortName: 'Backend',
    role: 'Technical Architecture',
    description: 'Designs system architecture, APIs, and data models.',
    color: '#22C55E',
    colorLight: 'rgba(34,197,94,0.15)',
    colorBorder: 'rgba(34,197,94,0.3)',
    icon: 'Server',
    gradient: 'from-green-600/20 to-green-900/10',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    role: 'Growth & GTM',
    description: 'Crafts go-to-market strategy and growth channels.',
    color: '#EC4899',
    colorLight: 'rgba(236,72,153,0.15)',
    colorBorder: 'rgba(236,72,153,0.3)',
    icon: 'TrendingUp',
    gradient: 'from-pink-600/20 to-pink-900/10',
  },
  {
    id: 'investor',
    name: 'Investor',
    shortName: 'Investor',
    role: 'Due Diligence',
    description: 'Evaluates market opportunity, traction, and risks.',
    color: '#F59E0B',
    colorLight: 'rgba(245,158,11,0.15)',
    colorBorder: 'rgba(245,158,11,0.3)',
    icon: 'DollarSign',
    gradient: 'from-amber-600/20 to-amber-900/10',
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    shortName: 'Skeptic',
    role: "Devil's Advocate",
    description: 'Challenges assumptions and stress-tests the plan.',
    color: '#EF4444',
    colorLight: 'rgba(239,68,68,0.15)',
    colorBorder: 'rgba(239,68,68,0.3)',
    icon: 'AlertTriangle',
    gradient: 'from-red-600/20 to-red-900/10',
  },
]

/**
 * Example startup ideas shown as quick-pick chips below the textarea.
 */
export const EXAMPLE_IDEAS = [
  '🏢 HRMS platform for remote-first companies',
  '🛒 AI-powered personal shopper for fashion',
  '🏥 Telemedicine app for rural India',
  '🎓 Peer-to-peer skill exchange marketplace',
  '🚗 EV fleet management SaaS',
  '🍽️ Ghost kitchen operating system',
  '💰 Micro-investment platform for Gen Z',
  '🌱 Carbon credit marketplace for SMBs',
]

/**
 * Score metric labels for the radar chart.
 */
export const SCORE_METRICS = [
  { key: 'feasibility',      label: 'Feasibility' },
  { key: 'market_size',      label: 'Market Size' },
  { key: 'differentiation',  label: 'Differentiation' },
  { key: 'team_fit',         label: 'Team Fit' },
  { key: 'innovation',       label: 'Innovation' },
  { key: 'execution',        label: 'Execution' },
]

/**
 * Backend base URL — reads from env, falls back to localhost.
 */
export const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : ''

/**
 * FALLBACK_DATA — kept as empty neutral base.
 * tailorFallback.js builds all demo content from scratch based on the idea,
 * so this is no longer used directly. Exported for backwards compatibility.
 */
export const FALLBACK_DATA = {}
