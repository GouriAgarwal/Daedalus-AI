/**
 * Tailor static fallback data to a specific startup idea (frontend mirror of backend).
 */
import { FALLBACK_DATA } from './constants'

function inferDomain(idea) {
  const lower = idea.toLowerCase()
  const map = {
    HRMS: ['hrms', 'hr ', 'human resource', 'payroll', 'employee', 'attendance'],
    Healthcare: ['health', 'medical', 'telemedicine', 'clinic', 'patient'],
    'E-commerce': ['shop', 'ecommerce', 'retail', 'fashion', 'marketplace'],
    EdTech: ['education', 'learning', 'course', 'student', 'tutor', 'skill'],
    FinTech: ['finance', 'invest', 'payment', 'banking', 'wallet'],
    Mobility: ['fleet', 'ev ', 'vehicle', 'transport', 'logistics'],
    FoodTech: ['food', 'kitchen', 'restaurant', 'meal'],
    Climate: ['carbon', 'climate', 'sustainability', 'green', 'energy'],
  }
  for (const [domain, keywords] of Object.entries(map)) {
    if (keywords.some((k) => lower.includes(k))) return domain
  }
  const words = idea.match(/[A-Za-z]{3,}/g)
  return words?.[0] ? words[0][0].toUpperCase() + words[0].slice(1) : 'Startup'
}

function shortLabel(idea, maxLen = 36) {
  const cleaned = idea.trim().replace(/\s+/g, ' ')
  return cleaned.length <= maxLen ? cleaned : `${cleaned.slice(0, maxLen - 1).trim()}…`
}

export function tailorFallbackForIdea(idea, base = FALLBACK_DATA) {
  const trimmed = idea?.trim() || 'A new startup idea'
  const domain = inferDomain(trimmed)
  const label = shortLabel(trimmed)

  const data = structuredClone(base)
  data.idea = trimmed
  data.domain = domain
  data.idea_context = {
    domain,
    audience: `Primary users interested in ${domain.toLowerCase()} solutions`,
    problem: `Existing tools do not solve the core need behind: ${trimmed}`,
    constraints: ['MVP-first delivery', 'Founder-led GTM'],
    keywords: (trimmed.match(/[A-Za-z]{4,}/g) || []).slice(0, 6).map((w) => w.toLowerCase()),
  }

  const round1 = data.round1 || {}
  round1.pm = {
    ...round1.pm,
    problem: `Teams in ${domain.toLowerCase()} still rely on fragmented tools when trying to deliver: ${trimmed}`,
    solution: `A focused ${domain} product that turns the idea into a usable MVP: ${trimmed}`,
    target_users: [`Early adopters in ${domain}`, 'Founders validating product-market fit'],
    core_features: [
      `Guided onboarding for ${domain.toLowerCase()} workflows`,
      'Dashboard with actionable KPIs',
      'Core workflow module',
      'Notifications and activity history',
      'Admin settings and role management',
    ],
    mvp_scope: `Ship the highest-value workflow for: ${trimmed}`,
    roadmap: ['M1: Core workflow + dashboard', 'M2: Collaboration + automation', 'M3: Analytics + integrations'],
  }

  round1.ui = {
    design_system: { primary: '#7C3AED', font: 'Inter', theme: 'Dark with light mode toggle' },
    screens: [
      {
        name: 'Dashboard',
        components: [`KPI cards for ${domain}`, `Recent activity for ${label}`, 'Quick-action panel'],
      },
      {
        name: `${domain} Workspace`,
        components: ['Search + filter bar', `Primary data table for ${label}`, 'Detail side panel'],
      },
      {
        name: 'Workflow',
        components: [`Step-by-step flow for ${domain.toLowerCase()} tasks`, 'Status tracker', 'Confirmation modal'],
      },
      {
        name: 'Settings',
        components: ['Profile settings', 'Team permissions', 'Integration toggles'],
      },
    ],
    key_interactions: [
      `User signs up → completes onboarding for ${label}`,
      `User performs the core ${domain.toLowerCase()} action → sees result on dashboard`,
    ],
    component_library: 'Radix UI + Tailwind CSS',
  }

  const entity = domain.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'core_entity'
  round1.backend = {
    architecture: `Modular FastAPI services for ${label}`,
    api_endpoints: ['POST /auth/login', `GET /${entity}`, `POST /${entity}`, 'GET /dashboard/summary'],
    database_schema: {
      users: ['id', 'email', 'role'],
      [entity]: ['id', 'name', 'status', 'owner_id'],
    },
    tech_stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Celery'],
  }

  round1.marketing = {
    gtm_strategy: `Product-led launch targeting early ${domain.toLowerCase()} adopters validating ${label}.`,
    competitive_positioning: `A faster, more focused alternative for teams building around: ${trimmed}`,
    channels: [`Community outreach in ${domain} forums`, 'Founder-led LinkedIn content', 'Pilot partnerships'],
    target_cac: '$90–$150',
    target_ltv: '$1,200+',
    messaging: `Launch ${label} without rebuilding your entire stack.`,
  }

  data.round1 = round1
  data.round2_critique = {
    investor_concerns: [
      `How defensible is this in the ${domain} market against incumbents?`,
      `What proof do you have that users will pay for ${label}?`,
    ],
    skeptic_flags: [
      `The idea may be too broad unless you narrow the first workflow for ${domain.toLowerCase()} users.`,
      "Differentiation needs to be sharper than 'AI-powered' positioning alone.",
    ],
    revisions: {
      pm: {
        revised_mvp_scope: `Narrow MVP to one killer workflow for ${label}.`,
        differentiation: `Own a single painful job-to-be-done in ${domain.toLowerCase()} before expanding scope.`,
      },
    },
  }

  return data
}
