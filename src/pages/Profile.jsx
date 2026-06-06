import { useState } from 'react'
import { db } from '../db'

const PATH_INFO = {
  gym: { emoji: '🏋️', label: 'Gym', desc: 'Lifting & strength training' },
  basketball: { emoji: '🏀', label: 'Basketball', desc: 'Court & conditioning' },
  running: { emoji: '🏃', label: 'Running', desc: 'Road & track' }
}

export default function Profile({ user, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const level = Math.floor((user?.totalXP || 0) / 1000) + 1

  const handleReset = async () => {
    await db.delete()
    onReset()
  }

  if (!user) return null

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', color: 'var(--text)' }}>Profile</h1>

      {/* Avatar card */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Level {level} · {user.totalXP || 0} XP</div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>🔥 {user.currentStreak || 0} day streak</div>
        </div>
      </div>

      {/* Active paths */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 16 }}>
        <p style={sectionLabel}>Active paths</p>
        {(user.activePaths || []).map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 22 }}>{PATH_INFO[p]?.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{PATH_INFO[p]?.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{PATH_INFO[p]?.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 24 }}>
        <p style={sectionLabel}>Goals</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Weekly workout goal</span>
          <span style={{ fontWeight: 700 }}>{user.weeklyGoalDays || 4} days</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontSize: 14, padding: '8px 0' }}>
          <span style={{ color: 'var(--text-muted)' }}>Body weight</span>
          <span style={{ fontWeight: 700 }}>{user.bodyWeightKg ? `${user.bodyWeightKg} kg` : 'Not set'}</span>
        </div>
      </div>

      {/* Danger zone */}
      {!confirmReset ? (
        <button onClick={() => setConfirmReset(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Reset all data
        </button>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1.5px solid #ff4444', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', margin: '0 0 12px', fontWeight: 600 }}>This will delete everything. Are you sure?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleReset} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#ff4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }
