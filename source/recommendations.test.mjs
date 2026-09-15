import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rankTargetProducts} from './recommendations.js';
import {assess,DAY} from './logic.js';
const now=Date.parse('2026-09-14T12:00:00Z');
const review={status:'not-carried',currentlyCarried:false,equivalentCurrentlyCarried:false,temporarilyOutOfStock:false,reviewedBy:'Synthetic test reviewer',checkedAt:'2026-09-14T11:00:00Z',scope:'target-us',exactProductChecked:true,equivalentsChecked:true,targetPlusChecked:true,reason:'Synthetic absence review only.',sourceUrls:['https://www.target.com/s?searchTerm=synthetic-test-product']};
const base=(id,extra={})=>({id,name:id,brand:'Synthetic',category:'Sponges',tags:[],trend:'Established',...extra});
const commercial={demandEvidence:{sourceUrl:'https://example.com/demand',summary:'Synthetic current demand',qualified:true,observedAt:'2026-09-14T11:00:00Z',periodEnd:'2026-09-14T11:00:00Z',checkedAt:'2026-09-14T11:00:00Z'},priceUsd:3,link:'https://example.com/product',evidence:{checkedAt:'2026-09-14T11:00:00Z'},feasibility:{approved:true,reviewedBy:'Synthetic reviewer',sourceUrl:'https://example.com/quote',checkedAt:'2026-09-14T11:00:00Z'}};
test('Ranked Target tests require current absence and favor complete evidence over legacy scores; equal evidence ties',()=>{
 const a=base('Complete A',{...commercial,score:0,targetAssessment:review});
 const b=base('Legacy B',{score:100,trend:'Viral',targetAssessment:review});
 const c=base('Unverified C',{...commercial,score:100});
 const d=base('Target D',{...commercial,retailer:'Target',targetAssessment:review});
 const e=base('Complete E',{...commercial,targetAssessment:review});
 const rows=rankTargetProducts([a,b,c,d,e],{now});
 assert.deepEqual(rows.map(r=>r.product.id),['Complete A','Complete E','Legacy B']);
 assert.deepEqual(rows.map(r=>r.rank),[1,1,3]);
 assert.ok(rows[0].decision.ready);assert.equal(rows[2].decision.ready,false);
 assert.equal(rankTargetProducts([a,b,c,d,e],{now:now+DAY}).length,0);
});
test('The live catalog has no fabricated recommendations and research candidates stay outside the confirmed list',()=>{
 const catalog=JSON.parse(readFileSync(new URL('./catalog.json',import.meta.url)));
 assert.equal(rankTargetProducts(catalog,{now}).length,0);
 const research=rankTargetProducts(catalog,{now,research:true});
 assert.ok(research.length>=0);
 assert.ok(research.every(row=>!row.decision.isWhitespace));
 assert.ok(research.every(row=>row.marketSupported));
});
