// Sends due reminders. Primary source: the schedule each phone writes to Firestore (/sched/<hash of push endpoint>),
// which already follows late wake-ups, swapped meals, and skips anything already ticked. Fallback: the fixed plan.
import webpush from 'web-push';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const P = JSON.parse(readFileSync(new URL('./plan.json', import.meta.url), 'utf8'));
const FB = { apiKey: 'AIzaSyDBydI6nfiWau7GVzvKeoc9xgFz2f24Lbw', projectId: 'weight-plan-7d474' };
const DOCS = `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;
const TEST = process.env.INPUT_ID === 'test';
let raw = (process.env.PUSH_SUBS || '').trim();
if (!raw) { try { raw = readFileSync(new URL('./subs.txt', import.meta.url), 'utf8').trim(); } catch {} }
const subs = [];
for (const part of raw.split(/[\s,]+/).filter(Boolean)) {
  try { const t = part.startsWith('{') || part.startsWith('[') ? part : Buffer.from(part, 'base64').toString('utf8'); const v = JSON.parse(t); (Array.isArray(v) ? v : [v]).forEach(x => subs.push(x)); }
  catch { console.log('::warning::one subscription entry could not be read'); }
}
if (!subs.length) { console.log('::notice::no subscriptions yet'); process.exit(0); }
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
const nowR = new Date(Date.now() + 3 * 3600e3);            // Asia/Riyadh, UTC+3
const pad = n => String(n).padStart(2, '0');
const isoR = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const today = isoR(nowR), nowStr = `${today}T${pad(nowR.getUTCHours())}:${pad(nowR.getUTCMinutes())}`;
const minus = m => { const d = new Date(nowR.getTime() - m * 60e3); return `${isoR(d)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
const WINDOW_FROM = minus(25);                            // GitHub cron can run late; send anything due in the last 25 min
function fallbackItems() {                                 // fixed plan, used when the phone hasn't written a schedule
  const [sy, sm, sd] = (process.env.START || '2026-10-10').split('-').map(Number);
  const diff = Math.round((Date.UTC(nowR.getUTCFullYear(), nowR.getUTCMonth(), nowR.getUTCDate()) - Date.UTC(sy, sm - 1, sd)) / 864e5);
  const idx = ((diff % 28) + 28) % 28, wd = nowR.getUTCDay(), week = Math.max(1, Math.floor(diff / 7) + 1);
  const meal = s => { const c = P.C[P.W[idx][s]] || ['', '']; return `${c[0]} · ${c[1]}`; };
  const walk = week === 1 ? '30 دقيقة' : week === 2 ? '45 دقيقة' : 'ساعة';
  const L = [['06:30', 'wake', '💧 صباح الخير', 'اشرب كاسين موية على الريق'], ['07:00', 'm0', '🍳 وقت الفطور', meal(0)], ['07:05', 'p_centrum', '💊 سنتروم', 'حبة وحدة مع الفطور'],
    ['08:00', 'v1', '☕ قهوة V60 الأولى', 'سوداء بدون سكر'], ['10:00', 'm1', '🍎 وقت سناك الصبح', meal(1)], ['10:30', 'w2', '💧 كاسين موية', 'هدفك اليوم 3 لتر'],
    ['12:00', 'sc', '☕ القهوة السعودية', '3 فناجيل بدون سكر'], ['13:30', 'm2', wd === 5 ? '👨‍👩‍👧 غدا الأهل' : '🍽️ وقت الغدا', wd === 5 ? 'سلطة أول، وصحن واحد، ورز ثلث كوب' : meal(2)],
    ['14:30', 'lq', 'تغديت؟ ✓', 'أشّر على الغدا بالتطبيق'], ['16:00', 'm3', '☕ آخر قهوة + سناك العصر', meal(3)], ['18:00', 'eve', '🌺 مشروب العصر', 'كركديه أو ليمون بالنعناع، بدون سكر'],
    ['19:30', 'm4', '🍽️ وقت العشا', meal(4)], ['19:35', 'p_gluco', '💊 جلوكوفاج إكس آر 750', 'حبة مع العشا، تبلعها كاملة'], ['20:00', 'walk', '🚶 وقت المشي', walk + ' بعد العشا'],
    ['21:30', 'w3', '💧 كمّلت 3 لتر؟', 'شيّك عدّاد الموية'], ['22:00', 'p_mag', '💊 مغنيسيوم + بابونج', 'والمطبخ مقفل لين الصبح'], ['22:45', 'sleep', '🌙 النوم بعد ربع ساعة', '7 ساعات نوم تقلل جوع بكرة']];
  if (wd === 5) L.push(['13:35', 'p_vitd', '💊 فيتامين د 50,000', 'حبة الأسبوع، مع الغدا']);
  if (wd === 6) L.push(['06:45', 'weigh', '⚖️ يوم الوزن', 'توزن قبل الفطور وسجّل وزنك']);
  return L.map(([t, id, title, body]) => ({ id: `${today}:${id}`, at: `${today}T${t}`, title, body, done: false }));
}
async function getDoc(id) { const r = await fetch(`${DOCS}/sched/${id}?key=${FB.apiKey}`); if (r.status === 404) return null; if (!r.ok) throw new Error('firestore ' + r.status); return r.json(); }
async function saveSent(id, sent) {
  const r = await fetch(`${DOCS}/sched/${id}?key=${FB.apiKey}&updateMask.fieldPaths=sent`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: { sent: { stringValue: JSON.stringify(sent) } } }) });
  if (!r.ok) console.log('::warning::could not record sent reminders ' + r.status);
}
let total = 0, failed = 0;
for (const sub of subs) {
  const id = createHash('sha256').update(sub.endpoint).digest('hex').slice(0, 32);
  if (TEST) {
    try { await webpush.sendNotification(sub, JSON.stringify({ title: '🔔 التذكيرات شغالة', body: 'بيوصلك كل تذكير بوقته، ويتغير الوقت لو صحيت متأخر.', tag: 'test' }), { TTL: 1800, urgency: 'high' }); total++; }
    catch (e) { console.log(`::error::test push failed ${e.statusCode} ${String(e.body || e.message).slice(0, 300)}`); failed++; }
    continue;
  }
  let doc = null, fsOK = true; try { doc = await getDoc(id); } catch (e) { fsOK = false; console.log('::warning::' + e.message); }
  const f = doc?.fields || {};
  let items = null, source = 'phone';
  const fresh = f.updated && Date.now() - Number(f.updated.integerValue) < 40 * 3600e3;
  if (fresh && f.items?.stringValue) { try { items = JSON.parse(f.items.stringValue); } catch {} }
  if (!items) { items = fallbackItems(); source = 'plan'; }
  let sent = []; try { sent = JSON.parse(f.sent?.stringValue || '[]'); } catch {}
  const from = fsOK ? WINDOW_FROM : minus(5);              // no place to remember what was sent: only the last 5 minutes, so nothing repeats
  const due = items.filter(it => !it.done && it.at > from && it.at <= nowStr && !sent.includes(it.id));
  for (const it of due) {
    try { await webpush.sendNotification(sub, JSON.stringify({ title: it.title, body: it.body, tag: it.id.split(':')[1] }), { TTL: 1800, urgency: 'high' }); total++; sent.push(it.id); }
    catch (e) { console.log(`::error::push failed ${e.statusCode} ${String(e.body || e.message).slice(0, 300)}`); failed++; if (e.statusCode === 404 || e.statusCode === 410) { console.log('::error::subscription expired: open the app and enable reminders again'); break; } }
  }
  if (due.length && fsOK) await saveSent(id, sent.filter(x => x >= minus(48 * 60).slice(0, 10)).slice(-80));
  console.log(`::notice::${nowStr} Riyadh · source=${source} · due=${due.length} · sent=${total}`);
}
if (failed) process.exit(1);
