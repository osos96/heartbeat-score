
import React, { useState } from 'react'
import { T } from './theme'

const BLUE = '#2563EB', GREEN = '#16A34A', AMBER = '#D97706', RED = '#E30613', PURPLE = '#7C3AED'

const MEMBERS = [
  { id:'a1', label:'Analyst 1', title:'Senior Data Analyst', color:BLUE },
  { id:'a2', label:'Analyst 2', title:'Data Analyst (Mid)',   color:PURPLE },
  { id:'a3', label:'Analyst 3', title:'Data Analyst (Junior)',color:AMBER },
  { id:'de', label:'Data Eng.',  title:'Data Engineer',       color:GREEN },
]

const PLAN_WEEKS = [
  { week:'Week 1–2', phase:'Diagnose', items:[
    { who:'Manager',  task:'Stakeholder interviews: Ops, Product, CS, Merchant Success leads. Agree KPI definitions.' },
    { who:'Analyst 1',task:'Redshift schema audit to map all available fields to HeartBeat KPI requirements.' },
    { who:'Analyst 2',task:'Current reporting audit to document all existing dashboards and manual reports.' },
    { who:'Analyst 3',task:'MongoDB collection inventory to map event types, field completeness, date coverage.' },
    { who:'Data Eng.', task:'Access audit: Redshift + MongoDB read access. Assess CDC feasibility.' },
  ]},
  { week:'Week 3–4', phase:'Diagnose', items:[
    { who:'Manager',  task:'Define full KPI taxonomy. Align definitions with Ops, Product, CS in sign-off session.' },
    { who:'Analyst 1',task:'Run H1: backlog vs DSR Pearson correlation. Produce hub-level scatter plot.' },
    { who:'Analyst 2',task:'Build merchant DSR baseline, rolling 30/60/90d DSR per merchant, assign tiers.' },
    { who:'Analyst 3',task:'Data quality gap report to find which HeartBeat KPIs lack data, ranked by impact.' },
    { who:'Data Eng.', task:'Build ETL for Fake Attempt detection (GPS + dwell time logic from delivery_attempts).' },
  ]},
  { week:'Week 5–6', phase:'Build', items:[
    { who:'Manager',  task:'Present H1 findings to VP Operations. Agree intervention on top 3 backlog hubs.' },
    { who:'Analyst 1',task:'Run H2: address quality geospatial cluster. Produce merchant-level address failure rates.' },
    { who:'Analyst 2',task:'HeartBeat dashboard v1 with network + city level. Deploy in read-only for leadership review.' },
    { who:'Analyst 3',task:'Historical backfill: 90-day hub KPI data to populate agg_heartbeat_daily in Redshift.' },
    { who:'Data Eng.', task:'Build ETL for CRP, CRE events from MongoDB customer_requests collection.' },
  ]},
  { week:'Week 7–8', phase:'Build', items:[
    { who:'Manager',  task:'Run H2 review with Product + Merchant Success. Agree address validation A/B test.' },
    { who:'Analyst 1',task:'Run H3: CS log join. Map CS contact rate to hub-level Delivery Promised% failures.' },
    { who:'Analyst 2',task:'Add hub drill-down + star KPI layer to HeartBeat dashboard.' },
    { who:'Analyst 3',task:'Automated weekly reporting: HeartBeat by city emailed to ops leadership every Monday.' },
    { who:'Data Eng.', task:'Alert engine v1: Whatsapp or Slack alert when Backlog% > 12% or Lost% > 2% for any hub.' },
  ]},
  { week:'Week 9–10', phase:'Scale', items:[
    { who:'Manager',  task:'H3 review with CS Director + VP Ops. Agree proactive notification playbook.' },
    { who:'Analyst 1',task:'Begin predictive backlog model: 24h-ahead forecast using OFD pipeline data.' },
    { who:'Analyst 2',task:'Merchant-facing DSR portal: per-merchant DSR, tier badge, weekly trend.' },
    { who:'Analyst 3',task:'Data dictionary and KPI glossary: full documentation for all metrics.' },
    { who:'Data Eng.', task:'Streaming aggregation using Kafka pipeline for 15-min ops-facing KPI refresh.' },
  ]},
  { week:'Week 11–13', phase:'Scale', items:[
    { who:'Manager',  task:'HeartBeat incorporated into weekly Ops leadership review. Score as official OKR.' },
    { who:'Analyst 1',task:'Predictive backlog model: validate on holdout, deploy in dashboard as "at-risk hub" flag.' },
    { who:'Analyst 2',task:'Merchant tier notification automation to auto-email on tier change.' },
    { who:'Analyst 3',task:'Train hub managers on reading KPI definitions and HeartBeat drill-down.' },
    { who:'Data Eng.', task:'T-1 Redshift availability confirmed. Schema Registry documented. Pipeline monitoring live.' },
  ]},
]

const PHASE_COLORS = { Diagnose: BLUE, Build: AMBER, Scale: GREEN }

const JIRA_CEREMONIES = [
  {
    title: 'PI Planning',
    cadence: 'Quarterly',
    icon: '◈',
    color: BLUE,
    desc: 'Program Increment planning sessions with each vertical including Operations, Product, Customer Service and Merchant Success to align on the next quarter\'s data requirements, development priorities, and analytical deliverables.',
    detail: 'Each vertical nominates a Data Champion who brings a prioritised backlog of data asks. The data team reviews feasibility, estimates, and commits to a PI roadmap. Outcomes are tracked as Epics in Jira.',
  },
  {
    title: 'Sprint Ceremonies',
    cadence: '2-Week Sprints',
    icon: '◎',
    color: PURPLE,
    desc: 'Standard Scrum ceremonies adapted for a data team: sprint planning from the JIRA board, daily async standups via structured Slack threads, and sprint reviews with stakeholder demos.',
    detail: 'Sprint tickets follow a standard template: business question → data source → owner → acceptance criteria → stakeholder sign-off. No ticket enters a sprint without a named internal customer.',
  },
  {
    title: 'Backlog Grooming',
    cadence: 'Weekly',
    icon: '◉',
    color: GREEN,
    desc: 'Weekly backlog refinement session to triage new requests from verticals, score them against the PI roadmap, and ensure JIRA tickets are well-defined before sprint commitment.',
    detail: 'Requests are scored on a 2×2 of impact vs. effort. High-impact, low-effort tickets get fast-tracked. High-effort items require PI-level commitment. All requests are visible to the requesting vertical in JIRA.',
  },
  {
    title: 'Stakeholder Demos',
    cadence: 'End of Sprint',
    icon: '◐',
    color: AMBER,
    desc: 'Every sprint closes with a 30-minute demo for the relevant vertical. Analysts walk through the deliverable live, no screenshots, no decks, to close the feedback loop before production release.',
    detail: 'Demos are recorded and shared in Confluence. Stakeholder sign-off is captured as a Jira transition before any dashboard or pipeline goes to production.',
  },
]

const JIRA_WORKFLOW = [
  { stage: 'Intake', desc: 'Vertical submits request via Jira intake form. Auto-assigns to Data Manager for triage.', color: '#64748B' },
  { stage: 'Scoped', desc: 'Manager defines data source, owner, and acceptance criteria. Ticket moves to backlog.', color: BLUE },
  { stage: 'In Sprint', desc: 'Ticket committed during sprint planning. Owner begins work with daily async updates.', color: PURPLE },
  { stage: 'In Review', desc: 'Deliverable shared with internal stakeholder for validation before production.', color: AMBER },
  { stage: 'Done', desc: 'Stakeholder sign-off captured. Ticket closed. Outcome logged in PI retrospective.', color: GREEN },
]

export default function Execution() {
  const [activeTab, setActiveTab] = useState('collaboration')

  return (
    <div style={{ padding: '100px 2rem 80px', maxWidth: 1340, margin: '0 auto' }}>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Section 07 — Execution Model</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginBottom: 14 }}>
        How we plan, collaborate, and deliver.
      </h2>
      <p style={{ fontSize: 16, color: T.textSec, lineHeight: 1.8, maxWidth: 720, marginBottom: 48 }}>
        Data work without structure drifts. Every analytical initiative, from a quick metric fix to a 13-week
        build, follows the same operating rhythm: PI planning with each vertical, sprint-based execution
        tracked in JIRA, and a clear cross-functional cadence that keeps the data team accountable to the business.
      </p>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 36, background: T.borderSub, borderRadius: 8, padding: 4,
        width: 'fit-content', border: `1px solid ${T.border}` }}>
        {[
          { k: 'collaboration', label: 'Collaboration Model' },
          { k: 'plan',          label: '90-Day Plan' },
          { k: 'team',          label: 'Team Delegation' },
        ].map(tab => (
          <button key={tab.k} onClick={() => setActiveTab(tab.k)} style={{
            padding: '8px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: activeTab === tab.k ? T.card : 'transparent',
            color: activeTab === tab.k ? T.text : T.textSec,
            boxShadow: activeTab === tab.k ? T.shadow : 'none', transition: 'all 0.15s'
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── COLLABORATION MODEL TAB ─────────────────────────────────────── */}
      {activeTab === 'collaboration' && (
        <div>
          {/* Intro: how we work with the data team */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32,
            boxShadow: T.shadow, marginBottom: 28, borderLeft: `4px solid ${BLUE}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              Working with the Data Team
            </div>
            <p style={{ fontSize: 15, color: T.textSec, lineHeight: 1.85, maxWidth: 820, marginBottom: 20 }}>
              The data team operates as an embedded product function, not a service desk. Every vertical
              interacts with us through a structured intake process, a shared JIRA board, and a quarterly
              Program Increment planning session. This prevents ad hoc requests from crowding out strategic
              work, and ensures that every deliverable traces back to a named business outcome.
            </p>
            <p style={{ fontSize: 15, color: T.textSec, lineHeight: 1.85, maxWidth: 820 }}>
              The HeartBeat Score itself is the output of this operating model: each KPI was co-defined with
              its vertical owner, each pipeline was built against a sprint commitment, and each dashboard
              view was signed off by the stakeholder who uses it. The same process applies to any future
              analytical capability we build at Bosta.
            </p>
          </div>

          {/* Jira Workflow Pipeline */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 16 }}>Jira Ticket Lifecycle</div>
            <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', overflowX: 'auto' }}>
              {JIRA_WORKFLOW.map((stage, i) => (
                <div key={stage.stage} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                    padding: '16px 18px', borderTop: `3px solid ${stage.color}`, boxShadow: T.shadow }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: stage.color, marginBottom: 6,
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage.stage}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{stage.desc}</div>
                  </div>
                  {i < JIRA_WORKFLOW.length - 1 && (
                    <div style={{ fontSize: 16, color: T.textMuted, padding: '0 6px', flexShrink: 0 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PI Planning + Sprint ceremonies */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 16 }}>Planning & Delivery Ceremonies</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {JIRA_CEREMONIES.map(c => (
                <div key={c.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: 24, boxShadow: T.shadow, borderTop: `3px solid ${c.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 20, color: c.color }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{c.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginTop: 1 }}>{c.cadence}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.75, marginBottom: 12 }}>{c.desc}</p>
                  <div style={{ background: T.borderSub, border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Functional Alignment Cadence */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, boxShadow: T.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 20 }}>Cross-Functional Alignment Cadence</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { dept: 'Operations', cadence: 'Weekly Hub Review', day: 'Every Monday AM',
                  format: 'HeartBeat score per hub, backlog alert triage, top 3 at-risk hubs with action owner',
                  owner: 'Analyst 2 prepares; Manager presents' },
                { dept: 'Product', cadence: 'Bi-Weekly Data Share', day: 'Every other Wednesday',
                  format: 'Address failure rate by merchant, checkout validation impact analysis, A/B test readout',
                  owner: 'Analyst 1 prepares; Manager + Product PM review' },
                { dept: 'Customer Service', cadence: 'Monthly SLA Review', day: 'Last Friday of month',
                  format: 'Delivery Promised% vs CS contact rate, hubs driving call spikes, proactive notification playbook',
                  owner: 'Analyst 2 prepares; Manager + CS Director align' },
              ].map((s, i) => (
                <div key={i} style={{ padding: 18, background: T.borderSub, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>{s.dept}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 2 }}>{s.cadence}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>{s.day}</div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 8 }}>{s.format}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>{s.owner}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 90-DAY PLAN TAB ─────────────────────────────────────────────── */}
      {activeTab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PLAN_WEEKS.map((wk, wi) => (
            <div key={wi} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
              overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                borderBottom: `1px solid ${T.border}`, background: T.borderSub }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PHASE_COLORS[wk.phase] }}/>
                <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{wk.week}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: `${PHASE_COLORS[wk.phase]}12`, color: PHASE_COLORS[wk.phase],
                  border: `1px solid ${PHASE_COLORS[wk.phase]}30` }}>{wk.phase} Phase</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {wk.items.map((item, ii) => {
                  const member = MEMBERS.find(m => m.label === item.who) || { color: T.red }
                  return (
                    <div key={ii} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0,
                      borderBottom: ii < wk.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ padding: '12px 16px', borderRight: `1px solid ${T.border}`,
                        background: T.borderSub, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: member.color, flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.who}</span>
                      </div>
                      <div style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{item.task}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TEAM DELEGATION TAB ─────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
            {MEMBERS.map(m => {
              const tasks = PLAN_WEEKS.flatMap(wk =>
                wk.items.filter(i => i.who === m.label).map(i => ({ week: wk.week, phase: wk.phase, task: i.task }))
              )
              return (
                <div key={m.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: 20, boxShadow: T.shadow, borderTop: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>{m.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: 10 }}>Task Timeline</div>
                  {tasks.map((t, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: `${PHASE_COLORS[t.phase]}12`, color: PHASE_COLORS[t.phase],
                          border: `1px solid ${PHASE_COLORS[t.phase]}30` }}>{t.week}</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, paddingLeft: 4,
                        borderLeft: `2px solid ${m.color}30` }}>{t.task}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
