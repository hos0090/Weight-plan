/* offline cache: open from cache, refresh in the background when online */
const C='tq-mvfd9eyn',A=['./','index.html','app.enc','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k.indexOf('tq-')===0).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin||u.pathname.indexOf(new URL('./',self.registration.scope).pathname)!==0)return;
  const key=r.mode==='navigate'?'index.html':r;
  e.respondWith(caches.open(C).then(c=>c.match(key,{ignoreSearch:true}).then(hit=>{const net=fetch(r).then(res=>{if(res&&res.ok)c.put(key,res.clone());return res}).catch(()=>hit);return hit||net})));});
