import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import robotoRegularUrl from 'roboto-fontface/fonts/roboto/Roboto-Regular.woff?url'
import robotoBoldUrl from 'roboto-fontface/fonts/roboto/Roboto-Bold.woff?url'
import { scopeLabelShort, normalizeItem } from '../data/toothScopes'

let _fontCache = null
async function loadFonts() {
  if (_fontCache) return _fontCache
  const [regular, bold] = await Promise.all([
    fetch(robotoRegularUrl).then(r => r.arrayBuffer()),
    fetch(robotoBoldUrl).then(r => r.arrayBuffer()),
  ])
  _fontCache = { regular, bold }
  return _fontCache
}

function hex(h) {
  return rgb(parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255)
}

const C = {
  brand:   hex('#1f6feb'),
  brandLt: hex('#dbeafe'),
  dark:    hex('#1d2433'),
  gray:    hex('#64748b'),
  grayLt:  hex('#f1f5f9'),
  grayMd:  hex('#e2e8f0'),
  green:   hex('#15803d'),
  greenLt: hex('#dcfce7'),
  white:   rgb(1,1,1),
  border:  hex('#e2e8f0'),
  red:     hex('#dc2626'),
}

// Icon → color mapping (since emoji don't render in Roboto)
const ICON_COLOR = {
  '🪥': '#10b981', '🔬': '#6366f1', '💎': '#ec4899',
  '🧪': '#f59e0b', '🦴': '#84cc16', '✂️': '#ef4444',
  '💉': '#3b82f6', '🪶': '#14b8a6', '🌿': '#22c55e',
  '🧬': '#8b5cf6', '🦷': '#1f6feb', '🏥': '#0891b2',
}
// Icon → short Latin label
const ICON_LABEL = {
  '🪥': 'ГИГ', '🔬': 'ДИА', '💎': 'ЭСТ', '🧪': 'ЛАБ',
  '🦴': 'ИМП', '✂️': 'ХИР', '💉': 'АНЕ', '🪶': 'ТЕР',
  '🌿': 'БИО', '🧬': 'ГЕН', '🦷': 'ОРТ', '🏥': 'КЛИ',
}

function drawRect(page, x, y, w, h, color) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}
function drawBorder(page, x, y, w, h, color, bw = 0.5) {
  page.drawRectangle({ x, y, width: w, height: h, color: rgb(0,0,0,0), borderColor: color, borderWidth: bw })
}
function drawLine(page, x1, y1, x2, y2, color = C.border, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })
}

// Draw a single tooth shape
// isUpper=true → crown tip points UP; false → points DOWN
// In pdf-lib drawSvgPath: x,y = origin; SVG y goes DOWN (positive = down on page)
function drawTooth(page, px, py, w, h, isUpper, isTreated) {
  const fill   = isTreated ? C.brandLt : C.grayLt
  const stroke = isTreated ? C.brand   : C.border
  const bw     = isTreated ? 1.5       : 0.5
  const tip    = h * 0.38

  let path
  if (isUpper) {
    // Crown tip at TOP (negative y in SVG = up on page)
    // Base at y=0 (py on page), tip at y=-h
    path = `M ${w/2},${-h} L ${w},${-tip} L ${w},0 L 0,0 L 0,${-tip} Z`
  } else {
    // Crown tip at BOTTOM (positive y in SVG = down on page)
    path = `M 0,0 L ${w},0 L ${w},${tip} L ${w/2},${h} L 0,${tip} Z`
  }

  page.drawSvgPath(path, { x: px, y: py, color: fill, borderColor: stroke, borderWidth: bw })

  // Highlight dot on treated teeth
  if (isTreated) {
    const dotY = isUpper ? py - h/2 : py + h/2
    page.drawCircle({ x: px + w/2, y: dotY, size: 2.5, color: C.brand })
  }
}

// Draw category icon badge (small colored box + label)
function drawIconBadge(page, x, y, icon, fontBold) {
  const color = ICON_COLOR[icon] || '#1f6feb'
  const label = ICON_LABEL[icon] || 'СТО'
  const c = hex(color)
  const lt = hex(color.replace(/[0-9a-f]{2}/gi, m => Math.min(255, parseInt(m,16) + 180).toString(16).padStart(2,'0')).replace(/#/, '#'))

  // Colored background pill
  drawRect(page, x, y - 8, 22, 10, hex(color + '22'))
  drawBorder(page, x, y - 8, 22, 10, c, 0.8)
  // Label text
  page.drawText(label, { x: x + 1.5, y: y - 6, size: 5.5, font: fontBold, color: c })
}

export async function generatePDF({ patient, items: rawItems, total, settings }) {
  const items = (rawItems || []).map(normalizeItem)
  const { regular, bold } = await loadFonts()

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const fontR = await pdfDoc.embedFont(regular, { subset: true })
  const fontB = await pdfDoc.embedFont(bold,    { subset: true })

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const L = 40, R = 555, W = R - L

  let y = height

  // ── HEADER ────────────────────────────────────────────────────────────
  drawRect(page, 0, height - 70, width, 70, hex('#111827'))

  // Tooth icon (simple shape)
  page.drawSvgPath('M 6,0 C 4,0 0,2 0,6 C -1,10 1,14 2,16 C 3,18 3,20 4,20 C 5,20 5.5,19 6,18 C 6.5,19 7,20 8,20 C 9,20 9,18 10,16 C 11,14 13,10 12,6 C 12,2 8,0 6,0 Z',
    { x: L, y: height - 18, scale: 1.4, color: C.brand })

  const clinicName = settings.clinicName || 'SmilePlan'
  page.drawText('SmilePlan', { x: L + 22, y: height - 32, size: 18, font: fontB, color: C.white })
  page.drawText(clinicName, { x: L + 22, y: height - 46, size: 9, font: fontR, color: hex('#94a3b8') })

  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  if (settings.doctorName) {
    page.drawText(`Врач: ${settings.doctorName}`, { x: R - 170, y: height - 32, size: 9, font: fontR, color: C.white })
  }
  page.drawText(dateStr, { x: R - 170, y: height - 46, size: 8, font: fontR, color: hex('#94a3b8') })

  y = height - 82

  // ── PATIENT ────────────────────────────────────────────────────────────
  drawRect(page, L, y - 36, W, 38, C.grayLt)
  drawBorder(page, L, y - 36, W, 38, C.border)
  page.drawText('ПАЦИЕНТ', { x: L + 8, y: y - 12, size: 7, font: fontB, color: C.gray })
  page.drawText(patient.fullName, { x: L + 8, y: y - 25, size: 13, font: fontB, color: C.dark })
  if (patient.phone) page.drawText(patient.phone, { x: R - 140, y: y - 25, size: 9, font: fontR, color: C.gray })
  y -= 48

  // ── INTRO TEXT ─────────────────────────────────────────────────────────
  if (settings.textBefore) {
    y -= 6
    const lines = wrapText(settings.textBefore, fontR, 9, W - 16)
    for (const l of lines) {
      page.drawText(l, { x: L, y, size: 9, font: fontR, color: C.gray })
      y -= 13
      if (y < 150) break
    }
    y -= 6
  }

  // ── TOOTH CHART ────────────────────────────────────────────────────────
  // Позиция может покрывать несколько зубов (секстант, челюсть и т.д.)
  const treated = new Set()
  for (const it of items) {
    const ids = it.toothIds?.length ? it.toothIds : (it.toothId ? [it.toothId] : [])
    for (const id of ids) treated.add(Number(id))
  }

  const upperRow = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
  const lowerRow = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

  // Width per tooth
  const totalGap = 15  // gap between upper halves
  const tw = (W - totalGap) / 16 - 1
  const th = 24

  // Section label
  page.drawText('СХЕМА ЗУБОВ', { x: L, y: y - 2, size: 7, font: fontB, color: C.gray })
  y -= 14

  // Upper arch
  let tx = L
  for (let i = 0; i < upperRow.length; i++) {
    const fdi = upperRow[i]
    if (i === 8) tx += totalGap  // gap between left/right
    drawTooth(page, tx, y, tw, th, true, treated.has(fdi))
    const ns = String(fdi)
    const nw = fontR.widthOfTextAtSize(ns, 5)
    page.drawText(ns, { x: tx + (tw - nw)/2, y: y - th - 5, size: 5, font: fontR,
      color: treated.has(fdi) ? C.brand : C.gray })
    tx += tw + 1
  }
  y -= th + 14

  // Gap label (midline)
  drawLine(page, L + W/2 - 0.5, y + 10, L + W/2 - 0.5, y - 10, C.grayMd, 1)

  // Lower arch
  tx = L
  for (let i = 0; i < lowerRow.length; i++) {
    const fdi = lowerRow[i]
    if (i === 8) tx += totalGap
    // Numbers above lower teeth
    const ns = String(fdi)
    const nw = fontR.widthOfTextAtSize(ns, 5)
    page.drawText(ns, { x: tx + (tw - nw)/2, y: y + 2, size: 5, font: fontR,
      color: treated.has(fdi) ? C.brand : C.gray })
    drawTooth(page, tx, y - 8, tw, th, false, treated.has(fdi))
    tx += tw + 1
  }
  y -= th + 22

  // Legend
  drawRect(page, L, y - 10, 10, 9, C.brandLt)
  drawBorder(page, L, y - 10, 10, 9, C.brand, 1)
  page.drawText('— выбранный зуб', { x: L + 14, y: y - 7, size: 7, font: fontR, color: C.gray })
  y -= 18

  // ── TREATMENT TABLE ────────────────────────────────────────────────────
  drawLine(page, L, y, R, y, C.border)
  y -= 2
  page.drawText('ПЛАН ЛЕЧЕНИЯ', { x: L, y: y - 12, size: 10, font: fontB, color: C.dark })
  y -= 16

  // Table header
  const cols = { badge: L, tooth: L + 30, name: L + 125, price: R - 5 }
  drawRect(page, L, y - 16, W, 18, hex('#111827'))
  page.drawText('Область',   { x: cols.tooth + 2, y: y - 11, size: 8, font: fontB, color: C.white })
  page.drawText('Процедура', { x: cols.name + 2,  y: y - 11, size: 8, font: fontB, color: C.white })
  page.drawText('Цена',      { x: cols.price - fontB.widthOfTextAtSize('Цена', 8) - 2, y: y - 11, size: 8, font: fontB, color: C.white })
  y -= 18

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowH = 20
    if (y < 90) {
      page.drawText(`... ещё ${items.length - i} процедур`, { x: cols.name, y: y - 13, size: 8, font: fontR, color: C.gray })
      y -= rowH; break
    }

    drawRect(page, L, y - rowH, W, rowH, i % 2 === 0 ? C.white : C.grayLt)

    // Icon badge
    drawIconBadge(page, cols.badge + 2, y - 5, item.icon || '🦷', fontB)

    // Область применения (зуб, сегмент, челюсть, полость рта)
    let toothStr = scopeLabelShort(item.scope, item.toothIds, item.scopeKey)
    const scopeMaxW = cols.name - cols.tooth - 6
    while (toothStr.length > 3 && fontB.widthOfTextAtSize(toothStr, 8) > scopeMaxW) toothStr = toothStr.slice(0, -1)
    page.drawText(toothStr, { x: cols.tooth + 3, y: y - 13, size: 8, font: fontB, color: C.brand })

    // Service name (truncated)
    const maxW = cols.price - cols.name - 60
    let name = item.serviceName
    while (name.length > 3 && fontR.widthOfTextAtSize(name, 8.5) > maxW) name = name.slice(0, -1)
    if (name !== item.serviceName) name += '…'
    page.drawText(name, { x: cols.name + 3, y: y - 13, size: 8.5, font: fontR, color: C.dark })

    // Price
    const ps = item.price.toLocaleString('ru-RU') + ' р.'
    const pw = fontB.widthOfTextAtSize(ps, 9)
    page.drawText(ps, { x: cols.price - pw - 3, y: y - 13, size: 9, font: fontB, color: C.dark })

    drawLine(page, L, y - rowH, R, y - rowH, C.border)
    y -= rowH
  }

  // ── TOTAL ──────────────────────────────────────────────────────────────
  drawRect(page, L, y - 24, W, 24, hex('#111827'))
  page.drawText('ИТОГО:', { x: L + 8, y: y - 16, size: 10, font: fontB, color: C.white })
  const ts = total.toLocaleString('ru-RU') + ' р.'
  const tw2 = fontB.widthOfTextAtSize(ts, 13)
  page.drawText(ts, { x: R - tw2 - 8, y: y - 17, size: 13, font: fontB, color: C.white })
  y -= 34

  // ── TEXT AFTER ─────────────────────────────────────────────────────────
  if (settings.textAfter && y > 120) {
    y -= 8
    drawLine(page, L, y, R, y)
    y -= 14
    for (const l of wrapText(settings.textAfter, fontR, 8.5, W)) {
      if (y < 80) break
      page.drawText(l, { x: L, y, size: 8.5, font: fontR, color: C.gray })
      y -= 12
    }
  }

  // ── SIGNATURES ─────────────────────────────────────────────────────────
  if (y > 80) {
    y = Math.min(y, 100)
    drawLine(page, L, y, L + 160, y)
    page.drawText('Подпись врача', { x: L, y: y - 11, size: 7, font: fontR, color: C.gray })
    drawLine(page, R - 160, y, R, y)
    page.drawText('Подпись пациента', { x: R - 160, y: y - 11, size: 7, font: fontR, color: C.gray })
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────
  drawRect(page, 0, 0, width, 28, hex('#111827'))
  const footer = [settings.clinicName, settings.phone, 'SmilePlan'].filter(Boolean).join('  ·  ')
  const fw = fontR.widthOfTextAtSize(footer, 7)
  page.drawText(footer, { x: (width - fw) / 2, y: 10, size: 7, font: fontR, color: hex('#94a3b8') })

  // ── SAVE ───────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const filename = `Смета_${patient.fullName.replace(/\s/g,'_')}_${new Date().toLocaleDateString('ru-RU').replace(/\./g,'-')}.pdf`

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.open(url, '_blank')
  } else {
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function wrapText(text, font, size, maxWidth) {
  const lines = []
  for (const raw of text.split('\n')) {
    const words = raw.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (font.widthOfTextAtSize(test, size) > maxWidth) { lines.push(line); line = word }
      else line = test
    }
    if (line) lines.push(line)
  }
  return lines
}
