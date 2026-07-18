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
    color: '#00F5D4',
    colorLight: 'rgba(0,245,212,0.1)',
    colorBorder: 'rgba(0,245,212,0.25)',
    icon: 'LayoutDashboard',
    gradient: 'from-[#00F5D4]/20 to-teal-900/10',
  },
  {
    id: 'ui',
    name: 'UI Designer',
    shortName: 'UI/UX',
    role: 'Design & Experience',
    description: 'Creates wireframes, design systems, and user flows.',
    color: '#10B981',
    colorLight: 'rgba(16,185,129,0.1)',
    colorBorder: 'rgba(16,185,129,0.25)',
    icon: 'Palette',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
  },
  {
    id: 'backend',
    name: 'Backend Architect',
    shortName: 'Backend',
    role: 'Technical Architecture',
    description: 'Designs system architecture, APIs, and data models.',
    color: '#39FF14',
    colorLight: 'rgba(57,255,20,0.1)',
    colorBorder: 'rgba(57,255,20,0.25)',
    icon: 'Server',
    gradient: 'from-[#39FF14]/20 to-green-900/10',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    role: 'Growth & GTM',
    description: 'Crafts go-to-market strategy and growth channels.',
    color: '#A3E635',
    colorLight: 'rgba(163,230,53,0.1)',
    colorBorder: 'rgba(163,230,53,0.25)',
    icon: 'TrendingUp',
    gradient: 'from-lime-500/20 to-lime-900/10',
  },
  {
    id: 'investor',
    name: 'Investor',
    shortName: 'Investor',
    role: 'Due Diligence',
    description: 'Evaluates market opportunity, traction, and risks.',
    color: '#00F5D4',
    colorLight: 'rgba(0,245,212,0.1)',
    colorBorder: 'rgba(0,245,212,0.25)',
    icon: 'DollarSign',
    gradient: 'from-teal-600/20 to-teal-900/10',
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    shortName: 'Skeptic',
    role: "Devil's Advocate",
    description: 'Challenges assumptions and stress-tests the plan.',
    color: '#EF4444',
    colorLight: 'rgba(239,68,68,0.1)',
    colorBorder: 'rgba(239,68,68,0.25)',
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
