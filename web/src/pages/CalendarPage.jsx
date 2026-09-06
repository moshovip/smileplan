import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { v4 as uuidv4 } from 'uuid'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)  // 8–20
const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS_RU = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
const MONTHS_RU_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

const STATUS_META = {
  planned:   { label: 'Запланирован',    next: 'arrived',  nextLabel: 'Пришёл',    color: '#3b82f6', bg: '#eff6ff' },
  arrived:   { label: 'Пришёл',          next: 'treated',  nextLabel: 'Завершить', color: '#10b981', bg: '#f0fdf4' },
  treated:   { label: 'Завершён (долг)', next: 'paid',     nextLabel: 'Оплачено',  color: '#f59e0b', bg: '#fffbeb' },
  paid:      { label: 'Оплачено',        next: null,       nextLabel: null,         color: '#6b7280', bg: '#f9fafb' },
  confirmed: { label: 'Подтверждён',     next: 'arrived',  nextLabel: 'Пришёл',    color: '#10b981', bg: '#f0fdf4' },
  done:      { label: 'Завершён',        next: 'paid',     nextLabel: 'Оплачено',  color: '#6b7280', bg: '#f9fafb' },
  cancelled: { label: 'Отменён',         next: null,       nextLabel: null,         color: '#ef4444', bg: '#fef2f2' },
}

const DURATION_OPTIONS = [
  { value: 15,  label: '15 мин' },
  { value: 30,  label: '30 мин' },
  { value: 45,  label: '45 мин' },
  { value: 60,  label: '1 час' },
  { value: 90,  label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
  { value: 180, label: '3 часа' },
  { value: 240, label: '4 часа' },
  { value: 300, label: '5 часов' },
]

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
function isBirthdayToday(patient) {
  if (!patient?.birthDate) return false
  const bd = new Date(patient.birthDate), now = new Date()
  return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate()
}
function isBirthdayThisMonth(patient) {
  if (!patient?.birthDate) return false
  return new Date(patient.birthDate).getMonth() === new Date().getMonth()
}

// ── Patient search input ──────────────────────────────────────────────────────
function PatientSearch({ patients, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = patients.find(p => p.id === value)
  const filtered = patients
    .filter(p => !search || p.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
    .slice(0, 20)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Начните вводить имя..."
        value={selected && !open ? selected.fullName : search}
        onChange={e => { setSearch(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
        onFocus={() => { setSearch(''); setOpen(true) }}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Не найдено</div>}
          {filtered.map(p => (
            <button key={p.id} type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
              onMouseDown={() => { onChange(p.id); setSearch(''); setOpen(false) }}>
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                {p.fullName[0]}
              </span>
              {p.fullName}{isBirthdayToday(p) ? ' 🎂' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Appointment modal ─────────────────────────────────────────────────────────
function ApptModal({ mode, slot, appt, patients, allAppts, onSave, onClose }) {
  const [patientId, setPatientId] = useState(appt?.patientId || slot?.prePatientId || '')
  const [duration,  setDuration]  = useState(appt?.duration  || 60)
  const [note,      setNote]      = useState(appt?.note      || '')

  const patient = patients.find(p => p.id === patientId)

  // Conflict detection
  const slotDate = slot?.date || (appt ? new Date(appt.datetime) : new Date())
  const slotHour = slot?.hour ?? (appt ? new Date(appt.datetime).getHours() : 8)
  const slotStart = new Date(slotDate); slotStart.setHours(slotHour, 0, 0, 0)
  const slotEnd = new Date(slotStart.getTime() + duration * 60000)

  const conflicts = allAppts.filter(a => {
    if (mode === 'edit' && a.id === appt?.id) return false
    const aStart = new Date(a.datetime)
    const aEnd = new Date(aStart.getTime() + a.duration * 60000)
    return sameDay(aStart, slotDate) && aStart < slotEnd && aEnd > slotStart
  })

  const title = mode === 'edit'
    ? `Редактировать — ${new Date(appt?.datetime||0).getDate()} ${MONTHS_RU_SHORT[new Date(appt?.datetime||0).getMonth()]}`
    : `Новая запись — ${slotDate.getDate()} ${MONTHS_RU_SHORT[slotDate.getMonth()]}, ${slotHour}:00`

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 w-full sm:w-96" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Conflict warning */}
        {conflicts.length > 0 && (
          <div className="mb-3 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-800">
            ⚠️ Пересечение с {conflicts.length} записью в это время:
            {conflicts.map(c => {
              const p = patients.find(x => x.id === c.patientId)
              return ` ${p?.fullName || '?'} (${new Date(c.datetime).getHours()}:00, ${c.duration} мин)`
            }).join(',')}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Пациент *</label>
            <PatientSearch patients={patients} value={patientId} onChange={setPatientId} />
            {patient?.allergies && (
              <div className="mt-1.5 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-800">
                ⚠️ {patient.allergies}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Длительность</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Заметка / причина визита</label>
            <input type="text" placeholder="Что планируем..."
              value={note} onChange={e => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave({ patientId, duration, note })} disabled={!patientId}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-blue-700">
            {mode === 'edit' ? 'Сохранить' : 'Записать'}
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm hover:bg-gray-50">
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compute occupancy for a day (for rowSpan) ─────────────────────────────────
function computeDayOccupancy(dayAppts) {
  const occupied = new Set()  // hours covered by a rowSpan from earlier
  const startMap = new Map()  // hour → array of appts starting here
  const spanMap  = new Map()  // hour → rowSpan value for that start

  for (const appt of dayAppts) {
    const h = new Date(appt.datetime).getHours()
    if (!startMap.has(h)) { startMap.set(h, []); spanMap.set(h, 1) }
    startMap.get(h).push(appt)
    const span = Math.ceil(appt.duration / 60)
    spanMap.set(h, Math.max(spanMap.get(h), span))
    for (let s = 1; s < span; s++) occupied.add(h + s)
  }
  return { occupied, startMap, spanMap }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { patients, appointments = [], addAppointment, updateAppointment, deleteAppointment } = useStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [view, setView]           = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal]         = useState(null)
  const [contextMenu, setContextMenu] = useState(null)

  // Auto-open from medcard quick-booking (state passed via navigate)
  useEffect(() => {
    const st = location.state
    if (st?.preDate && st?.prePatientId) {
      const d = new Date(st.preDate)
      setCurrentDate(d)
      setView('day')
      setModal({ mode: 'create', slot: { date: d, hour: 9, prePatientId: st.prePatientId } })
      window.history.replaceState({}, '') // clear state so refresh doesn't reopen
    }
  }, [])

  const weekStart = startOfWeek(currentDate)
  const weekDays  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  })
  const appts  = appointments || []
  const today  = new Date()

  const monthStart  = startOfMonth(currentDate)
  const firstDow    = monthStart.getDay() === 0 ? 7 : monthStart.getDay()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  function getApptsForDay(day) {
    return appts.filter(a => sameDay(new Date(a.datetime), day)).sort((a, b) => a.datetime - b.datetime)
  }

  function prevPeriod() {
    const d = new Date(currentDate)
    if (view === 'week') d.setDate(d.getDate() - 7)
    else if (view === 'day') d.setDate(d.getDate() - 1)
    else d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }
  function nextPeriod() {
    const d = new Date(currentDate)
    if (view === 'week') d.setDate(d.getDate() + 7)
    else if (view === 'day') d.setDate(d.getDate() + 1)
    else d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  async function handleSave({ patientId, duration, note }) {
    if (modal.mode === 'edit') {
      await updateAppointment({ ...modal.appt, patientId, duration, note })
    } else {
      const dt = new Date(modal.slot.date)
      dt.setHours(modal.slot.hour, 0, 0, 0)
      await addAppointment({
        id: uuidv4(), patientId, datetime: dt.getTime(),
        duration: Number(duration), note, status: 'planned', createdAt: Date.now()
      })
    }
    setModal(null)
  }

  async function advanceStatus(appt) {
    const meta = STATUS_META[appt.status]
    if (!meta?.next) return
    await updateAppointment({ ...appt, status: meta.next })
    setContextMenu(null)
  }

  async function handleDelete(appt) {
    await deleteAppointment(appt.id); setContextMenu(null)
  }

  useEffect(() => {
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  function getBlockStyle(appt) {
    const meta = STATUS_META[appt.status] || STATUS_META.planned
    if (appt.status === 'planned' || appt.status === 'confirmed') {
      const patAppts = appts.filter(a => a.patientId === appt.patientId && a.status !== 'cancelled')
      const isFirst = patAppts.length <= 1 || Math.min(...patAppts.map(a => a.createdAt)) === appt.createdAt
      return isFirst
        ? { background: '#dcfce7', color: '#15803d', borderLeft: '3px solid #16a34a' }
        : { background: '#fef3c7', color: '#92400e', borderLeft: '3px solid #f59e0b' }
    }
    return { background: meta.bg, color: meta.color, borderLeft: `3px solid ${meta.color}` }
  }

  function ApptBlock({ appt, spanRows = 1 }) {
    const patient = patients.find(p => p.id === appt.patientId)
    const style   = getBlockStyle(appt)
    const isBday  = isBirthdayThisMonth(patient)
    const meta    = STATUS_META[appt.status] || STATUS_META.planned
    const cellH   = spanRows * 56 - 4  // fill the spanned cell height

    return (
      <div
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, appt }) }}
        onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, appt }) }}
        style={{ ...style, height: spanRows > 1 ? cellH : undefined, minHeight: 20 }}
        className="rounded px-1.5 py-0.5 text-xs cursor-pointer hover:opacity-85 mb-0.5 select-none overflow-hidden flex flex-col"
        title={`${patient?.fullName} · ${appt.duration} мин · ${meta.label}${appt.note ? '\n' + appt.note : ''}`}>
        <div className="font-semibold truncate">
          {patient?.fullName || '—'}{isBday ? ' 🎂' : ''}
        </div>
        {spanRows > 1 && appt.note && <div className="opacity-75 text-[10px] truncate">{appt.note}</div>}
        <div className="opacity-60 text-[10px] mt-auto">{appt.duration} мин · {meta.label}</div>
      </div>
    )
  }

  const periodLabel = view === 'week'
    ? `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MONTHS_RU[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`
    : view === 'day'
    ? `${currentDate.getDate()} ${MONTHS_RU[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${MONTHS_RU[currentDate.getMonth()].charAt(0).toUpperCase()}${MONTHS_RU[currentDate.getMonth()].slice(1)} ${currentDate.getFullYear()}`

  // Pre-compute occupancy for current week
  const weekOccupancy = weekDays.map(d => computeDayOccupancy(getApptsForDay(d)))
  const dayOccupancy  = computeDayOccupancy(getApptsForDay(currentDate))

  return (
    <div className="-mx-6 -my-6 flex flex-col bg-white" style={{ height: 'calc(100vh - 56px)' }}
      onClick={() => setContextMenu(null)}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-lg leading-none">‹</button>
          <button onClick={nextPeriod} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-lg leading-none">›</button>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
            Сегодня
          </button>
          <h2 className="text-sm font-semibold text-gray-800 ml-1 hidden sm:block">{periodLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-300 inline-block"/> Новый</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-300 inline-block"/> Повторный</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"/> Долг</span>
          </div>
          <div className="flex gap-1">
            {['day','week','month'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`text-xs px-2.5 py-1 rounded ${view === v ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                {v === 'day' ? 'День' : v === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">

        {/* MONTH VIEW */}
        {view === 'month' && (
          <div className="p-2">
            <div className="grid grid-cols-7 text-center">
              {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                <div key={d} className="py-2 text-xs font-semibold text-gray-500">{d}</div>
              ))}
              {Array.from({ length: firstDow - 1 }).map((_, i) => (
                <div key={'e'+i} className="border border-gray-100 min-h-20 bg-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                const dayAppts = getApptsForDay(d)
                const isToday = sameDay(d, today)
                return (
                  <div key={day}
                    onClick={() => { setCurrentDate(d); setView('day') }}
                    className={`border border-gray-100 min-h-20 p-1 cursor-pointer hover:bg-blue-50 ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    {dayAppts.slice(0, 3).map(a => {
                      const p = patients.find(x => x.id === a.patientId)
                      const s = getBlockStyle(a)
                      return (
                        <div key={a.id} style={s}
                          className="text-[10px] rounded px-1 mb-0.5 truncate"
                          onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, appt: a }) }}>
                          {new Date(a.datetime).getHours()}:{String(new Date(a.datetime).getMinutes()).padStart(2,'0')} {p?.fullName?.split(' ')[0] || '?'}
                        </div>
                      )
                    })}
                    {dayAppts.length > 3 && <div className="text-[10px] text-gray-400">+{dayAppts.length - 3}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW — with rowSpan blocking */}
        {view === 'week' && (
          <table className="w-full border-collapse table-fixed" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="w-12 border-r border-b border-gray-200 bg-gray-50" />
                {weekDays.map((d, i) => {
                  const isToday = sameDay(d, today)
                  return (
                    <th key={i}
                      onClick={() => { setCurrentDate(d); setView('day') }}
                      className={`border-r border-b border-gray-200 text-center py-2 text-sm font-medium cursor-pointer hover:bg-blue-50 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{DAYS_RU[d.getDay()]}</div>
                      <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{d.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="border-r border-b border-gray-100 bg-gray-50 text-right pr-2 text-xs text-gray-400 align-top pt-1 w-12" style={{ height: 56 }}>
                    {hour}:00
                  </td>
                  {weekDays.map((d, colIdx) => {
                    const { occupied, startMap, spanMap } = weekOccupancy[colIdx]
                    if (occupied.has(hour)) return null  // covered by rowSpan above

                    const cellAppts = startMap.get(hour) || []
                    const span = Math.min(spanMap.get(hour) || 1, HOURS[HOURS.length-1] - hour + 1)

                    return (
                      <td key={colIdx}
                        rowSpan={span > 1 ? span : undefined}
                        onClick={() => setModal({ mode: 'create', slot: { date: d, hour } })}
                        className={`border-r border-b border-gray-100 p-0.5 align-top cursor-pointer hover:bg-blue-50/40 transition-colors ${sameDay(d, today) ? 'bg-blue-50/20' : ''}`}
                        style={{ height: 56, verticalAlign: 'top' }}>
                        {cellAppts.map(a => (
                          <ApptBlock key={a.id} appt={a} spanRows={Math.min(Math.ceil(a.duration / 60), HOURS[HOURS.length-1] - hour + 1)} />
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* DAY VIEW — with rowSpan blocking */}
        {view === 'day' && (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 border-r border-b border-gray-200 bg-gray-50" />
                <th className={`border-b border-gray-200 text-center py-2 ${sameDay(currentDate, today) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-gray-500">{DAYS_RU[currentDate.getDay()]}</div>
                  <div className={`text-2xl font-bold ${sameDay(currentDate, today) ? 'text-blue-600' : 'text-gray-800'}`}>
                    {currentDate.getDate()}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => {
                if (dayOccupancy.occupied.has(hour)) return null  // covered by rowSpan

                const cellAppts = dayOccupancy.startMap.get(hour) || []
                const span = Math.min(dayOccupancy.spanMap.get(hour) || 1, HOURS[HOURS.length-1] - hour + 1)

                return (
                  <tr key={hour}>
                    <td className="border-r border-b border-gray-100 bg-gray-50 text-right pr-2 text-xs text-gray-400 align-top pt-1 w-16" style={{ height: 72 }}>
                      {hour}:00
                    </td>
                    <td
                      rowSpan={span > 1 ? span : undefined}
                      onClick={() => setModal({ mode: 'create', slot: { date: currentDate, hour } })}
                      className="border-b border-gray-100 p-1 align-top cursor-pointer hover:bg-blue-50/40"
                      style={{ height: 72 }}>
                      {cellAppts.map(a => (
                        <ApptBlock key={a.id} appt={a} spanRows={Math.min(Math.ceil(a.duration / 60), HOURS[HOURS.length-1] - hour + 1)} />
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Appointment modal */}
      {modal && (
        <ApptModal
          mode={modal.mode}
          slot={modal.slot}
          appt={modal.appt}
          patients={patients}
          allAppts={appts}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 min-w-56"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 240), top: Math.min(contextMenu.y, window.innerHeight - 260) }}
          onClick={e => e.stopPropagation()}>
          {(() => {
            const appt = contextMenu.appt
            const patient = patients.find(p => p.id === appt.patientId)
            const meta = STATUS_META[appt.status] || STATUS_META.planned
            const dt = new Date(appt.datetime)
            return (
              <>
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{patient?.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {dt.getDate()} {MONTHS_RU_SHORT[dt.getMonth()]}, {dt.getHours()}:00 · {appt.duration} мин
                  </p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                  {appt.note && <p className="text-xs text-gray-500 mt-1">📝 {appt.note}</p>}
                  {patient?.allergies && <p className="text-xs text-amber-700 mt-1">⚠️ {patient.allergies}</p>}
                </div>
                {meta.next && (
                  <button onClick={() => advanceStatus(appt)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 font-medium text-gray-800">
                    {meta.nextLabel} →
                  </button>
                )}
                <button onClick={() => { setModal({ mode: 'edit', appt }); setContextMenu(null) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                  ✏️ Редактировать запись
                </button>
                <button onClick={() => { navigate(`/patients/${appt.patientId}`); setContextMenu(null) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                  👤 Карточка пациента
                </button>
                <button onClick={() => { navigate(`/patients/${appt.patientId}/estimate/new`); setContextMenu(null) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                  📋 Новый план лечения
                </button>
                <div className="border-t border-gray-100 mt-1" />
                <button onClick={() => handleDelete(appt)}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  🗑 Удалить запись
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
