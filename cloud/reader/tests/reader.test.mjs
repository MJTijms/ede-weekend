import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/reader.js';
test('Read-only proxy rejects every write and unknown route without reaching storage',async()=>{
 const original=globalThis.fetch;let called=false;globalThis.fetch=async()=>{called=true;throw Error('No');};
 try{for(const method of ['POST','PUT','DELETE','PATCH'])assert.equal((await worker.fetch(new Request('https://read.example/api/scores',{method}),{})).status,405);assert.equal((await worker.fetch(new Request('https://read.example/api/state'),{})).status,404);assert.equal(called,false);}finally{globalThis.fetch=original;}
});
test('Only fixed state endpoint is requested; credential never appears in public response',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{assert.equal(options.redirect,'manual');assert.equal(url,'https://private.example/api/public-state');assert.equal(options.headers['OAI-Sites-Authorization'],'Bearer secret-for-test');return new Response(JSON.stringify({schemaVersion:1,revision:5,updatedAt:null,results:{},behavior:[],extra:'secret-for-test'}));};
 try{const r=await worker.fetch(new Request('https://read.example/api/scores?url=https://evil.example',{headers:{Origin:'https://mjtijms.github.io'}}),{ADMIN_BASE:'https://private.example',STATE_READ_TOKEN:'secret-for-test'});assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://mjtijms.github.io');assert.ok(!(await r.text()).includes('secret-for-test'));}finally{globalThis.fetch=original;}
});
