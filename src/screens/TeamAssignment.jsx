import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowTopbar } from './ProductionDetails.jsx'
import { useStore } from '../store.jsx'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'

function initials(name) {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
}

/* ─── Avatar ─────────────────────────────────────────────── */
function MiniAvatar({ ini, added }) {
  return (
    <div style={{
      width:36, height:36, borderRadius:'50%', flexShrink:0,
      background: added ? 'var(--ink-800)' : 'var(--ground-dim)',
      border: `1px solid ${added ? 'transparent' : 'var(--border)'}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:11, fontWeight:700, letterSpacing:'0.02em',
      color: added ? 'rgba(255,255,255,0.62)' : 'var(--ink-400)',
      fontFamily:'var(--font)', transition:'background 0.15s',
    }}>
      {ini}
    </div>
  )
}

export default function TeamAssignment({ onNext, onBack }) {
  const { state } = useStore()
  const { production } = state

  // Selected people from the directory, keyed by directory id
  const [selected, setSelected] = useState({})  // { [dirId]: true }
  const [query, setQuery] = useState('')

  const directory = useMemo(() =>
    [...CAPE_DIRECTORY].sort((a, b) =>
      a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName)
    )
  , [])

  const filtered = useMemo(() => {
    if (!query.trim()) return directory
    const q = query.toLowerCase()
    return directory.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (Array.isArray(p.dept) && p.dept.some(d => d.toLowerCase().includes(q)))
    )
  }, [directory, query])

  const toggle = id => setSelected(prev => {
    const next = { ...prev }
    if (next[id]) delete next[id]
    else next[id] = true
    return next
  })

  const selectedCount = Object.keys(selected).length

  const handleLaunch = () => {
    // Build the team entries in the same shape Team.jsx expects
    const newMembers = CAPE_DIRECTORY
      .filter(p => selected[p.id])
      .map(p => ({
        ...p,
        _uid:        `_${Math.random().toString(36).slice(2,8)}`,
        _directoryId: p.id,
        driAreas:    [],
        driNotes:    '',
      }))

    if (newMembers.length > 0) {
      // Write directly to the project-scoped localStorage key that Team.jsx reads.
      // This is the only reliable way to connect project creation → Team page
      // because state.production.id is always 'p4' in the store — never the new
      // project's real id. Writing to localStorage bypasses that entirely.
      const projectId = production.id || 'p4'
      const capeKey   = `field_local_team_cape_${projectId}_v3`
      try {
        const existing = JSON.parse(localStorage.getItem(capeKey) || '[]')
        // Merge: don't duplicate if they were already added
        const existingIds = new Set(existing.map(m => m._directoryId))
        const toAdd = newMembers.filter(m => !existingIds.has(m._directoryId))
        localStorage.setItem(capeKey, JSON.stringify([...existing, ...toAdd]))
      } catch (e) {
        console.error('Failed to save team to localStorage', e)
      }
    }

    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ minHeight:'100vh', background:'var(--ground)', fontFamily:'var(--font)', display:'flex', flexDirection:'column' }}
    >
      <FlowTopbar onBack={onBack} showBack={false}/>

      <div style={{ flex:1, maxWidth:640, margin:'0 auto', width:'100%', padding:'56px 40px 80px' }}>
        <motion.div
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.28, ease:[0.25,1,0.5,1] }}
        >
          {/* Heading */}
          <h1 style={{
            fontFamily:'var(--font-display)', fontSize:40, fontWeight:800,
            letterSpacing:'-0.03em', color:'var(--ink-900)', lineHeight:1.05, marginBottom:10,
          }}>Your Team</h1>
          <p style={{ fontSize:14, color:'var(--ink-400)', lineHeight:1.65, marginBottom:8, letterSpacing:'0.01em' }}>
            Add your core team for <strong style={{ color:'var(--ink-700)', fontWeight:500 }}>{production.name || 'this project'}</strong>.
          </p>
          <p style={{ fontSize:13, color:'var(--ink-300)', lineHeight:1.6, marginBottom:28 }}>
            Select people from the CAPE team directory below.
          </p>

          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 14px',
            background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4,
            height:40, marginBottom:14 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="var(--ink-300)" strokeWidth="1.2"/>
              <path d="M8.7 8.7l3 3" stroke="var(--ink-300)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search team directory…"
              style={{ flex:1, border:'none', outline:'none', fontSize:13,
                color:'var(--ink-800)', background:'transparent', fontFamily:'var(--font)' }}/>
            {query && (
              <button onClick={() => setQuery('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:14 }}>×</button>
            )}
          </div>

          {selectedCount > 0 && (
            <p style={{ fontSize:12, color:'var(--ink-500)', marginBottom:10 }}>
              {selectedCount} {selectedCount === 1 ? 'person' : 'people'} added
            </p>
          )}

          {/* Scrollable directory list */}
          <div style={{
            border:'1px solid var(--border)', borderRadius:6, marginBottom:24,
            maxHeight:380, overflowY:'auto', background:'var(--surface)',
          }}>
            <AnimatePresence initial={false}>
              {filtered.map((p, i) => {
                const fullName = `${p.firstName} ${p.lastName}`
                const isAdded = !!selected[p.id]
                return (
                  <motion.div
                    key={p.id}
                    initial={false}
                    animate={{ opacity:1 }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                      borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none',
                      background: isAdded ? 'var(--ground-dim)' : 'transparent',
                      transition:'background 0.12s',
                    }}
                  >
                    <MiniAvatar ini={p.initials || initials(fullName)} added={isAdded}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13.5, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', marginBottom:1 }}>
                        {fullName}
                      </p>
                      <p style={{ fontSize:11.5, color:'var(--ink-400)' }}>
                        {[p.title, Array.isArray(p.dept) ? p.dept.join(', ') : p.dept].filter(Boolean).join(' · ') || 'No title on file'}
                      </p>
                    </div>
                    <button onClick={() => toggle(p.id)}
                      style={{
                        flexShrink:0, padding:'6px 14px', fontSize:12, fontWeight:600,
                        borderRadius:4, cursor:'pointer', fontFamily:'var(--font)',
                        background: isAdded ? 'var(--signal-green-bg)' : 'var(--ink-900)',
                        color: isAdded ? 'var(--signal-green-text)' : 'white',
                        border: `1px solid ${isAdded ? 'var(--signal-green-text)' : 'var(--ink-900)'}`,
                        transition:'all 0.12s',
                      }}>
                      {isAdded ? '✓ Added' : 'Add to project'}
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div style={{ padding:'32px 0', textAlign:'center' }}>
                <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic', color:'var(--ink-200)' }}>
                  No matches for "{query}"
                </p>
              </div>
            )}
          </div>

          {/* Context note */}
          <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 16px', marginBottom:40 }}>
            <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.6 }}>
              <span style={{ fontWeight:500, color:'var(--ink-600)' }}>What comes next — </span>
              Budget, vendors, and brief details are set up inside the project workspace.
              Only your core team is needed to get started.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button
              onClick={onBack}
              style={{
                padding:'10px 20px', fontSize:13, fontWeight:500, color:'var(--ink-500)',
                background:'transparent', border:'1px solid var(--border)',
                borderRadius:4, cursor:'pointer', fontFamily:'var(--font)',
                transition:'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink-500)'; e.currentTarget.style.color='var(--ink-800)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--ink-500)' }}
            >← Back</button>

            <motion.button
              onClick={handleLaunch}
              whileHover={{ opacity: 0.82 }}
              whileTap={{ scale: 0.985 }}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'11px 28px',
                background:'var(--ink-900)', color:'white',
                border:'none', borderRadius:4,
                fontSize:14, fontWeight:500, fontFamily:'var(--font)',
                letterSpacing:'-0.01em', cursor:'pointer',
              }}
            >
              Build the project plan
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}
