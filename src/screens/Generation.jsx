import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screen } from '../components.jsx'
import { GENERATION_STEPS } from '../data.js'

export default function Generation({ onComplete }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const progress = Math.min(((step + 1) / GENERATION_STEPS.length) * 100, 100)

  useEffect(() => {
    if (step < GENERATION_STEPS.length - 1) {
      const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 600 : 820)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => { setDone(true) }, 500)
      const t2 = setTimeout(() => onComplete(), 1800)
      return () => { clearTimeout(t); clearTimeout(t2) }
    }
  }, [step])

  const current = GENERATION_STEPS[step]
  const isLast = step === GENERATION_STEPS.length - 1

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 40px' }}>

        <motion.div
          animate={isLast ? { scale: [1, 1.08, 1], opacity: [1, 1, 1] } : {}}
          transition={{ duration: 0.6 }}
          style={{
            width: 48, height: 48,
            background: 'var(--ink-900)',
            borderRadius: 12,
            margin: '0 auto 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isLast ? (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              width="22" height="22" viewBox="0 0 22 22" fill="none"
            >
              <path d="M4 11.5l5 5 9-9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          ) : (
            <PulsingDots />
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.25,1,0.5,1] }}
          >
            <p style={{
              fontSize: isLast ? 20 : 17,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--ink-900)',
              marginBottom: 8,
              fontFamily: 'var(--font-display)',
            }}>
              {isLast ? 'Production ready.' : current.label + '…'}
            </p>
            {!isLast && current.sub && (
              <p style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.5 }}>
                {current.sub}
              </p>
            )}
            {isLast && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 13, color: 'var(--ink-400)' }}
              >
                Apple Vision Pro Executive Dinner — 6 workstreams · 37 tasks · 8 milestones
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ marginTop: 40, width: '100%' }}>
          <div style={{
            height: 2,
            background: 'var(--ink-100)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              style={{ height: '100%', background: 'var(--ink-900)', borderRadius: 2 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {GENERATION_STEPS.slice(0, -1).map((s, i) => (
              <motion.div
                key={i}
                animate={{ opacity: i <= step ? 1 : 0.25 }}
                style={{ fontSize: 10, color: 'var(--ink-400)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}

function PulsingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }}
        />
      ))}
    </div>
  )
}
