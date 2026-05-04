import { useState, useEffect } from 'react'
import axios from 'axios'

const CATEGORIES = ['all', 'technical', 'billing', 'account', 'access', 'performance', 'ai_generated']

// ─── Single ticket row ────────────────────────────────────────────────────────
function TicketRow({ ticket, onDelete }) {
  const priorityColor = {
    critical: 'badge-open',
    high:     'badge-open',
    medium:   'badge-pending',
    low:      'bg-gray-100 text-gray-500',
  }[ticket.priority] || 'bg-gray-100 text-gray-500'

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-800">{ticket.title}</p>
        {ticket.source === 'user_query' && (
          <span className="text-xs text-brand-500 font-medium">📥 Auto-saved from query</span>
        )}
      </td>
      <td className="px-4 py-4">
        <span className="badge bg-gray-100 text-gray-600 capitalize">{ticket.category}</span>
      </td>
      <td className="px-4 py-4">
        <span className={`badge ${priorityColor} capitalize`}>{ticket.priority}</span>
      </td>
      <td className="px-4 py-4 text-xs text-gray-400">
        {new Date(ticket.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-4">
        <button
          onClick={() => onDelete(ticket.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  TicketsPage — knowledge base browser
// ─────────────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const [tickets,     setTickets]     = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [category,    setCategory]    = useState('all')

  // ───────────────────────────────────────────────────────────────────────────
  //  YOUR TASK 1: fetchTickets
  //  Called on mount and whenever `category` changes.
  // ───────────────────────────────────────────────────────────────────────────
  //
  //  Step-by-step:
  //
  //  1. Set loading true, clear error
  //
  //  2. Build the URL — include ?category= only when it's not 'all':
  //       const url = category === 'all'
  //         ? '/api/tickets'
  //         : `/api/tickets?category=${category}`
  //
  //  3. Fetch with axios:
  //       const res = await axios.get(url)
  //       setTickets(res.data.tickets)
  //       setTotal(res.data.total)
  //
  //  4. On error: setError('Failed to load tickets')
  //
  //  5. Finally: setLoading(false)
  //
  // ───────────────────────────────────────────────────────────────────────────
  async function fetchTickets() {
    // ✏️ Write your code here:
    setLoading(true);
    setError(null);
    const url = category === 'all'? '/api/tickets' : `/api/tickets?category=${category}`
    try {
      const res = await axios.get(url);
      setTickets(res.data.tickets);
      setTotal(res.data.total);
      setLoading(false);
    } catch(err) {
      setError('Failed to load tickets')
      setLoading(false);
    }
  }

  // Run fetchTickets on mount and every time category filter changes
  useEffect(() => {
    fetchTickets()
  }, [category])

  // ───────────────────────────────────────────────────────────────────────────
  //  YOUR TASK 2: handleDelete
  //  Called when the user clicks "Delete" on a ticket row.
  // ───────────────────────────────────────────────────────────────────────────
  //
  //  Step-by-step:
  //
  //  1. Ask for confirmation:
  //       if (!window.confirm('Delete this ticket?')) return
  //
  //  2. Call the DELETE endpoint:
  //       await axios.delete(`/api/tickets/${id}`)
  //
  //  3. Remove it from local state (no need to re-fetch):
  //       setTickets(prev => prev.filter(t => t.id !== id))
  //       setTotal(prev => prev - 1)
  //
  //  4. On error: alert the error message
  //
  // ───────────────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    // ✏️ Write your code here:
    if (!window.confirm('Delete this ticket?')) return
    try {
      await axios.delete(`/api/tickets/${id}`);
      setTickets(prev => prev.filter(t => t.id !== id));
      setTotal(prev => prev - 1)
    } catch(err) {
      window.alert('Failed to delete the ticket. Try again!')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Knowledge base — {total} tickets total</p>
        </div>
      </div>

      <div className="p-8">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize
                ${category === c
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No tickets found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <TicketRow key={t.id} ticket={t} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
