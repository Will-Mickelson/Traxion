import { useState, useEffect } from 'react'
import { db } from '../db'

export default function Nutrition({ user }) {
  const [log, setLog] = useState({ calories: '', protein: '', carbs: '', fat: '', water: '' })
  const [today, setToday] = useState(null)
  const [saved, setSaved] = useState(false)

  const todayStr = new Date().toDateString()

  useEffect(() => {
    if (!user) return
    db.nutritionLogs.where('userId').equals(user.id).toArray().then(logs => {
      const t = logs.find(l => new Date(l.date).toDateString() === todayStr)
      if (t) { setToday(t); setLog({ calories: t.calories || '', protein: t.proteinG || '', carbs: t.carbsG || '', fat: t.fatG || '', water: t.waterMl || '' }) }
    })
  }, [user])

  const handleSave = async () => {
    const entry = {
      userId: user.id, date: new Date(),
      calories: parseFloat(log.calories) || 0,
      proteinG: parseFloat(log.protein) || 0,
      carbsG: parseFloat(log.carbs) || 0,
      fatG: parseFloat(log.fat) || 0,
      waterMl: parseFloat(log.water) || 0
    }
    if (today) await db.nutritionLogs.update(today.id, entry)
    else await db.nutritionLogs.add(entry)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const macroTarget = { calories: 2500, protein: 180, carbs: 280, fat: 80, water: 2500 }

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>Fuel</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>Today's nutrition log</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'calories', label: 'Calories', unit: 'kcal', emoji: '🔥', target: macroTarget.calories },
          { key: 'protein', label: 'Protein', unit: 'g', emoji: '🥩', target: macroTarget.protein },
          { key: 'carbs', label: 'Carbs', unit: 'g', emoji: '🌾', target: macroTarget.carbs },
          { key: 'fat', label: 'Fat', unit: 'g', emoji: '🥑', target: macroTarget.fat },
        ].map(({ key, label, unit, emoji, target }) => {
          const val = parseFloat(log[key]) || 0
          const pct = Math.min(100, Math.round((val / target) * 100))
          return (
            <div key={key} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>{emoji}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
              </div>
              <input
                value={log[key]} onChange={e => setLog(l => ({ ...l, [key]: e.target.value }))}
                placeholder="0" type="number" style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, fontWeight: 800, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{unit} · target {target}</div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Water */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span>💧</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Water</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>target 2500ml</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[250, 500, 750].map(ml => (
            <button key={ml} onClick={() => setLog(l => ({ ...l, water: String((parseFloat(l.water) || 0) + ml) }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>+{ml}ml</button>
          ))}
        </div>
        <input value={log.water} onChange={e => setLog(l => ({ ...l, water: e.target.value }))} placeholder="0" type="number"
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, fontWeight: 800, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ml</div>
      </div>

      <button onClick={handleSave} style={{
        width: '100%', padding: '15px', borderRadius: 16, background: saved ? 'var(--success)' : 'var(--accent)',
        border: 'none', color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.3s'
      }}>
        {saved ? '✓ Saved!' : 'Save Today\'s Log'}
      </button>
    </div>
  )
}
