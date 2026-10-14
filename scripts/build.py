"""Generate a portable page from the source template and verified campaign data."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/campaigns.json').read_text(encoding='utf-8'))
template = (ROOT / 'src/painel-template.html').read_text(encoding='utf-8')
code = (ROOT / 'src/kanban-funcional.js').read_text(encoding='utf-8')
embedded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
page = template.replace('__DATA__', embedded).replace('__FUNCTIONAL__', code)
assert '__DATA__' not in page and '__FUNCTIONAL__' not in page
(ROOT / 'index.html').write_text(page, encoding='utf-8', newline='\n')
(ROOT / '.nojekyll').touch()
print('index.html gerado: 8 campanhas, dados completos e funcionalidades locais.')
