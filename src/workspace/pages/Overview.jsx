import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const fade = (i = 0) => ({
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.26, delay: i * 0.055, ease: [0.25, 1, 0.5, 1] },
})

/* ────────────────────────────────────────────────────────────
   Derive attention items from live store state
   ──────────────────────────────────────────────────────────── */

/* ── Primitives ─────────────────────────────────────────────── */
function Dot({ color = 'green', size = 7 }) {
  const bg = { green:'var(--signal-green-dot)', amber:'var(--signal-amber-dot)', red:'var(--signal-red-dot)' }[color]
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0 }}/>
}

function Tag({ children, variant = 'neutral' }) {
  const s = {
    red:     { background:'var(--signal-red-bg)',   color:'var(--signal-red-text)'   },
    amber:   { background:'var(--signal-amber-bg)', color:'var(--signal-amber-text)' },
    green:   { background:'var(--signal-green-bg)', color:'var(--signal-green-text)' },
    blue:    { background:'var(--signal-blue-bg)',  color:'var(--signal-blue-text)'  },
    neutral: { background:'var(--ground-dim)',      color:'var(--ink-400)'           },
    dark:    { background:'var(--ink-900)',         color:'white'                    },
  }[variant] || { background:'var(--ground-dim)', color:'var(--ink-400)' }
  return (
    <span style={{ ...s, fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>
      {children}
    </span>
  )
}

function Avatar({ initials, size = 24 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:'var(--ink-800)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size < 26 ? 9 : 11, fontWeight:700, color:'rgba(255,255,255,0.60)',
      flexShrink:0, fontFamily:'var(--font)', letterSpacing:'0.02em',
    }}>{initials}</div>
  )
}

/* ── Snapshot card — clickable shortcut to module ───────────── */
function SnapshotCard({ label, value, sub, onClick, dark }) {
  const [hov, setHov] = useState(false)
  const clickable = !!onClick

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => clickable && setHov(true)}
      onMouseLeave={() => clickable && setHov(false)}
      style={{
        padding:       '14px 16px',
        minHeight:     88,
        background:    dark ? 'var(--ink-900)' : hov ? 'var(--surface-dim)' : 'var(--surface)',
        border:        `1px solid ${dark ? 'transparent' : hov ? 'var(--border-med)' : 'var(--border)'}`,
        borderRadius:  4,
        cursor:        clickable ? 'pointer' : 'default',
        transition:    'background 0.12s, border-color 0.12s',
        display:       'flex',
        flexDirection: 'column',
        gap:           0,
      }}
    >
      <p style={{
        fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
        color: dark ? 'rgba(255,255,255,0.28)' : 'var(--ink-300)', marginBottom:8,
      }}>{label}</p>

      <p style={{
        fontSize:16, fontWeight:600, letterSpacing:'-0.01em', lineHeight:1.2,
        color: dark ? 'rgba(255,255,255,0.90)' : 'var(--ink-900)',
        fontFamily: 'var(--font)',
      }}>{value || '—'}</p>

      {sub && (
        <p style={{ fontSize:11, color: dark ? 'rgba(255,255,255,0.35)' : 'var(--ink-300)', marginTop:4 }}>{sub}</p>
      )}

      {/* Link hint on hover */}
      {clickable && hov && (
        <p style={{ fontSize:10, color:dark?'rgba(255,255,255,0.22)':'var(--ink-200)', marginTop:6, letterSpacing:'0.04em' }}>
          Open ↗
        </p>
      )}
    </div>
  )
}

/* ── Workstream row ─────────────────────────────────────────── */
function WorkstreamRow({ ws }) {
  const isAttn = ws.status === 'attention'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
      <Dot color={isAttn ? 'amber' : 'green'} size={6}/>
      <p style={{ flex:1, fontSize:13, fontWeight:isAttn?600:400, color:isAttn?'var(--ink-900)':'var(--ink-700)' }}>
        {ws.name}
      </p>
      <Tag variant={isAttn ? 'amber' : 'neutral'}>{isAttn ? 'Attention' : 'On track'}</Tag>
      {ws.owner && <Avatar initials={ws.owner.initials}/>}
      <p style={{ fontSize:11, color:'var(--ink-300)', minWidth:100, textAlign:'right', lineHeight:1.3 }}>
        {ws.nextDeliverable}
      </p>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, opacity:0.22 }}>
        <path d="M2 6h8M6 2l4 4-4 4" stroke="var(--ink-900)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

/* ── Milestone row ──────────────────────────────────────────── */
function MilestoneRow({ m, isLast }) {
  const isNext    = m.isNext
  const isOverdue = !m.done && !m.isEvent && m.daysOut < 0

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, padding:'10px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      opacity: m.done ? 0.35 : 1,
    }}>
      <div style={{
        width:10, height:10, borderRadius:'50%', flexShrink:0,
        background: m.done || m.isEvent ? 'var(--ink-900)' : isOverdue ? 'var(--signal-red-dot)' : 'transparent',
        border: m.done || m.isEvent ? 'none' : isOverdue ? 'none' : isNext ? '2px solid var(--signal-amber-dot)' : '1.5px solid var(--border-med)',
      }}/>
      <p style={{
        width:40, fontSize:10, fontFamily:'var(--font-mono)', flexShrink:0, letterSpacing:'0.04em',
        fontWeight: isNext ? 700 : 400,
        color: isOverdue ? 'var(--signal-red-text)' : isNext ? 'var(--signal-amber-text)' : 'var(--ink-300)',
      }}>{m.date}</p>
      <p style={{
        flex:1, fontSize:13, fontWeight:isNext?600:400,
        color: m.done ? 'var(--ink-300)' : isNext ? 'var(--ink-900)' : 'var(--ink-600)',
        textDecoration: m.done ? 'line-through' : 'none',
      }}>{m.label}</p>
      <Tag variant={m.done?'neutral':isOverdue?'red':isNext?'dark':m.isEvent?'blue':'neutral'}>
        {m.done ? 'Complete' : isOverdue ? 'Overdue' : isNext ? 'Up next' : m.isEvent ? 'Event' : 'Upcoming'}
      </Tag>
    </div>
  )
}

/* ── Activity ───────────────────────────────────────────────── */
import ProjectNotes from '../../components/ProjectNotes.jsx'
import { readProjectBudget, fmtUSD } from '../../projectData.js'

function timeAgo(iso) {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h/24)}d ago`
  } catch { return '' }
}

function ActivityItem({ item, isLast }) {
  const initials = (item.userName || '?').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:isLast?'none':'1px solid var(--border)' }}>
      <Avatar initials={initials}/>
      <p style={{ flex:1, fontSize:12.5, color:'var(--ink-700)', lineHeight:1.4 }}>
        <span style={{ fontWeight:500, color:'var(--ink-900)' }}>{item.userName}</span>{' '}
        <span style={{ color:'var(--ink-500)' }}>{item.action}</span>{' '}
        {item.target && <span style={{ color:'var(--ink-700)' }}>{item.target}</span>}
      </p>
      <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0, fontFamily:'var(--font-mono)' }}>{timeAgo(item.timestamp)}</p>
    </div>
  )
}

/* ── Section card wrapper ────────────────────────────────────── */
function SectionCard({ title, right, children, padded = true }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{title}</p>
        {right}
      </div>
      <div style={{ padding: padded ? '4px 18px' : 0 }}>{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Overview page
   ───────────────────────────────────────────────────────────── */
export default function Overview({ onNavigate, production: productionProp, venueName: venueNameProp, currentUser, projectId, isViewOnly, owner }) {
  const { state, derived } = useStore()
  const production = productionProp || state.production
  const pid = projectId || production?.id || 'p4'
  const projBudget = readProjectBudget(pid)   // canonical: the Budget page's data
  const { daysOut, nextGate, totals, workstreamsResolved, milestonesResolved } = derived

  // Live activity log filtered to this project
  const activityItems = (state.activityLog || [])
    .filter(a => !a.projectId || a.projectId === pid)
    .slice(0, 6)

  const milestonesShown  = milestonesResolved.slice(0, 6)

  // Project name split: "Apple" bold + "Vision Pro Executive Dinner" italic
  const client      = production.client || production.name.split(' ')[0]
  const projectName = production.name.replace(client, '').trim() || production.name

  const daysLabel = daysOut === null ? null
    : daysOut > 0 ? `${daysOut} day${daysOut !== 1 ? 's' : ''} until event`
    : daysOut === 0 ? 'Event day'
    : 'Post-event'

  // Snapshot values
  const venueName    = venueNameProp || state.logistics?.venue?.name || '—'
  const budgetTotal  = production.budget || '—'
  const guestCount   = production.guestCount || '—'
  const eventDate    = production.eventDate || '—'
  const eventTime    = production.eventTime || '6:30 PM'
  const location     = production.location || '—'

  const nav = (page) => onNavigate && onNavigate(page)

  return (
    <div className="page-content-wide page-enter">

      {/* ── 1. Project header ─────────────────────────────────── */}
      <motion.div {...fade(0)} style={{ marginBottom:22 }}>
        <h1 style={{
          fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
          letterSpacing:'-0.01em', lineHeight:1.05, color:'var(--ink-900)', marginBottom:14,
        }}>
          <span style={{ fontWeight:700 }}>{client}</span>
          {projectName && (
            <span style={{ fontWeight:800, color:'var(--signal-amber-dot)', fontStyle:'normal' }}>
              {' '}{projectName}
            </span>
          )}
        </h1>

        {/* Owner — shown when set, before status */}
        {owner && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink-200)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:9, fontWeight:700, color:'var(--ink-600)', flexShrink:0 }}>
              {owner.initials}
            </div>
            <span style={{ fontSize:12, color:'var(--ink-500)' }}>
              <span style={{ fontWeight:600, color:'var(--ink-700)' }}>{owner.name}</span>
              {' '}<span style={{ color:'var(--ink-300)' }}>· Project owner</span>
            </span>
          </div>
        )}

        {/* Date row — status/attention/approvals labels removed per review; date only */}
        <div style={{
          display:'flex', alignItems:'center', gap:0,
          paddingBottom:20, borderBottom:'1px solid var(--border)',
        }}>
          {daysLabel && (
            <span style={{ fontSize:12.5, color:'var(--ink-500)' }}>{daysLabel}</span>
          )}
        </div>
      </motion.div>

      {/* ── 2. Project snapshot — 6 cards, each a module shortcut ── */}
      <motion.div {...fade(1)} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8, marginBottom:24 }}>
        <SnapshotCard
          label="Date"
          value={eventDate.split(',')[0] || eventDate}
          sub={eventDate.includes(',') ? eventDate.split(',').slice(1).join(',').trim() : null}
        />
        <SnapshotCard
          label="Time"
          value={eventTime}
        />
        <SnapshotCard
          label="Location"
          value={location}
        />
        <SnapshotCard
          label="Venue"
          value={venueName}
          sub="Confirmed"
        />
        <SnapshotCard
          label="Guest count"
          value={String(guestCount)}
        />
        <SnapshotCard
          label="Budget"
          value={projBudget.hasData ? fmtUSD(projBudget.total) : budgetTotal}
          sub={projBudget.hasData
            ? (projBudget.spent > 0
                ? `${fmtUSD(projBudget.spent)} spent`
                : `Forecast ${fmtUSD(projBudget.forecast)}`)
            : undefined}
        />
      </motion.div>

      {/* ── 3. Two-column body ────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:18, maxWidth:'var(--cap-wide)' }}>

        {/* LEFT: Workstreams */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Workstreams */}
          <motion.div {...fade(3)}>
            <SectionCard
              title="Workstreams"
              right={
                <p style={{ fontSize:11, color:'var(--ink-300)' }}>
                  {workstreamsResolved.filter(w=>w.status!=='attention').length}/{workstreamsResolved.length} on track
                </p>
              }
            >
              {workstreamsResolved.map(ws => <WorkstreamRow key={ws.id} ws={ws}/>)}
              {/* Remove bottom border from last row */}
              <style>{`.ws-last { border-bottom: none !important; }`}</style>
            </SectionCard>
          </motion.div>
        </div>

        {/* RIGHT: Milestones + Activity */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Upcoming milestones */}
          <motion.div {...fade(2)}>
            <SectionCard
              title="Upcoming milestones"
              right={
                <button
                  onClick={() => nav('timeline')}
                  style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  View full timeline
                </button>
              }
            >
              {milestonesShown.map((m, i) => (
                <MilestoneRow key={m.id} m={m} isLast={i === milestonesShown.length - 1}/>
              ))}
            </SectionCard>
          </motion.div>

          {/* Recent activity — live from store */}
          <motion.div {...fade(3)}>
            <SectionCard title="Recent activity">
              {activityItems.length === 0 ? (
                <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic', padding:'12px 0' }}>No activity yet</p>
              ) : activityItems.map((item, i) => (
                <ActivityItem key={item.id} item={item} isLast={i === activityItems.length - 1}/>
              ))}
            </SectionCard>
          </motion.div>

          {/* Team notes */}
          <motion.div {...fade(4)}>
            <SectionCard title="Team notes" padded={true}>
              <div style={{ paddingTop:4, paddingBottom:8 }}>
                <ProjectNotes projectId={pid} currentUser={currentUser} maxVisible={3} compact/>
              </div>
            </SectionCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
