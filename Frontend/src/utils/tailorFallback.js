/**
 * Tailor static fallback data to a specific startup idea (frontend mirror of backend).
 * Builds from scratch — does NOT inherit HRMS-specific base data.
 */

function inferDomain(idea) {
  const lower = idea.toLowerCase()
  const map = {
    HRMS:         ['hrms', 'hr ', 'human resource', 'payroll', 'employee', 'attendance', 'onboarding'],
    Healthcare:   ['health', 'medical', 'telemedicine', 'clinic', 'patient', 'doctor', 'hospital', 'appointment'],
    'E-commerce': ['shop', 'ecommerce', 'e-commerce', 'retail', 'fashion', 'marketplace', 'store', 'product'],
    EdTech:       ['education', 'learning', 'course', 'student', 'tutor', 'skill', 'teach', 'school'],
    FinTech:      ['finance', 'invest', 'payment', 'banking', 'wallet', 'micro-investment', 'crypto', 'loan', 'insurance'],
    Mobility:     ['fleet', 'ev ', 'vehicle', 'transport', 'logistics', 'delivery', 'ride', 'driver'],
    FoodTech:     ['food', 'kitchen', 'restaurant', 'meal', 'recipe', 'dining', 'ghost kitchen'],
    Climate:      ['carbon', 'climate', 'sustainability', 'green', 'energy', 'emission', 'renewable'],
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

/** Domain-specific screen templates — idea-aware */
function screensForDomain(domain, label) {
  const templates = {
    Healthcare: [
      { name: 'Dashboard',     components: [`KPI cards for ${domain}`, 'Appointment status chart', 'Patient queue panel'] },
      { name: 'Appointments',  components: ['Calendar view', 'Search + filter bar', 'Booking confirmation modal'] },
      { name: 'Patient Records', components: [`Primary data table for ${label}`, 'Detail side panel', 'Medical history list'] },
      { name: 'Video Consult', components: ['Video call panel', 'Chat sidebar', 'Prescription panel'] },
      { name: 'Settings',      components: ['Profile settings', 'Clinic permissions', 'Integration toggles'] },
    ],
    'E-commerce': [
      { name: 'Dashboard',   components: [`KPI cards for ${domain}`, 'Revenue analytics chart', 'Recent orders table'] },
      { name: 'Products',    components: ['Search + filter bar', `Primary data table for ${label}`, 'Product detail panel'] },
      { name: 'Orders',      components: ['Order list table', 'Status filter bar', 'Order detail modal'] },
      { name: 'Customers',   components: [`KPI cards for ${domain}`, 'Customer directory table', 'Analytics chart'] },
      { name: 'Settings',    components: ['Store settings', 'Payment integrations', 'Shipping rules panel'] },
    ],
    EdTech: [
      { name: 'Dashboard',  components: [`KPI cards for ${domain}`, 'Progress analytics chart', 'Upcoming lessons list'] },
      { name: 'Courses',    components: ['Search + filter bar', `Primary data table for ${label}`, 'Course detail panel'] },
      { name: 'Students',   components: ['Student directory table', 'Analytics chart', 'Detail side panel'] },
      { name: 'Lessons',    components: ['Calendar view', 'Lesson content panel', 'Quiz modal'] },
      { name: 'Settings',   components: ['Profile settings', 'Certification panel', 'Integration toggles'] },
    ],
    FinTech: [
      { name: 'Dashboard',     components: [`KPI cards for ${domain}`, 'Portfolio analytics chart', 'Recent transactions table'] },
      { name: 'Portfolio',     components: ['Search + filter bar', `Primary data table for ${label}`, 'Asset detail panel'] },
      { name: 'Transactions',  components: ['Transaction list table', 'Search + filter bar', 'Transaction detail modal'] },
      { name: 'Analytics',     components: ['Analytics chart', 'Performance metrics table', 'Export panel'] },
      { name: 'Settings',      components: ['Account settings', 'Security panel', 'Linked accounts panel'] },
    ],
    HRMS: [
      { name: 'Dashboard',        components: [`KPI cards for ${domain}`, 'Attrition risk chart', 'Pending approvals table'] },
      { name: 'Employee Directory', components: ['Search + filter bar', `Primary data table for ${label}`, 'Detail side panel'] },
      { name: 'Leave Management', components: ['Calendar view', 'Pending approvals list', 'Policy configuration panel'] },
      { name: 'Payroll',          components: ['Monthly payroll table', 'Analytics chart', 'Tax breakdown modal'] },
      { name: 'Settings',         components: ['Profile settings', 'Team permissions', 'Integration toggles'] },
    ],
    Mobility: [
      { name: 'Dashboard',  components: [`KPI cards for ${domain}`, 'Fleet map panel', 'Active routes table'] },
      { name: 'Fleet',      components: ['Search + filter bar', `Primary data table for ${label}`, 'Vehicle detail panel'] },
      { name: 'Routes',     components: ['Route list table', 'Calendar view', 'Route detail modal'] },
      { name: 'Analytics',  components: ['Analytics chart', 'Fuel & performance table', 'Export panel'] },
      { name: 'Settings',   components: ['Account settings', 'Driver permissions', 'Integration toggles'] },
    ],
    FoodTech: [
      { name: 'Dashboard', components: [`KPI cards for ${domain}`, 'Orders analytics chart', 'Live orders table'] },
      { name: 'Menu',      components: ['Search + filter bar', `Primary data table for ${label}`, 'Item detail panel'] },
      { name: 'Orders',    components: ['Order list table', 'Status filter bar', 'Order detail modal'] },
      { name: 'Kitchen',   components: ['Live order queue panel', 'Status tracker', 'Confirmation modal'] },
      { name: 'Settings',  components: ['Restaurant settings', 'Delivery integrations', 'Tax panel'] },
    ],
    Climate: [
      { name: 'Dashboard',  components: [`KPI cards for ${domain}`, 'Emissions analytics chart', 'Recent transactions table'] },
      { name: 'Projects',   components: ['Search + filter bar', `Primary data table for ${label}`, 'Project detail panel'] },
      { name: 'Credits',    components: ['Credit portfolio table', 'Analytics chart', 'Transaction modal'] },
      { name: 'Reports',    components: ['Analytics chart', 'Compliance metrics table', 'Export panel'] },
      { name: 'Settings',   components: ['Account settings', 'Partner integrations', 'Audit panel'] },
    ],
  }
  return templates[domain] || [
    { name: 'Dashboard',  components: [`KPI cards for ${domain}`, `Recent activity for ${label}`, 'Quick-action panel'] },
    { name: `${domain} Workspace`, components: ['Search + filter bar', `Primary data table for ${label}`, 'Detail side panel'] },
    { name: 'Workflow',   components: [`Step-by-step flow for ${domain.toLowerCase()} tasks`, 'Status tracker', 'Confirmation modal'] },
    { name: 'Analytics',  components: ['Analytics chart', 'Performance metrics table', 'Export panel'] },
    { name: 'Settings',   components: ['Profile settings', 'Team permissions', 'Integration toggles'] },
  ]
}

/** Domain-specific color palette */
function colorForDomain(domain) {
  const colors = {
    HRMS:         { primary: '#6366F1', accent: '#10B981' },
    Healthcare:   { primary: '#06B6D4', accent: '#10B981' },
    'E-commerce': { primary: '#EC4899', accent: '#F59E0B' },
    EdTech:       { primary: '#8B5CF6', accent: '#10B981' },
    FinTech:      { primary: '#3B82F6', accent: '#F59E0B' },
    Mobility:     { primary: '#14B8A6', accent: '#F97316' },
    FoodTech:     { primary: '#F97316', accent: '#EF4444' },
    Climate:      { primary: '#22C55E', accent: '#84CC16' },
  }
  return colors[domain] || { primary: '#7C3AED', accent: '#10B981' }
}

export function tailorFallbackForIdea(idea) {
  const trimmed = idea?.trim() || 'A new startup idea'
  const domain  = inferDomain(trimmed)
  const label   = shortLabel(trimmed)
  const { primary, accent } = colorForDomain(domain)

  const screens = screensForDomain(domain, label)
  const entityName = domain.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'core_entity'

  return {
    idea: trimmed,
    domain,
    idea_context: {
      domain,
      audience: `Primary users interested in ${domain.toLowerCase()} solutions`,
      problem: `Existing tools do not solve the core need behind: ${trimmed}`,
      constraints: ['MVP-first delivery', 'Founder-led GTM'],
      keywords: (trimmed.match(/[A-Za-z]{4,}/g) || []).slice(0, 6).map((w) => w.toLowerCase()),
    },
    round1: {
      pm: {
        problem: `Teams in ${domain.toLowerCase()} still rely on fragmented tools when trying to deliver: ${trimmed}`,
        solution: `A focused ${domain} product that turns the idea into a usable MVP: ${trimmed}`,
        target_users: [
          `Early adopters in ${domain}`,
          'Founders validating product-market fit',
          'Operators who need a faster workflow',
        ],
        core_features: [
          `Guided onboarding for ${domain.toLowerCase()} workflows`,
          'Dashboard with actionable KPIs',
          'Core workflow module',
          'Notifications and activity history',
          'Admin settings and role management',
        ],
        mvp_features: [
          `Core workflow for ${label}`,
          'User dashboard',
          'Search and filtering',
          'Basic analytics',
          'Export/reporting',
        ],
        mvp_scope: `Ship the highest-value workflow for: ${trimmed}`,
        roadmap: [
          'M1: Core workflow + dashboard',
          'M2: Collaboration + automation',
          'M3: Analytics + integrations',
          'M4: Scale + monetization',
        ],
      },
      ui: {
        design_goal: `Clean, focused ${domain} SaaS interface tailored for: ${label}`,
        // Use primary_color key — wireframeGen.js reads this
        design_system: {
          primary_color: primary,
          accent_color:  accent,
          font:          'Inter',
          style:         'Clean SaaS with dark mode support',
        },
        screens,
        key_user_flows: [
          `User signs up → completes onboarding for ${label}`,
          `User performs the core ${domain.toLowerCase()} action → sees result on dashboard`,
          'Admin reviews activity → exports summary',
        ],
        key_interactions: [
          `User signs up → completes onboarding for ${label}`,
          `User performs the core ${domain.toLowerCase()} action → sees result on dashboard`,
        ],
        component_library: 'Radix UI + Tailwind CSS',
        wireframe_notes: [
          `Primary flow: onboarding → core ${domain.toLowerCase()} action → dashboard`,
          'Sidebar navigation with collapsible groups',
          'Command palette for power users (⌘K)',
        ],
      },
      backend: {
        architecture: `Modular FastAPI microservices for ${label}`,
        api_endpoints: [
          'POST /auth/login',
          `GET /${entityName}`,
          `POST /${entityName}`,
          'GET /dashboard/summary',
          'POST /workflows/run',
        ],
        services: [
          'auth-service',
          `${entityName}-service`,
          'workflow-service',
          'notification-service',
        ],
        database_schema: {
          users:      ['id', 'email', 'role', 'created_at'],
          [entityName]: ['id', 'name', 'status', 'owner_id', 'updated_at'],
          events:     ['id', 'entity_id', 'type', 'payload', 'created_at'],
        },
        tech_stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Celery'],
        tech_choices: {
          auth: 'JWT + OAuth2',
          queue: 'Redis + Celery',
          infra: 'Docker Compose (dev), Render (prod)',
        },
      },
      marketing: {
        gtm_strategy: `Product-led launch targeting early ${domain.toLowerCase()} adopters validating ${label}.`,
        competitive_positioning: `A faster, more focused alternative for teams building around: ${trimmed}`,
        channels: [
          `Community outreach in ${domain} forums`,
          'Founder-led LinkedIn content',
          `SEO around ${domain.toLowerCase()} workflow keywords`,
          'Pilot partnerships with 5 design partners',
        ],
        target_cac: '$90–$150',
        target_ltv: '$1,200+',
        messaging: `Launch ${label} without rebuilding your entire stack.`,
        launch_hook: `The team that turned '${label}' into a working MVP in weeks, not months`,
      },
    },
    round2_critique: {
      investor_concerns: [
        `How defensible is this in the ${domain} market against incumbents?`,
        `What proof do you have that users will pay for ${label}?`,
        `What is the realistic CAC for this ICP in the first 12 months?`,
      ],
      skeptic_flags: [
        `The idea may be too broad unless you narrow the first workflow for ${domain.toLowerCase()} users.`,
        "Integration and compliance requirements could slow MVP delivery.",
        "Differentiation needs to be sharper than 'AI-powered' positioning alone.",
      ],
      revisions: {
        pm: {
          revised_mvp_scope: `Narrow MVP to one killer workflow for ${label}.`,
          differentiation: `Own a single painful job-to-be-done in ${domain.toLowerCase()} before expanding scope.`,
          updated_roadmap: [
            `M1: Core workflow for ${label}`,
            'M2: Collaboration',
            'M3: Integrations',
            'M4: Advanced automation',
          ],
        },
      },
    },
    startup_score: {
      feasibility:      Math.min(10, Math.max(4, 6 + (trimmed.length % 4))),
      market_size:      Math.min(10, Math.max(4, 5 + (domain.length % 5))),
      differentiation:  Math.min(10, Math.max(4, 4 + (trimmed.length % 6))),
      team_fit:         Math.min(10, Math.max(4, 7 - (domain.length % 3))),
      innovation:       Math.min(10, Math.max(4, 5 + (trimmed.length % 5))),
      execution:        Math.min(10, Math.max(4, 6 + (domain.length % 4))),
    },
  }
}
