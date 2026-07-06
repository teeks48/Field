import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const STATUS_OPTS = ['Not ordered','Pending','Ordered','In transit','Delivered','Cancelled']
const CATEGORIES  = ['Decor','Tabletop','Print','Signage','Props','Supplies','Rentals','Other']
const fmt = n => n ? '$'+Number(n).toLocaleString() : '—'

function pillClass(s) {
  if (s==='Delivered')                      return 'pill-green'
  if (['Ordered','In transit'].includes(s)) return 'pill-blue'
  if (s==='Pending')                        return 'pill-amber'
  if (s==='Cancelled')                      return 'pill-red'
  return 'pill-neutral'
}

export default function Shopping() {
  const { state, dispatch } = useStore()
  const { shopping, staff } = state
  const [filterCat, setFilterCat] = useState('All')
  const [adding, setAdding]       = useState(false)
  const [editId, setEditId]       = useState(null)
  const [newItem, setNewItem]     = useState({ item:'', category:'Decor', vendor:'', qty:'', amount:0, ownerId:'', status:'Not ordered', notes:'' })

  const total     = shopping.reduce((s,i)=>s+(Number(i.amount)||0),0)
  const delivered = shopping.filter(i=>i.status==='Delivered').length
  const cats      = ['All',...new Set(shopping.map(i=>i.category))]
  const shown     = filterCat==='All' ? shopping : shopping.filter(i=>i.category===filterCat)

  const addItem = () => {
    if (!newItem.item) return
    dispatch(A.addShopping(newItem))
    setNewItem({ item:'', category:'Decor', vendor:'', qty:'', amount:0, ownerId:'', status:'Not ordered', notes:'' })
    setAdding(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Production · Shopping</p>
            <h1 className="page-title-serif">Shopping <span className="page-title-serif-em">&amp; procurement</span></h1>
            <p className="page-subtitle">{shopping.length} items · {delivered} delivered · {fmt(total)} total</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(a=>!a)}>+ Add item</button>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:20, background:'var(--ground-dim)' }}>
          {[
            { label:'Total items',  value:String(shopping.length) },
            { label:'Ordered',      value:String(shopping.filter(i=>['Ordered','In transit'].includes(i.status)).length) },
            { label:'Delivered',    value:String(delivered), highlight:delivered>0 },
            { label:'Total spend',  value:fmt(total), dark:true },
          ].map((s,i) => (
            <div key={i} style={{ padding:'11px 14px', borderRight:i<3?'1px solid var(--border)':'none', background:s.dark?'var(--ink-900)':'transparent' }}>
              <p className="section-label" style={{ margin:'0 0 3px', color:s.dark?'rgba(255,255,255,0.28)':s.highlight?'var(--signal-green-text)':'var(--ink-300)' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:s.dark?'white':s.highlight?'var(--signal-green-text)':'var(--ink-900)', letterSpacing:'-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="filter-chips">
          {cats.map(c => <button key={c} className={`chip${filterCat===c?' active':''}`} onClick={() => setFilterCat(c)}>{c}</button>)}
        </div>

        {adding && (
          <div className="add-row" style={{ marginBottom:14 }}>
            <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 120px 1fr 60px 100px 130px 120px' }}>
              <div><label className="field-label">Item</label><input autoFocus placeholder="Item description" value={newItem.item} onChange={e=>setNewItem(p=>({...p,item:e.target.value}))}/></div>
              <div><label className="field-label">Category</label><select value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="field-label">Vendor</label><input placeholder="Vendor" value={newItem.vendor} onChange={e=>setNewItem(p=>({...p,vendor:e.target.value}))}/></div>
              <div><label className="field-label">Qty</label><input placeholder="—" value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:e.target.value}))}/></div>
              <div><label className="field-label">Amount</label><input type="number" placeholder="$0" value={newItem.amount||''} onChange={e=>setNewItem(p=>({...p,amount:Number(e.target.value)}))} style={{ textAlign:'right' }}/></div>
              <div><label className="field-label">Owner</label><select value={newItem.ownerId} onChange={e=>setNewItem(p=>({...p,ownerId:e.target.value}))}><option value="">—</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="field-label">Status</label><select value={newItem.status} onChange={e=>setNewItem(p=>({...p,status:e.target.value}))}>{STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="add-row-actions">
              <button className="btn-primary" onClick={addItem}>Add item</button>
              <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
          <table className="data-table">
            <thead><tr><th>Item</th><th>Category</th><th>Vendor</th><th style={{width:48}}>Qty</th><th style={{textAlign:'right'}}>Amount</th><th>Owner</th><th>Notes</th><th style={{textAlign:'right'}}>Status</th><th style={{width:32}}></th></tr></thead>
            <tbody>
              {shown.map(item => {
                const owner = staff.find(s=>s.id===item.ownerId)
                if (editId===item.id) return (
                  <tr key={item.id} style={{ background:'var(--ground-dim)' }}>
                    <td><input value={item.item} onChange={e=>dispatch(A.updateShopping(item.id,{item:e.target.value}))} autoFocus style={{ fontSize:13 }}/></td>
                    <td><select value={item.category} onChange={e=>dispatch(A.updateShopping(item.id,{category:e.target.value}))} style={{ fontSize:12 }}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></td>
                    <td><input value={item.vendor||''} onChange={e=>dispatch(A.updateShopping(item.id,{vendor:e.target.value}))} style={{ fontSize:12 }}/></td>
                    <td><input value={item.qty||''} onChange={e=>dispatch(A.updateShopping(item.id,{qty:e.target.value}))} style={{ fontSize:12 }}/></td>
                    <td><input type="number" value={item.amount||''} onChange={e=>dispatch(A.updateShopping(item.id,{amount:Number(e.target.value)}))} style={{ textAlign:'right', fontSize:12 }}/></td>
                    <td><select value={item.ownerId||''} onChange={e=>dispatch(A.updateShopping(item.id,{ownerId:e.target.value}))} style={{ fontSize:12 }}><option value="">—</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                    <td><input value={item.notes||''} onChange={e=>dispatch(A.updateShopping(item.id,{notes:e.target.value}))} style={{ fontSize:12 }}/></td>
                    <td><select value={item.status} onChange={e=>dispatch(A.updateShopping(item.id,{status:e.target.value}))} style={{ fontSize:12 }}>{STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></td>
                    <td><button className="btn-primary" style={{ fontSize:10, padding:'4px 8px' }} onClick={() => setEditId(null)}>Done</button></td>
                  </tr>
                )
                return (
                  <tr key={item.id} onClick={() => setEditId(item.id)} style={{ cursor:'pointer' }}>
                    <td style={{ fontWeight:500 }}>{item.item}</td>
                    <td><span className="pill pill-neutral" style={{ fontSize:10 }}>{item.category}</span></td>
                    <td style={{ fontSize:12, color:'var(--ink-400)' }}>{item.vendor||'—'}</td>
                    <td style={{ fontSize:12, color:'var(--ink-400)' }}>{item.qty||'—'}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:500 }}>{fmt(item.amount)}</td>
                    <td style={{ fontSize:12, color:'var(--ink-500)' }}>{owner?.name||'—'}</td>
                    <td style={{ fontSize:11, color:'var(--ink-300)' }}>{item.notes||'—'}</td>
                    <td style={{ textAlign:'right' }}>
                      <select value={item.status} onClick={e=>e.stopPropagation()} onChange={e=>dispatch(A.updateShopping(item.id,{status:e.target.value}))}
                        style={{ border:'none', background:'transparent', fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', width:'auto', backgroundImage:'none', padding:0,
                          color: item.status==='Delivered'?'var(--signal-green-text)':['Ordered','In transit'].includes(item.status)?'var(--signal-blue-text)':item.status==='Pending'?'var(--signal-amber-text)':item.status==='Cancelled'?'var(--signal-red-text)':'var(--ink-400)' }}>
                        {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><button onClick={e=>{e.stopPropagation();dispatch(A.deleteShopping(item.id))}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18 }}>×</button></td>
                  </tr>
                )
              })}
              {shown.length===0 && <tr><td colSpan={9} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No items in this category</td></tr>}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>Click any row to edit inline · status column updates without opening row</p>
      </motion.div>
    </div>
  )
}
