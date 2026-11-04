import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {workshopLibrary as library,defaultScenario,bomCSV,configuredBriefHTML} from '../source/workshop-logic.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for(const p of library.concepts){
 const dir=path.join(root,'workshop/generated',p.id);await mkdir(dir,{recursive:true});
 const scenario=defaultScenario(p),color=library.palette[0];
 const single={...library,concepts:[p],benchmarks:library.benchmarks.filter(b=>p.benchmarks.includes(b.id))};
 await writeFile(path.join(dir,'workshop-data.json'),JSON.stringify(single,null,2)+'\n');
 await writeFile(path.join(dir,p.id+'-BOM.csv'),bomCSV(p,scenario,color));
 let html=configuredBriefHTML(p,scenario,color,'');
 html=html.replace(` · <a href="${p.id}-development-pack.zip">Base A0 development pack</a>`,'');
 await writeFile(path.join(dir,p.id+'-specification.html'),html);
 await writeFile(path.join(dir,'README.txt'),`HOMECARE ATLAS — WHITE LABEL WORKSHOP\n${p.code} · ${p.name} · Revision A0\nAuthored ${library.authoredAt}\n\n${library.stage}\n\nOPEN THIS PACK\nOpen ${p.id}-specification.html in a browser; all studio images and the dimension reference are included locally. Print it to PDF if needed. The BOM is a spreadsheet-compatible CSV with formula-injection escaping.\nOpen ${p.id}.blend in Blender 5.2+ for the editable studio scene. Materials named HA_body control the main color. The GLB is a portable exterior design study with partCode metadata; studio lighting and procedural textures may differ. Source units are metres and proposed dimensions are millimetres.\n\nCOLOR OPTIONS\n${library.palette.map(c=>`${c.name}: ${c.hex} · assumed color allowance USD ${c.delta.toFixed(2)} per kit`).join('\n')}\n${library.colorNote}\n\nREBUILD\nblender -b --python blender_workshop.py -- --data workshop-data.json --out regenerated\n\nENGINEERING HANDOFF\nNo supplier quotations, approved formulas, production drawings, verified Target gaps or certified performance. Exterior dimensions do not resolve internal walls, interfaces, fasteners, mold splits, draft, sealing, assembly or tolerance stacks. The exploded website view is a design-review arrangement, not assembly instructions.\n\nBOM / PRICE BASIS\nUSD per finished kit. Component unit ranges, labor, packaging, QA, scrap, tooling and freight are engineering allowances. Duty is unknown; landed cost stays uncalculated until entered in the website. Supplier and retailer margins are planning assumptions, not Target requirements. Quantities, tool life, origin, MOQ, refill economics and service availability need supplier validation. The base pack contains default Sage assumptions. Save a configured brief and BOM from the website to retain your changed values.\n\nBENCHMARKS\n${single.benchmarks.map(b=>`${b.brand} — ${b.name}\n${b.url}\nReviewed ${b.reviewedAt}: ${b.access}\n${b.priceNote}`).join('\n\n')}\n\nNEXT\n${p.recommendation}\n${p.special}\nStop condition: ${p.killCriterion}\n`);
}
console.log('Prepared 12 offline specifications, BOMs and source-data sets');
