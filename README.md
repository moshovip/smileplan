# 🦷 SmilePlan

> Смета за минуту — пациент всё понимает

## Быстрый старт

1. Установите [Node.js LTS](https://nodejs.org/)
2. Запустите `install_and_run.bat`  
   *(или вручную: `cd web && npm install && npm run dev`)*
3. Откройте **http://localhost:5173**

## Что входит в MVP (Этап 1)

| Модуль | Статус |
|--------|--------|
| Онбординг (настройка врача) | ✅ |
| Пациенты (CRUD + лимит Free) | ✅ |
| Прайс-лист (CRUD + шаблон 30+ услуг) | ✅ |
| Карта зубов (SVG, FDI-нумерация) | ✅ |
| Создание сметы | ✅ |
| Генерация PDF (pdf-lib) | ✅ |
| Отправка WhatsApp / Telegram | ✅ |
| Настройки клиники + шаблоны текстов | ✅ |
| Free / Pro тарифы | ✅ |

## Структура проекта

```
smileplan/
├── web/                  # React + Vite + Tailwind
│   └── src/
│       ├── components/   # ToothMap, Layout, Forms, Onboarding
│       ├── pages/        # Dashboard, Patients, PriceList, Estimate, Settings
│       ├── services/     # db.js (IndexedDB), pdf.js (pdf-lib)
│       ├── stores/       # useStore.js (Zustand)
│       └── data/         # defaultPriceList.js
├── install_and_run.bat   # Скрипт запуска
└── README.md
```

## Тарифы

| | Free | Pro |
|--|------|-----|
| Пациентов | до 5 | ∞ |
| PDF смета | ✅ (без карты зубов) | ✅ + карта зубов |
| Брендинг в PDF | ❌ | ✅ |
| WhatsApp / Telegram | ✅ | ✅ |

## Следующие этапы

- **Этап 2:** Telegram-бот + WhatsApp Business API
- **Этап 3:** Electron (Desktop)
- **Этап 4:** React Native (iOS / Android)
