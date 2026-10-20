/* ============================================================
 *  الجسر بين الواجهة والعامل الخلفي — يحاكي google.script.run تماماً
 *  فيبقى app.js (المأخوذ من الواجهة الأصلية) كما هو دون أي تعديل بنيوي.
 * ========================================================== */
var BRIDGE = (function () {
  const worker = new Worker('worker.js?v=1792516919283');
  let seq = 0;
  const pending = {};
  let onChange = null, onError = null;

  worker.onmessage = function (ev) {
    const m = ev.data || {};
    if (m.type === 'result') {
      const p = pending[m.id]; delete pending[m.id];
      if (!p) return;
      if (m.ok) p.resolve(m.value); else p.reject(new Error(m.error));
    } else if (m.type === 'changed') {
      if (onChange) onChange(m.rev);
    } else if (m.type === 'storageError') {
      if (onError) onError(m.message);
    }
  };
  worker.onerror = function (e) {
    const err = new Error('عطل داخلي في محرك التطبيق: ' + (e && e.message || ''));
    Object.keys(pending).forEach(function (id) { pending[id].reject(err); delete pending[id]; });
  };

  function call(fn, args) {
    return new Promise(function (resolve, reject) {
      const id = ++seq;
      pending[id] = { resolve: resolve, reject: reject };
      worker.postMessage({ type: 'call', id: id, fn: fn, args: args || [] });
    });
  }
  return {
    call: call,
    onChange: function (fn) { onChange = fn; },
    onStorageError: function (fn) { onError = fn; }
  };
})();

function makeRunner_(ok, fail) {
  return new Proxy({}, {
    get: function (_, prop) {
      if (prop === 'withSuccessHandler') return function (fn) { return makeRunner_(fn, fail); };
      if (prop === 'withFailureHandler') return function (fn) { return makeRunner_(ok, fn); };
      if (typeof prop === 'symbol') return undefined;
      return function () {
        const args = Array.prototype.slice.call(arguments);
        BRIDGE.call(prop, args).then(function (v) {
          if (window.SYNC) window.SYNC.onDataChanged();
          if (ok) ok(v);
        }, function (e) { if (fail) fail(e); });
      };
    }
  });
}
var google = { script: { run: makeRunner_(null, null), host: { close: function () {} } } };

/** تنزيل ملف أُنشئ داخل العامل (تصدير CSV/تقرير) — بلا درايف، مباشرة إلى جهاز المستخدم. */
function downloadAppFile(url) {
  if (!url || url.indexOf('app-file:') !== 0) { if (url) window.open(url, '_blank'); return; }
  const id = url.slice('app-file:'.length);
  BRIDGE.call('__file', [id]).then(function (f) {
    if (!f) return toast('تعذّر العثور على الملف', 'err');
    const blob = new Blob([f.content], { type: f.type + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = f.name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  });
}
