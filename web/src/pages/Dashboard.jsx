import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../stores/useStore'

const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
function fmtMoney(n) { return n.toLocaleString('ru-RU') + ' ₽' }

function StatCard({ label, value, sub, accent, icon, onClick }) {
  return (
    <div className={`card flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}>
      <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
        style={{ background: accent + '18', color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-900 leading-tight truncate">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function FinanceBar({ planned, paid }) {
  const pct = planned > 0 ? Math.min(100, Math.round((paid / planned) * 100)) : 0
  const debt = Math.max(0, planned - paid)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900">Финансы</h2>
        <span className="text-xs text-slate-400">{pct}% собрано</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + '%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Выставлено</p>
          <p className="text-sm font-bold text-slate-800">{fmtMoney(planned)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Оплачено</p>
          <p className="text-sm font-bold text-green-600">{fmtMoney(paid)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Долг</p>
          <p className="text-sm font-bold text-red-500">{fmtMoney(debt)}</p>
        </div>
      </div>
    </div>
  )
}

const STATUS_COLOR = {
  planned:   '#3b82f6',
  arrived:   '#10b981',
  treated:   '#f59e0b',
  paid:      '#6b7280',
  cancelled: '#ef4444',
}
const STATUS_LABEL = {
  planned:   'Запланирован',
  arrived:   'Пришёл',
  treated:   'Завершён',
  paid:      'Оплачено',
  cancelled: 'Отменён',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const patients     = useStore(s => s.patients)
  const plans        = useStore(s => s.plans)
  const appointments = useStore(s => s.appointments)
  const settings     = useStore(s => s.settings)

  const activePatients = patients.filter(p => !p.archived)
  const totalPlanned   = plans.reduce((s, p) => s + (p.total || 0), 0)
  const totalPaid      = plans.reduce((s, p) => s + (p.paid || 0), 0)
  const recentPlans    = [...plans].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTs = today.getTime()
  const todayAppts = (appointments || [])
    .filter(a => {
      const d = new Date(a.datetime); d.setHours(0, 0, 0, 0)
      return d.getTime() === todayTs
    })
    .sort((a, b) => a.datetime - b.datetime)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Доброе утро'
    if (h < 18) return 'Добрый день'
    return 'Добрый вечер'
  }

  const doctorFirst = settings.doctorName ? ', ' + settings.doctorName.split(' ')[0] : ''

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting()}{doctorFirst}!</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/new')}>+ Новый пациент</button>
      </div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Активных пациентов" value={activePatients.length}
          icon="👥" accent="#0284c7"
          onClick={() => navigate('/patients')} />
        <StatCard label="Смет создано" value={plans.length}
          icon="📋" accent="#7c3aed"
          onClick={() => navigate('/patients')} />
        <StatCard label="На сегодня" value={todayAppts.length + ' визитов'}
          icon="📅" accent="#0891b2"
          sub={todayAppts.length > 0
            ? `Первый в ${new Date(todayAppts[0].datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
            : 'Записей нет'}
          onClick={() => navigate('/calendar')} />
        <StatCard label="Активных пациентов" value={activePatients.length}
          icon="👥" accent="#0284c7"
          onClick={() => navigate('/patients')} />
      </div>

      {/* Finance + Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FinanceBar planned={totalPlanned} paid={totalPaid} />

        {/* Today's appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Сегодня</h2>
            <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate('/calendar')}>
              Расписание →
            </button>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 cursor-pointer" onClick={() => navigate('/calendar')}>
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Записей на сегодня нет</p>
              <p className="text-xs mt-1 text-brand-500">Открыть расписание →</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayAppts.slice(0, 6).map(appt => {
                const patient = patients.find(p => p.id === appt.patientId)
                const color = STATUS_COLOR[appt.status] || '#64748b'
                return (
                  <div key={appt.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => navigate('/calendar')}>
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs font-mono font-bold text-slate-500 w-11 shrink-0">
                      {new Date(appt.datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{patient?.fullName || '—'}</p>
                      {appt.note && <p className="text-xs text-slate-400 truncate">{appt.note}</p>}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: color + '18', color }}>
                      {appt.duration} мин
                    </span>
                  </div>
                )
              })}
              {todayAppts.length > 6 && (
                <button className="w-full text-xs text-brand-600 py-2 hover:underline"
                  onClick={() => navigate('/calendar')}>
                  Ещё {todayAppts.length - 6} записей →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent plans */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Последние сметы</h2>
          <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate('/patients')}>
            Все пациенты →
          </button>
        </div>
        {recentPlans.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-medium">Смет пока нет</p>
            <button className="btn-primary mt-4" onClick={() => navigate('/patients/new')}>Добавить пациента</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentPlans.map(plan => {
              const patient = patients.find(p => p.id === plan.patientId)
              const paid = plan.paid || 0
              const total = plan.total || 0
              const debt = total - paid
              const doneItems = (plan.items || []).filter(i => i.status === 'done').length
              const totalItems = (plan.items || []).length
              return (
                <div key={plan.id}
                  className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded-xl cursor-pointer transition"
                  onClick={() => navigate(`/patients/${plan.patientId}/estimate/${plan.id}`)}>
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {patient?.fullName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {plan.name || patient?.fullName || '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {totalItems} процедур
                      {doneItems > 0 && ` · ${doneItems} выполнено`}
                      · {fmtDate(plan.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{fmtMoney(total)}</p>
                    {paid > 0 && <p className="text-xs text-green-600">+{fmtMoney(paid)}</p>}
                    {debt > 0 && paid > 0 && <p className="text-xs text-red-400">−{fmtMoney(debt)}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '👤', label: 'Новый пациент',      sub: 'Добавить в базу',       to: '/patients/new' },
          { icon: '📋', label: 'Прайс-лист',          sub: 'Услуги и цены',         to: '/price-list'   },
          { icon: '⚙️',  label: 'Настройки',           sub: 'Клиника и интеграции', to: '/settings'     },
        ].map(a => (
          <button key={a.to} onClick={() => navigate(a.to)}
            className="card text-left hover:shadow-md transition-shadow cursor-pointer group">
            <span className="text-2xl mb-2 block">{a.icon}</span>
            <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{a.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{a.sub}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
