// Прайс-лист с кодами услуг по номенклатуре МЗ РФ
// defaultScope — область по умолчанию: tooth | teeth | sextant | quadrant | jaw | mouth.
// Не указан = tooth (процедура на один зуб).
export const DEFAULT_PRICE_LIST = [
  // Диагностика
  { category: 'Диагностика', code: 'B01.065.001', name: 'Первичный приём врача-стоматолога',    price: 0,     icon: '🩺', defaultScope: 'mouth' },
  { category: 'Диагностика', code: 'B01.065.002', name: 'Повторный приём врача-стоматолога',     price: 0,     icon: '🩺', defaultScope: 'mouth' },
  { category: 'Диагностика', code: 'A02.07.010',  name: 'Рентгенография зуба (прицельная)',       price: 600,   icon: '📷' },
  { category: 'Диагностика', code: 'A04.07.002',  name: 'Ортопантомограмма (ОПТГ)',               price: 1500,  icon: '📷', defaultScope: 'mouth' },
  { category: 'Диагностика', code: 'A04.07.001',  name: 'Компьютерная томография (КТ 3D)',        price: 4000,  icon: '🔬', defaultScope: 'mouth' },

  // Терапия
  { category: 'Терапия', code: 'A16.07.002',  name: 'Лечение кариеса (1 поверхность)',            price: 4000,  icon: '🦷' },
  { category: 'Терапия', code: 'A16.07.002.1',name: 'Лечение кариеса (2 поверхности)',             price: 5500,  icon: '🦷' },
  { category: 'Терапия', code: 'A16.07.002.2',name: 'Лечение кариеса (3+ поверхности)',            price: 7000,  icon: '🦷' },
  { category: 'Терапия', code: 'A16.07.030',  name: 'Пломба световая — прямая реставрация',       price: 6000,  icon: '🔵' },
  { category: 'Терапия', code: 'A16.07.008',  name: 'Лечение пульпита (1 канал)',                  price: 7000,  icon: '💉' },
  { category: 'Терапия', code: 'A16.07.008.1',name: 'Лечение пульпита (2 канала)',                 price: 10000, icon: '💉' },
  { category: 'Терапия', code: 'A16.07.008.2',name: 'Лечение пульпита (3 канала)',                 price: 13000, icon: '💉' },
  { category: 'Терапия', code: 'A16.07.009',  name: 'Лечение периодонтита (1 канал)',              price: 8000,  icon: '🔴' },
  { category: 'Терапия', code: 'A16.07.009.1',name: 'Лечение периодонтита (2-3 канала)',           price: 12000, icon: '🔴' },
  { category: 'Терапия', code: 'A16.07.025',  name: 'Реставрация зуба (художественная)',           price: 9000,  icon: '🎨' },
  { category: 'Терапия', code: 'A16.07.023',  name: 'Штифт стекловолоконный',                     price: 3500,  icon: '📌' },

  // Хирургия
  { category: 'Хирургия', code: 'A16.07.001',  name: 'Удаление зуба (простое)',                   price: 3500,  icon: '✂️' },
  { category: 'Хирургия', code: 'A16.07.001.1',name: 'Удаление зуба (сложное)',                   price: 6500,  icon: '✂️' },
  { category: 'Хирургия', code: 'A16.07.001.2',name: 'Удаление зуба мудрости (атипичное)',        price: 9000,  icon: '✂️' },
  { category: 'Хирургия', code: 'A16.07.014',  name: 'Резекция верхушки корня',                   price: 12000, icon: '🔪' },
  { category: 'Хирургия', code: 'A16.07.010',  name: 'Разрез, дренирование абсцесса',             price: 3000,  icon: '🩹' },
  { category: 'Хирургия', code: 'A16.07.060',  name: 'Пластика уздечки губы / языка',             price: 6000,  icon: '🩺', defaultScope: 'mouth' },

  // Ортопедия
  { category: 'Ортопедия', code: 'A16.07.034',   name: 'Коронка металлокерамическая',             price: 16000, icon: '👑' },
  { category: 'Ортопедия', code: 'A16.07.034.1', name: 'Коронка циркониевая (CAD/CAM)',            price: 28000, icon: '💎' },
  { category: 'Ортопедия', code: 'A16.07.034.2', name: 'Коронка E-max (безметалловая)',            price: 30000, icon: '💎' },
  { category: 'Ортопедия', code: 'A16.07.044',   name: 'Коронка на имплант (цирконий)',            price: 28000, icon: '💎' },
  { category: 'Ортопедия', code: 'A16.07.035',   name: 'Вкладка культевая (литая)',                price: 7500,  icon: '🔩' },
  { category: 'Ортопедия', code: 'A16.07.040',   name: 'Протез частичный съёмный (акрил)',        price: 25000, icon: '🦷', defaultScope: 'jaw' },
  { category: 'Ортопедия', code: 'A16.07.041',   name: 'Протез бюгельный',                        price: 45000, icon: '🦷', defaultScope: 'jaw' },
  { category: 'Ортопедия', code: 'A16.07.042',   name: 'Протез полный съёмный',                   price: 35000, icon: '🦷', defaultScope: 'jaw' },
  { category: 'Ортопедия', code: 'A16.07.033',   name: 'Мост (за единицу)',                       price: 16000, icon: '🌉' },
  { category: 'Ортопедия', code: 'A16.07.056',   name: 'Снятие коронки / моста',                  price: 1500,  icon: '🔧' },
  { category: 'Ортопедия', code: 'A16.07.020',   name: 'Временная коронка (пластик)',              price: 3000,  icon: '🪶' },

  // Гигиена
  { category: 'Гигиена', code: 'A16.07.061',  name: 'Профессиональная гигиена полости рта',       price: 5000,  icon: '🪥', defaultScope: 'mouth' },
  { category: 'Гигиена', code: 'A16.07.062',  name: 'Air Flow (пескоструйная чистка)',            price: 3500,  icon: '💨', defaultScope: 'mouth' },
  { category: 'Гигиена', code: 'A16.07.063',  name: 'Снятие зубного камня (ультразвук)',         price: 2500,  icon: '⚡', defaultScope: 'mouth' },
  { category: 'Гигиена', code: 'A16.07.064',  name: 'Фторирование (глубокое)',                    price: 1500,  icon: '🛡️', defaultScope: 'mouth' },
  { category: 'Гигиена', code: 'A16.07.065',  name: 'Герметизация фиссур (1 зуб)',               price: 2500,  icon: '🔒' },

  // Эстетика
  { category: 'Эстетика', code: 'A16.07.070',  name: 'Отбеливание Zoom 4 (1 сеанс)',             price: 18000, icon: '✨', defaultScope: 'mouth' },
  { category: 'Эстетика', code: 'A16.07.036',  name: 'Винир керамический (E-max)',                price: 25000, icon: '💅' },
  { category: 'Эстетика', code: 'A16.07.036.1',name: 'Люминир (ультратонкий винир)',              price: 35000, icon: '💅' },

  // Имплантация
  { category: 'Имплантация', code: 'A16.07.059',   name: 'Установка импланта (+ операция)',       price: 50000, icon: '🔩' },
  { category: 'Имплантация', code: 'A16.07.059.1', name: 'Имплант NobelActive / Straumann',       price: 80000, icon: '🔩' },
  { category: 'Имплантация', code: 'A16.07.059.2', name: 'Формирователь десны',                   price: 5000,  icon: '🌿' },
  { category: 'Имплантация', code: 'A16.07.059.3', name: 'Абатмент (титановый/циркониевый)',      price: 10000, icon: '🔧' },
  { category: 'Имплантация', code: 'A16.07.053',   name: 'Синус-лифтинг закрытый',                price: 25000, icon: '⬆️' },
  { category: 'Имплантация', code: 'A16.07.054',   name: 'Синус-лифтинг открытый',                price: 45000, icon: '⬆️', defaultScope: 'teeth' },
  { category: 'Имплантация', code: 'A16.07.055',   name: 'Костная пластика (аугментация)',        price: 35000, icon: '🦴', defaultScope: 'teeth' },
  { category: 'Имплантация', code: 'A16.07.055.1', name: 'Bio-Oss 0.5g (материал)',               price: 12000, icon: '🧪' },
  { category: 'Имплантация', code: 'A16.07.055.2', name: 'Bio-Oss 1g (материал)',                 price: 20000, icon: '🧪' },
  { category: 'Имплантация', code: 'A16.07.055.3', name: 'Bio-Oss 2g (материал)',                 price: 30000, icon: '🧪' },
  { category: 'Имплантация', code: 'A16.07.055.4', name: 'Bio-Gide (мембрана)',                   price: 15000, icon: '🧬' },

  // Ортодонтия
  { category: 'Ортодонтия', code: 'A16.07.047',  name: 'Брекеты металлические (1 челюсть)',      price: 35000, icon: '🦷', defaultScope: 'jaw' },
  { category: 'Ортодонтия', code: 'A16.07.047.1',name: 'Брекеты сапфировые (1 челюсть)',         price: 55000, icon: '💠', defaultScope: 'jaw' },
  { category: 'Ортодонтия', code: 'A16.07.048',  name: 'Элайнеры (полный курс)',                  price: 90000, icon: '😁', defaultScope: 'mouth' },
  { category: 'Ортодонтия', code: 'A16.07.049',  name: 'Ретейнер несъёмный (1 зуб ряд)',         price: 8000,  icon: '🔗', defaultScope: 'jaw' },
  { category: 'Ортодонтия', code: 'A16.07.050',  name: 'Активация брекетов (визит)',              price: 3000,  icon: '🔧', defaultScope: 'mouth' },

  // Анестезия / прочее
  { category: 'Анестезия', code: 'A11.07.001',  name: 'Анестезия инфильтрационная',               price: 500,   icon: '💉' },
  { category: 'Анестезия', code: 'A11.07.002',  name: 'Анестезия проводниковая',                  price: 800,   icon: '💉' },
  { category: 'Анестезия', code: 'A11.07.003',  name: 'Седация (закись азота, 30 мин)',            price: 3500,  icon: '😴', defaultScope: 'mouth' },
]
