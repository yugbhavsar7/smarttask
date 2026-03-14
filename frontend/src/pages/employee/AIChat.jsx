import { useState, useRef, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { RiSendPlaneLine, RiRobot2Line } from 'react-icons/ri'

const SUGGESTIONS = [
  'What tasks are due this week?',
  'Show my pending tasks',
  'Which task has highest priority?',
  'How many tasks have I completed?',
]

export default function AIChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi ${user?.name?.split(' ')[0] || ''}! I'm your AI assistant. I can help you with your tasks, deadlines, and progress. What would you like to know?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/tasks/').then(({ data }) => setTasks(data.results || data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simple AI logic using task data
  const generateResponse = (query) => {
    const q = query.toLowerCase()
    const today = new Date()

    if (!tasks.length) return "I couldn't fetch your tasks right now. Please try again."

    if (q.includes('due') && (q.includes('week') || q.includes('soon'))) {
      const soon = tasks.filter(t => {
        const d = new Date(t.deadline)
        const diff = (d - today) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 7 && t.status !== 'completed'
      })
      if (!soon.length) return "No tasks due this week. You're all caught up!"
      return `You have ${soon.length} task(s) due this week:\n${soon.map(t => `• ${t.task_title} (${t.deadline}) — ${t.priority} priority`).join('\n')}`
    }

    if (q.includes('pending') || q.includes('not started')) {
      const pending = tasks.filter(t => t.status === 'pending')
      if (!pending.length) return "No pending tasks! Great work."
      return `You have ${pending.length} pending task(s):\n${pending.map(t => `• ${t.task_title}`).join('\n')}`
    }

    if (q.includes('high priority') || q.includes('most important') || q.includes('highest')) {
      const high = tasks.filter(t => t.priority === 'high' && t.status !== 'completed')
      if (!high.length) return "No high priority tasks right now."
      return `Your high priority tasks:\n${high.map(t => `• ${t.task_title} — Due ${t.deadline}`).join('\n')}`
    }

    if (q.includes('complet')) {
      const done = tasks.filter(t => t.status === 'completed')
      return `You've completed ${done.length} task(s) so far. Keep it up!`
    }

    if (q.includes('progress') || q.includes('status')) {
      return tasks.map(t =>
        `• ${t.task_title}: ${t.progress?.progress_percent || 0}% (${t.status})`
      ).join('\n') || 'No task data available.'
    }

    if (q.includes('overdue') || q.includes('late') || q.includes('missed')) {
      const overdue = tasks.filter(t => {
        return new Date(t.deadline) < today && t.status !== 'completed'
      })
      if (!overdue.length) return "No overdue tasks. Great work staying on schedule!"
      return `⚠️ You have ${overdue.length} overdue task(s):\n${overdue.map(t => `• ${t.task_title} (was due ${t.deadline})`).join('\n')}`
    }

    if (q.includes('total') || q.includes('how many') || q.includes('count')) {
      return `Task summary:\n• Total: ${tasks.length}\n• Completed: ${tasks.filter(t=>t.status==='completed').length}\n• In Progress: ${tasks.filter(t=>t.status==='in_progress').length}\n• Pending: ${tasks.filter(t=>t.status==='pending').length}`
    }

    return `I found ${tasks.length} task(s) assigned to you. You can ask me about deadlines, priorities, progress, or pending tasks!`
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const reply = generateResponse(userMsg)
    setMessages(prev => [...prev, { role: 'bot', text: reply }])
    setLoading(false)
  }

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="page-title">AI Assistant</h1>
        <p className="page-sub">Ask me about your tasks, deadlines, and progress</p>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => { setInput(s) }}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card flex flex-col" style={{ minHeight: 420 }}>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: 400 }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <RiRobot2Line size={14} className="text-purple-600" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <RiRobot2Line size={14} className="text-purple-600" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about your tasks..."
            className="input-field flex-1 resize-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-40 shrink-0"
          >
            <RiSendPlaneLine size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
