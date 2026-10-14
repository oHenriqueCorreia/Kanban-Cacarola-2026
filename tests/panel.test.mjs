import fs from 'node:fs/promises';
import {checkResults} from './results-check.mjs';
const dom=checkResults(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'));
dom.window.close();
console.log('PAINEL OK: 8 campanhas, 3 áreas por campanha, filtros, comparativo e 40 abas de resultados; sem edição, arquivos ou downloads.');
