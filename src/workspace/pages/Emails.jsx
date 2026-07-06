import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalState } from '../../useLocalState.js'

/* ─── FIELD multi-update analysis ───────────────────────────────────────── */

const MULTI_UPDATE_THREAD = {
  id: 'tm1',
  category: 'client',
  participants: ['Apple Events Team', 'Teekay Kong'],
  from: 'Apple Events Team',
  fromEmail: 'events@apple.com',
  subject: 'Final logistics confirmation',
  preview: 'Great call today. We\'ve confirmed venue access at 7:00 AM July 14. Encore revised AV quote to $22,400. Shop drawings Round 2 attached for approval. Guest count is now 112. Florist requests 8:00 AM load-in.',
  timestamp: 'Today, 2:14 PM',
  date: 'Jul 3',
  count: 1,
  unread: true,
  priority: 'high',
  tags: ['Client', 'Multi-update'],
  attachments: [
    { name: 'ShopDrawings_R2_Final.pdf', size: '6.1 MB', type: 'pdf' },
    { name: 'Encore_Quote_Rev4.pdf', size: '540 KB', type: 'pdf' },
  ],
  intelligence: {
    type: 'multi',
    label: 'FIELD detected 5 project updates',
    detail: 'This email contains updates across Timeline, Budget, Fabrication, Guest Count, and Vendor scheduling.',
    action: 'Review updates',
    actionId: 'multi-tm1',
  },
  messages: [
    {
      from: 'Apple Events Team',
      time: 'Jul 3, 2:14 PM',
      body: `Hi Teekay,

Great call today.

We've confirmed that venue access will begin at 7:00 AM on July 14.

Encore has revised their AV quote after removing the confidence monitors. The new total is $22,400.

Attached are the updated shop drawings for Round 2. We'd appreciate approval by Friday so fabrication can begin.

Guest count is now 112 instead of 108.

Our florist also asked if they can move their load-in from 9:00 AM to 8:00 AM.

Thanks!`,
      attachments: ['ShopDrawings_R2_Final.pdf', 'Encore_Quote_Rev4.pdf'],
    },
  ],
}

// The 5 detected updates from the above thread
const DETECTED_UPDATES = [
  {
    id: 'u1',
    category: 'timeline',
    categoryLabel: 'Timeline',
    icon: '◎',
    color: '#5B5FEF',
    bg: 'rgba(91,95,239,0.07)',
    title: 'Venue access confirmed',
    detected: 'July 14 · 7:00 AM start',
    detail: 'Venue access begins July 14 at 7:00 AM. Add as a load-in milestone on the Timeline.',
    evidence: '"We\'ve confirmed that venue access will begin at 7:00 AM on July 14."',
    confidence: 'high',
    action: 'Add to Timeline',
    editFields: [
      { label: 'Date', value: 'July 14, 2026' },
      { label: 'Time', value: '7:00 AM' },
      { label: 'Label', value: 'Venue access · Load-in begins' },
    ],
    preSelected: true,
    applied: false,
    appliedLabel: 'Added to Timeline',
  },
  {
    id: 'u2',
    category: 'budget',
    categoryLabel: 'Budget',
    icon: '◉',
    color: 'var(--signal-green-text)',
    bg: 'var(--signal-green-bg)',
    title: 'Encore AV quote revised',
    detected: '$22,400 total · down from $31,200',
    detail: 'Encore revised their AV quote after removing confidence monitors. Previous mocked budget line: $31,200.',
    evidence: '"Encore has revised their AV quote after removing the confidence monitors. The new total is $22,400."',
    confidence: 'high',
    action: 'Update Budget',
    editFields: [
      { label: 'Vendor', value: 'Encore AV' },
      { label: 'New total', value: '$22,400' },
      { label: 'Previous', value: '$31,200' },
    ],
    preSelected: true,
    applied: false,
    appliedLabel: 'Budget line updated',
  },
  {
    id: 'u3',
    category: 'fabrication',
    categoryLabel: 'Fabrication',
    icon: '◧',
    color: 'var(--ink-600)',
    bg: 'var(--ground-dim)',
    title: 'Shop drawings Round 2 received',
    detected: 'Attachment detected · Ready for approval',
    detail: 'Round 2 shop drawings attached. Client requests approval by Friday to release fabrication.',
    evidence: '"Attached are the updated shop drawings for Round 2. We\'d appreciate approval by Friday so fabrication can begin."',
    confidence: 'high',
    action: 'Mark Ready for Approval',
    editFields: [
      { label: 'Item', value: 'Shop Drawings · Round 2' },
      { label: 'New status', value: 'Ready for Approval' },
      { label: 'Deadline', value: 'Friday, Jul 5' },
    ],
    preSelected: true,
    applied: false,
    appliedLabel: 'Moved to Ready for Approval',
  },
  {
    id: 'u4',
    category: 'guests',
    categoryLabel: 'Guest Count',
    icon: '◑',
    color: 'var(--signal-blue-text)',
    bg: 'var(--signal-blue-bg)',
    title: 'Guest count updated',
    detected: '112 guests · was 108',
    detail: 'Guest count increased from 108 to 112. Update project settings and flag F&B for adjustment.',
    evidence: '"Guest count is now 112 instead of 108."',
    confidence: 'high',
    action: 'Update Guest Count',
    editFields: [
      { label: 'New count', value: '112' },
      { label: 'Previous', value: '108' },
      { label: 'Delta', value: '+4 guests' },
    ],
    preSelected: true,
    applied: false,
    appliedLabel: 'Guest count updated to 112',
  },
  {
    id: 'u5',
    category: 'vendor',
    categoryLabel: 'Vendor Schedule',
    icon: '◈',
    color: 'var(--signal-amber-text)',
    bg: 'var(--signal-amber-bg)',
    title: 'Florist load-in time changed',
    detected: '8:00 AM · was 9:00 AM',
    detail: 'Florist requesting earlier load-in slot. Verify no conflict with other vendors arriving at 8:00 AM.',
    evidence: '"Our florist also asked if they can move their load-in from 9:00 AM to 8:00 AM."',
    confidence: 'medium',
    action: 'Update Load-in Schedule',
    editFields: [
      { label: 'Vendor', value: 'Florist (Floral Theory)' },
      { label: 'New time', value: '8:00 AM' },
      { label: 'Previous', value: '9:00 AM' },
    ],
    preSelected: false,
    applied: false,
    appliedLabel: 'Florist load-in updated to 8:00 AM',
  },
]

/* ─── Rich mock data ───────────────────────────────────────────────────── */

const MOCK_THREADS = [
  MULTI_UPDATE_THREAD,
  {
    id: 't1',
    category: 'client',
    participants: ['Apple Events Team', 'Jessica Brown', 'Dana Ericson'],
    from: 'Apple Events Team',
    fromEmail: 'events@apple.com',
    subject: 'Venue access + load-in confirmation — Jul 14',
    preview: 'Confirmed: venue access begins 7:00 AM on July 14. Dock A reserved. COI approved by building. All vendor access passes have been processed.',
    timestamp: 'Today, 4:22 PM',
    date: 'Jul 1',
    count: 46,
    unread: false,
    priority: 'high',
    tags: ['Venue', 'Load-in'],
    attachments: [
      { name: 'Venue_Access_Confirmation.pdf', size: '284 KB', type: 'pdf' },
      { name: 'Dock_A_Reservation.pdf', size: '91 KB', type: 'pdf' },
    ],
    intelligence: {
      type: 'timeline',
      label: 'Timeline update detected',
      detail: 'Venue access confirmed Jul 14, 7:00 AM. Add to load-in timeline?',
      action: 'Add to Timeline',
      actionId: 'add-loadIn-jul14',
    },
    messages: [
      { from: 'Apple Events Team', time: 'Jul 1, 4:22 PM', body: 'Hi team — confirming venue access begins 7:00 AM July 14. Dock A is reserved under CAPE Creative. The COI has been approved by the building. All vendor access passes have been processed and will be sent under separate cover. Please confirm receipt and let us know if any additional names need to be added.' , attachments: ['Venue_Access_Confirmation.pdf','Dock_A_Reservation.pdf'] },
      { from: 'Jessica Brown', time: 'Jul 1, 5:05 PM', body: 'Confirmed on our end. We\'ll have the full vendor list to you by end of day Friday. Are there any restrictions on the freight elevator during peak hours?' , attachments: [] },
      { from: 'Apple Events Team', time: 'Jul 1, 5:41 PM', body: 'Freight elevator is available 7AM–6PM only. After that you\'ll need to use the passenger elevators — 54" wide max. Let us know if that\'s an issue for any of your pieces.' , attachments: [] },
    ],
  },
  {
    id: 't2',
    category: 'vendor',
    participants: ['PINCH Food Design', 'Brett Weinstein'],
    from: 'Yannick Benjamin',
    fromEmail: 'yannick@pinchfooddesign.com',
    subject: 'Tasting menu proposals — 3 concepts + pricing breakdown',
    preview: 'Attached are three tasting concepts at different price points. Concept B is closest to your brief. Production starts 6 weeks out so we need a decision by July 8.',
    timestamp: 'Jun 28, 11:08 AM',
    date: 'Jun 28',
    count: 12,
    unread: true,
    priority: 'high',
    tags: ['F&B', 'Decision needed'],
    attachments: [
      { name: 'PINCH_ConceptA_Proposal.pdf', size: '2.1 MB', type: 'pdf' },
      { name: 'PINCH_ConceptB_Proposal.pdf', size: '1.8 MB', type: 'pdf' },
      { name: 'PINCH_ConceptC_Proposal.pdf', size: '2.4 MB', type: 'pdf' },
      { name: 'Pricing_Breakdown_2026.xlsx', size: '145 KB', type: 'xlsx' },
    ],
    intelligence: {
      type: 'vendor',
      label: 'Vendor proposal received',
      detail: 'PINCH Food Design sent 3 proposals. Link to Vendors page and flag for decision by Jul 8?',
      action: 'Link to Vendors',
      actionId: 'link-vendor-pinch',
    },
    messages: [
      { from: 'Yannick Benjamin', time: 'Jun 28, 11:08 AM', body: 'Hi Brett — we\'ve put together three concept directions based on our conversation. Concept B is the closest to what you described: a tasting journey that feels like a meal at a three-Michelin-star restaurant but moves at event pace. Production timeline is 6 weeks minimum, so we\'d need a final decision by July 8 at the latest to hit your event date.', attachments: ['PINCH_ConceptA_Proposal.pdf','PINCH_ConceptB_Proposal.pdf','PINCH_ConceptC_Proposal.pdf','Pricing_Breakdown_2026.xlsx'] },
      { from: 'Brett Weinstein', time: 'Jun 28, 2:30 PM', body: 'Yannick — thank you, these look incredible. I\'m sharing with the client today. Quick question on Concept B: can we do a kosher-compliant version of the lamb course, or would that require a full menu restructure?', attachments: [] },
    ],
  },
  {
    id: 't3',
    category: 'vendor',
    participants: ['Encore AV', 'Dana Ericson'],
    from: 'Marcus Chen',
    fromEmail: 'marcus@encoreav.com',
    subject: 'AV quote Rev. 3 — LED wall adjusted, $22,400 total',
    preview: 'Per your feedback we\'ve pulled the confidence monitors and downgraded to the 3.9mm pixel pitch LED. New total is $22,400. This is our best-and-final.',
    timestamp: 'Jun 30, 2:41 PM',
    date: 'Jun 30',
    count: 27,
    unread: false,
    priority: 'medium',
    tags: ['AV/Tech', 'Budget'],
    attachments: [
      { name: 'Encore_Quote_Rev3_FINAL.pdf', size: '612 KB', type: 'pdf' },
    ],
    intelligence: {
      type: 'budget',
      label: 'Budget line change detected',
      detail: 'AV total updated to $22,400 (was $31,200). Update AV line in Budget?',
      action: 'Update Budget',
      actionId: 'update-budget-av',
    },
    messages: [
      { from: 'Marcus Chen', time: 'Jun 28, 10:14 AM', body: 'Dana — following up on your notes. We pulled the confidence monitors and switched to the 3.9mm pixel pitch on the LED wall. It\'s a step down in resolution but still stunning at your room depth. New all-in is $22,400. I\'ve attached the revised quote. This is our best-and-final — we\'re holding the inventory through July 5.', attachments: ['Encore_Quote_Rev3_FINAL.pdf'] },
      { from: 'Dana Ericson', time: 'Jun 28, 3:55 PM', body: 'Marcus, thank you. Getting client sign-off today and will circle back before EOD.', attachments: [] },
    ],
  },
  {
    id: 't4',
    category: 'team',
    participants: ['Jessica Brown', 'Brett Weinstein', 'Dana Ericson', 'Teekay Kong'],
    from: 'Jessica Brown',
    fromEmail: 'jessica@capecreative.co',
    subject: 'Pre-pro checklist — everyone review before Fri client call',
    preview: 'Please review the attached pre-pro checklist before Friday 10AM. Two open items: final headcount confirmation and Eventmakers shop drawing sign-off are both blocking.',
    timestamp: 'Today, 9:15 AM',
    date: 'Jul 2',
    count: 14,
    unread: true,
    priority: 'high',
    tags: ['Internal', 'Action required'],
    attachments: [
      { name: 'Pre-Pro_Checklist_v4.pdf', size: '340 KB', type: 'pdf' },
    ],
    intelligence: {
      type: 'approval',
      label: '2 blocking items identified',
      detail: 'Headcount confirmation and shop drawing sign-off are both blocking. Add to approvals?',
      action: 'Add to Approvals',
      actionId: 'add-approvals-blocking',
    },
    messages: [
      { from: 'Jessica Brown', time: 'Jul 2, 9:15 AM', body: 'Team — quick heads up before the Friday call. Two items are actively blocking: (1) final headcount confirmation from Apple is due by end of day Thursday, and (2) we still need shop drawing sign-off from Eventmakers. Brett, can you own the Eventmakers thread? Dana, can you push the client contact on headcount? I\'ve attached the full checklist — everyone please review by Thursday COB.', attachments: ['Pre-Pro_Checklist_v4.pdf'] },
      { from: 'Brett Weinstein', time: 'Jul 2, 9:45 AM', body: 'On it. I\'ll call Tom at Eventmakers directly — email hasn\'t been moving fast enough.', attachments: [] },
      { from: 'Dana Ericson', time: 'Jul 2, 10:02 AM', body: 'Already on a text thread with the Apple contact. Should have headcount by noon.', attachments: [] },
    ],
  },
  {
    id: 't5',
    category: 'vendor',
    participants: ['Eventmakers NYC', 'Brett Weinstein'],
    from: 'Tom Seidel',
    fromEmail: 'tom@eventmakers.com',
    subject: 'Shop drawings — Round 2 for approval',
    preview: 'Revised drawings incorporate all your notes from last week. Main entrance archway height increased to 12\'6". Ready for sign-off to move into fabrication.',
    timestamp: 'Jun 27, 5:33 PM',
    date: 'Jun 27',
    count: 21,
    unread: false,
    priority: 'high',
    tags: ['Fabrication', 'Approval needed'],
    attachments: [
      { name: 'ShopDrawings_R2_MainEntrance.pdf', size: '4.2 MB', type: 'pdf' },
      { name: 'ShopDrawings_R2_BarUnit.pdf', size: '3.8 MB', type: 'pdf' },
      { name: 'ShopDrawings_R2_FlowerWall.pdf', size: '2.9 MB', type: 'pdf' },
    ],
    intelligence: {
      type: 'fabrication',
      label: 'Fabrication approval needed',
      detail: 'Round 2 drawings ready for sign-off. Mark Fabrication item as "Drawings Approved"?',
      action: 'Update Fabrication',
      actionId: 'update-fab-drawings',
    },
    messages: [
      { from: 'Tom Seidel', time: 'Jun 27, 5:33 PM', body: 'Brett — here\'s Round 2. Main changes: entrance archway height up to 12\'6" as requested, bar unit depth reduced by 4" to improve flow, flower wall now has integrated water supply line concealed in the base structure. We\'re ready to move into fabrication the moment we get sign-off. Holding the fabrication bay for you through June 30.', attachments: ['ShopDrawings_R2_MainEntrance.pdf','ShopDrawings_R2_BarUnit.pdf','ShopDrawings_R2_FlowerWall.pdf'] },
      { from: 'Brett Weinstein', time: 'Jun 27, 6:12 PM', body: 'Looking good, Tom. Two small things: can the flower wall base be stained rather than painted? And I need to confirm the archway clearance with the venue before final sign-off — should have that for you Monday morning.', attachments: [] },
    ],
  },
  {
    id: 't6',
    category: 'vendor',
    participants: ['Glasshouse Catering', 'Jessica Brown'],
    from: 'Nina Hartwell',
    fromEmail: 'nina@glasshouse.nyc',
    subject: 'Confirmed menu + full dietary breakdown',
    preview: 'Attached is the finalized menu with all 23 dietary accommodations mapped to guests. Vegan, kosher, and severe nut allergy guests are flagged separately.',
    timestamp: 'Jul 1, 1:17 PM',
    date: 'Jul 1',
    count: 15,
    unread: false,
    priority: 'medium',
    tags: ['F&B', 'Confirmed'],
    attachments: [
      { name: 'Final_Menu_Jul16.pdf', size: '890 KB', type: 'pdf' },
      { name: 'Dietary_Breakdown_Guestlist.xlsx', size: '210 KB', type: 'xlsx' },
    ],
    intelligence: null,
    messages: [
      { from: 'Nina Hartwell', time: 'Jul 1, 1:17 PM', body: 'Jessica — attaching the finalized menu and the dietary accommodation breakdown tied to your guest list. 23 accommodations total: 4 vegan, 2 kosher (full), 6 gluten-free, 11 general dietary notes. I\'ve flagged the 3 severe nut allergy guests separately — they\'ll receive completely separate plates from a dedicated station. Please confirm receipt and let me know if anything needs adjusting before we lock for service.', attachments: ['Final_Menu_Jul16.pdf','Dietary_Breakdown_Guestlist.xlsx'] },
      { from: 'Jessica Brown', time: 'Jul 1, 2:05 PM', body: 'Nina, perfect — exactly what we needed. Confirming receipt. Will send you any last-minute dietary changes from RSVPs by July 10.', attachments: [] },
    ],
  },
  {
    id: 't7',
    category: 'vendor',
    participants: ['Floral Theory', 'Dana Ericson'],
    from: 'Cassandra Lowe',
    fromEmail: 'cassandra@floraltheory.co',
    subject: 'Install estimate + flower order cutoff — Jul 9',
    preview: 'Install crew arriving 8AM Jul 15. Full flower order must be confirmed by July 9 or we risk losing Dutch stock on the peonies and garden roses.',
    timestamp: 'Jun 29, 3:20 PM',
    date: 'Jun 29',
    count: 8,
    unread: false,
    priority: 'medium',
    tags: ['Florals', 'Deadline'],
    attachments: [
      { name: 'FloralTheory_Install_Estimate.pdf', size: '420 KB', type: 'pdf' },
    ],
    intelligence: {
      type: 'timeline',
      label: 'Hard deadline detected',
      detail: 'Flower order must be confirmed by Jul 9. Add deadline to timeline?',
      action: 'Add to Timeline',
      actionId: 'add-deadline-florals-jul9',
    },
    messages: [
      { from: 'Cassandra Lowe', time: 'Jun 29, 3:20 PM', body: 'Dana — install crew is booked for 8AM July 15. To guarantee the Dutch peonies and garden roses, I need the full flower order confirmed by July 9. After that we\'re at the mercy of what\'s available at market. Attached is the full install estimate with itemized breakdown.', attachments: ['FloralTheory_Install_Estimate.pdf'] },
      { from: 'Dana Ericson', time: 'Jun 29, 4:45 PM', body: 'Noted on July 9 — I have it in the calendar. Will confirm the final order quantities once we lock guest count.', attachments: [] },
    ],
  },
]

/* ─── Category config ────────────────────────────────────────────────────── */

const CATEGORIES = {
  client:  { label:'Client',    color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  },
  vendor:  { label:'Vendor',    color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' },
  team:    { label:'Team',      color:'var(--ink-500)',           bg:'var(--ground-dim)'      },
  venue:   { label:'Venue',     color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' },
}

const INTEL_COLORS = {
  timeline:    { icon:'◎', color:'#5B5FEF', bg:'rgba(91,95,239,0.07)' },
  vendor:      { icon:'◈', color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' },
  budget:      { icon:'◉', color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' },
  fabrication: { icon:'◧', color:'var(--ink-600)', bg:'var(--ground-dim)' },
  approval:    { icon:'◐', color:'var(--signal-red-text)', bg:'rgba(180,40,40,0.06)' },
  multi:       { icon:'⚡', color:'var(--ink-900)', bg:'var(--ground-dim)' },
}

const PRIORITY_DOT = {
  high:   'var(--signal-red-dot)',
  medium: 'var(--signal-amber-dot)',
  low:    'var(--signal-green-dot)',
}

const ATTACH_ICON = { pdf:'PDF', xlsx:'XLS', jpg:'IMG', png:'IMG' }

/* ─── Components ─────────────────────────────────────────────────────────── */

function CategoryPill({ category }) {
  const c = CATEGORIES[category] || CATEGORIES.team
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
      padding:'2px 8px', borderRadius:2, background:c.bg, color:c.color, flexShrink:0 }}>
      {c.label}
    </span>
  )
}

function TagPill({ label }) {
  return (
    <span style={{ fontSize:10, fontWeight:500, color:'var(--ink-400)',
      padding:'2px 7px', borderRadius:2, border:'1px solid var(--border)',
      background:'transparent', flexShrink:0 }}>
      {label}
    </span>
  )
}

function AttachBadge({ attach }) {
  const ext = attach.name.split('.').pop().toLowerCase()
  const label = ATTACH_ICON[ext] || ext.toUpperCase()
  return (
    <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.08em', color:'var(--ink-400)',
      padding:'2px 5px', borderRadius:2, border:'1px solid var(--border-med)',
      background:'var(--ground-dim)', fontFamily:'var(--font)' }}>
      {label}
    </span>
  )
}

function IntelBanner({ intel, onConfirm, onDismiss }) {
  if (!intel) return null
  const c = INTEL_COLORS[intel.type] || INTEL_COLORS.timeline
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
      borderRadius:'var(--r-sm)', border:`1px solid ${c.color}22`,
      background:c.bg, marginBottom:8 }}>
      <span style={{ fontSize:18, color:c.color, flexShrink:0 }}>{c.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:11, fontWeight:700, color:c.color, letterSpacing:'0.06em',
          textTransform:'uppercase', marginBottom:2 }}>{intel.label}</p>
        <p style={{ fontSize:12, color:'var(--ink-600)' }}>{intel.detail}</p>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <button onClick={onConfirm}
          style={{ fontSize:11, fontWeight:700, padding:'5px 14px', borderRadius:3,
            background:c.color, color:'white', border:'none',
            cursor:'pointer', fontFamily:'var(--font)', letterSpacing:'0.04em' }}>
          {intel.action}
        </button>
        <button onClick={onDismiss}
          style={{ fontSize:11, color:'var(--ink-400)', background:'none',
            border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

function ThreadRow({ thread, onClick, active }) {
  const [hov, setHov] = useState(false)
  const hasPriority = thread.priority === 'high'
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onClick(thread)}
      style={{ padding:'14px 20px', cursor:'pointer', transition:'background 0.1s',
        background: active ? 'var(--ground-dim)' : hov ? 'rgba(0,0,0,0.018)' : 'transparent',
        borderLeft: active ? '2px solid var(--ink-900)' : '2px solid transparent',
      }}>

      {/* Row 1: from + meta */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
        {/* Priority / unread dot */}
        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
          background: thread.unread ? 'var(--ink-900)' : hasPriority && !thread.unread ? 'var(--signal-amber-dot)' : 'transparent',
          border: !thread.unread && !hasPriority ? '1.5px solid var(--border-med)' : 'none' }}/>

        <p style={{ fontSize:13, fontWeight: thread.unread ? 700 : 600, color:'var(--ink-900)',
          flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {thread.from}
        </p>

        <CategoryPill category={thread.category}/>

        <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0, fontVariantNumeric:'tabular-nums' }}>
          {thread.date}
        </p>
      </div>

      {/* Row 2: subject */}
      <div style={{ paddingLeft:15, marginBottom:4 }}>
        <p style={{ fontSize:13, fontWeight: thread.unread ? 600 : 400, color:'var(--ink-800)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {thread.subject}
          <span style={{ marginLeft:8, fontSize:11, color:'var(--ink-300)', fontWeight:400 }}>
            ({thread.count})
          </span>
        </p>
      </div>

      {/* Row 3: preview */}
      <div style={{ paddingLeft:15, marginBottom:6 }}>
        <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.5,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {thread.preview}
        </p>
      </div>

      {/* Row 4: tags + attachments */}
      <div style={{ paddingLeft:15, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
        {thread.tags.map(t => <TagPill key={t} label={t}/>)}
        {thread.attachments?.length || 0 > 0 && (
          <span style={{ fontSize:11, color:'var(--ink-300)', marginLeft:4 }}>
            {thread.attachments?.length || 0} file{thread.attachments?.length || 0 !== 1 ? 's' : ''}
          </span>
        )}
        {thread.intelligence && (
          <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700,
            color: INTEL_COLORS[thread.intelligence.type]?.color || 'var(--ink-400)',
            letterSpacing:'0.06em', textTransform:'uppercase' }}>
            ⚡ {thread.intelligence.label}
          </span>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isInternal = ['Jessica Brown','Brett Weinstein','Dana Ericson','Teekay Kong'].includes(msg.from)
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <p style={{ fontSize:12, fontWeight:700, color: isInternal ? 'var(--ink-900)' : 'var(--ink-700)' }}>
          {msg.from}
          {isInternal && <span style={{ marginLeft:6, fontSize:10, fontWeight:600, color:'var(--signal-blue-text)',
            letterSpacing:'0.07em', textTransform:'uppercase', background:'var(--signal-blue-bg)',
            padding:'1px 6px', borderRadius:2 }}>CAPE</span>}
        </p>
        <p style={{ fontSize:11, color:'var(--ink-300)' }}>{msg.time}</p>
      </div>
      <div style={{ background: isInternal ? 'rgba(91,95,239,0.05)' : 'var(--ground-dim)',
        border: isInternal ? '1px solid rgba(91,95,239,0.15)' : '1px solid var(--border)',
        borderRadius:'var(--r-sm)', padding:'12px 14px' }}>
        <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.65 }}>{msg.body}</p>
        {msg.attachments?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10, paddingTop:10,
            borderTop:'1px solid var(--border)' }}>
            {msg.attachments.map(a => (
              <div key={a} style={{ display:'flex', alignItems:'center', gap:6,
                padding:'5px 10px', background:'var(--surface)',
                borderRadius:3, border:'1px solid var(--border)',
                fontSize:12, color:'var(--ink-600)', cursor:'default' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--ink-400)',
                  letterSpacing:'0.06em' }}>
                  {a.split('.').pop().toUpperCase()}
                </span>
                {a}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Multi-update review panel ─────────────────────────────────────────── */

const CONF_LABEL = { high:'High confidence', medium:'Medium confidence', low:'Low confidence' }
const CONF_COLOR = { high:'var(--signal-green-text)', medium:'var(--signal-amber-text)', low:'var(--ink-400)' }
const CONF_DOT   = { high:'var(--signal-green-dot)', medium:'var(--signal-amber-dot)', low:'var(--border-med)' }

function UpdateCard({ update, selected, onToggle, onDismiss, appliedIds, editingId, onEditToggle, editValues, onEditChange }) {
  const isApplied  = appliedIds.has(update.id)
  const isEditing  = editingId === update.id
  const isDismissed = appliedIds.has('dismiss_' + update.id)

  if (isDismissed) return null

  return (
    <div style={{ border:`1px solid ${isApplied ? 'var(--signal-green-dot)' : selected ? update.color + '55' : 'var(--border)'}`,
      borderRadius:'var(--r-sm)', overflow:'hidden', opacity: isApplied ? 0.7 : 1,
      transition:'all 0.15s' }}>

      {/* Card header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px',
        background: isApplied ? 'var(--signal-green-bg)' : selected ? update.bg : 'var(--surface)',
        cursor: isApplied ? 'default' : 'pointer' }}
        onClick={() => !isApplied && onToggle(update.id)}>

        {/* Checkbox */}
        <div style={{ width:18, height:18, borderRadius:3, flexShrink:0, marginTop:1,
          border:`2px solid ${isApplied ? 'var(--signal-green-dot)' : selected ? update.color : 'var(--border-med)'}`,
          background: isApplied || selected ? (isApplied ? 'var(--signal-green-dot)' : update.color) : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {(selected || isApplied) && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Icon + category */}
        <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{update.icon}</span>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
              color: update.color, padding:'2px 7px', borderRadius:2,
              background: update.bg, border:`1px solid ${update.color}33` }}>
              {update.categoryLabel}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: CONF_DOT[update.confidence] }}/>
              <span style={{ fontSize:10, color: CONF_COLOR[update.confidence], fontWeight:600 }}>
                {CONF_LABEL[update.confidence]}
              </span>
            </div>
            {isApplied && (
              <span style={{ fontSize:11, color:'var(--signal-green-text)', fontWeight:700, marginLeft:'auto' }}>
                ✓ {update.appliedLabel}
              </span>
            )}
          </div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{update.title}</p>
          <p style={{ fontSize:12, color:'var(--ink-600)' }}>{update.detected}</p>
        </div>

        {/* Actions */}
        {!isApplied && (
          <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onEditToggle(update.id)}
              style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:3,
                border:'1px solid var(--border-med)', background:'transparent',
                color:'var(--ink-500)', cursor:'pointer', fontFamily:'var(--font)' }}>
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <button onClick={() => onDismiss('dismiss_' + update.id)}
              style={{ fontSize:11, color:'var(--ink-300)', background:'none',
                border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Evidence quote */}
      <div style={{ padding:'8px 16px 10px 46px', borderTop:'1px solid var(--border)',
        background:'rgba(0,0,0,0.015)' }}>
        <p style={{ fontSize:11, color:'var(--ink-400)', fontStyle:'italic', lineHeight:1.5 }}>
          {update.evidence}
        </p>
      </div>

      {/* Edit panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}
            style={{ overflow:'hidden', borderTop:'1px solid var(--border)',
              padding:'14px 16px', background:'var(--ground-dim)' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:10 }}>Edit before applying</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(editValues[update.id] || update.editFields).map((field, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, alignItems:'center' }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-600)' }}>{field.label}</p>
                  <input value={field.value}
                    onChange={e => onEditChange(update.id, i, e.target.value)}
                    style={{ fontSize:12, padding:'5px 8px', border:'1px solid var(--border)',
                      borderRadius:3, background:'var(--surface)', fontFamily:'var(--font)',
                      color:'var(--ink-900)', outline:'none' }}/>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MultiUpdatePanel({ thread, onClose }) {
  const [updates, setUpdates] = useState(
    DETECTED_UPDATES.map(u => ({ ...u }))
  )
  // selected = set of update IDs checked
  const [selected, setSelected]   = useState(new Set(
    DETECTED_UPDATES.filter(u => u.preSelected).map(u => u.id)
  ))
  const [appliedIds, setApplied]  = useState(new Set())
  const [editingId,  setEditing]  = useState(null)
  const [editValues, setEditVals] = useState({})
  const [allDone,    setAllDone]  = useState(false)

  const visible = updates.filter(u => !appliedIds.has('dismiss_' + u.id))
  const pending = visible.filter(u => !appliedIds.has(u.id))
  const applied = visible.filter(u =>  appliedIds.has(u.id))
  const selectedPending = pending.filter(u => selected.has(u.id))

  const toggleSelect = id => setSelected(p => {
    const n = new Set(p)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const toggleAll = () => {
    const pendingIds = pending.map(u => u.id)
    const allSelected = pendingIds.every(id => selected.has(id))
    setSelected(allSelected ? new Set() : new Set(pendingIds))
  }

  const dismiss = id => setApplied(p => new Set([...p, id]))

  const editToggle = id => setEditing(p => p === id ? null : id)

  const editChange = (uid, idx, val) => {
    setEditVals(p => {
      const fields = [...(p[uid] || DETECTED_UPDATES.find(u => u.id === uid).editFields)]
      fields[idx] = { ...fields[idx], value: val }
      return { ...p, [uid]: fields }
    })
  }

  const applySelected = () => {
    const toApply = selectedPending.map(u => u.id)
    setApplied(p => new Set([...p, ...toApply]))
    setSelected(new Set())
    if (pending.length - toApply.length === 0) setAllDone(true)
  }

  const applyOne = id => {
    setApplied(p => new Set([...p, id]))
    setSelected(p => { const n = new Set(p); n.delete(id); return n })
    if (pending.length === 1) setAllDone(true)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font)' }}>

      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>⚡</span>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                color:'var(--ink-500)' }}>Field detected {DETECTED_UPDATES.length} project updates</p>
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>
              {thread.subject}
            </p>
            <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:2 }}>
              {thread.from} · {thread.timestamp}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
              fontSize:20, lineHeight:1, padding:0, flexShrink:0 }}>×</button>
        </div>

        <p style={{ fontSize:12, color:'var(--ink-600)', lineHeight:1.55,
          padding:'10px 14px', background:'var(--ground-dim)', borderRadius:'var(--r-sm)',
          borderLeft:'3px solid var(--border-med)' }}>
          FIELD analyzed this email and found changes across {DETECTED_UPDATES.length} project areas.
          Review each update, edit values if needed, and apply the ones you approve.
          Nothing is applied automatically.
        </p>
      </div>

      {/* Update cards */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:10 }}>

        {allDone ? (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ textAlign:'center', padding:'48px 24px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>✓</div>
            <p style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>All updates applied</p>
            <p style={{ fontSize:13, color:'var(--ink-500)' }}>
              Your project has been updated. The original email thread remains attached as the source.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Applied updates (collapsed summary) */}
            {applied.length > 0 && (
              <div style={{ padding:'10px 14px', background:'var(--signal-green-bg)',
                border:'1px solid var(--signal-green-dot)', borderRadius:'var(--r-sm)', marginBottom:4 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--signal-green-text)',
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
                  ✓ Applied ({applied.length})
                </p>
                {applied.map(u => (
                  <p key={u.id} style={{ fontSize:12, color:'var(--signal-green-text)', marginBottom:2 }}>
                    {u.categoryLabel} · {u.appliedLabel}
                  </p>
                ))}
              </div>
            )}

            {/* Pending updates */}
            {pending.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                    color:'var(--ink-400)' }}>
                    Pending review · {pending.length} update{pending.length !== 1 ? 's' : ''}
                  </p>
                  <button onClick={toggleAll}
                    style={{ fontSize:11, color:'var(--ink-500)', background:'none', border:'none',
                      cursor:'pointer', fontFamily:'var(--font)', fontWeight:600 }}>
                    {pending.every(u => selected.has(u.id)) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                {pending.map(u => (
                  <UpdateCard key={u.id} update={u}
                    selected={selected.has(u.id)}
                    onToggle={toggleSelect}
                    onDismiss={dismiss}
                    appliedIds={appliedIds}
                    editingId={editingId}
                    onEditToggle={editToggle}
                    editValues={editValues}
                    onEditChange={editChange}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      {!allDone && pending.length > 0 && (
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', flexShrink:0,
          display:'flex', gap:10, alignItems:'center' }}>
          <button
            disabled={selectedPending.length === 0}
            onClick={applySelected}
            style={{ flex:1, padding:'10px 0', fontSize:12, fontWeight:700,
              letterSpacing:'0.06em', textTransform:'uppercase', borderRadius:4,
              border:'none', cursor: selectedPending.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily:'var(--font)',
              background: selectedPending.length === 0 ? 'var(--border-med)' : 'var(--ink-900)',
              color: selectedPending.length === 0 ? 'var(--ink-400)' : 'white',
              transition:'all 0.12s' }}>
            Apply selected ({selectedPending.length})
          </button>
          <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0 }}>
            or apply one by one above
          </p>
        </div>
      )}
    </div>
  )
}

function ThreadDetail({ thread, dismissed, confirmed, onDismiss, onConfirm, onClose }) {
  if (!thread) return null
  const intel = thread.intelligence
  const showIntel = intel && !dismissed.has(intel.actionId) && !confirmed.has(intel.actionId)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font)' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ flex:1, minWidth:0, marginRight:16 }}>
            <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em',
              lineHeight:1.3, marginBottom:4 }}>{thread.subject}</p>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <CategoryPill category={thread.category}/>
              <p style={{ fontSize:12, color:'var(--ink-400)' }}>
                {thread.from} · {thread.fromEmail}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
              fontSize:20, lineHeight:1, padding:0, flexShrink:0 }}>×</button>
        </div>

        {/* Participants */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>With:</p>
          {thread.participants.map(p => (
            <span key={p} style={{ fontSize:11, fontWeight:500, color:'var(--ink-600)',
              padding:'2px 8px', borderRadius:2, background:'var(--ground-dim)',
              border:'1px solid var(--border)' }}>{p}</span>
          ))}
        </div>
      </div>

      {/* Intelligence banner */}
      {showIntel && (
        <div style={{ padding:'12px 24px 0', flexShrink:0 }}>
          <IntelBanner
            intel={intel}
            onConfirm={() => onConfirm(intel.actionId)}
            onDismiss={() => onDismiss(intel.actionId)}
          />
        </div>
      )}

      {/* Attachments strip */}
      {thread.attachments?.length || 0 > 0 && (
        <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:8 }}>Attachments</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {(thread.attachments || []).map(a => (
              <div key={a.name} style={{ display:'flex', alignItems:'center', gap:7,
                padding:'6px 10px', background:'var(--ground-dim)',
                borderRadius:3, border:'1px solid var(--border)', cursor:'default' }}>
                <AttachBadge attach={a}/>
                <div>
                  <p style={{ fontSize:12, color:'var(--ink-800)', fontWeight:500 }}>{a.name}</p>
                  <p style={{ fontSize:10, color:'var(--ink-400)' }}>{a.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
          color:'var(--ink-300)', marginBottom:16 }}>
          Thread · {thread.count} messages
        </p>
        {thread.messages.map((msg, i) => <MessageBubble key={i} msg={msg}/>)}
        <div style={{ padding:'12px 14px', borderRadius:'var(--r-sm)',
          border:'1px dashed var(--border-med)', textAlign:'center' }}>
          <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>
            {thread.count - thread.messages.length} earlier messages not shown in prototype
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <p style={{ fontSize:11, color:'var(--ink-300)', fontStyle:'italic', textAlign:'center' }}>
          Prototype view — reply in Gmail to send
        </p>
      </div>
    </div>
  )
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub }) {
  return (
    <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)',
      borderRadius:'var(--r-sm)', padding:'12px 16px', minWidth:100 }}>
      <p style={{ fontSize:22, fontWeight:800, color:'var(--ink-900)', letterSpacing:'-0.02em', lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', marginTop:3 }}>{label}</p>
      {sub && <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:1 }}>{sub}</p>}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

const FILTER_TABS = ['All','Client','Vendor','Team','Unread','Attachments']

export default function Emails({ projectId, production }) {
  const storageKey = 'field_emails_' + (projectId || 'default') + '_v1'
  // Per-project threads — communications are project data, seeded with the
  // project and removed when the project is deleted. Empty account = empty inbox.
  const [threads] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('field_local_' + storageKey) || 'null')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })
  const [filter,   setFilter]   = useState('All')
  const [search,   setSearch]   = useState('')
  const [active,   setActive]   = useState(null)
  const [dismissed, setDismissed] = useState(new Set())
  const [confirmed, setConfirmed] = useState(new Set())

  const handleDismiss = id => setDismissed(p => new Set([...p, id]))
  const handleConfirm = id => setConfirmed(p => new Set([...p, id]))

  const filtered = useMemo(() => {
    let list = threads
    if (filter === 'Unread')      list = list.filter(t => t.unread)
    else if (filter === 'Attachments') list = list.filter(t => t.attachments?.length || 0 > 0)
    else if (filter !== 'All')    list = list.filter(t => t.category === filter.toLowerCase())
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.from.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }
    return list
  }, [threads, filter, search])

  // Global intelligence banner items (pending, not confirmed or dismissed)
  const pendingIntel = useMemo(() =>
    threads
      .filter(t => t.intelligence && !dismissed.has(t.intelligence.actionId) && !confirmed.has(t.intelligence.actionId))
      .map(t => t.intelligence)
  , [threads, dismissed, confirmed])

  const unreadCount = threads.filter(t => t.unread).length
  const attachCount = threads.reduce((n, t) => n + (t.attachments?.length || 0), 0)
  const intelCount  = pendingIntel.length

  return (
    <div className="page-content-wide" style={{ fontFamily:'var(--font)' }}>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:6 }}>Project · Communications</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:800,
            letterSpacing:'-0.03em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:12 }}>
            {production?.name ? production.name : 'Comms'}
          </h1>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <StatCard label="Threads" value={threads.length} sub={`${unreadCount} unread`}/>
            <StatCard label="Files" value={attachCount} sub="across all threads"/>
            {intelCount > 0 && <StatCard label="Actions" value={intelCount} sub="suggested by FIELD"/>}
          </div>
        </div>

        {/* Intelligence feed — top-level, collapsed by default */}
        {pendingIntel.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
              color:'var(--ink-400)', marginBottom:8 }}>⚡ Field intelligence</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {pendingIntel.map(intel => (
                <IntelBanner
                  key={intel.actionId}
                  intel={intel}
                  onConfirm={() => handleConfirm(intel.actionId)}
                  onDismiss={() => handleDismiss(intel.actionId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout: list + detail */}
        <div style={{ display:'flex', gap:0, border:'1px solid var(--border)',
          borderRadius:'var(--r-md)', overflow:'hidden', marginBottom:16 }}>

          {/* Left: thread list */}
          <div style={{ width: active ? 380 : '100%', flexShrink:0,
            borderRight: active ? '1px solid var(--border)' : 'none' }}>
            {/* Search + filters */}
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)',
              display:'flex', flexDirection:'column', gap:8 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search threads, vendors, topics…"
                style={{ width:'100%' }}/>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {FILTER_TABS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding:'4px 10px', borderRadius:3, fontSize:11, fontWeight:600,
                      letterSpacing:'0.04em', cursor:'pointer', fontFamily:'var(--font)',
                      border: '1px solid ' + (filter===f ? 'var(--ink-900)' : 'var(--border)'),
                      background: filter===f ? 'var(--ink-900)' : 'transparent',
                      color: filter===f ? 'white' : 'var(--ink-500)', transition:'all 0.1s' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread rows */}
            <div>
              {filtered.length === 0 ? (
                <div style={{ padding:'40px 20px', textAlign:'center' }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-500)', marginBottom:4 }}>No threads</p>
                  <p style={{ fontSize:12, color:'var(--ink-300)' }}>
                    {search ? 'Try a different search.' : 'Nothing in this filter.'}
                  </p>
                </div>
              ) : filtered.map(t => (
                <ThreadRow key={t.id} thread={t} onClick={setActive} active={active?.id === t.id}/>
              ))}
            </div>
          </div>

          {/* Right: thread detail */}
          <AnimatePresence>
            {active && (
              <motion.div key={active.id}
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.15 }}
                style={{ flex:1, minWidth:0, minHeight:600 }}>
                {active.id === 'tm1'
                  ? <MultiUpdatePanel thread={active} onClose={() => setActive(null)}/>
                  : <ThreadDetail
                      thread={active}
                      dismissed={dismissed}
                      confirmed={confirmed}
                      onDismiss={handleDismiss}
                      onConfirm={handleConfirm}
                      onClose={() => setActive(null)}
                    />
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p style={{ marginTop:16, fontSize:11, color:'var(--ink-300)', fontStyle:'italic' }}>
          Prototype · All communications are mocked. No emails are sent or received.
        </p>
      </motion.div>
    </div>
  )
}
