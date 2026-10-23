# Painel de campanhas Caçarola

Painel estático e responsivo com áreas independentes para campanhas de **Google Ads / YouTube** e **Meta Ads (Facebook e Instagram)**.

- Produção: https://kanban-cacarola-2026.vercel.app/
- GitHub Pages: https://ohenriquecorreia.github.io/Kanban-Cacarola-2026/

## Conteúdo

- Google Ads / YouTube: oito campanhas, indicadores, público, locais, criativos, dispositivos, evolução e comparativo.
- Meta Ads: resumo executivo próprio, 29 fichas mensais, duas fichas “Famílias do Campo”, relatório anual de comentários, planejamento histórico e comparativo.
- Comentários: evolução mensal, detalhamento por campanha, melhores regiões e ranking mensal de criativos.
- Busca por campanha, estado, objetivo, criativo ou região e filtros por plataforma e grupo/região.
- Dados ausentes sinalizados sem estimativas e métricas das plataformas mantidas separadas.

O painel é somente para consulta. Não possui edição, importação, downloads ou banco de dados.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `data/campaigns.json` | Dados consolidados exibidos de Google Ads / YouTube |
| `data/meta-campaigns.json` | Dados consolidados exibidos de Meta Ads |
| `src/` | Template, comportamento e estilos |
| `assets/logo-trafegon-branca.svg` | Único ativo visual usado no build |
| `scripts/build.mjs` | Gera `index.html` e `dist/index.html` |
| `scripts/serve.mjs` | Servidor local de desenvolvimento |
| `tests/` | Integridade dos dados, interface e saída de produção |

Arquivos brutos, planilhas históricas, scripts de análise e documentação duplicada foram retirados. O repositório contém somente os dados consolidados necessários para o painel atual.

## Desenvolvimento

Requisito: Node.js 24 ou superior.

```bash
npm ci
npm run check
npm start
```

O servidor local abre em `http://127.0.0.1:8000/`. Para outra porta:

```bash
npm start -- --port 8080
```

`npm run check` gera as duas saídas e executa todos os testes. A automação do GitHub repete essa verificação em cada push e pull request.

## Publicação

O `vercel.json` usa `npm run build` e publica a pasta `dist/`. A branch `main` também mantém `index.html` pronto para o GitHub Pages.
