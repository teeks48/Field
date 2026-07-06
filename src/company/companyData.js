/* Company-level seed data — placeholder only, no backend yet */

export const REGIONS    = ['All','North America','Latin America','Europe','Asia']

// Grouped categories for the Project Library filter sidebar.
// Flat CATEGORIES list kept for anything still using the old dropdown.
export const CATEGORY_GROUPS = [
  { group:'Activations', items:['Brand Activation','Pop-Up','Product Launch','Mobile Tour','Road Show','Conference','Fan Activation'] },
  { group:'Production',  items:['Experiential','Executive Dinner','Retail Takeover','Corporate Event'] },
  { group:'Digital',     items:['Content Creation','Social Campaign'] },
  { group:'Other',       items:['Other'] },
]
export const CATEGORIES = ['All', ...CATEGORY_GROUPS.flatMap(g => g.items)]

export const ALL_PROJECTS = [] /* placeholder demo data removed — real projects live in field_projects_v1 */

export const MY_PROJECTS = ALL_PROJECTS.filter(p => p.mine)

export const RECENT_ACTIVITY = [] /* placeholder demo data removed — real projects live in field_projects_v1 */

export const UPCOMING_DEADLINES = [] /* placeholder demo data removed — real projects live in field_projects_v1 */

export const PENDING_APPROVALS = [] /* placeholder demo data removed — real projects live in field_projects_v1 */

export const BUDGET_ALERTS = [] /* placeholder demo data removed — real projects live in field_projects_v1 */


/**
 * Load user-created projects from localStorage and merge with static list.
 * Returns combined list with user projects first, then static seeded projects.
 */
export function loadUserProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
    return saved
  } catch { return [] }
}

/**
 * Full project list: static seeded + any user-created projects from localStorage.
 * Call this at render time (not module load) so localStorage is available.
 */
export function getAllProjectsWithUserCreated() {
  const userProjects = loadUserProjects()
  const userIds = new Set(userProjects.map(p => p.id))
  // Merge: user projects + static (excluding any overridden by user version)
  return [...userProjects, ...ALL_PROJECTS.filter(p => !userIds.has(p.id))]
}
