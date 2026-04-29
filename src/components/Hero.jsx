
import React, { useEffect, useState } from 'react'

const PULSE_WORDS = ['inconsistent', 'fragmented', 'unclear', 'conflicting', 'reactive']

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setWordIdx(i => (i + 1) % PULSE_WORDS.length); setFade(true) }, 300)
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '100px 2rem 4rem', maxWidth: 1300, margin: '0 auto',
    }}>
      <div style={{ maxWidth: 820 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)',
          borderRadius: 20, padding: '6px 14px', marginBottom: 32,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E30613', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#E30613', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Data Analytics &amp; BI Manager — Strategic Case Study
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 28 }}>
          Your DSR isn't{' '}
          <span style={{
            color: '#E30613', display: 'inline-block', minWidth: 180,
            opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease'
          }}>
            {PULSE_WORDS[wordIdx]}.
          </span>
          <br />
          It's <span style={{ color: '#E30613' }}>unmeasured.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#9CA3AF', lineHeight: 1.75, maxWidth: 640, marginBottom: 48 }}>
          Three departments pointing in different directions isn't a disagreement about root causes —
          it's the symptom of a missing unified operational intelligence layer.
          The HeartBeat Score framework brings one composite view to the entire last-mile network,
          from driver attempt to hub dispatch to merchant health, so leadership stops debating and starts deciding.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="#problem" style={{
            padding: '14px 28px', background: '#E30613', color: '#fff',
            borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none',
            border: 'none', cursor: 'pointer', letterSpacing: '-0.01em',
          }}>See the Problem Decomposition →</a>
          <a href="#dashboard" style={{
            padding: '14px 28px', background: 'transparent', color: '#E8EAF0',
            borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
          }}>Open Live Dashboard</a>
        </div>
      </div>

      <div style={{
        marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
        background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {[
          { num: '3', label: 'Conflicting department theories', sub: 'Unified under one framework' },
          { num: '15+', label: 'Operational KPIs tracked', sub: 'Across Stars, Hubs & Merchants' },
          { num: '1', label: 'Composite health score', sub: 'From driver to network level' },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '28px 32px', background: '#0D0F18' }}>
            <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#E30613', letterSpacing: '-0.04em' }}>{stat.num}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E8EAF0', marginTop: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}
