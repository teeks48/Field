import React, { useState } from 'react'
import { motion } from 'framer-motion'

const VENUES = [
  { id:'vnl1', name:'Brooklyn Tower, 73F',    location:'Brooklyn, NY',       capacity:'150',  contact:'James Holter',   restrictions:'Exclusive events only.', loadIn:'Freight elevator — Flatbush Ave. 4h window required.', insurance:'$5M GL required + venue add.', notes:'Stunning views. Full buy-out on 73F. No curfew if private.' },
  { id:'vnl2', name:'Spring Studios NYC',      location:'Tribeca, NY',        capacity:'500',  contact:'Morgan Lee',     restrictions:'Noise curfew 11PM. Windows must be blacked out.', loadIn:'Loading dock on Laight St.', insurance:'$5M GL', notes:'Versatile raw space. Strong creative heritage.' },
  { id:'vnl3', name:'The Glasshouse',          location:'Hudson Yards, NY',   capacity:'400',  contact:'Alex Reyes',     restrictions:'No confetti. Glassware only.', loadIn:'Service elevator. 4h booking minimum.', insurance:'$5M GL', notes:'All-glass views. Iconic skyline.' },
  { id:'vnl4', name:'Cipriani 42nd Street',    location:'Midtown, NY',        capacity:'800',  contact:'Francesca Mori', restrictions:'Strict union labor requirements.', loadIn:'42nd St. service entrance.', insurance:'$10M GL required', notes:'Grand ballroom. Classic luxury. Logistically complex.' },
  { id:'vnl5', name:"Terminal 5",              location:"Hell's Kitchen, NY", capacity:'3000', contact:'Pat Murray',     restrictions:'Concert venue. Stage + rigging included.', loadIn:'West 56th St dock.', insurance:'$5M GL', notes:'Best for large-scale activations.' },
]

export default function VenueLibrary() {
  const [q, setQ]           = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = VENUES.filter(v => !q || v.name.toLowerCase().includes(q.toLowerCase()) || v.location.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page-content-wide">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Libraries · Global</p>
            <h1 className="page-title-serif">Venue library</h1>
            <p className="page-subtitle">Global venue roster · load-in notes · COI requirements · {VENUES.length} venues</p>
          </div>
          <button className="btn-primary">+ Add venue</button>
        </div>

        <input placeholder="Search venues, locations…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:300, marginBottom:20 }}/>

        <div style={{ display:'grid', gridTemplateColumns:selected?'minmax(0,1fr) 300px':'1fr', gap:20, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1.5px solid var(--ink-900)' }}>
            {filtered.map((v,i) => (
              <div key={v.id} onClick={() => setSelected(selected?.id===v.id?null:v)}
                style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 120px 100px', gap:16, padding:'13px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', alignItems:'center' }}
                onMouseEnter={e=>e.currentTarget.style.paddingLeft='4px'}
                onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
              >
                <div>
                  <p style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{v.name}</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)' }}>{v.location}</p>
                </div>
                <p style={{ fontSize:12, color:'var(--ink-500)' }}>Cap. {v.capacity}</p>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{v.contact}</p>
              </div>
            ))}
            {filtered.length===0 && <div style={{ padding:'40px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No venues match</div>}
          </div>
          {selected && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'18px 20px', position:'sticky', top:60 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.02em' }}>{selected.name}</h3>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:20 }}>×</button>
              </div>
              {[['Location',selected.location],['Capacity',selected.capacity],['Contact',selected.contact],['Load-in',selected.loadIn],['COI / Insurance',selected.insurance],['Restrictions',selected.restrictions],['Notes',selected.notes]].map(([l,v]) => (
                <div key={l} className="detail-field"><p className="detail-field-label">{l}</p><p className="detail-field-value" style={{ lineHeight:1.5 }}>{v}</p></div>
              ))}
              <button className="btn-primary" style={{ width:'100%', marginTop:14, textAlign:'center' }}>Use as production venue</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
