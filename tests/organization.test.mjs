import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const data=JSON.parse(await fs.readFile(new URL('../data/campaigns.json',import.meta.url),'utf8')),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://local.test/kanban',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};}});
const w=dom.window,doc=w.document;
assert.equal(w.eval('view'),'organized');assert.equal(doc.querySelectorAll('.organized-campaign').length,8);assert.ok(doc.querySelector('#stats').hidden);
assert.deepEqual([...doc.querySelectorAll('.organized-campaign')].map(el=>el.dataset.cid),['C01','C02','C03','C05','C06','C07','C08','C04']);
for(const c of data.campaigns){const el=doc.querySelector('#campaign-'+c.id);assert.equal(el.querySelector('h2').textContent,c.name);assert.equal(el.querySelectorAll('.informationcolumn').length,4);assert.ok(el.textContent.includes(c.audience));assert.ok(el.textContent.includes(c.metrics['Visualizações públicas do YouTube'].toLocaleString('pt-BR')));assert.ok(el.textContent.includes(c.metrics['Impr.'].toLocaleString('pt-BR')));assert.equal(el.querySelectorAll('[data-campaign-task]').length,c.actions.length);assert.ok([...el.querySelectorAll('[data-campaign-task]')].every(t=>t.dataset.campaignTask===c.id));assert.ok([...el.querySelectorAll('[data-new-action]')].every(b=>b.dataset.newAction===c.id));assert.ok([...el.querySelectorAll('[data-open]')].every(b=>b.dataset.open===c.id));for(const r of c.locations)assert.ok(el.textContent.includes(r.Local),`${c.id}: local ausente ${r.Local}`);}
assert.ok(doc.querySelector('#campaign-C02').textContent.includes('Relatório de anúncios ausente'));assert.ok(doc.querySelector('#campaign-C08').textContent.includes('Relatório de locais ausente'));
assert.ok(!doc.querySelector('#campaign-C02').textContent.includes('Salvador, Bahia, Brasil'));
const complete=doc.querySelector('#campaign-C01 [data-complete-action="C01-A1"]');complete.checked=true;complete.dispatchEvent(new w.Event('change'));assert.equal(w.eval('state.tasks["C01-A1"]'),'Concluído');assert.ok(doc.querySelector('#campaign-C01').textContent.includes('1 de 3'));assert.ok(doc.querySelector('#campaign-C02').textContent.includes('0 de 4'));
doc.querySelector('#campaign-C03 [data-open-tab="audience"]').click();assert.equal(w.eval('selected.id'),'C03');assert.equal(w.eval('tab'),'audience');assert.ok(doc.querySelector('#modalcontent').textContent.includes('Uruçuca'));doc.querySelector('#close').click();
const filter=doc.querySelector('#family');filter.value='TRON SC';filter.dispatchEvent(new w.Event('change'));assert.equal(doc.querySelectorAll('.organized-campaign').length,4);filter.value='';filter.dispatchEvent(new w.Event('change'));
const search=doc.querySelector('#search');search.value='Remarketing';search.dispatchEvent(new w.Event('input'));assert.equal(doc.querySelectorAll('.organized-campaign').length,1);assert.equal(doc.querySelector('.organized-campaign').dataset.cid,'C04');
assert.equal(errors.length,0,errors.join('\n'));console.log('ORGANIZAÇÃO OK: 8 campanhas isoladas; quatro áreas por campanha; todos os locais; indicadores e tarefas corretos; filtros; atalhos; conclusão independente por campanha.');
