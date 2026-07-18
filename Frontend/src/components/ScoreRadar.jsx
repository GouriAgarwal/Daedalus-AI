/**
 * ScoreRadar — Animated radar chart with Recharts, overall score counter,
 * and grade badge. Renders startup_score data.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import CountUp from 'react-countup'
import { Target, TrendingUp } from 'lucide-react'
import { formatRadarData, computeOverallScore, getScoreGrade } from '../utils/helpers'

/**
 * @param {Object} props
 * @param {Object} props.scores - startup_score object
 */
export default function ScoreRadar({ scores }) {
  const [visible, setVisible] = useState(false)
  const [chartOpacity, setChartOpacity] = useState(0)

  useEffect(() => {
    if (!scores) return
    // Stagger the animations
    const t1 = setTimeout(() => setVisible(true), 100)
    const t2 = setTimeout(() => setChartOpacity(1), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [scores])

  if (!scores) return null

  const data         = formatRadarData(scores)
  const overall      = computeOverallScore(scores)
  const { grade, color: gradeColor } = getScoreGrade(overall)
  const circumference = 2 * Math.PI * 44 // r=44

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto px-4"
      aria-label="Startup Score"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.1)]"
          style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)' }}>
          <Target size={15} style={{ color: '#39FF14' }} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-base">Startup Score</h2>
          <p className="text-white/40 text-xs">AI-assessed across 6 dimensions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Overall score card */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center gap-4
                        border border-white/[0.07]">
          {/* Circular progress */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r="44"
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
              />
              {/* Progress */}
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke={gradeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (overall / 10) * circumference }}
                transition={{ duration: 1.6, delay: 0.3, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 8px ${gradeColor}88)` }}
              />
            </svg>

            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {visible ? (
                <span className="text-3xl font-black text-white">
                  <CountUp end={overall} decimals={1} duration={1.8} delay={0.3} />
                </span>
              ) : (
                <span className="text-3xl font-black text-white">—</span>
              )}
              <span className="text-white/40 text-xs">/10</span>
            </div>
          </div>

          {/* Grade badge */}
          <div>
            <div
              className="text-center px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: `${gradeColor}18`, color: gradeColor, border: `1px solid ${gradeColor}40` }}
            >
              {grade}
            </div>
          </div>

          {/* Individual score pills */}
          <div className="w-full space-y-2 mt-2">
            {data.map((item, i) => (
              <ScoreBar key={item.metric} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div
          className="lg:col-span-2 glass rounded-2xl p-6 border border-white/[0.07]"
          style={{ minHeight: 340 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: '#00F5D4' }} />
            <span className="text-white/60 text-sm">Score Radar</span>
          </div>

          <motion.div
            style={{ opacity: chartOpacity, transition: 'opacity 0.6s ease', height: 280 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#39FF14"
                  fill="#39FF14"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ fill: '#39FF14', r: 4, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(6,12,28,0.92)',
                    border: '1px solid rgba(57,255,20,0.3)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(20px)',
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: '#fff',
                    boxShadow: '0 0 20px rgba(57,255,20,0.2)',
                  }}
                  formatter={(value) => [`${value}/10`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

/* ── Score bar for individual metric ─────────────────────────────── */
function ScoreBar({ item, index }) {
  const pct = (item.score / 10) * 100

  const barColor =
    item.score >= 8 ? '#39FF14'
    : item.score >= 6 ? '#00F5D4'
    : item.score >= 4 ? '#F59E0B'
    : '#EF4444'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.06 }}
      className="flex items-center gap-2"
    >
      <span className="text-white/40 text-[10px] w-20 truncate shrink-0">{item.metric}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.6 + index * 0.06, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white/60 text-[10px] w-4 text-right shrink-0">{item.score}</span>
    </motion.div>
  )
}
