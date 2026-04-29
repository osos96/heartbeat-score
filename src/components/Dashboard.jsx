import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { ALL_DATA, aggregate, getTrendData, calcScores } from './dashboardData'
import { T } from './theme'

const RED = '#E30613', GREEN = '#16A34A', AMBER = '#D97706', BLUE = '#2563EB'

const hbColor = v => v >= 88 ? GREEN : v >= 78 ? AMBER : RED
const hbLabel = v => v >= 88 ? 'Strong' : v >= 78 ? 'Caution' : 'Critical'

const KPI_OPTS = [
  { key: 'scHB',        label: 'HeartBeat', goal: 88, crit: 75, color: RED    },
  { key: 'scStars',     label: 'Stars OKR', goal: 88, crit: 75, color: GREEN  },
  { key: 'scHubs',      label: 'Hubs OKR',  goal: 88, crit: 75, color: BLUE   },
  { key: 'asr',         label: 'ASR%',      goal: 90, crit: 80, color: '#7C3AED' },
  { key: 'fdds',        label: 'FDDS%',     goal: 88, crit: 78, color: '#0891B2' },
  { key: 'delPromised', label: 'Promised%', goal: 90, crit: 80, color: AMBER  },
]

const TREND_KEYS = ['scHB','scStars','scHubs','scMerch','asr','fdds','delPromised','backlog','fake']

const getHubTrend = (hubId) =>
  ALL_DATA.filter(r => r.id === hubId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date.slice(5), ...calcScores(r) }))

const getZoneTrend = (zoneName) => {
  const byDate = {}
  ALL_DATA.filter(r => r.zone === zoneName).forEach(r => {
    const s = calcScores(r)
    if (!byDate[r.date]) byDate[r.date] = []
    byDate[r.date].push(s)
  })
  return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, rows]) => {
    const obj = { date: date.slice(5) }
    TREND_KEYS.forEach(k => { obj[k] = rows.reduce((s,r) => s+(r[k]||0), 0) / rows.length })
    return obj
  })
}

const Ring = ({ value, size = 90, stroke = 7 }) => {
  const col  = hbColor(value)
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.borderSub} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-value/100)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
    </svg>
  )
}

const CITY_COORDS = {
  'Greater Cairo': [30.0444, 31.2357],
  'Alexandria':    [31.2001, 29.9187],
  'Giza':          [30.0131, 31.2089],
  'Mansoura':      [31.0364, 31.3807],
  'Assiut':        [27.1783, 31.1859],
}

const LeafletMap = ({ cities, onSelect, selected }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const layersRef    = useRef({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let timer
    const init = () => {
      if (!window.L || !containerRef.current || mapRef.current) return
      mapRef.current = window.L.map(containerRef.current, {
        center: [28.5, 30.5], zoom: 6,
        scrollWheelZoom: false, zoomControl: false,
      })
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapRef.current)
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
      setReady(true)
    }
    if (window.L) { init() }
    else { timer = setInterval(() => { if (window.L) { clearInterval(timer); init() } }, 120) }
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const L = window.L
    Object.values(layersRef.current).forEach(l => { try { l.remove() } catch(e){} })
    layersRef.current = {}
    cities.forEach(city => {
      const coords = CITY_COORDS[city.name]
      if (!coords) return
      const score  = city.scHB || 0
      const col    = hbColor(score)
      const isSel  = selected === city.name
      const radius = city.name === 'Greater Cairo' ? 48000 : 32000
      const circle = L.circle(coords, {
        radius, fillColor: col, color: col,
        weight: isSel ? 3 : 1.5,
        fillOpacity: isSel ? 0.38 : 0.18,
      }).addTo(mapRef.current).on('click', () => onSelect(city.name))
      const shortName = city.name.replace('Greater Cairo', 'Cairo')
      const icon = L.divIcon({
        html: `<div style="background:white;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;color:${col};border:1.5px solid ${col};white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.18);font-family:Inter,sans-serif">${shortName}: ${score.toFixed(0)}%</div>`,
        className: '', iconAnchor: [0, 0],
      })
      const lbl = L.marker(coords, { icon }).addTo(mapRef.current).on('click', () => onSelect(city.name))
      layersRef.current[city.name + '_c'] = circle
      layersRef.current[city.name + '_l'] = lbl
    })
  }, [ready, cities, selected, onSelect])

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
  }, [])

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', height: 300 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}/>
    </div>
  )
}

const KpiBar = ({ label, value, isNeg }) => {
  const col  = isNeg ? (value > 8 ? RED : value > 3 ? AMBER : GREEN) : (value >= 88 ? GREEN : value >= 75 ? AMBER : RED)
  const fill = isNeg ? Math.min(value * 5, 100) : value
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: T.textSec }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 3, background: T.borderSub, borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${fill}%`, background: col, borderRadius: 2, transition: 'width 0.4s' }}/>
      </div>
    </div>
  )
}

const TrendPanel = ({ trendData, title }) => {
  const [selIdx, setSelIdx] = useState(0)
  const kpi = KPI_OPTS[selIdx]
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title} - Performance Trend (180 days)
        </span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {KPI_OPTS.map((opt, i) => (
            <button key={opt.key} onClick={() => setSelIdx(i)} style={{
              padding: '3px 10px', fontSize: 10, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
              background: selIdx === i ? kpi.color : T.cardSub,
              color:      selIdx === i ? '#fff' : T.textSec,
              border:     `1px solid ${selIdx === i ? kpi.color : T.border}`,
              transition: 'all 0.15s',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={T.borderSub} vertical={false}/>
          <XAxis dataKey="date" tick={{ fontSize: 8, fill: T.textMuted }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
          <YAxis domain={[55, 100]} tick={{ fontSize: 8, fill: T.textMuted }} axisLine={false} tickLine={false} width={28}/>
          <ReferenceLine y={kpi.goal} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: 'Goal', position: 'insideTopRight', fontSize: 8, fill: GREEN }}/>
          <ReferenceLine y={kpi.crit} stroke={RED} strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: 'Critical', position: 'insideBottomRight', fontSize: 8, fill: RED }}/>
          <Tooltip formatter={v => `${(+v).toFixed(1)}%`}
            contentStyle={{ fontSize: 11, borderColor: T.border, background: T.card }} labelStyle={{ color: T.textMuted }}/>
          <Line type="monotone" dataKey={kpi.key} stroke={kpi.color} strokeWidth={2} dot={false} name={kpi.label}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: T.shadowMd }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}: {(+p.value).toFixed(1)}%</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod]             = useState(30)
  const [expandedCity, setExpandedCity] = useState(null)
  const [expandedZone, setExpandedZone] = useState(null)
  const [expandedHub, setExpandedHub]   = useState(null)
  const [mapSelected, setMapSelected]   = useState(null)
  const [showPillars, setShowPillars]   = useState(false)

  const filteredData = useMemo(() => ALL_DATA.slice(0, period * 18), [period])
  const cities       = useMemo(() => aggregate(filteredData), [filteredData])
  const prevCities   = useMemo(() => aggregate(ALL_DATA.slice(period * 18, period * 36)), [period])
  const trendData    = useMemo(() => getTrendData(ALL_DATA, period), [period])

  const netAvg  = k => cities.length     ? cities.reduce((s,c)=>s+(c[k]||0),0)/cities.length      : 0
  const prevAvg = k => prevCities.length ? prevCities.reduce((s,c)=>s+(c[k]||0),0)/prevCities.length : 0

  const hb    = netAvg('scHB')
  const stars = netAvg('scStars')
  const hubs  = netAvg('scHubs')
  const merch = netAvg('scMerch')
  const delta = hb - prevAvg('scHB')

  const handleMapSelect = useCallback(cityName => {
    setMapSelected(p  => p === cityName ? null : cityName)
    setExpandedCity(p => p === cityName ? null : cityName)
    setExpandedZone(null)
    setExpandedHub(null)
  }, [])

  const hubTrendData  = useMemo(() => expandedHub  ? getHubTrend(expandedHub)   : null, [expandedHub])
  const zoneTrendData = useMemo(() => expandedZone ? getZoneTrend(expandedZone) : null, [expandedZone])

  const resetPeriod = d => {
    setPeriod(d)
    setExpandedCity(null); setExpandedZone(null); setExpandedHub(null); setMapSelected(null)
  }

  return (
    <div style={{ padding: '100px 2rem 60px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 05: Live Demo</span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginTop: 6 }}>HeartBeat Dashboard</h2>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Simulated network data - click city nodes on the map or rows in the table to drill down</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => resetPeriod(d)} style={{
              padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: period === d ? T.red : T.card,
              color:      period === d ? '#fff' : T.textSec,
              border:     `1px solid ${period === d ? T.red : T.border}`,
              transition: 'all 0.2s',
            }}>{d === 7 ? '7D' : d === 30 ? '30D' : '90D'}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 20,
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28,
        borderTop: `3px solid ${T.red}`, boxShadow: T.shadowMd }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingRight: 28, borderRight: `1px solid ${T.border}` }}>
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <Ring value={hb} size={110} stroke={9}/>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, letterSpacing: '0.06em' }}>HB SCORE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: T.text, lineHeight: 1 }}>{hb.toFixed(0)}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>HeartBeat Score</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: hbColor(hb), letterSpacing: '-0.04em', lineHeight: 1 }}>{hb.toFixed(1)}%</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? GREEN : RED }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>vs prev {period}d</span>
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: `${hbColor(hb)}12`, color: hbColor(hb), border: `1px solid ${hbColor(hb)}30` }}>{hbLabel(hb)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'center' }}>
          {[
            { label: 'Stars OKR',     val: stars, weight: '30%', color: GREEN },
            { label: 'Hubs OKR',      val: hubs,  weight: '50%', color: BLUE  },
            { label: 'Merchants OKR', val: merch, weight: '20%', color: AMBER },
          ].map(p => (
            <div key={p.label} style={{ padding: 16, borderRadius: 10, background: T.cardSub, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.label}</span>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>{p.weight}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: '-0.03em' }}>{p.val.toFixed(1)}%</div>
              <div style={{ marginTop: 8, height: 3, background: T.border, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${p.val}%`, background: p.color, borderRadius: 2, transition: 'width 0.5s' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Network Geography - click a city to drill down</div>
          <LeafletMap cities={cities} onSelect={handleMapSelect} selected={mapSelected}/>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score Trend - {period}d</span>
            <button onClick={() => setShowPillars(v => !v)} style={{
              fontSize: 11, color: showPillars ? T.red : T.textSec,
              background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              {showPillars ? 'Hide' : 'Show'} pillar lines
            </button>
          </div>
          <ResponsiveContainer width="100%" height={248}>
            <LineChart data={trendData}>
              <CartesianGrid stroke={T.borderSub} vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: T.textMuted }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: T.textMuted }} axisLine={false} tickLine={false} width={28}/>
              <ReferenceLine y={88} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: 'Goal', position: 'insideTopLeft', fontSize: 9, fill: GREEN }}/>
              <ReferenceLine y={75} stroke={RED} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: 'Critical', position: 'insideBottomLeft', fontSize: 9, fill: RED }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone" dataKey="scHB"    name="HeartBeat" stroke={RED}   strokeWidth={2.5} dot={false}/>
              {showPillars && <>
                <Line type="monotone" dataKey="scStars" name="Stars"     stroke={GREEN} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scHubs"  name="Hubs"      stroke={BLUE}  strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scMerch" name="Merchants" stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
              </>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 90px', gap: 8,
          padding: '14px 24px', borderBottom: `1px solid ${T.border}`, background: T.cardSub }}>
          {['Location','HeartBeat','Stars','Hubs','Merchants'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {cities.map(city => {
          const ce = expandedCity === city.name
          return (
            <React.Fragment key={city.name}>
              <div onClick={() => { setExpandedCity(ce ? null : city.name); setExpandedZone(null); setExpandedHub(null); setMapSelected(ce ? null : city.name) }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 90px', gap: 8,
                  padding: '13px 24px', background: ce ? T.redLight : 'transparent',
                  borderBottom: `1px solid ${T.borderSub}`, cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 5, background: ce ? T.red : T.borderSub, color: ce ? '#fff' : T.textMuted,
                    fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ce ? '▾' : '▸'}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{city.name}</span>
                  <span style={{ fontSize: 10, color: T.textMuted }}>{city.zones?.length} zones</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: hbColor(city.scHB||0) }}>{(city.scHB||0).toFixed(1)}%</div>
                <div style={{ fontSize: 13, color: hbColor(city.scStars||0) }}>{(city.scStars||0).toFixed(1)}%</div>
                <div style={{ fontSize: 13, color: hbColor(city.scHubs||0)  }}>{(city.scHubs||0).toFixed(1)}%</div>
                <div style={{ fontSize: 13, color: hbColor(city.scMerch||0) }}>{(city.scMerch||0).toFixed(1)}%</div>
              </div>

              {ce && city.zones?.map(zone => {
                const ze = expandedZone === zone.name
                return (
                  <React.Fragment key={zone.name}>
                    <div onClick={() => { setExpandedZone(ze ? null : zone.name); setExpandedHub(null) }}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 90px', gap: 8,
                        padding: '11px 24px 11px 44px', background: ze ? T.blueLight : T.cardSub,
                        borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 4, background: ze ? BLUE : T.border, color: ze ? '#fff' : T.textMuted,
                          fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{ze ? '▾' : '▸'}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: T.textSec }}>{zone.name}</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{zone.hubsList?.length} hubs</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: hbColor(zone.scHB||0)    }}>{(zone.scHB||0).toFixed(1)}%</div>
                      <div style={{ fontSize: 12,    color: hbColor(zone.scStars||0) }}>{(zone.scStars||0).toFixed(1)}%</div>
                      <div style={{ fontSize: 12,    color: hbColor(zone.scHubs||0)  }}>{(zone.scHubs||0).toFixed(1)}%</div>
                      <div style={{ fontSize: 12,    color: hbColor(zone.scMerch||0) }}>{(zone.scMerch||0).toFixed(1)}%</div>
                    </div>

                    {ze && zoneTrendData && (
                      <div style={{ padding: '16px 24px 8px 44px', background: T.blueLight, borderBottom: `1px solid ${T.border}` }}>
                        <TrendPanel trendData={zoneTrendData} title={zone.name}/>
                      </div>
                    )}

                    {ze && zone.hubsList?.map(hub => {
                      const he = expandedHub === hub.id
                      return (
                        <React.Fragment key={hub.id}>
                          <div onClick={() => setExpandedHub(he ? null : hub.id)}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 90px', gap: 8,
                              padding: '10px 24px 10px 68px', background: he ? T.greenLight : T.card,
                              borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 4, background: he ? GREEN : T.borderSub, color: he ? '#fff' : T.textMuted,
                                fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{he ? '▾' : '▸'}</span>
                              <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{hub.name}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: hbColor(hub.scHB||0)    }}>{(hub.scHB||0).toFixed(1)}%</div>
                            <div style={{ fontSize: 12,    color: hbColor(hub.scStars||0) }}>{(hub.scStars||0).toFixed(1)}%</div>
                            <div style={{ fontSize: 12,    color: hbColor(hub.scHubs||0)  }}>{(hub.scHubs||0).toFixed(1)}%</div>
                            <div style={{ fontSize: 12,    color: hbColor(hub.scMerch||0) }}>{(hub.scMerch||0).toFixed(1)}%</div>
                          </div>

                          {he && (
                            <div style={{ padding: '20px 24px 20px 84px', background: T.greenLight, borderBottom: `1px solid ${T.border}` }}>
                              {hubTrendData && <TrendPanel trendData={hubTrendData} title={hub.name}/>}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>Stars KPIs</div>
                                  <KpiBar label="ASR - Attempt Success"    value={hub.asr||0}/>
                                  <KpiBar label="FDDS - First Day Delivery" value={hub.fdds||0}/>
                                  <KpiBar label="OFD / Star"               value={hub.ofd||0}/>
                                  <KpiBar label="CRP - Return Pickups"     value={hub.crp||0}/>
                                  <KpiBar label="Fake Attempt Rate"        value={hub.fake||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>Hub KPIs</div>
                                  <KpiBar label="Delivery Promised"  value={hub.delPromised||0}/>
                                  <KpiBar label="Same-Day Dispatch"  value={hub.dispatch||0}/>
                                  <KpiBar label="Cycle Adaptation"   value={hub.cycle||0}/>
                                  <KpiBar label="Backlog Rate"       value={hub.backlog||0} isNeg/>
                                  <KpiBar label="Lost Parcels"       value={hub.lost||0} isNeg/>
                                  <KpiBar label="Damaged Rate"       value={hub.damaged||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>Merchants</div>
                                  <KpiBar label="DSR - Delivery Success" value={hub.dsr||0}/>
                                  <div style={{ marginTop: 14, padding: 12, background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Merchant Tier</div>
                                    {(hub.dsr||0) > 80
                                      ? <span style={{ color: GREEN,    fontWeight: 700, fontSize: 13 }}>Excellent (&gt;80%)</span>
                                      : (hub.dsr||0) >= 75
                                      ? <span style={{ color: '#34D399',fontWeight: 700, fontSize: 13 }}>Very Good (75-80%)</span>
                                      : (hub.dsr||0) >= 70
                                      ? <span style={{ color: BLUE,     fontWeight: 700, fontSize: 13 }}>Good (70-75%)</span>
                                      : (hub.dsr||0) >= 65
                                      ? <span style={{ color: AMBER,    fontWeight: 700, fontSize: 13 }}>Default (65-70%)</span>
                                      : <span style={{ color: RED,      fontWeight: 700, fontSize: 13 }}>Bad Business (&lt;65%)</span>}
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
