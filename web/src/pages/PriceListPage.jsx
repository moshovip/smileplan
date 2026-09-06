import React, { useState } from 'react'
import { useStore } from '../stores/useStore'
import { v4 as uuidv4 } from 'uuid'
import { SCOPES } from '../data/toothScopes'
import { PROCEDURE_SYMBOLS, SYMBOL_COLORS, SYMBOL_BY_ID, symbolHex, guessSymbol } from '../data/procedureSymbols'
import SymbolPreview from '../components/ToothMap/SymbolPreview'

const CATEGORIES = ['Терапия', 'Хирургия', 'Ортопедия', 'Гигиена', 'Эстетика', 'Имплантация', 'Ортодонтия', 'Другое']

function ItemRow({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${item.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <span className="text-xl w-8 text-center shrink-0">{item.icon || '🦷'}</span>
      {(() => {
        const sid = item.symbol && item.symbol !== 'none' ? item.symbol : guessSymbol(item.name)
        return sid === 'none' ? <span className="w-5 shrink-0" />
          : <SymbolPreview id={sid} color={item.symbolColor || SYMBOL_BY_ID[sid]?.color}
              className="w-5 h-10 shrink-0" />
      })()}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900 truncate">{item.name}</p>
        <p className="text-xs text-slate-400">
          {item.category}
          {item.defaultScope && item.defaultScope !== 'tooth' && (
            <span className="ml-1.5 text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
              {SCOPES.find(s => s.value === item.defaultScope)?.short}
            </span>
          )}
        </p>
      </div>
      <span className="font-semibold text-slate-700 text-sm shrink-0">
        {item.price.toLocaleString('ru-RU')} ₽
      </span>
      <div className="flex gap-1 shrink-0">
        <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition" onClick={() => onEdit(item)}>✏️</button>
        <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" onClick={() => onToggle(item)}
          title={item.isActive ? 'Скрыть' : 'Показать'}>
          {item.isActive ? '👁️' : '🙈'}
        </button>
        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" onClick={() => onDelete(item.id)}>🗑</button>
      </div>
    </div>
  )
}

function ItemModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     initial?.name     || '',
    category: initial?.category || CATEGORIES[0],
    price:    initial?.price    || '',
    icon:     initial?.icon     || '🦷',
    defaultScope: initial?.defaultScope || 'tooth',
    symbol:       initial?.symbol       || guessSymbol(initial?.name || ''),
    symbolColor:  initial?.symbolColor  || null,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-bold text-lg mb-5">{initial ? 'Изменить услугу' : 'Новая услуга'}</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Название услуги</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Пломба световая" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Категория</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Цена (₽)</label>
              <input className="input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="3500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Иконка (emoji)</label>
              <input className="input text-2xl" value={form.icon} onChange={e => set('icon', e.target.value)} maxLength={2} />
            </div>
            <div>
              <label className="label">Область по умолчанию</label>
              <select className="input" value={form.defaultScope} onChange={e => set('defaultScope', e.target.value)}>
                {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Символ на зубе</label>
            <div className="flex gap-1.5 flex-wrap">
              {PROCEDURE_SYMBOLS.map(s => (
                <button key={s.id} title={s.label}
                  className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border-2 transition ${form.symbol === s.id ? 'border-brand-500 bg-brand-50' : 'border-transparent hover:bg-slate-50'}`}
                  onClick={() => set('symbol', s.id)}>
                  {s.id === 'none'
                    ? <span className="w-6 h-12 flex items-center justify-center text-slate-300 text-lg">—</span>
                    : <SymbolPreview id={s.id} color={form.symbolColor || s.color} />}
                  <span className="text-[9px] text-slate-500 leading-none">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          {form.symbol && form.symbol !== 'none' && (
            <div>
              <label className="label">Цвет символа</label>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  className={`px-2 py-1 rounded-lg text-xs border ${!form.symbolColor ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}
                  onClick={() => set('symbolColor', null)}>
                  По умолчанию
                </button>
                {SYMBOL_COLORS.map(c => (
                  <button key={c.value}
                    className={`w-7 h-7 rounded-full border-2 transition ${form.symbolColor === c.value ? 'border-slate-800 scale-110' : 'border-white'}`}
                    style={{ background: c.hex }}
                    title={c.value}
                    onClick={() => set('symbolColor', c.value)} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1"
            onClick={() => form.name && onSave({ ...form, price: Number(form.price) || 0 })}>
            💾 Сохранить
          </button>
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default function PriceListPage() {
  const priceItems = useStore(s => s.priceItems)
  const addPriceItem = useStore(s => s.addPriceItem)
  const updatePriceItem = useStore(s => s.updatePriceItem)
  const removePriceItem = useStore(s => s.removePriceItem)

  const [modal, setModal] = useState(null) // null | { item? }
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Все')
  const [showInactive, setShowInactive] = useState(false)

  const usedCategories = ['Все', ...new Set(priceItems.map(i => i.category))]

  const filtered = priceItems
    .filter(i => showInactive ? true : i.isActive)
    .filter(i => activeCategory === 'Все' || i.category === activeCategory)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const grouped = {}
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  const handleSave = async (data) => {
    if (modal.item) {
      await updatePriceItem(modal.item.id, data)
    } else {
      await addPriceItem(data)
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Прайс-лист</h1>
          <p className="text-slate-500 text-sm">{priceItems.filter(i => i.isActive).length} активных услуг</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>+ Добавить услугу</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input className="input w-64" placeholder="🔍 Поиск услуги..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-1 flex-wrap">
          {usedCategories.map(cat => (
            <button key={cat}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <button className={`btn-secondary text-xs ${showInactive ? 'border-amber-400 text-amber-700' : ''}`}
          onClick={() => setShowInactive(v => !v)}>
          {showInactive ? 'Скрыть неактивные' : 'Показать все'}
        </button>
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="card">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            {category}
            <span className="badge bg-slate-100 text-slate-500">{items.length}</span>
          </h3>
          <div className="space-y-2">
            {items.map(item => (
              <ItemRow key={item.id} item={item}
                onEdit={item => setModal({ item })}
                onDelete={removePriceItem}
                onToggle={item => updatePriceItem(item.id, { isActive: !item.isActive })} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="card text-center py-12 text-slate-400">
          <div className="text-4xl mb-2">📋</div>
          <p>Услуги не найдены</p>
        </div>
      )}

      {modal && <ItemModal initial={modal.item} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  )
}
