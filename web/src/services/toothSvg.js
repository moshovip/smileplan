// Зубная формула строкой SVG — для HTML-выгрузки сметы.
// Геометрия зубов и символов берётся из тех же модулей, что и карта в приложении.
import { toothGeometry, getToothType } from '../data/toothShapes'
import { symbolPrimitives, primitivesToSvgString } from '../data/procedureSymbolShapes'
import { itemSymbol, SYMBOL_BY_ID } from '../data/procedureSymbols'

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const TW = 40, TH = 90, GAP = 4, MID = 14, LABEL = 14

function toothSvg(fdi, isUpper, items) {
  const type = getToothType(fdi)
  const geom = toothGeometry(type, isUpper)
  const treated = items.length > 0

  const fill = treated ? '#f0fdf4' : '#ffffff'
  const stroke = treated ? '#16a34a' : '#94a3b8'
  const sw = treated ? 2.2 : 1.6

  const shape = [
    ...geom.roots.map(d => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`),
    `<path d="${geom.crown}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`,
  ].join('')

  const seen = new Set()
  const syms = []
  for (const it of items) {
    const sid = itemSymbol(it)
    if (sid === 'none' || seen.has(sid)) continue
    seen.add(sid)
    syms.push(primitivesToSvgString(
      symbolPrimitives(sid, it.symbolColor || SYMBOL_BY_ID[sid]?.color, geom, isUpper)))
  }

  return shape + syms.join('')
}

function rowSvg(teeth, isUpper, byTooth) {
  const width = teeth.length * (TW + GAP) + MID
  const height = TH + LABEL
  const yTooth = isUpper ? 0 : LABEL
  const yLabel = isUpper ? TH + 11 : 11

  const cells = teeth.map((fdi, i) => {
    const x = i * (TW + GAP) + (i >= 8 ? MID : 0)
    const items = byTooth[fdi] || []
    const on = items.length > 0
    return `<g transform="translate(${x},${yTooth})">${toothSvg(fdi, isUpper, items)}</g>`
      + `<text x="${x + TW / 2}" y="${yLabel}" text-anchor="middle" font-size="13"`
      + ` font-family="ui-monospace,monospace" fill="${on ? '#1d4ed8' : '#94a3b8'}"`
      + ` font-weight="${on ? '700' : '400'}">${fdi}</text>`
  }).join('')

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg"`
    + ` style="max-width:${width}px;display:block;margin:0 auto">${cells}</svg>`
}

export function toothChartSvg(items) {
  const byTooth = {}
  for (const it of items) {
    const ids = it.toothIds?.length ? it.toothIds : (it.toothId ? [it.toothId] : [])
    for (const id of ids) {
      if (!byTooth[id]) byTooth[id] = []
      byTooth[id].push(it)
    }
  }
  return { upper: rowSvg(UPPER, true, byTooth), lower: rowSvg(LOWER, false, byTooth) }
}

// Легенда: какие символы встретились в этой смете
export function usedSymbols(items) {
  const seen = new Map()
  for (const it of items) {
    const sid = itemSymbol(it)
    if (sid === 'none' || seen.has(sid)) continue
    seen.set(sid, it.symbolColor || SYMBOL_BY_ID[sid]?.color)
  }
  return [...seen.entries()].map(([id, color]) => ({
    id, color, label: SYMBOL_BY_ID[id]?.label || id,
  }))
}
