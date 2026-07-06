import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Login             from './screens/Login.jsx'
import ProductionDetails from './screens/ProductionDetails.jsx'
import TeamAssignment    from './screens/TeamAssignment.jsx'
import Generation        from './screens/Generation.jsx'
import WorkspaceShell    from './workspace/WorkspaceShell.jsx'

import CompanyShell      from './company/CompanyShell.jsx'
import Dashboard         from './company/Dashboard.jsx'
import MyProjects        from './company/MyProjects.jsx'
import ProjectLibrary    from './company/ProjectLibrary.jsx'
import TeamLibrary       from './company/TeamLibrary.jsx'
import VendorLibrary     from './company/VendorLibrary.jsx'
import VenueLibrary      from './company/VenueLibrary.jsx'
import InventoryLibrary  from './company/InventoryLibrary.jsx'
import Integrations      from './company/Integrations.jsx'
import CommandPalette    from './components/CommandPalette.jsx'
import { resolveUser }   from './team/teamConfig.js'
import { ensureDemoSeed } from './demoSeed.js'

// Seed the demo environment once, before any component reads storage.
ensureDemoSeed()

/* ── Session persistence ────────────────────────────────────── */
const SESSION_KEY  = 'field_session_v1'
const SESSION_DAYS = 7

function saveSession(user, screen, companyPage, activeProject, workspacePage) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user, screen, companyPage, activeProject, workspacePage,
      expiresAt: Date.now() + SESSION_DAYS * 86400000,
    }))
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (Date.now() > s.expiresAt) { localStorage.removeItem(SESSION_KEY); return null }
    return s
  } catch { return null }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

/* ── Screen constants ───────────────────────────────────────── */
const S = {
  LOGIN:     'login',
  COMPANY:   'company',
  DETAILS:   'details',
  TEAM:      'team',
  GEN:       'gen',
  WORKSPACE: 'workspace',
}

export default function App() {
  // Restore session on mount
  const saved = loadSession()

  // Re-read the project from field_projects_v1 so any changes made since
  // the session was saved (e.g. ownerEmail) are reflected after reload.
  const hydrateProject = (p) => {
    if (!p?.id) return p
    try {
      const projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
      const fresh = projects.find(x => x.id === p.id)
      return fresh ? { ...p, ...fresh } : p
    } catch { return p }
  }

  const [screen,               setScreen]               = useState(saved?.user ? (saved.screen || S.COMPANY) : S.LOGIN)
  const [user,                 setUser]                 = useState(saved?.user || null)
  const [activeProject,        setActiveProject]        = useState(hydrateProject(saved?.activeProject) || null)
  const [companyPage,          setCompanyPage]          = useState(saved?.companyPage || 'dashboard')
  const [workspaceInitialPage, setWorkspaceInitialPage] = useState(saved?.workspacePage || 'overview')
  const [cmdOpen,              setCmdOpen]              = useState(false)

  const resolvedUser = resolveUser(user)

  // Persist session whenever relevant state changes
  useEffect(() => {
    if (user) {
      saveSession(user, screen, companyPage, activeProject, workspaceInitialPage)
    }
  }, [user, screen, companyPage, activeProject, workspaceInitialPage])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Only open if user is logged in
        if (user) setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user])

  const openProject = (project, page) => {
    setActiveProject(hydrateProject(project))
    setWorkspaceInitialPage(page || 'overview')
    setScreen(S.WORKSPACE)
  }

  const startNewProject = () => {
    setActiveProject(null)
    setScreen(S.DETAILS)
  }

  const handleAuthenticated = (authUser) => {
    setUser(authUser)
    setScreen(S.COMPANY)
  }

  const handleCompanyNav = (id) => {
    if (id === 'new-project') { startNewProject(); return }
    setCompanyPage(id)
  }

  // Unified navigation used by CommandPalette — works from any screen
  const handlePaletteNav = (id) => {
    if (id === 'new-project') { startNewProject(); return }
    // Workspace-scoped pages → open in current project or go to company
    const WORKSPACE_PAGES = ['overview','team','timeline','approvals','budget','vendors',
      'logistics','fabrication','av-tech','creative','assets','hospitality','guest-list',
      'talent','run-of-show','content','files','debrief','shortlist','team-directory',
      'vendor-library','venue-library','inventory-library']
    if (WORKSPACE_PAGES.includes(id) && screen === S.WORKSPACE) {
      // Signal WorkspaceShell to navigate — done via a shared ref / event for now
      // We store it and WorkspaceShell reads it on next render
      window.__fieldPaletteNav = id
      window.dispatchEvent(new CustomEvent('field:palette-nav', { detail: { page: id } }))
      return
    }
    // Company-level or unknown → go to company shell
    const COMPANY_PAGES = ['dashboard','my-projects','project-library','team-directory',
      'vendors','venues','inventory']
    if (COMPANY_PAGES.includes(id)) {
      setScreen(S.COMPANY)
      setCompanyPage(id)
      return
    }
    // Try it as a company page anyway
    setScreen(S.COMPANY)
    setCompanyPage(id)
  }

  const handleAllProductions = () => {
    setScreen(S.COMPANY)
    setCompanyPage('dashboard')
  }

  const handleSignOut = () => {
    clearSession()
    setUser(null)
    setScreen(S.LOGIN)
    setActiveProject(null)
    setCompanyPage('dashboard')
  }

  // CommandPalette rendered at App root — sits above every screen
  const palette = user ? (
    <CommandPalette
      open={cmdOpen}
      onClose={() => setCmdOpen(false)}
      resolvedUser={resolvedUser}
      onOpenProject={(p) => { openProject(p); setCmdOpen(false) }}
      onNavigate={(id) => { handlePaletteNav(id); setCmdOpen(false) }}
    />
  ) : null

  if (screen === S.WORKSPACE) {
    return (
      <>
        {palette}
        <WorkspaceShell
          onAllProductions={handleAllProductions}
          onProjects={() => { setScreen(S.COMPANY); setCompanyPage('project-library') }}
          user={user}
          activeProject={activeProject}
          initialPage={workspaceInitialPage}
          onSignOut={handleSignOut}
          onOpenPalette={() => setCmdOpen(true)}
          onOpenProject={openProject}
          onUpdateProject={(updates) => setActiveProject(p => p ? { ...p, ...updates } : p)}
        />
      </>
    )
  }

  if (screen === S.DETAILS) return <ProductionDetails onNext={() => setScreen(S.TEAM)} onCancel={() => setScreen(S.COMPANY)}/>
  if (screen === S.TEAM)    return <TeamAssignment    onNext={() => setScreen(S.GEN)}  onBack={() => setScreen(S.DETAILS)}/>
  if (screen === S.GEN)     return <Generation        onComplete={() => setScreen(S.WORKSPACE)}/>

  if (screen === S.LOGIN) {
    return (
      <AnimatePresence mode="wait">
        <Login key="login" onAuthenticated={handleAuthenticated}/>
      </AnimatePresence>
    )
  }

  return (
    <>
      {palette}
      <CompanyShell
        activePage={companyPage}
        onNavigate={handleCompanyNav}
        onOpenProject={openProject}
        user={user}
        currentUser={resolvedUser}
        onSignOut={handleSignOut}
        onOpenPalette={() => setCmdOpen(true)}>
        {companyPage === 'dashboard'       && <Dashboard      onOpenProject={openProject} onNavigate={handleCompanyNav} user={user}/>}
        {companyPage === 'my-projects'     && <MyProjects     onOpenProject={openProject} user={user} onNavigate={handleCompanyNav}/>}
        {companyPage === 'project-library' && <ProjectLibrary onOpenProject={openProject}/>}
        {companyPage === 'team-directory'  && <TeamLibrary/>}
        {companyPage === 'vendors'         && <VendorLibrary/>}
        {companyPage === 'venues'          && <VenueLibrary/>}
        {companyPage === 'inventory'       && <InventoryLibrary/>}
        {companyPage === 'integrations'    && <Integrations/>}
        {!['dashboard','my-projects','project-library','team-directory','vendors','venues','inventory','integrations'].includes(companyPage) && (
          <div style={{ width:'100%', padding:'60px 72px' }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:12 }}>Field</p>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:36, fontWeight:700, color:'var(--ink-900)', marginBottom:10, textTransform:'capitalize' }}>
              {companyPage.replace(/-/g,' ')}
            </p>
            <p style={{ fontSize:15, color:'var(--ink-400)' }}>Coming soon.</p>
          </div>
        )}
      </CompanyShell>
    </>
  )
}
