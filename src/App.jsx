
import React from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import BusinessModel from './components/BusinessModel'
import Problem from './components/Problem'
import Architecture from './components/Architecture'
import Framework from './components/Framework'
import Dashboard from './components/Dashboard'
import Roadmap from './components/Roadmap'
import Execution from './components/Execution'

export default function App() {
  return (
    <div style={{ background: '#ECEEF2', minHeight: '100vh' }}>
      <Nav />
      <section id="hero"><Hero /></section>
      <section id="business"><BusinessModel /></section>
      <section id="problem"><Problem /></section>
      <section id="architecture"><Architecture /></section>
      <section id="framework"><Framework /></section>
      <section id="dashboard"><Dashboard /></section>
      <section id="roadmap"><Roadmap /></section>
      <section id="execution"><Execution /></section>
    </div>
  )
}
