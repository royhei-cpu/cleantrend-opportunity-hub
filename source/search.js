import {offers,atTarget} from './logic.js';
export function normalizeSearch(value=''){
 return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/microfibre/g,'microfiber').replace(/dish[\s-]+cloth/g,'dishcloth').replace(/sponge[\s-]*cloth/g,'spongecloth').replace(/[^a-z0-9]+/g,' ').trim().replace(/\b(cloths|dishcloths|spongecloths|sponges)\b/g,w=>w.slice(0,-1));
}
export function spongeClothType(p){
 const t=normalizeSearch([p.name,p.productType,...(p.tags||[])].join(' '));
 if(/\bspongecloth\b|\bsponge dishcloth\b|\bswedish dishcloth\b|\bcellulose dishcloth\b|\bcellulose cloth\b/.test(t))return /microfiber/.test(t)?'microfiber':'cellulose';
 return null;
}
export function buildSearchText(p){
 const kind=spongeClothType(p);
 const aliases=kind?['sponge cloth','spongecloth',...(kind==='cellulose'?['Swedish dishcloth','Swedish dish cloth','cellulose cloth','cellulose dishcloth']:[])]:[];
 return normalizeSearch([p.name,p.brand,p.category,p.productType,...(p.tags||[]),...(p.searchAliases||[]),...aliases,...offers(p).flatMap(o=>[o.retailer,o.market])].filter(Boolean).join(' '));
}
export function matchesSearch(text,query){const tokens=normalizeSearch(query).split(' ').filter(Boolean);return tokens.every(token=>text.includes(token));}
export function searchCounts(products,query){const matches=products.filter(p=>matchesSearch(buildSearchText(p),query));return {total:matches.length,target:matches.filter(atTarget).length};}
