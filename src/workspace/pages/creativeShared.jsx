import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */
export const APPROVAL_STAGES = ['Not started','In progress','Internal review','Client review','Approved','Production ready']

export const FORMAT_OPTIONS = ['PNG','JPG','PDF','AI','EPS','MP4']

export const DELIVERABLE_TYPES = [
  'Venue Renderings','3D Renders','Flythrough / Animation','Environmental Graphics',
  'Vinyl Graphics','Signage','Menus','Invitations','Print Assets','Social Assets','Other',
]

/* Asset category — set once at upload time, drives the colored Type badge */
export const TYPE_OPTIONS = ['Print','Digital','Fabrication']

export function typeStyle(t) {
  if (t === 'Print')       return { color:'var(--signal-purple-text)', bg:'var(--signal-purple-bg)' }
  if (t === 'Digital')     return { color:'var(--signal-amber-text)',  bg:'var(--signal-amber-bg)'  }
  if (t === 'Fabrication') return { color:'var(--signal-blue-text)',   bg:'var(--signal-blue-bg)'   }
  return { color:'var(--ink-300)', bg:'var(--ground-dim)' }
}

/* Deliverables with distinct muted thumbnail backgrounds to simulate imagery */

export const INIT_COLORS = [
  { id:'c1', hex:'#EDEAE4', label:'Parchment'  },
  { id:'c2', hex:'#D7D2C6', label:'Stone'       },
  { id:'c3', hex:'#1F1F1F', label:'Noir'        },
  { id:'c4', hex:'#383733', label:'Charcoal'    },
  { id:'c5', hex:'#7A7A78', label:'Mid gray'    },
  { id:'c6', hex:'#B58A3C', label:'Amber'       },
  { id:'c7', hex:'#F2F2F2', label:'Off white'   },
]

/* Moodboard — simulated with distinct bg colors representing different reference images */
export const INIT_MOOD = [
  { id:'m1', bg:'linear-gradient(160deg,#1a1208 0%,#3d2e10 100%)', h:160 },
  { id:'m2', bg:'linear-gradient(140deg,#c8bfaa 0%,#e8e0cc 100%)', h:140 },
  { id:'m3', bg:'linear-gradient(160deg,#d0cfc8 0%,#e8e6de 100%)', h:180 },
  { id:'m4', bg:'linear-gradient(180deg,#0a0a0c 0%,#1a1820 100%)', h:150 },
  { id:'m5', bg:'linear-gradient(140deg,#b8b4a8 0%,#d8d4c8 100%)', h:160 },
  { id:'m6', bg:'linear-gradient(160deg,#c8c4b8 0%,#e0dcd0 100%)', h:140 },
  { id:'m7', bg:'linear-gradient(160deg,#181414 0%,#302820 100%)', h:180 },
  { id:'m8', bg:'linear-gradient(140deg,#d4d0c8 0%,#eceae4 100%)', h:150 },
  { id:'m9', bg:'linear-gradient(160deg,#0c1018 0%,#1c2430 100%)', h:140 },
  { id:'m10',bg:'linear-gradient(160deg,#e0dcd4 0%,#f0ece4 100%)', h:160 },
]

/* ─────────────────────────────────────────────
   Status helpers
   ───────────────────────────────────────────── */
export function statusStyle(s) {
  if (['Approved'].includes(s)) return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)', dot:'var(--signal-green-dot)' }
  if (s==='Production ready') return { color:'var(--signal-teal-text)', bg:'var(--signal-teal-bg)', dot:'var(--signal-teal-dot)' }
  if (s==='Client review') return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)', dot:'var(--signal-amber-dot)' }
  if (['Internal review','In review'].includes(s)) return { color:'var(--signal-purple-text)', bg:'var(--signal-purple-bg)', dot:'var(--signal-purple-dot)' }
  if (s==='In progress') return { color:'var(--signal-blue-text)', bg:'var(--signal-blue-bg)', dot:'var(--signal-blue-dot)' }
  return { color:'var(--ink-300)', bg:'var(--ground-dim)', dot:'var(--ink-300)' }
}

export function stageIdx(s) { return APPROVAL_STAGES.indexOf(s) }

/* ─────────────────────────────────────────────
   Edit modal — brief / objectives
   ───────────────────────────────────────────── */
export function EditModal({ title, value, onSave, onClose }) {
  const [text, setText] = useState(value)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(26,25,22,0.45)' }} onClick={onClose}/>
      <motion.div
        initial={{ opacity:0, scale:0.97, y:10 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.97 }}
        transition={{ duration:0.18, ease:[0.25,1,0.5,1] }}
        style={{ position:'relative', zIndex:1, width:600, maxHeight:'80vh', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border-med)', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.14)' }}
        onClick={e=>e.stopPropagation()}
      >
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>Edit {title}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          style={{ flex:1, resize:'none', border:'none', outline:'none', padding:'24px', fontSize:15, lineHeight:1.8, fontFamily:'var(--font)', color:'var(--ink-800)', background:'transparent', minHeight:260 }}
        />
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <p style={{ fontSize:11, color:'var(--ink-300)' }}>Auto-saved just now</p>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 18px', fontSize:13, fontWeight:500, background:'transparent', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--ink-600)', fontFamily:'var(--font)' }}>Cancel</button>
            <button onClick={() => { onSave(text); onClose() }} style={{ padding:'8px 22px', fontSize:13, fontWeight:600, background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Save</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Document card — brief / objectives
   Editorial card with generous padding, no border drama
   ───────────────────────────────────────────── */
export function DocCard({ label, value, onEdit }) {
  const empty = !value?.trim()
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Card header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 22px 14px', borderBottom:'1px solid var(--border)' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)' }}>{label}</p>
        {!empty && (
          <button onClick={onEdit} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontFamily:'var(--font)', fontSize:12, fontWeight:500 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5V7.5l6-6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
            Edit
          </button>
        )}
      </div>
      {/* Card body */}
      {empty ? (
        <button onClick={onEdit}
          style={{ padding:'40px 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', width:'100%' }}
          onMouseEnter={e => e.currentTarget.querySelector('p').style.color='var(--ink-500)'}
          onMouseLeave={e => e.currentTarget.querySelector('p').style.color='var(--ink-200)'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--ink-200)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <p style={{ fontSize:13, color:'var(--ink-200)', fontFamily:'var(--font)', transition:'color 0.12s' }}>Add {label.charAt(0)+label.slice(1).toLowerCase()}</p>
        </button>
      ) : (
        <div onClick={onEdit} style={{ padding:'20px 22px 24px', cursor:'text', lineHeight:1.8, fontSize:15, color:'var(--ink-700)', whiteSpace:'pre-wrap' }}>
          {value}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Deliverable thumbnail — rendered canvas-style
   ───────────────────────────────────────────── */
function Thumb({ d, size = 64 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:4, flexShrink:0, overflow:'hidden', background:d.imgBg, position:'relative' }}>
      {/* Simulated image layers */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 70% 30%, ${d.imgAccent}60, transparent 60%)` }}/>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:`linear-gradient(to top, ${d.imgBg}CC, transparent)` }}/>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Deliverable row — clean ledger
   ───────────────────────────────────────────── */
export function DeliverableRow({ d, onClick }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(d.status)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'padding-left 0.11s', paddingLeft:hov?4:0 }}
    >
      <Thumb d={d} size={60}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:15, fontWeight:500, color:'var(--ink-900)', marginBottom:4, letterSpacing:'-0.01em' }}>{d.item}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>{d.owner} · Due {d.due}</p>
      </div>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'3px 10px', borderRadius:3, flexShrink:0, whiteSpace:'nowrap' }}>
        {d.status.toUpperCase()}
      </span>
      <motion.div animate={{ opacity:hov?1:0, x:hov?0:-3 }} transition={{ duration:0.11 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 3.5l3.5 3.5-3.5 3.5" stroke="var(--ink-300)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Approval pipeline — horizontal node track
   ───────────────────────────────────────────── */
export function Pipeline({ status }) {
  const cur = stageIdx(status)
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
      {APPROVAL_STAGES.map((s, i) => {
        const done   = i < cur
        const active = i === cur
        const ss     = statusStyle(s)
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
              <div style={{ width:9, height:9, borderRadius:'50%',
                background: (done||active) ? ss.dot : 'transparent',
                border: (done||active) ? 'none' : '1.5px solid var(--border-med)' }}/>
              <p style={{ fontSize:10, letterSpacing:'0.03em', whiteSpace:'nowrap',
                color: (done||active) ? ss.color : 'var(--ink-200)', fontWeight:active?700:400 }}>{s}</p>
            </div>
            {i < APPROVAL_STAGES.length-1 && (
              <div style={{ width:22, height:1, background:i<cur?ss.dot:'var(--border)', margin:'4px 3px 0', flexShrink:0 }}/>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Full-screen deliverable review
   Left: large asset canvas   Right: decision panel
   ─────────────────────────────────────────────────────────── */

/* Asset canvas — renders the visual as large as possible.
   In production: swap the gradient div for <img>, <video>, or
   an <iframe> (PDF/Figma). URL comes from ver.url if present. */
function AssetCanvas({ d, ver }) {
  if (!ver) {
    return (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#0c0b09' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.25)', fontFamily:'var(--font)' }}>Upload a file to begin reviewing</p>
      </div>
    )
  }

  const ext = (ver.file || '').split('.').pop().toLowerCase()
  const isVideo = ['mp4','mov','webm'].includes(ext)
  const isPDF   = ext === 'pdf'
  const isImg   = ['jpg','jpeg','png','gif','webp','avif'].includes(ext)

  /* Real image — src falls back gracefully, gradient shows behind */
  if (isImg) return (
    <div style={{ width:'100%', height:'100%', position:'relative', background:`radial-gradient(ellipse at 58% 38%, ${d.imgAccent}44, transparent 62%), ${d.imgBg}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {ver.url && <img src={ver.url} alt={ver.file} style={{ maxWidth:'92%', maxHeight:'88%', objectFit:'contain', borderRadius:3, boxShadow:'0 32px 80px rgba(0,0,0,0.60)' }}/>}
      {!ver.url && <PlaceholderArt d={d} ver={ver}/>}
    </div>
  )

  /* Video */
  if (isVideo) return (
    <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at 58% 38%, ${d.imgAccent}40, transparent 65%), ${d.imgBg}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
      <PlaceholderArt d={d} ver={ver}/>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3l9 5-9 5V3z" fill="rgba(255,255,255,0.85)"/></svg>
        </div>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', fontFamily:'var(--font)' }}>{ver.file}</p>
      </div>
    </div>
  )

  /* PDF */
  if (isPDF) return (
    <div style={{ width:'100%', height:'100%', background:'#111009', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:96, height:120, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="2" width="24" height="28" rx="3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4"/><path d="M9 11h14M9 16h14M9 21h9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round"/></svg>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.55)', marginBottom:4, fontFamily:'var(--font)' }}>{ver.file}</p>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontFamily:'var(--font)' }}>v{ver.v} · {ver.by} · {ver.date}</p>
      </div>
      <button style={{ padding:'9px 24px', fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.70)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Open PDF ↗</button>
    </div>
  )

  /* Generic / 3D / other */
  return (
    <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at 55% 40%, ${d.imgAccent}44, transparent 65%), ${d.imgBg}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PlaceholderArt d={d} ver={ver}/>
    </div>
  )
}

/* Styled placeholder — visible when no real URL is available */
function PlaceholderArt({ d, ver }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="2" y="2" width="22" height="22" rx="3" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4"/><path d="M2 17l7-7 5.5 5.5L19 11l5 7" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="8" cy="9" r="2" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4"/></svg>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.45)', marginBottom:4, fontFamily:'var(--font)' }}>{ver.file}</p>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)', fontFamily:'var(--font)' }}>v{ver.v} · uploaded {ver.date}</p>
      </div>
    </div>
  )
}

export function Workspace({ d, onClose, onUpdateStatus, dispatch }) {
  const [versions,    setVersions]    = useState(d.versions || [])
  const [comments,    setComments]    = useState(d.comments || [])
  const [activeVerIdx,setActiveVerIdx]= useState(0)   // newest-first index
  const [panelTab,    setPanelTab]    = useState('details')
  const [note,        setNote]        = useState('')
  const [comment,     setComment]     = useState('')
  const fileRef = useRef(null)

  // Specifications — draft state, explicit save (no auto-save)
  const [specDraft, setSpecDraft] = useState({
    copy: d.copy || '',
    width: d.width || '',
    height: d.height || '',
    format: d.format || '',
    producerNotes: d.producerNotes || '',
    milestones: { ...(d.milestones || { forRevision:'', clientReview:'', approved:'' }) },
  })
  const [specSaved, setSpecSaved] = useState(false)
  const saveSpec = () => {
    dispatch(A.updateDeliverable(d.id, specDraft))
    setSpecSaved(true)
    setTimeout(() => setSpecSaved(false), 1200)
  }

  const curIdx    = stageIdx(d.status)
  const nextSt    = APPROVAL_STAGES[curIdx + 1]
  const canAdv    = curIdx < APPROVAL_STAGES.length - 1
  const versionsD = [...versions].reverse()  // newest first
  const activeVer = versionsD[activeVerIdx] || null
  const ss        = statusStyle(d.status)

  const addVer = name => {
    setVersions(p => [...p, { v: p.length + 1, file: name, by: '', date: 'Jun 29' }])
    setActiveVerIdx(0)
  }
  const postCmt = () => {
    if (!comment.trim()) return
    setComments(p => [...p, { id: `c${Date.now()}`, author: 'You', time: 'Just now', text: comment.trim() }])
    setComment('')
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handle = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft'  && activeVerIdx < versionsD.length - 1) setActiveVerIdx(i => i + 1)
      if (e.key === 'ArrowRight' && activeVerIdx > 0)                    setActiveVerIdx(i => i - 1)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [activeVerIdx, versionsD.length, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: '#111109', fontFamily: 'var(--font)' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{ height: 50, background: '#1A1916', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>

        {/* Left: back + deliverable name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.34)', fontSize: 12, fontFamily: 'var(--font)', padding: 0 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L4 6.5l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Assets
          </button>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>{d.item}</span>
        </div>

        {/* Centre: version buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {versionsD.length === 0 && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>No files yet</p>
          )}
          {versionsD.map((ver, i) => (
            <button key={ver.v} onClick={() => setActiveVerIdx(i)}
              style={{
                padding: '4px 11px', fontSize: 11, fontWeight: 600, borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font)',
                background: i === activeVerIdx ? 'rgba(255,255,255,0.14)' : 'transparent',
                border:     i === activeVerIdx ? '1px solid rgba(255,255,255,0.32)' : '1px solid rgba(255,255,255,0.08)',
                color:      i === activeVerIdx ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.28)',
              }}>
              v{ver.v}{i === 0 ? ' · Latest' : ''}
            </button>
          ))}
          {versionsD.length > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', marginLeft: 6 }}>← → to navigate</span>
          )}
        </div>

        {/* Right: status + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: ss.color, background: ss.bg, padding: '3px 9px', borderRadius: 3 }}>{d.status}</span>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 4, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.46)', fontSize: 18, lineHeight: 1 }}>
            ×
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', overflow: 'hidden' }}>

        {/* LEFT — large asset canvas */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AssetCanvas d={d} ver={activeVer}/>

          {/* Prev version arrow */}
          {versionsD.length > 1 && activeVerIdx < versionsD.length - 1 && (
            <button onClick={() => setActiveVerIdx(i => i + 1)}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.54)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          {/* Next version arrow */}
          {versionsD.length > 1 && activeVerIdx > 0 && (
            <button onClick={() => setActiveVerIdx(i => i - 1)}
              style={{ position: 'absolute', right: 400, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.54)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}

          {/* Upload CTA when no files */}
          {versions.length === 0 && (
            <button onClick={() => { setPanelTab('files'); fileRef.current?.click() }}
              style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', padding: '10px 26px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + Upload first file
            </button>
          )}
        </div>

        {/* RIGHT — decision panel */}
        <div style={{ background: 'var(--surface)', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Panel header */}
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4 }}>{d.owner} · Due {d.due}</p>
            <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-900)', marginBottom: 12 }}>{d.item}</h3>
            <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
              <Pipeline status={d.status}/>
            </div>
          </div>

          {/* Panel tabs */}
          <div style={{ display: 'flex', padding: '0 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {['details', 'specifications', 'files', 'comments'].map(t => (
              <button key={t} onClick={() => setPanelTab(t)}
                style={{ padding: '10px 0', marginRight: 18, fontSize: 12, fontWeight: 500, fontFamily: 'var(--font)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize', borderBottom: panelTab === t ? '2px solid var(--ink-900)' : '2px solid transparent', marginBottom: -1, color: panelTab === t ? 'var(--ink-900)' : 'var(--ink-400)', transition: 'color 0.1s' }}>
                {t === 'details' ? 'Details' : t === 'specifications' ? 'Specifications' : t === 'files' ? `Files${versionsD.length ? ` (${versionsD.length})` : ''}` : 'Comments'}
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

            {/* DETAILS */}
            {panelTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Approval actions — directly under the pipeline timeline */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 12 }}>Approval</p>
                  {curIdx >= stageIdx('Client review') && (
                    <p style={{ fontSize: 11, color: 'var(--signal-blue-text)', marginBottom: curIdx >= stageIdx('Production ready') ? 6 : 12,
                      display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--signal-blue-text)', flexShrink:0 }}/>
                      Tracked in project Approvals registry
                    </p>
                  )}
                  {d.status === 'Production ready' && (
                    <p style={{ fontSize: 11, color: 'var(--signal-green-text)', marginBottom: 12,
                      display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--signal-green-dot)', flexShrink:0 }}/>
                      Handed off to Fulfillment for production
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {canAdv && (
                      <button onClick={() => onUpdateStatus(nextSt)}
                        style={{ width: '100%', padding: '11px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'var(--ink-900)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        {curIdx === 0 ? 'Mark in progress'
                          : curIdx === 1 ? 'Send for internal review'
                          : curIdx === 2 ? 'Send to client'
                          : curIdx === 3 ? 'Mark approved'
                          : curIdx === 4 ? 'Mark production ready'
                          : 'Advance'}
                      </button>
                    )}
                    {curIdx > 0 && (
                      <button onClick={() => onUpdateStatus(APPROVAL_STAGES[curIdx - 1])}
                        style={{ width: '100%', padding: '10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'transparent', color: 'var(--ink-500)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2L2.5 5.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Back to {APPROVAL_STAGES[curIdx - 1]}
                      </button>
                    )}
                    {curIdx >= 2 && curIdx < stageIdx('Approved') && (
                      <button onClick={() => onUpdateStatus('In progress')}
                        style={{ width: '100%', padding: '10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'transparent', color: 'var(--signal-amber-text)', border: '1px solid rgba(200,138,26,0.30)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        Request changes
                      </button>
                    )}
                    {d.status === 'Production ready' && (
                      <button
                        style={{ width: '100%', padding: '10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'transparent', color: 'var(--signal-green-text)', border: '1px solid var(--signal-green-dot)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        ↗ Move to Fulfillment
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta — below the approval actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  {[['Owner', d.owner || ''], ['Due date', d.due || 'TBD'], ['Status', d.status], ['Last updated', 'Jun 29']].map(([l, v]) => (
                    <div key={l}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 4 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: l === 'Status' ? statusStyle(v).color : 'var(--ink-900)' }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Internal note */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 10 }}>Internal note</p>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add an internal note…"
                    style={{ width: '100%', minHeight: 80, resize: 'none', fontSize: 13, lineHeight: 1.6, borderRadius: 4, border: '1px solid var(--border)', padding: '9px 11px', outline: 'none', fontFamily: 'var(--font)' }}/>
                </div>
              </div>
            )}

            {/* SPECIFICATIONS */}
            {panelTab === 'specifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 8 }}>Copy</p>
                  <textarea value={specDraft.copy} onChange={e => setSpecDraft(p => ({ ...p, copy: e.target.value }))}
                    placeholder="Text content for this asset…"
                    style={{ width: '100%', minHeight: 60, resize: 'none', fontSize: 13, lineHeight: 1.6, borderRadius: 4, border: '1px solid var(--border)', padding: '9px 11px', outline: 'none', fontFamily: 'var(--font)' }}/>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 6 }}>Width</p>
                    <input value={specDraft.width} onChange={e => setSpecDraft(p => ({ ...p, width: e.target.value }))} placeholder="e.g. 8ft"
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font)', outline: 'none' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 6 }}>Height</p>
                    <input value={specDraft.height} onChange={e => setSpecDraft(p => ({ ...p, height: e.target.value }))} placeholder="e.g. 4ft"
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font)', outline: 'none' }}/>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 6 }}>Format</p>
                  <input value={specDraft.format} onChange={e => setSpecDraft(p => ({ ...p, format: e.target.value }))} placeholder="e.g. AI, PDF, MP4"
                    style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font)', outline: 'none' }}/>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 8 }}>Producer notes</p>
                  <textarea value={specDraft.producerNotes} onChange={e => setSpecDraft(p => ({ ...p, producerNotes: e.target.value }))}
                    placeholder="Add producer notes…"
                    style={{ width: '100%', minHeight: 70, resize: 'none', fontSize: 13, lineHeight: 1.6, borderRadius: 4, border: '1px solid var(--border)', padding: '9px 11px', outline: 'none', fontFamily: 'var(--font)' }}/>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 10 }}>Milestone dates</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[['forRevision', 'For revision', 'var(--signal-amber-text)'], ['clientReview', 'Client review', 'var(--signal-amber-text)'], ['approved', 'Approved', 'var(--signal-green-text)']].map(([key, label, color]) => (
                      <div key={key}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, marginBottom: 4, display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }}/>
                          {label}
                        </p>
                        <input value={specDraft.milestones[key]} onChange={e => setSpecDraft(p => ({ ...p, milestones: { ...p.milestones, [key]: e.target.value } }))}
                          placeholder="MM/DD/YYYY"
                          style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font)', outline: 'none' }}/>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveSpec}
                  style={{ width: '100%', padding: '11px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    background: specSaved ? 'var(--signal-green-dot)' : 'var(--ink-900)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)', transition:'background 0.2s' }}>
                  {specSaved ? '✓ Saved' : 'Save specifications'}
                </button>
              </div>
            )}

            {/* FILES */}
            {panelTab === 'files' && (
              <div>
                {/* Drop zone */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) addVer(f.name) }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: '1px dashed var(--border-med)', borderRadius: 4, padding: '18px', textAlign: 'center', marginBottom: 16, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-400)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-med)'}>
                  <p style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 2 }}>Drop files or click to upload</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-300)' }}>JPG · PNG · PDF · MP4 · AI · PSD · Figma</p>
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && addVer(e.target.files[0].name)}/>
                </div>

                {/* Version list — clicking selects the version for preview */}
                {versionsD.length > 0 ? (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 10 }}>Version history</p>
                    {versionsD.map((ver, i) => (
                      <div key={ver.v} onClick={() => setActiveVerIdx(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 4, marginBottom: 4, cursor: 'pointer', background: i === activeVerIdx ? 'var(--ground-dim)' : 'transparent', border: i === activeVerIdx ? '1px solid var(--border)' : '1px solid transparent' }}
                        onMouseEnter={e => { if (i !== activeVerIdx) e.currentTarget.style.background = 'var(--ground-dim)' }}
                        onMouseLeave={e => { if (i !== activeVerIdx) e.currentTarget.style.background = 'transparent' }}>
                        {/* Mini thumbnail */}
                        <div style={{ width: 40, height: 40, borderRadius: 3, background: d.imgBg, flexShrink: 0, overflow: 'hidden', position: 'relative', border: i === activeVerIdx ? '1.5px solid var(--ink-400)' : '1px solid var(--border)' }}>
                          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 30%, ${d.imgAccent}70, transparent 70%)` }}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ver.file}</p>
                            {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--signal-green-text)', background: 'var(--signal-green-bg)', padding: '1px 5px', borderRadius: 2, flexShrink: 0 }}>Latest</span>}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--ink-300)' }}>v{ver.v} · {ver.by} · {ver.date}</p>
                        </div>
                        {i === activeVerIdx && <span style={{ fontSize: 10, color: 'var(--ink-300)', flexShrink: 0 }}>↑ Viewing</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '28px 0', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-200)' }}>No files uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {/* COMMENTS */}
            {panelTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, marginBottom: 14 }}>
                  {comments.length === 0
                    ? <div style={{ padding: '28px 0', textAlign: 'center' }}><p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-200)' }}>No comments yet</p></div>
                    : comments.map(c => (
                      <div key={c.id} style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)' }}>{c.author}</p>
                          <p style={{ fontSize: 10, color: 'var(--ink-300)', fontFamily: 'var(--font-mono)' }}>{c.time}</p>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6 }}>{c.text}</p>
                      </div>
                    ))
                  }
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…"
                    style={{ flex: 1, minHeight: 60, resize: 'none', fontSize: 13, lineHeight: 1.55, borderRadius: 4, border: '1px solid var(--border)', padding: '8px 10px', outline: 'none', fontFamily: 'var(--font)' }}/>
                  <button onClick={postCmt}
                    style={{ padding: '8px 14px', background: 'var(--ink-900)', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}>Post</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   Main Creative page
   ───────────────────────────────────────────── */
