/**
 * Utility helper functions used across the app.
 */

/**
 * Deep sleep for async/await usage.
 * @param {number} ms - Milliseconds to sleep
 */
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * Compute a single overall startup score from the scores object.
 * Uses weighted average.
 * @param {Object} scores - e.g. { feasibility: 7, market_size: 8, ... }
 * @returns {number} - 0 to 10
 */
export const computeOverallScore = (scores) => {
  if (!scores) return 0
  const weights = {
    feasibility: 0.2,
    market_size: 0.2,
    differentiation: 0.15,
    team_fit: 0.15,
    innovation: 0.15,
    execution: 0.15,
  }
  let total = 0
  let weightSum = 0
  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] != null) {
      total += scores[key] * weight
      weightSum += weight
    }
  }
  if (weightSum === 0) return 0
  return Math.round((total / weightSum) * 10) / 10
}

/**
 * Grade label for a score 0–10.
 * @param {number} score
 * @returns {{ grade: string, color: string }}
 */
export const getScoreGrade = (score) => {
  if (score >= 8.5) return { grade: 'Exceptional', color: '#22C55E' }
  if (score >= 7)   return { grade: 'Strong',      color: '#38BDF8' }
  if (score >= 5.5) return { grade: 'Promising',   color: '#F59E0B' }
  if (score >= 4)   return { grade: 'Risky',       color: '#F97316' }
  return                    { grade: 'Avoid',       color: '#EF4444' }
}

/**
 * Format bytes to a human-readable string.
 * @param {number} bytes
 */
export const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Truncate text to a max character count.
 * @param {string} text
 * @param {number} max
 */
export const truncate = (text, max = 120) => {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

/**
 * Convert a camelCase or snake_case key to a Title Case label.
 * @param {string} key
 */
export const toTitleCase = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Format the startup score object into recharts-compatible data.
 * @param {Object} scores
 * @returns {Array}
 */
export const formatRadarData = (scores) => {
  if (!scores) return []
  const labelMap = {
    feasibility: 'Feasibility',
    market_size: 'Market Size',
    differentiation: 'Differentiation',
    team_fit: 'Team Fit',
    innovation: 'Innovation',
    execution: 'Execution',
  }
  return Object.entries(scores).map(([key, value]) => ({
    metric: labelMap[key] || toTitleCase(key),
    score: value,
    fullMark: 10,
  }))
}

/**
 * Detect if the current device is mobile.
 */
export const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < 768
