import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {validateState,emptyState} from '../publish/scoring.js';
const exec=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),webroot=path.join(root,'publish');
const git=(args,options={})=>exec('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-C',webroot,...args],options);
const preview=process.argv.includes('--preview'),port=Number(process.env.EDE_PORT||4173),datafile=process.env.EDE_DATA_FILE||path.join(preview?path.join(root,'.runtime'):webroot,preview?'preview-scores.json':'scores.json');
const token=crypto.randomBytes(32).toString('hex');
let state,publishError='',publishing=false,publishedRevision=0,timer,saveChain=Promise.resolve();
try{state=validateState(JSON.parse(await fs.readFile(datafile,'utf8')));}catch(e){if(e.code==='ENOENT')state=emptyState();else throw e;}
const status=()=>({state,publishError,publishing,pending:!preview&&state.revision>publishedRevision});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
function send(res,code,body){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
async function publish() {
 if(preview||publishing||state.revision<=publishedRevision)return;
 publishing=true;publishError='';
 const revision=state.revision;
 try {
  await git(['fetch','origin','main'],{timeout:30000});
  const {stdout:behind}=await git(['rev-list','--count','HEAD..origin/main']);
  if(Number(behind.trim())>0)throw Error('De GitHub-versie bevat nieuwe wijzigingen. Synchroniseer eerst het project.');
  const {stdout:changes}=await git(['status','--porcelain']);
  if(changes.trimEnd().split('\n').filter(Boolean).some(line=>line.slice(3).trim()!=='publish/scores.json'))throw Error('Andere appwijzigingen wachten nog op publicatie.');
  await git(['add','--','scores.json']);
  const {stdout:staged}=await git(['diff','--cached','--name-only']);
  if(staged.trim())await git(['commit','-m',`Update weekend standings (${revision})`],{timeout:30000});
  await git(['push','origin','main'],{timeout:30000});
  publishedRevision=revision;
 }catch(e){publishError=e.message.includes('GitHub-versie')||e.message.includes('appwijzigingen')?e.message:'De openbare stand kon niet worden bijgewerkt. Controleer de internetverbinding en GitHub-aanmelding.';}
 finally{publishing=false;if(!publishError&&state.revision>publishedRevision)queuePublish();}
}
function queuePublish(){clearTimeout(timer);timer=setTimeout(publish,1800);}
async function readBody(req) {let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2000000)throw Error('Te veel gegevens.');}return JSON.parse(body);}
async function mutate(req,res){
 const payload=await readBody(req);
 if(payload.baseRevision!==state.revision)return send(res,409,{error:'De stand is in een ander venster gewijzigd. De nieuwste stand is geladen; voer je wijziging opnieuw in.',state});
 const next=validateState(payload.state);next.revision=state.revision+1;next.updatedAt=new Date().toISOString();
 // Only persist the public competition fields; never arbitrary incoming fields.
 const clean={schemaVersion:1,revision:next.revision,updatedAt:next.updatedAt,results:Object.fromEntries(Object.entries(next.results).map(([id,r])=>[id,{winner:r.winner,scores:r.scores,updatedAt:next.updatedAt}])),behavior:next.behavior.map(e=>({id:e.id,player:e.player,delta:e.delta,at:e.at}))};
 await fs.mkdir(path.dirname(datafile),{recursive:true});
 await fs.writeFile(datafile+'.tmp',JSON.stringify(clean,null,2)+'\n');await fs.rename(datafile+'.tmp',datafile);state=clean;
 if(!preview)queuePublish();send(res,200,status());
}
const server=http.createServer(async(req,res)=>{
 const allowedHosts=[`127.0.0.1:${port}`,`localhost:${port}`];
 if(!allowedHosts.includes(req.headers.host))return send(res,403,{error:'Ongeldig adres.'});
 const url=new URL(req.url,`http://127.0.0.1:${port}`);
 try {
  if(url.pathname.startsWith('/api/')){
   if(req.method!=='GET'){
    if(req.headers['x-ede-csrf']!==token)return send(res,403,{error:'Geen toegang.'});
    if(req.headers.origin&&!allowedHosts.some(h=>req.headers.origin===`http://${h}`))return send(res,403,{error:'Geen toegang vanaf deze pagina.'});
   }
   if(req.method==='GET'&&url.pathname==='/api/session')return send(res,200,{editable:true,csrf:token,mode:preview?'preview':'admin'});
   if(req.method==='GET'&&url.pathname==='/api/state')return send(res,200,status());
   if(req.method==='PUT'&&url.pathname==='/api/state'){
    saveChain=saveChain.then(()=>mutate(req,res)).catch(e=>send(res,400,{error:e.message}));return;
   }
   if(req.method==='POST'&&url.pathname==='/api/publish'){await publish();return send(res,publishError?503:200,publishError?{error:publishError}:status());}
   return send(res,404,{error:'Niet gevonden.'});
  }
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Niet toegestaan.'});
  const pathname=decodeURIComponent(url.pathname);
  if(pathname.split('/').some(p=>p.startsWith('.')))return send(res,404,{error:'Niet gevonden.'});
  const target=path.resolve(webroot,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(webroot+path.sep))return send(res,403,{error:'Geen toegang.'});
  const content=await fs.readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});res.end(req.method==='HEAD'?undefined:content);
 }catch(e){send(res,e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'Niet gevonden.':'Het verzoek kon niet worden verwerkt.'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`EDE ${preview?'voorbeeld':'beheer'}: http://127.0.0.1:${port}/`));
// On restart, retry a locally saved score that was not pushed while offline.
if(!preview){try{const {stdout}=await git(['show','origin/main:publish/scores.json']);publishedRevision=JSON.parse(stdout).revision;if(state.revision>publishedRevision)queuePublish();}catch{publishedRevision=-1;}}
