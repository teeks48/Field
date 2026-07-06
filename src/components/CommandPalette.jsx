/**
 * Field — Universal Command Palette
 * Cmd+K / Ctrl+K  ·  SearchTrigger button in both topbars
 *
 * Search categories (future-ready — add new ones to INDEX_BUILDERS):
 *   Commands · Recent · Projects · Clients · Team · Vendors · Venues · Pages · Files
 *
 * Architecture:
 *   - buildFullIndex()  plain function, no hooks, builds entire item list
 *   - CommandPalette    React component with input, scoring, keyboard nav
 *   - SearchTrigger     small button used in CompanyShell + WorkspaceShell topbars
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getAllProjectsWithUserCreated } from '../company/companyData.js'
import { VENDORS, VENUES }             from '../company/libraryData.js'
import { CAPE_DIRECTORY }              from '../data/capeDirectory.js'
import { getAssignedProjects, PROJECTS } from '../team/teamConfig.js'

/* ─────────────────────────────────────────────────────────────
   Recent history
   ───────────────────────────────────────────────────────────── */
const RECENT_KEY = 'field_cmd_recent_v1'
const MAX_RECENT = 8

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function persistRecent(items) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT))) } catch {}
}
function pushToRecent(item) {
  const prev = loadRecent().filter(r => r.id !== item.id)
  persistRecent([{ id:item.id, label:item.label, sub:item.sub, category:item.category }, ...prev])
}

/* ─────────────────────────────────────────────────────────────
   Index builder  — plain function, no hooks
   Each item: { id, label, sub, category, keywords, icon, action }
   ───────────────────────────────────────────────────────────── */
function buildFullIndex({ resolvedUser, onOpenProject, onNavigate, onClose, assignedIds }) {
  const allProjects = getAllProjectsWithUserCreated()

  // Permission filter
  const visibleProjects = assignedIds
    ? allProjects.filter(p => assignedIds.has(p.id))
    : allProjects

  const nav = (page) => { onNavigate(page); onClose() }
  const items = []

  /* ── Commands ── */
  ;[
    { id:'cmd-new-project',    label:'Create new project',      sub:'Start the project setup flow',          icon:'⌘', action:() => nav('new-project') },
    { id:'cmd-dashboard',      label:'Open Dashboard',          sub:'Go to your personalised My Work view',  icon:'⌘', action:() => nav('dashboard')   },
    { id:'cmd-project-lib',    label:'Browse Project Library',  sub:'All agency projects',                   icon:'⌘', action:() => nav('project-library') },
    { id:'cmd-team-dir',       label:'Open Team Directory',     sub:'Browse the CAPE global team',           icon:'⌘', action:() => nav('team-directory') },
    { id:'cmd-my-projects',    label:'My Projects',             sub:'Projects assigned to you',              icon:'⌘', action:() => nav('my-projects') },
    { id:'cmd-vendors',        label:'Vendor Library',          sub:'All vendors and preferred suppliers',   icon:'⌘', action:() => nav('vendors') },
    { id:'cmd-venues',         label:'Venue Library',           sub:'All venues and spaces',                 icon:'⌘', action:() => nav('venues') },
  ].forEach(c => items.push({ ...c, category:'Commands', keywords:`${c.label} ${c.sub}` }))

  /* ── Projects ── */
  visibleProjects.forEach(p => {
    items.push({
      id:       `proj-${p.id}`,
      label:    p.name,
      sub:      [p.client, p.location, p.statusLabel || p.status].filter(Boolean).join(' · '),
      category: 'Projects',
      keywords: [p.name, p.client, p.location, p.category, p.phase].filter(Boolean).join(' '),
      icon:     '◈',
      action:   () => { onOpenProject(p); onClose() },
    })
  })

  /* ── Clients ── */
  const uniqueClients = [...new Set(visibleProjects.map(p => p.client).filter(Boolean))]
  uniqueClients.forEach(client => {
    const count = visibleProjects.filter(p => p.client === client).length
    items.push({
      id:       `client-${client.replace(/\s+/g,'-').toLowerCase()}`,
      label:    client,
      sub:      `${count} project${count !== 1 ? 's' : ''}`,
      category: 'Clients',
      keywords: client,
      icon:     '◇',
      action:   () => nav('project-library'),
    })
  })

  /* ── Team members ── */
  CAPE_DIRECTORY.forEach(p => {
    const fullName = `${p.firstName} ${p.lastName}`
    items.push({
      id:       `team-${p.id}`,
      label:    fullName,
      sub:      [p.title, p.location].filter(Boolean).join(' · ') || 'CAPE Creative',
      category: 'Team',
      keywords: [fullName, p.title, p.email, p.location].filter(Boolean).join(' '),
      icon:     '○',
      action:   () => nav('team-directory'),
    })
  })

  /* ── Vendors ── */
  VENDORS.forEach(v => {
    items.push({
      id:       `vendor-${v.id}`,
      label:    v.name,
      sub:      [v.category, v.city, v.preferred ? 'Preferred' : ''].filter(Boolean).join(' · '),
      category: 'Vendors',
      keywords: [v.name, v.category, v.city, v.contact, ...(v.services || [])].filter(Boolean).join(' '),
      icon:     '▷',
      action:   () => nav('vendors'),
    })
  })

  /* ── Venues ── */
  VENUES.forEach(v => {
    items.push({
      id:       `venue-${v.id}`,
      label:    v.name,
      sub:      [v.type, v.city, v.capacity ? `Up to ${v.capacity}` : ''].filter(Boolean).join(' · '),
      category: 'Venues',
      keywords: [v.name, v.type, v.city, v.location].filter(Boolean).join(' '),
      icon:     '⬡',
      action:   () => nav('venues'),
    })
  })

  /* ── Pages — workspace workstreams ── */
  const WORKSPACE_PAGES = [
    { id:'overview',         label:'Project Overview',   sub:'Status, workstreams, and next milestones' },
    { id:'team',             label:'Team / DRI',         sub:'Assigned team and responsibilities' },
    { id:'timeline',         label:'Timeline',           sub:'Deadlines and critical path' },
    { id:'approvals',        label:'Approvals',          sub:'Pending sign-offs' },
    { id:'budget',           label:'Budget',             sub:'Budget tracking and reconciliation' },
    { id:'vendors',          label:'Vendors',            sub:'Project vendor assignments' },
    { id:'logistics',        label:'Venue',              sub:'Venue, load-in, and logistics' },
    { id:'fabrication',      label:'Fabrication',        sub:'Scenic and build status' },
    { id:'av-tech',          label:'AV / Tech',          sub:'Audio, visual, and lighting' },
    { id:'creative',         label:'Deliverables',       sub:'Creative deliverables pipeline' },
    { id:'assets',           label:'Fulfillment',        sub:'Print and fulfillment' },
    { id:'hospitality',      label:'Hospitality',        sub:'F&B, tablescape, and guest experience' },
    { id:'guest-list',       label:'Guest List',         sub:'RSVPs and guest management' },
    { id:'talent',           label:'Talent',             sub:'Talent and entertainment' },
    { id:'run-of-show',      label:'Run of Show',        sub:'Day-of schedule and cues' },
    { id:'content',          label:'Content Capture',    sub:'Shot list and content plan' },
    { id:'files',            label:'Files',              sub:'Project files and uploads' },
    { id:'debrief',          label:'Debrief',            sub:'Post-event notes and learnings' },
    { id:'shortlist',        label:'Shortlist',          sub:'Saved vendors and venues' },
    { id:'team-directory',   label:'Team Directory',     sub:'CAPE global team' },
    { id:'vendor-library',   label:'Vendor Library',     sub:'All vendors' },
    { id:'venue-library',    label:'Venue Library',      sub:'All venues' },
    { id:'inventory-library',label:'Inventory',          sub:'Equipment and assets' },
    { id:'dashboard',        label:'Dashboard',          sub:'My Work command center' },
    { id:'my-projects',      label:'My Projects',        sub:'Projects assigned to you' },
    { id:'project-library',  label:'Project Library',    sub:'All agency projects' },
  ]
  WORKSPACE_PAGES.forEach(pg => {
    items.push({
      id:       `page-${pg.id}`,
      label:    pg.label,
      sub:      pg.sub,
      category: 'Pages',
      keywords: `${pg.label} ${pg.sub}`,
      icon:     '□',
      action:   () => nav(pg.id),
    })
  })

  /* ── Files — future-ready placeholder ──
     Uncomment and populate when file search is available:
  FILES.forEach(f => items.push({
    id: `file-${f.id}`, label: f.name, sub: f.projectName,
    category: 'Files', keywords: `${f.name} ${f.projectName}`,
    icon: '⌸', action: () => nav(`project-files-${f.projectId}`),
  }))
  */

  return items
}

/* ─────────────────────────────────────────────────────────────
   Scoring — pure function, no hooks
   ───────────────────────────────────────────────────────────── */
function score(item, query) {
  if (!query) return 0
  const q   = query.toLowerCase().trim()
  const lbl = item.label.toLowerCase()
  const kw  = item.keywords.toLowerCase()
  if (lbl === q)           return 100
  if (lbl.startsWith(q))  return 85
  if (lbl.includes(q))    return 70
  if (kw.startsWith(q))   return 55
  if (kw.includes(q))     return 40
  // word-level match
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length > 1 && words.every(w => kw.includes(w))) return 60
  if (words.some(w => lbl.includes(w)))                      return 30
  return 0
}

/* ─────────────────────────────────────────────────────────────
   Category display config
   ───────────────────────────────────────────────────────────── */
const CAT_ORDER  = ['Commands','Recent','Projects','Clients','Team','Vendors','Venues','Pages','Files']
const CAT_ICONS  = { Commands:'⌘', Recent:'↺', Projects:'◈', Clients:'◇', Team:'○', Vendors:'▷', Venues:'⬡', Pages:'□', Files:'⌸' }

/* ─────────────────────────────────────────────────────────────
   Match highlighter
   ───────────────────────────────────────────────────────────── */
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>
  const q   = query.trim()
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:'rgba(200,168,64,0.28)', color:'inherit', borderRadius:2, padding:'0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main CommandPalette component
   ───────────────────────────────────────────────────────────── */
export default function CommandPalette({ open, onClose, resolvedUser, onOpenProject, onNavigate }) {
  const [query,    setQuery]    = useState('')
  const [cursor,   setCursor]   = useState(0)
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  /* ── Compute permission-filtered assigned IDs ── */
  const assignedIds = useMemo(() => {
    if (!resolvedUser) return new Set()
    if (resolvedUser.caps?.canEditAll) return null  // null = see all
    const allProjects = getAllProjectsWithUserCreated()
    const fromConfig  = getAssignedProjects(resolvedUser, Object.values(PROJECTS)).map(p => p.id)
    const userCreated = allProjects.filter(p => p.userCreated).map(p => p.id)
    return new Set([...fromConfig, ...userCreated])
  }, [resolvedUser?.email])

  /* ── Build full search index whenever palette opens or user changes ── */
  const allItems = useMemo(() => {
    if (!open) return []
    return buildFullIndex({ resolvedUser, onOpenProject, onNavigate, onClose, assignedIds })
  }, [open, resolvedUser?.email])  // deps: re-index when user changes

  /* ── Compute filtered results ── */
  const { grouped, flat } = useMemo(() => {
    const q = query.trim()

    let visible
    if (!q) {
      // Empty state: commands + recent
      const recent     = loadRecent()
      const commands   = allItems.filter(i => i.category === 'Commands').slice(0, 5)
      const recentFull = recent
        .map(r => {
          const found = allItems.find(i => i.id === r.id)
          return found ? { ...found, category:'Recent' } : null
        })
        .filter(Boolean)
        .slice(0, 6)
      visible = [...commands, ...recentFull]
    } else {
      visible = allItems
        .map(i => ({ i, s: score(i, q) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 28)
        .map(x => x.i)
    }

    // Group
    const byCategory = {}
    visible.forEach(item => {
      ;(byCategory[item.category] ??= []).push(item)
    })
    const grouped = CAT_ORDER
      .filter(c => byCategory[c]?.length)
      .map(c => ({ cat:c, items:byCategory[c] }))
    const flat = grouped.flatMap(g => g.items)

    return { grouped, flat }
  }, [query, allItems])

  /* ── Reset cursor when results change ── */
  useEffect(() => { setCursor(0) }, [flat.length, query])

  /* ── Focus input on open ── */
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  /* ── Scroll cursor item into view ── */
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block:'nearest' })
  }, [cursor])

  /* ── Select item ── */
  const selectItem = useCallback((item) => {
    if (!item) return
    pushToRecent(item)
    item.action()
  }, [])

  /* ── Keyboard handler ── */
  const onKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); selectItem(flat[cursor]) }
    if (e.key === 'Escape')    { onClose() }
  }, [flat, cursor, selectItem, onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="backdrop"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.14 }}
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:1000,
          background:'rgba(12,10,8,0.50)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)' }}
      />

      {/* Modal */}
      <motion.div key="palette"
        initial={{ opacity:0, y:-12, scale:0.98 }}
        animate={{ opacity:1, y:0,   scale:1    }}
        exit={{    opacity:0, y:-8,  scale:0.98 }}
        transition={{ duration:0.16, ease:[0.22,1,0.36,1] }}
        style={{ position:'fixed', top:'16vh', left:'50%', transform:'translateX(-50%)',
          width:620, maxWidth:'calc(100vw - 32px)', zIndex:1001,
          background:'var(--surface)',
          border:'1px solid var(--border-med)',
          borderRadius:12,
          overflow:'hidden',
          boxShadow:'0 32px 96px rgba(10,9,8,0.36), 0 8px 24px rgba(10,9,8,0.20)' }}
      >
        {/* Search row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'15px 18px',
          borderBottom: flat.length ? '1px solid var(--border)' : 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="var(--ink-300)" strokeWidth="1.5"/>
            <path d="M11 11L14.5 14.5" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search projects, people, vendors, pages…"
            style={{ flex:1, border:'none', outline:'none', fontSize:16,
              fontFamily:'var(--font)', color:'var(--ink-900)',
              background:'transparent', lineHeight:1.4 }}
          />

          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{ flexShrink:0, width:20, height:20, borderRadius:'50%',
                background:'var(--ink-200)', border:'none', cursor:'pointer',
                color:'var(--ink-600)', fontSize:12, display:'flex', alignItems:'center',
                justifyContent:'center', lineHeight:1 }}>
              ×
            </button>
          )}

          <kbd style={{ flexShrink:0, fontFamily:'var(--font)', fontSize:11, fontWeight:600,
            color:'var(--ink-300)', background:'var(--ground-dim)',
            border:'1px solid var(--border)', borderRadius:5, padding:'3px 7px', lineHeight:1.4 }}>
            esc
          </kbd>
        </div>

        {/* Results list */}
        {flat.length > 0 && (
          <div ref={listRef} style={{ maxHeight:416, overflowY:'auto', padding:'4px 0 6px' }}
            // custom scrollbar via CSS (inline can't do it, but the class is already in index.css)
          >
            {grouped.map(({ cat, items }) => {
              const catStart = flat.indexOf(items[0])
              return (
                <div key={cat}>
                  {/* Category label */}
                  <div style={{ padding:'8px 18px 3px', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em',
                      textTransform:'uppercase', color:'var(--ink-300)' }}>
                      {cat === 'Recent' ? '↺  Recent' : cat}
                    </span>
                    {cat === 'Recent' && (
                      <button onClick={() => { persistRecent([]); setQuery(' '); setTimeout(()=>setQuery(''),0) }}
                        style={{ fontSize:10, color:'var(--ink-200)', background:'none', border:'none',
                          cursor:'pointer', fontFamily:'var(--font)', padding:0, marginLeft:4 }}>
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  {items.map((item, li) => {
                    const gi = catStart + li
                    const active = gi === cursor
                    return (
                      <div key={item.id}
                        data-idx={gi}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setCursor(gi)}
                        style={{ display:'flex', alignItems:'center', gap:11,
                          padding:'9px 18px', cursor:'pointer',
                          background: active ? 'var(--ground-dim)' : 'transparent',
                          borderLeft: `2px solid ${active ? 'var(--ink-800)' : 'transparent'}`,
                        }}>

                        {/* Icon */}
                        <span style={{ fontSize:12, lineHeight:1, flexShrink:0, fontFamily:'var(--font-mono)',
                          color: active ? 'var(--ink-500)' : 'var(--ink-200)',
                          width:14, textAlign:'center' }}>
                          {item.icon || CAT_ICONS[item.category] || '·'}
                        </span>

                        {/* Labels */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:14, fontWeight: active ? 600 : 500,
                            color: active ? 'var(--ink-900)' : 'var(--ink-800)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            marginBottom: item.sub ? 1 : 0, lineHeight:1.3 }}>
                            <Highlight text={item.label} query={query}/>
                          </p>
                          {item.sub && (
                            <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.3,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              <Highlight text={item.sub} query={query}/>
                            </p>
                          )}
                        </div>

                        {/* Enter hint */}
                        {active && (
                          <kbd style={{ flexShrink:0, fontFamily:'var(--font)', fontSize:10,
                            fontWeight:600, color:'var(--ink-400)',
                            background:'var(--surface)', border:'1px solid var(--border)',
                            borderRadius:4, padding:'2px 6px', lineHeight:1.5 }}>
                            ↵
                          </kbd>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty query state hint */}
        {!query && flat.length === 0 && (
          <div style={{ padding:'28px 18px', textAlign:'center' }}>
            <p style={{ fontSize:14, color:'var(--ink-300)', fontStyle:'italic' }}>
              Start typing to search…
            </p>
          </div>
        )}

        {/* No results */}
        {query && flat.length === 0 && (
          <div style={{ padding:'32px 18px', textAlign:'center' }}>
            <p style={{ fontSize:14, color:'var(--ink-300)' }}>
              No results for <em>"{query}"</em>
            </p>
            <p style={{ fontSize:12, color:'var(--ink-200)', marginTop:6 }}>
              Try a project name, client, vendor, or team member.
            </p>
          </div>
        )}

        {/* Footer keyboard hints */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'9px 18px',
          borderTop:'1px solid var(--border)', background:'var(--ground-dim)' }}>
          {[['↑ ↓','Navigate'], ['↵','Open'], ['esc','Close']].map(([key, label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <kbd style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600,
                color:'var(--ink-400)', background:'var(--surface)',
                border:'1px solid var(--border)', borderRadius:4,
                padding:'2px 6px', lineHeight:1.5 }}>{key}</kbd>
              <span style={{ fontSize:11, color:'var(--ink-300)' }}>{label}</span>
            </div>
          ))}
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.10em',
            textTransform:'uppercase', color:'var(--ink-200)' }}>Field</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────────────────────
   SearchTrigger — drop-in button for both topbars
   dark=true → inverse colours for dark nav bars (CompanyShell, workspace topbar)
   ───────────────────────────────────────────────────────────── */
export function SearchTrigger({ onClick, dark = false }) {
  const fg  = dark ? 'rgba(255,255,255,0.42)' : 'var(--ink-400)'
  const bg  = dark ? 'rgba(255,255,255,0.06)' : 'var(--ground-dim)'
  const bdr = dark ? 'rgba(255,255,255,0.10)' : 'var(--border)'
  const bgH = dark ? 'rgba(255,255,255,0.11)' : 'var(--border)'
  const kbg = dark ? 'rgba(255,255,255,0.04)' : 'var(--surface)'

  return (
    <button
      onClick={onClick}
      title="Search  ⌘K"
      style={{ display:'flex', alignItems:'center', gap:7,
        padding:'5px 11px', background:bg, border:`1px solid ${bdr}`,
        borderRadius:6, cursor:'pointer', fontFamily:'var(--font)',
        transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = bgH}
      onMouseLeave={e => e.currentTarget.style.background = bg}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke={fg} strokeWidth="1.4"/>
        <path d="M9 9L12 12" stroke={fg} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize:12, color:fg, letterSpacing:'0.01em', fontWeight:400 }}>Search</span>
      <kbd style={{ fontSize:10, fontWeight:600, color:fg, background:kbg,
        border:`1px solid ${bdr}`, borderRadius:4,
        padding:'1px 5px', lineHeight:1.5, fontFamily:'var(--font)', opacity:0.75 }}>
        ⌘K
      </kbd>
    </button>
  )
}
