'use strict';
// Editable work records remain separate from historical campaign data.
function normalizeState(input){
 const x=input&&typeof input==='object'?input:{};
 const next={campaigns:{},tasks:{},notes:{},details:{},actionEdits:{},customActions:[],archived:[]};
 for(const c of DATA.campaigns){
  if(lanes.includes(x.campaigns?.[c.id]))next.campaigns[c.id]=x.campaigns[c.id];
  if(typeof x.notes?.[c.id]==='string')next.notes[c.id]=x.notes[c.id];
  if(x.details?.[c.id])next.details[c.id]={owner:String(x.details[c.id].owner||''),due:validDate(x.details[c.id].due)};
 }
 const campaignIds=new Set(DATA.campaigns.map(c=>c.id)),knownIds=new Set(DATA.campaigns.flatMap(c=>c.actions.map(a=>a.id)));
 for(const a of Array.isArray(x.customActions)?x.customActions:[]){
  if(!a||typeof a.id!=='string'||!a.id.startsWith('U-')||knownIds.has(a.id)||!campaignIds.has(a.campaignId)||!String(a.title||'').trim())continue;
  next.customActions.push(cleanAction(a));knownIds.add(a.id);
 }
 for(const id of knownIds){
  if(taskLanes.includes(x.tasks?.[id]))next.tasks[id]=x.tasks[id];
  if(x.actionEdits?.[id]&&String(x.actionEdits[id].title||'').trim())next.actionEdits[id]=cleanAction({...x.actionEdits[id],id});
 }
 next.archived=[...new Set((Array.isArray(x.archived)?x.archived:[]).filter(id=>knownIds.has(id)))];
 return next;
}
function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===value?value:''}
function cleanAction(a){return {id:a.id,campaignId:a.campaignId,title:String(a.title||'').trim(),evidence:String(a.evidence||''),acceptance:String(a.acceptance||''),priority:['Alta','Média','Baixa'].includes(a.priority)?a.priority:'Média',owner:String(a.owner||''),due:validDate(a.due),status:taskLanes.includes(a.status)?a.status:'A fazer'}}
state=normalizeState(state);
const originalRender=render,originalRenderModal=renderModal,originalWire=wire;
let editingAction=null,storageWorks=true;
save=function(){try{localStorage.setItem(KEY,JSON.stringify(state));storageWorks=true;}catch(e){storageWorks=false;}updateSaveStatus();};
function updateSaveStatus(){const el=$('#save-status');if(el)el.textContent=storageWorks?'Alterações salvas neste navegador.':'Armazenamento do navegador indisponível. As alterações desta sessão não poderão ser salvas.'}
function allActions(c,includeArchived=false){
 return [...c.actions,...state.customActions.filter(a=>a.campaignId===c.id)]
  .filter(a=>includeArchived||!state.archived.includes(a.id))
  .map(a=>({...a,...state.actionEdits[a.id],campaign:c,campaignId:c.id}));
}
function findAction(id){for(const c of DATA.campaigns){const a=allActions(c,true).find(a=>a.id===id);if(a)return a}return null}
function actionCard(a){
 return `<article class="task" draggable="true" data-aid="${esc(a.id)}"><span class="priority">Prioridade ${esc(a.priority)}</span><p>${esc(a.campaign.name)}</p><h3>${esc(a.title)}</h3><p>${esc(a.evidence)}</p><p><strong>Responsável:</strong> ${esc(a.owner&&a.owner!=='A definir'?a.owner:'A definir')}<br><strong>Prazo:</strong> ${a.due?dt(a.due):'A definir'}</p><details><summary>Como verificar</summary><p>${esc(a.acceptance||'Sem critério informado.')}</p></details><label>Etapa da ação<select data-task="${esc(a.id)}">${options(taskLanes,tstatus(a))}</select></label><div class="actionbuttons"><button data-edit-action="${esc(a.id)}">Editar</button><button data-archive-action="${esc(a.id)}">Arquivar</button><button data-open="${a.campaign.id}">Abrir campanha</button></div></article>`;
}
function actionsHTML(cs){
 const acts=cs.flatMap(c=>allActions(c)),archived=cs.flatMap(c=>allActions(c,true)).filter(a=>state.archived.includes(a.id));
 return `<div class="controls"><div><h2>Plano de ações</h2><p class="minor">${acts.filter(a=>tstatus(a)==='Concluído').length} de ${acts.length} ações concluídas. Arraste os cartões ou use o seletor de etapa.</p></div><div class="spacer"></div><button class="primary" data-new-action="${cs.length===1?cs[0].id:''}">+ Nova tarefa</button></div><div class="taskboard">${taskLanes.map(l=>`<section class="lane" data-task-lane="${l}"><div class="lanehead"><h2>${l}</h2><span class="count">${acts.filter(a=>tstatus(a)===l).length}</span></div>${acts.filter(a=>tstatus(a)===l).map(actionCard).join('')||'<p class="empty">Nenhuma tarefa nesta etapa.</p>'}</section>`).join('')}</div>${archived.length?`<details><summary>Tarefas arquivadas (${archived.length})</summary>${archived.map(a=>`<p>${esc(a.campaign.name)} — ${esc(a.title)} <button data-restore-action="${esc(a.id)}">Restaurar tarefa</button></p>`).join('')}</details>`:''}`;
}
function campaignInformation(c){
 const m=c.metrics,meta=state.details[c.id]||{},actions=allActions(c),done=actions.filter(a=>tstatus(a)==='Concluído').length;
 const locations=[...c.locations].sort((a,b)=>(num(b['Impr.'])||0)-(num(a['Impr.'])||0));
 const geoRows=rows=>rows.map(r=>[r.Local,cell(n(num(r['Impr.']))),cell(n(num(r['Visualizações do TrueView'])))]);
 const ad=c.ads[0];
 return `<section class="campaign organized-campaign" data-cid="${c.id}" id="campaign-${c.id}" aria-labelledby="campaign-title-${c.id}">
 <header class="campaignheading"><div><span class="tag">${c.family}</span><span class="minor">${c.id}</span><h2 id="campaign-title-${c.id}">${esc(c.name)}</h2><p>Período solicitado: 01/07 a 13/10/2026 · Entrega observada: ${dt(c.first_delivery)} a ${dt(c.last_delivery)}</p></div><div class="campaignbuttons"><button data-open="${c.id}">Ficha completa</button><label>Etapa da campanha<select data-move="${c.id}">${options(lanes,status(c))}</select></label></div></header>
 <div class="campaigncolumns">
 <section class="informationcolumn"><h3>Resumo e período</h3><p><strong>Objetivo:</strong> ${esc(c.campaign['Subtipo da campanha'])}<br><strong>Status exportado:</strong> ${esc(c.campaign.Status)}<br><strong>Orçamento:</strong> ${money(num(c.campaign.Orçamento))} — ${esc(c.campaign['Tipo de orçamento'])}</p><div class="metricgrid">${metric('Impressões',n(m['Impr.']))}${metric('Investimento',money(m.Custo))}${metric('Cliques',n(m.Cliques))}${metric('CTR',pct(m.CTR))}${metric('CPM calculado',money(m['CPM calculado']))}${metric('CPC calculado',money(m['CPC calculado']))}</div><p><strong>${c.active_days}</strong> dias com entrega nos arquivos.</p><p class="scopenote">${esc(c.scope_note)}</p><p><strong>Responsável:</strong> ${esc(meta.owner||'A definir')}<br><strong>Prazo:</strong> ${meta.due?dt(meta.due):'A definir'}</p><button data-open="${c.id}" data-open-tab="overview">Editar acompanhamento e anotações</button></section>
 <section class="informationcolumn"><h3>Público e locais</h3><p>${esc(c.audience)}</p><h4>Locais com mais impressões</h4>${locations.length?table(['Local / raio','Impressões','TrueView'],geoRows(locations.slice(0,3))):'<p class="missing">Relatório de locais ausente nesta campanha. Cidades e raios não foram confirmados.</p>'}<p class="scopenote">Período dos locais: ${esc(c.details_scope)}</p>${locations.length>3?`<details><summary>Todos os ${locations.length} locais desta campanha</summary>${table(['Local / raio original','Impressões','TrueView'],geoRows(locations))}</details>`:''}<button data-open="${c.id}" data-open-tab="audience">Público, raios e custos por local</button></section>
 <section class="informationcolumn"><h3>Vídeos e entrega</h3><div class="metricgrid">${metric('Visualizações públicas até 13/10',n(m['Visualizações públicas do YouTube']))}${metric('TrueView até 13/10',n(m['Visualizações do TrueView']))}</div>${ad?`<p><strong>Anúncio:</strong> ${esc(ad['Nome do anúncio'])}</p><p><strong>Mensagem:</strong> ${esc(ad['Título longo 1'])}</p><p><a href="${esc(ad.Vídeo)}" target="_blank" rel="noopener noreferrer">Abrir vídeo no YouTube</a></p><p><a href="${esc(ad['URL final'])}" target="_blank" rel="noopener noreferrer">Abrir página de destino</a></p>`:'<p class="missing">Relatório de anúncios ausente. Vídeo, texto e destino não foram confirmados para esta campanha.</p>'}<h4>Dispositivos</h4>${table(['Dispositivo','Impressões','TrueView'],c.devices.map(r=>[r.Dispositivo,cell(n(num(r['Impr.']))),cell(n(num(r['Visualizações do TrueView'])))]))}<p class="scopenote">Período dos anúncios e dispositivos: ${esc(c.details_scope)}</p><button data-open="${c.id}" data-open-tab="video">Detalhes dos vídeos e dispositivos</button><button data-open="${c.id}" data-open-tab="timeline">Evolução mensal e diária</button></section>
 <section class="informationcolumn"><h3>Análise e ações</h3><p><strong>${done} de ${actions.length}</strong> tarefas concluídas desta campanha.</p><details><summary>Análise completa e pontos de atenção</summary><ul class="notes">${c.notes.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details><div class="campaign-actions">${actions.map(a=>`<div class="compacttask" data-campaign-task="${c.id}"><label class="actioncheck"><input type="checkbox" data-complete-action="${esc(a.id)}"${tstatus(a)==='Concluído'?' checked':''}><span>${esc(a.title)}</span></label><p>${esc(a.priority)} · ${esc(tstatus(a))}<br>${esc(a.owner&&a.owner!=='A definir'?a.owner:'Responsável a definir')}${a.due?' · '+dt(a.due):''}</p><button data-edit-action="${esc(a.id)}">Editar tarefa</button></div>`).join('')||'<p>Nenhuma tarefa ativa.</p>'}</div><button class="primary" data-new-action="${c.id}">+ Nova tarefa desta campanha</button><button data-open="${c.id}" data-open-tab="actions">Gerenciar ações e tarefas arquivadas</button><button data-open="${c.id}" data-open-tab="sources">Fontes originais desta campanha</button></section>
 </div></section>`;
}
function organizedHTML(cs){
 const order={'Bahia':0,'TRON SC':1,'Remarketing':2},sorted=[...cs].sort((a,b)=>order[a.family]-order[b.family]||a.id.localeCompare(b.id));
 return `<div class="organizationintro"><h2>Informações separadas por campanha</h2><p>Uma seção para cada campanha, com resumo, público e locais, vídeos e entrega, análise e tarefas próprias.</p><nav class="campaignjump" aria-label="Ir para uma campanha">${sorted.map(c=>`<a href="#campaign-${c.id}">${esc(c.family==='Bahia'?'Bahia '+c.id.slice(-1):c.family==='Remarketing'?'Remarketing':'TRON '+String(Number(c.id.slice(1))-4).padStart(2,'0'))}</a>`).join('')}</nav></div>${sorted.map(campaignInformation).join('')||'<p>Nenhuma campanha corresponde ao filtro.</p>'}`;
}
render=function(){
 $('#stats').hidden=view==='organized';
 if(view==='organized'){renderStats(filtered());$('#content').innerHTML=organizedHTML(filtered());wire($('#content'));}
 else if(view==='tasks'){renderStats(filtered());$('#content').innerHTML=actionsHTML(filtered());wire($('#content'));}
 else{originalRender();$('#content').querySelectorAll('.campaign').forEach(el=>{const c=DATA.campaigns.find(c=>c.id===el.dataset.cid),meta=state.details[c.id]||{},acts=allActions(c);el.querySelector('[data-open]').insertAdjacentHTML('beforebegin',`<p><strong>Responsável:</strong> ${esc(meta.owner||'A definir')}<br><strong>Prazo:</strong> ${meta.due?dt(meta.due):'A definir'}<br><strong>Ações:</strong> ${acts.filter(a=>tstatus(a)==='Concluído').length}/${acts.length} concluídas</p>`);});}
 updateSaveStatus();
};
renderModal=function(){
 originalRenderModal();const c=selected;
 if(tab==='overview'){
  const meta=state.details[c.id]||{};
  $('#modalcontent').insertAdjacentHTML('beforeend',`<div class="block section"><h3>Acompanhamento da campanha</h3><div class="two"><label>Responsável<input data-campaign-field="owner" maxlength="160" value="${esc(meta.owner||'')}" placeholder="Nome do responsável"></label><label>Prazo<input type="date" data-campaign-field="due" value="${esc(meta.due||'')}"></label></div><p class="minor">Salvo automaticamente ao alterar. Para criar uma tarefa, abra Análise e ações.</p></div>`);
  $('#modalcontent').querySelectorAll('[data-campaign-field]').forEach(input=>input.oninput=()=>{state.details[c.id]={...state.details[c.id],[input.dataset.campaignField]:input.value};save();render();});
 }
 if(tab==='actions'){
  $('#modalcontent').innerHTML=`<h3>Análise da campanha</h3><ul class="notes">${c.notes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><div class="controls"><h3>Tarefas desta campanha</h3><div class="spacer"></div><button class="primary" data-new-action="${c.id}">+ Nova tarefa</button></div>${allActions(c).map(actionCard).join('')||'<p>Nenhuma tarefa ativa.</p>'}`;
  const archived=allActions(c,true).filter(a=>state.archived.includes(a.id));if(archived.length)$('#modalcontent').insertAdjacentHTML('beforeend',`<details><summary>Arquivadas (${archived.length})</summary>${archived.map(a=>`<p>${esc(a.title)} <button data-restore-action="${esc(a.id)}">Restaurar tarefa</button></p>`).join('')}</details>`);
  wire($('#modalcontent'));
 }
};
function refreshWork(){render();if(selected&&$('#dialog').open)renderModal();}
wire=function(root){
 originalWire(root);
 root.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>{if($('#dialog').open){selected=DATA.campaigns.find(c=>c.id===button.dataset.open);$('#modaltitle').textContent=selected.name;$('#modaleyebrow').textContent=selected.family+' · '+selected.id;$('#modalsubtitle').textContent='Entrega observada: '+dt(selected.first_delivery)+' a '+dt(selected.last_delivery);tab='overview';renderModal();}else openCampaign(button.dataset.open);if(button.dataset.openTab){tab=button.dataset.openTab;renderModal();}});
 root.querySelectorAll('[data-complete-action]').forEach(input=>input.onchange=()=>{state.tasks[input.dataset.completeAction]=input.checked?'Concluído':'A fazer';save();refreshWork();});
 root.querySelectorAll('[data-new-action]').forEach(button=>button.onclick=()=>openActionEditor(null,button.dataset.newAction));
 root.querySelectorAll('[data-edit-action]').forEach(button=>button.onclick=()=>openActionEditor(button.dataset.editAction));
 root.querySelectorAll('[data-archive-action]').forEach(button=>button.onclick=()=>{state.archived.push(button.dataset.archiveAction);save();refreshWork();notify('Tarefa arquivada. Você pode restaurá-la em Arquivadas.');});
 root.querySelectorAll('[data-restore-action]').forEach(button=>button.onclick=()=>{state.archived=state.archived.filter(id=>id!==button.dataset.restoreAction);save();refreshWork();});
 root.querySelectorAll('[data-aid]').forEach(el=>el.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData('application/x-cacarola-task',el.dataset.aid);e.dataTransfer.setData('text/plain',el.dataset.aid);});
 root.querySelectorAll('[data-task-lane]').forEach(lane=>{lane.ondragover=e=>e.preventDefault();lane.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-cacarola-task')||e.dataTransfer.getData('text/plain');if(findAction(id)){state.tasks[id]=lane.dataset.taskLane;save();refreshWork();}};});
};
document.head.insertAdjacentHTML('beforeend',`<style>.actionbuttons{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.actionbuttons button{font-size:12px;padding:7px 10px}.task{overflow-wrap:anywhere}.task select{min-height:40px}#action-editor{max-width:720px}#task-form{padding:22px;display:grid;gap:14px}#task-form input,#task-form textarea,#task-form select{width:100%;min-width:0}#task-form textarea{min-height:80px}#task-form h2{margin:0}#save-status{padding:10px 0}.lane:has(.task:active){outline:2px solid var(--brand)}</style>`);
document.body.insertAdjacentHTML('beforeend',`<dialog id="action-editor" aria-labelledby="editor-title"><form id="task-form"><h2 id="editor-title">Nova tarefa</h2><label>Campanha<select id="task-campaign" required></select></label><label>Título da tarefa<input id="task-title" maxlength="300" required></label><div class="two"><label>Responsável<input id="task-owner" maxlength="160" placeholder="Nome do responsável"></label><label>Prazo<input type="date" id="task-due"></label></div><div class="two"><label>Prioridade<select id="task-priority"><option>Alta</option><option selected>Média</option><option>Baixa</option></select></label><label>Etapa<select id="task-stage">${options(taskLanes,'A fazer')}</select></label></div><label>Descrição ou evidência<textarea id="task-evidence" maxlength="6000"></textarea></label><label>Critério para concluir<textarea id="task-acceptance" maxlength="6000"></textarea></label><p id="task-error" role="alert" hidden></p><div class="actionbuttons"><button class="primary" type="submit">Salvar tarefa</button><button type="button" id="cancel-action">Cancelar</button></div></form></dialog>`);
function openActionEditor(id,campaignId){
 editingAction=id;const a=id?findAction(id):null;
 $('#editor-title').textContent=a?'Editar tarefa':'Nova tarefa';
 $('#task-campaign').innerHTML=DATA.campaigns.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');$('#task-campaign').value=a?.campaignId||campaignId||filtered()[0]?.id||DATA.campaigns[0].id;$('#task-campaign').disabled=!!a;
 $('#task-title').value=a?.title||'';$('#task-owner').value=a?.owner==='A definir'?'':a?.owner||'';$('#task-due').value=a?.due||'';$('#task-priority').value=a?.priority||'Média';$('#task-stage').value=a?tstatus(a):'A fazer';$('#task-evidence').value=a?.evidence||'';$('#task-acceptance').value=a?.acceptance||'';$('#task-error').hidden=true;
 $('#action-editor').showModal();$('#task-title').focus();
}
$('#cancel-action').onclick=()=>$('#action-editor').close();
$('#task-form').onsubmit=e=>{
 e.preventDefault();const title=$('#task-title').value.trim();if(!title){$('#task-error').textContent='Preencha o título da tarefa.';$('#task-error').hidden=false;return;}
 const id=editingAction||'U-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2)),a=cleanAction({id,campaignId:$('#task-campaign').value,title,owner:$('#task-owner').value.trim(),due:$('#task-due').value,priority:$('#task-priority').value,status:$('#task-stage').value,evidence:$('#task-evidence').value,acceptance:$('#task-acceptance').value});
 if(editingAction)state.actionEdits[id]=a;else state.customActions.push(a);state.tasks[id]=a.status;save();$('#action-editor').close();refreshWork();notify('Tarefa salva.');
};
$('#content').insertAdjacentHTML('beforebegin','<p id="save-status" class="minor" role="status"></p>');
$('#restore').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const x=JSON.parse(await file.text());if(![1,2].includes(x.version)||x.period!=='2026-07-01/2026-10-13'||!x.state||typeof x.state!=='object'||!['campaigns','tasks','notes'].every(k=>x.state[k]&&typeof x.state[k]==='object'&&!Array.isArray(x.state[k])))throw Error();const restored=normalizeState(x.state);state=restored;save();refreshWork();notify('Organização restaurada, incluindo tarefas e responsáveis.');}catch(error){notify('Arquivo de organização inválido. Nenhuma alteração foi aplicada.');}e.target.value='';};
$('.footer').textContent='Arraste cartões, crie e edite tarefas e defina responsáveis e prazos. As alterações de acompanhamento ficam salvas neste navegador.';
try{localStorage.getItem(KEY);}catch(e){storageWorks=false;}
$('#search').oninput=()=>render();
$('#family').onchange=()=>render();
render();
