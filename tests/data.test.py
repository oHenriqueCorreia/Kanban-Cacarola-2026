from pathlib import Path
import json,csv,io,zipfile,hashlib,datetime,re,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/campaigns.json').read_text(encoding='utf-8'))
meta=json.loads((ROOT/'data/meta-campaigns.json').read_text(encoding='utf-8'))
assert d['counts']=={'files':74,'csv':69,'zip':5,'zip_tables':30,'tables':99,'rows':2126}
for f in d['files']:
    p=ROOT/'data/originais'/f['source'];assert p.is_file();assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
    if f['type']=='.zip':
        with zipfile.ZipFile(p) as z:assert z.namelist()==f['members']
for c in d['campaigns']:
    assert len(c['daily'])==len({r['date'] for r in c['daily']})
    assert all('2026-07-01'<=r['date']<='2026-10-13' for r in c['daily'])
    assert not any(s[:10]<='2026-10-13' for s in c['daily_conflicts'])
    assert round(sum(r['Custo'] for r in c['daily']),2)==round(c['metrics']['Custo'],2)
    assert sum(r['Impr.'] for r in c['daily'])==c['metrics']['Impr.']
    if c['id'] in ['C05','C06']:assert 'Visualizações do TrueView' not in c['metrics']
    assert 'Shorts' not in c['metrics']
assert sum(c['metrics']['Impr.'] for c in d['campaigns'])==657470
assert sum(c['metrics']['Visualizações públicas do YouTube'] for c in d['campaigns'])==567161
assert sum(c['metrics']['Cliques'] for c in d['campaigns'])==261
assert len(meta['monthlyCampaigns'])==29
assert len(meta['originCampaigns'])==2
assert meta['annual']=={
    'period':'janeiro a outubro (ano não informado no PDF)',
    'investment':20585.4,'interactions':6493,'impressions':9997677,
    'ctrReported':'0,08','highlightCampaign':'SuperMarket - Insta Face',
    'source':'Relatório Anual - Meta',
    'sourceNote':'Valores exibidos exatamente conforme o relatório de origem; eventuais inconsistências não foram recalculadas.'
}
assert meta['planning']['invested']==10320
assert meta['planning']['availableBalance']==19679
assert meta['planning']['dailyProjection']==262
assert meta['planning']['baDaily']==meta['planning']['scDaily']==131
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(ROOT/'downloads/Campanhas-Cacarola.xlsx') as z:
    book=E.fromstring(z.read('xl/workbook.xml'));sheets=book.find('s:sheets',ns)
    assert len(sheets)==13
    root=E.fromstring(z.read('xl/worksheets/sheet1.xml'))
    cells={r.attrib['r']:r for r in root.findall('.//s:c',ns)}
    for addr,value in [('D15',657470),('E15',567161),('G15',2980.15),('H15',261)]:
        assert abs(float(cells[addr].find('s:v',ns).text)-value)<1e-7
    formulas=sum(len(E.fromstring(z.read(n)).findall('.//s:f',ns)) for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml'))
    assert formulas==69
    assert len([r for r in E.fromstring(z.read('xl/worksheets/sheet9.xml')).findall('s:sheetData/s:row',ns) if int(r.attrib['r'])>=6])==840
    # Raw records: header plus populated title rows, followed by all 2,126 original records.
    rawroot=E.fromstring(z.read('xl/worksheets/sheet13.xml'))
    assert len([r for r in rawroot.findall('s:sheetData/s:row',ns) if int(r.attrib['r'])>=6])==2126
    assert len(E.fromstring(z.read('xl/worksheets/sheet3.xml')).findall('.//s:dataValidation',ns))==1
print('Dados OK: 74 arquivos preservados, 99 tabelas, 2.126 registros, corte até 13/10, totais reconciliados, 69 fórmulas e 13 abas no Excel.')
