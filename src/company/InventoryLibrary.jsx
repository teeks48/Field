import React, { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { INVENTORY, INV_CATS, INV_LOCATIONS, INV_CONDITIONS } from './libraryData.js'
import FocusModal from '../components/FocusModal.jsx'
import LibraryPage, { SearchBar, selStyle, ViewToggle, ColHeaders, EmptyState, ConditionBadge } from './LibraryPage.jsx'

function InventoryModal({ item, onClose }) {
  return (
    <FocusModal onClose={onClose} width="580px" maxWidth="620px">
      <div style={{ padding:'22px 28px 16px',borderBottom:'1px solid var(--border)',flexShrink:0 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
          <div>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--ink-300)',marginBottom:6 }}>{item.category}</p>
            <h2 style={{ fontSize:19,fontWeight:700,letterSpacing:'-0.02em',color:'var(--ink-900)',marginBottom:6 }}>{item.name}</h2>
            <ConditionBadge condition={item.condition}/>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--ink-300)',fontSize:22,lineHeight:1 }}>×</button>
        </div>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'20px 28px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22 }}>
          <div>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.11em',textTransform:'uppercase',color:'var(--ink-300)',marginBottom:10 }}>Item details</p>
            {[['Category',item.category],['Quantity',`${item.qty} ${item.unit}`],['Condition',item.condition],
              ['Storage',item.storage],['Dimensions',item.dimensions||'—'],['Purchase year',item.purchaseYear],
              ['Available',item.available?'Yes':'No — currently out']].map(([l,val])=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)' }}>
                <p style={{ fontSize:12,color:'var(--ink-400)' }}>{l}</p>
                <p style={{ fontSize:12,fontWeight:500,color:l==='Available'&&!item.available?'var(--signal-amber-text)':'var(--ink-800)',textAlign:'right' }}>{String(val)}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.11em',textTransform:'uppercase',color:'var(--ink-300)',marginBottom:10 }}>Associated projects</p>
            {item.projects.length>0
              ? item.projects.map(p=><p key={p} style={{ fontSize:13,color:'var(--ink-700)',marginBottom:5 }}>· {p}</p>)
              : <p style={{ fontSize:12,color:'var(--ink-300)',fontStyle:'italic' }}>No project history</p>}
            {item.notes && (
              <>
                <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.11em',textTransform:'uppercase',color:'var(--ink-300)',marginBottom:8,marginTop:18 }}>Notes</p>
                <p style={{ fontSize:13,color:'var(--ink-700)',lineHeight:1.7 }}>{item.notes}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </FocusModal>
  )
}

function InvRow({ item, onClick }) {
  const [hov,setHov]=useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'grid',gridTemplateColumns:'minmax(220px,1fr) 120px 60px 100px 160px 90px 28px',
        gap:14,padding:'12px 0',borderBottom:'1px solid var(--border)',cursor:'pointer',alignItems:'center',
        background:hov?'rgba(0,0,0,0.012)':'transparent',transition:'background 0.1s' }}>
      <div>
        <p style={{ fontSize:13,fontWeight:600,color:'var(--ink-900)',letterSpacing:'-0.01em',marginBottom:1 }}>{item.name}</p>
        <p style={{ fontSize:11,color:'var(--ink-400)' }}>{item.dimensions||'—'}</p>
      </div>
      <p style={{ fontSize:12,color:'var(--ink-600)' }}>{item.category}</p>
      <p style={{ fontSize:13,fontFamily:'var(--font-mono)',color:'var(--ink-700)' }}>{item.qty}</p>
      <ConditionBadge condition={item.condition}/>
      <p style={{ fontSize:12,color:'var(--ink-500)' }}>{item.storage}</p>
      {item.available
        ? <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--signal-green-text)',background:'var(--signal-green-bg)',padding:'2px 8px',borderRadius:2 }}>Available</span>
        : <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--signal-amber-text)',background:'var(--signal-amber-bg)',padding:'2px 8px',borderRadius:2 }}>Out</span>
      }
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity:hov?1:0.25 }}>
        <path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

const COLS=[{label:'Item',width:'minmax(220px,1fr)'},{label:'Category',width:'120px'},{label:'Qty',width:'60px'},{label:'Condition',width:'100px'},{label:'Storage',width:'160px'},{label:'Status',width:'90px'},{label:'',width:'28px'}]

export default function InventoryLibrary() {
  const [query,   setQuery]   = useState('')
  const [cat,     setCat]     = useState('All')
  const [loc,     setLoc]     = useState('All')
  const [avail,   setAvail]   = useState('All')
  const [cond,    setCond]    = useState('All')
  const [view,    setView]    = useState('table')
  const [selected,setSelected]= useState(null)

  const filtered = useMemo(() => INVENTORY.filter(item => {
    if (query.trim()) { const q=query.toLowerCase(); if (!`${item.name} ${item.category} ${item.storage}`.toLowerCase().includes(q)) return false }
    if (cat   !== 'All' && item.category  !== cat)        return false
    if (loc   !== 'All' && item.storage   !== loc)        return false
    if (cond  !== 'All' && item.condition !== cond)       return false
    if (avail === 'Available'    && !item.available)      return false
    if (avail === 'Out of stock' && item.available)       return false
    return true
  }), [query,cat,loc,avail,cond])

  const clear = () => { setQuery(''); setCat('All'); setLoc('All'); setAvail('All'); setCond('All') }
  const totalAvail = INVENTORY.filter(i=>i.available).length

  return (
    <LibraryPage eyebrow="Field · Libraries" title="Inventory" subtitle={`${filtered.length} of ${INVENTORY.length} items · ${totalAvail} currently available`}>
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search items, categories, or storage location…"/>
        <select value={cat}   onChange={e=>setCat(e.target.value)}   style={selStyle}>{INV_CATS.map(c=><option key={c}>{c}</option>)}</select>
        <select value={loc}   onChange={e=>setLoc(e.target.value)}   style={selStyle}>{INV_LOCATIONS.map(l=><option key={l}>{l}</option>)}</select>
        <select value={cond}  onChange={e=>setCond(e.target.value)}  style={selStyle}>{INV_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select>
        <select value={avail} onChange={e=>setAvail(e.target.value)} style={selStyle}>{['All','Available','Out of stock'].map(a=><option key={a}>{a}</option>)}</select>
        <ViewToggle view={view} setView={setView}/>
      </div>
      <p style={{ fontSize:11,color:'var(--ink-300)',marginBottom:16 }}>{filtered.length} of {INVENTORY.length} items</p>

      {view==='table' && (
        <><ColHeaders cols={COLS}/>
          {filtered.map(item=><InvRow key={item.id} item={item} onClick={()=>setSelected(item)}/>)}
          {filtered.length===0 && <EmptyState query={query} onClear={clear}/>}
        </>
      )}
      {view==='cards' && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12 }}>
          {filtered.map(item=>(
            <div key={item.id} onClick={()=>setSelected(item)}
              style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 16px',cursor:'pointer',transition:'all 0.14s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-med)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--ink-400)' }}>{item.category}</p>
                {item.available
                  ? <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--signal-green-text)',background:'var(--signal-green-bg)',padding:'2px 6px',borderRadius:2 }}>In stock</span>
                  : <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--signal-amber-text)',background:'var(--signal-amber-bg)',padding:'2px 6px',borderRadius:2 }}>Out</span>}
              </div>
              <p style={{ fontSize:13,fontWeight:600,color:'var(--ink-900)',letterSpacing:'-0.01em',marginBottom:8,lineHeight:1.35 }}>{item.name}</p>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--ink-400)',paddingTop:8,borderTop:'1px solid var(--border)' }}>
                <span>Qty: {item.qty} {item.unit}</span>
                <ConditionBadge condition={item.condition}/>
              </div>
            </div>
          ))}
          {filtered.length===0 && <EmptyState query={query} onClear={clear}/>}
        </div>
      )}
      <AnimatePresence>{selected && <InventoryModal key={selected.id} item={selected} onClose={()=>setSelected(null)}/>}</AnimatePresence>
    </LibraryPage>
  )
}
