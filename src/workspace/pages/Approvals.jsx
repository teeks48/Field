import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'
import { readProjectTeam, nameOf } from '../../projectData.js'

const CATEGORY_OPTS = ['Client','Internal','Finance','Creative','Production']
const TYPE_OPTS     = ['Creative','Budget','Vendor','Hospitality','Production','Legal','Other']

/* Clear status workflow — four explicit states. Underlying stored values
   stay compatible with the rest of the app (derived counts, notifications). */
const STATUS_FLOW = [
  { label:'Send to Leadership',  doneLabel:'Sent to Leadership', value:'Submitted'   },
  { label:'In Review',           doneLabel:'In Review',          value:'In progress' },
  { label:'Changes Requested',   doneLabel:'Changes Requested',  value:'Rejected'    },
  { label:'Approved',            doneLabel:'Approved',           value:'Approved'    },
]

/* Friendly display label for any stored status (incl. legacy values) */
function statusLabel(s) {
  if (s==='Submitted')                        return 'Sent to Leadership'
  if (['In progress','Pending'].includes(s))  return 'In Review'
  if (s==='Rejected')                         return 'Changes Requested'
  if (s==='Approved')                         return 'Approved'
  return s || 'Draft'
}

function pillClass(s) {
  if (s==='Approved')                                   return 'pill-green'
  if (s==='Submitted')                                  return 'pill-blue'
  if (['In progress','Pending'].includes(s))            return 'pill-amber'
  if (s==='Rejected')                                   return 'pill-red'
  return 'pill-neutral'
}

function catPillClass(c) {
  if (c==='Client')   return 'pill-blue'
  if (c==='Finance')  return 'pill-green'
  if (c==='Creative') return 'pill-amber'
  return 'pill-neutral'
}

export default function Approvals({ onNavigate, projectId }) {
  const { state, dispatch, derived } = useStore()
  const { approvalsR } = derived
  const { staff } = state                       // legacy fallback for old records only
  const team = readProjectTeam(projectId)       // one team roster — the Team page's records
  const ownerName = ownerId => {
    const t = team.find(m => m._uid === ownerId)
    if (t) return nameOf(t)
    const s = staff.find(x => x.id === ownerId) // resolve legacy store-staff ids
    return s ? s.name : ''
  }

  const [catFilter, setCatFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [adding, setAdding]       = useState(false)
  const [newA, setNewA]           = useState({ item:'', type:'Creative', category:'Client', ownerId:'', approver:'', due:'', status:'Draft', notes:'' })

  const filtered = catFilter==='All' ? approvalsR : approvalsR.filter(a => a.category===catFilter)
  const waiting  = approvalsR.filter(a => ['Pending','Submitted','In progress'].includes(a.status))
  const approved = approvalsR.filter(a => a.status==='Approved')

  const save = () => {
    if (!newA.item) return
    dispatch(A.addApproval(newA))
    setNewA({ item:'', type:'Creative', category:'Client', ownerId:'', approver:'', due:'', status:'Draft', notes:'' })
    setAdding(false)
  }

  return (
    <div className="page-content-full">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        {/* Back — returns to the project dashboard */}
        <button onClick={() => onNavigate && onNavigate('overview')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
            cursor:'pointer', color:'var(--ink-400)', fontSize:12, fontFamily:'var(--font)',
            marginBottom:16, padding:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p className="page-eyebrow">Planning · Approvals</p>
            <h1 className="page-title">Approvals</h1>
            <PageOwner area="Approvals" projectId={projectId}/>
          </div>
          <button className="btn-primary" onClick={() => setAdding(a=>!a)}>+ Add approval</button>
        </div>

        {/* Status strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:20, background:'var(--ground-dim)' }}>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Total</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'var(--ink-900)', letterSpacing:'-0.02em' }}>{approvalsR.length}</p>
          </div>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)', background:waiting.length>0?'rgba(200,168,64,0.06)':'transparent' }}>
            <p className="section-label" style={{ margin:'0 0 3px', color:waiting.length>0?'var(--signal-amber-text)':'var(--ink-300)' }}>Waiting</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:waiting.length>0?'var(--signal-amber-text)':'var(--ink-900)', letterSpacing:'-0.02em' }}>{waiting.length}</p>
          </div>
          <div style={{ padding:'11px 14px', background:'var(--ink-900)' }}>
            <p className="section-label" style={{ margin:'0 0 3px', color:'rgba(255,255,255,0.28)' }}>Approved</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.85)', letterSpacing:'-0.02em' }}>{approved.length}</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="filter-chips">
          {['All',...CATEGORY_OPTS].map(c => (
            <button key={c} className={`chip${catFilter===c?' active':''}`} onClick={() => setCatFilter(c)}>
              {c}{c!=='All' ? ` (${approvalsR.filter(a=>a.category===c).length})` : ''}
            </button>
          ))}
        </div>

        {adding && (
          <div className="add-row" style={{ marginBottom:16 }}>
            <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 120px 120px' }}>
              <div>
                <label className="field-label">Item</label>
                <input autoFocus placeholder="What needs approval?" value={newA.item} onChange={e=>setNewA(p=>({...p,item:e.target.value}))}/>
              </div>
              <div>
                <label className="field-label">Category</label>
                <select value={newA.category} onChange={e=>setNewA(p=>({...p,category:e.target.value}))}>{CATEGORY_OPTS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="field-label">Type</label>
                <select value={newA.type} onChange={e=>setNewA(p=>({...p,type:e.target.value}))}>{TYPE_OPTS.map(t=><option key={t}>{t}</option>)}</select>
              </div>
              <div>
                <label className="field-label">Owner / DRI</label>
                <select value={newA.ownerId} onChange={e=>setNewA(p=>({...p,ownerId:e.target.value}))}><option value="">—</option>{team.map(m=><option key={m._uid} value={m._uid}>{nameOf(m)}</option>)}</select>
              </div>
              <div>
                <label className="field-label">Approver</label>
                <input placeholder="Who approves?" value={newA.approver} onChange={e=>setNewA(p=>({...p,approver:e.target.value}))}/>
              </div>
              <div>
                <label className="field-label">Due date</label>
                <input placeholder="Jul 3" value={newA.due} onChange={e=>setNewA(p=>({...p,due:e.target.value}))}/>
              </div>
            </div>
            <div className="add-row-actions">
              <button className="btn-primary" onClick={save}>Add approval</button>
              <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        <table className="data-table">
            <thead><tr>
              <th style={{width:28}}>#</th>
              <th>Item</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Approver</th>
              <th>Due</th>
              <th style={{textAlign:'right'}}>Status</th>
              <th style={{width:32}}></th>
            </tr></thead>
            <tbody>
              {filtered.map((a, idx) => {
                const expanded = expandedId===a.id
                const ownerLabel = ownerName(a.ownerId)
                return (
                  <React.Fragment key={a.id}>
                    <tr onClick={() => setExpandedId(expanded?null:a.id)} style={{ cursor:'pointer', background:expanded?'var(--ground-dim)':'transparent' }}>
                      <td style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, letterSpacing:'-0.04em', color:'var(--ink-200)' }}>{String(idx+1).padStart(2,'0')}</td>
                      <td style={{ fontWeight:500 }}>{a.item}</td>
                      <td><span className={`pill ${catPillClass(a.category)}`}>{a.category}</span></td>
                      <td style={{ fontSize:12, color:'var(--ink-500)' }}>{ownerLabel||'—'}</td>
                      <td style={{ fontSize:12, color:'var(--ink-500)' }}>{a.approver||'—'}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-400)' }}>{a.due||'—'}</td>
                      <td style={{ textAlign:'right' }}>
                        <span className={`pill ${pillClass(a.status)}`}>{statusLabel(a.status)}</span>
                      </td>
                      <td><button onClick={e=>{e.stopPropagation();dispatch(A.deleteApproval(a.id))}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18 }}>×</button></td>
                    </tr>
                    {expanded && (
                      <tr style={{ background:'var(--ground-dim)' }}>
                        <td colSpan={8} style={{ padding:'14px 0 16px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:12 }}>
                            <div>
                              <label className="field-label">Notes</label>
                              <textarea value={a.notes||''} onChange={e=>dispatch(A.updateApproval(a.id,{notes:e.target.value}))}
                                placeholder="Approval notes…" style={{ minHeight:60, resize:'vertical', fontSize:12 }}/>
                            </div>
                            <div>
                              <label className="field-label">Type</label>
                              <select value={a.type||''} onChange={e=>dispatch(A.updateApproval(a.id,{type:e.target.value}))}>{TYPE_OPTS.map(t=><option key={t}>{t}</option>)}</select>
                            </div>
                            <div>
                              <label className="field-label">Due date</label>
                              <input value={a.due||''} onChange={e=>dispatch(A.updateApproval(a.id,{due:e.target.value}))} placeholder="Jul 3"/>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {STATUS_FLOW.map(s => {
                              const active = a.status === s.value
                                || (s.value === 'In progress' && a.status === 'Pending')
                              return (
                                <button key={s.value}
                                  className={active ? 'btn-primary' : 'btn-secondary'}
                                  style={{ fontSize:10 }}
                                  onClick={() => dispatch(A.updateApproval(a.id,{status:s.value}))}>
                                  {active ? `✓ ${s.doneLabel}` : s.label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {filtered.length===0 && <tr><td colSpan={8} style={{ padding:'40px 0', textAlign:'center', color:'var(--ink-300)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14 }}>No approvals in this category</td></tr>}
            </tbody>
          </table>
        <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>Click any row to expand · use the status buttons to update</p>
      </motion.div>
    </div>
  )
}
