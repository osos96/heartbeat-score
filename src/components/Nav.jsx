
import React, { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'hero', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'architecture', label: 'Data Architecture' },
  { id: 'framework', label: 'Framework' },
  { id: 'dashboard', label: 'Live Dashboard' },
  { id: 'roadmap', label: 'Roadmap' },
]

export default function Nav() {
  const [active, setActive] = useState('hero')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(s.id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(8,9,14,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(227,6,19,0.15)' : 'none',
      transition: 'all 0.3s ease',
      padding: '0 2rem',
    }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, position: 'relative' }}>
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" stroke="#E30613" strokeWidth="1.5" />
              <polyline points="4,14 9,14 11,8 14,20 17,11 19,14 24,14" stroke="#E30613" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#fff' }}>
            Bosta <span style={{ color: '#E30613' }}>HeartBeat</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                color: active === s.id ? '#fff' : '#9CA3AF',
                background: active === s.id ? 'rgba(227,6,19,0.15)' : 'transparent',
                border: active === s.id ? '1px solid rgba(227,6,19,0.3)' : '1px solid transparent',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >{s.label}</a>
          ))}
        </div>
      </div>
    </nav>
  )
}
