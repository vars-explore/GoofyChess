import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Game} from '../server/game';
import {describeMotion} from '../shared/motion';

function snapshots(fen:string|undefined,san:string){
 const board=new Chess(fen);
 const previous={...new Game('local').snapshot(),fen:board.fen(),history:[]};
 const move=board.move(san);
 const next={...previous,version:previous.version+1,fen:board.fen(),history:[move.san],last:{from:move.from,to:move.to}};
 return {previous,next,motion:describeMotion(previous,next)!};
}
test('ordinary moves and dragged moves have distinct animation timing',()=>{
 const {previous,next,motion}=snapshots(undefined,'e4');
 assert.equal(motion.piece,'p');assert.equal(motion.from,'e2');assert.equal(motion.to,'e4');
 assert.equal(motion.duration,280);assert.equal(describeMotion(previous,next,true)?.duration,180);
 assert.equal(snapshots(undefined,'Nf3').motion.duration,440);
});
test('castling animates the correct rook for both sides and both colors',()=>{
 for(const color of ['w','b'])for(const san of ['O-O','O-O-O']){
  const {motion}=snapshots(`r3k2r/8/8/8/8/8/8/R3K2R ${color} KQkq - 0 1`,san);
  const rank=color==='w'?'1':'8';
  assert.deepEqual(motion.rook,san==='O-O'?{from:'h'+rank,to:'f'+rank}:{from:'a'+rank,to:'d'+rank});
 }
});
test('en passant removes the pawn from its actual square, including black captures',()=>{
 const white=snapshots('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2','exd6').motion;
 assert.equal(white.enPassant,true);assert.equal(white.captureSquare,'d5');assert.equal(white.captured,'p');
 const black=snapshots('4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 2','exd3').motion;
 assert.equal(black.captureSquare,'d4');
});
test('capture promotions retain both the pawn and the chosen promoted piece',()=>{
 const {motion}=snapshots('1r6/P6k/8/8/8/8/8/4K3 w - - 0 1','axb8=N');
 assert.equal(motion.piece,'p');assert.equal(motion.promotion,'n');assert.equal(motion.captured,'r');
});
test('reconnects, repeated snapshots, resets and mismatched boards never replay a move',()=>{
 const {previous,next}=snapshots(undefined,'e4');
 assert.equal(describeMotion(null,next),null);assert.equal(describeMotion(next,next),null);
 assert.equal(describeMotion(previous,{...next,gameId:'reset'}),null);
 assert.equal(describeMotion(previous,{...next,fen:previous.fen}),null);
 assert.equal(describeMotion(previous,{...next,version:next.version+1}),null);
});

test('captures reserve time for combat, including dragged captures',()=>{
 const {previous,next,motion}=snapshots('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1','exd5');
 assert.equal(motion.duration,650);
 assert.equal(describeMotion(previous,next,true)?.duration,650);
 assert.equal(motion.captured,'p');
});
