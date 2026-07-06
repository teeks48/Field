/**
 * CollabRail — Persistent right-side collaboration panel
 *
 * Rendered by WorkspaceShell on ALL project pages.
 * Pages themselves don't need to know it exists.
 *
 * Three tabs: Discussion · Activity · Decisions
 *
 * Key behaviours:
 *   - Scoped to projectId + page slug (separate thread per page per project)
 *   - @mentions dispatch notifications with email-based toUserEmail for reliable matching
 *   - Self-mentions are included (needed for single-user testing)
 *   - highlightCommentId prop scrolls to and flashes a specific comment
 *   - open/closed state persists per user in localStorage
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useStore, A } from '../store.jsx'
import { CAPE_DIRECTORY } from '../data/capeDirectory.js'
import { readProjectTeam, nameOf } from '../projectData.js'

const RAIL_WIDTH  = 320
const STORAGE_KEY = 'field_collab_rail_v1'

/* ─── Persist open state ─────────────────────────────── */
function loadRailOpen() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) !== false }
  catch { return true }
}
function saveRailOpen(v) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch {}
}

/* ─── Helpers ────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Av({ name, size = 24 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:'var(--ink-800)',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      fontSize:size < 28 ? 8 : 10, fontWeight:700,
      color:'rgba(255,255,255,0.65)', fontFamily:'var(--font)',
    }}>
      {initials(name)}
    </div>
  )
}

/* ─── Render @mention highlights in stored comment text ─── */
function RenderText({ text }) {
  if (!text) return null
  // Match plain @Name patterns (words, spaces, hyphens, apostrophes)
  const parts = text.split(/(@[\w][\w\s'-]+)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          return (
            <mark key={i} style={{
              background:'rgba(200,168,64,0.20)', color:'var(--signal-amber-text)',
              borderRadius:3, padding:'0 3px', fontWeight:600, fontSize:'inherit',
            }}>
              {part}
            </mark>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/* ─── @mention dropdown ──────────────────────────────── */
function MentionDropdown({ query, onSelect, people }) {
  const results = useMemo(() =>
    (people || [])
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6),
    [query, people]
  )
  if (!people || people.length === 0) return (
    <div style={{
      position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0, zIndex:300,
      background:'var(--surface)', border:'1px solid var(--border-med)',
      borderRadius:6, boxShadow:'0 8px 24px rgba(10,9,8,0.16)', padding:'9px 12px',
    }}>
      <p style={{ fontSize:11, color:'var(--ink-400)' }}>
        No one on this project yet — add people on the Team page to @mention them.
      </p>
    </div>
  )
  if (!results.length) return null
  return (
    <div style={{
      position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0, zIndex:300,
      background:'var(--surface)', border:'1px solid var(--border-med)',
      borderRadius:6, boxShadow:'0 8px 24px rgba(10,9,8,0.16)', overflow:'hidden',
    }}>
      {results.map(p => {
        const name = p.name
        return (
          <button key={p.id} onMouseDown={e => { e.preventDefault(); onSelect(p) }}
            style={{
              display:'flex', alignItems:'center', gap:8, width:'100%',
              padding:'8px 12px', background:'none', border:'none',
              cursor:'pointer', fontFamily:'var(--font)', textAlign:'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Av name={name} size={22}/>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:500, color:'var(--ink-900)', lineHeight:1.2 }}>{name}</p>
              {p.title && <p style={{ fontSize:10, color:'var(--ink-400)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Single comment row ─────────────────────────────── */
function CommentRow({ comment, canAct, canComment, onDelete, onEdit, highlighted, onReply, replySourceComment }) {
  const [hov,     setHov]     = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTxt, setEditTxt] = useState(comment.text)
  const rowRef = useRef(null)

  // Scroll + flash when highlighted
  useEffect(() => {
    if (!highlighted || !rowRef.current) return
    rowRef.current.scrollIntoView({ block:'nearest', behavior:'smooth' })
    const el = rowRef.current
    el.style.transition = 'background 0s'
    el.style.background = 'rgba(200,168,64,0.18)'
    const t = setTimeout(() => {
      el.style.transition = 'background 1.6s ease'
      el.style.background = 'transparent'
    }, 80)
    return () => clearTimeout(t)
  }, [highlighted])

  const save = () => {
    if (editTxt.trim() && editTxt !== comment.text) onEdit(editTxt.trim())
    setEditing(false)
  }

  return (
    <div
      ref={rowRef}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:'10px 0', borderBottom:'1px solid var(--border)',
        position:'relative', borderRadius:2,
      }}>

      {/* Reply-to quote — shown when this comment is a reply */}
      {replySourceComment && (
        <div style={{
          marginLeft:30, marginBottom:6, padding:'5px 8px',
          background:'var(--ground-dim)', borderLeft:'2px solid var(--border-med)',
          borderRadius:'0 3px 3px 0',
        }}>
          <p style={{ fontSize:10, fontWeight:600, color:'var(--ink-400)', marginBottom:2 }}>
            {replySourceComment.authorName}
          </p>
          <p style={{ fontSize:11, color:'var(--ink-400)', lineHeight:1.4,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {replySourceComment.text?.replace(/@[\w][\w\s'-]+/g, m => m).slice(0, 60)}
            {(replySourceComment.text?.length || 0) > 60 ? '…' : ''}
          </p>
        </div>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:4 }}>
        <Av name={comment.authorName} size={22}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)' }}>
              {comment.authorName}
            </span>
            <span style={{ fontSize:10, color:'var(--ink-300)', fontFamily:'var(--font-mono)' }}>
              {timeAgo(comment.timestamp)}
            </span>
            {comment.edited && (
              <span style={{ fontSize:10, color:'var(--ink-200)', fontStyle:'italic' }}>edited</span>
            )}
          </div>
        </div>
        {/* Action buttons on hover */}
        {hov && !editing && (
          <div style={{ display:'flex', gap:3, flexShrink:0 }}>
            {canComment && (
              <button onClick={() => onReply?.({ id:comment.id, authorName:comment.authorName, text:comment.text })}
                style={{ fontSize:10, color:'var(--ink-500)', background:'var(--surface)',
                  border:'1px solid var(--border)', borderRadius:3, padding:'2px 6px',
                  cursor:'pointer', fontFamily:'var(--font)' }}>↩ Reply</button>
            )}
            {canAct && (
              <>
                <button onClick={() => setEditing(true)}
                  style={{ fontSize:10, color:'var(--ink-400)', background:'var(--surface)',
                    border:'1px solid var(--border)', borderRadius:3, padding:'2px 6px',
                    cursor:'pointer', fontFamily:'var(--font)' }}>Edit</button>
                <button onClick={onDelete}
                  style={{ fontSize:10, color:'var(--signal-red-text)', background:'var(--surface)',
                    border:'1px solid var(--border)', borderRadius:3, padding:'2px 6px',
                    cursor:'pointer', fontFamily:'var(--font)' }}>✕</button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div style={{ marginLeft:30 }}>
          <textarea value={editTxt} onChange={e => setEditTxt(e.target.value)} autoFocus rows={2}
            style={{ width:'100%', fontSize:12, fontFamily:'var(--font)', color:'var(--ink-800)',
              border:'1px solid var(--border-med)', borderRadius:4, padding:'6px 8px',
              resize:'none', outline:'none', lineHeight:1.5, background:'var(--surface)',
              boxSizing:'border-box' }}/>
          <div style={{ display:'flex', gap:6, marginTop:4 }}>
            <button onClick={save}
              style={{ fontSize:11, fontWeight:600, padding:'3px 10px',
                background:'var(--ink-900)', color:'white', border:'none', borderRadius:3,
                cursor:'pointer', fontFamily:'var(--font)' }}>Save</button>
            <button onClick={() => { setEditing(false); setEditTxt(comment.text) }}
              style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                cursor:'pointer', fontFamily:'var(--font)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize:12, color:'var(--ink-800)', lineHeight:1.55, marginLeft:30 }}>
          <RenderText text={comment.text}/>
        </p>
      )}
    </div>
  )
}

/* ─── Discussion tab ─────────────────────────────────── */
function DiscussionTab({ projectId, projectName, page, pageName, currentUser, canComment, highlightCommentId }) {
  const { state, dispatch } = useStore()
  const commentKey = `${projectId}:${page}`
  const comments   = (state.pageComments || {})[commentKey] || []

  const [text,         setText]         = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionStart, setMentionStart] = useState(-1)
  const [replyingTo,   setReplyingTo]   = useState(null) // { id, authorName, text }
  const textareaRef = useRef(null)
  const listRef     = useRef(null)

  const authorId    = currentUser?.email || ''
  const authorEmail = currentUser?.email || ''
  const isAdmin     = currentUser?.caps?.canEditAll

  const handleChange = useCallback(e => {
    const val    = e.target.value
    const cursor = e.target.selectionStart
    setText(val)
    const lastAt = val.lastIndexOf('@', cursor - 1)
    if (lastAt >= 0) {
      const seg = val.slice(lastAt + 1, cursor)
      if (!seg.includes(' ') || seg.length < 20) {
        setMentionQuery(seg); setMentionStart(lastAt); return
      }
    }
    setMentionQuery(null); setMentionStart(-1)
  }, [])

  // Track resolved mentions separately so we can notify the right people
  const mentionMapRef = useRef({})  // name → { id, email }

  /* Mention candidates — the PROJECT team (internal + freelancers/external),
     not the full company directory. */
  const mentionPeople = useMemo(() =>
    readProjectTeam(projectId).map(m => ({
      id:    m._uid || m._directoryId || nameOf(m),
      name:  nameOf(m),
      email: (m.email || '').toLowerCase(),
      title: m.projectRole || m.title || m.role || (m.type === 'external' ? 'External' : ''),
    })),
  [projectId])

  const insertMention = useCallback(person => {
    const name = person.name
    const cur  = textareaRef.current?.selectionStart ?? text.length
    // Insert clean "@Name" — no ID token visible in the textarea
    setText(text.slice(0, mentionStart) + `@${name}` + ' ' + text.slice(cur))
    // Store the mapping so we can notify the right person at submit time
    mentionMapRef.current[name] = { id: person.id, email: person.email }
    setMentionQuery(null); setMentionStart(-1)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [text, mentionStart])

  const submit = useCallback(() => {
    if (!text.trim() || !canComment || !currentUser) return

    const authorName     = currentUser.name || currentUser.email || 'Team'
    const authorInitials = initials(authorName)
    const commentId      = `pc${Date.now()}`

    // Resolve mentions: check mentionMap first (from dropdown selections),
    // then scan full directory for any @Name in the text we don't have mapped.
    // This avoids regex issues with multi-word names like "Teekay Kong".
    const resolvedMentions = []
    const seen = new Set()

    // 1. Everything in the mentionMap that appears in the text
    Object.entries(mentionMapRef.current).forEach(([name, data]) => {
      if (text.includes('@' + name) && !seen.has(name)) {
        seen.add(name)
        resolvedMentions.push({ name, id: data.id, email: data.email })
      }
    })

    // 2. Scan the project team for any @Full Name not already caught
    mentionPeople.forEach(p => {
      if (!seen.has(p.name) && text.includes('@' + p.name)) {
        seen.add(p.name)
        resolvedMentions.push({ name: p.name, id: p.id, email: p.email })
      }
    })

    dispatch(A.addPageComment({
      id: commentId,
      projectId, page, commentKey,
      authorId: authorEmail, authorName, authorInitials,
      text: text.trim(),
      mentions: resolvedMentions.map(m => m.id),
      replyToId: replyingTo?.id || null,
    }))

    // Notify every resolved mention (including self for testing)
    resolvedMentions.forEach(mentioned => {
      // Email from the team record first; directory lookup only as legacy fallback
      const dirPerson = CAPE_DIRECTORY.find(p => p.id === mentioned.id ||
        `${p.firstName} ${p.lastName}`.toLowerCase() === mentioned.name?.toLowerCase()
      )
      const toUserEmail = mentioned.email || dirPerson?.email || ''
      if (!toUserEmail) return  // can't notify without an email

      dispatch(A.addNotification({
        type:         'mention',
        toUserId:     mentioned.id,
        toUserEmail,
        fromUserName: authorName,
        fromUserEmail:authorEmail,
        projectId,
        projectName:  projectName || projectId,
        page,
        pageName:     pageName || page,
        commentId,
        commentKey,
        preview:      text.trim().slice(0, 80),
        text:         `${authorName} mentioned you in ${projectName || 'a project'} › ${pageName || page}`,
      }))
    })

    setText('')
    setMentionQuery(null)
    setReplyingTo(null)
    mentionMapRef.current = {}
  }, [text, canComment, currentUser, projectId, page, commentKey, projectName, pageName, dispatch, authorEmail, replyingTo, mentionPeople])

  const startReply = useCallback((target) => {
    setReplyingTo(target)
    const authorName = currentUser?.name || currentUser?.email || ''
    if (target.authorName !== authorName) {
      // Resolve from the project team first; directory as legacy fallback
      const teamPerson = mentionPeople.find(p => p.name === target.authorName)
      const dirPerson  = teamPerson ? null : CAPE_DIRECTORY.find(p =>
        `${p.firstName} ${p.lastName}` === target.authorName
      )
      setText(`@${target.authorName} `)
      mentionMapRef.current[target.authorName] = {
        id:    teamPerson?.id    || dirPerson?.id    || target.authorName,
        email: teamPerson?.email || dirPerson?.email || '',
      }
    } else {
      setText('')
    }
    setTimeout(() => {
      textareaRef.current?.focus()
      const len = textareaRef.current?.value.length || 0
      textareaRef.current?.setSelectionRange(len, len)
    }, 0)
  }, [currentUser, mentionPeople])

  const cancelReply = useCallback(() => {
    setReplyingTo(null)
    setText('')
  }, [])

  const onKey = useCallback(e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
    if (e.key === 'Escape') setMentionQuery(null)
  }, [submit])

  const deleteComment = id => dispatch(A.deletePageComment({ commentKey, commentId:id }))
  const editComment   = (id, t) => dispatch(A.editPageComment({ commentKey, commentId:id, text:t }))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      {/* List */}
      <div ref={listRef} style={{ flex:1, overflowY:'auto', padding:'0 14px' }}>
        {comments.length === 0 ? (
          <div style={{ padding:'32px 0', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic',
              color:'var(--ink-200)', marginBottom:4 }}>No discussion yet.</p>
            {canComment && (
              <p style={{ fontSize:11, color:'var(--ink-200)' }}>
                Start the thread below.
              </p>
            )}
          </div>
        ) : comments.map(c => (
          <CommentRow
            key={c.id}
            comment={c}
            canAct={isAdmin || c.authorId === authorEmail}
            canComment={canComment}
            onDelete={() => deleteComment(c.id)}
            onEdit={t  => editComment(c.id, t)}
            onReply={startReply}
            highlighted={c.id === highlightCommentId}
            replySourceComment={c.replyToId ? comments.find(r => r.id === c.replyToId) : null}
          />
        ))}
      </div>

      {/* Compose */}
      <div style={{ flexShrink:0, borderTop:'1px solid var(--border)', padding:'10px 14px' }}>
        {canComment && currentUser ? (
          <div style={{ position:'relative' }}>
            {/* Reply-to context banner */}
            {replyingTo && (
              <div style={{
                display:'flex', alignItems:'flex-start', gap:8, marginBottom:8,
                padding:'6px 8px', background:'var(--ground-dim)',
                border:'1px solid var(--border)', borderRadius:4,
                borderLeft:'2px solid var(--ink-400)',
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:10, fontWeight:600, color:'var(--ink-500)', marginBottom:2 }}>
                    Replying to {replyingTo.authorName}
                  </p>
                  <p style={{ fontSize:11, color:'var(--ink-400)', lineHeight:1.4,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {replyingTo.text?.slice(0, 55)}{(replyingTo.text?.length || 0) > 55 ? '…' : ''}
                  </p>
                </div>
                <button onClick={cancelReply}
                  style={{ fontSize:13, color:'var(--ink-300)', background:'none', border:'none',
                    cursor:'pointer', lineHeight:1, padding:'0 2px', flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-700)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-300)'}>
                  ×
                </button>
              </div>
            )}
            <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
              <Av name={currentUser.name || currentUser.email} size={22}/>
              <div style={{ flex:1, position:'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleChange}
                  onKeyDown={onKey}
                  placeholder={`Comment on ${pageName}…  @ to mention`}
                  rows={2}
                  style={{
                    width:'100%', fontSize:12, fontFamily:'var(--font)',
                    color:'var(--ink-800)', lineHeight:1.5,
                    border:'1px solid var(--border)', borderRadius:4,
                    padding:'7px 9px', resize:'none', outline:'none',
                    background:'var(--surface)', boxSizing:'border-box',
                    transition:'border-color 0.1s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-med)'}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; setTimeout(() => setMentionQuery(null), 150) }}
                />
                {mentionQuery !== null && (
                  <MentionDropdown query={mentionQuery} onSelect={insertMention} people={mentionPeople}/>
                )}
              </div>
            </div>
            {text.trim() && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, marginLeft:29 }}>
                <button onClick={submit}
                  style={{ fontSize:11, fontWeight:600, padding:'5px 14px',
                    background:'var(--ink-900)', color:'white', border:'none',
                    borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>
                  Post
                </button>
                <span style={{ fontSize:10, color:'var(--ink-200)' }}>⌘↵</span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize:11, color:'var(--ink-300)', fontStyle:'italic',
            textAlign:'center', padding:'4px 0' }}>
            {!currentUser
              ? 'Sign in to comment.'
              : 'View-only — assigned project members can comment.'}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Activity tab ───────────────────────────────────── */
function ActivityTab({ projectId, page }) {
  const { state } = useStore()

  const activity = useMemo(() => {
    const log = state.activityLog || []
    return log
      .filter(a => !a.projectId || a.projectId === projectId)
      .slice(0, 12)
  }, [state.activityLog, projectId])

  const PAGE_SEEDS = {
    overview:     [{ text:'Project workspace opened',       time:'just now' }],
    hospitality:  [{ text:'F&B concept seeded',             time:'3d ago'   }],
    fabrication:  [{ text:'Scenic items added',             time:'5d ago'   }],
    'av-tech':    [{ text:'AV spec sheet uploaded',         time:'4d ago'   }],
    vendors:      [{ text:'Vendor list imported',           time:'6d ago'   }],
    logistics:    [{ text:'Load-in schedule drafted',       time:'2d ago'   }],
    team:         [{ text:'Team roster populated',          time:'4d ago'   }],
    timeline:     [{ text:'Milestones added',               time:'3d ago'   }],
    budget:       [{ text:'Budget seeded',                  time:'5d ago'   }],
    approvals:    [{ text:'Approvals workflow active',      time:'2d ago'   }],
    creative:     [{ text:'Deliverables pipeline started',  time:'6d ago'   }],
    'guest-list': [{ text:'Guest list imported',            time:'4d ago'   }],
    content:      [{ text:'Shot list drafted',              time:'3d ago'   }],
    'run-of-show':[{ text:'ROS structure set',              time:'2d ago'   }],
  }

  const seeded = (PAGE_SEEDS[page] || []).map(s => ({ ...s, type:'system' }))
  const live   = activity.map(a => ({
    text: a.action || a.text || 'Activity logged',
    name: a.user || '',
    time: timeAgo(a.timestamp),
    type: 'user',
  }))
  const items = [...live, ...seeded]

  return (
    <div style={{ padding:'4px 14px', overflowY:'auto', height:'100%' }}>
      {items.length === 0 ? (
        <div style={{ padding:'32px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic', color:'var(--ink-200)' }}>
            No activity yet.
          </p>
        </div>
      ) : items.map((item, i) => (
        <div key={i} style={{ display:'flex', gap:8, padding:'9px 0',
          borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', marginTop:5, flexShrink:0,
            background: item.type === 'user' ? 'var(--signal-green-dot)' : 'var(--border)' }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, color:'var(--ink-700)', lineHeight:1.4, marginBottom: item.name ? 2 : 0 }}>
              {item.text}
            </p>
            {item.name && <p style={{ fontSize:10, color:'var(--ink-400)' }}>{item.name}</p>}
          </div>
          <span style={{ fontSize:10, color:'var(--ink-300)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
            {item.time}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Decisions tab ──────────────────────────────────── */
function DecisionsTab() {
  return (
    <div style={{ padding:'14px', overflowY:'auto', height:'100%' }}>
      <div style={{ padding:'32px 0', textAlign:'center' }}>
        <p style={{ fontFamily:'var(--font-serif)', fontSize:14, fontStyle:'italic',
          color:'var(--ink-200)', marginBottom:6 }}>No decisions logged yet.</p>
        <p style={{ fontSize:11, color:'var(--ink-200)', maxWidth:200, margin:'0 auto', lineHeight:1.5 }}>
          Key decisions made on this page will appear here.
        </p>
      </div>
    </div>
  )
}

/* ─── Collapsed bubble button ────────────────────────────── */
function CollapsedBubble({ onClick, projectId, page, currentUser }) {
  const { state } = useStore()
  const userEmail  = (currentUser?.email || '').toLowerCase()
  const commentKey = `${projectId}:${page}`
  const comments   = (state.pageComments || {})[commentKey] || []

  const unread = (state.notifications || []).filter(n =>
    !n.read &&
    n.commentKey === commentKey &&
    n.toUserEmail?.toLowerCase() === userEmail
  ).length

  const commentCount = comments.length

  return (
    <div style={{ position:'fixed', bottom:28, right:28, zIndex:200 }}>
      <button
        onClick={onClick}
        title={`Open discussion${commentCount ? ` · ${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''}`}
        style={{
          width:52, height:52, borderRadius:26,
          background:'var(--ink-900)', border:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', padding:0, color:'white',
          boxShadow:'0 8px 24px rgba(10,9,8,0.28), 0 2px 6px rgba(10,9,8,0.16)',
          transition:'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(10,9,8,0.36)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(10,9,8,0.28), 0 2px 6px rgba(10,9,8,0.16)' }}
      >
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h13A1.5 1.5 0 0 1 19 4.5v9A1.5 1.5 0 0 1 17.5 15H8.5l-4 3.5V15H4.5A1.5 1.5 0 0 1 3 13.5v-9z"
            fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
          <line x1="7" y1="8" x2="15" y2="8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="7" y1="11" x2="12" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Red badge — unread mentions */}
      {unread > 0 && (
        <div style={{
          position:'absolute', top:-2, right:-2,
          minWidth:20, height:20, borderRadius:10,
          background:'var(--signal-red-dot)', border:'2.5px solid white',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:800, color:'white', fontFamily:'var(--font)',
          padding:'0 4px', pointerEvents:'none',
        }}>
          {unread > 9 ? '9+' : unread}
        </div>
      )}

      {/* Grey badge — comment count, no unread */}
      {unread === 0 && commentCount > 0 && (
        <div style={{
          position:'absolute', top:-2, right:-2,
          minWidth:20, height:20, borderRadius:10,
          background:'var(--ink-500)', border:'2.5px solid white',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:700, color:'white', fontFamily:'var(--font)',
          padding:'0 4px', pointerEvents:'none',
        }}>
          {commentCount > 9 ? '9+' : commentCount}
        </div>
      )}
    </div>
  )
}

/* ─── CollabRail root ────────────────────────────────── */
export default function CollabRail({
  projectId, projectName, page, pageName,
  currentUser, canComment,
  highlightCommentId,   // from notification click
  defaultOpen,          // force-open from notification click
}) {
  const [open, setOpen] = useState(() => {
    if (defaultOpen) return true
    return loadRailOpen()
  })
  const [tab, setTab] = useState('discussion')

  // Force open + switch to discussion tab when notification targets this rail
  useEffect(() => {
    if (defaultOpen && highlightCommentId) {
      setOpen(true)
      setTab('discussion')
    }
  }, [defaultOpen, highlightCommentId])

  // Reset to discussion when navigating to a new page
  useEffect(() => {
    setTab('discussion')
    if (open) {
      dispatch(A.markPageNotificationsRead({ commentKey: `${projectId}:${page}` }))
    }
  }, [page, projectId])

  const { state, dispatch } = useStore()

  const toggle = () => setOpen(o => {
    const next = !o
    saveRailOpen(next)
    if (next) {
      // Mark all notifications for this page as read when opening
      dispatch(A.markPageNotificationsRead({ commentKey: `${projectId}:${page}` }))
    }
    return next
  })

  const TABS = [
    { id:'discussion', label:'Discussion' },
    { id:'activity',   label:'Activity'   },
    { id:'decisions',  label:'Decisions'  },
  ]

  return (
    <div className="collab-rail" style={{
      display: open ? 'flex' : 'contents',
      flexDirection:'row', flexShrink:0, height:'100%', position:'relative',
    }}>

      {/* Collapsed state — fixed floating bubble, bottom-right corner */}
      {!open && (
        <CollapsedBubble onClick={toggle} projectId={projectId} page={page} currentUser={currentUser}/>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          width:RAIL_WIDTH, height:'100%',
          borderLeft:'1px solid var(--border)',
          background:'var(--surface)',
          display:'flex', flexDirection:'column', overflow:'hidden',
        }}>
          {/* Header tabs + collapse */}
          <div style={{
            height:44, flexShrink:0, display:'flex', alignItems:'center',
            padding:'0 14px', borderBottom:'1px solid var(--border)', gap:2,
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  fontSize:11, fontWeight: tab === t.id ? 700 : 400,
                  color: tab === t.id ? 'var(--ink-900)' : 'var(--ink-400)',
                  background:'none', border:'none', cursor:'pointer',
                  fontFamily:'var(--font)', padding:'4px 8px', borderRadius:3,
                  borderBottom: tab === t.id ? '2px solid var(--ink-900)' : '2px solid transparent',
                  transition:'color 0.1s',
                }}>
                {t.label}
              </button>
            ))}
            {/* Collapse button — right side of header */}
            <button onClick={toggle} title="Collapse panel"
              style={{ marginLeft:'auto', display:'flex', alignItems:'center', justifyContent:'center',
                width:24, height:24, borderRadius:4, background:'none', border:'none',
                cursor:'pointer', color:'var(--ink-300)', flexShrink:0, transition:'color 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--ink-700)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--ink-300)'}>
              <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
                <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Tab body */}
          <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {tab === 'discussion' && (
              <DiscussionTab
                projectId={projectId}
                projectName={projectName}
                page={page}
                pageName={pageName}
                currentUser={currentUser}
                canComment={canComment}
                highlightCommentId={highlightCommentId}
              />
            )}
            {tab === 'activity'   && <ActivityTab  projectId={projectId} page={page}/>}
            {tab === 'decisions'  && <DecisionsTab/>}
          </div>
        </div>
      )}
    </div>
  )
}
