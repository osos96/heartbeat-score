
// Data generation and calculation logic for HeartBeat Dashboard

const HUBS_CONFIG = [
  { id: 'c-e1', city: 'Greater Cairo', zone: 'East Cairo', name: 'Nasr City Hub', struggling: false },
  { id: 'c-e2', city: 'Greater Cairo', zone: 'East Cairo', name: 'Heliopolis Hub', struggling: false },
  { id: 'c-e3', city: 'Greater Cairo', zone: 'East Cairo', name: 'New Cairo Hub', struggling: false },
  { id: 'c-w1', city: 'Greater Cairo', zone: 'West Cairo', name: '6th October Hub', struggling: false },
  { id: 'c-w2', city: 'Greater Cairo', zone: 'West Cairo', name: 'Sheikh Zayed Hub', struggling: false },
  { id: 'c-s1', city: 'Greater Cairo', zone: 'South Cairo', name: 'Maadi Hub', struggling: true },
  { id: 'c-s2', city: 'Greater Cairo', zone: 'South Cairo', name: 'Helwan Hub', struggling: true },
  { id: 'c-n1', city: 'Greater Cairo', zone: 'North Cairo', name: 'Shubra Hub', struggling: false },
  { id: 'a-m1', city: 'Alexandria', zone: 'Central Alex', name: 'Montaza Hub', struggling: false },
  { id: 'a-m2', city: 'Alexandria', zone: 'Central Alex', name: 'Smouha Hub', struggling: false },
  { id: 'a-a1', city: 'Alexandria', zone: 'Agamy', name: 'Bitash Hub', struggling: true },
  { id: 'a-a2', city: 'Alexandria', zone: 'Agamy', name: 'Hanoville Hub', struggling: true },
  { id: 'g-n1', city: 'Giza', zone: 'North Giza', name: 'Imbaba Hub', struggling: false },
  { id: 'g-s1', city: 'Giza', zone: 'South Giza', name: 'Omrania Hub', struggling: false },
  { id: 'm-e1', city: 'Mansoura', zone: 'East Mansoura', name: 'Toriel Hub', struggling: false },
  { id: 'm-w1', city: 'Mansoura', zone: 'West Mansoura', name: 'Galaa Hub', struggling: false },
  { id: 'as-n1', city: 'Assiut', zone: 'North Assiut', name: 'Walideya Hub', struggling: true },
  { id: 'as-s1', city: 'Assiut', zone: 'South Assiut', name: 'Sadat Hub', struggling: true },
]

const seeded = (seed, min, max) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  const r = x - Math.floor(x)
  return min + r * (max - min)
}

const clamp = (v, mn=0, mx=100) => Math.min(Math.max(v, mn), mx)

export const generateDailyData = () => {
  const rows = []
  const today = new Date('2026-04-29')
  for (let d = 0; d < 90; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const ds = date.toISOString().split('T')[0]
    HUBS_CONFIG.forEach((hub, hi) => {
      const seed = d * 100 + hi
      const base = hub.struggling ? 78 : 90
      rows.push({
        date: ds, id: hub.id, city: hub.city, zone: hub.zone, name: hub.name,
        asr: clamp(base + seeded(seed, -6, 6)),
        ofd: clamp(88 + seeded(seed + 1, -8, 8)),
        fake: clamp((hub.struggling ? 6 : 1.5) + seeded(seed + 2, -1.5, 1.5), 0, 15),
        fdds: clamp(base - 4 + seeded(seed + 3, -5, 5)),
        crp: clamp(87 + seeded(seed + 4, -6, 6)),
        cre: clamp(84 + seeded(seed + 5, -6, 6)),
        delPromised: clamp(89 + seeded(seed + 6, -7, 7)),
        lost: clamp(1 + seeded(seed + 7, -0.5, 0.5) + (hub.struggling ? 0.8 : 0), 0, 5),
        damaged: clamp(1.5 + seeded(seed + 8, -0.5, 0.5) + (hub.struggling ? 0.5 : 0), 0, 5),
        dispatch: clamp(91 + seeded(seed + 9, -7, 7)),
        backlog: clamp((hub.struggling ? 14 : 3.5) + seeded(seed + 10, -3, 3), 0, 30),
        pending: clamp((hub.struggling ? 9 : 2) + seeded(seed + 11, -2, 2), 0, 20),
        cycle: clamp(89 + seeded(seed + 12, -7, 7)),
        ofdTotal: clamp(94 + seeded(seed + 13, -5, 5)),
        dsr: clamp(77 + seeded(seed + 14, -8, 8)),
      })
    })
  }
  return rows
}

export const calcScores = (row) => {
  const stars = row.asr * 0.30 + row.ofd * 0.20 + (100 - row.fake) * 0.10 + row.fdds * 0.20 + row.crp * 0.10 + row.cre * 0.10
  const hubs = row.delPromised * 0.15 + (100 - row.lost) * 0.15 + (100 - row.damaged) * 0.10 + row.dispatch * 0.10 + stars * 0.10 + (100 - row.backlog) * 0.15 + (100 - row.pending) * 0.10 + row.cycle * 0.10 + row.ofdTotal * 0.05
  const merchants = row.dsr
  const heartbeat = stars * 0.30 + hubs * 0.50 + merchants * 0.20
  return { ...row, stars, hubs, merchants, heartbeat }
}

export const aggregate = (rows) => {
  if (!rows.length) return []
  const avg = (arr, key) => arr.reduce((s, r) => s + r[key], 0) / arr.length
  const keys = ['asr','ofd','fake','fdds','crp','cre','delPromised','lost','damaged','dispatch','backlog','pending','cycle','ofdTotal','dsr','stars','hubs','merchants','heartbeat']
  
  const cityMap = {}
  rows.forEach(r => {
    const scored = calcScores(r)
    if (!cityMap[r.city]) cityMap[r.city] = { name: r.city, zoneMap: {} }
    const city = cityMap[r.city]
    if (!city.zoneMap[r.zone]) city.zoneMap[r.zone] = { name: r.zone, hubMap: {} }
    const zone = city.zoneMap[r.zone]
    if (!zone.hubMap[r.id]) zone.hubMap[r.id] = { id: r.id, name: r.name, rows: [] }
    zone.hubMap[r.id].rows.push(scored)
  })

  return Object.values(cityMap).map(city => {
    const zones = Object.values(city.zoneMap).map(zone => {
      const hubs = Object.values(zone.hubMap).map(hub => {
        const agg = {}
        keys.forEach(k => agg[k] = avg(hub.rows, k))
        return { id: hub.id, name: hub.name, ...agg }
      }).sort((a,b) => b.heartbeat - a.heartbeat)
      
      const zagg = {}
      keys.forEach(k => zagg[k] = avg(hubs, k))
      return { name: zone.name, hubs, ...zagg }
    }).sort((a,b) => b.heartbeat - a.heartbeat)
    
    const cagg = {}
    keys.forEach(k => cagg[k] = avg(zones, k))
    return { name: city.name, zones, ...cagg }
  }).sort((a,b) => b.heartbeat - a.heartbeat)
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
      date: date.slice(5),
      heartbeat: rows.reduce((s,r) => s + r.heartbeat, 0) / rows.length,
      stars: rows.reduce((s,r) => s + r.stars, 0) / rows.length,
      hubs: rows.reduce((s,r) => s + r.hubs, 0) / rows.length,
      merchants: rows.reduce((s,r) => s + r.merchants, 0) / rows.length,
    }))
}

export const ALL_DATA = generateDailyData()
