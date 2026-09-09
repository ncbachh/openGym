import { describe, expect, it } from 'vitest'
import { EXDB } from './exercises.js'
import {
  matchesMuscles,
  matchesEquipment,
  getMuscleOptions,
  getEquipmentOptions,
  equipmentFilterLabel,
  muscleFilterLabel
} from './exercise-filters.js'

describe('exercise-filters', () => {
  it('matches all exercises when no muscles or equipment are specified', () => {
    const bench = EXDB.find(e => e.n.toLowerCase().includes('barbell bench press'))
    expect(matchesMuscles(bench, [])).toBe(true)
    expect(matchesMuscles(bench, null)).toBe(true)
    expect(matchesEquipment(bench, [])).toBe(true)
    expect(matchesEquipment(bench, null)).toBe(true)
  })

  it('filters by anatomical muscles', () => {
    const bench = EXDB.find(e => e.n.toLowerCase() === 'barbell bench press')
    expect(matchesMuscles(bench, ['chest'])).toBe(true)
    expect(matchesMuscles(bench, ['calves'])).toBe(false)
  })

  it('filters by cardio exercises', () => {
    const cardioEx = EXDB.find(e => e.bp === 'cardio') || { id: 'c1', n: 'Running', bp: 'cardio' }
    const bench = EXDB.find(e => e.n.toLowerCase() === 'barbell bench press')
    expect(matchesMuscles(cardioEx, ['cardio'])).toBe(true)
    expect(matchesMuscles(bench, ['cardio'])).toBe(false)
  })

  it('filters by equipment', () => {
    const bench = EXDB.find(e => e.n.toLowerCase() === 'barbell bench press')
    expect(matchesEquipment(bench, ['barbell'])).toBe(true)
    expect(matchesEquipment(bench, ['dumbbell'])).toBe(false)
    expect(matchesEquipment(bench, ['dumbbell', 'barbell'])).toBe(true)
  })

  it('generates correct labels for equipment', () => {
    expect(equipmentFilterLabel([])).toBe('All Equipment')
    expect(equipmentFilterLabel(['dumbbell'])).toBe('dumbbell')
    expect(equipmentFilterLabel(['barbell', 'dumbbell'])).toBe('Equipment (2)')
  })

  it('generates correct labels for muscles', () => {
    expect(muscleFilterLabel([])).toBe('All Muscles')
    expect(muscleFilterLabel(['chest'])).toBe('Chest')
    expect(muscleFilterLabel(['cardio'])).toBe('Cardio')
    expect(muscleFilterLabel(['chest', 'biceps'])).toBe('Muscles (2)')
  })

  it('returns valid muscle and equipment options', () => {
    const mOpts = getMuscleOptions()
    expect(mOpts.some(o => o.value === 'chest')).toBe(true)
    expect(mOpts.some(o => o.value === 'cardio')).toBe(true)

    const eqOpts = getEquipmentOptions(EXDB)
    expect(eqOpts.length).toBeGreaterThan(0)
    expect(eqOpts.some(o => o.value === 'barbell')).toBe(true)
  })
})
