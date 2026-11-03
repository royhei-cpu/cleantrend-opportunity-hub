import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from './catalog.json' with { type: 'json' };
import extra from './global-products.json' with { type: 'json' };
import research from './global-research.json' with { type: 'json' };
import {assess} from './logic.js';
import {coverageSummary,filterGlobalProducts,unitEconomics,csvCell} from './global-logic.js';

test('Global expansion retains every original record and keeps hypotheses outside verified whitespace',()=>{
 const combined=[...catalog,...extra];
 assert.equal(catalog.length,1918);
 assert.equal(combined.length,1959);
 assert.equal(new Set(combined.map(p=>p.id)).size,combined.length);
 const urls=new Set(research.sources.map(s=>s.id));
 assert.equal(research.opportunities.length,12);
 for(const p of extra){
  assert.ok(p.link.startsWith('https://'));
  assert.equal(p.assessmentStatus,'Pending');
  assert.equal(assess(p,combined).isWhitespace,false);
  if(p.referencePrice.currency!=='USD')assert.equal(p.priceUsd,null);
 }
 for(const o of research.opportunities){assert.ok(o.evidenceIds.every(id=>urls.has(id)));assert.ok(Object.values(o.checks).every(value=>value===false));}
 assert.equal(coverageSummary(combined).records,1959);
 assert.equal(research.retailers.length,14);
});
test('Global filters combine region, retailer and search without empty accidental matches',()=>{
 const africa=filterGlobalProducts(extra,{region:'Africa'});
 assert.equal(africa.length,4);
 assert.ok(africa.every(p=>p.market==='South Africa'));
 assert.equal(filterGlobalProducts(extra,{retailer:'NTUC FairPrice',query:'glass refill'}).length,1);
 assert.equal(filterGlobalProducts(extra,{region:'Africa',retailer:'MUJI Japan'}).length,0);
 assert.equal(filterGlobalProducts(extra,{query:'zzzznotfound'}).length,0);
});
test('Cost scenarios reject invalid denominators and preserve zero-price math; CSV blocks formulas',()=>{
 assert.equal(unitEconomics(4,20),0.2);
 assert.equal(unitEconomics(0,20),0);
 for(const [price,uses] of [[4,0],[4,-1],[-1,20],[NaN,20],[4,Infinity]])assert.equal(unitEconomics(price,uses),null);
 assert.equal(csvCell('=1+1'),'"\'=1+1"');
 assert.equal(csvCell('a"b'),'"a""b"');
});
