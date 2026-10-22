import fs from 'node:fs/promises';
import {checkResults} from './results-check.mjs';
const dom=checkResults(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'));
dom.window.close();
console.log('PAINEL OK: Google/YouTube preservado, 31 fichas Meta Ads, filtros por plataforma e comparativos separados; sem edição, arquivos ou downloads.');
