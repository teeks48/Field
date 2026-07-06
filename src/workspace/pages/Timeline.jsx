import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store.jsx'
import FocusModal from '../../components/FocusModal.jsx'
import PageOwner from '../../components/PageOwner.jsx'
import { useLocalState } from '../../useLocalState.js'

/* ─── Deadline seed data ─────────────────────────────────── */
const DEADLINE_DATA = [
  {
    id:'d1', label:'Creative Lock', date:'Jul 1, 2026', daysOut:3,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'at-risk', linked:'creative',
    description:'All creative assets must be finalized and internally approved before presenting to the client.',
    progress:7, progressTotal:9,
    watching:['Creative','Deliverables','Content','Branding'],
    checklist:[
      { id:'c1', text:'Venue renderings approved',     done:true  },
      { id:'c2', text:'Floral moodboard approved',     done:true  },
      { id:'c3', text:'Menu approved',                 done:true  },
      { id:'c4', text:'Signage direction approved',    done:true  },
      { id:'c5', text:'Signage final artwork',          done:false },
      { id:'c6', text:'Client feedback received',       done:false },
      { id:'c7', text:'Final copy approval',            done:false },
      { id:'c8', text:'AV content approved',            done:false },
      { id:'c9', text:'Photography moodboard approved', done:false },
    ],
    notes:[{ author:'', time:'2h ago', text:'Waiting on client feedback for signage and AV content.' }],
    linkedModules:['creative','budget','vendors'],
  },
  {
    id:'d2', label:'Client Presentation', date:'Jul 3, 2026', daysOut:5,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'on-track', linked:'budget',
    description:'Present final concepts, budget and timeline to client.',
    progress:6, progressTotal:6,
    watching:['Budget','Creative','Approvals'],
    checklist:[
      { id:'c1', text:'Deck finalized',              done:true },
      { id:'c2', text:'Budget approved internally',  done:true },
      { id:'c3', text:'Timeline confirmed',          done:true },
      { id:'c4', text:'Creative assets ready',       done:true },
      { id:'c5', text:'Logistics plan confirmed',    done:true },
      { id:'c6', text:'Rehearsal notes prepared',    done:true },
    ],
    notes:[], linkedModules:['creative','budget'],
  },
  {
    id:'d3', label:'Vendor Awards', date:'Jul 7, 2026', daysOut:9,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'watch', linked:'vendors',
    description:'All key vendors selected and contracts issued.',
    progress:4, progressTotal:6,
    watching:['Vendors','Budget','Approvals'],
    checklist:[
      { id:'c1', text:'Fabrication contract signed',  done:true  },
      { id:'c2', text:'AV contract signed',           done:true  },
      { id:'c3', text:'Catering contract signed',     done:true  },
      { id:'c4', text:'Florals contract signed',      done:true  },
      { id:'c5', text:'Freight vendor confirmed',     done:false },
      { id:'c6', text:'Photography vendor confirmed', done:false },
    ],
    notes:[], linkedModules:['vendors','budget'],
  },
  {
    id:'d4', label:'Fabrication Start', date:'Jul 9, 2026', daysOut:11,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'on-track', linked:'fabrication',
    description:'Fabrication and production kick off.',
    progress:3, progressTotal:3,
    watching:['Fabrication','Vendors','Logistics'],
    checklist:[
      { id:'c1', text:'Shop drawings approved', done:true },
      { id:'c2', text:'Materials sourced',      done:true },
      { id:'c3', text:'Build schedule confirmed',done:true },
    ],
    notes:[], linkedModules:['fabrication','vendors'],
  },
  {
    id:'d5', label:'Site Survey', date:'Jul 13, 2026', daysOut:15,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'on-track', linked:'logistics',
    description:'Venue walkthrough and measurements complete.',
    progress:5, progressTotal:5,
    watching:['Logistics','Vendors'],
    checklist:[
      { id:'c1', text:'Venue access confirmed', done:true },
      { id:'c2', text:'Floor plan finalized',   done:true },
      { id:'c3', text:'Power survey complete',  done:true },
      { id:'c4', text:'Load-in route mapped',   done:true },
      { id:'c5', text:'COI submitted',          done:true },
    ],
    notes:[], linkedModules:['logistics'],
  },
  {
    id:'d6', label:'Load-In', date:'Jul 15, 2026', daysOut:17,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'upcoming', linked:'logistics',
    description:'All deliveries received and installation begins.',
    progress:2, progressTotal:5,
    watching:['Logistics','Fabrication','Vendors','AV / Tech'],
    checklist:[
      { id:'c1', text:'Freight delivery confirmed',   done:true  },
      { id:'c2', text:'Crew schedule issued',         done:true  },
      { id:'c3', text:'AV installation scheduled',    done:false },
      { id:'c4', text:'Florals delivery confirmed',   done:false },
      { id:'c5', text:'Furniture delivery confirmed', done:false },
    ],
    notes:[], linkedModules:['logistics','fabrication','vendors'],
  },
  {
    id:'d7', label:'Event Day', date:'Jul 16, 2026', daysOut:18,
    owner:'', ownerRole:'', ownerInitials:'',
    status:'event', linked:'run-of-show',
    description:'Showtime.',
    progress:0, progressTotal:0,
    watching:['Run of Show','Hospitality','AV / Tech'],
    checklist:[], notes:[], linkedModules:['run-of-show','hospitality'],
  },
]

const MODULE_LABELS = {
  'creative':'Creative','budget':'Budget','vendors':'Vendors','logistics':'Logistics',
  'fabrication':'Fabrication','run-of-show':'Run of Show','hospitality':'Hospitality','av-tech':'AV / Tech',
}

/* ─── Helpers ────────────────────────────────────────────── */
function statusStyle(s) {
  if (s==='on-track') return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)', label:'On track'  }
  if (s==='at-risk')  return { color:'var(--signal-red-text)',   bg:'var(--signal-red-bg)',   label:'At risk'   }
  if (s==='watch')    return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)',label:'Watch'     }
  if (s==='event')    return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)',  label:'Event'     }
  if (s==='complete') return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)', label:'Complete'  }
  return                      { color:'var(--ink-400)',           bg:'var(--ground-dim)',       label:'Upcoming'  }
}

function Av({ initials, size=28 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size<30?9:11, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)', letterSpacing:'0.02em' }}>
      {initials}
    </div>
  )
}

function ProgBar({ done, total }) {
  const pct = total > 0 ? Math.round((done/total)*100) : 0
  const col = pct===100?'var(--signal-green-dot)':pct>50?'var(--signal-amber-dot)':'var(--ink-500)'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:col, borderRadius:2, transition:'width 0.3s' }}/>
      </div>
      <span style={{ fontSize:10, color:'var(--ink-400)', fontFamily:'var(--font-mono)', minWidth:26, flexShrink:0 }}>{done}/{total}</span>
    </div>
  )
}

/* ─── Meta field ─────────────────────────────────────────── */
function MetaField({ label, children }) {
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>{label}</p>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Deadline focus modal — centered workspace
   ───────────────────────────────────────────────────────── */
function DeadlineModal({ d: rawD, onClose, onNavigate }) {
  // Normalize the record so legacy checkpoints (created before checklist/
  // watching/progress existed) can never crash the modal.
  const d = {
    ...rawD,
    checklist:     Array.isArray(rawD?.checklist)     ? rawD.checklist     : [],
    watching:      Array.isArray(rawD?.watching)      ? rawD.watching      : [],
    linkedModules: Array.isArray(rawD?.linkedModules) ? rawD.linkedModules : [],
    notes:         Array.isArray(rawD?.notes)         ? rawD.notes         : [],
    progress:      Number.isFinite(rawD?.progress)      ? rawD.progress      : 0,
    progressTotal: Number.isFinite(rawD?.progressTotal) ? rawD.progressTotal : 0,
    description:   rawD?.description || '',
  }
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes]       = useState(d.notes)
  const ss  = statusStyle(d.status)
  const pct = d.progressTotal > 0 ? Math.round((d.progress / d.progressTotal) * 100) : 0

  const postNote = () => {
    if (!noteText.trim()) return
    setNotes(p => [...p, { author:'', time:'Just now', text:noteText.trim() }])
    setNoteText('')
  }

  return (
    <FocusModal onClose={onClose} width="80vw" maxWidth="1040px">
      {/* ── Modal header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        padding:'22px 28px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:6 }}>Checkpoint</p>
          <h2 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.02em', color:'var(--ink-900)', marginBottom:8 }}>{d.label}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
              color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2 }}>{ss.label}</span>
            <span style={{ fontSize:13, color:'var(--ink-500)' }}>Due {d.date}</span>
            {d.daysOut > 0 && (
              <span style={{ fontSize:12, fontWeight:600,
                color:d.daysOut<=3?'var(--signal-red-text)':d.daysOut<=7?'var(--signal-amber-text)':'var(--ink-400)' }}>
                {d.daysOut}d remaining
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:24, lineHeight:1, flexShrink:0, padding:'0 0 0 16px' }}>×</button>
      </div>

      {/* ── Modal body — two columns ── */}
      <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', maxWidth:'var(--cap-wide)' }}>

        {/* Left: primary detail */}
        <div style={{ overflowY:'auto', padding:'24px 28px', borderRight:'1px solid var(--border)' }}>

          {/* Meta row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:28 }}>
            <MetaField label="Owner">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Av initials={d.ownerInitials} size={28}/>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{d.owner}</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)' }}>{d.ownerRole}</p>
                </div>
              </div>
            </MetaField>
            <MetaField label="Progress">
              {d.progressTotal > 0 ? (
                <div>
                  <p style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--ink-900)', marginBottom:6 }}>
                    {d.progress}<span style={{ fontSize:12, color:'var(--ink-300)', marginLeft:4 }}>/ {d.progressTotal}</span>
                  </p>
                  <ProgBar done={d.progress} total={d.progressTotal}/>
                </div>
              ) : <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>—</p>}
            </MetaField>
            <MetaField label="Description">
              <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.6 }}>{d.description}</p>
            </MetaField>
          </div>

          {/* Requirements checklist */}
          {d.checklist?.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
                color:'var(--ink-400)', marginBottom:14, borderBottom:'1px solid var(--border)', paddingBottom:10 }}>
                Requirements
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                {d.checklist.map(item => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                      background:item.done?'var(--signal-green-dot)':'transparent',
                      border:item.done?'none':'1.5px solid var(--border-med)',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {item.done && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <p style={{ fontSize:13, color:item.done?'var(--ink-400)':'var(--ink-800)',
                      textDecoration:item.done?'line-through':'none',
                      textDecorationColor:'var(--ink-200)' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watching modules */}
          {d.watching?.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
                color:'var(--ink-400)', marginBottom:12, borderBottom:'1px solid var(--border)', paddingBottom:10 }}>
                Watching modules
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {d.watching.map(mod => (
                  <div key={mod} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
                    background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--signal-green-dot)', flexShrink:0 }}/>
                    <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-700)' }}>{mod}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:10, fontStyle:'italic' }}>
                Status updates automatically as work progresses in these modules.
              </p>
            </div>
          )}

          {/* Internal notes */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
              color:'var(--ink-400)', marginBottom:14, borderBottom:'1px solid var(--border)', paddingBottom:10 }}>
              Internal notes
            </p>
            {notes.map((n, i) => (
              <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.65, marginBottom:5 }}>{n.text}</p>
                <p style={{ fontSize:11, color:'var(--ink-300)' }}>— {n.author}, {n.time}</p>
              </div>
            ))}
            <div style={{ display:'flex', gap:8 }}>
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key==='Enter' && postNote()}
                placeholder="Add a note…"
                style={{ flex:1, fontSize:13, height:36, padding:'0 12px', border:'1px solid var(--border)',
                  borderRadius:3, fontFamily:'var(--font)', outline:'none', background:'var(--surface)' }}/>
              <button onClick={postNote}
                style={{ padding:'0 16px', fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                  textTransform:'uppercase', background:'var(--ink-900)', color:'white',
                  border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', height:36 }}>Post</button>
            </div>
          </div>
        </div>

        {/* Right: linked + actions */}
        <div style={{ overflowY:'auto', padding:'24px 22px' }}>

          {/* Progress summary */}
          {d.progressTotal > 0 && (
            <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:20 }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:10 }}>Readiness</p>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400, color:'var(--ink-900)', lineHeight:1, marginBottom:6 }}>
                {pct}%
              </p>
              <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
                <div style={{ height:'100%', width:`${pct}%`, borderRadius:2, transition:'width 0.4s',
                  background:pct===100?'var(--signal-green-dot)':pct>60?'var(--signal-amber-dot)':'var(--ink-500)' }}/>
              </div>
              <p style={{ fontSize:11, color:'var(--ink-300)' }}>{d.progress} of {d.progressTotal} requirements met</p>
            </div>
          )}

          {/* Linked modules — clickable */}
          {d.linkedModules?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:10 }}>Linked</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {d.linkedModules.map(mod => (
                  <button key={mod} onClick={() => { onNavigate && onNavigate(mod); onClose() }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px',
                      background:'var(--ground-dim)', border:'1px solid var(--border)',
                      borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', textAlign:'left' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink-400)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--ink-700)' }}>{MODULE_LABELS[mod] || mod}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 10L10 2M5 2h5v5" stroke="var(--ink-300)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:10 }}>Actions</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button style={{ padding:'10px 14px', fontSize:12, fontWeight:700, letterSpacing:'0.06em',
                textTransform:'uppercase', background:'var(--ink-900)', color:'white',
                border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                Update progress
              </button>
              <button style={{ padding:'10px 14px', fontSize:12, fontWeight:500, color:'var(--ink-600)',
                background:'transparent', border:'1px solid var(--border)', borderRadius:4,
                cursor:'pointer', fontFamily:'var(--font)' }}>
                Mark complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusModal>
  )
}

/* ─── Deadline table row ─────────────────────────────────── */
function DeadlineRow({ d, onClick }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(d.status)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'grid',
        gridTemplateColumns:'minmax(200px,1fr) 100px minmax(140px,160px) 130px 90px 20px',
        gap:16, padding:'14px 0', borderBottom:'1px solid var(--border)',
        cursor:'pointer', alignItems:'center',
        background:hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s',
      }}
    >
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:3, letterSpacing:'-0.01em' }}>{d.label}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>{d.description?.slice(0,55)}{d.description?.length>55?'…':''}</p>
      </div>
      <div>
        <p style={{ fontSize:12, color:'var(--ink-700)', fontFamily:'var(--font-mono)', marginBottom:2 }}>{d.date.replace(', 2026','')}</p>
        <p style={{ fontSize:11, fontWeight:d.daysOut<=5?600:400,
          color:d.daysOut<=0?'var(--signal-red-text)':d.daysOut<=5?'var(--signal-amber-text)':'var(--ink-300)' }}>
          {d.daysOut<=0?'Today':`${d.daysOut}d`}
        </p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Av initials={d.ownerInitials} size={26}/>
        <div>
          <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)' }}>{d.owner}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{d.ownerRole}</p>
        </div>
      </div>
      {d.progressTotal>0
        ? <ProgBar done={d.progress} total={d.progressTotal}/>
        : <span style={{ fontSize:12, color:'var(--ink-200)' }}>—</span>}
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
        color:ss.color, background:ss.bg, padding:'3px 8px', borderRadius:2, whiteSpace:'nowrap' }}>
        {ss.label}
      </span>
      <motion.div animate={{ opacity:hov?1:0.3, x:hov?0:-2 }} transition={{ duration:0.1 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Timeline page
   ───────────────────────────────────────────────────────── */
export default function Timeline({ onNavigate, projectId }) {
  const { state, derived } = useStore()
  const { daysOut } = derived

  const [deadlines, setDeadlines] = useLocalState(`timeline_${projectId || 'default'}_v1`, [])
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState('all')
  const [adding,    setAdding]    = useState(false)
  const [newForm,   setNewForm]   = useState({ label:'', date:'', owner:'', status:'upcoming' })

  const total    = deadlines.length
  const complete = deadlines.filter(d => d.status==='complete').length
  const atRisk   = deadlines.filter(d => d.status==='at-risk').length
  const upcoming = deadlines.filter(d => d.status==='upcoming').length
  const readyPct = total>0 ? Math.round((complete/total)*100) : 0
  const nextDl   = deadlines.find(d => d.status!=='complete' && d.status!=='event')

  const shown = filter==='upcoming' ? deadlines.filter(d=>['upcoming','on-track'].includes(d.status))
              : filter==='at-risk'  ? deadlines.filter(d=>d.status==='at-risk')
              : filter==='complete' ? deadlines.filter(d=>d.status==='complete')
              : deadlines

  const addDeadline = () => {
    if (!newForm.label) return
    setDeadlines(p => [...p, { id:`d${Date.now()}`, ...newForm, daysOut:99, ownerInitials:'?', ownerRole:'',
      description:'', progress:0, progressTotal:0, watching:[], checklist:[], notes:[], linkedModules:[] }])
    setNewForm({ label:'', date:'', owner:'', status:'upcoming' })
    setAdding(false)
  }

  const phaseLabel = d => {
    if (d===null||d>30) return 'Pre-production'
    if (d>7)  return 'Final push'
    if (d>0)  return 'Event week'
    return 'Post-event'
  }

  const inp = { fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)',
    borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none' }

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Planning · Timeline</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:10 }}>
              <span style={{ fontWeight:700, color:'var(--ink-900)' }}>Timeline</span>
            </h1>
            <PageOwner area="Timeline" projectId={projectId}/>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>Track key checkpoints and ensure everything is ready for a seamless execution.</p>
          </div>
          <button onClick={() => setAdding(a=>!a)}
            style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
            + Add checkpoint
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'18px 22px' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }}>Project readiness</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.02em', color:'var(--ink-900)', lineHeight:1, marginBottom:10 }}>{readyPct}%</p>
            <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', width:`${readyPct}%`, background:'var(--signal-green-dot)', borderRadius:2, transition:'width 0.4s' }}/>
            </div>
            <p style={{ fontSize:12, color:'var(--ink-400)' }}>On track for event day</p>
          </div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'18px 22px' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }}>{phaseLabel(daysOut)}</p>
            {nextDl && (
              <>
                <p style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.02em',
                  color:nextDl.daysOut<=3?'var(--signal-red-text)':'var(--ink-900)', lineHeight:1, marginBottom:4 }}>{nextDl.daysOut}d</p>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-800)', marginBottom:3 }}>{nextDl.label}</p>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>Due {nextDl.date}</p>
              </>
            )}
          </div>
        </div>

        {/* Filters + add form */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div className="filter-chips" style={{ marginBottom:0 }}>
            {[['all','All checkpoints'],['upcoming',`Upcoming (${upcoming})`],['at-risk',`At risk (${atRisk})`],['complete',`Completed (${complete})`]].map(([id,label]) => (
              <button key={id} className={`chip${filter===id?' active':''}`} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>

        {adding && (
          <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 120px 160px 130px auto', gap:10, alignItems:'flex-end' }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Deadline</p>
                <input autoFocus placeholder="Deadline name" value={newForm.label} onChange={e=>setNewForm(p=>({...p,label:e.target.value}))} style={{...inp,width:'100%'}}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Due date</p>
                <input placeholder="Jul 10" value={newForm.date} onChange={e=>setNewForm(p=>({...p,date:e.target.value}))} style={{...inp,width:'100%'}}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Owner</p>
                <input placeholder="Owner name" value={newForm.owner} onChange={e=>setNewForm(p=>({...p,owner:e.target.value}))} style={{...inp,width:'100%'}}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Status</p>
                <select value={newForm.status} onChange={e=>setNewForm(p=>({...p,status:e.target.value}))} style={{...inp,width:'100%'}}>
                  {['upcoming','on-track','at-risk','watch','complete'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={addDeadline} style={{ padding:'0 18px', height:34, fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
                <button onClick={() => setAdding(false)} style={{ padding:'0 12px', height:34, fontSize:11, background:'transparent', color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer' }}>✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(200px,1fr) 100px minmax(140px,160px) 130px 90px 20px',
          gap:16, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
          {['Checkpoint','Due date','Owner','Progress','Status',''].map((h,i) => (
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        {shown.map(d => (
          <DeadlineRow key={d.id} d={d} onClick={() => setSelected(d)}/>
        ))}
        {shown.length===0 && (
          <div style={{ padding:'40px 0', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-200)' }}>No checkpoints in this view</p>
          </div>
        )}
        <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:14 }}>Click any row to open checkpoint detail</p>
      </motion.div>

      {/* Centered focus modal */}
      <AnimatePresence>
        {selected && (
          <DeadlineModal key={selected.id} d={selected} onClose={() => setSelected(null)} onNavigate={onNavigate}/>
        )}
      </AnimatePresence>
    </div>
  )
}
