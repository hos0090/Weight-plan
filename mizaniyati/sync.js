/* ============================================================
 *  المزامنة السحابية المشفّرة + إشعارات الجوال.
 *  لا تلمس منطق المحرك إطلاقاً — طبقة منفصلة كلياً.
 * ========================================================== */
(function () {
'use strict';

const FB = { apiKey: 'AIzaSyDBydI6nfiWau7GVzvKeoc9xgFz2f24Lbw', projectId: 'weight-plan-7d474' };
const DOCS = 'https://firestore.googleapis.com/v1/projects/' + FB.projectId + '/databases/(default)/documents';
const VAPID_PUBLIC = 'BPTgjaSRS298aZO9WyCaqPXZWJiwxRNhfX9--8Uy0Kuoij4VUTUU4q3i6iRb0sqsJA1EnUreBuBVXJ-WrYlqMCA';
const DEV = 'default'; // جميع أجهزة هذا التطبيق تشترك في مستند جهاز واحد — لا حاجة لرمز عائلة هنا

function LS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
function LSdel(k) { try { localStorage.removeItem(k); } catch (e) {} }

/* ---------- تشفير محلي بعبارة مرور المستخدم ---------- */
function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
function enc(s) { return new TextEncoder().encode(s); }
function dec(buf) { return new TextDecoder().decode(buf); }

function deriveKey_(pass, salt) {
  return crypto.subtle.importKey('raw', enc(pass), 'PBKDF2', false, ['deriveKey']).then(function (base) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  });
}
function encryptText_(text, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  return deriveKey_(pass, salt).then(function (key) {
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc(text));
  }).then(function (ct) { return { s: b64(salt), iv: b64(iv), c: b64(ct) }; });
}
function decryptText_(payload, pass) {
  const salt = unb64(payload.s), iv = unb64(payload.iv), ct = unb64(payload.c);
  return deriveKey_(pass, salt).then(function (key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
  }).then(dec, function () { throw new Error('تعذّر فك التشفير — تأكد من عبارة المرور'); });
}

/* ---------- Firestore (وثائق نصية بسيطة) ---------- */
function fsGet_(path) {
  return fetch(DOCS + '/' + path + '?key=' + FB.apiKey).then(function (r) {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('فشل الاتصال بخدمة المزامنة (' + r.status + ')');
    return r.json();
  });
}
function fsPatch_(path, fields) {
  const mask = Object.keys(fields).map(function (k) { return 'updateMask.fieldPaths=' + encodeURIComponent(k); }).join('&');
  return fetch(DOCS + '/' + path + '?key=' + FB.apiKey + '&' + mask, {
    method: 'PATCH', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fields: fields })
  }).then(function (r) { if (!r.ok) throw new Error('فشل الحفظ في خدمة المزامنة (' + r.status + ')'); return r.json(); });
}
const sv = function (s) { return { stringValue: s }; };
const iv_ = function (n) { return { integerValue: String(n) }; };

/* ============================================================ النسخة السحابية المشفّرة ============================================================ */
function cloudState() {
  return { code: LS('myz_code') || '', hasPass: !!LS('myz_syncpass_hint'), lastSyncAt: LS('myz_last_sync') || '' };
}
function randomCode_() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = [];
  for (let i = 0; i < 8; i++) out.push(a[Math.floor(Math.random() * a.length)]);
  return out.slice(0, 4).join('') + '-' + out.slice(4).join('');
}
function cloudNewCode() {
  const c = randomCode_(); LS('myz_code', c); return c;
}
function cloudSetCode(c) { LS('myz_code', String(c).trim().toUpperCase()); }

function cloudBackupNow(passphrase) {
  const code = LS('myz_code');
  if (!code) return Promise.reject(new Error('أنشئ رمز مزامنة أولاً'));
  if (!passphrase) return Promise.reject(new Error('أدخل عبارة المرور الخاصة بالمزامنة'));
  return BRIDGE.call('__export', []).then(function (dump) {
    return encryptText_(dump.state, passphrase).then(function (payload) {
      return fsPatch_('myz_vault/' + code, {
        payload: sv(JSON.stringify(payload)),
        rev: iv_(dump.meta.localRev || 0),
        updated: iv_(Date.now())
      });
    });
  }).then(function () {
    LS('myz_syncpass_hint', '1'); LS('myz_last_sync', new Date().toLocaleString('ar-SA'));
    return BRIDGE.call('__markSynced', [0, Date.now()]);
  });
}
function cloudRestoreByCode(code, passphrase) {
  code = String(code || '').trim().toUpperCase();
  if (!code || !passphrase) return Promise.reject(new Error('أدخل رمز المزامنة وعبارة المرور'));
  return fsGet_('myz_vault/' + code).then(function (doc) {
    if (!doc) throw new Error('لا توجد نسخة بهذا الرمز');
    const payload = JSON.parse(doc.fields.payload.stringValue);
    return decryptText_(payload, passphrase);
  }).then(function (state) {
    return BRIDGE.call('__load', [state, {}]);
  }).then(function () {
    LS('myz_code', code); LS('myz_syncpass_hint', '1'); LS('myz_last_sync', new Date().toLocaleString('ar-SA'));
  });
}

/* ============================================================ إشعارات الجوال ============================================================ */
function urlKey_(s) {
  const pad = '='.repeat((4 - s.length % 4) % 4), b64s = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64s), out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function notifSupported_() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
function endpointId_(endpoint) {
  return crypto.subtle.digest('SHA-256', enc(endpoint)).then(function (h) {
    return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32);
  });
}
function uploadSchedule_(sub, hour) {
  return BRIDGE.call('appPushSchedule', ['', 14, hour]).then(function (r) {
    return endpointId_(sub.endpoint).then(function (id) {
      return fsPatch_('myz_sched/' + id, { items: sv(JSON.stringify(r.items)), updated: iv_(Date.now()) });
    });
  });
}
function registerDevice_(sub) {
  return fsGet_('myz_devices/' + DEV).then(function (doc) {
    let subs = [];
    try { subs = JSON.parse(doc.fields.subs.stringValue); } catch (e) {}
    const raw = sub.toJSON();
    if (!subs.some(function (x) { return x.endpoint === raw.endpoint; })) subs.push(raw);
    return fsPatch_('myz_devices/' + DEV, { subs: sv(JSON.stringify(subs)) });
  }, function () {
    return fsPatch_('myz_devices/' + DEV, { subs: sv(JSON.stringify([sub.toJSON()])) });
  });
}
function notifState() {
  const perm = notifSupported_() ? Notification.permission : 'unsupported';
  return {
    supported: notifSupported_(), perm: perm,
    enabled: LS('myz_notif_on') === '1' && perm === 'granted',
    hour: Number(LS('myz_notif_hour') || 9),
    syncHint: 'الجدول يُحسب على جهازك ويُرفع ليقرأه خادم الإشعارات كل بضع دقائق.'
  };
}
function notifEnable_() {
  if (!notifSupported_()) return Promise.reject(new Error('متصفحك لا يدعم الإشعارات'));
  return navigator.serviceWorker.ready.then(function (reg) {
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error('لم تمنح إذن الإشعارات');
      return reg.pushManager.getSubscription().then(function (existing) {
        return existing || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlKey_(VAPID_PUBLIC) });
      });
    }).then(function (sub) {
      const hour = Number(LS('myz_notif_hour') || 9);
      return uploadSchedule_(sub, hour).then(function () { return registerDevice_(sub); }).then(function () {
        LS('myz_notif_on', '1');
      });
    });
  });
}
function notifDisable_() {
  LS('myz_notif_on', '0');
  return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); })
    .then(function (sub) { return sub ? sub.unsubscribe() : null; }).catch(function () {});
}
function notifSetHour_(h) {
  LS('myz_notif_hour', String(h));
  if (LS('myz_notif_on') === '1') {
    navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); })
      .then(function (sub) { if (sub) return uploadSchedule_(sub, h); });
  }
}
function notifTest_() {
  navigator.serviceWorker.ready.then(function (reg) {
    reg.showNotification('🔔 التذكيرات شغّالة', { body: 'هذا إشعار تجريبي محلي من ميزانيتي.', icon: 'icon-192.png', badge: 'icon-192.png', lang: 'ar', dir: 'rtl' });
  });
}
// إعادة رفع الجدول يومياً طالما التطبيق مفتوح — يبقيه محدّثاً بعد كل تعديل
let resyncT = null;
function scheduleResync_() {
  clearTimeout(resyncT);
  resyncT = setTimeout(function () {
    if (LS('myz_notif_on') !== '1') return;
    navigator.serviceWorker && navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); })
      .then(function (sub) { if (sub) return uploadSchedule_(sub, Number(LS('myz_notif_hour') || 9)); }).catch(function () {});
  }, 4000);
}

window.NOTIF_STATE = notifState;
window.notifEnable_ = notifEnable_;
window.notifDisable_ = notifDisable_;
window.notifSetHour_ = notifSetHour_;
window.notifTest_ = notifTest_;
window.SYNC = {
  state: cloudState, newCode: cloudNewCode, setCode: cloudSetCode,
  backupNow: cloudBackupNow, restoreByCode: cloudRestoreByCode, onDataChanged: scheduleResync_
};
})();
