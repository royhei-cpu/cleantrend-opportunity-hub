import {assess,isFreshViral,offers} from './logic.js';

export function rankTargetProducts(products,{research=false,now=Date.now()}={}){
 const rows=products.map(product=>{
  const decision=assess(product,products,now);
  const sourceDate=Math.max(0,...offers(product).map(o=>Date.parse(o.evidence?.checkedAt||'')).filter(t=>Number.isFinite(t)&&t<=now));
  const priority=[Number(decision.ready),Number(decision.gates[1].ok),decision.checked,Number(isFreshViral(product,now))];
  return {product,decision,sourceDate,priority};
 }).filter(row=>research?row.decision.tone==='unknown':row.decision.isWhitespace);
 rows.sort((a,b)=>{for(let i=0;i<a.priority.length;i++){const difference=b.priority[i]-a.priority[i];if(difference)return difference;}return b.sourceDate-a.sourceDate||a.product.name.localeCompare(b.product.name);});
 const groupSizes=new Map();for(const row of rows){const key=row.priority.join('|');groupSizes.set(key,(groupSizes.get(key)||0)+1);}
 let previousKey='',rank=0;
 return rows.map((row,index)=>{const key=row.priority.join('|');if(key!==previousKey){rank=index+1;previousKey=key;}return {...row,rank,tied:groupSizes.get(key)>1};});
}
