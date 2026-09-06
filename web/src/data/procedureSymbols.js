// Символы вмешательств, которые рисуются поверх зуба в карте.
// Символ назначается услуге в прайсе (priceItem.symbol) и переносится
// в позицию сметы, чтобы карта показывала не только «зуб занят», но и вид работы.

export const SYMBOL_COLORS = [
  { value: 'blue',   hex: '#38bdf8' },
  { value: 'green',  hex: '#22c55e' },
  { value: 'yellow', hex: '#fbbf24' },
  { value: 'purple', hex: '#a855f7' },
  { value: 'red',    hex: '#ef4444' },
  { value: 'cyan',   hex: '#06b6d4' },
  { value: 'slate',  hex: '#64748b' },
]

export const SYMBOL_HEX = Object.fromEntries(SYMBOL_COLORS.map(c => [c.value, c.hex]))

export function symbolHex(color) {
  return SYMBOL_HEX[color] || SYMBOL_HEX.blue
}

// where: 'crown' — символ садится на коронку, 'root' — в корень, 'all' — весь зуб
export const PROCEDURE_SYMBOLS = [
  { id: 'none',       label: 'Без символа',   color: 'slate',  where: 'crown' },
  { id: 'implant',    label: 'Имплант',       color: 'blue',   where: 'root'  },
  { id: 'post',       label: 'Штифт',         color: 'blue',   where: 'root'  },
  { id: 'endo',       label: 'Каналы',        color: 'cyan',   where: 'root'  },
  { id: 'crown',      label: 'Коронка',       color: 'green',  where: 'crown' },
  { id: 'bridge',     label: 'Мост',          color: 'yellow', where: 'crown' },
  { id: 'inlay',      label: 'Вкладка',       color: 'yellow', where: 'crown' },
  { id: 'filling',    label: 'Пломба',        color: 'green',  where: 'crown' },
  { id: 'veneer',     label: 'Винир',         color: 'cyan',   where: 'crown' },
  { id: 'extraction', label: 'Удаление',      color: 'red',    where: 'all'   },
  { id: 'missing',    label: 'Отсутствует',   color: 'slate',  where: 'all'   },
]

export const SYMBOL_BY_ID = Object.fromEntries(PROCEDURE_SYMBOLS.map(s => [s.id, s]))

// Подбор символа по названию услуги — чтобы старый прайс сразу ожил,
// без ручной простановки символа у каждой позиции.
const GUESS = [
  [/имплант/i,                         'implant'],
  [/штифт|культев/i,                   'post'],
  [/пульпит|периодонтит|канал|депульп/i,'endo'],
  // «восстановление коронковой части» — это реставрация, а не коронка
  [/восстановлен\w*\s+коронков/i,      'filling'],
  [/коронк/i,                          'crown'],
  [/мост/i,                            'bridge'],
  [/вкладка|накладк/i,                 'inlay'],
  [/винир|люминир/i,                   'veneer'],
  [/удалени|резекц/i,                  'extraction'],
  [/пломб|кариес|реставрац|восстановлен/i, 'filling'],
  [/гигиен|чистк|air ?flow|камен|фторир|отбеливан/i, 'none'],
]

export function guessSymbol(serviceName = '') {
  for (const [re, id] of GUESS) if (re.test(serviceName)) return id
  return 'none'
}

// Символ позиции сметы: явно заданный, иначе угаданный по названию
export function itemSymbol(item) {
  if (item?.symbol && item.symbol !== 'none') return item.symbol
  return guessSymbol(item?.serviceName)
}
