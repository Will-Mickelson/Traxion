import { useState, useEffect } from 'react'
import { getOrCreateUser, db } from './db'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import Coach from './pages/Coach'
import BasketballProgram from './pages/BasketballProgram'
import BottomNav from './components/BottomNav'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('home')
  const [prefillWorkout, setPrefillWorkout] = useState(null)
  const [showBBProgram, setShowBBProgram] = useState(false)
  const [customSuggestions, setCustomSuggestions] = useState(null)

  const refreshUser = async () => { const u = await getOrCreateUser(); setUser(u) }

  useEffect(() => { refreshUser() }, [])

  // Load custom suggestions from coach
  const loadCustomSuggestions = async () => {
    if (!user) return
    try {
      const s = await db.customSuggestions.get(user.id)
      if (s?.suggestions) setCustomSuggestions(s.suggestions)
    } catch (e) {}
  }

  useEffect(() => { if (user) loadCustomSuggestions() }, [user])

  const handleOnboardingComplete = async (userId) => { const u = await db.user.get(userId); setUser(u) }
  const handleReset = () => { setUser(null); setTimeout(() => setUser(undefined), 100) }
  const startWorkout = (suggested) => { setPrefillWorkout(suggested); setShowBBProgram(false); setTab('workout') }
  const handleWorkoutSaved = async () => { await refreshUser(); setTab('home'); setPrefillWorkout(null) }

  if (user === undefined) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: 'var(--text-muted)' }}>Loading...</div>
  if (!user) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div>
      {showBBProgram && <BasketballProgram onStartWorkout={startWorkout} onClose={() => setShowBBProgram(false)} />}
      {tab === 'home' && <Home user={user} onStartWorkout={startWorkout} customSuggestions={customSuggestions} />}
      {tab === 'workout' && <Workout user={user} prefill={prefillWorkout} onSaved={handleWorkoutSaved} onOpenProgram={() => setShowBBProgram(true)} />}
      {tab === 'nutrition' && <Nutrition user={user} />}
      {tab === 'progress' && <Progress user={user} />}
      {tab === 'coach' && <Coach user={user} onSuggestionsUpdated={loadCustomSuggestions} />}
      {tab === 'profile' && <Profile user={user} onReset={handleReset} onUserUpdate={refreshUser} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
