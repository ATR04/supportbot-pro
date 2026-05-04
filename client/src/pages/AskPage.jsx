import { useState } from 'react'
import axios from 'axios'

// ─── Source card shown below the answer ──────────────────────────────────────
function SourceCard({ source, index }) {
  const scoreColor =
    source.similarityScore >= 80 ? 'bg-green-100 text-green-700' :
    source.similarityScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                   'bg-gray-100 text-gray-500'
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{source.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{source.category} · {source.priority}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${scoreColor}`}>
        {source.similarityScore}%
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AskPage — AI chat interface
// ─────────────────────────────────────────────────────────────────────────────
export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [result,   setResult]   = useState(null)   // { answer, sources, topScore }
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // ───────────────────────────────────────────────────────────────────────────
  //  YOUR TASK: handleSubmit
  //  Called when the user clicks "Ask" or presses Enter.
  // ───────────────────────────────────────────────────────────────────────────
  //
  //  Step-by-step:
  //
  //  1. Prevent default form submission and guard against empty question:
  //       e.preventDefault()
  //       if (!question.trim()) return
  //
  //  2. Set loading state and clear previous results/errors:
  //       setLoading(true)
  //       setResult(null)
  //       setError(null)
  //
  //  3. POST to /api/query using axios:
  //       const res = await axios.post('/api/query', { question })
  //       setResult(res.data)
  //       // res.data = { answer: string, sources: [...], topScore: number }
  //
  //  4. On error, set a friendly message:
  //       setError(err.response?.data?.error || 'Something went wrong')
  //
  //  5. Always set loading back to false in a finally block:
  //       setLoading(false)
  //
  // ───────────────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    // ✏️ Write your code here:
    e.preventDefault()
    if (!question.trim()) return;

    try {
      setLoading(true);
      setResult(null);
      setError(null);
      const response = await axios.post('/api/query', { question });
      setResult(response.data);
      setLoading(false);
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Ask AI</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ask any support question — the AI searches past tickets and generates a grounded answer</p>
      </div>

      <div className="p-8 max-w-3xl">

        {/* Input form */}
        <form onSubmit={handleSubmit} className="card p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's the issue?
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            rows={3}
            placeholder="e.g. My app crashes on Windows 11 when I open it..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">Press Enter to submit · Shift+Enter for new line</p>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Ask AI →'}
            </button>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="card p-6 mb-6 animate-pulse space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
          </div>
        )}

        {/* Answer */}
        {result && !loading && (
          <div className="space-y-5">
            {/* AI Answer box */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <span className="text-sm font-semibold text-gray-700">AI Answer</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
                  result.topScore >= 80 ? 'bg-green-100 text-green-700' :
                  result.topScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                         'bg-gray-100 text-gray-500'
                }`}>
                  {result.topScore}% match
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>

            {/* Sources */}
            {result.sources?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Similar tickets used as context
                </p>
                <div className="space-y-2">
                  {result.sources.map((s, i) => (
                    <SourceCard key={s.id} source={s} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
