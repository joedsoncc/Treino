// Cache para abrir sem internet, foto recebida pelo Compartilhar, lembretes com o app fechado e clique na notificação
const C="treino-9ddeea7d2f",FONTES="treino-fontes",EST="treino-estado";
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","badge.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("treino-")&&k!==C&&k!==FONTES&&k!==EST).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method==="POST"&&u.pathname.endsWith("/compartilhar")){e.respondWith((async()=>{
    try{const f=(await e.request.formData()).get("foto");if(f&&f.size){const c=await caches.open(EST);await c.put("./__compartilhado",new Response(f,{headers:{"content-type":f.type||"image/jpeg"}}))}}catch(err){}
    return Response.redirect("./?acao=cardapio",303)})());return}
  if(e.request.method!=="GET")return;
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(FONTES).then(c=>c.match(e.request).then(r=>{const n=fetch(e.request).then(x=>{c.put(e.request,x.clone());return x}).catch(()=>r);return r||n})));return}
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./"))))});
async function lembrar(){
  const c=await caches.open(EST),r=await c.match("./__estado");if(!r)return;const j=await r.json();
  const ag=new Date(),iso=new Date(ag.getTime()-ag.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const w=ag.getDay(),util=w>=1&&w<=5,min=ag.getHours()*60+ag.getMinutes();
  if(j.data!==iso){j.data=iso;j.feitos=[];j.avisados=[]}
  for(const l of j.lembretes||[]){if(!l.on||(l.dias==="util"&&!util)||(j.feitos||[]).includes(l.id)||(j.avisados||[]).includes(l.id))continue;
    const [h,m]=l.hora.split(":").map(Number),t=h*60+m;if(min<t||min>=t+120)continue;
    await self.registration.showNotification(l.txt,{tag:"lem-"+l.id,body:"Toque para abrir e marcar no app.",icon:"icon-192.png",badge:"badge.png",data:{url:"./?acao=refeicao"}});
    (j.avisados=j.avisados||[]).push(l.id)}
  await c.put("./__estado",new Response(JSON.stringify(j)));
}
self.addEventListener("periodicsync",e=>{if(e.tag==="lembretes")e.waitUntil(lembrar())});
self.addEventListener("notificationclick",e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||"./";
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
  for(const c of cs){if("focus" in c){if(url!=="./"&&"navigate" in c)c.navigate(url);return c.focus()}}return self.clients.openWindow(url)}))});
