import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VENUES } from './libraryData.js'
import LibraryPage from './LibraryPage.jsx'
import { saveToShortlist, removeFromShortlist, isShortlisted } from '../workspace/pages/Shortlist.jsx'

const safe = v => (v && typeof v !== 'undefined') ? String(v).trim() : ''

/* ─── Shared primitives (match Logistics.jsx exactly) ───── */
const inp = () => ({
  width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)',
  borderRadius:3, fontFamily:'var(--font)', background:'var(--ground-dim)',
  color:'var(--ink-900)', outline:'none',
})

function SLabel({ children }) {
  return <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>{children}</p>
}

function SectionHead({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
      color:'var(--ink-300)', paddingBottom:10, marginBottom:16,
      borderBottom:'1px solid var(--border)', marginTop:0 }}>
      {children}
    </p>
  )
}

function SpecCard({ title, children }) {
  return (
    <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)',
      borderRadius:4, padding:'14px 16px' }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:12 }}>{title}</p>
      {children}
    </div>
  )
}

function InlineKV({ label, value }) {
  if (!safe(value)) return null
  return (
    <div style={{ marginBottom:8 }}>
      <p style={{ fontSize:10, color:'var(--ink-400)', marginBottom:2 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', lineHeight:1.3 }}>{value}</p>
    </div>
  )
}

/* ─── Heart button ───────────────────────────────────────── */
function HeartBtn({ item }) {
  const [saved, setSaved] = useState(() => isShortlisted('venues', item.id))
  const toggle = e => {
    e.stopPropagation()
    if (saved) { removeFromShortlist('venues', item.id); setSaved(false) }
    else        { saveToShortlist('venues', item);        setSaved(true)  }
  }
  return (
    <button onClick={toggle} title={saved ? 'Remove from Shortlist' : 'Save to Shortlist'}
      style={{ background:'none', border:'none', cursor:'pointer', padding:6, flexShrink:0,
        color: saved ? '#C9914A' : 'var(--ink-300)', transition:'color 0.15s', lineHeight:1 }}>
      <svg width="18" height="18" viewBox="0 0 16 16"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 14S1 9.5 1 5.5a3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1 7 0C15 9.5 8 14 8 14z"/>
      </svg>
    </button>
  )
}

/* ─── Tab content components ─────────────────────────────── */
function VenueTab({ v }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:32 }}>
      {/* Left */}
      <div>
        <SectionHead>Basic information</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[
            ['Venue name',     v.name,          '1/-1'],
            ['Address',        v.location,      '1/-1'],
            ['Website',        v.website,       '1/-1'],
            ['Floor / Space',  v.floor || v.type, 'auto'],
            ['Building hours', v.buildingHours, 'auto'],
          ].map(([l, val, col]) => safe(val) ? (
            <div key={l} style={{ gridColumn: col }}>
              <SLabel>{l}</SLabel>
              <div style={{ ...inp(), background:'var(--ground-dim)', color:'var(--ink-800)',
                minHeight:34, display:'flex', alignItems:'center' }}>{val}</div>
            </div>
          ) : null)}
        </div>

        <SectionHead>Space details</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[
            ['Indoor / Outdoor', v.indoorOutdoor],
            ['Venue type',       v.type],
            ['Capacity',         v.capacity ? `${v.capacity.toLocaleString()} guests` : null],
            ['Square footage',   v.sqft     ? `${v.sqft.toLocaleString()} sq ft`      : null],
            ['Ceiling height',   v.ceilingHeight],
          ].map(([l, val]) => val ? (
            <div key={l}>
              <SLabel>{l}</SLabel>
              <div style={{ ...inp(), color:'var(--ink-800)', minHeight:34, display:'flex', alignItems:'center' }}>{val}</div>
            </div>
          ) : null)}
        </div>

        <SectionHead>Power &amp; internet</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Available power',    v.power],
            ['Dedicated circuits', v.dedicatedCircuits],
            ['Floor boxes',        v.floorBoxes],
            ['WiFi',               v.wifi],
            ['Hardline internet',  v.hardline],
          ].map(([l, val]) => val ? (
            <div key={l}>
              <SLabel>{l}</SLabel>
              <div style={{ ...inp(), color:'var(--ink-800)', minHeight:34, display:'flex', alignItems:'center' }}>{val}</div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Right */}
      <div>
        <SectionHead>Loading dock</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[
            ['Dock address',          v.dockAddress, '1/-1'],
            ['Dock hours',            v.dockHours,   'auto'],
            ['Reservation required',  v.dockReservation, 'auto'],
            ['Dock contact',          v.dockContact, '1/-1'],
          ].map(([l, val, col='auto']) => val ? (
            <div key={l} style={{ gridColumn:col }}>
              <SLabel>{l}</SLabel>
              <div style={{ ...inp(), color:'var(--ink-800)', minHeight:34, display:'flex', alignItems:'center' }}>{val}</div>
            </div>
          ) : null)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <SpecCard title="Passenger elevators">
            <InlineKV label="Quantity"             value={v.passengerElevQty}/>
            <InlineKV label="Interior dimensions"  value={v.passengerElevDims}/>
            <InlineKV label="Door width"           value={v.passengerElevDoorWidth}/>
            <InlineKV label="Weight capacity"      value={v.passengerElevWeight}/>
          </SpecCard>
          <SpecCard title="Freight elevators">
            <InlineKV label="Quantity"             value={v.freightElevQty}/>
            <InlineKV label="Interior dimensions"  value={v.freightElevDims}/>
            <InlineKV label="Door width"           value={v.freightElevDoorWidth}/>
            <InlineKV label="Weight capacity"      value={v.freightElevWeight}/>
          </SpecCard>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <SpecCard title="Max crate / pallet size">
            <InlineKV label="Max crate"  value={v.maxCrateSize}/>
            <InlineKV label="Max pallet" value={v.maxPalletSize}/>
          </SpecCard>
          <SpecCard title="Parking">
            <InlineKV label="Vendor parking" value={v.vendorParking}/>
            <InlineKV label="Guest parking"  value={v.guestParking}/>
          </SpecCard>
        </div>
      </div>
    </div>
  )
}

function BuildingRulesTab({ v }) {
  const rules = [
    ['Open flame',         v.openFlame],
    ['Music / noise',      v.noiseRestrictions],
    ['Curfew',             v.curfew],
    ['Alcohol',            v.alcoholRestriction],
    ['Photography',        v.photography],
    ['Overnight storage',  v.overnightStorage],
    ['Union requirements', v.unionReqs],
    ['Other rules',        v.buildingRules],
    ['COI required',       v.coiRequired ? 'Yes' : null],
    ['Security procedure', v.securityProcedure],
    ['Vendor check-in',    v.vendorCheckIn],
    ['Trash removal',      v.trashRemoval],
  ].filter(([, val]) => safe(val))

  return (
    <div style={{ maxWidth:680 }}>
      <SectionHead>Building rules &amp; restrictions</SectionHead>
      {rules.length === 0 ? (
        <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>No rules entered yet.</p>
      ) : rules.map(([l, val]) => (
        <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          padding:'10px 0', borderBottom:'1px solid var(--border)', gap:24 }}>
          <p style={{ fontSize:12, color:'var(--ink-400)', flexShrink:0, minWidth:180 }}>{l}</p>
          <p style={{ fontSize:13, color:'var(--ink-800)', textAlign:'right', lineHeight:1.5 }}>{val}</p>
        </div>
      ))}
      {!rules.length && (
        <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>No building rules entered for this venue.</p>
      )}
    </div>
  )
}

function ContactsTab({ v }) {
  return (
    <div style={{ maxWidth:600 }}>
      <SectionHead>Contacts</SectionHead>
      {v.contact ? (
        <div style={{ padding:'16px', background:'var(--ground-dim)',
          border:'1px solid var(--border)', borderRadius:4, marginBottom:10 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:3 }}>{v.contact}</p>
          {safe(v.contactTitle) && <p style={{ fontSize:12, color:'var(--ink-500)', marginBottom:10 }}>{v.contactTitle}</p>}
          {[['Phone', v.contactPhone],['Email', v.contactEmail]].map(([l, val]) => val ? (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'7px 0', borderTop:'1px solid var(--border)' }}>
              <p style={{ fontSize:11, color:'var(--ink-400)' }}>{l}</p>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-800)' }}>{val}</p>
            </div>
          ) : null)}
        </div>
      ) : (
        <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>No contacts added.</p>
      )}
    </div>
  )
}

/* ─── Generic drag-and-drop upload zone ─────────────────── */
function UploadZone({ accept, onFiles, label, hint }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = files => {
    if (!files || files.length === 0) return
    onFiles(Array.from(files))
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      style={{ padding:'32px', background: dragOver ? 'var(--signal-blue-bg)' : 'var(--ground-dim)',
        borderRadius:4, border:`1.5px dashed ${dragOver ? 'var(--signal-blue-text)' : 'var(--border-med)'}`,
        textAlign:'center', cursor:'pointer', transition:'all 0.15s' }}>
      <input ref={inputRef} type="file" multiple accept={accept} style={{ display:'none' }}
        onChange={e => handleFiles(e.target.files)}/>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ margin:'0 auto 10px' }}>
        <path d="M14 4v14M14 4l-5 5M14 4l5 5" stroke={dragOver?'var(--signal-blue-text)':'var(--ink-300)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 20v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke={dragOver?'var(--signal-blue-text)':'var(--ink-300)'} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <p style={{ fontSize:13, fontWeight:600, color: dragOver ? 'var(--signal-blue-text)' : 'var(--ink-600)', marginBottom:4 }}>
        {dragOver ? 'Drop to upload' : label}
      </p>
      <p style={{ fontSize:11, color:'var(--ink-300)' }}>{hint}</p>
    </div>
  )
}

function PhotosTab() {
  const [photos, setPhotos] = useState([])

  const addFiles = files => {
    const imgs = files.filter(f => f.type.startsWith('image/'))
    const withUrls = imgs.map(f => ({ id: Math.random().toString(36).slice(2,9), name:f.name, url:URL.createObjectURL(f) }))
    setPhotos(prev => [...prev, ...withUrls])
  }
  const remove = id => setPhotos(prev => prev.filter(p => p.id !== id))

  return (
    <div>
      <SectionHead>Photos</SectionHead>
      <UploadZone accept="image/*" onFiles={addFiles}
        label="Click to upload or drag photos here" hint="PNG, JPG up to 10MB each"/>

      {photos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:16 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position:'relative', borderRadius:4, overflow:'hidden',
              border:'1px solid var(--border)', aspectRatio:'1' }}>
              <img src={p.url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <button onClick={() => remove(p.id)}
                style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%',
                  background:'rgba(0,0,0,0.6)', color:'white', border:'none', cursor:'pointer',
                  fontSize:12, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilesTab() {
  const [files, setFiles] = useState([])

  const addFiles = newFiles => {
    const withMeta = newFiles.map(f => ({
      id: Math.random().toString(36).slice(2,9), name:f.name,
      size: f.size < 1024*1024 ? `${Math.round(f.size/1024)} KB` : `${(f.size/1024/1024).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' }),
    }))
    setFiles(prev => [...prev, ...withMeta])
  }
  const remove = id => setFiles(prev => prev.filter(f => f.id !== id))

  return (
    <div>
      <SectionHead>Files</SectionHead>
      <UploadZone accept="*" onFiles={addFiles}
        label="Click to upload or drag files here" hint="Contracts, COIs, floor plans, power plans — any file type"/>

      {files.length > 0 && (
        <div style={{ marginTop:16 }}>
          {files.map(f => (
            <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0',
              borderBottom:'1px solid var(--border)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
                <path d="M4 1.5h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2.5a1 1 0 011-1z" stroke="var(--ink-300)" strokeWidth="1.2"/>
                <path d="M10 1.5v3h3" stroke="var(--ink-300)" strokeWidth="1.2"/>
              </svg>
              <p style={{ flex:1, fontSize:13, fontWeight:500, color:'var(--ink-800)' }}>{f.name}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)', flexShrink:0 }}>{f.date} · {f.size}</p>
              <button onClick={() => remove(f.id)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
                  fontSize:14, lineHeight:1, flexShrink:0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Full venue profile — tabbed, matches project Venue page
   ─────────────────────────────────────────────────────── */
function VenueProfile({ v, onBack }) {
  const [tab, setTab] = useState('venue')

  const TABS = [
    { id:'venue',           label:'Venue'          },
    { id:'building-rules',  label:'Building Rules' },
    { id:'contacts',        label:'Contacts'       },
    { id:'photos',          label:'Photos'         },
    { id:'files',           label:'Files'          },
  ]

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.18 }}>

        {/* Back */}
        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
            cursor:'pointer', color:'var(--ink-400)', fontSize:12, fontFamily:'var(--font)',
            marginBottom:20, padding:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Venue Library
        </button>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:8 }}>Field · Directory</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
              letterSpacing:'-0.04em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:6 }}>
              {v.name}
            </h1>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>
              {[v.type, v.city, v.capacity ? `${v.capacity.toLocaleString()} guests` : null].filter(safe).join(' · ')}
            </p>
          </div>
          <HeartBtn item={v}/>
        </div>

        {/* Tabs — identical style to Logistics.jsx */}
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--ink-900)', marginBottom:24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'10px 0', marginRight:24, fontSize:13, fontWeight:500, fontFamily:'var(--font)',
              background:'none', border:'none', cursor:'pointer',
              color: tab===t.id ? 'var(--ink-900)' : 'var(--ink-400)',
              borderBottom: tab===t.id ? '2px solid var(--ink-900)' : '2px solid transparent',
              marginBottom:-1.5, transition:'color 0.1s', whiteSpace:'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.15 }}>
            {tab==='venue'          && <VenueTab v={v}/>}
            {tab==='building-rules' && <BuildingRulesTab v={v}/>}
            {tab==='contacts'       && <ContactsTab v={v}/>}
            {tab==='photos'         && <PhotosTab/>}
            {tab==='files'          && <FilesTab/>}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ─── Venue list row ─────────────────────────────────────── */
function VenueRow({ v, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 0',
        borderBottom:'1px solid var(--border)',
        background:hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s' }}>
      <div onClick={onClick} style={{ flex:1, display:'grid', cursor:'pointer',
        gridTemplateColumns:'minmax(180px,1fr) 110px 110px 80px 100px',
        gap:14, alignItems:'center' }}>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)',
            letterSpacing:'-0.01em', marginBottom:1 }}>{v.name}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{v.city}</p>
        </div>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{v.type}</p>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{v.indoorOutdoor}</p>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>
          {v.capacity ? v.capacity.toLocaleString() : '—'}
        </p>
        <div>
          {v.preferred && (
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
              color:'var(--signal-green-text)', background:'var(--signal-green-bg)',
              padding:'2px 8px', borderRadius:2 }}>Preferred</span>
          )}
        </div>
      </div>
      <HeartBtn item={v}/>
      <div onClick={onClick} style={{ cursor:'pointer', opacity:hov?1:0.2, transition:'opacity 0.1s' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Venue Library page
   ─────────────────────────────────────────────────────── */
export default function VenueLibrary() {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = VENUES.filter(v =>
    !query.trim() ||
    (v.name||'').toLowerCase().includes(query.toLowerCase()) ||
    (v.city||'').toLowerCase().includes(query.toLowerCase()) ||
    (v.type||'').toLowerCase().includes(query.toLowerCase())
  )

  if (selected) {
    return <VenueProfile v={selected} onBack={() => setSelected(null)}/>
  }

  return (
    <LibraryPage
      eyebrow="Field · Directory"
      title="Venues"
      subtitle={`${VENUES.length} venues`}>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
        <div style={{ width:280, display:'flex', alignItems:'center', gap:8,
          padding:'0 12px', background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:4, height:34 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
            <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search venues…"
            style={{ flex:1, border:'none', outline:'none', fontSize:13,
              color:'var(--ink-800)', background:'transparent', fontFamily:'var(--font)' }}/>
          {query && <button onClick={() => setQuery('')}
            style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:14 }}>×</button>}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:10,
        borderBottom:'1.5px solid var(--ink-900)' }}>
        <div style={{ flex:1, display:'grid',
          gridTemplateColumns:'minmax(180px,1fr) 110px 110px 80px 100px', gap:14 }}>
          {['Venue','Type','In/Out','Capacity',''].map((h,i) => (
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em',
              textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>
        <div style={{ width:30 }}/>
        <div style={{ width:12 }}/>
      </div>

      {filtered.map(v => <VenueRow key={v.id} v={v} onClick={() => setSelected(v)}/>)}

      {filtered.length === 0 && (
        <div style={{ padding:'60px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:17, fontStyle:'italic', color:'var(--ink-200)' }}>
            No venues match your search.
          </p>
        </div>
      )}

      <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:18 }}>
        Click any row to view full venue profile · ♡ to save to Shortlist
      </p>
    </LibraryPage>
  )
}
