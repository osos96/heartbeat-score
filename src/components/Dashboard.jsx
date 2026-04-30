
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

const HUB_COORDS = {
  'c-e1': [30.065,31.330],'c-e2': [30.092,31.322],'c-e3': [30.030,31.470],
  'c-w1': [29.964,30.924],'c-w2': [30.019,30.976],
  'c-s1': [29.962,31.250],'c-s2': [29.850,31.334],
  'c-n1': [30.130,31.245],
  'a-m1': [31.278,30.006],'a-m2': [31.215,29.948],
  'a-a1': [31.080,29.818],'a-a2': [31.065,29.795],
  'g-n1': [30.066,31.205],'g-s1': [29.994,31.150],
  'm-e1': [31.022,31.420],'m-w1': [31.041,31.275],
  'as-n1':[27.195,31.200],'as-s1':[27.155,31.165],
}

const ZONE_TO_DISTRICTS = {
  'East Cairo':    { gov:'Cairo',      names:['Nasr City','New Cairo-1','New Cairo-2','New Cairo-3','Al Salam','Shroq','Ain Shams','Marg','Nuzha','Madinat Nasr-2'] },
  'West Cairo':    { gov:'Giza',       names:['6 October-1','6 October-2','Shaykh Zayed','Kardasa','Auseem'] },
  'South Cairo':   { gov:'Cairo',      names:['15 Mayu','Hilwan','Al Tibbin','Basatin','Maadi','Al Khalifa','Misr Al-Qadima','Tura','Al Darb al-Ahmar'] },
  'North Cairo':   { gov:'Cairo',      names:['Rud Al-Farag','Shubra','Zawiyya Al-Hamra','Al Sharabiyya','Al Sahil','Hadaiq Al-Qubba','Al Matariyya','Al Zaytun','Al Wayli','Al Zahir'] },
  'Central Alex':  { gov:'Alexandria', names:['Sidi Gabir','Bab Sharqi','Al Raml','Muntazah','Al Attarin','Al Gumruk','Al Manshiyya','Muharam Bik','Karmuz','Mina Al-Basal','Kesm than Al Raml'] },
  'Agamy':         { gov:'Alexandria', names:['Al Amreia','Al Dikhila','Burg al-Arab','Burg Al-Arab City','North Coast'] },
  'North Giza':    { gov:'Giza',       names:['Imbaba','Waraq','Auseem','Bulaq Al-DakrUr','DuqqI','Al-Aguza'] },
  'South Giza':    { gov:'Giza',       names:['Giza','Umraniyya','Al-Ahram','Hwamdeia','Badrashain'] },
  'East Mansoura': { gov:'Dakahlia',   names:['El Mansora','E Mansora 2','El Mansora 1','Talkha','Mahalet Demna'] },
  'West Mansoura': { gov:'Dakahlia',   names:['Nebro','Aga','Sinbillawin'] },
  'North Assiut':  { gov:'Assiut',     names:['Assuit City','Kesm Awal Assuit','Kesm Than Assuit','Alfath','Assuit'] },
  'South Assiut':  { gov:'Assiut',     names:['Abnub','Abu Tig','Sahil Silim','Manfalut'] },
}

const CITY_BOUNDS = {
  'Greater Cairo': [[29.75,30.85],[30.22,31.97]],
  'Alexandria':    [[30.72,29.37],[31.34,30.09]],
  'Giza':          [[29.85,30.66],[30.35,31.25]],
  'Mansoura':      [[30.58,31.20],[31.52,32.09]],
  'Assiut':        [[26.79,30.52],[27.55,31.52]],
}

const ZONE_BOUNDS = {
  'East Cairo':    [[29.97,31.30],[30.20,31.77]],
  'West Cairo':    [[29.94,30.86],[30.13,31.14]],
  'South Cairo':   [[29.78,31.14],[30.05,31.49]],
  'North Cairo':   [[30.06,31.22],[30.14,31.31]],
  'Central Alex':  [[31.17,29.86],[31.34,30.05]],
  'Agamy':         [[30.73,29.37],[31.19,29.99]],
  'North Giza':    [[30.03,31.06],[30.35,31.24]],
  'South Giza':    [[29.82,31.14],[30.03,31.28]],
  'East Mansoura': [[31.00,31.30],[31.18,31.61]],
  'West Mansoura': [[30.88,31.20],[31.22,31.52]],
  'North Assiut':  [[27.11,31.13],[27.28,31.31]],
  'South Assiut':  [[27.02,30.82],[27.37,31.37]],
}

const srand = s => { const x = Math.sin(s*9301+49297)*233280; return x-Math.floor(x) }

const gaussPt = (lat,lng,sigma,seed) => {
  const u1 = Math.max(1e-10, srand(seed))
  const u2 = srand(seed+1000)
  const mag = sigma*Math.sqrt(-2*Math.log(u1))
  return [lat+mag*Math.cos(2*Math.PI*u2), lng+mag*Math.sin(2*Math.PI*u2)]
}

const hubHeatPoints = (hubId, score) => {
  const [hubLat,hubLng] = HUB_COORDS[hubId]||[30,31]
  const pts = []
  const hs = hubId.split('').reduce((s,c)=>s*31+c.charCodeAt(0),7)
  const nc = 4+(hs%3)
  const centers = [[hubLat,hubLng]]
  for(let ci=0;ci<nc;ci++){
    const s1=hs*17+ci*137
    const r=0.004+srand(s1)*0.012, a=srand(s1+500)*Math.PI*2
    centers.push([hubLat+r*Math.cos(a),hubLng+r*Math.sin(a)])
  }
  const intensity=0.55+(score/100)*0.45
  centers.forEach(([cLat,cLng],ci)=>{
    const cnt=50+Math.round(srand(hs+ci*41)*60)
    for(let i=0;i<cnt;i++){
      const seed=hs*3+ci*211+i*7
      const [pl,png]=gaussPt(cLat,cLng,0.0018,seed)
      const dist=Math.hypot(pl-cLat,png-cLng)
      const w=Math.max(0.1,intensity*Math.exp(-dist*dist/(2*0.002*0.002)))
      pts.push([pl,png,w])
    }
    for(let i=0;i<20;i++){
      const seed=hs*5+ci*311+i*13
      const [pl,png]=gaussPt(cLat,cLng,0.005,seed)
      pts.push([pl,png,intensity*0.25])
    }
  })
  for(let i=0;i<80;i++){
    const seed=hs*7+i*19
    const r=0.002+srand(seed)*0.018, a=srand(seed+200)*Math.PI*2
    pts.push([hubLat+r*Math.cos(a),hubLng+r*Math.sin(a),intensity*0.12])
  }
  return pts
}

const getHubTrend = id =>
  ALL_DATA.filter(r=>r.id===id).sort((a,b)=>a.date.localeCompare(b.date))
    .map(r=>({date:r.date.slice(5),...calcScores(r)}))

const getZoneTrend = zone => {
  const byDate={}
  ALL_DATA.filter(r=>r.zone===zone).forEach(r=>{
    const s=calcScores(r)
    if(!byDate[r.date]) byDate[r.date]=[]
    byDate[r.date].push(s)
  })
  return Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>{
    const obj={date:date.slice(5)}
    TREND_KEYS.forEach(k=>{obj[k]=rows.reduce((s,r)=>s+(r[k]||0),0)/rows.length})
    return obj
  })
}

const TrendBadge = ({curr,prev}) => {
  if(!prev||prev===0) return null
  const diff=curr-prev
  return (
    <span style={{fontSize:9,fontWeight:700,color:diff>=0?GREEN:RED,marginLeft:4,verticalAlign:'middle',whiteSpace:'nowrap'}}>
      {diff>=0?'▲':'▼'}{Math.abs(diff).toFixed(1)}
    </span>
  )
}

const Ring = ({value,size=90,stroke=7}) => {
  const col=hbColor(value), r=(size-stroke)/2, circ=2*Math.PI*r
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.borderSub} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-value/100)} strokeLinecap="round"
        style={{transition:'stroke-dashoffset 0.6s ease'}}/>
    </svg>
  )
}

const LeafletMap = ({cities,onSelectCity,expandedZone,onHubSelect,activeHubId}) => {
  const containerRef=useRef(null), mapRef=useRef(null), layersRef=useRef([])
  const heatRef=useRef(null), geoCitiesRef=useRef(null), geoDistRef=useRef(null)
  const [ready,setReady]=useState(false), [drillCity,setDrillCity]=useState(null)

  const clearLayers=useCallback(()=>{
    layersRef.current.forEach(l=>{try{l.remove()}catch(e){}})
    layersRef.current=[]
    if(heatRef.current){try{heatRef.current.remove()}catch(e){}; heatRef.current=null}
  },[])

  useEffect(()=>{
    let timer
    const init=()=>{
      if(!window.L||!containerRef.current||mapRef.current) return
      mapRef.current=window.L.map(containerRef.current,{center:[28.0,30.8],zoom:6,scrollWheelZoom:false,zoomControl:false})
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {attribution:'© OpenStreetMap contributors © CARTO',subdomains:'abcd',maxZoom:19}).addTo(mapRef.current)
      window.L.control.zoom({position:'bottomright'}).addTo(mapRef.current)
      setReady(true)
    }
    if(window.L){init()}else{timer=setInterval(()=>{if(window.L){clearInterval(timer);init()}},120)}
    return()=>clearInterval(timer)
  },[])

  const ensureCitiesGeo=useCallback(async()=>{
    if(geoCitiesRef.current) return geoCitiesRef.current
    const r=await fetch('/egy_cities.geojson')
    geoCitiesRef.current=await r.json()
    return geoCitiesRef.current
  },[])

  const ensureDistGeo=useCallback(async()=>{
    if(geoDistRef.current) return geoDistRef.current
    const r=await fetch('/egy_districts.geojson')
    geoDistRef.current=await r.json()
    return geoDistRef.current
  },[])

  const getCityScore=useCallback(label=>{
    const c=cities.find(c=>c.name===label)
    return c?c.scHB:null
  },[cities])

  const renderCountry=useCallback(async L=>{
    clearLayers()
    try{mapRef.current.setView([28.0,30.8],6)}catch(e){}
    const geo=await ensureCitiesGeo()
    const layer=L.geoJSON(geo,{
      style:feat=>{
        const score=getCityScore(feat.properties.label)
        const col=score!==null?hbColor(score):'#9CA3AF'
        return{color:col,weight:2,fillColor:col,fillOpacity:0.20}
      },
      onEachFeature:(feat,fl)=>{
        const label=feat.properties.label, score=getCityScore(label)
        if(score!==null){
          fl.bindTooltip(`<b>${label}</b>: ${score.toFixed(0)}%`,
            {direction:'center',permanent:true,className:'city-tooltip',opacity:0.9})
          fl.on('click',()=>{setDrillCity(label);onSelectCity(label)})
        }
      }
    }).addTo(mapRef.current)
    layersRef.current.push(layer)
  },[clearLayers,ensureCitiesGeo,getCityScore,onSelectCity])

  const renderCity=useCallback(async(L,cityLabel)=>{
    clearLayers()
    const bounds=CITY_BOUNDS[cityLabel]
    if(bounds){try{mapRef.current.fitBounds(bounds,{padding:[20,20]})}catch(e){}}
    const geo=await ensureDistGeo()
    const zoneColorMap={}
    cities.forEach(city=>city.zones?.forEach(z=>{zoneColorMap[z.name]=hbColor(z.scHB||0)}))
    const govMap={'Greater Cairo':'Cairo','Alexandria':'Alexandria','Giza':'Giza','Mansoura':'Dakahlia','Assiut':'Assiut'}
    const gov=govMap[cityLabel]||cityLabel
    const distToZone={}
    Object.entries(ZONE_TO_DISTRICTS).forEach(([zone,info])=>{
      if(info.gov===gov) info.names.forEach(d=>{distToZone[d]=zone})
    })
    const layer=L.geoJSON(geo,{
      filter:feat=>feat.properties.gov===gov,
      style:feat=>{
        const zone=distToZone[feat.properties.district]
        const col=zone?(zoneColorMap[zone]||'#9CA3AF'):'#CBD5E1'
        return{color:col,weight:1.5,fillColor:col,fillOpacity:0.22}
      },
      onEachFeature:(feat,fl)=>{
        const zone=distToZone[feat.properties.district]
        fl.bindTooltip(
          `<span style="font-size:11px"><b>${feat.properties.district}</b>${zone?` · ${zone}`:''}</span>`,
          {direction:'center',sticky:true})
      }
    }).addTo(mapRef.current)
    layersRef.current.push(layer)
    cities.forEach(city=>city.zones?.forEach(zone=>zone.hubsList?.forEach(hub=>{
      const coords=HUB_COORDS[hub.id]; if(!coords) return
      const hs=hub.scHB||0, hcol=hbColor(hs), isActive=hub.id===activeHubId
      const sz=isActive?14:10
      const hIcon=L.divIcon({
        html:`<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${hcol};border:${isActive?3:2}px solid white;box-shadow:0 1px ${isActive?8:4}px rgba(0,0,0,${isActive?0.4:0.25})"></div>`,
        className:'',iconAnchor:[sz/2,sz/2],
      })
      const m=L.marker(coords,{icon:hIcon}).addTo(mapRef.current)
        .bindTooltip(`${hub.name}: ${hs.toFixed(0)}%`,{direction:'top',offset:[0,-8]})
        .on('click',()=>onHubSelect(hub.id===activeHubId?null:hub.id))
      layersRef.current.push(m)
    })))
  },[clearLayers,ensureDistGeo,cities,activeHubId,onHubSelect])

  const renderHeat=useCallback((L,zoneName,filterHubId)=>{
    if(heatRef.current){try{heatRef.current.remove()}catch(e){}; heatRef.current=null}
    let pts=[]
    cities.forEach(city=>city.zones?.forEach(zone=>{
      if(zone.name!==zoneName) return
      zone.hubsList?.forEach(hub=>{
        if(filterHubId&&hub.id!==filterHubId) return
        pts=pts.concat(hubHeatPoints(hub.id,hub.scHB||80))
      })
    }))
    if(window.L.heatLayer&&pts.length){
      heatRef.current=window.L.heatLayer(pts,{
        radius:14,blur:10,maxZoom:17,max:1.0,minOpacity:0.25,
        gradient:{0.0:'#0ea5e9',0.2:'#3B82F6',0.45:'#8B5CF6',0.65:'#F59E0B',0.82:'#EF4444',1.0:'#E30613'}
      }).addTo(mapRef.current)
    }
  },[cities])

  useEffect(()=>{
    if(!ready||!mapRef.current) return
    if(drillCity){renderCity(window.L,drillCity)}else{renderCountry(window.L)}
  },[ready,cities,drillCity,renderCity,renderCountry])

  useEffect(()=>{
    if(!ready||!mapRef.current||!expandedZone||!drillCity) return
    const b=ZONE_BOUNDS[expandedZone]
    if(b){try{mapRef.current.fitBounds(b,{padding:[30,30]})}catch(e){}}
    renderHeat(window.L,expandedZone,activeHubId)
  },[ready,expandedZone,drillCity,cities,renderHeat,activeHubId])

  useEffect(()=>{
    if(!ready||!mapRef.current||!expandedZone) return
    renderHeat(window.L,expandedZone,activeHubId)
  },[ready,activeHubId,expandedZone,renderHeat])

  const handleBack=()=>{
    setDrillCity(null); onSelectCity(null)
    if(heatRef.current){try{heatRef.current.remove()}catch(e){}; heatRef.current=null}
  }

  useEffect(()=>()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null}},[])

  return (
    <div style={{position:'relative',border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden',height:340}}>
      {drillCity&&(
        <button onClick={handleBack} style={{position:'absolute',top:10,left:10,zIndex:1000,
          background:T.card,border:`1px solid ${T.border}`,borderRadius:7,
          padding:'5px 12px',fontSize:11,fontWeight:700,color:T.textSec,cursor:'pointer',boxShadow:T.shadow}}>
          ← All Cities
        </button>
      )}
      {activeHubId&&expandedZone&&(
        <div style={{position:'absolute',top:10,right:10,zIndex:1000,
          background:'rgba(37,99,235,0.9)',borderRadius:7,
          padding:'5px 12px',fontSize:11,fontWeight:700,color:'#fff',boxShadow:T.shadow}}>
          Hub filter active — click hub again to reset
        </div>
      )}
      <div ref={containerRef} style={{width:'100%',height:'100%'}}/>
      <style>{`.city-tooltip{background:white;border:1.5px solid rgba(0,0,0,0.15);border-radius:5px;font-size:11px;font-weight:700;font-family:Inter,sans-serif;padding:3px 8px;box-shadow:0 2px 6px rgba(0,0,0,0.14)}`}</style>
    </div>
  )
}

const KpiBar = ({label,value,isNeg}) => {
  const col=isNeg?(value>8?RED:value>3?AMBER:GREEN):(value>=88?GREEN:value>=75?AMBER:RED)
  const fill=isNeg?Math.min(value*5,100):value
  return (
    <div style={{marginBottom:9}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:11,color:T.textSec}}>{label}</span>
        <span style={{fontSize:11,fontWeight:700,color:col,fontFamily:'monospace'}}>{value.toFixed(1)}%</span>
      </div>
      <div style={{height:3,background:T.borderSub,borderRadius:2}}>
        <div style={{height:'100%',width:`${fill}%`,background:col,borderRadius:2,transition:'width 0.4s'}}/>
      </div>
    </div>
  )
}

const TrendPanel = ({trendData,title}) => {
  const [selIdx,setSelIdx]=useState(0)
  const kpi=KPI_OPTS[selIdx]
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.08em'}}>
          {title} - Performance Trend (180 days)
        </span>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {KPI_OPTS.map((opt,i)=>(
            <button key={opt.key} onClick={()=>setSelIdx(i)} style={{
              padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:20,cursor:'pointer',
              background:selIdx===i?kpi.color:T.cardSub,color:selIdx===i?'#fff':T.textSec,
              border:`1px solid ${selIdx===i?kpi.color:T.border}`,transition:'all 0.15s',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={trendData} margin={{top:8,right:12,bottom:0,left:-20}}>
          <CartesianGrid stroke={T.borderSub} vertical={false}/>
          <XAxis dataKey="date" tick={{fontSize:8,fill:T.textMuted}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
          <YAxis domain={[55,100]} tick={{fontSize:8,fill:T.textMuted}} axisLine={false} tickLine={false} width={28}/>
          <ReferenceLine y={kpi.goal} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1.5}
            label={{value:'Goal',position:'insideTopRight',fontSize:8,fill:GREEN}}/>
          <ReferenceLine y={kpi.crit} stroke={RED} strokeDasharray="4 3" strokeWidth={1.5}
            label={{value:'Critical',position:'insideBottomRight',fontSize:8,fill:RED}}/>
          <Tooltip formatter={v=>`${(+v).toFixed(1)}%`}
            contentStyle={{fontSize:11,borderColor:T.border,background:T.card}} labelStyle={{color:T.textMuted}}/>
          <Line type="monotone" dataKey={kpi.key} stroke={kpi.color} strokeWidth={2} dot={false} name={kpi.label}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 14px',boxShadow:T.shadowMd}}>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:5}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{fontSize:12,color:p.color,fontWeight:600}}>{p.name}: {(+p.value).toFixed(1)}%</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period,setPeriod]=useState(30)
  const [expandedCity,setExpandedCity]=useState(null)
  const [expandedZone,setExpandedZone]=useState(null)
  const [expandedHub,setExpandedHub]=useState(null)
  const [mapSelectedCity,setMapSelectedCity]=useState(null)
  const [showPillars,setShowPillars]=useState(false)
  const [activeMapHub,setActiveMapHub]=useState(null)

  const filteredData=useMemo(()=>ALL_DATA.slice(0,period*18),[period])
  const cities=useMemo(()=>aggregate(filteredData),[filteredData])
  const prevData=useMemo(()=>ALL_DATA.slice(period*18,period*36),[period])
  const prevCities=useMemo(()=>aggregate(prevData),[prevData])
  const trendData=useMemo(()=>getTrendData(ALL_DATA,period),[period])

  const prevCityMap=useMemo(()=>{
    const m={}
    prevCities.forEach(c=>{
      m[c.name]=c
      c.zones?.forEach(z=>{
        m[`z:${z.name}`]=z
        z.hubsList?.forEach(h=>{m[`h:${h.id}`]=h})
      })
    })
    return m
  },[prevCities])

  const netAvg=k=>cities.length?cities.reduce((s,c)=>s+(c[k]||0),0)/cities.length:0
  const prevAvg=k=>prevCities.length?prevCities.reduce((s,c)=>s+(c[k]||0),0)/prevCities.length:0

  const hb=netAvg('scHB'), stars=netAvg('scStars'), hubs=netAvg('scHubs'), merch=netAvg('scMerch')
  const delta=hb-prevAvg('scHB')

  const handleMapSelectCity=useCallback(name=>{
    setMapSelectedCity(name); setActiveMapHub(null)
    if(name){setExpandedCity(name);setExpandedZone(null);setExpandedHub(null)}
    else{setExpandedCity(null);setExpandedZone(null);setExpandedHub(null)}
  },[])

  const handleHubSelect=useCallback(id=>{setActiveMapHub(id)},[])

  const hubTrendData=useMemo(()=>expandedHub?getHubTrend(expandedHub):null,[expandedHub])
  const zoneTrendData=useMemo(()=>expandedZone?getZoneTrend(expandedZone):null,[expandedZone])

  const resetPeriod=d=>{
    setPeriod(d)
    setExpandedCity(null);setExpandedZone(null);setExpandedHub(null)
    setMapSelectedCity(null);setActiveMapHub(null)
  }

  return (
    <div style={{padding:'100px 2rem 60px',maxWidth:1300,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:40,flexWrap:'wrap',gap:16}}>
        <div>
          <span style={{fontSize:11,fontWeight:700,color:T.red,letterSpacing:'0.1em',textTransform:'uppercase'}}>Section 05: Live Demo</span>
          <h2 style={{fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:800,letterSpacing:'-0.03em',color:T.text,marginTop:6}}>HeartBeat Dashboard Mockup</h2>
          <p style={{color:T.textMuted,fontSize:13,marginTop:4}}>Simulated network data — click city polygons on the map or rows in the table to drill down</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {[7,30,90].map(d=>(
            <button key={d} onClick={()=>resetPeriod(d)} style={{
              padding:'7px 16px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer',
              background:period===d?T.red:T.card,color:period===d?'#fff':T.textSec,
              border:`1px solid ${period===d?T.red:T.border}`,transition:'all 0.2s',
            }}>{d===7?'7D':d===30?'30D':'90D'}</button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20,marginBottom:20,
        background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:28,
        borderTop:`3px solid ${T.red}`,boxShadow:T.shadowMd}}>
        <div style={{display:'flex',alignItems:'center',gap:20,paddingRight:28,borderRight:`1px solid ${T.border}`}}>
          <div style={{position:'relative',width:110,height:110}}>
            <Ring value={hb} size={110} stroke={9}/>
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
              <div style={{fontSize:9,color:T.textMuted,fontWeight:700,letterSpacing:'0.06em'}}>HB SCORE</div>
              <div style={{fontSize:22,fontWeight:900,color:T.text,lineHeight:1}}>{hb.toFixed(0)}</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.08em'}}>HeartBeat Score</div>
            <div style={{fontSize:44,fontWeight:900,color:hbColor(hb),letterSpacing:'-0.04em',lineHeight:1}}>{hb.toFixed(1)}%</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
              <span style={{fontSize:12,fontWeight:700,color:delta>=0?GREEN:RED}}>{delta>=0?'▲':'▼'} {Math.abs(delta).toFixed(1)}%</span>
              <span style={{fontSize:11,color:T.textMuted}}>vs prev {period}d</span>
              <span style={{marginLeft:8,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:4,
                background:`${hbColor(hb)}12`,color:hbColor(hb),border:`1px solid ${hbColor(hb)}30`}}>{hbLabel(hb)}</span>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,alignItems:'center'}}>
          {[
            {label:'Stars OKR',val:stars,weight:'30%',color:GREEN,key:'scStars'},
            {label:'Hubs OKR',val:hubs,weight:'50%',color:BLUE,key:'scHubs'},
            {label:'Merchants OKR',val:merch,weight:'20%',color:AMBER,key:'scMerch'},
          ].map(p=>(
            <div key={p.label} style={{padding:16,borderRadius:10,background:T.cardSub,border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:700,color:T.textSec,textTransform:'uppercase',letterSpacing:'0.06em'}}>{p.label}</span>
                <span style={{fontSize:10,color:T.textMuted,fontWeight:700}}>{p.weight}</span>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <div style={{fontSize:28,fontWeight:900,color:T.text,letterSpacing:'-0.03em'}}>{p.val.toFixed(1)}%</div>
                <TrendBadge curr={p.val} prev={prevAvg(p.key)}/>
              </div>
              <div style={{marginTop:8,height:3,background:T.border,borderRadius:2}}>
                <div style={{height:'100%',width:`${p.val}%`,background:p.color,borderRadius:2,transition:'width 0.5s'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>
            Network Geography — click a city polygon to drill in
            {expandedZone&&<span style={{color:BLUE,marginLeft:8}}>· Click hub pins to filter heatmap</span>}
          </div>
          <LeafletMap cities={cities} onSelectCity={handleMapSelectCity}
            expandedZone={expandedZone} onHubSelect={handleHubSelect} activeHubId={activeMapHub}/>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,boxShadow:T.shadow}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.08em'}}>Score Trend - {period}d</span>
            <button onClick={()=>setShowPillars(v=>!v)} style={{
              fontSize:11,color:showPillars?T.red:T.textSec,background:'transparent',border:'none',cursor:'pointer',fontWeight:700}}>
              {showPillars?'Hide':'Show'} pillar lines
            </button>
          </div>
          <ResponsiveContainer width="100%" height={268}>
            <LineChart data={trendData}>
              <CartesianGrid stroke={T.borderSub} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[60,100]} tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false} width={28}/>
              <ReferenceLine y={88} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1.5}
                label={{value:'Goal',position:'insideTopLeft',fontSize:9,fill:GREEN}}/>
              <ReferenceLine y={75} stroke={RED} strokeDasharray="4 3" strokeWidth={1.5}
                label={{value:'Critical',position:'insideBottomLeft',fontSize:9,fill:RED}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone" dataKey="scHB" name="HeartBeat" stroke={RED} strokeWidth={2.5} dot={false}/>
              {showPillars&&<>
                <Line type="monotone" dataKey="scStars" name="Stars" stroke={GREEN} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scHubs" name="Hubs" stroke={BLUE} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="scMerch" name="Merchants" stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
              </>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden',boxShadow:T.shadow}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 130px 110px 110px 110px',gap:8,
          padding:'14px 24px',borderBottom:`1px solid ${T.border}`,background:T.cardSub}}>
          {['Location','HeartBeat','Stars','Hubs','Merchants'].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</div>
          ))}
        </div>

        {cities.map(city=>{
          const ce=expandedCity===city.name, pCity=prevCityMap[city.name]||{}
          return (
            <React.Fragment key={city.name}>
              <div onClick={()=>{
                const next=!ce
                setExpandedCity(next?city.name:null)
                setExpandedZone(null);setExpandedHub(null);setActiveMapHub(null)
                setMapSelectedCity(next?city.name:null)
              }} style={{display:'grid',gridTemplateColumns:'1fr 130px 110px 110px 110px',gap:8,
                padding:'13px 24px',background:ce?T.redLight:'transparent',
                borderBottom:`1px solid ${T.borderSub}`,cursor:'pointer',transition:'background 0.2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:22,height:22,display:'inline-flex',alignItems:'center',justifyContent:'center',
                    borderRadius:5,background:ce?T.red:T.borderSub,color:ce?'#fff':T.textMuted,
                    fontSize:11,fontWeight:700,flexShrink:0}}>{ce?'▾':'▸'}</span>
                  <span style={{fontWeight:700,fontSize:14,color:T.text}}>{city.name}</span>
                  <span style={{fontSize:10,color:T.textMuted}}>{city.zones?.length} zones</span>
                </div>
                <div style={{fontWeight:800,fontSize:15,color:hbColor(city.scHB||0)}}>
                  {(city.scHB||0).toFixed(1)}%<TrendBadge curr={city.scHB||0} prev={pCity.scHB}/>
                </div>
                <div style={{fontSize:13,color:hbColor(city.scStars||0)}}>
                  {(city.scStars||0).toFixed(1)}%<TrendBadge curr={city.scStars||0} prev={pCity.scStars}/>
                </div>
                <div style={{fontSize:13,color:hbColor(city.scHubs||0)}}>
                  {(city.scHubs||0).toFixed(1)}%<TrendBadge curr={city.scHubs||0} prev={pCity.scHubs}/>
                </div>
                <div style={{fontSize:13,color:hbColor(city.scMerch||0)}}>
                  {(city.scMerch||0).toFixed(1)}%<TrendBadge curr={city.scMerch||0} prev={pCity.scMerch}/>
                </div>
              </div>

              {ce&&city.zones?.map(zone=>{
                const ze=expandedZone===zone.name, pZone=prevCityMap[`z:${zone.name}`]||{}
                return (
                  <React.Fragment key={zone.name}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 130px 110px 110px 110px',gap:8,
                      padding:'11px 24px 11px 44px',background:ze?T.blueLight:T.cardSub,
                      borderBottom:`1px solid ${T.border}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span onClick={()=>{setExpandedZone(ze?null:zone.name);setExpandedHub(null);setActiveMapHub(null)}}
                          style={{width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',
                            borderRadius:4,background:ze?BLUE:T.border,color:ze?'#fff':T.textMuted,
                            fontSize:10,fontWeight:700,flexShrink:0,cursor:'pointer'}}>{ze?'▾':'▸'}</span>
                        <span onClick={()=>{setExpandedZone(ze?null:zone.name);setExpandedHub(null);setActiveMapHub(null)}}
                          style={{fontWeight:600,fontSize:13,color:T.textSec,cursor:'pointer'}}>{zone.name}</span>
                        <span style={{fontSize:10,color:T.textMuted}}>{zone.hubsList?.length} hubs</span>
                      </div>
                      <div style={{fontWeight:700,fontSize:13,color:hbColor(zone.scHB||0)}}>
                        {(zone.scHB||0).toFixed(1)}%<TrendBadge curr={zone.scHB||0} prev={pZone.scHB}/>
                      </div>
                      <div style={{fontSize:12,color:hbColor(zone.scStars||0)}}>
                        {(zone.scStars||0).toFixed(1)}%<TrendBadge curr={zone.scStars||0} prev={pZone.scStars}/>
                      </div>
                      <div style={{fontSize:12,color:hbColor(zone.scHubs||0)}}>
                        {(zone.scHubs||0).toFixed(1)}%<TrendBadge curr={zone.scHubs||0} prev={pZone.scHubs}/>
                      </div>
                      <div style={{fontSize:12,color:hbColor(zone.scMerch||0)}}>
                        {(zone.scMerch||0).toFixed(1)}%<TrendBadge curr={zone.scMerch||0} prev={pZone.scMerch}/>
                      </div>
                    </div>

                    {ze&&zoneTrendData&&(
                      <div style={{padding:'16px 24px 8px 44px',background:T.blueLight,borderBottom:`1px solid ${T.border}`}}>
                        <TrendPanel trendData={zoneTrendData} title={zone.name}/>
                      </div>
                    )}

                    {ze&&zone.hubsList?.map(hub=>{
                      const he=expandedHub===hub.id, pHub=prevCityMap[`h:${hub.id}`]||{}
                      const isMapActive=activeMapHub===hub.id
                      return (
                        <React.Fragment key={hub.id}>
                          <div onClick={()=>setExpandedHub(he?null:hub.id)}
                            style={{display:'grid',gridTemplateColumns:'1fr 130px 110px 110px 110px',gap:8,
                              padding:'10px 24px 10px 68px',
                              background:isMapActive?`${BLUE}15`:he?T.greenLight:T.card,
                              borderBottom:`1px solid ${T.border}`,cursor:'pointer',transition:'background 0.2s',
                              borderLeft:isMapActive?`3px solid ${BLUE}`:'none'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',
                                borderRadius:4,background:he?GREEN:T.borderSub,color:he?'#fff':T.textMuted,
                                fontSize:10,fontWeight:700,flexShrink:0}}>{he?'▾':'▸'}</span>
                              <span style={{fontSize:13,color:T.text,fontWeight:500}}>{hub.name}</span>
                              {isMapActive&&(
                                <span style={{fontSize:9,fontWeight:700,color:BLUE,background:`${BLUE}15`,
                                  border:`1px solid ${BLUE}40`,borderRadius:4,padding:'1px 6px'}}>map filtered</span>
                              )}
                            </div>
                            <div style={{fontWeight:700,fontSize:13,color:hbColor(hub.scHB||0)}}>
                              {(hub.scHB||0).toFixed(1)}%<TrendBadge curr={hub.scHB||0} prev={pHub.scHB}/>
                            </div>
                            <div style={{fontSize:12,color:hbColor(hub.scStars||0)}}>
                              {(hub.scStars||0).toFixed(1)}%<TrendBadge curr={hub.scStars||0} prev={pHub.scStars}/>
                            </div>
                            <div style={{fontSize:12,color:hbColor(hub.scHubs||0)}}>
                              {(hub.scHubs||0).toFixed(1)}%<TrendBadge curr={hub.scHubs||0} prev={pHub.scHubs}/>
                            </div>
                            <div style={{fontSize:12,color:hbColor(hub.scMerch||0)}}>
                              {(hub.scMerch||0).toFixed(1)}%<TrendBadge curr={hub.scMerch||0} prev={pHub.scMerch}/>
                            </div>
                          </div>
                          {he&&(
                            <div style={{padding:'20px 24px 20px 84px',background:T.greenLight,borderBottom:`1px solid ${T.border}`}}>
                              {hubTrendData&&<TrendPanel trendData={hubTrendData} title={hub.name}/>}
                              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
                                <div>
                                  <div style={{fontSize:10,fontWeight:700,color:GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}>Stars KPIs</div>
                                  <KpiBar label="ASR - Attempt Success" value={hub.asr||0}/>
                                  <KpiBar label="FDDS - First Day Delivery" value={hub.fdds||0}/>
                                  <KpiBar label="OFD / Star" value={hub.ofd||0}/>
                                  <KpiBar label="CRP - Return Pickups" value={hub.crp||0}/>
                                  <KpiBar label="Fake Attempt Rate" value={hub.fake||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{fontSize:10,fontWeight:700,color:BLUE,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}>Hub KPIs</div>
                                  <KpiBar label="Delivery Promised" value={hub.delPromised||0}/>
                                  <KpiBar label="Same-Day Dispatch" value={hub.dispatch||0}/>
                                  <KpiBar label="Cycle Adaptation" value={hub.cycle||0}/>
                                  <KpiBar label="Backlog Rate" value={hub.backlog||0} isNeg/>
                                  <KpiBar label="Lost Parcels" value={hub.lost||0} isNeg/>
                                  <KpiBar label="Damaged Rate" value={hub.damaged||0} isNeg/>
                                </div>
                                <div>
                                  <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}>Merchants</div>
                                  <KpiBar label="DSR - Delivery Success" value={hub.dsr||0}/>
                                  <div style={{marginTop:14,padding:12,background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}>
                                    <div style={{fontSize:10,color:T.textMuted,marginBottom:6,fontWeight:700,textTransform:'uppercase'}}>Merchant Tier</div>
                                    {(hub.dsr||0)>80?<span style={{color:GREEN,fontWeight:700,fontSize:13}}>Excellent (&gt;80%)</span>
                                    :(hub.dsr||0)>=75?<span style={{color:'#34D399',fontWeight:700,fontSize:13}}>Very Good (75-80%)</span>
                                    :(hub.dsr||0)>=70?<span style={{color:BLUE,fontWeight:700,fontSize:13}}>Good (70-75%)</span>
                                    :(hub.dsr||0)>=65?<span style={{color:AMBER,fontWeight:700,fontSize:13}}>Default (65-70%)</span>
                                    :<span style={{color:RED,fontWeight:700,fontSize:13}}>Bad Business (&lt;65%)</span>}
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
