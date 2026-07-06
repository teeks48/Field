/**
 * RunOfShow — Project-specific, phase-based Run of Show
 *
 * Storage: localStorage `field_ros_${projectId}_v1`
 * Each project has its own independent ROS workspace.
 * Each ROS has multiple phases (Load-In, Show Day, etc.)
 * Each phase has its own table of timed cue rows.
 *
 * No global store data used — fully scoped to projectId.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { CAPE_DIRECTORY } from '../../data/capeDirectory.js'
import { useStore } from '../../store.jsx'
import { useLocalState } from '../../useLocalState.js'
import TimeSelect from '../../components/TimeSelect.jsx'
import { LivePreview, TEMPLATES, TEMPLATE_DEFAULTS } from '../ExportModal.jsx'

/* ─── Storage ───────────────────────────────────────────── */
function rosKey(projectId) { return `field_ros_${projectId || 'default'}_v1` }

function loadROS(projectId) {
  try {
    const saved = JSON.parse(localStorage.getItem(rosKey(projectId)))
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch {}
  return []           // new project → empty, let user build from scratch
}

function saveROS(projectId, phases) {
  try { localStorage.setItem(rosKey(projectId), JSON.stringify(phases)) } catch {}
}

/* ─── Project team loader ───────────────────────────────── */
function loadProjectTeam(projectId) {
  try {
    const cape = JSON.parse(localStorage.getItem(`field_local_team_cape_${projectId}_v3`) || '[]')
    const ext  = JSON.parse(localStorage.getItem(`field_local_team_ext_${projectId}_v3`)  || '[]')
    return [...cape, ...ext].filter(m => m.name || m.firstName)
  } catch { return [] }
}

/* ─── Owner dropdown ─────────────────────────────────────── */
function OwnerSelect({ value, onChange, team }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', fontFamily:'var(--font)' }}>
      <option value="">No owner</option>
      {team.map((m, i) => {
        const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim()
        return <option key={m._directoryId || m.id || i} value={name}>{name}</option>
      })}
    </select>
  )
}

let _id = Date.now()
const uid = prefix => `${prefix}${_id++}`

/* ─── Phase type presets ────────────────────────────────── */
const PHASE_PRESETS = [
  'Pre-Production',
  'Load-In',
  'Rehearsal',
  'VIP Arrival',
  'Show Day',
  'Talent Movement',
  'Load-Out',
  'Post-Production',
  'Custom',
]

/* ─── Status colours ────────────────────────────────────── */
function phaseTypeColor(type) {
  const map = {
    'Pre-Production':  'var(--signal-blue-text)',
    'Load-In':         'var(--signal-amber-text)',
    'Rehearsal':       'var(--signal-amber-text)',
    'VIP Arrival':     'var(--signal-green-text)',
    'Show Day':        'var(--ink-900)',
    'Talent Movement': 'var(--signal-green-text)',
    'Load-Out':        'var(--signal-amber-text)',
    'Post-Production': 'var(--ink-400)',
  }
  return map[type] || 'var(--ink-500)'
}

/* ─── Departments & statuses ─────────────────────────────── */
const ROS_DEPARTMENTS = ['Production','Venue','Hospitality','Talent','AV / Tech']
const ROS_STATUSES    = ['Planned','Confirmed','Complete']

function statusPill(s) {
  if (s === 'Complete')  return { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' }
  if (s === 'Confirmed') return { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  }
  return                        { color:'var(--ink-400)',            bg:'var(--ground-dim)'      }
}

/* Small hover-revealed icon action */
function RowAction({ label, symbol, onClick, danger, active }) {
  return (
    <button onClick={onClick} title={label}
      style={{ width:22, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontSize:12, lineHeight:1, background:'var(--surface)', borderRadius:3, cursor:'pointer',
        border:'1px solid var(--border)', fontFamily:'var(--font)', padding:0,
        color: active ? 'var(--signal-green-text)' : danger ? 'var(--ink-300)' : 'var(--ink-500)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = danger ? 'var(--signal-red-text)' : 'var(--border-med)'; if (danger) e.currentTarget.style.color = 'var(--signal-red-text)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; if (danger) e.currentTarget.style.color = 'var(--ink-300)' }}>
      {symbol}
    </button>
  )
}

/* ─── ROS cue row — compact, scannable, hover quick-actions ── */
function ROSRow({ r, onUpdate, onDelete, onDuplicate, team, isViewOnly }) {
  const [editing, setEditing] = useState(false)
  const [hov, setHov]         = useState(false)
  const [form, setForm]       = useState({ ...r })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const save = () => { onUpdate(r.id, form); setEditing(false) }
  const complete = r.status === 'Complete'
  const sp = statusPill(r.status)

  return (
    <>
      <tr onClick={() => setEditing(e => !e)} style={{ cursor:'pointer' }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600,
          color: complete ? 'var(--ink-300)' : 'var(--ink-900)', whiteSpace:'nowrap' }}>{r.time || '—'}</td>
        <td style={{ opacity: complete ? 0.55 : 1 }}>
          <span style={{ fontWeight:500 }}>{r.item}</span>
          {(r.duration || r.location) && (
            <span style={{ marginLeft:8, fontSize:11, color:'var(--ink-400)' }}>
              {[r.duration, r.location].filter(Boolean).join(' · ')}
            </span>
          )}
          {r.clientFacing && (
            <span style={{ marginLeft:8, fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 6px', borderRadius:2 }}>Client</span>
          )}
          {r.internalOnly && (
            <span style={{ marginLeft:6, fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              color:'var(--ink-400)', background:'var(--ground-dim)', padding:'2px 6px', borderRadius:2 }}>Internal</span>
          )}
          {r.notes && (
            <p style={{ fontSize:11, color:'var(--ink-400)', fontStyle:'italic', marginTop:1 }}>{r.notes}</p>
          )}
        </td>
        <td style={{ fontSize:12, color:'var(--ink-600)', whiteSpace:'nowrap' }}>{r.owner || '—'}</td>
        <td style={{ fontSize:12, color:'var(--ink-500)', whiteSpace:'nowrap' }}>{r.department || '—'}</td>
        <td>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
            color:sp.color, background:sp.bg, padding:'3px 8px', borderRadius:2, whiteSpace:'nowrap' }}>
            {r.status || 'Planned'}
          </span>
        </td>
        <td style={{ textAlign:'right', whiteSpace:'nowrap' }} onClick={e => e.stopPropagation()}>
          {/* Quick actions — revealed on hover only */}
          {!isViewOnly && (
            <span style={{ display:'inline-flex', gap:4, opacity: hov ? 1 : 0, transition:'opacity 0.12s',
              pointerEvents: hov ? 'auto' : 'none' }}>
              <RowAction label="Edit" symbol="✎" onClick={() => setEditing(e => !e)}/>
              <RowAction label="Duplicate" symbol="⧉" onClick={() => onDuplicate(r)}/>
              <RowAction label={complete ? 'Mark planned' : 'Mark complete'} symbol="✓" active={complete}
                onClick={() => onUpdate(r.id, { status: complete ? 'Planned' : 'Complete' })}/>
              <RowAction label="Delete" symbol="×" danger onClick={() => onDelete(r.id)}/>
            </span>
          )}
        </td>
      </tr>
      {editing && (
        <tr style={{ background:'var(--ground-dim)' }}>
          <td colSpan={6} style={{ padding:'14px 0 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'80px 60px 1fr 140px 150px', gap:10, marginBottom:10 }}>
              <input value={form.time     || ''} onChange={up('time')}     placeholder="6:00 PM" autoFocus/>
              <input value={form.duration || ''} onChange={up('duration')} placeholder="30m"/>
              <input value={form.item     || ''} onChange={up('item')}     placeholder="Description"/>
              <input value={form.location || ''} onChange={up('location')} placeholder="Location"/>
              <OwnerSelect value={form.owner} onChange={v => setForm(p => ({ ...p, owner: v }))} team={team}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'150px 130px 1fr', gap:10, marginBottom:10 }}>
              <select value={form.department || ''} onChange={up('department')} style={{ fontFamily:'var(--font)' }}>
                <option value="">Department…</option>
                {ROS_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={form.status || 'Planned'} onChange={up('status')} style={{ fontFamily:'var(--font)' }}>
                {ROS_STATUSES.map(st => <option key={st}>{st}</option>)}
              </select>
              <input value={form.notes || ''} onChange={up('notes')} placeholder="Notes (optional)"/>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className="btn-primary" onClick={save}>Save</button>
              <button className="btn-secondary" onClick={() => { setEditing(false); setForm({ ...r }) }}>Cancel</button>
              <button className="btn-secondary" onClick={() => onUpdate(r.id, { clientFacing: !r.clientFacing })}
                style={{ marginLeft:'auto',
                  background: r.clientFacing ? 'var(--signal-amber-bg)' : 'var(--surface)',
                  color: r.clientFacing ? 'var(--signal-amber-text)' : 'var(--ink-500)',
                  border: `1px solid ${r.clientFacing ? 'var(--signal-amber-text)' : 'var(--border)'}` }}>
                {r.clientFacing ? '✓ Client-Facing' : 'Mark Client-Facing'}
              </button>
              <button className="btn-secondary" onClick={() => onUpdate(r.id, { vendorFacing: !r.vendorFacing })}
                style={{ background: r.vendorFacing ? 'var(--signal-blue-bg)' : 'var(--surface)',
                  color: r.vendorFacing ? 'var(--signal-blue-text)' : 'var(--ink-500)',
                  border: `1px solid ${r.vendorFacing ? 'var(--signal-blue-text)' : 'var(--border)'}` }}>
                {r.vendorFacing ? '✓ Vendor View' : 'Include in Vendor View'}
              </button>
              <button className="btn-secondary" onClick={() => onUpdate(r.id, { internalOnly: !r.internalOnly })}
                style={{ background: r.internalOnly ? 'var(--ground-recessed)' : 'var(--surface)',
                  color: r.internalOnly ? 'var(--ink-700)' : 'var(--ink-500)',
                  border: `1px solid ${r.internalOnly ? 'var(--ink-400)' : 'var(--border)'}` }}>
                {r.internalOnly ? '✓ Internal Only' : 'Mark Internal Only'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ─── Add row form ───────────────────────────────────────── */
function AddRowForm({ onAdd, onCancel, team }) {
  const [form, setForm] = useState({ time:'', duration:'', item:'', location:'', owner:'', department:'', status:'Planned', clientFacing:false, notes:'' })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const submit = () => { if (!form.item.trim()) return; onAdd(form); }

  return (
    <div className="add-row" style={{ marginBottom:16 }}>
      <div className="add-row-grid" style={{ gridTemplateColumns:'80px 60px 1fr 160px 160px', gap:10 }}>
        <input value={form.time}     onChange={up('time')}     placeholder="6:00 PM" autoFocus/>
        <input value={form.duration} onChange={up('duration')} placeholder="30m"/>
        <input value={form.item}     onChange={up('item')}     placeholder="Activity / Cue"/>
        <input value={form.location} onChange={up('location')} placeholder="Location"/>
        <OwnerSelect value={form.owner} onChange={v => setForm(p => ({ ...p, owner: v }))} team={team}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'160px 140px 1fr', gap:10, margin:'8px 0 0' }}>
        <select value={form.department} onChange={up('department')} style={{ fontFamily:'var(--font)' }}>
          <option value="">Department…</option>
          {ROS_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={form.status} onChange={up('status')} style={{ fontFamily:'var(--font)' }}>
          {ROS_STATUSES.map(st => <option key={st}>{st}</option>)}
        </select>
        <div/>
      </div>
      <input value={form.notes} onChange={up('notes')} placeholder="Notes (optional)"
        style={{ width:'100%', margin:'8px 0' }}/>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button className="btn-primary" onClick={submit}>Add entry</button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button onClick={() => setForm(p => ({ ...p, clientFacing: !p.clientFacing }))}
          style={{ marginLeft:'auto', fontSize:12, fontWeight:600, padding:'6px 14px',
            borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
            background: form.clientFacing ? 'var(--signal-green-bg)' : 'var(--surface)',
            color: form.clientFacing ? 'var(--signal-green-text)' : 'var(--ink-500)',
            border: `1px solid ${form.clientFacing ? 'var(--signal-green-text)' : 'var(--border)'}` }}>
          {form.clientFacing ? '✓ Client-Facing' : 'Client-Facing'}
        </button>
      </div>
    </div>
  )
}

/* ─── Phase editor modal ─────────────────────────────────── */
function PhaseModal({ phase, onSave, onClose }) {
  const [form, setForm] = useState(phase || {
    name: '', type: 'Show Day', date: '', startTime: '', endTime: '', location: '',
  })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex',
      alignItems:'center', justifyContent:'center',
      background:'rgba(10,9,8,0.40)', backdropFilter:'blur(3px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'var(--surface)', border:'1px solid var(--border-med)',
          borderRadius:8, padding:'28px 28px 24px', width:480,
          boxShadow:'0 24px 64px rgba(10,9,8,0.24)' }}>

        <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:20 }}>
          {phase ? 'Edit Phase' : 'New Phase'}
        </p>

        <div style={{ display:'grid', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
              textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
              Phase Type
            </label>
            <select value={form.type} onChange={e => {
              const type = e.target.value
              setForm(p => ({ ...p, type, name: type === 'Custom' ? '' : type }))
            }} style={{ width:'100%' }}>
              {PHASE_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
              textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
              Phase Name
            </label>
            <input value={form.name} onChange={up('name')} placeholder="e.g. Show Day — Main Stage"
              style={{ width:'100%' }}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
                textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
                Date
              </label>
              <input type="date" value={form.date} onChange={up('date')} style={{ width:'100%' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
                textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
                Location
              </label>
              <input value={form.location} onChange={up('location')} placeholder="e.g. 73F Floor"
                style={{ width:'100%' }}/>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
                textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
                Start Time
              </label>
              <TimeSelect value={form.startTime} onChange={v => up('startTime')({target:{value:v}})} placeholder="Start time"/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em',
                textTransform:'uppercase', color:'var(--ink-300)', display:'block', marginBottom:5 }}>
                End Time
              </label>
              <TimeSelect value={form.endTime} onChange={v => up('endTime')({target:{value:v}})} placeholder="End time"/>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:22 }}>
          <button className="btn-primary"
            onClick={() => { if (form.name.trim() || form.type) onSave({ ...form, name: form.name || form.type }) }}
            style={{ flex:1 }}>
            {phase ? 'Save Changes' : 'Create Phase'}
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Call Time row ──────────────────────────────────────── */
function CallTimeRow({ ct, onUpdate, onDelete, team }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ ...ct })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const save = () => { onUpdate(ct.id, form); setEditing(false) }

  return (
    <>
      <tr onClick={() => setEditing(e => !e)} style={{ cursor:'pointer' }}>
        <td style={{ fontWeight:600 }}>{ct.name || '—'}</td>
        <td style={{ fontSize:13, color:'var(--ink-500)' }}>{ct.role || '—'}</td>
        <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--ink-900)', whiteSpace:'nowrap' }}>{ct.callTime || '—'}</td>
        <td style={{ fontSize:13, color:'var(--ink-500)' }}>{ct.location || '—'}</td>
        <td style={{ fontSize:12, color:'var(--ink-400)' }}>{ct.radio || '—'}</td>
        <td style={{ fontSize:12, color:'var(--ink-400)' }}>{ct.credentials || '—'}</td>
        <td style={{ fontSize:12, color:'var(--ink-400)', fontStyle: ct.notes ? 'italic' : 'normal' }}>{ct.notes || '—'}</td>
        <td style={{ textAlign:'right' }}>
          <button onClick={e => { e.stopPropagation(); onDelete(ct.id) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-200)', fontSize:18, lineHeight:1 }}>×</button>
        </td>
      </tr>
      {editing && (
        <tr style={{ background:'var(--ground-dim)' }}>
          <td colSpan={8} style={{ padding:'14px 0 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px 1fr 80px 120px', gap:10, marginBottom:10 }}>
              <OwnerSelect value={form.name} onChange={v => {
                // Auto-fill role from team data when name selected (internal + freelancers)
                const member = team.find(m => (m.name || `${m.firstName||''} ${m.lastName||''}`.trim()) === v)
                setForm(p => ({ ...p, name: v, role: member?.projectRole || member?.role || member?.title || p.role }))
              }} team={team} placeholder="Team member"/>
              <input value={form.role||''} onChange={up('role')} placeholder="Role"/>
              <input value={form.callTime||''} onChange={up('callTime')} placeholder="8:00 AM" autoFocus/>
              <input value={form.location||''} onChange={up('location')} placeholder="Location"/>
              <input value={form.radio||''} onChange={up('radio')} placeholder="Ch 1"/>
              <input value={form.credentials||''} onChange={up('credentials')} placeholder="All-access"/>
            </div>
            <input value={form.notes||''} onChange={up('notes')} placeholder="Notes"
              style={{ width:'100%', marginBottom:10 }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-primary" onClick={save}>Save</button>
              <button className="btn-secondary" onClick={() => { setEditing(false); setForm({ ...ct }) }}>Cancel</button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function AddCallTimeForm({ onAdd, onCancel, team }) {
  const [form, setForm] = useState({ name:'', role:'', callTime:'', location:'', radio:'', credentials:'', notes:'' })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const submit = () => { if (!form.name && !form.role) return; onAdd(form) }

  return (
    <div className="add-row" style={{ marginBottom:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px 1fr 80px 120px', gap:10, marginBottom:10 }}>
        <OwnerSelect value={form.name} onChange={v => {
          const member = team.find(m => (m.name || `${m.firstName||''} ${m.lastName||''}`.trim()) === v)
          setForm(p => ({ ...p, name: v, role: member?.projectRole || member?.role || member?.title || p.role }))
        }} team={team} placeholder="Team member"/>
        <input value={form.role} onChange={up('role')} placeholder="Role" autoFocus/>
        <input value={form.callTime} onChange={up('callTime')} placeholder="8:00 AM"/>
        <input value={form.location} onChange={up('location')} placeholder="Location"/>
        <input value={form.radio} onChange={up('radio')} placeholder="Ch 1"/>
        <input value={form.credentials} onChange={up('credentials')} placeholder="All-access"/>
      </div>
      <input value={form.notes} onChange={up('notes')} placeholder="Notes (optional)"
        style={{ width:'100%', marginBottom:10 }}/>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn-primary" onClick={submit}>Add</button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── Call Times tab ─────────────────────────────────────── */
function CallTimesTab({ phase, phases, commit, team, isViewOnly, onAutoGenerate }) {
  const [adding, setAdding] = useState(false)
  const callTimes = phase?.callTimes || []

  const updateCT = (id, changes) => commit(phases.map(p =>
    p.id === phase.id ? { ...p, callTimes: (p.callTimes||[]).map(c => c.id === id ? { ...c, ...changes } : c) } : p
  ))
  const deleteCT = (id) => commit(phases.map(p =>
    p.id === phase.id ? { ...p, callTimes: (p.callTimes||[]).filter(c => c.id !== id) } : p
  ))
  const addCT = (form) => {
    const ct = { id: `ct${Date.now()}`, ...form }
    commit(phases.map(p =>
      p.id === phase.id ? { ...p, callTimes: [...(p.callTimes||[]), ct] } : p
    ))
    setAdding(false)
  }

  if (!phase) return (
    <div style={{ padding:'48px 0', textAlign:'center' }}>
      <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)' }}>
        Select a phase to manage call times.
      </p>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:800,
            letterSpacing:'-0.03em', color:'var(--ink-900)', marginBottom:4 }}>
            {phase.name} — Call Times
          </h1>
          <p style={{ fontSize:12, color:'var(--ink-300)' }}>
            {callTimes.length} {callTimes.length === 1 ? 'person' : 'people'} scheduled
          </p>
        </div>
        {!isViewOnly && (
          <button className="btn-primary" onClick={() => setAdding(a => !a)}>
            + Add call time
          </button>
        )}
      </div>

      {adding && <AddCallTimeForm onAdd={addCT} onCancel={() => setAdding(false)} team={team}/>}

      <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
        <table className="data-table" style={{ width:'100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Call Time</th>
              <th>Location</th>
              <th>Radio</th>
              <th>Access</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {callTimes.map(ct => (
              <CallTimeRow key={ct.id} ct={ct} onUpdate={updateCT} onDelete={deleteCT} team={team}/>
            ))}
          </tbody>
        </table>
        {callTimes.length === 0 && (
          <div style={{ padding:'48px 0', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:12 }}>
              No call times yet.
            </p>
            {!isViewOnly && (
              <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center' }}>
                <button className="btn-primary" onClick={onAutoGenerate}
                  title="Pull assigned internal team and freelancers from the Team page and Schedule Plan">
                  ✦ Pull from assigned team
                </button>
                <button className="btn-secondary" onClick={() => setAdding(true)}>+ Add manually</button>
              </div>
            )}
          </div>
        )}
      </div>
      {callTimes.length > 0 && (
        <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>
          Click any row to edit
        </p>
      )}
    </div>
  )
}

/* ─── Send Package Modal ─────────────────────────────────── */
function AttachmentCard({ file, onRename, onRemove, onPreview }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(file.name)

  const commit = () => { onRename(name.trim() || file.name); setEditing(false) }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
      background:'var(--ground-dim)', border:'1px solid var(--border)',
      borderRadius:'var(--r-sm)', width:'100%' }}>
      {/* PDF icon */}
      <div style={{ width:36, height:44, background:'white', border:'1px solid var(--border-med)',
        borderRadius:3, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'flex-end', paddingBottom:5, flexShrink:0,
        boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ width:'100%', height:12, background:'#d0392b',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <p style={{ fontSize:7, fontWeight:800, color:'white', letterSpacing:'0.06em' }}>PDF</p>
        </div>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <div style={{ display:'flex', gap:6 }}>
            <input value={name} onChange={e => setName(e.target.value)}
              onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()}
              autoFocus style={{ flex:1, fontSize:12, padding:'3px 6px' }}/>
          </div>
        ) : (
          <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
            {name}
          </p>
        )}
        <p style={{ fontSize:11, color:'var(--ink-400)' }}>{file.size} · {file.type}</p>
      </div>

      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {onPreview && (
          <button onClick={onPreview}
            style={{ fontSize:11, fontWeight:600, color:'var(--signal-blue-text)',
              background:'var(--signal-blue-bg)', border:'1px solid var(--signal-blue-text)22',
              borderRadius:3, padding:'3px 8px', cursor:'pointer', fontFamily:'var(--font)' }}>
            Preview
          </button>
        )}
        <button onClick={() => setEditing(e => !e)}
          style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)', background:'none',
            border:'1px solid var(--border)', borderRadius:3, padding:'3px 8px',
            cursor:'pointer', fontFamily:'var(--font)' }}>
          Rename
        </button>
        <button onClick={onRemove}
          style={{ fontSize:11, color:'var(--ink-300)', background:'none',
            border:'none', cursor:'pointer', fontFamily:'var(--font)', lineHeight:1, padding:'3px 4px' }}>
          ×
        </button>
      </div>
    </div>
  )
}

function RecipientRow({ person, checked, onToggle }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
      borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onToggle}
        style={{ width:14, height:14, accentColor:'var(--ink-900)', flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{person.name}</p>
        {person.role && (
          <p style={{ fontSize:11, color:'var(--ink-400)' }}>{person.role}</p>
        )}
      </div>
      <p style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0,
        overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{person.email}</p>
    </label>
  )
}

function SendPackageModal({ phases, activePhase, production, pid, onClose }) {
  const projectName = production?.name || 'Event'

  /* ─── Phase selection — which ROS days to include ─── */
  const [selectedPhaseIds, setSelectedPhaseIds] = useState(() =>
    new Set(activePhase ? [activePhase.id] : phases.map(p => p.id))
  )
  const togglePhase = id => setSelectedPhaseIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectedPhases = phases.filter(p => selectedPhaseIds.has(p.id))

  /* ─── Staffing data from Schedule Plan ─── */
  const staffing = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`field_local_field_staffing_${pid}_v1`) || '[]') } catch { return [] }
  }, [pid])

  /* Unique dates that have shifts across all staffing entries */
  const staffDates = useMemo(() => {
    const dates = new Set()
    staffing.forEach(s => (s.shifts || []).forEach(sh => dates.add(sh.date)))
    return [...dates].sort()
  }, [staffing])

  const [includeStaffSchedule, setIncludeStaffSchedule] = useState(staffDates.length > 0)

  /* ─── Build dynamic attachment list ─── */
  const buildAttachments = () => {
    const list = []
    if (selectedPhases.length > 0) {
      list.push({
        id: 'ros',
        name: `${projectName} - Run of Show.pdf`,
        size: '284 KB',
        type: 'Run of Show',
        mocked: true,
        phaseCount: selectedPhases.length,
      })
      const hasCallTimes = selectedPhases.some(p => (p.callTimes || []).length > 0)
      if (hasCallTimes) {
        list.push({
          id: 'ct',
          name: `${projectName} - Call Times.pdf`,
          size: '91 KB',
          type: 'Call Times',
          mocked: true,
        })
      }
    }
    if (includeStaffSchedule && staffDates.length > 0) {
      list.push({
        id: 'staff',
        name: `${projectName} - Staff Schedule.pdf`,
        size: '148 KB',
        type: 'Staff Schedule',
        mocked: true,
      })
    }
    return list
  }

  const [attachments, setAttachments] = useState(() => buildAttachments())

  /* Rebuild attachments when phase selection or staff toggle changes */
  useEffect(() => {
    setAttachments(buildAttachments())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhaseIds, includeStaffSchedule])

  /* ─── Recipients ─── */
  const { teamMembers, extMembers, vendorContacts } = useMemo(() => {
    let cape = []
    try { cape = JSON.parse(localStorage.getItem(`field_local_team_cape_${pid}_v3`) || '[]') } catch {}
    const teamMembers = cape.map(m => {
      const dir = CAPE_DIRECTORY.find(p => p.id === m._directoryId)
      return {
        name:  dir ? `${dir.firstName} ${dir.lastName}` : (m.name || '—'),
        role:  m.projectRole || dir?.title || '—',
        email: dir?.email || m.email || '',
      }
    }).filter(m => m.email)

    let ext = []
    try { ext = JSON.parse(localStorage.getItem(`field_local_team_ext_${pid}_v3`) || '[]') } catch {}
    const extMembers = ext.map(m => ({
      name:  m.name || '—',
      role:  m.projectRole || m.company || 'External',
      email: m.email || '',
    })).filter(m => m.email)

    let vl = []
    try { vl = JSON.parse(localStorage.getItem(`field_local_vendors_${pid}_v1`) || '[]') } catch {}
    const vendorContacts = []
    vl.forEach(v => {
      const primaryEmail = v.contactEmail || v.email || ''
      if (primaryEmail) {
        vendorContacts.push({
          name:  v.contact || v.name || '—',
          role:  [v.name, v.cat || v.category].filter(Boolean).join(' · '),
          email: primaryEmail,
        })
      }
      ;(v.contacts || []).forEach(c => {
        if (c.email && c.email !== primaryEmail) {
          vendorContacts.push({
            name:  c.name || '—',
            role:  [c.role, v.name].filter(Boolean).join(' · '),
            email: c.email,
          })
        }
      })
    })

    return { teamMembers, extMembers, vendorContacts }
  }, [pid])

  // Raw vendor list for checklist
  const vendors = useMemo(() => {
    let vl = []
    try { vl = JSON.parse(localStorage.getItem(`field_local_vendors_${pid}_v1`) || '[]') } catch {}
    return vl.map(v => ({
      id:    v.id || v.name,
      name:  v.name || '—',
      cat:   v.cat || v.category || 'Vendor',
      primaryContact: {
        name:  v.contact || (v.contacts?.[0]?.name) || v.name || '—',
        email: v.contactEmail || v.email || (v.contacts?.[0]?.email) || '',
      },
    })).filter(v => v.primaryContact.email)
  }, [pid])

  // Which vendors are checked in the checklist
  const [checkedVendors, setCheckedVendors] = useState(new Set())
  const toggleVendor = id => setCheckedVendors(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  // Auto-populated: team + ext + checked vendor contacts
  const vendorRecipients = vendors
    .filter(v => checkedVendors.has(v.id))
    .map(v => v.primaryContact)

  const allPeople = [...teamMembers, ...extMembers]
  const [selectedEmails, setSelectedEmails] = useState(() =>
    new Set([...teamMembers, ...extMembers].map(m => m.email))
  )
  const [additionalEmail, setAdditionalEmail] = useState('')

  const senderName = (() => {
    try {
      const session = JSON.parse(localStorage.getItem('field_session_v1') || '{}')
      const email = session.user?.email || ''
      const dir = CAPE_DIRECTORY.find(p => p.email?.toLowerCase() === email.toLowerCase())
      return dir ? dir.firstName : email.split('@')[0]
    } catch { return 'The team' }
  })()

  const [subject, setSubject] = useState(`${projectName} — Run of Show & Call Times`)
  const [message, setMessage] = useState(
    `Hi Team,\n\nAttached are the latest production documents for ${projectName}.\n\nPlease review before tomorrow's load-in and let me know if you have any questions or notice any discrepancies.\n\nThanks,\n${senderName}`
  )
  const [step, setStep]           = useState('compose')
  const [previewDoc, setPreviewDoc] = useState(null)

  const toggleEmail = email => setSelectedEmails(prev => {
    const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n
  })
  const renameAttachment = (id, newName) =>
    setAttachments(p => p.map(a => a.id === id ? { ...a, name: newName } : a))
  const removeAttachment = id =>
    setAttachments(p => p.filter(a => a.id !== id))
  const addExtra = () => {
    const name = `Additional Document ${attachments.filter(a => !a.mocked).length + 1}.pdf`
    setAttachments(p => [...p, { id:`extra_${Date.now()}`, name, size:'—', type:'Attachment', mocked:false }])
  }

  const extraEmails = additionalEmail.split(/[,\s]+/).map(e => e.trim()).filter(e => e.includes('@'))
  const vendorEmails = vendorRecipients.map(v => v.email).filter(Boolean)
  const allRecipients = [...new Set([...selectedEmails, ...vendorEmails, ...extraEmails])]
  const canSend = allRecipients.length > 0

  const handleSend = () => setStep('sent')

  const LBL = ({ children }) => (
    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
      color:'var(--ink-300)', marginBottom:8 }}>{children}</p>
  )

  /* ─── Sent state ─── */
  if (step === 'sent') return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(10,9,8,0.45)', backdropFilter:'blur(3px)' }}
      onClick={onClose}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ scale:0.96, opacity:0 }}
        animate={{ scale:1, opacity:1 }} transition={{ duration:0.18 }}
        style={{ background:'var(--surface)', borderRadius:10, padding:'40px 48px',
          textAlign:'center', maxWidth:440, boxShadow:'0 32px 80px rgba(10,9,8,0.28)' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--signal-green-bg)',
          border:'1px solid var(--signal-green-dot)', display:'flex', alignItems:'center',
          justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 11l4 4 8-8" stroke="var(--signal-green-dot)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontSize:17, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>Package queued</p>
        <p style={{ fontSize:13, color:'var(--ink-500)', lineHeight:1.6, marginBottom:6 }}>
          Ready to send to {allRecipients.length} recipient{allRecipients.length !== 1 ? 's' : ''} with {attachments.length} document{attachments.length !== 1 ? 's' : ''}.
        </p>
        <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:28, lineHeight:1.6,
          padding:'10px 14px', background:'var(--ground-dim)', borderRadius:'var(--r-sm)',
          border:'1px solid var(--border)', textAlign:'left' }}>
          <strong style={{ color:'var(--ink-600)' }}>Prototype:</strong> When Gmail or Outlook is connected,
          this sends from your Cape Creative account with PDFs auto-attached.
        </p>
        <button onClick={onClose} className="btn-primary" style={{ width:'100%' }}>Done</button>
      </motion.div>
    </div>
  )

  /* ─── Main compose ─── */
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(10,9,8,0.45)', backdropFilter:'blur(3px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:10,
          width:820, maxWidth:'calc(100vw - 32px)', maxHeight:'90vh',
          boxShadow:'0 32px 80px rgba(10,9,8,0.28)', display:'flex', flexDirection:'column',
          overflow:'hidden', fontFamily:'var(--font)', position:'relative' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'18px 24px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Send Package</p>
            <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:2 }}>
              Compose a document package — stays in Fieldwork until email is connected
            </p>
          </div>
          <button onClick={onClose}
            style={{ fontSize:22, color:'var(--ink-300)', background:'none',
              border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* ── Left: compose ── */}
          <div style={{ flex:1, overflowY:'auto', padding:'18px 22px',
            borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:16 }}>

            {/* To */}
            <div>
              <LBL>To</LBL>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'7px 10px',
                border:'1px solid var(--border)', borderRadius:4, minHeight:38,
                background:'var(--surface)', marginBottom:4 }}>
                {allRecipients.map(email => {
                  const person = allPeople.find(p => p.email === email)
                  return (
                    <span key={email} style={{ display:'inline-flex', alignItems:'center', gap:5,
                      fontSize:12, fontWeight:500, color:'var(--ink-800)',
                      background:'var(--ground-dim)', border:'1px solid var(--border)',
                      borderRadius:3, padding:'2px 8px' }}>
                      {person?.name || email}
                      <button onClick={() => toggleEmail(email)}
                        style={{ background:'none', border:'none', cursor:'pointer',
                          color:'var(--ink-300)', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                    </span>
                  )
                })}
                <input value={additionalEmail} onChange={e => setAdditionalEmail(e.target.value)}
                  placeholder={allRecipients.length === 0 ? 'Add email addresses…' : 'Add more…'}
                  style={{ border:'none', outline:'none', fontSize:12, flex:1, minWidth:120,
                    background:'transparent', fontFamily:'var(--font)', color:'var(--ink-900)' }}/>
              </div>
            </div>

            {/* Subject */}
            <div>
              <LBL>Subject</LBL>
              <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width:'100%' }}/>
            </div>

            {/* Documents to include */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
                <LBL>Documents</LBL>
                <button onClick={addExtra}
                  style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)', background:'none',
                    border:'none', cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                  + Add file
                </button>
              </div>

              {/* Phase selector — which ROS days */}
              {phases.length > 0 && (
                <div style={{ marginBottom:12, padding:'12px 14px', background:'var(--ground-dim)',
                  border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                    color:'var(--ink-400)', marginBottom:8 }}>Run of show — select phases</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {phases.map(ph => {
                      const hasCT  = (ph.callTimes || []).length > 0
                      const rowCount = (ph.rows || []).length
                      const dateStr = ph.date
                        ? new Date(ph.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})
                        : ''
                      return (
                        <label key={ph.id} style={{ display:'flex', alignItems:'flex-start', gap:10,
                          padding:'6px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                          <input type="checkbox" checked={selectedPhaseIds.has(ph.id)}
                            onChange={() => togglePhase(ph.id)}
                            style={{ width:14, height:14, accentColor:'var(--ink-900)', flexShrink:0, marginTop:2 }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{ph.name}</p>
                              {ph.type && (
                                <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.07em',
                                  textTransform:'uppercase', color:'var(--ink-400)',
                                  background:'var(--border)', padding:'1px 6px', borderRadius:2 }}>
                                  {ph.type}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize:11, color:'var(--ink-400)' }}>
                              {dateStr}
                              {rowCount > 0 ? ` · ${rowCount} item${rowCount !== 1 ? 's' : ''}` : ' · No items yet'}
                              {hasCT ? ` · ${ph.callTimes.length} call time${ph.callTimes.length !== 1 ? 's' : ''}` : ''}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Staff schedule toggle */}
              {staffDates.length > 0 && (
                <div style={{ marginBottom:12, padding:'10px 14px', background:'var(--ground-dim)',
                  border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                    <input type="checkbox" checked={includeStaffSchedule}
                      onChange={e => setIncludeStaffSchedule(e.target.checked)}
                      style={{ width:14, height:14, accentColor:'var(--ink-900)', flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)' }}>Staff Schedule</p>
                      <p style={{ fontSize:11, color:'var(--ink-400)' }}>
                        From Schedule Plan · {staffDates.length} day{staffDates.length !== 1 ? 's' : ''} · {staffing.length} team member{staffing.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Attachment cards */}
              {attachments.length === 0 ? (
                <p style={{ fontSize:12, color:'var(--ink-400)', fontStyle:'italic', padding:'8px 0' }}>
                  Select at least one phase or document to include.
                </p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {attachments.map(a => (
                    <AttachmentCard key={a.id} file={a}
                      onRename={name => renameAttachment(a.id, name)}
                      onRemove={() => removeAttachment(a.id)}
                      onPreview={a.mocked ? () => setPreviewDoc(a.id) : undefined}
                    />
                  ))}
                </div>
              )}

              <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:8, fontStyle:'italic' }}>
                Prototype · PDFs are mocked. In production, documents generate automatically from live project data.
              </p>
            </div>

            {/* Message */}
            <div>
              <LBL>Message</LBL>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={8}
                style={{ width:'100%', fontFamily:'var(--font)', fontSize:13,
                  lineHeight:1.65, resize:'vertical', border:'1px solid var(--border)',
                  borderRadius:4, padding:'10px 12px', outline:'none',
                  background:'var(--surface)', color:'var(--ink-900)', boxSizing:'border-box' }}/>
            </div>
          </div>

          {/* ── Right: recipients ── */}
          <div style={{ width:268, flexShrink:0, overflowY:'auto', padding:'18px 18px',
            display:'flex', flexDirection:'column', gap:18 }}>

            {/* Internal team — auto populated */}
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:8 }}>Internal team</p>
              {teamMembers.length === 0 && extMembers.length === 0 ? (
                <p style={{ fontSize:11, color:'var(--ink-300)', fontStyle:'italic', lineHeight:1.6 }}>
                  Add team members on the Team page.
                </p>
              ) : (
                <>
                  {teamMembers.map(m => (
                    <RecipientRow key={m.email} person={m}
                      checked={selectedEmails.has(m.email)}
                      onToggle={() => toggleEmail(m.email)}/>
                  ))}
                  {extMembers.length > 0 && (
                    <>
                      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
                        color:'var(--signal-amber-text)', margin:'10px 0 4px' }}>Freelancers</p>
                      {extMembers.map(m => (
                        <RecipientRow key={m.email} person={m}
                          checked={selectedEmails.has(m.email)}
                          onToggle={() => toggleEmail(m.email)}/>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Vendor checklist */}
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:8 }}>Vendors</p>
              {vendors.length === 0 ? (
                <p style={{ fontSize:11, color:'var(--ink-300)', fontStyle:'italic', lineHeight:1.6 }}>
                  Add vendors on the Vendors page.
                </p>
              ) : vendors.map(v => (
                <label key={v.id} style={{ display:'flex', alignItems:'flex-start', gap:9,
                  padding:'9px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                  <input type="checkbox" checked={checkedVendors.has(v.id)}
                    onChange={() => toggleVendor(v.id)}
                    style={{ width:14, height:14, accentColor:'var(--ink-900)', flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</p>
                    <p style={{ fontSize:11, color:'var(--ink-400)', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.primaryContact.name}{v.cat ? ` · ${v.cat}` : ''}
                    </p>
                    {checkedVendors.has(v.id) && (
                      <p style={{ fontSize:10, color:'var(--signal-green-text)', marginTop:1 }}>
                        ✓ {v.primaryContact.email}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Additional recipients */}
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:6 }}>Additional recipients</p>
              <input value={additionalEmail} onChange={e => setAdditionalEmail(e.target.value)}
                placeholder="email@example.com, …"
                style={{ width:'100%', fontSize:12 }}/>
              <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:4 }}>
                Comma-separated. Added to all recipients above.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', flexShrink:0,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:12, color:'var(--ink-400)' }}>
            {allRecipients.length} recipient{allRecipients.length !== 1 ? 's' : ''} ·{' '}
            {attachments.length} document{attachments.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSend} disabled={!canSend}
              style={{ padding:'9px 22px', fontSize:11, fontWeight:700,
                letterSpacing:'0.08em', textTransform:'uppercase',
                background: canSend ? 'var(--ink-900)' : 'var(--border-med)',
                color: canSend ? 'white' : 'var(--ink-400)',
                border:'none', borderRadius:4, cursor: canSend ? 'pointer' : 'not-allowed',
                fontFamily:'var(--font)', transition:'all 0.1s' }}>
              Send package
            </button>
          </div>
        </div>

        {/* Document preview drawer */}
        <AnimatePresence>
          {previewDoc && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'absolute', inset:0, zIndex:10, background:'rgba(10,9,8,0.6)',
                display:'flex', alignItems:'stretch', justifyContent:'flex-end',
                borderRadius:10, overflow:'hidden' }}>
              <motion.div initial={{ x:400 }} animate={{ x:0 }} exit={{ x:400 }}
                transition={{ duration:0.22, ease:[0.25,1,0.5,1] }}
                style={{ width:'65%', background:'var(--surface)', display:'flex',
                  flexDirection:'column', height:'100%', overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)',
                  display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)' }}>
                      {attachments.find(a => a.id === previewDoc)?.name || 'Document preview'}
                    </p>
                    <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>
                      {previewDoc === 'ct'
                        ? `Call times from ${selectedPhases.length} phase${selectedPhases.length !== 1 ? 's' : ''}`
                        : previewDoc === 'staff'
                        ? `Staff schedule · ${staffDates.length} day${staffDates.length !== 1 ? 's' : ''}`
                        : `Run of Show · ${selectedPhases.length} phase${selectedPhases.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <button onClick={() => setPreviewDoc(null)}
                    style={{ fontSize:20, color:'var(--ink-300)', background:'none',
                      border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
                </div>

                {previewDoc === 'ros' && (
                  <LivePreview
                    template="ros-client"
                    sections={TEMPLATE_DEFAULTS['ros-client'].sections}
                    audience="client"
                    production={production}
                    team={[]}
                  />
                )}

                {previewDoc === 'ct' && (
                  <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', fontFamily:"'Inter', system-ui, sans-serif" }}>
                    <p style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase',
                      color:'#b0ada8', marginBottom:20, fontWeight:700 }}>Call Times</p>
                    {selectedPhases.filter(p => (p.callTimes||[]).length > 0).length === 0 ? (
                      <p style={{ fontSize:13, color:'#6b6762', fontStyle:'italic' }}>
                        No call times added to the selected phases yet. Add call times in the Run of Show page.
                      </p>
                    ) : selectedPhases.map(ph => {
                      const cts = ph.callTimes || []
                      if (cts.length === 0) return null
                      return (
                        <div key={ph.id} style={{ marginBottom:32 }}>
                          <p style={{ fontSize:16, fontWeight:800, color:'#141210',
                            letterSpacing:'-0.02em', marginBottom:4 }}>{ph.name}</p>
                          {ph.date && <p style={{ fontSize:12, color:'#6b6762', marginBottom:16 }}>
                            {new Date(ph.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                          </p>}
                          <div style={{ borderTop:'1px solid #141210', marginBottom:0 }}>
                            {/* Header */}
                            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 100px 120px',
                              padding:'8px 0', borderBottom:'1px solid #e4e0db' }}>
                              {['Name','Role','Call','Location'].map(h => (
                                <p key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em',
                                  textTransform:'uppercase', color:'#b0ada8' }}>{h}</p>
                              ))}
                            </div>
                            {cts.map((ct, i) => (
                              <div key={ct.id || i} style={{ display:'grid',
                                gridTemplateColumns:'140px 1fr 100px 120px',
                                padding:'10px 0', borderBottom:'1px solid #f0ede8' }}>
                                <p style={{ fontSize:12, fontWeight:600, color:'#141210' }}>{ct.name || '—'}</p>
                                <p style={{ fontSize:12, color:'#6b6762' }}>{ct.role || '—'}</p>
                                <p style={{ fontSize:12, fontWeight:700, color:'#141210',
                                  fontFamily:"'SF Mono','Fira Mono',monospace" }}>{ct.callTime || '—'}</p>
                                <p style={{ fontSize:12, color:'#6b6762' }}>{ct.location || '—'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {previewDoc === 'staff' && (
                  <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', fontFamily:"'Inter', system-ui, sans-serif" }}>
                    <p style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase',
                      color:'#b0ada8', marginBottom:20, fontWeight:700 }}>Staff Schedule</p>
                    {staffDates.length === 0 ? (
                      <p style={{ fontSize:13, color:'#6b6762', fontStyle:'italic' }}>
                        No shifts added yet. Add shifts in the Team → Schedule Plan.
                      </p>
                    ) : staffDates.map(date => {
                      const shifts = staffing
                        .map(m => {
                          const shift = (m.shifts || []).find(s => s.date === date)
                          return shift ? { name: m.memberName, start: shift.start, end: shift.end, onSite: shift.onSite } : null
                        })
                        .filter(Boolean)
                        .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
                      if (shifts.length === 0) return null
                      const fmt12 = t => {
                        if (!t) return '—'
                        const [h, m] = t.split(':').map(Number)
                        const ampm = h < 12 ? 'AM' : 'PM'
                        return `${((h - 1) % 12) + 1}:${String(m).padStart(2,'0')} ${ampm}`
                      }
                      return (
                        <div key={date} style={{ marginBottom:28 }}>
                          <p style={{ fontSize:16, fontWeight:800, color:'#141210',
                            letterSpacing:'-0.02em', marginBottom:16 }}>
                            {new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                          </p>
                          <div style={{ borderTop:'1px solid #141210' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 80px',
                              padding:'8px 0', borderBottom:'1px solid #e4e0db' }}>
                              {['Name','In','Out','On-site'].map(h => (
                                <p key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em',
                                  textTransform:'uppercase', color:'#b0ada8' }}>{h}</p>
                              ))}
                            </div>
                            {shifts.map((s, i) => (
                              <div key={i} style={{ display:'grid',
                                gridTemplateColumns:'1fr 90px 90px 80px',
                                padding:'10px 0', borderBottom:'1px solid #f0ede8' }}>
                                <p style={{ fontSize:12, fontWeight:600, color:'#141210' }}>{s.name}</p>
                                <p style={{ fontSize:12, color:'#141210',
                                  fontFamily:"'SF Mono','Fira Mono',monospace", fontWeight:500 }}>{fmt12(s.start)}</p>
                                <p style={{ fontSize:12, color:'#6b6762',
                                  fontFamily:"'SF Mono','Fira Mono',monospace" }}>{fmt12(s.end)}</p>
                                <p style={{ fontSize:12, color: s.onSite ? '#2d7a4a' : '#b0ada8' }}>
                                  {s.onSite ? 'Yes' : 'No'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PrintView({ phase, projectName, production, rowsOverride, viewLabel }) {
  if (!phase) return null
  const clientRows = phase.rows.filter(r => r.clientFacing)
  const allRows    = phase.rows
  // Same live ROS data as the page: when the ROS tab is active we print
  // exactly the rows currently shown (view + filters applied).
  const rows       = rowsOverride ?? (clientRows.length > 0 ? clientRows : allRows)

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US',
      { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  }
  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  return (
    <div className="ros-print-only" style={{ fontFamily:'Georgia, serif', padding:'48px 56px', maxWidth:960, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ borderBottom:'2px solid #111', paddingBottom:20, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'#888', marginBottom:6, fontFamily:'Arial, sans-serif' }}>
              Run of Show {viewLabel ? `· ${viewLabel}` : clientRows.length > 0 ? '· Client-Facing' : ''}
            </p>
            <h1 style={{ fontSize:28, fontWeight:800, margin:0, color:'#111', fontFamily:'Arial, sans-serif',
              letterSpacing:'-0.02em', lineHeight:1.2 }}>
              {phase.name}
            </h1>
            <p style={{ fontSize:14, color:'#555', marginTop:6, fontFamily:'Arial, sans-serif' }}>
              {projectName}
            </p>
          </div>
          <div style={{ textAlign:'right', fontFamily:'Arial, sans-serif' }}>
            {phase.date && (
              <p style={{ fontSize:13, color:'#333', marginBottom:4 }}>{formatDate(phase.date)}</p>
            )}
            {phase.startTime && phase.endTime && (
              <p style={{ fontSize:13, color:'#555' }}>
                {formatTime(phase.startTime)} – {formatTime(phase.endTime)}
              </p>
            )}
            {phase.location && (
              <p style={{ fontSize:12, color:'#888', marginTop:4 }}>{phase.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p style={{ fontSize:13, color:'#888', fontStyle:'italic', fontFamily:'Arial, sans-serif' }}>
          No entries to print.
        </p>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Arial, sans-serif', fontSize:12 }}>
          <thead>
            <tr>
              {['Time','Duration','Activity','Location','Owner','Dept','Status'].map(h => (
                <th key={h} style={{
                  textAlign:'left', padding:'8px 12px 8px 0',
                  fontSize:10, fontWeight:700, letterSpacing:'0.14em',
                  textTransform:'uppercase', color:'#888',
                  borderBottom:'1.5px solid #111',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : '#f9f9f9' }}>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0',
                  fontFamily:'Courier New, monospace', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>
                  {r.time || '—'}
                </td>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0',
                  color:'#888', fontFamily:'Courier New, monospace', fontSize:11, whiteSpace:'nowrap' }}>
                  {r.duration || '—'}
                </td>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0',
                  fontWeight: r.notes ? 500 : 400, lineHeight:1.4 }}>
                  {r.item}
                  {r.notes && (
                    <span style={{ display:'block', fontSize:11, color:'#888', fontStyle:'italic', marginTop:2 }}>
                      {r.notes}
                    </span>
                  )}
                </td>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0', color:'#555' }}>
                  {r.location || '—'}
                </td>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0', color:'#555' }}>
                  {r.owner || '—'}
                </td>
                <td style={{ padding:'10px 12px 10px 0', borderBottom:'1px solid #e0e0e0', color:'#888', fontSize:11 }}>
                  {r.department || '—'}
                </td>
                <td style={{ padding:'10px 0 10px 0', borderBottom:'1px solid #e0e0e0', color:'#888', fontSize:11,
                  textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>
                  {r.status || 'Planned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Call Times */}
      {(phase.callTimes||[]).length > 0 && (
        <>
          <div style={{ marginTop:36, marginBottom:16, borderTop:'1px solid #ddd', paddingTop:24 }}>
            <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 4px', fontFamily:'Arial, sans-serif',
              letterSpacing:'-0.01em' }}>Call Times</h2>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Arial, sans-serif', fontSize:12 }}>
            <thead>
              <tr>
                {['Name','Role','Call Time','Location','Radio','Access'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 12px 8px 0',
                    fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
                    color:'#888', borderBottom:'1.5px solid #111' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(phase.callTimes||[]).map((ct, i) => (
                <tr key={ct.id} style={{ background: i % 2 === 0 ? 'transparent' : '#f9f9f9' }}>
                  <td style={{ padding:'9px 12px 9px 0', borderBottom:'1px solid #e0e0e0', fontWeight:600 }}>{ct.name||'—'}</td>
                  <td style={{ padding:'9px 12px 9px 0', borderBottom:'1px solid #e0e0e0', color:'#555' }}>{ct.role||'—'}</td>
                  <td style={{ padding:'9px 12px 9px 0', borderBottom:'1px solid #e0e0e0', fontFamily:'Courier New, monospace', fontWeight:600 }}>{ct.callTime||'—'}</td>
                  <td style={{ padding:'9px 12px 9px 0', borderBottom:'1px solid #e0e0e0', color:'#555' }}>{ct.location||'—'}</td>
                  <td style={{ padding:'9px 12px 9px 0', borderBottom:'1px solid #e0e0e0', color:'#888' }}>{ct.radio||'—'}</td>
                  <td style={{ padding:'9px 0 9px 0',   borderBottom:'1px solid #e0e0e0', color:'#888' }}>{ct.credentials||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div style={{ marginTop:32, paddingTop:14, borderTop:'1px solid #ddd',
        display:'flex', justifyContent:'space-between', fontFamily:'Arial, sans-serif' }}>
        <p style={{ fontSize:10, color:'#bbb' }}>
          {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          {clientRows.length > 0 && ' · Client-Facing only'}
        </p>
        <p style={{ fontSize:10, color:'#bbb' }}>
          Printed {new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>
    </div>
  )
}

/* ─── Auto-generate engine ───────────────────────────────────
   Pulls from all platform data sources based on phase type.
   Returns an array of new row objects to append (non-destructive).
   ─────────────────────────────────────────────────────────── */
function autoGenerateRows(phaseType, { state, logisticsLoadins, talent, callTimesFromStore, extras }) {
  const rows = []
  const uid  = () => `ag${Date.now()}${Math.random().toString(36).slice(2,6)}`

  // Resilient sources: prefer the global store, fall back to per-project extras
  // (so generation works regardless of where a page persists its data).
  const S = extras || {}
  const talentList = (state.talent && state.talent.length ? state.talent : (S.talent || []))
  const guestList  = (state.guestList && state.guestList.length ? state.guestList : (S.guestList || []))
  const eventTime  = state.production?.eventTime || S.eventTime || ''
  const avItems    = (S.avCats || []).flatMap(c => c.items || [])
  const fabItems   = (S.fabCats || []).flatMap(c => c.items || [])
  const menu       = [...(S.hospFood || []), ...(S.hospDrink || [])]
  const vendors    = S.vendors || []
  const notes      = S.projectNotes || []
  const milestones = (state.milestones && state.milestones.length ? state.milestones : (S.milestones || []))

  if (phaseType === 'Load-In' || phaseType === 'Load-Out') {
    const type = phaseType === 'Load-In' ? 'Load-In' : 'Load-Out'

    // From global store loadInOut
    ;(state.loadInOut || []).forEach(li => {
      rows.push({
        id: uid(), time: li.time || '', duration: li.duration || '',
        item: li.item || '', location: li.location || '',
        owner: '', clientFacing: false, department: 'Production', status: 'Planned', notes: li.notes || '',
      })
    })

    // From the Logistics page load-in/out plan
    ;(logisticsLoadins || [])
      .filter(l => !phaseType || l.type === type)
      .forEach(l => {
        rows.push({
          id: uid(), time: l.time || '', duration: '',
          item: `${l.type}${l.location ? ' — ' + l.location : ''}`,
          location: l.location || '', owner: '', clientFacing: false,
          department: 'Logistics', status: 'Planned',
          notes: [l.crew, l.notes].filter(Boolean).join(' · '),
        })
      })

    if (type === 'Load-In') {
      // Fabrication install — from the Fabrication page
      fabItems.forEach(f => {
        rows.push({
          id: uid(), time: f.installDate && /\d/.test(f.installDate) ? '' : '', duration: '',
          item: `Install — ${f.name}`, location: f.placement || '',
          owner: f.owner || '', clientFacing: false, department: 'Fabrication', status: 'Planned',
          notes: [f.fabricator, f.material].filter(Boolean).join(' · '),
        })
      })
      // AV install / rig — from the AV page
      avItems.forEach(a => {
        rows.push({
          id: uid(), time: '', duration: '',
          item: `AV install — ${a.name}`, location: a.placement || '',
          owner: a.owner || '', clientFacing: false, department: 'AV / Tech', status: 'Planned',
          notes: [a.vendor, a.install].filter(Boolean).join(' · '),
        })
      })
    }

    if (type === 'Load-Out') {
      // Strike cues derived from what was installed
      if (fabItems.length) rows.push({
        id: uid(), time: '', duration: '',
        item: `Strike — scenic + fabrication (${fabItems.length} element${fabItems.length === 1 ? '' : 's'})`,
        location: '', owner: '', clientFacing: false, department: 'Fabrication', status: 'Planned',
        notes: fabItems.map(f => f.name).slice(0, 3).join(' · '),
      })
      if (avItems.length) rows.push({
        id: uid(), time: '', duration: '',
        item: 'Strike — AV + show systems', location: '', owner: '',
        clientFacing: false, department: 'AV / Tech', status: 'Planned',
        notes: avItems.map(a => a.name).slice(0, 3).join(' · '),
      })
    }
  }

  if (phaseType === 'Show Day') {
    // ── Default-time scheduling ───────────────────────────────
    // Sequence the draft around real anchors so cues land on the
    // timeline instead of piling up under "Unscheduled". Doors is
    // the pivot: build happens before it, service flows after it.
    const toMin = t => {
      // Accepts "7:00 PM", "19:00", or "07:00"
      const m = String(t || '').trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
      if (!m) return null
      let h = parseInt(m[1], 10); const min = parseInt(m[2], 10); const ap = m[3]
      if (ap === 'PM' && h !== 12) h += 12
      if (ap === 'AM' && h === 12) h = 0
      return h * 60 + min   // 24h strings have no AM/PM and pass through as-is
    }
    const toLabel = mins => {
      let x = ((mins % 1440) + 1440) % 1440
      const h = Math.floor(x / 60), mm = x % 60
      const ap = h >= 12 ? 'PM' : 'AM', h12 = (h % 12) || 12
      return `${h12}:${String(mm).padStart(2, '0')} ${ap}`
    }
    const doorsMin  = toMin(eventTime) ?? (19 * 60)               // event time or 7:00 PM
    const phaseEnd  = toMin(S.phaseStart && S.phaseEnd ? S.phaseEnd : '') ?? (23 * 60 + 30)
    const crewMin   = (S.staffing?.length && S.phaseDateISO)
      ? (() => {
          const first = S.staffing.flatMap(e => (e.shifts || []).filter(sh => sh.date === S.phaseDateISO))
            .map(sh => toMin(fmtCallTime(sh.start))).filter(v => v != null).sort((a, b) => a - b)[0]
          return first != null ? first : (9 * 60)
        })()
      : (9 * 60)
    // Cursors for the two build streams and the service stream
    let buildCursor   = Math.max(crewMin + 120, doorsMin - 300)   // vendor/AV load-in window
    let serviceCursor = doorsMin + 15                             // hospitality service after doors

    ;(state.runOfShow || []).forEach(r => {
      rows.push({
        id: uid(), time: r.time || '', duration: r.duration || '—',
        item: r.item || '', location: r.location || '',
        owner: '', clientFacing: r.clientFacing || false,
        department: r.department || 'Production', status: r.status || 'Planned', notes: r.notes || '',
      })
    })

    // Crew call — earliest staffing shift on this date
    if (S.staffing?.length && S.phaseDateISO) {
      const shifts = S.staffing
        .flatMap(e => (e.shifts || []).filter(sh => sh.date === S.phaseDateISO))
        .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
      if (shifts.length) {
        rows.push({
          id: uid(), time: fmtCallTime(shifts[0].start), duration: '',
          item: `Crew call — ${shifts.length} staff on site`, location: '',
          owner: '', clientFacing: false, department: 'Production', status: 'Planned',
          notes: 'From the Staffing plan — see Call Times for individual times',
        })
      }
    }

    // Vendor arrivals — staggered through the afternoon build window
    vendors.forEach((v, i) => {
      rows.push({
        id: uid(), time: toLabel(buildCursor + i * 30), duration: '',
        item: `${v.name} — vendor arrival${v.cat ? ' (' + v.cat + ')' : ''}`,
        location: 'Dock', owner: '', clientFacing: false,
        department: v.cat === 'AV / Tech' ? 'AV / Tech' : v.cat === 'Catering' ? 'Hospitality' : 'Vendors',
        status: 'Planned', notes: v.contact ? `Contact: ${v.contact}` : '',
      })
    })
    buildCursor += Math.max(vendors.length, 1) * 30

    // AV sound check — ~2h before doors
    if (avItems.length) {
      rows.push({
        id: uid(), time: toLabel(doorsMin - 120), duration: '1h',
        item: `Sound check + systems test — ${avItems.length} AV element${avItems.length === 1 ? '' : 's'}`,
        location: avItems[0].placement || '', owner: '',
        clientFacing: false, department: 'AV / Tech', status: 'Planned',
        notes: avItems.map(i => i.name).slice(0, 4).join(' · '),
      })
    }

    // Talent — arrivals, soundcheck/rehearsal, standby
    talentList.forEach(t => {
      if (t.arrivalTime) rows.push({
        id: uid(), time: t.arrivalTime, duration: '',
        item: `${t.name} arrival — ${t.role}`, location: t.dressingRoom || '',
        owner: '', clientFacing: false, department: 'Talent', status: 'Planned',
        notes: [t.travel && `Travel: ${t.travel}`, t.hospitality && `Hospitality: ${t.hospitality}`].filter(Boolean).join(' · '),
      })
      if (/soundcheck|rehears/i.test(t.notes || '')) rows.push({
        id: uid(), time: toLabel(doorsMin - 90), duration: '1h',
        item: `${t.name} — soundcheck / rehearsal`, location: t.dressingRoom || 'Stage',
        owner: '', clientFacing: false, department: 'Talent', status: 'Planned', notes: t.notes || '',
      })
    })

    // Doors — from event time + confirmed guest count
    const confirmed = guestList.filter(g => g.rsvp === 'Confirmed').length
    const pending   = guestList.filter(g => g.rsvp === 'Pending').length
    if (eventTime) {
      rows.push({
        id: uid(), time: eventTime, duration: '30m',
        item: confirmed > 0 ? `Doors — guest arrivals (${confirmed} confirmed)` : 'Doors open',
        location: 'Entry', owner: '', clientFacing: true, department: 'Production', status: 'Planned',
        notes: pending > 0 ? `${pending} pending RSVPs` : '',
      })
    }

    // VIP arrivals — clustered just after doors
    guestList
      .filter(g => g.rsvp === 'Confirmed' && (g.table === '1' || /vip/i.test(g.notes || '')))
      .slice(0, 6)
      .forEach((g, i) => rows.push({
        id: uid(), time: toLabel(doorsMin + 5 + i * 5), duration: '',
        item: `VIP arrival — ${g.name}${g.company ? ' (' + g.company + ')' : ''}`,
        location: 'Entry', owner: '', clientFacing: true, department: 'Client Moments', status: 'Planned',
        notes: g.notes || '',
      }))

    // Hospitality — all setup completes before doors; service staged
    // across the evening (courses spaced from just after doors to end).
    const courses = [...new Set(menu.map(m => m.course).filter(Boolean))]
    courses.forEach((course, i) => {
      const items = menu.filter(m => m.course === course)
      rows.push({
        id: uid(), time: toLabel(doorsMin - 45), duration: '',
        item: `${course} — setup`, location: '', owner: '',
        clientFacing: false, department: 'Hospitality', status: 'Planned',
        notes: `${items.length} item${items.length === 1 ? '' : 's'} on the menu`,
      })
    })
    // Space service cues evenly between just-after-doors and the phase end
    const svcSpan = Math.max(phaseEnd - serviceCursor - 30, 30)
    const svcStep = courses.length > 1 ? Math.floor(svcSpan / courses.length) : 60
    courses.forEach((course, i) => {
      const items = menu.filter(m => m.course === course)
      rows.push({
        id: uid(), time: toLabel(serviceCursor + i * svcStep), duration: '',
        item: `${course} — service`, location: '', owner: '',
        clientFacing: true, department: 'Hospitality', status: 'Planned',
        notes: items.map(i => i.item).slice(0, 3).join(' · '),
      })
    })

    // Client moments — from pinned project notes that read like a cue
    notes
      .filter(n => n.pinned && /\b(\d{1,2}:\d{2}\s?(AM|PM)?|moment|remarks|toast|photo|first)\b/i.test(n.text || ''))
      .slice(0, 3)
      .forEach(n => {
        const tm = (n.text.match(/\b(\d{1,2}:\d{2}\s?(?:AM|PM)?)\b/i) || [])[1] || ''
        rows.push({
          id: uid(), time: tm, duration: '',
          item: `Client moment — ${n.text.slice(0, 60)}${n.text.length > 60 ? '…' : ''}`,
          location: '', owner: '', clientFacing: true, department: 'Client Moments', status: 'Planned',
          notes: n.userName ? `Flagged by ${n.userName}` : '',
        })
      })

    // Breakdown cue — at the end of the phase window
    rows.push({
      id: uid(), time: toLabel(phaseEnd), duration: '',
      item: 'Guest departure + initial breakdown', location: '', owner: '',
      clientFacing: false, department: 'Production', status: 'Planned',
      notes: 'Bar close, guest egress, secure smash inventory',
    })
  }

  if (phaseType === 'Talent Movement') {
    talentList.forEach(t => {
      if (t.arrivalTime) rows.push({
        id: uid(), time: t.arrivalTime, duration: '',
        item: `${t.name} arrival — ${t.role}`,
        location: '', owner: '', clientFacing: false, department: 'Talent', status: 'Planned',
        notes: `Dressing room: ${t.dressingRoom || '—'} · Travel: ${t.travel || '—'}`,
      })
      if (t.dressingRoom) rows.push({
        id: uid(), time: t.arrivalTime || '', duration: '30m',
        item: `${t.name} — dressing room + hospitality`,
        location: t.dressingRoom, owner: '', clientFacing: false, department: 'Talent', status: 'Planned',
        notes: t.hospitality || '',
      })
    })
  }

  if (phaseType === 'VIP Arrival') {
    const confirmedVIP = guestList.filter(g => g.rsvp === 'Confirmed' && (g.notes?.toLowerCase().includes('vip') || g.table === '1'))
    confirmedVIP.forEach(g => rows.push({
      id: uid(), time: '', duration: '',
      item: `${g.name} arrival — ${g.company || ''}`,
      location: 'Lobby', owner: '', clientFacing: true, department: 'Client Moments', status: 'Planned',
      notes: [g.dietary && `Dietary: ${g.dietary}`, g.notes].filter(Boolean).join(' · '),
    }))
    const totalConfirmed = guestList.filter(g => g.rsvp === 'Confirmed').length
    if (totalConfirmed > 0) rows.unshift({
      id: uid(), time: '', duration: '30m',
      item: `Guest arrivals — ${totalConfirmed} confirmed guests`,
      location: 'Lobby / Elevator', owner: '', clientFacing: true, department: 'Production', status: 'Planned',
      notes: `${guestList.filter(g => g.rsvp === 'Pending').length} pending RSVPs`,
    })
  }

  if (phaseType === 'Pre-Production') {
    milestones.filter(m => !m.done).forEach(m => rows.push({
      id: uid(), time: '', duration: '',
      item: m.label, location: '', owner: m.owner || '',
      clientFacing: false, department: 'Production', status: 'Planned', notes: m.date || '',
    }))
  }

  if (phaseType === 'Rehearsal') {
    talentList.forEach(t => {
      if (t.arrivalTime || /rehears|soundcheck/i.test(t.notes || '')) rows.push({
        id: uid(), time: '', duration: '1h',
        item: `${t.name} — soundcheck / rehearsal`,
        location: t.dressingRoom || 'Stage', owner: '', clientFacing: false,
        department: 'Talent', status: 'Planned', notes: t.notes || '',
      })
    })
  }

  // Deduplicate by item, then order chronologically (timed rows first, by time)
  const seen = new Set()
  const deduped = rows.filter(r => {
    const key = (r.item || '').trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  const mins = t => {
    if (!t) return 1e9  // untimed rows sink to the bottom, keeping insertion order among them
    const m = String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!m) return 1e9
    let h = parseInt(m[1], 10); const min = parseInt(m[2], 10); const ap = (m[3] || '').toUpperCase()
    if (ap === 'PM' && h !== 12) h += 12
    if (ap === 'AM' && h === 12) h = 0
    return h * 60 + min
  }
  return deduped
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (mins(a.r.time) - mins(b.r.time)) || (a.i - b.i))
    .map(x => x.r)
}

/* ─── Auto-generate Call Times ───────────────────────────────
   Pulls project team and any existing store call times.
   ─────────────────────────────────────────────────────────── */
function autoGenerateCallTimes(team, state, pid, eventDate) {
  const results = []
  const uid = () => `agct${Date.now()}${Math.random().toString(36).slice(2,6)}`

  // Parse eventDate (e.g. "July 16, 2026") to ISO "2026-07-16"
  let eventDateISO = ''
  if (eventDate) {
    try {
      const d = new Date(eventDate)
      if (!isNaN(d)) eventDateISO = d.toISOString().slice(0, 10)
    } catch {}
  }

  // Load staffing plan for this project
  let staffingPlan = []
  if (pid) {
    try { staffingPlan = JSON.parse(localStorage.getItem(`field_local_field_staffing_${pid}_v1`) || '[]') } catch {}
  }

  // Build a map: memberId → shift on event date
  const shiftMap = {}
  if (eventDateISO) {
    staffingPlan.forEach(entry => {
      const shift = (entry.shifts || []).find(s => s.date === eventDateISO)
      if (shift) shiftMap[entry.memberId] = shift
    })
  }

  // From project team — pull call time from staffing plan shift start
  team.forEach(m => {
    const name = m.name || `${m.firstName||''} ${m.lastName||''}`.trim()
    if (!name) return
    const shift    = shiftMap[m._uid]
    const callTime = shift ? fmtCallTime(shift.start) : ''
    const notes    = shift ? `On until ${fmtCallTime(shift.end)}` : ''
    results.push({
      id: uid(), name, role: m.role || m.title || '',
      callTime, location: '', radio: '', credentials: '', notes,
    })
  })

  // From store call times (if any) — merge without duplicating
  ;(state.onSite?.callTimes || []).forEach(ct => {
    if (!results.some(r => r.name === ct.name)) {
      results.push({
        id: uid(), name: ct.name || '', role: ct.role || '',
        callTime: ct.callTime || '', location: ct.location || '',
        radio: ct.radio || '', credentials: ct.credentials || '', notes: ct.notes || '',
      })
    }
  })

  return results
}

// Format "09:00" → "9:00 AM"
function fmtCallTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = ((h % 12) || 12)
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

/* ─── Timeline helpers ────────────────────────────────────── */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const clean = timeStr.trim().toUpperCase()
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
  if (!match) return null
  let [, h, m, ampm] = match
  h = parseInt(h); m = parseInt(m)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h * 60 + m
}
function parseDurationToMinutes(dur) {
  if (!dur || dur === '—') return 0
  const h = (dur.match(/(\d+)h/) || [])[1]
  const m = (dur.match(/(\d+)m/) || [])[1]
  return (parseInt(h||0) * 60) + parseInt(m||0)
}
function minutesToDisplay(mins) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`
}

/* ─── Cue card (timeline & table) ─────────────────────────── */
function CueCard({ r, onUpdate, onDelete, onDuplicate, team, isViewOnly }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ ...r })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const save = () => { onUpdate(r.id, form); setEditing(false); setExpanded(false) }

  return (
    <div style={{
      background: r.clientFacing ? 'rgba(200,168,64,0.06)' : 'var(--surface)',
      border: `1px solid ${r.clientFacing ? 'rgba(200,168,64,0.25)' : 'var(--border)'}`,
      borderLeft: `3px solid ${r.clientFacing ? 'var(--signal-amber-dot)' : 'var(--border-med)'}`,
      borderRadius:4, marginBottom:4, overflow:'hidden',
    }}>
      <div onClick={() => !editing && setExpanded(e => !e)}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer', userSelect:'none' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, lineHeight:1.3,
            color: r.status === 'Complete' ? 'var(--ink-300)' : 'var(--ink-900)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {r.item || 'Untitled cue'}
          </p>
          <div style={{ display:'flex', gap:8, marginTop:2, flexWrap:'wrap' }}>
            {r.duration && r.duration !== '—' && <span style={{ fontSize:10, color:'var(--ink-400)', fontFamily:'var(--font-mono)' }}>{r.duration}</span>}
            {r.location   && <span style={{ fontSize:10, color:'var(--ink-400)' }}>· {r.location}</span>}
            {r.owner      && <span style={{ fontSize:10, fontWeight:600, color:'var(--ink-600)' }}>· {r.owner}</span>}
            {r.department && <span style={{ fontSize:10, color:'var(--ink-400)' }}>· {r.department}</span>}
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
              color:statusPill(r.status).color, background:statusPill(r.status).bg, padding:'1px 6px', borderRadius:2 }}>
              {r.status || 'Planned'}
            </span>
            {r.notes && <span style={{ fontSize:10, color:'var(--ink-300)', fontStyle:'italic' }}>· {r.notes}</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {r.clientFacing && (
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              color:'var(--signal-amber-text)', background:'var(--signal-amber-bg)', padding:'2px 6px', borderRadius:2 }}>
              Client
            </span>
          )}
          {!isViewOnly && (
            <span onClick={e => e.stopPropagation()}
              style={{ display:'inline-flex', gap:4, opacity: hov ? 1 : 0, transition:'opacity 0.12s',
                pointerEvents: hov ? 'auto' : 'none' }}>
              <RowAction label="Edit" symbol="✎" onClick={() => { setExpanded(true); setEditing(true) }}/>
              <RowAction label="Duplicate" symbol="⧉" onClick={() => onDuplicate(r)}/>
              <RowAction label={r.status === 'Complete' ? 'Mark planned' : 'Mark complete'} symbol="✓"
                active={r.status === 'Complete'}
                onClick={() => onUpdate(r.id, { status: r.status === 'Complete' ? 'Planned' : 'Complete' })}/>
              <RowAction label="Delete" symbol="×" danger onClick={() => onDelete(r.id)}/>
            </span>
          )}
        </div>
      </div>

      {expanded && !isViewOnly && (
        <div style={{ padding:'0 12px 12px', borderTop:'1px solid var(--border)' }}>
          {!editing ? (
            <div style={{ display:'flex', gap:8, paddingTop:10 }}>
              <button onClick={() => setEditing(true)}
                style={{ fontSize:11, fontWeight:600, padding:'4px 12px', background:'var(--surface)',
                  border:'1px solid var(--border-med)', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', color:'var(--ink-600)' }}>
                Edit
              </button>
              <button onClick={() => onUpdate(r.id, { clientFacing: !r.clientFacing })}
                style={{ fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
                  background: r.clientFacing ? 'var(--signal-amber-bg)' : 'var(--surface)',
                  color: r.clientFacing ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                  border: `1px solid ${r.clientFacing ? 'var(--signal-amber-text)' : 'var(--border)'}` }}>
                {r.clientFacing ? '✓ Client-Facing' : 'Mark Client-Facing'}
              </button>
            </div>
          ) : (
            <div style={{ paddingTop:10 }}>
              <div style={{ display:'grid', gridTemplateColumns:'80px 70px 1fr', gap:8, marginBottom:8 }}>
                <input value={form.time||''} onChange={up('time')} placeholder="7:00 PM" autoFocus/>
                <input value={form.duration||''} onChange={up('duration')} placeholder="30m"/>
                <input value={form.item||''} onChange={up('item')} placeholder="Activity"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <input value={form.location||''} onChange={up('location')} placeholder="Location"/>
                <OwnerSelect value={form.owner} onChange={v => setForm(p=>({...p,owner:v}))} team={team}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <select value={form.department||''} onChange={up('department')} style={{ fontFamily:'var(--font)' }}>
                  <option value="">Department…</option>
                  {ROS_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={form.status||'Planned'} onChange={up('status')} style={{ fontFamily:'var(--font)' }}>
                  {ROS_STATUSES.map(st => <option key={st}>{st}</option>)}
                </select>
              </div>
              <input value={form.notes||''} onChange={up('notes')} placeholder="Notes" style={{ width:'100%', marginBottom:8 }}/>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-primary" onClick={save}>Save</button>
                <button className="btn-secondary" onClick={() => { setEditing(false); setForm({...r}) }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Timeline view ─────────────────────────────────────────── */
function TimelineView({ rows, onUpdate, onDelete, onDuplicate, team, isViewOnly, onAdd }) {
  const PX_MIN  = 1.8   // px per minute for gap spacing
  const GAP_MIN = 8     // floor between adjacent cards
  const GAP_MAX = 40    // cap so multi-hour jumps don't blow out the layout
  // Proportional spacing for close cues, capped so sparse schedules stay compact
  const spaceFor = (gapMins, prevDur) =>
    Math.min(Math.max((gapMins - prevDur) * PX_MIN, GAP_MIN), GAP_MAX)

  const timed = rows
    .map(r => ({ ...r, _mins: parseTimeToMinutes(r.time) }))
    .filter(r => r._mins !== null)
    .sort((a, b) => a._mins - b._mins)
  const untimed = rows.filter(r => parseTimeToMinutes(r.time) === null)

  if (rows.length === 0) return (
    <div style={{ padding:'60px 0', textAlign:'center' }}>
      <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:12 }}>
        No entries yet.
      </p>
      {!isViewOnly && <button className="btn-primary" onClick={onAdd}>+ Add entry</button>}
    </div>
  )

  // Current time
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  return (
    <div>
      {timed.length > 0 && (
        <div style={{ display:'flex' }}>
          {/* Time axis — flows alongside cards */}
          <div style={{ width:64, flexShrink:0 }}>
            {timed.map((r, i) => {
              const prev = i === 0 ? null : timed[i-1]
              const gapMins = prev ? Math.max(r._mins - prev._mins, 0) : 0
              const prevDur = prev ? parseDurationToMinutes(prev.duration) : 0
              // Space = gap after previous card finishes, floored and capped
              const spacePx = i === 0 ? 0 : spaceFor(gapMins, prevDur)
              return (
                <div key={r.id} style={{ paddingTop: spacePx }}>
                  <div style={{ paddingTop: i === 0 ? 2 : 0, paddingBottom: 2,
                    height: Math.min(Math.max(parseDurationToMinutes(r.duration) * PX_MIN, 44), 120),
                    display:'flex', alignItems:'flex-start' }}>
                    <span style={{ fontSize:10, fontWeight:600, color:'var(--ink-300)',
                      fontFamily:'var(--font-mono)', whiteSpace:'nowrap', paddingTop:3 }}>
                      {r.time}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cards column */}
          <div style={{ flex:1, position:'relative' }}>
            {/* Now line — shown between cards if current time falls in range */}
            {(() => {
              if (timed.length < 2) return null
              const firstMins = timed[0]._mins
              const lastMins  = timed[timed.length-1]._mins
              if (nowMins < firstMins || nowMins > lastMins) return null
              // Find the gap it falls in
              let topOffset = 0
              for (let i = 0; i < timed.length; i++) {
                const r    = timed[i]
                const prev = i === 0 ? null : timed[i-1]
                const gapMins = prev ? Math.max(r._mins - prev._mins, 0) : 0
                const prevDur = prev ? parseDurationToMinutes(prev.duration) : 0
                const spacePx = i === 0 ? 0 : spaceFor(gapMins, prevDur)
                topOffset += spacePx
                if (r._mins > nowMins) {
                  return (
                    <div key="nowline" style={{ position:'absolute', top: topOffset - 4, left:0, right:0, zIndex:5,
                      borderTop:'1.5px dashed var(--signal-red-dot)', pointerEvents:'none' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--signal-red-dot)', marginTop:-4 }}/>
                    </div>
                  )
                }
                topOffset += Math.min(Math.max(parseDurationToMinutes(r.duration) * PX_MIN, 44), 120)
              }
              return null
            })()}

            {timed.map((r, i) => {
              const prev    = i === 0 ? null : timed[i-1]
              const gapMins = prev ? Math.max(r._mins - prev._mins, 0) : 0
              const prevDur = prev ? parseDurationToMinutes(prev.duration) : 0
              const spacePx = i === 0 ? 0 : spaceFor(gapMins, prevDur)
              const cardMinH = Math.min(Math.max(parseDurationToMinutes(r.duration) * PX_MIN, 44), 120)
              return (
                <div key={r.id} style={{ paddingTop: spacePx }}>
                  <div style={{ minHeight: cardMinH }}>
                    <CueCard r={r} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} team={team} isViewOnly={isViewOnly}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unscheduled */}
      {untimed.length > 0 && (
        <div style={{ marginTop: timed.length ? 32 : 0, paddingTop: timed.length ? 16 : 0,
          borderTop: timed.length ? '1px solid var(--border)' : 'none' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:10 }}>Unscheduled</p>
          {untimed.map(r => (
            <CueCard key={r.id} r={r} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} team={team} isViewOnly={isViewOnly}/>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Phase color palette ─────────────────────────────────── */
const PHASE_COLORS = [
  { bg:'rgba(61,122,74,0.13)',   text:'#2A6038', border:'rgba(61,122,74,0.35)',   dot:'#3D7A4A'  },
  { bg:'rgba(200,168,64,0.14)',  text:'#7A5808', border:'rgba(200,168,64,0.38)',  dot:'#C8A840'  },
  { bg:'rgba(60,100,200,0.12)',  text:'#1A3A90', border:'rgba(60,100,200,0.30)',  dot:'#3C64C8'  },
  { bg:'rgba(184,48,48,0.11)',   text:'#7A1818', border:'rgba(184,48,48,0.30)',   dot:'#B83030'  },
  { bg:'rgba(130,60,190,0.12)', text:'#5A1A8A', border:'rgba(130,60,190,0.30)', dot:'#823CBE'  },
  { bg:'rgba(30,160,160,0.12)',  text:'#0A5858', border:'rgba(30,160,160,0.30)', dot:'#1EA0A0'  },
  { bg:'rgba(210,100,30,0.12)',  text:'#8A3A08', border:'rgba(210,100,30,0.30)', dot:'#D2641E'  },
  { bg:'rgba(100,100,100,0.11)',text:'#3A3A3A', border:'rgba(100,100,100,0.28)',dot:'#646464'  },
]
const phaseColor = i => PHASE_COLORS[i % PHASE_COLORS.length]

/* ─── Calendar helpers ────────────────────────────────────── */
function parseDate(str) {
  if (!str) return null
  const d = new Date(str + 'T12:00:00')
  return isNaN(d) ? null : d
}
function startOfWeek(date) {
  const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
const DAY_ABBR   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

/* ─── CalendarView ─────────────────────────────────────────── */
function CalendarView({ phases, calView, onSelectPhase, onBack }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const phaseDates = phases.map(p => parseDate(p.date)).filter(Boolean)
  const anchor = phaseDates.length > 0
    ? new Date(Math.min(...phaseDates.map(d => d.getTime()))) : today

  const [cursor, setCursor] = useState(() =>
    calView === 'week' ? startOfWeek(anchor) : startOfMonth(anchor))

  // All phases visible by default
  const [visibleIds, setVisibleIds] = useState(() => new Set(phases.map(p => p.id)))

  const togglePhaseVisible = id => setVisibleIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => setVisibleIds(prev =>
    prev.size === phases.length ? new Set() : new Set(phases.map(p => p.id))
  )

  useEffect(() => {
    setCursor(calView === 'week' ? startOfWeek(anchor) : startOfMonth(anchor))
  }, [calView])

  // Build the days grid
  const days = []
  if (calView === 'week') {
    for (let i = 0; i < 7; i++) days.push(addDays(cursor, i))
  } else {
    const first = startOfMonth(cursor)
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    const dim = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0).getDate()
    for (let i = 1; i <= dim; i++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), i))
  }

  function itemsForDay(day) {
    if (!day) return []
    const out = []
    phases.forEach((ph, pi) => {
      if (!visibleIds.has(ph.id)) return          // ← filter hidden phases
      const phDate = parseDate(ph.date)
      if (!phDate || !sameDay(phDate, day)) return
      out.push({ kind:'phase', ph, pi })
      ;(ph.rows||[]).forEach(r => out.push({ kind:'row', r, ph, pi }))
    })
    out.sort((a,b) => {
      const ta = a.kind==='row' ? (a.r.time||'') : '00:00'
      const tb = b.kind==='row' ? (b.r.time||'') : '00:00'
      return ta.localeCompare(tb)
    })
    return out
  }

  const prev = () => calView==='week' ? setCursor(d=>addDays(d,-7)) : setCursor(d=>new Date(d.getFullYear(),d.getMonth()-1,1))
  const next = () => calView==='week' ? setCursor(d=>addDays(d, 7)) : setCursor(d=>new Date(d.getFullYear(),d.getMonth()+1,1))
  const goToday = () => setCursor(calView==='week' ? startOfWeek(today) : startOfMonth(today))

  const label = calView==='week'
    ? `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()} — Week of ${cursor.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`
    : `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`

  const unscheduled = phases.filter(ph => !parseDate(ph.date))

  return (
    <div style={{ display:'flex', width:'100%', height:'100%', overflow:'hidden' }}>

      {/* Main grid */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Nav bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px 10px',
          borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <button onClick={onBack}
            style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
              color:'var(--ink-600)', background:'var(--surface)', border:'1px solid var(--border-med)',
              borderRadius:4, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font)',
              marginRight:4 }}>
            ← Phases
          </button>
          <button onClick={prev} style={{ background:'none', border:'1px solid var(--border)',
            borderRadius:4, padding:'4px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>‹</button>
          <button onClick={next} style={{ background:'none', border:'1px solid var(--border)',
            borderRadius:4, padding:'4px 10px', cursor:'pointer', color:'var(--ink-500)', fontSize:14 }}>›</button>
          <p style={{ flex:1, fontSize:14, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>
            {label}
          </p>
          <button onClick={goToday} style={{ fontSize:11, fontWeight:600, padding:'4px 12px',
            background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:4,
            cursor:'pointer', fontFamily:'var(--font)', color:'var(--ink-600)' }}>Today</button>
        </div>

        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flexShrink:0 }}>
          {DAY_ABBR.map(d => (
            <div key={d} style={{ padding:'5px 8px', fontSize:10, fontWeight:700,
              letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-300)',
              borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
            gridAutoRows: calView==='week' ? 'minmax(200px,1fr)' : 'minmax(96px,auto)' }}>
            {days.map((day, i) => {
              if (!day) return (
                <div key={`pad${i}`} style={{ borderRight:'1px solid var(--border)',
                  borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.015)'}}/>
              )
              const isTdy = sameDay(day, today)
              const items = itemsForDay(day)
              const limit = calView==='month' ? 4 : 99
              return (
                <div key={day.toISOString()} style={{
                  borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
                  padding:'6px', verticalAlign:'top',
                  background: isTdy ? 'rgba(200,168,64,0.04)' : 'transparent',
                }}>
                  {/* Date number */}
                  <p style={{ fontSize:11, fontWeight: isTdy ? 800 : 500, marginBottom:4,
                    color: isTdy ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                    display:'inline-block',
                    background: isTdy ? 'var(--signal-amber-bg)' : 'none',
                    borderRadius:3, padding: isTdy ? '1px 5px' : 0 }}>{day.getDate()}</p>

                  {/* Phase header badges */}
                  {items.filter(x=>x.kind==='phase').map((x,j) => {
                    const c = phaseColor(x.pi)
                    return (
                      <div key={j} onClick={() => onSelectPhase(x.ph.id)}
                        style={{ background:c.dot, color:'white', borderRadius:2,
                          padding:'2px 6px', fontSize:10, fontWeight:700,
                          letterSpacing:'0.06em', textTransform:'uppercase',
                          cursor:'pointer', marginBottom:3,
                          overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='0.8'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                        {x.ph.name}
                      </div>
                    )
                  })}

                  {/* Cue rows */}
                  {items.filter(x=>x.kind==='row').slice(0,limit).map((x,j) => {
                    const c = phaseColor(x.pi)
                    return (
                      <div key={j} onClick={() => onSelectPhase(x.ph.id)}
                        title={`${x.r.time ? x.r.time+' · ' : ''}${x.r.item}${x.r.owner?' · '+x.r.owner:''}${x.r.location?' · '+x.r.location:''}`}
                        style={{ background:c.bg, borderLeft:`3px solid ${c.dot}`,
                          color:c.text, borderRadius:3, padding:'2px 5px',
                          fontSize:10, fontWeight:500, lineHeight:1.3,
                          cursor:'pointer', marginBottom:2,
                          overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='0.7'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                        {x.r.time && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, marginRight:3, opacity:0.7 }}>{x.r.time}</span>}
                        {x.r.item}
                        {x.r.owner && <span style={{ opacity:0.65 }}> · {x.r.owner}</span>}
                      </div>
                    )
                  })}
                  {calView==='month' && items.filter(x=>x.kind==='row').length > limit && (
                    <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:2 }}>
                      +{items.filter(x=>x.kind==='row').length - limit} more
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar — phase visibility controls */}
      <div style={{ width:196, flexShrink:0, borderLeft:'1px solid var(--border)',
        overflowY:'auto', padding:'16px 12px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em',
            textTransform:'uppercase', color:'var(--ink-300)' }}>Phases</p>
          <button onClick={toggleAll}
            style={{ fontSize:10, color:'var(--ink-400)', background:'none', border:'none',
              cursor:'pointer', fontFamily:'var(--font)', padding:0,
              textDecoration:'underline', textDecorationStyle:'dotted' }}>
            {visibleIds.size === phases.length ? 'Hide all' : 'Show all'}
          </button>
        </div>

        {phases.map((ph, i) => {
          const c       = phaseColor(i)
          const d       = parseDate(ph.date)
          const visible = visibleIds.has(ph.id)
          return (
            <div key={ph.id} onClick={() => togglePhaseVisible(ph.id)}
              style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8,
                cursor:'pointer', padding:'5px 6px', borderRadius:4,
                opacity: visible ? 1 : 0.4, transition:'all 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--ground-dim)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:1,
                background: visible ? c.dot : 'transparent',
                border: `2px solid ${visible ? c.dot : 'var(--border-med)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.1s' }}>
                {visible && <span style={{ color:'white', fontSize:10, fontWeight:800, lineHeight:1 }}>✓</span>}
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-800)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
                  {ph.name}
                </p>
                <p style={{ fontSize:10, color: d ? 'var(--ink-400)' : 'var(--ink-200)',
                  fontStyle: d ? 'normal' : 'italic' }}>
                  {d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No date'}
                  {' · '}{(ph.rows||[]).length} {(ph.rows||[]).length===1?'entry':'entries'}
                </p>
              </div>
            </div>
          )
        })}

        {unscheduled.length > 0 && (
          <>
            <div style={{ borderTop:'1px solid var(--border)', margin:'10px 0' }}/>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em',
              textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>No date set</p>
            {unscheduled.map(ph => {
              const gi      = phases.indexOf(ph)
              const c       = phaseColor(gi)
              const visible = visibleIds.has(ph.id)
              return (
                <div key={ph.id} onClick={() => togglePhaseVisible(ph.id)}
                  style={{ background: visible ? c.bg : 'var(--ground-dim)',
                    borderLeft:`3px solid ${visible ? c.dot : 'var(--border)'}`,
                    borderRadius:3, padding:'6px 8px', marginBottom:6,
                    cursor:'pointer', opacity: visible ? 1 : 0.45, transition:'all 0.15s' }}>
                  <p style={{ fontSize:11, fontWeight:600,
                    color: visible ? c.text : 'var(--ink-300)', lineHeight:1.3 }}>{ph.name}</p>
                  <p style={{ fontSize:10, color: visible ? c.text : 'var(--ink-300)', opacity:0.65 }}>
                    {(ph.rows||[]).length} {(ph.rows||[]).length===1?'entry':'entries'}
                  </p>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default function RunOfShow({ projectId, production, isViewOnly }) {
  const pid = projectId || production?.id || 'default'
  const { state } = useStore()

  // Platform data for auto-generation
  const [logisticsLoadins] = useLocalState(`logistics_loadins_${projectId || production?.id || 'default'}_v1`, [])

  const [phases,        setPhases]        = useState(() => loadROS(pid))
  const team = loadProjectTeam(pid)
  const [activePhaseId, setActivePhaseId] = useState(null)
  const [tab,           setTab]           = useState('ros')
  const [viewMode,      setViewMode]      = useState('timeline')
  const [adding,        setAdding]        = useState(false)
  const [phaseModal,    setPhaseModal]    = useState(null)
  const [sendOpen,      setSendOpen]      = useState(false)
  const [pageView, setPageView] = useLocalState(`field_ros_view_${pid}_v1`, 'phases') // 'phases' | 'week' | 'month'

  // Active phase — default to first if none selected
  const activePhase = phases.find(p => p.id === activePhaseId) || phases[0] || null
  const rows = activePhase?.rows || []
  const clientRows = rows.filter(r => r.clientFacing)

  /* ── View controls: Full ROS / Internal / Client-Facing / Vendor View ── */
  const [rosView,    setRosView]    = useState('full')   // 'full' | 'internal' | 'client' | 'vendor'
  const [deptFilter, setDeptFilter] = useState('All')

  const viewRows =
    rosView === 'client'   ? rows.filter(r => r.clientFacing) :
    rosView === 'internal' ? rows.filter(r => !r.clientFacing) :
    rosView === 'vendor'   ? rows.filter(r => r.vendorFacing && !r.internalOnly) :
    rows

  const shown = viewRows.filter(r =>
    deptFilter === 'All'            ? true :
    deptFilter === 'Client Moments' ? r.clientFacing :
    deptFilter === 'Internal Only'  ? r.internalOnly :
    r.department === deptFilter
  )

  // Persist helper
  const commit = useCallback(next => {
    setPhases(next)
    saveROS(pid, next)
  }, [pid])

  const handleAutoGenerate = useCallback(() => {
    if (!activePhase) return
    // Extra per-project sources so the draft pulls from Hospitality, AV, and Staffing
    const readL = k => { try { return JSON.parse(localStorage.getItem('field_local_' + k) || 'null') } catch { return null } }
    const scopePid = projectId || production?.id || 'default'
    const extras = {
      staffing:     readL(`field_staffing_${scopePid}_v1`) || [],
      hospFood:     readL(`hosp_food_${scopePid}_v1`) || [],
      hospDrink:    readL(`hosp_drink_${scopePid}_v1`) || [],
      avCats:       readL(`avtech_cats_${scopePid}_v1`) || [],
      fabCats:      readL(`fab_${scopePid}_v1`) || [],
      vendors:      readL(`vendors_${scopePid}_v1`) || [],
      // Fallbacks so generation is resilient to store/localStorage timing
      talent:       (state.talent && state.talent.length ? state.talent : []),
      guestList:    (state.guestList && state.guestList.length ? state.guestList : []),
      milestones:   (state.milestones && state.milestones.length ? state.milestones : []),
      projectNotes: (state.projectNotes && state.projectNotes[scopePid]) || [],
      eventTime:    production?.eventTime || state.production?.eventTime || '',
      phaseDateISO: activePhase.date || '',
      phaseStart:   activePhase.startTime || '',
      phaseEnd:     activePhase.endTime || '',
    }
    const newRows = autoGenerateRows(activePhase.type, { state, logisticsLoadins, team, extras })
    if (newRows.length === 0) {
      alert(`No data found to auto-generate for "${activePhase.type}" phases. Add data in Timeline, Vendors, Talent, Guest List, or Logistics pages first.`)
      return
    }
    // Deduplicate against items already in this phase
    const existingItems = new Set((activePhase.rows || []).map(r => r.item?.trim().toLowerCase()).filter(Boolean))
    const toAdd = newRows.filter(r => !existingItems.has(r.item?.trim().toLowerCase()))
    if (toAdd.length === 0) {
      alert('All available items are already in this phase. Nothing new to add.')
      return
    }
    commit(phases.map(p => p.id === activePhase.id
      ? { ...p, rows: [...(p.rows||[]), ...toAdd] }
      : p
    ))
  }, [activePhase, phases, commit, state, logisticsLoadins, team, projectId, production])

  const handleAutoGenerateCallTimes = useCallback(() => {
    if (!activePhase) return
    const newCTs = autoGenerateCallTimes(team, state, pid, activePhase.date || production?.eventDate)
    if (newCTs.length === 0) {
      alert('No team members found. Assign team members on the Team page first.')
      return
    }
    const existingNames = new Set((activePhase.callTimes || []).map(c => c.name?.trim().toLowerCase()).filter(Boolean))
    const toAdd = newCTs.filter(ct => !existingNames.has(ct.name?.trim().toLowerCase()))
    if (toAdd.length === 0) {
      alert('All team members are already in the call times sheet.')
      return
    }
    commit(phases.map(p => p.id === activePhase.id
      ? { ...p, callTimes: [...(p.callTimes||[]), ...toAdd] }
      : p
    ))
  }, [activePhase, phases, commit, team, state, pid, production])
  const createPhase = (form) => {
    const phase = { id: uid('ph'), rows: [], callTimes: [], ...form }
    const next = [...phases, phase]
    commit(next)
    setActivePhaseId(phase.id)
    setPhaseModal(null)
    setAdding(true)
  }

  const updatePhase = (form) => {
    commit(phases.map(p => p.id === phaseModal.id ? { ...p, ...form } : p))
    setPhaseModal(null)
  }

  const deletePhase = (id) => {
    const next = phases.filter(p => p.id !== id)
    commit(next)
    if (activePhaseId === id) setActivePhaseId(next[0]?.id || null)
  }

  /* ── Row operations ── */
  const addRow = (form) => {
    if (!activePhase) return
    const row = { id: uid('r'), ...form }
    commit(phases.map(p => p.id === activePhase.id
      ? { ...p, rows: [...p.rows, row] }
      : p
    ))
    setAdding(false)
  }

  const updateRow = (rowId, changes) => {
    commit(phases.map(p => p.id === activePhase.id
      ? { ...p, rows: p.rows.map(r => r.id === rowId ? { ...r, ...changes } : r) }
      : p
    ))
  }

  const deleteRow = (rowId) => {
    commit(phases.map(p => p.id === activePhase.id
      ? { ...p, rows: p.rows.filter(r => r.id !== rowId) }
      : p
    ))
  }

  const duplicateRow = (row) => {
    commit(phases.map(p => {
      if (p.id !== activePhase.id) return p
      const idx  = p.rows.findIndex(r => r.id === row.id)
      const copy = { ...row, id: uid('r') }
      const next = [...p.rows]
      next.splice(idx + 1, 0, copy)
      return { ...p, rows: next }
    }))
  }

  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12  = ((h % 12) || 12)
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns: pageView==='phases' ? '220px 1fr' : '1fr',
      width:'100%', height:'100%', overflow:'hidden' }}>

      {/* ── Calendar view ── */}
      {pageView !== 'phases' && (
        <CalendarView
          phases={phases}
          calView={pageView}
          onSelectPhase={id => { setActivePhaseId(id); setPageView('phases'); setTab('ros') }}
          onBack={() => setPageView('phases')}
        />
      )}

      {/* ── Phase sidebar ── */}
      {pageView === 'phases' && (
      <div style={{
        borderRight:'1px solid var(--border)', overflowY:'auto',
        display:'flex', flexDirection:'column', paddingTop:24, height:'100%',
      }} className="ros-no-print">
          <div style={{ padding:'0 14px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em',
              textTransform:'uppercase', color:'var(--ink-300)' }}>Phases</p>
            {!isViewOnly && (
              <button onClick={() => setPhaseModal('new')}
                style={{ fontSize:18, lineHeight:1, color:'var(--ink-400)', background:'none',
                  border:'none', cursor:'pointer', fontWeight:300 }}
                title="Add phase">+</button>
            )}
          </div>

          {/* View switcher: Phases / Week / Month */}
          <div style={{ display:'flex', gap:3, padding:'0 14px 10px' }}>
            {[['phases','Phases'],['week','Week'],['month','Month']].map(([id,lbl]) => (
              <button key={id} onClick={() => setPageView(id)}
                style={{ flex:1, fontSize:10, fontWeight: pageView===id ? 700 : 400,
                  padding:'4px 0', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
                  background: pageView===id ? 'var(--ink-900)' : 'transparent',
                  color: pageView===id ? 'white' : 'var(--ink-400)',
                  border:`1px solid ${pageView===id ? 'var(--ink-900)' : 'var(--border)'}` }}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ flex:1, padding:'0 8px' }}>
            {phases.length === 0 ? (
              <div style={{ padding:'24px 8px', textAlign:'center' }}>
                <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic', lineHeight:1.5 }}>
                  No phases yet.{!isViewOnly && <><br/>Click + to add one.</>}
                </p>
              </div>
            ) : phases.map(ph => {
              const isActive = ph.id === (activePhase?.id)
              return (
                <div key={ph.id}
                  onClick={() => { setActivePhaseId(ph.id); setAdding(false); setTab('ros') }}
                  style={{
                    padding:'9px 10px', borderRadius:4, marginBottom:2, cursor:'pointer',
                    background: isActive ? 'var(--ink-900)' : 'transparent',
                    transition:'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--ground-dim)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:600, lineHeight:1.3, marginBottom:2,
                        color: isActive ? 'white' : 'var(--ink-900)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ph.name}
                      </p>
                      {ph.date && (
                        <p style={{ fontSize:10, color: isActive ? 'rgba(255,255,255,0.55)' : 'var(--ink-400)' }}>
                          {new Date(ph.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                          {ph.startTime && ` · ${formatTime(ph.startTime)}`}
                        </p>
                      )}
                      <p style={{ fontSize:10, color: isActive ? 'rgba(255,255,255,0.40)' : 'var(--ink-300)' }}>
                        {ph.rows.length} {ph.rows.length === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                    {!isViewOnly && (
                      <div style={{ display:'flex', flexDirection:'column', gap:2, marginLeft:4 }}>
                        <button onClick={e => { e.stopPropagation(); setPhaseModal(ph) }}
                          style={{ fontSize:10, color: isActive ? 'rgba(255,255,255,0.45)' : 'var(--ink-300)',
                            background:'none', border:'none', cursor:'pointer', lineHeight:1 }}
                          title="Edit phase">✎</button>
                        <button onClick={e => { e.stopPropagation(); deletePhase(ph.id) }}
                          style={{ fontSize:12, color: isActive ? 'rgba(255,255,255,0.35)' : 'var(--ink-200)',
                            background:'none', border:'none', cursor:'pointer', lineHeight:1 }}
                          title="Delete phase">×</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

        {/* ── Phase content ── */}
        {pageView === 'phases' && (
        <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}
          style={{ overflowY:'auto', height:'100%', padding:'32px 0 80px' }}
          className="ros-no-print">
          {!activePhase ? (
            <div style={{ padding:'80px 48px', textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:20, fontStyle:'italic',
                color:'var(--ink-200)', marginBottom:12 }}>No phases yet.</p>
              {!isViewOnly && (
                <button className="btn-primary" onClick={() => setPhaseModal('new')}>
                  + Add first phase
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding:'0 var(--page-px, 48px)' }}>

              {/* Phase header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    {activePhase.location && (
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{activePhase.location}</span>
                    )}
                    {activePhase.startTime && activePhase.endTime && (
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>
                        {activePhase.location ? '· ' : ''}{formatTime(activePhase.startTime)} – {formatTime(activePhase.endTime)}
                      </span>
                    )}
                  </div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:800,
                    letterSpacing:'-0.03em', color:'var(--ink-900)', marginBottom:4 }}>
                    {activePhase.name}
                  </h1>
                  <PageOwner area="Run of Show" projectId={pid}/>
                  {activePhase.date && (
                    <p style={{ fontSize:14, color:'var(--ink-400)' }}>
                      {new Date(activePhase.date + 'T12:00:00').toLocaleDateString('en-US',
                        { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                    </p>
                  )}
                  <p style={{ fontSize:12, color:'var(--ink-300)', marginTop:4 }}>
                    {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                    {clientRows.length > 0 && ` · ${clientRows.length} client-facing`}
                  </p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn-secondary" onClick={() => window.print()}
                    title="Exports the exact ROS data shown on this page — same live source as Send Package">
                    ↓ Export PDF
                  </button>
                  {!isViewOnly && tab === 'ros' && (
                    <button className="btn-secondary" onClick={handleAutoGenerate}
                      title={`Pull data from Timeline, Vendors, Talent, and other pages to generate cues for "${activePhase.type}" phases`}>
                      ✦ Auto-generate
                    </button>
                  )}
                  {!isViewOnly && tab === 'calltimes' && (
                    <button className="btn-secondary" onClick={handleAutoGenerateCallTimes}
                      title="Pull assigned team members from the Team page">
                      ✦ Auto-generate
                    </button>
                  )}
                  {!isViewOnly && tab !== 'calltimes' && (
                    <button className="btn-primary" onClick={() => setAdding(a => !a)}>
                      + Add entry
                    </button>
                  )}

                </div>
              </div>

              {/* Tabs */}
              <div className="tabs" style={{ marginBottom:0 }}>
                {[
                  { id:'ros',       label:'Run of Show'  },
                  { id:'calltimes', label:'Call Times'   },
                ].map(t => (
                  <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`}
                    onClick={() => { setTab(t.id); setAdding(false) }}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => setSendOpen(true)}
                  style={{ marginLeft:'auto', fontSize:11, fontWeight:600, padding:'6px 14px',
                    background:'var(--ink-900)', color:'white', border:'none', borderRadius:4,
                    cursor:'pointer', fontFamily:'var(--font)', letterSpacing:'0.04em' }}>
                  ↗ Send Package
                </button>
              </div>

              {/* Add row form */}
              <AnimatePresence>
                {adding && tab === 'ros' && (
                  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}>
                    <AddRowForm onAdd={addRow} onCancel={() => setAdding(false)} team={team}/>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ROS — view controls, filters, then Timeline or Table */}
              {tab === 'ros' && (
                <>
                  {/* View controls — switch audience views without leaving the ROS */}
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:10, marginTop:10, flexWrap:'wrap' }}>
                    {[['full','Full ROS'],['internal','Internal'],['client','Client-Facing'],['vendor','Vendor View']].map(([id, label]) => (
                      <button key={id} onClick={() => setRosView(id)}
                        style={{ fontSize:11, fontWeight: rosView===id ? 700 : 500,
                          padding:'5px 14px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
                          background: rosView===id ? 'var(--ink-900)' : 'var(--surface)',
                          color: rosView===id ? 'white' : 'var(--ink-500)',
                          border: `1px solid ${rosView===id ? 'var(--ink-900)' : 'var(--border)'}` }}>
                        {label}
                      </button>
                    ))}
                    <span style={{ margin:'0 4px', color:'var(--ink-100)' }}>|</span>
                    {shown.length > 0 && [['timeline','Timeline'],['table','Table']].map(([id, label]) => (
                      <button key={id} onClick={() => setViewMode(id)}
                        style={{ fontSize:11, fontWeight: viewMode===id ? 700 : 400,
                          padding:'4px 12px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)',
                          background: viewMode===id ? 'var(--ground-dim)' : 'var(--surface)',
                          color: viewMode===id ? 'var(--ink-800)' : 'var(--ink-400)',
                          border: `1px solid ${viewMode===id ? 'var(--border-med)' : 'var(--border)'}` }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="filter-chips" style={{ marginBottom:12 }}>
                    {['All','Production','Venue','Hospitality','Talent','AV / Tech','Client Moments','Internal Only'].map(c => (
                      <button key={c} className={`chip${deptFilter===c?' active':''}`} onClick={() => setDeptFilter(c)}>{c}</button>
                    ))}
                  </div>

                  {viewMode === 'timeline' ? (
                    <div style={{ paddingTop:8 }}>
                      <TimelineView rows={shown} onUpdate={updateRow} onDelete={deleteRow} onDuplicate={duplicateRow}
                        team={team} isViewOnly={isViewOnly} onAdd={() => setAdding(true)}/>
                    </div>
                  ) : (
                    <div style={{ borderTop:'1.5px solid var(--ink-900)' }}>
                      <table className="data-table" style={{ width:'100%' }}>
                        <colgroup>
                          <col style={{ width:'76px' }}/>
                          <col/>
                          <col style={{ width:'130px' }}/>
                          <col style={{ width:'110px' }}/>
                          <col style={{ width:'100px' }}/>
                          <col style={{ width:'112px' }}/>
                        </colgroup>
                        <thead>
                          <tr>
                            <th>Time</th><th>Moment</th><th>Owner</th>
                            <th>Department</th><th>Status</th><th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {shown.map(r => <ROSRow key={r.id} r={r} onUpdate={updateRow} onDelete={deleteRow}
                            onDuplicate={duplicateRow} team={team} isViewOnly={isViewOnly}/>)}
                        </tbody>
                      </table>
                      {shown.length === 0 && (
                        <div style={{ padding:'48px 0', textAlign:'center' }}>
                          <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-200)', marginBottom:6 }}>
                            {rosView === 'client' ? 'No client-facing entries in this view.'
                              : rosView === 'vendor' ? 'No entries marked for the Vendor View yet.'
                              : deptFilter !== 'All' ? 'No entries match this filter.'
                              : 'No entries yet.'}
                          </p>
                          <p style={{ fontSize:11, color:'var(--ink-300)' }}>
                            {rosView === 'client' ? 'Mark entries Client-Facing from any row editor.'
                              : rosView === 'vendor' ? 'Open a row and choose “Include in Vendor View”.'
                              : !isViewOnly && deptFilter === 'All' ? 'Click + Add entry above.' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {viewMode === 'table' && rows.length > 0 && (
                    <p style={{ fontSize:10, color:'var(--ink-300)', marginTop:10 }}>
                      Click any row to edit · hover for quick actions · Export PDF and Send Package use this same live ROS data
                    </p>
                  )}
                </>
              )}

              {/* Call Times tab */}
              {tab === 'calltimes' && (
                <div style={{ marginTop:24 }}>
                  <CallTimesTab
                    phase={activePhase}
                    phases={phases}
                    commit={commit}
                    team={team}
                    onAutoGenerate={handleAutoGenerateCallTimes}
                    isViewOnly={isViewOnly}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
        )}

      {/* Send Package modal */}
      {sendOpen && (
        <SendPackageModal
          phases={phases}
          activePhase={activePhase}
          production={production}
          pid={pid}
          onClose={() => setSendOpen(false)}
        />
      )}

      {/* Phase modal */}
      <AnimatePresence>
        {phaseModal && (
          <PhaseModal
            phase={phaseModal === 'new' ? null : phaseModal}
            onSave={phaseModal === 'new' ? createPhase : updatePhase}
            onClose={() => setPhaseModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Print view — exports the exact rows shown on the ROS page (single data source) */}
      <PrintView phase={activePhase} projectName={production?.name || 'Event'} production={production}
        rowsOverride={tab === 'ros' ? shown : undefined}
        viewLabel={tab === 'ros'
          ? ({ full:'Full ROS', internal:'Internal', client:'Client-Facing', vendor:'Vendor View' }[rosView]
             + (deptFilter !== 'All' ? ` · ${deptFilter}` : ''))
          : undefined}/>

      <style>{`
        .ros-print-only { display: none; }
        @media print {
          .ros-no-print  { display: none !important; }
          .ros-print-only { display: block !important; }
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  )
}
