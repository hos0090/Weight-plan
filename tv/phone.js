'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ar = (n) => Number(n).toLocaleString('ar-SA');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const AVATARS = ['😎', '🌸', '🦁', '🦋', '🐯', '👑', '🔥', '🌙', '⭐', '🐼', '🦊', '🍓'];
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

let me = store.get('sahra-me', null);
if (me && !me.id) me = null;
let ws, cur = null;
const m = $('#m');
const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

function send(data) { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'input', data })); }
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => { $('#net').classList.remove('off'); if (me) ws.send(JSON.stringify({ type: 'hello', role: 'phone', ...me })); };
  ws.onclose = () => { $('#net').classList.add('off'); setTimeout(connect, 1200); };
  ws.onmessage = (e) => { const msg = JSON.parse(e.data); if (msg.type === 'ui') render(msg.ui); };
}

/* ===== الدخول ===== */
function joinScreen() {
  $('#hd').style.display = 'none';
  let av = me?.avatar || AVATARS[0];
  m.innerHTML = `<div class="center fade" style="justify-content:flex-start;padding-top:20px">
    <div class="big">🎮</div><h2>أهلاً في السهرة!</h2><div class="sub">وش اسمك؟</div>
    <div class="row" style="width:100%"><button class="btn gold" data-n="حسام">حسام</button><button class="btn gold" data-n="شهد">شهد</button></div>
    <input type="text" id="nm" maxlength="16" placeholder="أو اكتب اسم ثاني" value="${esc(me?.name || '')}">
    <div class="label">اختر شخصيتك</div>
    <div class="avs">${AVATARS.map((a) => `<button class="${a === av ? 'sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
    <button class="btn gold" id="go" style="margin-top:6px">ادخل اللعبة ✨</button></div>`;
  $$('[data-a]').forEach((b) => (b.onclick = () => { av = b.dataset.a; $$('[data-a]').forEach((x) => x.classList.toggle('sel', x === b)); }));
  $$('[data-n]').forEach((b) => (b.onclick = () => { $('#nm').value = b.dataset.n; if (b.dataset.n === 'شهد' && av === AVATARS[0]) $('[data-a="🌸"]').click(); join(av); }));
  $('#go').onclick = () => join(av);
}
function join(av) {
  const name = $('#nm').value.trim(); if (!name) { $('#nm').focus(); return; }
  me = { id: me?.id || 'p' + Math.random().toString(36).slice(2, 10), name, avatar: av };
  store.set('sahra-me', me);
  vib(30);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'hello', role: 'phone', ...me }));
  m.innerHTML = `<div class="center"><div class="big pulse">${av}</div><h2>جاري الدخول…</h2></div>`;
}

/* ===== الرأس ===== */
let armT;
function header(h) {
  if (!h) return;
  $('#hd').style.display = 'flex';
  $('#hd').style.setProperty('--c', h.color);
  $('#hav').textContent = h.avatar; $('#hnm').textContent = h.name;
  $('#hsc').textContent = h.inGame ? ar(h.score) : '';
  const x = $('#hx'); x.style.display = h.inGame ? '' : 'none';
  x.onclick = () => {
    if (x.classList.contains('arm')) { send({ action: 'abort' }); x.classList.remove('arm'); x.textContent = 'إنهاء'; return; }
    x.classList.add('arm'); x.textContent = 'متأكد؟'; clearTimeout(armT);
    armT = setTimeout(() => { x.classList.remove('arm'); x.textContent = 'إنهاء'; }, 2500);
  };
}

/* ===== الواجهات ===== */
let cleanup = null;
let lastSig = '';
function render(u) {
  const sig = JSON.stringify({ ...u, hud: null });
  if (sig === lastSig && u.mode !== 'result') { header(u.hud); return; }
  lastSig = sig;
  if (cleanup) { cleanup(); cleanup = null; }
  cur = u; header(u.hud);
  const f = MODES[u.mode] || MODES.wait;
  f(u);
  const c = m.firstElementChild; if (c) c.classList.add('fade');
}
const MODES = {
  wait(u) { m.innerHTML = `<div class="center"><div class="big pulse">${u.emoji || '👀'}</div><h2>${esc(u.text || 'شوف الشاشة')}</h2></div>`; },
  result(u) { vib(u.good ? [40, 40, 40] : 200); m.innerHTML = `<div class="center"><div class="big">${u.good ? '🎉' : '😅'}</div><div class="res ${u.good ? 'good' : 'bad'}">${esc(u.text)}</div><div class="sub">شوف الشاشة 👀</div></div>`; },
  menu(u) {
    m.innerHTML = `<div class="sub" style="text-align:center">المستوى</div>
      <div class="lvls">${u.levels.map((l, i) => `<button class="${i === u.level ? 'on' : ''}" data-l="${i}">${l}</button>`).join('')}</div>
      <div class="sub" style="text-align:center">اختر لعبة 👇</div>
      <div class="games">${u.games.map((g) => `<button data-g="${g.id}" class="${u.players < g.min ? 'lock' : ''}"><span class="i">${g.icon}</span><span class="t">${g.t}</span>${g.min > 1 ? `<span class="m">${ar(g.min)} لاعبين+</span>` : ''}</button>`).join('')}</div>
      <button class="btn" id="rn" style="justify-content:center;font-size:15px;color:var(--mut)">تغيير الاسم أو الشخصية</button>`;
    $$('[data-l]').forEach((b) => (b.onclick = () => { vib(15); send({ action: 'level', level: +b.dataset.l }); }));
    $$('[data-g]').forEach((b) => (b.onclick = () => { vib(30); send({ action: 'start', game: b.dataset.g }); }));
    $('#rn').onclick = joinScreen;
  },
  buzz() {
    m.innerHTML = `<div class="center"><button class="buzz" id="bz">اضغط!</button><div class="sub">أسرع واحد ياخذ الجواب</div></div>`;
    const b = $('#bz');
    const go = (e) => { e.preventDefault(); b.classList.add('hit'); vib(60); send({ buzz: true }); b.disabled = true; b.textContent = '🔔'; };
    b.addEventListener('touchstart', go, { passive: false }); b.addEventListener('mousedown', go);
  },
  choices(u) {
    const c2 = u.cols === 2 || (u.options.length === 2 && u.options[0].e);
    const wyr = u.colors;
    m.innerHTML = `${u.big ? `<div class="qe">${u.big}</div>` : ''}${u.q ? `<div class="q">${esc(u.q)}</div>` : ''}
      <div class="opts ${c2 ? 'c2' : ''}">${u.options.map((o, i) => `<button class="btn ${wyr ? (i ? 'wb' : 'wa') : ''}" data-i="${i}">${wyr ? '' : `<b>${LETTERS[i]}</b>`}${o.e ? `<span class="e">${o.e}</span>` : ''}<span>${esc(o.t)}</span></button>`).join('')}</div>`;
    $$('[data-i]').forEach((b) => (b.onclick = () => { vib(25); $$('[data-i]').forEach((x) => (x.disabled = true)); b.classList.add('sel'); b.disabled = false; send({ choice: +b.dataset.i }); }));
  },
  text(u) {
    m.innerHTML = `<div class="center" style="justify-content:flex-start;padding-top:10px"><div class="big">✍️</div><h2>${esc(u.q)}</h2><div class="sub">${esc(u.sub || '')}</div>
      <input type="text" id="tx" maxlength="40" placeholder="${esc(u.ph || '')}" autocomplete="off"><button class="btn gold" id="ok">إرسال</button></div>`;
    const go = () => { const v = $('#tx').value.trim(); if (!v) return; vib(25); $('#tx').blur(); send({ text: v }); };
    $('#ok').onclick = go; $('#tx').onkeydown = (e) => e.key === 'Enter' && go();
  },
  vote(u) {
    m.innerHTML = `<div class="center"><div class="big">⚖️</div><h2>${esc(u.q)}</h2><div class="sub" style="font-size:22px;color:var(--gold2)">${esc(u.sub || '')}</div>
      <div class="row" style="width:100%"><button class="btn gold" id="y" style="background:var(--ok);border-color:var(--ok)">${esc(u.yes)}</button><button class="btn gold" id="n" style="background:var(--bad);border-color:var(--bad);color:#fff">${esc(u.no)}</button></div></div>`;
    $('#y').onclick = () => { vib(25); send({ vote: true }); };
    $('#n').onclick = () => { vib(25); send({ vote: false }); };
  },
  board(u) {
    let sel = null, dbl = false;
    m.innerHTML = `<div class="q">اختر تحدي لـ ${esc(u.target)} 😏</div>
      <div class="board" style="grid-template-columns:repeat(${u.cats.length},1fr)">${u.cats.map((c) => `<div class="h">${esc(c)}</div>`).join('')}
      ${u.vals.map((v, r) => u.cats.map((c, ci) => { const k = ci + ':' + r; return `<button data-k="${k}" ${u.used.includes(k) ? 'disabled' : ''}>${ar(v)}</button>`; }).join('')).join('')}</div>
      ${u.canDouble ? '<div class="dbl" id="db"><span>🔥 تحدي مضاعف</span><span class="sw"></span></div><div class="sub" style="font-size:13px">إذا غلط تاخذ الضعف، وإذا جاوب صح تنخصم منك</div>' : ''}
      <button class="btn gold" id="ok" disabled>أرسل التحدي 🎯</button>`;
    $$('[data-k]').forEach((b) => (b.onclick = () => { vib(15); sel = b.dataset.k; $$('[data-k]').forEach((x) => x.classList.toggle('sel', x === b)); $('#ok').disabled = false; }));
    if ($('#db')) $('#db').onclick = () => { dbl = !dbl; vib(20); $('#db').classList.toggle('on', dbl); };
    $('#ok').onclick = () => { if (!sel) return; vib(40); send({ cell: sel, double: dbl }); $('#ok').disabled = true; };
  },
  grid(u) {
    m.innerHTML = `<div class="q">المس مكان الصورة المختلفة 👁️</div><div class="ggrid" style="grid-template-columns:repeat(${u.n},1fr)">${Array.from({ length: u.n * u.n }, (_, i) => `<button data-c="${i}"></button>`).join('')}</div><div class="sub" style="text-align:center">نفس ترتيب الشبكة اللي على الشاشة</div>`;
    $$('[data-c]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); vib(20); send({ cell: +b.dataset.c }); }));
  },
  number(u) {
    let v = '';
    m.innerHTML = `<div class="center" style="justify-content:flex-start;gap:10px"><div class="qe">${u.e || ''}</div><div class="q">${esc(u.q)}</div>
      <div class="num" id="nv">—</div><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => `<button data-k="${k}">${typeof k === 'number' ? ar(k) : k}</button>`).join('')}</div></div>`;
    const show = () => ($('#nv').textContent = v ? ar(+v) + ' ' + (u.unit || '') : '—');
    $$('[data-k]').forEach((b) => (b.onclick = () => {
      vib(10); const k = b.dataset.k;
      if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') { if (v) { vib(30); send({ value: +v }); } return; } else if (v.length < 5) v = (v + k).replace(/^0+(?=\d)/, '');
      show();
    }));
  },
  tap(u) {
    let n = 0, sent = 0;
    m.innerHTML = `<div class="center"><div class="tapc" id="tc">٠</div><button class="buzz green" id="tp">اضغط!</button><div class="sub">اضغط بأسرع ما تقدر 🏎️💨</div></div>`;
    const b = $('#tp');
    const hit = (e) => { e.preventDefault(); n++; $('#tc').textContent = ar(n); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 50); if (n % 5 === 0) vib(8); };
    b.addEventListener('touchstart', hit, { passive: false }); b.addEventListener('mousedown', hit);
    const iv = setInterval(() => { if (n !== sent) { sent = n; send({ taps: n }); } }, 90);
    cleanup = () => clearInterval(iv);
  },
  reaction() {
    m.innerHTML = `<div class="center"><button class="buzz" id="rb">اضغط إذا\nصارت خضراء</button><div class="sub">لا تستعجل! 👀 شوف الشاشة</div></div>`;
    const b = $('#rb'); b.style.whiteSpace = 'pre-line'; b.style.fontSize = '24px';
    const go = (e) => { e.preventDefault(); if (b.disabled) return; vib(50); send({ press: true }); b.disabled = true; b.classList.add('hit'); };
    b.addEventListener('touchstart', go, { passive: false }); b.addEventListener('mousedown', go);
  },
  simon(u) {
    let n = 0;
    m.innerHTML = `<div class="q">كرر الترتيب 🧠</div><div class="sub" style="text-align:center" id="sp">٠ / ${ar(u.len)}</div><div class="pads">${u.colors.map((c, i) => `<button data-p="${i}" style="background:${c}"></button>`).join('')}</div>`;
    $$('[data-p]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); vib(20); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 150); n++; $('#sp').textContent = `${ar(n)} / ${ar(u.len)}`; send({ pad: +b.dataset.p }); }));
  },
  spin() {
    m.innerHTML = `<div class="center"><div class="big pulse">🎡</div><h2>دوّر العجلة!</h2><button class="btn gold" id="sp" style="font-size:24px;padding:22px">دوّرها 😈</button></div>`;
    $('#sp').onclick = () => { vib([30, 30, 30]); send({ spin: true }); $('#sp').disabled = true; };
  },
  draw(u) {
    const COLS = ['#111111', '#e5383b', '#2b6cff', '#1aa260', '#f4a100', '#8e44ad', '#8b5a2b'];
    let col = COLS[0], wide = false;
    m.innerHTML = `<div class="word">ارسم: ${esc(u.word)} 🤫</div><canvas id="pad"></canvas>
      <div class="colors">${COLS.map((c, i) => `<button data-c="${c}" class="${i ? '' : 'sel'}" style="background:${c}"></button>`).join('')}</div>
      <div class="row"><button class="btn" id="wd" style="justify-content:center">✏️ رفيع</button><button class="btn" id="cl" style="justify-content:center">🗑️ امسح</button><button class="btn" id="sk" style="justify-content:center">⏭️ صعبة</button></div>`;
    const cv = $('#pad'), cx = cv.getContext('2d');
    const fit = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio; cx.lineCap = cx.lineJoin = 'round'; };
    fit();
    let sid = 0, buf = [], drawing = false, lastP = null, cont = false;
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
    const w = () => (wide ? 0.03 : 0.012);
    const line = (a, b) => { cx.strokeStyle = col; cx.lineWidth = w() * cv.width; cx.beginPath(); cx.moveTo(a[0] * cv.width, a[1] * cv.height); cx.lineTo(b[0] * cv.width, b[1] * cv.height); cx.stroke(); };
    const flush = () => { if (!buf.length) return; send({ stroke: { id: sid, pts: buf, c: col, w: w(), cont } }); cont = true; buf = []; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; sid++; cont = false; lastP = pt(e); buf = [lastP]; line(lastP, lastP); });
    cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pt(e); line(lastP, p); lastP = p; buf.push(p); });
    const end = () => { if (!drawing) return; drawing = false; flush(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const iv = setInterval(flush, 60);
    cleanup = () => clearInterval(iv);
    $$('[data-c]').forEach((b) => (b.onclick = () => { col = b.dataset.c; $$('[data-c]').forEach((x) => x.classList.toggle('sel', x === b)); }));
    $('#wd').onclick = () => { wide = !wide; $('#wd').textContent = wide ? '🖌️ عريض' : '✏️ رفيع'; };
    $('#cl').onclick = () => { cx.clearRect(0, 0, cv.width, cv.height); send({ clear: true }); };
    $('#sk').onclick = () => { if (confirmSkip()) send({ skip: true }); };
    let armed = false; function confirmSkip() { if (armed) return true; armed = true; $('#sk').textContent = 'متأكد؟'; setTimeout(() => { armed = false; const s = $('#sk'); if (s) s.textContent = '⏭️ صعبة'; }, 2000); return false; }
  }
};

/* ===== تشغيل ===== */
connect();
if (!me) joinScreen(); else m.innerHTML = `<div class="center"><div class="big pulse">${me.avatar}</div><h2>جاري الاتصال…</h2></div>`;
// منع النوم أثناء اللعب إذا المتصفح يدعم
(async () => { try { if ('wakeLock' in navigator) { let l = await navigator.wakeLock.request('screen'); document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible') l = await navigator.wakeLock.request('screen'); }); } } catch {} })();
