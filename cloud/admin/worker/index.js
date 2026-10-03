/* The hosting dispatcher owns ChatGPT login and overwrites identity headers.
   Identity is checked again on every write; public requests can only read. */
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
const publicOrigin='https://mjtijms.github.io';
function json(body,status=200,extra={}){return new Response(JSON.stringify(body),{status,headers:{...HEADERS,...extra}});}
function owner(request,env){return !!env.ADMIN_EMAIL&&!!request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase();}
function cors(request){return request.headers.get('Origin')===publicOrigin?{'Access-Control-Allow-Origin':publicOrigin,'Vary':'Origin'}:{};}
async function readState(env){
 await env.DB.prepare('INSERT OR IGNORE INTO weekend_state (id,revision,body,updated_at) VALUES (?,?,?,?)').bind('ede',INITIAL_STATE.revision,JSON.stringify(INITIAL_STATE),INITIAL_STATE.updatedAt).run();
 const row=await env.DB.prepare('SELECT body FROM weekend_state WHERE id = ?').bind('ede').first();
 if(!row)throw Error('State unavailable');return validateState(JSON.parse(row.body));
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),route=url.pathname;
  try {
   if(route==='/api/public-state'&&request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors(request),'Access-Control-Allow-Methods':'GET','Access-Control-Max-Age':'600'}});
   if(route==='/api/session'&&request.method==='GET')return json({editable:owner(request,env),signedIn:!!request.headers.get('oai-authenticated-user-id'),csrf:'same-origin-only',mode:'cloud',loginURL:'/signin-with-chatgpt?return_to=%2F',logoutURL:'/signout-with-chatgpt?return_to=%2F'});
   if((route==='/api/public-state'||route==='/api/state')&&request.method==='GET'){
    const state=await readState(env);return json(route==='/api/state'?{state,pending:false,publishError:''}:state,200,route==='/api/public-state'?cors(request):{});
   }
   if(route==='/api/state'&&request.method==='PUT'){
    if(!owner(request,env))return json({error:'Alleen de beheerder kan de stand aanpassen.'},403);
    if(request.headers.get('Origin')!==env.ADMIN_ORIGIN||request.headers.get('X-EDE-CSRF')!=='same-origin-only')return json({error:'Geen toegang vanaf deze pagina.'},403);
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Ongeldig verzoek.'},415);
    const raw=await request.text();if(raw.length>2000000)return json({error:'Te veel gegevens.'},413);
    let payload;try{payload=JSON.parse(raw);validateState(payload.state);}catch{return json({error:'De uitslag bevat ongeldige gegevens.'},400);}
    const previous=await readState(env);
    if(payload.baseRevision!==previous.revision)return json({error:'De stand is op een ander apparaat gewijzigd. De nieuwste stand is geladen; voer je wijziging opnieuw in.',state:previous},409);
    const next=payload.state,now=new Date().toISOString();
    const clean={schemaVersion:1,revision:previous.revision+1,updatedAt:now,results:Object.fromEntries(Object.entries(next.results).map(([id,r])=>[id,{winner:r.winner,scores:r.scores,updatedAt:now}])),behavior:next.behavior.map(e=>({id:e.id,player:e.player,delta:e.delta,at:e.at}))};
    const result=await env.DB.prepare('UPDATE weekend_state SET revision = ?, body = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(clean.revision,JSON.stringify(clean),now,'ede',previous.revision).run();
    if(result.meta.changes!==1)return json({error:'Een andere wijziging was je net voor. De nieuwste stand is geladen; probeer opnieuw.',state:await readState(env)},409);
    return json({state:clean,pending:false,publishError:''});
   }
   if(route.startsWith('/api/'))return json({error:'Niet gevonden.'},404);
   if(!['GET','HEAD'].includes(request.method))return json({error:'Niet toegestaan.'},405);
   const asset=ASSETS[route==='/'?'/index.html':route];
   if(!asset)return new Response('Niet gevonden',{status:404});
   return new Response(request.method==='HEAD'?null:asset.content,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self' https://chatgpt.com"}});
  }catch{return json({error:'De online stand is tijdelijk niet beschikbaar. Je invoer is niet opgeslagen; probeer opnieuw.'},503);}
 }
};
