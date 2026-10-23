'use strict';
const originalRender=render;
function campaignInformation(c){
 const m=c.metrics;
 const locations=[...c.locations].sort((a,b)=>(num(b['Impr.'])||0)-(num(a['Impr.'])||0));
 const geoRows=rows=>rows.map(r=>[r.Local,cell(n(num(r['Impr.']))),cell(n(num(r['Visualizações do TrueView'])))]);
 const ad=c.ads[0];
 return `<section class="campaign organized-campaign" data-cid="${c.id}" id="campaign-${c.id}" aria-labelledby="campaign-title-${c.id}">
 <header class="campaignheading"><div><span class="tag">${c.family}</span><span class="minor">${c.id}</span><h2 id="campaign-title-${c.id}">${esc(c.name)}</h2><p>Período solicitado: 01/07 a 13/10/2026 · Entrega observada: ${dt(c.first_delivery)} a ${dt(c.last_delivery)}</p></div><div class="campaignbuttons"><button data-open="${c.id}">Ficha completa</button></div></header>
 <div class="campaigncolumns">
 <section class="informationcolumn"><h3>Resumo e período</h3><p><strong>Objetivo:</strong> ${esc(c.campaign['Subtipo da campanha'])}<br><strong>Status exportado:</strong> ${esc(c.campaign.Status)}<br><strong>Orçamento:</strong> ${money(num(c.campaign.Orçamento))} — ${esc(c.campaign['Tipo de orçamento'])}</p><div class="metricgrid">${metric('Impressões',n(m['Impr.']))}${metric('Investimento',money(m.Custo))}${metric('Cliques',n(m.Cliques))}${metric('CTR',pct(m.CTR))}${metric('CPM calculado',money(m['CPM calculado']))}${metric('CPC calculado',money(m['CPC calculado']))}</div><p><strong>${c.active_days}</strong> dias com entrega nos arquivos.</p><p class="scopenote">${esc(c.scope_note)}</p><button data-open="${c.id}" data-open-tab="overview">Ver todos os indicadores</button></section>
 <section class="informationcolumn"><h3>Público e locais</h3><p>${esc(c.audience)}</p><h4>Locais com mais impressões</h4>${locations.length?table(['Local / raio','Impressões','TrueView'],geoRows(locations.slice(0,3))):'<p class="missing">Relatório de locais ausente nesta campanha. Cidades e raios não foram confirmados.</p>'}<p class="scopenote">Período dos locais: ${esc(c.details_scope)}</p>${locations.length>3?`<details><summary>Todos os ${locations.length} locais desta campanha</summary>${table(['Local / raio original','Impressões','TrueView'],geoRows(locations))}</details>`:''}<button data-open="${c.id}" data-open-tab="audience">Público, raios e custos por local</button></section>
 <section class="informationcolumn"><h3>Vídeos e entrega</h3><div class="metricgrid">${metric('Visualizações públicas até 13/10',n(m['Visualizações públicas do YouTube']))}${metric('TrueView até 13/10',n(m['Visualizações do TrueView']))}</div>${ad?`<p><strong>Anúncio:</strong> ${esc(ad['Nome do anúncio'])}</p><p><strong>Mensagem:</strong> ${esc(ad['Título longo 1'])}</p><p><a href="${esc(ad.Vídeo)}" target="_blank" rel="noopener noreferrer">Abrir vídeo no YouTube</a></p><p><a href="${esc(ad['URL final'])}" target="_blank" rel="noopener noreferrer">Abrir página de destino</a></p>`:'<p class="missing">Relatório de anúncios ausente. Vídeo, texto e destino não foram confirmados para esta campanha.</p>'}<h4>Dispositivos</h4>${table(['Dispositivo','Impressões','TrueView'],c.devices.map(r=>[r.Dispositivo,cell(n(num(r['Impr.']))),cell(n(num(r['Visualizações do TrueView'])))]))}<p class="scopenote">Período dos anúncios e dispositivos: ${esc(c.details_scope)}</p><button data-open="${c.id}" data-open-tab="video">Detalhes dos vídeos e dispositivos</button><button data-open="${c.id}" data-open-tab="timeline">Evolução mensal e diária</button></section>
 </div></section>`;
}
function organizedHTML(cs){
 const order={'Bahia':0,'TRON SC':1,'Remarketing':2},sorted=[...cs].sort((a,b)=>order[a.family]-order[b.family]||a.id.localeCompare(b.id));
 return `<div class="organizationintro"><h2>Informações separadas por campanha</h2><p>Consulte os resultados de cada campanha: resumo e período, público e locais, vídeos e entrega. Abra a ficha para ver todos os indicadores, a evolução, o alcance e as lojas.</p><nav class="campaignjump" aria-label="Ir para uma campanha">${sorted.map(c=>`<a href="#campaign-${c.id}">${esc(c.family==='Bahia'?'Bahia '+c.id.slice(-1):c.family==='Remarketing'?'Remarketing':'TRON '+String(Number(c.id.slice(1))-4).padStart(2,'0'))}</a>`).join('')}</nav></div>${sorted.map(campaignInformation).join('')||'<p>Nenhuma campanha corresponde ao filtro.</p>'}`;
}

function reachTitle(t){
 const dimension=t.fields.includes('Date')?'por data':t.fields.includes('Dispositivo')?'por dispositivo':t.fields.includes('País')?'por país':'por formato';
 const metric=t.fields.some(f=>f.startsWith('Usuários'))?'Alcance':'Frequência';
 return metric+' '+dimension;
}
render=function(){
 const cs=filtered();
 $('#stats').hidden=false;
 if(view==='compare'){originalRender();return;}
 renderStats(cs);
 $('#content').innerHTML=organizedHTML(cs);
 wire($('#content'));
};
$('#search').oninput=()=>render();
$('#family').onchange=()=>render();
render();

const META_DATA=JSON.parse(document.getElementById('meta-dataset').textContent);
const metaMissing='Não informado no relatório';
const metaHas=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const metaFrequency=value=>n(value,2);
const metaMetricLabels={
 reach:'Alcance',frequency:'Frequência',impressions:'Impressões',investment:'Investimento',
 profileVisits:'Visitas ao perfil',postEngagement:'Engajamento com post',
 pageProfileVisits:'Visitas ao perfil e à página',cpm:'CPM',costPerInteraction:'Custo por interação'
};
function metaMetricValue(key,value){
 if(['investment','cpm','costPerInteraction'].includes(key))return money(value);
 if(key==='frequency')return metaFrequency(value);
 return n(value);
}
function metaMetricGrid(metrics){
 return `<div class="metricgrid meta-metricgrid">${Object.entries(metaMetricLabels).filter(([key])=>metaHas(metrics,key)).map(([key,label])=>metric(label,metaMetricValue(key,metrics[key]))).join('')}</div>`;
}
function metaSearchText(item){return JSON.stringify(item).toLocaleLowerCase('pt-BR')}
function googleSelection(){
 const q=$('#search').value.toLocaleLowerCase('pt-BR'),family=$('#family').value;
 if(family.startsWith('META-'))return [];
 return DATA.campaigns.filter(c=>(!family||c.family===family)&&(!q||(c.name+' '+c.family).toLocaleLowerCase('pt-BR').includes(q)));
}
function metaSelection(){
 const q=$('#search').value.toLocaleLowerCase('pt-BR'),family=$('#family').value;
 if(family&&!family.startsWith('META-'))return {monthly:[],origin:[],comments:false,commentState:null};
 const regionMatch=item=>family==='META-SC'?/\bSC\b|Santa Catarina/i.test(item.region||item.state||''):family==='META-BA'?/\bBA\b|Bahia/i.test(item.region||item.state||''):true;
 let monthly=META_DATA.monthlyCampaigns.filter(regionMatch);
 let origin=family==='META-ANUAL'?[]:META_DATA.originCampaigns.filter(regionMatch);
 if(family==='META-ANUAL')monthly=META_DATA.monthlyCampaigns;
 if(q){monthly=monthly.filter(item=>metaSearchText(item).includes(q));origin=origin.filter(item=>metaSearchText(item).includes(q));}
 const comments=!q||metaSearchText(META_DATA.commentsReport).includes(q);
 return {monthly,origin,comments,commentState:family==='META-SC'?'SC':family==='META-BA'?'BA':null};
}
function metaStats(){
 const a=META_DATA.annual;
 $('#meta-stats').innerHTML=[
  ['Investimento total',money(a.investment),a.period],
  ['Interações',n(a.interactions),'Conforme relatório de origem'],
  ['Impressões',n(a.impressions),'Exposições registradas'],
  ['CTR registrado',`<abbr title="Taxa de cliques">${esc(a.ctrReported)}</abbr>`,'Valor original, sem recálculo'],
  ['Campanha em destaque',esc(a.highlightCampaign),'Relatório Anual - Meta'],
  ['Comentários informados',n(META_DATA.commentsReport.annualTotalListed),'Jan-out · jan e fev sem dados']
 ].map(([label,value,note])=>`<div class="stat"><span>${label}</span><strong>${value}</strong><span>${note}</span></div>`).join('');
}
function metaSource(source,period){return `<p class="meta-source"><strong>Fonte do dado:</strong> ${esc(source)} · <strong>Período:</strong> ${esc(period)}</p>`}
function metaMonthlyCard(c){
 return `<details class="meta-card" data-meta-id="${c.id}"><summary><span><span class="platformbadge meta">Meta Ads</span><span class="minor">${esc(c.period)}</span><strong>${esc(c.name)}</strong></span><span class="meta-chevron" aria-hidden="true">+</span></summary><div class="meta-cardbody">
 <div class="meta-cardgrid"><section><h4>Resumo e período</h4><p><strong>Objetivo:</strong> ${esc(c.objective||metaMissing)}</p><p><strong>Estado/região:</strong> ${esc(c.region||metaMissing)}</p>${metaMetricGrid(c.metrics)}</section>
 <section><h4>Público / segmentação</h4><p>${metaMissing}</p><h4>Regiões de destaque</h4><p>${esc(c.region||metaMissing)}</p></section>
 <section><h4>Criativos de destaque</h4><p>${metaMissing}</p><h4>Próximas ações / recomendações</h4><p>${metaMissing}</p></section></div>
 ${metaSource('Relatório Anual - Meta',c.period)}</div></details>`;
}
function metaMonthlyHTML(campaigns){
 const months=['Janeiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro'];
 const groups=months.map(month=>[month,campaigns.filter(c=>c.month===month)]).filter(([,items])=>items.length);
 if(!groups.length)return '';
 return `<section class="meta-section" aria-labelledby="meta-history-title"><div class="sectiontitle"><div><span class="eyebrow">HISTÓRICO MENSAL</span><h2 id="meta-history-title">Campanhas do Relatório Anual - Meta</h2></div><span class="sourcepill">janeiro a outubro · ano não informado</span></div><p class="minor">Cada ficha apresenta somente as métricas disponíveis no relatório. Campos ausentes permanecem explicitamente não informados.</p>${groups.map(([month,items])=>`<section class="meta-month"><h3>${month}</h3><div class="meta-cardlist">${items.map(metaMonthlyCard).join('')}</div></section>`).join('')}</section>`;
}
function metaOriginCard(c){
 const regions=table(['Região','Interações','Engajamentos','Frequência'],c.regions.map(r=>[r.name,cell(n(r.interactions)),cell(n(r.engagements)),cell(metaFrequency(r.frequency))]));
 const creatives=table(['Criativo','Engajamentos','Interações','Frequência'],c.creatives.map(r=>[r.highlight?{html:`<strong>${esc(r.name)}</strong><br><span class="minor">Maior destaque nos conjuntos do relatório</span>`}:r.name,cell(n(r.engagements)),cell(n(r.interactions)),cell(metaFrequency(r.frequency))]));
 return `<details class="meta-card meta-origin" open data-meta-id="${c.id}"><summary><span><span class="platformbadge meta">Meta Ads</span><span class="minor">${esc(c.period)}</span><strong>${esc(c.name)}</strong></span><span class="meta-chevron" aria-hidden="true">+</span></summary><div class="meta-cardbody">
 <div class="meta-cardgrid"><section><h4>Resumo e período</h4><p><strong>Objetivo:</strong> ${esc(c.objective)}</p><p><strong>Estado/região:</strong> ${esc(c.state)}</p>${metaMetricGrid(c.metrics)}</section><section><h4>Público / segmentação</h4><p>${esc(c.audience)}</p><p><strong>Remarketing:</strong> previsto para o final de outubro.</p></section><section><h4>Próximas ações / recomendações</h4><p>${esc(c.nextAction)}</p><p class="minor">Única próxima ação explicitamente informada no relatório.</p></section></div>
 <section><h4>Regiões de destaque</h4>${regions}</section><section><h4>Criativos de destaque</h4>${creatives}</section>${metaSource(c.source,c.period)}</div></details>`;
}
function metaOriginHTML(campaigns){
 if(!campaigns.length)return '';
 const s=META_DATA.originStrategy;
 return `<section class="meta-section" aria-labelledby="meta-origin-title"><div class="sectiontitle"><div><span class="eyebrow">A ORIGEM DO AMOR</span><h2 id="meta-origin-title">Campanhas Famílias do Campo</h2></div><span class="sourcepill">${esc(s.generalPeriod)}</span></div><div class="notice meta-notice"><p><strong>Estratégia de públicos:</strong> direcionamento aberto de ${esc(s.openTargeting)}; interesses/afunilamento de ${esc(s.interestTargeting)}; remarketing ${esc(s.remarketing)}.</p><p><strong>Fonte:</strong> ${esc(s.source)}.</p></div><div class="meta-cardlist">${campaigns.map(metaOriginCard).join('')}</div></section>`;
}
function commentBreakdown(entries){
 return entries.length?entries.map(entry=>`${esc(entry.campaign)}: <strong>${n(entry.comments)}</strong>`).join('<br>'):'Sem dados no relatório';
}
function commentAnnualRows(report){
 return report.monthly.map(item=>[item.month,cell(item.total===null?'Sem dados':n(item.total)),{html:commentBreakdown(item.entries)}]);
}
function commentStateRows(report,state){
 return report.families.monthly.map(item=>{
  const entry=item.entries.find(row=>row.state===state);
  return [item.month,state,cell(n(entry?.comments||0))];
 });
}
function commentsRegions(report,state){
 const rows=report.families.regions.filter(row=>!state||row.state===state);
 return table(['Mês','Estado','Posição','Região','Comentários'],rows.map(row=>[row.month,row.state,cell(n(row.rank)),row.name,cell(n(row.comments))]));
}
function commentsCreatives(report){
 return table(['Mês','Posição','Criativo'],report.families.creatives.map(row=>[row.month,cell(n(row.rank)),row.name]));
}
function metaCommentsHTML(selection){
 if(!selection.comments)return '';
 const report=META_DATA.commentsReport,state=selection.commentState;
 const annual=state
  ?table(['Mês','Estado','Comentários'],commentStateRows(report,state))
  :table(['Mês','Total informado','Campanhas / detalhamento'],commentAnnualRows(report));
 const families=state?report.families.monthly.reduce((sum,item)=>sum+(item.entries.find(row=>row.state===state)?.comments||0),0):report.familiesTotal;
 return `<section class="meta-section comments-section" aria-labelledby="comments-title"><div class="sectiontitle"><div><span class="eyebrow">CONVERSA COM O PÚBLICO</span><h2 id="comments-title">Comentários${state?' - '+esc(state):' e destaques de engajamento'}</h2></div><span class="sourcepill">${esc(report.period)}</span></div>
 <div class="comments-summary"><div class="comment-kpi"><span>${state?'Comentários ligados a '+esc(state):'Comentários informados no período'}</span><strong>${n(state?families:report.annualTotalListed)}</strong><small>${state?'jul-out · Famílias do Campo':'soma dos meses com volume informado'}</small></div><div class="comment-kpi"><span>${state?'Recorte consultado':'Famílias do Campo'}</span><strong>${state?esc(state):n(report.familiesTotal)}</strong><small>${state?'filtro regional aplicado':'jul-out · já incluído no total anual'}</small></div></div>
 <div class="notice meta-notice"><p>${esc(report.note)}</p><p class="minor">${esc(report.normalizationNote)}</p></div>
 <section class="comment-block"><h3>${state?'Evolução mensal do recorte':'Volume mensal e campanhas'}</h3>${annual}</section>
 <div class="comment-details"><details open><summary>Melhores regiões por mês${state?' - '+esc(state):''}</summary>${commentsRegions(report,state)}</details><details><summary>Anúncios que mais engajaram - Famílias do Campo</summary><p class="minor">O relatório apresenta a ordem mensal dos criativos, sem quantidade de comentários por anúncio.</p>${commentsCreatives(report)}</details></div>
 ${metaSource(report.source,report.period)}</section>`;
}
function metaPlanningHTML(){
 const p=META_DATA.planning;
 return `<section class="planning-block" aria-labelledby="planning-title"><span class="platformbadge meta">Meta Ads</span><h2 id="planning-title">${esc(p.title)}</h2><p class="notice meta-notice"><strong>Projeção histórica:</strong> estes valores registram o planejamento informado no relatório; não representam orçamento atual nem recomendação nova.</p><div class="stats planning-stats">${[
  ['Investido de '+p.investedPeriod,money(p.invested),'Conforme relatório'],['Saldo disponível até o fim do ano',money(p.availableBalance),'Projeção histórica'],['Projeção diária',money(p.dailyProjection),p.projectionDays+' dias'],['Divisão prevista',money(p.baDaily)+' BA · '+money(p.scDaily)+' SC','Por dia']
 ].map(([label,value,note])=>`<div class="stat"><span>${label}</span><strong>${value}</strong><span>${note}</span></div>`).join('')}</div>${metaSource(p.source,p.investedPeriod)}</section>`;
}
function metaOrganizedHTML(selection){
 const html=metaOriginHTML(selection.origin)+metaCommentsHTML(selection)+metaMonthlyHTML(selection.monthly);
 return html?`<div class="platform-divider"><span class="platformbadge meta">Meta Ads · Facebook e Instagram</span></div>${html}${metaPlanningHTML()}`:'<section class="empty-state"><h2>Nenhuma campanha Meta Ads corresponde ao filtro.</h2><p>Tente buscar por campanha, estado, objetivo ou criativo.</p></section>';
}
function googleCompareHTML(cs){
 if(!cs.length)return '<section class="empty-state"><h2>Nenhuma campanha Google Ads / YouTube corresponde ao filtro.</h2></section>';
 return '<section class="compare-section"><div class="sectiontitle"><div><span class="platformbadge google">Google Ads / YouTube</span><h2>Campanhas no recorte solicitado</h2></div></div><p class="minor">Não disponível significa ausência de dado para o recorte. O custo usa a soma diária e pode variar centavos em relação ao agregado.</p>'+table(['Campanha','Impressões','Visualizações públicas','TrueView até 13/10','Custo diário somado','Cliques','CTR','CPM calculado','CPC calculado','Status exportado'],cs.map(c=>{const m=c.metrics;return [{html:`<button data-open="${c.id}">${esc(c.name)}</button>`},cell(n(m['Impr.'])),cell(n(m['Visualizações públicas do YouTube'])),cell(n(m['Visualizações do TrueView'])),cell(money(m.Custo)),cell(n(m.Cliques)),cell(pct(m.CTR)),cell(money(m['CPM calculado'])),cell(money(m['CPC calculado'])),c.campaign.Status]}))+'<div class="notice">O alcance único não foi somado. TrueView exato está disponível para 6 de 8 campanhas; TRON 01 e TRON 02 precisam de nova exportação. Os grupos têm objetivos e regiões diferentes.</div></section>';
}
function metaCompareRows(selection){
 const monthly=selection.monthly.map(c=>[c.name,c.region,c.period,c.objective,metaHas(c.metrics,'reach')?n(c.metrics.reach):metaMissing,metaHas(c.metrics,'postEngagement')?n(c.metrics.postEngagement):metaMissing,n(c.metrics.impressions),money(c.metrics.investment),'Relatório Anual - Meta']);
 const origin=selection.origin.map(c=>[c.name,c.state,c.period,c.objective,n(c.metrics.reach),n(c.metrics.postEngagement),n(c.metrics.impressions),metaMissing,c.source]);
 return monthly.concat(origin);
}
function metaCompareHTML(selection){
 const rows=metaCompareRows(selection);
 if(!rows.length)return '<section class="empty-state"><h2>Nenhuma campanha Meta Ads corresponde ao filtro.</h2></section>';
 return `<section class="compare-section meta-compare"><div class="sectiontitle"><div><span class="platformbadge meta">Meta Ads</span><h2>Comparativo por campanha, estado/região e período</h2></div></div><p class="minor">As métricas não informadas permanecem em branco sem estimativa. Valores potencialmente inconsistentes são mantidos conforme o relatório de origem.</p>${table(['Campanha','Estado / região','Período','Objetivo','Alcance','Engajamento com post','Impressões','Investimento','Fonte'],rows)}</section>`;
}
function metaCommentsCompareHTML(selection){
 if(!selection.comments)return '';
 const report=META_DATA.commentsReport,state=selection.commentState;
 const rows=state?commentStateRows(report,state):commentAnnualRows(report);
 const headers=state?['Mês','Estado','Comentários']:['Mês','Total informado','Campanhas / detalhamento'];
 return `<section class="compare-section meta-compare comments-compare"><div class="sectiontitle"><div><span class="platformbadge meta">Meta Ads</span><h2>Comparativo mensal de comentários${state?' - '+esc(state):''}</h2></div></div><p class="minor">Janeiro e fevereiro constam como sem dados. Os totais representam apenas os volumes registrados no relatório.</p>${table(headers,rows)}${metaSource(report.source,report.period)}</section>`;
}
function platformVisibility(){
 const platform=$('#platform').value,family=$('#family').value;
 return {
  google:(platform==='all'||platform==='google')&&!family.startsWith('META-'),
  meta:(platform==='all'||platform==='meta')&&(!family||family.startsWith('META-'))
 };
}
render=function(){
 const visibility=platformVisibility(),googleCampaigns=googleSelection(),metaCampaigns=metaSelection();
 $('#google-summary').hidden=!visibility.google;
 $('#meta-summary').hidden=!visibility.meta;
 if(visibility.google)renderStats(googleCampaigns);
 if(visibility.meta)metaStats();
 const parts=[];
 if(view==='compare'){
  if(visibility.google)parts.push(googleCompareHTML(googleCampaigns));
  if(visibility.meta){parts.push(metaCompareHTML(metaCampaigns));parts.push(metaCommentsCompareHTML(metaCampaigns));}
 }else{
  if(visibility.google)parts.push(`<div class="platform-divider"><span class="platformbadge google">Google Ads / YouTube</span></div>${organizedHTML(googleCampaigns)}`);
  if(visibility.meta)parts.push(metaOrganizedHTML(metaCampaigns));
 }
 $('#content').innerHTML=parts.join('')||'<section class="empty-state"><h2>Nenhuma campanha corresponde aos filtros.</h2></section>';
 wire($('#content'));
};
$('#search').oninput=()=>render();
$('#family').onchange=()=>render();
$('#platform').onchange=()=>{
 const family=$('#family').value,platform=$('#platform').value;
 if((platform==='meta'&&family&&!family.startsWith('META-'))||(platform==='google'&&family.startsWith('META-')))$('#family').value='';
 render();
};
render();
