import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioEngine,clampVolume} from './audio-engine.js';

function harness({deferResume=false}={}) {
  let context,release;
  const param=()=>({value:0,calls:[],setValueAtTime(...a){this.calls.push(['value',...a]);},exponentialRampToValueAtTime(...a){this.calls.push(['ramp',...a]);},setTargetAtTime(...a){this.calls.push(['target',...a]);},cancelScheduledValues(...a){this.calls.push(['cancel',...a]);}});
  class Context {
    constructor(){context=this;this.currentTime=2;this.state='suspended';this.destination={};this.nodes=[];this.gains=[];}
    createGain(){const n={gain:param(),connect(){},disconnect(){}};this.gains.push(n);return n;}
    createBiquadFilter(){return {frequency:param(),connect(){},disconnect(){}};}
    createOscillator(){const n={frequency:param(),startCalls:[],stopCalls:[],connect(){},disconnect(){},start(at){this.startCalls.push(at);},stop(at){this.stopCalls.push(at);}};this.nodes.push(n);return n;}
    async resume(){if(deferResume)await new Promise(resolve=>{release=resolve;});if(this.state!=='closed')this.state='running';}
    async suspend(){this.state='suspended';}
    async close(){this.state='closed';}
  }
  const intervals=new Set();
  const timer={setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);}};
  const engine=createAudioEngine({Context,timer});
  return {engine,context,intervals,release:()=>release?.()};
}

test('Audio waits for interaction; mute suppresses click output and preferences clamp safely',async()=>{
 const {engine,context}=harness();
 assert.equal(context.nodes.length,0);
 assert.equal(context.state,'suspended');
 engine.setMuted(true);await engine.click();assert.equal(context.nodes.length,0);
 engine.setMuted(false);await engine.click();assert.equal(context.nodes.length,2);
 assert.equal(context.state,'running');
 assert.ok(context.nodes.every(n=>n.stopCalls[0]>n.startCalls[0]));
 await engine.dispose();assert.equal(context.state,'closed');
 assert.equal(clampVolume(-2),0);assert.equal(clampVolume(4),1);assert.equal(clampVolume('bad'),0);
});
test('Music starts one scheduler, adjusts gain, and releases every voice on pause/hide',async()=>{
 const {engine,context,intervals}=harness();
 assert.equal(await engine.startMusic(),true);assert.equal(intervals.size,1);assert.equal(context.nodes.length,5);
 await engine.startMusic();assert.equal(intervals.size,1);assert.equal(context.nodes.length,5);
 engine.setVolume(0.35);assert.ok(context.gains[1].gain.calls.some(c=>c[0]==='target'&&c[1]===0.35));
 engine.stopMusic();assert.equal(intervals.size,0);assert.ok(context.nodes.every(n=>n.stopCalls.length===2));
 await engine.startMusic();assert.equal(intervals.size,1);
 await engine.hide();assert.equal(intervals.size,0);assert.equal(context.state,'suspended');
 await engine.dispose();assert.equal(context.state,'closed');
});
test('Pausing or disposing during an audio-resume promise cannot restart music later',async()=>{
 const a=harness({deferResume:true});const pending=a.engine.startMusic();a.engine.stopMusic();a.release();
 assert.equal(await pending,false);assert.equal(a.intervals.size,0);assert.equal(a.context.nodes.length,0);await a.engine.dispose();
 const b=harness({deferResume:true});const waiting=b.engine.startMusic();await b.engine.dispose();b.release();
 assert.equal(await waiting,false);assert.equal(b.intervals.size,0);assert.equal(b.context.nodes.length,0);
});
test('Unsupported audio fails explicitly without affecting the research application',()=>{
 assert.throws(()=>createAudioEngine(),/unavailable/);
});
