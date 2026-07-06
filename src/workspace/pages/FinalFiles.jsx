import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalState } from '../../useLocalState.js'

const SEED = [
  { id:'ff1', name:'Final production deck',      type:'Deck',        format:'.key / .pdf', status:'Pending', owner:'', notes:'' },
  { id:'ff2', name:'Event photography — full set',type:'Photography', format:'.zip',        status:'Pending', owner:'', notes:'' },
  { id:'ff3', name:'Highlight reel — 90s',        type:'Video',       format:'.mp4',        status:'Pending', owner:'', notes:'' },
  { id:'ff4', name:'Budget reconciliation',       type:'Finance',     format:'.xlsx',       status:'Pending', owner:'', notes:'' },
  { id:'ff5', name:'Vendor invoices — all',       type:'Finance',     format:'.pdf × N',    status:'Pending', owner:'', notes:'' },
  { id:'ff6', name:'Case study assets',           type:'Case study',  format:'.zip',        status:'Pending', owner:'', notes:'' },
  { id:'ff7', name:'Post-event wrap report',      type:'Report',      format:'.pdf',        status:'Pending', owner:'', notes:'' },
]

const STATUSES = ['Pending','In progress','Uploaded','Approved']
const TYPES    = ['Deck','Photography','Video','Finance','Report','Case study','Other']

const statusPill = s => {
  if (s === 'Approved')    return 'pill-green'
  if (s === 'Uploaded')    return 'pill-blue'
  if (s === 'In progress') return 'pill-amber'
  return 'pill-neutral'
}

const uid = () => `ff${Date.now()}${Math.random().toString(36).slice(2,5)}`

export default function FinalFiles({ projectId }) {
  const key = `field_final_files_${projectId || 'default'}_v1`
  const [files, setFiles] = useLocalState(key, SEED)
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ name:'', type:'Other', format:'', status:'Pending', owner:'', notes:'' })
  const up = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const add = () => {
    if (!form.name.trim()) return
    setFiles(p => [...p, { ...form, id: uid() }])
    setForm({ name:'', type:'Other', format:'', status:'Pending', owner:'', notes:'' })
    setAdding(false)
  }

  const updateField = (id, key, val) => setFiles(p => p.map(f => f.id === id ? { ...f, [key]: val } : f))
  const remove = id => setFiles(p => p.filter(f => f.id !== id))

  return (
    <div className="page-content">
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28 }}>
        <div className="page-header">
          <h1 className="page-title">Final Files</h1>
          <p className="page-subtitle">Post-event deliverables · archive · case study</p>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
          <button className="btn-primary" onClick={() => setAdding(a => !a)}>+ Add file</button>
        </div>

        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              className="add-row" style={{ marginBottom:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 120px 120px 1fr 1fr', gap:10, marginBottom:10 }}>
                <input value={form.name}   onChange={up('name')}   placeholder="File name" autoFocus/>
                <select value={form.type}  onChange={up('type')}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
                <input value={form.format} onChange={up('format')} placeholder="Format e.g. .pdf"/>
                <input value={form.owner}  onChange={up('owner')}  placeholder="Owner"/>
                <select value={form.status} onChange={up('status')}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-primary" onClick={add}>Add</button>
                <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th><th>Type</th><th>Format</th><th>Owner</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>
                    <input value={f.name} onChange={e => updateField(f.id,'name',e.target.value)}
                      style={{ fontWeight:500, background:'none', border:'none', width:'100%',
                        fontFamily:'var(--font)', fontSize:14, color:'var(--ink-900)', outline:'none',
                        borderBottom:'1px solid transparent', transition:'border-color 0.1s' }}
                      onFocus={e => e.target.style.borderColor='var(--border-med)'}
                      onBlur={e => e.target.style.borderColor='transparent'}/>
                  </td>
                  <td><span className="pill pill-neutral">{f.type}</span></td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-500)' }}>{f.format || '—'}</td>
                  <td>
                    <input value={f.owner} onChange={e => updateField(f.id,'owner',e.target.value)}
                      placeholder="—" style={{ background:'none', border:'none', fontSize:13,
                        color:'var(--ink-600)', fontFamily:'var(--font)', outline:'none', width:'100%' }}/>
                  </td>
                  <td>
                    <select value={f.status} onChange={e => updateField(f.id,'status',e.target.value)}
                      style={{ border:'none', background:'none', cursor:'pointer', fontFamily:'var(--font)',
                        fontSize:12, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
                        color: f.status==='Approved' ? 'var(--signal-green-text)' :
                               f.status==='Uploaded' ? 'var(--signal-blue-text)' :
                               f.status==='In progress' ? 'var(--signal-amber-text)' : 'var(--ink-400)',
                        outline:'none', backgroundImage:'none', padding:0 }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <button onClick={() => remove(f.id)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'var(--ink-200)', fontSize:18, lineHeight:1 }}
                      onMouseEnter={e => e.currentTarget.style.color='var(--signal-red-text)'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--ink-200)'}>×</button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-300)', fontStyle:'italic' }}>
                  No files yet. Click + Add file to start building the archive.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:12 }}>
          Click any field to edit inline · Status updates save automatically
        </p>
      </motion.div>
    </div>
  )
}
