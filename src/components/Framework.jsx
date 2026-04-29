
import React, { useState } from 'react'

const PILLARS = [
  {
    id: 'stars', label: 'Stars', weight: 30, color: '#10B981', icon: '🚴',
    tagline: 'The last mile is only as strong as the person riding it.',
    kpis: [
      { name: 'ASR% — Attempt Success Rate', weight: 30, desc: 'Core driver output. % of OFD parcels successfully delivered on first attempt.', isNeg: false },
      { name: 'FDDS% — First Day Delivery', weight: 20, desc: 'Parcels delivered on the same day they first go OFD. Indicator of route quality.', isNeg: false },
      { name: 'OFD / Star', weight: 20, desc: 'Average daily parcel volume per driver per hub. Measures capacity utilization.', isNeg: false },
      { name: 'Fake Attempt Rate', weight: 10, desc: 'Attempts logged without genuine contact. High fake rate destroys DSR and customer trust.', isNeg: true },
      { name: 'CRP% — Customer Return Pickups', weight: 10, desc: '% of return pickup requests fulfilled. Measures reverse-logistics driver responsiveness.', isNeg: false },
      { name: 'CRE% — Customer Exchange Rate', weight: 10, desc: '% of exchange requests handled. Combines return + redelivery in one trip.', isNeg: false },
    ]
  },
  {
    id: 'hubs', label: 'Hubs', weight: 50, color: '#3B82F6', icon: '🏭',
    tagline: 'Operations fail at the hub long before they fail at the door.',
    kpis: [
      { name: 'Delivery Promised %', weight: 15, desc: 'Rate of delivery SLA fulfillment. Directly tied to customer expectation setting.', isNeg: false },
      { name: 'Backlog %', weight: 15, desc: 'Parcels not dispatched within cycle window. The single biggest DSR killer.', isNeg: true },
      { name: 'Lost Parcel %', weight: 15, desc: 'Parcels with no traceable status. Direct cost + NPS impact.', isNeg: true },
      { name: 'Damaged %', weight: 10, desc: 'Parcels returned or refused due to damage. Hub handling quality signal.', isNeg: true },
      { name: 'Same-Day Dispatch', weight: 10, desc: '% of received parcels dispatched on the same day. Hub throughput health.', isNeg: false },
      { name: 'Cycle Adaptation', weight: 10, desc: 'Hub ability to absorb volume spikes without backlog degradation.', isNeg: false },
      { name: 'Pending in Transit', weight: 10, desc: '% of parcels stuck in transit > expected window. Middle mile + hub accountability combined.', isNeg: true },
      { name: 'OFD % of Received', weight: 5, desc: 'Ratio of dispatched vs received. Quick health ratio.', isNeg: false },
    ]
  },
  {
    id: 'merchants', label: 'Merchants', weight: 20, color: '#F59E0B', icon: '🏪',
    tagline: "A merchant's DSR is the business outcome. Everything else is operational cause.",
    kpis: [
      { name: 'Per-Merchant DSR%', weight: 100, desc: 'The end-to-end delivery success rate per merchant. Drives revenue, re-attempts cost, and churn risk.', isNeg: false },
    ],
    tiers: [
      { label: 'Excellent', range: '> 80%', color: '#10B981' },
      { label: 'Very Good', range: '75–80%', color: '#34D399' },
      { label: 'Good', range: '70–75%', color: '#60A5FA' },
      { label: 'Default', range: '65–70%', color: '#F59E0B' },
      { label: 'Bad Business', range: '≤ 65%', color: '#EF4444' },
    ]
  },
]

export default function Framework() {
  const [activePillar, setActivePillar] = useState('hubs')

  const pillar = PILLARS.find(p => p.id === activePillar)

  return (
    <div style={{ minHeight: '100vh', padding: '100px 2rem', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#E30613', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 03</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
        The HeartBeat Score.<br /><span style={{ color: '#6B7280' }}>One number. Full context.</span>
      </h2>
      <p style={{ color: '#6B7280', fontSize: 15, maxWidth: 580, marginBottom: 56, lineHeight: 1.7 }}>
        A weighted composite of three operational OKRs. Each weight reflects accountability:
        hubs carry 50% because operational throughput is the highest leverage point in the chain.
      </p>

      {/* Pillar selector */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
        {PILLARS.map(p => (
          <button key={p.id} onClick={() => setActivePillar(p.id)}
            style={{
              flex: 1, padding: '20px 16px', borderRadius: 12, cursor: 'pointer',
              background: activePillar === p.id ? `rgba(${p.color === '#10B981' ? '16,185,129' : p.color === '#3B82F6' ? '59,130,246' : '245,158,11'},0.12)` : '#0D0F18',
              border: `1px solid ${activePillar === p.id ? p.color : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s', textAlign: 'left',
            }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>{p.weight}%</div>
          </button>
        ))}
      </div>

      {/* Active pillar KPIs */}
      {pillar && (
        <div style={{
          background: '#0D0F18', border: `1px solid ${pillar.color}22`,
          borderRadius: 16, padding: 32,
        }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 20, marginRight: 10 }}>{pillar.icon}</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{pillar.label} OKR</span>
            <span style={{ fontSize: 13, color: '#6B7280', display: 'block', marginTop: 6, fontStyle: 'italic' }}>{pillar.tagline}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {pillar.kpis.map((kpi, i) => (
              <div key={i} style={{
                background: '#13151F', border: `1px solid ${kpi.isNeg ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, padding: 18,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: kpi.isNeg ? '#EF4444' : pillar.color, lineHeight: 1.4, flex: 1 }}>{kpi.name}</span>
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, flexShrink: 0,
                    background: `rgba(${pillar.color === '#10B981' ? '16,185,129' : pillar.color === '#3B82F6' ? '59,130,246' : '245,158,11'},0.12)`,
                    color: pillar.color,
                  }}>wt: {kpi.weight}%</span>
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{kpi.desc}</p>
                {kpi.isNeg && <div style={{ marginTop: 8, fontSize: 10, color: '#EF4444', fontWeight: 700, letterSpacing: '0.06em' }}>↓ LOWER IS BETTER</div>}
              </div>
            ))}
          </div>

          {pillar.tiers && (
            <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Merchant DSR Tier Classification
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {pillar.tiers.map((tier, i) => (
                  <div key={i} style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: `rgba(${tier.color === '#10B981' ? '16,185,129' : tier.color === '#34D399' ? '52,211,153' : tier.color === '#60A5FA' ? '96,165,250' : tier.color === '#F59E0B' ? '245,158,11' : '239,68,68'},0.1)`,
                    border: `1px solid ${tier.color}44`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: tier.color }}>{tier.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{tier.range}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score formula */}
      <div style={{ marginTop: 40, background: 'rgba(227,6,19,0.05)', border: '1px solid rgba(227,6,19,0.15)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>HeartBeat Score Formula</div>
        <code style={{ fontSize: 15, color: '#E8EAF0', fontFamily: 'monospace' }}>
          HeartBeat = <span style={{ color: '#10B981' }}>Stars × 0.30</span> + <span style={{ color: '#3B82F6' }}>Hubs × 0.50</span> + <span style={{ color: '#F59E0B' }}>Merchants × 0.20</span>
        </code>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 12 }}>
          Weights are configurable per business cycle. Hubs hold majority weight (50%) as the highest leverage operational layer.
        </p>
      </div>
    </div>
  )
}
