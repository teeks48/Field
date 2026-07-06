import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import FocusModal from './FocusModal.jsx'
import { useLocalState } from '../useLocalState.js'

/* ─────────────────────────────────────────────────────────
   PageOwner — consistent Ownership (DRI) metadata.

   Shows the owner of a project area directly beneath a page
   title. The owner is the team member whose DRI areas (set on
   the Team page) include this area — read from and written to
   the exact same records the Team page uses
   (`team_cape_${pid}_v3` / `team_ext_${pid}_v3`), so there is
   a single source of truth and no duplicate ownership data.

   Clicking the owner opens the project Team Directory to
   reassign; the change is immediately reflected on the Team
   page and anywhere else that reads DRI areas.
   ─────────────────────────────────────────────────────── */

function Av({ initials, size = 18 }) {
  return (
    <span style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-200)',
      display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      fontSize:8, fontWeight:700, color:'var(--ink-600)', fontFamily:'var(--font)' }}>
      {initials || '?'}
    </span>
  )
}

/* Display name — same convention the Team page uses:
   external members have `name`; CAPE directory members have firstName/lastName. */
const nameOf = m =>
  m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.preferredName || 'Unnamed'

const initialsOf = m =>
  m.initials ||
  nameOf(m).split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() ||
  '?'

const metaOf = m => {
  const role = m.projectRole || m.title || m.role
  const dept = Array.isArray(m.dept) ? m.dept.join(', ') : m.dept
  return [role, dept].filter(Boolean).join(' · ')
}

export default function PageOwner({ area, projectId }) {
  const pid = projectId || 'default'
  const [capeTeam, setCapeTeam] = useLocalState(`team_cape_${pid}_v3`, [])
  const [extTeam,  setExtTeam]  = useLocalState(`team_ext_${pid}_v3`,  [])
  const [picking,  setPicking]  = useState(false)
  const [q,        setQ]        = useState('')

  const all    = [...capeTeam, ...extTeam]
  const owners = all.filter(m => (m.driAreas || []).includes(area))
  const owner  = owners[0]

  /* Assign `area` exclusively to the member with _uid (or nobody if null).
     Updates the same team records the Team page owns — no duplication. */
  const assign = uid => {
    const apply = list => list.map(m => {
      const has = (m.driAreas || []).includes(area)
      if (uid !== null && m._uid === uid) {
        return has ? m : { ...m, driAreas: [...(m.driAreas || []), area] }
      }
      return has ? { ...m, driAreas: (m.driAreas || []).filter(a => a !== area) } : m
    })
    setCapeTeam(apply(capeTeam))
    setExtTeam(apply(extTeam))
    setPicking(false)
    setQ('')
  }

  const term = q.trim().toLowerCase()
  const filtered = all.filter(m =>
    !term || [nameOf(m), m.firstName, m.lastName, m.title, m.role, m.projectRole, metaOf(m), m.email]
      .some(f => (f || '').toLowerCase().includes(term))
  )

  return (
    <>
      {/* Subtle metadata line beneath the page title */}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>
          Owner
        </span>
        <button onClick={() => setPicking(true)} title={`Reassign ${area} owner`}
          style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none',
            padding:'1px 2px', cursor:'pointer', fontFamily:'var(--font)',
            borderBottom:'1px solid transparent', transition:'border-color 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'var(--border-med)'}
          onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
          {owner ? (
            <span style={{ fontSize:12.5, fontWeight:600, color:'var(--ink-700)' }}>
              {nameOf(owner)}{owners.length > 1 ? `  +${owners.length - 1}` : ''}
            </span>
          ) : (
            <span style={{ fontSize:12.5, color:'var(--ink-300)', fontStyle:'italic' }}>
              Unassigned — click to assign
            </span>
          )}
        </button>
      </div>

      {/* Team Directory picker */}
      <AnimatePresence>
        {picking && (
          <FocusModal key="owner-pick" onClose={() => { setPicking(false); setQ('') }} width="460px" maxWidth="500px">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'18px 22px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', marginBottom:2 }}>
                  Team Directory
                </h3>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>Assign the {area} owner (DRI)</p>
              </div>
              <button onClick={() => { setPicking(false); setQ('') }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:22, lineHeight:1 }}>×</button>
            </div>

            {all.length > 0 && (
              <div style={{ padding:'12px 22px 0', flexShrink:0 }}>
                <input autoFocus placeholder="Search team members…" value={q} onChange={e => setQ(e.target.value)}
                  style={{ width:'100%', fontSize:13, height:32, padding:'0 10px', border:'1px solid var(--border)',
                    borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none' }}/>
              </div>
            )}

            <div style={{ overflowY:'auto', padding:'6px 22px 10px', flex:1, minHeight:120, maxHeight:'44vh' }}>
              {all.length === 0 && (
                <p style={{ padding:'28px 0', textAlign:'center', fontSize:12.5, color:'var(--ink-400)', lineHeight:1.6 }}>
                  No team members on this project yet.<br/>
                  Add people on the <strong>Team</strong> page, then assign an owner here.
                </p>
              )}
              {filtered.map(m => {
                const isOwner = (m.driAreas || []).includes(area)
                return (
                  <div key={m._uid} onClick={() => assign(m._uid)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0',
                      borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Av initials={initialsOf(m)} size={26}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}>{nameOf(m)}</p>
                      {metaOf(m) && (
                        <p style={{ fontSize:11, color:'var(--ink-400)' }}>{metaOf(m)}</p>
                      )}
                    </div>
                    {isOwner && (
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                        color:'var(--signal-green-text)' }}>✓ Owner</span>
                    )}
                  </div>
                )
              })}
              {all.length > 0 && filtered.length === 0 && (
                <p style={{ padding:'24px 0', textAlign:'center', fontSize:13, color:'var(--ink-300)',
                  fontFamily:'var(--font-serif)', fontStyle:'italic' }}>No team members match</p>
              )}
            </div>

            {owner && (
              <div style={{ padding:'10px 22px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
                <button onClick={() => assign(null)}
                  style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                    cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                  Remove owner
                </button>
              </div>
            )}
          </FocusModal>
        )}
      </AnimatePresence>
    </>
  )
}
