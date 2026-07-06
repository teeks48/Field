/**
 * TimeSelect — dropdown replacing type="time" inputs.
 * Generates 30-minute increments across the full 24h day.
 * Displays in 12h format (9:00 AM) but stores in 24h (09:00) for consistency.
 *
 * Props:
 *   value      — string in "HH:MM" 24h format
 *   onChange   — fn(newValue: string) — called with "HH:MM"
 *   placeholder — string shown as first disabled option (default: "Select time")
 *   style      — optional extra style on the <select>
 */
import React from 'react'

function pad(n) { return String(n).padStart(2, '0') }

function fmt12(h, m) {
  const period = h < 12 ? 'AM' : 'PM'
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${pad(m)} ${period}`
}

// Build the full option list once
const TIME_OPTIONS = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push({ value: `${pad(h)}:${pad(m)}`, label: fmt12(h, m) })
  }
}

export default function TimeSelect({ value, onChange, placeholder = 'Select time', style }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', ...style }}
    >
      <option value="" disabled>{placeholder}</option>
      {TIME_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
