import React, { useState } from 'react'
import { motion } from 'framer-motion'

const VENDORS = [
  { id:'vl1', name:'Ocubo Digital',        category:'AV / Interactive',  contact:'Sara Mendes',   email:'sara@ocubo.com',       phone:'646-555-0200', website:'ocubo.com',        status:'Preferred', productions:'3', notes:'LED installations, interactive tech. Reliable, premium finish.' },
  { id:'vl2', name:'Eventmakers NYC',      category:'Fabrication',       contact:'Tom Ricci',     email:'tom@eventmakers.com',  phone:'212-555-0201', website:'eventmakers.nyc',  status:'Preferred', productions:'5', notes:'Custom furniture, scenic builds. Top-tier quality.' },
  { id:'vl3', name:'Glasshouse Catering',  category:'Hospitality / F&B', contact:'Nina Park',     email:'nina@glasshouse.com',  phone:'212-555-0202', website:'glasshousenyc.com',status:'Preferred', productions:'4', notes:'Full-service catering. Excellent service staff.' },
  { id:'vl4', name:'Content Studio',    category:'Content Capture',   contact:'Content Contact', email:'studio@contentco.com',   phone:'917-555-0203', website:'contentco.com',status:'Preferred',productions:'3',notes:'Photography + video. Quick turnaround, brand-quality.' },
  { id:'vl5', name:'Aria Florals',         category:'Florals',           contact:'Cleo Stein',    email:'cleo@ariaflorals.com', phone:'718-555-0206', website:'ariaflorals.com',  status:'Preferred', productions:'2', notes:'Elevated floral design. Architectural + seasonal.' },
  { id:'vl6', name:'Peak Freight',         category:'Logistics',         contact:'Maria Fuentes', email:'maria@peakfreight.com',phone:'718-555-0205', website:'peakfreight.com',  status:'Active',    productions:'2', notes:'Reliable NYC freight and load-in crew.' },
  { id:'vl7', name:'Walsh Light Design',   category:'Lighting',          contact:'Derek Walsh',   email:'derek@walshlight.com', phone:'212-555-0210', website:'walshlight.com',   status:'Active',    productions:'1', notes:'Atmospheric lighting design.' },
  { id:'vl8', name:'Hartley Rentals NYC',  category:'Rentals',           contact:'James Hartley', email:'j@hartley.com',        phone:'212-555-0211', website:'hartleyrentals.com',status:'Active',   productions:'3', notes:'Furniture, tableware, flatware, linen rental.' },
  { id:'vl9', name:'Colorworks Print',     category:'Print',             contact:'Alex Kim',      email:'alex@colorworks.com',  phone:'212-555-0212', website:'colorworksprint.com',status:'Active',  productions:'2', notes:'Large format, vinyl, signage. Fast turnaround.' },
]
const CATS = ['All',...new Set(VENDORS.map(v=>v.category))]

export default function VendorLibrary() {
  const [q, setQ]           = useState('')
  const [cat, setCat]       = useState('All')
  const [selected, setSelected] = useState(null)

  const filtered = VENDORS.filter(v => {
    const mq  = !q || (v.name||'').toLowerCase().includes(q.toLowerCase()) || (v.category||'').toLowerCase().includes(q.toLowerCase())
    const mc  = cat==='All' || v.category===cat
    return mq && mc
  })

  return (
    <div className="page-content-wide">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Libraries · Global</p>
            <h1 className="page-title-serif">Vendor library</h1>
            <p className="page-subtitle">Global vendor roster · reused across productions · {VENDORS.length} vendors</p>
          </div>
          <button className="btn-primary">+ Add vendor</button>
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
          <input placeholder="Search vendors…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:260 }}/>
          <div className="filter-chips" style={{ marginBottom:0 }}>
            {CATS.map(c => <button key={c} className={`chip${cat===c?' active':''}`} onClick={() => setCat(c)} style={{ fontSize:10 }}>{c}</button>)}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:selected?'minmax(0,1fr) 268px':'1fr', gap:20, alignItems:'start' }}>
          <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
            <table className="data-table">
              <thead><tr><th>Vendor</th><th>Category</th><th>Contact</th><th>Phone</th><th>Status</th><th style={{textAlign:'right'}}>Productions</th></tr></thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} onClick={() => setSelected(selected?.id===v.id?null:v)} style={{ cursor:'pointer', background:selected?.id===v.id?'var(--ground-dim)':'transparent' }}>
                    <td style={{ fontWeight:500 }}>{v.name}</td>
                    <td style={{ fontSize:11, color:'var(--ink-400)' }}>{v.category}</td>
                    <td style={{ fontSize:12, color:'var(--ink-500)' }}>{v.contact}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-300)' }}>{v.phone}</td>
                    <td><span className={`pill ${v.status==='Preferred'?'pill-green':'pill-neutral'}`}>{v.status}</span></td>
                    <td style={{ textAlign:'right', fontSize:12, color:'var(--ink-400)' }}>{v.productions}</td>
                  </tr>
                ))}
                {filtered.length===0 && <tr><td colSpan={6} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No vendors match</td></tr>}
              </tbody>
            </table>
          </div>
          {selected && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'18px 20px', position:'sticky', top:60 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <div><p className="page-eyebrow" style={{ marginBottom:5 }}>{selected.category}</p><h3 style={{ fontSize:16, fontWeight:600, letterSpacing:'-0.02em', marginBottom:6 }}>{selected.name}</h3><span className={`pill ${selected.status==='Preferred'?'pill-green':'pill-neutral'}`}>{selected.status}</span></div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:20 }}>×</button>
              </div>
              {[['Contact',selected.contact],['Email',selected.email],['Phone',selected.phone],['Website',selected.website],['Productions',selected.productions]].map(([l,v]) => (
                <div key={l} className="detail-field"><p className="detail-field-label">{l}</p><p className="detail-field-value">{v}</p></div>
              ))}
              <div className="detail-field"><p className="detail-field-label">Notes</p><p className="detail-field-value" style={{ lineHeight:1.55 }}>{selected.notes}</p></div>
              <button className="btn-primary" style={{ width:'100%', marginTop:14, textAlign:'center' }}>Add to this production</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
