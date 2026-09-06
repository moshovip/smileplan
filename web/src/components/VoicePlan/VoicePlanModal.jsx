import React, { useState, useRef } from 'react'
import { matchProcedures } from '../../services/groq'
import { useStore } from '../../stores/useStore'
import { SCOPES } from '../../data/toothScopes'

// Хук для голосового ввода (работает на iOS Safari + Chrome)
function useVoice(onResult) {
  const ref = useRef(null)
  const [listening, setListening] = useState(false)

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Голосовой ввод не поддерживается этим браузером. Введите текст вручную.')
      return
    }
    const r = new SR()
    r.lang = 'ru-RU'
    // На iOS continuous=true не работает — используем single-shot с повторным запуском
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    r.continuous = !isIOS
    r.interimResults = !isIOS

    let final = ''
    r.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else if (!isIOS) final += e.results[i][0].transcript
      }
      if (final.trim()) { onResult(prev => prev + final); final = '' }
    }
    r.onerror = (e) => {
      if (e.error !== 'aborted') setListening(false)
    }
    r.onend = () => {
      // На iOS перезапускаем сами, пока listening=true
      if (ref.current?._active) {
        try { r.start() } catch (_) { setListening(false) }
      } else {
        setListening(false)
      }
    }
    ref.current = r
    ref.current._active = true
    r.start()
    setListening(true)
  }

  const stop = () => {
    if (ref.current) {
      ref.current._active = false
      ref.current.stop()
    }
    setListening(false)
  }

  return { listening, start, stop }
}

export default function VoicePlanModal({ priceItems, onAdd, onClose }) {
  const settings = useStore(s => s.settings)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('input') // input | matching | review | done
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')

  const { listening, start, stop } = useVoice(setText)

  const handleMatch = async () => {
    if (!text.trim()) return
    setStatus('matching'); setError('')
    try {
      const apiKey = settings.groqApiKey
      const items = await matchProcedures(apiKey, text, priceItems)
      setSuggestions(items)
      setStatus('review')
    } catch (e) {
      setError(e.message); setStatus('input')
    }
  }

  const toggle = (i) => {
    setSuggestions(s => s.map((it, idx) => idx === i ? { ...it, confirmed: !it.confirmed } : it))
  }

  const changeField = (i, field, val) => {
    setSuggestions(s => s.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }

  const changeScope = (i, scope) => {
    setSuggestions(s => s.map((it, idx) => {
      if (idx !== i) return it
      const toothIds = scope === 'mouth' ? []
        : scope === 'tooth' ? (it.toothIds || []).slice(0, 1)
        : (it.toothIds || [])
      return { ...it, scope, toothIds, toothId: toothIds[0] ?? null }
    }))
  }

  const changeTeeth = (i, raw) => {
    const toothIds = raw.split(/[^0-9]+/).map(Number)
      .filter(n => n >= 11 && n <= 48)
    setSuggestions(s => s.map((it, idx) =>
      idx === i ? { ...it, toothIds, toothId: toothIds[0] ?? null } : it))
  }

  const handleAdd = () => {
    const confirmed = suggestions.filter(s => s.confirmed)
    onAdd(confirmed)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-slate-900">🎙 Голосовой план лечения</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {status === 'input' && 'Продиктуйте или напечатайте что нужно сделать'}
              {status === 'matching' && 'AI подбирает позиции прайса...'}
              {status === 'review' && `Найдено ${suggestions.length} позиций — проверьте и подтвердите`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1: Input */}
          {(status === 'input' || status === 'matching') && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Диктовка или текст</span>
                  <div className="flex gap-2">
                    {listening
                      ? <button onClick={stop} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full inline-block"/> Остановить
                        </button>
                      : <button onClick={start} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700">
                          🎙 Диктовать
                        </button>
                    }
                    <button onClick={() => setText('')} className="text-xs text-slate-400 hover:text-red-400">Очистить</button>
                  </div>
                </div>
                {listening && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"/>
                    Слушаю... Говорите какие зубы и что нужно сделать
                  </div>
                )}
                <textarea
                  className="input h-36 resize-none text-sm"
                  placeholder={'Пример: "Зуб 36 — депульпирование, поставить коронку металлокерамика. Зуб 37 лечение кариеса. Зуб 46 удалить корни, затем имплант. 17 — снять коронку поставить новую из циркония"'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  disabled={status === 'matching'}
                />
              </div>

              {!settings.groqApiKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  ⚠️ Нужен Groq API ключ. Добавьте в Настройки → 🤖 ИИ
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </>
          )}

          {/* STEP 2: Review suggestions */}
          {status === 'review' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Снимите галочку с ненужных позиций. Можно изменить область, зубы или цену прямо здесь.
              </p>
              {suggestions.map((item, i) => (
                <div key={i}
                  className={`rounded-xl border-2 transition p-3 ${item.confirmed ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={item.confirmed} onChange={() => toggle(i)}
                      className="mt-1 w-4 h-4 accent-brand-600 cursor-pointer shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base">{item.icon || '🦷'}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.serviceName}</span>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Область:</span>
                          <select
                            value={item.scope || 'tooth'}
                            onChange={e => changeScope(i, e.target.value)}
                            className="border border-slate-300 rounded-lg px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-brand-400">
                            {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        {item.scope !== 'mouth' && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Зубы:</span>
                            <input type="text"
                              value={(item.toothIds || []).join(', ')}
                              onChange={e => changeTeeth(i, e.target.value)}
                              placeholder="36, 37"
                              className="w-24 border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-center focus:ring-1 focus:ring-brand-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Цена:</span>
                          <input type="number"
                            value={item.price || ''}
                            onChange={e => changeField(i, 'price', parseInt(e.target.value) || 0)}
                            className="w-20 border border-slate-300 rounded-lg px-2 py-0.5 text-xs focus:ring-1 focus:ring-brand-400" />
                          <span className="text-xs text-slate-500">₽</span>
                        </div>
                      </div>
                      {item.matchReason && (
                        <p className="text-xs text-slate-400 mt-1">💡 {item.matchReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Итого */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Выбрано: {suggestions.filter(s => s.confirmed).length} из {suggestions.length}
                </span>
                <span className="font-bold text-green-700">
                  {suggestions.filter(s => s.confirmed).reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {/* Добавить ещё */}
              <button onClick={() => setStatus('input')}
                className="text-sm text-brand-600 hover:underline">
                ← Добавить ещё / изменить текст
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t">
          {status === 'input' && (
            <>
              <button onClick={handleMatch}
                disabled={!text.trim() || status === 'matching' || !settings.groqApiKey}
                className="btn-primary flex-1 disabled:opacity-40">
                {status === 'matching' ? '⏳ AI подбирает позиции...' : '🔍 Подобрать по прайсу'}
              </button>
              <button onClick={onClose} className="btn-secondary">Отмена</button>
            </>
          )}
          {status === 'matching' && (
            <div className="flex-1 text-center text-sm text-slate-500 py-2">
              ⏳ AI анализирует диктовку и прайс-лист...
            </div>
          )}
          {status === 'review' && (
            <>
              <button onClick={handleAdd}
                disabled={!suggestions.some(s => s.confirmed)}
                className="btn-primary flex-1 disabled:opacity-40">
                ✅ Добавить в план ({suggestions.filter(s => s.confirmed).length} позиций)
              </button>
              <button onClick={onClose} className="btn-secondary">Отмена</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
