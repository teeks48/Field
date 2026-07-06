import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocalState } from '../../useLocalState.js'

const DEPT_CATS = ['All','Hospitality','Tablescape','Florals','Production','Fabrication','Signage','AV / Tech','Props','Furniture','Miscellaneous']

const INVENTORY = [
  { id:'i01', name:'Folding conference tables × 20',  category:'Furniture',   dept:'Production',   qty:20,  location:'Storage B, Shelf 3',  condition:'Good',      available:true,  production:'—',                    notes:'6ft rectangular.' },
  { id:'i02', name:'Bar carts — brushed steel × 4',   category:'Furniture',   dept:'Hospitality',  qty:4,   location:'Storage B, Shelf 1',  condition:'Excellent', available:true,  production:'—',                    notes:'Mobile, ideal for activations.' },
  { id:'i03', name:'LED strips — warm white (100m)',   category:'AV / Tech',   dept:'AV / Tech',    qty:5,   location:'AV Cage, Row 2',      condition:'Good',      available:false, production:'Apple Vision Pro Dinner',notes:'3 rolls on loan. Return Jul 17.' },
  { id:'i04', name:'Branded step-and-repeat frame',    category:'Signage',     dept:'Signage',      qty:2,   location:'Storage A, Shelf 6',  condition:'Good',      available:true,  production:'—',                    notes:'8ft × 8ft. Includes hardware.' },
  { id:'i05', name:'Charging stations × 6',            category:'AV / Tech',   dept:'AV / Tech',    qty:6,   location:'AV Cage, Row 1',      condition:'Excellent', available:true,  production:'—',                    notes:'Universal. 10-port each.' },
  { id:'i06', name:'Stanchion set (crowd control)',    category:'Props',       dept:'Production',   qty:12,  location:'Storage A, Shelf 2',  condition:'Good',      available:true,  production:'—',                    notes:'Velvet rope included.' },
  { id:'i07', name:'Portable PA system',               category:'AV / Tech',   dept:'AV / Tech',    qty:2,   location:'AV Cage, Row 3',      condition:'Good',      available:true,  production:'—',                    notes:'QSC K12.2 + mixer.' },
  { id:'i08', name:'Photo backdrop frame × 3',         category:'Props',       dept:'Production',   qty:3,   location:'Storage A, Shelf 5',  condition:'Excellent', available:true,  production:'—',                    notes:'Collapsible. 8×8.' },
  { id:'i09', name:'White bouclé chairs × 30',         category:'Furniture',   dept:'Tablescape',   qty:30,  location:'Storage C, Row 1',    condition:'Excellent', available:false, production:'Apple Vision Pro Dinner',notes:'On loan Jul 15–17.' },
  { id:'i10', name:'Champagne flutes × 200',           category:'Glassware',   dept:'Tablescape',   qty:200, location:'Storage C, Row 4',    condition:'Good',      available:true,  production:'—',                    notes:'Crystal. Handle with care.' },
  { id:'i11', name:'Votive candle holders × 300',      category:'Tablescape',  dept:'Tablescape',   qty:300, location:'Storage C, Row 3',    condition:'Good',      available:true,  production:'—',                    notes:'Mercury glass, tea light.' },
  { id:'i12', name:'Oasis floral foam (bulk)',          category:'Florals',     dept:'Florals',      qty:1,   location:'Florals Cabinet',     condition:'Good',      available:true,  production:'—',                    notes:'Various sizes.' },
  { id:'i13', name:'Hand-held radios × 12',             category:'Production',  dept:'Production',   qty:12,  location:'AV Cage, Row 5',      condition:'Good',      available:true,  production:'—',                    notes:'Motorola. Chargers included.' },
  { id:'i14', name:'Event cube displays × 6',           category:'Fabrication', dept:'Fabrication',  qty:6,   location:'Storage D',           condition:'Good',      available:true,  production:'—',                    notes:'Modular. Custom vinyl wraps available.' },
]

export default function InventoryLibrary() {
  const [q, setQ]         = useState('')
  const [dept, setDept]   = useState('All')
  const [editId, setEditId] = useState(null)
  const [items, setItems] = useLocalState('inventory_items_v1', INVENTORY)

  const filtered = items.filter(i => {
    const mq = !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase())
    const md = dept==='All' || i.dept===dept
    return mq && md
  })

  const update = (id, field, val) => setItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i))
  const available = items.filter(i=>i.available).length
  const inUse     = items.filter(i=>!i.available).length

  return (
    <div className="page-content-wide">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Libraries · Global</p>
            <h1 className="page-title-serif">Inventory library</h1>
            <p className="page-subtitle">Agency inventory · {available} available · {inUse} on loan · click any row to edit</p>
          </div>
          <button className="btn-primary">+ Add item</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:20, background:'var(--ground-dim)' }}>
          {[
            { label:'Total items', value:String(items.length) },
            { label:'Available',   value:String(available), highlight:true },
            { label:'On loan',     value:String(inUse), dark:inUse>0 },
          ].map((s,i) => (
            <div key={i} style={{ padding:'11px 14px', borderRight:i<2?'1px solid var(--border)':'none', background:s.dark?'rgba(200,168,64,0.06)':'transparent' }}>
              <p className="section-label" style={{ margin:'0 0 3px', color:s.highlight?'var(--signal-green-text)':s.dark?'var(--signal-amber-text)':'var(--ink-300)' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:s.highlight?'var(--signal-green-text)':s.dark?'var(--signal-amber-text)':'var(--ink-900)', letterSpacing:'-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
          <input placeholder="Search inventory…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:240 }}/>
          <div className="filter-chips" style={{ marginBottom:0 }}>
            {DEPT_CATS.map(c => <button key={c} className={`chip${dept===c?' active':''}`} onClick={() => setDept(c)} style={{ fontSize:10, padding:'3px 9px' }}>{c}</button>)}
          </div>
        </div>

        <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
          <table className="data-table">
            <thead><tr><th>Item</th><th>Dept</th><th style={{textAlign:'center',width:48}}>Qty</th><th>Location</th><th>Condition</th><th>Availability</th><th>Assigned to</th><th>Notes</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                editId===item.id ? (
                  <tr key={item.id} style={{ background:'var(--ground-dim)' }}>
                    <td><input value={item.name} onChange={e=>update(item.id,'name',e.target.value)} style={{ fontSize:12 }} autoFocus/></td>
                    <td><select value={item.dept} onChange={e=>update(item.id,'dept',e.target.value)} style={{ fontSize:11 }}>{DEPT_CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select></td>
                    <td><input type="number" value={item.qty} onChange={e=>update(item.id,'qty',Number(e.target.value))} style={{ textAlign:'center', fontSize:12 }}/></td>
                    <td><input value={item.location} onChange={e=>update(item.id,'location',e.target.value)} style={{ fontSize:11 }}/></td>
                    <td><select value={item.condition} onChange={e=>update(item.id,'condition',e.target.value)} style={{ fontSize:11 }}>{['Excellent','Good','Fair','Needs repair','Retired'].map(c=><option key={c}>{c}</option>)}</select></td>
                    <td><select value={item.available?'Available':'In use'} onChange={e=>update(item.id,'available',e.target.value==='Available')} style={{ fontSize:11 }}><option>Available</option><option>In use</option></select></td>
                    <td><input value={item.production} onChange={e=>update(item.id,'production',e.target.value)} style={{ fontSize:11 }}/></td>
                    <td><button className="btn-primary" style={{ fontSize:10, padding:'4px 10px' }} onClick={() => setEditId(null)}>Done</button></td>
                  </tr>
                ) : (
                  <tr key={item.id} onClick={() => setEditId(item.id)} style={{ cursor:'pointer' }}>
                    <td style={{ fontWeight:500 }}>{item.name}</td>
                    <td style={{ fontSize:11, color:'var(--ink-500)' }}>{item.dept}</td>
                    <td style={{ textAlign:'center', fontWeight:600 }}>{item.qty}</td>
                    <td style={{ fontSize:11, color:'var(--ink-400)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.location}</td>
                    <td style={{ fontSize:12, color:'var(--ink-500)' }}>{item.condition}</td>
                    <td><span className={`pill ${item.available?'pill-green':'pill-amber'}`}>{item.available?'Available':'In use'}</span></td>
                    <td style={{ fontSize:11, color:'var(--ink-400)' }}>{item.production}</td>
                    <td style={{ fontSize:11, color:'var(--ink-300)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.notes}</td>
                  </tr>
                )
              ))}
              {filtered.length===0 && <tr><td colSpan={8} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No items match</td></tr>}
            </tbody>
          </table>
          <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>Click any row to edit · {filtered.length} items shown</p>
        </div>
      </motion.div>
    </div>
  )
}
