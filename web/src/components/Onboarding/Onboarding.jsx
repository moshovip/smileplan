import React, { useState } from 'react'
import { useStore } from '../../stores/useStore'

const STEPS = [
  { id: 'welcome',  title: 'Добро пожаловать в SmilePlan!', subtitle: 'Смета за минуту — пациент всё понимает' },
  { id: 'profile',  title: 'Расскажите о себе', subtitle: 'Эти данные появятся в сметах' },
  { id: 'template', title: 'Шаблоны текста', subtitle: 'Вступление и заключение сметы (можно изменить позже)' },
  { id: 'done',     title: 'Всё готово! 🎉', subtitle: 'Прайс-лист уже загружен. Можете добавить первого пациента.' },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const updateSettings = useStore(s => s.updateSettings)

  const [form, setForm] = useState({
    doctorName: '',
    clinicName: '',
    phone: '',
    textBefore: 'Уважаемый пациент! Мы составили для Вас индивидуальный план лечения. Все процедуры подобраны специально для Вас.',
    textAfter:  'Благодарим за доверие к нашей клинике. Ждём Вас на приём!\nЗапись по телефону: ',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFinish = async () => {
    await updateSettings({ ...form, onboardingDone: true })
    onDone()
  }

  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-brand-600' : i < step ? 'w-2 bg-brand-300' : 'w-2 bg-slate-200'}`}/>
          ))}
        </div>

        <div className="text-center mb-8">
          {step === 0 && <div className="text-6xl mb-4">🦷</div>}
          {step === 3 && <div className="text-6xl mb-4">✅</div>}
          <h1 className="text-2xl font-bold text-slate-900">{current.title}</h1>
          <p className="text-slate-500 mt-1">{current.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Имя врача</label>
              <input className="input" placeholder="Иванов Иван Иванович"
                value={form.doctorName} onChange={e => set('doctorName', e.target.value)} />
            </div>
            <div>
              <label className="label">Название клиники</label>
              <input className="input" placeholder="СтомаЛюкс"
                value={form.clinicName} onChange={e => set('clinicName', e.target.value)} />
            </div>
            <div>
              <label className="label">Телефон клиники</label>
              <input className="input" placeholder="+7 (999) 123-45-67" type="tel"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Текст до таблицы (вступление)</label>
              <textarea className="input h-24 resize-none" value={form.textBefore}
                onChange={e => set('textBefore', e.target.value)} />
            </div>
            <div>
              <label className="label">Текст после таблицы (заключение)</label>
              <textarea className="input h-24 resize-none" value={form.textAfter}
                onChange={e => set('textAfter', e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <span>✅</span><span className="text-sm text-green-700">Прайс-лист загружен (30+ процедур)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
              <span>🆓</span><span className="text-sm text-brand-700">Free: до 5 пациентов бесплатно</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && step < 3 && (
            <button className="btn-secondary flex-1" onClick={() => setStep(s => s - 1)}>
              Назад
            </button>
          )}
          {step < 3 ? (
            <button className="btn-primary flex-1" onClick={() => setStep(s => s + 1)}>
              {step === 0 ? 'Начать' : 'Далее →'}
            </button>
          ) : (
            <button className="btn-primary flex-1 text-base py-3" onClick={handleFinish}>
              Открыть приложение 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
