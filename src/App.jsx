import { useState, useEffect } from 'react'
import { getOrCreateUser, db } from './db'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('home')
  const [prefillWorkout, setPrefillWorkout] = useState(null)

  useEffect(() => {
    getOrCreateUser().then(setUser)
  }, [])

  const handleOnboardingComplete = async (userId) => {
    const u = await db.user.get(userId)
    setUser(u)
  }

  const handleReset = () => {
    setUser(null)
    setTimeout(() => setUser(undefined), 100)
  }

  const startWorkout = (suggested) => {
    setPrefillWorkout(suggested)
    setTab('workout')
  }

  const handleWorkoutSaved = async () => {
    const u = await getOrCreateUser()
    setUser(u)
    setTab('home')
    setPrefillWorkout(null)
  }

  if (user === undefined) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: 'var(--text-muted)' }}>Loading...</div>
  if (!user) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div>
      {tab === 'home' && <Home user={user} onStartWorkout={startWorkout} />}
      {tab === 'workout' && <Workout user={user} prefill={prefillWorkout} onSaved={handleWorkoutSaved} />}
      {tab === 'nutrition' && <Nutrition user={user} />}
      {tab === 'progress' && <Progress user={user} />}
      {tab === 'profile' && <Profile user={user} onReset={handleReset} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
