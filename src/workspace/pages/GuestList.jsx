import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const RSVP_OPTS = ['Pending','Confirmed','Declined']
function pillClass(s) {
  if (s==='Confirmed') return 'pill-green'
  if (s==='Declined')  return 'pill-red'
  return 'pill-amber'
}

export default function GuestList({ projectId }) {
  const { state, dispatch } = useStore()
  const { guestList } = state
  const [expandedId, setExpandedId] = useState(null)
  const [adding, setAdding]         = useState(false)
  const [filter, setFilter]         = useState('All')
  const [newItem, setNewItem]       = useState({ name:'', company:'', rsvp:'Pending', plusOne:false, plusOneName:'', table:'', seat:'', dietary:'', notes:'' })

  const addItem = () => {
    if (!newItem.name) return
    dispatch(A.addGuest(newItem))
    setNewItem({ name:'', company:'', rsvp:'Pending', plusOne:false, plusOneName:'', table:'', seat:'', dietary:'', notes:'' })
    setAdding(false)
  }

  const confirmed = guestList.filter(g => g.rsvp==='Confirmed').length
  const pending   = guestList.filter(g => g.rsvp==='Pending').length
  const declined  = guestList.filter(g => g.rsvp==='Declined').length
  const plusOnes  = guestList.filter(g => g.plusOne).length
  const totalHeadcount = confirmed + plusOnes

  const shown = filter==='All' ? guestList : guestList.filter(g => g.rsvp===filter)

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Guest Experience · Guest List</p>
            <h1 className="page-title">Guest List</h1>
            <PageOwner area="Guest List" projectId={projectId}/>
            <p className="page-subtitle">{guestList.length} invited · {confirmed} confirmed · {totalHeadcount} expected headcount</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(a=>!a)}>+ Add guest</button>
        </div>

        {/* Status strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:20, background:'var(--ground-dim)' }}>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Confirmed</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'var(--signal-green-text)' }}>{confirmed}</p>
          </div>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px', color:pending>0?'var(--signal-amber-text)':'var(--ink-300)' }}>Pending</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:pending>0?'var(--signal-amber-text)':'var(--ink-900)' }}>{pending}</p>
          </div>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Declined</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'var(--ink-400)' }}>{declined}</p>
          </div>
          <div style={{ padding:'11px 14px', background:'var(--ink-900)' }}>
            <p className="section-label" style={{ margin:'0 0 3px', color:'rgba(255,255,255,0.28)' }}>Headcount</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.85)' }}>{totalHeadcount}</p>
          </div>
        </div>

        {/* RSVP filter */}
        <div className="filter-chips">
          {['All',...RSVP_OPTS].map(f => (
            <button key={f} className={`chip${filter===f?' active':''}`} onClick={() => setFilter(f)}>
              {f}{f!=='All' ? ` (${guestList.filter(g=>g.rsvp===f).length})` : ''}
            </button>
          ))}
        </div>

        {adding && (
          <div className="add-row" style={{ marginBottom:16 }}>
            <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
              <div><label className="field-label">Name</label><input autoFocus placeholder="Full name" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="field-label">Company / title</label><input placeholder="Company — role" value={newItem.company} onChange={e=>setNewItem(p=>({...p,company:e.target.value}))}/></div>
              <div><label className="field-label">RSVP</label><select value={newItem.rsvp} onChange={e=>setNewItem(p=>({...p,rsvp:e.target.value}))}>{RSVP_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="field-label">Table</label><input placeholder="1" value={newItem.table} onChange={e=>setNewItem(p=>({...p,table:e.target.value}))}/></div>
              <div><label className="field-label">Seat</label><input placeholder="A" value={newItem.seat} onChange={e=>setNewItem(p=>({...p,seat:e.target.value}))}/></div>
              <div><label className="field-label">Dietary</label><input placeholder="None" value={newItem.dietary} onChange={e=>setNewItem(p=>({...p,dietary:e.target.value}))}/></div>
            </div>
            <div className="add-row-actions">
              <button className="btn-primary" onClick={addItem}>Add guest</button>
              <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 90px 60px 100px 100px 28px',
          gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)', marginBottom:0 }}>
          {['Name', 'Table', 'Seat', 'Dietary', 'RSVP', ''].map((h,i) => (
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em',
              textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>

        <div>
          {shown.map(g => {
            const expanded = expandedId===g.id
            return (
              <div key={g.id} style={{ borderBottom:'1px solid var(--border)' }}>
                <div onClick={() => setExpandedId(expanded?null:g.id)}
                  style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 90px 60px 100px 100px 28px', gap:14, padding:'13px 0', cursor:'pointer', alignItems:'center' }}
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft='4px'}
                  onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
                >
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:g.name?'var(--ink-900)':'var(--ink-200)', marginBottom:1 }}>
                      {g.name||'TBC'}{g.plusOne && g.plusOneName ? ` + ${g.plusOneName}` : g.plusOne ? ' +1' : ''}
                    </p>
                    <p style={{ fontSize:11, color:'var(--ink-400)' }}>{g.company}</p>
                  </div>
                  <p style={{ fontSize:11, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{g.table ? `Table ${g.table}` : '—'}</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{g.seat||'—'}</p>
                  <p style={{ fontSize:12, color:g.dietary?'var(--signal-amber-text)':'var(--ink-400)' }}>{g.dietary||'None'}</p>
                  <span className={`pill ${pillClass(g.rsvp)}`}>{g.rsvp}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform:expanded?'rotate(90deg)':'rotate(0)', transition:'transform 0.16s' }}>
                    <path d="M3 1.5l4 3.5-4 3.5" stroke="var(--ink-200)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {expanded && (
                  <div style={{ padding:'14px 0 18px 0', background:'var(--ground-dim)', borderTop:'1px solid var(--border)' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:12 }}>
                      <div><label className="field-label">Name</label><input value={g.name||''} onChange={e=>dispatch(A.updateGuest(g.id,{name:e.target.value}))} autoFocus/></div>
                      <div><label className="field-label">Company / title</label><input value={g.company||''} onChange={e=>dispatch(A.updateGuest(g.id,{company:e.target.value}))}/></div>
                      <div><label className="field-label">RSVP</label><select value={g.rsvp||'Pending'} onChange={e=>dispatch(A.updateGuest(g.id,{rsvp:e.target.value}))}>{RSVP_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
                      <div><label className="field-label">Table</label><input value={g.table||''} onChange={e=>dispatch(A.updateGuest(g.id,{table:e.target.value}))} placeholder="1"/></div>
                      <div><label className="field-label">Seat</label><input value={g.seat||''} onChange={e=>dispatch(A.updateGuest(g.id,{seat:e.target.value}))} placeholder="A"/></div>
                      <div><label className="field-label">Dietary</label><input value={g.dietary||''} onChange={e=>dispatch(A.updateGuest(g.id,{dietary:e.target.value}))} placeholder="None"/></div>
                      <div>
                        <label className="field-label">Plus-one</label>
                        <select value={g.plusOne ? 'Yes' : 'No'} onChange={e=>dispatch(A.updateGuest(g.id,{plusOne: e.target.value==='Yes'}))}>
                          <option>No</option><option>Yes</option>
                        </select>
                      </div>
                      {g.plusOne && (
                        <div><label className="field-label">Plus-one name</label><input value={g.plusOneName||''} onChange={e=>dispatch(A.updateGuest(g.id,{plusOneName:e.target.value}))} placeholder="Guest name"/></div>
                      )}
                      <div style={{ gridColumn:'1/-1' }}><label className="field-label">Notes</label><textarea value={g.notes||''} onChange={e=>dispatch(A.updateGuest(g.id,{notes:e.target.value}))} placeholder="VIP notes, press embargo, allergy details…" style={{ minHeight:60, resize:'vertical' }}/></div>
                    </div>
                    <button className="btn-secondary" style={{ fontSize:10, color:'var(--signal-red-text)', borderColor:'rgba(184,48,48,0.3)' }} onClick={() => dispatch(A.deleteGuest(g.id))}>Remove</button>
                  </div>
                )}
              </div>
            )
          })}
          {shown.length===0 && (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:6 }}>
                {filter==='All' ? 'No guests added yet' : `No ${filter.toLowerCase()} guests`}
              </p>
              <p style={{ fontSize:11, color:'var(--ink-300)' }}>Add guests above — RSVP, table assignment, dietary needs</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
