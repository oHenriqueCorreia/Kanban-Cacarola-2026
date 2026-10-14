from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
from metrics import num,br
ROOT=Path(__file__).resolve().parents[2]
d=json.loads((ROOT/'data/generated/consolidado.json').read_text(encoding='utf-8'))
for c in d['campaigns']:
    m=c['metrics']; r=c['campaign']; family=c['family']
    top=sorted(c['locations'],key=lambda r:num(r['Impr.']) or 0,reverse=True)
    dev=sorted(c['devices'],key=lambda r:num(r['Impr.']) or 0,reverse=True)
    c['top_locations']=top[:5]
    c['top_device']=dev[0]['Dispositivo'] if dev else 'Não disponível'
    c['location_note']='Locais do relatório, com raios preservados. Não confirmam residência, presença física nem a regra de localização utilizada.'
    c['audience']='Público definido geograficamente na Bahia. Idade, gênero, interesses, renda e listas de audiência não constam nos arquivos.' if family=='Bahia' else ('Pessoas que interagiram com os vídeos nos últimos 90 dias, conforme nomes do anúncio e do grupo. Composição, critérios e lista não foram exportados.' if family=='Remarketing' else 'Região SC conforme nome da campanha. Nas campanhas com relatório de locais, há segmentação por raios de 5 km ao redor de endereços. Idade, gênero, interesses e listas não foram exportados.')
    if c['id']=='C08':c['audience']='Região SC conforme nome da campanha. O relatório de locais não foi fornecido para confirmar cidades e raios. Idade, gênero, interesses e listas não foram exportados.'
    c['workflow']='Em acompanhamento' if family=='Bahia' else ('Pausada / retomada' if family=='Remarketing' else 'A revisar')
    c['scope_note']=('As séries cobrem todo o período solicitado. A primeira entrega observada foi em 23/07, embora as pastas mencionem 22/07.' if family=='Bahia' else f"As séries começam em {c['coverage_start'][8:10]}/{c['coverage_start'][5:7]}. Os dias anteriores não foram exportados e não são tratados como zero. O dia 14/10 foi excluído dos resultados principais.")
    c['details_scope']='01/07 a 13/10/2026' if c['aggregate_exact'] else c['aggregate_period']+'. Detalhes não podem ser filtrados até 13/10 porque não têm data por linha.'
    c['notes']=[];c['actions']=[]
    def action(priority,title,evidence,acceptance):c['actions'].append({'id':c['id']+'-A'+str(len(c['actions'])+1),'priority':priority,'title':title,'evidence':evidence,'acceptance':acceptance,'status':'A fazer','owner':'A definir','due':None})
    if family=='Bahia':
        share=num(dev[0]['Impr.'])/m['Impr.']
        c['notes'].append(f"Telas de TV concentram {br(share*100,2)}% das impressões. O destino conhecido das campanhas 01 e 03 é o Instagram; há poucos cliques frente ao volume de exposição.")
        c['notes'].append(f"TrueView: {br(m['Visualizações do TrueView'])}. Visualizações públicas: {br(m['Visualizações públicas do YouTube'])}. O custo total dividido por TrueView é R$ {br(m['Custo total / TrueView'],4)}.")
        c['notes'].append('Não há entrega em 26, 28 e 30/09 nas três campanhas Bahia. O mesmo padrão aparece no remarketing. A causa não está registrada.')
        action('Média','Investigar dias sem entrega em setembro','26, 28 e 30/09 têm zero impressões nas séries exportadas.','Conferir histórico de alterações, programação e disponibilidade de orçamento para esses dias.')
        action('Média','Revisar limitação por orçamento',r['Motivos do status']+'; orçamento diário de R$ '+r['Orçamento']+'.','Relacionar volume desejado, público e resultados antes de definir eventual mudança de orçamento.')
        action('Alta','Completar exportação de público-alvo','Não existem dados demográficos, interesses nem critérios de audiência.','Exportar configuração de segmentação e desempenho por idade, gênero e audiência no período solicitado.')
        if top:
            c['notes'].append(f"Maior local: {top[0]['Local']} — {br(num(top[0]['Impr.']))} impressões e {br(num(top[0]['Visualizações do TrueView']))} TrueView ({br(num(top[0]['Impr.'])/m['Impr.']*100,2)}% das impressões da campanha).")
        if c['id']=='C02':
            c['notes'].append('Relatório de anúncios ausente. Não é possível confirmar vídeo, texto e destino da Bahia 02.')
            action('Alta','Obter relatório de anúncios da Bahia 02','Arquivo ausente na pasta recebida.','Exportação com nome do anúncio, URL do vídeo, destino, métricas e período de 01/07 a 13/10.')
        if c['id']=='C01':c['notes'].append('Não há relatório por loja na pasta da Bahia 01.')
        if c['id']=='C03':
            c['notes'].append('Uruçuca usa raio de 20 milhas (aproximadamente 32,19 km). Outros locais incluem raios de 15 km. A unidade original foi preservada.')
            action('Média','Confirmar raio de Uruçuca','O relatório traz 20,0 mi, enquanto vários outros locais usam 15,0 km.','Validar se o raio de 20 milhas é intencional.')
    elif family=='Remarketing':
        c['notes'].append('Campanha pausada na exportação. Última entrega observada em 06/10. O anúncio e o grupo estão não qualificados por campanha pausada.')
        c['notes'].append('O CPV desejado do grupo é R$ 10,00, versus R$ 0,02 nas campanhas Bahia. Confirmar a configuração e o histórico antes de propor alteração.')
        c['notes'].append('São 37 cliques e CTR de 0,1150% no recorte disponível. O relatório de campanha registra 28.532 usuários exclusivos no período exportado, que inclui 14/10; esse alcance não foi recalculado para o recorte.')
        action('Alta','Revisar decisão de pausa e eventual retomada','Última entrega em 06/10; status exportado Pausada.','Registrar objetivo, motivo da pausa e condição para retomada, sem assumir que a campanha deve ser reativada.')
        action('Alta','Validar CPV desejado de R$ 10,00','Valor do grupo de remarketing é 500 vezes o R$ 0,02 das campanhas Bahia.','Confirmar se o valor é intencional e conferir histórico de mudanças.')
        action('Alta','Confirmar lista e janela de remarketing','Janela de 90 dias aparece somente no nome do grupo e do anúncio.','Exportar definição da lista, regras, duração e tamanho elegível.')
    else:
        c['notes'].append('Objetivo exportado: alcance eficiente. O nome menciona VT de 5 segundos, mas a duração efetiva do vídeo não está nos CSVs. Métricas de TrueView e visualizações públicas devem permanecer separadas.')
        c['notes'].append('Primeira entrega observada em 07/10. Julho e agosto estão fora das séries recebidas. Setembro tem zero entrega nas séries disponíveis.')
        c['notes'].append('Os detalhes de dispositivos, criativos e locais abrangem até 14/10. Não há base para redistribuir a entrega do dia 14 entre esses recortes.')
        if c['id'] in ('C05','C06'):
            c['notes'].append('TrueView até 13/10 indisponível: a série diária não contém essa métrica. O total do relatório até 14/10 permanece somente no bloco de dados originais.')
            action('Alta','Exportar TrueView por dia até 13/10','A série diária não tem TrueView; o agregado inclui 14/10.','Obter número de TrueView para 01/07 a 13/10 sem usar o agregado até 14/10.')
        action('Alta','Completar público-alvo e período','Dados de segmentação não foram exportados, e as séries começam em 01/09.','Exportar segmentação e histórico completo desde 01/07, ou confirmar documentalmente a inexistência de campanha antes de 07/10.')
        if c['id']=='C05':
            c['notes'].append('Orçamento de R$ 15,00 TOTAL da campanha, enquanto TRON 02, 03 e 04 têm R$ 15,00 DIÁRIO. Até 13/10: 591 impressões, 161 visualizações públicas, R$ 1,23 e zero cliques. Isso justifica revisar a diferença de configuração.')
            action('Alta','Conferir orçamento total da TRON 01','R$ 15,00 total da campanha; demais TRON: R$ 15,00 por dia.','Confirmar tipo, valor e duração previstos do orçamento e a razão para a diferença de entrega.')
        if c['id']=='C08':
            c['notes'].append('Relatório de locais ausente. Não inferir os endereços das outras campanhas TRON para esta campanha.')
            action('Alta','Obter relatório de locais da TRON 04','Não há relatório de locais na pasta recebida.','Exportação própria da TRON 04 com cidades, endereços, raios e métricas até 13/10.')
        if c['reconciliation'] or c['daily_conflicts']:
            c['notes'].append('Há diferenças entre exportações, principalmente em 14/10. As séries concordam dentro do recorte até 13/10; os conflitos foram registrados na auditoria.')
            action('Alta','Refazer exportações no mesmo fechamento','Relatórios de campanha, anúncio, grupo, locais e séries apresentam pequenas diferenças.','Gerar relatórios com mesmo período, filtros e horário de extração e reconciliar impressões e custos.')
    if c['metrics'].get('Conversões') is None:
        c['conversion_note']='Relatórios agregados registram zero conversões até 14/10; não há série diária de conversões. O recorte exato até 13/10 fica indisponível.'
    else:c['conversion_note']='Zero conversões registradas. Isso não comprova ausência de vendas: receita, transações e atribuição não foram fornecidas.'
    c['notes'].append(c['conversion_note'])
    c['notes'].append('Curtidas, comentários e compartilhamentos no relatório de campanha: zero. Métricas comerciais de receita, vendas e ROAS não estão disponíveis.')
    if c['brand']:c['notes'].append('Os ZIPs não informam período nem filtro de campanha internamente. São apresentados como anexos da pasta. O campo de canal diz “Total: campanhas de vídeo”; confirmar escopo antes de tratá-los como alcance definitivo da campanha. Não somar usuários únicos entre formatos, dispositivos ou campanhas.')
    costdelta=round(m['Custo']-c['source_metrics']['Custo'],2)
    c['cost_note']=f"Custo principal = soma dos dias até 13/10 (R$ {br(m['Custo'],2)}). Custo do relatório de campanha ({c['aggregate_period']}) = R$ {br(c['source_metrics']['Custo'],2)}. Diferença: R$ {br(costdelta,2)}. Pequenas diferenças de centavos em períodos equivalentes são compatíveis com arredondamento diário."
    c['notes'].append(c['cost_note'])
d['methodology']=[
    'Período solicitado: 01/07 a 13/10/2026, inclusive. O ano foi confirmado pelos arquivos. As campanhas permanecem separadas.',
    'Séries diárias são cruzadas por campanha, data e métrica. Os três arquivos de série não são somados entre si. Campos coincidentes foram comparados, e cada medida aparece uma vez por dia.',
    'Impressões, cliques, custo e visualizações públicas do painel são somas dos dias exportados dentro do recorte. TrueView das campanhas Bahia vem do agregado exato de 01/07 a 13/10; remarketing, TRON 03 e TRON 04 têm TrueView diário. TRON 01 e TRON 02 não têm TrueView exato até 13/10.',
    'Julho e agosto não foram exportados para as TRON. Antes de 27/08, remarketing não foi exportado. Não preencher períodos ausentes com zero. A data de primeira entrega não confirma data de criação da campanha.',
    'Os relatórios agregados TRON e remarketing vão até 14/10. Seus detalhes são mantidos nesse período original. São complementos, não resultados exatos até 13/10. Alcance exclusivo não pode ser recortado por subtração de usuários de um dia.',
    'Visualizações públicas do YouTube e visualizações TrueView são métricas distintas dos arquivos. Não somar as duas nem substituir uma pela outra. Impressões não são pessoas únicas e não significam conclusão do vídeo.',
    'CTR = cliques / impressões. CPM calculado = custo diário somado / impressões × 1.000. CPC calculado = custo diário somado / cliques. TrueView / impressões totais é proporção descritiva, diferente da taxa nativa quando formatos elegíveis têm outro denominador.',
    'Custo total / TrueView é uma razão descritiva sobre todo o custo, não necessariamente o CPV médio do TrueView reportado pela plataforma. Ambos são identificados separadamente. Não calcular ROAS sem receita.',
    'O campo Shorts das séries contém porcentagens e dados ausentes. Foi preservado por dia e não somado nem usado como número de visualizações. A métrica e seu denominador precisam ser confirmados para agregar.',
    'Linhas Total: não entram nas somas de detalhes. Locais com zero entrega permanecem disponíveis. Raio em mi foi preservado, com 20 mi ≈ 32,19 km apenas como conversão auxiliar.',
    'Todos os ZIPs foram abertos e todos os seus CSVs foram lidos. Alcance covisualizado, frequência, formatos e dispositivos são anexos sem período/filtro explicitado. Nulos permanecem indisponíveis. Alcance único nunca é somado entre campanhas ou recortes.',
    'O status da campanha reflete a exportação recebida, não uma consulta ao vivo. O status do Kanban e as ações são sugestões para organizar a análise. Responsáveis e prazos não foram informados.',
    'As recomendações são interpretações dos arquivos. As pendências exigem verificar configurações ou obter relatórios ausentes. O painel não altera campanhas.'
]
d['insights']=[
    'Bahia 03 tem o maior volume TrueView das campanhas Bahia: 100.755, com proporção descritiva de 58,36% sobre impressões totais. As regiões são diferentes, então isso não isola o efeito do criativo.',
    'A entrega Bahia se concentra em telas de TV (87,50% a 90,91% das impressões), com poucos cliques. Interpretar resultados conforme o objetivo de vídeo e exposição.',
    'TRON 01 usa orçamento total de R$ 15,00 e entrega muito menos que as outras TRON, que usam orçamento diário. A configuração precisa ser confirmada.',
    'Entre TRON 02, 03 e 04, a TRON 02 registra mais cliques no recorte (63) e menor CPC calculado (R$ 1,73). Isso descreve tráfego, não desempenho em vendas.',
    'Remarketing está pausado, tem última entrega em 06/10 e CPV desejado exportado de R$ 10,00. São pontos prioritários para revisão.',
    'Os arquivos por loja incluem estabelecimentos de SC e RS mesmo nas pastas Bahia. Devem ser tratados como ativos de local reportados, sem usá-los para inferir o público da campanha.'
]
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data/campaigns.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
print('Entrega preparada:',len(d['campaigns']),'campanhas;',sum(len(c['actions']) for c in d['campaigns']),'ações')
