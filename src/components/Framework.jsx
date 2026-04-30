
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
    owners:['field','data'],
    consumers:['ops','cs'],
    desc:'Attempt success rate - core driver quality output. Measures the % of OFD parcels resulting in successful delivery.',
    calc:'Delivered parcels / Total OFD parcels attempted × 100',
    source:'MongoDB: delivery_attempts.outcome = "success" / total per hub per day',
    stakeholders:'Field Ops Manager (accountable), Hub Ops (context), CS (symptom monitoring)' },
  { id:'fdds',     label:'FDDS%',            pillar:'Stars',     weight:'20%',
    owners:['field','ops'],   consumers:['data','merch'],
    desc:'First Day Delivery Success - % of parcels delivered on the same day they first go OFD. Captures route and capacity quality.',
    calc:'Parcels delivered day-of-OFD / Total OFD parcels × 100',
    source:'MongoDB: delivery_attempts.attempt_date = dispatch_events.ofd_date AND outcome = "success"',
    stakeholders:'Field Ops (driver accountability), Logistics Planning (OFD sizing), Merchant Success (promise fulfilment)' },
  { id:'fake',     label:'Fake Attempt Rate', pillar:'Stars',     weight:'10% (neg)',
    owners:['field','data'],  consumers:['ops','cs'],
    desc:'% of delivery attempts where GPS coordinates and timing evidence suggest no genuine delivery attempt was made.',
    calc:'Flagged fake attempts / Total attempts × 100 (lower is better)',
    source:'MongoDB: delivery_attempts - GPS deviation > threshold from expected address + sub-60s dwell time',
    stakeholders:'Field Ops Manager (discipline), Data Team (detection model), HR (incentive alignment)' },
  { id:'ofd',      label:'OFD/Star',          pillar:'Stars',     weight:'20%',
    owners:['ops','field'],   consumers:['data'],
    desc:'Average daily Out-for-Delivery parcel volume per Star per hub. Measures capacity utilisation and route density.',
    calc:'Total OFD parcels per hub / Active Stars on that day',
    source:'MongoDB: dispatch_events grouped by hub_id and ofd_date',
    stakeholders:'Logistics Planning (capacity), Hub Ops (roster management), Field Ops (route design)' },
  { id:'crp',      label:'CRP%',              pillar:'Stars',     weight:'10%',
    owners:['field','merch'], consumers:['cs'],
    desc:'Customer Return Pickup rate - % of return pickup requests fulfilled by Stars on the same or next cycle.',
    calc:'Completed CRP pickups / Total CRP requests × 100',
    source:'MongoDB: customer_requests.type = "CRP" joined with pickup_events',
    stakeholders:'Merchant Success (SLA), Field Ops (driver tasking), CS (customer satisfaction)' },
  { id:'cre',      label:'CRE%',              pillar:'Stars',     weight:'10%',
    owners:['field','merch'], consumers:['cs','product'],
    desc:'Customer Return Exchange rate - % of exchange requests (return + new delivery) completed in one cycle.',
    calc:'Completed exchanges / Total exchange requests × 100',
    source:'MongoDB: customer_requests.type = "CRE" joined with delivery_attempts + pickup_events',
    stakeholders:'Merchant Success, Field Ops, Product (exchange workflow)' },
  { id:'promised', label:'Delivery Promised%', pillar:'Hubs',     weight:'15%',
    owners:['ops','data'],    consumers:['cs','merch'],
    desc:'Rate at which delivery is fulfilled within the SLA window promised to the customer at checkout.',
    calc:'Deliveries within promised window / Total deliveries × 100',
    source:'Redshift: fact_deliveries.delivered_at vs fact_deliveries.promised_by',
    stakeholders:'Hub Ops (dispatch accountability), CS (call driver), Merchant Success (merchant SLAs)' },
  { id:'backlog',  label:'Backlog%',           pillar:'Hubs',     weight:'15% (neg)',
    owners:['ops'],           consumers:['data','cs','merch'],
    desc:'% of received parcels not dispatched within the same-day dispatch window. The single highest-leverage DSR driver.',
    calc:'Parcels received but not dispatched same day / Total received × 100 (lower is better)',
    source:'MongoDB: hub_receipts.received_at vs dispatch_events.dispatched_at per hub per day',
    stakeholders:'Hub Ops Manager (primary owner), Logistics Planning (capacity forecasting), VP Ops (escalation)' },
  { id:'lost',     label:'Lost Parcel%',       pillar:'Hubs',     weight:'15% (neg)',
    owners:['ops'],           consumers:['merch','data'],
    desc:'% of parcels with no traceable status update after hub receipt - presumed lost in network.',
    calc:'Parcels with no outcome event > 5 days after hub receipt / Total received × 100',
    source:'Redshift: fact_deliveries WHERE final_status IS NULL OR last_event_age > 5 days',
    stakeholders:'Hub Ops Manager, Finance (cost impact), Merchant Success (compensation)' },
  { id:'dsr',      label:'Merchant DSR%',      pillar:'Merchants', weight:'100%',
    owners:['merch','data'],  consumers:['ops','cs','product'],
    desc:'Per-merchant delivery success rate. The commercial output metric. Drives merchant retention, SLA contracts, and re-attempt cost.',
    calc:'Successfully delivered parcels / Total shipped parcels per merchant × 100',
    source:'Redshift: fact_deliveries grouped by merchant_id, filtered outcome = "delivered"',
    stakeholders:'Merchant Success (commercial), VP Commercial (contract), Ops (root cause), Data (reporting)' },
]

const PILLAR_COLORS = { Stars:'#16A34A', Hubs:'#2563EB', Merchants:'#D97706' }

export default function Framework() {
  const [activeKpi, setActiveKpi] = useState('backlog')
  const [pivot, setPivot] = useState('kpi') // 'kpi' | 'vertical'

  const kpi = KPIS.find(k => k.id === activeKpi)

  const getVerticalKpis = (vid) => KPIS.filter(k => k.owners.includes(vid) || k.consumers.includes(vid))

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

      {/* Formula */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:24,
        marginBottom:48, boxShadow:T.shadow, display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>HeartBeat Score Formula</div>
          <code style={{ fontSize:15, color:T.text, fontFamily:'monospace', fontWeight:600 }}>
            HB = (<span style={{color:'#16A34A'}}>Stars × 0.30</span>) + (<span style={{color:'#2563EB'}}>Hubs × 0.50</span>) + (<span style={{color:'#D97706'}}>Merchants × 0.20</span>)
          </code>
        </div>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, minWidth:300 }}>
          {[
            {label:'Stars OKR',w:'30%',owner:'Field Ops',color:'#16A34A'},
            {label:'Hubs OKR', w:'50%',owner:'Hub Ops', color:'#2563EB'},
            {label:'Merchants OKR',w:'20%',owner:'Merchant Success',color:'#D97706'},
          ].map(p => (
            <div key={p.label} style={{ padding:'12px 16px', borderRadius:8, background:T.borderSub, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:T.text }}>{p.w}</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Owner: {p.owner}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pivot toggle */}
      <div style={{ display:'flex', gap:2, marginBottom:32, background:T.borderSub, borderRadius:8, padding:4, width:'fit-content', border:`1px solid ${T.border}` }}>
        {[{k:'kpi',label:'KPI View - select a metric'},
          {k:'vertical',label:'Vertical View - pivot by team'}].map(opt => (
          <button key={opt.k} onClick={() => setPivot(opt.k)} style={{
            padding:'8px 20px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: pivot===opt.k ? T.card : 'transparent',
            color: pivot===opt.k ? T.text : T.textSec,
            boxShadow: pivot===opt.k ? T.shadow : 'none', transition:'all 0.15s'
          }}>{opt.label}</button>
        ))}
      </div>

      {/* KPI View */}
      {pivot === 'kpi' && (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
          {/* KPI list */}
          <div style={{ display:'flex', flexDirection:'column', gap:2, background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.shadow }}>
            {KPIS.map(k => (
              <button key={k.id} onClick={() => setActiveKpi(k.id)}
                style={{ padding:'12px 16px', border:'none', borderBottom:`1px solid ${T.border}`,
                  background: activeKpi===k.id ? T.borderSub : 'transparent',
                  cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:PILLAR_COLORS[k.pillar], flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{k.label}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{k.pillar} · {k.weight}</div>
                </div>
              </button>
            ))}
          </div>

          {/* KPI detail */}
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
                  <div style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:T.mono }}>{kpi.calc}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:16, marginBottom:8 }}>Data Source</div>
                  <div style={{ background:T.borderSub, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:T.mono }}>{kpi.source}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>OKR Owners (accountable)</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                    {kpi.owners.map((v,i) => {
                      const vert = VERTICALS.find(vt=>vt.id===v)
                      return <span key={i} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:T.redLight, color:T.red, border:`1px solid ${T.redBorder}` }}>{vert?.label}</span>
                    })}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Verticals Monitoring</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                    {kpi.consumers.map((v,i) => {
                      const vert = VERTICALS.find(vt=>vt.id===v)
                      return <span key={i} style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, background:T.borderSub, color:T.textSec, border:`1px solid ${T.border}` }}>{vert?.label}</span>
                    })}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Stakeholder Map</div>
                  <p style={{ fontSize:13, color:T.textSec, lineHeight:1.7 }}>{kpi.stakeholders}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vertical View */}
      {pivot === 'vertical' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {VERTICALS.map(vert => {
            const owned = KPIS.filter(k => k.owners.includes(vert.id))
            const monitoring = KPIS.filter(k => k.consumers.includes(vert.id) && !k.owners.includes(vert.id))
            return (
              <div key={vert.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:22, boxShadow:T.shadow }}>
                <div style={{ fontSize:14, fontWeight:800, color:T.text, marginBottom:4 }}>{vert.label}</div>
                <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>{vert.owner}</div>
                <div style={{ fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Owns & Accountable</div>
                {owned.length ? owned.map((k,i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:PILLAR_COLORS[k.pillar], flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{k.label}</span>
                    <span style={{ fontSize:10, color:T.textMuted, marginLeft:'auto' }}>{k.pillar}</span>
                  </div>
                )) : <div style={{ fontSize:12, color:T.textMuted }}>-</div>}
                {monitoring.length > 0 && <>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:16, marginBottom:8 }}>Monitors</div>
                  {monitoring.map((k,i) => (
                    <div key={i} style={{ fontSize:12, color:T.textSec, marginBottom:4, paddingLeft:8, borderLeft:`2px solid ${T.border}` }}>{k.label}</div>
                  ))}
                </>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
