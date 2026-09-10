import { useMemo } from 'react'
import { useStore } from '../store/useStore.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import { exOr } from '../lib/exercises.js'
import { supersetUnits, exLine } from '../lib/history.js'
import { Thumb } from './Media.jsx'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'
import { useRoutineReorder } from '../views/RoutineEdit.jsx'

export default function ReorderView({ title, entries = [], onReorder, onDone }) {
  const S = useStore(s => s.S)
  const reorder = useRoutineReorder(entries, entries, onReorder)

  const units = useMemo(() => supersetUnits(entries), [entries])
  const unitFirst = useMemo(() => new Set(units.filter(u => u.length > 1).map(u => u[0])), [units])
  const inSS = useMemo(() => new Set(units.filter(u => u.length > 1).flat()), [units])

  return (
    <div className="narrow vfade" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="hdr" style={{ marginBottom: 12 }}>
        <button className="iconbtn" onClick={onDone} aria-label={t('Done')}>
          <Icon name="chevronLeft" />
        </button>
        <div style={{ flex: 1, margin: '0 12px' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-.021em' }}>
            {title || t('Reorder exercises')}
          </h1>
        </div>
      </div>

      <div className="small dim" style={{ margin: '-4px 2px 14px' }}>
        {t('Long-press a card to reorder')}
      </div>

      <div style={{ flex: 1 }}>
        {entries.length ? (
          <div
            ref={reorder.listRef}
            onClickCapture={reorder.onClickCapture}
            className={'list routine-list' + (reorder.drag ? ' is-reordering' : '')}
          >
            {entries.map((e, i) => {
              const ex = exOr(e.id)
              const isDragging = reorder.drag && i >= reorder.drag.first && i <= reorder.drag.last
              const subtitle = Array.isArray(e.sets)
                ? t('{0} sets', e.sets.length)
                : exLine(e, S.unit)

              return (
                <div
                  key={i}
                  data-routine-row
                  data-ex-index={i}
                  className={'routine-drag-row' + (isDragging ? ' is-dragging' : '')}
                  style={isDragging ? { transform: `translate3d(0, ${reorder.drag.deltaY}px, 0)` } : undefined}
                >
                  {unitFirst.has(i) && (
                    <div className="ss-label">
                      <Icon name="link" />
                      {t('Superset')}
                    </div>
                  )}
                  <div className={'item' + (inSS.has(i) ? ' in-ss' : '')}>
                    <Thumb ex={ex} />
                    <div className="grow">
                      <div className="tt capitalize">{exerciseNameFor(ex)}</div>
                      <div className="ss">{subtitle}</div>
                      {e.note && <div className="small dim" style={{ marginTop: 2 }}>{e.note}</div>}
                    </div>
                    <div
                      data-drag-handle
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        marginRight: -4,
                        color: 'var(--label-2)',
                        cursor: 'grab',
                        touchAction: 'none',
                        flex: 'none',
                      }}
                      aria-label={t('Reorder exercises')}
                    >
                      <Icon name="list" size={20} />
                    </div>
                  </div>
                </div>
              )
            })}
            {reorder.drag && (
              <div
                className="routine-drop-indicator"
                data-testid="routine-drop-indicator"
                aria-hidden="true"
                style={{ top: `${reorder.drag.indicatorTop}px` }}
              />
            )}
          </div>
        ) : (
          <div className="empty">
            <div className="ico"><Icon name="dumbbell" /></div>
            {t('No exercises yet — add your first one.')}
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <Button variant="primary" onClick={onDone}>{t('Done')}</Button>
      </div>
    </div>
  )
}
