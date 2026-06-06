import { useState } from 'react'
import { saveWorkoutSession, EXERCISES, SUGGESTED_WORKOUTS } from '../db'
import { Plus, Trash2, ChevronDown, CheckCircle } from 'lucide-react'

const PATHS = ['gym', 'basketball', 'running']
const PATH_LABELS = { gym: '🏋️ Gym', basketball: '🏀 Basketball', running: '🏃 Running' }

export default function Workout({ user, prefill, onSaved }) {
  const [path, setPath] = useState(prefill?.path || (user?.activePaths?.[0] || 'gym'))
  const [exercises, setExercises] = useState(prefill ? prefill.exercises.map(name => mkExercise(name, path)) : [])
  const [startTime] = useState(Date.now())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const availableEx = EXERCISES[path] || []

  function mkExercise(name, p) {
    const def = (EXERCISES[p] || []).find(e => e.name === name)
    return { name, type: def?.type || 'strength', sets: [{ reps: '', weight: '', distance: '', pace: '' }] }
  }

  const addExercise = (name) => {
    setExercises(e => [...e, mkExercise(name, path)])
    setShowPicker(false)
  }

  const removeExercise = (i) => setExercises(e => e.filter((_, idx) => idx !== i))

  const addSet = (exIdx) => setExercises(e => e.map((ex, i) => i === exIdx ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', distance: '', pace: '' }] } : ex))
  const removeSet = (exIdx, setIdx) => setExercises(e => e.map((ex, i) => i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex))

  const updateSet = (exIdx, setIdx, field, val) => setExercises(e => e.map((ex, i) => i === exIdx ? {
    ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: val } : s)
  } : ex))

  const handleSave = async () => {
    if (!exercises.length) return
    setSaving(true)
    const durationMins = Math.round((Date.now() - startTime) / 60000)
    const session = { userId: user.id, sportPath: path, name: prefill?.name || path, date: new Date(), durationMins, notes, xpEarned: 0 }
    const exData = exercises.map(ex => ({ exerciseId: ex.name, name: ex.name, sets: ex.sets }))
    const { xp } = await saveWorkoutSession(session, exData)
    session.xpEarned = xp
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved?.() }, 2000)
    setExercises([])
    setNotes('')
  }

  if (saved) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <CheckCircle size={64} color="var(--accent)" />
      <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 24, fontWeight: 800 }}>Workout saved!</h2>
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>XP awarded — keep grinding 🔥</p>
    </div>
  )

  const isRunning = path === 'running'

  return (
    <div style={{ padding: '24px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px', color: 'var(--text)' }}>Log Workout</h1>

      {/* Path Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {PATHS.map(p => (
          (user?.activePaths?.includes(p) || !user?.activePaths) &&
          <button key={p} onClick={() => { setPath(p); setExercises([]) }} style={{
            padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${path === p ? 'var(--accent)' : 'var(--border)'}`,
            background: path === p ? 'var(--accent-dim)' : 'transparent',
            color: path === p ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
          }}>{PATH_LABELS[p]}</button>
        ))}
      </div>

      {/* Suggested for this path */}
      {!exercises.length && (
        <div style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Quick start</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {(SUGGESTED_WORKOUTS[path] || []).map(w => (
              <button key={w.name} onClick={() => setExercises(w.exercises.map(n => mkExercise(n, path)))} style={{
                padding: '10px 16px', borderRadius: 14, border: '1.5px solid var(--border)',
                background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit', textAlign: 'left', minWidth: 140
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{w.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise List */}
      {exercises.map((ex, exIdx) => (
        <div key={exIdx} style={{ background: 'var(--card-bg)', borderRadius: 18, border: '1px solid var(--border)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)', flex: 1, fontSize: 15 }}>{ex.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 12, background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 10 }}>{ex.type}</span>
            <button onClick={() => removeExercise(exIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ padding: '12px 16px' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: isRunning ? '40px 1fr 1fr 24px' : '40px 1fr 1fr 24px', gap: 8, marginBottom: 6 }}>
              <span style={colHead}>Set</span>
              <span style={colHead}>{isRunning ? 'Distance (km)' : 'Reps'}</span>
              <span style={colHead}>{isRunning ? 'Pace (min/km)' : 'Weight (kg)'}</span>
              <span />
            </div>
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 24px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{setIdx + 1}</span>
                <input
                  value={isRunning ? set.distance : set.reps}
                  onChange={e => updateSet(exIdx, setIdx, isRunning ? 'distance' : 'reps', e.target.value)}
                  placeholder={isRunning ? '5.0' : '8'} type="number" style={setInput}
                />
                <input
                  value={isRunning ? set.pace : set.weight}
                  onChange={e => updateSet(exIdx, setIdx, isRunning ? 'pace' : 'weight', e.target.value)}
                  placeholder={isRunning ? '5:30' : '60'} style={setInput}
                />
                <button onClick={() => removeSet(exIdx, setIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => addSet(exIdx)} style={{ marginTop: 4, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
              + Add set
            </button>
          </div>
        </div>
      ))}

      {/* Add Exercise */}
      <button onClick={() => setShowPicker(!showPicker)} style={{
        width: '100%', padding: '14px', borderRadius: 14, border: '1.5px dashed var(--border)',
        background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit'
      }}>
        <Plus size={18} /> Add exercise
      </button>

      {showPicker && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, marginTop: 8, overflow: 'hidden' }}>
          {availableEx.map(ex => (
            <button key={ex.name} onClick={() => addExercise(ex.name)} style={{
              width: '100%', padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 500 }}>{ex.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.muscles}</span>
            </button>
          ))}
        </div>
      )}

      {/* Notes */}
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Session notes (optional)..."
        style={{ width: '100%', marginTop: 16, padding: '12px 16px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', outline: 'none' }}
      />

      {/* Save */}
      {exercises.length > 0 && (
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', marginTop: 16, padding: '16px', borderRadius: 16,
          background: 'var(--accent)', border: 'none', color: '#000',
          fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.7 : 1, letterSpacing: '-0.2px'
        }}>
          {saving ? 'Saving...' : 'Finish & Save 💾'}
        </button>
      )}
    </div>
  )
}

const sectionLabel = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }
const colHead = { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }
const setInput = { padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' }
