/**
 * AnimatedBackground — Full-screen interactive 3D network background (Vanta.js NET)
 * with robust ref bindings, async script sequencing, and a starry fallback system.
 */
import { useEffect, useRef, useState } from 'react'

const BLOBS = [
  { color: '#7C3AED', size: 700, x: '10%',  y: '20%',  delay: '0s',    duration: '14s' },
  { color: '#38BDF8', size: 500, x: '75%',  y: '10%',  delay: '2s',    duration: '18s' },
  { color: '#EC4899', size: 400, x: '60%',  y: '60%',  delay: '4s',    duration: '12s' },
  { color: '#7C3AED', size: 350, x: '20%',  y: '75%',  delay: '6s',    duration: '20s' },
  { color: '#22C55E', size: 300, x: '85%',  y: '80%',  delay: '3s',    duration: '16s' },
]

export default function AnimatedBackground() {
  const vantaRef = useRef(null)
  const canvasRef = useRef(null)
  const [vantaInitialized, setVantaInitialized] = useState(false)

  // Star & Comet Fallback effect — active only if Vanta fails or is loading
  useEffect(() => {
    if (vantaInitialized) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    const comets = []
    let animFrame
    let tick = 0

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      stars.forEach((star) => {
        star.x += Math.cos(star.phase) * 0.08
        star.y -= Math.sin(star.phase) * 0.08
        
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        const alpha = star.alpha * (0.6 + 0.4 * Math.sin(tick * star.speed + star.phase))
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })

      if (Math.random() < 0.007 && comets.length < 3) {
        comets.push({
          x: Math.random() * (canvas.width * 0.5),
          y: Math.random() * (canvas.height * 0.5),
          vx: Math.random() * 3 + 2.5,
          vy: Math.random() * 1.5 + 1.2,
          length: Math.random() * 60 + 30,
          alpha: 1,
          color: Math.random() < 0.5 ? '#6366f1' : '#00f5d4'
        })
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]
        c.x += c.vx
        c.y += c.vy
        c.alpha -= 0.01

        if (c.alpha <= 0 || c.x > canvas.width || c.y > canvas.height) {
          comets.splice(i, 1)
          continue
        }

        const grad = ctx.createLinearGradient(
          c.x, c.y, 
          c.x - c.vx * (c.length / 5), 
          c.y - c.vy * (c.length / 5)
        )
        grad.addColorStop(0, `rgba(${c.color === '#6366f1' ? '99,102,241' : '0,245,212'},${c.alpha})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.beginPath()
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.moveTo(c.x, c.y)
        ctx.lineTo(c.x - c.vx * (c.length / 5), c.y - c.vy * (c.length / 5))
        ctx.stroke()
      }

      tick += 0.02
      animFrame = requestAnimationFrame(drawStars)
    }

    resize()
    window.addEventListener('resize', resize)
    drawStars()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [vantaInitialized])

  // Vanta NET script injector and initializer
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
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
        // 1. Load Three.js r134 (Vanta's required WebGL rendering dependency)
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
        }

        // Give Three.js compilation a slight breath window
        await new Promise((resolve) => setTimeout(resolve, 50))

        // 2. Load Vanta Net script
        if (!window.VANTA) {
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js')
        }

        // Give Vanta script parsing a slight breath window
        await new Promise((resolve) => setTimeout(resolve, 50))

        // 3. Initialize Vanta.NET on container ref
        if (window.VANTA && window.VANTA.NET && vantaRef.current) {
          vantaEffect = window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x00f5d4,          // Neon Cyan nodes
            backgroundColor: 0x050816, // Matches #050816 deep navy
            points: 15.00,             // More node points
            maxDistance: 24.00,        // Wider range of links to follow mouse
            spacing: 14.00,            // Denser network grid
            showDots: true,
            mouseCoeff: 4.0,           // Very high hover response/sensitivity coefficient!
            speed: 2.0                 // Dynamic wave propagation speed
          })
          setVantaInitialized(true)
          console.log('[vanta] Vanta.NET initialized successfully!')
        }
      } catch (err) {
        console.error('[vanta] Initialization failed:', err)
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
      {/* Vanta 3D Container (using direct DOM Ref binding) */}
      <div
        ref={vantaRef}
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000"
        style={{ 
          opacity: vantaInitialized ? 0.75 : 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Fallback space drift canvas (shown if Vanta is offline or compiling) */}
      {!vantaInitialized && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Floating ambient blobs */}
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
            opacity: vantaInitialized ? 0.06 : 0.15,
          }}
        />
      ))}

      {/* Cybertech grid patterns */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Radial vignette spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, #050816 100%)',
        }}
      />
    </div>
  )
}
