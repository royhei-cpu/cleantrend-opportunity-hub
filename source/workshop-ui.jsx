import React,{useEffect,useRef,useState} from 'react';
import {workshopLibrary as library,defaultScenario,costScenario,money,benchmarkPrice,envelopeText,bomCSV,configuredBriefHTML} from './workshop-logic.js';

const base='/cleantrend-opportunity-hub/assets/workshop/';
const publicBase='https://royhei-cpu.github.io'+base;
const external={target:'_blank',rel:'noreferrer'};
const tabs=[['compare','Compare & improve'],['specs','Specifications'],['cost','BOM & pricing'],['validation','Validation']];
function save(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function ModelPreview({proposal,color,onEnableColor}){
 const [enabled,setEnabled]=useState(false),[view,setView]=useState('perspective'),[status,setStatus]=useState('poster');
 const host=useRef(null),viewer=useRef(null),settings=useRef({color,view});settings.current={color,view};
 useEffect(()=>{
  if(!enabled||!host.current)return;
  const controller=new AbortController();setStatus('loading');
  import('./workshop-viewer.js').then(module=>module.createWorkshopViewer(host.current,base+proposal.id+'.glb',{color:settings.current.color.hex,view:settings.current.view,signal:controller.signal})).then(value=>{if(controller.signal.aborted){value.dispose();return;}viewer.current=value;value.setColor(settings.current.color.hex);value.setView(settings.current.view);setStatus('ready');}).catch(()=>{if(!controller.signal.aborted)setStatus('unavailable');});
  return()=>{controller.abort();viewer.current?.dispose();viewer.current=null;};
 },[enabled,proposal.id]);
 useEffect(()=>{viewer.current?.setColor(color.hex);if(color.id!=='sage'&&!enabled){setEnabled(true);onEnableColor?.();}},[color,enabled,onEnableColor]);
 useEffect(()=>{viewer.current?.setView(view);},[view]);
 function choose(value){setView(value);if(value==='exploded')setEnabled(true);}
 const ready=status==='ready';
 return <figure className="wl-preview">
  <div className="wl-preview-toolbar" aria-label="Concept render views">{[['perspective','Perspective'],['front','Front'],['exploded','Exploded']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>choose(id)}>{label}</button>)}</div>
  <div className="wl-model-stage">
   {!ready&&<img src={`${base}${proposal.id}${view==='front'?'-front':''}.jpg`} alt={`${proposal.name}, Sage exterior design study rendered in Blender`} width="1200" height="900"/>}
   <div className={`wl-webgl${ready?' is-ready':''}`} ref={host} aria-hidden={!ready}/>
   {!enabled&&<button className="wl-enable-3d" onClick={()=>setEnabled(true)}>Rotate in 3D</button>}
   {status==='loading'&&<p className="wl-preview-status" role="status">Loading the editable 3D concept…</p>}
   {status==='unavailable'&&<p className="wl-preview-status" role="status">Interactive 3D is unavailable here. The Sage Blender render and model downloads remain available.</p>}
  </div>
  <figcaption>{ready?`${color.name} · drag to orbit; pinch or scroll to zoom.`:'Sage studio render · Blender 5.2.'} {view==='exploded'&&'Parts separated for design review; not an assembly instruction.'} Exterior concept; internal engineering unresolved.</figcaption>
 </figure>;
}

function Benchmarks({proposal,catalog,onOpen,onCompare,selected}){
 const rows=proposal.benchmarks.map(id=>library.benchmarks.find(b=>b.id===id));
 return <section className="wl-benchmarks" aria-label="Recommended national-brand benchmarks"><h3>National brands to benchmark</h3><p>Recommended for prototype comparison. Source facts and displayed prices are reference observations; they do not establish Target absence or superior performance.</p><div className="wl-benchmark-pair">{rows.map(b=>{
  const item=b.catalogId&&catalog.find(p=>p.id===b.catalogId);
  return <article key={b.id}><div className="wl-benchmark-heading"><span>{b.brand}</span><strong>{benchmarkPrice(b)}</strong></div><h4>{b.name}</h4><p>{b.facts.join(' ')}</p><small>{b.dimensions}<br/>{b.market} · reviewed {b.reviewedAt}. {b.access}. {b.priceNote}</small><div><a href={b.url} {...external}>Manufacturer source ↗</a>{item&&<><button onClick={()=>onOpen(item)}>Review catalog record</button><button disabled={!selected.includes(item.id)&&selected.length>=6} aria-pressed={selected.includes(item.id)} onClick={()=>onCompare(item.id)}>{selected.includes(item.id)?'Remove benchmark':'Compare catalog item +'}</button></>}</div></article>;
 })}</div></section>;
}

function Specifications({proposal,unit,setUnit}){
 return <section aria-label="Proposed technical specifications"><div className="wl-section-heading"><div><h3>Dimensioned design intent.</h3><p>Revision A0 · dimensions and materials are proposed engineering targets.</p></div><label>Envelope units<select aria-label="Envelope units" value={unit} onChange={e=>setUnit(e.target.value)}><option value="mm">Millimetres</option><option value="in">Inches</option></select></label></div>
  <p className="wl-envelope"><b>{envelopeText(proposal.envelope,unit)}</b><span>Primary assembled envelope · width × depth × height</span></p>
  <div className="wl-spec-layout"><div><table className="wl-table"><caption>Proposed dimensions and functional targets; metric source values retained.</caption><tbody>{proposal.specs.map(s=><tr key={s.label}><th scope="row">{s.label}</th><td>{s.value}</td></tr>)}<tr><th scope="row">Target kit mass, including any fill</th><td>{proposal.mass} g · weigh prototypes to verify</td></tr><tr><th scope="row">Nominal molded wall / tolerance</th><td>2.2 ± 0.3 mm screening target; part-specific drawing and shrinkage review required</td></tr><tr><th scope="row">Packaging proposal</th><td>{envelopeText(proposal.package.dimensionsMm,unit)} · disassembled where applicable; carton fit unverified</td></tr></tbody></table><p>{proposal.package.type}</p><p>{proposal.materialNote}</p><p className="wl-task-note">{proposal.special}</p></div><a className="wl-dimension-link" href={`${base}${proposal.id}-dimensions.svg`} {...external}><img src={`${base}${proposal.id}-dimensions.svg`} alt={`Front dimension reference for ${proposal.name}`} loading="lazy" width="1400" height="1120"/><span>Open dimension reference ↗</span></a></div>
 </section>;
}

function Pricing({proposal,scenario,setScenario,color,result}){
 const update=(key,value)=>setScenario(s=>({...s,[key]:value}));
 const field=(label,key,step='any',max)=><label key={key}>{label}<input aria-label={label} type="number" min="0" max={max} step={step} value={scenario[key]} onChange={e=>update(key,e.target.value)}/></label>;
 return <section aria-label="BOM and pricing scenario"><div className="wl-section-heading"><div><h3>Build a costed proposal.</h3><p>USD per finished kit · engineering allowances · no supplier quotations obtained.</p></div><button className="wl-secondary" onClick={()=>save(`${proposal.code}-BOM-${color.id}.csv`,bomCSV(proposal,scenario,color),'text/csv;charset=utf-8')}>Download configured BOM ↓</button></div>
 <div className="wl-table-scroll"><table className="wl-table wl-bom"><caption>Change scenario unit costs as quotations arrive. Allowance ranges below are internal planning estimates, not observed market prices.</caption><thead><tr><th>Part / component</th><th>Material / process</th><th>Qty / mass each</th><th>Unit allowance</th><th>Scenario unit USD</th><th>Extended USD</th></tr></thead><tbody>{proposal.parts.map((p,i)=><tr key={p.code}><th scope="row"><small>{p.code}</small>{p.name}</th><td>{p.material}<small>{p.process}</small></td><td>{p.qty} × {p.massG} g</td><td>{money(p.unitLow)}–{money(p.unitHigh)}</td><td><input aria-label={`${p.code} unit cost USD`} type="number" min="0" step=".001" value={scenario.partCosts[p.code]} onChange={e=>setScenario(s=>({...s,partCosts:{...s.partCosts,[p.code]:e.target.value}}))}/></td><td>{result.valid?money(p.qty*result.unitCosts[i]):'—'}</td></tr>)}</tbody></table></div>
 <details className="wl-cost-assumptions" open><summary>Pricing assumptions</summary><div className="wl-cost-fields">{field('Proposed retail USD','retail')}{field('Amortization volume, kits','volume','1')}{field('Tooling allowance USD','tooling')}{field('Assembly USD / kit','assembly')}{field('Packaging USD / kit','packaging')}{field('QA USD / kit','qa')}{field('Scrap allowance %','scrap','any','100')}{field('Assumed supplier gross margin %','supplierMargin','any','99.9')}{field('Assumed retail gross margin %','retailMargin','any','99.9')}{field('Freight allowance USD / kit','freight')}{field('Duty rate % — enter after origin review','duty','any','100')}</div><p>Proposed MOQ: {proposal.moq.toLocaleString()} kits; amortization volume is the number of kits across which tooling is allocated. {color.name} color allowance: {money(color.delta)} per kit. Origin and duty are unresolved; a blank duty field leaves landed cost uncalculated. Margin inputs are planning assumptions and are not Target requirements.</p></details>
 {!result.valid?<p role="alert" className="wl-task-note">{result.error}</p>:<><div className="wl-cost-results" aria-live="polite"><div><span>Component subtotal</span><b>{money(result.components)}</b></div><div><span>Factory cost estimate</span><b>{money(result.factory)}</b></div><div><span>Proposed FOB quote basis</span><b>{money(result.fob)}</b></div><div><span>Estimated landed cost</span><b>{result.landed===null?'Enter duty rate':money(result.landed)}</b></div><div><span>Retail cost ceiling</span><b>{money(result.ceiling)}</b></div><div><span>Headroom to cost ceiling</span><b>{result.headroom===null?'Not calculated':money(result.headroom)}</b></div></div>{result.dutyError&&<p role="alert">{result.dutyError}</p>}{result.belowMoq&&<p className="wl-task-note">This volume is below the proposed MOQ. A supplier must confirm whether the order is feasible.</p>}{result.headroom!==null&&result.headroom<0&&<p className="wl-task-note">This scenario exceeds the retail cost ceiling. Revisit specifications, costs or proposed retail; no feasibility approval is implied.</p>}</>}
 <details className="wl-formulas"><summary>See cost formulas and exclusions</summary><p>Factory cost = components × (1 + scrap allowance) + assembly + packaging + QA + color allowance + tooling ÷ amortization volume. Proposed FOB = factory cost ÷ (1 − assumed supplier gross margin). Landed = FOB + freight + FOB × entered duty rate. Cost ceiling = proposed retail × (1 − assumed retail gross margin).</p><p>Excludes destination handling, insurance, warehousing, returns, promotions and taxes unless included in the entered costs. Formulation, tooling, origin, classification, duties and freight remain unquoted.</p></details>
 </section>;
}

function WorkshopDetail({proposal,catalog,onOpen,onCompare,selected}){
 const [tab,setTab]=useState('compare'),[colorId,setColorId]=useState('sage'),[unit,setUnit]=useState('mm'),[scenario,setScenario]=useState(()=>defaultScenario(proposal));
 const color=library.palette.find(c=>c.id===colorId),result=costScenario(proposal,scenario,color);
 function tabKey(e){const index=tabs.findIndex(([id])=>id===tab),next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next===null)return;e.preventDefault();setTab(tabs[next][0]);e.currentTarget.parentElement.querySelector(`#wl-tab-${tabs[next][0]}`)?.focus();}
 return <div className="wl-detail" data-concept={proposal.id}>
  <div className="wl-product-layout"><ModelPreview proposal={proposal} color={color}/><div className="wl-product-summary"><p className="eyebrow">{proposal.code} · Revision A0 · {proposal.category}</p><h3>{proposal.title}</h3><div className="wl-measurements"><div><b>{proposal.envelope[0]} mm</b><span>primary width</span></div><div><b>{proposal.envelope[2]} mm</b><span>primary height</span></div><div><b>{proposal.mass} g</b><span>target kit mass</span></div></div><p>{proposal.recommendation}</p><fieldset className="wl-colors"><legend>Color & finish</legend><div>{library.palette.map(c=><button key={c.id} aria-label={`Choose ${c.name} finish`} aria-pressed={c.id===colorId} onClick={()=>setColorId(c.id)}><span style={{backgroundColor:c.hex}}>{c.id===colorId?'✓':''}</span>{c.name}</button>)}</div><small>{color.name} · {color.hex} · matte molded body, contrasting grip, satin metal where used. Screen reference; physical samples need approval.</small></fieldset><a className="wl-primary" href={`${base}${proposal.id}-development-pack.zip`} download>Download development pack ↓</a><p className="wl-download-caption">Base Sage A0 pack: editable .blend, GLB, studio renders, dimension reference, specifications and BOM. All four color references included. Save a configured brief/BOM to retain edits before changing concepts.</p><div className="wl-file-links"><a href={`${base}${proposal.id}.blend`} download>Blender scene</a><a href={`${base}${proposal.id}.glb`} download>3D model</a><button onClick={()=>save(`${proposal.code}-${color.id}-configured-brief.html`,configuredBriefHTML(proposal,scenario,color,publicBase),'text/html;charset=utf-8')}>Save configured brief ↓</button></div></div></div>
  <Benchmarks proposal={proposal} catalog={catalog} onOpen={onOpen} onCompare={onCompare} selected={selected}/>
  <div className="wl-tabs" role="tablist" aria-label="White Label Workshop details">{tabs.map(([id,label])=><button key={id} role="tab" id={`wl-tab-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1} aria-controls="wl-detail-panel" onClick={()=>setTab(id)} onKeyDown={tabKey}>{label}</button>)}</div>
  <div role="tabpanel" id="wl-detail-panel" aria-labelledby={`wl-tab-${tab}`}>
   {tab==='compare'&&<section aria-label="Benchmark reality and proposed improvements"><div className="wl-section-heading"><div><h3>Be specific about what changes.</h3><p>Benchmark facts are separated from design proposals and the tests required to support them.</p></div></div><div className="wl-table-scroll"><table className="wl-table wl-comparison"><thead><tr><th>Decision</th><th>National-brand reality</th><th>Proposed change</th><th>What would prove it</th></tr></thead><tbody>{proposal.changes.map(row=><tr key={row[0]}>{row.map((value,i)=>i===0?<th scope="row" key={i}>{value}</th>:<td key={i}>{value}</td>)}</tr>)}</tbody></table></div><div className="wl-development-rationale"><h4>Why investigate</h4><p>{proposal.why}</p><h4>Distinctive design direction</h4><p>{proposal.recommendation}</p><h4>Target baseline</h4><p>{proposal.targetBaseline}</p></div></section>}
   {tab==='specs'&&<Specifications proposal={proposal} unit={unit} setUnit={setUnit}/>}
   {tab==='cost'&&<Pricing proposal={proposal} scenario={scenario} setScenario={setScenario} color={color} result={result}/>}
   {tab==='validation'&&<section aria-label="Development validation gates"><h3>Prove the proposal before release.</h3><p>{proposal.pilot}</p><ol className="wl-validation-list">{proposal.validation.map(v=><li key={v.gate}><div><h4>{v.gate}</h4><span>{v.status}</span></div><p>{v.test}</p></li>)}</ol><p className="wl-task-note"><b>Stop condition:</b> {proposal.killCriterion}</p><p>{proposal.special}</p><p>{library.colorNote}</p></section>}
  </div>
 </div>;
}

export function WhiteLabelWorkshop({catalog,onOpen,onCompare,selected,conceptId,setConceptId}){
 const proposal=library.concepts.find(p=>p.id===conceptId)||library.concepts[0];
 return <section className="wl-workshop" aria-label="White Label Workshop"><div className="wl-intro"><p className="eyebrow">White Label Workshop</p><h2>From benchmark to better product.</h2><p>Compare national brands. Develop a distinct proposal.</p></div><p className="wl-stage-note">12 concept proposals · 11 manufacturer references · A0 design studies. Dimensions, BOM costs and retail prices are planning targets; production engineering, supplier quotations and current Target checks remain open.</p><label className="wl-concept-select">Product concept<select aria-label="Workshop product concept" value={proposal.id} onChange={e=>setConceptId(e.target.value)}>{library.concepts.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label><WorkshopDetail key={proposal.id} proposal={proposal} catalog={catalog} onOpen={onOpen} onCompare={onCompare} selected={selected}/></section>;
}
