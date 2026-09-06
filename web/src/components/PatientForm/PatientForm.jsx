import React, { useState } from 'react'

const SOURCES = ['Instagram', 'ВКонтакте', 'Сарафан', 'Реклама', 'Другое']

export default function PatientForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    fullName:  initial.fullName  || '',
    phone:     initial.phone     || '',
    birthDate: initial.birthDate || '',
    gender:    initial.gender    || '',
    source:    initial.source    || '',
    allergies: initial.allergies || '',
    notes:     initial.notes     || '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Укажите имя пациента'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onSave({ ...form, fullName: form.fullName.trim(), phone: form.phone.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label">ФИО пациента *</label>
        <input className={`input ${errors.fullName ? 'border-red-400 ring-1 ring-red-300' : ''}`}
          placeholder="Иванова Мария Сергеевна"
          value={form.fullName} onChange={e => set('fullName', e.target.value)} autoFocus />
        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Телефон</label>
          <input className="input" placeholder="+7 (999) 123-45-67" type="tel"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <label className="label">Дата рождения</label>
          <input className="input" type="date"
            value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Пол</label>
          <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">— не указан —</option>
            <option value="female">Женский</option>
            <option value="male">Мужской</option>
          </select>
        </div>
        <div>
          <label className="label">Откуда узнал</label>
          <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
            <option value="">— не указан —</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">⚠️ Аллергии и важные заболевания</label>
        <input className="input border-amber-300 focus:ring-amber-400" placeholder="Аллергия на лидокаин, диабет II типа..."
          value={form.allergies} onChange={e => set('allergies', e.target.value)} />
      </div>

      <div>
        <label className="label">Примечания</label>
        <textarea className="input h-20 resize-none" placeholder="Дополнительные комментарии..."
          value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">
          {initial.id ? '💾 Сохранить' : '✅ Создать пациента'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  )
}
