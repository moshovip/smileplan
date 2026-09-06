# SmilePlan — навигация

Карта проекта. Читай в начале каждой сессии.

## Что это за проект

**SmilePlan** — бесплатная PWA-MIS для стоматологов (медицинская информационная система). Работает в браузере, данные локально в IndexedDB, хостинг на GitHub Pages.

Заменяет тетради и Excel: запись пациентов, медкарты с голосовым вводом, план лечения, календарь, финансы — всё без установки.

Подробности — `business/INDEX.md`.

## Порядок чтения в начале любой сессии

1. `business/INDEX.md` — что мы делаем, продукт, аудитория.
2. `CLAUDE.md` (этот файл) — стек, правила, навигация.
3. Зона задачи: нужный файл из `business/`, `plans/`, или папка с кодом.

## Структура репозитория

```
smileplan/
├── CLAUDE.md                 ← этот файл
├── business/                 ← второй мозг бизнеса
│   ├── INDEX.md
│   ├── products/             ← продукт, тарифы
│   ├── audience/             ← аватар, возражения, путь
│   ├── marketing/            ← конкуренты, SEO, каналы
│   ├── goals/                ← квартальные цели, OKR
│   └── life-metrics.md       ← живые цифры (LIVE-маркеры)
├── plans/                    ← технические планы фич
└── web/                      ← исходный код приложения
    ├── src/
    │   ├── pages/            ← CalendarPage, Patients, Settings...
    │   ├── components/       ← PatientForm, MedRecord, ApptModal...
    │   ├── stores/useStore.js ← Zustand + IndexedDB
    │   └── services/db.js    ← IndexedDB-операции
    ├── dist/                 ← собранный бил (деплоится на GitHub Pages)
    └── vite.config.js
```

## Где что искать

| Что нужно | Куда смотреть |
|---|---|
| Зачем делаем, для кого, бизнес-логика | `business/INDEX.md` |
| Аудитория, боли, возражения | `business/audience/` |
| Конкуренты (Инфодент, Dentist+, 1С) | `business/marketing/competitors.md` |
| SEO-стратегия и контент-план | `business/marketing/content.md` |
| Цели квартала | `business/goals/quarterly.md` |
| Живые цифры (трафик, пользователи) | `business/life-metrics.md` |
| Текущая фича / план реализации | `plans/<актуальный план>.md` |

## Стек

- **Frontend:** React 18 + Vite 5 + TailwindCSS 3
- **State:** Zustand + IndexedDB (idb), DB_VERSION=5
- **Stores:** patients, plans, priceItems, settings, appointments, medRecords, roadmaps
- **Routing:** react-router-dom v6, SPA через 404.html redirect на GitHub Pages
- **Хостинг:** GitHub Pages (dist/ — отдельный bare-like git-репозиторий)
- **Node:** `C:\Users\Armen\Projects\smileplan\node\node-v20.18.0-win-x64\`

## 8 правил репо

1. **Не хардкодить динамику** (цены, метрики) — через `business/life-metrics.md` с маркером LIVE.
2. **Не деплоить без явной команды.** Деплой = `npm run build` → `robocopy` → `git push` в dist/.
3. **git add поимённо** — никогда `git add -A` в dist/ (там git-интернал рядом с файлами).
4. **dist/.gitignore защищает git-интерналы** — не удалять этот файл.
5. **Большая фича = план в `plans/`.**
6. **После каждой фичи — цикл из 5 ходов:** ошибки → упущенное → security review.
7. **Ключи и токены — только через переменные окружения, не в коде.**
8. **Персональные данные пациентов — не класть в business/ (152-ФЗ).**

## Деплой (шаги)

```powershell
$env:PATH = "C:\Users\Armen\Projects\smileplan\node\node-v20.18.0-win-x64;" + $env:PATH
cd C:\Users\Armen\Projects\smileplan\web
npm run build
$src = "C:\Users\Armen\Projects\smileplan\web\dist"
$d   = "C:\Users\Armen\Projects\smileplan\dist"
robocopy $src $d /E /XD ".git"
$PAT = $env:GITHUB_PAT   # токен из окружения, в файлах не хранить
git --git-dir="$d" --work-tree="$d" add index.html assets/ 404.html
git --git-dir="$d" --work-tree="$d" commit -m "deploy"
git --git-dir="$d" --work-tree="$d" push "https://$PAT@github.com/moshovip/smileplan.git" gh-pages
```

⚠️ PAT не хранить в файлах, использовать только в консоли.

## Язык

Всегда отвечай на русском. Без длинного тире (—), только дефис (-).
