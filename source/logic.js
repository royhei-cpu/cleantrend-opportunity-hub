export const DAY = 86400000;
export function recent(date, days = 7, now = Date.now()) {
  const time = Date.parse(date || '');
  return Number.isFinite(time) && time <= now && now - time <= days * DAY;
}
export function isFreshViral(p, now = Date.now()) {
  const e = p.trendEvidence;
  return p.trend === 'Viral' && e?.qualified === true && !!e.sourceUrl && !!e.summary && recent(e.observedAt, 7, now) && recent(e.periodEnd, 7, now);
}
export function trendLabel(p) {
  if (p.trend === 'Viral') return isFreshViral(p) ? 'Fresh viral signal' : 'Historical viral signal';
  return p.assessmentStatus === 'Pending' ? 'Catalog listing' : 'Recorded ' + p.trend.toLowerCase();
}
export function offers(p) {
  return p.availability?.length ? p.availability : [{retailer:p.retailer,channel:p.channel,link:p.link,priceLabel:p.priceLabel,priceUsd:p.priceUsd,evidence:p.evidence}];
}
export function atTarget(p) { return offers(p).some(o=>o.retailer==='Target' && o.channel==='Target'); }
const formats = ['refill','tablet','powder','spray','paste','foam','concentrate','liquid','wipe','cloth','sponge','brush','mop','vacuum','scrubber','bag','glove','squeegee','duster'];
export function productFormats(p) { const s=(p.name+' '+(p.tags||[]).join(' ')).toLowerCase(); return formats.filter(f=>new RegExp('\\b'+f+'(?:s|es)?\\b').test(s)); }
const assessmentCache = new WeakMap();
export function assess(p,catalog,now=Date.now()){
 let cache=assessmentCache.get(catalog);if(!cache){cache=new WeakMap();assessmentCache.set(catalog,cache)}
 const day=Math.floor(now/DAY), hit=cache.get(p);if(hit?.day===day)return hit.value;
 const value=computeAssessment(p,catalog,now);cache.set(p,{day,value});return value;
}
function computeAssessment(p, catalog, now) {
  const own=atTarget(p), f=productFormats(p);
  const peers=catalog.filter(q=>q.id!==p.id && q.category===p.category && atTarget(q));
  const similar=peers.map(q=>({p:q,n:productFormats(q).filter(x=>f.includes(x)).length})).filter(q=>q.n>0).sort((a,b)=>b.n-a.n||a.p.id.localeCompare(b.p.id)).slice(0,2).map(q=>q.p);
  const reviewed=p.targetAssessment;
  const validated=reviewed?.reviewedBy && reviewed?.sourceUrls?.length && recent(reviewed.checkedAt,30,now) && reviewed?.reason;
  let status='Not verified',tone='unknown',reason='',next='';
  if(own) { status='Target listing recorded';tone='benchmark';reason='This exact product has a Target offer in the directory. Recheck the offer and seller before treating it as current Target assortment.';next='Use this as a Target benchmark. Confirm current price, pack and whether it is sold by Target or a marketplace seller.'; }
  else if(validated && reviewed.status==='potential-gap') {status='Potential Target gap';tone='potential';reason=reviewed.reason;next=reviewed.nextStep||'Validate the shopper need, supplier cost and sample performance before proposing a test.';}
  else if(similar.length) {status='Target alternatives to check';tone='benchmark';reason=`The directory contains ${similar.map(q=>q.brand+' '+q.name).join(' and ')} in the same category with a related format. These are suggested comparisons, not confirmed equivalents.`;next=`Compare ${f.join(' / ')||'function'}, pack size and guest benefit against ${similar[0].brand} ${similar[0].name}. A specific improvement must justify adding this item.`;}
  else if(peers.length && f.length) {status='Potential Target gap';tone='potential';reason=`No related ${f.join(' / ')} format was found among ${peers.length} recorded Target products in ${p.category}. This is a directory lead only; Target coverage is incomplete.`;next=`Search live Target assortment for ${p.brand} ${p.name} and the ${f.join(' / ')} format. Confirm a meaningful benefit before claiming whitespace.`;}
  else {reason=`The captured Target assortment is insufficient to decide whether this ${p.category.toLowerCase()} product fills a gap.`;next=`Find the nearest current Target ${p.category.toLowerCase()} product, then compare the function, pack and guest benefit.`;}
  const gapChecked=!!validated;
  const demandChecked=!!p.demandEvidence?.sourceUrl && !!p.demandEvidence?.summary && recent(p.demandEvidence?.checkedAt,7,now);
  const priceChecked=offers(p).some(o=>o.priceUsd>0 && o.link && recent(o.evidence?.checkedAt,7,now));
  const supplyChecked=!!p.feasibility?.reviewedBy && !!p.feasibility?.sourceUrl && p.feasibility?.approved===true && recent(p.feasibility?.checkedAt,90,now);
  const gates=[{label:'Target gap',ok:gapChecked,detail:gapChecked?'Dated assortment review stored':'Live assortment review needed'},{label:'Shopper demand',ok:demandChecked,detail:demandChecked?p.demandEvidence.summary:'Current demand evidence needed'},{label:'Price evidence',ok:priceChecked,detail:priceChecked?'Recent recorded offer; verify pack and conditions':'Current price and pack check needed'},{label:'Cost & feasibility',ok:supplyChecked,detail:supplyChecked?'Dated feasibility review stored':'Supplier quote, claims and sample review needed'}];
  return {status,tone,reason,next,similar,gates,checked:gates.filter(g=>g.ok).length,ready:!!(validated&&reviewed.status==='potential-gap'&&demandChecked&&priceChecked&&supplyChecked)};
}
