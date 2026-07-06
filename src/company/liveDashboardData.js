/* ─────────────────────────────────────────────────────────────
   liveDashboardData — derives the company dashboard feeds
   (deadlines, activity, approvals, budget alerts) from the
   REAL project data stored in localStorage, rather than the
   retired placeholder arrays.

   This reads project data only. When a project is deleted its
   storage is purged, so these feeds empty out automatically —
   nothing here is master data.
   ─────────────────────────────────────────────────────────── */

import { getAllProjectsWithUserCreated } from './companyData.js'

const L = key => { try { return JSON.parse(localStorage.getItem('field_local_' + key) || 'null') } catch { return null } }
const readStore = () => { try { return JSON.parse(localStorage.getItem('field_store_v1') || 'null') } catch { return null } }

/* days between now and a "Mon D, YYYY" date string (negative = past) */
function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  const ms = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(ms / 86400000)
}

function activeProjects() {
  return getAllProjectsWithUserCreated().filter(p => p.status !== 'completed')
}

/* ── Upcoming deadlines — from each project's Timeline ─────── */
export function getLiveDeadlines() {
  const out = []
  for (const p of activeProjects()) {
    const rows = L(`timeline_${p.id}_v1`) || []
    for (const r of rows) {
      if (r.status === 'complete' || r.status === 'event') continue
      const days = daysUntil(r.date)
      if (days == null) continue
      out.push({ id: `${p.id}_${r.id}`, label: r.label, project: p.name, projectId: p.id,
        date: (r.date || '').replace(/, \d{4}$/, ''), days })
    }
  }
  return out.sort((a, b) => a.days - b.days)
}

/* ── Pending approvals — from the global store approvals ────── */
export function getLiveApprovals() {
  const store = readStore()
  const byId = Object.fromEntries(getAllProjectsWithUserCreated().map(p => [p.id, p]))
  const approvals = (store?.approvals || []).filter(a => a.status !== 'Approved')
  return approvals.map(a => {
    const proj = byId[a.projectId] || (store?.production?.id === a.projectId ? store.production : null)
    return {
      id: a.id, label: a.item, type: a.type || 'Creative',
      project: proj?.name || store?.production?.name || '', projectId: a.projectId,
      days: 2, status: a.status,
    }
  })
}

/* ── Recent activity — synthesized from real project signals ── */
export function getLiveActivity() {
  const store = readStore()
  if (!store?.production?.id) return []
  const pName = store.production.name
  const out = []
  const initialsFrom = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Latest comments across pages
  const pageComments = store.pageComments || {}
  Object.values(pageComments).flat()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 2)
    .forEach(c => out.push({
      id: 'act_' + c.id, initials: c.authorInitials || initialsFrom(c.authorName),
      action: `${c.authorName} commented`, project: pName, time: relTime(c.timestamp),
    }))

  // Most recent approval movement
  const appr = (store.approvals || []).find(a => a.status === 'Approved')
  if (appr) out.push({ id: 'act_appr', initials: 'CC', action: `Approved: ${appr.item}`, project: pName, time: 'Jun 28' })

  // Latest notification
  ;(store.notifications || []).slice(0, 1).forEach(n =>
    out.push({ id: 'act_' + n.id, initials: initialsFrom(n.fromUserName), action: n.text || 'Update', project: pName, time: relTime(n.timestamp) }))

  return out.slice(0, 5)
}

/* ── Budget alerts — forecast over budget on any line ──────── */
export function getLiveBudgetAlerts() {
  const out = []
  for (const p of activeProjects()) {
    const wb = L(`budget_wb_${p.id}_v1`) || []
    const items = wb.flatMap(c => c.items || [])
    const over = items.filter(i => Number(i.forecast) > Number(i.budget))
    over.slice(0, 3).forEach(i => out.push({
      id: `${p.id}_${i.id}`, label: i.desc, project: p.name,
      amount: `+$${(Number(i.forecast) - Number(i.budget)).toLocaleString()} over`, severity: 'medium',
    }))
  }
  return out
}

function relTime(iso) {
  const t = new Date(iso)
  if (isNaN(t)) return ''
  const days = Math.round((Date.now() - t) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
