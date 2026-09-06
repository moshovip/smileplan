// Анатомические контуры зубов для карты: коронка + корни, как в зубной формуле.
// Система координат одного зуба: 40 x 90.
// Верхний зуб — корни вверху (y 4..46), коронка внизу (y 46..86).
// Нижний зуб — зеркально: коронка вверху (y 4..44), корни внизу (y 44..86).

export function getToothType(fdi) {
  const n = fdi % 10
  if (n === 1 || n === 2) return 'incisor'
  if (n === 3) return 'canine'
  if (n === 4 || n === 5) return 'premolar'
  return 'molar'
}

// Корень: от базы сужается к кончику
function root(cx, baseY, tipY, halfW) {
  const midY = (baseY + tipY) / 2
  return `M${cx - halfW},${baseY} `
       + `Q${cx - halfW * 0.85},${midY} ${cx},${tipY} `
       + `Q${cx + halfW * 0.85},${midY} ${cx + halfW},${baseY} Z`
}

// Коронка: прямая сторона к корням, скруглённая — к жевательной поверхности
function crown(x1, x2, baseY, tipY, radius) {
  const down = tipY > baseY
  const r = radius
  return down
    // коронка книзу (верхний зуб)
    ? `M${x1},${baseY} L${x2},${baseY} L${x2},${tipY - r} Q${x2},${tipY} ${x2 - r},${tipY} `
      + `L${x1 + r},${tipY} Q${x1},${tipY} ${x1},${tipY - r} Z`
    // коронка кверху (нижний зуб)
    : `M${x1},${baseY} L${x2},${baseY} L${x2},${tipY + r} Q${x2},${tipY} ${x2 - r},${tipY} `
      + `L${x1 + r},${tipY} Q${x1},${tipY} ${x1},${tipY + r} Z`
}

// Геометрия по типу зуба.
// Возвращает { crown, roots: [path], cx, crownBox: {x, y, w, h} }
export function toothGeometry(type, isUpper) {
  const baseY = isUpper ? 46 : 44          // граница шейки
  const crownTip = isUpper ? 86 : 4        // жевательный край
  const rootTip = isUpper ? 8 : 82
  const cx = 20

  const spec = {
    molar:    { x1: 4,  x2: 36, r: 9,  roots: isUpper ? [10, 20, 30] : [13, 27], rw: 4 },
    premolar: { x1: 7,  x2: 33, r: 9,  roots: isUpper ? [15, 25] : [20],         rw: 3.6 },
    canine:   { x1: 9,  x2: 31, r: 11, roots: [20], rw: 4.2, longRoot: true },
    incisor:  { x1: 9,  x2: 31, r: 8,  roots: [20], rw: 3.4 },
  }[type]

  const tip = spec.longRoot ? (isUpper ? rootTip - 4 : rootTip + 4) : rootTip

  return {
    crown: crown(spec.x1, spec.x2, baseY, crownTip, spec.r),
    roots: spec.roots.map(rx => root(rx, baseY, tip, spec.rw)),
    cx,
    // Прямоугольник коронки — на него сажаем символы процедур
    crownBox: isUpper
      ? { x: spec.x1, y: baseY, w: spec.x2 - spec.x1, h: crownTip - baseY }
      : { x: spec.x1, y: crownTip, w: spec.x2 - spec.x1, h: baseY - crownTip },
    rootBox: isUpper
      ? { x: 8, y: tip, w: 24, h: baseY - tip }
      : { x: 8, y: baseY, w: 24, h: tip - baseY },
  }
}

export const TOOTH_VIEWBOX = '0 0 40 90'
