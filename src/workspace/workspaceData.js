// All workspace-level state lives here and is passed down as props

export const PRODUCTION = {
  name: 'Apple Vision Pro Executive Dinner',
  client: 'Apple',
  type: 'Executive Dinner / Brand Experience',
  location: 'Brooklyn, NY',
  venue: 'Brooklyn Tower, 73rd Floor',
  budgetTier: 'Flagship',
  budgetTotal: 1200000,
  guestCount: 120,
  eventDate: 'July 16, 2026',
  eventDateShort: 'Jul 16',
  daysOut: 20,
  currentPhase: 'Final production',
  ep: '',
  epInitials: '',
  lead: '',
  leadInitials: '',
}

export const ACTIVE_PAGES = [
  'overview', 'brief',
  'creative', 'budget', 'vendors', 'staffing', 'timeline', 'approvals',
  'logistics', 'fabrication', 'hospitality', 'av-tech', 'content', 'run-of-show',
  'debrief', 'final-files',
]

export const SIDEBAR_NAV = [
  {
    section: 'Overview',
    items: [
      { id: 'overview',    label: 'Production overview', dot: 'green' },
      { id: 'brief',       label: 'Production brief',    dot: null   },
    ],
  },
  {
    section: 'Planning',
    items: [
      { id: 'creative',    label: 'Creative',   dot: 'amber' },
      { id: 'budget',      label: 'Budget',     dot: 'green' },
      { id: 'vendors',     label: 'Vendors',    dot: 'green' },
      { id: 'staffing',    label: 'Staffing',   dot: 'green' },
      { id: 'timeline',    label: 'Timeline',   dot: 'amber' },
      { id: 'approvals',   label: 'Approvals',  dot: 'amber' },
    ],
  },
  {
    section: 'Production',
    items: [
      { id: 'logistics',   label: 'Logistics',       dot: 'green' },
      { id: 'fabrication', label: 'Fabrication',     dot: 'green' },
      { id: 'hospitality', label: 'Hospitality',     dot: 'amber' },
      { id: 'av-tech',     label: 'AV / Tech',       dot: 'green' },
      { id: 'content',     label: 'Content capture', dot: 'green' },
      { id: 'run-of-show', label: 'Run of Show',     dot: null    },
    ],
  },
  {
    section: 'Wrap',
    items: [
      { id: 'debrief',     label: 'Debrief',      dot: null },
      { id: 'final-files', label: 'Final files',  dot: null },
    ],
  },
]

export const VENDORS = [
  { id: 'v1', name: 'Ocubo Digital',         category: 'AV / Interactive', contact: 'Sara Mendes',    status: 'Awarded',   budget: '$82,000',  notes: 'LED wall + interactive touchpoints' },
  { id: 'v2', name: 'Eventmakers NYC',        category: 'Fabrication',      contact: 'Tom Ricci',      status: 'Awarded',   budget: '$145,000', notes: 'Custom dining furniture + scenic build' },
  { id: 'v3', name: 'Glasshouse Catering',   category: 'Hospitality / F&B', contact: 'Nina Park',     status: 'Awarded',   budget: '$94,000',  notes: 'Full catering, beverage, service staff' },
  { id: 'v4', name: 'Limelight Studios',     category: 'Content Capture',   contact: 'Drew Callahan', status: 'Awarded',   budget: '$28,000',  notes: 'Photography + highlight reel' },
  { id: 'v5', name: 'Brooklyn Tower Venue',  category: 'Venue',             contact: 'James Holter',  status: 'Confirmed', budget: '$55,000',  notes: '73rd floor exclusive buy-out, Jul 15–16' },
  { id: 'v6', name: 'Peak Freight',          category: 'Logistics',         contact: 'Maria Fuentes', status: 'Quoted',    budget: '$12,000',  notes: 'Load-in freight + on-site logistics team' },
  { id: 'v7', name: 'Aria Florals',          category: 'Hospitality',       contact: 'Cleo Stein',    status: 'Quoted',    budget: '$18,500',  notes: 'Table florals + entrance installation' },
]

export const STAFFING = [
  { name: 'TBD', initials: '?', role: 'Executive Producer',  department: 'Agency',      color: 'amber', callTime: '8:00 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Lead Producer',       department: 'Agency',      color: 'blue',  callTime: '7:30 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Creative Director',   department: 'Agency',      color: 'green', callTime: '9:00 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Production Manager',  department: 'Agency',      color: 'blue',  callTime: '6:00 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Tech Lead',           department: 'Agency',      color: 'ink',   callTime: '6:00 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Hospitality Lead',    department: 'Agency',      color: 'amber', callTime: '8:00 AM', status: 'Open' },
  { name: 'TBD', initials: '?', role: 'Site Coordinator',    department: 'On-site',     color: 'ink',   callTime: '7:00 AM', status: 'Open' },
  { name: 'TBD × 4',  initials: '?', role: 'Brand Ambassadors', department: 'On-site',  color: 'ink',   callTime: '4:00 PM', status: 'Open' },
  { name: 'TBD × 12', initials: '?', role: 'Service Staff',     department: 'Hospitality',color: 'ink', callTime: '4:00 PM', status: 'Open' },
]

export const BUDGET_LINES = [
  { category: 'Venue',              budgeted: 55000,  actual: 55000,  status: 'Confirmed' },
  { category: 'Fabrication',        budgeted: 145000, actual: 138000, status: 'In progress' },
  { category: 'Hospitality / F&B',  budgeted: 94000,  actual: 94000,  status: 'Confirmed' },
  { category: 'AV / Interactive',   budgeted: 82000,  actual: 79500,  status: 'In progress' },
  { category: 'Florals',            budgeted: 18500,  actual: 0,      status: 'Quoted' },
  { category: 'Content Capture',    budgeted: 28000,  actual: 28000,  status: 'Confirmed' },
  { category: 'Logistics / Freight',budgeted: 12000,  actual: 0,      status: 'Quoted' },
  { category: 'Staffing',           budgeted: 95000,  actual: 88000,  status: 'In progress' },
  { category: 'Creative & Design',  budgeted: 42000,  actual: 38000,  status: 'In progress' },
  { category: 'Permits & Insurance',budgeted: 8500,   actual: 8500,   status: 'Confirmed' },
  { category: 'Contingency (10%)',  budgeted: 120000, actual: 0,      status: '—' },
]

export const MILESTONES = [
  { label: 'Kickoff',          date: 'Jun 26', daysOut: 0,  owner: '',    status: 'Complete', done: true,  isEvent: false },
  { label: 'Creative lock',    date: 'Jul 1',  daysOut: 5,  owner: '',       status: 'Upcoming', done: false, isEvent: false, isNext: true },
  { label: 'Client approval',  date: 'Jul 3',  daysOut: 7,  owner: '',    status: 'Upcoming', done: false, isEvent: false },
  { label: 'Vendor awards',    date: 'Jul 7',  daysOut: 11, owner: '', status: 'Upcoming', done: false, isEvent: false },
  { label: 'Fab start',        date: 'Jul 9',  daysOut: 13, owner: '', status: 'Upcoming', done: false, isEvent: false },
  { label: 'Site survey',      date: 'Jul 13', daysOut: 17, owner: '',      status: 'Upcoming', done: false, isEvent: false },
  { label: 'Load-in',          date: 'Jul 15', daysOut: 19, owner: '', status: 'Upcoming', done: false, isEvent: false },
  { label: 'Event day',        date: 'Jul 16', daysOut: 20, owner: '',      status: 'Event',    done: false, isEvent: true  },
]

export const APPROVALS = [
  { item: 'Creative concept deck',         type: 'Creative',  owner: '',       approver: 'Apple Brand Team', due: 'Jul 3',  status: 'Pending' },
  { item: 'Environmental design direction',type: 'Creative',  owner: '',       approver: 'Apple Brand Team', due: 'Jul 3',  status: 'Pending' },
  { item: 'Revised budget — round 2',      type: 'Budget',    owner: '',    approver: 'Apple PMO',        due: 'Jun 30', status: 'Submitted' },
  { item: 'Fabrication vendor award',      type: 'Vendor',    owner: '', approver: 'Agency',    due: 'Jul 7',  status: 'Draft' },
  { item: 'Menu & beverage selection',     type: 'Hospitality',owner: '',  approver: 'Apple Brand Team', due: 'Jul 5',  status: 'Draft' },
  { item: 'Guest list — final',            type: 'Hospitality',owner: '',  approver: 'Apple PMO',        due: 'Jul 8',  status: 'In progress' },
]

export const LOGISTICS = {
  venue: {
    name: 'Brooklyn Tower',
    address: '9 DeKalb Ave, Brooklyn, NY 11201',
    floor: '73rd Floor',
    contact: 'James Holter, Venue Director',
    phone: '+1 718 555 0192',
    access: 'Freight elevator — use service entrance on Flatbush Ave',
    notes: 'Exclusive buy-out. No other events on floor Jul 15–16.',
  },
  loadIn: { date: 'Jul 15', startTime: '6:00 AM', endTime: '6:00 PM', crew: 'Peak Freight + Eventmakers NYC' },
  loadOut: { date: 'Jul 17', startTime: '8:00 AM', endTime: '2:00 PM', crew: 'Eventmakers NYC' },
  shipping: [
    { item: 'Scenic build elements',    from: 'Eventmakers NYC shop, Hoboken NJ', arrives: 'Jul 15, 6 AM',  status: 'Scheduled' },
    { item: 'AV equipment',             from: 'Ocubo warehouse, LIC',             arrives: 'Jul 15, 8 AM',  status: 'Scheduled' },
    { item: 'Floral installation',      from: 'Aria Florals, Williamsburg',        arrives: 'Jul 15, 4 PM',  status: 'TBC' },
    { item: 'Branded collateral',       from: 'Apple HQ via FedEx Priority',      arrives: 'Jul 14, EOD',   status: 'TBC' },
  ],
  permits: [
    { type: 'Temporary Certificate of Occupancy', issuer: 'NYC DOB',        status: 'Confirmed', expiry: 'Jul 17' },
    { type: 'General Liability COI — $5M',        issuer: 'Agency Insurer', status: 'Confirmed', expiry: 'Jul 17' },
    { type: 'Vendor COI — Eventmakers',            issuer: 'Vendor',        status: 'Confirmed', expiry: 'Jul 17' },
    { type: 'Liquor permit (one-day)',              issuer: 'NY SLA',        status: 'Pending',   expiry: 'Jul 16' },
  ],
}

export const RUN_OF_SHOW = [
  { time: '6:00 AM',  duration: '—',     owner: '', location: 'Load dock',         item: 'Freight arrival — Eventmakers NYC',                  status: 'Scheduled' },
  { time: '6:00 AM',  duration: '12h',   owner: '', location: 'Build area',        item: 'Scenic build, day 1',                                status: 'Scheduled' },
  { time: '8:00 AM',  duration: '—',     owner: '',      location: '73F event floor',   item: 'AV load-in — Ocubo Digital',                         status: 'Scheduled' },
  { time: '9:00 AM',  duration: '—',     owner: '',      location: 'Venue',             item: 'Full crew briefing',                                 status: 'Scheduled' },
  { time: '4:00 PM',  duration: '2h',    owner: '',   location: '73F event floor',   item: 'Floral installation — Aria Florals',                 status: 'TBC' },
  { time: '5:00 PM',  duration: '1h',    owner: '',      location: 'Full floor',        item: 'AV systems test and cue walkthrough',                status: 'Scheduled' },
  { time: '6:00 PM',  duration: '—',     owner: '',              location: 'Full floor',        item: 'Final site walkthrough — all departments',            status: 'Scheduled' },
  { time: 'Jul 16',   duration: '—',     owner: '',                location: '—',                 item: '— Event day —',                                     status: 'Event' },
  { time: '4:00 PM',  duration: '1h',    owner: '',   location: '73F',               item: 'Service staff briefing and table set',               status: 'Scheduled' },
  { time: '5:00 PM',  duration: '30m',   owner: '',    location: 'All positions',     item: 'All-hands final briefing',                           status: 'Scheduled' },
  { time: '6:00 PM',  duration: '30m',   owner: '',      location: 'Lobby / elevator',  item: 'Guest arrivals begin — VIP escort',                 status: 'Scheduled' },
  { time: '6:30 PM',  duration: '45m',   owner: '',   location: 'Pre-function area', item: 'Welcome reception — beverages and canapés',          status: 'Scheduled' },
  { time: '7:15 PM',  duration: '15m',   owner: '',    location: 'Dining floor',      item: 'Guest transition to dinner — seating',               status: 'Scheduled' },
  { time: '7:30 PM',  duration: '2h',    owner: '',   location: 'Dining floor',      item: 'Dinner service — 4 courses',                        status: 'Scheduled' },
  { time: '9:30 PM',  duration: '30m',   owner: '',      location: 'Dining floor',      item: 'Product reveal + experience moment',                 status: 'Scheduled' },
  { time: '10:00 PM', duration: '—',     owner: '',      location: 'Lobby',             item: 'Guest departures — car service coordination',        status: 'Scheduled' },
  { time: '10:30 PM', duration: '—',     owner: '', location: 'Full floor',        item: 'Strike begins',                                      status: 'Scheduled' },
]

export const FABRICATION_ITEMS = [
  { element: 'Custom dining tables × 12',      vendor: 'Eventmakers NYC', status: 'In fabrication', deadline: 'Jul 12', notes: 'White oak — client approved spec Jul 1' },
  { element: 'Scenic entrance portal',          vendor: 'Eventmakers NYC', status: 'In fabrication', deadline: 'Jul 12', notes: 'Brushed steel frame, backlit acrylic' },
  { element: 'LED wall — 8m × 3m',             vendor: 'Ocubo Digital',   status: 'Confirmed',      deadline: 'Jul 15', notes: 'Install day-of, client content TBC' },
  { element: 'Brand statement — 3D lettering',  vendor: 'Eventmakers NYC', status: 'In review',      deadline: 'Jul 14', notes: 'Client reviewing material options' },
  { element: 'Interactive kiosk × 3',          vendor: 'Ocubo Digital',   status: 'Build',          deadline: 'Jul 14', notes: 'AVP product display, iPad-driven' },
  { element: 'Lighting rig — dining floor',    vendor: 'Ocubo Digital',   status: 'Confirmed',      deadline: 'Jul 15', notes: 'Custom dimming scenes per ROS cues' },
  { element: 'Branded napkins + menu cards',   vendor: 'Apple print team',status: 'Confirmed',      deadline: 'Jul 14', notes: 'Delivered direct from Cupertino' },
]

export const AV_ITEMS = [
  { item: 'LED wall — 8m × 3m',             vendor: 'Ocubo Digital',  status: 'Confirmed',  power: '32A 3-phase', notes: 'Content delivered Jul 13' },
  { item: 'Interactive kiosks × 3',          vendor: 'Ocubo Digital',  status: 'Build',      power: '15A each',    notes: 'iPad-driven, custom case' },
  { item: 'Directional audio — dining',       vendor: 'Ocubo Digital',  status: 'Confirmed',  power: '20A',         notes: 'Ambient + cued music via ROS' },
  { item: 'Microphone + PA (speeches)',       vendor: 'Ocubo Digital',  status: 'Confirmed',  power: '15A',         notes: 'Wireless lapel + handheld' },
  { item: 'Lighting rig — full floor',        vendor: 'Ocubo Digital',  status: 'Confirmed',  power: '60A 3-phase', notes: 'DMX control, scene programmed Jul 15' },
  { item: 'Fiber internet — 1Gbps',           vendor: 'Brooklyn Tower', status: 'Confirmed',  power: '—',           notes: 'Venue-provided, dedicated circuit' },
  { item: 'Backup cellular router',           vendor: 'Agency kit',     status: 'Confirmed',  power: '—',           notes: 'Starlink backup on standby' },
]

export const CONTENT_ITEMS = [
  { deliverable: 'Event photography — full coverage',  vendor: 'Limelight Studios', due: 'Jul 23', status: 'Confirmed', notes: '3 photographers, full event' },
  { deliverable: 'Highlight reel — 90 seconds',        vendor: 'Limelight Studios', due: 'Aug 6',  status: 'Confirmed', notes: 'Cut for Apple social + internal' },
  { deliverable: 'Behind-the-scenes content',          vendor: 'Limelight Studios', due: 'Jul 23', status: 'Confirmed', notes: 'Vertical format, social-ready' },
  { deliverable: 'Shot list — approved',               vendor: '',        due: 'Jul 5',  status: 'In review', notes: 'Client reviewing hero shots list' },
  { deliverable: 'Usage rights agreement',             vendor: 'Apple Legal',       due: 'Jul 10', status: 'Pending',   notes: 'Standard brand usage + agency portfolio' },
]

export const HOSPITALITY_ITEMS = {
  fnb: [
    { course: 'Welcome canapés',   detail: 'Tuna tartare, wagyu bruschetta, burrata crostini',        status: 'Approved' },
    { course: 'First course',      detail: 'Chilled heirloom tomato bisque, basil oil',               status: 'Approved' },
    { course: 'Second course',     detail: 'Pan-seared halibut, fennel beurre blanc, micro salad',    status: 'Approved' },
    { course: 'Main',              detail: 'Dry-aged NY strip, truffle pomme purée, haricots verts',  status: 'Pending client' },
    { course: 'Dessert',           detail: 'Deconstructed lemon tart, yuzu sorbet',                   status: 'Approved' },
    { course: 'Mignardises',       detail: 'House chocolates, espresso service',                      status: 'Approved' },
  ],
  beverage: 'Champagne on arrival (Ruinart Blanc de Blancs). Wine pairing through dinner (sommelier-led). Cocktail bar open during reception. Full non-alcoholic program including bespoke mocktail.',
  florals: 'Low centerpieces — white and cream palette, seasonal garden flowers. Entrance installation — sculptural dried florals, 3m canopy. Aria Florals confirmed, install Jul 15 4–6pm.',
  dietary: [
    { guest: '2 guests',  requirement: 'Vegan', notes: 'Menu adapted for all 4 courses' },
    { guest: '3 guests',  requirement: 'Gluten-free', notes: 'GF versions of all courses confirmed with Glasshouse' },
    { guest: '1 guest',   requirement: 'Nut allergy (severe)', notes: 'Flagged to kitchen — separate prep station' },
    { guest: '4 guests',  requirement: 'Vegetarian', notes: 'Mushroom wellington as main alternative' },
  ],
}
