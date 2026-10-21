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
  shield:'<path d="M12 3.5l7.5 2.8v5.4c0 4.3-3.2 7.9-7.5 8.8-4.3-.9-7.5-4.5-7.5-8.8V6.3z"/><path d="m9 12 2 2 4-4"/>',
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
      + obPayRow_(o)
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

function obPayRow_(o){
  var c = find(S.data.obligations, o.id);
  if (!c) return '';
  var lbl = 'هذه الدورة · '+dShort_(c.dueDate);
  if (c.autoDeduct) return '<div class="oc-pay"><span>'+lbl+'</span><em class="st '+(c.autoPaid?'ok':'')+'">'+(c.autoPaid?'خُصم تلقائياً':'يُخصم تلقائياً')+'</em></div>';
  if (c.paid) return '<div class="oc-pay"><span>'+lbl+'</span><em class="st ok">'+ico('check')+'مسدَّد '+num_(c.paidAmount)+'</em>'
    + '<button class="ghost-del" onclick="undoPay(\''+o.id+'\',\''+attrJs(o.name)+'\')">تراجع</button></div>';
  return '<div class="oc-pay'+(c.overdue?' late':'')+'"><span>'+lbl+(c.overdue?' · متأخر':'')+(c.paidAmount>0?' · سُدّد '+num_(c.paidAmount)+' من '+num_(c.amount):'')+'</span>'
    + '<span class="pay2"><button onclick="pay(\''+o.id+'\',true)">'+(c.paidAmount>0?'أكمل '+num_(c.remainingAmount):'سدّدت '+num_(c.amount))+'</button>'
    + '<button class="pt" onclick="payPart(\''+o.id+'\')">دفعة جزئية</button></span></div>';
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
        : '<span class="pay2"><button onclick="rangePay(\''+o.id+'\',\''+o.cycle+'\','+o.amount+')">سدّدت</button>'
          + '<button class="pt" onclick="cyclePartial(\''+o.id+'\',\''+o.cycle+'\','+o.amount+','+o.paidAmount+')">جزء</button></span>';
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

/* ============================================================
 *  الإصدار الثالث للرئيسية: حلقة الدورة + «وش قدامك» + أزرار السداد
 * ========================================================== */
function evtsOfCycle_(){
  var d = S.data, cr = d.settings.cycleRange || {}, out = [];
  d.obligations.forEach(function(o){
    if (!o.dueDate || o.dueDate < cr.start || o.dueDate > cr.end) return;
    out.push({ kind:'ob', id:o.id, name:o.name, date:o.dueDate, amount:o.paid ? o.amount : (o.remainingAmount || o.amount),
               state: o.paid ? 'paid' : o.overdue ? 'late' : o.autoDeduct ? 'auto' : 'due', auto:o.autoDeduct, o:o });
  });
  d.incomes.forEach(function(i){
    if (i.paused || !i.occurrenceDate || i.occurrenceDate < cr.start || i.occurrenceDate > cr.end) return;
    out.push({ kind:'in', id:i.id, name:i.name, date:i.occurrenceDate, amount:i.arrived && i.actualAmount ? i.actualAmount : i.amount,
               state: i.arrived ? 'got' : 'wait' });
  });
  out.sort(function(a,b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.kind === 'in' ? -1 : 1); });
  return out;
}
function ring_(){
  var d = S.data, s = d.summary, cr = d.settings.cycleRange || { start:TODAY_ISO, end:TODAY_ISO };
  var total = Math.max(1, days_(cr.start, cr.end) + 1);
  var isCur = d.month === currentCycle();
  var passed = isCur ? Math.min(total, Math.max(0, days_(cr.start, TODAY_ISO) + .5)) : (d.month < currentCycle() ? total : 0);
  var C = 150, R = 116, RI = 92;
  var ang = function(iso){ return -Math.PI/2 - Math.min(total, Math.max(0, days_(cr.start, iso) + .5)) / total * 2 * Math.PI; };
  var at = function(a, r){ return [C + r*Math.cos(a), C + r*Math.sin(a)]; };
  var ev = evtsOfCycle_(); S._evts = ev;
  var stack = {}, marks = '';
  ev.forEach(function(e, idx){
    var a = ang(e.date), key = e.kind + e.date, k = stack[key] = (stack[key] || 0) + 1;
    if (e.kind === 'ob'){
      var p = at(a, R + (k-1) * 13);
      marks += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="6" class="rk ob '+e.state+'" onclick="ringTap('+idx+')"><title>'+esc(e.name)+'</title></circle>';
    } else {
      var q = at(a, RI - (k-1) * 13), x = q[0].toFixed(1), y = q[1].toFixed(1);
      marks += '<rect x="'+(q[0]-6).toFixed(1)+'" y="'+(q[1]-6).toFixed(1)+'" width="12" height="12" rx="3" class="rk in '+e.state+'" transform="rotate(45 '+x+' '+y+')" onclick="ringTap('+idx+')"><title>'+esc(e.name)+'</title></rect>';
    }
  });
  var arc = '';
  if (passed > 0){
    var a1 = ang(cr.start) + .5/total*2*Math.PI, a2 = -Math.PI/2 - passed/total*2*Math.PI, p1 = at(-Math.PI/2, R), p2 = at(a2, R);
    arc = passed >= total ? '<circle cx="'+C+'" cy="'+C+'" r="'+R+'" class="r-arc"/>'
      : '<path d="M'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+' A'+R+' '+R+' 0 '+(passed/total > .5 ? 1 : 0)+' 0 '+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+'" class="r-arc"/>';
  }
  var now = isCur ? at(-Math.PI/2 - passed/total*2*Math.PI, R) : null;
  var next = d.incomes.filter(function(i){ return i.isBasic && !i.paused && !i.arrived && i.occurrenceDate && i.occurrenceDate >= TODAY_ISO; })
    .sort(function(a,b){ return a.occurrenceDate < b.occurrenceDate ? -1 : 1; })[0];
  var left = next ? days_(TODAY_ISO, next.occurrenceDate) : Math.max(0, days_(TODAY_ISO, cr.end) + 1);
  var safe = s.safeRemaining;
  var tick = '';
  for (var t = 0; t < total; t++){
    var ta = -Math.PI/2 - t/total*2*Math.PI, o1 = at(ta, R + 15), o2 = at(ta, R + (t % 7 === 0 ? 20 : 17));
    tick += '<line x1="'+o1[0].toFixed(1)+'" y1="'+o1[1].toFixed(1)+'" x2="'+o2[0].toFixed(1)+'" y2="'+o2[1].toFixed(1)+'" class="r-tick'+(t % 7 === 0 ? ' w' : '')+'"/>';
  }
  var sd = dd_(cr.start), ed = dd_(cr.end);
  return '<section class="ring-card">'
    + '<div class="ring-wrap"><svg viewBox="0 0 300 300" class="ring" role="img" aria-label="دورتك من الراتب إلى الراتب">'
    +   '<defs><linearGradient id="rgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient>'
    +   '<radialGradient id="rgG"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>'
    +   tick
    +   '<circle cx="150" cy="150" r="'+R+'" class="r-trk"/>'
    +   '<circle cx="150" cy="150" r="'+RI+'" class="r-in"/>'
    +   arc + marks
    +   (now ? '<circle cx="'+now[0].toFixed(1)+'" cy="'+now[1].toFixed(1)+'" r="17" fill="url(#rgG)"/><circle cx="'+now[0].toFixed(1)+'" cy="'+now[1].toFixed(1)+'" r="7.5" class="r-now"/>' : '')
    + '</svg>'
    + '<div class="ring-c"><small>المتبقي الآمن</small><strong class="'+(safe<0?'neg':'')+'">'+(safe<0?'−':'')+num_(Math.abs(safe))+'</strong><em>ريال</em>'
    +   '<span class="ring-left">'+(next ? (left === 0 ? esc(next.name)+' ينزل اليوم' : 'باقي '+left+' '+(left===1?'يوم':left<=10?'أيام':'يوماً')+' على '+esc(next.name))
            : isCur ? 'باقي '+left+' '+(left<=10?'أيام':'يوماً')+' في الدورة' : monthName(d.month))+'</span></div>'
    + '<span class="ring-s r1">'+sd.d+' '+sd.m+'</span><span class="ring-s r2">'+ed.d+' '+ed.m+'</span>'
    + '</div>'
    + '<div id="ringInfo" class="ring-info">'+'<span class="lg"><i class="lg-ob"></i>التزام</span><span class="lg"><i class="lg-ob" style="background:var(--green)"></i>مسدَّد</span><span class="lg"><i class="lg-ob" style="background:var(--red)"></i>متأخر</span><span class="lg"><i class="lg-in"></i>دخل</span><span class="lg"><i class="lg-now"></i>اليوم</span><span class="lg tap">اضغط أي علامة</span>'+'</div>'
    + '</section>';
}
function ringTap(i){
  var e = (S._evts || [])[i], box = el('ringInfo');
  if (!e || !box) return;
  var x = dd_(e.date), rel = days_(TODAY_ISO, e.date);
  var when = rel === 0 ? 'اليوم' : rel === 1 ? 'غداً' : rel === -1 ? 'أمس' : rel > 0 ? 'بعد '+rel+' يوم' : 'قبل '+(-rel)+' يوم';
  var st = e.kind === 'in' ? (e.state === 'got' ? 'نزل' : 'لم ينزل بعد')
    : e.state === 'paid' ? 'مسدَّد' : e.state === 'late' ? 'متأخر' : e.state === 'auto' ? 'يُخصم تلقائياً' : 'لم يُسدَّد';
  box.innerHTML = '<div class="ri '+(e.kind==='in'?'in':'ob '+e.state)+'"><span class="ri-ic">'+ico(e.kind==='in'?'down':'list')+'</span>'
    + '<span class="g-tx"><b>'+esc(e.name)+'</b><small>'+x.d+' '+x.m+' · '+when+' · '+st+'</small></span>'
    + '<span class="ri-a">'+(e.kind==='in'?'+':'−')+num_(e.amount)+'</span>'
    + (e.kind === 'ob' && (e.state === 'due' || e.state === 'late') ? '<button onclick="pay(\''+e.id+'\',true)">سدّد</button>' : '')
    + '<button class="x" onclick="ringReset()" aria-label="إغلاق">×</button></div>';
}
function ringReset(){
  var box = el('ringInfo'); if (!box) return;
  box.innerHTML = '<span class="lg"><i class="lg-ob"></i>التزام</span><span class="lg"><i class="lg-ob" style="background:var(--green)"></i>مسدَّد</span><span class="lg"><i class="lg-ob" style="background:var(--red)"></i>متأخر</span><span class="lg"><i class="lg-in"></i>دخل</span><span class="lg"><i class="lg-now"></i>اليوم</span><span class="lg tap">اضغط أي علامة</span>';
}

/* «وش قدامك»: ما سيحدث من اليوم بالترتيب — دخل أو التزام */
function ahead_(){
  var ev = (S._evts || evtsOfCycle_()).filter(function(e){
    return e.date >= TODAY_ISO && !(e.kind === 'ob' && e.state === 'paid') && !(e.kind === 'in' && e.state === 'got');
  });
  var late = (S._evts || []).filter(function(e){ return e.kind === 'ob' && e.state === 'late'; });
  if (!ev.length && !late.length) return '';
  if (!ev.length) return '<div class="sec"><h3>وش قدامك</h3></div><div class="glist"><div class="grow quiet"><span class="g-ic ok">'+ico('check')+'</span>'
    + '<span class="g-tx"><b>لا شيء جديد حتى نهاية الدورة</b><small>بقي فقط ما فات موعده أعلاه</small></span></div></div>';
  var bal = {};
  if (S.flow && S.flow.days) S.flow.days.forEach(function(x){ bal[x.date] = x.balance; });
  var rows = ev.slice(0, S.allAhead ? 40 : 5);
  return '<div class="sec"><h3>وش قدامك</h3>'+(late.length ? '<span class="sec-n neg">'+late.length+' متأخر</span>' : '')+'</div>'
    + '<div class="glist ahead">' + rows.map(function(e, k){
        var x = dd_(e.date), rel = days_(TODAY_ISO, e.date);
        var when = rel === 0 ? 'اليوم' : rel === 1 ? 'غداً' : 'بعد '+rel+' '+(rel<=10?'أيام':'يوماً');
        var showBal = bal[e.date] !== undefined && (k === rows.length - 1 || rows[k+1].date !== e.date);
        var o = e.o;
        var btns = e.kind === 'ob' && !e.auto
          ? '<span class="pay2"><button onclick="pay(\''+e.id+'\',true)">سدّدت</button><button class="pt" onclick="payPart(\''+e.id+'\')">جزء</button></span>' : '';
        return '<div class="grow ev-'+e.kind+'">'
          + '<span class="d-box"><b>'+x.d+'</b><small>'+x.m+'</small></span>'
          + '<span class="g-tx"><b>'+esc(e.name)+'</b><small>'+when+(e.kind==='in' ? ' · دخل' : e.auto ? ' · يُخصم تلقائياً' : o && o.paidAmount > 0 ? ' · سُدّد '+num_(o.paidAmount) : '')
          +   (showBal ? ' · رصيدك بعدها '+num_(bal[e.date]) : '')+'</small></span>'
          + '<span class="d-end"><b class="'+(e.kind==='in'?'pos':'')+'">'+(e.kind==='in'?'+':'−')+num_(e.amount)+'</b>'+btns+'</span></div>';
      }).join('')
    + (ev.length > 5 ? '<button class="g-more" onclick="S.allAhead=!S.allAhead;render()">'+(S.allAhead?'أقل':'كل ما تبقى في الدورة ('+ev.length+')')+'</button>' : '')
    + '</div>';
}
function lateList_(){
  var late = S.data.obligations.filter(function(o){ return o.overdue && !o.paid; })
    .sort(function(a,b){ return a.dueDate < b.dueDate ? -1 : 1; });
  if (!late.length) return '';
  return '<div class="sec"><h3>فات موعدها</h3><span class="sec-n neg">'+num_(sum(late,'remainingAmount'))+'</span></div><div class="glist">'
    + late.slice(0, S.allLate ? 40 : 4).map(function(o){
        var x = dd_(o.dueDate);
        return '<div class="grow due late"><span class="d-box"><b>'+x.d+'</b><small>'+x.m+'</small></span>'
          + '<span class="g-tx"><b>'+esc(o.name)+'</b><small>متأخر '+Math.abs(o.daysLeft)+' يوم'+(o.paidAmount>0?' · سُدّد '+num_(o.paidAmount):'')+'</small></span>'
          + '<span class="d-end"><b>'+num_(o.remainingAmount || o.amount)+'</b><span class="pay2"><button onclick="pay(\''+o.id+'\',true)">سدّدت</button><button class="pt" onclick="payPart(\''+o.id+'\')">جزء</button></span></span></div>';
      }).join('')
    + (late.length > 4 ? '<button class="g-more" onclick="S.allLate=!S.allLate;render()">'+(S.allLate?'أقل':'عرض الكل ('+late.length+')')+'</button>' : '')
    + '</div>';
}
function flowCard_(){
  var f = S.flow;
  return '<div class="sec"><h3>رصيدك يوماً بيوم</h3><button class="sec-l" onclick="go(\'flow\')">التفاصيل</button></div>'
    + '<section class="flow-card"><div class="fc-wrap">'+flowChart_(f)+(f && f.days && S.data.month === currentCycle() ? nowTag_(f) : '')+'</div>'
    + '<div class="h-axis"><span>'+dShort_((S.data.settings.cycleRange||{}).start)+'</span><span>'+dShort_((S.data.settings.cycleRange||{}).end)+'</span></div>'
    + (f && f.days && f.days.length ? (function(){
        var low = f.days.reduce(function(a,b){ return b.balance < a.balance ? b : a; });
        return '<div class="h-foot"><span class="hf'+(f.firstNegative?' neg':'')+'">'+(f.firstNegative ? 'ينقلب سالباً يوم '+dShort_(f.firstNegative.date) : 'أدنى رصيد '+num_(low.balance)+' يوم '+dShort_(low.date))+'</span>'
          + '<span class="hf">آخر الدورة '+num_(f.closing)+'</span></div>';
      })() : '')
    + '</section>';
}
function payPart(id){
  var o = find(S.data.obligations, id);
  if (!o) return toast('لم أجد الالتزام في هذه الدورة','err');
  openPay({ id:id, name:o.name, cycle:S.month, due:o.amount, paid:o.paidAmount,
            estimated:!!o.isEstimated, flexible:o.type==='مرن'||o.type==='ترفيهي' }, 'partial');
  setTimeout(function(){ var e = el('payAmt'); if (e){ e.value = ''; e.focus(); payHint(); } }, 60);
}
function pDash(){
  if (!S.data) return '';
  S._evts = null;
  var ring = ring_();
  return '<div class="home">' + ring + quick_() + alerts_() + startWindowNote() + arrearsPanel()
    + lateList_() + ahead_() + flowCard_() + cycleFigures_() + sources_() + '</div>';
}
function dues_(){ return lateList_() + ahead_(); }

/* ============================================================
 *  مكونات عامة بلغة الرئيسية: كل اللوحات تصير قسماً بعنوان خارجي،
 *  وكل مجموعة أرقام تصير بطاقة ملخص برقم رئيسي واحد.
 * ========================================================== */
function panel(title, sub, body, extra){
  return '<section class="psec"><div class="sec"><div class="sec-t"><h3>'+title+'</h3>'+(sub ? '<small>'+sub+'</small>' : '')+'</div>'
    + (extra ? '<div class="sec-x">'+extra+'</div>' : '') + '</div><div class="pbox">'+body+'</div></section>';
}
function unit_(v){ return String(v).replace(/\s*ر\.س$/, '<em>ريال</em>'); }
function kpis(items){
  if (!items || !items.length) return '';
  var a = items[0], rest = items.slice(1);
  return '<section class="ksum"><div class="k-main"><small>'+a[0]+'</small><b class="c-'+a[2]+'">'+unit_(a[1])+'</b>'+(a[3] ? '<span>'+a[3]+'</span>' : '')+'</div>'
    + (rest.length ? '<div class="k-grid">' + rest.map(function(k){
        return '<div><small>'+k[0]+'</small><b class="c-'+k[2]+'">'+unit_(k[1])+'</b>'+(k[3] ? '<span>'+k[3]+'</span>' : '')+'</div>';
      }).join('') + '</div>' : '') + '</section>';
}
function hsum_(o){
  /* o: { label, value, unit, cls, sub, ring:{pct,txt}, pills:[[txt,cls]], grid:[[label,value,cls,sub]] } */
  return '<section class="hsum">'
    + '<div class="hs-top"><div class="hs-tx"><small>'+o.label+'</small>'
    +   '<b class="'+(o.cls||'')+'">'+o.value+(o.unit===false ? '' : '<em>'+(o.unit||'ريال')+'</em>')+'</b>'
    +   (o.sub ? '<span>'+o.sub+'</span>' : '') + '</div>'
    + (o.ring ? '<div class="hs-ring">'+ringSvg_(o.ring.pct, 86, 8)+'<div><b>'+o.ring.txt+'</b>'+(o.ring.sub ? '<small>'+o.ring.sub+'</small>' : '')+'</div></div>' : '')
    + '</div>'
    + (o.pills ? '<div class="hs-pills">'+o.pills.map(function(p){ return '<span class="pill '+(p[1]||'')+'">'+p[0]+'</span>'; }).join('')+'</div>' : '')
    + (o.grid ? '<div class="sum2 g'+o.grid.length+'">'+o.grid.map(function(g){
        return '<div><small>'+g[0]+'</small><b class="'+(g[2]||'')+'">'+g[1]+'</b>'+(g[3] ? '<span>'+g[3]+'</span>' : '')+'</div>'; }).join('')+'</div>' : '')
    + '</section>';
}
function ringSvg_(pct, size, stroke){
  size = size || 96; stroke = stroke || 9;
  var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" class="mring">'
    + '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--track)" stroke-width="'+stroke+'"/>'
    + '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="url(#rgA2)" stroke-width="'+stroke+'" stroke-linecap="round"'
    + ' stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 '+size/2+' '+size/2+') translate('+size+' 0) scale(-1 1)"/></svg>';
}
function chipsRow_(list){ return '<div class="chips">'+list.join('')+'</div>'; }
function catIc_(c){
  var m = { 'قهوة':'☕','مطاعم':'🍽','مقاضي':'🛒','مواصلات':'🚕','بنزين':'⛽','منزل':'🏠','ملابس':'👕','ترفيه':'🎬','صحة':'💊' };
  return m[c] || '•';
}
function relDay_(iso){
  var r = days_(iso, TODAY_ISO);
  return r === 0 ? 'اليوم' : r === 1 ? 'أمس' : dShort_(iso);
}

/* ============================================================ المشتريات ============================================================ */
function pPurchases(){
  var s = S.data.summary, all = S.data.purchases, cats = S.data.settings.purchaseCategories;
  var list = all.filter(function(p){
    if (S.pf.cat !== 'all' && p.category !== S.pf.cat) return false;
    if (S.pf.q && (p.item+' '+p.store+' '+p.notes).toLowerCase().indexOf(S.pf.q.toLowerCase()) < 0) return false;
    return true;
  }).sort(function(a,b){ return a.date < b.date ? 1 : -1; });
  var todayAmt = all.filter(function(p){ return p.date === TODAY_ISO; }).reduce(function(x,p){ return x+p.amount; },0);
  var pct = s.purchaseBudget ? Math.min(100, s.purchasesSpent/s.purchaseBudget*100) : 0;
  var spend = (S.data.categorySpend || []).filter(function(c){ return c.spent > 0 || c.budget > 0; })
    .sort(function(a,b){ return b.spent - a.spent; });
  var mx = spend.length ? Math.max.apply(null, spend.map(function(c){ return Math.max(c.spent, c.budget||0); })) || 1 : 1;
  var used = {}; all.forEach(function(p){ used[p.category] = 1; });

  var groups = {}, order = [];
  list.forEach(function(p){ if (!groups[p.date]){ groups[p.date] = []; order.push(p.date); } groups[p.date].push(p); });

  return hsum_({ label:'صرفت على النثريات هذه الدورة', value:num_(s.purchasesSpent), cls:s.purchasesOverBudget ? 'neg' : '',
      sub: all.length+' عملية · اليوم '+num_(todayAmt),
      ring: s.purchaseBudget ? { pct:pct, txt:Math.round(pct)+'%', sub:'من السقف' } : null,
      grid: s.purchaseBudget ? [['السقف', num_(s.purchaseBudget)], ['المتبقي منه', num_(s.purchasesLeft), s.purchasesLeft < 0 ? 'neg' : 'pos']] : null })
    + (s.purchaseBudget ? '' : '<div class="note n-gold" style="margin-top:12px">حدّد سقفاً شهرياً للنثريات من الإعدادات ليُحجز من المتبقي الآمن بدل أن يفاجئك آخر الشهر.</div>')
    + '<div class="sec"><h3>سجّل بسرعة</h3></div>' + quickBar(cats)
    + '<div class="tools">'
    +   '<button onclick="openReceipt()">'+ico('receipt')+'صوّر فاتورة</button>'
    +   '<button onclick="openSms()">'+ico('down')+'لصق رسائل البنك</button>'
    +   '<button onclick="openNlp()">'+ico('spark')+'اكتب بالكلام</button>'
    +   '<button onclick="openRecurring()">'+ico('refresh')+'المتكررة</button>'
    + '</div>'
    + '<div class="sec"><h3>حسب التصنيف</h3><button class="sec-l" onclick="openCatBudgets()">السقوف</button></div>'
    + (spend.length ? '<div class="glist">' + spend.map(function(c){
        var w = Math.min(100, c.spent/mx*100), bw = c.budget ? Math.min(100, c.budget/mx*100) : 0;
        return '<button class="grow cat'+(c.over?' over':'')+'" onclick="S.pf.cat=\''+attrJs(c.category)+'\';render()">'
          + '<span class="g-ic emo">'+catIc_(c.category)+'</span>'
          + '<span class="g-tx"><b>'+esc(c.category)+'</b><small>'+(c.budget ? (c.over ? 'تجاوز السقف بـ '+num_(c.spent-c.budget) : 'من سقف '+num_(c.budget)) : 'بلا سقف')+'</small>'
          +   '<span class="mb cmb'+(c.over?' over':'')+'"><i style="width:'+w.toFixed(1)+'%"></i>'+(bw ? '<u style="right:'+bw.toFixed(1)+'%"></u>' : '')+'</span></span>'
          + '<span class="f-v'+(c.over?' neg':'')+'">'+num_(c.spent)+'</span></button>';
      }).join('') + '</div>' : '<div class="empty-st">'+ico('bag')+'<b>لا مشتريات بعد</b><small>سجّل أول عملية من الأعلى</small></div>')
    + '<div class="sec"><h3>العمليات</h3><button class="sec-l" onclick="exportCsv(\'purchases\')">تصدير</button></div>'
    + '<div class="ob-search">'+ico('search')+'<input id="pq" value="'+attr(S.pf.q)+'" oninput="pSearch(this.value)" placeholder="ابحث بالبند أو المحل"></div>'
    + chipsRow_(['<button class="'+(S.pf.cat==='all'?'on':'')+'" onclick="S.pf.cat=\'all\';render()">الكل<i>'+all.length+'</i></button>']
        .concat(cats.filter(function(c){ return used[c]; }).map(function(c){
          var n = all.filter(function(p){ return p.category === c; }).length;
          return '<button class="'+(S.pf.cat===c?'on':'')+'" onclick="S.pf.cat=\''+attrJs(c)+'\';render()">'+esc(c)+'<i>'+n+'</i></button>'; })))
    + (order.length ? order.map(function(dt){
        var g = groups[dt], tot = g.reduce(function(x,p){ return x+p.amount; },0);
        return '<div class="day-h"><span>'+relDay_(dt)+'</span><span>'+num_(tot)+'</span></div><div class="glist">'
          + g.map(function(p){
              return '<div class="grow pur" onclick="openPurchase(\''+p.id+'\')"><span class="g-ic emo">'+catIc_(p.category)+'</span>'
                + '<span class="g-tx"><b>'+esc(p.item)+'</b><small>'+esc(p.category)+(p.store ? ' · '+esc(p.store) : '')+(p.notes ? ' · '+esc(p.notes) : '')+'</small></span>'
                + '<span class="d-end"><b>'+num_(p.amount)+'</b><button class="ghost-del" onclick="event.stopPropagation();delPurchase(\''+p.id+'\')">حذف</button></span></div>';
            }).join('') + '</div>';
      }).join('') : '<div class="empty-st">'+ico('search')+'<b>لا نتائج</b><small>غيّر البحث أو التصنيف</small></div>')
    + purchRangePanel();
}

/* ============================================================ الادخار والتجنيب ============================================================ */
function pSavings(){
  var s = S.data.summary, goals = S.data.savings, r = S.reserves;
  var saved = goals.reduce(function(x,g){ return x + (g.saved||0); },0), target = goals.reduce(function(x,g){ return x + (g.target||0); },0);
  return hsum_({ label:'المقترح أن تدّخره هذه الدورة', value:num_(s.suggestedSaving), sub:s.savingsRate+'% من المتبقي الآمن ('+num_(s.safeRemaining)+')',
      ring: target ? { pct: saved/target*100, txt: Math.round(saved/target*100)+'%', sub:'من أهدافك' } : null,
      grid:[['أُدخر هذه الدورة', num_(s.savingsDeposited), 'pos'], ['الاحتياطي', num_(s.buffer)]] })
    + '<details class="intro"><summary>'+ico('help')+'كيف يُحسب المقترح؟</summary><div class="note n-blue">(الرصيد المرحّل + الدخل − الالتزامات − المشتريات المحجوزة − الاحتياطي) × نسبة الادخار. الدخل الإضافي لا يدخل الخطة تلقائياً.</div></details>'
    + '<div class="sec"><h3>التجنيب للالتزامات القادمة</h3><button class="sec-l" onclick="go(\'advisor\')">اطلب من المستشار</button></div>'
    + (!r ? (S.errs.reserves ? waitOrErr('reserves','','loadReserves()') : '<div class="glist"><div class="tl-wait">جاري التحميل…</div></div>')
      : !r.length ? '<div class="glist"><div class="grow quiet"><span class="g-ic">'+ico('gem')+'</span><span class="g-tx"><b>لا يوجد تجنيب</b><small>مثال: «جنّب لي للتأمين 1200 بعد 3 شهور من الراتب والضمان»</small></span></div></div>'
      : '<div class="cards">' + r.map(function(x){
          var pct = Math.min(100, Math.round(x.progress*100));
          return '<article class="gcard"><div class="gc-top">'+ringSvg_(pct, 64, 7)+'<span class="gc-p">'+pct+'%</span>'
            + '<div class="g-tx"><b>'+esc(x.name)+'</b><small>'+(x.obligationName ? 'لـ«'+esc(x.obligationName)+'» · ' : '')+(x.dueDate ? 'قبل '+dShort_(x.dueDate) : 'بلا موعد')+(x.cyclesLeft ? ' · بقي '+x.cyclesLeft+' دورة' : '')+'</small></div></div>'
            + '<div class="sum2 g2"><div><small>جُنِّب</small><b>'+num_(x.accumulated)+'</b><span>من '+num_(x.target)+'</span></div>'
            +   '<div><small>شهرياً</small><b>'+num_(x.monthly)+'</b><span>'+x.contributions.map(function(c){ return esc(c.sourceName); }).join(' + ')+'</span></div></div>'
            + (x.shortfall ? '<div class="gc-warn neg">ينقص '+num_(x.shortfall)+' عند الاستحقاق</div>' : '')
            + (x.behind ? '<div class="gc-warn neg">متأخر '+num_(x.behind)+' عن الخطة</div>' : '')
            + '<div class="gc-acts">'
            + (x.depositedThisCycle
               ? '<span class="st ok">'+ico('check')+'جنّبت '+num_(x.thisCycleAmount)+'</span><button onclick="rsvDeposit(\''+x.id+'\',\''+attrJs(x.name)+'\','+x.thisCycleAmount+')">تعديل</button>'
               : '<button class="pri" onclick="rsvDeposit(\''+x.id+'\',\''+attrJs(x.name)+'\','+x.monthly+')">جنّبت '+num_(x.monthly)+'</button>')
            + '<button class="ghost-del" onclick="delReserve(\''+x.id+'\',\''+attrJs(x.name)+'\')">إلغاء</button></div></article>';
        }).join('') + '</div>')
    + '<div class="sec"><h3>أهدافك</h3><button class="sec-l" onclick="openCalc()">الحاسبة</button></div>'
    + (goals.length ? '<div class="cards">' + goals.map(function(g){
        var rem = Math.max(0, g.target - g.saved), pct = g.target ? Math.min(100, g.saved/g.target*100) : 0;
        var eta = g.monthly > 0 ? Math.ceil(rem/g.monthly) : null;
        return '<article class="gcard"><div class="gc-top">'+ringSvg_(pct, 64, 7)+'<span class="gc-p">'+Math.round(pct)+'%</span>'
          + '<div class="g-tx"><b>'+esc(g.name)+'</b><small>'+(g.saved >= g.target ? 'مكتمل' : eta ? 'يكتمل خلال '+eta+' شهر تقريباً' : 'حدّد مساهمة شهرية')
          + (g.targetDate ? ' · موعده '+dShort_(g.targetDate) : '')+'</small></div></div>'
          + '<div class="sum2 g3"><div><small>المدّخر</small><b class="pos">'+num_(g.saved)+'</b></div><div><small>المتبقي</small><b>'+num_(rem)+'</b></div><div><small>الهدف</small><b>'+num_(g.target)+'</b></div></div>'
          + '<div class="gc-acts"><button class="pri" onclick="openAddSaving(\''+g.id+'\')">أضف مبلغاً</button>'
          + '<button onclick="openSaving(\''+g.id+'\')">تعديل</button><button class="ghost-del" onclick="delSaving(\''+g.id+'\')">حذف</button></div></article>';
      }).join('') + '</div>'
      : '<div class="empty-st">'+ico('gem')+'<b>لا أهداف بعد</b><small>سفر، سيارة، صندوق طوارئ — أضف هدفك وكم تدّخر له شهرياً</small><button class="btn-main" onclick="openSaving()">إضافة هدف</button></div>');
}

/* ============================================================ الديون والأقساط ============================================================ */
function pDebt(){
  var d = S.debt;
  if (!d) return waitOrErr('debt','جاري حساب الديون…','loadDebt()');
  var e = S.fund, p = S.payoff;
  var fund = e ? '<div class="sec"><h3>صندوق الطوارئ</h3></div>' + hsum_({ label:'كم تصمد لو انقطع دخلك', value:e.monthsCovered, unit:'شهر',
      cls: e.monthsCovered >= 3 ? 'pos' : 'neg', sub:'التقييم: '+e.level+' · المتعارف عليه ٣ أشهر على الأقل',
      ring:{ pct: Math.min(100, e.monthsCovered/6*100), txt:e.monthsCovered+'/6', sub:'أشهر' },
      grid:[['حاجتك الشهرية', num_(e.monthlyNeed)], ['المدّخر حالياً', num_(e.saved)]] })
      + '<div class="glist" style="margin-top:10px">' + e.targets.map(function(t){
          var pc = t.target ? Math.min(100, e.saved/t.target*100) : 0;
          return '<div class="grow fig"><span class="g-ic">'+ico('shield')+'</span><span class="g-tx"><b>هدف '+t.months+' أشهر</b>'
            + '<small>'+(t.gap ? 'ينقص '+num_(t.gap)+(t.monthsToReach ? ' · يتحقق خلال '+t.monthsToReach+' شهر' : '') : 'مكتمل')+'</small>'
            + '<span class="mb'+(pc>=100?' in':'')+'"><i style="width:'+pc.toFixed(1)+'%"></i></span></span><span class="f-v">'+num_(t.target)+'</span></div>';
        }).join('') + '</div>' : '';
  if (!d.items.length) return fund + '<div class="empty-st" style="margin-top:16px">'+ico('pie')+'<b>لا أقساط لها نهاية</b><small>أضف «تاريخ الانتهاء» لأي التزام ليظهر هنا بعدد أقساطه المتبقية</small></div>';
  var active = d.items.filter(function(x){ return !x.finished; });
  var share = Math.round(d.incomeShare*100);
  var strat = S.debtStrat || 'avalanche';
  return hsum_({ label:'المتبقي عليك من التمويلات', value:num_(d.totalRemaining), cls:'', sub:active.length+' تمويل قائم · تتحرر '+(d.payoffDate ? dShort_(d.payoffDate) : '—'),
      ring:{ pct:share, txt:share+'%', sub:'من دخلك' },
      grid:[['القسط الشهري', num_(d.monthlyLoad)], ['دخلك الأساسي', num_(d.income)]] })
    + (d.incomeShare > 0.4 ? '<div class="note n-red" style="margin-top:12px">أقساطك تستهلك أكثر من 40% من دخلك — هامش الطوارئ ضيق.</div>' : '')
    + '<div class="sec"><h3>تمويلاتك</h3></div><div class="glist">'
    + d.items.map(function(x){
        var pc = Math.round(x.progress*100);
        return '<div class="grow debt'+(x.finished?' dim':'')+'"><span class="dring">'+ringSvg_(pc, 46, 5)+'<i>'+pc+'%</i></span>'
          + '<span class="g-tx"><b>'+esc(x.name)+'</b><small>'+num_(x.amount)+' '+esc(x.recurrence||'شهري')+' · '
          + (x.finished ? 'مكتمل' : (x.remainingInstallments === null ? '—' : 'بقي '+x.remainingInstallments+' قسط')+' · ينتهي '+dShort_(x.endDate))+'</small></span>'
          + '<span class="f-v">'+(x.remainingValue === null ? '—' : num_(x.remainingValue))+'<small>متبقٍ</small></span></div>';
      }).join('') + '</div>'
    + (p && p.hasDebt ? '<div class="sec"><h3>أي دين تسدّد أولاً؟</h3></div>'
      + '<div class="note n-gold">ابدأ بـ <strong>'+esc(p.recommendation.target)+'</strong> — '+esc(p.recommendation.why)+'.'
      + (p.extraPayoffMonths ? ' بتوجيه فائضك ('+num_(p.spare)+' شهرياً) تسدده خلال '+p.extraPayoffMonths+' شهر فيتحرر '+num_(p.freedIfCleared)+' شهرياً.' : '')+'</div>'
      + '<div class="seg2"><button class="'+(strat==='avalanche'?'on':'')+'" onclick="S.debtStrat=\'avalanche\';render()">الأعلى فائدة</button>'
      + '<button class="'+(strat==='snowball'?'on':'')+'" onclick="S.debtStrat=\'snowball\';render()">الأقصر مدة</button></div>'
      + '<div class="glist">' + p[strat].map(function(x){
          return '<div class="grow"><span class="d-box"><b>'+x.order+'</b><small>الترتيب</small></span><span class="g-tx"><b>'+esc(x.name)+'</b>'
            + '<small>'+(x.interestRate ? 'فائدة '+x.interestRate+'% · ' : '')+'يحرّر '+num_(x.freedPerMonth)+' شهرياً</small></span>'
            + '<span class="f-v">'+num_(x.remainingValue)+'</span></div>';
        }).join('') + '</div>' : '')
    + fund;
}

/* ============================================================ ما ينتظرك ============================================================ */
function pForecast(){
  var f = S.forecast;
  if (!f) return waitOrErr('forecast','جاري حساب الدورات القادمة…','loadForecast()');
  var mx = 1; f.cycles.forEach(function(c){ mx = Math.max(mx, c.income, c.confirmed + c.expected + c.purchases); });
  return hsum_({ label: f.firstTight ? 'أول دورة ضاغطة: '+esc(f.firstTight.label) : 'الدورات القادمة كلها موجبة',
      value: f.firstTight ? num_(f.firstTight.balance) : ico('check'), unit: f.firstTight ? 'ريال' : false, cls: f.firstTight ? 'neg' : 'pos',
      sub: f.firstTight ? 'ابدأ التجنيب من الآن أو أجّل ما يمكن تأجيله' : 'لا عجز متوقع ضمن الأفق المعروض',
      grid:[['متوقعة غير مؤكدة', num_(f.totalExpected)], ['جنّب شهرياً', num_(f.setAsideMonthly)], ['الاحتياطي', num_(f.buffer)]] })
    + (f.purchaseBudgetSet ? '' : '<div class="note n-gold" style="margin-top:12px">لم تحدد سقفاً للمشتريات، فالتوقعات لا تحسم المصروف اليومي وستبدو أفضل من الواقع.</div>')
    + '<div class="sec"><h3>الدورات القادمة</h3><small class="sec-s">الفائض ينتقل للتي بعدها</small></div>'
    + '<div class="cyc-x">' + f.cycles.map(function(c){
        var out = c.confirmed + c.expected + c.purchases;
        return '<article class="cyc'+(c.negative?' neg':c.tight?' tight':'')+(c.isCurrent?' cur':'')+'">'
          + '<div class="cy-l">'+esc(c.label)+(c.isCurrent ? ' <em>الحالية</em>' : '')+'</div>'
          + '<div class="cy-bal">'+num_(c.balance)+'</div><small class="cy-s">الرصيد المتوقع</small>'
          + '<div class="cy-bars"><span class="in" style="width:'+(c.income/mx*100).toFixed(1)+'%"></span><span class="out" style="width:'+(out/mx*100).toFixed(1)+'%"></span></div>'
          + '<div class="cy-r"><span>دخل</span><b>'+num_(c.income)+'</b></div>'
          + '<div class="cy-r"><span>التزامات</span><b>'+num_(c.confirmed)+'</b></div>'
          + (c.expected ? '<div class="cy-r g"><span>متوقع</span><b>'+num_(c.expected)+'</b></div>' : '')
          + '<div class="cy-r"><span>نثريات</span><b>'+num_(c.purchases)+'</b></div>'
          + '<div class="cy-r net '+(c.net>=0?'pos':'neg')+'"><span>الصافي</span><b>'+(c.net>=0?'+':'−')+num_(Math.abs(c.net))+'</b></div>'
          + '</article>';
      }).join('') + '</div>'
    + payloadPanel()
    + '<div class="sec"><h3>البنود القادمة</h3><button class="sec-l" onclick="openOblig(\'\', true)">إضافة متوقع</button></div>'
    + (f.upcoming.length ? '<div class="glist">' + f.upcoming.map(function(u){
        var x = dd_(u.dueDate);
        return '<div class="grow up"><span class="d-box"><b>'+x.d+'</b><small>'+x.m+'</small></span>'
          + '<span class="g-tx"><b>'+esc(u.name)+'</b><small>'+(u.isExpected ? '<span class="neg-o">متوقع</span>' : 'مؤكد')+' · '
          + (u.cyclesAway === 0 ? 'هذه الدورة' : 'بعد '+u.cyclesAway+' دورة') + (u.cyclesAway > 0 ? ' · جنّب '+num_(u.setAside)+' شهرياً' : '')+'</small>'
          + '<span class="up-acts">'+(u.isExpected
              ? '<button class="ok" onclick="setCertainty(\''+u.id+'\',\'مؤكد\')">تحقق</button><button onclick="dropExpected(\''+u.id+'\',\''+attrJs(u.name)+'\','+u.amount+')">لم يتحقق</button>'
              : '<button onclick="setCertainty(\''+u.id+'\',\'متوقع\')">اجعله متوقعاً</button>')
          + '<button onclick="openOblig(\''+u.id+'\')">تعديل</button></span></span>'
          + '<span class="f-v">'+num_(u.amount)+'</span></div>';
      }).join('') + '</div>'
      : '<div class="empty-st">'+ico('cal')+'<b>لا بنود غير متكررة قادمة</b><small>أضف ما تتوقعه: فاتورة بعد شهرين، تأمين بعد خمسة</small></div>');
}
function payloadPanel(){
  var list = S.pload;
  if (!list) return S.errs.pload ? waitOrErr('pload','','loadPayload()') : '';
  if (!list.length) return '';
  var over = list.filter(function(p){ return p.over; });
  var bySrc = {};
  list.forEach(function(p){ (bySrc[p.source] = bySrc[p.source] || []).push(p); });
  return '<div class="sec"><h3>ضغط كل راتب — ١٢ دورة</h3></div>'
    + (over.length ? '<div class="note n-red">'+over.length+' نزول سيعجز: '+over.slice(0,3).map(function(p){ return esc(p.source)+' '+dShort_(p.date); }).join('، ')
        + '<div style="margin-top:8px"><button class="btn btn-sm" onclick="fixOverflow()">اطلب العلاج من المستشار</button></div></div>'
      : '')
    + Object.keys(bySrc).map(function(src){
        var arr = bySrc[src];
        return '<div class="pbox load"><div class="ld-h"><b>'+esc(src)+'</b><small>'+(arr.some(function(p){ return p.over; }) ? '<span class="neg">فيه عجز</span>' : 'كلها مغطاة')+'</small></div>'
          + '<div class="ld-cols">' + arr.map(function(p){
              var pc = p.amount ? Math.min(100, p.load/p.amount*100) : 0, x = dd_(p.date);
              return '<div class="ldc'+(p.over?' over':pc>85?' hi':'')+'" title="'+attr(p.items.join(' · '))+'" onclick="toast(\''+attrJs(esc(src)+' '+x.d+' '+x.m+': '+num_(p.load)+' من '+num_(p.amount))+'\',\'ok\')">'
                + '<span><i style="height:'+Math.max(4,pc).toFixed(0)+'%"></i></span><small>'+x.m.slice(0,3)+'</small></div>';
            }).join('') + '</div></div>';
      }).join('');
}

/* ============================================================ التقارير ============================================================ */
function pReports(){
  var t = S.trend, s = S.data.summary;
  if (!t) return waitOrErr('trend','جاري حساب الاتجاه…','loadTrend()');
  var d = t.delta, mx = 1;
  t.series.forEach(function(x){ mx = Math.max(mx, x.income, x.obligations + x.purchases); });
  var arrow = function(n, goodDown){
    if (!n) return '<span class="mut">بلا تغيير</span>';
    var up = n > 0, good = goodDown ? !up : up;
    return '<span class="'+(good?'pos':'neg')+'">'+(up?'▲ ':'▼ ')+num_(Math.abs(n))+'</span>';
  };
  var W = 320, H = 150, n = t.series.length, bw = Math.min(26, W / n / 2.6);
  var bars = t.series.map(function(x, i){
    var cx = W - (i + .5) * (W / n), hi = x.income/mx*(H-24), ho = (x.obligations + x.purchases)/mx*(H-24), hp = x.purchases/mx*(H-24);
    return '<rect x="'+(cx-bw-1).toFixed(1)+'" y="'+(H-18-hi).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hi.toFixed(1)+'" rx="4" class="tb-in"/>'
      + '<rect x="'+(cx+1).toFixed(1)+'" y="'+(H-18-ho).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+ho.toFixed(1)+'" rx="4" class="tb-ob"/>'
      + '<rect x="'+(cx+1).toFixed(1)+'" y="'+(H-18-hp).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hp.toFixed(1)+'" rx="4" class="tb-pu"/>'
      + '<text x="'+cx.toFixed(1)+'" y="'+(H-3)+'" class="tb-t">'+MONTH_AR[(+x.month.slice(5))-1].slice(0,3)+'</text>';
  }).join('');
  var mxc = t.categoryBreakdown.length ? t.categoryBreakdown[0].amount || 1 : 1;
  var mxo = t.obligationCategories && t.obligationCategories.length ? t.obligationCategories[0].amount || 1 : 1;
  return hsum_({ label:'الرصيد الختامي لهذه الدورة', value:num_(s.closing), cls:s.closing<0?'neg':'', sub:s.closed ? 'الدورة مُقفلة' : 'لم تُقفل بعد',
      grid:[['الدخل المحقق', num_(s.incomeRealized), 'pos'], ['المسدَّد', num_(s.paidObligations)], ['المشتريات', num_(s.purchasesSpent)]] })
    + '<div class="glist" style="margin-top:12px"><div class="grow quiet"><span class="g-ic">'+ico('chart')+'</span><span class="g-tx"><b>مقارنة بمتوسط آخر ٣ أشهر</b>'
    +   '<small>الالتزامات '+arrow(d.obligations,true)+' · المشتريات '+arrow(d.purchases,true)+' · الادخار '+arrow(d.savings,false)+'</small></span></div></div>'
    + '<div class="sec"><h3>الاتجاه</h3><div class="seg2 sm">'+[3,6,12].map(function(k){ return '<button class="'+(S.trendRange===k?'on':'')+'" onclick="setRange('+k+')">'+k+' أشهر</button>'; }).join('')+'</div></div>'
    + '<section class="flow-card"><svg viewBox="0 0 '+W+' '+H+'" class="tchart">'+bars+'</svg>'
    +   '<div class="ring-info" style="min-height:0"><span class="lg"><i style="background:var(--green);border-radius:3px"></i>الدخل</span><span class="lg"><i style="background:var(--accent);border-radius:3px"></i>التزامات</span><span class="lg"><i style="background:var(--orange);border-radius:3px"></i>منها مشتريات</span></div></section>'
    + '<div class="sec"><h3>أين تذهب المشتريات</h3></div>'
    + (t.categoryBreakdown.length ? '<div class="glist">' + t.categoryBreakdown.slice(0,8).map(function(c){
        return '<div class="grow cat"><span class="g-ic emo">'+catIc_(c.category)+'</span><span class="g-tx"><b>'+esc(c.category)+'</b>'
          + '<span class="mb"><i style="width:'+(c.amount/mxc*100).toFixed(1)+'%"></i></span></span><span class="f-v">'+num_(c.amount)+'</span></div>';
      }).join('') + '</div>' : '<div class="empty-st">'+ico('bag')+'<b>لا مشتريات مسجلة</b></div>')
    + (t.obligationCategories && t.obligationCategories.length ? '<div class="sec"><h3>الالتزامات حسب التصنيف</h3></div><div class="glist">'
      + t.obligationCategories.map(function(c, i){
          return '<div class="grow cat"><span class="g-ic"><i class="dotk k'+(i%6)+'"></i></span><span class="g-tx"><b>'+esc(c.category)+'</b>'
            + '<span class="mb"><i style="width:'+(c.amount/mxo*100).toFixed(1)+'%"></i></span></span><span class="f-v">'+num_(c.amount)+'</span></div>';
        }).join('') + '</div>' : '')
    + '<div class="sec"><h3>الأشهر</h3><button class="sec-l" onclick="exportPdf()">تقرير للطباعة</button></div><div class="glist">'
    + t.series.slice().reverse().map(function(x){
        return '<div class="grow mrow"><span class="d-box"><b>'+(+x.month.slice(5))+'</b><small>'+x.month.slice(0,4)+'</small></span>'
          + '<span class="g-tx"><b>'+MONTH_AR[(+x.month.slice(5))-1]+(x.closed ? ' <em class="st ok">مُقفل</em>' : '')+'</b>'
          + '<small>دخل '+num_(x.incomeRealized)+' · التزامات '+num_(x.paid)+' · مشتريات '+num_(x.purchases)+(x.savings ? ' · ادخار '+num_(x.savings) : '')+'</small></span>'
          + '<span class="f-v'+(x.closing<0?' neg':'')+'">'+num_(x.closing)+'<small>ختامي</small></span></div>';
      }).join('') + '</div>';
}

/* ============================================================ المستشار ============================================================ */
function pAdvisor(){
  var st = S.ai.status;
  if (st && !st.hasKey){
    return '<section class="adv-hero">'+ico('spark')+'<b>مستشارك المالي</b><small>يقرأ كل أرقامك ويقترح، ولا ينفّذ شيئاً حتى توافق</small>'
      + '<div class="note n-gold">أضف مفتاح كلود من الإعدادات لتفعيله — أنشئه من console.anthropic.com ولا تشاركه مع أحد.</div>'
      + '<button class="btn-main wide" onclick="go(\'settings\')">اذهب للإعدادات</button></section>';
  }
  var last = S.ai.last, h = S.ai.history;
  var q = S.ai.quality;
  return '<section class="adv-hero">'+ico('spark')+'<b>اسأل عن أي قرار مالي</b><small>يرى كل التزاماتك، والدورات القادمة، وضغط كل راتب، وسجل سدادك — ويتذكر محادثاتكم</small>'
    + (q ? '<span class="pill '+(q.score>=80?'ok':'')+'">جودة بياناتك '+q.score+'/100 · '+esc(q.level)+'</span>' : '')
    + '</section>'
    + chipsRow_([['حلّل وضعي كاملاً','aiRun(\'analyze\')'],['وزّع التزاماتي','aiAllocOpen(\'unassigned\')'],
        ['قسّم المصروف المرن',"el('aiQ').value='قسّم التزاماتي المرنة الكبيرة إلى فترات حسب مواعيد نزول دخلي، كل فترة من مصدرها';aiSend()"],
        ['عاداتي في الصرف','aiRun(\'patterns\')'],['تقرير الدورة','aiRun(\'report\')']]
      .map(function(x){ return '<button onclick="'+x[1].replace(/"/g,'&quot;')+'">'+x[0]+'</button>'; }))
    + '<div class="composer"><textarea id="aiQ" rows="2" placeholder="أقدر آخذ قسط 800؟ · جنّب لي للتأمين 1200 بعد 3 شهور · سجّل إني سدّدت الإيجار"></textarea>'
    +   '<button onclick="aiSend()" aria-label="إرسال">'+ico('chev')+'</button></div>'
    + (last ? '<div class="bub a">'+esc(last.answer)+'</div>' : '')
    + agentPanel() + batchPanel()
    + (q && q.issues && q.issues.length ? '<details class="intro"><summary>'+ico('help')+'ما ينقص بياناتك؟</summary><div class="note n-gold">'+esc(q.confidence)+'<br>'+q.issues.map(esc).join(' · ')+'</div></details>' : '')
    + '<div class="sec"><h3>المحادثات</h3>'+(h && h.length ? '<button class="sec-l" onclick="aiClearHistory()">مسح الذاكرة</button>' : '')+'</div>'
    + (!h ? '<div class="tl-wait">جاري التحميل…</div>'
      : !h.length ? '<div class="empty-st">'+ico('spark')+'<b>ابدأ بـ «حلّل وضعي كاملاً»</b><small>كل سؤال وجوابه يُحفظ هنا، والمستشار يرجع له لاحقاً</small></div>'
      : '<div class="chat">' + h.map(function(t){
          return '<div class="bub q">'+esc(t.question)+'<small>'+esc(t.at)+'</small></div>'
            + '<div class="bub a">'+esc(t.answer)
            + (t.userNote ? '<div class="ai-note">ما حدث: '+esc(t.userNote)+'</div>' : '')
            + '<button class="bub-n" onclick="aiNote(\''+t.id+'\')">'+(t.userNote ? 'عدّل ما حدث' : 'سجّل ما حدث')+'</button></div>';
        }).join('') + '</div>');
}

/* ============================================================ ماذا لو ============================================================ */
function pWhatIf(){
  var sm = S.data.summary;
  if (!S.simItems.length) S.simItems = [{kind:'loan',amount:'',months:24,day:1,label:''}];
  return hsum_({ label:'متبقيك الآمن قبل أي قرار', value:num_(sm.safeRemaining), sub:'جرّب قسطاً أو سفراً أو زيادة دخل — وشوف أثرها على رصيدك يوماً بيوم',
      grid:[['المتبقي الكلي', num_(sm.remaining)], ['الاحتياطي', num_(sm.buffer)]] })
    + '<div class="sec"><h3>قراراتك</h3><button class="sec-l" onclick="simAdd()">＋ قرار</button></div>'
    + '<div id="simList" class="sims"></div>'
    + '<div class="two" style="margin-top:12px"><button class="btn-main" onclick="runMulti()">احسب الأثر</button><button class="btn" onclick="aiReview()">ناقشه مع المستشار</button></div>'
    + '<div id="simOut" class="sim-out"></div>';
}
function simRender(){
  var box = el('simList'); if (!box) return;
  box.innerHTML = S.simItems.map(function(x,i){
    return '<div class="simc"><div class="seg2 sm">'
      + [['loan','قسط'],['expense','مصروف'],['income','دخل'],['saving','ادخار']].map(function(o){
          return '<button class="'+(x.kind===o[0]?'on':'')+'" onclick="simSet('+i+',\'kind\',\''+o[0]+'\');simRender()">'+o[1]+'</button>'; }).join('')
      + '</div>'
      + '<input class="sim-l" type="text" placeholder="الوصف (مثلاً: قسط جوال)" value="'+attr(x.label)+'" oninput="simSet('+i+',\'label\',this.value)">'
      + '<div class="two"><label class="field"><span>المبلغ</span><input type="number" min="0" value="'+attr(x.amount)+'" oninput="simSet('+i+',\'amount\',this.value)"></label>'
      + '<label class="field"><span>يوم الشهر</span><input type="number" min="1" max="31" value="'+attr(x.day)+'" oninput="simSet('+i+',\'day\',this.value)"></label></div>'
      + (S.simItems.length > 1 ? '<button class="ghost-del" onclick="simDel('+i+')">حذف القرار</button>' : '')
      + '</div>';
  }).join('');
}

/* ============================================================ الدليل ============================================================ */
function pGuide(){
  return '<section class="adv-hero">'+ico('help')+'<b>كيف تستخدم ميزانيتي</b><small>ابدأ بالمفاهيم الخمسة، ثم افتح الصفحة التي تستخدمها فقط</small></section>'
    + GUIDE.map(function(sec, i){
        return '<details class="gd"'+(i===0?' open':'')+'><summary><span><b>'+esc(sec[0])+'</b><small>'+esc(sec[1]||'')+'</small></span>'+ico('chev')+'</summary>'
          + '<div class="glist">'+sec[2].map(function(row){
              return '<div class="grow quiet"><span class="g-tx"><b>'+esc(row[0])+'</b><small>'+esc(row[1])+'</small></span></div>';
            }).join('')+'</div></details>';
      }).join('');
}
document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
  + '<linearGradient id="rgA2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs></svg>');
