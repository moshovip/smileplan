/* Рабочая тетрадь: механика. Без зависимостей и без сборки —
   файл одинаково работает с диска, со статического хостинга и с GitHub Pages. */
(function () {
  'use strict';

  var COURSE = window.PSY_COURSE;
  var STORE_KEY = 'psy-workbook-v1';
  var UNITS = COURSE.blocks.reduce(function (acc, b) { return acc.concat(b.units); }, []);
  var VERDICTS = [
    { v: 'got', label: 'Понял' },
    { v: 'doubt', label: 'Спорно' },
    { v: 'later', label: 'Вернуться' }
  ];

  /* ---------- хранилище ---------- */

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function unitState(id) {
    if (!state[id]) state[id] = { answers: {}, verdict: '' };
    if (!state[id].answers) state[id].answers = {};
    return state[id];
  }

  function answer(unitId, exId) {
    var a = unitState(unitId).answers[exId];
    return a === undefined || a === null ? '' : String(a);
  }

  /* готовность темы: 0 — не начата, 1 — в работе, 2 — закрыта вердиктом */
  function unitProgress(unit) {
    var st = state[unit.id];
    if (!st) return 0;
    if (st.verdict) return 2;
    var answers = st.answers || {};
    for (var k in answers) {
      if (Object.prototype.hasOwnProperty.call(answers, k) && String(answers[k]).trim()) return 1;
    }
    return 0;
  }

  /* ---------- вспомогательное ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function card(title, children) {
    return el('section', { class: 'card' }, [el('h3', { text: title })].concat(children));
  }

  function findUnit(id) {
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].id === id) return UNITS[i];
    return null;
  }

  function currentId() {
    var id = (location.hash || '').replace(/^#\/?/, '');
    return findUnit(id) ? id : UNITS[0].id;
  }

  /* ---------- оглавление ---------- */

  function renderNav() {
    var nav = document.getElementById('nav');
    var active = currentId();
    nav.textContent = '';

    COURSE.blocks.forEach(function (block) {
      nav.appendChild(el('h2', { text: block.title }));
      block.units.forEach(function (unit) {
        var p = unitProgress(unit);
        var cls = 'dot' + (p === 2 ? ' done' : p === 1 ? ' started' : '');
        var link = el('a', {
          href: '#' + unit.id,
          class: (unit.id === active ? 'is-active' : '') + (unit.status === 'stub' ? ' is-stub' : '')
        }, [
          el('span', { class: cls, 'aria-hidden': 'true' }),
          el('span', { text: unit.title })
        ]);
        nav.appendChild(link);
      });
    });
  }

  function renderProgress() {
    var done = UNITS.filter(function (u) { return unitProgress(u) === 2; }).length;
    var started = UNITS.filter(function (u) { return unitProgress(u) === 1; }).length;
    var ready = UNITS.filter(function (u) { return u.status !== 'stub'; }).length;
    var parts = ['Пройдено: ' + done + ' из ' + UNITS.length];
    if (started) parts.push('в работе: ' + started);
    parts.push('готово тем: ' + ready);
    document.getElementById('progress').textContent = parts.join(' · ');
  }

  /* ---------- упражнения ---------- */

  function flashSaved(node) {
    node.classList.add('show');
    clearTimeout(node._t);
    node._t = setTimeout(function () { node.classList.remove('show'); }, 1200);
  }

  function exerciseNode(unit, ex) {
    var wrap = el('div', { class: 'ex' }, [el('p', { class: 'ex-q', text: ex.q })]);
    if (ex.hint) wrap.appendChild(el('p', { class: 'ex-hint', text: ex.hint }));

    var mark = el('span', { class: 'saved', text: 'сохранено' });
    var name = unit.id + '-' + ex.id;
    var current = answer(unit.id, ex.id);

    function commit(value) {
      unitState(unit.id).answers[ex.id] = value;
      save();
      flashSaved(mark);
      renderNav();
      renderProgress();
    }

    if (ex.type === 'text') {
      var ta = el('textarea', { id: name, rows: '4', placeholder: 'Свободный ответ…' });
      ta.value = current;
      var timer;
      ta.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { commit(ta.value); }, 500);
      });
      ta.addEventListener('blur', function () { clearTimeout(timer); commit(ta.value); });
      wrap.appendChild(ta);

    } else if (ex.type === 'choice') {
      var group = el('div', { class: 'choice' });
      ex.options.forEach(function (opt, i) {
        var input = el('input', { type: 'radio', name: name, value: opt, id: name + '-' + i });
        if (current === opt) input.checked = true;
        input.addEventListener('change', function () { commit(opt); });
        group.appendChild(el('label', {}, [input, el('span', { text: opt })]));
      });
      wrap.appendChild(group);

    } else if (ex.type === 'scale') {
      var scale = el('div', { class: 'scale' });
      scale.appendChild(el('span', { class: 'scale-end', text: ex.minLabel || String(ex.min) }));
      for (var v = ex.min; v <= ex.max; v++) {
        (function (val) {
          var input = el('input', { type: 'radio', name: name, value: String(val) });
          if (current === String(val)) input.checked = true;
          input.addEventListener('change', function () { commit(String(val)); });
          scale.appendChild(el('label', {}, [input, el('span', { text: String(val) })]));
        })(v);
      }
      scale.appendChild(el('span', { class: 'scale-end', text: ex.maxLabel || String(ex.max) }));
      wrap.appendChild(scale);
    }

    wrap.appendChild(mark);
    return wrap;
  }

  /* ---------- тема ---------- */

  function renderUnit(unit) {
    var main = document.getElementById('main');
    main.textContent = '';

    var blockTitle = COURSE.blocks.filter(function (b) {
      return b.units.indexOf(unit) !== -1;
    })[0].title;

    var meta = el('div', { class: 'meta' });
    if (unit.status === 'draft') {
      meta.appendChild(el('span', { class: 'tag draft', text: 'черновик — не сверено с лекцией' }));
    } else if (unit.status === 'verified') {
      meta.appendChild(el('span', { class: 'tag verified', text: 'сверено с расшифровкой' }));
    } else {
      meta.appendChild(el('span', { class: 'tag', text: 'тема ещё не разобрана' }));
    }
    if (unit.lecture) {
      var label = 'Лекция ' + unit.lecture.n + ' · ' + unit.lecture.title;
      meta.appendChild(unit.lecture.url
        ? el('a', { href: unit.lecture.url, target: '_blank', rel: 'noopener', text: label })
        : el('span', { class: 'tag', text: label }));
    }

    main.appendChild(el('div', { class: 'unit-head' }, [
      el('p', { class: 'eyebrow', text: blockTitle }),
      el('h1', { text: unit.title }),
      meta
    ]));

    document.title = unit.title + ' — ' + COURSE.title;

    if (unit.status === 'stub') {
      main.appendChild(card('Что здесь будет', [
        el('div', { class: 'stub' }, [
          el('p', { text: 'Тема ждёт расшифровку лекции — без неё писать разбор нечестно. План такой:' }),
          el('ul', {}, (unit.planned || []).map(function (p) { return el('li', { text: p }); }))
        ])
      ]));
      main.appendChild(unitNav(unit));
      return;
    }

    if (unit.lead) main.appendChild(card('Зачем эта тема', [el('p', { text: unit.lead })]));

    main.appendChild(card('Понятие', unit.concept.map(function (p) { return el('p', { text: p }); })));

    main.appendChild(card('Это не то же самое, что…', [
      el('ul', { class: 'confuse' }, unit.notThis.map(function (c) {
        return el('li', {}, [
          el('div', { class: 'wrong', text: c.wrong }),
          el('div', { class: 'right', text: c.right })
        ]);
      }))
    ]));

    main.appendChild(card('Проба на себе', unit.exercises.map(function (ex) {
      return exerciseNode(unit, ex);
    })));

    main.appendChild(card('Разбор: на что смотреть в своих ответах', [
      el('p', { class: 'ex-hint', text: 'Читать после того, как ответил, — иначе ответы подстроятся под разбор.' }),
      el('ul', {}, unit.debrief.map(function (d) { return el('li', { text: d }); }))
    ]));

    if (unit.terms && unit.terms.length) {
      var dl = el('dl', { class: 'terms' });
      unit.terms.forEach(function (t) {
        dl.appendChild(el('dt', { text: t.t }));
        dl.appendChild(el('dd', { text: t.d }));
      });
      main.appendChild(card('Понятия темы', [dl]));
    }

    main.appendChild(card('Итог по теме', [renderVerdict(unit)]));
    main.appendChild(unitNav(unit));
  }

  function renderVerdict(unit) {
    var box = el('div', { class: 'verdict' });
    var current = unitState(unit.id).verdict;
    VERDICTS.forEach(function (v) {
      var input = el('input', { type: 'radio', name: unit.id + '-verdict', value: v.v });
      if (current === v.v) input.checked = true;
      input.addEventListener('change', function () {
        unitState(unit.id).verdict = v.v;
        save();
        renderNav();
        renderProgress();
      });
      box.appendChild(el('label', {}, [input, el('span', { text: v.label })]));
    });
    return box;
  }

  function unitNav(unit) {
    var i = UNITS.indexOf(unit);
    var nav = el('div', { class: 'unit-nav' });
    nav.appendChild(i > 0
      ? el('a', { href: '#' + UNITS[i - 1].id, text: '← ' + UNITS[i - 1].title })
      : el('span', {}));
    nav.appendChild(i < UNITS.length - 1
      ? el('a', { href: '#' + UNITS[i + 1].id, text: UNITS[i + 1].title + ' →' })
      : el('span', {}));
    return nav;
  }

  /* ---------- выгрузка ---------- */

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function toMarkdown() {
    var out = ['# ' + COURSE.title + ' — мои ответы', '', '_Выгружено ' + stamp() + '_', ''];
    var verdictLabel = {};
    VERDICTS.forEach(function (v) { verdictLabel[v.v] = v.label; });

    COURSE.blocks.forEach(function (block) {
      var written = false;
      block.units.forEach(function (unit) {
        if (unitProgress(unit) === 0) return;
        if (!written) { out.push('## ' + block.title, ''); written = true; }
        out.push('### ' + unit.title, '');
        if (unit.lecture && unit.lecture.url) {
          out.push('Лекция ' + unit.lecture.n + ': ' + unit.lecture.url, '');
        }
        (unit.exercises || []).forEach(function (ex) {
          var a = answer(unit.id, ex.id).trim();
          if (!a) return;
          out.push('**' + ex.q + '**', '', a, '');
        });
        var v = unitState(unit.id).verdict;
        if (v) out.push('_Итог: ' + (verdictLabel[v] || v) + '_', '');
      });
    });

    if (out.length <= 4) out.push('_Пока ничего не заполнено._', '');
    return out.join('\n');
  }

  function bindActions() {
    document.querySelector('.foot-actions').addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;

      if (act === 'export-md') {
        download('psy-workbook-' + stamp() + '.md', toMarkdown(), 'text/markdown');
      } else if (act === 'export-json') {
        download('psy-workbook-' + stamp() + '.json', JSON.stringify(state, null, 2), 'application/json');
      } else if (act === 'import-json') {
        document.getElementById('import-file').click();
      }
    });

    document.getElementById('import-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad shape');
          if (!confirm('Загрузить копию? Текущие ответы в этом браузере будут заменены.')) return;
          state = data;
          save();
          render();
        } catch (err) {
          alert('Не получилось прочитать файл: ожидается JSON, выгруженный этой же тетрадью.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  /* ---------- запуск ---------- */

  function render() {
    renderNav();
    renderProgress();
    renderUnit(findUnit(currentId()));
  }

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo(0, 0);
  });

  bindActions();
  render();
})();
