import Dexie from 'dexie'

export const db = new Dexie('traxion')

db.version(1).stores({
  user:            '++id, name',
  workoutSessions: '++id, userId, sportPath, date',
  sessionExercises:'++id, sessionId, exerciseId',
  exercises:       '++id, name, sportPath, type',
  nutritionLogs:   '++id, userId, date',
  badges:          '++id, userId, name',
  userStats:       '++id, userId',
})

export async function getOrCreateUser() {
  const users = await db.user.toArray()
  return users[0] || null
}

export async function createUser(data) {
  const id = await db.user.add({ ...data, totalXP: 0, currentStreak: 0, lastWorkoutDate: null, createdAt: new Date() })
  await db.userStats.add({ userId: id, gymLevel: 1, basketballLevel: 1, runningLevel: 1, bodyWeightKg: data.bodyWeightKg || null, weeklyGoalDays: data.weeklyGoalDays || 4 })
  return id
}

export async function saveWorkoutSession(session, exercises) {
  const sessionId = await db.workoutSessions.add({ ...session, createdAt: new Date() })
  for (const ex of exercises) {
    await db.sessionExercises.add({ ...ex, sessionId })
  }
  // Award XP
  const xp = calcXP(session, exercises)
  const user = await db.user.get(session.userId)
  await db.user.update(session.userId, {
    totalXP: (user.totalXP || 0) + xp,
    lastWorkoutDate: new Date(),
    currentStreak: await calcStreak(session.userId)
  })
  return { sessionId, xp }
}

function calcXP(session, exercises) {
  let xp = 100 // base
  xp += (session.durationMins || 0) * 2
  xp += exercises.length * 15
  exercises.forEach(e => { if (e.isNewPR) xp += 50 })
  return xp
}

async function calcStreak(userId) {
  const sessions = await db.workoutSessions.where('userId').equals(userId).sortBy('date')
  if (!sessions.length) return 0
  let streak = 1
  for (let i = sessions.length - 1; i > 0; i--) {
    const diff = (new Date(sessions[i].date) - new Date(sessions[i-1].date)) / 86400000
    if (diff <= 2) streak++
    else break
  }
  return streak
}

export async function getRecentSessions(userId, limit = 10) {
  return db.workoutSessions.where('userId').equals(userId).reverse().limit(limit).toArray()
}

export async function getUserStats(userId) {
  return db.userStats.where('userId').equals(userId).first()
}

export const EXERCISES = {
  gym: [
    { name: 'Bench Press', type: 'strength', muscles: 'Chest, Triceps' },
    { name: 'Squat', type: 'strength', muscles: 'Quads, Glutes' },
    { name: 'Deadlift', type: 'strength', muscles: 'Hamstrings, Back' },
    { name: 'Overhead Press', type: 'strength', muscles: 'Shoulders, Triceps' },
    { name: 'Pull-ups', type: 'strength', muscles: 'Back, Biceps' },
    { name: 'Barbell Row', type: 'strength', muscles: 'Back, Biceps' },
    { name: 'Dumbbell Curl', type: 'strength', muscles: 'Biceps' },
    { name: 'Tricep Dips', type: 'strength', muscles: 'Triceps' },
    { name: 'Leg Press', type: 'strength', muscles: 'Quads, Glutes' },
    { name: 'Romanian Deadlift', type: 'strength', muscles: 'Hamstrings' },
  ],
  basketball: [
    { name: 'Suicide Sprints', type: 'conditioning', muscles: 'Full Body' },
    { name: 'Box Jumps', type: 'power', muscles: 'Legs, Glutes' },
    { name: 'Defensive Slides', type: 'agility', muscles: 'Legs, Hips' },
    { name: 'Free Throw Practice', type: 'skill', muscles: 'Arms, Core' },
    { name: 'Ball Handling Drills', type: 'skill', muscles: 'Hands, Forearms' },
    { name: 'Cone Drills', type: 'agility', muscles: 'Full Body' },
    { name: 'Jump Rope', type: 'conditioning', muscles: 'Calves, Cardio' },
    { name: 'Vertical Jumps', type: 'power', muscles: 'Legs, Glutes' },
  ],
  running: [
    { name: 'Easy Run', type: 'aerobic', muscles: 'Full Body' },
    { name: 'Tempo Run', type: 'threshold', muscles: 'Full Body' },
    { name: 'Interval Sprints', type: 'speed', muscles: 'Full Body' },
    { name: 'Long Run', type: 'endurance', muscles: 'Full Body' },
    { name: 'Hill Repeats', type: 'strength', muscles: 'Legs, Glutes' },
    { name: 'Fartlek', type: 'mixed', muscles: 'Full Body' },
  ]
}

export const SUGGESTED_WORKOUTS = {
  gym: [
    { name: 'Push Day', exercises: ['Bench Press','Overhead Press','Tricep Dips'], description: 'Chest, shoulders, triceps' },
    { name: 'Pull Day', exercises: ['Pull-ups','Barbell Row','Dumbbell Curl'], description: 'Back and biceps' },
    { name: 'Leg Day', exercises: ['Squat','Leg Press','Romanian Deadlift'], description: 'Full lower body' },
  ],
  basketball: [
    { name: 'Conditioning', exercises: ['Suicide Sprints','Jump Rope','Defensive Slides'], description: 'Court endurance' },
    { name: 'Explosiveness', exercises: ['Box Jumps','Vertical Jumps','Cone Drills'], description: 'Power and agility' },
    { name: 'Skills', exercises: ['Free Throw Practice','Ball Handling Drills'], description: 'Technical work' },
  ],
  running: [
    { name: 'Speed Work', exercises: ['Interval Sprints','Fartlek'], description: 'Build top-end pace' },
    { name: 'Base Building', exercises: ['Easy Run','Long Run'], description: 'Aerobic foundation' },
    { name: 'Strength Run', exercises: ['Hill Repeats','Tempo Run'], description: 'Power and threshold' },
  ]
}
