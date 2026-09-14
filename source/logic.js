export const DAY = 86400000;
export function recent(date, days = 7, now = Date.now()) {
  const time = Date.parse(date || '');
  return Number.isFinite(time) && time <= now && now - time < days * DAY;
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
function targetUrl(url) { try { const u=new URL(url); return u.protocol==='https:' && (u.hostname==='target.com'||u.hostname.endsWith('.target.com')); } catch { return false; } }
function targetOffer(o) { return /^target(?:\s*plus|\s*\+)?$/i.test(o.retailer||'') || o.channel==='Target' || targetUrl(o.link); }
export function atTarget(p) { return targetOffer(p) || offers(p).some(targetOffer); }
const formats = ['refill','tablet','powder','spray','paste','foam','concentrate','liquid','wipe','cloth','sponge','brush','mop','vacuum','scrubber','bag','glove','squeegee','duster'];
export function productFormats(p) { const s=(p.name+' '+(p.tags||[]).join(' ')).toLowerCase(); return formats.filter(f=>new RegExp('\\b'+f+'(?:s|es)?\\b').test(s)); }
export function hasCurrentTargetReview(r,now=Date.now()) {
  return !!(r && typeof r.reviewedBy==='string' && r.reviewedBy.trim() && typeof r.reason==='string' && r.reason.trim() && Array.isArray(r.sourceUrls) && r.sourceUrls.some(targetUrl) && recent(r.checkedAt,1,now) && r.scope==='target-us' && r.exactProductChecked===true && r.equivalentsChecked===true && r.targetPlusChecked===true);
}
const assessmentCache = new WeakMap();
export function assess(p,catalog,now=Date.now()){
 let cache=assessmentCache.get(catalog);if(!cache){cache=new WeakMap();assessmentCache.set(catalog,cache)}
 const minute=Math.floor(now/60000), hit=cache.get(p);
 if(hit?.minute===minute && now>=hit.now && now<hit.expires)return hit.value;
 const value=computeAssessment(p,catalog,now);
 const targetExpiry=Date.parse(p.targetAssessment?.checkedAt||'')+DAY;
 const expiries=[targetExpiry,Date.parse(p.demandEvidence?.checkedAt||'')+7*DAY,Date.parse(p.feasibility?.checkedAt||'')+90*DAY,...offers(p).map(o=>Date.parse(o.evidence?.checkedAt||'')+7*DAY)].filter(t=>Number.isFinite(t)&&t>now);
 cache.set(p,{minute,now,expires:Math.min(...expiries),value});return value;
}
function computeAssessment(p, catalog, now) {
  const own=atTarget(p), f=productFormats(p);
  const peers=catalog.filter(q=>q.id!==p.id && q.category===p.category && atTarget(q));
  const similar=peers.map(q=>({p:q,n:productFormats(q).filter(x=>f.includes(x)).length})).filter(q=>q.n>0).sort((a,b)=>b.n-a.n||a.p.id.localeCompare(b.p.id)).slice(0,2).map(q=>q.p);
  const reviewed=p.targetAssessment;
  const currentReview=hasCurrentTargetReview(reviewed,now);
  const confirmedAbsent=currentReview && reviewed.status==='not-carried' && reviewed.currentlyCarried===false && reviewed.equivalentCurrentlyCarried===false && reviewed.temporarilyOutOfStock===false;
  // A missing catalog match never establishes absence. A prior Target listing
  // needs an explicit, newer delisting review; current Target offers still veto it.
  const freshTargetOffer=[p,...offers(p)].filter(targetOffer).some(o=>recent(o.evidence?.checkedAt,1,now));
  const lastTargetObservation=Math.max(0,...[p,...offers(p)].filter(targetOffer).map(o=>Date.parse(o.evidence?.checkedAt||'')||0));
  const resolvedOldListing=confirmedAbsent && reviewed.previousListingResolved===true && Date.parse(reviewed.checkedAt)>lastTargetObservation && !freshTargetOffer;
  const isWhitespace=!!(confirmedAbsent && (!own||resolvedOldListing));
  let status='Needs Target check',tone='unknown',reason='',next='';
  if(isWhitespace) {status='Verified Target whitespace';tone='whitespace';reason=reviewed.reason;next=reviewed.nextStep||'Target absence has been checked. Validate current shopper demand, comparable price and supplier feasibility before proposing a test.';}
  else if(own || (currentReview && (reviewed.currentlyCarried===true || reviewed.equivalentCurrentlyCarried===true || reviewed.temporarilyOutOfStock===true))) {status='Target listing recorded';tone='benchmark';reason='Excluded from whitespace: this product or a confirmed equivalent is recorded at Target. A temporarily sold-out item still belongs to its assortment.';next='Use it as a benchmark. Recheck the current Target listing, seller, price and pack; do not present it as new whitespace.';}
  else {reason='Not counted as whitespace. We have not verified that Target currently does not carry this product or an equivalent.';next=`Check current Target US assortment for ${p.brand} ${p.name}, including other names, equivalent products and Target Plus listings. Record the sources, scope and check time.`;if(reviewed?.status==='not-carried'&&!currentReview){reason='Not counted as whitespace. The earlier Target absence check is expired or incomplete and must be repeated.';}}
  const demandChecked=!!p.demandEvidence?.sourceUrl && !!p.demandEvidence?.summary && recent(p.demandEvidence?.checkedAt,7,now);
  const priceChecked=offers(p).some(o=>o.priceUsd>0 && o.link && recent(o.evidence?.checkedAt,7,now));
  const supplyChecked=!!p.feasibility?.reviewedBy && !!p.feasibility?.sourceUrl && p.feasibility?.approved===true && recent(p.feasibility?.checkedAt,90,now);
  const gates=[{label:'Not carried by Target',ok:isWhitespace,detail:isWhitespace?`Absence verified ${reviewed.checkedAt}`:tone==='benchmark'?'Target listing recorded — excluded from whitespace':'Current Target absence check needed'},{label:'Shopper demand',ok:demandChecked,detail:demandChecked?p.demandEvidence.summary:'Current demand evidence needed'},{label:'Price evidence',ok:priceChecked,detail:priceChecked?'Recent recorded offer; verify pack and conditions':'Current price and pack check needed'},{label:'Cost & feasibility',ok:supplyChecked,detail:supplyChecked?'Dated feasibility review stored':'Supplier quote, claims and sample review needed'}];
  return {status,tone,reason,next,similar,gates,isWhitespace,checked:gates.filter(g=>g.ok).length,ready:!!(isWhitespace&&demandChecked&&priceChecked&&supplyChecked),checkedAt:currentReview?reviewed.checkedAt:null,sourceUrls:currentReview?reviewed.sourceUrls:[]};
}
