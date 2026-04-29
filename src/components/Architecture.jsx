
import React, { useState } from 'react'

const LAYERS = [
  {
    id: 'mongo', label: 'MongoDB', sublabel: 'Operational Event Store', color: '#10B981',
    icon: '🍃',
    items: [
      { name: 'parcel_events', desc: 'Scan timestamps, status transitions per parcel' },
      { name: 'delivery_attempts', desc: 'Driver ID, GPS coords, outcome, timestamp' },
      { name: 'driver_assignments', desc: 'Star → hub → route → OFD list' },
      { name: 'customer_requests', desc: 'CRP / CRE events, contact logs' },
      { name: 'merchant_orders', desc: 'Order metadata, address, merchant ID' },
    ]
  },
  {
    id: 'etl', label: 'ETL / ELT Pipeline', sublabel: 'Transform & Load Layer', color: '#F59E0B',
    icon: '⚡',
    items: [
      { name: 'Event Stream', desc: 'CDC (Change Data Capture) from MongoDB via Debezium or Fivetran' },
      { name: 'Aggregation Jobs', desc: 'Daily/hourly rollups: hub metrics, star scores, merchant DSR' },
      { name: 'Data Quality', desc: 'Null checks, duplicate deduplication, address normalization' },
      { name: 'Schema Registry', desc: 'Ensures backward-compatible schema evolution' },
    ]
  },
  {
    id: 'redshift', label: 'Amazon Redshift', sublabel: 'Analytics Data Warehouse', color: '#3B82F6',
    icon: '🔷',
    items: [
      { name: 'fact_deliveries', desc: 'One row per attempt: outcome, timings, driver, hub, merchant' },
      { name: 'dim_hubs', desc: 'Hub metadata: city, zone, capacity, shift schedule' },
      { name: 'dim_stars', desc: 'Driver profile, hub assignment, tenure, vehicle type' },
      { name: 'dim_merchants', desc: 'Merchant ID, tier, historical DSR, volume category' },
      { name: 'agg_heartbeat_daily', desc: 'Pre-computed HeartBeat scores per hub per day' },
    ]
  },
  {
    id: 'bi', label: 'HeartBeat BI Layer', sublabel: 'Intelligence & Decision Layer', color: '#E30613',
    icon: '💓',
    items: [
      { name: 'HeartBeat Score', desc: 'Composite OKR: Stars 30% + Hubs 50% + Merchants 20%' },
      { name: 'Executive Dashboard', desc: 'Network-level PULSE, city drill-down, period comparison' },
      { name: 'Ops Command View', desc: 'Hub-level KPIs, backlog alerts, dispatch SLA tracking' },
      { name: 'Merchant Portal', desc: 'Per-merchant DSR, tier badge, improvement recommendations' },
      { name: 'Alert Engine', desc: 'Threshold-based alerts → ops team Slack / email' },
    ]
  },
]

export default function Architecture() {
  const [active, setActive] = useState(null)

  return (
    <div style={{ minHeight: '100vh', padding: '100px 2rem', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#E30613', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 02</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
        The data architecture.<br /><span style={{ color: '#6B7280' }}>From raw event to executive decision.</span>
      </h2>
      <p style={{ color: '#6B7280', fontSize: 15, maxWidth: 580, marginBottom: 64, lineHeight: 1.7 }}>
        Bosta already runs MongoDB for operational events and Redshift as the analytical warehouse.
        The HeartBeat framework sits as a BI layer on top - no rip-and-replace, just intelligent aggregation.
        Click any layer to explore what lives there.
      </p>

      {/* Pipeline flow */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 48, overflowX: 'auto' }}>
        {LAYERS.map((layer, i) => (
          <React.Fragment key={layer.id}>
            <div
              onClick={() => setActive(active === layer.id ? null : layer.id)}
              style={{
                flex: '1 1 0', minWidth: 200, background: active === layer.id ? `rgba(${
                  layer.color === '#10B981' ? '16,185,129' :
                  layer.color === '#F59E0B' ? '245,158,11' :
                  layer.color === '#3B82F6' ? '59,130,246' : '227,6,19'
                },0.1)` : '#0D0F18',
                border: `1px solid ${active === layer.id ? layer.color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: 24, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{layer.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: layer.color, marginBottom: 4 }}>{layer.label}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: active === layer.id ? 20 : 0 }}>{layer.sublabel}</div>
              {active === layer.id && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
                  {layer.items.map((item, j) => (
                    <div key={j} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#E8EAF0', fontFamily: 'monospace' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, marginTop: 2 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {i < LAYERS.length - 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '0 8px', color: '#374151', fontSize: 22, flexShrink: 0,
              }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Key assumptions callout */}
      <div style={{
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 12, padding: 28, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Existing Stack</div>
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>MongoDB already captures every parcel event. Redshift already stores historical data. No greenfield infrastructure required.</p>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Middle-Mile Visibility</div>
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Parcels not marked "received at hub" are tracked as Middle Mile leakage - excluded from hub KPIs but surfaced as a % metric to avoid penalizing hubs for upstream failures.</p>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Latency Target</div>
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Ops-facing metrics refresh every 30 min via streaming aggregation. Executive HeartBeat Score computed daily with T-1 availability in Redshift.</p>
        </div>
      </div>
    </div>
  )
}
