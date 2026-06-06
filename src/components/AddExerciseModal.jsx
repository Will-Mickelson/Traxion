import { useState } from 'react'
import { addCustomExercise } from '../db'
import { X } from 'lucide-react'

const PATHS = ['gym', 'basketball', 'running']
const TYPES = {
  gym: ['strength', 'cardio', 'mobility'],
  basketball: ['skill', 'conditioning', 'power', 'agility'],
  running: ['aerobic', 'speed', 'threshold', 'strength']
}

export default function AddExerciseModal({ userId, onSaved, onClose }) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('gym')
  const [type, setType] = useState('strength')
  const [muscles, setMuscles] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await addCustomExercise(userId, { name: name.trim(), sportPath: path, type, muscles })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>New exercise</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={22} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Exercise name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bulgarian Split Squat"
              style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Sport path</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PATHS.map(p => (
                <button key={p} onClick={() => { setPath(p); setType(TYPES[p][0]) }} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${path === p ? 'var(--accent)' : 'var(--border)'}`,
                  background: path === p ? 'var(--accent-dim)' : 'transparent',
                  color: path === p ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize'
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TYPES[path].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: type === t ? 'var(--accent-dim)' : 'transparent',
                  color: type === t ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize'
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Muscles (optional)</label>
            <input value={muscles} onChange={e => setMuscles(e.target.value)} placeholder="e.g. Quads, Glutes"
              style={inputStyle} />
          </div>

          <button onClick={handleSave} disabled={!name.trim() || saving} style={{
            width: '100%', padding: '15px', borderRadius: 14, background: 'var(--accent)', border: 'none',
            color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            marginTop: 8, opacity: name.trim() ? 1 : 0.4
          }}>
            {saving ? 'Saving...' : 'Add exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }
const inputStyle = { width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
