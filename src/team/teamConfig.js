/**
 * Field — Team Configuration
 *
 * Single source of truth for users, roles, and project access.
 *
 * PROTOTYPE MODE: users are seeded here with email → profile mapping.
 * When a user logs in (Google or simulated), their email is matched
 * against TEAM_MEMBERS to resolve their full profile and role.
 *
 * PRODUCTION MIGRATION PATH:
 *   1. Replace TEAM_MEMBERS with a Supabase `users` table query
 *   2. Replace project access check with a `project_members` join
 *   3. resolveUser() becomes an async DB lookup — same return shape
 *   4. No changes needed to components; they all read from useCurrentUser()
 */

/* ─── Roles ─────────────────────────────────────────────────── */
export const ROLES = {
  ADMIN:       'Admin',
  PRODUCER:    'Producer',
  DESIGN:      'Design',
  HOSPITALITY: 'Hospitality',
  OPERATIONS:  'Operations',
  VIEWER:      'Viewer',
}

/* ─── Role capabilities ─────────────────────────────────────── */
export const ROLE_CAPS = {
  [ROLES.ADMIN]: {
    canSeeAllProjects:  true,   // Project Library: see everything
    canEditAll:         true,   // can edit any project regardless of assignment
    canApproveAll:      true,   // can approve across all projects (leadership)
    navSections:        'all',
    label:              'Admin',
    color:              '#534AB7',
    bg:                 'rgba(124,77,221,0.10)',
  },
  [ROLES.PRODUCER]: {
    canSeeAllProjects:  true,
    canEditAll:         true,
    canApproveAll:      true,
    navSections:        'all',
    label:              'Producer',
    color:              '#1E50A0',
    bg:                 'rgba(30,80,160,0.09)',
  },
  [ROLES.DESIGN]: {
    canSeeAllProjects:  true,   // everyone can browse the library
    canEditAll:         false,  // edit only assigned projects
    canApproveAll:      false,
    navSections:        'all',  // see all nav — DRI highlights guide focus
    label:              'Design',
    color:              '#0F6E56',
    bg:                 'rgba(29,158,117,0.10)',
  },
  [ROLES.HOSPITALITY]: {
    canSeeAllProjects:  true,
    canEditAll:         false,
    canApproveAll:      false,
    navSections:        'all',
    label:              'Hospitality',
    color:              '#8A6010',
    bg:                 'rgba(200,168,64,0.12)',
  },
  [ROLES.OPERATIONS]: {
    canSeeAllProjects:  true,
    canEditAll:         false,
    canApproveAll:      false,
    navSections:        'all',
    label:              'Operations',
    color:              '#5A5650',
    bg:                 'rgba(90,86,80,0.12)',
  },
  [ROLES.VIEWER]: {
    canSeeAllProjects:  true,   // can browse; view-only everywhere
    canEditAll:         false,
    canApproveAll:      false,
    navSections:        'all',
    label:              'Viewer',
    color:              '#A8A49C',
    bg:                 'rgba(168,164,156,0.12)',
  },
}

/* ─── Seeded team members ───────────────────────────────────── */
/* Keyed by lowercase email for fast O(1) lookup at login.       */
/* directoryId links to CAPE_DIRECTORY for profile data.         */
/* projectAccess: 'all' or string[] of project ids               */
export const TEAM_MEMBERS = {
  /* Founders / Admin */
  'brown@capecreative.co':   { id:'tm-brown',   name:'Brown Bartholomew', initials:'BB', role:ROLES.ADMIN,       dept:'Leadership',  directoryId:'cape-brown',     projectAccess:'all' },
  'jessica@capecreative.co': { id:'tm-jessica',  name:'Jessica Resler',   initials:'JR', role:ROLES.ADMIN,       dept:'Leadership',  directoryId:'cape-jessica-r', projectAccess:'all' },

  /* Producers */
  'wes@capecreative.co':     { id:'tm-wes',     name:'Wes Burnley',       initials:'WB', role:ROLES.PRODUCER,    dept:'Operations',  directoryId:'cape-wes',       projectAccess:['p1','p2','p3','p4'] },
  'teekay@capecreative.co':  { id:'tm-teekay',  name:'TeeKay Osawe',      initials:'TO', role:ROLES.PRODUCER,    dept:'Production',  directoryId:'cape-teekay',    projectAccess:['p4','p2'] },
  'billy@capecreative.co':   { id:'tm-billy',   name:'Billy Crank',       initials:'BC', role:ROLES.PRODUCER,    dept:'Production',  directoryId:'cape-billy',     projectAccess:['p4','p1'] },
  'kellie@capecreative.co':  { id:'tm-kellie',  name:'Kellie Becker',     initials:'KB', role:ROLES.PRODUCER,    dept:'Production',  directoryId:'cape-kellie',    projectAccess:['p4','p3'] },

  /* Design */
  'viviana@capecreative.co': { id:'tm-viviana', name:'Viviana Cabrera',   initials:'VC', role:ROLES.DESIGN,      dept:'Creative',    directoryId:'cape-viviana',   projectAccess:['p4','p3'] },

  /* Hospitality */
  'korina@capecreative.co':  { id:'tm-korina',  name:'Korina Ramos',      initials:'KR', role:ROLES.HOSPITALITY, dept:'Hospitality', directoryId:'cape-korina',    projectAccess:['p4','p1'] },

  /* Operations / AV */
  'stefan@capecreative.co':  { id:'tm-stefan',  name:'Stefan Marcus',     initials:'SM', role:ROLES.OPERATIONS,  dept:'AV / Tech',   directoryId:'cape-stefan',    projectAccess:['p4','p2'] },
}

/* ─── Project registry ──────────────────────────────────────── */
export const PROJECTS = {} /* placeholder demo projects removed */

/* ─── DRI area → nav section mapping ───────────────────────── */
export const DRI_TO_NAV_SECTION = {
  'Creative Assets': 'creative',
  'Fulfillment':     'creative',
  'F&B':             'hospitality',
  'Hospitality':     'hospitality',
  'Florals':         'hospitality',
  'Tablescape':      'hospitality',
  'Talent':          'hospitality',
  'Guest List':      'hospitality',
  'Run of Show':     'hospitality',
  'Content Capture': 'hospitality',
  'Fabrication':     'production',
  'AV / Tech':       'production',
  'Venue':           'production',
  'Vendors':         'production',
  'Budget':          'production',
  'Logistics':       'production',
  'Staffing':        'production',
  'Approvals':       'project',
  'Timeline':        'project',
}

/* ─── Resolve a logged-in user against the team config ─────── */
export function resolveUser(authUser) {
  if (!authUser) return null

  const email = (authUser.email || '').toLowerCase().trim()
  const found  = TEAM_MEMBERS[email]

  if (found) {
    // Known user — also check if they've created additional projects
    const createdIds = getCreatedProjectIds(email)
    const existingAccess = found.projectAccess
    let mergedAccess = existingAccess
    if (createdIds.length > 0 && Array.isArray(existingAccess)) {
      mergedAccess = [...new Set([...existingAccess, ...createdIds])]
    } else if (createdIds.length > 0 && existingAccess !== 'all') {
      mergedAccess = createdIds
    }
    return {
      ...found,
      name:         authUser.name    || found.name,
      initials:     authUser.initials || found.initials,
      avatar:       authUser.avatar  || null,
      email,
      projectAccess:mergedAccess,
      caps:         ROLE_CAPS[found.role],
    }
  }

  // Unknown email — check if they've created projects.
  // If so, they get Producer-level access to those projects.
  const createdIds = getCreatedProjectIds(email)
  if (createdIds.length > 0) {
    return {
      id:           `tm-creator-${email.replace(/[^a-z0-9]/g,'')}`,
      name:         authUser.name     || 'Team Member',
      initials:     authUser.initials || '?',
      avatar:       authUser.avatar   || null,
      email,
      role:         ROLES.PRODUCER,   // creators get full edit on their projects
      dept:         null,
      directoryId:  null,
      projectAccess:createdIds,
      caps:         ROLE_CAPS[ROLES.PRODUCER],
    }
  }

  // Truly unknown — Viewer
  return {
    id:           `tm-unknown-${email.replace(/[^a-z0-9]/g,'')}`,
    name:         authUser.name     || 'Team Member',
    initials:     authUser.initials || '?',
    avatar:       authUser.avatar   || null,
    email,
    role:         ROLES.VIEWER,
    dept:         null,
    directoryId:  null,
    projectAccess:[],
    caps:         ROLE_CAPS[ROLES.VIEWER],
  }
}

/**
 * Read field_projects_v1 from localStorage and return IDs of projects
 * created by the given email. Called from resolveUser — safe to call
 * at render time, localStorage is always available in browser.
 */
function getCreatedProjectIds(email) {
  if (!email) return []
  try {
    const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
    return projects
      .filter(p => p.creatorEmail && p.creatorEmail.toLowerCase() === email.toLowerCase())
      .map(p => p.id)
  } catch { return [] }
}

/**
 * Whether a user is assigned to a project (affects edit rights).
 * Separate from canSeeAllProjects — everyone can see, but only
 * assigned users + admins/producers can edit.
 */
export function isAssignedToProject(resolvedUser, projectId) {
  if (!resolvedUser) return false
  if (resolvedUser.caps?.canEditAll) return true   // admin/producer always assigned
  if (resolvedUser.projectAccess === 'all') return true
  if (Array.isArray(resolvedUser.projectAccess)) {
    return resolvedUser.projectAccess.includes(projectId)
  }
  return false
}

/**
 * Whether a user can edit within a given project.
 * Admin/Producer: always. Others: only if assigned.
 */
export function canEditProject(resolvedUser, projectId) {
  if (!resolvedUser) return false
  if (resolvedUser.caps?.canEditAll) return true
  return isAssignedToProject(resolvedUser, projectId)
}

/**
 * Projects the user is assigned to (for the sidebar switcher).
 * Returns all projects for admin/producer.
 */
export function getAssignedProjects(resolvedUser, allProjects) {
  if (!resolvedUser) return []
  // 'all' string means explicitly assigned to every project (Admins only)
  if (resolvedUser.projectAccess === 'all') return allProjects
  // Explicit list — return only those, regardless of role
  if (Array.isArray(resolvedUser.projectAccess)) {
    return allProjects.filter(p => resolvedUser.projectAccess.includes(p.id))
  }
  // Fallback: canEditAll users with no explicit list see all (shouldn't happen)
  if (resolvedUser.caps?.canEditAll) return allProjects
  return []
}
