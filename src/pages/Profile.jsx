import { useState, useEffect } from 'react'
import { db, updateUserUnits, getUserStats } from '../db'
import { lbsToKg, ftInToCm, displayWeight, cmToDisplay } from '../units'

const PATH_INFO = {
  gym: { emoji: '🏋️', label: 'Gym', desc: 'Lifting & strength training' },
  basketball: { emoji: '🏀', label: 'Basketball', desc: 'Court & conditioning' },
  running: { emoji: '🏃', label: 'Running', desc: 'Road & track' }
}

export default function Profile({ user, onReset, onUserUpdate }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [editingUnits, setEditingUnits] = useState(false)
  const [units, setUnits] = useState(user?.units || 'imperial')
  const [weight, setWeight] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [userStats, setUserStats] = useState(null)
  useEffect(() => { if (user) getUserStats(user.id).then(setUserStats) }, [user, saved])

  const level = Math.floor((user?.totalXP || 0) / 1000) + 1
  const currentUnits = user?.units || 'imperial'

  const handleSaveUnits = async () => {
    setSaving(true)
    const bodyWeightKg = weight ? (units === 'imperial' ? lbsToKg(parseFloat(weight)) : parseFloat(weight)) : undefined
    const hCm = units === 'imperial' ? (heightFt || heightIn ? ftInToCm(heightFt, heightIn) : undefined) : (heightCm ? parseFloat(heightCm) : undefined)
    await updateUserUnits(user.id, units, hCm, bodyWeightKg)
    setSaving(false)
    setSaved(true)
    setEditingUnits(false)
    setTimeout(() => setSaved(false), 2000)
    onUserUpdate?.()
  }

  const handleReset = async () => { await db.delete(); onReset() }

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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Level {level} · {(user.totalXP || 0).toLocaleString()} XP</div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>🔥 {user.currentStreak || 0} day streak</div>
        </div>
      </div>

      {/* Units & measurements */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingUnits ? 16 : 0 }}>
          <p style={sectionLabel}>Units & measurements</p>
          <button onClick={() => setEditingUnits(!editingUnits)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {editingUnits ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {!editingUnits ? (
          <div>
            <Row label="Units" value={currentUnits === 'imperial' ? '🇺🇸 lbs / ft' : '🌍 kg / cm'} />
            <Row label="Body weight" value={userStats?.bodyWeightKg ? (currentUnits === 'imperial' ? `${Math.round(userStats.bodyWeightKg * 2.20462)} lbs` : `${userStats.bodyWeightKg} kg`) : 'Not set'} />
            <Row label="Height" value={user.heightCm ? cmToDisplay(user.heightCm, currentUnits) : 'Not set'} last />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={labelStyle}>Units</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'imperial', label: '🇺🇸 lbs / ft' }, { id: 'metric', label: '🌍 kg / cm' }].map(u => (
                  <button key={u.id} onClick={() => setUnits(u.id)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${units === u.id ? 'var(--accent)' : 'var(--border)'}`, background: units === u.id ? 'var(--accent-dim)' : 'transparent', color: units === u.id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{u.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p style={labelStyle}>Body weight (leave blank to keep current)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={weight} onChange={e => setWeight(e.target.value)} placeholder={units === 'imperial' ? '185' : '84'} type="number" style={inputStyle} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14, minWidth: 30 }}>{units === 'imperial' ? 'lbs' : 'kg'}</span>
              </div>
            </div>

            <div>
              <p style={labelStyle}>Height (leave blank to keep current)</p>
              {units === 'imperial' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="6" type="number" style={inputStyle} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ft</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="2" type="number" style={inputStyle} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>in</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="188" type="number" style={inputStyle} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>cm</span>
                </div>
              )}
            </div>

            <button onClick={handleSaveUnits} disabled={saving} style={{ width: '100%', padding: '13px', borderRadius: 12, background: saved ? 'var(--success)' : 'var(--accent)', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
            </button>
          </div>
        )}
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

      {/* Goals */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 24 }}>
        <p style={sectionLabel}>Goals</p>
        <Row label="Weekly workout goal" value={`${user.weeklyGoalDays || 4} days`} last />
      </div>

      {/* Reset */}
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

function Row({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontSize: 14, padding: '8px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }
const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }
const inputStyle = { flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
