import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argument=process.argv.indexOf('--port');
const port=argument>=0?Number(process.argv[argument+1]):8000;
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Porta inválida.');

const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)){response.writeHead(403).end('Acesso negado');return;}
  fs.readFile(target,(error,content)=>{
    if(error){response.writeHead(error.code==='ENOENT'?404:500).end('Arquivo não encontrado');return;}
    response.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'}).end(content);
  });
});
server.listen(port,'127.0.0.1',()=>console.log(`Kanban: http://127.0.0.1:${port}/`));
