import React, { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore, A } from '../../../store.jsx'
import { EditModal, DocCard } from '../creativeShared.jsx'
import { useLocalState } from '../../../useLocalState.js'

/**
 * CreativeBrief — project-scoped brief, objectives, and reference imagery.
 * Moodboard and color palette moved to the project's Hospitality/Florals pages
 * where visual direction is actually used in production.
 */
export default function CreativeBrief() {
  const { state, dispatch } = useStore()
  const pid = state.production?.id || 'default'
  const brief = state.creativeBrief || { overview:'', referenceImages:[] }

  const [editingBrief, setEB] = useState(false)
  const [editingObj,   setEO] = useState(false)
  const [objectives, setObjectives] = useLocalState(
    `field_creative_objectives_${pid}_v1`,
    '• Define the creative direction for this project\n• Set visual tone and brand alignment\n• List key moments and storytelling goals'
  )
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const saveOverview = v => dispatch(A.updateCreativeBrief({ overview: v }))
  const saveObjectives = v => setObjectives(v)

  const addReferenceImages = files => {
    const names = Array.from(files).map(f => f.name)
    dispatch(A.updateCreativeBrief({ referenceImages: [...(brief.referenceImages||[]), ...names] }))
  }
  const removeReferenceImage = name => {
    dispatch(A.updateCreativeBrief({ referenceImages: (brief.referenceImages||[]).filter(n => n !== name) }))
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
        <DocCard label="CREATIVE BRIEF" value={brief.overview} onEdit={() => setEB(true)}/>
        <DocCard label="OBJECTIVES"     value={objectives}     onEdit={() => setEO(true)}/>
      </div>

      {/* Reference images */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
          color:'var(--ink-400)', marginBottom:16 }}>Reference images</p>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addReferenceImages(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          style={{ border:`1.5px dashed ${dragOver ? 'var(--ink-400)' : 'var(--border-med)'}`, borderRadius:'var(--r-sm)',
            padding:'32px 0', textAlign:'center', cursor:'pointer',
            marginBottom:(brief.referenceImages||[]).length ? 20 : 0, transition:'border-color 0.12s' }}>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }}
            onChange={e => { if (e.target.files.length) addReferenceImages(e.target.files); e.target.value = '' }}/>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ margin:'0 auto 8px' }}>
            <path d="M9 3v12M3 9h12" stroke="var(--ink-300)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:3 }}>
            Drop photos or <span style={{ color:'var(--signal-amber-text)', fontWeight:600 }}>click to browse</span>
          </p>
          <p style={{ fontSize:11, color:'var(--ink-300)' }}>PNG, JPG, WEBP</p>
        </div>

        {(brief.referenceImages||[]).length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {brief.referenceImages.map(name => (
              <div key={name} style={{ position:'relative', border:'1px solid var(--border)',
                borderRadius:'var(--r-sm)', overflow:'hidden' }}>
                <div style={{ height:100, background:'linear-gradient(160deg,#28241e 0%,#403830 100%)' }}/>
                <p style={{ fontSize:11, color:'var(--ink-500)', padding:'6px 8px',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
                <button onClick={e => { e.stopPropagation(); removeReferenceImage(name) }}
                  style={{ position:'absolute', top:6, right:6, width:20, height:20, borderRadius:'50%',
                    background:'rgba(0,0,0,0.55)', color:'white', border:'none', cursor:'pointer', fontSize:12,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingBrief && <EditModal key="b" title="Creative Brief" value={brief.overview} onSave={saveOverview} onClose={() => setEB(false)}/>}
        {editingObj   && <EditModal key="o" title="Objectives"     value={objectives}     onSave={saveObjectives} onClose={() => setEO(false)}/>}
      </AnimatePresence>
    </div>
  )
}
