
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

// City polygon coordinates [lat, lng] arrays - approximate bounding shapes for Egypt cities
const CITY_POLYGONS = {
  'Greater Cairo': [[30.20,31.10],[30.20,31.55],[29.84,31.55],[29.84,31.10]],
  'Alexandria':    [[31.35,29.72],[31.35,30.14],[31.05,30.14],[31.05,29.72]],
  'Giza':          [[30.08,30.84],[30.08,31.22],[29.88,31.22],[29.88,30.84]],
  'Mansoura':      [[31.10,31.24],[31.10,31.52],[30.94,31.52],[30.94,31.24]],
  'Assiut':        [[27.30,31.04],[27.30,31.32],[27.08,31.32],[27.08,31.04]],
}

// Zone polygon coordinates
const ZONE_POLYGONS = {
  'East Cairo':    [[30.18,31.28],[30.18,31.55],[30.02,31.55],[30.02,31.28]],
  'West Cairo':    [[30.12,30.84],[30.12,31.16],[29.92,31.16],[29.92,30.84]],
  'South Cairo':   [[30.02,31.16],[30.02,31.42],[29.84,31.42],[29.84,31.16]],
  'North Cairo':   [[30.20,31.16],[30.20,31.42],[30.10,31.42],[30.10,31.16]],
  'Central Alex':  [[31.35,29.88],[31.35,30.14],[31.18,30.14],[31.18,29.88]],
  'Agamy':         [[31.18,29.72],[31.18,30.00],[31.05,30.00],[31.05,29.72]],
  'North Giza':    [[30.08,30.98],[30.08,31.22],[30.00,31.22],[30.00,30.98]],
  'South Giza':    [[30.02,30.84],[30.02,31.06],[29.88,31.06],[29.88,30.84]],
  'East Mansoura': [[31.08,31.36],[31.08,31.52],[30.94,31.52],[30.94,31.36]],
  'West Mansoura': [[31.10,31.24],[31.10,31.42],[30.96,31.42],[30.96,31.24]],
  'North Assiut':  [[27.30,31.14],[27.30,31.32],[27.18,31.32],[27.18,31.14]],
  'South Assiut':  [[27.20,31.04],[27.20,31.24],[27.08,31.24],[27.08,31.04]],
}

// Approximate hub pin coordinates [lat, lng]
const HUB_COORDS = {
  'c-e1': [30.065, 31.330], 'c-e2': [30.092, 31.322], 'c-e3': [30.030, 31.470],
  'c-w1': [29.964, 30.924], 'c-w2': [30.019, 30.976],
  'c-s1': [29.962, 31.250], 'c-s2': [29.850, 31.334],
  'c-n1': [30.130, 31.245],
  'a-m1': [31.278, 30.006], 'a-m2': [31.215, 29.948],
  'a-a1': [31.080, 29.818], 'a-a2': [31.065, 29.795],
  'g-n1': [30.066, 31.205], 'g-s1': [29.994, 31.150],
  'm-e1': [31.022, 31.420], 'm-w1': [31.041, 31.275],
  'as-n1':[27.195, 31.200], 'as-s1':[27.155, 31.165],
}

// City view bounds [sw, ne] for fitBounds
const CITY_BOUNDS = {
  'Greater Cairo': [[29.84, 31.10], [30.20, 31.55]],
  'Alexandria':    [[31.05, 29.72], [31.35, 30.14]],
  'Giza':          [[29.88, 30.84], [30.08, 31.22]],
  'Mansoura':      [[30.94, 31.24], [31.10, 31.52]],
  'Assiut':        [[27.08, 31.04], [27.30, 31.32]],
}

const ZONE_BOUNDS = {
  'East Cairo':    [[30.02, 31.28], [30.18, 31.55]],
  'West Cairo':    [[29.92, 30.84], [30.12, 31.16]],
  'South Cairo':   [[29.84, 31.16], [30.02, 31.42]],
  'North Cairo':   [[30.10, 31.16], [30.20, 31.42]],
  'Central Alex':  [[31.18, 29.88], [31.35, 30.14]],
  'Agamy':         [[31.05, 29.72], [31.18, 30.00]],
  'North Giza':    [[30.00, 30.98], [30.08, 31.22]],
  'South Giza':    [[29.88, 30.84], [30.02, 31.06]],
  'East Mansoura': [[30.94, 31.36], [31.08, 31.52]],
  'West Mansoura': [[30.96, 31.24], [31.10, 31.42]],
  'North Assiut':  [[27.18, 31.14], [27.30, 31.32]],
  'South Assiut':  [[27.08, 31.04], [27.20, 31.24]],
}

// Generate synthetic heatmap points around a hub (order density simulation)
const hubHeatPoints = (hubId, score) => {
  const [lat, lng] = HUB_COORDS[hubId] || [30, 31]
  const count = Math.round(12 + (score / 100) * 18)
  const pts = []
  for (let i = 0; i < count; i++) {
    const s = (hubId.charCodeAt(0) * 17 + hubId.charCodeAt(1) * 31 + i * 7) % 1000
    const r = (s / 1000) * 0.025
    const a = (i / count) * Math.PI * 2 + (s / 1000)
    pts.push([lat + Math.sin(a) * r, lng + Math.cos(a) * r, (score / 100) * 0.8 + 0.2])
  }
  return pts
}

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

// ── Polygon map with CartoDB tiles + drill levels ──
const LeafletMap = ({ cities, onSelectCity, selectedCity, expandedZone }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const layersRef    = useRef([])
  const heatRef      = useRef(null)
  const [ready, setReady] = useState(false)
  const [drillCity, setDrillCity] = useState(null)  // city name or null (country view)

  // Clear all layers
  const clearLayers = useCallback(() => {
    layersRef.current.forEach(l => { try { l.remove() } catch(e){} })
    layersRef.current = []
    if (heatRef.current) { try { heatRef.current.remove() } catch(e){} heatRef.current = null }
  }, [])

  useEffect(() => {
    let timer
    const init = () => {
      if (!window.L || !containerRef.current || mapRef.current) return
      mapRef.current = window.L.map(containerRef.current, {
        center: [28.0, 30.8], zoom: 6,
        scrollWheelZoom: false, zoomControl: false,
      })
      // CartoDB Positron - clean light tiles
      window.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19 }
      ).addTo(mapRef.current)
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
      setReady(true)
    }
    if (window.L) { init() }
    else { timer = setInterval(() => { if (window.L) { clearInterval(timer); init() } }, 120) }
    return () => clearInterval(timer)
  }, [])

  // Render country-level city polygons
  const renderCountry = useCallback((L, cityData) => {
    clearLayers()
    if (mapRef.current) {
      try { mapRef.current.setView([28.0, 30.8], 6) } catch(e){}
    }
    cityData.forEach(city => {
      const poly = CITY_POLYGONS[city.name]
      if (!poly) return
      const score = city.scHB || 0
      const col = hbColor(score)
      const layer = L.polygon(poly, {
        color: col, weight: 2, fillColor: col, fillOpacity: 0.18,
      }).addTo(mapRef.current).on('click', () => {
        setDrillCity(city.name)
        onSelectCity(city.name)
      })
      const centroid = poly.reduce((acc, p) => [acc[0]+p[0]/poly.length, acc[1]+p[1]/poly.length], [0,0])
      const icon = L.divIcon({
        html: `<div style="background:white;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;color:${col};border:1.5px solid ${col};white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.14);font-family:Inter,sans-serif">${city.name.replace('Greater ','')}: ${score.toFixed(0)}%</div>`,
        className: '', iconAnchor: [0, 0],
      })
      const lbl = L.marker(centroid, { icon }).addTo(mapRef.current).on('click', () => {
        setDrillCity(city.name)
        onSelectCity(city.name)
      })
      layersRef.current.push(layer, lbl)
    })
  }, [clearLayers, onSelectCity])

  // Render city-level zone polygons + hub pins
  const renderCity = useCallback((L, cityName, cityData) => {
    clearLayers()
    const bounds = CITY_BOUNDS[cityName]
    if (mapRef.current && bounds) {
      try { mapRef.current.fitBounds(bounds, { padding: [20, 20] }) } catch(e){}
    }
    const city = cityData.find(c => c.name === cityName)
    if (!city) return
    city.zones?.forEach(zone => {
      const poly = ZONE_POLYGONS[zone.name]
      if (!poly) return
      const score = zone.scHB || 0
      const col = hbColor(score)
      const layer = L.polygon(poly, {
        color: col, weight: 2, fillColor: col, fillOpacity: 0.22,
      }).addTo(mapRef.current)
      const centroid = poly.reduce((acc, p) => [acc[0]+p[0]/poly.length, acc[1]+p[1]/poly.length], [0,0])
      const icon = L.divIcon({
        html: `<div style="background:white;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;color:${col};border:1.5px solid ${col};white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);font-family:Inter,sans-serif">${zone.name}: ${score.toFixed(0)}%</div>`,
        className: '', iconAnchor: [0, 0],
      })
      const lbl = L.marker(centroid, { icon }).addTo(mapRef.current)
      layersRef.current.push(layer, lbl)
      // Hub pins per zone
      zone.hubsList?.forEach(hub => {
        const coords = HUB_COORDS[hub.id]
        if (!coords) return
        const hs = hub.scHB || 0
        const hcol = hbColor(hs)
        const hIcon = L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${hcol};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>`,
          className: '', iconAnchor: [5, 5],
        })
        const m = L.marker(coords, { icon: hIcon }).addTo(mapRef.current)
          .bindTooltip(`${hub.name}: ${hs.toFixed(0)}%`, { direction: 'top', offset: [0, -8] })
        layersRef.current.push(m)
      })
    })
  }, [clearLayers])

  // Render zone-level: hub markers + order density heatmap
  const renderZone = useCallback((L, zoneName, cityData) => {
    const bounds = ZONE_BOUNDS[zoneName]
    // Just zoom to zone - layers already rendered at city level
    if (mapRef.current && bounds) {
      try { mapRef.current.fitBounds(bounds, { padding: [30, 30] }) } catch(e){}
    }
    // Build heatmap from all hubs in this zone
    let allPoints = []
    cityData.forEach(city => {
      city.zones?.forEach(zone => {
        if (zone.name !== zoneName) return
        zone.hubsList?.forEach(hub => {
          const pts = hubHeatPoints(hub.id, hub.scHB || 80)
          allPoints = allPoints.concat(pts)
        })
      })
    })
    if (window.L.heatLayer && allPoints.length) {
      if (heatRef.current) { try { heatRef.current.remove() } catch(e){} }
      heatRef.current = window.L.heatLayer(allPoints, {
        radius: 25, blur: 20, maxZoom: 14,
        gradient: { 0.4: '#3B82F6', 0.65: '#F59E0B', 1.0: '#E30613' }
      }).addTo(mapRef.current)
    }
  }, [])

  // Sync layers when ready or data changes
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const L = window.L
    if (drillCity) {
      renderCity(L, drillCity, cities)
    } else {
      renderCountry(L, cities)
    }
  }, [ready, cities, drillCity, renderCity, renderCountry])

  // Zoom to zone when expandedZone changes
  useEffect(() => {
    if (!ready || !mapRef.current || !expandedZone || !drillCity) return
    renderZone(window.L, expandedZone, cities)
  }, [ready, expandedZone, drillCity, cities, renderZone])

  const handleBack = () => {
    setDrillCity(null)
    onSelectCity(null)
    if (heatRef.current) { try { heatRef.current.remove() } catch(e){} heatRef.current = null }
  }

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
  }, [])

  return (
    <div style={{ position: 'relative', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', height: 320 }}>
      {drillCity && (
        <button onClick={handleBack} style={{
          position: 'absolute', top: 10, left: 10, zIndex: 1000,
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 7,
          padding: '5px 12px', fontSize: 11, fontWeight: 700, color: T.textSec, cursor: 'pointer',
          boxShadow: T.shadow,
        }}>← All Cities</button>
      )}
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
  const [mapSelectedCity, setMapSelectedCity] = useState(null)
  const [showPillars, setShowPillars]   = useState(false)
  const [viewHubsZone, setViewHubsZone] = useState(null)

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

  const handleMapSelectCity = useCallback(cityName => {
    setMapSelectedCity(cityName)
    if (cityName) {
      setExpandedCity(cityName)
      setExpandedZone(null)
      setExpandedHub(null)
    } else {
      setExpandedCity(null)
      setExpandedZone(null)
      setExpandedHub(null)
    }
  }, [])

  const hubTrendData  = useMemo(() => expandedHub  ? getHubTrend(expandedHub)   : null, [expandedHub])
  const zoneTrendData = useMemo(() => expandedZone ? getZoneTrend(expandedZone) : null, [expandedZone])

  const resetPeriod = d => {
    setPeriod(d)
    setExpandedCity(null); setExpandedZone(null); setExpandedHub(null); setMapSelectedCity(null); setViewHubsZone(null)
  }

  return (
    <div style={{ padding: '100px 2rem 60px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 05: Live Demo</span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginTop: 6 }}>HeartBeat Dashboard</h2>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Simulated network data - click city polygons on the map or rows in the table to drill down</p>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Network Geography — click a city polygon to drill in
          </div>
          <LeafletMap cities={cities} onSelectCity={handleMapSelectCity} selectedCity={mapSelectedCity} expandedZone={expandedZone}/>
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

      {/* Drill table */}
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
              <div onClick={() => { const next = !ce; setExpandedCity(next ? city.name : null); setExpandedZone(null); setExpandedHub(null); setViewHubsZone(null); setMapSelectedCity(next ? city.name : null) }}
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
                const vh = viewHubsZone === zone.name
                return (
                  <React.Fragment key={zone.name}>
                    {/* Zone row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 90px', gap: 8,
                      padding: '11px 24px 11px 44px', background: ze ? T.blueLight : T.cardSub,
                      borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span onClick={() => { setExpandedZone(ze ? null : zone.name); setExpandedHub(null) }}
                          style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 4, background: ze ? BLUE : T.border, color: ze ? '#fff' : T.textMuted,
                            fontSize: 10, fontWeight: 700, flexShrink: 0, cursor: 'pointer' }}>{ze ? '▾' : '▸'}</span>
                        <span onClick={() => { setExpandedZone(ze ? null : zone.name); setExpandedHub(null) }}
                          style={{ fontWeight: 600, fontSize: 13, color: T.textSec, cursor: 'pointer' }}>{zone.name}</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{zone.hubsList?.length} hubs</span>
                        <button
                          onClick={e => { e.stopPropagation(); setViewHubsZone(vh ? null : zone.name); setExpandedZone(vh ? expandedZone : zone.name) }}
                          style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                            background: vh ? BLUE : T.card, color: vh ? '#fff' : BLUE,
                            border: `1px solid ${BLUE}`, transition: 'all 0.15s' }}>
                          {vh ? 'Hide Hubs' : 'View Hubs'}
                        </button>
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

                    {/* Hubs list - shown when View Hubs clicked OR zone expanded */}
                    {(ze || vh) && zone.hubsList?.map(hub => {
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
