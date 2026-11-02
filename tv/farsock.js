// يخلي ألعاب السهرة تشتغل من برا البيت: يحوّل اتصال اللعبة للاتصال المشفّر
(function () {
  'use strict';
  var sock = null, readyNow = false;
  var MSG = { need: 'تحتاج رابط دعوة من صاحب الشاشة', expired: 'الرابط انتهى أو انستخدم، اطلب رابط جديد', nolink: 'الشاشة مو متصلة، أو تم إلغاء ربط جوالك' };
  function gate(t) {
    var g = document.getElementById('farGate');
    if (!g) { g = document.createElement('div'); g.id = 'farGate'; g.style.cssText = 'position:fixed;inset:0;z-index:99;background:#0a0c13f5;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;font:700 17px/1.9 T,system-ui'; document.body.appendChild(g); }
    g.textContent = t; g.style.display = t ? 'flex' : 'none';
  }
  function FarSocket() {
    var self = this; this.readyState = 0; sock = this;
    setTimeout(function () { if (readyNow) { self.readyState = 1; self.onopen && self.onopen(); } }, 0);
  }
  FarSocket.prototype.send = function (s) { try { FAR.send({ type: 'game', m: JSON.parse(s) }); } catch (e) {} };
  FarSocket.prototype.close = function () {};
  window.WebSocket = FarSocket;
  FAR.start({
    state: function (st) {
      if (st === 'ready') { gate(''); readyNow = true; if (sock && sock.readyState !== 1) { sock.readyState = 1; sock.onopen && sock.onopen(); } }
      else if (st === 'down') { readyNow = false; }
      else if (MSG[st]) gate(MSG[st]);
    },
    msg: function (m) { if (m && m.type === 'game' && sock && sock.onmessage) sock.onmessage({ data: JSON.stringify(m.m) }); }
  });
  setInterval(function () { if (readyNow && sock) FAR.send({ type: 'game', m: { type: 'ping' } }); }, 30000);
  window.addEventListener('pagehide', function () { try { FAR.send({ type: 'game', m: { type: 'bye' } }); } catch (e) {} });
})();
