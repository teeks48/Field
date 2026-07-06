import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, A } from '../../store.jsx'

const IMG_COLORS  = ['#f0ede6','#e8e5de','#edeae2','#e5e8e2','#ece8e2','#e8e2ec']
const IMG_HEIGHTS = [200,160,240,180,210,170]

export default function Florals() {
  const { state, dispatch } = useStore()
  const { florals } = state
  const [images, setImages] = useState([
    { id:'mb1', caption:'White ranunculus + garden roses — centrepiece reference', source:'Pinterest / Vera Wang Flowers', h:200, color:'#f0ede6' },
    { id:'mb2', caption:'Dried pampas arch — entrance canopy inspiration',          source:'Aria Florals portfolio',        h:160, color:'#e8e5de' },
    { id:'mb3', caption:'Low arrangement — 30cm max for sightline clearance',       source:'Reference shoot Jun 2025',      h:240, color:'#edeae2' },
    { id:'mb4', caption:'White + cream palette — tone reference',                   source:'Client moodboard',              h:180, color:'#e5e8e2' },
    { id:'mb5', caption:'Eucalyptus + lily of the valley — reception posies',       source:'NY Flower Market samples',      h:210, color:'#ece8e2' },
  ])
  const [addingImage, setAddingImage] = useState(false)
  const [newImage, setNewImage]       = useState({ caption:'', source:'' })

  const addImage = () => {
    if (!newImage.caption) return
    const i = images.length
    setImages(prev => [...prev, { id:`mb${Date.now()}`, ...newImage, color:IMG_COLORS[i%IMG_COLORS.length], h:IMG_HEIGHTS[i%IMG_HEIGHTS.length] }])
    setNewImage({ caption:'', source:'' })
    setAddingImage(false)
  }

  return (
    <div className="page-content">
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

        <div className="page-header">
          <p className="page-eyebrow">Production · Florals</p>
          <h1 className="page-title-serif">Florals <span className="page-title-serif-em">&amp; installation</span></h1>
          <p className="page-subtitle">{florals.vendor} · Jul 15 install · creative brief · moodboard</p>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:24, background:'var(--ground-dim)' }}>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Vendor</p>
            <p style={{ fontSize:12, fontWeight:500 }}>{florals.vendor}</p>
            <p style={{ fontSize:11, color:'var(--ink-400)' }}>{florals.vendorContact}</p>
          </div>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Install date</p>
            <p style={{ fontSize:12, fontWeight:500 }}>{florals.installDate}</p>
            <span className="pill pill-green" style={{ marginTop:4, display:'inline-flex' }}>Confirmed</span>
          </div>
          <div style={{ padding:'11px 14px', borderRight:'1px solid var(--border)' }}>
            <p className="section-label" style={{ margin:'0 0 3px' }}>Palette</p>
            <p style={{ fontSize:12, color:'var(--ink-700)' }}>White + cream</p>
            <p style={{ fontSize:11, color:'var(--ink-400)' }}>No fragrant blooms</p>
          </div>
          <div style={{ padding:'11px 14px', background:'var(--ink-900)' }}>
            <p className="section-label" style={{ margin:'0 0 3px', color:'rgba(255,255,255,0.28)' }}>Budget</p>
            <p style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.82)' }}>$18,500</p>
            <span className="pill pill-amber" style={{ marginTop:4, display:'inline-flex' }}>Quoted</span>
          </div>
        </div>

        {/* Brief + notes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32 }}>
          <div>
            <label className="field-label">Floral concept</label>
            <textarea value={florals.brief} onChange={e=>dispatch(A.updateFlorals({brief:e.target.value}))}
              style={{ width:'100%', minHeight:100, resize:'vertical', lineHeight:1.7 }}/>
          </div>
          <div>
            <label className="field-label">Install notes &amp; constraints</label>
            <textarea value={florals.notes} onChange={e=>dispatch(A.updateFlorals({notes:e.target.value}))}
              style={{ width:'100%', minHeight:100, resize:'vertical', lineHeight:1.65 }}/>
          </div>
        </div>

        {/* Moodboard */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
          <p className="section-label" style={{ margin:0 }}>Moodboard</p>
          <button className="btn-ghost" onClick={() => setAddingImage(true)}>+ Add image</button>
        </div>

        {addingImage && (
          <div className="add-row" style={{ marginBottom:16 }}>
            <div style={{ border:'1px dashed var(--border-med)', borderRadius:'var(--r-sm)', padding:'20px', textAlign:'center', marginBottom:12 }}>
              <p style={{ fontSize:12, color:'var(--ink-300)' }}>Click to upload or drag image here</p>
            </div>
            <div className="add-row-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
              <input autoFocus placeholder="Caption / description" value={newImage.caption} onChange={e=>setNewImage(p=>({...p,caption:e.target.value}))}/>
              <input placeholder="Source / vendor / reference" value={newImage.source} onChange={e=>setNewImage(p=>({...p,source:e.target.value}))}/>
            </div>
            <div className="add-row-actions">
              <button className="btn-primary" onClick={addImage}>Add to moodboard</button>
              <button className="btn-secondary" onClick={() => setAddingImage(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ columns:'3 240px', gap:12 }}>
          {images.map(img => (
            <div key={img.id} style={{ breakInside:'avoid', marginBottom:12, borderRadius:'var(--r-sm)', overflow:'hidden', border:'1px solid var(--border)', position:'relative' }}>
              <div style={{ background:img.color, height:img.h, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:11, color:'rgba(0,0,0,0.12)', textAlign:'center', padding:'0 20px' }}>Reference image</p>
              </div>
              <div style={{ padding:'8px 12px', background:'var(--surface)' }}>
                <p style={{ fontSize:12, color:'var(--ink-800)', lineHeight:1.45, marginBottom:2 }}>{img.caption}</p>
                {img.source && <p style={{ fontSize:10, color:'var(--ink-300)' }}>{img.source}</p>}
              </div>
              <button onClick={() => setImages(prev=>prev.filter(i=>i.id!==img.id))}
                style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.32)', color:'white', border:'none', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          ))}
          <div onClick={() => setAddingImage(true)} style={{ breakInside:'avoid', marginBottom:12, height:120, border:'1px dashed var(--border-med)', borderRadius:'var(--r-sm)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink-300)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-med)'}
          >
            <p style={{ fontSize:12, color:'var(--ink-300)', marginBottom:3 }}>+ Add image</p>
            <p style={{ fontSize:10, color:'var(--ink-200)' }}>JPG, PNG, PDF</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
