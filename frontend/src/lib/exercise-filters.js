import { MUSCLES, MUSCLE_NAME, musclesOf } from './muscles.js'
import { ALL_EQUIPMENT } from './equipment.js'
import { isCardio } from './exercises.js'
import { t } from './i18n.js'

export function matchesMuscles(e, muscles) {
  if (!muscles || muscles.length === 0) return true
  const weights = musclesOf(e)
  return muscles.some(m => {
    if (m === 'cardio') return e.bp === 'cardio' || isCardio(e)
    return (weights[m] || 0) > 0
  })
}

export function matchesEquipment(e, equip) {
  if (!equip || equip.length === 0) return true
  return equip.includes(e.eq)
}

export function getMuscleOptions() {
  return [
    ...MUSCLES.map(m => ({ value: m, label: t(MUSCLE_NAME[m]) })),
    { value: 'cardio', label: t('Cardio') }
  ]
}

export function getEquipmentOptions(exercises) {
  const allEq = [...new Set((exercises || []).map(e => e.eq).filter(Boolean))]
  const order = ALL_EQUIPMENT
  allEq.sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
  return allEq.map(x => ({ value: x, label: t(x) }))
}

export function equipmentFilterLabel(selectedEquipment) {
  if (!selectedEquipment || selectedEquipment.length === 0) return t('All Equipment')
  if (selectedEquipment.length === 1) return t(selectedEquipment[0])
  return t('Equipment ({0})', selectedEquipment.length)
}

export function muscleFilterLabel(selectedMuscles) {
  if (!selectedMuscles || selectedMuscles.length === 0) return t('All Muscles')
  if (selectedMuscles.length === 1) {
    return selectedMuscles[0] === 'cardio' ? t('Cardio') : t(MUSCLE_NAME[selectedMuscles[0]])
  }
  return t('Muscles ({0})', selectedMuscles.length)
}
