import { useEffect, useState } from 'react'
import { db, getRecentSessions, getUserStats, SUGGESTED_WORKOUTS } from '../db'
import { Zap, Flame, Target, ChevronRight } from 'lucide-react'

export default function Home({ user, onStartWorkout }) {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [suggested, setSuggested] = useState(null)

  useEffect(() => {
    if (!user) return
    getUserStats(user.id).then(setStats)
    getRecentSessions(user.id, 5).then(setRecent)
    // Pick today's suggested workout
    const paths = user.activePaths || ['gym']
    const path = paths[new Date().getDay() % paths.length]
    const options = SUGGESTED_WORKOUTS[path] || SUGGESTED_WORKOUTS.gym
    setSuggested({ path, ...options[new Date().getDate() % options.length] })
  }, [user])

  if (!user) return null

  const xpToNext = 1000 - (user.totalXP % 1000)
  const level = Math.floor((user.totalXP || 0) / 1000) + 1
  const xpPercent = ((user.totalXP || 0) % 1000) / 10

  const pathEmoji = { gym: '🏋️', basketball: '🏀', running: '🏃' }

  return (
    <div style={pg}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 4px' }}>
          {greeting()}, {user.name?.split(' ')[0]} 👊
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Ready to level up?
        </h1>
      </div>

      {/* XP Bar */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Level {level}</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{xpToNext} XP to next</span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPercent}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <StatPill icon={<Flame size={14}/>} label="Streak" value={`${user.currentStreak || 0}d`} />
          <StatPill icon={<Zap size={14}/>} label="Total XP" value={(user.totalXP || 0).toLocaleString()} />
          <StatPill icon={<Target size={14}/>} label="Sessions" value={recent.length} />
        </div>
      </div>

      {/* Today's Suggested Workout */}
      {suggested && (
        <div style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Today's suggested workout</p>
          <button onClick={() => onStartWorkout(suggested)} style={{ ...card, width: '100%', textAlign: 'left', cursor: 'pointer', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{pathEmoji[suggested.path]}</span>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 17 }}>{suggested.name}</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{suggested.description}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {suggested.exercises.map(e => (
                  <span key={e} style={pill}>{e}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
          </button>
        </div>
      )}

      {/* Recent Sessions */}
      {recent.length > 0 && (
        <div>
          <p style={sectionLabel}>Recent sessions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(s => (
              <div key={s.id} style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{pathEmoji[s.sportPath] || '💪'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{s.name || s.sportPath}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.date)} · {s.durationMins}min</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>+{s.xpEarned || 0} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
          <p style={{ margin: 0 }}>No sessions yet. Start your first workout to earn XP!</p>
        </div>
      )}
    </div>
  )
}

function StatPill({ icon, label, value }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--accent)', marginBottom: 2 }}>
        {icon} <span style={{ fontSize: 12 }}>{label}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const pg = { padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }
const card = { background: 'var(--card-bg)', borderRadius: 18, padding: '16px 18px', marginBottom: 16, border: '1px solid var(--border)', display: 'block' }
const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }
const pill = { background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }
