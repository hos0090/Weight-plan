// يرسل تنبيهات ميزانيتي المستحقة. المصدر: الجدول الذي يكتبه الجوال نفسه إلى Firestore
// (/myz_sched/<هاش نقطة الدفع>) بعد حساب دقيق من بياناته الفعلية — لا خطة ثابتة هنا على الإطلاق.
import webpush from 'web-push';

const FB = { apiKey: 'AIzaSyDBydI6nfiWau7GVzvKeoc9xgFz2f24Lbw', projectId: 'weight-plan-7d474' };
const DOCS = `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;
const DEV = 'default';
const TEST = process.env.INPUT_ID === 'test';

async function getDoc(path) { const r = await fetch(`${DOCS}/${path}?key=${FB.apiKey}`); if (r.status === 404) return null; if (!r.ok) throw new Error('firestore ' + r.status); return r.json(); }
async function patchDoc(path, fields) {
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const r = await fetch(`${DOCS}/${path}?key=${FB.apiKey}&${mask}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields }) });
  if (!r.ok) console.log('::warning::تعذّر الحفظ في ' + path + ' — ' + r.status);
}

const nowR = new Date(Date.now() + 3 * 3600e3);                       // توقيت الرياض UTC+3
const pad = n => String(n).padStart(2, '0');
const isoR = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const nowStr = `${isoR(nowR)}T${pad(nowR.getUTCHours())}:${pad(nowR.getUTCMinutes())}`;
const minus = m => { const d = new Date(nowR.getTime() - m * 60e3); return `${isoR(d)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
const WINDOW_FROM = minus(20);                                        // كل 5 دقائق + هامش تأخر محتمل

if (!process.env.VAPID_PRIVATE) { console.log('::error::VAPID_PRIVATE غير مُعرَّف'); process.exit(1); }
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const devDoc = await getDoc(`myz_devices/${DEV}`);
let subs = [];
try { subs = JSON.parse(devDoc?.fields?.subs?.stringValue || '[]'); } catch {}
console.log(`::notice::الأجهزة المسجَّلة: ${subs.length}`);
if (!subs.length) process.exit(0);

async function endpointId(endpoint) {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

let total = 0, failed = 0;
const expired = new Set();
for (const sub of subs) {
  const id = await endpointId(sub.endpoint);
  if (TEST) {
    try { await webpush.sendNotification(sub, JSON.stringify({ title: '🔔 إشعارات ميزانيتي شغّالة', body: 'بيوصلك كل تنبيه بوقته حتى لو التطبيق مقفول.', tag: 'test' }), { TTL: 1800, urgency: 'high' }); total++; }
    catch (e) { console.log(`::error::فشل إشعار التجربة ${e.statusCode} ${String(e.body || e.message).slice(0, 300)}`); failed++; }
    continue;
  }
  let doc = null, fsOK = true;
  try { doc = await getDoc(`myz_sched/${id}`); } catch (e) { fsOK = false; console.log('::warning::' + e.message); }
  const f = doc?.fields || {};
  const fresh = f.updated && Date.now() - Number(f.updated.integerValue) < 9 * 24 * 3600e3;   // الجوال يرفع أسبوعين مقدَّماً
  let items = [];
  if (fresh) { try { items = JSON.parse(f.items?.stringValue || '[]'); } catch {} }
  if (!items.length) continue;                                       // لا جدول = لا نرسل تخميناً
  let sent = []; try { sent = JSON.parse(f.sent?.stringValue || '[]'); } catch {}
  const from = fsOK ? WINDOW_FROM : minus(5);
  const due = items.filter(it => it.at > from && it.at <= nowStr && !sent.includes(it.id));
  for (const it of due) {
    try { await webpush.sendNotification(sub, JSON.stringify({ title: it.title, body: it.body, tag: it.id }), { TTL: 1800, urgency: 'high' }); total++; sent.push(it.id); }
    catch (e) {
      console.log(`::error::فشل الإرسال ${e.statusCode} ${String(e.body || e.message).slice(0, 300)}`); failed++;
      if (e.statusCode === 404 || e.statusCode === 410) { expired.add(sub.endpoint); failed--; break; }
    }
  }
  if (due.length && fsOK) await patchDoc(`myz_sched/${id}`, { sent: { stringValue: JSON.stringify(sent.slice(-100)) } });
  console.log(`::notice::${nowStr} الرياض · جهاز ${id.slice(0, 8)} · مستحق=${due.length}`);
}
if (expired.size) {
  const keep = subs.filter(x => !expired.has(x.endpoint));
  await patchDoc(`myz_devices/${DEV}`, { subs: { stringValue: JSON.stringify(keep) } });
}
console.log(`::notice::الإجمالي: أُرسل ${total}${failed ? ' · فشل ' + failed : ''}`);
if (failed) process.exit(1);
