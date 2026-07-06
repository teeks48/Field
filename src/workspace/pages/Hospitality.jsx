import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store.jsx'
import { useLocalState } from '../../useLocalState.js'
import PageOwner from '../../components/PageOwner.jsx'

/* ─────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────── */
const MENU_STATUS  = ['Draft','Proposed','Confirmed','Pending client']
const DIETARY_TAGS = ['V','VG','GF','DF','N-free','Halal','Kosher']
const COURSE_OPTS  = ['Welcome canapés','First course','Second course','Main','Dessert','Mignardises','Cocktail hour','Staff meal','Other']
const DRINK_OPTS   = ['Welcome','Reception','Dinner pairing','Digestif','All evening','N/A']
const uid = () => `_${Math.random().toString(36).slice(2,8)}`

/* ─── Status colour helpers ──────────────────────────────── */
const sColor = s => s==='Confirmed'?'var(--signal-green-text)':s==='Proposed'?'var(--signal-blue-text)':s==='Pending client'?'var(--signal-amber-text)':'var(--ink-300)'
const sBg    = s => s==='Confirmed'?'var(--signal-green-bg)':s==='Proposed'?'var(--signal-blue-bg)':s==='Pending client'?'var(--signal-amber-bg)':'var(--ground-dim)'

/* ─────────────────────────────────────────────────────────
   InlineEditor — Notion-style: reads as text, edits on click
   ───────────────────────────────────────────────────────── */
function InlineEditor({ value, onChange, placeholder, multiline = false, style = {} }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const ref = useRef(null)

  const commit = useCallback(() => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }, [draft, value, onChange])

  if (editing) {
    const shared = {
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: e => { if (!multiline && e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') { setDraft(value); setEditing(false) } },
      autoFocus: true,
      style: {
        width: '100%', border: 'none', outline: 'none', resize: 'none',
        fontFamily: 'var(--font)', background: 'transparent', padding: 0,
        ...style,
      },
    }
    return multiline ? <textarea {...shared} rows={Math.max(3, draft.split('\n').length + 1)}/> : <input {...shared}/>
  }

  const empty = !value?.trim()
  return (
    <div
      onClick={() => { setDraft(value); setEditing(true) }}
      style={{
        cursor: 'text', minHeight: 24,
        color: empty ? 'var(--ink-200)' : undefined,
        fontStyle: empty ? 'italic' : undefined,
        ...style,
      }}
    >
      {empty ? placeholder : (multiline ? value.split('\n').map((l,i) => <span key={i}>{l}{i < value.split('\n').length-1 && <br/>}</span>) : value)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Moodboard — shared Pinterest-style component
   ───────────────────────────────────────────────────────── */
const MOOD_BG = [
  'linear-gradient(160deg,#2C2418 0%,#4A3C28 100%)',
  'linear-gradient(140deg,#E8E0CC 0%,#F0E8D8 100%)',
  'linear-gradient(160deg,#1A2028 0%,#2C3440 100%)',
  'linear-gradient(140deg,#D4C8A8 0%,#E8DEC8 100%)',
  'linear-gradient(160deg,#282820 0%,#403C30 100%)',
  'linear-gradient(140deg,#C8C0B0 0%,#E0D8C8 100%)',
  'linear-gradient(160deg,#1C2018 0%,#303828 100%)',
  'linear-gradient(140deg,#E0D0B8 0%,#F0E4CC 100%)',
]

function Moodboard({ images, setImages, cols = '4 180px' }) {
  const [draggingId, setDraggingId] = useState(null)
  const [preview,    setPreview]    = useState(null)
  const dragOver = useRef(null)
  const fileRef  = useRef(null)

  const onDragEnd = () => {
    if (!draggingId || !dragOver.current || draggingId === dragOver.current) { setDraggingId(null); return }
    setImages(prev => {
      const arr = [...prev]
      const from = arr.findIndex(i => i.id === draggingId)
      const to   = arr.findIndex(i => i.id === dragOver.current)
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setDraggingId(null); dragOver.current = null
  }

  const addFile = f => {
    const bg = MOOD_BG[Math.floor(Math.random() * MOOD_BG.length)]
    setImages(p => [...p, { id:uid(), bg, h:180, caption:f.name.replace(/\.[^.]+$/, '') }])
  }

  const drop = e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) addFile(f) }

  return (
    <>
      <div onDragOver={e=>e.preventDefault()} onDrop={drop} style={{ columns:`${cols}`, gap:10 }}>
        {images.map(img => (
          <div key={img.id} draggable
            onDragStart={() => setDraggingId(img.id)}
            onDragEnter={() => { dragOver.current = img.id }}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => setPreview(img)}
            style={{ breakInside:'avoid', marginBottom:10, borderRadius:4, overflow:'hidden',
              border:'1px solid var(--border)', cursor:'pointer', position:'relative',
              opacity: draggingId===img.id ? 0.35 : 1, transition:'opacity 0.15s' }}>
            <div style={{ background:img.bg, height:img.h }}/>
            {img.caption && (
              <div style={{ padding:'7px 12px', background:'var(--surface)' }}>
                <p style={{ fontSize:11.5, color:'var(--ink-600)', lineHeight:1.4 }}>{img.caption}</p>
              </div>
            )}
            <button onClick={e => { e.stopPropagation(); setImages(p => p.filter(i => i.id !== img.id)) }}
              style={{ position:'absolute', top:7, right:7, width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,0.42)', color:'white', border:'none', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}>×</button>
          </div>
        ))}
        {/* Upload tile — always last */}
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--ink-300)' }}
          onDragLeave={e => e.currentTarget.style.borderColor='var(--border-med)'}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--border-med)'; drop(e) }}
          style={{ breakInside:'avoid', height:120, border:'1px dashed var(--border-med)', borderRadius:4,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:6, cursor:'pointer', transition:'border-color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink-300)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-med)'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--ink-300)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <p style={{ fontSize:12, color:'var(--ink-300)' }}>Drop or upload</p>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
            onChange={e => Array.from(e.target.files).forEach(addFile)}/>
        </div>
      </div>

      {/* Full-screen preview */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}
            onClick={() => setPreview(null)}
            style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.90)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ maxWidth:'82vw', width:'100%' }}>
              <div style={{ height:'62vh', background:preview.bg, borderRadius:6, marginBottom:14 }}/>
              {preview.caption && <p style={{ textAlign:'center', fontSize:14, color:'rgba(255,255,255,0.50)' }}>{preview.caption}</p>}
            </div>
            <button onClick={() => setPreview(null)} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', fontSize:28 }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   SectionTitle — inline-editable section header
   ───────────────────────────────────────────────────────── */
function SectionTitle({ value, onChange }) {
  return (
    <InlineEditor value={value} onChange={onChange} placeholder="Add title…"
      style={{ fontSize:18, fontWeight:600, letterSpacing:'-0.01em', color:'var(--ink-900)', lineHeight:1.3 }}/>
  )
}

/* ─────────────────────────────────────────────────────────
   ConceptBlock — the editorial brief replacement
   ───────────────────────────────────────────────────────── */
function ConceptBlock({ label, value, onChange, placeholder }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:'relative', marginBottom:28 }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:10 }}>{label}</p>
      <div style={{ borderLeft:'2px solid var(--border)', paddingLeft:18 }}>
        <InlineEditor value={value} onChange={onChange} multiline
          placeholder={placeholder}
          style={{ fontSize:15, lineHeight:1.80, color:'var(--ink-700)' }}/>
      </div>
      {hov && !value?.trim() && (
        <p style={{ position:'absolute', right:0, top:0, fontSize:11, color:'var(--ink-200)' }}>Click to edit</p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Vendor inline list
   ───────────────────────────────────────────────────────── */
function VendorList({ vendors, setVendors }) {
  const upd = (id, k, v) => setVendors(p => p.map(x => x.id===id ? {...x,[k]:v} : x))
  const del = id => setVendors(p => p.filter(x => x.id!==id))

  return (
    <div>
      {vendors.length === 0 ? (
        <div style={{ padding:'20px 0', display:'flex', alignItems:'center', gap:12 }}>
          <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>No vendors selected.</p>
          <button onClick={() => setVendors([{ id:uid(), role:'', name:'', contact:'' }])}
            style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'6px 14px',
              background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>
            + Add vendor
          </button>
        </div>
      ) : (
        <>
          {vendors.map(v => (
            <div key={v.id} style={{ display:'grid', gridTemplateColumns:'120px minmax(0,1fr) 140px 24px', gap:10,
              padding:'9px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <InlineEditor value={v.role}    onChange={val => upd(v.id,'role',val)}    placeholder="Role"    style={{ fontSize:12, color:'var(--ink-400)', fontWeight:500 }}/>
              <InlineEditor value={v.name}    onChange={val => upd(v.id,'name',val)}    placeholder="Vendor name" style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}/>
              <InlineEditor value={v.contact} onChange={val => upd(v.id,'contact',val)} placeholder="Contact" style={{ fontSize:12, color:'var(--ink-500)' }}/>
              <button onClick={() => del(v.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:16, lineHeight:1, padding:0 }}>×</button>
            </div>
          ))}
          <button onClick={() => setVendors(p => [...p, { id:uid(), role:'', name:'', contact:'' }])}
            style={{ marginTop:8, fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
            + Add vendor
          </button>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Menu ledger (food + drink)
   ───────────────────────────────────────────────────────── */
function MenuLedger({ items, setItems, courseOpts, isFood }) {
  const [adding, setAdding] = useState(false)
  const [nw, setNw]         = useState({ course:courseOpts[0], item:'', description:'', dietaryTags:[], status:'Draft' })

  const add = () => {
    if (!nw.item.trim()) return
    setItems(p => [...p, { ...nw, id:uid(), drinkMenu:!isFood }])
    setNw({ course:courseOpts[0], item:'', description:'', dietaryTags:[], status:'Draft' })
    setAdding(false)
  }

  const upd = (id, k, v) => setItems(p => p.map(x => x.id===id ? {...x,[k]:v} : x))
  const del = id => setItems(p => p.filter(x => x.id!==id))
  const toggleTag = (id, t) => upd(id, 'dietaryTags', items.find(x=>x.id===id).dietaryTags?.includes(t) ? items.find(x=>x.id===id).dietaryTags.filter(x=>x!==t) : [...(items.find(x=>x.id===id).dietaryTags||[]),t])

  const inp = { fontSize:13, height:32, padding:'0 8px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{items.length} {isFood?'dishes':'beverages'}</p>
        <button onClick={() => setAdding(true)} style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add {isFood?'dish':'beverage'}</button>
      </div>

      {adding && (
        <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Course</p>
              <select value={nw.course} onChange={e => setNw(p=>({...p,course:e.target.value}))} style={inp}>{courseOpts.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Status</p>
              <select value={nw.status} onChange={e => setNw(p=>({...p,status:e.target.value}))} style={inp}>{MENU_STATUS.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Name</p>
              <input autoFocus value={nw.item} onChange={e=>setNw(p=>({...p,item:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} style={inp} placeholder={isFood?'Dish name':'Beverage name'}/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Description</p>
              <input value={nw.description} onChange={e=>setNw(p=>({...p,description:e.target.value}))} style={inp} placeholder={isFood?'Ingredients, prep notes':'Producer, vintage, notes'}/>
            </div>
            {isFood && (
              <div style={{ gridColumn:'1/-1' }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Dietary tags</p>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {DIETARY_TAGS.map(t => (
                    <button key={t} onClick={()=>setNw(p=>({...p,dietaryTags:p.dietaryTags.includes(t)?p.dietaryTags.filter(x=>x!==t):[...p.dietaryTags,t]}))}
                      style={{ padding:'3px 9px', fontSize:11, fontWeight:600, borderRadius:3, border:'1px solid var(--border)', cursor:'pointer', fontFamily:'var(--font)',
                        background:nw.dietaryTags.includes(t)?'var(--ink-900)':'transparent', color:nw.dietaryTags.includes(t)?'white':'var(--ink-500)' }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={add} style={{ padding:'6px 16px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding:'6px 12px', fontSize:11, background:'transparent', color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        {items.map(item => (
          <div key={item.id} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'13px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)' }}>{item.course}</span>
                {item.dietaryTags?.map(t => (
                  <span key={t} style={{ fontSize:10, fontWeight:700, padding:'1px 5px', background:'var(--ground-dim)', color:'var(--ink-400)', borderRadius:2 }}>{t}</span>
                ))}
              </div>
              <p style={{ fontSize:14, fontWeight:500, color:'var(--ink-900)', marginBottom:2 }}>{item.item}</p>
              {item.description && <p style={{ fontSize:12, color:'var(--ink-500)', lineHeight:1.5 }}>{item.description}</p>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, paddingTop:2 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:sColor(item.status), background:sBg(item.status), padding:'2px 8px', borderRadius:2 }}>{item.status}</span>
              <button onClick={() => del(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18, lineHeight:1 }}>×</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p style={{ padding:'32px 0', textAlign:'center', fontSize:14, fontStyle:'italic', color:'var(--ink-200)', fontFamily:'var(--font-serif)' }}>No {isFood?'dishes':'beverages'} yet</p>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Dietary + Seating tables
   ───────────────────────────────────────────────────────── */
function DietaryTable({ items, onUpdateNote, onNavigate }) {
  const inp = { fontSize:13, height:32, padding:'0 8px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{items.length} restrictions · synced from Guest List</p>
        <button onClick={() => onNavigate && onNavigate('guest-list')}
          style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
          Manage in Guest List ↗
        </button>
      </div>
      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 130px minmax(0,1fr) 70px', gap:14, paddingBottom:9, borderBottom:'1px solid var(--border)' }}>
          {['Guest / seat','Restriction','Kitchen notes','Covered'].map((h,i)=><p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>)}
        </div>
        {items.map(d=>(
          <div key={d.id} style={{ display:'grid', gridTemplateColumns:'1fr 130px minmax(0,1fr) 70px', gap:14, padding:'11px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}>{d.name}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)' }}>{d.guest}</p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 8px', borderRadius:2, width:'fit-content' }}>{d.restriction}</span>
            <input value={d.notes} onChange={e=>onUpdateNote(d.id,'notes',e.target.value)} style={inp} placeholder="Severity, EpiPen, prep notes…"/>
            <button onClick={()=>onUpdateNote(d.id,'covered',!d.covered)}
              style={{ width:22, height:22, borderRadius:4, border:`1.5px solid ${d.covered?'var(--signal-green-dot)':'var(--border-med)'}`,
                background: d.covered ? 'var(--signal-green-dot)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              title={d.covered ? 'Marked covered' : 'Mark as covered'}>
              {d.covered && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
        ))}
        {items.length===0&&(
          <div style={{ padding:'28px 0', textAlign:'center' }}>
            <p style={{ fontSize:14, fontStyle:'italic', color:'var(--ink-200)', fontFamily:'var(--font-serif)', marginBottom:6 }}>No dietary restrictions logged</p>
            <p style={{ fontSize:11, color:'var(--ink-300)' }}>Add dietary needs to guests in the Guest List page</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Tablescape category system
   ───────────────────────────────────────────────────────── */
const INIT_TABLESCAPE_CATS = [
  { id:'tc1', name:'Glassware', items:[
    { id:'ti1', name:'Wine glass',        vendor:'Classic Party Rentals', qty:'120',  status:'Confirmed', notes:'Riedel Veritas'     },
    { id:'ti2', name:'Water goblet',      vendor:'Classic Party Rentals', qty:'120',  status:'Confirmed', notes:''                   },
    { id:'ti3', name:'Champagne flute',   vendor:'Classic Party Rentals', qty:'120',  status:'Proposed',  notes:'Arrival service'    },
  ]},
  { id:'tc2', name:'Dishware', items:[
    { id:'ti4', name:'Dinner plate',      vendor:'Classic Party Rentals', qty:'120',  status:'Confirmed', notes:'Matte white, custom rim' },
    { id:'ti5', name:'Salad plate',       vendor:'Classic Party Rentals', qty:'120',  status:'Draft',     notes:''                   },
    { id:'ti6', name:'Bread plate',       vendor:'Classic Party Rentals', qty:'120',  status:'Draft',     notes:''                   },
  ]},
  { id:'tc3', name:'Flatware', items:[
    { id:'ti7', name:'Dinner fork',       vendor:'Linen Lab NYC',         qty:'120',  status:'Confirmed', notes:'Matte gold hammered'},
    { id:'ti8', name:'Salad fork',        vendor:'Linen Lab NYC',         qty:'120',  status:'Confirmed', notes:''                   },
    { id:'ti9', name:'Steak knife',       vendor:'Linen Lab NYC',         qty:'120',  status:'Proposed',  notes:''                   },
  ]},
  { id:'tc4', name:'Linens', items:[
    { id:'ti10',name:'Tablecloth',        vendor:'Linen Lab NYC',         qty:'12',   status:'Confirmed', notes:'White 132" round'   },
    { id:'ti11',name:'Napkin',            vendor:'Linen Lab NYC',         qty:'120',  status:'Proposed',  notes:'Stone linen'        },
  ]},
  { id:'tc5', name:'Chargers',  items:[{ id:'ti12',name:'Charger plate', vendor:'Classic Party Rentals', qty:'120', status:'Confirmed', notes:'Antique brass, 13"' }]},
  { id:'tc6', name:'Candles',   items:[{ id:'ti13',name:'No candles',    vendor:'—', qty:'—', status:'Confirmed', notes:'Venue restriction' }]},
  { id:'tc7', name:'Centrepieces', items:[{ id:'ti14',name:'Low sculptural', vendor:'Aria Florals', qty:'12', status:'Proposed', notes:'Bleached wood + stone' }]},
]

function TablescapeCats({ cats, setCats }) {
  const updCat  = (id, k, v) => setCats(p => p.map(c => c.id===id ? {...c,[k]:v} : c))
  const delCat  = id => setCats(p => p.filter(c => c.id!==id))
  const addCat  = () => setCats(p => [...p, { id:uid(), name:'New category', items:[] }])
  const updItem = (catId, itemId, k, v) => setCats(p => p.map(c => c.id===catId ? {...c,items:c.items.map(i=>i.id===itemId?{...i,[k]:v}:i)} : c))
  const delItem = (catId, itemId) => setCats(p => p.map(c => c.id===catId ? {...c,items:c.items.filter(i=>i.id!==itemId)} : c))
  const addItem = catId => setCats(p => p.map(c => c.id===catId ? {...c,items:[...c.items,{id:uid(),name:'New item',vendor:'',qty:'',status:'Draft',notes:''}]} : c))

  return (
    <div>
      {cats.map(cat => (
        <div key={cat.id} style={{ marginBottom:24 }}>
          {/* Category header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <InlineEditor value={cat.name} onChange={v => updCat(cat.id,'name',v)}
                style={{ fontSize:13, fontWeight:700, color:'var(--ink-800)', letterSpacing:'0.01em' }}
                placeholder="Category name"/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => addItem(cat.id)} style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add item</button>
              <button onClick={() => delCat(cat.id)} style={{ fontSize:11, color:'var(--ink-200)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>Remove</button>
            </div>
          </div>

          {/* Item rows */}
          <div style={{ borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(120px,160px) 50px 90px minmax(0,1fr) 24px', gap:12, paddingBottom:7, borderBottom:'1px solid var(--border)' }}>
              {['Item','Vendor','Qty','Status','Notes',''].map((h,i)=>(
                <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
              ))}
            </div>
            {cat.items.map(item => (
              <div key={item.id} style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(120px,160px) 50px 90px minmax(0,1fr) 24px', gap:12, padding:'9px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                <InlineEditor value={item.name}   onChange={v=>updItem(cat.id,item.id,'name',v)}   style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }} placeholder="Item name"/>
                <InlineEditor value={item.vendor} onChange={v=>updItem(cat.id,item.id,'vendor',v)} style={{ fontSize:12, color:'var(--ink-500)' }} placeholder="Vendor"/>
                <InlineEditor value={item.qty}    onChange={v=>updItem(cat.id,item.id,'qty',v)}    style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--ink-600)' }} placeholder="—"/>
                <select value={item.status} onChange={e=>updItem(cat.id,item.id,'status',e.target.value)}
                  style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', color:sColor(item.status), outline:'none', padding:0, textTransform:'uppercase' }}>
                  {MENU_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
                <InlineEditor value={item.notes}  onChange={v=>updItem(cat.id,item.id,'notes',v)}  style={{ fontSize:12, color:'var(--ink-400)' }} placeholder="Notes"/>
                <button onClick={()=>delItem(cat.id,item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:16, lineHeight:1 }}>×</button>
              </div>
            ))}
            {cat.items.length===0 && (
              <button onClick={() => addItem(cat.id)} style={{ padding:'10px 0', fontSize:12, color:'var(--ink-300)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontStyle:'italic' }}>+ Add first item</button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addCat} style={{ fontSize:12, fontWeight:600, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add category</button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Floral arrangement list
   ───────────────────────────────────────────────────────── */
function FloralArrangements({ items, setItems }) {
  const upd = (id, k, v) => setItems(p => p.map(a => a.id===id ? {...a,[k]:v} : a))
  const del = id => setItems(p => p.filter(a => a.id!==id))
  const add = () => setItems(p => [...p, { id:uid(), label:'New arrangement', description:'', height:'', qty:1, status:'Draft' }])

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 55px 75px 90px 24px', gap:12, paddingBottom:9, borderBottom:'1.5px solid var(--ink-900)' }}>
        {['Arrangement','Qty','Height','Status',''].map((h,i)=><p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>)}
      </div>
      {items.map(a => (
        <div key={a.id} style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 55px 75px 90px 24px', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)', alignItems:'start' }}>
          <div>
            <InlineEditor value={a.label}       onChange={v=>upd(a.id,'label',v)}       style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:3 }} placeholder="Arrangement name"/>
            <InlineEditor value={a.description} onChange={v=>upd(a.id,'description',v)} style={{ fontSize:12, color:'var(--ink-500)', lineHeight:1.5 }} placeholder="Description"/>
          </div>
          <InlineEditor value={String(a.qty)}  onChange={v=>upd(a.id,'qty',v)}    style={{ fontSize:13, fontFamily:'var(--font-mono)', color:'var(--ink-600)' }} placeholder="1"/>
          <InlineEditor value={a.height}       onChange={v=>upd(a.id,'height',v)} style={{ fontSize:12, color:'var(--ink-600)' }} placeholder="Height"/>
          <select value={a.status} onChange={e=>upd(a.id,'status',e.target.value)}
            style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', color:sColor(a.status), outline:'none', padding:0, textTransform:'uppercase', marginTop:3 }}>
            {MENU_STATUS.map(s=><option key={s}>{s}</option>)}
          </select>
          <button onClick={()=>del(a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:16, lineHeight:1, marginTop:3 }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{ marginTop:10, fontSize:12, fontWeight:600, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add arrangement</button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Color palette
   ───────────────────────────────────────────────────────── */
function ColorPalette({ swatches }) {
  return (
    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
      {swatches.map(([hex,name]) => (
        <div key={hex} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{ width:52, height:52, borderRadius:6, background:hex, border:'1px solid rgba(0,0,0,0.06)', cursor:'pointer', transition:'transform 0.12s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.06)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
          <p style={{ fontSize:10, color:'var(--ink-400)', textAlign:'center' }}>{name}</p>
          <p style={{ fontSize:10, color:'var(--ink-200)', fontFamily:'var(--font-mono)' }}>{hex}</p>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Section divider with label
   ───────────────────────────────────────────────────────── */
function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0 22px' }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', whiteSpace:'nowrap' }}>{label}</p>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════
   TAB PAGES
   ═════════════════════════════════════════════════════════ */

/* ── OVERVIEW ─────────────────────────────────────────── */
function OverviewTab({ projectId }) {
  const [concept, setConcept] = useLocalState(`hosp_overview_concept_${projectId || 'default'}_v1`, ''
  )

  const [moodboard, setMoodboard] = useLocalState(`hosp_overview_moodboard_${projectId || 'default'}_v1`, [
    { id:'m1', bg:'linear-gradient(160deg,#2C2418 0%,#4A3C28 100%)', h:240, caption:'Candlelit tablescapes — warm amber tones' },
    { id:'m2', bg:'linear-gradient(140deg,#E8E0CC 0%,#F0E8D8 100%)', h:180, caption:'White linen, sculptural arrangements' },
    { id:'m3', bg:'linear-gradient(160deg,#1A2028 0%,#2C3440 100%)', h:200, caption:'Moody dinner setting — deep navy backdrop' },
    { id:'m4', bg:'linear-gradient(140deg,#D4C8A8 0%,#E8DEC8 100%)', h:160, caption:'Passed bites — architectural presentation' },
    { id:'m5', bg:'linear-gradient(160deg,#282820 0%,#403C30 100%)', h:260, caption:'Statement floral — oversized entrance installation' },
    { id:'m6', bg:'linear-gradient(140deg,#C8C0B0 0%,#E0D8C8 100%)', h:200, caption:'Guest experience — arrival moment' },
    { id:'m7', bg:'linear-gradient(160deg,#1C2018 0%,#303828 100%)', h:180, caption:'Intimate seating — garden feel indoors' },
    { id:'m8', bg:'linear-gradient(140deg,#E0D0B8 0%,#F0E4CC 100%)', h:160, caption:'Dessert course — refined plating' },
  ])

  return (
    <div>
      {/* Hospitality experience concept */}
      <ConceptBlock
        label="Hospitality experience"
        value={concept}
        onChange={setConcept}
        placeholder="Describe the overall guest experience — service philosophy, guest journey, tone, and experience goals…"
      />

      <Divider label="Moodboard · Vision &amp; Direction"/>
      <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:18 }}>Visual references for the overall event aesthetic. Drag to reorder.</p>
      <Moodboard images={moodboard} setImages={setMoodboard} cols="4 180px"/>
    </div>
  )
}

/* ── F&B ──────────────────────────────────────────────── */
function FBTab({ onNavigate, projectId }) {
  const { state } = useStore()
  const [concept, setConcept] = useLocalState(`hosp_fb_concept_${projectId || 'default'}_v1`, ''
  )
  const [food,    setFood]    = useLocalState(`hosp_food_${projectId || 'default'}_v1`, [
    { id:'f1', course:'Welcome canapés',  item:'Wagyu tartare on sesame crisp', description:'Wagyu, chive, sesame', dietaryTags:['GF','DF'], status:'Confirmed', drinkMenu:false },
    { id:'f2', course:'Welcome canapés',  item:'Burrata crostini', description:'Burrata, heirloom tomato, basil oil', dietaryTags:['V','GF'], status:'Confirmed', drinkMenu:false },
    { id:'f3', course:'First course',     item:'Compressed watermelon salad', description:'Feta, mint, aged balsamic', dietaryTags:['V','GF'], status:'Confirmed', drinkMenu:false },
    { id:'f4', course:'Main',             item:'45-day dry-aged prime tenderloin', description:'Truffle jus, pomme purée, asparagus', dietaryTags:['GF'], status:'Proposed', drinkMenu:false },
    { id:'f5', course:'Dessert',          item:'Chocolate sphere with warm ganache', description:'Valrhona, salted caramel', dietaryTags:[], status:'Draft', drinkMenu:false },
  ])
  const [drink,   setDrink]   = useLocalState(`hosp_drink_${projectId || 'default'}_v1`, [
    { id:'d1', course:'Welcome',     item:'Champagne', description:'Veuve Clicquot Brut NV', dietaryTags:['VG','GF'], status:'Confirmed', drinkMenu:true },
    { id:'d2', course:'Dinner pairing', item:'Red wine', description:'Burgundy, Pinot Noir', dietaryTags:['VG','GF'], status:'Proposed', drinkMenu:true },
    { id:'d3', course:'Dinner pairing', item:'White wine', description:'Sancerre, Sauvignon Blanc', dietaryTags:['VG','GF'], status:'Proposed', drinkMenu:true },
    { id:'d4', course:'All evening',  item:'Still water', description:'Evian', dietaryTags:['VG','GF'], status:'Confirmed', drinkMenu:true },
  ])
  // Dietary restrictions are derived live from the real Guest List —
  // any guest with a dietary need automatically appears here.
  // `covered` and F&B-specific prep notes are tracked locally per guest,
  // since that's a kitchen/service concern, not a guest-list concern.
  const [dietaryNotes, setDietaryNotes] = useLocalState(`hosp_dietary_notes_${projectId || 'default'}_v1`, {})
  const guestsWithDietary = (state.guestList || []).filter(g => g.dietary && g.dietary.trim() && g.dietary !== 'None')
  const dietary = guestsWithDietary.map(g => ({
    id: g.id,
    guest: g.table ? `Table ${g.table}${g.seat ? `, seat ${g.seat}` : ''}` : g.name,
    name: g.name,
    restriction: g.dietary,
    notes: dietaryNotes[g.id]?.notes ?? '',
    covered: dietaryNotes[g.id]?.covered ?? false,
  }))
  const updateDietaryNote = (id, key, value) =>
    setDietaryNotes(p => ({ ...p, [id]: { ...p[id], [key]: value } }))
  const [vendors, setVendors] = useLocalState(`hosp_fb_vendors_${projectId || 'default'}_v1`, [])
  const [subTab, setSubTab] = useState('food')

  const tagCoverage = {}
  food.forEach(m => m.dietaryTags?.forEach(t => { tagCoverage[t]=(tagCoverage[t]||0)+1 }))
  drink.forEach(m => m.dietaryTags?.forEach(t => { tagCoverage[t]=(tagCoverage[t]||0)+1 }))

  const SUB_TABS = [
    { id:'food',    label:`Food (${food.length})`     },
    { id:'drink',   label:`Beverage (${drink.length})`},
    { id:'dietary', label:`Dietary (${dietary.length})`},
  ]

  return (
    <div>
      <ConceptBlock label="F&amp;B concept" value={concept} onChange={setConcept}
        placeholder="Describe the culinary direction, service style, and guest dining experience…"/>

      {/* Vendors */}
      <Divider label="Vendors"/>
      <VendorList vendors={vendors} setVendors={setVendors}/>

      <Divider label="Menus &amp; service"/>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:22 }}>
        {SUB_TABS.map(t=>(
          <button key={t.id} onClick={()=>setSubTab(t.id)} style={{
            padding:'8px 18px 8px 0', marginRight:18, fontSize:13, fontWeight:500, fontFamily:'var(--font)',
            background:'none', border:'none', cursor:'pointer',
            color:subTab===t.id?'var(--ink-900)':'var(--ink-400)',
            borderBottom:subTab===t.id?'2px solid var(--ink-900)':'2px solid transparent',
            marginBottom:-1, transition:'color 0.1s',
          }}>{t.label}</button>
        ))}
      </div>

      {subTab==='food'    && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 200px', gap:32, alignItems:'start', maxWidth:'var(--cap-panel)' }}>
          <MenuLedger items={food} setItems={setFood} courseOpts={COURSE_OPTS} isFood/>
          <div style={{ position:'sticky', top:60 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Dietary coverage</p>
            {[['VG','Vegan'],['V','Vegetarian'],['GF','Gluten-free'],['DF','Dairy-free'],['N-free','Nut-free'],['Halal','Halal'],['Kosher','Kosher']].map(([tag,label])=>(
              <div key={tag} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:tagCoverage[tag]?'var(--signal-green-dot)':'var(--border-med)', flexShrink:0 }}/>
                <span style={{ fontSize:12, flex:1, color:'var(--ink-700)' }}>{label}</span>
                <span style={{ fontSize:10, fontWeight:600, color:tagCoverage[tag]?'var(--signal-green-text)':'var(--ink-300)' }}>{tagCoverage[tag]||'—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {subTab==='drink'   && <MenuLedger items={drink}   setItems={setDrink}   courseOpts={DRINK_OPTS} isFood={false}/>}
      {subTab==='dietary' && <DietaryTable items={dietary} onUpdateNote={updateDietaryNote} onNavigate={onNavigate}/>}
    </div>
  )
}

/* ── TABLESCAPE ───────────────────────────────────────── */
function TablescapeTab({ projectId }) {
  const [concept, setConcept] = useLocalState(`hosp_tablescape_concept_${projectId || 'default'}_v1`, ''
  )
  const [cats, setCats]           = useLocalState(`hosp_tablescape_cats_${projectId || 'default'}_v1`, [])
  const [moodboard, setMoodboard] = useLocalState(`hosp_tablescape_moodboard_${projectId || 'default'}_v1`, [
    { id:'t1', bg:'linear-gradient(160deg,#E8E0CC 0%,#F4EED8 100%)', h:200, caption:'White linen + stone accents' },
    { id:'t2', bg:'linear-gradient(140deg,#C8C0A8 0%,#DDD4BC 100%)', h:160, caption:'Sculptural low centrepieces' },
    { id:'t3', bg:'linear-gradient(160deg,#1A1814 0%,#2E2820 100%)', h:180, caption:'Matte ceramic + natural fibre' },
    { id:'t4', bg:'linear-gradient(140deg,#D8D0BC 0%,#EDE4D0 100%)', h:200, caption:'Antique brass chargers' },
  ])

  return (
    <div>
      <ConceptBlock label="Tablescape concept" value={concept} onChange={setConcept}
        placeholder="Describe the overall table design direction — style, materials, mood, references…"/>

      <Divider label="Table items"/>
      <TablescapeCats cats={cats} setCats={setCats}/>

      <Divider label="Moodboard"/>
      <Moodboard images={moodboard} setImages={setMoodboard} cols="4 160px"/>
    </div>
  )
}

/* ── FLORALS ──────────────────────────────────────────── */
function FloralsTab({ projectId }) {
  const [concept, setConcept] = useLocalState(`hosp_florals_concept_${projectId || 'default'}_v1`, ''
  )
  const [arrangements, setArrangements] = useLocalState(`hosp_florals_arrangements_${projectId || 'default'}_v1`, [
    { id:'fl1', label:'Entrance installation', description:'Oversized arch — white florals + cascading greenery', height:'8 ft', qty:'1', status:'Confirmed' },
    { id:'fl2', label:'Table centrepieces',     description:'Low sculptural — blush roses + eucalyptus + bleached wood', height:'18"', qty:'12', status:'Proposed' },
    { id:'fl3', label:'Bar arrangements',        description:'Two statement vases — white hydrangea + foliage', height:'36"', qty:'2', status:'Draft' },
    { id:'fl4', label:'Cocktail tables',         description:'Small bud vases — seasonal flowers', height:'8"', qty:'10', status:'Draft' },
  ])
  const [moodboard, setMoodboard] = useLocalState(`hosp_florals_moodboard_${projectId || 'default'}_v1`, [
    { id:'fl1', bg:'linear-gradient(160deg,#E8D8C8 0%,#F4EAD8 100%)', h:220, caption:'Oversized entrance installation' },
    { id:'fl2', bg:'linear-gradient(140deg,#C8D8C0 0%,#DDE8D4 100%)', h:180, caption:'Garden-romantic centrepieces' },
    { id:'fl3', bg:'linear-gradient(160deg,#F4E0D0 0%,#FFF0E4 100%)', h:200, caption:'Blush + ivory palette' },
    { id:'fl4', bg:'linear-gradient(140deg,#D0E0C8 0%,#E8F0E0 100%)', h:160, caption:'Seasonal greenery' },
  ])
  const [vendors, setVendors] = useLocalState(`hosp_florals_vendors_${projectId || 'default'}_v1`, [
    { id:'fv1', role:'Florist', name:'Aria Florals', contact:'Cleo Stein' },
  ])

  return (
    <div>
      <ConceptBlock label="Floral concept" value={concept} onChange={setConcept}
        placeholder="Describe the floral direction — style, palette, references, restrictions…"/>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 240px', gap:32, marginBottom:0, alignItems:'start', maxWidth:'var(--cap-panel)' }}>
        <div>
          <Divider label="Arrangements"/>
          <FloralArrangements items={arrangements} setItems={setArrangements}/>
        </div>

        <div>
          <Divider label="Florist &amp; palette"/>
          <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:16 }}>
            <VendorList vendors={vendors} setVendors={setVendors}/>
          </div>

          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:12 }}>Color palette</p>
          <ColorPalette swatches={[['#F5F0E8','Ivory'],['#E8D0C0','Blush'],['#D4C8A8','Warm sand'],['#8AA080','Sage'],['#C4B098','Linen'],['#E0D8CC','Parchment']]}/>

          <Divider label="Details"/>
          {[['Contract','Signed'],['Budget','$18,500'],['Deposit','50% paid'],['Install','Jul 15, 2026'],['Strike','Jul 17']].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>{l}</p>
              <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <Divider label="Moodboard"/>
      <Moodboard images={moodboard} setImages={setMoodboard} cols="4 160px"/>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════
   Main Hospitality page
   ═════════════════════════════════════════════════════════ */
export default function Hospitality({ onNavigate, currentUser, projectId, isViewOnly, production }) {
  const { state }  = useStore()
  const [tab, setTab] = useState('overview')
  // Caterer for the header — from the project's F&B vendors (same key the F&B tab edits)
  const [fbVendors] = useLocalState(`hosp_fb_vendors_${projectId || 'default'}_v1`, [])

  const TABS = [
    { id:'overview',   label:'Overview'   },
    { id:'fb',         label:'F&B'        },
    { id:'tablescape', label:'Tablescape' },
    { id:'florals',    label:'Florals'    },
  ]

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Guest Experience · Hospitality</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:10, color:'var(--ink-900)' }}>
            Hospitality
          </h1>
          <PageOwner area="Hospitality" projectId={projectId}/>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>
            {(fbVendors.find(v => v.role === 'Caterer')?.name) || 'Caterer TBC'} &nbsp;·&nbsp; {state.production.guestCount} guests &nbsp;·&nbsp; {state.production.eventDate}
          </p>
        </div>

        {/* Primary tabs */}
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--ink-900)', marginBottom:32 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'10px 0', marginRight:28, fontSize:14, fontWeight:500, fontFamily:'var(--font)',
              background:'none', border:'none', cursor:'pointer',
              color: tab===t.id ? 'var(--ink-900)' : 'var(--ink-400)',
              borderBottom: tab===t.id ? '2px solid var(--ink-900)' : '2px solid transparent',
              marginBottom: -1.5, transition:'color 0.1s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.15 }}>
            {tab==='overview'   && <OverviewTab projectId={projectId}/>}
            {tab==='fb'         && <FBTab onNavigate={onNavigate} projectId={projectId}/>}
            {tab==='tablescape' && <TablescapeTab projectId={projectId}/>}
            {tab==='florals'    && <FloralsTab projectId={projectId}/>}
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
