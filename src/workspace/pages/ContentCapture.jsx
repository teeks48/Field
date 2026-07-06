import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const PRIORITY     = ['Must-have','High','Medium','Low','If time']
const SHOT_STATUS  = ['Planned','Approved','Captured','Edited']
const SOCIAL_STATUS= ['Not started','Draft','Scheduled','Posted']
const PLATFORMS    = ['Instagram','LinkedIn','TikTok','Twitter / X','Facebook','YouTube']

function pillClass(s) {
  if (['Captured','Posted','Edited'].includes(s))   return 'pill-green'
  if (['Approved','Scheduled'].includes(s))          return 'pill-blue'
  if (['Draft'].includes(s))                         return 'pill-amber'
  return 'pill-neutral'
}
function priorityClass(p) {
  if (p==='Must-have') return 'pill-red'
  if (p==='High')      return 'pill-amber'
  return 'pill-neutral'
}

export default function ContentCapture({ projectId }) {
  const { state, dispatch, derived } = useStore()
  const { content, shotList, socialPlan, staff, vendors } = state
  const { contentR, shotListR } = derived
  const [tab, setTab]           = useState('overview')
  const [addingShot, setAddingShot] = useState(false)
  const [newShot, setNewShot]   = useState({ shot:'', description:'', ownerId:'', priority:'Medium', status:'Planned', notes:'' })
  const [addingSocial, setAddingSocial] = useState(false)
  const [newSocial, setNewSocial] = useState({ platform:'Instagram', content:'', dueDate:'', ownerId:'', status:'Not started', notes:'' })
  const [editShotId, setEditShotId] = useState(null)

  const addShot = () => {
    if (!newShot.shot) return
    dispatch(A.addShotList(newShot))
    setNewShot({ shot:'', description:'', ownerId:'', priority:'Medium', status:'Planned', notes:'' })
    setAddingShot(false)
  }

  const addSocial = () => {
    if (!newSocial.content) return
    dispatch(A.addSocialPlan(newSocial))
    setNewSocial({ platform:'Instagram', content:'', dueDate:'', ownerId:'', status:'Not started', notes:'' })
    setAddingSocial(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header">
          <p className="page-eyebrow">Guest Experience · Content</p>
          <h1 className="page-title">Content Capture</h1>
          <PageOwner area="Content Capture" projectId={projectId}/>
        </div>

        <div className="tabs">
          {[{id:'overview',label:'Overview'},{id:'shotlist',label:`Shot list (${shotList.length})`},{id:'social',label:`Social plan (${socialPlan.length})`}].map(t=>(
            <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
              <div>
                <p className="section-label">Content vendor</p>
                <input value={content?.vendor||''} onChange={e=>dispatch(A.updateContent({vendor:e.target.value}))}
                  placeholder="Vendor name"
                  style={{ width:'100%', fontWeight:500, marginBottom:6 }}/>
                <input value={content?.vendorContact||''} onChange={e=>dispatch(A.updateContent({vendorContact:e.target.value}))}
                  placeholder="Contact name · email"
                  style={{ width:'100%', fontSize:12, color:'var(--ink-500)' }}/>
              </div>
              <div>
                <p className="section-label">Deliverables</p>
                <input value={content?.deliverables||''} onChange={e=>dispatch(A.updateContent({deliverables:e.target.value}))}
                  placeholder="e.g. Photography + video recap · social assets"
                  style={{ width:'100%', fontWeight:500, marginBottom:6 }}/>
                <input value={content?.turnaround||''} onChange={e=>dispatch(A.updateContent({turnaround:e.target.value}))}
                  placeholder="Turnaround e.g. 48hr post-event"
                  style={{ width:'100%', fontSize:12, color:'var(--ink-500)' }}/>
              </div>
            </div>
            <p className="section-label">Brief</p>
            <textarea value={content?.brief||''} onChange={e=>dispatch(A.updateContent({brief:e.target.value}))}
              placeholder="Content brief, objectives, tone of voice, key moments to capture…"
              style={{ width:'100%', minHeight:100, resize:'vertical', lineHeight:1.7 }}/>
          </div>
        )}

        {tab==='shotlist' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
              <p className="section-label" style={{ margin:0 }}>{shotList.length} planned shots · {shotList.filter(s=>s.status==='Captured'||s.status==='Edited').length} captured</p>
              <button className="btn-ghost" onClick={() => setAddingShot(true)}>+ Add shot</button>
            </div>
            {addingShot && (
              <div className="add-row" style={{ marginBottom:14 }}>
                <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 1fr 120px 120px 120px' }}>
                  <div><label className="field-label">Shot</label><input autoFocus placeholder="Shot description" value={newShot.shot} onChange={e=>setNewShot(p=>({...p,shot:e.target.value}))}/></div>
                  <div><label className="field-label">Description</label><input placeholder="Details" value={newShot.description} onChange={e=>setNewShot(p=>({...p,description:e.target.value}))}/></div>
                  <div><label className="field-label">Owner</label><select value={newShot.ownerId} onChange={e=>setNewShot(p=>({...p,ownerId:e.target.value}))}><option value="">—</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div><label className="field-label">Priority</label><select value={newShot.priority} onChange={e=>setNewShot(p=>({...p,priority:e.target.value}))}>{PRIORITY.map(p=><option key={p}>{p}</option>)}</select></div>
                  <div><label className="field-label">Status</label><select value={newShot.status} onChange={e=>setNewShot(p=>({...p,status:e.target.value}))}>{SHOT_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div className="add-row-actions">
                  <button className="btn-primary" onClick={addShot}>Add shot</button>
                  <button className="btn-secondary" onClick={() => setAddingShot(false)}>Cancel</button>
                </div>
              </div>
            )}
            <table className="data-table">
                <thead><tr><th>Shot</th><th>Description</th><th>Owner</th><th>Priority</th><th style={{textAlign:'right'}}>Status</th><th style={{width:32}}></th></tr></thead>
                <tbody>
                  {shotListR.map(s => {
                    const owner = staff.find(st=>st.id===s.ownerId)
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight:500 }}>{s.shot}</td>
                        <td style={{ fontSize:12, color:'var(--ink-400)' }}>{s.description||'—'}</td>
                        <td style={{ fontSize:12, color:'var(--ink-500)' }}>{owner?.name||'—'}</td>
                        <td><span className={`pill ${priorityClass(s.priority)}`}>{s.priority}</span></td>
                        <td style={{ textAlign:'right' }}>
                          <select value={s.status} onChange={e=>dispatch(A.updateShotList(s.id,{status:e.target.value}))}
                            style={{ border:'none', background:'transparent', fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', width:'auto', backgroundImage:'none', padding:0,
                              color: ['Captured','Edited'].includes(s.status)?'var(--signal-green-text)':s.status==='Approved'?'var(--signal-blue-text)':'var(--ink-400)' }}>
                            {SHOT_STATUS.map(st=><option key={st}>{st}</option>)}
                          </select>
                        </td>
                        <td><button onClick={() => dispatch(A.deleteShotList(s.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18 }}>×</button></td>
                      </tr>
                    )
                  })}
                  {shotListR.length===0 && <tr><td colSpan={6} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No shots planned yet</td></tr>}
                </tbody>
              </table>
          </div>
        )}

        {tab==='social' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
              <p className="section-label" style={{ margin:0 }}>{socialPlan.length} planned posts · {socialPlan.filter(s=>s.status==='Posted').length} posted</p>
              <button className="btn-ghost" onClick={() => setAddingSocial(true)}>+ Add post</button>
            </div>
            {addingSocial && (
              <div className="add-row" style={{ marginBottom:14 }}>
                <div className="add-row-grid" style={{ gridTemplateColumns:'120px 1fr 80px 130px 120px' }}>
                  <div><label className="field-label">Platform</label><select value={newSocial.platform} onChange={e=>setNewSocial(p=>({...p,platform:e.target.value}))}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></div>
                  <div><label className="field-label">Content / caption</label><input autoFocus placeholder="Post description" value={newSocial.content} onChange={e=>setNewSocial(p=>({...p,content:e.target.value}))}/></div>
                  <div><label className="field-label">Due date</label><input placeholder="Jul 16" value={newSocial.dueDate} onChange={e=>setNewSocial(p=>({...p,dueDate:e.target.value}))}/></div>
                  <div><label className="field-label">Owner</label><select value={newSocial.ownerId} onChange={e=>setNewSocial(p=>({...p,ownerId:e.target.value}))}><option value="">—</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div><label className="field-label">Status</label><select value={newSocial.status} onChange={e=>setNewSocial(p=>({...p,status:e.target.value}))}>{SOCIAL_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div className="add-row-actions">
                  <button className="btn-primary" onClick={addSocial}>Add post</button>
                  <button className="btn-secondary" onClick={() => setAddingSocial(false)}>Cancel</button>
                </div>
              </div>
            )}
            <table className="data-table">
                <thead><tr><th>Platform</th><th>Content</th><th>Due</th><th>Owner</th><th style={{textAlign:'right'}}>Status</th><th style={{width:32}}></th></tr></thead>
                <tbody>
                  {socialPlan.map(s => {
                    const owner = staff.find(st=>st.id===s.ownerId)
                    return (
                      <tr key={s.id}>
                        <td><span className="pill pill-neutral" style={{ fontSize:10 }}>{s.platform}</span></td>
                        <td style={{ fontSize:12, color:'var(--ink-700)' }}>{s.content}</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-400)' }}>{s.dueDate||'—'}</td>
                        <td style={{ fontSize:12, color:'var(--ink-500)' }}>{owner?.name||'—'}</td>
                        <td style={{ textAlign:'right' }}>
                          <select value={s.status} onChange={e=>dispatch(A.updateSocialPlan(s.id,{status:e.target.value}))}
                            style={{ border:'none', background:'transparent', fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', width:'auto', backgroundImage:'none', padding:0,
                              color: s.status==='Posted'?'var(--signal-green-text)':s.status==='Scheduled'?'var(--signal-blue-text)':s.status==='Draft'?'var(--signal-amber-text)':'var(--ink-400)' }}>
                            {SOCIAL_STATUS.map(st=><option key={st}>{st}</option>)}
                          </select>
                        </td>
                        <td><button onClick={() => dispatch(A.deleteSocialPlan(s.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18 }}>×</button></td>
                      </tr>
                    )
                  })}
                  {socialPlan.length===0 && <tr><td colSpan={6} style={{ padding:'32px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No social posts planned yet</td></tr>}
                </tbody>
              </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
