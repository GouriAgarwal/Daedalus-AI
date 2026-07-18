/**
 * AnimatedBackground — Full-screen interactive 3D network background (Vanta.js NET)
 * with animated mesh blobs, noise overlays, and a radial vignette.
 */
import { useEffect, useState } from 'react'

const BLOBS = [
  { color: '#7C3AED', size: 700, x: '10%',  y: '20%',  delay: '0s',    duration: '14s' },
  { color: '#38BDF8', size: 500, x: '75%',  y: '10%',  delay: '2s',    duration: '18s' },
  { color: '#EC4899', size: 400, x: '60%',  y: '60%',  delay: '4s',    duration: '12s' },
  { color: '#7C3AED', size: 350, x: '20%',  y: '75%',  delay: '6s',    duration: '20s' },
  { color: '#22C55E', size: 300, x: '85%',  y: '80%',  delay: '3s',    duration: '16s' },
]

export default function AnimatedBackground() {
  const [vantaInitialized, setVantaInitialized] = useState(false)

  useEffect(() => {
    // Dynamic CDN script loader to inject Three.js and Vanta Net
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Prevent duplicate script elements
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) {
          resolve(existing)
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.onload = () => resolve(script)
        script.onerror = () => reject(new Error(`Script load failed: ${src}`))
        document.body.appendChild(script)
      })
    }

    let vantaEffect = null

    const initVantaNet = async () => {
      try {
        // Load Three.js r134 (Vanta's preferred version)
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
        }
        // Load Vanta Net
        if (!window.VANTA) {
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js')
        }

        // Initialize 3D Net node grid on the background container
        if (window.VANTA && window.VANTA.NET) {
          vantaEffect = window.VANTA.NET({
            el: '#vanta-net-bg',
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x00f5d4,          // Neon Cyan nodes
            backgroundColor: 0x050816, // Matches #050816 deep navy
            points: 12.00,             // Number of node points
            maxDistance: 22.00,        // Link range
            spacing: 16.00             // Grid spacing density
          })
          setVantaInitialized(true)
        }
      } catch (err) {
        console.error('[vanta] Failed to initialize 3D net background:', err)
      }
    }

    initVantaNet()

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [])

  return (
    <div className="gradient-bg noise" aria-hidden="true">
      {/* 3D Network canvas wrapper */}
      <div
        id="vanta-net-bg"
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: vantaInitialized ? 0.45 : 0 }}
      />

      {/* Floating backup mesh blobs */}
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="gradient-blob"
          style={{
            width:  blob.size,
            height: blob.size,
            left:   blob.x,
            top:    blob.y,
            background: blob.color,
            animationDelay:    blob.delay,
            animationDuration: blob.duration,
            opacity: vantaInitialized ? 0.08 : 0.15, // Tone down blobs when 3D is active
          }}
        />
      ))}

      {/* High-tech grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Radial vignette mask for card container focus */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, #050816 100%)',
        }}
      />
    </div>
  )
}
