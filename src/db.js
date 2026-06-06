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

db.version(2).stores({
  user:            '++id, name',
  workoutSessions: '++id, userId, sportPath, date',
  sessionExercises:'++id, sessionId, exerciseId',
  exercises:       '++id, name, sportPath, type',
  nutritionLogs:   '++id, userId, date',
  badges:          '++id, userId, name',
  userStats:       '++id, userId',
  personalRecords: '++id, userId, exerciseName',
  customExercises: '++id, userId, sportPath',
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

export async function checkAndUpdatePR(userId, exerciseName, weight, reps) {
  const existing = await db.personalRecords.where({ userId, exerciseName }).first()
  const newBest = parseFloat(weight) || 0
  const oneRepMax = newBest * (1 + (parseFloat(reps) || 1) / 30)
  if (!existing || oneRepMax > existing.estimatedOneRepMax) {
    if (existing) await db.personalRecords.update(existing.id, { weight: newBest, reps: parseFloat(reps), estimatedOneRepMax: oneRepMax, date: new Date() })
    else await db.personalRecords.add({ userId, exerciseName, weight: newBest, reps: parseFloat(reps), estimatedOneRepMax: oneRepMax, date: new Date() })
    return true
  }
  return false
}

export async function getPRs(userId) {
  return db.personalRecords.where('userId').equals(userId).toArray()
}

export async function saveWorkoutSession(session, exercises) {
  const sessionId = await db.workoutSessions.add({ ...session, createdAt: new Date() })
  let newPRs = []
  for (const ex of exercises) {
    await db.sessionExercises.add({ ...ex, sessionId })
    // Check PRs for strength exercises
    for (const set of (ex.sets || [])) {
      if (set.weight && parseFloat(set.weight) > 0) {
        const isPR = await checkAndUpdatePR(session.userId, ex.name, set.weight, set.reps)
        if (isPR && !newPRs.includes(ex.name)) newPRs.push(ex.name)
      }
    }
  }
  const xp = calcXP(session, exercises, newPRs.length)
  const user = await db.user.get(session.userId)
  const newStreak = await calcStreak(session.userId)
  await db.user.update(session.userId, {
    totalXP: (user.totalXP || 0) + xp,
    lastWorkoutDate: new Date(),
    currentStreak: newStreak
  })
  return { sessionId, xp, newPRs }
}

function calcXP(session, exercises, prCount) {
  let xp = 100
  xp += (session.durationMins || 0) * 2
  xp += exercises.length * 15
  xp += prCount * 50
  return xp
}

async function calcStreak(userId) {
  const sessions = await db.workoutSessions.where('userId').equals(userId).sortBy('date')
  if (!sessions.length) return 1
  let streak = 1
  const today = new Date().toDateString()
  const lastDate = new Date(sessions[sessions.length - 1].date).toDateString()
  if (lastDate !== today) {
    const diff = (new Date() - new Date(sessions[sessions.length - 1].date)) / 86400000
    if (diff > 2) return 1
  }
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

export async function getCustomExercises(userId) {
  return db.customExercises.where('userId').equals(userId).toArray()
}

export async function addCustomExercise(userId, exercise) {
  return db.customExercises.add({ ...exercise, userId, createdAt: new Date() })
}

export async function getSuggestedWorkout(userId, path) {
  const options = SUGGESTED_WORKOUTS[path] || SUGGESTED_WORKOUTS.gym
  const recent = await getRecentSessions(userId, 5)
  const recentNames = recent.map(s => s.name)
  // Prefer a workout not done recently
  const fresh = options.filter(w => !recentNames.includes(w.name))
  const pool = fresh.length > 0 ? fresh : options
  return { path, ...pool[new Date().getDate() % pool.length] }
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
    { name: 'Incline Bench Press', type: 'strength', muscles: 'Upper Chest' },
    { name: 'Lateral Raises', type: 'strength', muscles: 'Shoulders' },
    { name: 'Face Pulls', type: 'strength', muscles: 'Rear Delts' },
    { name: 'Hip Thrust', type: 'strength', muscles: 'Glutes' },
    { name: 'Cable Row', type: 'strength', muscles: 'Back, Biceps' },
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
    { name: 'Mikan Drill', type: 'skill', muscles: 'Arms, Core' },
    { name: 'Chair Drill Dribbling', type: 'skill', muscles: 'Hands, Core' },
    { name: 'Spot Shooting', type: 'skill', muscles: 'Arms, Legs' },
    { name: 'Layup Lines', type: 'skill', muscles: 'Full Body' },
    { name: 'Drop Step Post Move', type: 'skill', muscles: 'Legs, Core' },
    { name: 'Lateral Bound', type: 'power', muscles: 'Legs, Hips' },
    { name: 'Reaction Drills', type: 'agility', muscles: 'Full Body' },
  ],
  running: [
    { name: 'Easy Run', type: 'aerobic', muscles: 'Full Body' },
    { name: 'Tempo Run', type: 'threshold', muscles: 'Full Body' },
    { name: 'Interval Sprints', type: 'speed', muscles: 'Full Body' },
    { name: 'Long Run', type: 'endurance', muscles: 'Full Body' },
    { name: 'Hill Repeats', type: 'strength', muscles: 'Legs, Glutes' },
    { name: 'Fartlek', type: 'mixed', muscles: 'Full Body' },
    { name: 'Recovery Run', type: 'aerobic', muscles: 'Full Body' },
    { name: 'Strides', type: 'speed', muscles: 'Full Body' },
  ]
}

export const BASKETBALL_DRILLS = {
  'Suicide Sprints': {
    difficulty: 'intermediate',
    description: 'Full-court sprint conditioning drill used at every level of basketball.',
    instructions: [
      'Start at the baseline. Sprint to the near free-throw line and back.',
      'Sprint to half court and back.',
      'Sprint to the far free-throw line and back.',
      'Sprint to the far baseline and back. That\'s one rep.'
    ],
    setsReps: '4–6 reps, 60–90 sec rest between',
    cues: ['Drive your arms to push your legs', 'Touch the line with your hand on each turn', 'Stay low on direction changes'],
    beginner: 'Walk the first two lines, jog the last two until your conditioning improves.'
  },
  'Box Jumps': {
    difficulty: 'beginner',
    description: 'Explosive lower-body power exercise that directly improves your vertical.',
    instructions: [
      'Stand in front of a sturdy box or platform (12–24 inches high).',
      'Bend your knees and swing your arms back.',
      'Explode upward, swinging arms forward, and land softly on top of the box.',
      'Stand fully upright on top, then step down carefully — don\'t jump down.'
    ],
    setsReps: '3 sets of 8–10 reps, 90 sec rest',
    cues: ['Land with soft knees, never stiff legs', 'Full hip extension at the top', 'Reset fully before each jump'],
    beginner: 'Start with a low step or just practice the jump-and-land motion on flat ground first.'
  },
  'Defensive Slides': {
    difficulty: 'beginner',
    description: 'The most fundamental defensive footwork in basketball. Every coach drills this.',
    instructions: [
      'Get in a defensive stance: feet shoulder-width apart, knees bent, hips low, hands out.',
      'Push off your outside foot to slide laterally — never cross your feet.',
      'Keep your hips below your shoulders the entire time.',
      'Slide to one cone, touch it, then slide back.'
    ],
    setsReps: '4 sets of 30 seconds, 30 sec rest',
    cues: ['Stay low — if your head bobs up and down, your hips are rising', 'Push, don\'t step', 'Keep hands active and wide'],
    beginner: 'Practice in front of a mirror first to check your depth. Comfort before speed.'
  },
  'Free Throw Practice': {
    difficulty: 'beginner',
    description: 'The most valuable shot in basketball. Consistent routine = consistent results.',
    instructions: [
      'Step to the line. Place your shooting foot slightly forward.',
      'Bend your knees slightly and find a consistent pre-shot routine (bounce, breath, etc.).',
      'Hold the ball with your shooting hand under, guide hand on the side.',
      'Extend your legs, elbow, and wrist together in one smooth motion. Follow through — hold your finish.'
    ],
    setsReps: '50–100 makes (not attempts) per session',
    cues: ['Same routine every single shot', 'Elbow under the ball, not flared out', 'Hold your follow-through until the ball hits the net'],
    beginner: 'Shoot from 2–3 feet closer first until your form is consistent. Distance comes later.'
  },
  'Ball Handling Drills': {
    difficulty: 'beginner',
    description: 'Dribbling confidence is built with repetition. Start slow, go fast.',
    instructions: [
      'Stationary: dribble low and hard with your right hand for 30 seconds, then left.',
      'Figure 8: weave the ball through your legs in a figure-8 pattern.',
      'Two-ball dribble: dribble both balls simultaneously, then alternate.',
      'Spider dribble: tap ball around your feet rapidly with both hands.'
    ],
    setsReps: '10 min total, cycle through each drill',
    cues: ['Look up, not at the ball — pick a spot on the wall', 'Dribble below knee height', 'Weak hand gets equal time'],
    beginner: 'Eyes on the ball is fine at first. As it gets automatic, force yourself to look away.'
  },
  'Cone Drills': {
    difficulty: 'intermediate',
    description: 'Agility and change-of-direction speed. Essential for beating defenders.',
    instructions: [
      'Set up 5 cones in a straight line, 3 feet apart.',
      'Weave through the cones as fast as possible without knocking them over.',
      'Return weaving back through.',
      'Variation: T-drill — sprint forward, shuffle left, shuffle right, backpedal back.'
    ],
    setsReps: '6–8 runs, full rest between',
    cues: ['Plant hard on outside foot to change direction', 'Stay low through the whole drill', 'Speed comes after consistency'],
    beginner: 'Walk through the pattern first so your feet know the path, then add speed.'
  },
  'Mikan Drill': {
    difficulty: 'beginner',
    description: 'The classic finishing drill. Builds touch and coordination around the basket.',
    instructions: [
      'Start under the basket on one side.',
      'Lay the ball in off the backboard with your right hand.',
      'Without letting the ball hit the floor, catch and lay it in from the left side.',
      'Alternate continuously for the full set.'
    ],
    setsReps: '3 sets of 20 makes (10 each side)',
    cues: ['Use the backboard every time', 'High off the glass, not flat', 'Rhythm is more important than speed'],
    beginner: 'Let the ball bounce at first if you need to. Work up to the continuous version.'
  },
  'Spot Shooting': {
    difficulty: 'beginner',
    description: 'Develop a repeatable shot from 5 key spots on the floor.',
    instructions: [
      'Pick 5 spots: both corners, both wings, and top of the key.',
      'Take 10 shots from each spot.',
      'Track your makes at each spot.',
      'Move to the next spot only after completing your attempts.'
    ],
    setsReps: '50 shots total (10 per spot), track makes',
    cues: ['Set your feet before you catch the ball', 'Same release point every time', 'Follow through and hold it'],
    beginner: 'Start closer than the three-point line. Form > distance always.'
  },
  'Layup Lines': {
    difficulty: 'beginner',
    description: 'The most basic and most missed shot in basketball. Master it.',
    instructions: [
      'Dribble from half court at game speed toward the basket.',
      'Take off on your inside foot (right layup = left foot takeoff).',
      'Aim for the top corner of the box on the backboard.',
      'Alternate sides each rep.'
    ],
    setsReps: '20 makes each side',
    cues: ['Two-step footwork: big step then small step into the jump', 'Use the glass', 'Go game speed — don\'t slow down at the end'],
    beginner: 'Walk through the footwork first: step-step-jump. Get the pattern before adding the dribble.'
  },
  'Jump Rope': {
    difficulty: 'beginner',
    description: 'Underrated conditioning tool. Builds footwork, timing, and cardio.',
    instructions: [
      'Basic: two-foot jumps, steady pace for 1 minute.',
      'Alternate foot: hop left-right alternating like running in place.',
      'High knees: drive knees up while jumping.',
      'Double under: swing rope twice per jump (advanced).'
    ],
    setsReps: '5 rounds of 1 minute, 30 sec rest',
    cues: ['Jump on the balls of your feet, not flat-footed', 'Small jumps — just enough to clear the rope', 'Wrists do the work, not arms'],
    beginner: 'Just focus on basic two-foot jumps at a steady pace. Consistency over tricks.'
  },
  'Vertical Jumps': {
    difficulty: 'beginner',
    description: 'Train the exact motion you use to rebound, block shots, and finish at the rim.',
    instructions: [
      'Stand flat-footed. Swing arms back and drop into quarter squat.',
      'Explode upward swinging arms overhead — reach as high as possible.',
      'Land softly on both feet, absorbing with your knees.',
      'Reset fully — quality over speed.'
    ],
    setsReps: '4 sets of 6 reps, 2 min rest',
    cues: ['Full arm swing adds 2–3 inches', 'Land quiet — if it\'s loud, you\'re not absorbing', 'Max effort every single rep'],
    beginner: 'Focus on the landing first. Soft, balanced landings protect your knees.'
  },
  'Lateral Bound': {
    difficulty: 'intermediate',
    description: 'Single-leg lateral power. Mimics the cut-and-drive motion in basketball.',
    instructions: [
      'Stand on your right foot.',
      'Push off laterally and land on your left foot, sticking the landing.',
      'Hold for 2 seconds, then bound back.',
      'Keep the movement explosive — not a shuffle, a bound.'
    ],
    setsReps: '3 sets of 8 each side, 90 sec rest',
    cues: ['Stick each landing — don\'t let your knee cave in', 'Drive off your whole foot', 'Increase distance as you get stronger'],
    beginner: 'Start with small hops close together. Focus on the single-leg landing stability first.'
  },
  'Reaction Drills': {
    difficulty: 'intermediate',
    description: 'Train your first-step quickness and decision speed.',
    instructions: [
      'Stand in an athletic stance facing a wall or partner.',
      'On a visual or audio cue, sprint 5 yards in the called direction.',
      'Return to center and reset.',
      'Variation: shuffle left on left signal, shuffle right on right, sprint on forward signal.'
    ],
    setsReps: '10–15 reps, keep rest short (20–30 sec)',
    cues: ['First step is everything — explode, don\'t ease', 'Stay ready: bent knees, weight forward', 'React, don\'t anticipate'],
    beginner: 'Use simple left/right signals first. Add forward/back once the pattern is automatic.'
  },
  'Drop Step Post Move': {
    difficulty: 'intermediate',
    description: 'A foundational low-post move for finishing with your back to the basket.',
    instructions: [
      'Catch the ball in the low post. Feel where the defender is with your back.',
      'If defender is on your right, drop your right foot back and around them.',
      'Pivot on your left foot and take one power dribble toward the basket.',
      'Finish with a power layup or short bank shot.'
    ],
    setsReps: '3 sets of 10 each side',
    cues: ['Drop the foot BEHIND the defender, not to the side', 'Keep the ball protected and low', 'Attack the rim, not the backboard'],
    beginner: 'Drill the footwork without a ball first — drop step, pivot, step. Add the ball once it\'s automatic.'
  },
  'Chair Drill Dribbling': {
    difficulty: 'beginner',
    description: 'Simulates dribbling around a defender using chairs as obstacles.',
    instructions: [
      'Set up 3–4 chairs in a line spaced 4 feet apart.',
      'Dribble through the chairs using crossovers and between-the-legs moves.',
      'Keep your head up — stare at a spot on the wall, not the ball.',
      'Come back through using your weak hand only.'
    ],
    setsReps: '4 runs each direction, 2 min total',
    cues: ['Protect the ball with your body when going around a chair', 'Low dribble through the obstacles', 'Game speed on the last two runs'],
    beginner: 'Walk-through at slow speed first so your hands learn the pattern. Speed comes with reps.'
  }
}

export const BEGINNER_BASKETBALL_PROGRAM = [
  {
    week: 1, day: 1, name: 'Foundation Day 1',
    focus: 'Ball handling + footwork basics',
    exercises: ['Ball Handling Drills', 'Layup Lines', 'Defensive Slides'],
    note: 'Take your time. These are the three skills that separate beginners from intermediate players.'
  },
  {
    week: 1, day: 2, name: 'Foundation Day 2',
    focus: 'Shooting fundamentals',
    exercises: ['Free Throw Practice', 'Spot Shooting', 'Jump Rope'],
    note: 'Film yourself shooting if you can. Seeing your form is the fastest way to fix it.'
  },
  {
    week: 1, day: 3, name: 'Foundation Day 3',
    focus: 'Conditioning + finishing',
    exercises: ['Jump Rope', 'Mikan Drill', 'Layup Lines'],
    note: 'The Mikan Drill is hard at first. Don\'t worry about speed — get the rhythm.'
  },
  {
    week: 2, day: 1, name: 'Power + Handles',
    focus: 'Explosiveness and ball control',
    exercises: ['Box Jumps', 'Chair Drill Dribbling', 'Ball Handling Drills'],
    note: 'Box jumps will feel intense. Take full rest between sets.'
  },
  {
    week: 2, day: 2, name: 'Court Movement',
    focus: 'Defense and agility',
    exercises: ['Defensive Slides', 'Cone Drills', 'Reaction Drills'],
    note: 'Defense wins games. This session builds the habits that coaches look for first.'
  },
  {
    week: 2, day: 3, name: 'Game Skills',
    focus: 'Shooting and post play',
    exercises: ['Spot Shooting', 'Free Throw Practice', 'Drop Step Post Move'],
    note: 'Post moves take weeks to feel natural. Just start learning the footwork today.'
  },
]

export const SUGGESTED_WORKOUTS = {
  gym: [
    { name: 'Push Day', exercises: ['Bench Press','Overhead Press','Tricep Dips','Lateral Raises'], description: 'Chest, shoulders, triceps' },
    { name: 'Pull Day', exercises: ['Pull-ups','Barbell Row','Dumbbell Curl','Face Pulls'], description: 'Back and biceps' },
    { name: 'Leg Day', exercises: ['Squat','Leg Press','Romanian Deadlift','Hip Thrust'], description: 'Full lower body' },
    { name: 'Upper Body', exercises: ['Bench Press','Barbell Row','Overhead Press','Cable Row'], description: 'Full upper body' },
  ],
  basketball: [
    { name: 'Conditioning', exercises: ['Suicide Sprints','Jump Rope','Defensive Slides'], description: 'Court endurance' },
    { name: 'Explosiveness', exercises: ['Box Jumps','Vertical Jumps','Lateral Bound'], description: 'Power and agility' },
    { name: 'Skills', exercises: ['Free Throw Practice','Ball Handling Drills','Spot Shooting'], description: 'Shooting and handles' },
    { name: 'Finishing', exercises: ['Mikan Drill','Layup Lines','Drop Step Post Move'], description: 'Around the basket' },
    { name: 'Defense', exercises: ['Defensive Slides','Cone Drills','Reaction Drills'], description: 'Footwork and D' },
  ],
  running: [
    { name: 'Speed Work', exercises: ['Interval Sprints','Strides'], description: 'Build top-end pace' },
    { name: 'Base Building', exercises: ['Easy Run','Long Run'], description: 'Aerobic foundation' },
    { name: 'Strength Run', exercises: ['Hill Repeats','Tempo Run'], description: 'Power and threshold' },
    { name: 'Recovery', exercises: ['Recovery Run','Easy Run'], description: 'Active recovery' },
  ]
}
