// Смета одним самодостаточным HTML-файлом.
// Без внешних ресурсов: открывается офлайн и во встроенном браузере Telegram.
import { scopeLabel, normalizeItem } from '../data/toothScopes'
import { toothChartSvg, usedSymbols } from './toothSvg'
import { toothGeometry } from '../data/toothShapes'
import { symbolPrimitives, primitivesToSvgString } from '../data/procedureSymbolShapes'

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const rub = (n) => Number(n || 0).toLocaleString('ru-RU')

const CSS = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;color:#1d2433;padding:0 0 32px;line-height:1.5}
.hdr{background:#111827;color:#fff;padding:20px 16px}
.hdr h1{font-size:19px;font-weight:700}
.hdr .sub{font-size:12px;color:#94a3b8;margin-top:3px}
.wrap{padding:14px 16px;max-width:760px;margin:0 auto}
.card{background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.card h2{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:10px;font-weight:700}
.pat{font-size:17px;font-weight:700}
.meta{font-size:12px;color:#64748b;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8;padding:0 6px 7px;font-weight:700}
th.r,td.r{text-align:right}
td{padding:9px 6px;border-top:1px solid #f1f5f9;vertical-align:top}
tr:first-child td{border-top:none}
.num{color:#cbd5e1;width:22px;font-size:11px}
.scope{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;white-space:nowrap}
.price{font-weight:700;white-space:nowrap}
.total{background:#111827;color:#fff;border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.total .lbl{font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#94a3b8}
.total .val{font-size:23px;font-weight:700}
.pay{display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-top:1px solid #f1f5f9}
.pay .debt{color:#dc2626;font-weight:700}
.pay .ok{color:#15803d;font-weight:700}
.chart{overflow-x:auto}
.chart svg{min-width:520px}
.legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9}
.legend .li{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b}
.gen{font-size:13px;padding:7px 0;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:8px}
.gen:first-child{border-top:none}
.note{font-size:13px;color:#475569;white-space:pre-wrap}
.ftr{text-align:center;font-size:11px;color:#94a3b8;padding:18px 16px 0}
.sign{display:flex;gap:24px;margin-top:18px}
.sign div{flex:1;border-top:1px solid #cbd5e1;padding-top:5px;font-size:10px;color:#94a3b8}
@media print{body{background:#fff}.card,.total{box-shadow:none;break-inside:avoid}}`

// Маленький зуб с символом — для легенды
function legendIcon(id, color) {
  const geom = toothGeometry('molar', false)
  const shape = [
    ...geom.roots.map(d => `<path d="${d}" fill="#fff" stroke="#94a3b8" stroke-width="1.6" stroke-linejoin="round"/>`),
    `<path d="${geom.crown}" fill="#fff" stroke="#94a3b8" stroke-width="1.6" stroke-linejoin="round"/>`,
  ].join('')
  const sym = primitivesToSvgString(symbolPrimitives(id, color, geom, false))
  return `<svg viewBox="0 0 40 90" width="18" height="40" xmlns="http://www.w3.org/2000/svg">${shape}${sym}</svg>`
}

export function generateEstimateHtml({ patient, items: rawItems, total, settings, planName, paid }) {
  const items = (rawItems || []).map(normalizeItem)

  const chart = toothChartSvg(items)
  const legend = usedSymbols(items)

  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const clinic = settings?.clinicName || 'SmilePlan'

  const rows = items.map((it, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td><span class="scope">${esc(scopeLabel(it.scope, it.toothIds, it.scopeKey))}</span></td>
        <td>${esc(it.serviceName)}</td>
        <td class="r price">${rub(it.price)} ₽</td>
      </tr>`).join('')

  // Процедуры без привязки к зубам показываем отдельным блоком под картой
  const general = items.filter(i => !(i.toothIds?.length))
  const generalBlock = general.length === 0 ? '' : `
    <div class="card">
      <h2>Общие процедуры</h2>
      ${general.map(it => `<div class="gen"><span>${esc(it.serviceName)}</span><span class="price">${rub(it.price)} ₽</span></div>`).join('')}
    </div>`

  const paidNum = paid !== '' && paid != null ? Number(paid) : null
  const payBlock = paidNum === null ? '' : `
      <div class="pay"><span>Оплачено</span><span>${rub(paidNum)} ₽</span></div>
      ${paidNum >= total
        ? '<div class="pay"><span>Статус</span><span class="ok">Оплачено полностью</span></div>'
        : `<div class="pay"><span>Остаток</span><span class="debt">${rub(total - paidNum)} ₽</span></div>`}`

  const title = planName || 'Смета'

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(patient.fullName)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="hdr">
  <h1>${esc(title)}</h1>
  <div class="sub">${esc(clinic)}${settings?.doctorName ? ' · ' + esc(settings.doctorName) : ''} · ${esc(dateStr)}</div>
</div>
<div class="wrap">

  <div class="card">
    <h2>Пациент</h2>
    <div class="pat">${esc(patient.fullName)}</div>
    ${patient.phone ? `<div class="meta">${esc(patient.phone)}</div>` : ''}
  </div>

  ${settings?.textBefore ? `<div class="card"><div class="note">${esc(settings.textBefore)}</div></div>` : ''}

  <div class="card">
    <h2>Схема зубов</h2>
    <div class="chart">${chart.upper}${chart.lower}</div>
    ${legend.length === 0 ? '' : `<div class="legend">${
      legend.map(l => `<span class="li">${legendIcon(l.id, l.color)}${esc(l.label)}</span>`).join('')
    }</div>`}
  </div>

  ${generalBlock}

  <div class="card">
    <h2>План лечения</h2>
    <table>
      <thead><tr><th></th><th>Область</th><th>Процедура</th><th class="r">Цена</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="total">
    <span class="lbl">Итого</span>
    <span class="val">${rub(total)} ₽</span>
  </div>

  ${paidNum === null ? '' : `<div class="card">${payBlock}</div>`}

  ${settings?.textAfter ? `<div class="card"><div class="note">${esc(settings.textAfter)}</div></div>` : ''}

  <div class="card">
    <div class="sign"><div>Подпись врача</div><div>Подпись пациента</div></div>
  </div>

  <div class="ftr">${[clinic, settings?.phone, 'SmilePlan'].filter(Boolean).map(esc).join(' · ')}</div>
</div>
</body>
</html>`
}

export function downloadEstimateHtml(args) {
  const html = generateEstimateHtml(args)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const name = `Смета_${args.patient.fullName.replace(/\s/g, '_')}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.html`

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.open(url, '_blank')
  } else {
    const a = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
