import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {emptyState} from '../publish/scoring.js';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'ede-test-')),port=4188,base=`http://127.0.0.1:${port}`;
let child;
async function start(){child=spawn(process.execPath,['scripts/server.mjs','--preview'],{env:{...process.env,EDE_PORT:String(port),EDE_DATA_FILE:path.join(temp,'scores.json')},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error(`Server exited: ${code}`)));});}
test('Local admin: guarded writes, conflict protection, disk persistence and no local files exposed',async()=>{
 try{
  await start();const session=await(await fetch(base+'/api/session')).json();assert.equal(session.editable,true);
  const next=emptyState();next.behavior=[{id:'event1',player:'Q',delta:1,at:new Date().toISOString()}];
  const body=JSON.stringify({baseRevision:0,state:next});
  let response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body});assert.equal(response.status,403);
  response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-EDE-CSRF':session.csrf,Origin:'https://evil.example'},body});assert.equal(response.status,403);
  response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-EDE-CSRF':session.csrf},body});assert.equal(response.status,200);assert.equal((await response.json()).state.revision,1);
  response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-EDE-CSRF':session.csrf},body});assert.equal(response.status,409);
  assert.equal((await fetch(base+'/.git/config')).status,404);assert.equal((await fetch(base+'/scripts/server.mjs')).status,404);
  const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;await start();
  const persisted=(await(await fetch(base+'/api/state')).json()).state;assert.equal(persisted.revision,1);assert.equal(persisted.behavior[0].player,'Q');
 }finally{if(child){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}await fs.rm(temp,{recursive:true,force:true});}
});
