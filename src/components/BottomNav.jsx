import { Home, Dumbbell, Apple, Trophy, Bot } from 'lucide-react'

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'workout', icon: Dumbbell, label: 'Train' },
  { id: 'nutrition', icon: Apple, label: 'Fuel' },
  { id: 'progress', icon: Trophy, label: 'Progress' },
  { id: 'coach', icon: Bot, label: 'Coach' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-nav)', borderTop: '1px solid var(--border)',
      display: 'flex', padding: '0 0 env(safe-area-inset-bottom)',
      zIndex: 100, backdropFilter: 'blur(20px)'
    }}>
      {tabs.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
          color: active === id ? 'var(--accent)' : 'var(--text-muted)',
          transition: 'color 0.2s', fontSize: 10, fontFamily: 'inherit',
          fontWeight: active === id ? 600 : 400
        }}>
          <Icon size={22} strokeWidth={active === id ? 2.2 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  )
}
