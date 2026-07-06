/* ─────────────────────────────────────────────────────────────
   demoSeed — one-time demo environment seed.

   Creates the "Rage Room" leadership-demo project on first boot
   when the account is empty. Every person, vendor, and venue is
   pulled from the master directories (CAPE_DIRECTORY, VENDORS,
   VENUES) — nothing is invented. All data is written to the same
   per-project keys the pages read, so deleting the project later
   removes everything and leaves a clean account.

   MASTER DATA (untouched): capeDirectory.js, vendorData.js,
   libraryData.js, templates, roles, categories, settings.
   PROJECT DATA (this file): everything keyed to the project id.
   ─────────────────────────────────────────────────────────── */

import { CAPE_DIRECTORY } from './data/capeDirectory.js'
import { VENDORS } from './company/vendorData.js'
import { VENUES } from './company/libraryData.js'

const SEED_FLAG = 'field_demo_seed_v1'
export const DEMO_PROJECT_ID = 'up_rageroom'

const P = DEMO_PROJECT_ID
const L = key => 'field_local_' + key

/* Real directory records — resolved, never invented */
const dir = id => CAPE_DIRECTORY.find(p => p.id === id)
const ven = id => VENDORS.find(v => v.id === id)
const venueRec = VENUES.find(v => v.id === 'vn02') // Spring Studios, NYC

const teekay = dir('cape-teekay')   // Teekay Kong
const brett  = dir('cape-brett')    // Brett Weinstein
const korina = dir('cape-korina')   // Korina Carpenter
const faith  = dir('cape-faith')    // Faith King
const josh   = dir('cape-josh')     // Josh Wilson

const eventmakers = ven('vc007')    // 4x8 Workshop — Fabrication (John Powell)
const ocubo       = ven('vc020')    // Soundhouse — Audio / AV rentals
const hotstrike   = ven('vc021')    // Hotstrike Lighting — Lighting/LED (Mike Jones)
const glasshouse  = ven('vc009')    // Zoe Delue Catering (Zoe Delue)
const peak        = ven('vc023')    // Imperial Movers — Logistics (Mario)
const classic     = ven('vc011')    // Taylor Creative — Furniture rentals (Anika Aurelus)
const duggal      = ven('vc006')    // Duggal — large-format print (Alex Hurst)

const fullName = p => `${p.firstName} ${p.lastName}`

/* ── The one demo project ─────────────────────────────────── */
const PROJECT = {
  id: P, userCreated: true, mine: true,
  name: 'Rage Room — Flagship Launch Night',
  client: 'Rage Room',
  category: 'Brand Activation', type: 'Brand Activation',
  region: 'North America', location: 'New York, NY',
  eventDate: 'Jul 25, 2026', eventTime: '7:00 PM',
  guestCount: 150, budget: '$358,000',
  status: 'active', statusLabel: 'In production', phase: 'Production',
  lead: fullName(teekay), leadInitials: teekay.initials,
  ep: fullName(teekay), epInitials: teekay.initials,
  team: [teekay.initials, brett.initials, korina.initials, faith.initials, josh.initials],
  daysOut: 19,
}

/* ── Per-project team (references directory records) ──────── */
const capeTeam = [
  { ...teekay, _uid: 'rr_tk', _directoryId: teekay.id, dept: ['Production'],  title: 'Lead Producer',
    driAreas: ['Run of Show', 'Timeline'], driNotes: 'Owns the master schedule and event-day flow.' },
  { ...brett,  _uid: 'rr_bw', _directoryId: brett.id,  dept: ['Production'],  title: 'Producer',
    driAreas: ['Venue/Logistics', 'Budget'], driNotes: 'Venue relationship + budget tracking.' },
  { ...korina, _uid: 'rr_kc', _directoryId: korina.id, dept: ['Hospitality'], title: 'Hospitality Lead',
    driAreas: ['Hospitality'], driNotes: 'Menu, beverage program, crew catering.' },
  { ...faith,  _uid: 'rr_fk', _directoryId: faith.id,  dept: ['Production'],  title: 'Production Coordinator',
    driAreas: ['Guest List', 'Talent'], driNotes: 'RSVPs, VIP handling, talent advance.' },
  { ...josh,   _uid: 'rr_jw', _directoryId: josh.id,   dept: ['Production', 'AV / Tech'], title: 'Technical Producer',
    driAreas: ['Fabrication', 'AVTech', 'Creative Assets'], driNotes: 'Build + AV integration with Eventmakers and Ocubo.' },
]

/* External collaborators — vendor leads from the vendor directory */
const extTeam = [
  { _uid: 'rr_ext_tom',  type: 'external', name: eventmakers.contactName, company: eventmakers.name,
    projectRole: 'On-Site Fabrication Lead', email: eventmakers.email, phone: eventmakers.phone,
    initials: 'TR', driAreas: [], driNotes: '' },
  { _uid: 'rr_ext_sara', type: 'external', name: hotstrike.contactName, company: ocubo.name,
    projectRole: 'AV / Show Systems Lead', email: ocubo.email, phone: ocubo.phone,
    initials: 'SM', driAreas: [], driNotes: '' },
]

/* ── Project vendors (from the vendor directory) ──────────── */
const vendorRow = (dv, extra) => ({
  id: 'rrv_' + dv.id, sourceId: dv.id, name: dv.name,
  domain: (dv.website || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, ''),
  owner: '', ownerInitials: '', ownerRole: '',
  budget: 0, contractValue: 0, contractStatus: 'Unsigned', contractDate: '',
  status: 'Selected', depositPct: 0, paymentTerms: 'Net 30',
  insuranceRequired: true, coiStatus: 'Pending',
  contact: dv.contactName || '', contactRole: '', contactPhone: dv.phone || '', contactEmail: dv.email || '',
  notes: '', ...extra,
})
const projectVendors = [
  vendorRow(eventmakers, { cat: 'Fabrication', owner: fullName(josh), ownerInitials: josh.initials,
    budget: 120000, contractValue: 118500, contractStatus: 'Signed', contractDate: 'Jun 18', status: 'Contracted',
    depositPct: 50, coiStatus: 'On file', notes: 'Smash-suite build + entry tunnel shell. ' + eventmakers.contactName + ' leading install.' }),
  vendorRow(hotstrike, { cat: 'AV / Tech', owner: fullName(josh), ownerInitials: josh.initials,
    budget: 62000, contractValue: 60000, contractStatus: 'Signed', contractDate: 'Jun 24', status: 'Contracted',
    depositPct: 50, coiStatus: 'On file', notes: 'LED tunnel + lighting design. Sound check Jul 24 with Soundhouse.' }),
  vendorRow(ocubo, { cat: 'AV / Tech', owner: fullName(josh), ownerInitials: josh.initials,
    budget: 23000, contractValue: 22000, contractStatus: 'Signed', contractDate: 'Jun 24', status: 'Contracted',
    coiStatus: 'On file', notes: 'PA, mics, DJ rig rental.' }),
  vendorRow(glasshouse, { cat: 'Catering', owner: fullName(korina), ownerInitials: korina.initials,
    budget: 52000, contractValue: 0, contractStatus: 'In review', status: 'Proposal received',
    notes: 'Second tasting Jul 10 — station menu revision pending.' }),
  vendorRow(peak, { cat: 'Logistics', owner: fullName(brett), ownerInitials: brett.initials,
    budget: 14000, contractValue: 13600, contractStatus: 'Signed', contractDate: 'Jun 30', status: 'Contracted',
    depositPct: 0, coiStatus: 'On file', notes: 'Crated transport for smash inventory. Dock reserved 72hr ahead per building rules.' }),
  vendorRow(classic, { cat: 'Rentals', owner: fullName(korina), ownerInitials: korina.initials,
    budget: 9500, contractValue: 0, contractStatus: 'Unsigned', status: 'Quote requested',
    notes: 'Bar fronts, cocktail tables, glassware. Quote requested from ' + (classic.contactName || classic.name) + '.' }),
]

/* ── Venue (from the venue directory, Spring Studios) ─────── */
const projectVenue = venueRec ? {
  sourceId: venueRec.id, name: venueRec.name, address: venueRec.location || '', website: venueRec.website || '',
  floor: venueRec.floor || '', buildingHours: venueRec.buildingHours || '',
  capacity: venueRec.capacity ?? '', sqft: venueRec.sqft ?? '', ceilingHeight: venueRec.ceilingHeight || '',
  power: venueRec.power || '', dedicatedCircuits: venueRec.dedicatedCircuits || '', floorBoxes: venueRec.floorBoxes || '',
  wifi: venueRec.wifi || '', hardline: venueRec.hardline || '',
  dockAddress: venueRec.dockAddress || '', dockHours: venueRec.dockHours || '',
  dockReservation: venueRec.dockReservation || '', dockContact: venueRec.dockContact || '',
  passengerElevQty: venueRec.passengerElevQty ?? '', passengerElevDims: venueRec.passengerElevDims || '',
  passengerElevDoorWidth: venueRec.passengerElevDoorWidth || '', passengerElevWeight: venueRec.passengerElevWeight || '',
  freightElevQty: venueRec.freightElevQty ?? '', freightElevDims: venueRec.freightElevDims || '',
  freightElevDoorWidth: venueRec.freightElevDoorWidth || '', freightElevWeight: venueRec.freightElevWeight || '',
  maxCrateSize: venueRec.maxCrateSize || '', maxPalletSize: venueRec.maxPalletSize || '',
  vendorParking: venueRec.vendorParking || '', guestParking: venueRec.guestParking || '',
  openFlame: venueRec.openFlame || '', noiseRestriction: venueRec.noiseRestrictions || '',
  securityProcedure: venueRec.buildingRules || '',
  contactName: venueRec.contactName || venueRec.contact || '', contactTitle: venueRec.contactTitle || '',
  contactPhone: venueRec.contactPhone || '', contactEmail: venueRec.contactEmail || '',
} : null

const venueContacts = [
  projectVenue?.contactName && {
    id: 'rrct_venue', group: 'Venue', name: projectVenue.contactName,
    role: projectVenue.contactTitle || 'Venue contact', phone: projectVenue.contactPhone || '', mobile: '',
    email: projectVenue.contactEmail || '', preferred: 'Email', notes: 'Auto-filled from selected venue',
  },
  { id: 'rrct_fab', group: 'Vendors', name: eventmakers.contactName, role: 'Fabrication — ' + eventmakers.name,
    phone: eventmakers.phone, mobile: '', email: eventmakers.email, preferred: 'Phone', notes: 'On-site lead for build + strike.' },
  { id: 'rrct_av', group: 'Vendors', name: hotstrike.contactName, role: 'AV — ' + ocubo.name,
    phone: hotstrike.phone, mobile: '', email: hotstrike.email, preferred: 'Email', notes: '' },
  { id: 'rrct_freight', group: 'Loading Dock', name: peak.contactName, role: 'Freight — ' + peak.name,
    phone: peak.phone, mobile: '', email: peak.email, preferred: 'Phone', notes: 'Call day-of for dock windows.' },
].filter(Boolean)

/* ── Load-in / load-out plan (drives ROS generation) ──────── */
const loadins = [
  { id: 'rrli1', type: 'Load-In',  date: 'Jul 24', time: '7:00 AM', location: 'Freight dock — Varick St',
    crew: `${peak.name} + ${eventmakers.name}`, notes: 'Smash-suite crates + scenic. COI on file with building.' },
  { id: 'rrli2', type: 'Load-In',  date: 'Jul 24', time: '10:00 AM', location: 'Main studio',
    crew: ocubo.name, notes: 'LED tunnel tiles + PA. Rigging points pre-approved.' },
  { id: 'rrli3', type: 'Load-Out', date: 'Jul 26', time: '8:00 AM', location: 'Freight dock — Varick St',
    crew: `${eventmakers.name} + ${peak.name}`, notes: 'Debris haul-away first, then scenic strike.' },
]

/* ── Timeline (page checkpoints + store milestones, one story) ── */
const timelineRows = [
  { id: 'rrtl1', label: 'Creative concept lock', date: 'Jun 20, 2026', daysOut: -16,
    owner: fullName(teekay), ownerInitials: teekay.initials, ownerRole: 'Lead Producer',
    status: 'complete', linked: 'creative',
    description: 'Lock the launch key visual and creative direction before fabrication and signage proceed.',
    progress: 4, progressTotal: 4, watching: ['Creative', 'Deliverables', 'Fabrication'],
    checklist: [
      { id: 'c1', text: 'Key visual approved', done: true },
      { id: 'c2', text: 'Mood board signed off', done: true },
      { id: 'c3', text: 'Material palette locked', done: true },
      { id: 'c4', text: 'Client concept approval', done: true },
    ],
    notes: [{ author: fullName(teekay), time: 'Jun 20', text: 'Concept approved by Marcus Webb. Creative lock confirmed.' }],
    linkedModules: ['creative', 'deliverables'] },
  { id: 'rrtl2', label: 'Fabrication contract signed', date: 'Jun 18, 2026', daysOut: -18,
    owner: fullName(josh), ownerInitials: josh.initials, ownerRole: 'Technical Producer',
    status: 'complete', linked: 'vendors',
    description: 'Award and sign the smash-suite + tunnel build with the fabrication vendor.',
    progress: 3, progressTotal: 3, watching: ['Vendors', 'Budget', 'Fabrication'],
    checklist: [
      { id: 'c1', text: 'Shop drawings approved', done: true },
      { id: 'c2', text: 'Contract signed (' + eventmakers.name + ')', done: true },
      { id: 'c3', text: 'Deposit paid', done: true },
    ],
    notes: [], linkedModules: ['vendors', 'budget', 'fabrication'] },
  { id: 'rrtl3', label: 'Venue agreement — Spring Studios', date: 'Jun 26, 2026', daysOut: -10,
    owner: fullName(brett), ownerInitials: brett.initials, ownerRole: 'Producer',
    status: 'complete', linked: 'logistics',
    description: 'Execute the venue buy-out and confirm load-in access.',
    progress: 3, progressTotal: 3, watching: ['Logistics', 'Budget'],
    checklist: [
      { id: 'c1', text: 'Contract executed', done: true },
      { id: 'c2', text: 'Deposit paid', done: true },
      { id: 'c3', text: 'Dock window reserved', done: true },
    ],
    notes: [], linkedModules: ['logistics', 'budget'] },
  { id: 'rrtl4', label: 'COI submitted to building', date: 'Jul 1, 2026', daysOut: -5,
    owner: fullName(brett), ownerInitials: brett.initials, ownerRole: 'Producer',
    status: 'complete', linked: 'logistics',
    description: 'Certificate of insurance approved by the building for all vendors.',
    progress: 2, progressTotal: 2, watching: ['Logistics', 'Vendors'],
    checklist: [
      { id: 'c1', text: 'COI issued', done: true },
      { id: 'c2', text: 'Building approval', done: true },
    ],
    notes: [], linkedModules: ['logistics'] },
  { id: 'rrtl5', label: 'Menu tasting #2 — ' + glasshouse.name, date: 'Jul 10, 2026', daysOut: 4,
    owner: fullName(korina), ownerInitials: korina.initials, ownerRole: 'Hospitality Lead',
    status: 'at-risk', linked: 'hospitality',
    description: 'Final tasting to lock the station menu and beverage program with the client.',
    progress: 2, progressTotal: 4, watching: ['Hospitality', 'Approvals'],
    checklist: [
      { id: 'c1', text: 'Tasting scheduled Jul 10', done: true },
      { id: 'c2', text: 'Revised station menu received', done: true },
      { id: 'c3', text: 'Client attending confirmed', done: false },
      { id: 'c4', text: 'Final menu sign-off', done: false },
    ],
    notes: [{ author: fullName(korina), time: 'Jul 2', text: 'Ramen bar moved to a late-night format per client note.' }],
    linkedModules: ['hospitality', 'approvals'] },
  { id: 'rrtl6', label: 'Signage print deadline — ' + duggal.name, date: 'Jul 15, 2026', daysOut: 9,
    owner: fullName(josh), ownerInitials: josh.initials, ownerRole: 'Technical Producer',
    status: 'on-track', linked: 'deliverables',
    description: 'Approve safety + wayfinding signage artwork and release to print.',
    progress: 2, progressTotal: 4, watching: ['Creative', 'Deliverables', 'Fabrication'],
    checklist: [
      { id: 'c1', text: 'Round 1 proofs delivered', done: true },
      { id: 'c2', text: 'Client safety-copy revisions', done: true },
      { id: 'c3', text: 'Revised proofs approved', done: false },
      { id: 'c4', text: 'Released to print', done: false },
    ],
    notes: [], linkedModules: ['deliverables', 'creative'] },
  { id: 'rrtl7', label: 'Guest list final lock', date: 'Jul 20, 2026', daysOut: 14,
    owner: fullName(faith), ownerInitials: faith.initials, ownerRole: 'Production Coordinator',
    status: 'upcoming', linked: 'guests',
    description: 'Confirm all RSVPs and finalize the VIP + press list.',
    progress: 2, progressTotal: 3, watching: ['Guest List', 'Hospitality'],
    checklist: [
      { id: 'c1', text: 'Press list confirmed', done: true },
      { id: 'c2', text: 'VIP handling plan', done: true },
      { id: 'c3', text: 'Final headcount to catering', done: false },
    ],
    notes: [], linkedModules: ['guests'] },
  { id: 'rrtl8', label: 'Load-in — Spring Studios', date: 'Jul 24, 2026', daysOut: 18,
    owner: fullName(teekay), ownerInitials: teekay.initials, ownerRole: 'Lead Producer',
    status: 'upcoming', linked: 'logistics',
    description: 'Crews on site 7:00 AM. Fabrication install, AV, and dressing.',
    progress: 1, progressTotal: 4, watching: ['Logistics', 'Fabrication', 'AV / Tech'],
    checklist: [
      { id: 'c1', text: 'Crew list to building', done: true },
      { id: 'c2', text: 'Freight delivery confirmed', done: false },
      { id: 'c3', text: 'AV install scheduled', done: false },
      { id: 'c4', text: 'FDNY walkthrough', done: false },
    ],
    notes: [], linkedModules: ['logistics', 'fabrication', 'av-tech'] },
  { id: 'rrtl9', label: 'Launch Night', date: 'Jul 25, 2026', daysOut: 19,
    owner: fullName(teekay), ownerInitials: teekay.initials, ownerRole: 'Lead Producer',
    status: 'event', linked: 'run-of-show',
    description: 'Doors 7:00 PM. Showtime.',
    progress: 0, progressTotal: 0, watching: ['Run of Show', 'Hospitality', 'AV / Tech', 'Talent'],
    checklist: [], notes: [], linkedModules: ['run-of-show', 'hospitality'] },
]
const storeMilestones = timelineRows
  .filter(t => t.status !== 'event')
  .map((t, i) => ({ id: 'rrms' + (i + 1), label: t.label, date: t.date.replace(', 2026', ''), done: t.status === 'complete', owner: t.owner }))

/* ── Budget (canonical working budget + expenses + proposal) ── */
const budgetWB = [
  { id: 'wc1', name: 'Venue',       items: [{ id: 'rri1', desc: 'Spring Studios — full buy-out + security', budget: 48000,  forecast: 48000 }] },
  { id: 'wc2', name: 'Fabrication', items: [
      { id: 'rri2', desc: 'Smash suites ×4 — build + install (' + eventmakers.name + ')', budget: 96000, forecast: 94500 },
      { id: 'rri3', desc: 'Entry tunnel + branded portal', budget: 24000, forecast: 24000 }] },
  { id: 'wc3', name: 'AV / Tech',   items: [
      { id: 'rri4', desc: 'LED tunnel + lighting (' + hotstrike.name + ')', budget: 62000, forecast: 60000 },
      { id: 'rri5', desc: 'PA, mics, DJ rig (' + ocubo.name + ')', budget: 23000, forecast: 22000 }] },
  { id: 'rrc4', name: 'Hospitality', items: [
      { id: 'rri6', desc: 'Catering + beverage (' + glasshouse.name + ')', budget: 52000, forecast: 52000 },
      { id: 'rri7', desc: 'Rentals — bars, cocktail tables, glassware', budget: 9500, forecast: 9500 }] },
  { id: 'rrc5', name: 'Logistics',   items: [{ id: 'rri8', desc: 'Freight + crate transport (' + peak.name + ')', budget: 14000, forecast: 13600 }] },
  { id: 'rrc6', name: 'Staffing',    items: [{ id: 'rri9', desc: 'Event staff, security, safety marshals', budget: 29500, forecast: 29500 }] },
]
const budgetExpenses = [
  { id: 'rre1', date: 'Jun 18', vendor: eventmakers.name, cat: 'Fabrication', desc: 'Fabrication deposit 50%', amount: 59250 },
  { id: 'rre2', date: 'Jun 26', vendor: venueRec?.name || 'Venue', cat: 'Venue', desc: 'Venue deposit 50%', amount: 24000 },
  { id: 'rre3', date: 'Jun 24', vendor: ocubo.name, cat: 'AV / Tech', desc: 'AV deposit 50%', amount: 41000 },
  { id: 'rre4', date: 'Jun 30', vendor: peak.name, cat: 'Logistics', desc: 'Freight booking', amount: 6800 },
]
const budgetProducing = [
  { id: 'rrp1', name: fullName(teekay), role: 'Lead Producer',          days: '28', rate: '950' },
  { id: 'rrp2', name: fullName(brett),  role: 'Producer',               days: '22', rate: '850' },
  { id: 'rrp3', name: fullName(faith),  role: 'Production Coordinator', days: '20', rate: '600' },
]
const budgetDesign = [
  { id: 'rrd1', name: fullName(josh), role: 'Technical Producer / Design', days: '18', rate: '800' },
]
const budgetCosts = [
  { id: 'rrx1', item: 'Safety gear — coveralls, face shields, gloves (guest sets)', qty: '180', price: '38' },
  { id: 'rrx2', item: 'Smash inventory — glassware, ceramics, electronics lots',    qty: '1',   price: '8400' },
]

/* ── Hospitality (menu drives ROS service cues) ───────────── */
const hospFood = [
  { id: 'rrf1', course: 'Welcome canapés', item: 'Smashed-cucumber crostini', description: 'Whipped feta, chili crisp', dietaryTags: ['V'], status: 'Confirmed', drinkMenu: false },
  { id: 'rrf2', course: 'Welcome canapés', item: 'Korean fried chicken bites', description: 'Gochujang glaze, sesame', dietaryTags: [], status: 'Confirmed', drinkMenu: false },
  { id: 'rrf3', course: 'Food stations',   item: 'Smash burger station', description: 'Griddled to order — double stack, house pickles', dietaryTags: ['GF bun option'], status: 'Confirmed', drinkMenu: false },
  { id: 'rrf4', course: 'Food stations',   item: 'Late-night ramen bar', description: 'Tonkotsu + spicy miso, soft egg', dietaryTags: ['VG option'], status: 'Proposed', drinkMenu: false },
  { id: 'rrf5', course: 'Dessert',         item: '“Break the mold” chocolate piñata', description: 'Tableside smash — Valrhona shell, berry center', dietaryTags: ['GF'], status: 'Proposed', drinkMenu: false },
]
const hospDrink = [
  { id: 'rrb1', course: 'Cocktails', item: 'The Wrecking Ball', description: 'Mezcal, blood orange, smoked salt rim', dietaryTags: [], status: 'Confirmed', drinkMenu: true },
  { id: 'rrb2', course: 'Cocktails', item: 'Zero-proof Crash', description: 'Seedlip, yuzu, ginger beer', dietaryTags: ['NA'], status: 'Confirmed', drinkMenu: true },
]
const hospVendors = [
  { id: 'rrhv1', role: 'Caterer',   name: glasshouse.name, contact: glasshouse.contactName },
  { id: 'rrhv2', role: 'Rentals',   name: classic.name,    contact: classic.contactName },
]

/* ── Staffing plan (drives crew call + call times) ────────── */
const staffing = [
  { memberId: 'rr_tk', shifts: [{ date: '2026-07-24', start: '08:00', end: '18:00' }, { date: '2026-07-25', start: '09:00', end: '23:30' }] },
  { memberId: 'rr_bw', shifts: [{ date: '2026-07-24', start: '07:00', end: '18:00' }, { date: '2026-07-25', start: '10:00', end: '23:00' }] },
  { memberId: 'rr_kc', shifts: [{ date: '2026-07-25', start: '12:00', end: '23:00' }] },
  { memberId: 'rr_fk', shifts: [{ date: '2026-07-25', start: '14:00', end: '23:30' }] },
  { memberId: 'rr_jw', shifts: [{ date: '2026-07-24', start: '07:00', end: '20:00' }, { date: '2026-07-25', start: '09:00', end: '23:30' }] },
]

/* ── ROS phases — empty rows on purpose: the demo IS clicking
      ✦ Auto-generate and watching the draft build itself ───── */
const rosPhases = [
  { id: 'rrph1', name: 'Load-In — Spring Studios', type: 'Load-In',  date: '2026-07-24', startTime: '07:00', endTime: '18:00', location: 'Spring Studios', rows: [], callTimes: [] },
  { id: 'rrph2', name: 'Launch Night',             type: 'Show Day', date: '2026-07-25', startTime: '09:00', endTime: '23:30', location: 'Spring Studios', rows: [], callTimes: [] },
  { id: 'rrph3', name: 'Strike + Load-Out',        type: 'Load-Out', date: '2026-07-26', startTime: '08:00', endTime: '14:00', location: 'Spring Studios', rows: [], callTimes: [] },
]

/* ── AV / Tech + Fabrication (drive ROS tech cues) ────────── */
const avCats = [
  { id: 'rrav_c1', name: 'Video / LED', open: true, items: [
    { id: 'rrav1', name: 'LED entry tunnel', cat: 'Video / LED', vendor: hotstrike.name, owner: fullName(josh), ownerInitials: josh.initials,
      power: '3× 20A circuits', testDate: 'Jul 24', status: 'On order',
      description: '24ft branded LED tunnel — reactive content triggered by smash sensors.',
      placement: 'Entry corridor', dimensions: 'L 288" × H 96"', specs: [], linkedDeliverableNames: [],
      testing: 'Sound check Jul 24 3:00 PM. Content run-through Jul 25 11:00 AM.', install: 'Jul 24 10:00 AM with rigging crew.', cabling: '' },
  ]},
  { id: 'rrav_c2', name: 'Audio', open: true, items: [
    { id: 'rrav2', name: 'Main PA + DJ rig', cat: 'Audio', vendor: ocubo.name, owner: fullName(josh), ownerInitials: josh.initials,
      power: '2× 20A circuits', testDate: 'Jul 24', status: 'Confirmed',
      description: 'Full-range PA for main studio + monitor pair at DJ booth.',
      placement: 'Main studio — four corners', dimensions: '', specs: [], linkedDeliverableNames: [],
      testing: 'Sound check Jul 24 3:00 PM.', install: 'Jul 24 1:00 PM.', cabling: '' },
  ]},
]
const fabItem = (id, name, extra) => ({
  id, name, fabricator: eventmakers.name, owner: fullName(josh), ownerInitials: josh.initials,
  material: '', installDate: 'Jul 24', status: 'In fabrication', budget: '', description: '',
  dimensions: '', installNotes: '', productionNotes: '', linkedDeliverableName: '',
  files: [], progressPhotos: [], ...extra,
})
const fabCats = [
  { id: 'rrfab_c1', name: 'Scenic', open: true, items: [
    fabItem('rrfab1', 'Smash suites ×4 — safety-glass bays', { material: 'Steel frame + laminated safety glass', budget: '$96,000',
      description: 'Four enclosed smash bays with impact-rated glazing, viewing side, debris containment floor pans.',
      dimensions: 'Each 10\' × 12\' × 9\'H', linkedDeliverableName: 'Floor plan — guest flow + smash suites',
      productionNotes: 'FDNY change order CO-004: suite 4 door swings out.' }),
    fabItem('rrfab2', 'Entry tunnel shell (LED substructure)', { material: 'Aluminum truss + ply cladding', budget: '$24,000',
      description: '24ft tunnel shell carrying the LED skin — coordinate mounting with ' + hotstrike.name + '.',
      dimensions: 'L 24\' × H 8\'' }),
  ]},
  { id: 'rrfab_c2', name: 'Branding', open: true, items: [
    fabItem('rrfab3', 'Neon “RAGE ROOM” marquee', { material: 'LED neon on blackened steel', status: 'Approved — in production',
      description: 'Entry marquee above the tunnel mouth. Print proofs with ' + duggal.name + ' for supporting signage.' }),
  ]},
]

/* ── Store slices (guest list, talent, deliverables, files…) ── */
const guestList = [
  ['Alexis Roman', 'TimeOut New York', 'Confirmed', '1', 'Press — VIP first-smash moment'],
  ['Devon Carter', 'Complex', 'Confirmed', '1', 'VIP — plus photographer'],
  ['Priya Natarajan', 'Eater NY', 'Confirmed', '2', ''],
  ['Marcus Webb', 'Rage Room — CEO', 'Confirmed', '1', 'VIP — opening remarks 8:15 PM'],
  ['Sloane Bennett', 'Rage Room — CMO', 'Confirmed', '1', 'VIP'],
  ['Jordan Ellis', 'Hypebeast', 'Confirmed', '2', ''],
  ['Renata Cruz', 'Bustle', 'Confirmed', '3', 'Dietary: vegetarian'],
  ['Theo Lindqvist', 'Creator — 2.1M', 'Confirmed', '2', 'Filming walkthrough 7:30 PM'],
  ['Amara Diallo', 'Creator — 890K', 'Confirmed', '3', ''],
  ['Chris Paglia', 'Thrillist', 'Pending', '', ''],
  ['Dana Okafor', 'The Cut', 'Pending', '', ''],
  ['Sam Reyes', 'Gothamist', 'Confirmed', '4', ''],
  ['Lena Fischer', 'AdWeek', 'Pending', '', ''],
  ['Miguel Santos', 'Event Marketer', 'Confirmed', '4', ''],
].map((g, i) => ({
  id: 'rrg' + (i + 1), projectId: P, name: g[0], company: g[1], rsvp: g[2],
  plusOne: false, plusOneName: '', table: g[3], seat: '', dietary: g[4].includes('vegetarian') ? 'Vegetarian' : '', notes: g[4],
}))

const talent = [
  { id: 'rrt1', projectId: P, name: 'DJ Nova Reyes', role: 'DJ — main set', agency: 'Direct', email: '',
    contract: 'Signed', fee: '$6,500', feeStatus: 'Deposit paid', arrivalTime: '4:00 PM', travel: 'Local — car service',
    dressingRoom: 'Green Room A', dayOfContact: fullName(faith), dayOfContactEmail: faith.email, dayOfContactPhone: faith.phone,
    hospitality: 'Standard rider — no shellfish', notes: 'Soundcheck 5:00 PM. Set 8:30–11:00 PM.' },
  { id: 'rrt2', projectId: P, name: 'Maya Brooks', role: 'Host / MC', agency: 'CAA', email: '',
    contract: 'In review', fee: '$4,000', feeStatus: 'Unpaid / N/A', arrivalTime: '5:30 PM', travel: 'Local',
    dressingRoom: 'Green Room B', dayOfContact: fullName(faith), dayOfContactEmail: faith.email, dayOfContactPhone: faith.phone,
    hospitality: 'Standard', notes: 'Run-through with Marcus Webb 6:15 PM. Opening remarks 8:15 PM.' },
]

const deliverables = [
  { id: 'rrdl1', projectId: P, item: 'Launch key visual + mood board', owner: fullName(josh), due: 'Jun 20', status: 'Approved',
    copy: '', width: '', height: '', format: 'PDF', producerNotes: 'Concrete, neon, controlled chaos. Locked Jun 20.',
    referenceFiles: [], milestones: { forRevision: 'Jun 12, 2026', clientReview: 'Jun 16, 2026', approved: 'Jun 20, 2026' },
    imgBg: '#1A1A1E', imgAccent: '#C8402E', versions: [{ v: 1, file: 'rageroom_kv_v1.pdf', by: josh.initials, date: 'Jun 12' }, { v: 2, file: 'rageroom_kv_v2.pdf', by: josh.initials, date: 'Jun 18' }], comments: [] },
  { id: 'rrdl2', projectId: P, item: 'Signage package — wayfinding + safety', owner: fullName(josh), due: 'Jul 12', status: 'Client review',
    copy: '', width: '', height: '', format: 'AI', producerNotes: 'Includes waiver-station signage and suite safety rules.',
    referenceFiles: [], milestones: { forRevision: 'Jul 6, 2026', clientReview: 'Jul 9, 2026', approved: '' },
    imgBg: '#20201C', imgAccent: '#C8A840', versions: [{ v: 1, file: 'signage_v1.ai', by: josh.initials, date: 'Jul 5' }], comments: [] },
  { id: 'rrdl3', projectId: P, item: 'Floor plan — guest flow + smash suites', owner: fullName(brett), due: 'Jul 2', status: 'Approved',
    copy: '', width: '', height: '', format: 'PDF', producerNotes: 'FDNY egress notes incorporated. v3 final.',
    referenceFiles: [], milestones: { forRevision: 'Jun 26, 2026', clientReview: 'Jun 30, 2026', approved: 'Jul 2, 2026' },
    imgBg: '#1C2430', imgAccent: '#378ADD', versions: [{ v: 3, file: 'floorplan_v3.pdf', by: brett.initials, date: 'Jul 2' }], comments: [] },
  { id: 'rrdl4', projectId: P, item: 'Social teaser — 15s cutdowns', owner: fullName(josh), due: 'Jul 18', status: 'In progress',
    copy: '', width: '', height: '', format: 'MP4', producerNotes: 'Three 9:16 cutdowns from fabrication b-roll.',
    referenceFiles: [], milestones: { forRevision: 'Jul 14, 2026', clientReview: '', approved: '' },
    imgBg: '#1E1E22', imgAccent: '#888888', versions: [], comments: [] },
]

const approvals = [
  { id: 'rrap1', projectId: P, item: 'Creative concept + key visual', type: 'Creative', category: 'Client',
    ownerId: 'rr_jw', approver: 'Marcus Webb (client)', due: 'Jun 20', status: 'Approved', notes: 'Approved at concept review Jun 20.' },
  { id: 'rrap2', projectId: P, item: 'Budget — revision 2 ($358K)', type: 'Budget', category: 'Leadership',
    ownerId: 'rr_bw', approver: 'CAPE Leadership', due: 'Jun 28', status: 'Approved', notes: 'Approved with 10% contingency held.' },
  { id: 'rrap3', projectId: P, item: 'Signage package — wayfinding + safety', type: 'Creative', category: 'Client',
    ownerId: 'rr_jw', approver: 'Sloane Bennett (client)', due: 'Jul 12', status: 'In progress', notes: 'Client reviewing safety-copy revisions.' },
  { id: 'rrap4', projectId: P, item: 'Final station menu', type: 'Hospitality', category: 'Client',
    ownerId: 'rr_kc', approver: 'Sloane Bennett (client)', due: 'Jul 11', status: 'Pending', notes: 'Pending tasting #2 on Jul 10.' },
]

const files = [
  { projectId: P, id: 'rrfl1', name: 'Floor plan v3 — guest flow + suites', type: 'Production', format: 'PDF',  size: '4.2 MB',  uploadedBy: brett.initials,  uploadedDate: 'Jul 2',  status: 'Current' },
  { projectId: P, id: 'rrfl2', name: 'Mood board — launch key visual',      type: 'Creative',   format: 'PDF',  size: '12 MB',   uploadedBy: josh.initials,   uploadedDate: 'Jun 20', status: 'Approved' },
  { projectId: P, id: 'rrfl3', name: 'Fabrication drawings — smash suites', type: 'Production', format: 'PDF',  size: '9.8 MB',  uploadedBy: 'JP',            uploadedDate: 'Jun 27', status: 'Current' },
  { projectId: P, id: 'rrfl4', name: 'Lighting + LED tunnel plot',          type: 'AV / Tech',  format: 'PDF',  size: '3.1 MB',  uploadedBy: 'MJ',            uploadedDate: 'Jul 3',  status: 'Current' },
  { projectId: P, id: 'rrfl5', name: 'Load-in map — dock + freight route',  type: 'Logistics',  format: 'PDF',  size: '1.6 MB',  uploadedBy: brett.initials,  uploadedDate: 'Jul 5',  status: 'Current' },
  { projectId: P, id: 'rrfl6', name: 'Menu proof — station cards',          type: 'Hospitality',format: 'PDF',  size: '860 KB',  uploadedBy: korina.initials, uploadedDate: 'Jul 4',  status: 'In review' },
  { projectId: P, id: 'rrfl7', name: 'Signage print proofs — round 1',      type: 'Creative',   format: 'PDF',  size: '22 MB',   uploadedBy: josh.initials,   uploadedDate: 'Jul 5',  status: 'In review' },
  { projectId: P, id: 'rrfl8', name: 'Venue agreement — Spring Studios',    type: 'Contract',   format: 'PDF',  size: '2.4 MB',  uploadedBy: brett.initials,  uploadedDate: 'Jun 26', status: 'Signed' },
]

const logisticsPhotos = [
  { id: 'rrph_1', caption: 'Main studio — smash suite placement', bg: '#26221E' },
  { id: 'rrph_2', caption: 'Freight dock — Varick St entrance',   bg: '#1E2226' },
  { id: 'rrph_3', caption: 'Entry corridor — LED tunnel route',   bg: '#221E26' },
]

const workstreams = [
  { id: 'creative',    name: 'Creative',    ownerId: '', status: 'on-track',  statusLabel: 'Concept locked',        completedTasks: 5, totalTasks: 6, nextDeliverable: 'Social teasers',      nextDate: 'Jul 18' },
  { id: 'budget',      name: 'Budget',      ownerId: '', status: 'on-track',  statusLabel: 'Rev 2 approved',        completedTasks: 5, totalTasks: 7, nextDeliverable: 'Reconciliation prep', nextDate: 'Jul 20' },
  { id: 'vendors',     name: 'Vendors',     ownerId: '', status: 'on-track',  statusLabel: '3 of 5 contracted',     completedTasks: 3, totalTasks: 5, nextDeliverable: 'Rentals award',       nextDate: 'Jul 9'  },
  { id: 'fabrication', name: 'Fabrication', ownerId: '', status: 'on-track',  statusLabel: 'In build',              completedTasks: 3, totalTasks: 6, nextDeliverable: 'Shop visit',          nextDate: 'Jul 14' },
  { id: 'hospitality', name: 'Hospitality', ownerId: '', status: 'attention', statusLabel: 'Menu pending tasting',  completedTasks: 2, totalTasks: 5, nextDeliverable: 'Tasting #2',          nextDate: 'Jul 10' },
  { id: 'guests',      name: 'Guest List',  ownerId: '', status: 'on-track',  statusLabel: '11 of 14 confirmed',    completedTasks: 3, totalTasks: 5, nextDeliverable: 'Final lock',          nextDate: 'Jul 20' },
]

const now = new Date().toISOString()
const pageComments = {
  [`${P}:run-of-show`]: [
    { id: 'rrpc1', projectId: P, page: 'run-of-show', commentKey: `${P}:run-of-show`, authorId: brett.email, authorName: fullName(brett), authorInitials: brett.initials,
      text: 'Dock window is confirmed 7:00 AM sharp on the 24th — building will not open earlier. Generate the load-in draft from the Venue page once freight confirms crate count.', mentions: [], replyToId: null, timestamp: '2026-07-03T14:05:00Z' },
    { id: 'rrpc2', projectId: P, page: 'run-of-show', commentKey: `${P}:run-of-show`, authorId: teekay.email, authorName: fullName(teekay), authorInitials: teekay.initials,
      text: `@${fullName(josh)} sound check moved to 3:00 PM on the 24th per Mike — make sure the LED content run-through still fits before doors on the 25th.`, mentions: [josh.email], replyToId: null, timestamp: '2026-07-05T10:22:00Z' },
  ],
  [`${P}:budget`]: [
    { id: 'rrpc3', projectId: P, page: 'budget', commentKey: `${P}:budget`, authorId: brett.email, authorName: fullName(brett), authorInitials: brett.initials,
      text: 'Rev 2 approved by leadership with 10% contingency. Rentals quote from Taylor Creative still outstanding — chasing Anika this week.', mentions: [], replyToId: null, timestamp: '2026-06-28T16:40:00Z' },
  ],
  [`${P}:hospitality`]: [
    { id: 'rrpc4', projectId: P, page: 'hospitality', commentKey: `${P}:hospitality`, authorId: korina.email, authorName: fullName(korina), authorInitials: korina.initials,
      text: 'Tasting #2 locked for Jul 10 with Zoe Delue. Client wants the ramen bar to feel later-night — proposing it opens after the first smash rotation.', mentions: [], replyToId: null, timestamp: '2026-07-02T11:15:00Z' },
  ],
}

const notifications = [
  { id: 'rrn1', type: 'mention', toUserId: teekay.email, toUserEmail: teekay.email, fromUserName: fullName(brett),
    projectId: P, projectName: PROJECT.name, page: 'run-of-show', pageName: 'Run of Show', commentId: 'rrpc1', commentKey: `${P}:run-of-show`,
    preview: 'Dock window is confirmed 7:00 AM sharp on the 24th…', text: `${fullName(brett)} mentioned you in ${PROJECT.name} › Run of Show`,
    timestamp: '2026-07-03T14:05:00Z', read: false },
  { id: 'rrn2', type: 'approval', toUserId: teekay.email, toUserEmail: teekay.email, fromUserName: fullName(korina),
    projectId: P, projectName: PROJECT.name, page: 'approvals', pageName: 'Approvals',
    text: 'Final station menu is awaiting client approval — tasting #2 on Jul 10.', timestamp: '2026-07-02T11:20:00Z', read: false },
]

const projectNotes = {
  [P]: [
    { id: 'rrpn1', projectId: P, userId: 'rr_bw', userName: fullName(brett), text: 'Building requires safety marshals at each smash suite — headcount added to staffing budget. FDNY walkthrough scheduled morning of the 24th.', timestamp: '2026-07-01T09:00:00Z', pinned: true },
    { id: 'rrpn2', projectId: P, userId: 'rr_tk', userName: fullName(teekay), text: 'Client wants a “first smash” photo moment with Marcus Webb at 8:20 PM — hold the LED tunnel content loop for it.', timestamp: '2026-07-04T15:30:00Z', pinned: true },
  ],
}

const creative = {
  brief: 'Rage Room — Flagship Launch Night marks the brand\u2019s first permanent NYC location. The event turns controlled destruction into a premium, safe, shareable experience: four glass-walled smash suites, a reactive LED entry tunnel, and a late-night menu built around the theme.\n\nTone: raw but considered. Concrete, steel, neon signage, warm hospitality. Guests should leave with adrenaline and a story.',
  objectives: '• Launch the flagship with 150 press, creators, and partners\n• Deliver a safe, premium "first smash" experience for every guest\n• Generate shareable content — LED tunnel + suite cams\n• Convert coverage into opening-month bookings',
  clientFeedback: 'Concept approved Jun 20. Client emphasis: safety visibly premium, never clinical.',
}

/* ── Communications (per-project threads, one story) ──────── */
const emailThreads = [
  {
    id: 'rrt_1', category: 'client',
    participants: ['Sloane Bennett', fullName(teekay), fullName(josh)],
    from: 'Sloane Bennett', fromEmail: 'sloane@rageroom.co',
    subject: 'Signage round 1 — safety copy revisions', preview: 'Loving the direction. Two changes on the suite safety cards before we approve…',
    timestamp: 'Today, 9:12 AM', date: 'Jul 6', count: 3, unread: true, priority: 'high', tags: ['Creative', 'Approval'],
    messages: [
      { from: 'Sloane Bennett', time: 'Jul 6, 9:12 AM', body: 'Loving the direction. Two changes on the suite safety cards before we approve: lead with the gear checklist, and make the "one guest per bay" rule bigger. Otherwise round 1 looks great.' },
      { from: fullName(josh), time: 'Jul 6, 9:40 AM', body: 'Easy changes — revised proofs to you by Wednesday so we hold the Jul 15 print deadline.' },
    ],
  },
  {
    id: 'rrt_2', category: 'vendor',
    participants: [glasshouse.contactName, fullName(korina)],
    from: glasshouse.contactName, fromEmail: glasshouse.email,
    subject: 'Tasting #2 — revised station menu', preview: 'Confirming Friday Jul 10 at 2 PM. Revised ramen bar concept attached — moved to a late-night format per your note…',
    timestamp: 'Yesterday, 4:48 PM', date: 'Jul 5', count: 4, unread: false, priority: 'normal', tags: ['Hospitality'],
    messages: [
      { from: glasshouse.contactName, time: 'Jul 5, 4:48 PM', body: 'Confirming Friday Jul 10 at 2 PM for tasting #2. Revised ramen bar concept attached — moved to a late-night format per your note, opening after the first smash rotation.', attachments: ['Station_Menu_R2.pdf'] },
      { from: fullName(korina), time: 'Jul 5, 5:15 PM', body: 'Perfect. Client is joining the tasting — Sloane plus one. Please plate the chocolate piñata concept too.' },
    ],
  },
  {
    id: 'rrt_3', category: 'vendor',
    participants: [eventmakers.contactName, fullName(josh), fullName(teekay)],
    from: eventmakers.contactName, fromEmail: eventmakers.email,
    subject: 'Change order — suite 4 door swing', preview: 'FDNY notes require suite 4 door to swing out. Small steel change, $1,850, no schedule impact…',
    timestamp: 'Jul 3, 11:20 AM', date: 'Jul 3', count: 3, unread: false, priority: 'normal', tags: ['Fabrication', 'Budget'],
    messages: [
      { from: eventmakers.contactName, time: 'Jul 3, 11:20 AM', body: 'FDNY notes require suite 4 door to swing out. Small steel change, $1,850, no schedule impact. Need sign-off by Monday to hold the install date.', attachments: ['CO-004_Suite4_Door.pdf'] },
      { from: fullName(teekay), time: 'Jul 3, 12:02 PM', body: 'Approved — covered by contingency. Brett will log it against Fabrication.' },
    ],
  },
  {
    id: 'rrt_4', category: 'venue',
    participants: [projectVenue?.contactName || 'Venue Events', fullName(brett)],
    from: projectVenue?.contactName || 'Venue Events', fromEmail: projectVenue?.contactEmail || '',
    subject: 'Load-in confirmed — Jul 24, 7:00 AM', preview: 'Dock is reserved under CAPE Creative from 7:00 AM. COI approved. Freight elevator available 7 AM–6 PM…',
    timestamp: 'Jul 2, 3:05 PM', date: 'Jul 2', count: 2, unread: false, priority: 'high', tags: ['Venue', 'Load-in'],
    messages: [
      { from: projectVenue?.contactName || 'Venue Events', time: 'Jul 2, 3:05 PM', body: 'Dock is reserved under CAPE Creative from 7:00 AM on Jul 24. COI approved. Freight elevator available 7 AM–6 PM; after that, passenger elevators only. Security will have your crew list at the desk.' },
      { from: fullName(brett), time: 'Jul 2, 3:30 PM', body: 'Confirmed — crew list to you by the 20th. FDNY walkthrough set for the morning of the 24th.' },
    ],
  },
  {
    id: 'rrt_5', category: 'vendor',
    participants: [peak.contactName, fullName(brett)],
    from: peak.contactName, fromEmail: peak.email,
    subject: 'Crate count + dock window', preview: '14 crates confirmed for the 7 AM window. Smash inventory ships padded and pre-sorted by suite…',
    timestamp: 'Jun 30, 10:12 AM', date: 'Jun 30', count: 2, unread: false, priority: 'normal', tags: ['Logistics'],
    messages: [
      { from: peak.contactName, time: 'Jun 30, 10:12 AM', body: '14 crates confirmed for the 7 AM window on the 24th. Smash inventory ships padded and pre-sorted by suite. We\u2019ll stage debris haul-away bins for the 26th.' },
    ],
  },
]

/* ── Writers ──────────────────────────────────────────────── */
function writeStore() {
  const store = {
    production: {
      id: P, name: PROJECT.name, client: PROJECT.client, type: PROJECT.type,
      location: PROJECT.location, budgetTier: 'Signature', guestCount: PROJECT.guestCount,
      epId: '', leadId: 'rr_tk', budget: PROJECT.budget, notes: '',
      status: 'active', eventDate: PROJECT.eventDate, eventTime: PROJECT.eventTime,
      activeWorkstreams: ['hospitality', 'fabrication', 'av-tech', 'content', 'talent'],
    },
    workstreams, milestones: storeMilestones,
    guestList, talent, deliverables, approvals, files,
    projectNotes, pageComments, notifications,
    creative,
  }
  localStorage.setItem('field_store_v1', JSON.stringify(store))
}

function writeLocal() {
  const w = (k, v) => localStorage.setItem(L(k), JSON.stringify(v))
  w(`team_cape_${P}_v3`, capeTeam)
  w(`team_ext_${P}_v3`, extTeam)
  w(`vendors_${P}_v1`, projectVendors)
  if (projectVenue) w(`logistics_venue_${P}_v1`, projectVenue)
  w(`logistics_contacts_${P}_v1`, venueContacts)
  w(`logistics_loadins_${P}_v1`, loadins)
  w(`logistics_photos_${P}_v1`, logisticsPhotos)
  w(`timeline_${P}_v1`, timelineRows)
  w(`budget_wb_${P}_v1`, budgetWB)
  w(`budget_expenses_${P}_v1`, budgetExpenses)
  w(`budget_producing_${P}_v1`, budgetProducing)
  w(`budget_design_${P}_v1`, budgetDesign)
  w(`budget_costs_${P}_v1`, budgetCosts)
  w(`hosp_food_${P}_v1`, hospFood)
  w(`hosp_drink_${P}_v1`, hospDrink)
  w(`hosp_fb_vendors_${P}_v1`, hospVendors)
  w(`field_staffing_${P}_v1`, staffing)
  w(`avtech_cats_${P}_v1`, avCats)
  w(`fab_${P}_v1`, fabCats)
  w(`field_emails_${P}_v1`, emailThreads)
  localStorage.setItem(`field_ros_${P}_v1`, JSON.stringify(rosPhases)) // ROS key is unprefixed
}

/* Remove every localStorage key scoped to one project id */
function purgeProjectKeys(pid) {
  const doomed = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (key.startsWith('field_local_') && key.includes(`_${pid}_`)) doomed.push(key)
    if (key === `field_ros_${pid}_v1`)      doomed.push(key)
    if (key === `field_ros_view_${pid}_v1`) doomed.push(key)
  }
  doomed.forEach(k => localStorage.removeItem(k))
}

/* One-time demo environment enforcement (v2):
   1. Delete every stored project except the canonical Rage Room demo
      project, and purge all of their project-scoped data.
   2. Guarantee the Rage Room demo project exists, fully populated.
   3. Never touch master directories — they are code-level data
      (capeDirectory.js, vendorData.js, libraryData.js) and cannot be
      affected by storage cleanup.
   After this runs once, deleting Rage Room through the UI leaves a
   completely clean account: nothing re-seeds. */
const ENV_FLAG = 'field_demo_env_v2'
const BUILD_MARKER = 'field-6-timeline-guard-2026-07-06'

/* Repair any timeline records that predate the checklist/watching/progress
   fields, so the Deadline modal can never crash on legacy data. This runs on
   EVERY boot, independent of the one-time seed flag, because the crash-causing
   records may already exist in a browser that seeded on an older build. */
function migrateTimelineRecords() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !/^field_local_timeline_.+_v1$/.test(key)) continue
      let rows
      try { rows = JSON.parse(localStorage.getItem(key) || 'null') } catch { continue }
      if (!Array.isArray(rows)) continue
      let changed = false
      const fixed = rows.map(r => {
        if (!r || typeof r !== 'object') return r
        const patched = { ...r }
        if (!Array.isArray(patched.checklist))     { patched.checklist = [];     changed = true }
        if (!Array.isArray(patched.watching))      { patched.watching = [];      changed = true }
        if (!Array.isArray(patched.linkedModules)) { patched.linkedModules = []; changed = true }
        if (!Array.isArray(patched.notes))         { patched.notes = [];         changed = true }
        if (!Number.isFinite(patched.progress))      { patched.progress = 0;      changed = true }
        if (!Number.isFinite(patched.progressTotal)) { patched.progressTotal = 0; changed = true }
        if (typeof patched.description !== 'string') { patched.description = '';  changed = true }
        return patched
      })
      if (changed) localStorage.setItem(key, JSON.stringify(fixed))
    }
  } catch { /* never block boot */ }
}

export function ensureDemoSeed() {
  // Always-on: confirm which build is live, and repair legacy timeline data
  // even when the one-time seed has already run.
  try {
    if (typeof console !== 'undefined') console.log('[Fieldwork build]', BUILD_MARKER)
    if (typeof window !== 'undefined') window.__FIELDWORK_BUILD__ = BUILD_MARKER
  } catch {}
  migrateTimelineRecords()

  try {
    if (localStorage.getItem(ENV_FLAG)) return

    // 1 · Remove every project that is not the canonical demo project
    let projects = []
    try { projects = JSON.parse(localStorage.getItem('field_projects_v1') || '[]') } catch { projects = [] }
    const removed = projects.filter(p => p?.id !== DEMO_PROJECT_ID)
    removed.forEach(p => p?.id && purgeProjectKeys(p.id))
    projects = projects.filter(p => p?.id === DEMO_PROJECT_ID)

    // 2 · Drop a stale global store that belongs to a removed project
    try {
      const store = JSON.parse(localStorage.getItem('field_store_v1') || 'null')
      if (store?.production?.id && store.production.id !== DEMO_PROJECT_ID) {
        localStorage.removeItem('field_store_v1')
      }
    } catch { localStorage.removeItem('field_store_v1') }

    // 3 · Guarantee the fully-populated Rage Room demo project
    const hasCanonical = projects.length === 1
    const hasContent   = !!localStorage.getItem(L(`team_cape_${P}_v3`))
    if (!hasCanonical || !hasContent) {
      localStorage.setItem('field_projects_v1', JSON.stringify([PROJECT]))
      writeLocal()
      writeStore()
    }

    localStorage.setItem(ENV_FLAG, '1')
    localStorage.setItem(SEED_FLAG, '1')
  } catch { /* never block app boot */ }
}
