/* ============================================================
 *  إقلاع التطبيق: الحساب، الاستيراد من الشيت، النسخ المحلية،
 *  المزامنة السحابية، والتثبيت كتطبيق.
 * ========================================================== */

/* ---------- Service Worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js?v=1792573365734').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', function () {
          if (nw.state === 'activated' && navigator.serviceWorker.controller) {
            toast('تحديث جديد متاح — أعد فتح التطبيق لتطبيقه', 'ok');
          }
        });
      });
    }).catch(function () {});
  });
}

/* ---------- التثبيت كتطبيق ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault(); deferredInstall = e;
  el('installBar').classList.remove('hidden');
});
function doInstall() {
  el('installBar').classList.add('hidden');
  if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
}
window.addEventListener('appinstalled', function () { el('installBar').classList.add('hidden'); });

/* ---------- بطاقة الدخول: حساب جديد أو دخول ---------- */
function renderAuthCard_(hasAccount) {
  const box = el('authCard');
  if (hasAccount) {
    box.innerHTML =
      '<div class="field"><label>اسم المستخدم</label><input id="lUser" value="admin" autocomplete="username"></div>' +
      '<div class="field"><label>كلمة المرور</label><input id="lPass" type="password" autocomplete="current-password" placeholder="••••••••"></div>' +
      '<div class="field"><label>المظهر</label><div class="themes" id="loginThemes"></div></div>' +
      '<button class="btn-main wide" onclick="login()">دخول</button>' +
      '<div class="acts" style="margin-top:10px"><button class="btn btn-sm" onclick="showRestoreForm_()">عندي بيانات على جهاز آخر</button></div>' +
      '<div id="lErr" class="note n-red hidden" style="margin:14px 0 0"></div>';
    renderLoginThemes();
    el('lPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
  } else {
    box.innerHTML =
      '<p class="lead" style="margin-top:-6px">أنشئ حسابك على هذا الجهاز لأول مرة</p>' +
      '<div class="field"><label>اسم المستخدم</label><input id="nuUser" value="admin" autocomplete="username"></div>' +
      '<div class="field"><label>كلمة المرور</label><input id="nuPass" type="password" autocomplete="new-password" placeholder="6 أحرف فأكثر"></div>' +
      '<div class="field"><label>تأكيد كلمة المرور</label><input id="nuPass2" type="password" autocomplete="new-password"></div>' +
      '<button class="btn-main wide" onclick="doCreateAccount()">إنشاء الحساب</button>' +
      '<div class="acts" style="margin-top:10px"><button class="btn btn-sm" onclick="showRestoreForm_()">عندي بيانات على جهاز آخر</button></div>' +
      '<div id="lErr" class="note n-red hidden" style="margin:14px 0 0"></div>';
  }
}
function showRestoreForm_() {
  const box = el('authCard');
  box.innerHTML =
    '<p class="lead" style="margin-top:-6px">استرجاع من نسخة سحابية مُشفَّرة</p>' +
    '<div class="field"><label>رمز المزامنة</label><input id="rsCode" placeholder="XXXX-XXXX" style="text-align:center;letter-spacing:2px">' +'</div>' +
    '<div class="field"><label>عبارة مرور المزامنة</label><input id="rsPass" type="password"></div>' +
    '<button class="btn-main wide" onclick="doRestore_()">استرجاع البيانات</button>' +
    '<div class="acts" style="margin-top:10px"><button class="btn btn-sm" onclick="renderAuthCard_(APP_HAS_ACCOUNT)">رجوع</button></div>' +
    '<div id="lErr" class="note n-red hidden" style="margin:14px 0 0"></div>';
}
function doCreateAccount() {
  const u = v('nuUser').trim(), p = v('nuPass'), c = v('nuPass2');
  el('lErr').classList.add('hidden');
  if (u.length < 2) return showLoginErr('اسم المستخدم قصير جداً');
  if (p.length < 6) return showLoginErr('كلمة المرور يجب أن تكون 6 أحرف أو أكثر');
  if (p !== c) return showLoginErr('كلمتا المرور غير متطابقتين');
  busy(true, 'جاري إنشاء الحساب…');
  BRIDGE.call('appCreateAccount', [u, p]).then(function () {
    busy(false); toast('تم إنشاء الحساب — سجّل الدخول', 'ok');
    APP_HAS_ACCOUNT = true; renderAuthCard_(true); el('lUser').value = u;
  }, function (e) { busy(false); showLoginErr(e.message || 'تعذّر الإنشاء'); });
}
function doRestore_() {
  const code = v('rsCode'), pass = v('rsPass');
  el('lErr').classList.add('hidden');
  if (!code || !pass) return showLoginErr('أكمل الرمز وعبارة المرور');
  busy(true, 'جاري الاسترجاع…');
  window.SYNC.restoreByCode(code, pass).then(function () {
    busy(false); toast('استُرجعت بياناتك — أنشئ كلمة مرور دخول لهذا الجهاز', 'ok');
    APP_HAS_ACCOUNT = false; renderAuthCard_(false);
  }, function (e) { busy(false); showLoginErr(e.message || 'تعذّر الاسترجاع'); });
}

var APP_HAS_ACCOUNT = false;
BRIDGE.call('__status', []).then(function (st) {
  APP_HAS_ACCOUNT = !!st.hasAccount;
  renderAuthCard_(APP_HAS_ACCOUNT);
  if (!APP_HAS_ACCOUNT && S.token) { S.token = ''; localStorage.removeItem('myz_token'); }
  if (S.token) { showApp(); refresh(true); } else showLogin();
}).catch(function () {
  renderAuthCard_(false);
  showLogin();
});

/* ---------- استيراد ملف الشيت (xlsx) ---------- */
let XLSX_READY = null;
function ensureXlsx_() {
  if (XLSX_READY) return XLSX_READY;
  XLSX_READY = new Promise(function (resolve, reject) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = resolve; s.onerror = function () { reject(new Error('تعذّر تحميل أداة قراءة الإكسل — تحقق من الإنترنت')); };
    document.head.appendChild(s);
  });
  return XLSX_READY;
}
function pickImportFile() { el('importFile').click(); }
function onImportFile(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  busy(true, 'جاري قراءة الملف…');
  ensureXlsx_().then(function () { return file.arrayBuffer(); }).then(function (buf) {
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const sheets = {};
    wb.SheetNames.forEach(function (name) {
      sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
    });
    busy(true, 'جاري استيراد البيانات…');
    return BRIDGE.call('appImportSheets', [S.token, sheets]);
  }).then(function (r) {
    busy(false);
    if (!r || !r.success) return toast((r && r.error) || 'تعذّر الاستيراد', 'err');
    toast('استُوردت ' + r.sheets.length + ' ورقة بنجاح', 'ok');
    modal(mhead('تم الاستيراد', '')
      + '<div class="note n-green">' + r.sheets.map(function (n) { return esc(n) + ': ' + (r.counts[n] || 0); }).join(' · ') + '</div>'
      + (r.skipped && r.skipped.length ? '<div class="hint">ورقات تم تجاهلها لأنها ليست من ميزانيتي: ' + r.skipped.map(esc).join('، ') + '</div>' : '')
      + macts('تم', 'closeModal()'));
    refresh(true);
  }).catch(function (e) { busy(false); toast(e.message || 'تعذّر الاستيراد', 'err'); });
}

/* ---------- النسخ المحلية ---------- */
function refreshBackups_() {
  return BRIDGE.call('appListBackups', [S.token]).then(function (list) { S.localBackups = list; if (S.view === 'settings') render(); });
}
function doRestoreBackup(i) {
  confirm2('استرجاع هذه النسخة؟', 'سيُستبدَل وضعك الحالي بهذه النسخة (وتُحفَظ نسخة احتياطية مما لديك الآن تلقائياً).', function () {
    busy(true, 'جاري الاسترجاع…');
    BRIDGE.call('appRestoreBackup', [S.token, i]).then(function (r) {
      busy(false); toast(r.message || 'تم', 'ok'); refresh(true); refreshBackups_();
    }, function (e) { busy(false); toast(e.message || 'تعذّر', 'err'); });
  });
}

/* ---------- لوحة إعدادات الجهاز (مُلحَقة بصفحة الإعدادات) ---------- */
function pDeviceSettings() {
  if (!S.localBackups) { refreshBackups_(); }
  const sy = window.SYNC ? window.SYNC.state() : { code: '', lastSyncAt: '' };
  return panel('بياناتك من الشيت القديم', 'استورد ملف إكسل مُصدَّراً من جوجل شيت — يستبدل بياناتك الحالية في هذا الجهاز',
      '<div class="note n-blue">من جوجل شيت: ملف ← تنزيل ← Microsoft Excel (.xlsx) — ثم اختره هنا.</div>' +
      '<input type="file" id="importFile" accept=".xlsx,.xls" class="hidden" onchange="onImportFile(this)">' +
      '<button class="btn-main wide" onclick="pickImportFile()">اختر ملف الشيت (xlsx)</button>')

    + panel('النسخ الاحتياطية على هذا الجهاز', 'تُؤخذ تلقائياً قبل أي ترقية أو استيراد أو استرجاع',
      !S.localBackups || !S.localBackups.length ? '<div class="empty">لا توجد نسخ بعد.</div>'
      : '<div class="tw"><table style="min-width:400px"><tbody>' + S.localBackups.map(function (b) {
          return '<tr><td>' + esc(b.name) + '</td><td class="mut">' + esc(b.at) + '</td>' +
            '<td><button class="btn btn-sm" onclick="doRestoreBackup(' + b.i + ')">استرجاع</button></td></tr>';
        }).join('') + '</tbody></table></div>')

    + panel('المزامنة السحابية المشفّرة', 'انقل بياناتك بين جوالاتك — تُشفَّر على جهازك قبل الرفع ولا يراها أحد غيرك',
      (sy.code
        ? '<div class="note n-blue">رمز جهازك: <strong style="letter-spacing:2px">' + esc(sy.code) + '</strong>' +
          (sy.lastSyncAt ? ' · آخر مزامنة: ' + esc(sy.lastSyncAt) : ' · لم تُزامَن بعد') + '</div>'
        : '<div class="note n-gold">أنشئ رمز مزامنة أولاً لبدء النسخ السحابي.</div>')
      + fld('عبارة مرور المزامنة', '<input id="syncPass" type="password" placeholder="عبارة تحفظها أنت — تُستخدم لفك التشفير على أي جهاز">')
      + '<div class="acts">'
      + (sy.code ? '' : '<button class="btn" onclick="doNewSyncCode()">إنشاء رمز مزامنة</button>')
      + (sy.code ? '<button class="btn-main" onclick="doCloudBackup()">ارفع نسخة الآن</button>' : '')
      + '</div>'
      + '<div class="hint">احفظ الرمز وعبارة المرور في مكان آمن — من يملكهما يملك نسخة من بياناتك المالية. فقدانهما يعني أن النسخة السحابية لا يمكن فك تشفيرها، لكن التطبيق على جهازك يستمر بلا أي أثر.</div>');
}
function doNewSyncCode() { window.SYNC.newCode(); if (S.view === 'settings') render(); }
function doCloudBackup() {
  const p = v('syncPass');
  if (!p) return toast('أدخل عبارة مرور المزامنة', 'err');
  busy(true, 'جاري الرفع المشفّر…');
  window.SYNC.backupNow(p).then(function () { busy(false); toast('رُفعت نسخة مشفّرة بنجاح', 'ok'); if (S.view === 'settings') render(); },
    function (e) { busy(false); toast(e.message || 'تعذّر الرفع', 'err'); });
}
