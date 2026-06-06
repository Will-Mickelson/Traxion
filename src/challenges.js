// Weekly challenges — scale with user level

export function getWeeklyChallenges(level, sessions, prs, nutritionLogs) {
  const week = getWeekStart()
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= week)
  const thisWeekPRs = prs.filter(p => new Date(p.date) >= week)
  const thisWeekLogs = nutritionLogs.filter(l => new Date(l.date) >= week)

  const workoutTarget = level < 3 ? 2 : level < 6 ? 3 : level < 10 ? 4 : 5
  const prTarget = level < 5 ? 1 : 2
  const nutritionTarget = level < 3 ? 3 : 5

  return [
    {
      id: 'workouts',
      title: `Complete ${workoutTarget} workouts`,
      description: `Train ${workoutTarget} times this week`,
      emoji: '💪',
      progress: thisWeekSessions.length,
      target: workoutTarget,
      xpReward: workoutTarget * 75,
      completed: thisWeekSessions.length >= workoutTarget
    },
    {
      id: 'prs',
      title: `Set ${prTarget} personal record${prTarget > 1 ? 's' : ''}`,
      description: 'Hit new PRs on any exercise',
      emoji: '🏆',
      progress: thisWeekPRs.length,
      target: prTarget,
      xpReward: prTarget * 100,
      completed: thisWeekPRs.length >= prTarget
    },
    {
      id: 'nutrition',
      title: `Log nutrition ${nutritionTarget} days`,
      description: 'Track your meals consistently',
      emoji: '🥗',
      progress: thisWeekLogs.length,
      target: nutritionTarget,
      xpReward: nutritionTarget * 40,
      completed: thisWeekLogs.length >= nutritionTarget
    }
  ]
}

export function getWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function getXPMultiplier(streak) {
  if (streak >= 30) return 2.0
  if (streak >= 14) return 1.75
  if (streak >= 7)  return 1.5
  if (streak >= 3)  return 1.25
  return 1.0
}

export function getMultiplierLabel(streak) {
  const m = getXPMultiplier(streak)
  if (m === 1.0) return null
  return `${m}x XP streak bonus`
}
