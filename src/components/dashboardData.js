
const HUBS_CONFIG = [
  { id: 'c-e1', city: 'Greater Cairo', zone: 'East Cairo',   name: 'Nasr City Hub',    struggling: false },
  { id: 'c-e2', city: 'Greater Cairo', zone: 'East Cairo',   name: 'Heliopolis Hub',   struggling: false },
  { id: 'c-e3', city: 'Greater Cairo', zone: 'East Cairo',   name: 'New Cairo Hub',    struggling: false },
  { id: 'c-w1', city: 'Greater Cairo', zone: 'West Cairo',   name: '6th October Hub',  struggling: false },
  { id: 'c-w2', city: 'Greater Cairo', zone: 'West Cairo',   name: 'Sheikh Zayed Hub', struggling: false },
  { id: 'c-s1', city: 'Greater Cairo', zone: 'South Cairo',  name: 'Maadi Hub',        struggling: true  },
  { id: 'c-s2', city: 'Greater Cairo', zone: 'South Cairo',  name: 'Helwan Hub',       struggling: true  },
  { id: 'c-n1', city: 'Greater Cairo', zone: 'North Cairo',  name: 'Shubra Hub',       struggling: false },
  { id: 'a-m1', city: 'Alexandria',    zone: 'Central Alex', name: 'Montaza Hub',      struggling: false },
  { id: 'a-m2', city: 'Alexandria',    zone: 'Central Alex', name: 'Smouha Hub',       struggling: false },
  { id: 'a-a1', city: 'Alexandria',    zone: 'Agamy',        name: 'Bitash Hub',       struggling: true  },
  { id: 'a-a2', city: 'Alexandria',    zone: 'Agamy',        name: 'Hanoville Hub',    struggling: true  },
  { id: 'g-n1', city: 'Giza',          zone: 'North Giza',   name: 'Imbaba Hub',       struggling: false },
  { id: 'g-s1', city: 'Giza',          zone: 'South Giza',   name: 'Omrania Hub',      struggling: false },
  { id: 'm-e1', city: 'Mansoura',      zone: 'East Mansoura',name: 'Toriel Hub',       struggling: false },
  { id: 'm-w1', city: 'Mansoura',      zone: 'West Mansoura',name: 'Galaa Hub',        struggling: false },
  { id: 'as-n1',city: 'Assiut',        zone: 'North Assiut', name: 'Walideya Hub',     struggling: true  },
  { id: 'as-s1',city: 'Assiut',        zone: 'South Assiut', name: 'Sadat Hub',        struggling: true  },
]

// Per-hub trend: positive = improving over time (higher today than 180d ago)
// d=0 is today, d=179 is 180 days ago; base - trend*d → trend > 0 means today is higher
const HUB_TREND = {
  'c-e1': 0.04, 'c-e2': -0.02, 'c-e3': 0.07,
  'c-w1': 0.02, 'c-w2': -0.03,
  'c-s1': 0.11, 'c-s2': -0.06,  // Maadi recovering, Helwan sliding
  'c-n1': 0.01,
  'a-m1': 0.03, 'a-m2': 0.05,
  'a-a1': 0.09, 'a-a2': -0.04,  // Bitash recovering, Hanoville declining
  'g-n1': 0.03, 'g-s1': -0.01,
  'm-e1': 0.04, 'm-w1': -0.02,
  'as-n1': 0.10, 'as-s1': -0.07, // both struggling but diverging trajectories
}

const seeded = (seed, min, max) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  const r = x - Math.floor(x)
  return min + r * (max - min)
}
const clamp = (v, mn = 0, mx = 100) => Math.min(Math.max(v, mn), mx)

export const generateDailyData = () => {
  const rows = []
  const today = new Date('2026-04-29')

  for (let d = 0; d < 180; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const ds = date.toISOString().split('T')[0]

    // Egypt weekend = Friday(5) + Saturday(6)
    const dow = date.getDay()
    const isWeekend = dow === 5 || dow === 6
    const wkPenalty = isWeekend ? seeded(d * 13 + 7, -5.5, -2.5) : 0

    HUBS_CONFIG.forEach((hub, hi) => {
      const seed = d * 100 + hi
      const baseScore = hub.struggling ? 75 : 90
      const trendShift = (HUB_TREND[hub.id] || 0) * d  // further back → less improvement
      const base = baseScore - trendShift

      // Event: South Cairo hubs had a rough 2-week stretch 35-52 days ago (then recovered)
      const isSC = hub.zone === 'South Cairo'
      const scEvent = isSC && d >= 35 && d <= 52 ? -11 : 0

      // Assiut crisis: 80-105 days ago, management disruption
      const isAssiut = hub.city === 'Assiut'
      const asEvent = isAssiut && d >= 80 && d <= 105 ? -13 : 0

      // Agamy Alexandria: capacity overload 55-70 days ago
      const isAgamy = hub.zone === 'Agamy'
      const agEvent = isAgamy && d >= 55 && d <= 70 ? -8 : 0

      const eventPenalty = scEvent + asEvent + agEvent
      const adj = clamp(base + wkPenalty + eventPenalty, 55, 100)

      // Fake attempt rate improves with positive trend hubs
      const fakeTrend = hub.struggling
        ? Math.max(2, 8 - (HUB_TREND[hub.id] || 0) * d * 0.4)
        : Math.max(0.5, 2 - (HUB_TREND[hub.id] || 0) * d * 0.1)

      // Backlog: struggling hubs have high backlog that either improves or worsens
      const backlogBase = hub.struggling ? 15 : 3.5
      const backlogTrend = -(HUB_TREND[hub.id] || 0) * d * 0.8
      const backlogEvent = (isSC && d >= 35 && d <= 52) ? 8 : 0

      rows.push({
        date: ds, id: hub.id, city: hub.city, zone: hub.zone, name: hub.name,
        asr:         clamp(adj + seeded(seed,      -11, 11)),
        ofd:         clamp(88  + seeded(seed + 1,  -10, 10) + wkPenalty * 0.4),
        fake:        clamp(fakeTrend + seeded(seed + 2, -2.5, 2.5), 0, 22),
        fdds:        clamp(adj - 3   + seeded(seed + 3,  -10, 10) + eventPenalty * 0.7),
        crp:         clamp(87  + seeded(seed + 4,  -9, 9)),
        cre:         clamp(84  + seeded(seed + 5,  -9, 9)),
        delPromised: clamp(adj + 2   + seeded(seed + 6,  -11, 11)),
        lost:        clamp(1.5 + seeded(seed + 7,  -0.9, 0.9) + (hub.struggling ? 1.5 : 0), 0, 8),
        damaged:     clamp(2.0 + seeded(seed + 8,  -0.9, 0.9) + (hub.struggling ? 0.8 : 0), 0, 8),
        dispatch:    clamp(adj + 1   + seeded(seed + 9,  -11, 11)),
        backlog:     clamp(backlogBase + backlogTrend + seeded(seed + 10, -5, 5) + backlogEvent, 0, 42),
        pending:     clamp((hub.struggling ? 10 : 2.5) + seeded(seed + 11, -3.5, 3.5), 0, 28),
        cycle:       clamp(89  + seeded(seed + 12, -10, 10)),
        ofdTotal:    clamp(93  + seeded(seed + 13, -8,  8)),
        dsr:         clamp(76  + seeded(seed + 14, -11, 11) + wkPenalty * 0.4 + eventPenalty * 0.5),
      })
    })
  }
  return rows
}

// NOTE: score fields use 'sc' prefix to avoid collision with structural array fields
export const calcScores = (row) => {
  const scStars = row.asr * 0.30 + row.ofd * 0.20 + (100 - row.fake) * 0.10 + row.fdds * 0.20 + row.crp * 0.10 + row.cre * 0.10
  const scHubs  = row.delPromised * 0.15 + (100 - row.lost) * 0.15 + (100 - row.damaged) * 0.10 +
                  row.dispatch * 0.10 + scStars * 0.10 + (100 - row.backlog) * 0.15 +
                  (100 - row.pending) * 0.10 + row.cycle * 0.10 + row.ofdTotal * 0.05
  const scMerch = row.dsr
  const scHB    = scStars * 0.30 + scHubs * 0.50 + scMerch * 0.20
  return { ...row, scStars, scHubs, scMerch, scHB }
}

export const aggregate = (rows) => {
  if (!rows.length) return []
  const SCORE_KEYS = ['asr','ofd','fake','fdds','crp','cre','delPromised','lost','damaged',
                      'dispatch','backlog','pending','cycle','ofdTotal','dsr','scStars','scHubs','scMerch','scHB']
  const avg = (arr, k) => arr.reduce((s, r) => s + (r[k] || 0), 0) / arr.length

  const cityMap = {}
  rows.forEach(r => {
    const scored = calcScores(r)
    if (!cityMap[r.city]) cityMap[r.city] = { name: r.city, zoneMap: {} }
    const city = cityMap[r.city]
    if (!city.zoneMap[r.zone]) city.zoneMap[r.zone] = { name: r.zone, hubMap: {} }
    const zone = city.zoneMap[r.zone]
    if (!zone.hubMap[r.id]) zone.hubMap[r.id] = { id: r.id, name: r.name, rowsList: [] }
    zone.hubMap[r.id].rowsList.push(scored)
  })

  return Object.values(cityMap).map(city => {
    const zones = Object.values(city.zoneMap).map(zone => {
      // hubsList avoids collision with scHubs score field
      const hubsList = Object.values(zone.hubMap).map(hub => {
        const agg = {}
        SCORE_KEYS.forEach(k => agg[k] = avg(hub.rowsList, k))
        return { id: hub.id, name: hub.name, ...agg }
      }).sort((a, b) => b.scHB - a.scHB)

      const zoneAgg = {}
      SCORE_KEYS.forEach(k => zoneAgg[k] = avg(hubsList, k))
      return { name: zone.name, hubsList, ...zoneAgg }
    }).sort((a, b) => b.scHB - a.scHB)

    const cityAgg = {}
    SCORE_KEYS.forEach(k => cityAgg[k] = avg(zones, k))
    return { name: city.name, zones, ...cityAgg }
  }).sort((a, b) => b.scHB - a.scHB)
}

export const getTrendData = (allRows, days = 30) => {
  const recent = allRows.slice(0, days * 18)
  const byDate = {}
  recent.forEach(r => {
    const s = calcScores(r)
    if (!byDate[r.date]) byDate[r.date] = []
    byDate[r.date].push(s)
  })
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => ({
      date:    date.slice(5),
      scHB:    rows.reduce((s, r) => s + r.scHB, 0)    / rows.length,
      scStars: rows.reduce((s, r) => s + r.scStars, 0) / rows.length,
      scHubs:  rows.reduce((s, r) => s + r.scHubs, 0)  / rows.length,
      scMerch: rows.reduce((s, r) => s + r.scMerch, 0) / rows.length,
    }))
}

export const ALL_DATA = generateDailyData()
