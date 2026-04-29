
import React, { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Architecture from './components/Architecture'
import Framework from './components/Framework'
import Dashboard from './components/Dashboard'
import Roadmap from './components/Roadmap'

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')
  return (
    <div style={{ background: '#08090E', minHeight: '100vh' }}>
      <Nav active={activeSection} setActive={setActiveSection} />
      <section id="hero"><Hero /></section>
      <section id="problem"><Problem /></section>
      <section id="architecture"><Architecture /></section>
      <section id="framework"><Framework /></section>
      <section id="dashboard"><Dashboard /></section>
      <section id="roadmap"><Roadmap /></section>
    </div>
  )
}
