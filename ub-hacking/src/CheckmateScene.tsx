import { useEffect,useRef } from 'react';
import { reactionSound,stopReactionSound } from './audio';
// Original animated vector anime duel. Player names remain escaped React text.
function Fighter({rival=false}:{rival?:boolean}){
 return <svg viewBox="0 0 400 500" aria-hidden="true" className={rival?'fighter rival':'fighter'}><g stroke="#121522" strokeWidth="5" strokeLinejoin="round">
  <path d="M55 500 90 340 165 305 235 305 320 350 355 500" fill={rival?'#7d233d':'#e9eee8'}/><path d="M165 285v60l35 32 35-32v-60" fill="#ddb292"/>
  <path d="m120 122 160-5 15 125-45 70-50 21-57-36-34-66Z" fill="#f4d1ae"/>
  <path d="m129 230 17 62 54 34 50-17 28-42-43 28-34-11-22-45Z" fill="#d8a789" stroke="none"/>
  <path d="m100 199-32-35 22-44-16-42 48 12 1-52 44 26 26-58 29 52 55-35-3 55 51-6-20 50 28 40-39 56-8-61-32 28-7-63-39 59-9-67-36 62-12-31-17 50Z" fill={rival?'#171a32':'#dce9fa'}/>
  <path d="m145 205 40 8-12 15-25-6m66-8 42-17-10 24-26 8" fill="white"/>
  <path d="m163 212 5 12m65-14 2 13" stroke={rival?'#f45e85':'#14bad9'} strokeWidth="9"/>
  <path d="m142 194 44 9m28-4 45-14m-59 41-9 26 13 3m-24 20 40-2" fill="none"/>
  <path d="m90 345 65-28 45 66 48-68 70 35-45 72H132Z" fill={rival?'#24233e':'#28394d'}/>
  <path d="m146 324 22 150m78-150-19 150" stroke={rival?'#ed5d79':'#b5f8ff'} strokeWidth="8"/>
  <path d="m310 500-31-90 31-11 42 101" fill="#1c2434"/><path d="m277 408 55-216 19-25-25 243" fill="#eefaff"/><path d="m259 412 80 15" stroke="#cbb985" strokeWidth="12"/>
 </g></svg>;
}
export function CheckmateScene({winner,loser,reduced,onClose}:{winner:string;loser:string;reduced:boolean;onClose:()=>void}){
 const closeRef=useRef(onClose);closeRef.current=onClose;
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const prior=document.activeElement as HTMLElement|null;button.current?.focus();
  reactionSound('slash',1200);
  const impact=setTimeout(()=>reactionSound('boom',1600),reduced?100:1500);
  const end=setTimeout(()=>closeRef.current(),reduced?3000:6200);
  const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){e.preventDefault();button.current?.focus();}};
  document.addEventListener('keydown',keyboard);
  return()=>{clearTimeout(impact);clearTimeout(end);stopReactionSound();document.removeEventListener('keydown',keyboard);prior?.focus();};
 },[reduced]);
 return <div className={`checkmate-scene ${reduced?'still':''}`} role="dialog" aria-modal="true" aria-label={`Checkmate. ${winner} defeats ${loser}.`}>
  <div className="anime-grain"/><div className="speed-lines"/>
  <div className="anime-panel hero-panel"><Fighter/><div className="fighter-name"><small>THE FINAL MOVE</small><strong>{winner}</strong></div></div>
  <div className="anime-panel rival-panel"><Fighter rival/><div className="fighter-name"><small>NO ESCAPE</small><strong>{loser}</strong></div></div>
  <div className="anime-versus">VS</div><div className="anime-slash"/>
  <div className="anime-verdict"><span>THE KING HAS FALLEN</span><h2>CHECK<span>MATE</span></h2><p><strong>{winner}</strong> defeats <strong>{loser}</strong></p><small>One board. One survivor.</small></div>
  <button ref={button} className="skip-scene" onClick={onClose}>Back to the board &rarr;</button>
 </div>;
}
