/* offline first: open from cache instantly, fetch fresh copies in the background (never from the browser's HTTP cache),
   and tell the open app when a new version arrived. The app's saved work lives in its own storage and is never touched here. */
const C='tq-mvpd7gd3',A=['./','index.html','app.enc','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png','data.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(u);return c.put(u,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k.indexOf('tq-')===0).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function sameBytes(a,b){if(!a||!b||a.byteLength!==b.byteLength)return false;const x=new Uint8Array(a,16,24),y=new Uint8Array(b,16,24);for(let i=0;i<24;i++)if(x[i]!==y[i])return false;return true}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);const base=new URL('./',self.registration.scope);if(u.origin!==location.origin||u.pathname.indexOf(base.pathname)!==0)return;
  const nav=r.mode==='navigate',key=nav?new URL('index.html',base).href:u.origin+u.pathname,isApp=/app\.enc$/.test(u.pathname);
  if(u.searchParams.has('fresh')){e.respondWith(fetch(key,{cache:'no-store'}));return}
  e.respondWith(caches.open(C).then(c=>c.match(key).then(hit=>{
    const net=fetch(key,{cache:'no-store'}).then(async res=>{if(res&&res.ok){
        if(isApp&&hit){const nb=await res.clone().arrayBuffer(),ob=await hit.clone().arrayBuffer();if(!sameBytes(nb,ob)){await c.put(key,res.clone());const cl=await self.clients.matchAll();cl.forEach(x=>x.postMessage({t:'tq-update'}));return res}}
        await c.put(key,res.clone())}return res}).catch(()=>hit);
    if(hit){e.waitUntil(net.catch(()=>{}));return hit}return net})));});
