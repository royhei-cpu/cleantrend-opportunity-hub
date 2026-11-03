import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const temp=await mkdtemp(path.join(dir,'.homecare-test-'));
await build({entryPoints:[path.join(dir,'catalog-app.js')],bundle:true,packages:'external',platform:'node',format:'esm',outfile:path.join(temp,'app.mjs'),logLevel:'silent'});
const {default:App}=await import(pathToFileURL(path.join(temp,'app.mjs')));await rm(temp,{recursive:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const text=node=>typeof node==='string'||typeof node==='number'?String(node):(node?.children||[]).map(text).join('');

test('The Homecare interface has three direct routes, progressive disclosure and preserved catalog access',async()=>{
 const saved=new Map();
 globalThis.window={location:{search:''},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 2;},clearTimeout(){},requestAnimationFrame:fn=>fn()};
 const listeners=new Map();
 globalThis.document={hidden:false,getElementById:()=>({scrollIntoView(){}}),addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 let screen;
 const click=async label=>{const button=screen.root.findAllByType('button').find(b=>text(b)===label);assert.ok(button,label);await act(async()=>button.props.onClick());};
 try {
  await act(async()=>{screen=create(React.createElement(App));});
  assert.ok(text(screen.toJSON()).includes('Homecare Atlas'));
  assert.equal(screen.root.findByProps({className:'catalog-library'}).props.open,false);
  assert.equal(screen.root.findByProps({className:'world-nav'}).findAllByType('button').length,3);
  assert.equal(screen.root.findAllByProps({className:'world-opportunity'}).length,6);
  await click('Retailers');assert.equal(screen.root.findAllByProps({'aria-label':'Global retailer discovery'}).length,1);
  await click('All products');assert.equal(screen.root.findByProps({className:'catalog-library'}).props.open,true);
  assert.equal(screen.root.findAllByProps({className:'product-card'}).length,36);
  await click('Opportunities');assert.equal(screen.root.findByProps({className:'catalog-library'}).props.open,false);
  await click('Show 6 more opportunities ↓');assert.equal(screen.root.findAllByProps({className:'world-opportunity'}).length,12);
  await act(async()=>screen.root.findByProps({'aria-label':'Sound settings'}).props.onClick());
  const panel=screen.root.findByProps({'aria-label':'Sound & atmosphere'});
  assert.equal(panel.props.role,'dialog');
  assert.ok(text(panel).includes('Audio is unavailable in this browser.'));
  await act(async()=>screen.root.findByProps({'aria-label':'Close sound settings'}).props.onClick());
  assert.equal(screen.root.findAllByProps({'aria-label':'Sound & atmosphere'}).length,0);
 }finally{if(screen)await act(async()=>screen.unmount());delete globalThis.window;delete globalThis.document;}
});

test('Sound controls play, pause, mute and retain preferences without autoplaying after reload',async()=>{
 const saved=new Map(),contexts=[];
 const param=()=>({value:0,targets:[],setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(v){this.targets.push(v);}});
 class Context {
  constructor(){this.state='suspended';this.currentTime=1;this.destination={};this.gains=[];this.voices=[];contexts.push(this);}
  createGain(){const node={gain:param(),connect(){},disconnect(){}};this.gains.push(node);return node;}
  createBiquadFilter(){return {frequency:param(),connect(){}};}
  createOscillator(){const node={frequency:param(),connect(){},disconnect(){},start(){},stop(){}};this.voices.push(node);return node;}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
 }
 globalThis.window={AudioContext:Context,location:{search:''},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 2;},clearTimeout(){}};
 globalThis.document={hidden:false,getElementById:()=>({scrollIntoView(){}}),addEventListener(){},removeEventListener(){}};
 let screen;
 const invoke=async(label,role)=>{await act(async()=>screen.root.findByProps({'aria-label':label,...(role?{role}:{})}).props.onClick());};
 try{
  await act(async()=>{screen=create(React.createElement(App));});
  assert.equal(contexts.length,0);
  await invoke('Play background music');assert.equal(contexts.length,1);assert.equal(contexts[0].state,'running');assert.equal(contexts[0].voices.length,5);
  await invoke('Sound settings');
  const slider=screen.root.findByProps({type:'range'});
  await act(async()=>slider.props.onChange({target:{value:'35'}}));
  await invoke('Mute all audio','switch');
  assert.equal(screen.root.findByProps({role:'switch','aria-label':'Mute all audio'}).props['aria-checked'],true);
  assert.ok(contexts[0].gains[0].gain.targets.includes(0));
  await invoke('Button sounds');
  assert.equal(screen.root.findByProps({role:'switch','aria-label':'Button sounds'}).props['aria-checked'],false);
  const preferences=JSON.parse(saved.get('cleantrend-sound-settings-v1'));
  assert.equal(preferences.volume,0.35);assert.equal(preferences.effects,false);assert.equal(preferences.muted,true);assert.equal('music' in preferences,false);
  await invoke('Pause background music');
  await act(async()=>screen.unmount());assert.equal(contexts[0].state,'closed');
  await act(async()=>{screen=create(React.createElement(App));});
  assert.equal(contexts.length,1);
  assert.equal(screen.root.findByProps({'aria-label':'Play background music'}).props['aria-pressed'],false);
  await invoke('Sound settings');assert.equal(screen.root.findByProps({type:'range'}).props.value,35);
  assert.equal(screen.root.findByProps({role:'switch','aria-label':'Button sounds'}).props['aria-checked'],false);
 }finally{if(screen)await act(async()=>screen.unmount());delete globalThis.window;delete globalThis.document;}
});
