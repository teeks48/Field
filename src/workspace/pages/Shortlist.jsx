import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const STORAGE_KEY = 'field_shortlist_v1'

export function loadShortlist() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"venues":[],"vendors":[]}') }
  catch { return { venues:[], vendors:[] } }
}
export function saveToShortlist(type, item) {
  const sl = loadShortlist()
  if (!sl[type].find(x => x.id === item.id)) sl[type].push(item)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sl))
}
export function removeFromShortlist(type, id) {
  const sl = loadShortlist()
  sl[type] = sl[type].filter(x => x.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sl))
}
export function isShortlisted(type, id) {
  return loadShortlist()[type].some(x => x.id === id)
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S1.5 9.5 1.5 5.5a3 3 0 0 1 6-0.5 3 3 0 0 1 6 0.5c0 4-6.5 8-6.5 8z"/>
    </svg>
  )
}

function EmptySection({ label }) {
  return (
    <div style={{ padding:'32px 0', textAlign:'center' }}>
      <p style={{ fontFamily:'var(--font-serif)', fontSize:15, fontStyle:'italic',
        color:'var(--ink-200)', marginBottom:6 }}>No {label} saved yet.</p>
      <p style={{ fontSize:12, color:'var(--ink-300)' }}>
        Click the ♡ on any {label.slice(0,-1)} to add it here.
      </p>
    </div>
  )
}

export default function Shortlist() {
  const [sl, setSl] = useState(loadShortlist)

  const refresh = () => setSl(loadShortlist())

  const remove = (type, id) => { removeFromShortlist(type, id); refresh() }

  const SectionHead = ({ children }) => (
    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase',
      color:'var(--ink-300)', paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)',
      marginBottom:0 }}>{children}</p>
  )

  const VenueRow = ({ v }) => (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 0',
      borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)',
          letterSpacing:'-0.01em', marginBottom:2 }}>{v.name}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>
          {[v.city, v.type, v.capacity ? `${v.capacity} guests` : ''].filter(Boolean).join(' · ')}
        </p>
      </div>
      <button onClick={() => remove('venues', v.id)}
        style={{ background:'none', border:'none', cursor:'pointer',
          color:'var(--signal-red-text)', fontSize:11, fontFamily:'var(--font)',
          padding:'4px 8px', borderRadius:3, border:'1px solid var(--border)' }}>
        Remove
      </button>
    </div>
  )

  const VendorRow = ({ v }) => (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 0',
      borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink-900)',
          letterSpacing:'-0.01em', marginBottom:2 }}>{v.name}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>
          {[v.category, v.city, v.costTier].filter(Boolean).join(' · ')}
        </p>
      </div>
      <button onClick={() => remove('vendors', v.id)}
        style={{ background:'none', border:'none', cursor:'pointer',
          color:'var(--signal-red-text)', fontSize:11, fontFamily:'var(--font)',
          padding:'4px 8px', borderRadius:3, border:'1px solid var(--border)' }}>
        Remove
      </button>
    </div>
  )

  return (
    <div className="page-content">
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase',
          color:'var(--ink-300)', marginBottom:10 }}>Project · Shortlist</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
          letterSpacing:'-0.04em', lineHeight:0.95, color:'var(--ink-900)', marginBottom:6 }}>
          Shortlist
        </h1>
        <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:32 }}>
          Saved venues and vendors you're considering for this project.
        </p>

        {/* Venues */}
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SectionHead>Venues ({sl.venues.length})</SectionHead>
          </div>
          {sl.venues.length === 0
            ? <EmptySection label="venues"/>
            : sl.venues.map(v => <VenueRow key={v.id} v={v}/>)
          }
        </div>

        {/* Vendors */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SectionHead>Vendors ({sl.vendors.length})</SectionHead>
          </div>
          {sl.vendors.length === 0
            ? <EmptySection label="vendors"/>
            : sl.vendors.map(v => <VendorRow key={v.id} v={v}/>)
          }
        </div>
      </motion.div>
    </div>
  )
}
