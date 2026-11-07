import type { Snapshot } from './types';
export function isNewMove(previous:Snapshot|null,next:Snapshot){
 return !!previous&&previous.gameId===next.gameId&&next.version===previous.version+1&&next.history.length===previous.history.length+1;
}
export function checkmateNames(state:Snapshot){
 if(!state.result?.endsWith('wins by checkmate'))return null;
 const winner=state.turn==='w'?'b':'w',loser=state.turn;
 return {winner:state.players[winner]?.name||(winner==='w'?'White':'Black'),loser:state.players[loser]?.name||(loser==='w'?'White':'Black'),color:winner};
}
