import React, { useState } from 'react'
import { useStore } from '../../../store.jsx'
import { typeStyle } from '../creativeShared.jsx'

function fmtSize(bytes) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CreativePremier() {
  const { state } = useStore()
  const deliverables = state.deliverables
    .filter(d => d.projectId === state.production.id)
    .filter(d => ['Approved','Production ready'].includes(d.status))
  const [enlarged, setEnlarged] = useState(null)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:4 }}>
            Premier · Client view
          </p>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>{deliverables.length} approved asset{deliverables.length===1?'':'s'} visible to the client</p>
        </div>
        <button style={{ fontSize:12, fontWeight:600, padding:'8px 16px', background:'var(--ink-900)', color:'white',
          border:'none', borderRadius:4, cursor:'pointer', fontFamily:'var(--font)' }}>
          ↗ Share Premier link
        </button>
      </div>

      {deliverables.length === 0 ? (
        <div style={{ padding:'60px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:18, fontStyle:'italic', color:'var(--ink-200)', marginBottom:8 }}>
            Nothing approved yet.
          </p>
          <p style={{ fontSize:13, color:'var(--ink-300)' }}>Assets appear here automatically once marked Approved.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {deliverables.map(d => {
            const ts = typeStyle(d.type)
            const versions = d.versions || []

            return (
              <div key={d.id} style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:40, padding:'36px 0', borderBottom:'1px solid var(--border)' }}>

                {/* Preview — click to enlarge */}
                <button onClick={() => setEnlarged(d)}
                  style={{ height:360, borderRadius:6, border:'1px solid var(--border)', cursor:'zoom-in',
                    background:`linear-gradient(160deg, ${d.imgBg||'#222'} 0%, ${d.imgAccent||'#444'} 100%)`,
                    display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:10, position:'relative' }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-900)', background:'rgba(255,255,255,0.82)',
                    padding:'5px 10px', borderRadius:4, display:'flex', alignItems:'center', gap:5 }}>
                    🔍 Click to enlarge
                  </span>
                </button>

                {/* Info panel */}
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--ink-900)', letterSpacing:'-0.02em', marginBottom:14 }}>
                    {d.item}
                  </p>

                  {/* Spec pills — format, dimensions, type — from Specifications tab */}
                  <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                    {d.format && (
                      <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:3,
                        background:'var(--signal-amber-bg)', color:'var(--signal-amber-text)' }}>
                        {d.format}
                      </span>
                    )}
                    {(d.width || d.height) && (
                      <span style={{ fontSize:11, fontWeight:500, padding:'4px 10px', borderRadius:3,
                        background:'var(--ground-dim)', color:'var(--ink-500)' }}>
                        {d.width}{d.width && d.height ? ' × ' : ''}{d.height}
                      </span>
                    )}
                    {d.type && (
                      <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:3,
                        background:ts.bg, color:ts.color }}>
                        {d.type}
                      </span>
                    )}
                  </div>

                  {/* File list — directly below pills, above copy, with divider */}
                  {versions.length > 0 && (
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:14, marginBottom:18 }}>
                      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                        color:'var(--ink-300)', marginBottom:8 }}>
                        Files ({versions.length})
                      </p>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {versions.map(v => {
                          const sizeStr = fmtSize(v.size)
                          return (
                            <div key={v.v} style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:3,
                                background:'var(--ground-dim)', color:'var(--ink-500)', flexShrink:0 }}>
                                {v.format || v.file?.split('.').pop().toUpperCase() || 'FILE'}
                              </span>
                              <span style={{ fontSize:12, fontWeight:600, color:'var(--signal-amber-text)' }}>
                                ↓ {v.file}
                              </span>
                              {sizeStr && (
                                <span style={{ fontSize:11, color:'var(--ink-300)', flexShrink:0 }}>
                                  {sizeStr}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Copy / caption */}
                  {d.copy && (
                    <p style={{ fontSize:14, color:'var(--ink-600)', fontStyle:'italic',
                      borderLeft:'2px solid var(--signal-amber-dot)', paddingLeft:12 }}>
                      "{d.copy}"
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full-screen enlarge overlay */}
      {enlarged && (
        <div onClick={() => setEnlarged(null)}
          style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(26,25,22,0.82)', cursor:'pointer' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'min(86vw, 1100px)', height:'min(82vh, 760px)', borderRadius:8, position:'relative', cursor:'default',
              background:`linear-gradient(160deg, ${enlarged.imgBg||'#222'} 0%, ${enlarged.imgAccent||'#444'} 100%)`,
              boxShadow:'0 24px 64px rgba(0,0,0,0.35)' }}>
            <button onClick={() => setEnlarged(null)}
              style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%',
                background:'rgba(0,0,0,0.45)', color:'white', border:'none', cursor:'pointer', fontSize:18, lineHeight:1 }}>
              ×
            </button>
            <p style={{ position:'absolute', bottom:16, left:20, fontSize:13, fontWeight:600, color:'white',
              textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>
              {enlarged.item}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
