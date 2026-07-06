import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ALL_PROJECTS, RECENT_ACTIVITY, UPCOMING_DEADLINES,
  PENDING_APPROVALS, BUDGET_ALERTS, getAllProjectsWithUserCreated,
} from './companyData.js'
import { getLiveDeadlines, getLiveApprovals, getLiveActivity, getLiveBudgetAlerts } from './liveDashboardData.js'
import { WIDGET_REGISTRY, WIDGET_CATEGORIES, getWidgetDef } from './dashboardWidgets.js'
import { PROJECT_WIDGET_COMPONENTS, LIBRARY_WIDGET_COMPONENTS } from './ProjectWidgets.jsx'
import { resolveUser, getAssignedProjects, PROJECTS, ROLES } from '../team/teamConfig.js'

/* ─── Grid constants ─────────────────────────────────────── */
const GRID_COLS = 12
const ROW_HEIGHT = 36
const GRID_GAP   = 16

const uid = () => Math.random().toString(36).slice(2, 9)

/* ─── Per-user storage key — each user gets their own layout ── */
function storageKey(email) {
  return `field_dashboard_v5_${(email || 'default').replace(/[^a-z0-9]/gi, '_')}`
}

/* ─── Role-based default layouts ──────────────────────────── */
const LAYOUT_ADMIN = [
  { instanceId:'stat-strip',           widgetId:'stat-strip',           visible:true, projectId:null, x:0, y:0,  w:12, h:4  },
  { instanceId:'my-assigned-projects', widgetId:'my-assigned-projects', visible:true, projectId:null, x:0, y:4,  w:8,  h:9  },
  { instanceId:'needs-attention',      widgetId:'needs-attention',      visible:true, projectId:null, x:8, y:4,  w:4,  h:9  },
  { instanceId:'my-approvals',         widgetId:'my-approvals',         visible:true, projectId:null, x:0, y:13, w:6,  h:9  },
  { instanceId:'my-activity',          widgetId:'my-activity',          visible:true, projectId:null, x:6, y:13, w:6,  h:9  },
  { instanceId:'deadlines',            widgetId:'deadlines',            visible:true, projectId:null, x:0, y:22, w:8,  h:8  },
  { instanceId:'budget-alerts',        widgetId:'budget-alerts',        visible:true, projectId:null, x:8, y:22, w:4,  h:8  },
]
const LAYOUT_PRODUCER = [
  { instanceId:'stat-strip',           widgetId:'stat-strip',           visible:true, projectId:null, x:0, y:0,  w:12, h:4  },
  { instanceId:'my-assigned-projects', widgetId:'my-assigned-projects', visible:true, projectId:null, x:0, y:4,  w:8,  h:9  },
  { instanceId:'needs-attention',      widgetId:'needs-attention',      visible:true, projectId:null, x:8, y:4,  w:4,  h:9  },
  { instanceId:'my-approvals',         widgetId:'my-approvals',         visible:true, projectId:null, x:0, y:13, w:6,  h:9  },
  { instanceId:'deadlines',            widgetId:'deadlines',            visible:true, projectId:null, x:6, y:13, w:6,  h:9  },
  { instanceId:'my-activity',          widgetId:'my-activity',          visible:true, projectId:null, x:0, y:22, w:8,  h:8  },
]
const LAYOUT_DESIGN = [
  { instanceId:'my-assigned-projects', widgetId:'my-assigned-projects', visible:true, projectId:null, x:0, y:0,  w:8,  h:9  },
  { instanceId:'my-dris',             widgetId:'my-dris',              visible:true, projectId:null, x:8, y:0,  w:4,  h:9  },
  { instanceId:'needs-attention',     widgetId:'needs-attention',      visible:true, projectId:null, x:0, y:9,  w:6,  h:8  },
  { instanceId:'deadlines',           widgetId:'deadlines',            visible:true, projectId:null, x:6, y:9,  w:6,  h:8  },
]
const LAYOUT_HOSPITALITY = [
  { instanceId:'my-assigned-projects', widgetId:'my-assigned-projects', visible:true, projectId:null, x:0, y:0,  w:8,  h:9  },
  { instanceId:'my-dris',             widgetId:'my-dris',              visible:true, projectId:null, x:8, y:0,  w:4,  h:9  },
  { instanceId:'needs-attention',     widgetId:'needs-attention',      visible:true, projectId:null, x:0, y:9,  w:6,  h:8  },
  { instanceId:'my-activity',         widgetId:'my-activity',          visible:true, projectId:null, x:6, y:9,  w:6,  h:8  },
]
const LAYOUT_VIEWER = [
  { instanceId:'my-assigned-projects', widgetId:'my-assigned-projects', visible:true, projectId:null, x:0, y:0,  w:12, h:10 },
  { instanceId:'my-dris',             widgetId:'my-dris',              visible:true, projectId:null, x:0, y:10, w:6,  h:8  },
  { instanceId:'my-activity',         widgetId:'my-activity',          visible:true, projectId:null, x:6, y:10, w:6,  h:8  },
]

function defaultLayoutForRole(role) {
  if (role === ROLES.ADMIN)       return LAYOUT_ADMIN
  if (role === ROLES.PRODUCER)    return LAYOUT_PRODUCER
  if (role === ROLES.DESIGN)      return LAYOUT_DESIGN
  if (role === ROLES.HOSPITALITY) return LAYOUT_HOSPITALITY
  if (role === ROLES.OPERATIONS)  return LAYOUT_PRODUCER
  return LAYOUT_VIEWER
}

function loadLayout(email, role) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(email)))
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
  } catch {}
  return defaultLayoutForRole(role)
}
function saveLayout(layout, email) {
  try { localStorage.setItem(storageKey(email), JSON.stringify(layout)) } catch {}
}

/* ─── Shared primitives ──────────────────────────────────── */
function Av({ initials, size = 24 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:'var(--ink-800)',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      fontSize:size < 28 ? 8 : 10, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)',
    }}>{initials || '?'}</div>
  )
}
function SLabel({ children, style = {} }) {
  return <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
    color:'var(--ink-300)', marginBottom:14, ...style }}>{children}</p>
}
function Card({ children, style = {} }) {
  return <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4,
    padding:'18px 20px', position:'relative', ...style }}>{children}</div>
}
function EmptyState({ icon = '—', message, sub }) {
  return (
    <div style={{ padding:'24px 0', textAlign:'center' }}>
      <p style={{ fontSize:22, marginBottom:8, opacity:0.3 }}>{icon}</p>
      <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-300)', marginBottom:4 }}>{message}</p>
      {sub && <p style={{ fontSize:12, color:'var(--ink-200)' }}>{sub}</p>}
    </div>
  )
}
function statusStyle(s) {
  if (s === 'at-risk')   return { color:'var(--signal-red-text)',   bg:'var(--signal-red-bg)'   }
  if (s === 'watch')     return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  if (s === 'active')    return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (s === 'attention') return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  if (s === 'on-track')  return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (s === 'completed') return { color:'var(--ink-400)',           bg:'var(--ground-dim)'      }
  return                          { color:'var(--ink-300)',           bg:'var(--ground-dim)'      }
}
function typeColor(type) {
  if (type === 'Creative') return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  if (type === 'Budget')   return { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' }
  return                            { color:'var(--ink-400)',           bg:'var(--ground-dim)'      }
}
function severityStyle(s) {
  if (s === 'high')   return { dot:'var(--signal-red-dot)'   }
  if (s === 'medium') return { dot:'var(--signal-amber-dot)' }
  return                      { dot:'var(--signal-green-dot)' }
}

/* ─── Read DRI areas from localStorage for a project ────── */
function readProjectDRIs(projectId) {
  try {
    const cape = JSON.parse(localStorage.getItem(`field_local_team_cape_${projectId}_v3`) || '[]')
    const ext  = JSON.parse(localStorage.getItem(`field_local_team_ext_${projectId}_v3`)  || '[]')
    return [...cape, ...ext]
  } catch { return [] }
}

/* ══════════════════════════════════════════════════════════
   NEW PERSONALIZED WIDGETS
   ══════════════════════════════════════════════════════════ */

/* 1. My Assigned Projects ─────────────────────────────── */
function MyAssignedProjectsSection({ resolvedUser, onOpenProject, onNavigate }) {
  const allProjects = getAllProjectsWithUserCreated()
  const assignedIds = useMemo(() => {
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser, allProjects])

  const myProjects = allProjects.filter(p => assignedIds.has(p.id) && p.status !== 'completed')

  if (myProjects.length === 0) return (
    <div>
      <SLabel>My assigned projects</SLabel>
      <EmptyState icon="📋" message="No assigned projects" sub="Projects you're assigned to will appear here."/>
      <button onClick={() => onNavigate('project-library')}
        style={{ marginTop:12, fontSize:12, fontWeight:600, color:'var(--ink-600)', background:'var(--surface)',
          border:'1px solid var(--border-med)', borderRadius:3, padding:'6px 14px',
          cursor:'pointer', fontFamily:'var(--font)' }}>
        Browse Project Library →
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <SLabel style={{ marginBottom:0 }}>My assigned projects</SLabel>
        <button onClick={() => onNavigate('my-projects')}
          style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
            cursor:'pointer', fontFamily:'var(--font)' }}>View all →</button>
      </div>
      {myProjects.map(p => {
        const ss = statusStyle(p.status)
        // Load this user's DRI areas for the project
        const members = readProjectDRIs(p.id)
        const myMember = resolvedUser ? members.find(m =>
          (m._directoryId && m._directoryId === resolvedUser.directoryId) ||
          (m.email && m.email.toLowerCase() === resolvedUser.email)
        ) : null
        const driAreas = myMember?.driAreas || []

        return (
          <div key={p.id} onClick={() => onOpenProject(p)}
            style={{ padding:'12px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div style={{ flex:1, minWidth:0, marginRight:8 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em',
                  marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{p.client} · {p.eventDate}</p>
              </div>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                color:ss.color, background:ss.bg, padding:'3px 8px', borderRadius:2, whiteSpace:'nowrap', flexShrink:0 }}>
                {p.statusLabel || p.status}
              </span>
            </div>
            {driAreas.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                {driAreas.slice(0,4).map(a => (
                  <span key={a} style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:2,
                    background:'var(--signal-amber-bg)', color:'var(--signal-amber-text)' }}>{a}</span>
                ))}
                {driAreas.length > 4 && (
                  <span style={{ fontSize:10, color:'var(--ink-400)' }}>+{driAreas.length - 4}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* 2. My DRIs ─────────────────────────────────────────── */
function MyDRIsSection({ resolvedUser }) {
  const allProjects = getAllProjectsWithUserCreated()
  const assignedIds = useMemo(() => {
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser, allProjects])

  // For each project, find this user's DRI areas
  const myDRIs = allProjects
    .filter(p => assignedIds.has(p.id))
    .map(p => {
      const members = readProjectDRIs(p.id)
      const myMember = resolvedUser ? members.find(m =>
        (m._directoryId && m._directoryId === resolvedUser.directoryId) ||
        (m.email && m.email.toLowerCase() === resolvedUser.email)
      ) : null
      return { project: p, driAreas: myMember?.driAreas || [], driNotes: myMember?.driNotes || '' }
    })
    .filter(d => d.driAreas.length > 0)

  if (myDRIs.length === 0) return (
    <div>
      <SLabel>My DRIs</SLabel>
      <EmptyState icon="🎯" message="No DRIs assigned yet"
        sub="Open a project's Team page to assign your responsibilities."/>
    </div>
  )

  return (
    <div>
      <SLabel>My DRIs</SLabel>
      {myDRIs.map(({ project, driAreas, driNotes }) => (
        <div key={project.id} style={{ marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', marginBottom:8,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {project.name}
          </p>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {driAreas.map(a => (
              <span key={a} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:3,
                background:'var(--signal-amber-bg)', color:'var(--signal-amber-text)' }}>{a}</span>
            ))}
          </div>
          {driNotes && (
            <p style={{ fontSize:11, color:'var(--ink-500)', marginTop:6, lineHeight:1.5,
              fontStyle:'italic' }}>{driNotes}</p>
          )}
        </div>
      ))}
    </div>
  )
}

/* 3. Needs My Attention ──────────────────────────────── */
function NeedsAttentionSection({ resolvedUser }) {
  const isLeader = resolvedUser?.caps?.canEditAll
  const assignedIds = useMemo(() => {
    const allProjects = getAllProjectsWithUserCreated()
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser])

  // Filter approvals to this user's projects (or all for leaders)
  const relevantApprovals = getLiveApprovals().filter(ap =>
    isLeader ? true : assignedIds.has(ap.projectId)
  )

  // Nearest upcoming deadlines relevant to this user (soonest first)
  const overdueDeadlines = getLiveDeadlines()
    .filter(d => (isLeader || assignedIds.has(d.projectId)) && d.days >= 0 && d.days <= 10)
    .slice(0, 3)

  const hasItems = relevantApprovals.length > 0 || overdueDeadlines.length > 0

  if (!hasItems) return (
    <div>
      <SLabel>Needs my attention</SLabel>
      <EmptyState icon="✓" message="You're all caught up" sub="No urgent items right now."/>
    </div>
  )

  return (
    <div>
      <SLabel>Needs my attention</SLabel>

      {overdueDeadlines.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
            color:'var(--signal-red-text)', marginBottom:8 }}>Overdue / urgent</p>
          {overdueDeadlines.map((d, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'8px 10px', background:'var(--signal-red-bg)', borderRadius:3, marginBottom:4,
              border:'1px solid rgba(184,48,48,0.15)' }}>
              <div>
                <p style={{ fontSize:12, fontWeight:500, color:'var(--signal-red-text)', marginBottom:1 }}>{d.label}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{d.project}</p>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--signal-red-text)', fontFamily:'var(--font-mono)' }}>
                {d.days}d
              </span>
            </div>
          ))}
        </div>
      )}

      {relevantApprovals.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
            color:'var(--signal-amber-text)', marginBottom:8 }}>Awaiting approval</p>
          {relevantApprovals.slice(0,4).map(ap => {
            const tc = typeColor(ap.type)
            return (
              <div key={ap.id} style={{ padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
                  <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)', flex:1, marginRight:6, lineHeight:1.3 }}>{ap.label}</p>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                    color:tc.color, background:tc.bg, padding:'2px 6px', borderRadius:2, flexShrink:0 }}>{ap.type}</span>
                </div>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{ap.project} · {ap.days}d ago</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* 4. Recent Activity (role-aware) ───────────────────── */
function MyActivitySection({ resolvedUser }) {
  const isLeader = resolvedUser?.caps?.canEditAll
  const assignedIds = useMemo(() => {
    const allProjects = getAllProjectsWithUserCreated()
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser])

  const activity = RECENT_ACTIVITY.filter(a => {
    if (isLeader) return true
    const project = ALL_PROJECTS.find(p =>
      p.name === a.project || p.name.includes(a.project) || a.project.includes(p.client)
    )
    return project ? assignedIds.has(project.id) : false
  })

  return (
    <div>
      <SLabel>{isLeader ? 'Recent activity — all projects' : 'Recent activity — my projects'}</SLabel>
      {activity.length === 0 ? (
        <EmptyState icon="📡" message="No recent activity" sub="Updates from your projects will appear here."/>
      ) : activity.map(a => (
        <div key={a.id} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
          <Av initials={a.initials} size={24}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-800)', marginBottom:2, lineHeight:1.3 }}>{a.action}</p>
            <p style={{ fontSize:11, color:'var(--ink-400)' }}>{a.project}</p>
          </div>
          <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0, fontFamily:'var(--font-mono)' }}>{a.time}</p>
        </div>
      ))}
    </div>
  )
}

/* 5. Approvals (role-aware) ─────────────────────────── */
function MyApprovalsSection({ resolvedUser, onOpenProject }) {
  const isLeader = resolvedUser?.caps?.canApproveAll ?? resolvedUser?.caps?.canEditAll
  const assignedIds = useMemo(() => {
    const allProjects = getAllProjectsWithUserCreated()
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser])

  const approvals = PENDING_APPROVALS.filter(ap => {
    if (isLeader) return true
    const project = ALL_PROJECTS.find(p => p.name === ap.project || p.id === ap.projectId)
    return project ? assignedIds.has(project.id) : false
  })

  return (
    <div>
      <SLabel>{isLeader ? 'Pending approvals — all projects' : 'Pending approvals — my projects'}</SLabel>
      {approvals.length === 0 ? (
        <EmptyState icon="✓" message="No pending approvals" sub="All caught up."/>
      ) : approvals.map(ap => {
        const tc = typeColor(ap.type)
        const project = ALL_PROJECTS.find(p =>
          p.name === ap.project || p.id === ap.projectId ||
          p.name.includes(ap.project) || ap.project.includes(p.client)
        )
        return (
          <div key={ap.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', lineHeight:1.4, flex:1, marginRight:8 }}>{ap.label}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                color:tc.color, background:tc.bg, padding:'2px 7px', borderRadius:2, flexShrink:0 }}>{ap.type}</span>
            </div>
            <p style={{ fontSize:11, color:'var(--ink-400)', marginBottom:6 }}>{ap.project}</p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:11, color:'var(--ink-300)' }}>{ap.days}d ago</p>
              <button
                disabled={!project}
                onClick={() => project && onOpenProject(project, 'approvals')}
                style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  color: project ? 'var(--ink-700)' : 'var(--ink-300)',
                  background:'var(--surface)', border:'1px solid var(--border-med)',
                  borderRadius:2, padding:'3px 8px', cursor: project ? 'pointer' : 'default',
                  fontFamily:'var(--font)' }}>
                Review
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EXISTING WIDGETS (preserved exactly)
   ══════════════════════════════════════════════════════════ */

function StatStrip({ resolvedUser }) {
  const allProjects = getAllProjectsWithUserCreated()
  const isLeader = resolvedUser?.caps?.canEditAll
  const assignedIds = useMemo(() => {
    if (isLeader) return new Set(allProjects.map(p => p.id))
    const fromConfig = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser, allProjects])

  const myActive = allProjects.filter(p => assignedIds.has(p.id) && p.status !== 'completed').length
  const myApprovals = PENDING_APPROVALS.filter(ap => {
    if (isLeader) return true
    const project = ALL_PROJECTS.find(p => p.name === ap.project)
    return project ? assignedIds.has(project.id) : false
  }).length
  const liveDeadlines = getLiveDeadlines()
  const liveApprovals = getLiveApprovals()
  const liveAlerts    = getLiveBudgetAlerts()
  const upcoming = liveDeadlines.filter(d => d.days >= 0 && d.days <= 7).length

  const stats = isLeader ? [
    { label:'Active projects',   value:String(allProjects.filter(p=>p.status!=='completed').length), sub:'Portfolio-wide',       warn:false },
    { label:'Pending approvals', value:String(liveApprovals.length), sub:'Across all projects',   warn:liveApprovals.length > 0 },
    { label:'Upcoming deadlines',value:String(upcoming),                  sub:'Within 7 days',         warn:upcoming > 0 },
    { label:'Budget alerts',     value:String(liveAlerts.length), sub:'Need attention', warn:liveAlerts.length > 0 },
  ] : [
    { label:'My projects',       value:String(myActive),     sub:'Assigned to you',     warn:false },
    { label:'Pending approvals', value:String(liveApprovals.length),  sub:'On my projects',       warn:liveApprovals.length > 0 },
    { label:'Upcoming deadlines',value:String(upcoming),     sub:'Within 7 days',        warn:upcoming > 0 },
    { label:'DRI areas',         value:'—',                  sub:'Open Team page to see',warn:false },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
      {stats.map((s, i) => (
        <Card key={i}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
            color:s.warn?'var(--signal-amber-text)':'var(--ink-300)', marginBottom:8 }}>{s.label}</p>
          <p style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:800,
            letterSpacing:'-0.04em', color:s.warn?'var(--signal-amber-text)':'var(--ink-900)',
            lineHeight:1, marginBottom:4 }}>{s.value}</p>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{s.sub}</p>
        </Card>
      ))}
    </div>
  )
}

function ActiveProjectsSection({ onOpenProject, onNavigate }) {
  const active = getAllProjectsWithUserCreated().filter(p => p.status !== 'completed')
  return (
    <div style={{ padding:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'0 0 14px', borderBottom:'1px solid var(--border)', marginBottom:0 }}>
        <SLabel style={{ marginBottom:0 }}>All active projects</SLabel>
        <button onClick={() => onNavigate('project-library')}
          style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
            cursor:'pointer', fontFamily:'var(--font)' }}>View all →</button>
      </div>
      {active.map(p => {
        const ss = statusStyle(p.status)
        return (
          <div key={p.id} onClick={() => onOpenProject(p)}
            style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 120px 110px',
              gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)',
              cursor:'pointer', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{p.name}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.client}</p>
            </div>
            <p style={{ fontSize:12, color:'var(--ink-500)' }}>{p.eventDate}</p>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              color:ss.color, background:ss.bg, padding:'3px 9px', borderRadius:2,
              whiteSpace:'nowrap', justifySelf:'end' }}>{p.statusLabel || p.status}</span>
          </div>
        )
      })}
    </div>
  )
}

function DeadlinesSection() {
  const deadlines = getLiveDeadlines().filter(d => d.days >= 0).slice(0, 5)
  return (
    <div>
      <SLabel>Upcoming deadlines</SLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1.5px 1fr', alignItems:'stretch' }}>
        {deadlines.map(dl => (
          <React.Fragment key={dl.id}>
            <div style={{ background: dl.days<=3?'var(--signal-red-dot)':dl.days<=7?'var(--signal-amber-dot)':'var(--border)' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:1 }}>{dl.label}</p>
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{dl.project}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:11, color:'var(--ink-500)', fontFamily:'var(--font-mono)' }}>{dl.date}</p>
                <p style={{ fontSize:11, fontWeight:600, color:dl.days<=3?'var(--signal-red-text)':dl.days<=7?'var(--signal-amber-text)':'var(--ink-300)' }}>{dl.days}d</p>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function ActivitySection() {
  const activity = getLiveActivity()
  if (activity.length === 0) return (
    <div>
      <SLabel>Recent activity</SLabel>
      <EmptyState icon="✦" message="No recent activity" sub="Updates from your projects will appear here."/>
    </div>
  )
  return (
    <div>
      <SLabel>Recent activity</SLabel>
      {activity.map(a => (
        <div key={a.id} style={{ display:'flex', gap:12, padding:'11px 0',
          borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
          <Av initials={a.initials} size={26}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-800)', marginBottom:2 }}>{a.action}</p>
            <p style={{ fontSize:11, color:'var(--ink-400)' }}>{a.project}</p>
          </div>
          <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0, fontFamily:'var(--font-mono)' }}>{a.time}</p>
        </div>
      ))}
    </div>
  )
}

function ApprovalsSection({ onOpenProject }) {
  const approvals = getLiveApprovals()
  const projById = Object.fromEntries(getAllProjectsWithUserCreated().map(p => [p.id, p]))
  if (approvals.length === 0) return (
    <div>
      <SLabel>Pending approvals</SLabel>
      <EmptyState icon="✓" message="No pending approvals" sub="All caught up."/>
    </div>
  )
  return (
    <div>
      <SLabel>Pending approvals</SLabel>
      {approvals.map(ap => {
        const tc = typeColor(ap.type)
        const project = projById[ap.projectId]
        return (
          <div key={ap.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', lineHeight:1.4, flex:1, marginRight:8 }}>{ap.label}</p>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                color:tc.color, background:tc.bg, padding:'2px 7px', borderRadius:2, flexShrink:0 }}>{ap.type}</span>
            </div>
            <p style={{ fontSize:11, color:'var(--ink-400)', marginBottom:6 }}>{ap.project}</p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:11, color:'var(--ink-300)' }}>{ap.days}d ago</p>
              <button
                disabled={!project}
                onClick={() => project && onOpenProject(project, 'approvals')}
                style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  color: project ? 'var(--ink-700)' : 'var(--ink-300)',
                  background:'var(--surface)', border:'1px solid var(--border-med)',
                  borderRadius:2, padding:'3px 8px', cursor: project ? 'pointer' : 'default',
                  fontFamily:'var(--font)' }}>
                Review
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BudgetAlertsSection() {
  const alerts = getLiveBudgetAlerts()
  if (alerts.length === 0) return (
    <div>
      <SLabel>Budget alerts</SLabel>
      <EmptyState icon="✓" message="No budget alerts" sub="All lines within budget."/>
    </div>
  )
  return (
    <div>
      <SLabel>Budget alerts</SLabel>
      {alerts.map(b => {
        const ss = severityStyle(b.severity)
        return (
          <div key={b.id} style={{ display:'flex', gap:10, padding:'10px 0',
            borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:ss.dot, flexShrink:0, marginTop:5 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', marginBottom:2 }}>{b.label}</p>
              <p style={{ fontSize:11, color:'var(--ink-400)', marginBottom:3 }}>{b.project}</p>
              <p style={{ fontSize:12, fontFamily:'var(--font-mono)', color:b.severity==='high'?'var(--signal-red-text)':'var(--ink-500)' }}>{b.amount}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Drag handle ────────────────────────────────────── */
function DragHandle() {
  return (
    <div style={{ cursor:'grab', color:'var(--ink-200)', flexShrink:0, lineHeight:1 }}>
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
        <circle cx="4" cy="3" r="1.3"/><circle cx="4" cy="8" r="1.3"/><circle cx="4" cy="13" r="1.3"/>
        <circle cx="8" cy="3" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="8" cy="13" r="1.3"/>
      </svg>
    </div>
  )
}

/* ─── Add Widget panel ───────────────────────────────── */
function AddWidgetPanel({ onAdd, onClose }) {
  const [category, setCategory] = useState('My Work')
  const [pickingFor, setPickingFor] = useState(null)

  const allCategories = ['My Work', ...WIDGET_CATEGORIES]
  const widgetsInCat = WIDGET_REGISTRY.filter(w => w.category === category)

  const handleAdd = (widget, projectId = null) => {
    onAdd({ instanceId:uid(), widgetId:widget.id, visible:true, projectId })
    setPickingFor(null)
  }

  return (
    <motion.div
      initial={{ x:340, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:340, opacity:0 }}
      transition={{ type:'spring', damping:28, stiffness:300 }}
      style={{ position:'fixed', top:0, right:0, bottom:0, width:340, zIndex:200,
        background:'var(--surface)', borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.08)' }}>

      <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid var(--border)', flexShrink:0,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>Add widget</p>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>Browse everything available</p>
        </div>
        <button onClick={onClose}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:22, lineHeight:1 }}>×</button>
      </div>

      <div style={{ display:'flex', gap:2, padding:'12px 14px 0', flexWrap:'wrap' }}>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); setPickingFor(null) }}
            style={{ padding:'6px 12px', fontSize:12, fontWeight:category===cat?600:400,
              fontFamily:'var(--font)', background:'none', border:'none', cursor:'pointer',
              color:category===cat?'var(--ink-900)':'var(--ink-400)',
              borderBottom:category===cat?'2px solid var(--ink-900)':'2px solid transparent' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
        {widgetsInCat.map(w => (
          <div key={w.id} style={{ padding:'12px 14px', background:'var(--ground-dim)',
            border:'1px solid var(--border)', borderRadius:4, marginBottom:8 }}>
            <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)', marginBottom:3 }}>{w.label}</p>
            <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:10 }}>{w.desc}</p>

            {w.needsProject ? (
              pickingFor === w.id ? (
                <select autoFocus onChange={e => { if (e.target.value) handleAdd(w, e.target.value) }}
                  defaultValue=""
                  style={{ width:'100%', fontSize:13, padding:'6px 8px', border:'1px solid var(--border-med)',
                    borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', cursor:'pointer' }}>
                  <option value="" disabled>Select a project…</option>
                  {getAllProjectsWithUserCreated().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <button onClick={() => setPickingFor(w.id)}
                  style={{ fontSize:12, fontWeight:600, color:'var(--ink-600)', background:'var(--surface)',
                    border:'1px solid var(--border-med)', borderRadius:3, padding:'5px 12px',
                    cursor:'pointer', fontFamily:'var(--font)' }}>
                  + Add for a project
                </button>
              )
            ) : (
              <button onClick={() => handleAdd(w)}
                style={{ fontSize:12, fontWeight:600, color:'var(--ink-600)', background:'var(--surface)',
                  border:'1px solid var(--border-med)', borderRadius:3, padding:'5px 12px',
                  cursor:'pointer', fontFamily:'var(--font)' }}>
                + Add to Dashboard
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Layout / Customize panel ───────────────────────── */
function LayoutPanel({ layout, onToggle, onClose, onOpenAdd }) {
  return (
    <motion.div
      initial={{ x:320, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:320, opacity:0 }}
      transition={{ type:'spring', damping:28, stiffness:300 }}
      style={{ position:'fixed', top:0, right:0, bottom:0, width:300, zIndex:200,
        background:'var(--surface)', borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.08)' }}>
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)', flexShrink:0,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:2 }}>Customize Dashboard</p>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>Drag to move · drag corner to resize</p>
        </div>
        <button onClick={onClose}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:22, lineHeight:1 }}>×</button>
      </div>

      <div style={{ padding:'16px 20px' }}>
        <button onClick={onOpenAdd}
          style={{ width:'100%', padding:'11px', fontSize:13, fontWeight:700, letterSpacing:'0.04em',
            background:'var(--ink-900)', color:'white', border:'none', borderRadius:4,
            cursor:'pointer', fontFamily:'var(--font)', marginBottom:16 }}>
          + Add widget
        </button>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase',
          color:'var(--ink-300)', marginBottom:10 }}>Current widgets</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
        {layout.map(s => {
          const def = getWidgetDef(s.widgetId)
          return (
            <div key={s.instanceId} style={{ display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', background:s.visible?'var(--ground-dim)':'transparent',
              border:'1px solid var(--border)', borderRadius:4, marginBottom:6,
              opacity:s.visible?1:0.5 }}>
              <p style={{ flex:1, fontSize:13, color:'var(--ink-800)', fontWeight:500 }}>{def?.label}</p>
              <button onClick={() => onToggle(s.instanceId)}
                style={{ fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase',
                  color:s.visible?'var(--signal-red-text)':'var(--signal-green-text)',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                {s.visible ? 'Hide' : 'Show'}
              </button>
            </div>
          )
        })}
      </div>
      <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <button onClick={onClose}
          style={{ width:'100%', padding:'10px', fontSize:13, fontWeight:600,
            background:'var(--ink-900)', color:'white', border:'none', borderRadius:4,
            cursor:'pointer', fontFamily:'var(--font)' }}>Done</button>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
export default function Dashboard({ onOpenProject, onNavigate, user }) {
  const resolvedUser = useMemo(() => resolveUser(user), [user])
  const userEmail = resolvedUser?.email || ''
  const userRole  = resolvedUser?.role  || ROLES.VIEWER

  const [layout, setLayout] = useState(() => loadLayout(userEmail, userRole))
  const [editing, setEditing] = useState(false)
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [gridWidth, setGridWidth] = useState(1200)
  const gridRef  = useRef(null)
  const dragState = useRef(null)

  // Reload layout when user changes (different user, different layout)
  useEffect(() => {
    setLayout(loadLayout(userEmail, userRole))
  }, [userEmail, userRole])

  useEffect(() => {
    if (!gridRef.current) return
    const el = gridRef.current
    const measure = () => setGridWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const commit = next => { setLayout(next); saveLayout(next, userEmail) }

  const toggleVisible = instanceId => commit(layout.map(s => s.instanceId===instanceId ? {...s, visible:!s.visible} : s))
  const removeWidget  = instanceId => commit(layout.filter(s => s.instanceId !== instanceId))
  const addWidget = newWidget => {
    const maxY = layout.reduce((m, s) => Math.max(m, s.y + s.h), 0)
    commit([...layout, { ...newWidget, x:0, y:maxY, w:6, h:9 }])
    setAddPanelOpen(false)
  }

  /* ── Grid math (unchanged) ─── */
  const colWidth  = (gridWidth - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS
  const cellToPxX = col => col * (colWidth + GRID_GAP)
  const cellToPxY = row => row * (ROW_HEIGHT + GRID_GAP)
  const pxToCellX = px  => Math.round(px / (colWidth + GRID_GAP))
  const pxToCellY = px  => Math.round(px / (ROW_HEIGHT + GRID_GAP))

  const collides = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

  const nudgeReflow = (items, movedId) => {
    const next = items.map(it => ({ ...it }))
    const moved = next.find(it => it.instanceId === movedId)
    if (!moved) return next
    let safety = 0, changed = true
    while (changed && safety < 40) {
      changed = false; safety++
      for (const other of next) {
        if (other.instanceId === movedId) continue
        if (collides(moved, other)) {
          const overlapBottom = (moved.y + moved.h) - other.y
          const overlapTop    = (other.y + other.h) - moved.y
          if (overlapTop <= overlapBottom && other.y - overlapTop >= 0) {
            other.y = Math.max(0, other.y - overlapTop)
          } else {
            other.y = moved.y + moved.h
          }
          changed = true
        }
      }
    }
    return next
  }

  const reflow = (items, movedId, vacatedSlot) => {
    const next = items.map(it => ({ ...it }))
    const moved = next.find(it => it.instanceId === movedId)
    if (!moved) return { layout: next, newVacatedSlot: vacatedSlot }
    let bestMatch = null, bestOverlapArea = 0
    for (const other of next) {
      if (other.instanceId === movedId || !collides(moved, other)) continue
      const overlapW = Math.min(moved.x + moved.w, other.x + other.w) - Math.max(moved.x, other.x)
      const overlapH = Math.min(moved.y + moved.h, other.y + other.h) - Math.max(moved.y, other.y)
      const area = Math.max(0, overlapW) * Math.max(0, overlapH)
      if (area > bestOverlapArea) { bestOverlapArea = area; bestMatch = other }
    }
    let newVacatedSlot = vacatedSlot
    if (bestMatch && vacatedSlot) {
      newVacatedSlot = { x:bestMatch.x, y:bestMatch.y }
      bestMatch.x = vacatedSlot.x; bestMatch.y = vacatedSlot.y
    }
    return { layout:next, newVacatedSlot }
  }

  const onWindowMouseMove = useCallback(e => {
    const ds = dragState.current
    if (!ds) return
    const dx = e.clientX - ds.startX, dy = e.clientY - ds.startY
    setLayout(prev => {
      const next = prev.map(it => ({ ...it }))
      const item = next.find(it => it.instanceId === ds.instanceId)
      if (!item) return prev
      if (ds.mode === 'move') {
        const newX = pxToCellX(cellToPxX(ds.startItem.x) + dx)
        const newY = pxToCellY(cellToPxY(ds.startItem.y) + dy)
        item.x = Math.max(0, Math.min(GRID_COLS - item.w, newX))
        item.y = Math.max(0, newY)
      } else {
        const newW = pxToCellX(cellToPxX(ds.startItem.w) + dx) || 1
        const newH = pxToCellY(cellToPxY(ds.startItem.h) + dy) || 1
        item.w = Math.max(2, Math.min(GRID_COLS - item.x, newW))
        item.h = Math.max(3, newH)
      }
      if (ds.mode === 'move') {
        const { layout:result, newVacatedSlot } = reflow(next, ds.instanceId, ds.vacatedSlot)
        ds.vacatedSlot = newVacatedSlot
        return result
      }
      return nudgeReflow(next, ds.instanceId)
    })
  }, [colWidth])

  const onWindowMouseUp = useCallback(() => {
    dragState.current = null
    document.removeEventListener('mousemove', onWindowMouseMove)
    document.removeEventListener('mouseup', onWindowMouseUp)
    setLayout(current => { saveLayout(current, userEmail); return current })
  }, [onWindowMouseMove, userEmail])

  const onWidgetMouseDown = (e, instanceId, mode) => {
    if (!editing) return
    e.preventDefault(); e.stopPropagation()
    const item = layout.find(s => s.instanceId === instanceId)
    if (!item) return
    dragState.current = { instanceId, mode, startX:e.clientX, startY:e.clientY,
      startItem:{ ...item }, vacatedSlot:{ x:item.x, y:item.y } }
    document.addEventListener('mousemove', onWindowMouseMove)
    document.addEventListener('mouseup', onWindowMouseUp)
  }

  const visible    = layout.filter(s => s.visible)
  const gridHeight = visible.reduce((m, s) => Math.max(m, cellToPxY(s.y + s.h)), 0)

  /* ── Widget renderer ─────────────────────────── */
  const renderWidget = (instance) => {
    const { widgetId, projectId } = instance
    const props = { resolvedUser, onOpenProject, onNavigate }

    if (widgetId === 'stat-strip')           return <StatStrip resolvedUser={resolvedUser}/>
    if (widgetId === 'my-assigned-projects') return <MyAssignedProjectsSection {...props}/>
    if (widgetId === 'my-dris')             return <MyDRIsSection resolvedUser={resolvedUser}/>
    if (widgetId === 'needs-attention')     return <NeedsAttentionSection resolvedUser={resolvedUser}/>
    if (widgetId === 'my-activity')         return <MyActivitySection resolvedUser={resolvedUser}/>
    if (widgetId === 'my-approvals')        return <MyApprovalsSection resolvedUser={resolvedUser} onOpenProject={onOpenProject}/>
    if (widgetId === 'active-projects')     return <ActiveProjectsSection onOpenProject={onOpenProject} onNavigate={onNavigate}/>
    if (widgetId === 'deadlines')           return <DeadlinesSection/>
    if (widgetId === 'activity')            return <ActivitySection/>
    if (widgetId === 'approvals')           return <ApprovalsSection onOpenProject={onOpenProject}/>
    if (widgetId === 'budget-alerts')       return <BudgetAlertsSection/>

    if (PROJECT_WIDGET_COMPONENTS[widgetId]) {
      const C = PROJECT_WIDGET_COMPONENTS[widgetId]
      return <C projectId={projectId}/>
    }
    if (LIBRARY_WIDGET_COMPONENTS[widgetId]) {
      const C = LIBRARY_WIDGET_COMPONENTS[widgetId]
      return <C/>
    }
    return <p style={{ fontSize:12, color:'var(--ink-300)', padding:16 }}>Unknown widget.</p>
  }

  /* ── Greeting ────────────────────────────────── */
  const firstName = resolvedUser?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })

  return (
    <div style={{ width:'100%', padding:'36px 72px 80px' }}>
      <AnimatePresence>
        {layoutPanelOpen && !addPanelOpen && (
          <LayoutPanel layout={layout} onToggle={toggleVisible}
            onClose={() => setLayoutPanelOpen(false)}
            onOpenAdd={() => setAddPanelOpen(true)}/>
        )}
        {addPanelOpen && (
          <AddWidgetPanel onAdd={addWidget} onClose={() => setAddPanelOpen(false)}/>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:8 }}>Field · Dashboard</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
            letterSpacing:'-0.04em', color:'var(--ink-900)', marginBottom:4 }}>
            {greeting}, {firstName}.
          </h1>
          <p style={{ fontSize:15, color:'var(--ink-400)' }}>{dateStr}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setEditing(e => !e)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
              fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
              background:editing?'var(--ink-900)':'var(--surface)',
              color:editing?'white':'var(--ink-600)',
              border:'1px solid var(--border-med)', borderRadius:4,
              cursor:'pointer', fontFamily:'var(--font)' }}>
            {editing ? 'Done arranging' : 'Rearrange'}
          </button>
          <button onClick={() => setLayoutPanelOpen(p => !p)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
              fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
              background:'var(--surface)', color:'var(--ink-600)',
              border:'1px solid var(--border-med)', borderRadius:4,
              cursor:'pointer', fontFamily:'var(--font)' }}>
            Customize
          </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={gridRef}
        className={editing ? 'rgl-editing' : ''}
        style={{ position:'relative', height:gridHeight || 1, minHeight:visible.length ? undefined : 0 }}>
        {visible.map(w => {
          const left   = cellToPxX(w.x)
          const top    = cellToPxY(w.y)
          const width  = w.w * colWidth + (w.w - 1) * GRID_GAP
          const height = w.h * ROW_HEIGHT + (w.h - 1) * GRID_GAP
          const isDragging = dragState.current?.instanceId === w.instanceId
          return (
            <div key={w.instanceId} style={{
              position:'absolute', left, top, width, height,
              transition:isDragging?'none':'left 0.18s ease, top 0.18s ease, width 0.18s ease, height 0.18s ease',
              zIndex:isDragging?50:1,
              boxShadow:isDragging?'0 8px 24px rgba(0,0,0,0.16)':'none',
            }}>
              <Card style={{ padding:0, overflow:'hidden', height:'100%', display:'flex', flexDirection:'column' }}>
                {editing && (
                  <div onMouseDown={e => onWidgetMouseDown(e, w.instanceId, 'move')}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                      background:'rgba(26,25,22,0.035)', borderBottom:'1px solid var(--border)',
                      cursor:'grab', flexShrink:0, userSelect:'none' }}>
                    <DragHandle/>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-600)', flex:1 }}>
                      {getWidgetDef(w.widgetId)?.label}
                      {w.projectId ? ` · ${getAllProjectsWithUserCreated().find(p=>p.id===w.projectId)?.name?.split(' — ')[0] || ''}` : ''}
                    </p>
                    <button onClick={() => removeWidget(w.instanceId)} title="Remove widget"
                      onMouseDown={e => e.stopPropagation()}
                      style={{ fontSize:10, padding:'3px 8px', borderRadius:2, fontFamily:'var(--font)',
                        cursor:'pointer', background:'var(--surface)', color:'var(--signal-red-text)',
                        border:'1px solid var(--border)', flexShrink:0 }}>✕</button>
                  </div>
                )}
                <div style={{ padding:'18px 20px', flex:1, overflowY:'auto', minHeight:0 }}>
                  {renderWidget(w)}
                </div>
                {editing && (
                  <div onMouseDown={e => onWidgetMouseDown(e, w.instanceId, 'resize')}
                    style={{ position:'absolute', bottom:2, right:2, width:18, height:18,
                      cursor:'nwse-resize', zIndex:5 }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ position:'absolute', right:0, bottom:0 }}>
                      <path d="M14 4L4 14M14 9L9 14M14 14H14" stroke="var(--border-med)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {visible.length === 0 && (
        <div style={{ padding:'60px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:18, fontStyle:'italic',
            color:'var(--ink-200)', marginBottom:12 }}>Your Dashboard is empty.</p>
          <button onClick={() => setAddPanelOpen(true)}
            style={{ fontSize:13, fontWeight:600, color:'var(--ink-600)', background:'var(--surface)',
              border:'1px solid var(--border-med)', borderRadius:4, padding:'8px 18px',
              cursor:'pointer', fontFamily:'var(--font)' }}>+ Add widget</button>
        </div>
      )}
    </div>
  )
}
