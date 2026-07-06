import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const STATUS_OPTS = ['In production','Ready to print','Sent to vendor','Delivered','Archived']
const stageIdx = s => STATUS_OPTS.indexOf(s)

function pillStyle(s) {
  if (s === 'Delivered')      return { color:'var(--signal-green-text)',  bg:'var(--signal-green-bg)'  }
  if (s === 'Ready to print') return { color:'var(--signal-blue-text)',   bg:'var(--signal-blue-bg)'   }
  if (s === 'Sent to vendor') return { color:'var(--signal-amber-text)',  bg:'var(--signal-amber-bg)'  }
  if (s === 'Archived')       return { color:'var(--ink-300)',            bg:'var(--ground-dim)'       }
  return { color:'var(--ink-400)', bg:'var(--ground-dim)' }
}

/* ─── Asset list — the "table" view before selecting an asset ── */
function AssetList({ assets, onOpen }) {
  const [catFilter, setCat] = useState('All')
  const cats    = ['All', ...new Set(assets.map(a => a.category))]
  const shown   = catFilter === 'All' ? assets : assets.filter(a => a.category === catFilter)
  const delivered = assets.filter(a => a.status === 'Delivered').length

  return (
    <div>
      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--border)',
        borderRadius:6, overflow:'hidden', marginBottom:20, background:'var(--ground-dim)' }}>
        {[
          { label:'Total assets',  value:String(assets.length),                                                                    dark:true },
          { label:'In production', value:String(assets.filter(a => a.status==='In production').length) },
          { label:'With vendors',  value:String(assets.filter(a => ['Ready to print','Sent to vendor'].includes(a.status)).length) },
          { label:'Delivered',     value:String(delivered), highlight: delivered > 0 },
        ].map((s, i) => (
          <div key={i} style={{ padding:'11px 14px', borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            background: s.dark ? 'var(--ink-900)' : 'transparent' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 3px',
              color: s.dark ? 'rgba(255,255,255,0.28)' : s.highlight ? 'var(--signal-green-text)' : 'var(--ink-300)' }}>{s.label}</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.02em',
              color: s.dark ? 'white' : s.highlight ? 'var(--signal-green-text)' : 'var(--ink-900)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category filters */}
      <div className="filter-chips" style={{ marginBottom:16 }}>
        {cats.map(c => (
          <button key={c} className={`chip${catFilter===c?' active':''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.8fr) 120px 80px minmax(0,1fr) 90px minmax(0,1fr) 130px',
          gap:12, padding:'10px 16px', background:'var(--ground-dim)', borderBottom:'1px solid var(--border)' }}>
          {['Asset','Category','Version','Designer','Approved','Workstreams','Status'].map(h => (
            <p key={h} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--ink-400)' }}>{h}</p>
          ))}
        </div>
        {shown.length === 0 ? (
          <p style={{ padding:'40px 0', textAlign:'center', fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-200)' }}>
            No assets in this category
          </p>
        ) : shown.map(a => {
          const ps = pillStyle(a.status)
          return (
            <div key={a.id} onClick={() => onOpen(a.id)}
              style={{ display:'grid', gridTemplateColumns:'minmax(0,1.8fr) 120px 80px minmax(0,1fr) 90px minmax(0,1fr) 130px',
                gap:12, padding:'12px 16px', alignItems:'center', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--ground-dim)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {a.name}
                {a.printer === 'TBD' && (
                  <span style={{ marginLeft:8, fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                    color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 6px', borderRadius:2 }}>
                    Needs details
                  </span>
                )}
              </p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                color:'var(--ink-400)', background:'var(--ground-dim)', padding:'3px 8px', borderRadius:3, width:'fit-content' }}>
                {a.category}
              </span>
              <p style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--ink-400)' }}>{a.version}</p>
              <p style={{ fontSize:13, color:'var(--ink-600)' }}>{a.designer}</p>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>{a.approvedDate}</p>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>{a.workstreams?.join(', ')}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                color:ps.color, background:ps.bg, padding:'3px 10px', borderRadius:3, width:'fit-content', whiteSpace:'nowrap' }}>
                {a.status}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:10, fontStyle:'italic' }}>
        Items populate automatically when a deliverable reaches Production ready · click any row for production details
      </p>
    </div>
  )
}

/* ─── Asset picker — right sidebar, mirrors Deliverables/Specifications ── */
function AssetPicker({ assets, selectedId, onSelect }) {
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)',
        marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
        Assets
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {assets.map(a => {
          const active = a.id === selectedId
          const ps = pillStyle(a.status)
          return (
            <button key={a.id} onClick={() => onSelect(a.id)}
              style={{ textAlign:'left', padding:'10px 12px', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)',
                background: active ? 'var(--ground-dim)' : 'transparent', border:'none' }}>
              <p style={{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? 'var(--ink-900)' : 'var(--ink-700)', marginBottom:4 }}>{a.name}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                color:ps.color, background:ps.bg, padding:'2px 7px', borderRadius:2 }}>{a.status}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Asset detail — main content when an asset is selected ── */
function AssetDetail({ a, dispatch }) {
  const [draft, setDraft] = useState({
    printer:  a.printer  === 'TBD' ? '' : (a.printer  || ''),
    qty:      a.qty      === 'TBD' ? '' : (a.qty      || ''),
    material: a.material === 'TBD' ? '' : (a.material || ''),
    size:     a.size     === 'TBD' ? '' : (a.size     || ''),
    notes:    a.notes    || '',
  })
  const [saved, setSaved] = useState(false)
  const curIdx = stageIdx(a.status)
  const canAdv = curIdx < STATUS_OPTS.length - 1

  const save = () => {
    dispatch(A.updateAsset(a.id, {
      printer:  draft.printer  || 'TBD',
      qty:      draft.qty      || 'TBD',
      material: draft.material || 'TBD',
      size:     draft.size     || 'TBD',
      notes:    draft.notes,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div>
      {/* Production pipeline bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        border:'1px solid var(--border)', borderRadius:6, padding:'10px 16px', marginBottom:24 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUS_OPTS.map(stage => {
            const ps = pillStyle(stage)
            const active = stage === a.status
            return (
              <span key={stage} style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                padding:'4px 10px', borderRadius:3,
                color: active ? ps.color : 'var(--ink-300)',
                background: active ? ps.bg : 'transparent',
                display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:5, height:5, borderRadius:'50%',
                  background: active ? ps.color : 'var(--border-med)', flexShrink:0 }}/>
                {stage}
              </span>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          {curIdx > 0 && (
            <span onClick={() => dispatch(A.updateAsset(a.id, { status: STATUS_OPTS[curIdx - 1] }))}
              style={{ fontSize:12, fontWeight:600, color:'var(--ink-400)', cursor:'pointer', fontFamily:'var(--font)',
                display:'flex', alignItems:'center', gap:4 }}>
              ← Back
            </span>
          )}
          {canAdv && (
            <button onClick={() => dispatch(A.updateAsset(a.id, { status: STATUS_OPTS[curIdx + 1] }))}
              style={{ fontSize:12, fontWeight:700, padding:'7px 14px', background:'var(--signal-amber-dot)', color:'white',
                border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', whiteSpace:'nowrap' }}>
              → {STATUS_OPTS[curIdx + 1]}
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:18 }}>
        {a.name}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Read-only info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {[['Designer', a.designer], ['Version', a.version], ['Approved', a.approvedDate]].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>{label}</p>
              <p style={{ fontSize:13, color:'var(--ink-800)' }}>{val || '—'}</p>
            </div>
          ))}
        </div>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>Workstreams</p>
          <p style={{ fontSize:13, color:'var(--ink-800)' }}>{a.workstreams?.join(', ') || '—'}</p>
        </div>

        {/* Editable production fields */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[['Print vendor','printer','e.g. Colorworks Print'],['Quantity','qty','e.g. 250'],['Material','material','e.g. 300gsm cotton'],['Size','size','e.g. 5×7"']].map(([label, key, placeholder]) => (
              <div key={key}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>{label}</p>
                <input value={draft[key]} placeholder={placeholder}
                  onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width:'100%', fontSize:13, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', outline:'none' }}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:6 }}>Notes</p>
          <textarea value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))}
            placeholder="Production notes…"
            style={{ width:'100%', minHeight:80, resize:'none', fontSize:13, lineHeight:1.6, borderRadius:4,
              border:'1px solid var(--border)', padding:'9px 11px', outline:'none', fontFamily:'var(--font)' }}/>
        </div>

        <button onClick={save}
          style={{ width:'100%', padding:'11px', fontSize:12, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
            background: saved ? 'var(--signal-green-dot)' : 'var(--ink-900)', color:'white', border:'none',
            borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', transition:'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save details'}
        </button>

        {a.status === 'Delivered' && (
          <button className="btn-primary" style={{ width:'100%', textAlign:'center' }}>
            ↓ Download file
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Page root ─────────────────────────────────────────────── */
export default function Assets({ projectId }) {
  const { state, dispatch } = useStore()
  const assets = state.assets.filter(a => a.projectId === state.production.id)
  const [selectedId, setSelectedId] = useState(null)
  const selected = assets.find(a => a.id === selectedId) || null

  return (
    <div style={{ padding:'36px 72px 80px', width:'100%', fontFamily:'var(--font)' }}>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Page header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>
              Production · Fulfillment
            </p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:800, letterSpacing:'-0.03em', color:'var(--ink-900)' }}>
              Fulfillment
            </h1>
            <PageOwner area="Fulfillment" projectId={projectId}/>
          </div>
          {selected && (
            <button onClick={() => setSelectedId(null)}
              style={{ fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'none', border:'1px solid var(--border)',
                borderRadius:4, padding:'7px 14px', cursor:'pointer', fontFamily:'var(--font)' }}>
              ← All assets
            </button>
          )}
        </div>

        {/* Content: list view or detail+picker view */}
        {!selected ? (
          <AssetList assets={assets} onOpen={id => setSelectedId(id)}/>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:28, maxWidth:'var(--cap-panel)' }}>
            <AssetDetail key={selected.id} a={selected} dispatch={dispatch}/>
            <AssetPicker assets={assets} selectedId={selected.id} onSelect={setSelectedId}/>
          </div>
        )}

      </motion.div>
    </div>
  )
}
