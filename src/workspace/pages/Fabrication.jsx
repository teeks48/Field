import React, { useState, useRef } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store.jsx'
import { useLocalState } from '../../useLocalState.js'

/* ─────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────── */
const STATUS_OPTS = ['Not started','Drawings pending','Drawings approved','Materials sourced','In fabrication','In review','Ready for install','Installed','Complete']
const uid = () => `_${Math.random().toString(36).slice(2,8)}`

function statusStyle(s) {
  if (['Installed','Complete','Ready for install'].includes(s)) return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (['In fabrication','Materials sourced'].includes(s))        return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  if (['In review','Drawings pending'].includes(s))              return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  if (['Drawings approved'].includes(s))                         return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  return { color:'var(--ink-300)', bg:'var(--ground-dim)' }
}

/* ─── Seed data ──────────────────────────────────────────── */
const SEED_CATS = [
  {
    id:'cat1', name:'Scenic', open:true,
    items:[
      { id:'f1', name:'Entrance Portal',  fabricator:'Eventmakers NYC', owner:'', material:'Steel + MDF', installDate:'Jul 15', status:'In fabrication',
        description:'Custom 12ft entrance arch with integrated LED edge lighting. Powder-coated matte black frame with tension fabric face.',
        dimensions:'W 144" × H 144" × D 24"', budget:'$28,000', linkedDeliverableName:'Entrance Portal Render',
        files:[{ name:'Entrance_Portal_Render.pdf', type:'Render' },{ name:'CAD_Portal.dwg', type:'CAD' },{ name:'Dimension_Sheet.pdf', type:'Specs' }],
        productionNotes:'Weld schedule confirmed. Steel frame ships Jul 10. LED track installed at venue prior to scenic arrival.',
        installNotes:'Portal arrives in 3 sections. Crew of 4 required. Bolt pattern A-D as per drawing set.',
        progressPhotos:[], ownerInitials:'JW' },
      { id:'f2', name:'Feature Wall',      fabricator:'Eventmakers NYC', owner:'', material:'Tension fabric', installDate:'Jul 15', status:'Drawings approved',
        description:'20ft × 10ft backlit tension fabric wall. Dye-sublimation print on 200g fabric. SEG frame in black.',
        dimensions:'W 240" × H 120"', budget:'$12,000', linkedDeliverableName:'Feature Wall Artwork',
        files:[{ name:'Feature_Wall_Artwork.pdf', type:'Print file' },{ name:'Feature_Wall_Spec.pdf', type:'Specs' }],
        productionNotes:'Print file sent to printer Jun 30. Proof approved Jul 5.',
        installNotes:'Fabric snaps into SEG frame — single person install. Frame ships flat.',
        progressPhotos:[], ownerInitials:'JW' },
      { id:'f3', name:'Stage Platform',    fabricator:'Eventmakers NYC', owner:'', material:'Steel + ply', installDate:'Jul 15', status:'Materials sourced',
        description:'8" elevated stage platform. 20ft × 12ft. Black carpet finish. ADA compliant ramped access.',
        dimensions:'W 240" × D 144" × H 8"', budget:'$8,500', linkedDeliverableName:null,
        files:[], productionNotes:'Ply sheets cut and primed. Steel legs powder-coated.',
        installNotes:'Stage builds from front to back. Bolt in pairs per drawing.',
        progressPhotos:[], ownerInitials:'JW' },
    ],
  },
  {
    id:'cat2', name:'Furniture', open:true,
    items:[
      { id:'f4', name:'Custom Dining Tables', fabricator:'Eventmakers NYC', owner:'', material:'Walnut veneer', installDate:'Jul 15', status:'In review',
        description:'12 custom dining tables. 8ft rectangular, walnut veneer tops with matte black powder-coated steel legs. Seats 10.',
        dimensions:'W 96" × D 36" × H 30"', budget:'$18,000', linkedDeliverableName:'Custom Dining Table',
        files:[{ name:'Table_Production.ai', type:'Production artwork' },{ name:'Table_CAD.dwg', type:'CAD' },{ name:'Dimension_Sheet.pdf', type:'Specs' }],
        productionNotes:'Veneer laminated. Finishing coat #2 complete. Tables ready for QC Jul 13.',
        installNotes:'Tables arrive flat-packed. Leg assembly on-site. 2 crew, 30 min per table.',
        progressPhotos:[], ownerInitials:'JW' },
      { id:'f5', name:'Custom Bar',          fabricator:'Eventmakers NYC', owner:'', material:'Steel + glass', installDate:'Jul 15', status:'In fabrication',
        description:'20ft modular bar. Steel frame with smoked glass front panels. LED undercabinet lighting. Built-in ice wells × 4.',
        dimensions:'W 240" × D 30" × H 42"', budget:'$22,000', linkedDeliverableName:'Bar Design',
        files:[{ name:'Bar_Render.pdf', type:'Render' },{ name:'Bar_CAD.dwg', type:'CAD' }],
        productionNotes:'Frame welded and primed. Glass panels on order — arrive Jul 11.',
        installNotes:'Bar ships in 5 sections. Run power to position A before bar arrives.',
        progressPhotos:[], ownerInitials:'JW' },
    ],
  },
  {
    id:'cat3', name:'Branding', open:false,
    items:[
      { id:'f6', name:'3D Lettering',   fabricator:'Content Studio', owner:'', material:'Foam + acrylic', installDate:'Jul 15', status:'Not started',
        description:'Custom 3D letters spelling "AV XR" — 36" tall. Frosted acrylic face with white LED halo glow.',
        dimensions:'Various', budget:'$4,200', linkedDeliverableName:'3D Letter Design',
        files:[{ name:'3D_Letters.ai', type:'Production artwork' }],
        productionNotes:'', installNotes:'Double-sided tape + standoffs to wall surface.',
        progressPhotos:[], ownerInitials:'TV' },
      { id:'f7', name:'Vinyl Graphics',  fabricator:'Content Studio', owner:'', material:'3M vinyl', installDate:'Jul 15', status:'Drawings approved',
        description:'Floor vinyl graphic — 10ft diameter circular design at entrance. Matte laminate finish.',
        dimensions:'Diameter 120"', budget:'$1,800', linkedDeliverableName:'Floor Vinyl Artwork',
        files:[{ name:'Floor_Vinyl.pdf', type:'Print file' }],
        productionNotes:'Artwork approved. Send to print Jul 12.', installNotes:'Clean surface 24hr prior. Squeegee in sections — center out.',
        progressPhotos:[], ownerInitials:'TV' },
    ],
  },
]

/* ─── Shared inline editor ───────────────────────────────── */
function InlineEditor({ value, onChange, placeholder, multiline, style = {} }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  const commit = () => { setEditing(false); if (draft !== value) onChange(draft) }

  if (editing) {
    const shared = {
      value: draft, onChange: e => setDraft(e.target.value), onBlur: commit, autoFocus: true,
      onKeyDown: e => { if (!multiline && e.key==='Enter') { e.preventDefault(); commit() } if (e.key==='Escape') { setDraft(value); setEditing(false) } },
      style: { width:'100%', border:'none', outline:'none', resize:'none', fontFamily:'var(--font)', background:'transparent', padding:0, ...style },
    }
    return multiline ? <textarea {...shared} rows={Math.max(2, draft.split('\n').length+1)}/> : <input {...shared}/>
  }

  const empty = !value?.trim()
  return (
    <div onClick={() => { setDraft(value); setEditing(true) }}
      style={{ cursor:'text', minHeight:20, color:empty?'var(--ink-200)':undefined, fontStyle:empty?'italic':undefined, ...style }}>
      {empty ? placeholder : multiline ? value.split('\n').map((l,i)=><span key={i}>{l}{i<value.split('\n').length-1&&<br/>}</span>) : value}
    </div>
  )
}

/* ─── Field pair ─────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>{label}</p>
      {children}
    </div>
  )
}

/* ─── Linked asset card ──────────────────────────────────── */
function LinkedAssetCard({ linkedDeliverableName, onOpenDeliverable }) {
  const { state } = useStore()
  const deliverable = linkedDeliverableName
    ? state.deliverables.filter(d => d.projectId === state.production.id).find(d => d.item === linkedDeliverableName)
    : null

  if (!deliverable) return (
    <div style={{ padding:'14px 16px', background:'var(--ground-dim)', border:'1px dashed var(--border-med)', borderRadius:4 }}>
      <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>No design deliverable linked yet. Items appear here once a Deliverable is marked Approved.</p>
    </div>
  )
  const latestVer = [...(deliverable.versions||[])].reverse()[0]
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:4, background:'var(--ink-900)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/><path d="M1.5 9l4-4 3 3 2-2 3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{deliverable.item}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>
            {latestVer ? `v${latestVer.v}` : 'No versions'} · {deliverable.status} {latestVer ? `· ${latestVer.date}` : ''}
          </p>
        </div>
      </div>
      <button onClick={onOpenDeliverable}
        style={{ fontSize:12, fontWeight:500, color:'var(--ink-500)', background:'transparent', border:'1px solid var(--border)', borderRadius:3, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font)', whiteSpace:'nowrap' }}>
        Open in Deliverables ↗
      </button>
    </div>
  )
}
/* ─── Picker to link/change a deliverable from Fabrication ── */
function LinkedDeliverablePicker({ item, onUpdate }) {
  const { state } = useStore()
  const approved = state.deliverables.filter(d => d.projectId === state.production.id && d.status === 'Approved')

  return (
    <div style={{ marginTop:8 }}>
      <select value={item.linkedDeliverableName || ''}
        onChange={e => onUpdate({ ...item, linkedDeliverableName: e.target.value || null })}
        style={{ width:'100%', fontSize:12, padding:'6px 8px', border:'1px solid var(--border)',
          borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)',
          color:'var(--ink-700)', outline:'none', cursor:'pointer' }}>
        <option value="">No deliverable linked</option>
        {approved.map(d => <option key={d.id} value={d.item}>{d.item}</option>)}
      </select>
      {approved.length === 0 && (
        <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:4, fontStyle:'italic' }}>
          No approved deliverables yet — approve one in Deliverables first.
        </p>
      )}
    </div>
  )
}


/* ─── Progress photo upload ──────────────────────────────── */
function ProgressPhotos({ photos, onAdd }) {
  const fileRef = useRef(null)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>Progress photos</p>
        <button onClick={() => fileRef.current?.click()} style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>+ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => Array.from(e.target.files).forEach(f => onAdd(f.name))}/>
      </div>
      {photos.length === 0 ? (
        <div style={{ height:80, border:'1px dashed var(--border-med)', borderRadius:4, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer' }} onClick={() => fileRef.current?.click()}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink-300)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-med)'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="var(--ink-300)" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <p style={{ fontSize:11, color:'var(--ink-300)' }}>Upload progress photos</p>
        </div>
      ) : (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {photos.map((p,i) => (
            <div key={i} style={{ width:72, height:72, borderRadius:3, background:'var(--ground-dim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ fontSize:10, color:'var(--ink-300)', textAlign:'center', padding:'0 4px' }}>{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Expanded row ───────────────────────────────────────── */
function ExpandedRow({ item, onUpdate, onNavigate }) {
  const upd = (k, v) => onUpdate({ ...item, [k]: v })
  const addPhoto = name => onUpdate({ ...item, progressPhotos:[...(item.progressPhotos||[]),name] })
  const ss = statusStyle(item.status)

  return (
    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.22, ease:[0.25,1,0.5,1] }}>
      <div style={{ padding:'20px 24px 24px', background:'var(--ground-dim)', borderBottom:'1px solid var(--border-med)', borderLeft:'3px solid var(--ink-900)' }}>

        {/* Top: linked asset + overview */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:28, marginBottom:22, maxWidth:'var(--cap-panel)' }}>

          {/* Left: overview fields */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Overview</p>
            <div style={{ marginBottom:14 }}>
              <Field label="Description">
                <InlineEditor value={item.description} onChange={v=>upd('description',v)} multiline placeholder="Add description…"
                  style={{ fontSize:14, lineHeight:1.70, color:'var(--ink-700)' }}/>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              <Field label="Fabricator">
                <InlineEditor value={item.fabricator} onChange={v=>upd('fabricator',v)} placeholder="Fabricator" style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}/>
              </Field>
              <Field label="Primary material">
                <InlineEditor value={item.material} onChange={v=>upd('material',v)} placeholder="Material" style={{ fontSize:13, color:'var(--ink-800)' }}/>
              </Field>
              <Field label="Dimensions">
                <InlineEditor value={item.dimensions} onChange={v=>upd('dimensions',v)} placeholder="W × H × D" style={{ fontSize:13, fontFamily:'var(--font-mono)', color:'var(--ink-700)' }}/>
              </Field>
              <Field label="Budget">
                <InlineEditor value={item.budget} onChange={v=>upd('budget',v)} placeholder="$0" style={{ fontSize:13, fontFamily:'var(--font-mono)', color:'var(--ink-800)' }}/>
              </Field>
              <Field label="Install date">
                <InlineEditor value={item.installDate} onChange={v=>upd('installDate',v)} placeholder="Date" style={{ fontSize:13, color:'var(--ink-800)' }}/>
              </Field>
              <Field label="Status">
                <select value={item.status} onChange={e=>upd('status',e.target.value)}
                  style={{ fontSize:12, fontWeight:700, letterSpacing:'0.07em', border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', color:ss.color, outline:'none', padding:0, textTransform:'uppercase' }}>
                  {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Right: linked asset */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Linked deliverable</p>
            <LinkedAssetCard linkedDeliverableName={item.linkedDeliverableName} onOpenDeliverable={() => onNavigate && onNavigate('creative')}/>
            <LinkedDeliverablePicker item={item} onUpdate={onUpdate}/>

            {/* Files from linked asset */}
            {item.files?.length > 0 && (
              <div style={{ marginTop:14 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Attachments</p>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {item.files.map((f,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:30, height:30, borderRadius:3, background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="0.5" width="9" height="11" rx="1.5" stroke="var(--ink-200)" strokeWidth="1.1"/></svg>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)' }}>{f.name}</p>
                        <p style={{ fontSize:10, color:'var(--ink-300)' }}>{f.type}</p>
                      </div>
                      <button style={{ fontSize:11, color:'var(--ink-300)', background:'none', border:'none', cursor:'pointer' }}>↓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: notes + progress + install */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:22, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <Field label="Production notes">
            <InlineEditor value={item.productionNotes} onChange={v=>upd('productionNotes',v)} multiline placeholder="Notes for the fabrication team…"
              style={{ fontSize:13, lineHeight:1.65, color:'var(--ink-700)' }}/>
          </Field>
          <Field label="Install notes">
            <InlineEditor value={item.installNotes} onChange={v=>upd('installNotes',v)} multiline placeholder="Final installation instructions…"
              style={{ fontSize:13, lineHeight:1.65, color:'var(--ink-700)' }}/>
          </Field>
          <ProgressPhotos photos={item.progressPhotos||[]} onAdd={addPhoto}/>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Fabrication row ────────────────────────────────────── */
function FabRow({ item, expanded, onToggle, onUpdate, onNavigate }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(item.status)
  const hasAsset = !!item.linkedDeliverableName

  return (
    <div>
      <div onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display:'grid', gridTemplateColumns:'minmax(180px,1fr) 155px 120px 110px 80px 130px 36px',
          gap:14, padding:'13px 0', borderBottom: expanded ? 'none' : '1px solid var(--border)',
          cursor:'pointer', alignItems:'center',
          background: expanded ? 'var(--ground-dim)' : hov ? 'rgba(0,0,0,0.012)' : 'transparent',
          transition:'background 0.1s' }}>

        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>{item.name}</p>
            {hasAsset && (
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--signal-green-dot)', flexShrink:0 }} title="Deliverable linked"/>
            )}
          </div>
        </div>
        <p style={{ fontSize:12, color:'var(--ink-600)' }}>{item.fabricator}</p>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink-800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.60)', flexShrink:0 }}>{item.ownerInitials}</div>
          <p style={{ fontSize:12, color:'var(--ink-700)' }}>{item.owner.split(' ')[0]}</p>
        </div>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>{item.material}</p>
        <p style={{ fontSize:12, color:'var(--ink-600)', fontFamily:'var(--font-mono)' }}>{item.installDate}</p>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>{item.status}</span>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration:0.15 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="var(--ink-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={item.id}
            initial={{ opacity:0, y:-4 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.18, ease:[0.25,1,0.5,1] }}
            style={{ position:'relative', zIndex:1 }}>
            <ExpandedRow item={item} onUpdate={onUpdate} onNavigate={onNavigate}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Category group ─────────────────────────────────────── */
function CatGroup({ cat, expandedId, onToggle, onUpdateItem, onUpdateCat, onNavigate }) {
  const [open, setOpen] = useState(cat.open)
  const inFab = cat.items.filter(i => i.status==='In fabrication').length

  return (
    <div style={{ marginBottom:4 }}>
      {/* Category header */}
      <div onClick={() => setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
        <motion.div animate={{ rotate:open?90:0 }} transition={{ duration:0.14 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 1.5l4 3.5-4 3.5" stroke="var(--ink-300)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
        <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)', flex:1 }}>{cat.name}</p>
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>{cat.items.length} element{cat.items.length!==1?'s':''}{inFab>0?` · ${inFab} in fabrication`:''}</p>
      </div>
      {/* Items */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.14 }}>
            {cat.items.map(item => (
              <FabRow key={item.id} item={item}
                expanded={expandedId===item.id}
                onToggle={() => onToggle(item.id)}
                onUpdate={updated => onUpdateItem(cat.id, updated)}
                onNavigate={onNavigate}/>
            ))}
            <button onClick={() => onUpdateCat(cat.id, 'addItem')}
              style={{ padding:'9px 0', fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left', borderBottom:'1px solid var(--border)' }}>
              + Add element to {cat.name}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Fabrication page
   ───────────────────────────────────────────────────────── */
export default function Fabrication({ onNavigate, currentUser, projectId, isViewOnly, production }) {
  const [cats, setCats]           = useLocalState(`fab_${projectId || 'default'}_v1`, [])
  const [expandedId, setExpandedId] = useState(null)
  const [addingElement, setAddingElement] = useState(false)
  const [newEl, setNewEl]           = useState({ name:'', catId:'cat1', fabricator:'', material:'', installDate:'', status:'Not started' })

  const totalItems = cats.flatMap(c=>c.items).length
  const inFab      = cats.flatMap(c=>c.items).filter(i=>i.status==='In fabrication').length

  const toggleExpand = id => setExpandedId(p => p===id ? null : id)

  const updateItem = (catId, updated) => {
    setCats(p => p.map(c => c.id===catId ? { ...c, items:c.items.map(i=>i.id===updated.id?updated:i) } : c))
  }

  const updateCat = (catId, action) => {
    if (action==='addItem') {
      setCats(p => p.map(c => c.id===catId ? { ...c, items:[...c.items,{
        id:uid(), name:'New element', fabricator:'', owner:'', ownerInitials:'?',
        material:'', installDate:'', status:'Not started', description:'', dimensions:'',
        budget:'', linkedDeliverableName:null, files:[], productionNotes:'', installNotes:'', progressPhotos:[]
      }]} : c))
    }
  }

  const CAT_OPTIONS = [
    {id:'cat1',name:'Scenic'},{id:'cat2',name:'Furniture'},{id:'cat3',name:'Branding'},
    {id:'cat4',name:'Technology'},{id:'cat5',name:'Wayfinding'},
  ]

  const addElement = () => {
    if (!newEl.name.trim()) return
    const target = cats.find(c=>c.id===newEl.catId) || cats[0]
    setCats(p => p.map(c => c.id===target.id
      ? { ...c, open:true, items:[...c.items,{ id:uid(), name:newEl.name, fabricator:newEl.fabricator||'', owner:'', ownerInitials:'?',
          material:newEl.material||'', installDate:newEl.installDate||'', status:newEl.status, description:'', dimensions:'',
          budget:'', linkedDeliverableName:null, files:[], productionNotes:'', installNotes:'', progressPhotos:[] }] }
      : c))
    setNewEl({ name:'', catId:cats[0]?.id||'cat1', fabricator:'', material:'', installDate:'', status:'Not started' })
    setAddingElement(false)
  }

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Production · Fabrication</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:10 }}>
              Fabrication
            </h1>
            <PageOwner area="Fabrication" projectId={projectId}/>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>
              {totalItems} elements &nbsp;·&nbsp; {inFab} currently in fabrication &nbsp;·&nbsp; Click any row to expand
            </p>
          </div>
          <button onClick={() => setAddingElement(a=>!a)}
            style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'var(--ink-900)', color:'white', border:'none', borderRadius:4,
              cursor:'pointer', fontFamily:'var(--font)' }}>
            + Add element
          </button>
        </div>

        {/* Add element inline form */}
        {addingElement && (
          <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 150px 120px 110px 80px 110px', gap:10, marginBottom:10 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Element name</p>
                <input autoFocus value={newEl.name} onChange={e=>setNewEl(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addElement()} placeholder="Element name"
                  style={{ fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Category</p>
                <select value={newEl.catId} onChange={e=>setNewEl(p=>({...p,catId:e.target.value}))}
                  style={{ fontSize:13, height:34, padding:'0 8px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}>
                  {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Fabricator</p>
                <input value={newEl.fabricator} onChange={e=>setNewEl(p=>({...p,fabricator:e.target.value}))} placeholder="Fabricator"
                  style={{ fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Material</p>
                <input value={newEl.material} onChange={e=>setNewEl(p=>({...p,material:e.target.value}))} placeholder="Material"
                  style={{ fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Install</p>
                <input value={newEl.installDate} onChange={e=>setNewEl(p=>({...p,installDate:e.target.value}))} placeholder="Jul 15"
                  style={{ fontSize:13, height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}/>
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:5 }}>Status</p>
                <select value={newEl.status} onChange={e=>setNewEl(p=>({...p,status:e.target.value}))}
                  style={{ fontSize:13, height:34, padding:'0 8px', border:'1px solid var(--border)', borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none', width:'100%' }}>
                  {['Not started','Drawings pending','Drawings approved','Materials sourced','In fabrication','In review','Ready for install','Installed','Complete'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addElement} style={{ padding:'7px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--ink-900)', color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Add element</button>
              <button onClick={()=>setAddingElement(false)} style={{ padding:'7px 12px', fontSize:11, background:'transparent', color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(180px,1fr) 155px 120px 110px 80px 130px 36px',
          gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
          {['Element name','Fabricator','Owner','Material','Install','Status',''].map((h,i)=>(
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>

        {/* Categories */}
        {cats.map(cat => (
          <CatGroup key={cat.id} cat={cat}
            expandedId={expandedId}
            onToggle={toggleExpand}
            onUpdateItem={updateItem}
            onUpdateCat={updateCat}
            onNavigate={onNavigate}/>
        ))}

        <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:16 }}>
          Design assets flow automatically from Creative → Fabrication once marked Ready for Fabrication.
        </p>
      </motion.div>
    </div>
  )
}
