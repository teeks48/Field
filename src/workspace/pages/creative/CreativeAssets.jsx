import React, { useState, useRef } from 'react'
import { useStore, A } from '../../../store.jsx'
import { TYPE_OPTIONS, typeStyle, statusStyle } from '../creativeShared.jsx'

/**
 * CreativeAssets.jsx — the deliverables table (their "Assets" tab
 * equivalent). Clicking a row jumps to the Specifications tab with
 * that asset selected, via onOpenSpec — no overlay.
 *
 * Creating a new asset starts from a file upload. The uploaded file
 * becomes Version 1 of the deliverable; the designer names the asset
 * themselves (rather than the filename being used verbatim) and picks
 * its Type. Designer is set automatically from whoever's logged in,
 * and Created is stamped automatically — both shown read-only in the
 * table once the asset exists.
 */
export default function CreativeAssets({ onOpenSpec, user }) {
  const { state, dispatch } = useStore()
  const deliverables = state.deliverables.filter(d => d.projectId === state.production.id)
  const [adding,  setAdding]  = useState(false)
  const [file,    setFile]    = useState(null)
  const [name,    setName]    = useState('')
  const [type,    setType]    = useState(TYPE_OPTIONS[0])
  const [due,     setDue]     = useState('')
  const fileInputRef = useRef(null)

  const ownerName = user?.name || 'Unassigned'
  const today = new Date().toISOString().slice(0, 10)

  const resetForm = () => {
    setFile(null); setName(''); setType(TYPE_OPTIONS[0]); setDue('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = e => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const canAdd = file && name.trim().length > 0

  const addDeliverable = () => {
    if (!canAdd) return
    dispatch(A.addDeliverable({
      projectId: state.production.id,
      item:      name.trim(),
      type,
      owner:     ownerName,
      due:       due || 'TBD',
      status:    'Not started',
      imgBg:     '#1E1E1E',
      imgAccent: '#404040',
      comments:  [],
      versions:  [{ v:1, file: file.name, size: file.size, format: file.name.split('.').pop().toUpperCase(), date: today, by: ownerName }],
    }))
    resetForm()
    setAdding(false)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)' }}>
          Assets · {deliverables.length} total
        </p>
        <button onClick={() => setAdding(a => !a)}
          style={{ fontSize:13, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:5 }}>
          + New Asset
        </button>
      </div>

      {adding && (
        <div className="add-row" style={{ marginBottom:14 }}>
          <div className="add-row-grid" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr) 140px 140px', gap:12 }}>
            <div>
              <label className="field-label">File (becomes V1)</label>
              <input ref={fileInputRef} type="file" onChange={handleFileChange}/>
            </div>
            <div>
              <label className="field-label">Asset name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name this asset" />
            </div>
            <div>
              <label className="field-label">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Due date</label>
              <input type="date" value={due} onChange={e => setDue(e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:8 }}>
            Designer will be set to <strong>{ownerName}</strong> automatically.
          </p>
          <div className="add-row-actions">
            <button className="btn-primary" disabled={!canAdd} onClick={addDeliverable}>Add</button>
            <button className="btn-secondary" onClick={() => { resetForm(); setAdding(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {deliverables.length === 0 ? (
        <p style={{ padding:'40px 0', textAlign:'center', fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-200)' }}>No assets yet</p>
      ) : (
        <div style={{ border:'1px solid var(--border)', borderRadius:6, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) 110px minmax(0,1fr) 100px 140px 100px 110px',
            gap:12, padding:'10px 16px', background:'var(--ground-dim)', borderBottom:'1px solid var(--border)' }}>
            {['Asset name','Type','Designer','Created','Status','Due date','Actions'].map(h => (
              <p key={h} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--ink-400)' }}>{h}</p>
            ))}
          </div>
          {deliverables.map(d => {
            const ts = typeStyle(d.type)
            const ss = statusStyle(d.status)
            return (
              <div key={d.id}
                style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) 110px minmax(0,1fr) 100px 140px 100px 110px',
                  gap:12, padding:'12px 16px', alignItems:'center', borderBottom:'1px solid var(--border)' }}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.item}</p>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  color:ts.color, background:ts.bg, padding:'3px 8px', borderRadius:3, width:'fit-content' }}>
                  {d.type || '—'}
                </span>
                <p style={{ fontSize:13, color:'var(--ink-600)' }}>{d.owner}</p>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{d.created || '—'}</p>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  color:ss.color, background:ss.bg, padding:'3px 10px', borderRadius:3, width:'fit-content', whiteSpace:'nowrap' }}>
                  {d.status}
                </span>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{d.due || '—'}</p>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <button onClick={() => onOpenSpec(d.id)}
                    style={{ fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:4, border:'1px solid var(--ink-900)', background:'var(--ink-900)', color:'white', cursor:'pointer', fontFamily:'var(--font)' }}>
                    Spec →
                  </button>
                  <button onClick={() => dispatch(A.deleteDeliverable(d.id))}
                    style={{ fontSize:12, fontWeight:600, color:'var(--signal-amber-text)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ fontSize:12, color:'var(--ink-300)', marginTop:12, fontStyle:'italic' }}>
        Approved items are automatically moved to Fulfillment once marked <em>Production Ready.</em>
      </p>
    </div>
  )
}
