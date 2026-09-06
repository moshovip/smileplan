const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
// llama-3.3-70b-versatile выведена из Groq — отвечала 404
const MODEL = 'openai/gpt-oss-120b'

export async function groqChat(apiKey, systemPrompt, userPrompt, maxTokens = 8192) {
  if (!apiKey) throw new Error('Groq API key не указан. Добавьте ключ в Настройках.')
  const resp = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ]
    })
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq API error ${resp.status}`)
  }
  const data = await resp.json()
  return data.choices[0].message.content.trim()
}

const ROADMAP_CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F0F4F8;color:#1a2332;padding-bottom:40px}input[type=radio]{position:absolute;left:-9999px;opacity:0}.hdr{background:#1B406B;color:#fff;padding:18px 16px 14px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.25)}.hdr h1{font-size:16px;font-weight:700}.hdr p{font-size:11px;opacity:.7;margin-top:2px}.nav{display:flex;overflow-x:auto;gap:6px;padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;-webkit-overflow-scrolling:touch;scrollbar-width:none;position:sticky;top:76px;z-index:99}.nav::-webkit-scrollbar{display:none}label.pill{flex-shrink:0;padding:5px 10px;border-radius:18px;font-size:11px;font-weight:600;border:2px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;white-space:nowrap;line-height:1.5;display:block}.wrap{padding:14px 16px}.page{display:none}.card{background:#fff;border-radius:16px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}.ch{padding:13px 16px 10px;border-bottom:1px solid #f1f5f9}.ct{font-size:15px;font-weight:700;color:#1B406B}.cs{font-size:11px;color:#94a3b8;margin-top:2px}.cb{padding:13px 16px}.cr{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f8fafc;gap:8px}.cr:last-child{border-bottom:none}.cl{font-size:13px;color:#334155;flex:1;line-height:1.4}.c2{font-size:11px;color:#94a3b8;margin-top:2px}.ib{background:#F0F7FF;border-left:3px solid #1B406B;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:10px;font-size:12px;color:#334155;line-height:1.6}.iw{background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:10px;font-size:12px;color:#334155;line-height:1.6}.ig2{background:#F0FDF4;border-left:3px solid #15803d;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:10px;font-size:12px;color:#334155;line-height:1.6}.bdg{display:inline-block;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;margin-bottom:8px}.g{background:#F0FDF4;color:#15803d}.o{background:#FFF7ED;color:#c2410c}.bl{background:#EFF6FF;color:#1d4ed8}.gt{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.1);margin-bottom:14px}p.tx{font-size:14px;line-height:1.7;color:#334155;margin-bottom:12px}p.tx:last-child{margin-bottom:0}.step{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9}.step:last-child{border-bottom:none}.step-num{width:28px;height:28px;background:#1B406B;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px}.step-body{flex:1}.step-title{font-size:13px;font-weight:700;color:#1B406B;margin-bottom:2px}.step-text{font-size:12px;color:#64748b;line-height:1.5}.timeline{background:#F8FAFF;border-radius:12px;padding:12px 14px;margin-top:12px}.tl-t{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}.tl-r{display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-bottom:1px solid #e8f0fe}.tl-r:last-child{border-bottom:none}.tl-d{font-size:12px;color:#1B406B;font-weight:700;white-space:nowrap;min-width:80px}.tl-v{font-size:12px;color:#334155}#t0:checked~.wrap #p0,#t1:checked~.wrap #p1,#t2:checked~.wrap #p2,#t3:checked~.wrap #p3,#t4:checked~.wrap #p4,#t5:checked~.wrap #p5,#t6:checked~.wrap #p6,#t7:checked~.wrap #p7{display:block}#t0:checked~.nav label[for=t0],#t1:checked~.nav label[for=t1],#t2:checked~.nav label[for=t2],#t3:checked~.nav label[for=t3],#t4:checked~.nav label[for=t4],#t5:checked~.nav label[for=t5],#t6:checked~.nav label[for=t6],#t7:checked~.nav label[for=t7]{border-color:#1B406B;background:#1B406B;color:#fff}`

const ROADMAP_JS = `(function(){var pages=document.querySelectorAll('.page');var pills=document.querySelectorAll('label.pill');function activate(i){pages.forEach(function(p){p.style.display='none';});pills.forEach(function(p){p.style.cssText='';});if(pages[i])pages[i].style.display='block';if(pills[i]){pills[i].style.borderColor='#1B406B';pills[i].style.background='#1B406B';pills[i].style.color='#fff';}window.scrollTo(0,0);}document.querySelectorAll('input[name="tab"]').forEach(function(t,i){t.addEventListener('change',function(){activate(i);});});activate(0);})();`

// Match doctor's voice to price list items
// Returns: [{scope, toothIds, toothId, serviceId, serviceName, price, icon, matchReason, confirmed}]
export async function matchProcedures(apiKey, voiceText, priceItems) {
  const listStr = priceItems.map(p =>
    `ID:${p.id} | "${p.name}" | ${p.category} | ${p.price}₽ | icon:${p.icon||'🦷'} | область:${p.defaultScope || 'tooth'}`
  ).join('\n')

  const systemPrompt = `Ты — стоматологический ИИ-ассистент. Из диктовки врача извлеки список процедур и сопоставь с прайс-листом.
Верни ТОЛЬКО валидный JSON-массив без markdown. Формат каждого объекта:
{"scope": "tooth", "toothIds": [46], "serviceId": "id_из_прайса", "serviceName": "название", "price": цена_число, "icon": "эмодзи", "matchReason": "краткое пояснение"}

Правила:
- scope — область применения процедуры, одно из:
  "tooth" (один зуб), "teeth" (несколько зубов), "sextant" (сегмент),
  "quadrant" (квадрант), "jaw" (челюсть), "mouth" (вся полость рта).
- toothIds: массив номеров зубов по FDI (11-48). Для "mouth" — пустой массив [].
- Если процедура не привязана к зубам (гигиена, отбеливание, ОПТГ, седация, приём) — scope "mouth", toothIds [].
- Для съёмного протеза, брекетов на одну челюсть — scope "jaw", toothIds — зубы этой челюсти.
- В прайсе у каждой позиции указана её обычная область — опирайся на неё, если врач не сказал иначе.
- Выбирай НАИБОЛЕЕ подходящий serviceId из прайса. Если точного совпадения нет — выбирай ближайшее.
- Если врач назвал несколько зубов для одной процедуры на зуб (пломба на 36 и 37) — создай отдельный объект на каждый зуб.
- matchReason: 1 фраза почему выбрана именно эта позиция прайса.`

  const userPrompt = `Прайс-лист клиники:\n${listStr}\n\nДиктовка врача:\n"${voiceText}"\n\nВерни JSON массив.`

  const raw = await groqChat(apiKey, systemPrompt, userPrompt, 2048)
  // Strip any markdown fences
  const cleaned = raw.replace(/^```json\n?/i,'').replace(/^```\n?/,'').replace(/\n?```$/,'').trim()
  try {
    const arr = JSON.parse(cleaned)
    return arr.map(item => {
      // Модель может вернуть старый формат (toothId) — приводим к toothIds
      const toothIds = Array.isArray(item.toothIds) ? item.toothIds.map(Number).filter(Boolean)
        : (item.toothId ? [Number(item.toothId)] : [])
      const scope = item.scope || (toothIds.length > 1 ? 'teeth' : toothIds.length === 1 ? 'tooth' : 'mouth')
      return { ...item, scope, toothIds, toothId: toothIds[0] ?? null, confirmed: true }
    })
  } catch {
    throw new Error('Groq вернул невалидный JSON. Попробуйте ещё раз.')
  }
}

export async function generateRoadmapHtml(apiKey, patientName, doctorText) {
  const systemPrompt = `Ты — генератор HTML дорожных карт лечения для стоматологических пациентов.
По диктовке врача создай полный мобильный HTML-файл дорожной карты. Возвращай ТОЛЬКО HTML без markdown.

HTML структура:
- <!DOCTYPE html><html lang="ru"><head> с charset, viewport, title "Дорожная карта — ПАЦИЕНТ", <style>CSS</style>
- <body>: radio inputs name="tab" id="t0..tN" (t0 checked)
- div.hdr: h1 "Дорожная карта лечения", p с именем пациента
- div.nav: label.pill для каждого таба (t0="💬 О лечении", t1="📋 Обзор", далее по этапам)
- div.wrap: div.page#p0..pN
- <script> в конце body

Страницы:
- p0: div.gt > p.tx — приветствие, тактика лечения, почему именно так
- p1: div.card с .step для каждого этапа (step-num + step-body > step-title + step-text)
- p2+: по одному этапу — div.card (.ch с .ct названием, .cs подзаголовком) + .cb с .cr процедурами + .timeline (.tl-r .tl-d .tl-v) + .ib/.iw/.ig2 пояснения

CSS (вставь дословно):
${ROADMAP_CSS}

JS (вставь в конец body):
<script>${ROADMAP_JS}</script>

Пиши по-русски. Тон: профессиональный, тёплый, понятный пациенту. Объясняй ПОЧЕМУ, не только ЧТО.`

  const userPrompt = `Пациент: ${patientName}

Диктовка врача:
${doctorText}

Создай полную дорожную карту лечения. Минимум 3 таба: О лечении, Обзор, + по этапу. Max 8 табов. Конкретные сроки в timeline (День 0, +2 нед, +3 мес).`

  let html = await groqChat(apiKey, systemPrompt, userPrompt, 8192)
  html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim()
  if (!html.toLowerCase().includes('<!doctype')) throw new Error('Groq вернул невалидный HTML')
  return html
}
