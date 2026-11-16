const $ = s => document.querySelector(s);
const body = $('#body');
const KEY = 'review-editor-v1';
const ASP = ['Сюжет', 'Графика', 'Геймплей', 'Оптимизация', 'Локализация'];
const SC = [['💀','Провал'],['🥱','Очень слабо'],['😖','Плохо'],['😕','Слабо'],['😐','Средне'],['🙂','Неплохо'],['😊','Хорошо'],['🔥','Отлично'],['💎','Шедевр'],['🏆','Эталон']];
const REC = {yes:'Рекомендую', neutral:'Нейтрально', no:'Не рекомендую'};
const RECI = {yes:'👍', neutral:'➖', no:'👎'};

let S = {
  reviews: [],
  cur: null,
  sites: [
    {name:'Backloggd', host:'backloggd.com', search:'https://www.backloggd.com/search/games/?q={q}'},
    {name:'Steam', host:'store.steampowered.com', search:'https://store.steampowered.com/search/?term={q}'},
    {name:'YouTube', host:'youtube.com youtu.be', search:'https://www.youtube.com/results?search_query={q}'},
    {name:'Steam Workshop', host:'steamcommunity.com', search:'https://steamcommunity.com/workshop/browse/?searchtext={q}'}
  ]
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cur = () => S.reviews.find(r => r.id === S.cur);
const blank = () => ({id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), title:'', body:'<p><br></p>', game:null, rec:'neutral', score:0, aspects: ASP.map(n => ({name:n, v:'unsure'})), pros:[], cons:[], updated: Date.now()});

const hasContent = r => !!r && !!(r.title || r.game || /<img|<hr|<li|<blockquote|<h[123]/.test(r.body || '') || (r.body || '').replace(/<[^>]*>|&nbsp;|\s/g, '') || (r.pros || []).some(Boolean) || (r.cons || []).some(Boolean));
function load(){ try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) { S.reviews = (d.reviews || []).filter(hasContent); if (d.sites && d.sites.length) S.sites = d.sites; } } catch(e){} }
function store(){ try { localStorage.setItem(KEY, JSON.stringify({reviews:S.reviews, sites:S.sites})); } catch(e){ toast('Не удалось сохранить: в хранилище браузера не хватает места'); } }

let tt;
function toast(m){ const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); }

function touch(){
  const r = cur(); if (!r) return;
  r.title = $('#title').value; r.body = body.innerHTML; r.updated = Date.now();
  clearTimeout(touch.t); touch.t = setTimeout(() => { store(); renderList(); }, 400);
}

function open(id){
  if (cur()) store();
  S.cur = id; const r = cur();
  $('#title').value = r.title; body.innerHTML = r.body;
  renderAll();
}
function renderAll(){ renderList(); renderGame(); renderStars(); renderRec(); renderAsp(); renderPC(); }

function renderList(){
  const q = $('#q').value.trim().toLowerCase(); const ul = $('#list'); ul.textContent = '';
  [...S.reviews].sort((a,b) => b.updated - a.updated)
    .filter(r => (r.title + ' ' + (r.game?.name || '')).toLowerCase().includes(q))
    .forEach(r => {
      const li = document.createElement('li'); if (r.id === S.cur) li.className = 'on';
      const t = document.createElement('div'); t.className = 't'; t.textContent = r.title || r.game?.name || 'Без названия';
      const m = document.createElement('div'); m.className = 'm';
      m.textContent = (r.game && r.title ? r.game.name + ' · ' : '') + (r.score ? r.score + '/10 · ' : '') + new Date(r.updated).toLocaleDateString('ru-RU');
      li.append(t, m); li.onclick = () => open(r.id); ul.append(li);
    });
  if (!ul.children.length) { const e = document.createElement('li'); e.className = 'm'; e.textContent = 'Обзоров пока нет'; ul.append(e); }
}

function renderGame(){
  const g = cur().game, box = $('#gameLine'); box.textContent = '';
  box.append('Игра обзора: ');
  if (g) { const a = document.createElement('a'); a.href = g.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = g.name; box.append(a, ' · ' + g.site); }
  else box.append('не выбрана');
  const b = document.createElement('button'); b.textContent = 'Выбрать игру'; b.onclick = () => openGame(); box.append(' ', b);
}

function renderStars(p){
  const r = cur(); if (!r) return; const box = $('#stars');
  if (!box.children.length) for (let i = 1; i <= 10; i++) {
    const s = document.createElement('span'); s.textContent = '★'; s.title = SC[i-1][1];
    s.onmouseenter = () => renderStars(i);
    s.onmouseleave = () => renderStars();
    s.onclick = () => { const c = cur(); c.score = c.score === i ? 0 : i; touch(); renderStars(); pop(); };
    box.append(s);
  }
  const n = p ?? r.score;
  [...box.children].forEach((s, i) => s.classList.toggle('on', i < n));
  $('#sico').textContent = n ? SC[n-1][0] : '☆';
  $('#stxt').textContent = n ? `${n}/10 — ${SC[n-1][1]}` : 'Оценка не выставлена';
}
function pop(){ const e = $('#sico'); e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }

function renderRec(){
  const box = $('#recs'); box.textContent = '';
  for (const k of ['yes','neutral','no']) {
    const b = document.createElement('button'); b.textContent = RECI[k] + ' ' + REC[k];
    if (cur().rec === k) b.classList.add('on');
    b.onclick = () => { cur().rec = k; touch(); renderRec(); };
    box.append(b);
  }
}

function renderAsp(){
  const box = $('#asp'); box.textContent = '';
  cur().aspects.forEach((a, i) => {
    const row = document.createElement('div'); row.className = 'asp';
    const n = document.createElement('span'); n.textContent = a.name;
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="unsure">Не уверен</option><option value="na">Не применимо</option>' +
      [...Array(10)].map((_, k) => `<option value="${k+1}">${k+1} / 10</option>`).join('');
    sel.value = String(a.v);
    sel.onchange = () => { a.v = (sel.value === 'unsure' || sel.value === 'na') ? sel.value : +sel.value; touch(); };
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.title = 'Убрать аспект';
    x.onclick = () => { cur().aspects.splice(i, 1); touch(); renderAsp(); };
    row.append(n, sel, x); box.append(row);
  });
}
$('#addAsp').onclick = () => {
  const v = $('#newAsp').value.trim(); if (!v) return;
  cur().aspects.push({name:v, v:'unsure'}); $('#newAsp').value = ''; touch(); renderAsp();
};

function pc(key, focusLast){
  const box = $('#' + key), list = cur()[key]; box.textContent = '';
  list.forEach((t, i) => {
    const row = document.createElement('div'); row.className = 'it';
    const s = document.createElement('span'); s.className = 'sg ' + (key === 'pros' ? 'plus' : 'minus'); s.textContent = key === 'pros' ? '+' : '−';
    const inp = document.createElement('input'); inp.value = t; inp.placeholder = key === 'pros' ? 'Что понравилось' : 'Что не понравилось';
    inp.oninput = () => { list[i] = inp.value; touch(); };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); list.splice(i+1, 0, ''); touch(); pc(key, i+1); } };
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '×';
    x.onclick = () => { list.splice(i, 1); touch(); pc(key); };
    row.append(s, inp, x); box.append(row);
  });
  if (focusLast === true) box.querySelector('.it:last-child input')?.focus();
  if (typeof focusLast === 'number') box.children[focusLast]?.querySelector('input')?.focus();
}
function renderPC(){ pc('pros'); pc('cons'); }
$('#addPro').onclick = () => { cur().pros.push(''); touch(); pc('pros', true); };
$('#addCon').onclick = () => { cur().cons.push(''); touch(); pc('cons', true); };

/* ---------- Редактирование текста ---------- */
let saved = null;
document.addEventListener('selectionchange', () => {
  const s = getSelection();
  if (s.rangeCount && body.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange();
  bubble();
});
function restore(){ body.focus(); const s = getSelection(); s.removeAllRanges(); if (saved) s.addRange(saved); }
function sync(){ touch(); bubble(); }
function run(c, v){ restore(); document.execCommand(c, false, v); sync(); }
function ins(h){ restore(); document.execCommand('insertHTML', false, h); sync(); }
function wrap(tag, cls){
  restore(); const s = getSelection();
  if (!s.rangeCount || s.isCollapsed) { toast('Сначала выделите текст'); return; }
  const r = s.getRangeAt(0), el = document.createElement(tag); if (cls) el.className = cls;
  try { r.surroundContents(el); } catch(e) { el.append(r.extractContents()); r.insertNode(el); }
  s.removeAllRanges(); sync();
}

function bubble(){
  const s = getSelection(), b = $('#bubble');
  if (!s.rangeCount || s.isCollapsed || !body.contains(s.anchorNode)) { b.style.display = 'none'; return; }
  const r = s.getRangeAt(0).getBoundingClientRect();
  b.style.display = 'flex';
  const w = b.offsetWidth, h = b.offsetHeight;
  b.style.left = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width/2 - w/2)) + 'px';
  b.style.top = (r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8) + 'px';
}
$('#scroll').addEventListener('scroll', () => $('#bubble').style.display = 'none');

const C = {
  bold: () => run('bold'), italic: () => run('italic'), underline: () => run('underline'), strike: () => run('strikeThrough'),
  code: () => wrap('code'), ul: () => run('insertUnorderedList'), ol: () => run('insertOrderedList'),
  left: () => run('justifyLeft'), center: () => run('justifyCenter'), right: () => run('justifyRight'),
  undo: () => run('undo'), redo: () => run('redo'),
  hr: () => ins('<hr><p><br></p>'), spoiler: () => wrap('span', 'spoiler'),
  link: openLink, game: () => openGame(),
  img: () => { restore(); $('#file').click(); }
};
document.querySelectorAll('[data-c]').forEach(b => {
  b.onmousedown = e => e.preventDefault();
  b.onclick = () => C[b.dataset.c]();
});
$('#style').onchange = e => { const v = e.target.value; restore(); document.execCommand('formatBlock', false, v); sync(); e.target.value = 'p'; };

body.addEventListener('input', () => touch());
body.addEventListener('click', e => { const s = e.target.closest('.spoiler'); if (s && getSelection().isCollapsed) s.classList.toggle('open'); });
$('#title').addEventListener('input', () => touch());
$('#title').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });
$('#q').addEventListener('input', renderList);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- Модальные окна ---------- */
function modal(html){ $('#box').innerHTML = html; $('#modal').classList.add('show'); $('#box input, #box select')?.focus(); }
function closeModal(){ $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function openLink(){
  restore(); const s = getSelection();
  if (!s.rangeCount || s.isCollapsed) { toast('Выделите текст, к которому нужна ссылка'); return; }
  modal(`<h3>Ссылка</h3><label>Адрес страницы</label><input id="lu" placeholder="https://">
    <div class="acts"><button id="lc">Отмена</button><button id="lok" class="on">Вставить</button></div>`);
  $('#lc').onclick = closeModal;
  $('#lok').onclick = () => { let u = $('#lu').value.trim(); if (!u) return; if (!/^https?:/.test(u)) u = 'https://' + u; closeModal(); run('createLink', u); };
}

function siteMatch(site, url){
  try { const h = new URL(url).hostname; return site.host.split(' ').some(x => h === x || h.endsWith('.' + x)); } catch(e) { return false; }
}
function nameFrom(u){
  try {
    const x = new URL(u);
    const seg = decodeURIComponent(x.pathname).split('/').filter(s => s && !/^\d+$/.test(s) && !['app','games','game','sharedfiles','filedetails','workshop'].includes(s));
    return (seg[seg.length-1] || '').replace(/[-_+]/g, ' ').trim() || x.hostname;
  } catch(e) { return ''; }
}
const hue = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 38% 36%)`; };
const art = (a, b) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="240" fill="url(#g)"/><circle cx="300" cy="80" r="44" fill="#fff" opacity=".22"/><path d="M0 190Q100 140 200 180T400 170V240H0Z" fill="#000" opacity=".35"/></svg>`);
const cardHtml = g => {
  const cov = g.cover ? `<img src="${g.cover}" alt="">` : esc(((g.name || '?').trim()[0]) || '?').toUpperCase();
  return `<div class="gcard" contenteditable="false" data-name="${esc(g.name)}" data-url="${esc(g.url)}" data-desc="${esc(g.desc || '')}"><div class="cov" style="--c:${hue(g.name || '')}">${cov}</div><div><span class="gsite">${esc(g.site || '')}</span><a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.name)}</a>${g.desc ? `<div class="gd">${esc(g.desc)}</div>` : ''}</div></div><p><br></p>`;
};

let pendingCover = null;
function openGame(){
  pendingCover = null;
  restore(); const sel = getSelection(); const hasSel = sel.rangeCount && !sel.isCollapsed;
  modal(`<h3>Игра</h3>
    <label>Сайт</label>
    <select id="gs">${S.sites.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join('')}</select>
    <label>Поиск на выбранном сайте (откроется в новой вкладке)</label>
    <div class="sline"><input id="gq" placeholder="Название игры"><button id="gsr">Искать</button></div>
    <label>Ссылка на страницу игры или на созданный пользователями контент</label>
    <input id="gu" placeholder="https://">
    <label>Название</label>
    <input id="gn" placeholder="Подставится из ссылки">
    <label>Описание (необязательно)</label>
    <input id="gd" placeholder="Коротко, о чём игра">
    <label>Обложка карточки (необязательно, иначе появится цветная заглушка)</label>
    <input type="file" id="gcov" accept="image/*">
    <div class="acts">
      <button id="gc">Отмена</button>
      <button id="gm">Сделать игрой обзора</button>
      ${hasSel ? '<button id="gl">Ссылка на выделенный текст</button>' : ''}
      <button id="gk" class="on">Вставить карточку</button>
    </div>`);
  const site = () => S.sites[+$('#gs').value];
  const data = () => {
    const u = $('#gu').value.trim();
    if (!/^https?:\/\//.test(u)) { toast('Вставьте ссылку, которая начинается с https://'); return null; }
    return {name: $('#gn').value.trim() || nameFrom(u) || u, url: u, site: site().name, desc: $('#gd').value.trim(), cover: pendingCover};
  };
  $('#gsr').onclick = () => { const q = $('#gq').value.trim(); if (q) window.open(site().search.replace('{q}', encodeURIComponent(q)), '_blank', 'noopener'); };
  $('#gu').oninput = () => {
    const u = $('#gu').value.trim(); $('#gn').value = nameFrom(u);
    const i = S.sites.findIndex(s => siteMatch(s, u)); if (i >= 0) $('#gs').value = i;
  };
  $('#gc').onclick = closeModal;
  $('#gcov').onchange = async e => { const f = e.target.files[0]; if (f) pendingCover = await readFile(f); };
  $('#gk').onclick = () => { const g = data(); if (!g) return; closeModal(); ins(cardHtml(g)); };
  $('#gm').onclick = () => { const g = data(); if (!g) return; cur().game = g; touch(); closeModal(); renderGame(); };
  if (hasSel) $('#gl').onclick = () => { const g = data(); if (!g) return; closeModal(); run('createLink', g.url); };
}

$('#sites').onclick = () => {
  modal(`<h3>Сайты и интеграции</h3>
    <div id="sl2"></div>
    <label>Добавить сайт</label>
    <input id="sn" placeholder="Название, например GOG">
    <input id="sh" placeholder="Домен, например gog.com (несколько через пробел)">
    <input id="ss" placeholder="Адрес поиска с {q}, например https://www.gog.com/games?query={q}">
    <div class="acts"><button id="sa" class="on">Добавить</button></div>
    <p style="font-size:13px;color:var(--muted);margin:0">Новый сайт добавляется без кода: название, домен и адрес поиска. Ссылки с этого домена распознаются автоматически, название игры берётся из адреса страницы.</p>`);
  drawSites();
  $('#sa').onclick = () => {
    const n = $('#sn').value.trim(), h = $('#sh').value.trim(), s = $('#ss').value.trim();
    if (!n || !h) { toast('Нужны название и домен'); return; }
    S.sites.push({name:n, host:h, search: s || 'https://' + h.split(' ')[0] + '/search?q={q}'});
    store(); drawSites();
  };
};
function drawSites(){
  const box = $('#sl2'); box.textContent = '';
  S.sites.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'sline';
    const t = document.createElement('span'); t.textContent = s.name + ' · ' + s.host;
    const x = document.createElement('button'); x.textContent = 'Удалить';
    x.onclick = () => { S.sites.splice(i, 1); store(); drawSites(); };
    d.append(t, x); box.append(d);
  });
}

/* ---------- Фото ---------- */
const readFile = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
$('#file').onchange = async e => {
  const fs = [...e.target.files].filter(f => f.type.startsWith('image/')); e.target.value = '';
  if (!fs.length) return;
  const urls = await Promise.all(fs.map(readFile));
  if (urls.length === 1) ins(`<figure contenteditable="false"><img src="${urls[0]}" alt=""><figcaption contenteditable="true"></figcaption></figure><p><br></p>`);
  else askLayout(urls);
};

function askLayout(urls){
  modal(`<h3>Коллаж из ${urls.length} фото</h3>
    <label>Раскладка</label>
    <div class="acts" style="justify-content:flex-start">
      <button id="l1" class="on">Сетка</button><button id="l2">Главное фото сверху</button><button id="l3">Пары</button>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:0">Подпись добавляется под каждым фото, общая подпись — под всем коллажем.</p>`);
  const pick = l => { closeModal(); ins(`<div class="collage ${l}" contenteditable="false">${urls.map(u => `<figure><img src="${u}" alt=""><figcaption contenteditable="true"></figcaption></figure>`).join('')}<div class="cap" contenteditable="true"></div></div><p><br></p>`); };
  $('#l1').onclick = () => pick('grid'); $('#l2').onclick = () => pick('hero'); $('#l3').onclick = () => pick('pair');
}

/* ---------- Новый / удалить ---------- */
$('#newBtn').onclick = () => { if (cur()) store(); const r = blank(); S.reviews.push(r); open(r.id); store(); $('#title').focus(); };
let armed = false;
$('#del').onclick = () => {
  const b = $('#del');
  if (!armed) { armed = true; b.textContent = 'Нажмите ещё раз, чтобы удалить'; setTimeout(() => { armed = false; b.textContent = 'Удалить обзор'; }, 3000); return; }
  armed = false; b.textContent = 'Удалить обзор';
  S.reviews = S.reviews.filter(r => r.id !== S.cur); S.cur = null;
  if (!S.reviews.length) S.reviews.push(blank());
  open(S.reviews[0].id); store();
};

/* ---------- Экспорт ---------- */
const fname = r => ((r.title || r.game?.name || 'obzor').replace(/[\\/:*?"<>|]+/g, '').trim() || 'obzor');

function md(n){
  if (n.nodeType === 3) return n.textContent.replace(/\s+/g, ' ');
  if (n.nodeType !== 1) return '';
  const T = n.tagName, c = n.classList;
  if (c.contains('gcard')) return `[${n.dataset.name}](${n.dataset.url})${n.dataset.desc ? ' — ' + n.dataset.desc : ''}\n\n`;
  if (c.contains('collage')) {
    const imgs = [...n.querySelectorAll('figure')].map(imgMd).join(' ');
    const cap = n.querySelector('.cap').textContent.trim();
    return imgs + '\n\n' + (cap ? `*${cap}*\n\n` : '');
  }
  const k = [...n.childNodes].map(md).join(''), t = k.trim();
  switch (T) {
    case 'B': case 'STRONG': return t ? `**${t}**` : '';
    case 'I': case 'EM': return t ? `*${t}*` : '';
    case 'S': case 'STRIKE': case 'DEL': return t ? `~~${t}~~` : '';
    case 'SPAN': return c.contains('spoiler') ? (t ? `||${t}||` : '') : k;
    case 'U': return k;
    case 'CODE': return t ? '`' + t + '`' : '';
    case 'A': return t ? `[${t}](${n.getAttribute('href')})` : '';
    case 'H1': case 'H2': case 'H3': return t ? '#'.repeat(+T[1]) + ' ' + t + '\n\n' : '';
    case 'BLOCKQUOTE': return t ? t.split('\n').map(l => '> ' + l).join('\n') + '\n\n' : '';
    case 'HR': return '---\n\n';
    case 'UL': return [...n.children].map(li => '- ' + md(li).trim()).join('\n') + '\n\n';
    case 'OL': return [...n.children].map((li, i) => (i + 1) + '. ' + md(li).trim()).join('\n') + '\n\n';
    case 'LI': return k;
    case 'FIGURE': case 'IMG': return imgMd(n) + '\n\n';
    case 'BR': return '\n';
    case 'P': case 'DIV': return t ? t + '\n\n' : '';
    default: return k;
  }
}
function imgMd(n){
  const img = n.tagName === 'IMG' ? n : n.querySelector('img'); if (!img) return '';
  const cap = (n.tagName === 'FIGURE' ? n.querySelector('figcaption')?.textContent : '')?.trim() || '';
  const src = img.getAttribute('src') || '';
  return src.startsWith('data:') ? `*[изображение${cap ? ': ' + cap : ''}]*` : `![${cap}](${src})`;
}
function toMd(r){
  const out = [];
  if (r.title) out.push('# ' + r.title);
  const meta = [];
  if (r.game) meta.push(`**Игра:** [${r.game.name}](${r.game.url}) (${r.game.site})`);
  meta.push(`**Оценка:** ${r.score ? r.score + '/10 (' + SC[r.score-1][1] + ')' : 'не выставлена'}`);
  meta.push(`**Рекомендация:** ${REC[r.rec]}`);
  out.push(meta.join('  \n'));
  const d = document.createElement('div'); d.innerHTML = r.body;
  const b = md(d).replace(/[ \t]+\n/g, '\n').trim(); if (b) out.push(b);
  const pros = r.pros.filter(Boolean), cons = r.cons.filter(Boolean);
  if (pros.length) out.push('### Плюсы\n' + pros.map(t => '- ' + t).join('\n'));
  if (cons.length) out.push('### Минусы\n' + cons.map(t => '- ' + t).join('\n'));
  if (r.aspects.length) out.push('### Аспекты\n| Аспект | Оценка |\n|---|---|\n' + r.aspects.map(a =>
    `| ${a.name} | ${a.v === 'unsure' ? 'Не уверен' : a.v === 'na' ? 'Не применимо' : a.v + '/10'} |`).join('\n'));
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

async function saveFile(name, text){
  let d = null;
  try { d = await window.claude?.use('downloads'); } catch(e) {}
  if (!d) { toast('Скачивание здесь недоступно'); return; }
  try {
    const res = await d.save({filename: name, data: text});
    if (res.status === 'saved') toast('Сохранено: ' + name);
  } catch(e) {
    toast(e.code === 'declined' ? 'Сохранение отменено' : e.code === 'rejected_extension' ? 'Этот формат здесь не поддерживается' : 'Не удалось сохранить файл');
  }
}

document.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => {
  if (cur()) store();
  const k = b.dataset.ex, all = k.endsWith('A');
  const list = all ? S.reviews : [cur()].filter(Boolean);
  if (!list.length) { toast('Нет обзоров для экспорта'); return; }
  if (k.startsWith('md')) {
    if (list.length === 1) saveFile(fname(list[0]) + '.md', toMd(list[0]));
    else saveFile('obzory.md', list.map(toMd).join('\n\n---\n\n'));
  } else {
    const text = JSON.stringify({format:'review-editor', version:1, exported: new Date().toISOString(), reviews: list}, null, 1);
    saveFile(all ? 'obzory.rvw.json' : fname(list[0]) + '.rvw.json', text);
  }
});

$('#imp').onclick = () => $('#impFile').click();
$('#impFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d.format !== 'review-editor' || !Array.isArray(d.reviews)) throw new Error();
    if (cur()) store();
    const ids = new Set(S.reviews.map(x => x.id)); let n = 0;
    d.reviews.forEach(r => {
      if (!r || typeof r.body !== 'string') return;
      const item = Object.assign(blank(), r);
      if (ids.has(item.id)) item.id += '-' + Date.now().toString(36);
      S.reviews.push(item); n++;
    });
    store(); renderList(); toast('Импортировано обзоров: ' + n);
  } catch(err) { toast('Это не файл этого редактора'); }
};

function sample(){
  const r = blank();
  r.title = 'Hollow Knight: подземелье, которое не отпускает';
  r.game = {name:'Hollow Knight', url:'https://store.steampowered.com/app/367520/Hollow_Knight/', site:'Steam', desc:''};
  r.rec = 'yes'; r.score = 8;
  r.aspects = [{name:'Сюжет',v:7},{name:'Графика',v:9},{name:'Геймплей',v:9},{name:'Оптимизация',v:8},{name:'Локализация',v:'unsure'},{name:'Саундтрек',v:10},{name:'Мультиплеер',v:'na'}];
  r.pros = ['Атмосфера и ощущение исследования', 'Честная сложность', 'Саундтрек Кристофера Ларкина'];
  r.cons = ['Первые часы бывают резкими', 'Подсказки и карта скупые'];
  const fig = (u, t) => `<figure contenteditable="false"><img src="${u}" alt=""><figcaption contenteditable="true">${t}</figcaption></figure>`;
  const A = [art('#3b5b6e','#0d1b24'), art('#8a5a3c','#2a1810'), art('#4f6b4a','#16240f'), art('#6c4f7d','#1d1424')];
  r.body = [
    '<p>Иногда игра хочет, чтобы вы заблудились. <i>Hollow Knight</i> делает это намеренно: карта не подсказывает дорогу, а часть её приходится <b>покупать у торговца</b>.</p>',
    '<h2>Мир, который молчит</h2>',
    '<p>Королевство насекомых Халлоунест пало, и безымянный рыцарь спускается в его глубины. Почти без слов рассказывают <u>окружение, враги и редкие диалоги</u>, и историю собираешь сам.</p>',
    '<blockquote>Это не игра для фонового просмотра: здесь приходится думать каждую секунду.</blockquote>',
    '<h2>Бой и платформинг</h2>',
    '<p>Управление отзывчивое, а боссы — <b>жестокие</b>, но <i>честные</i>. Прыжок на <code>Z</code>, удар на <code>X</code>. Ошибка почти всегда ваша, поэтому сложность не кажется <s>нечестной</s>. <span class="spoiler">Самые интересные находки прячутся далеко от основной дороги, и без них история выглядит обрывочной</span>.</p>',
    cardHtml({name:'Hollow Knight', url:r.game.url, site:'Steam', desc:'Метроидвания о падшем королевстве насекомых', cover:A[0]}),
    '<p>Перед стартом стоит помнить три вещи:</p>',
    '<ol><li>Первые часы самые тяжёлые, и это нормально.</li><li>Сохраняйтесь у скамеек: они же точки возрождения.</li><li>Не спешите, исследование окупается.</li></ol>',
    '<h2>Внешность и звук</h2>',
    '<p>Рисовка ручная и сдержанная, палитра приглушённая. Саундтрек Кристофера Ларкина звучит так, будто сам Халлоунест тихо дышит рядом.</p>',
    '<div class="collage hero" contenteditable="false">' + fig(A[0],'Зелёные тропы') + fig(A[1],'Руины у водоёма') + fig(A[2],'Тихие глубины') + '<div class="cap" contenteditable="true">Скриншоты для примера: замените на свои</div></div><p><br></p>',
    '<div class="collage pair" contenteditable="false">' + fig(A[3],'Перед боссом') + fig(A[1],'После победы') + '<div class="cap" contenteditable="true">Один и тот же зал до и после</div></div><p><br></p>',
    fig(A[2],'Первая встреча с боссом: бегом здесь не пройти.'),
    '<p style="text-align:center"><i>Если вы любите платформеры с характером, это ваш выбор.</i></p>',
    '<hr><h2>Итог</h2>',
    '<p>Hollow Knight заслуживает <b>8 из 10</b>. Минусы есть, но они не мешают главному: хочется вернуться и попробовать ещё раз.</p>'
  ].join('');
  return r;
}
$('#sampleBtn').onclick = () => { if (cur()) store(); const r = sample(); S.reviews.push(r); open(r.id); store(); };

/* ---------- Запуск ---------- */
document.execCommand('defaultParagraphSeparator', false, 'p');
window.addEventListener('pagehide', () => { if (cur() && hasContent(cur())) store(); });
load();
if (!S.reviews.length) S.reviews.push(sample());
open([...S.reviews].sort((a,b) => b.updated - a.updated)[0].id);
