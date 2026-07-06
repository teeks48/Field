/**
 * useCurrentUser — resolves the logged-in auth user to a full team profile.
 *
 * Usage:
 *   const { currentUser, isAdmin, canEdit, canEditProject } = useCurrentUser(user, projectId)
 *
 * `user` is the raw auth object from App state (name, email, initials, avatar).
 * Returns a resolved profile with role, caps, dept, projectAccess, and DRI areas.
 *
 * DRI areas are loaded from localStorage (same keys as Team DRI page) so this
 * hook can surface "your responsibilities" anywhere in the platform without
 * duplicating data.
 */

import { useMemo } from 'react'
import { resolveUser, ROLES, isAssignedToProject, canEditProject as canEditProjectFn } from './teamConfig.js'

const PREFIX = 'field_local_'

function readLocalState(key) {
  try {
    const v = localStorage.getItem(PREFIX + key)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

export function useCurrentUser(authUser, projectId) {
  const resolved = useMemo(() => resolveUser(authUser), [authUser])

  // Load this user's DRI assignments for the current project from localStorage
  const driAreas = useMemo(() => {
    if (!resolved || !projectId) return []
    const cape = readLocalState(`team_cape_${projectId}_v3`) || []
    const ext  = readLocalState(`team_ext_${projectId}_v3`)  || []
    const all  = [...cape, ...ext]
    const me = all.find(m =>
      (resolved.directoryId && m._directoryId === resolved.directoryId) ||
      (m.email && m.email.toLowerCase() === resolved.email) ||
      (m.name  && m.name.toLowerCase()  === resolved.name.toLowerCase())
    )
    return me?.driAreas || []
  }, [resolved, projectId])

  const driNotes = useMemo(() => {
    if (!resolved || !projectId) return ''
    const cape = readLocalState(`team_cape_${projectId}_v3`) || []
    const ext  = readLocalState(`team_ext_${projectId}_v3`)  || []
    const all  = [...cape, ...ext]
    const me = all.find(m =>
      (resolved.directoryId && m._directoryId === resolved.directoryId) ||
      (m.email && m.email.toLowerCase() === resolved.email)
    )
    return me?.driNotes || ''
  }, [resolved, projectId])

  // This user's role WITHIN the current project (title + department as set on
  // the project's Team page). Falls back to the global role/dept when there is
  // no project context or the user isn't on the project team.
  const projectMember = useMemo(() => {
    if (!resolved || !projectId) return null
    const cape = readLocalState(`team_cape_${projectId}_v3`) || []
    const ext  = readLocalState(`team_ext_${projectId}_v3`)  || []
    const all  = [...cape, ...ext]
    return all.find(m =>
      (resolved.directoryId && m._directoryId === resolved.directoryId) ||
      (m.email && m.email.toLowerCase() === resolved.email) ||
      (m.name  && resolved.name && m.name.toLowerCase() === resolved.name.toLowerCase())
    ) || null
  }, [resolved, projectId])

  // Department can be stored as an array (per-project) or a string (global)
  const memberDept = Array.isArray(projectMember?.dept)
    ? projectMember.dept.filter(Boolean).join(' · ')
    : (projectMember?.dept || '')
  const projectTitle = projectMember?.title || projectMember?.projectRole || ''
  const projectDept  = memberDept

  if (!resolved) return {
    currentUser:       null,
    isAdmin:           false,
    isProducer:        false,
    canEdit:           false,
    isAssigned:        false,
    canEditThisProject:false,
    canApprove:        false,
    driAreas:          [],
    driNotes:          '',
    isViewOnly:        true,
  }

  const role     = resolved.role
  const isAdmin  = role === ROLES.ADMIN
  const isProd   = role === ROLES.PRODUCER || isAdmin
  const assigned = projectId ? isAssignedToProject(resolved, projectId) : false
  const canEdit  = projectId ? canEditProjectFn(resolved, projectId)     : (resolved.caps?.canEditAll ?? false)

  return {
    currentUser:        { ...resolved, driAreas, driNotes, projectTitle, projectDept },
    isAdmin,
    isProducer:         isProd,
    isDesign:           role === ROLES.DESIGN,
    isHospitality:      role === ROLES.HOSPITALITY,
    isOperations:       role === ROLES.OPERATIONS,
    isViewer:           role === ROLES.VIEWER,
    isAssigned:         assigned,
    canEdit,
    canEditThisProject: canEdit,
    canApprove:         resolved.caps?.canApproveAll ?? isProd,
    isViewOnly:         !canEdit,
    driAreas,
    driNotes,
  }
}

export default useCurrentUser
