import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {createHash} from 'node:crypto';
import {prepareModel} from './workshop-viewer.js';
import {workshopLibrary as library,defaultScenario,costScenario,bomCSV,configuredBriefHTML,benchmarkPrice,envelopeText} from './workshop-logic.js';
import research from './global-research.json' with {type:'json'};
import assetManifest from './workshop-assets.json' with {type:'json'};
const dir=path.dirname(fileURLToPath(import.meta.url)),assets=path.join(dir,'../assets/workshop');

test('Every opportunity has a distinct, explicitly proposed engineering pack with real manufacturer benchmarks',()=>{
 assert.equal(library.concepts.length,12);assert.equal(library.benchmarks.length,11);
 assert.deepEqual(new Set(library.concepts.map(p=>p.id)),new Set(research.opportunities.map(p=>p.id)));
 assert.equal(new Set(library.concepts.map(p=>p.code)).size,12);
 for(const p of library.concepts){
  assert.equal(p.revision,'A0');assert.match(p.status,/not production released/);assert.match(p.quoteStatus,/No supplier/);
  assert.ok(p.envelope.every(v=>Number.isFinite(v)&&v>0));assert.ok(p.parts.length>=5);assert.ok(p.specs.length>=5);assert.equal(p.validation.length,6);
  assert.ok(p.mass>=p.parts.reduce((n,row)=>n+row.massG*row.qty,0));
  for(const id of p.benchmarks)assert.ok(library.benchmarks.some(b=>b.id===id));
  assert.equal(p.benchmarks.length,2);assert.equal(p.dutyPercent,null);
  assert.ok(p.parts.every(row=>row.qty>0&&row.unitLow>=0&&row.unitHigh>=row.unitLow));
 }
 assert.match(benchmarkPrice(library.benchmarks.find(b=>b.id==='jj-system')),/£73/);
 assert.equal(envelopeText([25.4,50.8,76.2],'in'),'1.00 × 2.00 × 3.00 in');
});

test('Pricing follows a transparent full-kit calculation and never fills an unknown duty rate with zero',()=>{
 const p={parts:[{code:'p',qty:2,unitLow:1,unitHigh:3}],planningVolume:1000,retail:20,tooling:1000,assembly:1,pack:.5,qa:.25,scrapPercent:10,supplierMargin:20,retailMargin:45,freight:.5,moq:500};
 const s=defaultScenario(p),color={delta:.03};
 assert.equal(costScenario(p,s,color).landed,null);
 s.duty='10';const c=costScenario(p,s,color);
 for(const [key,value] of Object.entries({components:4,scrap:.4,amortization:1,factory:7.18,fob:8.975,landed:10.3725,ceiling:11,headroom:.6275}))assert.ok(Math.abs(c[key]-value)<1e-8,key);
 for(const [key,value] of [['volume','0'],['volume','10.5'],['supplierMargin','100'],['retailMargin','-2'],['assembly',''],['tooling','Infinity']])assert.equal(costScenario(p,{...s,[key]:value},color).valid,false,key);
 assert.equal(costScenario(p,{...s,partCosts:{p:'-1'}},color).valid,false);
 assert.equal(costScenario(p,{...s,duty:'-1'},color).landed,null);
 assert.match(costScenario(p,{...s,duty:'101'},color).dutyError,/0–100/);
 assert.equal(costScenario(p,{...s,volume:'100'},color).belowMoq,true);
});

test('Configured exports retain chosen costs, source currencies and nonmanufacturing status and escape markup',()=>{
 const p=library.concepts[0],s=defaultScenario(p),color=library.palette[2];s.duty='12';
 const csv=bomCSV(p,s,color),html=configuredBriefHTML({...p,name:'<script>alert(1)</script>'},s,color,'https://example.com/');
 assert.match(csv,/White Label Workshop/);assert.match(csv,/Clay/);assert.match(csv,/No supplier quotations/);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.ok(!html.includes('<script>'));assert.match(html,/£73/);assert.match(html,/Clay/);assert.match(html,/Sage/);assert.match(html,/not manufacturing drawings/);
 assert.match(html,/cleantech-6-piece-cleaning-tool-set-stone/);
});

test('All Blender models parse as real GLB geometry with the stated primary dimensions; color and explode work reversibly',async()=>{
 for(const p of library.concepts){
  const bytes=await readFile(path.join(assets,p.id+'.glb'));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const model=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
  let primary;model.traverse(o=>{if(o.userData.role==='primaryAssembly')primary=o;});assert.ok(primary,p.id);
  const codes=new Set();model.traverse(o=>{if(o.userData.partCode)codes.add(o.userData.partCode);});assert.ok(codes.size>1,p.id+' has separable component groups');
  const size=new Box3().setFromObject(primary).getSize(new Vector3()).multiplyScalar(1000);
  for(const [actual,expected] of [[size.x,p.envelope[0]],[size.y,p.envelope[2]],[size.z,p.envelope[1]]])assert.ok(Math.abs(actual-expected)<.15,p.id+' dimensions');
  const prepared=prepareModel(model),before=prepared.bounds();prepared.setColor('#24463d');let count=0;
  model.traverse(o=>{if(o.isMesh&&o.material.name.startsWith('HA_body')){assert.equal(o.material.color.getHexString(),'24463d');count++;}});assert.ok(count>0);
  prepared.explode(true);const changed=prepared.bounds();assert.ok(changed.min.distanceTo(before.min)>1e-5||changed.max.distanceTo(before.max)>1e-5,p.id+' exploded');
  prepared.explode(false);const restored=prepared.bounds();assert.ok(restored.min.distanceTo(before.min)<1e-6);assert.ok(restored.max.distanceTo(before.max)<1e-6);prepared.dispose();
 }
});

test('All 12 download packs and their source assets match the checked artifact hashes',async()=>{
 assert.equal(assetManifest.concepts.length,12);assert.equal(assetManifest.files.length,84);
 for(const p of library.concepts){const a=assetManifest.concepts.find(a=>a.id===p.id);assert.deepEqual(a.primaryDimensionsMm,p.envelope);assert.equal(a.archiveEntries,11);}
 for(const file of assetManifest.files){
  const content=await readFile(path.join(dir,'..',file.path));assert.equal(content.length,file.bytes,file.path);assert.equal(createHash('sha256').update(content).digest('hex'),file.sha256,file.path);
  if(file.path.endsWith('.zip'))assert.equal(content.readUInt32LE(0),0x04034b50);
 }
});

const temp=await mkdtemp(path.join(dir,'.workshop-test-'));
await build({entryPoints:[path.join(dir,'catalog-app.js')],bundle:true,packages:'external',platform:'node',format:'esm',outfile:path.join(temp,'app.mjs'),logLevel:'silent'});
const {default:App}=await import(pathToFileURL(path.join(temp,'app.mjs')));await rm(temp,{recursive:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const text=node=>typeof node==='string'||typeof node==='number'?String(node):(node?.children||[]).map(text).join('');
function browser(search=''){
 globalThis.window={location:{search},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 2;},clearTimeout(){},requestAnimationFrame:fn=>fn()};
 globalThis.document={hidden:false,getElementById:()=>({scrollIntoView(){}}),addEventListener(){},removeEventListener(){}};
}

test('White Label Workshop deep links expose real packs, national brands, all 12 concepts and editable pricing',async()=>{
 browser('?view=workshop&concept=refill');let screen;
 const click=async label=>{const button=screen.root.findAllByType('button').find(b=>text(b)===label);assert.ok(button,label);await act(async()=>button.props.onClick());};
 try{
  await act(async()=>{screen=create(React.createElement(App));});
  const workshop=screen.root.findByProps({'aria-label':'White Label Workshop'});assert.ok(workshop);
  assert.equal(screen.root.findByProps({'aria-label':'Workshop product concept'}).props.value,'refill');
  assert.equal(screen.root.findByProps({'aria-label':'Workshop product concept'}).findAllByType('option').length,12);
  assert.match(text(screen.root.findByProps({'aria-label':'Recommended national-brand benchmarks'})),/Blueland/);
  const pack=screen.root.findAllByType('a').find(a=>text(a)==='Download development pack ↓');assert.match(pack.props.href,/refill-development-pack\.zip$/);
  await click('Specifications');assert.match(text(screen.root.findByProps({'aria-label':'Proposed technical specifications'})),/500 mL/);
  await act(async()=>screen.root.findByProps({'aria-label':'Envelope units'}).props.onChange({target:{value:'in'}}));assert.match(text(screen.root.findByProps({className:'wl-envelope'})),/3\.54 × 2\.56 × 9\.65 in/);
  await click('BOM & pricing');assert.match(text(screen.root.findByProps({className:'wl-cost-results'})),/Enter duty rate/);
  await act(async()=>screen.root.findByProps({'aria-label':'Duty rate % — enter after origin review'}).props.onChange({target:{value:'10'}}));
  assert.ok(!text(screen.root.findByProps({className:'wl-cost-results'})).includes('Enter duty rate'));
  const unitCost=screen.root.findByProps({'aria-label':'HA-03-01 unit cost USD'});await act(async()=>unitCost.props.onChange({target:{value:'-1'}}));assert.match(text(screen.root.findByProps({role:'alert'})),/nonnegative/);
  await click('Validation');assert.match(text(screen.root.findByProps({'aria-label':'Development validation gates'})),/Needs current Target check/);
  await act(async()=>screen.root.findByProps({'aria-label':'Workshop product concept'}).props.onChange({target:{value:'compact'}}));
  assert.match(text(screen.root.findByProps({'aria-label':'Recommended national-brand benchmarks'})),/Joseph Joseph/);
  await act(async()=>screen.root.findByProps({'aria-label':'Choose Clay finish'}).props.onClick());assert.equal(screen.root.findByProps({'aria-label':'Choose Clay finish'}).props['aria-pressed'],true);
 }finally{if(screen)await act(async()=>screen.unmount());delete globalThis.window;delete globalThis.document;}
});

test('Each opportunity opens its matching design and costing workspace',async()=>{
 browser();let screen;
 try{
  await act(async()=>{screen=create(React.createElement(App));});
  const card=screen.root.findAllByProps({className:'world-opportunity'})[1],button=card.findAllByType('button').find(b=>text(b)==='Design & cost this concept');
  await act(async()=>button.props.onClick());
  assert.equal(screen.root.findByProps({'aria-label':'Workshop product concept'}).props.value,'easy-grip');
  assert.equal(screen.root.findByProps({id:'world-tab-workshop'}).props['aria-selected'],true);
 }finally{if(screen)await act(async()=>screen.unmount());delete globalThis.window;delete globalThis.document;}
});
