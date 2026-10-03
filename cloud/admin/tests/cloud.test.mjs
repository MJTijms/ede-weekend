import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
const source=await fs.readFile('dist/server/index.js','utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const sqlite=new DatabaseSync(':memory:');sqlite.exec(await fs.readFile('drizzle/0000_magenta_master_chief.sql','utf8'));
const DB={prepare(sql){let args=[];return{bind(...values){args=values;return this;},async first(){return sqlite.prepare(sql).get(...args);},async run(){return{meta:{changes:sqlite.prepare(sql).run(...args).changes}};}};}};
const env={DB,ADMIN_EMAIL:'owner@example.test',ADMIN_ORIGIN:'https://private.example.test'};
const request=(route,method='GET',body=null,headers={})=>new Request(env.ADMIN_ORIGIN+route,{method,headers,body:body===null?null:JSON.stringify(body)});
const auth={'oai-authenticated-user-id':'signed-owner','oai-authenticated-user-email':env.ADMIN_EMAIL,'Origin':env.ADMIN_ORIGIN,'X-EDE-CSRF':'same-origin-only','Content-Type':'application/json'};
test('Private cloud seed is preserved and only the owner sees editing',async()=>{
 const first=await(await worker.fetch(request('/api/public-state'),env)).json();assert.equal(first.revision,5);assert.deepEqual(first.results,{});
 assert.equal((await(await worker.fetch(request('/api/session'),env)).json()).editable,false);
 assert.equal((await(await worker.fetch(request('/api/session','GET',null,auth),env)).json()).editable,true);
 assert.equal((await(await worker.fetch(request('/api/session','GET',null,{...auth,'oai-authenticated-user-email':'other@example.test'}),env)).json()).editable,false);
});
test('Writes reject anonymous, other account, cross-origin and invalid data',async()=>{
 const state=await(await worker.fetch(request('/api/public-state'),env)).json(),body={baseRevision:state.revision,state};
 assert.equal((await worker.fetch(request('/api/state','PUT',body),env)).status,403);
 assert.equal((await worker.fetch(request('/api/state','PUT',body,{...auth,'oai-authenticated-user-email':'other@example.test'}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/state','PUT',body,{...auth,Origin:'https://evil.example'}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/state','PUT',body,{...auth,'X-EDE-CSRF':'wrong'}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/state','PUT',{baseRevision:state.revision,state:{...state,results:{invented:{winner:0,scores:[1,0]}}}},auth),env)).status,400);
});
test('Cloud persistence and compare-and-swap prevent lost phone/laptop changes',async()=>{
 const state=await(await worker.fetch(request('/api/public-state'),env)).json();state.behavior=[{id:'test',player:'Q',delta:1,at:new Date().toISOString()}];
 const body={baseRevision:state.revision,state};let response=await worker.fetch(request('/api/state','PUT',body,auth),env);assert.equal(response.status,200);let saved=await response.json();assert.equal(saved.state.revision,6);
 response=await worker.fetch(request('/api/state','PUT',body,auth),env);assert.equal(response.status,409);assert.equal((await response.json()).state.behavior.length,1);
 const again=await(await worker.fetch(request('/api/public-state'),env)).json();assert.equal(again.behavior[0].player,'Q');assert.equal(again.revision,6);
});
test('Public read has narrowly scoped CORS and does not expose admin identity',async()=>{
 const r=await worker.fetch(request('/api/public-state','GET',null,{Origin:'https://mjtijms.github.io'}),env);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://mjtijms.github.io');assert.ok(!(await r.text()).includes(env.ADMIN_EMAIL));
 assert.equal((await worker.fetch(request('/api/public-state','GET',null,{Origin:'https://evil.example'}),env)).headers.get('Access-Control-Allow-Origin'),null);
});
