import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { EXISTING_PRODUCTIONS } from '../data.js'

/* ── Extended mock project list for the Projects page ───── */
const ALL_PROJECTS = [
  ...EXISTING_PRODUCTIONS,
  {
    id:'p4', name:'Hermès Silk Stories — NYC Popup',
    client:'Hermès', type:'Pop-Up', location:'New York, NY',
    eventDate:'Sep 18, 2026', daysOut:83, status:'on-schedule',
    statusLabel:'On schedule', phase:'Pre-production',
    lead:'', ep:'', nextGate:'Venue confirm · Jul 22',
  },
  {
    id:'p5', name:'Apple Vision Pro Executive Dinner',
    client:'Apple', type:'Executive Dinner', location:'Brooklyn, NY',
    eventDate:'Jul 16, 2026', daysOut:18, status:'on-schedule',
    statusLabel:'On schedule', phase:'Final production',
    lead:'', ep:'', nextGate:'Creative lock · Jul 1',
  },
  {
    id:'p6', name:'Balenciaga Sound Capsule — LA',
    client:'Balenciaga', type:'Brand Activation', location:'Los Angeles, CA',
    eventDate:'Oct 4, 2026', daysOut:99, status:'pre',
    statusLabel:'Pre-production', phase:'Briefing',
    lead:'', ep:'', nextGate:'Brief kick-off · Jul 15',
  },
]

const STATUSES = ['All','On schedule','Attention','Pre-production']
const CLIENTS  = ['All',...new Set(ALL_PROJECTS.map(p=>p.client))]
const PHASES   = ['All',...new Set(ALL_PROJECTS.map(p=>p.phase))]

function statusColor(s) {
  if (s==='on-schedule') return { dot:'var(--signal-green-dot)', text:'var(--signal-green-text)', label:'On track'      }
  if (s==='attention')   return { dot:'var(--signal-amber-dot)', text:'var(--signal-amber-text)', label:'Attention'     }
  return                          { dot:'var(--ink-200)',         text:'var(--ink-400)',            label:'Pre-production' }
}

function FieldMark({ dark=false }) {
  return (
    <span style={{
      fontFamily:'var(--font)', fontSize:11, fontWeight:700,
      letterSpacing:'0.22em', textTransform:'uppercase',
      color: dark ? 'var(--ink-900)' : 'rgba(255,255,255,0.75)',
    }}>Field</span>
  )
}

function ProjectRow({ p, onOpen, index }) {
  const [hov, setHov] = useState(false)
  const sc = statusColor(p.status)

  return (
    <motion.div
      initial={{ opacity:0, y:6 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.22, delay:index*0.04, ease:[0.25,1,0.5,1] }}
      onClick={() => onOpen(p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'grid',
        gridTemplateColumns:'8px minmax(0,1fr) 120px 100px 110px 120px 32px',
        gap:16, alignItems:'center',
        padding:'14px 18px',
        background: hov ? 'var(--surface)' : 'transparent',
        borderBottom:'1px solid var(--border)',
        cursor:'pointer',
        transition:'background 0.12s',
      }}
    >
      {/* Status dot */}
      <div style={{ width:7, height:7, borderRadius:'50%', background:sc.dot, flexShrink:0 }}/>

      {/* Name + client */}
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2, letterSpacing:'-0.01em' }}>
          {p.name}
        </p>
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.client} · {p.type}</p>
      </div>

      {/* Location */}
      <p style={{ fontSize:12, color:'var(--ink-500)' }}>{p.location}</p>

      {/* Event date */}
      <p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--ink-400)', letterSpacing:'0.02em' }}>
        {p.eventDate.split(',')[0]}
      </p>

      {/* Phase */}
      <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.phase}</p>

      {/* Lead */}
      <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.lead}</p>

      {/* Arrow */}
      <motion.div
        animate={{ opacity:hov?1:0, x:hov?0:-4 }}
        transition={{ duration:0.12 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  )
}

export default function Projects({ onOpenProject, onNew, onBack, user }) {
  const [query, setQuery]           = useState('')
  const [scope, setScope]           = useState('all') // 'yours' | 'all'
  const [statusFilter, setStatus]   = useState('All')
  const [clientFilter, setClient]   = useState('All')
  const [phaseFilter, setPhase]     = useState('All')

  // Simulate user's own projects = first 3 (in production: filter by user.email)
  const myProjectIds = new Set(ALL_PROJECTS.slice(0, 3).map(p => p.id))

  const filtered = useMemo(() => {
    return ALL_PROJECTS.filter(p => {
      if (scope === 'yours' && !myProjectIds.has(p.id)) return false
      const q = query.toLowerCase()
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      const matchS = statusFilter==='All' || p.statusLabel===statusFilter || p.status===statusFilter.toLowerCase().replace(' ','-')
      const matchC = clientFilter==='All' || p.client===clientFilter
      const matchP = phaseFilter==='All'  || p.phase===phaseFilter
      return matchQ && matchS && matchC && matchP
    })
  }, [query, statusFilter, clientFilter, phaseFilter, scope])

  return (
    <div style={{ minHeight:'100vh', background:'var(--ground)', fontFamily:'var(--font)', display:'flex', flexDirection:'column' }}>

      {/* Topbar */}
      <div style={{
        height:44, background:'var(--ink-900)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 40px', flexShrink:0, position:'sticky', top:0, zIndex:10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <FieldMark/>
          </button>
          <span style={{ color:'rgba(255,255,255,0.15)', fontSize:13 }}>/</span>
          <span style={{ fontSize:11, fontWeight:500, letterSpacing:'0.04em', color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)' }}>
            Projects
          </span>
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
      <div style={{ flex:1, width:'100%', padding:'44px 72px 80px' }}>

        {/* Page header + scope toggle */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.28, ease:[0.25,1,0.5,1] }}
          style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}
        >
          <div>
            <h1 style={{
              fontFamily:'var(--font-serif)', fontSize:32, fontWeight:400,
              letterSpacing:'-0.01em', color:'var(--ink-900)', marginBottom:4,
            }}>Projects</h1>
            <p style={{ fontSize:12, color:'var(--ink-400)' }}>{filtered.length} project{filtered.length!==1?'s':''} · {ALL_PROJECTS.filter(p=>p.status==='on-schedule').length} on track</p>
          </div>

          {/* Scope toggle */}
          <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', flexShrink:0 }}>
            {['yours','all'].map(v => (
              <button key={v} onClick={() => setScope(v)}
                style={{
                  padding:'6px 16px', fontSize:11, fontWeight:600, fontFamily:'var(--font)',
                  letterSpacing:'0.03em', border:'none', cursor:'pointer',
                  background: scope===v ? 'var(--ink-900)' : 'transparent',
                  color: scope===v ? 'white' : 'var(--ink-500)',
                  borderRight: v==='yours' ? '1px solid var(--border)' : 'none',
                  transition:'background 0.12s, color 0.12s',
                }}>
                {v==='yours' ? 'Your projects' : 'All projects'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search + filters */}
        <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:'0 0 240px' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
              style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-300)', pointerEvents:'none' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects, clients, locations…"
              style={{
                width:'100%', height:36, paddingLeft:32, paddingRight:12,
                fontSize:12, background:'var(--surface)',
                border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
                fontFamily:'var(--font)', color:'var(--ink-900)', outline:'none',
              }}
            />
          </div>

          {/* Filter chips */}
          {[
            { label:'Status', options:STATUSES, value:statusFilter, set:setStatus },
            { label:'Client', options:CLIENTS,  value:clientFilter, set:setClient },
            { label:'Phase',  options:PHASES,   value:phaseFilter,  set:setPhase  },
          ].map(({ label, options, value, set }) => (
            <select
              key={label}
              value={value}
              onChange={e => set(e.target.value)}
              style={{
                height:36, padding:'0 28px 0 12px', fontSize:12, fontFamily:'var(--font)',
                color: value==='All' ? 'var(--ink-500)' : 'var(--ink-900)',
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--r-sm)', outline:'none', cursor:'pointer',
                fontWeight: value==='All' ? 400 : 500,
              }}
            >
              {options.map(o => <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>)}
            </select>
          ))}

          {/* Clear filters */}
          {(query || statusFilter!=='All' || clientFilter!=='All' || phaseFilter!=='All') && (
            <button
              onClick={() => { setQuery(''); setStatus('All'); setClient('All'); setPhase('All') }}
              style={{
                fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                cursor:'pointer', fontFamily:'var(--font)', padding:'4px 0',
              }}
            >Clear filters</button>
          )}
        </div>

        {/* Table header */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'8px minmax(0,1fr) 120px 100px 110px 120px 32px',
          gap:16, padding:'0 18px 10px',
          borderBottom:'1.5px solid var(--ink-900)',
        }}>
          <div/>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)' }}>Project</p>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)' }}>Location</p>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)' }}>Event date</p>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)' }}>Phase</p>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)' }}>Lead</p>
          <div/>
        </div>

        {/* Rows */}
        <div>
          {filtered.map((p, i) => (
            <ProjectRow key={p.id} p={p} index={i} onOpen={onOpenProject}/>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding:'48px 0', textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:6 }}>
                No projects match
              </p>
              <p style={{ fontSize:12, color:'var(--ink-300)' }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:16 }}>
            {filtered.length} project{filtered.length!==1?'s':''} · Click any row to open
          </p>
        )}
      </div>
    </div>
  )
}
