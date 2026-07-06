import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, A } from '../store.jsx'
import TimeSelect from '../components/TimeSelect.jsx'

/* ─────────────────────────────────────────────────────────
   Shared dark topbar — Field left, action right.
   Used on every step of the new-project flow.
   ───────────────────────────────────────────────────────── */
export function FlowTopbar({ onBack, backLabel = 'Back', showBack = true }) {
  return (
    <div style={{
      height:         44,
      background:     'var(--ink-900)',
      borderBottom:   '1px solid rgba(255,255,255,0.05)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 40px',
      flexShrink:     0,
      position:       'sticky',
      top:            0,
      zIndex:         10,
    }}>
      <span style={{
        fontFamily:    'var(--font)',
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.75)',
      }}>Field</span>

      {showBack && (
        <button
          onClick={onBack}
          style={{
            padding:       '5px 16px',
            fontSize:      12,
            fontWeight:    500,
            color:         'rgba(255,255,255,0.55)',
            background:    'transparent',
            border:        '1px solid rgba(255,255,255,0.14)',
            borderRadius:  4,
            cursor:        'pointer',
            fontFamily:    'var(--font)',
            letterSpacing: '0.01em',
            transition:    'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.82)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
          }}
        >{backLabel}</button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Type card icons
   ───────────────────────────────────────────────────────── */
const ICONS = {
  'Dinner Series':    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5.5 2v4.5a2 2 0 0 0 2 2h.5M8 8.5V14M3 2v3M3 5a2 2 0 0 0 4 0M13 2c0 2-1 3-1 4.5S13 9 13 9v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'Brand Activation': () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5l-3 1.5.5-3.5L3 6l3.5-.5L8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'Pop-Up':           () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2 8l6-5 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'Experiential':     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="7" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 12.5l2-1.5M12.5 12.5l-2-1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  'Product Launch':   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13.5S5 11 5 8c0-2.5 1.5-5 3-6 1.5 1 3 3.5 3 6s-3 5.5-3 5.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="7" r="1" fill="currentColor"/><path d="M5 9.5c-.8.7-1.8 2-1.8 3h3M11 9.5c.8.7 1.8 2 1.8 3h-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>,
  'Locally Yours':    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 9c0 0-4 3-4 5h8c0-2-4-5-4-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
}

const DEFAULT_TYPES = ['Dinner Series','Brand Activation','Pop-Up','Experiential','Product Launch','Locally Yours']

/* ─────────────────────────────────────────────────────────
   Type card
   ───────────────────────────────────────────────────────── */
function TypeCard({ label, selected, onSelect }) {
  const [hov, setHov] = useState(false)
  const Icon = ICONS[label] || ICONS['Brand Activation']

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           9,
        padding:       '12px 14px',
        border:        `1px solid ${selected ? 'var(--ink-600)' : hov ? 'var(--border-med)' : 'var(--border)'}`,
        borderRadius:  6,
        background:    selected ? 'var(--ground-dim)' : 'var(--surface)',
        color:         selected ? 'var(--ink-900)' : hov ? 'var(--ink-700)' : 'var(--ink-400)',
        fontSize:      13,
        fontWeight:    selected ? 500 : 400,
        fontFamily:    'var(--font)',
        cursor:        'pointer',
        textAlign:     'left',
        transition:    'border-color 0.12s, color 0.12s, background 0.12s',
        letterSpacing: '-0.01em',
        lineHeight:    1,
      }}
    >
      <span style={{ opacity: selected ? 0.75 : hov ? 0.55 : 0.38, flexShrink: 0, transition: 'opacity 0.12s', display:'flex' }}>
        <Icon/>
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {selected && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-700)', flexShrink: 0 }}/>
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────
   Inline custom type form
   ───────────────────────────────────────────────────────── */
function AddTypeForm({ onAdd, onCancel }) {
  const [val, setVal] = useState('')
  const submit = () => val.trim() && onAdd(val.trim())
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}
    >
      <input
        autoFocus
        value={val}
        placeholder="Type name"
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
        style={{ flex: 1, height: 42, fontSize: 13, borderRadius: 4 }}
      />
      <button onClick={submit} style={{
        height: 42, padding: '0 18px', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.10em', textTransform: 'uppercase',
        background: 'var(--ink-900)', color: 'white',
        border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)',
      }}>Add</button>
      <button onClick={onCancel} style={{
        height: 42, padding: '0 14px', fontSize: 12, fontWeight: 500,
        background: 'transparent', color: 'var(--ink-400)',
        border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)',
      }}>Cancel</button>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   Shared input style factory (focus state via React state
   to avoid relying on CSS :focus which can conflict with
   inline styles)
   ───────────────────────────────────────────────────────── */
function useInpStyle(focused) {
  return {
    width:        '100%',
    height:       44,
    background:   'var(--surface)',
    border:       `1px solid ${focused ? 'var(--ink-500)' : 'var(--border)'}`,
    borderRadius: 4,
    padding:      '0 14px',
    fontSize:     13,
    color:        'var(--ink-900)',
    fontFamily:   'var(--font)',
    outline:      'none',
    transition:   'border-color 0.12s',
  }
}

/* ─────────────────────────────────────────────────────────
   Focusable text input
   ───────────────────────────────────────────────────────── */
function Inp({ value, onChange, type = 'text', style: extra = {}, autoFocus, ...rest }) {
  const [focused, setFocused] = useState(false)
  const base = useInpStyle(focused)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoFocus={autoFocus}
      style={{ ...base, ...extra }}
      {...rest}
    />
  )
}

/* ─────────────────────────────────────────────────────────
   Icon SVGs for input adornments
   ───────────────────────────────────────────────────────── */
const CalIcon  = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 1v3M9.5 1v3M1.5 6h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const ClkIcon  = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5V7l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ArwIcon  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>

/* ─────────────────────────────────────────────────────────
   Label
   ───────────────────────────────────────────────────────── */
const LBL = {
  display: 'block', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.03em', color: 'var(--ink-500)', marginBottom: 7,
}
const OPT = { color: 'var(--ink-200)', fontWeight: 400, fontSize: 10, letterSpacing: '0.04em', marginLeft: 4 }

/* ─────────────────────────────────────────────────────────
   Main screen
   ───────────────────────────────────────────────────────── */
export default function ProductionDetails({ onNext, onCancel }) {
  const { dispatch } = useStore()

  const [form, setForm] = useState({
    name:       '',
    client:     '',
    type:       '',
    eventDate:  '',
    eventTime:  '',
    location:   '',
    venue:      '',
    budget:     '',
    guestCount: '',
  })
  const [customTypes, setCustomTypes] = useState([])
  const [addingType, setAddingType]   = useState(false)
  const allTypes = [...DEFAULT_TYPES, ...customTypes]

  const up = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Required: name, client, type, date
  const canContinue = (
    form.name.trim().length > 0 &&
    form.client.trim().length > 0 &&
    form.type.length > 0 &&
    form.eventDate.length > 0
  )

  const handleNext = () => {
    if (!canContinue) return

    const projectId = `up_${Date.now()}`  // 'up_' prefix = user project
    const eventDateStr = form.eventDate
      ? new Date(form.eventDate + 'T12:00:00')
          .toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
      : ''

    dispatch(A.updateProduction({
      id:         projectId,
      name:       form.name.trim(),
      client:     form.client.trim(),
      type:       form.type,
      eventDate:  eventDateStr,
      budget:     form.budget,
      location:   form.location,
      guestCount: Number(form.guestCount) || 0,
    }))
    if (form.venue) dispatch(A.updateVenue({ name: form.venue }))

    // Persist the new project to localStorage so it survives refresh
    // and appears in My Projects / Project Library
    try {
      const saved = JSON.parse(localStorage.getItem('field_projects_v1') || '[]')
      // Stamp the creating user as owner so they get full edit access
      let creatorEmail = ''
      try {
        const session = JSON.parse(localStorage.getItem('field_session_v1') || '{}')
        creatorEmail = session?.user?.email || ''
      } catch {}
      const newProject = {
        id:          projectId,
        name:        form.name.trim(),
        client:      form.client.trim(),
        category:    form.type || 'Event',
        location:    form.location || '',
        eventDate:   eventDateStr,
        budget:      form.budget || '',
        guestCount:  Number(form.guestCount) || 0,
        venue:       form.venue || '',
        status:      'active',
        statusLabel: 'In production',
        phase:       'Pre-production',
        lead:        '',
        leadInitials:'',
        ep:          '',
        epInitials:  '',
        team:        [],
        nextMilestone: '',
        startDate:   new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }),
        daysOut:     0,
        mine:        true,
        userCreated: true,
        creatorEmail,
      }
      // Avoid duplicates by id
      const filtered = saved.filter(p => p.id !== projectId)
      localStorage.setItem('field_projects_v1', JSON.stringify([...filtered, newProject]))
    } catch (e) {
      console.error('Failed to save project', e)
    }

    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ minHeight: '100vh', background: 'var(--ground)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}
    >
      <FlowTopbar onBack={onCancel}/>

      {/* ── Body ── */}
      <div style={{ flex: 1, maxWidth: 580, margin: '0 auto', width: '100%', padding: '56px 40px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Heading */}
          <h1 style={{
            fontFamily:'var(--font-serif)', fontSize:40, fontWeight:400,
            letterSpacing:'-0.01em', color:'var(--ink-900)', lineHeight:1.05, marginBottom:10,
          }}>Project Details</h1>
          <p style={{ fontSize:14, fontWeight:400, color:'var(--ink-400)', marginBottom:48, letterSpacing:'0.01em' }}>
            Let's start with the basics.
          </p>

          {/* Project */}
          <div style={{ marginBottom: 22 }}>
            <label style={LBL}>Project</label>
            <Inp value={form.name} onChange={e => up('name', e.target.value)} autoFocus/>
          </div>

          {/* Client */}
          <div style={{ marginBottom: 32 }}>
            <label style={LBL}>Client</label>
            <Inp value={form.client} onChange={e => up('client', e.target.value)}/>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 36 }}>
            <label style={{ ...LBL, marginBottom: 12 }}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {allTypes.map(t => (
                <TypeCard
                  key={t}
                  label={t}
                  selected={form.type === t}
                  onSelect={() => up('type', form.type === t ? '' : t)}
                />
              ))}

              <AnimatePresence mode="wait">
                {addingType ? (
                  <AddTypeForm
                    key="form"
                    onAdd={t => { setCustomTypes(p => [...p, t]); up('type', t); setAddingType(false) }}
                    onCancel={() => setAddingType(false)}
                  />
                ) : (
                  <motion.button
                    key="trigger"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setAddingType(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px',
                      border: '1px dashed var(--border-med)', borderRadius: 6,
                      background: 'transparent',
                      color: 'var(--ink-300)', fontSize: 13, fontFamily: 'var(--font)',
                      cursor: 'pointer', letterSpacing: '-0.01em', transition: 'border-color 0.12s, color 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-400)'; e.currentTarget.style.color = 'var(--ink-500)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-med)'; e.currentTarget.style.color = 'var(--ink-300)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Add custom type
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
            <div>
              <label style={LBL}>Date</label>
              <div style={{ position: 'relative' }}>
                <Inp type="date" value={form.eventDate} onChange={e => up('eventDate', e.target.value)} style={{ paddingRight: 38, colorScheme: 'light' }}/>
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-200)', pointerEvents:'none', display:'flex' }}><CalIcon/></span>
              </div>
            </div>
            <div>
              <label style={LBL}>Time <span style={OPT}>(optional)</span></label>
              <TimeSelect value={form.eventTime} onChange={v => up('eventTime', v)} placeholder="Select time"/>
            </div>
          </div>

          {/* Location + Venue */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
            <div>
              <label style={LBL}>Location <span style={OPT}>(optional)</span></label>
              <Inp value={form.location} onChange={e => up('location', e.target.value)}/>
            </div>
            <div>
              <label style={LBL}>Venue <span style={OPT}>(optional)</span></label>
              <Inp value={form.venue} onChange={e => up('venue', e.target.value)}/>
            </div>
          </div>

          {/* Budget + Guest count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 52 }}>
            <div>
              <label style={LBL}>Estimated budget <span style={OPT}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Inp
                  value={form.budget}
                  onChange={e => up('budget', e.target.value)}
                  style={{ paddingLeft: form.budget ? 28 : 14 }}
                />
                {/* $ prefix only appears once user starts typing */}
                {form.budget && (
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--ink-400)', pointerEvents:'none', fontFamily:'var(--font)' }}>$</span>
                )}
              </div>
            </div>
            <div>
              <label style={LBL}>Guest count <span style={OPT}>(optional)</span></label>
              <Inp type="number" value={form.guestCount} onChange={e => up('guestCount', e.target.value)}/>
            </div>
          </div>

          {/* Continue */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              onClick={handleNext}
              disabled={!canContinue}
              animate={{
                opacity:    canContinue ? 1 : 0.38,
                background: canContinue ? '#1A1916' : '#EDEAE4',
              }}
              whileHover={canContinue ? { opacity: 0.82 } : {}}
              whileTap={canContinue ? { scale: 0.985 } : {}}
              transition={{ duration: 0.20 }}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '11px 28px',
                color:          canContinue ? 'white' : 'var(--ink-300)',
                border:         'none',
                borderRadius:   4,
                fontSize:       14,
                fontWeight:     500,
                fontFamily:     'var(--font)',
                letterSpacing:  '-0.01em',
                cursor:         canContinue ? 'pointer' : 'default',
              }}
            >
              Continue
              <ArwIcon/>
            </motion.button>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}
