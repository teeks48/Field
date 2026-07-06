import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SearchTrigger } from '../components/CommandPalette.jsx'
import NotificationBell from '../components/NotificationBell.jsx'

/* ─── Shared top-nav for all company-level pages ────────── */

const NAV_ITEMS = [
  { id:'dashboard',       label:'Dashboard'        },
  { id:'my-projects',     label:'My Projects'      },
  { id:'project-library', label:'Project Library'  },
  { id:'team-directory',  label:'Team'             },
  { id:'vendors',         label:'Vendors'          },
  { id:'venues',          label:'Venues'           },
  { id:'inventory',       label:'Inventory'        },
  { id:'integrations',    label:'Integrations'     },
]

function Av({ initials, size=28 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'#2A2825',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      fontSize:size<30?9:11, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)', letterSpacing:'0.03em' }}>
      {initials||'?'}
    </div>
  )
}

export default function CompanyShell({ activePage, onNavigate, onOpenProject, user, currentUser, onSignOut, onOpenPalette, children }) {
  const initials = user?.initials || (user?.name || '').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--ground)' }}>
      {/* ── Top navigation bar ── */}
      <div style={{ height:52, background:'var(--ink-900)', display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 28px', flexShrink:0,
        borderBottom:'1px solid rgba(255,255,255,0.06)', position:'relative', zIndex:10 }}>

        {/* Left: wordmark */}
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <button onClick={() => onNavigate('dashboard')}
            style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, letterSpacing:'0.22em',
              textTransform:'uppercase', color:'rgba(255,255,255,0.80)', background:'none',
              border:'none', cursor:'pointer', flexShrink:0 }}>
            Field
          </button>

          {/* Nav links */}
          <nav style={{ display:'flex', gap:0 }}>
            {NAV_ITEMS.map(item => {
              const active = activePage === item.id
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  style={{ padding:'0 14px', height:52, fontSize:13, fontWeight: active ? 500 : 400,
                    color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.36)',
                    background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)',
                    borderBottom: active ? '2px solid rgba(255,255,255,0.70)' : '2px solid transparent',
                    transition:'color 0.12s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.color='rgba(255,255,255,0.60)' }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.color='rgba(255,255,255,0.36)' }}>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right: search + notifications + user + new project */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <SearchTrigger onClick={onOpenPalette} dark={true}/>
          <NotificationBell
            currentUser={currentUser}
            onOpenProject={onOpenProject}
          />
          <button onClick={() => onNavigate('new-project')}
            style={{ padding:'6px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.08em',
              textTransform:'uppercase', color:'var(--ink-900)', background:'rgba(255,255,255,0.88)',
              border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>
            + New project
          </button>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Av initials={initials} size={28}/>
              <button onClick={onSignOut}
                style={{ fontSize:11, color:'rgba(255,255,255,0.36)', background:'none', border:'none',
                  cursor:'pointer', fontFamily:'var(--font)', padding:0,
                  transition:'color 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.70)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.36)'}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Page content ── */}
      <motion.div key={activePage}
        initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.18, ease:[0.25,1,0.5,1] }}
        style={{ flex:1, overflowY:'auto' }}>
        {children}
      </motion.div>
    </div>
  )
}
