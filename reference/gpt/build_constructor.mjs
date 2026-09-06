// Собираем конструктор: чистые контуры из набора 1 + слоистая логика.
// Контуры — dental_svg_assets/teeth/*.svg (viewBox 100x220, только <path>).
import fs from 'node:fs'

const TEETH_DIR = process.argv[2]
const OUT = process.argv[3]

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

// bbox по абсолютным координатам path (в наборе все команды заглавные)
function bboxOf(d) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || []
  let x0=Infinity, y0=Infinity, x1=-Infinity, y1=-Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i+1]
    if (x < x0) x0 = x; if (x > x1) x1 = x
    if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  return [x0, y0, x1, y1]
}

const teeth = {}
for (const fdi of [...UPPER, ...LOWER]) {
  const file = `${TEETH_DIR}/${fdi}.svg`
  if (!fs.existsSync(file)) continue
  const svg = fs.readFileSync(file, 'utf8')
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1])
  if (!paths.length) continue
  // общий bbox всего зуба
  let B = [Infinity, Infinity, -Infinity, -Infinity]
  for (const d of paths) {
    const b = bboxOf(d)
    B = [Math.min(B[0],b[0]), Math.min(B[1],b[1]), Math.max(B[2],b[2]), Math.max(B[3],b[3])]
  }
  const jaw = (String(fdi)[0] === '1' || String(fdi)[0] === '2') ? 'upper' : 'lower'
  const n = fdi % 10
  const type = n <= 2 ? 'incisor' : n === 3 ? 'canine' : n <= 5 ? 'premolar' : 'molar'
  teeth[fdi] = { jaw, type, bbox: B, paths }
}

const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Конструктор зуба</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;color:#1d2433;line-height:1.5;padding-bottom:40px}
.hdr{background:#111827;color:#fff;padding:18px 16px}
.hdr h1{font-size:18px}.hdr p{font-size:12px;color:#94a3b8;margin-top:4px}
.wrap{max-width:960px;margin:0 auto;padding:16px}
.card{background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h2{font-size:14px;margin-bottom:10px}
.work{display:flex;gap:20px;flex-wrap:wrap}
.stage{flex:0 0 220px;text-align:center}
.stage svg{width:200px;height:440px;background:#fff;border:1px solid #e2e8f0;border-radius:12px}
.panel{flex:1;min-width:260px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
button{font:inherit;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:5px 10px;font-size:12px}
button[aria-pressed="true"]{background:#0f172a;color:#fff;border-color:#0f172a}
button:disabled{opacity:.35;cursor:default}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;margin:12px 0 6px;font-weight:700}
.teeth{display:flex;gap:2px;flex-wrap:wrap}
.teeth button{padding:3px 6px;font-family:ui-monospace,monospace;font-size:11px}
.cap{font-size:13px;color:#475569;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9}
.cap b{color:#0f172a}
.note{font-size:12px;color:#64748b}
.surf{cursor:pointer}
</style></head><body>
<div class="hdr"><h1>Конструктор зуба - проверка структуры</h1>
<p>Контуры твои, из набора 1. Слои считаются от контура, поэтому поменять рисунок можно в любой момент.</p></div>
<div class="wrap">

<div class="card"><h2>Пробуй: выбери зуб, жми действия, тыкай по поверхностям коронки</h2>
<div class="work">
  <div class="stage">
    <svg id="stage" viewBox="0 0 100 220"></svg>
    <div class="note" id="cap" style="margin-top:8px"></div>
  </div>
  <div class="panel">
    <div class="lbl">Что делаем с зубом</div>
    <div class="chips" id="actions"></div>
    <div class="lbl">Верхняя челюсть</div>
    <div class="teeth" id="upper"></div>
    <div class="lbl">Нижняя челюсть</div>
    <div class="teeth" id="lower"></div>
    <div class="cap" id="summary"></div>
  </div>
</div></div>

<div class="card"><h2>Как это устроено</h2>
<div class="note">
Контур зуба - твой файл, я его не трогаю. Всё остальное - коронка, обточка, канал, имплант, абатмент, вкладка, кость - строится <b>от размеров контура</b>: программа находит линию шейки и от неё считает геометрию. Поэтому если ты пришлёшь другие зубы, красивее, структура не сломается: подставим новые контуры, слои пересчитаются сами.<br><br>
Поверхности коронки кликабельны. Отметил две - в смете это «пломба 2 поверхности», и на карте видно <b>какие именно</b> стенки лечили.
</div></div>

</div>
<script>
const teeth = ${JSON.stringify(teeth)};
const UPPER = ${JSON.stringify(UPPER)}, LOWER = ${JSON.stringify(LOWER)};
const NS = 'http://www.w3.org/2000/svg';
const el = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };

const ACTIONS = [
  ['crown','Коронка'], ['veneer','Винир'], ['canal','Каналы'], ['inlay','Вкладка'],
  ['implant','Имплант'], ['abutment','Абатмент'], ['bone','Кость'], ['sinus','Синус'], ['extract','Удаление'],
];
const state = { tooth: 16, actions: new Set(), surfaces: new Set() };

// линия шейки: граница коронка/корень
const splitY = t => { const [,y0,,y1] = t.bbox, h = y1 - y0;
  return t.jaw === 'upper' ? y0 + h * 0.56 : y0 + h * 0.44; };

const crownBox = t => { const [x0,y0,x1,y1] = t.bbox, s = splitY(t);
  return t.jaw === 'upper' ? [x0, s, x1, y1] : [x0, y0, x1, s]; };
const rootBox = t => { const [x0,y0,x1,y1] = t.bbox, s = splitY(t);
  return t.jaw === 'upper' ? [x0, y0, x1, s] : [x0, s, x1, y1]; };

// сколько поверхностей размечаем: у жевательных больше
const surfCount = t => (t.type === 'molar' ? 5 : t.type === 'premolar' ? 4 : 3);
const SURF_NAMES = {
  3: ['медиальная','вестибулярная','дистальная'],
  4: ['медиальная','щёчная','жевательная','дистальная'],
  5: ['медиальная','щёчная','жевательная','язычная','дистальная'],
};

function draw() {
  const t = teeth[state.tooth];
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  const A = state.actions;
  // зависимости, как в структуре: имплант отменяет канал и ставит абатмент с коронкой
  const act = new Set(A);
  if (act.has('implant')) { act.add('abutment'); act.add('crown'); act.delete('canal'); act.delete('inlay'); }
  if (act.has('inlay')) act.add('canal');
  if (t.jaw === 'lower') act.delete('sinus');

  const [cx0, cy0, cx1, cy1] = crownBox(t);
  const [rx0, ry0, rx1, ry1] = rootBox(t);
  const cx = (t.bbox[0] + t.bbox[2]) / 2, s = splitY(t);
  const dim = act.has('crown') || act.has('implant') || act.has('veneer');

  // кость и синус - под зубом
  if (act.has('bone')) stage.append(el('rect', {x: t.bbox[0]-6, y: s-7, width: t.bbox[2]-t.bbox[0]+12, height: 14, fill:'#94a3b8', opacity:'.5', rx:3}));
  if (act.has('sinus')) stage.append(el('path', {d:\`M\${t.bbox[0]-6} \${t.bbox[1]-4}C\${t.bbox[0]+8} \${t.bbox[1]-22} \${t.bbox[2]-8} \${t.bbox[1]-22} \${t.bbox[2]+6} \${t.bbox[1]-4}Z\`, fill:'#cbd5e1', stroke:'#64748b', 'stroke-width':1}));

  // сам зуб
  for (const d of t.paths)
    stage.append(el('path', {d, fill:'#fff', stroke:'#111', 'stroke-width':3.2, 'stroke-linejoin':'round', opacity: dim ? .3 : 1}));

  // имплант вместо корня
  if (act.has('implant')) {
    const tip = t.jaw === 'upper' ? ry0 + 6 : ry1 - 6;
    stage.append(el('path', {d:\`M\${cx-9} \${s}H\${cx+9}L\${cx+6} \${tip}L\${cx} \${tip + (t.jaw==='upper'?-8:8)}L\${cx-6} \${tip}Z\`, fill:'#64748b', stroke:'#0f172a', 'stroke-width':1.5}));
    for (let i = 1; i <= 5; i++) {
      const y = s + (t.jaw==='upper' ? -1 : 1) * (i * (Math.abs(tip - s) / 6));
      stage.append(el('line', {x1:cx-10, y1:y, x2:cx+10, y2:y+2, stroke:'#e2e8f0', 'stroke-width':2.4, 'stroke-linecap':'round'}));
    }
  }
  // каналы
  if (act.has('canal')) {
    const tip = t.jaw === 'upper' ? ry0 + 10 : ry1 - 10;
    const off = t.type === 'molar' ? [-8, 8] : [0];
    for (const dx of off)
      stage.append(el('line', {x1:cx+dx*0.6, y1:s, x2:cx+dx, y2:tip, stroke:'#0ea5e9', 'stroke-width':4, 'stroke-linecap':'round'}));
  }
  if (act.has('abutment'))
    stage.append(el('path', {d:\`M\${cx-11} \${s}H\${cx+11}L\${cx+7} \${s + (t.jaw==='upper'?14:-14)}H\${cx-7}Z\`, fill:'#93c5fd', stroke:'#0f172a', 'stroke-width':1.2}));
  if (act.has('inlay')) {
    const h = (cy1 - cy0) * 0.4, y = t.jaw === 'upper' ? cy1 - h - 3 : cy0 + 3;
    stage.append(el('rect', {x:cx0+5, y, width:(cx1-cx0)-10, height:h, rx:4, fill:'#38bdf8', stroke:'#0f172a', 'stroke-width':1.2}));
  }
  if (act.has('crown'))
    stage.append(el('rect', {x:cx0+2, y:cy0+1, width:(cx1-cx0)-4, height:(cy1-cy0)-2, rx:10, fill:'#475569', opacity:.9, stroke:'#0f172a', 'stroke-width':1.6}));
  if (act.has('veneer'))
    stage.append(el('rect', {x:cx0+3, y:cy0+3, width:(cx1-cx0)*0.3, height:(cy1-cy0)-6, rx:5, fill:'#a5b4fc', stroke:'#0f172a', 'stroke-width':1}));

  // кликабельные поверхности коронки
  if (!act.has('crown') && !act.has('implant')) {
    const n = surfCount(t), w = (cx1 - cx0) / n;
    for (let i = 0; i < n; i++) {
      const on = state.surfaces.has(i);
      const r = el('rect', {x:cx0 + i*w, y:cy0, width:w, height:cy1-cy0,
        fill: on ? '#0ea5e9' : 'transparent', opacity: on ? .75 : 1,
        stroke: on ? '#0f172a' : '#94a3b8', 'stroke-width': on ? 1.4 : 0.6,
        'stroke-dasharray': on ? '0' : '3 3', class:'surf'});
      r.addEventListener('click', () => { state.surfaces.has(i) ? state.surfaces.delete(i) : state.surfaces.add(i); draw(); });
      stage.append(r);
    }
  }
  if (act.has('extract'))
    stage.append(el('path', {d:\`M\${t.bbox[0]} \${t.bbox[1]}L\${t.bbox[2]} \${t.bbox[3]}M\${t.bbox[2]} \${t.bbox[1]}L\${t.bbox[0]} \${t.bbox[3]}\`, stroke:'#dc2626', 'stroke-width':6, 'stroke-linecap':'round', fill:'none'}));

  document.getElementById('cap').textContent = \`зуб \${state.tooth} · \${t.jaw==='upper'?'верх':'низ'} · \${t.type}\`;
  const names = SURF_NAMES[surfCount(t)] || [];
  const chosen = [...state.surfaces].sort().map(i => names[i]).filter(Boolean);
  const parts = [];
  if (act.size) parts.push([...act].map(a => (ACTIONS.find(x=>x[0]===a)||[])[1] || a).join(', '));
  if (chosen.length) parts.push(\`пломба \${chosen.length} \${chosen.length===1?'поверхность':'поверхности'} (\${chosen.join(', ')})\`);
  document.getElementById('summary').innerHTML = parts.length
    ? '<b>В смету попадёт:</b><br>' + parts.join('<br>')
    : 'Натуральный зуб, ничего не выбрано';
  document.querySelectorAll('[data-act]').forEach(b => {
    b.setAttribute('aria-pressed', state.actions.has(b.dataset.act) ? 'true' : 'false');
    b.disabled = b.dataset.act === 'sinus' && t.jaw === 'lower';
  });
  document.querySelectorAll('[data-fdi]').forEach(b =>
    b.setAttribute('aria-pressed', String(state.tooth) === b.dataset.fdi ? 'true' : 'false'));
}

const ab = document.getElementById('actions');
for (const [id, name] of ACTIONS) {
  const b = document.createElement('button'); b.textContent = name; b.dataset.act = id;
  b.onclick = () => { state.actions.has(id) ? state.actions.delete(id) : state.actions.add(id); draw(); };
  ab.append(b);
}
for (const [rowId, list] of [['upper', UPPER], ['lower', LOWER]]) {
  const row = document.getElementById(rowId);
  for (const f of list) {
    if (!teeth[f]) continue;
    const b = document.createElement('button'); b.textContent = f; b.dataset.fdi = f;
    b.onclick = () => { state.tooth = f; state.surfaces.clear(); draw(); };
    row.append(b);
  }
}
draw();
</script></body></html>`

fs.writeFileSync(OUT, html, 'utf8')
console.log('зубов подключено:', Object.keys(teeth).length)
console.log('размер:', html.length, 'символов →', OUT)
