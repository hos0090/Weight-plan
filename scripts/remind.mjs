import webpush from 'web-push';
import { readFileSync } from 'node:fs';
const P = JSON.parse(readFileSync(new URL('./plan.json', import.meta.url), 'utf8'));
const SCHED = {"27 3 * * *": ["wake", "06:30"], "52 3 * * *": ["b", "06:55"], "57 3 * * 6": ["weigh", "07:00"], "57 4 * * *": ["v1", "08:00"], "57 6 * * *": ["s1", "10:00"], "27 7 * * *": ["w2", "10:30"], "57 8 * * *": ["sc", "12:00"], "57 9 * * *": ["l30", "13:00"], "27 11 * * *": ["lq", "14:30"], "57 12 * * *": ["v2", "16:00"], "57 14 * * *": ["eve", "18:00"], "57 15 * * *": ["d30", "19:00"], "57 16 * * *": ["walk", "20:00"], "27 18 * * *": ["w3", "21:30"], "57 18 * * *": ["night", "22:00"], "42 19 * * *": ["sleep", "22:45"]};
const TIMES = Object.fromEntries(Object.values(SCHED).map(([i, t]) => [i, t]));
let id = process.env.INPUT_ID || (SCHED[process.env.SCHED || ''] || [])[0];
if (!id) { console.log('no reminder for schedule', process.env.SCHED); process.exit(0); }
let subs = [];
let raw = (process.env.PUSH_SUBS || '').trim();
if (!raw) { try { raw = readFileSync(new URL('./subs.txt', import.meta.url), 'utf8').trim(); } catch {} }
for (const part of raw.split(/[\s,]+/).filter(Boolean)) {
  try { const t = part.startsWith('{') || part.startsWith('[') ? part : Buffer.from(part, 'base64').toString('utf8'); const v = JSON.parse(t); (Array.isArray(v) ? v : [v]).forEach(x => subs.push(x)); }
  catch { console.error('::warning::one PUSH_SUBS entry could not be read'); }
}
if (!subs.length) { console.log('no subscriptions yet'); process.exit(0); }
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
const nowR = new Date(Date.now() + 3 * 3600e3);
const Y = nowR.getUTCFullYear(), Mo = nowR.getUTCMonth(), D = nowR.getUTCDate(), wd = nowR.getUTCDay();
const pad = n => String(n).padStart(2, '0');
const nowMin = nowR.getUTCHours() * 60 + nowR.getUTCMinutes();
if (id !== 'test' && TIMES[id]) {
  const [h, m] = TIMES[id].split(':').map(Number);
  const late = nowMin - (h * 60 + m);
  if (late > 45) { console.log('too late, skipping', id, late, 'min'); process.exit(0); }
}
const [sy, sm, sd] = (process.env.START || '2026-10-10').split('-').map(Number);
const diff = Math.round((Date.UTC(Y, Mo, D) - Date.UTC(sy, sm - 1, sd)) / 864e5);
const idx = ((diff % 28) + 28) % 28, week = Math.max(1, Math.floor(diff / 7) + 1);
const meal = s => { const c = P.C[P.W[idx][s]] || ['', '']; return `${c[0]} · ${c[1]}`; };
const walkTxt = week === 1 ? '30 دقيقة' : week === 2 ? '45 دقيقة' : 'ساعة';
const res = week >= 3 && (wd === 0 || wd === 2 || (week >= 7 && wd === 4));
const M = {
  test: ['🔔 التذكيرات شغالة', 'بيوصلك كل تذكير بوقته: الموية، والوجبات، والقهوة، والمشي.'],
  wake: ['💧 صباح الخير', 'اشرب كاسين موية على الريق قبل أي شي'],
  b: ['🍳 الفطور بعد 5 دقائق', meal(0)],
  weigh: wd === 6 ? ['⚖️ يوم الوزن', 'توزن قبل الفطور، وسجّل وزنك بالتطبيق'] : null,
  v1: ['☕ قهوة V60 الأولى', 'كوب 250 مل، سوداء بدون سكر'],
  s1: ['🍎 وقت سناك الصبح', meal(1)],
  w2: ['💧 شربت موية؟', 'اشرب كاسين الحين. هدفك اليوم 3 لتر'],
  sc: ['☕ القهوة السعودية', '3 فناجيل بدون سكر'],
  l30: wd === 5 ? ['👨‍👩‍👧 غدا الأهل بعد نص ساعة', 'سلطة أول، وصحن واحد بدون إعادة، ورز ثلث كوب'] : ['🍽️ باقي نص ساعة على الغدا', meal(2)],
  lq: ['تغديت؟ ✓', 'أشّر على الغدا بالتطبيق، واشرب كاس موية'],
  v2: ['☕ آخر قهوة + سناك العصر', 'V60 بدون سكر · ' + meal(3)],
  eve: ['🌺 ' + P.DR[idx % 2 === 0 ? 'hibiscus' : 'lemon_mint'], 'بدون سكر، ومعه كاسين موية'],
  d30: ['🍽️ العشا بعد نص ساعة', meal(4)],
  walk: ['🚶 وقت المشي', walkTxt + ' بعد العشا' + (res ? ' · وقبله تمارين المقاومة 20 دقيقة' : '')],
  w3: ['💧 كمّلت 3 لتر؟', 'شيّك عدّاد الموية بالتطبيق'],
  night: ['🌼 كوب بابونج', 'والمطبخ مقفل لين الصبح'],
  sleep: ['🌙 النوم بعد ربع ساعة', '7 ساعات نوم تقلل جوع بكرة'],
};
const msg = M[id];
if (!msg) { console.log('nothing to send for', id); process.exit(0); }
let ok = 0, failed = 0;
for (const s of subs) {
  try { await webpush.sendNotification(s, JSON.stringify({ title: msg[0], body: msg[1], tag: id }), { TTL: 1800, urgency: 'high' }); ok++; }
  catch (e) { console.log(`::error::push failed ${e.statusCode} ${String(e.body||e.message).slice(0,300)}`); failed++; if (e.statusCode === 404 || e.statusCode === 410) console.error('::warning::a subscription expired; re-enable reminders in the app and send the new code'); }
}
console.log(`sent ${id} to ${ok}/${subs.length} · day ${idx + 1} · ${Y}-${pad(Mo + 1)}-${pad(D)} ${pad(Math.floor(nowMin / 60))}:${pad(nowMin % 60)} Riyadh`);
if (failed) process.exit(1);
