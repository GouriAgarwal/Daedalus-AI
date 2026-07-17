/**
 * Client-side wireframe HTML generator.
 * Fully self-contained — NO external CDN deps (Tailwind/Google Fonts are blocked
 * inside sandboxed iframes). All styles are inlined.
 */

function safeId(name) {
  return String(name || 'screen').toLowerCase().replace(/[^\w]/g, '_')
}

function screenIcon(name) {
  const icons = {
    dashboard:    '📊', employee:    '👥', leave:       '🗓', payroll:     '💰',
    onboard:      '🚀', settings:    '⚙️', report:      '📈', analytics:   '📉',
    profile:      '👤', chat:        '💬', inbox:       '📥', workflow:    '⚡',
    appointment:  '📅', patient:     '🏥', doctor:      '👨‍⚕️', consult:     '🩺',
    portfolio:    '💼', transaction: '💳', investment:  '📊', wallet:      '💵',
    product:      '📦', order:       '🛒', inventory:   '🗃️', customer:    '🤝',
    course:       '🎓', student:     '📚', lesson:      '✏️', quiz:        '❓',
    fleet:        '🚗', route:       '🗺️', driver:      '🚙', delivery:    '📦',
    restaurant:   '🍽️', menu:        '📋', kitchen:     '👨‍🍳', order2:      '🛎️',
    carbon:       '🌱', energy:      '⚡', emission:    '🌍', credit:      '💚',
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

function kpiCards(screenName, idea, primaryColor) {
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (str.charCodeAt(i) + (h << 5) - h) | 0;
    return Math.abs(h);
  };
  const ideaStr = idea || 'Startup';
  const val1 = hash(ideaStr + screenName) % 250 + 20;
  const val2 = ((hash(ideaStr) % 1500) / 10 + 10).toFixed(1);
  const val3 = hash(screenName + ideaStr) % 15 + 1;
  const val4 = 75 + (hash(ideaStr + "success") % 21);

  const cards = [
    [`Total ${screenName}s`, val1, `+${val1 % 12} this week`],
    ['Active Users', `${val2}K`, '↑ 8% vs last month'],
    ['Pending Tasks', val3, val3 > 8 ? 'Action required' : 'Monitor state'],
    ['System Health', `${val4}%`, 'Optimized'],
  ]
  if (idea) cards[0] = [`${screenName} KPI`, val1, `Scope: ${idea.slice(0, 20)}...`]

  const cardsHtml = cards.map(([label, val, sub]) => `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:4px;">
      <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0;">${label}</p>
      <p style="font-size:24px;font-weight:700;color:#f1f5f9;margin:4px 0 0;">${val}</p>
      <p style="font-size:11px;color:#64748b;margin:0;">${sub}</p>
    </div>`).join('')

  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">${cardsHtml}</div>`
}

function dataTable(label, screenName, idea) {
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (str.charCodeAt(i) + (h << 5) - h) | 0;
    return Math.abs(h);
  };
  
  const seed = [screenName, (idea || 'Item').slice(0, 24)]
  const statusOpts = ['Active', 'Pending', 'In Progress', 'Completed']
  const priorityOpts = ['Low', 'Medium', 'High']
  const colors = {
    'Active': ['#10b981', 'rgba(16,185,129,0.15)'],
    'Pending': ['#f59e0b', 'rgba(245,158,11,0.15)'],
    'In Progress': ['#818cf8', 'rgba(99,102,241,0.15)'],
    'Completed': ['#10b981', 'rgba(16,185,129,0.15)']
  }

  const rows = []
  for (let i = 0; i < 5; i++) {
    const num = hash(seed[1] + screenName + i);
    const rowName = `${seed[0]} ${String.fromCharCode(65 + i)}`
    const rowCat = num % 2 === 0 ? 'Core App' : 'Integration'
    const status = statusOpts[num % statusOpts.length]
    const priority = priorityOpts[num % priorityOpts.length]
    const [badgeColor, badgeBg] = colors[status] || ['#818cf8', 'rgba(99,102,241,0.15)']
    rows.push([rowName, rowCat, status, priority, badgeColor, badgeBg])
  }

  const rowsHtml = rows.map(([name, cat, status, priority, badgeColor, badgeBg]) => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-size:12px;color:#f1f5f9;font-weight:600;flex-shrink:0;">${name[0]}</div>
          <span style="font-size:13px;color:#f1f5f9;">${name}</span>
        </div>
      </td>
      <td style="padding:12px 16px;font-size:13px;color:#94a3b8;">${cat}</td>
      <td style="padding:12px 16px;font-size:13px;color:#94a3b8;">${status}</td>
      <td style="padding:12px 16px;"><span style="font-size:11px;padding:3px 10px;border-radius:999px;font-weight:600;color:${badgeColor};background:${badgeBg};">${priority}</span></td>
      <td style="padding:12px 16px;"><button style="font-size:12px;color:#94a3b8;background:none;border:none;cursor:pointer;">View →</button></td>
    </tr>`).join('')

  return `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden;">
  <div style="padding:12px 16px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:0;">${label}</p>
    <span style="font-size:11px;color:#64748b;">5 records</span>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="border-bottom:1px solid #334155;">
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Name</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Category</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Priority</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Action</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>`
}

function calendarBlock(screenName) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayHeaders = days.map((d) => `<div style="font-size:11px;color:#64748b;font-weight:600;padding:4px;text-align:center;">${d}</div>`).join('')
  const cells = Array.from({ length: 31 }, (_, i) => {
    let bg = 'transparent'; let color = '#94a3b8'
    if ([3, 4, 10, 11, 17].includes(i)) { bg = 'rgba(99,102,241,0.2)'; color = '#818cf8' }
    else if ([5, 6, 12].includes(i)) { bg = 'rgba(16,185,129,0.2)'; color = '#10b981' }
    return `<div style="font-size:11px;padding:8px 0;border-radius:8px;background:${bg};color:${color};text-align:center;cursor:pointer;">${i + 1}</div>`
  }).join('')

  return `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
  <p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:0 0 16px;">📅 ${screenName} Calendar</p>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${dayHeaders}${cells}</div>
</div>`
}

function chartBlock(primary, screenName) {
  const bars = [65, 80, 45, 90, 72, 55, 88, 60, 75, 50, 95, 70]
  const barsHtml = bars.map((h, i) =>
    `<div style="flex:1;border-radius:4px 4px 0 0;height:${h}%;background:${primary};opacity:${(0.4 + i * 0.05).toFixed(2)};min-width:0;"></div>`
  ).join('')

  return `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
  <p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:0 0 16px;">📈 ${screenName} Trends</p>
  <div style="display:flex;align-items:flex-end;gap:4px;height:128px;">${barsHtml}</div>
</div>`
}

function panelBlock(label, idea) {
  return `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
  <p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:0 0 12px;">${label}</p>
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:#94a3b8;">Workflow step</span>
      <span style="font-size:13px;color:#f1f5f9;font-weight:500;">Ready</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:#94a3b8;">Context</span>
      <span style="font-size:13px;color:#f1f5f9;font-weight:500;">${(idea || 'Current item').slice(0, 32)}</span>
    </div>
    <button style="width:100%;padding:8px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:#6366f1;border:none;cursor:pointer;">Confirm Action</button>
  </div>
</div>`
}

function searchBar(screenName, idea) {
  const placeholder = idea
    ? `Search ${idea.slice(0, 28).toLowerCase()}...`
    : `Search ${String(screenName).toLowerCase()}...`
  return `
<div style="display:flex;gap:12px;">
  <div style="flex:1;position:relative;">
    <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;font-size:14px;">🔍</span>
    <input type="text" placeholder="${placeholder}" style="width:100%;box-sizing:border-box;padding:10px 16px 10px 36px;background:#1e293b;border:1px solid #475569;border-radius:8px;font-size:13px;color:#f1f5f9;outline:none;" />
  </div>
  <button style="padding:10px 16px;background:#1e293b;border:1px solid #475569;border-radius:8px;font-size:13px;color:#94a3b8;cursor:pointer;white-space:nowrap;">Filters ⌄</button>
</div>`
}

function genericBlock(label, primary, idea) {
  return `
<div style="background:#1e293b;border:1px solid #334155;border-left:4px solid ${primary};border-radius:12px;padding:20px;">
  <p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:0 0 4px;">${label}</p>
  <p style="font-size:12px;color:#64748b;margin:0 0 12px;">${(idea || 'Component rendered from UI spec').slice(0, 72)}</p>
  <div style="height:64px;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;">
    <span style="font-size:12px;color:#475569;">Interactive component area</span>
  </div>
</div>`
}

function renderComponent(comp, primary, screenName, idea) {
  const lower = comp.toLowerCase()
  if (lower.includes('kpi') || lower.includes('card') || lower.includes('metric')) return kpiCards(screenName, idea, primary)
  if (lower.includes('table') || lower.includes('list') || lower.includes('directory')) return dataTable(comp, screenName, idea)
  if (lower.includes('calendar')) return calendarBlock(screenName)
  if (lower.includes('chart') || lower.includes('heatmap') || lower.includes('analytics') || lower.includes('trend')) return chartBlock(primary, screenName)
  if (lower.includes('modal') || lower.includes('panel') || lower.includes('confirmation')) return panelBlock(comp, idea)
  if (lower.includes('search') || lower.includes('filter')) return searchBar(screenName, idea)
  return genericBlock(comp, primary, idea)
}

/**
 * Generate a fully self-contained HTML wireframe from the UI agent spec.
 * No external CDN deps — safe for sandboxed iframes.
 * @param {Object} uiSpec
 * @param {string} idea
 */
export function generateWireframeHtml(uiSpec = {}, idea = 'Startup') {
  const ds = uiSpec.design_system || uiSpec.visual_style || {}
  // Support both 'primary_color' and 'primary' keys
  const primary = ds.primary_color || ds.primary || (Array.isArray(ds.colors) ? ds.colors[0] : null) || '#6366F1'
  const accent  = ds.accent_color  || ds.accent  || '#10B981'
  const screens  = normalizeScreens(uiSpec)
  const flows    = uiSpec.key_user_flows || uiSpec.key_interactions || uiSpec.wireframe_notes || []
  const productLabel = idea.length > 40 ? `${idea.slice(0, 39)}…` : idea

  const navItems = screens.map((s, idx) => {
    const id = safeId(s.name)
    const isFirst = idx === 0
    return `
      <button onclick="showScreen('${id}', this)" class="nav-btn" id="nav-${id}" style="${isFirst ? `background:color-mix(in srgb, ${primary} 20%, transparent);color:#fff;border-left:3px solid ${primary};` : ''}">
        ${screenIcon(s.name)}&nbsp;&nbsp;${s.name}
      </button>`
  }).join('')

  const panels = screens.map((s, idx) => {
    const id = safeId(s.name)
    const isFirst = idx === 0
    const blocks = (s.components || []).map((comp) => renderComponent(comp, primary, s.name, idea)).join('')
    return `
<div id="${id}" class="screen-panel" style="${isFirst ? 'display:block;' : 'display:none;'}">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
    <h1 style="font-size:22px;font-weight:700;color:#f1f5f9;margin:0;">${s.name}</h1>
    <button style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:${primary};border:none;cursor:pointer;">+ New</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px;">${blocks}</div>
</div>`
  }).join('')

  const flowsHtml = flows.map((flow) =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#94a3b8;line-height:1.5;"><span style="color:#10b981;flex-shrink:0;margin-top:2px;">→</span><span>${flow}</span></li>`
  ).join('')

  // Inline all CSS — no external deps
  const inlineCSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      background: #0f172a;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    button { font-family: inherit; }
    input { font-family: inherit; }
    header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
    }
    .header-logo {
      display: flex; align-items: center; gap: 12px;
    }
    .logo-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #fff;
      background: ${primary};
      flex-shrink: 0;
    }
    .logo-name { font-size: 14px; font-weight: 600; color: #f1f5f9; }
    .badge {
      font-size: 11px; padding: 2px 10px; border-radius: 999px; font-weight: 600;
      background: rgba(99,102,241,0.15); color: #818cf8;
    }
    .layout {
      display: flex;
      padding-top: 56px;
      min-height: 100vh;
    }
    aside {
      position: fixed; left: 0; top: 56px; bottom: 0; width: 220px;
      background: #0f172a;
      border-right: 1px solid #1e293b;
      display: flex; flex-direction: column;
      padding: 16px 12px;
      gap: 4px;
      overflow-y: auto;
    }
    .nav-label {
      font-size: 10px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 0 8px; margin-bottom: 4px; margin-top: 4px;
    }
    .nav-btn {
      width: 100%; text-align: left; padding: 9px 12px;
      border-radius: 8px; font-size: 13px; font-weight: 500;
      color: #94a3b8; background: transparent; border: none;
      cursor: pointer; border-left: 3px solid transparent;
      transition: background 0.15s, color 0.15s;
    }
    .nav-btn:hover { background: #1e293b; color: #f1f5f9; }
    .nav-divider { height: 1px; background: #1e293b; margin: 8px 0; }
    .flows-label {
      font-size: 10px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 0 8px; margin-bottom: 4px;
    }
    main {
      margin-left: 220px; flex: 1; padding: 24px;
      min-height: calc(100vh - 56px);
      overflow-y: auto;
    }
    .screen-panel { display: none; }
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${productLabel} — Wireframe</title>
  <style>${inlineCSS}</style>
</head>
<body>
  <header>
    <div class="header-logo">
      <div class="logo-icon">AI</div>
      <span class="logo-name">${productLabel}</span>
      <span class="badge">Wireframe</span>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <span style="font-size:12px;color:#475569;">${screens.length} screens</span>
      <span style="width:6px;height:6px;border-radius:50%;background:${accent};display:inline-block;"></span>
      <span style="font-size:12px;color:#475569;">Live preview</span>
    </div>
  </header>

  <div class="layout">
    <aside>
      <p class="nav-label">Navigation</p>
      ${navItems}
      ${flows.length > 0 ? `
      <div class="nav-divider"></div>
      <p class="flows-label">Key Flows</p>
      <ul style="list-style:none;padding:0 8px;display:flex;flex-direction:column;gap:8px;">
        ${flowsHtml}
      </ul>` : ''}
    </aside>

    <main>
      ${panels}
    </main>
  </div>

  <script>
    function showScreen(screenId, btn) {
      document.querySelectorAll('.screen-panel').forEach(function(p) { p.style.display = 'none'; });
      document.querySelectorAll('.nav-btn').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color = '#94a3b8';
        b.style.borderLeft = '3px solid transparent';
      });
      var target = document.getElementById(screenId);
      if (target) target.style.display = 'block';
      if (btn) {
        btn.style.background = 'color-mix(in srgb, ${primary} 20%, transparent)';
        btn.style.color = '#fff';
        btn.style.borderLeft = '3px solid ${primary}';
      }
    }
  </script>
</body>
</html>`
}
