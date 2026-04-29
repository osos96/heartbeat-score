
import React, { useEffect, useState } from 'react'

const PULSE_WORDS = ['inconsistent','fragmented','unmeasured','conflicting','reactive']

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setWordIdx(i => (i+1) % PULSE_WORDS.length); setVisible(true) }, 280)
    }, 2400)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'100px 2rem 4rem', maxWidth:1300, margin:'0 auto' }}>
      <div style={{ maxWidth:820 }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(227,6,19,0.07)', border:'1px solid rgba(227,6,19,0.2)', borderRadius:20, padding:'5px 14px', marginBottom:32 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#E30613', animation:'hbpulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#E30613', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Data Analytics &amp; BI Manager — Strategic Case Study
          </span>
        </div>

        {/* Fixed-height heading block: the animated word sits in a reserved inline-block */}
        <h1 style={{ fontSize:'clamp(2.2rem,4.5vw,3.6rem)', fontWeight:900, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:28 }}>
          Your DSR isn't{' '}
          {/* The reserved container: width fixed to the longest word, height = one line */}
          <span style={{
            display:'inline-block',
            width:'9ch',               /* longest word is ~13 chars but we clip to 1 line */
            verticalAlign:'bottom',
            overflow:'hidden',
            whiteSpace:'nowrap',
          }}>
            <span style={{
              display:'inline-block',
              color:'#E30613',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(6px)',
              transition:'opacity 0.28s ease, transform 0.28s ease',
            }}>
              {PULSE_WORDS[wordIdx]}.
            </span>
          </span>
          <br />
          It's <span style={{ color:'#E30613' }}>unmeasured.</span>
        </h1>

        <p style={{ fontSize:16, color:'#6B7280', lineHeight:1.8, maxWidth:620, marginBottom:48 }}>
          Three departments pointing in different directions isn't a disagreement about root causes —
          it's the symptom of a missing unified operational intelligence layer.
          The HeartBeat Score framework resolves this: one composite view of the entire last-mile network,
          from driver attempt quality to hub throughput to merchant delivery health.
        </p>

        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <a href="#problem" style={{ padding:'13px 26px', background:'#E30613', color:'#fff', borderRadius:8, fontWeight:700, fontSize:14, textDecoration:'none', letterSpacing:'-0.01em' }}>
            View Problem Decomposition →
          </a>
          <a href="#dashboard" style={{ padding:'13px 26px', background:'transparent', color:'#9CA3AF', borderRadius:8, fontWeight:600, fontSize:14, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
            Open Live Dashboard
          </a>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ marginTop:72, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(255,255,255,0.05)', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
        {[
          { num:'3', label:'Conflicting department theories', sub:'Unified under one framework' },
          { num:'15+', label:'Operational KPIs tracked', sub:'Across Stars, Hubs & Merchants' },
          { num:'1', label:'Composite health score', sub:'Network to hub level granularity' },
        ].map((s,i) => (
          <div key={i} style={{ padding:'26px 30px', background:'#0D0F18' }}>
            <div style={{ fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:900, color:'#E30613', letterSpacing:'-0.04em' }}>{s.num}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#E8EAF0', marginTop:6 }}>{s.label}</div>
            <div style={{ fontSize:11, color:'#4B5563', marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes hbpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }`}</style>
    </div>
  )
}
