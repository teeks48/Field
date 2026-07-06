import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalState } from '../useLocalState.js'

const MOCK_CONVERSATIONS = [
  { id:'g1', sender:'Apple Events Team',       email:'events@apple.com',         domain:'apple.com',         subject:'[CAPE] Apple House -- Final Logistics',    snippet:'Per our call yesterday, the venue confirmation is attached...',  count:46, lastDate:'Jul 1',  hasAttachment:true,  suggestedProject:'Apple House Dinner', suggestedType:'Client' },
  { id:'g2', sender:'PINCH Food Design',       email:'hello@pinchfooddesign.com', domain:'pinchfooddesign.com',subject:'Proposal: Tasting Menu Concept + Pricing', snippet:'We have put together three concept options at different price points...', count:32, lastDate:'Jun 28', hasAttachment:true,  suggestedProject:'Apple House Dinner', suggestedType:'Vendor' },
  { id:'g3', sender:'Hudson Mercantile Events',email:'ops@hudsonmercantile.com',  domain:'hudsonmercantile.com',subject:'Site Walk -- Confirmed Jul 3, 10am',       snippet:'Looking forward to walking the space with you on Thursday...',   count:19, lastDate:'Jun 25', hasAttachment:false, suggestedProject:'Brooklyn Tower Gala', suggestedType:'Venue' },
  { id:'g4', sender:'Encore AV',               email:'account@encoreav.com',      domain:'encoreav.com',      subject:'Revised AV Quote -- Revision 3',            snippet:'We have adjusted the line items per your feedback. The LED wall...', count:27, lastDate:'Jun 30', hasAttachment:true,  suggestedProject:'Brooklyn Tower Gala', suggestedType:'Vendor' },
  { id:'g5', sender:'CAPE Internal',           email:'team@capecreative.co',      domain:'capecreative.co',   subject:'Internal -- Pre-Pro Checklist Review',     snippet:'Quick sync needed before the client call on Friday morning...',  count:14, lastDate:'Jul 2',  hasAttachment:false, suggestedProject:'Apple House Dinner', suggestedType:'Team' },
  { id:'g6', sender:'Eventmakers NYC',         email:'tom@eventmakers.com',       domain:'eventmakers.com',   subject:'Shop Drawings -- Round 2 for Approval',    snippet:'Attached are the revised shop drawings incorporating your notes...', count:21, lastDate:'Jun 27', hasAttachment:true,  suggestedProject:'Apple House Dinner', suggestedType:'Vendor' },
  { id:'g7', sender:'Brooklyn Tower Venue',    email:'bteevents@brooklyntower.com',domain:'brooklyntower.com', subject:'COI Request and Dock Schedule',            snippet:'Please find the COI requirements attached. Dock reservations must...', count:8,  lastDate:'Jun 22', hasAttachment:true,  suggestedProject:'Brooklyn Tower Gala', suggestedType:'Venue' },
  { id:'g8', sender:'Glasshouse Catering',     email:'nina@glasshouse.nyc',       domain:'glasshouse.nyc',    subject:'Final Menu and Dietary Breakdown',          snippet:'Here is the confirmed menu with all dietary accommodations noted...', count:15, lastDate:'Jul 1',  hasAttachment:true,  suggestedProject:'Apple House Dinner', suggestedType:'Vendor' },
]

const PROJECTS = ['Apple House Dinner', 'Brooklyn Tower Gala', 'Nike Pop-Up Paris', 'No project']

const TYPE_COLORS = {
  Client: { bg:'var(--signal-blue-bg)',  text:'var(--signal-blue-text)' },
  Vendor: { bg:'var(--signal-amber-bg)', text:'var(--signal-amber-text)' },
  Venue:  { bg:'var(--signal-green-bg)', text:'var(--signal-green-text)' },
  Team:   { bg:'var(--ground-dim)',      text:'var(--ink-500)' },
}

function TypePill({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.Team
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
    padding:'2px 7px', borderRadius:3, background:c.bg, color:c.text }}>{type}</span>
}

function Steps({ current, total }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width:24, height:4, borderRadius:2,
          background: i < current ? 'var(--ink-900)' : i === current ? 'var(--signal-amber-dot)' : 'var(--border-med)',
          transition:'background 0.2s' }}/>
      ))}
      <span style={{ fontSize:11, color:'var(--ink-400)', marginLeft:4 }}>
        Step {current + 1} of {total}
      </span>
    </div>
  )
}

function GmailWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [syncTypes, setSyncTypes] = useState({ clients:true, vendors:true, venues:true, team:false, project:true, attachments:false })
  const [syncMethod, setSyncMethod] = useState('manual')
  const [rules, setRules] = useState({ domains:'apple.com, capecreative.co', labels:'CAPE, Production', keywords:'', projects:'Apple House Dinner', vendors:'', clients:'' })
  const [selected, setSelected] = useState(new Set(MOCK_CONVERSATIONS.map(c => c.id)))
  const [projects, setProjects] = useState(() => { const m = {}; MOCK_CONVERSATIONS.forEach(c => { m[c.id] = c.suggestedProject }); return m })
  const [importing, setImporting] = useState(false)
  const [imported,  setImported]  = useState(false)

  const toggleConv = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleImport = () => {
    setImporting(true)
    setTimeout(() => { setImporting(false); setImported(true) }, 1400)
    setTimeout(() => onComplete(selected, projects), 2000)
  }

  const SyncRow = ({ id, label, desc }) => (
    <label style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0',
      borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
      <input type="checkbox" checked={syncTypes[id]} onChange={e => setSyncTypes(p => ({ ...p, [id]: e.target.checked }))}
        style={{ marginTop:2, width:15, height:15, accentColor:'var(--ink-900)', cursor:'pointer' }}/>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:12, color:'var(--ink-400)' }}>{desc}</p>
      </div>
    </label>
  )

  const MethodCard = ({ id, label, desc }) => (
    <div onClick={() => setSyncMethod(id)}
      style={{ padding:'16px', borderRadius:'var(--r-sm)', cursor:'pointer',
        border: '2px solid ' + (syncMethod===id ? 'var(--ink-900)' : 'var(--border)'),
        background: syncMethod===id ? 'var(--ink-0)' : 'var(--surface)',
        transition:'all 0.12s', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:16, height:16, borderRadius:'50%',
          border: '2px solid ' + (syncMethod===id ? 'var(--ink-900)' : 'var(--border-med)'),
          background: syncMethod===id ? 'var(--ink-900)' : 'transparent', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {syncMethod===id && <div style={{ width:6, height:6, borderRadius:'50%', background:'white' }}/>}
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{label}</p>
          <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:2 }}>{desc}</p>
        </div>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ maxWidth:680, margin:'0 auto' }}>
      <div style={{ marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>Gmail Setup</p>
          <span style={{ fontSize:11, color:'var(--ink-400)' }}>Prototype -- no real emails accessed</span>
        </div>
      </div>
      <Steps current={step} total={4}/>

      {step === 0 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>What should Field sync from Gmail?</h2>
          <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:20 }}>
            Choose which types of conversations get linked to the platform. You can change this any time.
          </p>
          <SyncRow id="clients"     label="Client emails"         desc="Messages from client domains and contacts"/>
          <SyncRow id="vendors"     label="Vendor emails"         desc="Quotes, invoices, proposals, and confirmations"/>
          <SyncRow id="venues"      label="Venue correspondence"  desc="Logistics, contracts, and site communication"/>
          <SyncRow id="team"        label="Internal team emails"  desc="CAPE team communications (optional -- off by default)"/>
          <SyncRow id="project"     label="Project-tagged emails" desc="Emails referencing specific project names"/>
          <SyncRow id="attachments" label="Attachments"           desc="Download and store relevant attachments automatically"/>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={() => setStep(1)}>Next</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>How should Field sync?</h2>
          <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:20 }}>
            Nothing imports automatically without your approval.
          </p>
          <MethodCard id="manual"    label="Manual import only" desc="You choose when to pull emails into Field. Nothing happens automatically."/>
          <MethodCard id="daily"     label="Daily sync"          desc="Field checks for new matching emails once per day and queues them for your review."/>
          <MethodCard id="automatic" label="Automatic sync"      desc="Matching emails appear in Field immediately. You can still remove any thread at any time."/>
          {syncMethod === 'automatic' && (
            <div style={{ padding:'10px 14px', background:'var(--signal-amber-bg)', borderRadius:'var(--r-sm)',
              border:'1px solid var(--signal-amber-text)', fontSize:12, color:'var(--signal-amber-text)', marginTop:8 }}>
              Automatic sync will link matching emails as they arrive. You can exclude sensitive threads using labels in the next step.
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>Define matching rules</h2>
          <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:20 }}>
            Field uses these rules to find relevant emails. Any email matching one or more rules will be surfaced for review.
          </p>
          {[
            { key:'domains',  label:'Email domains',    placeholder:'apple.com, pinchfooddesign.com, encoreav.com',          desc:'Match emails from these domains' },
            { key:'labels',   label:'Gmail labels',     placeholder:'CAPE, Production, Client, Vendor',                       desc:'Only pull emails with these labels' },
            { key:'keywords', label:'Subject keywords', placeholder:'proposal, quote, invoice, confirmation, COI, contract',  desc:'Match emails containing these words in the subject' },
            { key:'projects', label:'Project names',    placeholder:'Apple House Dinner, Brooklyn Tower Gala',                desc:'Emails mentioning project names' },
            { key:'vendors',  label:'Vendor names',     placeholder:'PINCH, Encore AV, Eventmakers, Glasshouse',             desc:'Match by vendor name' },
            { key:'clients',  label:'Client names',     placeholder:'Apple, Nike, The Standard',                             desc:'Match by client name' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                color:'var(--ink-300)', display:'block', marginBottom:5 }}>{f.label}</label>
              <input value={rules[f.key]} onChange={e => setRules(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} style={{ width:'100%' }}/>
              <p style={{ fontSize:11, color:'var(--ink-300)', marginTop:3 }}>{f.desc}</p>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Preview matches</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>Review before importing</h2>
          <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:6 }}>
            Field found <strong>{MOCK_CONVERSATIONS.length} conversations</strong> matching your rules.
            Select which to import and confirm the project assignment for each.
          </p>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <button onClick={() => setSelected(new Set(MOCK_CONVERSATIONS.map(c => c.id)))}
              style={{ fontSize:11, fontWeight:600, color:'var(--ink-700)', background:'none',
                border:'1px solid var(--border)', borderRadius:3, padding:'4px 10px', cursor:'pointer' }}>
              Select all
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ fontSize:11, fontWeight:600, color:'var(--ink-400)', background:'none',
                border:'1px solid var(--border)', borderRadius:3, padding:'4px 10px', cursor:'pointer' }}>
              Deselect all
            </button>
            <span style={{ fontSize:12, color:'var(--ink-400)', alignSelf:'center', marginLeft:'auto' }}>
              {selected.size} of {MOCK_CONVERSATIONS.length} selected
            </span>
          </div>
          <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:20 }}>
            {MOCK_CONVERSATIONS.map((c, i) => {
              const isSel = selected.has(c.id)
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                  borderBottom: i < MOCK_CONVERSATIONS.length-1 ? '1px solid var(--border)' : 'none',
                  background: isSel ? 'var(--surface)' : 'var(--ground-dim)', transition:'background 0.1s' }}>
                  <input type="checkbox" checked={isSel} onChange={() => toggleConv(c.id)}
                    style={{ width:15, height:15, accentColor:'var(--ink-900)', flexShrink:0, cursor:'pointer' }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <p style={{ fontSize:13, fontWeight:600, color: isSel ? 'var(--ink-900)' : 'var(--ink-400)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.sender}</p>
                      <TypePill type={c.suggestedType}/>
                      {c.hasAttachment && <span style={{ fontSize:11, color:'var(--ink-300)' }}>📎</span>}
                    </div>
                    <p style={{ fontSize:12, color:'var(--ink-600)', overflow:'hidden', textOverflow:'ellipsis',
                      whiteSpace:'nowrap', marginBottom:2 }}>{c.subject}</p>
                    <p style={{ fontSize:11, color:'var(--ink-400)' }}>{c.count} emails -- {c.lastDate}</p>
                  </div>
                  <div style={{ flexShrink:0, minWidth:160 }}>
                    <label style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                      color:'var(--ink-300)', display:'block', marginBottom:3 }}>Project</label>
                    <select value={projects[c.id]} onChange={e => setProjects(p => ({ ...p, [c.id]: e.target.value }))}
                      style={{ fontSize:12, width:'100%' }}>
                      {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding:'12px 14px', background:'var(--signal-blue-bg)', borderRadius:'var(--r-sm)',
            border:'1px solid var(--signal-blue-text)', fontSize:12, color:'var(--signal-blue-text)', marginBottom:20 }}>
            Emails are never deleted from Gmail. Removing a thread from Field only unlinks it -- the original stays in your inbox.
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn-primary" disabled={selected.size === 0 || importing} onClick={handleImport}>
                {importing ? 'Importing...' : imported ? 'Done' : 'Import ' + selected.size + ' conversation' + (selected.size !== 1 ? 's' : '')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const INIT_GMAIL = { connected:false, account:'', syncMethod:'manual', lastSync:null, totalImported:0 }

export default function Integrations() {
  const [gmail, setGmail]     = useLocalState('field_integrations_gmail_v1', INIT_GMAIL)
  const [showWizard, setWizard] = useState(false)
  const [showConfirm, setConfirm] = useState(false)
  const [simulating, setSimulating] = useState(false)

  const handleConnect = () => {
    setSimulating(true)
    setTimeout(() => {
      setSimulating(false)
      setGmail(p => ({ ...p, connected:true, account:'jessica@capecreative.co' }))
      setWizard(true)
    }, 1200)
  }

  const handleWizardComplete = (selected, projects) => {
    setGmail(p => ({ ...p, lastSync: new Date().toISOString(), totalImported: p.totalImported + selected.size }))
    setWizard(false)
  }

  const handleDisconnect = () => {
    setGmail(INIT_GMAIL)
    setConfirm(false)
  }

  return (
    <div style={{ padding:'40px 72px 80px', maxWidth:960, fontFamily:'var(--font)' }}>
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
        <p className="page-eyebrow">Settings</p>
        <h1 className="page-title" style={{ marginBottom:6 }}>Integrations</h1>
        <p style={{ fontSize:14, color:'var(--ink-400)', marginBottom:36 }}>
          Connect external tools to Field. Data flows in on your terms -- nothing syncs without your approval.
        </p>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-md)', padding:'24px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:'var(--r-sm)', flexShrink:0,
              border:'1px solid var(--border)', background:'white',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
              G
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Gmail</p>
                {gmail.connected
                  ? <span className="pill pill-green">Connected</span>
                  : <span className="pill pill-neutral">Not connected</span>
                }
              </div>
              {gmail.connected ? (
                <div>
                  <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:10 }}>
                    Connected as <strong style={{ color:'var(--ink-800)' }}>{gmail.account}</strong>
                    {gmail.lastSync && ' -- Last synced ' + new Date(gmail.lastSync).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    {gmail.totalImported > 0 && ' -- ' + gmail.totalImported + ' conversations imported'}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                    {[
                      { label:'Sync method', value: gmail.syncMethod === 'manual' ? 'Manual only' : gmail.syncMethod === 'daily' ? 'Daily' : 'Automatic' },
                      { label:'Gmail account', value: gmail.account },
                      { label:'Conversations', value: gmail.totalImported > 0 ? gmail.totalImported + ' imported' : 'None yet' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'var(--ground-dim)', padding:'10px 12px', borderRadius:'var(--r-sm)' }}>
                        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
                          color:'var(--ink-300)', marginBottom:3 }}>{s.label}</p>
                        <p style={{ fontSize:13, color:'var(--ink-700)', fontWeight:500 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button className="btn-primary" onClick={() => setWizard(true)}>Import emails</button>
                    <button className="btn-secondary" onClick={() => setWizard(true)}>Sync settings</button>
                    <button onClick={() => setConfirm(true)}
                      style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                        color:'var(--signal-red-text)', background:'none', border:'1px solid var(--border)',
                        borderRadius:3, padding:'8px 14px', cursor:'pointer', marginLeft:'auto',
                        fontFamily:'var(--font)' }}>
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:14, lineHeight:1.5 }}>
                    Link your Gmail account to attach email threads to projects, vendors, clients, and venues.
                    Field only reads emails matching your rules -- nothing is imported without your approval.
                  </p>
                  <button className="btn-primary" onClick={handleConnect} disabled={simulating}>
                    {simulating ? 'Connecting...' : 'Connect Gmail'}
                  </button>
                  {simulating && (
                    <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:8 }}>
                      Simulating OAuth flow -- no real login required in prototype mode
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {[
          { name:'Slack',        desc:'Send project updates, approvals, and notifications to Slack channels.' },
          { name:'Google Drive', desc:'Attach Drive files directly to projects, vendors, and deliverables.' },
          { name:'DocuSign',     desc:'Send contracts for signature and track status inside Field.' },
        ].map(int => (
          <div key={int.name} style={{ background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--r-md)', padding:'18px 24px', marginBottom:10, opacity:0.55 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{int.name}</p>
                  <span className="pill pill-neutral">Coming soon</span>
                </div>
                <p style={{ fontSize:12, color:'var(--ink-400)' }}>{int.desc}</p>
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop:24, padding:'12px 16px', background:'var(--ground-dim)',
          border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
          <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.6 }}>
            <strong style={{ color:'var(--ink-700)' }}>Prototype mode:</strong>{' '}
            This integration uses mocked data to simulate the Gmail connection flow.
            No real emails are accessed. A production integration would require OAuth 2.0 with Google,
            the Gmail API (read-only scope), and a server-side sync worker.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(10,9,8,0.42)',
              backdropFilter:'blur(3px)', overflowY:'auto', padding:'40px 20px' }}
            onClick={() => setWizard(false)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:10,
                maxWidth:740, margin:'0 auto', padding:'32px', boxShadow:'0 24px 64px rgba(10,9,8,0.22)' }}>
              <GmailWizard onComplete={handleWizardComplete} onCancel={() => setWizard(false)}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(10,9,8,0.42)',
              display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setConfirm(false)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'var(--surface)', border:'1px solid var(--border-med)', borderRadius:8,
                padding:'28px 28px 24px', width:400, boxShadow:'0 16px 48px rgba(10,9,8,0.22)' }}>
              <p style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>Disconnect Gmail?</p>
              <p style={{ fontSize:13, color:'var(--ink-600)', marginBottom:20, lineHeight:1.5 }}>
                This will remove the Gmail connection and unlink all imported conversations from Field.
                Your emails in Gmail are not affected.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-secondary" onClick={() => setConfirm(false)} style={{ flex:1 }}>Cancel</button>
                <button onClick={handleDisconnect}
                  style={{ flex:1, padding:'10px', fontSize:12, fontWeight:700, letterSpacing:'0.08em',
                    textTransform:'uppercase', background:'var(--signal-red-text)', color:'white',
                    border:'none', borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>
                  Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
