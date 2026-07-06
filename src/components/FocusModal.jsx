import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function FocusModal({ onClose, width = '76vw', maxWidth = '1100px', children }) {
  useEffect(() => {
    const handle = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:400,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(26,25,22,0.48)',
        backdropFilter:'blur(2px)',
        padding:'32px 24px',
      }}
    >
      <motion.div
        initial={{ opacity:0, y:16, scale:0.98 }}
        animate={{ opacity:1, y:0,  scale:1    }}
        exit={{    opacity:0, y:10, scale:0.98  }}
        transition={{ duration:0.22, ease:[0.25,1,0.5,1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width, maxWidth,
          maxHeight:'88vh',
          background:'var(--surface)',
          borderRadius:6,
          border:'1px solid var(--border-med)',
          boxShadow:'0 32px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)',
          display:'flex', flexDirection:'column',
          overflow:'hidden',
          fontFamily:'var(--font)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
