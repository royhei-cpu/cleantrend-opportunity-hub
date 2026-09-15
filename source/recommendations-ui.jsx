import React from 'react';
import {rankTargetProducts} from './recommendations.js';
import {marketEvidenceLabel,marketSignalsFor} from './market.js';

export function TargetRecommendations({catalog,selected,onOpen,onToggle,onResearch,imagePath}){
 const [limit,setLimit]=React.useState(12);
 const [category,setCategory]=React.useState('All categories');
 const ranked=rankTargetProducts(catalog);
 const research=rankTargetProducts(catalog,{research:true});
 const categories=[...new Set(research.map(entry=>entry.product.category))].sort();
 const shownResearch=category==='All categories'?research:research.filter(entry=>entry.product.category===category);
 const unranked=catalog.filter(p=>!ranked.some(row=>row.product.id===p.id)&&!research.some(row=>row.product.id===p.id));
 function row(entry,isResearch=false){const {product:p,decision:d,rank,tied}=entry;const chosen=selected.includes(p.id);const marketSignal=isResearch?marketSignalsFor(p,{qualifiedOnly:true})[0]:null;return <li key={p.id} className="recommendation-row">
  <div className="recommendation-rank"><strong>{isResearch?'Market':`# ${rank}`}</strong>{!isResearch&&tied&&<small>Equal priority</small>}</div>
  <img src={imagePath(p.image)} alt={`${p.brand} ${p.name}`} loading="lazy"/>
  <div className="recommendation-main"><small>{p.category} · {p.retailer}</small><h3><button onClick={()=>onOpen(p)}>{p.brand} — {p.name}</button></h3><p><b>{isResearch?'Target status:':'Confirmed gap:'}</b> {d.reason}</p>{p.whyTest&&<p><b>Test idea:</b> {p.whyTest}</p>}<p className="recommendation-next"><b>Next:</b> {d.next}</p></div>
  <div className="recommendation-actions"><strong>{isResearch?d.status:d.ready?'Propose a test':'Complete the test brief'}</strong>{isResearch&&<small>{marketEvidenceLabel(p)}</small>}{marketSignal&&<a href={marketSignal.sourceUrl} target="_blank" rel="noreferrer">Demand evidence ↗</a>}<span>{d.checked}/4 evidence checks complete</span><small>{d.checked<4?'Still needed: ':''}{d.gates.filter(g=>!g.ok).map(g=>g.label==='Not carried by Target'?'Target absence check':g.label).join(' · ')||'Target absence, demand, price and feasibility supported.'}</small>{d.checkedAt&&<small>Target check: {d.checkedAt}</small>}<button onClick={()=>onOpen(p)}>Review evidence</button><button aria-label={`${chosen?'Remove':'Add'} ${p.name} ${chosen?'from':'to'} comparison`} disabled={!chosen&&selected.length>=6} onClick={()=>onToggle(p.id)}>{chosen?'Remove from comparison':'Add to comparison'}</button></div>
 </li>;}
 return <section className="target-recommendations" aria-label="Ranked Target recommendations">
  <p className="eyebrow">Merchant action list</p><h2>Target should try</h2><p className="recommendation-intro">Only confirmed Target gaps qualify. Priority reflects current demand, price and supplier readiness. Equal evidence shares a rank.</p>
  {ranked.length>0&&<div className="recommendation-totals"><span><b>{ranked.length}</b> confirmed missing items</span><span><b>{ranked.filter(r=>r.decision.ready).length}</b> ready to propose</span></div>}
  {ranked.length?<><ol className="recommendation-list" aria-label="Confirmed missing items ranked for Target">{ranked.slice(0,limit).map(entry=>row(entry))}</ol>{ranked.length>limit&&<button className="recommendation-more" onClick={()=>setLimit(limit+12)}>Show more ranked items</button>}</>:<div className="recommendation-empty"><h3>No confirmed missing items yet.</h3><p>Use the market-supported investigations below while complete Target checks continue. Do not promote a gap to fill the list.</p></div>}
  <section className="recommendation-research" aria-label="Market-supported investigations"><h3>Market-supported investigations</h3><p>Current, dated retailer metrics support investigation. Categories rotate for coverage; unlike metrics, retailers and time windows are not ranked against one another. A purchase band is not audited sales or proof of growth.</p>{categories.length>1&&<label>Category <select value={category} onChange={event=>setCategory(event.target.value)}><option>All categories</option>{categories.map(value=><option key={value}>{value}</option>)}</select></label>}<ul className="recommendation-list">{shownResearch.slice(0,6).map(entry=>row(entry,true))}</ul>{!shownResearch.length&&<p>No qualifying current market observation in this category.</p>}</section>
  <section className="recommendation-research" aria-label="Unranked coverage"><h3>Unranked coverage</h3><p>{unranked.length.toLocaleString()} catalog records do not have a qualifying current market observation. They remain searchable coverage, not Target gaps or ranked recommendations.</p><button className="recommendation-more" onClick={onResearch}>Browse products needing a Target check</button></section>
 </section>;
}
