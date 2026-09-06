import React from 'react'
import { toothGeometry, TOOTH_VIEWBOX } from '../../data/toothShapes'
import ProcedureSymbol from './ProcedureSymbol'

// Символ на контуре зуба — для выбора символа в прайсе и для легенды.
export default function SymbolPreview({ id, color, type = 'molar', isUpper = false, className = 'w-6 h-12' }) {
  const geom = toothGeometry(type, isUpper)
  return (
    <svg viewBox={TOOTH_VIEWBOX} className={className}>
      {geom.roots.map((d, i) => (
        <path key={i} d={d} fill="#fff" stroke="#94a3b8" strokeWidth="1.6" strokeLinejoin="round" />
      ))}
      <path d={geom.crown} fill="#fff" stroke="#94a3b8" strokeWidth="1.6" strokeLinejoin="round" />
      <ProcedureSymbol id={id} color={color} geom={geom} isUpper={isUpper} />
    </svg>
  )
}
