import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import ToothMap from '../components/ToothMap/ToothMap'
import { generatePDF } from '../services/pdf'
import { downloadEstimateHtml } from '../services/estimateHtml'
import VoicePlanModal from '../components/VoicePlan/VoicePlanModal'
import { SCOPES, SEXTANTS, QUADRANTS, JAWS, teethOfScope, scopeLabel, scopeLabelShort,
         normalizeItem, primaryToothId } from '../data/toothScopes'
import { guessSymbol } from '../data/procedureSymbols'

const ITEM_STATUSES = [
  { value: 'planned',     label: 'Запланирован', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'in_progress', label: 'В процессе',   color: '#f59e0b', bg: '#fffbeb' },
  { value: 'done',        label: 'Выполнено',    color: '#10b981', bg: '#f0fdf4' },
]

// Области, для которых нужно ещё выбрать конкретный сегмент
const KEYED_SCOPES = { sextant: SEXTANTS, quadrant: QUADRANTS, jaw: JAWS }

function ProcedureModal({ initialScope, initialToothIds, priceItems, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все')
  const [scope, setScope] = useState(initialScope)
  const [scopeKey, setScopeKey] = useState(null)
  const [toothIds, setToothIds] = useState(initialToothIds || [])
  // Пока врач не трогал табы, область может подставиться из прайса (defaultScope)
  const [scopeTouched, setScopeTouched] = useState(false)

  const categories = ['Все', ...new Set(priceItems.filter(i => i.isActive).map(i => i.category))]
  const filtered = priceItems
    .filter(i => i.isActive)
    .filter(i => category === 'Все' || i.category === category)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const pickScope = (v) => {
    setScopeTouched(true)
    setScope(v)
    setScopeKey(null)
    if (v === 'mouth') setToothIds([])
    if (v === 'tooth' && toothIds.length > 1) setToothIds(toothIds.slice(0, 1))
  }

  const pickKey = (key) => {
    setScopeKey(key)
    setToothIds(teethOfScope(scope, key))
  }

  // Можно ли добавить процедуру с текущей областью
  const ready =
    scope === 'mouth' ? true
    : scope === 'tooth' ? toothIds.length === 1
    : scope === 'teeth' ? toothIds.length > 0
    : Boolean(scopeKey)

  const handlePick = (service) => {
    const def = service.defaultScope
    // Область по умолчанию из прайса — только если врач не выбрал её сам
    if (!scopeTouched && def && def !== scope) {
      if (def === 'mouth') {
        onAdd(service, 'mouth', [], null)
        return
      }
      if (KEYED_SCOPES[def]) {
        // Сегмент ещё надо выбрать — переключаем таб и ждём
        setScope(def); setScopeKey(null); setToothIds([]); setScopeTouched(true)
        return
      }
    }
    if (!ready) return
    onAdd(service, scope, toothIds, scopeKey)
  }

  const title = scope === 'mouth'
    ? 'Полость рта — процедура'
    : `${scopeLabel(scope, toothIds, scopeKey)} — процедура`

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg truncate pr-2">{title}</h2>
            <button className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center shrink-0" onClick={onClose}>✕</button>
          </div>

          {/* Область применения */}
          <div className="flex gap-1 flex-wrap mb-3">
            {SCOPES.map(s => (
              <button key={s.value}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${scope === s.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => pickScope(s.value)}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Выбор сегмента / челюсти */}
          {KEYED_SCOPES[scope] && (
            <div className="flex gap-1 flex-wrap mb-3">
              {Object.entries(KEYED_SCOPES[scope]).map(([key, def]) => (
                <button key={key}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${scopeKey === key ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => pickKey(key)}>
                  {def.label}
                </button>
              ))}
            </div>
          )}

          {/* Выбор зубов на карте */}
          {(scope === 'tooth' || scope === 'teeth') && (
            <div className="mb-3">
              <ToothMap compact
                selection={toothIds}
                onSelectionChange={next => {
                  setToothIds(scope === 'tooth' ? next.slice(-1) : next)
                }} />
              <p className="text-[11px] text-slate-400 mt-1">
                {toothIds.length === 0
                  ? (scope === 'tooth' ? 'Выберите зуб на карте' : 'Отметьте зубы на карте')
                  : `Выбрано: ${toothIds.join(', ')}`}
              </p>
            </div>
          )}

          <input className="input" placeholder="Поиск процедуры..." value={search}
            onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="flex gap-1 mt-2 flex-wrap">
            {categories.map(c => (
              <button key={c}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${category === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-3">
          {!ready && (
            <p className="text-center text-xs text-amber-700 bg-amber-50 rounded-lg py-2 mb-2">
              Сначала выберите {scope === 'teeth' ? 'зубы' : scope === 'tooth' ? 'зуб' : 'область'}
            </p>
          )}
          {filtered.map(item => (
            <button key={item.id} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 transition text-left disabled:opacity-40"
              disabled={!ready && !(!scopeTouched && item.defaultScope)}
              onClick={() => handlePick(item)}>
              <span className="text-xl">{item.icon || '🦷'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-400">
                  {item.category}
                  {item.defaultScope && item.defaultScope !== 'tooth' && (
                    <span className="ml-1 text-slate-300">· {SCOPES.find(s => s.value === item.defaultScope)?.short}</span>
                  )}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-700">{item.price.toLocaleString('ru-RU')} ₽</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-400 py-6">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, onChange }) {
  const s = ITEM_STATUSES.find(x => x.value === status) || ITEM_STATUSES[0]
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: s.bg, color: s.color }}>
        {s.label}
      </button>
      {open && (
        <div className="absolute right-0 top-6 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-32">
          {ITEM_STATUSES.map(st => (
            <button key={st.value}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50"
              style={{ color: st.color }}
              onClick={e => { e.stopPropagation(); onChange(st.value); setOpen(false) }}>
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EstimateRow({ index, item, onRemove, onStatusChange }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 group">
      <td className="px-2 py-2.5 text-sm text-slate-400 w-6">{index}</td>
      <td className="px-2 py-2.5">
        <span className="font-mono text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg whitespace-nowrap"
          title={scopeLabel(item.scope, item.toothIds, item.scopeKey)}>
          {scopeLabelShort(item.scope, item.toothIds, item.scopeKey)}
        </span>
      </td>
      <td className="px-2 py-2.5 text-sm">
        <span className="mr-1">{item.icon}</span>{item.serviceName}
      </td>
      <td className="px-2 py-2.5 text-sm font-semibold text-right text-slate-700 whitespace-nowrap">
        {item.price.toLocaleString('ru-RU')} ₽
      </td>
      <td className="px-2 py-2.5">
        <StatusBadge status={item.status || 'planned'} onChange={v => onStatusChange(item._key, v)} />
      </td>
      <td className="px-1 py-2.5 w-8">
        <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition p-1"
          onClick={() => onRemove(item._key)}>✕</button>
      </td>
    </tr>
  )
}

export default function EstimatePage() {
  const { id: patientId, estimateId } = useParams()
  const navigate = useNavigate()
  const patients  = useStore(s => s.patients)
  const plans     = useStore(s => s.plans)
  const priceItems = useStore(s => s.priceItems)
  const settings  = useStore(s => s.settings)
  const addPlan   = useStore(s => s.addPlan)
  const updatePlan = useStore(s => s.updatePlan)

  const isNew = estimateId === 'new'
  const patient = patients.find(p => p.id === patientId)
  const existingPlan = !isNew ? plans.find(p => p.id === estimateId) : null

  const [items, setItems]     = useState([])
  const [note, setNote]       = useState('')
  const [planName, setPlanName] = useState('')
  const [paidInput, setPaidInput] = useState('')
  const [modalScope, setModalScope] = useState(null) // null | { scope, toothIds }
  const [saving, setSaving]   = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [savedPlanId, setSavedPlanId] = useState(null)
  const [showVoice, setShowVoice] = useState(false)

  useEffect(() => {
    if (existingPlan) {
      setItems((existingPlan.items || []).map((it, i) => ({
        ...normalizeItem(it), _key: `${it.toothId}_${i}_${Date.now()}`,
      })))
      setNote(existingPlan.note || '')
      setPlanName(existingPlan.name || '')
      setPaidInput(existingPlan.paid != null ? String(existingPlan.paid) : '')
      setSaved(true)
      setSavedPlanId(existingPlan.id)
    }
  }, [existingPlan?.id])

  if (!patient) return <div className="p-8 text-slate-500">Пациент не найден</div>

  const total = items.reduce((s, i) => s + i.price, 0)
  const doneCount = items.filter(i => i.status === 'done').length
  // Процедуры без привязки к зубам — на карте их не видно
  const generalItems = items.filter(i => !(i.toothIds?.length))

  const addItem = (service, scope, toothIds, scopeKey) => {
    setItems(prev => [...prev, {
      _key: `${scope}_${service.id}_${Date.now()}`,
      scope, scopeKey: scopeKey || null,
      toothIds: (toothIds || []).map(Number),
      toothId: primaryToothId(toothIds),   // для обратной совместимости
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      icon: service.icon || '🦷',
      symbol: service.symbol || guessSymbol(service.name),
      symbolColor: service.symbolColor || null,
      status: 'planned',
    }])
    setModalScope(null)
    setSaved(false)
  }

  const addVoiceItems = (voiceItems) => {
    const newItems = voiceItems.map(it => {
      const scope = it.scope || (it.toothId ? 'tooth' : 'mouth')
      const toothIds = it.toothIds?.length ? it.toothIds.map(Number)
        : (it.toothId ? [Number(it.toothId)] : [])
      return {
        _key: `voice_${it.toothId || 0}_${Date.now()}_${Math.random()}`,
        scope, scopeKey: it.scopeKey || null, toothIds,
        toothId: primaryToothId(toothIds),
        serviceId: it.serviceId || null,
        serviceName: it.serviceName,
        price: it.price || 0,
        icon: it.icon || '🦷',
        status: 'planned',
      }
    })
    setItems(prev => [...prev, ...newItems])
    setSaved(false)
  }

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i._key !== key))
    setSaved(false)
  }

  const changeItemStatus = (key, status) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, status } : i))
    setSaved(false)
  }

  const handleSave = async () => {
    if (items.length === 0) return
    setSaving(true)
    const planItems = items.map(({ _key, ...rest }) => rest)
    const paid = paidInput !== '' ? Number(paidInput) : undefined
    const name = planName.trim() || undefined
    if (savedPlanId) {
      await updatePlan(savedPlanId, { items: planItems, note, name, ...(paid !== undefined && { paid }) })
    } else {
      const plan = await addPlan(patientId, planItems, note)
      await updatePlan(plan.id, { ...(paid !== undefined && { paid }), ...(name && { name }) })
      setSavedPlanId(plan.id)
    }
    setSaved(true)
    setSaving(false)
  }

  const handleDownloadPDF = async () => {
    if (items.length === 0) return
    setPdfLoading(true)
    try {
      const planItems = items.map(({ _key, ...rest }) => rest)
      await generatePDF({ patient, items: planItems, total, settings })
    } catch (e) {
      console.error('PDF error:', e)
      alert('Ошибка генерации PDF: ' + e.message)
    }
    setPdfLoading(false)
  }

  const handleDownloadHTML = () => {
    if (items.length === 0) return
    downloadEstimateHtml({
      patient,
      items: items.map(({ _key, ...rest }) => rest),
      total, settings, planName, paid: paidInput,
    })
  }

  const buildPlanText = () => [
    `📋 *${planName || 'Смета'} — ${patient.fullName}*`,
    `Врач: ${settings.doctorName || '—'}  |  Дата: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    ...items.map((it, i) => `${i+1}. ${scopeLabel(it.scope, it.toothIds, it.scopeKey)}: ${it.serviceName} — ${it.price.toLocaleString('ru-RU')} ₽`),
    '',
    `💰 *Итого: ${total.toLocaleString('ru-RU')} ₽*`,
    settings.textAfter ? `\n${settings.textAfter}` : '',
  ].filter(Boolean).join('\n')

  const handleTelegram = async () => {
    const text = buildPlanText()
    const botToken = settings.telegramBotToken
    const chatId   = settings.telegramChatId
    if (botToken && chatId) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        })
        const data = await res.json()
        if (data.ok) alert('Смета отправлена в Telegram!')
        else throw new Error(data.description)
      } catch (e) {
        alert('Ошибка: ' + e.message)
      }
    } else {
      window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const progressPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header — top action bar */}
      <div className="card p-3 flex items-center gap-3 flex-wrap sticky top-14 z-10 bg-white/95 backdrop-blur">
        <button className="btn-secondary text-sm" onClick={() => navigate(`/patients/${patientId}`)}>← Назад</button>
        <div className="flex-1 min-w-0">
          <input
            className="text-lg font-bold text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-300"
            placeholder={isNew ? 'Название сметы...' : 'Название сметы...'}
            value={planName}
            onChange={e => { setPlanName(e.target.value); setSaved(false) }}
          />
          <p className="text-xs text-slate-400">{patient.fullName} · {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary text-sm" onClick={() => setShowVoice(true)}>🎙 Голос</button>
          {saved && items.length > 0 && (
            <>
              <button className="btn-secondary text-sm" onClick={handleTelegram}>Telegram</button>
              <button className="btn-secondary text-sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
                {pdfLoading ? '⏳' : 'PDF'}
              </button>
              <button className="btn-secondary text-sm" onClick={handleDownloadHTML}>HTML</button>
            </>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving || items.length === 0}>
            {saving ? '⏳' : saved ? '✅ Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tooth map */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-3">Карта зубов</h2>
          <ToothMap planItems={items}
            onToothClick={fdi => setModalScope({ scope: 'tooth', toothIds: [fdi] })} />

          {/* Процедуры, не привязанные к конкретным зубам */}
          {generalItems.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Общие процедуры</p>
              <div className="space-y-1">
                {generalItems.map(it => (
                  <div key={it._key} className="flex items-center gap-2 text-sm">
                    <span>{it.icon}</span>
                    <span className="flex-1 truncate text-slate-700">{it.serviceName}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {scopeLabel(it.scope, it.toothIds, it.scopeKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Procedures table */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Процедуры</h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <span className="text-xs text-slate-400">{doneCount}/{items.length} выполнено</span>
              )}
              <button className="btn-secondary text-xs py-1 px-2.5"
                onClick={() => setModalScope({ scope: 'mouth', toothIds: [] })}>
                + Процедура
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {items.length > 0 && (
            <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: progressPct + '%' }} />
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
              <div className="text-4xl mb-2">👈</div>
              <p className="text-sm">Нажмите на зуб или «+ Процедура»</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Область</th>
                    <th className="px-2 py-2 text-left">Процедура</th>
                    <th className="px-2 py-2 text-right">Цена</th>
                    <th className="px-2 py-2 text-left">Статус</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <EstimateRow key={item._key} index={i + 1} item={item}
                      onRemove={removeItem}
                      onStatusChange={changeItemStatus} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total + Paid */}
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Итого:</span>
              <span className="text-2xl font-bold text-slate-800">{total.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Оплачено:</span>
              <div className="flex items-center gap-1">
                <input type="number" min="0" step="100"
                  className="w-32 px-2 py-1 text-sm font-semibold text-right rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="0"
                  value={paidInput}
                  onChange={e => { setPaidInput(e.target.value); setSaved(false) }} />
                <span className="text-sm text-slate-500">₽</span>
              </div>
            </div>
            {paidInput !== '' && Number(paidInput) < total && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Долг:</span>
                <span className="font-semibold text-red-500">{(total - Number(paidInput)).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            {paidInput !== '' && Number(paidInput) >= total && total > 0 && (
              <div className="text-center text-xs font-semibold text-green-600 bg-green-50 rounded-lg py-1.5">✅ Полностью оплачено</div>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="card">
        <label className="label">Примечание (не в PDF)</label>
        <textarea className="input h-20 resize-none" placeholder="Внутренние заметки врача..."
          value={note} onChange={e => { setNote(e.target.value); setSaved(false) }} />
      </div>

      {/* Bottom save bar (mobile) */}
      <div className="flex gap-2 sm:hidden">
        <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || items.length === 0}>
          {saving ? '⏳' : saved ? '✅ Сохранено' : '💾 Сохранить'}
        </button>
        {saved && items.length > 0 && (
          <>
            <button className="btn-secondary" onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? '⏳' : 'PDF'}
            </button>
            <button className="btn-secondary" onClick={handleDownloadHTML}>HTML</button>
          </>
        )}
      </div>

      {modalScope && (
        <ProcedureModal
          initialScope={modalScope.scope}
          initialToothIds={modalScope.toothIds}
          priceItems={priceItems}
          onAdd={addItem}
          onClose={() => setModalScope(null)} />
      )}
      {showVoice && (
        <VoicePlanModal priceItems={priceItems}
          onAdd={addVoiceItems}
          onClose={() => setShowVoice(false)} />
      )}
    </div>
  )
}
