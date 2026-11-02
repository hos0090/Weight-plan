// التحكم من برا البيت: اتصال مشفّر من طرف لطرف بين الجوال والشاشة عبر وسيط عام.
// الوسيط ما يشوف إلا بيانات مشفّرة، والمفاتيح ما تطلع من جوالك وشاشتك أبداً.
(function () {
  'use strict';
  var enc = new TextEncoder(), dec = new TextDecoder();
  var DEF = 'wss://broker.emqx.io:8084/mqtt';
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function ub64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function rnd(n) { var u = new Uint8Array(n); crypto.getRandomValues(u); return u; }
  function hex(u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function key(raw) { return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
  async function seal(k, aad, obj) {
    var iv = rnd(12), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: enc.encode(aad) }, k, enc.encode(JSON.stringify(obj))));
    var out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64(out);
  }
  async function open(k, aad, s) {
    var u = ub64(s), pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12), additionalData: enc.encode(aad) }, k, u.slice(12));
    return JSON.parse(dec.decode(pt));
  }

  /* عميل MQTT صغير فوق WebSocket */
  function strB(s) { var e = enc.encode(s); var o = new Uint8Array(2 + e.length); o[0] = e.length >> 8; o[1] = e.length & 255; o.set(e, 2); return o; }
  function cat(a) { var n = 0; a.forEach(function (x) { n += x.length; }); var o = new Uint8Array(n), p = 0; a.forEach(function (x) { o.set(x, p); p += x.length; }); return o; }
  function pkt(type, body) { var len = body.length, h = [type]; do { var d = len % 128; len = Math.floor(len / 128); if (len > 0) d |= 128; h.push(d); } while (len > 0); return cat([new Uint8Array(h), body]); }
  function Mq(url, onMsg, onUp, onDown) {
    var ws, buf = new Uint8Array(0), ping, subs = [], dead = false, self = this, pid = 1;
    function go() {
      try { ws = new WebSocket(url, 'mqtt'); } catch (e) { setTimeout(go, 3000); return; }
      ws.binaryType = 'arraybuffer';
      ws.onopen = function () {
        var body = cat([strB('MQTT'), new Uint8Array([4, 2, 0, 60]), strB('shz' + hex(rnd(8)))]);
        ws.send(pkt(0x10, body));
      };
      ws.onmessage = function (e) {
        buf = cat([buf, new Uint8Array(e.data)]);
        for (;;) {
          if (buf.length < 2) return;
          var mul = 1, len = 0, i = 1, d;
          do { if (i >= buf.length) return; d = buf[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128);
          if (buf.length < i + len) return;
          var t = buf[0] >> 4, body = buf.slice(i, i + len); buf = buf.slice(i + len);
          if (t === 2) { subs.forEach(function (s) { self._sub(s); }); clearInterval(ping); ping = setInterval(function () { try { ws.send(new Uint8Array([0xc0, 0])); } catch (e) {} }, 40000); onUp && onUp(); }
          else if (t === 3) { var tl = (body[0] << 8) | body[1], topic = dec.decode(body.slice(2, 2 + tl)), off = 2 + tl; onMsg(topic, dec.decode(body.slice(off))); }
        }
      };
      ws.onclose = function () { clearInterval(ping); onDown && onDown(); if (!dead) setTimeout(go, 2500); };
      ws.onerror = function () {};
    }
    this._sub = function (t) { if (ws && ws.readyState === 1) ws.send(pkt(0x82, cat([new Uint8Array([0, (pid++) & 255 || 1]), strB(t), new Uint8Array([0])]))); };
    this.sub = function (t) { subs.push(t); this._sub(t); };
    this.pub = function (t, s) { if (ws && ws.readyState === 1) { ws.send(pkt(0x30, cat([strB(t), enc.encode(s)]))); return true; } return false; };
    this.ok = function () { return ws && ws.readyState === 1; };
    go();
  }

  /* الربط والجلسة */
  var LS = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  window.FAR = {
    // يقرأ رمز الربط من الرابط (بعد علامة #) ولا يرسله لأي مكان
    start: async function (h) {
      var f = new URLSearchParams(location.hash.slice(1)), s = LS.get('far');
      if (f.get('id') && f.get('k')) {
        s = { id: f.get('id'), d: b64(rnd(32)), ph: hex(rnd(8)), b: f.get('b') || DEF, pk: f.get('k'), last: 0 };
        LS.set('far', s); history.replaceState(null, '', location.pathname);  // نشيل مفتاح الربط من الرابط فوراً
      }
      if (f.get('s')) { try { s = JSON.parse(new TextDecoder().decode(ub64(f.get('s')))); s.last = 0; LS.set('far', s); } catch (e) {} }
      if (!s) { h.state('need'); return; }
      var D = await key(ub64(s.d)), base = 'shz/' + s.id + '/', ready = false, last = 0, timer;
      var mq = new Mq(s.b, async function (topic, payload) {
        try {
          var o = await open(D, s.ph, payload);
          if (!(o.ts > last)) return; last = o.ts;
          if (o.m && o.m.type === 'ready') { ready = true; clearTimeout(timer); if (s.pk) { delete s.pk; LS.set('far', s); }
            // نحفظ الجلسة في الرابط نفسه (بعد #) عشان «إضافة للشاشة الرئيسية» في الآيفون تشتغل بدون ربط ثاني
            try { history.replaceState(null, '', location.pathname + '#s=' + b64(enc.encode(JSON.stringify({ id: s.id, d: s.d, ph: s.ph, b: s.b })))); } catch (e) {}
            h.state('ready'); }
          else h.msg(o.m);
        } catch (e) {}
      }, async function () {
        mq.sub(base + 'r/' + s.ph);
        if (s.pk) { var P = await key(ub64(s.pk)); mq.pub(base + 'p', await seal(P, 'pair', { d: s.d, ph: s.ph, n: /iPhone/.test(navigator.userAgent) ? 'آيفون' : 'جوال', ts: Date.now() })); }
        FAR.send({ type: 'hello' });
        clearTimeout(timer); timer = setTimeout(function () { if (!ready) h.state(s.pk ? 'expired' : 'nolink'); }, 9000);
      }, function () { ready = false; h.state('down'); });
      var sent = 0;
      FAR.send = async function (m) { if (!mq.ok()) return false; sent = Math.max(Date.now(), sent + 1); mq.pub(base + 'c/' + s.ph, await seal(D, s.ph, { ts: sent, m: m })); return true; };
      FAR.ready = function () { return ready; };
      FAR.forget = function () { localStorage.removeItem('far'); };
    },
    send: function () { return false; },
    ready: function () { return false; }
  };
})();
