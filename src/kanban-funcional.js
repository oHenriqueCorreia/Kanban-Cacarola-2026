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
