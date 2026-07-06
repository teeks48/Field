import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const STATUS_OPTS = ['Quoted','Ordered','Confirmed','Delivered']
const CATS = ['Linens','Dishware','Flatware','Glassware','Furniture','Décor','Other']
const IMG_COLORS  = ['#ede8e0','#e8e4dc','#f0ece4','#e5e8e0','#ece8e0','#e0e5e8']
const IMG_HEIGHTS = [180,220,160,200,240,170]

function pillClass(s) {
  if (['Confirmed','Delivered'].includes(s)) return 'pill-green'
  if (s==='Ordered')  return 'pill-blue'
  if (s==='Quoted')   return 'pill-amber'
  return 'pill-neutral'
}

export default function Tablescape() {
  const { state, dispatch } = useStore()
  const { tablescape } = state
  const { items=[] } = tablescape
  const [tab, setTab]       = useState('overview')
  const [catFilter, setCat] = useState('All')
  const [editId, setEditId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ category:'Linens', item:'', vendor:'', qty:'', status:'Quoted', notes:'' })
  const [moodImages, setMoodImages] = useState([
    { id:'tm1', caption:'White bouclé dining chairs — Hartley Rentals ref', color:IMG_COLORS[0], h:IMG_HEIGHTS[0] },
    { id:'tm2', caption:'Ivory linen tablecloth — pressed, floor-length',   color:IMG_COLORS[1], h:IMG_HEIGHTS[1] },
    { id:'tm3', caption:'Brushed brass cocktail tables — reception',         color:IMG_COLORS[2], h:IMG_HEIGHTS[2] },
    { id:'tm4', caption:'Matte silver flatware — full setting',             color:IMG_COLORS[3], h:IMG_HEIGHTS[3] },
    { id:'tm5', caption:'Crystal champagne flute — welcome pour',           color:IMG_COLORS[4], h:IMG_HEIGHTS[4] },
  ])

  const cats   = ['All',...new Set(items.map(i=>i.category))]
  const shown  = catFilter==='All' ? items : items.filter(i=>i.category===catFilter)

  const addItem = () => {
    if (!newItem.item) return
    dispatch(A.addTablescapeItem(newItem))
    setNewItem({ category:'Linens', item:'', vendor:'', qty:'', status:'Quoted', notes:'' })
    setAdding(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header">
          <p className="page-eyebrow">Production · Tablescape</p>
          <h1 className="page-title-serif">Tablescape <span className="page-title-serif-em">&amp; table setting</span></h1>
          <p className="page-subtitle">{tablescape.vendor} · {items.length} items · overview · table setting · moodboard</p>
        </div>

        <div className="tabs">
          {[{id:'overview',label:'Overview'},{id:'setting',label:`Table setting (${items.length})`},{id:'moodboard',label:'Moodboard'}].map(t=>(
            <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
              <div><label className="field-label">Rental vendor</label><p style={{ fontSize:13, fontWeight:500 }}>{tablescape.vendor}</p></div>
              <div><label className="field-label">Delivery</label><p style={{ fontSize:13, fontWeight:500 }}>{tablescape.deliveryDate||'Jul 15, 8:00 AM'}</p></div>
              <div><label className="field-label">Collection items</label><p style={{ fontFamily:'var(--font-serif)', fontSize:22, letterSpacing:'-0.02em' }}>{items.length}</p></div>
            </div>
            <div><label className="field-label">Creative direction</label>
              <textarea value={tablescape.brief} onChange={e=>dispatch(A.updateTablescape({brief:e.target.value}))} style={{ width:'100%', minHeight:80, resize:'vertical', lineHeight:1.65, marginBottom:14 }}/>
            </div>
            <div><label className="field-label">Notes</label>
              <textarea value={tablescape.notes||''} onChange={e=>dispatch(A.updateTablescape({notes:e.target.value}))} style={{ width:'100%', minHeight:56, resize:'vertical', lineHeight:1.65 }}/>
            </div>
          </div>
        )}

        {tab==='setting' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="filter-chips" style={{ marginBottom:0 }}>
                {cats.map(c => <button key={c} className={`chip${catFilter===c?' active':''}`} onClick={() => setCat(c)}>{c}</button>)}
              </div>
              <button className="btn-ghost" onClick={() => setAdding(a=>!a)}>+ Add item</button>
            </div>

            {adding && (
              <div className="add-row" style={{ marginBottom:14 }}>
                <div className="add-row-grid" style={{ gridTemplateColumns:'140px 1fr 1fr 80px 110px' }}>
                  <div><label className="field-label">Category</label><select value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div><label className="field-label">Item</label><input autoFocus placeholder="Item name" value={newItem.item} onChange={e=>setNewItem(p=>({...p,item:e.target.value}))}/></div>
                  <div><label className="field-label">Vendor</label><input placeholder="Vendor" value={newItem.vendor} onChange={e=>setNewItem(p=>({...p,vendor:e.target.value}))}/></div>
                  <div><label className="field-label">Qty</label><input placeholder="Qty" value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:e.target.value}))}/></div>
                  <div><label className="field-label">Status</label><select value={newItem.status} onChange={e=>setNewItem(p=>({...p,status:e.target.value}))}>{STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div className="add-row-actions">
                  <button className="btn-primary" onClick={addItem}>Add</button>
                  <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
              <table className="data-table">
                <thead><tr><th>Item</th><th>Category</th><th>Vendor</th><th style={{width:60}}>Qty</th><th>Notes</th><th style={{textAlign:'right'}}>Status</th><th style={{width:32}}></th></tr></thead>
                <tbody>
                  {shown.map(row => (
                    editId===row.id ? (
                      <tr key={row.id} style={{ background:'var(--ground-dim)' }}>
                        <td><input value={row.item} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{item:e.target.value}))} autoFocus style={{ fontSize:13 }}/></td>
                        <td><select value={row.category} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{category:e.target.value}))} style={{ fontSize:12 }}>{CATS.map(c=><option key={c}>{c}</option>)}</select></td>
                        <td><input value={row.vendor||''} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{vendor:e.target.value}))} style={{ fontSize:12 }}/></td>
                        <td><input value={row.qty||''} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{qty:e.target.value}))} style={{ fontSize:12 }}/></td>
                        <td><input value={row.notes||''} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{notes:e.target.value}))} style={{ fontSize:12 }}/></td>
                        <td><select value={row.status} onChange={e=>dispatch(A.updateTablescapeItem(row.id,{status:e.target.value}))} style={{ fontSize:12 }}>{STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></td>
                        <td><button className="btn-primary" style={{ fontSize:10, padding:'4px 8px' }} onClick={() => setEditId(null)}>Done</button></td>
                      </tr>
                    ) : (
                      <tr key={row.id} onClick={() => setEditId(row.id)} style={{ cursor:'pointer' }}>
                        <td style={{ fontWeight:500 }}>{row.item}</td>
                        <td><span className="pill pill-neutral" style={{ fontSize:10 }}>{row.category}</span></td>
                        <td style={{ fontSize:12, color:'var(--ink-400)' }}>{row.vendor||'—'}</td>
                        <td style={{ fontSize:12, color:'var(--ink-400)' }}>{row.qty||'—'}</td>
                        <td style={{ fontSize:11, color:'var(--ink-300)' }}>{row.notes||'—'}</td>
                        <td style={{ textAlign:'right' }}><span className={`pill ${pillClass(row.status)}`}>{row.status}</span></td>
                        <td><button onClick={e=>{e.stopPropagation();dispatch(A.deleteTablescapeItem(row.id))}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18 }}>×</button></td>
                      </tr>
                    )
                  ))}
                  {shown.length===0 && <tr><td colSpan={7} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No items in this category</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>Click any row to edit inline</p>
          </div>
        )}

        {tab==='moodboard' && (
          <div style={{ columns:'3 240px', gap:12 }}>
            {moodImages.map(img => (
              <div key={img.id} style={{ breakInside:'avoid', marginBottom:12, borderRadius:'var(--r-sm)', overflow:'hidden', border:'1px solid var(--border)', position:'relative' }}>
                <div style={{ background:img.color, height:img.h, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <p style={{ fontSize:11, color:'rgba(0,0,0,0.12)', textAlign:'center', padding:'0 20px' }}>Reference image</p>
                </div>
                <div style={{ padding:'8px 12px', background:'var(--surface)' }}>
                  <p style={{ fontSize:12, color:'var(--ink-800)', lineHeight:1.4 }}>{img.caption}</p>
                </div>
                <button onClick={() => setMoodImages(p=>p.filter(i=>i.id!==img.id))}
                  style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.32)', color:'white', border:'none', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
            ))}
            <div style={{ breakInside:'avoid', height:120, border:'1px dashed var(--border-med)', borderRadius:'var(--r-sm)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <p style={{ fontSize:12, color:'var(--ink-300)', marginBottom:3 }}>+ Add image</p>
              <p style={{ fontSize:10, color:'var(--ink-200)' }}>Drag or click to upload</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
