import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VENDORS, ALL_COST_TIERS } from './vendorData.js'
import { useLocalState } from '../useLocalState.js'
import { ALL_PROJECTS } from './companyData.js'
import FocusModal from '../components/FocusModal.jsx'
import LibraryPage from './LibraryPage.jsx'
import { saveToShortlist, removeFromShortlist, isShortlisted } from '../workspace/pages/Shortlist.jsx'

/* ─── Category + subcategory map ─────────────────────────── */
const CATEGORIES = [
  'Cleaning', 'Content Capture', 'Fabrication', 'Food and Beverage',
  'Furniture and Decor', 'Hospitality', 'Lighting and AV', 'Logistics',
  'Merchandise', 'Photographer', 'Printer', 'Staffing', 'Transportation',
  'Video Editor', 'Videographer', 'Other',
]

const SUBCATEGORIES = {
  'Content Capture':    ['Photo + Video', 'Photography only', 'Video only'],
  'Fabrication':        ['Project fabrication', 'Airstream housing', 'Signage / Neon', 'Custom builds'],
  'Furniture and Decor':['Event furniture', 'Florals', 'Plant / Florals', 'Arcade game rental'],
  'Lighting and AV':    ['AV Tech – Screens + programming', 'DJ / Speakers', 'Light design / G&E / AV', 'Light tech on site / Rental'],
  'Logistics':          ['Moving', 'Local production company', 'Freight'],
  'Merchandise':        ['Bandanas', 'Wristbands', 'Uniforms / stickers', 'Custom apparel'],
  'Staffing':           ['Bar staffing', 'Brand ambassadors', 'Event staff', 'Local public relations'],
  'Transportation':     ['Shuttle', 'Black car', 'Cargo / freight'],
  'Food and Beverage':  ['Full catering', 'Beverage only', 'Bar only'],
}

const RATING_OPTS = [
  { value:'', label:'No rating' },
  { value:'5 stars: Exceptional. We love them!',          label:'★★★★★  5 – Exceptional. We love them!' },
  { value:"4 stars: They're good",                        label:"★★★★☆  4 – They're good" },
  { value:'3 stars: Neutral',                             label:'★★★☆☆  3 – Neutral' },
  { value:"2 stars: They aren't great",                   label:"★★☆☆☆  2 – They aren't great" },
  { value:'1 star: Do not work with this vendor again',   label:'★☆☆☆☆  1 – Do not work with them again' },
]

const PROJECT_STATUS = ['Current', 'Upcoming', 'Past']

const uid = () => Math.random().toString(36).slice(2, 9)

/* ─── Helpers ────────────────────────────────────────────── */
const safe = v => (v && typeof v === 'string' && v.trim()) ? v.trim() : ''

function vendorLocation(v) {
  const parts = [v.city, v.state, safe(v.country) !== 'USA' ? v.country : ''].filter(safe)
  return parts.join(', ') || '—'
}

function starGlyphs(r) {
  if (!r) return ''
  if (r.startsWith('5')) return '★★★★★'
  if (r.startsWith('4')) return '★★★★☆'
  if (r.startsWith('3')) return '★★★☆☆'
  if (r.startsWith('2')) return '★★☆☆☆'
  if (r.startsWith('1')) return '★☆☆☆☆'
  return ''
}

function costColor(t) {
  if (t === '$$$' || t === '$$$$') return 'var(--signal-amber-text)'
  if (t === '$$') return 'var(--ink-600)'
  if (t === '$') return 'var(--signal-green-text)'
  return 'var(--ink-300)'
}

function TypeBadge({ type }) {
  const isFL = type === 'freelancer'
  return (
    <span style={{
      fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
      padding:'2px 8px', borderRadius:2,
      color:      isFL ? 'var(--signal-blue-text)' : 'var(--ink-400)',
      background: isFL ? 'var(--signal-blue-bg)'  : 'var(--ground-dim)',
    }}>{isFL ? 'Freelancer' : 'Company'}</span>
  )
}

function VendorMark({ name, size = 32 }) {
  const palette = ['#1A1916','#2A2420','#1A2430','#20281A','#28201A']
  const n = safe(name) || '?'
  const bg = palette[(n.charCodeAt(0) + n.charCodeAt(n.length - 1)) % palette.length]
  return (
    <div style={{
      width:size, height:size, borderRadius:5, background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size * 0.34), fontWeight:700,
      color:'rgba(255,255,255,0.52)', fontFamily:'var(--font)', letterSpacing:'0.04em',
    }}>
      {n.replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase() || '??'}
    </div>
  )
}

/* ─── Heart button ───────────────────────────────────────── */
function HeartBtn({ item }) {
  const [saved, setSaved] = React.useState(() => isShortlisted('vendors', item.id))
  const toggle = e => {
    e.stopPropagation()
    if (saved) { removeFromShortlist('vendors', item.id); setSaved(false) }
    else        { saveToShortlist('vendors', item);        setSaved(true)  }
  }
  return (
    <button onClick={toggle} title={saved ? 'Remove from Shortlist' : 'Save to Shortlist'}
      style={{ background:'none', border:'none', cursor:'pointer', padding:4, flexShrink:0,
        color: saved ? '#C9914A' : 'var(--ink-300)', transition:'color 0.15s', lineHeight:1 }}>
      <svg width="16" height="16" viewBox="0 0 16 16"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 14S1 9.5 1 5.5a3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1 7 0C15 9.5 8 14 8 14z"/>
      </svg>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────
   VENDOR FORM — Add or Edit
   ─────────────────────────────────────────────────────── */
function VendorForm({ initial, onSave, onClose, title }) {
  const blank = {
    type:'company', category:'', subcategory:'', name:'', contactName:'',
    website:'', phone:'', email:'', city:'', state:'', country:'USA',
    costTier:'', rating:'', producerNotes:'', projects:[],
  }
  const [form, setForm]       = useState({ ...blank, ...initial })
  const [projects, setProjects] = useState(
    Array.isArray(initial?.projects) ? initial.projects.map(p => ({...p})) : []
  )
  // Project picker state
  const [projectSearch, setProjectSearch]   = useState('')
  const [showProjPicker, setShowProjPicker] = useState(false)

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  // When category changes, reset subcategory if it no longer applies
  const setCategory = e => {
    const cat = e.target.value
    setForm(p => ({...p, category:cat, subcategory:''}))
  }

  const subcatOptions = SUBCATEGORIES[form.category] || []

  // Projects from platform — searchable
  const availableProjects = ALL_PROJECTS.filter(p => {
    const alreadyAdded = projects.some(pr => pr.projectId === p.id)
    if (alreadyAdded) return false
    if (!projectSearch.trim()) return true
    return p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.client.toLowerCase().includes(projectSearch.toLowerCase())
  })

  const addProject = (proj) => {
    setProjects(p => [...p, {
      id:uid(), projectId:proj.id, projectName:proj.name,
      client:proj.client, status:'Past', notes:'',
    }])
    setProjectSearch('')
    setShowProjPicker(false)
  }
  const updateProject = (id, k, v) =>
    setProjects(p => p.map(pr => pr.id===id ? {...pr,[k]:v} : pr))
  const removeProject = id => setProjects(p => p.filter(pr => pr.id !== id))

  const handleSave = () => {
    if (!safe(form.name)) return
    onSave({ ...form, projects })
  }

  const canSave = safe(form.type) && safe(form.name)

  const inp = {
    width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)',
    borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)',
    color:'var(--ink-900)', outline:'none',
  }
  const lbl = {
    fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
    color:'var(--ink-400)', display:'block', marginBottom:5,
  }
  const sel = { ...inp, height:36, cursor:'pointer' }
  const row2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }

  const nameLabel = form.type === 'freelancer' ? 'Freelancer name *' : 'Company name *'

  return (
    <FocusModal onClose={onClose} width="680px" maxWidth="720px">
      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>
          {title}
        </h3>
        <button onClick={onClose}
          style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 24px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Type toggle */}
        <div>
          <label style={lbl}>Type *</label>
          <div style={{ display:'flex', gap:8 }}>
            {['company','freelancer'].map(t => (
              <button key={t} onClick={() => setForm(p => ({...p, type:t}))}
                style={{ padding:'7px 20px', fontSize:12, fontWeight:600,
                  borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.1s',
                  background: form.type===t ? 'var(--ink-900)' : 'var(--surface)',
                  color:      form.type===t ? 'white'         : 'var(--ink-500)',
                  border:`1px solid ${form.type===t ? 'var(--ink-900)' : 'var(--border)'}`,
                  textTransform:'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Subcategory */}
        <div style={row2}>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={setCategory} style={sel}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Subcategory</label>
            {subcatOptions.length > 0 ? (
              <select value={form.subcategory} onChange={set('subcategory')} style={sel}>
                <option value="">Select subcategory</option>
                {subcatOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={form.subcategory} onChange={set('subcategory')}
                placeholder="Optional" style={inp}/>
            )}
          </div>
        </div>

        {/* Name + Contact */}
        <div style={row2}>
          <div>
            <label style={lbl}>{nameLabel}</label>
            <input value={form.name} onChange={set('name')} placeholder="Name" style={inp} autoFocus/>
          </div>
          <div>
            <label style={lbl}>Contact name</label>
            <input value={form.contactName} onChange={set('contactName')} placeholder="Primary contact" style={inp}/>
          </div>
        </div>

        {/* Email + Phone */}
        <div style={row2}>
          <div>
            <label style={lbl}>Email</label>
            <input value={form.email} onChange={set('email')} placeholder="email@example.com" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Phone</label>
            <input value={form.phone} onChange={set('phone')} placeholder="Phone number" style={inp}/>
          </div>
        </div>

        {/* Website */}
        <div>
          <label style={lbl}>Website</label>
          <input value={form.website} onChange={set('website')} placeholder="https://…" style={inp}/>
        </div>

        {/* City / State / Country */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          <div>
            <label style={lbl}>City</label>
            <input value={form.city} onChange={set('city')} placeholder="City" style={inp}/>
          </div>
          <div>
            <label style={lbl}>State / Province</label>
            <input value={form.state} onChange={set('state')} placeholder="State" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Country</label>
            <input value={form.country} onChange={set('country')} placeholder="Country" style={inp}/>
          </div>
        </div>

        {/* Cost Tier + Rating */}
        <div style={row2}>
          <div>
            <label style={lbl}>Cost tier</label>
            <select value={form.costTier} onChange={set('costTier')} style={sel}>
              <option value="">Select cost tier</option>
              {ALL_COST_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Rating</label>
            <select value={form.rating} onChange={set('rating')} style={sel}>
              {RATING_OPTS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Producer notes */}
        <div>
          <label style={lbl}>Producer notes</label>
          <textarea value={form.producerNotes} onChange={set('producerNotes')}
            rows={3} placeholder="Internal notes for the CAPE team…"
            style={{...inp, resize:'none', lineHeight:1.65}}/>
        </div>

        {/* Projects — searchable picker */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            <label style={{...lbl, margin:0}}>Projects</label>
            <button onClick={() => setShowProjPicker(s => !s)}
              style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)',
                background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
              + Add project
            </button>
          </div>

          {/* Project search picker */}
          {showProjPicker && (
            <div style={{ marginBottom:10, border:'1px solid var(--border)', borderRadius:4,
              background:'var(--surface)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 12px',
                borderBottom:'1px solid var(--border)', height:36 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="4.5" cy="4.5" r="3.3" stroke="var(--ink-300)" strokeWidth="1"/>
                  <path d="M7.5 7.5l2 2" stroke="var(--ink-300)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <input autoFocus value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Search projects by name or client…"
                  style={{ flex:1, border:'none', outline:'none', fontSize:12,
                    fontFamily:'var(--font)', background:'transparent', color:'var(--ink-800)' }}/>
                <button onClick={() => { setShowProjPicker(false); setProjectSearch('') }}
                  style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:14 }}>×</button>
              </div>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {availableProjects.length === 0 ? (
                  <p style={{ fontSize:12, color:'var(--ink-300)', padding:'12px 14px', fontStyle:'italic' }}>
                    {projectSearch ? 'No matches' : 'All projects already added'}
                  </p>
                ) : availableProjects.map(proj => (
                  <button key={proj.id} onClick={() => addProject(proj)}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'9px 14px', background:'transparent', border:'none',
                      borderBottom:'1px solid var(--border)', cursor:'pointer',
                      fontFamily:'var(--font)', textAlign:'left' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--ground-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div>
                      <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)', marginBottom:1 }}>{proj.name}</p>
                      <p style={{ fontSize:11, color:'var(--ink-400)' }}>{proj.client}</p>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--signal-green-text)',
                      background:'var(--signal-green-bg)', padding:'2px 7px', borderRadius:2,
                      letterSpacing:'0.07em', textTransform:'uppercase', flexShrink:0 }}>Add</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Added projects list */}
          {projects.length === 0 && !showProjPicker && (
            <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
              No projects attached. Click + Add project to link one.
            </p>
          )}
          {projects.map(pr => (
            <div key={pr.id} style={{ padding:'11px 14px', background:'var(--ground-dim)',
              border:'1px solid var(--border)', borderRadius:4, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{pr.projectName}</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)' }}>{pr.client}</p>
                </div>
                <button onClick={() => removeProject(pr.id)}
                  style={{ fontSize:11, color:'var(--signal-red-text)', background:'none',
                    border:'none', cursor:'pointer', fontFamily:'var(--font)', flexShrink:0, marginLeft:8 }}>
                  Remove
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:10, alignItems:'start' }}>
                <div>
                  <label style={{...lbl, fontSize:10}}>Status</label>
                  <select value={pr.status} onChange={e => updateProject(pr.id,'status',e.target.value)}
                    style={{...inp, fontSize:12, padding:'5px 8px', height:30, cursor:'pointer'}}>
                    {PROJECT_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{...lbl, fontSize:10}}>Notes</label>
                  <input value={pr.notes} onChange={e => updateProject(pr.id,'notes',e.target.value)}
                    placeholder="Optional notes" style={{...inp, fontSize:12, padding:'5px 8px'}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 24px', borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0, background:'var(--ground-dim)' }}>
        <button onClick={onClose}
          style={{ padding:'8px 18px', fontSize:12, fontWeight:500, background:'transparent',
            border:'1px solid var(--border)', borderRadius:4, cursor:'pointer',
            color:'var(--ink-500)', fontFamily:'var(--font)' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={!canSave}
          style={{ padding:'8px 24px', fontSize:12, fontWeight:700, border:'none', borderRadius:4,
            cursor: canSave ? 'pointer' : 'default', fontFamily:'var(--font)', transition:'background 0.15s',
            background: canSave ? 'var(--ink-900)' : 'var(--border)',
            color:      canSave ? 'white'          : 'var(--ink-400)' }}>
          Save vendor
        </button>
      </div>
    </FocusModal>
  )
}

/* ─────────────────────────────────────────────────────────
   VENDOR PROFILE MODAL
   ─────────────────────────────────────────────────────── */
function VendorProfile({ v, onClose, onEdit }) {
  const loc   = vendorLocation(v)
  const stars = starGlyphs(v.rating)
  const url   = safe(v.website) && !/^https?:\/\//.test(v.website)
    ? `https://${v.website}` : safe(v.website)
  const projects = Array.isArray(v.projects) ? v.projects : []

  const statusColor = s => {
    if (s==='Current')  return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
    if (s==='Upcoming') return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
    return                      { color:'var(--ink-400)',           bg:'var(--ground-dim)'      }
  }

  return (
    <FocusModal onClose={onClose} width="720px" maxWidth="760px">
      <div style={{ padding:'22px 26px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <VendorMark name={v.name} size={44}/>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.02em',
                color:'var(--ink-900)', marginBottom:5 }}>{v.name}</h2>
              <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                <TypeBadge type={v.type}/>
                {safe(v.category) && (
                  <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em',
                    textTransform:'uppercase', color:'var(--ink-500)' }}>{v.category}</span>
                )}
                {safe(v.subcategory) && (
                  <span style={{ fontSize:11, color:'var(--ink-400)' }}>· {v.subcategory}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <HeartBtn item={v}/>
            <button onClick={onEdit}
              style={{ padding:'7px 16px', fontSize:12, fontWeight:600,
                background:'var(--surface)', border:'1px solid var(--border-med)',
                borderRadius:4, cursor:'pointer', color:'var(--ink-600)', fontFamily:'var(--font)' }}>
              Edit vendor
            </button>
            <button onClick={onClose}
              style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'minmax(0,1fr) 230px' }}>
        {/* Left */}
        <div style={{ overflowY:'auto', padding:'20px 24px', borderRight:'1px solid var(--border)' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            Contact information
          </p>
          {[
            ['Contact',  safe(v.contactName)],
            ['Email',    safe(v.email)],
            ['Phone',    safe(v.phone)],
            ['Location', loc !== '—' ? loc : ''],
            ['Website',  safe(v.website)],
          ].filter(([,val]) => val).map(([l, val]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:11, color:'var(--ink-400)', flexShrink:0, marginRight:12 }}>{l}</p>
              {l==='Website' ? (
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ fontSize:12, fontWeight:500, color:'var(--signal-blue-text)',
                    textDecoration:'none', textAlign:'right', wordBreak:'break-all', maxWidth:280 }}>
                  {v.website}
                </a>
              ) : (
                <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)',
                  textAlign:'right', wordBreak:'break-all', maxWidth:280 }}>{val}</p>
              )}
            </div>
          ))}

          {safe(v.producerNotes) && (
            <div style={{ marginTop:20 }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                Producer notes
              </p>
              <p style={{ fontSize:14, color:'var(--ink-700)', lineHeight:1.75 }}>{v.producerNotes}</p>
            </div>
          )}

          <div style={{ marginTop:20 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
              Projects
            </p>
            {projects.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--ink-200)', fontStyle:'italic' }}>
                No projects attached. Click Edit vendor to add.
              </p>
            ) : projects.map(pr => {
              const sc = statusColor(pr.status)
              return (
                <div key={pr.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:3 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>
                      {safe(pr.projectName) || '—'}
                    </p>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em',
                      textTransform:'uppercase', padding:'2px 8px', borderRadius:2,
                      color:sc.color, background:sc.bg, flexShrink:0, marginLeft:8 }}>
                      {pr.status}
                    </span>
                  </div>
                  {safe(pr.client) && <p style={{ fontSize:12, color:'var(--ink-500)', marginBottom:2 }}>{pr.client}</p>}
                  {safe(pr.notes) && <p style={{ fontSize:12, color:'var(--ink-400)', fontStyle:'italic' }}>{pr.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right */}
        <div style={{ overflowY:'auto', padding:'20px 18px' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            Overview
          </p>
          {[
            ['Category',   safe(v.category)],
            ['Subcategory',safe(v.subcategory)],
            ['Cost tier',  safe(v.costTier)],
            ['Location',   loc !== '—' ? loc : ''],
          ].filter(([,val])=>val).map(([l,val]) => (
            <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em',
                textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{l}</p>
              <p style={{ fontSize:13, fontWeight:500,
                color:l==='Cost tier'?costColor(val):'var(--ink-800)' }}>{val}</p>
            </div>
          ))}
          {stars && (
            <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em',
                textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>Rating</p>
              <p style={{ fontSize:16, color:'var(--signal-amber-text)', letterSpacing:'-0.02em' }}>{stars}</p>
              <p style={{ fontSize:11, color:'var(--ink-500)', marginTop:2, lineHeight:1.4 }}>{v.rating}</p>
            </div>
          )}
        </div>
      </div>
    </FocusModal>
  )
}

/* ─── Vendor row ─────────────────────────────────────────── */
function VendorRow({ v, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'grid',
        gridTemplateColumns:'minmax(180px,1fr) 140px 140px 60px 100px 100px 28px',
        gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)',
        cursor:'pointer', alignItems:'center',
        background:hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <VendorMark name={v.name} size={30}/>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em',
            marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{safe(v.contactName) || '—'}</p>
        </div>
      </div>
      <p style={{ fontSize:12, color:'var(--ink-600)' }}>{safe(v.category) || '—'}</p>
      <p style={{ fontSize:12, color:'var(--ink-500)', overflow:'hidden',
        textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vendorLocation(v)}</p>
      <p style={{ fontSize:12, fontWeight:600, color:costColor(v.costTier) }}>
        {safe(v.costTier) || <span style={{ color:'var(--ink-200)' }}>—</span>}
      </p>
      <p style={{ fontSize:11, color:'var(--signal-amber-text)' }}>
        {starGlyphs(v.rating) || <span style={{ color:'var(--ink-200)' }}>—</span>}
      </p>
      <TypeBadge type={v.type}/>
      <HeartBtn item={v}/>
      <div style={{ opacity:hov?1:0.2, transition:'opacity 0.1s' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
   ─────────────────────────────────────────────────────── */
export default function VendorLibrary() {
  const [vendors,    setVendors]    = useLocalState('company_vendors_v1',
    () => VENDORS.map(v => ({...v, projects:Array.isArray(v.projects)?v.projects:[]}))
  )
  const [tab,        setTab]        = useState('all')
  const [query,      setQuery]      = useState('')
  const [cat,        setCat]        = useState('All')
  const [costFilter, setCostFilter] = useState('All')
  const [viewing,    setViewing]    = useState(null)
  const [editing,    setEditing]    = useState(null)
  const [showForm,   setShowForm]   = useState(false)

  const tabList = useMemo(() => {
    if (tab === 'company')    return vendors.filter(v => v.type === 'company')
    if (tab === 'freelancer') return vendors.filter(v => v.type === 'freelancer')
    return vendors
  }, [vendors, tab])

  const catOpts = useMemo(() => {
    const cats = [...new Set(tabList.map(v => v.category).filter(safe))].sort()
    return ['All', ...cats]
  }, [tabList])

  const filtered = useMemo(() => {
    let list = [...tabList]
    if (cat !== 'All')        list = list.filter(v => v.category === cat)
    if (costFilter !== 'All') list = list.filter(v => v.costTier === costFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(v =>
        safe(v.name).toLowerCase().includes(q) ||
        safe(v.contactName).toLowerCase().includes(q) ||
        safe(v.category).toLowerCase().includes(q) ||
        safe(v.city).toLowerCase().includes(q) ||
        safe(v.state).toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [tabList, cat, costFilter, query])

  const saveVendor = updated => {
    if (updated.id && vendors.some(v => v.id === updated.id)) {
      setVendors(prev => prev.map(v => v.id === updated.id ? updated : v))
      setViewing(updated)
    } else {
      const newV = { ...updated, id: `vn_${uid()}` }
      setVendors(prev => [...prev, newV])
    }
    setShowForm(false)
    setEditing(null)
  }

  const openAdd  = ()  => { setEditing(null); setShowForm(true) }
  const openEdit = v   => { setEditing(v);    setShowForm(true); setViewing(null) }

  const companies   = vendors.filter(v => v.type === 'company')
  const freelancers = vendors.filter(v => v.type === 'freelancer')

  const TABS = [
    { id:'all',        label:'All',         count: vendors.length   },
    { id:'company',    label:'Companies',   count: companies.length  },
    { id:'freelancer', label:'Freelancers', count: freelancers.length },
  ]

  const selStyle = {
    fontSize:12, height:34, padding:'0 10px', border:'1px solid var(--border)',
    borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)',
    color:'var(--ink-600)', outline:'none', cursor:'pointer',
  }

  const filterActive = cat !== 'All' || costFilter !== 'All' || query

  return (
    <LibraryPage
      eyebrow="Field · Resources"
      title="Vendors"
      subtitle={`${companies.length} companies · ${freelancers.length} freelancers · CAPE vendor network`}>

      {/* ── Top row: tabs + Add button ── */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-end', marginBottom:0 }}>

        {/* Tabs — Hospitality style: underline on active, sits on the border */}
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--ink-900)' }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id}
                onClick={() => { setTab(t.id); setCat('All') }}
                style={{
                  padding:'10px 0', marginRight:28,
                  fontSize:14, fontWeight: active ? 600 : 400,
                  fontFamily:'var(--font)', background:'none', border:'none', cursor:'pointer',
                  color: active ? 'var(--ink-900)' : 'var(--ink-400)',
                  borderBottom: active ? '2px solid var(--ink-900)' : '2px solid transparent',
                  marginBottom: -1.5, transition:'color 0.1s',
                  display:'flex', alignItems:'baseline', gap:6,
                }}>
                {t.label}
                <span style={{ fontSize:11, fontWeight:400,
                  color:active?'var(--ink-500)':'var(--ink-300)' }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={openAdd}
          style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.07em',
            textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none',
            borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', marginBottom:2 }}>
          + Add vendor
        </button>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }}
          exit={{ opacity:0 }} transition={{ duration:0.14 }}>

          {/* Filter bar */}
          <div style={{ display:'flex', gap:8, marginTop:18, marginBottom:14,
            flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ minWidth:220, flex:'0 1 260px', display:'flex', alignItems:'center',
              gap:8, padding:'0 12px', background:'var(--surface)',
              border:'1px solid var(--border)', borderRadius:4, height:34 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
                <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search vendors…"
                style={{ flex:1, border:'none', outline:'none', fontSize:13,
                  color:'var(--ink-800)', background:'transparent', fontFamily:'var(--font)' }}/>
              {query && <button onClick={() => setQuery('')}
                style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:14 }}>×</button>}
            </div>

            <select value={cat} onChange={e => setCat(e.target.value)} style={selStyle}>
              {catOpts.map(c => <option key={c}>{c}</option>)}
            </select>

            <select value={costFilter} onChange={e => setCostFilter(e.target.value)} style={selStyle}>
              <option value="All">All cost tiers</option>
              {ALL_COST_TIERS.map(t => <option key={t}>{t}</option>)}
            </select>

            {filterActive && (
              <button onClick={() => { setQuery(''); setCat('All'); setCostFilter('All') }}
                style={{ fontSize:12, color:'var(--ink-400)', background:'none',
                  border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>Reset</button>
            )}
          </div>

          {/* Count */}
          <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:14 }}>
            {filtered.length} {filtered.length === 1 ? 'vendor' : 'vendors'}
            {cat !== 'All' && ` · ${cat}`}
            {costFilter !== 'All' && ` · ${costFilter}`}
          </p>

          {/* Column headers */}
          <div style={{ display:'grid',
            gridTemplateColumns:'minmax(180px,1fr) 140px 140px 60px 100px 100px 28px',
            gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
            {['Vendor','Category','Location','Cost','Rating','Type',''].map((h,i) => (
              <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em',
                textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
            ))}
          </div>

          {filtered.length > 0
            ? filtered.map(v => <VendorRow key={v.id} v={v} onClick={() => setViewing(v)}/>)
            : (
              <div style={{ padding:'60px 0', textAlign:'center' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontStyle:'italic',
                  color:'var(--ink-200)', marginBottom:8 }}>
                  {query ? `No results for "${query}"` : 'No vendors in this view.'}
                </p>
                {filterActive && (
                  <button onClick={() => { setQuery(''); setCat('All'); setCostFilter('All') }}
                    style={{ fontSize:12, color:'var(--ink-400)', background:'none',
                      border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>Clear filters</button>
                )}
              </div>
            )
          }

          <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:18 }}>
            {vendors.length} vendors total · Click any row to view profile
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {viewing && !showForm && (
          <VendorProfile
            key={viewing.id}
            v={vendors.find(v => v.id === viewing.id) || viewing}
            onClose={() => setViewing(null)}
            onEdit={() => openEdit(vendors.find(v => v.id === viewing.id) || viewing)}/>
        )}
        {showForm && (
          <VendorForm
            key={editing?.id || 'new'}
            initial={editing || {}}
            title={editing ? `Edit — ${editing.name}` : 'Add vendor'}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSave={saveVendor}/>
        )}
      </AnimatePresence>
    </LibraryPage>
  )
}
