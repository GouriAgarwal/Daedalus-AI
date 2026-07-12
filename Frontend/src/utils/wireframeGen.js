/**
 * Client-side wireframe HTML generator.
 * Mirrors backend wireframe_gen template logic so preview matches the UI agent spec.
 */

function safeId(name) {
  return String(name || 'screen').toLowerCase().replace(/[^\w]/g, '_')
}

function screenIcon(name) {
  const icons = {
    dashboard: '📊', employee: '👥', leave: '🗓', payroll: '💰',
    onboard: '🚀', settings: '⚙️', report: '📈', analytics: '📉',
    profile: '👤', chat: '💬', inbox: '📥', workflow: '⚡',
  }
  const lower = String(name || '').toLowerCase()
  for (const [key, icon] of Object.entries(icons)) {
    if (lower.includes(key)) return icon
  }
  return '📋'
}

export function normalizeScreens(uiSpec = {}) {
  const raw = uiSpec.screens || []
  const normalized = raw.map((screen, idx) => {
    if (typeof screen === 'string') {
      return { name: screen, components: [`${screen} content panel`, 'Action controls'] }
    }
    const components = screen.components
      || screen.key_components
      || (screen.purpose ? [screen.purpose] : [])
      || [`${screen.name || `Screen ${idx + 1}`} module`]
    return { name: screen.name || `Screen ${idx + 1}`, components }
  })

  if (normalized.length) return normalized
  return [
    { name: 'Dashboard', components: ['KPI cards', 'Activity feed', 'Quick actions'] },
    { name: 'Workspace', components: ['Search bar', 'Data table', 'Detail panel'] },
  ]
}

function kpiCards(screenName, idea) {
  const cards = [
    [`${screenName} Items`, '128', '+14 this week', '📊'],
    ['Active Users', '1.2K', '↑ 8% vs last month', '👥'],
    ['Pending Actions', '9', '3 urgent', '📋'],
    ['Completion Rate', '86%', 'Latest run', '✅'],
  ]
  if (idea) cards[0] = [`${screenName} KPI`, '128', `Tracking: ${idea.slice(0, 28)}`, '📊']

  const cardsHtml = cards.map(([label, val, sub, icon]) => `
    <div class="card p-5 flex items-start gap-4">
      <div class="text-2xl">${icon}</div>
      <div>
        <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">${label}</p>
        <p class="text-2xl font-bold text-white mt-1">${val}</p>
        <p class="text-xs text-slate-500 mt-1">${sub}</p>
      </div>
    </div>`).join('')

  return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${cardsHtml}</div>`
}

function dataTable(label, screenName, idea) {
  const seed = [screenName, (idea || 'Item').slice(0, 24)]
  const rows = [
    [`${seed[0]} Alpha`, 'Core', 'Active', 'Low', 'badge-green'],
    [`${seed[0]} Beta`, 'Growth', 'In Review', 'Medium', 'badge-blue'],
    [`${seed[1]} Pilot`, 'MVP', 'Active', 'Low', 'badge-green'],
    [`${seed[0]} Delta`, 'Ops', 'Blocked', 'High', 'badge-red'],
    [`${seed[1]} Launch`, 'GTM', 'Queued', 'Medium', 'badge-blue'],
  ]

  const rowsHtml = rows.map(([name, cat, status, priority, badge]) => `
    <tr class="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-semibold">${name[0]}</div>
        <span class="text-sm text-white">${name}</span>
      </td>
      <td class="px-4 py-3 text-sm text-slate-400">${cat}</td>
      <td class="px-4 py-3 text-sm text-slate-400">${status}</td>
      <td class="px-4 py-3"><span class="text-xs px-2.5 py-1 rounded-full font-medium ${badge}">${priority}</span></td>
      <td class="px-4 py-3"><button class="text-xs text-slate-400 hover:text-white transition-colors">View →</button></td>
    </tr>`).join('')

  return `
<div class="card overflow-hidden">
  <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
    <p class="text-sm font-semibold text-white">${label}</p>
    <span class="text-xs text-slate-500">5 records</span>
  </div>
  <table class="w-full">
    <thead>
      <tr class="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
        <th class="px-4 py-2 text-left">Name</th>
        <th class="px-4 py-2 text-left">Category</th>
        <th class="px-4 py-2 text-left">Status</th>
        <th class="px-4 py-2 text-left">Priority</th>
        <th class="px-4 py-2 text-left">Action</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>`
}

function calendarBlock(screenName) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayHeaders = days.map((d) => `<div class="text-xs text-slate-500 font-medium py-1">${d}</div>`).join('')
  const cells = Array.from({ length: 31 }, (_, i) => {
    const cls = [3, 4, 10, 11, 17].includes(i)
      ? 'bg-indigo-500/20 text-indigo-300'
      : [5, 6, 12].includes(i)
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'text-slate-400 hover:bg-slate-700 cursor-pointer'
    return `<div class="text-xs py-2 rounded-lg ${cls}">${i + 1}</div>`
  }).join('')

  return `
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-4">📅 ${screenName} Calendar</p>
  <div class="grid grid-cols-7 gap-1 text-center">${dayHeaders}${cells}</div>
</div>`
}

function chartBlock(primary, screenName) {
  const bars = [65, 80, 45, 90, 72, 55, 88, 60, 75, 50, 95, 70]
  const barsHtml = bars.map((h, i) =>
    `<div class="flex-1 rounded-t-sm" style="height:${h}%; background:${primary}; opacity:${(0.4 + i * 0.05).toFixed(2)};"></div>`
  ).join('')

  return `
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-4">📈 ${screenName} Trends</p>
  <div class="flex items-end gap-1 h-32">${barsHtml}</div>
</div>`
}

function panelBlock(label, idea) {
  return `
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-3">${label}</p>
  <div class="space-y-3">
    <div class="flex justify-between items-center text-sm">
      <span class="text-slate-400">Workflow step</span>
      <span class="text-white font-medium">Ready</span>
    </div>
    <div class="flex justify-between items-center text-sm">
      <span class="text-slate-400">Context</span>
      <span class="text-white font-medium">${(idea || 'Current item').slice(0, 32)}</span>
    </div>
    <button class="w-full py-2 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">Confirm Action</button>
  </div>
</div>`
}

function searchBar(screenName, idea) {
  const placeholder = idea
    ? `Search ${idea.slice(0, 28).toLowerCase()}...`
    : `Search ${String(screenName).toLowerCase()}...`
  return `
<div class="flex gap-3">
  <div class="flex-1 relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
    <input type="text" placeholder="${placeholder}" class="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
  </div>
  <button class="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-colors">Filters ⌄</button>
</div>`
}

function genericBlock(label, primary, idea) {
  return `
<div class="card p-5 border-l-4" style="border-left-color:${primary};">
  <p class="text-sm font-semibold text-white mb-1">${label}</p>
  <p class="text-xs text-slate-500">${(idea || 'Component rendered from UI spec').slice(0, 72)}</p>
  <div class="mt-3 h-16 rounded-lg bg-slate-700/50 flex items-center justify-center">
    <span class="text-xs text-slate-500">Interactive component area</span>
  </div>
</div>`
}

function renderComponent(comp, primary, screenName, idea) {
  const lower = comp.toLowerCase()
  if (lower.includes('kpi') || lower.includes('card') || lower.includes('metric')) return kpiCards(screenName, idea)
  if (lower.includes('table') || lower.includes('list') || lower.includes('directory')) return dataTable(comp, screenName, idea)
  if (lower.includes('calendar')) return calendarBlock(screenName)
  if (lower.includes('chart') || lower.includes('heatmap') || lower.includes('analytics')) return chartBlock(primary, screenName)
  if (lower.includes('modal') || lower.includes('panel')) return panelBlock(comp, idea)
  if (lower.includes('search') || lower.includes('filter')) return searchBar(screenName, idea)
  return genericBlock(comp, primary, idea)
}

/**
 * Generate a self-contained HTML wireframe from the UI agent spec.
 * @param {Object} uiSpec
 * @param {string} idea
 */
export function generateWireframeHtml(uiSpec = {}, idea = 'Startup') {
  const ds = uiSpec.design_system || uiSpec.visual_style || {}
  const primary = ds.primary_color || (Array.isArray(ds.colors) ? ds.colors[0] : '#6366F1') || '#6366F1'
  const accent = ds.accent_color || '#10B981'
  const font = ds.font || ds.typography || 'Inter'
  const screens = normalizeScreens(uiSpec)
  const flows = uiSpec.key_user_flows || uiSpec.wireframe_notes || []
  const productLabel = idea.length > 40 ? `${idea.slice(0, 39)}…` : idea

  const navItems = screens.map((s) => {
    const id = safeId(s.name)
    return `
      <button onclick="showScreen('${id}', this)" class="nav-btn w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all" data-screen="${id}">
        ${screenIcon(s.name)} ${s.name}
      </button>`
  }).join('')

  const panels = screens.map((s) => {
    const id = safeId(s.name)
    const blocks = (s.components || []).map((comp) => renderComponent(comp, primary, s.name, idea)).join('')
    return `
<div id="${id}" class="screen-panel">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-white">${s.name}</h1>
    <button class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:${primary};">+ New</button>
  </div>
  <div class="space-y-5">${blocks}</div>
</div>`
  }).join('')

  const flowsHtml = flows.map((flow) =>
    `<li class="flex items-start gap-2 text-sm text-slate-400"><span class="text-emerald-400 mt-0.5">→</span>${flow}</li>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${productLabel} — Wireframe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=${String(font).replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --primary: ${primary}; --accent: ${accent}; }
    * { font-family: '${font}', sans-serif; }
    body { background: #0f172a; margin: 0; }
    .nav-btn.active { background: color-mix(in srgb, var(--primary) 20%, transparent); color: white; border-left: 3px solid var(--primary); }
    .screen-panel { display: none; }
    .screen-panel.active { display: block; }
    .badge-green { background: rgba(16,185,129,0.15); color: #10b981; }
    .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-blue { background: rgba(99,102,241,0.15); color: #818cf8; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style="background:var(--primary);">AI</div>
      <span class="text-white font-semibold text-sm">${productLabel}</span>
      <span class="text-xs px-2 py-0.5 rounded-full badge-blue">Wireframe Preview</span>
    </div>
  </header>
  <div class="flex pt-14 min-h-screen">
    <aside class="fixed left-0 top-14 bottom-0 w-56 bg-slate-900 border-r border-slate-700 flex flex-col p-4 gap-1 overflow-y-auto">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">Navigation</p>
      ${navItems}
      <div class="mt-auto pt-4 border-t border-slate-700">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">Key Flows</p>
        <ul class="space-y-2 px-1">${flowsHtml}</ul>
      </div>
    </aside>
    <main class="ml-56 flex-1 p-6 min-h-screen overflow-y-auto">${panels}</main>
  </div>
  <script>
    const navBtns = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.screen-panel');
    function showScreen(screenId, btn) {
      panels.forEach(p => p.classList.remove('active'));
      navBtns.forEach(b => b.classList.remove('active'));
      const target = document.getElementById(screenId);
      if (target) target.classList.add('active');
      if (btn) btn.classList.add('active');
    }
    if (navBtns.length) navBtns[0].classList.add('active');
    if (panels.length) panels[0].classList.add('active');
  </script>
</body>
</html>`
}
