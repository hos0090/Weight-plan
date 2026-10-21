/* ============================================================
 *  إضافات المحرك الخاصة بالتطبيق المستقل.
 *  تُحمَّل بعد Code.gs فتعيد تعريف ما يلزم وتضيف دوال جديدة.
 * ========================================================== */

/* الجوال جهاز شخصي — الجلسة تبقى 60 يوماً بدل 12 ساعة */
const APP_SESSION_TTL_MS = 60 * 24 * 3600 * 1000;
function isValidToken_(token) {
  if (!token) return false;
  const ts = PropertiesService.getScriptProperties().getProperty('SESSION_' + token);
  if (!ts) return false;
  if (Date.now() - Number(ts) > APP_SESSION_TTL_MS) {
    PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
    return false;
  }
  return true;
}
function cleanupSessions_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('SESSION_') === 0 && Date.now() - Number(all[k]) > APP_SESSION_TTL_MS) props.deleteProperty(k);
  });
}

/* ---------- الحساب ---------- */
function appHasAccount_() {
  const p = PropertiesService.getScriptProperties();
  return !!(p.getProperty('PASS_HASH') && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS));
}

/** حساب جديد على هذا الجهاز: يُنشئ الأوراق ويحفظ اسم المستخدم وكلمة المرور. */
function appCreateAccount(username, password) {
  const u = String(username || '').trim(), p = String(password || '');
  if (u.length < 2) throw new Error('اسم المستخدم قصير جداً');
  if (p.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف أو أكثر');
  if (appHasAccount_()) throw new Error('يوجد حساب على هذا الجهاز بالفعل');
  cacheReset_();
  setupSilent_();
  setSetting_('APP_USER', u);
  storePassword_(p);
  clearAllSessions_();
  cacheReset_();
  return { success: true };
}

/** استيراد أوراق من ملف إكسل (منزّل من جوجل شيت) — يستبدل البيانات ويُبقي كلمة المرور الحالية. */
function appImportSheets(token, sheets) {
  guard_(token);
  const known = {};
  Object.keys(SHEETS).forEach(function (k) { known[SHEETS[k]] = k; });
  const names = Object.keys(sheets || {});
  const usable = names.filter(function (n) { return known[n]; });
  if (!usable.length) throw new Error('الملف لا يحتوي أي ورقة من أوراق ميزانيتي — تأكد أنك نزّلت ملف الشيت نفسه');
  takeBackup_('قبل الاستيراد');
  const user = getSetting_('APP_USER');
  usable.forEach(function (n) {
    const rows = (sheets[n] || []).map(function (r) {
      return (r || []).map(function (v) { return v === null || v === undefined ? '' : v; });
    });
    RT.state.sheets[n] = rows;
    if (RT.state.order.indexOf(n) < 0) RT.state.order.push(n);
  });
  rtTouch_();
  // الترقية والإصلاح الكامل كما لو شُغّل «تجهيز ومزامنة البيانات»
  PropertiesService.getScriptProperties().deleteProperty('SCHEMA_VERSION');
  cacheReset_();
  setupSilent_();
  // كلمة المرور القديمة إن وُجدت في الشيت لا تُستخدم — تبقى كلمة هذا الجهاز
  hardDeleteWhere_('SETTINGS', function (r) { return String(r.key) === 'APP_PASS'; });
  if (user) setSetting_('APP_USER', user);
  let rep = null;
  try { rep = repairAll_(); } catch (e) { rep = { error: String(e.message || e) }; }
  cacheReset_();
  const counts = {};
  usable.forEach(function (n) { counts[n] = Math.max(0, (RT.state.sheets[n] || []).length - 1); });
  audit_('استيراد البيانات من ملف الشيت', defaultMonth_(), usable.length + ' ورقة');
  return { success: true, sheets: usable, skipped: names.filter(function (n) { return !known[n]; }), counts: counts, repair: rep };
}

/** النسخ المحلية على الجهاز */
function appListBackups(token) {
  guard_(token);
  return RT.backups.map(function (b, i) { return { i: i, name: b.name, at: Utilities.formatDate(new Date(b.at), TZ, 'yyyy-MM-dd HH:mm') }; }).reverse();
}
function appRestoreBackup(token, i) {
  guard_(token);
  const b = RT.backups[Number(i)];
  if (!b) throw new Error('النسخة غير موجودة');
  const keepProps = RT.state.props;
  takeBackup_('قبل الاسترجاع');
  RT.state = rtDecode_(b.state);
  RT.state.props = keepProps;   // كلمة المرور والجلسات والمفتاح الحالية تبقى
  rtTouch_();
  cacheReset_();
  return { success: true, message: 'استُرجعت النسخة: ' + b.name };
}

/* ---------- ساعة قابلة للتقديم: لبناء تنبيهات الأيام القادمة ---------- */
function appWithClock_(ms, fn) {
  const old = RT_CLOCK.offset;
  RT_CLOCK.offset = ms - RT_CLOCK.real();
  try { return fn(); } finally { RT_CLOCK.offset = old; }
}

/** ملخص قصير يصلح إشعاراً — نفس منطق رسالة البريد اليومية. */
function pushDigest_() {
  cacheReset_();
  const m = defaultMonth_();
  const today0 = startOfDay_(new Date());
  const obs = obligationsForMonth_(m);
  const R = function (x) { return Math.round(num(x)).toLocaleString('en-US'); };
  const overdue = obs.filter(function (o) { return !o.paid && !o.autoDeduct && o.overdue; });
  const dueToday = obs.filter(function (o) { return !o.paid && !o.autoDeduct && !o.overdue && o.daysLeft === 0; });
  const soon = obs.filter(function (o) { return !o.paid && !o.autoDeduct && !o.overdue && o.daysLeft >= 1 && o.daysLeft <= 2; })
    .sort(function (a, b) { return a.daysLeft - b.daysLeft; });
  const autoSoon = obs.filter(function (o) { return o.autoDeduct && !o.autoPaid && o.daysLeft >= 0 && o.daysLeft <= 1; });
  const lateIncome = incomesForMonth_(m).filter(function (i) {
    return i.inWindow && !i.paused && !i.arrived && i.hasSchedule && i.occurrenceDate && toDate_(i.occurrenceDate) < today0;
  });
  let arrears = [];
  try { arrears = arrearsFor_(m); } catch (e) {}
  let neg = null;
  try { neg = dailyFlow_(m, null).firstNegative; } catch (e) {}
  const lines = [];
  const sum = function (list, f) { return list.reduce(function (s, o) { return s + num(f(o)); }, 0); };
  if (dueToday.length) lines.push('اليوم: ' + dueToday.slice(0, 3).map(function (o) { return o.name + ' ' + R(o.remainingAmount); }).join('، ') + (dueToday.length > 3 ? ' و' + (dueToday.length - 3) + ' غيرها' : ''));
  if (overdue.length + arrears.length) lines.push('متأخر: ' + (overdue.length + arrears.length) + ' بمبلغ ' + R(sum(overdue, function (o) { return o.remainingAmount; }) + sum(arrears, function (a) { return a.amount; })) + ' ر.س');
  if (soon.length) lines.push((soon[0].daysLeft === 1 ? 'غداً: ' : 'خلال يومين: ') + soon.slice(0, 2).map(function (o) { return o.name + ' ' + R(o.remainingAmount); }).join('، '));
  if (autoSoon.length) lines.push('خصم تلقائي: ' + autoSoon.map(function (o) { return o.name + ' ' + R(o.amount); }).join('، ') + ' — تأكد من الرصيد');
  if (lateIncome.length) lines.push('دخل لم تسجّله: ' + lateIncome.map(function (i) { return i.name; }).join('، '));
  if (neg) lines.push('رصيدك سيصبح سالباً يوم ' + arDate_(neg.date));
  if (!lines.length) return null;
  const title = dueToday.length ? '⏰ يستحق اليوم ' + R(sum(dueToday, function (o) { return o.remainingAmount; })) + ' ر.س'
    : overdue.length + arrears.length ? '⛔ عندك التزامات متأخرة'
    : soon.length ? '📅 التزام قريب'
    : autoSoon.length ? '🏦 خصم تلقائي قريب'
    : lateIncome.length ? '💰 هل وصل دخلك؟' : '📉 تنبيه الرصيد';
  return { title: title, body: lines.join('\n') };
}

/**
 * جدول إشعارات الأيام القادمة — يُحسب على الجهاز ثم يُشفَّر قبل رفعه.
 * hour: ساعة التنبيه بتوقيت الرياض.
 */
function appPushSchedule(token, days, hour) {
  guard_(token);
  const n = Math.max(1, Math.min(21, Number(days) || 14));
  const h = Math.max(5, Math.min(23, Number(hour) || 9));
  const out = [];
  const nowR = new Date(RT_CLOCK.real() + 3 * 3600000);
  const base = Date.UTC(nowR.getUTCFullYear(), nowR.getUTCMonth(), nowR.getUTCDate(), h - 3, 0, 0);
  for (let k = 0; k < n; k++) {
    const at = base + k * 86400000;
    if (at < RT_CLOCK.real() - 30 * 60000) continue;   // وقت اليوم فات
    const d = appWithClock_(at, function () { try { return pushDigest_(); } catch (e) { return null; } });
    if (!d) continue;
    const r = new Date(at + 3 * 3600000);
    const iso = r.getUTCFullYear() + '-' + String(r.getUTCMonth() + 1).padStart(2, '0') + '-' + String(r.getUTCDate()).padStart(2, '0');
    out.push({ id: iso + ':d', at: iso + 'T' + String(h).padStart(2, '0') + ':00', title: d.title, body: d.body });
  }
  cacheReset_();
  return { items: out, hour: h };
}

/** معاينة إشعار اليوم */
function appPushPreview(token) {
  guard_(token);
  return pushDigest_() || { title: '', body: '' };
}

/* ============================================================
 *  جسر كلود: بلا مفتاح. التطبيق يجهّز «ملف الوضع» كاملاً لتلصقه
 *  في محادثة كلود، ثم تلصق خطته هنا فتمر بنفس التدقيق والموافقة
 *  والتراجع التي يمر بها المستشار المدمج.
 * ========================================================== */
function claudeBriefing(token, month, request) {
  guard_(token);
  const q = String(request || '').trim() || 'حلّل وضعي المالي كاملاً، وقل لي رأيك الصريح: وش أسوي هذه الدورة والدورات الجاية؟';
  let captured = null;
  const orig = callGemini_;
  callGemini_ = function (p) { captured = p; throw new Error('__CAPTURE__'); };
  try { aiAgent(token, month, q); }
  catch (e) { if (String(e.message) !== '__CAPTURE__') throw e; }
  finally { callGemini_ = orig; }
  if (!captured) throw new Error('تعذّر تجهيز الملف');
  const cut = captured.indexOf('\n\nأعد JSON فقط');
  const body = cut > -1 ? captured.slice(0, cut) : captured;
  const head = 'هذا ملف من تطبيق «ميزانيتي» — تطبيقي لإدارة دخلي والتزاماتي. أبيك تكون مستشاري المالي: ' +
    'اقرأ كل الأرقام، حلّل وضعي، ناقشني وأعطني رأيك الصريح ولو كان ما يعجبني.\n' +
    'التاريخ اليوم: ' + today_() + '\n\n';
  const tail = '\n\nطريقة ردّك:' +
    '\n1) ابدأ بتحليلك ورأيك بالعربي وبالأرقام من الملف — باختصار وبدون تكرار.' +
    '\n2) إذا اقترحت تغييرات على بياناتي (ربط، تعديل، تجنيب، تقسيم، سداد…) فضعها في آخر ردّك في كتلة كود واحدة بهذا الشكل بالضبط حتى ألصقها في التطبيق وأوافق عليها:' +
    '\n```json\n{"reply":"ملخص ما ستفعله","actions":[{"type":"نوع","params":{},"why":"سبب مختصر"}]}\n```' +
    '\n3) استخدم المعرفات (id) كما هي حرفياً من الملف. وإن لم تكن هناك تغييرات فلا تضع الكتلة.' +
    '\n4) بعدها كمّل النقاش معي عادي — وكل ما اتفقنا على تعديل جديد أعطني كتلة جديدة.';
  return { text: head + body + tail, request: q, chars: (head + body + tail).length, month: validMonth_(month) ? month : defaultMonth_() };
}

function claudeApplyPlan(token, month, text) {
  guard_(token);
  const raw = String(text || '');
  const m = validMonth_(month) ? month : defaultMonth_();
  let json = '';
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/g);
  if (fence) {
    for (let i = fence.length - 1; i >= 0; i--) {
      const inner = fence[i].replace(/^```(?:json)?\s*/, '').replace(/```$/, '').trim();
      if (inner.indexOf('"actions"') > -1) { json = inner; break; }
    }
  }
  if (!json) {
    const at = raw.lastIndexOf('{"reply"') > -1 ? raw.lastIndexOf('{"reply"') : raw.indexOf('{');
    if (at < 0) throw new Error('ما لقيت خطة في النص — انسخ رد كلود كاملاً مع كتلة الكود');
    json = raw.slice(at, raw.lastIndexOf('}') + 1);
  }
  let parsed;
  try { parsed = JSON.parse(json); }
  catch (e) { throw new Error('الخطة غير مكتملة — تأكد أنك نسخت كتلة الكود كاملة'); }
  const actions = agentValidate_(m, parsed.actions || []);
  logAi_(m, 'كلود (محادثة)', 'خطة ملصوقة من محادثة كلود', String(parsed.reply || '') +
    (actions.length ? ' | إجراءات: ' + actions.map(function (a) { return a.label; }).join('، ') : ''));
  return { month: m, reply: String(parsed.reply || ''), actions: actions,
           validCount: actions.filter(function (a) { return a.valid; }).length };
}

/* ============================================================
 *  ترحيل تلقائي: إن لم تُقفل الدورة السابقة كان رصيدها يضيع (الافتتاحي = 0)
 *  بينما تُخصم متأخراتها من الدورة الجديدة — فيظهر المتبقي أقل من الحقيقة.
 *  الآن: المقفلة تُرحَّل بختاميها المسجّل، وغير المقفلة بختاميها المحسوب.
 * ========================================================== */
function openingBalance_(month) {
  if (String(getSetting_('ROLLOVER') || 'نعم') === 'لا') return 0;
  const pm = prevMonth_(month);
  const prev = monthRecord_(pm);
  if (prev) return num(prev.closing);
  if (pm < startMonth_()) return 0;
  return monthSummary_(pm).closing;
}
