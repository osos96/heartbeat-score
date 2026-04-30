
import React, { useEffect, useState } from 'react'
import { T } from './theme'

const WORDS = ['inconsistent','fragmented','conflicting','reactive']

export default function Hero() {
  const [idx, setIdx] = useState(0)
  const [vis, setVis] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVis(false)
      setTimeout(() => { setIdx(i => (i+1) % WORDS.length); setVis(true) }, 260)
    }, 2400)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '100px 2rem 4rem', maxWidth: 1340, margin: '0 auto' }}>

      <div style={{ maxWidth: 860 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: T.redLight, border: `1px solid ${T.redBorder}`,
          borderRadius: 20, padding: '5px 14px', marginBottom: 36 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.red,
            animation: 'hbp 1.5s ease-in-out infinite' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
            Data Analytics &amp; BI Manager: Strategic Assessment
          </span>
        </div>

        {/* Headline with fixed-width animated word to prevent layout shift */}
        <h1 style={{ fontSize: 'clamp(2.4rem,5vw,3.8rem)', fontWeight: 900, lineHeight: 1.08,
          letterSpacing: '-0.03em', color: T.text, marginBottom: 28 }}>
          Your DSR isn't{' '}
          <span style={{ display: 'inline-block', width: '10ch', verticalAlign: 'bottom', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', color: T.red,
              opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.26s ease, transform 0.26s ease' }}>
              {WORDS[idx]}.
            </span>
          </span>
          <br/>It's <span style={{ color: T.red }}>unmeasured.</span>
        </h1>

        <p style={{ fontSize: 17, color: T.textSec, lineHeight: 1.8, maxWidth: 640, marginBottom: 44 }}>
          Three departments pointing in different directions is not a disagreement about root causes.
          It is the symptom of a missing unified operational intelligence layer. The HeartBeat Score
          framework provides one composite view of the entire last-mile network: from driver
          attempt quality to hub throughput to merchant delivery health.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a href="#business" style={{ padding: '13px 26px', background: T.red, color: '#fff',
            borderRadius: 8, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em',
            textDecoration: 'none' }}>
            Understand the Business →
          </a>
          <a href="#dashboard" style={{ padding: '13px 26px', background: T.card, color: T.textSec,
            borderRadius: 8, fontWeight: 600, fontSize: 14,
            border: `1px solid ${T.border}`, boxShadow: T.shadow, textDecoration: 'none' }}>
            Open Live Dashboard
          </a>
        </div>
      </div>

      <style>{`@keyframes hbp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}`}</style>
    </div>
  )
}
