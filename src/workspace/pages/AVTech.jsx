import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store.jsx'
import { useLocalState } from '../../useLocalState.js'

/* ─────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────── */
const AV_STATUS_OPTS = ['Not scheduled','On order','Delivered','Configured','Tested','Approved','Installed','Live']
const uid = () => `_${Math.random().toString(36).slice(2,8)}`

function statusStyle(s) {
  if (['Installed','Live','Approved'].includes(s))    return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (['Configured','Tested'].includes(s))            return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  if (['Delivered','On order'].includes(s))           return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  return { color:'var(--ink-300)', bg:'var(--ground-dim)' }
}

/* ─── Seed data ──────────────────────────────────────────── */
const SEED_CATS = [
  {
    id:'c1', name:'Displays', open:true,
    items:[
      { id:'av1', name:'LED Wall',             cat:'Displays',    vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'22A @ 208V', testDate:'Jul 14', status:'On order',
        description:'16ft × 9ft 2.6mm pixel pitch LED wall. 4K native resolution. 600 nits. HUD overlay capable.',
        placement:'Upstage center — stage back wall', dimensions:'W 192" × H 108"',
        specs:[['Resolution','7680 × 4320 (8K ready)'],['Pixel pitch','2.6mm'],['Power draw','22A @ 208V'],['Refresh rate','3840Hz'],['Signal type','HDMI 2.1 / Fiber'],['Inputs','6 HDMI, 2 Fiber']],
        linkedDeliverableNames:['Final Motion Graphics','Screen Layout Spec'],
        testing:'Sound check Jul 14 11:00 AM. Full system test Jul 14 3:00 PM. Playback run-through Jul 15 9:00 AM.',
        install:'Arrive Jul 14 7:00 AM. Steel hang points pre-rigged. Tiles stack from floor. Signal from rack DSR.',
        cabling:'Fiber trunk from rack position A to wall mount. Power from circuit B4-B6.',
        notes:'', files:[] },
      { id:'av2', name:'Interactive Kiosk ×4', cat:'Displays',    vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'2A @ 120V', testDate:'Jul 14', status:'Delivered',
        description:'4× 55" touchscreen kiosks. Custom React app — product exploration + photo capture. Wifi connected, offline-capable.',
        placement:'North, South, East, West positions — see floor plan',
        dimensions:'W 55" × H 68" × D 18" (per unit)',
        specs:[['Display size','55" (each)'],['Touch','10-point PCAP'],['Power','2A @ 120V per unit'],['Connectivity','WiFi 6 + Ethernet fallback'],['OS','Android 13 + custom launcher']],
        linkedDeliverableNames:['Kiosk UI Design'],
        testing:'Unit test Jul 12. Network test Jul 13. Full UX walkthrough Jul 14.',
        install:'Kiosks ship pre-configured. Position per floor plan. Ethernet cable to each position.',
        cabling:'Power strip at each position. 4× Cat6 runs from Networking rack.',
        notes:'App updated to v2.1 Jul 10. Backup USB loaded on each unit.', files:[] },
    ],
  },
  {
    id:'c2', name:'Audio', open:true,
    items:[
      { id:'av3', name:'PA System',           cat:'Audio',       vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'15A @ 120V', testDate:'Jul 14', status:'Delivered',
        description:'L-R line array PA + subs. 4× L-Acoustics KIVA II per side, 2× SB18i subs per side. FoH mix position centre-rear.',
        placement:'Arrays flown from truss positions T1 and T2. Subs ground-stacked', dimensions:'N/A — rigged',
        specs:[['Configuration','L-R line array + subs'],['Amplifiers','LA8 x 4'],['Max SPL','110dB @ 10m'],['Power','15A @ 120V per amp rack'],['Signal','Dante / AES3'],['Processing','Lake LM44']],
        linkedDeliverableNames:[],
        testing:'Room EQ Jul 14 8:00 AM. Speech intelligibility test 10:00 AM. Music playback 11:00 AM.',
        install:'Arrays fly from truss. Subs position prior to scenic. Cable run from FoH position.',
        cabling:'Dante network — all audio over Cat6. FoH position requires 4× power outlets.',
        notes:'', files:[] },
      { id:'av4', name:'Wireless Microphones', cat:'Audio',      vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'0.5A @ 120V', testDate:'Jul 14', status:'On order',
        description:'4× Shure Axient AD4D wireless receivers. 8× handheld + 2× lavalier transmitters. Frequency coordination Jul 11.',
        placement:'Rack Bay C', dimensions:'N/A',
        specs:[['System','Shure Axient Digital'],['Channels','8 simultaneous'],['Frequency','G57 band (470-616 MHz)'],['Battery','SB903 lithium, 8hr']],
        linkedDeliverableNames:[],
        testing:'Frequency scan Jul 11. Walk-through Jul 14.',
        install:'Rack-mount in Bay C. Antennas to antenna distro at truss height.',
        cabling:'Fiber from antenna distro to rack. 2× power outlets.',
        notes:'', files:[] },
    ],
  },
  {
    id:'c3', name:'Lighting', open:false,
    items:[
      { id:'av5', name:'Lighting Rig',         cat:'Lighting',    vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'60A @ 208V', testDate:'Jul 14', status:'On order',
        description:'24× Robe T1 Profile + 12× Astera Titan tubes + 6× Martin Mac Aura XB wash. All on 12-universe DMX via Grand MA2 OnPC.',
        placement:'Main truss grid + perimeter floor positions',
        dimensions:'Truss grid 40ft × 30ft @ 20ft trim height',
        specs:[['Fixtures','42 total'],['Dimmer','60A 3-phase per rack'],['Control','Grand MA2 OnPC'],['Protocol','DMX 512 / RDM'],['Universes','12']],
        linkedDeliverableNames:[],
        testing:'Lamp check Jul 13. Programming Jul 13–14. Dress rehearsal Jul 15.',
        install:'Truss arrives Jul 14. Rig and focus Jul 14. Program Jul 14–15.',
        cabling:'3-phase power from building circuit C. DMX snake from FOH to dimmer rack.',
        notes:'', files:[] },
    ],
  },
  {
    id:'c4', name:'Networking', open:false,
    items:[
      { id:'av6', name:'Fiber Internet',       cat:'Networking',  vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'1A @ 120V', testDate:'Jul 13', status:'Configured',
        description:'Dedicated 1Gbps fiber drop from building connection. Managed switch at each zone. Separate SSIDs for production and guest.',
        placement:'Rack Bay A — network core', dimensions:'N/A',
        specs:[['Bandwidth','1Gbps dedicated'],['Switch','Cisco Catalyst 9300'],['Zones','6 managed VLANs'],['WiFi','Cisco Meraki MR46 × 8'],['Guest SSID','Isolated, 50Mbps cap']],
        linkedDeliverableNames:[],
        testing:'Network test Jul 13. Load test Jul 14. Final configuration Jul 15 7:00 AM.',
        install:'Building fiber patch Jul 13. Switch stack Jul 13. WiFi AP placement Jul 14.',
        cabling:'Single mode fiber from building MDF. Cat6 home-run from each AP position.',
        notes:'IT contact: building@brooklyntower.com. Patch window: Jul 13 8:00–10:00 AM.', files:[] },
    ],
  },
  {
    id:'c5', name:'Power', open:false,
    items:[
      { id:'av7', name:'Power Distribution',   cat:'Power',       vendor:'Ocubo Digital',  owner:'Suki Park', ownerInitials:'SP', power:'200A @ 208V 3-phase', testDate:'Jul 13', status:'Approved',
        description:'Main power distribution from building 200A 3-phase tie-in. Sub-feeds to all rack positions and scenic positions.',
        placement:'Upstage left — power position A', dimensions:'N/A',
        specs:[['Source','200A, 3-phase 208V'],['Sub-circuits','12 × 20A, 4 × 60A, 2 × 100A'],['Protection','GFCI on all outlets'],['Distro','Socapex + Edison'],['UPS','APC 10kVA on critical systems']],
        linkedDeliverableNames:[],
        testing:'Tie-in Jul 13 with building engineer. Load test Jul 14.',
        install:'Electrician on-site Jul 13 8:00 AM for tie-in. Power map required prior.',
        cabling:'See power distribution drawing. Verify circuit assignments before energising.',
        notes:'Building electrician: Dave Park (212) 555-0191. Permit on file.', files:[] },
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
      value:draft, onChange:e=>setDraft(e.target.value), onBlur:commit, autoFocus:true,
      onKeyDown:e=>{if(!multiline&&e.key==='Enter'){e.preventDefault();commit()} if(e.key==='Escape'){setDraft(value);setEditing(false)}},
      style:{ width:'100%', border:'none', outline:'none', resize:'none', fontFamily:'var(--font)', background:'transparent', padding:0, ...style },
    }
    return multiline ? <textarea {...shared} rows={Math.max(2,draft.split('\n').length+1)}/> : <input {...shared}/>
  }

  const empty = !value?.trim()
  return (
    <div onClick={()=>{setDraft(value);setEditing(true)}}
      style={{ cursor:'text', minHeight:20, color:empty?'var(--ink-200)':undefined, fontStyle:empty?'italic':undefined, ...style }}>
      {empty ? placeholder : multiline ? value.split('\n').map((l,i)=><span key={i}>{l}{i<value.split('\n').length-1&&<br/>}</span>) : value}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:4 }}>{label}</p>
      {children}
    </div>
  )
}

function SHead({ children }) {
  return <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>{children}</p>
}

/* ─── Linked asset chips ─────────────────────────────────── */
function LinkedAssets({ linkedDeliverableNames, onOpenDeliverable }) {
  const { state } = useStore()
  const linked = (linkedDeliverableNames||[])
    .map(name => state.deliverables.filter(d => d.projectId === state.production.id).find(d => d.item === name))
    .filter(Boolean)

  if (linked.length === 0) return (
    <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>No deliverables linked. Approved deliverables appear here once selected below.</p>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {linked.map(d => {
        const latestVer = [...(d.versions||[])].reverse()[0]
        return (
          <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:3, background:'var(--ink-900)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1"/><path d="M1 7.5l3.5-3.5 3 3 2-2 2.5 2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)', marginBottom:1 }}>{d.item}</p>
                <p style={{ fontSize:10, color:'var(--ink-400)' }}>
                  {latestVer ? `v${latestVer.v}` : 'No versions'} · {d.status} {latestVer ? `· ${latestVer.date}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onOpenDeliverable} style={{ fontSize:11, fontWeight:500, color:'var(--ink-500)', background:'transparent', border:'1px solid var(--border)', borderRadius:3, padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font)' }}>Open ↗</button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Picker to link/unlink multiple deliverables ────────── */
function LinkedDeliverablesPicker({ item, onUpdate }) {
  const { state } = useStore()
  const approved = state.deliverables.filter(d => d.projectId === state.production.id && d.status === 'Approved')
  const linkedNames = item.linkedDeliverableNames || []

  const toggle = name => {
    const next = linkedNames.includes(name)
      ? linkedNames.filter(n => n !== name)
      : [...linkedNames, name]
    onUpdate({ ...item, linkedDeliverableNames: next })
  }

  if (approved.length === 0) {
    return <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:8, fontStyle:'italic' }}>No approved deliverables yet — approve one in Deliverables first.</p>
  }

  return (
    <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
      {approved.map(d => {
        const active = linkedNames.includes(d.item)
        return (
          <button key={d.id} onClick={() => toggle(d.item)}
            style={{ fontSize:11, fontWeight:500, padding:'5px 10px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
              background: active ? 'var(--ink-900)' : 'var(--surface)',
              color: active ? 'white' : 'var(--ink-500)',
              border: `1px solid ${active ? 'var(--ink-900)' : 'var(--border)'}` }}>
            {active ? '✓ ' : '+ '}{d.item}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Spec table ─────────────────────────────────────────── */
function SpecTable({ specs }) {
  if (!specs?.length) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {specs.map(([l,v])=>(
        <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontSize:10, color:'var(--ink-400)', fontWeight:600, letterSpacing:'0.03em', marginBottom:3 }}>{l}</p>
          <p style={{ fontSize:12.5, color:'var(--ink-800)', fontFamily:'var(--font-mono)', lineHeight:1.4 }}>{v}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Expanded AV row ────────────────────────────────────── */
function ExpandedRow({ item, onUpdate, onNavigate }) {
  const upd = (k,v) => onUpdate({...item,[k]:v})
  const ss = statusStyle(item.status)

  return (
    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.22, ease:[0.25,1,0.5,1] }}>
      <div style={{ background:'var(--ground-dim)', borderBottom:'1px solid var(--border-med)', borderLeft:'3px solid var(--ink-900)' }}>

        {/* Row 1: overview + specs + linked assets */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px 280px', gap:0, maxWidth:'var(--cap-panel)' }}>

          {/* Overview */}
          <div style={{ padding:'20px 24px', borderRight:'1px solid var(--border)' }}>
            <SHead>Overview</SHead>
            <div style={{ marginBottom:14 }}>
              <Field label="Description">
                <InlineEditor value={item.description} onChange={v=>upd('description',v)} multiline placeholder="Add description…"
                  style={{ fontSize:14, lineHeight:1.70, color:'var(--ink-700)' }}/>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <Field label="Vendor"><InlineEditor value={item.vendor}    onChange={v=>upd('vendor',v)}    placeholder="Vendor"    style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}/></Field>
              <Field label="Placement"><InlineEditor value={item.placement} onChange={v=>upd('placement',v)} placeholder="Location" style={{ fontSize:13, color:'var(--ink-700)' }}/></Field>
              <Field label="Dimensions"><InlineEditor value={item.dimensions} onChange={v=>upd('dimensions',v)} placeholder="W × H × D" style={{ fontSize:13, fontFamily:'var(--font-mono)', color:'var(--ink-700)' }}/></Field>
              <Field label="Status">
                <select value={item.status} onChange={e=>upd('status',e.target.value)}
                  style={{ fontSize:12, fontWeight:700, letterSpacing:'0.07em', border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', color:ss.color, outline:'none', padding:0, textTransform:'uppercase' }}>
                  {AV_STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Tech specs */}
          <div style={{ padding:'20px 20px', borderRight:'1px solid var(--border)' }}>
            <SHead>Technical specifications</SHead>
            <SpecTable specs={item.specs}/>
          </div>

          {/* Linked design assets */}
          <div style={{ padding:'20px 20px' }}>
            <SHead>Linked deliverables</SHead>
            <LinkedAssets linkedDeliverableNames={item.linkedDeliverableNames} onOpenDeliverable={() => onNavigate && onNavigate('creative')}/>
            <LinkedDeliverablesPicker item={item} onUpdate={onUpdate}/>
          </div>
        </div>

        {/* Row 2: testing + install + notes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0, borderTop:'1px solid var(--border)' }}>
          <div style={{ padding:'16px 24px', borderRight:'1px solid var(--border)' }}>
            <SHead>Testing</SHead>
            <InlineEditor value={item.testing} onChange={v=>upd('testing',v)} multiline placeholder="Testing schedule, crew assignments, acceptance notes…"
              style={{ fontSize:13, lineHeight:1.65, color:'var(--ink-700)' }}/>
          </div>
          <div style={{ padding:'16px 24px', borderRight:'1px solid var(--border)' }}>
            <SHead>Installation</SHead>
            <InlineEditor value={item.install} onChange={v=>upd('install',v)} multiline placeholder="Installation schedule, dependencies, placement…"
              style={{ fontSize:13, lineHeight:1.65, color:'var(--ink-700)' }}/>
            <div style={{ marginTop:12 }}>
              <Field label="Cabling">
                <InlineEditor value={item.cabling} onChange={v=>upd('cabling',v)} multiline placeholder="Cable routing notes…"
                  style={{ fontSize:12, lineHeight:1.55, color:'var(--ink-600)' }}/>
              </Field>
            </div>
          </div>
          <div style={{ padding:'16px 24px' }}>
            <SHead>Operational notes</SHead>
            <InlineEditor value={item.notes} onChange={v=>upd('notes',v)} multiline placeholder="Notes for the production team…"
              style={{ fontSize:13, lineHeight:1.65, color:'var(--ink-700)' }}/>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── AV item row ────────────────────────────────────────── */
function AVRow({ item, expanded, onToggle, onUpdate, onNavigate }) {
  const [hov, setHov] = useState(false)
  const ss = statusStyle(item.status)
  const hasAssets = item.linkedDeliverableNames?.length > 0

  return (
    <div>
      <div onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display:'grid', gridTemplateColumns:'minmax(180px,1fr) 100px 150px 110px 100px 80px 120px 36px',
          gap:12, padding:'12px 0', borderBottom:expanded?'none':'1px solid var(--border)',
          cursor:'pointer', alignItems:'center',
          background:expanded?'var(--ground-dim)':hov?'rgba(0,0,0,0.012)':'transparent', transition:'background 0.1s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>{item.name}</p>
          {hasAssets && <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--signal-green-dot)', flexShrink:0 }} title="Deliverables linked"/>}
        </div>
        <p style={{ fontSize:11, color:'var(--ink-500)' }}>{item.cat}</p>
        <p style={{ fontSize:12, color:'var(--ink-600)' }}>{item.vendor}</p>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink-800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.60)', flexShrink:0 }}>{item.ownerInitials}</div>
          <p style={{ fontSize:12, color:'var(--ink-700)' }}>{item.owner.split(' ')[0]}</p>
        </div>
        <p style={{ fontSize:11, color:'var(--ink-500)', fontFamily:'var(--font-mono)' }}>{item.power}</p>
        <p style={{ fontSize:12, color:'var(--ink-600)' }}>{item.testDate}</p>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:ss.color, background:ss.bg, padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>{item.status}</span>
        <motion.div animate={{ rotate:expanded?90:0 }} transition={{ duration:0.15 }}>
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

/* ─── AV category group ──────────────────────────────────── */
function AVCatGroup({ cat, expandedId, onToggle, onUpdateItem, onNavigate }) {
  const [open, setOpen] = useState(cat.open)

  return (
    <div style={{ marginBottom:4 }}>
      <div onClick={() => setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
        <motion.div animate={{ rotate:open?90:0 }} transition={{ duration:0.14 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 1.5l4 3.5-4 3.5" stroke="var(--ink-300)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
        <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)', flex:1 }}>{cat.name}</p>
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>{cat.items.length} system{cat.items.length!==1?'s':''}</p>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.14 }}>
            {cat.items.map(item => (
              <AVRow key={item.id} item={item}
                expanded={expandedId===item.id}
                onToggle={() => onToggle(item.id)}
                onUpdate={updated => onUpdateItem(cat.id, updated)}
                onNavigate={onNavigate}/>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main AVTech page
   ───────────────────────────────────────────────────────── */
export default function AVTech({ onNavigate, currentUser, projectId, isViewOnly, production }) {
  const [cats, setCats]           = useLocalState(`avtech_cats_${projectId || 'default'}_v1`, [])
  const [expandedId, setExpandedId] = useState(null)

  const totalItems = cats.flatMap(c=>c.items).length
  const primaryVendor = cats.flatMap(c => c.items || []).map(i => i.vendor).find(Boolean) || '—'

  const toggleExpand = id => setExpandedId(p => p===id ? null : id)

  const updateItem = (catId, updated) => {
    setCats(p => p.map(c => c.id===catId ? { ...c, items:c.items.map(i=>i.id===updated.id?updated:i) } : c))
  }

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>Production · AV · Tech</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:10 }}>
              AV / Tech
            </h1>
            <PageOwner area="AV / Tech" projectId={projectId}/>
            <p style={{ fontSize:13, color:'var(--ink-400)' }}>
              {totalItems} systems &nbsp;·&nbsp; Primary vendor: {primaryVendor} &nbsp;·&nbsp; Click any row to expand
            </p>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(180px,1fr) 100px 150px 110px 100px 80px 120px 36px',
          gap:12, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
          {['Item','Category','Vendor','Owner','Power','Test date','Status',''].map((h,i)=>(
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)' }}>{h}</p>
          ))}
        </div>

        {/* Categories */}
        {cats.map(cat => (
          <AVCatGroup key={cat.id} cat={cat}
            expandedId={expandedId}
            onToggle={toggleExpand}
            onUpdateItem={updateItem}
            onNavigate={onNavigate}/>
        ))}

        <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:16 }}>
          Link approved deliverables to any AV/Tech item from its detail panel.
        </p>
      </motion.div>

    </div>
  )
}
