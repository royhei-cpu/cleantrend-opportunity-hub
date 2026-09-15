import {assess} from './logic.js';
import {hasCurrentMarketEvidence,rotateMarketSupported} from './market.js';

export function rankTargetProducts(products,{research=false,now=Date.now()}={}){
 const rows=products.map(product=>{
  const decision=assess(product,products,now);
  const marketSupported=hasCurrentMarketEvidence(product,{now});
  const priority=[Number(decision.ready),Number(marketSupported),Number(decision.gates[1].ok),decision.checked];
  return {product,decision,marketSupported,priority};
 }).filter(row=>research?!row.decision.isWhitespace&&row.marketSupported:row.decision.isWhitespace);
 if(research)return rotateMarketSupported(rows,{now});
 rows.sort((a,b)=>{for(let i=0;i<a.priority.length;i++){const difference=b.priority[i]-a.priority[i];if(difference)return difference;}return a.product.name.localeCompare(b.product.name);});
 const groupSizes=new Map();for(const row of rows){const key=row.priority.join('|');groupSizes.set(key,(groupSizes.get(key)||0)+1);}
 let previousKey='',rank=0;
 return rows.map((row,index)=>{const key=row.priority.join('|');if(key!==previousKey){rank=index+1;previousKey=key;}return {...row,rank,tied:groupSizes.get(key)>1};});
}
