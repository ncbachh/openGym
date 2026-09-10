// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReorderView from './ReorderView.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { ROUTINE_LONG_PRESS_MS } from '../views/RoutineEdit.jsx'

vi.mock('./Media.jsx', () => ({ default: () => null, Thumb: () => <span data-thumb /> }))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let root
let host

function rect(top, height, left = 20, width = 340) {
  return { x: left, y: top, left, right: left + width, top, bottom: top + height, width, height }
}

const rows = () => [...host.querySelectorAll('[data-routine-row]')]

function geometry(heights = rows().map(() => 70)) {
  const list = host.querySelector('.routine-list')
  let top = 100
  const tops = [], bottoms = [], centers = []
  rows().forEach((row, i) => {
    const height = heights[i] ?? 70
    tops.push(top); bottoms.push(top + height); centers.push(top + height / 2)
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(() => rect(tops[i], height))
    top += height + 10
  })
  const listRect = rect(80, top - 80)
  vi.spyOn(list, 'getBoundingClientRect').mockImplementation(() => listRect)
  return { list, tops, bottoms, centers, listRect }
}

function pointer(target, type, { id = 7, kind = 'touch', primary = true, button = 0, x = 120, y = 120 } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  for (const [key, value] of Object.entries({ pointerId: id, pointerType: kind, isPrimary: primary, button, clientX: x, clientY: y })) {
    Object.defineProperty(event, key, { configurable: true, value })
  }
  act(() => target.dispatchEvent(event))
  return event
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => window.setTimeout(() => cb(Date.now()), 16))
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => window.clearTimeout(id))
  useStore.setState({ S: DEF, user: null })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  if (root) act(() => root.unmount())
  host?.remove()
  vi.clearAllTimers()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ReorderView', () => {
  it('renders exercises with titles, drag handles, and Done button', () => {
    const entries = [
      { id: '0001', sets: [{ w: 100, r: 5, done: true }] },
      { id: '0002', sets: [{ w: 80, r: 8, done: true }] },
    ]
    const onDone = vi.fn()
    act(() => root.render(<ReorderView entries={entries} onReorder={vi.fn()} onDone={onDone} />))

    expect(host.querySelector('h1')?.textContent).toBe('Reorder exercises')
    expect(rows()).toHaveLength(2)
    expect(host.querySelectorAll('[data-drag-handle]')).toHaveLength(2)

    const doneBtn = [...host.querySelectorAll('button')].find(b => b.textContent.trim() === 'Done')
    act(() => doneBtn.click())
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('renders superset label when items share sg', () => {
    const entries = [
      { id: '0001', sg: 's1', sets: [{ w: 100, r: 5, done: true }] },
      { id: '0002', sg: 's1', sets: [{ w: 80, r: 8, done: true }] },
      { id: '0003', sets: [{ w: 50, r: 10, done: true }] },
    ]
    act(() => root.render(<ReorderView entries={entries} onReorder={vi.fn()} onDone={vi.fn()} />))
    expect(host.querySelector('.ss-label')?.textContent).toContain('Superset')
  })

  it('lifts immediately on data-drag-handle without waiting for long-press timer', () => {
    const entries = [
      { id: '0001', sets: [{ w: 100, r: 5, done: true }] },
      { id: '0002', sets: [{ w: 80, r: 8, done: true }] },
    ]
    act(() => root.render(<ReorderView entries={entries} onReorder={vi.fn()} onDone={vi.fn()} />))
    const layout = geometry()
    const handle = rows()[0].querySelector('[data-drag-handle]')

    pointer(handle, 'pointerdown', { y: layout.centers[0] })
    // No timer advance needed!
    expect(host.querySelector('.is-dragging')).not.toBeNull()
  })

  it('lifts after long-press (380ms) when touching outside the drag handle', () => {
    const entries = [
      { id: '0001', sets: [{ w: 100, r: 5, done: true }] },
      { id: '0002', sets: [{ w: 80, r: 8, done: true }] },
    ]
    act(() => root.render(<ReorderView entries={entries} onReorder={vi.fn()} onDone={vi.fn()} />))
    const layout = geometry()
    const item = rows()[0].querySelector('.item')

    pointer(item, 'pointerdown', { y: layout.centers[0] })
    expect(host.querySelector('.is-dragging')).toBeNull()

    act(() => vi.advanceTimersByTime(ROUTINE_LONG_PRESS_MS))
    expect(host.querySelector('.is-dragging')).not.toBeNull()
  })

  it('calls onReorder on valid drop to a different slot', () => {
    const entries = [
      { id: '0001', sets: [{ w: 100, r: 5, done: true }] },
      { id: '0002', sets: [{ w: 80, r: 8, done: true }] },
    ]
    const onReorder = vi.fn()
    act(() => root.render(<ReorderView entries={entries} onReorder={onReorder} onDone={vi.fn()} />))
    const layout = geometry()
    const handle = rows()[0].querySelector('[data-drag-handle]')

    pointer(handle, 'pointerdown', { y: layout.centers[0] })
    pointer(handle, 'pointermove', { y: layout.centers[1] + 20 })
    pointer(handle, 'pointerup', { y: layout.centers[1] + 20 })

    expect(onReorder).toHaveBeenCalledWith(0, 1)
  })
})
