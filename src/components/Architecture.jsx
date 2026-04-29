
import React, { useState } from 'react'
import { T } from './theme'

/* ── Draw.io-style SVG components ── */
const Box = ({ x, y, w, h, label, sub, fill='#fff', stroke='#CBD5E1', bold=false, red=false }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={red ? '#FEF2F2' : fill} stroke={red ? '#E30613' : stroke} strokeWidth={red?1.5:1}/>
    <text x={x+w/2} y={y+h/2-(sub?7:0)} textAnchor="middle" dominantBaseline="middle"
      fontSize={bold?12:11} fontWeight={bold?700:600} fill={red ? '#E30613' : '#0F172A'} fontFamily="Inter,sans-serif">
      {label}
    </text>
    {sub && <text x={x+w/2} y={y+h/2+10} textAnchor="middle" dominantBaseline="middle"
      fontSize={9} fontWeight={400} fill="#94A3B8" fontFamily="Inter,sans-serif">{sub}</text>}
  </g>
)

const Cyl = ({ x, y, w, h, label, sub, stroke='#CBD5E1' }) => (
  <g>
    <rect x={x} y={y+8} width={w} height={h-8} rx={0} fill="#F8FAFC" stroke={stroke} strokeWidth={1}/>
    <ellipse cx={x+w/2} cy={y+8} rx={w/2} ry={8} fill="#F1F5F9" stroke={stroke} strokeWidth={1}/>
    <ellipse cx={x+w/2} cy={y+h} rx={w/2} ry={8} fill="#F1F5F9" stroke={stroke} strokeWidth={1}/>
    <text x={x+w/2} y={y+h/2+4} textAnchor="middle" dominantBaseline="middle"
      fontSize={11} fontWeight={700} fill="#0F172A" fontFamily="Inter,sans-serif">{label}</text>
    {sub && <text x={x+w/2} y={y+h/2+17} textAnchor="middle" dominantBaseline="middle"
      fontSize={9} fill="#94A3B8" fontFamily="Inter,sans-serif">{sub}</text>}
  </g>
)

const Arrow = ({ x1,y1,x2,y2,label,dashed=false }) => {
  const dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy)
  const ux = dx/len, uy = dy/len
  const mx = (x1+x2)/2, my = (y1+y2)/2
  const ex = x2 - ux*8, ey = y2 - uy*8
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke="#CBD5E1" strokeWidth={1.5}
        strokeDasharray={dashed ? '5 3' : 'none'}/>
      <polygon points={`${x2},${y2} ${x2-ux*8+uy*4},${y2-uy*8-ux*4} ${x2-ux*8-uy*4},${y2-uy*8+ux*4}`}
        fill="#94A3B8"/>
      {label && <text x={mx+4} y={my-4} fontSize={9} fill="#94A3B8" fontFamily="Inter,sans-serif">{label}</text>}
    </g>
  )
}

const Lane = ({ x, y, w, h, label, color='#F8FAFC' }) => (
  <g>
    <rect x={x} y={y} width={32} height={h} fill={color} stroke="#E2E8F0" strokeWidth={1}/>
    <rect x={x+32} y={y} width={w-32} height={h} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1}/>
    <text x={x+16} y={y+h/2} textAnchor="middle" dominantBaseline="middle"
      fontSize={9} fontWeight={700} fill="#64748B" fontFamily="Inter,sans-serif"
      transform={`rotate(-90,${x+16},${y+h/2})`}>{label}</text>
  </g>
)

/* ── Pipeline Flowchart ── */
const PipelineChart = () => (
  <svg viewBox="0 0 820 320" style={{ width:'100%', background:'#fff', borderRadius:12, border:`1px solid ${T.border}` }}>
    {/* Swimlanes */}
    <Lane x={0}   y={0} w={820} h={80}  label="Source Systems" color="#F0FDF4"/>
    <Lane x={0}   y={80} w={820} h={80} label="Ingestion / ETL"  color="#EFF6FF"/>
    <Lane x={0}   y={160} w={820} h={80} label="Warehouse"       color="#FFFBEB"/>
    <Lane x={0}   y={240} w={820} h={80} label="BI / Output"     color="#FEF2F2"/>

    {/* Source layer */}
    <Cyl x={50}  y={16} w={100} h={50} label="MongoDB" sub="Operational events" stroke="#16A34A"/>
    <Box x={200} y={20} w={100} h={40} label="Kafka / CDC" sub="Debezium connector" stroke="#2563EB"/>
    <Box x={350} y={20} w={100} h={40} label="Batch API" sub="Merchant orders" stroke="#2563EB"/>
    <Arrow x1={150} y1={40} x2={200} y2={40}/>
    <Arrow x1={300} y1={40} x2={350} y2={40}/>

    {/* ETL layer */}
    <Box x={80}  y={96} w={110} h={48} label="Staging Schema" sub="Raw → validated" stroke="#2563EB"/>
    <Box x={240} y={96} w={120} h={48} label="Transformation" sub="Agg + enrichment" stroke="#2563EB"/>
    <Box x={420} y={96} w={110} h={48} label="Data Quality" sub="Null / dupe checks" stroke="#2563EB"/>
    <Box x={590} y={96} w={110} h={48} label="Schema Registry" sub="Version control" stroke="#2563EB"/>
    <Arrow x1={190} y1={120} x2={240} y2={120}/>
    <Arrow x1={360} y1={120} x2={420} y2={120}/>
    <Arrow x1={530} y1={120} x2={590} y2={120}/>
    {/* vertical arrows src→etl */}
    <Arrow x1={100} y1={66} x2={100} y2={96}/>
    <Arrow x1={400} y1={60} x2={300} y2={96}/>

    {/* Warehouse layer */}
    <Cyl x={50}  y={178} w={110} h={50} label="Redshift" sub="Analytics DW" stroke="#D97706"/>
    <Box x={200} y={182} w={120} h={40} label="fact_deliveries" sub="attempt-level grain" stroke="#D97706"/>
    <Box x={370} y={182} w={120} h={40} label="agg_heartbeat_daily" sub="pre-computed scores" stroke="#D97706"/>
    <Box x={550} y={182} w={120} h={40} label="dim_hubs / dim_stars" sub="reference tables" stroke="#D97706"/>
    <Arrow x1={160} y1={200} x2={200} y2={200}/>
    <Arrow x1={320} y1={200} x2={370} y2={200}/>
    <Arrow x1={490} y1={200} x2={550} y2={200}/>
    <Arrow x1={135} y1={144} x2={135} y2={178}/>

    {/* BI layer */}
    <Box x={50}  y={258} w={130} h={44} label="HeartBeat Dashboard" sub="Executive + Ops view" red={true}/>
    <Box x={220} y={258} w={120} h={44} label="Alert Engine" sub="Slack / email triggers" stroke="#E30613"/>
    <Box x={390} y={258} w={120} h={44} label="Merchant Portal" sub="Per-merchant DSR" stroke="#E30613"/>
    <Box x={560} y={258} w={130} h={44} label="API / Export" sub="Downstream systems" stroke="#E30613"/>
    <Arrow x1={180} y1={280} x2={220} y2={280}/>
    <Arrow x1={340} y1={280} x2={390} y2={280}/>
    <Arrow x1={510} y1={280} x2={560} y2={280}/>
    <Arrow x1={260} y1={222} x2={115} y2={258}/>
  </svg>
)

/* ── HeartBeat Score Computation Tree ── */
const ScoreTree = () => (
  <svg viewBox="0 0 820 420" style={{ width:'100%', background:'#fff', borderRadius:12, border:`1px solid ${T.border}` }}>
    {/* Root */}
    <Box x={310} y={16} w={200} h={50} label="HeartBeat Score" sub="Composite OKR" bold={true} red={true}/>

    {/* Three pillars */}
    <Box x={60}  y={120} w={160} h={48} label="Stars OKR" sub="Weight: 30%" fill="#F0FDF4" stroke="#16A34A"/>
    <Box x={330} y={120} w={160} h={48} label="Hubs OKR"  sub="Weight: 50%" fill="#EFF6FF" stroke="#2563EB"/>
    <Box x={600} y={120} w={160} h={48} label="Merchants OKR" sub="Weight: 20%" fill="#FFFBEB" stroke="#D97706"/>

    {/* Connecting lines from root to pillars */}
    <Arrow x1={410} y1={66}  x2={140} y2={120}/>
    <Arrow x1={410} y1={66}  x2={410} y2={120}/>
    <Arrow x1={410} y1={66}  x2={680} y2={120}/>

    {/* Stars KPIs */}
    {[
      [35,  220,'ASR%','Attempt success rate','30%'],
      [35,  270,'FDDS%','First day delivery','20%'],
      [35,  320,'OFD/Star','Avg OFD volume','20%'],
      [35,  370,'Fake Attempt','Fraudulent logs ↓','10%'],
    ].map(([x,y,label,sub,wt],i) => (
      <g key={i}>
        <Box x={x} y={y} w={140} h={38} label={label} sub={`${sub} · wt ${wt}`} stroke="#16A34A"/>
        <Arrow x1={140} y1={144} x2={x+70} y2={y} dashed/>
      </g>
    ))}

    {/* Hubs KPIs */}
    {[
      [300, 220,'Del. Promised%','SLA adherence','15%'],
      [300, 270,'Backlog%','Undispatched ↓','15%'],
      [300, 320,'Lost Parcel%','Asset loss ↓','15%'],
      [300, 370,'Dispatch Rate','Same-day','10%'],
    ].map(([x,y,label,sub,wt],i) => (
      <g key={i}>
        <Box x={x} y={y} w={145} h={38} label={label} sub={`${sub} · wt ${wt}`} stroke="#2563EB"/>
        <Arrow x1={410} y1={168} x2={x+72} y2={y} dashed/>
      </g>
    ))}

    {/* Merchants KPIs */}
    {[
      [565, 220,'DSR%','Per-merchant delivery','100%'],
      [565, 270,'Merchant Tier','≤65% Bad Business','—'],
    ].map(([x,y,label,sub,wt],i) => (
      <g key={i}>
        <Box x={x} y={y} w={145} h={38} label={label} sub={`${sub} · wt ${wt}`} stroke="#D97706"/>
        <Arrow x1={680} y1={168} x2={x+72} y2={y} dashed/>
      </g>
    ))}
  </svg>
)

const LAYERS = [
  { label:'MongoDB', role:'Operational Event Store', color:'#16A34A',
    items:['parcel_events — scan timestamps per parcel','delivery_attempts — driver GPS, outcome, timestamp','hub_receipts — received_at, hub_id','dispatch_events — OFD assignments','merchant_orders — order metadata, address, COD'] },
  { label:'Kafka / Debezium CDC', role:'Change Data Capture', color:'#2563EB',
    items:['Real-time event streaming from MongoDB','Schema change detection + alerting','Dead-letter queue for failed events','30-min micro-batch fallback for non-streaming collections'] },
  { label:'Staging (Redshift)', role:'Raw → Validated', color:'#7C3AED',
    items:['Raw ingestion with source timestamp preserved','Data quality checks: nulls, duplicates, GPS outliers','Address normalisation enrichment','Middle-mile leakage flag (no hub receipt within 24h)'] },
  { label:'Analytics Layer (Redshift)', role:'Fact & Dimension Tables', color:'#D97706',
    items:['fact_deliveries — one row per attempt, all outcomes','dim_hubs, dim_stars, dim_merchants — reference','agg_heartbeat_daily — pre-computed OKR scores per hub','agg_merchant_dsr — rolling DSR per merchant × period'] },
  { label:'HeartBeat BI', role:'Intelligence & Decision Layer', color:'#E30613',
    items:['HeartBeat Score computation (Stars×0.30 + Hubs×0.50 + Merch×0.20)','Executive dashboard — network → city → hub drill-down','Alert engine — threshold breaches → Slack / email','Merchant portal — tier badge, DSR trend, recommendations'] },
]

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState(null)

  return (
    <div style={{ padding:'100px 2rem 80px', maxWidth:1340, margin:'0 auto' }}>
      <div style={{ marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.red, letterSpacing:'0.1em', textTransform:'uppercase' }}>Section 03 — Data Architecture</span>
      </div>
      <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:800, letterSpacing:'-0.03em', color:T.text, marginBottom:14 }}>
        From operational event to executive decision.
      </h2>
      <p style={{ fontSize:16, color:T.textSec, lineHeight:1.8, maxWidth:700, marginBottom:48 }}>
        Bosta already operates MongoDB for event capture and Redshift as its analytics warehouse.
        The HeartBeat framework is a BI intelligence layer on top — no rip-and-replace, just
        structured aggregation and a well-defined scoring model.
      </p>

      {/* Pipeline flowchart */}
      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>
        End-to-End Data Pipeline
      </div>
      <div style={{ marginBottom:48 }}><PipelineChart/></div>

      {/* Score computation tree */}
      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>
        HeartBeat Score Computation Tree
      </div>
      <div style={{ marginBottom:48 }}><ScoreTree/></div>

      {/* Layer deep-dives */}
      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:20 }}>
        Layer Reference — click to expand
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2, background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.shadow }}>
        {LAYERS.map((layer,i) => {
          const open = activeLayer === i
          return (
            <div key={i} style={{ borderBottom: i < LAYERS.length-1 ? `1px solid ${T.border}` : 'none' }}>
              <button onClick={() => setActiveLayer(open ? null : i)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'16px 24px',
                  background: open ? T.borderSub : 'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:layer.color, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{layer.label}</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>{layer.role}</div>
                </div>
                <span style={{ fontSize:14, color:T.textMuted }}>{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div style={{ padding:'12px 24px 20px 54px', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {layer.items.map((item,j) => (
                    <div key={j} style={{ padding:'8px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
                      <span style={{ fontSize:12, color:T.mono, fontFamily:'monospace' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Design notes */}
      <div style={{ marginTop:40, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { title:'Middle-Mile Leakage', body:'Parcels not receiving a hub receipt scan within 24h are flagged as Middle Mile delays. Excluded from Hub KPIs but surfaced as a % alert — hubs are not penalised for upstream failure.' },
          { title:'Latency Design', body:'Ops-facing KPIs refresh every 30 min via Kafka streaming. HeartBeat composite score computed nightly as T-1 in Redshift. Executives see yesterday\'s score, ops managers see near-real-time hub data.' },
          { title:'Schema Governance', body:'All KPI definitions stored in Schema Registry. Any upstream MongoDB schema change triggers a validation alert before reaching the transformation layer. Prevents silent data quality degradation.' },
        ].map((c,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.shadow }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>{c.title}</div>
            <p style={{ fontSize:13, color:T.textSec, lineHeight:1.7 }}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
