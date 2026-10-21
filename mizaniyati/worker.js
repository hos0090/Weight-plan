/* العامل الخلفي: يشغّل المحرك ويحفظ البيانات في قاعدة الجهاز (IndexedDB). */
/* global RT, rtEncode_, rtDecode_ */
importScripts('gas-runtime.js?v=1792570271486', 'engine.js?v=1792570271486', 'engine-ext.js?v=1792570271486', 'claude-ai.js?v=1792570271486');

RT.origin = String(self.location.href).replace(/[^/]*$/, '');

const DB_NAME = 'myz', STORE = 'kv';
function idb_() {
  return new Promise(function (res, rej) {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}
function idbGet_(k) {
  return idb_().then(function (db) {
    return new Promise(function (res, rej) {
      const q = db.transaction(STORE).objectStore(STORE).get(k);
      q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); };
    });
  });
}
function idbSet_(k, v) {
  return idb_().then(function (db) {
    return new Promise(function (res, rej) {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(v, k);
      t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); };
    });
  });
}

let ready = null;
function load_() {
  if (!ready) {
    ready = Promise.all([idbGet_('state'), idbGet_('backups'), idbGet_('meta')]).then(function (v) {
      if (v[0]) RT.state = rtDecode_(v[0]);
      if (v[1]) RT.backups = v[1];
      RT.meta = v[2] || { localRev: 0, syncedRev: 0 };
      RT.dirty = false;
    });
  }
  return ready;
}

let saving = Promise.resolve();
function persist_() {
  if (!RT.dirty && !RT.backupsDirty) return saving;
  const tasks = [];
  if (RT.dirty) {
    RT.dirty = false;
    RT.meta.localRev = (RT.meta.localRev || 0) + 1;
    RT.meta.changedAt = Date.now();
    tasks.push(['state', rtEncode_(RT.state)], ['meta', Object.assign({}, RT.meta)]);
    self.postMessage({ type: 'changed', rev: RT.meta.localRev });
  }
  if (RT.backupsDirty) { RT.backupsDirty = false; tasks.push(['backups', RT.backups.slice()]); }
  saving = saving.then(function () {
    return Promise.all(tasks.map(function (t) { return idbSet_(t[0], t[1]); }));
  }).catch(function (e) { self.postMessage({ type: 'storageError', message: String(e && e.message || e) }); });
  return saving;
}

/* أوامر داخلية لا يراها المحرك */
const INTERNAL = {
  __status: function () {
    return { hasAccount: appHasAccount_(), user: appHasAccount_() ? (getSetting_('APP_USER') || '') : '', meta: RT.meta };
  },
  __export: function () { return { state: rtEncode_(RT.state), meta: RT.meta }; },
  __file: function (id) {
    const f = RT.drive.find(function (x) { return x.id === id; });
    return f ? { name: f.name, type: f.type, content: f.content } : null;
  },
  __load: function (encoded, meta) {
    // استبدال كامل من السحابة — نحفظ نسخة محلية مما كان قبلها
    if (RT.state.order.length) {
      RT.backups.push({ name: 'قبل التحميل من السحابة ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'), at: Date.now(), state: rtEncode_(RT.state) });
      if (RT.backups.length > 8) RT.backups.shift();
      RT.backupsDirty = true;
    }
    RT.state = rtDecode_(encoded);
    RT.dirty = true;
    RT.meta = Object.assign(RT.meta || {}, meta || {});
    cacheReset_();
    return { success: true };
  },
  __markSynced: function (rev, remoteUpdated) {
    RT.meta.syncedRev = rev; RT.meta.remoteUpdated = remoteUpdated;
    return idbSet_('meta', Object.assign({}, RT.meta)).then(function () { return true; });
  },
  __wipe: function () {
    RT.state = { sheets: {}, order: [], props: {} }; RT.backups = []; RT.meta = { localRev: 0, syncedRev: 0 };
    RT.dirty = false; RT.backupsDirty = false;
    return Promise.all([idbSet_('state', rtEncode_(RT.state)), idbSet_('backups', []), idbSet_('meta', RT.meta)]).then(function () { return true; });
  }
};

let queue = Promise.resolve();
self.onmessage = function (ev) {
  const msg = ev.data || {};
  if (msg.type !== 'call') return;
  queue = queue.then(load_).then(function () {
    let out;
    try {
      const fn = INTERNAL[msg.fn] || (/^[A-Za-z][A-Za-z0-9]*$/.test(msg.fn) && typeof self[msg.fn] === 'function' ? self[msg.fn] : null);
      if (!fn) throw new Error('دالة غير معروفة: ' + msg.fn);
      out = fn.apply(null, msg.args || []);
    } catch (e) {
      persist_();
      self.postMessage({ type: 'result', id: msg.id, ok: false, error: String((e && e.message) || e) });
      return;
    }
    return Promise.resolve(out).then(function (r) {
      return persist_().then(function () {
        // نفس قيود جوجل: النتيجة تُسلسَل كـ JSON
        let clean;
        try { clean = r === undefined ? null : JSON.parse(JSON.stringify(r)); } catch (e) { clean = null; }
        self.postMessage({ type: 'result', id: msg.id, ok: true, value: clean });
      });
    }, function (e) {
      self.postMessage({ type: 'result', id: msg.id, ok: false, error: String((e && e.message) || e) });
    });
  });
};
