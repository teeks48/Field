/**
 * TeamDirectory.jsx — workspace sidebar "Team directory" under Libraries.
 * Read-only view of CAPE_DIRECTORY with editable profiles (Save/Cancel).
 * All profile fields start null — no fabricated data.
 */
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CAPE_DIRECTORY, DEPARTMENTS, getRegion } from '../../data/capeDirectory.js'
import { useStore, A } from '../../store.jsx'
import FocusModal from '../../components/FocusModal.jsx'

/* ─── Avatar ─────────────────────────────────────────────── */
function Av({ initials, size=36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-100)',
      flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size<32?9:11, fontWeight:600, color:'var(--ink-500)', fontFamily:'var(--font)' }}>
      {initials||'?'}
    </div>
  )
}

/* ─── Expertise tag ──────────────────────────────────────── */
function Tag({ label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:500,
      color:'var(--ink-600)', background:'var(--ground-dim)', border:'1px solid var(--border)',
      borderRadius:3, padding:'2px 8px', whiteSpace:'nowrap' }}>{label}</span>
  )
}

/* ─────────────────────────────────────────────────────────
   Profile edit modal — Save/Cancel, no autosave
   ─────────────────────────────────────────────────────── */
function ProfileModal({ person, onClose, onSave }) {
  // Draft state — only committed on Save
  const [draft, setDraft] = useState({
    title:             person.title        || '',
    dept:              Array.isArray(person.dept) ? [...person.dept] : [],
    yearsAtCape:       person.yearsAtCape  || '',
    languages:         person.languages    || '',
    bio:               person.bio          || '',
    certifications:    person.certifications || '',
    preferredName:     person.preferredName  || '',
    expertise:         Array.isArray(person.expertise) ? person.expertise : [],
  })
  const [newTag, setNewTag]   = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [newDept, setNewDept] = useState('')
  const [addingDept, setAddingDept] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = k => e => setDraft(p => ({...p, [k]: e.target.value}))

  const addTag = () => {
    const t = newTag.trim()
    if (t && !draft.expertise.includes(t)) setDraft(p => ({...p, expertise:[...p.expertise, t]}))
    setNewTag('')
    // Stays open intentionally — keeps focus in the input so the next
    // tag can be typed immediately without re-clicking "+ Add expertise".
  }
  const finishAddingTag = () => {
    addTag()
    setAddingTag(false)
  }
  const removeTag = t => setDraft(p => ({...p, expertise: p.expertise.filter(x => x!==t)}))

  const addDept = () => {
    const d = newDept.trim()
    if (d && !draft.dept.includes(d)) setDraft(p => ({...p, dept:[...p.dept, d]}))
    setNewDept('')
    // Stays open — same continuous-add behavior as expertise tags.
  }
  const finishAddingDept = () => {
    addDept()
    setAddingDept(false)
  }

  const handleSave = () => {
    onSave({
      ...person,
      title:          draft.title.trim()         || null,
      dept:           draft.dept,
      yearsAtCape:    draft.yearsAtCape.trim()   || null,
      languages:      draft.languages.trim()     || null,
      bio:            draft.bio.trim()           || null,
      certifications: draft.certifications.trim()|| null,
      preferredName:  draft.preferredName.trim() || null,
      expertise:      draft.expertise,
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 700)
  }

  const fieldStyle = {
    width:'100%', fontSize:13, padding:'7px 10px',
    border:'1px solid var(--border)', borderRadius:3,
    fontFamily:'var(--font)', background:'var(--surface)',
    color:'var(--ink-900)', outline:'none', lineHeight:1.5,
  }

  return (
    <FocusModal onClose={onClose} width="700px" maxWidth="740px">
      {/* Header */}
      <div style={{ display:'flex', gap:14, alignItems:'center',
        padding:'22px 26px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <Av initials={person.initials} size={48}/>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.02em', color:'var(--ink-900)', marginBottom:3 }}>
            {person.firstName} {person.lastName}
          </h2>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>
            {person.email} · {person.location}
          </p>
        </div>
        <button onClick={onClose}
          style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>

      {/* Body — two column */}
      <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'minmax(0,1fr) 260px' }}>

        {/* Left — editable profile fields */}
        <div style={{ overflowY:'auto', padding:'20px 24px', borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column', gap:16 }}>

          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
            color:'var(--ink-300)', paddingBottom:8, borderBottom:'1px solid var(--border)', margin:0 }}>
            Profile — editable
          </p>

          {/* Job Title */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Job title</label>
            <input value={draft.title} onChange={set('title')} placeholder="+ Add job title" style={fieldStyle}/>
          </div>

          {/* Department — multi-select */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Department</label>
            <p style={{ fontSize:11, color:'var(--ink-300)', marginBottom:8 }}>
              Select all that apply — e.g. Hospitality and Production
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
              {DEPARTMENTS.map(d => {
                const active = draft.dept.includes(d)
                return (
                  <button key={d} type="button"
                    onClick={() => setDraft(prev => ({ ...prev, dept: active ? prev.dept.filter(x=>x!==d) : [...prev.dept, d] }))}
                    style={{ fontSize:12, fontWeight:500, padding:'5px 11px', borderRadius:3,
                      cursor:'pointer', fontFamily:'var(--font)',
                      background: active ? 'var(--signal-blue-text)' : 'var(--surface)',
                      color: active ? 'white' : 'var(--ink-600)',
                      border: `1px solid ${active ? 'var(--signal-blue-text)' : 'var(--border)'}` }}>
                    {d}
                  </button>
                )
              })}
              {/* Any custom departments already added, not in the preset list */}
              {draft.dept.filter(d => !DEPARTMENTS.includes(d)).map(d => (
                <span key={d} style={{ display:'inline-flex', alignItems:'center', gap:4,
                  fontSize:12, fontWeight:500, padding:'5px 11px', borderRadius:3,
                  background:'var(--signal-blue-text)', color:'white' }}>
                  {d}
                  <button onClick={() => setDraft(prev => ({...prev, dept: prev.dept.filter(x=>x!==d)}))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)',
                      fontSize:13, lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
            {addingDept ? (
              <input autoFocus value={newDept} onChange={e=>setNewDept(e.target.value)}
                onBlur={finishAddingDept}
                onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();addDept()} if(e.key==='Escape'){setNewDept('');setAddingDept(false)} }}
                placeholder="Add custom department…"
                style={{ fontSize:12, height:30, padding:'0 10px', border:'1px solid var(--border-med)',
                  borderRadius:3, outline:'none', fontFamily:'var(--font)', minWidth:160,
                  background:'var(--surface)', color:'var(--ink-800)' }}/>
            ) : (
              <button onClick={() => setAddingDept(true)}
                style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
                  cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                + Add department
              </button>
            )}
          </div>

          {/* Years at CAPE */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Years at CAPE</label>
            <input value={draft.yearsAtCape} onChange={set('yearsAtCape')} placeholder="+ Add years at CAPE" style={fieldStyle}/>
          </div>

          {/* Languages */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Languages</label>
            <input value={draft.languages} onChange={set('languages')} placeholder="+ Add languages" style={fieldStyle}/>
          </div>

          {/* Preferred name */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Preferred name</label>
            <input value={draft.preferredName} onChange={set('preferredName')} placeholder="+ Add preferred name (optional)" style={fieldStyle}/>
          </div>

          {/* Professional expertise — tags */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:8 }}>Professional expertise</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
              {draft.expertise.map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4,
                  fontSize:11, fontWeight:500, color:'var(--ink-600)', background:'var(--ground-dim)',
                  border:'1px solid var(--border)', borderRadius:3, padding:'2px 8px' }}>
                  {t}
                  <button onClick={() => removeTag(t)}
                    style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:12,lineHeight:1,padding:0 }}>×</button>
                </span>
              ))}
              {addingTag ? (
                <input autoFocus value={newTag} onChange={e=>setNewTag(e.target.value)}
                  onBlur={finishAddingTag}
                  onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();addTag()} if(e.key==='Escape'){setNewTag('');setAddingTag(false)} }}
                  placeholder="Add expertise…"
                  style={{ fontSize:11, height:24, padding:'0 8px', border:'1px solid var(--border-med)',
                    borderRadius:3, outline:'none', fontFamily:'var(--font)', minWidth:120,
                    background:'var(--surface)', color:'var(--ink-800)' }}/>
              ) : (
                <button onClick={() => setAddingTag(true)}
                  style={{ fontSize:11, color:'var(--ink-300)', background:'none', border:'none',
                    cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                  + Add expertise
                </button>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Certifications &amp; training</label>
            <textarea value={draft.certifications} onChange={set('certifications')}
              placeholder="+ Add certifications, training or qualifications" rows={2}
              style={{ ...fieldStyle, resize:'none', height:'auto' }}/>
          </div>

          {/* Bio */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-400)', display:'block', marginBottom:5 }}>Bio</label>
            <textarea value={draft.bio} onChange={set('bio')}
              placeholder="+ Add bio" rows={4}
              style={{ ...fieldStyle, resize:'none', height:'auto' }}/>
          </div>
        </div>

        {/* Right — contact (read-only) + projects (auto) */}
        <div style={{ overflowY:'auto', padding:'20px 18px' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
            color:'var(--ink-300)', paddingBottom:8, borderBottom:'1px solid var(--border)', marginBottom:12 }}>
            Contact
          </p>
          {[
            ['Email',    person.email],
            ['Phone',    person.phone],
            ['Location', person.location],
            ...(person.locallyYoursEmail ? [['Locally Yours', person.locallyYoursEmail]] : []),
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', flexDirection:'column', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{l}</p>
              <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)', wordBreak:'break-all' }}>{v||'—'}</p>
            </div>
          ))}

          {/* Projects — auto, never manually edited */}
          {(person.currentProjects?.length > 0 || person.pastProjects?.length > 0) && (
            <div style={{ marginTop:16 }}>
              {person.currentProjects?.length > 0 && (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)' }}>Current projects</p>
                    <p style={{ fontSize:10, color:'var(--ink-200)', fontStyle:'italic' }}>Auto</p>
                  </div>
                  {person.currentProjects.map(p => (
                    <p key={p} style={{ fontSize:12, color:'var(--ink-700)', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>· {p}</p>
                  ))}
                </>
              )}
              {person.pastProjects?.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)' }}>Past projects</p>
                    <p style={{ fontSize:10, color:'var(--ink-200)', fontStyle:'italic' }}>Auto</p>
                  </div>
                  {person.pastProjects.map(p => (
                    <p key={p} style={{ fontSize:12, color:'var(--ink-400)', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>· {p}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer — Save / Cancel */}
      <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0, background:'var(--ground-dim)' }}>
        <button onClick={onClose}
          style={{ padding:'8px 20px', fontSize:12, fontWeight:500, background:'transparent',
            border:'1px solid var(--border)', borderRadius:4, cursor:'pointer',
            color:'var(--ink-500)', fontFamily:'var(--font)' }}>
          Cancel
        </button>
        <button onClick={handleSave}
          style={{ padding:'8px 24px', fontSize:12, fontWeight:700,
            background: saved ? 'var(--signal-green-dot)' : 'var(--ink-900)',
            color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)',
            transition:'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save profile'}
        </button>
      </div>
    </FocusModal>
  )
}

/* ─── Directory row ──────────────────────────────────────── */
function DirectoryRow({ person, onClick }) {
  const [hov, setHov] = useState(false)
  const expertise = Array.isArray(person.expertise) ? person.expertise : []
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 0',
        borderBottom:'1px solid var(--border)', cursor:'pointer',
        background:hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s' }}>
      <Av initials={person.initials} size={34}/>
      <div style={{ width:190, flexShrink:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', marginBottom:1 }}>
          {person.firstName} {person.lastName}
        </p>
        {person.title
          ? <p style={{ fontSize:12, color:'var(--ink-500)' }}>{person.title}</p>
          : <p style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>+ Add job title</p>}
      </div>
      <div style={{ width:110, flexShrink:0, display:'flex', flexWrap:'wrap', gap:4 }}>
        {Array.isArray(person.dept) && person.dept.length > 0
          ? person.dept.map(d => (
              <span key={d} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                color:'var(--signal-blue-text)', background:'var(--signal-blue-bg)', padding:'2px 7px', borderRadius:2 }}>{d}</span>
            ))
          : <span style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>+ Add dept</span>}
      </div>
      <div style={{ width:130, flexShrink:0 }}>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{person.location}</p>
      </div>
      <div style={{ flex:1, display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
        {expertise.length > 0
          ? expertise.slice(0,3).map(t => <Tag key={t} label={t}/>)
          : <span style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>+ Add expertise</span>}
        {expertise.length > 3 && <span style={{ fontSize:11, color:'var(--ink-300)' }}>+{expertise.length-3}</span>}
      </div>
      <motion.div animate={{ opacity:hov?1:0.2, x:hov?0:-2 }} transition={{ duration:0.1 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main page
   ─────────────────────────────────────────────────────── */
export default function TeamDirectory() {
  const { state, dispatch } = useStore()
  const profiles = useMemo(() =>
    Object.fromEntries(CAPE_DIRECTORY.map(p => {
      const override = state.directoryOverrides[p.id] || {}
      const merged = { ...p, ...override }
      return [p.id, {
        ...merged,
        expertise: Array.isArray(merged.expertise) ? merged.expertise : [],
        dept: Array.isArray(merged.dept) ? merged.dept : [],
        region: merged.region || getRegion(merged.location),
      }]
    }))
  , [state.directoryOverrides])
  const [query,    setQuery]    = useState('')
  const [dept,     setDept]     = useState('All')
  const [selected, setSelected] = useState(null)

  const people = useMemo(() =>
    Object.values(profiles).sort((a,b) => a.lastName.localeCompare(b.lastName))
  , [profiles])

  const filtered = useMemo(() => people.filter(p => {
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!`${p.firstName} ${p.lastName}`.toLowerCase().includes(q) &&
          !(p.title||'').toLowerCase().includes(q) &&
          !(Array.isArray(p.dept) && p.dept.some(d=>d.toLowerCase().includes(q))) &&
          !(p.location||'').toLowerCase().includes(q) &&
          !(p.expertise||[]).some(e=>e.toLowerCase().includes(q))) return false
    }
    if (dept !== 'All' && !(Array.isArray(p.dept) && p.dept.includes(dept))) return false
    return true
  }), [people, query, dept])

  const saveProfile = updated => {
    // Only persist the fields a profile can actually edit — keeps the
    // override object small and avoids re-storing static directory fields.
    const { id, firstName, lastName, initials, location, phone, email, locallyYoursEmail, currentProjects, pastProjects, photo, ...editable } = updated
    dispatch(A.updateDirectoryProfile(id, editable))
  }

  const incomplete = people.filter(p => !p.title).length

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:8 }}>Libraries · Team Directory</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
            letterSpacing:'-0.04em', color:'var(--ink-900)', marginBottom:4 }}>Team Directory</h1>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>
            {people.length} people · Click any row to view and edit profile
          </p>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
          <div style={{ flex:'0 0 auto', minWidth:220, display:'flex', alignItems:'center', gap:8,
            padding:'0 12px', background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:4, height:34 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
              <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search team…"
              style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'var(--ink-800)',
                background:'transparent', fontFamily:'var(--font)' }}/>
            {query && <button onClick={()=>setQuery('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:14 }}>×</button>}
          </div>
          <select value={dept} onChange={e=>setDept(e.target.value)}
            style={{ fontSize:12, height:34, padding:'0 10px', border:'1px solid var(--border)',
              borderRadius:4, fontFamily:'var(--font)', background:'var(--surface)',
              color:'var(--ink-700)', outline:'none', cursor:'pointer' }}>
            <option value="All">All departments</option>
            {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
          </select>
          {(query||dept!=='All') && (
            <button onClick={()=>{setQuery('');setDept('All')}}
              style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
                cursor:'pointer', fontFamily:'var(--font)' }}>Reset</button>
          )}
        </div>

        {/* Count + incomplete notice */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>
            {filtered.length === people.length ? `${people.length} team members` : `${filtered.length} of ${people.length}`}
          </p>
          {incomplete > 0 && (
            <p style={{ fontSize:11, color:'var(--signal-amber-text)' }}>
              {incomplete} profile{incomplete!==1?'s':''} missing job title — click to complete
            </p>
          )}
        </div>

        {/* Column headers */}
        <div style={{ display:'flex', gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)', alignItems:'center' }}>
          <div style={{ width:34, flexShrink:0 }}/>
          <p style={{ width:190, flexShrink:0, fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>Name</p>
          <p style={{ width:110, flexShrink:0, fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>Department</p>
          <p style={{ width:130, flexShrink:0, fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>Location</p>
          <p style={{ flex:1, fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>Expertise</p>
          <div style={{ width:12, flexShrink:0 }}/>
        </div>

        {filtered.map(p => (
          <DirectoryRow key={p.id} person={profiles[p.id]||p} onClick={()=>setSelected(profiles[p.id]||p)}/>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding:'60px 0', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:17, fontStyle:'italic', color:'var(--ink-200)', marginBottom:8 }}>
              {query ? `No results for "${query}"` : 'No team members match this filter.'}
            </p>
          </div>
        )}

        <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:18 }}>
          Verified fields (name, email, phone, location) cannot be edited here. Profile fields save when you click Save profile.
        </p>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <ProfileModal key={selected.id} person={selected}
            onClose={() => setSelected(null)}
            onSave={updated => { saveProfile(updated); setSelected(null) }}/>
        )}
      </AnimatePresence>
    </div>
  )
}
