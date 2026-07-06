/**
 * useLocalState — per-entity localStorage persistence with data safeguards.
 *
 * Safeguards implemented:
 *   1. Shrink/empty guard — never overwrites populated data with an empty
 *      or drastically smaller value unless the caller passes `{ force: true }`.
 *   2. updatedAt stamping — every array write bumps an updatedAt timestamp
 *      on records that have an id, so future sync layers can merge correctly.
 *   3. Write logging — every write is timestamped in field_write_log_v1 so
 *      we have an audit trail of what changed and when.
 *   4. Dev mode guard — if FIELD_DEV_MODE is set, writes go to a prefixed
 *      dev namespace and never touch production keys.
 *
 * Usage:
 *   const [rows, setRows] = useLocalState('fab_cats_v1', SEED_CATS)
 *   // forced delete (bypass shrink guard):
 *   setRows([], { force: true })
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const PREFIX      = 'field_local_'
const DEV_PREFIX  = 'field_dev_'
const WRITE_LOG   = 'field_write_log_v1'
const MAX_LOG     = 200   // keep last N writes

// Dev mode: set localStorage.field_dev_mode = '1' to sandbox all writes
function isDevMode() {
  try { return localStorage.getItem('field_dev_mode') === '1' } catch { return false }
}

function resolveKey(key) {
  const base = PREFIX + key
  return isDevMode() ? base.replace(PREFIX, DEV_PREFIX) : base
}

// Append to write log (non-blocking, best-effort)
function logWrite(key, summary) {
  try {
    const log = JSON.parse(localStorage.getItem(WRITE_LOG) || '[]')
    log.push({ key, summary, at: new Date().toISOString() })
    localStorage.setItem(WRITE_LOG, JSON.stringify(log.slice(-MAX_LOG)))
  } catch {}
}

/**
 * Shrink/empty guard — returns true if the write should be BLOCKED.
 * Blocked when:
 *   - existing data is an array with items AND new data is empty
 *   - existing data is an array AND new length is less than 20% of existing
 *     (i.e. a blank/fresh client trying to overwrite real data)
 *   - existing data is a non-empty string AND new data is empty string
 */
function shouldBlock(existing, next) {
  if (existing === null || existing === undefined) return false  // first write, always ok

  // Array shrink guard
  if (Array.isArray(existing) && Array.isArray(next)) {
    if (existing.length > 2 && next.length === 0) return true        // never blank a populated list
    if (existing.length > 5 && next.length < existing.length * 0.2) return true  // >80% drop
  }

  // String blank guard
  if (typeof existing === 'string' && typeof next === 'string') {
    if (existing.trim().length > 20 && next.trim().length === 0) return true
  }

  return false
}

/**
 * Stamp updatedAt on records that have an id field.
 * This is a no-op for primitives and strings.
 */
function stampUpdatedAt(value) {
  const now = new Date().toISOString()
  if (Array.isArray(value)) {
    return value.map(item =>
      item && typeof item === 'object' && item.id
        ? { ...item, updatedAt: now }
        : item
    )
  }
  if (value && typeof value === 'object' && value.id) {
    return { ...value, updatedAt: now }
  }
  return value
}

export function useLocalState(key, initialValue) {
  const fullKey = resolveKey(key)

  const [state, setStateRaw] = useState(() => {
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored !== null) return JSON.parse(stored)
    } catch {}
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  // Track the last successfully persisted value so shrink guard can compare
  const persisted = useRef(state)
  const isFirst   = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    try {
      localStorage.setItem(fullKey, JSON.stringify(state))
      persisted.current = state
    } catch {}
  }, [state, fullKey])

  // Safe setter — wraps raw setter with safeguards
  const setState = useCallback((valueOrFn, opts = {}) => {
    setStateRaw(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn

      // Shrink/empty guard — unless caller says { force: true }
      if (!opts.force && shouldBlock(persisted.current, next)) {
        console.warn(`[field] Blocked write to "${key}": would shrink ${
          Array.isArray(persisted.current) ? persisted.current.length : '?'
        } → ${Array.isArray(next) ? next.length : '?'} records. Pass { force: true } to override.`)
        return prev  // return unchanged
      }

      // Stamp updatedAt on records
      const stamped = stampUpdatedAt(next)

      // Log the write
      logWrite(key, Array.isArray(stamped)
        ? `array[${stamped.length}]`
        : typeof stamped === 'object' ? 'object' : String(stamped).slice(0, 40))

      return stamped
    })
  }, [key])

  return [state, setState]
}

/**
 * Export a full snapshot of all field_local_* and field_store_v1 data.
 * Returns a JSON string the caller can download as a backup file.
 */
export function exportBackup() {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    version: 1,
    keys: {},
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('field_') && !k.startsWith('field_dev_')) {
        try { snapshot.keys[k] = JSON.parse(localStorage.getItem(k)) } catch {}
      }
    }
  } catch {}
  return JSON.stringify(snapshot, null, 2)
}

/**
 * Restore from a backup snapshot.
 * Only writes keys that exist in the snapshot — never blanks keys not present.
 * Accepts optional { dryRun: true } to preview what would change.
 */
export function restoreBackup(jsonString, opts = {}) {
  let snapshot
  try { snapshot = JSON.parse(jsonString) } catch { throw new Error('Invalid backup file — could not parse JSON') }
  if (!snapshot.keys || typeof snapshot.keys !== 'object') throw new Error('Invalid backup format — missing keys object')

  const changes = []
  Object.entries(snapshot.keys).forEach(([k, v]) => {
    const existing = localStorage.getItem(k)
    const existingParsed = existing ? JSON.parse(existing) : null
    const isNew = existingParsed === null
    const isShrink = !isNew && shouldBlock(existingParsed, v)
    changes.push({ key: k, isNew, isShrink })
    if (!opts.dryRun && !isShrink) {
      try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
    }
  })

  const blocked = changes.filter(c => c.isShrink)
  if (blocked.length > 0) {
    console.warn('[field] Restore blocked shrink on keys:', blocked.map(c => c.key))
  }

  return { total: changes.length, blocked: blocked.length, changes }
}

/**
 * Get the write log for debugging / auditing.
 */
export function getWriteLog() {
  try { return JSON.parse(localStorage.getItem(WRITE_LOG) || '[]') } catch { return [] }
}

/**
 * Enable / disable dev mode. In dev mode all writes go to field_dev_*
 * keys and never touch production data.
 */
export function setDevMode(enabled) {
  try {
    if (enabled) {
      localStorage.setItem('field_dev_mode', '1')
      console.info('[field] Dev mode ON — all writes go to field_dev_* namespace')
    } else {
      localStorage.removeItem('field_dev_mode')
      console.info('[field] Dev mode OFF — writing to production namespace')
    }
  } catch {}
}
