import { useState, useEffect } from 'react'
import { db, getRecentSessions } from '../db'

export default function Progress({ user }) {
  const [sessions, setSessions] = useState([])
  const [badges, setBadges] = useState([])

  useEffect(() => {
    if (!user) return
    getRecentSessions(user.id, 20).then(setSessions)
    db.badges.where('userId').equals(user.id).toArray().then(setBadges)
  }, [user])

  const totalWorkouts = sessions.length
  const totalMins = sessions.reduce((a, s) => a + (s.durationMins || 0), 0)
  const totalXP = user?.totalXP || 0
  const level = Math.floor(totalXP / 1000) + 1

  const pathCounts = sessions.reduce((a, s) => { a[s.sportPath] = (a[s.sportPath] || 0) + 1; return a }, {})
  const pathEmoji = { gym: '🏋️', basketball: '🏀', running: '🏃' }

  const allBadges = [
    { name: 'First Rep', desc: 'Complete your first workout', emoji: '🥇', earned: totalWorkouts >= 1 },
    { name: 'On Fire', desc: '3-day streak', emoji: '🔥', earned: (user?.currentStreak || 0) >= 3 },
    { name: 'Dedicated', desc: '7-day streak', emoji: '⚡', earned: (user?.currentStreak || 0) >= 7 },
    { name: 'Grinder', desc: 'Complete 10 workouts', emoji: '💪', earned: totalWorkouts >= 10 },
    { name: 'Triple Threat', desc: 'Train all 3 paths', emoji: '🎯', earned: Object.keys(pathCounts).length >= 3 },
    { name: 'Century', desc: 'Reach level 10', emoji: '🏆', earned: level >= 10 },
  ]

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', color: 'var(--text)' }}>Progress</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Workouts', value: totalWorkouts, emoji: '💪' },
          { label: 'Total time', value: `${totalMins}min`, emoji: '⏱' },
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

      {/* Path breakdown */}
      {Object.keys(pathCounts).length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 24 }}>
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

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }
