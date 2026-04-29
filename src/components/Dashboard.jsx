
import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ALL_DATA, aggregate, getTrendData, calcScores } from './dashboardData'

const RED = '#E30613'
const GREEN = '#10B981'
const BLUE = '#3B82F6'
const AMBER = '#F59E0B'

const scoreColor = (v) => v >= 88 ? GREEN : v >= 78 ? AMBER : RED

const ScoreRing = ({ value, color, size = 80 }) => {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = value / 100
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
    </svg>
  )
}

const MerchantTier = ({ dsr }) => {
  if (dsr > 80) return <span style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>Excellent</span>
  if (dsr >= 75) return <span style={{ color: '#34D399', fontWeight: 700, fontSize: 12 }}>Very Good</span>
  if (dsr >= 70) return <span style={{ color: BLUE, fontWeight: 700, fontSize: 12 }}>Good</span>
  if (dsr >= 65) return <span style={{ color: AMBER, fontWeight: 700, fontSize: 12 }}>Default</span>
  return <span style={{ color: RED, fontWeight: 700, fontSize: 12 }}>Bad Business</span>
}

const KpiRow = ({ label, value, isNeg, max = 100 }) => {
  const color = isNeg
    ? (value > 8 ? RED : value > 3 ? AMBER : GREEN)
    : (value >= 88 ? GREEN : value >= 75 ? AMBER : RED)
  const barPct = isNeg ? Math.min(value * 5, 100) : value
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#13151F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}: {p.value.toFixed(1)}%</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState(30)
  const [expandedCity, setExpandedCity] = useState(null)
  const [expandedZone, setExpandedZone] = useState(null)
  const [expandedHub, setExpandedHub] = useState(null)
  const [trendPillar, setTrendPillar] = useState('heartbeat')

  const filteredData = useMemo(() => ALL_DATA.slice(0, period * 18), [period])
  const cities = useMemo(() => aggregate(filteredData), [filteredData])
  const trendData = useMemo(() => getTrendData(ALL_DATA, period), [period])

  const prevData = useMemo(() => ALL_DATA.slice(period * 18, period * 36), [period])
  const prevCities = useMemo(() => aggregate(prevData), [prevData])

  const avg = (arr, k) => arr.length ? arr.reduce((s, r) => s + r[k], 0) / arr.length : 0
  const networkHB = avg(cities, 'heartbeat')
  const networkStars = avg(cities, 'stars')
  const networkHubs = avg(cities, 'hubs')
  const networkMerchants = avg(cities, 'merchants')
  const prevHB = avg(prevCities, 'heartbeat')
  const delta = networkHB - prevHB

  const PILLAR_OPTS = [
    { key: 'heartbeat', label: 'HeartBeat', color: RED },
    { key: 'stars', label: 'Stars', color: GREEN },
    { key: 'hubs', label: 'Hubs', color: BLUE },
    { key: 'merchants', label: 'Merchants', color: AMBER },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '100px 2rem 60px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: RED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 04 — Live Demo</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            HeartBeat Dashboard
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Live operational health. Click any city → zone → hub to drill down.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => { setPeriod(d); setExpandedCity(null); setExpandedZone(null); setExpandedHub(null) }}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: period === d ? RED : '#0D0F18',
                color: period === d ? '#fff' : '#9CA3AF',
                border: `1px solid ${period === d ? RED : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.2s',
              }}>{d === 7 ? '7D' : d === 30 ? '30D' : '90D'}</button>
          ))}
        </div>
      </div>

      {/* Network Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'HeartBeat Score', value: networkHB, color: RED, sub: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs prev period` },
          { label: 'Stars OKR', value: networkStars, color: GREEN, sub: 'Driver layer performance' },
          { label: 'Hubs OKR', value: networkHubs, color: BLUE, sub: 'Operational throughput' },
          { label: 'Merchants OKR', value: networkMerchants, color: AMBER, sub: 'Network avg DSR' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#0D0F18', border: `1px solid rgba(255,255,255,0.07)`,
            borderRadius: 12, padding: 20, borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{card.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <ScoreRing value={card.value} color={card.color} size={64} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 12, fontWeight: 800, color: '#fff' }}>{card.value.toFixed(0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{card.value.toFixed(1)}%</div>
                <div style={{ fontSize: 11, color: i === 0 ? (delta >= 0 ? GREEN : RED) : '#6B7280', marginTop: 2 }}>{card.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0' }}>Score Trend — Last {period} Days</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PILLAR_OPTS.map(p => (
              <button key={p.key} onClick={() => setTrendPillar(p.key)}
                style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: trendPillar === p.key ? `rgba(${p.color === RED ? '227,6,19' : p.color === GREEN ? '16,185,129' : p.color === BLUE ? '59,130,246' : '245,158,11'},0.15)` : 'transparent',
                  color: trendPillar === p.key ? p.color : '#6B7280',
                  border: `1px solid ${trendPillar === p.key ? p.color : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>{p.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            {trendPillar === 'heartbeat' && <Line type="monotone" dataKey="heartbeat" name="HeartBeat" stroke={RED} strokeWidth={2} dot={false} />}
            {trendPillar === 'stars' && <Line type="monotone" dataKey="stars" name="Stars" stroke={GREEN} strokeWidth={2} dot={false} />}
            {trendPillar === 'hubs' && <Line type="monotone" dataKey="hubs" name="Hubs" stroke={BLUE} strokeWidth={2} dot={false} />}
            {trendPillar === 'merchants' && <Line type="monotone" dataKey="merchants" name="Merchants" stroke={AMBER} strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hierarchical City Table */}
      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 100px', gap: 8 }}>
          {['Location', 'HeartBeat', 'Stars', 'Hubs', 'Merchants'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {cities.map(city => {
          const cityExpanded = expandedCity === city.name
          return (
            <React.Fragment key={city.name}>
              <div
                onClick={() => { setExpandedCity(cityExpanded ? null : city.name); setExpandedZone(null); setExpandedHub(null) }}
                style={{
                  padding: '14px 24px', cursor: 'pointer', display: 'grid',
                  gridTemplateColumns: '1fr 120px 100px 100px 100px', gap: 8,
                  background: cityExpanded ? 'rgba(227,6,19,0.05)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{cityExpanded ? '▾' : '▸'}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#E8EAF0' }}>{city.name}</span>
                  <span style={{ fontSize: 11, color: '#4B5563' }}>{city.zones?.length} zones</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: scoreColor(city.heartbeat) }}>{city.heartbeat.toFixed(1)}%</div>
                <div style={{ fontSize: 14, color: scoreColor(city.stars) }}>{city.stars.toFixed(1)}%</div>
                <div style={{ fontSize: 14, color: scoreColor(city.hubs) }}>{city.hubs.toFixed(1)}%</div>
                <div style={{ fontSize: 14, color: scoreColor(city.merchants) }}>{city.merchants.toFixed(1)}%</div>
              </div>

              {cityExpanded && city.zones?.map(zone => {
                const zoneExpanded = expandedZone === zone.name
                return (
                  <React.Fragment key={zone.name}>
                    <div
                      onClick={() => { setExpandedZone(zoneExpanded ? null : zone.name); setExpandedHub(null) }}
                      style={{
                        padding: '12px 24px 12px 48px', cursor: 'pointer', display: 'grid',
                        gridTemplateColumns: '1fr 120px 100px 100px 100px', gap: 8,
                        background: zoneExpanded ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.2)',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13 }}>{zoneExpanded ? '▾' : '▸'}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#9CA3AF' }}>{zone.name}</span>
                        <span style={{ fontSize: 10, color: '#374151' }}>{zone.hubs?.length} hubs</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: scoreColor(zone.heartbeat) }}>{zone.heartbeat.toFixed(1)}%</div>
                      <div style={{ fontSize: 13, color: scoreColor(zone.stars) }}>{zone.stars.toFixed(1)}%</div>
                      <div style={{ fontSize: 13, color: scoreColor(zone.hubs) }}>{zone.hubs.toFixed(1)}%</div>
                      <div style={{ fontSize: 13, color: scoreColor(zone.merchants) }}>{zone.merchants.toFixed(1)}%</div>
                    </div>

                    {zoneExpanded && zone.hubs?.map(hub => {
                      const hubExpanded = expandedHub === hub.id
                      return (
                        <React.Fragment key={hub.id}>
                          <div
                            onClick={() => setExpandedHub(hubExpanded ? null : hub.id)}
                            style={{
                              padding: '10px 24px 10px 72px', cursor: 'pointer', display: 'grid',
                              gridTemplateColumns: '1fr 120px 100px 100px 100px', gap: 8,
                              background: hubExpanded ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.3)',
                              borderBottom: '1px solid rgba(255,255,255,0.02)',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11 }}>{hubExpanded ? '▾' : '▸'}</span>
                              <span style={{ fontSize: 12, color: '#6B7280' }}>{hub.name}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: scoreColor(hub.heartbeat) }}>{hub.heartbeat.toFixed(1)}%</div>
                            <div style={{ fontSize: 12, color: scoreColor(hub.stars) }}>{hub.stars.toFixed(1)}%</div>
                            <div style={{ fontSize: 12, color: scoreColor(hub.hubs) }}>{hub.hubs.toFixed(1)}%</div>
                            <div style={{ fontSize: 12, color: scoreColor(hub.merchants) }}>{hub.merchants.toFixed(1)}%</div>
                          </div>

                          {hubExpanded && (
                            <div style={{ padding: '20px 24px 20px 88px', background: '#080A10', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Stars KPIs</div>
                                  <KpiRow label="ASR%" value={hub.asr} />
                                  <KpiRow label="FDDS%" value={hub.fdds} />
                                  <KpiRow label="OFD/Star" value={hub.ofd} />
                                  <KpiRow label="Fake Attempt%" value={hub.fake} isNeg />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Hub KPIs</div>
                                  <KpiRow label="Delivery Promised%" value={hub.delPromised} />
                                  <KpiRow label="Backlog%" value={hub.backlog} isNeg />
                                  <KpiRow label="Lost%" value={hub.lost} isNeg />
                                  <KpiRow label="Damaged%" value={hub.damaged} isNeg />
                                  <KpiRow label="Same-Day Dispatch" value={hub.dispatch} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Merchants</div>
                                  <KpiRow label="DSR%" value={hub.dsr} />
                                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, color: '#4B5563', marginBottom: 4 }}>Merchant Tier</div>
                                    <MerchantTier dsr={hub.dsr} />
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
