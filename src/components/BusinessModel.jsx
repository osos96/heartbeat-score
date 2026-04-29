
import React, { useState } from 'react'
import { T } from './theme'

const SectionLabel = ({ n, children }) => (
  <div style={{ marginBottom: 10 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      Section 01: {n}
    </span>
  </div>
)

const Tag = ({ children, color }) => (
  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px',
    borderRadius: 4, background: color ? `${color}12` : T.borderSub,
    color: color || T.textSec, border: `1px solid ${color ? color+'30' : T.border}`,
    marginRight: 6, marginBottom: 4 }}>
    {children}
  </span>
)

const STAGES_FWD = [
  {
    id: 'merchant', label: 'Merchant', step: '01',
    desc: 'E-commerce seller places a shipment order via Bosta API or dashboard. Parcel is prepared for pickup.',
    teams: ['Merchant Success', 'Product / API'],
    kpis: ['Order volume', 'Address completeness rate', 'API integration health'],
    data: ['MongoDB: merchant_orders (order_id, address, COD, weight, merchant_id)', 'Redshift: dim_merchants'],
  },
  {
    id: 'firstmile', label: 'First Mile', step: '02',
    desc: 'Bosta courier picks up the parcel from the merchant. Parcel is scanned and inducted into the network.',
    teams: ['First Mile Operations', 'Field Coordinators'],
    kpis: ['Pickup SLA compliance', 'Scan rate at pickup', 'Volume per courier'],
    data: ['MongoDB: pickup_events (scan_time, courier_id, parcel_id)', 'MongoDB: first_mile_assignments'],
  },
  {
    id: 'sorting', label: 'Sorting Facility', step: '03',
    desc: 'Parcels are sorted by destination zone and routed to the appropriate shipping hub. Middle-mile accountability point.',
    teams: ['Sorting / Middle Mile Ops', 'Logistics Planning'],
    kpis: ['Sort accuracy', 'Throughput rate', 'Middle-mile leakage (parcels with no hub receipt)'],
    data: ['MongoDB: sort_events (sort_time, destination_hub, conveyor_id)', 'MongoDB: routing_table'],
  },
  {
    id: 'hub', label: 'Shipping Hub', step: '04',
    desc: 'Hub receives sorted parcels, assigns to Stars (drivers), and dispatches OFD (Out for Delivery) runs.',
    teams: ['Hub Operations Managers', 'Dispatch Coordinators', 'Logistics Planning'],
    kpis: ['Hub receipt scan', 'Same-day dispatch rate', 'Backlog %', 'OFD list accuracy', 'Delivery Promised %'],
    data: ['MongoDB: hub_receipts (received_at, hub_id, parcel_id)', 'MongoDB: dispatch_events', 'Redshift: agg_hub_daily'],
  },
  {
    id: 'star', label: 'Star (Driver)', step: '05',
    desc: 'Driver goes out for delivery. Attempts delivery at customer location. Success or failure logged with GPS and timestamp.',
    teams: ['Field Operations', 'Driver Management', 'Fleet Management'],
    kpis: ['ASR% (Attempt Success Rate)', 'FDDS% (First Day Delivery)', 'OFD/Star', 'Fake Attempt Rate', 'GPS coverage'],
    data: ['MongoDB: delivery_attempts (driver_id, gps_lat, gps_lng, outcome, attempt_time, reason_code)'],
  },
  {
    id: 'customer', label: 'Customer', step: '06',
    desc: 'Delivery is accepted → DSR +1. Refusal or absence triggers re-attempt or RTO after max attempt threshold.',
    teams: ['Customer Service', 'Product (notifications)', 'Merchant Success'],
    kpis: ['DSR% (Delivery Success Rate)', 'Customer contact rate', 'Re-attempt rate', 'RTO rate'],
    data: ['MongoDB: delivery_status (final_outcome, delivered_at)', 'CS call logs (parcel_id, reason)', 'Redshift: fact_deliveries'],
  },
]

const RTO_STAGES = [
  { label: 'Customer refuses / max attempts reached', team: 'Star + CS' },
  { label: 'Star returns parcel to Shipping Hub', team: 'Hub Ops' },
  { label: 'Hub logs RTO scan, routes to Sorting', team: 'Hub Ops' },
  { label: 'Sorting routes to First Mile origin', team: 'Middle Mile' },
  { label: 'First Mile delivers back to Merchant', team: 'First Mile' },
  { label: 'Merchant receives RTO — net cost incurred', team: 'Merchant Success' },
]

export default function BusinessModel() {
  const [active, setActive] = useState('hub')

  const stage = STAGES_FWD.find(s => s.id === active)

  return (
    <div style={{ padding: '100px 2rem 80px', maxWidth: 1340, margin: '0 auto' }}>

      {/* ── What is Bosta ── */}
      <SectionLabel n="Business Model" />
      <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginBottom: 14 }}>
        What does Bosta do?
      </h2>
      <p style={{ fontSize: 16, color: T.textSec, lineHeight: 1.8, maxWidth: 700, marginBottom: 48 }}>
        Bosta is a B2B logistics-tech company that provides last-mile delivery infrastructure for
        e-commerce merchants across Egypt and MENA. Merchants integrate via API or dashboard to fulfil
        customer orders. Bosta owns the physical delivery cycle end-to-end — pickup, sort, dispatch, deliver.
      </p>

      {/* Revenue model cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 72 }}>
        {[
          { title: 'Revenue Model', body: 'Per-shipment fee. Contractual SLA defines DSR floor. Below-SLA performance risks merchant churn and contract renegotiation.' },
          { title: 'Why Operations is the Spine', body: 'Every failed delivery = re-attempt cost + RTO logistics cost + merchant compensation risk. Margin in logistics is thin — operational efficiency is the entire P&L lever.' },
          { title: 'Why Data is the Only Scale Path', body: 'Manual ops reviews cannot catch hub-level failures before they cascade. Real-time KPI visibility is the difference between reactive fire-fighting and proactive management.' },
        ].map((c,i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: T.shadow }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{c.title}</div>
            <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.75 }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* ── Forward Journey ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Forward Delivery Cycle</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 6 }}>Merchant → First Mile → Sorting → Hub → Star → Customer</h3>
        <p style={{ fontSize: 14, color: T.textSec, marginBottom: 28 }}>
          Click each stage to see the teams involved, KPIs tracked, and data sources that feed the HeartBeat framework.
        </p>
      </div>

      {/* Stage selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STAGES_FWD.map((s, i) => (
          <React.Fragment key={s.id}>
            <button onClick={() => setActive(s.id)} style={{
              padding: '10px 18px', border: `1px solid ${active===s.id ? T.red : T.border}`,
              background: active===s.id ? T.redLight : T.card,
              color: active===s.id ? T.red : T.textSec,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 8,
              whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, color: active===s.id ? T.red : T.textMuted, display: 'block', marginBottom: 2 }}>{s.step}</span>
              {s.label}
            </button>
            {i < STAGES_FWD.length-1 && (
              <svg width="28" height="16" viewBox="0 0 28 16" style={{ flexShrink: 0, margin: '0 -1px' }}>
                <path d="M0 8 L18 8 M14 4 L22 8 L14 12" stroke={T.border} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage detail panel */}
      {stage && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 64,
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, boxShadow: T.shadow }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Stage Description</div>
            <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.75, marginBottom: 16 }}>{stage.desc}</p>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Teams & Stakeholders</div>
            {stage.teams.map((t,i) => <Tag key={i}>{t}</Tag>)}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>KPIs / OKRs at this Stage</div>
            {stage.kpis.map((k,i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 9, alignItems: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.red, marginTop: 5, flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{k}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Data Sources</div>
            {stage.data.map((d,i) => (
              <div key={i} style={{ background: T.borderSub, borderRadius: 6, padding: '8px 12px', marginBottom: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.mono, fontFamily: 'monospace', lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RTO Reverse Journey ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Reverse Cycle — Return to Origin (RTO)</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 6 }}>Customer → Hub → Sorting → First Mile → Merchant</h3>
        <p style={{ fontSize: 14, color: T.textSec, marginBottom: 28 }}>
          Every RTO represents a full double-cost event: the original delivery attempt cost plus the full reverse logistics cost,
          with zero revenue collected. RTO reduction is the highest ROI operational lever in the business.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 56,
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.shadow }}>
        {RTO_STAGES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
            borderBottom: i < RTO_STAGES.length-1 ? `1px solid ${T.border}` : 'none',
            background: i === 0 ? T.redLight : 'transparent' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: i===0 ? T.red : T.borderSub,
              color: i===0 ? '#fff' : T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{RTO_STAGES.length - i}</div>
            <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12, color: T.textMuted, background: T.borderSub, padding: '3px 10px', borderRadius: 20,
              border: `1px solid ${T.border}`, fontWeight: 600 }}>{s.team}</span>
          </div>
        ))}
      </div>

      {/* Business spine summary */}
      <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 8 }}>Why every metric in this framework ultimately points back to Operations</div>
        <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.75, maxWidth: 860 }}>
          Product's address accuracy issue surfaces as a failed attempt at the Star stage.
          Customer Service's missed-window calls originate at the Hub dispatch stage.
          Operations' route inefficiency is a symptom of Hub backlog and OFD list mismanagement.
          All three point to the same root: the lack of a real-time, unified operational intelligence layer
          that tracks the health of every stage from pickup to doorstep.
        </p>
      </div>
    </div>
  )
}
