/* ============================================================
 *  المستشار يستخدم كلود بدل جيميناي.
 *  تُستبدَل هنا دوال التكامل فقط — منطق المستشار والمحرك في Code.gs
 *  لم يتغيّر حرفاً واحداً، لأنه كله يمر عبر callGemini_/listAiModels_
 *  وما شابه، وهذا الملف يعيد تعريفها فقط (يُحمَّل بعد Code.gs).
 * ========================================================== */

const CLAUDE_HOST = 'https://api.anthropic.com/v1/';
const CLAUDE_API_VERSION = '2023-06-01';
const CLAUDE_DEFAULT_MODEL = 'claude-sonnet-5-5';

function aiKey_() { return PropertiesService.getScriptProperties().getProperty('AI_KEY') || ''; }
function aiModel_() { return PropertiesService.getScriptProperties().getProperty('AI_MODEL') || CLAUDE_DEFAULT_MODEL; }
function aiWorking_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('AI_WORKING') || '[]'); }
  catch (e) { return []; }
}

function saveAiKey(token, key, model) {
  guard_(token);
  const k = String(key || '').trim();
  const props = PropertiesService.getScriptProperties();
  if (k) {
    props.setProperty('AI_KEY', k);
    ['AI_WORKING', 'AI_LAST_DIAG'].forEach(function (p) { props.deleteProperty(p); });
  }
  if (model) props.setProperty('AI_MODEL', String(model).trim());
  return { success: true, message: 'تم حفظ إعدادات المستشار', hasKey: !!aiKey_(), model: aiModel_() };
}
function clearAiKey(token) {
  guard_(token);
  PropertiesService.getScriptProperties().deleteProperty('AI_KEY');
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

function claudeHeaders_() {
  return {
    'x-api-key': aiKey_(),
    'anthropic-version': CLAUDE_API_VERSION,
    // تسمح بنداء الواجهة مباشرة من المتصفح بدل خادم وسيط — موثّقة من Anthropic لهذا الغرض بالذات
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}

/** يسأل Anthropic عن النماذج المتاحة فعلياً لمفتاحك. */
function listAiModels_() {
  const key = aiKey_();
  if (!key) throw new Error('لا يوجد مفتاح');
  let res;
  try {
    res = UrlFetchApp.fetch(CLAUDE_HOST + 'models?limit=200', { headers: claudeHeaders_(), muteHttpExceptions: true });
  } catch (e) {
    throw new Error(String(e.message || e));
  }
  if (res.getResponseCode() !== 200) {
    let detail = '';
    try { const e = JSON.parse(res.getContentText()); detail = (e.error && e.error.message) || ''; }
    catch (x) { detail = res.getContentText().slice(0, 200); }
    const err = new Error(detail || ('رمز ' + res.getResponseCode()));
    err.httpCode = res.getResponseCode();
    throw err;
  }
  const data = JSON.parse(res.getContentText());
  return (data.data || []).map(function (m) {
    return { name: m.id, display: m.display_name || m.id, canGenerate: true, versions: ['v1'], inputTokens: null };
  });
}

/** نداء واحد لنموذج محدد. ترجع {ok,text,code,status,error}. */
function callModel_(model, prompt, inlineData, maxTokens) {
  const key = aiKey_();
  const content = [];
  if (inlineData) {
    content.push({ type: 'image', source: { type: 'base64', media_type: inlineData.mimeType, data: inlineData.data } });
  }
  content.push({ type: 'text', text: prompt });
  let res;
  try {
    res = UrlFetchApp.fetch(CLAUDE_HOST + 'messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: claudeHeaders_(),
      payload: JSON.stringify({
        model: model, max_tokens: maxTokens || 3000, temperature: 0.4,
        messages: [{ role: 'user', content: content }]
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
      status = (e.error && e.error.type) || '';
      detail = (e.error && e.error.message) || '';
    } catch (x) { detail = body.slice(0, 300); }
    return { ok: false, code: code, status: status, error: detail || ('رمز ' + code) };
  }
  const data = JSON.parse(body);
  const text = (data.content || []).filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text || ''; }).join('').trim();
  if (!text) return { ok: false, code: 200, status: 'EMPTY', error: 'إجابة فارغة' + (data.stop_reason ? ' (' + data.stop_reason + ')' : '') };
  return { ok: true, text: text, code: 200 };
}

/**
 * يحاول النموذج المعتمد، وإن فشل لسبب يخصه وحده ينتقل لنموذج آخر
 * نجح في آخر تشخيص ويعتمده — فلا يتوقف المستشار بلا داعٍ.
 */
function callGemini_(prompt, inlineData) {
  if (!aiKey_()) throw new Error('لم تُضِف مفتاح كلود بعد. أضفه من الإعدادات ← المستشار الذكي.');
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
      if (r2 && r2.ok) { props.setProperty('AI_MODEL', backups[i]); return r2.text; }
      const w2 = classifyAiError_(r2);
      if (w2.scope === 'global') { why = w2; break; }
    }
  }
  throw new Error(why.title + ' — ' + why.fix + (why.raw ? ' (تفصيل Anthropic: ' + why.raw.slice(0, 160) + ')' : ''));
}

/**
 * يترجم رد Anthropic إلى سبب مفهوم وحل.
 * scope='global' ⇒ عطل يمنع كل النماذج (المفتاح، الفوترة، الشبكة).
 * scope='model'  ⇒ خاص بهذا النموذج (لا صلاحية له، أو مزدحم)، فنجرّب غيره.
 */
function classifyAiError_(r) {
  r = r || {};
  const code = r.code || 0, st = String(r.status || ''), m = String(r.error || '');
  const R = function (kind, scope, title, fix, temporary) {
    return { kind: kind, scope: scope, title: title, fix: fix, temporary: !!temporary, raw: m };
  };
  if (code === 0) return R('network', 'global', 'تعذّر الوصول لخوادم Anthropic',
    'تحقق من اتصال جهازك بالإنترنت ثم أعد المحاولة.', true);
  if (code === 401 || st === 'authentication_error') return R('key_invalid', 'global', 'المفتاح غير صالح',
    'تأكد أنك نسخته كاملاً بلا مسافات من console.anthropic.com، أو أنشئ مفتاحاً جديداً.');
  if (/credit balance|insufficient_quota|billing/i.test(m)) return R('billing', 'global', 'رصيد الحساب منتهٍ',
    'أضف رصيداً في console.anthropic.com ← Billing.');
  if (code === 403 || st === 'permission_error') return R('permission', 'model', 'لا صلاحية لمفتاحك على هذا النموذج',
    'جرّب نموذجاً آخر، أو فعّل الوصول له من console.anthropic.com.');
  if (code === 404 || st === 'not_found_error') return R('not_found', 'model', 'النموذج غير موجود لدى مفتاحك', 'اختر نموذجاً من القائمة الخضراء.');
  if (code === 429 || st === 'rate_limit_error') return R('quota_minute', 'model', 'تجاوزت عدد الطلبات المسموح به مؤقتاً', 'انتظر دقيقة ثم أعد المحاولة.', true);
  if (code === 529 || st === 'overloaded_error' || code >= 500) return R('overloaded', 'model', 'الخدمة مزدحمة حالياً', 'أعد المحاولة بعد قليل.', true);
  if (st === 'EMPTY') return R('empty', 'model', 'رد فارغ', 'أعد المحاولة بصياغة أخرى.', true);
  if (code === 400 || st === 'invalid_request_error') return R('bad_request', 'model', 'النموذج رفض الطلب', 'جرّب نموذجاً آخر من القائمة الخضراء.');
  return R('unknown', 'model', 'فشل غير معروف', 'أعد التشخيص.');
}

/** نماذج الدردشة فقط من عائلة كلود. */
function isTextModel_(m) { return /^claude-/.test(String(m.name || '')); }
function modelRank_(n) {
  n = String(n);
  const fam = /opus/.test(n) ? 0 : /sonnet/.test(n) ? 1 : /haiku/.test(n) ? 2 : 3;
  const ver = (n.match(/(\d+)(?:[.-](\d+))?/) || []).slice(1).map(Number);
  const score = (ver[0] || 0) * 100 + (ver[1] || 0);
  return fam * 1000 - score;   // الأحدث من كل عائلة أولاً، وأوبس > سونيت > هايكو
}

/** تشخيص صارم: لا يُعدّ نموذج «متاحاً» إلا بعد نداء فعلي ناجح. */
function diagnoseAi(token) {
  guard_(token);
  const props = PropertiesService.getScriptProperties();
  const steps = [];
  const add = function (name, ok, detail, hint) { steps.push({ name: name, ok: !!ok, detail: String(detail || ''), hint: String(hint || '') }); };
  let verdict = null;
  const setVerdict = function (status, title, explain, fix) { if (!verdict) verdict = { status: status, title: title, explain: explain, fix: fix }; };

  const hasKey = !!aiKey_();
  add('مفتاح كلود', hasKey, hasKey ? 'مضاف' : 'غير مضاف', hasKey ? '' : 'الصق مفتاحك أعلاه واحفظ.');
  if (!hasKey) setVerdict('no_key', 'لم تُضِف مفتاحاً', 'المستشار يحتاج مفتاح Anthropic (كلود).',
    'أنشئه من console.anthropic.com');

  let models = [], listOk = false;
  if (hasKey) {
    try {
      models = listAiModels_();
      listOk = true;
      add('المفتاح مقبول لدى Anthropic', true, models.length + ' نموذجاً متاحاً', '');
    } catch (e) {
      const msg = String(e.message || e);
      const why = classifyAiError_({ code: e.httpCode || (/\b(4\d\d|5\d\d)\b/.test(msg) ? +RegExp.$1 : 400), error: msg });
      add('المفتاح مقبول لدى Anthropic', false, why.title, why.fix);
      setVerdict(why.kind, why.title, 'Anthropic رفضت المفتاح قبل أي اختبار للنماذج.', why.fix);
    }
  }

  const results = {}, working = [];
  let globalStop = null;
  if (listOk) {
    const cands = models.filter(isTextModel_).sort(function (a, b) { return modelRank_(a.name) - modelRank_(b.name) || a.name.localeCompare(b.name); }).slice(0, 8);
    for (let i = 0; i < cands.length; i++) {
      const name = cands[i].name;
      let r = callModel_(name, 'أجب بكلمة واحدة: جاهز', null, 20);
      let why = (r && r.ok) ? null : classifyAiError_(r);
      if (why && why.kind === 'quota_minute') {
        Utilities.sleep(4000);
        r = callModel_(name, 'أجب بكلمة واحدة: جاهز', null, 20);
        why = (r && r.ok) ? null : classifyAiError_(r);
      }
      results[name] = why ? { ok: false, kind: why.kind, title: why.title } : { ok: true };
      if (!why) working.push(name);
      if (why && why.scope === 'global') { globalStop = why; break; }
      Utilities.sleep(300);
    }
    add('اختبار النماذج بنداء فعلي', working.length > 0, working.length ? working.length + ' نموذج نجح' : 'لم ينجح أي نموذج',
      working.length ? '' : (globalStop ? globalStop.fix : 'راجع الأسباب أدناه.'));
  }

  let current = aiModel_(), switched = '';
  if (working.length) {
    props.setProperty('AI_WORKING', JSON.stringify(working));
    if (working.indexOf(current) < 0) { switched = current; current = working[0]; props.setProperty('AI_MODEL', current); }
    add('النموذج المعتمد', true, current + (switched ? ' — بُدِّل تلقائياً من ' + switched + ' لأنه لا يعمل' : ''), '');
    setVerdict('ready', 'المستشار جاهز ويعمل', 'اختُبر ' + working.length + ' نموذج بنداء فعلي ونجح. المعتمد: ' + current + '.',
      working.length > 1 ? 'إن تعطّل المعتمد لاحقاً ينتقل المستشار تلقائياً لنموذج ناجح آخر.' : '');
  } else if (listOk) {
    props.deleteProperty('AI_WORKING');
  }

  if (!verdict && listOk) {
    const kinds = Object.keys(results).map(function (k) { return results[k].kind; });
    const count = function (k) { return kinds.filter(function (x) { return x === k; }).length; };
    if (globalStop) setVerdict(globalStop.kind, globalStop.title, 'عطل عام يمنع كل النماذج.', globalStop.fix);
    else if (count('quota_minute') > 0) setVerdict('quota', 'انتهت حصتك حالياً', 'المفتاح سليم لكن حد الاستخدام استُنفد مؤقتاً.', 'انتظر دقيقة ثم أعد التشخيص.');
    else if (!kinds.length) setVerdict('no_models', 'لا يوجد نموذج متاح لمفتاحك', '', 'أنشئ مفتاحاً جديداً من console.anthropic.com.');
    else setVerdict('no_models', 'لا يوجد نموذج يعمل مع مفتاحك', 'فشلت كل الاختبارات.', 'راجع الأسباب أدناه.');
  }

  const byReason = {};
  Object.keys(results).forEach(function (n) { if (!results[n].ok) (byReason[results[n].title] = byReason[results[n].title] || []).push(n); });

  const out = {
    ok: !!(verdict && verdict.status === 'ready'), verdict: verdict || { status: 'unknown', title: 'لم يكتمل التشخيص', explain: '', fix: '' },
    steps: steps, current: current, switchedFrom: switched, working: working,
    failed: Object.keys(byReason).map(function (t) { return { reason: t, models: byReason[t] }; }),
    testedAt: nowStamp_()
  };
  props.setProperty('AI_LAST_DIAG', JSON.stringify({ ok: out.ok, verdict: out.verdict, current: out.current, working: working, testedAt: out.testedAt }));
  return out;
}

function setAiModel(token, name) {
  guard_(token);
  if (aiWorking_().indexOf(String(name)) < 0) return { success: false, message: 'هذا النموذج لم ينجح اختباره. أعد التشخيص أولاً.' };
  PropertiesService.getScriptProperties().setProperty('AI_MODEL', String(name));
  return { success: true, model: String(name), message: 'اعتُمد ' + name };
}
