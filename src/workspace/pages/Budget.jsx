import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalState } from '../../useLocalState.js'

/* ─── Number helpers ──────────────────────────────────────── */
const toNum  = v => { const n = Number(v); return isNaN(n) ? 0 : n }
const fmtUSD = n => '$' + Math.round(toNum(n)).toLocaleString()
const uid    = () => `_${Math.random().toString(36).slice(2, 9)}`

/* ─── Fee constants ────────────────────────────────────────── */
const PRODUCING_FEE  = 0.15
const DESIGN_FEE     = 0.60
const PROD_COST_FEE  = 0.20

/* ─── Initial seed data ────────────────────────────────────── */
const SEED_PRODUCING = [
  { id:'ps1', name:'Jamie Lee',     role:'Executive Producer', days:15, rate:1200 },
  { id:'ps2', name:'Taylor Morgan', role:'Producer',           days:12, rate:950  },
  { id:'ps3', name:'Riley Chen',    role:'Production Manager', days:10, rate:800  },
]
const SEED_DESIGN = [
  { id:'ds1', name:'Avery Smith',  role:'Creative Director', days:8,  rate:1500 },
  { id:'ds2', name:'Jordan Blake', role:'Design Lead',       days:10, rate:1200 },
  { id:'ds3', name:'Casey Zhou',   role:'3D Designer',       days:12, rate:900  },
]
const SEED_COSTS = [
  { id:'pc1', type:'Fabrication',     desc:'Custom build — main structure',  qty:1, price:120000 },
  { id:'pc2', type:'Lighting',        desc:'Fixtures + programmable lights', qty:1, price:45000  },
  { id:'pc3', type:'AV / Technology', desc:'LED wall, audio, playback',      qty:1, price:60000  },
  { id:'pc4', type:'Furniture',       desc:'Custom furniture + décor',        qty:1, price:35000  },
  { id:'pc5', type:'Freight',         desc:'Shipping, handling, storage',    qty:1, price:18000  },
]
const SEED_WB_CATS = [
  { id:'wc1', name:'Venue',           items:[{ id:'wi1', desc:'Brooklyn Tower buy-out',    budget:55000, forecast:55000 }] },
  { id:'wc2', name:'Fabrication',     items:[{ id:'wi2', desc:'Custom scenic build',        budget:120000,forecast:115000}] },
  { id:'wc3', name:'Hospitality',     items:[{ id:'wi3', desc:'Catering + beverage',        budget:94000, forecast:94000 }] },
  { id:'wc4', name:'Floral',          items:[{ id:'wi4', desc:'Table florals',              budget:18500, forecast:18500 }] },
  { id:'wc5', name:'AV / Technology', items:[{ id:'wi5', desc:'LED + interactive',          budget:82000, forecast:80000 }] },
  { id:'wc6', name:'Contingency',     items:[{ id:'wi6', desc:'5% reserve',                 budget:20000, forecast:20000 }] },
]
const SEED_EXPENSES = [
  { id:'e1', date:'Jun 15', vendor:'Brooklyn Tower',      cat:'Venue',        desc:'Venue deposit 50%',     amount:27500 },
  { id:'e2', date:'Jun 18', vendor:'Eventmakers NYC',     cat:'Fabrication',  desc:'Fabrication deposit',   amount:60000 },
  { id:'e3', date:'Jun 22', vendor:'Glasshouse Catering', cat:'Hospitality',  desc:'Catering deposit',      amount:47000 },
  { id:'e4', date:'Jun 25', vendor:'Ocubo Digital',       cat:'AV',           desc:'AV deposit 50%',        amount:41000 },
  { id:'e5', date:'Jun 27', vendor:'Aria Florals',        cat:'Floral',       desc:'Floral deposit',        amount:9250  },
]

const EXPENSE_CATS = ['Venue','Fabrication','Lighting','AV / Technology','Furniture',
  'Décor','Freight','Printing','Hospitality','Floral','Rentals',
  'Transportation','Permits','Staffing','Miscellaneous']

/* ─── Shared tiny components ───────────────────────────────── */
const Label = ({ children }) => (
  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
    color:'var(--ink-300)', marginBottom:5 }}>{children}</p>
)

const MonoNum = ({ n, bold, red }) => (
  <span style={{ fontFamily:'var(--font-mono)', fontSize:13,
    fontWeight: bold ? 600 : 400,
    color: red && toNum(n) < 0 ? 'var(--signal-red-text)' : 'var(--ink-800)' }}>
    {fmtUSD(n)}
  </span>
)

const SmBtn = ({ onClick, children, primary, danger }) => (
  <button onClick={onClick} style={{
    padding: primary ? '6px 14px' : '5px 10px',
    fontSize: 11, fontWeight: 600, cursor:'pointer', fontFamily:'var(--font)',
    borderRadius: 3, border: danger ? '1px solid rgba(184,48,48,0.25)' : primary ? 'none' : '1px solid var(--border)',
    background: primary ? 'var(--ink-900)' : 'transparent',
    color: danger ? 'var(--signal-red-text)' : primary ? 'white' : 'var(--ink-500)',
  }}>{children}</button>
)

/* ─── Summary strip ────────────────────────────────────────── */
function Strip({ cells }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cells.length},1fr)`,
      border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:20 }}>
      {cells.map((c, i) => (
        <div key={i} style={{ padding:'14px 18px',
          borderRight: i < cells.length - 1 ? '1px solid var(--border)' : 'none',
          background: c.dark ? 'var(--ink-900)' : 'var(--ground-dim)' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
            color: c.dark ? 'rgba(255,255,255,0.30)' : 'var(--ink-300)', marginBottom:6 }}>{c.label}</p>
          <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em',
            color: c.dark ? 'white' : c.warn ? 'var(--signal-amber-text)' : 'var(--ink-900)',
            lineHeight:1, marginBottom: c.sub ? 4 : 0 }}>{c.value}</p>
          {c.sub && <p style={{ fontSize:11, color: c.dark ? 'rgba(255,255,255,0.30)' : 'var(--ink-400)' }}>{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}

/* ─── Section totals footer ────────────────────────────────── */
function SectionFooter({ label, subtotal, feePct, feeLbl }) {
  const fee   = Math.round(toNum(subtotal) * feePct)
  const total = toNum(subtotal) + fee
  return (
    <div style={{ borderTop:'1px solid var(--border)', padding:'10px 0 0', textAlign:'right' }}>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:40, marginBottom:4 }}>
        <span style={{ fontSize:11, color:'var(--ink-400)' }}>Staff subtotal</span>
        <MonoNum n={subtotal}/>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:40, marginBottom:10 }}>
        <span style={{ fontSize:11, color:'var(--ink-400)' }}>{feeLbl} ({Math.round(feePct * 100)}%)</span>
        <MonoNum n={fee}/>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:40, borderTop:'1.5px solid var(--ink-900)', paddingTop:10 }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)' }}>Section total</span>
        <MonoNum n={total} bold/>
      </div>
    </div>
  )
}

/* ─── Inline editable input ────────────────────────────────── */
const cellInput = { fontSize:13, height:32, padding:'0 8px', border:'1px solid var(--border)',
  borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', color:'var(--ink-900)', outline:'none' }

/* ─────────────────────────────────────────────────────────────
   STAFF TABLE (producing or design)
   ───────────────────────────────────────────────────────────── */
function StaffTable({ rows, setRows, feePct, feeLbl }) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm]     = useState({ name:'', role:'', days:'', rate:'' })

  const lineTotal = r => toNum(r.days) * toNum(r.rate)
  const subtotal  = rows.reduce((s, r) => s + lineTotal(r), 0)

  const save = () => {
    if (!form.name && !form.role) return
    setRows(prev => [...prev, { id: uid(), ...form }])
    setForm({ name:'', role:'', days:'', rate:'' })
    setAdding(false)
  }

  const upd = (id, k, v) => setRows(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r))
  const del = id => setRows(prev => prev.filter(r => r.id !== id))

  return (
    <div style={{ marginBottom:32 }}>
      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(120px,1fr) minmax(140px,1fr) 70px 90px 100px 56px',
        gap:8, borderBottom:'1.5px solid var(--ink-900)', paddingBottom:8, marginBottom:0 }}>
        {['Name','Role','Days','Day rate','Total',''].map((h, i) => (
          <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
            color:'var(--ink-300)', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</p>
        ))}
      </div>

      {/* Rows */}
      {rows.map(r => (
        editId === r.id ? (
          /* Edit row */
          <div key={r.id} style={{ display:'grid', gridTemplateColumns:'minmax(120px,1fr) minmax(140px,1fr) 70px 90px 100px 56px',
            gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)' }}>
            <input value={r.name} onChange={e => upd(r.id,'name',e.target.value)} style={{...cellInput,width:'100%'}} autoFocus/>
            <input value={r.role} onChange={e => upd(r.id,'role',e.target.value)} style={{...cellInput,width:'100%'}}/>
            <input type="number" value={r.days} onChange={e => upd(r.id,'days',e.target.value)} style={{...cellInput,textAlign:'right',width:'100%'}}/>
            <input type="number" value={r.rate} onChange={e => upd(r.id,'rate',e.target.value)} style={{...cellInput,textAlign:'right',width:'100%'}}/>
            <p style={{ fontSize:13, fontWeight:600, textAlign:'right', alignSelf:'center' }}>{fmtUSD(lineTotal(r))}</p>
            <div style={{ display:'flex', gap:4, alignSelf:'center' }}>
              <SmBtn primary onClick={() => setEditId(null)}>✓</SmBtn>
            </div>
          </div>
        ) : (
          /* Display row */
          <div key={r.id} style={{ display:'grid', gridTemplateColumns:'minmax(120px,1fr) minmax(140px,1fr) 70px 90px 100px 56px',
            gap:8, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <span style={{ fontSize:14 }}>{r.name || '—'}</span>
            <span style={{ fontSize:13, color:'var(--ink-500)' }}>{r.role || '—'}</span>
            <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{r.days || '—'}</span>
            <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{r.rate ? fmtUSD(r.rate) : '—'}</span>
            <span style={{ fontSize:13, fontWeight:600, textAlign:'right' }}>{fmtUSD(lineTotal(r))}</span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setEditId(r.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-300)', padding:'2px 4px' }}>✎</button>
              <button onClick={() => del(r.id)}       style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-200)', padding:'2px 4px' }}>✕</button>
            </div>
          </div>
        )
      ))}

      {/* Add row */}
      {adding ? (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(120px,1fr) minmax(140px,1fr) 70px 90px 100px 56px',
          gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)' }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} style={{...cellInput,width:'100%'}} autoFocus/>
          <input placeholder="Role" value={form.role} onChange={e => setForm(p => ({...p,role:e.target.value}))} style={{...cellInput,width:'100%'}}/>
          <input type="number" placeholder="0" value={form.days} onChange={e => setForm(p => ({...p,days:e.target.value}))} style={{...cellInput,textAlign:'right',width:'100%'}}/>
          <input type="number" placeholder="0" value={form.rate} onChange={e => setForm(p => ({...p,rate:e.target.value}))} style={{...cellInput,textAlign:'right',width:'100%'}}/>
          <p style={{ fontSize:13, fontWeight:600, textAlign:'right', alignSelf:'center' }}>{fmtUSD(toNum(form.days)*toNum(form.rate))}</p>
          <div style={{ display:'flex', gap:4, alignSelf:'center' }}>
            <SmBtn primary onClick={save}>Add</SmBtn>
            <SmBtn onClick={() => setAdding(false)}>✕</SmBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop:8, fontSize:12, color:'var(--ink-400)',
          background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
          + Add staff member
        </button>
      )}

      <SectionFooter subtotal={subtotal} feePct={feePct} feeLbl={feeLbl} label="Staff"/>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PRODUCTION COSTS TABLE
   ───────────────────────────────────────────────────────── */
function CostsTable({ rows, setRows }) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm]     = useState({ type:'Fabrication', desc:'', qty:'1', price:'' })

  const lineTotal = r => toNum(r.qty) * toNum(r.price)
  const subtotal  = rows.reduce((s, r) => s + lineTotal(r), 0)
  const fee       = Math.round(subtotal * PROD_COST_FEE)
  const total     = subtotal + fee

  const save = () => {
    if (!form.desc && !form.price) return
    setRows(prev => [...prev, { id: uid(), ...form }])
    setForm({ type:'Fabrication', desc:'', qty:'1', price:'' })
    setAdding(false)
  }

  const upd = (id, k, v) => setRows(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r))
  const del = id => setRows(prev => prev.filter(r => r.id !== id))

  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:'grid', gridTemplateColumns:'140px minmax(0,1fr) 60px 100px 100px 56px',
        gap:8, borderBottom:'1.5px solid var(--ink-900)', paddingBottom:8 }}>
        {['Type','Description','Qty','Unit price','Total',''].map((h, i) => (
          <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
            color:'var(--ink-300)', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</p>
        ))}
      </div>

      {rows.map(r => (
        editId === r.id ? (
          <div key={r.id} style={{ display:'grid', gridTemplateColumns:'140px minmax(0,1fr) 60px 100px 100px 56px',
            gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)' }}>
            <select value={r.type} onChange={e => upd(r.id,'type',e.target.value)} style={{...cellInput,width:'100%'}}>
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={r.desc} onChange={e => upd(r.id,'desc',e.target.value)} style={{...cellInput,width:'100%'}} autoFocus/>
            <input type="number" value={r.qty} onChange={e => upd(r.id,'qty',e.target.value)} style={{...cellInput,textAlign:'right',width:'100%'}}/>
            <input type="number" value={r.price} onChange={e => upd(r.id,'price',e.target.value)} style={{...cellInput,textAlign:'right',width:'100%'}}/>
            <p style={{ fontSize:13, fontWeight:600, textAlign:'right', alignSelf:'center' }}>{fmtUSD(lineTotal(r))}</p>
            <SmBtn primary onClick={() => setEditId(null)}>✓</SmBtn>
          </div>
        ) : (
          <div key={r.id} style={{ display:'grid', gridTemplateColumns:'140px minmax(0,1fr) 60px 100px 100px 56px',
            gap:8, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--ink-500)', fontWeight:500 }}>{r.type}</span>
            <span style={{ fontSize:13 }}>{r.desc || '—'}</span>
            <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{r.qty}</span>
            <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(r.price)}</span>
            <span style={{ fontSize:13, fontWeight:600, textAlign:'right' }}>{fmtUSD(lineTotal(r))}</span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setEditId(r.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-300)', padding:'2px 4px' }}>✎</button>
              <button onClick={() => del(r.id)}       style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-200)', padding:'2px 4px' }}>✕</button>
            </div>
          </div>
        )
      ))}

      {adding ? (
        <div style={{ display:'grid', gridTemplateColumns:'140px minmax(0,1fr) 60px 100px 100px 56px',
          gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)' }}>
          <select value={form.type} onChange={e => setForm(p => ({...p,type:e.target.value}))} style={{...cellInput,width:'100%'}}>
            {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Description" value={form.desc} onChange={e => setForm(p => ({...p,desc:e.target.value}))} style={{...cellInput,width:'100%'}} autoFocus/>
          <input type="number" placeholder="1" value={form.qty} onChange={e => setForm(p => ({...p,qty:e.target.value}))} style={{...cellInput,textAlign:'right',width:'100%'}}/>
          <input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({...p,price:e.target.value}))} style={{...cellInput,textAlign:'right',width:'100%'}}/>
          <p style={{ fontSize:13, fontWeight:600, textAlign:'right', alignSelf:'center' }}>{fmtUSD(toNum(form.qty)*toNum(form.price))}</p>
          <div style={{ display:'flex', gap:4, alignSelf:'center' }}>
            <SmBtn primary onClick={save}>Add</SmBtn>
            <SmBtn onClick={() => setAdding(false)}>✕</SmBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop:8, fontSize:12, color:'var(--ink-400)',
          background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
          + Add production cost
        </button>
      )}

      {/* Costs footer */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'10px 0 0', textAlign:'right' }}>
        {[
          ['Production costs subtotal', subtotal],
          ['Production fee (20%)',       fee],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display:'flex', justifyContent:'flex-end', gap:40, marginBottom:4 }}>
            <span style={{ fontSize:11, color:'var(--ink-400)' }}>{lbl}</span>
            <MonoNum n={val}/>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:40, borderTop:'1.5px solid var(--ink-900)', paddingTop:10 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)' }}>Section total</span>
          <MonoNum n={total} bold/>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PROPOSAL TAB
   ───────────────────────────────────────────────────────── */
function ProposalTab({ projectId }) {
  const [producing, setProducing] = useLocalState(`budget_producing_${projectId || 'default'}_v1`, [])
  const [design,    setDesign]    = useLocalState(`budget_design_${projectId || 'default'}_v1`, [])
  const [costs,     setCosts]     = useLocalState(`budget_costs_${projectId || 'default'}_v1`, [])
  const [wfStatusRaw, setWfStatus] = useLocalState(`budget_wf_${projectId || 'default'}_v1`, 'Draft')
  const wfStatus = wfStatusRaw === 'Client Ready' ? 'Approved' : wfStatusRaw

  const prodSub  = producing.reduce((s,r) => s + toNum(r.days)*toNum(r.rate), 0)
  const prodFee  = Math.round(prodSub  * PRODUCING_FEE)
  const dsnSub   = design.reduce((s,r)   => s + toNum(r.days)*toNum(r.rate), 0)
  const dsnFee   = Math.round(dsnSub   * DESIGN_FEE)
  const costSub  = costs.reduce((s,r)   => s + toNum(r.qty)*toNum(r.price), 0)
  const costFee  = Math.round(costSub  * PROD_COST_FEE)
  const grand    = (prodSub + prodFee) + (dsnSub + dsnFee) + (costSub + costFee)

  /* Guided approval flow — each state exposes only its valid next actions */
  const WF_FLOW = {
    'Draft':              [{ label:'↑ Send to Leadership', to:'Sent to Leadership', primary:true }],
    'Sent to Leadership': [{ label:'In Review',          to:'In Review' },
                           { label:'Changes Requested',  to:'Changes Requested' },
                           { label:'Approved',           to:'Approved' }],
    'In Review':          [{ label:'Changes Requested',  to:'Changes Requested' },
                           { label:'Approved',           to:'Approved' }],
    'Changes Requested':  [{ label:'↑ Send to Leadership', to:'Sent to Leadership', primary:true }],
    'Approved':           [],
  }
  const WF_DOT = {
    'Draft':              'var(--ink-300)',
    'Sent to Leadership': 'var(--signal-amber-dot)',
    'In Review':          'var(--signal-blue-dot)',
    'Changes Requested':  'var(--signal-red-dot)',
    'Approved':           'var(--signal-green-dot)',
  }
  const wfActions = WF_FLOW[wfStatus] || []

  return (
    <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
      {/* Main content */}
      <div style={{ flex:1, minWidth:0 }}>
        <Strip cells={[
          { label:'Proposal total',        value:fmtUSD(grand),   dark:true },
          { label:'Producing fee (15%)',   value:fmtUSD(prodFee), sub:'On producing staff' },
          { label:'Design fee (60%)',      value:fmtUSD(dsnFee),  sub:'On design staff'    },
          { label:'Production fee (20%)', value:fmtUSD(costFee), sub:'On production costs' },
          { label:'Total with fees',       value:fmtUSD(grand),   warn:true },
        ]}/>

        {/* Section 1 */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h2 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:700, color:'var(--ink-900)' }}>1. Producing Staff</h2>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 8px', borderRadius:2 }}>
                15% fee applied
              </span>
            </div>
          </div>
          <StaffTable rows={producing} setRows={setProducing} feePct={PRODUCING_FEE} feeLbl="Producing staff fee"/>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:700, color:'var(--ink-900)' }}>2. Design Staff</h2>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
              color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 8px', borderRadius:2 }}>
              60% fee applied
            </span>
          </div>
          <StaffTable rows={design} setRows={setDesign} feePct={DESIGN_FEE} feeLbl="Design staff fee"/>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:700, color:'var(--ink-900)' }}>3. Production Costs</h2>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
              color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 8px', borderRadius:2 }}>
              20% production fee
            </span>
          </div>
          <CostsTable rows={costs} setRows={setCosts}/>
        </div>

        {/* Grand total */}
        <div style={{ borderTop:'2px solid var(--ink-900)', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:3 }}>Proposal total</p>
            <p style={{ fontSize:12, color:'var(--ink-300)' }}>Includes all fees</p>
          </div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:800, letterSpacing:'-0.04em', color:'var(--ink-900)' }}>
            {fmtUSD(grand)}
          </p>
        </div>
      </div>

      {/* Workflow sidebar */}
      <div style={{ width:210, flexShrink:0 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
            <Label>Proposal workflow</Label>
          </div>
          <div style={{ padding:'14px 16px 16px' }}>
            {/* Current status */}
            <Label>Current status</Label>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: WF_DOT[wfStatus] || 'var(--ink-300)' }}/>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{wfStatus}</p>
            </div>

            {/* Approved — terminal state, no further actions */}
            {wfStatus === 'Approved' && (
              <p style={{ marginTop:12, fontSize:12, fontWeight:600, color:'var(--signal-green-text)' }}>
                ✓ Ready for Client Distribution
              </p>
            )}

            {/* Only the actions valid for this state */}
            {wfActions.length > 0 && (
              <div style={{ marginTop:16 }}>
                {wfActions.length > 1 && <Label>Available actions</Label>}
                <div style={{ display:'flex', flexDirection:'column', gap:6,
                  marginTop: wfActions.length > 1 ? 8 : 0 }}>
                  {wfActions.map(a => (
                    <button key={a.to} onClick={() => setWfStatus(a.to)}
                      style={{ width:'100%', padding:'9px 10px', fontSize:11, fontWeight:700,
                        letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:4,
                        cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.1s',
                        background: a.primary ? 'var(--ink-900)' : 'transparent',
                        color: a.primary ? 'white' : 'var(--ink-700)',
                        border: a.primary ? 'none' : '1px solid var(--border-med)' }}
                      onMouseEnter={e => { if (!a.primary) e.currentTarget.style.background = 'var(--ground-dim)' }}
                      onMouseLeave={e => { if (!a.primary) e.currentTarget.style.background = 'transparent' }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {wfStatus === 'Approved' && (
          <button style={{ width:'100%', padding:'10px', fontSize:11, fontWeight:700, letterSpacing:'0.08em',
            textTransform:'uppercase', background:'var(--ink-900)', color:'white',
            border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
            Export PDF ↗
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   WORKING BUDGET TAB
   ───────────────────────────────────────────────────────── */
function WorkingBudgetTab({ projectId }) {
  const [cats, setCats]         = useLocalState(`budget_wb_${projectId || 'default'}_v1`, [])
  const [openIds, setOpenIds]   = useState({ wc1:true, wc2:true, wc3:true })
  const [addingTo, setAddingTo] = useState(null)   // category id or null
  const [editKey, setEditKey]   = useState(null)   // `${catId}__${itemId}` or null
  const [newItem, setNewItem]   = useState({ desc:'', budget:'', forecast:'' })

  const allItems    = cats.flatMap(c => c.items || [])
  const totalBudget = allItems.reduce((s, i) => s + toNum(i.budget),   0)
  const totalFcast  = allItems.reduce((s, i) => s + toNum(i.forecast), 0)
  const totalRem    = totalBudget - totalFcast

  const toggle = id => setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))

  const addItem = catId => {
    if (!newItem.desc) return
    setCats(prev => prev.map(c => c.id === catId
      ? { ...c, items: [...(c.items || []), { id: uid(), desc:newItem.desc, budget:toNum(newItem.budget), forecast:toNum(newItem.forecast) }] }
      : c
    ))
    setNewItem({ desc:'', budget:'', forecast:'' })
    setAddingTo(null)
  }

  const updItem = (catId, itemId, k, v) => setCats(prev => prev.map(c =>
    c.id === catId ? { ...c, items:(c.items||[]).map(i => i.id === itemId ? { ...i, [k]: k==='desc'?v:toNum(v) } : i) } : c
  ))

  const delItem = (catId, itemId) => setCats(prev => prev.map(c =>
    c.id === catId ? { ...c, items:(c.items||[]).filter(i => i.id !== itemId) } : c
  ))

  return (
    <div>
      <Strip cells={[
        { label:'Total budget',  value:fmtUSD(totalBudget), dark:true },
        { label:'Forecasted',    value:fmtUSD(totalFcast) },
        { label:'Remaining',     value:fmtUSD(totalRem), warn:totalRem < 0 },
      ]}/>

      {/* Column labels */}
      <div style={{ display:'grid', gridTemplateColumns:'20px minmax(0,1fr) 110px 110px 110px 60px',
        gap:8, paddingBottom:8, borderBottom:'1.5px solid var(--ink-900)', marginBottom:4 }}>
        <div/><div/>
        {['Budget','Forecast','Remaining',''].map((h, i) => (
          <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', textAlign:'right' }}>{h}</p>
        ))}
      </div>

      {/* Category rows */}
      {cats.map(cat => {
        const items    = cat.items || []
        const catBdg   = items.reduce((s,i) => s + toNum(i.budget),   0)
        const catFcast = items.reduce((s,i) => s + toNum(i.forecast), 0)
        const catRem   = catBdg - catFcast
        const isOpen   = !!openIds[cat.id]
        const editingId = editKey ? editKey.split('__')[1] : null
        const editingCat= editKey ? editKey.split('__')[0] : null

        return (
          <div key={cat.id}>
            {/* Category header */}
            <div onClick={() => toggle(cat.id)}
              style={{ display:'grid', gridTemplateColumns:'20px minmax(0,1fr) 110px 110px 110px 60px',
                gap:8, padding:'11px 0', borderBottom:'1px solid var(--border)',
                cursor:'pointer', alignItems:'center' }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ transform:isOpen?'rotate(90deg)':'none', transition:'transform .14s' }}>
                <path d="M2 1.5l4 3-4 3" stroke="var(--ink-300)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)' }}>{cat.name}</span>
              <span style={{ fontSize:12, color:'var(--ink-400)', textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(catBdg)}</span>
              <span style={{ fontSize:12, color:'var(--ink-400)', textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(catFcast)}</span>
              <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'var(--font-mono)',
                color: catRem < 0 ? 'var(--signal-red-text)' : 'var(--ink-700)' }}>{fmtUSD(catRem)}</span>
              <div/>
            </div>

            {/* Items */}
            {isOpen && (
              <div style={{ background:'var(--ground-dim)' }}>
                {items.map(item => (
                  editingCat === cat.id && editingId === item.id ? (
                    <div key={item.id} style={{ display:'grid', gridTemplateColumns:'20px minmax(0,1fr) 110px 110px 110px 60px',
                      gap:8, padding:'7px 0 7px 20px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                      <div/>
                      <input value={item.desc} onChange={e => updItem(cat.id,item.id,'desc',e.target.value)}
                        style={{...cellInput,width:'100%'}} autoFocus/>
                      <input type="number" value={item.budget} onChange={e => updItem(cat.id,item.id,'budget',e.target.value)}
                        style={{...cellInput,textAlign:'right',width:'100%'}}/>
                      <input type="number" value={item.forecast} onChange={e => updItem(cat.id,item.id,'forecast',e.target.value)}
                        style={{...cellInput,textAlign:'right',width:'100%'}}/>
                      <span style={{ fontSize:12, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(toNum(item.budget)-toNum(item.forecast))}</span>
                      <SmBtn primary onClick={() => setEditKey(null)}>✓</SmBtn>
                    </div>
                  ) : (
                    <div key={item.id} style={{ display:'grid', gridTemplateColumns:'20px minmax(0,1fr) 110px 110px 110px 60px',
                      gap:8, padding:'9px 0 9px 20px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                      <div/>
                      <span style={{ fontSize:13, color:'var(--ink-700)' }}>{item.desc}</span>
                      <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(item.budget)}</span>
                      <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(item.forecast)}</span>
                      <span style={{ fontSize:13, textAlign:'right', fontFamily:'var(--font-mono)',
                        color: toNum(item.budget)-toNum(item.forecast) < 0 ? 'var(--signal-red-text)' : 'var(--ink-700)' }}>
                        {fmtUSD(toNum(item.budget)-toNum(item.forecast))}
                      </span>
                      <div style={{ display:'flex', gap:2 }}>
                        <button onClick={() => setEditKey(`${cat.id}__${item.id}`)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--ink-300)', padding:'2px 3px' }}>✎</button>
                        <button onClick={() => delItem(cat.id, item.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--ink-200)', padding:'2px 3px' }}>✕</button>
                      </div>
                    </div>
                  )
                ))}

                {/* Add item */}
                {addingTo === cat.id ? (
                  <div style={{ display:'grid', gridTemplateColumns:'20px minmax(0,1fr) 110px 110px 110px 60px',
                    gap:8, padding:'7px 0 7px 20px', alignItems:'center' }}>
                    <div/>
                    <input placeholder="Description" value={newItem.desc} onChange={e => setNewItem(p=>({...p,desc:e.target.value}))}
                      style={{...cellInput,width:'100%'}} autoFocus/>
                    <input type="number" placeholder="Budget" value={newItem.budget} onChange={e => setNewItem(p=>({...p,budget:e.target.value}))}
                      style={{...cellInput,textAlign:'right',width:'100%'}}/>
                    <input type="number" placeholder="Forecast" value={newItem.forecast} onChange={e => setNewItem(p=>({...p,forecast:e.target.value}))}
                      style={{...cellInput,textAlign:'right',width:'100%'}}/>
                    <div/>
                    <div style={{ display:'flex', gap:4 }}>
                      <SmBtn primary onClick={() => addItem(cat.id)}>Add</SmBtn>
                      <SmBtn onClick={() => setAddingTo(null)}>✕</SmBtn>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingTo(cat.id)}
                    style={{ padding:'8px 24px', fontSize:12, color:'var(--ink-400)', background:'none',
                      border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                    + Add line item
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Totals footer */}
      <div style={{ borderTop:'1.5px solid var(--ink-900)', paddingTop:12, display:'flex', justifyContent:'flex-end', gap:40 }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)' }}>Total budget</span>
        <MonoNum n={totalBudget} bold/>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   EXPENSES TAB
   ───────────────────────────────────────────────────────── */
function ExpensesTab({ projectId }) {
  const [rows, setRows] = useLocalState(`budget_expenses_${projectId || 'default'}_v1`, [])
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date:'', vendor:'', cat:EXPENSE_CATS[0], desc:'', amount:'' })

  const totalBudget  = 278000
  const totalSpent   = rows.reduce((s, r) => s + toNum(r.amount), 0)
  const remaining    = totalBudget - totalSpent
  const pct          = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const save = () => {
    if (!form.vendor && !form.amount) return
    setRows(prev => [...prev, { id: uid(), ...form }])
    setForm({ date:'', vendor:'', cat:EXPENSE_CATS[0], desc:'', amount:'' })
    setAdding(false)
  }

  const upd = (id, k, v) => setRows(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r))
  const del = id => setRows(prev => prev.filter(r => r.id !== id))

  return (
    <div>
      <Strip cells={[
        { label:'Total budget',  value:fmtUSD(totalBudget), dark:true },
        { label:'Spent to date', value:fmtUSD(totalSpent),  sub:`${pct}% of budget` },
        { label:'Remaining',     value:fmtUSD(remaining),   warn:remaining < 0 },
      ]}/>

      {/* Progress bar */}
      <div style={{ marginBottom:20 }}>
        <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:5 }}>
          <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, borderRadius:2, transition:'width 0.4s',
            background: pct > 90 ? 'var(--signal-red-dot)' : pct > 75 ? 'var(--signal-amber-dot)' : 'var(--ink-700)' }}/>
        </div>
        <p style={{ fontSize:11, color:'var(--ink-300)' }}>{pct}% of budget spent · {rows.length} expense{rows.length !== 1 ? 's' : ''} logged</p>
      </div>

      {/* Add expense */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)' }}>Expenses</p>
        <button onClick={() => setAdding(a => !a)}
          style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
          + Add expense
        </button>
      </div>

      {adding && (
        <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 150px 1fr 110px', gap:10, marginBottom:10 }}>
            <div>
              <Label>Date</Label>
              <input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))}
                style={{...cellInput,width:'100%',colorScheme:'light'}} autoFocus/>
            </div>
            <div>
              <Label>Vendor</Label>
              <input placeholder="Vendor" value={form.vendor} onChange={e => setForm(p=>({...p,vendor:e.target.value}))} style={{...cellInput,width:'100%'}}/>
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.cat} onChange={e => setForm(p=>({...p,cat:e.target.value}))} style={{...cellInput,width:'100%'}}>
                {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <input placeholder="Description" value={form.desc} onChange={e => setForm(p=>({...p,desc:e.target.value}))} style={{...cellInput,width:'100%'}}/>
            </div>
            <div>
              <Label>Amount</Label>
              <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))}
                style={{...cellInput,width:'100%',textAlign:'right'}}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <SmBtn primary onClick={save}>Add expense</SmBtn>
            <SmBtn onClick={() => setAdding(false)}>Cancel</SmBtn>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 120px minmax(0,1fr) 100px 52px',
          gap:8, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          {['Date','Vendor','Category','Description','Amount',''].map((h, i) => (
            <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
              color:'var(--ink-300)', textAlign: i === 4 ? 'right' : 'left' }}>{h}</p>
          ))}
        </div>

        {rows.map(r => (
          editId === r.id ? (
            <div key={r.id} style={{ display:'grid', gridTemplateColumns:'90px 1fr 120px minmax(0,1fr) 100px 52px',
              gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', background:'var(--ground-dim)', alignItems:'center' }}>
              <input type="date" value={r.date} onChange={e => upd(r.id,'date',e.target.value)} style={{...cellInput,width:'100%',colorScheme:'light'}} autoFocus/>
              <input value={r.vendor} onChange={e => upd(r.id,'vendor',e.target.value)} style={{...cellInput,width:'100%'}}/>
              <select value={r.cat} onChange={e => upd(r.id,'cat',e.target.value)} style={{...cellInput,width:'100%'}}>
                {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={r.desc} onChange={e => upd(r.id,'desc',e.target.value)} style={{...cellInput,width:'100%'}}/>
              <input type="number" value={r.amount} onChange={e => upd(r.id,'amount',e.target.value)} style={{...cellInput,textAlign:'right',width:'100%'}}/>
              <SmBtn primary onClick={() => setEditId(null)}>✓</SmBtn>
            </div>
          ) : (
            <div key={r.id} style={{ display:'grid', gridTemplateColumns:'90px 1fr 120px minmax(0,1fr) 100px 52px',
              gap:8, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--ink-400)' }}>{r.date}</span>
              <span style={{ fontSize:14, fontWeight:500 }}>{r.vendor}</span>
              <span style={{ fontSize:12, color:'var(--ink-500)' }}>{r.cat}</span>
              <span style={{ fontSize:13, color:'var(--ink-600)' }}>{r.desc}</span>
              <span style={{ fontSize:13, fontWeight:600, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtUSD(r.amount)}</span>
              <div style={{ display:'flex', gap:2 }}>
                <button onClick={() => setEditId(r.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-300)', padding:'2px 4px' }}>✎</button>
                <button onClick={() => del(r.id)}       style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-200)', padding:'2px 4px' }}>✕</button>
              </div>
            </div>
          )
        ))}

        {rows.length === 0 && (
          <div style={{ padding:'32px 0', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)' }}>No expenses logged yet</p>
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ paddingTop:12, display:'flex', justifyContent:'flex-end', gap:40, borderTop:'1.5px solid var(--ink-900)' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)' }}>Total spent to date</span>
            <MonoNum n={totalSpent} bold/>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ROOT — Budget page
   ───────────────────────────────────────────────────────── */
export default function Budget({ projectId, production }) {
  const [tab, setTab] = useState('proposal')
  const client      = production?.client || ''
  const totalBudget = production?.budget || ''
  const TABS = [
    { id:'proposal', label:'Proposal' },
    { id:'working',  label:'Working Budget' },
    { id:'expenses', label:'Expenses' },
  ]

  return (
    <div style={{ padding:'36px 72px 80px', width:'100%', fontFamily:'var(--font)' }}>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:8 }}>Planning · Budget</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:10 }}>
              <span style={{ fontWeight:700, color:'var(--ink-900)' }}>Budget</span>
            </h1>
            <PageOwner area="Budget" projectId={projectId}/>
            {(client || totalBudget) && (
              <p style={{ fontSize:13, color:'var(--ink-500)' }}>
                {client && <span style={{ fontWeight:600 }}>{client}</span>}
                {client && totalBudget && <span style={{ color:'var(--ink-300)' }}> · </span>}
                {totalBudget && <span>Total budget: <span style={{ fontWeight:600, color:'var(--ink-900)' }}>{totalBudget}</span></span>}
              </p>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'transparent', color:'var(--ink-700)', border:'1px solid var(--border-med)', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
              ↑ Send to Leadership
            </button>
            <button style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'var(--ink-900)', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
              Export PDF ↗
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--ink-900)', marginBottom:24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'10px 0', marginRight:28, fontSize:14, fontWeight:500, fontFamily:'var(--font)',
              background:'none', border:'none', cursor:'pointer',
              color: tab === t.id ? 'var(--ink-900)' : 'var(--ink-400)',
              borderBottom: tab === t.id ? '2px solid var(--ink-900)' : '2px solid transparent',
              marginBottom: -1.5, transition:'color 0.1s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.15 }}>
            {tab === 'proposal' && <ProposalTab projectId={projectId}/>}
            {tab === 'working'  && <WorkingBudgetTab projectId={projectId}/>}
            {tab === 'expenses' && <ExpensesTab projectId={projectId}/>}
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
