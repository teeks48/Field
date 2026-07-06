import React, { useState, useRef } from 'react'
import { useStore, A } from '../../../store.jsx'
import { APPROVAL_STAGES, FORMAT_OPTIONS, statusStyle, stageIdx } from '../creativeShared.jsx'

/**
 * CreativeSpecifications.jsx — a real top-level tab (Brief / Assets /
 * Specifications / Uploads / Premier), not an overlay. The asset picker
 * lives on the RIGHT, since the workspace already has its own left
 * sidebar — duplicating that on the left would be redundant.
 */
export default function CreativeSpecifications({ selectedId, onSelect }) {
  const { state, dispatch } = useStore()
  const deliverables = state.deliverables.filter(d => d.projectId === state.production.id)
  const d = deliverables.find(x => x.id === selectedId) || deliverables[0] || null

  if (!d) {
    return (
      <div style={{ padding:'60px 0', textAlign:'center' }}>
        <p style={{ fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-200)' }}>
          No assets yet — add one from the Assets tab first.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:28, maxWidth:'var(--cap-panel)' }}>
      <SpecMain key={d.id} d={d} dispatch={dispatch} state={state}/>
      <AssetPicker deliverables={deliverables} selectedId={d.id} onSelect={onSelect}/>
    </div>
  )
}

/* ─── Main spec content + approval pipeline — left column ──── */
function SpecMain({ d, dispatch, state }) {
  const fileRef = useRef(null)
  const [specDraft, setSpecDraft] = useState({
    copy: d.copy || '',
    width: d.width || '',
    height: d.height || '',
    format: d.format || '',
    producerNotes: d.producerNotes || '',
    milestones: { ...(d.milestones || { forRevision:'', clientReview:'', approved:'' }) },
  })
  const [saved, setSaved] = useState(false)
  const curIdx = stageIdx(d.status)
  const nextSt = APPROVAL_STAGES[curIdx + 1]
  const canAdv = curIdx < APPROVAL_STAGES.length - 1

  const saveSpec = () => {
    dispatch(A.updateDeliverable(d.id, specDraft))
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  // Same cross-page integration logic that lived in the old Assets page —
  // moved here since status changes now happen from the Specifications
  // tab's pipeline bar, not a separate detail overlay.
  const advance = status => {
    dispatch(A.updateDeliverable(d.id, { status }))

    const existingLink = state.approvals.find(a => a.sourceId === d.id && a.sourceType === 'creative')

    if (status === 'Client review') {
      if (existingLink) {
        dispatch(A.updateApproval(existingLink.id, { status:'Pending' }))
      } else {
        dispatch(A.addApproval({
          item: d.item, type:'Creative', category:'Client', ownerId:'', approver:'Client', due:d.due,
          status:'Pending', notes:'Auto-created from Deliverables — sent for client review.',
          sourceId: d.id, sourceType:'creative',
        }))
      }
    } else if (existingLink) {
      if (status === 'Approved' || status === 'Production ready') {
        dispatch(A.updateApproval(existingLink.id, { status:'Approved' }))
      } else if (status === 'Internal review' || status === 'In progress' || status === 'Not started') {
        dispatch(A.deleteApproval(existingLink.id))
      }
    }

    if (status === 'Production ready') {
      const existingAsset = state.assets.find(a => a.sourceId === d.id && a.sourceType === 'creative')
      if (!existingAsset) {
        dispatch(A.addAsset({
          projectId: state.production.id, name:d.item, category:'Digital', version:`v${(d.versions||[]).length || 1}`,
          designer:d.owner, approvedDate:d.due, status:'In production', workstreams:['Creative'],
          printer:'TBD', qty:'TBD', material:'TBD', size:'TBD',
          notes:'Auto-created from Deliverables — production details pending.', sourceId:d.id, sourceType:'creative',
        }))
      }
    } else {
      const existingAsset = state.assets.find(a => a.sourceId === d.id && a.sourceType === 'creative')
      if (existingAsset && existingAsset.printer === 'TBD') {
        dispatch(A.deleteAsset(existingAsset.id))
      }
    }
  }

  return (
    <div>
      {/* Pipeline status bar + advance/back */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        border:'1px solid var(--border)', borderRadius:6, padding:'10px 16px', marginBottom:24 }}>
        <div style={{ display:'flex', gap:6 }}>
          {APPROVAL_STAGES.filter(s => s !== 'Production ready').map(stage => {
            const ss = statusStyle(stage)
            const active = stage === d.status
            return (
              <span key={stage} style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                padding:'4px 10px', borderRadius:3,
                color: active ? ss.color : 'var(--ink-300)',
                background: active ? ss.bg : 'transparent',
                display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background: active ? ss.dot : 'var(--border-med)', flexShrink:0 }}/>
                {stage}
              </span>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {curIdx > 0 && (
            <span onClick={() => advance(APPROVAL_STAGES[curIdx - 1])}
              style={{ fontSize:12, fontWeight:600, color:'var(--ink-400)', cursor:'pointer', fontFamily:'var(--font)',
                display:'flex', alignItems:'center', gap:4 }}>
              ← Back
            </span>
          )}
          {canAdv && (
            <button onClick={() => advance(nextSt)}
              style={{ fontSize:12, fontWeight:700, padding:'7px 14px', background:'var(--signal-amber-dot)', color:'white',
                border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
              → {nextSt}
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:18 }}>
        {d.item}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Designer</p>
          <p style={{ fontSize:13, color:'var(--ink-800)' }}>{d.owner || '—'}</p>
        </div>

        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Copy</p>
          <textarea value={specDraft.copy} onChange={e => setSpecDraft(p => ({ ...p, copy: e.target.value }))}
            placeholder="Text content for this asset…"
            style={{ width:'100%', minHeight:60, resize:'none', fontSize:13, lineHeight:1.6, borderRadius:4, border:'1px solid var(--border)', padding:'9px 11px', outline:'none', fontFamily:'var(--font)' }}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Width</p>
            <input value={specDraft.width} onChange={e => setSpecDraft(p => ({ ...p, width: e.target.value }))} placeholder="e.g. 8ft"
              style={{ width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', outline:'none' }}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Height</p>
            <input value={specDraft.height} onChange={e => setSpecDraft(p => ({ ...p, height: e.target.value }))} placeholder="e.g. 4ft"
              style={{ width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', outline:'none' }}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Format</p>
            <select value={specDraft.format} onChange={e => setSpecDraft(p => ({ ...p, format: e.target.value }))}
              style={{ width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', outline:'none', cursor:'pointer', background:'var(--surface)' }}>
              <option value="">— Format —</option>
              {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Producer notes</p>
          <textarea value={specDraft.producerNotes} onChange={e => setSpecDraft(p => ({ ...p, producerNotes: e.target.value }))}
            placeholder="Add producer notes…"
            style={{ width:'100%', minHeight:70, resize:'none', fontSize:13, lineHeight:1.6, borderRadius:4, border:'1px solid var(--border)', padding:'9px 11px', outline:'none', fontFamily:'var(--font)' }}/>
        </div>

        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }}>Milestone dates</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            {[['forRevision','For revision','var(--signal-amber-text)'],['clientReview','Client review','var(--signal-amber-text)'],['approved','Approved','var(--signal-green-text)']].map(([key,label,color]) => (
              <div key={key}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color, marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }}/>
                  {label}
                </p>
                <input value={specDraft.milestones[key]} onChange={e => setSpecDraft(p => ({ ...p, milestones:{ ...p.milestones, [key]: e.target.value } }))}
                  placeholder="MM/DD/YYYY"
                  style={{ width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', outline:'none' }}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }}>Reference images / site visits</p>
          <div onClick={() => fileRef.current?.click()}
            style={{ border:'1.5px dashed var(--border-med)', borderRadius:6, padding:'28px 0', textAlign:'center', cursor:'pointer' }}>
            <input ref={fileRef} type="file" multiple style={{ display:'none' }}/>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ margin:'0 auto 8px' }}>
              <path d="M8 2v9M3.5 7.5L8 12l4.5-4.5" stroke="var(--ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:3 }}>
              Drop files here or <span style={{ color:'var(--signal-amber-text)', fontWeight:600 }}>click to browse</span>
            </p>
            <p style={{ fontSize:11, color:'var(--ink-300)' }}>PNG, JPG, PDF, AI, EPS, MP4 — up to 50MB</p>
          </div>
        </div>

        <button onClick={saveSpec}
          style={{ width:'100%', padding:'11px', fontSize:12, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
            background: saved ? 'var(--signal-green-dot)' : 'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', transition:'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save specifications'}
        </button>
      </div>
    </div>
  )
}

/* ─── Asset picker — right column, replacing the left sidebar from
   the recording since this platform already has its own left nav ── */
function AssetPicker({ deliverables, selectedId, onSelect }) {
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)',
        marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
        Assets
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {deliverables.map(d => {
          const active = d.id === selectedId
          const ss = statusStyle(d.status)
          return (
            <button key={d.id} onClick={() => onSelect(d.id)}
              style={{ textAlign:'left', padding:'10px 12px', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)',
                background: active ? 'var(--ground-dim)' : 'transparent', border:'none' }}>
              <p style={{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? 'var(--ink-900)' : 'var(--ink-700)', marginBottom:4 }}>{d.item}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                color:ss.color, background:ss.bg, padding:'2px 7px', borderRadius:2 }}>{d.status}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
