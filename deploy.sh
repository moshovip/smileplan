#!/bin/bash
# Деплой SmilePlan на GitHub Pages с сервера.
# Сборка -> копирование в клон ветки gh-pages -> коммит -> push.
set -e
ROOT=/opt/smileplan-web
MSG="${1:-deploy}"

cd "$ROOT/web"
npm run build

cd "$ROOT/.deploy"
git fetch -q origin gh-pages
git reset -q --hard origin/gh-pages
# копируем сборку, не трогая служебную папку .git
rsync -a --delete --exclude=.git "$ROOT/web/dist/" "$ROOT/.deploy/"
git add index.html assets 404.html manifest.json sw.js icon-192.svg icon-512.svg tooth.svg
if git diff --cached --quiet; then
  echo "Изменений нет, деплой не нужен"
  exit 0
fi
git -c user.name="SmilePlan Server" -c user.email="deploy@smileplan.local" commit -q -m "$MSG"
git push -q origin gh-pages
echo "Задеплоено: $(git log --oneline -1)"
