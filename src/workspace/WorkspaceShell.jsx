import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar.jsx'
import { useStore, A } from '../store.jsx'
import UserBadge from '../components/UserBadge.jsx'
import { SearchTrigger } from '../components/CommandPalette.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import CollabRail from '../components/CollabRail.jsx'
import DataManager from '../components/DataManager.jsx'
import { ProjectSettingsModal, ConfirmModal } from './ProjectModals.jsx'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'
import ExportModal from './ExportModal.jsx'
import { readProjectVenue } from '../projectData.js'
import { useCurrentUser } from '../team/useCurrentUser.js'

import Overview          from './pages/Overview.jsx'
import Creative          from './pages/Creative.jsx'
import Budget            from './pages/Budget.jsx'
import Team           from './pages/Team.jsx'
import Shortlist       from './pages/Shortlist.jsx'
import Timeline          from './pages/Timeline.jsx'
import Approvals         from './pages/Approvals.jsx'
import Vendors           from './pages/Vendors.jsx'
import Logistics         from './pages/Logistics.jsx'
import Fabrication       from './pages/Fabrication.jsx'
import Hospitality       from './pages/Hospitality.jsx'
import AVTech            from './pages/AVTech.jsx'
import ContentCapture    from './pages/ContentCapture.jsx'
import RunOfShow         from './pages/RunOfShow.jsx'
import Shopping          from './pages/Shopping.jsx'
import Florals           from './pages/Florals.jsx'
import Tablescape        from './pages/Tablescape.jsx'
import Talent            from './pages/Talent.jsx'
import GuestList         from './pages/GuestList.jsx'
import Debrief           from './pages/Debrief.jsx'
import Libraries         from './pages/Libraries.jsx'
import Assets            from './pages/Assets.jsx'
import Calendar          from './pages/Calendar.jsx'
import VendorLibrary     from '../company/VendorLibrary.jsx'
import VenueLibrary      from '../company/VenueLibrary.jsx'
import InventoryLibrary  from '../company/InventoryLibrary.jsx'
import TeamDirectory     from '../company/TeamLibrary.jsx'
import Files             from './pages/Files.jsx'
import Emails            from './pages/Emails.jsx'

const PAGE_MAP = {
  'overview':           Overview,
  'creative':           Creative,
  'budget':             Budget,
  'timeline':           Timeline,
  'team':               Team,
  'approvals':          Approvals,
  'shortlist':          Shortlist,
  'vendors':            Vendors,
  'logistics':          Logistics,
  'hospitality':        Hospitality,
  'fabrication':        Fabrication,
  'av-tech':            AVTech,
  'talent':             Talent,
  'guest-list':         GuestList,
  'content':            ContentCapture,
  'shopping':           Shopping,
  'florals':            Florals,
  'tablescape':         Tablescape,
  'run-of-show':        RunOfShow,
  'debrief':            Debrief,
  'libraries':          Libraries,
  'assets':             Assets,
  'calendar':           Calendar,
  'vendor-library':     VendorLibrary,
  'venue-library':      VenueLibrary,
  'inventory-library':  InventoryLibrary,
  'team-directory':     TeamDirectory,
  'files':              Files,
  'emails':             Emails,
}

const PAGE_LABELS = {
  'overview':           'Project overview',
  'creative':           'Deliverables',
  'assets':             'Fulfillment',
  'budget':             'Budget',
  'timeline':           'Timeline',
  'team':               'Team',
  'approvals':          'Approvals',
  'shortlist':          'Shortlist',
  'vendors':            'Vendors',
  'logistics':          'Venue',
  'hospitality':        'Hospitality',
  'fabrication':        'Fabrication',
  'av-tech':            'AV / Technology',
  'talent':             'Talent',
  'guest-list':         'Guest List',
  'content':            'Content',
  'shopping':           'Shopping',
  'florals':            'Florals',
  'tablescape':         'Tablescape',
  'run-of-show':        'Run of Show',
  'debrief':            'Debrief',
  'files':              'Files',
  'emails':             'Emails',
  'vendor-library':     'Vendors',
  'venue-library':      'Venues',
  'inventory-library':  'Inventory',
  'team-directory':     'Team Directory',
}

/* ─────────────────────────────────────────────────────────────
   Per-project seed data for the three existing projects.
   These are the fields that differ between projects — everything
   else (milestones, workstreams, budget lines, vendors, team)
   comes from the shared store default.

   In production: each project has its own database record.
   For the prototype: we override the production slice of the
   store with project-specific fields, keeping all the rich
   workstream/milestone/vendor data intact.
   ───────────────────────────────────────────────────────────── */
const PROJECT_OVERRIDES = {} /* placeholder project overrides removed */

/* ─────────────────────────────────────────────────────────────
   WorkspaceShell
   Receives `activeProject` from App (the card that was clicked).
   If activeProject is null, uses the default Apple store data.
   ───────────────────────────────────────────────────────────── */
export default function WorkspaceShell({ onAllProductions, onProjects, user, activeProject, initialPage, onSignOut, onOpenPalette, onOpenProject, onUpdateProject }) {
  const [activePage,         setActivePage]         = useState(initialPage || 'overview')
  const [menuOpen,           setMenuOpen]           = useState(false)
  const [highlightCommentId, setHighlightCommentId] = useState(null)
  const [railForceOpen,      setRailForceOpen]      = useState(false)
  const [dataManagerOpen,    setDataManagerOpen]    = useState(false)
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)
  const [exportOpen,          setExportOpen]          = useState(false)
  const [archiveConfirmOpen,  setArchiveConfirmOpen]  = useState(false)
  const [deleteConfirmOpen,   setDeleteConfirmOpen]   = useState(false)
  const menuRef = useRef(null)

  // Listen for palette navigation events from App-level CommandPalette
  useEffect(() => {
    const handler = (e) => {
      const page = e.detail?.page
      if (page && PAGE_MAP[page]) setActivePage(page)
    }
    window.addEventListener('field:palette-nav', handler)
    return () => window.removeEventListener('field:palette-nav', handler)
  }, [])

  // Clear highlight after a short delay so re-navigating to same page re-triggers
  useEffect(() => {
    if (!highlightCommentId) return
    const t = setTimeout(() => setHighlightCommentId(null), 4000)
    return () => clearTimeout(t)
  }, [highlightCommentId])

  // Read base store data
  const { state, derived, dispatch } = useStore()

  // When a user-created project opens, reset the global store to a blank slate
  // so another project's data never bleeds through to milestones, budget,
  // approvals, etc. Only reset when actually SWITCHING projects — reopening
  // the same project must keep its own store data (guest list, talent, …).
  useEffect(() => {
    if (activeProject?.userCreated && state.production?.id !== activeProject.id) {
      dispatch(A.loadUserProject({
        id:         activeProject.id,
        name:       activeProject.name       || '',
        client:     activeProject.client     || '',
        type:       activeProject.type       || '',
        location:   activeProject.location   || '',
        eventDate:  activeProject.eventDate  || '',
        eventTime:  activeProject.eventTime  || '',
        budget:     activeProject.budget     || activeProject.totalBudget || '',
        guestCount: activeProject.guestCount || 0,
        venue:      activeProject.venue      || '',
        status:     activeProject.status     || 'active',
        activeWorkstreams: activeProject.activeWorkstreams?.length
          ? activeProject.activeWorkstreams
          : ['hospitality','florals','tablescape','fabrication','av-tech','content','talent'],
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id])

  const projectId   = activeProject?.id || state.production?.id || 'p4'
  const { currentUser, isAdmin, isProducer, canEdit, isViewOnly } = useCurrentUser(user, projectId)

  // Merge activeProject overrides on top of store production.
  // The snapshot cards, header, and topbar all read from `production`.
  const production = useMemo(() => {
    if (!activeProject) return state.production
    // User-created projects get their own clean slate — no Apple filler data
    if (activeProject.userCreated) {
      return {
        id:         activeProject.id,
        name:       state.production.name       || activeProject.name       || '',
        client:     state.production.client     || activeProject.client     || '',
        type:       state.production.type       || activeProject.type       || '',
        location:   state.production.location   || activeProject.location   || '',
        eventDate:  state.production.eventDate  || activeProject.eventDate  || '',
        eventTime:  state.production.eventTime  || activeProject.eventTime  || '',
        budget:     state.production.budget     || activeProject.budget     || activeProject.totalBudget || '',
        guestCount: state.production.guestCount || activeProject.guestCount || 0,
        venue:      state.production.venue      || activeProject.venue      || '',
        status:     state.production.status     || activeProject.status     || 'active',
        ownerEmail: state.production.ownerEmail || activeProject.ownerEmail || activeProject.creatorEmail || '',
        activeWorkstreams: activeProject.activeWorkstreams?.length
          ? activeProject.activeWorkstreams
          : ['hospitality','florals','tablescape','fabrication','av-tech','content','talent'],
      }
    }
    const override = PROJECT_OVERRIDES[activeProject.id] || {}
    return {
      ...state.production,
      ...override,
      name:       override.name       || activeProject.name       || state.production.name,
      client:     override.client     || activeProject.client     || state.production.client,
      type:       override.type       || activeProject.type       || state.production.type,
      location:   override.location   || activeProject.location   || state.production.location,
      eventDate:  override.eventDate  || activeProject.eventDate  || state.production.eventDate,
      status:     override.status     || activeProject.status     || state.production.status,
      budget:     override.budget     || state.production.budget,
      guestCount: override.guestCount || state.production.guestCount,
      eventTime:  override.eventTime  || state.production.eventTime || '6:30 PM',
      ownerEmail: state.production.ownerEmail || activeProject.ownerEmail || activeProject.creatorEmail || '',
    }
  }, [activeProject, state.production])

  // Venue name from override or from logistics
  // Resolve project owner — declared after `production` useMemo
  const ownerEmail = production.ownerEmail || activeProject?.ownerEmail || activeProject?.creatorEmail || ''
  const ownerPerson = ownerEmail
    ? CAPE_DIRECTORY.find(p => p.email?.toLowerCase() === ownerEmail.toLowerCase())
    : null
  const owner = ownerPerson
    ? { name: `${ownerPerson.firstName} ${ownerPerson.lastName}`, initials: ownerPerson.initials, email: ownerEmail }
    : ownerEmail ? { name: ownerEmail.split('@')[0], initials: ownerEmail.slice(0,2).toUpperCase(), email: ownerEmail } : null

  // One venue source of truth: the venue selected on the Venue page wins.
  // PROJECT_OVERRIDES only remain as a fallback for seeded demo projects
  // where no venue has been selected yet.
  const venueName = readProjectVenue(projectId)?.name
    || (activeProject && PROJECT_OVERRIDES[activeProject?.id]?.venue)
    || state.logistics?.venue?.name
    || production.location
    || '—'

  const { daysOut } = derived

  // Close dropdown on outside click
  useEffect(() => {
    const handle = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Reset to overview when switching projects
  useEffect(() => {
    setActivePage('overview')
  }, [activeProject?.id])

  const ActivePage = PAGE_MAP[activePage]

  return (
    <>
    <div className="workspace-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onAllProductions={onAllProductions}
        onProjects={onProjects}
        production={production}
        currentUser={currentUser}
        onOpenProject={onOpenProject}
      />

      <div className="workspace-main" style={{ overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Topbar */}
        <div className="workspace-topbar">
          <div className="topbar-crumb">
            {/* Project name — clickable, returns to the Project Library */}
            <button
              onClick={() => onProjects && onProjects()}
              title="Back to Project Library"
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--ink-400)', fontFamily:'var(--font)', padding:0, letterSpacing:'0.01em' }}
            >
              {production.name}
            </button>
            <span style={{ color:'var(--ink-200)', margin:'0 7px', fontSize:13 }}>›</span>
            <span className="topbar-crumb-cur">{PAGE_LABELS[activePage] || activePage}</span>
          </div>
          <div className="topbar-right">
            <SearchTrigger onClick={onOpenPalette} dark={true}/>
            <div className="topbar-status">
              <div className="topbar-dot" style={{ background: production.status === 'on-schedule' ? 'var(--signal-green-dot)' : 'var(--signal-amber-dot)' }}/>
              <span style={{ color: production.status === 'on-schedule' ? 'var(--signal-green-text)' : 'var(--signal-amber-text)' }}>
                {production.status === 'on-schedule' ? 'On track' : 'Attention'}
              </span>
            </div>
            <span className="topbar-date">{production.eventDate} · {daysOut !== null ? `${daysOut}d` : '—'}</span>
            {user && (
              <>
                <NotificationBell
                  currentUser={currentUser}
                  onOpenProject={(project, page, opts) => {
                    // If same project — just navigate to page + highlight
                    if (!project || project.id === (activeProject?.id || state.production?.id)) {
                      if (page && PAGE_MAP[page]) setActivePage(page)
                      if (opts?.commentId) setHighlightCommentId(opts.commentId)
                      if (opts?.openRail)  setRailForceOpen(true)
                    } else {
                      // Different project — bubble up to App
                      onOpenProject?.(project, page)
                    }
                  }}
                />
                <UserBadge user={user} currentUser={currentUser} projectId={projectId} onSignOut={onSignOut}/>
              </>
            )}
            <button
              onClick={() => setExportOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                background:'transparent', color:'var(--ink-600)',
                border:'1px solid var(--border-med)', borderRadius:3,
                cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-400)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-med)'}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export
            </button>
            <div ref={menuRef} style={{ position:'relative' }}>
              <button className="topbar-menu-btn" onClick={() => setMenuOpen(o => !o)}>···</button>
              {menuOpen && (
                <div className="dropdown">
                  {[
                    { label:'Project settings',   action:() => setProjectSettingsOpen(true) },
                    { label:'Duplicate project',  action:() => {
                        try {
                          const uid = 'dup_' + Math.random().toString(36).slice(2,8)
                          const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
                          const copy = { ...production, id: uid, name: production.name + ' (copy)', status:'active', creatorEmail: user?.email || '' }
                          localStorage.setItem('field_projects_v1', JSON.stringify([copy, ...projects]))
                          alert('Duplicated as "' + copy.name + '". Find it in Project Library.')
                        } catch(e) { alert('Could not duplicate project.') }
                      } },
                    { label:'Archive project',    action:() => setArchiveConfirmOpen(true) },
                    null,
                    { label:'Data & Backup',      action:() => setDataManagerOpen(true) },
                    null,
                    { label:'Delete project',     action:() => setDeleteConfirmOpen(true), danger:true },
                  ].map((item, i) => item === null
                    ? <div key={i} className="dropdown-divider"/>
                    : <button key={i} className={`dropdown-item${item.danger?' danger':''}`}
                        onClick={() => { item.action(); setMenuOpen(false) }}>{item.label}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View-only banner — shown when user can see but not edit this project */}
        {isViewOnly && (
          <div style={{ background:'rgba(200,168,64,0.09)', borderBottom:'1px solid rgba(200,168,64,0.22)',
            padding:'7px 32px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ fontSize:10, color:'var(--signal-amber-dot)' }}>◎</span>
            <p style={{ fontSize:12, color:'var(--signal-amber-text)', fontWeight:500 }}>
              You are viewing this project in read-only mode — you are not assigned to it.
              {currentUser?.caps?.canApproveAll && ' You can still approve items.'}
            </p>
          </div>
        )}

        {/* Page content */}
        {/* Page content + collaboration rail */}
        <div style={{ flex:1, display:'flex', flexDirection:'row', minHeight:0, overflow:'hidden' }}>

          {/* Main page content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + (activeProject?.id || 'default')}
              initial={{ opacity:0, y:5 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-4 }}
              transition={{ duration:0.18, ease:[0.25,1,0.5,1] }}
              style={{ flex:1, overflowY:'auto', minWidth:0 }}
            >
              {ActivePage
                ? <ActivePage
                    onNavigate={setActivePage}
                    production={production}
                    venueName={venueName}
                    user={user}
                    currentUser={currentUser}
                    projectId={projectId}
                    isViewOnly={isViewOnly}
                    owner={owner}
                  />
                : <div style={{ padding:48, color:'var(--ink-300)', fontSize:14 }}>Page not found.</div>
              }
            </motion.div>
          </AnimatePresence>

          {/* Collaboration rail — on all project-specific pages */}
          {(() => {
            // Show rail on every page EXCEPT global library/directory pages
            const GLOBAL_PAGES = new Set(['vendor-library','venue-library','inventory-library','team-directory','libraries','calendar','shopping','florals','tablescape'])
            const showRail = !GLOBAL_PAGES.has(activePage) && !!PAGE_MAP[activePage]
            return showRail ? (
              <CollabRail
                projectId={projectId}
                projectName={production?.name}
                page={activePage}
                pageName={PAGE_LABELS[activePage] || activePage}
                currentUser={currentUser}
                canComment={!!(currentUser && !isViewOnly)}
                highlightCommentId={highlightCommentId}
                defaultOpen={railForceOpen}
              />
            ) : null
          })()}

        </div>
      </div>
    </div>

    {dataManagerOpen && <DataManager onClose={() => setDataManagerOpen(false)}/>}

    {/* Export modal */}
    <AnimatePresence>
      {exportOpen && (
        <ExportModal
          production={production}
          projectId={projectId}
          owner={owner}
          onClose={() => setExportOpen(false)}
        />
      )}
    </AnimatePresence>

    {/* Project Settings modal */}
    {projectSettingsOpen && (
      <ProjectSettingsModal
        production={production}
        projectId={projectId}
        onClose={() => setProjectSettingsOpen(false)}
        onSave={(updates) => {
          // 1. Update the live store so UI reflects changes immediately
          dispatch(A.updateProduction({
            name:       updates.name,
            client:     updates.client,
            eventDate:  updates.eventDate,
            eventTime:  updates.eventTime,
            location:   updates.location,
            venue:      updates.venue,
            guestCount: updates.guestCount ? Number(updates.guestCount) : undefined,
            budget:     updates.totalBudget || undefined,
            status:     updates.status,
            ownerEmail: updates.ownerEmail || '',
          }))
          if (updates.venue) dispatch(A.updateVenue?.({ name: updates.venue }))
          // 2. Update activeProject in App state so session stays fresh
          onUpdateProject?.(updates)
          // 3. Persist to localStorage so it survives refresh
          try {
            const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
            const existing = projects.find(p => p.id === projectId)
            if (existing) {
              localStorage.setItem('field_projects_v1', JSON.stringify(
                projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
              ))
            } else {
              localStorage.setItem('field_projects_v1', JSON.stringify(
                [{ id: projectId, ...production, ...updates }, ...projects.filter(p => p.id !== projectId)]
              ))
            }
          } catch {}
          setProjectSettingsOpen(false)
        }}
      />
    )}

    {/* Archive confirm */}
    {archiveConfirmOpen && (
      <ConfirmModal
        title="Archive project?"
        message={`"${production.name}" will be marked as archived and hidden from active views. You can restore it from the Project Library.`}
        confirmLabel="Archive"
        onConfirm={() => {
          try {
            const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
            const existing = projects.find(p => p.id === projectId)
            if (existing) {
              localStorage.setItem('field_projects_v1', JSON.stringify(projects.map(p => p.id === projectId ? { ...p, status:'archived' } : p)))
            } else {
              localStorage.setItem('field_projects_v1', JSON.stringify([{ id: projectId, ...production, status:'archived' }, ...projects]))
            }
          } catch {}
          setArchiveConfirmOpen(false)
          onAllProductions?.()
        }}
        onCancel={() => setArchiveConfirmOpen(false)}
      />
    )}

    {/* Delete confirm */}
    {deleteConfirmOpen && (
      <ConfirmModal
        title="Delete project?"
        message={`This will permanently remove "${production.name}" from Field. This cannot be undone.`}
        confirmLabel="Delete permanently"
        danger
        onConfirm={() => {
          try {
            const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
            localStorage.setItem('field_projects_v1', JSON.stringify(projects.filter(p => p.id !== projectId)))
            // Purge ALL project-scoped data so the account is clean afterward.
            // Master directories (team, vendors, venues) are code-level data
            // and are never touched by this.
            const doomed = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (!key) continue
              if (key.startsWith('field_local_') && key.includes(`_${projectId}_`)) doomed.push(key)
              if (key === `field_ros_${projectId}_v1`)      doomed.push(key)
              if (key === `field_ros_view_${projectId}_v1`) doomed.push(key)
            }
            doomed.forEach(k => localStorage.removeItem(k))
            dispatch(A.purgeProjectData({ projectId }))
          } catch {}
          setDeleteConfirmOpen(false)
          onAllProductions?.()
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    )}
    </>
  )
}
