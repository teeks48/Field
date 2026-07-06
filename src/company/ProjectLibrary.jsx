import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ALL_PROJECTS, REGIONS, CATEGORY_GROUPS, getAllProjectsWithUserCreated } from './companyData.js'

function Av({ initials, size=22 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)' }}>
      {initials||'?'}
    </div>
  )
}

function statusStyle(s) {
  if (s==='active')    return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)', dot:'var(--signal-green-dot)'  }
  if (s==='attention') return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)', dot:'var(--signal-amber-dot)' }
  if (s==='completed') return { color:'var(--ink-400)',           bg:'var(--ground-dim)',       dot:'var(--ink-200)'          }
  return                       { color:'var(--ink-300)',           bg:'var(--ground-dim)',       dot:'var(--ink-200)'          }
}

// Category tag colors — by group, so related categories read consistently
function categoryTagStyle(category) {
  const inActivations = CATEGORY_GROUPS.find(g => g.group==='Activations')?.items.includes(category)
  const inProduction  = CATEGORY_GROUPS.find(g => g.group==='Production')?.items.includes(category)
  const inDigital     = CATEGORY_GROUPS.find(g => g.group==='Digital')?.items.includes(category)
  if (inActivations) return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  if (inProduction)  return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  if (inDigital)     return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  return                    { color:'var(--ink-500)',            bg:'var(--ground-dim)'       }
}

const CLIENTS = ['All', ...Array.from(new Set(ALL_PROJECTS.map(p => p.client))).sort()]

// People filterable by — derived from real lead/EP names already in the data,
// since those are the only roles with both a full name and initials on file.
const TEAM_MEMBERS = (() => {
  const map = new Map()
  ALL_PROJECTS.forEach(p => {
    if (p.lead) map.set(p.lead, p.leadInitials)
    if (p.ep)   map.set(p.ep,   p.epInitials)
  })
  return Array.from(map, ([name, initials]) => ({ name, initials })).sort((a,b) => a.name.localeCompare(b.name))
})()

const SORT_OPTIONS = [
  { id:'name',     label:'Name' },
  { id:'date',     label:'Last contact' },
  { id:'budget',   label:'Budget' },
  { id:'category', label:'Category' },
]

function parseBudget(b) {
  return parseInt(String(b).replace(/[^0-9]/g, ''), 10) || 0
}
function parseDate(d) {
  const t = new Date(d).getTime()
  return isNaN(t) ? 0 : t
}

/* ─────────────────────────────────────────────────────────
   Filters sidebar
   ─────────────────────────────────────────────────────── */
function FiltersSidebar({
  sort, setSort, client, setClient, region, setRegion,
  category, setCategory, teamMember, setTeamMember, onClose,
}) {
  const radioRow = (label, active, onClick) => (
    <button key={label} onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left',
        padding:'6px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
        background: active ? 'var(--ink-900)' : 'var(--border-med)' }}/>
      <span style={{ fontSize:13, color: active ? 'var(--ink-900)' : 'var(--ink-500)',
        fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  )

  return (
    <motion.div
      initial={{ x:-280, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:-280, opacity:0 }}
      transition={{ type:'spring', damping:30, stiffness:300 }}
      style={{ width:240, flexShrink:0, paddingRight:28, borderRight:'1px solid var(--border)' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)' }}>Filters</p>
        <button onClick={onClose}
          style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
            cursor:'pointer', fontFamily:'var(--font)' }}>Hide</button>
      </div>

      {/* Sort by */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:8 }}>Sort by</p>
      <div style={{ marginBottom:22 }}>
        {SORT_OPTIONS.map(s => radioRow(s.label, sort===s.id, () => setSort(s.id)))}
      </div>

      {/* Client */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:8 }}>Client</p>
      <select value={client} onChange={e=>setClient(e.target.value)}
        style={{ width:'100%', fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)',
          borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-700)',
          outline:'none', cursor:'pointer', marginBottom:22 }}>
        {CLIENTS.map(c => <option key={c} value={c}>{c==='All' ? 'All clients' : c}</option>)}
      </select>

      {/* Category — grouped */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:8 }}>Category</p>
      <div style={{ marginBottom:14 }}>
        {radioRow('All categories', category==='All', () => setCategory('All'))}
      </div>
      {CATEGORY_GROUPS.map(g => (
        <div key={g.group} style={{ marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:6 }}>{g.group}</p>
          {g.items.map(item => radioRow(item, category===item, () => setCategory(item)))}
        </div>
      ))}

      {/* Region */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:8, marginTop:6 }}>Region</p>
      <div style={{ marginBottom:22 }}>
        {REGIONS.map(r => radioRow(r==='All' ? 'All regions' : r, region===r, () => setRegion(r)))}
      </div>

      {/* Team member */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:8 }}>Team member</p>
      <div>
        <button onClick={() => setTeamMember('All')}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left',
            padding:'6px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
            background: teamMember==='All' ? 'var(--ink-900)' : 'var(--border-med)' }}/>
          <span style={{ fontSize:13, color: teamMember==='All' ? 'var(--ink-900)' : 'var(--ink-500)',
            fontWeight: teamMember==='All' ? 600 : 400 }}>All members</span>
        </button>
        {TEAM_MEMBERS.map(m => (
          <button key={m.name} onClick={() => setTeamMember(m.name)}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left',
              padding:'6px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
            <Av initials={m.initials} size={18}/>
            <span style={{ fontSize:13, color: teamMember===m.name ? 'var(--ink-900)' : 'var(--ink-500)',
              fontWeight: teamMember===m.name ? 600 : 400 }}>{m.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export default function ProjectLibrary({ onOpenProject }) {
  const [query,      setQuery]      = useState('')
  const [client,     setClient]     = useState('All')
  const [region,     setRegion]     = useState('All')
  const [category,   setCategory]   = useState('All')
  const [teamMember, setTeamMember] = useState('All')
  const [sort,        setSort]      = useState('name')
  const [view,        setView]      = useState('table') // 'table' | 'cards'
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = getAllProjectsWithUserCreated().filter(p => {
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!(p.name||'').toLowerCase().includes(q) && !(p.client||'').toLowerCase().includes(q) &&
            !(p.lead||'').toLowerCase().includes(q) && !(p.location||'').toLowerCase().includes(q)) return false
      }
      if (client     !== 'All' && p.client   !== client)   return false
      if (region     !== 'All' && p.region   !== region)   return false
      if (category   !== 'All' && p.category !== category) return false
      if (teamMember !== 'All' && p.lead !== teamMember && p.ep !== teamMember) return false
      return true
    })

    if (sort === 'name')     list = [...list].sort((a,b) => a.name.localeCompare(b.name))
    if (sort === 'budget')   list = [...list].sort((a,b) => parseBudget(b.budget) - parseBudget(a.budget))
    if (sort === 'category') list = [...list].sort((a,b) => a.category.localeCompare(b.category))
    if (sort === 'date')     list = [...list].sort((a,b) => parseDate(b.startDate) - parseDate(a.startDate))

    return list
  }, [query, client, region, category, teamMember, sort])

  const clearAll = () => { setQuery(''); setClient('All'); setRegion('All'); setCategory('All'); setTeamMember('All') }
  const filtersActive = client!=='All' || region!=='All' || category!=='All' || teamMember!=='All'

  return (
    <div style={{ width:'100%', padding:'36px 72px 80px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:8 }}>Field · Projects</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
            letterSpacing:'-0.04em', color:'var(--ink-900)', marginBottom:4 }}>Project Library</h1>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>
            {filtered.length} of {ALL_PROJECTS.length} projects · All CAPE Creative projects
          </p>
        </div>
        <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden' }}>
          {[['table','≡'],['cards','⊞']].map(([m,icon])=>(
            <button key={m} onClick={()=>setView(m)}
              style={{ width:36, height:34, display:'flex', alignItems:'center', justifyContent:'center',
                background:view===m?'var(--ink-900)':'var(--surface)',
                color:view===m?'white':'var(--ink-400)', border:'none', cursor:'pointer', fontSize:14 }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Filters toggle + search */}
      <div style={{ display:'flex', gap:8, marginBottom:24, alignItems:'center' }}>
        <button onClick={() => setFiltersOpen(o => !o)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:34,
            fontSize:12, fontWeight:600, fontFamily:'var(--font)', cursor:'pointer',
            background: filtersOpen || filtersActive ? 'var(--ink-900)' : 'var(--surface)',
            color: filtersOpen || filtersActive ? 'white' : 'var(--ink-600)',
            border:`1px solid ${filtersOpen || filtersActive ? 'var(--ink-900)' : 'var(--border)'}`, borderRadius:4 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 3.5h9M4 6.5h5M5.5 9.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Filters{filtersActive ? ' ·' : ''}
        </button>

        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, padding:'0 12px',
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:3, height:34 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
            <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by keyword, client, or team…"
            style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'var(--ink-800)', background:'transparent', fontFamily:'var(--font)' }}/>
          {query && <button onClick={()=>setQuery('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:14 }}>×</button>}
        </div>

        {filtersActive && (
          <button onClick={clearAll}
            style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
              cursor:'pointer', fontFamily:'var(--font)', whiteSpace:'nowrap' }}>Clear all</button>
        )}
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display:'flex', gap:28 }}>
        <AnimatePresence>
          {filtersOpen && (
            <FiltersSidebar
              sort={sort} setSort={setSort}
              client={client} setClient={setClient}
              region={region} setRegion={setRegion}
              category={category} setCategory={setCategory}
              teamMember={teamMember} setTeamMember={setTeamMember}
              onClose={() => setFiltersOpen(false)}
            />
          )}
        </AnimatePresence>

        <div style={{ flex:1, minWidth:0 }}>
          {/* ── TABLE VIEW ── */}
          {view === 'table' && (
            <div>
              <div style={{ display:'grid',
                gridTemplateColumns:'minmax(220px,1fr) 110px 100px minmax(160px,1.4fr) 120px 150px 90px',
                gap:16, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
                {['Project','Client','Region','Tags','Status','Team','Date'].map((h,i)=>(
                  <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
                ))}
              </div>

              {filtered.map(p => {
                const ss = statusStyle(p.status)
                const ts = categoryTagStyle(p.category)
                return (
                  <motion.div key={p.id}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.14 }}
                    onClick={() => onOpenProject(p)}
                    style={{ display:'grid',
                      gridTemplateColumns:'minmax(220px,1fr) 110px 100px minmax(160px,1.4fr) 120px 150px 90px',
                      gap:16, padding:'13px 0', borderBottom:'1px solid var(--border)',
                      cursor:'pointer', alignItems:'center', transition:'background 0.1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.012)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div>
                      <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:2, letterSpacing:'-0.01em' }}>{p.name}</p>
                      <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.location||'—'} · {p.phase||'Production'}</p>
                    </div>
                    <p style={{ fontSize:12, color:'var(--ink-700)' }}>{p.client}</p>
                    <p style={{ fontSize:12, color:'var(--ink-500)' }}>{p.region||'—'}</p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10.5, fontWeight:600, padding:'3px 9px', borderRadius:10,
                        color:ts.color, background:ts.bg, whiteSpace:'nowrap' }}>{(p.category||'production').toLowerCase()}</span>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                      color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2, whiteSpace:'nowrap', justifySelf:'start' }}>
                      {p.statusLabel||p.status||'Active'}
                    </span>
                    <div style={{ display:'flex', gap:-3 }}>
                      {(p.team||[]).slice(0,3).map((t,i) => (
                        <div key={i} style={{ marginLeft:i===0?0:-5 }}><Av initials={t} size={22}/></div>
                      ))}
                      {(p.team||[]).length > 3 && (
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--border)',
                          display:'flex', alignItems:'center', justifyContent:'center', marginLeft:-5,
                          fontSize:7, fontWeight:600, color:'var(--ink-400)' }}>+{(p.team||[]).length-3}</div>
                      )}
                    </div>
                    <p style={{ fontSize:11, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{p.eventDate||'TBC'}</p>
                  </motion.div>
                )
              })}

              {filtered.length === 0 && (
                <div style={{ padding:'60px 0', textAlign:'center' }}>
                  <p style={{ fontFamily:'var(--font-serif)', fontSize:18, fontStyle:'italic', color:'var(--ink-200)', marginBottom:8 }}>No projects match your filters.</p>
                  <button onClick={clearAll}
                    style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                    Clear all filters
                  </button>
                </div>
              )}
              <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:14 }}>Showing {filtered.length} of {ALL_PROJECTS.length} projects · Click any row to open</p>
            </div>
          )}

          {/* ── CARDS VIEW ── */}
          {view === 'cards' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
              {filtered.map(p => {
                const ss = statusStyle(p.status)
                const ts = categoryTagStyle(p.category)
                return (
                  <div key={p.id} onClick={() => onOpenProject(p)}
                    style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4,
                      padding:'16px 18px', cursor:'pointer', transition:'all 0.12s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-med)';e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.06)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.client}</p>
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                        color:ss.color, background:ss.bg, padding:'2px 8px', borderRadius:2 }}>{p.statusLabel||p.status||'Active'}</span>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', lineHeight:1.3, marginBottom:10 }}>{p.name}</p>
                    <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                      <span style={{ fontSize:10.5, fontWeight:600, padding:'3px 9px', borderRadius:10,
                        color:ts.color, background:ts.bg }}>{(p.category||'production').toLowerCase()}</span>
                      <span style={{ fontSize:10.5, fontWeight:500, padding:'3px 9px', borderRadius:10,
                        color:'var(--ink-500)', background:'var(--ground-dim)' }}>{(p.region||'—').toLowerCase()}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                        {p.team.slice(0,4).map((t,i) => (
                          <div key={i} style={{ marginLeft:i===0?0:-6, width:22, height:22, borderRadius:'50%',
                            background:'var(--ink-800)', border:'1.5px solid var(--surface)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)' }}>
                            {t}
                          </div>
                        ))}
                        {p.team.length > 4 && (
                          <div style={{ marginLeft:-6, width:22, height:22, borderRadius:'50%',
                            background:'var(--border)', border:'1.5px solid var(--surface)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:7, fontWeight:600, color:'var(--ink-400)' }}>
                            +{p.team.length - 4}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>{p.eventDate||'TBC'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
