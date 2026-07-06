import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const FILE_TYPES = ['All','Creative','Finance','Contract','Production','Reference']
const UPLOAD_TYPES = ['Creative','Finance','Contract','Production','Reference']

const TYPE_ICONS = {
  Creative:   { icon:'⬡', color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'  },
  Finance:    { icon:'$',  color:'var(--signal-green-text)', bg:'var(--signal-green-bg)' },
  Contract:   { icon:'✍',  color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' },
  Production: { icon:'⚙',  color:'var(--ink-500)',           bg:'var(--ink-100)'         },
  Reference:  { icon:'◎',  color:'var(--ink-400)',           bg:'var(--ground-dim)'      },
}

function statusPill(s) {
  if (s === 'Current' || s === 'Signed') return 'pill-green'
  return 'pill-neutral'
}

function fmtBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/(1024*1024)).toFixed(1)} MB`
}

export default function Files() {
  const { state, dispatch } = useStore()
  const { files } = state
  const [filterType, setFilterType] = useState('All')
  const [uploadType, setUploadType] = useState('Production')
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef(null)

  const displayed = filterType === 'All' ? files : files.filter(f => f.type === filterType)
  const fileTypes  = FILE_TYPES.filter(t => t === 'All' || files.some(f => f.type === t))

  const today = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})

  const handleFiles = e => {
    Array.from(e.target.files).forEach(f => {
      dispatch(A.addFile({
        name: f.name.replace(/\.[^.]+$/, ''),
        type: uploadType,
        format: f.name.split('.').pop().toUpperCase(),
        size: fmtBytes(f.size),
        uploadedBy: 'You',
        uploadedDate: today,
        status: 'Current',
      }))
    })
    e.target.value = ''
    setShowUpload(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.28 }}>
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <h1 className="page-title">Files</h1>
            <p className="page-subtitle">{files.length} files · contracts, creative assets, production documents</p>
          </div>
          <button onClick={() => setShowUpload(s => !s)}
            style={{ padding:'8px 16px', borderRadius:'var(--r-sm)', fontSize:13, fontWeight:500,
              background:'var(--ink-900)', color:'white', border:'none', cursor:'pointer' }}>
            + Upload file
          </button>
        </div>

        {showUpload && (
          <div style={{ background:'var(--ground-dim)', border:'1px solid var(--border)', borderRadius:6,
            padding:'14px 18px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-end',
            maxWidth:'var(--cap-form)' }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase',
                color:'var(--ink-300)', marginBottom:5 }}>File type</p>
              <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                style={{ fontSize:13, height:34, padding:'0 8px', border:'1px solid var(--border)',
                  borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)', outline:'none' }}>
                {UPLOAD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display:'none' }} onChange={handleFiles}/>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ height:34, padding:'0 16px', fontSize:12, fontWeight:600,
                background:'var(--ink-900)', color:'white', border:'none', borderRadius:3,
                cursor:'pointer', fontFamily:'var(--font)' }}>
              Choose files…
            </button>
            <button onClick={() => setShowUpload(false)}
              style={{ height:34, padding:'0 12px', fontSize:12, background:'transparent',
                color:'var(--ink-400)', border:'1px solid var(--border)', borderRadius:3,
                cursor:'pointer', fontFamily:'var(--font)' }}>
              Cancel
            </button>
          </div>
        )}

        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {fileTypes.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:12,
                border:`1px solid ${filterType===t?'var(--ink-700)':'var(--border-med)'}`,
                background: filterType===t?'var(--ink-900)':'transparent',
                color: filterType===t?'white':'var(--ink-500)',
                cursor:'pointer', transition:'all 0.12s' }}>{t}</button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:1, border:'1px solid var(--border)',
          borderRadius:'var(--r-md)', overflow:'hidden', background:'var(--surface)' }}>
          {displayed.map((f, i) => {
            const meta = TYPE_ICONS[f.type] || TYPE_ICONS.Production
            return (
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 18px',
                borderBottom: i < displayed.length-1 ? '1px solid var(--border)' : 'none', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--ground-dim)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:34, height:34, borderRadius:7, background:meta.bg, color:meta.color,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', marginBottom:2,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</p>
                  <p style={{ fontSize:11, color:'var(--ink-400)' }}>
                    {f.format} · {f.size} · Uploaded by {f.uploadedBy} on {f.uploadedDate}
                  </p>
                </div>
                <span className={`pill ${statusPill(f.status)}`} style={{ flexShrink:0 }}>{f.status}</span>
                <button onClick={() => dispatch(A.deleteFile(f.id))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)',
                    fontSize:16, lineHeight:1, padding:'0 4px', flexShrink:0 }}
                  title="Remove file">×</button>
              </div>
            )
          })}
          {displayed.length === 0 && (
            <div style={{ padding:'48px 0', textAlign:'center' }}>
              <p style={{ fontSize:14, color:'var(--ink-300)' }}>No files in this category</p>
            </div>
          )}
        </div>
        <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:12 }}>
          Files are accessible throughout the production. Upload contracts, creative assets, and documents as they become available.
        </p>
      </motion.div>
    </div>
  )
}
