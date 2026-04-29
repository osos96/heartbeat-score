
import React, { useState, useEffect } from 'react'
import { T } from './theme'

const SECTIONS = [
  { id: 'hero',         label: 'Overview' },
  { id: 'business',    label: 'Business Model' },
  { id: 'problem',     label: 'Problem' },
  { id: 'architecture',label: 'Architecture' },
  { id: 'framework',   label: 'Framework' },
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'roadmap',     label: 'Roadmap' },
]

export default function Nav() {
  const [active, setActive] = useState('hero')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && window.scrollY >= el.offsetTop - 130) { setActive(s.id); break }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(248,250,252,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border}` : 'none',
      transition: 'all 0.25s ease',
      padding: '0 2rem',
    }}>
      <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 26 26" width="26" height="26" fill="none">
            <circle cx="13" cy="13" r="12" stroke={T.red} strokeWidth="1.5"/>
            <polyline points="3,13 8,13 10,7 13,19 16,10 18,13 23,13"
              stroke={T.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: '-0.02em' }}>
            Bosta <span style={{ color: T.red }}>HeartBeat</span>
          </span>
        </div>
        {/* Links */}
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActive(s.id)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                color: active === s.id ? T.red : T.textSec,
                background: active === s.id ? T.redLight : 'transparent',
                border: active === s.id ? `1px solid ${T.redBorder}` : '1px solid transparent',
                transition: 'all 0.15s',
              }}>{s.label}</a>
          ))}
        </div>
      </div>
    </nav>
  )
}
