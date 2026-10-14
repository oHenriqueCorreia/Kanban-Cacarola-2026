import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

export function checkResults(html){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const oldOrganization='{"campaigns":{"C01":"Concluída"},"notes":{"C01":"Nota anterior"},"tasks":{}}';
 const dom=new JSDOM(html,{url:'https://kanban-test.vercel.app/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.localStorage.setItem('cacarola-kanban-2026-0713-v1',oldOrganization);
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 }});
 const w=dom.window,doc=w.document;
 const click=s=>{const el=doc.querySelector(s);assert.ok(el,'Elemento ausente '+s);el.click();};
 const change=(s,v,event='change')=>{const el=doc.querySelector(s);el.value=v;el.dispatchEvent(new w.Event(event));};
 const readOnly=()=>{
  assert.equal(doc.querySelectorAll('form,textarea,input:not([type="search"]),select:not(#family),[draggable],a[download],.download-link,#restore,#backup,#export,#print,[data-move],[data-task],[data-new-action],[data-edit-action],[data-open-tab="sources"]').length,0);
  const visible=doc.querySelector('main').textContent+doc.querySelector('#dialog').textContent;
  assert.doesNotMatch(visible,/Análise e ações|Plano de ações|Fontes completas|Fontes e auditoria|Restaurar organização|Editar acompanhamento|\.csv|\.zip|SHA-256|Nota anterior/i);
 };
 assert.deepEqual([...doc.querySelectorAll('[data-view]')].map(b=>b.dataset.view),['organized','compare']);
 assert.deepEqual([...doc.querySelectorAll('.organized-campaign')].map(c=>c.dataset.cid),['C01','C02','C03','C05','C06','C07','C08','C04']);
 assert.equal(doc.querySelectorAll('.informationcolumn').length,24);
 for(const c of doc.querySelectorAll('.organized-campaign'))assert.equal(c.querySelectorAll('.informationcolumn').length,3);
 for(const total of ['657.470','567.161','2.980,15','261'])assert.ok(doc.querySelector('#stats').textContent.includes(total));
 readOnly();
 change('#family','Bahia');assert.equal(doc.querySelectorAll('.organized-campaign').length,3);
 change('#family','TRON SC');assert.equal(doc.querySelectorAll('.organized-campaign').length,4);
 change('#family','Remarketing');assert.equal(doc.querySelectorAll('.organized-campaign').length,1);
 change('#family','');change('#search','YouTube 04','input');assert.equal(doc.querySelectorAll('.organized-campaign').length,1);
 change('#search','campanha inexistente','input');assert.equal(doc.querySelectorAll('.organized-campaign').length,0);assert.ok(doc.querySelector('#content').textContent.includes('Nenhuma campanha'));
 change('#search','','input');
 const data=JSON.parse(doc.querySelector('#dataset').textContent);
 for(const c of data.campaigns){
  click(`[data-open="${c.id}"]`);assert.ok(doc.querySelector('#dialog').open);assert.equal(doc.querySelector('#modaltitle').textContent,c.name);
  assert.equal(doc.querySelectorAll('[data-tab]').length,5);
  for(const tab of ['overview','audience','video','timeline','brand']){
   click(`[data-tab="${tab}"]`);assert.ok(doc.querySelector('#modalcontent').textContent.trim().length>40,`${c.id} ${tab}`);readOnly();
   if(tab==='audience')assert.equal(doc.querySelectorAll('#modalcontent tbody tr').length,c.locations.length||1);
   if(tab==='timeline')assert.equal(doc.querySelectorAll('#modalcontent tbody tr').length,c.daily.length||1);
   if(tab==='video'&&c.id==='C02')assert.ok(doc.querySelector('#modalcontent').textContent.includes('Relatório de anúncios ausente'));
  }
  click('#close');assert.equal(doc.querySelector('#dialog').open,false);
 }
 click('[data-open="C01"][data-open-tab="timeline"]');assert.equal(doc.querySelector('[data-tab="timeline"]').getAttribute('aria-selected'),'true');click('#close');
 click('[data-view="compare"]');assert.equal(doc.querySelectorAll('#content tbody tr').length,8);readOnly();
 change('#family','Bahia');assert.equal(doc.querySelectorAll('#content tbody tr').length,3);click('[data-open="C02"]');click('#close');change('#family','');
 click('[data-view="organized"]');assert.equal(doc.querySelectorAll('.organized-campaign').length,8);
 assert.equal(w.localStorage.getItem('cacarola-kanban-2026-0713-v1'),oldOrganization);
 assert.equal(errors.length,0,errors.join('\n'));
 return dom;
}
