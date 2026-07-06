import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusModal from '../../components/FocusModal.jsx'
import PageOwner from '../../components/PageOwner.jsx'
import { useLocalState } from '../../useLocalState.js'
import { VENDORS as DIRECTORY_VENDORS, ALL_CATEGORIES as DIRECTORY_CATS } from '../../company/vendorData.js'

/* ─── Constants ──────────────────────────────────────────── */
const CATEGORIES = ['All','AV / Interactive','Fabrication','Hospitality / F&B','Content Capture','Venue','Logistics','Florals','Rentals','Print']
const CONTRACT_STATUSES = ['Unsigned','Sent','Signed','Expired']
const VENDOR_STATUSES   = ['Quoted','Selected','Contracting','Confirmed','On hold','Cancelled']
const toNum = v => Number(v) || 0
const fmtUSD = n => n ? '$' + toNum(n).toLocaleString() : '—'
const uid = () => `v${Math.random().toString(36).slice(2,8)}`

/* ─── Seed data ──────────────────────────────────────────── */
const SEED_VENDORS = [
  { id:'v1', name:'Ocubo Digital',       domain:'ocubodigital.com',    cat:'AV / Interactive',
    owner:'Sara Mendes',  ownerRole:'Producer',            ownerInitials:'SM',
    budget:82000, contractValue:82000, contractStatus:'Signed', contractDate:'Jul 1, 2026', status:'Confirmed',
    depositPct:50, paymentTerms:'50/50 split', insuranceRequired:true, coiStatus:'Received',
    contact:'Sara Mendes', contactRole:'Producer', contactPhone:'(646) 555-0200', contactEmail:'sara@ocubo.com',
    notes:'LED wall + interactive touchpoints confirmed.',
    contacts:[{id:'c1',name:'Sara Mendes',role:'Producer',phone:'(646) 555-0200',email:'sara@ocubo.com',notes:''}],
    files:[{id:'f1',name:'Contract_Ocubo_Signed.pdf',type:'contract',date:'Jul 1'},{id:'f2',name:'COI_Ocubo.pdf',type:'coi',date:'Jun 28'}] },
  { id:'v2', name:'Eventmakers NYC',     domain:'eventmakersnyc.com',  cat:'Fabrication',
    owner:'Tom Ricci',    ownerRole:'Production Manager',  ownerInitials:'TR',
    budget:145000, contractValue:145000, contractStatus:'Signed', contractDate:'Jul 3, 2026', status:'Confirmed',
    depositPct:50, paymentTerms:'50/50 split', insuranceRequired:true, coiStatus:'Received',
    contact:'Tom Ricci', contactRole:'Production Manager', contactPhone:'(212) 555-0210', contactEmail:'tom@eventmakers.com',
    notes:'Custom scenic build. Shop drawings approved Jun 27.',
    contacts:[{id:'c1',name:'Tom Ricci',role:'Production Manager',phone:'(212) 555-0210',email:'tom@eventmakers.com',notes:''}],
    files:[{id:'f1',name:'Contract_Eventmakers_Signed.pdf',type:'contract',date:'Jul 3'}] },
  { id:'v3', name:'Glasshouse Catering', domain:'glasshouse.nyc',       cat:'Hospitality / F&B',
    owner:'Nina Park',    ownerRole:'Hospitality Director',ownerInitials:'NP',
    budget:94000, contractValue:94000, contractStatus:'Signed', contractDate:'Jul 5, 2026', status:'Confirmed',
    depositPct:50, paymentTerms:'50/50 split', insuranceRequired:true, coiStatus:'Received',
    contact:'Nina Park', contactRole:'Hospitality Director', contactPhone:'(917) 555-0220', contactEmail:'nina@glasshouse.nyc',
    notes:'120 guests, prix fixe menu finalized.',
    contacts:[{id:'c1',name:'Nina Park',role:'Hospitality Director',phone:'(917) 555-0220',email:'nina@glasshouse.nyc',notes:''}],
    files:[] },
  { id:'v4', name:'Content Studio',   domain:'contentco.com', cat:'Content Capture',
    owner:'Content Contact',ownerRole:'Creative Director',   ownerInitials:'DC',
    budget:28000, contractValue:28000, contractStatus:'Signed', contractDate:'Jul 6, 2026', status:'Confirmed',
    depositPct:50, paymentTerms:'Net 30', insuranceRequired:false, coiStatus:'N/A',
    contact:'Content Contact', contactRole:'Creative Director', contactPhone:'(646) 555-0230', contactEmail:'studio@contentco.com',
    notes:'Photo + video. Deliverables: 500 selects + 3-min recap.',
    contacts:[{id:'c1',name:'Content Contact',role:'Creative Director',phone:'(646) 555-0230',email:'studio@contentco.com',notes:''}],
    files:[] },
  { id:'v5', name:'Brooklyn Tower',      domain:'brooklyntower.com',    cat:'Venue',
    owner:'James Holter', ownerRole:'Venue Director',      ownerInitials:'JH',
    budget:55000, contractValue:55000, contractStatus:'Signed', contractDate:'Jun 29, 2026', status:'Confirmed',
    depositPct:50, paymentTerms:'50/50 split', insuranceRequired:true, coiStatus:'Received',
    contact:'James Holter', contactRole:'Venue Director', contactPhone:'(212) 555-0189', contactEmail:'james@brooklyntower.com',
    notes:'73F Sky Lounge buy-out. 200A 3-phase power confirmed.',
    contacts:[{id:'c1',name:'James Holter',role:'Venue Director',phone:'(212) 555-0189',email:'james@brooklyntower.com',notes:'Primary contact'}],
    files:[{id:'f1',name:'Venue_Contract_BT.pdf',type:'contract',date:'Jun 29'},{id:'f2',name:'COI_BrooklynTower.pdf',type:'coi',date:'Jun 28'}] },
  { id:'v6', name:'Peak Freight',        domain:'peakfreight.com',      cat:'Logistics',
    owner:'Maria Fuentes',ownerRole:'Logistics Lead',      ownerInitials:'MF',
    budget:12000, contractValue:0, contractStatus:'Unsigned', contractDate:'', status:'Quoted',
    depositPct:0, paymentTerms:'Net 30', insuranceRequired:true, coiStatus:'Pending',
    contact:'Maria Fuentes', contactRole:'Logistics Lead', contactPhone:'(718) 555-0240', contactEmail:'maria@peakfreight.com',
    notes:'Quote received Jun 28. Decision pending.',
    contacts:[{id:'c1',name:'Maria Fuentes',role:'Logistics Lead',phone:'(718) 555-0240',email:'maria@peakfreight.com',notes:''}],
    files:[{id:'f1',name:'Quote_PeakFreight.pdf',type:'quote',date:'Jun 28'}] },
  { id:'v7', name:'Aria Florals',        domain:'ariaflorals.com',      cat:'Florals',
    owner:'Cleo Stein',   ownerRole:'Floral Lead',         ownerInitials:'CS',
    budget:18500, contractValue:0, contractStatus:'Unsigned', contractDate:'', status:'Quoted',
    depositPct:0, paymentTerms:'Net 30', insuranceRequired:false, coiStatus:'N/A',
    contact:'Cleo Stein', contactRole:'Floral Lead', contactPhone:'(917) 555-0250', contactEmail:'cleo@ariaflorals.com',
    notes:'Proposal under review.',
    contacts:[{id:'c1',name:'Cleo Stein',role:'Floral Lead',phone:'(917) 555-0250',email:'cleo@ariaflorals.com',notes:''}],
    files:[] },
]

/* ─── Status helpers ─────────────────────────────────────── */
function statusStyle(s) {
  if (s==='Confirmed')   return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)'  }
  if (s==='Contracting') return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'   }
  if (s==='Selected')    return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'   }
  if (s==='Quoted')      return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)'  }
  if (s==='On hold')     return { color:'var(--ink-400)',           bg:'var(--ground-dim)'        }
  if (s==='Cancelled')   return { color:'var(--signal-red-text)',   bg:'var(--signal-red-bg)'    }
  return                          { color:'var(--ink-300)',           bg:'var(--ground-dim)'       }
}

function contractStyle(s) {
  if (s==='Signed')   return { color:'var(--signal-green-text)', icon:'✓' }
  if (s==='Sent')     return { color:'var(--signal-amber-text)', icon:'→' }
  return                      { color:'var(--ink-300)',           icon:'○' }
}

/* ─── Primitives ─────────────────────────────────────────── */
function Av({ initials, size=28 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size<30?9:11, fontWeight:700, color:'rgba(255,255,255,0.62)', fontFamily:'var(--font)' }}>
      {initials||'?'}
    </div>
  )
}

function VendorLogo({ name, size=36 }) {
  const colors = ['#1A1916','#2A2420','#1A2030','#20281A','#28201A']
  return (
    <div style={{ width:size, height:size, borderRadius:6, background:colors[name.charCodeAt(0)%colors.length], flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.35, fontWeight:700, color:'rgba(255,255,255,0.55)', fontFamily:'var(--font)' }}>
      {name.slice(0,2).toUpperCase()}
    </div>
  )
}

/* ─── Inline editable cell ───────────────────────────────── */
function EditCell({ value, onChange, placeholder, select, options, mono, dim }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  const commit = () => { setEditing(false); if (draft !== value) onChange(draft) }

  if (editing && select) {
    return (
      <select value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} autoFocus
        style={{ fontSize:13, border:'none', outline:'none', background:'var(--surface)', cursor:'pointer',
          fontFamily:'var(--font)', color:'var(--ink-900)', borderRadius:3, padding:'2px 4px' }}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    )
  }

  if (editing) {
    return (
      <input value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e=>{ if(e.key==='Enter') commit(); if(e.key==='Escape'){setDraft(value);setEditing(false)} }}
        autoFocus style={{ fontSize:13, border:'none', borderBottom:'1px solid var(--ink-300)', outline:'none',
          background:'transparent', fontFamily:mono?'var(--font-mono)':'var(--font)',
          color:'var(--ink-900)', width:'100%', padding:'1px 0' }}/>
    )
  }

  const empty = !value?.trim()
  return (
    <div onClick={()=>{setDraft(value);setEditing(true)}}
      style={{ cursor:'text', fontSize:13, color:empty?'var(--ink-200)':dim?'var(--ink-500)':'var(--ink-800)',
        fontFamily:mono?'var(--font-mono)':'var(--font)', fontStyle:empty?'italic':undefined,
        paddingBottom:1, borderBottom:'1px solid transparent',
        transition:'border-color 0.1s' }}
      onMouseEnter={e=>e.currentTarget.style.borderBottomColor='var(--border)'}
      onMouseLeave={e=>e.currentTarget.style.borderBottomColor='transparent'}>
      {empty ? placeholder : value}
    </div>
  )
}

/* ─── Expanded vendor row ────────────────────────────────── */
function ExpandedRow({ v, onUpdate, onClose }) {
  const [notes,   setNotes]   = useState(v.notes||'')
  const [noteEditing, setNE]  = useState(false)
  const [files,   setFiles]   = useState(v.files||[])
  const [contacts,setContacts]= useState(v.contacts||[])
  const fileRef = useRef(null)

  const upd = (k, val) => onUpdate({ ...v, [k]:val })
  const cs = contractStyle(v.contractStatus)
  const ss = statusStyle(v.status)

  return (
    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.18, ease:[0.25,1,0.5,1] }}
      style={{ position:'relative', zIndex:1 }}>
      <div style={{ background:'var(--ground-dim)', borderLeft:'3px solid var(--ink-900)', borderBottom:'1px solid var(--border-med)', padding:'18px 22px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 220px 220px', gap:24, maxWidth:'var(--cap-panel)' }}>

          {/* Left: core details — all inline editable */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>Details</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Contact name</p>
                <EditCell value={v.contact} onChange={val=>upd('contact',val)} placeholder="Contact name"/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Role</p>
                <EditCell value={v.contactRole} onChange={val=>upd('contactRole',val)} placeholder="Role"/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Phone</p>
                <EditCell value={v.contactPhone} onChange={val=>upd('contactPhone',val)} placeholder="Phone" mono dim/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Email</p>
                <EditCell value={v.contactEmail} onChange={val=>upd('contactEmail',val)} placeholder="Email" dim/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Contract</p>
                <EditCell value={v.contractStatus} onChange={val=>upd('contractStatus',val)} select options={CONTRACT_STATUSES}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Signed</p>
                <EditCell value={v.contractDate} onChange={val=>upd('contractDate',val)} placeholder="Date"/>
              </div>
            </div>

            {/* Notes */}
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Notes</p>
            {noteEditing ? (
              <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                onBlur={()=>{setNE(false); upd('notes',notes)}}
                autoFocus rows={3}
                style={{ width:'100%', fontSize:13, lineHeight:1.6, border:'none', outline:'none',
                  borderBottom:'1px solid var(--border)', background:'transparent',
                  fontFamily:'var(--font)', color:'var(--ink-700)', resize:'none', padding:'2px 0' }}/>
            ) : (
              <p onClick={()=>setNE(true)} style={{ fontSize:13, color:notes?'var(--ink-700)':'var(--ink-200)', lineHeight:1.6,
                fontStyle:notes?undefined:'italic', cursor:'text', paddingBottom:2,
                borderBottom:'1px solid transparent', transition:'border-color 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.borderBottomColor='var(--border)'}
                onMouseLeave={e=>e.currentTarget.style.borderBottomColor='transparent'}>
                {notes || 'Add internal notes…'}
              </p>
            )}
          </div>

          {/* Middle: financial summary — inline editable */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>Financial</p>
            {[
              ['Budget',       v.budget,       'budget'],
              ['Contract value',v.contractValue,'contractValue'],
              ['Deposit',      v.depositPct?`${v.depositPct}%`:'—', null],
              ['Payment terms',v.paymentTerms,  'paymentTerms'],
              ['COI status',   v.coiStatus,     'coiStatus'],
            ].map(([label, val, key]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{label}</p>
                {key ? (
                  <EditCell value={String(val||'')} onChange={nv=>upd(key, label.includes('Budget')||label.includes('value')?Number(nv)||0:nv)}
                    placeholder="—" mono={label.includes('Budget')||label.includes('value')} dim/>
                ) : (
                  <p style={{ fontSize:13, color:'var(--ink-700)' }}>{val||'—'}</p>
                )}
              </div>
            ))}
          </div>

          {/* Right: files */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)' }}>Files</p>
              <button onClick={()=>fileRef.current?.click()} style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Upload</button>
              <input ref={fileRef} type="file" style={{ display:'none' }} onChange={e=>{const f=e.target.files[0];if(f)setFiles(p=>[...p,{id:uid(),name:f.name,type:'file',date:'Now'}])}}/>
            </div>
            {files.map(f=>(
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:28, height:28, borderRadius:3, background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="0.5" width="9" height="10" rx="1.5" stroke="var(--ink-200)" strokeWidth="1"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</p>
                  <p style={{ fontSize:10, color:'var(--ink-300)' }}>{f.type} · {f.date}</p>
                </div>
                <button style={{ fontSize:11, color:'var(--ink-300)', background:'none', border:'none', cursor:'pointer' }}>↓</button>
              </div>
            ))}
            {files.length===0&&(
              <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFiles(p=>[...p,{id:uid(),name:f.name,type:'file',date:'Now'}])}}
                onClick={()=>fileRef.current?.click()}
                style={{ height:64, border:'1px dashed var(--border-med)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginTop:4 }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink-300)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-med)'}>
                <p style={{ fontSize:12, color:'var(--ink-300)' }}>Drop files or click</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Vendor table row ───────────────────────────────────── */
function VendorRow({ v, expanded, onToggle, onUpdate }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(v.status)
  const cs = contractStyle(v.contractStatus)

  return (
    <div>
      <div onClick={onToggle} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ display:'grid', gridTemplateColumns:'minmax(160px,1fr) 130px minmax(120px,140px) 90px 130px 110px 28px',
          gap:14, padding:'12px 0', borderBottom:expanded?'none':'1px solid var(--border)',
          cursor:'pointer', alignItems:'center',
          background:expanded?'var(--ground-dim)':hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <VendorLogo name={v.name} size={30}/>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:2, letterSpacing:'-0.01em' }}>{v.name}</p>
            <p style={{ fontSize:11, color:'var(--ink-400)' }}>{v.domain}</p>
          </div>
        </div>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{v.cat}</p>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Av initials={v.ownerInitials} size={22}/>
          <div>
            <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)' }}>{v.owner.split(' ')[0]}</p>
            <p style={{ fontSize:10, color:'var(--ink-400)' }}>{v.ownerRole}</p>
          </div>
        </div>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-800)', fontFamily:'var(--font-mono)' }}>{fmtUSD(v.budget)}</p>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:11, color:cs.color }}>{cs.icon}</span>
          <div>
            <p style={{ fontSize:12, fontWeight:500, color:cs.color }}>{v.contractStatus}</p>
            {v.contractDate&&<p style={{ fontSize:10, color:'var(--ink-300)' }}>{v.contractDate}</p>}
          </div>
        </div>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2, whiteSpace:'nowrap' }}>{ss.label||v.status}</span>
        <motion.div animate={{ rotate:expanded?90:0 }} transition={{ duration:0.14 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <ExpandedRow key={v.id} v={v}
            onUpdate={updated=>onUpdate(updated)}
            onClose={()=>{}}/>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Vendor directory picker ─────────────────────────────
   "Add vendor" opens the platform Vendor Directory (the same
   source of truth as the company Vendor Library) so vendors
   are selected like team members — not typed from scratch.   */

function directoryStatus(dv) {
  if ((dv.rating || '').startsWith('5')) return 'Preferred'
  if ((dv.projects || []).length > 0 || dv.rating || dv.producerNotes) return 'Active'
  return 'New'
}
function directoryStatusStyle(s) {
  if (s === 'Preferred') return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (s === 'Active')    return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  return                        { color:'var(--ink-400)',            bg:'var(--ground-dim)'      }
}

/* Map directory categories → project vendor categories */
const DIR_CAT_MAP = {
  'Lighting and AV':'AV / Interactive', 'Food and Beverage':'Hospitality / F&B',
  'Furniture and Decor':'Rentals', 'Printer':'Print', 'Photographer':'Content Capture',
  'Videographer':'Content Capture', 'Video Editor':'Content Capture',
}
function directoryToProjectVendor(dv) {
  const domain = (dv.website || '').replace(/^https?:\/\/(www\.)?/,'').replace(/\/.*$/,'')
  return {
    id: uid(), sourceId: dv.id, name: dv.name,
    domain, cat: DIR_CAT_MAP[dv.category] || dv.category || 'Rentals',
    owner:'', ownerInitials:'', ownerRole:'',
    budget:0, contractValue:0, contractStatus:'Unsigned', contractDate:'',
    status:'Selected', depositPct:0, paymentTerms:'Net 30',
    insuranceRequired:false, coiStatus:'Pending',
    contact: dv.contactName || '', contactRole:'', contactPhone: dv.phone || '', contactEmail: dv.email || '',
    notes: dv.producerNotes || '',
    contacts: dv.contactName ? [{ id:'c1', name:dv.contactName, role:'', phone:dv.phone||'', email:dv.email||'', notes:'' }] : [],
    files: [],
  }
}

function PreviewField({ label, value }) {
  return (
    <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:500, color: value ? 'var(--ink-900)' : 'var(--ink-200)', fontStyle: value ? undefined : 'italic', lineHeight:1.5 }}>{value || 'Not on file'}</p>
    </div>
  )
}

function VendorDirectoryModal({ onClose, onAdd, onCreateNew, addedNames }) {
  const [q, setQ]         = useState('')
  const [cat, setCat]     = useState('All')
  const [preview, setPreview] = useState(null)

  const cats = ['All', ...DIRECTORY_CATS]
  const term = q.trim().toLowerCase()
  const filtered = DIRECTORY_VENDORS.filter(dv =>
    (cat === 'All' || dv.category === cat) &&
    (!term || [dv.name, dv.contactName, dv.city, dv.category].some(f => (f||'').toLowerCase().includes(term)))
  )

  /* ── Preview step — confidence check before attaching ── */
  if (preview) {
    const dv = preview
    const st = directoryStatus(dv)
    const ss = directoryStatusStyle(st)
    const location = [dv.city, dv.state, dv.country].filter(Boolean).join(', ')
    return (
      <FocusModal onClose={onClose} width="520px" maxWidth="560px">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>Vendor preview</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <VendorLogo name={dv.name} size={48}/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:17, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.02em', marginBottom:3 }}>{dv.name}</p>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>{dv.category}{dv.subcategory ? ` · ${dv.subcategory}` : ''}</p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2, whiteSpace:'nowrap' }}>{st}</span>
          </div>
          <PreviewField label="Primary contact" value={dv.contactName}/>
          <PreviewField label="Company email"   value={dv.email}/>
          <PreviewField label="Phone"           value={dv.phone}/>
          <PreviewField label="Website"         value={(dv.website||'').replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'')}/>
          <PreviewField label="Location"        value={location}/>
          {dv.producerNotes && <PreviewField label="Producer notes" value={dv.producerNotes}/>}
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={()=>setPreview(null)} style={{ padding:'8px 18px', fontSize:12, fontWeight:500, background:'transparent', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--ink-500)', fontFamily:'var(--font)' }}>Cancel</button>
          <button onClick={()=>onAdd(directoryToProjectVendor(dv))} style={{ padding:'8px 22px', fontSize:12, fontWeight:700, background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Add to Project</button>
        </div>
      </FocusModal>
    )
  }

  /* ── Directory step — search, browse, filter ── */
  return (
    <FocusModal onClose={onClose} width="680px" maxWidth="720px">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div>
          <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', marginBottom:2 }}>Vendor Directory</h3>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{DIRECTORY_VENDORS.length} vendors saved in the platform · select one to preview</p>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>

      <div style={{ padding:'14px 24px 0', flexShrink:0 }}>
        <input autoFocus placeholder="Search vendors, contacts, cities…" value={q} onChange={e=>setQ(e.target.value)}
          style={{ width:'100%', fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', marginBottom:10 }}/>
        <div className="filter-chips" style={{ marginBottom:10 }}>
          {cats.map(c => (
            <button key={c} className={`chip${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowY:'auto', padding:'0 24px', flex:1, minHeight:220, maxHeight:'46vh' }}>
        {filtered.map(dv => {
          const st = directoryStatus(dv)
          const ss = directoryStatusStyle(st)
          const already = addedNames.has(dv.name.toLowerCase())
          return (
            <div key={dv.id} onClick={()=>!already && setPreview(dv)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)',
                cursor: already ? 'default' : 'pointer', opacity: already ? 0.45 : 1 }}
              onMouseEnter={e=>{ if(!already) e.currentTarget.style.background='var(--ground-dim)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}>
              <VendorLogo name={dv.name} size={32}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dv.name}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{[dv.category, dv.city].filter(Boolean).join(' · ')}</p>
              </div>
              <p style={{ fontSize:12, color:'var(--ink-500)', flexShrink:0 }}>{dv.contactName || '—'}</p>
              {already
                ? <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--ink-300)', flexShrink:0 }}>Added ✓</span>
                : <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2, flexShrink:0 }}>{st}</span>}
            </div>
          )
        })}
        {filtered.length===0 && (
          <div style={{ padding:'36px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>
            No vendors match{q ? ` “${q}”` : ''}
          </div>
        )}
      </div>

      <div style={{ padding:'12px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>Can’t find who you’re looking for?</p>
        <button onClick={onCreateNew} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, background:'transparent', border:'1px solid var(--border-med)', borderRadius:4, cursor:'pointer', color:'var(--ink-700)', fontFamily:'var(--font)' }}>+ Create new vendor</button>
      </div>
    </FocusModal>
  )
}

/* ─── New vendor modal (for creation only) ───────────────── */
function NewVendorModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:'', domain:'', cat:CATEGORIES[1], owner:'', ownerInitials:'', ownerRole:'', budget:'', contractValue:'', contractStatus:'Unsigned', contractDate:'', status:'Quoted', depositPct:'', paymentTerms:'Net 30', insuranceRequired:false, coiStatus:'Pending', contact:'', contactRole:'', contactPhone:'', contactEmail:'', notes:'', contacts:[], files:[] })
  const inp = { fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  const save = () => {
    if (!form.name.trim()) return
    onAdd({ ...form, id:uid(), budget:toNum(form.budget), contractValue:toNum(form.contractValue) })
    onClose()
  }

  return (
    <FocusModal onClose={onClose} width="620px" maxWidth="680px">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>Add vendor</h3>
        <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>
      <div style={{ padding:'20px 24px', overflowY:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[['Vendor name','name','text'],['Category','cat','select'],['Website / domain','domain','text'],['Status','status','select'],['Budget','budget','text'],['Contact name','contact','text'],['Contact role','contactRole','text'],['Contact phone','contactPhone','text'],['Contact email','contactEmail','text'],['Owner','owner','text']].map(([l,k,t])=>(
            <div key={k} style={{ gridColumn:k==='name'||k==='contactEmail'?'1/-1':'auto' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>{l}</p>
              {t==='select'
                ? <select value={form[k]} onChange={set(k)} style={inp}>
                    {(k==='cat'?CATEGORIES.slice(1):VENDOR_STATUSES).map(o=><option key={o}>{o}</option>)}
                  </select>
                : <input value={form[k]} onChange={set(k)} style={inp} placeholder={l}/>
              }
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
        <button onClick={onClose} style={{ padding:'8px 18px', fontSize:12, fontWeight:500, background:'transparent', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--ink-500)', fontFamily:'var(--font)' }}>Cancel</button>
        <button onClick={save} style={{ padding:'8px 22px', fontSize:12, fontWeight:700, background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Add vendor</button>
      </div>
    </FocusModal>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Vendors page
   ───────────────────────────────────────────────────────── */
export default function Vendors({ currentUser, projectId, isViewOnly, production }) {
  const [vendors,    setVendors]    = useLocalState(`vendors_${projectId || 'default'}_v1`, [])
  const [expandedId, setExpandedId] = useState(null)
  const [catFilter,  setCatFilter]  = useState('All')
  const [picking,    setPicking]    = useState(false)   // vendor directory picker
  const [creating,   setCreating]   = useState(false)   // blank creation form

  const pageCats  = ['All', ...new Set([...CATEGORIES.slice(1), ...vendors.map(v=>v.cat).filter(Boolean)])]
  const shown     = catFilter==='All' ? vendors : vendors.filter(v=>v.cat===catFilter)
  const addedNames= new Set(vendors.map(v=>v.name.toLowerCase()))
  const contracted= vendors.filter(v=>v.contractValue>0).reduce((s,v)=>s+toNum(v.contractValue),0)
  const pending   = vendors.filter(v=>['Quoted','Selected'].includes(v.status)).length
  const quoted    = vendors.filter(v=>v.status==='Quoted').length

  const toggleExpand = id => setExpandedId(p => p===id ? null : id)
  const updateVendor = (id, updated) => setVendors(p=>p.map(v=>v.id===id?{...v,...updated}:v))
  const addVendor    = v => { setVendors(p=>[...p,v]); setExpandedId(v.id) }

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Production · Vendors</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:10 }}>Vendors</h1>
            <PageOwner area="Vendors" projectId={projectId}/>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>Manage vendor partners, quotes, contracts and spend.</p>
          </div>
          <button onClick={()=>setPicking(true)}
            style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
            + Add vendor
          </button>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:22 }}>
          {[
            { label:'Total vendors',     value:String(vendors.length), sub:'All categories',    dark:true },
            { label:'Pending decisions', value:String(pending),        sub:'Need approval'              },
            { label:'Contracted spend',  value:fmtUSD(contracted),     sub:'Total committed'            },
            { label:'Outstanding quotes',value:String(quoted),         sub:'Awaiting response', warn:quoted>0 },
          ].map((s,i)=>(
            <div key={i} style={{ padding:'14px 18px', borderRight:i<3?'1px solid var(--border)':'none', background:s.dark?'var(--ink-900)':'var(--ground-dim)' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:s.dark?'rgba(255,255,255,0.28)':s.warn?'var(--signal-amber-text)':'var(--ink-300)', marginBottom:6 }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:s.dark?'white':s.warn?'var(--signal-amber-text)':'var(--ink-900)', lineHeight:1, marginBottom:4 }}>{s.value}</p>
              <p style={{ fontSize:11, color:s.dark?'rgba(255,255,255,0.28)':s.warn?'var(--signal-amber-text)':'var(--ink-400)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <div className="filter-chips" style={{ marginBottom:16 }}>
          {pageCats.map(c=>(
            <button key={c} className={`chip${catFilter===c?' active':''}`} onClick={()=>setCatFilter(c)}>{c}</button>
          ))}
        </div>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(160px,1fr) 130px minmax(120px,140px) 90px 130px 110px 28px',
          gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
          {['Vendor','Category','Owner','Budget','Contract','Status',''].map((h,i)=>(
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>

        {/* Vendor rows */}
        {shown.map(v => (
          <VendorRow key={v.id} v={v}
            expanded={expandedId===v.id}
            onToggle={()=>toggleExpand(v.id)}
            onUpdate={updated=>updateVendor(v.id,updated)}/>
        ))}

        <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:14 }}>
          {shown.length} vendor{shown.length!==1?'s':''} · Click any row to expand · Click any field to edit
        </p>
      </motion.div>

      {/* Vendor directory — select an existing vendor first */}
      <AnimatePresence>
        {picking && (
          <VendorDirectoryModal key="pick"
            addedNames={addedNames}
            onClose={()=>setPicking(false)}
            onAdd={v=>{ addVendor(v); setPicking(false) }}
            onCreateNew={()=>{ setPicking(false); setCreating(true) }}/>
        )}
      </AnimatePresence>

      {/* New vendor modal — only for creation */}
      <AnimatePresence>
        {creating && <NewVendorModal key="new" onClose={()=>setCreating(false)} onAdd={addVendor}/>}
      </AnimatePresence>
    </div>
  )
}
