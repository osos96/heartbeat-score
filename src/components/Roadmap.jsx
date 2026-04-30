
import React, { useState } from 'react'
import { T } from './theme'

const HYPS = [
  {
    id:'H1', dept:'Operations', title:'Hub backlog is the primary upstream cause of DSR failure',
    logic:`In the Bosta model, every parcel must clear the hub dispatch step before a Star can attempt delivery.
A hub running a backlog means parcels are physically present but not assigned to OFD runs, making delivery impossible regardless of driver quality.
From operational observation, backlog spikes correlate with Sundays (post-weekend accumulation) and pre-holiday surges.
If this hypothesis holds, it redirects the root cause away from driver performance and toward hub capacity planning, a fundamentally different intervention.`,
    statement:'Hubs with Backlog% > 10% will show DSR < 72% in the same 7-day window, with a Pearson r > 0.65.',
    approach:'Join hub_receipts with dispatch_events to calculate backlog by hub by day. Correlate with fact_deliveries DSR per hub per day. Control for volume tier (high/low volume hubs). Segment by city.',
    interviews:['Hub Operations Manager: peak capacity thresholds and manual overrides','Logistics Planning: volume forecasting accuracy and OFD sizing logic','VP Operations: escalation history and known problem hubs'],
    owners:['ops','data'],
    data:['MongoDB: hub_receipts.received_at vs dispatch_events.dispatched_at','Redshift: fact_deliveries grouped by hub_id × date','agg_heartbeat_daily.backlog_pct'],
    team:['Analyst 1: SQL - backlog vs DSR correlation study','Analyst 3: Hub volume tier segmentation','DE: backlog calculation pipeline if not already in Redshift'],
  },
  {
    id:'H2', dept:'Product', title:'Address data quality is driving ASR failure attributed to drivers',
    logic:`In Egypt, addresses often rely on landmarks and informal descriptions rather than structured geocoded data.
When a merchant's checkout captures an incomplete or unresolvable address, the Star makes a genuine attempt, cannot locate the customer, and logs a failure.
This failure is recorded against the driver's ASR, masking the root cause which lies upstream in data capture quality.
The business implication is significant: ops intervention (driver training) will have no effect on failures caused by bad address data.
Only a Product-side fix (checkout validation, address normalisation) resolves these cases.`,
    statement:'Failed delivery_attempts where GPS coordinates deviate > 500m from expected address centroid will have Fake Attempt Rate < 1.5%, confirming genuine attempt on wrong location.',
    approach:'Cluster failed attempt GPS coordinates vs merchant_orders.address geolocation. Segment failed attempts by reason_code. Compare ASR% between merchants with normalised vs raw address formats.',
    interviews:['Product Manager: current address capture UX and validation logic','Merchant Success: merchant feedback on address-related returns','CS team: top 5 call reason codes for "where is my order"'],
    owners:['product','data'],
    data:['MongoDB: delivery_attempts.gps_lat/lng × attempt outcome','MongoDB: merchant_orders.address','MongoDB: delivery_attempts.reason_code distribution'],
    team:['Analyst 1: Geospatial clustering of failed attempt GPS vs expected address','Analyst 3: Reason code distribution report by merchant','DE: Address normalisation enrichment in staging layer'],
  },
  {
    id:'H3', dept:'Customer Service', title:'CS call spikes are a lagging indicator of hub SLA failure, not a CS problem',
    logic:`Customer Service measures contact rate per parcel. High contact rate is treated as a CS capacity problem.
But the calls are predominantly "where is my order", a question that would not be asked if the delivery were on time.
The hypothesis is that CS spikes are caused by hub Delivery Promised% failures: parcels dispatched too late to hit their window.
Validating this redirects the fix to Hub Operations (dispatch timing) and Product (proactive notification system) rather than CS headcount or scripts.
This also creates a predictive capability: monitoring hub dispatch times can forecast CS call spikes 24-48 hours in advance.`,
    statement:'Hubs with Delivery Promised% < 85% in week N will generate CS contact rate > 2.5× network average in week N.',
    approach:'Join CS call logs (parcel_id, call_reason) with fact_deliveries on parcel_id. Calculate contact rate per hub per week. Correlate with agg_heartbeat_daily.del_promised per hub per week.',
    interviews:['CS Director: top call reasons, peak call timing, per-parcel contact rate baseline','Hub Operations Managers: dispatch scheduling and SLA window setting process','Product: customer notification system capabilities and triggers'],
    owners:['cs','ops','data'],
    data:['CS call logs (parcel_id, call_reason, call_timestamp)','Redshift: fact_deliveries.promised_by vs delivered_at','agg_heartbeat_daily.del_promised per hub'],
    team:['Analyst 2: CS log join + hub attribution - contact rate by hub by week','Analyst 1: Dispatch timing correlation with CS spikes','Analyst 3: Automated weekly CS spike report'],
  },
]

export default function Roadmap() {
  const [activeH, setActiveH] = useState('H1')
  const hyp = HYPS.find(h => h.id === activeH)

  return (
    <div style={{ padding:'100px 2rem 80px', maxWidth:1340, margin:'0 auto' }}>
      <div style={{ marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.red, letterSpacing:'0.1em', textTransform:'uppercase' }}>Section 06 — Roadmap</span>
      </div>
      <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:800, letterSpacing:'-0.03em', color:T.text, marginBottom:14 }}>
        From assessment to operational impact.
      </h2>
      <p style={{ fontSize:16, color:T.textSec, lineHeight:1.8, maxWidth:680, marginBottom:48 }}>
        Three hypothesis-driven investigations that map the most likely root causes of delivery failure,
        each grounded in the data available in Bosta's stack, each traceable to an operational intervention.
      </p>

      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        {HYPS.map(h => (
          <button key={h.id} onClick={() => setActiveH(h.id)} style={{
            padding:'10px 22px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13,
            background: activeH===h.id ? T.redLight : T.card,
            border: `1px solid ${activeH===h.id ? T.red : T.border}`,
            color: activeH===h.id ? T.red : T.textSec, transition:'all 0.15s',
            boxShadow: activeH===h.id ? 'none' : T.shadow,
          }}>{h.id} — {h.dept}</button>
        ))}
      </div>

      {hyp && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:32, boxShadow:T.shadow }}>
          <div style={{ fontWeight:800, fontSize:18, color:T.text, marginBottom:16 }}>{hyp.title}</div>

          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Business Logic</div>
            <div style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px' }}>
              <p style={{ fontSize:14, color:T.textSec, lineHeight:1.8, whiteSpace:'pre-line' }}>{hyp.logic}</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Testable Statement</div>
              <div style={{ background:T.redLight, border:`1px solid ${T.redBorder}`, borderRadius:8, padding:'12px 16px', marginBottom:20 }}>
                <p style={{ fontSize:13, color:T.text, lineHeight:1.7, fontStyle:'italic' }}>"{hyp.statement}"</p>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Analytical Approach</div>
              <p style={{ fontSize:13, color:T.textSec, lineHeight:1.75, marginBottom:16 }}>{hyp.approach}</p>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Data Sources</div>
              {hyp.data.map((d,i) => (
                <div key={i} style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:6, padding:'7px 12px', marginBottom:6, fontFamily:'monospace', fontSize:11, color:T.mono }}>{d}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Interviews & Stakeholder Alignment Needed</div>
              {hyp.interviews.map((iv,i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:T.borderSub, border:`1px solid ${T.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:T.textMuted, flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:13, color:T.textSec, lineHeight:1.6 }}>{iv}</span>
                </div>
              ))}
              <div style={{ marginTop:20, fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Team Task Delegation</div>
              {hyp.team.map((t,i) => (
                <div key={i} style={{ padding:'8px 12px', borderRadius:6, background:T.borderSub, border:`1px solid ${T.border}`, marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.textSec }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    