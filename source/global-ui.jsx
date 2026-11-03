import React, { useEffect, useMemo, useRef, useState } from 'react';
import research from './global-research.json';
import products from './global-products.json';
import { coverageSummary, filterGlobalProducts, buildRetailListings, retailDirectory, unitEconomics, csvCell } from './global-logic.js';
import { atTarget } from './logic.js';

const sources = new Map(research.sources.map(source => [source.id, source]));
const external = { target: '_blank', rel: 'noreferrer' };
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportProducts(rows) {
  const fields = ['Record ID','Brand','Product','Retailer','Market','Category','Pack','Recorded price','Currency','Source scope','Source date','Evidence URL','Target status'];
  const data = rows.map(p => [p.id,p.brand,p.name,p.retailer,p.market,p.category,p.packLabel,p.priceLabel,p.referencePrice?.currency||'Not recorded',p.sourceScope,p.sourceDate||'Not recorded',p.link,atTarget(p.product||p)?'Target listing recorded':'Needs Target check']);
  download('homecare-atlas-global-benchmarks.csv', '\uFEFF' + [fields,...data].map(row=>row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
function exportBrief(brief) {
  const content = [brief.title,brief.status,`Research reviewed: ${research.updatedAt}`,`Shopper: ${brief.shopper}`,`Why investigate: ${brief.why}`,`Target baseline: ${brief.targetBaseline}`,'Product changes:',...brief.changes.map(change=>`- ${change}`),`Point of difference: ${brief.difference}`,`Proposed price (unvalidated): ${brief.proposedPrice}`,`Pilot: ${brief.pilot}`,`Proposed success gate: ${brief.successMetric}`,`Stop condition: ${brief.killCriterion}`,'Evidence:',...brief.evidenceIds.map(id=>{const s=sources.get(id);return `${s.title}: ${s.metric}. ${s.context} ${s.period}. Limit: ${s.limitation} ${s.url}`;}),'Required before launch: current Target absence/equivalent/Target Plus review, product-specific shopper demand, comparable current price, supplier quotation and sample feasibility review.'].join('\n\n');
  download(`homecare-atlas-${brief.id}-concept.txt`, content, 'text/plain;charset=utf-8');
}

function Evidence({ ids }) {
  return <div className="world-evidence">{ids.map(id=>{const s=sources.get(id);return <div key={id}><a href={s.url} {...external}>{s.title} ↗</a><p><b>{s.metric}</b> · {s.context}</p><small>{s.period}. {s.limitation}</small></div>;})}</div>;
}

function ConceptArt({ kind }) {
  const viewBox=kind==='compact'?'0 594 627 660':'627 594 627 660';
  return <figure className="calm-concept-art"><svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative product development concept"><image href="/cleantrend-opportunity-hub/assets/calm-still-life.jpg" width="1254" height="1254"/></svg><figcaption>Concept illustration</figcaption></figure>;
}

function OpportunityCard({ brief, selected, onToggle, full, index }) {
  return <article className="world-opportunity">
    {['compact','easy-grip'].includes(brief.id)?<ConceptArt kind={brief.id}/>:<div className="calm-concept-number" aria-hidden="true"><b>{String(index+1).padStart(2,'0')}</b><span>{brief.category}</span></div>}
    <div className="calm-opportunity-content">
    <div className="world-card-top"><span>{brief.category}</span><span className={brief.priority==='Investigate first'?'world-priority':'world-stage'}>{brief.priority}</span></div>
    <h3>{brief.title}</h3><p>{brief.shopper}</p>
    <div className="world-why"><b>Why this deserves a closer look</b><p>{brief.why}</p></div>
    <details open={full || undefined}><summary>Evidence, product changes & test plan</summary>
      <Evidence ids={brief.evidenceIds}/>
      <div className="world-baseline"><b>Target reality check</b><p>{brief.targetBaseline}</p><a href={`https://www.target.com/s?searchTerm=${encodeURIComponent(brief.category)}`} {...external}>Start Target assortment review ↗</a><small>A search link starts research; it does not verify absence.</small></div>
      <h4>What to change</h4><ol>{brief.changes.map(change=><li key={change}>{change}</li>)}</ol>
      <h4>Make it distinctive</h4><p>{brief.difference}</p>
      <dl className="world-pilot"><div><dt>Price hypothesis</dt><dd>{brief.proposedPrice}</dd></div><div><dt>How to test</dt><dd>{brief.pilot}</dd></div><div><dt>Proposed success gate</dt><dd>{brief.successMetric}</dd></div><div><dt>Stop if</dt><dd>{brief.killCriterion}</dd></div></dl>
      <p className="world-small">All prices, pilot sizes and success gates above are proposed planning assumptions. Supplier economics, performance and shopper demand are not yet validated.</p>
      <p className="world-small">Benchmark markets: {brief.benchmarkRetailers.join(' · ')}</p>
      <button className="world-link-button" onClick={()=>exportBrief(brief)}>Download this concept brief ↓</button>
    </details>
    <div className="world-card-footer"><span>Concept hypothesis · Target check needed</span><button aria-pressed={selected} onClick={()=>onToggle(brief.id)}>{selected?'Remove from comparison':'Compare concept +'}</button></div>
    </div>
  </article>;
}

function ConceptComparison({ selected, onRemove, onClear }) {
  if (!selected.length) return null;
  const rows = research.opportunities.filter(o=>selected.includes(o.id));
  return <section className="world-concept-comparison" aria-label="Concept comparison"><div className="world-section-title"><div><p className="eyebrow">Your development shortlist</p><h3>Compare the product changes.</h3></div><button onClick={onClear}>Clear concepts</button></div><div className="world-table-scroll"><table><caption>Concept hypotheses; no validated overall winner.</caption><thead><tr><th scope="col">Decision</th>{rows.map(b=><th scope="col" key={b.id}>{b.title}<button aria-label={`Remove ${b.title}`} onClick={()=>onRemove(b.id)}>Remove</button></th>)}</tr></thead><tbody>{[['Distinctive change','difference'],['Target baseline','targetBaseline'],['Proposed price','proposedPrice'],['Test','pilot'],['Proposed success gate','successMetric'],['Stop condition','killCriterion']].map(([label,key])=><tr key={key}><th scope="row">{label}</th>{rows.map(b=><td key={b.id}>{b[key]}</td>)}</tr>)}</tbody></table></div></section>;
}

function Economics() {
  const [a,setA]=useState('4'); const [aUses,setAUses]=useState('20');
  const [b,setB]=useState('6'); const [bUses,setBUses]=useState('40');
  const [srp,setSrp]=useState('9.99');const [margin,setMargin]=useState('45');const [other,setOther]=useState('1.20');
  const number=value=>value.trim()===''?NaN:Number(value);
  const unitA=unitEconomics(number(a),number(aUses)); const unitB=unitEconomics(number(b),number(bUses));
  const valid=unitA!==null && unitB!==null;const saving=valid&&unitA>0?(1-unitB/unitA)*100:null;
  const price=number(srp),gm=number(margin),charges=number(other);
  const validCost=Number.isFinite(price)&&price>0&&Number.isFinite(gm)&&gm>=0&&gm<100&&Number.isFinite(charges)&&charges>=0;
  const ceiling=validCost?price*(1-gm/100)-charges:null;
  const field=(label,value,set,min='0')=><label>{label}<input type="number" step="any" min={min} value={value} onChange={e=>set(e.target.value)}/></label>;
  return <div className="world-economics"><article><p className="eyebrow">Scenario calculator</p><h3>Does the refill save per use?</h3><p>Use one currency, the same cleaning task and the correct dilution. Defaults are hypothetical examples.</p><div className="world-calc-fields">{field('A · pack price',a,setA)}{field('A · usable doses',aUses,setAUses)}{field('B · pack price',b,setB)}{field('B · usable doses',bUses,setBUses)}</div><output aria-live="polite">{valid?<><b>{unitA.toFixed(3)} vs {unitB.toFixed(3)}</b><span>currency units per comparable use</span><strong>{saving===null?'A has no positive baseline cost':saving>=0?`B costs ${saving.toFixed(1)}% less per use`:`B costs ${Math.abs(saving).toFixed(1)}% more per use`}</strong></>:<span>Enter nonnegative prices and doses greater than zero.</span>}</output><small>Formula: pack price ÷ usable doses. Excludes shipping, tax, labor and the starter unless included in your input.</small></article>
  <article><p className="eyebrow">Feasibility planning</p><h3>Work back from a proposed shelf price.</h3><p>A simple scenario to frame a supplier discussion. This is not an approved Target margin or cost specification.</p><div className="world-calc-fields">{field('Proposed retail price',srp,setSrp)}{field('Assumed gross margin %',margin,setMargin)}{field('Other cost per unit',other,setOther)}</div><output aria-live="polite">{ceiling===null?<span>Enter a positive price, a margin from 0 to below 100, and nonnegative other costs.</span>:<><b>{ceiling.toFixed(2)}</b><span>maximum remaining product cost in your currency</span><strong>{ceiling<0?'Scenario is not feasible at these assumptions':'Obtain a real quote and confirm all cost definitions.'}</strong></>}</output><small>Formula: retail price × (1 − gross margin) − other cost. Excludes markdowns, returns, vendor terms and taxes unless modeled in your inputs.</small></article></div>;
}

function GlobalRetailers({ catalog, onOpen, onCompare, selected, imagePath }) {
  const [region,setRegion]=useState('All regions');const [country,setCountry]=useState('All countries');const [retailer,setRetailer]=useState('All retailers');const [query,setQuery]=useState('');const [limit,setLimit]=useState(18);
  const results=useRef(null);
  const rows=useMemo(()=>buildRetailListings(catalog),[catalog]);
  const regions=useMemo(()=>['Asia','Europe','North America','Oceania','Middle East','South America','Africa'].filter(r=>rows.some(p=>p.regions.includes(r))),[rows]);
  const countries=useMemo(()=>[...new Set(rows.flatMap(p=>p.countries))].sort(),[rows]);
  const regionRows=useMemo(()=>filterGlobalProducts(rows,{region,country}),[rows,region,country]);
  const directory=useMemo(()=>retailDirectory(regionRows),[regionRows]);
  const allRetailers=useMemo(()=>retailDirectory(rows),[rows]);
  const shown=useMemo(()=>filterGlobalProducts(rows,{region,country,retailer,query}),[rows,region,country,retailer,query]);
  const countryCounts=useMemo(()=>new Map(countries.map(c=>[c,rows.filter(p=>p.countries.includes(c)).length])),[rows,countries]);
  const path=imagePath||(value=>value.startsWith('/')?`/cleantrend-opportunity-hub${value}`:value);
  function revealResults(){results.current?.scrollIntoView({behavior:'smooth',block:'start'});results.current?.focus({preventScroll:true});}
  function chooseCountry(value){setCountry(value);setRetailer('All retailers');setQuery('');setLimit(18);if(value!=='All countries'&&!filterGlobalProducts(rows,{region,country:value}).length)setRegion('All regions');}
  function chooseRetailer(value){setRetailer(value);setLimit(18);revealResults();}
  function reset(){setRegion('All regions');setCountry('All countries');setRetailer('All retailers');setQuery('');setLimit(18);}
  useEffect(()=>{const value=new URLSearchParams(window.location.search).get('country');if(value&&countries.includes(value))chooseCountry(value);},[countries]);
  return <section aria-label="Global retailer discovery"><div className="world-section-title"><div><h3>Find products by country and retailer.</h3><p>All {catalog.length.toLocaleString()} catalog records are included here, across {countries.length} countries and {allRetailers.length} retailer labels.</p></div><button onClick={()=>exportProducts(shown)}>Export {shown.length.toLocaleString()} listings ↓</button></div>
    <div className="world-country-shortcuts" aria-label="Quick country choices"><button aria-pressed={country==='All countries'} onClick={()=>chooseCountry('All countries')}>All countries</button>{['China','Japan','South Korea'].filter(c=>countryCounts.has(c)).map(c=><button key={c} aria-label={`Browse ${c} listings`} aria-pressed={country===c} onClick={()=>chooseCountry(c)}>{c}<span>{countryCounts.get(c)}</span></button>)}</div>
    <div className="world-region-buttons" aria-label="Filter by world region">{['All regions',...regions].map(r=><button key={r} aria-pressed={region===r} onClick={()=>{setRegion(r);setCountry('All countries');setRetailer('All retailers');setLimit(18);}}>{r}</button>)}</div>
    <div className="world-discovery-filters world-all-listing-filters"><label>Search retailer listings<input aria-label="Search retailer listings" type="search" placeholder="Product, brand or keyword…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(18);}}/></label><label>Country / market<select aria-label="Country / market" value={country} onChange={e=>chooseCountry(e.target.value)}><option>All countries</option>{countries.map(c=><option key={c} value={c}>{c} ({countryCounts.get(c)})</option>)}</select></label><label>Retailer<select aria-label="Filter retailer listings" value={retailer} onChange={e=>{setRetailer(e.target.value);setLimit(18);}}><option>All retailers</option>{directory.map(r=><option key={r.name} value={r.name}>{r.name} ({r.count})</option>)}</select></label></div>
    <div className="world-listing-results" id="retailer-listing-results" ref={results} tabIndex={-1}>
      <div className="world-listing-result-heading"><h4>{country==='All countries'?'Product listings':`${country} product listings`}</h4><button onClick={reset}>Clear filters</button></div>
      <p role="status" className="world-result-count">{shown.length.toLocaleString()} matching listings · {retailer}{region!=='All regions'?` · ${region}`:''}</p>
      {shown.length===0?<div className="world-empty"><h4>No recorded listings match these filters.</h4><p>Clear the filters to browse the full recorded catalog.</p><button onClick={reset}>Reset global filters</button></div>:<div className="world-benchmark-grid">{shown.slice(0,limit).map(p=><article className="world-listing-card" key={p.listingKey} data-record-id={p.id}>
        <figure className="world-listing-photo"><img src={path(p.image||'/assets/photo-pending.svg')} alt={`${p.brand} ${p.name}`} loading="lazy" width="300" height="180" onError={event=>{if(event.currentTarget.dataset.fallback)return;event.currentTarget.dataset.fallback='true';event.currentTarget.src=path('/assets/photo-pending.svg');event.currentTarget.alt='Exact product photo unavailable';}}/></figure>
        <span>{p.market} · {p.retailer}</span><h4>{p.brand} — {p.name}</h4><p>{p.description}</p><b>{p.priceLabel}</b><small>{p.packLabel} · {p.sourceScope}<br/>{p.sourceDate?`${p.sourceDateKind} ${p.sourceDate}`:'Source date not recorded'}. Current price and stock need checking.</small><div>{/^https?:\/\//i.test(p.link)&&<a href={p.link} {...external}>Source listing ↗</a>}<button onClick={()=>onOpen(p.product)}>Review item</button><button disabled={!selected.includes(p.id)&&selected.length>=6} aria-pressed={selected.includes(p.id)} onClick={()=>onCompare(p.id)}>{selected.includes(p.id)?'Remove item':'Compare item +'}</button></div>
      </article>)}</div>}
      {shown.length>limit&&<button className="world-load-more" onClick={()=>setLimit(v=>v+18)}>Show more products ({Math.min(limit,shown.length)} of {shown.length.toLocaleString()} shown) ↓</button>}
    </div>
    <details className="world-retailer-directory"><summary>Browse {directory.length} retailers in this selection</summary><div className="world-retailer-directory-list">{directory.map(r=><button key={r.name} aria-label={`Show ${r.name} listings`} onClick={()=>chooseRetailer(r.name)} aria-pressed={retailer===r.name}><span><b>{r.name}</b><small>{r.markets.join(' · ')}</small></span><strong>{r.count} listings <span aria-hidden="true">↗</span></strong></button>)}</div></details>
    <p className="world-small">Each listing is a recorded retailer offer, so the same product can appear at more than one retailer. Coverage remains partial. Dates and prices retain their original evidence; this repair does not establish current stock, a fresh source check or a verified Target gap.</p>
  </section>;
}

export function GlobalOpportunityHub({ catalog, onOpen, onCompare, selected, view, setView, onBrowseCatalog, imagePath }) {
  const [category,setCategory]=useState('All opportunities');const [concepts,setConcepts]=useState([]);const [message,setMessage]=useState('');const [full,setFull]=useState(false);const [briefLimit,setBriefLimit]=useState(6);
  const summary=useMemo(()=>coverageSummary(catalog),[catalog]);
  const categories=[...new Set(research.opportunities.map(o=>o.category))];
  const briefs=research.opportunities.filter(o=>category==='All opportunities'||o.category===category);
  function toggle(id){if(concepts.includes(id)){setConcepts(ids=>ids.filter(v=>v!==id));setMessage('');}else if(concepts.length<3){setConcepts(ids=>[...ids,id]);setMessage('');}else setMessage('Compare up to three concepts. Remove one to add another.');}
  function tabKey(event){const ids=['opportunities','retailers','evidence'];const current=ids.indexOf(view);const next=event.key==='ArrowRight'?(current+1)%3:event.key==='ArrowLeft'?(current+2)%3:event.key==='Home'?0:event.key==='End'?2:null;if(next===null)return;event.preventDefault();setView(ids[next]);event.currentTarget.parentElement.querySelector(`#world-tab-${ids[next]}`)?.focus();}
  return <section className="world-hub" id="global-intelligence" aria-label="Global opportunity workspace">
    <div className="world-hero"><div className="calm-hero-copy"><h1>Global homecare.<br/>Thoughtful opportunities for Target.</h1><p>Explore global products for everyday care at home—and turn well-supported ideas into distinctive opportunities for Target.</p><div className="world-hero-actions"><a href="#world-workspace" onClick={()=>setView('opportunities')}>Explore 12 opportunity briefs <span aria-hidden="true">↗</span></a><button onClick={onBrowseCatalog}>Browse all products <span aria-hidden="true">↓</span></button></div></div><figure className="calm-hero-art"><img src="/cleantrend-opportunity-hub/assets/homecare-living.jpg" alt="Illustrative homecare still life with laundry linens, towels and an organized household caddy" fetchPriority="high"/><figcaption>Homecare, considered as a whole. Illustrative lifestyle image.</figcaption></figure></div>
    <div className="world-stats"><div><b>{summary.records.toLocaleString()}</b><span>catalog listing records</span></div><div><b>{summary.countries}</b><span>countries represented*</span></div><div><b>{summary.retailers}</b><span>retailer labels*</span></div><div><b>{products.length}</b><span>new global benchmarks</span></div><div><b>{research.opportunities.length}</b><span>development hypotheses</span></div></div>
    <p className="world-small calm-scope">Current catalog focus: cleaning, laundry and household tools. Broader homecare coverage is developing. Counts come from recorded offers and do not represent complete current assortments.</p>
    <div className="world-boundary"><strong>A promising concept still needs proof.</strong><p>These 12 briefs are product-development hypotheses. They do not count as verified Target whitespace. Current Target absence, product-specific demand, comparable price and supplier feasibility must be checked before a launch recommendation.</p></div>
    <div id="world-workspace" className="world-workspace"><div className="world-tabs" role="tablist" aria-label="Global intelligence sections">{[['opportunities','Opportunity briefs'],['retailers','Global retailers & items'],['evidence','Data & economics']].map(([id,label])=><button key={id} id={`world-tab-${id}`} role="tab" tabIndex={view===id?0:-1} aria-selected={view===id} aria-controls="world-panel" onKeyDown={tabKey} onClick={()=>setView(id)}>{label}</button>)}</div>
      <div role="tabpanel" id="world-panel" aria-labelledby={`world-tab-${view}`}>
      {view==='opportunities'&&<><div className="world-section-title"><div><h2>What should we change—and why?</h2><p>Each concept connects a shopper need with evidence, product changes and a test plan.</p></div><label>Focus area<select value={category} onChange={e=>{setCategory(e.target.value);setBriefLimit(6);}}><option>All opportunities</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div><div className="world-toolbar"><button aria-pressed={full} onClick={()=>setFull(v=>!v)}>{full?'Collapse all briefs':'Expand all evidence & test plans'}</button><span>{Math.min(briefLimit,briefs.length)} of {briefs.length} concepts · {concepts.length}/3 in comparison</span></div><p role="status">{message}</p><ConceptComparison selected={concepts} onRemove={toggle} onClear={()=>{setConcepts([]);setMessage('');}}/><div className="world-opportunity-grid">{briefs.slice(0,briefLimit).map((brief,index)=><OpportunityCard key={`${brief.id}-${full}`} brief={brief} full={full} index={index} selected={concepts.includes(brief.id)} onToggle={toggle}/>)}</div>{briefs.length>briefLimit&&<button className="world-load-more" onClick={()=>setBriefLimit(briefs.length)}>Show {briefs.length-briefLimit} more opportunities ↓</button>}<p className="world-small">Investigation order is editorial judgment, not a validated commercial ranking.</p></>}
      {view==='retailers'&&<GlobalRetailers catalog={catalog} onOpen={onOpen} onCompare={onCompare} selected={selected} imagePath={imagePath}/>}
      {view==='evidence'&&<><div className="world-section-title"><div><p className="eyebrow">Evidence you can inspect</p><h2>Data first. Assumptions visible.</h2><p>Macro statistics establish context. They do not establish product demand, Target absence, or a sales forecast.</p></div></div><div className="world-source-grid">{research.sources.map(s=><article key={s.id}><b>{s.metric}</b><h3><a href={s.url} {...external}>{s.title} ↗</a></h3><p>{s.context}</p><small>{s.period}</small><p className="world-source-limit">Limit: {s.limitation}</p></article>)}</div><Economics/><section className="world-roadmap"><h3>Where coverage needs to go next</h3><p>No retailer has been fully reconciled in this expansion. Prioritize unknown markets and the oldest evidence before adding more undated records.</p><div>{research.coverageQueue.map(r=><article key={r.region}><b>{r.region}</b><p>{r.next}</p></article>)}</div></section></>}
      </div>
    </div>
  </section>;
}
