import { useState, useEffect, useRef } from 'react'
import { db, getRecentSessions, getPRs, getUserStats } from '../db'
import { kgToDisplay, cmToDisplay } from '../units'
import { Send, RefreshCw, ChevronDown } from 'lucide-react'

const GOALS = [
  { id: 'strength', emoji: '🏋️', label: 'Build strength', desc: 'Bigger lifts, more power' },
  { id: 'muscle', emoji: '💪', label: 'Build muscle', desc: 'Hypertrophy and size' },
  { id: 'conditioning', emoji: '🫀', label: 'Conditioning', desc: 'Cardio and endurance' },
  { id: 'weight_loss', emoji: '🔥', label: 'Lose weight', desc: 'Burn fat, stay lean' },
  { id: 'sport', emoji: '🏀', label: 'Sport performance', desc: 'Basketball, running, athletics' },
  { id: 'general', emoji: '⚡', label: 'General fitness', desc: 'Overall health and energy' },
]

export default function Coach({ user, onSuggestionsUpdated }) {
  const [phase, setPhase] = useState('loading') // loading | intake | chat
  const [coachProfile, setCoachProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [prs, setPRs] = useState([])
  const [stats, setStats] = useState(null)
  const messagesEndRef = useRef(null)

  // Intake form state
  const [selectedGoals, setSelectedGoals] = useState([])
  const [specificTarget, setSpecificTarget] = useState('')
  const [injuryHistory, setInjuryHistory] = useState('')
  const [trainingYears, setTrainingYears] = useState('1')
  const [pastMaxes, setPastMaxes] = useState({ bench: '', squat: '', deadlift: '', ohp: '' })
  const [intakeStep, setIntakeStep] = useState(0)

  const units = user?.units || 'imperial'

  useEffect(() => {
    if (!user) return
    Promise.all([
      getRecentSessions(user.id, 20),
      getPRs(user.id),
      getUserStats(user.id),
      db.coachProfiles ? db.coachProfiles.where('userId').equals(user.id).first().catch(() => null) : Promise.resolve(null)
    ]).then(([s, p, st, cp]) => {
      setSessions(s); setPRs(p); setStats(st)
      if (cp) { setCoachProfile(cp); setPhase('chat'); loadWelcomeBack(cp, s, p, st) }
      else setPhase('intake')
    })
  }, [user])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const buildSystemPrompt = (cp, s, p, st) => {
    const recentNames = s.slice(0, 5).map(x => `${x.sportPath}: ${x.name} (${x.durationMins}min)`).join(', ')
    const prList = p.slice(0, 6).map(x => `${x.exerciseName}: ${kgToDisplay(x.weight, units)} x ${x.reps}`).join(', ')
    const bw = st?.bodyWeightKg ? kgToDisplay(st.bodyWeightKg, units) : 'unknown'
    const ht = user.heightCm ? cmToDisplay(user.heightCm, units) : 'unknown'
    const level = Math.floor((user.totalXP || 0) / 1000) + 1
    const streak = user.currentStreak || 0
    const paths = (user.activePaths || []).join(', ')

    return `You are Traxion Coach, an expert personal trainer and strength & conditioning coach inside the Traxion fitness app. You are direct, motivating, and give specific actionable advice — not generic platitudes.

ATHLETE PROFILE:
- Name: ${user.name}
- App level: ${level}, Streak: ${streak} days
- Sport paths: ${paths}
- Body weight: ${bw}, Height: ${ht}
- Training experience: ${cp?.trainingYears || '?'} years
- Primary goals: ${(cp?.goals || []).join(', ')}
- Specific target: ${cp?.specificTarget || 'none'}
- Injury history: ${cp?.injuryHistory || 'none'}
- Past maxes (self-reported): Bench ${cp?.pastMaxes?.bench || '?'}, Squat ${cp?.pastMaxes?.squat || '?'}, Deadlift ${cp?.pastMaxes?.deadlift || '?'}, OHP ${cp?.pastMaxes?.ohp || '?'} (${units})
- Recent sessions: ${recentNames || 'none yet'}
- Current PRs in app: ${prList || 'none yet'}

COACHING RULES:
- Always give specific weights, reps, and sets when recommending workouts — reference their actual PRs and maxes
- For basketball players, tie strength work to on-court performance gains
- For runners, use pace zones and mileage targets
- Keep responses concise and mobile-friendly — use short paragraphs and bullet points
- When asked to suggest a workout, format it clearly with exercise name, sets x reps, and target weight
- When asked to update suggestions, respond with a JSON block wrapped in <suggestions> tags containing an array of workout objects with {path, name, exercises[], description} — the app will parse this automatically
- Be encouraging but honest — if their goals are unrealistic, say so`
  }

  const loadWelcomeBack = async (cp, s, p, st) => {
    const systemPrompt = buildSystemPrompt(cp, s, p, st)
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Give me a brief personalized check-in. Look at my recent sessions and PRs and tell me what you notice, then give me one specific recommendation for today.' }]
        })
      })
      const data = await res.json()
      const text = data.content?.find(b => b.type === 'text')?.text || 'Hey! Ready to train?'
      setMessages([{ role: 'assistant', content: text }])
    } catch (e) {
      setMessages([{ role: 'assistant', content: `Hey ${user.name?.split(' ')[0]}! Ready to crush today's session? Ask me anything about your training.` }])
    }
    setLoading(false)
  }

  const saveCoachProfile = async () => {
    const profile = { userId: user.id, goals: selectedGoals, specificTarget, injuryHistory, trainingYears, pastMaxes, createdAt: new Date() }
    try {
      const existing = await db.coachProfiles.where('userId').equals(user.id).first()
      if (existing) await db.coachProfiles.update(existing.id, profile)
      else await db.coachProfiles.add(profile)
    } catch (e) { await db.coachProfiles.add(profile) }
    setCoachProfile(profile)
    setPhase('chat')
    loadWelcomeBack(profile, sessions, prs, stats)
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const systemPrompt = buildSystemPrompt(coachProfile, sessions, prs, stats)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      const text = data.content?.find(b => b.type === 'text')?.text || 'Something went wrong. Try again.'

      // Check for suggestions block
      const suggestMatch = text.match(/<suggestions>([\s\S]*?)<\/suggestions>/)
      if (suggestMatch) {
        try {
          const suggestions = JSON.parse(suggestMatch[1].trim())
          await db.customSuggestions.put({ userId: user.id, suggestions, updatedAt: new Date() })
          onSuggestionsUpdated?.()
        } catch (e) {}
      }

      const cleanText = text.replace(/<suggestions>[\s\S]*?<\/suggestions>/, '').trim()
      setMessages(m => [...m, { role: 'assistant', content: cleanText || 'Suggestions updated on your home screen!' }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Check your internet and try again.' }])
    }
    setLoading(false)
  }

  const refreshSuggestions = () => {
    sendMessage("Analyze my recent workout history and PRs, then suggest 3 personalized workouts for this week — one per sport path I train. Format them as a suggestions block so the app can display them. Make the exercises and weights specific to my current level.")
  }

  if (phase === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>Loading coach...</div>
  )

  if (phase === 'intake') return <IntakeFlow step={intakeStep} setStep={setIntakeStep} selectedGoals={selectedGoals} setSelectedGoals={setSelectedGoals} specificTarget={specificTarget} setSpecificTarget={setSpecificTarget} injuryHistory={injuryHistory} setInjuryHistory={setInjuryHistory} trainingYears={trainingYears} setTrainingYears={setTrainingYears} pastMaxes={pastMaxes} setPastMaxes={setPastMaxes} units={units} onComplete={saveCoachProfile} userName={user.name} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>🤖 Traxion Coach</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Powered by Claude · Knows your history</p>
        </div>
        <button onClick={refreshSuggestions} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, border: '1.5px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} /> Update suggestions
        </button>
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
        {[
          "What should I train today?",
          "Review my recent progress",
          "Help me hit a new PR",
          "Fix my weak points",
          "Plan this week's workouts",
        ].map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>{q}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--card-bg)',
              color: msg.role === 'user' ? '#000' : 'var(--text)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 60, left: 0, right: 0, padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask your coach anything..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={18} color={input.trim() ? '#000' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  )
}

function IntakeFlow({ step, setStep, selectedGoals, setSelectedGoals, specificTarget, setSpecificTarget, injuryHistory, setInjuryHistory, trainingYears, setTrainingYears, pastMaxes, setPastMaxes, units, onComplete, userName }) {
  const toggleGoal = (id) => setSelectedGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
  const wUnit = units === 'imperial' ? 'lbs' : 'kg'

  const steps = [
    // Step 0 — Goals
    <div key={0} style={is.step}>
      <div style={is.emoji}>🎯</div>
      <h2 style={is.h2}>What are your goals?</h2>
      <p style={is.sub}>Pick all that apply — your coach will prioritize these</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        {GOALS.map(g => (
          <button key={g.id} onClick={() => toggleGoal(g.id)} style={{ ...is.card, borderColor: selectedGoals.includes(g.id) ? 'var(--accent)' : 'var(--border)', background: selectedGoals.includes(g.id) ? 'var(--accent-dim)' : 'var(--card-bg)' }}>
            <span style={{ fontSize: 24 }}>{g.emoji}</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
            </div>
            {selectedGoals.includes(g.id) && <span style={{ color: 'var(--accent)' }}>✓</span>}
          </button>
        ))}
      </div>
      <input value={specificTarget} onChange={e => setSpecificTarget(e.target.value)} placeholder="Specific target? (e.g. bench 225lbs, run 5K)" style={is.input} />
      <button onClick={() => setStep(1)} disabled={!selectedGoals.length} style={{ ...is.btn, opacity: selectedGoals.length ? 1 : 0.4 }}>Continue →</button>
    </div>,

    // Step 1 — Experience
    <div key={1} style={is.step}>
      <div style={is.emoji}>📅</div>
      <h2 style={is.h2}>Training experience</h2>
      <p style={is.sub}>How many years have you been training consistently?</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {[['<1', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4-5', '4'], ['6+', '6']].map(([label, val]) => (
          <button key={val} onClick={() => setTrainingYears(val)} style={{ width: 72, height: 72, borderRadius: 16, border: `2px solid ${trainingYears === val ? 'var(--accent)' : 'var(--border)'}`, background: trainingYears === val ? 'var(--accent-dim)' : 'var(--card-bg)', color: trainingYears === val ? 'var(--accent)' : 'var(--text)', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
        ))}
      </div>
      <div style={{ width: '100%', marginTop: 8 }}>
        <p style={is.label}>Any injury history? (optional)</p>
        <textarea value={injuryHistory} onChange={e => setInjuryHistory(e.target.value)} placeholder="e.g. left knee, lower back — coach will work around these" style={{ ...is.input, minHeight: 80, resize: 'vertical' }} />
      </div>
      <button onClick={() => setStep(2)} style={is.btn}>Continue →</button>
    </div>,

    // Step 2 — Past maxes
    <div key={2} style={is.step}>
      <div style={is.emoji}>💪</div>
      <h2 style={is.h2}>Current maxes</h2>
      <p style={is.sub}>Your best single rep or recent heavy set ({wUnit}). Skip anything you don't do.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {[
          { key: 'bench', label: 'Bench Press', placeholder: units === 'imperial' ? '185' : '85' },
          { key: 'squat', label: 'Squat', placeholder: units === 'imperial' ? '225' : '102' },
          { key: 'deadlift', label: 'Deadlift', placeholder: units === 'imperial' ? '275' : '125' },
          { key: 'ohp', label: 'Overhead Press', placeholder: units === 'imperial' ? '115' : '52' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', width: 130, flexShrink: 0 }}>{label}</span>
            <input value={pastMaxes[key]} onChange={e => setPastMaxes(m => ({ ...m, [key]: e.target.value }))} placeholder={placeholder} type="number"
              style={{ ...is.input, margin: 0, flex: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 28 }}>{wUnit}</span>
          </div>
        ))}
      </div>
      <button onClick={onComplete} style={{ ...is.btn, marginTop: 16, background: 'var(--accent)', color: '#000' }}>
        Meet my coach 🤖
      </button>
    </div>
  ]

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>Setting up your coach · Step {step + 1} of 3</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(i => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />)}
          </div>
        </div>
        <div style={{ marginTop: 24 }}>{steps[step]}</div>
      </div>
    </div>
  )
}

const is = {
  step: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' },
  emoji: { fontSize: 48 },
  h2: { fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text)', textAlign: 'center' },
  sub: { fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: 1.5 },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' },
  card: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  input: { width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
}
