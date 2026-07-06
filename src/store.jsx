import React, { createContext, useContext, useReducer, useMemo } from 'react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDaysOut(str) {
  try {
    const event = new Date(str)
    const today = new Date('2026-06-26')
    return Math.ceil((event - today) / 86400000)
  } catch { return null }
}

function computePhase(d) {
  if (d === null) return 'Unknown'
  if (d > 60) return 'Pre-production'
  if (d > 30) return 'Production'
  if (d > 7)  return 'Final production'
  if (d > 0)  return 'Event week'
  return 'Post-event'
}

function budgetTotals(lines) {
  const budgeted  = lines.reduce((s,l) => s + (l.budgeted||0), 0)
  const confirmed = lines.reduce((s,l) => s + (l.actual||0), 0)
  return { budgeted, confirmed, remaining: budgeted - confirmed,
    pct: budgeted ? Math.round((confirmed/budgeted)*100) : 0 }
}

const uid = prefix => `${prefix}${Date.now()}${Math.random().toString(36).slice(2,6)}`

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL = {
  /* Blank account state — no seeded placeholder project.
     The demo project (if any) is written by demoSeed.js into
     localStorage and merged over this on load. */
  production: {
    id: '', name: '', client: '', type: '', location: '', budgetTier: '',
    guestCount: 0, epId: '', leadId: '', budget: '', notes: '', status: 'active',
    activeWorkstreams: ['hospitality','florals','tablescape','fabrication','av-tech','content','talent'],
    eventDate: '', eventTime: '',
  },
  workstreams:  [],
  milestones:   [],
  budget: {
    approvedBy: '', approvedDate: '',
    proposalLines: [], lines: [], liveSpend: [],
    contingencyPct: 10, notes: '',
  },
  vendors:      [],
  approvals:    [],
  guestList:    [],
  talent:       [],
  shotList:     [],
  socialPlan:   [],
  content:      [],
  runOfShow:    [],
  loadInOut:    [],
  fabrication:  [],
  avItems:      [],
  staff:        [],
  day1Actions:  [],
  activityLog:  [],
  notifications:[],
  onSite:       { callTimes: [], emergencyContacts: [], notes: '' },
  logistics:    { venue: { name:'', floor:'' }, loadIn:{}, loadOut:{}, shipping:{}, permits:[], contacts:[], freight:[], photos:[], files:[] },
  florals:      { lines:[] },
  creativeBrief:{ overview:'', referenceImages:[] },
  creative:     { brief:'', product:'', themes:'', objectives:'', clientFeedback:'' },
  hospitality:  { menu:[], dietary:[], seating:'', beverage:[], notes:'' },
  tablescape:   { vendor:'', deliveryDate:'', brief:'', items:[], notes:'', moodboard:[] },
  assets:       [],
  deliverables: [],
  files:        [],
  shopping:     [],
  projectNotes: {},
  pageComments: {},
  debrief:      { worked:'', didnt:'', vendorFeedback:'', clientFeedback:'', nextTime:'' },
  directoryOverrides: {},
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/* Blank slate for user-created projects — no seeded Apple data */
const BLANK_PROJECT = {
  production: {
    id: '', name: '', client: '', type: '', location: '', budgetTier: '',
    guestCount: 0, epId: '', leadId: '', budget: '', notes: '', status: 'active',
    activeWorkstreams: ['hospitality','florals','tablescape','fabrication','av-tech','content','talent'],
    eventDate: '', eventTime: '',
  },
  workstreams:  [],
  milestones:   [],
  budget: {
    approvedBy: '', approvedDate: '',
    proposalLines: [], lines: [], liveSpend: [],
    contingencyPct: 10, notes: '',
  },
  vendors:      [],
  approvals:    [],
  guestList:    [],
  talent:       [],
  shotList:     [],
  socialPlan:   [],
  content:      [],
  runOfShow:    [],
  loadInOut:    [],
  fabrication:  [],
  avItems:      [],
  staff:        [],
  day1Actions:  [],
  activityLog:  [],
  notifications:[],
  onSite:       { callTimes: [] },
  logistics:    { venue: { name:'', floor:'' }, loadIn:{}, loadOut:{}, permits:[], contacts:[], freight:[], photos:[], files:[] },
  florals:      { lines:[] },
  creativeBrief:{ overview:'', referenceImages:[] },
}

function reducer(state, action) {
  const { type, id, payload, section } = action
  switch (type) {
    case 'LOAD_USER_PROJECT': {
      const { directoryOverrides } = state  // always preserve directory edits
      return { ...state, ...BLANK_PROJECT, directoryOverrides, production: { ...BLANK_PROJECT.production, ...payload } }
    }
    case 'UPDATE_PRODUCTION': return { ...state, production: { ...state.production, ...payload } }
    case 'UPDATE_VENUE':      return { ...state, logistics: { ...state.logistics, venue: { ...state.logistics.venue, ...payload } } }
    case 'UPDATE_LOAD_IN':    return { ...state, logistics: { ...state.logistics, loadIn: { ...state.logistics.loadIn, ...payload } } }
    case 'UPDATE_LOAD_OUT':   return { ...state, logistics: { ...state.logistics, loadOut: { ...state.logistics.loadOut, ...payload } } }

    case 'ADD_SHIPPING':    return { ...state, logistics: { ...state.logistics, shipping: [...state.logistics.shipping, { id:uid('s'), status:'TBC', notes:'', ...payload }] } }
    case 'UPDATE_SHIPPING': return { ...state, logistics: { ...state.logistics, shipping: state.logistics.shipping.map(s => s.id===id ? {...s,...payload} : s) } }
    case 'DELETE_SHIPPING': return { ...state, logistics: { ...state.logistics, shipping: state.logistics.shipping.filter(s => s.id!==id) } }
    case 'ADD_PERMIT':      return { ...state, logistics: { ...state.logistics, permits: [...state.logistics.permits, { id:uid('p'), status:'Pending', notes:'', ...payload }] } }
    case 'UPDATE_PERMIT':   return { ...state, logistics: { ...state.logistics, permits: state.logistics.permits.map(p => p.id===id ? {...p,...payload} : p) } }
    case 'DELETE_PERMIT':   return { ...state, logistics: { ...state.logistics, permits: state.logistics.permits.filter(p => p.id!==id) } }

    case 'UPDATE_CREATIVE_BRIEF': return { ...state, creativeBrief: { ...state.creativeBrief, ...payload } }

    case 'UPDATE_DIRECTORY_PROFILE': return {
      ...state,
      directoryOverrides: {
        ...state.directoryOverrides,
        [id]: { ...(state.directoryOverrides[id] || {}), ...payload },
      },
    }
    case 'ADD_STAFF':          return { ...state, staff: [...state.staff, { id:uid('u'), avatarColor:'blue', ...payload }] }
    case 'UPDATE_STAFF_MEMBER':return { ...state, staff: state.staff.map(s => s.id===id ? {...s,...payload} : s) }
    case 'DELETE_STAFF':       return { ...state, staff: state.staff.filter(s => s.id!==id) }

    case 'UPDATE_WORKSTREAM': return { ...state, workstreams: state.workstreams.map(w => w.id===id ? {...w,...payload} : w) }
    case 'ADD_MILESTONE':     return { ...state, milestones: [...state.milestones, payload] }
    case 'UPDATE_MILESTONE':  return { ...state, milestones: state.milestones.map(m => m.id===id ? {...m,...payload} : m) }
    case 'TOGGLE_MILESTONE_DONE': return { ...state, milestones: state.milestones.map(m => m.id===id ? {...m, done:!m.done, status:!m.done?'Complete':'Upcoming'} : m) }
    case 'DELETE_MILESTONE':  return { ...state, milestones: state.milestones.filter(m => m.id!==id) }

    case 'UPDATE_BUDGET_LINE':   return { ...state, budget: { ...state.budget, lines: state.budget.lines.map(l => l.id===id ? {...l,...payload} : l) } }
    case 'ADD_BUDGET_LINE':      return { ...state, budget: { ...state.budget, lines: [...state.budget.lines, { id:uid('b'), actual:0, notes:'', ...payload }] } }
    case 'DELETE_BUDGET_LINE':   return { ...state, budget: { ...state.budget, lines: state.budget.lines.filter(l => l.id!==id) } }
    case 'UPDATE_PROPOSAL_LINE': return { ...state, budget: { ...state.budget, proposalLines: state.budget.proposalLines.map(l => l.id===id ? {...l,...payload} : l) } }
    case 'ADD_PROPOSAL_LINE':    return { ...state, budget: { ...state.budget, proposalLines: [...state.budget.proposalLines, { id:uid('pr'), notes:'', ...payload }] } }
    case 'DELETE_PROPOSAL_LINE': return { ...state, budget: { ...state.budget, proposalLines: state.budget.proposalLines.filter(l => l.id!==id) } }
    case 'ADD_LIVE_SPEND':       return { ...state, budget: { ...state.budget, liveSpend: [...state.budget.liveSpend, { id:uid('ls'), status:'Pending', notes:'', ...payload }] } }
    case 'UPDATE_LIVE_SPEND':    return { ...state, budget: { ...state.budget, liveSpend: state.budget.liveSpend.map(l => l.id===id ? {...l,...payload} : l) } }
    case 'DELETE_LIVE_SPEND':    return { ...state, budget: { ...state.budget, liveSpend: state.budget.liveSpend.filter(l => l.id!==id) } }

    case 'ADD_VENDOR':    return { ...state, vendors: [...state.vendors, { id:uid('v'), budget:0, notes:'', ...payload }] }
    case 'UPDATE_VENDOR': return { ...state, vendors: state.vendors.map(v => v.id===id ? {...v,...payload} : v) }
    case 'DELETE_VENDOR': return { ...state, vendors: state.vendors.filter(v => v.id!==id) }

    case 'ADD_APPROVAL':    return { ...state, approvals: [...state.approvals, { id:uid('a'), status:'Draft', notes:'', ...payload }] }
    case 'UPDATE_APPROVAL': return { ...state, approvals: state.approvals.map(a => a.id===id ? {...a,...payload} : a) }
    case 'DELETE_APPROVAL': return { ...state, approvals: state.approvals.filter(a => a.id!==id) }
    case 'ADD_ASSET':       return { ...state, assets: [...state.assets, { id:uid('ast'), status:'In production', notes:'', ...payload }] }
    case 'UPDATE_ASSET':    return { ...state, assets: state.assets.map(a => a.id===id ? {...a,...payload} : a) }
    case 'DELETE_ASSET':    return { ...state, assets: state.assets.filter(a => a.id!==id) }
    case 'ADD_DELIVERABLE':    return { ...state, deliverables: [...state.deliverables, { id:uid('d'), status:'Not started', created:new Date().toISOString().slice(0,10), versions:[], comments:[], copy:'', width:'', height:'', format:'', producerNotes:'', referenceFiles:[], milestones:{ forRevision:'', clientReview:'', approved:'' }, ...payload }] }
    case 'UPDATE_DELIVERABLE': return { ...state, deliverables: state.deliverables.map(d => d.id===id ? {...d,...payload} : d) }
    case 'DELETE_DELIVERABLE': return {
      ...state,
      deliverables: state.deliverables.filter(d => d.id!==id),
      // Keep Approvals in sync: remove any approval that was created from this deliverable
      approvals: (state.approvals||[]).filter(a => !(a.sourceType==='creative' && a.sourceId===id)),
    }

    case 'ADD_ROS':       return { ...state, runOfShow: [...state.runOfShow, { id:uid('r'), clientFacing:false, notes:'', ...payload }] }
    case 'UPDATE_ROS':    return { ...state, runOfShow: state.runOfShow.map(r => r.id===id ? {...r,...payload} : r) }
    case 'DELETE_ROS':    return { ...state, runOfShow: state.runOfShow.filter(r => r.id!==id) }
    case 'ADD_LOADIO':    return { ...state, loadInOut: [...state.loadInOut, { id:uid('li'), notes:'', ...payload }] }
    case 'UPDATE_LOADIO': return { ...state, loadInOut: state.loadInOut.map(r => r.id===id ? {...r,...payload} : r) }
    case 'DELETE_LOADIO': return { ...state, loadInOut: state.loadInOut.filter(r => r.id!==id) }

    case 'ADD_CALLTIME':    return { ...state, onSite: { ...state.onSite, callTimes: [...state.onSite.callTimes, { id:uid('cs'), radio:'Ch 1', credentials:'', notes:'', ...payload }] } }
    case 'UPDATE_CALLTIME': return { ...state, onSite: { ...state.onSite, callTimes: state.onSite.callTimes.map(c => c.id===id ? {...c,...payload} : c) } }
    case 'DELETE_CALLTIME': return { ...state, onSite: { ...state.onSite, callTimes: state.onSite.callTimes.filter(c => c.id!==id) } }
    case 'UPDATE_ONSITE':   return { ...state, onSite: { ...state.onSite, ...payload } }
    case 'ADD_EMERGENCY':   return { ...state, onSite: { ...state.onSite, emergencyContacts: [...state.onSite.emergencyContacts, { id:uid('ec'), notes:'', ...payload }] } }
    case 'UPDATE_EMERGENCY':return { ...state, onSite: { ...state.onSite, emergencyContacts: state.onSite.emergencyContacts.map(e => e.id===id ? {...e,...payload} : e) } }
    case 'DELETE_EMERGENCY':return { ...state, onSite: { ...state.onSite, emergencyContacts: state.onSite.emergencyContacts.filter(e => e.id!==id) } }

    case 'ADD_FAB_ITEM':    return { ...state, fabrication: [...state.fabrication, { id:uid('f'), status:'Not started', notes:'', drawings:'—', materials:'', installNotes:'', ...payload }] }
    case 'UPDATE_FAB_ITEM': return { ...state, fabrication: state.fabrication.map(f => f.id===id ? {...f,...payload} : f) }
    case 'DELETE_FAB_ITEM': return { ...state, fabrication: state.fabrication.filter(f => f.id!==id) }

    case 'ADD_AV_ITEM':    return { ...state, avItems: [...state.avItems, { id:uid('av'), status:'Planned', notes:'', category:'Other', ...payload }] }
    case 'UPDATE_AV_ITEM': return { ...state, avItems: state.avItems.map(a => a.id===id ? {...a,...payload} : a) }
    case 'DELETE_AV_ITEM': return { ...state, avItems: state.avItems.filter(a => a.id!==id) }

    case 'ADD_TALENT':    return { ...state, talent: [...state.talent, { id:uid('t'), contract:'TBC', fee:'', feeStatus:'Unpaid / N/A', dayOfContact:'', dayOfContactEmail:'', dayOfContactPhone:'', notes:'', hospitality:'Standard', ...payload }] }
    case 'UPDATE_TALENT': return { ...state, talent: state.talent.map(t => t.id===id ? {...t,...payload} : t) }
    case 'DELETE_TALENT': return { ...state, talent: state.talent.filter(t => t.id!==id) }
    case 'ADD_GUEST':     return { ...state, guestList: [...state.guestList, { id:uid('g'), rsvp:'Pending', plusOne:false, plusOneName:'', table:'', seat:'', dietary:'', notes:'', ...payload }] }
    case 'UPDATE_GUEST':  return { ...state, guestList: state.guestList.map(g => g.id===id ? {...g,...payload} : g) }
    case 'DELETE_GUEST':  return { ...state, guestList: state.guestList.filter(g => g.id!==id) }

    case 'ADD_CONTENT':    return { ...state, content: [...state.content, { id:uid('c'), status:'Pending', notes:'', ...payload }] }
    case 'UPDATE_CONTENT': return { ...state, content: state.content.map(c => c.id===id ? {...c,...payload} : c) }
    case 'DELETE_CONTENT': return { ...state, content: state.content.filter(c => c.id!==id) }
    case 'ADD_SHOT':       return { ...state, shotList: [...state.shotList, { id:uid('sl'), priority:'Medium', status:'Planned', notes:'', ...payload }] }
    case 'UPDATE_SHOT':    return { ...state, shotList: state.shotList.map(s => s.id===id ? {...s,...payload} : s) }
    case 'DELETE_SHOT':    return { ...state, shotList: state.shotList.filter(s => s.id!==id) }
    case 'ADD_SOCIAL':     return { ...state, socialPlan: [...state.socialPlan, { id:uid('sp'), status:'Not started', notes:'', ...payload }] }
    case 'UPDATE_SOCIAL':  return { ...state, socialPlan: state.socialPlan.map(s => s.id===id ? {...s,...payload} : s) }
    case 'DELETE_SOCIAL':  return { ...state, socialPlan: state.socialPlan.filter(s => s.id!==id) }

    case 'ADD_MENU_ITEM':     return { ...state, hospitality: { ...state.hospitality, menu: [...state.hospitality.menu, { id:uid('h'), dietaryTags:[], status:'Draft', notes:'', ...payload }] } }
    case 'UPDATE_MENU_ITEM':  return { ...state, hospitality: { ...state.hospitality, menu: state.hospitality.menu.map(m => m.id===id ? {...m,...payload} : m) } }
    case 'DELETE_MENU_ITEM':  return { ...state, hospitality: { ...state.hospitality, menu: state.hospitality.menu.filter(m => m.id!==id) } }
    case 'ADD_DIETARY':       return { ...state, hospitality: { ...state.hospitality, dietary: [...state.hospitality.dietary, { id:uid('d'), notes:'', ...payload }] } }
    case 'UPDATE_DIETARY':    return { ...state, hospitality: { ...state.hospitality, dietary: state.hospitality.dietary.map(d => d.id===id ? {...d,...payload} : d) } }
    case 'DELETE_DIETARY':    return { ...state, hospitality: { ...state.hospitality, dietary: state.hospitality.dietary.filter(d => d.id!==id) } }
    case 'ADD_SEATING':       return { ...state, hospitality: { ...state.hospitality, seating: [...state.hospitality.seating, { id:uid('st'), notes:'', ...payload }] } }
    case 'UPDATE_SEATING':    return { ...state, hospitality: { ...state.hospitality, seating: state.hospitality.seating.map(s => s.id===id ? {...s,...payload} : s) } }
    case 'DELETE_SEATING':    return { ...state, hospitality: { ...state.hospitality, seating: state.hospitality.seating.filter(s => s.id!==id) } }
    case 'UPDATE_HOSPITALITY':return { ...state, hospitality: { ...state.hospitality, ...payload } }

    case 'UPDATE_FLORALS':  return { ...state, florals: { ...state.florals, ...payload } }

    case 'ADD_TABLESCAPE_ITEM':    return { ...state, tablescape: { ...state.tablescape, items: [...state.tablescape.items, { id:uid('tc'), status:'Quoted', notes:'', ...payload }] } }
    case 'UPDATE_TABLESCAPE_ITEM': return { ...state, tablescape: { ...state.tablescape, items: state.tablescape.items.map(i => i.id===id ? {...i,...payload} : i) } }
    case 'DELETE_TABLESCAPE_ITEM': return { ...state, tablescape: { ...state.tablescape, items: state.tablescape.items.filter(i => i.id!==id) } }
    case 'UPDATE_TABLESCAPE':      return { ...state, tablescape: { ...state.tablescape, ...payload } }

    case 'UPDATE_CREATIVE': return { ...state, creative: { ...state.creative, ...payload } }

    case 'ADD_SHOPPING':    return { ...state, shopping: [...state.shopping, { id:uid('sh'), ordered:false, delivered:false, amount:0, notes:'', ...payload }] }
    case 'UPDATE_SHOPPING': return { ...state, shopping: state.shopping.map(s => s.id===id ? {...s,...payload} : s) }
    case 'DELETE_SHOPPING': return { ...state, shopping: state.shopping.filter(s => s.id!==id) }

    case 'ADD_FILE':    return { ...state, files: [...state.files, { id:uid('fl'), ...payload }] }
    case 'DELETE_FILE': return { ...state, files: state.files.filter(f => f.id!==id) }

    case 'TOGGLE_DAY1': return { ...state, day1Actions: state.day1Actions.map(a => a.id===id ? {...a, done:!a.done} : a) }
    case 'UPDATE_DEBRIEF': return { ...state, debrief: { ...state.debrief, ...payload } }

    case 'LOG_ACTIVITY': {
      const log = [payload, ...(state.activityLog || [])].slice(0, 200)
      return { ...state, activityLog: log }
    }

    case 'ADD_PROJECT_NOTE': {
      const projectId = payload.projectId
      const existing  = (state.projectNotes || {})[projectId] || []
      return { ...state, projectNotes: { ...(state.projectNotes || {}), [projectId]: [payload, ...existing] } }
    }
    case 'UPDATE_PROJECT_NOTE': {
      const { projectId, noteId, text } = payload
      const notes = ((state.projectNotes || {})[projectId] || []).map(n =>
        n.id === noteId ? { ...n, text, editedAt: new Date().toISOString() } : n
      )
      return { ...state, projectNotes: { ...(state.projectNotes || {}), [projectId]: notes } }
    }
    case 'DELETE_PROJECT_NOTE': {
      const { projectId, noteId } = payload
      const notes = ((state.projectNotes || {})[projectId] || []).filter(n => n.id !== noteId)
      return { ...state, projectNotes: { ...(state.projectNotes || {}), [projectId]: notes } }
    }
    case 'PIN_PROJECT_NOTE': {
      const { projectId, noteId } = payload
      const notes = ((state.projectNotes || {})[projectId] || []).map(n =>
        n.id === noteId ? { ...n, pinned: !n.pinned } : n
      )
      return { ...state, projectNotes: { ...(state.projectNotes || {}), [projectId]: notes } }
    }

    case 'ADD_DELIVERABLE_COMMENT': {
      return { ...state, deliverables: state.deliverables.map(d =>
        d.id === id ? { ...d, comments: [...(d.comments||[]), payload] } : d
      )}
    }
    case 'DELETE_DELIVERABLE_COMMENT': {
      const { commentId } = payload
      return { ...state, deliverables: state.deliverables.map(d =>
        d.id === id ? { ...d, comments: (d.comments||[]).filter(c => c.id !== commentId) } : d
      )}
    }

    // ── Page Comments ──────────────────────────────────────────────────────
    case 'PURGE_PROJECT_DATA': {
      // Remove every store record belonging to one project (used by
      // project deletion so the account returns to a clean state).
      const pid = action.payload?.projectId
      if (!pid) return state
      PURGE_IN_PROGRESS = true
      const keep = arr => (Array.isArray(arr) ? arr.filter(r => r.projectId !== pid) : arr)
      const pageComments = Object.fromEntries(
        Object.entries(state.pageComments || {}).filter(([k]) => !k.startsWith(pid + ':'))
      )
      const projectNotes = { ...(state.projectNotes || {}) }
      delete projectNotes[pid]
      const isCurrent = state.production?.id === pid
      return {
        ...state,
        guestList: keep(state.guestList), talent: keep(state.talent),
        deliverables: keep(state.deliverables), approvals: keep(state.approvals),
        files: keep(state.files), assets: keep(state.assets), shopping: keep(state.shopping),
        milestones: isCurrent ? [] : state.milestones,
        workstreams: isCurrent ? [] : state.workstreams,
        notifications: (state.notifications || []).filter(n => n.projectId !== pid),
        pageComments, projectNotes,
        ...(isCurrent ? {
          production: { ...INITIAL.production },
          creative: { ...INITIAL.creative },
          budget: { ...INITIAL.budget },
          logistics: { ...INITIAL.logistics },
          onSite: { ...INITIAL.onSite },
        } : {}),
      }
    }

    case 'ADD_PAGE_COMMENT': {
      const key  = `${payload.projectId}:${payload.page}`
      const prev = (state.pageComments || {})[key] || []
      return { ...state, pageComments: { ...(state.pageComments || {}), [key]: [...prev, payload] } }
    }
    case 'DELETE_PAGE_COMMENT': {
      const { commentKey, commentId } = payload
      const prev = (state.pageComments || {})[commentKey] || []
      return { ...state, pageComments: { ...(state.pageComments || {}), [commentKey]: prev.filter(c => c.id !== commentId) } }
    }
    case 'EDIT_PAGE_COMMENT': {
      const { commentKey, commentId, text } = payload
      const prev = (state.pageComments || {})[commentKey] || []
      const next = prev.map(c => c.id === commentId ? { ...c, text, edited:true, editedAt:new Date().toISOString() } : c)
      return { ...state, pageComments: { ...(state.pageComments || {}), [commentKey]: next } }
    }

    // ── Notifications ──────────────────────────────────────────────────────
    case 'ADD_NOTIFICATION': {
      const notifs = [payload, ...(state.notifications || [])].slice(0, 100)
      return { ...state, notifications: notifs }
    }
    case 'MARK_NOTIFICATION_READ': {
      return { ...state, notifications: (state.notifications || []).map(n => n.id === payload.id ? { ...n, read:true } : n) }
    }
    case 'MARK_PAGE_NOTIFICATIONS_READ': {
      return { ...state, notifications: (state.notifications || []).map(n =>
        n.commentKey === payload.commentKey ? { ...n, read:true } : n
      )}
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      return { ...state, notifications: (state.notifications || []).map(n => ({ ...n, read:true })) }
    }
    case 'DELETE_NOTIFICATION': {
      return { ...state, notifications: (state.notifications || []).filter(n => n.id !== payload.id) }
    }

    default: console.warn('Unknown action:', type); return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext(null)
const STORE_PERSIST_KEY = 'field_store_v1'
const STORE_WRITE_LOG   = 'field_store_writes_v1'

// Stamp updatedAt on any top-level array item that has an id
function stampArrays(state) {
  const now = new Date().toISOString()
  const stamped = { ...state }
  Object.keys(stamped).forEach(k => {
    if (Array.isArray(stamped[k]) && stamped[k].length > 0 && stamped[k][0]?.id) {
      stamped[k] = stamped[k].map(item => item?.id ? { ...item, updatedAt: now } : item)
    }
  })
  return stamped
}

// One-shot flag: PURGE_PROJECT_DATA is an intentional shrink (project deletion)
let PURGE_IN_PROGRESS = false

// Shrink guard for global store slices
function storeWriteIsSafe(prev, next) {
  // If no prev (first write) always ok
  if (!prev) return true
  // Project deletion legitimately empties slices — let that write through
  if (PURGE_IN_PROGRESS) { PURGE_IN_PROGRESS = false; return true }
  // Check every array slice — block if it drops by >80% with >5 records
  for (const key of Object.keys(next)) {
    const p = prev[key], n = next[key]
    if (Array.isArray(p) && Array.isArray(n)) {
      if (p.length > 5 && n.length < p.length * 0.2) {
        console.warn(`[field store] Blocked store write — "${key}" would shrink ${p.length} → ${n.length}`)
        return false
      }
    }
  }
  return true
}

function logStoreWrite(summary) {
  try {
    const log = JSON.parse(localStorage.getItem(STORE_WRITE_LOG) || '[]')
    log.push({ at: new Date().toISOString(), summary })
    localStorage.setItem(STORE_WRITE_LOG, JSON.stringify(log.slice(-100)))
  } catch {}
}

/* Known corrections to directoryOverrides — applied on every load
   so stale cached values never win over the source file. */
const DIRECTORY_CORRECTIONS = {
  'cape-brett': { location: 'Brooklyn, NY' },
}

function applyDirectoryCorrections(overrides = {}) {
  const corrected = { ...overrides }
  for (const [id, patch] of Object.entries(DIRECTORY_CORRECTIONS)) {
    corrected[id] = { ...(corrected[id] || {}), ...patch }
  }
  return corrected
}

function loadPersistedState() {
  try {
    const saved = localStorage.getItem(STORE_PERSIST_KEY)
    if (!saved) return INITIAL
    const parsed = JSON.parse(saved)
    const merged = { ...INITIAL, ...parsed }
    Object.keys(INITIAL).forEach(key => {
      const initialVal = INITIAL[key]
      const savedVal   = parsed[key]
      if (
        initialVal && savedVal &&
        typeof initialVal === 'object' && typeof savedVal === 'object' &&
        !Array.isArray(initialVal) && !Array.isArray(savedVal)
      ) {
        merged[key] = { ...initialVal, ...savedVal }
      }
    })
    // Always apply canonical corrections so stale overrides never win
    merged.directoryOverrides = applyDirectoryCorrections(merged.directoryOverrides)

    // Ensure critical array fields are never undefined/null from stale saves
    merged.budget = {
      ...INITIAL.budget,
      ...merged.budget,
      liveSpend:     Array.isArray(merged.budget?.liveSpend)     ? merged.budget.liveSpend     : [],
      proposalLines: Array.isArray(merged.budget?.proposalLines) ? merged.budget.proposalLines : [],
      lines:         Array.isArray(merged.budget?.lines)         ? merged.budget.lines         : [],
    }
    const ARRAY_SLICES = ['workstreams','milestones','vendors','approvals','guestList','talent',
      'shotList','socialPlan','content','runOfShow','loadInOut','fabrication','avItems',
      'staff','day1Actions','activityLog','notifications']
    for (const key of ARRAY_SLICES) {
      if (!Array.isArray(merged[key])) merged[key] = INITIAL[key] ?? []
    }
    if (!merged.onSite?.callTimes) merged.onSite = { callTimes: [] }

    return merged
  } catch {
    return INITIAL
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersistedState)
  const prevStateRef = React.useRef(null)

  React.useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state

    // Shrink guard — don't write if this looks like a blank client stomping real data
    if (prev !== null && !storeWriteIsSafe(prev, state)) return

    // Dev mode — write to dev namespace if active
    const devMode = (() => { try { return localStorage.getItem('field_dev_mode') === '1' } catch { return false } })()
    const key = devMode ? 'field_dev_store_v1' : STORE_PERSIST_KEY

    try {
      localStorage.setItem(key, JSON.stringify(state))
      logStoreWrite(`dispatched; vendors:${state.vendors?.length ?? '?'} deliverables:${state.deliverables?.length ?? '?'}`)
    } catch {}
  }, [state])

  const derived = useMemo(() => {
    const daysOut = computeDaysOut(state.production?.eventDate)
    const phase   = computePhase(daysOut)
    const lines         = Array.isArray(state.budget?.lines)         ? state.budget.lines         : []
    const proposalLines = Array.isArray(state.budget?.proposalLines) ? state.budget.proposalLines : []
    const liveSpend     = Array.isArray(state.budget?.liveSpend)     ? state.budget.liveSpend     : []
    const staff         = Array.isArray(state.staff)                 ? state.staff                : []
    const milestones    = Array.isArray(state.milestones)            ? state.milestones           : []
    const workstreams   = Array.isArray(state.workstreams)           ? state.workstreams          : []
    const approvals     = Array.isArray(state.approvals)             ? state.approvals            : []
    const day1Actions   = Array.isArray(state.day1Actions)           ? state.day1Actions          : []
    const totals        = budgetTotals(lines)
    const proposalTotal = proposalLines.reduce((s,l)=>s+(l.amount||0),0)
    const liveTotal     = liveSpend.reduce((s,l)=>s+(l.amount||0),0)
    const ep   = staff.find(s => s.id === state.production?.epId)
    const lead = staff.find(s => s.id === state.production?.leadId)
    const nextGate = milestones.find(m => !m.done && !m.isEvent)
    const agencyStaff = staff.filter(s => s.type === 'internal')
    const openRoles = 0
    const day1Done = day1Actions.filter(a => a.done).length

    const resolve = (arr, key='ownerId') => arr.map(x => ({
      ...x,
      ownerName: x[key] ? (staff.find(s=>s.id===x[key])?.name || x[key]) : '—',
      ownerInitials: x[key] ? (staff.find(s=>s.id===x[key])?.initials || '?') : '?',
      ownerColor: x[key] ? (staff.find(s=>s.id===x[key])?.avatarColor || 'ink') : 'ink',
    }))

    const workstreamsR = workstreams.map(ws => ({
      ...ws,
      owner: staff.find(s=>s.id===ws.ownerId) || null,
      pct: ws.totalTasks ? Math.round((ws.completedTasks/ws.totalTasks)*100) : 0,
    }))

    const vendorName = id => (Array.isArray(state.vendors)?state.vendors:[]).find(v=>v.id===id)?.name || (id ? id : '—')

    const milestonesR = resolve(milestones)
    const approvalsR  = resolve(approvals)
    const rosR        = (Array.isArray(state.runOfShow)?state.runOfShow:[]).map(r => ({ ...r, ownerName: r.ownerId ? (staff.find(s=>s.id===r.ownerId)?.name||r.ownerId) : 'All' }))
    const loadIoR      = (Array.isArray(state.loadInOut)?state.loadInOut:[]).map(r => ({ ...r, ownerName: r.ownerId ? (state.staff.find(s=>s.id===r.ownerId)?.name||r.ownerId) : 'All' }))
    const fabricationR= (Array.isArray(state.fabrication)?state.fabrication:[]).map(f => ({ ...f, vendorName: vendorName(f.vendorId), ownerName: f.ownerId?(staff.find(s=>s.id===f.ownerId)?.name||f.ownerId):'—' }))
    const avItemsR    = (Array.isArray(state.avItems)?state.avItems:[]).map(a => ({ ...a, vendorName: vendorName(a.vendorId), ownerName: a.ownerId?(staff.find(s=>s.id===a.ownerId)?.name||a.ownerId):'—' }))
    const contentR    = (Array.isArray(state.content)?state.content:[]).map(c => ({ ...c, vendorName: vendorName(c.vendorId) }))
    const shotListR   = state.shotList?.map(s => ({ ...s, ownerName: s.ownerId?(staff.find(st=>st.id===s.ownerId)?.name||s.ownerId):'—' })) || []
    const callTimesR  = state.onSite?.callTimes || []
    const day1R       = resolve(day1Actions)
    const venueDisplay= `${state.logistics?.venue?.name||''}, ${state.logistics?.venue?.floor||''}`

    const pendingApprovals = (Array.isArray(approvalsR)?approvalsR:[]).filter(a=>['Pending','Submitted','In progress'].includes(a.status))

    const healthDots = {
      creative:    workstreams.find(w=>w.id==='creative')?.status==='attention'?'amber':'green',
      budget:      totals.pct>90?'amber':'green',
      vendors:     (Array.isArray(state.vendors)?state.vendors:[]).some(v=>v.status==='Quoted')?'amber':'green',
      team:        'green',
      timeline:    nextGate?.daysOut<=5?'amber':'green',
      approvals:   pendingApprovals.length>0?'amber':'green',
      logistics:   (Array.isArray(state.logistics?.permits)?state.logistics.permits:[]).some(p=>p.status==='Pending')?'amber':'green',
      fabrication: (Array.isArray(state.fabrication)?state.fabrication:[]).some(f=>f.status==='In review')?'amber':'green',
      hospitality: workstreams.find(w=>w.id==='hospitality')?.status==='attention'?'amber':'green',
      'av-tech':   'green',
      content:     (Array.isArray(state.content)?state.content:[]).some(c=>c.status==='In review')?'amber':'green',
    }

    return {
      daysOut, phase, totals, proposalTotal, liveTotal,
      ep, lead, nextGate, agencyStaff, openRoles, day1Done,
      workstreamsR, milestonesR, approvalsR, rosR, loadIoR, fabricationR,
      avItemsR, contentR, shotListR, day1R, callTimesR,
      venueDisplay, healthDots, pendingApprovals,
      // Aliases for backward compat
      workstreamsResolved: workstreamsR, milestonesResolved: milestonesR,
      approvalsResolved: approvalsR, day1Resolved: day1R,
    }
  }, [state])

  return <Ctx.Provider value={{ state, dispatch, derived }}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export const A = {
  loadUserProject:  p   => ({ type:'LOAD_USER_PROJECT', payload:p }),
  updateProduction: p   => ({ type:'UPDATE_PRODUCTION', payload:p }),
  updateVenue:      p   => ({ type:'UPDATE_VENUE',      payload:p }),
  updateLoadIn:     p   => ({ type:'UPDATE_LOAD_IN',    payload:p }),
  updateLoadOut:    p   => ({ type:'UPDATE_LOAD_OUT',   payload:p }),
  addShipping:      p   => ({ type:'ADD_SHIPPING',    payload:p }),
  updateShipping:  (id,p)=>({ type:'UPDATE_SHIPPING', id, payload:p }),
  deleteShipping:   id  => ({ type:'DELETE_SHIPPING', id }),
  addPermit:        p   => ({ type:'ADD_PERMIT',    payload:p }),
  updatePermit:    (id,p)=>({ type:'UPDATE_PERMIT', id, payload:p }),
  deletePermit:     id  => ({ type:'DELETE_PERMIT', id }),
  updateCreativeBrief: p => ({ type:'UPDATE_CREATIVE_BRIEF', payload:p }),
  updateDirectoryProfile: (id,p) => ({ type:'UPDATE_DIRECTORY_PROFILE', id, payload:p }),
  addStaff:         p   => ({ type:'ADD_STAFF',           payload:p }),
  updateStaff:     (id,p)=>({ type:'UPDATE_STAFF_MEMBER', id, payload:p }),
  deleteStaff:      id  => ({ type:'DELETE_STAFF',        id }),
  updateWorkstream:(id,p)=>({ type:'UPDATE_WORKSTREAM',id, payload:p }),
  addMilestone:     p   => ({ type:'ADD_MILESTONE',    payload:p }),
  updateMilestone: (id,p)=>({ type:'UPDATE_MILESTONE', id, payload:p }),
  toggleMilestone:  id  => ({ type:'TOGGLE_MILESTONE_DONE', id }),
  deleteMilestone:  id  => ({ type:'DELETE_MILESTONE', id }),
  addBudgetLine:    p   => ({ type:'ADD_BUDGET_LINE',      payload:p }),
  updateBudgetLine:(id,p)=>({ type:'UPDATE_BUDGET_LINE',   id, payload:p }),
  deleteBudgetLine: id  => ({ type:'DELETE_BUDGET_LINE',   id }),
  addProposalLine:  p   => ({ type:'ADD_PROPOSAL_LINE',    payload:p }),
  updateProposalLine:(id,p)=>({type:'UPDATE_PROPOSAL_LINE',id, payload:p }),
  deleteProposalLine:id => ({ type:'DELETE_PROPOSAL_LINE', id }),
  addLiveSpend:     p   => ({ type:'ADD_LIVE_SPEND',       payload:p }),
  updateLiveSpend: (id,p)=>({ type:'UPDATE_LIVE_SPEND',    id, payload:p }),
  deleteLiveSpend:  id  => ({ type:'DELETE_LIVE_SPEND',    id }),
  addVendor:        p   => ({ type:'ADD_VENDOR',    payload:p }),
  updateVendor:    (id,p)=>({ type:'UPDATE_VENDOR', id, payload:p }),
  deleteVendor:     id  => ({ type:'DELETE_VENDOR', id }),
  addApproval:      p   => ({ type:'ADD_APPROVAL',    payload:p }),
  updateApproval:  (id,p)=>({ type:'UPDATE_APPROVAL', id, payload:p }),
  deleteApproval:   id  => ({ type:'DELETE_APPROVAL', id }),
  addAsset:         p   => ({ type:'ADD_ASSET',    payload:p }),
  updateAsset:     (id,p)=>({ type:'UPDATE_ASSET', id, payload:p }),
  deleteAsset:      id  => ({ type:'DELETE_ASSET', id }),
  addDeliverable:      p   => ({ type:'ADD_DELIVERABLE',    payload:p }),
  updateDeliverable:  (id,p)=>({ type:'UPDATE_DELIVERABLE', id, payload:p }),
  deleteDeliverable:   id  => ({ type:'DELETE_DELIVERABLE', id }),
  addRos:           p   => ({ type:'ADD_ROS',    payload:p }),
  updateRos:       (id,p)=>({ type:'UPDATE_ROS', id, payload:p }),
  deleteRos:        id  => ({ type:'DELETE_ROS', id }),
  addLoadio:        p   => ({ type:'ADD_LOADIO',    payload:p }),
  updateLoadio:    (id,p)=>({ type:'UPDATE_LOADIO', id, payload:p }),
  deleteLoadio:     id  => ({ type:'DELETE_LOADIO', id }),
  addCallTime:      p   => ({ type:'ADD_CALLTIME',    payload:p }),
  updateCallTime:  (id,p)=>({ type:'UPDATE_CALLTIME', id, payload:p }),
  deleteCallTime:   id  => ({ type:'DELETE_CALLTIME', id }),
  updateOnSite:     p   => ({ type:'UPDATE_ONSITE',   payload:p }),
  addEmergency:     p   => ({ type:'ADD_EMERGENCY',   payload:p }),
  updateEmergency: (id,p)=>({ type:'UPDATE_EMERGENCY',id, payload:p }),
  deleteEmergency:  id  => ({ type:'DELETE_EMERGENCY',id }),
  addFab:           p   => ({ type:'ADD_FAB_ITEM',    payload:p }),
  updateFab:       (id,p)=>({ type:'UPDATE_FAB_ITEM', id, payload:p }),
  deleteFab:        id  => ({ type:'DELETE_FAB_ITEM', id }),
  addAv:            p   => ({ type:'ADD_AV_ITEM',    payload:p }),
  updateAv:        (id,p)=>({ type:'UPDATE_AV_ITEM', id, payload:p }),
  deleteAv:         id  => ({ type:'DELETE_AV_ITEM', id }),
  addTalent:        p   => ({ type:'ADD_TALENT',    payload:p }),
  updateTalent:    (id,p)=>({ type:'UPDATE_TALENT', id, payload:p }),
  deleteTalent:     id  => ({ type:'DELETE_TALENT', id }),
  addGuest:         p   => ({ type:'ADD_GUEST',    payload:p }),
  updateGuest:     (id,p)=>({ type:'UPDATE_GUEST', id, payload:p }),
  deleteGuest:      id  => ({ type:'DELETE_GUEST', id }),
  addContent:       p   => ({ type:'ADD_CONTENT',    payload:p }),
  updateContent:   (id,p)=>({ type:'UPDATE_CONTENT', id, payload:p }),
  deleteContent:    id  => ({ type:'DELETE_CONTENT', id }),
  addShot:          p   => ({ type:'ADD_SHOT',    payload:p }),
  updateShot:      (id,p)=>({ type:'UPDATE_SHOT', id, payload:p }),
  deleteShot:       id  => ({ type:'DELETE_SHOT', id }),
  addSocial:        p   => ({ type:'ADD_SOCIAL',    payload:p }),
  updateSocial:    (id,p)=>({ type:'UPDATE_SOCIAL', id, payload:p }),
  deleteSocial:     id  => ({ type:'DELETE_SOCIAL', id }),
  addMenuItem:      p   => ({ type:'ADD_MENU_ITEM',    payload:p }),
  updateMenuItem:  (id,p)=>({ type:'UPDATE_MENU_ITEM', id, payload:p }),
  deleteMenuItem:   id  => ({ type:'DELETE_MENU_ITEM', id }),
  addDietary:       p   => ({ type:'ADD_DIETARY',    payload:p }),
  updateDietary:   (id,p)=>({ type:'UPDATE_DIETARY', id, payload:p }),
  deleteDietary:    id  => ({ type:'DELETE_DIETARY', id }),
  addSeating:       p   => ({ type:'ADD_SEATING',    payload:p }),
  updateSeating:   (id,p)=>({ type:'UPDATE_SEATING', id, payload:p }),
  deleteSeating:    id  => ({ type:'DELETE_SEATING', id }),
  updateHospitality:p   => ({ type:'UPDATE_HOSPITALITY', payload:p }),
  updateFlorals:    p   => ({ type:'UPDATE_FLORALS',  payload:p }),
  addTablescapeItem:p   => ({ type:'ADD_TABLESCAPE_ITEM',    payload:p }),
  updateTablescapeItem:(id,p)=>({type:'UPDATE_TABLESCAPE_ITEM',id,payload:p}),
  deleteTablescapeItem:id=>({type:'DELETE_TABLESCAPE_ITEM',id}),
  updateTablescape: p   => ({ type:'UPDATE_TABLESCAPE', payload:p }),
  updateCreative:   p   => ({ type:'UPDATE_CREATIVE',       payload:p }),
  addShopping:      p   => ({ type:'ADD_SHOPPING',    payload:p }),
  updateShopping:  (id,p)=>({ type:'UPDATE_SHOPPING', id, payload:p }),
  deleteShopping:   id  => ({ type:'DELETE_SHOPPING', id }),
  addFile:          p   => ({ type:'ADD_FILE',    payload:p }),
  deleteFile:       id  => ({ type:'DELETE_FILE', id }),
  toggleDay1:       id  => ({ type:'TOGGLE_DAY1', id }),
  updateDebrief:    p   => ({ type:'UPDATE_DEBRIEF', payload:p }),
  logActivity:      p   => ({ type:'LOG_ACTIVITY', payload:{ id:`al${Date.now()}`, timestamp:new Date().toISOString(), ...p } }),
  addProjectNote:   p   => ({ type:'ADD_PROJECT_NOTE',    payload:{ id:`pn${Date.now()}`, timestamp:new Date().toISOString(), pinned:false, ...p } }),
  updateProjectNote:p   => ({ type:'UPDATE_PROJECT_NOTE', payload:p }),
  deleteProjectNote:p   => ({ type:'DELETE_PROJECT_NOTE', payload:p }),
  pinProjectNote:   p   => ({ type:'PIN_PROJECT_NOTE',    payload:p }),
  addDeliverableComment:  (id,p) => ({ type:'ADD_DELIVERABLE_COMMENT',    id, payload:{ id:`dc${Date.now()}`, timestamp:new Date().toISOString(), ...p } }),
  deleteDeliverableComment:(id,p)=> ({ type:'DELETE_DELIVERABLE_COMMENT', id, payload:p }),

  // Page comments — scoped per project + page
  purgeProjectData:  p   => ({ type:'PURGE_PROJECT_DATA',   payload:p }),
  addPageComment:    p   => ({ type:'ADD_PAGE_COMMENT',    payload:{ id:`pc${Date.now()}`, timestamp:new Date().toISOString(), mentions:[], ...p } }),
  deletePageComment: p   => ({ type:'DELETE_PAGE_COMMENT', payload:p }),
  editPageComment:   p   => ({ type:'EDIT_PAGE_COMMENT',   payload:p }),

  // Notifications
  addNotification:           p  => ({ type:'ADD_NOTIFICATION',           payload:{ id:`notif${Date.now()}`, timestamp:new Date().toISOString(), read:false, ...p } }),
  markNotificationRead:      p  => ({ type:'MARK_NOTIFICATION_READ',      payload:p }),
  markPageNotificationsRead: p  => ({ type:'MARK_PAGE_NOTIFICATIONS_READ', payload:p }),
  markAllNotificationsRead:  () => ({ type:'MARK_ALL_NOTIFICATIONS_READ' }),
  deleteNotification:        p  => ({ type:'DELETE_NOTIFICATION',        payload:p }),
}
