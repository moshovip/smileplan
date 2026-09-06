import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'

export default function SettingsPage() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'profile')

  const [form, setForm] = useState({
    doctorName:       '',
    clinicName:       '',
    phone:            '',
    textBefore:       '',
    textAfter:        '',
    groqApiKey:       '',
    telegramBotToken: '',
    telegramChatId:   '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      doctorName:       settings.doctorName       || '',
      clinicName:       settings.clinicName       || '',
      phone:            settings.phone            || '',
      textBefore:       settings.textBefore       || '',
      textAfter:        settings.textAfter        || '',
      groqApiKey:       settings.groqApiKey       || '',
      telegramBotToken: settings.telegramBotToken || '',
      telegramChatId:   settings.telegramChatId   || '',
    })
  }, [settings])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const handleSave = async () => {
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'profile',   label: '👤 Профиль'  },
    { id: 'templates', label: '📝 Шаблоны'  },
    { id: 'ai',        label: '🤖 ИИ'        },
    { id: 'telegram',  label: '📱 Telegram'  },
  ]

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="card space-y-4">
          <div>
            <label className="label">Имя врача</label>
            <input className="input" value={form.doctorName} onChange={e => set('doctorName', e.target.value)} placeholder="Иванов Иван Иванович" />
          </div>
          <div>
            <label className="label">Название клиники</label>
            <input className="input" value={form.clinicName} onChange={e => set('clinicName', e.target.value)} placeholder="СтомаЛюкс" />
          </div>
          <div>
            <label className="label">Телефон клиники</label>
            <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (999) 123-45-67" />
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </button>
        </div>
      )}

      {/* Templates */}
      {tab === 'templates' && (
        <div className="card space-y-4">
          <div>
            <label className="label">Текст до таблицы (вступление)</label>
            <p className="text-xs text-slate-400 mb-2">Печатается в PDF перед перечнем процедур</p>
            <textarea className="input h-28 resize-none"
              value={form.textBefore} onChange={e => set('textBefore', e.target.value)}
              placeholder="Уважаемый пациент! Мы составили для Вас индивидуальный план лечения..." />
          </div>
          <div>
            <label className="label">Текст после таблицы (заключение)</label>
            <p className="text-xs text-slate-400 mb-2">Печатается в PDF после итоговой суммы</p>
            <textarea className="input h-28 resize-none"
              value={form.textAfter} onChange={e => set('textAfter', e.target.value)}
              placeholder="Благодарим за доверие. Ждём Вас на приём!..." />
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✅ Сохранено!' : '💾 Сохранить шаблоны'}
          </button>
        </div>
      )}

      {/* AI */}
      {tab === 'ai' && (
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Groq API — генерация дорожных карт</h3>
            <p className="text-sm text-slate-500 mb-3">
              Нужен для генерации дорожных карт лечения по голосовой диктовке. Бесплатный ключ: <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">console.groq.com</a>
            </p>
            <label className="label">Groq API Key</label>
            <input className="input font-mono text-xs" type="password"
              placeholder="gsk_..."
              value={form.groqApiKey}
              onChange={e => set('groqApiKey', e.target.value)} />
            {form.groqApiKey && <p className="text-xs text-green-600 mt-1">Ключ сохранён локально в браузере</p>}
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </button>
        </div>
      )}

      {/* Telegram */}
      {tab === 'telegram' && (
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">DentalBrain Bot — отправка смет</h3>
            <p className="text-sm text-slate-500 mb-3">
              Настройте отправку смет через бота. Когда нажмёте «Telegram» в смете — бот пришлёт её вам, и вы сможете переслать пациенту.
            </p>
          </div>
          <div>
            <label className="label">Токен бота (Bot Token)</label>
            <p className="text-xs text-slate-400 mb-1">Получить у @BotFather. Хранится только локально в браузере.</p>
            <input className="input font-mono text-xs" type="password"
              placeholder="1234567890:AAF..."
              value={form.telegramBotToken}
              onChange={e => set('telegramBotToken', e.target.value)} />
          </div>
          <div>
            <label className="label">Ваш Chat ID</label>
            <p className="text-xs text-slate-400 mb-1">Узнайте свой chat_id: напишите боту @userinfobot или отправьте /start вашему боту и скопируйте ID из ответа.</p>
            <input className="input font-mono" type="text"
              placeholder="123456789"
              value={form.telegramChatId}
              onChange={e => set('telegramChatId', e.target.value)} />
          </div>
          {form.telegramBotToken && form.telegramChatId && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              ✅ Настроено — кнопка «Telegram» в смете будет отправлять вам сообщение через бота
            </div>
          )}
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </button>
        </div>
      )}

      {/* Pro */}
      {tab === 'pro' && (
        <div className="space-y-4">
          {isPro ? (
            <div className="card border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">⭐</span>
                <div>
                  <h2 className="font-bold text-amber-900 text-lg">Pro активен</h2>
                  <p className="text-amber-700 text-sm">Все функции разблокированы</p>
                </div>
              </div>
              <div className="space-y-2">
                {['Безлимитное число пациентов', 'Карта зубов в PDF', 'Брендинг клиники в PDF', 'Приоритетная поддержка'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-amber-800">
                    <span>✅</span> {f}
                  </div>
                ))}
              </div>
              <button className="btn-secondary mt-4 text-sm"
                onClick={() => updateSettings({ isPro: false })}>
                Деактивировать Pro (тест)
              </button>
            </div>
          ) : (
            <>
              <div className="card">
                <h2 className="font-bold text-slate-900 text-lg mb-1">SmilePlan Pro</h2>
                <p className="text-slate-500 text-sm mb-5">Всё необходимое для профессиональной работы</p>
                <div className="space-y-2 mb-6">
                  {[
                    ['👥', 'Безлимитное число пациентов'],
                    ['🗺️', 'Карта зубов в PDF-смете'],
                    ['🏥', 'Брендинг клиники в PDF'],
                    ['📱', 'Отправка через WhatsApp и Telegram'],
                    ['⭐', 'Приоритетная поддержка'],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3 text-sm text-slate-700">
                      <span className="text-xl">{icon}</span> {text}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="border-2 border-brand-600 rounded-2xl p-4 text-center">
                    <p className="text-xs text-brand-600 font-semibold mb-1">МЕСЯЦ</p>
                    <p className="text-2xl font-bold">990 ₽</p>
                    <p className="text-xs text-slate-400">/ месяц</p>
                  </div>
                  <div className="border-2 border-green-500 rounded-2xl p-4 text-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 badge bg-green-500 text-white">-40%</div>
                    <p className="text-xs text-green-600 font-semibold mb-1">ГОД</p>
                    <p className="text-2xl font-bold">590 ₽</p>
                    <p className="text-xs text-slate-400">/ месяц</p>
                  </div>
                </div>
                {/* Demo unlock for development */}
                <button className="btn-primary w-full text-base py-3"
                  onClick={() => updateSettings({ isPro: true })}>
                  ⚡ Активировать Pro (демо)
                </button>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Stripe-оплата будет подключена при публикации
                </p>
              </div>

              <div className="card bg-slate-50 border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">Текущий тариф: Free</p>
                <div className="space-y-1 text-sm text-slate-500">
                  <p>✅ До 5 активных пациентов</p>
                  <p>✅ Прайс-лист без ограничений</p>
                  <p>✅ PDF-смета (без карты зубов)</p>
                  <p>🔒 Карта зубов в PDF — только Pro</p>
                  <p>🔒 Брендинг клиники — только Pro</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
