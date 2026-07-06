/**
 * DataManager — Data safeguards panel
 *
 * Accessible from the workspace topbar menu.
 * Provides:
 *   - Full data export (download JSON backup)
 *   - Import/restore from backup file
 *   - Dev mode toggle (writes go to dev namespace, never touch production)
 *   - Write log viewer (last 100 writes for debugging)
 *   - Storage usage summary
 */
import React, { useState, useRef, useEffect } from 'react'
import { exportBackup, restoreBackup, getWriteLog, setDevMode } from '../useLocalState.js'

function formatBytes(n) {
  if (n < 1024)        return `${n} B`
  if (n < 1024 * 1024) return `${(n/1024).toFixed(1)} KB`
  return `${(n/(1024*1024)).toFixed(2)} MB`
}

function storageStats() {
  let total = 0, fieldTotal = 0, keyCount = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      const v = localStorage.getItem(k) || ''
      const sz = new TextEncoder().encode(k + v).length
      total += sz
      if (k?.startsWith('field_')) { fieldTotal += sz; keyCount++ }
    }
  } catch {}
  return { total, fieldTotal, keyCount, limitApprox: 5 * 1024 * 1024 }
}

export default function DataManager({ onClose }) {
  const [devMode, setDevModeState] = useState(() => {
    try { return localStorage.getItem('field_dev_mode') === '1' } catch { return false }
  })
  const [importStatus, setImportStatus] = useState(null)  // null | { ok, message, details }
  const [showLog,      setShowLog]      = useState(false)
  const [log,          setLog]          = useState([])
  const [stats,        setStats]        = useState(storageStats)
  const fileRef = useRef(null)

  useEffect(() => { setLog(getWriteLog().slice().reverse()) }, [showLog])

  const handleExport = () => {
    const json     = exportBackup()
    const blob     = new Blob([json], { type:'application/json' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = `field-backup-${new Date().toISOString().slice(0,16).replace('T','-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        // Dry run first
        const dry = restoreBackup(ev.target.result, { dryRun: true })
        if (dry.blocked > 0) {
          setImportStatus({
            ok: false,
            message: `Import blocked: ${dry.blocked} key(s) would have shrunk existing data. This looks like an older or incomplete backup being imported over newer data.`,
            details: null,
          })
          return
        }
        const result = restoreBackup(ev.target.result)
        setStats(storageStats())
        setImportStatus({
          ok: true,
          message: `Restored ${result.total} keys successfully. Refresh the page to apply.`,
          details: null,
        })
      } catch (err) {
        setImportStatus({ ok: false, message: err.message, details: null })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const toggleDevMode = () => {
    const next = !devMode
    setDevMode(next)
    setDevModeState(next)
  }

  const usedPct = Math.round((stats.fieldTotal / stats.limitApprox) * 100)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(10,9,8,0.45)', backdropFilter:'blur(3px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:10,
          width:540, maxWidth:'calc(100vw - 32px)', maxHeight:'88vh',
          boxShadow:'0 24px 64px rgba(10,9,8,0.24)', display:'flex', flexDirection:'column',
          overflow:'hidden', fontFamily:'var(--font)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Data & Backup</p>
            <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:2 }}>
              Manage your project data, backups, and developer settings
            </p>
          </div>
          <button onClick={onClose}
            style={{ fontSize:22, color:'var(--ink-300)', background:'none', border:'none',
              cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>

          {/* Storage usage */}
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:10 }}>Storage usage</p>
            <div style={{ background:'var(--ground-dim)', borderRadius:4, height:6, marginBottom:6 }}>
              <div style={{ width:`${Math.min(usedPct, 100)}%`, height:'100%', borderRadius:4,
                background: usedPct > 80 ? 'var(--signal-red-dot)' : usedPct > 60 ? 'var(--signal-amber-dot)' : 'var(--signal-green-dot)',
                transition:'width 0.3s' }}/>
            </div>
            <p style={{ fontSize:12, color:'var(--ink-400)' }}>
              {formatBytes(stats.fieldTotal)} used across {stats.keyCount} Field keys
              {' · '}{usedPct}% of ~5 MB browser limit
            </p>
          </div>

          {/* Export */}
          <div style={{ marginBottom:20 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:8 }}>Export / Backup</p>
            <p style={{ fontSize:13, color:'var(--ink-600)', marginBottom:10, lineHeight:1.5 }}>
              Download a complete JSON snapshot of all your Field data. Store this file somewhere safe — it's your recovery option if something goes wrong.
            </p>
            <button className="btn-primary" onClick={handleExport}>↓ Download backup</button>
          </div>

          {/* Import */}
          <div style={{ marginBottom:20, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'var(--ink-300)', marginBottom:8 }}>Restore from backup</p>
            <p style={{ fontSize:13, color:'var(--ink-600)', marginBottom:10, lineHeight:1.5 }}>
              Import a previously exported backup file. The restore is guarded — it will refuse to overwrite existing data with an empty or smaller dataset.
            </p>
            <input ref={fileRef} type="file" accept=".json" style={{ display:'none' }}
              onChange={handleImportFile}/>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              ↑ Choose backup file
            </button>
            {importStatus && (
              <div style={{ marginTop:12, padding:'10px 12px', borderRadius:4,
                background: importStatus.ok ? 'var(--signal-green-bg)' : 'var(--signal-red-bg)',
                border: `1px solid ${importStatus.ok ? 'var(--signal-green-text)' : 'var(--signal-red-text)'}`,
                fontSize:12, color: importStatus.ok ? 'var(--signal-green-text)' : 'var(--signal-red-text)',
                lineHeight:1.5 }}>
                {importStatus.message}
                {importStatus.ok && <button onClick={() => window.location.reload()}
                  style={{ marginLeft:12, fontSize:11, fontWeight:700, padding:'3px 10px',
                    background:'var(--signal-green-text)', color:'white', border:'none',
                    borderRadius:3, cursor:'pointer' }}>Reload now</button>}
              </div>
            )}
          </div>

          {/* Dev mode */}
          <div style={{ paddingTop:20, borderTop:'1px solid var(--border)', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
                  color:'var(--ink-300)', marginBottom:6 }}>Developer mode</p>
                <p style={{ fontSize:13, color:'var(--ink-600)', lineHeight:1.5 }}>
                  When on, all writes go to a separate <code style={{ fontFamily:'var(--font-mono)', fontSize:11,
                    background:'var(--ground-dim)', padding:'1px 4px', borderRadius:2 }}>field_dev_*</code> namespace
                  and never touch your production data. Use this when testing or developing new features.
                </p>
              </div>
              <button onClick={toggleDevMode}
                style={{ flexShrink:0, width:48, height:26, borderRadius:13, border:'none', cursor:'pointer',
                  background: devMode ? 'var(--signal-green-dot)' : 'var(--border-med)',
                  position:'relative', transition:'background 0.2s', marginTop:4 }}>
                <div style={{ position:'absolute', top:3, left: devMode ? 25 : 3, width:20, height:20,
                  borderRadius:'50%', background:'white', transition:'left 0.2s',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.20)' }}/>
              </button>
            </div>
            {devMode && (
              <div style={{ marginTop:10, padding:'8px 12px', borderRadius:4,
                background:'var(--signal-amber-bg)', border:'1px solid var(--signal-amber-text)',
                fontSize:12, color:'var(--signal-amber-text)' }}>
                ⚠ Dev mode is active. Writes go to <code style={{ fontFamily:'var(--font-mono)' }}>field_dev_*</code> — production data is safe.
              </div>
            )}
          </div>

          {/* Write log */}
          <div style={{ paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
                color:'var(--ink-300)' }}>Write log</p>
              <button onClick={() => setShowLog(l => !l)}
                style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                  cursor:'pointer', fontFamily:'var(--font)' }}>
                {showLog ? 'Hide' : 'Show last 100 writes'}
              </button>
            </div>
            {showLog && (
              <div style={{ maxHeight:200, overflowY:'auto', background:'var(--ground-dim)',
                borderRadius:4, padding:'8px 10px' }}>
                {log.length === 0 ? (
                  <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic' }}>No writes recorded yet.</p>
                ) : log.map((w, i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'3px 0',
                    borderBottom: i < log.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize:10, color:'var(--ink-300)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                      {w.at?.slice(11,19)}
                    </span>
                    <span style={{ fontSize:10, color:'var(--ink-600)', fontFamily:'var(--font-mono)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {w.key}
                    </span>
                    <span style={{ fontSize:10, color:'var(--ink-400)', marginLeft:'auto', flexShrink:0 }}>
                      {w.summary}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture note */}
          <div style={{ marginTop:20, padding:'12px 14px', borderRadius:4,
            background:'var(--ground-dim)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--ink-700)', marginBottom:4 }}>About data storage</p>
            <p style={{ fontSize:11, color:'var(--ink-400)', lineHeight:1.6 }}>
              Field currently stores data in your browser's localStorage. Data is private to this browser and device.
              For multi-user collaboration with server-side sync, conflict resolution, and monitored backups,
              connect a backend (Supabase, PlanetScale, etc.) — the data layer is structured to support this without rewrites.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
