import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import AskPage     from './pages/AskPage'
import TicketsPage from './pages/TicketsPage'

// ─── Layout ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const links = [
    { label: 'Ask AI',  icon: '🤖', path: '/'        },
    { label: 'Tickets', icon: '🎫', path: '/tickets' },
  ]

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-sm font-bold">S</div>
          <span className="font-semibold text-gray-800">SupportBot Pro</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">RAG-powered ticket assistant</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <a
            key={link.path}
            href={link.path}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors group"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </nav>

      {/* DB Status — populated in Step 1 */}
      <div id="db-status" className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        DB: checking...
      </div>
    </aside>
  )
}

function Header({ title, subtitle }) {
  return (
    <div className="px-8 py-6 border-b border-gray-200 bg-white">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Pages (placeholders — filled in later steps) ────────────────────────────

function DashboardPage() {
  return (
    <div>
      <Header
        title="Welcome to SupportBot Pro"
        subtitle="AI-powered ticket resolution using RAG + PostgreSQL + Claude"
      />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Tickets',    value: '—', color: 'blue'  },
            { label: 'Resolved by AI',   value: '—', color: 'green' },
            { label: 'Avg. Match Score', value: '—', color: 'purple'},
          ].map(stat => (
            <div key={stat.label} className="card p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Build Roadmap</h2>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Project setup, PostgreSQL + pgvector schema',  done: true  },
              { step: 2, label: 'Data ingestion — seed tickets & embeddings',   done: false },
              { step: 3, label: 'RAG core — vector search + Claude generation', done: false },
              { step: 4, label: 'Backend REST API (Express routes)',             done: false },
              { step: 5, label: 'Frontend — Ticket list & AI chat UI',          done: false },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  item.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.done ? '✓' : item.step}
                </div>
                <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-700'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ComingSoonPage({ title }) {
  return (
    <div>
      <Header title={title} subtitle="Coming in a future step" />
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">🚧</div>
          <p className="text-sm">This page will be built in an upcoming step.</p>
        </div>
      </div>
    </div>
  )
}

// ─── App Shell ───────────────────────────────────────────────────────────────

export default function App() {
  const [dbStatus, setDbStatus] = useState('checking...')

  // Step 1 goal: hit /api/health and show DB connection status
  useEffect(() => {
    axios.get('/api/health')
      .then(res => {
        const el = document.getElementById('db-status')
        if (el) el.textContent = `DB: ${res.data.database}`
        setDbStatus(res.data.database)
      })
      .catch(() => {
        const el = document.getElementById('db-status')
        if (el) el.textContent = 'DB: disconnected'
        setDbStatus('disconnected')
      })
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"        element={<AskPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
        </Routes>
      </main>
    </div>
  )
}
