from pathlib import Path
import json,re,collections,sys,datetime
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[2]
D=json.loads((ROOT/'data/generated/fontes.json').read_text(encoding='utf-8'))
START='2026-07-01'; END='2026-10-13'
MONTHS={'jan':1,'fev':2,'mar':3,'abr':4,'mai':5,'jun':6,'jul':7,'ago':8,'set':9,'out':10,'nov':11,'dez':12}
def date_pt(s):
    m=re.search(r'(\d+) de (\w+)\.? de (\d{4})',s)
    return f'{int(m[3]):04}-{MONTHS[m[2][:3]]:02}-{int(m[1]):02}' if m else None
def num(s,english=False):
    if s is None:return None
    s=str(s).strip().replace('R$','').replace('\xa0','').replace(' ','')
    if s in ('','--','—','null','-'):return None
    percent=s.endswith('%');s=s.rstrip('%')
    v=float(s if english else s.replace('.','').replace(',','.'))
    return v/100 if percent else v
def detail(t):return [r for r in t['rows'] if not str(next(iter(r.values()),'')).startswith('Total:')]
def br(v,places=0):
    if v is None:return 'Não disponível'
    return f'{v:,.{places}f}'.replace(',','x').replace('.',',').replace('x','.')
C=[]
for i,folder in enumerate(sorted({t['folder'] for t in D['tables']}),1):
    tables=[t for t in D['tables'] if t['folder']==folder]
    get=lambda name:next((t for t in tables if t['source'].endswith('/'+name)),None)
    camp=get('Relatório de campanha.csv');r=detail(camp)[0]
    daily={};sources={};conflicts=[]
    for t in tables:
        if 'Data' not in t['fields']:continue
        for row in t['rows']:
            day=date_pt(row['Data']); assert day
            daily.setdefault(day,{'date':day,'sources':{}})
            for k,s in row.items():
                if k=='Data':continue
                v=num(s)
                if k in daily[day] and v!=daily[day][k]:conflicts.append(f'{day} {k}: {daily[day][k]} / {v} ({t["id"]})')
                elif k not in daily[day]:daily[day][k]=v
                daily[day]['sources'].setdefault(k,[]).append(t['id'])
    within=[v for k,v in sorted(daily.items()) if START<=k<=END]
    excluded=[v for k,v in sorted(daily.items()) if not START<=k<=END]
    fields=sorted(set().union(*(d.keys() for d in within))-{'date','sources','Shorts'})
    totals={k:sum(d[k] for d in within if d.get(k) is not None) if any(d.get(k) is not None for d in within) else None for k in fields}
    active=[d['date'] for d in within if any((d.get(k) or 0)>0 for k in ('Impr.','Custo','Visualizações públicas do YouTube','Visualizações do TrueView','Cliques'))]
    fulltot={k:sum(d[k] for d in daily.values() if d.get(k) is not None) if any(d.get(k) is not None for d in daily.values()) else None for k in fields}
    exactcamp='13 de outubro' in camp['period']
    if 'Visualizações do TrueView' not in totals and exactcamp:totals['Visualizações do TrueView']=num(r['Visualizações do TrueView'])
    if 'Conversões' not in totals and exactcamp:
        gt=get('Relatório do grupo de anúncios.csv');totals['Conversões']=sum(num(a['Conversões']) or 0 for a in detail(gt))
    # If the only excluded date has zero delivery, additive aggregates are applicable within covered dates.
    outside_zero=bool(excluded) and all(all((d.get(k) or 0)==0 for k in ('Impr.','Custo','Cliques','Visualizações públicas do YouTube','Visualizações do TrueView')) for d in excluded)
    if 'Visualizações do TrueView' not in totals and outside_zero:totals['Visualizações do TrueView']=num(r['Visualizações do TrueView'])
    monthly=[]
    for month in ('2026-07','2026-08','2026-09','2026-10'):
        ds=[d for d in within if d['date'].startswith(month)]
        mr={'month':month,'covered_days':len(ds),'active_days':sum(any((d.get(k) or 0)>0 for k in ('Impr.','Custo','Cliques','Visualizações públicas do YouTube','Visualizações do TrueView')) for d in ds)}
        for k in totals:mr[k]=sum(d[k] for d in ds if d.get(k) is not None) if any(d.get(k) is not None for d in ds) else None
        monthly.append(mr)
    issues=[]
    for t in tables:
        if 'Data' in t['fields'] or ' > ' in t['source']:continue
        for k in ('Impr.','Visualizações do TrueView','Custo'):
            if k not in t['fields']:continue
            value=sum(num(a.get(k)) or 0 for a in detail(t))
            reference=num(r.get(k))
            if reference is not None and abs(value-reference)>(0.051 if k=='Custo' else 0):issues.append({'source':t['id'],'metric':k,'detail_sum':round(value,4),'campaign_report':reference,'difference':round(value-reference,4)})
    for k in ('Impr.','Visualizações do TrueView','Custo'):
        if k in fulltot and fulltot[k] is not None:
            delta=round(fulltot[k]-(num(r.get(k)) or 0),4)
            if abs(delta)>(0.10 if k=='Custo' else 0):issues.append({'source':'séries diárias','metric':k,'detail_sum':fulltot[k],'campaign_report':num(r.get(k)),'difference':delta})
    loc=get('Relatório de locais.csv');dev=get('Relatório de dispositivos.csv');ads=get('Relatório de anúncios.csv');stores=get('Relatório por loja.csv');group=get('Relatório do grupo de anúncios.csv')
    c={'id':f'C{i:02}','folder':folder,'name':r['Campanha'],'family':'Bahia' if 'Bahia' in folder else ('Remarketing' if 'Remarketing' in folder else 'TRON SC'),'campaign':r,'campaign_source':camp['id'],'aggregate_period':camp['period'],'daily':within,'excluded':excluded,'daily_conflicts':conflicts,'monthly':monthly,'metrics':totals,'source_metrics':{k:num(r.get(k)) for k in ('Impr.','Visualizações do TrueView','Custo','CPM médio','CPV médio do TrueView','Usuários exclusivos')},'coverage_start':min(daily) if daily else None,'coverage_end':max(daily) if daily else None,'first_delivery':min(active) if active else None,'last_delivery':max(active) if active else None,'active_days':len(active),'aggregate_exact':exactcamp,'outside_zero':outside_zero,'reconciliation':issues,'tables':tables,'locations':detail(loc) if loc else [],'devices':detail(dev) if dev else [],'ads':detail(ads) if ads else [],'groups':detail(group) if group else [],'stores':detail(stores) if stores else [],'brand':[t for t in tables if ' > ' in t['source']]}
    c['metrics']['CTR']=totals['Cliques']/totals['Impr.'] if totals.get('Impr.') else None
    c['metrics']['CPM calculado']=totals['Custo']/totals['Impr.']*1000 if totals.get('Impr.') else None
    c['metrics']['CPC calculado']=totals['Custo']/totals['Cliques'] if totals.get('Cliques') else None
    c['metrics']['TrueView / impressões totais']=totals.get('Visualizações do TrueView',0)/totals['Impr.'] if totals.get('Impr.') and totals.get('Visualizações do TrueView') is not None else None
    c['metrics']['Custo total / TrueView']=totals['Custo']/totals['Visualizações do TrueView'] if totals.get('Visualizações do TrueView') else None
    c['metrics']['Custo por visualização pública']=totals['Custo']/totals['Visualizações públicas do YouTube'] if totals.get('Visualizações públicas do YouTube') else None
    c['location_source']=loc['id'] if loc else None;c['device_source']=dev['id'] if dev else None
    C.append(c)
out={'start':START,'end':END,'files':D['files'],'campaigns':C,'counts':{'files':len(D['files']),'csv':sum(f['type']=='.csv' for f in D['files']),'zip':sum(f['type']=='.zip' for f in D['files']),'zip_tables':sum(' > ' in t['source'] for t in D['tables']),'tables':len(D['tables']),'rows':sum(len(t['rows']) for t in D['tables'])}}
(ROOT/'data/generated/consolidado.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for c in C:
    print('\n',c['id'],c['name'],'cobertura',c['coverage_start'],c['coverage_end'],'entrega',c['first_delivery'],c['last_delivery'],'dias',c['active_days'])
    print('RECORTE',c['metrics']);print('14/10',c['excluded']);print('RECONCILIAÇÃO',c['reconciliation']);print('CONFLITOS',c['daily_conflicts'][:10])
    print('LOCAIS TOP',sorted(c['locations'],key=lambda a:num(a['Impr.']) or 0,reverse=True)[:3]);print('DEVICES',c['devices'])
    print('BRAND',[(t['id'],t['rows']) for t in c['brand'] if 'Local.csv' in t['source'] or 'Date' in t['fields']])
print('TOTAL', {k:sum(c['metrics'].get(k) or 0 for c in C) for k in ('Impr.','Cliques','Custo','Visualizações públicas do YouTube','Visualizações do TrueView')})
