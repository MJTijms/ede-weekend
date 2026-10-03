import fs from 'node:fs/promises';
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.copyFile('worker/reader.js','dist/server/index.js');await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built read-only scores endpoint.');
