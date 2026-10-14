import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';
const source=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const key='cacarola-kanban-2026-0713-v1',errors=[],downloads=[];
function open(html=source,storage=null,blocked=false){const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));return new JSDOM(html,{url:blocked?'file:///Kanban-Cacarola.html':'https://local.test/kanban',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};if(storage)w.localStorage.setItem(key,storage);w.Blob=globalThis.Blob;w.URL.createObjectURL=blob=>{downloads.push({blob});return 'blob:https://local.test/'+downloads.length};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloads.at(-1).filename=this.download;};}});}
const dom=open(),w=dom.window,doc=w.document;
const click=s=>{const el=doc.querySelector(s);assert.ok(el,'Elemento '+s);el.click();};
const value=(s,x,event='input')=>{const el=doc.querySelector(s);assert.ok(el,s);el.value=x;el.dispatchEvent(new w.Event(event,{bubbles:true}));};
const submit=()=>doc.querySelector('#task-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const saved=()=>JSON.parse(w.localStorage.getItem(key));
function drag(selector,target,type,id){const values={[type]:id,'text/plain':id};const ev=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(ev,'dataTransfer',{value:{getData:k=>values[k]||''}});doc.querySelector(target).dispatchEvent(ev);}
assert.equal(doc.querySelectorAll('.campaign').length,8);
click('[data-view="tasks"]');assert.equal(doc.querySelectorAll('.task').length,25);
click('[data-new-action]');assert.ok(doc.querySelector('#action-editor').open);
value('#task-title','    ');submit();assert.ok(!doc.querySelector('#task-error').hidden);assert.equal(doc.querySelectorAll('.task').length,25);
value('#task-campaign','C02','change');value('#task-title','Conferir público e exportação');value('#task-owner','Maria');value('#task-due','2026-10-20');value('#task-stage','Em andamento','change');value('#task-priority','Alta','change');value('#task-evidence','Nova tarefa para revisão');value('#task-acceptance','Relatório recebido e revisado');submit();
assert.equal(doc.querySelectorAll('.task').length,26);const id=saved().customActions[0].id;assert.equal(saved().customActions[0].owner,'Maria');assert.equal(saved().tasks[id],'Em andamento');assert.equal(doc.querySelectorAll('.taskboard .lane')[1].querySelectorAll('.task').length,1);
click(`[data-edit-action="${id}"]`);value('#task-title','Conferir público corrigido');value('#task-owner','João');value('#task-due','2026-10-22');submit();assert.equal(saved().actionEdits[id].owner,'João');assert.ok(doc.querySelector('#content').textContent.includes('Conferir público corrigido'));
drag(null,'[data-task-lane="Concluído"]','application/x-cacarola-task',id);assert.equal(saved().tasks[id],'Concluído');assert.equal(doc.querySelectorAll('.taskboard .lane')[2].querySelectorAll('.task').length,1);
click(`[data-archive-action="${id}"]`);assert.equal(doc.querySelectorAll('.task').length,25);assert.ok(saved().archived.includes(id));click(`[data-restore-action="${id}"]`);assert.equal(doc.querySelectorAll('.task').length,26);
click('[data-edit-action="C01-A1"]');value('#task-owner','Equipe de mídia');value('#task-due','2026-10-25');submit();assert.equal(saved().actionEdits['C01-A1'].owner,'Equipe de mídia');
click('[data-view="kanban"]');drag(null,'[data-lane="Concluída"]','text/plain','C03');assert.equal(saved().campaigns.C03,'Concluída');
click('[data-open="C01"]');value('[data-campaign-field="owner"]','Ana');value('[data-campaign-field="due"]','2026-10-21');assert.equal(saved().details.C01.owner,'Ana');assert.equal(saved().details.C01.due,'2026-10-21');
value('#campaignnote','Anotação <script>texto</script> com acentuação');click('[data-tab="actions"]');click('[data-new-action="C01"]');value('#task-title','Tarefa criada dentro da ficha');submit();assert.equal(saved().customActions.length,2);assert.ok(doc.querySelector('#dialog').open);assert.ok(!doc.querySelector('#action-editor').open);click('#close');
// Reload from browser storage: all work survives a fresh runtime.
const persisted=w.localStorage.getItem(key),reload=open(source,persisted);assert.equal(reload.window.eval('state.customActions.length'),2);assert.equal(reload.window.eval('state.actionEdits["C01-A1"].owner'),'Equipe de mídia');assert.equal(reload.window.eval('state.details.C01.owner'),'Ana');reload.window.close();
// Reopen the self-contained HTML without browser storage: state survives in the file.
const portable=w.eval('portableHTML()');const exported=open(portable,null,true);assert.equal(exported.window.eval('state.customActions.length'),2);assert.equal(exported.window.eval('state.details.C01.owner'),'Ana');assert.equal(exported.window.eval('state.notes.C01'),'Anotação <script>texto</script> com acentuação');assert.equal(exported.window.document.querySelectorAll('#kanban-save').length,1);assert.equal(exported.window.document.querySelectorAll('#action-editor').length,1);assert.equal(exported.window.document.querySelectorAll('dialog[open]').length,0);assert.ok(exported.window.document.querySelector('#save-status').textContent.includes('indisponível'));exported.window.close();
// Backup restore keeps every editable field and supports the old backup format.
const normalized=w.eval('normalizeState('+JSON.stringify(saved())+')');assert.equal(normalized.customActions.length,2);assert.equal(normalized.tasks[id],'Concluído');assert.equal(normalized.actionEdits[id].due,'2026-10-22');assert.equal(normalized.details.C01.owner,'Ana');
const legacy=w.eval('normalizeState({campaigns:{C02:"A revisar"},tasks:{"C01-A1":"Em andamento"},notes:{C02:"Antigo"}})');assert.equal(legacy.notes.C02,'Antigo');assert.equal(legacy.customActions.length,0);
// Exercise the real buttons and uploaded-backup handler, not just serialization helpers.
click('#backup');const backup=await downloads.at(-1).blob.text();assert.equal(downloads.at(-1).filename,'organizacao-kanban-cacarola.json');assert.equal(JSON.parse(backup).state.customActions.length,2);
click('#kanban-save');assert.equal(downloads.at(-1).filename,'Kanban-Cacarola-salvo.html');assert.ok((await downloads.at(-1).blob.text()).includes('Conferir público corrigido'));
click('[data-view="tasks"]');click('#actions-csv');assert.equal(downloads.at(-1).filename,'tarefas-cacarola.csv');assert.ok((await downloads.at(-1).blob.text()).includes('João'));
click('#export');assert.equal(downloads.at(-1).filename,'resumo-campanhas-cacarola.csv');
const input=doc.querySelector('#restore');await input.onchange({target:{files:[{text:async()=>backup}],value:''}});assert.equal(saved().customActions.length,2);assert.equal(saved().details.C01.owner,'Ana');
const beforeInvalid=JSON.stringify(saved());await input.onchange({target:{files:[{text:async()=>JSON.stringify({version:2,period:'2026-07-01/2026-10-13',state:'inválido'})}],value:''}});assert.equal(JSON.stringify(saved()),beforeInvalid);assert.ok(doc.querySelector('#toast').textContent.includes('inválido'));
assert.equal(w.eval('validDate("2026-02-31")'),'');assert.equal(errors.length,0,errors.join('\n'));
console.log('FUNCIONAL OK: criação, validação, edição, responsável, prazo, prioridade, arrastar campanhas e tarefas, arquivar/restaurar, recarregar, backup e reabrir HTML com alterações mesmo sem armazenamento.');
dom.window.close();
