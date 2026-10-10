self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
self.addEventListener('push',e=>{let d={};try{d=e.data.json();}catch(_){d={title:'خطتي للوزن',body:e.data?e.data.text():''};}
 e.waitUntil(self.registration.showNotification(d.title||'خطتي للوزن',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||undefined,lang:'ar',dir:'rtl',data:{url:'./'}}));});
self.addEventListener('notificationclick',e=>{e.notification.close();
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if('focus' in w){return w.focus();}}return self.clients.openWindow('./');}));});
