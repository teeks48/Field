import React, { useState, useMemo } from 'react'
import { useStore } from '../../../store.jsx'

/**
 * CreativeUploads.jsx — a single cross-asset view of every file uploaded
 * to any deliverable's version history, plus reference images from the
 * Brief. Derived live from real data, not a separate upload tracker.
 */
export default function CreativeUploads() {
  const { state } = useStore()
  const deliverables = state.deliverables.filter(d => d.projectId === state.production.id)
  const brief = state.creativeBrief || { referenceImages: [] }
  const [filter, setFilter] = useState('all') // 'all' | 'versions' | 'reference'

  const versionFiles = useMemo(() => {
    const files = []
    deliverables.forEach(d => {
      ;(d.versions || []).forEach(v => {
        files.push({ key:`${d.id}-v${v.v}`, name:v.file, asset:d.item, type:'Version', versionLabel:`Version_${String(v.v).padStart(2,'0')}`, date:v.date, by:v.by })
      })
    })
    return files
  }, [deliverables])

  const referenceFiles = useMemo(() =>
    (brief.referenceImages || []).map(name => ({ key:`ref-${name}`, name, asset:'Creative Brief', type:'Reference', versionLabel:'', date:'—', by:'' }))
  , [brief.referenceImages])

  const allFiles = [...versionFiles, ...referenceFiles]
  const shown = filter === 'versions' ? versionFiles : filter === 'reference' ? referenceFiles : allFiles

  const filterBtn = (key, label, count) => (
    <button key={key} onClick={() => setFilter(key)}
      style={{ fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
        background: filter===key ? 'var(--ink-900)' : 'var(--surface)',
        color: filter===key ? 'white' : 'var(--ink-500)',
        border:`1px solid ${filter===key ? 'var(--ink-900)' : 'var(--border)'}` }}>
      {label} ({count})
    </button>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)' }}>
          Uploads · {allFiles.length} total
        </p>
        <div style={{ display:'flex', gap:6 }}>
          {filterBtn('all', 'All', allFiles.length)}
          {filterBtn('versions', 'Versions', versionFiles.length)}
          {filterBtn('reference', 'Reference', referenceFiles.length)}
        </div>
      </div>

      {shown.length === 0 ? (
        <p style={{ padding:'40px 0', textAlign:'center', fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-200)' }}>
          No files yet
        </p>
      ) : (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr) 110px 130px',
            gap:16, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
            {['File name','Asset','Type','Uploaded'].map(h => (
              <p key={h} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
            ))}
          </div>
          {shown.map(f => (
            <div key={f.key} style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr) 110px 130px',
              gap:16, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--signal-amber-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</p>
              <p style={{ fontSize:12, color:'var(--ink-600)' }}>{f.asset}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                color: f.type==='Version' ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                background: f.type==='Version' ? 'var(--signal-amber-bg)' : 'var(--ground-dim)',
                padding:'2px 8px', borderRadius:2, width:'fit-content' }}>
                {f.type}{f.versionLabel ? ` · ${f.versionLabel}` : ''}
              </span>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>{f.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
