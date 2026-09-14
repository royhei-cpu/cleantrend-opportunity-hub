import React from 'react';
import {rankTargetProducts} from './recommendations.js';

export function TargetRecommendations({catalog,selected,onOpen,onToggle,onResearch,imagePath}){
 const [limit,setLimit]=React.useState(12);
 const ranked=rankTargetProducts(catalog);
 const research=rankTargetProducts(catalog,{research:true});
 function row(entry,isResearch=false){const {product:p,decision:d,rank,tied}=entry;const chosen=selected.includes(p.id);return <li key={p.id} className="recommendation-row">
  <div className="recommendation-rank"><strong>{isResearch?'Check':'#'} {rank}</strong>{tied&&<small>Equal priority</small>}</div>
  <img src={imagePath(p.image)} alt={`${p.brand} ${p.name}`} loading="lazy"/>
  <div className="recommendation-main"><small>{p.category} · {p.retailer}</small><h3><button onClick={()=>onOpen(p)}>{p.brand} — {p.name}</button></h3><p><b>{isResearch?'Target status:':'Confirmed gap:'}</b> {d.reason}</p>{p.whyTest&&<p><b>Test idea:</b> {p.whyTest}</p>}<p className="recommendation-next"><b>Next:</b> {d.next}</p></div>
  <div className="recommendation-actions"><strong>{isResearch?'Target check needed':d.ready?'Propose a test':'Complete the test brief'}</strong><span>{d.checked}/4 evidence checks complete</span><small>{d.checked<4?'Still needed: ':''}{d.gates.filter(g=>!g.ok).map(g=>g.label==='Not carried by Target'?'Target absence check':g.label).join(' · ')||'Target absence, demand, price and feasibility supported.'}</small>{d.checkedAt&&<small>Target check: {d.checkedAt}</small>}<button onClick={()=>onOpen(p)}>Review evidence</button><button aria-label={`${chosen?'Remove':'Add'} ${p.name} ${chosen?'from':'to'} comparison`} disabled={!chosen&&selected.length>=6} onClick={()=>onToggle(p.id)}>{chosen?'Remove from comparison':'Add to comparison'}</button></div>
 </li>;}
 return <section className="target-recommendations" aria-label="Ranked Target recommendations">
  <p className="eyebrow">Merchant action list</p><h2>Target should try</h2><p className="recommendation-intro">Only confirmed Target gaps qualify. Priority reflects current demand, price and supplier readiness. Equal evidence shares a rank.</p>
  {ranked.length>0&&<div className="recommendation-totals"><span><b>{ranked.length}</b> confirmed missing items</span><span><b>{ranked.filter(r=>r.decision.ready).length}</b> ready to propose</span></div>}
  {ranked.length?<><ol className="recommendation-list" aria-label="Confirmed missing items ranked for Target">{ranked.slice(0,limit).map(entry=>row(entry))}</ol>{ranked.length>limit&&<button className="recommendation-more" onClick={()=>setLimit(limit+12)}>Show more ranked items</button>}</>:<div className="recommendation-empty"><h3>No confirmed missing items yet.</h3><p>Start with the ranked research queue below while Target checks are completed.</p></div>}
  <section className="recommendation-research" aria-label="Research candidates awaiting Target checks"><h3>Next products to investigate</h3><p>These are research candidates, not confirmed Target gaps. Rank reflects documented evidence; recent sources lead within ties.</p><ol className="recommendation-list">{research.slice(0,6).map(entry=>row(entry,true))}</ol><button className="recommendation-more" onClick={onResearch}>Browse all {research.length.toLocaleString()} products needing a Target check</button></section>
 </section>;
}
