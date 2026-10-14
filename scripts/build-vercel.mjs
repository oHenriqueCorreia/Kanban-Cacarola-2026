import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data','campaigns.json'),'utf8'));
const template=await fs.readFile(path.join(root,'src','painel-template.html'),'utf8');
const code=await fs.readFile(path.join(root,'src','kanban-funcional.js'),'utf8');
const embedded=JSON.stringify(data).replace(/<\//g,'<\\/');
const html=template.replace('__DATA__',embedded).replace('__FUNCTIONAL__',code);
if(html.includes('__DATA__')||html.includes('__FUNCTIONAL__'))throw new Error('Página gerada incompleta.');

const output=path.join(root,'dist');
await fs.mkdir(path.join(output,'downloads'),{recursive:true});
await fs.writeFile(path.join(output,'index.html'),html,'utf8');
await fs.copyFile(path.join(root,'downloads','Campanhas-Cacarola.xlsx'),path.join(output,'downloads','Campanhas-Cacarola.xlsx'));
console.log('Publicação Vercel preparada: Kanban completo e planilha Excel.');
