import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const CONTRACT_OPTS = ['TBC','Draft','Sent','Pending','Signed','Confirmed']
const FEE_STATUS_OPTS = ['Unpaid / N/A','TBC','Quoted','Invoice pending','Deposit paid','Paid in full']
function pillClass(s) {
  if (['Signed','Confirmed'].includes(s)) return 'pill-green'
  if (['Sent','Pending'].includes(s))     return 'pill-blue'
  if (s==='TBC')                          return 'pill-neutral'
  return 'pill-amber'
}
function feePillClass(s) {
  if (s==='Paid in full')   return 'pill-green'
  if (s==='Deposit paid')   return 'pill-blue'
  if (s==='Invoice pending')return 'pill-amber'
  if (s==='Unpaid / N/A')   return 'pill-neutral'
  return 'pill-neutral'
}

export default function Talent({ projectId }) {
  const { state, dispatch } = useStore()
  const { talent } = state
  const [expandedId, setExpandedId] = useState(null)
  const [adding, setAdding]         = useState(false)
  const [newItem, setNewItem]       = useState({ name:'', role:'', agency:'', email:'', contract:'TBC', fee:'', feeStatus:'Unpaid / N/A', arrivalTime:'', travel:'', dressingRoom:'', dayOfContact:'', dayOfContactEmail:'', dayOfContactPhone:'', hospitality:'Standard', notes:'' })

  const addItem = () => {
    if (!newItem.name) return
    dispatch(A.addTalent(newItem))
    setNewItem({ name:'', role:'', agency:'', email:'', contract:'TBC', fee:'', feeStatus:'Unpaid / N/A', arrivalTime:'', travel:'', dressingRoom:'', dayOfContact:'', dayOfContactEmail:'', dayOfContactPhone:'', hospitality:'Standard', notes:'' })
    setAdding(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Guest Experience · Talent</p>
            <h1 className="page-title">Talent</h1>
            <PageOwner area="Talent" projectId={projectId}/>
            <p className="page-subtitle">{talent.length} talent · fees · contracts · riders · travel · green room</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(a=>!a)}>+ Add talent</button>
        </div>

        {adding && (
          <div className="add-row" style={{ marginBottom:16 }}>
            <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
              <div><label className="field-label">Name</label><input autoFocus placeholder="Full name" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="field-label">Role / act</label><input placeholder="Role" value={newItem.role} onChange={e=>setNewItem(p=>({...p,role:e.target.value}))}/></div>
              <div><label className="field-label">Agency / company</label><input placeholder="Agency" value={newItem.agency} onChange={e=>setNewItem(p=>({...p,agency:e.target.value}))}/></div>
              <div><label className="field-label">Email</label><input type="email" placeholder="email@" value={newItem.email} onChange={e=>setNewItem(p=>({...p,email:e.target.value}))}/></div>
              <div><label className="field-label">Arrival time</label><input placeholder="5:30 PM" value={newItem.arrivalTime} onChange={e=>setNewItem(p=>({...p,arrivalTime:e.target.value}))}/></div>
              <div><label className="field-label">Fee</label><input placeholder="$10,000" value={newItem.fee} onChange={e=>setNewItem(p=>({...p,fee:e.target.value}))}/></div>
              <div><label className="field-label">Contract status</label><select value={newItem.contract} onChange={e=>setNewItem(p=>({...p,contract:e.target.value}))}>{CONTRACT_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="add-row-actions">
              <button className="btn-primary" onClick={addItem}>Add talent</button>
              <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 130px 100px 80px 28px', gap:14, paddingBottom:9, borderBottom:'1.5px solid var(--ink-900)' }}>
            {['Name','Arrival time','Fee','Status',''].map((h,i) => (
              <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
            ))}
          </div>
          {talent.map(t => {
            const expanded = expandedId===t.id
            return (
              <div key={t.id} style={{ borderBottom:'1px solid var(--border)' }}>
                <div onClick={() => setExpandedId(expanded?null:t.id)}
                  style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 130px 100px 80px 28px', gap:14, padding:'13px 0', cursor:'pointer', alignItems:'center' }}
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft='4px'}
                  onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
                >
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:t.name?'var(--ink-900)':'var(--ink-200)', marginBottom:1 }}>{t.name||'TBC'}</p>
                    <p style={{ fontSize:11, color:'var(--ink-400)' }}>{t.role}{t.agency?` · ${t.agency}`:''}</p>
                  </div>
                  <p style={{ fontSize:11, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{t.arrivalTime||'—'}</p>
                  <p style={{ fontSize:12, fontWeight:600, color:t.fee?'var(--ink-700)':'var(--ink-300)', fontFamily:'var(--font-mono)', fontStyle:t.fee?'normal':'italic' }}>
                    {t.fee || (t.feeStatus==='Unpaid / N/A' ? 'Unpaid' : '—')}
                  </p>
                  <span className={`pill ${pillClass(t.contract)}`}>{t.contract}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform:expanded?'rotate(90deg)':'rotate(0)', transition:'transform 0.16s' }}>
                    <path d="M3 1.5l4 3.5-4 3.5" stroke="var(--ink-200)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {expanded && (
                  <div style={{ padding:'14px 0 18px 0', background:'var(--ground-dim)', borderTop:'1px solid var(--border)' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:12 }}>
                      <div><label className="field-label">Name</label><input value={t.name||''} onChange={e=>dispatch(A.updateTalent(t.id,{name:e.target.value}))} autoFocus/></div>
                      <div><label className="field-label">Role / act</label><input value={t.role||''} onChange={e=>dispatch(A.updateTalent(t.id,{role:e.target.value}))}/></div>
                      <div><label className="field-label">Agency</label><input value={t.agency||''} onChange={e=>dispatch(A.updateTalent(t.id,{agency:e.target.value}))}/></div>
                      <div><label className="field-label">Email</label><input type="email" value={t.email||''} onChange={e=>dispatch(A.updateTalent(t.id,{email:e.target.value}))}/></div>
                      <div><label className="field-label">Arrival time</label><input value={t.arrivalTime||''} onChange={e=>dispatch(A.updateTalent(t.id,{arrivalTime:e.target.value}))}/></div>
                      <div><label className="field-label">Fee</label><input value={t.fee||''} onChange={e=>dispatch(A.updateTalent(t.id,{fee:e.target.value}))} placeholder="$10,000"/></div>
                      <div><label className="field-label">Fee status</label><select value={t.feeStatus||'TBC'} onChange={e=>dispatch(A.updateTalent(t.id,{feeStatus:e.target.value}))}>{FEE_STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
                      <div><label className="field-label">Contract status</label><select value={t.contract||'TBC'} onChange={e=>dispatch(A.updateTalent(t.id,{contract:e.target.value}))}>{CONTRACT_OPTS.map(s=><option key={s}>{s}</option>)}</select></div>
                      <div><label className="field-label">Travel</label><input value={t.travel||''} onChange={e=>dispatch(A.updateTalent(t.id,{travel:e.target.value}))} placeholder="Flight, hotel, etc."/></div>
                      <div><label className="field-label">Green room</label><input value={t.dressingRoom||''} onChange={e=>dispatch(A.updateTalent(t.id,{dressingRoom:e.target.value}))} placeholder="Room assignment"/></div>
                      <div><label className="field-label">Day-of contact</label><input value={t.dayOfContact||''} onChange={e=>dispatch(A.updateTalent(t.id,{dayOfContact:e.target.value}))} placeholder="Assistant / manager name"/></div>
                      <div><label className="field-label">Day-of contact email</label><input type="email" value={t.dayOfContactEmail||''} onChange={e=>dispatch(A.updateTalent(t.id,{dayOfContactEmail:e.target.value}))} placeholder="email@"/></div>
                      <div><label className="field-label">Day-of contact phone</label><input value={t.dayOfContactPhone||''} onChange={e=>dispatch(A.updateTalent(t.id,{dayOfContactPhone:e.target.value}))} placeholder="(555) 555-0100"/></div>
                      <div><label className="field-label">Hospitality</label><input value={t.hospitality||''} onChange={e=>dispatch(A.updateTalent(t.id,{hospitality:e.target.value}))} placeholder="Requirements"/></div>
                      <div style={{ gridColumn:'1/-1' }}><label className="field-label">Notes</label><textarea value={t.notes||''} onChange={e=>dispatch(A.updateTalent(t.id,{notes:e.target.value}))} placeholder="Notes…" style={{ minHeight:60, resize:'vertical' }}/></div>
                    </div>
                    <button className="btn-secondary" style={{ fontSize:10, color:'var(--signal-red-text)', borderColor:'rgba(184,48,48,0.3)' }} onClick={() => dispatch(A.deleteTalent(t.id))}>Remove</button>
                  </div>
                )}
              </div>
            )
          })}
          {talent.length===0 && (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:6 }}>No talent added yet</p>
              <p style={{ fontSize:11, color:'var(--ink-300)' }}>Add talent above — fees, contracts, riders, schedule, green room</p>
            </div>
          )}
      </motion.div>
    </div>
  )
}
