
import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ALL_DATA, aggregate, getTrendData, CITY_POSITIONS } from './dashboardData'

const RED   = '#E30613'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const BLUE  = '#3B82F6'

const hbColor = (v) => v >= 88 ? GREEN : v >= 78 ? AMBER : RED
const hbLabel = (v) => v >= 88 ? 'Strong' : v >= 78 ? 'Caution' : 'Critical'

/* ── Circular score ring ─────────────────────────── */
const Ring = ({ value, size=90, stroke=7, color }) => {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const col = color || hbColor(value)
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-value/100)} strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 0.6s ease' }}/>
    </svg>
  )
}

/* ── Egypt geo-network map ───────────────────────── */
const EDGES = [
  ['Alexandria','Greater Cairo'],['Alexandria','Mansoura'],
  ['Greater Cairo','Giza'],['Greater Cairo','Mansoura'],
  ['Greater Cairo','Assiut'],['Giza','Assiut'],
]
const GeoMap = ({ cities, onSelect, selected }) => {
  const cityMap = useMemo(() => {
    const m = {}
    cities.forEach(c => { m[c.name] = c })
    return m
  }, [cities])

  return (
    <div style={{ background:'#080A10', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20, height:'100%' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
        Network Geography - click city to drill
      </div>
      <svg viewBox="0 0 340 320" style={{ width:'100%', maxHeight:300 }}>
        {/* Grid dots */}
        {Array.from({length:8}, (_,row) => Array.from({length:10}, (_,col) => (
          <circle key={`${row}-${col}`} cx={col*38+10} cy={row*38+10} r={1} fill="rgba(255,255,255,0.04)"/>
        )))}

        {/* Edges */}
        {EDGES.map(([a,b],i) => {
          const pa = CITY_POSITIONS[a], pb = CITY_POSITIONS[b]
          if (!pa || !pb) return null
          return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="4 4"/>
        })}

        {/* City nodes */}
        {Object.entries(CITY_POSITIONS).map(([cityName, pos]) => {
          const city = cityMap[cityName]
          if (!city) return null
          const score = city.scHB || 0
          const col = hbColor(score)
          const isSelected = selected === cityName
          const r = cityName === 'Greater Cairo' ? 22 : 16
          return (
            <g key={cityName} onClick={() => onSelect(cityName)} style={{ cursor:'pointer' }}>
              {/* Halo glow */}
              <circle cx={pos.x} cy={pos.y} r={r+10} fill={`${col}15`} style={{ transition:'all 0.3s' }}/>
              {/* Outer ring */}
              <circle cx={pos.x} cy={pos.y} r={r+5} fill="none" stroke={`${col}40`} strokeWidth={isSelected?2:1}/>
              {/* Main circle */}
              <circle cx={pos.x} cy={pos.y} r={r} fill={isSelected ? `${col}30` : '#13151F'} stroke={col} strokeWidth={isSelected?2.5:1.5}/>
              {/* Score text */}
              <text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle"
                fontSize={cityName==='Greater Cairo'?9:8} fontWeight="700" fill="#E8EAF0">
                {score.toFixed(0)}%
              </text>
              {/* City label */}
              <text x={pos.x} y={pos.y+r+13} textAnchor="middle" fontSize={9} fontWeight="600" fill="#6B7280">
                {pos.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ── KPI bar row ─────────────────────────────────── */
const KpiBar = ({ label, value, isNeg }) => {
  const col = isNeg ? (value>8?RED:value>3?AMBER:GREEN) : (value>=88?GREEN:value>=75?AMBER:RED)
  const fill = isNeg ? Math.min(value*5,100) : value
  return (
    <div style={{ marginBottom:9 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:11, color:'#6B7280' }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'monospace' }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
        <div style={{ height:'100%', width:`${fill}%`, background:col, borderRadius:2, transition:'width 0.4s' }}/>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#13151F', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px' }}>
      <div style={{ fontSize:11, color:'#4B5563', marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color, fontWeight:600 }}>{p.name}: {p.value.toFixed(1)}%</div>
      ))}
    </div>
  )
}

/* ── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const [period, setPeriod]           = useState(30)
  const [expandedCity, setExpandedCity]   = useState(null)
  const [expandedZone, setExpandedZone]   = useState(null)
  const [expandedHub, setExpandedHub]     = useState(null)
  const [mapSelected, setMapSelected]     = useState(null)
  const [showTrend, setShowTrend]         = useState(false)

  const filteredData = useMemo(() => ALL_DATA.slice(0, period * 18), [period])
  const cities       = useMemo(() => aggregate(filteredData), [filteredData])
  const prevCities   = useMemo(() => aggregate(ALL_DATA.slice(period*18, period*36)), [period])
  const trendData    = useMemo(() => getTrendData(ALL_DATA, period), [period])

  const netAvg = (key) => cities.length ? cities.reduce((s,c)=>s+(c[key]||0),0)/cities.length : 0
  const prevAvg= (key) => prevCities.length ? prevCities.reduce((s,c)=>s+(c[key]||0),0)/prevCities.length : 0

  const hb     = netAvg('scHB')
  const stars  = netAvg('scStars')
  const hubs   = netAvg('scHubs')
  const merch  = netAvg('scMerch')
  const delta  = hb - prevAvg('scHB')

  const handleMapSelect = (cityName) => {
    setMapSelected(prev => prev === cityName ? null : cityName)
    if (expandedCity !== cityName) {
      setExpandedCity(cityName)
      setExpandedZone(null)
      setExpandedHub(null)
    }
  }

  return (
    <div style={{ minHeight:'100vh', padding:'100px 2rem 60px', maxWidth:1300, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40, flexWrap:'wrap', gap:16 }}>
        <div>
          <span style={{ fontSize:11, fontWeight:700, color:RED, letterSpacing:'0.1em', textTransform:'uppercase' }}>Section 04 - Live Demo</span>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, letterSpacing:'-0.03em', marginTop:6 }}>HeartBeat Dashboard</h2>
          <p style={{ color:'#4B5563', fontSize:13, marginTop:4 }}>Simulated network data · Click city nodes on the map or rows in the table to drill down</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[7,30,90].map(d=>(
            <button key={d} onClick={()=>{setPeriod(d);setExpandedCity(null);setExpandedZone(null);setExpandedHub(null);setMapSelected(null)}}
              style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer',
                background:period===d?RED:'#0D0F18', color:period===d?'#fff':'#6B7280',
                border:`1px solid ${period===d?RED:'rgba(255,255,255,0.08)'}`, transition:'all 0.2s' }}>
              {d===7?'7D':d===30?'30D':'90D'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero HeartBeat + Three Pillars ── */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20, marginBottom:24, background:'#0D0F18', border:`1px solid rgba(227,6,19,0.15)`, borderRadius:14, padding:28, borderTop:`3px solid ${RED}` }}>
        {/* HeartBeat hero */}
        <div style={{ display:'flex', alignItems:'center', gap:20, paddingRight:28, borderRight:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ position:'relative', width:110, height:110 }}>
            <Ring value={hb} size={110} stroke={9}/>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#4B5563', fontWeight:700, letterSpacing:'0.06em' }}>HB</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1 }}>{hb.toFixed(0)}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.08em' }}>HeartBeat Score</div>
            <div style={{ fontSize:42, fontWeight:900, color:hbColor(hb), letterSpacing:'-0.04em', lineHeight:1 }}>{hb.toFixed(1)}%</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:delta>=0?GREEN:RED }}>{delta>=0?'▲':'▼'} {Math.abs(delta).toFixed(1)}%</span>
              <span style={{ fontSize:11, color:'#4B5563' }}>vs prev {period}d</span>
              <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background:`${hbColor(hb)}18`, color:hbColor(hb) }}>{hbLabel(hb)}</span>
            </div>
          </div>
        </div>

        {/* Three pillar cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, alignItems:'center' }}>
          {[
            { label:'Stars OKR', key:'scStars', weight:'30%', color:GREEN, desc:'Driver layer' },
            { label:'Hubs OKR', key:'scHubs', weight:'50%', color:BLUE, desc:'Operations layer' },
            { label:'Merchants OKR', key:'scMerch', weight:'20%', color:AMBER, desc:'Business outcome' },
          ].map(p=>{
            const val = p.key==='scStars'?stars:p.key==='scHubs'?hubs:merch
            const col = p.color
            return (
              <div key={p.key} style={{ padding:16, borderRadius:10, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>{p.label}</span>
                  <span style={{ fontSize:10, color:'#374151', fontWeight:700 }}>{p.weight}</span>
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:'#E8EAF0', letterSpacing:'-0.03em' }}>{val.toFixed(1)}%</div>
                <div style={{ marginTop:10, height:3, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${val}%`, background:col, borderRadius:2, transition:'width 0.5s' }}/>
                </div>
                <div style={{ fontSize:10, color:'#4B5563', marginTop:6 }}>{p.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Map + Trend toggle ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <GeoMap cities={cities} onSelect={handleMapSelect} selected={mapSelected}/>

        <div style={{ background:'#0D0F18', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.08em' }}>Score Trend - {period}d</span>
            <button onClick={()=>setShowTrend(v=>!v)} style={{ fontSize:11, color: showTrend ? RED : '#4B5563', background:'transparent', border:'none', cursor:'pointer', fontWeight:700 }}>
              {showTrend ? 'Hide' : 'Show'} pillar lines
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:9,fill:'#374151'}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[60,100]} tick={{fontSize:9,fill:'#374151'}} axisLine={false} tickLine={false} width={28}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone" dataKey="scHB" name="HeartBeat" stroke={RED} strokeWidth={2.5} dot={false}/>
              {showTrend && <>
                <Line type="monotone" dataKey="scStars" name="Stars"    stroke={GREEN} strokeWidth={1} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scHubs"  name="Hubs"     stroke={BLUE}  strokeWidth={1} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scMerch" name="Merchants" stroke={AMBER} strokeWidth={1} dot={false} strokeDasharray="4 2"/>
              </>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Hierarchical drill table ── */}
      <div style={{ background:'#0D0F18', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 90px 90px 90px', gap:8, padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          {['Location','HeartBeat','Stars','Hubs','Merchants'].map(h=>(
            <div key={h} style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
          ))}
        </div>

        {cities.map(city => {
          const ce = expandedCity === city.name
          return (
            <React.Fragment key={city.name}>
              <div onClick={()=>{setExpandedCity(ce?null:city.name);setExpandedZone(null);setExpandedHub(null);setMapSelected(ce?null:city.name)}}
                style={{ display:'grid', gridTemplateColumns:'1fr 110px 90px 90px 90px', gap:8, padding:'13px 24px',
                  background: ce ? 'rgba(227,6,19,0.04)' : 'transparent',
                  borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:13, color: ce ? RED : '#4B5563' }}>{ce?'▾':'▸'}</span>
                  <span style={{ fontWeight:700, fontSize:14, color:'#E8EAF0' }}>{city.name}</span>
                  <span style={{ fontSize:10, color:'#374151' }}>{city.zones?.length} zones</span>
                </div>
                <div style={{ fontWeight:800, fontSize:15, color:hbColor(city.scHB||0) }}>{(city.scHB||0).toFixed(1)}%</div>
                <div style={{ fontSize:13, color:hbColor(city.scStars||0) }}>{(city.scStars||0).toFixed(1)}%</div>
                <div style={{ fontSize:13, color:hbColor(city.scHubs||0) }}>{(city.scHubs||0).toFixed(1)}%</div>
                <div style={{ fontSize:13, color:hbColor(city.scMerch||0) }}>{(city.scMerch||0).toFixed(1)}%</div>
              </div>

              {ce && city.zones?.map(zone => {
                const ze = expandedZone === zone.name
                return (
                  <React.Fragment key={zone.name}>
                    <div onClick={()=>{setExpandedZone(ze?null:zone.name);setExpandedHub(null)}}
                      style={{ display:'grid', gridTemplateColumns:'1fr 110px 90px 90px 90px', gap:8, padding:'11px 24px 11px 44px',
                        background: ze ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.2)',
                        borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, color:'#374151' }}>{ze?'▾':'▸'}</span>
                        <span style={{ fontWeight:600, fontSize:13, color:'#9CA3AF' }}>{zone.name}</span>
                        <span style={{ fontSize:10, color:'#374151' }}>{zone.hubsList?.length} hubs</span>
                      </div>
                      <div style={{ fontWeight:700, fontSize:13, color:hbColor(zone.scHB||0) }}>{(zone.scHB||0).toFixed(1)}%</div>
                      <div style={{ fontSize:12, color:hbColor(zone.scStars||0) }}>{(zone.scStars||0).toFixed(1)}%</div>
                      <div style={{ fontSize:12, color:hbColor(zone.scHubs||0) }}>{(zone.scHubs||0).toFixed(1)}%</div>
                      <div style={{ fontSize:12, color:hbColor(zone.scMerch||0) }}>{(zone.scMerch||0).toFixed(1)}%</div>
                    </div>

                    {ze && zone.hubsList?.map(hub => {
                      const he = expandedHub === hub.id
                      return (
                        <React.Fragment key={hub.id}>
                          <div onClick={()=>setExpandedHub(he?null:hub.id)}
                            style={{ display:'grid', gridTemplateColumns:'1fr 110px 90px 90px 90px', gap:8, padding:'9px 24px 9px 68px',
                              background: he ? 'rgba(16,185,129,0.03)' : 'rgba(0,0,0,0.3)',
                              borderBottom:'1px solid rgba(255,255,255,0.02)', cursor:'pointer' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:10, color:'#374151' }}>{he?'▾':'▸'}</span>
                              <span style={{ fontSize:12, color:'#6B7280' }}>{hub.name}</span>
                            </div>
                            <div style={{ fontWeight:700, fontSize:12, color:hbColor(hub.scHB||0) }}>{(hub.scHB||0).toFixed(1)}%</div>
                            <div style={{ fontSize:11, color:hbColor(hub.scStars||0) }}>{(hub.scStars||0).toFixed(1)}%</div>
                            <div style={{ fontSize:11, color:hbColor(hub.scHubs||0) }}>{(hub.scHubs||0).toFixed(1)}%</div>
                            <div style={{ fontSize:11, color:hbColor(hub.scMerch||0) }}>{(hub.scMerch||0).toFixed(1)}%</div>
                          </div>

                          {he && (
                            <div style={{ padding:'20px 24px 20px 84px', background:'#080A10', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:GREEN, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>Stars KPIs</div>
                                  <KpiBar label="ASR - Attempt Success" value={hub.asr||0}/>
                                  <KpiBar label="FDDS - First Day Delivery" value={hub.fdds||0}/>
                                  <KpiBar label="OFD / Star" value={hub.ofd||0}/>
                                  <KpiBar label="CRP - Return Pickups" value={hub.crp||0}/>
                                  <KpiBar label="Fake Attempt Rate" value={hub.fake||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:BLUE, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>Hub KPIs</div>
                                  <KpiBar label="Delivery Promised" value={hub.delPromised||0}/>
                                  <KpiBar label="Same-Day Dispatch" value={hub.dispatch||0}/>
                                  <KpiBar label="Cycle Adaptation" value={hub.cycle||0}/>
                                  <KpiBar label="Backlog Rate" value={hub.backlog||0} isNeg/>
                                  <KpiBar label="Lost Parcels" value={hub.lost||0} isNeg/>
                                  <KpiBar label="Damaged Rate" value={hub.damaged||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:AMBER, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>Merchants</div>
                                  <KpiBar label="DSR - Delivery Success" value={hub.dsr||0}/>
                                  <div style={{ marginTop:16, padding:12, background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize:10, color:'#374151', marginBottom:5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>Merchant Tier</div>
                                    {(hub.dsr||0)>80 ? <span style={{color:GREEN,fontWeight:700,fontSize:13}}>Excellent (&gt;80%)</span>
                                    :(hub.dsr||0)>=75? <span style={{color:'#34D399',fontWeight:700,fontSize:13}}>Very Good (75–80%)</span>
                                    :(hub.dsr||0)>=70? <span style={{color:BLUE,fontWeight:700,fontSize:13}}>Good (70–75%)</span>
                                    :(hub.dsr||0)>=65? <span style={{color:AMBER,fontWeight:700,fontSize:13}}>Default (65–70%)</span>
                                    :<span style={{color:RED,fontWeight:700,fontSize:13}}>Bad Business (≤65%)</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
