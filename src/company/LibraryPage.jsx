/**
 * LibraryPage — shared wrapper used by all four libraries.
 * Provides: page header, search bar, filter row, view toggle,
 * result count, and content area.
 * Each library passes its own filters, data, and render functions.
 */
import React from 'react'
import { motion } from 'framer-motion'

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8,
      padding:'0 12px', background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:3, height:34 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="var(--ink-300)" strokeWidth="1.1"/>
        <path d="M8 8l2.5 2.5" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'var(--ink-800)',
          background:'transparent', fontFamily:'var(--font)' }}/>
      {value && (
        <button onClick={() => onChange('')}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-300)', fontSize:14, lineHeight:1 }}>×</button>
      )}
    </div>
  )
}

export const selStyle = {
  fontSize:12, height:34, padding:'0 10px', border:'1px solid var(--border)',
  borderRadius:3, fontFamily:'var(--font)', background:'var(--surface)',
  color:'var(--ink-700)', outline:'none', cursor:'pointer',
}

export function ViewToggle({ view, setView }) {
  return (
    <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden' }}>
      {[['table','≡'],['cards','⊞']].map(([m,icon]) => (
        <button key={m} onClick={() => setView(m)}
          style={{ width:36, height:34, display:'flex', alignItems:'center', justifyContent:'center',
            background:view===m?'var(--ink-900)':'var(--surface)',
            color:view===m?'white':'var(--ink-400)', border:'none', cursor:'pointer', fontSize:14 }}>
          {icon}
        </button>
      ))}
    </div>
  )
}

export function PreferredBadge() {
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
      color:'var(--signal-green-text)', background:'var(--signal-green-bg)',
      padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>Preferred</span>
  )
}

export function ConditionBadge({ condition }) {
  const styles = {
    'Excellent': { color:'var(--signal-green-text)', bg:'var(--signal-green-bg)'  },
    'Good':      { color:'var(--signal-blue-text)',  bg:'var(--signal-blue-bg)'   },
    'Fair':      { color:'var(--signal-amber-text)', bg:'var(--signal-amber-bg)' },
    'Needs repair':{ color:'var(--signal-red-text)', bg:'var(--signal-red-bg)'   },
  }
  const s = styles[condition] || { color:'var(--ink-300)', bg:'var(--ground-dim)' }
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
      color:s.color, background:s.bg, padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>
      {condition}
    </span>
  )
}

export function ColHeaders({ cols }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:cols.map(c=>c.width).join(' '),
      gap:14, paddingBottom:10, borderBottom:'1.5px solid var(--ink-900)' }}>
      {cols.map((c,i) => (
        <p key={i} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.11em',
          textTransform:'uppercase', color:'var(--ink-300)' }}>{c.label}</p>
      ))}
    </div>
  )
}

export function EmptyState({ query, onClear }) {
  return (
    <div style={{ padding:'60px 0', textAlign:'center' }}>
      <p style={{ fontFamily:'var(--font-serif)', fontSize:18, fontStyle:'italic',
        color:'var(--ink-200)', marginBottom:8 }}>
        {query ? `No results for "${query}"` : 'No items match your filters.'}
      </p>
      <button onClick={onClear} style={{ fontSize:12, color:'var(--ink-400)', background:'none',
        border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>Clear all filters</button>
    </div>
  )
}

export function Av({ initials, size=28 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size<30?9:11, fontWeight:700, color:'rgba(255,255,255,0.60)', fontFamily:'var(--font)' }}>
      {initials||'?'}
    </div>
  )
}

export default function LibraryPage({ eyebrow, title, subtitle, children }) {
  return (
    <div style={{ width:'100%', padding:'36px 72px 80px' }}>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        <div style={{ marginBottom:28 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'var(--ink-300)', marginBottom:8 }}>{eyebrow}</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:800,
            letterSpacing:'-0.04em', color:'var(--ink-900)', marginBottom:4 }}>{title}</h1>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
