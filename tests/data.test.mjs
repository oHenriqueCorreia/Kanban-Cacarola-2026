import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const google=JSON.parse(await fs.readFile(new URL('../data/campaigns.json',import.meta.url),'utf8'));
const meta=JSON.parse(await fs.readFile(new URL('../data/meta-campaigns.json',import.meta.url),'utf8'));

assert.deepEqual(Object.keys(google),['start','end','campaigns']);
assert.equal(google.start,'2026-07-01');
assert.equal(google.end,'2026-10-13');
assert.equal(google.campaigns.length,8);
assert.equal(new Set(google.campaigns.map(c=>c.id)).size,8);
assert.equal(google.campaigns.reduce((sum,c)=>sum+c.metrics['Impr.'],0),657470);
assert.equal(google.campaigns.reduce((sum,c)=>sum+c.metrics['Visualizações públicas do YouTube'],0),567161);
assert.equal(google.campaigns.reduce((sum,c)=>sum+c.metrics.Cliques,0),261);
for(const campaign of google.campaigns){
  assert.equal(campaign.daily.length,new Set(campaign.daily.map(row=>row.date)).size);
  assert.ok(campaign.daily.every(row=>row.date>=google.start&&row.date<=google.end));
  assert.equal(Math.round(campaign.daily.reduce((sum,row)=>sum+row.Custo,0)*100),Math.round(campaign.metrics.Custo*100));
}

assert.equal(meta.monthlyCampaigns.length,29);
assert.equal(meta.originCampaigns.length,2);
assert.equal(meta.annual.investment,20585.4);
assert.equal(meta.annual.interactions,6493);
assert.equal(meta.annual.impressions,9997677);
assert.equal(meta.annual.ctrReported,'0,08');
assert.equal(meta.planning.invested,10320);
assert.equal(meta.planning.availableBalance,19679);
assert.equal(meta.planning.dailyProjection,262);
assert.equal(meta.planning.baDaily,131);
assert.equal(meta.planning.scDaily,131);
assert.equal(meta.commentsReport.annualTotalListed,328);
assert.equal(meta.commentsReport.monthly.length,10);
assert.equal(meta.commentsReport.monthly.filter(month=>month.noData).length,2);
assert.equal(meta.commentsReport.monthly.filter(month=>month.total!==null).reduce((sum,month)=>sum+month.total,0),328);
assert.equal(meta.commentsReport.familiesTotal,294);
assert.equal(meta.commentsReport.families.monthly.reduce((sum,month)=>sum+month.total,0),294);
assert.equal(meta.commentsReport.families.regions.length,18);
assert.equal(meta.commentsReport.families.creatives.length,12);

console.log('DADOS OK: 8 campanhas Google/YouTube, 31 fichas Meta Ads e relatório anual de comentários consolidados.');
