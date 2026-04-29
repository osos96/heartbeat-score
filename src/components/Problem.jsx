
import React, { useState } from 'react'
import { T } from './theme'

const DSR_DRIVERS = [
  { label: 'Attempt Success Rate (ASR%)', sub: 'Did delivery succeed when attempted?', weight: 'Primary', direct: true,
    drivers: ['Customer reachability', 'Address accuracy & GPS match', 'Driver navigation capability'] },
  { label: 'First Day Delivery Rate (FDDS%)', sub: 'Delivered on first OFD cycle?', weight: 'Primary', direct: true,
    drivers: ['Hub same-day dispatch rate', 'OFD list size vs capacity', 'Route optimisation'] },
  { label: 'Hub Backlog Rate', sub: 'Parcels not dispatched on time', weight: 'Direct', direct: true,
    drivers: ['Receiving volume vs capacity', 'Dispatch coordination', 'Star availability'] },
  { label: 'Delivery Promised %', sub: 'Delivered within SLA window?', weight: 'Direct', direct: true,
    drivers: ['Hub dispatch timing', 'Route planning accuracy', 'Promised window realism'] },
  { label: 'Fake Attempt Rate', sub: 'Logged attempts with no real contact', weight: 'Direct (negative)', direct: true,
    drivers: ['Driver accountability', 'GPS validation coverage', 'Incentive structure'] },
  { label: 'Address Accuracy Rate', sub: 'Address successfully resolved by Star', weight: 'Direct', direct: true,
    drivers: ['Checkout validation (Product)', 'Merchant data quality', 'Address normalisation'] },
]

const HB_ONLY = [
  { label: 'CRP% — Customer Return Pickups', reason: 'Reverse logistics efficiency — affects cost, not delivery success rate' },
  { label: 'CRE% — Customer Exchange Rate', reason: 'Post-delivery value — separate KPI stream from delivery success' },
  { label: 'Lost / Damaged %', reason: 'Asset quality KPIs — they nullify deliveries but are tracked separately as hub operational health' },
  { label: 'OFD / Star', reason: 'Capacity utilisation metric — input indicator, not direct DSR output' },
  { label: 'Cycle Adaptation', reason: 'Operational resilience metric — contributes to HeartBeat context, not DSR formula' },
]

const THEORIES = [
  {
    id: 'ops', dept: 'Operations', claim: 'Inefficient route planning and driver performance',
    verdict: 'Partially correct. Driver performance (ASR, FDDS, Fake Attempt Rate) is a direct DSR driver. Route inefficiency is a hub-level problem, not solely a driver problem.',
    project: {
      title: 'Project: Star Performance Accountability Framework',
      goal: 'Identify underperforming Stars by hub and route, eliminate fake attempts, improve FDDS through better OFD list sizing.',
      kpis: ['ASR% per Star', 'Fake Attempt Rate', 'FDDS%', 'OFD/Star vs Hub average'],
      steps: ['Pull Star-level ASR from delivery_attempts (Week 1)', 'Correlate fake attempt GPS anomalies with delivery_attempts.gps_lat/lng (Week 2)', 'Build Star performance scorecard in HeartBeat (Week 3)', 'Present findings to Field Ops Manager, agree intervention plan (Week 4)'],
      stakeholders: ['VP Operations', 'Field Operations Manager', 'Driver Management', 'HR (training)'],
      team: ['Analyst 1: SQL analysis of delivery_attempts', 'Analyst 2: Scorecard build & visualisation', 'DE: GPS validation pipeline from MongoDB'],
    }
  },
  {
    id: 'product', dept: 'Product', claim: 'Accuracy of customer addresses entered at checkout',
    verdict: 'Correct and underweighted. Address failures create ASR misses that are logged as driver failures, masking the true root cause in checkout data quality.',
    project: {
      title: 'Project: Address Quality Normalisation Initiative',
      goal: 'Quantify what % of failed delivery_attempts correlate to address-mismatch vs genuine customer absence. Drive checkout-level improvement.',
      kpis: ['Address match rate (GPS vs expected)', 'Failed attempt reason_code distribution', 'Re-attempt rate by merchant'],
      steps: ['Cluster failed attempts by reason_code "address_not_found" vs "customer_absent" (Week 1)', 'Join with merchant_orders.address to calculate normalisation gap (Week 2)', 'Segment by merchant — identify merchants with >20% address failure rate (Week 3)', 'Product team review: checkout validation A/B test proposal (Week 4)'],
      stakeholders: ['Product Manager', 'Merchant Success Lead', 'VP Operations', 'Data Team'],
      team: ['Analyst 1: Geospatial clustering of failed attempt coordinates', 'Analyst 3: Merchant-level address quality report', 'DE: address normalisation enrichment in staging layer'],
    }
  },
  {
    id: 'cs', dept: 'Customer Service', claim: 'High call volume from unclear delivery status and missed windows',
    verdict: 'Correct symptom, wrong root. CS call volume is the lagging indicator. The leading cause is Hub-level Delivery Promised% failure — parcels dispatched too late to hit their window.',
    project: {
      title: 'Project: Delivery Window Accuracy & Proactive Notification',
      goal: 'Map CS call spikes to specific hubs and dispatch timing failures. Fix hub SLA setting and enable proactive customer notifications to reduce inbound calls.',
      kpis: ['Delivery Promised %', 'CS call rate per parcel', 'Same-day dispatch rate', 'Promised window vs actual delivery time delta'],
      steps: ['Join CS call logs with fact_deliveries on parcel_id (Week 1)', 'Identify top 5 hubs generating disproportionate CS calls (Week 2)', 'Root cause: late dispatch vs incorrect window promise vs customer phone issues (Week 3)', 'Cross-functional review with CS Director + VP Ops: agree notification playbook (Week 4)'],
      stakeholders: ['CS Director', 'VP Operations', 'Product (notification system)', 'Hub Managers'],
      team: ['Analyst 2: CS call log join + hub attribution analysis', 'Analyst 1: Dispatch timing correlation study', 'Analyst 3: Weekly CS spike report automation'],
    }
  },
]

export default function Problem() {
  const [activeT, setActiveT] = useState('ops')
  const theory = THEORIES.find(t => t.id === activeT)

  return (
    <div style={{ padding: '100px 2rem 80px', maxWidth: 1340, margin: '0 auto' }}>

      {/* Objective */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 02 — Problem Statement</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginBottom: 14 }}>
        One objective. Three perspectives on the same gap.
      </h2>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, marginBottom: 60, boxShadow: T.shadow, maxWidth: 860 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Project Objective</div>
        <p style={{ fontSize: 16, color: T.text, lineHeight: 1.75, fontWeight: 500 }}>
          Diagnose the root causes of Bosta's inconsistent Delivery Success Rate (DSR), build a unified
          data framework (HeartBeat Score) that gives leadership a real-time composite view of last-mile
          operational health, and drive measurable DSR improvement within 90 days.
        </p>
      </div>

      {/* Three department theories */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Three Department Theories — with Example Intervention Projects</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {THEORIES.map(t => (
          <button key={t.id} onClick={() => setActiveT(t.id)} style={{
            padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            background: activeT===t.id ? T.redLight : T.card,
            border: `1px solid ${activeT===t.id ? T.red : T.border}`,
            color: activeT===t.id ? T.red : T.textSec, transition: 'all 0.15s',
          }}>{t.dept}</button>
        ))}
      </div>

      {theory && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, marginBottom: 64, boxShadow: T.shadow }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 6 }}>{theory.dept} Theory</div>
          <p style={{ fontSize: 14, color: T.textSec, fontStyle: 'italic', marginBottom: 12 }}>"{theory.claim}"</p>
          <div style={{ background: T.borderSub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Verdict: </span>
            <span style={{ fontSize: 13, color: T.text }}>{theory.verdict}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>{theory.project.title}</div>
              <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginBottom: 16 }}><strong>Goal:</strong> {theory.project.goal}</p>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>KPIs to Monitor</div>
              {theory.project.kpis.map((k,i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.red, marginTop: 5, flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, color: T.textSec }}>{k}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>4-Week Delivery Plan</div>
              {theory.project.steps.map((s,i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.borderSub, border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.textMuted, flexShrink: 0 }}>
                    {i+1}
                  </div>
                  <span style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{s}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Stakeholders</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {theory.project.stakeholders.map((s,i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: T.borderSub, color: T.textSec, border: `1px solid ${T.border}` }}>{s}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Team Delegation</div>
                {theory.project.team.map((m,i) => (
                  <div key={i} style={{ fontSize: 12, color: T.textSec, marginBottom: 5, paddingLeft: 10, borderLeft: `2px solid ${T.border}` }}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DSR Driver Tree — direct drivers only */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>DSR Driver Tree</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 8 }}>What directly moves DSR — and what doesn't</h3>
      <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.75, maxWidth: 700, marginBottom: 28 }}>
        DSR is specifically the rate of successful deliveries. The driver tree below shows only the metrics
        that have a direct causal relationship with whether a parcel is delivered or not. Operational
        health metrics (CRP, OFD/Star, Lost%) contribute to the broader HeartBeat Score — not DSR directly.
      </p>

      {/* Root node */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ background: T.red, color: '#fff', borderRadius: 10, padding: '12px 36px',
          fontWeight: 800, fontSize: 16, boxShadow: '0 4px 12px rgba(227,6,19,0.25)' }}>
          DSR — Delivery Success Rate
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
        {DSR_DRIVERS.map((d, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: 18, boxShadow: T.shadow, borderTop: `3px solid ${T.red}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{d.label}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>{d.sub}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Driven by</div>
            {d.drivers.map((dr,j) => (
              <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <span style={{ color: T.red, fontSize: 12 }}>—</span>
                <span style={{ fontSize: 12, color: T.textSec }}>{dr}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* HeartBeat-only callout */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: T.shadow }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>
          These metrics contribute to HeartBeat Score — but not DSR directly
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {HB_ONLY.map((h,i) => (
            <div key={i} style={{ padding: '10px 14px', background: T.borderSub, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{h.label}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{h.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
