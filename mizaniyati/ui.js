/* ============================================================
 *  واجهة ميزانيتي للجوال — تُحمَّل بعد app.js.
 *  تعيد تعريف: الهيكل، التنقل، الرئيسية، الالتزامات، وتحويل
 *  الجداول إلى قوائم. منطق الصفحات والبيانات لا يُمس.
 * ========================================================== */

/* ---------- أيقونات خطية ---------- */
var IC = {
  home:'<path d="M3.5 10.2 12 3.5l8.5 6.7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>',
  list:'<rect x="4.5" y="3.5" width="15" height="17" rx="3"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
  wallet:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="7.5" width="16.5" height="12" rx="2.5"/><path d="M16 13.5h1.5"/>',
  grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  check:'<path d="M19.5 6.5 9.5 16.5l-5-5"/>',
  wave:'<path d="M3 15c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M16 3v4M8 3v4M3.5 10h17"/>',
  pie:'<path d="M20.5 13A8.5 8.5 0 1 1 11 3.5V13z"/><path d="M14.5 3.7a8.5 8.5 0 0 1 5.8 5.8h-5.8z"/>',
  receipt:'<path d="M6 3.5h12v17l-2.5-1.6-2 1.6-1.5-1.2-1.5 1.2-2-1.6L6 20.5z"/><path d="M9.5 8.5h5M9.5 12h5"/>',
  gem:'<path d="M7 4h10l3.5 5.5L12 20 3.5 9.5z"/><path d="M3.5 9.5h17"/>',
  spark:'<path d="M12 3.5l1.7 5L19 10.2l-5.3 1.7L12 17l-1.7-5.1L5 10.2l5.3-1.7z"/><path d="M18.5 15.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/>',
  chart:'<path d="M5 20v-8M10.5 20V5M16 20v-5.5M20.5 20h-17"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.4a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .8-1 1.5"/><path d="M12 16.6h.01"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M3 12h2.2M18.8 12H21M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
  refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3l2.2 2.1"/><path d="M19.5 4v4.8h-4.8"/>',
  menu:'<path d="M5 8h14M5 12h14M5 16h9"/>',
  logout:'<path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9.5"/>',
  chev:'<path d="M14.5 6.5 9 12l5.5 5.5"/>',
  alert:'<path d="M12 4 3 19.5h18z"/><path d="M12 10v4M12 16.8h.01"/>',
  bolt:'<path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z"/>',
  bag:'<path d="M5.5 8.5h13l-1.1 11a1 1 0 0 1-1 .9H7.6a1 1 0 0 1-1-.9z"/><path d="M9 8.5a3 3 0 0 1 6 0"/>',
  down:'<path d="M12 5v13M6.5 12.5 12 18l5.5-5.5"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  sliders:'<path d="M5 7h9M18 7h1M5 17h3M12 17h7"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  palette:'<circle cx="12" cy="12" r="8.5"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/><path d="M12 20.5a3 3 0 0 1 0-6h1.5a3 3 0 0 0 3-3"/>'
};
function ico(n, cls){
  return '<svg class="ic '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[n]||'')+'</svg>';
}
var PAGE_IC = { dash:'home', income:'wallet', oblig:'list', paylog:'check', debt:'pie', forecast:'cal', flow:'wave',
  purchases:'receipt', savings:'gem', reports:'chart', whatif:'target', settings:'gear', advisor:'spark', guide:'help' };
var SHORT = { dash:'الرئيسية', income:'الدخل', oblig:'الالتزامات', paylog:'السداد', debt:'الديون', forecast:'القادم',
  flow:'التدفق', purchases:'المشتريات', savings:'الادخار', reports:'التقارير', whatif:'ماذا لو', settings:'الإعدادات',
  advisor:'المستشار', guide:'الدليل' };

/* ============================================================ الهيكل ============================================================ */
function renderNav(){
  el('nav').innerHTML = NAV.map(function(g){
    return '<div class="nav-label">'+g[0]+'</div>' + g[1].map(function(p){
      return '<button data-v="'+p[0]+'" onclick="go(\''+p[0]+'\')">'+ico(PAGE_IC[p[0]])+'<span>'+PAGES[p[0]][0]+'</span></button>';
    }).join('');
  }).join('');
  var tab = function(k){ return '<button class="tab" data-t="'+k+'" onclick="go(\''+k+'\')">'+ico(PAGE_IC[k])+'<span>'+SHORT[k]+'</span></button>'; };
  el('tabbar').innerHTML = tab('dash') + tab('oblig')
    + '<button class="tab-add" onclick="openQuick()" aria-label="إضافة">'+ico('plus')+'</button>'
    + tab('income')
    + '<button class="tab" data-t="more" onclick="openMore()">'+ico('grid')+'<span>المزيد</span></button>';
  el('abRefresh').innerHTML = ico('refresh');
  el('abMenu').innerHTML = ico('menu');
  markNav();
}
function greet_(){
  var h = new Date().getHours();
  return h < 4 ? 'سهرانين؟' : h < 12 ? 'صباح الخير' : h < 16 ? 'يومك طيب' : 'مساء الخير';
}
function markNav(){
  var i, list = document.querySelectorAll('#nav button[data-v]');
  for (i=0;i<list.length;i++) list[i].classList.toggle('on', list[i].getAttribute('data-v') === S.view);
  var inTabs = S.view === 'dash' || S.view === 'oblig' || S.view === 'income';
  var tabs = document.querySelectorAll('#tabbar .tab');
  for (i=0;i<tabs.length;i++){
    var t = tabs[i].getAttribute('data-t');
    tabs[i].classList.toggle('on', t === S.view || (t === 'more' && !inTabs));
  }
  var p = PAGES[S.view], home = S.view === 'dash';
  el('ttl').textContent = home ? 'ميزانيتي' : p[0];
  el('abHi').textContent = home ? greet_() : '';
  el('sub').textContent = home ? '' : p[1];
  var b = el('topBtn');
  b.innerHTML = p[2] ? ico('plus') + '<span>' + p[2] + '</span>' : '';
  b.style.display = (p[2] && !home) ? '' : 'none';
  document.body.setAttribute('data-view', S.view);
  var top = document.querySelector('.top');
  if (top) top.classList.toggle('hidden', home);
}

/* ---------- أوراق «المزيد» و«إضافة» ---------- */
function openMore(){
  modal('<div class="sheet-t">كل الأقسام</div>'
    + NAV.map(function(g){
        return '<div class="more-l">'+g[0]+'</div><div class="more-grid">'
          + g[1].map(function(p){
              return '<button class="more-i'+(S.view===p[0]?' on':'')+'" onclick="closeModal();go(\''+p[0]+'\')">'
                + ico(PAGE_IC[p[0]])+'<span>'+SHORT[p[0]]+'</span></button>';
            }).join('') + '</div>';
      }).join('')
    + '<div class="more-foot">'
    +   '<button onclick="closeModal();go(\'settings\')">'+ico('palette')+'المظهر والإعدادات</button>'
    +   '<button class="out" onclick="closeModal();logout()">'+ico('logout')+'تسجيل الخروج</button>'
    + '</div>');
}
function openQuick(){
  var items = [
    ['check','سدّدت التزاماً','سجّل دفعة لالتزام مستحق', "go('paylog')"],
    ['bag','شراء نثري','قهوة، مقاضي، بنزين', "go('purchases');setTimeout(function(){openPurchase()},80)"],
    ['list','التزام جديد','قسط، فاتورة، اشتراك', "go('oblig');setTimeout(function(){openOblig()},80)"],
    ['wallet','مصدر دخل','راتب أو دخل إضافي', "go('income');setTimeout(function(){openIncome()},80)"],
    ['bolt','وزّع بذكاء','اربط كل التزام بالراتب المناسب', "openAllocate()"],
    ['spark','اسأل المستشار','تحليل مبني على أرقامك', "go('advisor')"]
  ];
  modal('<div class="sheet-t">إضافة</div><div class="glist">'
    + items.map(function(x){
        return '<button class="grow" onclick="closeModal();'+x[3].replace(/"/g,'&quot;')+'">'
          + '<span class="g-ic">'+ico(x[0])+'</span><span class="g-tx"><b>'+x[1]+'</b><small>'+x[2]+'</small></span>'
          + ico('chev','g-go')+'</button>';
      }).join('') + '</div>');
}

/* ---------- غلاف العرض: قوائم بدل الجداول + طي شروح الصفحات ---------- */
var __render0 = render;
render = function(){
  __render0();
  var v = el('view');
  try { listifyTables(v); foldIntro_(v); } catch (e) {}
  if (S.view === 'dash') requestAnimationFrame(drawCharts);
};
var __modal0 = modal;
modal = function(html, small){
  __modal0(html, small);
  try { listifyTables(el('modal')); } catch (e) {}
};
var __after0 = after;
after = function(r){
  if (r && r.data) { S.flow = null; S.sens = null; }
  __after0(r);
  if (S.view === 'dash' && S.data && !S.flow) loadDashFlow_();
};
var __refresh0 = refresh;
refresh = function(l){ S.flow = null; S.sens = null; __refresh0(l); };
var __lvd0 = loadViewData;
loadViewData = function(view){
  __lvd0(view);
  if (view === 'dash' && S.data && !S.flow) loadDashFlow_();
};
function loadDashFlow_(){
  if (S.flowLoading) return;
  S.flowLoading = true;
  srv(function(r){ S.flowLoading = false; if (r && !r.error){ S.flow = r; if (S.view === 'dash' || S.view === 'flow') render(); } },
      function(){ S.flowLoading = false; }).getDailyFlow(S.token, S.month);
}

function listifyTables(root){
  var tables = root.querySelectorAll('table');
  for (var i=0;i<tables.length;i++){
    var t = tables[i];
    if (t.classList.contains('lst')) continue;
    var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function(th){ return th.textContent.trim(); });
    if (!heads.length) continue;
    t.classList.add('lst');
    var rows = t.querySelectorAll('tbody tr');
    for (var r=0;r<rows.length;r++){
      var cells = rows[r].children, col = 0;
      if (cells.length === 1) { rows[r].classList.add('solo'); continue; }
      for (var c=0;c<cells.length;c++){
        var lb = heads[col] || '';
        cells[c].setAttribute('data-label', lb);
        if (c === 0) cells[c].classList.add('lead');
        if (!lb || /^(إجراء|إجراءات|سدّد|سداد)$/.test(lb)) cells[c].classList.add('act');
        col += Number(cells[c].getAttribute('colspan') || 1);
      }
    }
  }
}
function foldIntro_(v){
  var first = v && v.firstElementChild;
  if (!first || !first.classList.contains('note') || !first.classList.contains('n-blue')) return;
  var d = document.createElement('details');
  d.className = 'intro';
  d.innerHTML = '<summary>'+ico('help')+'كيف تعمل هذه الصفحة؟</summary>';
  v.insertBefore(d, first);
  d.appendChild(first);
}

/* ---------- أدوات ---------- */
function num_(n){ return Math.round(Number(n)||0).toLocaleString('en-US'); }
function dd_(iso){
  var p = String(iso||'').split('-');
  return p.length === 3 ? { d:+p[2], m:MONTH_AR[(+p[1])-1] || '' } : { d:'', m:'' };
}
function dShort_(iso){ var x = dd_(iso); return x.d ? x.d+' '+x.m : ''; }
function days_(a, b){ return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }

/* ============================================================ الرئيسية ============================================================ */
/* منحنى الرصيد على امتداد الدورة — من الراتب إلى الراتب، يُقرأ من اليمين */
function flowChart_(f){
  if (!f || !f.days || !f.days.length) return '<div class="fc-wait">جاري رسم دورتك…</div>';
  var W = 340, H = 118, PT = 14, PB = 10, n = f.days.length;
  var vals = f.days.map(function(d){ return d.balance; });
  var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
  if (min > 0) min = Math.max(0, min - (max - min) * .25);
  var span = (max - min) || 1;
  var X = function(i){ return W - (n === 1 ? W/2 : i / (n-1) * W); };
  var Y = function(v){ return PT + (max - v) / span * (H - PT - PB); };
  var pts = vals.map(function(v,i){ return [X(i), Y(v)]; });
  var path = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (var i=1;i<pts.length;i++){
    var p0 = pts[i-2] || pts[i-1], p1 = pts[i-1], p2 = pts[i], p3 = pts[i+1] || p2;
    var c1x = p1[0] + (p2[0]-p0[0])/6, c1y = p1[1] + (p2[1]-p0[1])/6;
    var c2x = p2[0] - (p3[0]-p1[0])/6, c2y = p2[1] - (p3[1]-p1[1])/6;
    path += ' C'+c1x.toFixed(1)+' '+c1y.toFixed(1)+' '+c2x.toFixed(1)+' '+c2y.toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
  }
  var area = path + ' L'+pts[n-1][0].toFixed(1)+' '+H+' L'+pts[0][0].toFixed(1)+' '+H+' Z';
  var zero = min < 0 ? '<line x1="0" x2="'+W+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" class="fc-zero"/>' : '';
  var marks = '';
  f.days.forEach(function(d, i){
    if (d.inflow > 0) marks += '<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(d.balance).toFixed(1)+'" r="3.2" class="fc-in"/>';
  });
  var ti = -1, lo = 0;
  f.days.forEach(function(d,i){ if (d.isToday) ti = i; if (d.balance < vals[lo]) lo = i; });
  var today = ti > -1
    ? '<line x1="'+X(ti).toFixed(1)+'" x2="'+X(ti).toFixed(1)+'" y1="4" y2="'+H+'" class="fc-now-l"/>'
      + '<circle cx="'+X(ti).toFixed(1)+'" cy="'+Y(vals[ti]).toFixed(1)+'" r="5" class="fc-now"/>'
    : '';
  var low = '<circle cx="'+X(lo).toFixed(1)+'" cy="'+Y(vals[lo]).toFixed(1)+'" r="3.2" class="fc-lo'+(vals[lo]<0?' neg':'')+'"/>';
  return '<svg class="fc" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="منحنى رصيدك خلال الدورة">'
    + '<defs><linearGradient id="fcA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".38"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="fcL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>'
    + zero + '<path d="'+area+'" fill="url(#fcA)"/><path d="'+path+'" class="fc-line"/>' + marks + low + today + '</svg>';
}

function hero_(){
  var d = S.data, s = d.summary, cr = d.settings.cycleRange || {}, f = S.flow;
  var isCur = d.month === currentCycle();
  var next = d.incomes.filter(function(i){ return i.isBasic && !i.paused && !i.arrived && i.occurrenceDate && i.occurrenceDate >= TODAY_ISO; })
    .sort(function(a,b){ return a.occurrenceDate < b.occurrenceDate ? -1 : 1; })[0];
  var endIso = next ? next.occurrenceDate : cr.end;
  var left = isCur ? Math.max(0, days_(TODAY_ISO, endIso)) : 0;
  var safe = s.safeRemaining;
  var perDay = isCur && left > 0 && safe > 0 ? safe / left : 0;
  var lowD = f && f.days && f.days.length ? f.days.reduce(function(a,b){ return b.balance < a.balance ? b : a; }) : null;
  var lowTxt = !lowD ? '' : f.firstNegative
      ? '<span class="hf neg">ينقلب سالباً يوم '+dShort_(f.firstNegative.date)+'</span>'
      : '<span class="hf">أدنى رصيد '+num_(lowD.balance)+' يوم '+dShort_(lowD.date)+'</span>';
  return '<section class="hero">'
    + '<div class="h-lbl">'+(next ? 'يكفيك بأمان حتى '+esc(next.name)+' '+dShort_(next.occurrenceDate) : 'المتبقي الآمن لهذه الدورة')+'</div>'
    + '<div class="h-num'+(safe<0?' neg':'')+'"><span>'+(safe<0?'−':'')+num_(Math.abs(safe))+'</span><em>ريال</em></div>'
    + '<div class="h-sub">'+(perDay ? 'تقريباً <b>'+num_(perDay)+'</b> ريال لكل يوم من '+left+' '+(left<=10?'أيام':'يوماً')+' باقية'
        : safe < 0 ? 'التزاماتك ومشترياتك تتجاوز ما يدخلك هذه الدورة' : 'بعد الالتزامات والمشتريات والاحتياطي')+'</div>'
    + '<div class="fc-wrap">'+flowChart_(f)+(isCur && f && f.days ? nowTag_(f) : '')+'</div>'
    + '<div class="h-axis"><span>'+dShort_(cr.start)+'</span><span>'+dShort_(cr.end)+'</span></div>'
    + '<div class="h-foot">'+lowTxt+'<button class="hf-link" onclick="go(\'flow\')">التدفق يوماً بيوم'+ico('chev')+'</button></div>'
    + '</section>';
}

function nowTag_(f){
  var n = f.days.length, i = -1;
  f.days.forEach(function(d,k){ if (d.isToday) i = k; });
  if (i < 0) return '';
  var pct = n > 1 ? i/(n-1)*100 : 50;
  return '<span class="fc-tag" style="right:'+Math.min(92, Math.max(8, pct)).toFixed(1)+'%">اليوم</span>';
}
function quick_(){
  var q = [['bolt','وزّع',"openAllocate()"],['check','سدّد',"go('paylog')"],
           ['bag','شراء',"go('purchases');setTimeout(function(){openPurchase()},80)"],['spark','المستشار',"go('advisor')"]];
  return '<div class="qa">' + q.map(function(x){
    return '<button onclick="'+x[2].replace(/"/g,'&quot;')+'"><span>'+ico(x[0])+'</span>'+x[1]+'</button>';
  }).join('') + '</div>';
}

function alerts_(){
  var d = S.data, s = d.summary, obs = d.obligations, out = [];
  var overdue = obs.filter(function(o){ return o.overdue; });
  var unalloc = obs.filter(function(o){ return o.unallocatedAmount > 0; });
  var late = d.incomes.filter(function(i){ return i.isBasic && !i.paused && i.inWindow && !i.arrived && i.occurrenceDate && i.occurrenceDate < TODAY_ISO; });
  if (!d.sourceBreakdown.length) out.push(['gold','wallet','ابدأ براتبك','أضف مصدر دخلك الأساسي ليبدأ الحساب', "go('income');setTimeout(function(){openIncome()},80)", 'إضافة']);
  if (overdue.length) out.push(['red','alert', overdue.length+' فات موعده', num_(sum(overdue,'remainingAmount'))+' ريال لم تُسدَّد بعد', "go('paylog')", 'سدّد']);
  if (s.arrearsTotal > 0) out.push(['red','alert','متأخرات من دورات سابقة', num_(s.arrearsTotal)+' ريال تُخصم من الآمن', "go('paylog')", 'عرض']);
  if (s.remaining < 0) out.push(['red','pie','دخلك لا يغطي الدورة', 'العجز '+num_(-s.remaining)+' ريال', "openAllocate()", 'عالج']);
  if (late.length) out.push(['gold','down','لم تسجّل نزول الدخل', late.map(function(i){ return esc(i.name); }).join('، '), "go('income')", 'سجّل']);
  if (unalloc.length) out.push(['blue','bolt', unalloc.length+' التزام بلا مصدر', 'اربطه بالراتب المناسب', "openAllocate()", 'وزّع']);
  if (s.purchasesOverBudget) out.push(['gold','bag','تجاوزت سقف المشتريات', 'بـ '+num_(s.purchasesSpent - s.purchaseBudget)+' ريال', "go('purchases')", 'عرض']);
  (d.reserveStatus || []).filter(function(r){ return !r.depositedThisCycle; }).slice(0,2).forEach(function(r){
    out.push(['purple','gem','جنّب لـ '+esc(r.name), num_(r.monthly)+' ريال هذه الدورة', "go('savings')", 'جنّب']);
  });
  if (!out.length) return '';
  return '<div class="sec"><h3>يحتاج انتباهك</h3></div><div class="glist">' + out.slice(0, S.allAlerts ? 20 : 3).map(function(a){
      return '<button class="grow a-'+a[0]+'" onclick="'+a[4].replace(/"/g,'&quot;')+'"><span class="g-ic">'+ico(a[1])+'</span>'
        + '<span class="g-tx"><b>'+a[2]+'</b><small>'+a[3]+'</small></span><span class="g-act">'+a[5]+'</span></button>';
    }).join('')
    + (out.length > 3 ? '<button class="g-more" onclick="S.allAlerts=!S.allAlerts;render()">'+(S.allAlerts?'أقل':'عرض '+(out.length-3)+' أخرى')+'</button>' : '')
    + '</div>';
}

function dues_(){
  var list = S.data.obligations.filter(function(o){ return !o.paid && (o.daysLeft <= 10 || o.overdue); })
    .sort(function(a,b){ return a.dueDate < b.dueDate ? -1 : 1; }).slice(0, 6);
  var head = '<div class="sec"><h3>القادم</h3><button class="sec-l" onclick="go(\'paylog\')">السجل</button></div>';
  if (!list.length) return head + '<div class="glist"><div class="grow quiet"><span class="g-ic ok">'+ico('check')+'</span><span class="g-tx"><b>لا شيء مستحق خلال ١٠ أيام</b><small>الاستحقاقات تظهر هنا قبل موعدها</small></span></div></div>';
  return head + '<div class="glist">' + list.map(function(o){
    var a = dd_(o.dueDate);
    var when = o.overdue ? 'متأخر '+Math.abs(o.daysLeft)+' يوم' : o.daysLeft === 0 ? 'اليوم' : o.daysLeft === 1 ? 'غداً' : o.daysLeft < 0 ? 'يُصرف خلال الدورة' : 'بعد '+o.daysLeft+' أيام';
    var src = (o.sources || []).map(function(x){ return x.sourceName; }).filter(Boolean).join(' + ');
    return '<div class="grow due'+(o.overdue?' late':o.daysLeft<=1?' soon':'')+'">'
      + '<span class="d-box"><b>'+a.d+'</b><small>'+a.m+'</small></span>'
      + '<span class="g-tx"><b>'+esc(o.name)+'</b><small>'+when+(src?' · '+esc(src):'')+'</small></span>'
      + '<span class="d-end"><b>'+num_(o.remainingAmount || o.amount)+'</b>'
      + (o.autoDeduct ? '<em>يُخصم تلقائياً</em>' : '<button onclick="pay(\''+o.id+'\',true)">سدّدت</button>') + '</span></div>';
  }).join('') + '</div>';
}

function cycleFigures_(){
  var s = S.data.summary;
  var bar = function(a, b, cls){ var p = b > 0 ? Math.min(100, a/b*100) : 0; return '<span class="mb '+(cls||'')+'"><i style="width:'+p.toFixed(1)+'%"></i></span>'; };
  var row = function(icon, lbl, val, note, b){
    return '<div class="grow fig"><span class="g-ic">'+ico(icon)+'</span><span class="g-tx"><b>'+lbl+'</b><small>'+note+'</small>'+b+'</span>'
      + '<span class="f-v">'+num_(val)+'</span></div>';
  };
  return '<div class="sec"><h3>هذه الدورة</h3><button class="sec-l" onclick="go(\'reports\')">التقارير</button></div><div class="glist">'
    + row('wallet','الدخل', s.incomeExpected, 'نزل منه '+num_(s.incomeRealized), bar(s.incomeRealized, s.incomeExpected, 'in'))
    + row('list','الالتزامات', s.plannedObligations, 'سُدِّد '+num_(s.paidObligations)+' · باقٍ '+num_(s.unpaidObligations), bar(s.paidObligations, s.plannedObligations))
    + row('bag','المشتريات', s.purchasesSpent, s.purchaseBudget ? 'من سقف '+num_(s.purchaseBudget) : 'بلا سقف محدد', bar(s.purchasesSpent, s.purchaseBudget || s.purchasesSpent, s.purchasesOverBudget ? 'over' : ''))
    + row('gem','الادخار المقترح', s.suggestedSaving, s.savingsRate+'% من المتبقي الآمن', '')
    + (s.opening ? row('down','المرحَّل من قبل', s.opening, 'رصيد الدورة السابقة', '') : '')
    + '</div>';
}

function sources_(){
  var bd = S.data.sourceBreakdown;
  if (!bd.length) return '';
  return '<div class="sec"><h3>مصادر دخلك</h3><button class="sec-l" onclick="go(\'income\')">إدارة</button></div><div class="glist">'
    + bd.map(function(b){
        var used = Math.min(100, Math.max(0, (b.usage || 0) * 100));
        return '<button class="grow src" onclick="go(\'income\')"><span class="g-tx"><b>'+esc(b.name)+'</b>'
          + '<small>'+(b.arrived ? 'نزل' : 'ينزل يوم '+b.day)+' · مربوط '+num_(b.allocated)+' من '+num_(b.amount)+'</small>'
          + '<span class="mb'+(b.free<0?' over':'')+'"><i style="width:'+used.toFixed(1)+'%"></i></span></span>'
          + '<span class="f-v '+(b.free<0?'neg':'')+'">'+(b.free<0?'−':'')+num_(Math.abs(b.free))+'<small>'+(b.free<0?'عجز':'حر')+'</small></span></button>';
      }).join('') + '</div>';
}

function pDash(){
  if (!S.data) return '';
  return '<div class="home">' + hero_() + quick_() + alerts_() + startWindowNote() + arrearsPanel() + dues_() + cycleFigures_() + sources_() + '</div>';
}
function drawCharts(){}
function upcoming(){ return dues_(); }

/* ============================================================ الالتزامات ============================================================ */
function obFilterCount_(){
  var f = S.f, n = 0;
  ['source','priority','recurrence','category'].forEach(function(k){ if (f[k] !== 'all') n++; });
  if (f.from) n++; if (f.to) n++;
  return n;
}
function openObFilter(){
  var f = S.f;
  modal('<div class="sheet-t">تصفية الالتزامات</div>'
    + fld('مصدر السداد','<select onchange="fset(\'source\',this.value)"><option value="all">كل المصادر</option>'
      + S.data.incomes.filter(function(i){ return i.isBasic; }).map(function(i){
          return '<option value="'+i.id+'"'+(f.source===i.id?' selected':'')+'>'+esc(i.name)+'</option>'; }).join('')+'</select>')
    + fld('الأولوية','<select onchange="fset(\'priority\',this.value)">'+opts(['all|الكل','عالية|عالية','متوسطة|متوسطة','منخفضة|منخفضة'], f.priority)+'</select>')
    + fld('التكرار','<select onchange="fset(\'recurrence\',this.value)">'+opts(['all|الكل','أسبوعي|أسبوعي','كل أسبوعين|كل أسبوعين','شهري|شهري','ربع سنوي|ربع سنوي','نصف سنوي|نصف سنوي','سنوي|سنوي','مرة واحدة|مرة واحدة'], f.recurrence)+'</select>')
    + fld('التصنيف','<select onchange="fset(\'category\',this.value)"><option value="all">الكل</option>'
      + (S.data.settings.obligationCategories || []).map(function(c){
          return '<option value="'+attr(c)+'"'+(f.category===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select>')
    + '<div class="two">'+fld('موعده من','<input type="date" value="'+attr(f.from)+'" onchange="fset(\'from\',this.value)">')
    + fld('إلى','<input type="date" value="'+attr(f.to)+'" onchange="fset(\'to\',this.value)">')+'</div>'
    + '<div class="macts"><button class="btn-main" onclick="closeModal()">عرض النتائج</button><button class="btn" onclick="fReset();closeModal()">مسح التصفية</button></div>');
}

function obManage(){
  var f = S.f, all = S.allObs;
  if (!all) return waitOrErr('allObs','جاري تحميل الالتزامات…','loadAllObs()');
  var list = all.filter(function(o){
    if (f.quick === 'unalloc' && o.unallocatedAmount <= 0) return false;
    if (f.quick === 'fun' && o.type !== 'ترفيهي') return false;
    if (f.quick === 'once' && o.recurring) return false;
    if (f.quick === 'ending' && !o.endDate) return false;
    if (f.quick === 'ended' && !o.ended) return false;
    if (f.quick === 'inactive' && o.active) return false;
    if (f.source !== 'all' && !o.sources.some(function(s){ return s.sourceId === f.source; })) return false;
    if (f.priority !== 'all' && o.priority !== f.priority) return false;
    if (f.recurrence !== 'all' && (o.recurrence || 'شهري') !== f.recurrence) return false;
    if (f.category !== 'all' && o.category !== f.category) return false;
    if (f.from && (o.nextDue || '') < f.from) return false;
    if (f.to && (o.nextDue || '9999') > f.to) return false;
    if (f.q){
      var hay = (o.name+' '+o.notes+' '+o.sources.map(function(s){ return s.sourceName; }).join(' ')).toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
    }
    return true;
  }).sort(function(a,b){ return (a.nextDue || '9999') < (b.nextDue || '9999') ? -1 : 1; });

  var unalloc = all.filter(function(o){ return o.unallocatedAmount > 0; });
  var live = all.filter(function(o){ return o.active && !o.ended; });
  var monthly = live.reduce(function(x,o){ return x + (Number(o.amount)||0); }, 0);
  var cnt = function(k){
    return k==='all' ? all.length : k==='unalloc' ? unalloc.length : k==='fun' ? all.filter(function(o){ return o.type==='ترفيهي'; }).length
      : k==='once' ? all.filter(function(o){ return !o.recurring; }).length : k==='ending' ? all.filter(function(o){ return !!o.endDate; }).length
      : k==='ended' ? all.filter(function(o){ return o.ended; }).length : all.filter(function(o){ return !o.active; }).length;
  };
  var nf = obFilterCount_();
  var cats = {};
  live.forEach(function(o){ var c = o.category || 'أخرى'; cats[c] = (cats[c]||0) + (Number(o.amount)||0); });
  var catList = Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; });

  return '<section class="ob-sum">'
    + '<div><small>مجموع التزاماتك في الدورة</small><b>'+num_(monthly)+'<em>ريال</em></b><span>'+live.length+' التزام نشط</span></div>'
    + (unalloc.length
        ? '<button class="pill warn" onclick="aiAllocOpen(\'unassigned\')">'+ico('bolt')+'وزّع '+unalloc.length+' بلا مصدر</button>'
        : '<span class="pill ok">'+ico('check')+'كلها مربوطة</span>')
    + (catList.length > 1 ? '<div class="stack">'+catList.map(function(c,i){
        return '<i style="flex:'+cats[c]+'" class="k'+(i%6)+'" title="'+attr(c)+'"></i>'; }).join('')+'</div>'
      + '<div class="stack-l">'+catList.slice(0,4).map(function(c,i){
        return '<span><i class="k'+i+'"></i>'+esc(c)+' '+Math.round(cats[c]/monthly*100)+'%</span>'; }).join('')+'</div>' : '')
    + '</section>'
    + '<div class="ob-search">'+ico('search')+'<input id="obq" value="'+attr(f.q)+'" oninput="obSearch(this.value)" placeholder="ابحث بالاسم أو المصدر">'
    +   '<button class="'+(nf?'on':'')+'" onclick="openObFilter()" aria-label="تصفية">'+ico('sliders')+(nf?'<b>'+nf+'</b>':'')+'</button></div>'
    + '<div class="chips">'+[['all','الكل'],['unalloc','بلا مصدر'],['fun','ترفيهي'],['once','مرة واحدة'],['ending','له نهاية'],['ended','منتهٍ'],['inactive','موقوف']]
        .filter(function(x){ return x[0]==='all' || cnt(x[0]) > 0; })
        .map(function(x){ return '<button class="'+(f.quick===x[0]?'on':'')+'" onclick="fset(\'quick\',\''+x[0]+'\')">'+x[1]+'<i>'+cnt(x[0])+'</i></button>'; }).join('')
    + '</div>'
    + obDiagPanel()
    + obTable(list)
    + '<div class="tools"><button onclick="openAllocate(\'all\')">'+ico('bolt')+'أعد توزيع الكل</button>'
    + '<button onclick="runObDiag()">'+ico('help')+'التزام لا يظهر؟</button>'
    + '<button onclick="exportCsv(\'obligations\')">'+ico('down')+'تصدير</button></div>';
}

function obTable(list){
  if (!list.length) return '<div class="empty-st">'+ico('list')+'<b>'+(S.allObs && S.allObs.length ? 'لا شيء يطابق بحثك' : 'لا التزامات بعد')+'</b>'
    + '<small>'+(S.allObs && S.allObs.length ? 'جرّب كلمة أخرى أو امسح التصفية' : 'أضف قسطاً أو فاتورة أو اشتراكاً ليظهر في دورتك')+'</small>'
    + '<button class="btn-main" onclick="'+(S.allObs && S.allObs.length ? 'fReset()' : 'openOblig()')+'">'+(S.allObs && S.allObs.length ? 'مسح التصفية' : 'أضف التزاماً')+'</button></div>';
  return '<div class="glist obl">' + list.map(function(o){
    var isOpen = S.openOb === o.id;
    var due = o.nextDue ? dd_(o.nextDue) : null;
    var meta = [o.category || 'أخرى', o.recurrence || 'شهري'];
    if (o.autoDeduct) meta.push('خصم تلقائي');
    var flags = (o.unallocatedAmount > 0 ? '<span class="fl r">بلا مصدر '+num_(o.unallocatedAmount)+'</span>' : '')
      + (o.type === 'مرن' || o.type === 'ترفيهي' ? '<span class="fl">'+esc(o.type)+'</span>' : '')
      + (o.isEstimated ? '<span class="fl g">تقديري</span>' : '')
      + (o.isExpected ? '<span class="fl g">متوقع</span>' : '')
      + (o.isShared ? '<span class="fl b">حصتك '+o.sharePercent+'%</span>' : '')
      + (o.endDate ? '<span class="fl">ينتهي '+dShort_(o.endDate)+'</span>' : '')
      + (!o.active ? '<span class="fl r">موقوف</span>' : '') + (o.ended ? '<span class="fl">منتهٍ</span>' : '');
    var srcs = o.sources.map(function(s){
      return '<span class="fl s'+(s.missing?' r':'')+'">'+esc(s.sourceName || 'مصدر محذوف')+(o.isSplit ? ' '+num_(s.amount) : '')+'</span>';
    }).join('');
    return '<article class="oc'+(isOpen?' open':'')+(o.ended || !o.active ? ' dim' : '')+'" onclick="toggleOb(\''+o.id+'\',event)">'
      + '<div class="oc-m">'
      +   '<span class="d-box">'+(due ? '<b>'+due.d+'</b><small>'+due.m+'</small>' : '<b>—</b><small>'+esc(o.status||'')+'</small>')+'</span>'
      +   '<span class="g-tx"><b>'+esc(o.name)+'</b><small>'+meta.map(esc).join('، ')+'</small></span>'
      +   '<span class="d-end"><b>'+num_(o.amount)+'</b><em>'+(o.occurrences > 1 ? num_(o.unitAmount)+' × '+o.occurrences : 'ريال')+'</em></span>'
      + '</div>'
      + ((srcs || flags) ? '<div class="oc-f">'+srcs+flags+'</div>' : '')
      + (isOpen
          ? '<div class="oc-x">'+timelineBlock()
            + '<div class="oc-acts">'
            + (o.isEstimated ? '<button onclick="aiPredict(\''+o.id+'\',\''+attrJs(o.name)+'\')">'+ico('spark')+'توقّع المبلغ</button>' : '')
            + '<button onclick="openOblig(\''+o.id+'\')">تعديل</button>'
            + '<button class="del" onclick="delOblig(\''+o.id+'\')">حذف</button></div></div>'
          : '')
      + '</article>';
  }).join('') + '</div>';
}

function timelineBlock(){
  var t = S.timeline;
  if (!t){
    if (S.errs.timeline) return '<div class="note n-red">تعذّر جلب الدورات: '+esc(S.errs.timeline)+'</div>';
    return '<div class="tl-wait">جاري جلب الدورات…</div>';
  }
  var pct = t.totalDue ? Math.min(100, Math.round(t.totalPaid / t.totalDue * 100)) : 0;
  return '<div class="tlm"><div class="tlm-h"><span>سُدِّد '+num_(t.totalPaid)+' من '+num_(t.totalDue)+'</span>'
    + (t.unpaidCycles ? '<span class="neg">'+t.unpaidCycles+' دورة لم تُسدَّد</span>' : '<span class="pos">لا متأخرات</span>')+'</div>'
    + '<span class="mb"><i style="width:'+pct+'%"></i></span>'
    + (t.rows.length ? t.rows.map(function(x){
        var cls = x.remaining <= 0 ? 'done' : (x.overdue ? 'late' : '');
        return '<div class="tlm-r '+cls+(x.isCurrent?' cur':'')+'">'
          + '<i class="tlm-dot"></i><div class="tlm-c"><b>'+arDate(x.dueDate)+'</b><small>'+(x.isCurrent?'الدورة الحالية · ':'')+esc(x.status)+'</small></div>'
          + '<div class="tlm-v"><b>'+num_(x.amount)+'</b>'+(x.paidAmount && x.remaining > 0 ? '<small>سُدّد '+num_(x.paidAmount)+'</small>' : '')+'</div>'
          + '<div class="tlm-a">'+cycleActions(t, x)+'</div></div>';
      }).join('') : '<div class="tl-wait">لا دورات في المدى المعروض.</div>')
    + '</div>';
}

function busy(on, text){
  el('loadTxt').textContent = text || 'لحظة…';
  el('load').classList.toggle('hidden', !on);
}

/* ============================================================ مصادر الدخل ============================================================ */
function pIncome(){
  var list = S.data.incomes;
  if (!list.length) return '<div class="empty-st">'+ico('wallet')+'<b>أضف راتبك أولاً</b><small>كل الحسابات تبدأ من مصدر دخلك الأساسي ويوم نزوله</small>'
    + '<button class="btn-main" onclick="openIncome()">إضافة مصدر</button></div>';
  var live = list.filter(function(i){ return i.isGuaranteed && !i.paused && i.inWindow; });
  var total = live.reduce(function(s,i){ return s+i.amount; },0);
  var got = live.filter(function(i){ return i.arrived; }).reduce(function(s,i){ return s+(i.actualAmount||i.amount); },0);
  var potential = list.filter(function(i){ return !i.isGuaranteed && !i.paused && !i.arrived; });
  var outside = list.filter(function(i){ return i.isBasic && !i.paused && !i.inWindow; });
  var pct = total ? Math.min(100, got/total*100) : 0;

  return '<details class="intro"><summary>'+ico('help')+'الثابت والمتغير والأساسي — ما الفرق؟</summary><div class="note n-blue">'
    + 'المصدر <strong>الثابت</strong> يُحتسب نازلاً تلقائياً بمجرد مرور يوم نزوله. '
    + 'أما <strong>المتغير</strong> فتؤكّد نزوله وتكتب مبلغه الفعلي. '
    + 'والدخل <strong>الأساسي</strong> وحده يدخل الخطة والتوزيع؛ الإضافي يزيد سيولتك بعد نزوله فقط.</div></details>'
    + '<section class="ob-sum"><div><small>دخلك المضمون في الدورة</small><b>'+num_(total)+'<em>ريال</em></b>'
    +   '<span>نزل منه '+num_(got)+'</span></div>'
    +   '<span class="pill '+(pct>=100?'ok':'')+'">'+ico(pct>=100?'check':'down')+(pct>=100?'نزل كله':Math.round(pct)+'% نزل')+'</span>'
    +   '<span class="mb in" style="grid-column:1/-1"><i style="width:'+pct.toFixed(1)+'%"></i></span></section>'
    + (outside.length ? '<div class="note n-gold" style="margin-top:12px">خارج بداية عملك ولا يدخل هذه الدورة: '
        + outside.map(function(i){ return esc(i.name); }).join('، ') + '. يعود تلقائياً في الدورة القادمة.</div>' : '')
    + (potential.length ? '<div class="note n-gold" style="margin-top:12px">دخل محتمل لا يدخل الخطة حتى ينزل: '
        + potential.map(function(i){ return esc(i.name)+' ('+num_(i.amount)+(i.hasSchedule?'':'، بلا موعد')+')'; }).join('، ')+'</div>' : '')
    + '<div class="sec"><h3>مصادرك</h3></div><div class="glist">'
    + list.map(function(i){
        var ld = srcLoad(i.id), use = i.amount ? Math.min(100, ld.amount/i.amount*100) : 0, free = i.amount - ld.amount;
        var st = i.paused ? ['r','موقوف'] : !i.inWindow ? ['','قبل البداية'] : i.arrived ? ['ok','نزل'] : !i.hasSchedule ? ['g','بانتظار نزوله'] : ['','لم ينزل'];
        var canArrive = (i.isVariable || !i.hasSchedule) && !i.paused && i.inWindow;
        return '<div class="inc'+(i.paused?' dim':'')+'">'
          + '<div class="grow"><span class="g-ic '+(i.arrived?'ok':'')+'">'+ico(i.arrived?'check':'wallet')+'</span>'
          +   '<span class="g-tx"><b>'+esc(i.name)+'</b><small>'
          +     (i.hasSchedule ? 'ينزل يوم '+i.day : 'موعده غير محدد')+'، '+(i.isVariable?'متغير':'ثابت')+'، '+(i.isBasic?'أساسي':'إضافي')
          +     (i.isGuaranteed?'':'، غير مضمون')+'</small></span>'
          +   '<span class="d-end"><b>'+num_(i.amount)+'</b><em class="st '+st[0]+'">'+st[1]+'</em></span></div>'
          + (i.isBasic ? '<div class="inc-ld"><span class="mb'+(free<0?' over':'')+'"><i style="width:'+use.toFixed(1)+'%"></i></span>'
              + '<div><span>مربوط '+num_(ld.amount)+' على '+ld.count+' التزام</span><span class="'+(free<0?'neg':'')+'">'+(free<0?'عجز '+num_(-free):'يبقى '+num_(free))+'</span></div></div>' : '')
          + '<div class="inc-acts">'
          +   (canArrive ? '<button class="pri" onclick="arrive(\''+i.id+'\','+(!i.arrived)+',true)">'+(i.arrived?'عدّل المبلغ الفعلي':'سجّل نزوله')+'</button>' : '')
          +   (i.isBasic ? '<button onclick="openSrcDetail(\''+i.id+'\')">ما عليه</button>' : '')
          +   '<button onclick="openIncome(\''+i.id+'\')">تعديل</button>'
          +   '<button onclick="pause(\''+i.id+'\','+(!i.paused)+')">'+(i.paused?'استئناف':'إيقاف')+'</button>'
          +   '<button class="del" onclick="delIncome(\''+i.id+'\')">حذف</button>'
          + '</div></div>';
      }).join('') + '</div>'
    + '<div class="sec"><h3>تحويلات بين المصادر</h3><button class="sec-l" onclick="openTransfer()">تحويل جديد</button></div>'
    + transfersBody_();
}
function transfersBody_(){
  var list = S.transfers;
  if (!list) return '<div class="glist"><div class="tl-wait">جاري التحميل…</div></div>';
  if (!list.length) return '<div class="glist"><div class="grow quiet"><span class="g-ic">'+ico('wave')+'</span><span class="g-tx"><b>لا تحويلات هذه الدورة</b><small>انقل مبلغاً بين مصادرك إن دفعت التزاماً من غير راتبه</small></span></div></div>';
  return '<div class="glist">' + list.map(function(t){
    return '<div class="grow"><span class="g-ic">'+ico('wave')+'</span><span class="g-tx"><b>'+esc(t.fromName)+' ← '+esc(t.toName)+'</b><small>'+esc(t.date)+'</small></span>'
      + '<span class="d-end"><b>'+num_(t.amount)+'</b><button class="ghost-del" onclick="delTransfer(\''+t.id+'\')">حذف</button></span></div>';
  }).join('') + '</div>';
}

/* ============================================================ سجل السداد ============================================================ */
function obPayments(){
  payDefaults();
  var arr = S.data.arrears || [], sm = S.data.summary, p = S.payr;
  var presets = [['cur','دورتي'],['next','القادمة'],['prev3','آخر ٣ دورات'],['next3','القادمة ٣'],['year','هذه السنة']];
  var period = '<div class="chips">' + presets.map(function(x){
      return '<button onclick="payPreset(\''+x[0]+'\')">'+x[1]+'</button>'; }).join('') + '</div>'
    + '<details class="range"><summary>'+ico('cal')+'<span>'+(p.from ? dShort_(p.from)+' ← '+dShort_(p.to) : 'اختر فترة')+'</span></summary>'
    + '<div class="two"><label class="field"><span>من</span><input type="date" value="'+attr(p.from)+'" onchange="payRange(this.value,S.payr.to)"></label>'
    + '<label class="field"><span>إلى</span><input type="date" value="'+attr(p.to)+'" onchange="payRange(S.payr.from,this.value)"></label></div></details>';

  var arrBlock = arr.length
    ? '<div class="sec"><h3>متأخرات من دورات سابقة</h3><span class="sec-n neg">'+num_(sm.arrearsTotal)+'</span></div><div class="glist">'
      + arr.map(function(a){
          var x = dd_(a.dueDate);
          return '<div class="grow due late"><span class="d-box"><b>'+x.d+'</b><small>'+x.m+'</small></span>'
            + '<span class="g-tx"><b>'+esc(a.name)+'</b><small>تأخر '+a.monthsLate+' دورة</small></span>'
            + '<span class="d-end"><b>'+num_(a.amount)+'</b><button onclick="payArrear(\''+a.id+'\',\''+a.month+'\')">سدّدها</button></span></div>';
        }).join('') + '</div>'
    : '';

  if (!p.data) return period + arrBlock + waitOrErr('payr','جاري جلب ما استحق في الفترة…','loadPayRange()');

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
  var pct = t.due ? Math.min(100, Math.round(t.paid / t.due * 100)) : 0;

  return '<section class="ob-sum"><div><small>سدّدت في هذه الفترة</small><b>'+num_(t.paid)+'<em>من '+num_(t.due)+'</em></b>'
    + '<span>'+t.paidCount+' من '+t.count+' استحقاق</span></div>'
    + '<span class="pill '+(pct>=100?'ok':'')+'">'+pct+'%</span>'
    + '<span class="mb" style="grid-column:1/-1"><i style="width:'+pct+'%"></i></span>'
    + '<div class="sum2"><div><small>بقي عليك</small><b>'+num_(t.remaining)+'</b></div><div><small>منه متأخر</small><b class="'+(t.overdue?'neg':'')+'">'+num_(t.overdue)+'</b></div></div>'
    + '</section>'
    + period
    + arrBlock
    + '<div class="sec"><h3>الاستحقاقات</h3><button class="sec-l" onclick="exportCsv(\'payments\')">تصدير</button></div>'
    + '<div class="ob-search">'+ico('search')+'<input id="payq" value="'+attr(p.q)+'" oninput="paySearch(this.value)" placeholder="ابحث باسم الالتزام"></div>'
    + '<div class="chips">' + [['all','الكل',d.rows.length],['unpaid','الباقي',cnt(function(o){return !o.paid;})],
         ['overdue','متأخر',cnt(function(o){return o.overdue;})],['partial','جزئي',cnt(function(o){return o.paidAmount>0&&!o.paid;})],
         ['paid','مسدَّد',cnt(function(o){return o.paid;})]]
        .filter(function(x){ return x[0]==='all' || x[2] > 0; })
        .map(function(x){ return '<button class="'+(p.status===x[0]?'on':'')+'" onclick="S.payr.status=\''+x[0]+'\';render()">'+x[1]+'<i>'+x[2]+'</i></button>'; }).join('')
    + '</div>'
    + (list.length ? rangeRows(list) : '<div class="empty-st">'+ico('check')+'<b>لا شيء هنا</b><small>جرّب فترة أو تصفية أخرى</small></div>');
}
function rangeRows(list){
  return '<div class="glist">' + list.map(function(o){
    var x = dd_(o.dueDate);
    var cls = o.paid ? ' paid' : o.overdue ? ' late' : o.daysLeft <= 1 && o.daysLeft >= 0 ? ' soon' : '';
    var state = o.autoDeduct ? (o.autoPaid ? 'خُصم تلقائياً' : 'يُخصم تلقائياً')
      : o.paid ? 'مسدَّد' : o.paidAmount > 0 ? 'سُدّد '+num_(o.paidAmount)+' من '+num_(o.amount) : dayLabel(o);
    var acts = o.autoDeduct ? ''
      : o.paidAmount > 0
        ? (!o.paid ? '<button onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\','+o.amount+')">أكمل</button>' : '')
          + '<button class="ghost-del" onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\',0)">تراجع</button>'
        : '<button onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\','+o.amount+')">سدّدت</button>';
    return '<div class="grow due'+cls+'"><span class="d-box">'+(o.paid ? ico('check') : '<b>'+x.d+'</b><small>'+x.m+'</small>')+'</span>'
      + '<span class="g-tx"><b>'+esc(o.name)+'</b><small>'+state+'</small></span>'
      + '<span class="d-end"><b>'+num_(o.paid ? o.amount : o.remainingAmount)+'</b>'+acts+'</span></div>';
  }).join('') + '</div>';
}

/* ============================================================ التدفق اليومي ============================================================ */
function pFlow(){
  var f = S.flow;
  if (!f) return waitOrErr('flow','جاري حساب التدفق اليومي…','loadFlow()');
  var low = f.days.reduce(function(a,b){ return b.balance < a.balance ? b : a; }, f.days[0] || { balance:0, date:'' });
  return '<section class="hero">'
    + '<div class="h-lbl">الرصيد المتوقع آخر الدورة</div>'
    + '<div class="h-num'+(f.closing<0?' neg':'')+'"><span>'+(f.closing<0?'−':'')+num_(Math.abs(f.closing))+'</span><em>ريال</em></div>'
    + '<div class="h-sub">'+(f.firstNegative ? 'ينقلب سالباً يوم <b>'+dShort_(f.firstNegative.date)+'</b> — المشكلة في التوقيت لا في المجموع'
        : 'يبقى موجباً كل الأيام. أدنى نقطة <b>'+num_(low.balance)+'</b> يوم '+dShort_(low.date))+'</div>'
    + '<div class="fc-wrap">'+flowChart_(f)+nowTag_(f)+'</div>'
    + '<div class="h-axis"><span>'+dShort_(f.start)+'</span><span>'+dShort_(f.end)+'</span></div>'
    + '</section>'
    + (f.firstNegative ? '<div class="note n-red" style="margin-top:12px">السبب: '+f.firstNegative.causes.map(function(c){ return esc(c.label)+' ('+num_(-c.amount)+')'; }).join('، ')+'</div>' : '')
    + '<div class="sec"><h3>الأرقام</h3></div><div class="glist">'
    + '<div class="grow fig"><span class="g-ic">'+ico('wallet')+'</span><span class="g-tx"><b>الرصيد الافتتاحي</b><small>'+dShort_(f.start)+'</small></span><span class="f-v">'+num_(f.opening)+'</span></div>'
    + '<div class="grow fig"><span class="g-ic">'+ico('down')+'</span><span class="g-tx"><b>أدنى رصيد</b><small>'+dShort_(low.date)+'</small></span><span class="f-v'+(low.balance<0?' neg':'')+'">'+num_(low.balance)+'</span></div>'
    + '<div class="grow fig"><span class="g-ic">'+ico('bag')+'</span><span class="g-tx"><b>نثريات متوقعة يومياً</b><small>موزّعة على ما تبقّى</small></span><span class="f-v">'+num_(f.plannedDailyPurchase)+'</span></div>'
    + '</div>'
    + '<div class="sec"><h3>الأيام التي فيها حركة</h3></div><div class="glist">'
    + f.days.filter(function(d){ return d.events.length; }).map(function(d){
        var x = dd_(d.date);
        return '<div class="grow day'+(d.balance<0?' late':'')+(d.isToday?' soon':'')+'"><span class="d-box"><b>'+x.d+'</b><small>'+x.m+'</small></span>'
          + '<span class="g-tx"><span class="evs">'+d.events.map(function(e){
              var c = e.kind==='income' ? 'in' : e.kind==='plannedPurchase' ? 'pl' : 'out';
              return '<span class="ev '+c+'">'+esc(e.label)+' <b>'+(e.amount>0?'+':'−')+num_(Math.abs(e.amount))+'</b></span>';
            }).join('')+'</span></span>'
          + '<span class="f-v'+(d.balance<0?' neg':'')+'">'+num_(d.balance)+'<small>الرصيد</small></span></div>';
      }).join('') + '</div>'
    + sensPanel();
}
