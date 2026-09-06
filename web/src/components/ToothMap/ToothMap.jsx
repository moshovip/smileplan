import React, { useState } from 'react'
import { toothGeometry, getToothType, TOOTH_VIEWBOX } from '../../data/toothShapes'
import { itemSymbol, SYMBOL_BY_ID } from '../../data/procedureSymbols'
import ProcedureSymbol from './ProcedureSymbol'

// FDI notation quadrants
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]

const STATUS_DOT = {
  planned:     null,
  in_progress: '#f59e0b',
  done:        '#10b981',
}

// Анатомический контур зуба: коронка + корни, поверх — символы вмешательств
function ToothShape({ type, isUpper, selected, treated, items, itemStatuses, onClick }) {
  const geom = toothGeometry(type, isUpper)

  const fill = selected ? '#e0f2fe' : treated ? '#f0fdf4' : '#ffffff'
  const stroke = selected ? '#0284c7' : treated ? '#16a34a' : '#94a3b8'
  const sw = selected || treated ? 2.2 : 1.6

  const overallStatus = itemStatuses?.length && itemStatuses.every(s => s === 'done')
    ? 'done'
    : itemStatuses?.includes('in_progress') ? 'in_progress'
    : itemStatuses?.includes('done') ? 'in_progress'
    : null
  const dotColor = overallStatus ? STATUS_DOT[overallStatus] : null

  // Символы рисуем по одному на вид, чтобы две пломбы не легли друг на друга
  const symbols = []
  const seen = new Set()
  for (const it of items || []) {
    const sid = itemSymbol(it)
    if (sid === 'none' || seen.has(sid)) continue
    seen.add(sid)
    symbols.push({ id: sid, color: it.symbolColor || SYMBOL_BY_ID[sid]?.color })
  }

  return (
    <svg viewBox={TOOTH_VIEWBOX} className="w-full h-full overflow-visible" onClick={onClick}>
      <g>
        {geom.roots.map((d, i) => (
          <path key={i} d={d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        ))}
        <path d={geom.crown} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      </g>
      {symbols.map((s, i) => (
        <ProcedureSymbol key={i} id={s.id} color={s.color} geom={geom} isUpper={isUpper} />
      ))}
      {dotColor && (
        <circle cx={isUpper ? 34 : 34} cy={isUpper ? 78 : 12} r="6" fill={dotColor} stroke="white" strokeWidth="2" />
      )}
    </svg>
  )
}

function ToothCell({ fdi, isUpper, items = [], onSelect, showNumber, selected = false, compact = false }) {
  const type = getToothType(fdi)
  const treated = items.length > 0
  const itemStatuses = items.map(i => i.status || 'planned')

  const tooltipText = items.length > 0
    ? items.map(i => `${i.icon || '🦷'} ${i.serviceName}`).join('\n')
    : `Зуб ${fdi}`

  const size = compact ? 'w-5 h-11' : 'w-7 h-16'

  return (
    <div className="flex flex-col items-center gap-0.5 cursor-pointer group" onClick={() => onSelect(fdi)} title={tooltipText}>
      {isUpper && showNumber && (
        <span className={`text-[9px] font-mono leading-none ${selected ? 'text-sky-600 font-bold' : 'text-slate-400'}`}>{fdi}</span>
      )}
      <div className={`${size} transition-transform group-hover:scale-110 ${treated || selected ? 'drop-shadow-sm' : ''}`}>
        <ToothShape type={type} isUpper={isUpper} selected={selected} treated={treated}
          items={items} itemStatuses={itemStatuses}
          onClick={e => { e.stopPropagation(); onSelect(fdi) }} />
      </div>
      {!isUpper && showNumber && (
        <span className={`text-[9px] font-mono leading-none ${selected ? 'text-sky-600 font-bold' : 'text-slate-400'}`}>{fdi}</span>
      )}
    </div>
  )
}

export default function ToothMap({ planItems = [], onToothClick, readOnly = false, compact = false,
                                   selection = null, onSelectionChange = null }) {
  // Позиция может относиться к нескольким зубам (toothIds).
  // Старые позиции знают только toothId — поддерживаем оба варианта.
  const byTooth = {}
  for (const item of planItems) {
    const ids = item.toothIds?.length ? item.toothIds : (item.toothId ? [item.toothId] : [])
    for (const id of ids) {
      if (!byTooth[id]) byTooth[id] = []
      byTooth[id].push(item)
    }
  }

  // Режим мультивыбора: клик переключает зуб в наборе, а не открывает модалку
  const multiSelect = Array.isArray(selection) && typeof onSelectionChange === 'function'
  const selectedSet = new Set((selection || []).map(Number))

  const handleSelect = (fdi) => {
    if (readOnly) return
    if (multiSelect) {
      onSelectionChange(selectedSet.has(fdi)
        ? (selection || []).filter(t => Number(t) !== fdi)
        : [...(selection || []), fdi])
      return
    }
    if (onToothClick) onToothClick(fdi)
  }

  const gap = compact ? 'gap-0' : 'gap-px'
  // В режиме выбора номера нужны всегда, иначе не понять, что отмечаешь
  const showNum = !compact || multiSelect

  // Quadrant label
  const QLabel = ({ text }) => (
    <div className="text-[9px] text-slate-400 font-medium text-center leading-none py-0.5">{text}</div>
  )

  return (
    <div className={`bg-slate-50 rounded-2xl select-none ${compact ? 'p-2' : 'p-3'}`}>

      {/* Upper jaw: right + left */}
      <div className="flex">
        {/* Upper RIGHT (18→11) */}
        <div className="flex-1">
          <QLabel text="Верхняя правая" />
          <div className={`flex justify-end ${gap}`}>
            {UPPER_RIGHT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} isUpper={true} items={byTooth[fdi] || []}
                onSelect={handleSelect} showNumber={showNum} selected={selectedSet.has(fdi)} compact={compact} />
            ))}
          </div>
        </div>

        {/* Midline */}
        <div className="w-px bg-slate-300 mx-1 self-stretch" />

        {/* Upper LEFT (21→28) */}
        <div className="flex-1">
          <QLabel text="Верхняя левая" />
          <div className={`flex justify-start ${gap}`}>
            {UPPER_LEFT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} isUpper={true} items={byTooth[fdi] || []}
                onSelect={handleSelect} showNumber={showNum} selected={selectedSet.has(fdi)} compact={compact} />
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="flex items-center gap-2 my-1.5">
        <div className="flex-1 border-t border-dashed border-slate-300" />
        <span className="text-[9px] text-slate-400 font-medium">Верх / Низ</span>
        <div className="flex-1 border-t border-dashed border-slate-300" />
      </div>

      {/* Lower jaw: left + right */}
      <div className="flex">
        {/* Lower LEFT (31→38) */}
        <div className="flex-1">
          <div className={`flex justify-end ${gap}`}>
            {LOWER_LEFT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} isUpper={false} items={byTooth[fdi] || []}
                onSelect={handleSelect} showNumber={showNum} selected={selectedSet.has(fdi)} compact={compact} />
            ))}
          </div>
          <QLabel text="Нижняя левая" />
        </div>

        {/* Midline */}
        <div className="w-px bg-slate-300 mx-1 self-stretch" />

        {/* Lower RIGHT (41→48) */}
        <div className="flex-1">
          <div className={`flex justify-start ${gap}`}>
            {LOWER_RIGHT.slice().reverse().map(fdi => (
              <ToothCell key={fdi} fdi={fdi} isUpper={false} items={byTooth[fdi] || []}
                onSelect={handleSelect} showNumber={showNum} selected={selectedSet.has(fdi)} compact={compact} />
            ))}
          </div>
          <QLabel text="Нижняя правая" />
        </div>
      </div>

      {/* Legend */}
      {!readOnly && !compact && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 justify-center flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300 inline-block"/>
            Свободен
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-500 inline-block"/>
            Добавлен
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block"/>
            Выполнен
          </span>
          <span className="text-slate-300">· {multiSelect ? 'отметьте зубы' : 'нажмите на зуб'}</span>
        </div>
      )}
    </div>
  )
}
