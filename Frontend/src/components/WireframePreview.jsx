/**
 * WireframePreview — Displays generated wireframe HTML inside an iframe
 * within a browser chrome mockup. Uses UI agent spec + idea for tailored preview.
 */
import { useState, useRef, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Maximize2, RefreshCw, X, ExternalLink, Layout } from 'lucide-react'
import { API_BASE } from '../utils/constants'
import { generateWireframeHtml } from '../utils/wireframeGen'

/**
 * @param {Object}  props
 * @param {string}  props.sessionId - Session ID to fetch wireframe from backend
 * @param {Object}  props.uiSpec    - UI Designer agent output
 * @param {string}  props.idea      - Original startup idea
 * @param {boolean} props.visible   - Whether to show this section
 */
export default function WireframePreview({ sessionId, uiSpec, idea, visible }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [reloadKey, setReloadKey]   = useState(0)
  const [liveHtml, setLiveHtml]     = useState(null)
  const iframeRef = useRef(null)

  const isLiveSession = sessionId && !sessionId.startsWith('demo:')
  const apiUrl = isLiveSession ? `${API_BASE}/export/wireframe?id=${sessionId}` : null

  const srcDoc = useMemo(
    () => generateWireframeHtml(uiSpec || {}, idea || 'Startup'),
    [uiSpec, idea]
  )

  useEffect(() => {
    if (visible && isLiveSession && apiUrl) {
      setLoading(true)
      fetch(apiUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.text()
        })
        .then((html) => {
          setLiveHtml(html)
          setLoading(false)
        })
        .catch((err) => {
          console.warn('Failed to fetch live wireframe, using local preview:', err)
          setLiveHtml(null)
          setLoading(false)
        })
    } else {
      setLiveHtml(null)
      setLoading(false)
    }
  }, [apiUrl, isLiveSession, visible, reloadKey])

  const activeHtml = liveHtml || srcDoc

  const productLabel = (idea || 'Startup').length > 40
    ? `${(idea || 'Startup').slice(0, 39)}…`
    : (idea || 'Startup')

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Layout size={15} style={{ color: '#22C55E' }} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Wireframe Preview</h2>
            <p className="text-white/40 text-xs">Generated from your UI Designer agent spec</p>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden border border-white/[0.07]"
          style={{ boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}>
          <div className="browser-bar">
            <div className="browser-dot bg-red-400/70" />
            <div className="browser-dot bg-yellow-400/70" />
            <div className="browser-dot bg-green-400/70" />

            <div className="flex-1 mx-3 h-5 rounded-md bg-white/[0.05] border border-white/[0.07]
                            flex items-center px-3">
              <span className="text-white/25 text-[10px] truncate">
                localhost:5173 · {productLabel} Wireframe
              </span>
            </div>

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

          <div className="relative" style={{ height: 480 }}>
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col gap-4 p-6">
                <div className="skeleton h-8 w-2/3" />
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
                <div className="skeleton h-48 rounded-xl" />
              </div>
            )}

            <iframe
              ref={iframeRef}
              key={reloadKey}
              srcDoc={activeHtml}
              title="Wireframe Preview"
              onLoad={handleLoad}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </motion.section>

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
            srcDoc={activeHtml}
            title="Wireframe Fullscreen"
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </>
  )
}
