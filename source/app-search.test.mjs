import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const temp=await mkdtemp(path.join(dir,'.search-screen-test-'));
await build({entryPoints:[path.join(dir,'catalog-app.js')],bundle:true,packages:'external',platform:'node',format:'esm',outfile:path.join(temp,'app.mjs'),logLevel:'silent'});
const {default:App}=await import(pathToFileURL(path.join(temp,'app.mjs')));
await rm(temp,{recursive:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const text=node=>typeof node==='string'||typeof node==='number'?String(node):(node?.children||[]).map(text).join('');
test('The actual search screen opens URL results and preserves the query while revealing filtered Target matches',async()=>{
 globalThis.window={location:{search:'?q=sponge%20cloth'},localStorage:{getItem:()=>null},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 2;},clearTimeout(){}};
 globalThis.document={getElementById:()=>({scrollIntoView(){}})};
 let screen;
 const click=async label=>{await act(async()=>{const button=screen.root.findAllByType('button').find(b=>text(b)===label);assert.ok(button,label);button.props.onClick();});};
 const search=()=>screen.root.findByProps({'aria-label':'Search products'});
 const cards=()=>screen.root.findAllByProps({className:'product-card'});
 try {
  await act(async()=>{screen=create(React.createElement(App));});
  assert.equal(search().props.value,'sponge cloth');
  assert.equal(cards().length,13);
  const needsButton=screen.root.findAllByType('button').find(b=>text(b).startsWith('Needs Target check ·'));
  await act(async()=>needsButton.props.onClick());
  assert.equal(search().props.value,'sponge cloth');
  assert.equal(cards().length,8);
  assert.match(text(screen.toJSON()),/5 are hidden by your current filters/);
  await act(async()=>search().props.onChange({target:{value:'Everspring sponge cloth'}}));
  assert.equal(cards().length,0);
  await click('Show all 1 matches');
  assert.equal(search().props.value,'Everspring sponge cloth');
  assert.equal(cards().length,1);
  await act(async()=>search().props.onChange({target:{value:'Swedish dishcloth'}}));
  assert.equal(cards().length,12);
  assert.ok(cards().every(card=>!text(card).includes('Libman')));
 } finally {
  if(screen)await act(async()=>screen.unmount());
  delete globalThis.window;
  delete globalThis.document;
 }
});
