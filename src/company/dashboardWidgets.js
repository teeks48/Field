import { getAllProjectsWithUserCreated } from './companyData.js'

export const WIDGET_CATEGORIES = ['Project', 'Library', 'Overview']

export const WIDGET_REGISTRY = [
  // ── My Work widgets (personalized, user-aware) ──
  { id:'my-assigned-projects', label:'My Assigned Projects', category:'My Work', needsProject:false,
    desc:'Projects you are assigned to, with your DRI areas.' },
  { id:'my-dris',             label:'My DRIs',              category:'My Work', needsProject:false,
    desc:'Your project-specific DRI responsibilities, grouped by project.' },
  { id:'needs-attention',     label:'Needs My Attention',   category:'My Work', needsProject:false,
    desc:'Overdue items, pending approvals, and urgent flags on your projects.' },
  { id:'my-activity',         label:'Recent Activity',      category:'My Work', needsProject:false,
    desc:'Latest updates from projects you are assigned to.' },
  { id:'my-approvals',        label:'My Approvals',         category:'My Work', needsProject:false,
    desc:'Approvals relevant to you. Leadership sees all; others see their projects.' },

  // ── Project widgets (require a project to be selected) ──
  { id:'proj-timeline',     label:'Timeline',               category:'Project', needsProject:true,  desc:'Next milestones for a project' },
  { id:'proj-budget',       label:'Budget',                 category:'Project', needsProject:true,  desc:'Budget total vs. spend' },
  { id:'proj-team',         label:'Team',                   category:'Project', needsProject:true,  desc:'Project team roster' },
  { id:'proj-vendors',      label:'Vendors',                category:'Project', needsProject:true,  desc:'Assigned vendors snapshot' },
  { id:'proj-approvals',    label:'Approvals',              category:'Project', needsProject:true,  desc:'Pending approvals for this project' },
  { id:'proj-runofshow',    label:'Run of Show',            category:'Project', needsProject:true,  desc:'Upcoming run-of-show items' },
  { id:'proj-hospitality',  label:'Hospitality',            category:'Project', needsProject:true,  desc:'Guest experience status' },
  { id:'proj-fabrication',  label:'Fabrication',            category:'Project', needsProject:true,  desc:'Fabrication status' },
  { id:'proj-avtech',       label:'AV / Tech',              category:'Project', needsProject:true,  desc:'AV / Tech status' },
  { id:'proj-content',      label:'Content',                category:'Project', needsProject:true,  desc:'Content capture status' },
  { id:'proj-files',        label:'Files',                  category:'Project', needsProject:true,  desc:'Recently uploaded files' },
  { id:'proj-deliverables', label:'Deliverables',           category:'Project', needsProject:true,  desc:'Creative deliverables — review pipeline status' },
  { id:'proj-fulfillment',  label:'Fulfillment / Printing', category:'Project', needsProject:true,  desc:'Print and production status for approved deliverables' },

  // ── Library widgets ──
  { id:'lib-shortlist',     label:'Shortlist',              category:'Library', needsProject:false, desc:'Saved venues & vendors' },
  { id:'lib-venues',        label:'Venue Library',          category:'Library', needsProject:false, desc:'Preferred venues snapshot' },
  { id:'lib-inventory',     label:'Inventory',              category:'Library', needsProject:false, desc:'Checked-out items' },
  { id:'lib-team',          label:'Team Directory',         category:'Library', needsProject:false, desc:'Quick contact lookup' },

  // ── Overview widgets (company-wide) ──
  { id:'stat-strip',        label:'Overview Stats',         category:'Overview', needsProject:false, desc:'Key stats for your portfolio or company-wide' },
  { id:'active-projects',   label:'All Active Projects',    category:'Overview', needsProject:false, desc:'All projects currently in production' },
  { id:'deadlines',         label:'Upcoming Deadlines',     category:'Overview', needsProject:false, desc:'Deadlines within 7 days' },
  { id:'activity',          label:'All Recent Activity',    category:'Overview', needsProject:false, desc:'Latest activity across all projects' },
  { id:'approvals',         label:'All Pending Approvals',  category:'Overview', needsProject:false, desc:'Company-wide approvals queue' },
  { id:'budget-alerts',     label:'Budget Alerts',          category:'Overview', needsProject:false, desc:'Projects over budget threshold' },
]

export function getWidgetDef(widgetId) {
  return WIDGET_REGISTRY.find(w => w.id === widgetId)
}

export function getProjectById(id) {
  return getAllProjectsWithUserCreated().find(p => p.id === id)
}
