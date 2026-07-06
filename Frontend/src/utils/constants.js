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
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Fallback demo data used when the API is unavailable.
 */
export const FALLBACK_DATA = {
  domain: 'HRMS',
  round1: {
    pm: {
      problem: 'Remote-first companies struggle with fragmented HR tools — payroll, attendance, and performance reviews live in silos.',
      solution: 'A unified HRMS platform with AI-powered insights, automated compliance, and seamless integrations.',
      target_users: 'SMBs with 50–500 employees operating remotely or in hybrid mode.',
      core_features: [
        'Smart onboarding workflows',
        'Real-time attendance & leave management',
        'AI performance review assistant',
        'Payroll automation with compliance checks',
        'Employee sentiment analytics',
      ],
      mvp_scope: 'Onboarding + Attendance + Payroll for a 3-month MVP',
      roadmap: ['M1: Core HRMS', 'M2: AI Assistant', 'M3: Analytics', 'M4: Marketplace integrations'],
    },
    ui: {
      design_system: { primary: '#7C3AED', font: 'Inter', theme: 'Dark with Light mode toggle' },
      screens: ['Login / SSO', 'Dashboard Overview', 'Employee Directory', 'Leave Calendar', 'Payroll Breakdown', 'Performance Review'],
      key_interactions: ['Drag-and-drop org chart', 'Inline editing in employee profiles', 'One-click payroll run'],
      component_library: 'Radix UI + Custom Tailwind',
    },
    backend: {
      architecture: 'Microservices on AWS — API Gateway → Lambda → RDS (PostgreSQL)',
      api_endpoints: [
        'POST /auth/sso',
        'GET /employees',
        'POST /payroll/run',
        'GET /attendance/:id',
        'POST /reviews/submit',
      ],
      database_schema: { employees: ['id', 'name', 'role', 'department', 'salary'], leaves: ['id', 'employee_id', 'type', 'status', 'dates'] },
      tech_stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Celery', 'S3'],
    },
    marketing: {
      gtm_strategy: 'Product-led growth: free tier up to 20 employees, then $8/seat/month.',
      channels: ['LinkedIn outreach to HR managers', 'SEO for "HRMS for remote teams"', 'Integrations with Slack & Notion'],
      competitive_positioning: 'Faster to deploy than Workday, smarter than BambooHR.',
      target_cac: '$120',
      target_ltv: '$1,800',
      messaging: 'The only HRMS that grows with your remote team.',
    },
  },
  round2_critique: {
    investor_concerns: [
      "HRMS is a crowded space \u2014 Workday, BambooHR, Rippling dominate. What's the unfair advantage?",
      'CAC of $120 seems optimistic for B2B SaaS targeting HR managers.',
    ],
    skeptic_flags: [
      'AI performance reviews risk regulatory pushback in the EU under GDPR.',
      'Payroll compliance across 50 states is a multi-year engineering problem, not a 3-month MVP.',
    ],
    revisions: {
      pm: {
        revised_mvp_scope: 'Cut payroll from MVP. Focus on onboarding + attendance + Slack integration.',
        differentiation: 'Target YC-backed startups exclusively — they have budget, no legacy HR system, and need speed.',
        updated_roadmap: ['M1: Onboarding + Attendance', 'M2: Performance OKRs', 'M3: Payroll lite', 'M4: Full payroll'],
      },
    },
  },
  startup_score: {
    feasibility: 7,
    market_size: 9,
    differentiation: 5,
    team_fit: 8,
    innovation: 6,
    execution: 7,
  },
}
