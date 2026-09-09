import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'
import { Button, SearchField } from './ui.jsx'
import { useUI } from '../store/useUI.js'

export function FilterSheetContent({ title, options, selected, onApply, countMatching, close }) {
  const [sel, setSel] = useState(selected || [])
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const syncPickerViewport = useCallback(() => {
    const input = inputRef.current
    const sheet = input?.closest('.sheet')
    const viewport = window.visualViewport
    if (!sheet || !viewport) return
    const visualHeight = Math.max(0, viewport.height || window.innerHeight)
    const visualBottom = (viewport.offsetTop || 0) + visualHeight
    const bottomInset = Math.max(0, window.innerHeight - visualBottom)
    sheet.style.setProperty('--picker-keyboard-bottom', `${bottomInset}px`)
    sheet.style.setProperty('--picker-visual-height', `${visualHeight}px`)
  }, [])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const sync = () => syncPickerViewport()
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      const sheet = inputRef.current?.closest('.sheet')
      sheet?.style.removeProperty('--picker-keyboard-bottom')
      sheet?.style.removeProperty('--picker-visual-height')
    }
  }, [syncPickerViewport])

  const toggle = val => {
    setSel(cur => cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val])
  }

  const handleClear = () => {
    setSel([])
  }

  const handleApply = () => {
    onApply(sel)
    close()
  }

  const visibleOptions = useMemo(() => {
    if (!q.trim()) return options
    const s = q.trim().toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(s) || (o.value && String(o.value).toLowerCase().includes(s)))
  }, [options, q])

  const resultCount = useMemo(() => {
    return countMatching ? countMatching(sel) : null
  }, [countMatching, sel])

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h3>{title}</h3>
      </div>
      <div className="picker-search">
        <SearchField
          value={q}
          onChange={e => setQ(e.target.value)}
          onClear={() => setQ('')}
          placeholder={t('Search…')}
          aria-label={t('Search…')}
          ref={inputRef}
          onFocus={syncPickerViewport}
        />
      </div>
      <div className="sect-b" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
        {visibleOptions.map(o => {
          const on = sel.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              className={'lrow tap' + (on ? ' on' : '')}
              onClick={() => toggle(o.value)}
            >
              <span className="lrow-m">
                <span className="lrow-t">{o.label}</span>
                {o.subtitle && <span className="lrow-s">{o.subtitle}</span>}
              </span>
              {on && <Icon name="check" className="lrow-k" />}
            </button>
          )
        })}
        {visibleOptions.length === 0 && (
          <div className="empty">
            <div className="ico"><Icon name="magnifier" /></div>
            {t('No match')}
          </div>
        )}
      </div>
      <div className="filter-sheet-footer">
        <Button variant="ghost" onClick={handleClear}>{t('Clear Filters')}</Button>
        <Button variant="primary" onClick={handleApply}>
          {resultCount !== null ? t('Show {0} results', resultCount) : t('Apply')}
        </Button>
      </div>
    </>
  )
}

export function openFilterSheet({ title, options, selected, onApply, countMatching }) {
  return useUI.getState().openSheet(close => (
    <FilterSheetContent
      title={title}
      options={options}
      selected={selected}
      onApply={onApply}
      countMatching={countMatching}
      close={close}
    />
  ))
}
