const FRIENDS_ORIGIN='https://mjtijms.github.io';
export default {
 async fetch(request,env){
  const url=new URL(request.url),cors=request.headers.get('Origin')===FRIENDS_ORIGIN?{'Access-Control-Allow-Origin':FRIENDS_ORIGIN,'Vary':'Origin'}:{};
  // This worker deliberately has no write, login, admin or general proxy route.
  if(url.pathname!=='/api/scores')return new Response('Niet gevonden',{status:404});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'GET','Access-Control-Max-Age':'600'}});
  if(request.method!=='GET')return new Response('Alleen lezen',{status:405,headers:{'Allow':'GET'}});
  if(!env.ADMIN_BASE||!env.STATE_READ_TOKEN){console.error('Missing reader configuration',{bindingNames:Object.keys(env),processAdmin:!!globalThis.process?.env?.ADMIN_BASE,processToken:!!globalThis.process?.env?.STATE_READ_TOKEN});return new Response('Niet beschikbaar',{status:503});}
  try{
   const upstream=await fetch(env.ADMIN_BASE+'/api/public-state',{headers:{'OAI-Sites-Authorization':`Bearer ${env.STATE_READ_TOKEN}`},redirect:'manual',signal:AbortSignal.timeout(10000)});
   if(!upstream.ok){console.error('State read failed',{status:upstream.status});throw Error('Unavailable');}
   const state=await upstream.json();if(state.schemaVersion!==1||!Number.isSafeInteger(state.revision)||!state.results||!Array.isArray(state.behavior))throw Error('Invalid');
   return new Response(JSON.stringify({schemaVersion:state.schemaVersion,revision:state.revision,updatedAt:state.updatedAt,results:state.results,behavior:state.behavior}),{headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){console.error('State reader unavailable',{kind:error.name,message:error.message});return new Response('De stand is tijdelijk niet bereikbaar',{status:503,headers:{...cors,'Cache-Control':'no-store'}});}
 }
};
