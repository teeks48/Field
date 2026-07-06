/**
 * ExportModal — PDF export UX prototype for Fieldwork
 * Mocked flow only. No real file generation.
 */
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalState } from '../useLocalState.js'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'

/* ─── Config ────────────────────────────────────────────────────────────── */

const TEMPLATES = [
  { id:'ros-client',  label:'Client-Facing Run of Show', icon:'◎', desc:'Full event timeline with venue, schedule, and hospitality — formatted for client distribution.' },
  { id:'hospitality', label:'Hospitality — Food & Drink', icon:'◑', desc:'Menu, dietary accommodations, and F&B details. Clean, client-ready format.' },
]

const SECTIONS = [
  { id:'overview',    label:'Project Overview',      default:true  },
  { id:'timeline',    label:'Timeline / Run of Show',default:true  },
  { id:'venue',       label:'Venue & Load-In',       default:true  },
  { id:'hospitality', label:'Hospitality',           default:false },
  { id:'vendors',     label:'Vendors',               default:true  },
  { id:'budget',      label:'Budget',                default:false },
  { id:'fabrication', label:'Fabrication',           default:false },
  { id:'avtech',      label:'AV / Tech',             default:false },
  { id:'attachments', label:'Attachments',           default:false },
  { id:'notes',       label:'Internal Notes',        default:false },
]

const AUDIENCES = [
  { id:'client',  label:'Client-facing',   desc:'Hides internal costs, notes, and team commentary.' },
  { id:'internal',label:'Internal team',   desc:'Full detail including internal budget, notes, and task owners.' },
  { id:'vendor',  label:'Vendor-facing',   desc:'Redacts client info, internal budget, and team notes.' },
]

const STEPS = ['template','preview','done']

const TEMPLATE_DEFAULTS = {
  'ros-client':  { sections: new Set(['overview','timeline','venue']), audience:'client' },
  'hospitality': { sections: new Set(['hospitality']), audience:'client' },
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */

function now() {
  return new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const PAD = '48px 56px'
const SECTION_GAP = 32

/* ─── Mock preview content ────────────────────────────────────────────────── */

import { readProjectVenue, readProjectBudget, readProjectRos, readHospitalityMenu, fmtUSD } from '../projectData.js'

const MOCK_TIMELINE = [
  { time:'7:00 AM',  title:'Venue Access',               desc:'Crew enters through Dock A. Building access begins.' },
  { time:'8:00 AM',  title:'Floral Theory Load-In',       desc:'Florals arrive via freight elevator. Dock A reserved.' },
  { time:'9:00 AM',  title:'Encore AV Setup',             desc:'AV crew begins LED wall build and audio setup.' },
  { time:'12:00 PM', title:'Fabrication Install',         desc:'Eventmakers crew begins main structure and feature install.' },
  { time:'2:00 PM',  title:'Catering Arrival',            desc:'Glasshouse Catering crew arrives for kitchen setup and prep.' },
  { time:'4:00 PM',  title:'Venue Walkthrough',           desc:'Full venue walkthrough with client and production leads.' },
  { time:'5:30 PM',  title:'Doors Open',                  desc:'Guest arrival begins. All crew at posts.' },
  { time:'6:30 PM',  title:'Event Begins',                desc:'Program commences. Run of show active.' },
  { time:'10:00 PM', title:'Event Concludes',             desc:'Strike begins immediately following last guest departure.' },
]

const MOCK_VENDORS = [
  { name:'Encore AV',          role:'Audio / Visual',  contact:'Marcus Chen',  phone:'212-555-0122' },
  { name:'PINCH Food Design',  role:'Catering',        contact:'Yannick Benjamin', phone:'212-555-0198' },
  { name:'Eventmakers NYC',    role:'Fabrication',     contact:'Tom Seidel',   phone:'212-555-0177' },
  { name:'Floral Theory',      role:'Florals',         contact:'Cassandra Lowe', phone:'212-555-0140' },
]

const MOCK_BUDGET = [
  { category:'AV / Tech',    budgeted:'$22,400', actual:'$22,400', variance:'—' },
  { category:'Catering',     budgeted:'$48,000', actual:'$44,200', variance:'-$3,800' },
  { category:'Fabrication',  budgeted:'$35,000', actual:'$31,500', variance:'-$3,500' },
  { category:'Florals',      budgeted:'$18,000', actual:'—',       variance:'TBD' },
  { category:'Venue Rental', budgeted:'$12,000', actual:'$12,000', variance:'—' },
  { category:'Staffing',     budgeted:'$8,500',  actual:'$8,500',  variance:'—' },
]

/* ─── PDF Preview ─────────────────────────────────────────────────────────── */

/* ─── Design tokens for PDF preview ─────────────────────────────────────── */
// Editorial, restrained, premium. System sans only — no decorative serifs.
// Hierarchy through weight, size, and space — not borders or color.
const DOC_FONT  = "'Inter', system-ui, -apple-system, sans-serif"
const DOC_FONT_MONO = "'SF Mono', 'Fira Mono', 'Courier New', monospace"
const C_INK     = '#141210'      // near-black body text
const C_MED     = '#6b6762'      // secondary text
const C_FAINT   = '#b0ada8'      // tertiary / labels
const C_RULE    = '#e4e0db'      // thin hairline rules
const C_BG      = '#faf9f7'      // page background — warm off-white
const DOC_PAD   = '64px 72px'

function PreviewPage({ children }) {
  return (
    <div style={{ background:C_BG, borderRadius:2,
      boxShadow:'0 1px 6px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.06)',
      marginBottom:24, fontFamily:DOC_FONT, width:'100%', minHeight:640,
      position:'relative' }}>
      {children}
    </div>
  )
}

function DocSection({ label, children, first }) {
  return (
    <div style={{ marginBottom:56 }}>
      {!first && <div style={{ height:'1px', background:C_RULE, marginBottom:52 }}/>}
      {label && (
        <div style={{ marginBottom:32 }}>
          {/* Large bold heading — matches platform page-title weight */}
          <h2 style={{ fontSize:28, fontWeight:800, color:C_INK,
            letterSpacing:'-0.03em', lineHeight:1.0,
            margin:0, fontFamily:DOC_FONT }}>{label}</h2>
        </div>
      )}
      {children}
    </div>
  )
}

function KVRow({ label, value, mono }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:16,
      padding:'9px 0', borderBottom:`1px solid ${C_RULE}` }}>
      <p style={{ fontSize:12, color:C_MED }}>{label}</p>
      <p style={{ fontSize:12, color:C_INK,
        fontFamily: mono ? "'SF Mono', 'Fira Mono', monospace" : 'inherit' }}>{value}</p>
    </div>
  )
}

function PreviewCover({ production, template, audience }) {
  const tpl = TEMPLATES.find(t => t.id === template)
  const docLabel = tpl?.label || 'Production Document'
  return (
    <PreviewPage>
      <div style={{ padding:'96px 80px 80px', minHeight:640, display:'flex', flexDirection:'column',
        justifyContent:'space-between' }}>

        {/* Project name + document type — all the cover needs */}
        <div>
          <h1 style={{ fontSize:64, fontWeight:800, color:C_INK, lineHeight:0.92,
            letterSpacing:'-0.04em', marginBottom:20, fontFamily:DOC_FONT }}>
            {production?.name || 'Event'}
          </h1>
          <p style={{ fontSize:18, fontWeight:400, color:C_MED, letterSpacing:'-0.01em',
            fontFamily:DOC_FONT }}>
            {docLabel}
          </p>
        </div>

        {/* Event date only */}
        <div style={{ borderTop:`1px solid ${C_RULE}`, paddingTop:32 }}>
          <p style={{ fontSize:14, fontWeight:600, color:C_INK, fontFamily:DOC_FONT }}>
            {production?.eventDate || '—'}
          </p>
        </div>
      </div>
    </PreviewPage>
  )
}

function PreviewOverview({ production, team }) {
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Project overview" first>
          {[
            ['Client',      production?.client      || '—'],
            ['Project',     production?.name        || '—'],
            ['Date',        production?.eventDate   || '—'],
            ['Time',        production?.eventTime   || '—'],
            ['Venue',       production?.venue       || '—'],
            ['Location',    production?.location    || '—'],
            ['Guest count', production?.guestCount  ? String(production.guestCount) : '—'],
            ['Budget',      production?.budget      || '—'],
          ].map(([l,v]) => <KVRow key={l} label={l} value={v}/>)}
        </DocSection>

        {team && team.length > 0 && (
          <DocSection label="Production team">
            {team.map((m, i) => <KVRow key={i} label={m.role} value={m.name}/>)}
          </DocSection>
        )}
      </div>
    </PreviewPage>
  )
}

function PreviewTimeline({ projectId }) {
  // Live-first: the same Run of Show data the ROS page uses. The demo
  // timeline only renders when the project has no ROS entries.
  const liveRows = readProjectRos(projectId).flatMap(ph => (ph.rows || []).map(r => ({
    time:  r.time || '—',
    title: r.item || 'Untitled',
    desc:  [r.owner, r.location, r.notes].filter(Boolean).join(' · '),
  })))
  const rows = liveRows.length ? liveRows : MOCK_TIMELINE
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Run of show" first>
          {rows.map((row, i) => (
            <div key={i} style={{ paddingTop:32, paddingBottom:32,
              borderBottom:`1px solid ${C_RULE}` }}>
              {/* Line 1: Time — monospace, faint, small caps feel */}
              <p style={{ fontSize:12, fontWeight:600, color:C_FAINT,
                fontFamily:"'SF Mono', 'Fira Mono', monospace",
                letterSpacing:'0.04em', marginBottom:10 }}>
                {row.time}
              </p>
              {/* Line 2: Title — bold, large, platform heading weight */}
              <p style={{ fontSize:20, fontWeight:800, color:C_INK,
                letterSpacing:'-0.025em', lineHeight:1.1,
                marginBottom:8, fontFamily:DOC_FONT }}>
                {row.title}
              </p>
              {/* Line 3: Description — lighter, body weight */}
              <p style={{ fontSize:13, fontWeight:400, color:C_MED,
                lineHeight:1.6, fontFamily:DOC_FONT }}>
                {row.desc}
              </p>
            </div>
          ))}
          <p style={{ fontSize:11, color:C_FAINT, marginTop:28 }}>
            All times subject to change without notice.
          </p>
        </DocSection>
      </div>
    </PreviewPage>
  )
}

function PreviewVenue({ projectId }) {
  // Live-first: the venue selected on the Venue page. The demo venue
  // block only renders when no venue has been selected.
  const live = readProjectVenue(projectId)
  const rows = live ? {
    venue: [
      ['Venue',            live.name],
      ['Address',          live.address || '—'],
      ['Event space',      live.floor || '—'],
      ['Venue capacity',   live.capacity ? `${live.capacity} guests` : '—'],
    ],
    loadin: [
      ['Dock access',      live.dockAddress || '—'],
      ['Dock hours',       live.dockHours || '—'],
      ['Freight elevator', [live.freightElevDims, live.freightElevWeight].filter(Boolean).join(' · ') || '—'],
      ['Building hours',   live.buildingHours || '—'],
    ],
    rules: [
      ['Power',              live.power || '—'],
      ['Noise restrictions', live.noiseRestriction || '—'],
      ['Open flame',         live.openFlame || '—'],
      ['Vendor check-in',    live.securityProcedure || '—'],
    ],
  } : {
    venue: [
      ['Venue',            'Brooklyn Tower'],
      ['Address',          '9 DeKalb Ave, Brooklyn, NY 11201'],
      ['Event space',      '12th Floor — Sky Lounge'],
      ['Venue capacity',   '250 guests'],
    ],
    loadin: [
      ['Dock access',      'Dock A — Willoughby St entrance'],
      ['Dock hours',       '8:00 AM — 6:00 PM'],
      ['Freight elevator', '84"W × 120"D × 96"H · 10,000 lb capacity'],
      ['Elevator hours',   '7:00 AM — 6:00 PM only'],
    ],
    rules: [
      ['COI',             'Required — $2M general liability minimum'],
      ['Noise curfew',    'Music off by 11:00 PM'],
      ['Open flame',      'Not permitted'],
      ['Vendor check-in', 'Lobby security desk — photo ID required'],
    ],
  }
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Venue" first>
          {rows.venue.map(([l,v]) => <KVRow key={l} label={l} value={v}/>)}
        </DocSection>
        <DocSection label="Load-in">
          {rows.loadin.map(([l,v]) => <KVRow key={l} label={l} value={v}/>)}
        </DocSection>
        <DocSection label="Building requirements">
          {rows.rules.map(([l,v]) => <KVRow key={l} label={l} value={v}/>)}
        </DocSection>
      </div>
    </PreviewPage>
  )
}

function PreviewVendors({ audience }) {
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Vendors" first>
          {MOCK_VENDORS.map((v, i) => (
            <div key={i} style={{ padding:'16px 0', borderBottom:`1px solid ${C_RULE}`,
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:C_INK, marginBottom:3 }}>{v.name}</p>
                <p style={{ fontSize:12, color:C_MED }}>{v.role}</p>
              </div>
              {audience !== 'client' && (
                <div>
                  <p style={{ fontSize:12, color:C_INK, marginBottom:2 }}>{v.contact}</p>
                  <p style={{ fontSize:12, color:C_MED, fontFamily:"'SF Mono','Fira Mono',monospace" }}>{v.phone}</p>
                </div>
              )}
            </div>
          ))}
        </DocSection>
      </div>
    </PreviewPage>
  )
}

function PreviewBudget({ projectId }) {
  // Live-first: the Budget page's working budget. The demo table only
  // renders when the project has no budget lines.
  const live = readProjectBudget(projectId)
  const rows = live.hasData
    ? live.categories.map(c => {
        const d = c.forecast - c.budget
        return {
          category: c.name,
          budgeted: fmtUSD(c.budget),
          actual:   c.forecast ? fmtUSD(c.forecast) : '—',
          variance: !c.forecast ? 'TBD' : d === 0 ? '—' : (d < 0 ? '-' : '+') + '$' + Math.abs(d).toLocaleString(),
        }
      })
    : MOCK_BUDGET
  const totals = live.hasData
    ? ['Total', fmtUSD(live.total), fmtUSD(live.forecast), '—']
    : ['Total','$143,900','$118,200','—']
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Budget" first>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 100px',
            paddingBottom:10, borderBottom:`1px solid ${C_INK}`, marginBottom:0 }}>
            {['Category','Budgeted','Actual','Variance'].map(h => (
              <p key={h} style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase',
                color:C_FAINT, fontWeight:500 }}>{h}</p>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 100px',
              padding:'10px 0', borderBottom:`1px solid ${C_RULE}` }}>
              <p style={{ fontSize:12, color:C_INK }}>{row.category}</p>
              <p style={{ fontSize:12, color:C_MED }}>{row.budgeted}</p>
              <p style={{ fontSize:12, color: row.actual === '—' ? C_FAINT : C_INK }}>{row.actual}</p>
              <p style={{ fontSize:12, color: row.variance?.startsWith('-') ? '#2d7a4a' : row.variance === 'TBD' ? C_FAINT : C_INK }}>
                {row.variance}
              </p>
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 100px',
            padding:'12px 0', borderTop:`1px solid ${C_INK}`, marginTop:1 }}>
            {totals.map((v,i) => (
              <p key={i} style={{ fontSize:12, fontWeight:600, color:C_INK }}>{v}</p>
            ))}
          </div>
        </DocSection>
      </div>
    </PreviewPage>
  )
}

function PreviewHospitality({ projectId, production }) {
  // Live-first: the menu entered on the Hospitality page. The demo copy
  // only renders when the project has no menu items.
  const menu = readHospitalityMenu(projectId)
  const food  = menu.food  || []
  const drink = menu.drink || []
  if (food.length || drink.length) {
    const courses = [...new Set(food.map(f => f.course).filter(Boolean))]
    return (
      <PreviewPage>
        <div style={{ padding:DOC_PAD }}>
          <DocSection label="Hospitality" first>
            <p style={{ fontSize:13, color:C_INK, lineHeight:1.7, marginBottom:32 }}>
              {[
                production?.guestCount ? `${production.guestCount} guests` : null,
                food.length ? `${food.length} menu item${food.length === 1 ? '' : 's'}` : null,
                drink.length ? `${drink.length} beverage${drink.length === 1 ? '' : 's'}` : null,
              ].filter(Boolean).join(' · ')}
            </p>
            {courses.map(course => food.filter(f => f.course === course).map(f => (
              <KVRow key={f.id} label={course}
                value={[f.item, f.description].filter(Boolean).join(' — ')}/>
            )))}
            {food.filter(f => !f.course).map(f => (
              <KVRow key={f.id} label="Menu"
                value={[f.item, f.description].filter(Boolean).join(' — ')}/>
            ))}
          </DocSection>
          {drink.length > 0 && (
            <DocSection label="Beverage">
              {drink.map(d => (
                <KVRow key={d.id} label={d.course || 'Beverage'}
                  value={[d.item, d.description].filter(Boolean).join(' — ')}/>
              ))}
            </DocSection>
          )}
        </div>
      </PreviewPage>
    )
  }
  return (
    <PreviewPage>
      <div style={{ padding:DOC_PAD }}>
        <DocSection label="Hospitality" first>
          <p style={{ fontSize:13, color:C_INK, lineHeight:1.7, marginBottom:32 }}>
            6-course tasting experience by PINCH Food Design. Service by Glasshouse Catering.
            112 guests · 23 dietary accommodations.
          </p>
          {[
            ['Vegan',               '4 guests'],
            ['Kosher',              '2 guests'],
            ['Gluten-free',         '6 guests'],
            ['Severe nut allergy',  '3 guests — dedicated station'],
            ['Other dietary notes', '8 guests'],
          ].map(([l,v]) => <KVRow key={l} label={l} value={v}/>)}
        </DocSection>
      </div>
    </PreviewPage>
  )
}

function LivePreview({ template, sections, audience, production, team, projectId }) {
  const tpl = TEMPLATES.find(t => t.id === template)
  return (
    <div style={{ background:'#d8d5d0', padding:'28px 24px', overflowY:'auto', flex:1 }}>
      <div style={{ maxWidth:880, margin:'0 auto' }}>
      <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'#888', textAlign:'center', marginBottom:20, fontFamily:'var(--font)' }}>
        {tpl?.label || 'Document'} preview
      </p>
      <PreviewCover production={production} template={template} audience={audience}/>
      {sections.has('overview')    && <PreviewOverview production={production} team={team}/>}
      {sections.has('timeline')    && <PreviewTimeline projectId={projectId}/>}
      {sections.has('venue')       && <PreviewVenue projectId={projectId}/>}
      {sections.has('hospitality') && <PreviewHospitality projectId={projectId} production={production}/>}
      {sections.has('vendors')     && <PreviewVendors audience={audience}/>}
      {sections.has('budget')      && <PreviewBudget projectId={projectId}/>}
      {sections.has('notes')       && (
        <PreviewPage>
          <div style={{ padding:DOC_PAD }}>
            <DocSection label="Notes" first>
              <p style={{ fontSize:12, color:C_FAINT, fontStyle:'italic' }}>
                Internal notes — not included in client or vendor copies.
              </p>
            </DocSection>
          </div>
        </PreviewPage>
      )}
      </div>
    </div>
  )
}


/* ─── Step components ───────────────────────────────────────────────────── */

function StepIndicator({ current }) {
  const steps = [
    { id:'template', label:'Template' },
    { id:'sections', label:'Sections' },
    { id:'preview',  label:'Preview'  },
    { id:'done',     label:'Done'     },
  ]
  const ci = steps.findIndex(s => s.id === current)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
              background: i <= ci ? 'var(--ink-900)' : 'var(--border-med)',
              color: i <= ci ? 'white' : 'var(--ink-400)' }}>
              {i < ci ? '✓' : i + 1}
            </div>
            <p style={{ fontSize:11, fontWeight: i === ci ? 700 : 400,
              color: i === ci ? 'var(--ink-900)' : i < ci ? 'var(--ink-500)' : 'var(--ink-300)' }}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width:24, height:1, background: i < ci ? 'var(--ink-900)' : 'var(--border)',
              margin:'0 8px' }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/* ─── Main modal ─────────────────────────────────────────────────────────── */

export { LivePreview, TEMPLATES, SECTIONS, AUDIENCES, TEMPLATE_DEFAULTS }

export default function ExportModal({ production, projectId, owner, onClose }) {
  // Read live team data from the same keys Team.jsx uses
  const pid = projectId || 'default'
  const [capeTeam] = useLocalState(`team_cape_${pid}_v3`, [])
  const [extTeam]  = useLocalState(`team_ext_${pid}_v3`,  [])

  // Resolve full CAPE profiles merged with any overrides
  const resolvedCape = useMemo(() =>
    capeTeam.map(m => {
      const dir = CAPE_DIRECTORY.find(p => p.id === m._directoryId) || {}
      return { ...dir, ...m, name: `${dir.firstName || ''} ${dir.lastName || ''}`.trim() || m.name || '—' }
    })
  , [capeTeam])

  const resolvedExt = useMemo(() =>
    extTeam.map(m => ({ ...m, name: m.name || '—' }))
  , [extTeam])

  // Build the team list for the export: owner first, then cape, then external
  const exportTeam = useMemo(() => {
    const rows = []
    if (owner) {
      rows.push({ role: 'Project Owner', name: owner.name })
    }
    resolvedCape.forEach(m => {
      const role = m.projectRole || m.title || '—'
      if (!rows.find(r => r.name === m.name)) {
        rows.push({ role, name: m.name })
      }
    })
    resolvedExt.forEach(m => {
      const role = m.projectRole || m.company || 'External'
      rows.push({ role, name: m.name })
    })
    return rows
  }, [owner, resolvedCape, resolvedExt])
  const [step,     setStep]     = useState('template')
  const [template, setTemplate] = useState('ros-client')
  const [sections, setSections] = useState(() => new Set(TEMPLATE_DEFAULTS['ros-client'].sections))
  const [audience, setAudience] = useState('client')
  const [generating, setGen]    = useState(false)
  const [copied,   setCopied]   = useState(false)

  const tpl = TEMPLATES.find(t => t.id === template)

  const pickTemplate = (id) => {
    setTemplate(id)
    const defaults = TEMPLATE_DEFAULTS[id]
    setSections(new Set(defaults.sections))
    setAudience(defaults.audience)
  }

  const toggleSection = id => {
    setSections(p => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const generate = () => {
    setGen(true)
    setTimeout(() => { setGen(false); setStep('done') }, 1800)
  }

  const copyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filename = `${(production?.name || 'Project').replace(/\s+/g,'-')}_${tpl?.label?.replace(/\s+/g,'-')}_v1.0.pdf`

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(10,9,8,0.55)',
        backdropFilter:'blur(4px)', display:'flex', alignItems:'stretch',
        justifyContent:'flex-end' }}
      onClick={onClose}>

      <motion.div initial={{ x:900 }} animate={{ x:0 }} exit={{ x:900 }}
        transition={{ duration:0.28, ease:[0.25,1,0.5,1] }}
        onClick={e => e.stopPropagation()}
        style={{ width: step === 'preview' || step === 'done' ? '82vw' : 560,
          maxWidth:'min(100vw, 1280px)', background:'var(--surface)', display:'flex', flexDirection:'column',
          boxShadow:'-16px 0 64px rgba(10,9,8,0.22)', fontFamily:'var(--font)', height:'100%',
          transition:'width 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>
                Export PDF
              </p>
              <span style={{ fontSize:11, color:'var(--ink-400)', fontWeight:500,
                padding:'2px 8px', borderRadius:2, background:'var(--ground-dim)',
                border:'1px solid var(--border)' }}>Prototype</span>
            </div>
            <button onClick={onClose}
              style={{ background:'none', border:'none', cursor:'pointer',
                color:'var(--ink-300)', fontSize:20, lineHeight:1 }}>×</button>
          </div>
          <StepIndicator current={step}/>
        </div>

        {/* Body */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* ── Step: template ── */}
          {step === 'template' && (
            <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                color:'var(--ink-400)', marginBottom:16 }}>Choose a template</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {TEMPLATES.map(t => (
                  <div key={t.id} onClick={() => pickTemplate(t.id)}
                    style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:'var(--r-sm)',
                      cursor:'pointer', transition:'all 0.1s',
                      border: template === t.id ? '2px solid var(--ink-900)' : '1px solid var(--border)',
                      background: template === t.id ? 'var(--ground-dim)' : 'var(--surface)' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)', marginBottom:3 }}>{t.label}</p>
                      <p style={{ fontSize:12, color:'var(--ink-500)', lineHeight:1.5 }}>{t.desc}</p>
                    </div>
                    {template === t.id && (
                      <div style={{ marginLeft:'auto', flexShrink:0, width:18, height:18,
                        borderRadius:'50%', background:'var(--ink-900)',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              {/* Left: doc summary */}
              <div style={{ width:220, flexShrink:0, borderRight:'1px solid var(--border)',
                padding:'20px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                    color:'var(--ink-400)', marginBottom:8 }}>Document</p>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{tpl?.label}</p>
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                    color:'var(--ink-400)', marginBottom:6 }}>File</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)', wordBreak:'break-all',
                    lineHeight:1.5, fontFamily:'var(--font-mono)' }}>{filename}</p>
                </div>
                <div style={{ marginTop:'auto' }}>
                  <button onClick={() => setStep('template')}
                    style={{ fontSize:11, color:'var(--ink-500)', background:'none', border:'none',
                      cursor:'pointer', fontFamily:'var(--font)', textAlign:'left', padding:0, fontWeight:600 }}>
                    ← Change template
                  </button>
                </div>
              </div>

              {/* Right: live preview */}
              <LivePreview template={template} sections={sections} audience={audience} production={production} team={exportTeam} projectId={projectId}/>
            </div>
          )}

          {/* ── Step: done ── */}
          {step === 'done' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              {/* Success panel */}
              <div style={{ padding:'48px 40px 32px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:20 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--signal-green-bg)',
                    border:'1px solid var(--signal-green-dot)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M5 11l4 4 8-8" stroke="var(--signal-green-dot)" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em',
                      marginBottom:4 }}>PDF generated successfully</p>
                    <p style={{ fontSize:13, color:'var(--ink-500)', lineHeight:1.55 }}>
                      {tpl?.label} · {AUDIENCES.find(a=>a.id===audience)?.label} · {sections.size} sections
                    </p>
                    <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:4,
                      fontFamily:'var(--font)', letterSpacing:'0.01em' }}>
                      {filename}
                    </p>
                  </div>
                </div>

                <div style={{ display:'flex', gap:10, marginTop:28 }}>
                  <button
                    style={{ flex:1, padding:'11px 0', fontSize:12, fontWeight:700,
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      background:'var(--ink-900)', color:'white', border:'none',
                      borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}
                    onClick={() => alert('Download would start here in the production build.')}>
                    ↓ Download PDF
                  </button>
                  <button onClick={copyLink}
                    style={{ padding:'11px 18px', fontSize:12, fontWeight:700,
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      background: copied ? 'var(--signal-green-bg)' : 'transparent',
                      color: copied ? 'var(--signal-green-text)' : 'var(--ink-700)',
                      border:'1px solid ' + (copied ? 'var(--signal-green-dot)' : 'var(--border-med)'),
                      borderRadius:4, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s' }}>
                    {copied ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button onClick={() => { setStep('preview'); setGen(false) }}
                    style={{ padding:'11px 18px', fontSize:12, fontWeight:700,
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      background:'transparent', color:'var(--ink-500)',
                      border:'1px solid var(--border-med)', borderRadius:4,
                      cursor:'pointer', fontFamily:'var(--font)' }}>
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Preview again in done state */}
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                <LivePreview template={template} sections={sections} audience={audience} production={production} team={exportTeam} projectId={projectId}/>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== 'done' && (
          <div style={{ padding:'16px 28px', borderTop:'1px solid var(--border)', flexShrink:0,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button
              onClick={() => {
                const i = STEPS.indexOf(step)
                if (i > 0) setStep(STEPS[i - 1])
                else onClose()
              }}
              style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', background:'none',
                border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
              {step === 'template' ? 'Cancel' : '← Back'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {step === 'preview' && (
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>
                  {sections.size} section{sections.size !== 1 ? 's' : ''} selected
                </p>
              )}
              {step === 'preview' ? (
                <button onClick={generate} disabled={generating}
                  style={{ padding:'10px 24px', fontSize:12, fontWeight:700,
                    letterSpacing:'0.06em', textTransform:'uppercase',
                    background: generating ? 'var(--border-med)' : 'var(--ink-900)',
                    color: generating ? 'var(--ink-400)' : 'white',
                    border:'none', borderRadius:4, cursor: generating ? 'not-allowed' : 'pointer',
                    fontFamily:'var(--font)', minWidth:160, transition:'all 0.12s' }}>
                  {generating ? 'Generating…' : 'Generate PDF'}
                </button>
              ) : (
                <button
                  onClick={() => setStep(STEPS[STEPS.indexOf(step) + 1])}
                  style={{ padding:'10px 24px', fontSize:12, fontWeight:700,
                    letterSpacing:'0.06em', textTransform:'uppercase',
                    background:'var(--ink-900)', color:'white',
                    border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
                  Preview →
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
