import React from 'react'
import { symbolPrimitives } from '../../data/procedureSymbolShapes'

// Символ вмешательства поверх анатомического контура зуба.
// Геометрия живёт в procedureSymbolShapes — тот же источник использует SVG для HTML-выгрузки.
export default function ProcedureSymbol({ id, color, geom, isUpper }) {
  const prims = symbolPrimitives(id, color, geom, isUpper)
  if (prims.length === 0) return null
  return (
    <g>
      {prims.map((p, i) => React.createElement(p.tag, { key: i, ...p.attrs }))}
    </g>
  )
}
