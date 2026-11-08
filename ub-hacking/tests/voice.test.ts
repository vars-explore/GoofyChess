import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { resolveVoiceMove } from '../src/voice';

test('voice move resolves a spoken piece and destination square',()=>{
 const result=resolveVoiceMove(new Chess(),'pawn e4');
 assert.deepEqual(result.move,{from:'e2',to:'e4',promotion:undefined});
});

test('voice move accepts spoken square names and explicit source squares',()=>{
 const result=resolveVoiceMove(new Chess(),'knight g one f three');
 assert.deepEqual(result.move,{from:'g1',to:'f3',promotion:undefined});
});

test('voice move accepts SAN and castling commands',()=>{
 assert.equal(resolveVoiceMove(new Chess(),'knight f3').move?.to,'f3');
 const castle=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
 assert.deepEqual(resolveVoiceMove(castle,'castle king side').move,{from:'e1',to:'g1',promotion:undefined});
});

test('voice move rejects illegal and ambiguous commands instead of guessing',()=>{
 const start=new Chess();
 assert.match(resolveVoiceMove(start,'pawn e5').error||'',/not legal/);
 const position=new Chess('1k6/8/8/8/8/2N1N3/8/4K3 w - - 0 1');
 assert.match(resolveVoiceMove(position,'knight d5').error||'',/more than one/);
 assert.deepEqual(resolveVoiceMove(position,'knight c3 d5').move,{from:'c3',to:'d5',promotion:undefined});
});
