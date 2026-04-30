import React, { useState, useEffect } from 'react'
import { T } from './theme'
import BostaLogo from '../assets/Bosta.svg'

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
      background: scrolled ? 'rgba(236,238,242,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border}` : 'none',
      transition: 'all 0.25s ease',
      padding: '0 2rem',
    }}>
      <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={BostaLogo} alt="Bosta" style={{ height: 28, display: 'block' }} />
          <div style={{ width: 1, height: 22, background: T.border }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: T.text, letterSpacing: '-0.02em' }}>
            <span style={{ color: T.red }}>HeartBeat</span> Score
          </span>
        </div>
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
