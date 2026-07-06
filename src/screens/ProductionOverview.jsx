import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screen, Topbar, BtnOutline, Chip, Avatar, Divider, StatusDot } from '../components.jsx'
import { DEFAULT_PRODUCTION, WORKSTREAMS, DAY1_ACTIONS, MILESTONES, TEAM_MEMBERS } from '../data.js'

export default function ProductionOverview({ onAllProductions }) {
  const p = DEFAULT_PRODUCTION
  const [checkedItems, setCheckedItems] = useState({})
  const [dismissedBanner, setDismissedBanner] = useState(false)

  const toggleCheck = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalActions = DAY1_ACTIONS.length
  const nextMilestone = MILESTONES.find(m => !m.done && !m.isEvent)

  return (
    <Screen>
      <Topbar
        crumbs={[p.name, 'Production overview']}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>EP: {p.ep}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Lead: {p.lead}</span>
            <BtnOutline onClick={onAllProductions} style={{ padding: '6px 14px', fontSize: 12 }}>
              All productions
            </BtnOutline>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ width:'100%', padding: '0 72px 80px' }}>

          <AnimatePresence>
            {!dismissedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 18px',
                  background: 'var(--signal-green-bg)',
                  border: '1px solid rgba(45,106,53,0.18)',
                  borderRadius: 'var(--r-md)',
                  marginTop: 20,
                  marginBottom: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6.5" stroke="var(--signal-green-text)" strokeWidth="1"/>
                  <path d="M4 7l2 2 4-4" stroke="var(--signal-green-text)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, color: 'var(--signal-green-text)', fontWeight: 500 }}>
                  Production live — team notified, Day 1 priorities activated.
                </span>
                <button onClick={() => setDismissedBanner(true)}
                  style={{ marginLeft: 'auto', color: 'var(--signal-green-text)', fontSize: 18, lineHeight: 1, opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none' }}>
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25,1,0.5,1] }}
          >
            {/* Page header */}
            <div style={{ padding: '32px 0 28px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-400)', fontWeight: 500, marginBottom: 8 }}>
                    {p.currentPhase} phase
                  </p>
                  <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>{p.name}</h1>
                  <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>
                    {p.client} · {p.type} · {p.venue} · {p.budgetTier} scale
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Chip color="green">On schedule</Chip>
                </div>
              </div>
            </div>

            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 36 }}>
              <StatCard label="Event date" value="Jul 16" sub="2026 · Brooklyn Tower" />
              <StatCard label="Days to event" value={String(p.daysOut)} sub={p.currentPhase + ' phase'} inverted />
              <StatCard label="Next gate" value="Jul 1" sub={'Creative lock · 5 days'} alert />
              <StatCard label="Open tasks" value="34" sub="Across 6 workstreams" />
              <StatCard label="Day 1 actions" value={`${checkedCount}/${totalActions}`} sub="Complete within 48h" />
            </div>

            {/* Main two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 316px', gap: 32 }}>

              {/* Left: workstreams */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-400)', fontWeight: 500 }}>
                    Workstreams
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>Click to open</span>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--surface)' }}>
                  {WORKSTREAMS.map((ws, i) => (
                    <motion.div
                      key={ws.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                    >
                      <WorkstreamRow ws={ws} isLast={i === WORKSTREAMS.length - 1} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Day 1 priorities */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-400)', fontWeight: 500 }}>
                      Day 1 priorities
                    </p>
                    <span style={{ fontSize: 11, color: checkedCount === totalActions ? 'var(--signal-green-text)' : 'var(--ink-400)' }}>
                      {checkedCount}/{totalActions} done
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {DAY1_ACTIONS.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
                        <ActionItem action={a} checked={!!checkedItems[a.id]} onToggle={() => toggleCheck(a.id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Production health */}
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-400)', fontWeight: 500, marginBottom: 14 }}>
                    Production health
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <HealthRow label="Timeline" status="green" detail="On schedule" />
                    <HealthRow label="Budget" status="green" detail="Within envelope" />
                    <HealthRow label="Creative" status="amber" detail="Brief pending approval" />
                    <HealthRow label="Venue" status="green" detail="Hold confirmed" />
                    <HealthRow label="Hospitality" status="amber" detail="Guest list in progress" />
                    <HealthRow label="Fabrication" status="green" detail="RFQ issued" />
                  </div>
                </div>

                <Divider />

                {/* Production team */}
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-400)', fontWeight: 500, marginBottom: 14 }}>
                    Production team
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {TEAM_MEMBERS.map(m => (
                      <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={m.initials} color={m.avatarColor} size={30} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-900)' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--ink-400)' }}>{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Screen>
  )
}

function StatCard({ label, value, sub, inverted, alert }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25,1,0.5,1] }}
      style={{
        background: inverted ? 'var(--ink-900)' : alert ? 'var(--signal-amber-bg)' : 'var(--surface)',
        border: inverted ? 'none' : alert ? '1px solid rgba(146,101,10,0.15)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '16px 18px',
      }}
    >
      <p style={{
        fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 500,
        color: inverted ? 'rgba(255,255,255,0.38)' : alert ? 'var(--signal-amber-text)' : 'var(--ink-400)',
        marginBottom: 8,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 24, fontWeight: 400, letterSpacing: '-0.03em',
        fontFamily: 'var(--font-display)',
        color: inverted ? 'white' : alert ? 'var(--signal-amber-text)' : 'var(--ink-900)',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: inverted ? 'rgba(255,255,255,0.35)' : alert ? 'var(--signal-amber-text)' : 'var(--ink-400)', opacity: inverted ? 1 : 0.85 }}>
        {sub}
      </p>
    </motion.div>
  )
}

function WorkstreamRow({ ws, isLast }) {
  const [hovered, setHovered] = useState(false)
  const pct = Math.round((ws.completedTasks / ws.taskCount) * 100)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 140px 80px',
        alignItems: 'center',
        padding: '13px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: hovered ? 'var(--ground-dim)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.12s ease',
        gap: 16,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <StatusDot color={ws.status === 'attention' ? 'amber' : 'green'} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-900)' }}>{ws.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 80, height: 2, background: 'var(--ink-100)', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 0 ? 'var(--signal-green-dot)' : 'transparent', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{ws.completedTasks}/{ws.taskCount}</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, color: 'var(--ink-400)', marginBottom: 2 }}>Next deliverable</p>
        <p style={{ fontSize: 12, color: 'var(--ink-700)', fontWeight: 500 }}>{ws.nextDeliverable}</p>
        <p style={{ fontSize: 11, color: 'var(--ink-400)' }}>{ws.nextDate}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Avatar initials={ws.ownerInitials} color={ws.ownerColor} size={22} />
        <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{ws.owner.split(' ')[0]}</span>
      </div>
    </div>
  )
}

function ActionItem({ action, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 9,
        padding: '9px 11px',
        background: checked ? 'transparent' : 'var(--ground-dim)',
        borderRadius: 'var(--r-sm)',
        cursor: 'pointer',
        opacity: checked ? 0.4 : 1,
        transition: 'opacity 0.2s ease, background 0.15s ease',
        border: '1px solid transparent',
      }}
    >
      <div style={{
        width: 14, height: 14,
        border: checked ? 'none' : '1.5px solid var(--border-strong)',
        borderRadius: 3,
        flexShrink: 0,
        marginTop: 2,
        background: checked ? 'var(--ink-900)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}>
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, color: 'var(--ink-700)',
          textDecoration: checked ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}>
          {action.text}
        </p>
        <p style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>{action.owner}</p>
      </div>
    </div>
  )
}

function HealthRow({ label, status, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <StatusDot color={status} />
      <span style={{ fontSize: 13, color: 'var(--ink-700)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{detail}</span>
    </div>
  )
}
