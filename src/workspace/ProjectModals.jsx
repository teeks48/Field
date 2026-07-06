/**
 * ProjectModals -- lightweight modals for project-level actions.
 * Inputs are individual useState vars (not a single form object) to prevent focus loss.
 */
import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'
import TimeSelect from '../components/TimeSelect.jsx'

const LBL = {
  fontSize:11, fontWeight:700, letterSpacing:'0.10em',
  textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5,
}

function Overlay({ children, onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:500,
        background:'rgba(10,9,8,0.45)', backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
        transition={{ duration:0.18 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'var(--surface)', border:'1px solid var(--border-med)',
          borderRadius:10, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto',
          boxShadow:'0 24px 64px rgba(10,9,8,0.22)', fontFamily:'var(--font)' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* Searchable owner picker */
function OwnerPicker({ value, onChange }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const options = CAPE_DIRECTORY.map(p => ({
    email: p.email,
    name:  `${p.firstName} ${p.lastName}`,
  }))

  const filtered = q.trim()
    ? options.filter(o => o.name.toLowerCase().includes(q.toLowerCase()))
    : options

  const selected = options.find(o => o.email === value)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const choose = opt => {
    onChange(opt.email)
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8,
        border:'1px solid var(--border)', borderRadius:4, padding:'7px 10px',
        background:'var(--surface)', cursor:'text' }}
        onClick={() => { setOpen(true); setQ('') }}>
        {selected && !open
          ? <span style={{ fontSize:13, color:'var(--ink-900)', fontWeight:500, flex:1 }}>{selected.name}</span>
          : <input
              autoFocus={open}
              value={q}
              onChange={e => { setQ(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder={selected ? selected.name : 'Search team member...'}
              style={{ flex:1, border:'none', outline:'none', background:'transparent',
                fontSize:13, color:'var(--ink-900)', fontFamily:'var(--font)', padding:0 }}
            />
        }
        {selected && (
          <button onClick={e => { e.stopPropagation(); onChange(''); setQ('') }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
              fontSize:16, lineHeight:1, padding:0 }}>x</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:50,
          background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:6,
          boxShadow:'0 8px 24px rgba(10,9,8,0.14)', maxHeight:220, overflowY:'auto' }}>
          {filtered.map(o => (
            <button key={o.email} onClick={() => choose(o)}
              style={{ width:'100%', display:'block', textAlign:'left', padding:'10px 14px',
                background: o.email === value ? 'var(--ground-dim)' : 'transparent',
                border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer',
                fontSize:13, color:'var(--ink-900)', fontFamily:'var(--font)',
                fontWeight: o.email === value ? 600 : 400 }}>
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* --- Project Settings Modal ------------------------------ */
export function ProjectSettingsModal({ production, projectId, onClose, onSave }) {
  const [name,        setName]        = useState(production?.name        || '')
  const [client,      setClient]      = useState(production?.client      || '')
  const [eventDate,   setEventDate]   = useState(production?.eventDate   || '')
  const [eventTime,   setEventTime]   = useState(production?.eventTime   || '')
  const [venue,       setVenue]       = useState(production?.venue       || '')
  const [location,    setLocation]    = useState(production?.location    || '')
  const [guestCount,  setGuestCount]  = useState(production?.guestCount  || '')
  const [totalBudget, setTotalBudget] = useState(production?.totalBudget || production?.budget || '')
  const [status,      setStatus]      = useState(production?.status      || 'active')
  const [ownerEmail,  setOwnerEmail]  = useState(production?.ownerEmail  || production?.creatorEmail || '')

  const handleSave = () => onSave({ name, client, eventDate, eventTime, venue, location, guestCount, totalBudget, status, ownerEmail })

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'22px 24px 16px', borderBottom:'1px solid var(--border)' }}>
        <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Project settings</p>
        <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:2 }}>{production?.name}</p>
      </div>

      <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Owner */}
        <div>
          <label style={LBL}>Project owner</label>
          <OwnerPicker value={ownerEmail} onChange={setOwnerEmail}/>
          <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:4 }}>
            The owner has admin access to this project and can assign roles and DRIs.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={LBL}>Project name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={LBL}>Client</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name" style={{ width:'100%' }}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={LBL}>Event date</label>
            <input value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="e.g. July 16, 2026" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={LBL}>Event time</label>
            <TimeSelect value={eventTime} onChange={setEventTime} placeholder="Select time"/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={LBL}>Venue</label>
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue name" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={LBL}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or address" style={{ width:'100%' }}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={LBL}>Guest count</label>
            <input value={guestCount} onChange={e => setGuestCount(e.target.value)} placeholder="e.g. 150" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={LBL}>Total budget</label>
            <input value={totalBudget} onChange={e => setTotalBudget(e.target.value)} placeholder="e.g. $250,000" style={{ width:'100%' }}/>
          </div>
        </div>

        <div>
          <label style={LBL}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width:'100%' }}>
            <option value="active">Active</option>
            <option value="on-schedule">On schedule</option>
            <option value="attention">Needs attention</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div style={{ padding:'14px 24px 20px', borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save changes</button>
      </div>
    </Overlay>
  )
}

export function ConfirmModal({ title, message, confirmLabel='Confirm', danger=false, onConfirm, onCancel }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ padding:'24px 24px 20px' }}>
        <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>{title}</p>
        <p style={{ fontSize:13, color:'var(--ink-600)', lineHeight:1.55 }}>{message}</p>
      </div>
      <div style={{ padding:'0 24px 20px', display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}
          style={{ padding:'9px 18px', fontSize:11, fontWeight:700, letterSpacing:'0.08em',
            textTransform:'uppercase', border:'none', borderRadius:4, cursor:'pointer',
            fontFamily:'var(--font)',
            background: danger ? 'var(--signal-red-text)' : 'var(--ink-900)',
            color:'white' }}>
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  )
}

