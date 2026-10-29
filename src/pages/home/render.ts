import { mediaUrl } from '@/api/home';
import type { HomeContent, FleetItem, MasterItem, VideoItem, FaqItem, LocationItem, DemoSettings } from '@/api/home';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const swap = (html: string, re: RegExp, replacement: string) => (re.test(html) ? html.replace(re, () => replacement) : html);

const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
const CLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const PHONE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6.6 3.6h2.9l1.4 3.5-1.8 1.4a12 12 0 005.4 5.4l1.4-1.8 3.5 1.4v2.9a2 2 0 01-2.2 2A16.4 16.4 0 014.6 5.8a2 2 0 012-2.2z"/></svg>';

const NUM_WORDS = ['Ноль', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять', 'Десять'];

function addressWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'адрес';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'адреса';
  return 'адресов';
}

export const locKey = (l: { id: number }) => `l${l.id}`;

function fleetSection(items: FleetItem[]): string {
  const groups: string[] = [];
  items.forEach(i => { if (i.group && !groups.includes(i.group)) groups.push(i.group); });
  const slug = (g: string) => `g${groups.indexOf(g)}`;
  const tabs = ['<button class="tab" type="button" role="tab" aria-selected="true" data-f="all">Все</button>']
    .concat(groups.map(g => `<button class="tab" type="button" role="tab" aria-selected="false" data-f="${slug(g)}">${esc(g)}</button>`))
    .join('\n        ');
  const cards = items.map(i =>
    `<figure class="fcard${i.wide ? ' wide' : ''}" data-k="${i.group ? slug(i.group) : 'none'}"><img src="${esc(mediaUrl(i.image_url))}" alt="${esc(i.title)}" loading="lazy"><figcaption><b>${esc(i.title)}</b><span>${esc(i.subtitle)}</span></figcaption></figure>`
  ).join('\n          ');
  return `<section id="fleet" style="padding-top:0">
    <div class="wrap">
      <div class="kicker rv">Автопарк</div>
      <h2 class="rv">Учитесь на машинах школы</h2>
      <div class="tabs" role="tablist" aria-label="Тип автомобиля" id="tabs">
        ${tabs}
      </div>
      <div class="rail-box">
        <div class="rail" id="rail">
          ${cards}
        </div>
      </div>
      <div class="arrows"><button class="arrow" id="prev" type="button" aria-label="Назад">←</button><button class="arrow" id="next" type="button" aria-label="Вперёд">→</button></div>
    </div>
  </section>`;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function mastersSection(items: MasterItem[]): string {
  const featuredCount = items.filter(m => m.featured && m.photo_url).length;
  const auto = !(items.length === 4 && featuredCount === 1 && items[0].featured && items[0].photo_url);
  let plain = 0;
  const cards = items.map(m => {
    const tags = (m.tags || []).filter(Boolean).map(t => `<span>${esc(t)}</span>`).join('');
    const years = m.years ? `<span class="years">${esc(m.years)}</span>` : '';
    const body = (cta: string) => `<div class="master-body">
            <h3>${esc(m.name)}</h3>
            ${m.role ? `<p class="role">${esc(m.role)}</p>` : ''}
            ${m.quote ? `<p class="quote">${esc(m.quote)}</p>` : ''}
            ${tags ? `<div class="tags">${tags}</div>` : ''}
            <a class="master-cta" href="#lead">${cta}</a>
          </div>`;
    if (m.featured && m.photo_url) {
      return `<article class="master featured rv">
          <img src="${esc(mediaUrl(m.photo_url))}" alt="${esc(m.name)}, мастер автошколы Вектор" loading="lazy">
          ${years}
          ${body(`Записаться к мастеру →`)}
        </article>`;
    }
    plain += 1;
    const tone = `m${((plain - 1) % 3) + 2}`;
    const photo = m.photo_url
      ? `<div class="master-photo ${tone}"><img src="${esc(mediaUrl(m.photo_url))}" alt="${esc(m.name)}" loading="lazy">${years}</div>`
      : `<div class="master-photo ${tone}">${years}<span class="monogram">${esc(initials(m.name))}</span></div>`;
    return `<article class="master rv">
          ${photo}
          ${body('Записаться к мастеру →')}
        </article>`;
  }).join('\n        ');
  return `<section id="masters" style="padding-top:0">
    <div class="glow r" style="width:440px;height:440px;right:-100px;top:12%"></div>
    <div class="wrap">
      <div class="kicker rv">Мастера школы</div>
      <h2 class="rv">Люди, которые учат вас водить</h2>
      <p class="sub rv">Практикующие инструкторы с опытом от 9 до 17 лет. Сначала разбираем теорию и площадку, потом выходим в город — спокойно и по шагам.</p>
      <div class="masters${auto ? ' auto' : ''}">
        ${cards}
      </div>
    </div>
  </section>`;
}

function videoBox(v: VideoItem): string {
  const src = mediaUrl(v.video_url);
  const poster = v.poster_url ? ` poster="${esc(mediaUrl(v.poster_url))}"` : '';
  const frag = src && !src.includes('#') ? '#t=0.1' : '';
  const video = `<video data-site-video src="${esc(src)}${frag}"${poster} playsinline preload="metadata" controlslist="nodownload" aria-label="${esc(v.title)}"></video>`;
  const btn = `<button class="vplay" type="button" data-play aria-label="Смотреть: ${esc(v.title)}"><span>${PLAY_SVG}</span></button>`;
  if (v.format === 'vertical') {
    return `<div class="reel rv">${v.title ? `<small>${esc(v.title)}</small>` : ''}${video}${btn}</div>`;
  }
  return `<div class="vbox rv">${video}${btn}<div class="cap">${v.title ? `<h3>${esc(v.title)}</h3>` : ''}${v.caption ? `<p>${esc(v.caption)}</p>` : ''}</div></div>`;
}

function videosSection(items: VideoItem[]): string {
  const classic = items.length === 2 && items[0].format !== 'vertical' && items[1].format === 'vertical';
  return `<section style="padding-top:0">
    <div class="glow r" style="width:440px;height:440px;right:-120px;top:0"></div>
    <div class="wrap">
      <div class="kicker rv">В движении</div>
      <h2 class="rv">Школа в кадре</h2>
      <div class="cinema${classic ? '' : ' auto'}">
        ${items.map(videoBox).join('\n        ')}
      </div>
    </div>
  </section>`;
}

function demoSection(d: DemoSettings): string {
  const src = mediaUrl(d.video_url);
  const answers = (d.answers || []).filter(Boolean).map((a, i) => `<div class="demo-ans"><em>${i + 1}</em><span>${esc(a)}</span></div>`).join('\n            ');
  return `<section id="demo" style="padding-top:0">
    <div class="glow c" style="width:420px;height:420px;right:-80px;top:10%"></div>
    <div class="wrap">
      <div class="kicker rv">Демо-доступ</div>
      <h2 class="rv">Загляните на занятие до записи</h2>
      <p class="sub">Фрагмент видеоурока и вопрос из билетов ПДД. В демо материалы только для просмотра: видео идёт без управления, ответы не выбираются. Полный доступ — в личном кабинете ученика.</p>

      <div class="demo-grid">
        <div class="demo-video rv">
          ${src ? `<video src="${esc(src)}" autoplay muted loop playsinline preload="auto" aria-label="${esc(d.video_title)}"></video>` : ''}
          <div class="demo-top"><span class="demo-badge"><i></i>демо · видеоурок</span><span class="demo-badge">без звука</span></div>
          <div class="demo-play" aria-hidden="true"><span>${PLAY_SVG}</span></div>
          <div class="demo-cap"><h3>${esc(d.video_title)}</h3><p>${esc(d.video_caption)}</p></div>
        </div>

        <div class="demo-test rv" aria-label="Демонстрационный вопрос ПДД, ответы недоступны">
          <div class="demo-test-head"><span>${esc(d.q_label)}</span><b>${esc(d.q_tag)}</b></div>
          <p class="demo-q">${esc(d.question)}</p>
          <div class="demo-answers">
            ${answers}
          </div>
          <div class="demo-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>Демо-режим: ответы и следующие вопросы недоступны</div>
        </div>
      </div>

      <div class="demo-actions">
        <button class="btn" type="button" data-login>Войти в личный кабинет</button>
        <a class="btn ghost" href="#lead">Получить доступ</a>
      </div>
      <div class="demo-meta">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M3 9h18"/></svg>Видеоуроки по темам</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>Билеты ПДД с разбором</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 17l5-5 4 3 7-7"/><path d="M14 8h6v6"/></svg>Прогресс в кабинете</span>
      </div>
    </div>
  </section>`;
}

function faqSection(items: FaqItem[]): string {
  const list = items.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('\n        ');
  return `<section id="faq" style="padding-top:0">
    <div class="wrap">
      <div class="kicker rv">Вопросы</div>
      <h2 class="rv">Коротко о главном</h2>
      <div style="margin-top:40px">
        ${list}
      </div>
    </div>
  </section>`;
}

const gisPoint = (l: LocationItem) => `https://2gis.ru/kurgan?m=${l.lng},${l.lat}/17`;
const gisRoute = (l: LocationItem) => `https://2gis.ru/kurgan/routeSearch/rsType/car/to/${l.lng},${l.lat}`;

function branchesSection(items: LocationItem[]): string {
  const n = items.length;
  const title = `${NUM_WORDS[n] || n} ${addressWord(n)} в Кургане`;
  const cards = items.map(l => `<article class="branch rv" data-branch="${locKey(l)}">
            <div class="branch-top"><b><i></i>${esc(l.name)}</b><em>${esc(l.kind)}</em></div>
            <p class="addr">${esc(l.address)}</p>
            <div class="meta">
              <span>${CLOCK_SVG}${esc(l.hours)}</span>
              <span>${PHONE_SVG}${esc(l.phone)}</span>
            </div>
            <div class="branch-actions">
              <a class="go" href="${esc(gisRoute(l))}" target="_blank" rel="noopener">Маршрут ↗</a>
              <button class="go" type="button" data-pick-branch="${locKey(l)}">Записаться сюда →</button>
            </div>
          </article>`).join('\n\n          ');
  return `<section id="branches" style="padding-top:0">
    <div class="glow b" style="width:460px;height:460px;left:20%;bottom:-10%"></div>
    <div class="wrap">
      <div class="kicker rv">Филиалы</div>
      <h2 class="rv">${esc(title)}</h2>
      <p class="sub">Выберите ближайший адрес — администратор подберёт время и мастера. На карте отмечены все точки, маршрут строится в один клик.</p>

      <div class="branches-layout">
        <div class="map-shell rv" aria-label="Карта филиалов автошколы Вектор 45 в Кургане">
          <div class="real-map" id="real-map"></div>
          <div class="map-top"><i></i>филиалы на карте</div>
          <a class="map-open" href="https://2gis.ru/kurgan/search/${encodeURIComponent('автошкола Вектор')}" target="_blank" rel="noopener">2ГИС ↗</a>
        </div>

        <div class="branch-list">
          ${cards}

          <p class="branch-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11.4 12h1.2v5"/></svg>
            Режим работы может меняться в праздники — уточните у администратора при записи.
          </p>
        </div>
      </div>
    </div>
  </section>`;
}

export function branchTexts(items: LocationItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  items.forEach(l => { out[locKey(l)] = l.address; });
  return out;
}

export function buildHomeHtml(base: string, home: HomeContent | null): string {
  if (!home) return base;
  const { items, settings } = home;
  let html = base;

  if (items.fleet?.length) html = swap(html, /<section id="fleet"[^>]*>[\s\S]*?<\/section>/, fleetSection(items.fleet));
  if (items.masters?.length) html = swap(html, /<section id="masters"[^>]*>[\s\S]*?<\/section>/, mastersSection(items.masters));
  if (items.videos?.length) html = swap(html, /<section style="padding-top:0">[\s\S]*?<\/section>/, videosSection(items.videos));
  if (settings.demo) html = swap(html, /<section id="demo"[^>]*>[\s\S]*?<\/section>/, demoSection(settings.demo));
  if (items.faq?.length) html = swap(html, /<section id="faq"[^>]*>[\s\S]*?<\/section>/, faqSection(items.faq));

  const locs = items.locations || [];
  if (locs.length) {
    html = swap(html, /<section id="branches"[^>]*>[\s\S]*?<\/section>/, branchesSection(locs));

    const strip = locs.map(l => `<a class="bs-link" href="#branches" data-branch-link="${locKey(l)}"><i></i><span class="bs-long">${esc(l.address)}</span><span class="bs-short">${esc(l.name)}</span></a>`).join('\n        ');
    html = swap(html, /<nav class="branch-strip"[\s\S]*?<\/nav>/,
      `<nav class="branch-strip" aria-label="Филиалы автошколы">\n        <span class="bs-label">Филиалы</span>\n        ${strip}\n      </nav>`);

    const mb = locs.map(l => `<a href="#branches" data-branch-link="${locKey(l)}"><i></i>${esc(l.name)} · ${esc(l.address)}</a>`).join('\n        ');
    html = swap(html, /<div class="mbranches"[\s\S]*?<\/div>/, `<div class="mbranches" aria-label="Филиалы">\n        ${mb}\n      </div>`);

    const opts = locs.map(l => `<option value="${locKey(l)}">${esc(l.name)} — ${esc(l.address)}</option>`).join('\n              ');
    html = swap(html, /(<select id="f-branch"[^>]*>)[\s\S]*?(<\/select>)/,
      `<select id="f-branch" name="branch">\n              <option value="">Выберите филиал</option>\n              ${opts}\n            </select>`);

    html = swap(html, /Филиалы <span>[^<]*<\/span>/, `Филиалы <span>${locs.length} ${addressWord(locs.length)}</span>`);
  }

  if (items.fleet?.length) {
    const groups = Array.from(new Set(items.fleet.map(f => f.group).filter(Boolean))).join(' · ');
    if (groups) html = swap(html, /Автопарк <span>[^<]*<\/span>/, `Автопарк <span>${esc(groups)}</span>`);
  }
  return html;
}
