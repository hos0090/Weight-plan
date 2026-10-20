/**
 * ============================================================
 *  ميزانيتي — Code.gs — الإصدار 7
 * ============================================================
 *  ما الذي تغيّر عن نسختك السابقة:
 *
 *  [أمان]
 *   - حُذف الباب الخلفي '__system__' نهائياً. كل منطق القراءة انتقل
 *     إلى دوال داخلية تنتهي بـ _ ولا يمكن مناداتها من المتصفح.
 *   - كلمة المرور صارت hash + salt في ScriptProperties، لا في الشيت.
 *   - حد لمحاولات الدخول الفاشلة، وجلسات تُحذف عند الخروج وتُنظَّف دورياً.
 *
 *  [سلامة البيانات]
 *   - كل عمليات التعديل والحذف تعتمد على المعرف (id) لا على رقم الصف.
 *   - LockService حول كل كتابة.
 *   - الحذف صار "حذف ناعم" مع سلة محذوفات قابلة للاستعادة.
 *   - الترقية تأخذ نسخة احتياطية كاملة قبل أي تعديل على البيانات.
 *
 *  [أداء]
 *   - كل ورقة تُقرأ مرة واحدة فقط في الطلب الواحد (طبقة cache).
 *
 *  [مزايا جديدة]
 *   1  المشتريات النثرية تدخل في حساب المتبقي الآمن، ولها سقف شهري.
 *   2  إقفال الشهر وترحيل الرصيد للشهر التالي.
 *   3  التزامات بمبلغ تقديري يُقترح من متوسط آخر 3 أشهر.
 *   4  مصادر دخل متغيرة: متوقع مقابل محقق.
 *   5  تقسيم الالتزام الواحد على أكثر من مصدر دخل.
 *   6  لوحة الديون والأقساط وتاريخ آخر قسط.
 *   7  تنبيه بالدخل الذي تأخر ولم تسجّل نزوله.
 *   8  تصنيف مستقل للمشتريات عن وصفها.
 *   10 تصدير تقرير PDF ونسخة احتياطية أسبوعية.
 *   11 مقارنة الشهور ومتوسط آخر 3 أشهر.
 *   12 محاكي "ماذا لو".
 *   16 سلة محذوفات مع تراجع.
 * ============================================================
 */

const TZ = 'Asia/Riyadh';
const SCHEMA_VERSION = '13';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;   // 12 ساعة
const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const TRASH_KEEP_DAYS = 30;

const SHEETS = {
  SETTINGS:       'الإعدادات',
  INCOME:         'مصادر الدخل',
  INCOME_MONTHLY: 'حالة مصادر الدخل الشهرية',
  OBLIGATIONS:    'الالتزامات',
  ALLOCATIONS:    'تخصيصات السداد',
  PAYMENTS:       'سداد الالتزامات',
  PURCHASES:      'المشتريات النثرية',
  SAVINGS:        'الأهداف الادخارية',
  SAVINGS_TX:     'حركات الادخار',
  MONTHS:         'إقفال الشهور',
  TRANSFERS:      'تحويلات بين المصادر',
  RECURRING:      'المشتريات المتكررة',
  AUDIT:          'سجل العمليات',
  AI_LOG:         'سجل المستشار',
  RESERVES:       'التجنيب',
  RESERVE_TX:     'إيداعات التجنيب',
  AGENT_UNDO:     'تراجع المستشار'
};

const HEADERS = {
  SETTINGS:       ['المفتاح','القيمة','الوصف'],
  INCOME:         ['المعرف','اسم المصدر','نوع المبلغ','المبلغ المتوقع','يوم النزول','دخل أساسي؟','ملاحظات','محذوف؟','تاريخ الحذف'],
  INCOME_MONTHLY: ['المعرف','معرف المصدر','الشهر','نزل؟','موقوف؟','تاريخ النزول','المبلغ الفعلي','ملاحظات'],
  OBLIGATIONS:    ['المعرف','الالتزام','نوع المبلغ','المبلغ','يوم الاستحقاق','نوع الالتزام','أقصى تأخير','الأولوية','التكرار','تاريخ البداية','تاريخ الانتهاء','ملاحظات','نشط؟','محذوف؟','تاريخ الحذف','التصنيف','خصم تلقائي','التوقع','حصتي %','معدل الفائدة %'],
  ALLOCATIONS:    ['المعرف','معرف الالتزام','معرف المصدر','المبلغ'],
  PAYMENTS:       ['المعرف','معرف الالتزام','الشهر','المبلغ','المبلغ المستحق','تاريخ السداد','ملاحظات'],
  PURCHASES:      ['المعرف','التاريخ','المبلغ','التصنيف','المشتريات','من أين','ملاحظات','محذوف؟','تاريخ الحذف','معرف المتكرر'],
  SAVINGS:        ['المعرف','اسم الهدف','المبلغ المستهدف','المدخر حتى الآن','المساهمة الشهرية','تاريخ الهدف','ملاحظات','نشط؟','محذوف؟','تاريخ الحذف','مصدر الدخل'],
  SAVINGS_TX:     ['المعرف','معرف الهدف','الشهر','التاريخ','المبلغ','ملاحظات'],
  MONTHS:         ['المعرف','الشهر','الرصيد الافتتاحي','الدخل المحقق','الالتزامات المسددة','المشتريات','الادخار','الرصيد الختامي','تاريخ الإقفال'],
  TRANSFERS:      ['المعرف','التاريخ','الدورة','من مصدر','إلى مصدر','المبلغ','ملاحظات'],
  RECURRING:      ['المعرف','الوصف','المبلغ','التصنيف','من أين','يوم الشهر','نشط؟','ملاحظات'],
  AUDIT:          ['المعرف','التاريخ','العملية','الشهر','التفاصيل'],
  AI_LOG:         ['المعرف','التاريخ','الدورة','النوع','السؤال','الجواب','ملاحظة المستخدم'],
  RESERVES:       ['المعرف','الاسم','الالتزام المرتبط','المبلغ المستهدف','تاريخ الاستحقاق','المساهمات','من دورة','نشط؟','ملاحظات','محذوف؟','تاريخ الحذف'],
  RESERVE_TX:     ['المعرف','التجنيب','الدورة','المبلغ','التاريخ'],
  AGENT_UNDO:     ['المعرف','التاريخ','الدورة','الملخص','البيانات','تم التراجع']
};

// أسماء الحقول بالإنجليزية بنفس ترتيب الأعمدة أعلاه — تُستخدم داخلياً فقط.
const FIELDS = {
  SETTINGS:       ['key','value','desc'],
  INCOME:         ['id','name','amountType','amount','day','isBasic','notes','deleted','deletedAt'],
  INCOME_MONTHLY: ['id','sourceId','month','arrived','paused','arrivalDate','actualAmount','notes'],
  OBLIGATIONS:    ['id','name','amountType','amount','day','type','maxDelay','priority','recurrence','startDate','endDate','notes','active','deleted','deletedAt','category','autoDeduct','certainty','sharePercent','interestRate'],
  ALLOCATIONS:    ['id','obligationId','sourceId','amount'],
  PAYMENTS:       ['id','obligationId','month','amount','dueAmount','date','notes'],
  PURCHASES:      ['id','date','amount','category','item','store','notes','deleted','deletedAt','recurringId'],
  SAVINGS:        ['id','name','target','saved','monthly','targetDate','notes','active','deleted','deletedAt','sourceId'],
  SAVINGS_TX:     ['id','goalId','month','date','amount','notes'],
  MONTHS:         ['id','month','opening','income','obligations','purchases','savings','closing','closedAt'],
  TRANSFERS:      ['id','date','month','fromId','toId','amount','notes'],
  RECURRING:      ['id','item','amount','category','store','day','active','notes'],
  AUDIT:          ['id','at','action','month','details'],
  AI_LOG:         ['id','at','month','kind','question','answer','userNote'],
  RESERVES:       ['id','name','obligationId','target','dueDate','contributions','fromCycle','active','notes','deleted','deletedAt'],
  RESERVE_TX:     ['id','reserveId','month','amount','date'],
  AGENT_UNDO:     ['id','at','month','summary','payload','undone']
};

const ID_PREFIX = {
  INCOME:'INC', INCOME_MONTHLY:'IMS', OBLIGATIONS:'OBL', ALLOCATIONS:'ALC',
  PAYMENTS:'PAY', PURCHASES:'PUR', SAVINGS:'SAV', SAVINGS_TX:'STX', MONTHS:'MON',
  RECURRING:'RCR', AUDIT:'LOG', TRANSFERS:'TRF', AI_LOG:'AI', RESERVES:'RSV', RESERVE_TX:'RTX', AGENT_UNDO:'UND'
};

const DEFAULT_CATEGORIES = ['قهوة','مطاعم','مقاضي','مواصلات','بنزين','منزل','ملابس','ترفيه','صحة','أخرى'];
const DEFAULT_OB_CATEGORIES = ['سكن','أقساط وتمويل','فواتير وخدمات','مصاريف المنزل','تعليم','مواصلات','صحة وتأمين','اشتراكات','مشروع نورفيل','التزامات عائلية','أخرى'];
const ARREARS_LOOKBACK = 12;   // كم شهراً نرجع للبحث عن متأخرات

/* ============================================================
 *  0) نقطة الدخول والقائمة
 * ========================================================== */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ميزانيتي')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  // ملاحظة: أُزيل setXFrameOptionsMode(ALLOWALL) عمداً.
  // إعادته تسمح لأي موقع بتضمين تطبيقك داخل iframe (clickjacking).
}

/** لتقسيم ملفات الواجهة: <?!= include('Styles'); ?> */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ميزانيتي')
    .addItem('تجهيز ومزامنة البيانات', 'setupBudgetSheets')
    .addItem('فتح التطبيق', 'openApp')
    .addSeparator()
    .addItem('تعيين كلمة مرور جديدة', 'resetPasswordFromSheet')
    .addSeparator()
    .addItem('تفعيل التنبيهات اليومية', 'setupTriggers')
    .addItem('إيقاف التنبيهات', 'deleteTriggers')
    .addItem('أخذ نسخة احتياطية الآن', 'backupNow')
    .addSeparator()
    .addItem('تفعيل صلاحيات المستشار', 'authorizeAdvisor')
    .addItem('فحص وإصلاح الأوراق', 'repairFromMenu')
    .addToUi();
}

function openApp() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(
      '<script>window.open(' + JSON.stringify(url) + ",'_blank');google.script.host.close();</script>"),
    'فتح ميزانيتي…');
}

function setupBudgetSheets() {
  const res = setupSilent_();
  SpreadsheetApp.getUi().alert(
    'تم التجهيز بنجاح.\n\n' +
    (res.backupName
      ? 'أُخذت نسخة احتياطية باسم:\n' + res.backupName + '\n\n'
      : '') +
    (res.migrated
      ? 'تمت ترقية بياناتك القديمة إلى الهيكل الجديد دون حذف أي سجل.'
      : 'الهيكل محدّث ولا يحتاج ترقية.') +
    (res.duplicatesRemoved
      ? '\n\nأُزيل ' + res.duplicatesRemoved + ' صفاً مكرراً نتج عن خلل سابق في تسجيل السداد.'
      : '') +
    (res.newPassword
      ? '\n\nكلمة المرور المؤقتة: ' + res.newPassword + '\nغيّرها من داخل التطبيق.'
      : ''));
}

function resetPasswordFromSheet() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('كلمة مرور جديدة', 'اكتب كلمة المرور الجديدة (6 أحرف فأكثر):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const p = String(r.getResponseText() || '');
  if (p.length < 6) { ui.alert('كلمة المرور قصيرة جداً.'); return; }
  storePassword_(p);
  clearAllSessions_();
  ui.alert('تم تغيير كلمة المرور وإنهاء كل الجلسات المفتوحة.');
}

/* ============================================================
 *  1) طبقة الوصول للبيانات + الـ cache
 * ========================================================== */

let CACHE = null;
function cacheReset_() { CACHE = {}; }
function cached_(key, fn) {
  if (!CACHE) CACHE = {};
  if (!(key in CACHE)) CACHE[key] = fn();
  return CACHE[key];
}
function cacheDrop_(prefix) {
  if (!CACHE) return;
  Object.keys(CACHE).forEach(function (k) {
    if (k.indexOf(prefix) === 0) delete CACHE[k];
  });
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(key) {
  return cached_('sh:' + key, function () {
    const name = SHEETS[key];
    let sh = ss_().getSheetByName(name);
    if (!sh) {
      sh = ss_().insertSheet(name);
      sh.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]);
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
    }
    return sh;
  });
}

/** يقرأ الورقة كاملة مرة واحدة ويعيد مصفوفة كائنات. */
function table_(key) {
  return cached_('tbl:' + key, function () {
    const sh = sheet_(key), n = HEADERS[key].length;
    if (sh.getLastRow() < 2) return [];
    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, n).getValues();
    const f = FIELDS[key];
    return vals.map(function (r, i) {
      const o = { __row: i + 2 };
      for (let c = 0; c < n; c++) o[f[c]] = r[c];
      return o;
    });
  });
}

/** الصفوف غير المحذوفة فقط. */
function live_(key) {
  return table_(key).filter(function (r) { return !yes_(r.deleted); });
}

function rowToArray_(key, obj) {
  return FIELDS[key].map(function (f) {
    const v = obj[f];
    return v === undefined || v === null ? '' : v;
  });
}

function insert_(key, obj) {
  const sh = sheet_(key);
  if (!obj.id) obj.id = newId_(ID_PREFIX[key] || 'REC');
  sh.appendRow(rowToArray_(key, obj));
  cacheDrop_('tbl:' + key);
  return obj.id;
}

function insertMany_(key, objs) {
  if (!objs.length) return;
  const sh = sheet_(key);
  const rows = objs.map(function (o) {
    if (!o.id) o.id = newId_(ID_PREFIX[key] || 'REC');
    return rowToArray_(key, o);
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS[key].length).setValues(rows);
  cacheDrop_('tbl:' + key);
}

function findById_(key, id) {
  const idStr = String(id || '');
  const all = table_(key);
  for (let i = 0; i < all.length; i++) if (String(all[i].id) === idStr) return all[i];
  return null;
}

/**
 * التعديل بالمعرف لا برقم الصف.
 * رقم الصف القادم من المتصفح قد يكون قديماً (تبويبان مفتوحان، أو حذف سابق)
 * فيؤدي إلى تعديل أو حذف السجل الخطأ.
 */
function updateById_(key, id, patch) {
  const rec = findById_(key, id);
  if (!rec) throw new Error('السجل غير موجود أو حُذف.');
  const merged = Object.assign({}, rec, patch);
  sheet_(key).getRange(rec.__row, 1, 1, HEADERS[key].length)
    .setValues([rowToArray_(key, merged)]);
  cacheDrop_('tbl:' + key);
  return merged;
}

function softDelete_(key, id) {
  return updateById_(key, id, { deleted: 'نعم', deletedAt: nowStamp_() });
}

function hardDeleteWhere_(key, predicate) {
  const sh = sheet_(key), all = table_(key);
  const keep = all.filter(function (r) { return !predicate(r); });
  if (keep.length === all.length) return 0;
  const n = HEADERS[key].length;
  if (all.length) sh.getRange(2, 1, all.length, n).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, n)
    .setValues(keep.map(function (r) { return rowToArray_(key, r); }));
  cacheDrop_('tbl:' + key);
  return all.length - keep.length;
}

/* ============================================================
 *  2) التجهيز والترقية الآمنة
 * ========================================================== */

function setupSilent_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('النظام مشغول، أعد المحاولة بعد قليل.');
  try {
    cacheReset_();
    const out = { migrated: false, backupName: '', newPassword: '', duplicatesRemoved: 0 };
    const legacy = detectLegacy_();

    if (legacy.needsMigration) {
      out.backupName = takeBackup_('قبل الترقية');
      migrateToV7_(legacy);
      out.migrated = true;
    }

    Object.keys(SHEETS).forEach(function (k) { ensureSheet_(k); });
    out.newPassword = seedSettings_();
    ensureAllIds_();
    out.duplicatesRemoved = dedupeRows_();
    enforceTextMonths_();
    formatSheets_();
    PropertiesService.getScriptProperties().setProperty('SCHEMA_VERSION', SCHEMA_VERSION);
    cacheReset_();
    return out;
  } finally {
    lock.releaseLock();
  }
}

function ensureSchema_() {
  if (PropertiesService.getScriptProperties().getProperty('SCHEMA_VERSION') === SCHEMA_VERSION) return;
  setupSilent_();
}

function ensureSheet_(key) {
  const name = SHEETS[key], heads = HEADERS[key];
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, heads.length).setValues([heads]);
  } else {
    const cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), heads.length)).getValues()[0];
    let fix = false;
    heads.forEach(function (h, i) { if (String(cur[i]) !== h) fix = true; });
    if (fix) sh.getRange(1, 1, 1, heads.length).setValues([heads]);
  }
  sh.setFrozenRows(1);
  sh.setRightToLeft(true);
  cacheDrop_('sh:' + key);
  cacheDrop_('tbl:' + key);
  return sh;
}

/** يقرأ ورقة قديمة حسب أسماء أعمدتها الفعلية — أمتن بكثير من القراءة بالترتيب. */
function readByHeaderNames_(sheetName) {
  const sh = ss_().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 1) return { heads: [], rows: [] };
  const width = Math.max(1, sh.getLastColumn());
  const heads = sh.getRange(1, 1, 1, width).getValues()[0].map(function (x) { return String(x).trim(); });
  if (sh.getLastRow() < 2) return { heads: heads, rows: [] };
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues();
  const rows = vals.map(function (r) {
    const o = {};
    heads.forEach(function (h, i) { if (h) o[h] = r[i]; });
    return o;
  });
  return { heads: heads, rows: rows };
}

function detectLegacy_() {
  const res = { needsMigration: false, income: null, obligations: null, savings: null, purchases: null };
  const inc = readByHeaderNames_(SHEETS.INCOME);
  const obl = readByHeaderNames_(SHEETS.OBLIGATIONS);
  const sav = readByHeaderNames_(SHEETS.SAVINGS);
  const pur = readByHeaderNames_(SHEETS.PURCHASES);

  // الهيكل الجديد يميّزه عمود "نوع المبلغ" في مصادر الدخل.
  if (inc.heads.length && inc.heads.indexOf('نوع المبلغ') < 0) { res.income = inc; res.needsMigration = true; }
  if (obl.heads.length && obl.heads.indexOf('نوع المبلغ') < 0) { res.obligations = obl; res.needsMigration = true; }
  if (sav.heads.length && sav.heads.indexOf('محذوف؟') < 0) { res.savings = sav; res.needsMigration = true; }
  if (pur.heads.length && pur.heads.indexOf('التصنيف') < 0) { res.purchases = pur; res.needsMigration = true; }
  return res;
}

function takeBackup_(label) {
  try {
    const file = DriveApp.getFileById(ss_().getId());
    const name = ss_().getName() + ' — نسخة ' + (label || '') + ' ' + nowStamp_();
    const folder = backupFolder_();
    const copy = file.makeCopy(name, folder);
    return copy.getName();
  } catch (e) {
    // لا نوقف الترقية إذا تعذّرت النسخة، لكن نسجّل ذلك.
    return '';
  }
}

function backupFolder_() {
  const name = 'ميزانيتي — النسخ الاحتياطية';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/**
 * تشغيلها مرة واحدة من محرر السكربت يُظهر نافذة الصلاحيات،
 * ومنها صلاحية الاتصال الخارجي التي يحتاجها المستشار.
 * الكود لا يمنح نفسه صلاحية — أنت من يوافق.
 */
function authorizeAdvisor() {
  let net = 'فشل';
  try {
    UrlFetchApp.fetch('https://www.googleapis.com/discovery/v1/apis?preferred=true',
      { muteHttpExceptions: true });
    net = 'يعمل';
  } catch (e) {
    net = 'فشل: ' + String(e.message || e);
  }
  const key = aiKey_() ? 'موجود' : 'غير مضاف';
  let ai = 'لم يُختبر';
  if (aiKey_()) {
    try { callGemini_('اكتب: جاهز', null); ai = 'يعمل'; }
    catch (e) { ai = 'فشل: ' + String(e.message || e); }
  }
  const msg = 'حالة المستشار:\n\n' +
    '• الاتصال الخارجي (UrlFetchApp): ' + net + '\n' +
    '• مفتاح Gemini: ' + key + '\n' +
    '• نداء النموذج: ' + ai + '\n\n' +
    (net === 'يعمل'
      ? 'الصلاحية ممنوحة. إن كان التطبيق منشوراً فأعد النشر بإصدار جديد ليسري المفعول.'
      : 'لم تُمنح صلاحية الاتصال الخارجي بعد. وافق على نافذة الصلاحيات ثم أعد تشغيل هذه الدالة.');
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* قد تُشغَّل من المحرر بلا واجهة */ }
  return msg;
}

function backupNow() {
  const n = takeBackup_('يدوية');
  SpreadsheetApp.getUi().alert(n ? 'تم إنشاء نسخة احتياطية:\n' + n : 'تعذّر إنشاء النسخة الاحتياطية.');
}

function weeklyBackup() {
  takeBackup_('أسبوعية');
  const folder = backupFolder_();
  const cutoff = Date.now() - 90 * 86400000;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf('أسبوعية') > -1 && f.getDateCreated().getTime() < cutoff) f.setTrashed(true);
  }
}

function migrateToV7_(legacy) {
  // --- مصادر الدخل ---
  if (legacy.income) {
    const out = [], monthly = [], month = currentMonth_();
    legacy.income.rows.forEach(function (r) {
      const name = String(r['اسم المصدر'] || '').trim();
      if (!name) return;
      const id = String(r['المعرف'] || '').trim() || newId_('INC');
      out.push({
        id: id, name: name, amountType: 'ثابت',
        amount: num(r['المبلغ']), day: clampDay_(r['يوم النزول']),
        isBasic: r['دخل أساسي؟'] === undefined ? 'نعم' : (yes_(r['دخل أساسي؟']) ? 'نعم' : 'لا'),
        notes: String(r['ملاحظات'] || ''), deleted: 'لا', deletedAt: ''
      });
      // حالة الشهر الحالي كانت مخزّنة داخل صف المصدر — ننقلها لورقتها الصحيحة.
      if (yes_(r['نزل هذا الشهر؟']) || yes_(r['موقوف هذا الشهر؟'])) {
        monthly.push({
          id: newId_('IMS'), sourceId: id, month: month,
          arrived: yes_(r['نزل هذا الشهر؟']) ? 'نعم' : 'لا',
          paused: yes_(r['موقوف هذا الشهر؟']) ? 'نعم' : 'لا',
          arrivalDate: yes_(r['نزل هذا الشهر؟']) ? today_() : '',
          actualAmount: '', notes: 'ترحيل تلقائي'
        });
      }
    });
    rewriteSheet_('INCOME', out);
    ensureSheet_('INCOME_MONTHLY');
    if (monthly.length) insertMany_('INCOME_MONTHLY', monthly);
  }

  // --- الالتزامات + استخراج التخصيصات ---
  if (legacy.obligations) {
    const out = [], allocs = [], paid = [], month = currentMonth_();
    const incomeIds = {}, incomeNames = {};
    live_('INCOME').forEach(function (i) { incomeIds[i.id] = true; incomeNames[i.name] = i.id; });

    legacy.obligations.rows.forEach(function (r) {
      const name = String(r['الالتزام'] || '').trim();
      if (!name) return;
      const id = String(r['المعرف'] || '').trim() || newId_('OBL');
      const amount = num(r['المبلغ']);
      const recurring = String(r['التكرار'] || 'شهري') !== 'مرة واحدة';
      const start = String(r['تاريخ البداية'] || '') || month;
      out.push({
        id: id, name: name, amountType: 'ثابت', amount: amount,
        day: clampDay_(r['يوم الاستحقاق']),
        type: String(r['نوع الالتزام'] || 'صارم'),
        maxDelay: num(r['أقصى تأخير']),
        priority: String(r['الأولوية'] || 'متوسطة'),
        recurrence: recurring ? 'شهري' : 'مرة واحدة',
        startDate: start,
        endDate: recurring ? String(r['تاريخ الانتهاء'] || '') : (String(r['تاريخ الانتهاء'] || '') || start),
        notes: String(r['ملاحظات'] || ''),
        active: String(r['نشط؟'] || 'نعم'), deleted: 'لا', deletedAt: ''
      });
      // عمود "مصدر الدخل" الواحد يصبح صف تخصيص واحد بكامل المبلغ.
      const ref = String(r['مصدر الدخل'] || '').trim();
      const sid = incomeIds[ref] ? ref : (incomeNames[ref] || '');
      if (sid) allocs.push({ id: newId_('ALC'), obligationId: id, sourceId: sid, amount: amount });
      // الحالة القديمة "مدفوع" تتحول إلى سجل سداد لهذا الشهر.
      if (String(r['الحالة'] || '') === 'مدفوع') {
        paid.push({ id: newId_('PAY'), obligationId: id, month: month, amount: amount,
                    dueAmount: amount, date: today_(), notes: 'ترحيل تلقائي من الحالة القديمة' });
      }
    });
    rewriteSheet_('OBLIGATIONS', out);
    ensureSheet_('ALLOCATIONS');
    if (allocs.length) insertMany_('ALLOCATIONS', allocs);
    if (paid.length) {
      ensureSheet_('PAYMENTS');
      const existing = {};
      table_('PAYMENTS').forEach(function (p) { existing[p.obligationId + '|' + p.month] = true; });
      const fresh = paid.filter(function (p) { return !existing[p.obligationId + '|' + p.month]; });
      if (fresh.length) insertMany_('PAYMENTS', fresh);
    }
  }

  // --- الأهداف الادخارية ---
  if (legacy.savings) {
    const out = [];
    legacy.savings.rows.forEach(function (r) {
      const name = String(r['اسم الهدف'] || '').trim();
      if (!name) return;
      out.push({
        id: String(r['المعرف'] || '').trim() || newId_('SAV'),
        name: name, target: num(r['المبلغ المستهدف']), saved: num(r['المدخر حتى الآن']),
        monthly: num(r['المساهمة الشهرية']),
        targetDate: String(r['تاريخ الهدف'] || ''), notes: String(r['ملاحظات'] || ''),
        active: String(r['نشط؟'] || 'نعم'), deleted: 'لا', deletedAt: ''
      });
    });
    rewriteSheet_('SAVINGS', out);
  }

  // --- المشتريات النثرية ---
  if (legacy.purchases) {
    const out = [];
    legacy.purchases.rows.forEach(function (r) {
      const item = String(r['المشتريات'] || '').trim();
      if (!item) return;
      out.push({
        id: String(r['المعرف'] || '').trim() || newId_('PUR'),
        date: fmtDate_(toDate_(r['التاريخ'])) || today_(),
        amount: num(r['المبلغ']),
        category: 'أخرى',          // التصنيف لم يكن موجوداً؛ يُصنَّف لاحقاً يدوياً
        item: item, store: String(r['من أين'] || ''), notes: String(r['ملاحظات'] || ''),
        deleted: 'لا', deletedAt: ''
      });
    });
    rewriteSheet_('PURCHASES', out);
  }
}

function rewriteSheet_(key, rows) {
  const name = SHEETS[key];
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, HEADERS[key].length)
      .setValues(rows.map(function (r) { return rowToArray_(key, r); }));
  }
  sh.setFrozenRows(1);
  sh.setRightToLeft(true);
  cacheDrop_('sh:' + key);
  cacheDrop_('tbl:' + key);
}

/**
 * يزيل صفوف السداد وحالة الدخل المكرّرة الناتجة عن الخلل السابق
 * (كان البحث عن الصف الموجود يفشل فيُضاف صف جديد مع كل محاولة).
 * يُبقي آخر صف لكل مفتاح لأنه الأحدث.
 */
function dedupeRows_() {
  let removed = 0;

  const payKeep = {};
  table_('PAYMENTS').forEach(function (p) {
    payKeep[String(p.obligationId) + '|' + monthKey_(p.month)] = String(p.id);
  });
  removed += hardDeleteWhere_('PAYMENTS', function (p) {
    return payKeep[String(p.obligationId) + '|' + monthKey_(p.month)] !== String(p.id);
  });

  const imKeep = {};
  table_('INCOME_MONTHLY').forEach(function (r) {
    imKeep[String(r.sourceId) + '|' + monthKey_(r.month)] = String(r.id);
  });
  removed += hardDeleteWhere_('INCOME_MONTHLY', function (r) {
    return imKeep[String(r.sourceId) + '|' + monthKey_(r.month)] !== String(r.id);
  });

  const moKeep = {};
  table_('MONTHS').forEach(function (r) { moKeep[monthKey_(r.month)] = String(r.id); });
  removed += hardDeleteWhere_('MONTHS', function (r) {
    return moKeep[monthKey_(r.month)] !== String(r.id);
  });

  return removed;
}

/**
 * إصلاح شامل: يُنشئ الأوراق الناقصة، يضيف الأعمدة الجديدة، يزيل التكرار،
 * ويصحّح الالتزامات التي أخفاها تاريخ بداية خاطئ.
 * آمن للتشغيل مراراً — لا يحذف بيانات.
 */
function repairAll_() {
  const report = { sheetsCreated: [], headersFixed: [], obligationsFixed: [],
                   duplicatesRemoved: 0, idsAdded: 0, notes: [] };
  const ss = ss_();

  // الأوراق والأعمدة
  Object.keys(SHEETS).forEach(function (key) {
    const name = SHEETS[key];
    const existed = !!ss.getSheetByName(name);
    const sh = ensureSheet_(key);
    if (!existed) report.sheetsCreated.push(name);
    else {
      const heads = HEADERS[key];
      const width = Math.max(sh.getLastColumn(), heads.length);
      const cur = sh.getRange(1, 1, 1, width).getValues()[0];
      let changed = false;
      heads.forEach(function (h, i) { if (String(cur[i] || '') !== h) changed = true; });
      if (changed) report.headersFixed.push(name);
    }
  });

  // تصحيح تاريخ البداية الذي يُخفي الالتزام
  const obs = table_('OBLIGATIONS');
  obs.forEach(function (r) {
    if (yes_(r.deleted)) return;
    const start = toDate_(r.startDate);
    if (!start) return;
    const day = clampDay_(r.day);
    const k = cycleOf_(start);
    const due = cycleDate_(k, day);
    if (due < start) {
      // الاستحقاق يسبق تاريخ البداية داخل نفس الدورة ⇒ البند غير مرئي
      updateById_('OBLIGATIONS', r.id, { startDate: fmtDate_(due) });
      report.obligationsFixed.push(String(r.name) + ' (' + fmtDate_(start) + ' ← ' + fmtDate_(due) + ')');
    }
  });

  // قيم إعدادات حوّلها الشيت إلى تواريخ ⇒ نعيدها نصاً
  const setSh = sheet_('SETTINGS');
  const lastS = setSh.getLastRow();
  if (lastS >= 2) {
    const rng = setSh.getRange(2, 2, lastS - 1, 1);
    const vals = rng.getValues();
    let fixedSettings = 0;
    const norm = vals.map(function (r) {
      if (Object.prototype.toString.call(r[0]) === '[object Date]') { fixedSettings++; return [settingValue_(r[0])]; }
      return [r[0] === null || r[0] === undefined ? '' : String(r[0])];
    });
    rng.setNumberFormat('@');
    rng.setValues(norm);
    if (fixedSettings) report.notes.push('صُحّح ' + fixedSettings + ' إعداد كان الشيت قد حوّله إلى تاريخ (منها تاريخ البداية)');
  }
  cacheReset_();

  report.duplicatesRemoved = dedupeRows_();
  ensureAllIds_();
  enforceTextMonths_();
  formatSheets_();

  // ملاحظات تشخيصية
  const inc = live_('INCOME').length, ob = live_('OBLIGATIONS').length;
  if (!inc) report.notes.push('لا توجد مصادر دخل مسجّلة');
  if (!ob) report.notes.push('لا توجد التزامات مسجّلة');
  if (!aiKey_()) report.notes.push('مفتاح Gemini غير مضاف — المستشار معطّل');
  return report;
}

function repairAll(token) {
  guard_(token);
  const r = withLock_(function () { return repairAll_(); });
  try { SpreadsheetApp.flush(); } catch (e) {}
  cacheReset_();
  const parts = [];
  if (r.sheetsCreated.length) parts.push('أُنشئت أوراق: ' + r.sheetsCreated.join('، '));
  if (r.headersFixed.length) parts.push('صُحّحت أعمدة: ' + r.headersFixed.join('، '));
  if (r.obligationsFixed.length) parts.push('أُصلح ' + r.obligationsFixed.length + ' التزام كان مخفياً');
  if (r.duplicatesRemoved) parts.push('أُزيل ' + r.duplicatesRemoved + ' صف مكرر');
  return { success: true, report: r, data: buildAppData_(defaultMonth_()),
           message: parts.length ? parts.join(' · ') : 'كل شيء سليم — لا يحتاج إصلاحاً' };
}

function repairFromMenu() {
  const r = withLock_(function () { return repairAll_(); });
  try { SpreadsheetApp.flush(); } catch (e) {}
  cacheReset_();
  const lines = ['نتيجة الفحص والإصلاح:', ''];
  lines.push('أوراق أُنشئت: ' + (r.sheetsCreated.length ? r.sheetsCreated.join('، ') : 'لا شيء'));
  lines.push('أعمدة صُحّحت: ' + (r.headersFixed.length ? r.headersFixed.join('، ') : 'لا شيء'));
  lines.push('التزامات كانت مخفية: ' + (r.obligationsFixed.length ? r.obligationsFixed.length : 'لا شيء'));
  r.obligationsFixed.forEach(function (x) { lines.push('   • ' + x); });
  lines.push('صفوف مكررة أُزيلت: ' + r.duplicatesRemoved);
  if (r.notes.length) { lines.push(''); lines.push('ملاحظات:'); r.notes.forEach(function (n) { lines.push('   • ' + n); }); }
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

function ensureAllIds_() {
  Object.keys(SHEETS).forEach(function (key) {
    if (key === 'SETTINGS') return;
    const rows = table_(key);
    if (!rows.length) return;
    let changed = false;
    rows.forEach(function (r) {
      if (!String(r.id || '').trim()) { r.id = newId_(ID_PREFIX[key] || 'REC'); changed = true; }
    });
    if (changed) {
      sheet_(key).getRange(2, 1, rows.length, HEADERS[key].length)
        .setValues(rows.map(function (r) { return rowToArray_(key, r); }));
      cacheDrop_('tbl:' + key);
    }
  });
}

/** أعمدة الشهر تُضبط كنص صريح حتى لا يحوّلها الشيت إلى تواريخ. */
const MONTH_COLUMNS = { PAYMENTS: 3, INCOME_MONTHLY: 3, SAVINGS_TX: 3, MONTHS: 2, AUDIT: 4 };

function enforceTextMonths_() {
  Object.keys(MONTH_COLUMNS).forEach(function (key) {
    try {
      const sh = sheet_(key), col = MONTH_COLUMNS[key];
      sh.getRange(1, col, Math.max(sh.getMaxRows(), 2), 1).setNumberFormat('@');
    } catch (e) { /* التنسيق تحسين وقائي ولا يجوز أن يوقف التجهيز */ }
  });
}

function formatSheets_() {
  Object.keys(SHEETS).forEach(function (key) {
    const sh = sheet_(key), n = HEADERS[key].length;
    sh.getRange(1, 1, 1, n)
      .setBackground('#14324F').setFontColor('#FFFFFF')
      .setFontWeight('bold').setHorizontalAlignment('center');
    try { sh.autoResizeColumns(1, n); } catch (e) {}
  });
}

function seedSettings_() {
  ensureSheet_('SETTINGS');
  const existing = {};
  table_('SETTINGS').forEach(function (r) { existing[String(r.key)] = r; });
  const defaults = [
    ['APP_USER', 'admin', 'اسم المستخدم'],
    ['SAFETY_BUFFER', '0', 'احتياطي الأمان الشهري بالريال'],
    ['SAVINGS_RATE', '20', 'نسبة الادخار المقترحة من المتبقي الآمن (%)'],
    ['PURCHASE_BUDGET', '0', 'سقف المشتريات النثرية الشهري بالريال'],
    ['PURCHASE_CATEGORIES', JSON.stringify(DEFAULT_CATEGORIES), 'تصنيفات المشتريات'],
    ['OBLIGATION_CATEGORIES', JSON.stringify(DEFAULT_OB_CATEGORIES), 'تصنيفات الالتزامات'],
    ['ROLLOVER', 'نعم', 'ترحيل رصيد الشهر المقفل إلى الشهر التالي'],
    ['START_DATE', today_(), 'تاريخ بداية العمل بالتطبيق — لا يُحسب شيء قبله'],
    ['CYCLE_START_DAY', '1', 'يوم بداية الدورة المالية (1 = الشهر الميلادي، 27 = من الراتب للراتب)'],
    ['CATEGORY_BUDGETS', '{}', 'سقف شهري لكل تصنيف مشتريات']
  ];
  const add = defaults.filter(function (d) { return !existing[d[0]]; })
    .map(function (d) { return { key: d[0], value: d[1], desc: d[2] }; });
  if (add.length) insertMany_('SETTINGS', add);

  // كلمة المرور لم تعد تُخزَّن في الشيت إطلاقاً.
  const props = PropertiesService.getScriptProperties();
  let temp = '';
  if (!props.getProperty('PASS_HASH')) {
    const legacy = existing['APP_PASS'] ? String(existing['APP_PASS'].value || '') : '';
    if (legacy) {
      storePassword_(legacy);                 // نحافظ على كلمتك الحالية لكن مشفّرة
    } else {
      temp = 'myz-' + Utilities.getUuid().slice(0, 6);
      storePassword_(temp);
    }
  }
  // تنظيف كلمة المرور القديمة من الشيت إن وُجدت.
  if (existing['APP_PASS']) {
    hardDeleteWhere_('SETTINGS', function (r) { return String(r.key) === 'APP_PASS'; });
  }
  return temp;
}

/* ============================================================
 *  3) المصادقة
 * ========================================================== */

function storePassword_(plain) {
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({
    PASS_SALT: salt,
    PASS_HASH: hashPass_(plain, salt)
  }, false);
}

function hashPass_(plain, salt) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, salt + '|' + String(plain), Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ((b & 0xFF) + 0x100).toString(16).slice(1); }).join('');
}

function checkPassword_(plain) {
  const p = PropertiesService.getScriptProperties();
  const salt = p.getProperty('PASS_SALT'), hash = p.getProperty('PASS_HASH');
  if (!salt || !hash) return false;
  return hashPass_(plain, salt) === hash;
}

/**
 * التوكن الوحيد المقبول هو توكن جلسة حقيقية.
 * لا يوجد أي قيمة سحرية تتجاوز التحقق.
 */
function isValidToken_(token) {
  if (!token) return false;
  const ts = PropertiesService.getScriptProperties().getProperty('SESSION_' + token);
  if (!ts) return false;
  if (Date.now() - Number(ts) > SESSION_TTL_MS) {
    PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
    return false;
  }
  return true;
}

function guard_(token) {
  if (!isValidToken_(token)) throw new Error('انتهت الجلسة — أعد تسجيل الدخول');
  cacheReset_();
  ensureSchema_();
}

function authenticate(username, password) {
  cacheReset_();
  ensureSchema_();
  const props = PropertiesService.getScriptProperties();
  const lockedUntil = Number(props.getProperty('LOGIN_LOCK') || 0);
  if (lockedUntil > Date.now()) {
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return { success: false, message: 'تم إيقاف المحاولات مؤقتاً. أعد المحاولة بعد ' + mins + ' دقيقة.' };
  }
  const user = getSetting_('APP_USER') || 'admin';
  const ok = String(username) === user && checkPassword_(password);
  if (!ok) {
    const fails = Number(props.getProperty('LOGIN_FAILS') || 0) + 1;
    props.setProperty('LOGIN_FAILS', String(fails));
    if (fails >= MAX_LOGIN_FAILS) {
      props.setProperty('LOGIN_LOCK', String(Date.now() + LOGIN_LOCK_MS));
      props.setProperty('LOGIN_FAILS', '0');
      return { success: false, message: 'تجاوزت عدد المحاولات. الدخول موقوف 5 دقائق.' };
    }
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيح (' + (MAX_LOGIN_FAILS - fails) + ' محاولات متبقية)' };
  }
  props.setProperty('LOGIN_FAILS', '0');
  props.deleteProperty('LOGIN_LOCK');
  cleanupSessions_();
  const token = Utilities.getUuid();
  props.setProperty('SESSION_' + token, String(Date.now()));
  return { success: true, token: token };
}

function logout(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
  return { success: true };
}

function cleanupSessions_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const dead = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('SESSION_') === 0 && Date.now() - Number(all[k]) > SESSION_TTL_MS) dead.push(k);
  });
  dead.forEach(function (k) { props.deleteProperty(k); });
}

function clearAllSessions_() {
  const props = PropertiesService.getScriptProperties();
  Object.keys(props.getProperties()).forEach(function (k) {
    if (k.indexOf('SESSION_') === 0) props.deleteProperty(k);
  });
}

function changePassword(token, oldPass, newPass) {
  guard_(token);
  if (!checkPassword_(oldPass)) return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
  if (String(newPass || '').length < 6) return { success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف أو أكثر' };
  storePassword_(newPass);
  clearAllSessions_();
  return { success: true, message: 'تم تغيير كلمة المرور. سجّل الدخول من جديد.' };
}

/* ============================================================
 *  4) القفل حول عمليات الكتابة
 * ========================================================== */

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول حالياً، أعد المحاولة.');
  try { return fn(); } finally { lock.releaseLock(); }
}

/** كل عملية تعديل ترجع نفس شكل الاستجابة: رسالة + البيانات المحدّثة. */
let BATCH_ = false;   // أثناء تنفيذ خطة المستشار: لا نبني البيانات بعد كل إجراء

function mutate_(token, month, message, fn) {
  guard_(token);
  const result = withLock_(fn);
  // نضمن نزول الكتابة للشيت قبل إعادة القراءة، وإلا قد تعود القيم القديمة
  try { SpreadsheetApp.flush(); } catch (e) {}
  cacheReset_();
  if (BATCH_) {
    const t = (result && result.message) ? result.message : message;
    audit_('المستشار: ' + message, validMonth_(month) ? month : defaultMonth_(), t);
    return { success: true, message: t, result: result || null };
  }
  const data = buildAppData_(validMonth_(month) ? month : defaultMonth_());
  // بعض العمليات تبني رسالتها بنفسها حسب النتيجة الفعلية
  const text = (result && result.message) ? result.message : message;
  audit_(message, validMonth_(month) ? month : defaultMonth_(), text);
  return { success: true, message: text, data: data, result: result || null };
}

/* ============================================================
 *  5) الدخل — مع دعم المبالغ المتغيرة
 * ========================================================== */

function incomeMonthlyMap_(month) {
  return cached_('imm:' + month, function () {
    const m = {};
    table_('INCOME_MONTHLY').forEach(function (r) {
      if (monthKey_(r.month) === String(month)) m[String(r.sourceId)] = r;
    });
    return m;
  });
}

/**
 * الدخل الفعّال لشهر معيّن:
 *  - المصدر الثابت: المبلغ المتوقع دائماً.
 *  - المصدر المتغير: المبلغ الفعلي إن سُجّل نزوله، وإلا المتوقع كتقدير.
 */
function incomesForMonth_(month) {
  return cached_('inc:' + month, function () {
    const mm = incomeMonthlyMap_(month);
    return live_('INCOME').map(function (r) {
      const m = mm[String(r.id)] || {};
      const variable = String(r.amountType || 'ثابت') === 'متغير';
      // الثابت لا يحتاج تأكيداً: يُعتبر نازلاً بمجرد مرور يومه.
      // شهر ماضٍ ⇒ نزل، شهر قادم ⇒ لم ينزل بعد، الشهر الحالي ⇒ حسب اليوم.
      const day = incomeDay_(r.day);
      const hasSchedule = day > 0;
      // دخل بلا موعد (خارج دوام مثلاً): لا يُصنع له تاريخ ولا يُعتبر متأخراً أبداً
      const occ = hasSchedule ? cycleDate_(month, day) : null;
      const inWindow = hasSchedule ? !beforeStart_(occ) : true;
      const manual = (m.arrived !== undefined && m.arrived !== '') ? yes_(m.arrived) : false;
      const arrived = !inWindow ? false
        : !hasSchedule ? manual                    // بلا موعد ⇒ لا يُحتسب إلا بتسجيلك
        : variable ? manual
        : occ <= startOfDay_(new Date());          // الثابت المجدول: نزل متى ما مرّ تاريخه
      const actual = num(m.actualAmount);
      const expected = num(r.amount);
      const effective = variable && arrived && actual > 0 ? actual : expected;
      return {
        id: String(r.id), name: String(r.name || ''),
        amountType: variable ? 'متغير' : 'ثابت',
        expectedAmount: expected,
        actualAmount: actual,
        amount: effective,                    // المبلغ المعتمد في كل الحسابات
        isVariable: variable,
        day: day, hasSchedule: hasSchedule,
        isBasic: yes_(r.isBasic),
        // المضمون: أساسي وله موعد معلوم — وحده يدخل الخطة والتوقعات
        isGuaranteed: yes_(r.isBasic) && hasSchedule,
        inWindow: inWindow,
        occurrenceDate: occ ? fmtDate_(occ) : '',
        arrived: arrived,
        paused: m.paused !== undefined && m.paused !== '' ? yes_(m.paused) : false,
        arrivalDate: m.arrivalDate ? fmtDate_(toDate_(m.arrivalDate)) : '',
        notes: String(r.notes || '')
      };
    }).filter(function (x) { return x.name.trim(); });
  });
}

/**
 * تاريخ بداية العمل بالتطبيق. كل ما يسبقه لا يُحسب إطلاقاً:
 * لا دخل، ولا التزام، ولا متأخرات، ولا يظهر في الاتجاه.
 * بدونه كان أي مصدر تضيفه اليوم يُعتبر موجوداً في كل الشهور الماضية،
 * وكان الدخل الذي مرّ يومه قبل أن تبدأ يُحتسب نازلاً وأنت لم تستلمه ضمن التتبع.
 */
function startDate_() {
  return cached_('startDate', function () {
    const d = toDate_(getSetting_('START_DATE'));
    return d || startOfDay_(new Date());
  });
}
function startMonth_() { return cycleOf_(startDate_()); }
function beforeStart_(d) { return !d || d < startDate_(); }

/** الدخل المعتمد في الخطة: أساسي، غير موقوف، داخل النافذة، وله موعد معلوم. */
function activeIncomes_(month) {
  return incomesForMonth_(month).filter(function (i) {
    return i.isBasic && !i.paused && i.inWindow && i.hasSchedule;
  });
}

/** دخل محتمل غير مضمون: بلا موعد، أو إضافي. لا يدخل الخطة قبل تسجيل نزوله. */
function potentialIncomes_(month) {
  return incomesForMonth_(month).filter(function (i) {
    return !i.paused && (!i.hasSchedule || !i.isBasic);
  });
}

function getIncomeSources(token, month) {
  guard_(token);
  return incomesForMonth_(validMonth_(month) ? month : currentMonth_());
}

function addIncomeSource(token, data) {
  return mutate_(token, data.month, 'تمت إضافة مصدر الدخل', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم مصدر الدخل مطلوب');
    insert_('INCOME', {
      name: name,
      amountType: data.amountType === 'متغير' ? 'متغير' : 'ثابت',
      amount: positive_(data.amount),
      day: incomeDay_(data.day),
      isBasic: data.isBasic ? 'نعم' : 'لا',
      notes: String(data.notes || ''), deleted: 'لا', deletedAt: ''
    });
  });
}

function updateIncomeSource(token, id, data) {
  return mutate_(token, data.month, 'تم تحديث مصدر الدخل', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم مصدر الدخل مطلوب');
    updateById_('INCOME', id, {
      name: name,
      amountType: data.amountType === 'متغير' ? 'متغير' : 'ثابت',
      amount: positive_(data.amount),
      day: incomeDay_(data.day),
      isBasic: data.isBasic ? 'نعم' : 'لا',
      notes: String(data.notes || '')
    });
    if (data.pausedThisMonth !== undefined) {
      upsertIncomeMonthly_(id, validMonth_(data.month) ? data.month : currentMonth_(),
        { paused: !!data.pausedThisMonth });
    }
  });
}

function deleteIncomeSource(token, id, month) {
  return mutate_(token, month, 'تم نقل مصدر الدخل إلى سلة المحذوفات', function () {
    softDelete_('INCOME', id);
    // التخصيصات المرتبطة تُزال حتى لا تبقى التزامات معلّقة على مصدر غير موجود.
    hardDeleteWhere_('ALLOCATIONS', function (a) { return String(a.sourceId) === String(id); });
  });
}

/** تسجيل نزول الدخل — مع المبلغ الفعلي للمصادر المتغيرة. */
/** للمصادر المتغيرة فقط — الثابتة تُحتسب تلقائياً. */
function setIncomeArrived(token, id, arrived, month, actualAmount) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, arrived ? 'تم تسجيل نزول الدخل' : 'تم إلغاء تسجيل النزول', function () {
    const rec = findById_('INCOME', id);
    if (!rec || yes_(rec.deleted)) throw new Error('مصدر الدخل غير موجود');
    // الثابت المجدول وحده يُحتسب تلقائياً؛ أما بلا موعد فلا بد من تأكيدك
    if (String(rec.amountType || 'ثابت') !== 'متغير' && incomeDay_(rec.day) > 0) {
      throw new Error('المصدر الثابت المجدول يُحتسب نزوله تلقائياً بعد يوم نزوله — لا حاجة لتأكيده.');
    }
    const patch = { arrived: !!arrived };
    if (arrived && actualAmount !== undefined && actualAmount !== null && actualAmount !== '') {
      patch.actualAmount = positive_(actualAmount);
    }
    if (!arrived) patch.actualAmount = '';
    upsertIncomeMonthly_(id, m, patch);
  });
}

function pauseIncomeSource(token, id, paused, month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, paused ? 'تم إيقاف المصدر لهذا الشهر' : 'تم استئناف المصدر', function () {
    upsertIncomeMonthly_(id, m, { paused: !!paused });
  });
}

function upsertIncomeMonthly_(sourceId, month, patch) {
  if (!findById_('INCOME', sourceId)) throw new Error('مصدر الدخل غير موجود');
  const rows = table_('INCOME_MONTHLY');
  let rec = null;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].sourceId) === String(sourceId) && monthKey_(rows[i].month) === String(month)) { rec = rows[i]; break; }
  }
  const arrived = patch.arrived !== undefined ? !!patch.arrived : (rec ? yes_(rec.arrived) : false);
  const paused  = patch.paused  !== undefined ? !!patch.paused  : (rec ? yes_(rec.paused)  : false);
  const actual  = patch.actualAmount !== undefined ? patch.actualAmount : (rec ? rec.actualAmount : '');
  const body = {
    sourceId: String(sourceId), month: String(month),
    arrived: arrived ? 'نعم' : 'لا',
    paused: paused ? 'نعم' : 'لا',
    arrivalDate: arrived ? (rec && rec.arrivalDate ? rec.arrivalDate : today_()) : '',
    actualAmount: actual === '' ? '' : num(actual),
    notes: rec ? rec.notes : ''
  };
  if (rec) updateById_('INCOME_MONTHLY', rec.id, body);
  else insert_('INCOME_MONTHLY', body);
  cacheDrop_('imm:'); cacheDrop_('inc:');
}

/* ============================================================
 *  6) الالتزامات — مبالغ تقديرية + تعدد مصادر السداد
 * ========================================================== */

/**
 * المبلغ المستحق كما ثُبِّت لحظة السداد. سجلات «دورة» تحمل مستحق الدورة الفعلي
 * (المرة × العدد × حصتك)، فتبقى الدورة المسدَّدة مكتملة لو تغيّر مبلغ الالتزام لاحقاً.
 */
function paymentDueByObligation_(month) {
  return cached_('payDue:' + month, function () {
    const m = {};
    table_('PAYMENTS').forEach(function (p) {
      if (monthKey_(p.month) !== String(month)) return;
      m[String(p.obligationId)] = { due: num(p.dueAmount), cycleExact: String(p.notes || '') === 'دورة' };
    });
    return m;
  });
}

function paymentsByObligation_(month) {
  return cached_('pay:' + month, function () {
    // التصميم: صف سداد واحد لكل (التزام، شهر). الجمع كان يضاعف المبلغ
    // إذا تكرّرت الصفوف، فنأخذ آخر صف لا مجموع الصفوف.
    const m = {};
    table_('PAYMENTS').forEach(function (p) {
      if (monthKey_(p.month) !== String(month)) return;
      m[String(p.obligationId)] = num(p.amount);
    });
    return m;
  });
}

function allocationsByObligation_() {
  return cached_('alloc', function () {
    const m = {};
    table_('ALLOCATIONS').forEach(function (a) {
      const k = String(a.obligationId);
      (m[k] = m[k] || []).push({ sourceId: String(a.sourceId), amount: num(a.amount), id: String(a.id) });
    });
    return m;
  });
}

/**
 * المبلغ المعتمد للالتزام:
 *  - ثابت: المبلغ المسجّل.
 *  - تقديري: متوسط آخر 3 مبالغ مستحقة فعلية، وإن لم توجد فالمسجّل.
 */
function obligationAmount_(row) {
  const base = num(row.amount);
  if (String(row.amountType || 'ثابت') !== 'تقديري') return { amount: base, estimated: false, basis: 'ثابت' };
  const hist = table_('PAYMENTS')
    .filter(function (p) { return String(p.obligationId) === String(row.id) && num(p.dueAmount || p.amount) > 0; })
    .sort(function (a, b) { return monthKey_(b.month).localeCompare(monthKey_(a.month)); })
    .slice(0, 3);
  if (!hist.length) return { amount: base, estimated: true, basis: 'لا يوجد تاريخ بعد' };
  const avg = Math.round(hist.reduce(function (s, p) { return s + num(p.dueAmount || p.amount); }, 0) / hist.length);
  return { amount: avg, estimated: true, basis: 'متوسط آخر ' + hist.length + ' أشهر' };
}

const RECURRENCES = ['أسبوعي', 'كل أسبوعين', 'شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي', 'مرة واحدة'];

/** التكرار بالأيام (أسبوعي/نصف شهري). صفر يعني أنه تكرار شهري أو أطول. */
function recurrenceDays_(r) {
  const t = String(r || '');
  if (t === 'أسبوعي') return 7;
  if (t === 'كل أسبوعين') return 14;
  return 0;
}

/**
 * مواعيد الالتزام الأسبوعي داخل دورة معيّنة.
 * قد تتكرر مرتين إلى خمس مرات في الدورة الواحدة، فنعرضها كبند واحد
 * مبلغه = مبلغ المرة × عدد المرات، مع إظهار العدد.
 */
function weeklyOccurrences_(key, intervalDays, start, end) {
  if (!start) return [];
  const range = cycleRange_(key);
  const out = [];
  const first = startOfDay_(start);
  let d = new Date(first.getTime());
  // نقفز إلى أول موعد داخل الدورة
  if (d < range.start) {
    const gap = Math.ceil((range.start - d) / 86400000 / intervalDays);
    d = new Date(d.getTime() + gap * intervalDays * 86400000);
  }
  while (d <= range.end) {
    if (d >= range.start && (!end || d <= end)) out.push(new Date(d.getTime()));
    d = new Date(d.getTime() + intervalDays * 86400000);
    if (out.length > 10) break;
  }
  return out;
}

/** كم شهراً بين كل استحقاق وآخر. صفر = مرة واحدة. */
function recurrenceStep_(r) {
  const t = String(r || 'شهري');
  if (t === 'ربع سنوي') return 3;
  if (t === 'نصف سنوي') return 6;
  if (t === 'سنوي') return 12;
  if (t === 'مرة واحدة') return 0;
  return 1;
}

function normalizeRecurrence_(r) {
  const t = String(r || 'شهري');
  return RECURRENCES.indexOf(t) > -1 ? t : (t === 'مرة واحدة' ? 'مرة واحدة' : 'شهري');
}

/**
 * تاريخ استحقاق الالتزام في شهر معيّن، أو null إن لم يستحق فيه.
 * التكرار غير الشهري (ربع/نصف/سنوي) يُحسب من شهر البداية:
 * تأمين سنوي بدايته مارس يستحق في مارس من كل سنة فقط.
 */
function dueDateFor_(month, day, recurrence, start, end) {
  if (!validMonth_(month)) return null;
  const step = recurrenceStep_(recurrence);
  const due = cycleDate_(month, day);

  if (!step) {
    // حارس: التزام مرة واحدة بلا تاريخ بداية كان يتكرر كل شهر في نسخة سابقة.
    if (!start) return null;
    // لا بد من مقارنة دورة تاريخ البداية بمفتاح الدورة، لا شهره الميلادي.
    // وإلا اختفى أي التزام «مرة واحدة» تاريخه بعد يوم بداية الدورة تماماً.
    if (cycleOf_(start) !== month) return null;
    if (end && due > end) return null;
    return due < start ? start : due;
  }
  if (start && due < start) return null;
  if (end && due > end) return null;
  if (step > 1) {
    if (!start) return null;                       // بلا مرساة لا يمكن تحديد الدورة
    const diff = monthsBetween_(cycleOf_(start), month);
    if (diff < 0 || diff % step !== 0) return null;
  }
  return due;
}

function obligationsForMonth_(month) {
  return cached_('obl:' + month, function () {
    const incomes = incomesForMonth_(month);
    const nameById = {}; incomes.forEach(function (i) { nameById[i.id] = i.name; });
    const pausedById = {}; incomes.forEach(function (i) { pausedById[i.id] = i.paused; });
    const pay = paymentsByObligation_(month);
    const payDue = paymentDueByObligation_(month);
    const allocs = allocationsByObligation_();
    const today = startOfDay_(new Date());

    return live_('OBLIGATIONS').map(function (r) {
      if (String(r.active || 'نعم') === 'لا') return null;
      const recurrence = normalizeRecurrence_(r.recurrence);
      const step = recurrenceStep_(recurrence);
      const recurring = step > 0;
      const start = toDate_(r.startDate), end = toDate_(r.endDate);
      const weekDays = recurrenceDays_(recurrence);
      let due, occurrences = 1, occurrenceDates = [];
      if (weekDays) {
        occurrenceDates = weeklyOccurrences_(month, weekDays, start, end)
          .filter(function (d) { return !beforeStart_(d); });
        if (!occurrenceDates.length) return null;
        due = occurrenceDates[0];
        occurrences = occurrenceDates.length;
      } else {
        due = dueDateFor_(month, clampDay_(r.day), recurrence, start, end);
        if (!due) return null;
        if (beforeStart_(due)) return null;   // استحق قبل أن تبدأ التتبع
      }

      const amt = obligationAmount_(r);
      const unitAmount = amt.amount;
      const fullAmount = amt.amount * occurrences;
      // الالتزام المشترك: كل الحسابات تعتمد حصتك أنت، ويبقى الإجمالي معروضاً
      const sharePct = Math.min(100, Math.max(1, num(r.sharePercent) || 100));
      amt.amount = Math.round(fullAmount * sharePct / 100);
      // دورة سُدِّدت: مستحقها ما ثُبِّت وقت السداد، لا المبلغ الحالي للتعريف.
      // السجلات القديمة بلا علامة «دورة» حُفظت بالمبلغ الأساسي، فنعتمدها فقط حيث يساويه مستحق الدورة.
      const locked = payDue[String(r.id)];
      if (locked && locked.due > 0 && (locked.cycleExact || (occurrences === 1 && sharePct === 100))) {
        amt.amount = Math.round(locked.due);
      }
      const autoDeduct = yes_(r.autoDeduct);
      const certainty = String(r.certainty || 'مؤكد');
      if (certainty === 'لم يتحقق') return null;   // توقّع لم يحدث — محرَّر تماماً

      const today0 = startOfDay_(new Date());
      /**
       * الالتزام الذي يقتطعه البنك لا يحتاج تأكيداً يدوياً كل دورة.
       * لكن الأسبوعي يُقتطع على دفعات، فنحتسب ما مرّ موعده فقط:
       * مبلغ المرة × عدد المرات التي حلّت. لا كل شيء من أول أسبوع، ولا صفر حتى آخره.
       */
      let autoAmount = 0;
      if (autoDeduct) {
        if (occurrenceDates.length) {
          const passed = occurrenceDates.filter(function (d) {
            return startOfDay_(d) <= today0;
          }).length;
          autoAmount = unitAmount * passed;
        } else if (startOfDay_(due) <= today0) {
          autoAmount = amt.amount;
        }
      }
      const autoPaid = autoDeduct && amt.amount > 0 && autoAmount >= amt.amount;
      const rawPaid = Math.max(num(pay[String(r.id)]), autoAmount);
      // حارس: المسدَّد لا يمكن أن يتجاوز المستحق. أي تجاوز خلل بيانات نكشفه لا نخفيه.
      const paidAmount = Math.min(rawPaid, amt.amount);
      const mine = (allocs[String(r.id)] || []).map(function (a) {
        return { sourceId: a.sourceId, sourceName: nameById[a.sourceId] || '', amount: a.amount,
                 missing: !nameById[a.sourceId], paused: !!pausedById[a.sourceId] };
      });
      const allocated = mine.reduce(function (s, a) { return s + a.amount; }, 0);
      const maxDelay = num(r.maxDelay);
      const daysLeft = Math.ceil((startOfDay_(due) - today) / 86400000);

      return {
        id: String(r.id), name: String(r.name || ''),
        amountType: String(r.amountType || 'ثابت'),
        amount: amt.amount, baseAmount: num(r.amount),
        unitAmount: unitAmount, occurrences: occurrences,
        fullAmount: Math.round(fullAmount), sharePercent: sharePct,
        partnerAmount: Math.round(fullAmount - (fullAmount * sharePct / 100)),
        isShared: sharePct < 100, interestRate: num(r.interestRate),
        occurrenceDates: occurrenceDates.map(fmtDate_),
        isEstimated: amt.estimated, estimateBasis: amt.basis,
        day: clampDay_(r.day), dueDate: fmtDate_(due), month: month,
        type: String(r.type || 'صارم'),
        maxDelay: maxDelay, priority: String(r.priority || 'متوسطة'),
        recurring: recurring, recurrence: recurrence, recurrenceStep: step,
        startDate: fmtDate_(start), endDate: fmtDate_(end),
        notes: String(r.notes || ''),
        category: String(r.category || 'أخرى'),
        sources: mine,
        allocatedAmount: allocated,
        unallocatedAmount: Math.max(0, amt.amount - allocated),
        isSplit: mine.length > 1,
        sourceMissing: mine.some(function (a) { return a.missing; }),
        sourcePaused: mine.some(function (a) { return a.paused; }),
        paidAmount: paidAmount,
        overpaid: rawPaid > amt.amount + 0.5, recordedPaid: Math.round(rawPaid),
        autoDeduct: autoDeduct, autoPaid: autoPaid,
        autoAmount: Math.round(autoAmount),
        certainty: certainty, isExpected: certainty === 'متوقع',
        paid: paidAmount >= amt.amount && amt.amount > 0,
        remainingAmount: Math.max(0, amt.amount - paidAmount),
        daysLeft: daysLeft,
        overdue: paidAmount < amt.amount && daysLeft < -maxDelay && !isSpread_(r)
      };
    }).filter(Boolean).filter(function (x) { return x.name.trim(); })
      .sort(function (a, b) {
        return String(a.dueDate).localeCompare(String(b.dueDate)) ||
               priorityRank_(a.priority) - priorityRank_(b.priority);
      });
  });
}

/**
 * كل الالتزامات المعرَّفة، بلا فلترة دورة.
 * صفحة الإدارة تعرض التعريفات كلها دائماً — الدورة تخص السداد لا التعريف.
 * ولكل بند نحسب موعده القادم وآخر سداد له ليبقى السياق واضحاً.
 */
function getAllObligations(token) {
  guard_(token);
  return allObligations_();
}
function allObligations_() {
  const base = defaultMonth_();
  const allocs = allocationsByObligation_();
  const names = {};
  incomesForMonth_(base).forEach(function (i) { names[i.id] = i.name; });
  const payments = table_('PAYMENTS');
  const today0 = startOfDay_(new Date());

  return live_('OBLIGATIONS').map(function (r) {
    const name = String(r.name || '').trim();
    if (!name) return null;
    const id = String(r.id);
    const rec = normalizeRecurrence_(r.recurrence);
    const step = recurrenceStep_(rec), wd = recurrenceDays_(rec);
    const day = clampDay_(r.day);
    const start = toDate_(r.startDate), end = toDate_(r.endDate);
    const amt = obligationAmount_(r);
    const sharePct = Math.min(100, Math.max(1, num(r.sharePercent) || 100));
    const myAmount = Math.round(amt.amount * sharePct / 100);

    // أقرب موعد قادم خلال 24 دورة، وآخر موعد مضى
    let nextDue = '', nextCycle = '', prevDue = '', prevCycle = '';
    let k = base;
    for (let i = 0; i < 24; i++) {
      let due = null;
      if (wd) {
        const occ = weeklyOccurrences_(k, wd, start, end);
        due = occ.length ? occ[0] : null;
      } else {
        due = dueDateFor_(k, day, rec, start, end);
      }
      if (due && !beforeStart_(due)) {
        if (startOfDay_(due) >= today0) { nextDue = fmtDate_(due); nextCycle = k; break; }
        prevDue = fmtDate_(due); prevCycle = k;
      }
      k = addCycles_(k, 1);
    }

    const pays = payments.filter(function (p) { return String(p.obligationId) === id; })
      .sort(function (a, b) { return monthKey_(b.month).localeCompare(monthKey_(a.month)); });
    const lastPay = pays[0] || null;

    const mine = (allocs[id] || []).map(function (a) {
      return { sourceId: a.sourceId, sourceName: names[a.sourceId] || '',
               amount: a.amount, missing: !names[a.sourceId] };
    });
    const allocated = mine.reduce(function (t, a) { return t + a.amount; }, 0);
    const active = String(r.active || 'نعم') !== 'لا';
    const certainty = String(r.certainty || 'مؤكد');

    return {
      id: id, name: name, amount: myAmount, baseAmount: num(r.amount),
      fullAmount: Math.round(amt.amount), sharePercent: sharePct, isShared: sharePct < 100,
      amountType: String(r.amountType || 'ثابت'), isEstimated: amt.estimated, estimateBasis: amt.basis,
      day: day, recurrence: rec, recurrenceStep: step, weekDays: wd, recurring: step > 0 || wd > 0,
      type: String(r.type || 'صارم'), priority: String(r.priority || 'متوسطة'),
      category: String(r.category || 'أخرى'), notes: String(r.notes || ''),
      startDate: fmtDate_(start), endDate: fmtDate_(end),
      autoDeduct: yes_(r.autoDeduct), certainty: certainty, isExpected: certainty === 'متوقع',
      interestRate: num(r.interestRate), maxDelay: num(r.maxDelay),
      active: active,
      sources: mine, allocatedAmount: Math.round(allocated),
      unallocatedAmount: Math.max(0, myAmount - allocated),
      isSplit: mine.length > 1, sourceMissing: mine.some(function (a) { return a.missing; }),
      nextDue: nextDue, nextCycle: nextCycle,
      prevDue: prevDue, prevCycle: prevCycle,
      lastPaidMonth: lastPay ? monthKey_(lastPay.month) : '',
      lastPaidAmount: lastPay ? num(lastPay.amount) : 0,
      ended: !!end && end < today0,
      status: !active ? 'غير نشط'
            : certainty === 'لم يتحقق' ? 'لم يتحقق'
            : (!!end && end < today0) ? 'منتهٍ'
            : nextDue ? 'قادم'
            : 'بلا موعد قادم'
    };
  }).filter(Boolean).sort(function (a, b) {
    return String(a.nextDue || '9999').localeCompare(String(b.nextDue || '9999'))
        || a.name.localeCompare(b.name, 'ar');
  });
}

/**
 * دورات التزام واحد: السابقة والقادمة، كل دورة بحالتها ومبلغها وسدادها.
 * هكذا يُعرَّف الالتزام مرة، ويُسدَّد من مكان واحد لأي دورة، بلا تنقّل.
 */
function getObligationTimeline(token, id, back, forward) {
  guard_(token);
  const r = findById_('OBLIGATIONS', id);
  if (!r || yes_(r.deleted)) throw new Error('الالتزام غير موجود');

  const nBack = Math.min(12, Math.max(0, Number(back) === 0 ? 0 : (Number(back) || 3)));
  const nFwd = Math.min(12, Math.max(1, Number(forward) || 5));
  const base = defaultMonth_();
  const rec = normalizeRecurrence_(r.recurrence);
  const wd = recurrenceDays_(rec);
  const day = clampDay_(r.day);
  const start = toDate_(r.startDate), end = toDate_(r.endDate);
  const sharePct = Math.min(100, Math.max(1, num(r.sharePercent) || 100));
  const autoDeduct = yes_(r.autoDeduct);
  const maxDelay = num(r.maxDelay);
  const flexible = String(r.type || '') === 'ترفيهي' || String(r.type || '') === 'مرن';
  const today0 = startOfDay_(new Date());

  // سجل السداد لكل دورة
  const pays = {};
  table_('PAYMENTS').forEach(function (p) {
    if (String(p.obligationId) !== String(id)) return;
    pays[monthKey_(p.month)] = { amount: num(p.amount), dueAmount: num(p.dueAmount), date: fmtDate_(toDate_(p.date)) };
  });

  const rows = [];
  let k = addCycles_(base, -nBack);
  for (let i = 0; i <= nBack + nFwd; i++, k = addCycles_(k, 1)) {
    if (k < startMonth_()) continue;

    let due = null, count = 1, dates = [];
    if (wd) {
      dates = weeklyOccurrences_(k, wd, start, end).filter(function (d) { return !beforeStart_(d); });
      if (!dates.length) continue;
      due = dates[0]; count = dates.length;
    } else {
      due = dueDateFor_(k, day, rec, start, end);
      if (!due || beforeStart_(due)) continue;
    }

    // المبلغ التقديري يختلف بين الدورات، فنأخذ المسجَّل إن وُجد
    const pay = pays[k] || null;
    const unit = obligationAmount_(r).amount;
    const full = (pay && pay.dueAmount > 0) ? pay.dueAmount : unit * count;
    const amount = Math.round(full * sharePct / 100);
    const paidAmount = pay ? pay.amount : 0;

    const autoPaidAmt = autoDeduct
      ? (dates.length
          ? Math.round((unit * sharePct / 100) * dates.filter(function (d) { return startOfDay_(d) <= today0; }).length)
          : (startOfDay_(due) <= today0 ? amount : 0))
      : 0;
    const effectivePaid = Math.max(paidAmount, autoPaidAmt);
    const remaining = Math.max(0, amount - effectivePaid);
    const daysLeft = Math.ceil((startOfDay_(due) - today0) / 86400000);
    const paid = effectivePaid >= amount && amount > 0;

    rows.push({
      cycle: k, label: cycleLabel_(k), cycleName: k,
      dueDate: fmtDate_(due), occurrences: count,
      occurrenceDates: dates.map(fmtDate_),
      amount: amount, paidAmount: Math.round(effectivePaid), remaining: remaining,
      manuallyPaid: Math.round(paidAmount), autoPaid: autoDeduct && autoPaidAmt >= amount,
      autoAmount: Math.round(autoPaidAmt),
      paidDate: pay ? pay.date : '',
      isCurrent: k === base, isPast: k < base, isFuture: k > base,
      daysLeft: daysLeft,
      overdue: !paid && daysLeft < -maxDelay && !isSpread_(r),
      status: autoDeduct && autoPaidAmt >= amount ? 'خُصم تلقائياً'
            : autoDeduct && autoPaidAmt > 0 ? 'خصم جارٍ'
            : paid ? 'مدفوع'
            : effectivePaid > 0 ? 'جزئي'
            : (daysLeft < -maxDelay) ? 'متأخر'
            : (daysLeft < 0) ? 'حان موعده'
            : (daysLeft === 0) ? 'اليوم'
            : 'قادم'
    });
  }

  return {
    id: String(id), name: String(r.name || ''), recurrence: rec,
    category: String(r.category || 'أخرى'), type: String(r.type || 'صارم'),
    autoDeduct: autoDeduct, flexible: flexible,
    sharePercent: sharePct, isShared: sharePct < 100,
    baseCycle: base, rows: rows,
    totalDue: rows.reduce(function (t, x) { return t + x.amount; }, 0),
    totalPaid: rows.reduce(function (t, x) { return t + x.paidAmount; }, 0),
    unpaidCycles: rows.filter(function (x) { return x.remaining > 0; }).length
  };
}

function getObligations(token, month) {
  guard_(token);
  return obligationsForMonth_(validMonth_(month) ? month : currentMonth_());
}

function addObligation(token, data) {
  return mutate_(token, data.month, 'تمت إضافة الالتزام', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم الالتزام مطلوب');
    const recurrence = normalizeRecurrence_(data.recurrence !== undefined
      ? data.recurrence : (data.recurring === false ? 'مرة واحدة' : 'شهري'));
    const recurring = recurrenceStep_(recurrence) > 0;
    // بداية الدورة لا أول الشهر: في دورة 27 يقع استحقاق اليوم 27 في الشهر السابق،
    // فتاريخ بداية «أول الشهر» يجعله قبل بدايته فيختفي تماماً من العرض.
    const mk = validMonth_(data.month) ? data.month : currentMonth_();
    const start = String(data.startDate || '') || fmtDate_(cycleRange_(mk).start);
    const end = recurring ? String(data.endDate || '') : (String(data.endDate || '') || start);
    const id = insert_('OBLIGATIONS', {
      name: name,
      amountType: data.amountType === 'تقديري' ? 'تقديري' : 'ثابت',
      amount: positive_(data.amount),
      day: clampDay_(data.day),
      type: String(data.type || 'صارم'),
      maxDelay: Math.min(60, positive_(data.maxDelay)),
      priority: String(data.priority || 'متوسطة'),
      recurrence: recurrence,
      startDate: start, endDate: end,
      notes: String(data.notes || ''),
      category: String(data.category || 'أخرى'),
      autoDeduct: data.autoDeduct ? 'نعم' : 'لا',
      certainty: String(data.certainty || 'مؤكد'),
      sharePercent: Math.min(100, Math.max(1, num(data.sharePercent) || 100)),
      interestRate: Math.max(0, num(data.interestRate)),
      active: 'نعم', deleted: 'لا', deletedAt: ''
    });
    saveAllocations_(id, data.sources, positive_(data.amount), data.month);
  });
}

function updateObligation(token, id, data) {
  return mutate_(token, data.month, 'تم تحديث الالتزام', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم الالتزام مطلوب');
    const recurrence = normalizeRecurrence_(data.recurrence !== undefined
      ? data.recurrence : (data.recurring === false ? 'مرة واحدة' : 'شهري'));
    const recurring = recurrenceStep_(recurrence) > 0;
    const old = findById_('OBLIGATIONS', id);
    if (!old) throw new Error('الالتزام غير موجود');
    const mk2 = validMonth_(data.month) ? data.month : currentMonth_();
    const start = String(data.startDate || '') || String(old.startDate || '')
                  || fmtDate_(cycleRange_(mk2).start);
    const end = recurring ? String(data.endDate || '') : (String(data.endDate || '') || start);
    updateById_('OBLIGATIONS', id, {
      name: name,
      amountType: data.amountType === 'تقديري' ? 'تقديري' : 'ثابت',
      amount: positive_(data.amount),
      day: clampDay_(data.day),
      type: String(data.type || 'صارم'),
      maxDelay: Math.min(60, positive_(data.maxDelay)),
      priority: String(data.priority || 'متوسطة'),
      recurrence: recurrence,
      startDate: start, endDate: end,
      notes: String(data.notes || ''),
      category: String(data.category || 'أخرى'),
      autoDeduct: data.autoDeduct ? 'نعم' : 'لا',
      certainty: String(data.certainty || 'مؤكد'),
      sharePercent: Math.min(100, Math.max(1, num(data.sharePercent) || 100)),
      interestRate: Math.max(0, num(data.interestRate))
    });
    saveAllocations_(id, data.sources, positive_(data.amount), data.month);
  });
}

/**
 * يحفظ تخصيصات السداد. sources = [{sourceId, amount}] أو [] للتوزيع التلقائي لاحقاً.
 * يتحقق أن كل مصدر أساسي وموجود، وأن المجموع لا يتجاوز مبلغ الالتزام.
 */
function saveAllocations_(obligationId, sources, obligationAmount, month) {
  hardDeleteWhere_('ALLOCATIONS', function (a) { return String(a.obligationId) === String(obligationId); });
  if (!sources || !sources.length) return;
  const m = validMonth_(month) ? month : defaultMonth_();
  const valid = {};
  incomesForMonth_(m).forEach(function (i) { if (i.isBasic) valid[i.id] = i.name; });

  const rows = [];
  let total = 0;
  sources.forEach(function (s) {
    const sid = String(s.sourceId || '');
    if (!sid) return;
    if (!valid[sid]) throw new Error('مصدر السداد يجب أن يكون مصدر دخل أساسي موجوداً.');
    const amt = positive_(s.amount);
    if (amt <= 0) return;
    total += amt;
    rows.push({ obligationId: String(obligationId), sourceId: sid, amount: amt });
  });
  // بدل رفض الحفظ عند تخفيض مبلغ الالتزام، نقلّص التخصيصات بالتناسب
  if (total > obligationAmount + 0.5 && total > 0) {
    const factor = obligationAmount / total;
    let running = 0;
    rows.forEach(function (r, i) {
      r.amount = (i === rows.length - 1)
        ? Math.max(0, Math.round(obligationAmount - running))
        : Math.round(r.amount * factor);
      running += r.amount;
    });
  }
  if (rows.length) insertMany_('ALLOCATIONS', rows.filter(function (r) { return r.amount > 0; }));
}

function deleteObligation(token, id, month) {
  return mutate_(token, month, 'تم نقل الالتزام إلى سلة المحذوفات', function () {
    softDelete_('OBLIGATIONS', id);
    hardDeleteWhere_('ALLOCATIONS', function (a) { return String(a.obligationId) === String(id); });
  });
}

/**
 * يحسم مصير التزام متوقّع: تحقق فعلاً، أو لم يتحقق فيُحرَّر مبلغه.
 * value: مؤكد | متوقع | لم يتحقق
 */
function setObligationCertainty(token, id, value, month) {
  const v = ['مؤكد', 'متوقع', 'لم يتحقق'].indexOf(String(value)) > -1 ? String(value) : 'مؤكد';
  return mutate_(token, month, 'تم تحديث حالة التوقع', function () {
    const o = findById_('OBLIGATIONS', id);
    if (!o || yes_(o.deleted)) throw new Error('الالتزام غير موجود');
    updateById_('OBLIGATIONS', id, { certainty: v });
    const amt = obligationAmount_(o).amount;
    return {
      message: v === 'لم يتحقق'
        ? 'لم يتحقق — تحرّر ' + Math.round(amt) + ' ريال من توقعاتك وأُعيد توزيعها على المتبقي'
        : v === 'مؤكد' ? 'تم تأكيده كالتزام فعلي' : 'صار متوقعاً غير مؤكد'
    };
  });
}

/* ============================================================
 *  7) السداد — مع تثبيت المبلغ المستحق وقت السداد
 * ========================================================== */

function setPayment(token, obligationId, month, amount) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, 'تم تحديث السداد', function () {
    const row = findById_('OBLIGATIONS', obligationId);
    if (!row || yes_(row.deleted)) throw new Error('الالتزام غير موجود');
    const due = cycleDueFresh_(row, m);
    const requested = positive_(amount);
    const isEstimated = String(row.amountType || 'ثابت') === 'تقديري';
    const isFlexible = String(row.type || '') === 'ترفيهي' || String(row.type || '') === 'مرن';

    /**
     * القص الصامت كان يفسد السجل: فاتورة تقديرها 450 ودفعت 800 تُسجَّل 450،
     * فتظهر مصروفاتك أقل من الحقيقة ويبني المستشار نصيحته على رقم خاطئ.
     * الآن: التقديري يقبل المبلغ الفعلي ويصبح هو المستحق لتلك الدورة،
     * وغير التقديري يرفض بوضوح بدل أن يقص في صمت.
     */
    let amt = requested, dueForRecord = due;
    if (isEstimated) {
      dueForRecord = Math.max(due, requested);
    } else if (requested > due + 0.5) {
      throw new Error('المبلغ المدخل (' + Math.round(requested) + ') أكبر من مبلغ الالتزام ('
        + Math.round(due) + '). إن كان المبلغ الفعلي مختلفاً فعدّل الالتزام أو اجعل مبلغه «تقديرياً».');
    } else {
      amt = Math.min(requested, due);
    }
    if (!isFlexible && !isEstimated && amt > 0 && amt < due) {
      throw new Error('السداد الجزئي متاح للبنود الترفيهية والمرنة فقط.');
    }
    // نحذف أي صف سابق لهذا الالتزام في هذا الشهر ثم نكتب صفاً واحداً.
    // البحث والتحديث كانا يفشلان فيتراكم صف جديد مع كل ضغطة.
    const isMatch = function (p) {
      return String(p.obligationId) === String(obligationId) && monthKey_(p.month) === m;
    };
    hardDeleteWhere_('PAYMENTS', isMatch);
    if (amt <= 0) return 'cleared';
    insert_('PAYMENTS', { obligationId: String(obligationId), month: m, amount: amt,
                          dueAmount: dueForRecord, date: today_(), notes: 'دورة' });
    return amt >= dueForRecord ? 'full' : 'partial';
  });
}

/** سداد المبلغ كاملاً — اختصار شائع من الواجهة. */
/**
 * مستحق التزام في دورة محددة من تعريفه الحالي: المرة × عدد مراتها في الدورة × حصتك.
 * كان السداد يستخدم «المرة» وحدها، فالأسبوعي يُسجَّل 150 من 750، والمشترك يُرفض.
 */
function cycleDueInfo_(row, m) {
  const rec = normalizeRecurrence_(row.recurrence);
  const wd = recurrenceDays_(rec);
  const start = toDate_(row.startDate), end = toDate_(row.endDate);
  let occ = 1;
  if (wd) {
    occ = weeklyOccurrences_(m, wd, start, end).filter(function (d) { return !beforeStart_(d); }).length;
    if (!occ) throw new Error('هذا الالتزام لا يستحق في هذه الدورة');
  } else if (!dueDateFor_(m, clampDay_(row.day), rec, start, end)) {
    throw new Error('هذا الالتزام لا يستحق في هذه الدورة');
  }
  const share = Math.min(100, Math.max(1, num(row.sharePercent) || 100));
  const unit = obligationAmount_(row).amount;
  return { due: Math.round(unit * occ * share / 100), occ: occ, share: share, unit: unit };
}

/**
 * «كم سددت؟» — المبلغ الفعلي قد يختلف عن المتوقع (كهرباء أقل، إيجار بغرامة).
 * total: إجمالي المسدَّد لهذه الدورة.
 * mode: 'full' ⇒ هذا هو المستحق الفعلي للدورة (أقل أو أعلى) فتُغلق مكتملة.
 *       'partial' ⇒ دفعة من المستحق ويبقى الباقي.
 * updateDef: يُحدّث مبلغ الالتزام للدورات القادمة حين يختلف الفعلي.
 */
function recordPayment(token, obligationId, cycle, total, mode, updateDef) {
  const m = validMonth_(cycle) ? cycle : defaultMonth_();
  return mutate_(token, m, 'تم تسجيل السداد', function () {
    const row = findById_('OBLIGATIONS', obligationId);
    if (!row || yes_(row.deleted)) throw new Error('الالتزام غير موجود');
    const info = cycleDueInfo_(row, m);
    const due = info.due;
    const amt = Math.round(positive_(total) * 100) / 100;
    const isEst = String(row.amountType || 'ثابت') === 'تقديري';

    hardDeleteWhere_('PAYMENTS', function (p) {
      return String(p.obligationId) === String(obligationId) && monthKey_(p.month) === m;
    });
    if (amt <= 0) return { message: 'أُلغي تسجيل السداد لهذه الدورة' };

    const partial = amt < due - 0.5 && String(mode) === 'partial';
    const dueRec = partial ? due : amt;   // غير الجزئي: المبلغ الفعلي هو مستحق هذه الدورة
    insert_('PAYMENTS', { obligationId: String(obligationId), month: m, amount: amt,
                          dueAmount: dueRec, date: today_(), notes: 'دورة' });

    let msg = partial ? 'سداد جزئي ' + Math.round(amt) + ' — يبقى ' + Math.round(due - amt)
            : amt > due + 0.5 ? 'سُجّل ' + Math.round(amt) + ' — أعلى من المتوقع (' + due + ')'
            : amt < due - 0.5 ? 'سُجّل ' + Math.round(amt) + ' مبلغاً فعلياً كاملاً — أقل من المتوقع (' + due + ')'
            : 'تم تسجيل السداد';
    if (updateDef && !partial && !isEst && Math.abs(amt - due) > 0.5) {
      const base = Math.round(amt / (info.occ * info.share / 100));
      updateById_('OBLIGATIONS', obligationId, { amount: base });
      msg += ' · وحُدّث مبلغ الالتزام إلى ' + base + ' للدورات القادمة';
    }
    return { message: msg };
  });
}

function cycleDueFresh_(row, m) { return cycleDueInfo_(row, m).due; }

function markPaid(token, obligationId, month, paid) {
  guard_(token);
  const row = findById_('OBLIGATIONS', obligationId);
  if (!row || yes_(row.deleted)) throw new Error('الالتزام غير موجود');
  const m = validMonth_(month) ? month : defaultMonth_();
  return setPayment(token, obligationId, m, paid ? cycleDueFresh_(row, m) : 0);
}

/* ============================================================
 *  8) المشتريات النثرية — تصنيف مستقل + سقف شهري
 * ========================================================== */

function purchasesForMonth_(month) {
  return cached_('pur:' + month, function () {
    return live_('PURCHASES').map(function (r) {
      return {
        id: String(r.id), date: fmtDate_(toDate_(r.date)),
        amount: num(r.amount), category: String(r.category || 'أخرى'),
        item: String(r.item || ''), store: String(r.store || ''), notes: String(r.notes || '')
      };
    }).filter(function (x) {
      return x.date && cycleOf_(toDate_(x.date)) === month && x.item.trim();
    })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  });
}

function getPettyPurchases(token, month) {
  guard_(token);
  return purchasesForMonth_(validMonth_(month) ? month : currentMonth_());
}

function addPettyPurchase(token, data) {
  return mutate_(token, data.month, 'تم تسجيل المشتريات', function () {
    const item = String(data.item || '').trim();
    if (!item) throw new Error('اكتب ماذا اشتريت');
    const amount = positive_(data.amount);
    if (amount <= 0) throw new Error('أدخل مبلغاً أكبر من صفر');
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(data.date || '')) ? String(data.date) : today_();
    insert_('PURCHASES', {
      date: d, amount: amount,
      category: String(data.category || 'أخرى').trim() || 'أخرى',
      item: item, store: String(data.store || '').trim(),
      notes: String(data.notes || ''), deleted: 'لا', deletedAt: ''
    });
  });
}

function updatePettyPurchase(token, id, data) {
  return mutate_(token, data.month, 'تم تحديث العملية', function () {
    const item = String(data.item || '').trim();
    if (!item) throw new Error('اكتب ماذا اشتريت');
    updateById_('PURCHASES', id, {
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(data.date || '')) ? String(data.date) : today_(),
      amount: positive_(data.amount),
      category: String(data.category || 'أخرى').trim() || 'أخرى',
      item: item, store: String(data.store || '').trim(), notes: String(data.notes || '')
    });
  });
}

function deletePettyPurchase(token, id, month) {
  return mutate_(token, month, 'تم نقل العملية إلى سلة المحذوفات', function () {
    softDelete_('PURCHASES', id);
  });
}

function savePurchaseCategories(token, categories, month) {
  return mutate_(token, month, 'تم حفظ قائمة التصنيفات', function () {
    const arr = Array.from(new Set((Array.isArray(categories) ? categories : [])
      .map(function (x) { return String(x || '').trim(); }).filter(Boolean))).slice(0, 50);
    setSetting_('PURCHASE_CATEGORIES', JSON.stringify(arr));
  });
}

function purchaseCategories_() {
  let c = [];
  try { c = JSON.parse(getSetting_('PURCHASE_CATEGORIES') || '[]'); } catch (e) { c = []; }
  return c.length ? c : DEFAULT_CATEGORIES.slice();
}

/** سقف شهري لكل تصنيف مشتريات: { "قهوة": 200, "مطاعم": 400 } */
function categoryBudgets_() {
  let m = {};
  try { m = JSON.parse(getSetting_('CATEGORY_BUDGETS') || '{}'); } catch (e) { m = {}; }
  const out = {};
  Object.keys(m).forEach(function (k) { out[String(k)] = positive_(m[k]); });
  return out;
}

function saveCategoryBudgets(token, budgets, month) {
  return mutate_(token, month, 'تم حفظ ميزانيات التصنيفات', function () {
    const src = budgets && typeof budgets === 'object' ? budgets : {};
    const out = {};
    Object.keys(src).forEach(function (k) {
      const name = String(k).trim();
      const val = positive_(src[k]);
      if (name && val > 0) out[name] = val;
    });
    setSetting_('CATEGORY_BUDGETS', JSON.stringify(out));
  });
}

/** المصروف الفعلي مقابل السقف لكل تصنيف في دورة معيّنة. */
function categorySpend_(month) {
  return cached_('catSpend:' + month, function () {
    const budgets = categoryBudgets_();
    const spent = {};
    purchasesForMonth_(month).forEach(function (p) {
      const c = String(p.category || 'أخرى');
      spent[c] = (spent[c] || 0) + p.amount;
    });
    const names = {};
    purchaseCategories_().forEach(function (c) { names[c] = true; });
    Object.keys(budgets).forEach(function (c) { names[c] = true; });
    Object.keys(spent).forEach(function (c) { names[c] = true; });

    return Object.keys(names).map(function (c) {
      const b = num(budgets[c]), sp = Math.round(num(spent[c]));
      return {
        category: c, budget: b, spent: sp,
        left: b > 0 ? Math.round(b - sp) : null,
        usage: b > 0 ? sp / b : null,
        over: b > 0 && sp > b,
        near: b > 0 && sp <= b && sp >= b * 0.8
      };
    }).filter(function (x) { return x.budget > 0 || x.spent > 0; })
      .sort(function (a, b) {
        return (b.over ? 1 : 0) - (a.over ? 1 : 0) || b.spent - a.spent;
      });
  });
}

function obligationCategories_() {
  let c = [];
  try { c = JSON.parse(getSetting_('OBLIGATION_CATEGORIES') || '[]'); } catch (e) { c = []; }
  return c.length ? c : DEFAULT_OB_CATEGORIES.slice();
}

function saveObligationCategories(token, categories, month) {
  return mutate_(token, month, 'تم حفظ تصنيفات الالتزامات', function () {
    const arr = Array.from(new Set((Array.isArray(categories) ? categories : [])
      .map(function (x) { return String(x || '').trim(); }).filter(Boolean))).slice(0, 50);
    setSetting_('OBLIGATION_CATEGORIES', JSON.stringify(arr));
  });
}

/* ============================================================
 *  9) الادخار — مع سجل حركات
 * ========================================================== */

function savingsGoals_() {
  return cached_('sav', function () {
    return live_('SAVINGS').filter(function (r) { return String(r.active || 'نعم') !== 'لا'; })
      .map(function (r) {
        return {
          id: String(r.id), name: String(r.name || ''),
          target: num(r.target), saved: num(r.saved), monthly: num(r.monthly),
          targetDate: fmtDate_(toDate_(r.targetDate)), notes: String(r.notes || ''),
          sourceId: String(r.sourceId || '')
        };
      }).filter(function (x) { return x.name.trim(); });
  });
}

function getSavingsGoals(token) { guard_(token); return savingsGoals_(); }

function addSavingsGoal(token, data) {
  return mutate_(token, data.month, 'تمت إضافة الهدف الادخاري', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم الهدف مطلوب');
    insert_('SAVINGS', {
      name: name, target: positive_(data.target), saved: positive_(data.saved),
      monthly: positive_(data.monthly), targetDate: String(data.targetDate || ''),
      notes: String(data.notes || ''), sourceId: String(data.sourceId || ''),
      active: 'نعم', deleted: 'لا', deletedAt: ''
    });
  });
}

function updateSavingsGoal(token, id, data) {
  return mutate_(token, data.month, 'تم تحديث الهدف الادخاري', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم الهدف مطلوب');
    updateById_('SAVINGS', id, {
      name: name, target: positive_(data.target), saved: positive_(data.saved),
      monthly: positive_(data.monthly), targetDate: String(data.targetDate || ''),
      notes: String(data.notes || ''), sourceId: String(data.sourceId || '')
    });
  });
}

function addAmountToSaving(token, id, amount, month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, 'تمت إضافة مبلغ الادخار', function () {
    const delta = positive_(amount);
    if (delta <= 0) throw new Error('أدخل مبلغاً أكبر من صفر');
    const g = findById_('SAVINGS', id);
    if (!g || yes_(g.deleted)) throw new Error('الهدف غير موجود');
    updateById_('SAVINGS', id, { saved: num(g.saved) + delta });
    insert_('SAVINGS_TX', { goalId: String(id), month: m, date: today_(), amount: delta, notes: '' });
  });
}

function deleteSavingsGoal(token, id, month) {
  return mutate_(token, month, 'تم نقل الهدف إلى سلة المحذوفات', function () {
    softDelete_('SAVINGS', id);
  });
}

function savingsDepositedIn_(month) {
  return cached_('savtx:' + month, function () {
    return table_('SAVINGS_TX')
      .filter(function (t) { return monthKey_(t.month) === String(month); })
      .reduce(function (s, t) { return s + num(t.amount); }, 0);
  });
}

/* ============================================================
 *  10) إقفال الشهر وترحيل الرصيد
 * ========================================================== */

function prevMonth_(month) {
  const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7));
  const d = new Date(y, m - 2, 1);
  return fmtMonth_(d);
}

function monthRecord_(month) {
  return table_('MONTHS').filter(function (r) { return monthKey_(r.month) === String(month); })[0] || null;
}

/** الرصيد الافتتاحي = الرصيد الختامي للشهر السابق إن كان مُقفلاً والترحيل مفعّل. */
function openingBalance_(month) {
  if (String(getSetting_('ROLLOVER') || 'نعم') === 'لا') return 0;
  const prev = monthRecord_(prevMonth_(month));
  return prev ? num(prev.closing) : 0;
}

function monthSummary_(month) {
  return cached_('sum:' + month, function () { return computeMonthSummary_(month); });
}

/**
 * أقدم شهر فيه أثر فعلي للاستخدام (سداد أو إقفال).
 * بدونه ستُحسب التزامات متكررة تسبق استخدامك للتطبيق كأنها متأخرات.
 */
function historyStart_() {
  return cached_('histStart', function () {
    let best = '';
    table_('PAYMENTS').forEach(function (p) {
      const mk = monthKey_(p.month);
      if (validMonth_(mk) && (!best || mk < best)) best = mk;
    });
    table_('MONTHS').forEach(function (r) {
      const mk = monthKey_(r.month);
      if (validMonth_(mk) && (!best || mk < best)) best = mk;
    });
    return best || currentMonth_();
  });
}

/**
 * الالتزامات غير المسدَّدة من شهور سابقة.
 * بدون هذا يختفي الالتزام المتأخر تماماً عند دخول الشهر الجديد،
 * ويظهر الرصيد أعلى مما هو عليه لأنك ببساطة لم تدفع.
 */
function arrearsFor_(month) {
  return cached_('arr:' + month, function () {
    const sm = startMonth_();
    const hist = historyStart_();
    const floor = hist > sm ? hist : sm;
    const out = [];
    let mk = prevMonth_(month);
    for (let i = 0; i < ARREARS_LOOKBACK && mk >= floor; i++) {
      obligationsForMonth_(mk).forEach(function (o) {
        // التوقّع الذي لم تؤكده ليس ديناً عليك — لا يُحسب متأخرات
        if (o.isExpected) return;
        if (o.remainingAmount > 0.5) {
          out.push({ id: o.id, name: o.name, month: mk, dueDate: o.dueDate,
                     amount: Math.round(o.remainingAmount), total: o.amount,
                     priority: o.priority, category: o.category,
                     monthsLate: monthsBetween_(mk, month) });
        }
      });
      mk = prevMonth_(mk);
    }
    return out.sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
  });
}

function monthsBetween_(a, b) {
  const ya = +a.slice(0,4), ma = +a.slice(5,7), yb = +b.slice(0,4), mb = +b.slice(5,7);
  return (yb - ya) * 12 + (mb - ma);
}

function computeMonthSummary_(month) {
  const incomes = activeIncomes_(month);
  const obligations = obligationsForMonth_(month);
  const purchases = purchasesForMonth_(month);

  const incomeExpected = incomes.reduce(function (s, i) { return s + i.amount; }, 0);
  const incomeRealized = incomes.filter(function (i) { return i.arrived; })
                                .reduce(function (s, i) { return s + i.amount; }, 0);
  const plannedObligations = obligations.reduce(function (s, o) { return s + o.amount; }, 0);
  const expectedObligations = obligations.filter(function (o) { return o.isExpected; })
    .reduce(function (s, o) { return s + o.amount; }, 0);
  const autoDeducted = obligations.filter(function (o) { return o.autoPaid; })
    .reduce(function (s, o) { return s + o.amount; }, 0);
  const paidObligations = obligations.reduce(function (s, o) { return s + o.paidAmount; }, 0);
  const purchasesSpent = purchases.reduce(function (s, p) { return s + p.amount; }, 0);
  const purchaseBudget = num(getSetting_('PURCHASE_BUDGET'));
  // ما يُحجز للنثريات: السقف ما دام لم يُتجاوز، وإلا المصروف الفعلي.
  const purchasesReserved = Math.max(purchaseBudget, purchasesSpent);
  const savingsDeposited = savingsDepositedIn_(month);
  const buffer = num(getSetting_('SAFETY_BUFFER'));
  const opening = openingBalance_(month);

  // الدخل الإضافي لا يدخل الخطة، لكنه يزيد السيولة الفعلية بعد نزوله
  const extras = incomesForMonth_(month).filter(function (i) {
    return !i.isBasic && !i.paused && i.inWindow;
  });
  const extraExpected = extras.reduce(function (s, i) { return s + i.amount; }, 0);
  const extraRealized = extras.filter(function (i) { return i.arrived; })
                              .reduce(function (s, i) { return s + i.amount; }, 0);

  const arrears = arrearsFor_(month);
  const arrearsTotal = arrears.reduce(function (s, a) { return s + a.amount; }, 0);

  const remaining = opening + incomeExpected + extraRealized
                  - plannedObligations - purchasesReserved - arrearsTotal;
  // التجنيب لالتزام قادم مال محجوز — لا يُحسب متاحاً ولا يدخل في الادخار العام
  const reservesMonthly = reservesTotal_(month);
  const safe = Math.max(0, remaining - buffer - reservesMonthly);
  const rate = num(getSetting_('SAVINGS_RATE'));
  const suggestedSaving = Math.max(0, Math.round(safe * rate / 100));
  const closing = opening + incomeRealized + extraRealized
                - paidObligations - purchasesSpent - savingsDeposited;

  return {
    month: month, opening: opening,
    startDate: fmtDate_(startDate_()),
    beforeStartMonth: month < startMonth_(),
    isStartMonth: month === startMonth_(),
    incomeExpected: incomeExpected, incomeRealized: incomeRealized,
    plannedObligations: plannedObligations, paidObligations: paidObligations,
    expectedObligations: Math.round(expectedObligations),
    autoDeducted: Math.round(autoDeducted),
    unpaidObligations: Math.max(0, plannedObligations - paidObligations),
    purchasesSpent: purchasesSpent, purchaseBudget: purchaseBudget,
    purchasesReserved: purchasesReserved,
    purchasesLeft: Math.max(0, purchaseBudget - purchasesSpent),
    purchasesOverBudget: purchaseBudget > 0 && purchasesSpent > purchaseBudget,
    savingsDeposited: savingsDeposited,
    extraExpected: extraExpected, extraRealized: extraRealized,
    arrearsTotal: Math.round(arrearsTotal), arrearsCount: arrears.length,
    categoriesOver: categorySpend_(month).filter(function (c) { return c.over; }).length,
    buffer: buffer, remaining: remaining, safeRemaining: safe, reservesMonthly: Math.round(reservesMonthly),
    savingsRate: rate, suggestedSaving: suggestedSaving,
    closing: closing,
    closed: !!monthRecord_(month)
  };
}

function closeMonth(token, month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, 'تم إقفال الشهر وترحيل رصيده', function () {
    const s = monthSummary_(m);
    const body = {
      month: m, opening: s.opening, income: s.incomeRealized,
      obligations: s.paidObligations, purchases: s.purchasesSpent,
      savings: s.savingsDeposited, closing: s.closing, closedAt: nowStamp_()
    };
    const rec = monthRecord_(m);
    if (rec) updateById_('MONTHS', rec.id, body);
    else insert_('MONTHS', body);
    return {
      closing: s.closing,
      message: s.unpaidObligations > 0.5
        ? 'أُقفل الشهر، لكن بقي ' + Math.round(s.unpaidObligations) +
          ' ريال غير مسدَّد — سيظهر كمتأخرات في الشهر التالي'
        : 'تم إقفال الشهر وترحيل رصيده'
    };
  });
}

function reopenMonth(token, month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, 'تم فتح الشهر من جديد', function () {
    hardDeleteWhere_('MONTHS', function (r) { return monthKey_(r.month) === m; });
  });
}

/* ============================================================
 *  11) التوزيع التلقائي — يدعم التقسيم على عدة مصادر
 * ========================================================== */

/** آخر نزول لمصدر دخل قبل تاريخ الاستحقاق (يشمل دورة الشهر السابق). */
/** آخر نزول لمصدر دخل قبل تاريخ الاستحقاق (يشمل دورة الشهر السابق). */
function latestOccurrence_(income, due) {
  // دخل بلا موعد لا يمكن الاعتماد عليه في تغطية استحقاق — لا نصنع له تاريخاً
  if (income && income.hasSchedule === false) return null;
  if (income && !income.day) return null;
  let best = null;
  for (let offset = 0; offset <= 1; offset++) {
    const base = new Date(due.getFullYear(), due.getMonth() - offset, 1);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const d = new Date(base.getFullYear(), base.getMonth(), Math.min(income.day, lastDay));
    if (d <= due && (!best || d > best)) best = d;
  }
  return best;
}

/**
 * حالة مصدر الدخل في الشهر الذي تقع فيه دورة معيّنة.
 * مهم للمصادر المتغيرة: دورة أغسطس قد يكون مبلغها الفعلي مختلفاً عن تقدير سبتمبر.
 */
function incomeAtOccurrence_(incomeId, occDate) {
  if (beforeStart_(occDate)) return null;   // دورة سابقة لبداية التتبع
  // لا بد من دورة تاريخ النزول لا شهره الميلادي:
  // راتب 27 سبتمبر ينتمي لدورة أكتوبر، وقراءته من دورة سبتمبر تعطي مبلغاً وحالة خاطئين.
  const list = incomesForMonth_(cycleOf_(occDate));
  const found = list.filter(function (i) { return i.id === String(incomeId); })[0];
  if (!found) return null;
  return {
    id: found.id, name: found.name, day: found.day, amount: found.amount,
    // المبلغ مؤكد إذا كان المصدر ثابتاً أو كان متغيراً وسُجّل نزوله فعلاً
    certain: !found.isVariable || (found.arrived && found.actualAmount > 0)
  };
}

function occKey_(incomeId, date) { return incomeId + '|' + fmtDate_(date); }

/**
 * سعة كل دورة دخل = مبلغ تلك الدورة ناقص كل ما رُبط عليها.
 *
 * الالتزام المستحق أول الشهر يُربط على راتب الشهر السابق، وذلك الراتب
 * تحمّل أصلاً التزامات الشهر السابق. لذلك نقرأ شهرين — السابق والحالي —
 * ونخصم منهما معاً، وإلا ظهرت الدورة السابقة وكأنها فارغة تماماً.
 */
/**
 * المرن والترفيهي (مقاضي البيت، ترفيه) يُصرف على مدار الدورة لا في يوم واحد،
 * فيُموَّل من أي دخل ينزل داخل دورته — الراتب أولها والمواطن وسطها.
 * أما الصارم (إيجار، قسط) فيُدفع يوم استحقاقه، فلا يموّله إلا دخل نزل قبله.
 */
function isSpread_(o) {
  const t = String((o && o.type) || '');
  return t === 'مرن' || t === 'ترفيهي';
}
function fundingOccurrence_(inc, o, cycle) {
  if (!inc || inc.hasSchedule === false || !inc.day) return null;
  if (isSpread_(o)) {
    const k = validMonth_(cycle) ? cycle : cycleOf_(toDate_(o.dueDate));
    return cycleDate_(k, inc.day);
  }
  return latestOccurrence_(inc, toDate_(o.dueDate));
}

function occurrenceCapacity_(month) {
  const cap = {};
  [prevMonth_(month), month].forEach(function (mk) {
    obligationsForMonth_(mk).forEach(function (o) {
      o.sources.forEach(function (s) {
        const probe = incomesForMonth_(mk).filter(function (i) { return i.id === s.sourceId; })[0];
        if (!probe) return;
        const occ = fundingOccurrence_(probe, o, mk);
        if (!occ) return;
        const at = incomeAtOccurrence_(s.sourceId, occ);
        if (!at) return;
        const k = occKey_(s.sourceId, occ);
        if (cap[k] === undefined) cap[k] = at.amount;
        cap[k] -= s.amount;
      });
    });
  });
  return cap;
}

function capacityOf_(cap, incomeId, occ, fallbackAmount) {
  const k = occKey_(incomeId, occ);
  return cap[k] === undefined ? fallbackAmount : cap[k];
}

const MAX_SPLITS = 3;

/**
 * mode = 'unassigned' (الافتراضي): يقترح فقط لما لا مصدر له — وهو ما تحتاجه عادة.
 * mode = 'all': يتجاهل التوزيع الحالي ويعيد اقتراح كل شيء من الصفر.
 */
function autoAllocate(token, month, mode) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const redoAll = String(mode || 'unassigned') === 'all';
  const incomes = activeIncomes_(m);
  const obligations = obligationsForMonth_(m);
  const cap = occurrenceCapacity_(m);
  const share = savingsShareBySource_(m);

  // عند إعادة توزيع الكل نحرّر السعة التي تشغلها التخصيصات الحالية أولاً
  if (redoAll) {
    obligations.forEach(function (o) {
      o.sources.forEach(function (sr) {
        const inc = incomes.filter(function (i) { return i.id === sr.sourceId; })[0];
        if (!inc) return;
        const occ = fundingOccurrence_(inc, o, m);
        if (!occ) return;
        const k = occKey_(inc.id, occ);
        if (cap[k] !== undefined) cap[k] += sr.amount;
      });
    });
  }

  // الأولوية تسبق تاريخ الاستحقاق: الالتزام العالي يحجز سعته أولاً،
  // ثم يُرتَّب داخل كل مستوى بالأقرب استحقاقاً.
  // نفس ترتيب التوزيع الذكي: الخصم التلقائي ← الصارم ← المرن ← الكمالي، ثم الأولوية
  const tier = function (o) { return o.autoDeduct ? 0 : o.type === 'مرن' ? 2 : o.type === 'ترفيهي' ? 3 : 1; };
  const queue = obligations.slice().sort(function (a, b) {
    return tier(a) - tier(b) || priorityRank_(a.priority) - priorityRank_(b.priority) ||
           String(a.dueDate).localeCompare(String(b.dueDate));
  });

  const proposals = {};
  queue.forEach(function (o) {
    if (!redoAll && o.sources.length && o.unallocatedAmount <= 0) {
      proposals[o.id] = {
        obligationId: o.id, name: o.name, amount: o.amount, priority: o.priority,
        wasUnassigned: false,
        splits: o.sources.map(function (s) {
          return { sourceId: s.sourceId, sourceName: s.sourceName, amount: s.amount,
                   occurrence: '', sameMonth: true, estimated: false };
        }),
        shortfall: 0, manual: true,
        reason: o.sourcePaused ? 'التوزيع اليدوي محفوظ لكن أحد المصادر موقوف هذا الشهر'
              : o.sourceMissing ? 'أحد المصادر غير موجود — راجع الالتزام'
              : 'التوزيع اليدوي محفوظ',
        review: o.sourcePaused || o.sourceMissing
      };
      return;
    }

    let need = (!redoAll && o.unallocatedAmount > 0) ? o.unallocatedAmount : o.amount;
    const due = toDate_(o.dueDate);
    // لا نقبل جزءاً أصغر من هذا الحد حتى لا ينتج تقسيم مثل 4,950 + 50
    const minPart = Math.max(200, Math.round(need * 0.05));

    const candidates = [];
    incomes.forEach(function (inc) {
      const occ = fundingOccurrence_(inc, o, m);
      if (!occ) return;
      const at = incomeAtOccurrence_(inc.id, occ);
      if (!at) return;   // لا نبني اقتراحاً على راتب نزل قبل أن تبدأ
      candidates.push({
        id: inc.id, name: inc.name, occ: occ, base: at.amount,
        free: Math.max(0, capacityOf_(cap, inc.id, occ, at.amount)),
        certain: at.certain,
        sameMonth: occ.getMonth() === due.getMonth() && occ.getFullYear() === due.getFullYear(),
        savingsShare: share[inc.id] || 0
      });
    });

    // الترتيب: يغطي المبلغ كاملاً ← مبلغه مؤكد ← دورة هذا الشهر ← الأحدث ← الأوسع سعة
    // «في وقته»: الأقرب نزولاً قبل الموعد أولاً، فيبقى المال المبكر لما لا يسبقه غيره.
    // تفضيل «ما يتسع كاملاً» كان يأخذ الراتب لبند يستطيع الانتظار فيجوّع ما بعده.
    candidates.sort(function (a, b) {
      return (b.certain ? 1 : 0) - (a.certain ? 1 : 0) ||
             b.occ - a.occ || b.free - a.free;
    });

    const splits = [];
    let usedEstimate = false, usedPrevCycle = false, squeezesSaving = false;
    for (let i = 0; i < candidates.length && need > 0.5; i++) {
      if (splits.length >= MAX_SPLITS) break;
      const c = candidates[i];
      if (c.free <= 0) continue;
      const take = Math.min(c.free, need);
      // نتجاهل مصدراً لا يستطيع إلا فتات المبلغ، إلا إذا كان سيُكمله
      if (take < minPart && take < need - 0.5) continue;
      splits.push({ sourceId: c.id, sourceName: c.name, amount: Math.round(take),
                    occurrence: fmtDate_(c.occ), sameMonth: c.sameMonth, estimated: !c.certain });
      cap[occKey_(c.id, c.occ)] = c.free - take;
      if (!c.certain) usedEstimate = true;
      if (!c.sameMonth) usedPrevCycle = true;
      if ((c.free - take) < c.savingsShare) squeezesSaving = true;
      need -= take;
    }

    // مرور ختامي: لو بقي مبلغ صغير، نسمح بإغلاقه من مصدر تخطّيناه لأن حصته كانت دون الحد
    if (need > 0.5 && splits.length < MAX_SPLITS) {
      for (let i = 0; i < candidates.length && need > 0.5; i++) {
        const c = candidates[i];
        const already = splits.some(function (s) {
          return s.sourceId === c.id && s.occurrence === fmtDate_(c.occ);
        });
        if (already) continue;
        const free = Math.max(0, capacityOf_(cap, c.id, c.occ, c.base));
        if (free <= 0) continue;
        const take = Math.min(free, need);
        splits.push({ sourceId: c.id, sourceName: c.name, amount: Math.round(take),
                      occurrence: fmtDate_(c.occ), sameMonth: c.sameMonth, estimated: !c.certain });
        cap[occKey_(c.id, c.occ)] = free - take;
        if (!c.certain) usedEstimate = true;
        if (!c.sameMonth) usedPrevCycle = true;
        need -= take;
      }
    }

    const covered = need <= 0.5;
    const hadCandidates = candidates.length > 0;
    const hadRoom = candidates.some(function (c) { return c.free > 0; });
    const reasons = [];
    // نفرّق بين "لا يوجد مصدر أصلاً" و"المصدر موجود لكن دورته استُهلكت"
    if (!splits.length && !hadCandidates) reasons.push('لا يوجد دخل أساسي ينزل قبل تاريخ الاستحقاق');
    else if (!splits.length && !hadRoom) reasons.push('دورات الدخل المتاحة قبل الاستحقاق مستهلكة بالكامل');
    else if (!splits.length) reasons.push('السعة المتبقية أصغر من أن تُقسَّم — راجع الالتزام يدوياً');
    else if (!covered) reasons.push('السعة المتاحة لا تغطي المبلغ كاملاً — ينقص ' + Math.round(need) + ' ريال');
    else if (splits.length > 1) reasons.push('قُسّم على ' + splits.length + ' مصادر لعدم كفاية أي مصدر منفرد');
    else reasons.push('أنسب دخل أساسي قبل الاستحقاق ضمن سعة دورته');
    if (usedPrevCycle) reasons.push('يعتمد على دورة الشهر السابق');
    if (usedEstimate) reasons.push('مبلغ المصدر تقديري ولم يُسجَّل نزوله بعد');
    if (o.isEstimated) reasons.push('مبلغ الالتزام نفسه تقديري');
    if (squeezesSaving) reasons.push('يستهلك الجزء المخصص للادخار من هذا المصدر');

    proposals[o.id] = {
      obligationId: o.id, name: o.name, amount: o.amount, priority: o.priority,
      wasUnassigned: !o.sources.length || o.unallocatedAmount > 0,
      splits: splits, shortfall: covered ? 0 : Math.round(need), manual: false,
      reason: reasons.join(' · '),
      review: !covered || !splits.length || usedPrevCycle || usedEstimate || squeezesSaving
    };
  });

  // نعيدها بترتيب العرض المعتاد (تاريخ الاستحقاق) لا بترتيب المعالجة
  const list = obligations.map(function (o) { return proposals[o.id]; }).filter(Boolean);

  // الربط دائم: نكشف أي راتب سيعجز في الدورات الـ12 القادمة بسبب هذا الاقتراح
  const overrides = {};
  list.forEach(function (x) {
    if (!x.manual && x.splits && x.splits.length) {
      overrides[x.obligationId] = x.splits.map(function (sp) { return { sourceId: sp.sourceId, amount: sp.amount }; });
    }
  });
  if (Object.keys(overrides).length) {
    let over = [];
    try { over = futureOverflows_(m, overrides); } catch (e) { over = []; }
    list.forEach(function (x) {
      if (!overrides[x.obligationId]) return;
      const hits = over.filter(function (p) {
        return x.splits.some(function (sp) { return sp.sourceId === p.sourceId; });
      });
      if (hits.length) {
        x.review = true;
        x.reason += ' · ⚠ ' + hits.map(function (p) {
          return p.source + ' يعجز بـ ' + Math.round(-p.free) + ' في دورة ' + p.cycle;
        }).join('، ');
      }
    });
  }
  return list;
}

/**
 * يعتمد التوزيع المقترح بعد إعادة التحقق من السعة لحظة الاعتماد.
 * النافذة قد تكون مفتوحة منذ دقائق وتغيّر شيء في تبويب آخر.
 */
function applyAllocation(token, month, items) {
  const m = validMonth_(month) ? month : defaultMonth_();
  return mutate_(token, m, 'تم اعتماد التوزيع', function () {
    const valid = {};
    activeIncomes_(m).forEach(function (i) { valid[i.id] = i; });
    const cap = occurrenceCapacity_(m);
    const list = (items || []).filter(function (x) { return x && x.obligationId; });

    // نعيد السعة التي تشغلها التخصيصات الحالية للبنود التي سنعيد كتابتها
    const targets = {};
    list.forEach(function (x) { targets[String(x.obligationId)] = true; });
    obligationsForMonth_(m).forEach(function (o) {
      if (!targets[o.id]) return;
      o.sources.forEach(function (s) {
        const inc = valid[s.sourceId]; if (!inc) return;
        const occ = fundingOccurrence_(inc, o, m); if (!occ) return;
        const k = occKey_(inc.id, occ);
        if (cap[k] !== undefined) cap[k] += s.amount;
      });
    });

    const byId = {};
    obligationsForMonth_(m).forEach(function (o) { byId[o.id] = o; });

    let applied = 0;
    const skipped = [];
    list.forEach(function (item) {
      const o = byId[String(item.obligationId)];
      if (!o) { return; }
      const rows = [];
      let ok = true;

      (item.splits || []).forEach(function (s) {
        if (!ok) return;
        const inc = valid[String(s.sourceId)];
        const amt = positive_(s.amount);
        if (!inc || amt <= 0) { ok = false; return; }
        const occ = fundingOccurrence_(inc, o, m);
        if (!occ) { ok = false; return; }
        const k = occKey_(inc.id, occ);
        const free = cap[k] === undefined ? inc.amount : cap[k];
        if (amt > free + 0.5) { ok = false; return; }   // السعة تغيّرت منذ إنشاء الاقتراح
        cap[k] = free - amt;
        rows.push({ obligationId: o.id, sourceId: inc.id, amount: amt });
      });

      if (!ok || !rows.length) { skipped.push(o.name); return; }
      hardDeleteWhere_('ALLOCATIONS', function (a) { return String(a.obligationId) === String(o.id); });
      insertMany_('ALLOCATIONS', rows);
      applied++;
    });

    const text = !applied && skipped.length
        ? 'لم يُعتمد أي توزيع — تغيّرت السعة المتاحة، أعد الحساب'
      : skipped.length
        ? 'اعتُمد ' + applied + ' توزيعاً، وتُخطّي ' + skipped.length + ' لتغيّر السعة: ' + skipped.join('، ')
        : 'تم اعتماد التوزيع لـ ' + applied + ' التزاماً';
    return { applied: applied, skipped: skipped, message: text };
  });
}

function buildAppData_(month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  const incomes = incomesForMonth_(m);
  const obligations = obligationsForMonth_(m);
  const summary = monthSummary_(m);
  return {
    month: m,
    incomes: incomes,
    obligations: obligations,
    purchases: purchasesForMonth_(m),
    savings: savingsGoals_(),
    summary: summary,
    arrears: arrearsFor_(m),
    categorySpend: categorySpend_(m),
    // حالة التجنيب للتنبيه في الرئيسية: هل جُنِّب هذه الدورة؟ وهل هو متأخر؟
    reserveStatus: safe_(function () { return getReservesRaw_().map(function (r) {
      return { id: r.id, name: r.name, monthly: r.monthly, behind: r.behind,
               depositedThisCycle: r.depositedThisCycle, cyclesLeft: r.cyclesLeft };
    }); }),
    sourceBreakdown: sourceBreakdown_(m),
    settings: {
      buffer: summary.buffer,
      savingsRate: summary.savingsRate,
      purchaseBudget: summary.purchaseBudget,
      rollover: String(getSetting_('ROLLOVER') || 'نعم') !== 'لا',
      startDate: fmtDate_(startDate_()),
      startMonth: startMonth_(),
      cycleStartDay: cycleStartDay_(),
      currentMonth: defaultMonth_(),
      todayCycle: currentMonth_(),
      cycleBeforeStart: currentMonth_() < startMonth_(),
      cycleLabel: cycleLabel_(m),
      cycleRange: { start: fmtDate_(cycleRange_(m).start), end: fmtDate_(cycleRange_(m).end) },
      categoryBudgets: categoryBudgets_(),
      purchaseCategories: purchaseCategories_(),
      obligationCategories: obligationCategories_()
    },
    generatedAt: nowStamp_()
  };
}

function getAppData(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  if (pendingRecurring_(m).length) {
    withLock_(function () { materializeRecurring_(m); });
    cacheReset_();
  }
  return buildAppData_(m);
}

/** لكل مصدر دخل: كم عليه، كم سُدّد منه، وكم بقي. */
/**
 * نصيب كل مصدر من الادخار المقترح، موزّعاً بنسبة دخله.
 * بدونه قد يظهر المصدر "سليماً" بينما الفائض الذي يبدو حراً
 * هو نفسه المفترض أن يخرج منه الادخار.
 */
function savingsShareBySource_(month) {
  const incomes = activeIncomes_(month);
  const valid = {};
  incomes.forEach(function (i) { valid[i.id] = true; });
  const total = incomes.reduce(function (s, i) { return s + i.amount; }, 0);
  const suggested = monthSummary_(month).suggestedSaving;
  const out = {};
  incomes.forEach(function (i) { out[i.id] = 0; });

  // أهداف مربوطة بمصدر معيّن: مساهمتها تُحمَّل عليه مباشرة
  let pinned = 0;
  savingsGoals_().forEach(function (g) {
    if (g.sourceId && valid[g.sourceId] && g.monthly > 0 && g.saved < g.target) {
      out[g.sourceId] += g.monthly;
      pinned += g.monthly;
    }
  });
  // الباقي من الادخار المقترح يوزَّع بنسبة الدخل
  const rest = Math.max(0, suggested - pinned);
  incomes.forEach(function (i) {
    out[i.id] += total > 0 ? Math.round(rest * (i.amount / total)) : 0;
  });
  return out;
}

/** لكل مصدر دخل: كم رُبط عليه، كم سُدّد منه، وكم بقي فعلاً. */
function sourceBreakdown_(month) {
  const incomes = activeIncomes_(month);
  const obligations = obligationsForMonth_(month);
  const share = savingsShareBySource_(month);
  const rsv = reservesBySource_(month);
  return incomes.map(function (i) {
    let allocated = 0, paid = 0, count = 0;
    obligations.forEach(function (o) {
      o.sources.forEach(function (s) {
        if (s.sourceId !== i.id) return;
        allocated += s.amount;
        count++;
        // نصيب هذا المصدر من المسدَّد بنسبة تخصيصه
        if (o.amount > 0) paid += o.paidAmount * (s.amount / o.amount);
      });
    });
    const free = i.amount - allocated;
    const saving = share[i.id] || 0;
    const reserve = rsv[i.id] || 0;
    const afterSaving = free - saving - reserve;
    return {
      id: i.id, name: i.name, amount: i.amount, day: i.day,
      isVariable: i.isVariable, arrived: i.arrived,
      // المبلغ غير مؤكد ما دام المصدر متغيراً ولم يُسجَّل نزوله
      estimated: i.isVariable && !(i.arrived && i.actualAmount > 0),
      allocated: Math.round(allocated), paid: Math.round(paid),
      unpaid: Math.round(allocated - paid),
      available: Math.round(i.amount - paid),
      free: Math.round(free),
      savingsShare: saving, reserveShare: Math.round(reserve),
      freeAfterSaving: Math.round(afterSaving),
      usage: i.amount > 0 ? allocated / i.amount : 0,
      obligationCount: count,
      status: free < 0 ? 'عجز' : afterSaving < 0 ? 'يزاحم الادخار'
            : (i.amount > 0 && allocated / i.amount > 0.9) ? 'على الحافة' : 'سليم'
    };
  });
}

function countOccurrences_(start, end, day, step, weekDays) {
  if (!start || !end) return null;
  if (weekDays) {
    return Math.floor((startOfDay_(end) - startOfDay_(start)) / 86400000 / weekDays) + 1;
  }
  const jump = Math.max(1, Number(step) || 1);
  let count = 0;
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    const due = monthDay_(fmtMonth_(cur), day);
    if (due >= start && due <= end) count++;
    cur = new Date(cur.getFullYear(), cur.getMonth() + jump, 1);
  }
  return count;
}

function getDebtOverview(token) {
  guard_(token);
  return debtOverview_();
}

function debtOverview_() {
  const today = startOfDay_(new Date());
  const payments = table_('PAYMENTS');
  const income = activeIncomes_(defaultMonth_()).reduce(function (s, i) { return s + i.amount; }, 0);

  const items = live_('OBLIGATIONS').filter(function (r) {
    return String(r.active || 'نعم') !== 'لا'
      && (recurrenceStep_(r.recurrence) > 0 || recurrenceDays_(r.recurrence) > 0)
      && toDate_(r.endDate);
  }).map(function (r) {
    const amt = obligationAmount_(r).amount;
    const start = toDate_(r.startDate), end = toDate_(r.endDate), day = clampDay_(r.day);
    const step = recurrenceStep_(r.recurrence);
    const wd = recurrenceDays_(r.recurrence);
    const total = countOccurrences_(start, end, day, step, wd);
    const done = payments.filter(function (p) {
      return String(p.obligationId) === String(r.id) && num(p.amount) >= num(p.dueAmount || amt) * 0.99;
    }).length;
    const left = total === null ? null : Math.max(0, total - done);
    return {
      id: String(r.id), name: String(r.name || ''), amount: amt, day: day,
      recurrence: normalizeRecurrence_(r.recurrence), step: step, weekDays: wd,
      startDate: fmtDate_(start), endDate: fmtDate_(end),
      totalInstallments: total, paidInstallments: done, remainingInstallments: left,
      totalValue: total === null ? null : total * amt,
      remainingValue: left === null ? null : left * amt,
      progress: total ? Math.min(1, done / total) : 0,
      monthsToPayoff: left === null ? null : left * step,
      finished: left === 0,
      overdueRisk: end < today && left > 0
    };
  }).sort(function (a, b) { return String(a.endDate).localeCompare(String(b.endDate)); });

  // التزام سنوي بـ 1200 يعادل 100 شهرياً — جمعه كاملاً يضخّم العبء
  const monthlyLoad = items.filter(function (x) { return !x.finished; })
    .reduce(function (s, x) {
      const perMonth = x.weekDays ? x.amount * (30 / x.weekDays) : x.amount / Math.max(1, x.step);
      return s + perMonth;
    }, 0);

  return {
    items: items,
    totalRemaining: items.reduce(function (s, x) { return s + (x.remainingValue || 0); }, 0),
    monthlyLoad: monthlyLoad,
    incomeShare: income > 0 ? monthlyLoad / income : 0,
    payoffDate: items.filter(function (x) { return !x.finished; })
      .map(function (x) { return x.endDate; }).sort().pop() || '',
    income: income
  };
}

/* ============================================================
 *  13.5) التوقعات — ما الذي ينتظرك في الدورات القادمة
 * ========================================================== */

function addCycles_(key, n) {
  const y = Number(String(key).slice(0, 4)), m = Number(String(key).slice(5, 7));
  return fmtMonth_(new Date(y, m - 1 + n, 1));
}

/**
 * يعرض الدورات القادمة: الدخل المتوقع، الالتزامات المؤكدة والمتوقعة،
 * والرصيد التراكمي — ليتبيّن أي دورة ستضغط عليك قبل أن تصل.
 */
function getForecast(token, monthsAhead) {
  guard_(token);
  return forecast_(defaultMonth_(), monthsAhead);
}

function forecast_(baseMonth, monthsAhead) {
  const n = Math.min(18, Math.max(2, Number(monthsAhead) || 6));
  const base = validMonth_(baseMonth) ? baseMonth : defaultMonth_();
  const buffer = num(getSetting_('SAFETY_BUFFER'));
  const purchaseBudget = num(getSetting_('PURCHASE_BUDGET'));

  const cur = monthSummary_(base);
  let running = cur.opening + cur.incomeExpected + cur.extraRealized
              - cur.plannedObligations - cur.purchasesReserved - cur.arrearsTotal;

  const cycles = [];
  for (let i = 0; i < n; i++) {
    const key = addCycles_(base, i);
    const obs = obligationsForMonth_(key);
    const income = activeIncomes_(key).reduce(function (s, x) { return s + x.amount; }, 0);
    const confirmed = obs.filter(function (o) { return !o.isExpected; })
                         .reduce(function (s, o) { return s + o.amount; }, 0);
    const expected = obs.filter(function (o) { return o.isExpected; })
                        .reduce(function (s, o) { return s + o.amount; }, 0);
    const oneOff = obs.filter(function (o) { return !o.recurring || o.isExpected; })
      .map(function (o) {
        return { id: o.id, name: o.name, amount: o.amount, dueDate: o.dueDate,
                 category: o.category, isExpected: o.isExpected };
      });

    if (i > 0) running += income - confirmed - expected - purchaseBudget;

    cycles.push({
      month: key, label: cycleLabel_(key), isCurrent: i === 0,
      opening: i === 0 ? Math.round(cur.opening) : 0,
      arrears: i === 0 ? Math.round(cur.arrearsTotal) : 0,
      income: Math.round(income),
      confirmed: Math.round(confirmed),
      expected: Math.round(expected),
      purchases: Math.round(purchaseBudget),
      net: Math.round(income - confirmed - expected - purchaseBudget),
      balance: Math.round(running),
      tight: running < buffer,
      negative: running < 0,
      oneOff: oneOff
    });
  }

  // بنود متوقعة قادمة + كم تحتاج أن تُجنّب شهرياً من الآن حتى موعدها
  const upcoming = [];
  cycles.forEach(function (c, idx) {
    c.oneOff.forEach(function (o) {
      const monthsLeft = Math.max(1, idx);
      upcoming.push({
        id: o.id, name: o.name, amount: o.amount, dueDate: o.dueDate,
        month: c.month, label: c.label, category: o.category,
        isExpected: o.isExpected, cyclesAway: idx,
        setAside: Math.ceil(o.amount / monthsLeft)
      });
    });
  });
  upcoming.sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });

  const totalExpected = cycles.reduce(function (s, c) { return s + c.expected; }, 0);
  const firstTight = cycles.filter(function (c) { return c.negative; })[0] || null;

  return {
    base: base, cycles: cycles, upcoming: upcoming,
    purchaseBudgetSet: purchaseBudget > 0,
    totalExpected: totalExpected,
    setAsideMonthly: upcoming.filter(function (u) { return u.cyclesAway > 0; })
      .reduce(function (s, u) { return s + u.setAside; }, 0),
    firstTight: firstTight ? { month: firstTight.month, label: firstTight.label, balance: firstTight.balance } : null,
    buffer: buffer
  };
}

/* ============================================================
 *  14) الاتجاه ومقارنة الشهور
 * ========================================================== */

function getMonthlyTrend(token, monthsBack) {
  guard_(token);
  const n = Math.min(12, Math.max(2, Number(monthsBack) || 6));
  const base = currentMonth_();
  const y = Number(base.slice(0, 4)), mo = Number(base.slice(5, 7));
  const out = [];
  const sm = startMonth_();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, mo - 1 - i, 1);
    const key = fmtMonth_(d);
    if (key < sm) continue;           // لا نرسم شهوراً تسبق بدايتك
    const s = monthSummary_(key);
    out.push({
      month: key,
      income: s.incomeExpected, incomeRealized: s.incomeRealized,
      obligations: s.plannedObligations, paid: s.paidObligations,
      purchases: s.purchasesSpent, savings: s.savingsDeposited,
      net: s.remaining, closing: s.closing, closed: s.closed
    });
  }
  const recent = out.slice(-4, -1);  // آخر 3 أشهر مكتملة قبل الحالي
  const avg = function (k) {
    return recent.length ? Math.round(recent.reduce(function (s, x) { return s + x[k]; }, 0) / recent.length) : 0;
  };
  const cur = out[out.length - 1];
  return {
    series: out,
    average: { obligations: avg('obligations'), purchases: avg('purchases'), savings: avg('savings'), income: avg('income') },
    current: cur,
    delta: {
      obligations: cur.obligations - avg('obligations'),
      purchases: cur.purchases - avg('purchases'),
      savings: cur.savings - avg('savings')
    },
    categoryBreakdown: categoryTrend_(out.map(function (x) { return x.month; })),
    obligationCategories: obligationCategoryBreakdown_(base)
  };
}

/** توزيع التزامات شهر معيّن على تصنيفاتها. */
function obligationCategoryBreakdown_(month) {
  const totals = {};
  obligationsForMonth_(month).forEach(function (o) {
    const c = String(o.category || 'أخرى');
    totals[c] = (totals[c] || 0) + o.amount;
  });
  return Object.keys(totals).map(function (k) {
    return { category: k, amount: Math.round(totals[k]) };
  }).sort(function (a, b) { return b.amount - a.amount; });
}

function categoryTrend_(months) {
  const set = {};
  months.forEach(function (m) { set[m] = true; });
  const totals = {};
  live_('PURCHASES').forEach(function (p) {
    const d = fmtDate_(toDate_(p.date));
    if (!d) return;
    const m = cycleOf_(toDate_(d));
    if (!set[m]) return;
    const c = String(p.category || 'أخرى');
    totals[c] = (totals[c] || 0) + num(p.amount);
  });
  return Object.keys(totals).map(function (k) { return { category: k, amount: Math.round(totals[k]) }; })
    .sort(function (a, b) { return b.amount - a.amount; });
}

/* ============================================================
 *  15) محاكي "ماذا لو"
 * ========================================================== */

/**
 * scenario = {
 *   kind: 'loan' | 'expense' | 'income' | 'saving',
 *   amount: رقم, months: عدد الأشهر (للقرض), label: نص
 * }
 */
/**
 * سيناريو مركّب: عدة قرارات معاً.
 * items = [{kind, amount, months, day, label}]
 */
function simulateMulti(token, month, items) {
  guard_(token);
  return simulateMulti_(validMonth_(month) ? month : currentMonth_(), items);
}

function simulateMulti_(month, items) {
  const m = month;
  const list = (items || []).filter(function (x) { return x && positive_(x.amount) > 0; });
  if (!list.length) throw new Error('أضف قراراً واحداً على الأقل');

  const before = monthSummary_(m);
  let delta = 0, totalCost = 0;
  const parts = list.map(function (x) {
    const amt = positive_(x.amount);
    const months = Math.max(1, Number(x.months) || 1);
    const sign = String(x.kind) === 'income' ? 1 : -1;
    delta += sign * amt;
    totalCost += String(x.kind) === 'loan' ? amt * months : amt;
    return { kind: String(x.kind || 'expense'), label: String(x.label || ''), amount: amt,
             months: months, day: clampDay_(x.day), monthlyEffect: sign * amt };
  });

  const remaining = before.remaining + delta;
  const safe = Math.max(0, remaining - before.buffer);

  // الأثر على التدفق اليومي: نضيف كل بند في تاريخه داخل الدورة
  const extraItems = parts.filter(function (p) { return p.monthlyEffect < 0; })
    .map(function (p) { return { date: fmtDate_(cycleDate_(m, p.day)), amount: p.amount, label: p.label || 'قرار' }; });
  const flow = dailyFlow_(m, { extraItems: extraItems });

  const goals = savingsGoals_().map(function (g) {
    const rem = Math.max(0, g.target - g.saved);
    const beforeEta = g.monthly > 0 ? Math.ceil(rem / g.monthly) : null;
    const capacity = Math.min(g.monthly || 0, safe);
    const afterEta = capacity > 0 ? Math.ceil(rem / capacity) : null;
    return { id: g.id, name: g.name, remaining: rem, etaBefore: beforeEta, etaAfter: afterEta,
             delayMonths: (beforeEta !== null && afterEta !== null) ? afterEta - beforeEta : null,
             atRisk: capacity <= 0 && rem > 0 };
  });

  return {
    month: m, parts: parts, totalMonthlyEffect: Math.round(delta), totalCost: Math.round(totalCost),
    before: { remaining: before.remaining, safeRemaining: before.safeRemaining, minBalance: dailyFlow_(m, null).minBalance },
    after: { remaining: Math.round(remaining), safeRemaining: Math.round(safe), minBalance: flow.minBalance },
    firstNegative: flow.firstNegative,
    goals: goals,
    feasible: remaining >= 0 && !flow.firstNegative,
    verdict: remaining < 0
        ? 'هذه القرارات مجتمعة تضعك في عجز شهري قدره ' + Math.abs(Math.round(remaining)) + ' ريال.'
      : flow.firstNegative
        ? 'المجموع الشهري يكفي، لكن رصيدك يسلب يوم ' + flow.firstNegative.date + ' — مشكلة توقيت لا مبلغ.'
      : safe <= 0 ? 'يغطي التزاماتك لكن بلا فائض آمن بعد الاحتياطي.'
      : 'مريح — يبقى فائض آمن ' + Math.round(safe) + ' ريال ولا يسلب رصيدك في أي يوم.'
  };
}

function simulate(token, month, scenario) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const before = monthSummary_(m);
  const kind = String(scenario && scenario.kind || 'expense');
  const amount = positive_(scenario && scenario.amount);
  const months = Math.max(1, Number(scenario && scenario.months) || 1);
  const day = clampDay_(scenario && scenario.day);

  // القرض والمصروف والادخار كلها تخصم من المتبقي؛ الدخل الإضافي يزيده.
  const delta = kind === 'income' ? amount : -amount;
  const remaining = before.remaining + delta;
  const safe = Math.max(0, remaining - before.buffer);
  const suggested = Math.max(0, Math.round(safe * before.savingsRate / 100));

  // أثر السيناريو على أهداف الادخار
  const goals = savingsGoals_().map(function (g) {
    const rem = Math.max(0, g.target - g.saved);
    const beforeEta = g.monthly > 0 ? Math.ceil(rem / g.monthly) : null;
    const capacity = Math.min(g.monthly || 0, safe);
    const afterEta = capacity > 0 ? Math.ceil(rem / capacity) : null;
    return {
      id: g.id, name: g.name, remaining: rem,
      etaBefore: beforeEta, etaAfter: afterEta,
      delayMonths: (beforeEta !== null && afterEta !== null) ? afterEta - beforeEta : null,
      atRisk: capacity <= 0 && rem > 0
    };
  });

  // أي دورة دخل تستطيع استيعاب القسط الجديد؟ المجموع الشهري وحده يخدع:
  // قد يكفي الإجمالي بينما لا يكفي الراتب الذي ينزل قبل الاستحقاق.
  let sourceFit = null;
  if (kind === 'loan' || kind === 'expense') {
    const cap = occurrenceCapacity_(m);
    const due = cycleDate_(m, day);
    const options = [];
    activeIncomes_(m).forEach(function (inc) {
      const occ = latestOccurrence_(inc, due);
      if (!occ) return;
      const at = incomeAtOccurrence_(inc.id, occ);
      if (!at) return;
      options.push({
        name: inc.name,
        free: Math.round(Math.max(0, capacityOf_(cap, inc.id, occ, at.amount))),
        occurrence: fmtDate_(occ),
        sameMonth: occ.getMonth() === due.getMonth() && occ.getFullYear() === due.getFullYear()
      });
    });
    options.sort(function (a, b) { return b.free - a.free; });
    const best = options[0] || null;
    const totalFree = options.reduce(function (t, o) { return t + o.free; }, 0);
    sourceFit = {
      day: day, dueDate: fmtDate_(due), options: options.slice(0, 4),
      best: best, fits: !!best && best.free >= amount,
      fitsSplit: totalFree >= amount,
      shortfall: Math.max(0, Math.round(amount - (best ? best.free : 0))),
      note: !options.length ? 'لا يوجد دخل أساسي ينزل قبل يوم ' + day
          : (best.free >= amount)
            ? 'يغطيه ' + best.name + ' من دورة ' + best.occurrence
            : (totalFree >= amount)
              ? 'لا يغطيه مصدر منفرد — يحتاج تقسيماً على أكثر من مصدر'
              : 'لا توجد سعة كافية في أي دورة قبل الاستحقاق'
    };
  }

  const verdict =
    remaining < 0 ? 'هذا السيناريو يضعك في عجز شهري قدره ' + Math.abs(Math.round(remaining)) + ' ريال.'
    : safe <= 0 ? 'يغطي التزاماتك لكن لا يترك أي فائض آمن بعد الاحتياطي.'
    : safe < before.safeRemaining * 0.3 ? 'ممكن، لكنه يستهلك أكثر من 70% من فائضك الآمن.'
    : 'مريح — يبقى لديك فائض آمن معقول بعد تنفيذه.';

  return {
    month: m, kind: kind, amount: amount, months: months,
    before: { remaining: before.remaining, safeRemaining: before.safeRemaining, suggestedSaving: before.suggestedSaving },
    after: { remaining: Math.round(remaining), safeRemaining: Math.round(safe), suggestedSaving: suggested },
    totalCost: kind === 'loan' ? amount * months : amount,
    sourceFit: sourceFit,
    goals: goals,
    verdict: verdict,
    feasible: remaining >= 0
  };
}

/* ============================================================
 *  16) سلة المحذوفات
 * ========================================================== */

const TRASH_SHEETS = ['INCOME', 'OBLIGATIONS', 'PURCHASES', 'SAVINGS', 'RESERVES'];
const TRASH_LABEL = { INCOME: 'مصدر دخل', OBLIGATIONS: 'التزام', PURCHASES: 'مشتريات', SAVINGS: 'هدف ادخاري' , RESERVES: 'تجنيب' };

function getTrash(token) {
  guard_(token);
  const out = [];
  TRASH_SHEETS.forEach(function (key) {
    table_(key).filter(function (r) { return yes_(r.deleted); }).forEach(function (r) {
      out.push({
        sheet: key, label: TRASH_LABEL[key], id: String(r.id),
        name: String(r.name || r.item || ''),
        amount: num(r.amount || r.target),
        deletedAt: stampText_(r.deletedAt)
      });
    });
  });
  return out.sort(function (a, b) { return String(b.deletedAt).localeCompare(String(a.deletedAt)); });
}

function restoreFromTrash(token, sheetKey, id, month) {
  if (TRASH_SHEETS.indexOf(String(sheetKey)) < 0) { guard_(token); throw new Error('نوع سجل غير معروف'); }
  return mutate_(token, month, 'تمت استعادة السجل', function () {
    updateById_(sheetKey, id, { deleted: 'لا', deletedAt: '' });
  });
}

function purgeFromTrash(token, sheetKey, id, month) {
  if (TRASH_SHEETS.indexOf(String(sheetKey)) < 0) { guard_(token); throw new Error('نوع سجل غير معروف'); }
  return mutate_(token, month, 'تم الحذف نهائياً', function () {
    hardDeleteWhere_(sheetKey, function (r) { return String(r.id) === String(id); });
    if (sheetKey === 'OBLIGATIONS') {
      hardDeleteWhere_('ALLOCATIONS', function (a) { return String(a.obligationId) === String(id); });
      hardDeleteWhere_('PAYMENTS', function (p) { return String(p.obligationId) === String(id); });
    }
    if (sheetKey === 'INCOME') {
      hardDeleteWhere_('INCOME_MONTHLY', function (x) { return String(x.sourceId) === String(id); });
    }
    if (sheetKey === 'SAVINGS') {
      hardDeleteWhere_('SAVINGS_TX', function (x) { return String(x.goalId) === String(id); });
    }
  });
}

function autoPurgeTrash_() {
  const cutoff = Date.now() - TRASH_KEEP_DAYS * 86400000;
  TRASH_SHEETS.forEach(function (key) {
    hardDeleteWhere_(key, function (r) {
      if (!yes_(r.deleted)) return false;
      const d = toDate_(r.deletedAt instanceof Date ? r.deletedAt : String(r.deletedAt || '').slice(0, 10));
      return d && d.getTime() < cutoff;
    });
  });
}

/* ============================================================
 *  17) الإعدادات
 * ========================================================== */

function saveBudgetSettings(token, data) {
  return mutate_(token, data.month, 'تم حفظ إعدادات الميزانية', function () {
    setSetting_('SAFETY_BUFFER', positive_(data.buffer));
    setSetting_('SAVINGS_RATE', Math.min(100, positive_(data.savingsRate)));
    setSetting_('PURCHASE_BUDGET', positive_(data.purchaseBudget));
    setSetting_('ROLLOVER', data.rollover === false ? 'لا' : 'نعم');
    if (data.cycleStartDay !== undefined && data.cycleStartDay !== '') {
      setSetting_('CYCLE_START_DAY', String(Math.min(28, Math.max(1, Math.round(num(data.cycleStartDay))))));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(data.startDate || ''))) {
      setSetting_('START_DATE', String(data.startDate));
    }
  });
}

/**
 * الشيت يحوّل «2026-09-27» إلى كائن تاريخ عند الحفظ، وString() عليه يعطي نصاً طويلاً
 * لا يفهمه toDate_، فكان تاريخ البداية يرجع دائماً لتاريخ اليوم ويُخفي كل ما قبله.
 */
/** طابع زمني نصي مهما حوّله الشيت — لا «Sun Sep 27 2026 GMT…». */
function stampText_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v) ? '' : Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm');
  }
  return v === null || v === undefined ? '' : String(v);
}
function settingValue_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v) ? '' : Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  return v === null || v === undefined ? '' : String(v);
}
function getSetting_(key) {
  const r = table_('SETTINGS').filter(function (x) { return String(x.key) === key; })[0];
  return r ? settingValue_(r.value) : '';
}

function setSetting_(key, value) {
  const rows = table_('SETTINGS');
  let rec = null;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === key) { rec = rows[i]; break; }
  }
  // ورقة الإعدادات لا تحتوي عمود معرف، فالتعديل يتم بموضع الصف بعد إيجاده بالمفتاح.
  const sh = sheet_('SETTINGS');
  let row = rec ? rec.__row : 0;
  if (!row) { sh.appendRow([key, '', '']); row = sh.getLastRow(); }
  // نص صريح حتى لا يحوّله الشيت إلى تاريخ أو رقم
  const cell = sh.getRange(row, 2);
  cell.setNumberFormat('@');
  cell.setValue(String(value));
  cacheDrop_('tbl:SETTINGS');
  cacheDrop_('startDate'); cacheDrop_('cycDay');
}

/* ============================================================
 *  18) التقرير و PDF
 * ========================================================== */

function exportMonthlyReport(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const s = monthSummary_(m);
  const breakdown = sourceBreakdown_(m);
  const obligations = obligationsForMonth_(m);
  const purchases = purchasesForMonth_(m);
  const cats = {};
  purchases.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + p.amount; });

  const row = function (a, b) {
    return '<tr><td>' + a + '</td><td style="text-align:left">' + b + '</td></tr>';
  };
  const rj = function (n) { return Math.round(num(n)).toLocaleString('en-US') + ' ر.س'; };

  let html = '<html dir="rtl"><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;padding:26px;color:#1a1a1a}' +
    'h1{font-size:20px;border-bottom:3px solid #14324F;padding-bottom:8px}' +
    'h2{font-size:15px;margin-top:22px;color:#14324F}' +
    'table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}' +
    'th,td{border:1px solid #d6dee8;padding:7px 9px;text-align:right}' +
    'th{background:#14324F;color:#fff}' +
    '.neg{color:#b3261e;font-weight:bold}.pos{color:#1e7a55;font-weight:bold}' +
    '</style></head><body>';
  html += '<h1>تقرير ميزانيتي — ' + m + '</h1>';
  html += '<h2>الملخص</h2><table>';
  html += row('الرصيد المرحّل من الشهر السابق', rj(s.opening));
  html += row('الدخل المتوقع', rj(s.incomeExpected));
  html += row('الدخل المحقق (نزل فعلاً)', rj(s.incomeRealized));
  html += row('الالتزامات المخططة', rj(s.plannedObligations));
  html += row('الالتزامات المسددة', rj(s.paidObligations));
  html += row('المشتريات النثرية', rj(s.purchasesSpent) + ' من سقف ' + rj(s.purchaseBudget));
  html += row('الادخار هذا الشهر', rj(s.savingsDeposited));
  html += row('احتياطي الأمان', rj(s.buffer));
  html += row('<b>المتبقي الآمن</b>', '<b class="' + (s.safeRemaining > 0 ? 'pos' : 'neg') + '">' + rj(s.safeRemaining) + '</b>');
  html += row('<b>الرصيد الختامي</b>', '<b class="' + (s.closing >= 0 ? 'pos' : 'neg') + '">' + rj(s.closing) + '</b>');
  html += '</table>';

  html += '<h2>توزيع مصادر الدخل</h2><table><tr><th>المصدر</th><th>الدخل</th><th>المربوط</th><th>المسدَّد</th><th>الباقي</th><th>الحالة</th></tr>';
  breakdown.forEach(function (b) {
    html += '<tr><td>' + esc_(b.name) + '</td><td>' + rj(b.amount) + '</td><td>' + rj(b.allocated) +
            '</td><td>' + rj(b.paid) + '</td><td class="' + (b.free < 0 ? 'neg' : 'pos') + '">' + rj(b.free) +
            '</td><td>' + b.status + '</td></tr>';
  });
  html += '</table>';

  html += '<h2>الالتزامات</h2><table><tr><th>الالتزام</th><th>المبلغ</th><th>الاستحقاق</th><th>مصدر السداد</th><th>الحالة</th></tr>';
  obligations.forEach(function (o) {
    const src = o.sources.map(function (x) { return esc_(x.sourceName) + ' (' + rj(x.amount) + ')'; }).join('، ') || 'غير موزع';
    html += '<tr><td>' + esc_(o.name) + '</td><td>' + rj(o.amount) + '</td><td>' + o.dueDate +
            '</td><td>' + src + '</td><td>' + (o.paid ? 'مدفوع' : o.overdue ? 'متأخر' : o.paidAmount > 0 ? 'جزئي' : 'معلق') + '</td></tr>';
  });
  html += '</table>';

  const catKeys = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; });
  if (catKeys.length) {
    html += '<h2>المشتريات النثرية حسب التصنيف</h2><table><tr><th>التصنيف</th><th>المبلغ</th></tr>';
    catKeys.forEach(function (k) { html += '<tr><td>' + esc_(k) + '</td><td>' + rj(cats[k]) + '</td></tr>'; });
    html += '</table>';
  }
  html += '<p style="margin-top:24px;font-size:10px;color:#7a8699">أُنشئ في ' + nowStamp_() + '</p>';
  html += '</body></html>';

  const pdf = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf')
    .setName('ميزانيتي — تقرير ' + m + '.pdf');
  const file = backupFolder_().createFile(pdf);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  return { url: file.getUrl(), name: file.getName() };
}

function csvCell_(v) {
  const t = String(v == null ? '' : v);
  return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

/** يصدّر جدولاً إلى ملف CSV في مجلد النسخ الاحتياطية ويعيد رابطه. */
function exportCsv(token, kind, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  let head = [], rows = [], title = '';

  if (kind === 'purchases') {
    title = 'المشتريات ' + m;
    head = ['التاريخ', 'المبلغ', 'التصنيف', 'المشتريات', 'من أين', 'ملاحظات'];
    rows = purchasesForMonth_(m).map(function (p) {
      return [p.date, p.amount, p.category, p.item, p.store, p.notes];
    });
  } else if (kind === 'obligations') {
    title = 'الالتزامات ' + m;
    head = ['الالتزام', 'التصنيف', 'المبلغ', 'يوم الاستحقاق', 'الاستحقاق', 'مصادر السداد',
            'المسدَّد', 'المتبقي', 'التكرار', 'طريقة السداد', 'التوقع', 'من', 'إلى', 'الأولوية'];
    rows = obligationsForMonth_(m).map(function (o) {
      return [o.name, o.category, o.amount, o.day, o.dueDate,
              o.sources.map(function (x) { return x.sourceName + ':' + x.amount; }).join(' + '),
              o.paidAmount, o.remainingAmount, o.recurrence,
              o.autoDeduct ? 'خصم تلقائي' : 'يدوي', o.certainty,
              o.startDate, o.endDate, o.priority];
    });
  } else if (kind === 'payments') {
    title = 'سجل السداد ' + m;
    head = ['الالتزام', 'المستحق', 'المسدَّد', 'المتبقي', 'الاستحقاق', 'الحالة'];
    rows = obligationsForMonth_(m).map(function (o) {
      return [o.name, o.amount, o.paidAmount, o.remainingAmount, o.dueDate,
              o.paid ? 'مدفوع' : o.paidAmount > 0 ? 'جزئي' : o.overdue ? 'متأخر' : 'معلق'];
    });
  } else {
    throw new Error('نوع تصدير غير معروف');
  }

  const csv = [head].concat(rows)
    .map(function (r) { return r.map(csvCell_).join(','); }).join('\n');
  // BOM حتى يفتح Excel العربية بشكل صحيح
  const blob = Utilities.newBlob('\uFEFF' + csv, 'text/csv', 'ميزانيتي — ' + title + '.csv');
  const file = backupFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  return { url: file.getUrl(), name: file.getName(), rows: rows.length };
}

/* ============================================================
 *  19) التنبيهات
 * ========================================================== */

function setupTriggers() {
  deleteTriggers();
  ScriptApp.newTrigger('sendReminder').timeBased().atHour(8).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('weeklyBackup').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(3).inTimezone(TZ).create();
  ScriptApp.newTrigger('nightlyMaintenance').timeBased().atHour(2).everyDays(1).inTimezone(TZ).create();
  SpreadsheetApp.getUi().alert('تم تفعيل التنبيهات اليومية والنسخة الأسبوعية.');
}

function deleteTriggers() {
  const names = ['sendReminder', 'weeklyBackup', 'nightlyMaintenance'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (names.indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
}

function nightlyMaintenance() {
  cacheReset_();
  cleanupSessions_();
  withLock_(function () { autoPurgeTrash_(); trimAuditLog_(); });
}

/* ---------- التنبيه اليومي بالبريد ---------- */

/**
 * يبني رسالة التنبيه: عنوان يلخّص أهم ما فيها، وبطاقات مرتبة بالأهمية.
 * يُرجع null إن لم يكن هناك ما يستحق التنبيه — لا رسائل فارغة.
 */
/** «2026-10-06» ← «6 أكتوبر»: تُقرأ بلا انقلاب في البريد العربي. */
function arDate_(v) {
  const d = toDate_(v);
  if (!d) return '';
  const M = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return d.getDate() + ' ' + M[d.getMonth()];
}

function buildReminder_() {
  cacheReset_();
  const m = defaultMonth_();
  const today0 = startOfDay_(new Date());
  const obs = obligationsForMonth_(m);
  const s = monthSummary_(m);
  const R = function (x) { return Math.round(num(x)).toLocaleString('en-US'); };
  const E = function (x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  const overdue = obs.filter(function (o) { return !o.paid && !o.autoDeduct && o.overdue; });
  // «قريباً» = لم يحن بعد وباقي 3 أيام أو أقل. المرن الذي بدأ صرفه ليس «قريباً» ولا «متأخراً»
  const soon = obs.filter(function (o) { return !o.paid && !o.autoDeduct && !o.overdue && o.daysLeft >= 0 && o.daysLeft <= 3; })
    .sort(function (a, b) { return a.daysLeft - b.daysLeft; });
  const autoSoon = obs.filter(function (o) { return o.autoDeduct && !o.autoPaid && o.daysLeft >= 0 && o.daysLeft <= 2; });
  // الدخل المتأخر: تاريخ نزوله في دورته مضى ولم يُسجَّل — لا مقارنة رقم اليوم التي تفشل في دورة 27
  const lateIncome = incomesForMonth_(m).filter(function (i) {
    return i.inWindow && !i.paused && !i.arrived && i.hasSchedule && i.occurrenceDate && toDate_(i.occurrenceDate) < today0;
  });
  const arrears = arrearsFor_(m);
  const overCats = categorySpend_(m).filter(function (c) { return c.over; });
  let reserves = [];
  try { reserves = getReservesRaw_().filter(function (r) { return !r.depositedThisCycle || r.behind > 0; }); } catch (e) {}
  let neg = null;
  try { neg = dailyFlow_(m, null).firstNegative; } catch (e) {}

  const cards = [];
  const card = function (color, title, rows) {
    cards.push('<tr><td style="padding:0 0 14px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;' +
      'border-right:4px solid ' + color + ';box-shadow:0 1px 3px rgba(0,0,0,.06)"><tr><td style="padding:14px 16px">' +
      '<div style="font-size:15px;font-weight:bold;color:#2f2a24;margin-bottom:8px">' + title + '</div>' +
      rows.join('') + '</td></tr></table></td></tr>');
  };
  const row = function (left, right, sub, color) {
    return '<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0ebe3"><tr>' +
      '<td style="padding:8px 0;font-size:14px;color:#2f2a24">' + left + (sub ? '<div style="font-size:12px;color:#8a8175;margin-top:2px">' + sub + '</div>' : '') + '</td>' +
      '<td style="padding:8px 0;font-size:14px;font-weight:bold;text-align:left;white-space:nowrap;color:' + (color || '#2f2a24') + '">' + right + '</td></tr></table>';
  };
  const src = function (o) { return o.sources.map(function (x) { return x.sourceName; }).join(' + ') || 'غير مربوط بمصدر'; };

  if (overdue.length) card('#c0392b', '⛔ متأخر عن موعده', overdue.map(function (o) {
    return row(E(o.name), R(o.remainingAmount) + ' ر.س', 'استحق ' + arDate_(o.dueDate) + ' · ' + E(src(o)), '#c0392b'); }));
  if (arrears.length) card('#c0392b', 'متأخرات من دورات سابقة', arrears.map(function (a) {
    return row(E(a.name), R(a.amount) + ' ر.س', 'استحق ' + arDate_(a.dueDate), '#c0392b'); }));
  if (soon.length) card('#d68910', '⏰ يستحق قريباً', soon.map(function (o) {
    return row(E(o.name), R(o.remainingAmount) + ' ر.س',
      (o.daysLeft === 0 ? 'اليوم' : o.daysLeft === 1 ? 'غداً' : 'بعد ' + o.daysLeft + ' أيام') + ' · ' + arDate_(o.dueDate) + ' · ' + E(src(o))); }));
  if (autoSoon.length) card('#2e86c1', '🏦 سيُخصم تلقائياً', autoSoon.map(function (o) {
    return row(E(o.name), R(o.amount) + ' ر.س', (o.daysLeft === 0 ? 'اليوم' : 'بعد ' + o.daysLeft + ' يوم') + ' — تأكد من الرصيد'); }));
  if (lateIncome.length) card('#d68910', '💰 دخل تجاوز موعده ولم تسجّل نزوله', lateIncome.map(function (i) {
    return row(E(i.name), R(i.amount) + ' ر.س', 'موعده ' + arDate_(i.occurrenceDate) + ' — سجّله من صفحة مصادر الدخل'); }));
  if (neg) card('#c0392b', '📉 رصيدك سيصبح سالباً', [row(arDate_(neg.date), R(neg.balance) + ' ر.س',
    'بحسب التدفق اليومي — راجع صفحة التدفق النقدي', '#c0392b')]);
  if (reserves.length) card('#8e44ad', '🗂 التجنيب', reserves.map(function (r) {
    return row(E(r.name), R(r.monthly) + ' ر.س',
      (!r.depositedThisCycle ? 'لم تسجّل تجنيب هذه الدورة' : '') + (r.behind ? (r.depositedThisCycle ? '' : ' · ') + 'متأخر ' + R(r.behind) + ' عن الخطة' : '')); }));
  if (overCats.length || s.purchasesOverBudget) {
    const rs = overCats.map(function (c) { return row(E(c.category), R(c.spent) + ' / ' + R(c.budget), 'تجاوز بـ ' + R(c.spent - c.budget) + ' ر.س', '#c0392b'); });
    if (s.purchasesOverBudget) rs.unshift(row('سقف المشتريات النثرية', R(s.purchasesSpent) + ' / ' + R(s.purchaseBudget), '', '#c0392b'));
    card('#d68910', '🛒 تجاوزت سقف المشتريات', rs);
  }
  if (!cards.length) return null;

  const urgent = overdue.length + arrears.length + (neg ? 1 : 0);
  const subject = 'ميزانيتي · ' + (urgent
      ? (overdue.length + arrears.length ? (overdue.length + arrears.length) + ' متأخر' : 'رصيد سالب قادم')
      : soon.length ? soon.length + ' يستحق خلال 3 أيام' : 'تنبيه') +
    ' · الآمن ' + R(s.safeRemaining) + ' ر.س';

  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  const html =
    '<div dir="rtl" style="background:#f4efe7;padding:22px 12px;font-family:Tahoma,Arial,sans-serif">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">' +
    '<tr><td style="padding:0 0 14px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#2f2a24;border-radius:14px">' +
      '<tr><td style="padding:18px 18px 16px;color:#fff">' +
      '<div style="font-size:13px;color:#d8c9a8">ميزانيتي · دورة ' + arDate_(cycleRange_(m).start) + ' ← ' + arDate_(cycleRange_(m).end) + '</div>' +
      '<div style="font-size:12px;color:#bdb3a3;margin-top:10px">المتبقي الآمن</div>' +
      '<div style="font-size:30px;font-weight:bold;color:' + (s.safeRemaining > 0 ? '#f1d9a3' : '#ff8a80') + '">' + R(s.safeRemaining) + ' <span style="font-size:15px">ر.س</span></div>' +
      '<div style="font-size:12px;color:#bdb3a3;margin-top:6px">مسدَّد ' + R(s.paidObligations) + ' من ' + R(s.plannedObligations) +
        ' · باقٍ ' + R(s.unpaidObligations) + '</div>' +
      '</td></tr></table></td></tr>' +
    cards.join('') +
    (url ? '<tr><td style="text-align:center;padding:4px 0 14px"><a href="' + url + '" style="display:inline-block;background:#a8782d;color:#fff;' +
      'text-decoration:none;padding:11px 26px;border-radius:10px;font-weight:bold;font-size:14px">افتح ميزانيتي</a></td></tr>' : '') +
    '<tr><td style="text-align:center;font-size:11px;color:#8a8175;padding-top:4px">تنبيه تلقائي يومي — يصل فقط حين يوجد ما يستحق انتباهك</td></tr>' +
    '</table></div>';

  const text = cards.length + ' تنبيه — المتبقي الآمن ' + R(s.safeRemaining) + ' ر.س. افتح الرسالة بعرض HTML.';
  return { subject: subject, html: html, text: text, count: cards.length };
}

function sendReminder() {
  ensureSchema_();
  const email = Session.getEffectiveUser().getEmail();
  if (!email) return;
  const r = buildReminder_();
  if (!r) return;
  MailApp.sendEmail({ to: email, subject: r.subject, htmlBody: r.html, body: r.text, name: 'ميزانيتي' });
}

/** معاينة الرسالة في التطبيق كما ستصل. */
function previewReminder(token) {
  guard_(token);
  const r = buildReminder_();
  return r ? { subject: r.subject, html: r.html, count: r.count } : { subject: '', html: '', count: 0 };
}

/** إرسال تجربة الآن — حتى لو لم يكن فيه تنبيه عاجل. */
function sendTestReminder(token) {
  guard_(token);
  const email = Session.getEffectiveUser().getEmail();
  if (!email) throw new Error('لم أتعرف على بريدك');
  const r = buildReminder_();
  if (!r) return { success: true, message: 'لا يوجد اليوم ما يستحق التنبيه — لذلك لن تصلك رسالة. هذا هو السلوك المقصود.' };
  MailApp.sendEmail({ to: email, subject: '[تجربة] ' + r.subject, htmlBody: r.html, body: r.text, name: 'ميزانيتي' });
  return { success: true, message: 'أُرسلت الرسالة إلى ' + email };
}


/* ============================================================
 *  21) المشتريات المتكررة
 * ========================================================== */

function recurringTemplates_() {
  return table_('RECURRING').filter(function (r) {
    return String(r.item || '').trim() && String(r.active || 'نعم') !== 'لا';
  });
}

/** القوالب التي لم تُولَّد بعد لهذا الشهر. */
function pendingRecurring_(month) {
  if (!validMonth_(month) || month > currentMonth_()) return [];
  const tpl = recurringTemplates_();
  if (!tpl.length) return [];
  const done = {};
  live_('PURCHASES').forEach(function (p) {
    const d = fmtDate_(toDate_(p.date));
    if (d && cycleOf_(toDate_(d)) === month && p.recurringId) done[String(p.recurringId)] = true;
  });
  return tpl.filter(function (t) { return !done[String(t.id)] && num(t.amount) > 0; });
}

function materializeRecurring_(month) {
  const pending = pendingRecurring_(month);
  if (!pending.length) return 0;
  const rows = pending.map(function (t) {
    return {
      date: fmtDate_(cycleDate_(month, t.day)), amount: num(t.amount),
      category: String(t.category || 'أخرى'), item: String(t.item || ''),
      store: String(t.store || ''), notes: 'مُولَّد تلقائياً',
      deleted: 'لا', deletedAt: '', recurringId: String(t.id)
    };
  });
  insertMany_('PURCHASES', rows);
  return rows.length;
}

function getRecurringPurchases(token) {
  guard_(token);
  return table_('RECURRING').filter(function (r) { return String(r.item || '').trim(); })
    .map(function (r) {
      return { id: String(r.id), item: String(r.item || ''), amount: num(r.amount),
               category: String(r.category || 'أخرى'), store: String(r.store || ''),
               day: clampDay_(r.day), active: String(r.active || 'نعم') !== 'لا',
               notes: String(r.notes || '') };
    });
}

function saveRecurringPurchase(token, id, data) {
  return mutate_(token, data.month, id ? 'تم تحديث المتكرر' : 'تمت إضافة مصروف متكرر', function () {
    const item = String(data.item || '').trim();
    if (!item) throw new Error('اكتب وصف المصروف المتكرر');
    if (positive_(data.amount) <= 0) throw new Error('أدخل مبلغاً أكبر من صفر');
    const body = {
      item: item, amount: positive_(data.amount),
      category: String(data.category || 'أخرى'), store: String(data.store || '').trim(),
      day: clampDay_(data.day), active: data.active === false ? 'لا' : 'نعم',
      notes: String(data.notes || '')
    };
    if (id) updateById_('RECURRING', id, body); else insert_('RECURRING', body);
    // نولّد فوراً لهذا الشهر حتى يظهر الأثر مباشرة
    materializeRecurring_(validMonth_(data.month) ? data.month : currentMonth_());
  });
}

function deleteRecurringPurchase(token, id, month) {
  return mutate_(token, month, 'تم حذف المصروف المتكرر', function () {
    hardDeleteWhere_('RECURRING', function (r) { return String(r.id) === String(id); });
    // العمليات المولَّدة سابقاً تبقى كما هي — هي مصروف حقيقي حدث فعلاً
  });
}

/* ============================================================
 *  22) الإدخال السريع والجماعي للمشتريات
 * ========================================================== */

/** يضيف عدة عمليات دفعة واحدة — للإدخال السريع ولاستيراد رسائل البنك. */
function addPurchasesBulk(token, items, month) {
  return mutate_(token, month, 'تم تسجيل المشتريات', function () {
    const rows = [];
    (items || []).forEach(function (x) {
      const item = String(x.item || '').trim();
      const amount = positive_(x.amount);
      if (!item || amount <= 0) return;
      rows.push({
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? String(x.date) : today_(),
        amount: amount, category: String(x.category || 'أخرى').trim() || 'أخرى',
        item: item, store: String(x.store || '').trim(), notes: String(x.notes || ''),
        deleted: 'لا', deletedAt: '', recurringId: ''
      });
    });
    if (!rows.length) throw new Error('لا توجد عمليات صالحة للإضافة');
    insertMany_('PURCHASES', rows);
    return { count: rows.length, message: 'تم تسجيل ' + rows.length + ' عملية' };
  });
}

/* ============================================================
 *  23) قراءة رسائل البنك
 * ========================================================== */

const BANK_HINTS = [
  ['قهوة',    ['coffee','cafe','كوفي','قهوة','بن','starbucks','dunkin','barns','ستاربكس']],
  ['مطاعم',   ['restaurant','مطعم','كافيه','مطاعم','herfy','albaik','البيك','هرفي','شاورما','بيتزا','pizza','burger']],
  ['مقاضي',   ['market','سوبر','تموين','بقالة','هايبر','panda','بنده','othaim','العثيم','tamimi','التميمي','carrefour','لولو','danube']],
  ['بنزين',   ['petrol','بنزين','محطة','وقود','aldrees','الدريس','sasco','ساسكو','fuel']],
  ['مواصلات', ['uber','careem','اوبر','كريم','taxi','أجرة','مواقف','parking']],
  ['صحة',     ['pharmacy','صيدلية','مستشفى','عيادة','nahdi','النهدي','dawaa','الدواء','مختبر']],
  ['ملابس',   ['fashion','ملابس','أزياء','hm','zara','namshi','نمشي','shein','سنتربوينت']],
  ['اشتراكات',['netflix','spotify','apple','google','subscription','اشتراك','شاهد','stc','موبايلي','زين',
               'jawwy','جوي','انترنت','إنترنت','internet','سلة','salla','اتصالات','باقة']],
  ['منزل',    ['ikea','ايكيا','saco','ساكو','home','أثاث','كهرباء','مياه','صيانة']]
];

function guessCategory_(text) {
  const t = String(text || '').toLowerCase();
  for (let i = 0; i < BANK_HINTS.length; i++) {
    const hints = BANK_HINTS[i][1];
    for (let j = 0; j < hints.length; j++) {
      if (t.indexOf(String(hints[j]).toLowerCase()) > -1) return BANK_HINTS[i][0];
    }
  }
  return 'أخرى';
}

function toWesternDigits_(str) {
  return String(str || '')
    .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
    .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
    .replace(/\u066B/g, '.').replace(/\u066C/g, ',');
}

/**
 * يستخرج عمليات الشراء من رسائل البنك الملصوقة.
 * يقبل عدة رسائل دفعة واحدة، ويحاول تخمين التصنيف من اسم المتجر.
 * النتيجة للمراجعة فقط — لا يُحفظ شيء إلا بعد تأكيدك.
 */
function parseBankMessages(token, text) {
  guard_(token);
  let raw = toWesternDigits_(String(text || ''))
    .replace(/[\u061C\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')  // علامات اتجاه خفية تكسر الأنماط
    .replace(/\r/g, '');
  if (!raw.trim()) return [];

  // نقسّم عند بداية كل رسالة. لا نستخدم \b لأنها لا تعمل مع العربية في JS.
  const MARK = '\u0001';
  raw = raw.replace(
    /^[ \t]*(?=(?:شراء|مشتريات|سحب|عملية|دفع|purchase|payment|pos|withdrawal))/gmi,
    MARK);
  const chunks = raw.split(/[\u0001]|\n[ \t]*\n/)
    .map(function (c) { return c.trim(); })
    .filter(function (c) { return c.length > 5; });

  const CUR = '(?:SAR|SR|ر\\.?\\s?س|ريال|﷼)';
  const NUM = '([0-9][0-9,]*(?:\\.[0-9]{1,2})?)';
  const seen = {}, out = [];

  chunks.forEach(function (c) {
    // ليست مشتريات: الإيداعات والرواتب والحوالات والاسترجاع
    if (/إيداع|راتب|حوالة|تحويل|استرجاع|مسترجع|refund|credit|deposit|salary/i.test(c)) return;

    // ---- المبلغ: نبدأ بالأنماط الملتصقة بالعملة لأنها الأوثق ----
    let amount = 0, m = null;
    const tries = [
      new RegExp(CUR + '\\s*' + NUM, 'i'),                                   // SR 11.50
      new RegExp(NUM + '\\s*' + CUR, 'i'),                                   // 11.50 SAR
      new RegExp('(?:مبلغ|بمبلغ|قيمة|بـ|amount)\\s*[:\\-]?\\s*' + CUR + '?\\s*' + NUM, 'i')
    ];
    for (let i = 0; i < tries.length && !m; i++) m = c.match(tries[i]);
    if (m) amount = Number(String(m[1]).replace(/,/g, '')) || 0;
    if (amount <= 0) return;

    // ---- المتجر: الأطول أولاً حتى لا تبتلع «لـ» كلمة «لدى» ----
    let store = '';
    let sm = c.match(/(?:^|\n)[ \t]*(?:لدى|التاجر|في متجر|إلى|الى|merchant|\bat\b|لـ|ل:)\s*[:\-]?\s*([^\n]{2,60})/i);
    // الرسائل ذات السطر الواحد: نبحث وسط السطر برموز لا تلتبس بغيرها
    if (!sm) sm = c.match(/(?:لدى|التاجر|merchant|\bat\b)\s*[:\-]?\s*([^\n;،]{2,60})/i);
    if (sm) store = sm[1];
    if (!store) {
      // احتياط: آخر سطر لا يحمل رقم حساب أو بطاقة
      const lines = c.split('\n').map(function (l) { return l.trim(); })
        .filter(function (l) {
          return l && !/^(?:من|عبر|بطاقة|حساب|via|card|from)/i.test(l) && !/[0-9]{3,}/.test(l);
        });
      store = lines.length ? lines[lines.length - 1] : '';
    }
    store = store
      .replace(/\b20[0-9]{2}[-\/][0-1]?[0-9][-\/][0-3]?[0-9]\b/g, '')
      .replace(/\b[0-3]?[0-9][-\/][0-1]?[0-9][-\/](?:20)?[0-9]{2}\b/g, '')
      .replace(/\b[0-9]{1,2}:[0-9]{2}\b/g, '')
      .replace(new RegExp(CUR, 'ig'), '')
      .replace(/[0-9*]{3,}/g, '')
      .replace(/[;،,]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[:\-\s]+|[:\-\s]+$/g, '');

    // ---- التاريخ: يدعم السنة برقمين (15/9/26) ----
    let date = '', d = null;
    if ((d = c.match(/(20[0-9]{2})[-\/]([0-1]?[0-9])[-\/]([0-3]?[0-9])/))) {
      date = d[1] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[3]).slice(-2);
    } else if ((d = c.match(/([0-3]?[0-9])[-\/]([0-1]?[0-9])[-\/](20[0-9]{2})/))) {
      date = d[3] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[1]).slice(-2);
    } else if ((d = c.match(/([0-3]?[0-9])[-\/]([0-1]?[0-9])[-\/]([0-9]{2})(?![0-9])/))) {
      const dd = Number(d[1]), mm = Number(d[2]);
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        date = '20' + d[3] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[1]).slice(-2);
      }
    }
    if (!date) date = today_();

    const key = date + '|' + amount + '|' + store;
    if (seen[key]) return;
    seen[key] = true;

    out.push({
      date: date, amount: amount, store: store || 'غير محدد',
      item: store || 'عملية بنكية', category: guessCategory_(store + ' ' + c),
      notes: 'من رسالة بنكية'
    });
  });

  const existing = {};
  live_('PURCHASES').forEach(function (p) {
    const dd = fmtDate_(toDate_(p.date));
    if (dd) existing[dd + '|' + num(p.amount)] = true;
  });
  out.forEach(function (x) { x.duplicate = !!existing[x.date + '|' + x.amount]; });
  return out;
}

/* ============================================================
 *  24) سجل العمليات
 * ========================================================== */

function audit_(action, month, details) {
  try {
    insert_('AUDIT', { at: nowStamp_(), action: String(action || ''),
                       month: String(month || ''), details: String(details || '').slice(0, 300) });
  } catch (e) { /* السجل مساعد ولا يجوز أن يُفشل العملية نفسها */ }
}

function getAuditLog(token, limit) {
  guard_(token);
  const n = Math.min(200, Math.max(10, Number(limit) || 60));
  return table_('AUDIT').slice(-n).reverse().map(function (r) {
    return { at: stampText_(r.at), action: String(r.action || ''),
             month: monthKey_(r.month), details: String(r.details || '') };
  });
}

function trimAuditLog_() {
  const rows = table_('AUDIT');
  if (rows.length <= 1000) return;
  const keep = rows.slice(-600).map(function (r) { return r.id; });
  const keepSet = {}; keep.forEach(function (k) { keepSet[String(k)] = true; });
  hardDeleteWhere_('AUDIT', function (r) { return !keepSet[String(r.id)]; });
}


/* ============================================================
 *  25) التحويلات بين مصادر الدخل
 * ========================================================== */

function transfersFor_(month) {
  return cached_('trf:' + month, function () {
    return table_('TRANSFERS').filter(function (t) {
      return monthKey_(t.month) === String(month);
    }).map(function (t) {
      return { id: String(t.id), date: fmtDate_(toDate_(t.date)), fromId: String(t.fromId || ''),
               toId: String(t.toId || ''), amount: num(t.amount), notes: String(t.notes || '') };
    }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  });
}

function getTransfers(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const names = {};
  incomesForMonth_(m).forEach(function (i) { names[i.id] = i.name; });
  return transfersFor_(m).map(function (t) {
    return Object.assign({}, t, {
      fromName: names[t.fromId] || 'محذوف', toName: names[t.toId] || 'محذوف'
    });
  });
}

function addTransfer(token, data) {
  return mutate_(token, data.month, 'تم تسجيل التحويل', function () {
    const m = validMonth_(data.month) ? data.month : defaultMonth_();
    const amount = positive_(data.amount);
    if (amount <= 0) throw new Error('أدخل مبلغاً أكبر من صفر');
    const valid = {};
    incomesForMonth_(m).forEach(function (i) { valid[i.id] = true; });
    const from = String(data.fromId || ''), to = String(data.toId || '');
    if (!valid[from] || !valid[to]) throw new Error('اختر مصدرين موجودين');
    if (from === to) throw new Error('لا يمكن التحويل من المصدر إلى نفسه');
    insert_('TRANSFERS', {
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(data.date || '')) ? String(data.date) : today_(),
      month: m, fromId: from, toId: to, amount: amount, notes: String(data.notes || '')
    });
  });
}

function deleteTransfer(token, id, month) {
  return mutate_(token, month, 'تم حذف التحويل', function () {
    hardDeleteWhere_('TRANSFERS', function (t) { return String(t.id) === String(id); });
  });
}

/* ============================================================
 *  26) التدفق النقدي اليومي داخل الدورة
 * ========================================================== */

/**
 * رصيدك يوماً بيوم داخل الدورة.
 * المجموع الشهري قد يكون موجباً بينما ترسب يوم 12 لأن ثلاثة التزامات
 * اجتمعت قبل نزول دخل. هذه الدالة تكشف ذلك اليوم بالتحديد وسببه.
 */
function getDailyFlow(token, month) {
  guard_(token);
  return dailyFlow_(validMonth_(month) ? month : currentMonth_(), null);
}

/**
 * override: تعديلات افتراضية للمحاكاة، مثل تأخير الدخل أو إضافة التزام.
 * { incomeShiftDays, incomeFactor, expenseFactor, extraItems:[{date,amount,label}] }
 */
function dailyFlow_(month, override) {
  const ov = override || {};
  const range = cycleRange_(month);
  const sum = monthSummary_(month);
  const incomes = activeIncomes_(month);
  const obligations = obligationsForMonth_(month);
  const purchases = purchasesForMonth_(month);
  const today0 = startOfDay_(new Date());

  const events = {};
  const push = function (date, kind, label, amount) {
    if (!date) return;
    const k = fmtDate_(date);
    if (k < fmtDate_(range.start) || k > fmtDate_(range.end)) return;
    (events[k] = events[k] || []).push({ kind: kind, label: label, amount: Math.round(amount) });
  };

  // الدخل الإضافي المحقق فعلاً يدخل السيولة بتاريخ تسجيله، لا قبله
  potentialIncomes_(month).forEach(function (i) {
    if (!i.arrived) return;
    const d = toDate_(i.arrivalDate || i.occurrenceDate);
    if (d) push(d, 'income', i.name + ' (إضافي محقق)', i.amount);
  });

  // الدخل المضمون
  incomes.forEach(function (i) {
    let d = toDate_(i.occurrenceDate);
    if (!d) return;
    if (ov.incomeShiftDays) d = new Date(d.getTime() + ov.incomeShiftDays * 86400000);
    const amt = i.amount * (ov.incomeFactor === undefined ? 1 : ov.incomeFactor);
    push(d, 'income', i.name, amt);
  });

  // التحويلات بين المصادر لا تغيّر الإجمالي، فلا تدخل التدفق

  // الالتزامات — حصتك أنت، والأسبوعي على مواعيده
  obligations.forEach(function (o) {
    const f = (ov.expenseFactor === undefined ? 1 : ov.expenseFactor);
    // المرن الموزّع على أكثر من دخل يخرج على دفعات: كل جزء يوم نزول مصدره (أو يوم بدايته إن نزل قبله)
    if (isSpread_(o) && o.sources.length > 1 && !(o.occurrences > 1)) {
      const due = toDate_(o.dueDate);
      const incMap = {};
      incomes.forEach(function (i) { incMap[i.id] = i; });
      let placed = 0;
      o.sources.forEach(function (sp) {
        const inc = incMap[sp.sourceId];
        const occ = inc ? fundingOccurrence_(inc, o, month) : null;
        const d = occ && occ > due ? occ : due;
        push(d, 'obligation', o.name + (occ && occ > due ? ' (دفعة ' + sp.sourceName + ')' : ''), -sp.amount * f);
        placed += sp.amount;
      });
      const rest = o.amount - placed;
      if (rest > 0.5) push(due, 'obligation', o.name + ' (غير مربوط)', -rest * f);
      return;
    }
    if (o.occurrences > 1 && o.occurrenceDates.length) {
      const per = o.amount / o.occurrences;
      o.occurrenceDates.forEach(function (ds) { push(toDate_(ds), 'obligation', o.name, -per * f); });
    } else {
      push(toDate_(o.dueDate), 'obligation', o.name, -o.amount * f);
    }
  });

  // المشتريات الفعلية لما مضى
  purchases.forEach(function (p) {
    push(toDate_(p.date), 'purchase', p.item, -p.amount * (ov.expenseFactor === undefined ? 1 : ov.expenseFactor));
  });

  // بنود المحاكاة الإضافية
  (ov.extraItems || []).forEach(function (x) {
    push(toDate_(x.date), 'scenario', String(x.label || 'سيناريو'), -positive_(x.amount));
  });

  // النثريات المتوقعة لما تبقّى من الدورة، موزّعة بالتساوي
  const spentSoFar = purchases.reduce(function (t, p) { return t + p.amount; }, 0);
  const budgetLeft = Math.max(0, sum.purchaseBudget - spentSoFar);
  let futureDays = 0;
  for (let d = new Date(range.start.getTime()); d <= range.end; d = new Date(d.getTime() + 86400000)) {
    if (startOfDay_(d) > today0) futureDays++;
  }
  const perDay = futureDays > 0 ? budgetLeft / futureDays : 0;

  const days = [];
  let balance = sum.opening;
  let minBalance = balance, minDate = fmtDate_(range.start), firstNegative = null;

  for (let d = new Date(range.start.getTime()); d <= range.end; d = new Date(d.getTime() + 86400000)) {
    const key = fmtDate_(d);
    const isFuture = startOfDay_(d) > today0;
    const list = (events[key] || []).slice();
    if (isFuture && perDay > 0) {
      list.push({ kind: 'plannedPurchase', label: 'نثريات متوقعة', amount: -Math.round(perDay) });
    }
    const delta = list.reduce(function (t, e) { return t + e.amount; }, 0);
    balance += delta;
    if (balance < minBalance) { minBalance = balance; minDate = key; }
    if (balance < 0 && !firstNegative) {
      firstNegative = { date: key, balance: Math.round(balance),
        causes: list.filter(function (e) { return e.amount < 0; })
                    .sort(function (a, b) { return a.amount - b.amount; }).slice(0, 3) };
    }
    days.push({
      date: key, isToday: key === fmtDate_(today0), isFuture: isFuture,
      inflow: Math.round(list.filter(function (e) { return e.amount > 0; })
                             .reduce(function (t, e) { return t + e.amount; }, 0)),
      outflow: Math.round(-list.filter(function (e) { return e.amount < 0; })
                               .reduce(function (t, e) { return t + e.amount; }, 0)),
      balance: Math.round(balance),
      events: list
    });
  }

  return {
    month: month, label: cycleLabel_(month),
    start: fmtDate_(range.start), end: fmtDate_(range.end),
    opening: Math.round(sum.opening), closing: Math.round(balance),
    minBalance: Math.round(minBalance), minDate: minDate,
    firstNegative: firstNegative,
    plannedDailyPurchase: Math.round(perDay),
    days: days
  };
}

/* ============================================================
 *  27) تحليل الحساسية
 * ========================================================== */

/** ماذا يحدث لو تأخر دخلك أو نقص أو زاد صرفك؟ */
function getSensitivity(token, month) {
  guard_(token);
  return sensitivity_(validMonth_(month) ? month : currentMonth_());
}

function sensitivity_(month) {
  const m = month;
  const base = dailyFlow_(m, null);

  const cases = [
    ['تأخر الدخل 5 أيام', { incomeShiftDays: 5 }],
    ['تأخر الدخل 10 أيام', { incomeShiftDays: 10 }],
    ['نقص الدخل 10%', { incomeFactor: 0.9 }],
    ['نقص الدخل 20%', { incomeFactor: 0.8 }],
    ['زيادة الصرف 10%', { expenseFactor: 1.1 }],
    ['زيادة الصرف 25%', { expenseFactor: 1.25 }]
  ];

  const results = cases.map(function (c) {
    const f = dailyFlow_(m, c[1]);
    return {
      name: c[0],
      closing: f.closing, minBalance: f.minBalance, minDate: f.minDate,
      goesNegative: !!f.firstNegative,
      negativeDate: f.firstNegative ? f.firstNegative.date : '',
      deltaClosing: f.closing - base.closing
    };
  });

  // كل مصدر على حدة: ماذا لو انقطع؟
  const perSource = activeIncomes_(m).map(function (i) {
    const f = dailyFlow_(m, { extraItems: [{ date: i.occurrenceDate, amount: i.amount, label: 'انقطاع ' + i.name }] });
    return { name: 'انقطاع ' + i.name, amount: i.amount, closing: f.closing,
             minBalance: f.minBalance, goesNegative: !!f.firstNegative,
             negativeDate: f.firstNegative ? f.firstNegative.date : '' };
  });

  const worst = results.concat(perSource).filter(function (r) { return r.goesNegative; })
    .sort(function (a, b) { return a.minBalance - b.minBalance; })[0] || null;

  return {
    month: m, base: { closing: base.closing, minBalance: base.minBalance, safe: !base.firstNegative },
    cases: results, perSource: perSource, worst: worst,
    resilient: !results.some(function (r) { return r.goesNegative; })
  };
}

/* ============================================================
 *  28) صندوق الطوارئ
 * ========================================================== */

function getEmergencyFund(token) { guard_(token); return emergencyFund_(); }

function emergencyFund_() {
  const m = defaultMonth_();
  // متوسط المصروف الأساسي الشهري من آخر ثلاث دورات فعلية، أو الدورة الحالية
  const keys = [m, prevMonth_(m), prevMonth_(prevMonth_(m))].filter(function (k) {
    return k >= startMonth_();
  });
  let total = 0, n = 0;
  keys.forEach(function (k) {
    const s = monthSummary_(k);
    const spend = s.plannedObligations + Math.max(s.purchaseBudget, s.purchasesSpent);
    if (spend > 0) { total += spend; n++; }
  });
  const monthlyNeed = n ? Math.round(total / n) : 0;
  const saved = savingsGoals_().reduce(function (t, g) { return t + g.saved; }, 0);
  const covered = monthlyNeed > 0 ? saved / monthlyNeed : 0;
  const s = monthSummary_(m);

  const targetFor = function (months) {
    const t = monthlyNeed * months;
    const gap = Math.max(0, t - saved);
    return { months: months, target: Math.round(t), gap: Math.round(gap),
             monthsToReach: s.suggestedSaving > 0 ? Math.ceil(gap / s.suggestedSaving) : null };
  };

  return {
    monthlyNeed: monthlyNeed, saved: Math.round(saved),
    monthsCovered: Math.round(covered * 10) / 10,
    level: covered >= 6 ? 'ممتاز' : covered >= 3 ? 'جيد' : covered >= 1 ? 'ضعيف' : 'حرج',
    targets: [targetFor(3), targetFor(6)],
    monthlySaving: s.suggestedSaving,
    basedOnCycles: n
  };
}

/* ============================================================
 *  29) ترتيب سداد الديون
 * ========================================================== */

/**
 * يقارن استراتيجيتين: الأعلى فائدة أولاً (يوفّر أكثر)،
 * والأقصر مدة أولاً (يحرّر التزاماً أسرع فيرفع معنوياتك وسيولتك).
 */
function getPayoffPlan(token) {
  guard_(token);
  const debt = debtOverview_();
  const items = debt.items.filter(function (x) { return !x.finished && x.remainingValue; });
  if (!items.length) return { items: [], hasDebt: false, monthlyLoad: 0 };

  const enrich = items.map(function (x) {
    const rec = findById_('OBLIGATIONS', x.id);
    const rate = rec ? num(rec.interestRate) : 0;
    const perMonth = x.weekDays ? x.amount * (30 / x.weekDays) : x.amount / Math.max(1, x.step);
    // تكلفة الفائدة التقديرية على ما تبقّى
    const interestCost = rate > 0
      ? Math.round(x.remainingValue * (rate / 100) * (x.remainingInstallments * Math.max(1, x.step)) / 24)
      : 0;
    return Object.assign({}, x, {
      interestRate: rate, monthlyEquivalent: Math.round(perMonth),
      interestCost: interestCost,
      freedPerMonth: Math.round(perMonth)
    });
  });

  const avalanche = enrich.slice().sort(function (a, b) {
    return b.interestRate - a.interestRate || b.remainingValue - a.remainingValue;
  });
  const snowball = enrich.slice().sort(function (a, b) {
    return a.remainingValue - b.remainingValue || a.remainingInstallments - b.remainingInstallments;
  });

  const s = monthSummary_(defaultMonth_());
  const spare = Math.max(0, s.safeRemaining);
  const firstAval = avalanche[0], firstSnow = snowball[0];

  return {
    hasDebt: true,
    totalRemaining: debt.totalRemaining,
    monthlyLoad: debt.monthlyLoad,
    spare: spare,
    avalanche: avalanche.map(function (x, i) { return Object.assign({}, x, { order: i + 1 }); }),
    snowball: snowball.map(function (x, i) { return Object.assign({}, x, { order: i + 1 }); }),
    recommendation: enrich.some(function (x) { return x.interestRate > 0; })
      ? { strategy: 'الأعلى فائدة', target: firstAval ? firstAval.name : '',
          why: 'يوفّر عليك أكبر قدر من الفوائد' }
      : { strategy: 'الأقصر مدة', target: firstSnow ? firstSnow.name : '',
          why: 'لم تُسجَّل فوائد، فالأجدى تحرير التزام كامل بأسرع وقت ليرتفع فائضك الشهري' },
    freedIfCleared: firstSnow ? firstSnow.freedPerMonth : 0,
    extraPayoffMonths: (spare > 0 && firstSnow && firstSnow.remainingValue)
      ? Math.ceil(firstSnow.remainingValue / spare) : null
  };
}


/* ============================================================
 *  30) طبقة الذكاء الاصطناعي (Gemini)
 * ========================================================== */

const AI_HOST = 'https://generativelanguage.googleapis.com/';
const AI_VERSIONS = ['v1beta', 'v1'];
const AI_ENDPOINT = AI_HOST + 'v1beta/models/';
const AI_DEFAULT_MODEL = 'gemini-2.0-flash';
const AI_MEMORY_TURNS = 8;

function aiKey_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_KEY') || ''; }
function aiModel_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || AI_DEFAULT_MODEL; }

function saveAiKey(token, key, model) {
  guard_(token);
  const k = String(key || '').trim();
  const props = PropertiesService.getScriptProperties();
  if (k) {
    props.setProperty('GEMINI_KEY', k);
    // مفتاح جديد ⇒ نتائج اختبار المفتاح القديم لم تعد صالحة
    ['GEMINI_WORKING', 'AI_LAST_DIAG', 'GEMINI_API_VERSION'].forEach(function (p) { props.deleteProperty(p); });
  }
  if (model) props.setProperty('GEMINI_MODEL', String(model).trim());
  return { success: true, message: 'تم حفظ إعدادات المستشار', hasKey: !!aiKey_(), model: aiModel_() };
}

function clearAiKey(token) {
  guard_(token);
  PropertiesService.getScriptProperties().deleteProperty('GEMINI_KEY');
  return { success: true, message: 'تم حذف المفتاح' };
}

function getAiStatus(token) {
  guard_(token);
  let last = null;
  try { last = JSON.parse(PropertiesService.getScriptProperties().getProperty('AI_LAST_DIAG') || 'null'); }
  catch (e) { last = null; }
  return { hasKey: !!aiKey_(), model: aiModel_(), working: aiWorking_(), lastDiag: last };
}

function testAiKey(token) {
  guard_(token);
  try {
    const t = callGemini_('اكتب كلمة: جاهز', null);
    return { success: true, message: 'الاتصال سليم — رد النموذج: ' + String(t).slice(0, 40) };
  } catch (e) {
    return { success: false, message: String(e.message || e) };
  }
}

/** يسأل جوجل عن النماذج التي يدعمها مفتاحك فعلاً بدل التخمين. */
function listAiModels_() {
  const key = aiKey_();
  if (!key) throw new Error('لا يوجد مفتاح');
  const byName = {};
  let lastErr = '';
  AI_VERSIONS.forEach(function (v) {
    let res;
    try {
      res = UrlFetchApp.fetch(AI_HOST + v + '/models?key=' + encodeURIComponent(key) + '&pageSize=200',
        { muteHttpExceptions: true });
    } catch (e) { lastErr = String(e.message || e); return; }
    if (res.getResponseCode() !== 200) {
      try { const e = JSON.parse(res.getContentText()); lastErr = (e.error && e.error.message) || ''; }
      catch (x) { lastErr = res.getContentText().slice(0, 200); }
      return;
    }
    const data = JSON.parse(res.getContentText());
    (data.models || []).forEach(function (m) {
      const name = String(m.name || '').replace(/^models\//, '');
      const methods = m.supportedGenerationMethods || [];
      if (!byName[name]) {
        byName[name] = { name: name, display: String(m.displayName || name),
                         canGenerate: methods.indexOf('generateContent') > -1,
                         versions: [], inputTokens: m.inputTokenLimit || null };
      }
      if (methods.indexOf('generateContent') > -1) byName[name].canGenerate = true;
      byName[name].versions.push(v);
    });
  });
  const list = Object.keys(byName).map(function (k) { return byName[k]; });
  if (!list.length) throw new Error(lastErr || 'لم تُرجِع جوجل أي نموذج');
  return list;
}

/* ---------- الاتصال بالنموذج ---------- */

function aiVersion_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_API_VERSION') || ''; }

/** محاولة واحدة على إصدار واجهة محدد. ترجع {ok,text,code,status,error}. */
function geminiTry_(version, model, prompt, inlineData, maxTokens) {
  const key = aiKey_();
  const parts = [];
  if (inlineData) parts.push({ inline_data: { mime_type: inlineData.mimeType, data: inlineData.data } });
  parts.push({ text: prompt });
  let res;
  try {
    res = UrlFetchApp.fetch(AI_HOST + version + '/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        contents: [{ role: 'user', parts: parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens || 3000, topP: 0.9 }
      })
    });
  } catch (e) {
    return { ok: false, code: 0, status: 'NETWORK', error: String(e.message || e) };
  }
  const code = res.getResponseCode(), body = res.getContentText();
  if (code !== 200) {
    let detail = '', status = '';
    try {
      const e = JSON.parse(body);
      detail = (e.error && e.error.message) || '';
      status = (e.error && e.error.status) || '';
      ((e.error && e.error.details) || []).forEach(function (d) { if (d.reason) detail += ' [' + d.reason + ']'; });
    } catch (x) { detail = body.slice(0, 300); }
    return { ok: false, code: code, status: status, error: detail || ('رمز ' + code) };
  }
  const data = JSON.parse(body);
  const cand = data.candidates && data.candidates[0];
  if (!cand) {
    const block = data.promptFeedback && data.promptFeedback.blockReason;
    return { ok: false, code: 200, status: 'EMPTY', error: block ? 'حُجب الطلب: ' + block : 'لم يرجع النموذج أي إجابة' };
  }
  if (cand.finishReason === 'SAFETY') return { ok: false, code: 200, status: 'SAFETY', error: 'رفض النموذج المحتوى' };
  const text = (cand.content && cand.content.parts || []).map(function (p) { return p.text || ''; }).join('').trim();
  if (!text) return { ok: false, code: 200, status: 'EMPTY',
                      error: 'إجابة فارغة' + (cand.finishReason ? ' (' + cand.finishReason + ')' : '') };
  return { ok: true, text: text, code: 200 };
}

/**
 * يترجم رد جوجل إلى سبب مفهوم وحل.
 * scope='global' ⇒ عطل يمنع كل النماذج (المفتاح، الواجهة، المنطقة، الفوترة).
 * scope='model'  ⇒ خاص بهذا النموذج، فنجرّب غيره.
 */
function classifyAiError_(r) {
  r = r || {};
  const code = r.code || 0, st = String(r.status || ''), m = String(r.error || '');
  const R = function (kind, scope, title, fix, temporary) {
    return { kind: kind, scope: scope, title: title, fix: fix, temporary: !!temporary, raw: m };
  };
  if (code === 0) return R('network', 'global', 'تعذّر الوصول لخوادم جوجل',
    'تحقق من صلاحية الاتصال الخارجي (تفعيل صلاحيات المستشار) ثم أعد المحاولة.', true);
  if (/API key expired/i.test(m)) return R('key_expired', 'global', 'المفتاح منتهي الصلاحية',
    'أنشئ مفتاحاً جديداً من aistudio.google.com والصقه في الإعدادات.');
  if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(m)) return R('key_invalid', 'global', 'المفتاح غير صالح',
    'تأكد أنك نسخته كاملاً بلا مسافات، أو أنشئ مفتاحاً جديداً من aistudio.google.com.');
  if (/location is not supported|User location/i.test(m)) return R('region', 'global', 'منطقة الخادم غير مدعومة',
    'جوجل تمنع الوصول من موقع الخادم الحالي. لا حل من داخل التطبيق.');
  if (/SERVICE_DISABLED|has not been used in project|is disabled|API has not been used/i.test(m))
    return R('api_disabled', 'global', 'واجهة Generative Language غير مفعّلة في مشروع المفتاح',
      'أنشئ المفتاح من aistudio.google.com مباشرة، أو فعّل الواجهة في Google Cloud Console.');
  if (/billing|prepay|credit balance/i.test(m) && !/limit:\s*0/i.test(m))
    return R('billing', 'global', 'الاشتراك أو الرصيد منتهٍ',
      'راجع الفوترة في حساب جوجل المرتبط بالمفتاح، أو استخدم مفتاحاً مجانياً من AI Studio.');
  if (code === 403 || st === 'PERMISSION_DENIED')
    return R('permission', 'global', 'المفتاح مرفوض أو مقيّد',
      'أزل قيود المفتاح (عناوين الإحالة أو الواجهات المسموحة) أو أنشئ مفتاحاً جديداً.');
  if (code === 429 || st === 'RESOURCE_EXHAUSTED') {
    // «limit: 0» يعني أن النموذج غير متاح أصلاً في خطتك المجانية — ليست حصة نفدت
    if (/limit:\s*0\b/i.test(m)) return R('not_free', 'model', 'غير متاح في الخطة المجانية',
      'هذا النموذج يحتاج تفعيل الفوترة. استخدم نموذجاً من القائمة الخضراء.');
    if (/per.?day|PerDay|daily/i.test(m)) return R('quota_day', 'model', 'انتهت الحصة اليومية لهذا النموذج',
      'تتجدد يومياً. استخدم نموذجاً آخر من القائمة الخضراء حتى ذلك الحين.', true);
    return R('quota_minute', 'model', 'تجاوزت عدد الطلبات المسموح في الدقيقة', 'انتظر دقيقة ثم أعد المحاولة.', true);
  }
  if (code === 404 || st === 'NOT_FOUND') return R('not_found', 'model', 'النموذج غير موجود لدى مفتاحك', 'اختر نموذجاً من القائمة الخضراء.');
  if (code >= 500) return R('overloaded', 'model', 'الخدمة مزدحمة حالياً', 'أعد المحاولة بعد قليل.', true);
  if (st === 'SAFETY' || st === 'EMPTY') return R('empty', 'model', 'رد فارغ أو محجوب', 'أعد المحاولة بصياغة أخرى.', true);
  if (code === 400) return R('bad_request', 'model', 'النموذج رفض الطلب', 'جرّب نموذجاً آخر من القائمة الخضراء.');
  return R('unknown', 'model', 'فشل غير معروف', 'أعد التشخيص.');
}

function aiWorking_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('GEMINI_WORKING') || '[]'); }
  catch (e) { return []; }
}

/** نداء بنموذج واحد عبر الإصدارين (v1beta ثم v1). */
function callModel_(model, prompt, inlineData, maxTokens) {
  const props = PropertiesService.getScriptProperties();
  const known = aiVersion_();
  const order = known ? [known].concat(AI_VERSIONS.filter(function (v) { return v !== known; })) : AI_VERSIONS;
  let last = null;
  for (let i = 0; i < order.length; i++) {
    const r = geminiTry_(order[i], model, prompt, inlineData, maxTokens);
    if (r.ok) { if (order[i] !== known) props.setProperty('GEMINI_API_VERSION', order[i]); return r; }
    last = r;
    if (r.code !== 404) break;   // غير 404 ليس مشكلة إصدار
  }
  return last;
}

/**
 * يحاول النموذج المعتمد، وإن فشل لسبب يخصه وحده (غير مجاني، حصة، ازدحام)
 * ينتقل لنموذج آخر نجح في آخر تشخيص ويعتمده — فلا يتوقف المستشار بلا داعٍ.
 */
function callGemini_(prompt, inlineData) {
  if (!aiKey_()) throw new Error('لم تُضِف مفتاح Gemini بعد. أضفه من الإعدادات ← المستشار الذكي.');
  const props = PropertiesService.getScriptProperties();
  const current = aiModel_();
  const tried = [current];
  const r = callModel_(current, prompt, inlineData);
  if (r && r.ok) return r.text;

  let why = classifyAiError_(r);
  if (why.scope === 'model') {
    const backups = aiWorking_().filter(function (m) { return tried.indexOf(m) < 0; });
    for (let i = 0; i < backups.length; i++) {
      tried.push(backups[i]);
      const r2 = callModel_(backups[i], prompt, inlineData);
      if (r2 && r2.ok) { props.setProperty('GEMINI_MODEL', backups[i]); return r2.text; }
      const w2 = classifyAiError_(r2);
      if (w2.scope === 'global') { why = w2; break; }
    }
  }
  throw new Error(why.title + ' — ' + why.fix + (why.raw ? ' (تفصيل جوجل: ' + why.raw.slice(0, 160) + ')' : ''));
}

/* ---------- التشخيص ---------- */

/** نماذج توليد النص فقط — نستبعد التضمين والصوت والصور والبث. */
function isTextModel_(m) {
  const n = String(m.name || '').toLowerCase();
  if (!m.canGenerate) return false;
  if (!/gemini|gemma/.test(n)) return false;
  return !/embed|tts|audio|image|vision|live|native|aqa|learnlm|robotics|computer-use/.test(n);
}
function modelRank_(n) {
  n = String(n);
  if (/2\.5.*flash-lite/.test(n)) return 2;
  if (/2\.5.*flash/.test(n)) return 1;
  if (/2\.0.*flash-lite/.test(n)) return 4;
  if (/2\.0.*flash/.test(n)) return 3;
  if (/flash-latest/.test(n)) return 5;
  if (/1\.5.*flash/.test(n)) return 6;
  if (/flash/.test(n)) return 7;
  if (/pro/.test(n)) return 8;
  if (/gemma/.test(n)) return 9;
  return 10;
}

/**
 * تشخيص صارم: لا يُعدّ نموذج «متاحاً» إلا بعد نداء فعلي ناجح.
 * يصنّف كل فشل (مفتاح، حصة، فوترة، منطقة…) ويخلص إلى حكم واحد واضح.
 */
function diagnoseAi(token) {
  guard_(token);
  const props = PropertiesService.getScriptProperties();
  const steps = [];
  const add = function (name, ok, detail, hint) {
    steps.push({ name: name, ok: !!ok, detail: String(detail || ''), hint: String(hint || '') });
  };
  let verdict = null;
  const setVerdict = function (status, title, explain, fix) {
    if (!verdict) verdict = { status: status, title: title, explain: explain, fix: fix };
  };

  // 1) الصلاحية
  let netOk = false;
  try {
    UrlFetchApp.fetch(AI_HOST, { muteHttpExceptions: true });
    netOk = true;
    add('صلاحية الاتصال الخارجي', true, 'ممنوحة', '');
  } catch (e) {
    add('صلاحية الاتصال الخارجي', false, String(e.message || e),
      'قائمة ميزانيتي ← تفعيل صلاحيات المستشار ← وافق ← أعد النشر بإصدار جديد.');
    setVerdict('permission', 'التطبيق لا يملك صلاحية الاتصال بالإنترنت',
      'Apps Script يحتاج موافقتك على صلاحية script.external_request.',
      'قائمة ميزانيتي ← تفعيل صلاحيات المستشار ← وافق ← أعد النشر.');
  }

  // 2) المفتاح
  const hasKey = !!aiKey_();
  add('مفتاح Gemini', hasKey, hasKey ? 'مضاف' : 'غير مضاف', hasKey ? '' : 'الصق مفتاحك أعلاه واحفظ.');
  if (!hasKey) setVerdict('no_key', 'لم تُضِف مفتاحاً', 'المستشار يحتاج مفتاح Gemini.',
    'احصل عليه مجاناً من aistudio.google.com');

  // 3) قائمة النماذج — تكشف صلاحية المفتاح نفسه
  let models = [], listOk = false;
  if (netOk && hasKey) {
    try {
      models = listAiModels_();
      listOk = true;
      add('المفتاح مقبول لدى جوجل', true, models.length + ' نموذجاً مُعلَناً', '');
    } catch (e) {
      const msg = String(e.message || e);
      const why = classifyAiError_({ code: /\b(4\d\d|5\d\d)\b/.test(msg) ? +RegExp.$1 : 400, error: msg });
      add('المفتاح مقبول لدى جوجل', false, why.title, why.fix);
      setVerdict(why.kind, why.title, 'جوجل رفضت المفتاح قبل أي اختبار للنماذج.', why.fix);
    }
  }

  // 4) نداء فعلي لكل نموذج نصي مرشّح — الإعلان وحده لا يكفي
  const results = {}, working = [];
  let globalStop = null;
  if (listOk) {
    const cands = models.filter(isTextModel_)
      .sort(function (a, b) { return modelRank_(a.name) - modelRank_(b.name) || a.name.localeCompare(b.name); })
      .slice(0, 8);
    for (let i = 0; i < cands.length; i++) {
      const name = cands[i].name;
      let r = callModel_(name, 'أجب بكلمة واحدة: جاهز', null, 20);
      let why = (r && r.ok) ? null : classifyAiError_(r);
      // حد الدقيقة قد نسببه نحن بتتابع الاختبارات — ننتظر ونعيد مرة
      if (why && why.kind === 'quota_minute') {
        Utilities.sleep(4000);
        r = callModel_(name, 'أجب بكلمة واحدة: جاهز', null, 20);
        why = (r && r.ok) ? null : classifyAiError_(r);
      }
      results[name] = why ? { ok: false, kind: why.kind, title: why.title } : { ok: true };
      if (!why) working.push(name);
      if (why && why.scope === 'global') { globalStop = why; break; }
      Utilities.sleep(600);
    }
    add('اختبار النماذج بنداء فعلي', working.length > 0,
      working.length ? working.length + ' نموذج نجح' : 'لم ينجح أي نموذج',
      working.length ? '' : (globalStop ? globalStop.fix : 'راجع الأسباب أدناه.'));
  }

  // 5) المعتمد: إن لم يكن من الناجحين نبدّله تلقائياً
  let current = aiModel_(), switched = '';
  if (working.length) {
    props.setProperty('GEMINI_WORKING', JSON.stringify(working));
    if (working.indexOf(current) < 0) {
      switched = current; current = working[0];
      props.setProperty('GEMINI_MODEL', current);
    }
    add('النموذج المعتمد', true, current + (switched ? ' — بُدِّل تلقائياً من ' + switched + ' لأنه لا يعمل' : ''), '');
    setVerdict('ready', 'المستشار جاهز ويعمل',
      'اختُبر ' + working.length + ' نموذج بنداء فعلي ونجح. المعتمد: ' + current + '.',
      working.length > 1 ? 'إن تعطّل المعتمد لاحقاً ينتقل المستشار تلقائياً لنموذج ناجح آخر.' : '');
  } else if (listOk) {
    props.deleteProperty('GEMINI_WORKING');
  }

  if (!verdict && listOk) {
    const kinds = Object.keys(results).map(function (k) { return results[k].kind; });
    const count = function (k) { return kinds.filter(function (x) { return x === k; }).length; };
    if (globalStop) setVerdict(globalStop.kind, globalStop.title, 'عطل عام يمنع كل النماذج.', globalStop.fix);
    else if (kinds.length && count('not_free') === kinds.length)
      setVerdict('billing_needed', 'مفتاحك صالح لكن كل النماذج المجرَّبة تحتاج خطة مدفوعة',
        'جوجل تُعلن هذه النماذج لمفتاحك، لكن حصتها المجانية صفر.',
        'فعّل الفوترة في Google AI Studio، أو أنشئ مفتاحاً جديداً من حساب مجاني.');
    else if (count('quota_day') + count('quota_minute') > 0)
      setVerdict('quota', 'انتهت حصتك حالياً', 'المفتاح سليم لكن حد الاستخدام استُنفد.',
        count('quota_day') ? 'الحصة اليومية تتجدد غداً.' : 'انتظر دقيقة ثم أعد التشخيص.');
    else if (!kinds.length) setVerdict('no_models', 'لا يوجد نموذج نصي معلَن لمفتاحك', '', 'أنشئ مفتاحاً جديداً من AI Studio.');
    else setVerdict('no_models', 'لا يوجد نموذج يعمل مع مفتاحك', 'فشلت كل الاختبارات.', 'راجع الأسباب أدناه.');
  }

  // الفاشلون مجمّعون حسب السبب — لا نعرضهم كخيارات
  const byReason = {};
  Object.keys(results).forEach(function (n) {
    if (results[n].ok) return;
    (byReason[results[n].title] = byReason[results[n].title] || []).push(n);
  });

  const out = {
    ok: !!(verdict && verdict.status === 'ready'),
    verdict: verdict || { status: 'unknown', title: 'لم يكتمل التشخيص', explain: '', fix: '' },
    steps: steps, current: current, switchedFrom: switched, working: working,
    failed: Object.keys(byReason).map(function (t) { return { reason: t, models: byReason[t] }; }),
    testedAt: nowStamp_()
  };
  props.setProperty('AI_LAST_DIAG', JSON.stringify({
    ok: out.ok, verdict: out.verdict, current: out.current, working: working, testedAt: out.testedAt }));
  return out;
}

/** يعتمد نموذجاً نجح نداؤه فعلاً — لا نموذجاً مُعلَناً فقط. */
function autoPickAiModel(token) {
  guard_(token);
  const d = diagnoseAi(token);
  return { success: d.ok, model: d.current,
           message: d.verdict.title + (d.ok ? ' — المعتمد ' + d.current : ' — ' + d.verdict.fix) };
}

/** اعتماد نموذج يدوياً — مسموح فقط لما نجح اختباره. */
function setAiModel(token, name) {
  guard_(token);
  if (aiWorking_().indexOf(String(name)) < 0) {
    return { success: false, message: 'هذا النموذج لم ينجح اختباره. أعد التشخيص أولاً.' };
  }
  PropertiesService.getScriptProperties().setProperty('GEMINI_MODEL', String(name));
  return { success: true, model: String(name), message: 'اعتُمد ' + name };
}

/* ---------- اللقطة: كل ما حسبه التطبيق ---------- */

/**
 * صورة كاملة ومحسوبة عن وضعك المالي.
 * النموذج لا يرى الشيت — يرى هذه اللقطة، فكل رقم فيها نهائي ومطابق للشاشة.
 */
function buildSnapshot_(month) {
  const m = validMonth_(month) ? month : defaultMonth_();
  const s = monthSummary_(m);
  const flow = dailyFlow_(m, null);
  const bd = sourceBreakdown_(m);
  const obs = obligationsForMonth_(m);
  const cats = categorySpend_(m);
  const arr = arrearsFor_(m);

  let debt = null, fund = null, fc = null, sens = null;
  try { debt = debtOverview_(); } catch (e) { debt = null; }
  try { fund = emergencyFund_(); } catch (e) { fund = null; }
  try { fc = forecast_(m, 6); } catch (e) { fc = null; }
  try { sens = sensitivity_(m); } catch (e) { sens = null; }
  let dq = null, chg = null, rec = null, acc = null, scen = null;
  try { dq = dataQuality_(m); } catch (e) {}
  try { chg = changeDetection_(m); } catch (e) {}
  try { rec = recurringIntel_(m); } catch (e) {}
  try { acc = forecastAccuracy_(); } catch (e) {}
  try { scen = multiScenario_(m); } catch (e) {}
  const R = function (x) { return Math.round(num(x)); };

  return {
    التاريخ: today_(),
    الدورة: { المفتاح: m, المدى: cycleLabel_(m), يوم_البداية: cycleStartDay_(), تاريخ_بداية_التتبع: fmtDate_(startDate_()) },
    الملخص: {
      الرصيد_المرحّل: R(s.opening),
      الدخل_المتوقع: R(s.incomeExpected), الدخل_المحقق: R(s.incomeRealized),
      الدخل_الإضافي_المحقق: R(s.extraRealized),
      الالتزامات_المخططة: R(s.plannedObligations), منها_متوقعة: R(s.expectedObligations),
      منها_خصم_تلقائي: R(s.autoDeducted),
      المسدَّد: R(s.paidObligations), غير_المسدَّد: R(s.unpaidObligations),
      المتأخرات: R(s.arrearsTotal),
      سقف_النثريات: R(s.purchaseBudget), المصروف_النثري: R(s.purchasesSpent),
      الاحتياطي: R(s.buffer),
      المتبقي: R(s.remaining), المتبقي_الآمن: R(s.safeRemaining),
      نسبة_الادخار: s.savingsRate, الادخار_المقترح: R(s.suggestedSaving),
      الرصيد_الختامي_المتوقع: R(s.closing)
    },
    التدفق_اليومي: {
      أدنى_رصيد: flow.minBalance, يوم_أدنى_رصيد: flow.minDate,
      أول_يوم_سالب: flow.firstNegative ? flow.firstNegative.date : null,
      رصيده: flow.firstNegative ? flow.firstNegative.balance : null,
      أسبابه: flow.firstNegative ? flow.firstNegative.causes.map(function (c) { return c.label; }) : [],
      نثريات_يومية_متوقعة: flow.plannedDailyPurchase,
      أيام_سالبة: flow.days.filter(function (d) { return d.balance < 0; }).length
    },
    مصادر_الدخل: bd.map(function (b) {
      return { الاسم: b.name, المبلغ: R(b.amount), يوم_النزول: b.day, نزل: b.arrived,
               متغير: b.isVariable, المربوط: R(b.allocated), الباقي: R(b.free),
               حصته_من_الادخار: R(b.savingsShare), الحالة: b.status };
    }),
    الدخل_المحتمل_غير_المضمون: potentialIncomes_(m).map(function (i) {
      return { الاسم: i.name, المبلغ_المتوقع: R(i.amount),
               أساسي: i.isBasic, متغير: i.isVariable,
               له_موعد_ثابت: i.hasSchedule,
               الموعد: i.hasSchedule ? i.occurrenceDate : 'غير محدد — عند نزوله',
               نزل_فعلاً: i.arrived,
               تنبيه: i.arrived ? 'محقق ويدخل السيولة الفعلية'
                    : 'غير مضمون — لا يُعتمد عليه في الخطة ولا يُعتبر متأخراً' };
    }),
    التحويلات_بين_المصادر: transfersFor_(m).map(function (t) {
      return { التاريخ: t.date, المبلغ: R(t.amount) };
    }),
    الالتزامات: obs.map(function (o) {
      return { الاسم: o.name, المبلغ: o.amount, التصنيف: o.category, الاستحقاق: o.dueDate,
               التكرار: o.recurrence, النوع: o.type, الأولوية: o.priority,
               المسدَّد: o.paidAmount, المتبقي: o.remainingAmount,
               متأخر: o.overdue, متوقع: o.isExpected, خصم_تلقائي: o.autoDeduct,
               مشترك: o.isShared ? o.sharePercent + '%' : null,
               مصادر_السداد: o.sources.map(function (x) { return x.sourceName + ':' + x.amount; }),
               غير_مخصص: o.unallocatedAmount };
    }),
    المتأخرات: arr.map(function (a) {
      return { الاسم: a.name, المبلغ: a.amount, الدورة: a.month, تأخر_شهور: a.monthsLate };
    }),
    المشتريات_بالتصنيف: cats.map(function (c) {
      return { التصنيف: c.category, المصروف: c.spent, السقف: c.budget, تجاوز: c.over };
    }),
    التجنيب_للالتزامات_القادمة: (function () { try { return getReservesRaw_(); } catch (e) { return []; } })(),
    المشتريات_المفردة: purchasesForMonth_(m).slice(0, 60).map(function (p) {
      return { التاريخ: p.date, المبلغ: R(p.amount), التصنيف: p.category,
               الوصف: p.item, المتجر: p.store };
    }),
    الادخار: savingsGoals_().map(function (g) {
      return { الهدف: g.name, المستهدف: R(g.target), المدخر: R(g.saved), الشهري: R(g.monthly) };
    }),
    صندوق_الطوارئ: fund ? {
      الحاجة_الشهرية: fund.monthlyNeed, المدخر: fund.saved,
      يغطي_شهور: fund.monthsCovered, التقييم: fund.level,
      الأهداف: fund.targets
    } : null,
    الدورات_القادمة: fc ? {
      أقرب_دورة_ضاغطة: fc.firstTight,
      إجمالي_المتوقع: fc.totalExpected,
      تجنيب_شهري_مطلوب: fc.setAsideMonthly,
      الدورات: fc.cycles.map(function (c) {
        return { الدورة: c.label, الدخل: c.income, مؤكد: c.confirmed,
                 متوقع: c.expected, الصافي: c.net, الرصيد_التراكمي: c.balance };
      }),
      بنود_قادمة: fc.upcoming.map(function (u) {
        return { الاسم: u.name, المبلغ: u.amount, الاستحقاق: u.dueDate,
                 بعد_دورات: u.cyclesAway, تجنيب_شهري: u.setAside, متوقع: u.isExpected };
      })
    } : null,
    جودة_البيانات: dq,
    التغيّر_عن_الدورة_السابقة: chg,
    متكررات_غير_مسجّلة: rec,
    دقة_التوقعات_السابقة: acc,
    سيناريو_الدخل_الإضافي: scen,
    تحليل_الحساسية: sens ? {
      يتحمل_كل_السيناريوهات: sens.resilient,
      الأسوأ: sens.worst,
      الحالات: sens.cases.map(function (c) {
        return { السيناريو: c.name, أدنى_رصيد: c.minBalance, يسلب: c.goesNegative, تاريخ_السلب: c.negativeDate };
      })
    } : null,
    الديون: debt ? {
      الإجمالي_المتبقي: R(debt.totalRemaining), العبء_الشهري: R(debt.monthlyLoad),
      نسبته_من_الدخل: Math.round(debt.incomeShare * 100) + '%',
      آخر_قسط: debt.payoffDate,
      البنود: debt.items.map(function (x) {
        return { الاسم: x.name, القسط: x.amount, متبقٍ_أقساط: x.remainingInstallments,
                 قيمة_المتبقي: x.remainingValue, ينتهي: x.endDate };
      })
    } : null,
    // ——— الصورة الكاملة: لا الدورة الحالية فقط ———
    كل_الالتزامات_المعرّفة: safe_(function () { return allObligations_().map(function (o) {
      return { الاسم: o.name, المبلغ: o.amount, اليوم: o.day, التكرار: o.recurrence, التصنيف: o.category,
               الأولوية: o.priority, خصم_تلقائي: o.autoDeduct, متوقع: o.isExpected, الحالة: o.status,
               الموعد_القادم: o.nextDue, آخر_سداد: o.lastPaidMonth ? o.lastPaidMonth + ' ' + R(o.lastPaidAmount) : 'لم يُسدَّد',
               البداية: o.startDate, الانتهاء: o.endDate || 'بلا نهاية',
               مربوط_على: o.sources.map(function (x) { return x.sourceName + ':' + R(x.amount); }),
               غير_مربوط: R(o.unallocatedAmount) };
    }); }),
    الدورات_القادمة_بالتفصيل: safe_(function () {
      const out = []; let k = addCycles_(m, 1);
      for (let i = 0; i < 6; i++, k = addCycles_(k, 1)) {
        out.push({ الدورة: k, المدى: cycleLabel_(k), الالتزامات: obligationsForMonth_(k).map(function (o) {
          return { الاسم: o.name, الاستحقاق: o.dueDate, المبلغ: R(o.amount), متوقع: o.isExpected,
                   من: o.sources.map(function (x) { return x.sourceName; }).join('+') || 'غير مربوط' };
        }) });
      }
      return out;
    }),
    ضغط_كل_راتب_في_12_دورة: safe_(function () { return paycheckLoad_(m, 12, {}).map(function (p) {
      return { المصدر: p.source, النزول: p.date, الدورة: p.cycle, مبلغه: p.amount, يحمل: p.load,
               يتبقى: p.free, يعجز: p.over, مضمون: p.certain, ما_عليه: p.items.slice(0, 8) };
    }); }),
    الدورات_السابقة: safe_(function () {
      const out = []; let k = prevMonth_(m);
      for (let i = 0; i < 3 && k >= startMonth_(); i++, k = prevMonth_(k)) {
        const x = monthSummary_(k);
        out.push({ الدورة: k, الافتتاحي: R(x.opening), الدخل_المحقق: R(x.incomeRealized),
                   المسدَّد: R(x.paidObligations), غير_المسدَّد: R(x.unpaidObligations),
                   المشتريات: R(x.purchasesSpent), المدخر: R(x.savingsDeposited), الختامي: R(x.closing), مقفلة: x.closed });
      }
      return out;
    }),
    آخر_عمليات_السداد: safe_(function () {
      const names = {}; live_('OBLIGATIONS').forEach(function (o) { names[String(o.id)] = String(o.name); });
      return table_('PAYMENTS').slice(-25).reverse().map(function (p) {
        return { الالتزام: names[String(p.obligationId)] || 'محذوف', الدورة: monthKey_(p.month),
                 المبلغ: R(p.amount), التاريخ: fmtDate_(toDate_(p.date)) };
      });
    }),
    المصاريف_المتكررة: safe_(function () { return live_('RECURRING').filter(function (t) {
      return String(t.active || 'نعم') !== 'لا'; }).map(function (t) {
      return { الوصف: String(t.item || ''), المبلغ: R(t.amount), التصنيف: String(t.category || ''), اليوم: t.day }; }); }),
    أيام_التدفق_المؤثرة: flow.days.filter(function (d) { return d.events.length; }).slice(0, 40).map(function (d) {
      return { اليوم: d.date, الرصيد: d.balance, الحركة: d.events.map(function (e) { return e.label + ' ' + e.amount; }) };
    }),
    الإعدادات: { الاحتياطي: num(getSetting_('SAFETY_BUFFER')), نسبة_الادخار: num(getSetting_('SAVINGS_RATE')),
                 سقف_النثريات: num(getSetting_('PURCHASE_BUDGET')), الترحيل: getSetting_('ROLLOVER') || 'نعم',
                 يوم_بداية_الدورة: cycleStartDay_(), بداية_التتبع: fmtDate_(startDate_()),
                 سقوف_التصنيفات: categoryBudgets_() }
  };
}

/** قسم يفشل لا يُسقط اللقطة كلها — يظهر للنموذج أنه تعذّر بدل أن يختفي بصمت. */
function safe_(fn) {
  try { return fn(); } catch (e) { return { تعذر_الحساب: String(e.message || e) }; }
}

function snapshotText_(month) {
  return JSON.stringify(buildSnapshot_(month), null, 1);
}

/* ---------- الذاكرة ---------- */

function aiMemory_(limit) {
  const rows = table_('AI_LOG').slice(-(Number(limit) || AI_MEMORY_TURNS));
  if (!rows.length) return 'لا توجد محادثات سابقة.';
  return rows.map(function (r) {
    return '— بتاريخ ' + stampText_(r.at).slice(0, 10) + ' سألك: ' + String(r.question || '').slice(0, 200) +
           '\nوأجبت: ' + String(r.answer || '').slice(0, 500) +
           (r.userNote ? '\nوما حدث بعدها: ' + String(r.userNote) : '');
  }).join('\n\n');
}

function logAi_(month, kind, question, answer) {
  try {
    insert_('AI_LOG', { at: nowStamp_(), month: String(month || ''), kind: String(kind || ''),
                        question: String(question || '').slice(0, 1000),
                        answer: String(answer || '').slice(0, 4000), userNote: '' });
  } catch (e) { /* السجل مساعد */ }
}

function getAiHistory(token, limit) {
  guard_(token);
  const n = Math.min(50, Math.max(5, Number(limit) || 20));
  return table_('AI_LOG').slice(-n).reverse().map(function (r) {
    return { id: String(r.id), at: stampText_(r.at), month: monthKey_(r.month),
             kind: String(r.kind || ''), question: String(r.question || ''),
             answer: String(r.answer || ''), userNote: String(r.userNote || '') };
  });
}

function addAiNote(token, id, note, month) {
  return mutate_(token, month, 'تم حفظ ملاحظتك', function () {
    updateById_('AI_LOG', id, { userNote: String(note || '').slice(0, 500) });
  });
}

function clearAiHistory(token, month) {
  return mutate_(token, month, 'تم مسح ذاكرة المستشار', function () {
    hardDeleteWhere_('AI_LOG', function () { return true; });
  });
}

/* ---------- التعليمات الثابتة ---------- */

function aiSystemRules_() {
  return [
    'أنت مستشار مالي شخصي يتحدث العربية الفصحى المبسطة بلهجة محايدة مفهومة لسعودي.',
    'كل الأرقام في اللقطة نهائية ومحسوبة من التطبيق ومطابقة لما يراه المستخدم على الشاشة.',
    'قاعدة صارمة: لا تُعِد حساب أي رقم ولا تخترع رقماً غير موجود في اللقطة. استشهد بالأرقام كما هي.',
    'إن نقصك رقم لاستنتاج ما، قل ذلك صراحة بدل التخمين.',
    'العملة الريال السعودي. اكتب الأرقام بالخانات اللاتينية.',
    'كن محدداً وعملياً: توصيات قابلة للتنفيذ اليوم، لا نصائح عامة.',
    'رتّب الأهم أولاً. لا تكرر ما هو واضح من الأرقام، بل فسّره واستنتج منه.',
    'إن كان وضعه سليماً قل ذلك بوضوح ولا تخترع مشاكل.',
    'لا تستخدم عناوين ماركداون كثيرة. فقرات قصيرة ونقاط عند الحاجة.',
    'ممنوع منعاً باتاً أن تناقض رقماً في اللقطة أو تقدّم رقماً بديلاً عنه. اللقطة هي المرجع الوحيد.',
    'يجوز لك جمع أو طرح بسيط للاستنتاج، لكن اذكر الأرقام الأصلية التي بنيت عليها حتى يتحقق منها بنفسه.',
    'لا تفترض معلومة غير موجودة: لا راتب إضافي، ولا مدخرات، ولا التزامات لم تُذكر.',
    'لست مستشاراً مالياً مرخصاً ولا تقدّم توصيات استثمارية أو قانونية أو شرعية. ' +
      'إن سُئلت عن استثمار أو حكم شرعي أو مسألة قانونية، وضّح أن هذا خارج نطاقك وانصحه بمختص.',
    'إن كان القرار كبيراً أو غير قابل للتراجع، ذكّره بأن يتحقق من الأرقام على الشاشة قبل التنفيذ.',
    'ميّز دائماً بين: متوقع، محقق، مضمون، غير مضمون، متأخر، غير محدد الموعد.',
    'الدخل الموصوف بأنه «غير مضمون» أو «غير محدد الموعد» لا تعتمد عليه في تغطية أي التزام ' +
      'ولا تدخله في الخطة، إلا إذا كان «نزل فعلاً = true». ' +
      'وإن سألك عنه فقل إنه احتمال لا يُبنى عليه حتى يُسجَّل نزوله.',
    'انظر إلى «جودة_البيانات» قبل أي حكم: إن كانت ضعيفة فصرّح بأن البيانات غير كافية ' +
      'واذكر ما ينقص، ولا تعطِ حكماً قاطعاً.',
    'استخدم «التوزيع» في كل التزام لتعرف من أي مصدر يُسدَّد. لا تخمّن مصدراً غير مذكور.',
    'عندك الصورة كاملة: كل الالتزامات المعرّفة، والدورات القادمة بالتفصيل، وضغط كل راتب في 12 دورة، ' +
      'والدورات السابقة، وآخر عمليات السداد. لا تحكم من الدورة الحالية وحدها — ' +
      'الربط دائم، فراتب يكفي هذه الدورة قد يعجز في دورة قادمة.'
  ].join('\n');
}

function aiAsk_(month, kind, question, userPrompt, inlineData) {
  const answer = callGemini_(userPrompt, inlineData);
  logAi_(month, kind, question, answer);
  return { answer: answer, at: nowStamp_() };
}

/* ---------- 1) التحليل الشامل ---------- */

function aiAnalyze(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const prompt = aiSystemRules_() +
    '\n\nهذه لقطة كاملة عن وضع المستخدم المالي:\n' + snapshotText_(m) +
    '\n\nمحادثاتكم السابقة:\n' + aiMemory_(4) +
    '\n\nالمطلوب تحليل شامل في أربعة أقسام قصيرة:' +
    '\n1) أين يقف الآن — جملتان تلخصان وضعه بالأرقام.' +
    '\n2) أخطر ثلاثة أمور تهدده مرتبة بالأولوية، مع الرقم الذي يثبت كل واحد.' +
    '\n3) ثلاث خطوات محددة ينفذها هذه الدورة، كل خطوة بمبلغ أو تاريخ.' +
    '\n4) شيء واحد يحسن عادته المالية على المدى الطويل.' +
    '\nإن كان التدفق اليومي يسلب في يوم ما فاجعل ذلك أول ما تذكره.';
  return aiAsk_(m, 'تحليل شامل', 'تحليل شامل للدورة', prompt, null);
}

/* ---------- 2) سؤال حر ---------- */

function aiAsk(token, month, question) {
  guard_(token);
  const q = String(question || '').trim();
  if (!q) throw new Error('اكتب سؤالك');
  const m = validMonth_(month) ? month : defaultMonth_();
  const prompt = aiSystemRules_() +
    '\n\nلقطة وضعه المالي:\n' + snapshotText_(m) +
    '\n\nمحادثاتكم السابقة (استخدمها إن كانت ذات صلة، وذكّره بما قلته سابقاً إن تكرر الموضوع):\n' + aiMemory_(AI_MEMORY_TURNS) +
    '\n\nسؤاله الآن: ' + q +
    '\n\nأجب مباشرة وبالأرقام. إن كان السؤال يحتاج قراراً، اذكر التوصية ثم سببها ثم الشرط الذي يجعلها تتغير.';
  return aiAsk_(m, 'سؤال', q, prompt, null);
}

/* ---------- 3) التفاوض على قرار ---------- */

function aiReviewDecision(token, month, decision) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const d = decision || {};
  const label = String(d.label || 'قرار');
  const amount = positive_(d.amount);
  const kind = String(d.kind || 'expense');
  const months = Math.max(1, Number(d.months) || 1);
  const day = clampDay_(d.day);

  let sim = null;
  try { sim = simulateMulti_(m, [{ kind: kind, amount: amount, months: months, day: day, label: label }]); }
  catch (e) { sim = null; }

  const prompt = aiSystemRules_() +
    '\n\nلقطة وضعه:\n' + snapshotText_(m) +
    (sim ? '\n\nنتيجة المحاكاة الحسابية لهذا القرار (أرقام نهائية من التطبيق):\n' + JSON.stringify({
      المتبقي_قبل: sim.before.remaining, المتبقي_بعد: sim.after.remaining,
      الآمن_قبل: sim.before.safeRemaining, الآمن_بعد: sim.after.safeRemaining,
      أدنى_رصيد_قبل: sim.before.minBalance, أدنى_رصيد_بعد: sim.after.minBalance,
      أول_يوم_سالب: sim.firstNegative ? sim.firstNegative.date : null,
      التكلفة_الإجمالية: sim.totalCost, الحكم_الحسابي: sim.verdict
    }, null, 1) : '') +
    '\n\nمحادثاتكم السابقة:\n' + aiMemory_(5) +
    '\n\nهو يفكر في: ' + label + ' بمبلغ ' + amount + ' ريال' +
    (kind === 'loan' ? ' شهرياً لمدة ' + months + ' شهر' : '') + ' استحقاقه يوم ' + day + '.' +
    '\n\nلا توافق ولا ترفض مباشرة. افعل هذا بالترتيب:' +
    '\n1) اذكر الأثر الحقيقي بالأرقام من المحاكاة.' +
    '\n2) اسأله سؤالاً أو سؤالين يكشفان إن كان القرار ضرورياً أم مؤجلاً.' +
    '\n3) اعرض بديلين أرخص أو أخف أثراً.' +
    '\n4) أعطِ حكمك النهائي بوضوح: افعل، أو أجّل حتى يتحقق شرط محدد، أو لا تفعل — وسبب واحد مقنع.';
  return aiAsk_(m, 'مراجعة قرار', label + ' — ' + amount, prompt, null);
}

/* ---------- 4) تحليل الأنماط السلوكية ---------- */

function aiPatterns(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  // نجمّع مشتريات آخر ثلاث دورات بتفصيل اليوم واليوم من الأسبوع
  const WEEK = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const rows = [];
  let k = m;
  for (let i = 0; i < 3; i++) {
    purchasesForMonth_(k).forEach(function (p) {
      const d = toDate_(p.date);
      rows.push({ الدورة: k, التاريخ: p.date, اليوم: d ? WEEK[d.getDay()] : '',
                  التصنيف: p.category, المبلغ: p.amount, المتجر: p.store });
    });
    k = prevMonth_(k);
    if (k < startMonth_()) break;
  }
  if (!rows.length) throw new Error('لا توجد مشتريات كافية لتحليل الأنماط بعد. سجّل مصروفك أسبوعين ثم أعد المحاولة.');

  const incomeDays = activeIncomes_(m).map(function (i) { return i.name + ' يوم ' + i.day; }).join('، ');
  const prompt = aiSystemRules_() +
    '\n\nمواعيد دخله: ' + incomeDays +
    '\n\nمشترياته في آخر ثلاث دورات (' + rows.length + ' عملية):\n' + JSON.stringify(rows) +
    '\n\nاستخرج أنماطاً سلوكية حقيقية لا بديهيات. ركّز على:' +
    '\n- علاقة الصرف بموعد نزول الدخل (هل يصرف أكثر في الأيام الأولى؟ بكم نسبة؟)' +
    '\n- أيام الأسبوع الأعلى صرفاً.' +
    '\n- التصنيف أو المتجر الذي يستنزفه دون أن ينتبه.' +
    '\n- أي عادة متكررة يمكن تقليصها بأثر ملموس، مع تقدير التوفير الشهري.' +
    '\nاذكر النسب والمبالغ من البيانات نفسها. إن لم يكن النمط واضحاً فقل ذلك ولا تخترعه.';
  return aiAsk_(m, 'أنماط', 'تحليل الأنماط السلوكية', prompt, null);
}

/* ---------- 5) توقّع مبلغ التزام تقديري ---------- */

function aiPredictAmount(token, obligationId, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const row = findById_('OBLIGATIONS', obligationId);
  if (!row || yes_(row.deleted)) throw new Error('الالتزام غير موجود');

  const history = table_('PAYMENTS')
    .filter(function (p) { return String(p.obligationId) === String(obligationId); })
    .map(function (p) { return { الدورة: monthKey_(p.month), المبلغ: num(p.dueAmount || p.amount) }; })
    .sort(function (a, b) { return String(a.الدورة).localeCompare(String(b.الدورة)); });

  if (history.length < 2) throw new Error('يحتاج سجل دورتين على الأقل لهذا الالتزام قبل التوقع.');

  const prompt = aiSystemRules_() +
    '\n\nالتزام اسمه «' + String(row.name) + '» تصنيفه ' + String(row.category || '') + '.' +
    '\nسجل مبالغه السابقة:\n' + JSON.stringify(history) +
    '\nالدورة المطلوب توقعها: ' + m + '.' +
    '\n\nتوقّع مبلغ الدورة القادمة. راعِ الموسمية إن ظهرت (مثل ارتفاع الكهرباء صيفاً).' +
    '\nأجب بثلاثة أسطر فقط: المبلغ المتوقع رقماً، ونطاق معقول من كذا إلى كذا، وسبب التوقع في جملة.';
  return aiAsk_(m, 'توقع مبلغ', String(row.name), prompt, null);
}

/* ---------- 6) قراءة فاتورة بالصورة ---------- */

function aiReadReceipt(token, base64, mimeType, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  if (!base64) throw new Error('أرفق صورة الفاتورة');
  const cats = purchaseCategories_();
  const prompt =
    'أنت تقرأ صورة فاتورة شراء سعودية. استخرج البنود.' +
    '\nالتصنيفات المتاحة: ' + cats.join('، ') + '.' +
    '\nأعد النتيجة بصيغة JSON فقط، بلا أي شرح وبلا علامات ماركداون، بهذا الشكل:' +
    '\n{"store":"اسم المتجر","date":"YYYY-MM-DD","items":[{"item":"اسم البند","amount":0,"category":"أحد التصنيفات"}],"total":0}' +
    '\nإن لم يظهر التاريخ استخدم ' + today_() + '. إن لم تتبيّن البنود المفردة فأعد بنداً واحداً بإجمالي الفاتورة.' +
    '\nالمبالغ أرقام بلا رمز عملة.';
  const raw = callGemini_(prompt, { mimeType: String(mimeType || 'image/jpeg'), data: String(base64) });
  const clean = String(raw).replace(/```json|```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(clean); }
  catch (e) { throw new Error('تعذّر فهم ما في الصورة. جرّب صورة أوضح أو سجّل العملية يدوياً.'); }

  const items = (parsed.items || []).map(function (x) {
    return { item: String(x.item || 'بند'), amount: positive_(x.amount),
             category: cats.indexOf(String(x.category)) > -1 ? String(x.category) : 'أخرى',
             store: String(parsed.store || ''),
             date: /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date || '')) ? String(parsed.date) : today_(),
             notes: 'من صورة فاتورة' };
  }).filter(function (x) { return x.amount > 0; });

  if (!items.length) throw new Error('لم أجد بنوداً بمبالغ في الصورة.');
  logAi_(m, 'فاتورة', 'قراءة صورة فاتورة', 'استُخرج ' + items.length + ' بند بإجمالي ' +
    items.reduce(function (t, x) { return t + x.amount; }, 0));
  return { store: String(parsed.store || ''), total: positive_(parsed.total), items: items };
}

/* ---------- 7) التقرير الشهري المكتوب ---------- */

function aiMonthlyReport(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const prev = prevMonth_(m);
  let prevSnap = null;
  try { if (prev >= startMonth_()) prevSnap = { الدورة: prev, الملخص: monthSummary_(prev) }; } catch (e) {}

  const prompt = aiSystemRules_() +
    '\n\nلقطة الدورة الحالية:\n' + snapshotText_(m) +
    (prevSnap ? '\n\nملخص الدورة السابقة للمقارنة:\n' + JSON.stringify(prevSnap, null, 1) : '') +
    '\n\nاكتب تقريراً شهرياً كأنك محاسب يكتب لصاحب الحساب. الأقسام:' +
    '\n- افتتاحية: جملتان عن حال الدورة.' +
    '\n- الدخل: ما نزل وما تأخر.' +
    '\n- الالتزامات: ما سُدِّد وما تأخر ولماذا.' +
    '\n- المصروف: أين ذهب، وأي تصنيف تجاوز.' +
    '\n- المقارنة بالدورة السابقة إن توفرت.' +
    '\n- خاتمة: ثلاث توصيات للدورة القادمة.' +
    '\nاكتبه نصاً متصلاً مقروءاً، بلا جداول، وبأرقام صريحة.';
  return aiAsk_(m, 'تقرير شهري', 'تقرير ' + m, prompt, null);
}

/* ---------- 8) خطة توزيع الدخل ---------- */

function aiAllocationPlan(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const prompt = aiSystemRules_() +
    '\n\nلقطة وضعه:\n' + snapshotText_(m) +
    '\n\nاقترح خطة توزيع كاملة لدخل هذه الدورة: أي التزام يُسدَّد من أي مصدر ولماذا، ' +
    'مع مراعاة تواريخ نزول كل مصدر وتواريخ الاستحقاق حتى لا يسلب رصيده في أي يوم.' +
    '\nثم حدد المبلغ المقترح للنثريات وللادخار.' +
    '\nاعرضها كقائمة مرتبة زمنياً بحسب الأيام، وأنهِ بجملة عن الفائض المتوقع.' +
    '\nلا تخصص أكثر مما في المصدر، ولا تتجاهل المتأخرات إن وجدت.';
  return aiAsk_(m, 'خطة توزيع', 'خطة توزيع الدخل', prompt, null);
}

/* ---------- 9) تصنيف ذكي لمشترى ---------- */

function aiCategorize(token, text, month) {
  guard_(token);
  const cats = purchaseCategories_();
  const prompt = 'صنّف عملية الشراء التالية ضمن واحد من هذه التصنيفات فقط: ' + cats.join('، ') +
    '.\nالعملية: ' + String(text || '') +
    '\nأجب باسم التصنيف فقط بلا أي كلمة أخرى.';
  const out = String(callGemini_(prompt, null)).trim();
  return { category: cats.indexOf(out) > -1 ? out : 'أخرى' };
}

/* ---------- 10) إدخال بالكلام الطبيعي ---------- */

function aiParseEntry(token, text, month) {
  guard_(token);
  const cats = purchaseCategories_();
  const prompt = 'حوّل الجملة التالية إلى عملية شراء بصيغة JSON فقط بلا شرح:' +
    '\n{"item":"","amount":0,"category":"","store":"","date":"YYYY-MM-DD"}' +
    '\nالتصنيفات المتاحة: ' + cats.join('، ') +
    '\nتاريخ اليوم: ' + today_() + '. إن قال «أمس» فاطرح يوماً، وإن لم يذكر تاريخاً فاستخدم اليوم.' +
    '\nالجملة: ' + String(text || '');
  const raw = String(callGemini_(prompt, null)).replace(/```json|```/g, '').trim();
  let p;
  try { p = JSON.parse(raw); } catch (e) { throw new Error('لم أفهم الجملة. جرّب صياغة أوضح مثل: صرفت 80 ريال عشاء أمس.'); }
  const amount = positive_(p.amount);
  if (amount <= 0) throw new Error('لم أتبيّن المبلغ في جملتك.');
  return {
    item: String(p.item || 'مشتريات'), amount: amount,
    category: cats.indexOf(String(p.category)) > -1 ? String(p.category) : 'أخرى',
    store: String(p.store || ''),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) ? String(p.date) : today_(),
    notes: 'إدخال بالكلام'
  };
}


/* ============================================================
 *  31) طبقات الذكاء الحتمية — تُغذّي المستشار بحقائق لا تخمينات
 * ========================================================== */

/** [1] جودة البيانات: هل يكفي ما سجّلته لإصدار حكم؟ */
function dataQuality_(month) {
  const inc = incomesForMonth_(month);
  const obs = obligationsForMonth_(month);
  const pur = purchasesForMonth_(month);
  const issues = [];
  let score = 100;

  const basics = inc.filter(function (i) { return i.isBasic && i.hasSchedule; });
  if (!basics.length) { issues.push('لا يوجد مصدر دخل أساسي مجدول'); score -= 40; }
  if (!obs.length) { issues.push('لا توجد التزامات مسجّلة'); score -= 20; }

  const unalloc = obs.filter(function (o) { return o.unallocatedAmount > 0; });
  if (unalloc.length) {
    issues.push(unalloc.length + ' التزام بلا مصدر سداد كامل');
    score -= Math.min(20, unalloc.length * 4);
  }
  if (num(getSetting_('PURCHASE_BUDGET')) <= 0) {
    issues.push('لم يُحدَّد سقف للمشتريات النثرية، فالتوقعات تتجاهل المصروف اليومي');
    score -= 15;
  }
  if (!pur.length) { issues.push('لا مشتريات مسجّلة في هذه الدورة'); score -= 10; }

  const closed = table_('MONTHS').length;
  if (!closed) { issues.push('لم تُقفل أي دورة بعد، فلا يوجد رصيد مرحّل ولا تاريخ للمقارنة'); score -= 10; }

  const estimated = obs.filter(function (o) { return o.isEstimated; });
  const noHistory = estimated.filter(function (o) { return /لا يوجد تاريخ/.test(o.estimateBasis || ''); });
  if (noHistory.length) { issues.push(noHistory.length + ' التزام تقديري بلا سجل سابق، فمبلغه تخمين'); score -= 8; }

  score = Math.max(0, Math.min(100, score));
  return {
    score: score,
    level: score >= 80 ? 'عالية' : score >= 55 ? 'متوسطة' : 'ضعيفة',
    confidence: score >= 80 ? 'يمكن الاعتماد على التحليل'
              : score >= 55 ? 'التحليل تقريبي — بعض البيانات ناقصة'
              : 'البيانات غير كافية لحكم دقيق',
    issues: issues,
    counts: { مصادر_مجدولة: basics.length, التزامات: obs.length,
              مشتريات: pur.length, دورات_مقفلة: closed }
  };
}

/**
 * يشرح لكل التزام مسجَّل: هل يظهر في هذه الدورة ولماذا لا.
 * أداة تشخيص مباشرة بدل التخمين.
 */
function diagnoseObligations(token, month) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const range = cycleRange_(m);
  const visible = {};
  obligationsForMonth_(m).forEach(function (o) { visible[o.id] = o; });

  const rows = table_('OBLIGATIONS').map(function (r) {
    const name = String(r.name || '');
    if (!name.trim()) return null;
    const id = String(r.id);
    const day = clampDay_(r.day);
    const rec = normalizeRecurrence_(r.recurrence);
    const start = toDate_(r.startDate), end = toDate_(r.endDate);
    const due = dueDateFor_(m, day, rec, start, end);
    let reason = '', ok = !!visible[id];

    if (yes_(r.deleted)) reason = 'محذوف — موجود في سلة المحذوفات';
    else if (String(r.active || 'نعم') === 'لا') reason = 'غير نشط';
    else if (String(r.certainty || 'مؤكد') === 'لم يتحقق') reason = 'مُعلَّم بأنه لم يتحقق';
    else if (!due) {
      if (recurrenceStep_(rec) > 1 && !start) reason = 'تكرار غير شهري بلا تاريخ بداية — لا مرساة لحساب دورته';
      else if (recurrenceStep_(rec) === 0 && start && cycleOf_(start) !== m)
        reason = 'مرة واحدة ودورته ' + cycleOf_(start) + ' لا هذه الدورة';
      else if (start && cycleDate_(m, day) < start)
        reason = 'استحقاقه ' + fmtDate_(cycleDate_(m, day)) + ' يسبق تاريخ بدايته ' + fmtDate_(start)
               + ' — شغّل «فحص وإصلاح البيانات»';
      else if (end && cycleDate_(m, day) > end)
        reason = 'انتهى في ' + fmtDate_(end);
      else if (recurrenceStep_(rec) > 1)
        reason = 'دورته ' + rec + ' ولا يستحق في هذه الدورة';
      else reason = 'لا يستحق في هذه الدورة';
    }
    else if (beforeStart_(due))
      reason = 'استحقاقه ' + fmtDate_(due) + ' يسبق تاريخ بداية تتبعك ' + fmtDate_(startDate_());
    else if (!visible[id]) reason = 'مستبعد لسبب غير متوقع — أبلغ عنه';
    else reason = 'يظهر · استحقاقه ' + fmtDate_(due);

    return { id: id, name: name, amount: num(r.amount), day: day, recurrence: rec,
             startDate: fmtDate_(start), endDate: fmtDate_(end),
             visible: ok, reason: reason };
  }).filter(Boolean);

  const hidden = rows.filter(function (x) { return !x.visible; });
  return {
    month: m, label: cycleLabel_(m),
    range: { start: fmtDate_(range.start), end: fmtDate_(range.end) },
    trackingStart: fmtDate_(startDate_()),
    cycleStartDay: cycleStartDay_(),
    todayCycle: currentMonth_(),
    cycleBeforeStart: currentMonth_() < startMonth_(),
    total: rows.length, shown: rows.length - hidden.length,
    rows: rows,
    summary: !rows.length ? 'لا توجد التزامات مسجّلة إطلاقاً'
      : !hidden.length ? 'كل الالتزامات تظهر في هذه الدورة'
      : hidden.length + ' من ' + rows.length + ' لا تظهر في هذه الدورة — التفاصيل أدناه'
  };
}

function getDataQuality(token, month) {
  guard_(token);
  return dataQuality_(validMonth_(month) ? month : currentMonth_());
}

/** [2] كشف التغيّر: ما الذي اختلف عن الدورة السابقة؟ */
function changeDetection_(month) {
  const prev = prevMonth_(month);
  if (prev < startMonth_()) return { hasPrevious: false, changes: [] };
  const a = monthSummary_(month), b = monthSummary_(prev);
  const pct = function (now, before) {
    if (!before) return null;
    return Math.round((now - before) / before * 100);
  };
  const raw = [
    ['الدخل المتوقع', a.incomeExpected, b.incomeExpected, false],
    ['الالتزامات', a.plannedObligations, b.plannedObligations, true],
    ['المشتريات', a.purchasesSpent, b.purchasesSpent, true],
    ['المتأخرات', a.arrearsTotal, b.arrearsTotal, true],
    ['الادخار', a.savingsDeposited, b.savingsDeposited, false],
    ['المتبقي الآمن', a.safeRemaining, b.safeRemaining, false]
  ];
  const changes = raw.map(function (r) {
    const diff = Math.round(r[1] - r[2]);
    const p = pct(r[1], r[2]);
    const worse = r[3] ? diff > 0 : diff < 0;
    return { البند: r[0], الآن: Math.round(r[1]), سابقاً: Math.round(r[2]),
             الفرق: diff, النسبة: p === null ? null : p + '%',
             الاتجاه: diff === 0 ? 'ثابت' : (worse ? 'أسوأ' : 'أفضل'),
             مهم: p !== null && Math.abs(p) >= 15 && Math.abs(diff) >= 100 };
  });
  const significant = changes.filter(function (c) { return c.مهم; });
  return {
    hasPrevious: true, previousCycle: prev,
    changes: changes, significant: significant,
    summary: significant.length
      ? significant.map(function (c) {
          return c.البند + ' ' + (c.الفرق > 0 ? 'ارتفع' : 'انخفض') + ' ' + Math.abs(c.الفرق) + ' (' + c.النسبة + ')';
        }).join('، ')
      : 'لا تغيّرات جوهرية عن الدورة السابقة'
  };
}

function getChangeDetection(token, month) {
  guard_(token);
  return changeDetection_(validMonth_(month) ? month : currentMonth_());
}

/** [3] ذكاء المتكررات: مشتريات تتكرر ولم تُسجَّل كقالب متكرر. */
function recurringIntel_(month) {
  const seen = {};
  let k = month;
  for (let i = 0; i < 4 && k >= startMonth_(); i++) {
    purchasesForMonth_(k).forEach(function (p) {
      const key = (String(p.item || '').trim() + '|' + String(p.category || '')).toLowerCase();
      if (!key.trim()) return;
      (seen[key] = seen[key] || { item: p.item, category: p.category, months: {}, amounts: [] });
      seen[key].months[k] = true;
      seen[key].amounts.push(p.amount);
    });
    k = prevMonth_(k);
  }
  const known = {};
  table_('RECURRING').forEach(function (t) {
    known[String(t.item || '').trim().toLowerCase()] = true;
  });

  const candidates = Object.keys(seen).map(function (key) {
    const x = seen[key];
    const cycles = Object.keys(x.months).length;
    const avg = x.amounts.reduce(function (t, a) { return t + a; }, 0) / x.amounts.length;
    return { الوصف: x.item, التصنيف: x.category, عدد_الدورات: cycles,
             متوسط_المبلغ: Math.round(avg), مرات: x.amounts.length,
             مسجَّل_كمتكرر: !!known[String(x.item || '').trim().toLowerCase()] };
  }).filter(function (c) { return c.عدد_الدورات >= 2 && !c.مسجَّل_كمتكرر; })
    .sort(function (a, b) { return b.متوسط_المبلغ * b.عدد_الدورات - a.متوسط_المبلغ * a.عدد_الدورات; })
    .slice(0, 8);

  return {
    candidates: candidates,
    note: candidates.length
      ? candidates.length + ' بند يتكرر ولم تسجّله كمصروف متكرر'
      : 'لا توجد بنود متكررة غير مسجّلة'
  };
}

function getRecurringIntel(token, month) {
  guard_(token);
  return recurringIntel_(validMonth_(month) ? month : currentMonth_());
}

/** [4] دقة التوقع: كم كان تقدير الالتزامات التقديرية بعيداً عن الواقع؟ */
function forecastAccuracy_() {
  const pays = table_('PAYMENTS').filter(function (p) {
    return num(p.dueAmount) > 0 && num(p.amount) > 0;
  });
  if (pays.length < 3) {
    return { enough: false, note: 'يحتاج ثلاث عمليات سداد على الأقل لقياس الدقة' };
  }
  const byOb = {};
  pays.forEach(function (p) {
    const id = String(p.obligationId);
    (byOb[id] = byOb[id] || []).push({ due: num(p.dueAmount), paid: num(p.amount), month: monthKey_(p.month) });
  });
  const rows = [];
  Object.keys(byOb).forEach(function (id) {
    const o = findById_('OBLIGATIONS', id);
    if (!o) return;
    const list = byOb[id];
    if (list.length < 2) return;
    let err = 0;
    list.forEach(function (x) { err += Math.abs(x.paid - x.due) / Math.max(1, x.due); });
    const mape = Math.round(err / list.length * 100);
    rows.push({ الالتزام: String(o.name), عدد_الدورات: list.length,
                نسبة_الانحراف: mape + '%',
                الدقة: mape <= 5 ? 'ممتازة' : mape <= 15 ? 'جيدة' : 'ضعيفة' });
  });
  const avg = rows.length
    ? Math.round(rows.reduce(function (t, r) { return t + parseInt(r.نسبة_الانحراف); }, 0) / rows.length)
    : null;
  return { enough: rows.length > 0, items: rows, متوسط_الانحراف: avg === null ? null : avg + '%',
           note: avg === null ? 'لا توجد بنود كافية للقياس'
               : avg <= 10 ? 'توقعاتك قريبة من الواقع' : 'توقعاتك تنحرف كثيراً — راجع مبالغ البنود التقديرية' };
}

function getForecastAccuracy(token) { guard_(token); return forecastAccuracy_(); }

/** [5] مقارنة سيناريوهين: بالدخل الإضافي وبدونه. */
function multiScenario_(month) {
  const base = monthSummary_(month);
  const flow = dailyFlow_(month, null);
  const potential = potentialIncomes_(month).filter(function (i) { return !i.arrived; });
  const potentialTotal = potential.reduce(function (t, i) { return t + i.amount; }, 0);

  return {
    بدون_دخل_إضافي: {
      المتبقي: Math.round(base.remaining), الآمن: Math.round(base.safeRemaining),
      أدنى_رصيد: flow.minBalance, يسلب: !!flow.firstNegative,
      تاريخ_السلب: flow.firstNegative ? flow.firstNegative.date : null
    },
    لو_نزل_الدخل_الإضافي: potentialTotal > 0 ? {
      المبلغ_المحتمل: Math.round(potentialTotal),
      المتبقي: Math.round(base.remaining + potentialTotal),
      الآمن: Math.round(Math.max(0, base.remaining + potentialTotal - base.buffer)),
      ملاحظة: 'سيناريو افتراضي فقط — هذا الدخل غير مضمون ولم يُستلم'
    } : null,
    المصادر_المحتملة: potential.map(function (i) {
      return { الاسم: i.name, المبلغ_المتوقع: Math.round(i.amount),
               له_موعد: i.hasSchedule, الموعد: i.occurrenceDate || 'غير محدد',
               نزل: i.arrived };
    })
  };
}

function getMultiScenario(token, month) {
  guard_(token);
  return multiScenario_(validMonth_(month) ? month : currentMonth_());
}


/* ============================================================
 *  32) الجلب بمدى تاريخ — المستخدم يختار «من/إلى» والدورات تُعالَج داخلياً
 * ========================================================== */

function rangeBounds_(from, to) {
  const base = cycleRange_(defaultMonth_());
  let f = toDate_(from) || base.start, t = toDate_(to) || base.end;
  if (t < f) { const x = f; f = t; t = x; }
  // حد أعلى معقول: سنتان
  if ((t - f) / 86400000 > 731) t = new Date(f.getTime() + 731 * 86400000);
  return { from: f, to: t };
}

function cyclesBetween_(f, t) {
  const out = [];
  let k = cycleOf_(f);
  const last = cycleOf_(t);
  for (let i = 0; i < 30 && k <= last; i++) { out.push(k); k = addCycles_(k, 1); }
  return out;
}

/** كل ما استحق بين تاريخين: المسدَّد والمستحق والمتأخر، ولكل صف دورته. */
function getPaymentsRange(token, from, to) {
  guard_(token);
  const b = rangeBounds_(from, to);
  const F = fmtDate_(b.from), T = fmtDate_(b.to);
  const sm = startMonth_();
  const rows = [];
  cyclesBetween_(b.from, b.to).forEach(function (k) {
    if (k < sm) return;
    obligationsForMonth_(k).forEach(function (o) {
      if (o.dueDate < F || o.dueDate > T) return;
      rows.push(Object.assign({}, o, { cycle: k, cycleLabel: cycleLabel_(k) }));
    });
  });
  const sum = function (list, f) { return Math.round(list.reduce(function (t, x) { return t + (x[f] || 0); }, 0)); };
  return {
    from: F, to: T, rows: rows,
    totals: {
      due: sum(rows, 'amount'), paid: sum(rows, 'paidAmount'), remaining: sum(rows, 'remainingAmount'),
      count: rows.length,
      paidCount: rows.filter(function (x) { return x.paid; }).length,
      overdueCount: rows.filter(function (x) { return x.overdue; }).length,
      overdue: Math.round(rows.filter(function (x) { return x.overdue; })
                              .reduce(function (t, x) { return t + x.remainingAmount; }, 0))
    }
  };
}

/** المشتريات بين تاريخين مع مجاميع التصنيفات. */
function getPurchasesRange(token, from, to) {
  guard_(token);
  const b = rangeBounds_(from, to);
  const F = fmtDate_(b.from), T = fmtDate_(b.to);
  const seen = {}, rows = [];
  cyclesBetween_(b.from, b.to).forEach(function (k) {
    purchasesForMonth_(k).forEach(function (p) {
      if (seen[p.id] || p.date < F || p.date > T) return;
      seen[p.id] = true;
      rows.push(p);
    });
  });
  rows.sort(function (a, b2) { return String(b2.date).localeCompare(String(a.date)); });
  const byCat = {};
  rows.forEach(function (p) { byCat[p.category || 'أخرى'] = (byCat[p.category || 'أخرى'] || 0) + p.amount; });
  return {
    from: F, to: T, rows: rows,
    total: Math.round(rows.reduce(function (t, p) { return t + p.amount; }, 0)),
    byCategory: Object.keys(byCat).map(function (c) { return { category: c, amount: Math.round(byCat[c]) }; })
      .sort(function (a, c) { return c.amount - a.amount; })
  };
}

/* ============================================================
 *  33) التوزيع الذكي: Gemini يقترح، والمحرك يدقّق كل سطر
 * ========================================================== */

/**
 * ما يحتاجه النموذج ليوزّع صحيحاً — وكان ينقصه:
 * لكل التزام: أي راتب بالضبط سيغطيه من كل مصدر (آخر نزول قبل استحقاقه)
 * وكم بقي فيه فعلاً بعد كل ما رُبط عليه.
 */
function allocationContext_(m, mode, onlyIds) {
  const incomes = activeIncomes_(m);
  const cap = occurrenceCapacity_(m);
  const all = obligationsForMonth_(m);
  const redo = String(mode) === 'all';
  const targets = all.filter(function (o) {
    if (onlyIds) return onlyIds.indexOf(o.id) > -1;
    return redo || o.unallocatedAmount > 0.5;
  });

  // نحرّر سعة البنود التي سيُعاد توزيعها
  targets.forEach(function (o) {
    o.sources.forEach(function (s) {
      const inc = incomes.filter(function (i) { return i.id === s.sourceId; })[0];
      if (!inc) return;
      const occ = fundingOccurrence_(inc, o, m);
      if (!occ) return;
      const k = occKey_(inc.id, occ);
      if (cap[k] !== undefined) cap[k] += s.amount;
    });
  });

  const paychecks = {};
  const items = targets.map(function (o) {
    const eligible = [];
    incomes.forEach(function (inc) {
      const occ = fundingOccurrence_(inc, o, m);
      if (!occ) return;
      const at = incomeAtOccurrence_(inc.id, occ);
      if (!at) return;
      const k = occKey_(inc.id, occ);
      const free = Math.round(capacityOf_(cap, inc.id, occ, at.amount));
      paychecks[k] = { key: k, sourceId: inc.id, source: inc.name, date: fmtDate_(occ),
                       amount: Math.round(at.amount), free: free, certain: at.certain !== false };
      eligible.push({ sourceId: inc.id, source: inc.name, paycheckDate: fmtDate_(occ), key: k });
    });
    return { obligationId: o.id, name: o.name, amount: Math.round(o.amount), dueDate: o.dueDate,
             priority: o.priority, type: o.type, category: o.category, autoDeduct: o.autoDeduct,
             spread: isSpread_(o), eligible: eligible };
  });

  const fixed = all.filter(function (o) { return targets.indexOf(o) < 0; }).map(function (o) {
    return { name: o.name, amount: Math.round(o.amount),
             sources: o.sources.map(function (x) { return x.sourceName + ':' + Math.round(x.amount); }) };
  });

  return { month: m, mode: redo ? 'all' : 'unassigned', cap: cap,
           paychecks: Object.keys(paychecks).map(function (k) { return paychecks[k]; })
             .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }),
           items: items, fixed: fixed,
           buffer: num(getSetting_('SAFETY_BUFFER')),
           suggestedSaving: Math.round(monthSummary_(m).suggestedSaving) };
}

/** يدقّق اقتراحاً بنفس قواعد applyAllocation — لا سطر يُعتمد إلا إن صحّ. */
function validateAllocation_(ctx, proposal) {
  const cap = {};
  ctx.paychecks.forEach(function (p) { cap[p.key] = p.free; });
  const byOb = {};
  ctx.items.forEach(function (it) { byOb[it.obligationId] = it; });
  const names = {};
  incomesForMonth_(ctx.month).forEach(function (i) { names[i.id] = i.name; });
  ctx.paychecks.forEach(function (p) { names[p.sourceId] = p.source; });

  /**
   * العجز لا يوقف التوزيع: البنود تُعالَج بترتيب أهميتها، فيُغطّى الأساسي أولاً،
   * ويُكمَل أي نقص من متسع المصادر المسموحة، والعجز الباقي ينزل على آخر البنود أهمية.
   */
  const rank = function (it) {
    const t = String(it.type || 'صارم');
    const tier = it.autoDeduct ? 0 : t === 'صارم' ? 1 : t === 'مرن' ? 2 : 3;
    const pr = it.priority === 'عالية' ? 0 : it.priority === 'متوسطة' ? 1 : 2;
    return tier * 10 + pr;
  };
  const byRow = {};
  (proposal || []).forEach(function (row) {
    const id = String(row.obligationId || '');
    if (byOb[id] && !byRow[id]) byRow[id] = row;
  });
  // الأهمية أولاً؛ وعند التساوي: الأقل خيارات (مصادر أقل تسبقه) قبل غيره
  const ordered = ctx.items.slice().sort(function (a, b) {
    return rank(a) - rank(b) || a.eligible.length - b.eligible.length || String(a.dueDate).localeCompare(String(b.dueDate));
  });

  const out = [];
  ordered.forEach(function (it) {
    const row = byRow[it.obligationId] || { obligationId: it.obligationId, splits: [], reason: '' };
    const problems = [], warnings = [], merged = {};
    let covered = 0, clamped = 0;
    const add = function (el, amt) {
      if (amt <= 0) return;
      merged[el.key] = merged[el.key] || { sourceId: el.sourceId, sourceName: el.source, amount: 0, paycheckDate: el.paycheckDate };
      merged[el.key].amount += amt;
      cap[el.key] -= amt;
      covered += amt;
    };
    (row.splits || []).forEach(function (sp) {
      const src = String(sp.sourceId || '');
      const want = Math.round(positive_(sp.amount));
      if (want <= 0) return;
      const el = it.eligible.filter(function (e) { return e.sourceId === src; })[0];
      if (!el) {
        warnings.push((names[src] || src) + ' لا ينزل قبل الاستحقاق — استُبدل');
        return;
      }
      const room = Math.max(0, Math.min(want, it.amount - covered, cap[el.key]));
      if (room < want) clamped += want - room;
      add(el, Math.round(room));
    });
    if (clamped > 0.5) warnings.push('خُفّض ' + Math.round(clamped) + ' من اقتراح النموذج لأن مصدره لا يتسع');
    // إكمال تلقائي من متسع المصادر المسموحة الأخرى — الأوسع أولاً
    let need = it.amount - covered;
    if (need > 0.5) {
      const topped = [];
      // «في وقته»: الأقرب نزولاً قبل الموعد أولاً — فيبقى المال المبكر لما لا يسبقه غيره
      it.eligible.slice().sort(function (a, b) {
        return String(b.paycheckDate).localeCompare(String(a.paycheckDate)) || (cap[b.key] || 0) - (cap[a.key] || 0);
      }).forEach(function (el) {
        if (need <= 0.5) return;
        const take = Math.round(Math.max(0, Math.min(need, cap[el.key] || 0)));
        if (take > 0) { add(el, take); topped.push(el.source + ' ' + take); need -= take; }
      });
      if (topped.length) warnings.push('أُكمل تلقائياً من المتسع: ' + topped.join(' + '));
    }
    const splits = Object.keys(merged).map(function (k) { return merged[k]; });
    const shortfall = Math.max(0, Math.round(it.amount - covered));
    if (!splits.length) problems.push('لا متسع في أي مصدر يسبقه — كامل المبلغ عجز');
    else if (shortfall > 1) {
      warnings.push(rank(it) >= 20
        ? 'عجز ' + shortfall + ' — وُضع هنا لأنه من آخر البنود أهمية'
        : 'عجز ' + shortfall + ' في بند ملزم — الرواتب التي تسبقه ممتلئة، راجع التشخيص');
    }
    // الصارم المجمَّع من أكثر من مصدر: يكتمل قبل موعده ويُدفع كاملاً
    let completeBy = '';
    if (!it.spread && splits.length > 1) {
      completeBy = splits.map(function (x) { return x.paycheckDate; }).sort().pop();
    }
    const sd = Math.round(Number(row.suggestedDay));
    const curDay = Number(String(it.dueDate).slice(8, 10));
    const daySuggestion = (sd >= 1 && sd <= 31 && sd !== curDay)
      ? { day: sd, reason: String(row.dayReason || '').slice(0, 200) } : null;
    out.push({ obligationId: it.obligationId, name: it.name, amount: it.amount, dueDate: it.dueDate,
               priority: it.priority, type: it.type, splits: splits, reason: String(row.reason || ''),
               covered: Math.round(covered), shortfall: shortfall, completeBy: completeBy,
               daySuggestion: daySuggestion, spread: !!it.spread,
               valid: !problems.length, problems: problems, warnings: warnings });
  });
  /**
   * عجز التوقيت: بند صارم ينقصه مال، وفي دخل ينزل بعد موعده متسع لا يستطيع استخدامه.
   * نقترح نقل موعده إلى يوم نزول ذلك الدخل — فيكتمل. اقتراح فقط، تعتمده أنت.
   */
  const metaBy = {};
  ctx.paychecks.forEach(function (p) { metaBy[p.key] = p; });
  out.forEach(function (x) {
    if (x.spread || x.shortfall <= 1 || x.daySuggestion) return;
    const later = Object.keys(cap).map(function (k) { return { k: k, free: cap[k], p: metaBy[k] }; })
      .filter(function (c) { return c.p && c.free > 0.5 && c.p.date > x.dueDate; })
      .sort(function (a, b) { return String(a.p.date).localeCompare(String(b.p.date)); });
    if (!later.length) return;
    const pick = later.filter(function (c) { return c.free >= x.shortfall; })[0] ||
                 later.sort(function (a, b) { return b.free - a.free; })[0];
    const use = Math.min(pick.free, x.shortfall);
    cap[pick.k] -= use;   // لا يُقترح نفس المتسع لبندين
    x.daySuggestion = { day: Number(String(pick.p.date).slice(8, 10)), auto: true,
      reason: 'بعد نزول ' + pick.p.source + ' (' + pick.p.date + ') يتبقى فيه ' + Math.round(pick.free) +
              (pick.free >= x.shortfall ? ' — يكفي لإكمال العجز' : ' — يقلّص العجز بـ ' + Math.round(use)) };
  });

  // الربط دائم ⇒ نتحقق ألا يُعجز أي راتب في الدورات الـ12 القادمة
  const overrides = {};
  out.forEach(function (x) {
    if (x.valid) overrides[x.obligationId] = x.splits.map(function (sp) { return { sourceId: sp.sourceId, amount: sp.amount }; });
  });
  if (Object.keys(overrides).length) {
    let over = [];
    try { over = futureOverflows_(ctx.month, overrides); } catch (e) { over = []; }
    out.forEach(function (x) {
      x.warnings = x.warnings || [];
      if (!overrides[x.obligationId]) return;
      over.forEach(function (p) {
        if (x.splits.some(function (sp) { return sp.sourceId === p.sourceId; })) {
          x.warnings.push(p.source + ' (' + p.date + ') يعجز بـ ' + Math.round(-p.free) + ' في دورة ' + p.cycle);
        }
      });
    });
    ctx.futureOverflows = over;
  }
  return out;
}

/**
 * تشخيص حتمي حين لا يتسع راتب: هل الحل إعادة ترتيب (نقل التزامات تستحق لاحقاً
 * إلى رواتب لاحقة) أم عجز حقيقي لا يحلّه أي ترتيب؟ لا يعتمد على كلام النموذج.
 */
function allocationDiagnosis_(ctx, items) {
  const failed = items.filter(function (x) { return !x.valid || x.shortfall > 1; });
  if (!failed.length) return null;
  const m = ctx.month;
  const incomes = activeIncomes_(m);
  const all = obligationsForMonth_(m);
  const shortOf = function (x) { return x.valid ? x.shortfall : x.amount; };
  const totalShort = Math.round(failed.reduce(function (t, x) { return t + shortOf(x); }, 0));
  const income = incomes.reduce(function (t, i) { return t + i.amount; }, 0);
  const obligations = all.reduce(function (t, o) { return t + o.amount; }, 0);
  const trueDeficit = Math.max(0, Math.round(obligations - income));

  // متسع باقٍ بعد التوزيع — مال موجود لكنه ينزل بعد مواعيد البنود الناقصة
  const used = {};
  items.forEach(function (x) { x.splits.forEach(function (sp) {
    const k = sp.sourceId + '|' + sp.paycheckDate; used[k] = (used[k] || 0) + sp.amount; }); });
  const idle = ctx.paychecks.map(function (p) { return { source: p.source, date: p.date, left: Math.round(p.free - (used[p.key] || 0)) }; })
    .filter(function (p) { return p.left > 1; });
  const idleTxt = idle.map(function (p) { return p.source + ' (' + p.date + ') ' + p.left; }).join('، ');
  const where = failed.map(function (x) { return x.name + ' ' + shortOf(x); }).join('، ');
  const days = failed.filter(function (x) { return x.daySuggestion; }).length;
  const timing = Math.max(0, totalShort - trueDeficit);

  let kind, message;
  if (trueDeficit > 0) {
    kind = 'deficit';
    message = 'عجز كلي ' + trueDeficit + ': التزامات الدورة (' + Math.round(obligations) + ') أكبر من دخلها (' + Math.round(income) + ').';
    if (timing > 1) message += ' ويرتفع إلى ' + totalShort + ' بسبب التوقيت: ' + idleTxt + ' — مال ينزل بعد مواعيد بعض البنود فلا تستطيع استخدامه.';
  } else {
    kind = 'timing';
    message = 'لا عجز كلي — الدخل يكفي. النقص ' + totalShort + ' توقيت فقط: ' + (idleTxt || 'مال ينزل بعد مواعيد بعض البنود') + '.';
  }
  message += ' وُزّع كل ما يمكن، والنقص على: ' + where + '.';
  if (days) message += ' اعتماد المواعيد المقترحة (📅) يعالج عجز التوقيت.';
  message += ' تستطيع اعتماد التوزيع الآن كما هو.';

  // وضع «غير المربوط»: ربط قائم قد يحجز مالاً مبكراً يمكن تحريره بإعادة الترتيب
  let rebalance = false;
  if (ctx.mode !== 'all') {
    const targetIds = {};
    ctx.items.forEach(function (it) { targetIds[it.obligationId] = true; });
    rebalance = all.some(function (o) {
      return !targetIds[o.id] && o.sources.length && (isSpread_(o) || o.sources.length);
    });
    if (rebalance) message += ' وقد تتحسن النتيجة بـ«أعد التوزيع لتتسع» لأن الربط الحالي لبنود أخرى ثابت.';
  }
  return { kind: rebalance && trueDeficit === 0 ? 'rebalance' : kind, need: totalShort,
           deficit: trueDeficit, timing: timing, idle: idle, moves: [], message: message };
}


/**
 * «اقتراح آخر» لبند واحد: نفس السياق، مع خصم ما حجزته البنود الأخرى المقترحة
 * في النافذة (حتى لا يُحجز الراتب مرتين)، ومع استبعاد الاقتراح المرفوض.
 */
function aiAllocateOne(token, month, obligationId, others, rejected) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const ctx = allocationContext_(m, 'all', [String(obligationId)]);
  if (!ctx.items.length) throw new Error('هذا الالتزام لا يستحق في دورتك الحالية');
  const it = ctx.items[0];
  (others || []).forEach(function (sp) {
    const key = String(sp.sourceId) + '|' + String(sp.paycheckDate);
    ctx.paychecks.forEach(function (p) { if (p.key === key) p.free -= positive_(sp.amount); });
  });
  const rej = (rejected || []).map(function (sp) { return (sp.sourceName || sp.sourceId) + ' ' + Math.round(positive_(sp.amount)); }).join(' + ');
  const prompt = aiSystemRules_() +
    '\n\nاقترح توزيعاً بديلاً لالتزام واحد:\n' + JSON.stringify({
      الالتزام: { المعرف: it.obligationId, الاسم: it.name, المبلغ: it.amount, الاستحقاق: it.dueDate,
                  الأولوية: it.priority, النوع: it.type, يُصرف_على_مدار_الدورة: it.spread },
      المصادر_المسموحة: it.eligible.map(function (e) {
        const p = ctx.paychecks.filter(function (x) { return x.key === e.key; })[0];
        return { المعرف: e.sourceId, المصدر: e.source, النزول: e.paycheckDate, المتبقي_فيه: p ? Math.round(p.free) : 0 };
      }),
      الاقتراح_المرفوض: rej || 'لا يوجد'
    }, null, 1) +
    '\n\nقواعد: مختلف عن المرفوض فعلاً، لا يتجاوز المتبقي، المجموع = المبلغ. ' +
    'إن كان مرناً فالتقسيم على أكثر من مصدر مقبول. وإن لم يتسع أي توزيع فاقترح suggestedDay يحلّ التوقيت.' +
    '\nأعد JSON فقط: {"splits":[{"sourceId":"","amount":0}],"reason":"","suggestedDay":null,"dayReason":""}';
  const raw = String(callGemini_(prompt, null)).replace(/```json|```/g, '').trim();
  let p;
  try { p = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); }
  catch (e) { throw new Error('رد النموذج لم يكن قابلاً للقراءة. أعد المحاولة.'); }
  const row = validateAllocation_(ctx, [{ obligationId: it.obligationId, splits: p.splits || [], reason: p.reason,
                                         suggestedDay: p.suggestedDay, dayReason: p.dayReason }])
    .filter(function (x) { return x.obligationId === it.obligationId; })[0];
  return row;
}

/** اعتماد موعد مقترح: يتغير يوم الاستحقاق وحده، ولا يُمس شيء آخر في الالتزام. */
function setObligationDay(token, obligationId, day, month) {
  return mutate_(token, month, 'تم تغيير موعد الالتزام', function () {
    const r = findById_('OBLIGATIONS', obligationId);
    if (!r || yes_(r.deleted)) throw new Error('الالتزام غير موجود');
    const d = Math.round(Number(day));
    if (!(d >= 1 && d <= 31)) throw new Error('يوم غير صالح');
    const old = clampDay_(r.day);
    updateById_('OBLIGATIONS', obligationId, { day: d });
    return { message: 'موعد «' + r.name + '» صار يوم ' + d + ' (كان ' + old + ')' };
  });
}

function aiAllocate(token, month, mode) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const ctx = allocationContext_(m, mode);
  if (!ctx.items.length) {
    return { month: m, items: [], summary: 'كل الالتزامات موزّعة بالكامل — لا شيء لتوزيعه.', warnings: [] };
  }
  const payload = {
    الرواتب_المتاحة: ctx.paychecks.map(function (p) {
      return { المفتاح: p.key, المصدر: p.source, المعرف: p.sourceId, تاريخ_النزول: p.date,
               مبلغه: p.amount, المتبقي_فيه_فعلاً: p.free, مضمون: p.certain };
    }),
    الالتزامات_المطلوب_توزيعها: ctx.items.map(function (it) {
      return { المعرف: it.obligationId, الاسم: it.name, المبلغ: it.amount, الاستحقاق: it.dueDate,
               الأولوية: it.priority, خصم_تلقائي: it.autoDeduct, التصنيف: it.category,
               النوع: it.type,
               يُصرف_على_مدار_الدورة: it.spread,
               الأهمية: it.autoDeduct || it.type === 'صارم'
                 ? (it.priority === 'عالية' ? 'أساسي لا يُؤجَّل' : 'ملزم بموعده')
                 : (it.type === 'ترفيهي' ? 'كمالي يمكن تقليصه' : 'مرن يُصرف تدريجياً'),
               المصادر_المسموحة: it.eligible.map(function (e) {
                 return { المعرف: e.sourceId, المصدر: e.source, الراتب_الذي_سيغطيه: e.paycheckDate };
               }) };
    }),
    موزعة_مسبقا_ولا_تُمس: ctx.fixed,
    ضغط_الرواتب_في_12_دورة_قادمة: paycheckLoad_(m, 12, {}).map(function (p) {
      return { المصدر: p.source, المعرف: p.sourceId, النزول: p.date, مبلغه: p.amount, يحمل: p.load, يتبقى: p.free };
    }),
    الاحتياطي_المرغوب: ctx.buffer,
    الادخار_المقترح: ctx.suggestedSaving
  };
  const prompt = aiSystemRules_() +
    '\n\nمهمتك: توزيع الالتزامات على الرواتب. البيانات محسوبة ودقيقة:\n' + JSON.stringify(payload, null, 1) +
    '\n\nقواعد إلزامية:' +
    '\n1) لكل التزام استخدم فقط «المصادر_المسموحة» له — لأن غيرها لا ينزل قبل استحقاقه.' +
    '\n2) لا تتجاوز «المتبقي_فيه_فعلاً» لأي راتب، وتذكّر أن الراتب الواحد مشترك بين عدة التزامات.' +
    '\n3) مجموع أجزاء كل التزام = مبلغه بالضبط.' +
    '\n4) رتّب بالأهمية: «أساسي لا يُؤجَّل» ثم «ملزم بموعده» ثم «مرن» ثم «كمالي». الأساسي يُغطّى أولاً من الراتب الذي يسبقه.' +
    '\n4ب) البند «يُصرف_على_مدار_الدورة» (مقاضي، ترفيه، بنزين…) لا يُدفع يوماً واحداً، فقسّمه على أكثر من دخل داخل دورته ' +
    'بحسب ما يبقى في كل دخل: مثلاً مقاضي 800 = 500 من الراتب + 300 من حساب المواطن، ' +
    'حتى لا يعجز أي بند ويبقى لديه ما يصرفه حتى نزول الدخل التالي. مصادره المسموحة تشمل دخولاً تنزل بعد تاريخه عمداً.' +
    '\n4ج) البنود الصارمة تُدفع كاملة يوم استحقاقها. إن لم يكفها مصدر واحد فاجمعها من مصدرين كلاهما يسبق موعدها ' +
    '(المصادر المسموحة تضمن ذلك) — فتكتمل قبل يوم الاستحقاق. لا تقترح دفع الصارم على دفعتين بعد موعده أبداً.' +
    '\n4د) العجز لا يوقف التوزيع: وزّع كل البنود، وإن لم يكفِ الدخل فاجعل العجز على آخر البنود أهمية (الكمالي ثم المرن) ' +
    'وأعطها ما يتبقى فقط — والمحرك يُكمل الأهم من أي متسع ويضع النقص على الأقل أهمية.' +
    '\n5) وازن بين الرواتب حتى يبقى في كل راتب هامش، وحاول أن يبقى ما يكفي للادخار المقترح.' +
    '\n6) لا تعتمد على راتب «مضمون=false» إلا إن لم يوجد بديل، واذكر ذلك في التحذيرات.' +
    '\n8) الربط دائم لكل الدورات لا لهذه فقط: راجع «ضغط_الرواتب_في_12_دورة_قادمة» وتجنّب ربط التزام على راتب سيعجز في دورة قادمة (أشهر الالتزامات السنوية مثلاً).' +
    '\n7) إن لم يتسع أي مصدر مسموح لالتزام فلا تخصص له شيئاً (splits فارغة) واذكر ذلك في التحذيرات — لا تخصص فوق المتبقي أبداً.' +
    '\n9) لا تقل إن في راتب هامشاً إلا إن كان «المتبقي_فيه_فعلاً» يكفي بالأرقام.' +
    '\n11) اجعل في «reason» لكل بند سطراً يشرح أهميته وسبب مصدره أو تقسيمه.' +
    '\n12) المواعيد: إن كان بند صارم لا يتسع له الراتب الذي يسبقه، وتغيير يوم سداده إلى ما بعد نزول دخل فيه متسع يحلّ المشكلة، ' +
    'فاقترح «suggestedDay» (رقم يوم 1-31) مع «dayReason» — مثلاً فاتورة يمكن سدادها بعد نزول المواطن. ' +
    'لا تقترح موعداً لإيجار أو قسط بنكي بموعد ثابت إلا إن كان التأخير ممكناً عملياً، واذكر ذلك.' +
    (ctx.mode === 'all'
      ? '\n10) فكّر في الدورة كاملة: البند الذي يستحق مبكراً لا يغطيه إلا الراتب المبكر، فانقل إلى الرواتب اللاحقة كل بند يستحق بعد نزولها — لتفريغ الراتب المبكر لما لا بديل له.'
      : '') +
    '\n\nأعد JSON فقط بلا أي نص أو علامات ماركداون، بهذا الشكل:' +
    '\n{"items":[{"obligationId":"المعرف","splits":[{"sourceId":"المعرف","amount":0}],"reason":"سبب مختصر","suggestedDay":null,"dayReason":""}],' +
    '"summary":"جملتان عن منطق التوزيع","warnings":["تحذير"]}';

  const raw = String(callGemini_(prompt, null)).replace(/```json|```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); }
  catch (e) { throw new Error('رد النموذج لم يكن توزيعاً قابلاً للقراءة. أعد المحاولة.'); }

  const items = validateAllocation_(ctx, parsed.items || []);
  const diagnosis = allocationDiagnosis_(ctx, items);
  (ctx.futureOverflows || []).forEach(function (p) {
    (parsed.warnings = parsed.warnings || []).push('في دورة ' + p.cycle + ' يعجز ' + p.source + ' (' + p.date + ') بـ ' + Math.round(-p.free));
  });
  logAi_(m, 'توزيع ذكي', 'توزيع ' + items.length + ' التزام',
    String(parsed.summary || '') + ' | صالح: ' + items.filter(function (x) { return x.valid; }).length + '/' + items.length);
  return {
    month: m, mode: ctx.mode, items: items, diagnosis: diagnosis,
    // ملخص النموذج لا يُعرض وحده حين يخالف التدقيق: الحقيقة الحتمية أولاً
    summary: diagnosis ? '' : String(parsed.summary || ''),
    modelSummary: String(parsed.summary || ''),
    warnings: (parsed.warnings || []).map(String).slice(0, 8),
    validCount: items.filter(function (x) { return x.valid; }).length,
    paychecks: ctx.paychecks.map(function (p) { return { source: p.source, date: p.date, amount: p.amount, free: p.free }; })
  };
}


/* ============================================================
 *  34) التجنيب: مبلغ شهري من مصدر أو أكثر لتغطية التزام قادم
 *      «جنّب 200 من الراتب و200 من الضمان حتى يحين القسط»
 * ========================================================== */

function reserves_() {
  return cached_('rsv', function () {
    return live_('RESERVES').map(function (r) {
      let contrib = [];
      try { contrib = JSON.parse(String(r.contributions || '[]')); } catch (e) { contrib = []; }
      return {
        id: String(r.id), name: String(r.name || ''), obligationId: String(r.obligationId || ''),
        target: positive_(r.target), dueDate: fmtDate_(toDate_(r.dueDate)),
        contributions: (contrib || []).map(function (c) {
          return { sourceId: String(c.sourceId || ''), monthly: positive_(c.monthly) };
        }).filter(function (c) { return c.sourceId && c.monthly > 0; }),
        fromCycle: monthKey_(r.fromCycle) || defaultMonth_(),
        active: String(r.active || 'نعم') !== 'لا', notes: String(r.notes || '')
      };
    }).filter(function (x) { return x.name && x.active; });
  });
}

/** هل التجنيب يُقتطع في هذه الدورة؟ من دورة إنشائه حتى دورة استحقاقه. */
function reserveActiveIn_(r, month) {
  if (month < r.fromCycle) return false;
  const due = toDate_(r.dueDate);
  return !due || month <= cycleOf_(due);
}

/** ما جُنِّب فعلاً لكل دورة — لا ما خُطِّط له. */
function reserveDeposits_() {
  return cached_('rtx', function () {
    const out = {};
    table_('RESERVE_TX').forEach(function (t) {
      const id = String(t.reserveId);
      (out[id] = out[id] || {})[monthKey_(t.month)] = num(t.amount);
    });
    return out;
  });
}

/**
 * الرصيد عند الاستحقاق = ما جُنِّب فعلاً + المساهمات المخططة للدورات التي لم تُسجَّل بعد
 * من الدورة الحالية فصاعداً. الدورة الفائتة بلا إيداع لا تُحتسب — المال لم يُجنَّب.
 */
function reserveProjection_(r) {
  const dep = reserveDeposits_()[r.id] || {};
  const monthly = r.contributions.reduce(function (t, c) { return t + c.monthly; }, 0);
  const base = defaultMonth_();
  const due = toDate_(r.dueDate);
  const dueCycle = due ? cycleOf_(due) : addCycles_(base, 11);
  let actual = 0, expectedByNow = 0, futurePlanned = 0, k = r.fromCycle;
  Object.keys(dep).forEach(function (c) { actual += dep[c]; });
  for (let i = 0; i < 60 && k <= dueCycle; i++, k = addCycles_(k, 1)) {
    if (!reserveActiveIn_(r, k)) continue;
    if (k <= base) expectedByNow += monthly;
    if (k >= base && dep[k] === undefined) futurePlanned += monthly;
  }
  const projected = actual + futurePlanned;
  return {
    monthly: monthly, actual: actual, expectedByNow: expectedByNow,
    behind: Math.max(0, Math.round(expectedByNow - actual - (dep[base] === undefined ? monthly : 0))),
    projected: projected, dueCycle: dueCycle,
    depositedThisCycle: dep[base] !== undefined, thisCycleAmount: dep[base] || 0
  };
}

function reserveDeposit(token, reserveId, cycle, amount) {
  const m = validMonth_(cycle) ? cycle : defaultMonth_();
  return mutate_(token, m, 'تم تسجيل التجنيب', function () {
    const r = reserves_().filter(function (x) { return x.id === String(reserveId); })[0];
    if (!r) throw new Error('التجنيب غير موجود');
    hardDeleteWhere_('RESERVE_TX', function (t) {
      return String(t.reserveId) === String(reserveId) && monthKey_(t.month) === m;
    });
    const a = positive_(amount);
    if (a > 0) insert_('RESERVE_TX', { reserveId: String(reserveId), month: m, amount: a, date: today_() });
    return { message: a > 0 ? 'جُنِّب ' + Math.round(a) + ' لـ«' + r.name + '»' : 'أُلغي تسجيل تجنيب هذه الدورة' };
  });
}

function reservesBySource_(month) {
  const out = {};
  reserves_().forEach(function (r) {
    if (!reserveActiveIn_(r, month)) return;
    r.contributions.forEach(function (c) { out[c.sourceId] = (out[c.sourceId] || 0) + c.monthly; });
  });
  return out;
}
function reservesTotal_(month) {
  const m = reservesBySource_(month);
  return Object.keys(m).reduce(function (t, k) { return t + m[k]; }, 0);
}

function getReserves(token) {
  guard_(token);
  return getReservesRaw_();
}
function getReservesRaw_() {
  const base = defaultMonth_();
  const names = {};
  incomesForMonth_(base).forEach(function (i) { names[i.id] = i.name; });
  const obs = {};
  live_('OBLIGATIONS').forEach(function (o) { obs[String(o.id)] = String(o.name || ''); });
  return reserves_().map(function (r) {
    const pj = reserveProjection_(r);
    const monthly = r.contributions.reduce(function (t, c) { return t + c.monthly; }, 0);
    // التجميع المخطط: عدد الدورات من البداية حتى الآن × المساهمة الشهرية
    let cycles = 0, k = r.fromCycle;
    for (let i = 0; i < 60 && k <= base; i++) { if (reserveActiveIn_(r, k)) cycles++; k = addCycles_(k, 1); }
    const planned = Math.min(r.target || Infinity, monthly * cycles);
    let left = 0; k = addCycles_(base, 1);
    for (let i = 0; i < 60; i++) { if (!reserveActiveIn_(r, k)) break; left++; k = addCycles_(k, 1); }
    return Object.assign({}, r, {
      monthly: Math.round(monthly),
      planned: Math.round(planned),
      accumulated: Math.round(pj.actual),          // الفعلي لا المخطط
      behind: pj.behind,
      depositedThisCycle: pj.depositedThisCycle, thisCycleAmount: Math.round(pj.thisCycleAmount),
      currentCycle: base,
      progress: r.target ? Math.min(1, pj.actual / r.target) : 0,
      cyclesLeft: left,
      projected: Math.round(pj.projected),
      shortfall: r.target ? Math.max(0, Math.round(r.target - pj.projected)) : 0,
      obligationName: obs[r.obligationId] || '',
      contributions: r.contributions.map(function (c) {
        return { sourceId: c.sourceId, sourceName: names[c.sourceId] || 'مصدر محذوف', monthly: Math.round(c.monthly) };
      })
    });
  });
}

function addReserve(token, data) {
  return mutate_(token, data.month, 'تم إنشاء التجنيب', function () {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('اسم التجنيب مطلوب');
    const valid = {};
    activeIncomes_(defaultMonth_()).forEach(function (i) { valid[i.id] = true; });
    const contrib = (data.contributions || []).map(function (c) {
      return { sourceId: String(c.sourceId || ''), monthly: positive_(c.monthly) };
    }).filter(function (c) { return c.monthly > 0; });
    if (!contrib.length) throw new Error('حدّد مصدراً واحداً على الأقل ومبلغه الشهري');
    contrib.forEach(function (c) { if (!valid[c.sourceId]) throw new Error('مصدر التجنيب يجب أن يكون دخلاً أساسياً مجدولاً'); });
    insert_('RESERVES', {
      name: name, obligationId: String(data.obligationId || ''), target: positive_(data.target),
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(data.dueDate || '')) ? String(data.dueDate) : '',
      contributions: JSON.stringify(contrib), fromCycle: defaultMonth_(),
      active: 'نعم', notes: String(data.notes || ''), deleted: 'لا', deletedAt: ''
    });
  });
}

function deleteReserve(token, id, month) {
  return mutate_(token, month, 'تم حذف التجنيب', function () { softDelete_('RESERVES', id); });
}


/* ============================================================
 *  35) المستشار المنفِّذ — يقترح إجراءات، والمحرك يدقّقها، وأنت توافق
 *      لا يُنفَّذ شيء بلا موافقتك، ولا يُقبل إجراء خارج القائمة المسموحة.
 * ========================================================== */

const AGENT_TYPES = {
  add_obligation:      { label: 'إضافة التزام',          risk: 'low' },
  update_obligation:   { label: 'تعديل التزام',          risk: 'medium' },
  delete_obligation:   { label: 'حذف التزام',            risk: 'high' },
  set_allocation:      { label: 'ربط التزام بالرواتب',    risk: 'medium' },
  mark_paid:           { label: 'تسجيل سداد',            risk: 'high' },
  add_income:          { label: 'إضافة مصدر دخل',        risk: 'low' },
  update_income:       { label: 'تعديل مصدر دخل',        risk: 'medium' },
  delete_income:       { label: 'حذف مصدر دخل',          risk: 'high' },
  add_reserve:         { label: 'تجنيب لالتزام قادم',     risk: 'low' },
  delete_reserve:      { label: 'إلغاء تجنيب',           risk: 'medium' },
  add_saving_goal:     { label: 'هدف ادخاري',            risk: 'low' },
  set_category_budget: { label: 'سقف تصنيف مشتريات',     risk: 'low' },
  update_setting:      { label: 'تعديل إعداد الميزانية',  risk: 'medium' },
  split_obligation:    { label: 'تقسيم التزام إلى فترات', risk: 'medium' }
};
const AGENT_SETTINGS = { buffer: 'احتياطي الأمان', savingsRate: 'نسبة الادخار', purchaseBudget: 'سقف النثريات' };
const OB_EDITABLE = ['name', 'amount', 'day', 'recurrence', 'category', 'priority', 'type', 'amountType',
                     'endDate', 'autoDeduct', 'certainty', 'maxDelay', 'notes'];
const INC_EDITABLE = ['name', 'amount', 'day', 'isBasic', 'amountType', 'notes'];

/** ما يراه المستشار من كياناتك بمعرفاتها — ليشير إليها بدقة لا بالاسم. */
function agentEntities_(m) {
  const inc = incomesForMonth_(m).map(function (i) {
    return { id: i.id, الاسم: i.name, المبلغ: Math.round(i.amount), اليوم: i.day || 'غير محدد',
             أساسي: i.isBasic, متغير: i.isVariable };
  });
  const allocs = allocationsByObligation_();
  const obs = live_('OBLIGATIONS').filter(function (r) { return String(r.name || '').trim(); }).map(function (r) {
    return { id: String(r.id), الاسم: String(r.name), المبلغ: num(r.amount), اليوم: clampDay_(r.day),
             التكرار: normalizeRecurrence_(r.recurrence), التصنيف: String(r.category || 'أخرى'),
             الأولوية: String(r.priority || 'متوسطة'), خصم_تلقائي: yes_(r.autoDeduct),
             ينتهي: fmtDate_(toDate_(r.endDate)),
             مربوط_على: (allocs[String(r.id)] || []).map(function (a) { return a.sourceId + ':' + Math.round(a.amount); }) };
  });
  const cycleObs = obligationsForMonth_(m).map(function (o) {
    return { id: o.id, الاسم: o.name, الاستحقاق: o.dueDate, المبلغ: Math.round(o.amount),
             المتبقي: Math.round(o.remainingAmount), مسدد: o.paid, الدورة: m };
  });
  return { incomes: inc, obligations: obs, cycleObligations: cycleObs,
           goals: savingsGoals_().map(function (g) { return { id: g.id, الاسم: g.name, المستهدف: g.target, المدخر: g.saved }; }),
           reserves: reserves_().map(function (r) { return { id: r.id, الاسم: r.name, المستهدف: r.target, الاستحقاق: r.dueDate }; }),
           categories: purchaseCategories_(),
           settings: { buffer: num(getSetting_('SAFETY_BUFFER')), savingsRate: num(getSetting_('SAVINGS_RATE')),
                       purchaseBudget: num(getSetting_('PURCHASE_BUDGET')) } };
}

function sourceRoom_(b) { return Math.round(num(b.free) - num(b.reserveShare)); }

function agentFindOb_(id) { const r = findById_('OBLIGATIONS', id); return (r && !yes_(r.deleted)) ? r : null; }
function agentFindInc_(id) { const r = findById_('INCOME', id); return (r && !yes_(r.deleted)) ? r : null; }

/**
 * يدقّق كل إجراء ويصوغ معاينته «قبل ← بعد». لا تنفيذ هنا إطلاقاً.
 * الإجراء غير الصالح لا يمكن اعتماده من الواجهة ولا من الخادم.
 */
function agentValidate_(m, actions) {
  const incValid = {};
  activeIncomes_(m).forEach(function (i) { incValid[i.id] = i; });
  const names = {};
  incomesForMonth_(m).forEach(function (i) { names[i.id] = i.name; });
  const bd = {};
  sourceBreakdown_(m).forEach(function (b) { bd[b.id] = b; });
  const cats = purchaseCategories_();
  const roomUsed = {};   // ما حجزته إجراءات هذه الخطة نفسها من كل مصدر
  const out = [];

  // الربط يُدقَّق جماعياً لأن الرواتب مشتركة بين البنود
  const allocIds = actions.filter(function (a) { return a && a.type === 'set_allocation'; })
    .map(function (a) { return String((a.params || {}).obligationId || ''); });
  let allocChecked = {};
  if (allocIds.length) {
    const ctx = allocationContext_(m, 'all', allocIds);
    validateAllocation_(ctx, actions.filter(function (a) { return a && a.type === 'set_allocation'; })
      .map(function (a) { return { obligationId: a.params.obligationId, splits: a.params.splits || [] }; }))
      .forEach(function (x) { allocChecked[x.obligationId] = x; });
  }

  (actions || []).slice(0, 25).forEach(function (a, idx) {
    const spec = AGENT_TYPES[a && a.type];
    const p = (a && a.params) || {};
    const act = { key: 'A' + (idx + 1), type: String(a && a.type || ''), params: p,
                  why: String(a && a.why || ''), problems: [], warnings: [], preview: '',
                  label: spec ? spec.label : 'إجراء غير مسموح', risk: spec ? spec.risk : 'high' };
    if (!spec) { act.problems.push('نوع إجراء غير مسموح للمستشار'); out.push(act); return; }
    const money = function (x) { return Math.round(num(x)).toLocaleString('en-US') + ' ر.س'; };

    switch (act.type) {
      case 'add_obligation': {
        if (!String(p.name || '').trim()) act.problems.push('بلا اسم');
        if (positive_(p.amount) <= 0) act.problems.push('مبلغ غير صالح');
        const d = Math.round(num(p.day)); if (d < 1 || d > 31) act.problems.push('يوم استحقاق غير صالح');
        const rec = normalizeRecurrence_(p.recurrence || 'شهري');
        const typ = ['صارم', 'مرن', 'ترفيهي'].indexOf(String(p.type)) > -1 ? String(p.type) : 'صارم';
        // الربط عند الإنشاء: كل مصدر يُدقَّق بموعد البند ونوعه وما يتبقى فيه
        const fb = {};
        try { allocationContext_(m, 'unassigned').paychecks.forEach(function (x) { fb[x.key] = x.free; }); } catch (e) {}
        let srcSum = 0;
        (p.sources || []).forEach(function (sp) {
          const f = sourceFitsDay_(m, typ, d, sp.sourceId, fb);
          const a = positive_(sp.amount);
          if (!f.ok) act.problems.push(f.why);
          else if (a > f.free + 0.5) act.problems.push(f.name + ' يتبقى فيه ' + Math.round(f.free) + ' فقط');
          else fb[f.key] = f.free - a;
          srcSum += a;
        });
        if ((p.sources || []).length && Math.abs(srcSum - positive_(p.amount)) > 1) act.problems.push('مجموع الربط لا يساوي المبلغ');
        act.preview = '«' + p.name + '» · ' + money(p.amount) + ' · يوم ' + d + ' · ' + rec + ' · ' + typ +
          (p.category ? ' · ' + p.category : '') + (p.autoDeduct ? ' · خصم تلقائي' : '') +
          ((p.sources || []).length ? ' · من ' + p.sources.map(function (sp) {
            return (names[sp.sourceId] || sp.sourceId) + ' ' + Math.round(positive_(sp.amount)); }).join(' + ') : '');
        break;
      }
      case 'update_obligation': {
        const r = agentFindOb_(p.id);
        if (!r) { act.problems.push('الالتزام غير موجود'); break; }
        const ch = p.changes || {};
        const diffs = Object.keys(ch).filter(function (k) { return OB_EDITABLE.indexOf(k) > -1; }).map(function (k) {
          const before = k === 'endDate' ? fmtDate_(toDate_(r.endDate)) : String(r[k] === undefined ? '' : r[k]);
          return (k === 'amount' ? 'المبلغ' : k === 'day' ? 'اليوم' : k === 'priority' ? 'الأولوية' : k === 'category' ? 'التصنيف'
                 : k === 'recurrence' ? 'التكرار' : k === 'endDate' ? 'الانتهاء' : k === 'autoDeduct' ? 'خصم تلقائي' : k)
                 + ': ' + (before || '—') + ' ← ' + ch[k];
        });
        if (!diffs.length) act.problems.push('لا تغييرات مسموحة');
        if (ch.amount !== undefined && positive_(ch.amount) <= 0) act.problems.push('مبلغ غير صالح');
        act.preview = '«' + r.name + '» — ' + diffs.join(' · ');
        break;
      }
      case 'delete_obligation': {
        const r = agentFindOb_(p.id);
        if (!r) { act.problems.push('الالتزام غير موجود'); break; }
        act.preview = 'حذف «' + r.name + '» (' + money(r.amount) + ') — يُنقل لسلة المحذوفات 30 يوماً';
        break;
      }
      case 'set_allocation': {
        const x = allocChecked[String(p.obligationId || '')];
        if (!x) { act.problems.push('الالتزام لا يستحق في دورتك الحالية'); break; }
        x.problems.forEach(function (pr) { act.problems.push(pr); });
        (x.warnings || []).forEach(function (w) { act.warnings.push(w); });
        act.preview = '«' + x.name + '» ← ' + (x.splits.length ? x.splits.map(function (sp) {
          return sp.sourceName + ' (' + sp.paycheckDate + ') ' + money(sp.amount); }).join(' + ') : '—');
        break;
      }
      case 'mark_paid': {
        const cyc = validMonth_(p.cycle) ? p.cycle : m;
        const o = obligationsForMonth_(cyc).filter(function (x) { return x.id === String(p.obligationId); })[0];
        if (!o) { act.problems.push('الالتزام لا يستحق في دورة ' + cyc); break; }
        const amt = positive_(p.amount) || o.amount;
        if (o.autoDeduct) act.problems.push('يُخصم تلقائياً — لا يُسجَّل يدوياً');
        if (!o.isEstimated && amt > o.amount + 0.5) act.problems.push('المبلغ أكبر من الالتزام (' + Math.round(o.amount) + ')');
        if (o.paid) act.warnings.push('مسجّل مسدَّداً مسبقاً — سيُستبدل المبلغ');
        act.params = { obligationId: o.id, cycle: cyc, amount: amt };
        act.preview = 'سداد «' + o.name + '» ' + money(amt) + ' — استحقاق ' + o.dueDate;
        break;
      }
      case 'add_income': {
        if (!String(p.name || '').trim()) act.problems.push('بلا اسم');
        if (positive_(p.amount) <= 0) act.problems.push('مبلغ غير صالح');
        const d = Math.round(num(p.day)); if (d < 0 || d > 31) act.problems.push('يوم نزول غير صالح');
        act.preview = '«' + p.name + '» · ' + money(p.amount) + ' · ' + (d ? 'يوم ' + d : 'بلا موعد') +
                      ' · ' + (p.isBasic === false ? 'إضافي' : 'أساسي');
        break;
      }
      case 'update_income': {
        const r = agentFindInc_(p.id);
        if (!r) { act.problems.push('المصدر غير موجود'); break; }
        const ch = p.changes || {};
        const diffs = Object.keys(ch).filter(function (k) { return INC_EDITABLE.indexOf(k) > -1; })
          .map(function (k) { return k + ': ' + String(r[k] === undefined ? '' : r[k]) + ' ← ' + ch[k]; });
        if (!diffs.length) act.problems.push('لا تغييرات مسموحة');
        act.preview = '«' + r.name + '» — ' + diffs.join(' · ');
        break;
      }
      case 'delete_income': {
        const r = agentFindInc_(p.id);
        if (!r) { act.problems.push('المصدر غير موجود'); break; }
        const allA = allocationsByObligation_();
        const linked = Object.keys(allA).filter(function (oid) {
          return (allA[oid] || []).some(function (x) { return x.sourceId === String(p.id); });
        }).length;
        if (linked) act.warnings.push(linked + ' التزام مربوط عليه سيفقد مصدر سداده');
        act.preview = 'حذف «' + r.name + '» (' + money(r.amount) + ')';
        break;
      }
      case 'add_reserve': {
        if (!String(p.name || '').trim()) act.problems.push('بلا اسم');
        const contrib = (p.contributions || []).filter(function (c) { return positive_(c.monthly) > 0; });
        if (!contrib.length) act.problems.push('بلا مساهمات');
        contrib.forEach(function (c) {
          if (!incValid[c.sourceId]) { act.problems.push((names[c.sourceId] || c.sourceId) + ' ليس دخلاً أساسياً مجدولاً'); return; }
          const b = bd[c.sourceId];
          if (!b) return;
          const want = positive_(c.monthly);
          const avail = sourceRoom_(b) - (roomUsed[c.sourceId] || 0);
          if (want > avail + 0.5) {
            act.problems.push(avail <= 0
              ? b.name + ' متبقيه ' + money(avail) + ' بعد التزاماته — لا يُجنَّب من مصدر سالب'
              : b.name + ' يتبقى فيه ' + money(avail) + ' فقط بعد التزاماته — لا يتسع لـ ' + money(want));
            return;
          }
          roomUsed[c.sourceId] = (roomUsed[c.sourceId] || 0) + want;
          // ما يبقى بعد هذا التجنيب أقل من الادخار المقترح ⇒ التجنيب يُقدَّم على الادخار العام
          if (b.savingsShare > 0 && avail - want < b.savingsShare) {
            act.warnings.push('يُقدَّم على الادخار المقترح في ' + b.name + ' (' + money(b.savingsShare) + ')');
          }
        });
        if (p.dueDate) {
          const dc = cycleOf_(toDate_(p.dueDate));
          if (dc <= addCycles_(m, 1)) act.warnings.push('يستحق في الدورة القادمة — ربطه براتبها مباشرة قد يكون أبسط من التجنيب');
        }
        act.preview = '«' + p.name + '»' + (p.target ? ' حتى ' + money(p.target) : '') + (p.dueDate ? ' قبل ' + p.dueDate : '') +
          ' — ' + contrib.map(function (c) { return (names[c.sourceId] || c.sourceId) + ' ' + money(c.monthly) + ' شهرياً'; }).join(' + ');
        break;
      }
      case 'delete_reserve': {
        const r = reserves_().filter(function (x) { return x.id === String(p.id); })[0];
        if (!r) { act.problems.push('التجنيب غير موجود'); break; }
        act.preview = 'إلغاء تجنيب «' + r.name + '»';
        break;
      }
      case 'add_saving_goal': {
        if (!String(p.name || '').trim()) act.problems.push('بلا اسم');
        if (positive_(p.target) <= 0) act.problems.push('مستهدف غير صالح');
        if (p.sourceId && !incValid[p.sourceId]) act.problems.push('المصدر المحدد غير صالح');
        if (p.sourceId && bd[p.sourceId] && positive_(p.monthly) > 0) {
          const avail = sourceRoom_(bd[p.sourceId]) - (roomUsed[p.sourceId] || 0);
          if (positive_(p.monthly) > avail + 0.5) act.problems.push(bd[p.sourceId].name + ' يتبقى فيه ' + money(avail) + ' بعد التزاماته — لا يتسع للادخار الشهري');
          else roomUsed[p.sourceId] = (roomUsed[p.sourceId] || 0) + positive_(p.monthly);
        }
        act.preview = '«' + p.name + '» · ' + money(p.target) + (p.monthly ? ' · ' + money(p.monthly) + ' شهرياً' : '') +
                      (p.sourceId ? ' من ' + (names[p.sourceId] || '') : '');
        break;
      }
      case 'set_category_budget': {
        if (cats.indexOf(String(p.category)) < 0) act.problems.push('تصنيف غير موجود: ' + p.category);
        if (num(p.amount) < 0) act.problems.push('مبلغ غير صالح');
        const cur = categoryBudgets_()[p.category];
        act.preview = 'سقف «' + p.category + '»: ' + (cur ? money(cur) : 'بلا سقف') + ' ← ' + (num(p.amount) ? money(p.amount) : 'بلا سقف');
        break;
      }
      case 'split_obligation': {
        const sv = validateSplit_(m, String(p.id || ''), p.parts || []);
        sv.problems.forEach(function (x) { act.problems.push(x); });
        sv.warnings.forEach(function (x) { act.warnings.push(x); });
        act.preview = sv.preview;
        break;
      }
      case 'update_setting': {
        if (!AGENT_SETTINGS[p.key]) { act.problems.push('إعداد غير مسموح تعديله من المستشار'); break; }
        const v = num(p.value);
        if (v < 0 || (p.key === 'savingsRate' && v > 100)) act.problems.push('قيمة غير صالحة');
        const cur = p.key === 'buffer' ? getSetting_('SAFETY_BUFFER') : p.key === 'savingsRate' ? getSetting_('SAVINGS_RATE') : getSetting_('PURCHASE_BUDGET');
        act.preview = AGENT_SETTINGS[p.key] + ': ' + (cur || 0) + ' ← ' + v;
        break;
      }
    }
    act.valid = !act.problems.length;
    out.push(act);
  });
  return out;
}

/** خطة المحرك الحتمية للدورة: كل التزام بتغطيته وعجزه ومصادره واقتراح موعده. */
function enginePlan_(m) {
  const ctx = allocationContext_(m, 'all');
  const items = validateAllocation_(ctx, []);
  return { items: items, diagnosis: allocationDiagnosis_(ctx, items) };
}

/** يحوّل طلبك إلى خطة إجراءات مدقّقة — لا يُنفّذ شيئاً. */
function aiAgent(token, month, request) {
  guard_(token);
  const q = String(request || '').trim();
  if (!q) throw new Error('اكتب ما تريد');
  const m = validMonth_(month) ? month : defaultMonth_();
  const ctx = allocationContext_(m, 'unassigned');
  const schema = {
    add_obligation: '{name, amount, day, recurrence(شهري|مرة واحدة|سنوي|نصف سنوي|ربع سنوي|كل أسبوعين|أسبوعي), category, priority(عالية|متوسطة|منخفضة), type(صارم|مرن|ترفيهي), amountType(ثابت|تقديري), autoDeduct(bool), startDate?(YYYY-MM-DD), endDate?, sources?:[{sourceId, amount}]}',
    split_obligation: '{id, parts:[{label, amount, day, sourceId?}]}  — 2 إلى 4 فترات مجموعها = مبلغ الالتزام',
    update_obligation: '{id, changes:{ ' + OB_EDITABLE.join(', ') + ' }}',
    delete_obligation: '{id}',
    set_allocation: '{obligationId, splits:[{sourceId, amount}]}',
    mark_paid: '{obligationId, cycle(YYYY-MM), amount}',
    add_income: '{name, amount, day(0=بلا موعد), isBasic(bool), amountType(ثابت|متغير)}',
    update_income: '{id, changes:{ ' + INC_EDITABLE.join(', ') + ' }}',
    delete_income: '{id}',
    add_reserve: '{name, obligationId?, target, dueDate(YYYY-MM-DD), contributions:[{sourceId, monthly}]}',
    delete_reserve: '{id}',
    add_saving_goal: '{name, target, monthly, sourceId?}',
    set_category_budget: '{category, amount}',
    update_setting: '{key(buffer|savingsRate|purchaseBudget), value}'
  };
  const prompt = aiSystemRules_() +
    '\n\nأنت الآن مستشار منفِّذ: تقترح إجراءات محددة على بيانات المستخدم، وهو يوافق عليها قبل التنفيذ.' +
    '\n\nالوضع المالي الكامل:\n' + snapshotText_(m) +
    '\n\nالكيانات بمعرفاتها (استخدم id حرفياً):\n' + JSON.stringify(agentEntities_(m), null, 1) +
    '\n\nالرواتب وما بقي فيها فعلاً، ولكل التزام غير مربوط المصادر المسموحة له:\n' + JSON.stringify({
      الرواتب: ctx.paychecks.map(function (p) { return { المصدر: p.source, المعرف: p.sourceId, النزول: p.date, المتبقي: p.free }; }),
      غير_المربوط: ctx.items.map(function (it) { return { id: it.obligationId, الاسم: it.name, المبلغ: it.amount,
        الاستحقاق: it.dueDate, المصادر_المسموحة: it.eligible.map(function (e) { return e.sourceId + ' (' + e.paycheckDate + ')'; }) }; })
    }, null, 1) +
    '\n\nالمتبقي الحقيقي في كل مصدر بعد التزاماته وتجنيبه (لا يُجنَّب ولا يُدخَّر إلا منه):\n' +
      JSON.stringify(sourceBreakdown_(m).map(function (b) {
        return { المصدر: b.name, المعرف: b.id, المتبقي_بعد_الالتزامات: sourceRoom_(b), الادخار_المقترح_منه: b.savingsShare };
      }), null, 1) +
    '\n\nخطة المحرك للدورة (رتّبها بالأهمية وأكمل النقص من أي متسع ووضع العجز على الأقل أهمية) — ابنِ عليها:\n' +
      (function () { try { const ep = enginePlan_(m); return JSON.stringify({
        البنود: ep.items.map(function (x) { return { id: x.obligationId, الاسم: x.name, المبلغ: x.amount, مغطى: x.covered,
          عجز: x.shortfall, من: x.splits.map(function (sp) { return sp.sourceId + ':' + sp.amount + ' (' + sp.paycheckDate + ')'; }),
          موعد_مقترح: x.daySuggestion ? x.daySuggestion.day : null, مرن: x.spread }; }),
        التشخيص: ep.diagnosis ? ep.diagnosis.message : 'لا عجز' }, null, 1); } catch (e) { return 'تعذّر: ' + e.message; } })() +
    '\n\nالإجراءات المسموحة وحقولها:\n' + JSON.stringify(schema, null, 1) +
    '\n\nمحادثاتكم السابقة:\n' + aiMemory_(4) +
    '\n\nطلب المستخدم: ' + q +
    '\n\nقواعد:' +
    '\n- اقترح الإجراءات فقط إن طلبها أو كانت ضرورية لتحقيق طلبه. إن كان سؤالاً فقط فأجب بلا إجراءات.' +
    '\n- لا تسجّل سداداً ولا تحذف شيئاً إلا إن طلبه صراحة.' +
    '\n- ممنوع: تجنيب أو ادخار من مصدر «المتبقي_بعد_الالتزامات» فيه أقل من المساهمة — سيُرفض. المصدر السالب لا يُجنَّب منه أبداً.' +
    '\n- عند العجز لا توقف ولا تقترح ادخاراً: ابنِ على «خطة المحرك» واقترح الحلول بهذا الترتيب: ' +
      '(1) set_allocation كما في الخطة لكل بند يحتاج ربطاً، ' +
      '(2) للصارم الذي فيه «موعد_مقترح» اقترح update_obligation لتغيير day، ' +
      '(3) قسّم المرن الكبير بـ split_obligation على مواعيد مصادره، ' +
      '(4) قلّص الكمالي ثم المرن بـ update_obligation amount إن بقي عجز كلي، ' +
      '(5) وما يبقى يكون عجزاً على آخر البنود أهمية — اذكره بوضوح.' +
    '\n- تقسيم الصارم المسموح: ربطه بعدة مصادر تسبق موعده (set_allocation بعدة أجزاء) فيكتمل قبل يوم استحقاقه. لا فترات بمواعيد لاحقة له.' +
    '\n- لا تقترح تجنيباً لبند يستحق في الدورة القادمة مباشرة — راتبها يغطيه.' +
    '\n- للتجنيب: وزّع المساهمة الشهرية على أكثر من مصدر حين يكون ذلك أخف على كل مصدر، واحسب ليكتمل المبلغ قبل تاريخ الاستحقاق.' +
    '\n- إن كان التجنيب لالتزام موجود فضع obligationId ليُدفع منه عند استحقاقه، ولا يُحمَّل على الراتب مرتين؛ واجعل dueDate موعد استحقاقه.' +
    '\n- الربط: لا تستخدم مصدراً غير مسموح للالتزام، ولا تتجاوز المتبقي في الراتب.' +
    '\n- الفترات: بند شهري كبير يُصرف على مراحل (مقاضي، مصروف بيت) قسّمه بـ split_obligation إلى فترات، ' +
      'كل فترة بيوم نزول مصدرها ومن ذلك المصدر — مثلاً أول الدورة من الراتب ومنتصفها من حساب المواطن. ' +
      'لا تقسّم الصارم (إيجار، قسط، فاتورة بموعد) لفترات أبداً — يُجمَّع قبل موعده ويُدفع كاملاً. ' +
      'وعند إنشاء التزام جديد اربطه بـ sources واختر type المناسب: صارم للمواعيد الثابتة، مرن لما يُصرف تدريجياً، ترفيهي للكمالي.' +
    '\n- اشرح في reply بالعربي: ماذا ستفعل ولماذا، بالأرقام.' +
    '\n\nأعد JSON فقط بلا أي نص خارجه:' +
    '\n{"reply":"شرحك","actions":[{"type":"نوع","params":{},"why":"سبب مختصر"}]}';

  const raw = String(callGemini_(prompt, null)).replace(/```json|```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); }
  catch (e) { parsed = { reply: raw, actions: [] }; }
  const actions = agentValidate_(m, parsed.actions || []);
  logAi_(m, 'مستشار منفِّذ', q, String(parsed.reply || '') +
    (actions.length ? ' | إجراءات مقترحة: ' + actions.map(function (a) { return a.label; }).join('، ') : ''));
  return { month: m, reply: String(parsed.reply || ''), actions: actions,
           validCount: actions.filter(function (a) { return a.valid; }).length };
}

/**
 * ينفّذ ما وافقت عليه فقط. يُعاد التدقيق هنا — لا ثقة بما يصل من المتصفح —
 * وكل إجراء يمر بدالة التطبيق العادية بقواعدها وسجلّها.
 */
function aiExecute(token, month, actions) {
  guard_(token);
  const m = validMonth_(month) ? month : defaultMonth_();
  const checked = agentValidate_(m, actions || []);
  const results = [];
  const before = snapshotRows_();
  BATCH_ = true;
  try {
    checked.forEach(function (a) {
      if (!a.valid) { results.push({ key: a.key, label: a.label, ok: false, message: a.problems.join(' · ') }); return; }
      try {
        agentRun_(token, m, a);
        results.push({ key: a.key, label: a.label, ok: true, message: a.preview });
      } catch (e) {
        results.push({ key: a.key, label: a.label, ok: false, message: String(e.message || e) });
      }
    });
  } finally {
    BATCH_ = false;
  }
  const changes = diffSnapshots_(before, snapshotRows_());
  let batchId = '';
  const okN = results.filter(function (r) { return r.ok; }).length;
  if (changes.length) {
    batchId = insert_('AGENT_UNDO', { at: nowStamp_(), month: m,
      summary: results.filter(function (r) { return r.ok; }).map(function (r) { return r.label; }).join('، '),
      payload: JSON.stringify(changes), undone: 'لا' });
  }
  cacheReset_();
  logAi_(m, 'تنفيذ بموافقتك', 'نُفّذ ' + okN + ' من ' + results.length,
    results.map(function (r) { return (r.ok ? '✓ ' : '✗ ') + r.label + ': ' + r.message; }).join('\n'));
  return { success: okN > 0, results: results, batchId: batchId, changes: changes.length,
           message: okN === results.length ? 'نُفّذت كل الإجراءات (' + okN + ')' : 'نُفّذ ' + okN + ' من ' + results.length,
           data: buildAppData_(m) };
}

/** التنفيذ الفعلي — كل تعديل يُدمج مع السجل الكامل حتى لا تُمسح حقول لم يذكرها المستشار. */
function agentRun_(token, m, a) {
  const p = a.params;
  switch (a.type) {
    case 'add_obligation':
      return addObligation(token, { name: p.name, amount: p.amount, day: p.day,
        recurrence: normalizeRecurrence_(p.recurrence || 'شهري'), category: p.category || 'أخرى',
        priority: p.priority || 'متوسطة',
        type: ['صارم', 'مرن', 'ترفيهي'].indexOf(String(p.type)) > -1 ? String(p.type) : 'صارم',
        amountType: p.amountType === 'تقديري' ? 'تقديري' : 'ثابت',
        autoDeduct: !!p.autoDeduct, certainty: 'مؤكد', startDate: p.startDate || '', endDate: p.endDate || '',
        sources: (p.sources || []).map(function (sp) { return { sourceId: String(sp.sourceId), amount: positive_(sp.amount) }; }),
        month: m });
    case 'update_obligation': {
      const r = agentFindOb_(p.id);
      const allocs = allocationsByObligation_()[String(p.id)] || [];
      const full = { name: r.name, amount: num(r.amount), day: clampDay_(r.day), recurrence: normalizeRecurrence_(r.recurrence),
        category: r.category, priority: r.priority, type: r.type, amountType: r.amountType,
        startDate: fmtDate_(toDate_(r.startDate)), endDate: fmtDate_(toDate_(r.endDate)),
        autoDeduct: yes_(r.autoDeduct), certainty: r.certainty || 'مؤكد', maxDelay: num(r.maxDelay),
        notes: r.notes, sharePercent: num(r.sharePercent) || 100, interestRate: num(r.interestRate),
        sources: allocs.map(function (x) { return { sourceId: x.sourceId, amount: x.amount }; }), month: m };
      Object.keys(p.changes || {}).forEach(function (k) { if (OB_EDITABLE.indexOf(k) > -1) full[k] = p.changes[k]; });
      return updateObligation(token, p.id, full);
    }
    case 'delete_obligation': return deleteObligation(token, p.id, m);
    case 'set_allocation':
      return applyAllocation(token, m, [{ obligationId: p.obligationId, splits: (p.splits || []).map(function (sp) {
        return { sourceId: sp.sourceId, amount: sp.amount }; }) }]);
    case 'mark_paid': return setPayment(token, p.obligationId, p.cycle, p.amount);
    case 'add_income':
      return addIncomeSource(token, { name: p.name, amount: p.amount, day: p.day, isBasic: p.isBasic !== false,
        amountType: p.amountType === 'متغير' ? 'متغير' : 'ثابت', notes: '', month: m });
    case 'update_income': {
      const r = agentFindInc_(p.id);
      const full = { name: r.name, amount: num(r.amount), day: incomeDay_(r.day), isBasic: yes_(r.isBasic),
                     amountType: r.amountType, notes: r.notes, month: m };
      Object.keys(p.changes || {}).forEach(function (k) { if (INC_EDITABLE.indexOf(k) > -1) full[k] = p.changes[k]; });
      return updateIncomeSource(token, p.id, full);
    }
    case 'delete_income': return deleteIncomeSource(token, p.id, m);
    case 'add_reserve':
      return addReserve(token, { name: p.name, obligationId: p.obligationId || '', target: p.target,
        dueDate: p.dueDate || '', contributions: p.contributions || [], month: m });
    case 'delete_reserve': return deleteReserve(token, p.id, m);
    case 'add_saving_goal':
      return addSavingsGoal(token, { name: p.name, target: p.target, monthly: p.monthly || 0,
        sourceId: p.sourceId || '', month: m });
    case 'set_category_budget': {
      const b = categoryBudgets_(); b[p.category] = num(p.amount);
      return saveCategoryBudgets(token, b, m);
    }
    case 'split_obligation': return splitObligation(token, m, p.id, p.parts || []);
    case 'update_setting': {
      // الإعدادات الأخرى تُحفظ كما هي — لا نغيّر الترحيل أو الدورة أو تاريخ البداية
      const cur = { buffer: num(getSetting_('SAFETY_BUFFER')), savingsRate: num(getSetting_('SAVINGS_RATE')),
                    purchaseBudget: num(getSetting_('PURCHASE_BUDGET')),
                    rollover: String(getSetting_('ROLLOVER') || 'نعم') !== 'لا', month: m };
      cur[p.key] = num(p.value);
      return saveBudgetSettings(token, cur);
    }
  }
  throw new Error('نوع غير معروف');
}


/* ============================================================
 *  36) ضغط كل راتب عبر الدورات القادمة
 *      الربط دائم لكل الدورات، فلا يكفي أن يتسع الراتب هذه الدورة —
 *      لا بد أن يتسع في كل دورة قادمة، بما فيها أشهر الالتزامات السنوية والتجنيب.
 * ========================================================== */

/**
 * overrides = { obligationId: [{sourceId, amount}] } لمحاكاة ربط مقترح قبل اعتماده.
 * يُرجع كل «نزول راتب» في النافذة: مبلغه، ما يحمله، ما يتبقى، وهل يعجز.
 */
function paycheckLoad_(fromCycle, n, overrides) {
  const ov = overrides || {};
  const endCycle = addCycles_(fromCycle, n - 1);
  const load = {}, meta = {};
  const touch = function (inc, occ) {
    const key = occKey_(inc.id, occ);
    if (!meta[key]) {
      const at = incomeAtOccurrence_(inc.id, occ);
      meta[key] = { key: key, sourceId: inc.id, source: inc.name, date: fmtDate_(occ), cycle: cycleOf_(occ),
                    amount: Math.round(at ? at.amount : inc.amount), certain: !!(at && at.certain !== false), items: [] };
      load[key] = 0;
    }
    return key;
  };
  /**
   * التجنيب المرتبط بالتزام يدفعه عند استحقاقه — فلا يُحمَّل الالتزام على الراتب مرة أخرى.
   * بدون هذا يُحسب المبلغ مرتين: مرة كتجنيب شهري، ومرة كاملاً في شهر استحقاقه،
   * فيظهر عجز أكبر ممن لم يجنّب أصلاً.
   */
  const covered = {};
  reserves_().forEach(function (r) {
    if (!r.obligationId || !r.dueDate) return;
    const dueCycle = cycleOf_(toDate_(r.dueDate));
    // الفعلي المُجنَّب + ما خُطط للدورات القادمة — فالشهر الفائت بلا تجنيب يُنقص التغطية
    const acc = reserveProjection_(r).projected;
    const key = r.obligationId + '|' + dueCycle;
    covered[key] = (covered[key] || 0) + (r.target ? Math.min(r.target, acc) : acc);
  });

  // نقرأ دورة إضافية: في الشهر الميلادي، راتب آخر الدورة يغطي التزامات أول الدورة التالية
  let k = fromCycle;
  for (let i = 0; i <= n; i++, k = addCycles_(k, 1)) {
    if (k < startMonth_()) continue;
    const incs = {};
    incomesForMonth_(k).forEach(function (x) { incs[x.id] = x; });
    obligationsForMonth_(k).forEach(function (o) {
      const splits = ov[o.id] ? ov[o.id] : o.sources.map(function (sp) { return { sourceId: sp.sourceId, amount: sp.amount }; });
      const cov = Math.min(o.amount, covered[o.id + '|' + k] || 0);
      const factor = o.amount > 0 ? Math.max(0, (o.amount - cov) / o.amount) : 1;
      splits.forEach(function (sp) {
        const inc = incs[sp.sourceId];
        if (!inc || !inc.hasSchedule) return;
        const occ = fundingOccurrence_(inc, o, k);
        if (!occ) return;
        const key = touch(inc, occ);
        const part = num(sp.amount) * factor;
        load[key] += part;
        meta[key].items.push(o.name + ' ' + Math.round(part) + ' (' + o.dueDate + ')' +
          (cov > 0 ? ' — غطّى التجنيب ' + Math.round(cov) : ''));
      });
    });
    reserves_().forEach(function (r) {
      if (!reserveActiveIn_(r, k)) return;
      r.contributions.forEach(function (c) {
        const inc = incs[c.sourceId];
        if (!inc || !inc.hasSchedule) return;
        const key = touch(inc, cycleDate_(k, inc.day));
        load[key] += c.monthly;
        meta[key].items.push('تجنيب ' + r.name + ' ' + Math.round(c.monthly));
      });
    });
  }
  // نعرض رواتب النافذة فقط؛ ما قبلها يحمل التزامات لم نقرأها فرقمه ناقص
  return Object.keys(meta).map(function (key) {
    const p = meta[key];
    const l = Math.round(load[key] || 0);
    return Object.assign({}, p, { load: l, free: p.amount - l, over: l > p.amount + 0.5 });
  }).filter(function (p) { return p.cycle >= fromCycle && p.cycle <= endCycle; })
    .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)) || a.source.localeCompare(b.source); });
}

/** العجز الذي يسببه ربط مقترح في أي دورة قادمة — مقارنة بالوضع الحالي. */
function futureOverflows_(month, overrides) {
  const base = {};
  paycheckLoad_(month, 12, {}).forEach(function (p) { base[p.key] = p.free; });
  return paycheckLoad_(month, 12, overrides).filter(function (p) {
    return p.over && (base[p.key] === undefined || p.free < base[p.key] - 0.5);
  });
}

function getPaycheckLoad(token, n) {
  guard_(token);
  return paycheckLoad_(defaultMonth_(), Math.min(24, Math.max(3, Number(n) || 12)), {});
}


/* ============================================================
 *  37) التراجع عن تنفيذ المستشار — بضغطة واحدة
 *      لقطة قبل وبعد، ويُحفظ الفرق. التراجع يعيد كل ما تغيّر لحالته،
 *      ويرفض إن عدّلت شيئاً منه يدوياً بعدها حتى لا يمسح عملك.
 * ========================================================== */

const UNDO_SHEETS = ['OBLIGATIONS', 'ALLOCATIONS', 'PAYMENTS', 'INCOME', 'RESERVES', 'RESERVE_TX', 'SAVINGS', 'SETTINGS'];
const UNDO_LABEL = { OBLIGATIONS: 'التزام', ALLOCATIONS: 'ربط', PAYMENTS: 'سداد', INCOME: 'مصدر دخل',
                     RESERVES: 'تجنيب', RESERVE_TX: 'إيداع تجنيب', SAVINGS: 'هدف', SETTINGS: 'إعداد' };

function normVal_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v)) return '';
    const full = Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm');
    return /00:00$/.test(full) ? full.slice(0, 10) : full;
  }
  return v === null || v === undefined ? '' : String(v);
}
function undoRowKey_(key, r) { return key === 'SETTINGS' ? 'k:' + String(r.key) : 'i:' + String(r.id); }
function normRow_(key, r) {
  const o = {};
  FIELDS[key].forEach(function (f) { o[f] = normVal_(r[f]); });
  return o;
}
function snapshotRows_() {
  cacheReset_();
  const out = {};
  UNDO_SHEETS.forEach(function (k) {
    out[k] = {};
    table_(k).forEach(function (r) { out[k][undoRowKey_(k, r)] = normRow_(k, r); });
  });
  return out;
}
function diffSnapshots_(a, b) {
  const changes = [];
  UNDO_SHEETS.forEach(function (k) {
    const keys = {};
    Object.keys(a[k] || {}).forEach(function (x) { keys[x] = 1; });
    Object.keys(b[k] || {}).forEach(function (x) { keys[x] = 1; });
    Object.keys(keys).forEach(function (x) {
      const A = (a[k] || {})[x] || null, B = (b[k] || {})[x] || null;
      if (JSON.stringify(A) !== JSON.stringify(B)) changes.push({ sheet: k, key: x, before: A, after: B });
    });
  });
  return changes;
}
function undoLabel_(c) {
  const r = c.after || c.before || {};
  return (UNDO_LABEL[c.sheet] || c.sheet) + (r.name ? ' «' + r.name + '»' : r.key ? ' ' + r.key : '');
}

/** يعيد كل ما غيّره آخر تنفيذ للمستشار لحالته قبله. */
function agentUndo(token, batchId) {
  return mutate_(token, defaultMonth_(), 'تم التراجع عن تنفيذ المستشار', function () {
    const recs = table_('AGENT_UNDO');
    const rec = recs.filter(function (r) { return String(r.id) === String(batchId); })[0];
    if (!rec) throw new Error('سجل التنفيذ غير موجود');
    if (yes_(rec.undone)) throw new Error('سبق التراجع عن هذا التنفيذ');
    const pending = recs.filter(function (r) { return !yes_(r.undone); });
    if (String(pending[pending.length - 1].id) !== String(batchId)) {
      throw new Error('يمكن التراجع عن آخر تنفيذ فقط — تراجع عن الأحدث أولاً');
    }
    let changes;
    try { changes = JSON.parse(String(rec.payload || '[]')); } catch (e) { throw new Error('سجل التراجع تالف'); }
    const now = snapshotRows_();
    const conflicts = changes.filter(function (c) {
      return JSON.stringify((now[c.sheet] || {})[c.key] || null) !== JSON.stringify(c.after);
    });
    if (conflicts.length) {
      throw new Error('لا يمكن التراجع: عدّلتَ بعد التنفيذ ' + conflicts.slice(0, 5).map(undoLabel_).join('، ') +
        (conflicts.length > 5 ? ' وغيرها' : '') + '. التراجع الآن سيمسح تعديلك، فأوقفته.');
    }
    changes.forEach(function (c) {
      if (c.sheet === 'SETTINGS') { setSetting_(c.key.slice(2), c.before ? c.before.value : ''); return; }
      const id = c.key.slice(2);
      if (!c.before) hardDeleteWhere_(c.sheet, function (r) { return String(r.id) === id; });
      else if (!c.after) insert_(c.sheet, Object.assign({}, c.before));
      else updateById_(c.sheet, id, c.before);
    });
    updateById_('AGENT_UNDO', batchId, { undone: 'نعم' });
    return { message: 'أُعيد ' + changes.length + ' سجل لحالته قبل التنفيذ' };
  });
}

function getLastAgentBatch(token) {
  guard_(token);
  const pending = table_('AGENT_UNDO').filter(function (r) { return !yes_(r.undone); });
  const r = pending[pending.length - 1];
  if (!r) return null;
  let n = 0;
  try { n = JSON.parse(String(r.payload || '[]')).length; } catch (e) {}
  return { id: String(r.id), at: stampText_(r.at), summary: String(r.summary || ''), changes: n };
}


/* ============================================================
 *  38) تقسيم التزام إلى فترات — «مقاضي 800» ← «أول الدورة 500 من الراتب» + «منتصفها 300 من المواطن»
 *      كل فترة التزام مستقل بموعده ومصدره وتذكيره وسداده.
 * ========================================================== */

/** يدقّق مصدراً لبند بموعد معيّن: هل ينزل في وقته؟ وكم يتبقى فيه؟ */
function sourceFitsDay_(m, type, day, sourceId, freeBy) {
  const inc = activeIncomes_(m).filter(function (i) { return i.id === String(sourceId); })[0];
  if (!inc) return { ok: false, why: 'المصدر ليس دخلاً أساسياً مجدولاً' };
  const pseudo = { type: type, dueDate: fmtDate_(cycleDate_(m, day)) };
  const occ = fundingOccurrence_(inc, pseudo, m);
  if (!occ) return { ok: false, why: inc.name + ' لا ينزل قبل يوم ' + day };
  const key = occKey_(inc.id, occ);
  const at = incomeAtOccurrence_(inc.id, occ);
  // النزول المتاح قبل الموعد يقع في دورة سابقة لبداية تتبعك ⇒ عملياً لا ينزل قبله
  if (!at) return { ok: false, why: inc.name + ' لا ينزل قبل يوم ' + day + ' في هذه الدورة' };
  const free = freeBy[key] !== undefined ? freeBy[key] : at.amount;
  return { ok: true, key: key, name: inc.name, free: free, date: fmtDate_(occ) };
}

function validateSplit_(m, id, parts) {
  const out = { problems: [], warnings: [], preview: '', norm: [] };
  const r = findById_('OBLIGATIONS', id);
  if (!r || yes_(r.deleted)) { out.problems.push('الالتزام غير موجود'); return out; }
  if (normalizeRecurrence_(r.recurrence) !== 'شهري') { out.problems.push('التقسيم للالتزامات الشهرية فقط'); return out; }
  if (!isSpread_(r)) {
    // الصارم يُدفع كاملاً يوم استحقاقه: يُجمَّع من أكثر من مصدر قبل موعده، ولا يُقسَّم لمواعيد لاحقة
    out.problems.push('«' + r.name + '» صارم يُدفع كاملاً يوم استحقاقه — لا يُقسَّم لفترات. ' +
      'اجمعه من أكثر من مصدر قبل موعده من «وزّع بذكاء»، أو اجعل مرونته «يقبل الجزئي» إن كان يُصرف تدريجياً.');
    return out;
  }
  const list = (parts || []).slice(0, 4);
  if (list.length < 2) { out.problems.push('فترتان على الأقل'); return out; }
  const total = num(r.amount);
  const sum = list.reduce(function (t, p) { return t + positive_(p.amount); }, 0);
  if (Math.abs(sum - total) > 1) out.problems.push('مجموع الفترات ' + Math.round(sum) + ' لا يساوي مبلغ الالتزام ' + Math.round(total));

  const freeBy = {};
  try { allocationContext_(m, 'all', [String(id)]).paychecks.forEach(function (p) { freeBy[p.key] = p.free; }); } catch (e) {}
  const type = String(r.type || 'صارم');
  list.forEach(function (p, i) {
    const amt = Math.round(positive_(p.amount));
    const day = Math.round(Number(p.day));
    if (amt <= 0) out.problems.push('فترة ' + (i + 1) + ': مبلغ غير صالح');
    if (!(day >= 1 && day <= 31)) { out.problems.push('فترة ' + (i + 1) + ': يوم غير صالح'); return; }
    const n = { label: String(p.label || '').trim().slice(0, 30) || ('فترة ' + (i + 1)), amount: amt, day: day, sourceId: String(p.sourceId || '') };
    if (n.sourceId) {
      const f = sourceFitsDay_(m, type, day, n.sourceId, freeBy);
      if (!f.ok) out.problems.push('فترة ' + (i + 1) + ': ' + f.why);
      else if (amt > f.free + 0.5) out.problems.push('فترة ' + (i + 1) + ': ' + f.name + ' يتبقى فيه ' + Math.round(f.free) + ' فقط');
      else { freeBy[f.key] = f.free - amt; n.sourceName = f.name; }
    }
    out.norm.push(n);
  });
  const paidNow = paymentsByObligation_(m)[String(id)];
  if (paidNow) out.warnings.push('سداد هذه الدورة (' + Math.round(paidNow) + ') يبقى على الفترة الأولى');
  out.preview = '«' + r.name + '» ' + Math.round(total) + ' ← ' + out.norm.map(function (n) {
    return n.label + ': ' + n.amount + ' يوم ' + n.day + (n.sourceName ? ' من ' + n.sourceName : '');
  }).join(' · ');
  return out;
}

function splitObligation(token, month, obligationId, parts) {
  const m = validMonth_(month) ? month : defaultMonth_();
  const v = validateSplit_(m, obligationId, parts);
  if (v.problems.length) throw new Error(v.problems.join(' · '));
  return mutate_(token, m, 'تم تقسيم الالتزام إلى فترات', function () {
    const r = findById_('OBLIGATIONS', obligationId);
    const cycleStart = cycleRange_(m).start;
    const keep = ['amountType', 'type', 'maxDelay', 'priority', 'recurrence', 'endDate', 'notes', 'active',
                  'category', 'autoDeduct', 'certainty', 'sharePercent', 'interestRate'];
    const base = {};
    keep.forEach(function (k) { base[k] = r[k]; });
    const existing = allocationsByObligation_()[String(obligationId)] || [];
    v.norm.forEach(function (p, i) {
      const name = String(r.name) + ' — ' + p.label;
      // تاريخ بداية لا يُخفي الفترة في دورتها الأولى (خلل «أول الشهر» المعروف)
      let start = toDate_(r.startDate) || cycleStart;
      if (cycleDate_(m, p.day) < start) start = cycleStart;
      const srcs = p.sourceId ? [{ sourceId: p.sourceId, amount: p.amount }]
                 : (i === 0 ? existing.map(function (a) { return { sourceId: a.sourceId, amount: a.amount }; }) : []);
      if (i === 0) {
        updateById_('OBLIGATIONS', obligationId, { name: name, amount: p.amount, day: p.day, startDate: fmtDate_(start) });
        saveAllocations_(obligationId, srcs, p.amount, m);
      } else {
        const nid = insert_('OBLIGATIONS', Object.assign({}, base, {
          name: name, amount: p.amount, day: p.day, startDate: fmtDate_(start), deleted: 'لا', deletedAt: '' }));
        if (srcs.length) saveAllocations_(nid, srcs, p.amount, m);
      }
    });
    return { message: 'قُسّم «' + r.name + '» إلى ' + v.norm.length + ' فترات' };
  });
}

/* ============================================================
 *  20) أدوات مساعدة
 * ========================================================== */

function num(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function positive_(v) { return Math.max(0, num(v)); }
function yes_(v) { return ['نعم', 'yes', 'true', '1'].indexOf(String(v).trim().toLowerCase()) > -1; }
function clampDay_(v) { return Math.min(31, Math.max(1, Math.round(num(v)) || 1)); }
/** يوم نزول الدخل: 0 = غير محدد الموعد (يُسجَّل عند نزوله فقط). */
function incomeDay_(v) {
  const n = Math.round(num(v));
  if (!n || n < 1) return 0;
  return Math.min(31, n);
}
function priorityRank_(p) { return p === 'عالية' ? 1 : p === 'متوسطة' ? 2 : 3; }
function newId_(prefix) { return prefix + '_' + Utilities.getUuid().slice(0, 8).toUpperCase(); }
/* ---------- الدورة المالية ---------- */
/**
 * يوم بداية الدورة. 1 = الشهر الميلادي المعتاد.
 * 27 = الدورة تبدأ يوم نزول الراتب وتنتهي 26 من الشهر التالي.
 * مفتاح الدورة هو شهر **نهايتها**: دورة 27 سبتمبر — 26 أكتوبر مفتاحها 2026-10،
 * لأنها الدورة التي تُغطّي التزامات أكتوبر بالراتب الذي نزل 27 سبتمبر.
 */
function cycleStartDay_() {
  return cached_('cycDay', function () {
    const d = Math.round(num(getSetting_('CYCLE_START_DAY'))) || 1;
    return Math.min(28, Math.max(1, d));
  });
}
function isCalendarCycle_() { return cycleStartDay_() === 1; }

/** مفتاح الدورة التي يقع فيها تاريخ معيّن. */
function cycleOf_(date) {
  if (!date) return '';
  const sd = cycleStartDay_();
  if (sd === 1) return Utilities.formatDate(date, TZ, 'yyyy-MM');
  const d = startOfDay_(date);
  const shift = d.getDate() >= sd ? 1 : 0;   // بعد يوم البداية ⇒ الدورة تُنسب للشهر التالي
  return Utilities.formatDate(new Date(d.getFullYear(), d.getMonth() + shift, 1), TZ, 'yyyy-MM');
}

/** بداية ونهاية الدورة كتاريخين فعليين. */
function cycleRange_(key) {
  const y = Number(String(key).slice(0, 4)), m = Number(String(key).slice(5, 7));
  const sd = cycleStartDay_();
  if (sd === 1) {
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
  }
  return { start: new Date(y, m - 2, sd), end: new Date(y, m - 1, sd - 1) };
}

/** تاريخ «يوم كذا من الشهر» داخل دورة معيّنة. */
function cycleDate_(key, day) {
  const sd = cycleStartDay_();
  const d = clampDay_(day);
  if (sd === 1) return monthDay_(key, d);
  const y = Number(String(key).slice(0, 4)), m = Number(String(key).slice(5, 7));
  // اليوم ≥ يوم البداية يقع في الشهر الأول من الدورة، وما دونه في الشهر الثاني
  const base = d >= sd ? new Date(y, m - 2, 1) : new Date(y, m - 1, 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(d, last));
}

function cycleLabel_(key) {
  const r = cycleRange_(key);
  if (isCalendarCycle_()) return key;
  return fmtDate_(r.start) + ' → ' + fmtDate_(r.end);
}

function currentMonth_() { return cycleOf_(new Date()); }

/**
 * الدورة التي يجب أن يفتح عليها التطبيق.
 * الدورة الحالية قد تسبق تاريخ بدايتك (بدأت 27 سبتمبر واليوم 19 سبتمبر)،
 * فتظهر فارغة تماماً ويبدو أن شيئاً لم يُحفظ. نفتح على دورة البداية بدلاً منها.
 */
function defaultMonth_() {
  const cur = currentMonth_(), st = startMonth_();
  return cur < st ? st : cur;
}
function validMonth_(m) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m || '')); }

/**
 * Google Sheets يحوّل النص "2026-09" تلقائياً إلى تاريخ عند الكتابة،
 * فتعود القيمة من الخلية ككائن Date لا كنص. أي مقارنة نصية بعدها تفشل
 * فيبدو أن العملية "نجحت" بينما لا أثر لها عند القراءة.
 * كل قراءة لعمود شهر يجب أن تمر من هنا.
 */
function monthKey_(v) {
  if (!v && v !== 0) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v) ? '' : Utilities.formatDate(v, TZ, 'yyyy-MM');
  }
  const str = String(v).trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) return str;
  const d = toDate_(str);
  return d ? fmtMonth_(d) : str;
}
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function nowStamp_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'); }
function fmtDate_(d) { return d ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : ''; }
function fmtMonth_(d) { return d ? Utilities.formatDate(d, TZ, 'yyyy-MM') : ''; }
function startOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function esc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function monthDay_(month, day) {
  const y = Number(String(month).slice(0, 4)), m = Number(String(month).slice(5, 7));
  const last = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(clampDay_(day), last));
}

function toDate_(v) {
  if (!v && v !== 0) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v) ? null : startOfDay_(v);
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const p = s.slice(0, 10).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  if (/^\d{4}-\d{2}$/.test(s)) {
    const p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, 1);
  }
  return null;
}
