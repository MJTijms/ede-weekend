import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),front=path.join(root,'frontend');
const assets={};
for(const file of ['index.html','app.js','config.js','data.js','scoring.js','style.css','assets/ribbon.svg','assets/favicon.svg']){
 let content=await fs.readFile(path.join(front,file),'utf8');
 if(file==='app.js')content=content.replace('href="assets/${file}.png"','href="https://mjtijms.github.io/ede-weekend/assets/${file}.png"');
 const ext=path.extname(file),type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'}[ext];assets['/'+file]={content,type};
}
const data=(await fs.readFile(path.join(front,'data.js'),'utf8')).replaceAll('export ','');
const scoring=(await fs.readFile(path.join(front,'scoring.js'),'utf8')).replace(/^import .*\n/,'').replaceAll('export ','');
const initial=JSON.parse(await fs.readFile('initial-state.json','utf8'));
const source=await fs.readFile('worker/index.js','utf8');
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js',`${data}\n${scoring}\nconst INITIAL_STATE=${JSON.stringify(initial)};\nconst ASSETS=${JSON.stringify(assets)};\n${source}`);
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built cloud score app.');
