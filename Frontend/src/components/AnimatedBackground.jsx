/**
 * AnimatedBackground — Full-screen animated gradient mesh with
 * floating blobs and a subtle noise texture. Renders behind all content.
 */
import { useEffect, useRef } from 'react'

const BLOBS = [
  { color: '#7C3AED', size: 700, x: '10%',  y: '20%',  delay: '0s',    duration: '14s' },
  { color: '#38BDF8', size: 500, x: '75%',  y: '10%',  delay: '2s',    duration: '18s' },
  { color: '#EC4899', size: 400, x: '60%',  y: '60%',  delay: '4s',    duration: '12s' },
  { color: '#7C3AED', size: 350, x: '20%',  y: '75%',  delay: '6s',    duration: '20s' },
  { color: '#22C55E', size: 300, x: '85%',  y: '80%',  delay: '3s',    duration: '16s' },
]

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  // Subtle star field canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      drawStars()
    }

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    let animFrame
    let tick = 0

    const comets = []

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw background stars
      stars.forEach((star) => {
        // Drift slowly in space flow
        star.x += Math.cos(star.phase) * 0.08
        star.y -= Math.sin(star.phase) * 0.08
        
        // Wrap around viewport boundaries
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

      // Randomly spawn a cyber comet shooting star (colored in brand colors)
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

      // Update and draw comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]
        c.x += c.vx
        c.y += c.vy
        c.alpha -= 0.01

        if (c.alpha <= 0 || c.x > canvas.width || c.y > canvas.height) {
          comets.splice(i, 1)
          continue
        }

        // Draw glowing comet trail line
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
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="gradient-bg noise" aria-hidden="true">
      {/* Animated blobs */}
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
          }}
        />
      ))}

      {/* Grid lines */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Star canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, #050816 100%)',
        }}
      />
    </div>
  )
}
