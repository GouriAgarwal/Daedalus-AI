/**
 * WireframePreview — Displays generated wireframe HTML inside an iframe
 * within a browser chrome mockup. Includes fullscreen, reload, and loading shimmer.
 */
import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Maximize2, RefreshCw, X, ExternalLink, Layout } from 'lucide-react'
import { API_BASE } from '../utils/constants'

const SAMPLE_WIREFRAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>HRMS Dashboard — Wireframe</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { background: #0f172a; color: #e2e8f0; font-family: Inter, sans-serif; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
  .nav { background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .stat { background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 10px; }
  .btn { background: #7c3aed; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .tag { background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2); border-radius: 99px; padding: 2px 10px; font-size: 11px; color: #38bdf8; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #38bdf8); }
  .bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; }
  .bar-fill { height: 100%; background: #7c3aed; border-radius: 99px; }
  .sidebar { background: rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.07); }
  .nav-item { padding: 8px 12px; border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.6); cursor: pointer; }
  .nav-item.active { background: rgba(124,58,237,0.15); color: #c4b5fd; }
  .input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #e2e8f0; width: 100%; }
</style>
</head>
<body>
<div style="display:flex; height:100vh; overflow:hidden;">
  <!-- Sidebar -->
  <div class="sidebar" style="width:220px; padding:20px 12px; display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
    <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; margin-bottom:16px;">
      <div style="width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#38bdf8); display:flex; align-items:center; justify-content:center; font-size:14px;">⚡</div>
      <span style="font-weight:700; font-size:14px;">HRFlow</span>
    </div>
    <div class="nav-item active">🏠 Dashboard</div>
    <div class="nav-item">👤 Employees</div>
    <div class="nav-item">📅 Attendance</div>
    <div class="nav-item">💰 Payroll</div>
    <div class="nav-item">⭐ Performance</div>
    <div class="nav-item">📊 Analytics</div>
    <div class="nav-item">⚙️ Settings</div>
  </div>

  <!-- Main content -->
  <div style="flex:1; overflow-y:auto; padding:24px;">
    <!-- Top bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <div>
        <h1 style="font-size:20px; font-weight:700; margin:0;">Dashboard</h1>
        <p style="font-size:12px; color:rgba(255,255,255,0.4); margin:2px 0 0;">Monday, July 7, 2026</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <input class="input" placeholder="Search employees..." style="width:200px;" />
        <button class="btn">+ Add Employee</button>
        <div class="avatar"></div>
      </div>
    </div>

    <!-- Stats row -->
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px;">
      <div class="stat" style="padding:16px;">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:8px;">TOTAL EMPLOYEES</div>
        <div style="font-size:28px; font-weight:800; color:#c4b5fd;">248</div>
        <div style="font-size:11px; color:#22c55e; margin-top:4px;">↑ 12 this month</div>
      </div>
      <div class="stat" style="padding:16px; background:rgba(56,189,248,0.08); border-color:rgba(56,189,248,0.2);">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:8px;">ON LEAVE TODAY</div>
        <div style="font-size:28px; font-weight:800; color:#38bdf8;">14</div>
        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:4px;">5.6% of workforce</div>
      </div>
      <div class="stat" style="padding:16px; background:rgba(34,197,94,0.08); border-color:rgba(34,197,94,0.2);">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:8px;">PAYROLL DUE</div>
        <div style="font-size:28px; font-weight:800; color:#22c55e;">$284K</div>
        <div style="font-size:11px; color:#f59e0b; margin-top:4px;">Due in 3 days</div>
      </div>
      <div class="stat" style="padding:16px; background:rgba(236,72,153,0.08); border-color:rgba(236,72,153,0.2);">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:8px;">AVG PERF SCORE</div>
        <div style="font-size:28px; font-weight:800; color:#ec4899;">8.4</div>
        <div style="font-size:11px; color:#22c55e; margin-top:4px;">↑ 0.3 vs last quarter</div>
      </div>
    </div>

    <!-- 2-col layout -->
    <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:20px; margin-bottom:20px;">
      <!-- Recent employees -->
      <div class="card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-size:14px; font-weight:600; margin:0;">Recent Employees</h3>
          <span style="font-size:12px; color:#7c3aed; cursor:pointer;">View all →</span>
        </div>
        ${[
          ['Priya Sharma', 'Product Manager', 'Engineering', '95%'],
          ['Arjun Mehta', 'Backend Engineer', 'Engineering', '88%'],
          ['Kavya Nair', 'UI/UX Designer', 'Design', '92%'],
          ['Rohit Das', 'Marketing Lead', 'Growth', '79%'],
          ['Meera Patel', 'Data Analyst', 'Analytics', '84%'],
        ].map(([name, role, dept, perf]) => `
          <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            <div class="avatar" style="flex-shrink:0;"></div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:500;">${name}</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.4);">${role}</div>
            </div>
            <span class="tag">${dept}</span>
            <div style="text-align:right; flex-shrink:0;">
              <div style="font-size:12px; font-weight:600; color:#22c55e;">${perf}</div>
              <div style="font-size:10px; color:rgba(255,255,255,0.3);">perf</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Department breakdown -->
      <div class="card" style="padding:20px;">
        <h3 style="font-size:14px; font-weight:600; margin:0 0 16px;">Department Breakdown</h3>
        ${[
          ['Engineering', 88, '#7c3aed'],
          ['Design', 45, '#38bdf8'],
          ['Marketing', 34, '#ec4899'],
          ['Sales', 52, '#22c55e'],
          ['Operations', 29, '#f59e0b'],
        ].map(([name, count, color]) => `
          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="font-size:12px; color:rgba(255,255,255,0.7);">${name}</span>
              <span style="font-size:12px; font-weight:600; color:${color};">${count}</span>
            </div>
            <div class="bar"><div class="bar-fill" style="width:${Math.round(count/88*100)}%; background:${color};"></div></div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Upcoming leaves -->
    <div class="card" style="padding:20px;">
      <h3 style="font-size:14px; font-weight:600; margin:0 0 16px;">Upcoming Leave Requests</h3>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">
        ${[
          ['Priya S.', 'Annual Leave', 'Jul 10–14', 'Pending'],
          ['Arjun M.', 'Sick Leave', 'Jul 8', 'Approved'],
          ['Kavya N.', 'Maternity', 'Aug 1–Sep 30', 'Approved'],
        ].map(([name, type, dates, status]) => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px;">
            <div style="font-size:13px; font-weight:500; margin-bottom:4px;">${name}</div>
            <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-bottom:8px;">${type} · ${dates}</div>
            <span style="font-size:10px; font-weight:600; padding:2px 8px; border-radius:99px;
              background:${status==='Approved'?'rgba(34,197,94,0.12)':'rgba(245,158,11,0.12)'};
              color:${status==='Approved'?'#22c55e':'#f59e0b'};
              border:1px solid ${status==='Approved'?'rgba(34,197,94,0.3)':'rgba(245,158,11,0.3)'};">${status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>
</body>
</html>`

/**
 * @param {Object}  props
 * @param {string}  props.sessionId - Session ID to fetch wireframe from backend
 * @param {boolean} props.visible   - Whether to show this section
 */
export default function WireframePreview({ sessionId, visible }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [reloadKey, setReloadKey]   = useState(0)
  const iframeRef = useRef(null)

  // In demo mode we use the inline HTML; with a real backend use the API URL
  const srcDoc = SAMPLE_WIREFRAME_HTML
  // Only construct a real API URL when the session was issued by the live
  // backend (session IDs starting with 'demo:' are local placeholders).
  const isLiveSession = sessionId && !sessionId.startsWith('demo:')
  const apiUrl = isLiveSession ? `${API_BASE}/export/wireframe?id=${sessionId}` : null

  const handleLoad = () => setLoading(false)
  const handleReload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  if (!visible) return null

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl mx-auto px-4"
        aria-label="Wireframe Preview"
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Layout size={15} style={{ color: '#22C55E' }} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Wireframe Preview</h2>
            <p className="text-white/40 text-xs">Generated by UI Designer Agent</p>
          </div>
        </div>

        {/* Browser chrome */}
        <div className="glass rounded-2xl overflow-hidden border border-white/[0.07]"
          style={{ boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}>
          {/* Browser bar */}
          <div className="browser-bar">
            {/* Traffic lights */}
            <div className="browser-dot bg-red-400/70" />
            <div className="browser-dot bg-yellow-400/70" />
            <div className="browser-dot bg-green-400/70" />

            {/* URL bar */}
            <div className="flex-1 mx-3 h-5 rounded-md bg-white/[0.05] border border-white/[0.07]
                            flex items-center px-3">
              <span className="text-white/25 text-[10px] truncate">
                localhost:5173 · HRMS Dashboard Wireframe
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleReload}
                className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center
                           text-white/40 hover:text-white transition-all"
                title="Reload"
                aria-label="Reload wireframe"
              >
                <RefreshCw size={11} />
              </button>
              <button
                onClick={() => setFullscreen(true)}
                className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center
                           text-white/40 hover:text-white transition-all"
                title="Fullscreen"
                aria-label="View fullscreen"
              >
                <Maximize2 size={11} />
              </button>
              {apiUrl && (
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center
                             text-white/40 hover:text-white transition-all"
                  title="Open in new tab"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Iframe */}
          <div className="relative" style={{ height: 480 }}>
            {/* Loading shimmer */}
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col gap-4 p-6">
                <div className="skeleton h-8 w-2/3" />
                <div className="grid grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
                <div className="skeleton h-48 rounded-xl" />
              </div>
            )}

            <iframe
              ref={iframeRef}
              key={reloadKey}
              srcDoc={srcDoc}
              title="Wireframe Preview"
              onLoad={handleLoad}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </motion.section>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Monitor size={14} />
              Wireframe — Fullscreen
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center
                         text-white/60 hover:text-white transition-all"
              aria-label="Close fullscreen"
            >
              <X size={16} />
            </button>
          </div>
          <iframe
            key={`fs-${reloadKey}`}
            srcDoc={srcDoc}
            title="Wireframe Fullscreen"
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </>
  )
}
