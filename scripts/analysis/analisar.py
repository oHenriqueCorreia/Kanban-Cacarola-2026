from pathlib import Path
import csv,io,json,zipfile,hashlib,sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'data/generated'
OUT.mkdir(parents=True,exist_ok=True)
files=[]; tables=[]
def decode(b):
    if b[:2] in (b'\xff\xfe',b'\xfe\xff'): return b.decode('utf-16'),'UTF-16'
    try:return b.decode('utf-8-sig'),'UTF-8'
    except UnicodeDecodeError:return b.decode('cp1252'),'Windows-1252'
def parse(b,source,campaign):
    s,encoding=decode(b); lines=s.splitlines()
    # Google Ads exports have two title/period rows, followed by tab-delimited records.
    delim='\t' if '\t' in s else ','
    header=next((i for i,l in enumerate(lines) if delim in l),None)
    if header is None: fields=[];rows=[]
    else:
        reader=csv.DictReader(io.StringIO('\n'.join(lines[header:])),delimiter=delim)
        fields=reader.fieldnames; rows=[{k:v for k,v in r.items() if k is not None} for r in reader if any(v for v in r.values())]
    import re
    period=lines[1] if header and header>=2 else ('Datas no nome: '+re.search(r'\((\d{4}\.\d{2}\.\d{2}-\d{4}\.\d{2}\.\d{2})\)',source).group(1) if re.search(r'\((\d{4}\.\d{2}\.\d{2}-\d{4}\.\d{2}\.\d{2})\)',source) else 'Período não informado no arquivo')
    record={'id':f'F{len(tables)+1:03}','source':source,'folder':campaign,'encoding':encoding,'title':lines[0] if header else source.split(' > ')[-1].split('/')[-1], 'period':period, 'fields':fields,'rows':rows,'sha256':hashlib.sha256(b).hexdigest()}
    tables.append(record)
RAW=ROOT/'data/originais'
for folder in sorted(p for p in RAW.iterdir() if p.is_dir()):
    for p in sorted(folder.rglob('*')):
        if not p.is_file():continue
        rel=p.relative_to(RAW).as_posix(); b=p.read_bytes()
        files.append({'source':rel,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'type':p.suffix,'members':[]})
        if p.suffix.lower()=='.csv':parse(b,rel,folder.name)
        elif p.suffix.lower()=='.zip':
            with zipfile.ZipFile(p) as z:
                for n in z.namelist():
                    files[-1]['members'].append(n)
                    if not n.endswith('/'):parse(z.read(n),rel+' > '+n,folder.name)
        else:raise RuntimeError('Arquivo não analisado: '+rel)
(OUT/'fontes.json').write_text(json.dumps({'files':files,'tables':tables},ensure_ascii=False,indent=2),encoding='utf-8')
print('ARQUIVOS',len(files),'CSV ORIGINAIS',sum(f['type']=='.csv' for f in files),'ZIP',sum(f['type']=='.zip' for f in files),'TABELAS',len(tables),'LINHAS',sum(len(t['rows']) for t in tables))
print('Inventário e dados completos salvos em data/generated/fontes.json')
