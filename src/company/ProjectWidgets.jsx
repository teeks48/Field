/* ─────────────────────────────────────────────────────────
   Project-specific widget render components.
   All pull from companyData.js seed (placeholder for now —
   per-project operational data, e.g. Logistics/Hospitality,
   isn't wired per-project yet, so these show representative
   placeholders for non-seeded projects).
   ───────────────────────────────────────────────────────── */
import React from 'react'
import { getProjectById } from './dashboardWidgets.js'
import { useStore } from '../store.jsx'

const wrap = { padding:'16px 18px' }
const emptyMsg = label => (
  <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
    No {label} data connected for this project yet.
  </p>
)

function Header({ project, sub }) {
  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:4 }}>{sub}</p>
      <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{project.name}</p>
    </div>
  )
}

export function TimelineWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('timeline')}</div>
  return (
    <div style={wrap}>
      <Header project={p} sub="Timeline"/>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)' }}>
        <p style={{ fontSize:12, color:'var(--ink-700)' }}>{p.nextMilestone}</p>
        <p style={{ fontSize:11, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{p.eventDate}</p>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)' }}>
        <p style={{ fontSize:12, color:'var(--ink-500)' }}>Phase</p>
        <p style={{ fontSize:11, color:'var(--ink-500)' }}>{p.phase}</p>
      </div>
    </div>
  )
}

export function BudgetWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('budget')}</div>
  return (
    <div style={wrap}>
      <Header project={p} sub="Budget"/>
      <p style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800,
        color:'var(--ink-900)', letterSpacing:'-0.03em', marginBottom:4 }}>{p.budget}</p>
      <p style={{ fontSize:11, color:'var(--ink-400)' }}>Total approved budget</p>
    </div>
  )
}

export function TeamWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('team')}</div>
  return (
    <div style={wrap}>
      <Header project={p} sub="Team"/>
      <div style={{ display:'flex', gap:-6 }}>
        {(p.team||[]).map((t,i) => (
          <div key={i} style={{ marginLeft:i===0?0:-6, width:26, height:26, borderRadius:'50%',
            background:'var(--ink-800)', border:'2px solid var(--surface)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', fontFamily:'var(--font)' }}>{t}</div>
        ))}
      </div>
      <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:8 }}>Lead: {p.lead}</p>
    </div>
  )
}

export function VendorsWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('vendor')}</div>
  return (
    <div style={wrap}>
      <Header project={p} sub="Vendors"/>
      {emptyMsg('vendor')}
    </div>
  )
}

export function ApprovalsWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('approvals')}</div>
  return (
    <div style={wrap}>
      <Header project={p} sub="Approvals"/>
      {p.status === 'attention'
        ? <p style={{ fontSize:12, color:'var(--signal-amber-text)' }}>This project needs attention.</p>
        : <p style={{ fontSize:12, color:'var(--ink-500)' }}>No pending approvals.</p>}
    </div>
  )
}

export function RunOfShowWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('run of show')}</div>
  return <div style={wrap}><Header project={p} sub="Run of Show"/>{emptyMsg('run of show')}</div>
}
export function HospitalityWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('hospitality')}</div>
  return <div style={wrap}><Header project={p} sub="Hospitality"/>{emptyMsg('hospitality')}</div>
}
export function FabricationWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('fabrication')}</div>
  return <div style={wrap}><Header project={p} sub="Fabrication"/>{emptyMsg('fabrication')}</div>
}
export function AVTechWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('AV / Tech')}</div>
  return <div style={wrap}><Header project={p} sub="AV / Tech"/>{emptyMsg('AV / Tech')}</div>
}
export function ContentWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('content')}</div>
  return <div style={wrap}><Header project={p} sub="Content"/>{emptyMsg('content')}</div>
}
export function FilesWidget({ projectId }) {
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('files')}</div>
  return <div style={wrap}><Header project={p} sub="Files"/>{emptyMsg('files')}</div>
}

const DELIV_STAGES = ['Not started','In progress','Internal review','Client review','Approved','Production ready']

export function DeliverablesWidget({ projectId }) {
  const { state } = useStore()
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('deliverables')}</div>

  // state.deliverables only ever holds data for whichever project is
  // currently open in the workspace — be honest about that rather than
  // showing another project's numbers under this one's name.
  const isActiveProject = state.production?.id === projectId
  if (!isActiveProject) {
    return (
      <div style={wrap}>
        <Header project={p} sub="Deliverables"/>
        <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
          Open this project's workspace to see live deliverable status.
        </p>
      </div>
    )
  }

  const items = state.deliverables.filter(d => d.projectId === projectId)
  const byStage = DELIV_STAGES.map(stage => ({
    stage, count: items.filter(d => d.status === stage).length,
  })).filter(s => s.count > 0)
  const clientFacing = items.filter(d => DELIV_STAGES.indexOf(d.status) >= DELIV_STAGES.indexOf('Client review')).length

  return (
    <div style={wrap}>
      <Header project={p} sub="Deliverables"/>
      {items.length === 0 ? emptyMsg('deliverables') : (
        <>
          <p style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800,
            color:'var(--ink-900)', letterSpacing:'-0.03em', marginBottom:2 }}>{items.length}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)', marginBottom:10 }}>
            total · {clientFacing} at client review or beyond
          </p>
          {byStage.map(s => (
            <div key={s.stage} style={{ display:'flex', justifyContent:'space-between',
              padding:'5px 0', borderTop:'1px solid var(--border)' }}>
              <p style={{ fontSize:12, color:'var(--ink-600)' }}>{s.stage}</p>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-800)' }}>{s.count}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const FULFILL_STAGES = ['In production','Ready to print','Sent to vendor','Delivered','Archived']

export function FulfillmentWidget({ projectId }) {
  const { state } = useStore()
  const p = getProjectById(projectId)
  if (!p) return <div style={wrap}>{emptyMsg('fulfillment')}</div>

  const isActiveProject = state.production?.id === projectId
  if (!isActiveProject) {
    return (
      <div style={wrap}>
        <Header project={p} sub="Fulfillment"/>
        <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
          Open this project's workspace to see live print and production status.
        </p>
      </div>
    )
  }

  const items = state.assets.filter(a => a.projectId === projectId)
  const needsDetails = items.filter(a => a.printer === 'TBD').length
  const byStage = FULFILL_STAGES.map(stage => ({
    stage, count: items.filter(a => a.status === stage).length,
  })).filter(s => s.count > 0)

  return (
    <div style={wrap}>
      <Header project={p} sub="Fulfillment / Printing"/>
      {items.length === 0 ? emptyMsg('fulfillment') : (
        <>
          <p style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800,
            color:'var(--ink-900)', letterSpacing:'-0.03em', marginBottom:2 }}>{items.length}</p>
          <p style={{ fontSize:11, color:needsDetails>0?'var(--signal-amber-text)':'var(--ink-400)', marginBottom:10 }}>
            in production{needsDetails > 0 ? ` · ${needsDetails} need print details` : ''}
          </p>
          {byStage.map(s => (
            <div key={s.stage} style={{ display:'flex', justifyContent:'space-between',
              padding:'5px 0', borderTop:'1px solid var(--border)' }}>
              <p style={{ fontSize:12, color:'var(--ink-600)' }}>{s.stage}</p>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-800)' }}>{s.count}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export function ShortlistWidget() {
  let sl = { venues:[], vendors:[] }
  try { sl = JSON.parse(localStorage.getItem('field_shortlist_v1') || '{"venues":[],"vendors":[]}') } catch {}
  return (
    <div style={wrap}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:10 }}>Shortlist</p>
      <div style={{ display:'flex', gap:20 }}>
        <div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--ink-900)' }}>{sl.venues.length}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>Venues saved</p>
        </div>
        <div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--ink-900)' }}>{sl.vendors.length}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>Vendors saved</p>
        </div>
      </div>
    </div>
  )
}

export function VenueLibraryWidget() {
  return (
    <div style={wrap}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:10 }}>Venue Library</p>
      <p style={{ fontSize:12, color:'var(--ink-500)' }}>12 venues in directory</p>
    </div>
  )
}
export function InventoryWidget() {
  return (
    <div style={wrap}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:10 }}>Inventory</p>
      <p style={{ fontSize:12, color:'var(--ink-500)' }}>22 items tracked</p>
    </div>
  )
}
export function TeamDirectoryWidget() {
  return (
    <div style={wrap}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-300)', marginBottom:10 }}>Team Directory</p>
      <p style={{ fontSize:12, color:'var(--ink-500)' }}>37 people in directory</p>
    </div>
  )
}

export const PROJECT_WIDGET_COMPONENTS = {
  'proj-timeline':    TimelineWidget,
  'proj-budget':      BudgetWidget,
  'proj-team':        TeamWidget,
  'proj-vendors':     VendorsWidget,
  'proj-approvals':   ApprovalsWidget,
  'proj-runofshow':   RunOfShowWidget,
  'proj-hospitality': HospitalityWidget,
  'proj-fabrication': FabricationWidget,
  'proj-avtech':      AVTechWidget,
  'proj-content':     ContentWidget,
  'proj-files':       FilesWidget,
  'proj-deliverables':DeliverablesWidget,
  'proj-fulfillment': FulfillmentWidget,
}

export const LIBRARY_WIDGET_COMPONENTS = {
  'lib-shortlist': ShortlistWidget,
  'lib-venues':    VenueLibraryWidget,
  'lib-inventory': InventoryWidget,
  'lib-team':      TeamDirectoryWidget,
}
