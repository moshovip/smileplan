import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { generateRoadmapHtml } from '../../services/groq'
import { normalizeItem, scopeLabel } from '../../data/toothScopes'

export default function RoadmapModal({ patient, patPlans = [], onClose }) {
  const settings    = useStore(s => s.settings)
  const addRoadmap  = useStore(s => s.addRoadmap)
  const roadmaps    = useStore(s => s.roadmaps)
  const removeRoadmap = useStore(s => s.removeRoadmap)

  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | generating | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [htmlResult, setHtmlResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [selectedPlans, setSelectedPlans] = useState(new Set(patPlans.map(p => p.id)))
  const recogRef = useRef(null)

  const patRoadmaps = roadmaps.filter(r => r.patientId === patient.id).sort((a,b) => b.createdAt - a.createdAt)

  const togglePlan = (planId) => setSelectedPlans(s => {
    const n = new Set(s)
    n.has(planId) ? n.delete(planId) : n.add(planId)
    return n
  })

  // Web Speech API
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Голосовой ввод не поддерживается в этом браузере. Используйте Chrome.'); return }
    const recog = new SR()
    recog.lang = 'ru-RU'
    recog.continuous = true
    recog.interimResults = true
    recog.onresult = e => {
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
      }
      if (final) setText(t => t + final)
    }
    recog.onerror = () => setStatus('idle')
    recog.onend = () => setStatus('idle')
    recogRef.current = recog
    recog.start()
    setStatus('listening')
  }

  const stopListening = () => {
    recogRef.current?.stop()
    setStatus('idle')
  }

  useEffect(() => () => recogRef.current?.stop(), [])

  const handleGenerate = async () => {
    if (!text.trim()) return
    setStatus('generating')
    setErrorMsg('')
    try {
      const apiKey = settings.groqApiKey
      // Build context from selected plans
      const planContext = patPlans
        .filter(p => selectedPlans.has(p.id))
        .map(p => {
          const items = (p.items || []).map(it => {
            const n = normalizeItem(it)
            return `    • ${scopeLabel(n.scope, n.toothIds, n.scopeKey)}: ${n.serviceName} — ${n.price?.toLocaleString('ru-RU')} р.`
          }).join('\n')
          return `Смета от ${new Date(p.createdAt).toLocaleDateString('ru-RU')}:\n${items}`
        }).join('\n\n')
      const fullContext = planContext ? `Планы лечения пациента:\n${planContext}\n\nДополнительная диктовка врача:\n${text}` : text
      const html = await generateRoadmapHtml(apiKey, patient.fullName, fullContext)
      setHtmlResult(html)
      // Save to store
      const rm = await addRoadmap({
        patientId: patient.id,
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        voiceText: text,
        htmlContent: html,
      })
      setSavedId(rm.id)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e.message)
      setStatus('error')
    }
  }

  const openHtml = (html) => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const downloadHtml = (html, name) => {
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Дорожная_карта_${name.replace(/\s/g,'_')}.html`
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Дорожная карта</h2>
            <p className="text-sm text-slate-500">{patient.fullName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Plan selector */}
          {patPlans.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Включить в карту сметы:</p>
              <div className="space-y-1.5">
                {patPlans.map(plan => {
                  const checked = selectedPlans.has(plan.id)
                  const total = (plan.items || []).reduce((s, i) => s + (i.price || 0), 0)
                  return (
                    <label key={plan.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition ${checked ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-brand-600"
                        checked={checked} onChange={() => togglePlan(plan.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{new Date(plan.createdAt).toLocaleDateString('ru-RU')} — {plan.items?.length || 0} позиций</p>
                        {plan.note && <p className="text-xs text-slate-400 truncate">{plan.note}</p>}
                      </div>
                      <span className="text-sm font-semibold text-green-700 shrink-0">{total.toLocaleString('ru-RU')} р.</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Voice input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Диктовка / текст</label>
              <div className="flex gap-2">
                {status === 'listening' ? (
                  <button onClick={stopListening}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"/>
                    Остановить
                  </button>
                ) : (
                  <button onClick={startListening} disabled={status === 'generating'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40">
                    🎙 Диктовать
                  </button>
                )}
                <button onClick={() => setText('')} className="text-xs text-slate-400 hover:text-slate-600 px-2">Очистить</button>
              </div>
            </div>

            {status === 'listening' && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2 bg-red-50 px-3 py-2 rounded-lg">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                Слушаю... говорите описание этапов лечения
              </div>
            )}

            <textarea
              className="input h-40 resize-none font-mono text-sm"
              placeholder={'Опишите план лечения — этапы, что будет делаться, в каком порядке.\n\nПример: "Пациенту Иванову планируем имплантацию 36 позиции. Первый этап — удаление корней зуба 36, костная аугментация Bio-Oss. Второй этап через 4 месяца — установка импланта AnyRidge 4.5x10. Третий этап через 3 месяца — установка абатмента и коронки из диоксида циркония."'}
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={status === 'generating'}
            />
          </div>

          {!settings.groqApiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              ⚠️ Для генерации нужен Groq API ключ. Добавьте его в{' '}
              <button onClick={onClose} className="underline font-medium">Настройках → Groq API Key</button>.
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              Ошибка: {errorMsg}
            </div>
          )}

          {status === 'done' && htmlResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-green-800 mb-3">Дорожная карта готова!</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => openHtml(htmlResult)}
                  className="btn-primary text-sm">
                  Открыть в браузере
                </button>
                <button onClick={() => downloadHtml(htmlResult, patient.fullName)}
                  className="btn-secondary text-sm">
                  Скачать HTML
                </button>
              </div>
            </div>
          )}

          {/* История карт пациента */}
          {patRoadmaps.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-700 text-sm mb-2">Ранее созданные карты</h3>
              <div className="space-y-2">
                {patRoadmaps.map(rm => (
                  <div key={rm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group">
                    <div className="text-xl">🗺</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{rm.title}</p>
                      <p className="text-xs text-slate-400">{new Date(rm.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openHtml(rm.htmlContent)}
                        className="btn-secondary text-xs py-1 px-2">Открыть</button>
                      <button onClick={() => downloadHtml(rm.htmlContent, patient.fullName)}
                        className="btn-secondary text-xs py-1 px-2">Скачать</button>
                      <button onClick={() => removeRoadmap(rm.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs px-1">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || status === 'generating' || status === 'listening'}
            className="btn-primary flex-1 disabled:opacity-40">
            {status === 'generating' ? '⏳ Генерация дорожной карты...' : 'Сгенерировать дорожную карту'}
          </button>
          <button onClick={onClose} className="btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  )
}
