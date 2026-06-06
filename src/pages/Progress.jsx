import { useState, useEffect } from 'react'
import { db, getRecentSessions, getPRs } from '../db'
import { getWeeklyChallenges } from '../challenges'
import { kgToDisplay } from '../units'

export default function Progress({ user }) {
  const [sessions, setSessions] = useState([])
  const [prs, setPRs] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [challenges, setChallenges] = useState([])

  const units = user?.units || 'imperial'

  useEffect(() => {
    if (!user) return
    getRecentSessions(user.id, 60).then(s => {
      setSessions(s)
      getPRs(user.id).then(p => {
        setPRs(p)
        db.nutritionLogs.where('userId').equals(user.id).toArray().then(logs => {
          setNutritionLogs(logs)
          setChallenges(getWeeklyChallenges(Math.floor((user.totalXP||0)/1000)+1, s, p, logs))
        })
      })
    })
  }, [user])

  const totalWorkouts = sessions.length
  const totalMins = sessions.reduce((a, s) => a + (s.durationMins || 0), 0)
  const totalXP = user?.totalXP || 0
  const level = Math.floor(totalXP / 1000) + 1
  const weeklyData = getWeeklyData(sessions)
  const pathCounts = sessions.reduce((a, s) => { a[s.sportPath] = (a[s.sportPath] || 0) + 1; return a }, {})
  const pathEmoji = { gym: '🏋️', basketball: '🏀', running: '🏃' }
  const maxWeekSessions = Math.max(...weeklyData.map(w => w.count), 1)

  // Weekly XP leaderboard vs past 8 weeks
  const weeklyXP = getWeeklyXP(sessions)
  const maxXP = Math.max(...weeklyXP.map(w => w.xp), 1)

  // Heatmap — last 10 weeks
  const heatmapDays = getHeatmapDays(sessions)

  // Macro trends — 7-day rolling average
  const macroTrend = getMacroTrend(nutritionLogs)

  // Pace zones for running
  const runSessions = sessions.filter(s => s.sportPath === 'running')

  const allBadges = [
    { name: 'First Rep', desc: 'Complete your first workout', emoji: '🥇', earned: totalWorkouts >= 1 },
    { name: 'On Fire', desc: '3-day streak', emoji: '🔥', earned: (user?.currentStreak || 0) >= 3 },
    { name: 'Dedicated', desc: '7-day streak', emoji: '⚡', earned: (user?.currentStreak || 0) >= 7 },
    { name: 'Grinder', desc: 'Complete 10 workouts', emoji: '💪', earned: totalWorkouts >= 10 },
    { name: 'Triple Threat', desc: 'Train all 3 paths', emoji: '🎯', earned: Object.keys(pathCounts).length >= 3 },
    { name: 'PR Machine', desc: 'Set 5 personal records', emoji: '🏆', earned: prs.length >= 5 },
    { name: 'Century', desc: 'Reach level 10', emoji: '👑', earned: level >= 10 },
  ]

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', color: 'var(--text)' }}>Progress</h1>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
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

      {/* Weekly challenges */}
      {challenges.length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
          <p style={sectionLabel}>This week's challenges</p>
          {challenges.map(c => (
            <div key={c.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.completed ? 'var(--success)' : 'var(--text)' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.xpReward} XP reward</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.completed ? 'var(--success)' : 'var(--text-muted)' }}>
                  {c.completed ? '✓ Done' : `${c.progress}/${c.target}`}
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round((c.progress / c.target) * 100))}%`, background: c.completed ? 'var(--success)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly sessions chart */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
        <p style={sectionLabel}>Weekly sessions</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {weeklyData.map((week, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (week.count / maxWeekSessions) * 64)}px`, background: i === weeklyData.length - 1 ? 'var(--accent)' : 'var(--bg-subtle)', border: i === weeklyData.length - 1 ? 'none' : '1px solid var(--border)', transition: 'height 0.5s ease' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{week.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly XP leaderboard */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
        <p style={sectionLabel}>Weekly XP leaderboard</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>You vs your past 8 weeks</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {weeklyXP.map((week, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (week.xp / maxXP) * 64)}px`, background: i === weeklyXP.length - 1 ? 'var(--accent)' : week.xp === Math.max(...weeklyXP.map(w=>w.xp)) ? '#3effa0' : 'var(--bg-subtle)', border: '1px solid var(--border)', transition: 'height 0.5s' }} />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{week.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🟡 This week</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🟢 Personal best</span>
        </div>
      </div>

      {/* Training heatmap */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
        <p style={sectionLabel}>Training calendar</p>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {heatmapDays.map((day, i) => (
            <div key={i} title={day.date} style={{ width: 12, height: 12, borderRadius: 3, background: day.count > 0 ? 'var(--accent)' : 'var(--bg-subtle)', opacity: day.count > 0 ? Math.min(1, 0.4 + day.count * 0.3) : 0.4, border: '1px solid var(--border)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Less</span>
          {[0.4, 0.6, 0.8, 1.0].map(o => <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', opacity: o }} />)}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {/* Macro trends */}
      {macroTrend.length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
          <p style={sectionLabel}>7-day nutrition trend</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'calories', label: 'Avg calories', unit: 'kcal', target: 2500 },
              { key: 'protein', label: 'Avg protein', unit: 'g', target: 180 },
            ].map(({ key, label, unit, target }) => {
              const avg = macroTrend.length ? Math.round(macroTrend.reduce((a, d) => a + (d[key] || 0), 0) / macroTrend.length) : 0
              const pct = Math.min(100, Math.round((avg / target) * 100))
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{avg} {unit}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--success)' : 'var(--accent)', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', marginBottom: 20 }}>
          <p style={sectionLabel}>Personal records 🏆</p>
          {prs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).map(pr => (
            <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{pr.exerciseName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>{kgToDisplay(pr.weight, units)} × {pr.reps}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>~{kgToDisplay(pr.estimatedOneRepMax, units)} 1RM</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Training split */}
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
          <div key={b.name} style={{ background: 'var(--card-bg)', border: `1px solid ${b.earned ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: '14px', opacity: b.earned ? 1 : 0.4 }}>
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
  return Array.from({ length: 6 }, (_, i) => {
    const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - start.getDay() - (5-i) * 7)
    const end = new Date(start); end.setDate(end.getDate() + 7)
    return { label: i === 5 ? 'This' : i === 4 ? 'Last' : `W-${5-i}`, count: sessions.filter(s => { const d = new Date(s.date); return d >= start && d < end }).length }
  })
}

function getWeeklyXP(sessions) {
  return Array.from({ length: 8 }, (_, i) => {
    const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - start.getDay() - (7-i) * 7)
    const end = new Date(start); end.setDate(end.getDate() + 7)
    const xp = sessions.filter(s => { const d = new Date(s.date); return d >= start && d < end }).reduce((a, s) => a + (s.xpEarned || 0), 0)
    return { label: i === 7 ? 'Now' : `W-${7-i}`, xp }
  })
}

function getHeatmapDays(sessions) {
  const days = []
  const sessionDates = new Set(sessions.map(s => new Date(s.date).toDateString()))
  for (let i = 69; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const count = sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).length
    days.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count })
  }
  return days
}

function getMacroTrend(logs) {
  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const log = logs.find(l => new Date(l.date).toDateString() === d.toDateString())
    if (log) last7.push(log)
  }
  return last7
}

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }
