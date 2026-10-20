/* ============================================================ الحالة ============================================================ */
var NOW = new Date();
var TODAY_ISO = NOW.toLocaleDateString('en-CA');
// الدورة الحالية يحددها السيرفر — تقويم المتصفح لا يعرف دورة تبدأ يوم 27
var THIS_MONTH = '';
function currentCycle(){
  return (S.data && S.data.settings && S.data.settings.currentMonth) || THIS_MONTH || S.month;
}

var S = {
  token: localStorage.getItem('myz_token') || '',
  view: 'dash',
  month: '',
  theme: localStorage.getItem('myz_theme') || 'midnight',
  fs: localStorage.getItem('myz_fs') || 'n',
  data: null, debt: null, trend: null, trash: null, recurring: null, audit: null, forecast: null, errs: {}, reserves: null, pload: null,
  payr: { from:'', to:'', data:null, status:'all', q:'' }, prr: { from:'', to:'', data:null },
  flow: null, sens: null, payoff: null, fund: null, transfers: null, simItems: [], obDiag: null,
  allObs: null, openOb: null, timeline: null,
  ai: { status:null, history:null, busy:false, last:null, quality:null, diag:null, plan:null },
  trendRange: 6, sms: [],
  f: { q:'', quick:'all', source:'all', priority:'all', recurrence:'all', category:'all', from:'', to:'' },
  pf: { q:'', cat:'all' },
  qp: { amount:'', item:'', category:'' },
  payf: { q:'', status:'all', from:'', to:'' },
  alloc: []
};

var THEMES = [['light','فاتح','sw1'],['midnight','ليلي','sw2'],['mocha','موكا','sw3'],['emerald','زمردي','sw4'],['government','حكومي','sw5']];
/* ألوان كل ثيم للمعاينة — مأخوذة من تعريفاته نفسها */
var THEME_PREVIEW = {
  light:      { bg:'#f4efe7', card:'#fffdf9', accent:'#a8782d', text:'#2f2a24', muted:'#756d62', desc:'دافئ ومريح نهاراً' },
  midnight:   { bg:'#09131f', card:'#15263a', accent:'#d7b36a', text:'#f5f7fa', muted:'#9aabbe', desc:'أزرق ليلي هادئ' },
  mocha:      { bg:'#17100c', card:'#2b1d15', accent:'#d5a85d', text:'#fbf4eb', muted:'#b9a697', desc:'بني داكن دافئ' },
  emerald:    { bg:'#071513', card:'#102823', accent:'#d4b46a', text:'#f2f8f5', muted:'#93aaa4', desc:'أخضر عميق' },
  government: { bg:'#f5f7f6', card:'#ffffff', accent:'#006b52', text:'#14231f', muted:'#5d6e68', desc:'رسمي بطابع حكومي' }
};
function themeCards(){
  return '<div class="tgrid">' + THEMES.map(function(t){
    var p = THEME_PREVIEW[t[0]], on = S.theme === t[0];
    return '<button class="tcard'+(on?' on':'')+'" onclick="setTheme(\''+t[0]+'\')" aria-label="'+t[1]+'">'
      + '<div class="tprev" style="background:'+p.bg+'">'
      +   '<div class="tbar" style="background:'+p.card+'"><i style="background:'+p.accent+'"></i></div>'
      +   '<div class="tbody">'
      +     '<div class="tbox" style="background:'+p.card+'"><b style="background:'+p.accent+'"></b>'
      +       '<s style="background:'+p.muted+'"></s><s style="background:'+p.muted+';width:55%"></s></div>'
      +     '<div class="tbox" style="background:'+p.card+'"><b style="background:'+p.text+';opacity:.75"></b>'
      +       '<s style="background:'+p.muted+'"></s></div>'
      +   '</div>'
      +   (on ? '<span class="tchk" style="background:'+p.accent+'">✓</span>' : '')
      + '</div>'
      + '<div class="tname">'+t[1]+'</div><div class="tdesc">'+p.desc+'</div>'
      + '</button>';
  }).join('') + '</div>';
}

var PAGES = {
  dash:      ['لوحة القيادة','نظرة شاملة على وضعك المالي هذا الشهر','توزيع تلقائي'],
  income:    ['مصادر الدخل','من أين يأتي مالك ومتى ينزل','إضافة مصدر'],
  oblig:     ['إدارة الالتزامات','إضافة وتعديل وربط كل التزام بمصدر دخله','إضافة التزام'],
  paylog:    ['سجل السداد','ما سدَّدته وما بقي عليك هذا الشهر',''],
  debt:      ['الديون والأقساط','كم بقي من كل تمويل ومتى ينتهي',''],
  forecast:  ['ما ينتظرك','الدورات القادمة والتزاماتها المتوقعة','إضافة التزام متوقع'],
  flow:      ['التدفق اليومي','رصيدك يوماً بيوم — ومتى ينقلب سالباً',''],
  purchases: ['المشتريات النثرية','مصاريفك اليومية الصغيرة وتحليلها','تسجيل شراء'],
  savings:   ['أهداف الادخار','خطة ادخار مبنية على المتبقي الآمن','إضافة هدف'],
  reports:   ['التقارير والاتجاه','مقارنة الشهور وتحليل التصنيفات',''],
  whatif:    ['محاكي ماذا لو','جرّب قراراً مالياً قبل أن تتخذه',''],
  settings:  ['الإعدادات','الخطة المالية، الإقفال، سلة المحذوفات',''],
  advisor:   ['المستشار المالي','تحليل وتخطيط ونصيحة مبنية على أرقامك',''],
  guide:     ['دليل الاستخدام','ما وظيفة كل صفحة وكل زر','']
};

var NAV = [
  ['الرئيسية',        [['dash','⌂'],['income','↘'],['oblig','▤'],['paylog','✓']]],
  ['المستقبل',        [['flow','∿'],['forecast','⇢'],['debt','◴']]],
  ['المصروف والادخار', [['purchases','🧾'],['savings','◇']]],
  ['التحليل',         [['advisor','✦'],['reports','◫'],['whatif','◎']]],
  ['النظام',          [['guide','؟'],['settings','⚙']]]
];

/* ============================================================ الإقلاع ============================================================ */
if (!localStorage.getItem('myz_theme')) try { localStorage.setItem('myz_theme', S.theme); } catch (e) {}
document.documentElement.setAttribute('data-theme', S.theme);
document.documentElement.setAttribute('data-fs', S.fs);

window.addEventListener('load', function () {
  renderLoginThemes();
  markFs();
  el('lPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && el('aiQ') && document.activeElement === el('aiQ')) aiSend();
  });
  if (S.token) { showApp(); refresh(true); } else showLogin();
});

function showLogin(){ el('login').classList.remove('hidden'); el('app').classList.add('hidden'); }
function showApp(){ el('login').classList.add('hidden'); el('app').classList.remove('hidden'); renderNav(); renderMonths(); }

function login(){
  var u = v('lUser').trim(), p = v('lPass');
  el('lErr').classList.add('hidden');
  busy(true,'جاري التحقق…');
  srv(function(r){
    busy(false);
    if (r && r.success){ S.token = r.token; localStorage.setItem('myz_token', r.token); showApp(); refresh(true); }
    else showLoginErr((r && r.message) || 'تعذر الدخول');
  }, function(e){ busy(false); showLoginErr(msg(e)); }).authenticate(u,p);
}
function showLoginErr(m){ var e = el('lErr'); e.textContent = m; e.classList.remove('hidden'); }

function logout(){
  var t = S.token;
  S.token=''; S.data=null; S.debt=null; S.trend=null; S.trash=null;
  localStorage.removeItem('myz_token');
  showLogin();
  // إنهاء الجلسة على السيرفر أيضاً، لا في المتصفح فقط
  if (t) google.script.run.logout(t);
}

/* ============================================================ الاتصال ============================================================ */
function srv(ok, fail){
  return google.script.run.withSuccessHandler(ok)
    .withFailureHandler(fail || function(e){ busy(false); toast(msg(e),'err'); });
}
function msg(e){ return (e && e.message) ? String(e.message) : 'حدث خطأ غير متوقع'; }
function failBusy(e){
  busy(false);
  var m = msg(e);
  if (/الجلسة/.test(m)) { sessionEnded(); return; }
  // الخطأ يبقى ظاهراً حتى تغلقه — الإشعار السريع كان يضيع قبل قراءته
  toast(m,'err');
  showErr(m);
}
function sessionEnded(){
  S.token=''; localStorage.removeItem('myz_token');
  showLogin(); showLoginErr('انتهت الجلسة — سجّل الدخول من جديد');
}

function refresh(loader){
  if (!S.token) return;
  busy(loader !== false, 'جاري جلب البيانات…');
  srv(function(d){
    busy(false);
    if (d && d.error && /الجلسة/.test(d.error)){ sessionEnded(); return; }
    if (!d || d.error){ showErr('تعذّر جلب البيانات: ' + ((d && d.error) || 'رد فارغ من الخادم — أعد النشر بإصدار جديد')); return; }
    S.data = d; S.month = d.month;
    renderMonths(); render();
    loadViewData(S.view);
  }, failBusy).getAppData(S.token, S.month);
}

/** كل عمليات التعديل ترجع البيانات المحدثة، فتكفي رحلة واحدة. */
function after(r){
  busy(false);
  if (!r) return;
  if (r.error){ toast(r.error,'err'); return; }
  if (r.data){ S.data = r.data; S.month = r.data.month; renderMonths(); render(); hideErr(); }
  if (r.message) toast(r.message,'ok');
}

/* ============================================================ التنقل ============================================================ */
function renderNav(){
  el('nav').innerHTML = NAV.map(function(g){
    return '<div class="nav-label">'+g[0]+'</div>' + g[1].map(function(p){
      return '<button data-v="'+p[0]+'" onclick="go(\''+p[0]+'\')"><span class="ico">'+p[1]+'</span>'+PAGES[p[0]][0]+'</button>';
    }).join('');
  }).join('');
  markNav();
}
function markNav(){
  var list = document.querySelectorAll('#nav button[data-v]');
  for (var i=0;i<list.length;i++) list[i].classList.toggle('on', list[i].getAttribute('data-v') === S.view);
  var p = PAGES[S.view];
  el('ttl').textContent = p[0];
  el('sub').textContent = p[1];
  var b = el('topBtn');
  b.textContent = p[2] || '';
  b.style.display = p[2] ? '' : 'none';
}
/* الدورة تُعالَج داخلياً — المحدد يظهر فقط حيث يلزم: التقارير والإقفال */
var CYCLE_VIEWS = { reports:1, settings:1 };
function go(view){
  var sel = el('monthSel');
  if (sel) sel.style.display = CYCLE_VIEWS[view] ? '' : 'none';
  S.view = view; markNav();
  if (!CYCLE_VIEWS[view] && S.data && S.month !== currentCycle()){
    setMonth(currentCycle());   // العودة لدورتك الحالية — refresh يستدعي المحمّلات بعد الجلب
    return;
  }
  render();
  loadViewData(view);
}
/** محمّلات كل صفحة في مكان واحد — تُستدعى عند التنقل وبعد كل جلب للبيانات. */
function loadViewData(view){
  if (!S.data) return;
  if (view === 'paylog' && !S.payr.data) loadPayRange();
  if (view === 'debt' && !S.debt) loadDebt();
  if (view === 'debt' && !S.payoff) loadPayoff();
  if (view === 'forecast' && !S.forecast) loadForecast();
  if (view === 'forecast' && !S.pload) loadPayload();
  if (view === 'oblig' && !S.allObs) loadAllObs();
  if (view === 'flow' && !S.flow) loadFlow();
  if (view === 'reports' && !S.trend) loadTrend();
  if (view === 'settings' && !S.trash) loadTrash();
  if (view === 'settings' && !S.audit) loadAudit();
  if (view === 'settings' && !S.ai.status) loadAiStatus();
  if (view === 'income' && !S.transfers) loadTransfers();
  if (view === 'savings' && !S.reserves) loadReserves();
  if (view === 'advisor'){
    if (!S.ai.status) loadAiStatus();
    if (!S.ai.history) loadAiHistory();
    if (!S.ai.quality) loadDataQuality();
    if (!S.ai.batchLoaded) loadLastBatch();
  }
}
function topAction(){
  if (S.view==='dash') openAllocate();
  else if (S.view==='income') openIncome();
  else if (S.view==='oblig') openOblig();
  else if (S.view==='purchases') openPurchase();
  else if (S.view==='savings') openSaving();
  else if (S.view==='forecast') openOblig('', true);
}
function renderMonths(){
  var y = +S.month.slice(0,4), m = +S.month.slice(5,7), html = '';
  for (var i = -8; i <= 3; i++){
    var d = new Date(y, m-1+i, 1);
    var k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    html += '<option value="'+k+'"'+(k===S.month?' selected':'')+'>'+monthName(k)+'</option>';
  }
  el('monthSel').innerHTML = html;
}
function setMonth(m){
  S.month = m;
  S.trend = null; S.flow = null; S.sens = null; S.forecast = null; S.transfers = null; S.obDiag = null;
  S.payr.data = null; S.errs = {};
  refresh(true);
}

function render(){
  var map = { dash:pDash, income:pIncome, oblig:pOblig, paylog:obPayments, debt:pDebt,
              forecast:pForecast, flow:pFlow, purchases:pPurchases, advisor:pAdvisor, guide:pGuide,
              savings:pSavings, reports:pReports, whatif:pWhatIf, settings:pSettings };
  el('view').innerHTML = S.data ? map[S.view]() : '<div class="empty">جاري التحميل…</div>';
  if (S.view === 'dash') requestAnimationFrame(drawCharts);
  if (S.view === 'whatif') requestAnimationFrame(simRender);
}

/* ============================================================ 1) لوحة القيادة ============================================================ */
function pDash(){
  var d = S.data, s = d.summary, bd = d.sourceBreakdown, obs = d.obligations;
  var unalloc  = obs.filter(function(o){ return o.unallocatedAmount > 0; });
  var overdue  = obs.filter(function(o){ return o.overdue; });
  // المقارنة بتاريخ النزول الفعلي: رقم اليوم يضلّل في الدورات غير الميلادية
  var late = d.incomes.filter(function(i){
    return i.isBasic && !i.paused && i.inWindow && !i.arrived && i.occurrenceDate && i.occurrenceDate < TODAY_ISO;
  });

  var issues = [];
  if (!bd.length) issues.push('أضف مصدر دخل أساسي واحداً على الأقل.');
  if (unalloc.length) issues.push('يوجد ' + unalloc.length + ' التزام غير مربوط بالكامل بمصدر دخل — استخدم التوزيع التلقائي.');
  if (s.remaining < 0) issues.push('التزاماتك ومشترياتك تتجاوز دخلك بمقدار ' + money(Math.abs(s.remaining)) + '.');
  if (overdue.length) issues.push('لديك ' + overdue.length + ' التزام متأخر.');
  if (late.length) issues.push('دخل تجاوز موعده ولم تسجّل نزوله: ' + late.map(function(i){ return esc(i.name); }).join('، ') + '.');
  if (s.purchasesOverBudget) issues.push('تجاوزت سقف المشتريات النثرية بمقدار ' + money(s.purchasesSpent - s.purchaseBudget) + '.');
  if (s.arrearsTotal > 0) issues.push('عليك متأخرات من دورات سابقة بمقدار ' + money(s.arrearsTotal) + ' — مخصومة من المتبقي الآمن.');
  if (s.categoriesOver) issues.push(s.categoriesOver + ' تصنيف تجاوز سقفه الشهري — راجع صفحة المشتريات.');
  var rs = d.reserveStatus;
  if (rs && rs.length){
    var pend = rs.filter(function(r){ return !r.depositedThisCycle; });
    var rLate = rs.filter(function(r){ return r.behind > 0; });
    if (pend.length) issues.push('لم تسجّل تجنيب هذه الدورة: ' + pend.map(function(r){ return esc(r.name)+' ('+money(r.monthly)+')'; }).join('، ')
      + ' — من صفحة أهداف الادخار.');
    if (rLate.length) issues.push('تجنيب متأخر عن خطته: ' + rLate.map(function(r){ return esc(r.name)+' بـ '+money(r.behind); }).join('، ') + '.');
  }
  if (s.expectedObligations > 0) issues.push('من الالتزامات ' + money(s.expectedObligations)
    + ' متوقعة غير مؤكدة — احسم مصيرها من صفحة «ما ينتظرك».');
  var over = obs.filter(function(o){ return o.overpaid; });
  if (over.length) issues.push('سجل السداد يحتوي مبالغ تتجاوز المستحق في: '
    + over.map(function(o){ return esc(o.name)+' ('+money(o.recordedPaid)+' من '+money(o.amount)+')'; }).join('، ')
    + ' — شغّل «تجهيز ومزامنة البيانات» من قائمة ميزانيتي في الشيت لتنظيف الصفوف المكررة.');

  return kpis([
      ['الرصيد المرحّل', money(s.opening), s.opening>=0?'green':'red', 'من الشهر السابق'],
      ['الدخل المتوقع', money(s.incomeExpected), 'gold', 'منه ' + money(s.incomeRealized) + ' نزل فعلاً'],
      ['الالتزامات', money(s.plannedObligations), 'red', obs.length + ' التزام'
        + (s.autoDeducted ? ' · ' + money(s.autoDeducted) + ' خصم تلقائي' : '')],
      ['المشتريات المحجوزة', money(s.purchasesReserved), 'orange', 'صرفت ' + money(s.purchasesSpent)],
      ['المتبقي الآمن', money(s.safeRemaining), s.safeRemaining>0?'green':'red', 'بعد احتياطي ' + money(s.buffer)],
      ['الادخار المقترح', money(s.suggestedSaving), 'purple', s.savingsRate + '% من المتبقي الآمن']
    ].concat(s.arrearsTotal > 0 ? [['متأخرات سابقة', money(s.arrearsTotal), 'red', s.arrearsCount + ' التزام لم يُسدَّد']] : [])
     .concat(s.extraRealized > 0 ? [['دخل إضافي محقق', money(s.extraRealized), 'blue', 'يزيد سيولتك لا خطتك']] : []))
  + (issues.length
      ? '<div class="note ' + (s.remaining<0?'n-red':'n-gold') + '">' + issues.map(function(x){ return '• ' + x; }).join('<br>') + '</div>'
      : '<div class="note n-green">وضعك متوازن. المتبقي بعد كل شيء <strong>' + money(s.remaining) + '</strong>، والمقترح ادخار <strong>' + money(s.suggestedSaving) + '</strong>.</div>')
  + startWindowNote()
  + arrearsPanel()
  + '<div class="g2">'
  +   panel('توزيع كل مصدر دخل','الدخل ← المربوط ← الباقي', srcCards(bd))
  +   panel('دورة الدخل خلال الشهر','حسب يوم النزول', timeline(d.incomes))
  + '</div>'
  + '<div class="g2">'
  +   panel('أقرب الاستحقاقات','سدّد مباشرة من هنا بلا تنقّل', upcoming(obs),
        '<button class="btn btn-sm" onclick="go(\'paylog\')">كل السجل</button>')
  +   panel('حالة الالتزامات','مدفوع مقابل متبقٍ ومتأخر','<div id="donut" class="donut-wrap"></div>')
  + '</div>'
  + panel('استهلاك كل مصدر','النسبة المربوطة من دخل كل مصدر','<div id="bars" class="rows"></div>');
}

/** المتأخرات: التزامات شهور سابقة لم تُسدَّد — كانت تختفي تماماً عند دخول شهر جديد. */
/** يوضّح أثر تاريخ البداية بدل أن يختفي دخل أو التزام بلا تفسير. */
function startWindowNote(){
  var s = S.data.summary, st = S.data.settings;
  if (s.beforeStartMonth) {
    return '<div class="note n-gold">هذا الشهر يسبق تاريخ بداية عملك بالتطبيق ('+st.startDate+') '
      + 'فلا يُحسب فيه شيء. غيّر التاريخ من الإعدادات إن أردت تتبّع شهور أقدم.</div>';
  }
  if (!s.isStartMonth) return '';
  var out = S.data.incomes.filter(function(i){ return i.isBasic && !i.paused && !i.inWindow; });
  if (!out.length) return '';
  return '<div class="note n-blue">بدأت من <strong>'+st.startDate+'</strong>، فلم تُحتسب مصادر نزلت قبله هذا الشهر: '
    + out.map(function(i){ return esc(i.name)+' (يوم '+i.day+')'; }).join('، ')
    + '. تعود للحساب طبيعياً من الشهر القادم.</div>';
}

function arrearsPanel(){
  var list = S.data.arrears || [];
  if (!list.length) return '';
  return panel('متأخرات من شهور سابقة', list.length + ' التزام · ' + money(S.data.summary.arrearsTotal),
    '<div class="note n-red">هذه التزامات مضى شهرها ولم تُسدَّد. تُخصم من متبقيك الآمن حتى تسدّدها أو تعدّلها في شهرها.</div>'
    + list.map(function(a){
        return '<div class="arr"><div><strong>'+esc(a.name)+'</strong>'
          + '<div class="sub mut" style="font-size:12px">'+monthName(a.month)+' · استحق '+a.dueDate
          + ' · متأخر '+a.monthsLate+' شهر</div></div>'
          + '<div><strong class="red">'+money(a.amount)+'</strong>'
          + (a.amount < a.total ? '<div class="sub mut" style="font-size:12px">من '+money(a.total)+'</div>' : '')+'</div>'
          + '<div><button class="btn btn-sm ok" onclick="payArrear(\''+a.id+'\',\''+a.month+'\')">سدّدها</button></div></div>';
      }).join(''));
}
/* ---------- «كم سددت؟» — المبلغ الفعلي قد يختلف عن المتوقع ---------- */
/**
 * o: { id, name, cycle, due, paid, estimated, flexible }
 * المستحق معبّأ مسبقاً: Enter واحدة للثابت، وتعديل الرقم لما اختلف.
 */
function openPay(o, preset){
  var remaining = Math.max(0, Math.round(o.due - (o.paid||0)));
  S.payCtx = Object.assign({}, o, { remaining: remaining, mode: preset || (o.estimated ? 'full' : 'partial') });
  modal(mhead('سداد «'+esc(o.name)+'»', monthName(o.cycle) + ' — المستحق '+money(o.due))
    + (o.paid > 0 ? '<div class="note n-blue">سُدِّد سابقاً '+money(o.paid)+' — الباقي '+money(remaining)+'</div>' : '')
    + fld('كم سددت الآن؟','<input id="payAmt" type="number" min="0" step="0.01" value="'+remaining+'" '
        + 'oninput="payHint()" onkeydown="if(event.key===\'Enter\')payGo()">',
        o.estimated ? 'مبلغه يتغير كل دورة — اكتب ما دفعته فعلاً.' : 'إن اختلف المبلغ الفعلي فاكتبه.')
    + '<div id="payHint"></div>'
    + macts('تسجيل السداد','payGo()'), true);
  payHint();
  setTimeout(function(){ var e = el('payAmt'); if (e){ e.focus(); e.select(); } }, 30);
}
function payHint(){
  var c = S.payCtx, box = el('payHint'); if (!c || !box) return;
  var now = +v('payAmt') || 0, total = (c.paid||0) + now, diff = Math.round(total - c.due);
  var h = '';
  if (now <= 0) {
    h = '<div class="note n-gold">اكتب المبلغ الذي دفعته.</div>';
  } else if (diff < 0) {
    h = '<div class="note n-gold">أقل من المستحق بـ '+money(-diff)+'. ما وضعه؟</div>'
      + '<label class="pchoice"><input type="radio" name="pmode" value="full" '+(c.mode==='full'?'checked':'')
      +   ' onchange="S.payCtx.mode=\'full\';payHint()"> <span><strong>هذا هو المبلغ الفعلي كاملاً</strong>'
      +   '<small>الفاتورة جاءت أقل — تُغلق هذه الدورة مسدَّدة</small></span></label>'
      + '<label class="pchoice"><input type="radio" name="pmode" value="partial" '+(c.mode==='partial'?'checked':'')
      +   ' onchange="S.payCtx.mode=\'partial\';payHint()"> <span><strong>دفعة جزئية</strong>'
      +   '<small>يبقى '+money(-diff)+' مستحقاً في هذه الدورة</small></span></label>'
      + (!c.flexible && c.mode==='partial' ? '<div class="hint orange">التزام «كامل فقط» — الجزئي مسموح لكن سيبقى الباقي متأخراً حتى تسدّده.</div>' : '');
  } else if (diff > 0) {
    h = '<div class="note n-blue">أعلى من المتوقع بـ '+money(diff)+' — يُسجَّل مستحق هذه الدورة '+money(total)+'.</div>';
  } else {
    h = '<div class="note n-green">مطابق للمستحق ✓</div>';
  }
  var canUpdate = now > 0 && diff !== 0 && !c.estimated && !(diff < 0 && c.mode === 'partial');
  if (canUpdate) h += '<label class="pchoice"><input type="checkbox" id="payUpd"> <span><strong>حدّث مبلغ الالتزام للدورات القادمة</strong>'
      + '<small>إن كان المبلغ تغيّر فعلاً (زيادة إيجار مثلاً) لا لهذه المرة فقط</small></span></label>';
  if (c.estimated && diff !== 0 && now > 0) h += '<div class="hint">الالتزام التقديري يتعلّم من سدادك تلقائياً — لا حاجة لتحديثه.</div>';
  box.innerHTML = h;
}
function payGo(){
  var c = S.payCtx; if (!c) return;
  var now = +v('payAmt') || 0;
  if (now <= 0) return toast('اكتب المبلغ','err');
  var total = Math.round(((c.paid||0) + now) * 100) / 100;
  var upd = !!(el('payUpd') && el('payUpd').checked);
  busy(true,'جاري تسجيل السداد…');
  srv(function(r){
    closeModal(); after(r); payRefresh(c.id);
  }, failBusy).recordPayment(S.token, c.id, c.cycle, total, total < c.due - 0.5 ? c.mode : 'full', upd);
}
/** بعد أي سداد: كل ما يعرض السداد يُعاد جلبه. */
function payRefresh(id){
  S.payr.data = null; S.allObs = null; S.pload = null;
  if (S.view === 'paylog') loadPayRange();
  if (S.view === 'oblig') loadAllObs();
  if (S.openOb === id){
    srv(function(t){ if (t && !t.error){ S.timeline = t; if (S.view==='oblig') render(); } }, failBusy)
      .getObligationTimeline(S.token, id, 3, 5);
  }
}
function obFlags(id){
  var o = find(S.allObs || [], id) || find(S.data.obligations, id) || {};
  return { estimated: o.amountType === 'تقديري' || !!o.isEstimated, flexible: o.type === 'مرن' || o.type === 'ترفيهي' };
}

function payArrear(id, month){
  var a = (S.data.arrears || []).filter(function(x){ return x.id === id && x.month === month; })[0];
  if (!a) return toast('لم أجد المتأخرة','err');
  var f = obFlags(id);
  openPay({ id:id, name:a.name, cycle:month, due:a.total, paid:Math.max(0, a.total - a.amount),
            estimated:f.estimated, flexible:f.flexible });
}

function kpis(items){
  return '<div class="kpis">' + items.map(function(k){
    return '<div class="kpi"><div class="lbl">'+k[0]+'</div><div class="kpi-val '+k[2]+'">'+k[1]+'</div><div class="sub">'+k[3]+'</div></div>';
  }).join('') + '</div>';
}
function panel(title, sub, body, extra){
  return '<div class="panel"><div class="phead"><div><h3>'+title+'</h3>'
       + (sub ? '<div class="sub">'+sub+'</div>' : '') + '</div>' + (extra||'') + '</div>' + body + '</div>';
}

function srcCards(bd){
  if (!bd.length) return '<div class="empty">لا توجد مصادر دخل أساسية فعّالة هذا الشهر.</div>';
  return '<div class="srcs">' + bd.map(function(b){
    var pct = Math.min(100, Math.max(0, b.usage*100));
    var cls = b.status==='عجز' ? 'r' : b.status==='على الحافة' ? '' : 'g';
    return '<div class="src">'
      + '<div class="src-top"><div><div class="src-name">'+esc(b.name)+'</div>'
      +   '<div class="src-day">ينزل يوم '+b.day+(b.isVariable?' · متغير':'')+(b.arrived?' · نزل':'')
      +     (b.estimated?' <span class="gold">· مبلغ تقديري</span>':'')+'</div></div>'
      +   '<div class="src-amt">'+money(b.amount)+'</div></div>'
      + '<div class="minis">'
      +   '<div class="mini"><small>المربوط</small><strong class="red">'+money(b.allocated)+'</strong></div>'
      +   '<div class="mini"><small>بيدك الآن</small><strong class="blue">'+money(b.available)+'</strong></div>'
      +   '<div class="mini"><small>الباقي لك</small><strong class="'+(b.free>=0?'green':'red')+'">'+money(b.free)+'</strong></div>'
      + '</div>'
      + '<div class="bar '+cls+'"><i style="width:'+pct+'%"></i></div>'
      + (b.reserveShare
          ? '<div class="src-foot"><span>مجنَّب لالتزامات قادمة</span><span class="purple">'+money(b.reserveShare)+'</span></div>'
          : '')
      + (b.savingsShare
          ? '<div class="src-foot"><span>حصته من الادخار '+money(b.savingsShare)+'</span>'
            + '<span class="'+(b.freeAfterSaving<0?'red':'green')+'">بعده '+money(b.freeAfterSaving)+'</span></div>'
          : '')
      + '<div class="src-foot"><span>'+b.obligationCount+' التزام · '+Math.round(pct)+'%</span>'
      +   '<span class="'+statusColor(b.status)+'">'+b.status+'</span></div>'
      + '</div>';
  }).join('') + '</div>';
}

function timeline(incomes){
  var list = incomes.filter(function(i){ return i.isBasic && !i.paused; }).sort(function(a,b){ return a.day - b.day; });
  if (!list.length) return '<div class="empty">أضف مصادر الدخل لتظهر الدورة.</div>';
  return '<div class="tl">' + list.map(function(i){
    return '<div class="tl-i'+(i.arrived?' done':'')+'"><div class="tl-d"></div>'
      + '<div class="tl-t">يوم '+i.day+'</div>'
      + '<div class="tl-n">'+esc(i.name)+'</div>'
      + '<div class="tl-a">'+money(i.amount)+'</div>'
      + '<div class="tl-t '+(i.arrived?'green':'')+'" style="margin-top:3px">'+(i.arrived?'نزل':'لم ينزل')+'</div></div>';
  }).join('') + '</div>';
}

function upcoming(obs){
  var list = obs.filter(function(o){ return !o.paid && (o.daysLeft <= 10 || o.overdue); }).slice(0,8);
  if (!list.length) return '<div class="empty">لا توجد استحقاقات قريبة.</div>';
  return '<div class="tw"><table><thead><tr><th class="s">الالتزام</th><th>المبلغ</th><th>الاستحقاق</th>'
    + '<th class="s hm">مصدر السداد</th><th>الحالة</th><th>سدّد</th></tr></thead><tbody>'
    + list.map(function(o){
        return '<tr><td class="s"><strong>'+esc(o.name)+'</strong>'
          + (o.isEstimated ? '<span class="sub">تقديري · '+esc(o.estimateBasis)+'</span>' : '') + '</td>'
          + '<td><strong>'+money(o.remainingAmount || o.amount)+'</strong></td>'
          + '<td>'+o.dueDate+'<span class="sub">'+dayLabel(o)+'</span></td>'
          + '<td class="s hm">'+srcLabel(o)+'</td>'
          + '<td>'+stateTag(o)+'</td>'
          + '<td><div class="acts">'
          + (o.autoDeduct ? '<span class="mut" style="font-size:12px">تلقائي</span>'
             : '<button class="btn btn-sm ok" onclick="pay(\''+o.id+'\',true)">سدّدت</button>')
          + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
}

function drawCharts(){
  if (!S.data) return;   // الرسم يُستدعى عبر requestAnimationFrame وقد تسبق البيانات
  var bd = S.data.sourceBreakdown, obs = S.data.obligations;
  var bars = el('bars');
  if (bars){
    bars.innerHTML = bd.length ? bd.map(function(b){
      var pct = Math.min(100, Math.max(0, b.usage*100));
      return '<div class="crow"><div class="cl">'+esc(b.name)+'</div>'
        + '<div class="bar'+(b.free<0?' r':'')+'"><i style="width:'+pct+'%"></i></div>'
        + '<div class="cv">'+money(b.allocated)+' / '+money(b.amount)+'</div></div>';
    }).join('') : '<div class="empty">لا توجد مصادر دخل أساسية.</div>';
  }
  var dn = el('donut');
  if (!dn) return;
  var paid = sum(obs,'paidAmount');
  var over = obs.filter(function(o){ return o.overdue; }).reduce(function(s,o){ return s + o.remainingAmount; },0);
  var total = sum(obs,'amount');
  var pend = Math.max(0, total - paid - over);
  if (!total){ dn.innerHTML = '<div class="empty">لا توجد التزامات.</div>'; return; }
  // الزوايا والنسبة محصورة — نسبة فوق 100% تعني خلل بيانات لا رسماً أوسع
  var pct = Math.min(100, Math.max(0, Math.round(paid/total*100)));
  var a = Math.min(360, Math.max(0, paid/total*360));
  var b = Math.min(360, Math.max(a, (paid+pend)/total*360));
  dn.innerHTML = '<div class="donut" style="background:conic-gradient(var(--green) 0deg '+a+'deg,var(--accent) '+a+'deg '+b+'deg,var(--red) '+b+'deg 360deg)">'
    + '<div class="ctr"><strong>'+pct+'%</strong><small>تم السداد</small></div></div>'
    + '<div class="legend">'
    +   '<div class="lg"><span><i class="dot g"></i>مدفوع</span><strong>'+money(paid)+'</strong></div>'
    +   '<div class="lg"><span><i class="dot"></i>متبقٍ</span><strong>'+money(pend)+'</strong></div>'
    +   '<div class="lg"><span><i class="dot r"></i>متأخر</span><strong>'+money(over)+'</strong></div>'
    + '</div>';
}

/* ============================================================ 2) مصادر الدخل ============================================================ */
function pIncome(){
  var list = S.data.incomes;
  if (!list.length) return '<div class="panel"><div class="empty">لم تضف أي مصدر دخل بعد. ابدأ بزر «إضافة مصدر».</div></div>';
  // لا بد أن يطابق ما يحسبه السيرفر: الأساسي غير الموقوف وداخل نافذة البداية فقط
  // المضمون فقط: أساسي، غير موقوف، داخل النافذة، وله موعد معلوم
  var total = list.filter(function(i){ return i.isGuaranteed && !i.paused && i.inWindow; })
                  .reduce(function(s,i){ return s+i.amount; },0);
  var potential = list.filter(function(i){ return !i.isGuaranteed && !i.paused && !i.arrived; });
  var outside = list.filter(function(i){ return i.isBasic && !i.paused && !i.inWindow; });

  return '<div class="note n-blue">المصدر <strong>الثابت</strong> يُحتسب نازلاً تلقائياً بمجرد مرور يوم نزوله — لا تحتاج تأكيده.<br>'
    + 'أما <strong>المتغير</strong> (مثل دخل مشروع) فتؤكّد نزوله وتكتب مبلغه الفعلي، ويُستخدم المتوقع كتقدير قبل ذلك.<br>'
    + 'والدخل <strong>الأساسي</strong> وحده يدخل الخطة والتوزيع؛ الإضافي يزيد سيولتك بعد نزوله فقط.</div>'
    + (outside.length
        ? '<div class="note n-gold">مصادر خارج نافذة البداية ولا تدخل الحسابات هذه الدورة: '
          + outside.map(function(i){ return esc(i.name)+' ('+money(i.amount)+')'; }).join('، ')
          + '. تعود تلقائياً في الدورة القادمة.</div>'
        : '')
    + transfersPanel()
    + (potential.length
        ? '<div class="note n-gold">دخل محتمل غير مضمون لا يدخل الخطة: '
          + potential.map(function(i){ return esc(i.name)+' ('+money(i.amount)
              + (i.hasSchedule?'':' — بلا موعد')+')'; }).join('، ')
          + '. يدخل سيولتك الفعلية فور تسجيل نزوله.</div>'
        : '')
    + panel('مصادر الدخل', money(total)+' إجمالي الدخل المضمون',
      '<div class="tw"><table><thead><tr><th class="s">المصدر</th><th>المبلغ</th><th>مربوط عليه</th><th>حالة الدورة</th><th>إجراء</th></tr></thead><tbody>'
      + list.map(function(i){
          return '<tr><td class="s"><strong>'+esc(i.name)+'</strong>'
            + '<span class="sub">'
            + (i.hasSchedule ? 'ينزل يوم '+i.day : '<span class="orange">موعده غير محدد</span>')
            + ' · '+(i.isBasic?'دخل أساسي':'دخل إضافي')
            + (i.isVariable?' · متغير':' · ثابت')
            + (i.isGuaranteed?'':' · <span class="orange">غير مضمون</span>')+'</span>'
            + (i.notes?'<span class="sub">'+esc(i.notes)+'</span>':'')+'</td>'
            + '<td><strong class="gold">'+money(i.amount)+'</strong>'
            +   (i.isVariable ? '<span class="sub">'+(i.arrived && i.actualAmount>0 ? 'فعلي' : 'متوقع') + (i.arrived && i.actualAmount>0 ? '' : ' '+money(i.expectedAmount))+'</span>' : '')+'</td>'
            + '<td>'+srcLoadCell(i)+'</td>'
            + '<td>'+(i.paused?tag('موقوف','red'):!i.inWindow?tag('قبل البداية','gray')
                :i.arrived?tag('نزل','green')
                :!i.hasSchedule?tag('بانتظار نزوله','gold'):tag('لم ينزل','gray'))
            +   (!i.inWindow ? '<span class="sub">دورته '+i.occurrenceDate+' تسبق بدايتك</span>'
                 : !i.hasSchedule ? '<span class="sub">لا يُحتسب حتى تؤكده</span>'
                 : !i.isVariable ? '<span class="sub">يُحتسب تلقائياً</span>'
                 : i.arrived && i.arrivalDate ? '<span class="sub">'+i.arrivalDate+'</span>' : '')+'</td>'
            + '<td><div class="acts">'
            +   ((i.isVariable || !i.hasSchedule) && !i.paused && i.inWindow
                  ? '<button class="btn btn-sm ok" onclick="arrive(\''+i.id+'\','+(!i.arrived)+',true)">'
                    +(i.arrived?'تعديل المبلغ':'سجّل نزوله')+'</button>'
                  : '')
            +   '<button class="btn btn-sm" onclick="pause(\''+i.id+'\','+(!i.paused)+')">'+(i.paused?'استئناف':'إيقاف')+'</button>'
            +   '<button class="btn btn-sm" onclick="openIncome(\''+i.id+'\')">تعديل</button>'
            +   '<button class="btn btn-sm no" onclick="delIncome(\''+i.id+'\')">حذف</button>'
            + '</div></td></tr>';
        }).join('') + '</tbody></table></div>');
}

/** ما المربوط على مصدر دخل معيّن — يُحسب من تخصيصات الالتزامات. */
function srcLoad(id){
  var out = { amount:0, count:0, list:[] };
  S.data.obligations.forEach(function(o){
    o.sources.forEach(function(s){
      if (s.sourceId !== id) return;
      out.amount += s.amount; out.count++;
      out.list.push({ ob:o, part:s.amount });
    });
  });
  out.list.sort(function(a,b){ return String(a.ob.dueDate).localeCompare(String(b.ob.dueDate)); });
  return out;
}
function srcLoadCell(i){
  if (!i.isBasic) return '<span class="mut">—</span>';
  var L = srcLoad(i.id);
  if (!L.count) return '<span class="mut">لا شيء</span>';
  var left = i.amount - L.amount;
  return '<button class="btn btn-sm" onclick="openSrcDetail(\''+i.id+'\')">'
    + money(L.amount) + ' · ' + L.count + '</button>'
    + '<span class="sub '+(left<0?'red':'green')+'">يتبقى '+money(left)+'</span>';
}
function openSrcDetail(id){
  var i = find(S.data.incomes, id), L = srcLoad(id);
  var left = i.amount - L.amount;
  modal(
    mhead('الالتزامات المربوطة على '+esc(i.name), 'دخل '+money(i.amount)+' · مربوط '+money(L.amount))
    + '<div class="stats4">'
    +   stat('الدخل', money(i.amount))
    +   stat('المربوط', money(L.amount))
    +   stat('المسدَّد منه', money(L.list.reduce(function(s,x){ return s + (x.ob.amount>0 ? x.ob.paidAmount*(x.part/x.ob.amount) : 0); },0)))
    +   stat('الباقي لك', money(left))
    + '</div>'
    + (left < 0 ? '<div class="note n-red" style="margin-top:12px">المربوط يتجاوز دخل هذا المصدر بمقدار '+money(-left)+'.</div>' : '')
    + (L.count
      ? '<div class="tw" style="margin-top:12px"><table style="min-width:520px"><thead><tr>'
        + '<th class="s">الالتزام</th><th>نصيب هذا المصدر</th><th>من أصل</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>'
        + L.list.map(function(x){
            return '<tr><td class="s"><strong>'+esc(x.ob.name)+'</strong>'
              + (x.ob.isSplit?'<span class="sub">مقسَّم على عدة مصادر</span>':'')+'</td>'
              + '<td><strong>'+money(x.part)+'</strong></td>'
              + '<td class="mut">'+money(x.ob.amount)+'</td>'
              + '<td>'+x.ob.dueDate+'<span class="sub">'+dayLabel(x.ob)+'</span></td>'
              + '<td>'+stateTag(x.ob)+'</td></tr>';
          }).join('') + '</tbody></table></div>'
      : '<div class="empty">لا توجد التزامات مربوطة على هذا المصدر.</div>')
    + '<div class="macts"><button class="btn wide" onclick="closeModal()">إغلاق</button></div>'
  );
}

function loadTransfers(){
  srv(function(r){ if (r && r.length !== undefined){ S.transfers = r; if (S.view==='income') render(); } }, failBusy)
    .getTransfers(S.token, S.month);
}
function transfersPanel(){
  var list = S.transfers;
  return panel('تحويلات بين المصادر','نقل مبلغ من مصدر لآخر داخل الدورة',
    !list ? '<div class="empty">جاري التحميل…</div>'
    : !list.length ? '<div class="empty">لا توجد تحويلات في هذه الدورة.</div>'
    : '<div class="tw"><table style="min-width:520px"><thead><tr><th>التاريخ</th><th class="s">من</th>'
      + '<th class="s">إلى</th><th>المبلغ</th><th>إجراء</th></tr></thead><tbody>'
      + list.map(function(t){
          return '<tr><td>'+t.date+'</td><td class="s">'+esc(t.fromName)+'</td>'
            + '<td class="s">'+esc(t.toName)+'</td><td><strong>'+money(t.amount)+'</strong></td>'
            + '<td><button class="btn btn-sm no" onclick="delTransfer(\''+t.id+'\')">حذف</button></td></tr>';
        }).join('') + '</tbody></table></div>',
    '<button class="btn btn-sm" onclick="openTransfer()">＋ تحويل</button>');
}
function openTransfer(){
  var basics = S.data.incomes.filter(function(i){ return i.isBasic; });
  if (basics.length < 2) return toast('تحتاج مصدرين على الأقل','err');
  var opt = function(id){ return basics.map(function(i){
    return '<option value="'+i.id+'">'+esc(i.name)+'</option>'; }).join(''); };
  modal(mhead('تحويل بين المصادر','')
    + '<div class="form-grid">'
    + fld('من مصدر','<select id="tFrom">'+opt()+'</select>')
    + fld('إلى مصدر','<select id="tTo">'+opt()+'</select>')
    + fld('المبلغ','<input id="tAmt" type="number" min="1">')
    + fld('التاريخ','<input id="tDate" type="date" value="'+TODAY_ISO+'">')
    + fldFull('ملاحظات','<input id="tNotes">')
    + '</div>' + macts('حفظ','saveTransfer()'));
}
function saveTransfer(){
  var d = { fromId:v('tFrom'), toId:v('tTo'), amount:+v('tAmt')||0,
            date:v('tDate'), notes:v('tNotes'), month:S.month };
  if (d.fromId === d.toId) return toast('اختر مصدرين مختلفين','err');
  if (d.amount <= 0) return toast('أدخل مبلغاً أكبر من صفر','err');
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); S.transfers=null; after(r); loadTransfers(); }, failBusy).addTransfer(S.token, d);
}
function delTransfer(id){
  confirm2('حذف التحويل؟','سيُحذف السجل نهائياً.', function(){
    busy(true,'جاري الحذف…');
    srv(function(r){ S.transfers=null; after(r); loadTransfers(); }, failBusy).deleteTransfer(S.token, id, S.month);
  });
}

function openIncome(id){
  var i = id ? find(S.data.incomes, id) : null;
  modal(
    mhead(i ? 'تعديل مصدر الدخل' : 'إضافة مصدر دخل','')
    + '<div class="form-grid">'
    + fld('اسم المصدر *','<input id="iName" value="'+attr(i&&i.name)+'" placeholder="الراتب، دعم حكومي، دخل نورفيل…">')
    + fld('موعد النزول', seg('iSched',[['yes','يوم محدد من الشهر'],['no','غير محدد / عند نزوله']],
          i ? (i.hasSchedule ? 'yes' : 'no') : 'yes'),
          'غير المحدد لا يدخل الخطة ولا التوقعات، ولا يُعتبر متأخراً أبداً — حتى تسجّل نزوله بنفسك.')
    + fld('اليوم من الشهر','<input id="iDay" type="number" min="1" max="31" value="'
          + (i && i.hasSchedule ? i.day : (i ? '' : 25)) + '">')
    + fld('نوع المبلغ', seg('iType',[['ثابت','ثابت'],['متغير','متغير']], i && i.isVariable ? 'متغير' : 'ثابت'),
          'المتغير: تسجّل مبلغه الفعلي كل شهر عند نزوله.')
    + fld('المبلغ الشهري *','<input id="iAmount" type="number" min="0" value="'+(i?i.expectedAmount:'')+'">',
          'للمصدر المتغير هذا هو المبلغ المتوقع.')
    + fldFull('تصنيف المصدر', seg('iBasic',[['true','دخل أساسي'],['false','دخل إضافي']], i ? String(!!i.isBasic) : 'true'),
          'الأساسي فقط يدخل في التوزيع والخطة الادخارية.')
    + fldFull('ملاحظات','<textarea id="iNotes">'+esc(i&&i.notes)+'</textarea>')
    + '</div>'
    + macts('حفظ', "saveIncome('"+(id||'')+"')")
  );
  syncSchedField();
}
function saveIncome(id){
  var scheduled = v('iSched') !== 'no';
  var d = { name:v('iName').trim(), amount:+v('iAmount')||0,
            day: scheduled ? (+v('iDay')||1) : 0,
            amountType:v('iType'), isBasic:v('iBasic')==='true', notes:v('iNotes'), month:S.month };
  if (!d.name) return toast('أدخل اسم المصدر','err');
  busy(true,'جاري الحفظ…');
  var run = srv(function(r){ closeModal(); after(r); }, failBusy);
  if (id) run.updateIncomeSource(S.token, id, d); else run.addIncomeSource(S.token, d);
}
function arrive(id, val, isVariable){
  if (val && isVariable){
    var i = find(S.data.incomes, id);
    modal(mhead('تسجيل نزول الدخل', esc(i.name)+' — المتوقع '+money(i.expectedAmount))
      + fld('المبلغ الذي نزل فعلاً','<input id="actAmt" type="number" min="0" value="'+i.expectedAmount+'">',
            'هذا الرقم هو الذي ستُبنى عليه حسابات الشهر.')
      + macts('تأكيد النزول', "confirmArrive('"+id+"')"), true);
    return;
  }
  busy(true,'جاري التحديث…');
  srv(after, failBusy).setIncomeArrived(S.token, id, val, S.month, null);
}
function confirmArrive(id){
  var amt = +v('actAmt')||0;
  if (amt <= 0) return toast('أدخل مبلغاً أكبر من صفر','err');
  busy(true,'جاري التسجيل…');
  srv(function(r){ closeModal(); after(r); }, failBusy).setIncomeArrived(S.token, id, true, S.month, amt);
}
function pause(id,val){ busy(true,'جاري التحديث…'); srv(after, failBusy).pauseIncomeSource(S.token,id,val,S.month); }
function delIncome(id){
  confirm2('حذف مصدر الدخل؟','سيُنقل إلى سلة المحذوفات، وستفقد الالتزامات ارتباطها به. يمكنك استعادته خلال 30 يوماً.', function(){
    busy(true,'جاري الحذف…'); srv(after, failBusy).deleteIncomeSource(S.token,id,S.month);
  });
}

/* ============================================================ 3) الالتزامات ============================================================ */
function loadAllObs(){
  srv(okOrFail('allObs', function(r){ S.allObs = r; if (S.view==='oblig') render(); }), loadFail('allObs'))
    .getAllObligations(S.token);
}
function pOblig(){ return obManage(); }

function obManage(){
  var f = S.f;
  // التعريفات كلها بلا فلترة دورة — الدورة تخص السداد لا التعريف
  var all = S.allObs;
  if (!all) return waitOrErr('allObs', 'جاري تحميل الالتزامات…', 'loadAllObs()');
  var list = all.filter(function(o){
    if (f.quick==='unalloc' && o.unallocatedAmount<=0) return false;
    if (f.quick==='fun' && o.type!=='ترفيهي') return false;
    if (f.quick==='once' && o.recurring) return false;
    if (f.quick==='ending' && !o.endDate) return false;
    if (f.source!=='all' && !o.sources.some(function(s){ return s.sourceId===f.source; })) return false;
    if (f.priority!=='all' && o.priority!==f.priority) return false;
    if (f.recurrence!=='all' && (o.recurrence||'شهري')!==f.recurrence) return false;
    if (f.category!=='all' && o.category!==f.category) return false;
    if (f.from && (o.nextDue || '') < f.from) return false;
    if (f.to   && (o.nextDue || '9999') > f.to) return false;
    if (f.quick==='ended' && !o.ended) return false;
    if (f.quick==='inactive' && o.active) return false;
    if (f.q){
      var hay = (o.name+' '+o.notes+' '+o.sources.map(function(s){ return s.sourceName; }).join(' ')).toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
    }
    return true;
  });
  var c = {
    all: all.length,
    unalloc: all.filter(function(o){ return o.unallocatedAmount>0; }).length,
    fun: all.filter(function(o){ return o.type==='ترفيهي'; }).length,
    once: all.filter(function(o){ return !o.recurring; }).length,
    ending: all.filter(function(o){ return !!o.endDate; }).length,
    ended: all.filter(function(o){ return o.ended; }).length,
    inactive: all.filter(function(o){ return !o.active; }).length
  };

  var fun = all.filter(function(o){ return o.type==='ترفيهي'; });
  var head = kpis([
      ['كل الالتزامات المعرَّفة', money(sum(all,'amount')), 'gold', all.length+' بند'],
      ['بلا مصدر سداد', money(all.filter(function(o){return o.unallocatedAmount>0;})
        .reduce(function(x,o){return x+o.unallocatedAmount;},0)), c.unalloc?'orange':'green', c.unalloc+' بند'],
      ['مبالغ تقديرية', money(all.filter(function(o){return o.isEstimated;})
        .reduce(function(x,o){return x+o.amount;},0)), 'blue',
        all.filter(function(o){return o.isEstimated;}).length+' بند يتغير شهرياً'],
      ['أقساط لها نهاية', money(all.filter(function(o){return o.endDate;})
        .reduce(function(x,o){return x+o.amount;},0)), 'purple', c.ending+' التزام مؤقت']
    ]);

  var allocBar = '<div class="panel"><div class="phead"><div><h3>ربط الالتزامات بمصادر الدخل</h3>'
    + '<div class="sub">'+(c.unalloc ? c.unalloc+' التزام بلا مصدر سداد كامل' : 'كل الالتزامات مربوطة')+'</div></div>'
    + '<div class="acts">'
    +   '<button class="btn-main" onclick="aiAllocOpen(\'unassigned\')">✦ وزّع بذكاء</button>'
    +   '<button class="btn" onclick="openAllocate(\'unassigned\')">اقترح للغير مربوط</button>'
    +   '<button class="btn" onclick="openAllocate(\'all\')">أعد توزيع الكل</button>'
    + '</div></div>'
    + (c.unalloc
       ? '<div class="note n-gold">«اقترح للغير مربوط» يعمل على البنود التي تنقصها مصادر فقط ولا يمس ما ربطته بنفسك. '
         + 'و«أعد توزيع الكل» يتجاهل الربط الحالي ويعيد الحساب من الصفر.</div>'
       : '<div class="note n-green">كل التزاماتك مربوطة بمصادر. استخدم «أعد توزيع الكل» فقط إذا أردت إعادة الحساب من جديد.</div>')
    + '</div>';

  var st = S.data.settings;
  var preStart = st.cycleBeforeStart
    ? '<div class="note n-gold">دورتك الحالية ('+monthName(st.todayCycle)+') تسبق تاريخ بداية تتبعك ('
      + esc(st.startDate)+') فهي فارغة تماماً. فُتح التطبيق على أول دورة فعلية: <strong>'
      + monthName(st.currentMonth)+'</strong>.</div>'
    : '';

  var headNote = preStart + '<div class="note n-blue" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<span>هنا تُعرِّف التزاماتك: المبلغ، الاستحقاق، التكرار، والمصدر الذي سيغطيها. '
    + 'أما تسجيل الدفع والتراجع عنه فمكانه صفحة سجل السداد.</span>'
    + '<button class="btn btn-sm" onclick="go(\'paylog\')">سجل السداد</button></div>';

  return headNote + head + allocBar
    + '<div class="toolbar"><div class="tb-row">'
    + '<input id="obq" value="'+attr(f.q)+'" oninput="obSearch(this.value)" placeholder="ابحث في الالتزامات…">'
    + '<select onchange="fset(\'source\',this.value)"><option value="all">كل المصادر</option>'
    +   S.data.incomes.filter(function(i){ return i.isBasic; }).map(function(i){
          return '<option value="'+i.id+'"'+(f.source===i.id?' selected':'')+'>'+esc(i.name)+'</option>'; }).join('')
    + '</select>'
    + '<select onchange="fset(\'priority\',this.value)">'+opts(['all|كل الأولويات','عالية|عالية','متوسطة|متوسطة','منخفضة|منخفضة'], f.priority)+'</select>'
    + '<select onchange="fset(\'recurrence\',this.value)">'+opts(['all|كل التكرارات','أسبوعي|أسبوعي','كل أسبوعين|كل أسبوعين','شهري|شهري','ربع سنوي|ربع سنوي','نصف سنوي|نصف سنوي','سنوي|سنوي','مرة واحدة|مرة واحدة'], f.recurrence)+'</select>'
    + '<select onchange="fset(\'category\',this.value)"><option value="all">كل التصنيفات</option>'
    +   (S.data.settings.obligationCategories||[]).map(function(c){
          return '<option value="'+attr(c)+'"'+(f.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')
    + '</select>'
    + '</div>'
    + '<div class="tb-row" style="margin-top:8px;grid-template-columns:1fr 1fr">'
    +   '<label style="display:flex;align-items:center;gap:7px;font-size:13px"><span class="mut">من</span>'
    +     '<input type="date" value="'+attr(f.from)+'" onchange="fset(\'from\',this.value)"></label>'
    +   '<label style="display:flex;align-items:center;gap:7px;font-size:13px"><span class="mut">إلى</span>'
    +     '<input type="date" value="'+attr(f.to)+'" onchange="fset(\'to\',this.value)"></label>'
    + '</div>'
    + '<div class="chips">'
    + [['all','الكل'],['unalloc','بلا مصدر'],['fun','ترفيهي'],['once','مرة واحدة'],
       ['ending','له نهاية'],['ended','منتهٍ'],['inactive','غير نشط']]
        .map(function(x){ return '<button class="chip '+(f.quick===x[0]?'on':'')+'" onclick="fset(\'quick\',\''+x[0]+'\')">'+x[1]+' <b>'+c[x[0]]+'</b></button>'; }).join('')
    + '<button class="chip" onclick="fReset()">تصفير</button>'
    + '</div></div>'
    + obDiagPanel()
    + '<div class="note n-blue">كل التزاماتك معروضة هنا بلا تقسيم دورات. '
    + '<strong>اضغط أي التزام</strong> لتفتح دوراته السابقة والقادمة وتسدّد أيها شئت من مكانه.</div>'
    + panel('كل الالتزامات', list.length+' نتيجة من '+all.length, obTable(list),
        '<div class="acts"><button class="btn btn-sm" onclick="runObDiag()">لماذا لا يظهر التزام؟</button>'
        + '<button class="btn btn-sm" onclick="exportCsv(\'obligations\')">تصدير CSV</button></div>');
}

/** يشرح لكل التزام مسجَّل سبب ظهوره أو غيابه في هذه الدورة. */
/** يفتح دورات الالتزام أسفله مباشرة — واحد فقط في كل مرة حتى لا تتكدّس الصفحة. */
/* ---------- التوزيع الذكي: كلود يقترح، والمحرك يدقّق كل سطر ---------- */
function aiAllocOpen(mode){
  busy(true, 'كلود يوزّع بناءً على مواعيد رواتبك وما بقي فيها…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذّر التوزيع','err');
    r.items.forEach(function(x){ x.sel = x.valid; });
    S.aiAlloc = r; aiAllocModal();
  }, failBusy).aiAllocate(S.token, currentCycle(), mode || 'unassigned');
}
function aiAllocModal(){
  var r = S.aiAlloc;
  if (!r.items.length){
    return modal(mhead('التوزيع الذكي','')+'<div class="note n-green">'+esc(r.summary)+'</div>'
      + '<button class="btn wide" onclick="aiAllocOpen(\'all\')">أعد توزيع الكل من جديد</button>'
      + macts('إغلاق','closeModal()'));
  }
  var valid = r.items.filter(function(x){ return x.valid; });
  modal(mhead('التوزيع الذكي', r.mode==='all' ? 'إعادة توزيع كل الالتزامات' : 'الالتزامات التي تنقصها مصادر')
    + (r.diagnosis
        ? '<div class="note '+(r.diagnosis.kind==='deficit'?'n-red':'n-gold')+'"><strong>'
          + (r.diagnosis.kind==='rebalance' ? 'الحل: إعادة ترتيب' : r.diagnosis.kind==='deficit' ? 'عجز — والتوزيع مستمر' : 'عجز توقيت — الدخل يكفي')
          + '</strong><div style="margin-top:5px">'+esc(r.diagnosis.message)+'</div>'
          + (r.diagnosis.kind==='rebalance' && r.mode!=='all'
             ? '<button class="btn-main" style="margin-top:10px" onclick="aiAllocOpen(\'all\')">أعد التوزيع لتتسع</button>' : '')
          + '</div>'
        : '')
    + (r.summary ? '<div class="note n-blue">'+esc(r.summary)+'</div>' : '')
    + (r.warnings.length ? '<div class="note n-gold">'+r.warnings.map(esc).join('<br>')+'</div>' : '')
    + '<div class="note '+(valid.length===r.items.length?'n-green':'n-gold')+'">دقّق المحرك كل سطر: '
    +   '<strong>'+valid.length+' من '+r.items.length+'</strong> صالح للاعتماد. '
    +   'الأهم أولاً، والعجز على آخر البنود أهمية. اختر ما تعتمده، أو اطلب «اقتراح آخر» لأي بند.</div>'
    + '<div class="alloc-list">'
    + r.items.map(function(x, i){
        var busyRow = x.loading;
        return '<div class="arow '+(x.valid?'':'bad')+(x.sel?' on':'')+'">'
          + '<label class="acheck"><input type="checkbox" '+(x.sel?'checked':'')+(x.valid?'':' disabled')
          +   ' onchange="S.aiAlloc.items['+i+'].sel=this.checked;aiAllocModal()"></label>'
          + '<div class="abody">'
          +   '<div class="atop"><strong>'+esc(x.name)+'</strong> <span class="mut">'+money(x.amount)+' · '+arDate(x.dueDate)+'</span> '
          +     (!x.valid ? tag('عجز كامل','red')
                 : x.shortfall > 1 ? tag('جزئي · عجز '+money(x.shortfall),'orange')
                 : tag('مغطّى','green'))+'</div>'
          +   '<div class="asplit">'+(busyRow ? '<span class="mut">جاري اقتراح بديل…</span>'
                : x.splits.length ? x.splits.map(function(s){
                    return '<span class="spl">'+esc(s.sourceName)+' <b>'+money(s.amount)+'</b> <small>'+arDate(s.paycheckDate)+'</small></span>'; }).join(' + ')
                : '<span class="mut">بلا مصدر</span>')+'</div>'
          +   (x.completeBy ? '<div class="acomplete">✔ يُجمَّع من '+x.splits.length+' مصادر ويكتمل '+arDate(x.completeBy)
                  +' — قبل موعده '+arDate(x.dueDate)+'، فيُدفع كاملاً</div>' : '')
          +   (x.reason ? '<div class="areason">'+esc(x.reason)+'</div>' : '')
          +   (x.problems.length ? '<div class="aerr">✕ '+x.problems.map(esc).join(' · ')+'</div>' : '')
          +   (x.warnings && x.warnings.length ? '<div class="awarn">⚠ '+x.warnings.map(esc).join(' · ')+'</div>' : '')
          +   (x.daySuggestion
                ? '<div class="aday">📅 يقترح نقل موعده من يوم '+Number(String(x.dueDate).slice(8))+' إلى يوم <b>'+x.daySuggestion.day+'</b>'
                  + (x.daySuggestion.reason ? ' — '+esc(x.daySuggestion.reason) : '')
                  + ' <button class="btn btn-sm" onclick="aiAllocDay('+i+')">اعتمد الموعد</button></div>' : '')
          +   '<div class="acts" style="margin-top:6px"><button class="btn btn-sm" '+(busyRow?'disabled':'')
          +     ' onclick="aiAllocAnother('+i+')">↻ اقتراح آخر</button>'
          +     (x.valid && x.spread && x.splits.length > 1
                 ? '<button class="btn btn-sm" onclick="aiAllocSplit('+i+')">✂ قسّمه لفترات</button>' : '')
          +   '</div>'
          + '</div></div>';
      }).join('') + '</div>'
    + (r.paychecks && r.paychecks.length
      ? '<details class="adv"><summary>الرواتب وما بقي فيها قبل هذا التوزيع</summary>'
        + '<div class="rows" style="margin-top:10px">' + r.paychecks.map(function(p){
            var pct = p.amount ? Math.max(0, Math.min(100, p.free/p.amount*100)) : 0;
            return '<div class="crow"><div class="cl">'+esc(p.source)+' <span class="mut">'+p.date+'</span></div>'
              + '<div class="bar g"><i style="width:'+pct+'%"></i></div><div class="cv">'+money(p.free)+' من '+money(p.amount)+'</div></div>';
          }).join('') + '</div></details>'
      : '')
    + '<div class="macts">'
    +   (function(){ var n = r.items.filter(function(x){ return x.valid && x.sel; }).length;
          return '<button class="btn-main" '+(n?'':'disabled')+' onclick="aiAllocApply()">اعتمد المحدد ('+n+')</button>'; })()
    +   (r.mode!=='all' ? '<button class="btn" onclick="aiAllocOpen(\'all\')">أعد توزيع الكل</button>' : '')
    +   '<button class="btn" onclick="closeModal()">إلغاء</button></div>');
}
/** بديل لبند واحد — مع خصم ما حجزته بقية البنود المحددة حتى لا يُحجز الراتب مرتين. */
function aiAllocAnother(i){
  var r = S.aiAlloc, x = r.items[i];
  var others = [];
  r.items.forEach(function(y, j){ if (j !== i && y.valid && y.sel) y.splits.forEach(function(s){ others.push(s); }); });
  x.loading = true; aiAllocModal();
  srv(function(nx){
    x.loading = false;
    if (!nx || nx.error){ aiAllocModal(); return toast((nx&&nx.error)||'تعذّر الاقتراح','err'); }
    nx.sel = nx.valid; r.items[i] = nx; aiAllocModal();
    toast(nx.valid ? 'اقتراح جديد لـ«'+nx.name+'»' : 'الاقتراح الجديد لم يجتز التدقيق — جرّب مرة أخرى أو اعتمد موعداً', nx.valid?'ok':'err');
  }, function(e){ x.loading = false; aiAllocModal(); failBusy(e); })
    .aiAllocateOne(S.token, r.month, x.obligationId, others, x.splits);
}
/**
 * يحوّل توزيع البند المرن إلى فترات فعلية: كل جزء التزام مستقل بموعد نزول مصدره.
 * «مقاضي 800 = 500 راتب + 300 مواطن» ← «مقاضي — من الراتب» يوم 28 + «مقاضي — من المواطن» يوم 10.
 */
function aiAllocSplit(i){
  var r = S.aiAlloc, x = r.items[i];
  var dueDay = Number(String(x.dueDate).slice(8));
  var parts = x.splits.map(function(sp){
    var payDay = Number(String(sp.paycheckDate).slice(8));
    return { label:'من '+sp.sourceName, amount:sp.amount, sourceId:sp.sourceId,
             day: sp.paycheckDate > x.dueDate ? payDay : dueDay };
  });
  confirm2('تقسيم «'+x.name+'» إلى فترات؟',
    parts.map(function(p){ return '• '+x.name+' — '+p.label+': '+p.amount+' يوم '+p.day; }).join('\n')
    + '\n\nيصير كل جزء التزاماً مستقلاً بموعده ومصدره وسداده وتذكيره. ويمكن التراجع بحذف الفترة الجديدة وإعادة المبلغ.',
    function(){
      busy(true,'جاري التقسيم…');
      srv(function(res){ after(res); S.allObs = null; S.pload = null; aiAllocOpen(r.mode); }, failBusy)
        .splitObligation(S.token, r.month, x.obligationId, parts);
    });
}

/** اعتماد الموعد المقترح يغيّر مصادر البند المتاحة، فيُعاد التوزيع كله بعده. */
function aiAllocDay(i){
  var r = S.aiAlloc, x = r.items[i];
  busy(true,'جاري تغيير الموعد…');
  srv(function(res){
    after(res); S.allObs = null; S.pload = null;
    aiAllocOpen(r.mode);
  }, failBusy).setObligationDay(S.token, x.obligationId, x.daySuggestion.day, r.month);
}
function arDate(v){
  var M = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var p = String(v||'').split('-');
  return p.length === 3 ? (+p[2]) + ' ' + M[(+p[1])-1] : esc(v);
}

function aiAllocApply(){
  var items = S.aiAlloc.items.filter(function(x){ return x.valid && x.sel; }).map(function(x){
    return { obligationId:x.obligationId, splits:x.splits.map(function(s){ return { sourceId:s.sourceId, amount:s.amount }; }) };
  });
  busy(true,'جاري اعتماد التوزيع…');
  srv(function(r){ closeModal(); S.allObs=null; S.pload=null; after(r); loadAllObs(); }, failBusy)
    .applyAllocation(S.token, S.aiAlloc.month, items);
}

function toggleOb(id, ev){
  if (ev && ev.target && ev.target.closest('button')) return;   // زر داخل الصف
  if (S.openOb === id){ S.openOb = null; S.timeline = null; render(); return; }
  S.openOb = id; S.timeline = null; render();
  delete S.errs.timeline;
  srv(okOrFail('timeline', function(r){ S.timeline = r; if (S.view==='oblig') render(); }), loadFail('timeline'))
    .getObligationTimeline(S.token, id, 3, 5);
}
function timelineBlock(){
  var t = S.timeline;
  if (!t) {
    if (S.errs.timeline) return '<div class="tl-wrap"><div class="note n-red">تعذّر جلب الدورات: '+esc(S.errs.timeline)
      + '</div><button class="btn btn-sm" onclick="var i=S.openOb;S.openOb=null;toggleOb(i)">إعادة المحاولة</button></div>';
    return '<div class="tl-wrap"><div class="empty" style="padding:18px">جاري جلب الدورات…</div></div>';
  }
  var pct = t.totalDue ? Math.round(t.totalPaid / t.totalDue * 100) : 0;
  return '<div class="tl-wrap">'
    + '<div class="tl-head"><div><strong>دورات '+esc(t.name)+'</strong>'
    +   '<div class="sub mut" style="font-size:12px">'+esc(t.recurrence)+' · ثلاث دورات سابقة وخمس قادمة</div></div>'
    +   '<div class="tl-sum"><span>المستحق '+money(t.totalDue)+'</span>'
    +   '<span class="green">المسدَّد '+money(t.totalPaid)+'</span>'
    +   (t.unpaidCycles?'<span class="red">'+t.unpaidCycles+' دورة لم تُسدَّد</span>':'<span class="green">الكل مسدَّد</span>')
    +   '</div></div>'
    + '<div class="bar '+(pct>=100?'g':'')+'" style="margin-bottom:12px"><i style="width:'+Math.min(100,pct)+'%"></i></div>'
    + (t.rows.length
      ? t.rows.map(function(x){
          var cls = x.remaining<=0 ? 'done' : (x.overdue ? 'late' : '');
          return '<div class="tl-row '+(x.isCurrent?'cur ':'')+cls+'">'
            + '<div class="cy">'+monthName(x.cycle)
            +   '<small>'+x.dueDate+(x.occurrences>1?' · '+x.occurrences+' مرات':'')
            +   (x.isCurrent?' · الدورة الحالية':'')+'</small></div>'
            + '<div class="num2"><strong>'+money(x.amount)+'</strong></div>'
            + '<div class="num2 hidesm '+(x.paidAmount?'green':'mut')+'">'+money(x.paidAmount)+'</div>'
            + '<div class="num2 '+(x.remaining?'red':'green')+'">'+money(x.remaining)+'</div>'
            + '<div>'+cycleTag(x)+'</div>'
            + '<div class="acts">'+cycleActions(t,x)+'</div>'
            + '</div>';
        }).join('')
      : '<div class="empty">لا توجد دورات ضمن المدى المعروض.</div>')
    + '</div>';
}
function cycleTag(x){
  var m = { 'مدفوع':'green','خُصم تلقائياً':'blue','خصم جارٍ':'blue','جزئي':'blue',
            'متأخر':'red','حان موعده':'orange','اليوم':'orange','قادم':'gray' };
  return tag(x.status, m[x.status] || 'gray');
}
function cycleActions(t, x){
  if (t.autoDeduct) return '<span class="mut" style="font-size:12px">تلقائي</span>';
  if (x.remaining <= 0)
    return '<button class="btn btn-sm no" onclick="cyclePay(\''+t.id+'\',\''+x.cycle+'\',0)">تراجع</button>';
  return '<button class="btn btn-sm ok" onclick="cyclePay(\''+t.id+'\',\''+x.cycle+'\','+x.amount+')">سدّدت</button>'
    + (t.flexible
       ? '<button class="btn btn-sm" onclick="cyclePartial(\''+t.id+'\',\''+x.cycle+'\','+x.amount+','+x.paidAmount+')">جزئي</button>'
       : '');
}
function cyclePay(id, cycle, amount){
  if (amount > 0 && S.timeline){
    var x = S.timeline.rows.filter(function(r){ return r.cycle === cycle; })[0];
    if (x){
      var f = obFlags(id);
      return openPay({ id:id, name:S.timeline.name, cycle:cycle, due:x.amount, paid:x.paidAmount,
                       estimated:f.estimated, flexible:f.flexible || S.timeline.flexible });
    }
  }
  busy(true, amount>0 ? 'جاري تسجيل السداد…' : 'جاري التراجع…');
  srv(function(r){
    after(r); S.allObs=null; loadAllObs();
    srv(function(t){ if (t && !t.error){ S.timeline=t; if (S.view==='oblig') render(); } }, failBusy)
      .getObligationTimeline(S.token, id, 3, 5);
  }, failBusy).setPayment(S.token, id, cycle, amount);
}
function cyclePartial(id, cycle, amount, already){
  var f = obFlags(id), nm = (find(S.allObs||[], id) || find(S.data.obligations, id) || {}).name || '';
  return openPay({ id:id, name:nm, cycle:cycle, due:amount, paid:already, estimated:f.estimated, flexible:true }, 'partial');
}

function obDiagPanel(){
  var d = S.obDiag;
  if (!d) return '';
  var hidden = d.rows.filter(function(r){ return !r.visible; });
  return panel('تشخيص ظهور الالتزامات',
    d.label + ' · ' + d.range.start + ' → ' + d.range.end,
    '<div class="note n-'+(hidden.length?'gold':'green')+'">'+esc(d.summary)+'</div>'
    + (d.cycleBeforeStart
       ? '<div class="note n-blue">ملاحظة: دورة اليوم الفعلية ('+esc(d.todayCycle)+') تسبق تاريخ بدايتك ('
         + esc(d.trackingStart)+')، فالتطبيق يفتح على أول دورة فعلية.</div>' : '')
    + '<div class="tw"><table style="min-width:620px"><thead><tr><th></th><th class="s">الالتزام</th>'
    + '<th class="hm">اليوم</th><th class="hm">التكرار</th><th class="s">السبب</th></tr></thead><tbody>'
    + d.rows.map(function(r){
        return '<tr'+(r.visible?'':' style="background:color-mix(in srgb,var(--red) 6%,transparent)"')+'>'
          + '<td>'+(r.visible?tag('يظهر','green'):tag('مخفي','red'))+'</td>'
          + '<td class="s"><strong>'+esc(r.name)+'</strong><span class="sub">'+money(r.amount)+'</span></td>'
          + '<td class="hm">'+r.day+'</td>'
          + '<td class="hm">'+esc(r.recurrence)+'</td>'
          + '<td class="s'+(r.visible?' mut':' red')+'">'+esc(r.reason)+'</td></tr>';
      }).join('') + '</tbody></table></div>',
    '<button class="btn btn-sm" onclick="S.obDiag=null;render()">إخفاء</button>');
}
function runObDiag(){
  busy(true,'جاري الفحص…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر الفحص','err');
    S.obDiag = r; render();
    toast(r.summary, r.rows.some(function(x){return !x.visible;}) ? 'err' : 'ok');
  }, failBusy).diagnoseObligations(S.token, S.month);
}

function obTable(list){
  if (!list.length) return '<div class="empty">لا توجد نتائج بهذه الفلترة.</div>';
  return '<div class="tw"><table><thead><tr>'
    + '<th class="s">الالتزام</th><th>المبلغ</th><th>الموعد القادم</th><th class="s">مصدر السداد</th>'
    + '<th class="hm">آخر سداد</th><th class="hm">التكرار</th><th class="hm">الأولوية</th><th>إجراء</th></tr></thead><tbody>'
    + list.map(function(o){
        // «open» كان غير معرّف هنا، فأخذ window.open (دالة = صحيح) وفُتحت كتلة الدورات تحت كل صف
        var isOpen = S.openOb === o.id;
        return '<tr class="oprow'+(isOpen?' open':'')+'" onclick="toggleOb(\''+o.id+'\',event)">'
          + '<td class="s"><span class="chev">›</span><strong>'+esc(o.name)+'</strong>'
          + '<span class="sub">'+esc(o.category||'أخرى')+' · يوم '+o.day+' · '+esc(o.type)
          + (o.autoDeduct?' · خصم تلقائي':'')+(o.isExpected?' · <span class="orange">متوقع</span>':'')
          + (o.isShared?' · <span class="blue">حصتك '+o.sharePercent+'%</span>':'')
          + (!o.active?' · <span class="red">غير نشط</span>':'')
          + (o.ended?' · <span class="mut">منتهٍ</span>':'')+'</span>'
          + (o.notes ? '<span class="sub">'+esc(o.notes)+'</span>' : '') + '</td>'
          + '<td><strong class="gold">'+money(o.amount)+'</strong>'
          + (o.occurrences > 1 ? '<span class="sub blue">'+money(o.unitAmount)+' × '+o.occurrences+' مرات</span>' : '')
          + (o.isEstimated ? '<span class="sub gold">تقديري</span>' : '') + '</td>'
          + '<td>'+(o.nextDue
              ? '<strong>'+o.nextDue.slice(5)+'</strong><span class="sub">'+monthName(o.nextCycle)+'</span>'
              : '<span class="mut">—</span><span class="sub">'+esc(o.status)+'</span>')+'</td>'
          + '<td class="s">'+srcLabel(o)+'</td>'
          + '<td class="hm mut" style="font-size:12px">'+(o.lastPaidMonth
              ? monthName(o.lastPaidMonth)+'<span class="sub">'+money(o.lastPaidAmount)+'</span>'
              : 'لم يُسدَّد بعد')+'</td>'
          + '<td class="hm">'+tag(esc(o.recurrence||'شهري'), o.recurrence==='شهري'?'gray':o.recurrence==='مرة واحدة'?'purple':'blue')+'</td>'
          + '<td class="hm">'+tag(o.priority, o.priority==='عالية'?'red':o.priority==='متوسطة'?'gold':'blue')+'</td>'
          + '<td><div class="acts">'
          +   (o.isEstimated ? '<button class="btn btn-sm" onclick="aiPredict(\''+o.id+'\',\''+attrJs(o.name)+'\')">توقّع المبلغ</button>' : '')
          +   '<button class="btn btn-sm" onclick="openOblig(\''+o.id+'\')">تعديل</button>'
          +   '<button class="btn btn-sm no" onclick="delOblig(\''+o.id+'\')">حذف</button>'
          + '</div></td></tr>'
          + (isOpen ? '<tr><td colspan="8" style="padding:0">'+timelineBlock()+'</td></tr>' : '');
      }).join('') + '</tbody></table></div>';
}

/* ---------- سجل السداد بمدى تاريخ: الدورة تُعالَج داخلياً ---------- */
function payDefaults(){
  var r = S.data.settings.cycleRange || {};
  if (!S.payr.from) S.payr.from = r.start || '';
  if (!S.payr.to)   S.payr.to   = r.end || '';
}
function loadPayRange(){
  payDefaults();
  srv(okOrFail('payr', function(r){ S.payr.data = r; if (S.view==='paylog') render(); }), loadFail('payr'))
    .getPaymentsRange(S.token, S.payr.from, S.payr.to);
}
function payRange(f, t){ S.payr.from = f; S.payr.to = t; S.payr.data = null; render(); loadPayRange(); }
function payPreset(k){
  var r = S.data.settings.cycleRange, d = function(x){ return x.toLocaleDateString('en-CA'); };
  var st = new Date(r.start+'T00:00:00'), en = new Date(r.end+'T00:00:00');
  var addM = function(dt, n){ var x = new Date(dt); x.setMonth(x.getMonth()+n); return x; };
  if (k==='cur')  return payRange(r.start, r.end);
  if (k==='next') return payRange(d(addM(st,1)), d(addM(en,1)));
  if (k==='prev3')return payRange(d(addM(st,-2)), r.end);
  if (k==='next3')return payRange(r.start, d(addM(en,2)));
  if (k==='year') return payRange(new Date().getFullYear()+'-01-01', new Date().getFullYear()+'-12-31');
}
function obPayments(){
  payDefaults();
  var arr = S.data.arrears || [], sm = S.data.summary, p = S.payr;
  var bar = '<div class="toolbar"><div class="tb-row two">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +   '<label style="display:flex;align-items:center;gap:6px;font-size:13px"><span class="mut">من</span>'
    +     '<input type="date" value="'+attr(p.from)+'" onchange="payRange(this.value,S.payr.to)"></label>'
    +   '<label style="display:flex;align-items:center;gap:6px;font-size:13px"><span class="mut">إلى</span>'
    +     '<input type="date" value="'+attr(p.to)+'" onchange="payRange(S.payr.from,this.value)"></label>'
    + '</div>'
    + '<input id="payq" value="'+attr(p.q)+'" oninput="paySearch(this.value)" placeholder="ابحث في الالتزامات…"></div>'
    + '<div class="chips">'
    +   [['cur','دورتي الحالية'],['next','الدورة القادمة'],['prev3','آخر 3 دورات'],['next3','القادمة 3 دورات'],['year','هذه السنة']]
          .map(function(x){ return '<button class="chip" onclick="payPreset(\''+x[0]+'\')">'+x[1]+'</button>'; }).join('')
    + '</div></div>';

  var arrPanel = arr.length
    ? panel('متأخرات من دورات سابقة', money(sm.arrearsTotal)+' · تُخصم من متبقيك الآمن',
        '<div class="tw"><table style="min-width:520px"><thead><tr><th class="s">الالتزام</th><th>المتبقي</th>'
        + '<th>استحق</th><th class="hm">تأخر</th><th>إجراء</th></tr></thead><tbody>'
        + arr.map(function(a){
            return '<tr><td class="s"><strong>'+esc(a.name)+'</strong><span class="sub">'+esc(a.category||'أخرى')+'</span></td>'
              + '<td><strong class="red">'+money(a.amount)+'</strong></td><td>'+a.dueDate+'</td>'
              + '<td class="hm">'+a.monthsLate+' دورة</td>'
              + '<td><button class="btn btn-sm ok" onclick="payArrear(\''+a.id+'\',\''+a.month+'\')">سدّدها</button></td></tr>';
          }).join('') + '</tbody></table></div>')
    : '';

  if (!p.data) return bar + arrPanel + waitOrErr('payr', 'جاري جلب ما استحق في الفترة…', 'loadPayRange()');

  var d = p.data, t = d.totals;
  var list = d.rows.filter(function(o){
    var st = o.autoPaid ? 'paid' : o.paid ? 'paid' : o.paidAmount > 0 ? 'partial' : o.overdue ? 'overdue' : 'due';
    if (p.status === 'unpaid' && o.paid) return false;
    if (p.status !== 'all' && p.status !== 'unpaid' && p.status !== st) return false;
    if (p.q && (o.name+' '+(o.category||'')).toLowerCase().indexOf(p.q.toLowerCase()) < 0) return false;
    return true;
  });
  var rank = function(o){ return o.paid ? 3 : o.overdue ? 0 : o.paidAmount > 0 ? 1 : 2; };
  list.sort(function(a,b){ return rank(a)-rank(b) || String(a.dueDate).localeCompare(String(b.dueDate)); });
  var cnt = function(f){ return d.rows.filter(f).length; };
  var pct = t.due ? Math.round(t.paid / t.due * 100) : 0;

  return kpis([
      ['المستحق في الفترة', money(t.due), 'gold', t.count+' استحقاق'],
      ['سدَّدت', money(t.paid), 'green', t.paidCount+' مكتمل'],
      ['بقي عليك', money(t.remaining), t.remaining>0?'red':'green', ''],
      ['متأخر', money(t.overdue), t.overdueCount?'red':'green', t.overdueCount+' استحقاق']
    ])
    + bar
    + '<div class="panel"><div class="phead"><div><h3>'+d.from+' ← '+d.to+'</h3>'
    +   '<div class="sub">يشمل كل الدورات الواقعة في الفترة، وكل سداد يُسجَّل في دورته تلقائياً</div></div>'
    +   '<strong class="'+(pct>=100?'green':'')+'">'+pct+'%</strong></div>'
    + '<div class="bar '+(pct>=100?'g':'')+'"><i style="width:'+Math.min(100,pct)+'%"></i></div>'
    + '<div class="chips" style="margin-top:12px">'
    +   [['all','الكل',d.rows.length],['unpaid','الباقي',cnt(function(o){return !o.paid;})],
         ['overdue','متأخر',cnt(function(o){return o.overdue;})],
         ['partial','جزئي',cnt(function(o){return o.paidAmount>0&&!o.paid;})],
         ['paid','مسدَّد',cnt(function(o){return o.paid;})]]
        .map(function(x){ return '<button class="chip '+(p.status===x[0]?'on':'')+'" onclick="S.payr.status=\''+x[0]+'\';render()">'
          + x[1]+' <b>'+x[2]+'</b></button>'; }).join('')
    + '</div></div>'
    + arrPanel
    + panel('الاستحقاقات', list.length+' من '+d.rows.length+' · المسدَّد في الأسفل',
        list.length ? rangeRows(list) : '<div class="empty">لا شيء في هذه الفترة بهذه الفلترة.</div>',
        '<button class="btn btn-sm" onclick="exportCsv(\'payments\')">تصدير CSV</button>');
}
function rangeRows(list){
  return '<div class="tw"><table><thead><tr><th class="s">الالتزام</th><th>المستحق</th><th>متبقٍ</th>'
    + '<th>الاستحقاق</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>'
    + list.map(function(o){
        return '<tr'+(o.paid?' style="opacity:.66"':'')+'><td class="s"><strong>'+esc(o.name)+'</strong>'
          + '<span class="sub">'+esc(o.category||'أخرى')+' · '+monthName(o.cycle)+'</span></td>'
          + '<td>'+money(o.amount)+'</td>'
          + '<td><strong class="'+(o.remainingAmount>0?'red':'green')+'">'+money(o.remainingAmount)+'</strong></td>'
          + '<td>'+o.dueDate+'<span class="sub">'+dayLabel(o)+'</span></td>'
          + '<td>'+stateTag(o)+'</td>'
          + '<td><div class="acts">'
          + (o.autoDeduct ? '<span class="mut" style="font-size:12px">تلقائي</span>'
            : o.paidAmount > 0
              ? (!o.paid ? '<button class="btn btn-sm ok" onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\','+o.amount+')">أكمل</button>' : '')
                + '<button class="btn btn-sm no" onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\',0)">تراجع</button>'
              : '<button class="btn btn-sm ok" onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\','+o.amount+')">سدّدت</button>'
                + ((o.type==='ترفيهي'||o.type==='مرن') ? '<button class="btn btn-sm" onclick="cyclePartial(\''+o.id+'\',\''+o.cycle+'\','+o.amount+','+o.paidAmount+')">جزئي</button>' : ''))
          + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
}
/** السداد يُسجَّل في دورة الاستحقاق نفسها، مهما كانت الفترة المعروضة. */
function rangePay(id, cycle, amount){
  if (amount > 0 && S.payr.data){
    var o = S.payr.data.rows.filter(function(r){ return r.id === id && r.cycle === cycle; })[0];
    if (o) return openPay({ id:id, name:o.name, cycle:cycle, due:o.amount, paid:o.paidAmount,
                            estimated:!!o.isEstimated, flexible:o.type==='مرن'||o.type==='ترفيهي' });
  }
  busy(true, amount>0 ? 'جاري تسجيل السداد…' : 'جاري التراجع…');
  srv(function(r){
    after(r);
    S.payr.data = null; S.allObs = null; loadPayRange();
  }, failBusy).setPayment(S.token, id, cycle, amount);
}
var payTimer=null;
function paySearch(val){
  S.payr.q = val;
  clearTimeout(payTimer);
  payTimer = setTimeout(function(){
    render();
    var e = el('payq'); if (e){ e.focus(); e.setSelectionRange(e.value.length, e.value.length); }
  }, 220);
}

/** صف السداد: أرقام التنفيذ — المستحق، المدفوع، المتبقي — وزر واحد واضح. */
function payRows(list){
  return '<div class="tw"><table><thead><tr><th class="s">الالتزام</th><th>المستحق</th><th>سُدِّد</th><th>متبقٍ</th>'
    + '<th>الحالة</th><th class="hm">الاستحقاق</th><th class="hm s">يُخصم من</th><th>إجراء</th></tr></thead><tbody>'
    + list.map(function(o){
        return '<tr'+(o.paid?' style="opacity:.72"':'')+'><td class="s"><strong>'+esc(o.name)+'</strong>'
          + '<span class="sub">'+esc(o.category||'أخرى')+' · '+dayLabel(o)+'</span></td>'
          + '<td>'+money(o.amount)+'</td>'
          + '<td class="'+(o.paidAmount>0?'green':'mut')+'">'+money(o.paidAmount)
          + (o.overpaid ? '<span class="sub red">مسجَّل '+money(o.recordedPaid)+'</span>' : '')+'</td>'
          + '<td><strong class="'+(o.remainingAmount>0?'red':'green')+'">'+money(o.remainingAmount)+'</strong></td>'
          + '<td>'+stateTag(o)+'</td>'
          + '<td class="hm">'+o.dueDate+'</td>'
          + '<td class="hm s">'+srcLabel(o)+'</td>'
          + '<td><div class="acts">'
          + (o.autoDeduct
              ? '<span class="tag t-blue">'+(o.autoPaid?'خصم تلقائي':'خصم جارٍ')+'</span>'
            : o.paidAmount > 0
              ? (!o.paid ? '<button class="btn btn-sm ok" onclick="pay(\''+o.id+'\',true)">أكمل المتبقي</button>' : '')
                + '<button class="btn btn-sm no" onclick="undoPay(\''+o.id+'\',\''+attrJs(o.name)+'\')">تراجع</button>'
              : '<button class="btn btn-sm ok" onclick="pay(\''+o.id+'\',true)">سدّدت كامل</button>'
                + ((o.type==='ترفيهي'||o.type==='مرن') ? '<button class="btn btn-sm" onclick="openPartial(\''+o.id+'\')">مبلغ جزئي</button>' : ''))
          + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
}

function undoPay(id, name){
  confirm2('التراجع عن السداد؟','سيُحذف تسجيل سداد «'+name+'» لهذا الشهر ويعود غير مسدَّد. يمكنك تسجيله من جديد متى شئت.', function(){
    busy(true,'جاري التراجع…');
    srv(after, failBusy).markPaid(S.token, id, S.month, false);
  });
}

function fset(k,val){ S.f[k]=val; render(); }
function fReset(){ S.f={q:'',quick:'all',source:'all',priority:'all',recurrence:'all',category:'all',from:'',to:''}; render(); }
var obTimer = null;
function obSearch(val){
  S.f.q = val;
  clearTimeout(obTimer);
  // debounce: بدونه كانت كل ضغطة حرف تعيد رسم الصفحة كاملة وتقفز بالمؤشر
  obTimer = setTimeout(function(){
    render();
    var e = el('obq'); if (e){ e.focus(); e.setSelectionRange(e.value.length, e.value.length); }
  }, 220);
}

/* ---------- نافذة الالتزام مع تعدد المصادر ---------- */
function openOblig(id, asExpected){
  // نبحث في كل التعريفات أولاً: البند الذي لا يستحق هذه الدورة كان يُفتح كـ«جديد» فيتكرر عند الحفظ
  var o = id ? (find(S.allObs || [], id) || find(S.data.obligations, id)) : null;
  var st = S.data.settings;
  // بداية الدورة لا أول الشهر: في دورة 27 يقع استحقاق اليوم 27 في الشهر السابق
  var cycleStart = (st.cycleRange && st.cycleRange.start) || (S.month + '-01');
  S.alloc = (o && o.sources && o.sources.length)
    ? o.sources.map(function(s){ return { sourceId:s.sourceId, amount:s.amount }; })
    : [];

  // الخيارات المتقدمة تُفتح تلقائياً إن كان في البند قيمة غير افتراضية فيها
  // التاريخ لا يهم الشهري؛ أما «مرة واحدة» والسنوي وغيرهما فتاريخ البداية هو موعدها نفسه
  var dateMatters = !!(o && o.recurrence && o.recurrence !== 'شهري');
  var adv = !!(o && (o.amountType==='تقديري' || o.type!=='صارم' || +o.maxDelay>0 || o.priority!=='متوسطة'
        || o.endDate || +o.sharePercent<100 || +o.interestRate>0 || o.isExpected || o.notes || dateMatters))
        || !!asExpected;

  modal(
    mhead(o ? 'تعديل الالتزام' : (asExpected ? 'إضافة التزام متوقع' : 'إضافة التزام'), '')
    + '<div class="form-grid">'
    + fldFull('اسم الالتزام *','<input id="oName" value="'+attr(o&&o.name)+'" placeholder="إيجار، قسط، فاتورة…">')
    + fld('المبلغ *','<input id="oAmount" type="number" min="0" value="'+(o?o.baseAmount:'')+'" oninput="allocSum()">')
    + fld('يوم الاستحقاق *','<input id="oDay" type="number" min="1" max="31" value="'+(o?o.day:1)+'">',
          +st.cycleStartDay>1 ? 'اليوم '+st.cycleStartDay+' فأكثر يقع في بداية دورتك.' : '')
    + fld('التكرار','<select id="oRec" onchange="recChanged(this.value)">'
        + ['شهري','مرة واحدة','سنوي','نصف سنوي','ربع سنوي','كل أسبوعين','أسبوعي'].map(function(x){
            var cur = o ? (o.recurrence||'شهري') : 'شهري';
            return '<option value="'+attr(x)+'"'+(cur===x?' selected':'')+'>'+x+'</option>'; }).join('')
        + '</select>')
    + fld('التصنيف','<select id="oCat">'+(st.obligationCategories||[]).map(function(c){
          return '<option value="'+attr(c)+'"'+(o&&o.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select>')
    + fldFull('طريقة السداد', seg('oAuto',[['false','أسدّده بنفسي'],['true','يخصمه البنك تلقائياً']],
          o ? String(!!o.autoDeduct) : 'false'))
    + '</div>'

    + '<div style="margin-top:12px">'
    +   '<label style="font-size:13px;font-weight:800;display:block;margin-bottom:7px">من أي دخل يُسدَّد؟</label>'
    +   '<div id="allocList"></div>'
    +   '<button class="chip add" onclick="allocAdd()">＋ إضافة مصدر</button>'
    +   '<div id="allocBox" class="alloc-sum"></div>'
    +   '<div class="hint">اتركه فارغاً ليقترحه النظام تلقائياً.</div>'
    + '</div>'

    + '<details class="adv"'+(adv?' open':'')+'><summary>خيارات متقدمة'
    +   '<span class="mut" style="font-size:12px;font-weight:500"> — للتقديري والمشترك والأقساط والمتوقع</span></summary>'
    + '<div class="form-grid" style="margin-top:12px">'
    + fld('نوع المبلغ', seg('oAmtType',[['ثابت','ثابت'],['تقديري','يتغير كل شهر']], o?o.amountType:'ثابت'),
          'مثل فاتورة الكهرباء — يُقترح مبلغها من متوسط آخر 3 دورات.')
    + fld('مرونة السداد', seg('oType',[['صارم','كامل فقط'],['مرن','يقبل الجزئي'],['ترفيهي','ترفيهي']], o?o.type:'صارم'))
    + fld('تاريخ البداية','<input id="oStart" type="date" value="'+(o&&o.startDate?o.startDate:cycleStart)+'">',
          'الافتراضي بداية دورتك الحالية ('+cycleStart+').')
    + fld('تاريخ الانتهاء','<input id="oEnd" type="date" value="'+(o&&o.endDate?o.endDate:'')+'">',
          'للأقساط — ليظهر في صفحة الديون بعدد أقساطه.')
    + fld('مهلة السماح (أيام)','<input id="oDelay" type="number" min="0" max="60" value="'+(o?o.maxDelay:0)+'">',
          'كم يوماً بعد الاستحقاق قبل اعتباره متأخراً.')
    + fld('الأولوية','<select id="oPriority">'+opts(['عالية|عالية','متوسطة|متوسطة','منخفضة|منخفضة'], o?o.priority:'متوسطة')+'</select>',
          'العالية تُوزَّع على الدخل أولاً.')
    + fld('حصتك من المبلغ %','<input id="oShare" type="number" min="1" max="100" value="'+(o?o.sharePercent:100)+'">',
          'التزام مشترك؟ 50 تعني نصفه عليك وتُحسب ميزانيتك على نصفه فقط.')
    + fld('فائدة القرض السنوية %','<input id="oRate" type="number" min="0" step="0.1" value="'+(o?o.interestRate:0)+'">',
          'للقروض فقط — يرتّب أي دين تسدده أولاً. اتركه صفراً غير ذلك.')
    + fldFull('درجة التأكد', seg('oCert',[['مؤكد','التزام مؤكد'],['متوقع','متوقع وقد لا يحدث']],
          o ? (o.certainty==='متوقع'?'متوقع':'مؤكد') : (asExpected ? 'متوقع' : 'مؤكد')))
    + fldFull('ملاحظات','<textarea id="oNotes">'+esc(o&&o.notes)+'</textarea>')
    + '</div></details>'
    + macts('حفظ', "saveOblig('"+(o?o.id:'')+"')")
  );
  allocRender();
}
/** غير الشهري يحتاج تاريخاً يثبّت موعده — نكشف حقله فوراً بدل أن يبقى مدفوناً. */
function recChanged(val){
  var d = document.querySelector('details.adv');
  if (!d) return;
  if (val !== 'شهري'){
    d.open = true;
    var st = el('oStart');
    if (st){
      st.focus();
      var h = st.parentNode.querySelector('.hint');
      if (h) h.textContent = val === 'مرة واحدة'
        ? 'تاريخ حدوث هذا الالتزام — يظهر في دورة هذا التاريخ فقط.'
        : 'يثبّت موعده: '+val+' يستحق كل مرة في نفس شهر هذا التاريخ.';
    }
  }
}
function allocAdd(){ S.alloc.push({ sourceId:'', amount:0 }); allocRender(); }
function allocDel(i){ S.alloc.splice(i,1); allocRender(); }
function allocSet(i,k,val){ S.alloc[i][k] = (k==='amount') ? (+val||0) : val; allocSum(); }
function allocRender(){
  var basics = S.data.incomes.filter(function(i){ return i.isBasic; });
  el('allocList').innerHTML = S.alloc.map(function(a,i){
    return '<div class="alloc-row">'
      + '<select onchange="allocSet('+i+',\'sourceId\',this.value)"><option value="">— اختر المصدر —</option>'
      +   basics.map(function(s){ return '<option value="'+s.id+'"'+(a.sourceId===s.id?' selected':'')+'>'+esc(s.name)+' — '+money(s.amount)+'</option>'; }).join('')
      + '</select>'
      + '<input type="number" min="0" value="'+a.amount+'" placeholder="المبلغ" oninput="allocSet('+i+',\'amount\',this.value)">'
      + '<button class="btn btn-sm no" onclick="allocDel('+i+')">حذف</button></div>';
  }).join('');
  allocSum();
}
function allocSum(){
  var box = el('allocBox'); if (!box) return;
  var total = +v('oAmount')||0;
  var a = S.alloc.reduce(function(s,x){ return s + (+x.amount||0); },0);
  var left = total - a;
  box.innerHTML = '<span>المخصص <strong>'+money(a)+'</strong> من '+money(total)+'</span>'
    + '<span class="'+(left<0?'red':left>0?'orange':'green')+'">'
    + (left<0 ? 'تجاوزت بمقدار '+money(-left) : left>0 ? 'غير مخصص '+money(left) : 'مكتمل') + '</span>';
}
function saveOblig(id){
  var amount = +v('oAmount')||0;
  var srcs = S.alloc.filter(function(a){ return a.sourceId && (+a.amount||0) > 0; });
  var d = { name:v('oName').trim(), amount:amount, day:+v('oDay')||1,
            amountType:v('oAmtType'), type:v('oType'), recurrence:v('oRec'),
            maxDelay:+v('oDelay')||0, priority:v('oPriority'), category:v('oCat'),
            autoDeduct:v('oAuto')==='true', certainty:v('oCert'),
            sharePercent:+v('oShare')||100, interestRate:+v('oRate')||0,
            startDate:v('oStart')||'', endDate:v('oEnd'),
            notes:v('oNotes'), month:S.month, sources:srcs };
  if (!d.name) return toast('أدخل اسم الالتزام','err');
  if (amount <= 0) return toast('أدخل مبلغاً أكبر من صفر','err');
  if (srcs.reduce(function(s,a){ return s+a.amount; },0) > amount) return toast('مجموع التخصيصات أكبر من مبلغ الالتزام','err');
  busy(true,'جاري الحفظ…');
  var run = srv(function(r){ closeModal(); S.forecast=null; S.allObs=null; after(r);
    if (S.view==='forecast') loadForecast();
    if (S.view==='oblig') loadAllObs(); }, failBusy);
  if (id) run.updateObligation(S.token, id, d); else run.addObligation(S.token, d);
}
function pay(id, paid){
  if (paid){
    var o = find(S.data.obligations, id);
    if (o) return openPay({ id:id, name:o.name, cycle:S.month, due:o.amount, paid:o.paidAmount,
                            estimated:!!o.isEstimated, flexible:o.type==='مرن'||o.type==='ترفيهي' });
  }
  busy(true, paid?'جاري تسجيل السداد…':'جاري الإلغاء…');
  srv(function(r){ after(r); payRefresh(id); }, failBusy).markPaid(S.token,id,S.month,paid);
}
function openPartial(id){
  var o = find(S.data.obligations, id);
  modal(mhead('سداد جزء', esc(o.name)+' — المتبقي '+money(o.remainingAmount))
    + fld('إجمالي المسدَّد هذا الشهر','<input id="pAmt" type="number" min="0" max="'+o.amount+'" value="'+o.amount+'">',
          'المسدَّد حتى الآن '+money(o.paidAmount)+' من أصل '+money(o.amount)+'. اكتب الرقم الإجمالي لا الإضافة.')
    + macts('حفظ', "submitPartial('"+id+"')"), true);
}
function submitPartial(id){
  busy(true,'جاري التسجيل…');
  srv(function(r){ closeModal(); after(r); }, failBusy).setPayment(S.token,id,S.month,+v('pAmt')||0);
}
function aiPredict(id, name){
  busy(true,'جاري التوقع…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر التوقع','err');
    modal(mhead('توقّع مبلغ «'+name+'»','مبني على سجل مبالغه السابقة')
      + '<div class="ai-ans">'+esc(r.answer)+'</div>'
      + '<div class="macts"><button class="btn wide" onclick="closeModal()">إغلاق</button></div>', true);
  }, failBusy).aiPredictAmount(S.token, id, S.month);
}
function delOblig(id){
  confirm2('حذف الالتزام؟','سيُنقل إلى سلة المحذوفات مع إمكانية الاستعادة خلال 30 يوماً.', function(){
    busy(true,'جاري الحذف…');
    srv(function(r){ S.allObs=null; after(r); loadAllObs(); }, failBusy).deleteObligation(S.token,id,S.month);
  });
}

/* ---------- التوزيع التلقائي ---------- */
function openAllocate(mode){
  var m = mode === 'all' ? 'all' : 'unassigned';
  busy(true,'جاري تحليل أفضل توزيع…');
  srv(function(items){
    busy(false);
    if (!items || items.error) return toast((items&&items.error)||'تعذر الحساب','err');
    if (!items.length) return toast('لا توجد التزامات لتوزيعها','err');
    allocModal(items, m);
  }, failBusy).autoAllocate(S.token, S.month, m);
}
function allocModal(items, mode){
  // في وضع «غير المربوط» لا نعرض ما ربطته بنفسك — كان يملأ القائمة بلا فائدة
  var shown = (mode === 'all') ? items : items.filter(function(x){ return !x.manual; });
  if (!shown.length) return toast('كل الالتزامات مربوطة بالفعل — استخدم «أعد توزيع الكل»','ok');
  var review = shown.filter(function(x){ return x.review; }).length;
  var payload = shown.map(function(x){ return { obligationId:x.obligationId, splits:x.splits }; });
  modal(
    mhead(mode==='all' ? 'إعادة توزيع كل الالتزامات' : 'اقتراح للالتزامات غير المربوطة',
          'القاعدة: آخر دخل أساسي ينزل قبل الاستحقاق، ضمن سعة تلك الدورة')
    + (mode==='all'
        ? '<div class="note n-red">سيُلغى الربط الحالي لكل البنود المعروضة ويُستبدل بالمقترح أدناه.</div>'
        : '<div class="note n-blue">معروض هنا '+shown.length+' التزام تنقصه مصادر سداد. ما ربطته بنفسك لم يُمس.</div>')
    + (review
        ? '<div class="note n-gold">منها <strong>'+review+'</strong> يحتاج مراجعتك — يعتمد على دورة الشهر السابق أو السعة لا تكفي.</div>'
        : '<div class="note n-green">تم إيجاد مصدر مناسب لكل ما هو معروض.</div>')
    + '<div class="prev">'
    + shown.map(function(x){
        return '<div class="prow'+(x.review?' warn':'')+'">'
          + '<div><div class="nm">'+esc(x.name)+' '+tag(x.priority, x.priority==='عالية'?'red':x.priority==='متوسطة'?'gold':'blue')+'</div>'
          +   '<div class="sub mut" style="font-size:12px">'+money(x.amount)+(x.manual?' · يدوي':'')+'</div></div>'
          + '<div>' + (x.splits.length
              ? x.splits.map(function(s){
                  return '<div class="sr">'+esc(s.sourceName)+' — '+money(s.amount)
                    + (s.occurrence ? ' <span class="mut" style="font-weight:500">('+s.occurrence+')</span>' : '')
                    + (s.estimated ? ' <span class="gold" style="font-size:12px">تقديري</span>' : '')
                    + (s.sameMonth === false ? ' <span class="orange" style="font-size:12px">دورة سابقة</span>' : '')
                    + '</div>'; }).join('')
              : '<div class="sr red">غير متاح</div>')
          + (x.shortfall ? '<div class="sub red">ينقص '+money(x.shortfall)+'</div>' : '') + '</div>'
          + '<div class="rs">'+esc(x.reason)+'</div></div>';
      }).join('')
    + '</div>'
    + '<div class="macts"><button class="btn-main" onclick=\'applyAlloc('+JSON.stringify(payload).replace(/'/g,'&#39;')+')\'>اعتماد التوزيع</button>'
    + '<button class="btn" onclick="closeModal()">لاحقاً</button></div>'
  );
}
function applyAlloc(items){
  busy(true,'جاري اعتماد التوزيع…');
  srv(function(r){ closeModal(); after(r); }, failBusy).applyAllocation(S.token, S.month, items);
}

/* ============================================================ 4) الديون ============================================================ */
function loadDebt(){
  srv(okOrFail('debt', function(r){ S.debt = r; if (S.view==='debt') render(); }), loadFail('debt')).getDebtOverview(S.token);
}
function loadPayoff(){
  srv(function(r){ if (r && !r.error){ S.payoff = r; if (S.view==='debt') render(); } }, failBusy).getPayoffPlan(S.token);
  srv(function(r){ if (r && !r.error){ S.fund = r; if (S.view==='debt') render(); } }, failBusy).getEmergencyFund(S.token);
}
function fundPanel(){
  var e = S.fund;
  if (!e) return '';
  var cls = e.level==='ممتاز'?'green':e.level==='جيد'?'blue':e.level==='ضعيف'?'orange':'red';
  return panel('صندوق الطوارئ','كم تصمد لو انقطع دخلك',
    '<div class="stats4">'
    + stat('حاجتك الشهرية', money(e.monthlyNeed))
    + stat('المدخر حالياً', money(e.saved))
    + stat('يغطي', e.monthsCovered+' شهر')
    + stat('التقييم', e.level)
    + '</div>'
    + '<div class="note n-'+(cls==='green'||cls==='blue'?'green':cls==='orange'?'gold':'red')+'" style="margin-top:12px">'
    + (e.monthsCovered>=3
        ? 'مدخراتك تغطي '+e.monthsCovered+' شهر من مصروفك الأساسي — وضع مطمئن.'
        : 'مدخراتك تغطي '+e.monthsCovered+' شهر فقط. المتعارف عليه ثلاثة أشهر على الأقل.')+'</div>'
    + '<div class="rows" style="margin-top:12px">'
    + e.targets.map(function(t){
        var pct = t.target? Math.min(100, e.saved/t.target*100) : 0;
        return '<div class="crow"><div class="cl">هدف '+t.months+' أشهر</div>'
          + '<div class="bar '+(pct>=100?'g':'')+'"><i style="width:'+pct+'%"></i></div>'
          + '<div class="cv">'+money(e.saved)+' / '+money(t.target)+'</div></div>'
          + (t.gap? '<div class="hint">ينقص '+money(t.gap)
             + (t.monthsToReach? ' — يتحقق خلال '+t.monthsToReach+' شهر بالادخار المقترح' : '')+'</div>' : '');
      }).join('')
    + '</div>');
}
function payoffPanel(){
  var p = S.payoff;
  if (!p) return '';
  if (!p.hasDebt) return panel('خطة السداد','', '<div class="empty">لا توجد ديون قائمة.</div>');
  var tbl = function(list, title, note){
    return '<div style="margin-bottom:14px"><strong>'+title+'</strong>'
      + '<div class="hint" style="margin-bottom:7px">'+note+'</div>'
      + '<div class="tw"><table style="min-width:520px"><thead><tr><th>#</th><th class="s">الدين</th>'
      + '<th>المتبقي</th><th class="hm">الفائدة</th><th>يحرّر شهرياً</th></tr></thead><tbody>'
      + list.map(function(x){
          return '<tr><td><strong>'+x.order+'</strong></td><td class="s">'+esc(x.name)+'</td>'
            + '<td class="red">'+money(x.remainingValue)+'</td>'
            + '<td class="hm">'+(x.interestRate? x.interestRate+'%':'—')+'</td>'
            + '<td class="green">'+money(x.freedPerMonth)+'</td></tr>';
        }).join('') + '</tbody></table></div></div>';
  };
  return panel('ترتيب سداد الديون','أي دين تسدده أولاً',
    '<div class="note n-blue">التوصية: ابدأ بـ <strong>'+esc(p.recommendation.target)+'</strong> '
    + '(استراتيجية '+esc(p.recommendation.strategy)+') — '+esc(p.recommendation.why)+'.'
    + (p.extraPayoffMonths? '<br>بتوجيه فائضك الآمن ('+money(p.spare)+' شهرياً) تسدده خلال '+p.extraPayoffMonths+' شهر، فيتحرر '+money(p.freedIfCleared)+' شهرياً.' : '')
    + '</div>'
    + tbl(p.avalanche, 'الأعلى فائدة أولاً', 'يوفّر أكبر قدر من تكلفة الفوائد')
    + tbl(p.snowball, 'الأقصر مدة أولاً', 'يحرّر التزاماً كاملاً بأسرع وقت فيرتفع فائضك الشهري'));
}
function pDebt(){
  var d = S.debt;
  if (!d) return waitOrErr('debt', 'جاري حساب الديون…', 'loadDebt()');
  // صندوق الطوارئ لا علاقة له بوجود ديون، فيظهر دائماً
  if (!d.items.length) {
    return fundPanel()
      + '<div class="panel"><div class="empty">لا توجد أقساط لها تاريخ انتهاء.<br>'
      + 'أضف «تاريخ الانتهاء» لأي التزام شهري ليظهر هنا بعدد أقساطه المتبقية.</div></div>';
  }
  var active = d.items.filter(function(x){ return !x.finished; });
  return kpis([
      ['إجمالي المتبقي', money(d.totalRemaining), 'red', active.length+' التزام قائم'],
      ['العبء الشهري', money(d.monthlyLoad), 'orange', 'السنوي محسوب مقسّماً على 12'],
      ['نسبته من دخلك', Math.round(d.incomeShare*100)+'%', d.incomeShare>0.4?'red':d.incomeShare>0.25?'orange':'green', 'من '+money(d.income)],
      ['آخر قسط', d.payoffDate || '—', 'blue', 'تاريخ التحرر من الأقساط']
    ])
    + (d.incomeShare > 0.4 ? '<div class="note n-red">أقساطك تستهلك أكثر من 40% من دخلك الأساسي — نسبة مرتفعة تترك هامشاً ضيقاً للطوارئ.</div>' : '')
    + fundPanel()
    + payoffPanel()
    + panel('تفاصيل كل تمويل','مرتبة حسب تاريخ الانتهاء',
        '<div class="tw"><table><thead><tr><th class="s">الالتزام</th><th>القسط</th><th>مدفوع</th><th>متبقٍ</th><th>قيمة المتبقي</th><th class="s">التقدم</th><th>ينتهي</th></tr></thead><tbody>'
        + d.items.map(function(x){
            return '<tr><td class="s"><strong>'+esc(x.name)+'</strong>'
              + '<span class="sub">'+esc(x.recurrence||'شهري')+' · من '+x.startDate+'</span></td>'
              + '<td>'+money(x.amount)
              + (x.step>1 ? '<span class="sub mut">≈ '+money(x.amount/x.step)+' شهرياً</span>' : '')+'</td>'
              + '<td>'+x.paidInstallments+'</td>'
              + '<td><strong>'+(x.remainingInstallments===null?'—':x.remainingInstallments)+'</strong></td>'
              + '<td class="red">'+(x.remainingValue===null?'—':money(x.remainingValue))+'</td>'
              + '<td class="s" style="min-width:160px"><div class="bar g"><i style="width:'+(x.progress*100)+'%"></i></div>'
              +   '<span class="sub">'+Math.round(x.progress*100)+'% · '+x.paidInstallments+' من '+(x.totalInstallments||'—')+'</span></td>'
              + '<td>'+x.endDate+(x.finished?'<span class="sub green">مكتمل</span>':'')+'</td></tr>';
          }).join('') + '</tbody></table></div>');
}

/* ============================================================ 4.5) ما ينتظرك ============================================================ */
function loadPayload(){
  srv(okOrFail('pload', function(r){ S.pload = r; if (S.view==='forecast') render(); }), loadFail('pload'))
    .getPaycheckLoad(S.token, 12);
}
/** كل نزول راتب في 12 دورة: كم يحمل وكم يتبقى — الربط دائم فالعجز القادم يظهر هنا قبل أن يقع. */
function payloadPanel(){
  var list = S.pload;
  if (!list) return S.errs.pload ? waitOrErr('pload','','loadPayload()') : '';
  if (!list.length) return '';
  var over = list.filter(function(p){ return p.over; });
  var bySrc = {};
  list.forEach(function(p){ (bySrc[p.source] = bySrc[p.source] || []).push(p); });
  return panel('ضغط كل راتب في الدورات القادمة', '12 دورة · ما يحمله كل نزول من التزامات وتجنيب',
      (over.length
        ? '<div class="note n-red">'+over.length+' نزول راتب سيعجز: '
          + over.slice(0,4).map(function(p){ return esc(p.source)+' '+p.date+' (عجز '+money(-p.free)+')'; }).join('، ')
          + '. السبب غالباً التزام سنوي يقع في تلك الدورة.'
          + '<div style="margin-top:8px"><button class="btn btn-sm" onclick="fixOverflow()">اطلب العلاج من المستشار</button></div></div>'
        : '<div class="note n-green">لا يعجز أي راتب في الدورات الـ12 القادمة بربطك الحالي.</div>')
      + Object.keys(bySrc).map(function(src){
          return '<div style="margin-top:12px"><strong style="font-size:14px">'+esc(src)+'</strong>'
            + '<div class="rows" style="margin-top:6px">' + bySrc[src].map(function(p){
                var pct = p.amount ? Math.min(100, p.load/p.amount*100) : 0;
                return '<div class="crow" title="'+attr(p.items.join(' · '))+'"><div class="cl">'+p.date+'</div>'
                  + '<div class="bar '+(p.over?'r':pct>85?'':'g')+'"><i style="width:'+pct+'%"></i></div>'
                  + '<div class="cv '+(p.over?'red':'')+'">'+money(p.load)+' / '+money(p.amount)
                  + (p.over?' · عجز '+money(-p.free):'')+'</div></div>';
              }).join('') + '</div></div>';
        }).join(''));
}
/** يصوغ للمستشار وصف العجز بدقة، فيقترح تجنيباً مرتبطاً بالالتزام أو إعادة ربط — ثم توافق أنت. */
function fixOverflow(){
  var over = (S.pload || []).filter(function(p){ return p.over; });
  if (!over.length) return;
  var q = 'عندي عجز متوقع في الرواتب: ' + over.map(function(p){
      return p.source + ' في ' + p.date + ' يحمل ' + p.load + ' من ' + p.amount + ' (عليه: ' + p.items.join('، ') + ')';
    }).join(' | ')
    + '. اقترح علاجه: الأفضل تجنيب شهري مرتبط بالالتزام السبب (obligationId) ينتهي في موعد استحقاقه، '
    + 'موزعاً على أكثر من مصدر إن كان أخف، أو إعادة ربط إن كانت أنسب. احسب المبلغ ليكتمل قبل الاستحقاق.';
  go('advisor');
  setTimeout(function(){ var e = el('aiQ'); if (e){ e.value = q; aiSend(); } }, 60);
}
function loadForecast(){
  srv(okOrFail('forecast', function(r){ S.forecast = r; if (S.view==='forecast') render(); }), loadFail('forecast'))
    .getForecast(S.token, 6);
}
function pForecast(){
  var f = S.forecast;
  if (!f) return waitOrErr('forecast', 'جاري حساب الدورات القادمة…', 'loadForecast()');
  var max = 1;
  f.cycles.forEach(function(c){ max = Math.max(max, c.income, c.confirmed + c.expected + c.purchases); });

  return kpis([
      ['أقرب دورة ضاغطة', f.firstTight ? money(f.firstTight.balance) : 'لا شيء',
        f.firstTight ? 'red' : 'green', f.firstTight ? f.firstTight.label : 'كل الدورات القادمة موجبة'],
      ['التزامات متوقعة', money(f.totalExpected), 'orange', 'غير مؤكدة بعد'],
      ['تحتاج تجنيبه شهرياً', money(f.setAsideMonthly), 'purple', 'لتغطية ما هو قادم'],
      ['الاحتياطي', money(f.buffer), 'blue', 'الحد الذي تعتبره ضاغطاً']
    ])
    + (f.firstTight
        ? '<div class="note n-red">دورة <strong>'+esc(f.firstTight.label)+'</strong> رصيدها المتوقع '
          + money(f.firstTight.balance)+'. ابدأ التجنيب من الآن أو أجّل ما يمكن تأجيله.</div>'
        : '<div class="note n-green">لا توجد دورة قادمة يتوقع أن تدخل في عجز ضمن الأفق المعروض.</div>')

    + (f.purchaseBudgetSet ? ''
        : '<div class="note n-gold">لم تحدد سقفاً للمشتريات النثرية، فالتوقعات أدناه '
          + '<strong>لا تحسم أي مصروف يومي</strong> وستبدو أفضل من الواقع. حدّده من الإعدادات.</div>')
    + payloadPanel()
    + panel('الدورات القادمة','الرصيد تراكمي: فائض دورة ينتقل للتي بعدها',
        '<div class="tw"><table><thead><tr><th class="s">الدورة</th><th>الدخل</th><th>مؤكد</th>'
        + '<th>متوقع</th><th class="hm">نثريات</th><th>الصافي</th><th>الرصيد</th></tr></thead><tbody>'
        + f.cycles.map(function(c){
            return '<tr'+(c.negative?' style="background:color-mix(in srgb,var(--red) 7%,transparent)"':'')+'>'
              + '<td class="s"><strong>'+esc(c.label)+'</strong>'
              + (c.isCurrent
                 ? '<span class="sub green">الدورة الحالية</span>'
                   + (c.opening||c.arrears
                      ? '<span class="sub mut">رصيد مرحّل '+money(c.opening)
                        + (c.arrears? ' · متأخرات '+money(c.arrears):'')+'</span>' : '')
                 : '')+'</td>'
              + '<td class="green">'+money(c.income)+'</td>'
              + '<td>'+money(c.confirmed)+'</td>'
              + '<td class="'+(c.expected?'orange':'mut')+'">'+money(c.expected)+'</td>'
              + '<td class="hm mut">'+money(c.purchases)+'</td>'
              + '<td class="'+(c.net>=0?'green':'red')+'">'+money(c.net)+'</td>'
              + '<td><strong class="'+(c.negative?'red':c.tight?'orange':'green')+'">'+money(c.balance)+'</strong></td></tr>';
          }).join('') + '</tbody></table></div>')

    + panel('البنود القادمة','غير المتكررة والمتوقعة — مرتبة بتاريخها',
        f.upcoming.length
        ? '<div class="tw"><table><thead><tr><th class="s">البند</th><th>المبلغ</th><th>الاستحقاق</th>'
          + '<th class="hm">بعد</th><th>جنّب شهرياً</th><th>إجراء</th></tr></thead><tbody>'
          + f.upcoming.map(function(u){
              return '<tr><td class="s"><strong>'+esc(u.name)+'</strong>'
                + '<span class="sub">'+esc(u.category||'أخرى')+' · '
                + (u.isExpected?'<span class="orange">متوقع</span>':'مؤكد')+'</span></td>'
                + '<td><strong>'+money(u.amount)+'</strong></td>'
                + '<td>'+u.dueDate+'</td>'
                + '<td class="hm">'+(u.cyclesAway===0?'هذه الدورة':u.cyclesAway+' دورة')+'</td>'
                + '<td class="purple">'+(u.cyclesAway>0?money(u.setAside):'—')+'</td>'
                + '<td><div class="acts">'
                + (u.isExpected
                    ? '<button class="btn btn-sm ok" onclick="setCertainty(\''+u.id+'\',\'مؤكد\')">تحقق</button>'
                      + '<button class="btn btn-sm no" onclick="dropExpected(\''+u.id+'\',\''+attrJs(u.name)+'\','+u.amount+')">لم يتحقق</button>'
                    : '<button class="btn btn-sm" onclick="setCertainty(\''+u.id+'\',\'متوقع\')">اجعله متوقعاً</button>')
                + '<button class="btn btn-sm" onclick="openOblig(\''+u.id+'\')">تعديل</button>'
                + '</div></td></tr>';
            }).join('') + '</tbody></table></div>'
        : '<div class="empty">لا توجد بنود غير متكررة قادمة. أضف ما تتوقعه: فاتورة بعد شهرين، عانية بعد خمسة…</div>',
        '<button class="btn btn-sm" onclick="openOblig(\'\', true)">إضافة التزام متوقع</button>');
}
function setCertainty(id, val){
  busy(true,'جاري التحديث…');
  srv(function(r){ S.forecast=null; after(r); loadForecast(); }, failBusy)
    .setObligationCertainty(S.token, id, val, S.month);
}
function dropExpected(id, name, amount){
  confirm2('لم يتحقق «'+name+'»؟',
    'سيُحرَّر '+money(amount)+' من توقعاتك ويعود إلى المتبقي المتاح. يمكنك إرجاعه لاحقاً من صفحة الإدارة.',
    function(){ setCertainty(id, 'لم يتحقق'); });
}

/* ============================================================ 4.7) التدفق اليومي ============================================================ */
function loadFlow(){
  srv(okOrFail('flow', function(r){ S.flow = r; if (S.view==='flow') render(); }), loadFail('flow'))
    .getDailyFlow(S.token, S.month);
  srv(okOrFail('sens', function(r){ S.sens = r; if (S.view==='flow') render(); }), loadFail('sens'))
    .getSensitivity(S.token, S.month);
}
function pFlow(){
  var f = S.flow;
  if (!f) return waitOrErr('flow', 'جاري حساب التدفق اليومي…', 'loadFlow()');
  var max = 1, min = 0;
  f.days.forEach(function(d){ max = Math.max(max, d.balance); min = Math.min(min, d.balance); });
  var span = (max - min) || 1;

  return kpis([
      ['الرصيد الافتتاحي', money(f.opening), 'blue', f.start],
      ['أدنى رصيد في الدورة', money(f.minBalance), f.minBalance<0?'red':'green', f.minDate],
      ['الرصيد الختامي المتوقع', money(f.closing), f.closing>=0?'green':'red', f.end],
      ['نثريات متوقعة يومياً', money(f.plannedDailyPurchase), 'orange', 'موزّعة على ما تبقّى']
    ])
    + (f.firstNegative
       ? '<div class="note n-red"><strong>رصيدك ينقلب سالباً يوم '+f.firstNegative.date+'</strong> ويصل '
         + money(f.firstNegative.balance)+'. السبب: '
         + f.firstNegative.causes.map(function(c){ return esc(c.label)+' ('+money(-c.amount)+')'; }).join(' · ')
         + '.<br>المجموع الشهري قد يكون موجباً — المشكلة في التوقيت لا في المبلغ.</div>'
       : '<div class="note n-green">رصيدك يبقى موجباً كل أيام الدورة. أدنى نقطة '+money(f.minBalance)+' يوم '+f.minDate+'.</div>')

    + panel('منحنى الرصيد','كل عمود يوم — الأحمر تحت الصفر',
        '<div class="flowbar">'+f.days.map(function(d,i){
          var h = Math.max(2, Math.abs(d.balance) / span * 100);
          return '<div class="fday'+(d.balance<0?' neg':'')+(d.isToday?' today':'')+'" title="'+d.date+': '+money(d.balance)+'">'
            + '<i style="height:'+h+'%"></i>'
            + (i%5===0?'<small>'+(+d.date.slice(8))+'</small>':'')+'</div>';
        }).join('')+'</div><div style="height:20px"></div>')

    + panel('الأيام المؤثرة','الأيام التي فيها حركة فقط',
        '<div class="tw"><table><thead><tr><th>اليوم</th><th>داخل</th><th>خارج</th><th>الرصيد</th><th class="s">الحركة</th></tr></thead><tbody>'
        + f.days.filter(function(d){ return d.events.length; }).map(function(d){
            return '<tr'+(d.balance<0?' style="background:color-mix(in srgb,var(--red) 7%,transparent)"':'')+'>'
              + '<td><strong>'+d.date.slice(5)+'</strong>'+(d.isToday?'<span class="sub green">اليوم</span>':'')+'</td>'
              + '<td class="green">'+(d.inflow?money(d.inflow):'—')+'</td>'
              + '<td class="red">'+(d.outflow?money(d.outflow):'—')+'</td>'
              + '<td><strong class="'+(d.balance<0?'red':'green')+'">'+money(d.balance)+'</strong></td>'
              + '<td class="s"><div class="fevents">'+d.events.map(function(e){
                  var cls = e.kind==='income'?'in':e.kind==='plannedPurchase'?'plan':'out';
                  return '<span class="fev '+cls+'">'+esc(e.label)+' '+money(Math.abs(e.amount))+'</span>';
                }).join('')+'</div></td></tr>';
          }).join('') + '</tbody></table></div>')

    + sensPanel();
}
function sensPanel(){
  var x = S.sens;
  if (!x) return '';
  return panel('تحليل الحساسية','ماذا يحدث لو ساءت الأمور',
    (x.resilient
      ? '<div class="note n-green">وضعك يتحمل كل السيناريوهات المختبرة دون أن يسلب رصيدك.</div>'
      : '<div class="note n-gold">أسوأ سيناريو: <strong>'+esc(x.worst?x.worst.name:'')+'</strong>'
        + (x.worst&&x.worst.negativeDate?' — يسلب رصيدك يوم '+x.worst.negativeDate:'')+'.</div>')
    + '<div class="tw"><table><thead><tr><th class="s">السيناريو</th><th>أدنى رصيد</th><th>الختامي</th><th>الفرق</th><th>النتيجة</th></tr></thead><tbody>'
    + x.cases.map(function(c){
        return '<tr><td class="s">'+esc(c.name)+'</td>'
          + '<td class="'+(c.minBalance<0?'red':'green')+'">'+money(c.minBalance)+'</td>'
          + '<td>'+money(c.closing)+'</td>'
          + '<td class="'+(c.deltaClosing<0?'red':'mut')+'">'+money(c.deltaClosing)+'</td>'
          + '<td>'+(c.goesNegative?tag('يسلب '+c.negativeDate.slice(5),'red'):tag('يتحمّل','green'))+'</td></tr>';
      }).join('')
    + x.perSource.map(function(c){
        return '<tr><td class="s">'+esc(c.name)+'</td>'
          + '<td class="'+(c.minBalance<0?'red':'green')+'">'+money(c.minBalance)+'</td>'
          + '<td>'+money(c.closing)+'</td><td class="red">-'+money(c.amount)+'</td>'
          + '<td>'+(c.goesNegative?tag('يسلب','red'):tag('يتحمّل','green'))+'</td></tr>';
      }).join('')
    + '</tbody></table></div>');
}

/* ============================================================ 5) المشتريات ============================================================ */
function pPurchases(){
  var s = S.data.summary, all = S.data.purchases, cats = S.data.settings.purchaseCategories;
  var list = all.filter(function(p){
    if (S.pf.cat!=='all' && p.category!==S.pf.cat) return false;
    if (S.pf.q && (p.item+' '+p.store+' '+p.notes).toLowerCase().indexOf(S.pf.q.toLowerCase())<0) return false;
    return true;
  });
  var byCat = {}, byStore = {};
  all.forEach(function(p){
    byCat[p.category] = (byCat[p.category]||0) + p.amount;
    var k = p.store || 'غير محدد';
    byStore[k] = (byStore[k]||0) + p.amount;
  });
  var todayKey = new Date().toLocaleDateString('en-CA');
  var todayAmt = all.filter(function(p){ return p.date===todayKey; }).reduce(function(x,p){ return x+p.amount; },0);
  var pct = s.purchaseBudget ? Math.min(100, s.purchasesSpent/s.purchaseBudget*100) : 0;
  var catKeys = Object.keys(byCat).sort(function(a,b){ return byCat[b]-byCat[a]; });
  var storeKeys = Object.keys(byStore).sort(function(a,b){ return byStore[b]-byStore[a]; });

  return kpis([
      ['مشتريات الشهر', money(s.purchasesSpent), s.purchasesOverBudget?'red':'orange', all.length+' عملية'],
      ['مشتريات اليوم', money(todayAmt), 'gold', ''],
      ['المتبقي من السقف', money(s.purchasesLeft), s.purchasesLeft>0?'green':'red', s.purchaseBudget?'من '+money(s.purchaseBudget):'لم تحدد سقفاً'],
      ['متوسط العملية', money(all.length ? s.purchasesSpent/all.length : 0), 'blue', '']
    ])
    + (s.purchaseBudget
        ? '<div class="panel"><div class="phead"><div><h3>استهلاك السقف الشهري</h3><div class="sub">النثريات تُحجز من المتبقي الآمن، فلا تُنسى في الخطة</div></div>'
          + '<strong class="'+(s.purchasesOverBudget?'red':'green')+'">'+Math.round(pct)+'%</strong></div>'
          + '<div class="bar '+(s.purchasesOverBudget?'r':'g')+'"><i style="width:'+pct+'%"></i></div></div>'
        : '<div class="note n-gold">لم تحدد سقفاً شهرياً للمشتريات النثرية. حدّده من الإعدادات ليُحجز تلقائياً من المتبقي الآمن بدل أن يفاجئك آخر الشهر.</div>')
    + '<div class="g2">'
    + panel('أكثر التصنيفات صرفاً','حسب إجمالي المبلغ',
        catKeys.length ? '<div class="stats4">'+catKeys.slice(0,4).map(function(k){ return stat(esc(k), money(byCat[k])); }).join('')+'</div>'
                       : '<div class="empty">سجّل مشترياتك ليظهر التحليل.</div>')
    + panel('أكثر الأماكن صرفاً','حسب إجمالي المبلغ',
        storeKeys.length ? '<div class="stats4">'+storeKeys.slice(0,4).map(function(k){ return stat(esc(k), money(byStore[k])); }).join('')+'</div>'
                         : '<div class="empty">أضف اسم المتجر ليظهر التحليل.</div>')
    + '</div>'
    + quickBar(cats)
    + catBudgetPanel()
    + purchRangePanel()
    + '<div class="toolbar"><div class="tb-row two">'
    +   '<input id="pq" value="'+attr(S.pf.q)+'" oninput="pSearch(this.value)" placeholder="ابحث في المشتريات…">'
    +   '<select onchange="S.pf.cat=this.value;render()"><option value="all">كل التصنيفات</option>'
    +     cats.map(function(c){ return '<option value="'+attr(c)+'"'+(S.pf.cat===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')
    +   '</select></div></div>'
    + panel('سجل المشتريات', list.length+' من '+all.length+' عملية',
        list.length
        ? '<div class="tw"><table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>التصنيف</th><th class="s">ماذا اشتريت</th><th class="s">من أين</th><th>إجراء</th></tr></thead><tbody>'
          + list.map(function(p){
              return '<tr><td>'+p.date+'</td><td><strong class="red">'+money(p.amount)+'</strong></td>'
                + '<td>'+tag(esc(p.category),'gray')+'</td>'
                + '<td class="s"><strong>'+esc(p.item)+'</strong>'+(p.notes?'<span class="sub">'+esc(p.notes)+'</span>':'')+'</td>'
                + '<td class="s">'+esc(p.store||'—')+'</td>'
                + '<td><div class="acts"><button class="btn btn-sm" onclick="openPurchase(\''+p.id+'\')">تعديل</button>'
                + '<button class="btn btn-sm no" onclick="delPurchase(\''+p.id+'\')">حذف</button></div></td></tr>';
            }).join('') + '</tbody></table></div>'
        : '<div class="empty">لا توجد نتائج.</div>',
        '<div class="acts"><button class="btn btn-sm" onclick="openSms()">لصق رسائل البنك</button>'
        + '<button class="btn btn-sm" onclick="openRecurring()">المصاريف المتكررة</button>'
        + '<button class="btn btn-sm" onclick="openReceipt()">صوّر فاتورة</button>'
        + '<button class="btn btn-sm" onclick="openNlp()">اكتب بالكلام</button>'
        + '<button class="btn btn-sm" onclick="exportCsv(\'purchases\')">تصدير CSV</button></div>');
}

/* ---------- الإدخال السريع: أكثر إجراء تكراراً، فيجب أن يكون بسطر واحد ---------- */
function quickBar(cats){
  // الإدخال السريع يسجّل بتاريخ اليوم، فلا معنى له وأنت تتصفح شهراً آخر
  if (S.month !== currentCycle()){
    return '<div class="note n-gold">الإدخال السريع يسجّل بتاريخ اليوم، وأنت تتصفح '+monthName(S.month)+'. '
      + '<button class="btn btn-sm" onclick="setMonth(\''+currentCycle()+'\')">ارجع للدورة الحالية</button> '
      + 'أو استخدم «تسجيل شراء» لاختيار التاريخ يدوياً.</div>';
  }
  return '<div class="quick">'
    + '<input id="qAmt" type="number" min="0" step="1" placeholder="المبلغ" value="'+attr(S.qp.amount)+'" onkeydown="qKey(event)">'
    + '<select id="qCat">'+cats.map(function(c){
        return '<option value="'+attr(c)+'"'+(S.qp.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select>'
    + '<input id="qItem" type="text" placeholder="وش اشتريت؟ (اختياري — يأخذ اسم التصنيف)" value="'+attr(S.qp.item)+'" onkeydown="qKey(event)">'
    + '<button class="btn-main" onclick="quickAdd()">تسجيل</button></div>';
}
function qKey(e){ if (e.key === 'Enter') quickAdd(); }
function quickAdd(){
  var amt = +v('qAmt')||0;
  if (amt <= 0){ toast('أدخل مبلغاً أكبر من صفر','err'); var a=el('qAmt'); if(a)a.focus(); return; }
  var cat = v('qCat');
  var item = v('qItem').trim() || cat;
  S.qp = { amount:'', item:'', category:cat };
  busy(true,'جاري التسجيل…');
  srv(function(r){
    after(r);
    // نعيد التركيز لحقل المبلغ ليتسلسل الإدخال بلا فأرة
    setTimeout(function(){ var a = el('qAmt'); if (a) a.focus(); }, 80);
  }, failBusy).addPettyPurchase(S.token, { date:new Date().toLocaleDateString('en-CA'),
      amount:amt, category:cat, item:item, store:'', notes:'', month:S.month });
}

/* ---------- قراءة فاتورة بالصورة ---------- */
function openReceipt(){
  modal(mhead('قراءة فاتورة بالصورة','يستخرج المستشار البنود والمبالغ والتصنيف')
    + '<div class="drop" onclick="el(\'rcpFile\').click()">اضغط لاختيار صورة الفاتورة</div>'
    + '<input id="rcpFile" type="file" accept="image/*" class="hidden" onchange="readReceipt(this)">'
    + '<div id="rcpOut"></div>'
    + '<div class="macts"><button class="btn wide" onclick="closeModal()">إغلاق</button></div>');
}
function readReceipt(input){
  var f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 4 * 1024 * 1024) return toast('الصورة كبيرة — استخدم صورة أصغر من 4 ميجا','err');
  var rd = new FileReader();
  rd.onload = function(){
    var b64 = String(rd.result).split(',')[1];
    busy(true,'جاري قراءة الفاتورة…');
    srv(function(r){
      busy(false);
      if (!r || r.error) return toast((r&&r.error)||'تعذرت القراءة','err');
      var box = el('rcpOut');
      if (!box) return;
      S.sms = r.items.map(function(x){ return Object.assign({}, x, { keep:true, duplicate:false }); });
      box.innerHTML = '<div class="note n-green" style="margin-top:12px">استُخرج '+r.items.length
        + ' بند من '+(r.store?esc(r.store):'الفاتورة')+'. راجعها قبل الحفظ.</div>'
        + '<div id="smsOut"></div>';
      renderSms();
    }, failBusy).aiReadReceipt(S.token, b64, f.type || 'image/jpeg', S.month);
  };
  rd.readAsDataURL(f);
}

/* ---------- إدخال بالكلام الطبيعي ---------- */
function openNlp(){
  modal(mhead('اكتب بالكلام','مثال: صرفت 80 ريال عشاء أمس مع أخوي')
    + fld('ماذا صرفت؟','<input id="nlpText" placeholder="اكتب بلغتك الطبيعية">')
    + '<div id="nlpOut"></div>'
    + '<div class="macts"><button class="btn-main" onclick="parseNlp()">حوّلها لعملية</button>'
    + '<button class="btn" onclick="closeModal()">إغلاق</button></div>', true);
}
function parseNlp(){
  var t = v('nlpText').trim();
  if (!t) return toast('اكتب الجملة','err');
  busy(true,'جاري الفهم…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'لم أفهم','err');
    var box = el('nlpOut');
    if (!box) return;   // أُغلقت النافذة قبل وصول النتيجة
    S.sms = [Object.assign({}, r, { keep:true, duplicate:false })];
    box.innerHTML = '<div class="note n-green" style="margin-top:12px">فهمت: '
      + esc(r.item)+' · '+money(r.amount)+' · '+esc(r.category)+' · '+r.date+'</div><div id="smsOut"></div>';
    renderSms();
  }, failBusy).aiParseEntry(S.token, t, S.month);
}

/* ---------- استيراد رسائل البنك ---------- */
function openSms(){
  S.sms = [];
  modal(mhead('لصق رسائل البنك','الصق رسالة واحدة أو عدة رسائل دفعة واحدة — تُستخرج تلقائياً')
    + fld('الرسائل','<textarea id="smsText" style="min-height:150px" placeholder="الصق هنا رسائل الشراء كما وصلتك…"></textarea>',
          'تُتجاهل رسائل الإيداع والراتب تلقائياً، وتُحلَّل الأرقام العربية.')
    + '<div id="smsOut"></div>'
    + '<div class="macts"><button class="btn-main" onclick="parseSms()">تحليل الرسائل</button>'
    + '<button class="btn" onclick="closeModal()">إغلاق</button></div>');
}
function parseSms(){
  var t = v('smsText');
  if (!t.trim()) return toast('الصق الرسائل أولاً','err');
  busy(true,'جاري التحليل…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر التحليل','err');
    if (!r.length) {
      el('smsOut').innerHTML = '<div class="note n-gold" style="margin-top:12px">'
        + 'لم أتعرّف على أي عملية شراء في هذا النص.<br>'
        + 'الأسباب المعتادة: الرسالة إيداع أو حوالة (وهذه تُتجاهل عمداً)، أو أن صيغة بنكك مختلفة.<br>'
        + 'إن كانت عملية شراء فعلاً، سجّلها بالإدخال السريع الآن، وأرسل نص الرسالة كما هو ليُضاف دعم صيغتها.'
        + '</div>';
      return;
    }
    S.sms = r.map(function(x){ return Object.assign({}, x, { keep: !x.duplicate }); });
    renderSms();
  }, failBusy).parseBankMessages(S.token, t);
}
function renderSms(){
  var out = el('smsOut');
  if (!out) return;
  var cats = S.data.settings.purchaseCategories;
  var dups = S.sms.filter(function(x){ return x.duplicate; }).length;
  out.innerHTML = '<div class="note n-blue" style="margin-top:12px">وجدت <strong>'+S.sms.length+'</strong> عملية'
    + (dups ? ' — منها <strong>'+dups+'</strong> تشبه عمليات مسجّلة مسبقاً (غير محدَّدة تلقائياً)' : '')
    + '. راجعها قبل الحفظ.</div>'
    + S.sms.map(function(x,i){
        return '<div class="sms-row'+(x.duplicate?' dup':'')+'">'
          + '<input type="checkbox" '+(x.keep?'checked':'')+' onchange="S.sms['+i+'].keep=this.checked">'
          + '<strong>'+money(x.amount)+'</strong>'
          + '<input type="text" value="'+attr(x.item)+'" oninput="S.sms['+i+'].item=this.value">'
          + '<select onchange="S.sms['+i+'].category=this.value">'+cats.map(function(c){
              return '<option value="'+attr(c)+'"'+(x.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select>'
          + '<span class="mut">'+x.date+'</span></div>';
      }).join('')
    + '<button class="btn-main wide" style="margin-top:10px" onclick="saveSms()">حفظ المحدَّد</button>';
}
function saveSms(){
  var keep = S.sms.filter(function(x){ return x.keep; });
  if (!keep.length) return toast('لم تحدد أي عملية','err');
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); after(r); }, failBusy).addPurchasesBulk(S.token, keep, S.month);
}

/* ---------- المصاريف المتكررة ---------- */
function openRecurring(){
  busy(true,'جاري التحميل…');
  srv(function(r){
    busy(false);
    S.recurring = r && r.length !== undefined ? r : [];
    recurringModal();
  }, failBusy).getRecurringPurchases(S.token);
}
function recurringModal(){
  var list = S.recurring || [];
  modal(mhead('المصاريف المتكررة','تُسجَّل تلقائياً أول كل شهر بدل إعادة كتابتها')
    + (list.length
      ? '<div class="tw"><table style="min-width:520px"><thead><tr><th class="s">الوصف</th><th>المبلغ</th><th>التصنيف</th><th>اليوم</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>'
        + list.map(function(x){
            return '<tr><td class="s"><strong>'+esc(x.item)+'</strong>'+(x.store?'<span class="sub">'+esc(x.store)+'</span>':'')+'</td>'
              + '<td>'+money(x.amount)+'</td><td>'+tag(esc(x.category),'gray')+'</td><td>'+x.day+'</td>'
              + '<td>'+(x.active?tag('فعّال','green'):tag('موقوف','gray'))+'</td>'
              + '<td><div class="acts"><button class="btn btn-sm" onclick="openRecurringEdit(\''+x.id+'\')">تعديل</button>'
              + '<button class="btn btn-sm no" onclick="delRecurring(\''+x.id+'\')">حذف</button></div></td></tr>';
          }).join('') + '</tbody></table></div>'
      : '<div class="empty">لا توجد مصاريف متكررة.</div>')
    + '<div class="macts"><button class="btn-main" onclick="openRecurringEdit()">إضافة متكرر</button>'
    + '<button class="btn" onclick="closeModal()">إغلاق</button></div>');
}
function openRecurringEdit(id){
  var x = id ? (S.recurring||[]).filter(function(r){ return r.id===id; })[0] : null;
  var cats = S.data.settings.purchaseCategories;
  modal(mhead(x?'تعديل متكرر':'مصروف متكرر جديد','يُولَّد تلقائياً في اليوم المحدد من كل شهر')
    + '<div class="form-grid">'
    + fldFull('الوصف *','<input id="rItem" value="'+attr(x&&x.item)+'" placeholder="اشتراك، نت، نادي…">')
    + fld('المبلغ *','<input id="rAmt" type="number" min="0" value="'+(x?x.amount:'')+'">')
    + fld('يوم الشهر','<input id="rDay" type="number" min="1" max="31" value="'+(x?x.day:1)+'">')
    + fld('التصنيف','<select id="rCat">'+cats.map(function(c){
          return '<option value="'+attr(c)+'"'+(x&&x.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select>')
    + fld('من أين','<input id="rStore" value="'+attr(x&&x.store)+'">')
    + fldFull('الحالة', seg('rActive',[['true','فعّال'],['false','موقوف']], x?String(!!x.active):'true'))
    + '</div>'
    + macts('حفظ', "saveRecurring('"+(id||'')+"')"), false);
}
function saveRecurring(id){
  var d = { item:v('rItem').trim(), amount:+v('rAmt')||0, day:+v('rDay')||1,
            category:v('rCat'), store:v('rStore').trim(), active:v('rActive')==='true', month:S.month };
  if (!d.item) return toast('اكتب وصف المصروف','err');
  if (d.amount <= 0) return toast('أدخل مبلغاً أكبر من صفر','err');
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); after(r); S.recurring=null; }, failBusy)
    .saveRecurringPurchase(S.token, id, d);
}
function delRecurring(id){
  confirm2('حذف المصروف المتكرر؟','لن يُولَّد بعد اليوم. العمليات المسجَّلة سابقاً تبقى كما هي.', function(){
    busy(true,'جاري الحذف…');
    srv(function(r){ closeModal(); after(r); S.recurring=null; }, failBusy)
      .deleteRecurringPurchase(S.token, id, S.month);
  });
}

/** سقف كل تصنيف مقابل ما صُرف منه فعلاً. */
/** المشتريات بين أي تاريخين — مستقلة عن الدورة. */
function purchRangePanel(){
  var p = S.prr, d = p.data;
  var head = '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end">'
    + '<label style="font-size:13px"><span class="mut">من</span><input type="date" id="prF" value="'+attr(p.from)+'"></label>'
    + '<label style="font-size:13px"><span class="mut">إلى</span><input type="date" id="prT" value="'+attr(p.to)+'"></label>'
    + '<button class="btn" onclick="purchRange(v(\'prF\'),v(\'prT\'))">اعرض</button></div>'
    + '<div class="chips" style="margin-top:8px">'
    +   [['cur','الدورة الحالية'],['prev','الدورة السابقة'],['m3','آخر 3 دورات'],['year','هذه السنة']]
          .map(function(x){ return '<button class="chip" onclick="purchPreset(\''+x[0]+'\')">'+x[1]+'</button>'; }).join('')
    + '</div>';
  var body = '';
  if (S.errs.prr) body = '<div class="note n-red" style="margin-top:10px">'+esc(S.errs.prr)+'</div>';
  else if (p.loading) body = '<div class="empty">جاري الجلب…</div>';
  else if (d) body = '<div class="stats4" style="margin-top:12px">'+stat('الإجمالي', money(d.total))+stat('العمليات', d.rows.length)
      + (d.byCategory[0]?stat('الأعلى', esc(d.byCategory[0].category)+' '+money(d.byCategory[0].amount)):'')+'</div>'
      + (d.rows.length ? '<div class="tw" style="margin-top:10px"><table style="min-width:460px"><thead><tr><th>التاريخ</th>'
        + '<th class="s">البند</th><th>التصنيف</th><th>المبلغ</th></tr></thead><tbody>'
        + d.rows.slice(0,200).map(function(x){ return '<tr><td>'+x.date+'</td><td class="s">'+esc(x.item)
            + (x.store?'<span class="sub">'+esc(x.store)+'</span>':'')+'</td><td>'+esc(x.category)+'</td><td>'+money(x.amount)+'</td></tr>'; }).join('')
        + '</tbody></table></div>' : '<div class="empty">لا مشتريات في هذه الفترة.</div>');
  return panel('المشتريات بين تاريخين','عبر أي عدد من الدورات', head + body);
}
function purchRange(f, t){
  if (!f || !t) return toast('اختر التاريخين','err');
  S.prr = { from:f, to:t, data:null, loading:true }; delete S.errs.prr; render();
  srv(okOrFail('prr', function(r){ S.prr.data = r; S.prr.loading = false; render(); }),
      function(e){ S.prr.loading = false; loadFail('prr')(e); })
    .getPurchasesRange(S.token, f, t);
}
function purchPreset(k){
  var r = S.data.settings.cycleRange, d = function(x){ return x.toLocaleDateString('en-CA'); };
  var st = new Date(r.start+'T00:00:00'), en = new Date(r.end+'T00:00:00');
  var addM = function(dt, n){ var x = new Date(dt); x.setMonth(x.getMonth()+n); return x; };
  if (k==='cur')  return purchRange(r.start, r.end);
  if (k==='prev') return purchRange(d(addM(st,-1)), d(addM(en,-1)));
  if (k==='m3')   return purchRange(d(addM(st,-2)), r.end);
  if (k==='year') return purchRange(new Date().getFullYear()+'-01-01', r.end);
}

function catBudgetPanel(){
  var list = (S.data.categorySpend||[]).filter(function(c){ return c.budget > 0; });
  var noBudget = (S.data.categorySpend||[]).filter(function(c){ return !c.budget && c.spent > 0; });
  var over = list.filter(function(c){ return c.over; });
  return panel('ميزانية التصنيفات', list.length ? list.length+' تصنيف له سقف' : 'لم تحدد سقوفاً بعد',
    (over.length ? '<div class="note n-red">تجاوزت السقف في: '
        + over.map(function(c){ return esc(c.category)+' ('+money(c.spent-c.budget)+' زيادة)'; }).join('، ')+'</div>' : '')
    + (list.length
      ? '<div class="rows">'+list.map(function(c){
          var pct = Math.min(100, (c.usage||0)*100);
          return '<div class="crow"><div class="cl">'+esc(c.category)+'</div>'
            + '<div class="bar '+(c.over?'r':c.near?'':'g')+'"><i style="width:'+pct+'%"></i></div>'
            + '<div class="cv '+(c.over?'red':'green')+'">'+money(c.spent)+' / '+money(c.budget)+'</div></div>';
        }).join('')+'</div>'
      : '<div class="empty">حدّد سقفاً لكل تصنيف لتعرف متى تتجاوزه — من زر «سقوف التصنيفات».</div>')
    + (noBudget.length
      ? '<div class="hint" style="margin-top:10px">بلا سقف: '
        + noBudget.slice(0,6).map(function(c){ return esc(c.category)+' '+money(c.spent); }).join(' · ')+'</div>'
      : ''),
    '<button class="btn btn-sm" onclick="openCatBudgets()">سقوف التصنيفات</button>');
}
function openCatBudgets(){
  var cats = S.data.settings.purchaseCategories || [];
  var b = S.data.settings.categoryBudgets || {};
  modal(mhead('سقوف التصنيفات','اترك الحقل فارغاً أو صفراً لتصنيف بلا سقف')
    + '<div class="form-grid">'
    + cats.map(function(c,i){
        return fld(esc(c),'<input id="cb'+i+'" type="number" min="0" value="'+(b[c]||'')+'" placeholder="بلا سقف">');
      }).join('')
    + '</div>'
    + '<div class="note n-blue">السقوف هنا للمتابعة والتنبيه فقط. الحجز من المتبقي الآمن يتم عبر '
    + '«سقف المشتريات النثرية» الإجمالي في الإعدادات.</div>'
    + macts('حفظ','saveCatBudgets()'));
}
function saveCatBudgets(){
  var cats = S.data.settings.purchaseCategories || [];
  var out = {};
  cats.forEach(function(c,i){ var x = +v('cb'+i)||0; if (x>0) out[c]=x; });
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); after(r); }, failBusy).saveCategoryBudgets(S.token, out, S.month);
}

var pTimer = null;
function pSearch(val){
  S.pf.q = val;
  clearTimeout(pTimer);
  pTimer = setTimeout(function(){
    render();
    var e = el('pq'); if (e){ e.focus(); e.setSelectionRange(e.value.length, e.value.length); }
  }, 220);
}
function openPurchase(id){
  var p = id ? find(S.data.purchases, id) : null;
  var cats = S.data.settings.purchaseCategories;
  modal(
    mhead(p ? 'تعديل العملية' : 'تسجيل شراء','التاريخ يبدأ باليوم تلقائياً ويمكن تغييره')
    + '<div class="form-grid">'
    + fld('التاريخ *','<input id="uDate" type="date" value="'+(p?p.date:new Date().toLocaleDateString('en-CA'))+'">')
    + fld('المبلغ *','<input id="uAmount" type="number" min="0" step="1" value="'+(p?p.amount:'')+'">')
    + fldFull('التصنيف *','<select id="uCat">'
        + cats.map(function(c){ return '<option value="'+attr(c)+'"'+(p&&p.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')
        + '</select><div class="chips"><button class="chip add" onclick="addCategory()">＋ تصنيف جديد</button></div>')
    + fldFull('ماذا اشتريت؟ *','<input id="uItem" value="'+attr(p&&p.item)+'" placeholder="وصف مختصر">')
    + fld('من أين؟','<input id="uStore" value="'+attr(p&&p.store)+'" placeholder="اسم المحل">')
    + fld('ملاحظات','<input id="uNotes" value="'+attr(p&&p.notes)+'">')
    + '</div>'
    + macts('حفظ', "savePurchase('"+(id||'')+"')")
  );
}
function savePurchase(id){
  var d = { date:v('uDate'), amount:+v('uAmount')||0, category:v('uCat'),
            item:v('uItem').trim(), store:v('uStore').trim(), notes:v('uNotes'), month:S.month };
  if (!d.item) return toast('اكتب ماذا اشتريت','err');
  if (d.amount <= 0) return toast('أدخل مبلغاً أكبر من صفر','err');
  busy(true,'جاري الحفظ…');
  var run = srv(function(r){ closeModal(); after(r); }, failBusy);
  if (id) run.updatePettyPurchase(S.token,id,d); else run.addPettyPurchase(S.token,d);
}
function addCategory(){
  modal(mhead('تصنيف جديد','')
    + fld('اسم التصنيف','<input id="newCat" placeholder="مثال: حلويات">')
    + macts('إضافة','saveCategory()'), true);
}
function saveCategory(){
  var x = v('newCat').trim();
  if (!x) return toast('اكتب اسم التصنيف','err');
  var cats = (S.data.settings.purchaseCategories||[]).slice();
  var exists = cats.some(function(c){ return c.toLowerCase() === x.toLowerCase(); });
  if (exists) return toast('التصنيف موجود مسبقاً','err');
  cats.push(x);
  busy(true,'جاري الحفظ…');
  // بعد الحفظ نعيد فتح نافذة الشراء بالقائمة المحدّثة
  srv(function(r){ after(r); closeModal(); openPurchase(); }, failBusy).savePurchaseCategories(S.token, cats, S.month);
}
function delPurchase(id){
  confirm2('حذف العملية؟','ستُنقل إلى سلة المحذوفات ويمكنك استعادتها.', function(){
    busy(true,'جاري الحذف…'); srv(after, failBusy).deletePettyPurchase(S.token,id,S.month);
  });
}

/* ============================================================ 6) الادخار ============================================================ */
function loadReserves(){
  srv(okOrFail('reserves', function(r){ S.reserves = r; if (S.view==='savings') render(); }), loadFail('reserves'))
    .getReserves(S.token);
}
/** مبالغ تُقتطع شهرياً من مصدر أو أكثر حتى يحين التزام قادم. */
function reservesPanel(){
  var r = S.reserves;
  if (!r) return S.errs.reserves ? waitOrErr('reserves','', 'loadReserves()') : '';
  return panel('التجنيب للالتزامات القادمة',
      r.length ? money(r.reduce(function(t,x){ return t + x.monthly; },0)) + ' شهرياً · تُخصم من متبقيك الآمن' : '',
      r.length ? r.map(function(x){
        var pct = Math.round(x.progress * 100);
        return '<div class="goal"><div class="phead" style="margin:0"><div><strong>'+esc(x.name)+'</strong>'
          + '<div class="sub">'+(x.obligationName?'لـ«'+esc(x.obligationName)+'» · ':'')
          + (x.dueDate?'قبل '+x.dueDate:'بلا موعد')+(x.cyclesLeft?' · بقي '+x.cyclesLeft+' دورة':'')+'</div></div>'
          + '<button class="btn btn-sm no" onclick="delReserve(\''+x.id+'\',\''+attrJs(x.name)+'\')">إلغاء</button></div>'
          + '<div class="bar '+(pct>=100?'g':'')+'" style="margin:9px 0"><i style="width:'+Math.min(100,pct)+'%"></i></div>'
          + '<div class="src-foot"><span>جُنِّب فعلاً '+money(x.accumulated)+' من '+money(x.target)+'</span>'
          + '<span class="'+(x.shortfall?'red':'green')+'">'+(x.shortfall?'ينقص '+money(x.shortfall)+' عند الاستحقاق':'يكتمل في موعده')+'</span></div>'
          + (x.behind ? '<div class="note n-red" style="margin-top:8px">متأخر '+money(x.behind)+' عن الخطة — دورات فائتة لم تُسجِّل فيها تجنيباً.</div>' : '')
          + '<div class="acts" style="margin-top:9px">'
          + (x.depositedThisCycle
             ? '<span class="green" style="font-size:13px;font-weight:800">✓ جنّبت هذه الدورة '+money(x.thisCycleAmount)+'</span>'
               + '<button class="btn btn-sm" onclick="rsvDeposit(\''+x.id+'\',\''+attrJs(x.name)+'\','+x.thisCycleAmount+')">تعديل</button>'
             : '<button class="btn btn-sm ok" onclick="rsvDeposit(\''+x.id+'\',\''+attrJs(x.name)+'\','+x.monthly+')">جنّبت هذه الدورة</button>'
               + '<span class="mut" style="font-size:12px">المخطط '+money(x.monthly)+'</span>')
          + '</div>'
          + '<div class="hint">'+x.contributions.map(function(c){ return esc(c.sourceName)+' '+money(c.monthly); }).join(' + ')+' شهرياً</div>'
          + '</div>';
      }).join('')
      : '<div class="empty">لا يوجد تجنيب. اطلبه من المستشار: «جنّب لي للتأمين 1200 بعد 3 شهور من الراتب والضمان».</div>',
      '<button class="btn btn-sm" onclick="go(\'advisor\')">اطلب من المستشار</button>');
}
/** التسجيل الفعلي: بدونه يفترض التطبيق أن المال جُنِّب وقد لا يكون كذلك. */
function rsvDeposit(id, name, amount){
  modal(mhead('تجنيب «'+name+'»', 'دورة '+monthName(currentCycle()))
    + fld('كم جنّبت هذه الدورة؟','<input id="rsvAmt" type="number" min="0" value="'+amount+'" onkeydown="if(event.key===\'Enter\')rsvGo(\''+id+'\')">',
          'اكتب ما نقلته فعلاً إلى حساب الادخار أو وضعته جانباً. صفر يلغي تسجيل هذه الدورة.')
    + macts('تسجيل', "rsvGo('"+id+"')"), true);
  setTimeout(function(){ var e = el('rsvAmt'); if (e){ e.focus(); e.select(); } }, 30);
}
function rsvGo(id){
  var a = +v('rsvAmt') || 0;
  busy(true,'جاري التسجيل…');
  srv(function(r){ closeModal(); S.reserves = null; S.pload = null; after(r); loadReserves(); }, failBusy)
    .reserveDeposit(S.token, id, currentCycle(), a);
}
function delReserve(id, name){
  confirm2('إلغاء تجنيب «'+name+'»؟','يتوقف الاقتطاع الشهري ويعود المبلغ لمتبقيك الآمن.', function(){
    busy(true,'جاري الإلغاء…');
    srv(function(r){ S.reserves = null; after(r); loadReserves(); }, failBusy).deleteReserve(S.token, id, S.month);
  });
}

function pSavings(){
  var s = S.data.summary, goals = S.data.savings;
  return kpis([
      ['المتبقي بعد كل شيء', money(s.remaining), s.remaining>=0?'green':'red','قبل الاحتياطي'],
      ['الاحتياطي', money(s.buffer), 'blue','حد أمان شهري'],
      ['المتبقي الآمن', money(s.safeRemaining), 'gold','أساس حساب الادخار'],
      ['الادخار المقترح', money(s.suggestedSaving), 'purple', s.savingsRate+'%'],
      ['أُدخر هذا الشهر', money(s.savingsDeposited), 'green', goals.length+' هدف']
    ])
    + '<div class="note n-gold">المعادلة: (الرصيد المرحّل + الدخل − الالتزامات − المشتريات المحجوزة − الاحتياطي) × نسبة الادخار. الدخل الإضافي لا يدخل في الخطة تلقائياً.</div>'
    + reservesPanel()
    + panel('الأهداف','', goals.length ? '<div class="srcs">'+goals.map(savingCard).join('')+'</div>' : '<div class="empty">أضف أول هدف ادخاري.</div>',
        '<button class="btn" onclick="openCalc()">حاسبة الادخار</button>');
}
function savingCard(g){
  var rem = Math.max(0, g.target - g.saved);
  var pct = g.target ? Math.min(100, g.saved/g.target*100) : 0;
  var eta = g.monthly > 0 ? Math.ceil(rem/g.monthly) : null;
  return '<div class="src">'
    + '<div class="src-top"><div class="src-name">'+esc(g.name)+'</div><div class="src-amt purple">'+Math.round(pct)+'%</div></div>'
    + '<div class="minis">'
    +   '<div class="mini"><small>المدخر</small><strong class="green">'+money(g.saved)+'</strong></div>'
    +   '<div class="mini"><small>المتبقي</small><strong>'+money(rem)+'</strong></div>'
    +   '<div class="mini"><small>المستهدف</small><strong>'+money(g.target)+'</strong></div>'
    + '</div>'
    + '<div class="bar p"><i style="width:'+pct+'%"></i></div>'
    + '<div class="src-foot"><span>'+(g.monthly ? money(g.monthly)+' شهرياً' : 'لم تحدد مساهمة')+'</span>'
    +   '<span>'+(g.saved>=g.target ? 'مكتمل' : eta ? eta+' شهر تقريباً' : '—')+'</span></div>'
    + (g.targetDate ? '<div class="hint">موعد الهدف: '+g.targetDate+'</div>' : '')
    + (g.sourceId ? '<div class="hint">مربوط بـ '+esc(srcName(g.sourceId))+'</div>' : '')
    + '<div class="acts" style="margin-top:12px;justify-content:flex-start">'
    +   '<button class="btn btn-sm ok" onclick="openAddSaving(\''+g.id+'\')">إضافة مبلغ</button>'
    +   '<button class="btn btn-sm" onclick="openSaving(\''+g.id+'\')">تعديل</button>'
    +   '<button class="btn btn-sm no" onclick="delSaving(\''+g.id+'\')">حذف</button></div></div>';
}
function openSaving(id){
  var g = id ? find(S.data.savings,id) : null;
  modal(mhead(g?'تعديل الهدف':'هدف ادخاري جديد','')
    + '<div class="form-grid">'
    + fld('اسم الهدف *','<input id="gName" value="'+attr(g&&g.name)+'" placeholder="طوارئ، سفر، سيارة…">')
    + fld('المبلغ المستهدف','<input id="gTarget" type="number" min="0" value="'+(g?g.target:'')+'">')
    + fld('المدخر حالياً','<input id="gSaved" type="number" min="0" value="'+(g?g.saved:0)+'">')
    + fld('المساهمة الشهرية','<input id="gMonthly" type="number" min="0" value="'+(g?g.monthly:'')+'">')
    + fld('موعد الهدف','<input id="gDate" type="date" value="'+(g&&g.targetDate?g.targetDate:'')+'">')
    + fldFull('يُدخَّر من مصدر','<select id="gSource"><option value="">— بالتناسب من كل المصادر —</option>'
        + S.data.incomes.filter(function(i){ return i.isBasic; }).map(function(i){
            return '<option value="'+i.id+'"'+(g&&g.sourceId===i.id?' selected':'')+'>'+esc(i.name)+'</option>'; }).join('')
        + '</select>', 'عند الربط تُحمَّل مساهمته الشهرية على هذا المصدر وحده في حساب الفائض.')
    + fldFull('ملاحظات','<textarea id="gNotes">'+esc(g&&g.notes)+'</textarea>')
    + '</div>' + macts('حفظ', "saveSaving('"+(id||'')+"')"));
}
function saveSaving(id){
  var d = { name:v('gName').trim(), target:+v('gTarget')||0, saved:+v('gSaved')||0,
            monthly:+v('gMonthly')||0, targetDate:v('gDate'), notes:v('gNotes'),
            sourceId:v('gSource'), month:S.month };
  if (!d.name) return toast('أدخل اسم الهدف','err');
  busy(true,'جاري الحفظ…');
  var run = srv(function(r){ closeModal(); after(r); }, failBusy);
  if (id) run.updateSavingsGoal(S.token,id,d); else run.addSavingsGoal(S.token,d);
}
function openAddSaving(id){
  var g = find(S.data.savings,id);
  modal(mhead('إضافة مبلغ للادخار', esc(g.name))
    + fld('المبلغ','<input id="addAmt" type="number" min="1" placeholder="مثال: 500">')
    + macts('إضافة', "submitAddSaving('"+id+"')"), true);
}
function submitAddSaving(id){
  var a = +v('addAmt')||0;
  if (a <= 0) return toast('أدخل مبلغاً صحيحاً','err');
  busy(true,'جاري التحديث…');
  srv(function(r){ closeModal(); after(r); }, failBusy).addAmountToSaving(S.token,id,a,S.month);
}
function delSaving(id){
  confirm2('حذف الهدف؟','سيُنقل إلى سلة المحذوفات.', function(){
    busy(true,'جاري الحذف…'); srv(after, failBusy).deleteSavingsGoal(S.token,id,S.month);
  });
}
function openCalc(){
  var s = S.data.summary;
  modal(mhead('حاسبة الادخار','المتاح الآمن حالياً: '+money(s.safeRemaining)+' شهرياً')
    + '<div class="form-grid">'
    + fld('المبلغ المستهدف','<input id="cTarget" type="number" min="0" oninput="runCalc()">')
    + fld('المدخر حالياً','<input id="cSaved" type="number" min="0" value="0" oninput="runCalc()">')
    + fld('المساهمة الشهرية','<input id="cMonthly" type="number" min="0" oninput="runCalc()">')
    + fld('أو المدة بالأشهر','<input id="cMonths" type="number" min="1" oninput="runCalcMonths()">')
    + '</div><div id="calcOut" class="note n-blue" style="margin-top:14px">أدخل الهدف ثم المساهمة أو المدة.</div>'
    + '<div class="macts"><button class="btn wide" onclick="closeModal()">إغلاق</button></div>');
}
function runCalc(){
  var safe = S.data.summary.safeRemaining;
  var t=+v('cTarget')||0, sv=+v('cSaved')||0, mo=+v('cMonthly')||0, out=el('calcOut');
  if (!t || !mo){ out.className='note n-blue'; out.textContent='أدخل الهدف والمساهمة الشهرية.'; return; }
  var rem = Math.max(0, t-sv);
  if (!rem){ out.className='note n-green'; out.textContent='الهدف مكتمل بالفعل.'; return; }
  if (mo > safe){ out.className='note n-red'; out.textContent='المساهمة '+money(mo)+' أعلى من المتاح الآمن '+money(safe)+'.'; return; }
  var m = Math.ceil(rem/mo), y = Math.floor(m/12), r = m%12;
  out.className='note n-green';
  out.innerHTML='<strong style="font-size:19px">'+(y ? y+' سنة'+(r?' و'+r+' شهر':'') : m+' شهر')+'</strong><br>يبقى لديك '+money(safe-mo)+' شهرياً بعد الادخار.';
}
function runCalcMonths(){
  var safe = S.data.summary.safeRemaining;
  var t=+v('cTarget')||0, sv=+v('cSaved')||0, m=+v('cMonths')||0, out=el('calcOut');
  if (!t || !m){ out.className='note n-blue'; out.textContent='أدخل الهدف والمدة.'; return; }
  var rem = Math.max(0, t-sv);
  if (!rem){ out.className='note n-green'; out.textContent='الهدف مكتمل بالفعل.'; return; }
  if (safe <= 0){ out.className='note n-red'; out.textContent='لا يوجد متاح آمن للادخار بعد الالتزامات والاحتياطي.'; return; }
  var need = Math.ceil(rem/m);
  if (need > safe){
    out.className='note n-red';
    out.innerHTML='تحتاج '+money(need)+' شهرياً والمتاح '+money(safe)+'. بكامل المتاح الآمن تحتاج '+Math.ceil(rem/safe)+' شهر.';
  } else {
    out.className='note n-green';
    out.innerHTML='<strong style="font-size:19px">'+money(need)+' شهرياً</strong><br>يبقى لديك '+money(safe-need)+' بعدها.';
  }
}

/* ============================================================ 7) التقارير ============================================================ */
function loadTrend(){
  srv(function(r){ if (r && !r.error){ S.trend = r; if (S.view==='reports') render(); } },
      failBusy).getMonthlyTrend(S.token, S.trendRange);
}
function setRange(n){ S.trendRange = n; S.trend = null; render(); loadTrend(); }
function pReports(){
  var t = S.trend, s = S.data.summary;
  if (!t) return '<div class="panel"><div class="empty">جاري حساب الاتجاه…</div></div>';
  var max = 1;
  t.series.forEach(function(x){ max = Math.max(max, x.income, x.obligations); });
  var d = t.delta;
  var arrow = function(n, goodDown){
    if (!n) return '<span class="mut">بلا تغيير</span>';
    var up = n > 0, good = goodDown ? !up : up;
    return '<span class="'+(good?'green':'red')+'">'+(up?'▲ ':'▼ ')+money(Math.abs(n))+'</span>';
  };

  return kpis([
      ['الرصيد المرحّل', money(s.opening), 'blue', ''],
      ['الدخل المحقق', money(s.incomeRealized), 'green', 'من '+money(s.incomeExpected)+' متوقع'],
      ['الالتزامات المسددة', money(s.paidObligations), 'gold', 'من '+money(s.plannedObligations)],
      ['المشتريات', money(s.purchasesSpent), 'orange', ''],
      ['الرصيد الختامي', money(s.closing), s.closing>=0?'green':'red', s.closed?'الشهر مُقفل':'غير مُقفل']
    ])
    + '<div class="note n-blue">مقارنة بمتوسط آخر 3 أشهر — الالتزامات '+arrow(d.obligations,true)
    +   ' · المشتريات '+arrow(d.purchases,true)+' · الادخار '+arrow(d.savings,false)+'</div>'
    + '<div class="g2">'
    + panel('اتجاه الأشهر','الدخل مقابل الالتزامات',
        '<div class="trend">' + t.series.map(function(x){
            var h1 = Math.max(4, x.income/max*100), h2 = Math.max(4, x.obligations/max*100);
            return '<div class="tb" title="'+x.month+'"><div class="pair">'
              + '<i style="height:'+h1+'%;background:var(--green)"></i>'
              + '<i style="height:'+h2+'%;background:var(--accent)"></i></div>'
              + '<small>'+x.month.slice(5)+'</small></div>';
          }).join('') + '</div>'
        + '<div style="display:flex;gap:18px;margin-top:12px;font-size:13px;color:var(--soft)">'
        +   '<span><i class="dot g"></i> الدخل</span><span><i class="dot"></i> الالتزامات</span></div>')
    + panel('المشتريات حسب التصنيف','عبر الأشهر المعروضة',
        t.categoryBreakdown.length
        ? '<div class="rows">'+t.categoryBreakdown.slice(0,8).map(function(c){
            var mx = t.categoryBreakdown[0].amount || 1;
            return '<div class="crow"><div class="cl">'+esc(c.category)+'</div>'
              + '<div class="bar"><i style="width:'+(c.amount/mx*100)+'%"></i></div>'
              + '<div class="cv">'+money(c.amount)+'</div></div>';
          }).join('')+'</div>'
        : '<div class="empty">لا توجد مشتريات مسجلة.</div>')
    + '</div>'
    + panel('الالتزامات حسب التصنيف', monthName(S.month),
        (t.obligationCategories && t.obligationCategories.length)
        ? '<div class="rows">'+t.obligationCategories.map(function(c){
            var mx = t.obligationCategories[0].amount || 1;
            return '<div class="crow"><div class="cl">'+esc(c.category)+'</div>'
              + '<div class="bar"><i style="width:'+(c.amount/mx*100)+'%"></i></div>'
              + '<div class="cv">'+money(c.amount)+'</div></div>';
          }).join('')+'</div>'
        : '<div class="empty">لا توجد التزامات مصنَّفة.</div>')
    + panel('جدول الأشهر','',
        '<div class="tw"><table><thead><tr><th>الشهر</th><th>الدخل</th><th>المحقق</th><th>الالتزامات</th><th>المسدَّد</th><th>المشتريات</th><th>الادخار</th><th>الختامي</th></tr></thead><tbody>'
        + t.series.slice().reverse().map(function(x){
            return '<tr><td><strong>'+x.month+'</strong>'+(x.closed?'<span class="sub green">مُقفل</span>':'')+'</td>'
              + '<td>'+money(x.income)+'</td><td class="green">'+money(x.incomeRealized)+'</td>'
              + '<td>'+money(x.obligations)+'</td><td>'+money(x.paid)+'</td>'
              + '<td class="orange">'+money(x.purchases)+'</td><td class="purple">'+money(x.savings)+'</td>'
              + '<td class="'+(x.closing>=0?'green':'red')+'"><strong>'+money(x.closing)+'</strong></td></tr>';
          }).join('') + '</tbody></table></div>',
        '<div class="acts">'
        + [3,6,12].map(function(n){
            return '<button class="chip '+(S.trendRange===n?'on':'')+'" onclick="setRange('+n+')">'+n+' أشهر</button>'; }).join('')
        + '<button class="btn btn-sm" onclick="exportPdf()">تصدير PDF</button></div>');
}
function exportCsv(kind){
  busy(true,'جاري التصدير…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر التصدير','err');
    toast('صُدِّر '+r.rows+' سطراً — يُحفظ على جهازك الآن','ok');
    downloadAppFile(r.url);
  }, failBusy).exportCsv(S.token, kind, S.month);
}
function exportPdf(){
  busy(true,'جاري إنشاء التقرير…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر التصدير','err');
    toast('التقرير جاهز — افتحه لتطبعه كـ PDF','ok');
    downloadAppFile(r.url);
  }, failBusy).exportMonthlyReport(S.token, S.month);
}

/* ============================================================ 8) ماذا لو ============================================================ */
function pWhatIf(){
  var sm = S.data.summary;
  if (!S.simItems.length) S.simItems = [{kind:'loan',amount:'',months:24,day:1,label:''}];
  return '<div class="note n-blue">جرّب قراراً واحداً أو عدة قرارات معاً — قسط وسفر وزيادة دخل في آنٍ واحد. '
    + 'النتيجة تشمل أثرها على <strong>رصيدك اليومي</strong> لا على المجموع الشهري فقط.</div>'
    + '<div class="g2">'
    + '<div class="panel"><div class="phead"><div><h3>القرارات</h3><div class="sub">أضف ما شئت</div></div>'
    +   '<button class="btn btn-sm" onclick="simAdd()">＋ قرار</button></div>'
    +   '<div id="simList"></div>'
    +   '<button class="btn-main wide" style="margin-top:10px" onclick="runMulti()">احسب الأثر</button>'
    +   '<button class="btn wide" style="margin-top:8px" onclick="aiReview()">ناقش القرار مع المستشار</button>'
    + '</div>'
    + '<div class="panel" id="simOut"><div class="phead"><h3>النتيجة</h3></div>'
    +   '<div class="stats4">'+stat('المتبقي الحالي', money(sm.remaining))+stat('المتبقي الآمن', money(sm.safeRemaining))+'</div>'
    +   '<div class="empty">أضف قراراتك واضغط «احسب الأثر».</div></div>'
    + '</div>';
}
function simRender(){
  var box = el('simList'); if (!box) return;
  box.innerHTML = S.simItems.map(function(x,i){
    return '<div class="simrow">'
      + '<select onchange="simSet('+i+',\'kind\',this.value)">'
      +   ['loan|قسط شهري','expense|مصروف','income|دخل إضافي','saving|ادخار'].map(function(o){
            var p=o.split('|'); return '<option value="'+p[0]+'"'+(x.kind===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join('')
      + '</select>'
      + '<input type="text" placeholder="الوصف" value="'+attr(x.label)+'" oninput="simSet('+i+',\'label\',this.value)">'
      + '<input type="number" min="0" placeholder="المبلغ" value="'+attr(x.amount)+'" oninput="simSet('+i+',\'amount\',this.value)">'
      + '<input type="number" min="1" max="31" placeholder="اليوم" value="'+attr(x.day)+'" oninput="simSet('+i+',\'day\',this.value)">'
      + '<button class="btn btn-sm no" onclick="simDel('+i+')">حذف</button></div>';
  }).join('');
}
function simAdd(){ S.simItems.push({kind:'expense',amount:'',months:1,day:1,label:''}); simRender(); }
function simDel(i){ S.simItems.splice(i,1); if(!S.simItems.length) simAdd(); else simRender(); }
function simSet(i,k,v){ S.simItems[i][k] = v; }
function aiReview(){
  var first = S.simItems.filter(function(x){ return (+x.amount||0) > 0; })[0];
  if (!first) return toast('أدخل مبلغاً أولاً','err');
  busy(true,'المستشار يدرس القرار…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذرت المراجعة','err');
    modal(mhead('رأي المستشار', esc(first.label||'القرار')+' — '+money(+first.amount||0))
      + '<div class="ai-ans">'+esc(r.answer)+'</div>'
      + '<div class="macts"><button class="btn wide" onclick="closeModal()">إغلاق</button></div>');
    S.ai.history = null;
  }, failBusy).aiReviewDecision(S.token, S.month, {
    kind:first.kind, amount:+first.amount||0, months:+first.months||1,
    day:+first.day||1, label:first.label||'' });
}
function runMulti(){
  var items = S.simItems.filter(function(x){ return (+x.amount||0) > 0; })
    .map(function(x){ return { kind:x.kind, amount:+x.amount||0, months:+x.months||1,
                               day:+x.day||1, label:x.label||'' }; });
  if (!items.length) return toast('أدخل مبلغاً في قرار واحد على الأقل','err');
  busy(true,'جاري المحاكاة…');
  srv(function(r){
    busy(false);
    if (!r || r.error || !r.before || !r.after) return toast((r&&r.error)||'تعذرت المحاكاة','err');
    var box = el('simOut');
    if (!box) return;   // غادر المستخدم الصفحة قبل وصول النتيجة
    var cls = !r.feasible ? 'n-red' : (r.after.safeRemaining>0 ? 'n-green' : 'n-gold');
    box.innerHTML = '<div class="phead"><h3>النتيجة</h3><div class="sub">'+monthName(r.month)+'</div></div>'
      + '<div class="note '+cls+'">'+esc(r.verdict)+'</div>'
      + '<div class="stats4">'
      +   stat('المتبقي قبل', money(r.before.remaining)) + stat('المتبقي بعد', money(r.after.remaining))
      +   stat('أدنى رصيد قبل', money(r.before.minBalance)) + stat('أدنى رصيد بعد', money(r.after.minBalance))
      + '</div>'
      + (r.firstNegative
          ? '<div class="note n-red" style="margin-top:12px">رصيدك يسلب يوم <strong>'+r.firstNegative.date+'</strong> '
            + 'ويصل '+money(r.firstNegative.balance)+'.</div>'
          : '')
      + '<div class="note n-blue" style="margin-top:12px">الأثر الشهري الصافي: <strong>'+money(r.totalMonthlyEffect)
      + '</strong> · التكلفة الإجمالية: <strong>'+money(r.totalCost)+'</strong></div>'
      + (r.goals.length
          ? '<div class="tw" style="margin-top:12px"><table style="min-width:460px"><thead><tr><th class="s">الهدف</th>'
            + '<th>قبل</th><th>بعد</th><th>التأخير</th></tr></thead><tbody>'
            + r.goals.map(function(g){
                return '<tr><td class="s">'+esc(g.name)+'</td>'
                  + '<td>'+(g.etaBefore===null?'—':g.etaBefore+' شهر')+'</td>'
                  + '<td>'+(g.atRisk?'<span class="red">متعذر</span>':g.etaAfter===null?'—':g.etaAfter+' شهر')+'</td>'
                  + '<td class="'+(g.delayMonths>0?'red':'green')+'">'
                  +   (g.delayMonths===null?'—':(g.delayMonths>0?'+'+g.delayMonths+' شهر':'بلا تأخير'))+'</td></tr>';
              }).join('') + '</tbody></table></div>'
          : '');
  }, failBusy).simulateMulti(S.token, S.month, items);
}


/* ============================================================ المستشار المالي ============================================================ */
function loadAiStatus(){
  srv(function(r){ if (r && !r.error){ S.ai.status = r; if (S.view==='advisor'||S.view==='settings') render(); } }, failBusy)
    .getAiStatus(S.token);
}
function loadDataQuality(){
  srv(function(r){ if (r && !r.error){ S.ai.quality = r; if (S.view==='advisor') render(); } }, failBusy)
    .getDataQuality(S.token, S.month);
}
function loadAiHistory(){
  srv(function(r){ if (r && r.length !== undefined){ S.ai.history = r; if (S.view==='advisor') render(); } }, failBusy)
    .getAiHistory(S.token, 20);
}
function pAdvisor(){
  var st = S.ai.status;
  if (st && !st.hasKey){
    return '<div class="panel"><div class="phead"><h3>المستشار غير مفعّل</h3></div>'
      + '<div class="note n-gold">أضف مفتاح كلود من <strong>الإعدادات ← المستشار الذكي</strong> لتفعيله.<br>'
      + 'أنشئه من console.anthropic.com — لا تشاركه مع أحد.</div>'
      + '<button class="btn-main wide" onclick="go(\'settings\')">اذهب للإعدادات</button></div>';
  }
  var last = S.ai.last;
  return '<div class="note n-blue">المستشار يرى <strong>الصورة كاملة</strong> لا الدورة الحالية وحدها: '
    + 'كل التزاماتك المعرّفة، والدورات الست القادمة بالتفصيل، وضغط كل راتب في 12 دورة، والدورات الثلاث السابقة، '
    + 'وآخر عمليات السداد، والتجنيب، والديون، والتدفق اليومي، والمشتريات، والإعدادات — ويتذكر محادثاتكم.</div>'

    + '<div class="panel"><div class="phead"><div><h3>اسأل مستشارك</h3>'
    +   '<div class="sub">أي سؤال مالي — سيجيب بأرقامك أنت</div></div></div>'
    + '<div class="ai-chips">'
    +   [['حلّل وضعي كاملاً','aiRun(\'analyze\')'],
         ['وزّع التزاماتي على رواتبي','aiAllocOpen(\'unassigned\')'],
         ['قسّم مصروفاتي المرنة لفترات',"el('aiQ').value='قسّم التزاماتي المرنة الكبيرة (مقاضي، مصروف بيت…) إلى فترات حسب مواعيد نزول دخلي، كل فترة من مصدرها';aiSend()"],
         ['حلّل عاداتي في الصرف','aiRun(\'patterns\')'],
         ['اكتب تقرير الدورة','aiRun(\'report\')']]
        .map(function(x){ return '<button class="chip" onclick="'+x[1]+'">'+x[0]+'</button>'; }).join('')
    + '</div>'
    + '<div class="ai-q"><textarea id="aiQ" placeholder="اسأل أو اطلب: أقدر آخذ قسط 800؟ · جنّب لي للتأمين 1200 بعد 3 شهور · اربط الالتزامات غير المربوطة · سجّل إني سدّدت الإيجار"></textarea>'
    +   '<button class="btn-main" onclick="aiSend()">اسأل</button></div>'
    + '<div class="hint">اضغط Ctrl+Enter للإرسال السريع.</div>'
    + (last ? '<div class="ai-ans" style="margin-top:14px">'+esc(last.answer)+'</div>' : '')
    + agentPanel()
    + batchPanel()
    + '</div>'

    + (S.ai.quality
        ? panel('جودة بياناتك','ما يعتمد عليه المستشار في الحكم',
            '<div class="stats4">'
            + stat('التقييم', S.ai.quality.level)
            + stat('الدرجة', S.ai.quality.score + '/100')
            + '</div>'
            + '<div class="note n-'+(S.ai.quality.score>=80?'green':S.ai.quality.score>=55?'gold':'red')
              +'" style="margin-top:12px">'+esc(S.ai.quality.confidence)+'</div>'
            + (S.ai.quality.issues.length
               ? '<div class="hint">ما ينقص: '+S.ai.quality.issues.map(esc).join(' · ')+'</div>' : ''))
        : '')
    + panel('سجل المستشار','ما سألته وما أجابك — وهو يتذكره في إجاباته القادمة',
        !S.ai.history ? '<div class="empty">جاري التحميل…</div>'
        : !S.ai.history.length ? '<div class="empty">لم تسأل بعد. ابدأ بـ «حلّل وضعي كاملاً».</div>'
        : S.ai.history.map(function(t){
            return '<div class="ai-turn"><div class="qq">'+esc(t.question)+'</div>'
              + '<div class="aa">'+esc(t.answer)+'</div>'
              + (t.userNote ? '<div class="ai-note">ملاحظتك: '+esc(t.userNote)+'</div>' : '')
              + '<div class="mt"><span>'+esc(t.at)+' · '+esc(t.kind)+'</span>'
              + '<button class="btn btn-sm" onclick="aiNote(\''+t.id+'\')">'
              + (t.userNote?'عدّل ما حدث':'سجّل ما حدث')+'</button></div></div>';
          }).join(''),
        '<button class="btn btn-sm no" onclick="aiClearHistory()">مسح الذاكرة</button>');
}
function aiRun(kind){
  var map = { analyze:['aiAnalyze','جاري التحليل الشامل…'], plan:['aiAllocationPlan','جاري بناء الخطة…'],
              patterns:['aiPatterns','جاري تحليل عاداتك…'], report:['aiMonthlyReport','جاري كتابة التقرير…'] };
  var c = map[kind]; if (!c) return;
  busy(true, c[1]);
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر التحليل','err');
    S.ai.last = r; S.ai.history = null; render(); loadAiHistory();
  }, failBusy)[c[0]](S.token, S.month);
}
function aiSend(){
  var q = v('aiQ').trim();
  if (!q) return toast('اكتب سؤالك','err');
  busy(true,'المستشار يقرأ وضعك كاملاً…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر الرد','err');
    // الإجراءات عالية الخطورة (سداد، حذف) لا تُحدَّد افتراضياً — تحتاج اختيارك الصريح
    r.actions.forEach(function(a){ a.checked = a.valid && a.risk !== 'high'; });
    S.ai.plan = r; S.ai.last = { answer: r.reply }; S.ai.history = null;
    render(); loadAiHistory();
  }, failBusy).aiAgent(S.token, currentCycle(), q);
}
/* ---------- التراجع عن آخر تنفيذ للمستشار ---------- */
function loadLastBatch(){
  srv(function(r){ S.ai.batch = r || null; S.ai.batchLoaded = true; if (S.view==='advisor') render(); }, loadFail('batch'))
    .getLastAgentBatch(S.token);
}
function batchPanel(){
  var b = S.ai.batch;
  if (!b) return '';
  return '<div class="note n-blue" style="margin-top:14px;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">'
    + '<span>آخر تنفيذ للمستشار ('+esc(b.at)+'): '+esc(b.summary||'')+' · '+b.changes+' تغيير</span>'
    + '<button class="btn btn-sm no" onclick="undoBatch(\''+b.id+'\')">تراجع عنه كاملاً</button></div>';
}
function undoBatch(id){
  confirm2('التراجع عن تنفيذ المستشار؟',
    'يعود كل ما غيّره هذا التنفيذ لحالته قبله.\nإن كنت عدّلت شيئاً منه يدوياً بعدها، يتوقف التراجع ولا يمسح تعديلك.', function(){
      busy(true,'جاري التراجع…');
      srv(function(r){
        S.ai.batch = null; S.allObs = null; S.payr.data = null; S.reserves = null; S.pload = null; S.forecast = null;
        after(r); loadLastBatch();
      }, failBusy).agentUndo(S.token, id);
    });
}

/* ---------- إجراءات المستشار: معاينة، اختيار، ثم تنفيذ بموافقتك ---------- */
var RISK = { low:['آمن','green'], medium:['يغيّر بيانات','gold'], high:['حساس','red'] };
function agentPanel(){
  var p = S.ai.plan;
  if (!p || !p.actions.length) return '';
  var sel = p.actions.filter(function(a){ return a.checked; }).length;
  return '<div class="agent">'
    + '<div class="phead" style="margin-top:14px"><div><h3>إجراءات مقترحة</h3>'
    +   '<div class="sub">لن يُنفَّذ شيء حتى توافق. الحساس (سداد، حذف) غير محدد افتراضياً.</div></div></div>'
    + p.actions.map(function(a, i){
        var rk = RISK[a.risk] || RISK.medium;
        return '<label class="act '+(a.valid?'':'bad')+' r-'+a.risk+'">'
          + '<input type="checkbox" '+(a.checked?'checked':'')+(a.valid?'':' disabled')
          +   ' onchange="S.ai.plan.actions['+i+'].checked=this.checked;render()">'
          + '<div class="ab"><div class="at">'+esc(a.label)+' '+tag(rk[0], rk[1])+'</div>'
          + '<div class="ap">'+esc(a.preview||'')+'</div>'
          + (a.why ? '<div class="aw">'+esc(a.why)+'</div>' : '')
          + (a.warnings && a.warnings.length ? '<div class="awarn">⚠ '+a.warnings.map(esc).join(' · ')+'</div>' : '')
          + (a.problems && a.problems.length ? '<div class="aerr">✕ لا يمكن تنفيذه: '+a.problems.map(esc).join(' · ')+'</div>' : '')
          + '</div></label>';
      }).join('')
    + '<div class="macts" style="margin-top:10px">'
    +   '<button class="btn-main" '+(sel?'':'disabled')+' onclick="agentRun()">نفّذ المحدد ('+sel+')</button>'
    +   '<button class="btn" onclick="S.ai.plan=null;render()">تجاهل</button></div>'
    + '</div>';
}
function agentRun(){
  var chosen = S.ai.plan.actions.filter(function(a){ return a.checked && a.valid; });
  if (!chosen.length) return;
  var risky = chosen.filter(function(a){ return a.risk === 'high'; });
  var go = function(){
    busy(true,'جاري التنفيذ…');
    srv(function(r){
      busy(false);
      if (!r || r.error) return toast((r&&r.error)||'تعذر التنفيذ','err');
      if (r.data){ S.data = r.data; S.month = r.data.month; }
      S.allObs = null; S.payr.data = null; S.debt = null; S.payoff = null; S.forecast = null; S.flow = null;
      S.reserves = null; S.pload = null; S.ai.history = null;
      S.ai.plan = null;
      S.ai.batch = r.batchId ? { id:r.batchId, changes:r.changes, summary:r.results.filter(function(x){return x.ok;}).map(function(x){return x.label;}).join('، '), at:'الآن' } : S.ai.batch;
      S.ai.last = { answer: r.message + '\n\n' + r.results.map(function(x){
        return (x.ok ? '✓ ' : '✕ ') + x.label + ' — ' + x.message; }).join('\n') };
      renderMonths(); render(); loadAiHistory();
      toast(r.message, r.success ? 'ok' : 'err');
    }, failBusy).aiExecute(S.token, S.ai.plan.month, chosen.map(function(a){
      return { type:a.type, params:a.params, why:a.why };
    }));
  };
  if (risky.length){
    confirm2('تأكيد إجراءات حساسة',
      'ستنفّذ: ' + risky.map(function(a){ return a.label + ' — ' + a.preview; }).join('\n') +
      '\n\nالحذف يُنقل لسلة المحذوفات 30 يوماً، والسداد يمكن التراجع عنه من صفحة السداد.', go);
  } else go();
}

function aiNote(id){
  modal(mhead('ماذا حدث بعد هذه النصيحة؟','يتذكرها المستشار ويحاسبك عليها لاحقاً')
    + fld('ملاحظتك','<input id="aiN" placeholder="مثال: أجّلت الشراء · نفّذت وتحسّن وضعي">')
    + macts('حفظ', "saveAiNote('"+id+"')"), true);
}
function saveAiNote(id){
  var n = v('aiN').trim();
  if (!n) return toast('اكتب ملاحظتك','err');
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); S.ai.history=null; after(r); loadAiHistory(); }, failBusy)
    .addAiNote(S.token, id, n, S.month);
}
function aiClearHistory(){
  confirm2('مسح ذاكرة المستشار؟','سيفقد كل المحادثات السابقة ولن يتذكر نصائحه لك. لا يمكن التراجع.', function(){
    busy(true,'جاري المسح…');
    srv(function(r){ S.ai.history=null; S.ai.last=null; after(r); loadAiHistory(); }, failBusy)
      .clearAiHistory(S.token, S.month);
  });
}

/* ============================================================ دليل الاستخدام ============================================================ */
var GUIDE = [
  ['المفاهيم الخمسة','قبل الصفحات، افهم هذه وسيتضح الباقي',[
    ['الدورة المالية','فترتك المالية. إن ضبطت «يوم بداية الدورة» على 27 تصبح من 27 إلى 26، فيجتمع راتبك مع الالتزامات التي يغطيها. القيمة 1 تعني الشهر الميلادي.'],
    ['نافذة البداية','تاريخ بدايتك بالتطبيق. لا يُحسب شيء قبله. لذلك قد يظهر مصدر بـ«قبل البداية»، ويعود تلقائياً في الدورة التالية.'],
    ['مؤكد مقابل متوقع','المتوقع شيء لم يقع بعد — يُحجز مبلغه، وإن لم يحدث تضغط «لم يتحقق» فيُحرَّر.'],
    ['خصم تلقائي','ما يقتطعه البنك من راتبك. يُعتبر مسدَّداً بمرور تاريخه بلا تأكيد منك.'],
    ['التدفق اليومي','رصيدك يوماً بيوم. المجموع الشهري قد يكون موجباً بينما ترسب يوم 12 — هذا ما يكشفه.']
  ]],
  ['لوحة القيادة','نظرة واحدة على دورتك',[
    ['البطاقات','الرصيد المرحّل، الدخل، الالتزامات، النثريات المحجوزة، المتبقي الآمن، الادخار المقترح.'],
    ['سطر التنبيهات','كل ما يحتاج انتباهك: التزام بلا مصدر، متأخرات، تجاوز سقف، دخل تأخر.'],
    ['أقرب الاستحقاقات','وفيها زر «سدّدت» مباشرة بلا تنقّل.']
  ]],
  ['مصادر الدخل','من أين يأتي مالك',[
    ['أساسي مقابل إضافي','الأساسي وحده يدخل الخطة. الإضافي يزيد سيولتك بعد نزوله فقط.'],
    ['ثابت مقابل متغير','الثابت يُحتسب نازلاً تلقائياً. المتغير تؤكّده وتكتب مبلغه الفعلي.'],
    ['«مربوط عليه»','مجموع الالتزامات على هذا المصدر — اضغطه لترى تفاصيلها.'],
    ['تحويلات بين المصادر','نقل مبلغ من مصدر لآخر داخل الدورة.']
  ]],
  ['إدارة الالتزامات','التعريف فقط — لا سداد هنا',[
    ['ماذا تفعل','تعرّف الالتزام: مبلغه، يوم استحقاقه، تكراره، فترته، تصنيفه، ومصادر سداده.'],
    ['حصتك %','للالتزام المشترك: 50 تعني أن نصفه عليك، وكل الحسابات تعتمد حصتك.'],
    ['معدل الفائدة','يُستخدم في ترتيب سداد الديون. صفر إن لم يكن قرضاً بفائدة.'],
    ['«اقترح للغير مربوط»','يقترح مصدراً لما تنقصه مصادر، ولا يمس ما ربطته بنفسك.'],
    ['«أعد توزيع الكل»','يتجاهل الربط الحالي ويعيد الحساب من الصفر.']
  ]],
  ['سجل السداد','التنفيذ فقط — لا تعديل هنا',[
    ['من / إلى','اختر أي فترة: يعرض كل ما استحق فيها، المسدَّد والمستحق، عبر أي عدد من الدورات. واختصارات جاهزة: الحالية، القادمة، آخر 3…'],
    ['السداد يُسجَّل في دورته','تسدّد من أي فترة، والتطبيق يقيّده في دورة استحقاقه تلقائياً.'],
    ['متأخرات سابقة','ما مضت دورته ولم يُسدَّد يظهر أعلى الصفحة مع زر «سدّدها».'],
    ['الترتيب','المتأخر أولاً ثم الجزئي ثم المعلّق، والمسدَّد في الأسفل دائماً.'],
    ['«تراجع»','يلغي السداد إن ضغطت بالخطأ. متاح دائماً.'],
    ['«كم سددت؟»','كل سداد يسألك المبلغ، معبّأً بالمستحق: Enter للثابت. أقل؟ تختار «الفعلي كامل» (فاتورة أقل) أو «جزئي». أعلى؟ يُسجَّل، ويمكنك تحديث الالتزام للقادم.']
  ]],
  ['المستشار المنفِّذ','يقترح وينفّذ — بموافقتك',[
    ['«تراجع عنه كاملاً»','آخر تنفيذ للمستشار يمكن إلغاؤه بضغطة، فيعود كل ما غيّره. ويتوقف إن عدّلت شيئاً منه يدوياً بعده.'],
    ['اطلب بلغتك','«جنّب للتأمين 1200 بعد 3 شهور» · «اربط غير المربوط» · «غيّر الإيجار لـ3200». أو اسأل سؤالاً فيجيب بلا إجراءات.'],
    ['بطاقات الإجراءات','كل إجراء يعرض ما سيتغير بالضبط وسببه. الحساس (سداد، حذف) غير محدد افتراضياً ويطلب تأكيداً.'],
    ['لا ينفّذ الخاطئ','المحرك يدقّق كل إجراء مرتين؛ غير الصالح يظهر معطّلاً بسببه.'],
    ['«✦ وزّع بذكاء»','في إدارة الالتزامات: كلود يقترح ربط كل التزام براتب، والمحرك يدقّق السعة والمواعيد عبر 12 دورة.']
  ]],
  ['التجنيب وضغط الرواتب','لا شهر يتكدّس عليه كل شيء',[
    ['التجنيب','مبلغ شهري من مصدر أو أكثر لالتزام قادم (تأمين سنوي مثلاً). يُخصم من المتبقي الآمن، ويدفع الالتزام عند حلوله بدل الراتب.'],
    ['«جنّبت هذه الدورة»','سجّل ما جنّبته فعلاً كل دورة. بدونه يُعتبر الشهر فائتاً، فيظهر التجنيب متأخراً وتنقص تغطية الالتزام — لا طمأنينة كاذبة.'],
    ['ضغط كل راتب','في «ما ينتظرك»: كل نزول راتب في 12 دورة وما يحمله. الأحمر يعجز — اضغط «اطلب العلاج من المستشار».']
  ]],
  ['التدفق اليومي','الموازنة الحقيقية',[
    ['منحنى الرصيد','كل عمود يوم. الأحمر تحت الصفر.'],
    ['أول يوم سالب','يخبرك بتاريخه وسببه بالضبط — أي بند أنزلك.'],
    ['تحليل الحساسية','ماذا لو تأخر دخلك 5 أيام أو نقص 20٪ أو انقطع مصدر كامل.']
  ]],
  ['ما ينتظرك','الدورات القادمة',[
    ['الرصيد التراكمي','فائض دورة ينتقل للتي بعدها، فترى متى ينقلب سالباً قبل أن يصل.'],
    ['«جنّب شهرياً»','كم تدّخر كل دورة حتى موعد البند.'],
    ['«تحقق» و«لم يتحقق»','تحسم مصير البند المتوقع.']
  ]],
  ['الديون والأقساط','ما له نهاية',[
    ['صندوق الطوارئ','كم شهراً تصمد لو انقطع دخلك، وكم ينقصك لتصل 3 أو 6 أشهر.'],
    ['ترتيب السداد','استراتيجيتان: الأعلى فائدة (يوفّر أكثر) والأقصر مدة (يحرّر التزاماً أسرع).'],
    ['العبء الشهري','السنوي مقسوم على 12 والأسبوعي مضروب في 4.3.']
  ]],
  ['المشتريات النثرية','مصروفك اليومي',[
    ['الإدخال السريع','مبلغ + تصنيف + Enter، والتركيز يعود لحقل المبلغ.'],
    ['«لصق رسائل البنك»','الصق رسالة أو عشرة فتُستخرج تلقائياً.'],
    ['«المصاريف المتكررة»','ما يتكرر شهرياً تعرّفه مرة ويُسجَّل تلقائياً.'],
    ['«سقوف التصنيفات»','سقف لكل تصنيف مع تنبيه عند التجاوز.']
  ]],
  ['أهداف الادخار','بعد تغطية كل شيء',[
    ['المتبقي الآمن','الدخل ناقص الالتزامات والنثريات والمتأخرات والاحتياطي.'],
    ['«يُدخَّر من مصدر»','عند الربط تُحمَّل مساهمته على ذلك المصدر وحده.']
  ]],
  ['التقارير','المقارنة عبر الدورات',[
    ['مدى العرض','3 أو 6 أو 12 دورة.'],
    ['«تصدير PDF»','تقرير الدورة كاملاً في Drive.']
  ]],
  ['محاكي ماذا لو','جرّب قبل أن تقرر',[
    ['قرارات مركّبة','أضف عدة قرارات معاً: قسط وسفر وزيادة دخل في آنٍ واحد.'],
    ['أدنى رصيد قبل وبعد','الأهم: هل يسلب رصيدك في يوم ما، لا هل يكفي المجموع الشهري.']
  ]],
  ['الإعدادات','ما يحكم كل الحسابات',[
    ['تاريخ بداية العمل','لا يُحسب شيء قبله.'],
    ['يوم بداية الدورة','غيّره قبل إدخال البيانات.'],
    ['احتياطي الأمان','مبلغ تحجزه ولا يُحسب ضمن المتاح للادخار.'],
    ['سقف المشتريات','يُحجز من المتبقي الآمن.'],
    ['إقفال الدورة','يثبّت الرصيد الختامي ويرحّله للدورة التالية.'],
    ['سلة المحذوفات','كل محذوف يبقى 30 يوماً.']
  ]]
];

function pGuide(){
  return '<div class="note n-blue">ابدأ بالمفاهيم الخمسة، ثم اقرأ الصفحة التي تستخدمها فقط.</div>'
    + GUIDE.map(function(sec){
        return panel(sec[0], sec[1],
          sec[2].map(function(row){
            return '<div style="padding:11px 0;border-bottom:1px solid var(--line)">'
              + '<strong style="display:block;margin-bottom:3px">'+esc(row[0])+'</strong>'
              + '<span class="mut" style="font-size:14px">'+esc(row[1])+'</span></div>';
          }).join(''));
      }).join('');
}

/* ============================================================ 9) الإعدادات ============================================================ */
function addObCat(){
  modal(mhead('تصنيف التزام جديد','')
    + fld('اسم التصنيف','<input id="newObCat" placeholder="مثال: تعليم">')
    + macts('إضافة','saveObCat()'), true);
}
function saveObCat(){
  var x = v('newObCat').trim();
  if (!x) return toast('اكتب اسم التصنيف','err');
  var c = (S.data.settings.obligationCategories||[]).slice();
  if (c.some(function(y){ return y.toLowerCase()===x.toLowerCase(); })) return toast('التصنيف موجود','err');
  c.push(x);
  busy(true,'جاري الحفظ…');
  srv(function(r){ closeModal(); after(r); }, failBusy).saveObligationCategories(S.token, c, S.month);
}
function delObCat(i){
  var c = (S.data.settings.obligationCategories||[]).slice();
  var name = c[i];
  var used = S.data.obligations.filter(function(o){ return o.category===name; }).length;
  confirm2('حذف تصنيف «'+name+'»؟',
    used ? used+' التزام يستخدم هذا التصنيف وسيبقى محتفظاً به حتى تعدّله.' : 'لن يظهر في قوائم الاختيار بعد الآن.',
    function(){
      c.splice(i,1);
      busy(true,'جاري الحفظ…');
      srv(after, failBusy).saveObligationCategories(S.token, c, S.month);
    });
}
function loadAudit(){
  srv(function(r){ if (r && r.length !== undefined){ S.audit = r; if (S.view==='settings') render(); } }, failBusy)
    .getAuditLog(S.token, 60);
}
function loadTrash(){
  srv(function(r){ if (r && r.length !== undefined){ S.trash = r; if (S.view==='settings') render(); } }, failBusy).getTrash(S.token);
}
function pSettings(){ return pSettingsCore() + pDeviceSettings(); }
function pSettingsCore(){
  var st = S.data.settings, s = S.data.summary;
  return '<div class="g2">'
  + '<div class="panel"><div class="phead"><div><h3>الخطة المالية</h3><div class="sub">تؤثر مباشرة على المتبقي الآمن</div></div></div>'
  +   fld('تاريخ بداية العمل بالتطبيق','<input id="setStart" type="date" value="'+attr(st.startDate)+'">',
          'لا يُحسب شيء قبل هذا التاريخ: لا دخل، ولا التزام، ولا متأخرات. اضبطه على أول راتب تريد تتبّعه.')
  +   fld('يوم بداية الدورة المالية','<input id="setCycle" type="number" min="1" max="28" value="'+(st.cycleStartDay||1)+'">',
          '1 = الشهر الميلادي المعتاد. 27 = الدورة تبدأ يوم نزول راتبك وتنتهي 26 من الشهر التالي، '
          + 'فيجتمع الراتب مع الالتزامات التي يغطيها في دورة واحدة.'
          + (st.cycleStartDay > 1 ? '<br><strong>الدورة الحالية: '+esc(st.cycleRange.start)+' → '+esc(st.cycleRange.end)+'</strong>' : ''))
  +   fld('احتياطي الأمان الشهري (ريال)','<input id="setBuffer" type="number" min="0" value="'+st.buffer+'">',
          'مبلغ تحجزه لنفسك ولا يُحسب ضمن المتاح للادخار — وسادة للمفاجآت.')
  +   fld('سقف المشتريات النثرية (ريال)','<input id="setPurchase" type="number" min="0" value="'+st.purchaseBudget+'">',
          'يُحجز من المتبقي الآمن. إذا تجاوزته، يُحتسب المصروف الفعلي بدلاً منه.')
  +   fld('نسبة الادخار من المتبقي الآمن (%)','<input id="setRate" type="number" min="0" max="100" value="'+st.savingsRate+'">')
  +   fld('ترحيل الرصيد بين الشهور', seg('setRoll',[['true','مفعّل'],['false','معطّل']], String(!!st.rollover)),
          'عند إقفال الشهر يُرحَّل رصيده الختامي كرصيد افتتاحي للشهر التالي.')
  +   '<button class="btn-main wide" style="margin-top:10px" onclick="saveSettings()">حفظ الإعدادات</button>'
  + '</div>'
  + '<div class="panel"><div class="phead"><div><h3>إقفال الشهر</h3><div class="sub">'+monthName(S.month)+'</div></div></div>'
  +   '<div class="stats4">'
  +     stat('الرصيد الافتتاحي', money(s.opening))
  +     stat('الدخل المحقق', money(s.incomeRealized))
  +     stat('المدفوع والمصروف', money(s.paidObligations + s.purchasesSpent))
  +     stat('الرصيد الختامي', money(s.closing))
  +   '</div>'
  +   (s.closed
      ? '<div class="note n-green" style="margin-top:12px">هذا الشهر مُقفل، ورصيده مرحَّل للشهر التالي.</div>'
        + '<button class="btn wide" onclick="reopenMonth()">إعادة فتح الشهر</button>'
      : '<div class="note n-gold" style="margin-top:12px">أقفل الشهر بعد الانتهاء من تسجيل كل الدخل والسداد، ليُرحَّل الرصيد للشهر التالي.</div>'
        + '<button class="btn-main wide" onclick="doCloseMonth()">إقفال الشهر وترحيل الرصيد</button>')
  + '</div></div>'

  + '<div class="g2">'
  + '<div class="panel"><div class="phead"><h3>المظهر</h3></div>'
  +   themeCards()
  +   '<div style="margin-top:16px"><strong style="font-size:14px">حجم العرض</strong>'
  +   '<div class="seg" style="margin-top:8px">'
  +     [['s','أصغر'],['n','عادي'],['l','أكبر'],['xl','كبير جداً']].map(function(x){
          return '<button class="'+(S.fs===x[0]?'on':'')+'" onclick="setFs(\''+x[0]+'\');render()">'+x[1]+'</button>';
        }).join('')
  +   '</div><div class="hint">يكبّر الواجهة كلها — النصوص والأزرار والجداول معاً.</div></div>'
  + '</div>'
  + '<div class="panel"><div class="phead"><h3>كلمة المرور</h3></div>'
  +   fld('الحالية','<input id="oldPass" type="password">')
  +   fld('الجديدة','<input id="newPass" type="password">')
  +   fld('تأكيد الجديدة','<input id="cfPass" type="password">')
  +   '<button class="btn-main wide" onclick="changePass()">تحديث كلمة المرور</button>'
  +   '<div class="hint">كلمة المرور محفوظة مشفّرة ولا تظهر في أي ورقة من الشيت. تغييرها ينهي كل الجلسات المفتوحة.</div>'
  + '</div></div>'

  + panel('المستشار الذكي','مفتاح كلود (Anthropic) — يُحفظ مشفّراً على جهازك فقط',
      (S.ai.status && S.ai.status.hasKey
        ? '<div class="note n-green">المستشار مفعّل. النموذج الحالي: <strong>'+esc(S.ai.status.model)+'</strong></div>'
        : '<div class="note n-gold">المستشار غير مفعّل. أنشئ مفتاحاً من <strong>console.anthropic.com</strong> '
          + 'ثم الصقه هنا. لا تشاركه مع أحد.</div>')
      + fld('مفتاح كلود (Anthropic)','<input id="aiKey" type="password" placeholder="'
          +((S.ai.status&&S.ai.status.hasKey)?'محفوظ — اكتب مفتاحاً جديداً لتغييره':'الصق المفتاح هنا')+'">')
      + '<input id="aiModel" type="hidden" value="'+attr((S.ai.status&&S.ai.status.model)||'')+'">'
      + '<div class="acts"><button class="btn-main" onclick="saveAi()">حفظ</button>'
      + '<button class="btn" onclick="runDiag()">تشخيص الاتصال واختيار نموذج يعمل</button>'

      + ((S.ai.status&&S.ai.status.hasKey)?'<button class="btn btn-sm no" onclick="clearAi()">حذف المفتاح</button>':'')
      + '</div>'
      + '<div class="hint">يُرسل للنموذج ما سجّلته من أسماء ومبالغ وتواريخ. لا يُرسل بريدك ولا اسم حسابك. '
      + 'والمفتاح يُخزَّن في خصائص السكربت لا في الشيت.</div>'
      + diagPanel())

  + panel('تصنيفات الالتزامات','تظهر في نافذة الالتزام وفي التقارير',
      '<div class="chips">'
      + (st.obligationCategories||[]).map(function(c,i){
          return '<span class="chip">'+esc(c)+' <b onclick="delObCat('+i+')" style="cursor:pointer;color:var(--red)">×</b></span>'; }).join('')
      + '<button class="chip add" onclick="addObCat()">＋ تصنيف</button></div>')

  + panel('سجل العمليات','آخر ما جرى على بياناتك',
      !S.audit ? '<div class="empty">جاري التحميل…</div>'
      : !S.audit.length ? '<div class="empty">لا توجد عمليات مسجَّلة بعد.</div>'
      : S.audit.slice(0,25).map(function(l){
          return '<div class="log"><span><strong>'+esc(l.action)+'</strong>'
            + (l.details && l.details!==l.action ? ' <span class="mut">— '+esc(l.details)+'</span>' : '')+'</span>'
            + '<span class="mut">'+esc(l.at)+'</span></div>';
        }).join(''))

  + panel('إشعارات الجوال','تصلك على هاتفك حتى والتطبيق مغلق — المتأخر، وما يستحق خلال أيام، والخصم التلقائي القريب، والدخل الذي لم تسجّله، ورصيدك السالب القادم',
      notifPanel())

  + panel('فحص وإصلاح البيانات','يُنشئ الأوراق الناقصة، يضيف الأعمدة الجديدة، ويصحّح أي التزام مخفي',
      '<div class="note n-blue">شغّله بعد كل تحديث للكود، أو إن لاحظت أن شيئاً سجّلته لا يظهر.<br>'
      + 'آمن تماماً: لا يحذف بياناتك، ويمكن تشغيله مراراً.</div>'
      + (S.ai.repair
         ? '<div class="note n-green">'+esc(S.ai.repair.message)+'</div>'
           + (S.ai.repair.report && S.ai.repair.report.obligationsFixed.length
              ? '<div class="hint">التزامات أُصلحت: '
                + S.ai.repair.report.obligationsFixed.map(esc).join(' · ')+'</div>' : '')
           + (S.ai.repair.report && S.ai.repair.report.notes.length
              ? '<div class="hint">ملاحظات: '+S.ai.repair.report.notes.map(esc).join(' · ')+'</div>' : '')
         : '')
      + '<button class="btn-main wide" onclick="runRepair()">افحص وأصلح الآن</button>')

  + panel('سلة المحذوفات','تُفرَّغ تلقائياً بعد 30 يوماً',
      !S.trash ? '<div class="empty">جاري التحميل…</div>'
      : !S.trash.length ? '<div class="empty">السلة فارغة.</div>'
      : '<div class="tw"><table style="min-width:600px"><thead><tr><th>النوع</th><th class="s">الاسم</th><th>المبلغ</th><th>تاريخ الحذف</th><th>إجراء</th></tr></thead><tbody>'
        + S.trash.map(function(t){
            return '<tr><td>'+tag(t.label,'gray')+'</td><td class="s">'+esc(t.name)+'</td>'
              + '<td>'+(t.amount?money(t.amount):'—')+'</td><td>'+esc(t.deletedAt)+'</td>'
              + '<td><div class="acts">'
              +   '<button class="btn btn-sm ok" onclick="restore(\''+t.sheet+'\',\''+t.id+'\')">استعادة</button>'
              +   '<button class="btn btn-sm no" onclick="purge(\''+t.sheet+'\',\''+t.id+'\',\''+attr(t.name)+'\')">حذف نهائي</button>'
              + '</div></td></tr>';
          }).join('') + '</tbody></table></div>');
}
/** حكم واحد واضح + النماذج التي نجح اختبارها فقط + أسباب فشل الباقي مجمّعة. */
function diagPanel(){
  var d = S.ai.diag;
  if (d && (!d.verdict || !d.steps)) d = S.ai.diag = null;   // رد تالف لا يكسر صفحة الإعدادات
  var last = S.ai.status && S.ai.status.lastDiag;
  if (!d && !last) return '<div class="hint" style="margin-top:12px">لم يُفحص الاتصال بعد. اضغط «تشخيص الاتصال».</div>';
  if (!d) {
    if (!last || !last.verdict) return '<div class="hint" style="margin-top:12px">لم يُفحص الاتصال بعد. اضغط «تشخيص الاتصال».</div>';
    return '<div class="note n-'+(last.ok?'green':'red')+'" style="margin-top:14px"><strong>'+esc(last.verdict.title)+'</strong>'
      + '<div style="font-size:13px;margin-top:4px">آخر فحص: '+esc(last.testedAt)+' · المعتمد: '+esc(last.current)
      + (last.working && last.working.length ? ' · '+last.working.length+' نموذج يعمل' : '')+'</div>'
      + (last.ok ? '' : '<div style="margin-top:6px">'+esc(last.verdict.fix)+'</div>')+'</div>';
  }
  var v = d.verdict;
  var ok = d.ok;
  return '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line2)">'
    // الحكم
    + '<div class="verdict '+(ok?'v-ok':'v-bad')+'">'
    +   '<div class="vi">'+(ok?'✓':'✕')+'</div>'
    +   '<div><div class="vt">'+esc(v.title)+'</div>'
    +   (v.explain?'<div class="vx">'+esc(v.explain)+'</div>':'')
    +   (v.fix?'<div class="vf">'+(ok?'':'الحل: ')+esc(v.fix)+'</div>':'')
    +   '<div class="vx" style="margin-top:6px">فُحص: '+esc(d.testedAt)+'</div></div></div>'
    // الخطوات
    + d.steps.map(function(x){
        return '<div class="dg"><div class="bul '+(x.ok?'ok':'no')+'">'+(x.ok?'✓':'✕')+'</div>'
          + '<div class="tx"><div class="tt">'+esc(x.name)+'</div>'
          + '<div class="dd">'+esc(x.detail)+'</div>'
          + (x.hint?'<div class="hh">'+esc(x.hint)+'</div>':'')+'</div></div>';
      }).join('')
    // الناجحة فقط
    + (d.working.length
      ? '<div style="margin-top:14px"><strong style="font-size:14px">نماذج اختُبرت ونجحت</strong>'
        + '<div class="hint">وحدها قابلة للاعتماد. المستشار ينتقل بينها تلقائياً إن تعطّل أحدها.</div>'
        + d.working.map(function(n){
            var cur = n === d.current;
            return '<div class="mdl'+(cur?' cur':'')+'"><span style="display:flex;align-items:center;gap:8px">'
              + '<i class="dot2 g"></i><strong>'+esc(n)+'</strong>'
              + (cur?' <span class="gold">(المعتمد)</span>':'')+'</span>'
              + (cur ? '<span class="green" style="font-size:12px">يعمل</span>'
                     : '<button class="btn btn-sm ok" onclick="pickModel(\''+n+'\')">اعتمده</button>')
              + '</div>';
          }).join('') + '</div>'
      : '')
    // الفاشلة مجمّعة حسب السبب — للمعلومة لا للاختيار
    + (d.failed && d.failed.length
      ? '<details class="adv" style="margin-top:12px"><summary>لماذا لم تنجح بقية النماذج؟ ('
        + d.failed.reduce(function(t,f){ return t+f.models.length; },0)+')</summary>'
        + d.failed.map(function(f){
            return '<div class="dg"><div class="bul no">✕</div><div class="tx"><div class="tt">'+esc(f.reason)+'</div>'
              + '<div class="dd">'+f.models.map(esc).join(' · ')+'</div></div></div>';
          }).join('') + '</details>'
      : '')
    + '</div>';
}
/* ============================================================ إشعارات الجوال ============================================================ */
function notifPanel(){
  var n = window.NOTIF_STATE ? window.NOTIF_STATE() : { supported:false, perm:'default', enabled:false, hour:9 };
  if (!n.supported) return '<div class="note n-red">متصفحك لا يدعم إشعارات الدفع. جرّب كروم أو إدج على الجوال.</div>';
  if (n.perm === 'denied') return '<div class="note n-red">رفضت الإذن سابقاً من إعدادات المتصفح/الجهاز. فعّله من إعدادات الموقع ثم أعد الصفحة.</div>';
  return (n.enabled
      ? '<div class="note n-green">الإشعارات مفعّلة على هذا الجهاز — تصلك يومياً الساعة '+esc(pad2(n.hour))+':00.</div>'
      : '<div class="note n-gold">فعّل الإشعارات ليصلك تنبيه يومي حتى والتطبيق مغلق.</div>')
    + fld('ساعة الإشعال', '<select id="notifHour" onchange="notifSetHour(this.value)">'
        + [7,8,9,10,11,12].map(function(h){ return '<option value="'+h+'" '+(n.hour==h?'selected':'')+'>'+pad2(h)+':00</option>'; }).join('')+'</select>')
    + '<div class="acts">'
    + (n.enabled
        ? '<button class="btn" onclick="notifTest()">أرسل تجربة الآن</button><button class="btn btn-sm no" onclick="notifDisable()">إيقاف</button>'
        : '<button class="btn-main" onclick="notifEnable()">تفعيل الإشعارات</button>')
    + '<button class="btn" onclick="notifPreview()">معاينة تنبيه اليوم</button>'
    + '</div>'
    + (n.enabled && n.syncHint ? '<div class="hint">'+esc(n.syncHint)+'</div>' : '');
}
function pad2(x){ return String(x).padStart(2,'0'); }
function notifSetHour(h){ if (window.notifSetHour_) window.notifSetHour_(Number(h)); if (S.view==='settings') render(); }
function notifEnable(){
  busy(true,'جاري التفعيل…');
  (window.notifEnable_ ? window.notifEnable_() : Promise.reject(new Error('غير مدعوم')))
    .then(function(){ busy(false); toast('تم تفعيل الإشعارات','ok'); if (S.view==='settings') render(); })
    .catch(function(e){ busy(false); toast(e&&e.message||'تعذّر التفعيل','err'); });
}
function notifDisable(){
  busy(true,'...');
  (window.notifDisable_ ? window.notifDisable_() : Promise.resolve())
    .then(function(){ busy(false); toast('أُوقفت الإشعارات','ok'); if (S.view==='settings') render(); });
}
function notifTest(){
  if (window.notifTest_) window.notifTest_();
  toast('أُرسلت — راقب إشعارات جهازك','ok');
}
function notifPreview(){
  busy(true,'جاري بناء المعاينة…');
  srv(function(r){
    busy(false);
    if (!r) return toast('تعذّر','err');
    if (!r.title) return modal(mhead('معاينة التنبيه','')+'<div class="note n-green">لا يوجد اليوم ما يستحق التنبيه — هذا هو المقصود.</div>'+macts('إغلاق','closeModal()'));
    modal(mhead('معاينة التنبيه', esc(r.title))+'<div class="note n-blue" style="white-space:pre-line">'+esc(r.body)+'</div>'+macts('إغلاق','closeModal()'));
  }, failBusy).appPushPreview(S.token);
}

function runRepair(){
  busy(true,'جاري الفحص والإصلاح…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر الإصلاح','err');
    S.ai.repair = r;
    if (r.data){ S.data = r.data; S.month = r.data.month; }
    S.flow=null; S.forecast=null; S.trash=null; S.audit=null; S.allObs=null;
    renderMonths(); render();
    toast(r.message,'ok');
  }, failBusy).repairAll(S.token);
}
function runDiag(){
  busy(true,'جاري اختبار النماذج فعلياً… قد يستغرق حتى 30 ثانية');
  srv(function(r){
    busy(false);
    if (!r || r.error || !r.verdict || !r.steps) return toast((r&&r.error)||'رد غير متوقع من التشخيص — أعد النشر بإصدار جديد','err');
    S.ai.diag = r;
    S.ai.status = { hasKey:true, model:r.current, working:r.working,
                    lastDiag:{ ok:r.ok, verdict:r.verdict, current:r.current, working:r.working, testedAt:r.testedAt } };
    render();
    toast(r.verdict.title + (r.switchedFrom ? ' — بُدِّل المعتمد إلى '+r.current : ''), r.ok ? 'ok' : 'err');
    if (!r.ok) showErr(r.verdict.title + ' — ' + r.verdict.fix);
  }, failBusy).diagnoseAi(S.token);
}
function pickModel(name){
  busy(true,'جاري الاعتماد…');
  srv(function(r){
    busy(false);
    if (!r || !r.success) return toast((r&&r.message)||'تعذر','err');
    if (S.ai.diag) S.ai.diag.current = r.model;
    S.ai.status = Object.assign({}, S.ai.status||{}, { model:r.model });
    toast(r.message,'ok'); render();
  }, failBusy).setAiModel(S.token, name);
}
function autoPick(){ runDiag(); }
function saveAi(){
  var k = v('aiKey').trim(), m = v('aiModel').trim();
  if (!k && !(S.ai.status && S.ai.status.hasKey)) return toast('الصق المفتاح أولاً','err');
  busy(true,'جاري الحفظ…');
  srv(function(r){
    busy(false);
    if (!r || r.error) return toast((r&&r.error)||'تعذر الحفظ','err');
    S.ai.status = { hasKey:r.hasKey, model:r.model }; S.ai.diag = null;
    toast(r.message||'تم','ok'); render();
    if (k) runDiag();   // مفتاح جديد ⇒ نختبره فوراً
  }, failBusy).saveAiKey(S.token, k, m);
}
/** الاختبار الوحيد المعتمد هو التشخيص الكامل المصنِّف. */
function testAi(){ runDiag(); }
function clearAi(){
  confirm2('حذف مفتاح كلود؟','سيتوقف المستشار حتى تضيف مفتاحاً جديداً.', function(){
    busy(true,'جاري الحذف…');
    srv(function(r){ busy(false); S.ai.status={hasKey:false,model:'gemini-2.0-flash'};
      toast('تم حذف المفتاح','ok'); render(); }, failBusy).clearAiKey(S.token);
  });
}
function saveSettings(){
  busy(true,'جاري الحفظ…');
  srv(after, failBusy).saveBudgetSettings(S.token, {
    buffer:+v('setBuffer')||0, savingsRate:+v('setRate')||0,
    purchaseBudget:+v('setPurchase')||0, rollover:v('setRoll')==='true',
    startDate:v('setStart'), cycleStartDay:+v('setCycle')||1, month:S.month });
}
function doCloseMonth(){
  confirm2('إقفال '+monthName(S.month)+'؟','سيُحسب الرصيد الختامي ويُرحَّل كرصيد افتتاحي للشهر التالي. يمكنك إعادة الفتح متى شئت.', function(){
    busy(true,'جاري الإقفال…');
    srv(function(r){ S.trend=null; after(r); }, failBusy).closeMonth(S.token, S.month);
  });
}
function reopenMonth(){
  busy(true,'جاري إعادة الفتح…');
  srv(function(r){ S.trend=null; after(r); }, failBusy).reopenMonth(S.token, S.month);
}
function restore(sheet,id){
  busy(true,'جاري الاستعادة…');
  srv(function(r){ S.trash=null; after(r); loadTrash(); }, failBusy).restoreFromTrash(S.token, sheet, id, S.month);
}
function purge(sheet,id,name){
  confirm2('حذف نهائي؟','سيُحذف «'+name+'» نهائياً مع سجلاته المرتبطة. لا يمكن التراجع.', function(){
    busy(true,'جاري الحذف…');
    srv(function(r){ S.trash=null; after(r); loadTrash(); }, failBusy).purgeFromTrash(S.token, sheet, id, S.month);
  });
}
function changePass(){
  var o=v('oldPass'), n=v('newPass'), c=v('cfPass');
  if (!o || !n) return toast('أكمل الحقول','err');
  if (n !== c) return toast('كلمتا المرور غير متطابقتين','err');
  busy(true,'جاري التغيير…');
  srv(function(r){
    busy(false);
    if (r && r.success){ toast(r.message||'تم التغيير','ok'); setTimeout(sessionEnded, 1400); }
    else toast((r&&r.message)||'تعذر التغيير','err');
  }, failBusy).changePassword(S.token, o, n);
}

/* ============================================================ المظهر ============================================================ */
function renderLoginThemes(){
  el('loginThemes').innerHTML = THEMES.map(function(t){
    return '<button class="th '+(S.theme===t[0]?'on':'')+'" onclick="setTheme(\''+t[0]+'\')"><div class="sw '+t[2]+'"></div>'+t[1]+'</button>';
  }).join('');
}
function setTheme(t){
  S.theme = t; localStorage.setItem('myz_theme', t);
  document.documentElement.setAttribute('data-theme', t);
  renderLoginThemes();
  if (!el('app').classList.contains('hidden') && S.data) render();
}
function setFs(size){
  S.fs = size; localStorage.setItem('myz_fs', size);
  document.documentElement.setAttribute('data-fs', size);
  markFs();
}
function markFs(){
  ['s','n','l','xl'].forEach(function(x){
    var b = el('fs-'+x); if (b) b.classList.toggle('on', S.fs === x);
  });
}

/* ============================================================ أدوات ============================================================ */
function el(id){ return document.getElementById(id); }

/* عجلة «جاري…» كانت تبقى للأبد عند فشل الجلب. الآن يظهر الخطأ بنصه مع إعادة المحاولة. */
function loadFail(key){
  return function(e){
    busy(false);
    S.errs[key] = msg(e) || 'فشل غير معروف';
    render();
  };
}
function okOrFail(key, fn){
  return function(r){
    if (r === null || r === undefined){ S.errs[key] = 'رجع الخادم بلا بيانات — غالباً النسخة المنشورة قديمة. أعد النشر بإصدار جديد.'; render(); return; }
    if (r && r.error){ S.errs[key] = r.error; render(); return; }
    delete S.errs[key];
    fn(r);
  };
}
function waitOrErr(key, text, retry){
  if (S.errs[key]){
    return '<div class="panel"><div class="note n-red"><strong>تعذّر الجلب</strong>'
      + '<div style="margin-top:5px;font-size:13px">'+esc(S.errs[key])+'</div></div>'
      + '<button class="btn" onclick="delete S.errs[\''+key+'\'];'+retry+'">إعادة المحاولة</button></div>';
  }
  return '<div class="panel"><div class="empty">'+text+'</div></div>';
}
function v(id){ var e = el(id); return e ? e.value : ''; }
function find(arr,id){ return (arr||[]).filter(function(x){ return x.id === id; })[0]; }
function sum(arr,k){ return (arr||[]).reduce(function(s,x){ return s + (Number(x[k])||0); },0); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function attr(s){ return esc(s==null?'':s); }
/** لتمرير نص عربي بأمان داخل onclick */
function attrJs(x){ return esc(String(x==null?'':x)).replace(/\\/g,'').replace(/'/g,'\\&#39;'); }
function money(n){ return Math.round(Number(n)||0).toLocaleString('en-US') + ' ر.س'; }
function tag(t,c){ return '<span class="tag t-'+c+'">'+t+'</span>'; }
function stat(label,val){ return '<div class="stat"><small>'+label+'</small><strong>'+val+'</strong></div>'; }
function opts(list,sel){
  return list.map(function(x){ var p = x.split('|');
    return '<option value="'+p[0]+'"'+(sel===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join('');
}
/* أسماء الشهور ميلادية صريحة — ar-SA وحدها تُخرج تقويماً هجرياً بينما البيانات ميلادية */
var MONTH_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function monthName(k){
  var p = String(k).split('-');
  var label = MONTH_AR[(+p[1])-1] + ' ' + p[0];
  var sd = S.data && S.data.settings ? S.data.settings.cycleStartDay : 1;
  if (!sd || sd === 1) return label;
  // الدورة غير الميلادية: نضيف مداها حتى لا يظن أنها الشهر الميلادي
  var y = +p[0], m = +p[1];
  var st = new Date(y, m-2, sd), en = new Date(y, m-1, sd-1);
  var f = function(d){ return d.getDate()+' '+MONTH_AR[d.getMonth()]; };
  return 'دورة ' + label + ' (' + f(st) + ' → ' + f(en) + ')';
}
function dayLabel(o){
  if (o.paid) return 'مسدَّد';
  if (o.overdue) return 'متأخر ' + Math.abs(o.daysLeft) + ' يوم';
  if (o.daysLeft === 0) return 'اليوم';
  if (o.daysLeft < 0) return 'استحق قبل ' + Math.abs(o.daysLeft) + ' يوم';
  return 'بعد ' + o.daysLeft + ' يوم';
}
function srcLabel(o){
  if (!o.sources.length && o.unallocatedAmount <= 0) return '<span class="mut">—</span>';
  if (!o.sources.length) return '<span class="red">غير موزع</span>';
  var html = o.sources.map(function(s){
    return '<div>' + tag(esc(s.sourceName||'مصدر محذوف'), s.missing?'red':s.paused?'gold':'blue')
      + (o.isSplit ? ' <span class="mut" style="font-size:12px">'+money(s.amount)+'</span>' : '') + '</div>';
  }).join('');
  if (o.unallocatedAmount > 0) html += '<span class="sub red">غير مخصص '+money(o.unallocatedAmount)+'</span>';
  if (o.sourcePaused) html += '<span class="sub gold">المصدر موقوف هذا الشهر</span>';
  return html;
}
function srcName(id){
  var i = find(S.data.incomes, id);
  return i ? i.name : 'مصدر محذوف';
}
function statusColor(st){
  return st==='سليم' ? 'green' : st==='عجز' ? 'red' : st==='يزاحم الادخار' ? 'purple' : 'orange';
}
function stateTag(o){
  if (o.autoPaid) return tag('خُصم تلقائياً','blue');
  if (o.autoDeduct && o.paidAmount > 0) return tag('خصم جارٍ','blue');
  if (o.autoDeduct) return tag('خصم تلقائي قادم','gray');
  if (o.paid) return tag('مدفوع','green');
  if (o.paidAmount > 0) return tag('جزئي','blue');
  if (o.overdue) return tag('متأخر','red');
  // مرّ تاريخه لكنه ما زال ضمن مهلة السماح التي حددتها
  if (o.daysLeft < 0) return tag('حان موعده','orange');
  if (o.daysLeft === 0) return tag('اليوم','orange');
  if (o.daysLeft <= 3) return tag('عاجل','gold');
  return tag('معلق','gray');
}

/* نماذج */
function fld(label, input, hint){
  return '<div class="field"><label>'+label+'</label>'+input+(hint?'<div class="hint">'+hint+'</div>':'')+'</div>';
}
function fldFull(label, input, hint){
  return '<div class="field full"><label>'+label+'</label>'+input+(hint?'<div class="hint">'+hint+'</div>':'')+'</div>';
}
function seg(id, options, current){
  return '<div class="seg" id="seg-'+id+'">'
    + options.map(function(o){
        return '<button type="button" class="'+(String(current)===o[0]?'on':'')+'" data-val="'+attr(o[0])+'" onclick="segPick(\''+id+'\',\''+o[0]+'\')">'+o[1]+'</button>';
      }).join('')
    + '</div><input type="hidden" id="'+id+'" value="'+attr(current)+'">';
}
function segPick(id, val){
  el(id).value = val;
  var list = document.querySelectorAll('#seg-'+id+' button');
  for (var i=0;i<list.length;i++) list[i].classList.toggle('on', list[i].getAttribute('data-val') === val);
  if (id === 'iSched') syncSchedField();
}
/** حقل اليوم لا معنى له لدخل بلا موعد */
function syncSchedField(){
  var sel = el('iSched'), day = el('iDay');
  if (!sel || !day) return;
  var off = sel.value === 'no';
  day.disabled = off;
  day.style.opacity = off ? '.45' : '1';
  day.placeholder = off ? 'لا ينطبق' : '';
  var hint = day.parentNode.querySelector('.hint');
  if (off && !hint){
    var h = document.createElement('div');
    h.className = 'hint'; h.id = 'schedHint';
    h.textContent = 'هذا الدخل لن يدخل الخطة المضمونة حتى تسجّل نزوله فعلياً.';
    day.parentNode.appendChild(h);
  } else if (!off && el('schedHint')) {
    el('schedHint').remove();
  }
}
function mhead(title, sub){
  return '<div class="mhead"><div><h3>'+title+'</h3>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>'
       + '<button class="x" onclick="closeModal()">×</button></div>';
}
function macts(label, fn){
  return '<div class="macts"><button class="btn-main" onclick="'+fn+'">'+label+'</button>'
       + '<button class="btn" onclick="closeModal()">إلغاء</button></div>';
}

/* نوافذ */
function modal(html, small){
  var m = el('modal');
  m.className = 'modal' + (small ? ' sm' : '');
  m.innerHTML = html;
  el('mbg').classList.remove('hidden');
  var first = m.querySelector('input:not([type=hidden]),select,textarea');
  if (first) setTimeout(function(){ first.focus(); }, 60);
}
function closeModal(e){ if (!e || e.target === el('mbg')) el('mbg').classList.add('hidden'); }
var pendingConfirm = null;
function confirm2(title, text, fn){
  pendingConfirm = fn;
  modal('<div style="text-align:center;padding:6px 2px">'
    + '<h3 style="font-size:20px;margin-bottom:8px">'+esc(title)+'</h3>'
    + '<p style="color:var(--muted);margin:0 auto;max-width:440px;white-space:pre-line;text-align:right">'+esc(text)+'</p>'
    + '<div class="macts"><button class="btn-main btn-danger" onclick="runConfirm()">تأكيد</button>'
    + '<button class="btn" onclick="cancelConfirm()">إلغاء</button></div></div>', true);
}
function runConfirm(){ var f = pendingConfirm; pendingConfirm = null; closeModal(); if (typeof f === 'function') f(); }
function cancelConfirm(){ pendingConfirm = null; closeModal(); }

/* حالة */
function busy(on, text){ el('loadTxt').textContent = text || 'جاري التحميل…'; el('load').classList.toggle('hidden', !on); }
var toastT = null;
function showErr(m){
  var e = el('err'); if (!e) return;
  el('errTxt').textContent = m;
  e.classList.remove('hidden');
}
function hideErr(){ var e = el('err'); if (e) e.classList.add('hidden'); }

function toast(m, type){
  var t = el('toast');
  t.textContent = m;
  t.className = 'toast ' + (type === 'err' ? 'err' : 'ok');
  requestAnimationFrame(function(){ t.classList.add('show'); });
  clearTimeout(toastT);
  toastT = setTimeout(function(){ t.classList.remove('show'); }, 2800);
}
