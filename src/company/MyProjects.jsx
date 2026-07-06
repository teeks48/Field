import React, { useState } from 'react'
import { getAllProjectsWithUserCreated } from './companyData.js'
import { resolveUser, getAssignedProjects, PROJECTS } from '../team/teamConfig.js'

function Av({ initials, size=24 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size<28?8:10, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)' }}>
      {initials||'?'}
    </div>
  )
}

function statusStyle(s) {
  if (s==='active')    return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (s==='attention') return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  if (s==='completed') return { color:'var(--ink-400)',           bg:'var(--ground-dim)'      }
  return                       { color:'var(--ink-300)',           bg:'var(--ground-dim)'      }
}

function ProjectCard({ p, onOpen }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(p.status)
  return (
    <div onClick={() => onOpen(p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:hov?'var(--surface)':'var(--ground-dim)',
        border:`1px solid ${hov?'var(--border-med)':'var(--border)'}`, borderRadius:4,
        padding:'18px 20px', cursor:'pointer',
        boxShadow:hov?'0 4px 16px rgba(0,0,0,0.06)':'none',
        transform:hov?'translateY(-1px)':'none',
        transition:'all 0.15s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0, marginRight:10 }}>
          <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:4 }}>{p.client}</p>
          <p style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em',
            lineHeight:1.3 }}>{p.name}</p>
        </div>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
          color:ss.color, background:ss.bg, padding:'4px 10px', borderRadius:2, whiteSpace:'nowrap', flexShrink:0 }}>
          {p.statusLabel || p.status}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14,
        paddingTop:12, borderTop:'1px solid var(--border)' }}>
        {[['Phase', p.phase],['Location', p.location],['Event date', p.eventDate],['Budget', p.budget]].map(([l,v])=>(
          <div key={l}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{l}</p>
            <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-700)' }}>{v || '—'}</p>
          </div>
        ))}
      </div>
      {p.nextMilestone && p.status !== 'completed' && (
        <div style={{ padding:'8px 10px', background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:3, marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>Next milestone</p>
          <p style={{ fontSize:13, color:'var(--ink-700)' }}>{p.nextMilestone}</p>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex' }}>
          {(p.team || []).slice(0,4).map((t,i) => (
            <div key={i} style={{ marginLeft:i===0?0:-6 }}><Av initials={t} size={24}/></div>
          ))}
        </div>
        {p.lead && <p style={{ fontSize:12, color:'var(--ink-400)' }}>Lead: {p.lead}</p>}
      </div>
    </div>
  )
}

export default function MyProjects({ onOpenProject, user, onNavigate }) {
  // All projects = static seeded + user-created (from localStorage)
  const allProjects = getAllProjectsWithUserCreated()

  // Resolve which projects this user is assigned to
  const resolved = resolveUser(user)

  // Get assigned project IDs from teamConfig
  const assignedFromConfig = getAssignedProjects(resolved, Object.values(PROJECTS)).map(p => p.id)

  // Also include user-created projects (they belong to whoever created them)
  const userCreatedIds = allProjects.filter(p => p.userCreated).map(p => p.id)

  // My projects = assigned via teamConfig OR user-created
  const assignedIds = new Set([...assignedFromConfig, ...userCreatedIds])
  const myProjects  = allProjects.filter(p => assignedIds.has(p.id))

  const active    = myProjects.filter(p => p.status !== 'completed')
  const completed = myProjects.filter(p => p.status === 'completed')
  const hasNone   = myProjects.length === 0

  return (
    <div style={{ width:'100%', padding:'36px 72px 80px' }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
          color:'var(--ink-300)', marginBottom:8 }}>Field · Projects</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
          letterSpacing:'-0.04em', color:'var(--ink-900)', marginBottom:4 }}>My Projects</h1>
        <p style={{ fontSize:15, color:'var(--ink-400)' }}>
          {hasNone
            ? 'Projects you are assigned to will appear here.'
            : `${active.length} active · ${completed.length} completed · Projects assigned to you`}
        </p>
      </div>

      {hasNone ? (
        <div style={{ paddingTop:60, textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:22, fontStyle:'italic',
            color:'var(--ink-200)', marginBottom:12 }}>No assigned projects yet</p>
          <p style={{ fontSize:15, color:'var(--ink-300)', marginBottom:28, maxWidth:420, margin:'0 auto 28px' }}>
            You have not been assigned to any projects. Browse the Project Library to view all productions.
          </p>
          <button onClick={() => onNavigate?.('project-library')}
            style={{ padding:'11px 28px', fontSize:14, fontWeight:600, background:'var(--ink-900)',
              color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
            Browse Project Library →
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:14 }}>Active</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14, marginBottom:32 }}>
                {active.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpenProject}/>)}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', whiteSpace:'nowrap' }}>Completed</p>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
                {completed.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpenProject}/>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
