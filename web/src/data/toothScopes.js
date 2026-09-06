// Область применения процедуры: зуб, группа зубов, секстант, квадрант, челюсть, полость рта.
// FDI-нотация: первая цифра — квадрант, вторая — номер зуба от центра.

export const QUADRANTS = {
  Q1: { label: 'Верхняя правая', teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  Q2: { label: 'Верхняя левая',  teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  Q3: { label: 'Нижняя левая',   teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
  Q4: { label: 'Нижняя правая',  teeth: [41, 42, 43, 44, 45, 46, 47, 48] },
}

export const SEXTANTS = {
  S1: { label: 'Секстант 1 (18-14)', teeth: [18, 17, 16, 15, 14] },
  S2: { label: 'Секстант 2 (13-23)', teeth: [13, 12, 11, 21, 22, 23] },
  S3: { label: 'Секстант 3 (24-28)', teeth: [24, 25, 26, 27, 28] },
  S4: { label: 'Секстант 4 (38-34)', teeth: [38, 37, 36, 35, 34] },
  S5: { label: 'Секстант 5 (33-43)', teeth: [33, 32, 31, 41, 42, 43] },
  S6: { label: 'Секстант 6 (44-48)', teeth: [44, 45, 46, 47, 48] },
}

export const JAWS = {
  upper: { label: 'Верхняя челюсть', teeth: [...QUADRANTS.Q1.teeth, ...QUADRANTS.Q2.teeth] },
  lower: { label: 'Нижняя челюсть',  teeth: [...QUADRANTS.Q3.teeth, ...QUADRANTS.Q4.teeth] },
}

export const ALL_TEETH = [...JAWS.upper.teeth, ...JAWS.lower.teeth]

// Порядок табов в модалке процедуры
export const SCOPES = [
  { value: 'tooth',    label: 'Зуб',          short: 'зуб' },
  { value: 'teeth',    label: 'Неск. зубов',  short: 'зубы' },
  { value: 'sextant',  label: 'Сегмент',      short: 'сегмент' },
  { value: 'quadrant', label: 'Квадрант',     short: 'квадрант' },
  { value: 'jaw',      label: 'Челюсть',      short: 'челюсть' },
  { value: 'mouth',    label: 'Полость рта',  short: 'полость рта' },
]

// Зубы конкретной области: teethOfScope('sextant', 'S1') → [18,17,16,15,14]
export function teethOfScope(scope, key) {
  if (scope === 'sextant')  return SEXTANTS[key]?.teeth  ? [...SEXTANTS[key].teeth]  : []
  if (scope === 'quadrant') return QUADRANTS[key]?.teeth ? [...QUADRANTS[key].teeth] : []
  if (scope === 'jaw')      return JAWS[key]?.teeth      ? [...JAWS[key].teeth]      : []
  if (scope === 'mouth')    return []
  return []
}

// Подпись области для таблицы, PDF и Telegram
export function scopeLabel(scope, toothIds = [], scopeKey = null) {
  if (scope === 'mouth') return 'Полость рта'
  if (scope === 'jaw')      return JAWS[scopeKey]?.label      || 'Челюсть'
  if (scope === 'quadrant') return QUADRANTS[scopeKey]?.label || 'Квадрант'
  if (scope === 'sextant')  return SEXTANTS[scopeKey]?.label  || 'Сегмент'
  if (!toothIds || toothIds.length === 0) return '—'
  if (toothIds.length === 1) return String(toothIds[0])
  return toothIds.join(', ')
}

// Короткая подпись для узкой колонки: 16, 17, +2
export function scopeLabelShort(scope, toothIds = [], scopeKey = null) {
  if (scope === 'teeth' && toothIds.length > 3) {
    return `${toothIds.slice(0, 2).join(', ')}, +${toothIds.length - 2}`
  }
  if (scope === 'sextant')  return SEXTANTS[scopeKey]?.label.split(' (')[0]  || 'Сегмент'
  if (scope === 'quadrant') return QUADRANTS[scopeKey]?.label || 'Квадрант'
  return scopeLabel(scope, toothIds, scopeKey)
}

// Старые позиции сметы (до появления scope) знают только toothId.
// Нормализуем при каждом чтении — миграция БД не нужна, схема не менялась.
export function normalizeItem(item) {
  if (item.scope) {
    return { ...item, toothIds: (item.toothIds || []).map(Number) }
  }
  const toothId = item.toothId != null && item.toothId !== '' ? Number(item.toothId) : null
  return {
    ...item,
    scope: toothId ? 'tooth' : 'mouth',
    scopeKey: null,
    toothIds: toothId ? [toothId] : [],
    toothId,
  }
}

// toothId остаётся в позиции ради обратной совместимости:
// на него опираются RoadmapModal, промпт Groq и старые сметы.
export function primaryToothId(toothIds = []) {
  return toothIds.length > 0 ? Number(toothIds[0]) : null
}
