import type { Color } from '../shared/types';
export function Piece({type,color}:{type:string;color:Color}) {
 const shapes:Record<string,React.ReactNode>={
  p:<><circle cx="22.5" cy="12" r="5"/><path d="M18 17c-3 4-3 8 1 10l-3 8h13l-3-8c4-2 4-6 1-10Z"/><path d="M13 36h19v4H13Z"/></>,
  r:<><path d="M12 7h5v5h4V7h4v5h4V7h5v11l-5 4v10l4 4v4H12v-4l4-4V22l-4-4Z"/><path d="M16 20h13M16 32h13"/></>,
  n:<><path d="m12 35 3-7 9-7-4-3-5 6-7-2 3-10 7-5 2-4 4 4c12 2 12 15 10 28Z"/><path d="m12 36-1 4h25l-1-4ZM19 11l-3 3"/><circle cx="22" cy="12" r="1" fill="currentColor"/></>,
  b:<><path d="M22.5 5c-8 5-12 13-5 18h10c7-5 3-13-5-18Z"/><path d="m23 10-4 6m-2 8h11l-3 7 6 4H14l6-4ZM12 36h21v4H12Z"/><circle cx="22.5" cy="4" r="2"/></>,
  q:<><path d="m10 13 5 19h15l5-19-8 9-4.5-12-4.5 12Z"/><circle cx="9" cy="10" r="3"/><circle cx="22.5" cy="7" r="3"/><circle cx="36" cy="10" r="3"/><path d="M14 33h17l3 7H11ZM16 28h13"/></>,
  k:<><path d="M22.5 3v10m-4-6h8"/><path d="M22.5 16c-6-11-19-1-10 9l4 6h13l4-6c9-10-4-20-10.5-9Z"/><path d="M16 32h13l5 8H11ZM17 35h11M22.5 16v13"/></>,
 };
 return <svg className={`piece ${color}`} viewBox="0 0 45 45" aria-hidden="true" style={{color:color==='w'?'#272b25':'#d6ddca'}}><g fill={color==='w'?'#fff9e9':'#252a24'} stroke={color==='w'?'#403f33':'#ced6bf'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{shapes[type]}</g></svg>;
}
