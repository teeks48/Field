import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/* ── Wordmark ─────────────────────────────────────────────── */
export function Wordmark({ dark = false }) {
  const fill = dark ? 'white' : 'var(--ink-900)'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="0"   y="0"   width="6.5" height="6.5" rx="1" fill={fill} fillOpacity="1"/>
        <rect x="9.5" y="0"   width="6.5" height="6.5" rx="1" fill={fill} fillOpacity="1"/>
        <rect x="0"   y="9.5" width="6.5" height="6.5" rx="1" fill={fill} fillOpacity="1"/>
        <rect x="9.5" y="9.5" width="6.5" height="6.5" rx="1" fill={fill} fillOpacity="0.28"/>
      </svg>
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.20em', textTransform:'uppercase', color:fill }}>Field</span>
    </div>
  )
}

/* ── Screen wrapper for kickoff flow ─────────────────────── */
export function Screen({ children, style }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.20 }}
      style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--ground)', ...style }}
    >
      {children}
    </motion.div>
  )
}

/* ── Topbar for kickoff screens ──────────────────────────── */
export function Topbar({ right, crumbs }) {
  return (
    <div style={{ height:44, padding:'0 40px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', position:'sticky', top:0, zIndex:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Wordmark />
        {crumbs?.map((c,i) => (
          <span key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'var(--ink-200)', fontSize:13 }}>/</span>
            <span style={{ fontSize:12, color: i===crumbs.length-1 ? 'var(--ink-500)' : 'var(--ink-700)' }}>{c}</span>
          </span>
        ))}
      </div>
      {right && <div style={{ display:'flex', alignItems:'center', gap:10 }}>{right}</div>}
    </div>
  )
}

/* ── Buttons ─────────────────────────────────────────────── */
export function BtnPrimary({ children, onClick, style }) {
  return (
    <button className="btn-primary" onClick={onClick} style={style}>
      {children}
    </button>
  )
}

export function BtnOutline({ children, onClick, style }) {
  return (
    <button className="btn-secondary" onClick={onClick} style={style}>
      {children}
    </button>
  )
}

export function BtnGhost({ children, onClick, style }) {
  return (
    <button className="btn-ghost" onClick={onClick} style={style}>
      {children}
    </button>
  )
}

/* ── Status pill ─────────────────────────────────────────── */
export function Pill({ children, variant = 'neutral' }) {
  const map = { green:'pill-green', amber:'pill-amber', red:'pill-red', blue:'pill-blue', neutral:'pill-neutral' }
  return <span className={`pill ${map[variant] || 'pill-neutral'}`}>{children}</span>
}

/* ── Avatar ──────────────────────────────────────────────── */
export function Avatar({ initials, size = 'sm' }) {
  return <div className={`avatar avatar-${size}`}>{initials}</div>
}

/* ── Field wrapper for kickoff forms ─────────────────────── */
export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  )
}

/* ── Section label ───────────────────────────────────────── */
export function SectionLabel({ children, style }) {
  return <p className="section-label" style={style}>{children}</p>
}

/* ── Spec strip ──────────────────────────────────────────── */
export function SpecStrip({ cells, columns }) {
  return (
    <div className="spec-strip" style={{ gridTemplateColumns: columns || `repeat(${cells.length},1fr)` }}>
      {cells.map((c, i) => (
        <div key={i} className={`spec-strip-cell${c.dark ? ' dark' : ''}`}>
          <div className="spec-cell-label">{c.label}</div>
          <div className="spec-cell-value">{c.value}</div>
          {c.sub && <div className="spec-cell-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

/* ── Page header ─────────────────────────────────────────── */
export function PageHeader({ eyebrow, title, titleSerif, titleEm, subtitle, right }) {
  return (
    <div className="page-header" style={right ? { display:'flex', justifyContent:'space-between', alignItems:'flex-end' } : {}}>
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        {titleSerif
          ? <h1 className="page-title-serif">{titleSerif}{titleEm && <span className="page-title-serif-em"> {titleEm}</span>}</h1>
          : <h1 className="page-title">{title}</h1>}
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {right && <div style={{ flexShrink:0, marginLeft:20 }}>{right}</div>}
    </div>
  )
}

/* ── Attention banner ────────────────────────────────────── */
export function AttentionBanner({ title, body }) {
  return (
    <div className="attention-banner">
      {title && <p className="attention-banner-title">{title}</p>}
      {body  && <p className="attention-banner-body">{body}</p>}
    </div>
  )
}

/* ── Tab bar ─────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab${active===t.id?' active':''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ── Filter chips ────────────────────────────────────────── */
export function FilterChips({ options, active, onChange }) {
  return (
    <div className="filter-chips">
      {options.map(o => (
        <button key={o} className={`chip${active===o?' active':''}`} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ── Toggle group ────────────────────────────────────────── */
export function ToggleGroup({ options, active, onChange }) {
  return (
    <div className="toggle-group">
      {options.map(o => (
        <button key={o.id} className={`toggle-btn${active===o.id?' active':''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────── */
export function EmptyState({ title, sub, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {sub && <p className="empty-state-sub" style={{ marginBottom: action ? 16 : 0 }}>{sub}</p>}
      {action}
    </div>
  )
}

/* ── Inline add form ─────────────────────────────────────── */
export function AddRow({ children, onSave, onCancel, saveLabel = 'Add' }) {
  return (
    <div className="add-row">
      {children}
      <div className="add-row-actions">
        <button className="btn-primary" onClick={onSave}>{saveLabel}</button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ── Divider ─────────────────────────────────────────────── */
export function Divider({ strong }) {
  return <div className={strong ? 'rule-strong' : 'rule'} />
}

/* ── Legacy aliases (keeps existing pages building) ─────── */
export function Chip({ children }) { return <span className="chip">{children}</span> }
export function FieldLabel({ children }) { return <label className="field-label">{children}</label> }
export function StatusDot({ color = 'green' }) {
  const c = { green:'var(--signal-green-dot)', amber:'var(--signal-amber-dot)', ink:'var(--ink-200)' }
  return <div style={{ width:6, height:6, borderRadius:'50%', background:c[color]||c.green, flexShrink:0 }}/>
}
