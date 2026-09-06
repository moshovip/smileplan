import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import PatientForm from '../components/PatientForm/PatientForm'
import MedRecordModal from '../components/MedRecord/MedRecordModal'
import RoadmapModal from '../components/Roadmap/RoadmapModal'

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function calcAge(birthDate) {
  if (!birthDate) return null
  const bd = new Date(birthDate), now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
  return age
}

function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:00`
}

const STATUS_LABELS = {
  planned: { label: 'Запланирован', color: 'bg-blue-100 text-blue-700' },
  arrived: { label: 'Пришёл',       color: 'bg-green-100 text-green-700' },
  treated: { label: 'Завершён',     color: 'bg-red-100 text-red-700' },
  paid:    { label: 'Оплачено',     color: 'bg-gray-100 text-gray-600' },
  confirmed:{ label: 'Подтверждён', color: 'bg-green-100 text-green-700' },
  done:    { label: 'Завершён',     color: 'bg-gray-100 text-gray-600' },
  cancelled:{ label: 'Отменён',     color: 'bg-red-50 text-red-400' },
}

export function PatientList() {
  const navigate = useNavigate()
  const patients = useStore(s => s.patients)
  const plans = useStore(s => s.plans)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const active = patients.filter(p => !p.archived)
  const filtered = patients
    .filter(p => showArchived ? p.archived : !p.archived)
    .filter(p => {
      const q = search.toLowerCase()
      return !q || p.fullName.toLowerCase().includes(q) || (p.phone || '').includes(q)
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Пациенты</h1>
          <p className="text-sm text-slate-500 mt-0.5">{active.length} активных</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/new')}>+ Добавить пациента</button>
      </div>

      <div className="flex gap-3">
        <input className="input flex-1" placeholder="🔍  Поиск по имени или телефону..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className={`btn-secondary ${showArchived ? 'border-brand-400 text-brand-700' : ''}`}
          onClick={() => setShowArchived(a => !a)}>
          {showArchived ? 'Активные' : 'Архив'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-medium">{search ? 'Не найдено' : 'Пациентов пока нет'}</p>
          {!search && <button className="btn-primary mt-4" onClick={() => navigate('/patients/new')}>Добавить первого</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const patPlans = plans.filter(pl => pl.patientId === p.id)
            const lastPlan = patPlans.sort((a, b) => b.createdAt - a.createdAt)[0]
            const age = calcAge(p.birthDate)
            return (
              <div key={p.id}
                className="card hover:shadow-md hover:border-brand-200 transition cursor-pointer flex items-center gap-4 py-4"
                onClick={() => navigate(`/patients/${p.id}`)}>
                <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                  {p.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{p.fullName}</p>
                    {age && <span className="text-xs text-slate-400">{age} лет</span>}
                    {p.allergies && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">⚠️ аллергия</span>}
                  </div>
                  <p className="text-sm text-slate-500">{p.phone || 'Телефон не указан'}</p>
                  {p.source && <p className="text-xs text-slate-400">{p.source}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-slate-700">{patPlans.length} {patPlans.length === 1 ? 'смета' : patPlans.length < 5 ? 'сметы' : 'смет'}</p>
                  {lastPlan && <p className="text-xs text-slate-400">{fmtDate(lastPlan.createdAt)}</p>}
                </div>
                <span className="text-slate-300 ml-2">›</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function PatientNew() {
  const navigate = useNavigate()
  const addPatient = useStore(s => s.addPatient)
  const handleSave = async (data) => {
    const patient = await addPatient(data)
    if (patient) navigate(`/patients/${patient.id}`)
  }
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-secondary" onClick={() => navigate('/patients')}>← Назад</button>
        <h1 className="text-xl font-bold text-slate-900">Новый пациент</h1>
      </div>
      <PatientForm onSave={handleSave} onCancel={() => navigate('/patients')} />
    </div>
  )
}

// Modal to copy/move a plan to another patient
function CopyPlanModal({ plan, patients, currentPatientId, onClose, addPlan }) {
  const [targetId, setTargetId] = useState('')
  const [done, setDone] = useState(false)
  const others = patients.filter(p => p.id !== currentPatientId && !p.archived)

  const handleCopy = async () => {
    if (!targetId) return
    await addPlan(targetId, plan.items || [], plan.note || '')
    setDone(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-bold text-lg mb-4">Копировать смету</h3>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-700 font-medium">Смета скопирована!</p>
            <button className="btn-primary mt-4" onClick={onClose}>Закрыть</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">Выберите пациента, которому скопировать смету ({plan.items?.length || 0} позиций)</p>
            {others.length === 0 ? (
              <p className="text-slate-400 text-sm">Нет других пациентов</p>
            ) : (
              <select className="input mb-4" value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">— выберите пациента —</option>
                {others.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            )}
            <div className="flex gap-3">
              <button className="btn-primary flex-1" disabled={!targetId} onClick={handleCopy}>Скопировать</button>
              <button className="btn-secondary" onClick={onClose}>Отмена</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patients = useStore(s => s.patients)
  const plans = useStore(s => s.plans)
  const appointments = useStore(s => s.appointments)
  const updatePatient = useStore(s => s.updatePatient)
  const archivePatient = useStore(s => s.archivePatient)
  const removePatient = useStore(s => s.removePatient)
  const removePlan = useStore(s => s.removePlan)
  const addPlan = useStore(s => s.addPlan)

  const medRecords = useStore(s => s.medRecords)
  const removeMedRecord = useStore(s => s.removeMedRecord)

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState('timeline') // 'timeline' | 'plans' | 'medcard' | 'roadmap' | 'materials'
  const [medModal, setMedModal] = useState(null) // null | 'new' | record
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [copyPlan, setCopyPlan] = useState(null) // plan to copy
  const [materials, setMaterials] = useState('') // local draft
  const materialsRef = useRef(null)

  const patient = patients.find(p => p.id === id)
  if (!patient) return <div className="text-slate-500 p-8">Пациент не найден</div>

  const patPlans = plans.filter(pl => pl.patientId === id).sort((a, b) => b.createdAt - a.createdAt)
  const patAppts = (appointments || []).filter(a => a.patientId === id).sort((a, b) => b.datetime - a.datetime)
  const patMedRecs = medRecords.filter(r => r.patientId === id).sort((a, b) => b.date - a.date)

  // Unified timeline: merge plans + appointments, sorted by date desc
  const timeline = [
    ...patPlans.map(p => ({ type: 'plan', ts: p.createdAt, data: p })),
    ...patAppts.map(a => ({ type: 'appt', ts: a.datetime, data: a })),
  ].sort((a, b) => b.ts - a.ts)

  const fmt = n => (n || 0).toLocaleString('ru-RU') + ' ₽'
  const age = calcAge(patient.birthDate)

  const handleDelete = async () => { await removePatient(id); navigate('/patients') }

  if (editing) {
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button className="btn-secondary" onClick={() => setEditing(false)}>← Назад</button>
          <h1 className="text-xl font-bold">Редактировать пациента</h1>
        </div>
        <PatientForm initial={patient}
          onSave={async data => { await updatePatient(id, data); setEditing(false) }}
          onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button className="btn-secondary shrink-0" onClick={() => navigate('/patients')}>← Назад</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-2xl shrink-0">
              {patient.fullName?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{patient.fullName}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {patient.phone && (
                  <a href={`tel:${patient.phone}`} className="text-brand-600 text-sm hover:underline">{patient.phone}</a>
                )}
                {age && <span className="text-sm text-slate-500">{age} лет</span>}
                {patient.gender && <span className="text-sm text-slate-400">{patient.gender === 'male' ? '♂' : '♀'}</span>}
                {patient.source && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{patient.source}</span>}
              </div>
            </div>
          </div>

          {/* Allergies warning — prominent */}
          {patient.allergies && (
            <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-0.5">Аллергии и заболевания</p>
                <p className="text-sm text-amber-900">{patient.allergies}</p>
              </div>
            </div>
          )}

          {patient.notes && (
            <p className="text-slate-500 text-sm mt-2 bg-slate-50 rounded-xl px-3 py-2">{patient.notes}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button className="btn-secondary" onClick={() => setEditing(true)}>✏️ Изменить</button>
          <button className="btn-secondary" onClick={() => { setTab('medcard'); setMedModal('new') }}>+ Медкарта</button>
          <button className="btn-secondary" onClick={() => setShowRoadmap(true)}>Дорожная карта</button>
          <button className="btn-primary" onClick={() => navigate(`/patients/${id}/estimate/new`)}>+ Смета</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-brand-700">{patAppts.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">визитов</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-brand-700">{patPlans.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">смет</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-green-700">{fmt(patPlans.reduce((s, p) => s + (p.total || 0), 0))}</p>
          <p className="text-xs text-slate-500 mt-0.5">всего</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[['timeline', '📋 Лента'], ['plans', '💰 Сметы'], ['medcard', '📄 Медкарта'], ['roadmap', 'Дорожные карты'], ['materials', '📦 Материалы']].map(([key, label]) => (
          <button key={key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div className="space-y-2">
          {timeline.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p>Записей пока нет</p>
              <button className="btn-primary mt-3" onClick={() => navigate(`/patients/${id}/estimate/new`)}>Создать смету</button>
            </div>
          ) : timeline.map((item, i) => {
            if (item.type === 'plan') {
              const plan = item.data
              return (
                <div key={plan.id} className="card flex items-center gap-3 py-3 hover:bg-brand-50 transition group cursor-pointer"
                  onClick={() => navigate(`/patients/${id}/estimate/${plan.id}`)}>
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 shrink-0 text-lg">💰</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">Смета лечения</p>
                    <p className="text-xs text-slate-400">{fmtDate(plan.createdAt)} · {plan.items?.length || 0} процедур</p>
                  </div>
                  <span className="font-bold text-green-700 text-sm">{fmt(plan.total)}</span>
                  <button className="opacity-0 group-hover:opacity-100 btn-danger text-xs p-1.5 ml-1"
                    onClick={e => { e.stopPropagation(); removePlan(plan.id) }}>🗑</button>
                </div>
              )
            } else {
              const appt = item.data
              const stMeta = STATUS_LABELS[appt.status] || STATUS_LABELS.planned
              return (
                <div key={appt.id} className="card flex items-center gap-3 py-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shrink-0 text-lg">📅</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{fmtDateTime(appt.datetime)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${stMeta.color}`}>{stMeta.label}</span>
                    </div>
                    {appt.note && <p className="text-xs text-slate-400 mt-0.5">💬 {appt.note}</p>}
                    <p className="text-xs text-slate-400">{appt.duration} мин</p>
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Сметы лечения ({patPlans.length})</h2>
          {patPlans.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>Сметы ещё не создавались</p>
              <button className="btn-primary mt-3" onClick={() => navigate(`/patients/${id}/estimate/new`)}>Создать первую смету</button>
            </div>
          ) : (
            <div className="space-y-3">
              {patPlans.map(plan => (
                <div key={plan.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-brand-50 transition group">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/patients/${id}/estimate/${plan.id}`)}>
                    <p className="font-medium text-sm">{fmtDate(plan.createdAt)}</p>
                    <p className="text-xs text-slate-500">{plan.items?.length || 0} процедур</p>
                    {plan.note && <p className="text-xs text-slate-400">{plan.note}</p>}
                  </div>
                  <span className="font-bold text-green-700">{fmt(plan.total)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button className="btn-secondary text-xs py-1 px-2" title="Копировать другому пациенту"
                      onClick={() => setCopyPlan(plan)}>📋</button>
                    <button className="btn-danger text-xs p-1.5"
                      onClick={() => removePlan(plan.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medcard tab */}
      {tab === 'medcard' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Медицинская карта ({patMedRecs.length})</h2>
            <button className="btn-primary text-sm" onClick={() => setMedModal('new')}>+ Добавить запись</button>
          </div>
          {patMedRecs.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📄</div>
              <p>Записей в медкарте нет</p>
              <button className="btn-primary mt-3" onClick={() => setMedModal('new')}>Добавить первую запись</button>
            </div>
          ) : patMedRecs.map(rec => (
            <div key={rec.id} className="card">
              <div className="flex items-start justify-between px-4 pt-4 pb-2">
                <div>
                  <p className="font-semibold text-slate-900">{fmtDate(rec.date)}</p>
                  {rec.diagnosis && <p className="text-sm text-brand-700 font-medium mt-0.5">{rec.diagnosis}</p>}
                </div>
                <div className="flex gap-1">
                  <button className="btn-secondary text-xs py-1 px-2" onClick={() => setMedModal(rec)}>✏️</button>
                  <button className="text-slate-300 hover:text-red-500 text-xs px-2" onClick={() => removeMedRecord(rec.id)}>🗑</button>
                </div>
              </div>
              <div className="px-4 pb-4 space-y-2 text-sm">
                {rec.complaints && (
                  <div><span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Жалобы: </span>
                  <span className="text-slate-700">{rec.complaints}</span></div>
                )}
                {rec.examination && (
                  <div><span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Объективно: </span>
                  <span className="text-slate-700">{rec.examination}</span></div>
                )}
                {rec.treatment && (
                  <div><span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Лечение: </span>
                  <span className="text-slate-700">{rec.treatment}</span></div>
                )}
                {rec.nextVisit && (
                  <div className="bg-brand-50 rounded-lg px-3 py-1.5 text-brand-700 text-xs">
                    Следующий визит: {rec.nextVisit}
                  </div>
                )}
                {rec.editHistory?.length > 0 && (
                  <details className="mt-1">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                      История изменений ({rec.editHistory.length})
                    </summary>
                    <div className="mt-1 space-y-1 pl-2 border-l-2 border-slate-100">
                      {[...rec.editHistory].reverse().map((h, i) => (
                        <div key={i} className="text-[11px] text-slate-400">
                          {new Date(h.at).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })}{' '}
                          {new Date(h.at).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap tab */}
      {tab === 'roadmap' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Дорожные карты лечения</h2>
            <button className="btn-primary text-sm" onClick={() => setShowRoadmap(true)}>+ Создать карту</button>
          </div>
          {/* List is shown inside RoadmapModal — clicking opens it */}
          <div className="card text-center py-8 text-slate-400 cursor-pointer hover:bg-slate-50"
            onClick={() => setShowRoadmap(true)}>
            <div className="text-4xl mb-2">🗺</div>
            <p className="text-sm">Нажмите «+ Создать карту» или кликните сюда</p>
            <p className="text-xs mt-1">Голосовая диктовка → AI генерирует карту за 20 сек</p>
          </div>
        </div>
      )}

      {/* Materials tab */}
      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-1">Материалы и рекомендации</h2>
            <p className="text-xs text-slate-400 mb-3">Записывайте использованные материалы, назначения и рекомендации пациенту</p>
            <textarea
              className="input resize-none h-40"
              placeholder={`Использованные материалы:\n— Имплант NobelActive 4.3x10 (партия ...)\n— Bio-Oss 0.5g (лот ...)\n— Bio-Gide 25x25\n\nРекомендации пациенту:\n— Антибиотик: Амоксициллин 500мг 3р/д 7 дней\n— Обезболивающее: Ибупрофен 400мг по необходимости\n— Холод на щёку 20 мин чередуя\n— Явка через 10 дней на снятие швов`}
              value={patient.materials || ''}
              onChange={e => updatePatient(id, { materials: e.target.value })}
            />
          </div>

          {/* Recommendations history from medRecords */}
          {patMedRecs.filter(r => r.nextVisit).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Назначения из медкарты</h3>
              <div className="space-y-2">
                {patMedRecs.filter(r => r.nextVisit).map(r => (
                  <div key={r.id} className="flex gap-3 p-2 bg-brand-50 rounded-xl text-sm">
                    <span className="text-brand-400 shrink-0 font-medium">{fmtDate(r.date)}</span>
                    <span className="text-slate-700">{r.nextVisit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {medModal && (
        <MedRecordModal
          patientId={id}
          initial={medModal !== 'new' ? medModal : null}
          onClose={() => setMedModal(null)} />
      )}
      {showRoadmap && (
        <RoadmapModal patient={patient} patPlans={patPlans} onClose={() => setShowRoadmap(false)} />
      )}
      {copyPlan && (
        <CopyPlanModal
          plan={copyPlan}
          patients={patients}
          currentPatientId={id}
          addPlan={addPlan}
          onClose={() => setCopyPlan(null)} />
      )}

      {/* Danger zone */}
      <div className="card border-red-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Зона опасности</h3>
        <div className="flex gap-3">
          <button className="btn-danger" onClick={() => archivePatient(id)}>📦 В архив</button>
          {confirmDelete ? (
            <div className="flex gap-2">
              <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>Да, удалить</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Отмена</button>
            </div>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>🗑 Удалить пациента</button>
          )}
        </div>
      </div>
    </div>
  )
}
