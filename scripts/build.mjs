import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFile(path.join(root,name),'utf8');
const [data,metaData,template,code,theme,logo]=await Promise.all([
  read('data/campaigns.json').then(JSON.parse),
  read('data/meta-campaigns.json').then(JSON.parse),
  read('src/painel-template.html'),
  read('src/kanban-funcional.js'),
  read('src/trafegon-theme.css'),
  fs.readFile(path.join(root,'assets','logo-trafegon-branca.svg'))
]);

const safeJson=value=>JSON.stringify(value).replace(/<\//g,'<\\/');
const replacements={
  __DATA__:safeJson(data),
  __META_DATA__:safeJson(metaData),
  __FUNCTIONAL__:code,
  __BRAND_CSS__:theme,
  __LOGO_DATA__:'data:image/svg+xml;base64,'+logo.toString('base64')
};
const html=Object.entries(replacements).reduce((page,[marker,value])=>page.replace(marker,value),template);
if(Object.keys(replacements).some(marker=>html.includes(marker)))throw new Error('Página gerada incompleta.');

const output=path.join(root,'dist');
await fs.mkdir(output,{recursive:true});
await Promise.all([
  fs.writeFile(path.join(root,'index.html'),html,'utf8'),
  fs.writeFile(path.join(output,'index.html'),html,'utf8'),
  fs.writeFile(path.join(root,'.nojekyll'),'','utf8')
]);
console.log('Build concluído: painel Google/YouTube e Meta Ads em index.html e dist/.');
