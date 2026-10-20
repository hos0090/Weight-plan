/* ============================================================
 *  بيئة تشغيل بديلة لخدمات جوجل — تعمل داخل عامل خلفي في المتصفح.
 *  المحرك (Code.gs) يعمل كما هو تماماً؛ هذه الطبقة تقدّم له
 *  جدولاً افتراضياً وخصائص محفوظة وأدوات مساعدة بنفس الواجهات.
 * ========================================================== */
/* ---------- ساعة يمكن تقديمها مؤقتاً (لحساب تنبيهات الأيام القادمة) ---------- */
var RT_CLOCK = (function () {
  const Real = Date;
  const c = { offset: 0, real: function () { return Real.now(); }, Real: Real };
  function D() {
    const a = Array.prototype.slice.call(arguments);
    if (!(this instanceof D)) return Real();             // Date() بلا new يعيد نصاً كالأصل
    const v = a.length === 0 ? new Real(Real.now() + c.offset) : new (Function.prototype.bind.apply(Real, [null].concat(a)))();
    Object.setPrototypeOf(v, D.prototype);
    return v;
  }
  D.prototype = Object.create(Real.prototype);
  D.prototype.constructor = D;
  D.now = function () { return Real.now() + c.offset; };
  D.UTC = Real.UTC; D.parse = Real.parse;
  Object.defineProperty(D, Symbol.hasInstance, { value: function (v) { return v instanceof Real; } });
  self.Date = D;
  return c;
})();

var RT = {
  state: { sheets: {}, order: [], props: {} },   // يُحفظ ويُزامَن
  drive: [],                                     // ملفات مؤقتة (تصدير) — لا تُزامَن
  backups: [],                                   // نسخ محلية — لا تُزامَن
  dirty: false,
  origin: ''
};
function rtTouch_() { RT.dirty = true; }

/* ---------- القيم: تخزين التواريخ في JSON ---------- */
function rtEncode_(v) {
  return JSON.stringify(v, function (k, x) {
    const raw = this[k];
    if (raw instanceof Date) return { $d: raw.getTime() };
    return x;
  });
}
function rtDecode_(s) {
  return JSON.parse(s, function (k, x) {
    if (x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === 1 && typeof x.$d === 'number') return new Date(x.$d);
    return x;
  });
}

/* ---------- الجدول الافتراضي ---------- */
function rtCell_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' && !isFinite(v)) return '#NUM!';
  return v;
}

function RtRange_(sheet, row, col, nr, nc) {
  if (!(row >= 1) || !(col >= 1) || !(nr >= 1) || !(nc >= 1)) {
    throw new Error('إحداثيات النطاق غير صحيحة: ' + [row, col, nr, nc].join(','));
  }
  this.sh = sheet; this.r = row; this.c = col; this.nr = nr; this.nc = nc;
}
RtRange_.prototype.getValues = function () {
  const d = this.sh.data, out = [];
  for (let i = 0; i < this.nr; i++) {
    const src = d[this.r - 1 + i] || [], line = [];
    for (let j = 0; j < this.nc; j++) {
      const v = src[this.c - 1 + j];
      line.push(v === undefined || v === null ? '' : (v instanceof Date ? new Date(v.getTime()) : v));
    }
    out.push(line);
  }
  return out;
};
RtRange_.prototype.getValue = function () { return this.getValues()[0][0]; };
RtRange_.prototype.getDisplayValues = function () {
  return this.getValues().map(function (r) { return r.map(function (v) { return v instanceof Date ? v.toISOString() : String(v); }); });
};
RtRange_.prototype.setValues = function (vals) {
  if (!Array.isArray(vals) || vals.length !== this.nr) throw new Error('عدد الصفوف لا يطابق النطاق (' + (vals && vals.length) + ' ≠ ' + this.nr + ')');
  const d = this.sh.data;
  for (let i = 0; i < this.nr; i++) {
    if (!Array.isArray(vals[i]) || vals[i].length !== this.nc) throw new Error('عدد الأعمدة لا يطابق النطاق (' + (vals[i] && vals[i].length) + ' ≠ ' + this.nc + ')');
    const ri = this.r - 1 + i;
    while (d.length <= ri) d.push([]);
    const line = d[ri];
    for (let j = 0; j < this.nc; j++) {
      const ci = this.c - 1 + j;
      while (line.length < ci) line.push('');
      line[ci] = rtCell_(vals[i][j] instanceof Date ? new Date(vals[i][j].getTime()) : vals[i][j]);
    }
  }
  this.sh.trim_(); rtTouch_();
  return this;
};
RtRange_.prototype.setValue = function (v) {
  const rows = [];
  for (let i = 0; i < this.nr; i++) { const l = []; for (let j = 0; j < this.nc; j++) l.push(v); rows.push(l); }
  return this.setValues(rows);
};
RtRange_.prototype.clearContent = function () {
  const d = this.sh.data;
  for (let i = 0; i < this.nr; i++) {
    const line = d[this.r - 1 + i];
    if (!line) continue;
    for (let j = 0; j < this.nc; j++) if (this.c - 1 + j < line.length) line[this.c - 1 + j] = '';
  }
  this.sh.trim_(); rtTouch_();
  return this;
};
RtRange_.prototype.clear = RtRange_.prototype.clearContent;
RtRange_.prototype.getRow = function () { return this.r; };
RtRange_.prototype.getColumn = function () { return this.c; };
RtRange_.prototype.getNumRows = function () { return this.nr; };
RtRange_.prototype.getNumColumns = function () { return this.nc; };
RtRange_.prototype.getLastRow = function () { return this.r + this.nr - 1; };
// تنسيقات العرض لا معنى لها هنا — تُقبل وتُتجاهل
['setNumberFormat', 'setNumberFormats', 'setBackground', 'setFontColor', 'setFontWeight', 'setHorizontalAlignment',
 'setVerticalAlignment', 'setWrap', 'setFontSize', 'setFontFamily', 'setBorder', 'setNote', 'setDataValidation',
 'setBackgrounds', 'setFontColors', 'setFontWeights', 'setWrapStrategy', 'merge', 'breakApart', 'activate']
  .forEach(function (m) { RtRange_.prototype[m] = function () { return this; }; });

function RtSheet_(name) {
  this.name = name;
  if (!RT.state.sheets[name]) { RT.state.sheets[name] = []; RT.state.order.push(name); rtTouch_(); }
}
Object.defineProperty(RtSheet_.prototype, 'data', { get: function () { return RT.state.sheets[this.name]; } });
RtSheet_.prototype.trim_ = function () {
  const d = this.data;
  const empty = function (l) { return !l || l.every(function (v) { return v === '' || v === null || v === undefined; }); };
  while (d.length && empty(d[d.length - 1])) d.pop();
};
RtSheet_.prototype.getName = function () { return this.name; };
RtSheet_.prototype.getSheetName = RtSheet_.prototype.getName;
RtSheet_.prototype.getLastRow = function () { this.trim_(); return this.data.length; };
RtSheet_.prototype.getLastColumn = function () {
  let m = 0;
  this.data.forEach(function (l) {
    for (let j = l.length - 1; j >= 0; j--) { if (l[j] !== '' && l[j] !== null && l[j] !== undefined) { if (j + 1 > m) m = j + 1; break; } }
  });
  return m;
};
RtSheet_.prototype.getMaxRows = function () { return Math.max(1000, this.data.length); };
RtSheet_.prototype.getMaxColumns = function () { return Math.max(26, this.getLastColumn()); };
RtSheet_.prototype.getRange = function (row, col, nr, nc) {
  if (typeof row === 'string') throw new Error('صيغة A1 غير مدعومة في هذا الإصدار');
  return new RtRange_(this, row, col, nr === undefined ? 1 : nr, nc === undefined ? 1 : nc);
};
RtSheet_.prototype.getDataRange = function () {
  return new RtRange_(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
};
RtSheet_.prototype.appendRow = function (arr) {
  const r = this.getLastRow() + 1;
  this.getRange(r, 1, 1, arr.length).setValues([arr.slice()]);
  return this;
};
RtSheet_.prototype.clear = function () { RT.state.sheets[this.name] = []; rtTouch_(); return this; };
RtSheet_.prototype.clearContents = RtSheet_.prototype.clear;
RtSheet_.prototype.deleteRow = function (r) { this.data.splice(r - 1, 1); rtTouch_(); return this; };
RtSheet_.prototype.deleteRows = function (r, n) { this.data.splice(r - 1, n); rtTouch_(); return this; };
['setFrozenRows', 'setFrozenColumns', 'setRightToLeft', 'autoResizeColumns', 'autoResizeColumn', 'setColumnWidth',
 'setColumnWidths', 'setTabColor', 'hideSheet', 'showSheet', 'activate', 'setConditionalFormatRules']
  .forEach(function (m) { RtSheet_.prototype[m] = function () { return this; }; });

const RT_SS = {
  getId: function () { return 'local'; },
  getName: function () { return 'ميزانيتي'; },
  getUrl: function () { return RT.origin; },
  getSheetByName: function (n) { return RT.state.sheets[n] ? new RtSheet_(n) : null; },
  getSheets: function () { return RT.state.order.filter(function (n) { return RT.state.sheets[n]; }).map(function (n) { return new RtSheet_(n); }); },
  insertSheet: function (n) {
    if (RT.state.sheets[n]) throw new Error('توجد ورقة بهذا الاسم: ' + n);
    return new RtSheet_(n);
  },
  deleteSheet: function (sh) { delete RT.state.sheets[sh.name]; RT.state.order = RT.state.order.filter(function (x) { return x !== sh.name; }); rtTouch_(); },
  getSpreadsheetTimeZone: function () { return 'Asia/Riyadh'; }
};

const RT_UI = {
  alert: function () { return 'OK'; },
  prompt: function () { return { getSelectedButton: function () { return 'CANCEL'; }, getResponseText: function () { return ''; } }; },
  createMenu: function () { const m = { addItem: function () { return m; }, addSeparator: function () { return m; }, addToUi: function () {} }; return m; },
  showModalDialog: function () {}, showSidebar: function () {},
  Button: { OK: 'OK', CANCEL: 'CANCEL', YES: 'YES', NO: 'NO' },
  ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' }
};

var SpreadsheetApp = {
  getActiveSpreadsheet: function () { return RT_SS; },
  getActive: function () { return RT_SS; },
  openById: function () { return RT_SS; },
  flush: function () {},
  getUi: function () { return RT_UI; }
};

/* ---------- الخصائص ---------- */
function rtProps_() {
  const P = RT.state.props;
  const api = {
    getProperty: function (k) { return Object.prototype.hasOwnProperty.call(P, k) ? String(P[k]) : null; },
    setProperty: function (k, v) { P[k] = String(v); rtTouch_(); return api; },
    deleteProperty: function (k) { if (k in P) { delete P[k]; rtTouch_(); } return api; },
    getProperties: function () { return Object.assign({}, P); },
    getKeys: function () { return Object.keys(P); },
    setProperties: function (obj, deleteAllOthers) {
      if (deleteAllOthers) Object.keys(P).forEach(function (k) { delete P[k]; });
      Object.keys(obj || {}).forEach(function (k) { P[k] = String(obj[k]); });
      rtTouch_(); return api;
    },
    deleteAllProperties: function () { Object.keys(P).forEach(function (k) { delete P[k]; }); rtTouch_(); return api; }
  };
  return api;
}
var PropertiesService = {
  getScriptProperties: rtProps_, getUserProperties: rtProps_, getDocumentProperties: rtProps_
};

/* ---------- القفل ---------- */
var LockService = (function () {
  const lock = { tryLock: function () { return true; }, waitLock: function () {}, releaseLock: function () {}, hasLock: function () { return true; } };
  return { getScriptLock: function () { return lock; }, getUserLock: function () { return lock; }, getDocumentLock: function () { return lock; } };
})();

/* ---------- SHA-256 متزامن ---------- */
function rtSha256_(bytes) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const l = bytes.length, bitLen = l * 8;
  const withPad = ((l + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(withPad);
  m.set(bytes); m[l] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(withPad - 4, bitLen >>> 0); dv.setUint32(withPad - 8, Math.floor(bitLen / 0x100000000));
  const w = new Uint32Array(64);
  const rotr = function (x, n) { return (x >>> n) | (x << (32 - n)); };
  for (let off = 0; off < withPad; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H = [(H[0] + a) >>> 0, (H[1] + b) >>> 0, (H[2] + c) >>> 0, (H[3] + d) >>> 0, (H[4] + e) >>> 0, (H[5] + f) >>> 0, (H[6] + g) >>> 0, (H[7] + h) >>> 0];
  }
  const out = [];
  H.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
  return out;
}

/* ---------- الأدوات ---------- */
function rtRiyadhParts_(d) {
  const t = new Date(d.getTime() + 3 * 3600000);   // الرياض UTC+3 بلا توقيت صيفي
  return { y: t.getUTCFullYear(), M: t.getUTCMonth() + 1, d: t.getUTCDate(), H: t.getUTCHours(), m: t.getUTCMinutes(), s: t.getUTCSeconds(), w: t.getUTCDay() };
}
function rtBlob_(content, type, name) {
  const b = {
    _c: String(content == null ? '' : content), _t: type || 'text/plain', _n: name || 'ملف',
    getDataAsString: function () { return b._c; },
    getContentType: function () { return b._t; },
    getName: function () { return b._n; },
    setName: function (n) { b._n = String(n).replace(/\.pdf$/i, '.html'); return b; },
    getAs: function () { return b; },   // التقرير يبقى صفحة قابلة للطباعة كـ PDF من المتصفح
    getBytes: function () { return Array.from(new TextEncoder().encode(b._c)); }
  };
  return b;
}
var Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  Charset: { UTF_8: 'UTF_8' },
  getUuid: function () {
    if (self.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  },
  computeDigest: function (alg, value) {
    if (alg !== 'SHA_256') throw new Error('خوارزمية غير مدعومة');
    const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : Uint8Array.from(value, function (x) { return x & 255; });
    return rtSha256_(bytes).map(function (x) { return x > 127 ? x - 256 : x; });
  },
  formatDate: function (date, tz, fmt) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) throw new Error('تاريخ غير صالح');
    const p = rtRiyadhParts_(d), z = function (n, w) { return String(n).padStart(w || 2, '0'); };
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return String(fmt).replace(/yyyy|yy|MM|dd|HH|mm|ss|EEE|M|d|H/g, function (t) {
      switch (t) {
        case 'yyyy': return String(p.y); case 'yy': return z(p.y % 100);
        case 'MM': return z(p.M); case 'dd': return z(p.d); case 'HH': return z(p.H);
        case 'mm': return z(p.m); case 'ss': return z(p.s); case 'EEE': return days[p.w];
        case 'M': return String(p.M); case 'd': return String(p.d); case 'H': return String(p.H);
      }
      return t;
    });
  },
  sleep: function (ms) { const end = Date.now() + Math.min(Number(ms) || 0, 15000); while (Date.now() < end) { /* انتظار متزامن */ } },
  newBlob: function (content, type, name) { return rtBlob_(content, type, name); },
  base64Encode: function (s) { return btoa(unescape(encodeURIComponent(String(s)))); },
  base64Decode: function (s) { return Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
};
var Logger = { log: function () { try { console.log.apply(console, arguments); } catch (e) {} } };

/* ---------- الاتصال الخارجي (للمستشار فقط) ---------- */
var UrlFetchApp = {
  fetch: function (url, opt) {
    opt = opt || {};
    const x = new XMLHttpRequest();
    x.open(String(opt.method || 'get').toUpperCase(), url, false);   // متزامن — مسموح داخل العامل الخلفي
    const h = opt.headers || {};
    Object.keys(h).forEach(function (k) { if (!/^authorization$/i.test(k) || h[k]) x.setRequestHeader(k, h[k]); });
    if (opt.payload !== undefined && opt.payload !== null) {
      x.setRequestHeader('Content-Type', opt.contentType || 'application/json');
    }
    try {
      x.send(opt.payload === undefined ? null : (typeof opt.payload === 'string' ? opt.payload : JSON.stringify(opt.payload)));
    } catch (e) {
      throw new Error('تعذّر الاتصال بالإنترنت — تحقق من الشبكة');
    }
    if (x.status === 0) throw new Error('تعذّر الاتصال بالإنترنت — تحقق من الشبكة');
    const res = {
      getResponseCode: function () { return x.status; },
      getContentText: function () { return x.responseText || ''; },
      getHeaders: function () { return {}; }
    };
    if (x.status >= 400 && !opt.muteHttpExceptions) {
      throw new Error('فشل الطلب (' + x.status + '): ' + String(x.responseText || '').slice(0, 300));
    }
    return res;
  }
};

/* ---------- ملفات مؤقتة بدل درايف ----------
 * لا تُنشأ روابط blob هنا؛ المحتوى يُحفظ وتُطلَب تنزيلته من الصفحة
 * الرئيسية عبر __file، لأن روابط blob لا تُستخدَم بأمان بين بيئتين. */
function rtFile_(blob) {
  const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const type = blob.getContentType(), content = blob.getDataAsString();
  const f = {
    id: id, name: blob.getName(), created: new Date(),
    getId: function () { return id; }, getName: function () { return f.name; }, getUrl: function () { return 'app-file:' + id; },
    setName: function (n) { f.name = n; return f; }, setSharing: function () { return f; }, setTrashed: function () { return f; },
    getDateCreated: function () { return f.created; }
  };
  RT.drive.push({ id: id, name: f.name, type: type, content: content });
  if (RT.drive.length > 20) RT.drive.shift();
  return f;
}
function rtIter_(arr) { let i = 0; return { hasNext: function () { return i < arr.length; }, next: function () { return arr[i++]; } }; }
const RT_FOLDER = {
  getName: function () { return 'ميزانيتي'; },
  createFile: function (blob) { return rtFile_(blob); },
  getFiles: function () { return rtIter_([]); }
};
var DriveApp = {
  Access: { PRIVATE: 'PRIVATE' }, Permission: { NONE: 'NONE' },
  getFoldersByName: function () { return rtIter_([RT_FOLDER]); },
  createFolder: function () { return RT_FOLDER; },
  getFileById: function () {
    return {
      makeCopy: function (name) {
        RT.backups.push({ name: name, at: Date.now(), state: rtEncode_(RT.state) });
        if (RT.backups.length > 8) RT.backups.shift();
        RT.backupsDirty = true;
        return { getName: function () { return name; } };
      }
    };
  }
};

/* ---------- خدمات لا مكان لها هنا ---------- */
var ScriptApp = (function () {
  const chain = { timeBased: function () { return chain; }, atHour: function () { return chain; }, everyDays: function () { return chain; },
    onWeekDay: function () { return chain; }, inTimezone: function () { return chain; }, everyHours: function () { return chain; },
    nearMinute: function () { return chain; }, create: function () { return {}; } };
  return {
    WeekDay: { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 },
    newTrigger: function () { return chain; },
    getProjectTriggers: function () { return []; },
    deleteTrigger: function () {},
    getService: function () { return { getUrl: function () { return RT.origin; } }; }
  };
})();
var Session = {
  getEffectiveUser: function () { return { getEmail: function () { return ''; } }; },
  getActiveUser: function () { return { getEmail: function () { return ''; } }; },
  getScriptTimeZone: function () { return 'Asia/Riyadh'; }
};
var MailApp = { sendEmail: function () { throw new Error('البريد استُبدل بإشعارات الجوال'); }, getRemainingDailyQuota: function () { return 0; } };
var HtmlService = {
  createTemplateFromFile: function () { throw new Error('غير مستخدم'); },
  createHtmlOutputFromFile: function () { throw new Error('غير مستخدم'); },
  createHtmlOutput: function () { throw new Error('غير مستخدم'); }
};
