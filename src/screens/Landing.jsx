import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EXISTING_PRODUCTIONS } from '../data.js'

function getOperationalPriority(p) {
  if (p.status === 'attention') return {
    label:   p.statusLabel || 'Needs attention',
    detail:  p.nextGate,
    urgency: 'high',
  }
  if (p.daysOut <= 7) return {
    label:   `${p.daysOut} days to event`,
    detail:  p.nextGate,
    urgency: 'med',
  }
  return {
    label:   p.nextGate,
    detail:  `${p.lead} · ${p.phase} phase`,
    urgency: 'low',
  }
}

const DOT = { high:'var(--signal-red-dot)', med:'var(--signal-amber-dot)', low:'var(--signal-green-dot)' }
const TXT = { high:'var(--signal-red-text)', med:'var(--signal-amber-text)', low:'var(--signal-green-text)' }

function FieldMark() {
  return (
    <span style={{
      fontFamily:'var(--font)', fontSize:11, fontWeight:700,
      letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(255,255,255,0.75)',
    }}>Field</span>
  )
}

function ProjectCard({ p, index, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const priority = getOperationalPriority(p)

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.26, delay:index * 0.07, ease:[0.25,1,0.5,1] }}
      onClick={() => onOpen(p)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? 'var(--surface)' : 'var(--ground-dim)',
        border:       `1px solid ${hovered ? 'var(--border-med)' : 'var(--border)'}`,
        borderRadius: 'var(--r-sm)',
        padding:      '20px 22px',
        cursor:       'pointer',
        transition:   'background 0.13s, border-color 0.13s',
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div style={{ flex:1, minWidth:0, paddingRight:16 }}>
          <p style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.13em',
            textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6,
          }}>{p.client} · {p.type}</p>
          <h2 style={{
            fontSize:16, fontWeight:600, letterSpacing:'-0.02em',
            color:'var(--ink-900)', lineHeight:1.2,
          }}>{p.name}</h2>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{
            fontFamily:'var(--font-serif)', fontSize:26, fontWeight:400,
            letterSpacing:'-0.03em', lineHeight:1, marginBottom:2,
            color: hovered ? 'var(--ink-900)' : 'var(--ink-200)',
            transition:'color 0.13s',
          }}>{p.daysOut}d</p>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)' }}>out</p>
        </div>
      </div>

      <div style={{ borderTop:'1px solid var(--border)', paddingTop:14, display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:DOT[priority.urgency], flexShrink:0, marginTop:4 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:600, color:TXT[priority.urgency], marginBottom:2, lineHeight:1.3 }}>{priority.label}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)', lineHeight:1.45 }}>{priority.detail}</p>
        </div>
        <motion.div
          animate={{ opacity:hovered ? 1 : 0, x:hovered ? 0 : -4 }}
          transition={{ duration:0.13 }}
          style={{ flexShrink:0, paddingTop:2 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <p style={{ fontSize:11, color:'var(--ink-300)' }}>{p.location} · {p.eventDate}</p>
        <p style={{ fontSize:11, color:'var(--ink-300)' }}>{p.lead}</p>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      transition={{ duration:0.28, delay:0.12 }}
      style={{
        marginTop:40, padding:'40px 28px',
        background:'var(--ground-dim)', border:'1px solid var(--border)',
        borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', gap:20,
      }}
    >
      <div style={{
        width:40, height:40, borderRadius:'50%',
        background:'var(--surface)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="1.5" width="10" height="13" rx="1" stroke="var(--ink-200)" strokeWidth="1.2"/>
          <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="var(--ink-200)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-500)', marginBottom:4, letterSpacing:'-0.01em' }}>
          No active projects yet.
        </p>
        <p style={{ fontSize:12, color:'var(--ink-300)', lineHeight:1.55, maxWidth:340 }}>
          When projects are assigned to you, they'll appear here automatically.
        </p>
      </div>
    </motion.div>
  )
}

export default function Landing({ onNew, onOpenProject, onProjects, user }) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    if      (h < 12) setGreeting('Good morning')
    else if (h < 18) setGreeting('Good afternoon')
    else             setGreeting('Good evening')
  }, [])

  const myProjects = EXISTING_PRODUCTIONS
  const firstName  = user?.name?.split(' ')[0] || null  // null = no name shown until auth wired

  return (
    <div style={{ minHeight:'100vh', background:'var(--ground)', fontFamily:'var(--font)', display:'flex', flexDirection:'column' }}>

      {/* Topbar */}
      <div style={{
        height:44, background:'var(--ink-900)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 40px', flexShrink:0, position:'sticky', top:0, zIndex:10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          <FieldMark/>
        </div>
        <button
          onClick={onNew}
          onMouseEnter={e => e.currentTarget.style.opacity='0.80'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
          style={{
            padding:'6px 16px', fontSize:10, fontWeight:700,
            letterSpacing:'0.12em', textTransform:'uppercase',
            background:'rgba(255,255,255,0.92)', color:'var(--ink-900)',
            border:'none', borderRadius:'var(--r-sm)', cursor:'pointer', fontFamily:'var(--font)',
          }}
        >+ New project</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, maxWidth:860, margin:'0 auto', width:'100%', padding:'56px 40px 96px' }}>

        {/* Greeting */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.40, ease:[0.22,1,0.36,1] }}
          style={{ marginBottom:52 }}
        >
          <h1 style={{
            fontFamily:'var(--font-serif)', fontSize:44, fontWeight:400,
            letterSpacing:'-0.01em', lineHeight:1.05, color:'var(--ink-900)',
          }}>
            {greeting}{firstName ? (
              <>{', '}<em style={{ color:'var(--ink-400)', fontStyle:'italic' }}>{firstName}.</em></>
            ) : '.'}
          </h1>
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ duration:0.28, delay:0.12 }}
          style={{
            display:'flex', justifyContent:'space-between', alignItems:'baseline',
            borderBottom:'1.5px solid var(--ink-900)', paddingBottom:14, marginBottom:20,
          }}
        >
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-400)' }}>
            Your projects
          </p>
          {myProjects.length > 0 && (
            <span style={{ fontSize:11, color:'var(--ink-300)' }}>{myProjects.length} active</span>
          )}
        </motion.div>

        {/* Cards */}
        {myProjects.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {myProjects.map((p, i) => (
              <ProjectCard
                key={p.id}
                p={p}
                index={i}
                onOpen={onOpenProject}   // ← opens the specific project, not new project flow
              />
            ))}
          </div>
        ) : (
          <EmptyState/>
        )}
      </div>
    </div>
  )
}
