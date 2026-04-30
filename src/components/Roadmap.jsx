
import React, { useState } from 'react'
import { T } from './theme'

const MEMBERS = [
  { id:'a1', label:'Analyst 1', title:'Senior Data Analyst', color:'#2563EB' },
  { id:'a2', label:'Analyst 2', title:'Data Analyst (Mid)',   color:'#7C3AED' },
  { id:'a3', label:'Analyst 3', title:'Data Analyst (Junior)',color:'#D97706' },
  { id:'de', label:'Data Eng.',  title:'Data Engineer',       color:'#16A34A' },
]

const HYPS = [
  {
    id:'H1', dept:'Operations', title:'Hub backlog is the primary upstream cause of DSR failure',
    logic:`In the Bosta model, every parcel must clear the hub dispatch step before a Star can attempt delivery.
A hub running a backlog means parcels are physically present but not assigned to OFD runs, making delivery impossible regardless of driver quality.
From operational observation, backlog spikes correlate with Sundays (post-weekend accumulation) and pre-holiday surges.
If this hypothesis holds, it redirects the root cause away from driver performance and toward hub capacity planning, a fundamentally different intervention.`,
    statement:'Hubs with Backlog% > 10% will show DSR < 72% in the same 7-day window, with a Pearson r > 0.65.',
    approach:'Join hub_receipts with dispatch_events to calculate backlog by hub by day. Correlate with fact_deliveries DSR per hub per day. Control for volume tier (high/low volume hubs). Segment by city.',
    interviews:['Hub Operations Manager - peak capacity thresholds and manual overrides','Logistics Planning - volume forecasting accuracy and OFD sizing logic','VP Operations - escalation history and known problem hubs'],
    owners:['ops','data'],
    data:['MongoDB: hub_receipts.received_at vs dispatch_events.dispatched_at','Redshift: fact_deliveries grouped by hub_id × date','agg_heartbeat_daily.backlog_pct'],
    team:['Analyst 1: SQL - backlog vs DSR correlation study','Analyst 3: Hub volume tier segmentation','DE: backlog calculation pipeline if not already in Redshift'],
  },
  {
    id:'H2', dept:'Product', title:'Address data quality is driving ASR failure attributed to drivers',
    logic:`In Egypt, addresses often rely on landmarks and informal descriptions rather than structured geocoded data.
When a merchant's checkout captures an incomplete or unresolvable address, the Star makes a genuine attempt, cannot locate the customer, and logs a failure.
This failure is recorded against the driver's ASR - masking the root cause which lies upstream in data capture quality.
The business implication is significant: ops intervention (driver training) will have no effect on failures caused by bad address data.
Only a Product-side fix (checkout validation, address normalisation) resolves these cases.`,
    statement:'Failed delivery_attempts where GPS coordinates deviate > 500m from expected address centroid will have Fake Attempt Rate < 1.5%, confirming genuine attempt on wrong location.',
    approach:'Cluster failed attempt GPS coordinates vs merchant_orders.address geolocation. Segment failed attempts by reason_code. Compare ASR% between merchants with normalised vs raw address formats.',
    interviews:['Product Manager - current address capture UX and validation logic','Merchant Success - merchant feedback on address-related returns','CS team - top 5 call reason codes for "where is my order"'],
    owners:['product','data'],
    data:['MongoDB: delivery_attempts.gps_lat/lng × attempt outcome','MongoDB: merchant_orders.address','MongoDB: delivery_attempts.reason_code distribution'],
    team:['Analyst 1: Geospatial clustering of failed attempt GPS vs expected address','Analyst 3: Reason code distribution report by merchant','DE: Address normalisation enrichment in staging layer'],
  },
  {
    id:'H3', dept:'Customer Service', title:'CS call spikes are a lagging indicator of hub SLA failure, not a CS problem',
    logic:`Customer Service measures contact rate per parcel. High contact rate is treated as a CS capacity problem.
But the calls are predominantly "where is my order" - a question that would not be asked if the delivery were on time.
The hypothesis is that CS spikes are caused by hub Delivery Promised% failures: parcels dispatched too late to hit their window.
Validating this redirects the fix to Hub Operations (dispatch timing) and Product (proactive notification system) rather than CS headcount or scripts.
This also creates a predictive capability: monitoring hub dispatch times can forecast CS call spikes 24-48 hours in advance.`,
    statement:'Hubs with Delivery Promised% < 85% in week N will generate CS contact rate > 2.5× network average in week N.',
    approach:'Join CS call logs (parcel_id, call_reason) with fact_deliveries on parcel_id. Calculate contact rate per hub per week. Correlate with agg_heartbeat_daily.del_promised per hub per week.',
    interviews:['CS Director - top call reasons, peak call timing, per-parcel contact rate baseline','Hub Operations Managers - dispatch scheduling and SLA window setting process','Product - customer notification system capabilities and triggers'],
    owners:['cs','ops','data'],
    data:['CS call logs (parcel_id, call_reason, call_timestamp)','Redshift: fact_deliveries.promised_by vs delivered_at','agg_heartbeat_daily.del_promised per hub'],
    team:['Analyst 2: CS log join + hub attribution - contact rate by hub by week','Analyst 1: Dispatch timing correlation with CS spikes','Analyst 3: Automated weekly CS spike report'],
  },
]

const PLAN_WEEKS = [
  { week:'Week 1–2', phase:'Diagnose', items:[
    { who:'Manager',  task:'Stakeholder interviews - Ops, Product, CS, Merchant Success leads. Agree KPI definitions.' },
    { who:'Analyst 1',task:'Redshift schema audit - map all available fields to HeartBeat KPI requirements.' },
    { who:'Analyst 2',task:'Current reporting audit - document all existing dashboards and manual reports.' },
    { who:'Analyst 3',task:'MongoDB collection inventory - map event types, field completeness, date coverage.' },
    { who:'Data Eng.', task:'Access audit: Redshift + MongoDB read access. Assess CDC feasibility (Debezium/Fivetran).' },
  ]},
  { week:'Week 3–4', phase:'Diagnose', items:[
    { who:'Manager',  task:'Define full KPI taxonomy. Align definitions with Ops, Product, CS in sign-off session.' },
    { who:'Analyst 1',task:'Run H1: backlog vs DSR Pearson correlation. Produce hub-level scatter plot.' },
    { who:'Analyst 2',task:'Build merchant DSR baseline - rolling 30/60/90d DSR per merchant, assign tiers.' },
    { who:'Analyst 3',task:'Data quality gap report - which HeartBeat KPIs lack data, ranked by impact.' },
    { who:'Data Eng.', task:'Build ETL for Fake Attempt detection (GPS + dwell time logic from delivery_attempts).' },
  ]},
  { week:'Week 5–6', phase:'Build', items:[
    { who:'Manager',  task:'Present H1 findings to VP Operations. Agree intervention on top 3 backlog hubs.' },
    { who:'Analyst 1',task:'Run H2: address quality geospatial cluster. Produce merchant-level address failure rates.' },
    { who:'Analyst 2',task:'HeartBeat dashboard v1 - network + city level. Deploy in read-only for leadership review.' },
    { who:'Analyst 3',task:'Historical backfill - 90-day hub KPI data to populate agg_heartbeat_daily in Redshift.' },
    { who:'Data Eng.', task:'Build ETL for CRP, CRE events from MongoDB customer_requests collection.' },
  ]},
  { week:'Week 7–8', phase:'Build', items:[
    { who:'Manager',  task:'Run H2 review with Product + Merchant Success. Agree address validation A/B test.' },
    { who:'Analyst 1',task:'Run H3: CS log join. Map CS contact rate to hub-level Delivery Promised% failures.' },
    { who:'Analyst 2',task:'Add hub drill-down + star KPI layer to HeartBeat dashboard.' },
    { who:'Analyst 3',task:'Automated weekly reporting - HeartBeat by city emailed to ops leadership every Monday.' },
    { who:'Data Eng.', task:'Alert engine v1 - Slack alert when Backlog% > 12% or Lost% > 2% for any hub.' },
  ]},
  { week:'Week 9–10', phase:'Scale', items:[
    { who:'Manager',  task:'H3 review with CS Director + VP Ops. Agree proactive notification playbook.' },
    { who:'Analyst 1',task:'Begin predictive backlog model - 24h-ahead forecast using OFD pipeline data.' },
    { who:'Analyst 2',task:'Merchant-facing DSR portal - per-merchant DSR, tier badge, weekly trend.' },
    { who:'Analyst 3',task:'Data dictionary and KPI glossary - full documentation for all 15+ metrics.' },
    { who:'Data Eng.', task:'Streaming aggregation - Kafka pipeline for 30-min ops-facing KPI refresh.' },
  ]},
  { week:'Week 11–13', phase:'Scale', items:[
    { who:'Manager',  task:'HeartBeat incorporated into weekly Ops leadership review. Score as official OKR.' },
    { who:'Analyst 1',task:'Predictive backlog model - validate on holdout, deploy in dashboard as "at-risk hub" flag.' },
    { who:'Analyst 2',task:'Merchant tier notification automation - auto-email on tier change.' },
    { who:'Analyst 3',task:'Train hub managers on reading KPI definitions and HeartBeat drill-down.' },
    { who:'Data Eng.', task:'T-1 Redshift availability confirmed. Schema Registry documented. Pipeline monitoring live.' },
  ]},
]

const PHASE_COLORS = { Diagnose:'#2563EB', Build:'#D97706', Scale:'#16A34A' }

export default function Roadmap() {
  const [activeH, setActiveH] = useState('H1')
  const [activeTab, setActiveTab] = useState('hypotheses')
  const hyp = HYPS.find(h => h.id === activeH)

  return (
    <div style={{ padding:'100px 2rem 80px', maxWidth:1340, margin:'0 auto' }}>
      <div style={{ marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.red, letterSpacing:'0.1em', textTransform:'uppercase' }}>Section 06 - Roadmap</span>
      </div>
      <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:800, letterSpacing:'-0.03em', color:T.text, marginBottom:14 }}>
        From assessment to operational impact.
      </h2>
      <p style={{ fontSize:16, color:T.textSec, lineHeight:1.8, maxWidth:680, marginBottom:48 }}>
        Three hypothesis-driven investigations, one unified framework, and a 90-day execution plan
        with explicit task delegation across a 4-person data team.
      </p>

      {/* Tab nav */}
      <div style={{ display:'flex', gap:2, marginBottom:36, background:T.borderSub, borderRadius:8, padding:4, width:'fit-content', border:`1px solid ${T.border}` }}>
        {[{k:'hypotheses',label:'Hypotheses & Business Logic'},
          {k:'plan',label:'90-Day Plan'},
          {k:'team',label:'Team Delegation'}].map(tab => (
          <button key={tab.k} onClick={() => setActiveTab(tab.k)} style={{
            padding:'8px 22px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: activeTab===tab.k ? T.card : 'transparent',
            color: activeTab===tab.k ? T.text : T.textSec,
            boxShadow: activeTab===tab.k ? T.shadow : 'none', transition:'all 0.15s'
          }}>{tab.label}</button>
        ))}
      </div>

      {/* HYPOTHESES TAB */}
      {activeTab === 'hypotheses' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            {HYPS.map(h => (
              <button key={h.id} onClick={() => setActiveH(h.id)} style={{
                padding:'10px 22px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13,
                background: activeH===h.id ? T.redLight : T.card,
                border: `1px solid ${activeH===h.id ? T.red : T.border}`,
                color: activeH===h.id ? T.red : T.textSec, transition:'all 0.15s',
                boxShadow: activeH===h.id ? 'none' : T.shadow,
              }}>{h.id} - {h.dept}</button>
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
      )}

      {/* 90-DAY PLAN TAB */}
      {activeTab === 'plan' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {PLAN_WEEKS.map((wk, wi) => (
            <div key={wi} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.shadow }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 24px', borderBottom:`1px solid ${T.border}`,
                background:T.borderSub }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:PHASE_COLORS[wk.phase] }}/>
                <span style={{ fontWeight:800, fontSize:15, color:T.text }}>{wk.week}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                  background:`${PHASE_COLORS[wk.phase]}12`, color:PHASE_COLORS[wk.phase],
                  border:`1px solid ${PHASE_COLORS[wk.phase]}30` }}>{wk.phase} Phase</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {wk.items.map((item, ii) => {
                  const member = MEMBERS.find(m => m.label === item.who) || { color:T.red }
                  return (
                    <div key={ii} style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:0,
                      borderBottom: ii < wk.items.length-1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ padding:'12px 16px', borderRight:`1px solid ${T.border}`,
                        background:T.borderSub, display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:member.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{item.who}</span>
                      </div>
                      <div style={{ padding:'12px 20px' }}>
                        <span style={{ fontSize:13, color:T.textSec, lineHeight:1.6 }}>{item.task}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TEAM TAB */}
      {activeTab === 'team' && (
        <div>
          {/* Member cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:40 }}>
            {MEMBERS.map(m => {
              const tasks = PLAN_WEEKS.flatMap(wk => wk.items.filter(i => i.who === m.label).map(i => ({ week:wk.week, phase:wk.phase, task:i.task })))
              return (
                <div key={m.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.shadow, borderTop:`3px solid ${m.color}` }}>
                  <div style={{ fontSize:15, fontWeight:800, color:T.text, marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>{m.title}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Task Timeline</div>
                  {tasks.map((t, i) => (
                    <div key={i} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4,
                          background:`${PHASE_COLORS[t.phase]}12`, color:PHASE_COLORS[t.phase],
                          border:`1px solid ${PHASE_COLORS[t.phase]}30` }}>{t.week}</span>
                      </div>
                      <p style={{ fontSize:12, color:T.textSec, lineHeight:1.5, paddingLeft:4, borderLeft:`2px solid ${m.color}30` }}>{t.task}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Cross-functional cadence */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:28, boxShadow:T.shadow }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.text, marginBottom:20 }}>Cross-Functional Alignment Cadence</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {[
                { dept:'Operations', cadence:'Weekly Hub Review', day:'Every Monday AM',
                  format:'HeartBeat score per hub, backlog alert triage, top 3 at-risk hubs with action owner', owner:'Analyst 2 prepares; Manager presents' },
                { dept:'Product', cadence:'Bi-Weekly Data Share', day:'Every other Wednesday',
                  format:'Address failure rate by merchant, checkout validation impact analysis, A/B test readout', owner:'Analyst 1 prepares; Manager + Product PM review' },
                { dept:'Customer Service', cadence:'Monthly SLA Review', day:'Last Friday of month',
                  format:'Delivery Promised% vs CS contact rate, hubs driving call spikes, proactive notification playbook', owner:'Analyst 2 prepares; Manager + CS Director align' },
              ].map((s, i) => (
                <div key={i} style={{ padding:18, background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:T.text, marginBottom:4 }}>{s.dept}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.red, marginBottom:2 }}>{s.cadence}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:12 }}>{s.day}</div>
                  <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6, marginBottom:8 }}>{s.format}</div>
                  <div style={{ fontSize:11, color:T.textMuted, fontStyle:'italic' }}>{s.owner}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
