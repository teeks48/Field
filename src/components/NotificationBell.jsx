/**
 * NotificationBell — topbar notification centre
 *
 * Filters notifications by toUserEmail (email match against currentUser.email).
 * Clicking navigates to correct project + page and signals the rail to open
 * and highlight the relevant comment.
 *
 * Notification shape:
 *   { id, type, toUserId, toUserEmail, fromUserName, fromUserEmail,
 *     projectId, projectName, page, pageName, commentId, commentKey,
 *     preview, text, timestamp, read }
 */

import React, { useState, useRef, useEffect } from 'react'
import { useStore, A } from '../store.jsx'
import { getAllProjectsWithUserCreated } from '../company/companyData.js'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_ICON = { mention:'@', approval:'✓', assignment:'◈', alert:'!' }

export default function NotificationBell({ currentUser, onOpenProject }) {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const userEmail = (currentUser?.email || '').toLowerCase()

  // Match on email — toUserEmail is the reliable key
  // Also match on toUserId for legacy notifications that don't have toUserEmail
  const myNotifs = (state.notifications || [])
    .filter(n => {
      if (!userEmail) return false
      if (n.toUserEmail)        return n.toUserEmail.toLowerCase() === userEmail
      if (n.toUserId)           return n.toUserId.toLowerCase() === userEmail
      return false
    })
    .slice(0, 60)

  const unreadCount = myNotifs.filter(n => !n.read).length

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClickNotif = (notif) => {
    dispatch(A.markNotificationRead({ id: notif.id }))
    setOpen(false)

    if (notif.projectId && onOpenProject) {
      const allProjects = getAllProjectsWithUserCreated()
      const project = allProjects.find(p => p.id === notif.projectId)
      if (project) {
        // Pass commentId and page so WorkspaceShell can open rail + highlight
        onOpenProject(project, notif.page || 'overview', {
          commentId: notif.commentId,
          openRail:  true,
        })
        return
      }
    }
  }

  const handleMarkAllRead = e => {
    e.stopPropagation()
    dispatch(A.markAllNotificationsRead())
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    dispatch(A.deleteNotification({ id }))
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bell */}
      <button onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
          width:32, height:32, borderRadius:5,
          background: open ? 'var(--ground-dim)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-med)' : 'transparent'}`,
          cursor:'pointer', transition:'all 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--ground-dim)'; e.currentTarget.style.borderColor='var(--border)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent' } }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5c0 2.5-.5 4-1.5 5h12c-1-1-1.5-2.5-1.5-5A4.5 4.5 0 0 0 8 2z"
            stroke="var(--ink-500)" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M6.5 11.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5"
            stroke="var(--ink-500)" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position:'absolute', top:4, right:4, minWidth:14, height:14,
            background:'var(--signal-red-dot)', borderRadius:7,
            border:'1.5px solid var(--surface)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:8, fontWeight:700, color:'white', fontFamily:'var(--font)', padding:'0 2px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:'absolute', right:0, top:40, width:360,
          background:'var(--surface)', border:'1px solid var(--border-med)',
          borderRadius:8, boxShadow:'0 12px 40px rgba(10,9,8,0.18)',
          zIndex:300, overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:500,
        }}>
          {/* Header */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'14px 16px 12px', borderBottom:'1px solid var(--border)', flexShrink:0,
          }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)' }}>Notifications</p>
              {unreadCount > 0 && (
                <p style={{ fontSize:11, color:'var(--ink-400)' }}>{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{ fontSize:11, color:'var(--ink-400)', background:'none', border:'none',
                  cursor:'pointer', fontFamily:'var(--font)', padding:'3px 8px',
                  borderRadius:3, transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {myNotifs.length === 0 ? (
              <div style={{ padding:'36px 16px', textAlign:'center' }}>
                <p style={{ fontSize:14, color:'var(--ink-300)', fontStyle:'italic', marginBottom:4 }}>
                  Nothing here yet.
                </p>
                <p style={{ fontSize:12, color:'var(--ink-200)' }}>
                  @mention a teammate to create a notification.
                </p>
              </div>
            ) : myNotifs.map(n => (
              <div key={n.id} onClick={() => handleClickNotif(n)}
                style={{
                  display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px',
                  borderBottom:'1px solid var(--border)', cursor:'pointer',
                  background: n.read ? 'transparent' : 'rgba(200,168,64,0.04)',
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--ground-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(200,168,64,0.04)'}>

                {/* Type icon */}
                <div style={{
                  width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background: n.read ? 'var(--ground-dim)' : 'var(--signal-amber-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700,
                  color: n.read ? 'var(--ink-400)' : 'var(--signal-amber-text)',
                }}>
                  {TYPE_ICON[n.type] || '·'}
                </div>

                {/* Body */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{
                    fontSize:13, color: n.read ? 'var(--ink-700)' : 'var(--ink-900)',
                    fontWeight: n.read ? 400 : 500, lineHeight:1.4, marginBottom:4,
                  }}>
                    {n.text}
                  </p>
                  {/* Comment preview */}
                  {n.preview && (
                    <p style={{
                      fontSize:11, color:'var(--ink-500)', lineHeight:1.4,
                      fontStyle:'italic', marginBottom:4,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      "{n.preview.slice(0, 60)}{n.preview.length > 60 ? '…' : ''}"
                    </p>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {n.pageName && (
                      <span style={{
                        fontSize:10, fontWeight:600, letterSpacing:'0.07em',
                        textTransform:'uppercase', color:'var(--ink-300)',
                        background:'var(--ground-dim)', border:'1px solid var(--border)',
                        borderRadius:3, padding:'1px 6px',
                      }}>
                        {n.projectName && `${n.projectName.split(' ')[0]} › `}{n.pageName}
                      </span>
                    )}
                    <span style={{ fontSize:10, color:'var(--ink-300)', fontFamily:'var(--font-mono)' }}>
                      {timeAgo(n.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Unread dot + dismiss */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                  {!n.read && (
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--signal-amber-dot)', marginTop:4 }}/>
                  )}
                  <button onClick={e => handleDelete(e, n.id)}
                    style={{ fontSize:14, color:'var(--ink-200)', background:'none', border:'none',
                      cursor:'pointer', lineHeight:1, padding:'0 2px' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--signal-red-text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-200)'}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
