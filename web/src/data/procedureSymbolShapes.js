// Один источник геометрии символов: возвращает список примитивов,
// который умеет отрисовать и React (ProcedureSymbol), и строковый SVG (toothSvg).
import { symbolHex, SYMBOL_BY_ID } from './procedureSymbols'

// [{ tag: 'rect'|'line'|'path'|'ellipse'|'circle', attrs: {...} }]
export function symbolPrimitives(id, color, geom, isUpper) {
  const def = SYMBOL_BY_ID[id]
  if (!def || id === 'none') return []
  const c = symbolHex(color || def.color)
  const { crownBox: cb, rootBox: rb, cx } = geom
  const out = []

  switch (id) {
    case 'implant': {
      const top = isUpper ? rb.y + 2 : rb.y + rb.h - 2
      const bottom = isUpper ? rb.y + rb.h : rb.y
      const steps = 6
      const step = (bottom - top) / steps
      for (let i = 0; i < steps; i++) {
        const y = top + step * i
        const w = 7 - i * 0.4
        out.push({ tag: 'line', attrs: {
          x1: cx - w, y1: y, x2: cx + w, y2: y + step * 0.55,
          stroke: c, strokeWidth: 2.6, strokeLinecap: 'round' } })
      }
      break
    }

    case 'post': {
      const headY = isUpper ? rb.y + rb.h - 3 : rb.y + 3
      const tipY  = isUpper ? rb.y + 5 : rb.y + rb.h - 5
      out.push({ tag: 'line', attrs: {
        x1: cx, y1: headY, x2: cx, y2: tipY, stroke: c, strokeWidth: 4, strokeLinecap: 'round' } })
      out.push({ tag: 'ellipse', attrs: { cx, cy: headY, rx: 5.5, ry: 6, fill: c } })
      break
    }

    case 'endo': {
      const y1 = isUpper ? rb.y + 4 : rb.y + rb.h - 4
      const y2 = isUpper ? rb.y + rb.h : rb.y
      for (const dx of [-6, 0, 6]) {
        out.push({ tag: 'line', attrs: {
          x1: cx + dx * 0.7, y1, x2: cx + dx, y2,
          stroke: c, strokeWidth: 2.2, strokeLinecap: 'round', opacity: dx === 0 ? 1 : 0.75 } })
      }
      break
    }

    case 'crown':
      out.push({ tag: 'rect', attrs: {
        x: cb.x + 1, y: cb.y + (isUpper ? 1 : 0), width: cb.w - 2, height: cb.h - 1,
        rx: 8, fill: c, opacity: 0.9 } })
      break

    case 'bridge': {
      const y = isUpper ? cb.y + cb.h * 0.42 : cb.y + cb.h * 0.58
      const sweep = isUpper ? 1 : 0
      out.push({ tag: 'path', attrs: {
        d: `M${cb.x - 1},${y} A${cb.w / 2 + 1},${cb.h * 0.4} 0 0 ${sweep} ${cb.x + cb.w + 1},${y}`,
        fill: c, opacity: 0.9 } })
      break
    }

    case 'inlay': {
      const h = cb.h * 0.42
      const y = isUpper ? cb.y + cb.h - h - 2 : cb.y + 2
      out.push({ tag: 'rect', attrs: {
        x: cb.x + 2, y, width: cb.w - 4, height: h, rx: 4, fill: c, opacity: 0.92 } })
      break
    }

    case 'filling': {
      const s = Math.min(cb.w, cb.h) * 0.46
      out.push({ tag: 'rect', attrs: {
        x: cx - s / 2, y: cb.y + cb.h / 2 - s / 2, width: s, height: s, rx: 2.5, fill: c } })
      break
    }

    case 'veneer': {
      const w = cb.w * 0.26
      out.push({ tag: 'rect', attrs: {
        x: cb.x + 2, y: cb.y + 3, width: w, height: cb.h - 6, rx: 3, fill: c, opacity: 0.95 } })
      break
    }

    case 'extraction': {
      const y1 = isUpper ? 14 : 10, y2 = isUpper ? 80 : 76
      const s = { stroke: c, strokeWidth: 5, strokeLinecap: 'round' }
      out.push({ tag: 'line', attrs: { x1: 8, y1, x2: 32, y2, ...s } })
      out.push({ tag: 'line', attrs: { x1: 32, y1, x2: 8, y2, ...s } })
      break
    }

    case 'missing': {
      const y = isUpper ? 66 : 24
      out.push({ tag: 'line', attrs: {
        x1: 7, y1: y, x2: 33, y2: y, stroke: c, strokeWidth: 3.5, strokeLinecap: 'round' } })
      break
    }
  }

  return out
}

// camelCase → kebab-case для строкового SVG
const ATTR = { strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin' }

export function primitivesToSvgString(prims) {
  return prims.map(p => {
    const attrs = Object.entries(p.attrs)
      .map(([k, v]) => `${ATTR[k] || k}="${v}"`).join(' ')
    return `<${p.tag} ${attrs}/>`
  }).join('')
}
