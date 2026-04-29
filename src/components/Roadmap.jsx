
import React, { useState } from 'react'

const HYPOTHESES = [
  {
    id: 'H1', title: 'Hub backlog is the primary DSR killer',
    dept: 'Operations', color: '#3B82F6',
    statement: 'Hubs with Backlog% > 10 will show DSR < 70% within the same 7-day window.',
    approach: 'Join fact_deliveries with agg_heartbeat_daily. Correlate hub-level backlog% against next-day DSR. Run Pearson correlation; expect r > 0.65. Segment by hub tier and city.',
    data: ['agg_heartbeat_daily (Redshift)', 'fact_deliveries.attempt_outcome', 'dim_hubs.capacity'],
    expected: 'Strong negative correlation between backlog and DSR. Confirms Hubs OKR as 50% weighted correctly.',
  },
  {
    id: 'H2', title: 'Address failure drives repeat attempts, not driver performance',
    dept: 'Product', color: '#6366F1',
    statement: 'Failed attempts where GPS coords match expected address will have Fake Attempt% < 2%, while address-mismatch failures cluster differently.',
    approach: 'Cluster failed delivery_attempts by GPS deviation from merchant-provided address coordinates. Separate "address not found" failures from "customer not available" via attempt_reason codes. Compare ASR% between merchants with normalized vs raw addresses.',
    data: ['delivery_attempts.gps_lat/lng', 'merchant_orders.address_coordinates', 'attempt_reason_code'],
    expected: 'Address normalization gap explains 15-25% of failed attempts. Product fix (checkout validation) reduces RTO cycle.',
  },
  {
    id: 'H3', title: 'Missed delivery windows inflate CS call volume',
    dept: 'Customer Service', color: '#F59E0B',
    statement: 'Parcels where actual delivery time falls outside promised window will generate 3x the inbound CS contact rate.',
    approach: 'Join CS call logs with delivery_attempts on parcel_id. Compare contact_rate for on-window vs off-window deliveries. Segment by hub delivery_promised% to identify systemic hub-level SLA failures.',
    data: ['CS call logs (parcel_id, call_reason)', 'fact_deliveries.promised_window vs actual_delivered_at', 'agg_heartbeat_daily.del_promised'],
    expected: 'Direct link between Hubs Delivery Promised% and CS volume. Fixing hub SLA reduces CS cost without a CS-side intervention.',
  },
]

const DAYS = [
  {
    phase: '0–30 Days', label: 'Diagnose', color: '#E30613',
    items: [
      'Audit existing Redshift schema — map available fields to HeartBeat KPI requirements',
      'Interview Ops, Product, CS leads — validate KPI definitions and confirm data ownership',
      'Deploy HeartBeat dashboard in read-only mode with available data',
      'Run H1 hypothesis test (backlog vs DSR correlation) as quick win proof point',
      'Identify top 3 data gaps and build ETL patch plan with engineering',
    ]
  },
  {
    phase: '30–60 Days', label: 'Build', color: '#3B82F6',
    items: [
      'Complete ETL pipeline for missing KPIs (Fake Attempt, CRP, CRE from MongoDB events)',
      'Run H2 and H3 hypothesis tests — present findings to Ops, Product, CS heads',
      'Launch HeartBeat score as official network health metric in weekly leadership review',
      'Build alert engine: Backlog > 12% → Ops alert; Delivery Promised < 85% → CS brief',
      'Train hub managers on KPI definitions and score accountability',
    ]
  },
  {
    phase: '60–90 Days', label: 'Scale', color: '#10B981',
    items: [
      'Activate merchant-facing DSR tier dashboard and automated tier upgrade/downgrade notifications',
      'Integrate HeartBeat score into OKR review cycles across all departments',
      'Launch predictive backlog alert (forecasts hub overload 24h ahead using OFD pipeline)',
      'Publish first HeartBeat Quarterly Network Report to exec leadership',
      'Propose scoring weight calibration based on 90-day variance analysis',
    ]
  },
]

const TEAM = [
  { role: 'Senior Data Analyst (x2)', focus: 'Hypothesis testing, SQL analysis, KPI validation', icon: '🔬' },
  { role: 'BI Engineer (x1)', focus: 'Dashboard build, Redshift query optimization, ETL monitoring', icon: '🛠️' },
  { role: 'Data Engineer (x1)', focus: 'MongoDB CDC pipeline, schema registry, data quality layer', icon: '⚙️' },
  { role: 'Analytics Manager (you)', focus: 'Framework design, stakeholder alignment, hypothesis framing, exec communication', icon: '🎯' },
]

export default function Roadmap() {
  const [activeH, setActiveH] = useState('H1')
  const hyp = HYPOTHESES.find(h => h.id === activeH)

  return (
    <div style={{ minHeight: '100vh', padding: '100px 2rem 80px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#E30613', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 05</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
        From assessment to impact.<br /><span style={{ color: '#6B7280' }}>90-day execution plan.</span>
      </h2>
      <p style={{ color: '#6B7280', fontSize: 15, maxWidth: 580, marginBottom: 64, lineHeight: 1.7 }}>
        Three hypothesis tests, three department coalitions, one unified framework. Here is how the first 90 days turn this blueprint into operational reality.
      </p>

      {/* Hypotheses */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          Three Testable Hypotheses
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {HYPOTHESES.map(h => (
            <button key={h.id} onClick={() => setActiveH(h.id)}
              style={{
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: activeH === h.id ? `rgba(${h.color === '#3B82F6' ? '59,130,246' : h.color === '#6366F1' ? '99,102,241' : '245,158,11'},0.12)` : '#0D0F18',
                border: `1px solid ${activeH === h.id ? h.color : 'rgba(255,255,255,0.07)'}`,
                color: activeH === h.id ? h.color : '#6B7280',
                transition: 'all 0.2s',
              }}>{h.id}: {h.dept}</button>
          ))}
        </div>
        {hyp && (
          <div style={{ background: '#0D0F18', border: `1px solid ${hyp.color}33`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#E8EAF0', marginBottom: 8 }}>{hyp.title}</div>
            <div style={{ background: `rgba(${hyp.color === '#3B82F6' ? '59,130,246' : hyp.color === '#6366F1' ? '99,102,241' : '245,158,11'},0.07)`, borderRadius: 8, padding: 14, marginBottom: 20, borderLeft: `3px solid ${hyp.color}` }}>
              <span style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>"{hyp.statement}"</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: hyp.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Analytical Approach</div>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7 }}>{hyp.approach}</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: hyp.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Data Sources Required</div>
                {hyp.data.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace', marginBottom: 6, padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>{d}</div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Expected Finding</div>
                  <p style={{ fontSize: 12, color: '#D1FAE5', lineHeight: 1.6 }}>{hyp.expected}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 90-day roadmap */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          90-Day Execution Plan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {DAYS.map((phase, i) => (
            <div key={i} style={{ background: '#0D0F18', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 12, padding: 24, borderTop: `3px solid ${phase.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{phase.phase}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#E8EAF0', marginBottom: 20 }}>{phase.label}</div>
              {phase.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: phase.color, marginTop: 5, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          Team Structure & Delegation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {TEAM.map((t, i) => (
            <div key={i} style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0', marginBottom: 8 }}>{t.role}</div>
              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{t.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stakeholder alignment */}
      <div style={{ background: 'rgba(227,6,19,0.05)', border: '1px solid rgba(227,6,19,0.15)', borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#E8EAF0', marginBottom: 16 }}>Cross-Functional Alignment Cadence</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { dept: 'Operations', cadence: 'Weekly hub review', format: 'HeartBeat score per hub, backlog alert triage, top 3 at-risk hubs action items' },
            { dept: 'Product', cadence: 'Bi-weekly data share', format: 'Address failure rate by merchant, checkout validation impact analysis, A/B test on address normalization' },
            { dept: 'Customer Service', cadence: 'Monthly SLA review', format: 'Delivery Promised% vs CS contact rate, identification of hubs driving call spikes, proactive communication playbook' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#E30613', marginBottom: 4 }}>{s.dept}</div>
              <div style={{ fontSize: 11, color: '#F59E0B', marginBottom: 8, fontWeight: 600 }}>{s.cadence}</div>
              <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>{s.format}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
