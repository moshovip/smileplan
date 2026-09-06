#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
preview.py - проверка превью статьи перед публикацией на прод (Этап 10).

  check --url <URL>  - запросить URL и проверить, что страница отдаёт HTTP 200
                       (а не 500 от сломанного рендера). Перед публикацией на прод
                       черновик обязан корректно открываться в превью.
  start              - подсказка, как поднять превью-сервер вашего стека
                       (зависит от генератора: dev-команда вашего проекта).

Использование:
  python3 tools/preview.py check --url "http://localhost:3000/blog/my-post"
Коды выхода (check): 0 - HTTP 200; 1 - не 200 / ошибка запроса.
"""
import argparse
import sys
import urllib.request
import urllib.error


def cmd_check(url):
    req = urllib.request.Request(url, headers={"User-Agent": "statejnik-preview/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            code = r.getcode()
            body = r.read(4000).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        print(f"preview check: {url} -> HTTP {e.code} (рендер вернул ошибку)")
        print("Не публикуйте на прод. Смотрите лог рендера, чините в черновике, пере-публикуйте черновик (Этап 9).")
        return 1
    except Exception as e:
        print(f"preview check: запрос не удался ({e})")
        return 1

    if code == 200 and len(body.strip()) > 0:
        print(f"preview check: {url} -> HTTP 200, страница рендерится. OK.")
        return 0
    print(f"preview check: {url} -> HTTP {code} (или пустая страница). Не публикуйте, разберитесь.")
    return 1


def cmd_start():
    print("Поднимите превью-сервер вашего стека (это зависит от генератора):")
    print("  - статический генератор (Next.js / Astro / Hugo / Eleventy): ваша dev-команда;")
    print("  - WordPress / Ghost: режим черновика/preview вашей CMS;")
    print("  - manual: откройте собранный файл локально.")
    print("Затем: python3 tools/preview.py check --url \"<адрес превью>/<путь>/<slug>\"")
    return 0


def main():
    p = argparse.ArgumentParser(
        description="Проверка превью статьи перед публикацией.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    pc = sub.add_parser("check", help="проверить, что URL отдаёт HTTP 200")
    pc.add_argument("--url", required=True, help="адрес превью-страницы")
    sub.add_parser("start", help="подсказка, как поднять превью-сервер")
    args = p.parse_args()

    if args.cmd == "check":
        sys.exit(cmd_check(args.url))
    sys.exit(cmd_start())


if __name__ == "__main__":
    main()
