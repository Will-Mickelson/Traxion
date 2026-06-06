import { useState, useEffect } from 'react'
import { db, getRecentSessions, getPRs } from '../db'

export default function Progress({ user }) {
  const [sessions, setSessions] = useState([])
  const [prs, setPRs] = useState([])

  useEffect(() => {
    if (!user) return
    getRecentSessions(user.id, 30).then(setSessions)
    getPRs(user.id).then(setPRs)
  }, [user])

  const totalWorkouts = sessions.length
  const totalMins = sessions.reduce((a, s) => a + (s.durationMins || 0), 0)
  const totalXP = user?.totalXP || 0
  const level = Math.floor(totalXP / 1000) + 1

  // Weekly volume chart data — last 6 weeks
  const weeklyData = getWeeklyData(sessions)

  const pathCounts = sessions.reduce((a, s) => { a[s.sportPath] = (a[s.sportPath] || 0) + 1; return a }, {})
  const pathEmoji = { gym: '🏋️', basketball: '🏀', running: '🏃' }

  const allBadges = [
    { name: 'First Rep', desc: 'Complete your first workout', emoji: '🥇', earned: totalWorkouts >= 1 },
    { name: 'On Fire', desc: '3-day streak', emoji: '🔥', earned: (user?.currentStreak || 0) >= 3 },
    { name: 'Dedicated', desc: '7-day streak', emoji: '⚡', earned: (user?.currentStreak || 0) >= 7 },
    { name: 'Grinder', desc: 'Complete 10 workouts', emoji: '💪', earned: totalWorkouts >= 10 },
    { name: 'Triple Threat', desc: 'Train all 3 paths', emoji: '🎯', earned: Object.keys(pathCounts).length >= 3 },
    { name: 'PR Machine', desc: 'Set 5 personal records', emoji: '🏆', earned: prs.length >= 5 },
    { name: 'Century', desc: 'Reach level 10', emoji: '👑', earned: level >= 10 },
  ]

  const maxWeekSessions = Math.max(...weeklyData.map(w => w.count), 1)

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', color: 'var(--text)' }}>Progress</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Workouts', value: totalWorkouts, emoji: '💪' },
          { label: 'Total time', value: `${totalMins}m`, emoji: '⏱' },
          { label: 'Total XP', value: totalXP.toLocaleString(), emoji: '⚡' },
          { label: 'Level', value: level, emoji: '🎮' },
        ].map(({ label, value, emoji }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Weekly volume chart */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
        <p style={sectionLabel}>Weekly sessions</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {weeklyData.map((week, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.max(4, (week.count / maxWeekSessions) * 64)}px`,
                background: i === weeklyData.length - 1 ? 'var(--accent)' : 'var(--bg-subtle)',
                border: i === weeklyData.length - 1 ? 'none' : '1px solid var(--border)',
                transition: 'height 0.5s ease'
              }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{week.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Records */}
      {prs.length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
          <p style={sectionLabel}>Personal records 🏆</p>
          {prs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).map(pr => (
            <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{pr.exerciseName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>{pr.weight}kg × {pr.reps}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>~{Math.round(pr.estimatedOneRepMax)}kg 1RM</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Path breakdown */}
      {Object.keys(pathCounts).length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
          <p style={sectionLabel}>Training split</p>
          {Object.entries(pathCounts).map(([path, count]) => {
            const pct = Math.round((count / totalWorkouts) * 100)
            return (
              <div key={path} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{pathEmoji[path]} {path}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count} sessions · {pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Badges */}
      <p style={sectionLabel}>Badges</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {allBadges.map(b => (
          <div key={b.name} style={{ background: 'var(--card-bg)', border: `1px solid ${b.earned ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: '14px', opacity: b.earned ? 1 : 0.4, transition: 'all 0.2s' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
            {b.earned && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 6 }}>✓ Earned</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function getWeeklyData(sessions) {
  const weeks = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay() - i * 7)
    start.setHours(0,0,0,0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const count = sessions.filter(s => { const d = new Date(s.date); return d >= start && d < end }).length
    const label = i === 0 ? 'This' : i === 1 ? 'Last' : `W-${i}`
    weeks.push({ label, count, start, end })
  }
  return weeks
}

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }
