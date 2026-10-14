def num(s,english=False):
    if s is None:return None
    s=str(s).strip().replace('R$','').replace('\xa0','').replace(' ','')
    if s in ('','--','—','null','-'):return None
    percent=s.endswith('%');s=s.rstrip('%')
    v=float(s if english else s.replace('.','').replace(',','.'))
    return v/100 if percent else v

def br(v,places=0):
    if v is None:return 'Não disponível'
    return f'{v:,.{places}f}'.replace(',','x').replace('.',',').replace('x','.')
