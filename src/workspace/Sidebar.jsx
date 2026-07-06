import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'
export { CAPE_DIRECTORY }  // re-export so Team.jsx import still works

import { getAssignedProjects } from '../team/teamConfig.js'
import { getAllProjectsWithUserCreated } from '../company/companyData.js'

/* ─── NAV structure ──────────────────────────────────────────── */
const NAV = [
  { section:'Project', items:[
    { id:'overview',  label:'Overview'  },
    { id:'team',      label:'Team'      },
    { id:'timeline',  label:'Timeline'  },
    { id:'approvals',  label:'Approvals'  },
    { id:'shortlist',  label:'Shortlist'  },
  ]},
  { section:'Creative', items:[
    { id:'creative',  label:'Deliverables', attention:true },
    { id:'assets',    label:'Fulfillment'   },
  ]},
  { section:'Production', items:[
    { id:'budget',     label:'Budget'     },
    { id:'vendors',    label:'Vendors'    },
    { id:'logistics',  label:'Venue'      },
    { id:'fabrication',label:'Fabrication', conditional:true },
    { id:'av-tech',    label:'AV / Tech',   conditional:true },
  ]},
  { section:'Guest Experience', items:[
    { id:'talent',       label:'Talent',      conditional:true },
    { id:'guest-list',   label:'Guest List'   },
    { id:'hospitality', label:'Hospitality', conditional:true },
    { id:'content',     label:'Content',     conditional:true },
    { id:'run-of-show', label:'Run of Show'  },
  ]},
  { section:'Wrap', items:[
    { id:'debrief', label:'Debrief' },
    { id:'files',   label:'Files'   },
    { id:'emails',  label:'Emails'  },
  ]},
  { section:'Directory', items:[
    { id:'team-directory',    label:'Team'      },
    { id:'vendor-library',    label:'Vendors'    },
    { id:'venue-library',     label:'Venues'     },
    { id:'inventory-library', label:'Inventory'          },
  ]},
]

/* ─── Project Switcher ───────────────────────────────────────── */
/* Shows only projects the current user is assigned to.          */
/* Always includes "Project Library" link at the bottom.         */
function ProjectSwitcher({ production, onAllProductions, onNavigate, currentUser, onOpenProject }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Assigned projects only — pulls from all 12 seeded + user-created
  const assignedProjects = getAssignedProjects(currentUser, getAllProjectsWithUserCreated())

  const filtered = query.trim()
    ? assignedProjects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.client.toLowerCase().includes(query.toLowerCase()))
    : assignedProjects

  const statusDot = s => s === 'on-schedule' ? 'var(--signal-green-dot)' : 'var(--signal-amber-dot)'

  return (
    <div ref={ref} style={{ position:'relative', padding:'10px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
      {/* Current project chip */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:6, padding:'8px 10px', cursor:'pointer', textAlign:'left' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
        <div style={{ minWidth:0, flex:1 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.82)', lineHeight:1.3,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
            {production.name || 'Select project'}
          </p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.30)', lineHeight:1 }}>
            {production.client || 'Field'}
          </p>
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink:0, marginLeft:8 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="rgba(255,255,255,0.28)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% - 2px)', left:14, right:14, zIndex:200,
          background:'#242220', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6,
          boxShadow:'0 12px 40px rgba(0,0,0,0.55)', overflow:'hidden' }}>

          {/* Search — only show if there are projects to search */}
          {assignedProjects.length > 1 && (
            <div style={{ padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="4.5" cy="4.5" r="3.5" stroke="rgba(255,255,255,0.28)" strokeWidth="1.1"/>
                  <path d="M7.5 7.5L10 10" stroke="rgba(255,255,255,0.28)" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search projects…"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none',
                    fontSize:13, color:'rgba(255,255,255,0.70)', fontFamily:'var(--font)' }}/>
              </div>
            </div>
          )}

          {/* Assigned project list */}
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {filtered.length === 0 && assignedProjects.length === 0 && (
              <div style={{ padding:'14px 12px' }}>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.32)', fontStyle:'italic', marginBottom:6 }}>
                  No assigned projects
                </p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>
                  Visit the Project Library to browse all projects.
                </p>
              </div>
            )}
            {filtered.map(p => (
              <button key={p.id}
                onClick={() => { setOpen(false); setQuery(''); onOpenProject?.(p) }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 12px',
                  background: p.id === production.id || p.name === production.name ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { if (p.name !== production.name) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (p.name !== production.name) e.currentTarget.style.background='transparent' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:statusDot(p.status), flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.75)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:1 }}>{p.name}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{p.client} · {p.date}</p>
                </div>
                {(p.id === production.id || p.name === production.name) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Always-visible Project Library link */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'6px 0' }}>
            <button
              onClick={() => { setOpen(false); onAllProductions() }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.40)',
                fontSize:12, fontFamily:'var(--font)', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.65)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.40)'}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
                <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
                <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
                <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
              </svg>
              Project Library
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sidebar ────────────────────────────────────────────────── */
export default function Sidebar({ activePage, onNavigate, onAllProductions, onProjects, production: productionProp, currentUser, onOpenProject }) {
  const { state, derived } = useStore()
  const production = productionProp || state.production
  const activeWS   = production.activeWorkstreams || []

  // DRI-based nav highlight — shows which pages are the user's responsibility
  const driNavIds = new Set((currentUser?.driAreas || []).flatMap(area => {
    const map = {
      'Creative Assets': ['creative', 'assets'],
      'Fulfillment':     ['assets'],
      'F&B':             ['hospitality'],
      'Hospitality':     ['hospitality'],
      'Florals':         ['florals'],
      'Tablescape':      ['tablescape'],
      'Talent':          ['talent'],
      'Guest List':      ['guest-list'],
      'Run of Show':     ['run-of-show'],
      'Content Capture': ['content'],
      'Fabrication':     ['fabrication'],
      'AV / Tech':       ['av-tech'],
      'Venue':           ['logistics'],
      'Vendors':         ['vendors'],
      'Budget':          ['budget'],
      'Logistics':       ['logistics'],
      'Approvals':       ['approvals'],
      'Timeline':        ['timeline'],
    }
    return map[area] || []
  }))

  return (
    <div className="workspace-sidebar">
      {/* Field wordmark */}
      <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, letterSpacing:'0.22em',
          textTransform:'uppercase', color:'rgba(255,255,255,0.75)', cursor:'pointer' }}
          onClick={onAllProductions}>
          Field
        </span>
      </div>

      {/* Project Switcher — assigned projects only */}
      <ProjectSwitcher
        production={production}
        onAllProductions={onAllProductions}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onOpenProject={onOpenProject}/>

      {/* Nav — all sections visible; DRI areas highlighted amber */}
      <nav style={{ flex:1, paddingBottom:20, overflowY:'auto' }}>
        {NAV.map(section => {
          const visible = section.items.filter(item => !item.conditional || activeWS.includes(item.id))
          if (!visible.length) return null
          return (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {visible.map(item => {
                const isDri    = driNavIds.has(item.id)
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    style={undefined}>
                    {item.label}
                    {isDri && !isActive && (
                      <span style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', flexShrink:0,
                        background:'rgba(200,168,64,0.5)', display:'inline-block', marginTop:1 }}/>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* No bottom user footer — user identity lives in the topbar UserBadge */}
    </div>
  )
}
