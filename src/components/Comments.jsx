/**
 * Comments — page-scoped comment threads with @mentions and notifications
 *
 * Props:
 *   projectId     string  — current project ID
 *   projectName   string  — human-readable project name (for notifications)
 *   page          string  — current page slug e.g. 'hospitality'
 *   pageName      string  — human-readable page name e.g. 'Hospitality'
 *   currentUser   object  — resolved user from useCurrentUser()
 *   canComment    bool    — whether the current user can post (based on permissions)
 *
 * Storage: global store → state.pageComments[`${projectId}:${page}`]
 * Notifications: dispatched to state.notifications when @mentions are found
 *
 * Future-ready:
 *   - Email/Slack hooks can be added in the dispatch handlers below
 *   - File attachments: add attachment[] to the comment payload shape
 *   - Reactions: add reactions[] to the comment payload shape
 *   - Threading: add parentId to create reply threads
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useStore, A } from '../store.jsx'
import { readProjectTeam, nameOf } from '../projectData.js'

/* ─── Helpers ───────────────────────────────────────────── */
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

function Avatar({ name, size = 26 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--ink-800)',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      fontSize:size < 30 ? 8 : 10, fontWeight:700, color:'rgba(255,255,255,0.65)',
      fontFamily:'var(--font)', letterSpacing:'0.02em' }}>
      {initials(name)}
    </div>
  )
}

/* ─── Parse @mentions from text for display ─────────────── */
function RenderText({ text }) {
  if (!text) return null
  // Split on @[Name](id) pattern
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/)
        if (m) {
          return (
            <mark key={i} style={{ background:'rgba(200,168,64,0.18)', color:'var(--signal-amber-text)',
              borderRadius:3, padding:'0 3px', fontWeight:600 }}>
              @{m[1]}
            </mark>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/* ─── Mention dropdown ───────────────────────────────────── */
function MentionDropdown({ query, onSelect, people }) {
  const results = (people || [])
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  if (!people || people.length === 0) return (
    <div style={{ position:'absolute', zIndex:200, background:'var(--surface)',
      border:'1px solid var(--border-med)', borderRadius:6,
      boxShadow:'0 8px 24px rgba(10,9,8,0.14)', minWidth:220,
      bottom:'calc(100% + 4px)', left:0, padding:'10px 14px' }}>
      <p style={{ fontSize:12, color:'var(--ink-400)' }}>
        No one on this project yet — add people on the Team page to @mention them.
      </p>
    </div>
  )

  if (!results.length) return null

  return (
    <div style={{ position:'absolute', zIndex:200, background:'var(--surface)',
      border:'1px solid var(--border-med)', borderRadius:6,
      boxShadow:'0 8px 24px rgba(10,9,8,0.14)', minWidth:220,
      bottom:'calc(100% + 4px)', left:0, overflow:'hidden' }}>
      {results.map(p => {
        const fullName = p.name
        return (
          <button key={p.mid} onClick={() => onSelect(p)}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'9px 14px', background:'none', border:'none', cursor:'pointer',
              fontFamily:'var(--font)', textAlign:'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Avatar name={fullName} size={24}/>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink-900)', lineHeight:1.2 }}>{fullName}</p>
              {p.title && <p style={{ fontSize:11, color:'var(--ink-400)' }}>{p.title}</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Single comment row ─────────────────────────────────── */
function CommentRow({ comment, canDelete, onDelete, onEdit }) {
  const [hovered,  setHovered]  = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [editText, setEditText] = useState(comment.text)

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.text) onEdit(editText.trim())
    setEditing(false)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', gap:10, padding:'12px 0', borderBottom:'1px solid var(--border)', position:'relative' }}>
      <Avatar name={comment.authorName} size={26}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:5 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.01em' }}>
            {comment.authorName}
          </span>
          <span style={{ fontSize:11, color:'var(--ink-300)', fontFamily:'var(--font-mono)' }}>
            {timeAgo(comment.timestamp)}
          </span>
          {comment.edited && (
            <span style={{ fontSize:10, color:'var(--ink-200)', fontStyle:'italic' }}>edited</span>
          )}
        </div>

        {editing ? (
          <div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
              rows={2}
              style={{ width:'100%', fontSize:13, fontFamily:'var(--font)', color:'var(--ink-800)',
                border:'1px solid var(--border-med)', borderRadius:4, padding:'7px 10px',
                resize:'none', outline:'none', lineHeight:1.5, background:'var(--surface)' }}
            />
            <div style={{ display:'flex', gap:6, marginTop:5 }}>
              <button onClick={handleEdit}
                style={{ fontSize:11, fontWeight:600, padding:'4px 12px',
                  background:'var(--ink-900)', color:'white', border:'none', borderRadius:3,
                  cursor:'pointer', fontFamily:'var(--font)' }}>Save</button>
              <button onClick={() => { setEditing(false); setEditText(comment.text) }}
                style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                  cursor:'pointer', fontFamily:'var(--font)' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize:13, color:'var(--ink-800)', lineHeight:1.55, margin:0 }}>
            <RenderText text={comment.text}/>
          </p>
        )}
      </div>

      {/* Action buttons — shown on hover */}
      {hovered && !editing && (
        <div style={{ display:'flex', gap:4, position:'absolute', right:0, top:12 }}>
          {canDelete && (
            <>
              <button onClick={() => setEditing(true)}
                style={{ fontSize:11, color:'var(--ink-400)', background:'var(--surface)',
                  border:'1px solid var(--border)', borderRadius:3, padding:'2px 8px',
                  cursor:'pointer', fontFamily:'var(--font)' }}>Edit</button>
              <button onClick={onDelete}
                style={{ fontSize:11, color:'var(--signal-red-text)', background:'var(--surface)',
                  border:'1px solid var(--border)', borderRadius:3, padding:'2px 8px',
                  cursor:'pointer', fontFamily:'var(--font)' }}>Delete</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Comments component ────────────────────────────── */
export default function Comments({ projectId, projectName, page, pageName, currentUser, canComment }) {
  const { state, dispatch } = useStore()
  const commentKey = `${projectId}:${page}`
  const comments   = (state.pageComments || {})[commentKey] || []

  const [text,          setText]          = useState('')
  /* Mention candidates — the PROJECT team (internal + freelancers/external),
     not the full company directory. Mention id is the person's email when
     available so notifications target correctly; falls back to their team uid. */
  const mentionPeople = React.useMemo(() =>
    readProjectTeam(projectId).map(m => ({
      mid:   (m.email || m._uid || '').toLowerCase() || m._uid,
      name:  nameOf(m),
      title: m.projectRole || m.title || m.role || (m.type === 'external' ? 'External' : ''),
    })),
  [projectId])

  const [mentionQuery,  setMentionQuery]  = useState(null)   // null = not active, string = query
  const [mentionStart,  setMentionStart]  = useState(-1)
  const [open,          setOpen]          = useState(false)   // collapsed/expanded

  const textareaRef = useRef(null)

  // Parse @mention trigger as user types
  const handleTextChange = useCallback((e) => {
    const val = e.target.value
    setText(val)

    // Find the last @ before cursor
    const cursor = e.target.selectionStart
    const lastAt = val.lastIndexOf('@', cursor - 1)
    if (lastAt >= 0) {
      const segment = val.slice(lastAt + 1, cursor)
      // Only trigger if no space in segment (typing a name, not ended)
      if (!segment.includes(' ') || segment.length < 20) {
        setMentionQuery(segment)
        setMentionStart(lastAt)
        return
      }
    }
    setMentionQuery(null)
    setMentionStart(-1)
  }, [])

  // Insert mention
  const insertMention = useCallback((person) => {
    const fullName = person.name
    const mentionToken = `@[${fullName}](${person.mid})`
    const before = text.slice(0, mentionStart)
    const after  = text.slice(textareaRef.current?.selectionStart || text.length)
    const newText = before + mentionToken + ' ' + after
    setText(newText)
    setMentionQuery(null)
    setMentionStart(-1)
    textareaRef.current?.focus()
  }, [text, mentionStart])

  // Extract mentioned user IDs from the text
  function extractMentions(rawText) {
    const rx = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions = []
    let m
    while ((m = rx.exec(rawText)) !== null) {
      mentions.push({ name: m[1], id: m[2] })
    }
    return mentions
  }

  // Submit comment
  const handleSubmit = useCallback(() => {
    if (!text.trim() || !canComment || !currentUser) return

    const authorName     = currentUser.name || currentUser.email || 'Team member'
    const authorInitials = initials(authorName)
    const authorId       = currentUser.email || currentUser.id || 'unknown'
    const mentions       = extractMentions(text.trim())

    const comment = {
      projectId,
      page,
      commentKey,
      authorId,
      authorName,
      authorInitials,
      text: text.trim(),
      mentions: mentions.map(m => m.id),
    }

    dispatch(A.addPageComment(comment))

    // Fire notifications for each @mention
    mentions.forEach(mentioned => {
      // Future: add email / Slack hook here
      dispatch(A.addNotification({
        type:        'mention',
        toUserId:    mentioned.id,
        toUserEmail: mentioned.id.includes('@') ? mentioned.id : undefined,
        fromUserName:authorName,
        projectId,
        projectName: projectName || projectId,
        page,
        pageName:    pageName || page,
        text:        `${authorName} mentioned you in ${projectName || 'a project'} › ${pageName || page}`,
        commentKey,
      }))
    })

    setText('')
    setMentionQuery(null)
  }, [text, canComment, currentUser, projectId, page, commentKey, projectName, pageName, dispatch])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setMentionQuery(null)
  }, [handleSubmit])

  const handleDeleteComment = useCallback((commentId) => {
    dispatch(A.deletePageComment({ commentKey, commentId }))
  }, [dispatch, commentKey])

  const handleEditComment = useCallback((commentId, newText) => {
    dispatch(A.editPageComment({ commentKey, commentId, text: newText }))
  }, [dispatch, commentKey])

  const authorId = currentUser?.email || ''
  const isAdmin  = currentUser?.caps?.canEditAll

  return (
    <div style={{ marginTop:32 }}>
      {/* Section header */}
      <button onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'none',
          border:'none', borderTop:'1px solid var(--border)', padding:'16px 0 14px',
          cursor:'pointer', fontFamily:'var(--font)', textAlign:'left' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0 }}>
          <circle cx="6" cy="6" r="5" stroke="var(--ink-300)" strokeWidth="1.2"/>
          <path d="M4 5h4M4 7h3" stroke="var(--ink-300)" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
          color:'var(--ink-300)' }}>
          Comments {comments.length > 0 ? `· ${comments.length}` : ''}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink:0, color:'var(--ink-300)', marginLeft:'auto' }}>
          <path d={open ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div>
          {/* Comment list */}
          {comments.length > 0 ? (
            <div style={{ marginBottom:16 }}>
              {comments.map(c => (
                <CommentRow key={c.id} comment={c}
                  canDelete={isAdmin || c.authorId === authorId}
                  onDelete={() => handleDeleteComment(c.id)}
                  onEdit={(newText) => handleEditComment(c.id, newText)}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding:'16px 0', textAlign:'center' }}>
              <p style={{ fontSize:13, color:'var(--ink-300)', fontStyle:'italic' }}>
                No comments yet{canComment ? ' — be the first.' : '.'}
              </p>
            </div>
          )}

          {/* Compose box */}
          {canComment && currentUser ? (
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <Avatar name={currentUser.name || currentUser.email} size={26}/>
              <div style={{ flex:1, position:'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment… Type @ to mention a teammate"
                  rows={text.length > 80 ? 3 : 2}
                  style={{ width:'100%', fontSize:13, fontFamily:'var(--font)',
                    color:'var(--ink-800)', lineHeight:1.55,
                    border:'1px solid var(--border)', borderRadius:5, padding:'9px 12px',
                    resize:'none', outline:'none', background:'var(--surface)',
                    transition:'border-color 0.12s', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-med)'}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; setTimeout(() => setMentionQuery(null), 150) }}
                />

                {/* @mention dropdown */}
                {mentionQuery !== null && (
                  <MentionDropdown query={mentionQuery} onSelect={insertMention} people={mentionPeople}/>
                )}

                {text.trim() && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                    <button onClick={handleSubmit}
                      style={{ fontSize:12, fontWeight:600, padding:'6px 16px',
                        background:'var(--ink-900)', color:'white', border:'none', borderRadius:4,
                        cursor:'pointer', fontFamily:'var(--font)' }}>
                      Post
                    </button>
                    <span style={{ fontSize:11, color:'var(--ink-300)' }}>
                      or ⌘↵
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : !canComment ? (
            <p style={{ fontSize:12, color:'var(--ink-300)', fontStyle:'italic', paddingTop:4 }}>
              You can read comments but need to be assigned to this project to post.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
