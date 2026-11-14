/* التطبيق انتقل إلى /taqweem/ : هذا العامل يمسح النسخة القديمة وينقل الصفحات المفتوحة للرابط الجديد */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(x){}
  try{await self.registration.unregister()}catch(x){}
  try{const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>{try{const u=new URL(c.url);c.navigate('/taqweem/'+u.pathname.replace(/^\/Weight-plan\/taqweem\/?/i,'')+u.search+u.hash)}catch(x){}})}catch(x){}})()));
