/* ============================================================
 *  واجهة الجوال: الأيقونات، الشريط السفلي، الأوراق المنزلقة،
 *  والرئيسية الجديدة (ساعة الدورة). يُحمَّل بعد app.js فيعيد
 *  تعريف ما يلزم دون المساس بالحسابات.
 * ========================================================== */

var IC = (function () {
  var p = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    list: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
    income: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19.5h16"/>',
    more: '<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H6.6"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    spark: '<path d="M12 3.5 13.9 10l6.6 2-6.6 2L12 20.5 10.1 14l-6.6-2 6.6-2z"/>',
    flow: '<path d="M3 16c3-6 5-6 8-2s5 4 10-6"/><path d="M3 20h18"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    debt: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/>',
    goal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    whatif: '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".8"/><circle cx="12" cy="12" r="9"/>',
    book: '<path d="M5 4.5h9.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M4.2 7.5l2.3 1.3M17.5 15.2l2.3 1.3M4.2 16.5l2.3-1.3M17.5 8.8l2.3-1.3"/>',
    log: '<path d="M8 7h11M8 12h11M8 17h11"/><path d="m3.5 7 1 1 2-2M3.5 12l1 1 2-2M3.5 17l1 1 2-2"/>',
    out: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    wand: '<path d="m4 20 10-10M14 4v3M12.5 5.5h3M19 9v3M17.5 10.5h3M18 3l1 1"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
  };
  return function (name, size) {
    return '<svg class="ic" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (p[name] || '') + '</svg>';
  };
})();

/* ---------- الأسماء القصيرة للصفحات في الجوال ---------- */
PAGES.dash[0] = 'الرئيسية';
PAGES.oblig[0] = 'الالتزامات';
PAGES.dash[2] = '';

var TABS = [['dash', 'home', 'الرئيسية'], ['oblig', 'list', 'الالتزامات'], ['__add', 'plus', ''], ['income', 'income', 'الدخل'], ['__more', 'more', 'المزيد']];
var MORE = [
  ['paylog', 'log', 'سجل السداد'], ['flow', 'flow', 'التدفق اليومي'], ['forecast', 'cal', 'ما ينتظرك'],
  ['debt', 'debt', 'الديون'], ['purchases', 'cart', 'المشتريات'], ['savings', 'goal', 'الادخار'],
  ['advisor', 'spark', 'المستشار'], ['reports', 'chart', 'التقارير'], ['whatif', 'whatif', 'ماذا لو'],
  ['guide', 'book', 'الدليل'], ['settings', 'gear', 'الإعدادات']
];

function renderTabbar() {
  var t = el('tabbar'); if (!t) return;
  var inMore = MORE.some(function (m) { return m[0] === S.view; });
  t.innerHTML = TABS.map(function (x) {
    if (x[0] === '__add') return '<button class="tab-fab" onclick="openAddSheet()" aria-label="إضافة">' + IC('plus', 26) + '</button>';
    var on = x[0] === S.view || (x[0] === '__more' && inMore);
    return '<button class="tab' + (on ? ' on' : '') + '" onclick="' + (x[0] === '__more' ? 'openMoreSheet()' : 'go(\'' + x[0] + '\')') + '">'
      + IC(x[1], 23) + '<span>' + x[2] + '</span></button>';
  }).join('');
}

var markNav_core = markNav;
markNav = function () {
  markNav_core();
  renderTabbar();
  var b = el('topBtn');
  if (b && b.textContent) b.innerHTML = IC('plus', 18) + '<span>' + esc(PAGES[S.view][2]) + '</span>';
  document.body.setAttribute('data-view', S.view);
  var ms = el('monthSel'); if (ms) ms.style.display = CYCLE_VIEWS[S.view] ? '' : 'none';
  var r = el('abRefresh'); if (r && !r.innerHTML) r.innerHTML = IC('refresh', 20);
  window.scrollTo(0, 0);
};

/* ---------- الأوراق المنزلقة من الأسفل ---------- */
function openSheet(html) {
  el('sheet').innerHTML = '<div class="sheet-grip"></div>' + html;
  el('sheetBg').classList.remove('hidden');
  requestAnimationFrame(function () { el('sheetBg').classList.add('open'); });
}
function closeSheet() {
  var bg = el('sheetBg');
  bg.classList.remove('open');
  setTimeout(function () { bg.classList.add('hidden'); }, 220);
}
function sheetGo(v) { closeSheet(); go(v); }
function openMoreSheet() {
  openSheet('<div class="sheet-h">كل الأقسام</div><div class="more-grid">'
    + MORE.map(function (m) {
        return '<button class="more-it' + (S.view === m[0] ? ' on' : '') + '" onclick="sheetGo(\'' + m[0] + '\')">'
          + '<span class="more-ic">' + IC(m[1], 22) + '</span><span>' + m[2] + '</span></button>';
      }).join('')
    + '</div><button class="sheet-row danger" onclick="closeSheet();logout()">' + IC('out', 20) + '<span>تسجيل الخروج</span></button>');
}
function openAddSheet() {
  var rows = [
    ['oblig', 'list', 'التزام جديد', 'قسط، فاتورة، اشتراك، إيجار', 'openOblig()'],
    ['income', 'income', 'مصدر دخل', 'راتب، دعم، دخل إضافي', 'openIncome()'],
    ['purchases', 'cart', 'شراء', 'مصروف يومي صغير', 'openPurchase()'],
    ['dash', 'wand', 'وزّع الالتزامات على رواتبك', 'كلود يقترح، والمحرك يدقّق', 'openAllocate()']
  ];
  openSheet('<div class="sheet-h">إضافة</div>' + rows.map(function (r) {
    return '<button class="sheet-row" onclick="closeSheet();' + r[4] + '">'
      + '<span class="sr-ic">' + IC(r[1], 21) + '</span><span class="sr-tx"><b>' + r[2] + '</b><small>' + r[3] + '</small></span></button>';
  }).join(''));
}

/* ---------- الرئيسية: ساعة الدورة ---------- */
function isoDays_(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
function arDay_(iso) {
  var m = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var p = String(iso).split('-'); return { d: +p[2], m: m[(+p[1]) - 1] || '' };
}
function num_(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }

function cycleDial_() {
  var d = S.data, s = d.summary, cr = d.settings.cycleRange || { start: TODAY_ISO, end: TODAY_ISO };
  var total = Math.max(1, isoDays_(cr.start, cr.end) + 1);
  var isCur = d.month === currentCycle();
  var passed = isCur ? Math.min(total, Math.max(0, isoDays_(cr.start, TODAY_ISO) + 1)) : (d.month < currentCycle() ? total : 0);
  var R = 112, C = 2 * Math.PI * R, cx = 140, cy = 140;
  var pos = function (iso) {
    var k = Math.min(total, Math.max(0, isoDays_(cr.start, iso) + .5)) / total;
    var a = -Math.PI / 2 - k * 2 * Math.PI;   // عكس عقارب الساعة: اتجاه القراءة العربية
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  };
  var marks = '';
  d.obligations.forEach(function (o) {
    if (!o.dueDate || o.dueDate < cr.start || o.dueDate > cr.end) return;
    var p = pos(o.dueDate);
    marks += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.2" class="mk ' + (o.paid ? 'mk-paid' : o.overdue ? 'mk-late' : 'mk-due') + '"/>';
  });
  d.incomes.forEach(function (i) {
    if (!i.isBasic || !i.occurrenceDate || i.occurrenceDate < cr.start || i.occurrenceDate > cr.end) return;
    var p = pos(i.occurrenceDate);
    marks += '<rect x="' + (p[0] - 5).toFixed(1) + '" y="' + (p[1] - 5).toFixed(1) + '" width="10" height="10" rx="2.5" class="mk-inc' + (i.arrived ? ' got' : '') + '" transform="rotate(45 ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"/>';
  });
  var now = isCur ? pos(TODAY_ISO) : null;
  var next = d.incomes.filter(function (i) { return i.isBasic && !i.paused && !i.arrived && i.occurrenceDate && i.occurrenceDate >= TODAY_ISO; })
    .sort(function (a, b) { return a.occurrenceDate < b.occurrenceDate ? -1 : 1; })[0];
  var left = next ? isoDays_(TODAY_ISO, next.occurrenceDate) : isoDays_(TODAY_ISO, cr.end) + 1;
  var safe = s.safeRemaining;
  var dash = (passed / total) * C;
  var a = arDay_(cr.start), b = arDay_(cr.end);
  return '<section class="dial-card">'
    + '<div class="dial-wrap"><svg viewBox="0 0 280 280" class="dial" role="img" aria-label="الدورة الحالية">'
    +   '<defs><linearGradient id="gArc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>'
    +   '<circle cx="140" cy="140" r="' + R + '" class="trk"/>'
    +   '<circle cx="140" cy="140" r="' + R + '" class="arc" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '" transform="translate(280 0) scale(-1 1) rotate(-90 140 140)"/>'
    +   marks
    +   (now ? '<circle cx="' + now[0].toFixed(1) + '" cy="' + now[1].toFixed(1) + '" r="7.5" class="now"/>' : '')
    + '</svg>'
    + '<div class="dial-c"><small>المتبقي الآمن</small><strong class="' + (safe < 0 ? 'neg' : '') + '">' + num_(safe) + '</strong><em>ريال</em>'
    +   '<span class="dial-left">' + (next ? (left === 0 ? 'الراتب ينزل اليوم' : 'باقي ' + left + ' ' + (left === 1 ? 'يوم' : left <= 10 ? 'أيام' : 'يوماً') + ' على ' + esc(next.name))
                                       : (isCur ? 'باقي ' + Math.max(0, left) + ' يوماً في الدورة' : monthName(d.month))) + '</span></div>'
    + '</div>'
    + '<div class="dial-range"><span>' + a.d + ' ' + a.m + '</span><span class="lg"><i class="lg-due"></i>استحقاق<i class="lg-inc"></i>دخل<i class="lg-now"></i>اليوم</span><span>' + b.d + ' ' + b.m + '</span></div>'
    + '<div class="trio">'
    +   '<div><small>الدخل</small><b>' + num_(s.incomeExpected) + '</b><span>نزل ' + num_(s.incomeRealized) + '</span></div>'
    +   '<div><small>الالتزامات</small><b>' + num_(s.plannedObligations) + '</b><span>' + d.obligations.length + ' التزام</span></div>'
    +   '<div><small>المسدَّد</small><b>' + num_(s.paidObligations) + '</b><span>باقٍ ' + num_(s.unpaidObligations) + '</span></div>'
    + '</div></section>';
}

function quickActs_() {
  var q = [['check', 'سدّد', "go('paylog')"], ['list', 'التزام', 'openOblig()'], ['cart', 'شراء', 'openPurchase()'], ['spark', 'المستشار', "go('advisor')"]];
  return '<div class="qa">' + q.map(function (x) {
    return '<button onclick="' + x[2] + '"><span>' + IC(x[0], 22) + '</span>' + x[1] + '</button>';
  }).join('') + '</div>';
}

function alerts_() {
  var d = S.data, s = d.summary, obs = d.obligations, out = [];
  var overdue = obs.filter(function (o) { return o.overdue; });
  var unalloc = obs.filter(function (o) { return o.unallocatedAmount > 0; });
  var late = d.incomes.filter(function (i) { return i.isBasic && !i.paused && i.inWindow && !i.arrived && i.occurrenceDate && i.occurrenceDate < TODAY_ISO; });
  if (!d.sourceBreakdown.length) out.push(['gold', 'أضف راتبك أو مصدر دخلك الأساسي ليبدأ الحساب', "openIncome()", 'إضافة']);
  if (overdue.length) out.push(['red', overdue.length + ' التزام فات موعده — ' + num_(overdue.reduce(function (a, o) { return a + o.remainingAmount; }, 0)) + ' ريال', "go('paylog')", 'سدّد']);
  if (s.arrearsTotal > 0) out.push(['red', 'متأخرات من دورات سابقة ' + num_(s.arrearsTotal) + ' ريال', "go('paylog')", 'عرض']);
  if (late.length) out.push(['gold', 'لم تسجّل نزول ' + late.map(function (i) { return i.name; }).join('، '), "go('income')", 'سجّل']);
  if (unalloc.length) out.push(['blue', unalloc.length + ' التزام بلا مصدر سداد', 'openAllocate()', 'وزّع']);
  if (s.remaining < 0) out.push(['red', 'مصاريفك تتجاوز دخلك بـ ' + num_(-s.remaining) + ' ريال', "go('flow')", 'التدفق']);
  if (s.purchasesOverBudget) out.push(['gold', 'تجاوزت سقف المشتريات بـ ' + num_(s.purchasesSpent - s.purchaseBudget) + ' ريال', "go('purchases')", 'عرض']);
  (d.reserveStatus || []).filter(function (r) { return !r.depositedThisCycle; }).slice(0, 2).forEach(function (r) {
    out.push(['purple', 'جنّب ' + num_(r.monthly) + ' ريال لـ ' + r.name + ' هذه الدورة', "go('savings')", 'جنّب']);
  });
  if (!out.length) return '<div class="calm">' + IC('check', 18) + '<span>وضعك متوازن — المقترح ادخار <b>' + num_(s.suggestedSaving) + '</b> ريال هذه الدورة</span></div>';
  return '<div class="alerts">' + out.map(function (a) {
    return '<button class="al al-' + a[0] + '" onclick="' + a[2] + '"><i></i><span>' + esc(a[1]) + '</span><b>' + a[3] + '</b></button>';
  }).join('') + '</div>';
}

function dues_() {
  var list = S.data.obligations.filter(function (o) { return !o.paid && (o.daysLeft <= 10 || o.overdue); })
    .sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; }).slice(0, 6);
  if (!list.length) return '';
  return '<section class="blk"><div class="blk-h"><h3>القادم خلال ١٠ أيام</h3><button onclick="go(\'paylog\')">الكل</button></div>'
    + '<div class="dues">' + list.map(function (o) {
        var a = arDay_(o.dueDate);
        var when = o.overdue ? 'متأخر' : o.daysLeft < 0 ? 'يُصرف خلال الدورة' : o.daysLeft === 0 ? 'اليوم' : o.daysLeft === 1 ? 'غداً' : 'بعد ' + o.daysLeft + ' أيام';
        var src = (o.sources || []).map(function (x) { return x.sourceName; }).join(' + ') || 'بلا مصدر';
        return '<div class="due' + (o.overdue ? ' late' : '') + '">'
          + '<div class="due-d"><b>' + a.d + '</b><span>' + a.m + '</span></div>'
          + '<div class="due-t"><b>' + esc(o.name) + '</b><span>' + when + ' · ' + esc(src) + '</span></div>'
          + '<div class="due-a"><b>' + num_(o.remainingAmount || o.amount) + '</b>'
          + (o.autoDeduct ? '<span class="auto">تلقائي</span>' : '<button onclick="pay(\'' + o.id + '\',true)">سدّدت</button>') + '</div></div>';
      }).join('') + '</div></section>';
}

function sources_() {
  var bd = S.data.sourceBreakdown;
  if (!bd.length) return '';
  return '<section class="blk"><div class="blk-h"><h3>رواتبك ومصادرك</h3><button onclick="go(\'income\')">إدارة</button></div>'
    + bd.map(function (b) {
        var used = Math.min(100, Math.max(0, (b.usage || 0) * 100));
        return '<div class="inc">'
          + '<div class="inc-top"><b>' + esc(b.name) + '</b><span>يوم ' + b.day + (b.arrived ? ' · نزل' : '') + '</span><strong>' + num_(b.amount) + '</strong></div>'
          + '<div class="inc-bar' + (b.free < 0 ? ' over' : '') + '"><i style="width:' + used.toFixed(1) + '%"></i></div>'
          + '<div class="inc-bot"><span>مربوط ' + num_(b.allocated) + '</span><span class="' + (b.free < 0 ? 'neg' : 'pos') + '">' + (b.free < 0 ? 'عجز ' + num_(-b.free) : 'حر ' + num_(b.free)) + '</span></div>'
          + '</div>';
      }).join('') + '</section>';
}

function pDash() {
  if (!S.data) return '';
  return '<div class="home">' + cycleDial_() + quickActs_() + alerts_() + startWindowNote() + dues_() + sources_() + arrearsPanel() + '</div>';
}

/* ---------- تحية حسب الوقت في الشريط العلوي ---------- */
var showApp_core = showApp;
showApp = function () {
  showApp_core();
  renderTabbar();
  var r = el('abRefresh'); if (r) r.innerHTML = IC('refresh', 20);
};

/* ============================================================ الالتزامات: قائمة بطاقات ============================================================ */
function obFilterCount_() {
  var f = S.f, n = 0;
  ['source', 'priority', 'recurrence', 'category'].forEach(function (k) { if (f[k] !== 'all') n++; });
  if (f.from) n++; if (f.to) n++;
  return n;
}
function openObFilter() {
  var f = S.f;
  openSheet('<div class="sheet-h">تصفية الالتزامات</div>'
    + fld('مصدر السداد', '<select onchange="fset(\'source\',this.value)"><option value="all">كل المصادر</option>'
      + S.data.incomes.filter(function (i) { return i.isBasic; }).map(function (i) {
          return '<option value="' + i.id + '"' + (f.source === i.id ? ' selected' : '') + '>' + esc(i.name) + '</option>'; }).join('') + '</select>')
    + fld('الأولوية', '<select onchange="fset(\'priority\',this.value)">' + opts(['all|الكل', 'عالية|عالية', 'متوسطة|متوسطة', 'منخفضة|منخفضة'], f.priority) + '</select>')
    + fld('التكرار', '<select onchange="fset(\'recurrence\',this.value)">' + opts(['all|الكل', 'أسبوعي|أسبوعي', 'كل أسبوعين|كل أسبوعين', 'شهري|شهري', 'ربع سنوي|ربع سنوي', 'نصف سنوي|نصف سنوي', 'سنوي|سنوي', 'مرة واحدة|مرة واحدة'], f.recurrence) + '</select>')
    + fld('التصنيف', '<select onchange="fset(\'category\',this.value)"><option value="all">الكل</option>'
      + (S.data.settings.obligationCategories || []).map(function (c) {
          return '<option value="' + attr(c) + '"' + (f.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>')
    + '<div class="two-col">' + fld('موعده من', '<input type="date" value="' + attr(f.from) + '" onchange="fset(\'from\',this.value)">')
    + fld('إلى', '<input type="date" value="' + attr(f.to) + '" onchange="fset(\'to\',this.value)">') + '</div>'
    + '<div class="acts"><button class="btn-main" onclick="closeSheet()">عرض النتائج</button><button class="btn" onclick="fReset();closeSheet()">مسح التصفية</button></div>');
}

function obManage() {
  var f = S.f, all = S.allObs;
  if (!all) return waitOrErr('allObs', 'جاري تحميل الالتزامات…', 'loadAllObs()');
  var list = all.filter(function (o) {
    if (f.quick === 'unalloc' && o.unallocatedAmount <= 0) return false;
    if (f.quick === 'fun' && o.type !== 'ترفيهي') return false;
    if (f.quick === 'once' && o.recurring) return false;
    if (f.quick === 'ending' && !o.endDate) return false;
    if (f.quick === 'ended' && !o.ended) return false;
    if (f.quick === 'inactive' && o.active) return false;
    if (f.source !== 'all' && !o.sources.some(function (s) { return s.sourceId === f.source; })) return false;
    if (f.priority !== 'all' && o.priority !== f.priority) return false;
    if (f.recurrence !== 'all' && (o.recurrence || 'شهري') !== f.recurrence) return false;
    if (f.category !== 'all' && o.category !== f.category) return false;
    if (f.from && (o.nextDue || '') < f.from) return false;
    if (f.to && (o.nextDue || '9999') > f.to) return false;
    if (f.q) {
      var hay = (o.name + ' ' + o.notes + ' ' + o.sources.map(function (s) { return s.sourceName; }).join(' ')).toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
    }
    return true;
  }).sort(function (a, b) { return (a.nextDue || '9999') < (b.nextDue || '9999') ? -1 : 1; });

  var unalloc = all.filter(function (o) { return o.unallocatedAmount > 0; });
  var monthly = all.filter(function (o) { return o.active && !o.ended; }).reduce(function (x, o) { return x + (Number(o.amount) || 0); }, 0);
  var cnt = function (k) {
    return k === 'all' ? all.length : k === 'unalloc' ? unalloc.length : k === 'fun' ? all.filter(function (o) { return o.type === 'ترفيهي'; }).length
      : k === 'once' ? all.filter(function (o) { return !o.recurring; }).length : k === 'ending' ? all.filter(function (o) { return !!o.endDate; }).length
      : k === 'ended' ? all.filter(function (o) { return o.ended; }).length : all.filter(function (o) { return !o.active; }).length;
  };
  var nf = obFilterCount_();

  return '<div class="ob-hero"><div><small>التزاماتك النشطة</small><b>' + num_(monthly) + ' <em>ريال</em></b><span>' + all.length + ' التزام معرَّف</span></div>'
    + (unalloc.length
        ? '<button class="ob-ai" onclick="aiAllocOpen(\'unassigned\')">' + IC('spark', 18) + '<span>وزّع ' + unalloc.length + ' بلا مصدر</span></button>'
        : '<button class="ob-ai calm2" onclick="aiAllocOpen(\'all\')">' + IC('check', 18) + '<span>كلها مربوطة</span></button>')
    + '</div>'
    + '<div class="ob-search"><input id="obq" value="' + attr(f.q) + '" oninput="obSearch(this.value)" placeholder="ابحث باسم الالتزام أو المصدر">'
    + '<button class="ob-filter' + (nf ? ' on' : '') + '" onclick="openObFilter()">تصفية' + (nf ? ' <b>' + nf + '</b>' : '') + '</button></div>'
    + '<div class="ob-chips">' + [['all', 'الكل'], ['unalloc', 'بلا مصدر'], ['fun', 'ترفيهي'], ['once', 'مرة واحدة'], ['ending', 'له نهاية'], ['ended', 'منتهٍ'], ['inactive', 'غير نشط']]
        .filter(function (x) { return x[0] === 'all' || cnt(x[0]) > 0; })
        .map(function (x) { return '<button class="' + (f.quick === x[0] ? 'on' : '') + '" onclick="fset(\'quick\',\'' + x[0] + '\')">' + x[1] + ' <i>' + cnt(x[0]) + '</i></button>'; }).join('')
    + '</div>'
    + obDiagPanel()
    + obTable(list)
    + '<div class="ob-tools"><button onclick="openAllocate(\'all\')">' + IC('wand', 17) + 'أعد توزيع الكل</button>'
    + '<button onclick="runObDiag()">' + IC('whatif', 17) + 'لماذا لا يظهر التزام؟</button>'
    + '<button onclick="exportCsv(\'obligations\')">' + IC('income', 17) + 'تصدير</button></div>';
}

function obTable(list) {
  if (!list.length) return '<div class="ob-empty">' + (S.allObs && S.allObs.length ? 'لا شيء يطابق هذا البحث.' : 'لم تضف أي التزام بعد.')
    + '<button class="btn-main" onclick="' + (S.allObs && S.allObs.length ? 'fReset()' : 'openOblig()') + '">' + (S.allObs && S.allObs.length ? 'مسح التصفية' : 'أضف أول التزام') + '</button></div>';
  return '<div class="obl">' + list.map(function (o) {
    var isOpen = S.openOb === o.id;
    var due = o.nextDue ? arDay_(o.nextDue) : null;
    var meta = [o.category || 'أخرى', esc(o.recurrence || 'شهري'), o.type];
    if (o.autoDeduct) meta.push('خصم تلقائي');
    var flags = (o.unallocatedAmount > 0 ? '<span class="fl fl-red">بلا مصدر ' + num_(o.unallocatedAmount) + '</span>' : '')
      + (o.isEstimated ? '<span class="fl fl-gold">تقديري</span>' : '')
      + (o.isExpected ? '<span class="fl fl-gold">متوقع</span>' : '')
      + (o.isShared ? '<span class="fl fl-blue">حصتك ' + o.sharePercent + '%</span>' : '')
      + (o.endDate ? '<span class="fl">ينتهي ' + arDate(o.endDate) + '</span>' : '')
      + (!o.active ? '<span class="fl fl-red">غير نشط</span>' : '') + (o.ended ? '<span class="fl">منتهٍ</span>' : '');
    var srcs = o.sources.map(function (s) {
      return '<span class="sc' + (s.missing ? ' bad' : '') + '">' + esc(s.sourceName || 'مصدر محذوف') + (o.isSplit ? ' · ' + num_(s.amount) : '') + '</span>';
    }).join('');
    return '<article class="oc' + (isOpen ? ' open' : '') + (o.ended || !o.active ? ' dim' : '') + '" onclick="toggleOb(\'' + o.id + '\',event)">'
      + '<div class="oc-main">'
      +   '<div class="oc-d">' + (due ? '<b>' + due.d + '</b><span>' + due.m + '</span>' : '<b>—</b><span>' + esc(o.status || '') + '</span>') + '</div>'
      +   '<div class="oc-t"><b>' + esc(o.name) + '</b><span>' + meta.map(esc).join(' · ') + '</span></div>'
      +   '<div class="oc-a"><b>' + num_(o.amount) + '</b>' + (o.occurrences > 1 ? '<span>' + num_(o.unitAmount) + ' × ' + o.occurrences + '</span>' : '<span>ريال</span>') + '</div>'
      + '</div>'
      + ((srcs || flags) ? '<div class="oc-sub">' + srcs + flags + '</div>' : '')
      + (isOpen
          ? '<div class="oc-open">' + timelineBlock()
            + '<div class="oc-acts">'
            + (o.isEstimated ? '<button onclick="aiPredict(\'' + o.id + '\',\'' + attrJs(o.name) + '\')">' + IC('spark', 16) + 'توقّع المبلغ</button>' : '')
            + '<button onclick="openOblig(\'' + o.id + '\')">تعديل</button>'
            + '<button class="del" onclick="delOblig(\'' + o.id + '\')">حذف</button></div></div>'
          : '')
      + '</article>';
  }).join('') + '</div>';
}

/* دورات الالتزام بشكل قائمة مضغوطة */
function timelineBlock() {
  var t = S.timeline;
  if (!t) {
    if (S.errs.timeline) return '<div class="note n-red">تعذّر جلب الدورات: ' + esc(S.errs.timeline) + '</div>';
    return '<div class="tlm-wait">جاري جلب الدورات…</div>';
  }
  var pct = t.totalDue ? Math.min(100, Math.round(t.totalPaid / t.totalDue * 100)) : 0;
  return '<div class="tlm"><div class="tlm-h"><span>سُدِّد ' + num_(t.totalPaid) + ' من ' + num_(t.totalDue) + '</span>'
    + (t.unpaidCycles ? '<span class="neg">' + t.unpaidCycles + ' دورة لم تُسدَّد</span>' : '<span class="pos">لا متأخرات</span>') + '</div>'
    + '<div class="inc-bar"><i style="width:' + pct + '%"></i></div>'
    + (t.rows.length ? t.rows.map(function (x) {
        var cls = x.remaining <= 0 ? 'done' : (x.overdue ? 'late' : '');
        return '<div class="tlm-r ' + cls + (x.isCurrent ? ' cur' : '') + '">'
          + '<div class="tlm-c"><b>' + arDate(x.dueDate) + '</b><span>' + (x.isCurrent ? 'الدورة الحالية · ' : '') + esc(x.status) + '</span></div>'
          + '<div class="tlm-v"><b>' + num_(x.amount) + '</b>' + (x.paidAmount && x.remaining > 0 ? '<span>سُدّد ' + num_(x.paidAmount) + '</span>' : '') + '</div>'
          + '<div class="tlm-x">' + cycleActions(t, x) + '</div></div>';
      }).join('') : '<div class="tlm-wait">لا دورات في المدى المعروض.</div>')
    + '</div>';
}

/* ============================================================ الجداول تصير بطاقات على الجوال ============================================================ */
function cardifyTables(root) {
  var tws = (root || el('view')).querySelectorAll('.tw');
  for (var i = 0; i < tws.length; i++) {
    var tw = tws[i], t = tw.querySelector('table');
    if (!t || tw.classList.contains('cards') || tw.hasAttribute('data-keep')) continue;
    var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    if (!heads.length) continue;
    tw.classList.add('cards');
    var rows = t.querySelectorAll('tbody tr');
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) { rows[r].classList.add('full'); continue; }
      for (var c = 0; c < cells.length; c++) {
        var lb = heads[c] || '';
        cells[c].setAttribute('data-label', lb);
        if (!lb || /^(إجراء|سدّد|إجراءات)$/.test(lb)) cells[c].classList.add('act');
      }
    }
  }
}
var render_core = render;
render = function () {
  render_core();
  try { cardifyTables(); foldIntro_(); } catch (e) {}
};
var modal_core = modal;
modal = function (html, small) {
  modal_core(html, small);
  try { cardifyTables(el('modal')); } catch (e) {}
};

/* شرح الصفحة الطويل يُطوى خلف سطر واحد — الصفحة تبدأ بالمحتوى لا بالشرح */
function foldIntro_() {
  var v = el('view'), first = v && v.firstElementChild;
  if (!first || !first.classList.contains('note') || !first.classList.contains('n-blue')) return;
  var d = document.createElement('details');
  d.className = 'intro';
  d.innerHTML = '<summary>كيف تعمل هذه الصفحة؟</summary>';
  v.insertBefore(d, first);
  d.appendChild(first);
}
