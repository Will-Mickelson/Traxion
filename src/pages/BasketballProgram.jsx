import { useState } from 'react'
import { BEGINNER_BASKETBALL_PROGRAM, BASKETBALL_DRILLS } from '../db'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

export default function BasketballProgram({ onStartWorkout, onClose }) {
  const [selectedDrill, setSelectedDrill] = useState(null)
  const [expandedWeek, setExpandedWeek] = useState(1)

  const weeks = [...new Set(BEGINNER_BASKETBALL_PROGRAM.map(d => d.week))]
  const diffColor = { beginner: '#3effa0', intermediate: '#c8f135', advanced: '#ff8c42' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 150, overflowY: 'auto', paddingBottom: 40 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>🏀 Beginner Program</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>2-week foundation curriculum</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {weeks.map(week => (
          <div key={week} style={{ marginBottom: 16 }}>
            <button onClick={() => setExpandedWeek(expandedWeek === week ? null : week)} style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: expandedWeek === week ? '16px 16px 0 0' : 16, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>Week {week}</span>
              {expandedWeek === week ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </button>

            {expandedWeek === week && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                {BEGINNER_BASKETBALL_PROGRAM.filter(d => d.week === week).map((day, i, arr) => (
                  <div key={day.day} style={{ padding: '16px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Day {day.day}</span>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15, marginTop: 2 }}>{day.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{day.focus}</div>
                      </div>
                      <button onClick={() => onStartWorkout({ path: 'basketball', name: day.name, exercises: day.exercises })}
                        style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}>
                        Start
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {day.exercises.map(ex => {
                        const drill = BASKETBALL_DRILLS[ex]
                        return (
                          <button key={ex} onClick={() => setSelectedDrill(ex)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
                            background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left'
                          }}>
                            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{ex}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {drill && <span style={{ fontSize: 10, fontWeight: 700, color: '#000', background: diffColor[drill.difficulty], padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize' }}>{drill.difficulty}</span>}
                              <span style={{ fontSize: 11, color: 'var(--accent)' }}>Guide →</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '10px 12px', borderLeft: '3px solid var(--accent)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>💡 {day.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drill detail modal */}
      {selectedDrill && BASKETBALL_DRILLS[selectedDrill] && (
        <DrillModal drill={selectedDrill} info={BASKETBALL_DRILLS[selectedDrill]} onClose={() => setSelectedDrill(null)} />
      )}
    </div>
  )
}

function DrillModal({ drill, info, onClose }) {
  const diffColor = { beginner: '#3effa0', intermediate: '#c8f135', advanced: '#ff8c42' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#000', background: diffColor[info.difficulty], padding: '3px 10px', borderRadius: 10, textTransform: 'capitalize' }}>{info.difficulty}</span>
            <h2 style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{drill}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={22} /></button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>{info.description}</p>

        <Section title="How to do it">
          {info.instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i+1}</span>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </Section>

        <Section title="Sets & Reps">
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{info.setsReps}</p>
          </div>
        </Section>

        <Section title="Coaching cues">
          {info.cues.map((cue, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontSize: 16, lineHeight: 1.4 }}>→</span>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{cue}</p>
            </div>
          ))}
        </Section>

        {info.beginner && (
          <div style={{ background: 'rgba(62,255,160,0.08)', border: '1px solid rgba(62,255,160,0.2)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3effa0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Beginner modification</div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{info.beginner}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{title}</p>
      {children}
    </div>
  )
}
