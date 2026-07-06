import React, { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CAPE_DIRECTORY, DEPARTMENTS, REGIONS, getRegion } from '../data/capeDirectory.js'
import { ALL_PROJECTS } from './companyData.js'
import { useStore, A } from '../store.jsx'
import FocusModal from '../components/FocusModal.jsx'
import LibraryPage, { EmptyState } from './LibraryPage.jsx'

/* ─── Safe string helper — never crashes on null ─────────── */
const s = v => (v && typeof v === 'string') ? v.trim() : ''

/* ─── Live project count — derived from real ALL_PROJECTS data,
   matched by initials against team/lead/ep, not the hand-seeded
   currentProjects/pastProjects arrays on the directory record
   (which are disconnected placeholder data). ───────────────── */
function countProjects(initials) {
  if (!initials) return 0
  return ALL_PROJECTS.filter(p =>
    p.leadInitials === initials ||
    p.epInitials === initials ||
    (Array.isArray(p.team) && p.team.includes(initials))
  ).length
}

/* ─── Live project list — same matching logic as countProjects,
   but returns the actual project records for display. ───── */
function getCurrentProjects(initials) {
  if (!initials) return []
  return ALL_PROJECTS.filter(p =>
    p.leadInitials === initials ||
    p.epInitials === initials ||
    (Array.isArray(p.team) && p.team.includes(initials))
  )
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Av({ initials }) {
  return (
    <div style={{
      width:36, height:36, borderRadius:'50%', flexShrink:0,
      background:'var(--ink-100)', display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:11, fontWeight:600,
      color:'var(--ink-500)', fontFamily:'var(--font)',
    }}>
      {s(initials) || '?'}
    </div>
  )
}

/* ─── Expertise tag ──────────────────────────────────────── */
function Tag({ label }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:500,
      color:'var(--ink-600)', background:'var(--ground-dim)',
      border:'1px solid var(--border)', borderRadius:3, padding:'2px 8px',
      whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

/* ─────────────────────────────────────────────────────────
   Profile modal — Save / Cancel, draft state
   ─────────────────────────────────────────────────────── */
function ProfileModal({ person, onClose, onSave }) {
  const [title,          setTitle]          = useState(s(person.title))
  const [dept,           setDept]           = useState(Array.isArray(person.dept) ? [...person.dept] : [])
  const [yearsAtCape,    setYears]          = useState(s(person.yearsAtCape))
  const [languages,      setLanguages]      = useState(s(person.languages))
  const [preferredName,  setPreferredName]  = useState(s(person.preferredName))
  const [bio,            setBio]            = useState(s(person.bio))
  const [region,         setRegion]         = useState(s(person.region))
  const [tier,           setTier]           = useState(s(person.tier))
  const [certifications, setCerts]          = useState(s(person.certifications))
  const [expertise,      setExpertise]      = useState(
    Array.isArray(person.expertise) ? [...person.expertise] : []
  )
  const [newTag,    setNewTag]    = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [newDept,    setNewDept]    = useState('')
  const [addingDept, setAddingDept] = useState(false)
  const [saved,     setSaved]     = useState(false)

  const addTag = () => {
    const t = newTag.trim()
    if (t && !expertise.includes(t)) setExpertise(prev => [...prev, t])
    setNewTag('')
    // Stays open intentionally — keeps focus so the next tag can be
    // typed immediately without re-clicking "+ Add expertise".
  }
  const finishAddingTag = () => {
    addTag()
    setAddingTag(false)
  }
  const addDept = () => {
    const d = newDept.trim()
    if (d && !dept.includes(d)) setDept(prev => [...prev, d])
    setNewDept('')
  }
  const finishAddingDept = () => {
    addDept()
    setAddingDept(false)
  }
  const removeTag = t => setExpertise(prev => prev.filter(x => x !== t))

  const handleSave = () => {
    onSave({
      ...person,
      title:          title.trim()          || null,
      dept:           dept,
      yearsAtCape:    yearsAtCape.trim()    || null,
      languages:      languages.trim()      || null,
      preferredName:  preferredName.trim()  || null,
      bio:            bio.trim()            || null,
      certifications: certifications.trim() || null,
      region:         region                  || null,
      tier:           tier                     || null,
      expertise,
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 600)
  }

  const inp = {
    width:'100%', fontSize:13, padding:'7px 10px',
    border:'1px solid var(--border)', borderRadius:3,
    fontFamily:'var(--font)', background:'var(--surface)',
    color:'var(--ink-900)', outline:'none',
  }
  const lbl = {
    fontSize:10, fontWeight:700, letterSpacing:'0.10em',
    textTransform:'uppercase', color:'var(--ink-400)',
    display:'block', marginBottom:5,
  }

  return (
    <FocusModal onClose={onClose} width="700px" maxWidth="740px">
      {/* Header */}
      <div style={{ display:'flex', gap:14, alignItems:'center',
        padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <Av initials={person.initials}/>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)',
            letterSpacing:'-0.01em', marginBottom:2 }}>
            {person.firstName} {person.lastName}
          </p>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>{person.email}</p>
        </div>
        <button onClick={onClose}
          style={{ background:'none',border:'none',cursor:'pointer',
            color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'hidden', display:'grid',
        gridTemplateColumns:'minmax(0,1fr) 240px' }}>

        {/* Left — editable */}
        <div style={{ overflowY:'auto', padding:'18px 22px', borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column', gap:16 }}>

          <div>
            <label style={lbl}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="+ Add title" style={inp}/>
          </div>

          <div>
            <label style={lbl}>Department</label>
            <p style={{ fontSize:11, color:'var(--ink-300)', marginBottom:8 }}>
              Select all that apply — e.g. Hospitality and Production
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
              {DEPARTMENTS.map(d => {
                const active = dept.includes(d)
                return (
                  <button key={d} type="button"
                    onClick={() => setDept(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                    style={{ fontSize:12, fontWeight:500, padding:'5px 11px', borderRadius:3,
                      cursor:'pointer', fontFamily:'var(--font)',
                      background: active ? 'var(--signal-blue-text)' : 'var(--surface)',
                      color: active ? 'white' : 'var(--ink-600)',
                      border: `1px solid ${active ? 'var(--signal-blue-text)' : 'var(--border)'}` }}>
                    {d}
                  </button>
                )
              })}
              {/* Custom departments not in the preset list */}
              {dept.filter(d => !DEPARTMENTS.includes(d)).map(d => (
                <span key={d} style={{ display:'inline-flex', alignItems:'center', gap:4,
                  fontSize:12, fontWeight:500, padding:'5px 11px', borderRadius:3,
                  background:'var(--signal-blue-text)', color:'white' }}>
                  {d}
                  <button onClick={() => setDept(prev => prev.filter(x => x !== d))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)',
                      fontSize:13, lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
            {addingDept ? (
              <input autoFocus value={newDept} onChange={e => setNewDept(e.target.value)}
                onBlur={finishAddingDept}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addDept() }
                  if (e.key === 'Escape') { setNewDept(''); setAddingDept(false) }
                }}
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

          <div>
            <label style={lbl}>Years at CAPE</label>
            <input value={yearsAtCape} onChange={e => setYears(e.target.value)}
              placeholder="+ Add years at CAPE" style={inp}/>
          </div>

          <div>
            <label style={lbl}>Languages</label>
            <input value={languages} onChange={e => setLanguages(e.target.value)}
              placeholder="+ Add languages" style={inp}/>
          </div>


          <div>
            <label style={lbl}>Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ ...inp, height:36, cursor:'pointer' }}>
              <option value="">+ Add region</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Organizational tier</label>
            <select value={tier} onChange={e => setTier(e.target.value)}
              style={{ ...inp, height:36, cursor:'pointer' }}>
              <option value="">Standard (groups by region)</option>
              <option value="Founder">Founder</option>
              <option value="Leadership">Global Leadership</option>
              <option value="Partner">Partners</option>
            </select>
          </div>

          <div>
            <label style={lbl}>Professional expertise</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
              {expertise.map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4,
                  fontSize:11, fontWeight:500, color:'var(--ink-600)',
                  background:'var(--ground-dim)', border:'1px solid var(--border)',
                  borderRadius:3, padding:'2px 8px' }}>
                  {t}
                  <button onClick={() => removeTag(t)}
                    style={{ background:'none',border:'none',cursor:'pointer',
                      color:'var(--ink-300)',fontSize:12,lineHeight:1,padding:0 }}>×</button>
                </span>
              ))}
              {addingTag ? (
                <input autoFocus value={newTag} onChange={e => setNewTag(e.target.value)}
                  onBlur={finishAddingTag}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    if (e.key === 'Escape') { setNewTag(''); setAddingTag(false) }
                  }}
                  placeholder="Add expertise…"
                  style={{ fontSize:11, height:26, padding:'0 8px',
                    border:'1px solid var(--border-med)', borderRadius:3,
                    outline:'none', fontFamily:'var(--font)', minWidth:130,
                    background:'var(--surface)', color:'var(--ink-800)' }}/>
              ) : (
                <button onClick={() => setAddingTag(true)}
                  style={{ fontSize:11, color:'var(--ink-300)', background:'none',
                    border:'none', cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                  + Add expertise
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={lbl}>Certifications &amp; training</label>
            <textarea value={certifications} onChange={e => setCerts(e.target.value)}
              rows={2} placeholder="+ Add certifications or qualifications"
              style={{ ...inp, resize:'none', lineHeight:1.6 }}/>
          </div>

        </div>

        {/* Right — contact read-only */}
        <div style={{ overflowY:'auto', padding:'18px 18px' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em',
            textTransform:'uppercase', color:'var(--ink-300)',
            marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            Contact
          </p>
          {[
            ['Email',    person.email],
            ['Phone',    person.phone],
            ['Region',   region],
            ['City',     person.location],
          ].map(([l, v]) => (
            <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em',
                textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{l}</p>
              <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)',
                wordBreak:'break-all' }}>{v || '—'}</p>
            </div>
          ))}

          {/* Current projects — live, derived from real ALL_PROJECTS
              data by matching initials, not the old fabricated
              currentProjects array. */}
          <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em',
              textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>Current projects</p>
            {(() => {
              const projects = getCurrentProjects(person.initials)
              if (projects.length === 0) {
                return <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>Not currently staffed on a project</p>
              }
              return projects.map(proj => (
                <p key={proj.id} style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)', padding:'3px 0' }}>
                  · {proj.name}
                </p>
              ))
            })()}
          </div>

          {s(person.locallyYoursEmail) && (
            <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em',
                textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>Locally Yours</p>
              <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)',
                wordBreak:'break-all' }}>{person.locallyYoursEmail}</p>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'flex-end', gap:8,
        flexShrink:0, background:'var(--ground-dim)' }}>
        <button onClick={onClose}
          style={{ padding:'8px 18px', fontSize:12, fontWeight:500,
            background:'transparent', border:'1px solid var(--border)',
            borderRadius:4, cursor:'pointer', color:'var(--ink-500)',
            fontFamily:'var(--font)' }}>
          Cancel
        </button>
        <button onClick={handleSave}
          style={{ padding:'8px 24px', fontSize:12, fontWeight:700,
            background: saved ? 'var(--signal-green-dot)' : 'var(--ink-900)',
            color:'white', border:'none', borderRadius:4, cursor:'pointer',
            fontFamily:'var(--font)', transition:'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save profile'}
        </button>
      </div>
    </FocusModal>
  )
}

/* ─── Directory row ──────────────────────────────────────── */
function DirectoryRow({ person, projectCount, onClick }) {
  const [hov, setHov] = useState(false)
  const tags = Array.isArray(person.expertise) ? person.expertise : []

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:14, padding:'13px 0',
        borderBottom:'1px solid var(--border)', cursor:'pointer',
        background: hov ? 'rgba(0,0,0,0.012)' : 'transparent',
        transition:'background 0.1s',
      }}>

      <Av initials={person.initials}/>

      {/* Name + title */}
      <div style={{ width:200, flexShrink:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)',
          letterSpacing:'-0.01em', marginBottom:2 }}>
          {person.firstName} {person.lastName}
        </p>
        {s(person.title)
          ? <p style={{ fontSize:12, color:'var(--ink-500)' }}>{person.title}</p>
          : <p style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>+ Add title</p>
        }
      </div>

      {/* Department — can show more than one */}
      <div style={{ width:120, flexShrink:0, display:'flex', flexWrap:'wrap', gap:4 }}>
        {Array.isArray(person.dept) && person.dept.length > 0
          ? person.dept.map(d => (
              <span key={d} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                textTransform:'uppercase', color:'var(--signal-blue-text)',
                background:'var(--signal-blue-bg)', padding:'2px 7px', borderRadius:2 }}>
                {d}
              </span>
            ))
          : <span style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>
              + Add dept
            </span>
        }
      </div>

      {/* Location */}
      <div style={{ width:140, flexShrink:0 }}>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{s(person.location) || '—'}</p>
      </div>

      {/* Expertise — show everything, wrapping to use all available width */}
      <div style={{ flex:1, display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
        {tags.length > 0
          ? tags.map(t => <Tag key={t} label={t}/>)
          : <span style={{ fontSize:12, color:'var(--ink-200)', fontStyle:'italic' }}>
              + Add expertise
            </span>
        }
      </div>

      {/* Project count */}
      <div style={{ width:70, flexShrink:0, textAlign:'right' }}>
        <p style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.02em', lineHeight:1 }}>
          {projectCount}
        </p>
        <p style={{ fontSize:10, color:'var(--ink-300)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          {projectCount === 1 ? 'project' : 'projects'}
        </p>
      </div>

      {/* Chevron */}
      <div style={{ opacity: hov ? 1 : 0.2, transition:'opacity 0.1s', flexShrink:0 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Team Directory page
   ─────────────────────────────────────────────────────── */
export default function TeamLibrary() {
  const { state, dispatch } = useStore()
  const profiles = useMemo(() =>
    Object.fromEntries(
      CAPE_DIRECTORY.map(p => {
        const override = state.directoryOverrides[p.id] || {}
        const merged = { ...p, ...override }
        return [p.id, {
          ...merged,
          expertise: Array.isArray(merged.expertise) ? merged.expertise : [],
          dept: Array.isArray(merged.dept) ? merged.dept : [],
          region: merged.region || getRegion(merged.location),
        }]
      })
    )
  , [state.directoryOverrides])
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())
  const toggleGroup = label => setCollapsedGroups(prev => {
    const next = new Set(prev)
    next.has(label) ? next.delete(label) : next.add(label)
    return next
  })

  const people = useMemo(() =>
    Object.values(profiles).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    )
  , [profiles])

  const filtered = useMemo(() => {
    if (!query.trim()) return people
    const q = query.toLowerCase()
    return people.filter(p => {
      const name = `${s(p.firstName)} ${s(p.lastName)}`.toLowerCase()
      return (
        name.includes(q) ||
        s(p.title).toLowerCase().includes(q) ||
        (Array.isArray(p.dept) && p.dept.some(d => s(d).toLowerCase().includes(q))) ||
        s(p.location).toLowerCase().includes(q) ||
        s(p.email).toLowerCase().includes(q) ||
        (Array.isArray(p.expertise) && p.expertise.some(e => s(e).toLowerCase().includes(q)))
      )
    })
  }, [people, query])

  // Group: Founders first, then Global Leadership, then Partners,
  // then everyone else bucketed by region (falling back to a live
  // lookup from location when no region has been set on the profile yet).
  const groups = useMemo(() => {
    const founders   = filtered.filter(p => p.tier === 'Founder')
    const leadership = filtered.filter(p => p.tier === 'Leadership')
    const partners    = filtered.filter(p => p.tier === 'Partner')
    const rest        = filtered.filter(p => p.tier !== 'Founder' && p.tier !== 'Leadership' && p.tier !== 'Partner')

    const byRegion = {}
    rest.forEach(p => {
      const region = s(p.region) || getRegion(p.location) || 'Other'
      if (!byRegion[region]) byRegion[region] = []
      byRegion[region].push(p)
    })

    const result = []
    if (founders.length)   result.push({ label:'Founders',          people:founders })
    if (leadership.length) result.push({ label:'Global Leadership', people:leadership })
    if (partners.length)   result.push({ label:'Partners',          people:partners })
    REGIONS.filter(r => r !== 'All').forEach(region => {
      if (byRegion[region]?.length) result.push({ label:region, people:byRegion[region] })
    })
    // Any region not in the standard REGIONS list (e.g. "Other")
    Object.keys(byRegion).forEach(region => {
      if (!REGIONS.includes(region) && byRegion[region]?.length) {
        result.push({ label:region, people:byRegion[region] })
      }
    })
    return result
  }, [filtered])


  const saveProfile = updated => {
    const { id, firstName, lastName, initials, location, phone, email, locallyYoursEmail, currentProjects, pastProjects, photo, ...editable } = updated
    dispatch(A.updateDirectoryProfile(id, editable))
  }

  const incomplete = people.filter(p => !s(p.title)).length

  return (
    <LibraryPage
      eyebrow="Field · Directory"
      title="Team"
      subtitle={`${people.length} people`}>

      {/* Search bar only — no region/dept/sort filters */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <div style={{ width:280, display:'flex', alignItems:'center', gap:8,
          padding:'0 12px', background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:4, height:34 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
            <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search team…"
            style={{ flex:1, border:'none', outline:'none', fontSize:13,
              color:'var(--ink-800)', background:'transparent', fontFamily:'var(--font)' }}/>
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background:'none',border:'none',cursor:'pointer',
                color:'var(--ink-300)',fontSize:14,lineHeight:1 }}>×</button>
          )}
        </div>
      </div>

      {/* Count + notice */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:18 }}>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>
          {filtered.length === people.length
            ? `${people.length} team members`
            : `${filtered.length} of ${people.length} team members`}
        </p>
        {incomplete > 0 && (
          <p style={{ fontSize:11, color:'var(--signal-amber-text)' }}>
            {incomplete} profile{incomplete !== 1 ? 's' : ''} missing job title
          </p>
        )}
      </div>

      {/* Column headers */}
      <div style={{ display:'flex', gap:14, alignItems:'center',
        paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
        <div style={{ width:36, flexShrink:0 }}/>
        {[
          ['Name',       200],
          ['Department', 120],
          ['Location',   140],
        ].map(([label, w]) => (
          <p key={label} style={{ width:w, flexShrink:0, fontSize:10, fontWeight:700,
            letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>
            {label}
          </p>
        ))}
        <p style={{ flex:1, fontSize:10, fontWeight:700,
          letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>
          Expertise
        </p>
        <p style={{ width:70, flexShrink:0, fontSize:10, fontWeight:700, textAlign:'right',
          letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>
          Projects
        </p>
        <div style={{ width:12, flexShrink:0 }}/>
      </div>

      {/* Grouped rows — Founders, Global Leadership, then by region — each foldable */}
      {groups.length > 0
        ? groups.map(group => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label}>
                <button onClick={() => toggleGroup(group.label)}
                  style={{ display:'flex', alignItems:'center', gap:6, width:'100%', textAlign:'left',
                    background:'none', border:'none', cursor:'pointer', padding:0,
                    marginTop:22, marginBottom: isCollapsed ? 8 : 2 }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition:'transform 0.15s', flexShrink:0 }}>
                    <path d="M2 3l2.5 2.5L7 3" stroke="var(--ink-400)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                    color:'var(--ink-300)', margin:0 }}>
                    {group.label}
                  </p>
                  <p style={{ fontSize:10.5, color:'var(--ink-200)', margin:0 }}>
                    {isCollapsed ? `(${group.people.length})` : ''}
                  </p>
                </button>
                {!isCollapsed && group.people.map(p => (
                  <DirectoryRow
                    key={p.id}
                    person={profiles[p.id] || p}
                    projectCount={countProjects(p.initials)}
                    onClick={() => setSelected(profiles[p.id] || p)}/>
                ))}
              </div>
            )
          })
        : <EmptyState query={query} onClear={() => setQuery('')}/>
      }

      {filtered.length === 0 && !query && (
        <div style={{ padding:'60px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontStyle:'italic',
            color:'var(--ink-200)', marginBottom:8 }}>No team members yet.</p>
          <p style={{ fontSize:13, color:'var(--ink-300)' }}>
            Add employees to the directory to get started.
          </p>
        </div>
      )}

      <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:18 }}>
        Click any row to edit profile. Fields are saved only when you click Save profile.
      </p>

      <AnimatePresence>
        {selected && (
          <ProfileModal
            key={selected.id}
            person={selected}
            onClose={() => setSelected(null)}
            onSave={updated => { saveProfile(updated); setSelected(null) }}/>
        )}
      </AnimatePresence>
    </LibraryPage>
  )
}
