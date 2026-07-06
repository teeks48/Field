import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store.jsx'

const EVENT_COLORS = {
  'Milestone':   { bg:'var(--ink-900)',             text:'white' },
  'ROS Phase':   { bg:'var(--signal-blue-bg)',      text:'var(--signal-blue-text)' },
  'Approval':    { bg:'var(--signal-amber-bg)',     text:'var(--signal-amber-text)' },
  'Logistics':   { bg:'var(--signal-teal-bg)',      text:'var(--signal-teal-text)' },
  'Event':       { bg:'var(--ink-900)',             text:'white' },
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function parseAnyDate(str) {
  if (!str) return null
  // Try ISO first
  let d = new Date(str + (str.includes('T') ? '' : 'T12:00:00'))
  if (!isNaN(d)) return d
  // Try "Jul 15, 2026" or "July 15"
  d = new Date(str)
  if (!isNaN(d)) return d
  return null
}

function toISO(date) {
  return date?.toISOString?.().slice(0,10) || null
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export default function Calendar({ projectId, production }) {
  const { state, derived } = useStore()
  const [cursor,  setCursor]  = useState(() => {
    // Anchor to event date if available
    const d = parseAnyDate(production?.eventDate || state.production?.eventDate)
    return d ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const [filter, setFilter] = useState('All')

  // Build events from all live data sources
  const events = useMemo(() => {
    const evts = []

    // 1. Milestones from Timeline
    ;(derived?.milestonesR || state.milestones || []).forEach(m => {
      const d = parseAnyDate(m.date)
      if (!d) return
      evts.push({ id:`m-${m.id}`, iso:toISO(d), title:m.label || m.text,
        type: m.isEvent ? 'Event' : 'Milestone', owner:m.ownerName || '' })
    })

    // 2. ROS phases from project localStorage
    const pid = projectId || production?.id || state.production?.id || 'default'
    try {
      const phases = JSON.parse(localStorage.getItem(`field_ros_${pid}_v1`) || '[]')
      phases.forEach(ph => {
        const d = parseAnyDate(ph.date)
        if (!d) return
        evts.push({ id:`ph-${ph.id}`, iso:toISO(d), title:ph.name,
          type:'ROS Phase', owner:'' })
      })
    } catch {}

    // 3. Approvals with due dates
    ;(derived?.approvalsR || state.approvals || []).forEach(a => {
      const d = parseAnyDate(a.due)
      if (!d) return
      evts.push({ id:`a-${a.id}`, iso:toISO(d), title:a.item,
        type:'Approval', owner:a.approver || '' })
    })

    // 4. Logistics permits
    ;(state.logistics?.permits || []).forEach(p => {
      const d = parseAnyDate(p.due)
      if (!d) return
      evts.push({ id:`p-${p.id}`, iso:toISO(d), title:p.type,
        type:'Logistics', owner:'' })
    })

    return evts
  }, [state, derived, projectId, production])

  // Filtered events
  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter)

  // Events in this month
  const year  = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dayEventsMap = {}
  events.forEach(e => {
    if (!e.iso) return
    const d = new Date(e.iso + 'T12:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!dayEventsMap[day]) dayEventsMap[day] = []
      dayEventsMap[day].push(e)
    }
  })

  const today = new Date()
  const todayISO = toISO(today)

  const eventDate = parseAnyDate(production?.eventDate || state.production?.eventDate)
  const eventISO  = toISO(eventDate)

  // Build grid cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const TYPES = ['All','Milestone','ROS Phase','Approval','Logistics','Event']

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
        <div className="page-header">
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Live dates from Timeline, ROS phases, Approvals, and Logistics</p>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setCursor(d => addMonths(d,-1))}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
                padding:'5px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>‹</button>
            <button onClick={() => setCursor(d => addMonths(d, 1))}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
                padding:'5px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>›</button>
            <p style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', color:'var(--ink-900)' }}>
              {MONTH_NAMES[month]} {year}
            </p>
            <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              style={{ fontSize:11, fontWeight:600, padding:'4px 10px', background:'var(--surface)',
                border:'1px solid var(--border-med)', borderRadius:'var(--r-sm)',
                cursor:'pointer', fontFamily:'var(--font)', color:'var(--ink-600)' }}>Today</button>
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding:'4px 10px', borderRadius:'var(--r-sm)', fontSize:11, fontWeight:700,
                  letterSpacing:'0.05em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.12s',
                  border:`1px solid ${filter===t ? 'var(--ink-900)' : 'var(--border-med)'}`,
                  background: filter===t ? 'var(--ink-900)' : 'transparent',
                  color: filter===t ? 'white' : 'var(--ink-500)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-md)', overflow:'hidden', marginBottom:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
            borderBottom:'1px solid var(--border)' }}>
            {DAY_ABBR.map(d => (
              <div key={d} style={{ padding:'8px 10px', fontSize:11, fontWeight:700,
                letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-400)',
                textAlign:'center', borderRight:'1px solid var(--border)' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
            gridAutoRows:'minmax(88px, auto)' }}>
            {cells.map((day, i) => {
              if (!day) return (
                <div key={`pad-${i}`} style={{ borderRight:'1px solid var(--border)',
                  borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.015)' }}/>
              )
              const cellISO  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isToday  = cellISO === todayISO
              const isEvent  = cellISO === eventISO
              const dayEvts  = (filter==='All' ? dayEventsMap[day] : (dayEventsMap[day]||[]).filter(e=>e.type===filter)) || []

              return (
                <div key={day} style={{
                  padding:'6px 8px', borderRight:'1px solid var(--border)',
                  borderBottom:'1px solid var(--border)',
                  background: isEvent ? 'var(--ink-900)' : isToday ? 'rgba(200,168,64,0.04)' : 'transparent',
                }}>
                  <p style={{ fontSize:12, fontWeight: isToday||isEvent ? 700 : 400, marginBottom:4,
                    color: isEvent ? 'rgba(255,255,255,0.85)' : isToday ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                    display:'inline-block',
                    background: isToday && !isEvent ? 'var(--signal-amber-bg)' : 'none',
                    borderRadius:'var(--r-sm)', padding: isToday&&!isEvent ? '1px 5px' : 0 }}>
                    {day}
                  </p>
                  {isEvent && <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em',
                    textTransform:'uppercase', color:'rgba(255,255,255,0.45)', marginBottom:4 }}>Event day</p>}
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {dayEvts.slice(0, 3).map(e => {
                      const c = EVENT_COLORS[e.type] || EVENT_COLORS['Milestone']
                      return (
                        <div key={e.id} style={{ padding:'2px 5px', borderRadius:2, fontSize:11, fontWeight:500,
                          lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          background: isEvent ? 'rgba(255,255,255,0.12)' : c.bg,
                          color: isEvent ? 'rgba(255,255,255,0.8)' : c.text }}>
                          {e.title}
                        </div>
                      )
                    })}
                    {dayEvts.length > 3 && (
                      <p style={{ fontSize:11, color: isEvent ? 'rgba(255,255,255,0.4)' : 'var(--ink-300)', paddingLeft:2 }}>
                        +{dayEvts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* List view */}
        <p className="section-label">All dates — {filtered.length} {filtered.length === 1 ? 'item' : 'items'}</p>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No dates yet.</p>
            <p className="empty-state__body">Dates from Timeline milestones, ROS phases, and Approvals will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--r-md)', overflow:'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Item</th><th>Type</th><th>Owner</th></tr>
              </thead>
              <tbody>
                {filtered
                  .slice().sort((a,b) => (a.iso||'').localeCompare(b.iso||''))
                  .map(e => {
                    const c = EVENT_COLORS[e.type] || EVENT_COLORS['Milestone']
                    const d = parseAnyDate(e.iso)
                    const label = d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : e.iso
                    return (
                      <tr key={e.id}>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600,
                          color:'var(--ink-900)', whiteSpace:'nowrap' }}>{label}</td>
                        <td style={{ fontWeight:500 }}>{e.title}</td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.05em',
                            textTransform:'uppercase', padding:'2px 7px', borderRadius:3,
                            background:c.bg, color:c.text }}>{e.type}</span>
                        </td>
                        <td style={{ fontSize:12, color:'var(--ink-500)' }}>{e.owner || '—'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
