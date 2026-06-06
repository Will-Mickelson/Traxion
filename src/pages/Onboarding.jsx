import { useState } from 'react'
import { createUser } from '../db'

const PATHS = [
  { id: 'gym', emoji: '🏋️', label: 'Gym', sub: 'Lifting & strength' },
  { id: 'basketball', emoji: '🏀', label: 'Basketball', sub: 'Court & conditioning' },
  { id: 'running', emoji: '🏃', label: 'Running', sub: 'Road & track' },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [paths, setPaths] = useState([])
  const [goalDays, setGoalDays] = useState(4)
  const [weight, setWeight] = useState('')

  const togglePath = (id) => setPaths(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const finish = async () => {
    const userId = await createUser({ name, activePaths: paths, weeklyGoalDays: goalDays, bodyWeightKg: parseFloat(weight) || null })
    onComplete(userId)
  }

  const steps = [
    // Step 0 — Name
    <div key={0} style={s.step}>
      <div style={s.emoji}>👋</div>
      <h1 style={s.h1}>What should we call you?</h1>
      <p style={s.sub}>We'll personalize your experience</p>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Your name" style={s.input} autoFocus
        onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)}
      />
      <button onClick={() => setStep(1)} disabled={!name.trim()} style={{...s.btn, opacity: name.trim() ? 1 : 0.4}}>
        Continue →
      </button>
    </div>,

    // Step 1 — Paths
    <div key={1} style={s.step}>
      <div style={s.emoji}>🎯</div>
      <h1 style={s.h1}>What do you train?</h1>
      <p style={s.sub}>Pick all that apply</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {PATHS.map(p => (
          <button key={p.id} onClick={() => togglePath(p.id)} style={{
            ...s.pathCard,
            borderColor: paths.includes(p.id) ? 'var(--accent)' : 'var(--border)',
            background: paths.includes(p.id) ? 'var(--accent-dim)' : 'var(--card-bg)'
          }}>
            <span style={{ fontSize: 28 }}>{p.emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.sub}</div>
            </div>
            {paths.includes(p.id) && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 20 }}>✓</span>}
          </button>
        ))}
      </div>
      <button onClick={() => setStep(2)} disabled={!paths.length} style={{...s.btn, marginTop: 16, opacity: paths.length ? 1 : 0.4}}>
        Continue →
      </button>
    </div>,

    // Step 2 — Goals
    <div key={2} style={s.step}>
      <div style={s.emoji}>📅</div>
      <h1 style={s.h1}>Weekly workout goal</h1>
      <p style={s.sub}>How many days per week?</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[2,3,4,5,6,7].map(d => (
          <button key={d} onClick={() => setGoalDays(d)} style={{
            width: 56, height: 56, borderRadius: 14, border: `2px solid ${goalDays === d ? 'var(--accent)' : 'var(--border)'}`,
            background: goalDays === d ? 'var(--accent-dim)' : 'var(--card-bg)',
            color: goalDays === d ? 'var(--accent)' : 'var(--text)',
            fontWeight: 700, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit'
          }}>{d}</button>
        ))}
      </div>
      <div style={{ marginTop: 24, width: '100%' }}>
        <p style={{ ...s.sub, marginBottom: 8 }}>Body weight (optional, kg)</p>
        <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 80" type="number" style={s.input} />
      </div>
      <button onClick={finish} style={{ ...s.btn, marginTop: 16, background: 'var(--accent)', color: '#000' }}>
        Let's go 🚀
      </button>
    </div>
  ]

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 32, justifyContent: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 4, borderRadius: 2, flex: 1, background: i <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  )
}

const s = {
  step: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' },
  emoji: { fontSize: 52, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)', textAlign: 'center' },
  sub: { fontSize: 14, color: 'var(--text-muted)', margin: 0, textAlign: 'center' },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--border)',
    background: 'var(--card-bg)', color: 'var(--text)', fontSize: 16, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box'
  },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 14, border: '1.5px solid var(--accent)',
    background: 'transparent', color: 'var(--accent)', fontSize: 16, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
  },
  pathCard: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
    borderRadius: 16, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s', width: '100%', boxSizing: 'border-box'
  }
}
