import React, { useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusModal from '../../components/FocusModal.jsx'
import TimeSelect  from '../../components/TimeSelect.jsx'
import { CAPE_DIRECTORY, DEPARTMENTS, REGIONS, getRegion } from '../../data/capeDirectory.js'
import { useStore } from '../../store.jsx'
import { useLocalState } from '../../useLocalState.js'

/* ─────────────────────────────────────────────────────────
   DRI areas — every meaningful module in the platform.
   This is the source of truth for the DRI picker.
   ─────────────────────────────────────────────────────── */
const DRI_AREAS = [
  'F&B',
  'AV / Tech',
  'Fabrication',
  'Hospitality',
  'Venue',
  'Creative Assets',
  'Guest List',
  'Staffing',
  'Logistics',
  'Run of Show',
  'Vendors',
  'Budget',
  'Timeline',
  'Approvals',
  'Talent',
  'Tablescape',
  'Florals',
  'Content Capture',
  'Fulfillment',
  'Shopping',
]

/* ─────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────── */
const uid = () => `_${Math.random().toString(36).slice(2,8)}`

/* ─── Avatar ─────────────────────────────────────────────── */
function Av({ initials, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--ink-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: size < 30 ? 9 : 11, fontWeight: 600, color: 'var(--ink-500)', fontFamily: 'var(--font)' }}>
      {initials || '?'}
    </div>
  )
}

/* ─── DRI area pill ──────────────────────────────────────── */
function DriPill({ label }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
      padding: '2px 8px', borderRadius: 3,
      background: 'var(--signal-amber-bg)', color: 'var(--signal-amber-text)',
      whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

/* ─── Inline editable field ──────────────────────────────── */
function InlineEdit({ value, onChange, placeholder, style = {} }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const commit = () => {
    setEditing(false)
    if (draft !== (value || '')) onChange(draft.trim() || null)
  }
  if (editing) return (
    <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} autoFocus
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) } }}
      style={{ border: 'none', outline: 'none', fontFamily: 'var(--font)', background: 'transparent',
        borderBottom: '1px solid var(--border-med)', padding: '1px 0', ...style }} />
  )
  const empty = !value?.trim()
  return (
    <span onClick={() => { setDraft(value || ''); setEditing(true) }}
      style={{ cursor: 'text', ...style, color: empty ? 'var(--ink-200)' : style.color, fontStyle: empty ? 'italic' : undefined }}>
      {empty ? placeholder : value}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────
   Member detail modal — DRI assignments + profile
   ─────────────────────────────────────────────────────── */
function MemberModal({ member, isExternal, onClose, onUpdateDri }) {
  const name = member.firstName ? `${member.firstName} ${member.lastName}` : member.name
  const [driAreas,   setDriAreas]   = useState(member.driAreas || [])
  const [driNotes,   setDriNotes]   = useState(member.driNotes || '')
  const [projectRole, setProjectRole] = useState(member.projectRole || '')
  const [saved, setSaved] = useState(false)

  const toggleDri = area => {
    setDriAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleSave = () => {
    onUpdateDri(member._uid, driAreas, driNotes, projectRole)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <FocusModal onClose={onClose} width="560px" maxWidth="600px">
      {/* Header */}
      <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Av initials={member.initials || name?.slice(0, 2).toUpperCase()} size={48} />
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink-900)', marginBottom: 3 }}>
                {name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                {isExternal
                  ? member.company || 'External collaborator'
                  : [member.title, Array.isArray(member.dept) ? member.dept.join(', ') : member.dept, member.location].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Project role */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
            color: 'var(--ink-300)', marginBottom: 6 }}>Project Role</p>
          <input
            value={projectRole}
            onChange={e => setProjectRole(e.target.value)}
            placeholder="e.g. Lead Producer, Creative Director, On-site Coordinator…"
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>
            This role is specific to this project and separate from their global title.
          </p>
        </div>

        {/* Project DRI Areas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
              color: 'var(--ink-300)' }}>DRI Areas</p>
            {driAreas.length > 0 && (
              <button onClick={() => setDriAreas([])}
                style={{ fontSize: 11, color: 'var(--ink-300)', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                Clear all
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 12 }}>
            Select every area this person is directly responsible for on this project.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {DRI_AREAS.map(area => {
              const active = driAreas.includes(area)
              return (
                <button key={area} onClick={() => toggleDri(area)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 4,
                    cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.1s',
                    border: active ? '1px solid var(--signal-amber-dot)' : '1px solid var(--border-med)',
                    background: active ? 'var(--signal-amber-bg)' : 'transparent',
                    color: active ? 'var(--signal-amber-text)' : 'var(--ink-500)' }}>
                  {active && '✓ '}{area}
                </button>
              )
            })}
          </div>
          {driAreas.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 10 }}>
              {driAreas.length} area{driAreas.length !== 1 ? 's' : ''} assigned
            </p>
          )}
        </div>

        {/* Responsibilities notes */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
            color: 'var(--ink-300)', marginBottom: 6 }}>Responsibilities / notes</p>
          <textarea value={driNotes} onChange={e => setDriNotes(e.target.value)}
            placeholder="Describe their specific responsibilities on this project…"
            style={{ width: '100%', minHeight: 80, resize: 'vertical', fontSize: 13, lineHeight: 1.65,
              borderRadius: 4, border: '1px solid var(--border)', padding: '9px 11px',
              outline: 'none', fontFamily: 'var(--font)', color: 'var(--ink-900)',
              background: 'var(--surface)' }} />
        </div>

        {/* Contact info */}
        {[
          ['Email',    member.email],
          ['Phone',    member.phone],
          ['Location', member.location],
          ...(member.company ? [['Company', member.company]] : []),
        ].filter(([, v]) => v).length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
              color: 'var(--ink-300)', marginBottom: 8 }}>Contact</p>
            {[
              ['Email',    member.email],
              ['Phone',    member.phone],
              ['Location', member.location],
              ...(member.company ? [['Company', member.company]] : []),
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>{l}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-800)',
                  textAlign: 'right', wordBreak: 'break-all', maxWidth: 280 }}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Notes (external) */}
        {member.notes && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
              color: 'var(--ink-300)', marginBottom: 6 }}>Notes</p>
            <p style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.65 }}>{member.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ padding: '8px 18px', fontSize: 12, fontWeight: 500, background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
            color: 'var(--ink-500)', fontFamily: 'var(--font)' }}>Cancel</button>
        <button onClick={handleSave}
          style={{ padding: '8px 24px', fontSize: 12, fontWeight: 700,
            background: saved ? 'var(--signal-green-dot)' : 'var(--ink-900)',
            color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font)', transition: 'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save DRI'}
        </button>
      </div>
    </FocusModal>
  )
}

/* ─────────────────────────────────────────────────────────
   Add team member picker
   ─────────────────────────────────────────────────────── */
function AddMemberPicker({ assignedDirectoryIds, onAdd, onClose, directoryOverrides }) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('All')
  const [region, setRegion] = useState('All')
  const [added, setAdded] = useState(new Set())
  const inputRef = useRef(null)

  const DEPT_OPTS = ['All', ...DEPARTMENTS]
  const REGION_OPTS = REGIONS

  const directory = useMemo(() =>
    CAPE_DIRECTORY.map(p => ({ ...p, ...(directoryOverrides[p.id] || {}) }))
  , [directoryOverrides])

  const filtered = useMemo(() => directory
    .filter(p => !assignedDirectoryIds.includes(p.id) && !added.has(p.id))
    .filter(p => {
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!`${p.firstName} ${p.lastName}`.toLowerCase().includes(q) &&
            !(p.title || '').toLowerCase().includes(q) &&
            !(Array.isArray(p.dept) && p.dept.some(d => d.toLowerCase().includes(q)))) return false
      }
      if (dept !== 'All' && !(Array.isArray(p.dept) && p.dept.includes(dept))) return false
      if (region !== 'All' && getRegion(p.location) !== region) return false
      return true
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
  , [directory, query, dept, region, assignedDirectoryIds, added])

  const handleAdd = person => {
    setAdded(prev => new Set([...prev, person.id]))
    onAdd(person)
  }

  const sel = { fontSize: 12, height: 30, padding: '0 8px', border: '1px solid var(--border)',
    borderRadius: 3, fontFamily: 'var(--font)', background: 'var(--surface)',
    color: 'var(--ink-600)', outline: 'none', cursor: 'pointer' }

  return (
    <FocusModal onClose={onClose} width="580px" maxWidth="640px">
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em', marginBottom: 4 }}>
              Add team member
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Select from the CAPE directory to add to this project.</p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
          background: 'var(--ground-dim)', border: '1px solid var(--border)', borderRadius: 4, height: 36, marginBottom: 10 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1" />
            <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <input ref={inputRef} autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, title, department…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--ink-800)', fontFamily: 'var(--font)' }} />
          {query && <button onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 14, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={dept} onChange={e => setDept(e.target.value)} style={sel}>
            {DEPT_OPTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={region} onChange={e => setRegion(e.target.value)} style={sel}>
            {REGION_OPTS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(person => (
          <div key={person.id}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
              borderBottom: '1px solid var(--border)', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Av initials={person.initials} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 2, letterSpacing: '-0.01em' }}>
                {person.firstName} {person.lastName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>
                {[person.title, Array.isArray(person.dept) ? person.dept.join(', ') : person.dept, person.location].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button onClick={() => handleAdd(person)}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)',
                background: 'var(--surface)', border: '1px solid var(--border-med)', borderRadius: 4,
                cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-900)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--ink-900)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink-700)'; e.currentTarget.style.borderColor = 'var(--border-med)' }}>
              Add to project
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-200)' }}>
              {query ? `No results for "${query}"` : 'All team members already assigned'}
            </p>
          </div>
        )}
      </div>
    </FocusModal>
  )
}

/* ─── Add external collaborator form ────────────────────── */
function AddExternalModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', company: '', projectRole: '', email: '', phone: '', notes: '' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const inp = { fontSize: 13, height: 34, padding: '0 10px', border: '1px solid var(--border)',
    borderRadius: 3, fontFamily: 'var(--font)', background: 'var(--surface)',
    color: 'var(--ink-900)', outline: 'none', width: '100%' }
  const save = () => {
    if (!form.name.trim()) return
    onAdd({ ...form, _uid: uid(), type: 'external', driAreas: [], driNotes: '',
      initials: form.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() })
    onClose()
  }
  return (
    <FocusModal onClose={onClose} width="480px" maxWidth="520px">
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em', marginBottom: 4 }}>Add external collaborator</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Project-specific only · Not added to company directory</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ padding: '18px 24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['Full name', 'name'], ['Company', 'company'], ['Project role', 'projectRole'], ['Phone', 'phone']].map(([l, k]) => (
            <div key={k}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 5 }}>{l}</p>
              <input value={form[k]} onChange={set(k)} style={inp} placeholder={l} autoFocus={k === 'name'} />
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 5 }}>Email</p>
            <input value={form.email} onChange={set('email')} style={inp} placeholder="email@example.com" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 5 }}>Notes</p>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'none', lineHeight: 1.6 }}
              placeholder="Scope, dates, any project-specific context…" />
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
        <button onClick={onClose} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--ink-500)', fontFamily: 'var(--font)' }}>Cancel</button>
        <button onClick={save} style={{ padding: '8px 22px', fontSize: 12, fontWeight: 700, background: 'var(--ink-900)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>Add collaborator</button>
      </div>
    </FocusModal>
  )
}

/* ─────────────────────────────────────────────────────────
   Team row — shared for both CAPE and external
   ─────────────────────────────────────────────────────── */
function TeamRow({ member, isExternal, directoryDept, onClick, onRemove }) {
  const [hov, setHov] = useState(false)
  const name = member.firstName ? `${member.firstName} ${member.lastName}` : member.name
  const driAreas = member.driAreas || []

  // Dept always comes from the live directory snapshot passed in — never from the stored member
  const depts = isExternal
    ? []
    : (Array.isArray(directoryDept) ? directoryDept : [directoryDept].filter(Boolean))

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'grid',
        gridTemplateColumns: 'minmax(0,2fr) 140px 120px minmax(0,1.5fr) 32px',
        gap: 20, padding: '13px 0', borderBottom: '1px solid var(--border)',
        cursor: 'pointer', alignItems: 'center',
        background: hov ? 'rgba(0,0,0,0.012)' : 'transparent', transition: 'background 0.1s' }}>

      {/* Team Member — avatar + name + location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Av initials={member.initials || name?.slice(0, 2).toUpperCase()} size={32} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em', marginBottom: 1 }}>{name}</p>
          <p style={{ fontSize: 11, color: 'var(--ink-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isExternal ? member.company || 'External' : member.location || ''}
          </p>
        </div>
      </div>

      {/* Role */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--ink-700)', fontWeight: member.projectRole ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.projectRole || member.title || member.role || (isExternal ? member.company || '—' : '—')}
        </p>
      </div>

      {/* Dept */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {isExternal
          ? <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--ink-400)', background: 'var(--ground-dim)', padding: '2px 7px', borderRadius: 2 }}>External</span>
          : depts.length > 0
            ? depts.map(d => (
                <span key={d} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--signal-blue-text)', background: 'var(--signal-blue-bg)', padding: '2px 7px', borderRadius: 2 }}>{d}</span>
              ))
            : <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>—</span>
        }
      </div>

      {/* DRI areas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {driAreas.length === 0
          ? <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>—</span>
          : <>
              {driAreas.slice(0, 3).map(a => <DriPill key={a} label={a} />)}
              {driAreas.length > 3 && (
                <span style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 500 }}>+{driAreas.length - 3}</span>
              )}
            </>
        }
      </div>

      <motion.div animate={{ opacity: hov ? 1 : 0 }} transition={{ duration: 0.1 }}
        style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <button
          onClick={e => { e.stopPropagation(); onRemove?.() }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
            fontSize:16, lineHeight:1, padding:'2px 4px', borderRadius:3,
            transition:'color 0.1s', fontFamily:'var(--font)' }}
          title="Remove from project"
          onMouseEnter={e => e.currentTarget.style.color = 'var(--signal-red-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-300)'}
        >×</button>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main page
   ─────────────────────────────────────────────────────── */
/* ─── Staffing Plan ───────────────────────────────────────────
   Three views: Day (default) → Week → Month
   Storage: field_staffing_{projectId}_v1
   Shape: [{ memberId, memberName, role, shifts: [{ date, start, end }] }]
   ─────────────────────────────────────────────────────────── */

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7)  // 7AM – 11PM
const HOUR_LABELS = HOURS.map(h => {
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${((h - 1) % 12) + 1}${ampm}`
})
const DAY_NAMES_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_NAMES_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Phase colors reused for members (cycling)
const MEMBER_COLORS = [
  { bg:'rgba(61,122,74,0.14)',   text:'#2A6038', bar:'#3D7A4A'  },
  { bg:'rgba(60,100,200,0.12)',  text:'#1A3A90', bar:'#3C64C8'  },
  { bg:'rgba(200,168,64,0.15)',  text:'#7A5808', bar:'#C8A840'  },
  { bg:'rgba(130,60,190,0.12)', text:'#5A1A8A', bar:'#823CBE'  },
  { bg:'rgba(30,160,160,0.12)',  text:'#0A5858', bar:'#1EA0A0'  },
  { bg:'rgba(210,100,30,0.12)',  text:'#8A3A08', bar:'#D2641E'  },
  { bg:'rgba(184,48,48,0.11)',   text:'#7A1818', bar:'#B83030'  },
  { bg:'rgba(100,100,100,0.10)',text:'#3A3A3A', bar:'#646464'  },
]
const mc = i => MEMBER_COLORS[i % MEMBER_COLORS.length]

// "09:00" → "9 AM", "13:30" → "1:30 PM"
function fmtShiftTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = ((h % 12) || 12)
  return `${h12}${m > 0 ? ':' + String(m).padStart(2,'0') : ''} ${ampm}`
}

function timeToDecimal(str) {
  // "09:00" → 9.0, "14:30" → 14.5
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  return h + (m || 0) / 60
}
function decimalToLabel(d) {
  const h = Math.floor(d)
  const m = Math.round((d - h) * 60)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = ((h - 1 + 12) % 12) + 1
  return `${h12}${m > 0 ? ':' + String(m).padStart(2,'0') : ''} ${ampm}`
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function startOfWeek(date) {
  const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d
}
function isoDate(date) {
  return date.toISOString().slice(0, 10)
}
function sameDay(a, b) {
  return isoDate(a) === isoDate(b)
}

/* ─── Shift editor popover ──────────────────────────────────── */
function ShiftPopover({ memberName, date, shift, onSave, onDelete, onClose }) {
  const [start,  setStart]  = useState(shift?.start  || '09:00')
  const [end,    setEnd]    = useState(shift?.end    || '18:00')
  const [onSite, setOnSite] = useState(shift?.onSite ?? true)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(10,9,8,0.35)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:8,
        padding:'22px 24px', width:280, boxShadow:'0 16px 48px rgba(10,9,8,0.22)',
      }}>
        <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', marginBottom:3 }}>{memberName}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:18 }}>
          {new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:5 }}>Start</p>
            <TimeSelect value={start} onChange={setStart} placeholder="Start time"/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:5 }}>End</p>
            <TimeSelect value={end} onChange={setEnd} placeholder="End time"/>
          </div>
        </div>

        {/* On-site checkbox */}
        <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
          marginBottom:16, background:'var(--ground-dim)', borderRadius:'var(--r-sm)',
          border:'1px solid var(--border)', cursor:'pointer' }}>
          <input type="checkbox" checked={onSite} onChange={e => setOnSite(e.target.checked)}
            style={{ width:15, height:15, accentColor:'var(--ink-900)', cursor:'pointer', flexShrink:0 }}/>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', lineHeight:1.2 }}>On-site</p>
            <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:1 }}>Team member will be at the venue</p>
          </div>
        </label>

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={() => { onSave(start, end, onSite); onClose() }}>
            Save shift
          </button>
          {shift && (
            <button className="btn-secondary" onClick={() => { onDelete(); onClose() }} style={{ color:'var(--signal-red-text)' }}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Day view ────────────────────────────────────────────────
   Horizontal timeline 7AM–11PM, each row = one team member,
   shift shown as a colored bar. Overlaps visible at a glance.
   ─────────────────────────────────────────────────────────── */
function DayView({ staffing, allMembers, date, onEditShift, isViewOnly }) {
  const dayStr  = isoDate(date)
  // No fixed colW — hours stretch to fill full page width via CSS grid

  return (
    <div>
      {/* Hour ruler */}
      <div style={{ display:'grid', gridTemplateColumns:'180px repeat(17, 1fr)',
        borderBottom:'1px solid var(--border)', marginBottom:0 }}>
        <div/>
        {HOURS.map((h, i) => (
          <div key={h} style={{ borderLeft:'1px solid var(--border)',
            padding:'6px 6px 6px', fontSize:11, fontWeight:600, color:'var(--ink-400)',
            letterSpacing:'0.02em', fontFamily:'var(--font-mono)' }}>
            {HOUR_LABELS[i]}
          </div>
        ))}
      </div>

      {/* Member rows */}
      {allMembers.length === 0 ? (
        <div style={{ padding:'40px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic', color:'var(--ink-200)' }}>
            No team members yet.
          </p>
        </div>
      ) : allMembers.map((m, mi) => {
        const entry = staffing.find(s => s.memberId === m._uid)
        const shift = entry?.shifts?.find(sh => sh.date === dayStr)
        const c     = mc(mi)
        const startD = shift ? timeToDecimal(shift.start) : null
        const endD   = shift ? timeToDecimal(shift.end)   : null

        return (
          <div key={m._uid} style={{ display:'grid',
            gridTemplateColumns:'180px 1fr',
            borderBottom:'1px solid var(--border)', minHeight:44, alignItems:'center' }}>
            {/* Name */}
            <div style={{ width:180, flexShrink:0, padding:'8px 12px 8px 0' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {m.name || `${m.firstName||''} ${m.lastName||''}`.trim()}
              </p>
              <p style={{ fontSize:10, color:'var(--ink-400)' }}>
                {m.role || m.title || m.dept?.[0] || ''}
              </p>
            </div>

            {/* Timeline — uses CSS grid to match ruler, bar overlaid absolutely */}
            <div style={{ position:'relative', display:'grid',
              gridTemplateColumns:'repeat(17, 1fr)', flex:1, height:44 }}>
              {/* Grid lines */}
              {HOURS.map(h => (
                <div key={h} style={{ height:'100%', borderLeft:'1px solid var(--border)' }}/>
              ))}

              {/* Shift bar — spans correct fraction of total width */}
              {shift && startD !== null && endD !== null && (() => {
                const totalHours = HOURS.length
                const leftPct  = ((startD - HOURS[0]) / totalHours) * 100
                const widthPct = Math.max(((endD - startD) / totalHours) * 100, 1)
                return (
                  <div
                    onClick={() => !isViewOnly && onEditShift(m, dayStr, shift)}
                    style={{
                      position:'absolute',
                      left:`${leftPct}%`, width:`${widthPct}%`,
                      top:6, bottom:6, borderRadius:4,
                      background: c.bar, opacity:0.85, zIndex:2,
                      cursor: isViewOnly ? 'default' : 'pointer',
                      display:'flex', alignItems:'center', paddingLeft:8, overflow:'hidden',
                      transition:'opacity 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity='1'}
                    onMouseLeave={e => e.currentTarget.style.opacity='0.85'}
                    title={`${fmtShiftTime(shift.start)} – ${fmtShiftTime(shift.end)}`}
                  >
                    <span style={{ fontSize:11, fontWeight:600, color:'white', whiteSpace:'nowrap' }}>
                      {fmtShiftTime(shift.start)} – {fmtShiftTime(shift.end)}
                    </span>
                  </div>
                )
              })()}

              {/* Click empty to add shift */}
              {!shift && !isViewOnly && (
                <div onClick={() => onEditShift(m, dayStr, null)}
                  style={{ position:'absolute', inset:0, cursor:'pointer', zIndex:1,
                    transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  title="Add shift"/>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Week view ───────────────────────────────────────────────
   7 day columns, each person = one row, filled cells = staffed days.
   ─────────────────────────────────────────────────────────── */
function WeekView({ staffing, allMembers, weekStart, onEditShift, isViewOnly }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div style={{ overflowX:'auto' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:`180px repeat(7, 1fr)`,
        borderBottom:'1.5px solid var(--ink-900)', marginBottom:0 }}>
        <div style={{ padding:'6px 0 8px', fontSize:10, fontWeight:700,
          letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)' }}>Team member</div>
        {days.map((d, i) => {
          const isToday = sameDay(d, new Date())
          return (
            <div key={i} style={{ padding:'6px 8px 8px', textAlign:'center' }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                color: isToday ? 'var(--signal-amber-text)' : 'var(--ink-300)' }}>
                {DAY_NAMES_SHORT[d.getDay()]}
              </p>
              <p style={{ fontSize:12, fontWeight: isToday ? 800 : 500,
                color: isToday ? 'var(--signal-amber-text)' : 'var(--ink-500)',
                background: isToday ? 'var(--signal-amber-bg)' : 'none',
                borderRadius:3, padding: isToday ? '1px 5px' : 0, display:'inline-block' }}>
                {d.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Rows */}
      {allMembers.length === 0 ? (
        <div style={{ padding:'40px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic', color:'var(--ink-200)' }}>
            No team members yet.
          </p>
        </div>
      ) : allMembers.map((m, mi) => {
        const entry = staffing.find(s => s.memberId === m._uid)
        const c = mc(mi)
        return (
          <div key={m._uid} style={{ display:'grid',
            gridTemplateColumns:`180px repeat(7, 1fr)`,
            borderBottom:'1px solid var(--border)', minHeight:48, alignItems:'center' }}>
            <div style={{ padding:'8px 12px 8px 0' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {m.name || `${m.firstName||''} ${m.lastName||''}`.trim()}
              </p>
              <p style={{ fontSize:10, color:'var(--ink-400)' }}>
                {m.role || m.title || m.dept?.[0] || ''}
              </p>
            </div>
            {days.map((d, di) => {
              const dayStr = isoDate(d)
              const shift  = entry?.shifts?.find(sh => sh.date === dayStr)
              return (
                <div key={di} style={{ padding:4, height:48, display:'flex', alignItems:'center',
                  borderLeft:'1px solid var(--border)' }}>
                  {shift ? (
                    <div onClick={() => !isViewOnly && onEditShift(m, dayStr, shift)}
                      style={{ width:'100%', height:32, borderRadius:4, background:c.bar,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor: isViewOnly ? 'default' : 'pointer', opacity:0.85, transition:'opacity 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='0.85'}
                      title={`${shift.start} – ${shift.end}`}>
                      <span style={{ fontSize:10, fontWeight:700, color:'white' }}>
                        {fmtShiftTime(shift.start)}–{fmtShiftTime(shift.end)}
                      </span>
                    </div>
                  ) : (
                    !isViewOnly && (
                      <div onClick={() => onEditShift(m, dayStr, null)}
                        style={{ width:'100%', height:32, borderRadius:4, cursor:'pointer',
                          border:'1.5px dashed var(--border)', display:'flex', alignItems:'center',
                          justifyContent:'center', transition:'all 0.1s', color:'var(--ink-200)' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--ink-400)';e.currentTarget.style.color='var(--ink-400)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--ink-200)'}}
                        title="Add shift">
                        <span style={{ fontSize:14 }}>+</span>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Month view ──────────────────────────────────────────────
   Calendar grid. Each cell shows avatar dots for who's working.
   ─────────────────────────────────────────────────────────── */
function MonthView({ staffing, allMembers, monthDate, onEditShift, isViewOnly }) {
  const year  = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const dim   = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let i = 1; i <= dim; i++) days.push(new Date(year, month, i))

  return (
    <div>
      {/* Day name headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
        borderBottom:'1.5px solid var(--ink-900)', marginBottom:0 }}>
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} style={{ padding:'6px 8px 8px', fontSize:10, fontWeight:700,
            letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)',
            textAlign:'center' }}>{d}</div>
        ))}
      </div>

      {/* Cell grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
        gridAutoRows:'minmax(80px, auto)' }}>
        {days.map((day, i) => {
          if (!day) return (
            <div key={`pad${i}`} style={{ borderRight:'1px solid var(--border)',
              borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.015)' }}/>
          )
          const dayStr  = isoDate(day)
          const isToday = sameDay(day, new Date())
          const working = allMembers
            .map((m, mi) => {
              const entry = staffing.find(s => s.memberId === m._uid)
              const shift = entry?.shifts?.find(sh => sh.date === dayStr)
              return shift ? { m, mi, shift } : null
            })
            .filter(Boolean)

          return (
            <div key={dayStr} style={{ borderRight:'1px solid var(--border)',
              borderBottom:'1px solid var(--border)', padding:'6px',
              background: isToday ? 'rgba(200,168,64,0.04)' : 'transparent' }}>
              <p style={{ fontSize:11, fontWeight: isToday ? 800 : 500, marginBottom:6,
                color: isToday ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                background: isToday ? 'var(--signal-amber-bg)' : 'none',
                borderRadius:3, padding: isToday ? '1px 5px' : 0, display:'inline-block' }}>
                {day.getDate()}
              </p>
              {/* Avatar/name chips for who's working */}
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {working.slice(0, 4).map(({ m, mi, shift }) => {
                  const c    = mc(mi)
                  const name = m.name || `${m.firstName||''} ${m.lastName||''}`.trim()
                  // Format times as "6AM–9PM" style
                  const fmtTime = t => {
                    if (!t) return ''
                    const [h, min] = t.split(':').map(Number)
                    const ampm = h >= 12 ? 'PM' : 'AM'
                    const h12  = ((h % 12) || 12)
                    return `${h12}${min > 0 ? ':'+String(min).padStart(2,'0') : ''}${ampm}`
                  }
                  const timeStr = shift.start && shift.end
                    ? `${fmtTime(shift.start)}–${fmtTime(shift.end)}` : ''
                  return (
                    <div key={m._uid}
                      onClick={() => !isViewOnly && onEditShift(m, dayStr, shift)}
                      style={{ background:c.bg, borderLeft:`2px solid ${c.bar}`,
                        borderRadius:2, padding:'3px 5px', cursor: isViewOnly ? 'default' : 'pointer',
                        overflow:'hidden', transition:'opacity 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='0.7'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                      title={`${name}: ${shift.start}–${shift.end}`}>
                      <p style={{ fontSize:10, fontWeight:600, color:c.text,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {name.split(' ')[0]}
                        {timeStr && <span style={{ fontWeight:400, opacity:0.75, marginLeft:4 }}>{timeStr}</span>}
                      </p>
                    </div>
                  )
                })}
                {working.length > 4 && (
                  <p style={{ fontSize:10, color:'var(--ink-300)', paddingLeft:2 }}>
                    +{working.length - 4} more
                  </p>
                )}
                {/* Add shift for unscheduled — show on hover, placeholder */}
                {working.length === 0 && !isViewOnly && (
                  <div style={{ height:18 }}/>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── StaffingPlan root ───────────────────────────────────── */
function StaffingPlan({ projectId, allMembers, isViewOnly }) {
  const storageKey = `field_staffing_${projectId}_v1`
  const [staffing, setStaffing] = useLocalState(storageKey, [])
  const [view,     setView]     = useState('day')     // 'day' | 'week' | 'month'
  const [cursor,   setCursor]   = useState(() => new Date())
  const [editing,  setEditing]  = useState(null)      // { member, date, shift }

  const today = new Date()

  const weekStart  = startOfWeek(cursor)
  const monthLabel = `${['January','February','March','April','May','June','July','August','September','October','November','December'][cursor.getMonth()]} ${cursor.getFullYear()}`
  const weekLabel  = `Week of ${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`
  const dayLabel   = cursor.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})

  const navigate = dir => {
    setCursor(prev => {
      const d = new Date(prev)
      if (view === 'day')   d.setDate(d.getDate() + dir)
      if (view === 'week')  d.setDate(d.getDate() + dir * 7)
      if (view === 'month') d.setMonth(d.getMonth() + dir)
      return d
    })
  }
  const goToday = () => setCursor(new Date())

  const handleEditShift = useCallback((member, date, shift) => {
    setEditing({ member, date, shift })
  }, [])

  const saveShift = useCallback((memberId, memberName, date, start, end, onSite = true) => {
    setStaffing(prev => {
      const existing = prev.find(s => s.memberId === memberId)
      if (existing) {
        const hasShift = existing.shifts.find(sh => sh.date === date)
        return prev.map(s => s.memberId === memberId ? {
          ...s, shifts: hasShift
            ? s.shifts.map(sh => sh.date === date ? { ...sh, start, end, onSite } : sh)
            : [...s.shifts, { date, start, end, onSite }]
        } : s)
      }
      return [...prev, { memberId, memberName, shifts: [{ date, start, end, onSite }] }]
    })
  }, [setStaffing])

  const deleteShift = useCallback((memberId, date) => {
    setStaffing(prev => prev.map(s => s.memberId === memberId
      ? { ...s, shifts: s.shifts.filter(sh => sh.date !== date) }
      : s
    ))
  }, [setStaffing])

  // View label
  const label = view === 'day' ? dayLabel : view === 'week' ? weekLabel : monthLabel

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {/* View switcher */}
        <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginRight:8 }}>
          {[['day','Day'],['week','Week'],['month','Month']].map(([id,lbl]) => (
            <button key={id} onClick={() => setView(id)}
              style={{ padding:'7px 16px', fontSize:11, fontWeight: view===id ? 700 : 500,
                background: view===id ? 'var(--ink-900)' : 'transparent',
                color: view===id ? 'white' : 'var(--ink-500)',
                border:'none', borderRight:'1px solid var(--border)', cursor:'pointer',
                fontFamily:'var(--font)', letterSpacing:'0.04em' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Period nav */}
        <button onClick={() => navigate(-1)}
          style={{ background:'none', border:'1px solid var(--border)', borderRadius:4,
            padding:'5px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>‹</button>
        <button onClick={() => navigate(1)}
          style={{ background:'none', border:'1px solid var(--border)', borderRadius:4,
            padding:'5px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>›</button>

        <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em', flex:1 }}>
          {label}
        </p>

        <button onClick={goToday}
          style={{ fontSize:11, fontWeight:600, padding:'5px 12px',
            background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:4,
            cursor:'pointer', fontFamily:'var(--font)', color:'var(--ink-600)' }}>Today</button>
      </div>

      {/* Member color legend */}
      {allMembers.length > 0 && (
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
          {allMembers.map((m, mi) => {
            const c    = mc(mi)
            const name = m.name || `${m.firstName||''} ${m.lastName||''}`.trim()
            return (
              <div key={m._uid} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c.bar }}/>
                <span style={{ fontSize:11, color:'var(--ink-700)', fontWeight:500 }}>{name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* View */}
      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        {view === 'day' && (
          <DayView staffing={staffing} allMembers={allMembers}
            date={cursor} onEditShift={handleEditShift} isViewOnly={isViewOnly}/>
        )}
        {view === 'week' && (
          <WeekView staffing={staffing} allMembers={allMembers}
            weekStart={weekStart} onEditShift={handleEditShift} isViewOnly={isViewOnly}/>
        )}
        {view === 'month' && (
          <MonthView staffing={staffing} allMembers={allMembers}
            monthDate={cursor} onEditShift={handleEditShift} isViewOnly={isViewOnly}/>
        )}
      </div>

      {/* Shift editor popover */}
      {editing && (
        <ShiftPopover
          memberName={editing.member.name || `${editing.member.firstName||''} ${editing.member.lastName||''}`.trim()}
          date={editing.date}
          shift={editing.shift}
          onSave={(start, end, onSite) => saveShift(editing.member._uid,
            editing.member.name || `${editing.member.firstName||''} ${editing.member.lastName||''}`.trim(),
            editing.date, start, end, onSite)}
          onDelete={() => deleteShift(editing.member._uid, editing.date)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export default function Team({ projectId: projectIdProp, currentUser, isViewOnly, production }) {
  const { state } = useStore()

  // Use the projectId passed from WorkspaceShell (derived from activeProject.id).
  // Fall back to state.production.id only if no prop is provided.
  // This is the fix for "same team showing on every project" — each project
  // gets its own localStorage key and its own isolated team list.
  const projectId = projectIdProp || state.production.id

  // Project-scoped: each project starts with an empty team.
  // TeamAssignment writes directly to these same keys during project creation.
  const [capeTeam, setCapeTeam] = useLocalState(`team_cape_${projectId}_v3`, [])
  const [extTeam,  setExtTeam]  = useLocalState(`team_ext_${projectId}_v3`,  [])

  const [showPicker,  setShowPicker]  = useState(false)
  const [showExtForm, setShowExtForm] = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [activeTab,   setActiveTab]   = useState('team')  // 'team' | 'staffing'

  const assignedDirectoryIds = capeTeam.map(m => m._directoryId).filter(Boolean)

  const addFromDirectory = person => {
    setCapeTeam(prev => [...prev, {
      ...person, _uid: uid(), _directoryId: person.id, driAreas: [], driNotes: '',
    }])
  }

  // Update DRI areas + notes — project-specific, does NOT touch the global directory
  const updateDri = (uid, driAreas, driNotes, projectRole) => {
    setCapeTeam(prev => prev.map(m => m._uid === uid ? { ...m, driAreas, driNotes, projectRole } : m))
    setExtTeam(prev => prev.map(m => m._uid === uid ? { ...m, driAreas, driNotes, projectRole } : m))
  }

  const allMembers = [...capeTeam, ...extTeam]

  return (
    <div className="page-content-wide">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 8 }}>
              Project · Team
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800,
              letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 10 }}>
              <span style={{ color: 'var(--ink-900)' }}>Team</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>
              Directly Responsible Individuals for each project area.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowExtForm(true)}
              style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', background: 'transparent', color: 'var(--ink-600)',
                border: '1px solid var(--border-med)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + External
            </button>
            <button onClick={() => setShowPicker(true)}
              style={{ padding: '9px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', background: 'var(--ink-900)', color: 'white',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + Add team member
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="tabs" style={{ marginBottom:24 }}>
          {[['team','Team DRIs'],['staffing','Schedule Plan']].map(([id,lbl]) => (
            <button key={id} className={`tab${activeTab===id?' active':''}`}
              onClick={() => setActiveTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── Team DRIs tab ── */}
        {activeTab === 'team' && (<>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--border)',
          borderRadius: 4, overflow: 'hidden', marginBottom: 28, maxWidth: 'var(--cap-panel)' }}>
          {[
            { label: 'CAPE team',  value: capeTeam.length, sub: 'Internal staff', dark: true },
            { label: 'External',   value: extTeam.length,  sub: 'Collaborators' },
            { label: 'Total',      value: allMembers.length, sub: 'On this project' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 18px', borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              background: s.dark ? 'var(--ink-900)' : 'var(--ground-dim)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
                color: s.dark ? 'rgba(255,255,255,0.28)' : 'var(--ink-300)', marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em',
                color: s.dark ? 'white' : 'var(--ink-900)', lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: s.dark ? 'rgba(255,255,255,0.28)' : 'var(--ink-400)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Table header */}
        {allMembers.length > 0 && (
          <div style={{ display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) 140px 120px minmax(0,1.5fr) 32px',
            gap: 20, paddingBottom: 10, borderBottom: '1.5px solid var(--ink-900)', marginBottom: 0 }}>
            {['Team member', 'Role', 'Dept', 'DRI', ''].map((h, i) => (
              <p key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.11em',
                textTransform: 'uppercase', color: 'var(--ink-300)' }}>{h}</p>
            ))}
          </div>
        )}

        {/* All rows — dept is looked up live from directoryOverrides so directory edits auto-reflect */}
        {capeTeam.map(m => {
          const dirEntry = m._directoryId
            ? { ...CAPE_DIRECTORY.find(p => p.id === m._directoryId), ...(state.directoryOverrides[m._directoryId] || {}) }
            : null
          const liveDept = dirEntry?.dept ?? m.dept
          return (
            <TeamRow key={m._uid} member={m} isExternal={false}
              directoryDept={liveDept}
              onRemove={() => setCapeTeam(prev => prev.filter(x => x._uid !== m._uid))}
              onClick={() => setSelected({ ...m, dept: liveDept, _isExternal: false })} />
          )
        })}
        {extTeam.map(m => (
          <TeamRow key={m._uid} member={m} isExternal={true}
            directoryDept={null}
            onRemove={() => setExtTeam(prev => prev.filter(x => x._uid !== m._uid))}
            onClick={() => setSelected({ ...m, _isExternal: true })} />
        ))}

        {allMembers.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink-200)', marginBottom: 10 }}>
              No team members assigned yet.
            </p>
            <button onClick={() => setShowPicker(true)}
              style={{ padding: '10px 24px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', background: 'var(--ink-900)', color: 'white',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + Add team member
            </button>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 20, fontStyle: 'italic' }}>
          DRI assignments are project-specific and do not affect team members' global directory profiles.
        </p>

        </>)} {/* end team tab */}

        {/* ── Staffing Plan tab ── */}
        {activeTab === 'staffing' && (
          <StaffingPlan
            projectId={projectId}
            allMembers={allMembers}
            isViewOnly={isViewOnly}
          />
        )}

      </motion.div>

      <AnimatePresence>
        {showPicker && (
          <AddMemberPicker key="picker"
            assignedDirectoryIds={assignedDirectoryIds}
            onAdd={addFromDirectory}
            onClose={() => setShowPicker(false)}
            directoryOverrides={state.directoryOverrides} />
        )}
        {showExtForm && (
          <AddExternalModal key="extform"
            onAdd={m => setExtTeam(p => [...p, m])}
            onClose={() => setShowExtForm(false)} />
        )}
        {selected && (
          <MemberModal key={selected._uid}
            member={selected}
            isExternal={selected._isExternal}
            onClose={() => setSelected(null)}
            onUpdateDri={updateDri} />
        )}
      </AnimatePresence>
    </div>
  )
}
