import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { signInWithGoogle } from '../auth/google.js'

/* ─────────────────────────────────────────────────────────
   Login calls signInWithGoogle(email) from auth/google.js.
   In prototype mode that module simulates the OAuth round-trip
   and derives the user's name from the email they typed.
   In production, set VITE_GOOGLE_CLIENT_ID in .env and the
   real Google Workspace flow activates automatically.
   ───────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
   Ambient canvas background
   Three warm-stone radial gradients drifting very slowly.
   Replace entirely with a <video autoPlay muted loop playsInline>
   when the cinematic background is ready — same absolute
   positioning, same z-index, no other changes needed.
   ───────────────────────────────────────────────────────── */
function AmbientBackground() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const orbs = [
      { cx:0.18, cy:0.30, r:0.55, speed:0.00006, phase:0.00 },
      { cx:0.78, cy:0.65, r:0.48, speed:0.00004, phase:2.09 },
      { cx:0.50, cy:0.92, r:0.40, speed:0.00008, phase:4.19 },
    ]

    const draw = (ts) => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#13120F'
      ctx.fillRect(0, 0, W, H)

      orbs.forEach(o => {
        const dx  = Math.sin(ts * o.speed + o.phase) * 0.06
        const dy  = Math.cos(ts * o.speed * 0.7 + o.phase) * 0.04
        const cx  = (o.cx + dx) * W
        const cy  = (o.cy + dy) * H
        const rad = o.r * Math.min(W, H)
        const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0,   'rgba(210,195,165,0.055)')
        g.addColorStop(0.4, 'rgba(180,165,135,0.030)')
        g.addColorStop(1,   'rgba(180,165,135,0.000)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      })

      // Faint grain — depth without noise
      ctx.fillStyle = 'rgba(255,255,255,0.007)'
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 0.5)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }}/>
  )
}

/* ─────────────────────────────────────────────────────────
   Field wordmark
   ───────────────────────────────────────────────────────── */
function FieldMark({ opacity = 0.55 }) {
  return (
    <span style={{
      fontFamily:    'var(--font)',
      fontSize:      11,
      fontWeight:    700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color:         `rgba(255,255,255,${opacity})`,
    }}>Field</span>
  )
}

/* ─────────────────────────────────────────────────────────
   Spinner
   ───────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ animation:'_lspin 0.9s linear infinite', display:'block', flexShrink:0 }}>
      <style>{`@keyframes _lspin { to { transform:rotate(360deg) } }`}</style>
      <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.4" strokeDasharray="22" strokeDashoffset="8" strokeLinecap="round"/>
    </svg>
  )
}

const ST = { IDLE:'idle', LOADING:'loading', SUCCESS:'success', ERROR:'error' }

/* ─────────────────────────────────────────────────────────
   Login screen
   ───────────────────────────────────────────────────────── */
export default function Login({ onAuthenticated }) {
  const [email, setEmail]   = useState('')
  const [stage, setStage]   = useState(ST.IDLE)
  const [errMsg, setErrMsg] = useState('')
  const inputRef            = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const canSubmit = email.trim().length > 0 && stage === ST.IDLE

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!canSubmit) return
    setStage(ST.LOADING)
    setErrMsg('')
    try {
      const fullEmail = email.trim() + '@capecreative.co'
      const user = await signInWithGoogle(fullEmail)
      setStage(ST.SUCCESS)
      setTimeout(() => onAuthenticated(user), 520)
    } catch (err) {
      setStage(ST.ERROR)
      setErrMsg(err.message || 'Something went wrong. Try again.')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'var(--font)', overflow:'hidden' }}>

      <AmbientBackground/>

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* Topbar */}
        <div style={{ height:44, display:'flex', alignItems:'center', padding:'0 48px', flexShrink:0 }}>
          <FieldMark/>
        </div>

        {/* Two-column body */}
        <div style={{
          flex:    1,
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          maxWidth: 1160,
          margin:  '0 auto',
          width:   '100%',
          padding: '0 48px',
          alignItems: 'center',
          minHeight: 'calc(100vh - 44px - 56px)',
        }}>

          {/* Left — editorial statement */}
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.64, ease:[0.22,1,0.36,1] }}
            style={{ paddingRight:80 }}
          >
            <h1 style={{
              fontFamily:'var(--font-display)', fontSize:58, fontWeight:800,
              letterSpacing:'-0.03em', lineHeight:1.0,
              color:'rgba(255,255,255,0.90)', marginBottom:24,
            }}>
              Built for people who have{' '}
              <span style={{ color:'rgba(255,255,255,0.34)' }}>47 tabs open.</span>
            </h1>

            <p style={{
              fontSize:14, fontWeight:300, color:'rgba(255,255,255,0.30)',
              lineHeight:1.75, maxWidth:340,
            }}>
              The operating system for experiential production teams.
              Structured, connected, and built for the pace of the work.
            </p>
          </motion.div>

          {/* Right — sign-in form */}
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.56, delay:0.10, ease:[0.22,1,0.36,1] }}
          >
            <div style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: 4,
              padding:      '40px 36px 36px',
            }}>
              <p style={{
                fontSize:10, fontWeight:700, letterSpacing:'0.18em',
                textTransform:'uppercase', color:'rgba(255,255,255,0.22)',
                marginBottom:28,
              }}>Sign in</p>

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>

                {/* Email label + prefix input */}
                <div style={{ marginBottom:10 }}>
                  <label style={{
                    display:'block', fontSize:10, fontWeight:700,
                    letterSpacing:'0.13em', textTransform:'uppercase',
                    color:'rgba(255,255,255,0.28)', marginBottom:8,
                  }}>Work email</label>

                  {/* Split field: user types prefix, domain is fixed and visible */}
                  <div style={{
                    display:'flex', alignItems:'center',
                    height:44,
                    background: 'rgba(255,255,255,0.06)',
                    border:     `1px solid ${stage === ST.ERROR ? 'rgba(184,80,80,0.50)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 2,
                    overflow:'hidden',
                    transition: 'border-color 0.15s',
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={email}
                      onChange={e => {
                        // Strip any @ or domain the user might paste
                        const raw = e.target.value.replace(/@.*/, '').replace(/\s/g, '')
                        setEmail(raw)
                        if (stage === ST.ERROR) setStage(ST.IDLE)
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="yourname"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={stage === ST.LOADING || stage === ST.SUCCESS}
                      style={{
                        flex:       1,
                        height:     '100%',
                        background: 'transparent',
                        border:     'none',
                        padding:    '0 0 0 14px',
                        fontSize:   13,
                        color:      'rgba(255,255,255,0.85)',
                        fontFamily: 'var(--font)',
                        outline:    'none',
                        minWidth:   0,
                      }}
                    />
                    {/* Fixed domain suffix */}
                    <span style={{
                      padding:       '0 14px 0 2px',
                      fontSize:      13,
                      color:         'rgba(255,255,255,0.28)',
                      fontFamily:    'var(--font)',
                      whiteSpace:    'nowrap',
                      userSelect:    'none',
                      flexShrink:    0,
                    }}>@capecreative.co</span>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {stage === ST.ERROR && (
                    <motion.p
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }}
                      style={{ fontSize:11, color:'rgba(220,100,100,0.85)', marginBottom:10, lineHeight:1.5 }}
                    >{errMsg}</motion.p>
                  )}
                </AnimatePresence>

                {/* Continue button */}
                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileHover={canSubmit ? { opacity:0.82 } : {}}
                  whileTap={canSubmit ? { scale:0.985 } : {}}
                  style={{
                    width:          '100%',
                    height:         44,
                    marginTop:      4,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            8,
                    background:     stage === ST.SUCCESS
                      ? 'rgba(61,120,74,0.70)'
                      : 'rgba(255,255,255,0.92)',
                    border:         'none',
                    borderRadius:   2,
                    fontSize:       10,
                    fontWeight:     700,
                    fontFamily:     'var(--font)',
                    letterSpacing:  '0.14em',
                    textTransform:  'uppercase',
                    color:          stage === ST.SUCCESS ? 'white' : '#1A1916',
                    cursor:         canSubmit ? 'pointer' : 'default',
                    transition:     'background 0.22s, color 0.22s, opacity 0.12s',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {(stage === ST.IDLE || stage === ST.ERROR) && (
                      <motion.span key="idle"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.12 }}>
                        Continue
                      </motion.span>
                    )}
                    {stage === ST.LOADING && (
                      <motion.span key="loading"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.12 }}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Spinner/>
                        <span style={{ color:'rgba(255,255,255,0.50)', fontFamily:'var(--font)' }}>Continuing…</span>
                      </motion.span>
                    )}
                    {stage === ST.SUCCESS && (
                      <motion.span key="success"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.14 }}
                        style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Signed in</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Sub-note */}
                <p style={{
                  marginTop:     20,
                  fontSize:      11,
                  color:         'rgba(255,255,255,0.16)',
                  lineHeight:    1.65,
                  letterSpacing: '0.01em',
                }}>
                  Continuing redirects you through Google Workspace authentication.
                  Use your Field company account.
                </p>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div style={{
          height:         56,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 48px',
          borderTop:      '1px solid rgba(255,255,255,0.04)',
          flexShrink:     0,
        }}>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.10)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            © Field
          </p>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.08)', letterSpacing:'0.04em' }}>
            Internal access only
          </p>
        </div>

      </div>
    </div>
  )
}
