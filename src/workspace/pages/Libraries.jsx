import React, { useState } from 'react'
import { motion } from 'framer-motion'

const VENDOR_LIBRARY = [
  { id:'vl1', name:'Ocubo Digital',       category:'AV / Interactive',  contact:'Sara Mendes',   email:'sara@ocubo.com',          phone:'646-555-0200', website:'ocubo.com',      status:'Preferred', productions:'3', notes:'LED installations, interactive tech. Reliable, premium finish.' },
  { id:'vl2', name:'Eventmakers NYC',     category:'Fabrication',       contact:'Tom Ricci',     email:'tom@eventmakers.com',     phone:'212-555-0201', website:'eventmakers.nyc', status:'Preferred', productions:'5', notes:'Custom furniture, scenic builds. Top tier.' },
  { id:'vl3', name:'Glasshouse Catering', category:'Hospitality / F&B', contact:'Nina Park',     email:'nina@glasshouse.com',     phone:'212-555-0202', website:'glasshousenyc.com',status:'Preferred',productions:'4', notes:'Full-service catering. Excellent service staff.' },
  { id:'vl4', name:'Content Studio',   category:'Content Capture',   contact:'Content Contact', email:'studio@contentco.com',      phone:'917-555-0203', website:'contentco.com',status:'Preferred',productions:'3',notes:'Photography + video. Quick turnaround, brand-quality.' },
  { id:'vl5', name:'Aria Florals',        category:'Florals',           contact:'Cleo Stein',    email:'cleo@ariaflorals.com',    phone:'718-555-0206', website:'ariaflorals.com',  status:'Preferred', productions:'2', notes:'Elevated floral. Architectural + seasonal.' },
  { id:'vl6', name:'Peak Freight',        category:'Logistics',         contact:'Maria Fuentes', email:'maria@peakfreight.com',   phone:'718-555-0205', website:'peakfreight.com',  status:'Active',    productions:'2', notes:'Reliable NYC freight and load-in crew.' },
  { id:'vl7', name:'Walsh Light Design',  category:'Lighting',          contact:'Derek Walsh',   email:'derek@walshlight.com',    phone:'212-555-0210', website:'walshlight.com',   status:'Active',    productions:'1', notes:'Atmospheric lighting. High-end events.' },
  { id:'vl8', name:'Hartley Rentals NYC', category:'Rentals',           contact:'James Hartley', email:'j@hartley.com',           phone:'212-555-0211', website:'hartleyrentals.com',status:'Active',   productions:'3', notes:'Furniture, tableware, flatware, linen rental.' },
]

const VENUE_LIBRARY = [
  { id:'vnl1', name:'Brooklyn Tower, 73F',    location:'Brooklyn, NY',      capacity:'150',  contact:'James Holter',    restrictions:'Exclusive events only. No competing events on floor.', loadIn:'Freight elevator — Flatbush Ave service entrance', insurance:'$5M GL required', notes:'Stunning views, full buy-out on 73F.' },
  { id:'vnl2', name:'Spring Studios NYC',      location:'Tribeca, NY',       capacity:'500',  contact:'Morgan Lee',      restrictions:'Noise curfew 11PM. Street-facing windows must be blacked out.', loadIn:'Loading dock on Laight St', insurance:'$5M GL required', notes:'Versatile raw space. Strong creative heritage.' },
  { id:'vnl3', name:'The Glasshouse',          location:'Hudson Yards, NY',  capacity:'400',  contact:'Alex Reyes',      restrictions:'No confetti. Glassware only — no disposables.', loadIn:'Service elevator, 4-hour window required', insurance:'$5M GL', notes:'All-glass views. Iconic skyline backdrop.' },
  { id:'vnl4', name:'Cipriani 42nd Street',    location:'Midtown, NY',       capacity:'800',  contact:'Francesca Mori',  restrictions:'Strict union labor requirements.', loadIn:'Through 42nd St. service entrance', insurance:'$10M GL required', notes:'Grand ballroom. Classic luxury.' },
  { id:'vnl5', name:'Terminal 5',              location:'Hell\'s Kitchen, NY',capacity:'3000', contact:'Pat Murray',      restrictions:'Concert venue. Stage and rigging included.', loadIn:'West 56th St dock', insurance:'$5M GL', notes:'Best for large-scale activations with live elements.' },
]

const INVENTORY = [
  { id:'inv1', name:'Folding conference tables × 20', category:'Furniture',     qty:20, location:'Storage B, Shelf 3',  condition:'Good',      available:true,  notes:'6ft rectangular. Standard corporate.' },
  { id:'inv2', name:'Bar carts — brushed steel × 4',  category:'Furniture',     qty:4,  location:'Storage B, Shelf 1',  condition:'Excellent', available:true,  notes:'Mobile, ideal for activations.' },
  { id:'inv3', name:'LED strips — warm white (100m)',  category:'Lighting',      qty:5,  location:'AV Cage, Row 2',      condition:'Good',      available:false, notes:'3 rolls currently on loan — Apple production.' },
  { id:'inv4', name:'Branded step-and-repeat frame',   category:'Signage',       qty:2,  location:'Storage A, Shelf 6',  condition:'Good',      available:true,  notes:'8ft × 8ft. Includes banner hardware.' },
  { id:'inv5', name:'Charging stations × 6',           category:'Technology',    qty:6,  location:'AV Cage, Row 1',      condition:'Excellent', available:true,  notes:'Universal. 10-port each.' },
  { id:'inv6', name:'Stanchion set (crowd control)',   category:'Furniture',     qty:12, location:'Storage A, Shelf 2',  condition:'Good',      available:true,  notes:'Velvet rope included.' },
  { id:'inv7', name:'Portable PA system',              category:'AV',            qty:2,  location:'AV Cage, Row 3',      condition:'Good',      available:true,  notes:'QSC K12.2 speakers + mixer.' },
  { id:'inv8', name:'Photo backdrop frame × 3',        category:'Photography',   qty:3,  location:'Storage A, Shelf 5',  condition:'Excellent', available:true,  notes:'Collapsible. Fits standard 8×8 backdrops.' },
]

const CAT_COLORS = { 'AV / Interactive':'var(--signal-blue-bg)', Fabrication:'var(--signal-amber-bg)', 'Hospitality / F&B':'var(--signal-green-bg)', 'Content Capture':'var(--signal-blue-bg)', Florals:'var(--signal-green-bg)', Logistics:'var(--ink-100)', Lighting:'var(--signal-amber-bg)', Rentals:'var(--ink-100)' }

export default function Libraries() {
  const [tab, setTab]       = useState('vendors')
  const [vendorQ, setVQ]    = useState('')
  const [venueQ, setVeQ]    = useState('')
  const [invQ, setIQ]       = useState('')
  const [selectedVendor, setSV] = useState(null)
  const [selectedVenue, setSVe] = useState(null)

  const filteredVendors = VENDOR_LIBRARY.filter(v => !vendorQ || v.name.toLowerCase().includes(vendorQ.toLowerCase()) || v.category.toLowerCase().includes(vendorQ.toLowerCase()))
  const filteredVenues  = VENUE_LIBRARY.filter(v  => !venueQ  || v.name.toLowerCase().includes(venueQ.toLowerCase())  || v.location.toLowerCase().includes(venueQ.toLowerCase()))
  const filteredInv     = INVENTORY.filter(i      => !invQ    || i.name.toLowerCase().includes(invQ.toLowerCase())    || i.category.toLowerCase().includes(invQ.toLowerCase()))

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.28 }}>
        <div className="page-header">
          <h1 className="page-title">Libraries</h1>
          <p className="page-subtitle">Reusable across every production · vendors · venues · inventory</p>
        </div>

        <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
          {[['vendors','Vendor library'],['venues','Venue library'],['inventory','Inventory']].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)}
              style={{ padding:'8px 20px', fontSize:13, fontWeight:500, background:'none', border:'none', cursor:'pointer', color:tab===id?'var(--ink-900)':'var(--ink-400)', borderBottom:tab===id?'2px solid var(--ink-900)':'2px solid transparent', marginBottom:-1, transition:'color 0.12s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* VENDOR LIBRARY */}
        {tab==='vendors' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <input placeholder="Search vendors, categories…" value={vendorQ} onChange={e=>setVQ(e.target.value)}
                style={{ maxWidth:320, fontSize:13 }}/>
              <button style={{ padding:'8px 16px', borderRadius:'var(--r-sm)', fontSize:13, fontWeight:500, background:'var(--ink-900)', color:'white', border:'none', cursor:'pointer', marginLeft:'auto' }}>+ Add vendor</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:16, alignItems:'start' }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Vendor</th><th>Category</th><th>Contact</th><th>Status</th><th>Productions</th></tr></thead>
                  <tbody>
                    {filteredVendors.map(v => (
                      <tr key={v.id} onClick={()=>setSV(selectedVendor?.id===v.id?null:v)} style={{ cursor:'pointer', background:selectedVendor?.id===v.id?'var(--ground-dim)':'transparent' }}>
                        <td style={{ fontWeight:500 }}>{v.name}</td>
                        <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:CAT_COLORS[v.category]||'var(--ink-100)', color:'var(--ink-700)' }}>{v.category}</span></td>
                        <td style={{ color:'var(--ink-500)', fontSize:12 }}>{v.contact}</td>
                        <td><span className={`pill ${v.status==='Preferred'?'pill-green':'pill-neutral'}`}>{v.status}</span></td>
                        <td style={{ color:'var(--ink-500)', textAlign:'center' }}>{v.productions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedVendor && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px 20px 24px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                    <div>
                      <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:5 }}>{selectedVendor.category}</p>
                      <h3 style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>{selectedVendor.name}</h3>
                      <span className={`pill ${selectedVendor.status==='Preferred'?'pill-green':'pill-neutral'}`}>{selectedVendor.status}</span>
                    </div>
                    <button onClick={()=>setSV(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-400)', fontSize:20 }}>×</button>
                  </div>
                  {[['Contact', selectedVendor.contact],['Email', selectedVendor.email],['Phone', selectedVendor.phone],['Website', selectedVendor.website],['Past productions', selectedVendor.productions]].map(([l,v])=>(
                    <div key={l} style={{ marginBottom:12 }}>
                      <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:3 }}>{l}</p>
                      <p style={{ fontSize:13, color:'var(--ink-800)' }}>{v}</p>
                    </div>
                  ))}
                  <div style={{ marginTop:4 }}>
                    <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:4 }}>Notes</p>
                    <p style={{ fontSize:13, color:'var(--ink-600)', lineHeight:1.55 }}>{selectedVendor.notes}</p>
                  </div>
                  <button style={{ marginTop:16, width:'100%', padding:'9px', fontSize:13, fontWeight:500, background:'var(--ink-900)', color:'white', border:'none', borderRadius:'var(--r-md)', cursor:'pointer' }}>
                    Use in this production
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VENUE LIBRARY */}
        {tab==='venues' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <input placeholder="Search venues, locations…" value={venueQ} onChange={e=>setVeQ(e.target.value)} style={{ maxWidth:320, fontSize:13 }}/>
              <button style={{ padding:'8px 16px', borderRadius:'var(--r-sm)', fontSize:13, fontWeight:500, background:'var(--ink-900)', color:'white', border:'none', cursor:'pointer', marginLeft:'auto' }}>+ Add venue</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:16, alignItems:'start' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filteredVenues.map(v => (
                  <div key={v.id} onClick={()=>setSVe(selectedVenue?.id===v.id?null:v)}
                    style={{ background:'var(--surface)', border:`1px solid ${selectedVenue?.id===v.id?'var(--ink-500)':'var(--border)'}`, borderRadius:'var(--r-md)', padding:'14px 16px', cursor:'pointer', transition:'all 0.1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--ground-dim)'}
                    onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{v.name}</p>
                        <p style={{ fontSize:12, color:'var(--ink-400)' }}>{v.location} · Cap. {v.capacity}</p>
                      </div>
                      <p style={{ fontSize:12, color:'var(--ink-500)' }}>{v.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedVenue && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px 20px 24px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={{ fontSize:17, fontWeight:500 }}>{selectedVenue.name}</h3>
                    <button onClick={()=>setSVe(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-400)', fontSize:20 }}>×</button>
                  </div>
                  {[['Location',selectedVenue.location],['Capacity',selectedVenue.capacity],['Contact',selectedVenue.contact],['Load-in',selectedVenue.loadIn],['Insurance',selectedVenue.insurance],['Restrictions',selectedVenue.restrictions],['Notes',selectedVenue.notes]].map(([l,v])=>(
                    <div key={l} style={{ marginBottom:12 }}>
                      <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:3 }}>{l}</p>
                      <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.5 }}>{v}</p>
                    </div>
                  ))}
                  <button style={{ marginTop:8, width:'100%', padding:'9px', fontSize:13, fontWeight:500, background:'var(--ink-900)', color:'white', border:'none', borderRadius:'var(--r-md)', cursor:'pointer' }}>
                    Use as production venue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab==='inventory' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <input placeholder="Search inventory…" value={invQ} onChange={e=>setIQ(e.target.value)} style={{ maxWidth:320, fontSize:13 }}/>
              <button style={{ padding:'8px 16px', borderRadius:'var(--r-sm)', fontSize:13, fontWeight:500, background:'var(--ink-900)', color:'white', border:'none', cursor:'pointer', marginLeft:'auto' }}>+ Add item</button>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Location</th><th>Condition</th><th>Available</th><th>Notes</th></tr></thead>
                <tbody>
                  {filteredInv.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight:500 }}>{item.name}</td>
                      <td><span className="pill pill-neutral" style={{fontSize:11}}>{item.category}</span></td>
                      <td style={{ textAlign:'center' }}>{item.qty}</td>
                      <td style={{ color:'var(--ink-500)', fontSize:12 }}>{item.location}</td>
                      <td style={{ color:'var(--ink-500)' }}>{item.condition}</td>
                      <td>
                        <span className={`pill ${item.available?'pill-green':'pill-red'}`} style={{fontSize:11}}>
                          {item.available ? 'Available' : 'In use'}
                        </span>
                      </td>
                      <td style={{ color:'var(--ink-400)', fontSize:12 }}>{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
