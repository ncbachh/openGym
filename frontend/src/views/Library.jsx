import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { EXDB, allExercises, matchExercise } from '../lib/exercises.js'
import { MUSCLE_NAME } from '../lib/muscles.js'
import { activeProfile, exAvailable } from '../lib/equipment.js'
import { bestWeightFor } from '../lib/history.js'
import { fmtNum } from '../lib/format.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import { Thumb } from '../components/Media.jsx'
import { exerciseDetailSheet, addToRoutineSheet, customExSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { tappable } from '../lib/use-sheet-keyboard.js'
import { isFav, sortFavouritesFirst } from '../lib/favourites.js'
import {
  matchesMuscles,
  matchesEquipment,
  getMuscleOptions,
  getEquipmentOptions,
  equipmentFilterLabel,
  muscleFilterLabel
} from '../lib/exercise-filters.js'
import { openFilterSheet } from '../components/FilterSheet.jsx'

export default function Library() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const [q, setQ] = useState('')
  const [muscles, setMuscles] = useState([])
  const [equipment, setEquipment] = useState([])
  const [showAll, setShowAll] = useState(false)   // ignore the active equipment profile for this session
  const [shown, setShown] = useState(40)

  const profile = activeProfile(S)
  const all = allExercises(S)
  const available = (profile && !showAll) ? all.filter(e => exAvailable(S, e)) : all

  const muscleOptions = useMemo(() => getMuscleOptions(), [])
  const equipmentOptions = useMemo(() => getEquipmentOptions(all), [all])

  const filtered = available.filter(e =>
    matchExercise(e, q) &&
    matchesMuscles(e, muscles) &&
    matchesEquipment(e, equipment)
  )
  const f = sortFavouritesFirst(filtered, S)

  const openEquipment = () => {
    openFilterSheet({
      title: t('Equipment'),
      options: equipmentOptions,
      selected: equipment,
      onApply: val => { setEquipment(val); setShown(40) },
      countMatching: tempEq => available.filter(e =>
        matchExercise(e, q) &&
        matchesMuscles(e, muscles) &&
        matchesEquipment(e, tempEq)
      ).length
    })
  }

  const openMuscles = () => {
    openFilterSheet({
      title: t('Muscles'),
      options: muscleOptions,
      selected: muscles,
      onApply: val => { setMuscles(val); setShown(40) },
      countMatching: tempM => available.filter(e =>
        matchExercise(e, q) &&
        matchesMuscles(e, tempM) &&
        matchesEquipment(e, equipment)
      ).length
    })
  }

  const eqLabel = equipmentFilterLabel(equipment)
  const mLabel = muscleFilterLabel(muscles)

  return <>
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/stats')} aria-label={t('Stats')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 12 }}>
        <h1>{t('Exercises')}</h1>
        <div className="sub">{t('{0} exercises with animations', EXDB.length)}</div>
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <button className="iconbtn" onClick={() => nav('/muscles')} aria-label={t('By muscle')} title={t('By muscle')}><Icon name="target" /></button>
        <Button size="sm" variant="plain" onClick={() => customExSheet(null, ex => exerciseDetailSheet(ex), q.trim())} style={{ fontWeight: 600, fontSize: 16 }}>{t('Create')}</Button>
      </div>
    </div>
    <div className="search" style={{ marginBottom: 10 }}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input className="input" placeholder={t('Search…')} value={q} onChange={e => { setQ(e.target.value); setShown(40) }} /></div>
    {profile && <div className="small dim row" style={{ margin: '-4px 2px 10px', gap: 6, alignItems: 'center' }}>
      <Icon name="dumbbell" style={{ fontSize: 13 }} />
      {showAll ? t('Showing all equipment') : t('Showing what you have in "{0}"', profile.name)}
      <button className="chip nocap" style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: 12 }} onClick={() => setShowAll(v => !v)}>
        {showAll ? t('Filter by "{0}"', profile.name) : t('Show all equipment')}
      </button>
    </div>}
    <div className="filter-grid">
      <button
        type="button"
        className={'filter-btn' + (equipment.length > 0 ? ' active' : '')}
        onClick={openEquipment}
        aria-label={eqLabel}
      >
        <span>{eqLabel}</span>
      </button>
      <button
        type="button"
        className={'filter-btn' + (muscles.length > 0 ? ' active' : '')}
        onClick={openMuscles}
        aria-label={mLabel}
      >
        <span>{mLabel}</span>
      </button>
    </div>
    <div className="list">
      {f.slice(0, shown).map(e => {
        const best = bestWeightFor(S, e.id)
        return <div key={e.id} className="item" {...tappable(() => exerciseDetailSheet(e))}>
          <Thumb ex={e} />
          <div className="grow"><div className="tt capitalize">{isFav(S, e.id) && <Icon name="starFill" className="fav-star" />}{exerciseNameFor(e)}</div><div className="ss capitalize">{t(MUSCLE_NAME[e.tg] || e.tg || e.bp)} · {t(e.eq)}</div></div>
          {best > 0 && <span className="tag acc">{fmtNum(best)}</span>}
          <Button size="sm" variant="tinted" icon="plus" onClick={ev => { ev.stopPropagation(); addToRoutineSheet(e) }}>{t('Plan')}</Button>
        </div>
      })}
      {f.length === 0 && <div className="empty"><div className="ico"><Icon name="magnifier" /></div>{t('No match')}</div>}
    </div>
    {f.length > shown && <><div style={{ height: 10 }} /><Button onClick={() => setShown(s => s + 40)}>{t('Show more')}</Button></>}
  </>
}
