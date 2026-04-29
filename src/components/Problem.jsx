
import React, { useState } from 'react'

const FLOW_NODES = [
  { id: 'merchant', label: 'Merchant', icon: '🏪', color: '#6366F1', desc: 'Order placed, parcel handed off' },
  { id: 'firstmile', label: 'First Mile', icon: '📦', color: '#8B5CF6', desc: 'Pickup & intake at origin hub' },
  { id: 'sorting', label: 'Sorting Facility', icon: '⚙️', color: '#F59E0B', desc: 'Sort, route, dispatch to shipping hub' },
  { id: 'hub', label: 'Shipping Hub', icon: '🏭', color: '#3B82F6', desc: 'Last-mile staging & star assignment' },
  { id: 'star', label: 'Star (Driver)', icon: '🚴', color: '#10B981', desc: 'OFD → Attempt → Deliver or fail' },
  { id: 'customer', label: 'Customer', icon: '👤', color: '#E30613', desc: 'Delivery success or RTO trigger' },
]

const DRIVER_TREE = {
  label: 'DSR (Company)', color: '#E30613',
  children: [
    {
      label: 'Stars OKR (30%)', color: '#10B981',
      children: [
        { label: 'ASR% — Attempt Success Rate', color: '#10B981', weight: '30%' },
        { label: 'FDDS% — First Day Delivery', color: '#10B981', weight: '20%' },
        { label: 'OFD/Star — Volume per Driver', color: '#10B981', weight: '20%' },
        { label: 'Fake Attempt Rate ↓', color: '#EF4444', weight: '10%' },
        { label: 'CRP% — Return Pickups', color: '#10B981', weight: '10%' },
        { label: 'CRE% — Exchange Rate', color: '#10B981', weight: '10%' },
      ]
    },
    {
      label: 'Hubs OKR (50%)', color: '#3B82F6',
      children: [
        { label: 'Delivery Promised %', color: '#3B82F6', weight: '15%' },
        { label: 'Backlog % ↓', color: '#EF4444', weight: '15%' },
        { label: 'Lost Parcels % ↓', color: '#EF4444', weight: '15%' },
        { label: 'Damaged % ↓', color: '#EF4444', weight: '10%' },
        { label: 'Same-Day Dispatch', color: '#3B82F6', weight: '10%' },
        { label: 'Cycle Adaptation', color: '#3B82F6', weight: '10%' },
      ]
    },
    {
      label: 'Merchants OKR (20%)', color: '#F59E0B',
      children: [
        { label: 'Per-Merchant DSR%', color: '#F59E0B', weight: '100%' },
        { label: 'Merchant Tier: Bad ≤65%', color: '#EF4444', weight: '' },
        { label: 'Default 65–70%', color: '#F59E0B', weight: '' },
        { label: 'Excellent >80%', color: '#10B981', weight: '' },
      ]
    }
  ]
}

const THEORIES = [
  { dept: 'Operations', theory: 'Inefficient route planning & driver performance', icon: '🚴', resolution: 'Stars OKR: ASR%, FDDS%, Fake Attempt metrics directly measure this.', color: '#3B82F6' },
  { dept: 'Product', theory: 'Address accuracy issues at checkout', icon: '📍', resolution: 'Address failures surface as failed attempts → backlog → RTO. Visible in Hubs OKR backlog and Stars ASR%.', color: '#6366F1' },
  { dept: 'Customer Service', theory: 'Unclear delivery status & missed windows', icon: '📞', resolution: 'Delivery Promised % and Cycle Adaptation in Hubs OKR directly track SLA adherence and communication gaps.', color: '#F59E0B' },
]

export default function Problem() {
  const [activeTheory, setActiveTheory] = useState(null)
  const [activeNode, setActiveNode] = useState(null)

  return (
    <div style={{ minHeight: '100vh', padding: '100px 2rem', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#E30613', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 01</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
        One problem.<br /><span style={{ color: '#6B7280' }}>Three labels for the same gap.</span>
      </h2>
      <p style={{ color: '#6B7280', fontSize: 15, maxWidth: 580, marginBottom: 64, lineHeight: 1.7 }}>
        Operations, Product, and Customer Service aren't disagreeing — they're each describing a different facet of the same missing layer: real-time operational visibility across the full delivery chain.
      </p>

      {/* Department theories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 64 }}>
        {THEORIES.map((t, i) => (
          <div key={i}
            onClick={() => setActiveTheory(activeTheory === i ? null : i)}
            style={{
              background: activeTheory === i ? `rgba(${t.color === '#3B82F6' ? '59,130,246' : t.color === '#6366F1' ? '99,102,241' : '245,158,11'},0.1)` : '#0D0F18',
              border: `1px solid ${activeTheory === i ? t.color : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: 24, cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t.dept}</div>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: activeTheory === i ? 16 : 0 }}>{t.theory}</p>
            {activeTheory === i && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>HeartBeat Resolution</div>
                <p style={{ fontSize: 13, color: '#D1FAE5', lineHeight: 1.6 }}>{t.resolution}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delivery flow */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          Last-Mile Delivery Chain (click any node)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {FLOW_NODES.map((node, i) => (
            <React.Fragment key={node.id}>
              <div
                onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: activeNode === node.id ? `rgba(227,6,19,0.12)` : '#0D0F18',
                  border: `1px solid ${activeNode === node.id ? '#E30613' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, padding: '18px 20px', cursor: 'pointer', minWidth: 130,
                  transition: 'all 0.2s', flex: '1 1 0',
                }}>
                <div style={{ fontSize: 26 }}>{node.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: node.color, textAlign: 'center' }}>{node.label}</div>
                {activeNode === node.id && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5 }}>{node.desc}</div>
                )}
              </div>
              {i < FLOW_NODES.length - 1 && (
                <div style={{ color: '#374151', fontSize: 20, padding: '0 4px', flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#EF4444', fontSize: 12 }}>
          <span>↩</span>
          <span style={{ color: '#6B7280' }}>RTO: Customer → Hub → Sorting → First Mile → Merchant (reverse chain on failed delivery)</span>
        </div>
      </div>

      {/* DSR Driver Tree */}
      <div style={{ marginTop: 64 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 32 }}>
          DSR Driver Tree — HeartBeat Decomposition
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Root */}
          <div style={{
            background: 'rgba(227,6,19,0.12)', border: '2px solid #E30613',
            borderRadius: 10, padding: '12px 32px', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 32,
          }}>DSR — Delivery Success Rate</div>

          {/* Three pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, width: '100%' }}>
            {DRIVER_TREE.children.map((pillar, pi) => (
              <div key={pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: `rgba(${pi===0?'16,185,129':pi===1?'59,130,246':'245,158,11'},0.1)`,
                  border: `1px solid ${pillar.color}`,
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14,
                  color: pillar.color, marginBottom: 16, textAlign: 'center', width: '100%',
                }}>{pillar.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {pillar.children.map((kpi, ki) => (
                    <div key={ki} style={{
                      background: '#0D0F18', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8, padding: '8px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, color: kpi.color, fontWeight: 500 }}>{kpi.label}</span>
                      {kpi.weight && <span style={{ fontSize: 11, color: '#4B5563', fontWeight: 700 }}>{kpi.weight}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
