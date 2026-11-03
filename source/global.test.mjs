import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from './catalog.json' with { type: 'json' };
import extra from './global-products.json' with { type: 'json' };
import research from './global-research.json' with { type: 'json' };
import {assess} from './logic.js';
import {coverageSummary,filterGlobalProducts,buildRetailListings,retailDirectory,countriesFor,unitEconomics,csvCell} from './global-logic.js';

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

test('Retailer discovery includes the entire catalog, all countries and the existing China listings',()=>{
 const combined=[...catalog,...extra], rows=buildRetailListings(combined);
 assert.deepEqual(new Set(rows.map(p=>p.id)),new Set(combined.map(p=>p.id)));
 assert.equal(new Set(rows.flatMap(p=>p.countries)).size,20);
 assert.equal(retailDirectory(rows).length,68);
 assert.ok(filterGlobalProducts(rows,{region:'Europe'}).length>0);
 const china=filterGlobalProducts(rows,{country:'China'});
 assert.equal(china.length,11);
 assert.ok(china.every(p=>p.market==='China'));
 assert.deepEqual(retailDirectory(china).map(r=>[r.name,r.count]),[['JD.com',9],['Taobao',1],['Tmall',1]]);
 assert.deepEqual(filterGlobalProducts(rows,{query:'中国'}).map(p=>p.listingKey),china.map(p=>p.listingKey));
 assert.equal(filterGlobalProducts(rows,{country:'China',retailer:'JD.com',query:'plant-based laundry detergent'}).length,1);
 assert.equal(filterGlobalProducts(rows,{country:'China',region:'Europe'}).length,0);
 assert.equal(new Set(rows.map(p=>p.listingKey)).size,rows.length);
 assert.equal(china.filter(p=>p.sourceDate==='2026-09-11').length,8);
 assert.equal(china.filter(p=>p.sourceDate===null).length,3);
});

test('Offer indexing preserves original identity and evidence without copying one retailers price or date to another',()=>{
 const product={id:'same-product',name:'Homecare item',brand:'Example',retailer:'Example US',market:'US / Global',link:'https://example.com/us',priceLabel:'$5',referencePrice:{amount:5,currency:'USD'},evidence:{checkedAt:'2026-09-11'},availability:[
  {retailer:'Example US',market:'US / Global',link:'https://example.com/us',priceLabel:'$5'},
  {retailer:'Example China',market:'China',link:'https://example.com/cn',priceLabel:'¥30',evidence:{checkedAt:'2026-09-10'}},
  {retailer:'Example China',market:'China',link:'https://example.com/cn',priceLabel:'¥30',evidence:{checkedAt:'2026-09-10'}},
  {retailer:'Example UK',market:'United Kingdom',link:'https://example.com/uk'},
 ]};
 const before=JSON.stringify(product),rows=buildRetailListings([product]);
 assert.equal(rows.length,3);assert.ok(rows.every(p=>p.id===product.id&&p.product===product));
 assert.deepEqual(countriesFor('US / Global / Korea'),['United States','South Korea']);
 assert.equal(rows[0].sourceDate,'2026-09-11');assert.equal(rows[0].referencePrice.currency,'USD');
 assert.equal(rows[1].sourceDate,'2026-09-10');assert.equal(rows[1].priceLabel,'¥30');assert.equal(rows[1].referencePrice,undefined);
 assert.equal(rows[2].sourceDate,null);assert.equal(rows[2].priceLabel,'Price not recorded');
 assert.equal(JSON.stringify(product),before);
});
