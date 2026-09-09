// @vitest-environment happy-dom
// Favourites (issue #6): the Library floats starred exercises to the top of the current
// result list — after the search and muscle/equipment filters, without reordering the rest.
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Library from './Library.jsx'
import { EXDB } from '../lib/exercises.js'
import { useUI } from '../store/useUI.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => {
  const state = { S: null }
  state.snapshot = () => ({ S: state.S, user: null, update: mut => { const next = structuredClone(state.S); mut(next); state.S = next } })
  return state
})
vi.mock('../store/useStore.js', () => {
  const useStore = selector => selector ? selector(mocks.snapshot()) : mocks.snapshot()
  useStore.getState = mocks.snapshot
  return { useStore }
})
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }))
vi.mock('../sheets.jsx', () => ({ exerciseDetailSheet: vi.fn(), addToRoutineSheet: vi.fn(), customExSheet: vi.fn() }))

const mounted = []
function render() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(<Library />))
  return host
}
const names = host => [...host.querySelectorAll('.item .tt')].map(el => el.textContent)

beforeEach(() => {
  mocks.S = { unit: 'kg', lang: 'en', routines: [], workouts: [], customEx: [], exWeights: {}, equipProfiles: [], activeEquipId: null, equipFilterOn: false }
  useUI.setState({ sheets: [] })
  document.body.innerHTML = ''
})
afterEach(() => { act(() => { mounted.splice(0).forEach(root => root.unmount()) }) })

describe('Library favourites', () => {
  it('puts favourites first, marked with a star, and leaves the rest in catalogue order', () => {
    const plain = names(render())
    act(() => { mounted.splice(0).forEach(root => root.unmount()) })
    const fav = [plain[6], plain[2]]
    mocks.S.favEx = fav.map(n => EXDB.find(e => e.n === n).id)
    const host = render()
    const shown = names(host)
    expect(shown.slice(0, 2)).toEqual(plain.filter(n => fav.includes(n)))
    expect(shown.slice(2)).toEqual(plain.filter(n => !fav.includes(n)))
    const rows = [...host.querySelectorAll('.item')].slice(1)
    expect(rows[0].querySelector('.fav-star')).not.toBeNull()
    expect(rows[2].querySelector('.fav-star')).toBeNull()
  })

  it('keeps a favourite on top inside a muscle filter, but never pulls one in from elsewhere', () => {
    const chest = EXDB.filter(e => e.bp === 'chest')
    const legs = EXDB.find(e => e.bp !== 'chest')
    mocks.S.favEx = [chest[4].id, legs.id]
    const host = render()

    const muscleBtn = host.querySelectorAll('.filter-btn')[1]
    expect(muscleBtn.textContent).toContain('All Muscles')
    act(() => muscleBtn.click())

    const sheet = useUI.getState().sheets.at(-1)
    expect(sheet).toBeDefined()

    const sheetHost = document.createElement('div')
    document.body.appendChild(sheetHost)
    const sheetRoot = createRoot(sheetHost)
    mounted.push(sheetRoot)
    act(() => sheetRoot.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))

    const chestRow = [...sheetHost.querySelectorAll('.lrow')].find(b => b.textContent.toLowerCase().includes('chest'))
    act(() => chestRow.click())

    const applyBtn = sheetHost.querySelector('.filter-sheet-footer .btn.primary')
    act(() => applyBtn.click())

    const shown = names(host)
    expect(shown[0]).toBe(chest[4].n)
    expect(shown).not.toContain(legs.n)
    expect(muscleBtn.textContent).toContain('Chest')
  })

  it('supports equipment filter with multi-select and Clear Filters', () => {
    const host = render()
    const eqBtn = host.querySelectorAll('.filter-btn')[0]
    expect(eqBtn.textContent).toContain('All Equipment')
    act(() => eqBtn.click())

    const sheet = useUI.getState().sheets.at(-1)
    const sheetHost = document.createElement('div')
    document.body.appendChild(sheetHost)
    const sheetRoot = createRoot(sheetHost)
    mounted.push(sheetRoot)
    act(() => sheetRoot.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))

    const barbellRow = [...sheetHost.querySelectorAll('.lrow')].find(b => b.textContent.toLowerCase().includes('barbell'))
    act(() => barbellRow.click())

    const applyBtn = sheetHost.querySelector('.filter-sheet-footer .btn.primary')
    act(() => applyBtn.click())

    expect(eqBtn.textContent.toLowerCase()).toContain('barbell')
  })
})
