import React, { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusModal from '../../components/FocusModal.jsx'
import PageOwner from '../../components/PageOwner.jsx'
import { useLocalState } from '../../useLocalState.js'
import { VENUES as DIRECTORY_VENUES, VENUE_CITIES, VENUE_CAPACITY } from '../../company/libraryData.js'

/* ─── Seed data ──────────────────────────────────────────── */
const VENUE = {
  name: 'Brooklyn Tower', address: '9 DeKalb Ave, Brooklyn, NY 11201',
  mapsUrl: 'https://maps.google.com/?q=9+DeKalb+Ave+Brooklyn+NY',
  website: 'brooklyintower.com', eventDate: 'Jul 16, 2026',
  eventHours: '6:00 PM – 11:00 PM', buildingHours: '7:00 AM – 12:00 AM',
  floor: '12th Floor – Sky Lounge', capacity: 250, sqft: 12500,
  ceilingHeight: '14 ft', flooring: 'Polished concrete', hangingRestrictions: 'Rigging to exposed beams only',
  weightLimits: '150 lbs / sq ft floor load',
  power: '200A, 3-Phase', dedicatedCircuits: 'Yes — 4 dedicated 20A circuits', floorBoxes: '8 floor boxes (20A)',
  wifi: 'Building wifi available', hardline: 'Cat6 available via patch panel',
  dockAddress: 'Rear of building, Dock A, enter on Willoughby St',
  dockHours: '8:00 AM – 6:00 PM', dockReservation: 'Yes — 48hr advance required',
  dockContact: 'Dock Manager · (212) 555-0191',
  passengerElevQty: 4, passengerElevDims: '54"W x 84"D x 96"H', passengerElevDoorWidth: '36"', passengerElevWeight: '3,500 lbs',
  freightElevQty: 1, freightElevDims: '84"W x 120"D x 96"H', freightElevDoorWidth: '60"', freightElevWeight: '10,000 lbs',
  maxCrateSize: '80"W x 110"D x 90"H', maxPalletSize: '48" x 48"',
  vendorParking: 'Street parking only — no dedicated vendor lot',
  guestParking: 'City Point garage adjacent (validated)',
  coiRequired: true, noiseRestriction: 'Music off by 11:00 PM',
  alcoholRestriction: 'Licensed bartenders required', openFlame: 'No open flame',
  cookingRestriction: 'No cooking on-site — catering delivery only',
  securityProcedure: 'All vendors must check in at Dock A, photo ID required',
  vendorCheckIn: 'Building security desk, lobby level',
  trashRemoval: 'Producer responsible for all trash removal at strike',
  photography: 'No photography in common areas without approval',
  overnightStorage: 'Not permitted',
  unionReqs: 'Non-union building — no restrictions',
}

const SEED_LOADINS = [
  { id:'li1', type:'Load-In', date:'Jul 15, 2026', time:'8:00 AM', crew:'12 stagehands + 2 supervisors',
    dockReservation:'Confirmed — Dock A', parking:'Loading zone permit active',
    staging:'Sky Lounge + back-of-house', security:'Dock A check-in, all IDs verified',
    elevReservation:'Freight elevator reserved 7:00 AM–6:00 PM', notes:'AV arrives first, scenic second.' },
  { id:'lo1', type:'Load-Out', date:'Jul 17, 2026', time:'11:00 PM', crew:'10 stagehands',
    dockReservation:'TBD — request submitted', parking:'TBD',
    staging:'SKy Lounge', security:'Night security on duty',
    elevReservation:'TBD', notes:'Strike immediately after event ends.' },
]

const SEED_FREIGHT = [
  { id:'fr1', carrier:'Peak Freight', tracking:'PK-20260715-001', pickup:'Jul 14', delivery:'Jul 15', arrivalTime:'7:00 AM',
    driver:'Mike Torres', driverPhone:'(718) 555-9100', vendor:'Eventmakers NYC', status:'Scheduled', notes:'Scenic build materials — 3 trucks.' },
  { id:'fr2', carrier:'QuickShip NYC', tracking:'QS-20260715-044', pickup:'Jul 14', delivery:'Jul 15', arrivalTime:'9:00 AM',
    driver:'Lisa Chen', driverPhone:'(917) 555-8800', vendor:'Ocubo Digital', status:'Confirmed', notes:'AV equipment — 1 truck.' },
]

const SEED_CONTACTS = [
  { id:'ct1', group:'Venue', name:'James Holter',    role:'Venue Director',   phone:'(212) 555-0189', mobile:'(212) 555-0189', email:'james@brooklyntower.com', preferred:'Email', notes:'Primary contact for all venue questions.' },
  { id:'ct2', group:'Venue', name:'Rachel Ng',        role:'Events Manager',   phone:'(212) 555-0190', mobile:'(917) 555-4400', email:'rachel@brooklyntower.com', preferred:'Phone', notes:'' },
  { id:'ct3', group:'Loading Dock', name:'Dave Park', role:'Dock Manager',     phone:'(212) 555-0191', mobile:'(646) 555-7700', email:'dock@brooklyntower.com', preferred:'Phone', notes:'Call day-of for dock reservations.' },
  { id:'ct4', group:'Security', name:'Frank Reyes',   role:'Head of Security', phone:'(212) 555-0192', mobile:'(718) 555-3300', email:'security@brooklyntower.com', preferred:'Phone', notes:'' },
]

const SEED_PHOTOS = [
  { id:'ph1', caption:'Main event space — Sky Lounge', bg:'#1E2428' },
  { id:'ph2', caption:'Loading dock — Dock A entrance', bg:'#28201E' },
  { id:'ph3', caption:'Freight elevator interior', bg:'#1A2028' },
  { id:'ph4', caption:'Back-of-house staging area', bg:'#20281E' },
  { id:'ph5', caption:'Passenger elevator bank', bg:'#282018' },
  { id:'ph6', caption:'Floor plan — 12th Floor', bg:'#1E2020' },
]

const SEED_FILES = [
  { id:'fi1', name:'Brooklyn_Tower_Contract.pdf',   type:'Contract',   date:'Jun 15', size:'240 KB' },
  { id:'fi2', name:'COI_BrooklynTower_2026.pdf',    type:'COI',        date:'Jun 28', size:'180 KB' },
  { id:'fi3', name:'Floor_Plan_12F_v3.pdf',         type:'Floor Plan', date:'Jun 20', size:'1.2 MB' },
  { id:'fi4', name:'Power_Plan_BT.pdf',             type:'Power Plan', date:'Jun 22', size:'540 KB' },
  { id:'fi5', name:'LoadIn_Schedule_Jul15.pdf',     type:'Load-In',    date:'Jun 27', size:'85 KB'  },
  { id:'fi6', name:'Building_Guidelines_2026.pdf',  type:'Guidelines', date:'Mar 1',  size:'320 KB' },
]

const STATUS_CHECKS = [
  { label:'Venue Confirmed',     done:false, detail:'' },
  { label:'COI Approved',        done:false, detail:'' },
  { label:'Load-In Scheduled',   done:false, detail:'' },
  { label:'Load-Out Scheduled',  done:false, detail:'' },
  { label:'Freight Booked',      done:false, detail:'' },
]

const QUICK_LINKS = [
  { label:'Floor Plans',    sub:'2 files',        icon:'↗' },
  { label:'Load-In Details',sub:'Jul 15, 8:00 AM',icon:'↗' },
  { label:'Freight',        sub:'2 shipments',    icon:'↗' },
  { label:'Building Rules', sub:'View requirements',icon:'↗'},
  { label:'Files',          sub:'All documents',  icon:'↗' },
]

const FREIGHT_STATUSES = ['Scheduled','Confirmed','In transit','Delivered','Cancelled']
const uid = () => `_${Math.random().toString(36).slice(2,8)}`

/* ─── Shared primitives ──────────────────────────────────── */
function SLabel({ children }) {
  return <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>{children}</p>
}
function SectionHead({ children }) {
  return <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>{children}</p>
}
function KV({ label, value, green, amber }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <p style={{ fontSize:12, color:'var(--ink-400)', flexShrink:0, marginRight:12 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:500, color:green?'var(--signal-green-text)':amber?'var(--signal-amber-text)':'var(--ink-900)', textAlign:'right' }}>{value||'—'}</p>
    </div>
  )
}
function SpecCard({ title, children }) {
  return (
    <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px' }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:12 }}>{title}</p>
      {children}
    </div>
  )
}
const inp = (extra={}) => ({ fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)',
  borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%', ...extra })

/* ── Click-to-edit value — reads as content until clicked.
   Matches the inline editing style used on the Vendors page. */
function EditVal({ value, onChange, placeholder='Click to add', area }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')
  const commit = () => { setEditing(false); if (String(draft) !== String(value ?? '')) onChange(draft) }

  if (editing) {
    if (area) return (
      <textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e=>{ if(e.key==='Escape'){ setEditing(false) } }}
        style={{ width:'100%', fontSize:13, lineHeight:1.55, border:'none', borderBottom:'1px solid var(--ink-300)',
          outline:'none', background:'transparent', fontFamily:'var(--font)', color:'var(--ink-900)', resize:'vertical', minHeight:56, padding:'2px 0' }}/>
    )
    return (
      <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e=>{ if(e.key==='Enter') commit(); if(e.key==='Escape'){ setEditing(false) } }}
        style={{ width:'100%', fontSize:13, border:'none', borderBottom:'1px solid var(--ink-300)', outline:'none',
          background:'transparent', fontFamily:'var(--font)', color:'var(--ink-900)', padding:'1px 0' }}/>
    )
  }

  const empty = value === undefined || value === null || String(value).trim() === ''
  return (
    <div onClick={()=>{ setDraft(empty ? '' : String(value)); setEditing(true) }}
      style={{ cursor:'text', fontSize:13, fontWeight:500, lineHeight:1.5,
        color: empty ? 'var(--ink-200)' : 'var(--ink-900)', fontStyle: empty ? 'italic' : undefined,
        paddingBottom:1, borderBottom:'1px solid transparent', transition:'border-color 0.1s', minHeight:20 }}
      onMouseEnter={e=>e.currentTarget.style.borderBottomColor='var(--border)'}
      onMouseLeave={e=>e.currentTarget.style.borderBottomColor='transparent'}>
      {empty ? placeholder : String(value)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   TABS
   ───────────────────────────────────────────────────────── */

/* Overview tab */
function OverviewTab({ venue, onTabChange }) {
  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <SectionHead>Operational status</SectionHead>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {STATUS_CHECKS.map(s=>(
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                background:s.done?'var(--signal-green-dot)':'transparent',
                border:s.done?'none':'1.5px solid var(--border-med)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {s.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <p style={{ flex:1, fontSize:13, color:s.done?'var(--ink-700)':'var(--ink-400)' }}>{s.label}</p>
              <p style={{ fontSize:12, color:s.done?'var(--signal-green-text)':'var(--ink-300)', fontWeight:500 }}>{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionHead>Recent activity</SectionHead>
        <p style={{ fontSize:13, color:'var(--ink-400)', fontStyle:'italic', padding:'12px 0' }}>No recent activity.</p>
      </div>
    </div>
  )
}

/* Venue tab */
function VenueTab({ venue, onUpdate }) {
  const [v, setV] = useState(venue)
  const upd = (k, val) => { const next={...v,[k]:val}; setV(next); onUpdate(next) }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:32 }}>
      {/* Left column */}
      <div>
        <SectionHead>Basic information</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[['Venue name','name'],['Address','address'],['Website','website'],['Event date','eventDate'],['Event hours','eventHours'],['Building hours','buildingHours'],['Floor / Space','floor']].map(([l,k])=>(
            <div key={k} style={{ gridColumn: k==='address'?'1/-1':'auto' }}>
              <SLabel>{l}</SLabel>
              <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
            </div>
          ))}
        </div>

        <SectionHead>Space details</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[['Capacity','capacity'],['Square footage','sqft'],['Ceiling height','ceilingHeight'],['Flooring','flooring'],['Hanging restrictions','hangingRestrictions'],['Weight limits','weightLimits']].map(([l,k])=>(
            <div key={k}>
              <SLabel>{l}</SLabel>
              <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
            </div>
          ))}
        </div>

        <SectionHead>Power &amp; internet</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['Available power','power'],['Dedicated circuits','dedicatedCircuits'],['Floor boxes','floorBoxes'],['WiFi','wifi'],['Hardline internet','hardline']].map(([l,k])=>(
            <div key={k}>
              <SLabel>{l}</SLabel>
              <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div>
        <SectionHead>Loading dock</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {[['Dock address','dockAddress'],['Dock hours','dockHours'],['Reservation required','dockReservation'],['Dock contact','dockContact']].map(([l,k])=>(
            <div key={k} style={{ gridColumn:k==='dockAddress'?'1/-1':'auto' }}>
              <SLabel>{l}</SLabel>
              <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <SpecCard title="Passenger elevators">
            {[['Quantity','passengerElevQty'],['Interior dimensions','passengerElevDims'],['Door width','passengerElevDoorWidth'],['Weight capacity','passengerElevWeight']].map(([l,k])=>(
              <div key={k} style={{ marginBottom:7 }}>
                <p style={{ fontSize:10, color:'var(--ink-400)', marginBottom:1 }}>{l}</p>
                <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
              </div>
            ))}
          </SpecCard>
          <SpecCard title="Freight elevators">
            {[['Quantity','freightElevQty'],['Interior dimensions','freightElevDims'],['Door width','freightElevDoorWidth'],['Weight capacity','freightElevWeight']].map(([l,k])=>(
              <div key={k} style={{ marginBottom:7 }}>
                <p style={{ fontSize:10, color:'var(--ink-400)', marginBottom:1 }}>{l}</p>
                <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
              </div>
            ))}
          </SpecCard>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <SpecCard title="Max crate / pallet size">
            {[['Max crate','maxCrateSize'],['Max pallet','maxPalletSize']].map(([l,k])=>(
              <div key={k} style={{ marginBottom:7 }}>
                <p style={{ fontSize:10, color:'var(--ink-400)', marginBottom:1 }}>{l}</p>
                <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
              </div>
            ))}
          </SpecCard>
          <SpecCard title="Parking">
            {[['Vendor parking','vendorParking'],['Guest parking','guestParking']].map(([l,k])=>(
              <div key={k} style={{ marginBottom:7 }}>
                <p style={{ fontSize:10, color:'var(--ink-400)', marginBottom:1 }}>{l}</p>
                <EditVal value={v[k]} onChange={val=>upd(k,val)}/>
              </div>
            ))}
          </SpecCard>
        </div>
      </div>
    </div>
  )
}

/* Load-In / Out tab */
function LoadInTab({ projectId }) {
  const pid = projectId || 'default'
  const isUserProject = pid.startsWith('up_')
  const storageKey = `field_local_logistics_loadins_${pid}_v1`

  // One-time initialization: if new key has never been written, seed it now
  // so useLocalState finds real data on first read.
  if (!localStorage.getItem(storageKey)) {
    const oldKey = 'field_local_logistics_loadins_v1'
    const migrated = localStorage.getItem(oldKey)
    const seed = isUserProject ? [] : SEED_LOADINS
    localStorage.setItem(storageKey, migrated || JSON.stringify(seed))
  }

  const [sections, setSections] = useLocalState(`logistics_loadins_${pid}_v1`, isUserProject ? [] : SEED_LOADINS)
  const upd = (id, k, val) => setSections(p => p.map(s => s.id === id ? { ...s, [k]: val } : s))
  return (
    <div>
      {sections.map(s=>(
        <div key={s.id} style={{ marginBottom:28 }}>
          <SectionHead>{s.type}</SectionHead>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            {[['Date','date'],['Time','time'],['Crew','crew'],['Dock reservation','dockReservation'],['Parking','parking'],['Staging area','staging'],['Security check-in','security'],['Elevator reservation','elevReservation']].map(([l,k])=>(
              <div key={k}>
                <SLabel>{l}</SLabel>
                <input value={s[k]||''} onChange={e=>upd(s.id,k,e.target.value)} style={inp()}/>
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <SLabel>Notes</SLabel>
              <textarea value={s.notes||''} onChange={e=>upd(s.id,'notes',e.target.value)}
                style={{ ...inp(), height:80, resize:'none', paddingTop:8 }}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* Freight tab */
function FreightTab({ projectId }) {
  const pid_freight = projectId || 'default'
  const isUserProject_freight = pid_freight.startsWith('up_')
  const storageKey_freight = `field_local_logistics_freight_${pid_freight}_v1`
  if (!localStorage.getItem(storageKey_freight)) {
    const old_freight = localStorage.getItem('field_local_logistics_freight_v1')
    localStorage.setItem(storageKey_freight, old_freight || JSON.stringify(isUserProject_freight ? [] : SEED_FREIGHT))
  }
  const [shipments, setShipments] = useLocalState(`logistics_freight_${pid_freight}_v1`, isUserProject_freight ? [] : SEED_FREIGHT)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ carrier:'', tracking:'', pickup:'', delivery:'', arrivalTime:'', driver:'', driverPhone:'', vendor:'', status:'Scheduled', notes:'' })

  const add = () => {
    if (!form.carrier) return
    setShipments(p=>[...p,{...form,id:uid()}])
    setForm({ carrier:'', tracking:'', pickup:'', delivery:'', arrivalTime:'', driver:'', driverPhone:'', vendor:'', status:'Scheduled', notes:'' })
    setAdding(false)
  }
  const upd = (id,k,v) => setShipments(p=>p.map(s=>s.id===id?{...s,[k]:v}:s))
  const del = id => setShipments(p=>p.filter(s=>s.id!==id))

  const sts = s => {
    if (s==='Confirmed'||s==='Delivered') return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
    if (s==='Scheduled')  return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
    if (s==='In transit') return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
    if (s==='Cancelled')  return { color:'var(--signal-red-text)',   bg:'var(--signal-red-bg)'   }
    return { color:'var(--ink-400)', bg:'var(--ground-dim)' }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:13, color:'var(--ink-400)' }}>{shipments.length} shipment{shipments.length!==1?'s':''}</p>
        <button onClick={()=>setAdding(a=>!a)} style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add shipment</button>
      </div>

      {adding && (
        <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
            {[['Carrier','carrier'],['Tracking #','tracking'],['Pickup date','pickup'],['Delivery date','delivery'],['Arrival time','arrivalTime'],['Driver','driver'],['Driver phone','driverPhone'],['Vendor','vendor']].map(([l,k])=>(
              <div key={k}><SLabel>{l}</SLabel><input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()} autoFocus={k==='carrier'}/></div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={add} style={{ padding:'6px 16px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
            <button onClick={()=>setAdding(false)} style={{ padding:'6px 12px', fontSize:11, background:'transparent', color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 80px 80px 1fr 90px 24px', gap:14, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          {['Carrier / Vendor','Tracking','Pickup','Delivery','Driver','Status',''].map((h,i)=>(
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>
        {shipments.map(s=>{
          const st = sts(s.status)
          return (
            <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1fr 110px 80px 80px 1fr 90px 24px', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{s.carrier}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{s.vendor}</p>
              </div>
              <p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--ink-600)' }}>{s.tracking}</p>
              <p style={{ fontSize:12, color:'var(--ink-600)' }}>{s.pickup}</p>
              <div>
                <p style={{ fontSize:12, color:'var(--ink-600)', marginBottom:1 }}>{s.delivery}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{s.arrivalTime}</p>
              </div>
              <div>
                <p style={{ fontSize:12, color:'var(--ink-700)' }}>{s.driver}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{s.driverPhone}</p>
              </div>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:st.color, background:st.bg, padding:'3px 7px', borderRadius:2 }}>{s.status}</span>
              <button onClick={()=>del(s.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-200)',fontSize:14,padding:0 }}>✕</button>
            </div>
          )
        })}
        {shipments.length===0 && <p style={{ padding:'24px 0', textAlign:'center', fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>No shipments yet.</p>}
      </div>
    </div>
  )
}

/* Building rules tab */
function BuildingRulesTab({ venue, onUpdate }) {
  const upd = (k, v) => onUpdate({ ...venue, [k]: v })

  const RULES = [
    { key:'coiRequired',        label:'COI required',          type:'toggle' },
    { key:'noiseRestriction',   label:'Noise restrictions',    type:'text'   },
    { key:'alcoholRestriction', label:'Alcohol restrictions',  type:'text'   },
    { key:'openFlame',          label:'Open flame policy',     type:'text'   },
    { key:'cookingRestriction', label:'Cooking restrictions',  type:'text'   },
    { key:'securityProcedure',  label:'Security procedures',   type:'area'   },
    { key:'vendorCheckIn',      label:'Vendor check-in',       type:'text'   },
    { key:'trashRemoval',       label:'Trash removal',         type:'text'   },
    { key:'photography',        label:'Photography',           type:'text'   },
    { key:'overnightStorage',   label:'Overnight storage',     type:'text'   },
    { key:'unionReqs',          label:'Union requirements',    type:'text'   },
  ]

  return (
    <div style={{ maxWidth:720 }}>
      <SectionHead>Building rules &amp; restrictions</SectionHead>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {RULES.map(({ key, label, type }) => (
          <div key={key} style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16,
            padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)' }}>{label}</p>
            {type === 'toggle' ? (
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={!!venue[key]}
                  onChange={e => upd(key, e.target.checked)}
                  style={{ width:14, height:14, accentColor:'var(--ink-900)' }}/>
                <span style={{ fontSize:13, color:'var(--ink-700)' }}>{venue[key] ? 'Yes' : 'No'}</span>
              </label>
            ) : (
              <EditVal value={venue[key]} onChange={val => upd(key, val)} area={type === 'area'}
                placeholder={`Click to add ${label.toLowerCase()}`}/>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Contacts tab */
function ContactsTab({ projectId }) {
  const pid_contacts = projectId || 'default'
  const isUserProject_contacts = pid_contacts.startsWith('up_')
  const storageKey_contacts = `field_local_logistics_contacts_${pid_contacts}_v1`
  if (!localStorage.getItem(storageKey_contacts)) {
    const old_contacts = localStorage.getItem('field_local_logistics_contacts_v1')
    localStorage.setItem(storageKey_contacts, old_contacts || JSON.stringify(isUserProject_contacts ? [] : SEED_CONTACTS))
  }
  const [contacts, setContacts] = useLocalState(`logistics_contacts_${pid_contacts}_v1`, isUserProject_contacts ? [] : SEED_CONTACTS)
  const [adding, setAdding]     = useState(false)
  const [form, setForm]         = useState({ group:'Venue', name:'', role:'', phone:'', mobile:'', email:'', preferred:'Phone', notes:'' })
  const GROUPS = ['Venue','Operations','Security','Loading Dock','Building Engineer','Facilities','Parking','Emergency']

  const add = () => {
    if (!form.name) return
    setContacts(p=>[...p,{...form,id:uid()}])
    setForm({ group:'Venue', name:'', role:'', phone:'', mobile:'', email:'', preferred:'Phone', notes:'' })
    setAdding(false)
  }
  const del = id => setContacts(p=>p.filter(c=>c.id!==id))
  const grouped = GROUPS.reduce((acc,g)=>({...acc,[g]:contacts.filter(c=>c.group===g)}),{})

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <SectionHead>Contacts</SectionHead>
        <button onClick={()=>setAdding(a=>!a)} style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add contact</button>
      </div>

      {adding && (
        <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
            <div><SLabel>Group</SLabel><select value={form.group} onChange={e=>setForm(p=>({...p,group:e.target.value}))} style={inp()}>{GROUPS.map(g=><option key={g}>{g}</option>)}</select></div>
            <div><SLabel>Name</SLabel><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp()} autoFocus/></div>
            <div><SLabel>Role</SLabel><input value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={inp()}/></div>
            <div><SLabel>Phone</SLabel><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} style={inp()}/></div>
            <div><SLabel>Mobile</SLabel><input value={form.mobile} onChange={e=>setForm(p=>({...p,mobile:e.target.value}))} style={inp()}/></div>
            <div><SLabel>Email</SLabel><input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={inp()}/></div>
            <div><SLabel>Preferred contact</SLabel><select value={form.preferred} onChange={e=>setForm(p=>({...p,preferred:e.target.value}))} style={inp()}>{['Phone','Mobile','Email','Text'].map(m=><option key={m}>{m}</option>)}</select></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={add} style={{ padding:'6px 16px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
            <button onClick={()=>setAdding(false)} style={{ padding:'6px 12px', fontSize:11, background:'transparent', color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {GROUPS.filter(g=>grouped[g]?.length>0).map(g=>(
        <div key={g} style={{ marginBottom:20 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }}>{g}</p>
          {grouped[g].map(c=>(
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 24px', gap:14, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <div><p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{c.name}</p><p style={{ fontSize:11, color:'var(--ink-400)' }}>{c.role}</p></div>
              <p style={{ fontSize:12, color:'var(--ink-600)' }}>{c.phone}{c.mobile&&c.mobile!==c.phone?<><br/><span style={{color:'var(--ink-400)',fontSize:11}}>M: {c.mobile}</span></>:''}</p>
              <p style={{ fontSize:12, color:'var(--ink-600)', wordBreak:'break-all' }}>{c.email}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)' }}>Prefer {c.preferred}</p>
              <button onClick={()=>del(c.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-200)',fontSize:14,padding:0 }}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* Photos tab */
function PhotosTab({ projectId }) {
  const pid_photos = projectId || 'default'
  const isUserProject_photos = pid_photos.startsWith('up_')
  const storageKey_photos = `field_local_logistics_photos_${pid_photos}_v1`
  if (!localStorage.getItem(storageKey_photos)) {
    const old_photos = localStorage.getItem('field_local_logistics_photos_v1')
    localStorage.setItem(storageKey_photos, old_photos || JSON.stringify(isUserProject_photos ? [] : SEED_PHOTOS))
  }
  const [photos, setPhotos] = useLocalState(`logistics_photos_${pid_photos}_v1`, isUserProject_photos ? [] : SEED_PHOTOS)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  const handleDrop = e => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setPhotos(p=>[...p,{ id:uid(), caption:f.name.replace(/\.[^.]+$/,''), bg:'#1A2030' }])
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:13, color:'var(--ink-400)' }}>{photos.length} photo{photos.length!==1?'s':''}</p>
        <button onClick={()=>fileRef.current?.click()} style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Add photos</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
          onChange={e=>Array.from(e.target.files).forEach(f=>setPhotos(p=>[...p,{id:uid(),caption:f.name.replace(/\.[^.]+$/,''),bg:'#1A2030'}]))}/>
      </div>

      {/* Drop zone */}
      <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop}
        style={{ border:'1px dashed var(--border-med)', borderRadius:4, padding:'18px', textAlign:'center', marginBottom:16, cursor:'pointer' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink-400)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-med)'}>
        <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:2 }}>Drag & drop venue photos</p>
        <p style={{ fontSize:11, color:'var(--ink-300)' }}>Venue · Rooms · Loading Dock · Elevators · Floor Plans · Back of House</p>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {photos.map(ph=>(
          <div key={ph.id} onClick={()=>setPreview(ph)} style={{ borderRadius:4, overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)' }}>
            <div style={{ height:140, background:ph.bg }}/>
            <div style={{ padding:'8px 10px', background:'var(--surface)' }}>
              <p style={{ fontSize:12, color:'var(--ink-700)' }}>{ph.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen preview */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ maxWidth:'80vw', width:'100%' }}>
            <div style={{ height:'60vh', background:preview.bg, borderRadius:6, marginBottom:14 }}/>
            <p style={{ textAlign:'center', fontSize:14, color:'rgba(255,255,255,0.60)' }}>{preview.caption}</p>
          </div>
          <button onClick={()=>setPreview(null)} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.50)', fontSize:28 }}>×</button>
        </div>
      )}
    </div>
  )
}

/* Files tab */
function FilesTab({ projectId }) {
  const pid_files = projectId || 'default'
  const isUserProject_files = pid_files.startsWith('up_')
  const storageKey_files = `field_local_logistics_files_${pid_files}_v1`
  if (!localStorage.getItem(storageKey_files)) {
    const old_files = localStorage.getItem('field_local_logistics_files_v1')
    localStorage.setItem(storageKey_files, old_files || JSON.stringify(isUserProject_files ? [] : SEED_FILES))
  }
  const [files, setFiles] = useLocalState(`logistics_files_${pid_files}_v1`, isUserProject_files ? [] : SEED_FILES)
  const fileRef = useRef(null)

  const handleDrop = e => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFiles(p=>[...p,{ id:uid(), name:f.name, type:'File', date:'Now', size:'' }])
  }

  const FILE_TYPE_COLORS = { Contract:'var(--signal-blue-text)', COI:'var(--signal-green-text)', 'Floor Plan':'var(--signal-amber-text)', 'Power Plan':'var(--signal-amber-text)', 'Load-In':'var(--ink-500)', Guidelines:'var(--ink-400)' }

  return (
    <div>
      <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop}
        onClick={()=>fileRef.current?.click()}
        style={{ border:'1px dashed var(--border-med)', borderRadius:4, padding:'22px', textAlign:'center', marginBottom:16, cursor:'pointer' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink-400)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-med)'}>
        <p style={{ fontSize:14, color:'var(--ink-400)', marginBottom:3 }}>Drop files or click to upload</p>
        <p style={{ fontSize:12, color:'var(--ink-300)' }}>COIs · Contracts · Floor Plans · CAD · Power Plans · Permits · Load-In Documents</p>
        <input ref={fileRef} type="file" multiple style={{ display:'none' }} onChange={e=>Array.from(e.target.files).forEach(f=>setFiles(p=>[...p,{id:uid(),name:f.name,type:'File',date:'Now',size:''}]))}/>
      </div>

      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 110px 80px 60px 24px', gap:14, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          {['File','Type','Date','Size',''].map((h,i)=><p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>)}
        </div>
        {files.map(f=>(
          <div key={f.id} style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 110px 80px 60px 24px', gap:14, padding:'11px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:3, background:'var(--ground-dim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="var(--ink-200)" strokeWidth="1.1"/></svg>
              </div>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}>{f.name}</p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:FILE_TYPE_COLORS[f.type]||'var(--ink-400)' }}>{f.type}</span>
            <p style={{ fontSize:12, color:'var(--ink-400)' }}>{f.date}</p>
            <p style={{ fontSize:11, color:'var(--ink-300)', fontFamily:'var(--font-mono)' }}>{f.size}</p>
            <button onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-200)',fontSize:14,padding:0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Venue directory picker — select from the platform Venue
   Library (same source of truth as the company directory)
   instead of starting from a blank form.
   ───────────────────────────────────────────────────────── */

function capacityBucketMatch(cap, bucket) {
  if (bucket === 'All')      return true
  if (bucket === 'Under 50') return cap < 50
  if (bucket === '50–100')   return cap >= 50  && cap <= 100
  if (bucket === '100–250')  return cap > 100  && cap <= 250
  if (bucket === '250–500')  return cap > 250  && cap <= 500
  if (bucket === '500+')     return cap > 500
  return true
}

/* Map a directory venue record → the project venue shape */
/* Auto-fill the selected venue's primary contact into Venue → Contacts.
   One venue source of truth: the contact travels with the venue selection
   instead of being re-typed. Dedupes by name; preserves demo seed contacts
   on first initialization. */
function makeVenueContactUpserter(pid) {
  return (v) => {
    if (!v?.contactName) return
    try {
      const key = `field_local_logistics_contacts_${pid}_v1`
      const raw = localStorage.getItem(key)
      const isUserProject = String(pid).startsWith('up_')
      const list = raw ? JSON.parse(raw) : (isUserProject ? [] : [...SEED_CONTACTS])
      if (!list.some(c => (c.name || '').trim().toLowerCase() === v.contactName.trim().toLowerCase())) {
        list.unshift({
          id: `ct${Date.now()}`, group: 'Venue',
          name: v.contactName, role: v.contactTitle || 'Venue contact',
          phone: v.contactPhone || '', mobile: '', email: v.contactEmail || '',
          preferred: 'Email', notes: 'Auto-filled from selected venue',
        })
        localStorage.setItem(key, JSON.stringify(list))
      }
    } catch {}
  }
}

function directoryToProjectVenue(vn) {
  return {
    sourceId: vn.id, name: vn.name, address: vn.location || '', website: vn.website || '',
    floor: vn.floor || '', buildingHours: vn.buildingHours || '',
    capacity: vn.capacity ?? '', sqft: vn.sqft ?? '', ceilingHeight: vn.ceilingHeight || '',
    power: vn.power || '', dedicatedCircuits: vn.dedicatedCircuits || '', floorBoxes: vn.floorBoxes || '',
    wifi: vn.wifi || '', hardline: vn.hardline || '',
    dockAddress: vn.dockAddress || '', dockHours: vn.dockHours || '',
    dockReservation: vn.dockReservation || '', dockContact: vn.dockContact || '',
    passengerElevQty: vn.passengerElevQty ?? '', passengerElevDims: vn.passengerElevDims || '',
    passengerElevDoorWidth: vn.passengerElevDoorWidth || '', passengerElevWeight: vn.passengerElevWeight || '',
    freightElevQty: vn.freightElevQty ?? '', freightElevDims: vn.freightElevDims || '',
    freightElevDoorWidth: vn.freightElevDoorWidth || '', freightElevWeight: vn.freightElevWeight || '',
    maxCrateSize: vn.maxCrateSize || '', maxPalletSize: vn.maxPalletSize || '',
    vendorParking: vn.vendorParking || '', guestParking: vn.guestParking || '',
    openFlame: vn.openFlame || '', noiseRestriction: vn.noiseRestrictions || '',
    securityProcedure: vn.buildingRules || '',
    contactName: vn.contactName || vn.contact || '', contactTitle: vn.contactTitle || '',
    contactPhone: vn.contactPhone || '', contactEmail: vn.contactEmail || '',
  }
}

function VenuePreviewField({ label, value }) {
  return (
    <div style={{ padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:500, color: value ? 'var(--ink-900)' : 'var(--ink-200)', fontStyle: value ? undefined : 'italic', lineHeight:1.5 }}>{value || 'Not on file'}</p>
    </div>
  )
}

function VenueDirectoryModal({ onClose, onAdd, onCreateNew }) {
  const [q, setQ]       = useState('')
  const [city, setCity] = useState('All')
  const [cap, setCap]   = useState('All')
  const [io, setIo]     = useState('All')
  const [preview, setPreview] = useState(null)

  const term = q.trim().toLowerCase()
  const filtered = DIRECTORY_VENUES.filter(vn =>
    (city === 'All' || vn.city === city) &&
    capacityBucketMatch(vn.capacity || 0, cap) &&
    (io === 'All' || vn.indoorOutdoor === io || (io !== 'Both' && vn.indoorOutdoor === 'Both')) &&
    (!term || [vn.name, vn.city, vn.location, vn.type].some(f => (f||'').toLowerCase().includes(term)))
  )

  const selStyle = { fontSize:12, height:32, padding:'0 8px', border:'1px solid var(--border)', borderRadius:3,
    fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-700)', outline:'none', cursor:'pointer' }

  /* ── Preview step ── */
  if (preview) {
    const vn = preview
    return (
      <FocusModal onClose={onClose} width="560px" maxWidth="600px">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>Venue preview</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px', overflowY:'auto' }}>
          {/* Hero — photo placeholder from the library record */}
          <div style={{ height:120, borderRadius:6, marginBottom:16, background:'linear-gradient(135deg, var(--ink-900) 0%, var(--ink-700) 100%)',
            display:'flex', alignItems:'flex-end', padding:'14px 16px' }}>
            <div>
              <p style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,0.94)', letterSpacing:'-0.02em', lineHeight:1.1 }}>{vn.name}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:3 }}>{[vn.type, vn.city].filter(Boolean).join(' · ')}{vn.preferred ? ' · ★ Preferred' : ''}</p>
            </div>
          </div>
          <VenuePreviewField label="Address"           value={vn.location}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:20 }}>
            <VenuePreviewField label="Capacity"        value={vn.capacity ? `${vn.capacity} guests` : ''}/>
            <VenuePreviewField label="Indoor / Outdoor" value={vn.indoorOutdoor}/>
            <VenuePreviewField label="Ceiling height"  value={vn.ceilingHeight}/>
            <VenuePreviewField label="Freight elevator" value={vn.freightElevQty > 0 ? `${vn.freightElevQty} — ${vn.freightElevDims}` : 'Not available'}/>
          </div>
          <VenuePreviewField label="Loading dock"      value={vn.dockAddress && !/no dedicated/i.test(vn.dockAddress) ? `Available — ${vn.dockAddress}` : 'No dedicated dock'}/>
          <VenuePreviewField label="Parking"           value={vn.vendorParking}/>
          <VenuePreviewField label="Primary venue contact" value={vn.contact ? `${vn.contact}${vn.contactTitle ? ` · ${vn.contactTitle}` : ''}` : ''}/>
          <VenuePreviewField label="Website"           value={vn.website}/>
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={()=>setPreview(null)} style={{ padding:'8px 18px', fontSize:12, fontWeight:500, background:'transparent', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--ink-500)', fontFamily:'var(--font)' }}>Cancel</button>
          <button onClick={()=>onAdd(directoryToProjectVenue(vn))} style={{ padding:'8px 22px', fontSize:12, fontWeight:700, background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Add to Project</button>
        </div>
      </FocusModal>
    )
  }

  /* ── Directory step ── */
  return (
    <FocusModal onClose={onClose} width="720px" maxWidth="760px">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div>
          <h3 style={{ fontSize:16, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em', marginBottom:2 }}>Venue Directory</h3>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{DIRECTORY_VENUES.length} venues saved in the platform · select one to preview</p>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
      </div>

      <div style={{ padding:'14px 24px 10px', flexShrink:0, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input autoFocus placeholder="Search venues, cities…" value={q} onChange={e=>setQ(e.target.value)}
          style={{ flex:1, minWidth:180, fontSize:13, height:32, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none' }}/>
        <select value={city} onChange={e=>setCity(e.target.value)} style={selStyle}>
          {VENUE_CITIES.map(c=><option key={c} value={c}>{c==='All'?'All cities':c}</option>)}
        </select>
        <select value={cap} onChange={e=>setCap(e.target.value)} style={selStyle}>
          {VENUE_CAPACITY.map(c=><option key={c} value={c}>{c==='All'?'Any capacity':c}</option>)}
        </select>
        <select value={io} onChange={e=>setIo(e.target.value)} style={selStyle}>
          {['All','Indoor','Outdoor','Both'].map(c=><option key={c} value={c}>{c==='All'?'Indoor / Outdoor':c}</option>)}
        </select>
      </div>

      <div style={{ overflowY:'auto', padding:'0 24px', flex:1, minHeight:220, maxHeight:'46vh' }}>
        {filtered.map(vn => (
          <div key={vn.id} onClick={()=>setPreview(vn)}
            style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 90px 90px 20px', gap:12, alignItems:'center',
              padding:'11px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='var(--ground-dim)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vn.name}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)' }}>{[vn.type, vn.city].filter(Boolean).join(' · ')}</p>
            </div>
            <p style={{ fontSize:12, color:'var(--ink-500)' }}>Cap. {vn.capacity}</p>
            <p style={{ fontSize:12, color:'var(--ink-400)' }}>{vn.indoorOutdoor}</p>
            <p style={{ fontSize:12, color:'var(--signal-amber-text)', textAlign:'right' }}>{vn.preferred ? '★' : ''}</p>
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{ padding:'36px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>
            No venues match{q ? ` “${q}”` : ''}
          </div>
        )}
      </div>

      <div style={{ padding:'12px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>Can’t find the venue?</p>
        <button onClick={onCreateNew} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, background:'transparent', border:'1px solid var(--border-med)', borderRadius:4, cursor:'pointer', color:'var(--ink-700)', fontFamily:'var(--font)' }}>+ Create new venue</button>
      </div>
    </FocusModal>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Operations page
   ───────────────────────────────────────────────────────── */
export default function Logistics({ currentUser, projectId, isViewOnly, production }) {
  const pid = projectId || 'default'
  const upsertVenueContact = makeVenueContactUpserter(pid)
  const [venue, setVenue] = useLocalState(`logistics_venue_${pid}_v1`, {})
  const [tab, setTab]     = useState('overview')
  const [editingVenue, setEditingVenue] = useState(false)
  const [pickingVenue, setPickingVenue] = useState(false)

  const hasVenue = !!(venue && String(venue.name || '').trim())

  const TABS = [
    { id:'overview',       label:'Overview'       },
    { id:'venue',          label:'Venue'          },
    { id:'load-in-out',    label:'Load-In / Out'  },
    { id:'freight',        label:'Freight'        },
    { id:'building-rules', label:'Building Rules' },
    { id:'contacts',       label:'Contacts'       },
    { id:'photos',         label:'Photos'         },
    { id:'files',          label:'Files'          },
  ]

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Production · Venue</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:10 }}>
              <span style={{ fontWeight:800, color:'var(--ink-900)' }}>Venue</span>
            </h1>
            <PageOwner area="Venue" projectId={projectId}/>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>Manage all venue and operational details for a seamless execution.</p>
          </div>
          {hasVenue && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPickingVenue(true)}
                style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  background:'transparent', color:'var(--ink-500)', border:'1px solid var(--border)',
                  borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                Change venue
              </button>
              <button onClick={() => setEditingVenue(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
                  fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  background:'transparent', color:'var(--ink-700)', border:'1px solid var(--border-med)',
                  borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5V7.5l6-6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
                Edit venue
              </button>
            </div>
          )}
        </div>

        {/* Empty state — no venue attached to this project yet */}
        {!hasVenue && (
          <div style={{ padding:'72px 24px', textAlign:'center', border:'1px dashed var(--border-med)',
            borderRadius:6, background:'var(--ground-dim)' }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ margin:'0 auto 14px', display:'block' }}>
              <path d="M4 26h22M6 26V10l9-6 9 6v16M12 26v-7h6v7" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:5 }}>No Venue Selected</p>
            <p style={{ fontSize:12.5, color:'var(--ink-400)', marginBottom:20 }}>
              Choose a venue from the platform library, or create a new one.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={()=>setPickingVenue(true)}
                style={{ padding:'9px 20px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                Select Venue
              </button>
              <button onClick={()=>setEditingVenue(true)}
                style={{ padding:'9px 20px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  background:'transparent', color:'var(--ink-700)', border:'1px solid var(--border-med)', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                Create New Venue
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        {hasVenue && (
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--ink-900)', marginBottom:24 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 0', marginRight:24, fontSize:13, fontWeight:500, fontFamily:'var(--font)',
              background:'none', border:'none', cursor:'pointer',
              color:tab===t.id?'var(--ink-900)':'var(--ink-400)',
              borderBottom:tab===t.id?'2px solid var(--ink-900)':'2px solid transparent',
              marginBottom:-1.5, transition:'color 0.1s', whiteSpace:'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
        )}

        {/* Tab content */}
        {hasVenue && (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
            {tab==='overview'       && <OverviewTab venue={venue} onTabChange={setTab}/>}
            {tab==='venue'          && <VenueTab key={venue.sourceId || venue.name || 'venue'} venue={venue} onUpdate={setVenue}/>}
            {tab==='load-in-out'    && <LoadInTab projectId={projectId}/>}
            {tab==='freight'        && <FreightTab projectId={projectId}/>}
            {tab==='building-rules' && <BuildingRulesTab venue={venue} onUpdate={setVenue}/>}
            {tab==='contacts'       && <ContactsTab projectId={projectId}/>}
            {tab==='photos'         && <PhotosTab projectId={projectId}/>}
            {tab==='files'          && <FilesTab projectId={projectId}/>}
          </motion.div>
        </AnimatePresence>
        )}

      </motion.div>

      {/* Venue directory — select an existing venue first */}
      <AnimatePresence>
        {pickingVenue && (
          <VenueDirectoryModal key="pick-venue"
            onClose={()=>setPickingVenue(false)}
            onAdd={v=>{ setVenue(v); upsertVenueContact(v); setPickingVenue(false); setTab('venue') }}
            onCreateNew={()=>{ setPickingVenue(false); setEditingVenue(true) }}/>
        )}
      </AnimatePresence>

      {/* Edit venue modal */}
      <AnimatePresence>
        {editingVenue && (
          <FocusModal onClose={() => setEditingVenue(false)} width="82vw" maxWidth="1080px">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 28px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>{hasVenue ? `Edit venue — ${venue.name}` : 'New venue'}</h3>
              <button onClick={() => setEditingVenue(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:24,lineHeight:1 }}>×</button>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:'24px 28px' }}>
              <VenueTab key={venue.sourceId || venue.name || 'new'} venue={venue} onUpdate={v=>setVenue(v)}/>
            </div>
            <div style={{ padding:'14px 28px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
              <button onClick={()=>setEditingVenue(false)} style={{ padding:'9px 20px', fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>Save changes</button>
            </div>
          </FocusModal>
        )}
      </AnimatePresence>
    </div>
  )
}
