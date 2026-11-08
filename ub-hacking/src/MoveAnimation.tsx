import type { CSSProperties } from 'react';
import type { MoveMotion } from '../shared/motion';
import { Piece } from './Piece';
import './motion.css';

export function MoveAnimation({move,squares}:{move:MoveMotion;squares:string[]}){
 function position(from:string,to=from):CSSProperties{
  const a=squares.indexOf(from),b=squares.indexOf(to);
  return {left:`${a%8*12.5}%`,top:`${Math.floor(a/8)*12.5}%`,
   '--dx':`${(b%8-a%8)*100}%`,'--dy':`${(Math.floor(b/8)-Math.floor(a/8))*100}%`,
   '--duration':`${move.duration}ms`} as CSSProperties;
 }
 const style=position(move.dragged?move.to:move.from,move.to);
 return <div className="move-stage" aria-hidden="true">
  {move.captured&&<div className={`motion-cell captured-ghost ${move.enPassant?'vanishing-pawn':''}`} style={position(move.captureSquare)}><Piece type={move.captured} color={move.color==='w'?'b':'w'}/></div>}
  {move.rook&&<div className="motion-cell moving-piece escort" style={position(move.rook.from,move.rook.to)}><div className="motion-body"><Piece type="r" color={move.color}/></div></div>}
  <div className={`motion-cell moving-piece ${move.dragged?'drop-settle':move.piece==='n'?'knight-hop':''} ${move.escape?'king-dash':''} ${move.promotion?'promoting':''}`} style={style}>
   <div className="motion-body"><Piece type={move.piece} color={move.color}/></div>
   {move.promotion&&<div className="promoted-body"><Piece type={move.promotion} color={move.color}/></div>}
  </div>
  <div className={`motion-cell landing-ring ${move.promotion?'promotion-aura':''}`} style={position(move.to)}><span/></div>
 </div>;
}
