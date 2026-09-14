import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSearchText,matchesSearch,searchCounts} from './search.js';
import {assess} from './logic.js';
const catalog=JSON.parse(readFileSync(new URL('./catalog.json',import.meta.url)));
test('Sponge cloth spelling, hyphens, plural and Swedish aliases find recorded products',()=>{
 const p={name:'Swedish Dishcloths, 12ct',brand:'Example',category:'Sponges',tags:[]};const text=buildSearchText(p);
 for(const q of ['sponge cloth','spongecloth','sponge-cloths','Swedish dish cloths','cellulose cloth','cloth sponge'])assert.equal(matchesSearch(text,q),true,q);
 const microfiber=buildSearchText({name:'Microfiber Sponge Cloths',category:'Sponges',productType:'Microfiber sponge cloth',tags:[]});
 assert.equal(matchesSearch(microfiber,'sponge cloth'),true);assert.equal(matchesSearch(microfiber,'Swedish dishcloth'),false);
 assert.equal(matchesSearch(buildSearchText({name:'Wire dishcloths',category:'Manual Tools',tags:[]}),'sponge cloth'),false);
});
test('The screenshot query has real catalog matches across five retailers',()=>{
 const results=catalog.filter(p=>matchesSearch(buildSearchText(p),'sponge cloth'));
 assert.ok(results.length>=13);assert.deepEqual(new Set(results.map(p=>p.retailer)),new Set(['Target','Walmart','Amazon','Costco','Home Depot']));
 assert.ok(catalog.length>=1912);assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
});
test('A Target sponge cloth remains searchable globally while excluded from Needs Target check and whitespace',()=>{
 const counts=searchCounts(catalog,'Everspring sponge cloth');assert.equal(counts.total,1);assert.equal(counts.target,1);
 const p=catalog.find(p=>p.id==='source-repair-target-87488052'),d=assess(p,catalog);assert.equal(d.isWhitespace,false);assert.equal(d.status,'Target listing recorded');
 const local=catalog.filter(p=>matchesSearch(buildSearchText(p),'Everspring sponge cloth')&&assess(p,catalog).tone==='unknown');assert.equal(local.length,0);
});
