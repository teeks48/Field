import React, { useState } from 'react'
import PageOwner from '../../components/PageOwner.jsx'
import { motion } from 'framer-motion'
import DebugErrorBoundary from '../../components/DebugErrorBoundary.jsx'
import CreativeBrief from './creative/CreativeBrief.jsx'
import CreativeAssets from './creative/CreativeAssets.jsx'
import CreativeSpecifications from './creative/CreativeSpecifications.jsx'
import CreativeUploads from './creative/CreativeUploads.jsx'
import CreativePremier from './creative/CreativePremier.jsx'

/**
 * Creative.jsx — Deliverables shell.
 * Tab strip mirrors the colleague's Creative app exactly: Brief / Assets /
 * Specifications / Uploads / Premier, all real top-level tabs — clicking
 * "Spec" on an Assets row switches to the Specifications tab rather than
 * opening an overlay. The asset picker (their left sidebar) sits on the
 * RIGHT here instead, since this platform's own workspace sidebar
 * already occupies the left.
 */
const TABS = [
  { id:'brief',          label:'Brief' },
  { id:'assets',         label:'Assets' },
  { id:'specifications', label:'Specifications' },
  { id:'uploads',        label:'Uploads' },
  { id:'premier',        label:'Premier' },
]

export default function Creative({ user, projectId, production }) {
  const [tab, setTab] = useState('assets')
  const [selectedAssetId, setSelectedAssetId] = useState(null)

  // Clicking "Spec" on an Assets row jumps straight to the
  // Specifications tab with that asset pre-selected.
  const openSpec = id => { setSelectedAssetId(id); setTab('specifications') }

  return (
    <div style={{ padding:'36px 72px 80px', width:'100%', fontFamily:'var(--font)' }}>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>

        {/* Page title */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:8 }}>
              Creative · Deliverables
            </p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:800, letterSpacing:'-0.03em', color:'var(--ink-900)' }}>
              Deliverables
            </h1>
            <PageOwner area="Creative Assets" projectId={projectId}/>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:28 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'10px 0', marginRight:24, fontSize:13, fontWeight:600, fontFamily:'var(--font)',
                background:'none', border:'none', cursor:'pointer',
                borderBottom: tab===t.id ? '2px solid var(--ink-900)' : '2px solid transparent', marginBottom:-1,
                color: tab===t.id ? 'var(--ink-900)' : 'var(--ink-400)', transition:'color 0.1s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'brief'   && <CreativeBrief/>}
        {tab === 'assets'  && <CreativeAssets onOpenSpec={openSpec} user={user}/>}
        {tab === 'specifications' && (
          <DebugErrorBoundary>
            <CreativeSpecifications selectedId={selectedAssetId} onSelect={setSelectedAssetId}/>
          </DebugErrorBoundary>
        )}
        {tab === 'uploads' && <CreativeUploads/>}
        {tab === 'premier' && <CreativePremier/>}

      </motion.div>
    </div>
  )
}
