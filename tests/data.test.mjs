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
assert.equal(meta.originStrategy.generalPeriod,'23/07 a 23/10');
const originSC=meta.originCampaigns.find(c=>c.state==='SC');
const originBA=meta.originCampaigns.find(c=>c.state==='BA');
assert.deepEqual(originSC.metrics,{postEngagement:996646,impressions:1940202,reach:438324,frequency:4.43,cpm:3.48,comments:122});
assert.deepEqual(originBA.metrics,{postEngagement:821991,impressions:2077045,reach:519735,frequency:4,cpm:3.25,comments:92});
assert.equal(originSC.regions.find(r=>r.name==='São José do Cedro até Xaxim').frequency,416);
assert.match(originSC.dataNote,/mantida exatamente/);
assert.equal(originSC.metrics.comments+originBA.metrics.comments,214);
assert.equal(meta.annual.investment,20585.4);
assert.equal(meta.annual.interactions,6493);
assert.equal(meta.annual.impressions,9997677);
assert.equal(meta.annual.ctrReported,'0,08');
assert.equal(meta.planning.invested,13505.71);
assert.equal(meta.planning.toInvestByDecember,16494.29);
assert.equal(meta.planning.totalPlanned,30000);
assert.equal(meta.commentsReport.annualTotalListed,328);
assert.equal(meta.commentsReport.monthly.length,10);
assert.equal(meta.commentsReport.monthly.filter(month=>month.noData).length,2);
assert.equal(meta.commentsReport.monthly.filter(month=>month.total!==null).reduce((sum,month)=>sum+month.total,0),328);
assert.equal(meta.commentsReport.familiesTotal,294);
assert.match(meta.commentsReport.note,/permanecem separados dos 214 comentários/);
assert.equal(meta.commentsReport.families.monthly.reduce((sum,month)=>sum+month.total,0),294);
assert.equal(meta.commentsReport.families.regions.length,18);
assert.equal(meta.commentsReport.families.creatives.length,12);

console.log('DADOS OK: 8 campanhas Google/YouTube, 31 fichas Meta Ads e relatório anual de comentários consolidados.');
