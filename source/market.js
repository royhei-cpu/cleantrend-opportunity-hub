import evidence from './market-evidence.json' with { type: 'json' };
import {DAY} from './logic.js';

export const marketEvidence=evidence;

function currentDate(value,days,now){
 const time=Date.parse(value||'');
 return Number.isFinite(time)&&time<=now&&now-time<days*DAY;
}

export function marketSignalsFor(product,{now=Date.now(),days=7,qualifiedOnly=false}={}){
 return evidence.observations.filter(observation=>
  observation.productId===product.id&&
  (!qualifiedOnly||observation.qualifiesAsCurrentDemand===true)&&
  currentDate(observation.observedAt,days,now)&&
  currentDate(observation.periodEnd,days,now)
 );
}

export function hasCurrentMarketEvidence(product,options={}){
 return marketSignalsFor(product,{...options,qualifiedOnly:true}).length>0;
}

export function marketEvidenceLabel(product,options={}){
 const observation=marketSignalsFor(product,{...options,qualifiedOnly:true})[0];
 return observation?`${observation.displayValue} · ${observation.retailer} · observed ${observation.observedAt}`:'No qualifying current market observation';
}

// Rotate one product per category before returning a second product from any
// category. This is coverage rotation, not a cross-category demand ranking.
export function rotateMarketSupported(rows,{now=Date.now()}={}){
 const groups=new Map();
 for(const row of rows){
  if(!hasCurrentMarketEvidence(row.product,{now}))continue;
  const list=groups.get(row.product.category)||[];
  list.push(row);groups.set(row.product.category,list);
 }
 for(const list of groups.values())list.sort((a,b)=>a.product.name.localeCompare(b.product.name));
 const categories=[...groups.keys()].sort();
 const output=[];
 for(let depth=0;;depth++){
  let added=false;
  for(const category of categories){const row=groups.get(category)[depth];if(row){output.push(row);added=true;}}
  if(!added)break;
 }
 return output;
}
