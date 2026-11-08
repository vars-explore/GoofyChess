// Original SVG effects keep captures instant and require no remote media.
export type Attack='gun'|'knife'|'fireball'|'cannon'|'beam';
export function attackFor(piece:string):Attack{
 return piece==='p'?'gun':piece==='n'||piece==='k'?'knife':piece==='q'?'fireball':piece==='r'?'cannon':'beam';
}
export function CombatEffect({attack}:{attack:Attack}){
 return <svg className={`combat-effect attack-${attack}`} viewBox="0 0 120 120" aria-hidden="true">
  {attack==='gun'||attack==='cannon'?<>
   <g className="weapon-recoil" fill="#293342" stroke="#e4ecf2" strokeWidth="2"><path d={attack==='gun'?'M18 53h55v15H48l-8 22H26l5-24H18Z':'M8 48h65v25H8Z'}/><path d="M28 53v15m8-15v15m8-15v15"/></g>
   <path className="muzzle-flash" d="m75 60 14-6-3-14 12 11 15-8-7 16 11 10-18-1-7 15-3-17Z" fill="#ffe88a" stroke="#ff8b31" strokeWidth="3"/>
   <path className="bullet-trail" d="M76 61h40" stroke="#fff2a6" strokeWidth="5"/>
  </>:attack==='knife'?<>
   <g className="knife-swipe" strokeLinejoin="round"><path d="m27 87 55-59 20-8-7 23-52 57Z" fill="#dffaff" stroke="#6d98aa" strokeWidth="3"/><path d="m19 87 22 18m-17-7-12 13" stroke="#d2a46b" strokeWidth="8"/></g>
   <path className="slash-arc" d="M18 90Q29 12 106 20Q52 39 18 90" fill="#c6f9ff"/>
  </>:attack==='fireball'?<g className="flame-orb">
   <path d="M101 61C101 19 56 23 10 10l24 31L5 39l27 27-18 13c52 22 87 20 87-18Z" fill="#f14c25"/>
   <path d="M93 60C90 37 62 43 35 29l14 27-17 8c31 23 63 24 61-4Z" fill="#ffb52e"/><circle cx="77" cy="61" r="16" fill="#fff0a1"/>
  </g>:<><path className="beam-ray" d="M8 60h104" stroke="#e2bcff" strokeWidth="15"/><path className="beam-ray" d="M8 60h104" stroke="white" strokeWidth="4"/></>}
  <circle className="combat-impact" cx="92" cy="60" r="22" fill="none" stroke={attack==='knife'?'#c5faff':'#ffcf71'} strokeWidth="5"/>
 </svg>;
}
