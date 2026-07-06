/**
 * UserBadge — topbar avatar chip that shows the current user's name,
 * role badge, and on click opens a profile panel with their DRI areas
 * and project responsibilities.
 *
 * Props:
 *   user        — raw auth user from App state
 *   currentUser — resolved team member from useCurrentUser()
 *   projectId   — current project (for DRI context)
 */

import React, { useState, useRef, useEffect } from 'react'
import { ROLE_CAPS } from '../team/teamConfig.js'

const NOTIF_KEY = 'field_notif_prefs_v1'
const NOTIF_DEFAULTS = { mentions:true, approvals:true, comments:false, assignments:true }

function loadNotifPrefs() {
  try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') } } catch { return NOTIF_DEFAULTS }
}
function saveNotifPrefs(prefs) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs)) } catch {}
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width:36, height:20, borderRadius:10, border:'none', cursor:'pointer',
        background: on ? 'var(--ink-900)' : 'var(--border-med)',
        position:'relative', transition:'background 0.18s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left: on ? 18 : 2, width:16, height:16,
        borderRadius:'50%', background:'white', transition:'left 0.18s',
        boxShadow:'0 1px 3px rgba(0,0,0,0.20)' }}/>
    </button>
  )
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function UserBadge({ user, currentUser, projectId, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs)
  const ref = useRef(null)

  const togglePref = key => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    saveNotifPrefs(next)
  }

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const cu      = currentUser
  const globalRole = cu?.role || 'Team Member'
  // Show the user's role WITHIN this project when available; fall back to their
  // global role (e.g. on the company dashboard, where there's no project).
  const role    = cu?.projectTitle || globalRole
  const dept    = cu?.projectDept  || cu?.dept || ''
  const caps    = cu?.caps    || ROLE_CAPS['Viewer']
  const dri     = cu?.driAreas || []
  /* Initials — for single-word sign-in names (e.g. "Teeks", "Teekay"),
     first-two-letters gives unhelpful results like "Te"; use the first
     letter + the next consonant instead ("Tk"). Multi-word names keep
     their normal first+last initials. Recomputed here so it also
     corrects initials persisted in older saved sessions. */
  const nameParts = (user.name || '').trim().split(/\s+/).filter(Boolean)
  let initials
  if (nameParts.length === 1) {
    const w = nameParts[0]
    const nextConsonant = [...w.slice(1)].find(c => /[a-z]/i.test(c) && !'aeiou'.includes(c.toLowerCase()))
    initials = w[0].toUpperCase() + (nextConsonant || w[1] || '').toLowerCase()
  } else {
    initials = user.initials || nameParts.map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 5px',
          background: open ? 'var(--ground-dim)' : 'transparent',
          border:'1px solid', borderColor: open ? 'var(--border-med)' : 'transparent',
          borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.1s' }}>
        {/* Avatar */}
        <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--ink-200)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:700, color:'var(--ink-600)', flexShrink:0 }}>
          {user.avatar
            ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
            : initials}
        </div>
        {/* Name + role */}
        <div style={{ textAlign:'left', lineHeight:1.2 }}>
          <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-800)' }}>{user.name}</p>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.05em',
            color: caps.color, marginTop:1 }}>{role}</p>
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink:0, color:'var(--ink-300)' }}>
          <path d={open ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ position:'absolute', right:0, top:40, width:280,
          background:'var(--surface)', border:'1px solid var(--border-med)',
          borderRadius:6, boxShadow:'0 8px 32px rgba(26,25,22,0.12)', zIndex:200, overflow:'hidden' }}>

          {/* Profile header */}
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--ink-200)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:700, color:'var(--ink-600)', flexShrink:0 }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
                  : initials}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>{user.name}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{user.email}</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                padding:'3px 8px', borderRadius:3, background:caps.bg, color:caps.color }}>
                {role}
              </span>
              {dept && (
                <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:3,
                  background:'var(--ground-dim)', border:'1px solid var(--border)', color:'var(--ink-500)' }}>
                  {dept}
                </span>
              )}
            </div>
          </div>

          {/* DRI areas */}
          <div style={{ padding:'14px 18px' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom: dri.length ? 10 : 6 }}>
              My DRI areas {projectId ? '— this project' : ''}
            </p>
            {dri.length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {dri.map(a => (
                  <span key={a} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:3,
                    background:'var(--signal-amber-bg)', color:'var(--signal-amber-text)' }}>{a}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
                No DRI areas assigned yet — open Team DRI to set them.
              </p>
            )}
          </div>

          {/* Notification preferences */}
          <div style={{ borderTop:'1px solid var(--border)' }}>
            <button onClick={() => setShowNotifs(s => !s)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 18px', background:'none', border:'none', cursor:'pointer',
                fontFamily:'var(--font)' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)' }}>Notification preferences</p>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d={showNotifs ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
              </svg>
            </button>
            {showNotifs && (
              <div style={{ padding:'2px 18px 14px' }}>
                {[
                  { key:'mentions',    label:'@Mentions',          desc:'When someone @mentions you in a comment' },
                  { key:'approvals',   label:'Approval requests',  desc:'When you are asked to approve something' },
                  { key:'comments',    label:'All comment activity',desc:'Any new comment on pages you follow' },
                  { key:'assignments', label:'Assignments',        desc:'When a task or area is assigned to you' },
                ].map(n => (
                  <div key={n.key} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                    gap:12, paddingBottom:10, marginBottom:10, borderBottom:'1px solid var(--border)' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-800)', marginBottom:2 }}>{n.label}</p>
                      <p style={{ fontSize:11, color:'var(--ink-300)', lineHeight:1.4 }}>{n.desc}</p>
                    </div>
                    <Toggle on={notifPrefs[n.key]} onChange={() => togglePref(n.key)}/>
                  </div>
                ))}
                <p style={{ fontSize:10, color:'var(--ink-300)', fontStyle:'italic' }}>
                  Preferences saved automatically
                </p>
              </div>
            )}
          </div>

          {/* Sign out */}
          <div style={{ padding:'10px 18px', borderTop:'1px solid var(--border)' }}>
            <button onClick={() => { setOpen(false); onSignOut?.() }}
              style={{ fontSize:13, color:'var(--ink-400)', background:'none', border:'none',
                cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
