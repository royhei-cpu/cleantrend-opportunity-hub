import React, { useEffect, useRef, useState } from 'react';
import { createAudioEngine, clampVolume } from './audio-engine.js';

const storageKey = 'cleantrend-sound-settings-v1';
function Icon({ kind }) {
  const paths = { music: <><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>, settings: <><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="5"/></>, volume: <><path d="M11 5 6 9H3v6h3l5 4V5m5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>, muted: <><path d="M11 5 6 9H3v6h3l5 4V5m5 4 6 6m0-6-6 6"/></>, play: <path d="m8 5 11 7-11 7V5Z"/>, pause: <><path d="M8 5v14M16 5v14"/></>, close: <path d="m6 6 12 12M18 6 6 18"/> };
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export function AudioControls() {
  const [open,setOpen] = useState(false);
  const [music,setMusic] = useState(false);
  const [effects,setEffects] = useState(true);
  const [muted,setMuted] = useState(false);
  const [volume,setVolume] = useState(0.2);
  const [available,setAvailable] = useState(true);
  const [message,setMessage] = useState('');
  const engine = useRef(null), settings = useRef({ effects:true, muted:false, volume:0.2, music:false });
  const root = useRef(null), settingsButton = useRef(null), closeButton = useRef(null), operation = useRef(0);
  settings.current = { effects, muted, volume, music };

  function save(next) { try { window.localStorage.setItem(storageKey, JSON.stringify({ ...settings.current, ...next, music:undefined })); } catch { /* Sound remains usable without storage. */ } }
  function getEngine() {
    if (!engine.current) {
      const Context = window.AudioContext || window.webkitAudioContext;
      engine.current = createAudioEngine({ Context });
      engine.current.setVolume(settings.current.volume); engine.current.setMuted(settings.current.muted);
    }
    return engine.current;
  }
  function failed() { setMessage('Audio could not start. Try Play music again.'); }
  async function toggleMusic() {
    const ticket = ++operation.current;
    if (music) { engine.current?.stopMusic(); setMusic(false); return; }
    try {
      if (muted) { engine.current?.setMuted(false); setMuted(false); save({muted:false}); settings.current.muted=false; }
      const started = await getEngine().startMusic();
      if (ticket !== operation.current) { engine.current?.stopMusic(); return; }
      if (started) { setMusic(true); setMessage(''); } else failed();
    } catch { failed(); }
  }
  function toggleMute() {
    const next=!muted; engine.current?.setMuted(next);setMuted(next);save({muted:next});
    if (!next && settings.current.music && !document.hidden) void engine.current?.startMusic().catch(failed);
  }
  function changeVolume(value) {
    const next=clampVolume(Number(value)/100);setVolume(next);engine.current?.setVolume(next);save({volume:next});
  }
  function toggleEffects() {
    const next=!effects;setEffects(next);save({effects:next});
    if (next && !muted) { try { void getEngine().click().catch(failed); } catch { failed(); } }
  }

  useEffect(()=>{
    setAvailable(Boolean(window.AudioContext || window.webkitAudioContext));
    try {
      const saved=JSON.parse(window.localStorage.getItem(storageKey)||'null');
      if(saved) {setEffects(saved.effects!==false);setMuted(saved.muted===true);setVolume(saved.volume===undefined?0.2:clampVolume(saved.volume));}
    } catch { /* Corrupt or blocked storage uses calm defaults. */ }
    const click=event=>{
      const element=event.target?.closest?.('button, summary, a, [role="button"]');
      if(!element || element.disabled || element.getAttribute('aria-disabled')==='true' || element.closest('.sound-control') || !settings.current.effects || settings.current.muted)return;
      try { void getEngine().click().catch(failed); } catch { setAvailable(false); }
    };
    const visibility=()=>{
      ++operation.current;
      if(document.hidden) { void engine.current?.hide().catch(()=>{}); }
      else if(settings.current.music && !settings.current.muted) { void engine.current?.startMusic().catch(failed); }
    };
    document.addEventListener?.('click',click,true);
    document.addEventListener?.('visibilitychange',visibility);
    return ()=>{++operation.current;document.removeEventListener?.('click',click,true);document.removeEventListener?.('visibilitychange',visibility);void engine.current?.dispose().catch(()=>{});engine.current=null;};
  },[]);

  useEffect(()=>{
    if(!open)return;
    closeButton.current?.focus();
    const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};
    const key=event=>{if(event.key==='Escape'){setOpen(false);settingsButton.current?.focus();}};
    document.addEventListener?.('pointerdown',outside);document.addEventListener?.('keydown',key);
    return ()=>{document.removeEventListener?.('pointerdown',outside);document.removeEventListener?.('keydown',key);};
  },[open]);

  return <div className="sound-control" ref={root}>
    {open&&<section className="sound-panel" role="dialog" aria-modal="false" aria-label="Sound & atmosphere">
      <div className="sound-panel-title"><h2>Sound & atmosphere</h2><button ref={closeButton} onClick={()=>{setOpen(false);settingsButton.current?.focus();}} aria-label="Close sound settings"><Icon kind="close"/></button></div>
      <button className="sound-play" onClick={toggleMusic} disabled={!available} aria-pressed={music}><Icon kind={music?'pause':'play'}/>{music?'Pause music':'Play music'}</button>
      <label className="sound-volume">Music volume <span>{Math.round(volume*100)}%</span><input type="range" min="0" max="100" value={Math.round(volume*100)} onChange={e=>changeVolume(e.target.value)}/></label>
      <div className="sound-setting"><span>Button sounds</span><button role="switch" aria-checked={effects} aria-label="Button sounds" onClick={toggleEffects} disabled={!available}><span/></button></div>
      <div className="sound-setting"><span>Mute all audio</span><button role="switch" aria-checked={muted} aria-label="Mute all audio" onClick={toggleMute}><span/></button></div>
      <p>Gentle ambient tones for a calmer research session.</p><small>Music starts when you press play. Your volume and sound preferences stay in this browser.</small>
      {!available&&<p role="status">Audio is unavailable in this browser.</p>}{message&&<p role="status">{message}</p>}
    </section>}
    <div className="sound-capsule"><button onClick={toggleMusic} disabled={!available} aria-label={music?'Pause background music':'Play background music'} aria-pressed={music}><Icon kind={music?'pause':'music'}/><span>{music?'Music on':'Music off'}</span>{music&&!muted&&<i className="sound-playing" aria-hidden="true"/>}</button><button onClick={toggleMute} aria-label={muted?'Unmute all audio':'Mute all audio'} aria-pressed={muted}><Icon kind={muted?'muted':'volume'}/></button><button ref={settingsButton} aria-label="Sound settings" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Icon kind="settings"/></button></div>
  </div>;
}
