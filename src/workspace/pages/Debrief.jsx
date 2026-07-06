import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLocalState } from '../../useLocalState.js'

const BLANK = { worked:'', didnt:'', vendorFeedback:'', clientFeedback:'', nextTime:'' }

export default function Debrief({ projectId }) {
  const key = `field_debrief_${projectId || 'default'}_v1`
  const [debrief, setDebrief] = useLocalState(key, BLANK)

  const update = useCallback((field, val) =>
    setDebrief(p => ({ ...p, [field]: val })), [setDebrief])

  const fields = [
    { key:'worked',         label:'What worked well',                   placeholder:'Write what went well during this production...' },
    { key:'didnt',          label:"What didn't work / what to improve",  placeholder:'Be specific — what would you change next time?' },
    { key:'vendorFeedback', label:'Vendor feedback',                    placeholder:'Notes per vendor — performance, responsiveness, quality...' },
    { key:'clientFeedback', label:'Client feedback',                    placeholder:'What did the client say?' },
    { key:'nextTime',       label:'Notes for next time',                placeholder:'Anything the next team should know...' },
  ]

  return (
    <div className="page-content">
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28 }}>
        <div className="page-header">
          <h1 className="page-title">Debrief</h1>
          <p className="page-subtitle">Post-event · notes for the team and for next time</p>
        </div>
        <div className="text-section" style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {fields.map(f => (
            <div key={f.key}>
              <p className="section-label">{f.label}</p>
              <textarea
                value={debrief[f.key] || ''}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ minHeight:100, resize:'vertical', lineHeight:1.65,
                  borderRadius:'var(--r-md)', padding:'12px 14px' }}/>
            </div>
          ))}
        </div>
        <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:16 }}>
          Auto-saved · Scoped to this project
        </p>
      </motion.div>
    </div>
  )
}
