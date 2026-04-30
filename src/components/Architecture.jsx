
import React, { useState } from 'react'
import { T } from './theme'

/* Medallion Architecture layers */
const MEDALLION = [
  {
    tier: 'Bronze', subtitle: 'Raw Ingestion Layer', color: '#CD7F32',
    bg: '#FDF6EE', border: '#CD7F3240',
    desc: 'Exact copy of operational MongoDB events. No transformation. Every raw document preserved with source timestamp. This is the immutable audit trail.',
    tables: [
      'delivery_attempts — raw driver scan events',
      'hub_receipts — inbound parcel scans (raw)',
      'dispatch_events — OFD assignments (raw)',
      'merchant_orders — order metadata from API',
      'pickup_events — first mile inductions',
      'sort_events — sorting facility logs',
    ],
    latency: 'Near real-time (5 min micro-batch)',
    owner: 'Data Engineering',
  },
  {
    tier: 'Silver', subtitle: 'Validated & Enriched Layer', color: '#94A3B8',
    bg: '#F8FAFC', border: '#94A3B840',
    desc: 'Cleaned, deduplicated, and enriched data ready for analytics. GPS outliers removed, addresses normalised, middle-mile leakage flagged, duplicate scans collapsed.',
    tables: [
      'stg_delivery_attempts — validated, GPS-clean',
      'stg_hub_receipts — deduped, latency-flagged',
      'stg_dispatch_events — OFD with backlog flag',
      'stg_merchant_orders — address-normalised',
      'ref_address_lookup — enriched GPS index',
      'flag_middle_mile_leakage — no-receipt parcels',
    ],
    latency: '30-min refresh for ops KPIs',
    owner: 'Data Engineering + Analytics',
  },
  {
    tier: 'Gold', subtitle: 'Business Aggregates Layer', color: '#D97706',
    bg: '#FFFBEB', border: '#D9770640',
    desc: 'Business-ready aggregated tables powering dashboards and the HeartBeat score. Pre-computed at hub x day grain. Optimised for fast BI queries.',
    tables: [
      'fact_deliveries — one row per attempt + outcome',
      'agg_heartbeat_daily — HB score per hub per day',
      'agg_merchant_dsr — rolling DSR per merchant',
      'dim_hubs / dim_stars / dim_merchants — reference',
      'agg_hub_ops_daily — backlog, dispatch, throughput',
      'agg_star_performance — ASR, FDDS, fake rate',
    ],
    latency: 'Nightly T-1 (executive view)',
    owner: 'Analytics / BI',
  },
]

const MedallionChart = () => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 28px', boxShadow: T.shadow }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {MEDALLION.map((m, i) => (
        <React.Fragment key={m.tier}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color }}/>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.tier}</span>
          </div>
          {i < MEDALLION.length - 1 && (
            <svg width="48" height="14" viewBox="0 0 48 14" style={{ margin: '0 12px' }}>
              <line x1="0" y1="7" x2="36" y2="7" stroke={T.border} strokeWidth="1.5"/>
              <polygon points="36,3 48,7 36,11" fill={T.border}/>
            </svg>
          )}
        </React.Fragment>
      ))}
      <svg width="48" height="14" viewBox="0 0 48 14" style={{ margin: '0 12px' }}>
        <line x1="0" y1="7" x2="36" y2="7" stroke={T.border} strokeWidth="1.5"/>
        <polygon points="36,3 48,7 36,11" fill={T.border}/>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.red }}/>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>Intelligence</span>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
      {MEDALLION.map(m => (
        <div key={m.tier} style={{ border: `1px solid ${m.border}`, borderTop: `3px solid ${m.color}`,
          borderRadius: 10, padding: 20, background: m.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: m.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, color: '#fff' }}>{m.tier[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{m.tier} Layer</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{m.subtitle}</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.65, marginBottom: 14 }}>{m.desc}</p>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Tables / Collections</div>
          {m.tables.map((t, i) => (
            <div key={i} style={{ fontSize: 11, color: T.mono, fontFamily: 'monospace', padding: '4px 8px',
              background: 'rgba(255,255,255,0.7)', borderRadius: 4, marginBottom: 4,
              borderLeft: `2px solid ${m.color}` }}>{t}</div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: T.textMuted, background: 'rgba(255,255,255,0.8)',
              padding: '2px 8px', borderRadius: 10, border: `1px solid ${m.border}` }}>Latency: {m.latency}</span>
            <span style={{ fontSize: 10, color: T.textMuted, background: 'rgba(255,255,255,0.8)',
              padding: '2px 8px', borderRadius: 10, border: `1px solid ${m.border}` }}>Owner: {m.owner}</span>
          </div>
        </div>
      ))}
    </div>

    <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: T.red,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>I</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.red, marginBottom: 2 }}>Intelligence Layer - Serves Gold</div>
        <div style={{ fontSize: 12, color: T.textSec }}>HeartBeat Score computation (Stars x0.30 + Hubs x0.50 + Merchants x0.20) - Executive dashboard - Hub drill-down - Slack/email alert engine - Merchant portal DSR tier</div>
      </div>
      <div style={{ fontSize: 10, color: T.red, background: T.redLight, border: `1px solid ${T.redBorder}`,
        padding: '3px 10px', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>Computed nightly - T-1</div>
    </div>
  </div>
)

const STEPS = [
  { n: '01', title: 'MongoDB',        sub: 'Operational event store', detail: 'delivery_attempts, hub_receipts, dispatch_events, merchant_orders', color: T.green },
  { n: '02', title: 'ETL Pipeline',   sub: 'Transform and validate',  detail: 'Staging schema, data quality checks, address normalisation, GPS outlier filtering', color: T.blue },
  { n: '03', title: 'Redshift DW',    sub: 'Analytics warehouse',     detail: 'fact_deliveries, agg_heartbeat_daily, dim_hubs, dim_stars, dim_merchants', color: T.amber },
  { n: '04', title: 'HeartBeat Layer',sub: 'Composite OKR scoring',   detail: 'Stars x0.30 + Hubs x0.50 + Merchants x0.20, computed nightly at hub granularity', color: T.red },
  { n: '05', title: 'Intelligence',   sub: 'Dashboards and alerts',   detail: 'Executive dashboard, hub-level drill-down, Slack threshold alerts, merchant portal', color: T.mono },
]

const PipelineChart = () => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 24px', boxShadow: T.shadow }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 130, padding: '0 8px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.color + '14',
              border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: s.color, marginBottom: 12 }}>{s.n}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 10 }}>{s.sub}</div>
            <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.6, background: T.cardSub,
              border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', textAlign: 'left' }}>{s.detail}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: 22, flexShrink: 0 }}>
              <svg width="36" height="16" viewBox="0 0 36 16">
                <line x1="0" y1="8" x2="26" y2="8" stroke={T.border} strokeWidth="2"/>
                <polygon points="26,4 36,8 26,12" fill={T.border}/>
              </svg>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
)

const ScoreTree = () => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 24px', boxShadow: T.shadow }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{ background: T.red, color: '#fff', borderRadius: 10, padding: '12px 48px',
        fontWeight: 800, fontSize: 17, boxShadow: '0 4px 12px rgba(227,6,19,0.22)' }}>
        HeartBeat Score
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <svg width="640" height="36" viewBox="0 0 640 36">
        <line x1="320" y1="0" x2="320" y2="18" stroke={T.border} strokeWidth="2"/>
        <line x1="100" y1="18" x2="540" y2="18" stroke={T.border} strokeWidth="2"/>
        <line x1="100" y1="18" x2="100" y2="36" stroke={T.border} strokeWidth="2"/>
        <line x1="320" y1="18" x2="320" y2="36" stroke={T.border} strokeWidth="2"/>
        <line x1="540" y1="18" x2="540" y2="36" stroke={T.border} strokeWidth="2"/>
      </svg>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      <div style={{ border: `1px solid ${T.green}40`, borderTop: `3px solid ${T.green}`, borderRadius: 8, padding: 18, background: T.greenLight }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Stars OKR</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.green, marginBottom: 2 }}>30%</div>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>Driver layer across all hubs</div>
        {['ASR% - Attempt Success Rate','FDDS% - First Day Delivery','Fake Attempt Rate (negative)','OFD Volume per Star','CRP% - Return Pickup Rate','CRE% - Exchange Rate'].map((k, i) => (
          <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '5px 9px', background: 'rgba(255,255,255,0.75)',
            borderRadius: 4, marginBottom: 4, borderLeft: `2px solid ${T.green}` }}>{k}</div>
        ))}
      </div>
      <div style={{ border: `1px solid ${T.blue}40`, borderTop: `3px solid ${T.blue}`, borderRadius: 8, padding: 18, background: T.blueLight }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Hubs OKR</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.blue, marginBottom: 2 }}>50%</div>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>Operations layer, majority weight</div>
        {['Delivery Promised %','Backlog Rate (negative)','Same-Day Dispatch Rate','Lost Parcel % (negative)','Damaged Rate (negative)','Cycle Adaptation Score'].map((k, i) => (
          <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '5px 9px', background: 'rgba(255,255,255,0.75)',
            borderRadius: 4, marginBottom: 4, borderLeft: `2px solid ${T.blue}` }}>{k}</div>
        ))}
      </div>
      <div style={{ border: `1px solid ${T.amber}40`, borderTop: `3px solid ${T.amber}`, borderRadius: 8, padding: 18, background: T.amberLight }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Merchants OKR</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.amber, marginBottom: 2 }}>20%</div>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>Business outcome layer</div>
        {['DSR% - Delivery Success Rate','Merchant Tier Classification','RTO Rate (return to origin)'].map((k, i) => (
          <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '5px 9px', background: 'rgba(255,255,255,0.75)',
            borderRadius: 4, marginBottom: 4, borderLeft: `2px solid ${T.amber}` }}>{k}</div>
        ))}
        <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.75)', borderRadius: 6, padding: '10px 12px', border: `1px solid ${T.amber}30` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, marginBottom: 6 }}>TIER THRESHOLDS</div>
          {[['Bad Business','65% and below'],['Default','65-70%'],['Good','70-75%'],['Very Good','75-80%'],['Excellent','above 80%']].map(([label, range]) => (
            <div key={label} style={{ fontSize: 10, color: T.textSec, display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>{label}</span><span style={{ fontWeight: 700 }}>{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const LAYERS = [
  { label:'MongoDB', role:'Operational Event Store', color: T.green,
    items:['parcel_events - scan timestamps per parcel','delivery_attempts - driver GPS, outcome, timestamp','hub_receipts - received_at, hub_id','dispatch_events - OFD assignments','merchant_orders - order metadata, address, COD'] },
  { label:'ETL Pipeline', role:'Ingestion, Transform and Validate', color: T.blue,
    items:['Staging schema - raw ingestion with source timestamp preserved','Data quality checks: nulls, duplicates, GPS outliers','Address normalisation enrichment','Middle-mile leakage flag (no hub receipt within 24h)','30-min micro-batch refresh for operational KPIs'] },
  { label:'Analytics Layer (Redshift)', role:'Fact and Dimension Tables', color: T.amber,
    items:['fact_deliveries - one row per attempt, all outcomes','dim_hubs, dim_stars, dim_merchants - reference tables','agg_heartbeat_daily - pre-computed OKR scores per hub','agg_merchant_dsr - rolling DSR per merchant x period'] },
  { label:'HeartBeat BI', role:'Intelligence and Decision Layer', color: T.red,
    items:['HeartBeat Score: Stars x0.30 + Hubs x0.50 + Merchants x0.20','Executive dashboard - network to city to hub drill-down','Alert engine - threshold breaches sent to Slack or email','Merchant portal - tier badge, DSR trend, recommendations'] },
]

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState(null)

  return (
    <div style={{ padding: '100px 2rem 80px', maxWidth: 1340, margin: '0 auto' }}>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 03: Data Architecture</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginBottom: 14 }}>
        From operational event to executive decision.
      </h2>
      <p style={{ fontSize: 16, color: T.textSec, lineHeight: 1.8, maxWidth: 700, marginBottom: 48 }}>
        Bosta already operates MongoDB for event capture and Redshift as its analytics warehouse.
        The HeartBeat framework is a BI intelligence layer on top, requiring no rip-and-replace,
        just structured aggregation and a well-defined scoring model.
      </p>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        Medallion Architecture - Bronze, Silver, Gold
      </div>
      <div style={{ marginBottom: 48 }}><MedallionChart /></div>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        End-to-End Data Pipeline
      </div>
      <div style={{ marginBottom: 48 }}><PipelineChart /></div>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        HeartBeat Score Computation
      </div>
      <div style={{ marginBottom: 48 }}><ScoreTree /></div>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
        Layer Reference - click to expand
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.shadow }}>
        {LAYERS.map((layer, i) => {
          const open = activeLayer === i
          return (
            <div key={i} style={{ borderBottom: i < LAYERS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <button onClick={() => setActiveLayer(open ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
                  background: open ? T.cardSub : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: layer.color, flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{layer.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{layer.role}</div>
                </div>
                <span style={{ fontSize: 14, color: T.textMuted }}>{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div style={{ padding: '12px 24px 20px 54px', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {layer.items.map((item, j) => (
                    <div key={j} style={{ padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                      <span style={{ fontSize: 12, color: T.mono, fontFamily: 'monospace' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { title: 'Middle-Mile Leakage', body: 'Parcels not receiving a hub receipt scan within 24h are flagged as Middle Mile delays. Excluded from Hub KPIs but surfaced as a percentage alert. Hubs are not penalised for upstream failure.' },
          { title: 'Latency Design', body: 'Ops-facing KPIs refresh every 30 minutes via streaming. HeartBeat composite score is computed nightly as T-1 in Redshift. Executives see prior day score; ops managers see near-real-time hub data.' },
          { title: 'Schema Governance', body: 'All KPI definitions stored in a schema registry. Any upstream MongoDB schema change triggers a validation alert before reaching the transformation layer. Prevents silent data quality degradation.' },
        ].map((c, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: T.shadow }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>{c.title}</div>
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
