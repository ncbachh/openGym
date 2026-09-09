// @vitest-environment happy-dom
// Issue #71: choosing a body part after picking an equipment type used to reset the equipment
// filter to "all equipment", even when the new muscle group still had exercises for it. In the
// modal filter design, equipment and muscle selections are independent.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { exercisePicker } from './sheets.jsx'

const mounted = []

function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  useStore.setState({ S: structuredClone(DEF), user: null })
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('exercise picker equipment filter', () => {
  it('keeps the dumbbell filter when switching muscle group', () => {
    exercisePicker(vi.fn())
    const host = renderTop()

    const [eqBtn, muscleBtn] = host.querySelectorAll('.filter-btn')
    expect(eqBtn.textContent).toContain('All Equipment')
    expect(muscleBtn.textContent).toContain('All Muscles')

    // Open equipment filter, select dumbbell, apply
    act(() => eqBtn.click())
    const eqHost = renderTop()
    const dbRow = [...eqHost.querySelectorAll('.lrow')].find(b => b.textContent.toLowerCase().includes('dumbbell'))
    expect(dbRow).toBeTruthy()
    act(() => dbRow.click())
    act(() => eqHost.querySelector('.filter-sheet-footer .btn.primary').click())
    expect(eqBtn.textContent.toLowerCase()).toContain('dumbbell')

    // Open muscle filter, select biceps, apply
    act(() => muscleBtn.click())
    const mHost = renderTop()
    const armRow = [...mHost.querySelectorAll('.lrow')].find(b => b.textContent.toLowerCase().includes('biceps'))
    expect(armRow).toBeTruthy()
    act(() => armRow.click())
    act(() => mHost.querySelector('.filter-sheet-footer .btn.primary').click())

    // Dumbbell filter should remain selected
    expect(eqBtn.textContent.toLowerCase()).toContain('dumbbell')
  })
})
