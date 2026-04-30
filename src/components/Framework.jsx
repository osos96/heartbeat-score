
import React, { useState } from 'react'
import { T } from './theme'

const VERTICALS = [
  { id:'ops',     label:'Hub Operations',       owner:'VP Operations / Hub Managers' },
  { id:'field',   label:'Field / Driver Ops',   owner:'Field Operations Manager' },
  { id:'merch',   label:'Merchant Success',     owner:'VP Commercial' },
  { id:'product', label:'Product',              owner:'Head of Product' },
  { id:'cs',      label:'Customer Service',     owner:'CS Director' },
  { id:'data',    label:'Data & Analytics',     owner:'Head of Data (BI Manager)' },
]

const KPIS = [
  { id:'asr',      label:'ASR%',             pillar:'Stars',     weight:'30%',
    owners:['field','data'],   consumers:['ops','cs'],
    desc:'Attempt success rate - core driver quality output. Measures the % of OFD parcels resulting in successful delivery.',
    calc:'Delivered parcels / Total OFD parcels attempted x 100',
    source:'MongoDB: delivery_attempts.outcome = "success" / total per hub per day',
    stakeholders:'Field Ops Manager (accountable), Hub Ops (context), CS (symptom monitoring)' },
  { id:'fdds',     label:'FDDS%',            pillar:'Stars',     weight:'20%',
    owners:['field','ops'],    consumers:['data','merch'],
    desc:'First Day Delivery Success - % of parcels delivered on the same day they first go OFD. Captures route and capacity quality.',
    calc:'Parcels delivered day-of-OFD / Total OFD parcels x 100',
    source:'MongoDB: delivery_attempts.attempt_date = dispatch_events.ofd_date AND outcome = "success"',
    stakeholders:'Field Ops (driver accountability), Logistics Planning (OFD sizing), Merchant Success (promise fulfilment)' },
  { id:'fake',     label:'Fake Attempt Rate', pillar:'Stars',     weight:'10% (neg)',
    owners:['field','data'],   consumers:['ops','cs'],
    desc:'% of delivery attempts where GPS coordinates and timing evidence suggest no genuine delivery attempt was made.',
    calc:'Flagged fake attempts / Total attempts x 100 (lower is better)',
    source:'MongoDB: delivery_attempts - GPS deviation > threshold from expected address + sub-60s dwell time',
    stakeholders:'Field Ops Manager (discipline), Data Team (detection model), HR (incentive alignment)',
    gamificationNote: true },
  { id:'ofd',      label:'OFD/Star',          pillar:'Stars',     weight:'20%',
    owners:['ops','field'],    consumers:['data'],
    desc:'Average daily Out-for-Delivery parcel volume per Star per hub. Measures capacity utilisation and route density.',
    calc:'Total OFD parcels per hub / Active Stars on that day',
    source:'MongoDB: dispatch_events grouped by hub_id and ofd_date',
    stakeholders:'Logistics Planning (capacity), Hub Ops (roster management), Field Ops (route design)' },
  { id:'crp',      label:'CRP%',              pillar:'Stars',     weight:'10%',
    owners:['field','merch'],  consumers:['cs'],
    desc:'Customer Return Pickup rate - % of return pickup requests fulfilled by Stars on the same or next cycle.',
    calc:'Completed CRP pickups / Total CRP requests x 100',
    source:'MongoDB: customer_requests.type = "CRP" joined with pickup_events',
    stakeholders:'Merchant Success (SLA), Field Ops (driver tasking), CS (customer satisfaction)' },
  { id:'cre',      label:'CRE%',              pillar:'Stars',     weight:'10%',
    owners:['field','merch'],  consumers:['cs','product'],
    desc:'Customer Return Exchange rate - % of exchange requests (return + new delivery) completed in one cycle.',
    calc:'Completed exchanges / Total exchange requests x 100',
    source:'MongoDB: customer_requests.type = "CRE" joined with delivery_attempts + pickup_events',
    stakeholders:'Merchant Success, Field Ops, Product (exchange workflow)' },
  { id:'promised', label:'Delivery Promised%', pillar:'Hubs',     weight:'15%',
    owners:['ops','data'],     consumers:['cs','merch'],
    desc:'Rate at which delivery is fulfilled within the SLA window promised to the customer at checkout.',
    calc:'Deliveries within promised window / Total deliveries x 100',
    source:'Redshift: fact_deliveries.delivered_at vs fact_deliveries.promised_by',
    stakeholders:'Hub Ops (dispatch accountability), CS (call driver), Merchant Success (merchant SLAs)' },
  { id:'backlog',  label:'Backlog%',           pillar:'Hubs',     weight:'15% (neg)',
    owners:['ops'],            consumers:['data','cs','merch'],
    desc:'% of received parcels not dispatched within the same-day dispatch window. The single highest-leverage DSR driver.',
    calc:'Parcels received but not dispatched same day / Total received x 100 (lower is better)',
    source:'MongoDB: hub_receipts.received_at vs dispatch_events.dispatched_at per hub per day',
    stakeholders:'Hub Ops Manager (primary owner), Logistics Planning (capacity forecasting), VP Ops (escalation)' },
  { id:'lost',     label:'Lost Parcel%',       pillar:'Hubs',     weight:'15% (neg)',
    owners:['ops'],            consumers:['merch','data'],
    desc:'% of parcels with no traceable status update after hub receipt - presumed lost in network.',
    calc:'Parcels with no outcome event > 5 days after hub receipt / Total received x 100',
    source:'Redshift: fact_deliveries WHERE final_status IS NULL OR last_event_age > 5 days',
    stakeholders:'Hub Ops Manager, Finance (cost impact), Merchant Success (compensation)' },
  { id:'dsr',      label:'Merchant DSR%',      pillar:'Merchants', weight:'100%',
    owners:['merch','data'],   consumers:['ops','cs','product'],
    desc:'Per-merchant delivery success rate. The commercial output metric. Drives merchant retention, SLA contracts, and re-attempt cost.',
    calc:'Successfully delivered parcels / Total shipped parcels per merchant x 100',
    source:'Redshift: fact_deliveries grouped by merchant_id, filtered outcome = "delivered"',
    stakeholders:'Merchant Success (commercial), VP Commercial (contract), Ops (root cause), Data (reporting)' },
]

const PILLAR_COLORS = { Stars:'#16A34A', Hubs:'#2563EB', Merchants:'#D97706' }

function cellRole(kpi, vertId) {
  if (kpi.owners.includes(vertId)) return 'owner'
  if (kpi.consumers.includes(vertId)) return 'monitor'
  return null
}

export default function Framework() {
  const [activeKpi, setActiveKpi] = useState('asr')
  const kpi = KPIS.find(k => k.id === activeKpi)

  return (
    <div style={{ padding:'100px 2rem 80px', maxWidth:1340, margin:'0 auto' }}>
      <div style={{ marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.red, letterSpacing:'0.1em', textTransform:'uppercase' }}>Section 04 - Framework</span>
      </div>
      <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:800, letterSpacing:'-0.03em', color:T.text, marginBottom:14 }}>
        The HeartBeat Score framework.
      </h2>
      <p style={{ fontSize:16, color:T.textSec, lineHeight:1.8, maxWidth:680, marginBottom:48 }}>
        A weighted composite of three operational OKRs - Stars, Hubs, Merchants - each owned by a
        specific vertical. Weights reflect accountability: Hubs carry 50% because hub throughput is
        the highest-leverage point in the last-mile chain.
      </p>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:24,
        marginBottom:48, boxShadow:T.shadow, display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>HeartBeat Score Formula</div>
          <code style={{ fontSize:15, color:T.text, fontFamily:'monospace', fontWeight:600 }}>
            HB = (<span style={{color:'#16A34A'}}>Stars x 0.30</span>) + (<span style={{color:'#2563EB'}}>Hubs x 0.50</span>) + (<span style={{color:'#D97706'}}>Merchants x 0.20</span>)
          </code>
        </div>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, minWidth:300 }}>
          {[
            {label:'Stars OKR',    w:'30%', owner:'Field Ops',        color:'#16A34A'},
            {label:'Hubs OKR',     w:'50%', owner:'Hub Ops',          color:'#2563EB'},
            {label:'Merchants OKR',w:'20%', owner:'Merchant Success', color:'#D97706'},
          ].map(p => (
            <div key={p.label} style={{ padding:'12px 16px', borderRadius:8, background:T.borderSub, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:T.text }}>{p.w}</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Owner: {p.owner}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:20 }}>
        KPI View - select a metric
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, marginBottom:48 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:2, background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.shadow }}>
          {KPIS.map(k => (
            <button key={k.id} onClick={() => setActiveKpi(k.id)}
              style={{ padding:'12px 16px', border:'none', borderBottom:`1px solid ${T.border}`,
                background: activeKpi===k.id ? T.borderSub : 'transparent',
                cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:PILLAR_COLORS[k.pillar], flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{k.label}</div>
                <div style={{ fontSize:11, color:T.textMuted }}>{k.pillar} - {k.weight}</div>
              </div>
            </button>
          ))}
        </div>

        {kpi && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:28, boxShadow:T.shadow }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:PILLAR_COLORS[kpi.pillar] }}/>
              <span style={{ fontSize:11, fontWeight:700, color:PILLAR_COLORS[kpi.pillar], textTransform:'uppercase', letterSpacing:'0.08em' }}>{kpi.pillar} OKR - {kpi.weight}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:10 }}>{kpi.label}</div>
            <p style={{ fontSize:14, color:T.textSec, lineHeight:1.75, marginBottom:24 }}>{kpi.desc}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Calculation</div>
                <div style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:T.mono, marginBottom:16 }}>{kpi.calc}</div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Data Source</div>
                <div style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:T.mono }}>{kpi.source}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>OKR Owners (accountable)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                  {kpi.owners.map((v,i) => {
                    const vert = VERTICALS.find(vt => vt.id===v)
                    return <span key={i} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:T.redLight, color:T.red, border:`1px solid ${T.redBorder}` }}>{vert?.label}</span>
                  })}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Verticals Monitoring</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                  {kpi.consumers.map((v,i) => {
                    const vert = VERTICALS.find(vt => vt.id===v)
                    return <span key={i} style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, background:T.borderSub, color:T.textSec, border:`1px solid ${T.border}` }}>{vert?.label}</span>
                  })}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Stakeholder Map</div>
                <p style={{ fontSize:13, color:T.textSec, lineHeight:1.7 }}>{kpi.stakeholders}</p>
              </div>
            </div>
            {kpi.gamificationNote && (
              <div style={{ marginTop:24, background:T.amberLight, border:`1px solid ${T.amber}30`, borderRadius:10, padding:'16px 20px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.amber, marginBottom:8 }}>
                  Why sub-60s dwell time - and why Data is accountable for detection
                </div>
                <p style={{ fontSize:13, color:T.textSec, lineHeight:1.75, margin:0 }}>
                  A genuine delivery attempt requires the Star to park, approach the address, wait for a response, and return
                  to the vehicle. Any scan logged with less than 60 seconds of GPS dwell time at the delivery coordinate is
                  statistically inconsistent with a real attempt. We use this as the primary signal - not the only signal -
                  because it is objective, tamper-resistant, and already present in the MongoDB event log.
                </p>
                <p style={{ fontSize:13, color:T.textSec, lineHeight:1.75, marginTop:10, marginBottom:0 }}>
                  Data Team is listed as an owner - not Field Ops alone - because gamification prevention cannot be solved
                  through operational enforcement. Stars will adapt to any rule they are told about. The detection model must
                  remain a black box: a combination of dwell time, GPS cluster analysis, address-match deviation, and attempt
                  timing patterns that no individual driver can fully reverse-engineer. This is the only approach that stays
                  ahead of behavioural drift.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:20 }}>
        Accountability Matrix - which teams own each KPI
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.shadow, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:`200px repeat(${VERTICALS.length}, 1fr)`,
          borderBottom:`1px solid ${T.border}`, background:T.borderSub }}>
          <div style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>KPI / OKR</div>
          {VERTICALS.map(v => (
            <div key={v.id} style={{ padding:'10px 8px', fontSize:10, fontWeight:700, color:T.textMuted,
              textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'center', borderLeft:`1px solid ${T.border}` }}>
              {v.label}
            </div>
          ))}
        </div>
        {['Stars','Hubs','Merchants'].map(pillar => {
          const pillarKpis = KPIS.filter(k => k.pillar === pillar)
          const pc = PILLAR_COLORS[pillar]
          return (
            <React.Fragment key={pillar}>
              <div style={{ padding:'6px 16px', background:pc+'0D', borderBottom:`1px solid ${T.border}`,
                fontSize:10, fontWeight:800, color:pc, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {pillar} OKR - {pillar==='Stars'?'30%':pillar==='Hubs'?'50%':'20%'}
              </div>
              {pillarKpis.map(k => (
                <div key={k.id} onClick={() => setActiveKpi(k.id)}
                  style={{ display:'grid', gridTemplateColumns:`200px repeat(${VERTICALS.length}, 1fr)`,
                    borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                    background: activeKpi===k.id ? T.borderSub : 'transparent',
                    transition:'background 0.1s' }}>
                  <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:pc, flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{k.label}</span>
                  </div>
                  {VERTICALS.map(v => {
                    const role = cellRole(k, v.id)
                    return (
                      <div key={v.id} style={{ borderLeft:`1px solid ${T.border}`,
                        display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 4px' }}>
                        {role === 'owner' && (
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4,
                            background:T.redLight, color:T.red, border:`1px solid ${T.redBorder}` }}>Owner</span>
                        )}
                        {role === 'monitor' && (
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:4,
                            background:T.borderSub, color:T.textMuted, border:`1px solid ${T.border}` }}>Monitors</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </React.Fragment>
          )
        })}
      </div>
      <div style={{ fontSize:12, color:T.textMuted }}>
        Click any row to load the KPI detail above.
        <strong style={{ color:T.red }}> Owner</strong> = accountable for metric outcome.
        <strong style={{ color:T.textSec }}> Monitors</strong> = uses the metric as a leading indicator.
      </div>
    </div>
  )
}
