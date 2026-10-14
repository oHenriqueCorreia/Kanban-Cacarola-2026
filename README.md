# Kanban Caçarola 2026

Kanban das oito campanhas de Google Ads e YouTube da Alimentos Caçarola, com período solicitado de **1º de julho a 13 de outubro de 2026**.

**[Abrir o Kanban na Vercel](https://kanban-cacarola-2026.vercel.app/)**

[Versão no GitHub Pages](https://ohenriquecorreia.github.io/Kanban-Cacarola-2026/)

## O que está no painel

O painel usa a identidade da Tráfegon: verde `#6EDA2C`, fundo `#34394A`, textos brancos e a logo da empresa. A logo está incorporada à página. A versão original do SVG e a versão com letras brancas estão em `assets/`.

Cada campanha tem sua própria seção, com quatro áreas:

- Resumo e período: orçamento, status, impressões, custo, cliques, CTR, CPM e CPC.
- Público e locais: público disponível, cidades e raios, incluindo todos os locais exportados.
- Vídeos e entrega: visualizações públicas, TrueView, criativos, destinos e dispositivos.
- Análise e ações: observações e tarefas da campanha.

É possível criar e editar tarefas, definir responsáveis, prazos e prioridades, mover cartões, concluir ações, arquivar e restaurar tarefas e registrar anotações. O painel não oferece opções de download, exportação ou impressão.

As campanhas continuam separadas nos filtros e nas fichas detalhadas. Os dados históricos não são alterados ao editar o acompanhamento.

## Salvar o trabalho

As alterações são salvas no navegador. A opção **Restaurar organização** permite importar um arquivo de organização anterior.

O projeto funciona sem servidor de aplicação e sem banco de dados. Alterações feitas por pessoas ou navegadores diferentes não são sincronizadas automaticamente. A planilha histórica é independente do acompanhamento no painel.

## Usar localmente

Abra `index.html` no navegador. Não é necessário instalar dependências para usar o Kanban.

Para servir o projeto em um endereço local, com Python 3.12 ou superior:

```bash
python scripts/serve.py
```

Abra `http://127.0.0.1:8000/`. Para outra porta, use `python scripts/serve.py --port 8080`.

## Desenvolver e verificar

Requisitos de desenvolvimento: Node.js 24 ou superior e Python 3.12 ou superior.

```bash
npm ci
npm run check
```

`npm run build` gera `index.html` a partir do código e dos dados. `npm test` verifica navegação, filtros, separação das campanhas, criação e edição de tarefas, movimentação, persistência, integridade dos arquivos e resultados da planilha histórica.

Depois de alterar o código ou os dados, execute `npm run check` e inclua a página gerada no commit. O GitHub Actions repete as verificações em cada push e pull request.

Para refazer a análise a partir dos 74 arquivos originais, execute `npm run analyze` e depois `npm test`. Essa rotina recompõe o conjunto histórico atual e gera a página. Os critérios, os nomes das campanhas e o período de 2026 pertencem a este relatório. Para outro período, revise a consolidação, a análise e as verificações antes de substituir os dados. A planilha histórica fornecida não é regenerada por essa rotina.

## Organização do repositório

| Caminho | Conteúdo |
| --- | --- |
| `index.html` | Página pronta para abrir e publicar |
| `src/` | Template visual e funções do Kanban |
| `assets/` | Logo original da Tráfegon e versão para fundo escuro |
| `data/campaigns.json` | Dados consolidados, fontes e análises |
| `data/originais/` | Todos os 74 arquivos originais, preservados byte a byte |
| `downloads/` | Planilha histórica com 13 abas |
| `scripts/` | Geração da página e servidor local |
| `tests/` | Testes funcionais, de organização e dos dados |
| `docs/` | Guia de uso e metodologia |
| `.github/workflows/` | Verificação automática no GitHub |

## Cobertura dos dados

Foram analisados 69 CSVs e cinco ZIPs, com 30 CSVs internos: **99 tabelas e 2.126 registros**. Os originais permanecem no repositório, inclusive arquivos UTF-16 e ZIPs.

O recorte principal exclui 14/10. As séries Bahia cobrem todo o período solicitado. As séries TRON começam em 01/09, e remarketing em 27/08. Dias sem exportação permanecem indisponíveis, em vez de serem preenchidos com zero.

Visualizações públicas e TrueView são métricas diferentes. O TrueView exato até 13/10 não foi exportado para TRON 01 e TRON 02. Detalhes agregados de TRON e remarketing que incluem 14/10 mantêm o período original. As lacunas e divergências aparecem na auditoria.

Consulte [a metodologia](docs/METODOLOGIA.md) e [o guia de uso](docs/GUIA-DE-USO.txt).

## Publicação

### Vercel

Site em produção: **https://kanban-cacarola-2026.vercel.app/**. O projeto `kanban-cacarola-2026` está conectado a este repositório; pushes na branch `main` geram a publicação de produção.

O arquivo `vercel.json` define a publicação estática. O build usa somente Node.js, sem bibliotecas de execução, e gera o Kanban na pasta `dist/`. A planilha histórica fica preservada no repositório e não é incluída na publicação da Vercel.

```bash
npm run test:vercel
```

Ao importar este repositório na Vercel, mantenha a raiz do projeto em `./`. A configuração de framework, comando de build e pasta de saída já está no repositório. A publicação precisa ser feita na conta Vercel do proprietário do projeto.

O armazenamento das tarefas continua sendo local ao navegador. A publicação na Vercel não adiciona sincronização entre dispositivos.

### GitHub Pages

O GitHub Pages publica a branch `main`, na raiz `/`. O arquivo `.nojekyll` mantém a página estática. O endereço do Kanban aparece no início deste documento.
