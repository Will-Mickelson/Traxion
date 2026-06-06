// All values stored in metric (kg, cm). These functions convert for display.

export function kgToLbs(kg) { return Math.round(kg * 2.20462 * 10) / 10 }
export function lbsToKg(lbs) { return Math.round(lbs / 2.20462 * 100) / 100 }
export function cmToFtIn(cm) {
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn % 12)
  return { ft, inches }
}
export function ftInToCm(ft, inches) { return Math.round(((parseInt(ft) || 0) * 12 + (parseInt(inches) || 0)) * 2.54) }
export function cmToDisplay(cm, unit) {
  if (unit === 'imperial') { const { ft, inches } = cmToFtIn(cm); return `${ft}'${inches}"` }
  return `${cm} cm`
}
export function kgToDisplay(kg, unit, decimals = 1) {
  if (!kg && kg !== 0) return '—'
  if (unit === 'imperial') return `${(Math.round(kgToLbs(kg) * 10) / 10).toFixed(decimals)} lbs`
  return `${kg} kg`
}
export function weightLabel(unit) { return unit === 'imperial' ? 'lbs' : 'kg' }
export function heightLabel(unit) { return unit === 'imperial' ? 'ft / in' : 'cm' }
export function parseWeight(val, unit) {
  const n = parseFloat(val)
  if (isNaN(n)) return null
  return unit === 'imperial' ? lbsToKg(n) : n
}
export function displayWeight(kg, unit) {
  if (!kg && kg !== 0) return ''
  if (unit === 'imperial') return String(Math.round(kgToLbs(kg) * 10) / 10)
  return String(kg)
}
