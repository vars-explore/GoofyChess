import { Chess } from 'chess.js';
import { isNewMove } from './presentation';
import type { Snapshot } from './types';

export const MAX_MOVE_DURATION=650;

// Reconstruct only a consecutive, accepted move. Resumes and resets never animate.
export function describeMotion(previous:Snapshot|null,next:Snapshot,dragged=false){
 if(!previous||!isNewMove(previous,next))return null;
 try{
  const board=new Chess(previous.fen);
  const escaping=board.isCheck();
  const move=board.move(next.history.at(-1)!);
  if(board.fen()!==next.fen)return null;
  const castle=move.isKingsideCastle()||move.isQueensideCastle();
  const rank=move.color==='w'?'1':'8';
  const enPassant=move.isEnPassant();
  return {
   id:`${next.gameId}:${next.version}`,from:move.from,to:move.to,
   piece:move.piece,color:move.color,captured:move.captured,
   captureSquare:enPassant?move.to[0]+move.from[1]:move.to,
   promotion:move.promotion,enPassant,dragged,
   escape:escaping&&move.piece==='k',
   rook:castle?{from:(move.isKingsideCastle()?'h':'a')+rank,to:(move.isKingsideCastle()?'f':'d')+rank}:null,
   duration:dragged?180:move.promotion?MAX_MOVE_DURATION:enPassant?560:castle?480:move.piece==='n'?440:280,
  };
 }catch{return null;}
}
export type MoveMotion=NonNullable<ReturnType<typeof describeMotion>>;
