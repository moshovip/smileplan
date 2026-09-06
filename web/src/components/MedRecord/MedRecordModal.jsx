import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../stores/useStore'

function VoiceBtn({ onText, field, active, setActive }) {
  const ref = useRef(null)
  const isMe = active === field

  const toggle = () => {
    if (isMe) { ref.current?.stop(); setActive(null); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Голосовой ввод работает только в Chrome'); return }
    const r = new SR(); r.lang = 'ru-RU'; r.continuous = true; r.interimResults = false
    r.onresult = e => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) t += e.results[i][0].transcript + ' '
      }
      if (t.trim()) onText(prev => prev + t)
    }
    r.onerror = () => setActive(null)
    r.onend = () => setActive(null)
    ref.current = r; r.start(); setActive(field)
  }

  return (
    <button type="button" onClick={toggle}
      className={`ml-2 text-xs px-2 py-0.5 rounded-lg border transition ${isMe
        ? 'bg-red-100 border-red-300 text-red-600 animate-pulse'
        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600'}`}
      title={isMe ? 'Остановить запись' : 'Диктовать голосом'}>
      {isMe ? '■ Стоп' : '🎙'}
    </button>
  )
}

const QUICK_DAYS = [3, 7, 10, 14, 21, 30]

export default function MedRecordModal({ patientId, initial = null, onClose }) {
  const addMedRecord    = useStore(s => s.addMedRecord)
  const updateMedRecord = useStore(s => s.updateMedRecord)
  const navigate        = useNavigate()
  const [saving, setSaving]       = useState(false)
  const [activeVoice, setActiveVoice] = useState(null)

  const [form, setForm] = useState({
    date:        initial?.date ? new Date(initial.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    complaints:  initial?.complaints  || '',
    examination: initial?.examination || '',
    diagnosis:   initial?.diagnosis   || '',
    treatment:   initial?.treatment   || '',
    nextVisit:   initial?.nextVisit   || '',
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }))

  const handleSave = async () => {
    setSaving(true)
    const data = { ...form, patientId, date: new Date(form.date).getTime() }
    if (initial?.id) await updateMedRecord(initial.id, data)
    else await addMedRecord(data)
    onClose()
  }

  const handleSaveAndBook = async (offsetDays) => {
    setSaving(true)
    const data = { ...form, patientId, date: new Date(form.date).getTime() }
    if (initial?.id) await updateMedRecord(initial.id, data)
    else await addMedRecord(data)
    const preDate = new Date()
    preDate.setDate(preDate.getDate() + offsetDays)
    onClose()
    navigate('/calendar', { state: { preDate: preDate.toISOString(), prePatientId: patientId } })
  }

  const fields = [
    { key: 'complaints',  label: 'Жалобы пациента',          rows: 3, ph: 'Боль в зубе 36, чувствительность при накусывании...' },
    { key: 'examination', label: 'Объективно (осмотр)',        rows: 3, ph: 'При осмотре: перкуссия болезненна, слизистая без патологий...' },
    { key: 'diagnosis',   label: 'Диагноз',                    rows: 1, ph: 'К04.1 Некроз пульпы (зуб 36)' },
    { key: 'treatment',   label: 'Проведено лечение',          rows: 4, ph: 'Депульпирование 36, инструментальная обработка каналов MB, DB, P до апекса...' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-lg text-slate-900">
            {initial ? 'Редактировать запись' : 'Новая запись в медкарте'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="label">Дата визита</label>
            <input type="date" className="input" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>

          {fields.map(f => (
            <div key={f.key}>
              <div className="flex items-center mb-1">
                <label className="label mb-0 flex-1">{f.label}</label>
                <VoiceBtn field={f.key} active={activeVoice} setActive={setActiveVoice}
                  onText={v => setField(f.key, v)} />
              </div>
              {f.rows === 1
                ? <input className={`input ${activeVoice === f.key ? 'ring-2 ring-red-300 border-red-300' : ''}`}
                    placeholder={f.ph} value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)} />
                : <textarea className={`input resize-none ${activeVoice === f.key ? 'ring-2 ring-red-300 border-red-300' : ''}`}
                    rows={f.rows} placeholder={f.ph} value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)} />
              }
              {activeVoice === f.key && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block"/>
                  Слушаю...
                </p>
              )}
            </div>
          ))}

          {/* Next visit field + quick-booking buttons */}
          <div>
            <div className="flex items-center mb-1">
              <label className="label mb-0 flex-1">Следующий визит / рекомендации</label>
              <VoiceBtn field="nextVisit" active={activeVoice} setActive={setActiveVoice}
                onText={v => setField('nextVisit', v)} />
            </div>
            <input className={`input ${activeVoice === 'nextVisit' ? 'ring-2 ring-red-300 border-red-300' : ''}`}
              placeholder="Через 7 дней: постоянная пломба"
              value={form.nextVisit}
              onChange={e => setField('nextVisit', e.target.value)} />
            {activeVoice === 'nextVisit' && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block"/>
                Слушаю...
              </p>
            )}
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1.5">Записать через:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DAYS.map(days => (
                  <button key={days} type="button"
                    onClick={() => handleSaveAndBook(days)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition font-medium">
                    {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? '⏳ Сохранение...' : '💾 Сохранить запись'}
          </button>
          <button onClick={onClose} className="btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  )
}
