/**
 * ProjectNotes — shared internal team scratchpad for a project.
 *
 * Shows pinned notes at top, then recents. Any team member can add,
 * pin, or delete their own notes. Dispatches to the persisted store.
 *
 * Props:
 *   projectId    — current project id
 *   currentUser  — resolved team member (for attribution)
 *   maxVisible   — number of notes to show before "Show more" (default 4)
 *   compact      — if true, render a condensed single-column version
 */

import React, { useState } from 'react'
import { useStore, A } from '../store.jsx'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function ProjectNotes({ projectId, currentUser, maxVisible = 4, compact = false }) {
  const { state, dispatch } = useStore()
  const notes   = ((state.projectNotes || {})[projectId] || [])
  const pinned  = notes.filter(n => n.pinned)
  const recents = notes.filter(n => !n.pinned)
  const all     = [...pinned, ...recents]

  const [text,      setText]      = useState('')
  const [expanded,  setExpanded]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [editText,  setEditText]  = useState('')

  const visible = expanded ? all : all.slice(0, maxVisible)
  const canEdit = currentUser && currentUser.role !== 'Viewer'

  const addNote = () => {
    if (!text.trim() || !currentUser) return
    dispatch(A.addProjectNote({
      projectId,
      userId:   currentUser.id   || 'unknown',
      userName: currentUser.name || 'Team member',
      text: text.trim(),
    }))
    setText('')
  }

  const deleteNote = (noteId) => {
    dispatch(A.deleteProjectNote({ projectId, noteId }))
  }

  const pinNote = (noteId) => {
    dispatch(A.pinProjectNote({ projectId, noteId }))
  }

  const saveEdit = (noteId) => {
    if (!editText.trim()) return
    dispatch(A.updateProjectNote({ projectId, noteId, text: editText.trim() }))
    setEditId(null)
    setEditText('')
  }

  const lbl = { fontSize:10, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-300)', marginBottom:10 }

  return (
    <div>
      <p style={lbl}>Team notes</p>

      {/* Note list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {all.length === 0 && (
          <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>
            No team notes yet — add the first one.
          </p>
        )}
        {visible.map(note => (
          <div key={note.id} style={{ padding:'11px 14px', borderRadius:4,
            background: note.pinned ? 'rgba(200,168,64,0.07)' : 'var(--ground-dim)',
            border:`1px solid ${note.pinned ? 'rgba(200,168,64,0.25)' : 'var(--border)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {editId === note.id ? (
                  <div>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ width:'100%', minHeight:60, fontSize:13, lineHeight:1.6,
                        border:'1px solid var(--border-med)', borderRadius:3, padding:'6px 8px',
                        fontFamily:'var(--font)', resize:'vertical', outline:'none' }}/>
                    <div style={{ display:'flex', gap:6, marginTop:6 }}>
                      <button onClick={() => saveEdit(note.id)}
                        style={{ fontSize:11, fontWeight:700, padding:'4px 12px', background:'var(--ink-900)',
                          color:'white', border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>
                        Save
                      </button>
                      <button onClick={() => setEditId(null)}
                        style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                          cursor:'pointer', fontFamily:'var(--font)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:'var(--ink-800)', lineHeight:1.6, wordBreak:'break-word' }}>
                    {note.pinned && <span style={{ fontSize:10, marginRight:5 }}>📌</span>}
                    {note.text}
                  </p>
                )}
                <div style={{ display:'flex', gap:6, marginTop:6, alignItems:'center' }}>
                  <p style={{ fontSize:11, fontWeight:500, color:'var(--ink-500)' }}>{note.userName}</p>
                  <span style={{ color:'var(--ink-200)' }}>·</span>
                  <p style={{ fontSize:11, color:'var(--ink-300)' }}>{timeAgo(note.timestamp)}</p>
                  {note.editedAt && <p style={{ fontSize:10, color:'var(--ink-200)', fontStyle:'italic' }}>edited</p>}
                </div>
              </div>
              {canEdit && editId !== note.id && (
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => pinNote(note.id)} title={note.pinned ? 'Unpin' : 'Pin'}
                    style={{ fontSize:12, background:'none', border:'none', cursor:'pointer',
                      color: note.pinned ? 'var(--signal-amber-text)' : 'var(--ink-200)',
                      padding:'2px 4px', transition:'color 0.1s' }}>
                    📌
                  </button>
                  {(note.userId === currentUser?.id || currentUser?.caps?.canEditAll) && (
                    <>
                      <button onClick={() => { setEditId(note.id); setEditText(note.text) }}
                        style={{ fontSize:11, background:'none', border:'none', cursor:'pointer',
                          color:'var(--ink-300)', padding:'2px 4px' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteNote(note.id)}
                        style={{ fontSize:11, background:'none', border:'none', cursor:'pointer',
                          color:'var(--signal-red-text)', padding:'2px 4px' }}>
                        ×
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {all.length > maxVisible && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none',
            cursor:'pointer', fontFamily:'var(--font)', marginBottom:12, padding:0 }}>
          {expanded ? '↑ Show less' : `↓ Show ${all.length - maxVisible} more`}
        </button>
      )}

      {/* Add note input */}
      {canEdit && (
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Add a team note…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
            style={{ width:'100%', minHeight: compact ? 56 : 72, fontSize:13, lineHeight:1.6,
              border:'1px solid var(--border-med)', borderRadius:4, padding:'9px 11px',
              fontFamily:'var(--font)', resize:'vertical', outline:'none',
              background:'var(--surface)', color:'var(--ink-900)' }}/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
            <button onClick={addNote} disabled={!text.trim()}
              style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', padding:'6px 16px',
                background: text.trim() ? 'var(--ink-900)' : 'var(--border)',
                color: text.trim() ? 'white' : 'var(--ink-400)',
                border:'none', borderRadius:3, cursor: text.trim() ? 'pointer' : 'default',
                fontFamily:'var(--font)', transition:'all 0.15s' }}>
              Post note
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
