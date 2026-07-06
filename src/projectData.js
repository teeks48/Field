/* ─────────────────────────────────────────────────────────
   projectData — canonical per-project data readers.

   Single access point for cross-page reads of project data,
   so pages stop hand-rolling localStorage keys (Data Flow
   Audit, recommendation #11). Writers remain the owning
   pages; these are read-only helpers.

   Sources (all per-project):
     Team    → team_cape_${pid}_v3 + team_ext_${pid}_v3   (Team page)
     Venue   → logistics_venue_${pid}_v1                  (Venue page)
     Budget  → budget_wb_${pid}_v1 + budget_expenses_…    (Budget page)
     ROS     → field_ros_${pid}_v1                        (Run of Show)
     Menu    → hosp_food_${pid}_v1 + hosp_drink_${pid}_v1 (Hospitality)
   ─────────────────────────────────────────────────────── */

const readLS = key => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
const local = key => readLS('field_local_' + key)

/* Display name — same convention as the Team page:
   externals have `name`; CAPE members have firstName/lastName. */
export const nameOf = m =>
  (m && (m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim())) || ''

/* Project team roster — internal (CAPE) + external/freelancers. */
export function readProjectTeam(projectId) {
  const pid  = projectId || 'default'
  const cape = local(`team_cape_${pid}_v3`) || []
  const ext  = local(`team_ext_${pid}_v3`)  || []
  return [...cape, ...ext].filter(m => nameOf(m))
}

/* The venue selected on the Venue page — canonical project venue. */
export function readProjectVenue(projectId) {
  const v = local(`logistics_venue_${projectId || 'default'}_v1`)
  return v && String(v.name || '').trim() ? v : null
}

/* Canonical budget — derived from the Budget page's Working Budget
   and Expenses data. */
export function readProjectBudget(projectId) {
  const pid   = projectId || 'default'
  const num   = v => Number(v) || 0
  const cats  = local(`budget_wb_${pid}_v1`) || []
  const items = cats.flatMap(c => c.items || [])
  const total    = items.reduce((s, i) => s + num(i.budget),   0)
  const forecast = items.reduce((s, i) => s + num(i.forecast), 0)
  const expenses = local(`budget_expenses_${pid}_v1`) || []
  const spent    = expenses.reduce((s, r) => s + num(r.amount), 0)
  const categories = cats.map(c => ({
    name:     c.name || '',
    budget:   (c.items || []).reduce((s, i) => s + num(i.budget),   0),
    forecast: (c.items || []).reduce((s, i) => s + num(i.forecast), 0),
  })).filter(c => c.name)
  return { total, forecast, spent, categories, hasData: items.length > 0 }
}

/* Run of Show phases (note: ROS persists without the field_local_ prefix). */
export function readProjectRos(projectId) {
  const phases = readLS(`field_ros_${projectId || 'default'}_v1`)
  return Array.isArray(phases) ? phases : []
}

/* Hospitality menu (food + drink) as entered on the Hospitality page. */
export function readHospitalityMenu(projectId) {
  const pid   = projectId || 'default'
  const food  = local(`hosp_food_${pid}_v1`)
  const drink = local(`hosp_drink_${pid}_v1`)
  return {
    food:  Array.isArray(food)  ? food  : null,
    drink: Array.isArray(drink) ? drink : null,
  }
}

export const fmtUSD = n => (n || n === 0) && n !== '' ? '$' + Math.round(Number(n) || 0).toLocaleString() : '—'
