"""Generate a portable page from the source template and verified campaign data."""
from pathlib import Path
import json
import base64

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/campaigns.json').read_text(encoding='utf-8'))
meta_data = json.loads((ROOT / 'data/meta-campaigns.json').read_text(encoding='utf-8'))
template = (ROOT / 'src/painel-template.html').read_text(encoding='utf-8')
code = (ROOT / 'src/kanban-funcional.js').read_text(encoding='utf-8')
theme = (ROOT / 'src/trafegon-theme.css').read_text(encoding='utf-8')
logo = 'data:image/svg+xml;base64,' + base64.b64encode((ROOT / 'assets/logo-trafegon-branca.svg').read_bytes()).decode('ascii')
embedded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
embedded_meta = json.dumps(meta_data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
page = template.replace('__DATA__', embedded).replace('__META_DATA__', embedded_meta).replace('__FUNCTIONAL__', code).replace('__BRAND_CSS__', theme).replace('__LOGO_DATA__', logo)
assert not any(marker in page for marker in ('__DATA__','__META_DATA__','__FUNCTIONAL__','__BRAND_CSS__','__LOGO_DATA__'))
(ROOT / 'index.html').write_text(page, encoding='utf-8', newline='\n')
(ROOT / '.nojekyll').touch()
print('index.html gerado: 8 campanhas Google/YouTube e 31 fichas Meta Ads.')
